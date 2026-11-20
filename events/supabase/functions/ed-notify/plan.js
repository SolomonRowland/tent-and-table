// Tent & Table automatic notices: decides who gets which text or email, and when.
// Pure logic, no network: index.ts loads the rows, calls plan(), sends, and logs.
// Every message has a key; a key that is already in ed_notify_log is never sent twice.

export const SEND_HOUR = 7; // daily notices go out on the first run after 7 AM in the ministry's time zone
const DEF = { weekly: true, tasks: true, payments: true, signups: false, cards: true, events: true, channel: 'email' };

// Local date (YYYY-MM-DD), hour and weekday (0 = Sunday) in a time zone.
export function localNow(now, tz) {
  const parts = {};
  new Intl.DateTimeFormat('en-US', { timeZone: tz || 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' })
    .formatToParts(now).forEach((p) => { parts[p.type] = p.value; });
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: +parts.hour, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday) };
}
export function addDays(day, n) { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const digits = (s) => String(s || '').replace(/[^0-9]/g, '').replace(/^1(?=\d{10}$)/, '');
const low = (s) => String(s || '').trim().toLowerCase();
const first = (n) => String(n || '').replace(/^(pastor|rev\.?|evangelist|dr\.?)\s+/i, '').split(/\s+/)[0] || 'there';
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const capped = (lines, n = 10) => lines.slice(0, n).join('\n') + (lines.length > n ? '\n…and ' + (lines.length - n) + ' more' : '');
const money = (n) => '$' + Math.round(+n || 0).toLocaleString('en-US');
function fmtDay(day) { return new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }); }
function fmtTime(t) { if (!t) return ''; const [h, m] = String(t).split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12; return hh + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap; }
function secOn(s, sec) { s = s || []; return !s.length || s.indexOf(sec) >= 0 || s.indexOf('v2') < 0; }

