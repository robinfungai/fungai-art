# Supabase Email Templates — Fungai Art

Supabase picks a different template depending on the user's state:

| User state                | Template used                |
| ------------------------- | ---------------------------- |
| New email                 | **Confirm signup**           |
| Existing, confirmed       | **Magic Link**               |
| Password reset            | Reset Password               |
| Email change in progress  | **Change Email Address**     |

All four templates use the same base HTML — only the `<h1>` and intro `<p>` change.

**Critical fixes vs. the version you saw in your inbox:**
1. The button "✦ ENTER THE NETWORK" was rendering invisible (dark text on transparent background in some clients). The new template uses **amber gradient background with dark text** — high contrast everywhere.
2. The little mushroom icon is replaced with the real **fungi.png logo** hosted at `https://www.fungai.art/fungi.png`, framed in an amber ring.

---

## How to apply

1. Open https://supabase.com/dashboard/project/cyhpvsyvxzfadtyvcuwp/auth/templates
2. For each tab (Confirm signup · Magic Link · Reset Password · Change Email Address):
   - Paste the subject line
   - Paste the body HTML (use the **HTML** editor, not Plain Text)
   - Click **Save changes**

---

## Magic Link

**Subject:** `Your sign-in link — Fungai Art`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body { margin:0; padding:0; background:#060809; color:#C9B894; font-family:Georgia,'Times New Roman',serif; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:560px; margin:0 auto; padding:40px 20px; }
  .card { background:#0F1014; border:0.5px solid rgba(196,136,56,.22); border-radius:14px; padding:36px 32px; text-align:center; }
  .logo { display:inline-block; width:72px; height:72px; border-radius:50%; background:#0A0F0C url('https://www.fungai.art/fungi.png') center/cover no-repeat; border:1px solid rgba(232,177,75,0.55); box-shadow:0 0 18px rgba(232,177,75,0.35); margin-bottom:22px; }
  .ey { font-family:'Courier New',monospace; font-size:10px; letter-spacing:0.34em; text-transform:uppercase; color:#E8B14B; margin-bottom:16px; }
  h1 { font-family:Georgia,serif; font-style:italic; font-weight:400; font-size:32px; color:#E6D9B5; line-height:1.15; margin:0 0 18px; letter-spacing:-0.005em; }
  h1 em { color:#E8B14B; font-style:italic; }
  p { font-size:15px; line-height:1.75; color:#C9B894; margin:0 0 18px; }
  .btn-row { margin:26px 0 18px; }
  /* IMPORTANT — explicit !important on the colour, because some clients
     (Gmail mobile, Outlook web) override link colour with their own theme.
     Amber gradient + dark text is the only combo that holds across them. */
  a.btn { display:inline-block !important; font-family:'Courier New',monospace; font-size:11px; letter-spacing:0.26em; text-transform:uppercase; padding:15px 32px; border-radius:999px; background:#E8B14B !important; background-image:linear-gradient(135deg,#F5D769,#C4862E) !important; color:#1a1208 !important; text-decoration:none !important; font-weight:700; box-shadow:0 4px 16px rgba(232,177,75,0.28); }
  .small { font-size:11px; color:#8B7E62; line-height:1.7; }
  .small a { color:#C9B894; }
  .sig { margin-top:30px; padding-top:20px; border-top:0.5px solid rgba(196,136,56,.15); font-family:Georgia,serif; font-style:italic; color:#8B7E62; font-size:13px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="logo"></div>
      <div class="ey">✦ A thread arrives</div>
      <h1>Welcome to<br/><em>The Mycelium.</em></h1>
      <p>You're a click away from your place in the Fungai Art network. The link below signs you in — no password, no installation.</p>
      <div class="btn-row">
        <a class="btn" href="{{ .ConfirmationURL }}">✦ Enter the network →</a>
      </div>
      <p class="small">This link works once and expires in 1 hour.<br/>If you didn't request this, just ignore the email — nothing happens until you click.</p>
      <div class="sig">— Robin &amp; Steph<br/>fungai.art</div>
    </div>
  </div>
</body>
</html>
```

---

## Confirm signup

**Subject:** `Welcome to The Mycelium — confirm your thread`

Same HTML as above, but replace the `<h1>` and `<p>` block with:

```html
<h1>One thread to<br/><em>confirm.</em></h1>
<p>You just sent a signal into the network. Confirm it's really you — your thread weaves into the rest of us as soon as you click.</p>
```

And change the button text to `✦ Confirm & enter →`.

---

## Reset Password

**Subject:** `Reset your password — Fungai Art`

```html
<h1>Reset your<br/><em>password.</em></h1>
<p>Click below to choose a new one. If you didn't ask for this, ignore the email — your account stays put.</p>
```

Button text: `✦ Choose new password →`

---

## Change Email Address

**Subject:** `Confirm your new email — Fungai Art`

```html
<h1>New email,<br/><em>same thread.</em></h1>
<p>Confirm this address belongs to you. Once you click, all future emails go here.</p>
```

Button text: `✦ Confirm new address →`

---

## Quick QA

After saving each template, test by:
1. **Magic Link** — sign in via /community with an email already in `auth.users`.
2. **Confirm signup** — sign in with an email NOT yet in `auth.users` (Supabase falls back to this template).
3. **Reset Password** — call `supabase.auth.resetPasswordForEmail(email)` from the browser console.
4. **Change Email Address** — use the Admin → Your identity → Change my account email form.

The button must be **amber on dark** in every client. If you ever see dark-on-dark again, it's the client overriding `color:#1a1208` — re-add `!important` and re-save.
