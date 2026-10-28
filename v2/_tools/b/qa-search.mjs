/* R6 checks: the engine answers the women's wording honestly (non-empty, sensible top results), the overlay works from the hero bar and from the header
   of a sub page (keyboard: arrows, Enter, Escape, aria-live count, friendly empty state), no hashtags anywhere, the price-list filter uses the same engine.
   usage: node qa-search.mjs [--verbose]                                                            Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, sleep, BASE, OUT } from './qa-lib.mjs';
const verbose = process.argv.includes('--verbose');
const b = await launch(); let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const QUERIES = ['glass skin', 'blistava koza', 'blistava koža', 'akne', 'lecenje akni', 'ozilci od akni', 'ožiljci od akni', 'cista koza', 'kako smanjiti obim', 'celulit', 'pigmentacija', 'bore', 'botoks', 'depilacija', 'opadanje kose', 'masaza', 'hijaluron', 'poklon',
  'kako da smanjim vidljivost pora', 'podocnjaci', 'ukljesteni vrat', 'rastezanje', 'hijaluronski', 'filer', 'lasersk', 'dermapen', 'venus', 'wedding', 'mršavljenje', 'strije', 'bradavice', 'znojenje'];
const p = await newPage(b, 1440, 900);
await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
await p.evaluate(() => window.LSD.search.load()); await sleep(300);
console.log('A. engine, ' + QUERIES.length + ' queries');
for (const q of QUERIES) {
  const r = await p.evaluate((q) => { const R = window.LSD.search.search(q), S = window.LSD_SEARCH; return { total: R.total, soft: R.soft, g: R.groups.slice(0, 3).map((x) => S.groups[x.gi].t + ' [' + S.tabs[S.groups[x.gi].ti].label + ']'), a: R.arts.slice(0, 2).map((x) => S.arts[x.i].t), o: R.offers.slice(0, 2).map((x) => S.offers[x.i].t), ng: R.groups.length, na: R.arts.length, no: R.offers.length }; }, q);
  const line = `"${q}": ${r.ng} grupa, ${r.na} tekstova, ${r.no} ponuda${r.soft ? ' (najbliže)' : ''}`;
  if (!r.total) ok(false, line + ' -> EMPTY'); else { ok(true, line); if (verbose) console.log('      ' + [...r.g, ...r.a.map((x) => 'T:' + x), ...r.o.map((x) => 'P:' + x)].join(' | ')); }
}
console.log('B. matching rules');
const f = (q) => p.evaluate((q) => { const R = window.LSD.search.search(q); return { g: R.groups.map((x) => window.LSD_SEARCH.groups[x.gi].id), n: R.total }; }, q);
const a1 = await f('AKNE'), a2 = await f('akne'), a3 = await f('Akné'); ok(JSON.stringify(a1) === JSON.stringify(a2), 'case-insensitive (AKNE = akne)');
const d1 = await f('ozilci od akni'), d2 = await f('ožiljci od akni'); ok(JSON.stringify(d1) === JSON.stringify(d2), 'diacritics ignored (ozilci = ožiljci)');
const pa = await f('akn'); ok(pa.n > 0, 'partial word: "akn" finds results (' + pa.n + ')');
const mw = await f('venus legacy telo'); ok(mw.n > 0, 'several words: "venus legacy telo" (' + mw.n + ')');
const gib = await f('qqzzxx'); ok(gib.n === 0, 'nonsense gives the empty state, not noise');
const sk = await p.evaluate(() => { const S = window.LSD.search.services('blistava koza'); return S && S.count; }); ok(sk > 0, 'price-list engine: "blistava koza" keeps ' + sk + ' service rows');
console.log('C. overlay on the home page (hero bar)');
await p.click('.hsearch'); await sleep(500);
let st = await p.evaluate(() => ({ open: document.querySelector('#search').classList.contains('is-open'), focus: document.activeElement.id, main: document.querySelector('#main').inert, intro: !!document.querySelector('#sres .sr--intro'), q: document.querySelectorAll('#sres .sr__q').length }));
ok(st.open && st.focus === 'sq' && st.main && st.intro && st.q >= 5, `opens, input focused, page inert, intro with ${st.q} natural questions`);
await p.type('#sq', 'ozilci od akni'); await sleep(500);
st = await p.evaluate(() => ({ sections: [...document.querySelectorAll('#sres .sr__h')].map((h) => h.textContent), rows: document.querySelectorAll('#sres .sr__a').length, live: document.querySelector('#slive').textContent, hash: /#[a-zA-Z]/.test(document.querySelector('#sres').innerText), tabs: [...document.querySelectorAll('#sres .sr__tab')].map((x) => x.textContent) }));
ok(st.sections.some((s) => /^Tretmani/.test(s)) && st.rows > 2, `grouped results: ${st.sections.join(' / ')} (${st.rows} rows); tabs: ${st.tabs.join(', ')}`);
ok(/Pronađeno: \d+ rezultat/.test(st.live), 'aria-live count: "' + st.live + '"');
ok(!st.hash, 'no hashtag visible in the results');
await p.keyboard.press('ArrowDown'); let cls = await p.evaluate(() => document.activeElement.className); ok(/sr__a/.test(cls), 'ArrowDown moves from the input to the first result');
await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); ok((await p.evaluate(() => document.activeElement.id)) === 'sq', 'ArrowUp returns to the input');
await p.keyboard.press('Enter'); await sleep(900);
const nav = await p.evaluate(() => ({ open: document.querySelector('#search').classList.contains('is-open'), hash: location.hash, tab: document.querySelector('.tab[aria-selected="true"]').textContent, flash: !!document.querySelector('.flash-g, .svc.flash') }));
ok(!nav.open && /#usluge/.test(nav.hash), `Enter opens the first result in place on the home page (no reload): ${nav.hash}, tab "${nav.tab}", highlighted ${nav.flash}`);
await p.click('.nav__s'); await sleep(400); await p.type('#sq', 'qqzzxx'); await sleep(400);
st = await p.evaluate(() => ({ none: document.querySelector('#sres .sr--none')?.innerText || '', links: [...document.querySelectorAll('#sres .sr--none a')].map((a) => a.getAttribute('href')), live: document.querySelector('#slive').textContent }));
ok(/Nismo pronašli/.test(st.none) && st.links.some((l) => /^tel:/.test(l)) && st.links.some((l) => /wa\.me/.test(l)), 'friendly empty state offers both phones and WhatsApp: ' + st.links.join(' '));
await p.keyboard.press('Escape'); await sleep(400);
ok(await p.evaluate(() => !document.querySelector('#search').classList.contains('is-open') && !document.querySelector('#main').inert && document.activeElement.className.includes('nav__s')), 'Escape closes, unlocks the page, returns focus to the opener');
console.log('D. price-list filter uses the same engine');
await p.evaluate(() => { const i = document.querySelector('#pq'); i.value = 'ozilci od akni'; i.dispatchEvent(new Event('input')); }); await sleep(900);
const pf = await p.evaluate(() => ({ visible: document.querySelectorAll('.svc:not([hidden])').length, hint: document.querySelector('#phint').textContent, tags: document.querySelectorAll('[data-tags], .tag-chip').length, hash: /#[a-zA-Z]/.test(document.querySelector('#plist').innerText) }));
ok(pf.visible > 0 && pf.tags === 0 && !pf.hash, `price list: "ozilci od akni" keeps ${pf.visible} rows, hint "${pf.hint}", no tag chips or # in the list`);
for (const q of ['kako smanjiti obim', 'blistava koza', 'celulit', 'bore', 'masaža']) {
  await p.evaluate((q) => { const i = document.querySelector('#pq'); i.value = q; i.dispatchEvent(new Event('input')); }, q); await sleep(800);
  const r = await p.evaluate(() => ({ visible: document.querySelectorAll('.svc:not([hidden])').length, groups: document.querySelectorAll('.grp:not([hidden])').length, hint: document.querySelector('#phint').textContent }));
  ok(r.visible > 0, `price list "${q}": ${r.visible} service rows in ${r.groups} groups ("${r.hint}")`);
}
await p.evaluate(() => { const i = document.querySelector('#pq'); i.value = ''; i.dispatchEvent(new Event('input')); }); await sleep(500);
ok(await p.evaluate(() => document.querySelectorAll('.svc:not([hidden])').length > 20), 'price list: clearing the filter brings the full list back');
await p.close();
console.log('E. overlay from a sub page (390, touch)');
const m = await newPage(b, 390, 844);
await m.goto(`${BASE}/blog/hijaluronski-fileri.html`, { waitUntil: 'networkidle0' });
await m.tap('.nav__s'); await sleep(600);
await m.type('#sq', 'celulit'); await sleep(600);
st = await m.evaluate(() => { const r = document.querySelector('#sres'), a = [...document.querySelectorAll('#sres .sr__a')]; return { rows: a.length, hrefs: a.slice(0, 3).map((x) => x.getAttribute('href')), h: Math.round(document.querySelector('#search').getBoundingClientRect().height), vh: innerHeight, scrollable: r.scrollHeight > r.clientHeight, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth }; });
ok(st.rows > 0 && st.hrefs.every((h) => /^http/.test(h)) && !st.overflowX, `results from a sub page link to absolute site URLs (${st.hrefs[0]}), no horizontal scroll, overlay ${st.h}px of ${st.vh}px`);
await m.screenshot({ path: OUT + '/search-390.png' });
await m.close();
await b.close();
console.log(bad ? `\n${bad} check(s) failed` : '\nall search checks passed');
process.exit(bad ? 1 : 0);