/*
  d = { org, members, events, tasks, items, signups, cards, eventVendors, eventPeople, expenses, people, vendors, contacts, appUrl }
  sent = Set of keys already in ed_notify_log.
  Returns [{ key, rows, kind, to: { name, email, phone }, channel: 'email' | 'text', subject, text }]
  (rows: extra keys to log with it, so each sign-up or card is announced once even when batched)
*/
export function plan(d, now, sent) {
  sent = sent || new Set();
  const org = d.org, L = localNow(now, org.timezone), today = L.day, tomorrow = addDays(today, 1), sig = org.name ? ' – ' + org.name : '';
  const daily = L.hour >= SEND_HOUR, out = [];
  const evById = {}; (d.events || []).forEach((e) => { evById[e.id] = e; });
  const itemById = {}; (d.items || []).forEach((i) => { itemById[i.id] = i; });
  const contact = {}; [['ed_people', d.people], ['ed_vendors', d.vendors], ['ed_contacts', d.contacts]].forEach(([t, rows]) => (rows || []).forEach((r) => { contact[t + ':' + r.id] = r; }));
  const members = (d.members || []).map((m) => ({ ...m, p: { ...DEF, ...(m.prefs || {}) } }));
  const memberOf = (c) => c && members.find((m) => (m.email && c.email && low(m.email) === low(c.email)) || (m.phone && c.phone && digits(m.phone) === digits(c.phone)) || (m.name && low(m.name) === low(c.name)));
  const named = (m, text) => { const n = low(m.name); return n && String(text || '').split(/,\s*|\s+and\s+|\s*&\s*|\s*\/\s*/).some((x) => low(x) === n); };
  // A member's notice goes by their chosen channel(s), as long as they have that address.
  const toMember = (m, kind, key, subject, text, rows) => {
    const ch = m.p.channel === 'both' ? ['email', 'text'] : [m.p.channel === 'text' ? 'text' : 'email'];
    ch.forEach((c) => { if (c === 'email' ? m.email : m.phone) out.push({ key: key + ':' + c, rows: (rows || []).map((r) => r + ':' + c), kind, to: { name: m.name || m.email, email: m.email, phone: m.phone }, channel: c, subject, text }); });
  };
  const fresh = (rows, pre, m) => rows.filter((r) => { const ch = m.p.channel === 'both' ? ['email', 'text'] : [m.p.channel === 'text' ? 'text' : 'email']; return ch.some((c) => !sent.has(pre + m.user_id + ':' + r.id + ':' + c)); });
  const link = d.appUrl ? '\n\n' + d.appUrl : '';
  const recent = (r) => r.created_at && now - new Date(r.created_at) < 2 * 864e5; // never notify about old rows on a first run

  // 1. Right away: new sign-ups and new connection cards, one message per member per batch.
  const newSu = (d.signups || []).filter(recent), newCards = (d.cards || []).filter(recent);
  members.forEach((m) => {
    const su = fresh(newSu, 'su:', m), cards = fresh(newCards, 'card:', m);
    if (m.p.signups && su.length) {
      const lines = su.map((s) => { const i = itemById[s.item_id] || {}, e = evById[s.event_id] || {}; return '• ' + s.name + ': ' + (i.title || 'sign-up') + (e.title ? ' (' + e.title + ')' : ''); });
      toMember(m, 'signups', 'su:' + m.user_id + ':' + su[0].id, plural(su.length, 'new sign-up'), 'New sign-ups:\n' + capped(lines) + link, su.map((x) => 'su:' + m.user_id + ':' + x.id));
    }
    if (m.p.cards && cards.length) {
      const lines = cards.map((c) => '• ' + c.name + ((c.responses || [])[0] ? ': ' + c.responses[0] : '') + ((evById[c.event_id] || {}).title ? ' (' + evById[c.event_id].title + ')' : ''));
      toMember(m, 'cards', 'card:' + m.user_id + ':' + cards[0].id, plural(cards.length, 'new connection card'), 'New connection cards:\n' + capped(lines) + link, cards.map((x) => 'card:' + m.user_id + ':' + x.id));
    }
  });
  if (!daily) return out;

  const live = (e) => e && (e.ends_on || e.starts_on || '9999') >= today;
  const open = (d.tasks || []).filter((t) => !t.done && live(evById[t.event_id]));

  // 2. Every morning, for members who want them.
  members.forEach((m) => {
    if (m.p.tasks) {
      const mine = open.filter((t) => t.due_on && t.due_on >= today && t.due_on <= tomorrow && ((t.assignee_refs || []).some((r) => memberOf(contact[r]) === m) || named(m, t.owner)));
      if (mine.length) toMember(m, 'tasks', 'tasks:' + m.user_id + ':' + today, mine.length === 1 ? 'Task due: ' + mine[0].title : plural(mine.length, 'task') + ' due soon',
        'Your tasks due soon:\n' + mine.map((t) => '• ' + t.title + ' (' + (evById[t.event_id] || {}).title + ', due ' + (t.due_on === today ? 'today' : 'tomorrow') + (t.due_time ? ' by ' + t.due_time : '') + ')').join('\n') + link);
    }
    if (m.p.payments) {
      const due = addDays(today, 3), pays = [];
      const add = (r, what, amt) => { if (r.due_on === due && r.pay_status !== 'Paid In Full' && amt > 0 && named(m, r.payer) && live(evById[r.event_id])) pays.push('• ' + what + ': ' + money(amt) + ' (' + evById[r.event_id].title + ')'); };
      (d.eventVendors || []).forEach((r) => add(r, (contact['ed_vendors:' + r.vendor_id] || {}).name || 'Vendor', (+r.cost || 0) - (+r.paid || 0)));
      (d.eventPeople || []).forEach((r) => add(r, (contact['ed_people:' + r.person_id] || {}).name || 'Payment', +r.amount || 0));
      (d.expenses || []).forEach((r) => add(r, r.description || 'Expense', +r.amount || 0));
      if (pays.length) toMember(m, 'payments', 'pay:' + m.user_id + ':' + today, plural(pays.length, 'payment') + ' due ' + fmtDay(due), 'Payments you’re responsible for, due ' + fmtDay(due) + ':\n' + pays.join('\n') + link);
    }
    if (m.p.events) (d.events || []).forEach((e) => {
      const n = e.starts_on === addDays(today, 7) ? 7 : e.starts_on === tomorrow ? 1 : 0; if (!n) return;
      const left = open.filter((t) => t.event_id === e.id).length;
      toMember(m, 'events', 'ev:' + e.id + ':' + n + ':' + m.user_id, e.title + (n === 1 ? ' is tomorrow' : ' is a week away'),
        e.title + (n === 1 ? ' starts tomorrow' : ' starts in one week') + ', ' + fmtDay(e.starts_on) + (e.time_label ? ', ' + e.time_label : '') + (e.place ? ' at ' + e.place : '') + '.' + (left ? ' ' + plural(left, 'task') + ' still open.' : '') + link);
    });
    if (m.p.weekly && L.dow === 1) {
      const soon = (d.events || []).filter((e) => e.starts_on && e.starts_on >= today && e.starts_on <= addDays(today, 14));
      const late = open.filter((t) => t.due_on && t.due_on < today).length, week = open.filter((t) => t.due_on && t.due_on >= today && t.due_on <= addDays(today, 7)).length;
      const owed = (d.eventVendors || []).filter((r) => live(evById[r.event_id])).reduce((s, r) => s + Math.max(0, (+r.cost || 0) - (+r.paid || 0)), 0);
      const lines = soon.map((e) => '• ' + e.title + ', ' + fmtDay(e.starts_on));
      toMember(m, 'weekly', 'wk:' + m.user_id + ':' + today, 'This week at ' + (org.name || 'Tent & Table'),
        'Good morning! Here’s the week:\n' + (lines.length ? 'Coming up:\n' + lines.join('\n') + '\n' : 'No events in the next two weeks.\n') +
        plural(week, 'task') + ' due this week' + (late ? ', ' + late + ' overdue' : '') + '.' + (owed ? ' Still owed to vendors: ' + money(owed) + '.' : '') + link);
    }
  });

  // 3. The day before: volunteers and meal sign-ups, and anyone with a task due (only when the ministry turned this on).
  if (org.auto_remind) {
    const already = (c) => { const m = memberOf(c); return m && m.p.tasks; };
    (d.items || []).forEach((i) => {
      const e = evById[i.event_id]; if (!e || (i.kind !== 'serve' && i.kind !== 'meal')) return;
      if ((i.on_date || e.starts_on) !== tomorrow || !secOn(e.sections, i.kind === 'meal' ? 'food' : 'volunteers')) return;
      const when = i.time_label || '';
      (d.signups || []).filter((s) => s.item_id === i.id).forEach((s) => {
        const msg = 'Hi ' + first(s.name) + ', a reminder that you’re ' + (i.kind === 'meal' ? 'bringing ' + i.title : 'serving on ' + i.title) + ' at ' + e.title + ' tomorrow' + (when ? ', ' + when : '') + (e.place ? ' at ' + e.place : '') + '. Thank you!' + sig;
        const c = s.phone ? 'text' : s.email ? 'email' : ''; if (c) out.push({ key: 'rem:' + today + ':s:' + s.id, kind: 'reminder', to: { name: s.name, email: s.email, phone: s.phone }, channel: c, subject: 'Tomorrow: ' + i.title + ' at ' + e.title, text: msg });
      });
    });
    (d.eventPeople || []).filter((x) => x.team === 'volunteer').forEach((x) => {
      const e = evById[x.event_id], c = contact['ed_people:' + x.person_id]; if (!e || !c || e.starts_on !== tomorrow || !secOn(e.sections, 'volunteers')) return;
      const ch = c.phone ? 'text' : c.email ? 'email' : ''; if (!ch) return;
      out.push({ key: 'rem:' + today + ':v:' + x.id, kind: 'reminder', to: { name: c.name, email: c.email, phone: c.phone }, channel: ch, subject: 'Tomorrow: ' + e.title,
        text: 'Hi ' + first(c.name) + ', a reminder that you’re serving at ' + e.title + ' tomorrow' + (e.time_label ? ', ' + e.time_label : '') + (e.place ? ' at ' + e.place : '') + '. Thank you!' + sig });
    });
    open.filter((t) => t.due_on === tomorrow).forEach((t) => (t.assignee_refs || []).forEach((r) => {
      const c = contact[r]; if (!c || already(c)) return;
      const ch = c.phone ? 'text' : c.email ? 'email' : ''; if (!ch) return;
      out.push({ key: 'rem:' + today + ':t:' + t.id + ':' + c.id, kind: 'reminder', to: { name: c.name, email: c.email, phone: c.phone }, channel: ch, subject: 'Due tomorrow: ' + t.title,
        text: 'Hi ' + first(c.name) + ', a reminder that “' + t.title + '” for ' + (evById[t.event_id] || {}).title + ' is due tomorrow' + (t.due_time ? ' by ' + t.due_time : '') + '. Thank you!' + sig });
    }));
  }
  return out;
}

// The test message the Settings page sends to the person who taps it.
export function testMessages(member, org) {
  const text = 'This is a test from ' + (org.name || 'Tent & Table') + '. Automatic texts and emails are working.';
  const out = [];
  if (member.email) out.push({ key: 'test:' + Date.now() + ':email', kind: 'test', to: member, channel: 'email', subject: 'Test from Tent & Table', text });
  if (member.phone) out.push({ key: 'test:' + Date.now() + ':text', kind: 'test', to: member, channel: 'text', subject: '', text });
  return out;
}
export { fmtTime };
