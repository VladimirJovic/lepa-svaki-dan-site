// Home page still works after the refactor: sections, spy, parallax, teasers (data-sig unchanged), price list, search, reduced motion on sub pages.
import { launch, newPage, sleep, BASE } from './lib.mjs';
const b = await launch(); const res = []; const ok = (n, c, x = '') => res.push([c ? 'PASS' : 'FAIL', n, c ? '' : x]);
const p = await newPage(b, 1440, 900);
await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(800);
ok('home: no console errors', !p.__log.errors.length, JSON.stringify(p.__log));
ok('home: offers teaser pre-render is current (no re-render needed)', await p.evaluate(() => document.querySelector('#offers').getAttribute('data-sig') === LSD_OFFERS_VIEW.sig(LSD_CONTENT.offers)));
ok('home: 4 teaser rows link to posebna-ponuda.html#slug', await p.evaluate(() => [...document.querySelectorAll('#offers .orow')].every((a) => /^posebna-ponuda\.html#[a-z-]+$/.test(a.getAttribute('href'))) && document.querySelectorAll('#offers .orow').length === 4));
ok('home: 4 segment cards + 5 blog teaser cards', await p.evaluate(() => document.querySelectorAll('#saznajte-vise .scard').length === 4 && document.querySelectorAll('#posts .work').length === 5));
ok('home: price list, favorites, gifts, testimonials rendered', await p.evaluate(() => document.querySelectorAll('.svc').length === 210 && document.querySelectorAll('#favorites .shell').length > 0 && document.querySelectorAll('#gift-list .shell').length > 0 && document.querySelectorAll('.tq').length === 4));
await p.evaluate(() => scrollTo({ top: document.querySelector('#lokacije').offsetTop - 100, behavior: 'instant' })); await sleep(500);
ok('home: nav marks the current section (Lokacije)', await p.evaluate(() => { const a = document.querySelector('.nav__links a[aria-current]'); return a && a.textContent === 'Lokacije'; }));
await p.evaluate(() => scrollTo({ top: 600, behavior: 'instant' })); await sleep(400);
ok('home: hero parallax transform applied on scroll', await p.evaluate(() => /translate/.test(document.querySelector('#hero-img').style.transform)));
ok('home: nav shadow class on scroll', await p.evaluate(() => document.documentElement.classList.contains('is-scrolled')));
await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
await p.type('#price-q', 'glow'); await sleep(600);
ok('home: price search still works', await p.evaluate(() => /rezultat/.test(document.querySelector('#price-status').textContent)));
// blog teaser links
const links = await p.$$eval('#posts a', (as) => as.map((a) => a.getAttribute('href')));
ok('home: blog teaser links are real article pages', links.length === 5 && links.every((h) => /^blog\/[a-z0-9-]+\.html$/.test(h)), links.join(' '));
// phone: bar hides over the price list, shows elsewhere
const m = await newPage(b, 390, 844);
await m.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(700);
ok('mobile home: action bar visible at top', await m.evaluate(() => !document.querySelector('#bar').classList.contains('is-hidden')));
await m.evaluate(() => scrollTo({ top: document.querySelector('#price-shell').offsetTop + 300, behavior: 'instant' })); await sleep(500);
ok('mobile home: action bar hidden while the price list is on screen', await m.evaluate(() => document.querySelector('#bar').classList.contains('is-hidden')));
await m.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await sleep(500);
ok('mobile home: action bar hidden at the footer', await m.evaluate(() => document.querySelector('#bar').classList.contains('is-hidden')));
await m.evaluate(() => scrollTo({ top: 300, behavior: 'instant' })); await sleep(500);
ok('mobile home: action bar back after scrolling up', await m.evaluate(() => !document.querySelector('#bar').classList.contains('is-hidden')));
// sub page: bar hides at footer too, content never covered at the end
const s = await newPage(b, 390, 844);
await s.goto(`${BASE}/blog/hijaluronski-fileri.html`, { waitUntil: 'load' }); await sleep(500);
ok('mobile article: action bar visible while reading', await s.evaluate(() => !document.querySelector('#bar').classList.contains('is-hidden')));
await s.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await sleep(500);
ok('mobile article: action bar tucked away at the footer; last footer line fully visible', await s.evaluate(() => { const c = document.querySelector('.foot__credit').getBoundingClientRect(); return document.querySelector('#bar').classList.contains('is-hidden') && c.bottom <= innerHeight + 1; }));
// reduced motion: reveal never hides content
for (const pg of ['blog.html', 'blog/venus-glow.html', 'tretmani/telo.html', 'posebna-ponuda.html']) {
  const r = await newPage(b, 390, 844, { rm: true });
  await r.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(500);
  ok(`reduced motion ${pg}: all .rv content visible, no running animations`, await r.evaluate(() => [...document.querySelectorAll('.rv')].every((e) => getComputedStyle(e).opacity === '1') && document.getAnimations().filter((a) => a.playState === 'running' && !a.effect.target.closest('.dot')).length === 0));
  await r.close();
}
await b.close();
console.log(res.map((r) => r.join(' ')).join('\n')); const f = res.filter((r) => r[0] === 'FAIL').length; console.log(`\n${res.length - f}/${res.length} passed`); process.exit(f ? 1 : 0);
