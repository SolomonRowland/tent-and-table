const { chromium } = require('playwright');
const OUT = __dirname + '/tour/'; const BASE = 'http://127.0.0.1:8765/events/';
(async () => {
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); p.setDefaultTimeout(5000); await p.route(/fonts\./, r => r.abort());
const errs=[]; p.on('pageerror', e => errs.push(e.message));
const shot = async (nm) => { await p.waitForTimeout(450); await p.screenshot({ path: OUT + nm + '.png' }); };
const step = async (nm, fn) => { try { await fn(); } catch (e) { errs.push(nm + ': ' + e.message.split('\n')[0]); } };
const fresh = async () => { await p.goto(BASE + '?demo'); await p.waitForTimeout(500); };
await p.goto(BASE + '?demo'); await p.evaluate(() => localStorage.clear()); await fresh();
await step('home', async()=>{ await shot('s01-home'); });
await step('events', async()=>{ await p.click('[data-a="nav"][data-v="events"]'); await shot('s02-events'); });
await step('wiz', async()=>{ await p.click('[data-a="new-event"]'); await p.fill('#layer input[name="title"]', 'Fall Harvest Festival'); await shot('s03-wiz-name');
  for (let i=0;i<4;i++){ if (await p.$('#layer input[name="starts_on"]')) { await p.fill('#layer input[name="starts_on"]', '2026-10-17'); } if (await p.$('#layer input[name="place"]')) { await p.fill('#layer input[name="place"]', 'Church Lawn'); } await p.click('[data-a="wiz-next"]'); await p.waitForTimeout(250); if (await p.$('[data-a="wiz-yn"]')) break; }
  const ids = await p.$$eval('[data-a="wiz-yn"][data-v="1"]', bs=>bs.map(b=>b.dataset.id));
  for (const id of ids) { await p.click('[data-a="wiz-yn"][data-id="'+id+'"][data-v="'+(['guests','volunteers','food','money','calendar','followup','equipment'].includes(id)?'1':'0')+'"]'); }
  await p.evaluate(()=>{const s=document.querySelector('#layer .sheet'); if(s) s.scrollTop=0;}); await shot('s04-wiz-needs'); await p.click('#layer [data-a="close"]').catch(()=>{}); });
await step('overview', async()=>{ await fresh(); await p.click('[data-a="nav"][data-v="events"]'); await p.click('text=Annual Tent Revival'); await shot('s05-overview'); });
await step('plan', async()=>{ await p.click('.areabar [data-v="plan"]'); await p.click('[data-k="taskby"][data-v="area"]'); await shot('s06-tasks-area'); await p.click('[data-a="doc"][data-id="tasks"]'); await p.selectOption('#dk_area','Food'); await shot('s07-tasks-print'); await p.click('#layer [data-a="close"]'); await p.click('[data-k="taskby"][data-v="phase"]'); });
await step('contacts', async()=>{ await p.click('.areabar [data-v="people"]'); await p.click('[data-k="area_people"][data-v="team"]'); await shot('s08-ev-team'); await p.click('[data-a="pick-people"] >> nth=0'); await p.click('.picklist input:not(:disabled) >> nth=0'); await shot('s09-picker'); await p.click('#layer [data-a="close"]'); });
await step('vols', async()=>{ await p.click('[data-k="area_people"][data-v="volunteers"]'); await shot('s10-volunteers'); await p.click('[data-k="area_people"][data-v="guests"]'); await shot('s11-guests'); });
await step('share', async()=>{ await p.click('[data-a="ev-tab"][data-id="sharepage"]'); await shot('s12-share'); await p.click('.sharebar [data-a="show-qr"] >> nth=1'); await shot('s13-qr'); await p.click('.sheet [data-a="open-pub"]'); await p.waitForTimeout(500); await shot('s14-public'); });
await step('money', async()=>{ await fresh(); await p.click('[data-a="nav"][data-v="events"]'); await p.click('text=Annual Tent Revival'); await p.click('.areabar [data-v="money"]'); await shot('s15-money'); });
await step('dir', async()=>{ await fresh(); await p.click('[data-a="nav"][data-v="directory"]'); await shot('s16-directory'); });
await step('today', async()=>{ await fresh(); await p.click('[data-a="nav"][data-v="events"]'); await p.click('text=Prayer Night'); await shot('s17-today'); });
await step('prayer', async()=>{ await fresh(); await p.click('[data-a="nav"][data-v="events"]'); await p.click('text=Annual Tent Revival'); await p.click('.areabar [data-v="prayer"]'); await shot('s18-prayer'); });
await step('mine', async()=>{ await fresh(); await p.click('[data-a="nav"][data-v="mine"]'); await shot('s19-mine'); await p.click('[data-a="reminders"]'); await shot('s20-reminders'); await p.click('#layer [data-a="close"]').catch(()=>{}); });
await step('selfci', async()=>{ const slug = await p.evaluate(() => S.db.ed_events.find(e=>e.title==='Prayer Night').slug); await p.goto(BASE + '?demo#/k/' + slug); await p.reload(); await p.waitForTimeout(500); await p.fill('#ci_phone', '(555) 555-0141'); await shot('s21-selfci'); });
await step('recap', async()=>{ await fresh(); await p.click('[data-a="nav"][data-v="events"]'); await p.click('text=Summer Park Outreach'); await p.click('.recapbar'); await shot('s22-recap'); });
console.log(errs.join('\n')||'ok'); await b.close(); })();
