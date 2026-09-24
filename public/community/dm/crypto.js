/* ────────────────────────────────────────────────────────────────
   dm/crypto.js — End-to-end encryption for member DMs
   ────────────────────────────────────────────────────────────────
   Design in one sentence: ECDH-P256 for key agreement, AES-GCM for
   message encryption, WebCrypto SubtleCrypto for everything (no
   third-party crypto libs — browser-native primitives only).

   Threat model:
   - Server (Supabase, Robin, whoever gets DB access) MUST NOT be
     able to READ message bodies. It sees only opaque ciphertext.
   - It CAN forge them. Nothing signs the ciphertext, so anyone who
     can write the table could replace a blob with one they
     encrypted to the recipient, and it would decrypt cleanly and
     look like it came from the named sender. Confidentiality yes,
     authenticity no. Fixing that means a long-term ECDSA key
     alongside the ECDH one; see D3 in docs/COMMUNITY-AUDIT.md.
   - Sender's device holds the sender's private key. Recipient's
     device holds the recipient's private key. Both are stored in
     IndexedDB (never localStorage — localStorage isn't wiped on
     "clear cookies" the way you'd hope).
   - The public half of each keypair is published to
     `profiles.dm_public_key` so anyone can encrypt to that member.
   - Each message uses an EPHEMERAL sender keypair whose public half
     is transmitted alongside the ciphertext. Forward secrecy: even
     if the sender's long-term private key later leaks, individual
     messages remain sealed because their ephemeral private key is
     never persisted.

   TWO COPIES PER MESSAGE (audit finding D1)
   ------------------------------------------
   The ephemeral private key is discarded after encrypting, so only
   the recipient can open `ciphertext`. The sender cannot — which
   would leave a conversation with no "sent" side at all. So every
   message is encrypted TWICE: once to the recipient, once to the
   sender's own public key. The second blob goes in
   `messages_e2e.ciphertext_self`. Use encryptForBoth(), not
   encryptTo(), for anything a member will want to read back.

   HISTORY IS DEVICE-BOUND, ON PURPOSE (audit finding D2)
   -------------------------------------------------------
   The private key lives in one browser's IndexedDB. There is no
   backup, no export and no multi-device sync — a decision, taken
   2026-09-24, not an omission. A member on a new device generates a
   new keypair and everything sent to the old one is unreadable
   forever. Nobody can recover it, including us. That is what E2E
   means.

   What we owe them is that the failure is LEGIBLE rather than
   silent. So each row records the fingerprint of the public key its
   blob was sealed to (`to_key_fp` / `self_key_fp`). Before
   attempting decryption the UI compares that against this device's
   fingerprint via keyFingerprint(); on a mismatch it says "sent to
   a previous device — unreadable here" instead of showing a broken
   message or an exception.

   Wire format (base64-encoded string, both ciphertext columns):
     b64( eph_pub_65 | iv_12 | aes_gcm_ciphertext )
   Where eph_pub_65 = uncompressed EC point (65 bytes for P-256).
   NOTE: earlier comments in supabase-messages-e2e.sql described
   this order reversed, and described dm_public_key as SPKI DER. It
   is a 65-byte raw point. Both were wrong; the code below is
   authoritative and the SQL has been corrected.

   IMPORTANT: this file is v1 scaffolding. Before shipping DMs to
   real members, an independent crypto review is warranted. The
   primitives are standard, but the code around them is where bugs
   hide.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const CURVE = 'P-256';
  const DB_NAME = 'fungai-dm-keys';
  const DB_STORE = 'keys';
  const KEY_ID = 'me';

  // Max plaintext that fits the messages_e2e size cap. The column is
  // CHECK (char_length(ciphertext) <= 8000) on base64 of
  // 65 + 12 + (plaintext + 16-byte GCM tag), and base64 is 4 bytes
  // out per 3 in — so 8000 b64 chars is 6000 raw, minus the 93-byte
  // envelope. Exported so the composer can count down honestly
  // rather than letting the INSERT fail.
  const MAX_PLAINTEXT_BYTES = Math.floor(8000 / 4) * 3 - 65 - 12 - 16;

  // ── IndexedDB helpers ─────────────────────────────────────────
  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function dbGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  async function dbSet(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── Base64 <-> ArrayBuffer ────────────────────────────────────
  function b64encode(buf) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64decode(str) {
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  // ── Keypair lifecycle ─────────────────────────────────────────
  // One keypair, extractable so the public half can be exported to
  // profiles.dm_public_key. The private half never leaves this
  // module. Same guarantee Signal's web client makes.
  //
  // (Until 2026-09-24 this function generated three keypairs and
  //  used one — two were leftovers from working out WebCrypto's
  //  extractability rules. Audit finding D4.)
  async function getOrCreateMyKeypair() {
    const stored = await dbGet(KEY_ID);
    if (stored?.privateKey && stored?.publicKey) return stored;

    const kp = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: CURVE },
      true,
      ['deriveBits']
    );
    await dbSet(KEY_ID, { privateKey: kp.privateKey, publicKey: kp.publicKey });
    return { privateKey: kp.privateKey, publicKey: kp.publicKey };
  }

  // True when this browser has never generated a keypair. The UI
  // uses it to explain, before the first send, that history will
  // not follow them to another device.
  async function hasLocalKeypair() {
    const stored = await dbGet(KEY_ID);
    return !!(stored?.privateKey && stored?.publicKey);
  }

  async function exportPublicKey(publicKey) {
    const raw = await crypto.subtle.exportKey('raw', publicKey); // 65 bytes for P-256
    return b64encode(raw);
  }

  async function importPublicKey(b64) {
    return crypto.subtle.importKey(
      'raw',
      b64decode(b64),
      { name: 'ECDH', namedCurve: CURVE },
      true, []
    );
  }

  // Short, stable, non-secret identifier for a public key. Recorded
  // on each message so a device that no longer holds the matching
  // private key can say so instead of failing silently (D2).
  async function keyFingerprint(publicKeyB64) {
    if (!publicKeyB64) return null;
    const digest = await crypto.subtle.digest('SHA-256', b64decode(publicKeyB64));
    return b64encode(digest).slice(0, 16);
  }

  // Fingerprint of the key this browser holds, or null if it has none.
  async function myKeyFingerprint() {
    const stored = await dbGet(KEY_ID);
    if (!stored?.publicKey) return null;
    return keyFingerprint(await exportPublicKey(stored.publicKey));
  }

  async function deriveAesKey(myPrivate, theirPublic) {
    const bits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: theirPublic },
      myPrivate,
      256
    );
    return crypto.subtle.importKey(
      'raw', bits, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']
    );
  }

  // ── Encrypt / decrypt ─────────────────────────────────────────
  // The primitive: seal `plaintext` to one public key. Prefer
  // encryptForBoth() — a message sealed only with this is one the
  // sender can never read back (D1).
  async function encryptTo(recipientPubB64, plaintext) {
    if (!recipientPubB64) throw new Error('Recipient has no public key set yet.');
    const ptBytes = new TextEncoder().encode(plaintext);
    if (ptBytes.byteLength > MAX_PLAINTEXT_BYTES) {
      throw new Error('Message is too long — the limit is ' + MAX_PLAINTEXT_BYTES + ' bytes.');
    }
    const recipientPub = await importPublicKey(recipientPubB64);
    // Ephemeral sender keypair — private half discarded after this
    // call → forward secrecy for this individual message.
    const eph = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: CURVE }, true, ['deriveBits']
    );
    const aes = await deriveAesKey(eph.privateKey, recipientPub);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, ptBytes);
    // Wire: eph_pub(65) | iv(12) | ct
    const ephRaw = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
    const out = new Uint8Array(ephRaw.byteLength + iv.byteLength + ct.byteLength);
    out.set(ephRaw, 0);
    out.set(iv, ephRaw.byteLength);
    out.set(new Uint8Array(ct), ephRaw.byteLength + iv.byteLength);
    return b64encode(out.buffer);
  }

  // Seal one message twice — to the recipient, and to the sender, so
  // the sender can read their own sent messages (D1). Returns
  // everything an INSERT into messages_e2e needs.
  //
  //   const sealed = await encryptForBoth(theirPub, myPub, text);
  //   insert({ ciphertext:      sealed.forRecipient,
  //            ciphertext_self: sealed.forSelf,
  //            to_key_fp:       sealed.toKeyFp,
  //            self_key_fp:     sealed.selfKeyFp, … })
  async function encryptForBoth(recipientPubB64, myPublicKeyB64, plaintext) {
    if (!recipientPubB64) throw new Error('Recipient has no public key set yet.');
    if (!myPublicKeyB64)  throw new Error('This device has no DM key yet.');
    const [forRecipient, forSelf, toKeyFp, selfKeyFp] = await Promise.all([
      encryptTo(recipientPubB64, plaintext),
      encryptTo(myPublicKeyB64, plaintext),
      keyFingerprint(recipientPubB64),
      keyFingerprint(myPublicKeyB64),
    ]);
    return { forRecipient, forSelf, toKeyFp, selfKeyFp };
  }

  async function decryptFrom(myKeypair, ciphertextB64) {
    const buf = new Uint8Array(b64decode(ciphertextB64));
    const ephRaw = buf.slice(0, 65);
    const iv     = buf.slice(65, 77);
    const ct     = buf.slice(77);
    const eph = await crypto.subtle.importKey(
      'raw', ephRaw, { name: 'ECDH', namedCurve: CURVE }, true, []
    );
    const aes = await deriveAesKey(myKeypair.privateKey, eph);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aes, ct);
    return new TextDecoder().decode(pt);
  }

  // Read one row as this member. Picks the blob addressed to this
  // device, and reports an unreadable message rather than throwing
  // when the row was sealed to a key this browser no longer has (D2).
  //
  // Returns { text } | { unreadable: 'wrong-device' | 'failed' }.
  async function readMessage(myKeypair, row, opts) {
    const mine   = (opts && opts.mine) === true;   // did I send this row?
    const blob   = mine ? row.ciphertext_self : row.ciphertext;
    const rowFp  = mine ? row.self_key_fp     : row.to_key_fp;
    if (!blob) return { unreadable: 'wrong-device' };

    const myFp = await myKeyFingerprint();
    if (rowFp && myFp && rowFp !== myFp) return { unreadable: 'wrong-device' };

    try {
      return { text: await decryptFrom(myKeypair, blob) };
    } catch (_) {
      // Either the fingerprint was absent (pre-D2 row) and the key
      // really is wrong, or the blob is corrupt. Same message either
      // way — we cannot tell them apart and must not guess.
      return { unreadable: rowFp ? 'failed' : 'wrong-device' };
    }
  }

  /* ════════════════════════════════════════════════════════════
     THE SECURITY KEY VAULT
     ════════════════════════════════════════════════════════════
     Supersedes the device-bound policy above. The private key can
     now be wrapped with a Security Key the member holds, and stored
     as ciphertext in public.user_key_vault, so a new device restores
     rather than starts over.

     What leaves the browser: ciphertext, a salt, an IV, an iteration
     count, the public key. What never does: the Security Key, and
     the private key. Neither is derivable from the row.

     A forgotten Security Key is unrecoverable BY ANYONE. There is no
     escrow, no reset and no admin path — adding one would end the
     end-to-end property. Say so before they set one.
     ════════════════════════════════════════════════════════════ */

  const KDF_ITERATIONS = 600000;   // OWASP 2023 floor for PBKDF2-HMAC-SHA256
  const KDF_SALT_BYTES = 16;
  const VAULT_IV_BYTES = 12;

  // Ambiguous characters are omitted: no O/0, no I/1, no U (which
  // turns up in words nobody wants printed on a recovery card). A
  // member reads this off a screen and types it on a phone.
  const SK_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTVWXYZ';
  const SK_GROUPS   = 4;
  const SK_GROUP_LEN = 4;

  // FUNG-XXXX-XXXX-XXXX-XXXX · 16 chars from a 31-char alphabet is
  // ~79 bits, which behind 600k PBKDF2 iterations is not brute-forced
  // by anyone, ever. Rejection sampling rather than % so the alphabet
  // stays uniform — a modulo bias here would quietly cost entropy.
  function generateSecurityKey() {
    const out = [];
    for (let g = 0; g < SK_GROUPS; g++) {
      let group = '';
      while (group.length < SK_GROUP_LEN) {
        const buf = crypto.getRandomValues(new Uint8Array(32));
        for (let i = 0; i < buf.length && group.length < SK_GROUP_LEN; i++) {
          if (buf[i] < 248) group += SK_ALPHABET[buf[i] % SK_ALPHABET.length]; // 248 = 8*31
        }
      }
      out.push(group);
    }
    return 'FUNG-' + out.join('-');
  }

  // Members retype these with stray spaces, lowercase, and the dashes
  // in the wrong places. Normalise before deriving, or a correct key
  // fails to unlock and they conclude their history is gone.
  // Custom passphrases are left exactly as typed — case and spacing
  // are meaningful there.
  function normaliseSecurityKey(input) {
    const s = String(input == null ? '' : input).trim();
    if (!s) throw new Error('Security Key is empty.');
    const compact = s.replace(/[\s-]/g, '').toUpperCase();
    if (/^FUNG[0-9A-Z]{16}$/.test(compact)) {
      return 'FUNG-' + compact.slice(4).match(/.{4}/g).join('-');
    }
    return s;   // a passphrase: preserve it verbatim
  }

  async function deriveWrappingKey(securityKey, saltB64, iterations) {
    const base = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(normaliseSecurityKey(securityKey)),
      'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64decode(saltB64),
        iterations: iterations || KDF_ITERATIONS, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false, ['encrypt', 'decrypt']
    );
  }

  // Wrap this device's private key. Returns exactly the row
  // user_key_vault wants — the caller does the INSERT, so this file
  // keeps knowing nothing about Supabase.
  async function backupPrivateKeyWithSecurityKey(keypair, securityKey) {
    if (!keypair || !keypair.privateKey) throw new Error('No keypair on this device to back up.');
    const privateJwk = await crypto.subtle.exportKey('jwk', keypair.privateKey);
    const publicJwk  = await crypto.subtle.exportKey('jwk', keypair.publicKey);
    const publicRaw  = await exportPublicKey(keypair.publicKey);

    const salt = crypto.getRandomValues(new Uint8Array(KDF_SALT_BYTES));
    const iv   = crypto.getRandomValues(new Uint8Array(VAULT_IV_BYTES));
    const saltB64 = b64encode(salt.buffer);

    const aes = await deriveWrappingKey(securityKey, saltB64, KDF_ITERATIONS);
    const ct  = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, aes,
      new TextEncoder().encode(JSON.stringify(privateJwk))
    );

    return {
      public_key_jwk:        JSON.stringify(publicJwk),
      public_key_raw:        publicRaw,
      key_fingerprint:       await keyFingerprint(publicRaw),
      encrypted_private_key: b64encode(ct),
      kdf_salt:              saltB64,
      aes_iv:                b64encode(iv.buffer),
      kdf_iterations:        KDF_ITERATIONS,
    };
  }

  // Unwrap a vault row and adopt it as this device's keypair.
  //
  // The iteration count comes FROM THE ROW, not from the constant, so
  // raising KDF_ITERATIONS later cannot strand vaults written under
  // the old one.
  //
  // A wrong Security Key surfaces as AES-GCM auth failure, which is
  // indistinguishable from a corrupt blob — so it is reported as one
  // typed error the UI can phrase kindly, never as a raw exception.
  async function restorePrivateKeyWithSecurityKey(row, securityKey) {
    if (!row || !row.encrypted_private_key) throw new Error('No vault to restore from.');

    const aes = await deriveWrappingKey(securityKey, row.kdf_salt, row.kdf_iterations);
    let privateJwk;
    try {
      const pt = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(b64decode(row.aes_iv)) },
        aes,
        b64decode(row.encrypted_private_key)
      );
      privateJwk = JSON.parse(new TextDecoder().decode(pt));
    } catch (_) {
      const err = new Error('That Security Key does not unlock this vault.');
      err.code = 'BAD_SECURITY_KEY';
      throw err;
    }

    const privateKey = await crypto.subtle.importKey(
      'jwk', privateJwk, { name: 'ECDH', namedCurve: CURVE }, true, ['deriveBits']
    );
    const publicKey = await importPublicKey(row.public_key_raw);

    // Only now touch local storage. A failed restore must leave a
    // working device untouched.
    await dbSet(KEY_ID, { privateKey, publicKey });

    const fp = await keyFingerprint(row.public_key_raw);
    if (row.key_fingerprint && fp !== row.key_fingerprint) {
      // The row's own fingerprint disagrees with its own public key.
      // Restore still succeeded; the UI should show this, because it
      // means the row was tampered with or written by a buggy client.
      return { privateKey, publicKey, fingerprint: fp, fingerprintMismatch: true };
    }
    return { privateKey, publicKey, fingerprint: fp, fingerprintMismatch: false };
  }

  // What the dashboard card should say. `vaultRow` is whatever the
  // caller fetched from user_key_vault (null if none).
  //
  //   'unlocked'   this device holds the key that matches the vault
  //   'locked'     a vault exists, this device cannot read chats yet
  //   'local-only' key here, no backup — one Safari eviction from loss
  //   'none'       no key anywhere; nothing to lose yet
  async function vaultStatus(vaultRow) {
    const localFp = await myKeyFingerprint();
    if (!vaultRow) return localFp ? 'local-only' : 'none';
    if (!localFp)  return 'locked';
    return localFp === vaultRow.key_fingerprint ? 'unlocked' : 'locked';
  }

  // ⚠ THE ORDERING TRAP, and the reason this function exists.
  //
  // getOrCreateMyKeypair() generates a fresh keypair the instant
  // IndexedDB is empty. With a vault in play that is destructive: on
  // a new device it would mint a new key, the caller would publish it
  // to dm_public_key, and every message ever sent to the member
  // becomes unreadable BEFORE they were ever offered the chance to
  // restore.
  //
  // So callers must ask this first. It refuses to create when a vault
  // exists, and says which case it is.
  //
  //   { keypair }                    ready to use
  //   { needsRestore: true }         vault exists, this device is empty
  //   { needsBackup: true, keypair } local key, no vault yet
  async function openKeypairForVault(vaultRow) {
    const stored = await dbGet(KEY_ID);
    const have = !!(stored && stored.privateKey && stored.publicKey);

    if (!have && vaultRow) return { needsRestore: true };
    if (!have && !vaultRow) {
      const kp = await getOrCreateMyKeypair();
      return { keypair: kp, needsBackup: true };
    }
    const localFp = await myKeyFingerprint();
    if (vaultRow && vaultRow.key_fingerprint && localFp !== vaultRow.key_fingerprint) {
      // A key here AND a different one in the vault. Never silently
      // pick: overwriting local loses anything only it can read, and
      // ignoring the vault loses everything sent to the other key.
      return { keypair: stored, conflict: true, localFingerprint: localFp };
    }
    return { keypair: stored, needsBackup: !vaultRow };
  }

  // Deterministic conversation key so both sides land in the same
  // thread. sha256(sorted(pair)) — no secret, just a stable id.
  async function threadKey(profileIdA, profileIdB) {
    const pair = [profileIdA, profileIdB].sort().join('|');
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pair));
    return b64encode(buf).slice(0, 32);
  }

  window.MycDMcrypto = {
    MAX_PLAINTEXT_BYTES,
    KDF_ITERATIONS,
    getOrCreateMyKeypair,
    hasLocalKeypair,
    exportPublicKey,
    importPublicKey,
    keyFingerprint,
    myKeyFingerprint,
    encryptTo,
    encryptForBoth,
    decryptFrom,
    readMessage,
    threadKey,
    // Vault
    generateSecurityKey,
    normaliseSecurityKey,
    backupPrivateKeyWithSecurityKey,
    restorePrivateKeyWithSecurityKey,
    vaultStatus,
    openKeypairForVault,
  };
})();
