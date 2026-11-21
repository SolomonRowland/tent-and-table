// Tent & Table: sends an event's designed email (see mail.js in the app) through Resend.
//
// The app saves the finished email (ed_mailings.html) and one row per person (ed_mail_rcpt), then calls this:
//   { action: 'test', mailing_id }  one copy to the signed-in person
//   { action: 'send', mailing_id }  the next 100 people still waiting; the app calls again until none are left
// Each person's copy gets their first name, their own RSVP link and their own unsubscribe link.
// Anyone who unsubscribed is skipped. A person is marked before the next batch starts, so nobody gets it twice.
//
// Secrets: RESEND_API_KEY (required). NOTIFY_FROM_EMAIL (optional) is the "from" address on your verified
// domain, for example  GGG Ministries <hello@yourministry.org>. Without it, mail comes from Resend's test
// address, which only delivers to the email you signed up to Resend with.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const env = Deno.env.toObject();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fromLine(orgName: string) {
  const f = env.NOTIFY_FROM_EMAIL || 'onboarding@resend.dev';
  const addr = (/<([^>]+)>/.exec(f) || [, f])[1].trim();
  return `${String(orgName || 'Tent & Table').replace(/[<>"]/g, '')} <${addr}>`;
}
function personalize(html: string, m: any, r: { id?: string; name: string }) {
  const first = String(r.name || '').trim().split(/\s+/)[0] || 'Friend';
  const unsub = r.id ? `${m.base_url}#/u/${r.id}` : m.base_url;
  return html.replace(/\{\{first_name\}\}/g, esc(first)).replace(/\{\{guest\}\}/g, r.id ? `/g/${r.id}` : '').replace(/\{\{unsub_url\}\}/g, unsub);
}
function one(m: any, org: any, r: { id?: string; name: string; email: string }, test = false) {
  const msg: any = { from: fromLine(org.name), to: [r.email], subject: (test ? '[Test] ' : '') + m.subject, html: personalize(m.html, m, r) };
  if (org.email) msg.reply_to = org.email;
  if (r.id) msg.headers = { 'List-Unsubscribe': `<${m.base_url}#/u/${r.id}>` };
  return msg;
}
async function resend(path: string, body: unknown) {
  const res = await fetch('https://api.resend.com' + path, { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}
function friendly(status: number, text: string) {
  if (/daily_quota|quota/i.test(text)) return 'Today’s sending limit on your Resend plan is used up. The rest will go when you tap Send again tomorrow, or sooner on a paid plan.';
  if (/verify a domain|testing emails|own email address/i.test(text)) return 'Resend is still in test mode, so it only delivers to your own email. Verify your ministry’s domain in Resend to send to everyone.';
  if (status === 401 || status === 403 && /api key/i.test(text)) return 'The Resend key isn’t right. Check the RESEND_API_KEY secret.';
  return 'The email service said: ' + text.slice(0, 200);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = await db.auth.getUser(token);
    if (!u || !u.user) return json({ error: 'Sign in first.' }, 401);
    const body = await req.json().catch(() => ({}));
    const { data: mems } = await db.from('ed_members').select('org_id, email, name').eq('user_id', u.user.id);
    const mem = mems && mems[0];
    if (!mem) return json({ error: 'No ministry for this login.' }, 403);
    const { data: m } = await db.from('ed_mailings').select('*').eq('id', body.mailing_id).eq('org_id', mem.org_id).maybeSingle();
    if (!m) return json({ error: 'That email wasn’t found. Save it and try again.' }, 404);
    if (!env.RESEND_API_KEY) return json({ error: 'Email sending isn’t set up yet: the RESEND_API_KEY secret is missing.' }, 400);
    const { data: org } = await db.from('ed_orgs').select('id, name, email').eq('id', mem.org_id).single();

    if (body.action === 'test') {
      const to = mem.email || u.user.email;
      if (!to) return json({ error: 'Your login has no email address to send a test to.' }, 400);
      const r = await resend('/emails', one(m, org, { name: mem.name || '', email: to }, true));
      if (!r.ok) return json({ error: friendly(r.status, r.text) }, 400);
      return json({ ok: true, to });
    }

    if (body.action === 'send') {
      const { data: batch } = await db.from('ed_mail_rcpt').select('id, email, name').eq('mailing_id', m.id).eq('status', 'queued').order('created_at').limit(100);
      const list = batch || [];
      if (list.length) {
        const { data: un } = await db.from('ed_unsub').select('email').eq('org_id', m.org_id);
        const gone = new Set((un || []).map((x: any) => String(x.email).toLowerCase()));
        const skip = list.filter((r: any) => gone.has(String(r.email).toLowerCase())), go = list.filter((r: any) => !gone.has(String(r.email).toLowerCase()));
        if (skip.length) await db.from('ed_mail_rcpt').update({ status: 'skipped' }).in('id', skip.map((r: any) => r.id));
        if (go.length) {
          const r = await resend('/emails/batch', go.map((x: any) => one(m, org, x)));
          if (r.ok) await db.from('ed_mail_rcpt').update({ status: 'sent', sent_at: new Date().toISOString() }).in('id', go.map((x: any) => x.id));
          else if (r.status === 429 || /quota|verify a domain|testing emails|own email address|api key/i.test(r.text)) return json({ error: friendly(r.status, r.text) }, 400); // nothing marked: they go next time
          else await db.from('ed_mail_rcpt').update({ status: 'failed', error: r.text.slice(0, 300) }).in('id', go.map((x: any) => x.id));
        }
      }
      const count = async (s: string) => (await db.from('ed_mail_rcpt').select('id', { count: 'exact', head: true }).eq('mailing_id', m.id).eq('status', s)).count || 0;
      const left = await count('queued');
      if (!left) {
        const stats = { sent: await count('sent'), failed: await count('failed'), skipped: await count('skipped') };
        await db.from('ed_mailings').update({ status: 'sent', sent_at: new Date().toISOString(), fields: { ...(m.fields || {}), stats } }).eq('id', m.id);
        return json({ ok: true, left: 0, ...stats });
      }
      return json({ ok: true, left });
    }
    return json({ error: 'Unknown action.' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
