/* Tent & Table: designed emails for an event (invite, photo story, letter, reminder, thank-you).
   The logo comes from the ministry profile; the date, place and words come from the event.
   mailHtml() builds the email; the rest is the screen for writing, previewing and sending one.
   Real sending goes through the ed-mail function (see supabase/EMAIL.md); the demo only pretends. */
var MAIL_TPL = [
  ['invite', 'Invitation', 'A classic invite with your logo, the details and a big button.'],
  ['photo', 'Photo Story', 'Leads with a large photo, then your heart for this year.'],
  ['letter', 'Personal Letter', 'Reads like a note from your ministry. Simple and warm.'],
  ['reminder', 'Reminder', 'Big date up top. For the week before.'],
  ['thanks', 'Thank You', 'For after the event: thanks, photos and what’s next.']
];
var MAIL_LINKS = [['r', 'RSVP page'], ['v', 'Volunteer sign-up'], ['e', 'Event page (RSVP and volunteer)'], ['give', 'Online giving link']];
var MAIL_RED = '#D7131D', MAIL_INK = '#121417', MAIL_MUTED = '#5E6570';

function mailEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function mailParas(s, style) { return String(s || '').split(/\n\s*\n|\n/).map(function (p) { return p.trim(); }).filter(Boolean).map(function (p) { return '<p style="margin:0 0 14px;' + style + '">' + mailEsc(p) + '</p>'; }).join(''); }

/* d: { org:{name,logo,address,email,phone,website}, ev:{title,when,time,where,address,start}, headline, message, button, url, photos:[url] }
   Left in for the sender to fill per person: {{first_name}}, {{guest}} (added to links), {{unsub_url}}. */
