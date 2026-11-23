# Turning on email sending

Tent & Table can send a designed email (an invite, a reminder, a thank-you) to your contacts. You write and preview it in the app under an event's **Share** screen. The actual delivery goes through a service called Resend.

Until this is set up, everything else works: you can write emails, preview them and save drafts.

## What it costs

- **Testing: free.** Resend's free plan sends up to 100 emails a day (3,000 a month).
- **Before you verify a domain**, Resend only delivers to the email address you signed up with. That is enough to see your own test emails.
- **To send to everyone**, verify your ministry's web domain in Resend (free; you add a few DNS records). Sending 1,000 at once needs a paid plan, about $20 for that month.

## Setup (about 10 minutes)

1. **Update the database.** Paste `schema.sql` into Supabase's SQL Editor and run it (version 16 or later).
2. **Make a Resend account** at resend.com with your email. Open **API Keys**, create a key, and copy it (it starts with `re_`).
3. **Add the key to Supabase.** In your Supabase project open **Edge Functions > Secrets** and add a secret named `RESEND_API_KEY` with that key as the value.
4. **Add the function.** In **Edge Functions**, choose **Deploy a new function > Via Editor**. Name it `ed-mail`, replace the sample code with everything in `functions/ed-mail/index.ts`, and deploy.
5. **Try it.** In the app open an event, tap the share icon, tap **New Email**, then **Send Me A Test**.

## Later, when you're ready to send to everyone

1. In Resend, open **Domains**, add your ministry's domain and add the DNS records it shows you.
2. In Supabase **Edge Functions > Secrets**, add `NOTIFY_FROM_EMAIL` with an address on that domain, for example `hello@yourministry.org`.

## How it behaves

- Each person gets their own copy with their first name, their own RSVP link (the form is filled in for them) and an unsubscribe link.
- Contacts with no email, anyone who unsubscribed, and anyone marked "no group email" are left out.
- People who RSVP through a public link are only emailed later if they ticked "It's okay to contact me".
- If sending stops partway (for example the daily limit), open the email and tap **Send** again. Nobody gets it twice.
