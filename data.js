/* Tent & Table: data layer.
   Two versions with the same functions:
   - CloudDB talks to Supabase (see supabase/schema.sql).
   - DemoDB keeps sample data in this browser, for trying the app.
   The app keeps a copy of every table in memory (S.db) and calls DB.save /
   DB.remove for each change. */
var CLOUD_URL = 'https://pxjqgsqzcychidgghvnt.supabase.co';
var CLOUD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4anFnc3F6Y3ljaGlkZ2dodm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0NDM2NDcsImV4cCI6MjExMTAxOTY0N30.d-fRLSDuFI2EFPH9dFY-qKV4ddugVLk-YevpyYTZXT4';

var DIR_TABLES = ['ed_people', 'ed_vendors', 'ed_contacts', 'ed_equipment', 'ed_budget'];
var EVENT_TABLES = ['ed_event_people', 'ed_event_vendors', 'ed_event_contacts', 'ed_event_equipment', 'ed_schedule', 'ed_tasks',
  'ed_agenda', 'ed_setlists', 'ed_items', 'ed_signups', 'ed_offerings', 'ed_expenses', 'ed_cards', 'ed_prayer'];
// Rows that go away with their parent (the database does this with "on delete cascade").
var CASCADE = {
  ed_events: EVENT_TABLES.map(function (t) { return [t, 'event_id']; }).concat([['ed_mailings', 'event_id']]),
  ed_people: [['ed_event_people', 'person_id']], ed_vendors: [['ed_event_vendors', 'vendor_id']],
  ed_contacts: [['ed_event_contacts', 'contact_id']], ed_equipment: [['ed_event_equipment', 'equipment_id']],
  ed_items: [['ed_signups', 'item_id']]
};

function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
}
function token() { return uuid().replace(/-/g, ''); }
function isoDay(d) { var x = d instanceof Date ? d : new Date(d + 'T12:00:00'); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function addDays(day, n) { if (!day) return day; var x = new Date(day + 'T12:00:00'); x.setDate(x.getDate() + n); return isoDay(x); }
function dayDiff(a, b) { return Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 86400000); }
function slugFor(t) { var s = String(t || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); return (s.length < 2 ? 'event' : s) + '-' + token().slice(0, 4); }
function clean(row) { var r = Object.assign({}, row); delete r.created_at; delete r.updated_at; return r; }

/* ---------------------------------------------------------------- cloud */
function CloudDB() {
  var sb = window.supabase.createClient(CLOUD_URL, CLOUD_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'ed.auth.pxjq' } });
  function q(p) { return p.then(function (r) { if (r.error) throw r.error; return r.data; }); }
  var me = null;
  return {
    mode: 'cloud', sb: sb,
    user: function () { return sb.auth.getSession().then(function (r) { me = r.data.session ? r.data.session.user : null; return me; }); },
    // Google sends the person back here with the session in the address; the client reads it on load.
    fnUrl: function (name) { return CLOUD_URL + '/functions/v1/' + name; },
    signInGoogle: function () { return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }).then(function (r) { if (r.error) throw r.error; }); },
    signIn: function (e, p) { return sb.auth.signInWithPassword({ email: e, password: p }).then(function (r) { if (r.error) throw r.error; me = r.data.user; return me; }); },
    signUp: function (e, p) { return sb.auth.signUp({ email: e, password: p, options: { emailRedirectTo: location.origin + location.pathname } }).then(function (r) { if (r.error) throw r.error; me = r.data.session ? r.data.user : null; return me; }); },
    sendCode: function (phone) { return sb.auth.signInWithOtp({ phone: phone }).then(function (r) { if (r.error) throw r.error; }); },
    verifyCode: function (phone, code) { return sb.auth.verifyOtp({ phone: phone, token: code, type: 'sms' }).then(function (r) { if (r.error) throw r.error; me = r.data.user; return me; }); },
    signOut: function () { return sb.auth.signOut(); },
    resetPassword: function (e) { return q(sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin + location.pathname })); },
    myOrg: function () {
      return q(sb.from('ed_members').select('org_id, role').eq('user_id', me.id)).then(function (rows) {
        if (!rows.length) return null;
        var oid = rows[0].org_id, role = rows[0].role;
        return Promise.all([
          q(sb.from('ed_orgs').select('*').eq('id', oid).single()),
          q(sb.from('ed_members').select('org_id, user_id, email, name, role, phone, prefs').eq('org_id', oid).order('joined_at')),
          role === 'owner' ? q(sb.from('ed_invites').select('code, org_id, expires_at').eq('org_id', oid)) : Promise.resolve([])
        ]).then(function (r) { return { org: r[0], role: role, members: r[1], invites: r[2] }; });
      });
    },
    updateOrg: function (id, f) { return q(sb.from('ed_orgs').update(f).eq('id', id)); },
    notifyLog: function (oid) { return q(sb.from('ed_notify_log').select('key, status, created_at').eq('org_id', oid).like('key', 'rem:%').gte('created_at', new Date(Date.now() - 3 * 864e5).toISOString())); },
    notify: function (action) { return sb.functions.invoke('ed-notify', { body: { action: action } }).then(function (r) { if (r.error) throw new Error('Automatic sending isn’t set up yet.'); return r.data; }); },
    updateMe: function (oid, f) { return q(sb.from('ed_members').update(f).eq('org_id', oid).eq('user_id', me.id)); },
    changeEmail: function (e) { return q(sb.auth.updateUser({ email: e }, { emailRedirectTo: location.origin + location.pathname })); },
    changePassword: function (p) { return q(sb.auth.updateUser({ password: p })); },
    cancelInvite: function (c) { return q(sb.from('ed_invites').delete().eq('code', c)); },
    list: function (t, col, val) { return q(sb.from(t).select('*').eq(col, val)); },
    listIn: function (t, col, vals) {
      if (!vals.length) return Promise.resolve([]);
      var chunks = []; for (var i = 0; i < vals.length; i += 100) chunks.push(vals.slice(i, i + 100));
      return Promise.all(chunks.map(function (c) { return q(sb.from(t).select('*').in(col, c)); })).then(function (r) { return [].concat.apply([], r); });
    },
    save: function (t, row) {
      var r = clean(row); if (!r.id) r.id = uuid(); if (t === 'ed_signups') delete r.token;
      // If the app ever sends a field this table doesn't have, drop that one field and save the rest instead of failing.
      var go = function (left) {
        return sb.from(t).upsert(r).select().single().then(function (res) {
          var m = res.error && /Could not find the '([a-z_0-9]+)' column/i.exec(res.error.message || '');
          if (m && left > 0 && m[1] !== 'id' && (m[1] in r)) { delete r[m[1]]; return go(left - 1); }
          if (res.error) throw res.error; return res.data;
        });
      };
      return go(4);
    },
    remove: function (t, id) { return q(sb.from(t).delete().eq('id', id)); },
    rpc: function (name, args) { return q(sb.rpc(name, args)); },
    // bulk email: photos go to public storage, recipients are queued one row each, and the ed-mail function does the sending
    upload: function (path, blob) { return sb.storage.from('ed-mail').upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg', cacheControl: '31536000' }).then(function (r) { if (r.error) throw r.error; return sb.storage.from('ed-mail').getPublicUrl(path).data.publicUrl; }); },
    mailQueue: function (mid, oid, list) {
      var chunks = []; for (var i = 0; i < list.length; i += 200) chunks.push(list.slice(i, i + 200));
      return chunks.reduce(function (p, c) { return p.then(function () { return q(sb.from('ed_mail_rcpt').upsert(c.map(function (r) { return { mailing_id: mid, org_id: oid, email: r.email, name: (r.name || '').slice(0, 120), phone: (r.phone || '').slice(0, 40) }; }), { onConflict: 'mailing_id,email', ignoreDuplicates: true })); }); }, Promise.resolve());
    },
    mail: function (action, body) {
      return sb.functions.invoke('ed-mail', { body: Object.assign({ action: action }, body) }).then(function (r) {
        if (r.error) { var c = r.error.context; if (c && c.json) return c.json().then(function (j) { throw new Error((j && j.error) || r.error.message); }, function () { throw r.error; }); throw r.error; }
        return r.data;
      });
    }
  };
}

