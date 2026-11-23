// Tent & Table: the private calendar link a phone's calendar subscribes to.
//
//   GET /functions/v1/ed-cal?t=<token>   ->  an .ics calendar
//
// The token (from ed_cal, made in the app under Settings > Calendar) is the only key, so this function
// must have "Verify JWT" turned off: calendar apps can't sign in. It reads with the service role and only
// ever returns the one ministry and the one person the token belongs to.
//
// What's in it: every event from 30 days ago on (each session if the event has sessions, otherwise each
// day at the event's start and end time, otherwise all day), the person's open tasks that have a due date,
// and the schedule items they're in charge of. Times are the event's own local times.
// The same rules are in icsBuild() in app.js, which makes the one-time download; keep the two in step.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const env = Deno.env.toObject();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const esc = (s: unknown) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
const fold = (l: string) => { let out = ''; while (l.length > 73) { out += l.slice(0, 73) + '\r\n '; l = l.slice(73); } return out + l; };
const day = (d: string) => d.replace(/-/g, '');
const time = (d: string, t: string | null) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return day(d) + 'T' + (m ? m[1].padStart(2, '0') + m[2] : '0000') + '00'; };
const addDays = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const lower = (a: string[]) => (a || []).map((x) => String(x).toLowerCase());
const splitNames = (s: string) => String(s || '').split(/\s*,\s*/).filter(Boolean); // same as the app

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('t') || '';
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response('Not found', { status: 404 });
  const { data: cal } = await db.from('ed_cal').select('*').eq('token', token).maybeSingle();
  if (!cal) return new Response('This calendar link was turned off or reset.', { status: 404 });

  const since = addDays(new Date().toISOString().slice(0, 10), -30);
  const [{ data: org }, { data: evs }] = await Promise.all([
    db.from('ed_orgs').select('name').eq('id', cal.org_id).single(),
    db.from('ed_events').select('*').eq('org_id', cal.org_id),
  ]);
  const events = (evs || []).filter((e: any) => e.starts_on && (e.ends_on || e.starts_on) >= since);
  const ids = events.map((e: any) => e.id), byId: Record<string, any> = {};
  events.forEach((e: any) => (byId[e.id] = e));
  const [{ data: tasks }, { data: sched }] = ids.length
    ? await Promise.all([db.from('ed_tasks').select('*').in('event_id', ids), db.from('ed_schedule').select('*').in('event_id', ids)])
    : [{ data: [] }, { data: [] }];

  const refs: string[] = cal.refs || [], names = lower(cal.names);
  const named = (s: string) => splitNames(s).some((x) => names.includes(x.toLowerCase()));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tent & Table//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + esc((org?.name || 'Ministry') + ' · Tent & Table'), 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H'];
  const add = (uid: string, title: string, d: string, st?: string | null, et?: string | null, loc?: string, desc?: string, url?: string) => {
    if (!d) return;
    L.push('BEGIN:VEVENT', `UID:${uid}@tent-and-table`, 'DTSTAMP:' + stamp, 'SUMMARY:' + esc(title));
    if (st) {
      L.push('DTSTART:' + time(d, st));
      L.push('DTEND:' + (et && et > st ? time(d, et) : time(d, st).replace(/T(\d\d)/, (_m, h) => 'T' + String(Math.min(23, +h + 1)).padStart(2, '0'))));
    } else L.push('DTSTART;VALUE=DATE:' + day(d), 'DTEND;VALUE=DATE:' + day(addDays(et && /^\d{4}-/.test(et) ? et : d, 1)));
    if (loc) L.push('LOCATION:' + esc(loc));
    if (desc) L.push('DESCRIPTION:' + esc(desc));
    if (url) L.push('URL:' + url);
    L.push('END:VEVENT');
  };

  for (const e of events) {
    const loc = [e.place, e.address].filter(Boolean).join(', '), ss = Array.isArray(e.sessions) ? e.sessions : [];
    if (ss.length) for (const x of ss) add(`s-${e.id}-${x.id}`, `${e.title}: ${x.title}`, x.on_date || e.starts_on, x.start, x.end, loc, e.about);
    else if (e.start_time) for (let d = e.starts_on, n = 0; d <= (e.ends_on || e.starts_on) && n < 31; d = addDays(d, 1), n++) add(`e-${e.id}-${d}`, e.title, d, e.start_time, e.end_time, loc, e.about);
    else add(`e-${e.id}`, e.title, e.starts_on, null, e.ends_on || e.starts_on, loc, e.about);
  }
  for (const t of tasks || []) {
    if (t.done || !t.due_on) continue;
    if (!((t.assignee_refs || []).some((r: string) => refs.includes(r)) || named(t.owner))) continue;
    add(`t-${t.id}`, `Task: ${t.title} (${byId[t.event_id]?.title || ''})`, t.due_on, null, null, '', t.notes, cal.base_url || undefined);
  }
  for (const x of sched || []) {
    if (!(refs.includes(x.owner_ref) || named(x.owner))) continue;
    add(`c-${x.id}`, `${x.title} (${byId[x.event_id]?.title || ''})`, x.on_date, x.start_time, x.end_time, x.location, x.notes);
  }
  L.push('END:VCALENDAR');
  return new Response(L.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=300', 'Access-Control-Allow-Origin': '*' },
  });
});
