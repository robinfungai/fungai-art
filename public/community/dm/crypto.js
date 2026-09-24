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

  // Deterministic conversation key so both sides land in the same
  // thread. sha256(sorted(pair)) — no secret, just a stable id.
  async function threadKey(profileIdA, profileIdB) {
    const pair = [profileIdA, profileIdB].sort().join('|');
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pair));
    return b64encode(buf).slice(0, 32);
  }

  window.MycDMcrypto = {
    MAX_PLAINTEXT_BYTES,
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
  };
})();
