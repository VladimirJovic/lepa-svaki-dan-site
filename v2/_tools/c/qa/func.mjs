// Functional checks: price-list deep links, menu (focus trap / ESC / scroll lock), blog filter, no-JS rendering, offers data-driven re-render.
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, sleep, BASE, SITE, OUT } from './lib.mjs';
const b = await launch();
const res = [];
const ok = (name, cond, extra = '') => { res.push([cond ? 'PASS' : 'FAIL', name, cond ? '' : extra]); };
const vp = (p) => p.evaluate(() => innerHeight);

/* 1. deep links into the price list */
async function deepLink(url, W, expect) {
  const p = await newPage(b, W);
  await p.goto(`${BASE}/${url}`, { waitUntil: 'load' }); await sleep(2200);
  const r = await p.evaluate(() => {
    const tab = document.querySelector('.tab[aria-selected="true"]'), bar = document.querySelector('#tabs-bar');
    const open = [...document.querySelectorAll('.grp.is-open')].filter((g) => !g.hidden && g.closest('.panel:not([hidden])')).map((g) => g.dataset.groupId);
    const gf = document.querySelector('.grp.is-flash'), sf = document.querySelector('.svc.is-flash');
    const el = gf || sf; const rc = el && el.getBoundingClientRect();
    return { tab: tab && tab.dataset.tabId, open, flash: gf ? gf.dataset.groupId : sf ? sf.dataset.serviceId : null, top: rc && Math.round(rc.top), bottom: rc && Math.round(rc.bottom), barBottom: Math.round(bar.getBoundingClientRect().bottom), vh: innerHeight };
  });
  const sel = `${url} @${W}`;
  ok(`${sel}: tab ${expect.tab} selected`, r.tab === expect.tab, JSON.stringify(r));
  if (expect.group) { ok(`${sel}: group ${expect.group} open + highlighted`, r.open.includes(expect.group) && r.flash === expect.group, JSON.stringify(r)); ok(`${sel}: group scrolled into view below the sticky bar`, r.top >= r.barBottom - 6 && r.top < r.vh * 0.6, JSON.stringify(r)); }
  if (expect.service) { ok(`${sel}: service highlighted and in view`, r.flash === expect.service && r.top >= r.barBottom - 6 && r.bottom <= r.vh, JSON.stringify(r)); }
  ok(`${sel}: no console errors`, !p.__log.errors.length, JSON.stringify(p.__log));
  await p.close();
}
for (const W of [390, 1440]) {
  await deepLink('index.html?grupa=estetske:5#usluge', W, { tab: 'estetske', group: 'estetske:5' });
  await deepLink('index.html?grupa=telo:3#usluge', W, { tab: 'telo', group: 'telo:3' });
  await deepLink('index.html?grupa=laserska:2#usluge', W, { tab: 'laserska', group: 'laserska:2' });
  await deepLink('index.html?grupa=protokoli:3#usluge', W, { tab: 'protokoli', group: 'protokoli:3' });
  await deepLink('index.html?usluga=protokoli:2:2#usluge', W, { tab: 'protokoli', service: 'protokoli:2:2' });
  await deepLink('index.html#usluge/lice:3', W, { tab: 'lice', group: 'lice:3' });
}
{ // legacy tab hash still works, bad ids are harmless
  const p = await newPage(b, 1440); await p.goto(`${BASE}/index.html#usluge/protokoli`, { waitUntil: 'load' }); await sleep(900);
  ok('legacy #usluge/protokoli selects the tab', await p.evaluate(() => document.querySelector('.tab[aria-selected="true"]').dataset.tabId === 'protokoli'));
  await p.goto(`${BASE}/index.html?grupa=zzz:9#usluge`, { waitUntil: 'load' }); await sleep(600);
  ok('unknown ?grupa= is harmless (no errors, first tab)', !p.__log.errors.length && await p.evaluate(() => document.querySelector('.tab[aria-selected="true"]').dataset.tabId === 'lice'), JSON.stringify(p.__log));
  await p.close();
}
{ // from an article: click the first "U cenovniku" row
  const p = await newPage(b, 390);
  await p.goto(`${BASE}/blog/hijaluronski-fileri.html`, { waitUntil: 'load' }); await sleep(400);
  const href = await p.$eval('.pbox__row', (a) => a.getAttribute('href'));
  await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), p.click('.pbox__row')]); await sleep(2200);
  const r = await p.evaluate(() => ({ url: location.pathname + location.search, open: !!document.querySelector('.grp.is-open[data-group-id="estetske:1"]'), tab: document.querySelector('.tab[aria-selected="true"]').dataset.tabId }));
  ok('article "U cenovniku" row opens the group on the home page', r.open && r.tab === 'estetske' && /grupa=estetske:1/.test(r.url), href + ' ' + JSON.stringify(r));
  await p.close();
}

