// tests/dm-vault-verify.cjs — npm run test:dm-vault
//
// The Security Key vault in public/community/dm/crypto.js, under Node
// WebCrypto with a fake IndexedDB, one sandbox per "device".
//
// Three checks carry the feature:
//
//   1. A device that restores from the vault can decrypt mail that was
//      sent to the ORIGINAL device. That is the entire point; if it
//      fails, the vault is decoration.
//
//   2. openKeypairForVault() REFUSES to mint a new keypair when a vault
//      exists. getOrCreateMyKeypair() generates on an empty IndexedDB,
//      so without this gate a new device would publish a fresh public
//      key and orphan every message ever sent — before the member was
//      offered the chance to restore.
//
//   3. The Security Key never appears in the uploaded payload.
//
// Plus: normalisation (people retype these lowercase, unspaced and
// wrongly hyphenated — a correct key that fails to unlock reads as
// "my history is gone"), and the four dashboard states.
const fs = require('fs'), vm = require('vm');
const { webcrypto } = require('crypto');

function mk() {
  const store = new Map();
  const idb = { open: () => { const r = {};
    setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, createObjectStore(){},
      transaction: () => ({ objectStore: () => ({
        get(k){ const q={}; setTimeout(()=>{ q.result=store.get(k)||null; q.onsuccess&&q.onsuccess(); },0); return q; },
        put(v,k){ store.set(k,v); const q={}; setTimeout(()=>{ q.onsuccess&&q.onsuccess(); },0); return q; } }),
      set oncomplete(f){ setTimeout(f,0); }, set onerror(f){} }) };
      r.onsuccess && r.onsuccess(); }, 0); return r; } };
  const sb = { console, setTimeout, clearTimeout, Promise, crypto: webcrypto,
    TextEncoder, TextDecoder, indexedDB: idb,
    btoa: s => Buffer.from(s,'binary').toString('base64'),
    atob: s => Buffer.from(s,'base64').toString('binary'),
    Uint8Array, ArrayBuffer, Error, Math, JSON, Object, Array, String, Number, RegExp };
  sb.window = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb);
  vm.runInContext(fs.readFileSync('public/community/dm/crypto.js','utf8'), ctx, { filename: 'crypto.js' });
  return sb;
}

(async () => {
  let p = 0, f = 0;
  const ok  = (n,d) => { p++; console.log('  ✓ ' + n + (d ? '  — ' + d : '')); };
  const bad = (n,d) => { f++; console.log('  ✗ ' + n + (d ? '  — ' + d : '')); };
  const A = mk().MycDMcrypto;

  console.log('\n── Security Key format ──');
  const sk = A.generateSecurityKey();
  /^FUNG-[23456789ABCDEFGHJKLMNPQRSTVWXYZ]{4}(-[23456789ABCDEFGHJKLMNPQRSTVWXYZ]{4}){3}$/.test(sk)
    ? ok('format', sk) : bad('format', sk);
  const many = new Set(); for (let i=0;i<200;i++) many.add(A.generateSecurityKey());
  many.size === 200 ? ok('200 keys, 200 distinct') : bad('distinct', many.size);

  console.log('\n── normalisation (how people actually retype it) ──');
  [[sk.toLowerCase(),'lowercase'],[sk.replace(/-/g,''),'no dashes'],[' '+sk+' ','padded'],[sk.replace(/-/g,' '),'spaces']]
    .forEach(([v,label]) => { A.normaliseSecurityKey(v) === sk ? ok(label) : bad(label, A.normaliseSecurityKey(v)); });
  A.normaliseSecurityKey('My Long Pass Phrase') === 'My Long Pass Phrase'
    ? ok('passphrase kept verbatim') : bad('passphrase kept verbatim');

  console.log('\n── backup / restore round trip ──');
  const kp = await A.getOrCreateMyKeypair();
  const myFp = await A.myKeyFingerprint();
  const row = await A.backupPrivateKeyWithSecurityKey(kp, sk);
  row.kdf_iterations === 600000 ? ok('600k iterations recorded') : bad('iterations', row.kdf_iterations);
  (row.encrypted_private_key && !JSON.stringify(row).includes(sk))
    ? ok('Security Key is NOT in the payload') : bad('Security Key leaked into payload');
  row.key_fingerprint === myFp ? ok('fingerprint matches the device', myFp) : bad('fingerprint');
  (() => { try { JSON.parse(row.public_key_jwk); return ok('public_key_jwk is JSON'); }
           catch (e) { return bad('public_key_jwk is JSON'); } })();
  (row.public_key_raw.length < 200 && !row.public_key_raw.startsWith('{'))
    ? ok('public_key_raw is a raw point, not JWK', 'what dm_public_key needs')
    : bad('public_key_raw shape', row.public_key_raw.slice(0,40));

  console.log('\n── a NEW device restores ──');
  const B = mk().MycDMcrypto;
  (await B.myKeyFingerprint()) === null ? ok('new device starts empty') : bad('new device starts empty');
  const gate = await B.openKeypairForVault(row);
  gate.needsRestore === true
    ? ok('openKeypairForVault REFUSES to mint a new key', 'the D2 ordering trap')
    : bad('needsRestore', JSON.stringify(Object.keys(gate)));
  const res = await B.restorePrivateKeyWithSecurityKey(row, sk);
  res.fingerprint === myFp ? ok('restored key matches the original', res.fingerprint) : bad('restored fp', res.fingerprint);
  res.fingerprintMismatch === false ? ok('no tamper flag') : bad('tamper flag raised');

  console.log('\n── the restored device can read old mail ──');
  const C = mk().MycDMcrypto;
  const cKp = await C.getOrCreateMyKeypair();
  const cPub = await C.exportPublicKey(cKp.publicKey);
  const sealed = await C.encryptForBoth(row.public_key_raw, cPub, 'double extraction, 1:5 in 60% ethanol');
  const read = await B.readMessage(await B.getOrCreateMyKeypair(),
    { ciphertext: sealed.forRecipient, ciphertext_self: sealed.forSelf,
      to_key_fp: sealed.toKeyFp, self_key_fp: sealed.selfKeyFp }, { mine: false });
  read.text === 'double extraction, 1:5 in 60% ethanol'
    ? ok('restored device decrypts mail sent to the old one', 'this is the whole point')
    : bad('decrypt after restore', JSON.stringify(read));

  console.log('\n── wrong Security Key ──');
  try { await B.restorePrivateKeyWithSecurityKey(row, A.generateSecurityKey()); bad('wrong key rejected'); }
  catch (e) { e.code === 'BAD_SECURITY_KEY' ? ok('typed error, not a raw crypto exception', e.message) : bad('error code', e.code); }

  console.log('\n── status card ──');
  for (const [r, want, label] of [[null,'local-only','key here, no backup'],[row,'unlocked','key matches vault']])
    (await A.vaultStatus(r)) === want ? ok(label + ' → ' + want) : bad(label, await A.vaultStatus(r));
  const D = mk().MycDMcrypto;
  (await D.vaultStatus(row))  === 'locked' ? ok('empty device + vault → locked') : bad('locked');
  (await D.vaultStatus(null)) === 'none'   ? ok('nothing anywhere → none')       : bad('none');

  console.log('\n  passed: ' + p + '   failed: ' + f);
  process.exit(f ? 1 : 0);
})();