/* ---------------------------------------------------------------- demo */
function DemoDB() {
  var KEY = 'ed.demo.v16', D = null;
  try { D = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!D || !D.t) D = demoSeed();
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  persist();
  function T(t) { return D.t[t] || (D.t[t] = []); }
  function ok(v) { return new Promise(function (res) { setTimeout(function () { res(JSON.parse(JSON.stringify(v === undefined ? null : v))); }, 40); }); }
  function fail(m) { return Promise.reject(new Error(m)); }
  function now() { return new Date().toISOString(); }
  function put(t, row) {
    var a = T(t), r = clean(row); if (!r.id) r.id = uuid();
    var i = a.findIndex(function (x) { return x.id === r.id; });
    if (i >= 0) a[i] = Object.assign({}, a[i], r, { updated_at: now() });
    else { if (t === 'ed_signups' && !r.token) r.token = token(); a.push(Object.assign({ created_at: now(), updated_at: now() }, r)); i = a.length - 1; }
    return a[i];
  }
  function del(t, id) {
    (CASCADE[t] || []).forEach(function (c) { T(c[0]).filter(function (x) { return x[c[1]] === id; }).forEach(function (x) { del(c[0], x.id); }); });
    D.t[t] = T(t).filter(function (x) { return x.id !== id; });
  }
  function pub(slug) {
    var ev = T('ed_events').find(function (e) { return e.slug === slug; }); if (!ev) return null;
    var org = T('ed_orgs').find(function (o) { return o.id === ev.org_id; }) || {};
    return { event: { slug: ev.slug, title: ev.title, starts_on: ev.starts_on, ends_on: ev.ends_on, time_label: ev.time_label, place: ev.place, address: ev.address, about: ev.about, contact_line: ev.contact_line, giving_link: ev.giving_link, volunteer_goal: ev.volunteer_goal || 0, volunteer_count: T('ed_signups').filter(function (s) { var i = T('ed_items').find(function (x) { return x.id === s.item_id; }); return i && i.event_id === ev.id && i.kind === 'serve'; }).length + T('ed_event_people').filter(function (p) { return p.event_id === ev.id && p.team === 'volunteer'; }).length, is_open: ev.is_open, sections: ev.sections || [], sessions: ev.sessions || [], ministry: org.name, logo: org.logo || '' },
      items: T('ed_items').filter(function (i) { return i.event_id === ev.id; }).sort(function (a, b) { return String(a.on_date || '').localeCompare(String(b.on_date || '')) || a.sort - b.sort; }).map(function (i) {
        return { id: i.id, kind: i.kind, title: i.title, on_date: i.on_date, time_label: i.time_label, needed: i.needed, notes: i.notes, needs_check: !!i.needs_check, fee: i.fee || 0, taken: T('ed_signups').filter(function (s) { return s.item_id === i.id; }).reduce(function (n, s) { return n + (i.kind === 'attend' ? (s.party || 1) : 1); }, 0), names: i.kind === 'attend' ? [] : T('ed_signups').filter(function (s) { return s.item_id === i.id; }).map(function (s) { return s.name.split(' ')[0]; }) };
      }) };
  }
  var RPC = {
    ed_create_org: function (a) { var id = uuid(); T('ed_orgs').push({ id: id, name: a.p_name || 'Our Ministry' }); T('ed_members').push({ org_id: id, user_id: D.me.id, email: D.me.email, name: a.p_display, role: 'owner' }); return id; },
    ed_create_invite: function (a) { if (T('ed_members').filter(function (m) { return m.org_id === a.oid; }).length >= 10) throw new Error('This account already has 10 people'); var c = token(); T('ed_invites').push({ code: c, org_id: a.oid }); return c; },
    ed_accept_invite: function () { throw new Error('Invites work once the app is connected to your database.'); },
    ed_remove_member: function (a) { D.t.ed_members = T('ed_members').filter(function (m) { return !(m.org_id === a.oid && m.user_id === a.uid); }); return null; },
    ed_public: function (a) { return pub(a.p_slug); },
    ed_guest: function (a) { var r = T('ed_mail_rcpt').find(function (x) { return x.id === a.p_rcpt; }); return r ? { name: r.name, email: r.email, phone: r.phone } : null; },
    ed_unsubscribe: function (a) { var r = T('ed_mail_rcpt').find(function (x) { return x.id === a.p_rcpt; }); if (!r) return ''; T('ed_people').forEach(function (p) { if (String(p.email || '').toLowerCase() === r.email) p.no_email = true; }); return (T('ed_orgs')[0] || {}).name || ''; },
    ed_sign: function (a) {
      var p = pub(a.p_slug); if (!p) throw new Error('This event was not found.');
      if (!p.event.is_open) throw new Error('Sign-ups for this event are closed.');
      var it = T('ed_items').find(function (i) { return i.id === a.p_item; }); if (!it) throw new Error('That spot was removed. Refresh the page.');
      if (!String(a.p_name || '').trim()) throw new Error('Please add your name.');
      if (!String(a.p_phone || '').trim() && !String(a.p_email || '').trim()) throw new Error('Please add a phone number or email so the team can reach you.');
      var pty = it.kind === 'attend' ? Math.min(50, Math.max(1, parseInt(a.p_party, 10) || 1)) : 1;
      var taken = T('ed_signups').filter(function (s) { return s.item_id === it.id; }).reduce(function (n, s) { return n + (it.kind === 'attend' ? (s.party || 1) : 1); }, 0);
      if (taken + pty > it.needed) throw new Error(it.kind === 'attend' && taken < it.needed ? 'Only ' + (it.needed - taken) + ' seats are left for this one.' : 'That one just filled up. Please pick another.');
      return put('ed_signups', { event_id: it.event_id, item_id: it.id, name: a.p_name.trim(), phone: a.p_phone || '', email: a.p_email || '', note: a.p_note || '', party: pty, consent: !!a.p_consent, paid: false, checked_in_at: null }).token;
    },
    ed_unsign: function (a) { D.t.ed_signups = T('ed_signups').filter(function (s) { return s.token !== a.p_token; }); return null; },
    ed_mine: function (a) { return T('ed_signups').filter(function (s) { return a.p_tokens.indexOf(s.token) >= 0; }).map(function (s) { return { token: s.token, item_id: s.item_id, name: s.name }; }); },
    ed_checkin: function (a) {
      var ev = T('ed_events').find(function (e) { return e.slug === a.p_slug; }); if (!ev) throw new Error('This event was not found.');
      var want = String(a.p_phone || '').replace(/[^0-9]/g, '').replace(/^1(?=\d{10}$)/, '');
      if (want.length < 7) throw new Error('Enter the phone number you signed up with.');
      var today = isoDay(new Date()), out = [];
      T('ed_items').filter(function (i) { return i.event_id === ev.id && (i.on_date === today || (!i.on_date && ev.starts_on <= today && (ev.ends_on || ev.starts_on) >= today)); }).forEach(function (i) {
        T('ed_signups').filter(function (s) { return s.item_id === i.id && String(s.phone || '').replace(/[^0-9]/g, '').replace(/^1(?=\d{10}$)/, '') === want; }).forEach(function (s) { if (!s.checked_in_at) s.checked_in_at = new Date().toISOString(); out.push({ name: s.name, title: i.title }); });
      });
      if (!out.length) throw new Error('We couldn’t find a sign-up for today with that number. Please see someone at the welcome table.');
      return out;
    },
    ed_connect: function (a) {
      var ev = T('ed_events').find(function (e) { return e.slug === a.p_slug; }); if (!ev) throw new Error('This event was not found.');
      if (!String(a.p_name || '').trim()) throw new Error('Please add your name.');
      put('ed_cards', { event_id: ev.id, name: a.p_name.trim(), phone: a.p_phone || '', email: a.p_email || '', responses: a.p_responses || [], prayer: a.p_prayer || '', status: 'new', follow_up_by: '', notes: '' });
      return null;
    },
    ed_renew_event: function (a) {
      var ev = T('ed_events').find(function (e) { return e.id === a.p_event; }); if (!ev) throw new Error('Event not found');
      if (!a.p_start) throw new Error('Pick the new first day.');
      var o = a.p_opts || {}, delta = ev.starts_on ? dayDiff(a.p_start, ev.starts_on) : 0, len = ev.starts_on && ev.ends_on ? dayDiff(ev.ends_on, ev.starts_on) : 0;
      var on = function (k, d) { return o[k] == null ? d : !!o[k]; }, mine = function (t) { return T(t).filter(function (r) { return r.event_id === ev.id; }); };
      put('ed_events', { id: ev.id, starts_on: a.p_start, ends_on: a.p_end || addDays(a.p_start, len), is_open: true });
      mine('ed_schedule').forEach(function (r) { r.on_date = addDays(r.on_date, delta); });
      mine('ed_items').forEach(function (r) { r.on_date = addDays(r.on_date, delta); });
      mine('ed_tasks').forEach(function (r) { r.done = false; r.due_on = addDays(r.due_on, delta); });
      mine('ed_agenda').forEach(function (r) { r.done = false; });
      mine('ed_event_equipment').forEach(function (r) { r.loaded = false; r.returned = false; });
      mine('ed_event_vendors').forEach(function (r) { r.paid = 0; r.pay_status = 'Not Paid'; if (r.status !== 'Cancelled') r.status = 'Quoted'; r.due_on = addDays(r.due_on, delta); });
      mine('ed_event_people').forEach(function (r) { r.pay_status = 'Not Paid'; r.due_on = addDays(r.due_on, delta); });
      if (on('clear_signups', true)) mine('ed_signups').forEach(function (r) { del('ed_signups', r.id); });
      if (on('clear_volunteers', true)) mine('ed_event_people').filter(function (r) { return r.team === 'volunteer'; }).forEach(function (r) { del('ed_event_people', r.id); });
      if (on('clear_speakers', false)) mine('ed_event_people').filter(function (r) { return r.team === 'speaker'; }).forEach(function (r) { del('ed_event_people', r.id); });
      if (on('clear_money', true)) { mine('ed_offerings').forEach(function (r) { del('ed_offerings', r.id); }); mine('ed_expenses').forEach(function (r) { del('ed_expenses', r.id); }); }
      if (on('clear_cards', false)) mine('ed_cards').forEach(function (r) { del('ed_cards', r.id); });
      if (on('clear_setlists', true)) mine('ed_setlists').forEach(function (r) { del('ed_setlists', r.id); }); else mine('ed_setlists').forEach(function (r) { r.on_date = addDays(r.on_date, delta); });
      return null;
    },
    ed_copy_event: function (a) {
      var ev = T('ed_events').find(function (e) { return e.id === a.p_event; }); if (!ev) throw new Error('Event not found');
      var delta = a.p_start && ev.starts_on ? dayDiff(a.p_start, ev.starts_on) : 0;
      var n = put('ed_events', Object.assign({}, ev, { id: uuid(), slug: slugFor(a.p_title || ev.title), title: a.p_title || ev.title, starts_on: a.p_start || ev.starts_on, ends_on: addDays(ev.ends_on, delta), sessions: (ev.sessions || []).map(function (x) { return Object.assign({}, x, { on_date: x.on_date ? addDays(x.on_date, delta) : '' }); }), notes: '', is_open: true }));
      function copy(t, f, skip) { T(t).filter(function (r) { return r.event_id === ev.id && !(skip && skip(r)); }).forEach(function (r) { put(t, Object.assign({}, r, { id: uuid(), event_id: n.id }, f ? f(r) : {})); }); }
      copy('ed_schedule', function (r) { return { on_date: addDays(r.on_date, delta) }; });
      copy('ed_items', function (r) { return { on_date: addDays(r.on_date, delta) }; });
      copy('ed_tasks', function (r) { return { done: false, due_on: addDays(r.due_on, delta) }; });
      copy('ed_agenda', function () { return { done: false, notes: '' }; });
      copy('ed_event_people', function () { return { pay_status: 'Not Paid', due_on: null }; }, function (r) { return r.team === 'volunteer'; });
      copy('ed_event_vendors', function () { return { paid: 0, pay_status: 'Not Paid', status: 'Quoted', due_on: null }; }, function (r) { return r.status === 'Cancelled'; });
      copy('ed_event_contacts');
      copy('ed_event_equipment', function () { return { loaded: false, returned: false }; });
      copy('ed_prayer', null, function (r) { return r.kind === 'intercede'; });
      return n.id;
    }
  };
  return {
    mode: 'demo',
    reset: function () { D = demoSeed(); persist(); },
    user: function () { return ok(D.me); },
    signIn: function () { return ok(D.me); }, signInGoogle: function () { return ok(D.me); }, signUp: function () { return ok(D.me); }, sendCode: function () { return ok(); }, verifyCode: function () { return ok(D.me); }, signOut: function () { return ok(); }, resetPassword: function () { return ok(); },
    myOrg: function () {
      var m = T('ed_members').find(function (x) { return x.user_id === D.me.id; }); if (!m) return ok(null);
      return ok({ org: T('ed_orgs').find(function (o) { return o.id === m.org_id; }), role: m.role, members: T('ed_members').filter(function (x) { return x.org_id === m.org_id; }), invites: T('ed_invites').filter(function (x) { return x.org_id === m.org_id; }) });
    },
    updateOrg: function (id, f) { T('ed_orgs').forEach(function (o) { if (o.id === id) Object.assign(o, f); }); persist(); return ok(); },
    notifyLog: function () { return ok([]); },
    notify: function () { return ok({ sent: 0, errors: ['The demo can’t send real texts or emails.'] }); },
    updateMe: function (oid, f) { T('ed_members').forEach(function (m) { if (m.user_id === D.me.id) Object.assign(m, f); }); persist(); return ok(); },
    changeEmail: function (e) { D.me.email = e; T('ed_members').forEach(function (m) { if (m.user_id === D.me.id) m.email = e; }); persist(); return ok(); },
    changePassword: function () { return ok(); },
    cancelInvite: function (c) { D.t.ed_invites = T('ed_invites').filter(function (x) { return x.code !== c; }); persist(); return ok(); },
    list: function (t, col, val) { return ok(T(t).filter(function (r) { return r[col] === val; })); },
    listIn: function (t, col, vals) { return ok(T(t).filter(function (r) { return vals.indexOf(r[col]) >= 0; })); },
    save: function (t, row) { var r = put(t, row); persist(); return ok(r); },
    remove: function (t, id) { del(t, id); persist(); return ok(); },
    rpc: function (name, args) { try { var v = RPC[name](args || {}); persist(); return ok(v); } catch (e) { return fail(e.message); } },
    // The demo walks through sending an email without sending anything.
    mailQueue: function (mid, oid, list) { list.forEach(function (r) { if (!T('ed_mail_rcpt').some(function (x) { return x.mailing_id === mid && x.email === r.email; })) T('ed_mail_rcpt').push({ id: uuid(), mailing_id: mid, org_id: oid, email: r.email, name: r.name, phone: r.phone, status: 'queued' }); }); persist(); return ok(); },
    mail: function (action, body) {
      if (action === 'test') return ok({ ok: true, to: D.me.email + ' (demo: nothing is really sent)' });
      var m = T('ed_mailings').find(function (x) { return x.id === body.mailing_id; }), q0 = T('ed_mail_rcpt').filter(function (x) { return x.mailing_id === body.mailing_id; });
      q0.forEach(function (x) { x.status = 'sent'; });
      if (m) { m.status = 'sent'; m.sent_at = now(); m.fields = Object.assign({}, m.fields, { stats: { sent: q0.length, failed: 0, skipped: 0 } }); }
      persist(); return ok({ ok: true, left: 0 });
    }
  };
}

