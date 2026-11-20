// Tent & Table: automatic texts and emails.
//
// Runs every 15 minutes from pg_cron (see ../../notify-schedule.sql). Each run, for every ministry:
//   right away   new sign-ups and connection cards, to members who turned those on
//   after 7 AM   tasks due, payments due in 3 days, events a week or a day away, the Monday summary,
//                and (if the ministry turned it on) reminders to tomorrow's volunteers and task assignees
// The app also calls it with a signed-in user's token: { action: 'status' } or { action: 'test' }.
//
// Secrets (supabase secrets set ...): RESEND_API_KEY, NOTIFY_FROM_EMAIL, TWILIO_ACCOUNT_SID,
// TWILIO_AUTH_TOKEN, TWILIO_FROM, CRON_SECRET, APP_URL. Either service can be left out.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { plan, testMessages, addDays, localNow } from './plan.js';
import { deliver, channels } from './send.js';

const env = Deno.env.toObject();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function rows(q: any) { const { data, error } = await q; if (error) throw new Error(error.message); return data || []; }

function logFor(orgId: string) {
  return {
    claim: async (row: any) => { const { data, error } = await db.from('ed_notify_log').upsert(row, { onConflict: 'org_id,key', ignoreDuplicates: true }).select('key'); if (error) throw new Error(error.message); return !!(data && data.length); },
    done: async (key: string, status: string, err: string) => { await db.from('ed_notify_log').update({ status, error: err }).eq('org_id', orgId).eq('key', key); },
  };
}

async function runOrg(org: any, now: Date) {
  const today = localNow(now, org.timezone).day, since = addDays(today, -14);
  const events = await rows(db.from('ed_events').select('*').eq('org_id', org.id).or(`ends_on.gte.${since},and(ends_on.is.null,starts_on.gte.${since}),starts_on.is.null`));
  const ids = events.map((e: any) => e.id);
  const ev = (t: string) => ids.length ? rows(db.from(t).select('*').in('event_id', ids)) : Promise.resolve([]);
  const [members, tasks, items, signups, cards, eventVendors, eventPeople, expenses, people, vendors, contacts, logged] = await Promise.all([
    rows(db.from('ed_members').select('user_id, email, name, phone, prefs').eq('org_id', org.id)),
    ev('ed_tasks'), ev('ed_items'), ev('ed_signups'), ev('ed_cards'), ev('ed_event_vendors'), ev('ed_event_people'), ev('ed_expenses'),
    rows(db.from('ed_people').select('id, name, phone, email').eq('org_id', org.id)),
    rows(db.from('ed_vendors').select('id, name, phone, email').eq('org_id', org.id)),
    rows(db.from('ed_contacts').select('id, name, phone, email').eq('org_id', org.id)),
    rows(db.from('ed_notify_log').select('key').eq('org_id', org.id).gte('created_at', new Date(now.getTime() - 10 * 864e5).toISOString())),
  ]);
  const sent = new Set(logged.map((r: any) => r.key));
  const msgs = plan({ org, members, events, tasks, items, signups, cards, eventVendors, eventPeople, expenses, people, vendors, contacts, appUrl: env.APP_URL || '' }, now, sent)
    .filter((m) => !sent.has(m.key));
  return deliver(msgs, org, env, logFor(org.id), fetch);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ch = channels(env);
  try {
    // The schedule: every ministry.
    if (env.CRON_SECRET && req.headers.get('x-cron-secret') === env.CRON_SECRET) {
      const now = new Date(), orgs = await rows(db.from('ed_orgs').select('id, name, email, timezone, auto_remind'));
      const out: any = {};
      for (const o of orgs) {
        try { out[o.id] = await runOrg(o, now); } catch (e) { out[o.id] = { error: String((e as Error).message || e) }; }
        await db.from('ed_orgs').update({ notify_seen_at: now.toISOString(), notify_channels: [ch.email ? 'email' : '', ch.text ? 'text' : ''].filter(Boolean).join(',') }).eq('id', o.id);
      }
      return json({ ok: true, channels: ch, orgs: out });
    }
    // From the app: a signed-in member asks for the status, or a test message to themselves.
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = await db.auth.getUser(token);
    if (!u || !u.user) return json({ error: 'Sign in first.' }, 401);
    const mem = (await rows(db.from('ed_members').select('org_id, user_id, email, name, phone').eq('user_id', u.user.id)))[0];
    if (!mem) return json({ error: 'No ministry for this login.' }, 403);
    const body = await req.json().catch(() => ({}));
    if (body.action === 'test') {
      const org = (await rows(db.from('ed_orgs').select('id, name, email').eq('id', mem.org_id)))[0];
      const r = await deliver(testMessages(mem, org), org, env, logFor(org.id), fetch);
      return json({ ok: r.failed === 0, channels: ch, ...r });
    }
    return json({ ok: true, channels: ch });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