/* 2. mobile menu on a sub page */
{
  const p = await newPage(b, 390);
  await p.goto(`${BASE}/blog.html`, { waitUntil: 'load' }); await sleep(400);
  await p.click('#burger'); await sleep(600);
  const s = await p.evaluate(() => ({ exp: document.querySelector('#burger').getAttribute('aria-expanded'), cls: document.documentElement.classList.contains('menu-open'), open: document.querySelector('#menu').classList.contains('is-open'), inMenu: document.querySelector('#menu').contains(document.activeElement), inert: document.querySelector('main').hasAttribute('inert'), ovf: getComputedStyle(document.documentElement).overflow, bar: document.querySelector('#bar').getBoundingClientRect().top >= innerHeight - 1 }));
  ok('menu opens: aria-expanded, scroll lock, inert main, focus inside, action bar tucked away', s.exp === 'true' && s.cls && s.open && s.inMenu && s.inert && s.ovf === 'hidden' && s.bar, JSON.stringify(s));
  let trapped = true; const seen = new Set();
  for (let i = 0; i < 16; i++) { await p.keyboard.press('Tab'); const inside = await p.evaluate(() => { const a = document.activeElement; return (document.querySelector('#menu').contains(a) || a.id === 'burger') ? (a.id || (a.textContent || '').trim().slice(0, 20) || 'x') : null; }); if (!inside) trapped = false; else seen.add(inside); }
  ok('Tab stays inside menu + burger (focus trap)', trapped, [...seen].join('|'));
  for (let i = 0; i < 20; i++) await p.keyboard.down('Shift'), await p.keyboard.press('Tab'), await p.keyboard.up('Shift');
  ok('Shift+Tab also trapped', await p.evaluate(() => document.querySelector('#menu').contains(document.activeElement) || document.activeElement.id === 'burger'));
  await p.keyboard.press('Escape'); await sleep(500);
  const e = await p.evaluate(() => ({ exp: document.querySelector('#burger').getAttribute('aria-expanded'), open: document.querySelector('#menu').classList.contains('is-open'), foc: document.activeElement.id, inert: document.querySelector('main').hasAttribute('inert') }));
  ok('ESC closes menu, focus returns to burger, inert removed', e.exp === 'false' && !e.open && e.foc === 'burger' && !e.inert, JSON.stringify(e));
  const links = await p.$$eval('#menu .menu__links a', (as) => as.map((a) => a.getAttribute('href')));
  ok('menu links valid from a sub page', JSON.stringify(links) === JSON.stringify(['index.html#tretmani', 'index.html#o-nama', 'index.html#lokacije', 'index.html#usluge', 'posebna-ponuda.html', 'blog.html']), links.join(' '));
  await p.click('#burger'); await sleep(500);
  await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), p.click('#menu .menu__links a[href="index.html#usluge"]')]); await sleep(800);
  ok('menu "Cenovnik" from blog lands on home #usluge', await p.evaluate(() => location.pathname.endsWith('index.html') && location.hash === '#usluge'));
  await p.close();
  const h = await newPage(b, 390);
  await h.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(500);
  await h.click('#burger'); await sleep(500);
  await h.keyboard.press('Escape'); await sleep(300);
  ok('home menu still works (ESC)', await h.evaluate(() => !document.querySelector('#menu').classList.contains('is-open')));
  const hl = await h.$$eval('#menu .menu__links a', (as) => as.map((a) => a.getAttribute('href')));
  ok('home menu links are in-page anchors / pages', JSON.stringify(hl) === JSON.stringify(['#tretmani', '#o-nama', '#lokacije', '#usluge', 'posebna-ponuda.html', 'blog.html']), hl.join(' '));
  await h.close();
}

/* 3. blog filter */
{
  const p = await newPage(b, 1440);
  await p.goto(`${BASE}/blog.html`, { waitUntil: 'load' }); await sleep(400);
  const vis = () => p.evaluate(() => [...document.querySelectorAll('.bseg')].filter((s) => !s.hidden).map((s) => s.dataset.segment));
  ok('blog: all 4 segments + 21 cards by default', (await vis()).length === 4 && await p.evaluate(() => document.querySelectorAll('.blog-list .acard').length === 21));
  await p.click('.segchip[data-seg="telo"]'); await sleep(300);
  ok('blog: chip Telo filters to one segment, hash set, status read out', JSON.stringify(await vis()) === '["telo"]' && await p.evaluate(() => location.hash === '#seg-telo' && /Telo/.test(document.querySelector('#blog-status').textContent)));
  await p.click('.segchip[data-seg="sve"]'); await sleep(300);
  ok('blog: Svi tekstovi restores all', (await vis()).length === 4);
  await p.goto(`${BASE}/blog.html#seg-kozmetika`, { waitUntil: 'load' }); await sleep(500);
  ok('blog: #seg-kozmetika on load filters', JSON.stringify(await vis()) === '["kozmetika"]');
  await p.goto(`${BASE}/blog/venus-glow.html`, { waitUntil: 'load' });
  const crumb = await p.$$eval('.crumbs a', (as) => as.map((a) => a.getAttribute('href')));
  ok('article breadcrumb = Blog > segment', JSON.stringify(crumb) === '["../blog.html","../blog.html#seg-kozmetika"]', crumb.join(' '));
  await p.close();
}

