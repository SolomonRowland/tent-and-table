// Sends planned messages through Resend (email) and Twilio (text), logging each key first so
// two runs at once can never send the same message twice.

export function e164(p) {
  const s = String(p || '').trim(), d = s.replace(/[^0-9]/g, '');
  if (s.startsWith('+') && d.length >= 8) return '+' + d;
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d[0] === '1') return '+' + d;
  return '';
}

export function channels(env) {
  return { email: !!(env.RESEND_API_KEY && env.NOTIFY_FROM_EMAIL), text: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM) };
}

async function sendEmail(env, fetchFn, m, org) {
  const body = { from: env.NOTIFY_FROM_EMAIL, to: [m.to.email], subject: m.subject || ('A note from ' + (org.name || 'Tent & Table')), text: m.text };
  if (org.email) body.reply_to = org.email;
  const r = await fetchFn('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Email ' + r.status + ': ' + (await r.text()).slice(0, 200));
}

async function sendText(env, fetchFn, m) {
  const to = e164(m.to.phone); if (!to) throw new Error('Not a phone number we can text: ' + m.to.phone);
  const f = new URLSearchParams({ To: to, Body: m.text.slice(0, 1500) });
  if (/^MG/.test(env.TWILIO_FROM)) f.set('MessagingServiceSid', env.TWILIO_FROM); else f.set('From', env.TWILIO_FROM);
  const auth = btoa(env.TWILIO_ACCOUNT_SID + ':' + env.TWILIO_AUTH_TOKEN);
  const r = await fetchFn('https://api.twilio.com/2010-04-01/Accounts/' + env.TWILIO_ACCOUNT_SID + '/Messages.json', { method: 'POST', headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' }, body: f.toString() });
  if (!r.ok) throw new Error('Text ' + r.status + ': ' + (await r.text()).slice(0, 200));
}

/*
  log = { claim(row) -> Promise<boolean> (true when the key was new), done(key, status, error) }
  Returns { sent, failed, skipped }
*/
export async function deliver(msgs, org, env, log, fetchFn, limit = 300) {
  const ok = channels(env), res = { sent: 0, failed: 0, skipped: 0, errors: [] };
  for (const m of msgs.slice(0, limit)) {
    if (!ok[m.channel]) { res.skipped++; continue; } // that channel isn't set up; nothing is logged, so it goes out once it is
    const to = m.channel === 'email' ? m.to.email : m.to.phone;
    if (!(await log.claim({ org_id: org.id, key: m.key, kind: m.kind, channel: m.channel, to_name: m.to.name || '', to_addr: to, subject: m.subject || '', status: 'sending' }))) { res.skipped++; continue; }
    for (const k of m.rows || []) await log.claim({ org_id: org.id, key: k, kind: m.kind, channel: m.channel, to_name: m.to.name || '', to_addr: to, subject: '', status: 'batched' });
    try {
      if (m.channel === 'email') await sendEmail(env, fetchFn, m, org); else await sendText(env, fetchFn, m);
      await log.done(m.key, 'sent', ''); res.sent++;
    } catch (e) {
      await log.done(m.key, 'failed', String(e.message || e).slice(0, 300)); res.failed++; res.errors.push(String(e.message || e));
    }
  }
  return res;
}
