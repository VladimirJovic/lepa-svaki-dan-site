/* Functional checks of preview B (puppeteer): price-list deep links, full-screen menu, blog chip bar, hero video rules,
   data-driven offers page, no-JS reading, mobile action bar.                      Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, sleep, scrollThrough, BASE } from './qa-lib.mjs';
const b = await launch();
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const open = async (url, W = 1440, opts = {}) => { const p = await newPage(b, W, W < 768 ? 844 : 900, opts); await p.goto(`${BASE}/${url}`, { waitUntil: 'networkidle0' }); return p; };

console.log('A. price list deep links');
for (const [W, url, tab, gid] of [[1440, 'index.html?grupa=estetske:5#usluge', 'estetske', 'estetske:5'], [390, 'index.html?grupa=lice:3#usluge', 'lice', 'lice:3'], [390, 'index.html?grupa=laserska:3#usluge', 'laserska', 'laserska:3'], [1440, 'index.html#usluge/protokoli:2', 'protokoli', 'protokoli:2'], [390, 'index.html?grupa=telo:5#usluge', 'telo', 'telo:5']]) {
  const p = await open(url, W); await sleep(2200);
  const r = await p.evaluate((tab, gid) => {
    const g = document.querySelector(`[data-group-id="${gid}"]`), t = document.querySelector('#tab-' + tab), rect = g.getBoundingClientRect(), nav = document.querySelector('.nav__pill').getBoundingClientRect();
    return { sel: t.getAttribute('aria-selected'), open: g.classList.contains('is-open'), flash: g.classList.contains('flash-g'), top: Math.round(rect.top), navBottom: Math.round(nav.bottom), vh: innerHeight, visible: !g.closest('[hidden]') };
  }, tab, gid);
  ok(r.sel === 'true' && r.open && r.visible && r.top >= r.navBottom - 4 && r.top < r.vh * 0.5, `${W}px ${url}: tab ${tab} selected, group open, in view (top ${r.top}, nav ${r.navBottom}), flash ${r.flash}`);
  await p.close();
}

console.log('B. full-screen menu on a sub page (390)');
{
  const p = await open('blog/hijaluronski-fileri.html', 390);
  await p.click('.nav .burger'); await sleep(500);
  let r = await p.evaluate(() => ({ exp: document.querySelector('.nav .burger').getAttribute('aria-expanded'), open: document.querySelector('#menu').classList.contains('is-open'), lock: document.documentElement.classList.contains('lock'), inert: document.querySelector('#main').inert, focus: document.activeElement.className }));
  ok(r.exp === 'true' && r.open && r.lock && r.inert && /burger/.test(r.focus), 'opens: aria-expanded, scroll lock, background inert, focus on close button');
  let inside = true; for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); inside = inside && (await p.evaluate(() => !!document.activeElement.closest('#menu'))); }
  ok(inside, 'Tab x12 stays inside the menu (focus trap)');
  let shift = true; for (let i = 0; i < 5; i++) { await p.keyboard.down('Shift'); await p.keyboard.press('Tab'); await p.keyboard.up('Shift'); shift = shift && (await p.evaluate(() => !!document.activeElement.closest('#menu'))); }
  ok(shift, 'Shift+Tab stays inside the menu');
  await p.keyboard.press('Escape'); await sleep(500);
  r = await p.evaluate(() => ({ exp: document.querySelector('.nav .burger').getAttribute('aria-expanded'), lock: document.documentElement.classList.contains('lock'), inert: document.querySelector('#main').inert, focus: document.activeElement.className }));
  ok(r.exp === 'false' && !r.lock && !r.inert && /burger/.test(r.focus), 'ESC closes, unlocks scroll and returns focus to the burger');
  await p.click('.nav .burger'); await sleep(400);
  const hrefs = await p.evaluate(() => [...document.querySelectorAll('#menu .menu__links a')].map((a) => a.getAttribute('href')));
  ok(hrefs.join() === '../index.html#tretmani,../index.html#o-nama,../index.html#lokacije,../index.html#usluge,../posebna-ponuda.html,../blog.html', 'menu links valid from blog/: ' + hrefs.join(' '));
  await p.close();
}

console.log('C. blog chip bar');
{
  const p = await open('blog.html', 390); await sleep(600);
  let cur = await p.evaluate(() => document.querySelector('.segchip[aria-current]')?.textContent);
  ok(!cur, 'no chip marked at the top of the page');
  await p.evaluate(() => document.getElementById('telo').scrollIntoView({ behavior: 'instant', block: 'start' })); await sleep(500);
  cur = await p.evaluate(() => document.querySelector('.segchip[aria-current]')?.textContent);
  ok(/^Telo/.test(cur || ''), 'scroll spy marks Telo: ' + cur);
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(300);
  await p.click('.segchip[href="#kozmetika"]'); await sleep(1400);
  const r = await p.evaluate(() => ({ hash: location.hash, cur: document.querySelector('.segchip[aria-current]')?.textContent, top: Math.round(document.getElementById('kozmetika').getBoundingClientRect().top), bar: Math.round(document.querySelector('.chipbar').getBoundingClientRect().bottom) }));
  ok(r.hash === '#kozmetika' && /^Kozmeti/.test(r.cur || '') && r.top >= r.bar - 2, `chip jumps and lands below the sticky bars (section top ${r.top}, bars end ${r.bar})`);
  await p.close();
}

console.log('D. hero video');
{
  let p = await open('tretmani/dermatologija.html', 1440); await sleep(3500);
  let r = await p.evaluate(() => { const v = document.querySelector('.shero__video'); return v ? { src: v.currentSrc.split('/').pop(), paused: v.paused, t: v.currentTime, cls: document.querySelector('.shero').classList.contains('is-video'), op: getComputedStyle(v).opacity, figOp: getComputedStyle(document.querySelector('.shero__fig')).opacity } : null; });
  ok(r && !r.paused && r.t > 0 && r.cls && r.src === 'dermatologija.mp4', 'desktop: muted loop plays over the poster: ' + JSON.stringify(r));
  await p.close();
  p = await open('tretmani/dermatologija.html', 390); await sleep(3500);
  r = await p.evaluate(() => { const v = document.querySelector('.shero__video'); return v ? { src: v.currentSrc.split('/').pop(), paused: v.paused, t: v.currentTime } : null; });
  ok(r && r.src === 'dermatologija-m.mp4' && !r.paused, 'phone: portrait file data-video-m is used: ' + JSON.stringify(r));
  await p.close();
  p = await open('tretmani/telo.html', 1440, { rm: true }); await sleep(3000);
  r = await p.evaluate(() => ({ video: !!document.querySelector('.shero__video'), poster: !!document.querySelector('.shero__media img') }));
  ok(!r.video && r.poster, 'prefers-reduced-motion: no video element, poster stays');
  await p.close();
  p = await newPage(b, 1440, 900);
  await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'connection', { value: { effectiveType: '3g', saveData: false, downlink: 1.2 } }); });
  await p.goto(`${BASE}/tretmani/telo.html`, { waitUntil: 'networkidle0' }); await sleep(3000);
  ok(!(await p.evaluate(() => !!document.querySelector('.shero__video'))), 'slow connection (3g): the video is never requested');
  ok(!p.__log.notfound.some((x) => /mp4/.test(x)), 'no mp4 request failed');
  await p.close();
  p = await newPage(b, 1440, 900);
  await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'connection', { value: { effectiveType: '4g', saveData: true } }); });
  let mp4 = 0; p.on('request', (q) => { if (/\.mp4/.test(q.url())) mp4++; });
  await p.goto(`${BASE}/tretmani/telo.html`, { waitUntil: 'networkidle0' }); await sleep(2500);
  ok(mp4 === 0, 'Save-Data: no video request');
  await p.close();
  p = await open('tretmani/telo.html', 1440); await sleep(500);
  const attrs = await p.evaluate(() => { const h = document.querySelector('.shero'); return { dv: h.getAttribute('data-video') }; });
  ok(attrs.dv === '../assets/video/telo.mp4', 'markup carries data-video: ' + attrs.dv);
  await p.close();
}

console.log('E. Posebna ponuda is data-driven');
{
  const p = await open('posebna-ponuda.html', 1440); await sleep(600);
  const staticHtml = await (await fetch(`${BASE}/posebna-ponuda.html`)).text();
  const stat = [...staticHtml.matchAll(/<li class="offer offer--page" id="([^"]+)"/g)].map((m) => m[1]);
  const live = await p.evaluate(() => [...document.querySelectorAll('#offers-list > li')].map((l) => l.id + '|' + l.textContent.replace(/\s+/g, ' ').trim() + '|' + [...l.querySelectorAll('a')].map((a) => a.getAttribute('href')).join(',')));
  ok(stat.length === 4 && live.length === 4, `static copy has ${stat.length} offers, live render ${live.length}`);
  const statTxt = [...staticHtml.matchAll(/<li class="offer offer--page" id="([^"]+)"[\s\S]*?<\/li>/g)].map((m) => m[0].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim());
  ok(live.every((l, i) => l.split('|')[1].replace(/\s+/g, '') === statTxt[i].replace(/\s+/g, '')), 'static markup and JS render carry the same text');
  const links = await p.evaluate(() => [...document.querySelectorAll('#offers-list .btn')].map((a) => decodeURIComponent(a.getAttribute('href'))));
  ok(links.every((h) => /^https:\/\/wa\.me\/381648239439\?text=Zdravo, zanima me paket: /.test(h)), 'WhatsApp CTA with prefilled message: ' + links[0]);
  const valid = await p.evaluate(() => document.querySelectorAll('.offer__valid').length);
  ok(valid === 0, 'no validity wording shown (the data has none)');
  await p.close();
  // edit the data on the fly: change a price, remove one offer, add one with a validity
  const q = await newPage(b, 1440, 900);
  await q.setRequestInterception(true);
  q.on('request', async (req) => {
    if (/assets\/content\.js$/.test(req.url())) {
      const txt = await (await fetch(req.url())).text();
      const patched = txt + `\nwindow.LSD_CONTENT.offers.splice(1,1); window.LSD_CONTENT.offers[0].priceEur={min:400,max:400}; window.LSD_CONTENT.offers[0].priceRsd={min:46800,max:46800};\nwindow.LSD_CONTENT.offers.push({id:'offer-9',slug:'test-ponuda',tag:'Test',title:'Test ponuda',description:'Opis.',price:'100€ / 11.700 rsd',priceEur:{min:100,max:100},priceRsd:{min:11700,max:11700},note:null,validity:'Važi do 31.12.2026.',cta:{label:'Zakaži',href:'https://wa.me/381648239439'},cenovnikRef:null});`;
      req.respond({ status: 200, contentType: 'application/javascript', body: patched });
    } else req.continue();
  });
  await q.goto(`${BASE}/posebna-ponuda.html`, { waitUntil: 'networkidle0' }); await sleep(500);
  const e = await q.evaluate(() => ({ n: document.querySelectorAll('#offers-list > li').length, first: document.querySelector('#offers-list > li .offer__price').innerText.trim() + ' / ' + document.querySelector('#offers-list > li .offer__rsd').innerText.trim(), valid: document.querySelector('.offer__valid')?.innerText, titles: [...document.querySelectorAll('.offer__h')].map((h) => h.textContent) }));
  ok(e.n === 4 && /^400/.test(e.first) && /46\.800 rsd/.test(e.first) && e.valid === 'Važi do 31.12.2026.' && !e.titles.includes('Wedding Ready'), 'edited data shows up: ' + JSON.stringify(e));
  await q.close();
}

console.log('F. readable without JavaScript');
{
  const p = await newPage(b, 390, 844); await p.setJavaScriptEnabled(false);
  for (const url of ['blog/hijaluronski-fileri.html', 'blog.html', 'tretmani/telo.html', 'posebna-ponuda.html']) {
    await p.goto(`${BASE}/${url}`, { waitUntil: 'networkidle0' });
    const r = await p.evaluate(() => { const el = [...document.querySelectorAll('.acard, .prose p, .offer, .shero__lead')].slice(0, 3); return { n: document.body.innerText.length, ops: el.map((e) => getComputedStyle(e).opacity), nav: !!document.querySelector('header.nav'), foot: !!document.querySelector('footer .foot__credit') }; });
    ok(r.n > 800 && r.ops.every((o) => o === '1') && r.nav && r.foot, `${url}: ${r.n} chars of text, content opaque, header and footer present`);
  }
  await p.close();
}

console.log('G. mobile action bar and no horizontal scroll with the menu closed');
{
  const p = await open('blog/hijaluronski-fileri.html', 390);
  const r = await p.evaluate(() => { const bar = document.querySelector('#bar'), rb = bar.getBoundingClientRect(); return { pos: getComputedStyle(bar).position, bottom: Math.round(innerHeight - rb.bottom), h: Math.round(rb.height), links: [...bar.querySelectorAll('a')].map((a) => a.getAttribute('href')) }; });
  ok(r.pos === 'fixed' && r.bottom === 0 && r.links.length === 3, 'fixed bar with 3 actions: ' + r.links.join(' '));
  await p.evaluate(() => document.getElementById('zakazi').scrollIntoView({ behavior: 'instant', block: 'center' })); await sleep(900);
  ok(await p.evaluate(() => document.querySelector('#bar').classList.contains('is-off')), 'bar slides away over the contact block');
  await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await sleep(600);
  const last = await p.evaluate(() => { const f = document.querySelector('.foot__top-link').getBoundingClientRect(); return { bottom: Math.round(f.bottom), vh: innerHeight }; });
  ok(last.bottom < last.vh - 8, 'the last footer line is not under the bar (footer bottom padding)');
  await p.close();
}
await b.close();
console.log(bad ? `\n${bad} check(s) failed` : '\nall functional checks passed');
process.exit(bad ? 1 : 0);