function mailHtml(tpl, d) {
  var o = d.org || {}, e = d.ev || {}, ph = (d.photos || []).filter(Boolean).slice(0, 3);
  var sans = 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;', serif = 'font-family:Georgia,Times New Roman,serif;';
  var logo = function (h, light) { return o.logo ? '<img src="' + mailEsc(o.logo) + '" alt="' + mailEsc(o.name) + '" height="' + h + '" style="height:' + h + 'px;width:auto;max-width:220px;border:0;display:inline-block;border-radius:8px">' : '<span style="' + serif + 'font-size:22px;font-weight:bold;color:' + (light ? '#ffffff' : MAIL_INK) + '">' + mailEsc(o.name) + '</span>'; };
  var btn = function (dark) { return d.button && d.url ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 4px"><tr><td align="center" bgcolor="' + (dark ? MAIL_INK : MAIL_RED) + '" style="border-radius:999px"><a href="' + mailEsc(d.url) + '" style="display:inline-block;padding:14px 34px;' + sans + 'font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px">' + mailEsc(d.button) + '</a></td></tr></table>' : ''; };
  var details = function () {
    var r = [['When', [e.when, e.time].filter(Boolean).join(' · ')], ['Where', [e.where, e.address].filter(Boolean).join(', ')]].filter(function (x) { return x[1]; });
    return r.length ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FCF3F3;border-radius:12px;margin:6px 0 20px">' + r.map(function (x, i) {
      return '<tr><td style="padding:' + (i ? '0' : '14px') + ' 18px ' + (i === r.length - 1 ? '14px' : '10px') + ';' + sans + 'font-size:15px;line-height:1.45;color:' + MAIL_INK + '"><span style="display:block;font-size:11px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:' + MAIL_RED + '">' + x[0] + '</span>' + mailEsc(x[1]) + '</td></tr>';
    }).join('') + '</table>' : '';
  };
  var img = function (u, w) { return '<img src="' + mailEsc(u) + '" alt="" width="' + w + '" style="width:100%;max-width:' + w + 'px;height:auto;display:block;border:0;border-radius:10px">'; };
  var photoRow = function (list) {
    if (!list.length) return '';
    if (list.length === 1) return '<div style="margin:4px 0 20px">' + img(list[0], 536) + '</div>';
    var w = Math.floor((536 - 8 * (list.length - 1)) / list.length);
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px"><tr>' + list.map(function (u, i) { return '<td width="' + Math.round(100 / list.length) + '%" valign="top" style="padding-' + (i ? 'left' : 'right') + ':' + (i && i < list.length - 1 ? '4px;padding-right:4px' : '4px') + '">' + img(u, w) + '</td>'; }).join('') + '</tr></table>';
  };
  var body = 'font-size:16px;line-height:1.6;color:#2B3037;' + sans, h1 = function (color, size) { return '<h1 style="margin:0 0 12px;' + serif + 'font-size:' + (size || 30) + 'px;line-height:1.2;font-weight:bold;color:' + (color || MAIL_INK) + '">' + mailEsc(d.headline || e.title) + '</h1>'; };
  var eyebrow = function (t, color) { return '<div style="' + sans + 'font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:' + (color || MAIL_RED) + ';margin:0 0 8px">' + mailEsc(t) + '</div>'; };
  var top = '', inner = '';
  if (tpl === 'photo') {
    top = '<tr><td align="center" style="padding:22px 32px 16px">' + logo(48) + '</td></tr>' + (ph[0] ? '<tr><td><img src="' + mailEsc(ph[0]) + '" alt="" width="600" style="width:100%;max-width:600px;height:auto;display:block;border:0"></td></tr>' : '');
    inner = eyebrow(o.name) + h1() + mailParas(d.message, body) + photoRow(ph.slice(1)) + details() + btn();
  } else if (tpl === 'letter') {
    top = '<tr><td style="padding:30px 32px 0">' + logo(44) + '</td></tr>';
    inner = '<p style="margin:0 0 14px;' + serif + 'font-size:18px;line-height:1.6;color:' + MAIL_INK + '">Dear {{first_name}},</p>' + mailParas(d.message, serif + 'font-size:17px;line-height:1.7;color:#2B3037') +
      '<p style="margin:0 0 20px;' + serif + 'font-size:17px;line-height:1.6;color:' + MAIL_INK + '">With love,<br><b>' + mailEsc(o.name) + '</b></p>' + '<div style="border-top:1px solid #E7E2DC;margin:0 0 18px"></div>' +
      '<div style="' + serif + 'font-size:20px;font-weight:bold;color:' + MAIL_INK + ';margin:0 0 10px">' + mailEsc(d.headline || e.title) + '</div>' + details() + photoRow(ph) + btn(true);
  } else if (tpl === 'reminder') {
    var dt0 = e.start ? new Date(e.start + 'T12:00:00') : null;
    top = '<tr><td align="center" bgcolor="' + MAIL_RED + '" style="padding:26px 32px 28px;background:' + MAIL_RED + '">' + logo(44, true) + '<div style="' + sans + 'font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#FFD9DB;margin:16px 0 10px">It’s Almost Here</div>' +
      (dt0 ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" bgcolor="#ffffff" style="border-radius:14px;padding:10px 22px"><div style="' + sans + 'font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:' + MAIL_RED + '">' + dt0.toLocaleDateString('en-US', { month: 'short' }) + '</div><div style="' + serif + 'font-size:42px;line-height:1;font-weight:bold;color:' + MAIL_INK + '">' + dt0.getDate() + '</div></td></tr></table>' : '') + '</td></tr>';
    inner = h1() + details() + mailParas(d.message, body) + photoRow(ph) + btn();
  } else if (tpl === 'thanks') {
    top = '<tr><td align="center" bgcolor="' + MAIL_INK + '" style="padding:30px 32px;background:' + MAIL_INK + '">' + logo(44, true) + '<div style="' + serif + 'font-size:34px;font-weight:bold;color:#ffffff;margin:16px 0 0">Thank You</div></td></tr>';
    inner = eyebrow(e.title) + '<div style="' + serif + 'font-size:24px;line-height:1.25;font-weight:bold;color:' + MAIL_INK + ';margin:0 0 12px">' + mailEsc(d.headline || 'Look what God did') + '</div>' + mailParas(d.message, body) + photoRow(ph) + btn();
  } else {
    top = '<tr><td align="center" bgcolor="' + MAIL_RED + '" style="padding:26px 32px;background:' + MAIL_RED + '">' + logo(52, true) + '</td></tr>';
    inner = '<div style="text-align:center">' + eyebrow('You’re Invited') + h1(null, 32) + '</div>' + details() + mailParas(d.message, body) + photoRow(ph) + btn();
  }
  var foot = [o.name, o.address].filter(Boolean).map(mailEsc).join(' · ') + '<br>' + [o.phone, o.email, o.website].filter(Boolean).map(mailEsc).join(' · ');
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + mailEsc(d.subject || d.headline || e.title) + '</title></head>' +
    '<body style="margin:0;padding:0;background:#F5F3F0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F3F0" style="background:#F5F3F0"><tr><td align="center" style="padding:24px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">' + top +
    '<tr><td style="padding:28px 32px 30px">' + inner + '</td></tr></table>' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px"><tr><td align="center" style="padding:18px 24px;' + sans + 'font-size:12px;line-height:1.6;color:' + MAIL_MUTED + '">' + foot +
    '<br>You’re getting this because you’re in our contacts. <a href="{{unsub_url}}" style="color:' + MAIL_MUTED + ';text-decoration:underline">Unsubscribe</a></td></tr></table>' +
    '</td></tr></table></body></html>';
}

