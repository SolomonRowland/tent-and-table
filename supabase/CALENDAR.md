# Calendar link: one-time setup

The app's **Settings > Calendar** gives each login a private link their phone's calendar subscribes to. The link is served by a small function in your own Supabase project. It's free, and nothing outside your project is involved.

1. Run `supabase/schema.sql` (version 19 or later) in the [SQL editor](https://supabase.com/dashboard/project/vvfdhhbcvpgggfcusvqa/sql/new).
2. Open [Edge Functions](https://supabase.com/dashboard/project/vvfdhhbcvpgggfcusvqa/functions), choose **Deploy a new function**, then **Via Editor**.
3. Name it exactly `ed-cal`. Replace the sample code with everything in `supabase/functions/ed-cal/index.ts`, then deploy.
4. Open the function's **Details** (or Settings) and turn **Verify JWT** (Enforce JWT verification) **off**, then save. Calendar apps can't sign in, so the private token in the link is what protects it.
5. In the app, open Settings > Calendar. It should say "Your link is working." Tap **Add To My Calendar**.

To stop a link, tap **Reset Link** or **Turn Off** in the same place. The old link stops working right away.