/* ---------------------------------------------------------------- demo data */
function demoSeed() {
  var t = {}; function T(n) { return t[n] || (t[n] = []); }
  function add(n, row) { row = Object.assign({ id: uuid(), created_at: new Date().toISOString() }, row); T(n).push(row); return row; }
  var today = isoDay(new Date());
  var org = add('ed_orgs', { name: 'GGG Ministries', about: 'A traveling ministry holding tent revivals, worship nights and prayer gatherings across northern Illinois.', phone: '(555) 555-0100', email: 'office@example.com', website: 'example.org', address: 'PO Box 100, Waterman, IL 60556', giving_link: 'https://example.org/give', timezone: 'America/Chicago' }), O = org.id, me = { id: 'demo-user', email: 'you@example.com' };
  T('ed_members').push({ org_id: O, user_id: me.id, email: me.email, name: 'Solomon Rowland', role: 'owner', phone: '(555) 555-0100', prefs: {} }, { org_id: O, user_id: 'u2', email: 'pam@example.com', name: 'Pam Hughes', role: 'member' }, { org_id: O, user_id: 'u3', email: 'steve@example.com', name: 'Steve Moss', role: 'member' });

  // ---------- Directory
  var P = {};
  function person(name, title, groups, phone, extra) { P[name] = add('ed_people', Object.assign({ org_id: O, name: name, title: title, groups: groups, status: 'current', phone: phone || '', email: '', address: '', notes: '' }, extra || {})); return P[name]; }
  person('Pastor Solomon', 'Founder & President', ['Team Member', 'Board', 'Speaker'], '(555) 555-0100', { email: 'solomon@example.com' });
  person('Pam Hughes', 'Prayer Director', ['Team Member', 'Board', 'Prayer Team'], '(555) 555-0101', { email: 'pam@example.com' });
  person('Steve Moss', 'Events Director', ['Team Member', 'Board'], '(555) 555-0142', { email: 'steve@example.com' });
  person('Linda Grey', 'Treasurer', ['Board'], '(555) 555-0103');
  person('Jordan Mills', 'Worship Director', ['Team Member', 'Worship'], '(555) 555-0110', { notes: 'Also writes songs for the revival.' });
  person('Kayla Ross', 'Vocalist', ['Worship'], '(555) 555-0111');
  person('Andre Lewis', 'Keys', ['Worship'], '(555) 555-0112');
  person('Chris Nolan', 'Bass', ['Worship'], '(555) 555-0113');
  person('Tyler Sims', 'Drums', ['Worship'], '(555) 555-0114');
  person('Isaac Bell', 'Sound Engineer', ['Worship', 'Volunteer'], '(555) 555-0115');
  person('Megan Ward', 'Songwriter', ['Worship'], '(555) 555-0116', { status: 'previous', notes: 'Moved to Peoria in 2025.' });
  person('Evangelist David Moore', 'Guest Speaker', ['Speaker'], '(555) 610-1100', { email: 'dmoore@example.com', address: '412 Elm St, Champaign, IL' });
  person('Pastor Angela Brooks', 'Guest Speaker', ['Speaker'], '(555) 610-2200');
  person('Rev. Thomas Hale', 'Guest Speaker', ['Speaker'], '(555) 610-3300');
  person('Gary Hughes', 'Altar Counselor', ['Prayer Team', 'Volunteer'], '(555) 555-0120');
  person('Maria Lopez', '', ['Guest'], '(555) 555-0140', { email: 'maria.lopez@example.com' });
  person('The Carter Family', '', ['Guest'], '(555) 555-0141');
  person('Denise Clark', 'Altar Counselor', ['Prayer Team', 'Volunteer'], '(555) 555-0121');
  person('Robert Lane', 'Prayer Team', ['Prayer Team'], '(555) 555-0122');
  person('Victor Hayes', 'Security Lead', ['Volunteer'], '(555) 555-0123', { notes: 'Off-duty deputy' });
  person('Marcus Reed', 'Setup Crew Lead', ['Volunteer', 'Team Member'], '(555) 201-0010');
  person('Tony Alvarez', 'Setup Crew', ['Volunteer'], '(555) 201-0011');
  person('Dale Price', 'Equipment Manager', ['Volunteer'], '(555) 201-0012');
  person('Hannah Lowe', 'Kids Ministry', ['Volunteer'], '(555) 301-4001', { bg_cleared_on: addDays(today, -100) });
  person('Ray Dunn', 'Parking Lead', ['Volunteer'], '(555) 301-1001');
  person('Grace Kim', 'Greeter', ['Volunteer'], '(555) 301-2001');
  person('Aaron Webb', 'Usher Lead', ['Volunteer'], '(555) 301-3001');
  person('Ben Carter', 'Setup Crew', ['Volunteer'], '(555) 201-0013', { status: 'previous' });

  var V = {};
  function vendor(name, cat, contact, phone, extra) { V[name] = add('ed_vendors', Object.assign({ org_id: O, name: name, category: cat, contact_name: contact, phone: phone, email: '', website: '', address: '', notes: '' }, extra || {})); }
  vendor('Big Top Tent Rentals', 'Tent', 'Rick Olson', '(555) 820-1000', { email: 'rick@example.com', website: 'example.com/bigtop', address: '88 Industrial Dr, Kankakee, IL', notes: '60x120 tent with sides. Book by August.' });
  vendor('SoundWorks Audio', 'Sound And Lights', 'Dana Price', '(555) 820-2000', { website: 'example.com/soundworks' });
  vendor('Clean Flush Portables', 'Restrooms', '', '(555) 820-3000');
  vendor('Smokin’ Joe’s BBQ', 'Food', 'Joe Martin', '(555) 820-4000', { notes: 'Food truck. Gives 10% back to the ministry.' });
  vendor('Hometown Printing', 'Printing', '', '(555) 820-6000', { address: '210 Main St, Waterman, IL' });
  vendor('Party Time Rentals', 'Rentals', 'Gina', '(555) 820-5000', { notes: 'Extra chairs at $1.50 each.' });

  var C = {};
  function contact(name, organization, role, phone, extra) { C[name] = add('ed_contacts', Object.assign({ org_id: O, name: name, organization: organization, role: role, phone: phone, email: '', website: '', address: '', notes: '' }, extra || {})); }
  contact('Harold Miller', 'Miller Field', 'Landowner', '(555) 300-1200', { address: '1200 Waterman Rd, Waterman, IL', notes: 'Lets us use the field every November. Send a thank-you gift.' });
  contact('County Building Dept.', 'DeKalb County', 'Tent Permits', '(555) 300-4400', { website: 'example.gov/permits', notes: 'Permit needed for tents over 400 sq ft. Apply 30 days ahead.' });
  contact('Sheriff Non-Emergency', 'Sheriff’s Office', 'Traffic Help', '(555) 300-9111');
  contact('Pastor Mark Ellis', 'First Baptist Church', 'Partner Church', '(555) 300-7788', { email: 'mellis@example.com' });
  contact('Waterman Fire Dept.', 'Village Of Waterman', 'Fire Inspection', '(555) 300-3300');

  var E = {};
  function gear(name, qty, cat, loc, cond) { E[name] = add('ed_equipment', { org_id: O, name: name, quantity: qty, category: cat, location: loc, condition: cond || 'Good', notes: '' }); }
  gear('Folding Tables (6 ft)', 20, 'Tables And Chairs', 'Church Shed'); gear('Folding Chairs', 120, 'Tables And Chairs', 'Church Shed');
  gear('Pop-Up Canopy 10x10', 4, 'Tents', 'Trailer'); gear('Wireless Mics', 6, 'Sound', 'Sound Closet'); gear('Mixer (16 Channel)', 1, 'Sound', 'Sound Closet');
  gear('Speakers (Pair)', 2, 'Sound', 'Sound Closet'); gear('Extension Cords (100 ft)', 12, 'Power', 'Trailer'); gear('Generator 7500W', 1, 'Power', 'Trailer', 'Needs Repair');
  gear('Offering Buckets', 8, 'Ushers', 'Office'); gear('Safety Vests', 12, 'Parking', 'Trailer'); gear('Traffic Cones', 24, 'Parking', 'Trailer');
  gear('Altar Rail Sections', 6, 'Stage', 'Church Shed'); gear('Baptism Tank', 1, 'Baptism', 'Church Shed'); gear('Flashlights', 10, 'Parking', 'Office'); gear('Coffee Urns', 3, 'Hospitality', 'Kitchen');

  // ---------- Events (dates relative to today so the demo always looks current)
  function ev(title, start, len, extra) { return add('ed_events', Object.assign({ org_id: O, slug: slugFor(title), title: title, starts_on: start, ends_on: addDays(start, len), time_label: '', place: '', address: '', about: '', contact_line: '', giving_link: '', budget: 0, notes: '', sections: [], is_open: true }, extra)); }
  var revStart = addDays(today, 18);
  var rev = ev('Annual Tent Revival', revStart, 3, { time_label: 'Nightly at 7 PM', place: 'Miller Field', address: '1200 Waterman Rd, Waterman, IL', about: 'Four nights of worship, preaching and prayer under the big tent. Everyone is welcome. Bring a lawn chair if you like; seating is provided.', contact_line: 'Questions? Text Steve at (555) 555-0142.', giving_link: 'https://example.com/give', budget: 9000,
    sections: ['calendar', 'people', 'speakers', 'worship', 'volunteers', 'guests', 'vendors', 'equipment', 'food', 'tasks', 'money', 'followup', 'prayer', 'v2'], volunteer_goal: 80,
    theme: 'Let His Presence Fall', purpose: 'The purpose of this revival is to give God glory. We want to see the lost saved, the sick healed, and our town know that Jesus is alive.' });
  var R = rev.id, nights = [0, 1, 2, 3].map(function (i) { return addDays(revStart, i); });
  // calendar
  add('ed_schedule', { event_id: R, on_date: addDays(revStart, -1), start_time: '08:00', end_time: '12:00', title: 'Tent Install With Big Top Crew', location: 'Miller Field', owner: 'Marcus Reed', notes: '' });
  add('ed_schedule', { event_id: R, on_date: addDays(revStart, -1), start_time: '13:00', end_time: '16:00', title: 'Sound And Lights Load In', location: 'Main Tent', owner: 'Isaac Bell', notes: '' });
  add('ed_schedule', { event_id: R, on_date: addDays(revStart, -1), start_time: '18:30', end_time: '20:00', title: 'Volunteer Walk-Through And Prayer', location: 'Main Tent', owner: 'Steve Moss', notes: 'Pizza provided' });
  nights.forEach(function (d, i) {
    add('ed_schedule', { event_id: R, on_date: d, start_time: '17:30', end_time: '18:15', title: 'Sound Check', location: 'Main Tent', owner: 'Jordan Mills', notes: '' });
    add('ed_schedule', { event_id: R, on_date: d, start_time: '18:00', end_time: '18:45', title: 'Team Dinner', location: 'Fellowship Tent', owner: '', notes: '' });
    add('ed_schedule', { event_id: R, on_date: d, start_time: '19:00', end_time: '21:00', title: i === 3 ? 'Closing Night And Baptisms' : 'Service', location: 'Main Tent', owner: '', notes: '' });
  });
  add('ed_schedule', { event_id: R, on_date: addDays(revStart, 4), start_time: '08:00', end_time: '13:00', title: 'Teardown', location: 'Miller Field', owner: 'Marcus Reed', notes: 'Lunch provided' });
  // people
  function assign(name, team, role, extra) { return add('ed_event_people', Object.assign({ event_id: R, person_id: P[name].id, team: team, role: role, days: '', details: {}, amount: 0, pay_status: 'Not Paid', payer: '', due_on: null, notes: '' }, extra || {})); }
  assign('Steve Moss', 'leader', 'Event Director'); assign('Pastor Solomon', 'leader', 'Host'); assign('Marcus Reed', 'leader', 'Setup Lead'); assign('Dale Price', 'leader', 'Equipment');
  assign('Pam Hughes', 'team', 'Altar Counselor Lead'); assign('Gary Hughes', 'team', 'Altar Counselor'); assign('Denise Clark', 'team', 'Altar Counselor'); assign('Robert Lane', 'team', 'Prayer Team'); assign('Victor Hayes', 'team', 'Security');
  assign('Evangelist David Moore', 'speaker', 'Guest Speaker', { details: { date: nights[0], time: '7:30 PM', topic: 'Come As You Are', travel: 'Flying in the day before, needs airport pickup', lodging: 'Hampton Inn, 2 nights' }, amount: 750, payer: 'Linda Grey', due_on: nights[0] });
  assign('Pastor Angela Brooks', 'speaker', 'Guest Speaker', { details: { date: nights[1], time: '7:30 PM', topic: 'Healing Waters', travel: 'Driving', lodging: 'Staying with the Hendersons' }, amount: 500, payer: 'Linda Grey', due_on: nights[1], notes: 'Prefers water and a stool on stage.' });
  assign('Rev. Thomas Hale', 'speaker', 'Guest Speaker', { details: { date: nights[2], time: '7:30 PM', topic: '', travel: '', lodging: '' }, amount: 500, payer: 'Linda Grey', due_on: nights[2], notes: 'Waiting to confirm. Follow up this week.' });
  assign('Pastor Solomon', 'speaker', 'In-House Speaker', { details: { date: nights[3], time: '7:00 PM', topic: 'Go And Tell', travel: '', lodging: '' } });
  ['Jordan Mills', 'Kayla Ross', 'Andre Lewis', 'Chris Nolan', 'Tyler Sims', 'Isaac Bell'].forEach(function (n) { assign(n, 'worship', P[n].title, { days: 'All Nights' }); });
  ['Ray Dunn', 'Grace Kim', 'Aaron Webb', 'Hannah Lowe', 'Tony Alvarez'].forEach(function (n) { assign(n, 'volunteer', P[n].title); });
  add('ed_setlists', { event_id: R, on_date: nights[0], title: 'Night 1', rehearsal: '5:30 PM Sound Check', songs: 'Way Maker\nGoodness Of God\nGreat Are You Lord\nRevival (Altar Call)' });
  add('ed_setlists', { event_id: R, on_date: nights[1], title: 'Night 2', rehearsal: '5:30 PM Sound Check', songs: 'This Is Amazing Grace\nBuild My Life\nHoly Spirit' });
  // sign-ups
  var sort = 0;
  function item(kind, title, d, needed, notes, tl, st, et) { return add('ed_items', { event_id: R, kind: kind, title: title, on_date: d, time_label: tl || '', start_time: st || null, end_time: et || null, needed: needed, notes: notes || '', sort: sort++ }); }
  function su(it, name, phone, extra) { add('ed_signups', Object.assign({ event_id: R, item_id: it.id, name: name, phone: phone, email: '', note: '', token: token(), checked_in_at: null, party: 1 }, extra || {})); }
  var setup = item('serve', 'Setup Crew', addDays(revStart, -1), 12, 'Meet at the field. Bring work gloves.', '8 AM–12 PM', '08:00', '12:00');
  ['Marcus Reed', 'Tony Alvarez', 'Luke Harmon', 'Josh Whitfield', 'Caleb Ortiz', 'Sam Tate', 'Eli Brooks'].forEach(function (n, i) { su(setup, n, '(555) 201-00' + (20 + i)); });
  nights.forEach(function (d, i) {
    var p = item('serve', 'Parking Team', d, 4, 'Vests are in the trailer.', '6–7:30 PM', '18:00', '19:30');
    var g = item('serve', 'Greeters', d, 4, '', '6:15–7:15 PM', '18:15', '19:15');
    var u = item('serve', 'Ushers And Offering', d, 4, '', '6:30–9 PM', '18:30', '21:00');
    var k = item('serve', 'Kids Tent', d, 3, 'Ages 4–11. Meet at the kids tent.', '6:30–9 PM', '18:30', '21:00'); k.needs_check = true;
    var at = item('attend', 'Night ' + (i + 1) + ' Service', d, 400, 'Doors open at 6:30 PM.', '7 PM');
    [['The Morales Family', '(555) 501-0001', 5], ['Dorothy Pruitt', '(555) 501-0002', 1], ['Kevin And Amy Shaw', '(555) 501-0003', 2], ['Grace Fellowship Youth', '(555) 501-0004', 14], ['Walter Hines', '(555) 501-0005', 1], ['The Okafor Family', '(555) 501-0006', 4]].slice(0, 6 - i).forEach(function (r, j) { su(at, r[0], r[1], { party: r[2], checked_in_at: i === 0 && j < 2 ? new Date().toISOString() : null }); });
    su(p, 'Ray Dunn', '(555) 301-1001'); su(p, 'Eli Brooks', '(555) 301-1002'); if (i < 2) su(p, 'Sam Tate', '(555) 301-1003');
    su(g, 'Grace Kim', '(555) 301-2001'); su(g, 'Ruth Allen', '(555) 301-2002'); if (i !== 2) su(g, 'Naomi Fields', '(555) 301-2003');
    su(u, 'Aaron Webb', '(555) 301-3001'); su(u, 'Paul Greer', '(555) 301-3002'); if (i < 3) su(u, 'Mike Duval', '(555) 301-3003');
    su(k, 'Hannah Lowe', '(555) 301-4001'); if (i % 2 === 0) su(k, 'Lydia Rhodes', '(555) 301-4002');
    var m1 = item('meal', 'Team Dinner: Main Dish', d, 2, 'Feeds about 25. Drop off at the fellowship tent.', 'By 5 PM');
    var m2 = item('meal', 'Team Dinner: Sides', d, 3, '', 'By 5 PM');
    var m3 = item('meal', 'Desserts', d, 2, '', 'By 5 PM');
    su(m1, 'Brenda Cole', '(555) 401-0001', { note: 'BBQ chicken' });
    if (i < 3) su(m2, 'Teresa Hill', '(555) 401-0002', { note: 'Green beans' });
    if (i === 0) { su(m2, 'Joy Patel', '(555) 401-0003', { note: 'Mac and cheese' }); su(m3, 'Carol Fox', '(555) 401-0004', { note: 'Banana pudding' }); }
  });
  var tear = item('serve', 'Teardown Crew', addDays(revStart, 4), 12, 'Lunch provided.', '8–11 AM', '08:00', '11:00');
  ['Marcus Reed', 'Tony Alvarez', 'Dale Price'].forEach(function (n, i) { su(tear, n, '(555) 201-00' + (10 + i)); });
  // vendors and contacts
  function book(name, extra) { add('ed_event_vendors', Object.assign({ event_id: R, vendor_id: V[name].id, service: '', status: 'Booked', arrival: '', cost: 0, paid: 0, pay_status: 'Not Paid', payer: 'Linda Grey', due_on: null, notes: '' }, extra)); }
  book('Big Top Tent Rentals', { service: '60x120 Tent, Sides, 400 Chairs', arrival: 'Install the day before at 8 AM', cost: 3800, paid: 1000, pay_status: 'Deposit Paid', due_on: addDays(today, 5) });
  book('SoundWorks Audio', { service: 'Sound And Lights, 4 Nights', arrival: 'Load in the day before at 1 PM', cost: 1500, paid: 500, pay_status: 'Deposit Paid', due_on: addDays(today, 12) });
  book('Clean Flush Portables', { service: '4 Units + 1 ADA', status: 'Quoted', cost: 600, due_on: addDays(today, -2) });
  book('Smokin’ Joe’s BBQ', { service: 'Food Truck, Nights 2 And 3', cost: 0, payer: '' , pay_status: 'Paid In Full' });
  book('Hometown Printing', { service: 'Banners, Flyers, Connection Cards', cost: 420, paid: 420, pay_status: 'Paid In Full' });
  [['Harold Miller', 'Landowner'], ['County Building Dept.', 'Tent Permit'], ['Sheriff Non-Emergency', 'Traffic Help'], ['Waterman Fire Dept.', 'Fire Inspection']].forEach(function (c) { add('ed_event_contacts', { event_id: R, contact_id: C[c[0]].id, role: c[1], notes: '' }); });
  // equipment
  [['Folding Tables (6 ft)', 12, true], ['Folding Chairs', 100, true], ['Wireless Mics', 6, true], ['Mixer (16 Channel)', 1, false], ['Speakers (Pair)', 2, false], ['Extension Cords (100 ft)', 10, false], ['Generator 7500W', 1, false], ['Offering Buckets', 8, false], ['Safety Vests', 12, false], ['Traffic Cones', 24, false], ['Altar Rail Sections', 6, false], ['Baptism Tank', 1, false], ['Flashlights', 10, false], ['Coffee Urns', 2, false]]
    .forEach(function (e) { add('ed_event_equipment', { event_id: R, equipment_id: E[e[0]].id, quantity: e[1], loaded: e[2], returned: false, notes: '' }); });
  // tasks
  var TASK_AREA_SEED = { 'Apply For Tent Permit': 'Admin', 'Confirm Guest Speakers': 'Admin', 'Order Banners And Connection Cards': 'Decor', 'Book Portable Restrooms': 'Hospitality', 'Volunteer Sign-Up Push On Sunday': 'Admin',
    'Mark Tent Stakes And Utility Lines': 'Setup Crew', 'Lay Ground Cover And Set Chairs': 'Setup Crew', 'Stage, Platform Skirt And Altar Rail': 'Stage', 'Signs, Banners And Parking Cones': 'Parking',
    'Shop For Opening Night Fellowship Meal': 'Food', 'Fill Water Coolers And Ice Chests': 'Hospitality', 'Print Name Tags And Greeter Lanyards': 'Hospitality',
    'Set Out Offering Buckets And Cards': 'Hospitality', 'Serve Coffee And Water At The Welcome Tent': 'Food', 'Lock Up Sound Gear And Trailer': 'AV And Sound',
    'Stack And Count Chairs': 'Setup Crew', 'Return Equipment And Check Inventory': 'AV And Sound', 'Walk The Field For Trash': 'Setup Crew', 'Send Thank-You Texts To Volunteers': 'Admin', 'Call Every Connection Card': 'Prayer' };
  [['planning', 'Apply For Tent Permit', -25, 'Steve Moss', true], ['planning', 'Confirm Guest Speakers', -12, 'Pastor Solomon', false], ['planning', 'Order Banners And Connection Cards', -20, 'Steve Moss', true], ['planning', 'Book Portable Restrooms', -16, 'Steve Moss', false], ['planning', 'Volunteer Sign-Up Push On Sunday', -10, 'Pam Hughes', false],
   ['setup', 'Mark Tent Stakes And Utility Lines', -2, 'Marcus Reed', false], ['setup', 'Lay Ground Cover And Set Chairs', -1, 'Setup Crew', false], ['setup', 'Stage, Platform Skirt And Altar Rail', -1, 'Tony Alvarez', false], ['setup', 'Signs, Banners And Parking Cones', -1, 'Ray Dunn', false],
   ['prep', 'Shop For Opening Night Fellowship Meal', -1, 'Grace Kim', false], ['prep', 'Fill Water Coolers And Ice Chests', 0, 'Hospitality Team', false], ['prep', 'Print Name Tags And Greeter Lanyards', -2, 'Pam Hughes', false],
   ['during', 'Set Out Offering Buckets And Cards', 0, 'Aaron Webb', false], ['during', 'Serve Coffee And Water At The Welcome Tent', 0, 'Grace Kim', false], ['during', 'Lock Up Sound Gear And Trailer', 0, 'Isaac Bell', false],
   ['teardown', 'Stack And Count Chairs', 4, 'Teardown Crew', false], ['teardown', 'Return Equipment And Check Inventory', 4, 'Dale Price', false], ['teardown', 'Walk The Field For Trash', 4, 'Everyone', false],
   ['followup', 'Send Thank-You Texts To Volunteers', 6, 'Pam Hughes', false], ['followup', 'Call Every Connection Card', 7, 'Pastor Solomon', false]
  ].forEach(function (x, i) {
    var need = { 'Lay Ground Cover And Set Chairs': 6, 'Stack And Count Chairs': 8, 'Serve Coffee And Water At The Welcome Tent': 2, 'Walk The Field For Trash': 4, 'Mark Tent Stakes And Utility Lines': 2 }[x[1]] || 1;
    var who = (P[x[3]] ? [x[3]] : []).concat({ 'Serve Coffee And Water At The Welcome Tent': ['Hannah Lowe'], 'Mark Tent Stakes And Utility Lines': ['Ray Dunn'] }[x[1]] || []);
    add('ed_tasks', { event_id: R, phase: x[0], area: TASK_AREA_SEED[x[1]] || '', title: x[1], due_on: addDays(revStart, x[2]), due_time: '', task_owner: x[0] === 'planning' || x[0] === 'followup' ? 'Pastor Solomon' : 'Steve Moss', owner: who.length ? who.join(', ') : x[3], assignee_refs: who.map(function (w) { return 'ed_people:' + P[w].id; }), needed: need, done: x[4], notes: '', sort: i });
  });
  add('ed_expenses', { event_id: R, description: 'Water And Ice', category: 'Hospitality', amount: 180, pay_status: 'Paid In Full', payer: 'Steve Moss', due_on: null, notes: '' });
  add('ed_expenses', { event_id: R, description: 'Tent Permit Fee', category: 'Permits', amount: 75, pay_status: 'Not Paid', payer: 'Linda Grey', due_on: addDays(today, 3), notes: '' });

  // last year's offering history is cleared on renew, so the demo shows cards from a recent outreach instead
  var night = ev('Worship Night', addDays(today, 6), 0, { time_label: '7 PM', place: 'Main Sanctuary', about: 'An evening of worship and prayer. Come as you are.', giving_link: 'https://example.com/give', budget: 300, sections: ['calendar', 'people', 'equipment', 'tasks', 'money', 'followup'] });
  ['Jordan Mills', 'Andre Lewis', 'Isaac Bell', 'Kayla Ross'].forEach(function (n) { add('ed_event_people', { event_id: night.id, person_id: P[n].id, team: 'worship', role: P[n].title, days: '', details: {}, amount: 0, pay_status: 'Not Paid', payer: '', due_on: null, notes: '' }); });
  add('ed_event_people', { event_id: night.id, person_id: P['Pam Hughes'].id, team: 'team', role: 'Prayer Team', days: '', details: {}, amount: 0, pay_status: 'Not Paid', payer: '', due_on: null, notes: '' });
  add('ed_schedule', { event_id: night.id, on_date: night.starts_on, start_time: '18:00', end_time: '18:45', title: 'Rehearsal', location: 'Sanctuary', owner: 'Jordan Mills', notes: '' });
  add('ed_schedule', { event_id: night.id, on_date: night.starts_on, start_time: '19:00', end_time: '20:30', title: 'Worship Night', location: 'Sanctuary', owner: '', notes: '' });
  add('ed_setlists', { event_id: night.id, on_date: night.starts_on, title: 'Worship Night', rehearsal: '6 PM', songs: 'O Come To The Altar\nGoodness Of God\nWhat A Beautiful Name\nHoly Forever' });
  [['Wireless Mics', 4], ['Speakers (Pair)', 1], ['Mixer (16 Channel)', 1], ['Coffee Urns', 1]].forEach(function (e) { add('ed_event_equipment', { event_id: night.id, equipment_id: E[e[0]].id, quantity: e[1], loaded: false, returned: false, notes: '' }); });
  add('ed_tasks', { event_id: night.id, phase: 'setup', area: 'Hospitality', title: 'Set Up Coffee Bar', due_on: night.starts_on, due_time: '6 PM', owner: 'Grace Kim', done: false, notes: '', sort: 0 });

  var board = ev('Monthly Board Meeting', addDays(today, 2), 0, { time_label: '7 PM', place: 'Fellowship Room', sections: ['calendar', 'people', 'agenda', 'tasks', 'food', 'v2'] });
  [['Opening Prayer', 'Pastor Solomon', 5], ['Tent Revival Plan And Budget', 'Steve Moss', 20], ['Treasurer’s Report', 'Linda Grey', 10], ['Follow-Up On New Believers', 'Pam Hughes', 15], ['Spring Outreach Ideas', 'Pastor Solomon', 15], ['Closing Prayer', '', 5]]
    .forEach(function (a, i) { add('ed_agenda', { event_id: board.id, title: a[0], leader: a[1], minutes: a[2], done: false, notes: '', sort: i }); });
  ['Pastor Solomon', 'Pam Hughes', 'Steve Moss', 'Linda Grey'].forEach(function (n) { add('ed_event_people', { event_id: board.id, person_id: P[n].id, team: 'leader', role: 'Board', days: '', details: {}, amount: 0, pay_status: 'Not Paid', payer: '', due_on: null, notes: '' }); });
  add('ed_tasks', { event_id: board.id, phase: 'planning', area: 'Admin', title: 'Print Agenda And Treasurer’s Report', due_on: addDays(today, 1), due_time: '', task_owner: 'Pastor Solomon', owner: 'Linda Grey', assignee_refs: ['ed_people:' + P['Linda Grey'].id], needed: 1, done: false, notes: '', sort: 0 });
  add('ed_items', { event_id: board.id, kind: 'meal', title: 'Snacks And Coffee', on_date: board.starts_on, time_label: '6:45 PM', needed: 1, notes: '', sort: 0 });

  // tomorrow: a small serve day, so reminders have something to send
  var pantry = ev('Community Food Pantry', addDays(today, 1), 0, { time_label: '9 AM–12 PM', place: 'Fellowship Hall', address: '410 Main St, Waterman, IL', about: 'Groceries for any family who needs them.', sections: ['volunteers', 'tasks', 'v2'], volunteer_goal: 8 });
  [['Sorting And Packing', '8:30–10 AM', '08:30', '10:00', 4, [['Ray Dunn', '(555) 301-1001'], ['Grace Kim', '(555) 301-2001'], ['Aaron Webb', '(555) 301-3001']]], ['Carry-Out Helpers', '10 AM–12 PM', '10:00', '12:00', 3, [['Eli Brooks', '(555) 301-1002'], ['Hannah Lowe', '(555) 301-4001']]]].forEach(function (s, k) {
    var it = add('ed_items', { event_id: pantry.id, kind: 'serve', title: s[0], on_date: pantry.starts_on, time_label: s[1], start_time: s[2], end_time: s[3], needed: s[4], notes: '', sort: k });
    s[5].forEach(function (x) { add('ed_signups', { event_id: pantry.id, item_id: it.id, name: x[0], phone: x[1], email: '', note: '', token: token(), checked_in_at: null, party: 1 }); });
  });
  add('ed_tasks', { event_id: pantry.id, phase: 'planning', area: 'Hospitality', title: 'Pick Up Bread Donation From Miller’s Bakery', due_on: addDays(today, 1), due_time: '7:30 AM', task_owner: 'Pastor Solomon', owner: 'Steve Moss', assignee_refs: ['ed_people:' + P['Steve Moss'].id], needed: 1, done: false, notes: '', sort: 0 });

  var prayer = ev('Prayer Night', today, 0, { time_label: '6:30 PM', place: 'Prayer Room', sections: ['people', 'agenda', 'followup', 'calendar', 'tasks', 'volunteers', 'guests', 'prayer', 'v2'], theme: 'Ask, Seek, Knock' });
  [['18:00', 'Prayer Team Huddle', 'Pastor’s Office'], ['18:30', 'Worship And Open Prayer', 'Prayer Room'], ['19:15', 'Prayer Stations', 'Prayer Room'], ['20:00', 'Closing And Coffee', 'Fellowship Hall']].forEach(function (s, i) { add('ed_schedule', { event_id: prayer.id, on_date: today, start_time: s[0], end_time: '', title: s[1], location: s[2], owner: '', notes: '' }); });
  var pr = add('ed_items', { event_id: prayer.id, kind: 'attend', title: 'Prayer Night', on_date: today, time_label: '6:30 PM', needed: 40, notes: '', sort: 0 });
  [['Maria Lopez', '(555) 555-0140', 1], ['The Carter Family', '(555) 555-0141', 4], ['Ruth Ellis', '(555) 555-0150', 2]].forEach(function (x, k) { add('ed_signups', { event_id: prayer.id, item_id: pr.id, name: x[0], phone: x[1], email: '', note: '', token: token(), checked_in_at: k === 0 ? new Date().toISOString() : null, party: x[2] }); });
  ['Pam Hughes', 'Robert Lane', 'Gary Hughes'].forEach(function (n) { add('ed_event_people', { event_id: prayer.id, person_id: P[n].id, team: 'team', role: 'Prayer Team', days: '', details: {}, amount: 0, pay_status: 'Not Paid', payer: '', due_on: null, notes: '' }); });
  [['Opening Prayer', 'Pastor Solomon', 5, '18:30'], ['Worship', 'Kayla Ross', 25, '18:35'], ['Housekeeping And Prayer Stations', 'Maria Lopez', 5, '19:00'], ['Pray For The Revival And Its Speakers', 'Pam Hughes', 20, '19:15'], ['Our Town, Schools And Leaders', 'Robert Lane', 20, '19:35'], ['Closing Prayer', 'Pastor Solomon', 5, '19:55']].forEach(function (a, i) { add('ed_agenda', { event_id: prayer.id, title: a[0], leader: a[1], leader_ref: P[a[1]] ? 'ed_people:' + P[a[1]].id : '', start_time: a[3], minutes: a[2], done: false, notes: '', sort: i }); });

  // prayer: scripture, declarations and what the prayer team is interceding for (none of it gets checked off)
  function pray(evId, kind, title, extra) { return add('ed_prayer', Object.assign({ event_id: evId, kind: kind, title: title, body: '', person_id: null, follow_up_on: null, answer: '', private: false, sort: 0 }, extra || {})); }
  [['2 Chronicles 7:14', 'If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land.'],
   ['Psalm 22:3', 'Yet you are holy, enthroned on the praises of Israel.'],
   ['Habakkuk 3:2', 'Lord, I have heard of your fame; I stand in awe of your deeds, Lord. Repeat them in our day, in our time make them known.']].forEach(function (v, i) { pray(R, 'verse', v[0], { body: v[1], sort: i }); });
  ['This revival is for the glory of God, not the glory of man.', 'The presence of the Lord will fill this tent every night.', 'The truth will come out, and the Lord will reveal Himself to this town.', 'The lost will be saved, the sick will be healed, and the bound will go free.', 'Every volunteer and every family will be covered and protected.', 'The weather is in His hands. The tent will stand.'].forEach(function (t, i) { pray(R, 'declare', t, { sort: i }); });
  pray(R, 'intercede', 'Healing for her mom, Rosa', { person_id: P['Maria Lopez'].id, body: 'Rosa has been in the hospital since last week. Maria asked us to keep praying.', follow_up_on: addDays(today, -1), sort: 0 });
  pray(R, 'intercede', 'Salvation for his two sons', { person_id: P['Tony Alvarez'].id, body: 'Tony is inviting them to Night 2.', sort: 1 });
  pray(R, 'intercede', 'Clear weather all four nights', { sort: 2 });
  pray(R, 'intercede', 'Strength and a fresh word for the speakers', { body: 'Evangelist David Moore, Pastor Angela Brooks and Rev. Thomas Hale.', sort: 3 });
  pray(R, 'intercede', 'A new job', { person_id: P['Denise Clark'].id, follow_up_on: addDays(today, 5), private: true, sort: 4 });
  pray(R, 'intercede', 'The permit for Miller Field to be approved', { answer: 'Approved in one week. The city waived the fee.', sort: 5 });
  pray(prayer.id, 'verse', 'Matthew 7:7', { body: 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.' });
  pray(prayer.id, 'declare', 'Our town will be covered in prayer.');
  pray(prayer.id, 'intercede', 'Healing for Rosa', { person_id: P['Maria Lopez'].id, sort: 0 });
  pray(prayer.id, 'intercede', 'The schools and teachers in our town', { sort: 1 });

  var outreach = ev('Summer Park Outreach', addDays(today, -110), 0, { time_label: '10 AM–2 PM', place: 'City Park Pavilion', about: 'Free lunch, kids games and prayer.', budget: 800, sections: [], debrief: 'Ran out of hot dogs by 12:30. Plan for 300, not 200. The bounce house drew families in; book it again. Start setup at 8, not 9. Need a shade tent for the prayer table.' });
  add('ed_offerings', { event_id: outreach.id, service: 'Outreach', on_date: outreach.starts_on, cash: 240, checks: 150, online: 85, other: 0, counter1: 'Aaron Webb', counter2: 'Linda Grey', deposited: true, notes: '' });
  add('ed_expenses', { event_id: outreach.id, description: 'Hot Dogs And Drinks', category: 'Food', amount: 310, pay_status: 'Paid In Full', payer: 'Steve Moss', due_on: null, notes: '' });
  [['Jessica Turner', '(555) 900-1001', ['I gave my life to Jesus'], 'For my husband to come next time.', 'new', 'Pam Hughes'],
   ['Derrick Shaw', '(555) 900-1002', ['I recommitted my life to Jesus', 'I’m looking for a church home'], '', 'contacted', 'Steve Moss'],
   ['Maria Lopez', '', ['I’d like someone to pray with me'], 'Healing for my mom, Rosa.', 'new', ''],
   ['Kevin Grant', '(555) 900-1004', ['I gave my life to Jesus', 'I’d like to be baptized'], '', 'connected', 'Pastor Solomon']
  ].forEach(function (c, k) { add('ed_cards', { event_id: outreach.id, name: c[0], phone: c[1], email: '', responses: c[2], prayer: c[3], status: c[4], follow_up_by: c[5], follow_up_ref: P[c[5]] ? 'ed_people:' + P[c[5]].id : '', follow_up_on: c[4] === 'connected' ? null : addDays(today, k ? 3 : -2), notes: '' }); });

  var y = new Date().getFullYear();
  add('ed_budget', { org_id: O, year: y, name: 'Annual Tent Revival', planned: 9000, event_id: R, notes: '' });
  add('ed_budget', { org_id: O, year: y, name: 'Worship Nights', planned: 1200, event_id: null, notes: 'Snacks and sound for 4 nights a year' });
  add('ed_budget', { org_id: O, year: y, name: 'Outreach Supplies', planned: 1500, event_id: null, notes: '' });
  add('ed_budget', { org_id: O, year: y, name: 'Equipment Repairs', planned: 600, event_id: null, notes: 'Generator needs a carburetor.' });
  return { me: me, t: t };
}