/* ---------------------------------------------------------------- what goes in, from the event */
function mailEvData(e) {
  return { title: e.title, when: fmtRange(e.starts_on, e.ends_on), time: e.time_label || '', where: e.place || '', address: e.address || '', start: e.starts_on || '' };
}
function mailLink(e, k) {
  if (k === 'give') return e.giving_link || (org() || {}).giving_link || '';
  return location.href.split('#')[0].split('?')[0] + (DB.mode === 'demo' && !window.ED_DEMO ? '?demo' : '') + '#/' + k + '/' + e.slug + '{{guest}}';
}
function mailDefaults(tpl, e) {
  var heart = [e.theme ? '“' + e.theme + '”' : '', e.purpose, !e.purpose ? e.about : ''].filter(Boolean).join('\n\n');
  var when = fmtRange(e.starts_on, e.ends_on);
  var D = {
    invite: { subject: 'You’re invited: ' + e.title, headline: e.title, message: heart || 'We would love to have you with us. Come as you are, and bring someone with you.', button: 'RSVP', link: 'r' },
    photo: { subject: e.title + ' is coming' + (when ? ' ' + when : ''), headline: e.theme || e.title, message: (e.theme ? [e.purpose, !e.purpose ? e.about : ''].filter(Boolean).join('\n\n') : heart) || 'Here is our heart for this year, and a look back at what God did last time.', button: 'Save My Seat', link: 'r' },
    letter: { subject: 'A note about ' + e.title, headline: e.title, message: heart || 'We wanted to write to you personally and invite you to be part of this.', button: 'Let Us Know You’re Coming', link: 'r' },
    reminder: { subject: 'Almost here: ' + e.title, headline: e.title, message: 'We’re getting close, and we can’t wait to see you. Bring a friend, and come expecting.', button: 'RSVP Or Update', link: 'r' },
    thanks: { subject: 'Thank you from ' + ((org() || {}).name || 'all of us'), headline: 'Look what God did', message: 'Thank you for being part of ' + e.title + '. We are so grateful for everyone who came, served, gave and prayed.', button: 'Give', link: 'give' }
  };
  return D[tpl] || D.invite;
}

