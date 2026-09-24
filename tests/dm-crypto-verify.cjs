// tests/dm-crypto-verify.cjs — npm run test:dm-crypto
//
// Exercises public/community/dm/crypto.js under Node WebCrypto with a
// minimal fake IndexedDB, one sandbox per "device".
//
// The two checks that matter, both from docs/COMMUNITY-AUDIT.md §9:
//
//   D1  the SENDER can read their own sent message. Before the
//       ciphertext_self copy they could not — encryptTo() discards the
//       ephemeral private key, so a conversation had no "sent" side.
//
//   D2  a device holding a different key reports 'wrong-device' rather
//       than throwing or rendering blank. DM history is deliberately
//       device-bound; the failure has to be legible.
//
// Also guards that the recipient CANNOT open ciphertext_self, that a
// max-length message still fits the 8000-char column, and that both
// sides derive the same thread key.

const fs = require('fs'), vm = require('vm');
const { webcrypto } = require('crypto');

function makeSandbox() {
  const store = new Map();
  const idb = { open: () => { const req = {};
    setTimeout(() => { req.result = {
      objectStoreNames: { contains: () => true },
      createObjectStore(){}, 
      transaction: () => ({ objectStore: () => ({
        get(k){ const r={}; setTimeout(()=>{ r.result=store.get(k)||null; r.onsuccess&&r.onsuccess(); },0); return r; },
        put(v,k){ store.set(k,v); const r={}; setTimeout(()=>{ r.onsuccess&&r.onsuccess(); },0); return r; },
      }), set oncomplete(f){ setTimeout(f,0); }, set onerror(f){} }),
    }; req.onsuccess && req.onsuccess(); }, 0);
    return req; } };
  const sb = { console, setTimeout, clearTimeout, Promise, crypto: webcrypto,
    TextEncoder, TextDecoder, indexedDB: idb,
    btoa: s => Buffer.from(s,'binary').toString('base64'),
    atob: s => Buffer.from(s,'base64').toString('binary'),
    Uint8Array, ArrayBuffer, Error, Math, JSON, Object, Array, String, Number };
  sb.window = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb);
  vm.runInContext(fs.readFileSync('public/community/dm/crypto.js','utf8'), ctx, {filename:'crypto.js'});
  return { ctx, sb };
}

(async () => {
  let pass = 0, fail = 0;
  const ok  = (n,d) => { pass++; console.log('  ✓ ' + n + (d?'  — '+d:'')); };
  const bad = (n,d) => { fail++; console.log('  ✗ ' + n + (d?'  — '+d:'')); };

  // Two independent "devices"
  const alice = makeSandbox(), bob = makeSandbox();
  const A = alice.sb.MycDMcrypto, B = bob.sb.MycDMcrypto;

  const aKp = await A.getOrCreateMyKeypair();
  const bKp = await B.getOrCreateMyKeypair();
  const aPub = await A.exportPublicKey(aKp.publicKey);
  const bPub = await B.exportPublicKey(bKp.publicKey);

  console.log('\n── D4 · one keypair, not three ──');
  const again = await A.getOrCreateMyKeypair();
  (await A.exportPublicKey(again.publicKey)) === aPub
    ? ok('getOrCreateMyKeypair is stable across calls')
    : bad('getOrCreateMyKeypair is stable across calls');

  console.log('\n── D1 · both parties can read the message ──');
  const text = 'Comfrey is topical only — PAs are hepatotoxic.';
  const sealed = await A.encryptForBoth(bPub, aPub, text);

  const row = { ciphertext: sealed.forRecipient, ciphertext_self: sealed.forSelf,
                to_key_fp: sealed.toKeyFp, self_key_fp: sealed.selfKeyFp };

  const asBob = await B.readMessage(bKp, row, { mine: false });
  asBob.text === text ? ok('recipient reads it', JSON.stringify(asBob.text.slice(0,28)+'…'))
                      : bad('recipient reads it', JSON.stringify(asBob));

  const asAlice = await A.readMessage(aKp, row, { mine: true });
  asAlice.text === text ? ok('SENDER reads their own sent message', 'this is what D1 fixes')
                        : bad('SENDER reads their own sent message', JSON.stringify(asAlice));

  sealed.forRecipient !== sealed.forSelf
    ? ok('the two blobs differ', 'separate ephemeral keys')
    : bad('the two blobs differ');

  console.log('\n── D1 · the recipient still cannot read the SENDER copy ──');
  const leak = await B.readMessage(bKp, row, { mine: true });
  leak.text === undefined ? ok('bob cannot open ciphertext_self', leak.unreadable)
                          : bad('bob cannot open ciphertext_self', 'LEAK: ' + leak.text);

  console.log('\n── D2 · a new device fails legibly, not silently ──');
  const bobNewPhone = makeSandbox();
  const N = bobNewPhone.sb.MycDMcrypto;
  const nKp = await N.getOrCreateMyKeypair();
  const onNewPhone = await N.readMessage(nKp, row, { mine: false });
  onNewPhone.unreadable === 'wrong-device'
    ? ok('reports wrong-device', 'not an exception, not a blank message')
    : bad('reports wrong-device', JSON.stringify(onNewPhone));

  console.log('\n── fingerprints ──');
  const fpA = await A.keyFingerprint(aPub);
  (fpA === sealed.selfKeyFp && fpA.length === 16)
    ? ok('fingerprint is stable and 16 chars', fpA)
    : bad('fingerprint is stable and 16 chars', fpA + ' vs ' + sealed.selfKeyFp);
  (await A.keyFingerprint(bPub)) !== fpA
    ? ok('different keys, different fingerprints')
    : bad('different keys, different fingerprints');

  console.log('\n── size cap ──');
  console.log('  MAX_PLAINTEXT_BYTES = ' + A.MAX_PLAINTEXT_BYTES);
  try {
    await A.encryptTo(bPub, 'x'.repeat(A.MAX_PLAINTEXT_BYTES + 1));
    bad('over-long message is refused');
  } catch (e) { ok('over-long message is refused', e.message); }
  const atLimit = await A.encryptTo(bPub, 'x'.repeat(A.MAX_PLAINTEXT_BYTES));
  atLimit.length <= 8000 ? ok('a max-length message fits the 8000-char column', atLimit.length + ' chars')
                         : bad('a max-length message fits the 8000-char column', atLimit.length + ' chars');

  console.log('\n── threadKey ──');
  const t1 = await A.threadKey('p-alice','p-bob'), t2 = await B.threadKey('p-bob','p-alice');
  t1 === t2 ? ok('both sides derive the same thread', t1) : bad('both sides derive the same thread');

  console.log('\n  passed: ' + pass + '   failed: ' + fail);
  process.exit(fail ? 1 : 0);
})();
