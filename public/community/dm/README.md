# /community/dm — End-to-end-encrypted member DMs

Own folder because the crypto module and the UI both grow independently.

## Files

| File          | Purpose                                              |
|---------------|------------------------------------------------------|
| `crypto.js`   | ECDH-P256 + AES-GCM helpers. Never leaves this file. |
| `dm.jsx`      | (to build) — chat UI, thread list, unread badges     |
| `README.md`   | this                                                 |

## v1 wiring (once you're ready)

1. Run `supabase-messages-e2e.sql` — creates the ciphertext table
   + adds `profiles.dm_public_key`.
2. Enable Realtime on `messages_e2e` in the Supabase dashboard so
   new messages push live.
3. On first sign-in, call
   `window.MycDMcrypto.getOrCreateMyKeypair()` and upload the
   exported public key to `profiles.dm_public_key`.
4. To send: `MycDMcrypto.encryptTo(recipientPub, plaintext)` →
   INSERT into `messages_e2e` with `ciphertext`, `to_profile_id`,
   `thread_key = MycDMcrypto.threadKey(myProfileId, recipientId)`.
5. To read: SELECT from `messages_e2e` where `to_profile_id` = me,
   then `MycDMcrypto.decryptFrom(myKeypair, ciphertext)` per row.

## What the server can see

- Sender auth uid, recipient profile id, timestamps, size, read state.
- **NOT** the message text — that's opaque ciphertext.
- **NOT** the private keys — those never leave the device.

## What Robin can see as admin

Same as the server. Robin CAN see message metadata (who talked to
whom, when, how many). Robin CANNOT read message bodies without the
recipient's private key, which lives in the recipient's browser
IndexedDB and is never uploaded anywhere.

If a user loses their device / clears IndexedDB, their historical
messages are lost with them. That's the price of true E2E — the
server can't help recover what it can't read.

## Guardrails to add before shipping

- [ ] Rate limit on the INSERT to prevent spam (Netlify Edge or
      Supabase-side function). Currently: unlimited.
- [ ] Optional message expiry (delete after N days) via a scheduled
      Supabase edge function.
- [ ] Block list — one member can block another. Blocked sender's
      INSERTs succeed to their side of the world (they see it sent)
      but the RLS policy hides the row from the blocked-by side.
- [ ] Independent crypto review of `crypto.js` before real user data.
- [ ] Add signature (Ed25519) so recipient can verify authorship;
      current version only proves the ciphertext decrypts, not who
      it was actually from at the crypto layer (the DB says `from_auth_user_id`
      but Robin as admin could theoretically insert with any uid —
      Ed25519 sig moves that trust from the DB to the sender's key).