/* ---------------------------------------------------------------- who gets it */
// Everyone who can get a group email: contacts with an email who haven't opted out, plus this event's
// sign-ups who said it's okay to contact them. One row per email address, each with the labels it can be picked by.
function mailPool(e) {
  var seen = {}, list = [];
  var add = function (name, email, phone, tags, src) {
    var em = String(email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { if (src && name) list.push({ email: '', src: src, name: name, phone: phone || '', tags: tags.filter(Boolean) }); return; }
    var r = seen[em]; if (!r) { r = seen[em] = { email: em, name: name || em, phone: phone || '', tags: [] }; list.push(r); }
    tags.forEach(function (t) { if (t && r.tags.indexOf(t) < 0) r.tags.push(t); });
  };
  T('ed_people').forEach(function (p) { if (!p.no_email && p.status !== 'previous') add(p.name, p.email, p.phone, (p.groups || []).length ? p.groups : ['Contact'], 'ed_people:' + p.id); });
  T('ed_vendors').forEach(function (v) { add(v.contact_name || v.name, v.email, v.phone, ['Vendor'], 'ed_vendors:' + v.id); });
  T('ed_contacts').forEach(function (c) { add(c.name, c.email, c.phone, ['Other'], 'ed_contacts:' + c.id); });
  if (e) {
    var its = evRows('ed_items', e).map(function (i) { return i.id; });
    evRows('ed_signups', e).forEach(function (s) { if (its.indexOf(s.item_id) >= 0 && s.consent) add(s.name, s.email, s.phone, ['Signed Up For This Event']); });
  }
  list.sort(function (x, y) { return x.name.localeCompare(y.name); });
  var out = list.filter(function (r) { return r.email; }); out.missing = list.filter(function (r) { return !r.email; });
  return out;
}
// Invites go to volunteers and guests. Team, board, speakers, worship, vendors and other contacts stay out of the list until asked for.
var MAIL_CORE = ['Volunteer', 'Guest', 'Signed Up For This Event'];
function mailCore(r) { return r.tags.some(function (t) { return MAIL_CORE.indexOf(t) >= 0; }); }
function mailShown(list) { return S.mailWide ? list : list.filter(mailCore); }
function mailTags(pool) { var c = {}; pool.forEach(function (r) { r.tags.forEach(function (t) { c[t] = (c[t] || 0) + 1; }); }); return Object.keys(c).sort().map(function (t) { return [t, c[t]]; }); }
// Who is picked is kept as a set of emails while editing (S.mailSel) and saved compactly with the draft.
function mailSelLoad(m, pool) {
  var f = m.fields || {}, sel = {};
  if (f.to === 'all') pool.forEach(function (r) { sel[r.email] = 1; });
  else if (Array.isArray(f.to)) f.to.forEach(function (x) { sel[x] = 1; });
  else if (Array.isArray(f.not)) { var no = {}; f.not.forEach(function (x) { no[x] = 1; }); pool.forEach(function (r) { if (!no[r.email]) sel[r.email] = 1; }); }
  return sel;
}
function mailSelSave(m, pool) {
  var sel = S.mailSel || {}, on = pool.filter(function (r) { return sel[r.email]; }).map(function (r) { return r.email; }), off = pool.filter(function (r) { return !sel[r.email]; }).map(function (r) { return r.email; });
  delete m.fields.to; delete m.fields.not;
  if (pool.length && !off.length) m.fields.to = 'all'; else if (off.length < on.length) m.fields.not = off; else m.fields.to = on;
  m.audience = on.length + ' picked';
}
function mailPicked(pool) { var sel = S.mailSel || {}; return pool.filter(function (r) { return sel[r.email]; }); }

/* ---------------------------------------------------------------- the screen */
function mailList(e) {
  var ms = T('ed_mailings').filter(function (m) { return m.event_id === e.id; }).sort(function (a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); });
  return secHead('Email', '<button class="btn sm" data-a="mail-new">' + IC.plus + ' New Email</button>') +
    '<p class="small muted" style="margin:0 0 10px">Send a designed email to your contacts: an invite, a reminder or a thank-you. It uses your ministry logo and this event’s details.</p>' +
    (ms.length ? '<div class="list">' + ms.map(function (m) {
      var st = (m.fields || {}).stats || {}, name = (MAIL_TPL.find(function (t) { return t[0] === m.template; }) || [, 'Email'])[1];
      return row({ act: 'mail-open', id: m.id, lead: '<span class="docic">' + IC.mail + '</span>', title: esc(m.subject || name), sub: esc(name + ' · ' + (m.status === 'sent' ? 'Sent to ' + plural(st.sent || 0, 'person', 'people') + (m.sent_at ? ' on ' + fmtDay(m.sent_at.slice(0, 10)) : '') : m.status === 'sending' ? 'Sending… tap to finish' : 'Draft')), right: m.status === 'sent' ? pill('Sent', 'green') : m.status === 'sending' ? pill('Sending', 'amber') : pill('Draft') });
    }).join('') + '</div>' : '<div class="empty card">No emails yet. Start with an invitation.</div>');
}
function mailRead() {
  var m = S.mail, root = document.querySelector('#layer .sheet'); if (!m || !root || !root.querySelector('#ml_subject')) return;
  m.subject = root.querySelector('#ml_subject').value.trim(); m.fields.headline = root.querySelector('#ml_headline').value.trim();
  m.fields.message = root.querySelector('#ml_message').value.trim(); m.fields.button = root.querySelector('#ml_button').value.trim();
  m.fields.link = root.querySelector('#ml_link').value;
}
function mailData(m, forSend) {
  var e = byId('ed_events', m.event_id) || S.ev, o = org() || {};
  return { org: { name: o.name, logo: forSend && m._logo ? m._logo : o.logo, address: o.address, email: o.email, phone: o.phone, website: o.website }, ev: mailEvData(e),
    subject: m.subject, headline: m.fields.headline, message: m.fields.message, button: m.fields.button, url: mailLink(e, m.fields.link || 'r'), photos: m.fields.photos || [] };
}
function mailPreviewHtml(m) {
  var me = myMember(), first = String(me.name || 'Friend').split(' ')[0];
  return mailHtml(m.template, mailData(m)).replace(/\{\{first_name\}\}/g, mailEsc(first)).replace(/\{\{guest\}\}/g, '').replace(/\{\{unsub_url\}\}/g, '#');
}
function mailSheet() {
  var m = S.mail, e = byId('ed_events', m.event_id) || S.ev, pool = mailPool(e), picked = mailPicked(pool), sent = m.status === 'sent';
  if (S.mailView === 'preview') {
    return '<h3>Preview</h3><p class="lead">This is what people will see. Subject: <b>' + esc(m.subject) + '</b></p><iframe class="mailframe" title="Email preview" sandbox="" srcdoc="' + esc(mailPreviewHtml(m)) + '"></iframe>' +
      '<div class="acts"><span class="grow"></span><button class="btn plain" data-a="mail-view" data-id="edit">Back To Editing</button></div>';
  }
  if (S.mailView === 'pick') {
    var sel = S.mailSel || {}, vis = mailShown(pool), miss = mailShown(pool.missing), rest = pool.length + pool.missing.length - vis.length - miss.length;
    var tags = mailTags(vis).filter(function (t) { return S.mailWide || MAIL_CORE.indexOf(t[0]) >= 0; }), visOn = vis.filter(function (r) { return sel[r.email]; }).length, allOn = vis.length && visOn === vis.length;
    var tagOf = function (r) { return '<span class="mp-tag">' + esc(r.tags[0] || '') + (r.tags.length > 1 ? ' +' + (r.tags.length - 1) : '') + '</span>'; };
    return '<h3>Send To</h3><p class="lead">' + (S.mailWide ? 'Showing all your contacts.' : 'Showing volunteers and guests.') + ' Tap names one at a time, or use the buttons to pick a whole group. <b id="ml_count">' + picked.length + ' picked</b></p>' +
      '<div class="pickchips"><button class="chip' + (allOn ? ' on' : '') + '" data-a="mail-pick-all" aria-pressed="' + !!allOn + '">' + (S.mailWide ? 'Everyone' : 'All Listed') + ' · ' + vis.length + '</button>' + tags.map(function (t) {
        var g = vis.filter(function (r) { return r.tags.indexOf(t[0]) >= 0; }), on = g.every(function (r) { return sel[r.email]; });
        return '<button class="chip' + (on ? ' on' : '') + '" data-a="mail-pick-tag" data-id="' + esc(t[0]) + '" aria-pressed="' + on + '">' + esc(t[0]) + ' · ' + t[1] + '</button>';
      }).join('') + (picked.length ? '<button class="chip clear" data-a="mail-pick-none">Clear All</button>' : '') + '</div>' +
      (vis.length + miss.length > 8 ? '<input class="inp" type="search" id="ml_q" placeholder="Search names or emails" aria-label="Search names or emails" autocomplete="off">' : '') +
      (vis.length ? '<div class="mailpick" role="group" aria-label="Contacts">' + vis.map(function (r) {
        return '<label class="mprow" data-q="' + esc((r.name + ' ' + r.email + ' ' + r.tags.join(' ')).toLowerCase()) + '"><input type="checkbox" data-mail-pick="' + esc(r.email) + '"' + (sel[r.email] ? ' checked' : '') + '><span class="mp-main"><b>' + esc(r.name) + '</b><span>' + esc(r.email) + '</span></span>' + tagOf(r) + '</label>';
      }).join('') + '</div>' : '<div class="empty card">' + (S.mailWide ? 'No contacts with an email address yet.' : 'No volunteers or guests with an email address yet.') + '</div>') +
      (miss.length ? '<div class="grouplbl">No Email Yet · ' + miss.length + '</div><p class="small muted">These contacts can’t get an email until they have an address. Type one in and it’s saved to the contact.</p><div class="mailpick" role="group" aria-label="Contacts with no email">' + miss.map(function (r) {
        return '<div class="mprow noem" data-q="' + esc((r.name + ' ' + r.tags.join(' ')).toLowerCase()) + '"><span class="mp-main"><b>' + esc(r.name) + '</b><input class="inp mp-add" type="email" inputmode="email" autocomplete="off" autocapitalize="off" placeholder="Add email" aria-label="Email for ' + esc(r.name) + '" data-mail-addem="' + esc(r.src) + '"></span>' + tagOf(r) + '</div>';
      }).join('') + '</div>' : '') +
      '<p class="small muted" id="ml_none" hidden>No one matches that search.</p>' +
      (S.mailWide ? '<button type="button" class="btn ghost block" data-a="mail-wide">Show Only Volunteers And Guests</button>' : rest > 0 ? '<button type="button" class="btn ghost block" data-a="mail-wide">Show Team, Board, Speakers And Others · ' + rest + '</button>' : '') +
      '<p class="small muted">Anyone who unsubscribed or didn’t agree to be contacted is left off.</p>' +
      '<div class="acts"><span class="grow"></span><button class="btn" data-a="mail-view" data-id="edit">Done</button></div>';
  }
  if (S.mailView === 'confirm') {
    return '<h3>Send to ' + esc(plural(picked.length, 'person', 'people')) + '?</h3><p class="lead">' + esc(picked.slice(0, 4).map(function (r) { return r.name; }).join(', ') + (picked.length > 4 ? ' and ' + (picked.length - 4) + ' more' : '')) + '. Each person gets their own copy with their own RSVP link and an unsubscribe link. Once it’s sent it can’t be pulled back.</p>' +
      '<div class="acts"><span class="grow"></span><button class="btn plain" data-a="mail-view" data-id="edit">Go Back</button><button class="btn" data-save data-a="mail-go">Send Now</button></div>';
  }
  if (sent) {
    var st = (m.fields || {}).stats || {};
    return '<h3>' + esc(m.subject) + '</h3><p class="lead">Sent' + (m.sent_at ? ' ' + esc(fmtDay(m.sent_at.slice(0, 10))) : '') + '</p><div class="stats three"><div class="stat"><div class="v">' + (st.sent || 0) + '</div><div class="k">Sent</div></div><div class="stat"><div class="v">' + (st.failed || 0) + '</div><div class="k">Failed</div></div><div class="stat"><div class="v">' + (st.skipped || 0) + '</div><div class="k">Unsubscribed</div></div></div>' +
      '<div class="acts"><button class="btn ghost" data-a="mail-del">Delete</button><span class="grow"></span><button class="btn plain" data-a="mail-view" data-id="preview">See The Email</button><button class="btn" data-a="close">Done</button></div>';
  }
  var ph = m.fields.photos || [];
  return '<h3>' + (m.id ? 'Edit Email' : 'New Email') + '</h3><p class="lead">' + esc(e.title) + '. The logo, date and place fill in on their own.</p>' +
    '<div class="fgrid"><fieldset class="fld"><legend>Design</legend><div class="tplpick">' + MAIL_TPL.map(function (t) {
      return '<button type="button" class="tpl' + (m.template === t[0] ? ' on' : '') + '" data-a="mail-tpl" data-id="' + t[0] + '" aria-pressed="' + (m.template === t[0]) + '"><span class="tpl-art t-' + t[0] + '"><i></i><i></i><i></i></span><b>' + esc(t[1]) + '</b></button>';
    }).join('') + '</div><span class="hint">' + esc((MAIL_TPL.find(function (t) { return t[0] === m.template; }) || [])[2] || '') + '</span></fieldset>' +
    '<div class="fld"><label for="ml_subject">Subject Line</label><input class="inp" id="ml_subject" maxlength="150" value="' + esc(m.subject) + '"></div>' +
    '<div class="fld"><label for="ml_headline">Headline</label><input class="inp" id="ml_headline" maxlength="120" value="' + esc(m.fields.headline) + '"></div>' +
    '<div class="fld"><label for="ml_message">Message</label><textarea class="inp" id="ml_message" rows="6" maxlength="4000">' + esc(m.fields.message) + '</textarea><span class="hint">Your heart for this event. It starts with what you wrote in the event’s theme and purpose.</span></div>' +
    '<div class="fld half"><label for="ml_button">Button Says</label><input class="inp" id="ml_button" maxlength="40" value="' + esc(m.fields.button) + '"></div>' +
    '<div class="fld half"><label for="ml_link">Button Opens</label><select class="inp" id="ml_link">' + MAIL_LINKS.map(function (l) { return '<option value="' + l[0] + '"' + ((m.fields.link || 'r') === l[0] ? ' selected' : '') + '>' + esc(l[1]) + '</option>'; }).join('') + '</select></div>' +
    '<fieldset class="fld"><legend>Photos (Up To 3)</legend><div class="mailphotos">' + ph.map(function (u, i) { return '<span class="mph"><img src="' + esc(u) + '" alt="Photo ' + (i + 1) + '"><button type="button" class="mph-x" data-a="mail-photo-x" data-id="' + i + '" aria-label="Remove photo ' + (i + 1) + '">' + IC.close + '</button></span>'; }).join('') +
      (ph.length < 3 ? '<label class="mph add">' + IC.plus + '<span>Add</span><input type="file" accept="image/*" data-mail-photo hidden></label>' : '') + '</div><span class="hint">Last year’s photos work well. The first one is the large photo in Photo Story.</span></fieldset>' +
    '<div class="fld"><label>Send To</label><button type="button" class="sendto" data-a="mail-view" data-id="pick"><span class="st-main"><b>' + (picked.length ? esc(plural(picked.length, 'person', 'people')) : 'Choose who gets this') + '</b><span>' + (picked.length ? esc(picked.slice(0, 3).map(function (r) { return r.name; }).join(', ') + (picked.length > 3 ? ' and ' + (picked.length - 3) + ' more' : '')) : 'Pick one person, a few, a whole group, or everyone.') + '</span></span>' + IC.down + '</button></div></div>' +
    (S.mailNote ? '<p class="mailnote" role="status">' + esc(S.mailNote) + '</p>' : '') +
    '<div class="acts mailacts">' + (m.id ? '<button class="btn ghost" data-a="mail-del">Delete</button>' : '') + '<span class="grow"></span><button class="btn plain" data-a="mail-view" data-id="preview">Preview</button><button class="btn plain" data-a="mail-test">Send Me A Test</button><button class="btn" data-save data-a="mail-send">Send…</button></div>' +
    '<p class="small muted" style="margin-top:8px"><button class="link inline" data-a="mail-save">Save as a draft</button> to finish later.</p>';
}
function mailOpen(m) { S.mail = m; S.mailView = m.status === 'sent' ? 'sent' : 'edit'; S.mailNote = ''; var pool0 = mailPool(byId('ed_events', m.event_id) || S.ev); S.mailSel = mailSelLoad(m, pool0); S.mailWide = pool0.some(function (r) { return S.mailSel[r.email] && !mailCore(r); }); openSheet(mailSheet, null); }
function mailNew(tpl) {
  var e = S.ev, d = mailDefaults(tpl || 'invite', e);
  return { id: null, org_id: org().id, event_id: e.id, template: tpl || 'invite', subject: d.subject, fields: { headline: d.headline, message: d.message, button: d.button, link: d.link, photos: [], to: [] }, audience: '', status: 'draft' };
}
function mailRow(m, extra) {
  mailSelSave(m, mailPool(byId('ed_events', m.event_id) || S.ev));
  var r = { org_id: m.org_id, event_id: m.event_id, template: m.template, subject: m.subject, fields: Object.assign({}, m.fields), audience: m.audience, status: m.status || 'draft', created_by: myMember().name || '' };
  if (m.id) r.id = m.id;
  return Object.assign(r, extra || {});
}
function mailCheck(m) {
  if (!m.subject) return 'Add a subject line.';
  if (!m.fields.message) return 'Write a short message.';
  if (m.fields.button && (m.fields.link === 'give') && !mailLink(byId('ed_events', m.event_id) || S.ev, 'give')) return 'Add an online giving link to the event or ministry profile, or pick a different page for the button.';
  return '';
}
function mailSaveDraft(quiet) {
  var m = S.mail;
  return DB.save('ed_mailings', mailRow(m)).then(function (r) { put('ed_mailings', r); m.id = r.id; if (!quiet) toast('Draft saved'); return r; });
}
// Emails can't show pictures that live inside the app, so the logo (and photos) are put where an email can load them.
function mailHosted(m) {
  var o = org() || {};
  if (DB.mode !== 'cloud' || !o.logo || !/^data:/.test(o.logo)) { m._logo = o.logo || ''; return Promise.resolve(); }
  if (S.mailLogo && S.mailLogo.src === o.logo) { m._logo = S.mailLogo.url; return Promise.resolve(); }
  return fetch(o.logo).then(function (r) { return r.blob(); }).then(function (b) { return DB.upload(o.id + '/logo-' + o.logo.length + '.' + (/jpeg/.test(b.type) ? 'jpg' : 'png'), b); }).then(function (url) { S.mailLogo = { src: o.logo, url: url }; m._logo = url; });
}
function mailFinal(m) { return mailHtml(m.template, mailData(m, true)); }
function mailBase() { return location.href.split('#')[0].split('?')[0]; }
function mailErr(e) { var t = String((e && e.message) || e || ''); return /non-2xx|not found|Failed to send a request|FunctionsFetchError|FunctionsHttpError/i.test(t) ? 'Email sending isn’t turned on yet. Your draft is saved. Whoever set up Tent & Table can turn it on (see EMAIL.md).' : errMsg(e); }
function mailBusy(on, note) { S.busy = !!on; if (note !== undefined) S.mailNote = note; redrawSheet(); renderLayer(); }

