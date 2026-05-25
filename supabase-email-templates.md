# Supabase Email Templates — Fungai Art

Supabase sends a **different template depending on the user's state**:

| User exists? | Template used                |
| ------------ | ---------------------------- |
| **New email**          | **Confirm signup** ← biggest one |
| Existing, confirmed   | Magic Link                    |
| Existing, password reset | Reset Password             |
| Email being changed   | Change Email Address          |

The unbranded "Confirm Your Signup" email you've been getting is the **Confirm signup** template. You need to paste this HTML into:

**Supabase dashboard → Authentication → Email Templates → "Confirm signup"**

Subject line: `Welcome to The Mycelium — confirm your thread`

Body (paste into the HTML editor, not the plain text one):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body { margin:0; padding:0; background:#060809; color:#C9B894; font-family:Georgia,'Times New Roman',serif; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:560px; margin:0 auto; padding:48px 24px; }
  .card { background:#0F1014; border:0.5px solid rgba(196,136,56,.18); border-radius:14px; padding:40px 36px; }
  .ey { font-family:'Courier New',monospace; font-size:10px; letter-spacing:0.34em; text-transform:uppercase; color:#E8B14B; margin-bottom:16px; }
  h1 { font-family:Georgia,serif; font-style:italic; font-weight:400; font-size:32px; color:#E6D9B5; line-height:1.1; margin:0 0 18px; letter-spacing:-0.005em; }
  h1 em { color:#6BD66F; font-style:italic; }
  p { font-size:15px; line-height:1.75; color:#C9B894; margin:0 0 18px; }
  .btn { display:inline-block; font-family:'Courier New',monospace; font-size:11px; letter-spacing:0.24em; text-transform:uppercase; padding:14px 30px; border-radius:999px; background:linear-gradient(135deg,#6BD66F,#2E7A35); color:#060809 !important; text-decoration:none; font-weight:500; margin:18px 0; }
  .small { font-size:11px; color:#8B7E62; line-height:1.7; }
  .small a { color:#C9B894; }
  .sig { margin-top:32px; padding-top:20px; border-top:0.5px solid rgba(196,136,56,.15); font-family:Georgia,serif; font-style:italic; color:#8B7E62; font-size:13px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="ey">✦ FUNGAI ART · The Mycelium</div>
      <h1>One thread to <em>confirm.</em></h1>
      <p>Welcome. You've just sent a signal into the network. Tap the button below to confirm it's really you — then your thread weaves into the rest of us.</p>
      <p style="text-align:center;"><a class="btn" href="{{ .ConfirmationURL }}">✦ Confirm &amp; enter →</a></p>
      <p class="small">Or paste this into your browser:<br/><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
      <p class="small">If you didn't request this, you can safely ignore the email — nothing happens.</p>
      <div class="sig">— Robin &amp; Steph, fungai.art</div>
    </div>
  </div>
</body>
</html>
```

---

## Also update the other 3 templates (so every email matches the brand):

### Magic Link template
Subject: `Your sign-in link — Fungai Art`

Use the same HTML but change the `<h1>` and `<p>` to:

```html
<h1>Your link to <em>walk back in.</em></h1>
<p>Click the button below and you'll be signed in to The Mycelium. No password needed — the link expires in 1 hour.</p>
```

### Reset Password
Subject: `Reset your password — Fungai Art`

```html
<h1>Reset your <em>password.</em></h1>
<p>Click below to choose a new one. If you didn't ask for this, ignore the email — your account stays put.</p>
```

### Change Email Address
Subject: `Confirm your new email — Fungai Art`

```html
<h1>New email, <em>same thread.</em></h1>
<p>Confirm this address belongs to you. Once you click, all future emails go here.</p>
```

---

## How to apply

1. Open https://supabase.com/dashboard/project/cyhpvsyvxzfadtyvcuwp/auth/templates
2. Pick the template tab (start with **Confirm signup** — that's the one currently sending the ugly default)
3. Paste subject + paste body
4. Click **Save changes**
5. Repeat for the other 3
6. Test by signing in with a fresh email (not your `tymetonics@gmail.com` — that already exists, so it sends the Magic Link template, not Confirm Signup)
