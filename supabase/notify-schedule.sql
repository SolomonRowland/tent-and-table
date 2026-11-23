-- Tent & Table: run the automatic texts and emails every 15 minutes.
-- Run this once in Supabase's SQL Editor after deploying the ed-notify function.
-- Replace the three values in angle brackets first:
--   <PROJECT-REF>  from your project URL, https://<PROJECT-REF>.supabase.co
--   <ANON-KEY>     Project Settings > API > anon public key
--   <CRON-SECRET>  the same random text you saved with: supabase secrets set CRON_SECRET=...
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('ed-notify') where exists (select 1 from cron.job where jobname = 'ed-notify');
select cron.schedule('ed-notify', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://<PROJECT-REF>.supabase.co/functions/v1/ed-notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <ANON-KEY>', 'x-cron-secret', '<CRON-SECRET>'),
    body := '{}'::jsonb
  );
$$);

-- Check it: select * from cron.job_run_details order by start_time desc limit 5;
-- Stop it:  select cron.unschedule('ed-notify');