var MAIL_ACTIONS = {
  'mail-new': function () { mailOpen(mailNew('invite')); },
  'mail-open': function (t, id) { var m = byId('ed_mailings', id); if (m) mailOpen(JSON.parse(JSON.stringify(Object.assign({ fields: {} }, m)))); },
  'mail-tpl': function (t, id) {
    mailRead(); var m = S.mail, e = byId('ed_events', m.event_id) || S.ev, was = mailDefaults(m.template, e), now = mailDefaults(id, e);
    // keep anything the person rewrote; swap only the words that were still the starting text
    if (m.subject === was.subject) m.subject = now.subject;
    ['headline', 'message', 'button', 'link'].forEach(function (k) { if (m.fields[k] === was[k]) m.fields[k] = now[k]; });
    m.template = id; redrawSheet();
  },
  'mail-view': function (t, id) { mailRead(); S.mailView = id === 'edit' && S.mail.status === 'sent' ? 'sent' : id; S.sheet.err = ''; redrawSheet(); },
  'mail-pick-all': function () { var pool = mailShown(mailPool(byId('ed_events', S.mail.event_id) || S.ev)), all = pool.every(function (r) { return S.mailSel[r.email]; }); pool.forEach(function (r) { if (all) delete S.mailSel[r.email]; else S.mailSel[r.email] = 1; }); redrawSheet(); },
  'mail-wide': function () { S.mailWide = !S.mailWide; redrawSheet(); },
  'mail-pick-none': function () { S.mailSel = {}; redrawSheet(); },
  'mail-pick-tag': function (t, tag) {
    var g = mailShown(mailPool(byId('ed_events', S.mail.event_id) || S.ev)).filter(function (r) { return r.tags.indexOf(tag) >= 0; }), on = g.every(function (r) { return S.mailSel[r.email]; });
    g.forEach(function (r) { if (on) delete S.mailSel[r.email]; else S.mailSel[r.email] = 1; }); redrawSheet();
  },
  'mail-photo-x': function (t, id) { mailRead(); S.mail.fields.photos.splice(+id, 1); redrawSheet(); },
  'mail-save': function () { mailRead(); busy(mailSaveDraft(true), 'Draft saved').then(function () { render(); }).catch(function () {}); },
  'mail-del': function () {
    var m = S.mail; if (!m.id) { closeSheet(); return; }
    ask('Delete this email?', 'Delete', function () { return remove('ed_mailings', m.id).then(function () { render(); }); }, m.status === 'sent' ? 'It has already gone out; this only removes it from your list.' : '');
  },
  'mail-test': function () {
    mailRead(); var m = S.mail, bad = mailCheck(m); if (bad) { sheetErr(bad); return; }
    sheetErr(''); mailBusy(true, 'Sending a test to you…');
    mailHosted(m).then(function () { return DB.save('ed_mailings', mailRow(m, { html: mailFinal(m), base_url: mailBase() })); }).then(function (r) { put('ed_mailings', r); m.id = r.id; return DB.mail('test', { mailing_id: r.id }); })
      .then(function (r) { mailBusy(false, 'Test sent to ' + ((r && r.to) || 'your email') + '. Check your inbox (and spam the first time).'); render(); }, function (e) { mailBusy(false, ''); sheetErr(mailErr(e)); render(); });
  },
  'mail-send': function () {
    mailRead(); var m = S.mail, bad = mailCheck(m); if (bad) { sheetErr(bad); return; }
    if (!mailPicked(mailPool(byId('ed_events', m.event_id) || S.ev)).length) { sheetErr('Choose who gets this email first. Tap Send To.'); return; }
    S.mailView = 'confirm'; S.sheet.err = ''; redrawSheet();
  },
  'mail-go': function () {
    var m = S.mail, e = byId('ed_events', m.event_id) || S.ev, list = mailPicked(mailPool(e)), total = list.length;
    S.mailView = 'edit'; mailBusy(true, 'Getting ready…');
    mailHosted(m).then(function () { return DB.save('ed_mailings', mailRow(m, { html: mailFinal(m), base_url: mailBase(), status: 'sending' })); })
      .then(function (r) { put('ed_mailings', r); m.id = r.id; m.status = 'sending'; return DB.mailQueue(r.id, org().id, list); })
      .then(function () {
        var loop = function () {
          return DB.mail('send', { mailing_id: m.id }).then(function (r) {
            if (r && r.error) throw new Error(r.error);
            if (r && r.left > 0) { mailBusy(true, 'Sending… ' + (total - r.left) + ' of ' + total); return loop(); }
          });
        };
        return loop();
      })
      .then(function () { return DB.list('ed_mailings', 'id', m.id); })
      .then(function (rows) { var done = rows[0] || m; put('ed_mailings', done); S.mail = JSON.parse(JSON.stringify(done)); S.mailView = 'sent'; mailBusy(false, ''); toast('Sent to ' + plural(total0(done), 'person', 'people')); render(); },
        function (err) { mailBusy(false, ''); sheetErr(mailErr(err) + (m.status === 'sending' ? ' Nobody gets it twice: tap Send again to pick up where it stopped.' : '')); render(); });
  }
};
function total0(m) { return (((m || {}).fields || {}).stats || {}).sent || 0; }

