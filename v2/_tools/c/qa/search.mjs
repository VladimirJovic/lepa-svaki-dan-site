// Search QA: hero bar + overlay + price list. Required queries must return honest, non-empty results; keyboard model; aria-live; empty state; no # tags.
import { launch, newPage, sleep, BASE } from './lib.mjs';
const QUERIES = ['glass skin', 'blistava koza', 'blistava koža', 'akne', 'lecenje akni', 'ozilci od akni', 'cista koza', 'kako smanjiti obim', 'celulit', 'pigmentacija', 'bore', 'botoks', 'depilacija', 'opadanje kose', 'masaza', 'hijaluron', 'poklon', 'GLOW', 'lečenje akni', 'ak', 'kako se resiti akni'];
const b = await launch(); const res = []; const ok = (n, c, x = '') => res.push([c ? 'PASS' : 'FAIL', n, c ? '' : x]);
const verbose = process.argv.includes('-v');
const p = await newPage(b, 1440, 900);
await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(900);
const typeQ = async (sel, q) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, q, { delay: 8 }); await sleep(450); };
for (const q of QUERIES) {
  await typeQ('#hero-q', q);
  const r = await p.evaluate(() => { const l = document.querySelector('#hero-q-list'); return { open: !l.hidden, n: l.querySelectorAll('[role=option]').length, secs: [...l.querySelectorAll('.sres__h')].map((x) => x.textContent), empty: !!l.querySelector('.sres__empty'), titles: [...l.querySelectorAll('.sres__item .sres__t')].map((x) => x.textContent), live: document.querySelector('#hero-q-live').textContent, txt: l.textContent }; });
  const need = !(q === 'ak');
  ok(`hero "${q}": results`, r.open && (r.n > 0 || !need), JSON.stringify(r));
  ok(`hero "${q}": no # tags`, !/#[a-zčćšžđ]/i.test(r.txt));
  ok(`hero "${q}": aria-live announces`, r.live.length > 0, r.live);
  if (verbose) console.log(q.padEnd(22), r.secs.join('|'), '=>', r.titles.slice(0, 6).join(' ; '));
}
// nonsense -> friendly empty state with phone / whatsapp
await typeQ('#hero-q', 'xqzvw');
ok('empty state offers phone + WhatsApp', await p.evaluate(() => { const e = document.querySelector('#hero-q-list .sres__empty'); return !!e && e.querySelectorAll('a[href^="tel:"]').length === 2 && e.querySelectorAll('a[href*="wa.me"]').length === 2; }));
// keyboard: down, enter follows; escape closes
await typeQ('#hero-q', 'botoks');
await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await sleep(100);
ok('ArrowDown sets aria-activedescendant + aria-selected', await p.evaluate(() => { const i = document.querySelector('#hero-q'); const id = i.getAttribute('aria-activedescendant'); const el = id && document.getElementById(id); return !!el && el.getAttribute('aria-selected') === 'true'; }));
await p.keyboard.press('ArrowUp'); await sleep(50);
ok('ArrowUp moves back', await p.evaluate(() => { const o = [...document.querySelectorAll('#hero-q-list [role=option]')]; return o.findIndex((x) => x.getAttribute('aria-selected') === 'true') === 0; }));
await p.keyboard.press('Escape'); await sleep(100);
ok('Escape closes the list', await p.evaluate(() => document.querySelector('#hero-q-list').hidden && document.querySelector('#hero-q').getAttribute('aria-expanded') === 'false'));
await p.keyboard.press('ArrowDown'); await sleep(200);
ok('ArrowDown reopens', await p.evaluate(() => !document.querySelector('#hero-q-list').hidden));
await p.keyboard.press('Enter'); await sleep(900);
ok('Enter on a group result opens it in the price list (deep link, same page)', await p.evaluate(() => { const g = document.querySelector('.grp.is-open.is-flash, .grp.is-flash'); return !!g && /botox/i.test(g.querySelector('.grp__t').textContent); }), await p.evaluate(() => location.href));
// price list uses the same engine
console.log('before price loop:', await p.evaluate(() => location.href + ' ' + !!document.querySelector('#price-q')));
await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
for (const q of ['ozilci od akni', 'kako smanjiti obim', 'blistava koza', 'opadanje kose', 'depilacija']) {
  await p.click('#price-q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type('#price-q', q, { delay: 5 }); await sleep(700);
  const r = await p.evaluate(() => ({ st: document.querySelector('#price-status').textContent, vis: [...document.querySelectorAll('.svc')].filter((s) => !s.hidden).length, tags: /#[a-z]/i.test(document.querySelector('#price-shell').textContent) }));
  ok(`price list "${q}": ${r.vis} rows, status "${r.st.slice(0, 50)}"`, r.vis > 0 && !r.tags && !/Nema rezultata/.test(r.st), JSON.stringify(r));
}
// overlay on a sub page
const o = await newPage(b, 390, 844);
await o.goto(`${BASE}/blog/venus-glow.html`, { waitUntil: 'load' }); await sleep(600);
await o.click('#search-open'); await sleep(500);
ok('overlay opens from the header icon', await o.evaluate(() => document.querySelector('#search-ov').classList.contains('is-open') && document.activeElement.id === 'sov-q'));
ok('overlay shows quick links before typing', await o.evaluate(() => document.querySelectorAll('#sov-q-list a').length >= 6));
await o.type('#sov-q', 'celulit', { delay: 10 }); await sleep(600);
const ov = await o.evaluate(() => ({ n: document.querySelectorAll('#sov-q-list [role=option]').length, secs: [...document.querySelectorAll('#sov-q-list .sres__h')].map((x) => x.textContent), href: [...document.querySelectorAll('#sov-q-list .sres__item')].map((a) => a.getAttribute('href')).slice(0, 8) }));
ok('overlay results (treatments + texts) with working relative links', ov.n > 0 && ov.href.every((h) => /^\.\.\/(index\.html\?grupa=|blog\/|posebna-ponuda\.html#|index\.html\?q=)/.test(h)), JSON.stringify(ov));
await o.keyboard.press('Escape'); await sleep(400);
ok('Escape closes the overlay and returns focus to the button', await o.evaluate(() => !document.querySelector('#search-ov').classList.contains('is-open') && document.activeElement.id === 'search-open'));
await o.click('#search-open'); await sleep(400);
await o.type('#sov-q', 'botoks', { delay: 10 }); await sleep(600);
await o.keyboard.press('Enter'); await o.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {}); await sleep(900);
ok('overlay Enter follows the first result (home deep link opens a group)', await o.evaluate(() => /index\.html/.test(location.pathname) && /grupa=/.test(location.search) && !!document.querySelector('.grp.is-flash')), await o.evaluate(() => location.href));
ok('no console errors', !p.__log.errors.length && !o.__log.errors.length, JSON.stringify([p.__log, o.__log]));
await b.close();
console.log(res.map((r) => r.join(' ')).join('\n')); const f = res.filter((r) => r[0] === 'FAIL').length; console.log(`\n${res.length - f}/${res.length} passed`); process.exit(f ? 1 : 0);