/* 4. no-JS: every new page reads without scripts */
{
  const pages = ['blog.html', 'blog/hijaluronski-fileri.html', 'blog/laserska-dermatologija-candela-laserima.html', 'tretmani/telo.html', 'tretmani/dermatologija.html', 'posebna-ponuda.html'];
  for (const pg of pages) {
    const p = await b.newPage(); await p.setJavaScriptEnabled(false); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' });
    const r = await p.evaluate(() => { const vis = (sel) => [...document.querySelectorAll(sel)].filter((e) => getComputedStyle(e).opacity !== '0' && e.getBoundingClientRect().height > 0).length; return { h1: document.querySelector('h1').textContent.trim().slice(0, 40), main: document.querySelector('main').innerText.length, cards: vis('.acard'), offers: vis('.ocard'), prose: document.querySelector('.prose') ? document.querySelector('.prose').innerText.length : -1, menuHidden: document.querySelector('#menu').hidden }; });
    ok(`no-JS ${pg}: readable (${r.main} chars, ${r.cards} cards, ${r.offers} offers, prose ${r.prose})`, r.main > 400 && (pg !== 'posebna-ponuda.html' || r.offers === 4) && (!pg.startsWith('blog/') || r.prose > 500) && (pg !== 'blog.html' || r.cards === 21), JSON.stringify(r));
    await p.close();
  }
}

/* 5. offers page is data-driven: swap assets/offers.js in flight */
{
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  await p.setRequestInterception(true);
  p.on('request', (r) => {
    if (r.url().endsWith('/assets/offers.js')) {
      const body = 'window.LSD_CONTENT=window.LSD_CONTENT||{};window.LSD_CONTENT.offers=[{id:"t1",slug:"proba",tag:"Probni",title:"Probni paket",includes:"Opis paketa.",price:"100€ / 11.700 rsd",oldPrice:"120€ / 14.000 rsd",validity:"Važi do kraja meseca.",note:null,featured:true,cta:{label:"Zakaži ovaj paket",href:"https://wa.me/381648239439"},cenovnikRef:null}];';
      r.respond({ status: 200, contentType: 'application/javascript', body });
    } else r.continue();
  });
  await p.goto(`${BASE}/posebna-ponuda.html`, { waitUntil: 'load' }); await sleep(500);
  const r = await p.evaluate(() => ({ n: document.querySelectorAll('.ocard').length, valid: document.querySelector('.ocard__valid') && document.querySelector('.ocard__valid').textContent, old: !!document.querySelector('.price-old s'), link: !!document.querySelector('.ocard a[href*="index.html?"]'), wa: document.querySelector('.ocard .btn--primary').href }));
  ok('offers page re-renders from window.LSD_CONTENT.offers (1 offer, validity + old price shown, no price-list link when cenovnikRef null)', r.n === 1 && r.valid === 'Važi do kraja meseca.' && r.old && !r.link && /text=Zdravo/.test(r.wa), JSON.stringify(r));
  await p.close();
  const q = await newPage(b, 1440); await q.goto(`${BASE}/posebna-ponuda.html`, { waitUntil: 'load' }); await sleep(300);
  const r2 = await q.evaluate(() => ({ n: document.querySelectorAll('.ocard').length, valid: !!document.querySelector('.ocard__valid'), old: !!document.querySelector('.price-old'), wa: [...document.querySelectorAll('.ocard .btn--primary')].map((a) => decodeURIComponent(a.href.split('text=')[1]))[0] }));
  ok('real data: 4 offers, no validity / old price (not in data), WhatsApp text prefilled', r2.n === 4 && !r2.valid && !r2.old && /Instant Glow Up/.test(r2.wa), JSON.stringify(r2));
  await q.close();
}

await b.close();
console.log(res.map((r) => r.join(' ')).join('\n'));
const fails = res.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${res.length - fails}/${res.length} passed`);
process.exit(fails ? 1 : 0);
