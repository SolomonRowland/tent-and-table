/* Tent & Table: screens.
   Ministry level: Events, Directory and Account (bottom tabs).
   Each event opens in its own workspace with tabs for the sections it uses.
   Public pages (no account): #/e/<slug> to sign up, #/c/<slug> connection card. */

/* ================================================================ helpers */
function $(s, el) { return (el || document).querySelector(s); }
function $$(s, el) { return Array.from((el || document).querySelectorAll(s)); }
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
function money(n) { n = num(n); return (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
function plural(n, w, ws) { return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lset(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(); ks.reduce(function (a, k) { if (a[k] == null || typeof a[k] !== 'object') a[k] = {}; return a[k]; }, o)[last] = v; }
var TODAY = isoDay(new Date());
function dt(d) { return new Date(d + 'T12:00:00'); }
function fmtDay(d, opt) { if (!d) return ''; return dt(d).toLocaleDateString('en-US', opt || { weekday: 'short', month: 'short', day: 'numeric' }); }
function fmtLong(d) { return fmtDay(d, { weekday: 'long', month: 'long', day: 'numeric' }); }
function fmtRange(a, b) {
  if (!a) return 'No Date Yet';
  var A = dt(a), yr = A.getFullYear() !== new Date().getFullYear() ? ', ' + A.getFullYear() : '';
  if (!b || b === a) return fmtDay(a, { weekday: 'short', month: 'short', day: 'numeric' }) + yr;
  var B = dt(b);
  if (A.getMonth() === B.getMonth()) return A.toLocaleDateString('en-US', { month: 'short' }) + ' ' + A.getDate() + '–' + B.getDate() + yr;
  return fmtDay(a, { month: 'short', day: 'numeric' }) + ' – ' + fmtDay(b, { month: 'short', day: 'numeric' }) + yr;
}
function fmtTime(t) { if (!t) return ''; var m = /^(\d{1,2}):(\d{2})/.exec(t); if (!m) return t; var h = +m[1], ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + (m[2] === '00' ? '' : ':' + m[2]) + ' ' + ap; }
function countdown(ev) {
  if (!ev.starts_on) return '';
  var a = dayDiff(ev.starts_on, TODAY), b = dayDiff(ev.ends_on || ev.starts_on, TODAY);
  if (a > 1) return 'In ' + a + ' Days'; if (a === 1) return 'Tomorrow'; if (a <= 0 && b >= 0) return a === 0 && b === 0 ? 'Today' : 'Happening Now';
  return 'Finished';
}
function digits(p) { return String(p || '').replace(/[^0-9+]/g, ''); }
function webUrl(u) { u = String(u || '').trim(); if (!u) return ''; return /^https?:\/\//i.test(u) ? u : 'https://' + u.replace(/^[a-z]+:\/*/i, ''); }
function mapUrl(a) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a); }
function errMsg(e) {
  var m = String((e && (e.message || e.error_description || e.msg)) || e || '');
  if (/invalid login credentials/i.test(m)) return 'That email and password don’t match.';
  if (/already registered|user_already_exists/i.test(m)) return 'That email already has an account. Sign in instead.';
  if (/password should be|weak password/i.test(m)) return 'Use a password with at least 8 characters.';
  if (/email not confirmed/i.test(m)) return 'Confirm your email first, then sign in.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'Can’t connect right now. Check your connection and try again.';
  if (/column/i.test(m) && /schema cache/i.test(m)) return 'That didn’t save because the app and its database are out of step. Send a screenshot of this to whoever set up Tent & Table. (' + m + ')';
  if (/does not exist|schema cache/i.test(m)) return 'The database needs an update before this will work. Whoever set up Tent & Table can fix it by running the latest schema.sql in Supabase.';
  if (/duplicate key|unique/i.test(m)) return 'That’s already been added.';
  return m || 'Something went wrong. Try again.';
}
var IC = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  more: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  tent: '<svg width="20" height="20" viewBox="100 80 312 316" fill="currentColor" aria-hidden="true"><path d="M252 84C262 128 300 164 398 180L388 190C390 250 396 316 404 390H390C378 318 364 254 354 214Q256 232 158 214C148 254 134 318 122 390H108C116 316 122 250 124 190L114 180C206 164 242 128 252 84Z"/><path d="M178 290H334L340 304H172Z"/><rect x="184" y="302" width="11" height="70" rx="5"/><rect x="317" y="302" width="11" height="70" rx="5"/><rect x="214" y="302" width="9" height="50" rx="4" opacity=".75"/><rect x="289" y="302" width="9" height="50" rx="4" opacity=".75"/></svg>',
  cal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5"/></svg>',
  user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  phone: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>',
  text: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  mail: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
  pin: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  web: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg>',
  warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/></svg>',
  gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  users: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/></svg>',
  list: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  store: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6"/></svg>',
  food: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v9a2 2 0 002 2v9M5 2v6M9 2v6M17 2c-2 2-3 5-3 8h3v12"/></svg>',
  check2: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12.5l3 3 5-6"/></svg>',
  dollar: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  heart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z"/></svg>',
  share: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>'
};

/* ================================================================ vocab */
var GROUPS = ['Team Member', 'Board', 'Worship', 'Speaker', 'Prayer Team', 'Volunteer', 'Guest'];
var TEAM_GROUPS = ['Team Member', 'Board', 'Worship', 'Speaker', 'Prayer Team'];
// Every person or business is a contact, and every contact has one of these types, inside an event and out.
var CTYPES = [['team', 'Team', 'Team'], ['volunteer', 'Volunteers', 'Volunteer'], ['guest', 'Guests', 'Guest'], ['vendor', 'Vendors', 'Vendor'], ['other', 'Other', 'Other']];
var CTYPE_HINT = { team: 'Leaders, board, staff, worship, speakers, prayer team.', volunteer: 'People who serve at your events.', guest: 'People who attend: RSVPs and connection cards.', vendor: 'Businesses you hire: tent, sound, food, printing.', other: 'Landowners, permit offices, partner churches, officials.' };
var CTYPE_TONE = { team: 'red', volunteer: 'green', guest: 'blue', vendor: 'amber', other: 'slate' };
function ctypeOne(k) { return (CTYPES.find(function (c) { return c[0] === k; }) || [, , 'Other'])[2]; }
function personTypes(p) {
  var g = p.groups || [], out = [];
  if (g.some(function (x) { return TEAM_GROUPS.indexOf(x) >= 0; })) out.push('team');
  if (g.indexOf('Volunteer') >= 0) out.push('volunteer');
  if (g.indexOf('Guest') >= 0) out.push('guest');
  return out.length ? out : ['other'];
}
function allContacts() {
  return T('ed_people').map(function (r) { return { t: 'ed_people', r: r, name: r.name, types: personTypes(r), detail: [r.title], phone: r.phone, email: r.email, status: r.status || 'current' }; })
    .concat(T('ed_vendors').map(function (r) { return { t: 'ed_vendors', r: r, name: r.name, types: ['vendor'], detail: [r.contact_name, r.category], phone: r.phone, email: r.email, status: 'current' }; }))
    .concat(T('ed_contacts').map(function (r) { return { t: 'ed_contacts', r: r, name: r.name, types: ['other'], detail: [r.role, r.organization], phone: r.phone, email: r.email, status: 'current' }; }))
    .sort(function (x, y) { return x.name.localeCompare(y.name); });
}
// A link to any contact, kept as "table:id" (ed_people, ed_vendors or ed_contacts).
function refOf(c) { return c.t + ':' + c.r.id; }
function refContact(ref) { if (!ref) return null; var i = ref.indexOf(':'), t = ref.slice(0, i), id = ref.slice(i + 1), r = byId(t, id); if (!r) return null; return allContacts().find(function (c) { return c.t === t && c.r.id === id; }) || null; }
// Picking a contact fills in the name, so print-outs and old rows still read right.
function refSync(v) { [['leader_ref', 'leader'], ['owner_ref', 'owner'], ['follow_up_ref', 'follow_up_by']].forEach(function (p) { if (p[0] in v) { var c = refContact(v[p[0]]); if (c) v[p[1]] = c.name; else if (!v[p[0]]) v[p[0]] = ''; } }); return v; }
// Who can take a task: team (staff, board, prayer team), volunteers, vendors and other contacts. Not guests, worship or speakers.
var TASK_GROUPS = ['Team Member', 'Board', 'Prayer Team', 'Volunteer'];
function taskEligible(c) { return c.t !== 'ed_people' || (c.r.groups || []).some(function (g) { return TASK_GROUPS.indexOf(g) >= 0; }) || !(c.r.groups || []).length; }
function refNames(refs) { return (refs || []).map(refContact).filter(Boolean).map(function (c) { return c.name; }); }
function splitNames(s) { return String(s || '').split(/\s*,\s*/).filter(Boolean); }
function taskPeople(t) { var n = refNames(t.assignee_refs); return n.concat(splitNames(t.owner).filter(function (x) { return n.indexOf(x) < 0; })); }
function refPill(ref) { var c = refContact(ref); return c ? pill(ctypeOne(c.types[0]), 'tone-' + CTYPE_TONE[c.types[0]]) : ''; }
// The one contact row: name on top, what they do and how to reach them underneath, type on the right.
function contactSub(detail, phone, email) { var d = detail.filter(Boolean), c = phone || email; return esc(d.join(' · ')) + (c ? (d.length ? ' · ' : '') + '<span class="nw">' + esc(c) + '</span>' : ''); }
function contactRow(c) {
  return row({ act: 'dir-open', id: c.r.id, t: c.t, lead: avatar(c.name, CTYPE_TONE[c.types[0]]), title: esc(c.name) + (c.status === 'previous' ? ' ' + pill('Previous') : ''), sub: contactSub(c.detail, c.phone, c.email), right: pill(ctypeOne(c.types[0]), 'tone-' + CTYPE_TONE[c.types[0]]) });
}
var TITLES = ['Founder', 'President', 'Vice President', 'Pastor', 'Board Member', 'Treasurer', 'Secretary', 'Events Director', 'Worship Director', 'Worship Leader', 'Songwriter', 'Vocalist', 'Musician', 'Sound Engineer', 'Speaker', 'Guest Speaker', 'In-House Speaker', 'Evangelist', 'Prayer Director', 'Altar Counselor', 'Volunteer Coordinator', 'Volunteer'];
var VENDOR_CATS = ['Tent', 'Sound And Lights', 'Food', 'Restrooms', 'Rentals', 'Printing', 'Security', 'Power', 'Venue', 'Other'];
var GEAR_CATS = ['Sound', 'Power', 'Tables And Chairs', 'Tents', 'Stage', 'Parking', 'Ushers', 'Kids', 'Baptism', 'Hospitality', 'Other'];
var PAY = ['Not Paid', 'Deposit Paid', 'Paid In Full'];
var TEAMS = [['leader', 'Leadership'], ['team', 'Ministry Team'], ['speaker', 'Speakers'], ['worship', 'Worship Team'], ['volunteer', 'Volunteers']];
var CARD_TONE = { new: 'red', contacted: 'amber', connected: 'green' };
function cardStatusLabel(s) { return { new: 'New', contacted: 'Contacted', connected: 'Connected' }[s] || s; }
var DECISIONS = [['I gave my life to Jesus', 'Salvations'], ['I recommitted my life to Jesus', 'Recommitments'], ['I’d like someone to pray with me', 'Prayer'], ['I’m looking for a church home', 'Church Home'], ['I’d like to be baptized', 'Baptism'], ['I’d like to serve', 'Want To Serve']];
function decisionTiles(cards) {
  return '<div class="stats glance">' + DECISIONS.map(function (d) { var n = cards.filter(function (c) { return (c.responses || []).indexOf(d[0]) >= 0; }).length; return stat(d[1], n, d[1] === 'Salvations' && n > 0); }).join('') + '</div>';
}
var RESPONSES = ['I gave my life to Jesus', 'I recommitted my life to Jesus', 'I’d like someone to pray with me', 'I’m looking for a church home', 'I’d like to be baptized', 'I’d like to serve'];
var PHASES = [['planning', 'Planning'], ['prep', 'Prep'], ['setup', 'Setup'], ['during', 'During The Event'], ['teardown', 'Teardown'], ['followup', 'After The Event']];
var TASK_AREAS = ['Hospitality', 'Food', 'Stage', 'AV And Sound', 'Worship', 'Kids', 'Parking', 'Security', 'Prayer', 'Decor', 'Setup Crew', 'Admin'];
function phaseOf(t) { return PHASES.some(function (p) { return p[0] === t.phase; }) ? t.phase : 'planning'; }
function phaseLbl(k) { return (PHASES.find(function (p) { return p[0] === k; }) || [, 'Planning'])[1]; }
function taskAreas(list) {
  var seen = {}, out = [];
  TASK_AREAS.concat(list.map(function (t) { return t.area || ''; })).forEach(function (x) { if (x && !seen[x.toLowerCase()] && list.some(function (t) { return (t.area || '').toLowerCase() === x.toLowerCase(); })) { seen[x.toLowerCase()] = 1; out.push(x); } });
  return out;
}
// Groups tasks by segment or by area, optionally only one area ('-' means tasks with no area).
function taskGroups(by, area) {
  var all = evRows('ed_tasks').filter(function (t) { return !area || (area === '-' ? !t.area : (t.area || '').toLowerCase() === area.toLowerCase()); });
  var srt = function (x, y) { return PHASES.findIndex(function (p) { return p[0] === phaseOf(x); }) - PHASES.findIndex(function (p) { return p[0] === phaseOf(y); }) || String(x.due_on || '9').localeCompare(String(y.due_on || '9')) || x.sort - y.sort; };
  var keys = by === 'area' ? taskAreas(all).map(function (x) { return [x, x]; }).concat([['', 'No Area Yet']]) : PHASES;
  return { all: all, groups: keys.map(function (k) {
    return [k[1], all.filter(function (t) { return by === 'area' ? (t.area || '').toLowerCase() === k[0].toLowerCase() : phaseOf(t) === k[0]; }).sort(srt)];
  }).filter(function (g) { return g[1].length; }) };
}
function areaSelect(id, chg, cur) {
  var all = evRows('ed_tasks'), list = taskAreas(all), none = all.filter(function (t) { return !t.area; }).length;
  return '<label class="sr" for="' + id + '">Area</label><select class="inp sm" id="' + id + '" data-change="' + chg + '"><option value="">All Areas · ' + all.length + '</option>' +
    list.map(function (x) { return '<option value="' + esc(x) + '"' + (cur === x ? ' selected' : '') + '>' + esc(x) + ' · ' + all.filter(function (t) { return (t.area || '').toLowerCase() === x.toLowerCase(); }).length + '</option>'; }).join('') +
    (none && list.length ? '<option value="-"' + (cur === '-' ? ' selected' : '') + '>No Area · ' + none + '</option>' : '') + '</select>';
}
var TABS = [['overview', 'Overview'], ['calendar', 'Calendar'], ['people', 'People'], ['agenda', 'Agenda'], ['vendors', 'Vendors & Contacts'], ['equipment', 'Equipment'], ['food', 'Food'], ['tasks', 'Tasks'], ['money', 'Money'], ['followup', 'Follow-Up'], ['share', 'Share']];
var SECTIONS = [['calendar', 'Schedule'], ['agenda', 'Agenda'], ['people', 'Leadership And Team'], ['speakers', 'Speakers'], ['worship', 'Worship Team'], ['volunteers', 'Volunteers'], ['food', 'Meals'], ['guests', 'Guests And RSVPs'], ['vendors', 'Vendors And Contacts'], ['equipment', 'Equipment'], ['money', 'Money'], ['followup', 'Connection Cards'], ['prayer', 'Prayer']];
// Events saved before speakers, worship, volunteers and guests had their own switches follow the old People switch.
var LEGACY_SEC = { speakers: 'people', worship: 'people', volunteers: 'people', guests: '' };
function secOn(s, sec) {
  s = s || [];
  if (sec === 'overview' || sec === 'share' || sec === 'tasks' || !s.length || s.indexOf(sec) >= 0) return true;
  if (s.indexOf('v2') < 0 && sec in LEGACY_SEC) return !LEGACY_SEC[sec] || s.indexOf(LEGACY_SEC[sec]) >= 0;
  return false;
}
var PRESETS = {
  big: { label: 'Big Event', on: ['calendar', 'people', 'speakers', 'worship', 'volunteers', 'guests', 'vendors', 'equipment', 'food', 'tasks', 'money', 'followup', 'prayer'] },
  night: { label: 'Worship Or Prayer Night', on: ['calendar', 'people', 'worship', 'volunteers', 'guests', 'equipment', 'tasks', 'money', 'followup', 'prayer'] },
  meeting: { label: 'Meeting', on: ['calendar', 'people', 'agenda', 'tasks', 'food'] }
};

/* ================================================================ state + store */
var DB = null;
var S = {
  loading: true, user: null, acct: null, authMode: 'in', authMsg: '', busy: false,
  tab: 'home', dirTab: 'contacts', dirType: '', dirQ: '', dirGroup: '', dirStatus: 'current', dirCat: '', budgetYear: new Date().getFullYear(),
  db: {}, ev: null, evTab: 'overview', sub: {}, calDay: null,
  sheet: null, toast: '', pubMode: '', pubSlug: '', pub: null, mine: [], cardDone: false, pubErr: '', cardErr: ''
};
function org() { return S.acct && S.acct.org; }
function T(t) { return S.db[t] || (S.db[t] = []); }
function byId(t, id) { return T(t).find(function (r) { return r.id === id; }); }
function evRows(t, ev) { var id = (ev || S.ev || {}).id; return T(t).filter(function (r) { return r.event_id === id; }); }
function put(t, row) { var a = T(t), i = a.findIndex(function (r) { return r.id === row.id; }); if (i >= 0) a[i] = row; else a.push(row); snapSoon(); return row; }
function drop(t, id) { if (t === 'ed_people') T('ed_prayer').forEach(function (p) { if (p.person_id === id) p.person_id = null; }); drop0(t, id); }
function drop0(t, id) { (CASCADE[t] || []).forEach(function (c) { T(c[0]).filter(function (r) { return r[c[1]] === id; }).forEach(function (r) { drop(c[0], r.id); }); }); S.db[t] = T(t).filter(function (r) { return r.id !== id; }); }
function save(t, row, msg) { return busy(DB.save(t, row), msg === undefined ? 'Saved' : msg).then(function (r) { put(t, r); return r; }); }
function remove(t, id, msg) { return busy(DB.remove(t, id), msg || 'Deleted').then(function () { drop(t, id); }); }
function on(sec, ev) { ev = ev || S.ev; return secOn(ev && ev.sections, sec); }
function memberNames() { return ((S.acct && S.acct.members) || []).map(function (m) { return m.name || m.email; }).filter(Boolean); }
function peopleNames() { var s = {}; memberNames().concat(T('ed_people').filter(function (p) { return p.status === 'current'; }).map(function (p) { return p.name; })).forEach(function (n) { s[n] = 1; }); return Object.keys(s).sort(); }
function events() { return T('ed_events').slice(); }

var toastT = 0;
function buzz(n) { try { if (navigator.vibrate) navigator.vibrate(n || 8); } catch (e) {} }
function toast(m) { S.toast = m; buzz(); renderLayer(); clearTimeout(toastT); toastT = setTimeout(function () { S.toast = ''; renderLayer(); }, 2600); }
function busy(p, okMsg) {
  S.busy = true; renderLayer();
  return Promise.resolve(p).then(function (v) { S.busy = false; if (okMsg) toast(okMsg); renderLayer(); return v; },
    function (e) { S.busy = false; if (S.sheet) { S.sheet.err = errMsg(e); refreshSheetErr(); } else toast(errMsg(e)); throw e; });
}

/* ================================================================ loading */
function boot() {
  var m = /[?&]join=([A-Za-z0-9]+)/.exec(location.search);
  if (m) { lset('ed.join', m[1]); try { history.replaceState(null, '', location.pathname); } catch (e) {} }
  if (/^#\/(e|c|v|r|k|u)\//.test(location.hash || '')) { route(); return; }
  DB.user().then(function (u) { S.user = u; if (!u) { S.loading = false; render(); return; } return loadAcct(); })
    .catch(function (e) { if (useSnap(lget('ed.snap.last'))) { render(); return; } S.loading = false; S.authMsg = errMsg(e); render(); });
}
function loadAcct() {
  return DB.myOrg().then(function (a) {
    S.acct = a; if (!a) { S.loading = false; render(); return; }
    return loadAll().then(function () { S.loading = false; S.offline = 0; saveSnap(); route(); render(); });
  }).catch(function (e) { if (useSnap()) { route(); render(); return; } S.loading = false; S.authMsg = errMsg(e); render(); });
}
/* Offline: after every load and change, the ministry's data is kept on this device. With no signal,
   the app opens from that copy (read-only until the connection is back) so event-day screens still work. */
function snapKey(uid) { return 'ed.snap.' + (uid || (S.user && S.user.id) || ''); }
function saveSnap() {
  if (!DB || DB.mode !== 'cloud' || !S.acct || !S.user) return;
  try { localStorage.setItem(snapKey(), JSON.stringify({ at: Date.now(), user: { id: S.user.id, email: S.user.email }, acct: S.acct, db: S.db })); localStorage.setItem('ed.snap.last', S.user.id); } catch (e) {}
}
var snapT = 0;
function snapSoon() { clearTimeout(snapT); snapT = setTimeout(saveSnap, 1200); }
function useSnap(uid) {
  if (!DB || DB.mode !== 'cloud') return false;
  var s = null; try { s = JSON.parse(localStorage.getItem(snapKey(uid)) || 'null'); } catch (e) {}
  if (!s || !s.acct) return false;
  if (!S.user) S.user = s.user;
  S.acct = s.acct; S.db = s.db || {}; S.offline = s.at || 1; S.loading = false; return true;
}
function offlineBar() {
  if (!S.offline || S.pubMode) return '';
  var t = S.offline > 1 ? new Date(S.offline).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '';
  return '<div class="offbar" role="status">' + IC.warn + '<span>No connection. ' + (t ? 'Showing what was saved ' + esc(t) + '. ' : '') + 'Changes won’t save until you’re back online.</span></div>';
}
window.addEventListener('offline', function () { if (S.acct && !S.offline) { S.offline = 1; render(); } });
window.addEventListener('online', function () { if (S.offline && S.user) { S.offline = 0; loadAcct(); } });
function loadAll() {
  var oid = org().id; loadAutoSent();
  return Promise.all([DB.list('ed_events', 'org_id', oid)].concat(DIR_TABLES.map(function (t) { return DB.list(t, 'org_id', oid); }))).then(function (r) {
    S.db = {}; S.db.ed_events = r[0]; DIR_TABLES.forEach(function (t, i) { S.db[t] = r[i + 1]; });
    var ids = r[0].map(function (e) { return e.id; });
    return Promise.all(EVENT_TABLES.map(function (t) { return DB.listIn(t, 'event_id', ids); })).then(function (rr) { EVENT_TABLES.forEach(function (t, i) { S.db[t] = rr[i]; }); })
      .then(function () { return DB.list('ed_mailings', 'org_id', oid).then(function (m) { S.db.ed_mailings = m; }, function () { S.db.ed_mailings = []; }); });
  });
}
function refreshEvent() {
  if (!S.ev) return Promise.resolve();
  var id = S.ev.id;
  return Promise.all(EVENT_TABLES.map(function (t) { return DB.list(t, 'event_id', id); })).then(function (rr) {
    EVENT_TABLES.forEach(function (t, i) { S.db[t] = T(t).filter(function (r) { return r.event_id !== id; }).concat(rr[i]); });
    render();
  }).catch(function () {});
}

/* ================================================================ routing */
function route() {
  var un = /^#\/u\/([0-9a-f-]{36})/.exec(location.hash || '');
  if (un) { S.pubMode = 'u'; S.unsub = { id: un[1] }; render(); return DB.rpc('ed_unsubscribe', { p_rcpt: un[1] }).then(function (n) { S.unsub.done = true; S.unsub.org = n || ''; render(); }, function (e) { S.unsub.err = errMsg(e); render(); }); }
  var m = /^#\/(e|c|v|r|k)\/([a-z0-9-]+)/.exec(location.hash || '');
  var gm = m && /\/g\/([0-9a-f-]{36})/.exec(location.hash);
  if (gm) DB.rpc('ed_guest', { p_rcpt: gm[1] }).then(function (g) { if (g) S.guest = g; }, function () {});
  if (m) { S.pubMode = m[1]; S.pubSlug = m[2]; S.cardDone = false; render(); return loadPublic(); }
  if (S.pubMode && !window.ED_DEMO) { S.pubMode = ''; S.pub = null; }
  var w = /^#\/w\/([0-9a-f-]{36})/.exec(location.hash || '');
  if (w && S.acct && byId('ed_events', w[1])) openEvent(w[1], true);
  if (!S.loading) render();
}
window.addEventListener('hashchange', route);
function openEvent(id, fromRoute) {
  S.ev = byId('ed_events', id); S.evTab = 'overview'; S.sub = {}; S.calDay = null;
  if (!fromRoute && !window.ED_DEMO) { try { history.pushState(null, '', '#/w/' + id); } catch (e) {} }
  render(); window.scrollTo(0, 0); refreshEvent();
}
function closeEvent() {
  S.ev = null;
  if (/^#\/w\//.test(location.hash) && !window.ED_DEMO) { try { history.pushState(null, '', location.pathname + location.search); } catch (e) {} }
  render(); window.scrollTo(0, 0);
}
window.addEventListener('popstate', function () { if (S.ev && !/^#\/w\//.test(location.hash)) { S.ev = null; render(); } });
function openPub(kind, slug) {
  S.pubFromEv = S.ev ? S.ev.id : null;
  if (window.ED_DEMO) { S.pubMode = kind; S.pubSlug = slug; S.cardDone = false; S.pub = null; render(); window.scrollTo(0, 0); loadPublic(); }
  else location.hash = '#/' + kind + '/' + slug;
}

/* ================================================================ render core */
function render() {
  var h;
  if (S.pubMode) h = S.pubMode === 'u' ? viewUnsub() : S.pubMode === 'c' ? viewCard() : S.pubMode === 'k' ? viewSelfCheckin() : viewPublic();
  else if (S.loading) h = '<div class="auth loading" role="status"><div class="logo">' + IC.tent + '</div><p class="muted">Loading your ministry…</p></div>';
  else if (!S.user) h = viewAuth();
  else if (!S.acct) h = viewSetup();
  else if (S.ev) h = viewWorkspace();
  else h = viewShell();
  $('#app').innerHTML = offlineBar() + h;
  if (S.formKeep) {
    var kf = $('#app form[data-form="' + S.formKeep.k + '"]'), kv = S.formKeep.v;
    if (!kf) S.formKeep = null;
    else Object.keys(kv).forEach(function (name) { kf.querySelectorAll('[name="' + name + '"]').forEach(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = [].concat(kv[name]).indexOf(el.value) >= 0; else if (!el.value && name !== 'code') el.value = kv[name]; }); });
  }
  document.body.classList.toggle('has-nav', !!(S.user && S.acct && !S.pubMode));
  document.body.classList.toggle('in-ev', !!(S.user && S.acct && S.ev && !S.pubMode));
  renderLayer();
}
function renderLayer() {
  var layer = $('#layer'), sh = layer.querySelector('.sheet');
  if (S.sheet && sh && S.sheet.drawn) {
    sh.querySelectorAll('[data-save]').forEach(function (b) { b.disabled = S.busy; b.classList.toggle('saving', !!S.busy); });
  } else {
    layer.querySelectorAll('.scrim').forEach(function (x) { x.remove(); });
    if (S.sheet) {
      layer.insertAdjacentHTML('afterbegin', '<div class="scrim" data-a="scrim"><div class="sheet" role="dialog" aria-modal="true">' + S.sheet.html() + '<div class="err" hidden></div></div></div>');
      S.sheet.drawn = true; var dlg = layer.querySelector('.sheet'), f = layer.querySelector('[autofocus]'); dlg.tabIndex = -1; if (f && window.innerWidth > 700) f.focus(); else { try { dlg.focus({ preventScroll: true }); } catch (e) {} }
      if (S.sheet.after) S.sheet.after(layer.querySelector('.sheet'));
      refreshSheetErr();
    }
  }
  var dl = layer.querySelector('.sheet'), dh = dl && dl.querySelector('h3'); if (dh) dl.setAttribute('aria-label', dh.textContent);
  document.documentElement.classList.toggle('has-sheet', !!S.sheet);
  var appEl = $('#app'); if (appEl && 'inert' in appEl) appEl.inert = !!S.sheet; // screen readers and the Tab key stay inside the open form
  var t = layer.querySelector('.toast');
  if (t && t.textContent !== S.toast) { t.remove(); t = null; }
  if (S.toast && !t) layer.insertAdjacentHTML('beforeend', '<div class="toast" role="status">' + esc(S.toast) + '</div>');
}
function refreshSheetErr() { var e = $('#layer .sheet .err'); if (!e || !S.sheet) return; var was = e.hidden; e.hidden = !S.sheet.err; e.textContent = S.sheet.err || ''; if (S.sheet.err) { e.setAttribute('role', 'alert'); if (was && e.scrollIntoView) e.scrollIntoView({ block: 'nearest' }); } }
function openSheet(html, onSave, extra) { S.sheet = Object.assign({ html: typeof html === 'function' ? html : function () { return html; }, save: onSave, err: '' }, extra || {}); renderLayer(); }
function closeSheet() { S.sheet = null; renderLayer(); }
function redrawSheet() { if (!S.sheet) return; var sh = $('#layer .sheet'); if (sh && S.sheet.drawn) { sh.innerHTML = S.sheet.html() + '<div class="err" hidden></div>'; if (S.sheet.after) S.sheet.after(sh); refreshSheetErr(); } else { S.sheet.drawn = false; renderLayer(); } }
function sheetErr(m) { S.sheet.err = m; refreshSheetErr(); }
function ask(msg, yes, fn, sub) {
  openSheet('<h3>' + esc(msg) + '</h3>' + (sub ? '<p class="lead">' + esc(sub) + '</p>' : '') + '<div class="acts"><button class="btn plain" data-a="close">Cancel</button><button class="btn" data-save data-a="sheet-save">' + esc(yes) + '</button></div>',
    function () { S.sheet = null; renderLayer(); var p = fn(); if (p && p.catch) p.catch(function () {}); });
}

/* ---------- small building blocks */
function head(title, sub, left, right, eyebrow, titleAct) {
  var t = titleAct ? '<button class="htbtn" data-a="' + titleAct + '"><h1>' + esc(title) + '</h1>' + IC.down + '</button>' : '<h1>' + esc(title) + '</h1>';
  return '<header class="top"><div class="hrow">' + (left || '') + '<div class="htxt">' + (eyebrow ? '<div class="eyebrow">' + esc(eyebrow) + '</div>' : '') + t + '</div>' +
    '<div class="hact">' + (DB.mode === 'demo' ? '<span class="demo-flag">Demo</span>' : '') + (right || '') + '</div></div>' + (sub ? '<div class="hsub">' + esc(sub) + '</div>' : '') + '</header>';
}
function tabs(list, cur, act, cls) {
  return '<nav class="' + (cls || 'tabs') + '" role="tablist">' + list.map(function (t) {
    return '<button role="tab" aria-selected="' + (t[0] === cur) + '" data-a="' + act + '" data-v="' + t[0] + '">' + esc(t[1]) + '</button>';
  }).join('') + '</nav>';
}
function secHead(title, right, sub) { return '<div class="sec"><h2>' + esc(title) + (sub ? ' <small>' + esc(sub) + '</small>' : '') + '</h2>' + (right || '') + '</div>'; }
function addBtn(label, act, id, cls) { return '<button class="btn sm ' + (cls || '') + '" data-a="' + act + '"' + (id ? ' data-id="' + esc(id) + '"' : '') + '>' + IC.plus + ' ' + esc(label) + '</button>'; }
function listBox(rows, empty) { return rows.length ? '<div class="list">' + rows.join('') + '</div>' : '<div class="empty card">' + empty + '</div>'; }
function row(o) {
  var tag = o.act ? 'button' : 'div';
  return '<' + tag + ' class="row' + (o.cls ? ' ' + o.cls : '') + '"' + (o.act ? ' data-a="' + o.act + '" data-id="' + esc(o.id) + '"' + (o.t ? ' data-t="' + esc(o.t) + '"' : '') : '') + '>' + (o.lead || '') +
    '<div class="main"><div class="t">' + o.title + '</div>' + (o.sub ? '<div class="s">' + o.sub + '</div>' : '') + '</div>' + (o.right || '') + (o.act ? '<span class="chev">' + IC.chev + '</span>' : '') + '</' + tag + '>';
}
function pill(text, kind) { return text ? '<span class="pill ' + (kind || '') + '">' + esc(text) + '</span>' : ''; }
function payPill(s, due) { var late = due && s !== 'Paid In Full' && due < TODAY; return pill(late ? 'Overdue' : s, s === 'Paid In Full' ? 'green' : late ? 'red' : s === 'Deposit Paid' ? 'amber' : ''); }
function stat(k, v, hl) { return '<div class="stat' + (hl ? ' hl' : '') + '"><div class="k">' + esc(k) + '</div><div class="v">' + v + '</div></div>'; }
function meter(a, b) { var p = b ? Math.min(100, Math.round(100 * a / b)) : 0; return '<div class="meter" role="img" aria-label="' + p + '% done"><i style="width:' + p + '%"></i></div>'; }
function ck(on, act, id, label) { return '<button class="ck' + (on ? ' on' : '') + '" data-a="' + act + '" data-id="' + esc(id) + '" aria-pressed="' + !!on + '" aria-label="' + esc(label || 'Done') + '">' + (on ? IC.check : '') + '</button>'; }
function actions(r) {
  var b = [];
  if (r.phone) { b.push('<a class="act" href="tel:' + esc(digits(r.phone)) + '">' + IC.phone + 'Call</a>'); b.push('<button class="act" data-a="text-from" data-v="' + esc(r.phone) + '" data-id="' + esc(r.name || '') + '">' + IC.text + 'Text</button>'); }
  if (r.email) b.push('<a class="act" href="mailto:' + esc(r.email) + '">' + IC.mail + 'Email</a>');
  if (r.address) b.push('<a class="act" href="' + esc(mapUrl(r.address)) + '" target="_blank" rel="noopener">' + IC.pin + 'Map</a>');
  if (r.website) b.push('<a class="act" href="' + esc(webUrl(r.website)) + '" target="_blank" rel="noopener">' + IC.web + 'Website</a>');
  return b.length ? '<div class="acts-row">' + b.join('') + '</div>' : '';
}
function infoList(pairs) {
  var p = pairs.filter(function (x) { return x[1] !== '' && x[1] != null; });
  return p.length ? '<dl class="info">' + p.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + (x[2] ? x[1] : esc(x[1])) + '</dd>'; }).join('') + '</dl>' : '';
}
function contactLine(r) { return esc([r.phone, r.email].filter(Boolean).join(' · ')); }

/* ================================================================ forms */
/* field: {k, label, type, opts, ph, half, hint, def, auto}
   types: text tel email url date time int money textarea select list check multi */
function optsOf(f) { var o = typeof f.opts === 'function' ? f.opts() : (f.opts || []); return o.map(function (x) { return Array.isArray(x) ? x : [x, x]; }); }
function fieldHtml(f, data) {
  var id = 'f_' + f.k.replace(/\./g, '_'), v = getPath(data || {}, f.k); if (v == null || v === '') v = f.def != null && !(data && data.id) ? (typeof f.def === 'function' ? f.def() : f.def) : (v == null ? '' : v);
  var cls = 'fld' + (f.w ? ' w' + f.w : f.half ? ' half' : ''), lab = '<label for="' + id + '">' + esc(f.label) + '</label>', hint = f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '', inp;
  if (f.type === 'check') return '<div class="' + cls + '"><label class="cbx"><input type="checkbox" id="' + id + '" name="' + f.k + '"' + (v ? ' checked' : '') + '><span>' + esc(f.label) + '</span></label>' + hint + '</div>';
  if (f.type === 'multi') {
    var vals = Array.isArray(v) ? v : [];
    return '<fieldset class="' + cls + '"><legend>' + esc(f.label) + '</legend><div class="multi' + (f.one ? ' one' : '') + '">' + optsOf(f).map(function (o, i) {
      return '<label class="cbx"><input type="checkbox" id="' + id + '_' + i + '" name="' + f.k + '" value="' + esc(o[0]) + '"' + (vals.indexOf(o[0]) >= 0 ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>';
    }).join('') + '</div>' + hint + '</fieldset>';
  }
  if (f.type === 'contact') {
    var cs = allContacts().filter(function (x) { return x.status !== 'previous' || refOf(x) === v; });
    inp = '<select class="inp" id="' + id + '" name="' + f.k + '"><option value="">' + esc(f.none || 'Not linked to a contact') + '</option>' + CTYPES.map(function (c) {
      var g = cs.filter(function (x) { return x.types[0] === c[0]; });
      return g.length ? '<optgroup label="' + esc(c[1]) + '">' + g.map(function (x) { return '<option value="' + esc(refOf(x)) + '"' + (refOf(x) === v ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</optgroup>' : '';
    }).join('') + '</select>';
    return '<div class="' + cls + '">' + lab + inp + hint + '</div>';
  }
  if (f.type === 'contacts') {
    var sel = Array.isArray(v) ? v : [], pool = allContacts().filter(function (x) { var on0 = sel.indexOf(refOf(x)) >= 0; return on0 || ((f.filter ? f.filter(x) : true) && x.status !== 'previous'); });
    return '<fieldset class="' + cls + '"><legend>' + esc(f.label) + '</legend>' + (pool.length > 8 ? '<input class="inp sm pickq" type="search" placeholder="Search contacts" data-input="pick-q" aria-label="Search contacts">' : '') +
      '<div class="cpick">' + CTYPES.map(function (c) {
        var g = pool.filter(function (x) { return x.types[0] === c[0]; }); if (!g.length) return '';
        return '<div class="cpick-g">' + esc(c[1]) + '</div>' + g.map(function (x) { var r = refOf(x); return '<label class="cbx pickrow" data-name="' + esc(x.name.toLowerCase()) + '"><input type="checkbox" name="' + f.k + '" value="' + esc(r) + '"' + (sel.indexOf(r) >= 0 ? ' checked' : '') + '><span>' + esc(x.name) + '</span></label>'; }).join('');
      }).join('') + (pool.length ? '' : '<p class="small muted">No contacts yet.</p>') + '</div>' + hint + '</fieldset>';
  }
  if (f.type === 'textarea') inp = '<textarea class="inp" id="' + id + '" name="' + f.k + '" placeholder="' + esc(f.ph || '') + '">' + esc(v) + '</textarea>';
  else if (f.type === 'select') inp = '<select class="inp" id="' + id + '" name="' + f.k + '">' + optsOf(f).map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  else if (f.type === 'list') inp = '<input class="inp" id="' + id + '" name="' + f.k + '" list="dl_' + id + '" value="' + esc(v) + '" placeholder="' + esc(f.ph || '') + '" autocomplete="off"' + (f.auto ? ' autofocus' : '') + '><datalist id="dl_' + id + '">' + optsOf(f).map(function (o) { return '<option value="' + esc(o[0]) + '">'; }).join('') + '</datalist>';
  else {
    var type = { tel: 'tel', email: 'email', url: 'url', date: 'date', time: 'time' }[f.type] || 'text';
    var mode = f.type === 'money' ? ' inputmode="decimal"' : f.type === 'int' ? ' inputmode="numeric"' : '';
    inp = '<input class="inp" id="' + id + '" name="' + f.k + '" type="' + type + '"' + mode + ' value="' + esc(f.type === 'money' && v !== '' ? num(v) : v) + '" placeholder="' + esc(f.ph || (f.type === 'money' ? '$0' : '')) + '"' + (f.auto ? ' autofocus' : '') + '>';
  }
  return '<div class="' + cls + '">' + lab + inp + hint + '</div>';
}
// Background checks: cleared on a date, good for 2 years unless an expiry date is set.
var BG_YEARS = 2;
function bgExpires(p) { return p && p.bg_cleared_on ? (p.bg_expires_on || (+p.bg_cleared_on.slice(0, 4) + BG_YEARS) + p.bg_cleared_on.slice(4)) : ''; }
function bgStatus(p) { if (!p || !p.bg_cleared_on) return 'none'; var x = bgExpires(p); return x < TODAY ? 'expired' : x <= addDays(TODAY, 30) ? 'expiring' : 'ok'; }
function bgText(p) { var s = bgStatus(p), x = bgExpires(p); return s === 'none' ? 'None on file' : s === 'expired' ? 'Expired ' + fmtDay(x, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Cleared ' + fmtDay(p.bg_cleared_on, { month: 'short', day: 'numeric', year: 'numeric' }) + ' · good until ' + fmtDay(x, { month: 'short', day: 'numeric', year: 'numeric' }); }
// The contact a sign-up belongs to: same phone, or the same name.
function personForSignup(s) {
  var ph = digits(s.phone).slice(-10), em = String(s.email || '').trim().toLowerCase(), n = String(s.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return T('ed_people').find(function (p) { return ph && ph.length >= 7 && digits(p.phone).slice(-10) === ph; }) ||
    T('ed_people').find(function (p) { return em && String(p.email || '').trim().toLowerCase() === em; }) ||
    T('ed_people').find(function (p) { return p.name.trim().toLowerCase().replace(/\s+/g, ' ') === n; }) || null;
}
// The fields on an RSVP or sign-up. Guests see the consent box; the team also sees "paid" when there's a fee.
function suFields(it, pub) {
  var f = it.kind === 'attend' ? F.rsvp.slice() : F.signup.map(function (x) { return pub && x.k === 'note' ? Object.assign({}, x, { label: it.kind === 'meal' ? 'What Are You Bringing?' : 'Anything We Should Know?' }) : x; });
  f.push({ k: 'consent', type: 'check', label: pub ? 'It’s okay to contact me about this and future events' : 'Okay to contact about future events' });
  if (!pub && it.kind === 'attend' && num(it.fee) > 0) f.push({ k: 'paid', type: 'check', label: 'Registration fee paid (' + money(num(it.fee)) + ' each)' });
  return f;
}
function feeLine(it, party) { var fee = num(it.fee); if (!(fee > 0) || it.kind !== 'attend') return ''; var n = Math.max(1, party || 1); return 'Registration is ' + money(fee) + ' per person' + (n > 1 ? ' (' + money(fee * n) + ' for ' + n + ')' : '') + '. Pay at check-in.'; }
// Who on a check-required shift isn't cleared (or will have expired by the shift).
function bgGaps(i) {
  if (!i.needs_check) return [];
  var day = i.on_date || (S.ev && S.ev.starts_on) || TODAY;
  return signups(i.id).map(function (s) { var p = personForSignup(s), x = bgExpires(p); return { s: s, p: p, why: !p ? 'not in Contacts' : !p.bg_cleared_on ? 'no check on file' : x < day ? 'expired ' + fmtDay(x, { month: 'short', day: 'numeric' }) : '' }; }).filter(function (g) { return g.why; });
}
function shiftWhen(i) { return i.time_label || ''; }
function timeRange(s, e) { if (!s) return ''; var a = fmtTime(s), b = fmtTime(e); if (!b) return a; if (a.slice(-2) === b.slice(-2)) a = a.slice(0, -3); return a + '–' + b; }
var F_SHIFT = [
  { k: 'title', label: 'Role Or Team', auto: true, ph: 'Parking' }, { k: 'on_date', label: 'Date', type: 'date', w: 6 }, { k: 'start_time', label: 'Starts', type: 'time', w: 3 }, { k: 'end_time', label: 'Ends', type: 'time', w: 3 },
  { k: 'needed', label: 'People Needed', type: 'int', half: true, def: 1 }, { k: 'needs_check', label: 'Background check required (kids, youth)', type: 'check' }, { k: 'notes', label: 'Details For People Signing Up', type: 'textarea', ph: 'Wear a bright shirt. Meet at the welcome tent.' }];
function itemFields(kind) {
  if (kind === 'serve') return F_SHIFT;
  if (kind !== 'attend') return F.item;
  return [{ k: 'title', label: 'Service Or Night', auto: true, ph: 'Night 1 Service' }, { k: 'on_date', label: 'Date', type: 'date', half: true }, { k: 'time_label', label: 'Time', half: true, ph: '7 PM' },
    { k: 'needed', label: 'Seats Available', type: 'int', half: true, def: 200 }, { k: 'fee', label: 'Registration Fee', type: 'money', half: true, hint: 'Per person. Leave at 0 when it’s free.' }, { k: 'notes', label: 'Details For Guests', type: 'textarea', ph: 'Doors open at 6:30 PM.' }];
}
function formBody(fields, data) { return '<div class="fgrid">' + fields.map(function (f) { return f.html ? f.html(data) : f.drawn ? '' : fieldHtml(f, data); }).join('') + '</div>'; }
function readForm(fields, base) {
  var out = JSON.parse(JSON.stringify(base || {})), root = $('#layer .sheet');
  fields.forEach(function (f) {
    if (f.html) return;
    var v;
    if (f.type === 'multi' || f.type === 'contacts') v = $$('[name="' + f.k + '"]:checked', root).map(function (x) { return x.value; });
    else { var el = root.querySelector('[name="' + f.k + '"]'); if (!el) return; v = f.type === 'check' ? el.checked : el.value.trim(); }
    if (f.type === 'money') v = v === '' ? 0 : Math.max(0, num(v));
    if (f.type === 'int') v = v === '' ? null : Math.round(num(v));
    if ((f.type === 'date' || f.type === 'time') && v === '') v = null;
    setPath(out, f.k, v);
  });
  return out;
}
function sheetFoot(del, saveLabel) {
  return '<div class="acts">' + (del ? '<button class="btn ghost" data-a="sheet-del">Delete</button>' : '') + '<span class="grow"></span><button class="btn plain" data-a="close">Cancel</button><button class="btn" data-save data-a="sheet-save">' + esc(saveLabel || 'Save') + '</button></div>';
}
/* A saved record opens as a short summary of what's filled in; Edit shows every field. */
function fieldShow(f, data) {
  var v = getPath(data || {}, f.k);
  if (f.type === 'check') return v ? '✓' : '';
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return f.viewDef || '';
  if (f.type === 'money') return num(v) ? money(num(v)) : '';
  if (f.type === 'date') return fmtLong(v);
  if (f.type === 'time') return fmtTime(v);
  if (f.type === 'select') { var o = optsOf(f).find(function (x) { return String(x[0]) === String(v); }); return o ? String(o[1]) : String(v); }
  if (f.type === 'multi') return v.join(', ');
  if (f.type === 'contact') { var c = refContact(v); return c ? c.name : ''; }
  if (f.type === 'contacts') return refNames(v).join(', ');
  return String(v);
}
function recView(fields, data, skip) {
  var rows = [], checks = [];
  fields.forEach(function (f) {
    if (f.html) { if (f.view) { var h = f.view(data); if (h) rows.push(h); } return; }
    if (f.drawn || f.noView || f.k === skip) return;
    var t = fieldShow(f, data); if (!t) return;
    if (f.type === 'check') checks.push(f.label); else rows.push('<div class="rv-row"><dt>' + esc(f.label) + '</dt><dd>' + esc(t).replace(/\n/g, '<br>') + '</dd></div>');
  });
  if (checks.length) rows.push('<div class="rv-row"><dt>Checked</dt><dd>' + checks.map(function (c) { return '<span class="rv-check">' + esc(c) + '</span>'; }).join('') + '</dd></div>');
  return rows.length ? '<dl class="recview">' + rows.join('') + '</dl>' : '<div class="empty card">Nothing filled in yet. Tap Edit to add details.</div>';
}

/* Edit any row with a field list. opts: title, sub, top (html above the form), required, prep(row) -> row, after(saved), view (open saved records as a summary) */
function editRow(t, rec, fields, opts) {
  opts = opts || {};
  var base = rec || opts.base || {}, newId = rec ? null : uuid(), canView = !!(rec && opts.view);
  openSheet(function () {
    var head = '<h3>' + esc(opts.title || (rec ? 'Edit' : 'Add')) + '</h3>' + (opts.sub ? '<p class="lead">' + esc(opts.sub) + '</p>' : '') + (opts.top ? opts.top(base) : '');
    if (S.sheet && S.sheet.viewMode) return head + recView(fields, base, opts.viewSkip) + '<div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Done</button><button class="btn" data-a="rec-edit">Edit</button></div>';
    return head + formBody(fields, base) + sheetFoot(!!rec && opts.del !== false, opts.saveLabel);
  }, function () {
    if (S.sheet.viewMode) return;
    var v = readForm(fields, base);
    var req = opts.required || fields[0].k;
    if (!String(getPath(v, req) == null ? '' : getPath(v, req)).trim()) { sheetErr('Please fill in ' + (fields.find(function (f) { return f.k === req; }) || {}).label + '.'); return; }
    refSync(v);
    if (opts.prep) { var m = opts.prep(v); if (typeof m === 'string') { sheetErr(m); return; } if (m) v = m; }
    if (newId && !v.id) v.id = newId;
    var sh = S.sheet;
    return save(t, v).then(function (r) {
      // a saved record goes back to its summary, now showing what was just filled in
      if (canView && !opts.after && S.sheet === sh) { rec = base = r; sh.viewMode = true; redrawSheet(); render(); var el = $('#layer .sheet'); if (el) el.scrollTop = 0; return; }
      closeSheet(); if (opts.after) opts.after(r); render();
    }).catch(function () {});
  }, { viewMode: canView, del: rec ? function () { ask(opts.delMsg || 'Delete this?', 'Delete', function () { return remove(t, rec.id).then(function () { render(); }); }, opts.delSub); } : null, after: opts.afterDraw });
}

/* ================================================================ sessions (an event can have several gatherings, each with its own times) */
function sessBox() {
  return (S.sess || []).map(function (x, i) {
    return '<div class="sessrow" data-sid="' + esc(x.id || '') + '"><div class="sess-top"><input class="inp" data-sess="title" maxlength="80" placeholder="Session name, like Friday Night" aria-label="Session ' + (i + 1) + ' name" value="' + esc(x.title || '') + '"><button type="button" class="sess-x" data-a="sess-del" data-id="' + i + '" aria-label="Remove session ' + (i + 1) + '">×</button></div>' +
      '<div class="sess-when"><label>Day<input class="inp" type="date" data-sess="on_date" value="' + esc(x.on_date || '') + '"></label><label>Starts<input class="inp" type="time" data-sess="start" value="' + esc(x.start || '') + '"></label><label>Ends<input class="inp" type="time" data-sess="end" value="' + esc(x.end || '') + '"></label></div></div>';
  }).join('') + '<button type="button" class="btn ghost block" data-a="sess-add">' + ((S.sess || []).length ? 'Add Another Session' : 'Add Session') + '</button>';
}
function sessField() { return '<div class="fld"><label>Sessions (Optional)</label><span class="hint">For an event with more than one gathering, like Friday night, then Saturday morning, afternoon and night. Each one gets its own start and end time.</span><div id="sess_box">' + sessBox() + '</div></div>'; }
function sessRead() {
  var box = $('#sess_box'); if (!box) return;
  S.sess = $$('.sessrow', box).map(function (r) { var g = function (k) { return r.querySelector('[data-sess="' + k + '"]').value.trim(); }; return { id: r.getAttribute('data-sid') || uuid(), title: g('title'), on_date: g('on_date'), start: g('start'), end: g('end') }; });
}
// Returns the tidy list, or a sentence saying what to fix.
function sessClean(v) {
  var list = (S.sess || []).filter(function (x) { return x.title || x.on_date || x.start || x.end; }), bad = '';
  list = list.map(function (x, i) {
    var d = x.on_date || v.starts_on || '';
    if (d && v.starts_on && (d < v.starts_on || d > (v.ends_on || v.starts_on))) bad = 'Session ' + (i + 1) + ' is on a day outside the event dates.';
    return { id: x.id || uuid(), title: (x.title || '').slice(0, 80), on_date: d, start: x.start || '', end: x.end || '' };
  });
  if (bad) return bad;
  if (list.length > 40) return 'That’s a lot of sessions. Keep it to 40 or fewer.';
  list.sort(function (a, b) { return (a.on_date + (a.start || '99')).localeCompare(b.on_date + (b.start || '99')); });
  list.forEach(function (x, i) { if (!x.title) x.title = 'Session ' + (i + 1); });
  return list;
}
function sessTime(x) { return x.start ? fmtTime(x.start) + (x.end ? ' – ' + fmtTime(x.end) : '') : ''; }
function sessWhen(x) { return [x.on_date ? fmtDay(x.on_date) : '', sessTime(x)].filter(Boolean).join(' · '); }
function sessList(list) { return '<div class="sesslist">' + list.map(function (x) { return '<div class="sessline"><b>' + esc(x.title) + '</b><span>' + esc(sessWhen(x)) + '</span></div>'; }).join('') + '</div>'; }
function sessCard(e) { var l = e.sessions || []; return l.length ? '<div class="card sesscard"><div class="heart-k">' + esc(plural(l.length, 'Session')) + '</div>' + sessList(l) + '</div>' : ''; }
// Travel and stay for someone coming in for the event: what they still need that isn't booked yet.
var TRAVEL = [['car', 'Vehicle', 'Vehicle needed', 'Vehicle secured'], ['hotel', 'Hotel', 'Hotel needed', 'Hotel booked'], ['flight', 'Flight', 'Flight needed', 'Flight booked'], ['pickup', 'Airport Pickup', 'Airport pickup needed', 'Driver arranged'], ['meals', 'Meals', 'Meals needed', 'Meals arranged']];
function travelGaps(a) { var d = (a && a.details) || {}; return TRAVEL.filter(function (t) { return d[t[0] + '_need'] && !d[t[0] + '_ok']; }).map(function (t) { return t[1]; }); }
function travelSet(a) { var d = (a && a.details) || {}; return TRAVEL.filter(function (t) { return d[t[0] + '_need'] && d[t[0] + '_ok']; }).map(function (t) { return t[1]; }); }
function travelPills(a) { return travelGaps(a).map(function (x) { return pill('Needs ' + x, 'red'); }).concat(travelSet(a).map(function (x) { return pill(x + ' Set', 'green'); })).join(''); }
// Travel and stay as one compact table: a row per item with Needed and Done side by side.
function travelView(data) {
  var d = (data && data.details) || {}, l = TRAVEL.filter(function (t) { return d[t[0] + '_need']; });
  return l.length ? '<div class="rv-row"><dt>Travel And Stay</dt><dd>' + l.map(function (t) { return pill(t[1] + (d[t[0] + '_ok'] ? ' · Done' : ' · Needed'), d[t[0] + '_ok'] ? 'green' : 'red'); }).join(' ') + '</dd></div>' : '';
}
function travelTable(data) {
  var d = (data && data.details) || {}, box = function (k, lbl, t) { return '<label class="tv-box"><input type="checkbox" name="details.' + k + '"' + (d[k] ? ' checked' : '') + ' aria-label="' + esc(lbl + ': ' + t) + '"><span>' + esc(t) + '</span></label>'; };
  return '<div class="fld"><label>Travel And Stay</label><span class="hint">Tick what they need, then tick Done once it’s taken care of.</span><div class="tvtable">' + TRAVEL.map(function (t) {
    return '<div class="tvrow"><b>' + esc(t[1]) + '</b>' + box(t[0] + '_need', t[1], 'Needed') + box(t[0] + '_ok', t[1], 'Done') + '</div>';
  }).join('') + '</div></div>';
}

/* ================================================================ field sets */
var F = {
  person: [
    { k: 'name', label: 'Name', auto: true }, { k: 'title', label: 'Title', type: 'list', opts: TITLES, half: true, ph: 'Worship Director' },
    { k: 'status', label: 'Status', type: 'select', opts: [['current', 'Current'], ['previous', 'Previous']], half: true },
    { k: 'groups', label: 'Contact Type', type: 'multi', opts: GROUPS, hint: 'Pick all that fit. Board, worship, speakers, prayer team and staff all count as Team.' },
    { k: 'phone', label: 'Phone', type: 'tel', half: true }, { k: 'email', label: 'Email', type: 'email', half: true },
    { k: 'bg_cleared_on', label: 'Background Check Cleared', type: 'date', half: true }, { k: 'bg_expires_on', label: 'Check Expires', type: 'date', half: true, hint: 'Leave blank and it’s good for 2 years.' },
    { k: 'address', label: 'Address' }, { k: 'notes', label: 'Notes', type: 'textarea', ph: 'Skills, shirt size, allergies…' }],
  vendor: [
    { k: 'name', label: 'Business Name', auto: true }, { k: 'category', label: 'Category', type: 'list', opts: VENDOR_CATS, half: true }, { k: 'contact_name', label: 'Contact Person', half: true, ph: 'Who you talk to' },
    { k: 'phone', label: 'Phone', type: 'tel', half: true }, { k: 'email', label: 'Email', type: 'email', half: true },
    { k: 'website', label: 'Website', type: 'url', ph: 'example.com' }, { k: 'address', label: 'Address' }, { k: 'notes', label: 'Notes', type: 'textarea', ph: 'Pricing, what to ask for next time…' }],
  contact: [
    { k: 'name', label: 'Name', auto: true }, { k: 'organization', label: 'Organization', half: true }, { k: 'role', label: 'Role', half: true, ph: 'Landowner, Permit Office…' },
    { k: 'phone', label: 'Phone', type: 'tel', half: true }, { k: 'email', label: 'Email', type: 'email', half: true },
    { k: 'website', label: 'Website', type: 'url' }, { k: 'address', label: 'Address' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
  equipment: [
    { k: 'name', label: 'Item', auto: true }, { k: 'quantity', label: 'Quantity Owned', type: 'int', half: true, def: 1 }, { k: 'category', label: 'Category', type: 'list', opts: GEAR_CATS, half: true },
    { k: 'location', label: 'Stored At', half: true }, { k: 'condition', label: 'Condition', type: 'select', opts: ['Good', 'Needs Repair', 'Missing', 'Retired'], half: true }, { k: 'notes', label: 'Notes', type: 'textarea' }],
  budget: [
    { k: 'name', label: 'Budget Line', auto: true, ph: 'Annual Tent Revival' }, { k: 'planned', label: 'Planned Amount', type: 'money', half: true }, { k: 'year', label: 'Year', type: 'int', half: true, def: function () { return S.budgetYear; } },
    { k: 'event_id', label: 'Event (Optional)', type: 'select', opts: function () { return [['', 'None']].concat(events().map(function (e) { return [e.id, e.title]; })); } },
    { k: 'notes', label: 'Notes', type: 'textarea' }],
  event: [
    { k: 'title', label: 'Event Name', auto: true, ph: 'Annual Tent Revival' },
    { html: function () { return '<div class="fsec">When</div>'; } },
    { k: 'starts_on', label: 'First Day', type: 'date', half: true }, { k: 'ends_on', label: 'Last Day', type: 'date', half: true, hint: 'Leave empty for a one-day event.' },
    { k: 'start_time', label: 'Starts', type: 'time', half: true }, { k: 'end_time', label: 'Ends', type: 'time', half: true },
    { html: sessField },
    { k: 'time_label', label: 'Time Wording (Optional)', ph: 'Nightly at 7 PM', hint: 'What people see next to the date. Leave it blank to use the start and end times.' },
    { html: function () { return '<div class="fsec">Where</div>'; } }, { k: 'place', label: 'Place', half: true, ph: 'Miller Field' }, { k: 'address', label: 'Address', half: true },
    { html: function () { return '<div class="fsec">Public Page</div>'; } },
    { k: 'about', label: 'About This Event', type: 'textarea', hint: 'Shown on the public sign-up page.' },
    { k: 'contact_line', label: 'Public Contact Line', ph: 'Questions? Text Steve at (555) 555-0142' },
    { k: 'is_open', label: 'Public Sign-Ups Are Open', type: 'check', def: true },
    { html: function () { return '<div class="fsec">The Heart Of It</div>'; } },
    { k: 'theme', label: 'Theme', ph: 'Let His Presence Fall' }, { k: 'purpose', label: 'Purpose', type: 'textarea', ph: 'The purpose of this event is to give God glory…', hint: 'The heart behind the event. Your team sees it on the Overview.' },
    { html: function () { return '<div class="fsec">Money And Goals</div>'; } },
    { k: 'budget', label: 'Budget', type: 'money', half: true }, { k: 'volunteer_goal', label: 'Volunteer Goal', type: 'int', half: true, ph: 'How many in all' },
    { k: 'giving_link', label: 'Online Giving Link', type: 'url', ph: 'https://…' },
    { html: function () { return '<div class="fsec">Tabs</div>'; } },
    { html: function () { return '<div class="fld"><label>Start From A Preset</label><div class="seg wrap">' + Object.keys(PRESETS).map(function (k) { return '<button type="button" data-a="preset" data-v="' + k + '">' + esc(PRESETS[k].label) + '</button>'; }).join('') + '</div></div>'; } },
    { k: 'sections', label: 'What This Event Uses', type: 'multi', opts: SECTIONS, hint: 'Overview, Tasks and Share are always there.' }],
  schedule: [
    { k: 'title', label: 'What', auto: true, ph: 'Sound Check' }, { k: 'on_date', label: 'Date', type: 'date', half: true },
    { k: 'location', label: 'Location', half: true }, { k: 'start_time', label: 'Starts', type: 'time', half: true }, { k: 'end_time', label: 'Ends', type: 'time', half: true },
    { k: 'owner_ref', label: 'Who’s In Charge', type: 'contact', hint: 'Anyone in your contacts: team, volunteers, guests, vendors or other.' },
    { k: 'owner', label: 'Or Type A Name', type: 'list', opts: function () { return peopleNames(); }, ph: 'Not in contacts? Type it here.' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
  task: [
    { k: 'title', label: 'Task', auto: true, ph: 'Book portable restrooms' }, 
    { k: 'phase', label: 'Segment', type: 'select', opts: PHASES, half: true }, { k: 'area', label: 'Area', type: 'list', opts: function () { return taskAreas(evRows('ed_tasks')).concat(TASK_AREAS).filter(function (x, i, l) { return l.indexOf(x) === i; }).map(function (x) { return [x, x]; }); }, half: true, ph: 'Food, Stage, AV…' },
    { k: 'due_on', label: 'Due Date', type: 'date', w: 6 }, { k: 'due_time', label: 'Time', w: 3, ph: '10 AM' },
    { k: 'needed', label: 'People', type: 'select', opts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(function (n) { return [n, String(n)]; }), def: 1, w: 3 },
    { k: 'assignee_refs', label: 'Assigned To', type: 'contacts', filter: taskEligible, hint: 'Pick as many as you need: team members, board, prayer team, volunteers, vendors or other contacts.' },
    { k: 'owner_typed', label: 'Or Type A Name', ph: 'Not in contacts? Type names, separated by commas.' },
    { k: 'done', label: 'Done', type: 'check' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
  agenda: [
    { k: 'title', label: 'Segment', auto: true, ph: 'Opening Prayer', hint: 'Call it anything: Worship, Housekeeping, The Message, Lunch Updates.' },
    { k: 'start_time', label: 'Time', type: 'time', half: true }, { k: 'minutes', label: 'Minutes', type: 'int', half: true },
    { k: 'leader_ref', label: 'Led By', type: 'contact', hint: 'Anyone in your contacts: team, volunteers, guests, vendors or other.' },
    { k: 'leader', label: 'Or Type A Name', type: 'list', opts: function () { return peopleNames(); }, ph: 'Not in contacts? Type it here.' },
    { k: 'done', label: 'Done', type: 'check' }, { k: 'notes', label: 'Notes', type: 'textarea', ph: 'What to cover, reminders, decisions.' }],
  setlist: [
    { k: 'title', label: 'Name', auto: true, ph: 'Night 1' }, { k: 'on_date', label: 'Date', type: 'date', half: true }, { k: 'rehearsal', label: 'Rehearsal', half: true, ph: '5:30 PM Sound Check' },
    { k: 'songs', label: 'Songs, One Per Line', type: 'textarea' }],
  item: [
    { k: 'title', label: 'What', auto: true, ph: 'Parking Team' }, { k: 'on_date', label: 'Date', type: 'date', half: true }, { k: 'time_label', label: 'Time', half: true, ph: '6 PM' },
    { k: 'needed', label: 'How Many Needed', type: 'int', half: true, def: 1 }, { k: 'notes', label: 'Details For People Signing Up', type: 'textarea' }],
  signup: [{ k: 'name', label: 'Name', auto: true }, { k: 'phone', label: 'Phone', type: 'tel', half: true }, { k: 'email', label: 'Email', type: 'email', half: true }, { k: 'note', label: 'Note' }],
  rsvp: [{ k: 'name', label: 'Name', auto: true }, { k: 'party', label: 'How Many Coming', type: 'int', half: true, def: 1, hint: 'Including you.' }, { k: 'phone', label: 'Phone', type: 'tel', half: true }, { k: 'email', label: 'Email', type: 'email' }, { k: 'note', label: 'Anything We Should Know?' }],
  offering: [
    { k: 'service', label: 'Service', auto: true, ph: 'Night 1' }, { k: 'on_date', label: 'Date', type: 'date' }, { k: 'cash', label: 'Cash', type: 'money', half: true }, { k: 'checks', label: 'Checks', type: 'money', half: true }, { k: 'online', label: 'Online Or Card', type: 'money', half: true }, { k: 'other', label: 'Other', type: 'money', half: true },
    { k: 'counter1', label: 'Counted By', type: 'list', opts: function () { return peopleNames(); }, half: true }, { k: 'counter2', label: 'Second Counter', type: 'list', opts: function () { return peopleNames(); }, half: true, hint: 'Two people count every offering.' }, { k: 'deposited', label: 'Deposited at the bank', type: 'check' },
    { k: 'notes', label: 'Notes', type: 'textarea' }],
  expense: [
    { k: 'description', label: 'What For', auto: true, ph: 'Water and ice' }, { k: 'category', label: 'Category', type: 'list', opts: ['Food', 'Hospitality', 'Permits', 'Printing', 'Supplies', 'Travel', 'Other'], half: true }, { k: 'amount', label: 'Amount', type: 'money', half: true },
    { k: 'pay_status', label: 'Payment Status', type: 'select', opts: PAY, half: true }, { k: 'due_on', label: 'Due Date', type: 'date', half: true },
    { k: 'payer', label: 'Who Pays It', type: 'list', opts: function () { return peopleNames(); } }, { k: 'notes', label: 'Notes', type: 'textarea' }],
  card: [
    { k: 'name', label: 'Name', auto: true }, { k: 'phone', label: 'Phone', type: 'tel', half: true }, { k: 'email', label: 'Email', type: 'email', half: true },
    { k: 'status', label: 'Status', type: 'select', opts: [['new', 'New'], ['contacted', 'Contacted'], ['connected', 'Connected']], half: true },
    { k: 'follow_up_on', label: 'Follow Up By (Date)', type: 'date', half: true },
    { k: 'follow_up_ref', label: 'Who Follows Up', type: 'contact', none: 'Pick from contacts', hint: 'It shows in their My Stuff.' },
    { k: 'follow_up_by', label: 'Or Type A Name', type: 'list', opts: function () { return peopleNames(); }, ph: 'Not in contacts? Type it here.' },
    { k: 'responses', label: 'Responses', type: 'multi', opts: RESPONSES, one: true }, { k: 'prayer', label: 'Prayer Request', type: 'textarea' }, { k: 'notes', label: 'Follow-Up Notes', type: 'textarea' }]
};
var F_ASSIGN = {
  person: function (team) {
    var f = [{ k: 'team', label: 'Team', type: 'select', opts: TEAMS, half: true }, { k: 'role', label: 'Role At This Event', type: 'list', opts: TITLES, half: true }, { k: 'days', label: 'Days Serving', ph: 'All Nights' }];
    if (team === 'speaker') f = f.concat([
      { k: 'details.status', label: 'Status', type: 'select', opts: ['Confirmed', 'Invited', 'Declined'], viewDef: 'Confirmed', half: true }, { k: 'details.date', label: 'Speaking Date', type: 'date', half: true },
      { k: 'details.time', label: 'Time', half: true, ph: '7:30 PM' }, { k: 'details.topic', label: 'Message', half: true }]);
    if (team === 'speaker' || team === 'worship') f = f.concat([{ html: travelTable, view: travelView }]
      .concat(TRAVEL.reduce(function (l, t) { return l.concat([{ k: 'details.' + t[0] + '_need', label: t[2], type: 'check', drawn: true }, { k: 'details.' + t[0] + '_ok', label: t[3], type: 'check', drawn: true }]); }, []))
      .concat([{ k: 'details.arrive', label: 'Arrives', half: true, ph: 'Fri 2 PM, O’Hare' }, { k: 'details.depart', label: 'Leaves', half: true, ph: 'Sun 11 AM' },
        { k: 'details.travel', label: 'Travel Details', ph: 'Flight number, rental car, mileage, who’s driving' }, { k: 'details.lodging', label: 'Hotel Details', ph: 'Hotel name, confirmation number, nights' },
        { k: 'details.party', label: 'Traveling With', half: true, ph: 'Spouse, 2 band members' }, { k: 'details.diet', label: 'Food Needs Or Allergies', half: true, ph: 'Gluten free' },
        { k: 'details.needs', label: 'Other Needs', ph: 'Green room, product table, wheelchair access, parking pass' }]));
    return f.concat([
      { k: 'amount', label: team === 'speaker' ? 'Honorarium' : 'Stipend Or Fee', type: 'money', half: true }, { k: 'pay_status', label: 'Payment Status', type: 'select', opts: PAY, half: true },
      { k: 'payer', label: 'Who Pays It', type: 'list', opts: function () { return peopleNames(); }, half: true }, { k: 'due_on', label: 'Payment Due', type: 'date', half: true },
      { k: 'notes', label: 'Notes', type: 'textarea' }]);
  },
  vendor: [
    { k: 'service', label: 'What They’re Providing', ph: '60x120 Tent, Sides, Chairs' }, { k: 'status', label: 'Booking', type: 'select', opts: ['Quoted', 'Booked', 'Cancelled'], half: true },
    { k: 'arrival', label: 'Delivery Or Arrival', half: true }, { k: 'cost', label: 'Total Cost', type: 'money', half: true }, { k: 'paid', label: 'Paid So Far', type: 'money', half: true },
    { k: 'pay_status', label: 'Payment Status', type: 'select', opts: PAY, half: true }, { k: 'due_on', label: 'Next Payment Due', type: 'date', half: true },
    { k: 'payer', label: 'Who Pays It', type: 'list', opts: function () { return peopleNames(); } }, { k: 'notes', label: 'Notes', type: 'textarea' }],
  contact: [{ k: 'role', label: 'Role For This Event', ph: 'Landowner, Tent Permit…' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
  equipment: [{ k: 'quantity', label: 'How Many', type: 'int', half: true }, { k: 'loaded', label: 'Loaded', type: 'check', half: true }, { k: 'returned', label: 'Returned', type: 'check', half: true }, { k: 'notes', label: 'Notes', type: 'textarea' }]
};

/* ================================================================ auth + setup */
// Sign in with a texted code needs Supabase phone sign-in turned on with Twilio (a paid service).
// Off for now: people sign in with email and a password. Set to true once phone sign-in is set up.
var TEXT_SIGNIN = false;
function viewAuth() {
  var up = S.authMode === 'up', reset = S.authMode === 'reset';
  var intro = '<div class="auth"><div class="logo">' + IC.tent + '</div><h1>Tent &amp; Table</h1>' +
    '<p class="lead">Plan every event your ministry runs, from the annual tent revival to a monthly board meeting: people, speakers, worship, vendors, equipment, food, money and follow-up.</p>';
  var demo = '<div class="card" style="margin-top:24px"><b>Just Looking?</b><p class="small muted" style="margin:4px 0 10px">Open a demo ministry with sample events. Nothing you change there is saved to an account.</p><button class="btn ghost sm" data-a="try-demo">Try The Demo</button></div></div>';
  // Default: sign in (or create an account) with a code texted to your phone. No password to remember.
  if (TEXT_SIGNIN && S.authVia !== 'email') {
    var sent = S.otpPhone;
    return intro + '<form data-form="auth-phone" class="fgrid">' +
      (sent ? '<div class="fld"><p class="small" style="margin:0">We texted a 6-digit code to <b>' + esc(prettyPhone(S.otpPhone)) + '</b>.</p></div><div class="fld"><label for="a_code">Code</label><input class="inp otp" id="a_code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="8" required autofocus></div>'
        : '<div class="fld"><label for="a_phone">Your Mobile Number</label><input class="inp" id="a_phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 555-0123" required autofocus></div>') +
      '<div class="fld"><button class="btn block' + (S.busy ? ' saving' : '') + '" type="submit"' + (S.busy ? ' disabled' : '') + '>' + (sent ? 'Sign In' : 'Text Me A Code') + '</button></div></form>' +
      (sent ? '<p class="small muted"><a href="#" data-a="otp-resend">Send it again</a> · <a href="#" data-a="otp-change">Use a different number</a></p>' : '<p class="small muted">New or returning, it’s the same: we text you a code and you’re in. Message and data rates may apply.</p>') +
      (S.authMsg ? '<div class="err">' + esc(S.authMsg) + '</div>' : '') +
      '<p class="small muted" style="margin-top:16px"><a href="#" data-a="auth-via" data-v="email">Use email and a password instead</a></p>' + demo;
  }
  return intro +
    '<form data-form="auth" class="fgrid">' +
    '<div class="fld"><label for="a_email">Email</label><input class="inp" id="a_email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" inputmode="email" enterkeyhint="next" required></div>' +
    (reset ? '' : '<div class="fld"><label for="a_pw">Password</label><input class="inp" id="a_pw" name="pw" type="password" autocomplete="' + (up ? 'new-password' : 'current-password') + '" minlength="8" enterkeyhint="go" required>' + (up ? '<span class="hint">At least 8 characters.</span>' : '') + '</div>') +
    '<div class="fld"><button class="btn block' + (S.busy ? ' saving' : '') + '" type="submit"' + (S.busy ? ' disabled' : '') + '>' + (reset ? 'Send Reset Link' : up ? 'Create Account' : 'Sign In') + '</button></div></form>' +
    (up ? '<p class="small muted">Each login belongs to one ministry. If you serve with two ministries, use a different email for each.</p>' : '') +
    (S.authMsg ? '<div class="err">' + esc(S.authMsg) + '</div>' : '') +
    '<p class="small muted" style="margin-top:16px">' + (up ? 'Already have an account? <a href="#" data-a="auth-mode" data-v="in">Sign In</a>' : 'New here? <a href="#" data-a="auth-mode" data-v="up">Create An Account</a> · <a href="#" data-a="auth-mode" data-v="reset">Forgot Password</a>') + '</p>' + (TEXT_SIGNIN ? '<p class="small muted"><a href="#" data-a="auth-via" data-v="phone">Sign in with a text code instead</a></p>' : '') +
    '<div class="card" style="margin-top:24px"><b>Just Looking?</b><p class="small muted" style="margin:4px 0 10px">Open a demo ministry with sample events. Nothing you change there is saved to an account.</p><button class="btn ghost sm" data-a="try-demo">Try The Demo</button></div></div>';
}
function e164(p) { var s = String(p || '').trim(), d = s.replace(/[^0-9]/g, ''); if (s.charAt(0) === '+' && d.length >= 8) return '+' + d; if (d.length === 10) return '+1' + d; if (d.length === 11 && d.charAt(0) === '1') return '+' + d; return ''; }
function prettyPhone(p) { var d = digits(p); if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : String(p || ''); }
function otpErr(e) {
  var m = String((e && e.message) || e || '');
  if (/provider|phone.*(disabled|not enabled)|sms.*(disabled|not)/i.test(m)) return 'Text sign-in isn’t turned on for this app yet. Use email for now.';
  if (/expired|invalid|token/i.test(m)) return 'That code didn’t work or has expired. Tap “Send it again” for a new one.';
  if (/rate|seconds|too many/i.test(m)) return 'Please wait a minute before asking for another code.';
  return errMsg(e);
}
function viewSetup() {
  return head('Tent & Table', '', '', '<button class="link" data-a="signout">Sign Out</button>') + '<main>' +
    '<h1>Set Up Your Ministry</h1><p class="lead">This login will belong to one ministry. Start a new ministry account, or join one with an invite link.</p>' +
    '<div class="card"><h2>Start A Ministry</h2><form data-form="create-org" class="fgrid">' +
    '<div class="fld"><label for="o_name">Ministry Name</label><input class="inp" id="o_name" name="name" placeholder="GGG Ministries" required></div>' +
    '<div class="fld"><label for="o_me">Your Name</label><input class="inp" id="o_me" name="me" autocomplete="name" required></div>' +
    '<div class="fld half"><label for="o_phone">Your Mobile Phone</label><input class="inp" id="o_phone" name="phone" type="tel" inputmode="tel" autocomplete="tel"><span class="hint">Optional. Shown to your team.</span></div>' +
    '<div class="fld half"><label for="o_tax">Ministry Tax ID (EIN)</label><input class="inp" id="o_tax" name="tax_id" placeholder="12-3456789"><span class="hint">Optional.</span></div>' +
    '<div class="fld"><button class="btn block" type="submit">Start The Account</button></div></form></div>' +
    '<div class="card"><h2>Join A Ministry</h2><form data-form="join" class="fgrid">' +
    '<div class="fld"><label for="j_code">Invite Code</label><input class="inp" id="j_code" name="code" value="' + esc(lget('ed.join') || '') + '" placeholder="From the invite link"></div>' +
    '<div class="fld"><label for="j_me">Your Name</label><input class="inp" id="j_me" name="me" required></div>' +
    '<div class="fld"><button class="btn ghost block" type="submit">Join</button></div></form></div>' +
    (S.authMsg ? '<div class="err">' + esc(S.authMsg) + '</div>' : '') + '</main>';
}

/* ================================================================ ministry shell */
function viewShell() {
  if (S.tab === 'settings') return viewSettings();
  var body = S.tab === 'directory' ? viewDirectory() : S.tab === 'events' ? viewEvents() : S.tab === 'mine' ? viewMine() : viewHome();
  var me = myMember(), hr = new Date().getHours();
  var title = S.tab === 'home' ? (hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening') : { events: 'Events', directory: 'Directory', mine: 'My Stuff' }[S.tab];
  var sub = S.tab === 'home' ? [me.name ? me.name.split(' ')[0] : '', new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })].filter(Boolean).join(' · ') : S.tab === 'mine' ? 'Everything on your plate, across every event' : '';
  return head(title, sub, logoMark(),
      (S.tab === 'events' ? addBtn('New Event', 'new-event') : '') + '<button class="iconbtn" data-a="open-settings" aria-label="Settings">' + IC.gear + '</button>', org().name) +
    '<main>' + body + demoNote() + '</main>' +
    mainNav(S.tab, '');
}
// The four main places. On a phone it is the bottom bar (hidden inside an event, which has its own back button);
// on a wide screen it is a sidebar that stays put inside events too.
function mainNav(cur, cls) {
  return '<nav class="bottomnav' + (cls ? ' ' + cls : '') + '" aria-label="Main"><div class="navbrand">' + logoMark() + '<b>' + esc(org().name) + '</b></div>' + [['home', 'Home', IC.home], ['mine', 'My Stuff', IC.user], ['events', 'Events', IC.cal], ['directory', 'Directory', IC.book]].map(function (t) {
    return '<button data-a="nav" data-v="' + t[0] + '"' + (cur === t[0] ? ' aria-current="page"' : '') + '>' + t[2] + '<span>' + t[1] + '</span></button>';
  }).join('') + '</nav>';
}
function demoNote() { return DB.mode === 'demo' ? '<p class="small muted demo-note">This is a demo ministry kept in your browser. <a href="#" data-a="reset-demo">Reset The Demo</a>' + (window.supabase && !window.ED_DEMO ? ' · <a href="#" data-a="leave-demo">Leave The Demo</a>' : '') + '</p>' : ''; }
function myMember() { return ((S.acct && S.acct.members) || []).find(function (m) { return S.user && m.user_id === S.user.id; }) || {}; }

function logoMark(cls) { var o = org() || {}; return o.logo ? '<span class="brandmark logo ' + (cls || '') + '" aria-hidden="true"><img src="' + esc(o.logo) + '" alt=""></span>' : '<span class="brandmark ' + (cls || '') + '" aria-hidden="true">' + IC.tent + '</span>'; }
function viewEvents() {
  var all = events(), up = [], past = [];
  all.forEach(function (e) { ((e.ends_on || e.starts_on || '9999') >= TODAY ? up : past).push(e); });
  up.sort(function (a, b) { return String(a.starts_on || '9').localeCompare(String(b.starts_on || '9')); });
  past.sort(function (a, b) { return String(b.starts_on).localeCompare(String(a.starts_on)); });
  function evRow(e) {
    var d = e.starts_on ? dt(e.starts_on) : null, cd = countdown(e);
    return '<button class="row" data-a="open-event" data-id="' + e.id + '"><span class="datebox">' + (d ? '<small>' + d.toLocaleDateString('en-US', { month: 'short' }) + '</small><b>' + d.getDate() + '</b>' : '<small>TBD</small>') + '</span>' +
      '<div class="main"><div class="t">' + esc(e.title) + '</div><div class="s">' + esc([fmtRange(e.starts_on, e.ends_on), e.time_label, e.place].filter(Boolean).join(' · ')) + '</div></div>' +
      (cd && cd !== 'Finished' ? pill(cd, cd === 'Today' || cd === 'Happening Now' ? 'red' : '') : '') + '<span class="chev">' + IC.chev + '</span></button>';
  }
  return secHead('Upcoming', '', plural(up.length, 'event')) + listBox(up.map(evRow), 'No upcoming events. Tap New Event to plan one, starting with your big annual event.') +
    (past.length ? secHead('Past', '', plural(past.length, 'event')) + listBox(past.map(evRow), '') : '') +
    '<p class="small muted" style="margin-top:18px">For an annual event, open last year’s event and choose <b>Start Next Year</b> from its menu. It keeps your plan and resets the dates, tasks and sign-ups.</p>';
}

/* ---------------------------------------------------------------- directory */
var DIRTABS = [['contacts', 'Contacts'], ['equipment', 'Equipment'], ['budget', 'Budget']];
function usedIn(t, id) {
  var map = { ed_people: ['ed_event_people', 'person_id'], ed_vendors: ['ed_event_vendors', 'vendor_id'], ed_contacts: ['ed_event_contacts', 'contact_id'], ed_equipment: ['ed_event_equipment', 'equipment_id'] }[t];
  if (!map) return [];
  return T(map[0]).filter(function (a) { return a[map[1]] === id; }).map(function (a) { return { a: a, e: byId('ed_events', a.event_id) }; }).filter(function (x) { return x.e; });
}
function viewDirectory() {
  var t = S.dirTab, h = tabs(DIRTABS.map(function (d) { return [d[0], d[1]]; }), t, 'dir-tab', 'seg-tabs');
  if (t === 'budget') return h + viewBudget();
  var q = S.dirQ.toLowerCase();
  var tool = '<div class="toolbar"><label class="search">' + IC.search + '<input id="dir_q" type="search" placeholder="Search ' + esc(DIRTABS.find(function (d) { return d[0] === t; })[1]) + '" value="' + esc(S.dirQ) + '" data-input="dir-q" aria-label="Search"></label>';
  function match(r, keys) { return !q || keys.some(function (k) { return String(r[k] || '').toLowerCase().indexOf(q) >= 0; }); }
  if (t === 'contacts') {
    var every = allContacts().filter(function (c) { return S.dirStatus === 'all' || c.status === S.dirStatus; }), ty = S.dirType || '', grp = ty.indexOf('g:') === 0 ? ty.slice(2) : '';
    var list = every.filter(function (c) {
      return (!ty || (grp ? (c.r.groups || []).indexOf(grp) >= 0 : c.types.indexOf(ty) >= 0)) &&
        match(c.r, ['name', 'title', 'phone', 'email', 'contact_name', 'category', 'role', 'organization']);
    });
    var cnt = function (k) { return every.filter(function (c) { return c.types.indexOf(k) >= 0; }).length; };
    tool += '<div class="filters"><select class="inp sm" data-change="dir-type" aria-label="Type"><option value="">All Contacts · ' + every.length + '</option>' + CTYPES.map(function (c) {
      return '<option value="' + c[0] + '"' + (ty === c[0] ? ' selected' : '') + '>' + c[1] + ' · ' + cnt(c[0]) + '</option>' + (c[0] === 'team' ? TEAM_GROUPS.map(function (g) {
        return '<option value="g:' + g + '"' + (ty === 'g:' + g ? ' selected' : '') + '>&nbsp;&nbsp;– ' + esc({ Speaker: 'Speakers', 'Team Member': 'Staff And Team Members' }[g] || g) + '</option>'; }).join('') : '');
    }).join('') + '</select>' +
      '<select class="inp sm" data-change="dir-status" aria-label="Status">' + [['current', 'Current'], ['previous', 'Previous'], ['all', 'Current And Previous']].map(function (o) { return '<option value="' + o[0] + '"' + (S.dirStatus === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div>';
    return h + tool + secHead(plural(list.length, 'Contact'), '<span class="hbtns"><label class="btn sm plain filebtn">Import<input type="file" accept=".csv,.vcf,.txt,text/csv,text/vcard" data-change="import-file" hidden></label>' + addBtn('Add Contact', 'contact-new', ty && !grp ? ty : '') + '</span>') +
      listBox(list.map(contactRow), q || ty ? 'No contacts match.' : 'Add your team, volunteers, guests, vendors and everyone else here once, then add them to any event.');
  }
  // equipment
  var gear = T('ed_equipment').filter(function (g) { return (!S.dirCat || g.category === S.dirCat) && match(g, ['name', 'category', 'location']); });
  var gcats = {}; T('ed_equipment').forEach(function (g) { if (g.category) gcats[g.category] = 1; });
  tool += '<select class="inp sm" data-change="dir-cat" aria-label="Category"><option value="">All Categories</option>' + Object.keys(gcats).sort().map(function (c) { return '<option' + (S.dirCat === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div>';
  var groups = {}; gear.forEach(function (g) { (groups[g.category || 'Other'] = groups[g.category || 'Other'] || []).push(g); });
  var total = T('ed_equipment').reduce(function (s, g) { return s + num(g.quantity); }, 0), repair = T('ed_equipment').filter(function (g) { return g.condition !== 'Good'; }).length;
  return h + tool + '<div class="stats">' + stat('Items', T('ed_equipment').length) + stat('Pieces Owned', total) + stat('Need Attention', repair, repair > 0) + '</div>' +
    secHead('Equipment', addBtn('Add Equipment', 'dir-add', 'ed_equipment')) +
    (gear.length ? Object.keys(groups).sort().map(function (c) {
      return '<div class="grouplbl">' + esc(c) + '</div>' + listBox(groups[c].sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (g) {
        return row({ act: 'dir-open', id: g.id, t: 'ed_equipment', title: esc(g.name), sub: esc('Stored At ' + (g.location || '—')) + (g.condition !== 'Good' ? ' · <span class="danger">' + esc(g.condition) + '</span>' : ''), right: '<span class="qty">' + num(g.quantity) + '</span>' });
      }), '');
    }).join('') : '<div class="empty card">Everything the ministry owns: sound gear, tables, cones, offering buckets. Each event picks from this list.</div>');
}
function avatar(n, tone) { var i = String(n || '?').replace(/^(pastor|rev\.?|evangelist|dr\.?)\s+/i, '').replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() || '?'; return '<span class="avatar' + (tone ? ' tone-' + tone : '') + '" aria-hidden="true">' + esc(i) + '</span>'; }

function eventMoney(e) {
  var id = e.id, vend = T('ed_event_vendors').filter(function (r) { return r.event_id === id && r.status !== 'Cancelled'; }), ppl = T('ed_event_people').filter(function (r) { return r.event_id === id && num(r.amount) > 0; }), exp = T('ed_expenses').filter(function (r) { return r.event_id === id; });
  var committed = vend.reduce(function (s, r) { return s + num(r.cost); }, 0) + ppl.reduce(function (s, r) { return s + num(r.amount); }, 0) + exp.reduce(function (s, r) { return s + num(r.amount); }, 0);
  var paid = vend.reduce(function (s, r) { return s + (r.pay_status === 'Paid In Full' ? num(r.cost) : Math.min(num(r.paid), num(r.cost))); }, 0) + ppl.filter(function (r) { return r.pay_status === 'Paid In Full'; }).reduce(function (s, r) { return s + num(r.amount); }, 0) + exp.filter(function (r) { return r.pay_status === 'Paid In Full'; }).reduce(function (s, r) { return s + num(r.amount); }, 0);
  var given = T('ed_offerings').filter(function (r) { return r.event_id === id; }).reduce(function (s, r) { return s + num(r.cash) + num(r.checks) + num(r.online) + num(r.other); }, 0);
  return { budget: num(e.budget), committed: committed, paid: paid, owed: committed - paid, given: given };
}
function viewBudget() {
  var y = S.budgetYear, years = {}; years[y] = 1; years[new Date().getFullYear()] = 1;
  T('ed_budget').forEach(function (b) { years[b.year] = 1; }); events().forEach(function (e) { if (e.starts_on) years[+e.starts_on.slice(0, 4)] = 1; });
  var lines = T('ed_budget').filter(function (b) { return +b.year === +y; }), planned = lines.reduce(function (s, b) { return s + num(b.planned); }, 0);
  var evs = events().filter(function (e) { return e.starts_on && +e.starts_on.slice(0, 4) === +y; }).sort(function (a, b) { return a.starts_on.localeCompare(b.starts_on); });
  var tot = { committed: 0, paid: 0, given: 0 }; var per = evs.map(function (e) { var m = eventMoney(e); tot.committed += m.committed; tot.paid += m.paid; tot.given += m.given; return { e: e, m: m }; });
  return '<div class="toolbar"><label class="sr" for="b_year">Year</label><select class="inp sm" id="b_year" data-change="budget-year">' + Object.keys(years).sort().map(function (x) { return '<option' + (+x === +y ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
    '<div class="stats">' + stat('Planned', money(planned)) + stat('Committed', money(tot.committed)) + stat(planned - tot.committed >= 0 ? 'Left To Commit' : 'Over Plan', money(Math.abs(planned - tot.committed)), planned - tot.committed < 0) + '</div>' +
    secHead('Budget Lines', addBtn('Add Line', 'dir-add', 'ed_budget')) +
    listBox(lines.map(function (b) { var e = b.event_id && byId('ed_events', b.event_id); return row({ act: 'dir-edit', id: b.id, t: 'ed_budget', title: esc(b.name), sub: esc([e ? 'For ' + e.title : '', b.notes].filter(Boolean).join(' · ')), right: '<span class="amt">' + money(b.planned) + '</span>' }); }),
      'Add what you plan to spend this year, by event or category.') +
    secHead('Events In ' + y, '', 'Given ' + money(tot.given)) +
    listBox(per.map(function (x) {
      return row({ act: 'open-event', id: x.e.id, title: esc(x.e.title), sub: [['Budget', x.m.budget], ['Committed', x.m.committed], ['Paid', x.m.paid], ['Given', x.m.given]].filter(function (p) { return p[1]; }).map(function (p) { return p[0] + ' ' + money(p[1]); }).join(' · ') || 'No money tracked yet',
        right: x.m.budget && x.m.committed > x.m.budget ? pill('Over Budget', 'red') : '' });
    }), 'No events dated in ' + y + '.');
}
function openDirRecord(t, id) {
  var r = byId(t, id); if (!r) return;
  var used = usedIn(t, id), sub = '', info = [];
  if (t === 'ed_people') { sub = [personTypes(r).map(ctypeOne).join(', '), r.title, r.status === 'previous' ? 'Previous' : ''].filter(Boolean).join(' · '); info = [['Contact Type', (r.groups || []).join(', ')], ['Phone', r.phone], ['Email', r.email], ['Background Check', r.bg_cleared_on || personTypes(r).indexOf('volunteer') >= 0 ? bgText(r) : ''], ['Address', r.address], ['Notes', r.notes]]; }
  if (t === 'ed_vendors') { sub = ['Vendor', r.category].filter(Boolean).join(' · '); info = [['Contact', r.contact_name], ['Phone', r.phone], ['Email', r.email], ['Website', r.website], ['Address', r.address], ['Notes', r.notes]]; }
  if (t === 'ed_contacts') { sub = ['Other', r.role, r.organization].filter(Boolean).join(' · '); info = [['Phone', r.phone], ['Email', r.email], ['Website', r.website], ['Address', r.address], ['Notes', r.notes]]; }
  if (t === 'ed_equipment') {
    sub = r.category; info = [['Quantity Owned', String(num(r.quantity))], ['Stored At', r.location], ['Condition', r.condition], ['Notes', r.notes]];
  }
  openSheet(function () {
    return '<div class="sheethead">' + (t !== 'ed_equipment' ? avatar(r.name) : '') + '<div><h3>' + esc(r.name) + '</h3>' + (sub ? '<p class="lead">' + esc(sub) + '</p>' : '') + '</div></div>' + actions(r) + infoList(info) +
      prayingFor(t, id) + theirList(t, r) + '<h4>Events</h4>' + (used.length ? '<div class="list">' + used.map(function (u) {
        return row({ act: 'open-event', id: u.e.id, title: esc(u.e.title), sub: esc([fmtRange(u.e.starts_on, u.e.ends_on), u.a.role || u.a.service || (u.a.quantity ? 'Bringing ' + u.a.quantity : '')].filter(Boolean).join(' · ')) });
      }).join('') + '</div>' : '<p class="small muted">Not used in any event yet.</p>') +
      '<div class="acts"><button class="btn ghost" data-a="sheet-del">Delete</button><span class="grow"></span><button class="btn plain" data-a="close">Close</button><button class="btn" data-a="dir-edit" data-id="' + r.id + '" data-t="' + t + '">Edit</button></div>';
  }, null, { del: function () { ask('Delete ' + r.name + '?', 'Delete', function () { return remove(t, r.id).then(render); }, used.length ? 'It will also be removed from ' + plural(used.length, 'event') + '.' : ''); } });
}
function theirList(t, r) {
  if (t === 'ed_equipment') return '';
  var ref = t + ':' + r.id, st = stuffFor([ref], [String(r.name || '').toLowerCase()]), open = st.tasks.filter(function (x) { return !x.t.done; });
  if (!open.length && !st.lead.length) return '';
  var txt = listOf(ref).text;
  return '<h4>Assigned To ' + esc(firstName(r.name)) + '</h4><div class="list">' + open.slice(0, 6).map(myTaskRow).join('') + st.lead.slice(0, 4).map(function (x) {
      return row({ title: esc(x.x.title), sub: esc([x.e.title, x.d ? fmtDay(x.d) : '', fmtTime(x.k)].filter(Boolean).join(' · ')), lead: '<span class="time">Lead</span>' }); }).join('') + '</div>' +
    (open.length > 6 ? '<p class="small muted">' + (open.length - 6) + ' more tasks.</p>' : '') +
    '<div class="btnrow">' + (r.phone ? '<a class="btn sm" href="' + esc(smsHref(r.phone, txt)) + '">' + IC.text + ' Text Their List</a>' : '') + (r.email ? '<a class="btn sm plain" href="' + esc(mailHref(r.email, 'Your list · ' + ((org() || {}).name || ''), txt)) + '">' + IC.mail + ' Email It</a>' : '') + '<button class="btn sm plain" data-a="copy" data-v="' + esc(txt) + '">Copy</button></div>';
}
function prayingFor(t, id) {
  if (t !== 'ed_people') return '';
  var ps = T('ed_prayer').filter(function (p) { return p.person_id === id; }).map(function (p) { return { p: p, e: byId('ed_events', p.event_id) }; }).filter(function (x) { return x.e; });
  if (!ps.length) return '';
  return '<h4>Praying For</h4><div class="list">' + ps.map(function (x) {
    return row({ act: 'open-prayer', id: x.p.id, lead: '<span class="prayic' + (x.p.answer ? ' done' : '') + '">' + (x.p.answer ? IC.check : IC.heart) + '</span>', title: esc(x.p.title), sub: esc([x.e.title, x.p.answer ? 'What God did: ' + x.p.answer : x.p.follow_up_on ? 'Follow up ' + fmtDay(x.p.follow_up_on, { month: 'short', day: 'numeric' }) : ''].filter(Boolean).join(' · ')), right: x.p.answer ? pill('Answered', 'green') : followDue(x.p) ? pill('Follow Up', 'amber') : '' });
  }).join('') + '</div>';
}
function parseCSV(text) {
  var rows = [], row = [], f = '', q = false, i, c;
  text = String(text || '').replace(/^﻿/, '');
  for (i = 0; i < text.length; i++) {
    c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',' || c === ';' || c === '\t') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter(function (r) { return r.some(function (x) { return String(x).trim(); }); });
}
var IMP_COLS = { name: /^(full ?name|name|contact|contact name|display name)$/, first: /^(first|first ?name|given ?name)$/, last: /^(last|last ?name|surname|family ?name)$/,
  phone: /^(phone|mobile|cell|cell ?phone|mobile ?phone|phone ?number|primary ?phone|phone 1 - value|telephone)$/, email: /^(email|e-mail|email ?address|e-mail 1 - value|email 1 - value)$/,
  title: /^(title|role|job ?title|position)$/, organization: /^(organization|organisation|company|business|org|organization 1 - name)$/, address: /^(address|street|mailing ?address|home ?address)$/,
  notes: /^(notes?|comments?)$/, type: /^(type|contact ?type|group|category|kind)$/ };
function rowsFromCSV(text) {
  var rows = parseCSV(text); if (rows.length < 2) return [];
  var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); }), map = {};
  Object.keys(IMP_COLS).forEach(function (k) { var i = head.findIndex(function (h) { return IMP_COLS[k].test(h); }); if (i >= 0) map[k] = i; });
  if (map.name == null && map.first == null && map.organization == null) return null;
  return rows.slice(1).map(function (r) {
    var g = function (k) { return map[k] != null ? String(r[map[k]] || '').trim() : ''; };
    return { name: g('name') || [g('first'), g('last')].filter(Boolean).join(' ') || g('organization'), phone: g('phone'), email: g('email'), title: g('title'), organization: g('organization'), address: g('address'), notes: g('notes'), type: g('type') };
  }).filter(function (x) { return x.name; });
}
function rowsFromVCF(text) {
  var out = [];
  String(text || '').replace(/\r\n[ \t]/g, '').split(/BEGIN:VCARD/i).slice(1).forEach(function (card) {
    var get = function (k) { var m = new RegExp('^' + k + '(?:;[^:\n]*)?:(.*)$', 'im').exec(card); return m ? m[1].replace(/\\,/g, ',').replace(/\\;/g, ';').trim() : ''; };
    var n = get('N').split(';'), name = get('FN') || [n[1], n[0]].filter(Boolean).join(' ');
    var adr = get('ADR').split(';').filter(Boolean).join(', ');
    if (name) out.push({ name: name, phone: get('TEL'), email: get('EMAIL'), title: get('TITLE'), organization: get('ORG').split(';')[0], address: adr, notes: get('NOTE'), type: '' });
  });
  return out;
}
function typeOf(s) { s = String(s || '').toLowerCase(); return /vendor|business|supplier/.test(s) ? 'vendor' : /volunteer/.test(s) ? 'volunteer' : /guest|visitor|attend/.test(s) ? 'guest' : /team|staff|board|leader|worship|speaker|prayer/.test(s) ? 'team' : /other|partner|official/.test(s) ? 'other' : ''; }
function importFile(file) {
  var rd = new FileReader();
  rd.onload = function () {
    var txt = String(rd.result || ''), rows = /BEGIN:VCARD/i.test(txt) ? rowsFromVCF(txt) : rowsFromCSV(txt);
    if (rows === null) { toast('Couldn’t find a Name column. Add a header row with Name, Phone and Email.'); return; }
    if (!rows.length) { toast('No contacts found in that file.'); return; }
    S.imp = { rows: rows.slice(0, 1000), as: rows.some(function (r) { return typeOf(r.type); }) ? 'file' : 'volunteer' };
    importSheet();
  };
  rd.onerror = function () { toast('That file couldn’t be read.'); };
  rd.readAsText(file);
}
function impDup(r) { var p = digits(r.phone).slice(-10), e = String(r.email || '').toLowerCase(), n = r.name.toLowerCase(); return allContacts().some(function (c) { return c.name.toLowerCase() === n && (!p || digits(c.phone).slice(-10) === p || (e && String(c.email || '').toLowerCase() === e) || (!c.phone && !c.email)); }); }
function importSheet() {
  openSheet(function () {
    var im = S.imp, fresh = im.rows.filter(function (r) { return !impDup(r); }), dup = im.rows.length - fresh.length, hasType = im.rows.some(function (r) { return typeOf(r.type); });
    return '<h3>Import Contacts</h3><p class="lead">Found ' + plural(im.rows.length, 'contact') + (dup ? '. ' + dup + ' already in your contacts will be skipped' : '') + '.</p>' +
      '<div class="fgrid"><div class="fld"><label for="imp_as">Add Them As</label><select class="inp" id="imp_as" data-change="imp-as">' + (hasType ? '<option value="file"' + (im.as === 'file' ? ' selected' : '') + '>Use the Type column in the file</option>' : '') +
      CTYPES.map(function (c) { return '<option value="' + c[0] + '"' + (im.as === c[0] ? ' selected' : '') + '>' + esc(c[1]) + '</option>'; }).join('') + '</select><span class="hint">You can change anyone’s type later.</span></div></div>' +
      '<div class="list imp-prev">' + fresh.slice(0, 8).map(function (r) { var ty = im.as === 'file' ? typeOf(r.type) || 'other' : im.as; return row({ lead: avatar(r.name, CTYPE_TONE[ty]), title: esc(r.name), sub: contactSub([r.title, r.organization], r.phone, r.email), right: pill(ctypeOne(ty), 'tone-' + CTYPE_TONE[ty]) }); }).join('') + '</div>' +
      (fresh.length > 8 ? '<p class="small muted">And ' + (fresh.length - 8) + ' more.</p>' : '') +
      '<p class="small muted">Spreadsheets need a header row (Name, Phone, Email; Title, Organization, Address, Notes and Type are optional). From a phone, export contacts as a .vcf file.</p>' +
      '<div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Cancel</button><button class="btn" data-a="sheet-save"' + (fresh.length ? '' : ' disabled') + '>Import ' + fresh.length + '</button></div>';
  }, function () {
    var im = S.imp, fresh = im.rows.filter(function (r) { return !impDup(r); }), oid = org().id, n = 0;
    var rowFor = function (r) {
      var ty = im.as === 'file' ? typeOf(r.type) || 'other' : im.as, base = { org_id: oid, phone: r.phone.slice(0, 40), email: r.email.slice(0, 120), address: r.address.slice(0, 300), notes: r.notes.slice(0, 2000) };
      if (ty === 'vendor') return ['ed_vendors', Object.assign(base, { name: (r.organization || r.name).slice(0, 120), contact_name: r.organization ? r.name.slice(0, 80) : '', category: '', website: '' })];
      if (ty === 'other') return ['ed_contacts', Object.assign(base, { name: r.name.slice(0, 120), organization: r.organization.slice(0, 120), role: r.title.slice(0, 80), website: '' })];
      return ['ed_people', Object.assign(base, { name: r.name.slice(0, 120), title: r.title.slice(0, 80), status: 'current', groups: [{ team: 'Team Member', volunteer: 'Volunteer', guest: 'Guest' }[ty]] })];
    };
    return busy(fresh.reduce(function (p, r) { var x = rowFor(r); return p.then(function () { return DB.save(x[0], x[1]).then(function (saved) { put(x[0], saved); n++; }); }); }, Promise.resolve()), '').then(function () { closeSheet(); S.imp = null; toast('Imported ' + plural(n, 'contact')); render(); }).catch(function () { render(); });
  });
}
function newContact(type, after) {
  S.newGroups = { team: ['Team Member'], volunteer: ['Volunteer'], guest: ['Guest'] }[type] || [];
  editDir(type === 'vendor' ? 'ed_vendors' : type === 'other' ? 'ed_contacts' : 'ed_people', null, after);
  S.newGroups = null;
}
var DIRFORM = { ed_people: ['person', 'Contact'], ed_vendors: ['vendor', 'Vendor'], ed_contacts: ['contact', 'Contact'], ed_equipment: ['equipment', 'Equipment'], ed_budget: ['budget', 'Budget Line'] };
function editDir(t, rec, after) {
  var d = DIRFORM[t];
  editRow(t, rec, F[d[0]], { title: rec ? rec.name || d[1] : 'Add ' + d[1], view: /^ed_(people|vendors|contacts)$/.test(t), viewSkip: 'name', top: rec && t !== 'ed_equipment' && t !== 'ed_budget' ? function (b) { return S.sheet && S.sheet.viewMode ? actions(b) : ''; } : null, base: rec ? null : t === 'ed_people' ? { org_id: org().id, status: 'current', groups: S.newGroups || [] } : { org_id: org().id },
    prep: function (v) { v.org_id = org().id; if (t === 'ed_budget' && !v.event_id) v.event_id = null; if (t === 'ed_equipment') v.quantity = Math.max(0, v.quantity || 0); return v; },
    after: after, delMsg: t === 'ed_equipment' ? 'Delete this from your equipment?' : t === 'ed_budget' ? 'Delete this budget line?' : 'Delete this contact?', delSub: rec && usedIn(t, rec.id).length ? 'It will also be removed from every event that uses it.' : '' });
}

/* ---------------------------------------------------------------- home */
function upcomingEvents() { return events().filter(function (e) { return (e.ends_on || e.starts_on || '9999') >= TODAY; }).sort(function (a, b) { return String(a.starts_on || '9').localeCompare(String(b.starts_on || '9')); }); }
function withEvent(e, fn) { var keep = S.ev; S.ev = e; try { return fn(); } finally { S.ev = keep; } }
function viewHome() {
  var up = upcomingEvents(), next = up[0], wk = addDays(TODAY, 7);
  var att = [], week = [], late = 0, dueWk = 0, volNeed = 0, cards = 0;
  events().forEach(function (e) {
    var isUp = up.indexOf(e) >= 0;
    withEvent(e, function () {
      if (isUp) attention(e).forEach(function (x) { att.push({ e: e, x: x }); });
      cards += evRows('ed_cards').filter(function (c) { return c.status === 'new'; }).length;
      if (!isUp) return;
      late += evRows('ed_tasks').filter(function (t) { return !t.done && t.due_on && t.due_on < TODAY; }).length;
      dueWk += evRows('ed_tasks').filter(function (t) { return !t.done && t.due_on && t.due_on <= wk; }).length;
      if (on('volunteers') && num(e.volunteer_goal)) volNeed += Math.max(0, num(e.volunteer_goal) - volCount());
      if (on('calendar')) evRows('ed_schedule').filter(function (s) { return s.on_date >= TODAY && s.on_date <= wk; }).forEach(function (s) { week.push({ d: s.on_date, k: s.start_time || '', title: s.title, sub: [fmtTime(s.start_time), e.title].filter(Boolean).join(' · '), e: e, tab: 'calendar' }); });
      if (on('tasks')) evRows('ed_tasks').filter(function (t) { return !t.done && t.due_on && t.due_on >= TODAY && t.due_on <= wk; }).forEach(function (t) { week.push({ d: t.due_on, k: 'zz', title: t.title, sub: ['Task', t.owner, e.title].filter(Boolean).join(' · '), e: e, tab: 'tasks' }); });
    });
  });
  week.sort(function (a, b) { return (a.d + a.k).localeCompare(b.d + b.k); });
  att.sort(function (a, b) { return (a.x[0] === 'red' ? 0 : 1) - (b.x[0] === 'red' ? 0 : 1); });
  var h = '';
  h += '<div class="stats three">' +
    '<button class="stat c-green" data-a="nav" data-v="events"><div class="v">' + up.length + '</div><div class="k">Upcoming Events</div></button>' +
    '<button class="stat ' + (late ? 'c-red' : 'c-ink') + '" data-a="home-jump" data-v="week"><div class="v">' + dueWk + '</div><div class="k">Tasks This Week' + (late ? ' · ' + late + ' Late' : '') + '</div></button>' +
    '<button class="stat ' + (volNeed ? 'c-amber' : 'c-ink') + '" data-a="home-jump" data-v="att"><div class="v">' + volNeed + '</div><div class="k">Volunteers Needed</div></button></div>';
  var mr = myRefs(), my = stuffFor(mr, myNames()), myOpen = my.tasks.filter(function (x) { return !x.t.done; }), myLate = myOpen.filter(function (x) { return x.t.due_on && x.t.due_on < TODAY; }).length, remLeft = reminders().filter(function (r) { return !remSent(r.key); }).length;
  var myBits = [plural(myOpen.length, 'open task'), myLate ? myLate + ' overdue' : '', my.lead.length ? plural(my.lead.length, 'segment') + ' to lead' : '', my.cards.length ? plural(my.cards.length, 'card') + ' to follow up' : '', remLeft ? plural(remLeft, 'reminder') + ' to send' : ''].filter(Boolean);
  h += '<button class="card remcard mycard" data-a="nav" data-v="mine"><span class="docic">' + IC.user + '</span><span class="main"><b>My Stuff</b><span>' + esc(myBits.join(' · ')) + '</span></span><span class="chev">' + IC.chev + '</span></button>';
  h += secHead('Next Up');
  if (next) {
    var days = next.starts_on ? dayDiff(next.starts_on, TODAY) : null, ts = evRows('ed_tasks', next), td = ts.filter(function (t) { return t.done; }).length;
    h += '<button class="countdown cdbtn" data-a="open-event" data-id="' + next.id + '"><div class="cd-num">' + (days != null && days > 1 ? '<b>' + days + '</b><span>Days<br>To Go</span>' : '<b class="word">' + esc(countdown(next)) + '</b>') + '</div>' +
      '<div class="cd-side"><div class="cd-k">Next Up</div><div class="cd-title">' + esc(next.title) + '</div><div class="cd-sub">' + esc(fmtRange(next.starts_on, next.ends_on)) + '</div>' + (ts.length ? '<div class="cd-bar"><i style="width:' + Math.round(100 * td / ts.length) + '%"></i></div>' : '') + '</div></button>';
  } else h += '<div class="card empty">No upcoming events. ' + addBtn('Plan An Event', 'new-event') + '</div>';
  h += '<div id="home-att"></div>' + secHead('Needs Attention', '', att.length ? String(att.length) : '') + (att.length ? '<div class="list">' + att.slice(0, 8).map(function (a) {
    return '<button class="row flag ' + a.x[0] + '" data-a="open-event-tab" data-id="' + a.e.id + '" data-v="' + a.x[3] + '"><div class="main"><div class="t">' + esc(a.x[1]) + '</div><div class="s">' + esc(a.e.title) + (a.x[2] ? ' · ' + esc(a.x[2]) : '') + '</div></div><span class="chev">' + IC.chev + '</span></button>';
  }).join('') + '</div>' + (att.length > 8 ? '<p class="small muted">' + (att.length - 8) + ' more. Open an event to see all of its items.</p>' : '') : '<div class="empty good">' + IC.check + ' Everything is on track.</div>');
  h += '<div id="home-week"></div>' + secHead('This Week') + listBox(week.slice(0, 8).map(function (w) {
    return '<button class="row" data-a="open-event-tab" data-id="' + w.e.id + '" data-v="' + w.tab + '"><span class="datebox sm"><small>' + dt(w.d).toLocaleDateString('en-US', { weekday: 'short' }) + '</small><b>' + dt(w.d).getDate() + '</b></span><div class="main"><div class="t">' + esc(w.title) + '</div><div class="s">' + esc(w.sub) + '</div></div><span class="chev">' + IC.chev + '</span></button>';
  }), 'Nothing scheduled in the next 7 days.');
  h += secHead('Quick Add') + '<div class="quick">' + [['new-event', 'Event', IC.cal, ''], ['contact-new', 'Contact', IC.user, ''], ['dir-add', 'Equipment', IC.box, 'ed_equipment']].map(function (q) {
    return '<button class="qa" data-a="' + q[0] + '"' + (q[3] ? ' data-id="' + q[3] + '"' : '') + '>' + q[2] + '<span>' + q[1] + '</span></button>';
  }).join('') + '</div>';
  return h;
}

/* ---------------------------------------------------------------- my stuff
   Everything assigned to one person across every event: tasks, agenda segments and schedule items
   they lead, teams they serve on, and connection cards they follow up. "Me" is the login's own
   contact (picked in My Stuff, or matched by email, phone or name). */
var TOMORROW = addDays(TODAY, 1);
function myRefs() {
  var me = myMember(), p = me.prefs || {}, out = [];
  if (p.contact_ref && refContact(p.contact_ref)) out.push(p.contact_ref);
  if (p.contact_ref === 'none') return out;
  var em = String(me.email || (S.user && S.user.email) || '').toLowerCase(), ph = digits(me.phone).replace(/^\+?1/, ''), nm = String(me.name || '').toLowerCase();
  allContacts().forEach(function (c) {
    var r = refOf(c); if (out.indexOf(r) >= 0 || (p.contact_ref && p.contact_ref !== r && out.length)) return;
    if ((em && String(c.email || '').toLowerCase() === em) || (ph.length >= 7 && digits(c.phone).replace(/^\+?1/, '') === ph) || (nm && c.name.toLowerCase() === nm)) out.push(r);
  });
  return out;
}
function myNames() { var me = myMember(), n = refNames(myRefs()); if (me.name) n.push(me.name); return n.map(function (x) { return x.toLowerCase(); }); }
function hasName(text, names) { return splitNames(text).some(function (x) { return names.indexOf(x.toLowerCase()) >= 0; }); }
function stuffFor(refs, names, created) {
  var out = { tasks: [], lead: [], serve: [], cards: [] }, evs = {};
  events().forEach(function (e) { evs[e.id] = e; });
  T('ed_tasks').forEach(function (t) {
    var e = evs[t.event_id]; if (!e) return;
    var mine = created ? names.indexOf(String(t.task_owner || '').toLowerCase()) >= 0 : ((t.assignee_refs || []).some(function (r) { return refs.indexOf(r) >= 0; }) || hasName(t.owner, names));
    if (mine) out.tasks.push({ t: t, e: e });
  });
  if (created) return out;
  T('ed_agenda').forEach(function (x) { var e = evs[x.event_id]; if (e && (e.ends_on || e.starts_on || '9') >= TODAY && (refs.indexOf(x.leader_ref) >= 0 || hasName(x.leader, names))) out.lead.push({ kind: 'agenda', x: x, e: e, d: e.starts_on || '', k: x.start_time || '' }); });
  T('ed_schedule').forEach(function (x) { var e = evs[x.event_id]; if (e && (x.on_date || '9') >= TODAY && (refs.indexOf(x.owner_ref) >= 0 || hasName(x.owner, names))) out.lead.push({ kind: 'sched', x: x, e: e, d: x.on_date || '', k: x.start_time || '' }); });
  out.lead.sort(function (a, b) { return (a.d + a.k).localeCompare(b.d + b.k); });
  T('ed_event_people').forEach(function (x) { var e = evs[x.event_id]; if (e && (e.ends_on || e.starts_on || '9') >= TODAY && refs.indexOf('ed_people:' + x.person_id) >= 0) out.serve.push({ x: x, e: e }); });
  out.serve.sort(function (a, b) { return String(a.e.starts_on || '9').localeCompare(String(b.e.starts_on || '9')); });
  T('ed_cards').forEach(function (x) { var e = evs[x.event_id]; if (e && x.status !== 'connected' && (refs.indexOf(x.follow_up_ref) >= 0 || hasName(x.follow_up_by, names))) out.cards.push({ x: x, e: e }); });
  return out;
}
function whenGroup(t) { if (!t.due_on) return 'none'; if (t.due_on < TODAY) return 'late'; if (t.due_on === TODAY) return 'today'; if (t.due_on <= addDays(TODAY, 7)) return 'week'; return 'later'; }
var WHEN = [['late', 'Overdue'], ['today', 'Today'], ['week', 'This Week'], ['later', 'Coming Up'], ['none', 'No Due Date']];
function myTaskRow(x) {
  var t = x.t, late = !t.done && t.due_on && t.due_on < TODAY;
  return '<div class="row">' + ck(t.done, 'toggle-task', t.id) + '<button class="main" data-a="my-task" data-id="' + t.id + '"><div class="t' + (t.done ? ' done' : '') + '">' + esc(t.title) + '</div><div class="s"><span class="evtag">' + esc(x.e.title) + '</span>' +
    (t.due_on ? '<span class="' + (late ? 'danger' : '') + '">' + esc(fmtDay(t.due_on, { month: 'short', day: 'numeric' }) + (t.due_time ? ', ' + t.due_time : '')) + '</span>' : '') + (taskNeed(t) ? '<span class="need"> · ' + esc(taskNeed(t)) + '</span>' : '') + '</div></button></div>';
}
function stuffText(title, st) {
  var L = [title];
  var open = st.tasks.filter(function (x) { return !x.t.done; }).sort(function (a, b) { return String(a.t.due_on || '9').localeCompare(String(b.t.due_on || '9')); });
  if (open.length) { L.push('', 'TASKS'); open.forEach(function (x) { L.push('[ ] ' + x.t.title + ' · ' + x.e.title + (x.t.due_on ? ' · due ' + fmtDay(x.t.due_on) + (x.t.due_time ? ', ' + x.t.due_time : '') : '')); }); }
  if (st.lead.length) { L.push('', 'LEADING'); st.lead.forEach(function (x) { L.push(x.x.title + ' · ' + x.e.title + ' · ' + [x.d ? fmtDay(x.d) : '', fmtTime(x.k)].filter(Boolean).join(', ')); }); }
  if (st.serve.length) { L.push('', 'SERVING ON'); st.serve.forEach(function (x) { L.push(x.e.title + ' · ' + teamLabel(x.x.team) + (x.x.role ? ' (' + x.x.role + ')' : '') + (x.e.starts_on ? ' · ' + fmtRange(x.e.starts_on, x.e.ends_on) : '')); }); }
  if (st.cards.length) { L.push('', 'FOLLOW UP WITH'); st.cards.forEach(function (x) { L.push(x.x.name + (x.x.phone ? ' · ' + x.x.phone : '') + ' · ' + x.e.title); }); }
  if (L.length === 1) L.push('Nothing assigned right now.');
  return L.join('\n');
}
function viewMine() {
  var refs = myRefs(), names = myNames(), created = S.mineTab === 'created', st = stuffFor(refs, names, created), ev = S.mineEv || '';
  var tasks = st.tasks.filter(function (x) { return (!ev || x.e.id === ev) && (S.mineDone || !x.t.done); });
  var open = st.tasks.filter(function (x) { return !x.t.done; });
  var h = tabs([['assigned', 'Assigned To Me'], ['created', 'Created By Me']], created ? 'created' : 'assigned', 'mine-tab', 'seg-tabs');
  if (!refs.length && !created) h += '<div class="card tip"><b>Which Contact Is You?</b><p class="small muted">Pick yourself from your contacts so tasks, agenda segments and teams assigned to you show up here.</p><button class="btn sm" data-a="pick-me">Choose Me</button></div>';
  h += '<div class="stats three">' + stat('Overdue', open.filter(function (x) { return whenGroup(x.t) === 'late'; }).length, true) + stat('This Week', open.filter(function (x) { var g = whenGroup(x.t); return g === 'today' || g === 'week'; }).length) + stat('Open Tasks', open.length) + '</div>';
  if (!created) { var rem = reminders(); h += '<button class="card remcard" data-a="reminders"><span class="docic">' + IC.text + '</span><span class="main"><b>Reminders To Send' + (rem.length ? ' · ' + rem.filter(function (r) { return !remSent(r.key); }).length : '') + '</b><span>' + (rem.length ? (autoReminding() ? 'Sent automatically each morning at 7. Tap to see who gets one, or send one yourself.' : 'Volunteers serving tomorrow and tasks due soon. Text or email each one in a tap.') : 'Nothing to send today. Volunteers serving tomorrow and tasks coming due will show up here.') + '</span></span><span class="chev">' + IC.chev + '</span></button>'; }
  // the big picture: each event with what's mine in it
  var byEv = {};
  st.tasks.concat(st.lead, st.serve, st.cards).forEach(function (x) { (byEv[x.e.id] = byEv[x.e.id] || { e: x.e, t: 0, l: 0, s: 0, c: 0 }); });
  open.forEach(function (x) { byEv[x.e.id].t++; }); st.lead.forEach(function (x) { byEv[x.e.id].l++; }); st.serve.forEach(function (x) { byEv[x.e.id].s++; }); st.cards.forEach(function (x) { byEv[x.e.id].c++; });
  var evl = Object.keys(byEv).map(function (k) { return byEv[k]; }).filter(function (x) { return (x.e.ends_on || x.e.starts_on || '9') >= TODAY || x.t; }).sort(function (a, b) { return String(a.e.starts_on || '9').localeCompare(String(b.e.starts_on || '9')); });
  if (evl.length) h += secHead('By Event') + '<div class="list">' + evl.map(function (x) {
    var d = x.e.starts_on ? dt(x.e.starts_on) : null;
    return row({ act: 'open-event', id: x.e.id, lead: '<span class="datebox sm">' + (d ? '<small>' + d.toLocaleDateString('en-US', { month: 'short' }) + '</small><b>' + d.getDate() + '</b>' : '<small>TBD</small>') + '</span>', title: esc(x.e.title),
      sub: esc([x.t ? plural(x.t, 'task') : '', x.l ? plural(x.l, 'segment') + ' to lead' : '', x.s ? 'Serving' : '', x.c ? plural(x.c, 'card') + ' to follow up' : ''].filter(Boolean).join(' · ') || 'All done'), right: '' });
  }).join('') + '</div>';
  var evs = evl.map(function (x) { return x.e; });
  h += secHead(created ? 'Tasks I Created' : 'My Tasks', '', String(tasks.filter(function (x) { return !x.t.done; }).length)) +
    '<div class="toolbar"><select class="inp sm" data-change="mine-ev" aria-label="Event"><option value="">All Events</option>' + evs.map(function (e) { return '<option value="' + e.id + '"' + (ev === e.id ? ' selected' : '') + '>' + esc(e.title) + '</option>'; }).join('') + '</select>' +
    '<label class="cbx inline"><input type="checkbox" data-change="mine-done"' + (S.mineDone ? ' checked' : '') + '><span>Show Done</span></label></div>';
  var any = false;
  WHEN.forEach(function (w) {
    var g = tasks.filter(function (x) { return x.t.done ? w[0] === 'none' && false : whenGroup(x.t) === w[0]; }).sort(function (a, b) { return String(a.t.due_on || '').localeCompare(String(b.t.due_on || '')); });
    if (!g.length) return; any = true;
    h += '<div class="grouplbl' + (w[0] === 'late' ? ' danger' : '') + '">' + w[1] + ' · ' + g.length + '</div><div class="list">' + g.map(myTaskRow).join('') + '</div>';
  });
  var dn = S.mineDone ? tasks.filter(function (x) { return x.t.done; }) : [];
  if (dn.length) { any = true; h += '<div class="grouplbl">Done · ' + dn.length + '</div><div class="list">' + dn.map(myTaskRow).join('') + '</div>'; }
  if (!any) h += '<div class="empty card">' + (created ? 'Tasks you add to any event show up here.' : refs.length ? 'No open tasks. You’re all caught up.' : 'Choose your contact above to see what’s assigned to you.') + '</div>';
  if (!created) {
    if (st.lead.length) h += secHead('Leading', '', String(st.lead.length)) + '<div class="list">' + st.lead.map(function (x) {
      return row({ act: 'open-event-tab', id: x.e.id, t: '', lead: x.d ? '<span class="datebox sm"><small>' + dt(x.d).toLocaleDateString('en-US', { weekday: 'short' }) + '</small><b>' + dt(x.d).getDate() + '</b></span>' : '', title: esc(x.x.title), sub: esc([fmtTime(x.k), x.e.title, x.kind === 'agenda' ? 'Agenda' : 'Schedule'].filter(Boolean).join(' · ')) }).replace('data-a="open-event-tab"', 'data-a="open-event-tab" data-v="' + (x.kind === 'agenda' ? 'agenda' : 'calendar') + '"');
    }).join('') + '</div>';
    var byEv = []; st.serve.forEach(function (x) { var g = byEv.find(function (y) { return y.e === x.e; }); if (!g) byEv.push(g = { e: x.e, roles: [] }); var r = x.x.role || teamLabel(x.x.team); if (r && g.roles.indexOf(r) < 0) g.roles.push(r); });
    if (byEv.length) h += secHead('Serving On', '', String(byEv.length)) + '<div class="list">' + byEv.map(function (g) {
      return row({ act: 'open-event', id: g.e.id, title: esc(g.e.title), sub: esc([g.roles.join(', '), fmtRange(g.e.starts_on, g.e.ends_on)].filter(Boolean).join(' · ')) });
    }).join('') + '</div>';
    if (st.cards.length) h += secHead('Follow Up With', '', String(st.cards.length)) + '<div class="list">' + st.cards.map(function (x) {
      return row({ act: 'open-event-tab', id: x.e.id, lead: avatar(x.x.name), title: esc(x.x.name), sub: esc([x.e.title, x.x.phone || x.x.email, (x.x.responses || [])[0]].filter(Boolean).join(' · ')), right: pill(cardStatusLabel(x.x.status), CARD_TONE[x.x.status]) }).replace('data-a="open-event-tab"', 'data-a="open-event-tab" data-v="followup"');
    }).join('') + '</div>';
    h += secHead('Send Or Print My List') + shareTools('mine', 'me');
  }
  return h;
}
/* ---------- reminders: who should hear from you, ready to text or email in a tap */
function remSent(key) { return !!lget('ed.rem.' + key) || !!(S.autoSent && S.autoSent[key]); }
// Automatic sending is "live" when the ed-notify function has checked in within the last two hours.
function notifyLive() { var o = org() || {}; return !!(o.notify_seen_at && Date.now() - Date.parse(o.notify_seen_at) < 2 * 3600e3); }
function notifyChannels() { return String((org() || {}).notify_channels || '').split(',').filter(Boolean); }
function autoReminding() { return !!((org() || {}).auto_remind && notifyLive()); }
function loadAutoSent() {
  if (!DB.notifyLog || !org()) return;
  DB.notifyLog(org().id).then(function (rows) { var m = {}; (rows || []).forEach(function (r) { if (r.status === 'sent') m[r.key.replace(/^rem:/, '')] = 1; }); S.autoSent = m; if (S.tab === 'mine' || S.sheet) { render(); } }, function () {});
}
function firstName(n) { return String(n || '').replace(/^(pastor|rev\.?|evangelist|dr\.?)\s+/i, '').split(' ')[0]; }
function reminders() {
  var o = org() || {}, sig = o.name ? ' – ' + o.name : '', out = [];
  events().forEach(function (e) {
    withEvent(e, function () {
      var days = eventDays(e);
      if (on('volunteers') || on('food')) evRows('ed_items').filter(function (i) { return (i.kind === 'serve' || i.kind === 'meal') && (i.on_date === TOMORROW || (!i.on_date && e.starts_on === TOMORROW)); }).forEach(function (i) {
        var when = shiftWhen(i);
        signups(i.id).filter(function (s) { return s.phone || s.email; }).forEach(function (s) {
          out.push({ key: TODAY + ':s:' + s.id, kind: 'shift', name: s.name, phone: s.phone, email: s.email, e: e, why: i.title + (when ? ' · ' + when : ''),
            subject: 'Tomorrow: ' + i.title + ' at ' + e.title,
            msg: 'Hi ' + firstName(s.name) + ', a reminder that you’re ' + (i.kind === 'meal' ? 'bringing ' + i.title : 'serving on ' + i.title) + ' at ' + e.title + ' tomorrow' + (when ? ', ' + when : '') + (e.place ? ' at ' + e.place : '') + '. Thank you!' + sig });
        });
      });
      if (on('volunteers') && e.starts_on === TOMORROW) assigned('volunteer').filter(function (x) { return x.p.phone || x.p.email; }).forEach(function (x) {
        out.push({ key: TODAY + ':v:' + x.a.id, kind: 'shift', name: x.p.name, phone: x.p.phone, email: x.p.email, e: e, why: 'Volunteer team' + (x.a.role ? ' · ' + x.a.role : ''), subject: 'Tomorrow: ' + e.title,
          msg: 'Hi ' + firstName(x.p.name) + ', a reminder that you’re serving at ' + e.title + ' tomorrow' + (e.time_label ? ', ' + e.time_label : '') + (e.place ? ' at ' + e.place : '') + '. Thank you!' + sig });
      });
      evRows('ed_tasks').filter(function (t) { return !t.done && t.due_on && t.due_on >= TODAY && t.due_on <= TOMORROW; }).forEach(function (t) {
        (t.assignee_refs || []).map(refContact).filter(function (c) { return c && (c.phone || c.email); }).forEach(function (c) {
          var dl = t.due_on === TODAY ? 'today' : 'tomorrow';
          out.push({ key: TODAY + ':t:' + t.id + ':' + c.r.id, kind: 'task', name: c.name, phone: c.phone, email: c.email, e: e, why: t.title + ' · due ' + dl, subject: 'Due ' + dl + ': ' + t.title,
            msg: 'Hi ' + firstName(c.name) + ', a reminder that “' + t.title + '” for ' + e.title + ' is due ' + dl + (t.due_time ? ' by ' + t.due_time : '') + '. Thank you!' + sig });
        });
      });
    });
  });
  return out;
}
function smsHref(phone, body) { return 'sms:' + digits(phone) + '?&body=' + encodeURIComponent(body); }
function mailHref(to, subject, body, bcc) { return 'mailto:' + encodeURIComponent(to || '') + '?' + (bcc ? 'bcc=' + encodeURIComponent(bcc) + '&' : '') + 'subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body); }
function remindersSheet() {
  openSheet(function () {
    var list = reminders(), left = list.filter(function (r) { return !remSent(r.key); }).length;
    var block = function (kind, title) {
      var g = list.filter(function (r) { return r.kind === kind; }); if (!g.length) return '';
      var mails = g.filter(function (r) { return r.email; }).map(function (r) { return r.email; });
      return '<h4>' + esc(title) + ' · ' + g.length + '</h4>' + (kind === 'shift' && mails.length > 1 ? '<p class="small"><a class="link" href="' + esc(mailHref('', 'Tomorrow at ' + g[0].e.title, 'Hi everyone, a reminder that you’re serving tomorrow. Thank you!' + ((org() || {}).name ? ' – ' + org().name : ''), mails.join(','))) + '" data-a="rem-all" data-id="' + esc(g.map(function (r) { return r.email ? r.key : ''; }).filter(Boolean).join('|')) + '">Email all ' + mails.length + ' at once (BCC)</a></p>' : '') +
        '<div class="list">' + g.map(function (r) {
          var sent = remSent(r.key);
          return '<div class="row rem' + (sent ? ' sent' : '') + '">' + avatar(r.name, sent ? 'green' : '') + '<div class="main"><div class="t">' + esc(r.name) + (sent ? ' ' + pill('Sent', 'green') : '') + '</div><div class="s">' + esc(r.why + ' · ' + r.e.title) + '</div>' +
            '<div class="rem-acts">' + (r.phone ? '<a class="btn sm" href="' + esc(smsHref(r.phone, r.msg)) + '" data-a="rem-sent" data-id="' + esc(r.key) + '">' + IC.text + ' Text</a>' : '') + (r.email ? '<a class="btn sm plain" href="' + esc(mailHref(r.email, r.subject, r.msg)) + '" data-a="rem-sent" data-id="' + esc(r.key) + '">' + IC.mail + ' Email</a>' : '') +
            '<button class="btn sm plain" data-a="copy" data-v="' + esc(r.msg) + '">Copy</button></div></div></div>';
        }).join('') + '</div>';
    };
    return '<h3>Reminders To Send</h3><p class="lead">' + (!list.length ? 'Nothing to send right now.' : autoReminding() ? (list.length - left) + ' of ' + list.length + ' sent. The rest go out automatically at 7 AM, or send one yourself now.' : left + ' of ' + list.length + ' still to send. Each opens a text or email with the message written for you.') + '</p>' +
      block('shift', 'Serving Tomorrow') + block('task', 'Tasks Due Soon') +
      (list.length ? '' : '<p class="small muted">Volunteers who signed up for tomorrow, and contacts with tasks due today or tomorrow, show up here with a ready-to-send message.</p>') +
      '<p class="small muted" style="margin-top:14px">' + (autoReminding() ? 'Automatic reminders are on: tomorrow’s volunteers and anyone with a task due get a text or email at 7 AM. The buttons send one from your own phone or email.' : 'Messages go from your own phone or email.' + ((org() || {}).auto_remind ? ' Automatic reminders are switched on but aren’t running yet. See Settings > Notifications.' : ' To send these automatically every morning, turn on Automatic Reminders in Settings > Notifications.')) + '</p>' +
      '<div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Done</button></div>';
  });
}
function pickMe() {
  var cur = (myMember().prefs || {}).contact_ref || '';
  openSheet(function () {
    var cs = allContacts().filter(function (c) { return c.t === 'ed_people' && c.status !== 'previous'; });
    return '<h3>Which Contact Is You?</h3><p class="lead">Tasks, segments and teams assigned to this contact show up in your My Stuff.</p><div class="fgrid"><div class="fld"><label for="me_ref">You</label><select class="inp" id="me_ref"><option value="">Match me by email, phone or name</option>' +
      cs.map(function (c) { var r = refOf(c); return '<option value="' + esc(r) + '"' + (cur === r ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select><span class="hint">Not listed? Add yourself in Directory › Contacts first.</span></div></div>' + sheetFoot(false);
  }, function () {
    var me = myMember(), p = Object.assign({}, me.prefs || {}, { contact_ref: $('#me_ref').value });
    return busy(DB.updateMe(org().id, { prefs: p }), 'Saved').then(function () { me.prefs = p; closeSheet(); render(); }).catch(function () {});
  });
}

/* ---------------------------------------------------------------- settings */
var NOTIFY = [['weekly', 'Weekly Summary', 'Every Monday: what’s coming up, what’s overdue and what’s owed.'], ['tasks', 'My Tasks', 'A reminder the day before a task assigned to you is due.'], ['payments', 'Payments Due', 'Three days before a payment you’re responsible for is due.'], ['signups', 'New Sign-Ups', 'When someone signs up to serve or bring food.'], ['cards', 'New Connection Cards', 'When a guest fills out a connection card.'], ['events', 'Event Reminders', 'One week and one day before each event starts.']];
var NOTIFY_DEF = { weekly: true, tasks: true, payments: true, signups: false, cards: true, events: true, channel: 'email' };
function prefs() { return Object.assign({}, NOTIFY_DEF, myMember().prefs || {}); }
function sw(on, act, id, label) { return '<button class="switch" role="switch" aria-checked="' + !!on + '" aria-label="' + esc(label) + '" data-a="' + act + '" data-id="' + esc(id) + '"><i></i></button>'; }
function kv(pairs) {
  return '<div class="kv">' + pairs.map(function (p) { return '<div><span>' + esc(p[0]) + '</span><b>' + (p[1] ? esc(p[1]) : '<em class="muted">Not Set</em>') + '</b></div>'; }).join('') + '</div>';
}
function viewSettings() {
  var a = S.acct, o = a.org, owner = a.role === 'owner', me = myMember(), p = prefs();
  var h = head('Settings', '', '<button class="iconbtn" data-a="close-settings" aria-label="Back">' + IC.back + '</button>', '', o.name) + '<main class="settings">';
  h += secHead('Ministry Profile', owner ? '<button class="link" data-a="edit-org">Edit</button>' : '') +
    '<div class="card profile"><div class="sheethead">' + logoMark('big') + '<div><h3>' + esc(o.name) + '</h3><p class="lead">' + esc(o.about || (owner ? 'Add a short description of your ministry.' : '')) + '</p></div></div>' +
    (owner ? '<div class="logo-row"><label class="btn sm plain filebtn">' + (o.logo ? 'Change Logo' : 'Upload Logo') + '<input type="file" accept="image/*" data-change="logo-file" hidden></label>' + (o.logo ? '<button class="btn sm plain" data-a="logo-remove">Remove</button>' : '') + '<span class="small muted">Shown on your share pages, printed sheets and QR posters.</span></div>' : '') +
    kv([['Phone', o.phone], ['Email', o.email], ['Website', o.website], ['Address', o.address], ['Online Giving', o.giving_link], ['Time Zone', (TIMEZONES.find(function (z) { return z[0] === (o.timezone || 'America/Chicago'); }) || [, o.timezone])[1]]]) +
    actions({ phone: o.phone, email: o.email, website: o.website, address: o.address }) + '</div>' +
    (owner ? '' : '<p class="small muted">Only the account owner can change the ministry profile.</p>');
  h += secHead('My Profile', '<button class="link" data-a="edit-me">Edit</button>') +
    '<div class="card"><div class="sheethead">' + avatar(me.name || S.user.email) + '<div><h3>' + esc(me.name || 'Add Your Name') + '</h3><p class="lead">' + (owner ? 'Account Owner' : 'Member') + '</p></div></div>' +
    kv(S.user.phone && !S.user.email ? [['Phone', me.phone || prettyPhone(S.user.phone)], ['Signs In With', 'A text code to ' + prettyPhone(S.user.phone)]] : [['Phone', me.phone], ['Login Email', S.user.email || me.email]]) +
    (S.user.phone && !S.user.email ? '<p class="small muted">To change your sign-in number, sign out and sign in with the new number, then ask the account owner to invite it.</p>' : '<div class="btnrow"><button class="btn sm ghost" data-a="change-email">Change Login Email</button><button class="btn sm ghost" data-a="change-pw">Change Password</button></div>') + '</div>';
  var live = notifyLive(), chs = notifyChannels(), chLbl = chs.map(function (c) { return c === 'text' ? 'texts' : 'emails'; }).join(' and ');
  h += secHead('Notifications') + '<div class="card">' + (live
    ? '<div class="nstat on">' + IC.check + '<span><b>Automatic ' + esc(chLbl || 'notices') + ' are on.</b> They go out as things happen and each morning at 7.</span></div>' + '<div class="btnrow"><button class="btn sm ghost" data-a="notify-test">Send Me A Test</button></div>'
    : '<div class="nstat"><span><b>Automatic texts and emails aren’t on yet.</b> ' + (owner ? 'They need a sending service connected to your account (about 20 minutes, one time). The steps are in the setup guide.' : 'Your account owner can turn them on.') + ' Your choices below are saved for then. Until then, <button class="link inline" data-a="nav" data-v="mine">My Stuff</button> has reminders you can send in a tap.</span></div>') +
    (owner ? '<div class="swlist"><div class="swrow"><div class="main"><b>Automatic Reminders</b><span>For the whole ministry: the day before, text or email everyone serving or bringing food, and anyone with a task due.</span></div>' + sw(o.auto_remind, 'auto-remind', 'auto', 'Automatic Reminders') + '</div></div><h4 class="nsub">Just For You</h4>' : '') +
    '<div class="fld"><label for="n_ch">Send Them By</label><select class="inp" id="n_ch" data-change="notify-channel">' + [['email', 'Email'], ['text', 'Text Message'], ['both', 'Email And Text']].map(function (c) { return '<option value="' + c[0] + '"' + (p.channel === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></div>' +
    '<div class="swlist">' + NOTIFY.map(function (n) { return '<div class="swrow"><div class="main"><b>' + esc(n[1]) + '</b><span>' + esc(n[2]) + '</span></div>' + sw(p[n[0]], 'notify', n[0], n[1]) + '</div>'; }).join('') + '</div>' +
    ((p.channel !== 'email') && !me.phone ? '<p class="small danger">Add your phone number under My Profile to get texts.</p>' : '') +
    (live && p.channel !== 'email' && chs.indexOf('text') < 0 ? '<p class="small danger">Texting isn’t set up for your ministry yet, so these come by email only.</p>' : '') + '</div>';
  var lastBk = +lget('ed.backup.at') || 0;
  h += secHead('Back Up Your Data') + '<div class="card"><p class="small muted notenote">Download everything as spreadsheets (contacts, events, tasks, sign-ups, money, connection cards, prayer and more) plus a full copy, in one .zip file. Keep it somewhere safe; it has names, phone numbers and prayer requests.</p>' +
    '<div class="btnrow"><button class="btn sm" data-a="backup">Download A Backup</button><span class="small muted">' + (lastBk ? 'Last backup from this device: ' + esc(new Date(lastBk).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })) : 'No backup from this device yet.') + '</span></div></div>';
  h += secHead('Team And Access', owner && a.members.length < 10 ? addBtn('Invite', 'invite') : '', a.members.length + ' of 10') +
    '<div class="list">' + a.members.map(function (m) {
      var self = m.user_id === S.user.id;
      return row({ lead: avatar(m.name || m.email), title: esc(m.name || m.email) + (self ? ' <span class="muted small">(You)</span>' : ''), sub: esc([m.email, m.phone].filter(Boolean).join(' · ')), right: (m.role === 'owner' ? pill('Owner', 'red') : '') + (owner && !self ? '<button class="iconbtn sm" data-a="remove-member" data-id="' + esc(m.user_id) + '" aria-label="Remove ' + esc(m.name || m.email) + '">' + IC.close + '</button>' : '') });
    }).join('') + '</div>' +
    (a.invites.length ? '<div class="grouplbl">Open Invites</div><div class="list">' + a.invites.map(function (i) {
      return '<div class="row"><div class="main"><div class="t">Invite Link</div><div class="urlbox">' + esc(inviteUrl(i.code)) + '</div></div><button class="link" data-a="copy" data-v="' + esc(inviteUrl(i.code)) + '">Copy</button><button class="link" data-a="cancel-invite" data-id="' + esc(i.code) + '">Cancel</button></div>';
    }).join('') + '</div>' : '') +
    '<p class="small muted">Each login belongs to one ministry. Someone who serves with another ministry signs up there with a different email.</p>';
  h += secHead('Help') + '<div class="list">' + row({ act: 'tour', id: 'x', lead: '<span class="avatar ic tone-red">' + IC.cal + '</span>', title: 'Watch The Quick Tour', sub: 'Two minutes on what Tent & Table does and how to plan your first event' }) + '</div>';
  h += secHead('Account') + '<div class="list">' +
    (DB.mode === 'demo' ? row({ act: 'reset-demo', id: 'x', title: 'Reset The Demo', sub: 'Put the sample ministry back the way it started' }) : '') +
    row({ act: 'signout', id: 'x', title: 'Sign Out', sub: esc(S.user.email || '') }) +
    row({ act: 'leave-org', id: 'x', title: '<span class="danger">Leave This Ministry</span>', sub: 'You’ll lose access to its events and Directory' }) + '</div>';
  return h + '<p class="small muted center" style="margin-top:22px">Tent &amp; Table</p></main>';
}
var TIMEZONES = [['America/New_York', 'Eastern'], ['America/Chicago', 'Central'], ['America/Denver', 'Mountain'], ['America/Phoenix', 'Arizona'], ['America/Los_Angeles', 'Pacific'], ['America/Anchorage', 'Alaska'], ['Pacific/Honolulu', 'Hawaii']];
var F_ORG = [
  { k: 'name', label: 'Ministry Name', auto: true }, { k: 'about', label: 'About The Ministry', type: 'textarea', ph: 'Who you are and what you do.' },
  { k: 'phone', label: 'Ministry Phone', type: 'tel', half: true }, { k: 'email', label: 'Ministry Email', type: 'email', half: true },
  { k: 'website', label: 'Website', type: 'url', ph: 'yourministry.org' }, { k: 'address', label: 'Mailing Address' },
  { k: 'tax_id', label: 'Tax ID Number (EIN)', ph: '12-3456789', hint: 'If you have one. Handy for donation receipts and vendor paperwork. Only your team sees it.' },
  { k: 'giving_link', label: 'Online Giving Link', type: 'url', hint: 'New events start with this link.', half: true }, { k: 'timezone', label: 'Time Zone', type: 'select', opts: TIMEZONES, half: true }];
var F_ME = [{ k: 'name', label: 'Your Name', auto: true }, { k: 'phone', label: 'Mobile Phone', type: 'tel', hint: 'Used for text reminders and shown to your team.' }];
function setLogo(file) {
  if (!/^image\//.test(file.type)) { toast('Pick an image file.'); return; }
  var rd = new FileReader();
  rd.onload = function () {
    var img = new Image();
    img.onload = function () {
      var max = 320, s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      var url = c.toDataURL('image/png'); if (url.length > 300000) url = c.toDataURL('image/jpeg', 0.85);
      var o = org(); busy(DB.updateOrg(o.id, { logo: url }), 'Logo saved').then(function () { o.logo = url; render(); }).catch(function () {});
    };
    img.onerror = function () { toast('That image couldn’t be read.'); };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
}
function editProfile(fields, base, title, fn) {
  openSheet(function () { return '<h3>' + esc(title) + '</h3>' + formBody(fields, base) + sheetFoot(false); }, function () {
    var v = readForm(fields, {}); if (!v[fields[0].k]) { sheetErr('Please fill in ' + fields[0].label + '.'); return; }
    return busy(fn(v), 'Saved').then(function () { closeSheet(); render(); }).catch(function () {});
  });
}
function inviteUrl(code) { return location.origin + location.pathname + '?join=' + code; }

/* ================================================================ event workspace */
var AREAS = [['overview', 'Overview'], ['plan', 'Plan'], ['people', 'Contacts'], ['prayer', 'Prayer'], ['money', 'Money']];
var AREA_SUBS = {
  plan: [['tasks', 'Tasks', 'tasks'], ['schedule', 'Schedule', 'calendar'], ['agenda', 'Agenda', 'agenda'], ['setlists', 'Set Lists', 'worship'], ['equipment', 'Equipment', 'equipment']],
  people: [['team', 'Team', 'team'], ['volunteers', 'Volunteers', 'vols'], ['guests', 'Guests', 'gst'], ['vendors', 'Vendors', 'vendors'], ['contacts', 'Other', 'vendors']],
  prayer: [['intercede', 'Intercession', 'prayer'], ['declare', 'Declarations', 'prayer'], ['verse', 'Scripture', 'prayer']]
};
var GUEST_SUBS = { attending: 1, checkin: 1, followup: 1 };
var JUMP = { calendar: ['plan', 'schedule'], tasks: ['plan', 'tasks'], agenda: ['plan', 'agenda'], setlists: ['plan', 'setlists'], equipment: ['plan', 'equipment'], people: ['people', 'team'], team: ['people', 'team'], vendors: ['people', 'vendors'], contacts: ['people', 'contacts'], food: ['people', 'volunteers'], signups: ['people', 'volunteers'], volunteers: ['people', 'volunteers'], guests: ['people', 'guests'], attending: ['people', 'guests'], checkin: ['people', 'guests'], followup: ['people', 'guests'], share: ['people', 'guests'], money: ['money'], payments: ['money'], prayer: ['prayer', 'intercede'], intercede: ['prayer', 'intercede'], declare: ['prayer', 'declare'], verse: ['prayer', 'verse'] };
function subLabel(x) { return x[0] === 'volunteers' && !on('volunteers') ? 'Meals' : x[1]; }
function subOn(x) { var k = x[2]; return k === 'always' ? true : k === 'vols' ? (on('volunteers') || on('food')) : k === 'team' ? (on('people') || on('speakers') || on('worship')) : k === 'gst' ? (on('guests') || on('followup')) : on(k); }
function areaSubs(k) { return (AREA_SUBS[k] || []).filter(subOn).map(function (x) { return [x[0], subLabel(x), x[2]]; }); }
function areaOn(k) { return k === 'overview' || (k === 'money' ? on('money') : areaSubs(k).length > 0); }
function goArea(key) {
  if (key === 'sharepage') { S.evTab = 'share'; return; }
  if (AREAS.some(function (x) { return x[0] === key; })) { S.evTab = key; return; }
  var j = JUMP[key] || ['overview']; S.evTab = j[0];
  if (j[1]) S.sub['area_' + j[0]] = j[1];
  if (key === 'money' || key === 'payments') S.sub.money = 'payments';
  if (key === 'food') S.sub.signkind = 'meal';
  if (key === 'signups' || key === 'volunteers') S.sub.signkind = 'serve';
  if (GUEST_SUBS[key]) S.sub.guestsub = key === 'checkin' && !on('guests') ? 'attending' : key;
  if (key === 'checkin' && !on('guests')) { S.evTab = 'people'; S.sub.area_people = 'volunteers'; S.sub.signkind = 'checkin'; }
}
function hidden(fn) { S.hideSub = true; try { return fn(); } finally { S.hideSub = false; } }
function viewWorkspace() {
  var e = S.ev = byId('ed_events', S.ev.id) || S.ev;
  var areas = AREAS.filter(function (x) { return areaOn(x[0]); });
  if (S.evTab !== 'share' && !areas.some(function (x) { return x[0] === S.evTab; })) S.evTab = 'overview';
  var menu = '<button class="iconbtn' + (S.evTab === 'share' ? ' on' : '') + '" data-a="ev-tab" data-id="sharepage" aria-label="Share And Print">' + IC.share + '</button><button class="iconbtn" data-a="event-menu" aria-label="Event Menu">' + IC.more + '</button>';
  var h = head(e.title, [fmtRange(e.starts_on, e.ends_on), e.time_label, e.place].filter(Boolean).join(' · '), '<button class="iconbtn" data-a="close-event" aria-label="Back To Events">' + IC.back + '</button>', menu, org().name);
  h = h.replace(/<\/header>$/, tabs(areas, S.evTab, 'ev-tab', 'areabar') + '</header>');
  var body;
  if (S.evTab === 'share') body = sharePage(e);
  else if (S.evTab === 'overview') body = wsOverview(e);
  else if (S.evTab === 'money') body = wsMoney(e);
  else {
    var subs = areaSubs(S.evTab), key = 'area_' + S.evTab, cur = S.sub[key];
    if (!subs.some(function (x) { return x[0] === cur; })) cur = S.sub[key] = subs[0][0];
    body = (subs.length > 1 ? tabs(subs, cur, 'sub-tab" data-k="' + key, 'subtabs') : '') + areaView(S.evTab, cur, e);
  }
  return '<div class="ws">' + h + '<main>' + body + '</main></div>' + mainNav('events', 'deskonly');
}
function areaView(area, sub, e) {
  if (sub === 'schedule') return wsCalendar(e);
  if (sub === 'tasks') return wsTasks(e);
  if (sub === 'agenda') return wsAgenda(e);
  if (sub === 'setlists') return setlistsView();
  if (sub === 'team') return dirPeople(e);
  if (sub === 'guests') return guestsView(e);
  if (sub === 'vendors' || sub === 'contacts') { S.sub.vendors = sub; return hidden(function () { return wsVendors(e); }); }
  if (sub === 'equipment') return wsEquipment(e);
  if (sub === 'volunteers') return volunteersView(e);
  if (area === 'prayer') return prayerView(e, sub);
  return '';
}
function guestsView(e) {
  var kinds = [];
  if (on('guests')) kinds.push(['attending', 'Attending'], ['checkin', 'Check-In']);
  if (on('followup')) kinds.push(['followup', 'Follow-Up']);
  var st = subTabs('guestsub', kinds, kinds[0][0]);
  var top = kinds.length > 1 ? st.html.replace('class="subtabs"', 'class="subtabs mini"') : '';
  if (st.cur === 'checkin') return top + checkinView(e);
  if (st.cur === 'followup') return top + wsFollowup(e);
  return top + attendingView(e);
}
function volunteersView(e) {
  var kinds = [];
  if (on('volunteers')) kinds.push(['serve', 'Volunteers']);
  if (on('food')) kinds.push(['meal', 'Meals']);
  if (on('volunteers') && !on('guests')) kinds.push(['checkin', 'Check-In']);
  var st = subTabs('signkind', kinds, 'serve');
  var top = kinds.length > 1 ? st.html.replace('class="subtabs"', 'class="subtabs mini"') : '';
  if (st.cur === 'checkin') return top + checkinView(e);
  if (st.cur === 'meal') return top + shareBar('v') + wsFood(e);
  var av = assigned('volunteer');
  return top + shareBar('v') + goalCard(e) + secHead('Volunteer Team', addBtn('Add Volunteer', 'pick-people', 'volunteer'), av.length ? String(av.length) : '') +
    listBox(av.map(function (x) { return personRow(x); }), 'Volunteers you place yourself, from your contacts.') +
    signupBlock('serve', 'Volunteer Shifts', 'Add Shift');
}
function volCount() { return assigned('volunteer').length + evRows('ed_signups').filter(function (s) { var i = byId('ed_items', s.item_id); return i && i.kind === 'serve'; }).length; }
function goalCard(e) {
  var g = num(e.volunteer_goal), n = volCount();
  if (!g) return '<button class="goal empty-goal" data-a="set-goal"><b>Set A Volunteer Goal</b><span>How many volunteers do you need? We’ll track it here and on the sign-up page.</span></button>';
  var short = Math.max(0, g - n), pct = Math.min(100, Math.round(100 * n / g));
  return '<button class="goal' + (short ? '' : ' met') + '" data-a="set-goal"><div class="g-top"><div><div class="g-k">Volunteer Goal</div><div class="g-v"><b>' + n + '</b> of ' + g + '</div></div><div class="g-side">' + (short ? '<b>' + short + '</b> still needed' : 'Goal met') + '</div></div><div class="cd-bar"><i style="width:' + pct + '%"></i></div></button>';
}
function attendingView(e) {
  var its = evRows('ed_items').filter(function (i) { return i.kind === 'attend'; }), f = fill('attend'), people = 0, here = 0;
  its.forEach(function (i) { signups(i.id).forEach(function (s) { people += 1; if (s.checked_in_at) here += (s.party || 1); }); });
  return shareBar('r') + (its.length ? '<div class="stats three">' + stat('Coming', f.have) + stat('RSVPs', people) + stat('Checked In', here) + '</div>' : '') +
    signupBlock('attend', 'Who’s Coming', 'Add Service') +
    (its.length ? '' : '<p class="small muted">Add each service or night people can RSVP for, with how many seats you have. Guests RSVP with the link above.</p>');
}
function checkinView(e) {
  var its0 = evRows('ed_items').filter(function (i) { return i.kind === 'attend' || i.kind === 'serve'; }), days = [];
  its0.forEach(function (i) { var d = i.on_date || ''; if (days.indexOf(d) < 0) days.push(d); }); days.sort();
  if (!days.length) return '<div class="empty card">Add RSVP services under Guests, or volunteer spots under Volunteers, then check people in here.</div>';
  var day = S.sub.ciDay != null && days.indexOf(S.sub.ciDay) >= 0 ? S.sub.ciDay : (days.indexOf(TODAY) >= 0 ? TODAY : days.find(function (d) { return d >= TODAY; }) || days[0]);
  S.sub.ciDay = day;
  var its = its0.filter(function (i) { return (i.on_date || '') === day; }), all = 0, here = 0;
  function block(kind, label) {
    var list = its.filter(function (i) { return i.kind === kind; }); if (!list.length) return '';
    return secHead(label) + list.map(function (i) {
      var su = signups(i.id).slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
      su.forEach(function (s) { var n = kind === 'attend' ? (s.party || 1) : 1; all += n; if (s.checked_in_at) here += n; });
      return '<div class="grouplbl">' + esc(i.title) + '</div>' + listBox(su.map(function (s) {
        return '<div class="row">' + ck(!!s.checked_in_at, 'checkin', s.id, 'Checked in') + '<div class="main"><div class="t">' + esc(s.name) + '</div><div class="s">' + esc([kind === 'attend' && (s.party || 1) > 1 ? 'Party of ' + s.party : '', s.phone || s.email].filter(Boolean).join(' · ')) + '</div></div>' + (kind === 'attend' && num(i.fee) > 0 && !s.paid ? '<button class="link" data-a="pay-signup" data-id="' + s.id + '">Owes ' + money(num(i.fee) * (s.party || 1)) + '</button>' : '') + (s.checked_in_at ? pill('Here', 'green') : '') + '</div>';
      }), 'No one yet.');
    }).join('');
  }
  var body = block('attend', 'Guests') + block('serve', 'Volunteers');
  return '<div class="toolbar"><label class="sr" for="ci_day">Day</label><select class="inp sm" id="ci_day" data-change="ci-day">' + days.map(function (d) { return '<option value="' + d + '"' + (d === day ? ' selected' : '') + '>' + esc(d ? fmtLong(d) : 'No Date') + '</option>'; }).join('') + '</select></div>' +
    '<div class="stats">' + stat('Expected', all) + stat('Checked In', here, true) + stat('Not Here Yet', Math.max(0, all - here)) + '</div>' + body;
}
function setlistsView() {
  var sets = evRows('ed_setlists').sort(function (a, b) { return String(a.on_date || '').localeCompare(String(b.on_date || '')); });
  return secHead('Set Lists', addBtn('Add Set List', 'add-setlist')) + (sets.length ? sets.map(function (s) {
    return '<button class="card setlist" data-a="edit-setlist" data-id="' + s.id + '"><div class="sl-head"><b>' + esc(s.title || 'Set List') + '</b><span class="muted small">' + esc([s.on_date ? fmtDay(s.on_date) : '', s.rehearsal].filter(Boolean).join(' · ')) + '</span></div><ol>' + String(s.songs || '').split('\n').filter(Boolean).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></button>';
  }).join('') : '<div class="empty">No set lists yet.</div>');
}
var DIR_TEAMS = [['leader', 'Leadership', 'Who is leading this event?'], ['team', 'Ministry Team', 'Altar counselors, prayer team, security, host…'], ['speaker', 'Speakers', 'Guest and in-house speakers.'], ['worship', 'Worship Team', 'Musicians, vocalists and sound.']];
var TEAM_SEC = { leader: 'people', team: 'people', speaker: 'speakers', worship: 'worship', volunteer: 'volunteers' };
function dirPeople(e) {
  var f = S.sub.dirTeam || 'all', total = evRows('ed_event_people').filter(function (x) { return x.team !== 'volunteer'; }).length;
  var h = '<div class="toolbar"><label class="sr" for="dt_team">Team</label><select class="inp sm" id="dt_team" data-change="dir-team"><option value="all">All Team · ' + total + '</option>' + DIR_TEAMS.filter(function (t) { return on(TEAM_SEC[t[0]]); }).map(function (t) { return '<option value="' + t[0] + '"' + (f === t[0] ? ' selected' : '') + '>' + t[1] + ' · ' + assigned(t[0]).length + '</option>'; }).join('') + '</select></div>';
  DIR_TEAMS.filter(function (t) { return (f === 'all' || f === t[0]) && on(TEAM_SEC[t[0]]); }).forEach(function (t) {
    var list = assigned(t[0]);
    if (t[0] === 'speaker') list.sort(function (a, b) { return String((a.a.details || {}).date || '9').localeCompare(String((b.a.details || {}).date || '9')); });
    h += secHead(t[1], addBtn('Add', 'pick-people', t[0]), list.length ? String(list.length) : '') + listBox(list.map(function (x) {
      if (t[0] !== 'speaker') return personRow(x);
      var d = x.a.details || {};
      return personRow(x, esc([d.date ? fmtDay(d.date) : '', d.time, d.topic ? '“' + d.topic + '”' : ''].filter(Boolean).join(' · ')) + (num(x.a.amount) ? '<br>Honorarium ' + money(x.a.amount) + ' · ' + esc(x.a.pay_status) : ''), '',
        pill(d.status || 'Confirmed', (d.status || 'Confirmed') === 'Confirmed' ? 'green' : d.status === 'Declined' ? '' : 'amber'));
    }), t[2]);
  });
  return h;
}
function subTabs(key, list, def) { var cur = S.sub[key] || def; if (!list.some(function (x) { return x[0] === cur; })) cur = list[0][0]; S.sub[key] = cur; return { cur: cur, html: S.hideSub ? '' : tabs(list, cur, 'sub-tab" data-k="' + key, 'subtabs') }; }

/* ---------- prayer: intercession, declarations, scripture. Nothing here is checked off; it stays until you remove it. */
var PRAYER_KIND = { intercede: ['Prayer Need', 'Add Need'], declare: ['Declaration', 'Add Declaration'], verse: ['Scripture', 'Add Scripture'] };
function prayers(kind, ev) { return evRows('ed_prayer', ev).filter(function (p) { return p.kind === kind; }).sort(function (a, b) { return (a.sort || 0) - (b.sort || 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')); }); }
function prayFor(p) { return p.person_id ? byId('ed_people', p.person_id) : null; }
function followDue(p) { return p.kind === 'intercede' && !p.answer && p.follow_up_on && p.follow_up_on <= TODAY; }
function prayerBar() {
  return '<button class="card praybar" data-a="doc" data-id="prayer"><span class="docic">' + IC.book + '</span><span class="main"><b>Prayer Guide</b><span>Theme, scripture, declarations and needs on one page. Copy, share or print it for the prayer team, or send it as a recap.</span></span><span class="chev">' + IC.chev + '</span></button>';
}
function clip(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
function prayerRow(p) {
  var who = prayFor(p), due = followDue(p);
  var sub = [who ? 'For ' + who.name : '', clip(p.answer ? 'What God did: ' + p.answer : p.body, 90), !p.answer && p.follow_up_on ? 'Follow up ' + fmtDay(p.follow_up_on, { month: 'short', day: 'numeric' }) : ''].filter(Boolean).join(' · ');
  return row({ act: 'edit-prayer', id: p.id, lead: who ? avatar(who.name, 'blue') : '<span class="prayic' + (p.answer ? ' done' : '') + '">' + (p.answer ? IC.check : IC.heart) + '</span>', title: esc(p.title), sub: esc(sub),
    right: p.answer ? pill('Answered', 'green') : due ? pill('Follow Up', 'amber') : p.private ? pill('Private', 'tone-slate') : '' });
}
function prayerView(e, kind) {
  var list = prayers(kind), lab = PRAYER_KIND[kind];
  if (kind === 'intercede') {
    var open = list.filter(function (p) { return !p.answer; }).sort(function (a, b) { return (followDue(b) ? 1 : 0) - (followDue(a) ? 1 : 0); }), done = list.filter(function (p) { return p.answer; });
    return prayerBar() + secHead('Interceding For', addBtn(lab[1], 'add-prayer', kind), open.length ? String(open.length) : '') +
      listBox(open.map(prayerRow), 'Healing, salvations, the weather, the people you meet. Add anything the prayer team should carry. Nothing here gets checked off; it stays until you remove it.') +
      (done.length ? secHead('What God Did', '', String(done.length)) + listBox(done.map(prayerRow), '') : '') +
      '<p class="small muted pray-tip">Link a need to someone in your contacts and set a follow-up date. When the day comes, it shows under Needs Attention so you can check in and hear what the Lord did.</p>';
  }
  if (kind === 'declare') return prayerBar() + secHead('Declarations', addBtn(lab[1], 'add-prayer', kind), list.length ? String(list.length) : '') +
    (list.length ? '<div class="decl-list">' + list.map(function (p, i) { return '<button class="card decl" data-a="edit-prayer" data-id="' + p.id + '"><span class="decl-n">' + (i + 1) + '</span><span class="decl-t">' + esc(p.title) + '</span></button>'; }).join('') + '</div>'
      : '<div class="empty card">What you’re declaring over this event. “The truth will come out.” “The presence of the Lord will fill this place.”</div>');
  return prayerBar() + secHead('Scripture', addBtn(lab[1], 'add-prayer', kind), list.length ? String(list.length) : '') +
    (list.length ? list.map(function (p) { return '<button class="card verse" data-a="edit-prayer" data-id="' + p.id + '">' + (p.body ? '<span class="verse-t">' + esc(p.body) + '</span>' : '') + '<span class="verse-r">' + esc(p.title) + '</span></button>'; }).join('')
      : '<div class="empty card">The verses this event stands on. Add the reference and the words, so the team can read them together.</div>');
}
function prayerFields(kind) {
  if (kind === 'declare') return [{ k: 'title', label: 'Declaration', type: 'textarea', auto: true, ph: 'The truth will come out, and the Lord will reveal Himself.' }];
  if (kind === 'verse') return [{ k: 'title', label: 'Reference', auto: true, ph: 'Psalm 22:3' }, { k: 'body', label: 'Verse', type: 'textarea', ph: 'Yet you are holy, enthroned on the praises of Israel.' }];
  return [{ k: 'title', label: 'What We’re Praying For', auto: true, ph: 'Healing for her back' },
    { k: 'person_id', label: 'For (Optional)', type: 'select', opts: function () { return [['', 'No one in particular']].concat(T('ed_people').filter(function (p) { return p.status !== 'previous'; }).sort(function (x, y) { return x.name.localeCompare(y.name); }).map(function (p) { return [p.id, p.name]; })); }, hint: 'Pick someone from your contacts. Add them in Contacts first if they’re new.' },
    { k: 'body', label: 'Details', type: 'textarea', ph: 'What they asked for, and anything the team should know.' },
    { k: 'follow_up_on', label: 'Follow Up On', type: 'date', half: true, hint: 'We’ll remind you on the Overview.' },
    { k: 'private', label: 'Keep Private', type: 'check', half: true, hint: 'Leave it off the shared Prayer Guide.' },
    { k: 'answer', label: 'What God Did', type: 'textarea', ph: 'She called Tuesday. The pain is gone.', hint: 'Add this when you hear back. It moves to What God Did.' }];
}
function editPrayer(kind, rec) {
  var lab = PRAYER_KIND[kind];
  editRow('ed_prayer', rec, prayerFields(kind), { title: rec ? 'Edit ' + lab[0] : lab[1].replace('Add', 'Add A'), base: { event_id: S.ev.id, kind: kind, body: '', answer: '', private: false, person_id: null, follow_up_on: null, sort: prayers(kind).length },
    prep: function (v) { if (!v.person_id) v.person_id = null; return v; }, delMsg: 'Remove this ' + lab[0].toLowerCase() + '?' });
}
var WX = {}, US_STATES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia' };
function wxPlace(e) {
  var p = String(e.address || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!p.length) return null;
  var last = p[p.length - 1], st = (/\b([A-Z]{2})\b/.exec(last) || [])[1] || '', city = p.length >= 3 ? p[p.length - 2] : p.length === 2 ? (/\d/.test(p[0]) ? (st ? '' : p[1]) : p[0]) : '';
  if (!city && p.length === 2 && st) city = /\d/.test(p[0]) ? '' : p[0];
  if (!city) return null;
  return { city: city.replace(/\d+/g, '').trim(), state: US_STATES[st] || '' };
}
function wxWord(c) { return c === 0 ? 'Clear' : c <= 2 ? 'Partly Cloudy' : c === 3 ? 'Cloudy' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Showers' : c <= 86 ? 'Snow Showers' : 'Storms'; }
function wxLoad(e) {
  var pl = wxPlace(e), from = e.starts_on > TODAY ? e.starts_on : TODAY, to = (e.ends_on || e.starts_on) < addDays(TODAY, 15) ? (e.ends_on || e.starts_on) : addDays(TODAY, 15), key = 'ed.wx.' + e.id + '.' + from + '.' + to;
  if (!pl || !window.fetch) { WX[e.id] = null; return; }
  try { var c = JSON.parse(lget(key) || 'null'); if (c && Date.now() - c.at < 3 * 3600e3) { WX[e.id] = c.v; return; } } catch (er) {}
  WX[e.id] = 'loading';
  fetch('https://geocoding-api.open-meteo.com/v1/search?count=10&language=en&format=json&countryCode=US&name=' + encodeURIComponent(pl.city)).then(function (r) { return r.json(); }).then(function (g) {
    var hit = (g.results || []).find(function (x) { return !pl.state || x.admin1 === pl.state; }); if (!hit) throw new Error('place');
    return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + hit.latitude + '&longitude=' + hit.longitude + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&start_date=' + from + '&end_date=' + to)
      .then(function (r) { return r.json(); }).then(function (f) {
        var dd = f.daily || {}, v = { place: hit.name + (pl.state ? ', ' + Object.keys(US_STATES).find(function (k) { return US_STATES[k] === pl.state; }) : ''), days: (dd.time || []).map(function (t, i) { return { d: t, c: dd.weather_code[i], hi: Math.round(dd.temperature_2m_max[i]), lo: Math.round(dd.temperature_2m_min[i]), p: dd.precipitation_probability_max ? dd.precipitation_probability_max[i] : null }; }) };
        WX[e.id] = v; lset(key, JSON.stringify({ at: Date.now(), v: v })); render();
      });
  }).catch(function () { WX[e.id] = null; });
}
function weatherCard(e) {
  var end = e.ends_on || e.starts_on;
  if (!e.starts_on || end < TODAY || dayDiff(e.starts_on, TODAY) > 14 || !e.address) return '';
  if (!(e.id in WX)) wxLoad(e);
  var w = WX[e.id]; if (!w || w === 'loading' || !w.days.length) return '';
  return '<div class="card wx"><div class="wx-k">Weather · ' + esc(w.place) + '</div><div class="wx-days">' + w.days.slice(0, 5).map(function (d) {
    var wet = d.p != null && d.p >= 40;
    return '<div class="wx-day' + (wet ? ' wet' : '') + '"><b>' + esc(dt(d.d).toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + dt(d.d).getDate()) + '</b><span class="wx-t">' + d.hi + '° <small>' + d.lo + '°</small></span><span class="wx-w">' + esc(wxWord(d.c)) + '</span>' + (d.p != null ? '<span class="wx-p">' + d.p + '% rain</span>' : '') + '</div>';
  }).join('') + '</div></div>';
}
function heartCard(e) {
  var vs = prayers('verse'), ds = prayers('declare'), needs = prayers('intercede').filter(function (p) { return !p.answer; });
  var has = e.theme || e.purpose || vs.length || ds.length;
  if (!has && !on('prayer')) return '';
  if (!has) return '<button class="card heart empty-heart" data-a="edit-heart"><span class="heart-k">The Heart Of It</span><b>Add a theme, purpose and scripture</b><span class="small muted">A small reminder of why you’re doing this, right here for the whole team.</span></button>';
  var v = vs[0];
  return '<div class="card heart"><div class="heart-top"><span class="heart-k">The Heart Of It</span><button class="link" data-a="edit-heart">Edit</button></div>' +
    (e.theme ? '<div class="heart-theme">' + esc(e.theme) + '</div>' : '') + (e.purpose ? '<p class="heart-p">' + esc(e.purpose) + '</p>' : '') +
    (v ? '<blockquote class="heart-v">' + (v.body ? esc(clip(v.body, 170)) : '') + '<cite>' + esc(v.title) + '</cite></blockquote>' : '') +
    (on('prayer') && (vs.length || ds.length || needs.length) ? '<button class="heart-foot" data-a="ev-tab" data-id="prayer">' + esc([ds.length ? plural(ds.length, 'Declaration') : '', vs.length > 1 ? plural(vs.length, 'Verse') : '', needs.length ? plural(needs.length, 'Prayer Need') : ''].filter(Boolean).join(' · ') || 'Open Prayer') + IC.chev + '</button>' : '') + '</div>';
}

/* ---------- overview */
function attention(e) {
  var out = [], soon = addDays(TODAY, 14), started = e.starts_on && e.starts_on <= TODAY, ended = (e.ends_on || e.starts_on) && (e.ends_on || e.starts_on) < TODAY;
  if (on('volunteers') && !ended) { var bgn = {}; evRows('ed_items').filter(function (i) { return i.kind === 'serve' && i.needs_check && (i.on_date || e.starts_on || TODAY) >= TODAY; }).forEach(function (i) { bgGaps(i).forEach(function (g) { bgn[g.s.name] = 1; }); }); var bgl = Object.keys(bgn); if (bgl.length) out.push(['red', bgl.length === 1 ? '1 Volunteer Needs A Background Check' : bgl.length + ' Volunteers Need A Background Check', 'On a check-required shift: ' + bgl.slice(0, 4).join(', ') + (bgl.length > 4 ? '…' : ''), 'volunteers']); }
  if (on('tasks')) { var late = evRows('ed_tasks').filter(function (t) { return !t.done && t.due_on && t.due_on < TODAY; }); if (late.length) out.push(['red', plural(late.length, 'Task') + ' Overdue', late.slice(0, 3).map(function (t) { return t.title; }).join(', '), 'tasks']); }
  if (on('money') || on('vendors') || on('speakers') || on('people')) {
    var pays = payables(e), od = pays.filter(function (p) { return p.owed > 0 && p.due && p.due < TODAY; }), ds = pays.filter(function (p) { return p.owed > 0 && p.due && p.due >= TODAY && p.due <= soon; });
    if (od.length) out.push(['red', plural(od.length, 'Payment') + ' Overdue', od.map(function (p) { return p.name + ' ' + money(p.owed); }).join(', '), 'money']);
    if (ds.length) out.push(['amber', plural(ds.length, 'Payment') + ' Due In The Next 2 Weeks', ds.map(function (p) { return p.name + ' ' + money(p.owed) + ' by ' + fmtDay(p.due, { month: 'short', day: 'numeric' }); }).join(', '), 'money']);
  }
  if (on('vendors')) { var q = evRows('ed_event_vendors').filter(function (v) { return v.status === 'Quoted'; }); if (q.length) out.push(['amber', plural(q.length, 'Vendor') + ' Not Booked Yet', q.map(function (v) { return (byId('ed_vendors', v.vendor_id) || {}).name; }).join(', '), 'vendors']); }
  if (on('volunteers') && num(e.volunteer_goal) && volCount() < num(e.volunteer_goal)) out.push([num(e.volunteer_goal) - volCount() > num(e.volunteer_goal) / 4 ? 'red' : 'amber', (num(e.volunteer_goal) - volCount()) + ' Volunteers Short Of Your Goal', volCount() + ' of ' + num(e.volunteer_goal) + ' so far. Share the volunteer link.', 'volunteers']);
  if (!ended) { var tr = evRows('ed_event_people').filter(function (p) { return travelGaps(p).length; });
    if (tr.length) out.push(['amber', plural(tr.length, 'Guest') + ' Still ' + (tr.length === 1 ? 'Needs' : 'Need') + ' Travel Or A Place To Stay', tr.map(function (p) { return ((byId('ed_people', p.person_id) || {}).name || 'Someone') + ': ' + travelGaps(p).join(', ').toLowerCase(); }).join(' · '), 'people']); }
  if (on('speakers') || on('volunteers')) {
    var sp = evRows('ed_event_people').filter(function (p) { return p.team === 'speaker' && (p.details || {}).status === 'Invited'; });
    if (sp.length && on('speakers')) out.push(['amber', plural(sp.length, 'Speaker') + ' Not Confirmed', sp.map(function (p) { return (byId('ed_people', p.person_id) || {}).name; }).join(', '), 'people']);
    var open = evRows('ed_items').filter(function (i) { return i.kind === 'serve'; }).reduce(function (s, i) { return s + Math.max(0, i.needed - signups(i.id).length); }, 0);
    if (open && on('volunteers') && !(num(e.volunteer_goal) && volCount() < num(e.volunteer_goal))) out.push(['amber', plural(open, 'Volunteer Spot') + ' Still Open', 'Share the sign-up link.', 'volunteers']);
  }
  if (on('food')) { var mo = evRows('ed_items').filter(function (i) { return i.kind === 'meal'; }).reduce(function (s, i) { return s + Math.max(0, i.needed - signups(i.id).length); }, 0); if (mo) out.push(['amber', plural(mo, 'Meal Spot') + ' Still Open', '', 'food']); }
  if (on('equipment')) {
    var eq = evRows('ed_event_equipment'), cf = eq.filter(function (a) { return conflict(a); });
    if (cf.length) out.push(['red', plural(cf.length, 'Equipment Item') + ' Double-Booked', cf.map(function (a) { return (byId('ed_equipment', a.equipment_id) || {}).name; }).join(', '), 'equipment']);
    var bad = eq.filter(function (a) { var g = byId('ed_equipment', a.equipment_id); return g && g.condition !== 'Good'; });
    if (bad.length) out.push(['amber', plural(bad.length, 'Item') + ' Needs Repair Or Is Missing', bad.map(function (a) { return byId('ed_equipment', a.equipment_id).name; }).join(', '), 'equipment']);
    if (ended) { var nr = eq.filter(function (a) { return !a.returned; }); if (nr.length) out.push(['amber', plural(nr.length, 'Item') + ' Not Returned', '', 'equipment']); }
    else if (e.starts_on && dayDiff(e.starts_on, TODAY) <= 2) { var nl = eq.filter(function (a) { return !a.loaded; }); if (nl.length) out.push(['amber', plural(nl.length, 'Item') + ' Not Loaded', '', 'equipment']); }
  }
  if (on('followup')) { var nc = evRows('ed_cards').filter(function (c) { return c.status === 'new'; }); if (nc.length) out.push(['red', plural(nc.length, 'New Connection Card') + ' To Follow Up', nc.map(function (c) { return c.name; }).join(', '), 'followup']); }
  if (on('prayer')) { var pf = evRows('ed_prayer').filter(followDue); if (pf.length) out.push(['amber', plural(pf.length, 'Prayer Follow-Up') + ' Due', pf.map(function (p) { var w = prayFor(p); return (w ? w.name + ': ' : '') + p.title; }).join(', '), 'intercede']); }
  return out;
}
function wsOverview(e) {
  var cd = countdown(e), att = attention(e), m = eventMoney(e);
  var up = [];
  if (on('calendar')) evRows('ed_schedule').filter(function (s) { return s.on_date > TODAY || (s.on_date === TODAY && !todayCard(e)); }).forEach(function (s) { up.push({ d: s.on_date, t: s.start_time || '', title: s.title, sub: [fmtTime(s.start_time), s.location].filter(Boolean).join(' · '), tab: 'calendar' }); });
  if (on('tasks')) evRows('ed_tasks').filter(function (t) { return !t.done && t.due_on && t.due_on >= TODAY; }).forEach(function (t) { up.push({ d: t.due_on, t: 'zz', title: t.title, sub: 'Task' + (t.owner ? ' · ' + t.owner : ''), tab: 'tasks' }); });
  up.sort(function (a, b) { return (a.d + a.t).localeCompare(b.d + b.t); });
  var days = e.starts_on ? Math.round((dt(e.starts_on) - dt(TODAY)) / 864e5) : null, ts = evRows('ed_tasks'), td = ts.filter(function (t) { return t.done; }).length, pct = ts.length ? Math.round(100 * td / ts.length) : 0;
  var g = [];
  function tile(k, v, jump, hl) { g.push('<button class="stat' + (hl ? ' hl' : '') + '" data-a="ev-tab" data-id="' + jump + '"><div class="v">' + v + '</div><div class="k">' + esc(k) + '</div></button>'); }
  if (on('volunteers')) tile(num(e.volunteer_goal) ? 'Volunteer Goal' : 'Volunteers', num(e.volunteer_goal) ? volCount() + '/' + num(e.volunteer_goal) : volCount(), 'volunteers', num(e.volunteer_goal) > volCount());
  if (on('guests') && fill('attend').need) tile('Coming', fill('attend').have, 'attending');
  if (on('food') && fill('meal').need) { var ml = fill('meal'); tile('Meals', ml.have + '/' + ml.need, 'food'); }
  if (on('equipment')) { var eq = evRows('ed_event_equipment'); tile('Loaded', eq.filter(function (x) { return x.loaded; }).length + '/' + eq.length, 'equipment'); }
  if (on('vendors')) { var ow = payables(e).filter(function (p) { return p.t === 'v'; }).reduce(function (s, p) { return s + p.owed; }, 0); tile('Vendors Owed', money(ow), 'vendors', ow > 0); }
  if (on('money')) { tile('Committed', money(m.committed), 'money', m.budget && m.committed > m.budget); tile('Given', money(m.given), 'money'); }
  if (on('agenda')) tile('Agenda', evRows('ed_agenda').length, 'agenda');
  if (on('followup')) { var nc = evRows('ed_cards').filter(function (c) { return c.status === 'new'; }).length; tile('New Cards', nc, 'followup', nc > 0); }
  // fill out to a full row of three: open tasks, the team, then the schedule
  var fillers = [['Tasks Left', ts.length - td, 'tasks'], ['Team', evRows('ed_event_people').filter(function (x) { return x.team !== 'volunteer'; }).length, 'team'], ['On The Schedule', evRows('ed_schedule').length, 'calendar']];
  while (g.length % 3 && fillers.length) { var f0 = fillers.shift(); tile(f0[0], f0[1], f0[2]); }
  if (g.length > 6) g = g.slice(0, 6);
  if (g.length % 3) g = g.slice(0, g.length - g.length % 3);
  return '<div class="countdown"><div class="cd-num">' + (days != null && days > 1 ? '<b>' + days + '</b><span>Days<br>To Go</span>' : '<b class="word">' + esc(cd || 'Not Scheduled') + '</b>') + '</div>' +
      '<div class="cd-side">' + (ts.length ? '<div class="cd-k">Tasks</div><div class="cd-v">' + td + ' of ' + ts.length + ' done</div><div class="cd-bar"><i style="width:' + pct + '%"></i></div>' : '<div class="cd-k">' + esc(fmtRange(e.starts_on, e.ends_on)) + '</div>' + ((e.starts_on || '9') > TODAY ? '<button class="cd-v link" data-a="ev-tab" data-id="tasks">Add the first task</button>' : '')) +
      (e.address ? '<a class="cd-link" href="' + esc(mapUrl(e.address)) + '" target="_blank" rel="noopener">' + IC.pin + ' Directions</a>' : '') + '</div></div>' +
    todayCard(e) + weatherCard(e) + sessCard(e) + heartCard(e) +
    (g.length ? secHead('At A Glance') + '<div class="stats glance">' + g.slice(0, 6).join('') + '</div>' : '') +
    secHead('Needs Attention', '', att.length ? String(att.length) : '') +
    (att.length ? '<div class="list">' + att.map(function (a) { return row({ act: 'ev-tab', id: a[3], cls: 'flag ' + a[0], title: esc(a[1]), sub: esc(a[2]) }); }).join('') + '</div>'
      : '<div class="empty good">' + IC.check + ' Nothing needs attention right now.</div>') +
    debriefCard(e) + (up.length ? secHead('Coming Up') + listBox(up.slice(0, 5).map(function (u) { return row({ act: 'ev-tab', id: u.tab, lead: '<span class="datebox sm"><small>' + dt(u.d).toLocaleDateString('en-US', { month: 'short' }) + '</small><b>' + dt(u.d).getDate() + '</b></span>', title: esc(u.title), sub: esc(u.sub) }); }), '') : '');
}
function todayCard(e) {
  if (!e.starts_on || TODAY < e.starts_on || TODAY > (e.ends_on || e.starts_on)) return '';
  var sch = evRows('ed_schedule').filter(function (s) { return s.on_date === TODAY; }).sort(function (x, y) { return String(x.start_time || '').localeCompare(String(y.start_time || '')); });
  var ci = on('guests') || on('volunteers');
  return '<div class="card today"><div class="today-k">' + IC.cal + ' Today · ' + esc(fmtLong(TODAY)) + '</div>' +
    (sch.length ? '<ol class="today-list">' + sch.map(function (s) { return '<li><b>' + esc(fmtTime(s.start_time) || 'Any Time') + '</b><span>' + esc(s.title) + (s.location ? ' · ' + esc(s.location) : '') + '</span></li>'; }).join('') + '</ol>'
      : '<p class="small muted" style="margin:6px 0 0">' + (on('calendar') ? 'Nothing on today’s schedule.' : 'It’s event day.') + '</p>') +
    '<div class="btnrow">' + (ci ? '<button class="btn sm" data-a="ev-tab" data-id="checkin">Check People In</button><button class="btn sm plain" data-a="show-qr" data-id="k">Check-In QR</button>' : '') + (on('calendar') ? '<button class="btn sm plain" data-a="doc" data-id="schedule">Run Of Show</button>' : '') + '<button class="btn sm plain" data-a="doc" data-id="contacts">Phone List</button></div></div>';
}
function debriefCard(e) {
  var over = e.starts_on && (e.ends_on || e.starts_on) < TODAY;
  return (over ? '<button class="card praybar recapbar" data-a="doc" data-id="recap"><span class="docic">' + IC.list + '</span><span class="main"><b>Event Recap</b><span>Attendance, volunteers, decisions, money and answered prayer on one page. Share it with the board.</span></span><span class="chev">' + IC.chev + '</span></button>' : '') + debriefCard0(e, over);
}
function debriefCard0(e, over) {
  if (!over && !e.debrief) return '';
  return secHead(over ? 'Notes For Next Year' : 'Notes From Last Time', '<button class="link" data-a="edit-debrief">' + (e.debrief ? 'Edit' : 'Add Notes') + '</button>') +
    '<div class="card notes">' + (e.debrief ? esc(e.debrief) : '<span class="muted">What worked, what didn’t, what to change. These stay with the event when you choose Start Next Year.</span>') + '</div>';
}
function signups(itemId) { return T('ed_signups').filter(function (s) { return s.item_id === itemId; }); }
function taken(i) { return signups(i.id).reduce(function (n, s) { return n + (i.kind === 'attend' ? (s.party || 1) : 1); }, 0); }
function fill(kind) { var need = 0, have = 0; evRows('ed_items').filter(function (i) { return i.kind === kind; }).forEach(function (i) { need += i.needed; have += Math.min(i.needed, taken(i)); }); return { need: need, have: have }; }

/* ---------- calendar */
function eventDays(e) {
  var s = {};
  if (e.starts_on) { var n = e.ends_on ? dayDiff(e.ends_on, e.starts_on) : 0; for (var i = 0; i <= Math.min(n, 60); i++) s[addDays(e.starts_on, i)] = 1; }
  evRows('ed_schedule').forEach(function (r) { if (r.on_date) s[r.on_date] = 1; });
  evRows('ed_items').forEach(function (r) { if (r.on_date) s[r.on_date] = 1; });
  return Object.keys(s).sort();
}
function wsCalendar(e) {
  var days = eventDays(e);
  var tasksDue = evRows('ed_tasks').filter(function (t) { return t.due_on && days.indexOf(t.due_on) < 0 && t.due_on >= TODAY && !t.done; });
  if (!days.length) return '<div class="card empty">Give this event its dates to build its calendar. <button class="link" data-a="edit-event">Set Dates</button></div>';
  var cur = S.calDay && days.indexOf(S.calDay) >= 0 ? S.calDay : (days.indexOf(TODAY) >= 0 ? TODAY : days.find(function (d) { return d >= TODAY; }) || days[0]);
  S.calDay = cur;
  var strip = '<div class="daystrip" role="tablist">' + days.map(function (d) {
    var x = dt(d), busy = evRows('ed_schedule').some(function (s) { return s.on_date === d; });
    return '<button role="tab" aria-selected="' + (d === cur) + '" data-a="cal-day" data-v="' + d + '"><small>' + x.toLocaleDateString('en-US', { weekday: 'short' }) + '</small><b>' + x.getDate() + '</b><small>' + x.toLocaleDateString('en-US', { month: 'short' }) + '</small>' + (busy ? '<i></i>' : '') + '</button>';
  }).join('') + '</div>';
  var sched = evRows('ed_schedule').filter(function (s) { return s.on_date === cur; }).sort(function (a, b) { return String(a.start_time || '').localeCompare(String(b.start_time || '')); });
  var tasks = evRows('ed_tasks').filter(function (t) { return t.due_on === cur; });
  var its = evRows('ed_items').filter(function (i) { return i.on_date === cur; });
  var sets = evRows('ed_setlists').filter(function (s) { return s.on_date === cur; });
  var sp = evRows('ed_event_people').filter(function (p) { return p.team === 'speaker' && (p.details || {}).date === cur; });
  return strip + secHead(fmtLong(cur), addBtn('Add To Schedule', 'add-sched')) +
    listBox(sched.map(function (s) { return row({ act: 'edit-sched', id: s.id, lead: '<span class="time">' + esc(fmtTime(s.start_time) || 'All Day') + (s.end_time ? '<small>' + esc(fmtTime(s.end_time)) + '</small>' : '') + '</span>', title: esc(s.title), sub: esc([s.location, refContact(s.owner_ref) ? refContact(s.owner_ref).name : s.owner].filter(Boolean).join(' · ')), right: refPill(s.owner_ref) }); }), 'Nothing scheduled this day.') +
    (sp.length ? '<div class="grouplbl">Speaking</div>' + listBox(sp.map(function (p) { var pr = byId('ed_people', p.person_id) || {}; return row({ act: 'edit-assign', id: p.id, lead: avatar(pr.name), title: esc(pr.name), sub: esc([p.details.time, p.details.topic].filter(Boolean).join(' · ')) }); }), '') : '') +
    (tasks.length ? '<div class="grouplbl">Tasks Due</div>' + listBox(tasks.map(taskRow), '') : '') +
    (its.length ? '<div class="grouplbl">Sign-Up Spots</div>' + listBox(its.map(function (i) { var n = signups(i.id).length; return row({ act: 'edit-item', id: i.id, title: esc(i.title), sub: esc([i.time_label, i.kind === 'meal' ? 'Food' : 'Volunteers'].filter(Boolean).join(' · ')), right: pill(n + ' / ' + i.needed, n >= i.needed ? 'green' : 'amber') }); }), '') : '') +
    (sets.length ? '<div class="grouplbl">Set Lists</div>' + listBox(sets.map(function (s) { return row({ act: 'edit-setlist', id: s.id, title: esc(s.title || 'Set List'), sub: esc(String(s.songs || '').split('\n').filter(Boolean).join(' · ')) }); }), '') : '') +
    (tasksDue.length ? '<p class="small muted" style="margin-top:16px">' + plural(tasksDue.length, 'more task') + (tasksDue.length === 1 ? ' falls' : ' fall') + ' before the event. See the Tasks tab.</p>' : '');
}

/* ---------- people */
function assigned(team) { return evRows('ed_event_people').filter(function (a) { return a.team === team; }).map(function (a) { return { a: a, p: byId('ed_people', a.person_id) || { name: '(Removed)' } }; }).sort(function (x, y) { return x.p.name.localeCompare(y.p.name); }); }
function personRow(x, extraSub, right, pills) { var pl = (pills || '') + travelPills(x.a); return row({ act: 'edit-assign', id: x.a.id, lead: avatar(x.p.name, x.a.team === 'volunteer' ? 'green' : 'red'), title: esc(x.p.name), sub: contactSub([x.a.role || x.p.title, x.a.days], x.p.phone, x.p.email) + (extraSub ? '<br>' + extraSub : '') + (pl ? '<span class="pills">' + pl + '</span>' : ''), right: right || '' }); }
function signupBlock(kind, title, addLabel) {
  var list = evRows('ed_items').filter(function (i) { return i.kind === kind; }).sort(function (a, b) { return String(a.on_date || '').localeCompare(String(b.on_date || '')) || a.sort - b.sort; });
  var f = fill(kind), groups = [];
  list.forEach(function (i) { var g = groups.find(function (x) { return x.d === (i.on_date || ''); }); if (!g) groups.push(g = { d: i.on_date || '', items: [] }); g.items.push(i); });
  var att = kind === 'attend';
  return secHead(title, addBtn(addLabel, 'add-item', kind, 'ghost'), att ? '' : f.have + ' of ' + f.need + ' filled') +
    '<div class="btnrow"><button class="btn sm plain" data-a="csv-signups" data-id="' + kind + '">Download List</button></div>' +
    (groups.length ? groups.map(function (g) {
      return '<div class="grouplbl">' + esc(g.d ? fmtLong(g.d) : 'Any Day') + '</div>' + g.items.map(function (i) {
        var su = signups(i.id), tk = taken(i), open = i.needed - tk, gaps = bgGaps(i);
        return '<div class="card slotcard"><div class="slot-head"><div class="main"><b>' + esc(i.title) + '</b>' + (i.needs_check ? ' ' + pill('Check Required', gaps.length ? 'red' : 'green') : '') + (i.time_label || i.notes ? '<div class="small muted">' + esc([i.time_label, i.notes].filter(Boolean).join(' · ')) + '</div>' : '') + '</div>' +
          pill(att ? tk + ' Coming' : tk + ' / ' + i.needed, att ? (open > 0 ? 'green' : 'amber') : open > 0 ? 'amber' : 'green') + '<button class="link" data-a="edit-item" data-id="' + i.id + '">Edit</button></div>' + meter(Math.min(tk, i.needed), i.needed) +
          (gaps.length ? '<div class="bgwarn">' + IC.warn + '<span><b>Not cleared:</b> ' + gaps.map(function (g) { return '<button class="link inline" data-a="' + (g.p ? 'dir-edit" data-t="ed_people" data-id="' + g.p.id : 'bg-add" data-id="' + g.s.id) + '">' + esc(g.s.name) + '</button> (' + esc(g.why) + ')'; }).join(', ') + '</span></div>' : '') +
          (su.length && (S.openSlots || {})[i.id] ? '<div class="list inner">' + su.map(function (s) {
            var owes = att && num(i.fee) > 0, inDir = personForSignup(s);
            return '<div class="row"><button class="main" data-a="edit-signup" data-id="' + s.id + '"><div class="t">' + esc(s.name) + (s.checked_in_at ? ' ' + pill('Here', 'green') : '') + (owes ? ' ' + pill(s.paid ? 'Paid' : 'Owes ' + money(num(i.fee) * (s.party || 1)), s.paid ? 'green' : 'amber') : '') + '</div><div class="s">' + esc([att && (s.party || 1) > 1 ? 'Party of ' + s.party : '', s.phone, s.email, s.note, inDir ? 'In Contacts' : '', s.consent ? 'Okay to contact' : ''].filter(Boolean).join(' · ')) + '</div></button>' +
              (owes && !s.paid ? '<button class="link" data-a="pay-signup" data-id="' + s.id + '">Mark Paid</button>' : '') + (s.phone ? '<button class="link" data-a="text-from" data-v="' + esc(s.phone) + '" data-id="' + esc(s.name) + '">Text</button>' : '') + '<button class="link quiet" data-a="del-signup" data-id="' + s.id + '">Remove</button></div>';
          }).join('') + '</div>' : '') + '<div class="slot-foot">' + (su.length ? '<button class="btn sm plain" data-a="slot-open" data-id="' + i.id + '">' + ((S.openSlots || {})[i.id] ? 'Hide Names' : 'Show ' + plural(su.length, att ? 'RSVP' : 'Name')) + '</button>' : '') + (open > 0 ? '<button class="btn sm ghost" data-a="add-signup" data-id="' + i.id + '">' + IC.plus + (att ? ' Add RSVP' : i.kind === 'meal' ? ' Add Dish' : ' Add Volunteer') + '</button>' : '') + '</div>' + '</div>';
      }).join('');
    }).join('') : '<div class="empty card">Nothing for people to sign up for yet.</div>') +
    (kind === 'serve' || kind === 'attend' ? '<div class="card tip"><b>Keep Your ' + (kind === 'serve' ? 'Volunteers' : 'Guests') + '</b><p class="small muted">Save everyone who ' + (kind === 'serve' ? 'signed up' : 'RSVP’d') + ' to Contacts as ' + (kind === 'serve' ? 'volunteers' : 'guests') + ', so you can invite them next time.</p><button class="btn sm ghost" data-a="vols-to-dir" data-id="' + kind + '">Save To Contacts</button></div>' : '');
}

/* ---------- agenda */
function wsAgenda(e) {
  var list = evRows('ed_agenda').sort(function (a, b) { return a.sort - b.sort; }), mins = list.reduce(function (s, a) { return s + num(a.minutes); }, 0);
  return secHead('Agenda', addBtn('Add Segment', 'add-agenda'), mins ? 'About ' + mins + ' Minutes' : '') +
    listBox(list.map(function (a, i) {
      var who = refContact(a.leader_ref), name = who ? who.name : a.leader;
      return '<div class="row">' + ck(a.done, 'toggle-agenda', a.id, 'Done') + '<button class="main" data-a="edit-agenda" data-id="' + a.id + '"><div class="t' + (a.done ? ' done' : '') + '">' + (i + 1) + '. ' + esc(a.title) + '</div><div class="s">' + esc([a.start_time ? fmtTime(a.start_time) : '', name, a.minutes ? a.minutes + ' Min' : ''].filter(Boolean).join(' · ')) + (a.notes ? '<br>' + esc(a.notes) : '') + '</div></button>' + refPill(a.leader_ref) + '</div>';
    }), 'No segments yet. Opening prayer, worship, housekeeping, the message: add each part and who leads it.') +
    secHead('Meeting Notes', '<button class="link" data-a="edit-notes">' + (e.notes ? 'Edit' : 'Add Notes') + '</button>') +
    '<div class="card notes">' + (e.notes ? esc(e.notes) : '<span class="muted">Decisions, prayer needs and next steps.</span>') + '</div>';
}

/* ---------- vendors & contacts */
function wsVendors(e) {
  var vs = evRows('ed_event_vendors').map(function (a) { return { a: a, v: byId('ed_vendors', a.vendor_id) || { name: '(Removed)' } }; }).sort(function (x, y) { return x.v.name.localeCompare(y.v.name); });
  var cs = evRows('ed_event_contacts').map(function (a) { return { a: a, c: byId('ed_contacts', a.contact_id) || { name: '(Removed)' } }; }).sort(function (x, y) { return x.c.name.localeCompare(y.c.name); });
  var st = subTabs('vendors', [['vendors', 'Vendors', vs.length], ['contacts', 'Contacts', cs.length]], 'vendors');
  if (st.cur === 'contacts') return st.html + secHead('Other Contacts', addBtn('Add Contact', 'pick', 'ed_contacts'), cs.length ? String(cs.length) : '') +
    listBox(cs.map(function (x) { return row({ act: 'edit-assign-c', id: x.a.id, lead: avatar(x.c.name, 'slate'), title: esc(x.c.name), sub: contactSub([x.a.role || x.c.role, x.c.organization], x.c.phone, x.c.email) }); }), 'Landowner, permit office, fire inspector… add who you’ll need to reach.');
  var live = vs.filter(function (x) { return x.a.status !== 'Cancelled'; }), cost = live.reduce(function (s, x) { return s + num(x.a.cost); }, 0), paid = live.reduce(function (s, x) { return s + (x.a.pay_status === 'Paid In Full' ? num(x.a.cost) : num(x.a.paid)); }, 0);
  return st.html + '<div class="stats three">' + stat('Total Cost', money(cost)) + stat('Paid', money(paid)) + stat('Still Owed', money(cost - paid), cost - paid > 0) + '</div>' +
    secHead('Vendors', addBtn('Add Vendor', 'pick', 'ed_vendors'), vs.length ? String(vs.length) : '') +
    listBox(vs.map(function (x) {
      var a = x.a, owed = a.pay_status === 'Paid In Full' ? 0 : Math.max(0, num(a.cost) - num(a.paid));
      return row({ act: 'edit-assign-v', id: a.id, lead: avatar(x.v.name, 'amber'), title: esc(x.v.name),
        sub: contactSub([x.v.contact_name], x.v.phone, x.v.email) + (a.service ? '<br><span class="clip">' + esc(a.service) + '</span>' : '') + (owed ? '<br>' + money(owed) + ' owed' + (a.payer ? ' · ' + esc(a.payer) + ' pays' : '') + (a.due_on ? ' · due ' + fmtDay(a.due_on, { month: 'short', day: 'numeric' }) : '') : '') +
          '<span class="pills">' + pill(a.status, a.status === 'Booked' ? 'green' : a.status === 'Quoted' ? 'amber' : '') + (num(a.cost) ? payPill(a.pay_status, a.due_on) : '') + '</span>',
        right: num(a.cost) ? '<b class="amt">' + money(a.cost) + '</b>' : '' });
    }), 'Add the vendors working this event: tent, sound, restrooms, food trucks.');
}

/* ---------- equipment */
function overlaps(a, b) { if (!a.starts_on || !b.starts_on) return false; return a.starts_on <= (b.ends_on || b.starts_on) && b.starts_on <= (a.ends_on || a.starts_on); }
function conflict(asg) {
  var g = byId('ed_equipment', asg.equipment_id), me = byId('ed_events', asg.event_id); if (!g || !me) return null;
  var others = T('ed_event_equipment').filter(function (x) { return x.equipment_id === g.id && x.event_id !== me.id; }).map(function (x) { return { x: x, e: byId('ed_events', x.event_id) }; }).filter(function (o) { return o.e && overlaps(o.e, me); });
  var total = num(asg.quantity) + others.reduce(function (s, o) { return s + num(o.x.quantity); }, 0);
  return total > num(g.quantity) ? { total: total, owned: num(g.quantity), events: others.map(function (o) { return o.e.title; }) } : null;
}
function wsEquipment(e) {
  var list = evRows('ed_event_equipment').map(function (a) { return { a: a, g: byId('ed_equipment', a.equipment_id) || { name: '(Removed)', quantity: 0 } }; })
    .sort(function (x, y) { return String(x.g.category).localeCompare(String(y.g.category)) || x.g.name.localeCompare(y.g.name); });
  var loaded = list.filter(function (x) { return x.a.loaded; }).length, ret = list.filter(function (x) { return x.a.returned; }).length;
  var pct = T('ed_equipment').length ? Math.round(100 * list.length / T('ed_equipment').length) : 0;
  return '<div class="stats three">' + stat('Items', list.length) + stat('Loaded', loaded + ' / ' + list.length) + stat('Returned', ret + ' / ' + list.length, loaded && ret < list.length) + '</div>' +
    secHead('Equipment', addBtn('Add Equipment', 'pick', 'ed_equipment')) +
    (list.length ? '<div class="list">' + list.map(function (x) {
      var c = conflict(x.a), g = x.g;
      return '<div class="row eqrow"><div class="main"><button class="t linklike" data-a="edit-assign-e" data-id="' + x.a.id + '">' + esc(g.name) + '</button><div class="s">' + esc([g.category, g.location].filter(Boolean).join(' · ')) + (g.condition && g.condition !== 'Good' ? ' · <span class="danger">' + esc(g.condition) + '</span>' : '') +
        (c ? '<br><span class="danger">' + IC.warn + ' Needs ' + c.total + ', ministry owns ' + c.owned + ' (also at ' + esc(c.events.join(', ')) + ')</span>' : '') + '</div>' +
        '<div class="eqchecks"><label class="cbx sm"><input type="checkbox" data-change="eq-flag" data-k="loaded" data-id="' + x.a.id + '"' + (x.a.loaded ? ' checked' : '') + '><span>Loaded</span></label><label class="cbx sm"><input type="checkbox" data-change="eq-flag" data-k="returned" data-id="' + x.a.id + '"' + (x.a.returned ? ' checked' : '') + '><span>Returned</span></label></div></div>' +
        '<div class="stepper"><button data-a="eq-qty" data-id="' + x.a.id + '" data-d="-1" aria-label="Fewer">−</button><b>' + num(x.a.quantity) + '</b><button data-a="eq-qty" data-id="' + x.a.id + '" data-d="1" aria-label="More">+</button><small>of ' + num(g.quantity) + '</small></div></div>';
    }).join('') + '</div>' : '<div class="empty card">Pick what this event needs from the ministry’s inventory.</div>');
}

/* ---------- food */
function wsFood(e) {
  var fv = evRows('ed_event_vendors').map(function (a) { return { a: a, v: byId('ed_vendors', a.vendor_id) || {} }; }).filter(function (x) { return /food|cater/i.test(x.v.category || ''); });
  return signupBlock('meal', 'Meal Sign-Ups', 'Add Meal') +
    (on('vendors') || fv.length ? secHead('Food Vendors', on('vendors') ? '<button class="link" data-a="ev-tab" data-id="vendors">Vendors</button>' : '') + listBox(fv.map(function (x) { return row({ act: 'edit-assign-v', id: x.a.id, title: esc(x.v.name), sub: esc([x.a.service, x.a.arrival].filter(Boolean).join(' · ')), right: pill(x.a.status, x.a.status === 'Booked' ? 'green' : 'amber') }); }), 'No food trucks or caterers booked.') : '');
}

/* ---------- tasks */
function taskPrep(v) {
  v.assignee_refs = (v.assignee_refs || []).filter(function (r) { return refContact(r); });
  v.needed = Math.max(1, Math.min(100, parseInt(v.needed, 10) || 1));
  var n = refNames(v.assignee_refs); v.owner = n.concat(splitNames(v.owner_typed).filter(function (x) { return n.indexOf(x) < 0; })).join(', ').slice(0, 300);
  if (!v.task_owner) { var me = myMember(); v.task_owner = String(me.name || me.email || '').slice(0, 120); }
  v.owner_typed = undefined; return JSON.parse(JSON.stringify(v));
}
function taskNeed(t) {
  var ppl = taskPeople(t), need = Math.max(1, t.needed || 1), short = need - ppl.length;
  if (t.done || short <= 0) return '';
  return ppl.length ? short + ' more needed' : need > 1 ? need + ' people needed' : 'No one assigned';
}
function taskRow(t, by) {
  var late = !t.done && t.due_on && t.due_on < TODAY, tag = by === 'area' ? phaseLbl(phaseOf(t)) : t.area;
  return '<div class="row">' + ck(t.done, 'toggle-task', t.id) + '<button class="main" data-a="edit-task" data-id="' + t.id + '"><div class="t' + (t.done ? ' done' : '') + '">' + esc(t.title) + '</div><div class="s">' + (tag ? '<span class="ttag">' + esc(tag) + '</span>' : '') +
    (t.due_on ? '<span class="' + (late ? 'danger' : '') + '">' + (late ? 'Overdue · ' : '') + esc(fmtDay(t.due_on) + (t.due_time ? ', ' + t.due_time : '')) + '</span>' : '') + esc(taskPeople(t).length ? (t.due_on ? ' · ' : '') + taskPeople(t).join(', ') : '') + (taskNeed(t) ? '<span class="need">' + (t.due_on || taskPeople(t).length ? ' · ' : '') + esc(taskNeed(t)) + '</span>' : '') + '</div></button></div>';
}
function wsTasks(e) {
  var every = evRows('ed_tasks'), done = every.filter(function (t) { return t.done; }).length;
  var st = subTabs('taskby', [['phase', 'By Segment'], ['area', 'By Area']], 'phase'), by = st.cur;
  if (S.taskArea && !taskAreas(every).concat(['-']).some(function (x) { return x.toLowerCase() === S.taskArea.toLowerCase(); })) S.taskArea = '';
  var g = taskGroups(by, S.taskArea);
  var wk7 = addDays(TODAY, 7);
  return '<div class="stats">' + stat('Done', done + ' / ' + every.length) + stat('Overdue', every.filter(function (t) { return !t.done && t.due_on && t.due_on < TODAY; }).length, true) + stat('This Week', every.filter(function (t) { return !t.done && t.due_on && t.due_on >= TODAY && t.due_on <= wk7; }).length) + '</div>' + meter(done, every.length) +
    '<div class="btnrow" style="margin-top:14px">' + addBtn('Add Task', 'add-task') + (every.length ? '<button class="btn sm plain" data-a="doc" data-id="tasks">' + IC.list + ' Print Or Share</button>' : '') + '</div>' +
    (every.length ? '<div class="taskbar">' + st.html.replace('class="subtabs"', 'class="subtabs mini"') + areaSelect('tk_area', 'task-area', S.taskArea) + '</div>' : '') +
    g.groups.map(function (x) {
      return secHead(x[0], '', x[1].filter(function (t) { return t.done; }).length + ' of ' + x[1].length + ' done') + listBox(x[1].map(function (t) { return taskRow(t, by); }), '');
    }).join('') + (every.length ? '' : '<div class="empty card" style="margin-top:12px"><b>No tasks yet.</b><br>Add what has to happen before, during and after: prep, setup, food, teardown. Give each one a segment and an area so you can print one list per team.</div>');
}

/* ---------- money */
function payables(e) {
  var out = [];
  evRows('ed_event_vendors', e).filter(function (a) { return a.status !== 'Cancelled' && num(a.cost) > 0; }).forEach(function (a) { var v = byId('ed_vendors', a.vendor_id) || {}; out.push({ t: 'v', id: a.id, name: v.name, what: a.service || 'Vendor', amount: num(a.cost), owed: a.pay_status === 'Paid In Full' ? 0 : Math.max(0, num(a.cost) - num(a.paid)), status: a.pay_status, payer: a.payer, due: a.due_on }); });
  evRows('ed_event_people', e).filter(function (a) { return num(a.amount) > 0; }).forEach(function (a) { var p = byId('ed_people', a.person_id) || {}; out.push({ t: 'p', id: a.id, name: p.name, what: a.team === 'speaker' ? 'Honorarium' : 'Stipend', amount: num(a.amount), owed: a.pay_status === 'Paid In Full' ? 0 : num(a.amount), status: a.pay_status, payer: a.payer, due: a.due_on }); });
  evRows('ed_expenses', e).forEach(function (x) { out.push({ t: 'x', id: x.id, name: x.description, what: x.category || 'Expense', amount: num(x.amount), owed: x.pay_status === 'Paid In Full' ? 0 : num(x.amount), status: x.pay_status, payer: x.payer, due: x.due_on }); });
  return out;
}
function payRow(p) {
  var act = { v: 'edit-assign-v', p: 'edit-assign', x: 'edit-expense' }[p.t];
  return row({ act: act, id: p.id, title: esc(p.name), sub: esc([p.what, p.payer ? p.payer + ' Pays' : 'No One Assigned To Pay', p.due && p.owed ? 'Due ' + fmtDay(p.due, { month: 'short', day: 'numeric' }) : ''].filter(Boolean).join(' · ')),
    right: '<span class="amt">' + money(p.amount) + (p.owed && p.owed !== p.amount ? '<small>' + money(p.owed) + ' Owed</small>' : '') + payPill(p.status, p.due) + '</span>' });
}
function wsMoney(e) {
  var m = eventMoney(e), st = subTabs('money', [['summary', 'Summary'], ['payments', 'Payments'], ['offerings', 'Offerings', evRows('ed_offerings').length], ['expenses', 'Expenses', evRows('ed_expenses').length]], 'summary');
  var h = st.html;
  if (st.cur === 'summary') {
    var pays = payables(e), cats = {};
    pays.forEach(function (p) { var k = { v: 'Vendors', p: 'Speakers And Stipends', x: 'Expenses' }[p.t]; cats[k] = (cats[k] || 0) + p.amount; });
    return h + '<div class="stats">' + stat('Budget', m.budget ? money(m.budget) : '—') + stat('Committed', money(m.committed), m.budget && m.committed > m.budget) + stat('Paid', money(m.paid)) + stat('Still Owed', money(m.owed), m.owed > 0) + stat('Given', money(m.given)) + stat(m.given - m.committed >= 0 ? 'Over Costs' : 'Short Of Costs', money(Math.abs(m.given - m.committed)), m.given - m.committed < 0) + '</div>' +
      (m.budget ? '<div class="grouplbl">Budget Used</div>' + meter(m.committed, m.budget) : '<p class="small muted">Set a budget for this event in its details to track it here.</p>') +
      secHead('Where It Goes') + listBox(Object.keys(cats).map(function (k) { return row({ title: esc(k), right: '<span class="amt">' + money(cats[k]) + '</span>' }); }), 'No costs yet.') +
      (on('money') && e.giving_link ? '<p class="small muted">The public page shows a Give Online button that opens your giving link.</p>' : '');
  }
  if (st.cur === 'payments') {
    var p = payables(e).sort(function (a, b) { return (b.owed > 0) - (a.owed > 0) || String(a.due || '9').localeCompare(String(b.due || '9')); });
    return h + '<p class="lead">Everything this event owes, with who is responsible for paying it. Tap one to update its status.</p>' +
      secHead('Still Owed', '', money(p.reduce(function (s, x) { return s + x.owed; }, 0))) + listBox(p.filter(function (x) { return x.owed > 0; }).map(payRow), 'Everything is paid.') +
      secHead('Paid In Full') + listBox(p.filter(function (x) { return x.owed <= 0; }).map(payRow), 'Nothing paid yet.');
  }
  if (st.cur === 'offerings') {
    var off = evRows('ed_offerings').sort(function (a, b) { return String(a.on_date || '').localeCompare(String(b.on_date || '')); });
    var nd = off.filter(function (o) { return !o.deposited; }).length;
    return h + '<div class="stats">' + stat('Total Given', money(m.given), true) + stat('Offerings', evRows('ed_offerings').length) + stat('Not Deposited', nd, nd > 0) + '</div>' + secHead('Offerings', addBtn('Record Offering', 'add-offering')) +
      listBox(off.map(function (o) {
        var t = num(o.cash) + num(o.checks) + num(o.online) + num(o.other);
        return row({ act: 'edit-offering', id: o.id, title: esc(o.service || 'Offering') + (o.on_date ? ' <span class="muted small">' + esc(fmtDay(o.on_date)) + '</span>' : ''), sub: 'Cash ' + money(o.cash) + ' · Checks ' + money(o.checks) + ' · Online ' + money(o.online) + (o.counter1 ? '<br>Counted By ' + esc([o.counter1, o.counter2].filter(Boolean).join(' And ')) : ''),
          right: '<span class="amt">' + money(t) + '</span>' + pill(o.deposited ? 'Deposited' : 'Not Deposited', o.deposited ? 'green' : 'amber') });
      }), 'Record each service’s offering after two people count it.');
  }
  var ex = evRows('ed_expenses');
  return h + secHead('Expenses', addBtn('Add Expense', 'add-expense'), money(ex.reduce(function (s, x) { return s + num(x.amount); }, 0))) +
    listBox(ex.map(function (x) { return payRow({ t: 'x', id: x.id, name: x.description, what: x.category || 'Expense', amount: num(x.amount), owed: x.pay_status === 'Paid In Full' ? 0 : num(x.amount), status: x.pay_status, payer: x.payer, due: x.due_on }); }), 'Supplies, permits, water and ice. Vendor and speaker costs are tracked on their own tabs.');
}

/* ---------- follow-up */
function wsFollowup(e) {
  var all = evRows('ed_cards').sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  var c = function (s) { return all.filter(function (x) { return x.status === s; }).length; };
  var st = subTabs('followup', [['new', 'New', c('new')], ['contacted', 'Contacted', c('contacted')], ['connected', 'Connected', c('connected')], ['all', 'All', all.length]], 'new');
  var open = all.filter(function (x) { return x.status !== 'connected'; }), unassigned = open.filter(function (x) { return !x.follow_up_ref && !x.follow_up_by; }).length, late = open.filter(function (x) { return x.follow_up_on && x.follow_up_on < TODAY; }).length;
  var top = all.length ? secHead('Decisions', '', plural(all.length, 'Card')) + decisionTiles(all) + (unassigned || late ? '<div class="err soft">' + esc([unassigned ? plural(unassigned, 'card') + ' with no one assigned' : '', late ? late + ' past their follow-up date' : ''].filter(Boolean).join(' · ')) + '</div>' : '') : '';
  var list = st.cur === 'all' ? all : all.filter(function (x) { return x.status === st.cur; });
  return shareBar('c') + top + st.html + '<div class="btnrow">' + addBtn('Add A Card', 'add-card') + '<button class="btn sm plain" data-a="csv-cards">Download List</button></div>' +
    listBox(list.map(function (x) {
      return row({ act: 'edit-card', id: x.id, lead: avatar(x.name), title: esc(x.name), sub: (x.responses || []).map(function (r) { return '<span class="tag">' + esc(r) + '</span>'; }).join(' ') + (x.prayer ? '<br>Prayer: ' + esc(x.prayer) : '') + '<br>' + (x.follow_up_by ? 'Follow-Up By ' + esc(x.follow_up_by) : '<span class="danger">No One Assigned</span>'),
        right: pill(x.status[0].toUpperCase() + x.status.slice(1), { new: 'red', contacted: 'amber', connected: 'green' }[x.status]) });
    }), st.cur === 'new' ? 'No new cards. You’re caught up.' : 'Nothing here.');
}

/* ---------- share */
function pubUrl(kind) { var base = location.href.split('#')[0].split('?')[0]; return base + (DB.mode === 'demo' && !window.ED_DEMO ? '?demo' : '') + '#/' + kind + '/' + S.ev.slug; }
function qrSvg(text) { try { var q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { return ''; } }
var SHARE = { k: ['Self Check-In', 'Volunteers and guests check themselves in with the phone number they signed up with.', 'Scan To Check In'], v: ['Volunteer Sign-Up', 'People pick a spot to serve or a dish to bring.', 'Scan To Serve Or Bring Food'], r: ['Guest RSVP', 'Guests let you know they’re coming and how many.', 'Scan To RSVP'], c: ['Connection Card', 'Guests fill it out on their phone during the altar call or after service.', 'Scan To Fill Out A Connection Card'] };
function shareBar(k) {
  var url = pubUrl(k);
  return '<div class="sharebar"><button class="sb-qr" data-a="show-qr" data-id="' + k + '" aria-label="Show QR Code">' + qrSvg(url) + '</button><div class="main"><b>' + esc(SHARE[k][0]) + '</b><span>' + (S.ev.is_open ? 'No account needed.' : 'Sign-ups are closed.') + '</span></div>' +
    '<div class="sb-acts"><button class="btn sm plain" data-a="copy" data-v="' + esc(url) + '">Copy</button><button class="btn sm plain" data-a="show-qr" data-id="' + k + '">QR</button></div></div>';
}
/* ---------- share and print */
var DOCS = [
  ['summary', 'Event Summary', 'Dates, place, the team and key phone numbers on one page.', 'always'],
  ['tasks', 'Task List', 'Setup to teardown, by segment or by area. Print all of it or one team’s list, like Food or Stage.', 'tasks'],
  ['schedule', 'Run Of Show', 'The schedule day by day.', 'calendar'],
  ['agenda', 'Agenda', 'Each segment in order, with the time and who leads it.', 'agenda'],
  ['volunteers', 'Volunteer Roster', 'Each spot with who signed up and their phone numbers.', 'volunteers'],
  ['meals', 'Meal Sign-Ups', 'Who is bringing what, by day.', 'food'],
  ['guests', 'Guest List', 'RSVPs by day with party size, and a box for check-in.', 'guests'],
  ['contacts', 'Contact Sheet', 'Team, speakers, worship, vendors and contacts with phone numbers.', 'always'],
  ['equipment', 'Equipment Checklist', 'Items and counts, with Loaded and Returned boxes.', 'equipment'],
  ['payments', 'Payments Owed', 'What is still owed, to whom, who pays and when.', 'money'],
  ['recap', 'Event Recap', 'One page for the board and for next year: attendance, volunteers, decisions, money, tasks, answered prayer and notes.', 'always'],
  ['prayer', 'Prayer Guide', 'Theme, scripture, declarations, what you’re interceding for and what God did. Private needs are left off.', 'prayer']
];
function docOn(d) { return d[3] === 'always' || (d[3] === 'money' ? on('money') || on('vendors') : on(d[3])); }
function sharePage(e) {
  var links = [];
  if (on('volunteers') || on('food')) links.push('v');
  if (on('guests')) links.push('r');
  if (on('followup')) links.push('c');
  if (on('volunteers') || on('guests')) links.push('k');
  return '<div class="share-intro"><h2>Share And Print</h2><p class="small muted">Send a link, show a QR code, or print a sheet. Printing lets you save as a PDF to text or email.</p></div>' +
    (links.length ? secHead('Links And QR Codes') + links.map(shareBar).join('') : '') +
    mailList(e) +
    secHead('Printable Sheets') + '<div class="list">' + DOCS.filter(docOn).map(function (d) {
      return row({ act: 'doc', id: d[0], lead: '<span class="docic">' + IC.list + '</span>', title: esc(d[1]), sub: esc(d[2]) });
    }).join('') + '</div>' +
    (e.is_open ? '' : '<div class="err" style="margin-top:12px">Sign-ups and RSVPs are closed for this event. Open them again in the event details.</div>');
}
function teamLabel(k) { return (TEAMS.find(function (x) { return x[0] === k; }) || [, k])[1]; }
function docBuild(k) {
  var e = S.ev, o = org() || {}, H = [], T2 = [], title = (DOCS.find(function (d) { return d[0] === k; }) || [, 'Sheet'])[1];
  var dayLbl = function (d) { return d ? fmtLong(d) : 'Any Day'; };
  var box = '<span class="pbox"></span>';
  function table(cols, rows) { return '<table><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; }
  function h2(t) { H.push('<h2>' + esc(t) + '</h2>'); T2.push('', t.toUpperCase()); }
  function none(t) { H.push('<p class="none">' + esc(t) + '</p>'); T2.push(t); }
  if (k === 'summary') {
    H.push('<dl>' + [['When', [fmtRange(e.starts_on, e.ends_on), e.time_label].filter(Boolean).join(' · ')], ['Where', [e.place, e.address].filter(Boolean).join(', ')], ['Contact', e.contact_line]].filter(function (x) { return x[1]; }).map(function (x) { T2.push(x[0] + ': ' + x[1]); return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>');
    if (e.about) { H.push('<p>' + esc(e.about) + '</p>'); T2.push('', e.about); }
    var lead = evRows('ed_event_people').filter(function (a) { return a.team !== 'volunteer'; }).map(function (a) { return { a: a, p: byId('ed_people', a.person_id) || { name: '' } }; }).sort(function (x, y) { return TEAMS.findIndex(function (t) { return t[0] === x.a.team; }) - TEAMS.findIndex(function (t) { return t[0] === y.a.team; }) || x.p.name.localeCompare(y.p.name); });
    if (lead.length) { h2('Team'); H.push(table(['Name', 'Team', 'Role', 'Phone'], lead.map(function (x) { T2.push(x.p.name + ' · ' + teamLabel(x.a.team) + (x.p.phone ? ' · ' + x.p.phone : '')); return [esc(x.p.name), esc(teamLabel(x.a.team)), esc(x.a.role || x.p.title || ''), esc(x.p.phone || '')]; }))); }
    var stats = [];
    if (on('volunteers') && num(e.volunteer_goal)) stats.push(['Volunteers', volCount() + ' of ' + num(e.volunteer_goal)]);
    if (on('guests') && fill('attend').need) stats.push(['RSVPs', fill('attend').have + ' coming']);
    if (on('tasks')) { var ts = evRows('ed_tasks'); stats.push(['Tasks', ts.filter(function (t) { return t.done; }).length + ' of ' + ts.length + ' done']); }
    if (stats.length) { h2('Status'); H.push('<dl>' + stats.map(function (s) { T2.push(s[0] + ': ' + s[1]); return '<dt>' + s[0] + '</dt><dd>' + esc(s[1]) + '</dd>'; }).join('') + '</dl>'); }
  }
  if (k === 'tasks') {
    var tby = S.sub.taskby === 'area' ? 'area' : 'phase', tg = taskGroups(tby, S.taskArea), all = tg.all;
    if (S.taskArea) title += ' · ' + (S.taskArea === '-' ? 'No Area' : S.taskArea);
    tg.groups.forEach(function (gr) {
      var list = gr[1]; h2(gr[0]);
      var mid = tby === 'area' || !S.taskArea, cols = ['', 'Task'].concat(mid ? [tby === 'area' ? 'When' : 'Area'] : [], ['Who', 'Due']);
      H.push(table(cols, list.map(function (t) { T2.push((t.done ? '[x] ' : '[ ] ') + t.title + (tby !== 'area' && t.area ? ' · ' + t.area : '') + (t.owner ? ' · ' + t.owner : '') + (t.due_on ? ' · ' + fmtDay(t.due_on) : '')); return [t.done ? '<span class="pbox on">✓</span>' : box, '<span class="' + (t.done ? 'done' : '') + '">' + esc(t.title) + '</span>' + (t.notes ? '<div class="sm">' + esc(t.notes) + '</div>' : ''), ].concat(mid ? [esc(tby === 'area' ? phaseLbl(phaseOf(t)) : t.area || '')] : [], [esc(t.owner || ''), esc([t.due_on ? fmtDay(t.due_on) : '', t.due_time].filter(Boolean).join(' '))]); })));
    });
    if (!all.length) none(S.taskArea ? 'No tasks in this area.' : 'No tasks yet.');
  }
  if (k === 'schedule') {
    var sch = evRows('ed_schedule').sort(function (x, y) { return String(x.on_date || '').localeCompare(String(y.on_date || '')) || String(x.start_time || '').localeCompare(String(y.start_time || '')); }), day = null, rows = [];
    sch.forEach(function (s) { if (s.on_date !== day) { if (rows.length) H.push(table(['Time', 'What', 'Where', 'Who'], rows)); rows = []; day = s.on_date; h2(dayLbl(day)); } T2.push([fmtTime(s.start_time), s.title, s.location, s.owner].filter(Boolean).join(' · ')); rows.push([esc([fmtTime(s.start_time), s.end_time ? '– ' + fmtTime(s.end_time) : ''].filter(Boolean).join(' ')), esc(s.title) + (s.notes ? '<div class="sm">' + esc(s.notes) + '</div>' : ''), esc(s.location || ''), esc(s.owner || '')]); });
    if (rows.length) H.push(table(['Time', 'What', 'Where', 'Who'], rows));
    if (!sch.length) none('Nothing on the schedule yet.');
  }
  if (k === 'volunteers' || k === 'meals' || k === 'guests') {
    var kind = { volunteers: 'serve', meals: 'meal', guests: 'attend' }[k], its = evRows('ed_items').filter(function (i) { return i.kind === kind; }).sort(function (x, y) { return String(x.on_date || '').localeCompare(String(y.on_date || '')) || x.sort - y.sort; });
    if (k === 'volunteers' && assigned('volunteer').length) { h2('Volunteer Team'); H.push(table(['Name', 'Role', 'Phone'], assigned('volunteer').map(function (x) { T2.push(x.p.name + (x.p.phone ? ' · ' + x.p.phone : '')); return [esc(x.p.name), esc(x.a.role || x.p.title || ''), esc(x.p.phone || '')]; }))); }
    its.forEach(function (i) {
      var su = signups(i.id).slice().sort(function (x, y) { return x.name.localeCompare(y.name); });
      h2(i.title + ' · ' + dayLbl(i.on_date) + (i.time_label ? ' · ' + i.time_label : '') + ' · ' + (kind === 'attend' ? taken(i) + ' coming' : su.length + ' of ' + i.needed));
      if (!su.length) { none('No one yet.'); return; }
      H.push(table(kind === 'attend' ? ['', 'Name', 'Party', 'Phone'] : kind === 'meal' ? ['Name', 'Bringing', 'Phone'] : ['', 'Name', 'Phone', 'Note'], su.map(function (s) {
        T2.push(s.name + (kind === 'attend' ? ' (' + (s.party || 1) + ')' : '') + (kind === 'meal' && s.note ? ' · ' + s.note : '') + (s.phone ? ' · ' + s.phone : ''));
        return kind === 'attend' ? [s.checked_in_at ? '<span class="pbox on">✓</span>' : box, esc(s.name), String(s.party || 1), esc(s.phone || '')] : kind === 'meal' ? [esc(s.name), esc(s.note || ''), esc(s.phone || '')] : [s.checked_in_at ? '<span class="pbox on">✓</span>' : box, esc(s.name), esc(s.phone || ''), esc(s.note || '')];
      })));
    });
    if (!its.length && !(k === 'volunteers' && assigned('volunteer').length)) none('Nothing to list yet.');
  }
  if (k === 'contacts') {
    var groups = [];
    TEAMS.filter(function (t) { return t[0] !== 'volunteer'; }).forEach(function (t) { var l = assigned(t[0]); if (l.length) groups.push([t[1], l.map(function (x) { return [x.p.name, x.a.role || x.p.title || '', x.p.phone || '', x.p.email || '']; })]); });
    var vs = evRows('ed_event_vendors').map(function (a) { var v = byId('ed_vendors', a.vendor_id) || {}; return [v.name || '', [a.service, v.contact_name].filter(Boolean).join(' · '), v.phone || '', v.email || '']; });
    if (vs.length) groups.push(['Vendors', vs]);
    var cs = evRows('ed_event_contacts').map(function (a) { var c = byId('ed_contacts', a.contact_id) || {}; return [c.name || '', [c.role, c.organization].filter(Boolean).join(' · '), c.phone || '', c.email || '']; });
    if (cs.length) groups.push(['Contacts', cs]);
    groups.forEach(function (g) { h2(g[0]); H.push(table(['Name', 'Role', 'Phone', 'Email'], g[1].map(function (r) { T2.push(r.filter(Boolean).join(' · ')); return r.map(esc); }))); });
    if (!groups.length) none('No one is on this event yet.');
  }
  if (k === 'equipment') {
    var eq = evRows('ed_event_equipment').map(function (a) { return { a: a, g: byId('ed_equipment', a.equipment_id) || { name: '' } }; }).sort(function (x, y) { return String(x.g.category || '').localeCompare(String(y.g.category || '')) || x.g.name.localeCompare(y.g.name); });
    if (eq.length) H.push(table(['Loaded', 'Returned', 'Item', 'Qty', 'Stored At'], eq.map(function (x) { T2.push((x.a.loaded ? '[x] ' : '[ ] ') + x.g.name + ' × ' + num(x.a.quantity)); return [x.a.loaded ? '<span class="pbox on">✓</span>' : box, x.a.returned ? '<span class="pbox on">✓</span>' : box, esc(x.g.name) + (x.g.condition && x.g.condition !== 'Good' ? ' <b>(' + esc(x.g.condition) + ')</b>' : ''), String(num(x.a.quantity)), esc(x.g.location || '')]; })));
    else none('No equipment on this event yet.');
  }
  if (k === 'payments') {
    var ps = payables(e).filter(function (p) { return p.owed > 0; }).sort(function (x, y) { return String(x.due || '9').localeCompare(String(y.due || '9')); });
    if (ps.length) { H.push(table(['To', 'For', 'Owed', 'Who Pays', 'Due'], ps.map(function (p) { T2.push(p.name + ' · ' + money(p.owed) + (p.payer ? ' · ' + p.payer : '') + (p.due ? ' · due ' + fmtDay(p.due) : '')); return [esc(p.name || ''), esc(p.what || ''), money(p.owed), esc(p.payer || ''), p.due ? esc(fmtDay(p.due)) : '']; }))); H.push('<p class="total">Total owed: ' + money(ps.reduce(function (s, p) { return s + p.owed; }, 0)) + '</p>'); }
    else none('Nothing is owed right now.');
  }
  if (k === 'recap') {
    var dl = function (pairs) { pairs = pairs.filter(function (p) { return p[1] !== '' && p[1] != null && p[1] !== 0 && p[1] !== '0'; }); if (!pairs.length) { if (/^<h2>/.test(H[H.length - 1])) { H.pop(); T2.splice(-2); } return; } H.push('<dl>' + pairs.map(function (p) { T2.push(p[0] + ': ' + p[1]); return '<dt>' + esc(p[0]) + '</dt><dd>' + esc(String(p[1])) + '</dd>'; }).join('') + '</dl>'); };
    if (e.theme) { H.push('<p><b>' + esc(e.theme) + '</b></p>'); T2.push('', e.theme); }
    var att = evRows('ed_items').filter(function (i) { return i.kind === 'attend'; }), rs = [].concat.apply([], att.map(function (i) { return signups(i.id); }));
    var srv = evRows('ed_items').filter(function (i) { return i.kind === 'serve'; }), vs = [].concat.apply([], srv.map(function (i) { return signups(i.id); }));
    if (on('guests') || on('volunteers')) { h2('People'); dl([
      on('guests') && rs.length ? ['RSVPs', rs.reduce(function (s, x) { return s + (x.party || 1); }, 0) + ' people (' + plural(rs.length, 'RSVP') + ')'] : ['', ''],
      on('guests') ? ['Guests Checked In', rs.filter(function (x) { return x.checked_in_at; }).reduce(function (s, x) { return s + (x.party || 1); }, 0)] : ['', ''],
      on('volunteers') ? ['Volunteers', volCount() + (num(e.volunteer_goal) ? ' of a goal of ' + num(e.volunteer_goal) : '')] : ['', ''],
      on('volunteers') && vs.length ? ['Volunteers Checked In', vs.filter(function (x) { return x.checked_in_at; }).length + ' of ' + vs.length + ' who signed up'] : ['', ''],
      ['Team', evRows('ed_event_people').filter(function (x) { return x.team !== 'volunteer'; }).length]]); }
    var cards = evRows('ed_cards');
    if (on('followup')) { h2('Connection Cards'); dl([['Cards', cards.length]].concat(DECISIONS.map(function (d) { var n = cards.filter(function (c) { return (c.responses || []).indexOf(d[0]) >= 0; }).length; return [d[1], n || '']; }), [['Followed Up', cards.filter(function (c) { return c.status !== 'new'; }).length + ' of ' + cards.length]])); }
    if (on('money') || on('vendors')) { var mm = eventMoney(e); h2('Money'); dl([['Budget', mm.budget ? money(mm.budget) : ''], ['Committed', money(mm.committed)], ['Paid', money(mm.paid)], ['Still Owed', mm.owed ? money(mm.owed) : ''], ['Given', mm.given ? money(mm.given) : '']]); }
    var tks = evRows('ed_tasks'); if (tks.length) { h2('Tasks'); dl([['Done', tks.filter(function (t) { return t.done; }).length + ' of ' + tks.length], ['Still Open', tks.filter(function (t) { return !t.done; }).map(function (t) { return t.title; }).slice(0, 8).join(', ')]]); }
    var ans = evRows('ed_prayer').filter(function (p) { return p.kind === 'intercede' && p.answer && !p.private; });
    if (ans.length) { h2('What God Did'); H.push('<ul>' + ans.map(function (p) { var w = prayFor(p); T2.push('• ' + (w ? w.name + ': ' : '') + p.title + ': ' + p.answer); return '<li><b>' + esc((w ? w.name + ': ' : '') + p.title) + '</b><br>' + esc(p.answer) + '</li>'; }).join('') + '</ul>'); }
    if (e.debrief) { h2('Notes For Next Year'); H.push('<p>' + esc(e.debrief) + '</p>'); T2.push(e.debrief); }
  }
  if (k === 'agenda') {
    var ag = evRows('ed_agenda').sort(function (x, y) { return x.sort - y.sort; });
    if (ag.length) H.push(table(['#', 'Time', 'Segment', 'Led By', 'Min'], ag.map(function (x, i) { var w = refContact(x.leader_ref), nm = w ? w.name : x.leader || ''; T2.push((i + 1) + '. ' + [x.start_time ? fmtTime(x.start_time) : '', x.title, nm, x.minutes ? x.minutes + ' min' : ''].filter(Boolean).join(' · ')); return [String(i + 1), esc(x.start_time ? fmtTime(x.start_time) : ''), esc(x.title) + (x.notes ? '<br><small>' + esc(x.notes) + '</small>' : ''), esc(nm), x.minutes ? String(x.minutes) : '']; })));
    else none('No segments yet.');
  }
  if (k === 'prayer') {
    if (e.theme || e.purpose) { H.push('<div class="ptheme">' + (e.theme ? '<b>' + esc(e.theme) + '</b>' : '') + (e.purpose ? '<p>' + esc(e.purpose) + '</p>' : '') + '</div>'); T2.push('', e.theme || '', e.purpose || ''); }
    var pv = prayers('verse'), pd = prayers('declare'), pi = prayers('intercede').filter(function (p) { return !p.private; });
    var lineFor = function (p) { var w = prayFor(p); return (w ? w.name + ': ' : '') + p.title; };
    if (pv.length) { h2('Scripture'); pv.forEach(function (p) { H.push('<blockquote>' + (p.body ? '<p>' + esc(p.body) + '</p>' : '') + '<cite>' + esc(p.title) + '</cite></blockquote>'); T2.push((p.body ? '“' + p.body + '” ' : '') + p.title); }); }
    if (pd.length) { h2('We Declare'); H.push('<ol>' + pd.map(function (p, i) { T2.push((i + 1) + '. ' + p.title); return '<li>' + esc(p.title) + '</li>'; }).join('') + '</ol>'); }
    var po = pi.filter(function (p) { return !p.answer; }), pa = pi.filter(function (p) { return p.answer; });
    if (po.length) { h2('Interceding For'); H.push('<ul>' + po.map(function (p) { T2.push('• ' + lineFor(p) + (p.body ? ' (' + p.body + ')' : '')); return '<li><b>' + esc(lineFor(p)) + '</b>' + (p.body ? '<br>' + esc(p.body) : '') + '</li>'; }).join('') + '</ul>'); }
    if (pa.length) { h2('What God Did'); H.push('<ul>' + pa.map(function (p) { T2.push('• ' + lineFor(p) + ': ' + p.answer); return '<li><b>' + esc(lineFor(p)) + '</b><br>' + esc(p.answer) + '</li>'; }).join('') + '</ul>'); }
    if (!pv.length && !pd.length && !pi.length && !e.theme && !e.purpose) none('Nothing added yet.');
  }
  var headHtml = '<header class="phead">' + (o.logo ? '<img src="' + esc(o.logo) + '" alt="">' : '') + '<div><div class="pmin">' + esc(o.name || '') + '</div><h1>' + esc(e.title) + '</h1><div class="pmeta">' + esc(title + ' · ' + [fmtRange(e.starts_on, e.ends_on), e.place].filter(Boolean).join(' · ')) + '</div></div></header>';
  var text = [e.title + ' · ' + title, [fmtRange(e.starts_on, e.ends_on), e.time_label, e.place].filter(Boolean).join(' · ')].concat(T2).join('\n');
  return { title: title, html: '<div class="printdoc">' + headHtml + H.join('') + '<footer>Printed ' + esc(fmtLong(TODAY)) + ' · Tent &amp; Table</footer></div>', text: text };
}
function openDoc(k) {
  var d = docBuild(k);
  openSheet(function () {
    var opts = k === 'tasks' && evRows('ed_tasks').length ? '<div class="docopts">' + tabs([['phase', 'By Segment'], ['area', 'By Area']], S.sub.taskby === 'area' ? 'area' : 'phase', 'doc-by', 'subtabs mini') + areaSelect('dk_area', 'doc-area', S.taskArea) + '</div>' : '';
    d = docBuild(k);
    return '<h3>' + esc(d.title) + '</h3>' + opts + '<div class="docprev">' + d.html + '</div>' +
      shareTools('doc', k) + '<div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Done</button></div>';
  });
}
function printHtml(html) { var d = document.createElement('div'); d.className = 'printonly'; d.innerHTML = html; document.body.appendChild(d); window.print(); setTimeout(function () { d.remove(); }, 800); }
function showQr(k) {
  var url = pubUrl(k);
  openSheet(function () {
    return '<h3>' + esc(SHARE[k][0]) + '</h3><p class="lead">' + esc(SHARE[k][1]) + ' Text the link, post it, or print the QR code for the tent and tables.</p><div class="qrbig-sheet">' + qrSvg(url) + '</div><div class="urlbox">' + esc(url) + '</div>' +
      shareTools('qr', k, '<button class="btn sm plain" data-a="copy" data-v="' + esc(url) + '">Copy Link</button><button class="btn sm plain" data-a="open-pub" data-id="' + k + '">Open Page</button>') + '<div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Done</button></div>';
  });
}
/* ================================================================ pickers */
function pick(t, team) {
  var cfg = {
    ed_people: { title: 'Add ' + (TEAMS.find(function (x) { return x[0] === team; }) || [, 'People'])[1], list: T('ed_people').filter(function (p) { return p.status === 'current'; }), has: function (r) { return evRows('ed_event_people').some(function (a) { return a.person_id === r.id && a.team === team; }); }, sub: function (r) { return [r.title, (r.groups || []).join(', ')].filter(Boolean).join(' · '); }, newLabel: 'New Contact' },
    ed_vendors: { title: 'Add Vendor', list: T('ed_vendors'), has: function (r) { return evRows('ed_event_vendors').some(function (a) { return a.vendor_id === r.id; }); }, sub: function (r) { return [r.category, r.contact_name].filter(Boolean).join(' · '); }, newLabel: 'New Vendor' },
    ed_contacts: { title: 'Add Contact', list: T('ed_contacts'), has: function (r) { return evRows('ed_event_contacts').some(function (a) { return a.contact_id === r.id; }); }, sub: function (r) { return [r.role, r.organization].filter(Boolean).join(' · '); }, newLabel: 'New Contact' },
    ed_equipment: { title: 'Add Equipment', list: T('ed_equipment').filter(function (g) { return g.condition !== 'Retired'; }), has: function (r) { return evRows('ed_event_equipment').some(function (a) { return a.equipment_id === r.id; }); }, sub: function (r) { return [r.category, 'Own ' + num(r.quantity), r.condition !== 'Good' ? r.condition : ''].filter(Boolean).join(' · '); }, newLabel: 'New Item' }
  }[t];
  var groupHint = { leader: 'Team Member', team: 'Prayer Team', speaker: 'Speaker', worship: 'Worship', volunteer: 'Volunteer' }[team];
  var list = cfg.list.slice().sort(function (a, b) {
    var ga = t === 'ed_people' && (a.groups || []).indexOf(groupHint) >= 0 ? 0 : 1, gb = t === 'ed_people' && (b.groups || []).indexOf(groupHint) >= 0 ? 0 : 1;
    return (cfg.has(a) ? 1 : 0) - (cfg.has(b) ? 1 : 0) || ga - gb || a.name.localeCompare(b.name);
  });
  openSheet(function () {
    return '<h3>' + esc(cfg.title) + '</h3><p class="lead">' + (t === 'ed_equipment' ? 'From your equipment in the Directory.' : 'From your contacts. ' + (t === 'ed_people' ? esc(groupHint) + ' contacts are listed first.' : '')) + '</p>' +
      '<label class="search block">' + IC.search + '<input type="search" placeholder="Search" data-input="pick-q" aria-label="Search" autofocus></label>' +
      (t === 'ed_people' ? '<div class="fgrid pick-only"><div class="fld"><label for="pk_role">Role At This Event</label><input class="inp" id="pk_role" list="pk_roles" placeholder="Optional"><datalist id="pk_roles">' + TITLES.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist></div></div>' : '') +
      '<div class="picklist">' + list.map(function (r) {
        var has = cfg.has(r);
        return '<label class="pickrow' + (has ? ' has' : '') + '" data-name="' + esc((r.name + ' ' + cfg.sub(r)).toLowerCase()) + '"><input type="checkbox" value="' + r.id + '"' + (has ? ' disabled checked' : '') + '>' + (t !== 'ed_equipment' ? avatar(r.name) : '') + '<span class="main"><span class="t">' + esc(r.name) + '</span><span class="s">' + esc(has ? 'Already Added' : cfg.sub(r)) + '</span></span></label>';
      }).join('') + (list.length ? '' : '<p class="muted small">Nothing here yet. Add one below.</p>') + '</div>' +
      '<div class="acts pickfoot"><button class="btn ghost pf-new" data-a="pick-new" data-t="' + t + '" data-id="' + esc(team || '') + '">' + IC.plus + ' ' + esc(cfg.newLabel) + '</button><button class="btn plain pf-clear" data-a="pick-clear">Clear</button><span class="grow"></span><button class="btn plain" data-a="close">Cancel</button><button class="btn pf-add" data-save data-a="sheet-save">Add</button></div>';
  }, function () {
    var root = $('#layer .sheet'), ids = $$('.picklist input:checked:not(:disabled)', root).map(function (x) { return x.value; });
    if (!ids.length) { sheetErr('Pick at least one.'); return; }
    var role = (root.querySelector('#pk_role') || {}).value || '';
    return busy(Promise.all(ids.map(function (id) { return DB.save(assignTable(t), assignRow(t, id, team, role)); })), 'Added To This Event').then(function (rows) {
      rows.forEach(function (r) { put(assignTable(t), r); }); closeSheet(); render();
    }).catch(function () {});
  });
}
function assignTable(t) { return { ed_people: 'ed_event_people', ed_vendors: 'ed_event_vendors', ed_contacts: 'ed_event_contacts', ed_equipment: 'ed_event_equipment' }[t]; }
function assignRow(t, id, team, role) {
  var e = S.ev.id;
  if (t === 'ed_people') { var p = byId('ed_people', id) || {}; return { event_id: e, person_id: id, team: team, role: role || (team === 'speaker' ? (p.title || 'Speaker') : p.title || ''), days: '', details: team === 'speaker' ? { status: 'Invited' } : {}, amount: 0, pay_status: 'Not Paid', payer: '', due_on: null, notes: '' }; }
  if (t === 'ed_vendors') return { event_id: e, vendor_id: id, service: '', status: 'Quoted', arrival: '', cost: 0, paid: 0, pay_status: 'Not Paid', payer: '', due_on: null, notes: '' };
  if (t === 'ed_contacts') { var c = byId('ed_contacts', id) || {}; return { event_id: e, contact_id: id, role: c.role || '', notes: '' }; }
  return { event_id: e, equipment_id: id, quantity: 1, loaded: false, returned: false, notes: '' };
}
function assignTop(dirTable, id) {
  return function () {
    var r = byId(dirTable, id) || {};
    return '<div class="sheethead">' + (dirTable !== 'ed_equipment' ? avatar(r.name) : '') + '<div><b>' + esc(r.name) + '</b><div class="small muted">' + esc(r.title || r.category || r.role || '') + '</div></div><button class="link" data-a="dir-edit" data-t="' + dirTable + '" data-id="' + id + '">Edit In Directory</button></div>' + actions(r);
  };
}
function editAssign(t, a) {
  var cfg = {
    ed_event_people: [F_ASSIGN.person(a.team), 'ed_people', a.person_id, 'Remove from this event?'],
    ed_event_vendors: [F_ASSIGN.vendor, 'ed_vendors', a.vendor_id, 'Remove this vendor from the event?'],
    ed_event_contacts: [F_ASSIGN.contact, 'ed_contacts', a.contact_id, 'Remove this contact from the event?'],
    ed_event_equipment: [F_ASSIGN.equipment, 'ed_equipment', a.equipment_id, 'Take this off the equipment list?']
  }[t];
  var src = byId(cfg[1], cfg[2]) || {}, team = t === 'ed_event_people' ? (TEAMS.find(function (x) { return x[0] === a.team; }) || [, 'Team'])[1] : '';
  editRow(t, a, cfg[0], { title: { ed_event_people: team, ed_event_vendors: 'Vendor For This Event', ed_event_contacts: 'Contact For This Event', ed_event_equipment: 'Equipment For This Event' }[t] || 'This Event', top: assignTop(cfg[1], cfg[2]), required: cfg[0][0].k, view: t !== 'ed_event_equipment', delMsg: cfg[3], prep: function (v) {
    if (t === 'ed_event_vendors' && v.pay_status === 'Paid In Full') v.paid = v.cost;
    if (t === 'ed_event_equipment') { v.quantity = Math.max(1, v.quantity || 1); }
    return v;
  } });
  // the team of a person can change; the required check uses the first field
}

/* ================================================================ public pages */
function loadPublic() {
  S.pubErr = '';
  return DB.rpc('ed_public', { p_slug: S.pubSlug }).then(function (p) {
    S.pub = p; if (!p) { S.pubErr = 'This event link isn’t working. Check with the person who sent it.'; render(); return; }
    var toks = []; try { toks = JSON.parse(lget('ed.tok.' + S.pubSlug) || '[]'); } catch (e) {}
    return (toks.length ? DB.rpc('ed_mine', { p_tokens: toks }) : Promise.resolve([])).then(function (m) { S.mine = m || []; lset('ed.tok.' + S.pubSlug, JSON.stringify(S.mine.map(function (x) { return x.token; }))); render(); });
  }).catch(function (e) { S.pubErr = errMsg(e); render(); });
}
function pubOn(k) { return secOn(S.pub.event.sections, k); }
function calUrl(e) {
  if (!e.starts_on) return '';
  var d = function (s) { return String(s).replace(/-/g, ''); };
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(e.title) + '&dates=' + d(e.starts_on) + '/' + d(addDays(e.ends_on || e.starts_on, 1)) +
    '&details=' + encodeURIComponent([e.time_label, e.about].filter(Boolean).join('\n\n')) + '&location=' + encodeURIComponent([e.place, e.address].filter(Boolean).join(', '));
}
function pubHero(extra) {
  var e = S.pub.event;
  return '<div class="phero"><div class="in"><div class="eyebrow">' + (e.logo ? '<img class="plogo" src="' + esc(e.logo) + '" alt="">' : '') + esc(e.ministry || 'You’re Invited') + '</div><h1>' + esc(e.title) + '</h1><div class="meta">' +
    esc([fmtRange(e.starts_on, e.ends_on), e.time_label].filter(Boolean).join(' · ')) + (e.place || e.address ? '<br>' + esc([e.place, e.address].filter(Boolean).join(', ')) : '') + '</div>' + ((e.sessions || []).length ? sessList(e.sessions) : '') + (extra || '') + '</div></div>';
}
function pubGoal(e) {
  var g = num(e.volunteer_goal), n = Math.min(g, num(e.volunteer_count)), pct = Math.round(100 * n / g);
  return '<div class="card pgoal"><div class="g-top"><div><div class="g-k">Volunteers</div><div class="g-v"><b>' + n + '</b> of ' + g + ' signed up</div></div><div class="g-side">' + (g - n > 0 ? 'We need <b>' + (g - n) + '</b> more' : 'Thank you!') + '</div></div><div class="cd-bar"><i style="width:' + pct + '%"></i></div></div>';
}
function backLink() { return S.user || window.ED_DEMO ? '<p class="center"><a href="#" data-a="leave-pub" class="small">Back To Tent &amp; Table</a></p>' : ''; }
function viewPublic() {
  if (S.pubErr) return '<main class="auth"><div class="logo">' + IC.tent + '</div><h1>Not Found</h1><p class="lead">' + esc(S.pubErr) + '</p>' + backLink() + '</main>';
  if (!S.pub) return '<main class="auth"><p class="muted">Loading…</p></main>';
  var e = S.pub.event, its = S.pub.items.filter(function (i) { var md = S.pubMode; if (md === 'v' && i.kind === 'attend') return false; if (md === 'r' && i.kind !== 'attend') return false; return pubOn(i.kind === 'meal' ? 'food' : i.kind === 'attend' ? 'guests' : 'volunteers'); }), mineIds = S.mine.map(function (m) { return m.item_id; });
  function section(kind, title, lead) {
    var list = its.filter(function (i) { return i.kind === kind; }); if (!list.length) return '';
    var html = '', day = null;
    list.forEach(function (i) {
      if ((i.on_date || '') !== day) { day = i.on_date || ''; html += '<div class="grouplbl">' + esc(day ? fmtLong(day) : 'Any Day') + '</div>'; }
      var tk = i.taken != null ? i.taken : i.names.length, left = i.needed - tk, mine = mineIds.indexOf(i.id) >= 0, att = kind === 'attend';
      html += '<div class="slot' + (left <= 0 && !mine ? ' full' : '') + '"><div class="main"><div class="t">' + esc(i.title) + '</div><div class="s">' + esc([i.time_label, att && num(i.fee) > 0 ? money(num(i.fee)) + ' per person' : '', pubCheckNote(i), i.notes].filter(Boolean).join(' · ')) + (i.time_label || i.notes || i.needs_check || (att && num(i.fee) > 0) ? '<br>' : '') +
        (att ? (left > 0 ? (left <= 25 ? '<b class="red">' + plural(left, 'Seat') + ' Left</b>' : 'Seats available') : 'Full') : (left > 0 ? '<b class="red">' + plural(left, 'Spot') + ' Left</b>' : 'Full') + (i.names.length ? ' · ' + esc(i.names.join(', ')) : '')) + '</div></div>' +
        (mine ? pill(att ? 'You’re Coming' : 'You’re In', 'green') : left > 0 && e.is_open ? '<button class="btn sm" data-a="pub-sign" data-id="' + i.id + '">' + (att ? 'RSVP' : 'Sign Up') + '</button>' : '') + '</div>';
    });
    return secHead(title) + '<p class="lead small">' + esc(lead) + '</p>' + html;
  }
  var mine = S.mine.length ? '<div class="card mine"><b>You’re Signed Up For</b>' + S.mine.map(function (m) {
    var i = S.pub.items.find(function (x) { return x.id === m.item_id; }) || {};
    return '<div class="mine-row"><span>' + esc(i.title || 'A Spot') + (i.on_date ? ' <span class="muted small">' + esc(fmtDay(i.on_date)) + '</span>' : '') + '</span><button class="link" data-a="pub-unsign" data-id="' + esc(m.token) + '">Cancel</button></div>';
  }).join('') + '</div>' : '';
  return '<main class="pub">' + pubHero((e.about ? '<p class="about">' + esc(e.about) + '</p>' : '') + (e.contact_line ? '<p class="small muted">' + esc(e.contact_line) + '</p>' : '') +
      '<div class="btnrow">' + (e.giving_link && pubOn('money') ? '<a class="btn" href="' + esc(webUrl(e.giving_link)) + '" target="_blank" rel="noopener">Give Online</a>' : '') + (pubOn('followup') ? '<button class="btn ghost" data-a="pub-go" data-id="c">Connection Card</button>' : '') + (e.address ? '<a class="btn ghost" href="' + esc(mapUrl(e.address)) + '" target="_blank" rel="noopener">Directions</a>' : '') + (calUrl(e) ? '<a class="btn ghost" href="' + esc(calUrl(e)) + '" target="_blank" rel="noopener">Add To Calendar</a>' : '') + '</div>') +
    mine + (e.is_open ? '' : '<div class="err">Sign-ups for this event are closed.</div>') +
    (S.pubMode !== 'r' && e.volunteer_goal && pubOn('volunteers') ? pubGoal(e) : '') + section('attend', 'Attend', 'Let us know you’re coming so we can save you a seat.') + section('serve', 'Serve', 'Pick a spot. The team will reach out with details.') + section('meal', 'Bring Food', 'Sign up to bring a meal or dish for the team.') +
    (!its.length ? '<div class="empty card">Nothing to sign up for yet. Check back soon.</div>' : '') + backLink() + '</main>';
}
function pubCheckNote(i) { return i.needs_check ? 'Background check required' : ''; }
function viewSelfCheckin() {
  if (S.pubErr) return viewPublic();
  if (!S.pub) return '<main class="auth"><p class="muted">Loading…</p></main>';
  var done = S.ciDone;
  if (done) return '<main class="pub">' + pubHero() + '<div class="card thanks"><span class="okmark">' + IC.check + '</span><h2>You’re Checked In</h2><p class="lead">' + esc(done.map(function (d) { return d.name + ' · ' + d.title; }).join('\n')) + '</p><p class="small muted">Thank you for being here.</p><button class="btn ghost" data-a="ci-again">Check In Someone Else</button></div>' + backLink() + '</main>';
  return '<main class="pub">' + pubHero('<p class="lead">Welcome! Check yourself in with the phone number you used to sign up or RSVP.</p>') +
    '<form data-form="selfci" class="fgrid"><div class="fld"><label for="ci_phone">Your Phone Number</label><input class="inp" id="ci_phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="(555) 555-0123"></div>' +
    '<div class="fld"><button class="btn block' + (S.busy ? ' saving' : '') + '" type="submit"' + (S.busy ? ' disabled' : '') + '>Check Me In</button></div></form>' +
    (S.cardErr ? '<div class="err">' + esc(S.cardErr) + '</div>' : '') + backLink() + '</main>';
}
function viewCard() {
  if (S.pubErr) return viewPublic();
  if (!S.pub) return '<main class="auth"><p class="muted">Loading…</p></main>';
  var e = S.pub.event;
  if (S.cardDone) return '<main class="pub">' + pubHero() + '<div class="card thanks"><span class="okmark">' + IC.check + '</span><h2>Thank You!</h2><p class="lead">Someone from our team will reach out soon. We’re glad you came.</p><button class="btn ghost sm" data-a="card-again">Fill Out Another Card</button></div>' + backLink() + '</main>';
  return '<main class="pub">' + pubHero('<p class="lead">We’re so glad you’re here. Fill this out and someone will follow up with you.</p>') +
    '<form data-form="card" class="fgrid">' +
    '<div class="fld"><label for="c_name">Your Name</label><input class="inp" id="c_name" name="name" autocomplete="name" required></div>' +
    '<div class="fld half"><label for="c_phone">Phone</label><input class="inp" id="c_phone" name="phone" type="tel" autocomplete="tel"></div>' +
    '<div class="fld half"><label for="c_email">Email</label><input class="inp" id="c_email" name="email" type="email" autocomplete="email"></div>' +
    '<fieldset class="fld"><legend>Today…</legend><div class="multi one">' + RESPONSES.map(function (r, i) { return '<label class="cbx"><input type="checkbox" id="c_r' + i + '" name="r" value="' + esc(r) + '"><span>' + esc(r) + '</span></label>'; }).join('') + '</div></fieldset>' +
    '<div class="fld"><label for="c_pr">How Can We Pray For You?</label><textarea class="inp" id="c_pr" name="prayer"></textarea></div>' +
    '<div class="fld"><button class="btn block' + (S.busy ? ' saving' : '') + '" type="submit"' + (S.busy ? ' disabled' : '') + '>Send My Card</button></div></form>' +
    (S.cardErr ? '<div class="err">' + esc(S.cardErr) + '</div>' : '') +
    (pubOn('volunteers') || pubOn('food') ? '<p><a href="#" data-a="pub-go" data-id="v" class="small">Want to serve or bring food? Sign up here.</a></p>' : '') + backLink() + '</main>';
}

/* ================================================================ event actions */
function editEvent(ev) {
  var base = ev ? Object.assign({}, ev, { sections: SECTIONS.map(function (s) { return s[0]; }).filter(function (k) { return secOn(ev.sections, k); }) }) : { is_open: true, sections: PRESETS.big.on.slice(), budget: 0, giving_link: org().giving_link || '' };
  S.sess = JSON.parse(JSON.stringify((ev && ev.sessions) || []));
  var oldIds = S.sess.map(function (x) { return x.id; }), autoWas = ev ? wizTime(ev) : '';
  editRow('ed_events', ev ? base : null, F.event, { title: ev ? 'Event Details' : 'New Event', base: ev ? null : base, del: false,
    prep: function (v) {
      sessRead(); var sc = sessClean(v); if (typeof sc === 'string') return sc; v.sessions = S.sess = sc;
      if (!v.time_label || (ev && v.time_label === autoWas)) v.time_label = wizTime(v);
      if (v.ends_on && v.starts_on && v.ends_on < v.starts_on) return 'The last day can’t be before the first day.';
      if (!v.ends_on) v.ends_on = v.starts_on || null;
      if (v.sections.length === SECTIONS.length) v.sections = [];
      else if (!v.sections.length) return 'Pick at least one thing this event uses.';
      else v.sections = v.sections.concat(['v2']);
      v.volunteer_goal = Math.max(0, Math.min(10000, v.volunteer_goal || 0));
      if (!ev) { v.org_id = org().id; v.slug = slugFor(v.title); }
      return v;
    }, after: function (r) {
      if (!ev) { openEvent(r.id); return; }
      S.ev = r;
      // A new session on an event that takes RSVPs gets its own RSVP, so guests can pick the sessions they can make.
      var att = evRows('ed_items', r).filter(function (i) { return i.kind === 'attend'; }), fresh = (r.sessions || []).filter(function (x) { return oldIds.indexOf(x.id) < 0; });
      if (!on('guests', r) || !att.length || !fresh.length) return;
      fresh.reduce(function (p, x, i) { return p.then(function () { return DB.save('ed_items', { event_id: r.id, kind: 'attend', title: x.title, on_date: x.on_date || r.starts_on, time_label: sessTime(x), start_time: x.start || null, end_time: x.end || null, needed: att[0].needed || 200, notes: '', sort: 50 + i }).then(function (row) { put('ed_items', row); }); }); }, Promise.resolve())
        .then(function () { toast(plural(fresh.length, 'RSVP') + ' added for the new ' + (fresh.length === 1 ? 'session' : 'sessions')); render(); }).catch(function () {});
    } });
}
/* New Event walkthrough: one question at a time, then it builds the event and its share pages. */
var WIZ_NEEDS = [
  ['guests', 'Will guests attend?', 'RSVPs with party size, seats and check-in, plus a guest QR code.'],
  ['volunteers', 'Do you need volunteers?', 'A volunteer goal, sign-up spots and a volunteer QR code.'],
  ['speakers', 'Will there be speakers?', 'Speaking dates, messages and honorariums.'],
  ['worship', 'Will there be a worship team?', 'Musicians, vocalists, sound and set lists.'],
  ['people', 'Is there a leadership or ministry team?', 'Leaders, altar counselors, prayer team, security, hosts.'],
  ['prayer', 'Will a prayer team cover this event?', 'Scripture, declarations, and the people and needs you’re interceding for.'],
  ['food', 'Will people bring meals?', 'Meal and dish sign-ups on the volunteer page.'],
  ['vendors', 'Will you hire vendors or work with outside contacts?', 'Costs, payments, who pays and when it’s due.'],
  ['equipment', 'Will you need equipment?', 'Tents, chairs, sound, and what gets loaded and returned.'],
  ['money', 'Will you track money?', 'Budget, payments, offerings and expenses.'],
  ['followup', 'Will you collect connection cards?', 'Guests fill them out on their phone.'],
  ['calendar', 'Do you need a schedule?', 'Setup, sound checks, rehearsals and services.'],
  ['agenda', 'Will there be an agenda or order of service?', 'Each segment and who leads it: opening prayer, worship, housekeeping, the message.']
];
var HEART_FIELDS = [
  { k: 'theme', label: 'Theme', ph: 'Let His Presence Fall', hint: 'A short line the whole team can remember.' },
  { k: 'purpose', label: 'Purpose', type: 'textarea', ph: 'The purpose of this event is to give God glory, to see the lost saved and the sick healed.', hint: 'Why you’re doing this. Shown to your team on the event Overview, not on public pages.' }];
var WIZ_STEPS = [
  { t: 'Name', q: 'What’s the event called?', f: [{ k: 'title', label: 'Event Name', auto: true, ph: 'Annual Tent Revival' }] },
  { t: 'When', q: 'When is it?', f: [{ k: 'starts_on', label: 'First Day', type: 'date', half: true }, { k: 'ends_on', label: 'Last Day', type: 'date', half: true, hint: 'Leave empty for one day.' }, { k: 'start_time', label: 'Starts', type: 'time', half: true }, { k: 'end_time', label: 'Ends', type: 'time', half: true }, { html: sessField }] },
  { t: 'Where', q: 'Where is it?', f: [{ k: 'place', label: 'Place', ph: 'Miller Field', auto: true }, { k: 'address', label: 'Address', ph: '1200 Waterman Rd, Waterman, IL', hint: 'Used for directions on the share pages.' }] },
  { t: 'Needs', q: 'What will this event have?', needs: true },
  { t: 'Goals', q: 'Set your targets.', goals: true },
  { t: 'Share Page', q: 'What should people see when they scan the QR code?', f: [{ k: 'about', label: 'About This Event', type: 'textarea', ph: 'Four nights of worship, preaching and prayer under the big tent. Everyone is welcome.' }, { k: 'contact_line', label: 'Questions Contact', ph: 'Questions? Text Steve at (555) 555-0142' }, { k: 'is_open', label: 'Open sign-ups and RSVPs right away', type: 'check' }] },
  { t: 'Heart', q: 'What’s the heart of this event? (Optional)', f: HEART_FIELDS },
  { t: 'Review', q: 'Look it over.', review: true }
];
function goalFields() {
  var n = S.wiz.v.needs, f = [];
  if (n.volunteers) f.push({ k: 'volunteer_goal', label: 'Volunteers Needed', type: 'int', half: true, ph: '60', hint: 'Required. Tracked on the event and the volunteer page.' });
  if (n.guests) f.push({ k: 'seats', label: 'Seats Or Expected Guests', type: 'int', half: true, ph: '300', hint: n.volunteers ? 'Per day.' : 'Per day. Used for RSVPs.' });
  if (n.money) { f.push({ k: 'budget', label: 'Budget', type: 'money', half: true }); f.push({ k: 'giving_link', label: 'Online Giving Link', type: 'url', half: true, ph: 'https://…' }); }
  return f;
}
function wizFields() { var st = WIZ_STEPS[S.wiz.step]; return st.goals ? goalFields() : st.f || []; }
function newEventWizard() {
  S.sess = []; S.wiz = { step: 0, err: '', v: { is_open: true, giving_link: org().giving_link || '', needs: {} } };
  openSheet(wizHtml, wizCreate, { wizard: true });
}
function wizKeep() { var f = wizFields(); if (f.length && $('#layer .sheet')) { S.wiz.v = readForm(f, S.wiz.v); sessRead(); } }
function wizCheck() {
  var st = WIZ_STEPS[S.wiz.step], v = S.wiz.v;
  if (st.t === 'Name' && !String(v.title || '').trim()) return 'Give the event a name.';
  if (st.t === 'When') { if (!v.starts_on) return 'Pick the first day.'; if (v.ends_on && v.ends_on < v.starts_on) return 'The last day can’t be before the first day.'; var sc = sessClean(v); if (typeof sc === 'string') return sc; S.sess = sc; }
  if (st.needs) { var miss = WIZ_NEEDS.filter(function (n) { return v.needs[n[0]] == null; }); if (miss.length) return 'Answer yes or no for each one. ' + plural(miss.length, 'question') + ' left.'; if (!WIZ_NEEDS.some(function (n) { return v.needs[n[0]]; })) return 'Pick at least one thing this event will have.'; }
  if (st.goals && v.needs.volunteers && !(v.volunteer_goal > 0)) return 'How many volunteers do you need?';
  return '';
}
function wizMove(d) {
  wizKeep();
  if (d > 0) { var m = wizCheck(); if (m) { S.sheet.err = m; refreshSheetErr(); var e1 = $('#layer .sheet .err'); if (e1) e1.scrollIntoView({ block: 'nearest' }); return; } }
  var s = S.wiz.step + d;
  if (WIZ_STEPS[s] && WIZ_STEPS[s].goals && !goalFields().length) s += d;
  S.wiz.step = Math.max(0, Math.min(WIZ_STEPS.length - 1, s)); S.wiz.err = ''; S.sheet.err = ''; redrawSheet();
  var sh = $('#layer .sheet'); if (sh) sh.scrollTop = 0;
}
function wizTime(v) {
  var ss = v.sessions || (S.wiz && S.wiz.v === v ? S.sess : null) || [];
  if (ss.length > 1) return plural(ss.length, 'session');
  if (!v.start_time) return '';
  var t = fmtTime(v.start_time) + (v.end_time ? ' – ' + fmtTime(v.end_time) : '');
  return v.ends_on && v.ends_on > v.starts_on ? 'Nightly, ' + t : t;
}
function wizHtml() {
  var w = S.wiz, st = WIZ_STEPS[w.step], v = w.v, n = WIZ_STEPS.length, body = '';
  if (st.needs) {
    body = '<div class="wiz-presets"><span>Quick fill:</span>' + Object.keys(PRESETS).map(function (k) { return '<button type="button" class="chip" data-a="wiz-preset" data-v="' + k + '">' + esc(PRESETS[k].label) + '</button>'; }).join('') + '</div>' +
      '<div class="yn-list">' + WIZ_NEEDS.map(function (q) {
        var a = v.needs[q[0]];
        return '<div class="yn' + (a == null ? '' : a ? ' yes' : ' no') + '"><div class="main"><b>' + esc(q[1]) + '</b><span>' + esc(q[2]) + '</span></div><div class="yn-btns" role="group" aria-label="' + esc(q[1]) + '">' +
          '<button type="button" data-a="wiz-yn" data-id="' + q[0] + '" data-v="1" aria-pressed="' + (a === true) + '">Yes</button><button type="button" data-a="wiz-yn" data-id="' + q[0] + '" data-v="0" aria-pressed="' + (a === false) + '">No</button></div></div>';
      }).join('') + '</div>';
  } else if (st.review) {
    var yes = WIZ_NEEDS.filter(function (q) { return v.needs[q[0]]; }).map(function (q) { return (SECTIONS.find(function (s) { return s[0] === q[0]; }) || [, q[0]])[1]; });
    var line = function (step, k, val) { return '<button class="rv" data-a="wiz-go" data-v="' + step + '"><span class="k">' + esc(k) + '</span><span class="v">' + (val ? esc(val) : '<i>Not set</i>') + '</span><span class="e">Edit</span></button>'; };
    body = '<div class="review">' + line(0, 'Name', v.title) + line(1, 'When', [fmtRange(v.starts_on, v.ends_on || v.starts_on), wizTime(v)].filter(Boolean).join(' · ') + ((S.sess || []).length ? ': ' + S.sess.map(function (x) { return x.title; }).join(', ') : '')) + line(2, 'Where', [v.place, v.address].filter(Boolean).join(', ')) +
      line(3, 'Includes', yes.join(', ')) + (goalFields().length ? line(4, 'Goals', [v.needs.volunteers ? v.volunteer_goal + ' volunteers' : '', v.needs.guests && v.seats ? v.seats + ' seats a day' : '', v.needs.money && v.budget ? money(v.budget) + ' budget' : ''].filter(Boolean).join(' · ')) : '') +
      line(5, 'Share Page', v.about || v.contact_line ? [v.about, v.contact_line].filter(Boolean).join(' ') : '') + line(6, 'Heart', [v.theme, v.purpose].filter(Boolean).join(' · ')) + '</div>' +
      '<div class="card tip"><b>Ready To Share</b><p class="small muted">' + esc([v.needs.volunteers || v.needs.food ? 'A volunteer QR code' : '', v.needs.guests ? 'a guest RSVP QR code' : '', v.needs.followup ? 'a connection card QR code' : ''].filter(Boolean).join(', ').replace(/^a/, 'A') || 'Your event workspace') + ' will be set up with these details.' + (v.needs.volunteers ? ' Add specific spots like Parking or Greeters any time; until then people can sign up for the general volunteer team.' : '') + '</p></div>';
  } else body = formBody(wizFields(), v);
  var pct = Math.round(100 * (w.step + 1) / n);
  return '<h3>New Event</h3><div class="wiz-head"><div class="wiz-step">Step ' + (w.step + 1) + ' of ' + n + ' · ' + esc(st.t) + '</div><div class="wiz-bar"><i style="width:' + pct + '%"></i></div><div class="wiz-q">' + esc(st.q) + '</div></div>' + body +
    '<div class="acts">' + (w.step ? '<button class="btn plain" data-a="wiz-back">Back</button>' : '<button class="btn plain" data-a="close">Cancel</button>') + '<span class="grow"></span>' +
    (st.review ? '<button class="btn" data-a="sheet-save">Create Event</button>' : '<button class="btn" data-a="wiz-next">Next</button>') + '</div>';
}
function wizCreate() {
  var v = S.wiz.v, nd = v.needs;
  S.wiz.ids = S.wiz.ids || { ev: uuid(), slug: slugFor(v.title), items: [] };
  var ev = { id: S.wiz.ids.ev, org_id: org().id, title: String(v.title).trim(), slug: S.wiz.ids.slug, starts_on: v.starts_on, ends_on: v.ends_on || v.starts_on, start_time: v.start_time || null, end_time: v.end_time || null, sessions: S.sess || [], time_label: wizTime(v), place: v.place || '', address: v.address || '',
    about: v.about || '', contact_line: v.contact_line || '', theme: v.theme || '', purpose: v.purpose || '', giving_link: nd.money ? v.giving_link || '' : (org().giving_link || ''), budget: nd.money ? num(v.budget) : 0, is_open: v.is_open !== false,
    volunteer_goal: nd.volunteers ? Math.max(0, Math.min(10000, v.volunteer_goal || 0)) : 0, notes: '',
    sections: WIZ_NEEDS.filter(function (q) { return nd[q[0]]; }).map(function (q) { return q[0]; }).concat(['v2']) };
  return save('ed_events', ev, 'Event created').then(function (r) {
    var adds = [], days = [], d = r.starts_on, tl = r.time_label.replace(/^Nightly, /, '');
    while (d && d <= r.ends_on && days.length < 14) { days.push(d); d = addDays(d, 1); }
    if (nd.volunteers && r.volunteer_goal) adds.push({ event_id: r.id, kind: 'serve', title: 'Volunteer Team', on_date: null, time_label: '', needed: Math.min(5000, r.volunteer_goal), notes: 'Serve wherever you’re needed. The team will reach out with details.', sort: 0 });
    var ss = r.sessions || [], seats = Math.max(1, Math.min(5000, v.seats || 200));
    if (nd.guests && ss.length) ss.forEach(function (x, i) { adds.push({ event_id: r.id, kind: 'attend', title: x.title, on_date: x.on_date || r.starts_on, time_label: sessTime(x), start_time: x.start || null, end_time: x.end || null, needed: seats, notes: '', sort: 10 + i }); });
    else if (nd.guests) days.forEach(function (x, i) { adds.push({ event_id: r.id, kind: 'attend', title: days.length > 1 ? 'Night ' + (i + 1) : 'RSVP', on_date: x, time_label: tl, needed: Math.max(1, Math.min(5000, v.seats || 200)), notes: '', sort: 10 + i }); });
    adds.forEach(function (it, i) { it.id = S.wiz.ids.items[i] = S.wiz.ids.items[i] || uuid(); });
    return adds.reduce(function (p, it) { return p.then(function () { return DB.save('ed_items', it).then(function (row) { put('ed_items', row); }); }); }, Promise.resolve()).then(function () { closeSheet(); S.wiz = null; openEvent(r.id); });
  }).catch(function () {});
}
function eventMenu() {
  var e = S.ev;
  openSheet('<h3>' + esc(e.title) + '</h3><div class="list menu">' +
    row({ act: 'edit-event', id: e.id, title: 'Edit Details And Tabs', sub: 'Name, dates, place, budget and which tabs this event uses' }) +
    row({ act: 'renew-event', id: e.id, title: 'Start Next Year', sub: 'For an annual event: new dates, tasks and checklists reset, sign-ups cleared' }) +
    row({ act: 'copy-event', id: e.id, title: 'Duplicate As A New Event', sub: 'Use this event as a template for another one' }) +
    (window.ED_DEMO ? '' : row({ act: 'popout', id: e.id, title: 'Open In A New Window', sub: 'Keep the ministry view open beside it' })) +
    row({ act: 'delete-event', id: e.id, title: '<span class="danger">Delete Event</span>' }) +
    '</div><div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Close</button></div>');
}
function renewEvent() {
  var e = S.ev, len = e.starts_on && e.ends_on ? dayDiff(e.ends_on, e.starts_on) : 0;
  var nextStart = e.starts_on ? addDays(e.starts_on, 364) : TODAY;
  var fields = [
    { k: 'start', label: 'New First Day', type: 'date', half: true, def: nextStart }, { k: 'end', label: 'New Last Day', type: 'date', half: true, def: addDays(nextStart, len) },
    { k: 'clear_signups', label: 'Clear volunteer and meal sign-ups', type: 'check', def: true },
    { k: 'clear_volunteers', label: 'Remove assigned volunteers', type: 'check', def: true },
    { k: 'clear_speakers', label: 'Remove speakers (you’ll book new ones)', type: 'check', def: false },
    { k: 'clear_money', label: 'Clear offerings and expenses', type: 'check', def: true },
    { k: 'clear_setlists', label: 'Clear set lists', type: 'check', def: true },
    { k: 'clear_cards', label: 'Clear connection cards (finish follow-up first)', type: 'check', def: false }];
  openSheet(function () {
    return '<h3>Start Next Year</h3><p class="lead">Keeps your plan: the schedule, tasks, team, vendors, contacts and equipment list. Moves every date to the new year and resets tasks, equipment checks and vendor payments.</p>' + formBody(fields, {}) + sheetFoot(false, 'Start Next Year');
  }, function () {
    var v = readForm(fields, {}); if (!v.start) { sheetErr('Pick the new first day.'); return; }
    if (v.end && v.end < v.start) { sheetErr('The last day can’t be before the first day.'); return; }
    var opts = {}; ['clear_signups', 'clear_volunteers', 'clear_speakers', 'clear_money', 'clear_setlists', 'clear_cards'].forEach(function (k) { opts[k] = !!v[k]; });
    return busy(DB.rpc('ed_renew_event', { p_event: e.id, p_start: v.start, p_end: v.end || null, p_opts: opts }), 'Ready for ' + v.start.slice(0, 4)).then(function () { closeSheet(); return loadAll(); }).then(function () { S.ev = byId('ed_events', e.id); S.evTab = 'overview'; render(); }).catch(function () {});
  });
}
function copyEvent() {
  var e = S.ev, fields = [{ k: 'title', label: 'New Event Name', auto: true, def: e.title + ' (Copy)' }, { k: 'start', label: 'First Day', type: 'date', def: e.starts_on || TODAY }];
  openSheet(function () { return '<h3>Duplicate As A New Event</h3><p class="lead">Copies the schedule, tasks, agenda, team, vendors, contacts, equipment list and sign-up spots. Sign-ups, money and connection cards are not copied.</p>' + formBody(fields, {}) + sheetFoot(false, 'Duplicate'); },
    function () {
      var v = readForm(fields, {}); if (!v.title) { sheetErr('Give the new event a name.'); return; }
      return busy(DB.rpc('ed_copy_event', { p_event: e.id, p_title: v.title, p_start: v.start || null }), 'Event created').then(function (id) { closeSheet(); return loadAll().then(function () { openEvent(id); }); }).catch(function () {});
    });
}

/* ================================================================ CSV + clipboard */
function csv(rows) { return rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n'); }
var CRC_T = null;
function crc32(b) { if (!CRC_T) { CRC_T = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } } var x = -1; for (var i = 0; i < b.length; i++) x = (x >>> 8) ^ CRC_T[(x ^ b[i]) & 255]; return (x ^ -1) >>> 0; }
// A plain (stored, uncompressed) .zip: opens on any phone or computer, no library needed.
function makeZip(files) {
  var enc = new TextEncoder(), parts = [], dir = [], off = 0, d = new Date(), dt0 = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)), dd0 = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate());
  var u16 = function (v) { return [v & 255, (v >>> 8) & 255]; }, u32 = function (v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; };
  files.forEach(function (f) {
    var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    var head = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(dt0), u16(dd0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
    parts.push(new Uint8Array(head), name, data);
    dir.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(dt0), u16(dd0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), name);
    off += head.length + name.length + data.length;
  });
  var dsize = dir.reduce(function (s, x) { return s + x.length; }, 0);
  return new Blob(parts.concat(dir, [new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(dsize), u32(off), u16(0)))]), { type: 'application/zip' });
}
function backupFiles() {
  var ev = {}; T('ed_events').forEach(function (e) { ev[e.id] = e; });
  var et = function (r) { return (ev[r.event_id] || {}).title || ''; }, ed = function (r) { return (ev[r.event_id] || {}).starts_on || ''; };
  var item = {}; T('ed_items').forEach(function (i) { item[i.id] = i; });
  var pname = function (t, id) { var r = byId(t, id); return r ? r.name : ''; };
  var sheet = function (name, head, rows) { return { name: name + '.csv', data: '﻿' + csv([head].concat(rows)) }; };
  var files = [
    sheet('contacts', ['Name', 'Type', 'Title Or Role', 'Organization', 'Phone', 'Email', 'Address', 'Groups', 'Status', 'Background Check Cleared', 'Background Check Expires', 'Notes'],
      T('ed_people').map(function (r) { return [r.name, personTypes(r).map(ctypeOne).join(', '), r.title, '', r.phone, r.email, r.address, (r.groups || []).join(', '), r.status === 'previous' ? 'Previous' : 'Current', r.bg_cleared_on || '', bgExpires(r), r.notes]; })
        .concat(T('ed_vendors').map(function (r) { return [r.name, 'Vendor', r.category, r.contact_name, r.phone, r.email, r.address, '', '', '', '', r.notes]; }))
        .concat(T('ed_contacts').map(function (r) { return [r.name, 'Other', r.role, r.organization, r.phone, r.email, r.address, '', '', '', '', r.notes]; }))),
    sheet('events', ['Event', 'Starts', 'Ends', 'Time', 'Place', 'Address', 'Theme', 'Budget', 'Volunteer Goal', 'About', 'Notes For Next Year'],
      T('ed_events').map(function (e) { return [e.title, e.starts_on, e.ends_on, e.time_label, e.place, e.address, e.theme || '', e.budget || '', e.volunteer_goal || '', e.about, e.debrief || '']; })),
    sheet('tasks', ['Event', 'Event Date', 'Task', 'Segment', 'Area', 'Due', 'Time', 'Assigned To', 'People Needed', 'Created By', 'Done', 'Notes'],
      T('ed_tasks').map(function (t) { return [et(t), ed(t), t.title, t.phase, t.area || '', t.due_on || '', t.due_time || '', t.owner || '', t.needed || 1, t.task_owner || '', t.done ? 'Yes' : '', t.notes]; })),
    sheet('sign-ups', ['Event', 'What', 'Kind', 'Date', 'Time', 'Name', 'Phone', 'Email', 'Note', 'Party', 'Checked In'],
      T('ed_signups').map(function (s) { var i = item[s.item_id] || {}; return [et(s), i.title, { serve: 'Volunteer', meal: 'Meal', attend: 'RSVP' }[i.kind] || i.kind, i.on_date || '', i.time_label || '', s.name, s.phone, s.email, s.note, s.party || 1, s.checked_in_at ? 'Yes' : '']; })),
    sheet('event-team', ['Event', 'Name', 'Team', 'Role', 'Days', 'Amount', 'Payment Status', 'Who Pays', 'Due'],
      T('ed_event_people').map(function (x) { return [et(x), pname('ed_people', x.person_id), teamLabel(x.team), x.role, x.days, x.amount || '', x.pay_status, x.payer, x.due_on || '']; })),
    sheet('money', ['Event', 'Kind', 'Who Or What', 'Amount', 'Paid', 'Status', 'Who Pays', 'Due', 'Notes'],
      T('ed_event_vendors').map(function (x) { return [et(x), 'Vendor', pname('ed_vendors', x.vendor_id) + (x.service ? ': ' + x.service : ''), x.cost, x.paid, x.pay_status, x.payer, x.due_on || '', x.notes]; })
        .concat(T('ed_event_people').filter(function (x) { return num(x.amount); }).map(function (x) { return [et(x), 'Speaker Or Team', pname('ed_people', x.person_id), x.amount, '', x.pay_status, x.payer, x.due_on || '', x.notes]; }))
        .concat(T('ed_expenses').map(function (x) { return [et(x), 'Expense', x.description, x.amount, '', x.pay_status, x.payer, x.due_on || '', x.notes]; }))),
    sheet('offerings', ['Event', 'Service', 'Date', 'Cash', 'Checks', 'Online', 'Other', 'Counted By', 'Deposited', 'Notes'],
      T('ed_offerings').map(function (o) { return [et(o), o.service, o.on_date || '', o.cash, o.checks, o.online, o.other, [o.counter1, o.counter2].filter(Boolean).join(' and '), o.deposited ? 'Yes' : '', o.notes]; })),
    sheet('connection-cards', ['Event', 'Name', 'Phone', 'Email', 'Responses', 'Prayer Request', 'Status', 'Follow Up By', 'Follow Up Date', 'Notes'],
      T('ed_cards').map(function (c) { return [et(c), c.name, c.phone, c.email, (c.responses || []).join('; '), c.prayer, c.status, c.follow_up_by, c.follow_up_on || '', c.notes]; })),
    sheet('prayer', ['Event', 'Kind', 'Title', 'Details', 'For', 'Follow Up', 'What God Did', 'Private'],
      T('ed_prayer').map(function (p) { return [et(p), { intercede: 'Prayer Need', declare: 'Declaration', verse: 'Scripture' }[p.kind] || p.kind, p.title, p.body, p.person_id ? pname('ed_people', p.person_id) : '', p.follow_up_on || '', p.answer, p.private ? 'Yes' : '']; })),
    sheet('schedule', ['Event', 'Date', 'Starts', 'Ends', 'What', 'Where', 'In Charge', 'Notes'],
      T('ed_schedule').map(function (s) { return [et(s), s.on_date, s.start_time, s.end_time, s.title, s.location, s.owner, s.notes]; })),
    sheet('agenda', ['Event', 'Order', 'Time', 'Segment', 'Led By', 'Minutes', 'Notes'],
      T('ed_agenda').map(function (x) { return [et(x), (x.sort || 0) + 1, x.start_time || '', x.title, x.leader, x.minutes, x.notes]; })),
    sheet('equipment', ['Item', 'Quantity', 'Category', 'Stored At', 'Condition', 'Notes'],
      T('ed_equipment').map(function (x) { return [x.name, x.quantity, x.category, x.location, x.condition, x.notes]; })),
    sheet('budget', ['Year', 'Line', 'Planned', 'Event', 'Notes'],
      T('ed_budget').map(function (b) { return [b.year, b.name, b.planned, b.event_id ? (ev[b.event_id] || {}).title || '' : '', b.notes]; }))
  ];
  var o = Object.assign({}, org()); delete o.logo;
  files.push({ name: 'full-backup.json', data: JSON.stringify({ app: 'Tent & Table', made: new Date().toISOString(), ministry: o, tables: S.db }, null, 1) });
  files.push({ name: 'READ ME.txt', data: 'Tent & Table backup of ' + (org().name || 'your ministry') + ', made ' + new Date().toLocaleString('en-US') + '.\r\n\r\nEach .csv file opens in Excel, Numbers or Google Sheets.\r\nfull-backup.json is a complete copy of every record, for restoring or moving to another system.\r\nKeep this file somewhere safe: it has names, phone numbers and prayer requests.\r\n' });
  return files;
}
function downloadBackup() {
  if (window.ED_DEMO) { toast('Downloads work in the installed app'); return; }
  var name = 'tent-and-table-backup-' + TODAY + '.zip';
  downloadBlob(name, makeZip(backupFiles())); lset('ed.backup.at', String(Date.now())); render(); toast('Backup saved');
}
function downloadBlob(name, blob) {
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function download(name, text) {
  if (window.ED_DEMO) { toast('Downloads work in the installed app'); return; }
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function copyText(text, msg) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast(msg || 'Link copied'); }, function () { toast('Press and hold the text to copy it'); }); }
// The same three ways out for everything you can share: copy as text, send with the phone's share menu, print or save as a PDF.
function shareTools(kind, id, extra) {
  return '<div class="qr-tools">' + (extra || '') + '<button class="btn sm plain" data-a="out-copy" data-v="' + kind + '" data-id="' + id + '">' + IC.list + ' Copy Text</button>' +
    (navigator.share && !window.ED_DEMO ? '<button class="btn sm plain" data-a="out-share" data-v="' + kind + '" data-id="' + id + '">' + IC.share + ' Share</button>' : '') +
    '<button class="btn sm" data-a="out-print" data-v="' + kind + '" data-id="' + id + '">Print Or PDF</button></div>' +
    (window.ED_DEMO ? '<p class="small muted center" style="margin:8px 0 0">Printing, PDFs and the phone’s share menu work in the app, not in this demo.</p>' : '');
}
function inviteText(k) {
  var e = S.ev, o = org() || {};
  return [o.name ? o.name + ' · ' + e.title : e.title, [fmtRange(e.starts_on, e.ends_on), e.time_label].filter(Boolean).join(' · '), [e.place, e.address].filter(Boolean).join(', '), '', SHARE[k][2] + ':', pubUrl(k)].filter(function (x, i) { return x || i === 3; }).join('\n');
}
function posterHtml(k) {
  var url = pubUrl(k), o = org() || {};
  return (o.logo ? '<img class="plogo-big" src="' + esc(o.logo) + '" alt="">' : '') + '<p class="pmin">' + esc(o.name || '') + '</p><h1>' + esc(S.ev.title) + '</h1><p>' + esc(SHARE[k][2]) + '</p><div class="qrbig">' + qrSvg(url) + '</div><p class="url">' + esc(url) + '</p>';
}
function listOf(id) {
  if (id === 'me') { var me = myMember(); return { title: 'My List · ' + (me.name || ''), text: stuffText((me.name || 'My') + '’s list · ' + ((org() || {}).name || ''), stuffFor(myRefs(), myNames())) }; }
  var c = refContact(id) || { name: '' };
  return { title: c.name + '’s List', text: stuffText(c.name + '’s list · ' + ((org() || {}).name || ''), stuffFor([id], [c.name.toLowerCase()])) };
}
function outOf(kind, id) { if (kind === 'mine') { var l = listOf(id); l.html = '<div class="printdoc"><pre class="plist">' + esc(l.text) + '</pre></div>'; return l; } return kind === 'qr' ? { title: SHARE[id][0] + ' · ' + S.ev.title, text: inviteText(id) } : docBuild(id); }

/* ================================================================ event wiring */
document.addEventListener('click', function (ev) {
  var t = ev.target.closest('[data-a]'); if (!t) return;
  var a = t.getAttribute('data-a'), id = t.getAttribute('data-id');
  if (a === 'scrim') { if (ev.target === t) closeSheet(); return; }
  var fn = A[a]; if (!fn) return;
  if (t.tagName === 'A' && (t.getAttribute('href') || '#') === '#') ev.preventDefault();
  if (t.tagName === 'BUTTON' || t.getAttribute('href') === '#') ev.preventDefault();
  fn(t, id);
});
document.addEventListener('input', function (ev) {
  var k = ev.target.getAttribute('data-input');
  if (k === 'dir-q') { S.dirQ = ev.target.value; var pos = ev.target.selectionStart; render(); var el = $('#dir_q'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} } }
  if (k === 'pick-q') { var q = ev.target.value.toLowerCase(); $$('#layer .pickrow').forEach(function (r) { r.hidden = q && r.getAttribute('data-name').indexOf(q) < 0; });
    $$('#layer .cpick-g').forEach(function (g) { var n = g.nextElementSibling, any = false; while (n && n.classList.contains('pickrow')) { if (!n.hidden) any = true; n = n.nextElementSibling; } g.hidden = !any; }); }
});
function pickFoot() {
  var sh = $('#layer .sheet'); if (!sh || !sh.querySelector('.pickfoot')) return;
  var n = $$('.picklist input:checked:not(:disabled)', sh).length;
  sh.classList.toggle('picking', n > 0);
  var b = sh.querySelector('.pf-add'); if (b) b.textContent = n ? 'Add ' + n : 'Add';
}
document.addEventListener('change', function (ev) {
  if (ev.target.closest && ev.target.closest('.pickrow')) pickFoot();
  var t = ev.target, k = t.getAttribute('data-change'); if (!k) return;
  if (k === 'dir-type') { S.dirType = t.value; render(); }
  if (k === 'mine-ev') { S.mineEv = t.value; render(); }
  if (k === 'imp-as' && S.imp) { S.imp.as = t.value; renderLayer(); }
  if (k === 'mine-done') { S.mineDone = t.checked; render(); }
  if (k === 'import-file' && t.files && t.files[0]) importFile(t.files[0]);
  if (k === 'dir-status') { S.dirStatus = t.value; render(); }
  if (k === 'dir-cat') { S.dirCat = t.value; render(); }
  if (k === 'budget-year') { S.budgetYear = +t.value; render(); }
  if (k === 'notify-channel') { var me = myMember(), p = prefs(); p.channel = t.value; me.prefs = p; render(); DB.updateMe(org().id, { prefs: p }).catch(function (e) { toast(errMsg(e)); }); }
  if (k === 'dir-team') { S.sub.dirTeam = t.value; render(); }
  if (k === 'task-area') { S.taskArea = t.value; render(); }
  if (k === 'doc-area') { S.taskArea = t.value; render(); redrawSheet(); }
  if (k === 'logo-file') { var file = t.files && t.files[0]; t.value = ''; if (file) setLogo(file); }
  if (k === 'ci-day') { S.sub.ciDay = t.value; render(); }
  if (k === 'eq-flag') {
    var r = byId('ed_event_equipment', t.getAttribute('data-id')), f = t.getAttribute('data-k'), v = Object.assign({}, r); v[f] = t.checked;
    put('ed_event_equipment', v); render(); DB.save('ed_event_equipment', v).then(function (x) { put('ed_event_equipment', x); }, function (e) { put('ed_event_equipment', r); render(); toast(errMsg(e)); });
  }
});
function toggle(t, id, field, valFn) {
  var r = byId(t, id), v = Object.assign({}, r); v[field] = valFn ? valFn(r) : !r[field];
  put(t, v); render(); buzz(); DB.save(t, v).then(function (x) { put(t, x); }, function (e) { put(t, r); render(); toast(errMsg(e)); });
}
var A = {
  close: closeSheet,
  // One save at a time: a second tap while the first is still going is ignored, so nothing is ever created twice.
  'rec-edit': function () { if (!S.sheet) return; S.sheet.viewMode = false; redrawSheet(); var el = $('#layer .sheet'); if (el) el.scrollTop = 0; },
  'sheet-save': function () {
    var sh = S.sheet; if (!sh || !sh.save || sh.saving || S.busy) return;
    var p = sh.save(); if (!p || !p.then) return;
    var mark = function (on) { $$('#layer .sheet [data-a="sheet-save"]').forEach(function (b) { b.disabled = on; b.classList.toggle('saving', on); }); };
    sh.saving = true; mark(true);
    var done = function () { sh.saving = false; if (S.sheet === sh) mark(false); };
    p.then(done, done);
  },
  'sheet-del': function () { if (S.sheet && S.sheet.del) S.sheet.del(); },
  nav: function (t) { S.tab = t.getAttribute('data-v'); if (S.ev) { closeEvent(); return; } render(); window.scrollTo(0, 0); },
  'auth-via': function (t) { S.authVia = t.getAttribute('data-v'); S.authMsg = ''; S.otpPhone = ''; render(); },
  'otp-change': function () { S.otpPhone = ''; S.authMsg = ''; render(); },
  'otp-resend': function () { var ph = S.otpPhone; S.authMsg = ''; DB.sendCode(ph).then(function () { toast('Code sent again'); }, function (e) { S.authMsg = otpErr(e); render(); }); },
  'auth-mode': function (t) { S.authMode = t.getAttribute('data-v'); S.authMsg = ''; render(); },
  'try-demo': function () { lset('ed.mode', 'demo'); location.reload(); },
  'leave-demo': function () { lset('ed.mode', null); location.href = location.pathname; },
  'reset-demo': function () { ask('Put the demo back to its starting data?', 'Reset Demo', function () { DB.reset(); S.ev = null; S.tab = 'home'; return loadAll().then(function () { render(); toast('Demo reset'); }); }); },
  signout: function () { DB.signOut().then(function () { if (DB.mode === 'demo') { lset('ed.mode', null); location.href = location.pathname; return; } S.user = null; S.acct = null; S.db = {}; S.ev = null; render(); }); },
  // directory
  'dir-tab': function (t) { S.dirTab = t.getAttribute('data-v'); S.dirQ = ''; S.dirCat = ''; render(); },
  'contact-new': function (t, id) { if (id) { newContact(id); return; } openSheet(function () {
    return '<h3>Add Contact</h3><p class="lead">What kind of contact is this?</p><div class="list">' + CTYPES.map(function (c) { return row({ act: 'contact-type', id: c[0], lead: '<span class="avatar ic tone-' + CTYPE_TONE[c[0]] + '">' + { team: IC.user, volunteer: IC.check, guest: IC.home, vendor: IC.tent, other: IC.book }[c[0]] + '</span>', title: esc(c[2] === 'Team' ? 'Team Member' : c[2]), sub: esc(CTYPE_HINT[c[0]]) }); }).join('') + '</div><div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Cancel</button></div>'; }); },
  'contact-type': function (t, id) { newContact(id); },
  'dir-open': function (t, id) { openDirRecord(t.getAttribute('data-t'), id); },
  'dir-add': function (t, id) { editDir(id, null); },
  'dir-edit': function (t, id) { var tb = t.getAttribute('data-t'); editDir(tb, byId(tb, id)); },
  // events
  'new-event': function () { newEventWizard(); },
  'sess-add': function () { sessRead(); var v = S.sess, last = v[v.length - 1], d = $('#layer [name="starts_on"]'); v.push({ id: uuid(), title: '', on_date: (last && last.on_date) || (d && d.value) || '', start: '', end: '' }); $('#sess_box').innerHTML = sessBox(); var n = $$('#sess_box [data-sess="title"]'); if (n.length) n[n.length - 1].focus(); },
  'sess-del': function (t, id) { sessRead(); S.sess.splice(+id, 1); $('#sess_box').innerHTML = sessBox(); },
  'wiz-next': function () { wizMove(1); },
  'wiz-back': function () { wizMove(-1); },
  'wiz-yn': function (t, id) { wizKeep(); S.wiz.v.needs[id] = t.getAttribute('data-v') === '1'; S.wiz.err = ''; S.sheet.err = ''; redrawSheet(); },
  'wiz-preset': function (t) { wizKeep(); var p = PRESETS[t.getAttribute('data-v')]; WIZ_NEEDS.forEach(function (n) { S.wiz.v.needs[n[0]] = p.on.indexOf(n[0]) >= 0; }); S.wiz.err = ''; S.sheet.err = ''; redrawSheet(); },
  'wiz-go': function (t) { wizKeep(); S.wiz.step = +t.getAttribute('data-v'); S.wiz.err = ''; S.sheet.err = ''; redrawSheet(); },
  'set-goal': function () { editRow('ed_events', S.ev, [{ k: 'volunteer_goal', label: 'How Many Volunteers Do You Need?', type: 'int', auto: true, hint: 'Counts everyone on the volunteer team plus everyone who signs up for a spot.' }], { title: 'Volunteer Goal', del: false, prep: function (v) { v.volunteer_goal = Math.max(0, Math.min(10000, v.volunteer_goal || 0)); return v; }, after: function (r) { S.ev = r; } }); },
  'open-event': function (t, id) { closeSheet(); openEvent(id); },
  'close-event': function () { closeEvent(); },
  'home-jump': function (t) { var el = document.getElementById('home-' + t.getAttribute('data-v')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  'ev-tab': function (t, id) { goArea(id || t.getAttribute('data-v')); render(); window.scrollTo(0, 0); if (S.evTab === 'people') refreshEvent(); },
  'sub-tab': function (t) { S.sub[t.getAttribute('data-k')] = t.getAttribute('data-v'); render(); },
  'cal-day': function (t) { S.calDay = t.getAttribute('data-v'); render(); },
  'event-menu': eventMenu,
  'edit-event': function () { closeSheet(); editEvent(S.ev); },
  'renew-event': function () { closeSheet(); renewEvent(); },
  'copy-event': function () { closeSheet(); copyEvent(); },
  popout: function () { closeSheet(); window.open(location.pathname + location.search + '#/w/' + S.ev.id, '_blank', 'noopener'); },
  'delete-event': function () { var e = S.ev; ask('Delete “' + e.title + '” and everything in it?', 'Delete Event', function () { return remove('ed_events', e.id, 'Event deleted').then(closeEvent); }, 'This can’t be undone. The Directory is not affected.'); },
  preset: function (t) { var p = PRESETS[t.getAttribute('data-v')]; $$('#layer [name="sections"]').forEach(function (x) { x.checked = p.on.indexOf(x.value) >= 0; }); },
  // assignments
  'pick-people': function (t, id) { pick('ed_people', id); },
  pick: function (t, id) { pick(id); },
  'pick-clear': function () { $$('#layer .picklist input:checked:not(:disabled)').forEach(function (x) { x.checked = false; }); pickFoot(); },
  'pick-new': function (t, team) {
    var tb = t.getAttribute('data-t');
    S.newGroups = tb === 'ed_people' ? [{ leader: 'Team Member', team: 'Team Member', speaker: 'Speaker', worship: 'Worship', volunteer: 'Volunteer' }[team] || 'Team Member'] : null;
    editDir(tb, null, function (r) { DB.save(assignTable(tb), assignRow(tb, r.id, team || null, '')).then(function (x) { put(assignTable(tb), x); render(); toast('Saved to Contacts and added to this event'); }); });
    S.newGroups = null;
  },
  'edit-assign': function (t, id) { editAssign('ed_event_people', byId('ed_event_people', id)); },
  'edit-assign-v': function (t, id) { editAssign('ed_event_vendors', byId('ed_event_vendors', id)); },
  'edit-assign-c': function (t, id) { editAssign('ed_event_contacts', byId('ed_event_contacts', id)); },
  'edit-assign-e': function (t, id) { editAssign('ed_event_equipment', byId('ed_event_equipment', id)); },
  'eq-qty': function (t, id) {
    var r = byId('ed_event_equipment', id), g = byId('ed_equipment', r.equipment_id) || {}, q = num(r.quantity) + num(t.getAttribute('data-d'));
    if (q < 1) { ask('Take ' + g.name + ' off the list?', 'Remove', function () { return remove('ed_event_equipment', id, 'Removed').then(render); }); return; }
    if (q > num(g.quantity)) { toast('The ministry owns ' + num(g.quantity)); return; }
    toggle('ed_event_equipment', id, 'quantity', function () { return q; });
  },
  // plan
  'add-sched': function () { editRow('ed_schedule', null, F.schedule, { title: 'Add To Schedule', base: { event_id: S.ev.id, on_date: S.calDay } , prep: function (v) { if (!v.on_date) return 'Pick a date.'; return v; }, after: function (r) { S.calDay = r.on_date; } }); },
  'edit-sched': function (t, id) { editRow('ed_schedule', byId('ed_schedule', id), F.schedule, { title: 'Edit Schedule Item', prep: function (v) { if (!v.on_date) return 'Pick a date.'; return v; } }); },
  'add-task': function () { var ar = S.taskArea && S.taskArea !== '-' ? S.taskArea : ''; editRow('ed_tasks', null, F.task, { title: 'Add Task', base: { event_id: S.ev.id, phase: 'planning', area: ar, done: false, needed: 1, assignee_refs: [], owner_typed: '', sort: evRows('ed_tasks').length }, prep: taskPrep }); },
  'doc-by': function (t) { S.sub.taskby = t.getAttribute('data-v'); redrawSheet(); },
  'edit-task': function (t, id) { var r = byId('ed_tasks', id); if (!r) return; var n = refNames(r.assignee_refs); editRow('ed_tasks', Object.assign({}, r, { owner_typed: splitNames(r.owner).filter(function (x) { return n.indexOf(x) < 0; }).join(', ') }), F.task, { title: 'Edit Task', prep: taskPrep, top: function (b) { return b.task_owner ? '<p class="small muted tby">Created by ' + esc(b.task_owner) + (b.created_at ? ' on ' + esc(fmtDay(String(b.created_at).slice(0, 10), { month: 'short', day: 'numeric', year: 'numeric' })) : '') + '</p>' : ''; } }); },
  'toggle-task': function (t, id) { toggle('ed_tasks', id, 'done'); },
  'add-prayer': function (t, id) { editPrayer(id, null); },
  'edit-prayer': function (t, id) { var p = byId('ed_prayer', id); if (p) editPrayer(p.kind, p); },
  'open-prayer': function (t, id) { var p = byId('ed_prayer', id); if (!p) return; closeSheet(); openEvent(p.event_id); S.evTab = 'prayer'; S.sub.area_prayer = p.kind; render(); },
  'edit-heart': function () { editRow('ed_events', S.ev, HEART_FIELDS.map(function (f, i) { return Object.assign({}, f, { auto: i === 0 }); }), { title: 'The Heart Of This Event', sub: 'A theme and purpose for your team. Add scripture and declarations under Prayer.', del: false, required: 'id', after: function (r) { S.ev = r; } }); },
  'mine-tab': function (t) { S.mineTab = t.getAttribute('data-v'); render(); },
  'my-task': function (t, id) { var x = byId('ed_tasks', id); if (!x) return; openEvent(x.event_id); goArea('tasks'); render(); A['edit-task'](t, id); },
  'pick-me': function () { pickMe(); },
  reminders: function () { remindersSheet(); },
  'rem-sent': function (t, id) { lset('ed.rem.' + id, '1'); setTimeout(function () { if (S.sheet) redrawSheet(); render(); }, 300); },
  'rem-all': function (t, id) { id.split('|').forEach(function (k) { lset('ed.rem.' + k, '1'); }); setTimeout(function () { if (S.sheet) redrawSheet(); render(); }, 300); },
  'add-agenda': function () { editRow('ed_agenda', null, F.agenda, { title: 'Add Segment', base: { event_id: S.ev.id, done: false, leader_ref: '', sort: evRows('ed_agenda').length } }); },
  'edit-agenda': function (t, id) { editRow('ed_agenda', byId('ed_agenda', id), F.agenda, { title: 'Edit Segment' }); },
  'toggle-agenda': function (t, id) { toggle('ed_agenda', id, 'done'); },
  tour: function () { openSheet(function () { return '<h3>Quick Tour</h3><div class="tourvid"><video src="tour.mp4" controls playsinline preload="metadata" poster="tour-poster.jpg"></video></div><p class="small muted" style="margin:10px 0 0">Under two minutes, with narration. Turn your sound on to listen.</p><div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Done</button></div>'; }); },
  'edit-debrief': function () { var f = [{ k: 'debrief', label: 'What Worked, What Didn’t, What To Change', type: 'textarea', auto: true, ph: 'Start setup an hour earlier. Order more water. The greeter team was great.' }]; editRow('ed_events', S.ev, f, { title: 'Notes For Next Year', del: false, after: function (r) { S.ev = r; } }); },
  'edit-notes': function () { var f = [{ k: 'notes', label: 'Notes, Decisions And Next Steps', type: 'textarea', auto: true }]; editRow('ed_events', S.ev, f, { title: 'Meeting Notes', del: false, required: 'notes', after: function (r) { S.ev = r; } }); },
  'add-setlist': function () { editRow('ed_setlists', null, F.setlist, { title: 'Add Set List', base: { event_id: S.ev.id, on_date: S.ev.starts_on } }); },
  'edit-setlist': function (t, id) { editRow('ed_setlists', byId('ed_setlists', id), F.setlist, { title: 'Edit Set List' }); },
  // sign-ups
  'add-item': function (t, kind) { editRow('ed_items', null, itemFields(kind), { title: kind === 'meal' ? 'Add Meal' : kind === 'attend' ? 'Add A Service' : 'Add A Shift', base: { event_id: S.ev.id, kind: kind, needed: kind === 'attend' ? 200 : 1, on_date: S.ev.starts_on, sort: evRows('ed_items').length }, prep: function (v) { v.needed = Math.max(1, Math.min(5000, v.needed || 1)); if (v.kind === 'serve' && (v.start_time || v.end_time)) v.time_label = timeRange(v.start_time, v.end_time); return v; } }); },
  'edit-item': function (t, id) { var it = byId('ed_items', id); editRow('ed_items', it, itemFields(it.kind), { title: it.kind === 'meal' ? 'Edit Meal' : it.kind === 'attend' ? 'Edit Service' : 'Edit Shift', prep: function (v) { if (v.kind === 'serve' && (v.start_time || v.end_time)) v.time_label = timeRange(v.start_time, v.end_time); v.needed = Math.max(1, Math.min(5000, v.needed || 1)); return v; }, delMsg: 'Delete this spot?', delSub: signups(id).length ? 'The ' + plural(signups(id).length, 'person', 'people') + ' signed up will be removed too.' : '' }); },
  'add-signup': function (t, id) { var it = byId('ed_items', id); editRow('ed_signups', null, suFields(it), { title: it.kind === 'attend' ? 'Add An RSVP' : it.kind === 'meal' ? 'Add A Dish' : 'Add A Volunteer', sub: it.title + (it.on_date ? ' · ' + fmtDay(it.on_date) : ''), base: { event_id: S.ev.id, item_id: id, checked_in_at: null, note: '', party: 1 }, prep: function (v) { v.party = Math.max(1, Math.min(50, v.party || 1)); return v; }, saveLabel: 'Add' }); },
  'del-signup': function (t, id) { var s = byId('ed_signups', id); ask('Remove ' + s.name + ' from this spot?', 'Remove', function () { return remove('ed_signups', id, 'Removed').then(render); }); },
  'edit-signup': function (t, id) { var s = byId('ed_signups', id), it = s && byId('ed_items', s.item_id); if (!it) return; editRow('ed_signups', s, suFields(it), { title: it.kind === 'attend' ? 'RSVP' : 'Sign-Up', sub: it.title, del: false, view: true }); },
  'pay-signup': function (t, id) { toggle('ed_signups', id, 'paid'); },
  checkin: function (t, id) { toggle('ed_signups', id, 'checked_in_at', function (r) { return r.checked_in_at ? null : new Date().toISOString(); }); },
  'vols-to-dir': function (t, kind) {
    kind = kind === 'attend' ? 'attend' : 'serve';
    var grp = kind === 'attend' ? 'Guest' : 'Volunteer';
    var serve = evRows('ed_items').filter(function (i) { return i.kind === kind; }).map(function (i) { return i.id; }), seen = {}, adds = [];
    evRows('ed_signups').filter(function (s) { return serve.indexOf(s.item_id) >= 0; }).forEach(function (s) {
      // already a contact (same phone, email or name), or the same person signed up twice: don't add again
      var keys = [digits(s.phone).slice(-10), String(s.email || '').trim().toLowerCase(), s.name.trim().toLowerCase()].filter(function (k) { return k && k.length >= 3; });
      if (personForSignup(s) || keys.some(function (k) { return seen[k]; })) return;
      keys.forEach(function (k) { seen[k] = 1; });
      adds.push({ org_id: org().id, name: s.name, title: kind === 'attend' ? '' : 'Volunteer', groups: [grp], status: 'current', phone: s.phone, email: s.email, address: '', notes: 'Signed up for ' + S.ev.title, no_email: !s.consent });
    });
    if (!adds.length) { toast('Everyone is already in Contacts'); return; }
    busy(Promise.all(adds.map(function (r) { return DB.save('ed_people', r); }))).then(function (rows) { rows.forEach(function (r) { put('ed_people', r); }); toast(plural(rows.length, kind === 'attend' ? 'guest' : 'volunteer') + ' saved to Contacts'); render(); }).catch(function () {});
  },
  // money
  'add-offering': function () { editRow('ed_offerings', null, F.offering, { title: 'Record Offering', base: { event_id: S.ev.id, on_date: S.ev.starts_on && S.ev.starts_on <= TODAY ? TODAY : S.ev.starts_on, deposited: false } }); },
  'edit-offering': function (t, id) { editRow('ed_offerings', byId('ed_offerings', id), F.offering, { title: 'Edit Offering' }); },
  'add-expense': function () { editRow('ed_expenses', null, F.expense, { title: 'Add Expense', base: { event_id: S.ev.id, pay_status: 'Not Paid' } }); },
  'edit-expense': function (t, id) { editRow('ed_expenses', byId('ed_expenses', id), F.expense, { title: 'Edit Expense' }); },
  // follow-up
  'add-card': function () { editRow('ed_cards', null, F.card, { title: 'Add A Connection Card', base: { event_id: S.ev.id, status: 'new', responses: [] } }); },
  'edit-card': function (t, id) { var c = byId('ed_cards', id); editRow('ed_cards', c, F.card, { title: 'Connection Card', top: function () { return actions(c); }, delMsg: 'Delete this card?' }); },
  'csv-cards': function () { download(S.ev.slug + '-connection-cards.csv', csv([['Name', 'Phone', 'Email', 'Responses', 'Prayer Request', 'Status', 'Follow-Up By', 'Notes', 'Date']].concat(evRows('ed_cards').map(function (c) { return [c.name, c.phone, c.email, (c.responses || []).join('; '), c.prayer, c.status, c.follow_up_by, c.notes, String(c.created_at || '').slice(0, 10)]; })))); },
  'csv-signups': function (t, kind) {
    var rows = [['Date', 'Spot', 'Name', 'Phone', 'Email', 'Note', 'Checked In', 'Party', 'Okay To Contact', 'Fee', 'Paid']];
    evRows('ed_items').filter(function (i) { return i.kind === kind; }).forEach(function (i) { signups(i.id).forEach(function (s) { rows.push([i.on_date, i.title, s.name, s.phone, s.email, s.note, s.checked_in_at ? 'Yes' : '', s.party || 1, s.consent ? 'Yes' : '', num(i.fee) > 0 ? num(i.fee) * (s.party || 1) : '', num(i.fee) > 0 ? (s.paid ? 'Yes' : 'No') : '']); }); });
    download(S.ev.slug + (kind === 'meal' ? '-food' : kind === 'attend' ? '-attending' : '-volunteers') + '.csv', csv(rows));
  },
  // share + public
  copy: function (t) { copyText(t.getAttribute('data-v')); },
  'open-pub': function (t, id) { closeSheet(); openPub(id, S.ev.slug); },
  'show-qr': function (t, id) { showQr(id); },
  doc: function (t, id) { openDoc(id); },
  'doc-copy': function (t, id) { copyText(docBuild(id).text); },
  'doc-print': function (t, id) { printHtml(docBuild(id).html); },
  'slot-open': function (t, id) { S.openSlots = S.openSlots || {}; S.openSlots[id] = !S.openSlots[id]; render(); },
  'ci-again': function () { S.ciDone = null; S.cardErr = ''; render(); },
  'pub-go': function (t, id) { openPub(id, S.pubSlug); },
  'leave-pub': function () { S.ciDone = null; if (/^#\/(e|c|v|r|k)\//.test(location.hash)) { try { history.pushState(null, '', location.pathname + location.search); } catch (e) {} } S.pubMode = ''; S.pub = null; S.cardDone = false; if (!S.user && !window.ED_DEMO) boot(); else if (S.pubFromEv && byId('ed_events', S.pubFromEv)) { var back = S.pubFromEv, tab = S.evTab, sub = S.sub; S.pubFromEv = null; openEvent(back); S.evTab = tab; S.sub = sub; render(); } else render(); },
  'out-copy': function (t, id) { copyText(outOf(t.getAttribute('data-v'), id).text, 'Copied. Paste it into a text or email.'); },
  'out-share': function (t, id) { var x = outOf(t.getAttribute('data-v'), id); try { navigator.share({ title: x.title, text: x.text }).catch(function () {}); } catch (er) { copyText(x.text, 'Copied'); } },
  'out-print': function (t, id) { if (window.ED_DEMO) { toast('Printing works in the app, not in this demo'); return; } if (t.getAttribute('data-v') === 'qr') A['print-qr'](t, id); else printHtml(outOf(t.getAttribute('data-v'), id).html); },
  'print-qr': function (t, id) {
    var d = document.createElement('div'); d.className = 'printonly';
    d.innerHTML = posterHtml(SHARE[id] ? id : 'v');
    document.body.appendChild(d); window.print(); setTimeout(function () { d.remove(); }, 800);
  },
  'pub-sign': function (t, id) {
    var it = S.pub.items.find(function (x) { return x.id === id; });
    var f = suFields(it, true), pre = {};
    try { pre = Object.assign({}, JSON.parse(lget('ed.guest') || '{}'), S.guest || {}); } catch (e) {}
    pre = { name: pre.name || '', phone: pre.phone || '', email: pre.email || '' };
    openSheet(function () { return '<h3>' + (it.kind === 'attend' ? 'RSVP' : 'Sign Up') + '</h3><p class="lead">' + esc(it.title + (it.on_date ? ' · ' + fmtLong(it.on_date) : '') + (it.time_label ? ' · ' + it.time_label : '')) + '</p>' + (feeLine(it) ? '<p class="feenote">' + esc(feeLine(it)) + '</p>' : '') + formBody(f, pre) + '<p class="small muted">Add a phone or email so the team can reach you' + (it.kind === 'attend' ? '. ' : ' and send you a reminder the day before. ') + (it.kind === 'attend' ? 'Your name is not shown to others.' : 'Only your first name is shown to others.') + '</p>' + sheetFoot(false, 'Sign Me Up'); },
      function () {
        var v = readForm(f, {});
        return busy(DB.rpc('ed_sign', { p_slug: S.pubSlug, p_item: id, p_name: v.name, p_phone: v.phone, p_email: v.email, p_note: v.note, p_party: it.kind === 'attend' ? Math.max(1, Math.min(50, v.party || 1)) : 1, p_consent: !!v.consent })).then(function (tok) {
          lset('ed.guest', JSON.stringify({ name: v.name, phone: v.phone, email: v.email }));
          lset('ed.tok.' + S.pubSlug, JSON.stringify(S.mine.map(function (m) { return m.token; }).concat([tok]))); closeSheet(); toast(it.kind === 'attend' ? (feeLine(it, v.party) ? 'You’re on the list. ' + feeLine(it, v.party) : 'You’re on the list. See you there!') : 'You’re signed up. Thank you!'); return loadPublic();
        });
      });
  },
  'pub-unsign': function (t, tok) { ask('Cancel this sign-up?', 'Cancel Sign-Up', function () { return DB.rpc('ed_unsign', { p_token: tok }).then(function () { lset('ed.tok.' + S.pubSlug, JSON.stringify(S.mine.map(function (m) { return m.token; }).filter(function (x) { return x !== tok; }))); toast('Cancelled'); return loadPublic(); }, function (e) { toast(errMsg(e)); }); }); },
  'card-again': function () { S.cardDone = false; render(); },
  // account
  invite: function () { busy(DB.rpc('ed_create_invite', { oid: org().id })).then(function (code) { S.acct.invites.push({ code: code, org_id: org().id }); render(); copyText(inviteUrl(code)); }).catch(function () {}); },
  'cancel-invite': function (t, id) { DB.cancelInvite(id).then(function () { S.acct.invites = S.acct.invites.filter(function (i) { return i.code !== id; }); render(); }); },
  'remove-member': function (t, id) { var m = S.acct.members.find(function (x) { return x.user_id === id; }); ask('Remove ' + (m.name || m.email) + ' from the ministry?', 'Remove', function () { return busy(DB.rpc('ed_remove_member', { oid: org().id, uid: id }), 'Removed').then(function () { S.acct.members = S.acct.members.filter(function (x) { return x.user_id !== id; }); render(); }); }); },
  'leave-org': function () { ask('Leave ' + org().name + '?', 'Leave', function () { return busy(DB.rpc('ed_remove_member', { oid: org().id, uid: S.user.id })).then(function () { S.acct = null; S.db = {}; render(); }); }, 'You’ll lose access to its events and Directory.'); },
  'open-settings': function () { S.prevTab = S.tab; S.tab = 'settings'; render(); window.scrollTo(0, 0); },
  'close-settings': function () { S.tab = S.prevTab || 'home'; render(); window.scrollTo(0, 0); },
  'open-event-tab': function (t, id) { openEvent(id); goArea(t.getAttribute('data-v') || 'overview'); render(); },
  'logo-remove': function () { var o = org(); ask('Remove the ministry logo?', 'Remove', function () { return busy(DB.updateOrg(o.id, { logo: '' }), 'Logo removed').then(function () { o.logo = ''; closeSheet(); render(); }); }); },
  // Texting someone: as yourself, or on behalf of the ministry (it opens your phone's Messages either way).
  'text-from': function (t, name) {
    var phone = t.getAttribute('data-v'), me = myMember(), o = org() || {}, first = String(name || '').trim().split(/\s+/)[0], mine = String(me.name || '').trim().split(/\s+/)[0];
    var asMin = 'Hi' + (first ? ' ' + first : '') + ', this is ' + (mine ? mine + ' with ' : '') + (o.name || 'our ministry') + '. ';
    openSheet('<h3>Text ' + esc(name || prettyPhone(phone)) + '</h3><p class="lead">Who is this text from?</p>' +
      '<div class="fromlist"><a class="fromopt" href="sms:' + esc(digits(phone)) + '"><b>From Me</b><span>' + esc(me.name || 'Just you') + ' · a personal text</span></a>' +
      '<a class="fromopt" href="' + esc(smsHref(phone, asMin)) + '"><b>From ' + esc(o.name || 'The Ministry') + '</b><span>Starts with “' + esc(asMin.trim()) + '”</span></a></div>' +
      '<p class="small muted">Both open Messages and send from your own phone number. Sending from a shared ministry number needs a texting service, which is turned off for now.</p>' +
      '<div class="acts"><span class="grow"></span><button class="btn plain" data-a="close">Done</button></div>');
  },
  'edit-org': function () { var o = org(); editProfile(F_ORG, o, 'Ministry Profile', function (v) { var f = {}; F_ORG.forEach(function (x) { f[x.k] = v[x.k] || ''; }); return DB.updateOrg(o.id, f).then(function () { Object.assign(o, f); }); }); },
  'edit-me': function () { var me = myMember(); editProfile(F_ME, me, 'My Profile', function (v) { return DB.updateMe(org().id, { name: v.name, phone: v.phone || '' }).then(function () { me.name = v.name; me.phone = v.phone || ''; }); }); },
  'change-email': function () { var f = [{ k: 'email', label: 'New Login Email', type: 'email', auto: true, hint: 'We’ll send a confirmation link to the new address. Your login changes once you click it.' }]; editProfile(f, {}, 'Change Login Email', function (v) { return DB.changeEmail(v.email).then(function () { if (DB.mode === 'demo') { S.user.email = v.email; myMember().email = v.email; } else toast('Check ' + v.email + ' for a confirmation link'); }); }); },
  'change-pw': function () { var f = [{ k: 'pw', label: 'New Password', auto: true, hint: 'At least 8 characters.' }]; openSheet(function () { return '<h3>Change Password</h3><div class="fgrid"><div class="fld"><label for="f_pw">New Password</label><input class="inp" id="f_pw" name="pw" type="password" minlength="8" autocomplete="new-password" autofocus><span class="hint">At least 8 characters.</span></div></div>' + sheetFoot(false); }, function () { var v = $('#layer #f_pw').value; if (v.length < 8) { sheetErr('Use at least 8 characters.'); return; } return busy(DB.changePassword(v), 'Password changed').then(closeSheet).catch(function () {}); }); },
  backup: function () { downloadBackup(); },
  'bg-add': function (t, id) { var s = T('ed_signups').find(function (x) { return x.id === id; }); if (!s) return; closeSheet(); editRow('ed_people', null, F.person, { title: 'Add ' + s.name + ' To Contacts', base: { org_id: org().id, name: s.name, phone: s.phone || '', email: s.email || '', groups: ['Volunteer'], status: 'current', title: '', address: '', notes: '' } }); },
  'auto-remind': function () { var o = org(), v = !o.auto_remind; o.auto_remind = v; render(); DB.updateOrg(o.id, { auto_remind: v }).then(function () { toast(v ? 'Automatic reminders on' : 'Automatic reminders off'); }, function (e) { o.auto_remind = !v; render(); toast(errMsg(e)); }); },
  'notify-test': function () { toast('Sending…'); DB.notify('test').then(function (r) { toast(r && r.sent ? 'Test sent. Check your ' + (r.sent > 1 ? 'email and phone' : 'messages') + '.' : (r && r.errors && r.errors[0]) || 'Nothing was sent. Add your email or phone under My Profile.'); }, function (e) { toast(errMsg(e)); }); },
  notify: function (t, k) { var me = myMember(), p = prefs(); p[k] = !p[k]; me.prefs = p; render(); DB.updateMe(org().id, { prefs: p }).catch(function (e) { toast(errMsg(e)); }); },
};

if (window.MAIL_ACTIONS) Object.assign(A, MAIL_ACTIONS);
document.addEventListener('submit', function (ev) {
  var f = ev.target, k = f.getAttribute('data-form'); if (!k) return; ev.preventDefault();
  if (S.busy) return; // already sending this form
  var v = {}; new FormData(f).forEach(function (val, key) { if (key === 'r') (v.r = v.r || []).push(val); else v[key] = String(val).trim(); });
  S.formKeep = { k: k, v: Object.assign({}, v) }; // so a redraw (an error, a busy state) never erases what someone typed
  if (k === 'auth') {
    S.authMsg = ''; S.busy = true; render();
    var p = S.authMode === 'reset' ? DB.resetPassword(v.email).then(function () { S.authMsg = 'Check your email for a reset link.'; S.authMode = 'in'; })
      : (S.authMode === 'up' ? DB.signUp(v.email, v.pw) : DB.signIn(v.email, v.pw)).then(function (u) { if (!u) { S.authMsg = 'Check your email to confirm your account, then sign in.'; S.authMode = 'in'; return; } S.user = u; S.loading = true; return loadAcct(); });
    p.catch(function (e) { S.authMsg = errMsg(e); }).then(function () { S.busy = false; render(); });
  } else if (k === 'auth-phone') {
    S.authMsg = '';
    if (!S.otpPhone) {
      var ph = e164(v.phone); if (!ph) { S.authMsg = 'Enter a 10-digit mobile number.'; render(); return; }
      S.busy = true; render();
      DB.sendCode(ph).then(function () { S.otpPhone = ph; }, function (e) { S.authMsg = otpErr(e); }).then(function () { S.busy = false; render(); });
    } else {
      var code = digits(v.code); if (code.length < 6) { S.authMsg = 'Enter the 6-digit code from the text.'; render(); return; }
      S.busy = true; render();
      DB.verifyCode(S.otpPhone, code).then(function (u) { S.user = u; S.otpPhone = ''; S.loading = true; return loadAcct(); }, function (e) { S.authMsg = otpErr(e); }).then(function () { S.busy = false; render(); });
    }
  } else if (k === 'create-org') {
    S.busy = true; f.querySelectorAll('button[type="submit"]').forEach(function (b) { b.disabled = true; b.classList.add('saving'); });
    DB.rpc('ed_create_org', { p_name: v.name, p_display: v.me }).then(function (oid) {
      // the two optional extras; if either can't be saved the account still opens and they can be added in Settings
      return Promise.all([v.phone && oid ? DB.updateMe(oid, { phone: v.phone }).catch(function () {}) : null, v.tax_id && oid ? DB.updateOrg(oid, { tax_id: v.tax_id }).catch(function () {}) : null]);
    }).then(loadAcct).catch(function (e) { S.authMsg = errMsg(e); }).then(function () { S.busy = false; render(); });
  } else if (k === 'join') {
    if (!v.code) { S.authMsg = 'Paste the code from your invite link.'; render(); return; }
    DB.rpc('ed_accept_invite', { p_code: v.code.replace(/^.*join=/, ''), p_display: v.me }).then(function () { lset('ed.join', null); return loadAcct(); }).catch(function (e) { S.authMsg = errMsg(e); render(); });
  } else if (k === 'selfci') {
    S.cardErr = '';
    if (digits(v.phone).replace(/^\+?1/, '').length < 7) { S.cardErr = 'Enter the phone number you signed up with.'; render(); return; }
    S.busy = true; render();
    DB.rpc('ed_checkin', { p_slug: S.pubSlug, p_phone: v.phone }).then(function (r) { S.busy = false; S.ciDone = r || []; render(); window.scrollTo(0, 0); }, function (e) { S.busy = false; S.cardErr = errMsg(e); render(); });
  } else if (k === 'card') {
    S.cardErr = '';
    if (!v.phone && !v.email) { S.cardErr = 'Add a phone number or email so we can reach you.'; render(); return; }
    S.busy = true; render();
    DB.rpc('ed_connect', { p_slug: S.pubSlug, p_name: v.name, p_phone: v.phone, p_email: v.email, p_responses: v.r || [], p_prayer: v.prayer }).then(function () { S.busy = false; S.cardDone = true; render(); window.scrollTo(0, 0); }, function (e) { S.busy = false; S.cardErr = errMsg(e); render(); });
  }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sheet) closeSheet(); });
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Tab' || !S.sheet) return; var sh = $('#layer .sheet'); if (!sh) return;
  var f = sh.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled])'); if (!f.length) return;
  var first = f[0], last = f[f.length - 1], cur = document.activeElement;
  if (e.shiftKey && (cur === first || cur === sh)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
  else if (!sh.contains(cur)) { e.preventDefault(); first.focus(); }
});
var lastSync = Date.now();
function resync() {
  // Someone else may have changed things while this phone was asleep: reload quietly, but never under a form someone is filling in.
  if (!DB || DB.mode !== 'cloud' || !S.acct || S.offline || S.sheet || S.busy || S.pubMode || Date.now() - lastSync < 45000) return false;
  var el = document.activeElement; if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
  lastSync = Date.now(); var evId = S.ev && S.ev.id;
  loadAll().then(function () { if (evId) S.ev = byId('ed_events', evId) || null; saveSnap(); if (!S.sheet) render(); }).catch(function () {});
  return true;
}
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && !resync() && S.ev) refreshEvent(); });
if (window.visualViewport) {
  var kbSet = function () { var v = window.visualViewport, kb = Math.round(window.innerHeight - v.height - v.offsetTop); document.documentElement.style.setProperty('--kb', (kb > 80 ? kb : 0) + 'px'); };
  window.visualViewport.addEventListener('resize', kbSet); window.visualViewport.addEventListener('scroll', kbSet);
}
document.addEventListener('focusin', function (e) {
  var el = e.target; if (!el || !el.closest || !el.closest('.sheet') || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
  setTimeout(function () { if (document.activeElement === el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 320);
});

(function start() {
  var DEMO = !!window.ED_DEMO || /[?&]demo\b/.test(location.search) || lget('ed.mode') === 'demo' || !window.supabase;
  DB = DEMO ? DemoDB() : CloudDB();
  if (DB.mode === 'cloud') DB.sb.auth.onAuthStateChange(function (evt) { if (evt === 'SIGNED_OUT') { S.user = null; S.acct = null; render(); } });
  boot();
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.ED_DEMO) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
