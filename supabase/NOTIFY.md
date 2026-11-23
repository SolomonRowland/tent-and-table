# Turning on automatic texts and emails

Tent & Table can send these on its own:

| What | Who gets it | When |
| --- | --- | --- |
| New sign-ups, new connection cards | Logins who turned them on in Settings | Within 15 minutes |
| Tasks due today or tomorrow | The login the task is assigned to | 7 AM |
| Payments due in 3 days | The login named as the payer | 7 AM |
| Event a week away, and the day before | Every login who turned it on | 7 AM |
| Weekly summary | Every login who turned it on | Monday, 7 AM |
| Volunteer and task reminders | Volunteers and meal sign-ups serving tomorrow, the volunteer team the day before an event, and contacts with a task due tomorrow | 7 AM, when **Automatic Reminders** is on |

Times are in the ministry's time zone (Settings > Ministry Profile). Each message is logged and goes out once. Volunteers who gave a phone number get a text; otherwise an email.

## One-time setup (about 20 minutes)

You need the Supabase project the app already uses, plus an account with one or both sending services. Email alone is fine to start with; texting can be added later.

1. **Email: Resend.** Sign up at resend.com, add and verify your ministry's domain (it gives you DNS records to add), and create an API key. Your "from" address must be on that domain, for example `Grace Ministries <notices@graceministries.org>`.
2. **Texts: Twilio.** Sign up at twilio.com, buy a phone number that can send SMS, and note the Account SID and Auth Token. In the US, texting from an app needs A2P 10DLC registration in the Twilio console (a short form about your ministry; approval takes a few days). You can use a Messaging Service SID (starts with `MG`) instead of the number.
3. **Run the database update.** Paste `schema.sql` into Supabase's SQL Editor and run it (version 13 or later).
4. **Deploy the function** with the Supabase command line, from the `events` folder:
   ```
   supabase login
   supabase link --project-ref <PROJECT-REF>
   supabase secrets set RESEND_API_KEY=re_... NOTIFY_FROM_EMAIL="Grace Ministries <notices@graceministries.org>"
   supabase secrets set TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... TWILIO_FROM=+15555550123
   supabase secrets set CRON_SECRET=<any long random text> APP_URL=https://<where the app lives>/
   supabase functions deploy ed-notify --no-verify-jwt
   ```
   Leave out the Twilio line if you're only sending email (or the Resend line for texts only). `--no-verify-jwt` is safe: the function checks the cron secret or the signed-in user itself.
5. **Schedule it.** Open `notify-schedule.sql`, fill in the three values at the top, and run it in the SQL Editor. It calls the function every 15 minutes.
6. **Check it.** Within 15 minutes, Settings > Notifications says the texts and emails are on. Tap **Send Me A Test**. Then the owner can switch on **Automatic Reminders**.

## Costs

Resend's free plan covers 3,000 emails a month. Twilio texts cost about a penny each in the US, plus a small monthly fee for the number and the 10DLC registration.

## Files

- `functions/ed-notify/plan.js` decides who gets what (no network; easy to read and change).
- `functions/ed-notify/send.js` sends through Resend and Twilio and logs each message.
- `functions/ed-notify/index.ts` loads each ministry's rows, runs the two, and answers the app's Status and Test buttons.
- `notify-schedule.sql` sets up the 15-minute schedule.
- The log is the `ed_notify_log` table. To see what went out: `select created_at, kind, channel, to_name, status, error from ed_notify_log order by created_at desc limit 50;`