// Adding a photo: shrink it on the phone first, then (when signed in) put it where an email can load it.
document.addEventListener('change', function (ev) {
  var t = ev.target; if (!t || !t.hasAttribute || !t.hasAttribute('data-mail-photo') || !t.files || !t.files[0] || !S.mail) return;
  var file = t.files[0]; if (!/^image\//.test(file.type)) { toast('Pick an image file.'); return; }
  mailRead();
  var rd = new FileReader();
  rd.onload = function () {
    var img = new Image();
    img.onload = function () {
      var max = 1200, s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      var done = function (url) { S.mail.fields.photos = (S.mail.fields.photos || []).concat([url]).slice(0, 3); mailBusy(false, ''); };
      if (DB.mode !== 'cloud') { done(c.toDataURL('image/jpeg', 0.8)); return; }
      mailBusy(true, 'Adding photo…');
      c.toBlob(function (b) { DB.upload(org().id + '/' + uuid() + '.jpg', b).then(done, function (e) { mailBusy(false, ''); sheetErr('That photo didn’t upload. ' + errMsg(e)); }); }, 'image/jpeg', 0.82);
    };
    img.onerror = function () { toast('That image couldn’t be read.'); };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
});

/* ---------------------------------------------------------------- the unsubscribe page (the link at the bottom of every email) */
function viewUnsub() {
  var u = S.unsub || {};
  return '<main class="auth"><div class="logo">' + IC.tent + '</div>' + (u.err ? '<h1>Something Went Wrong</h1><p class="lead">' + esc(u.err) + '</p>' : u.done ? '<h1>You’re Unsubscribed</h1><p class="lead">' + esc(u.org ? u.org + ' won’t send you' : 'You won’t get') + ' any more group emails. If this was a mistake, just let them know and they can add you back.</p>' : '<p class="muted">One moment…</p>') + '</main>';
}

// The people picker: ticking a name updates the count right away; typing in the search box narrows the list without losing your place.
document.addEventListener('change', function (ev) {
  var t = ev.target; if (!t || !t.getAttribute || !t.hasAttribute('data-mail-pick') || !S.mail) return;
  var em = t.getAttribute('data-mail-pick'); if (t.checked) S.mailSel[em] = 1; else delete S.mailSel[em];
  var c = document.getElementById('ml_count'), n = Object.keys(S.mailSel).length; if (c) c.textContent = n + ' picked';
});
// Typing an email beside a contact who has none saves it to that contact and moves them into the list, already ticked.
document.addEventListener('change', function (ev) {
  var t = ev.target; if (!t || !t.getAttribute || !t.hasAttribute('data-mail-addem') || !S.mail) return;
  var em = t.value.trim().toLowerCase(), src = t.getAttribute('data-mail-addem').split(':'), rec = byId(src[0], src[1]);
  if (!em || !rec) return;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { sheetErr('That email doesn’t look right. Check it and try again.'); return; }
  S.sheet.err = '';
  save(src[0], Object.assign({}, rec, { email: em }), 'Email saved').then(function () { S.mailSel[em] = 1; redrawSheet(); }).catch(function () {});
});
document.addEventListener('input', function (ev) {
  var t = ev.target; if (!t || t.id !== 'ml_q') return;
  var q = t.value.trim().toLowerCase(), shown = 0;
  document.querySelectorAll('#layer .mprow').forEach(function (r) { var ok = !q || r.getAttribute('data-q').indexOf(q) >= 0; r.hidden = !ok; if (ok) shown++; });
  var none = document.getElementById('ml_none'); if (none) none.hidden = shown > 0;
});
