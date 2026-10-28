// Functional checks for the feedback round: header phones, action-bar sheet, hero search above the fold, split, comment mode, CTA / footer text.
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, sleep, scrollThrough, BASE, SITE } from './lib.mjs';
const b = await launch(); const res = []; const ok = (n, c, x = '') => res.push([c ? 'PASS' : 'FAIL', n, c ? '' : String(x).slice(0, 300)]);
const P1 = '+381 64 8239 439', P2 = '+381 66 177 117';

/* ---- R9: header with both phones (desktop) ---- */
for (const W of [1100, 1280, 1366, 1440, 1920]) {
  const p = await newPage(b, W, 900); await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(400);
  const r = await p.evaluate(() => {
    const pill = document.querySelector('.nav__pill').getBoundingClientRect(), t = [...document.querySelectorAll('.nav__tel')];
    const items = ['.nav__logo', '.nav__links', '.nav__phones', '.nav__search', '.nav__cta'].map((s) => { const e = document.querySelector(s); const cs = getComputedStyle(e); return { s, vis: cs.display !== 'none', r: e.getBoundingClientRect() }; }).filter((x) => x.vis);
    let overlap = false; for (let i = 1; i < items.length; i++) if (items[i].r.left < items[i - 1].r.right - 0.5) overlap = true;
    return { tel: t.map((x) => x.textContent + '|' + x.getAttribute('href') + '|' + getComputedStyle(x).display), inside: items.every((x) => x.r.left >= pill.left - 1 && x.r.right <= pill.right + 1), overlap, burger: getComputedStyle(document.querySelector('#burger')).display, n: items.length };
  });
  ok(`R9 desktop header @${W}: both phone links (tel:), inside the pill, nothing overlaps, no burger`, r.tel.length === 2 && r.tel[0].startsWith(P1 + '|tel:+381648239439') && r.tel[1].startsWith(P2 + '|tel:+38166177117') && r.inside && !r.overlap && r.burger === 'none' && r.n === 5, JSON.stringify(r));
  await p.close();
}
{ const p = await newPage(b, 1024, 768); await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(300);
  ok('header @1024 (no room for links + phones): burger + search, menu carries both numbers', await p.evaluate(() => getComputedStyle(document.querySelector('#burger')).display !== 'none' && getComputedStyle(document.querySelector('.nav__phones')).display === 'none' && [...document.querySelectorAll('#menu .menu__phone')].length === 2)); await p.close(); }

/* ---- the fixed action bar and the nav pill fit every phone / tablet width (fixed elements are invisible to the page overflow test) ---- */
for (const W of [320, 340, 360, 375, 390, 414, 600, 768, 1023]) {
  const p = await newPage(b, W, 800); await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(300);
  const r = await p.evaluate(() => { const vw = document.documentElement.clientWidth; const kids = [...document.querySelectorAll('#bar .bar__btn')].map((x) => x.getBoundingClientRect()); const pill = [...document.querySelectorAll('.nav__pill > *')].filter((x) => getComputedStyle(x).display !== 'none').map((x) => x.getBoundingClientRect()); const inb = (a) => a.every((r) => r.left >= -0.5 && r.right <= vw + 0.5); let ov = false; for (let i = 1; i < kids.length; i++) if (kids[i].left < kids[i - 1].right - 0.5) ov = true; for (let i = 1; i < pill.length; i++) if (pill[i].left < pill[i - 1].right - 0.5) ov = true; const pr = document.querySelector('.nav__pill').getBoundingClientRect(); return { bar: inb(kids), pillIn: pill.every((r) => r.left >= pr.left - 0.5 && r.right <= pr.right + 0.5), ov, h: kids.map((k) => Math.round(k.height)) }; });
  ok(`fixed bar + nav pill fit @${W}: buttons inside the screen, nothing overlaps, targets >= 44px high`, r.bar && r.pillIn && !r.ov && r.h.every((x) => x >= 44), JSON.stringify(r)); await p.close();
}
/* ---- phone: menu, action bar sheet, hero search above the fold ---- */
const m = await newPage(b, 390, 844);
await m.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(900);
ok('R6 hero search bar fully visible on a 390x844 phone without scrolling (above the action bar)', await m.evaluate(() => { const r = document.querySelector('#hero-q').getBoundingClientRect(), bar = document.querySelector('#bar').getBoundingClientRect(); return r.top > 60 && r.bottom < bar.top - 4; }), await m.evaluate(() => JSON.stringify(document.querySelector('#hero-q').getBoundingClientRect())));
ok('R6 placeholder is a Serbian question/example', await m.evaluate(() => /Šta vas zanima/.test(document.querySelector('#hero-q').getAttribute('placeholder'))));
ok('R9 hero lead line + sentence (exact wording)', await m.evaluate(() => document.querySelector('.hero__lead .eyebrow').textContent.trim() === '2 lokacije, 1 filozofija' && document.querySelector('.hero__sub').textContent.trim() === 'Spoj moderne medicine i estetike sa tradicionalnom negom i tretmanima za očuvanje i unapređenje lepote.'));
ok('R9 both CTAs of the hero also above the action bar', await m.evaluate(() => { const bar = document.querySelector('#bar').getBoundingClientRect(); return [...document.querySelectorAll('.hero__ctas .btn')].every((a) => a.getBoundingClientRect().bottom < bar.top); }));
await m.tap('#bar [data-sheet="tel"]'); await sleep(500);
ok('R9 Pozovi opens a sheet with BOTH numbers as big tel: buttons', await m.evaluate(() => { const d = document.querySelector('#contact-sheet'); const a = [...d.querySelectorAll('.sheet__big:not([hidden]) a')]; return d.open && a.length === 2 && a[0].href === 'tel:+381648239439' && a[1].href === 'tel:+38166177117' && a.every((x) => x.getBoundingClientRect().height >= 60) && /Pozovite/.test(d.querySelector('.sheet__t').textContent); }));
await m.keyboard.press('Escape'); await sleep(300);
await m.tap('#bar [data-sheet="wa"]'); await sleep(500);
ok('R9 WhatsApp opens a sheet with BOTH wa.me numbers', await m.evaluate(() => { const d = document.querySelector('#contact-sheet'); const a = [...d.querySelectorAll('.sheet__big:not([hidden]) a')]; return d.open && a.length === 2 && /wa\.me\/381648239439/.test(a[0].href) && /wa\.me\/38166177117/.test(a[1].href) && /WhatsApp/.test(d.querySelector('.sheet__t').textContent); }));
await m.tap('#contact-sheet-x'); await sleep(300);
ok('sheet closes, focus back on the bar button', await m.evaluate(() => !document.querySelector('#contact-sheet').open && document.activeElement && document.activeElement.getAttribute('data-sheet') === 'wa'));
await m.tap('#burger'); await sleep(500);
ok('R9 mobile menu lists both phones as large targets', await m.evaluate(() => { const a = [...document.querySelectorAll('#menu .menu__phone')]; return a.length === 2 && a.every((x) => x.getBoundingClientRect().height >= 48 && /^tel:/.test(x.getAttribute('href'))); }));
await m.keyboard.press('Escape'); await sleep(300);
ok('R14 testimonial counter has no leading zero', await m.evaluate(() => document.querySelector('#testi-count').textContent === '1 / 4'));

/* ---- first viewport: search bar visible at every common size ---- */
for (const [W, H] of [[320, 568], [360, 740], [375, 667], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 720], [1440, 900]]) {
  const p = await newPage(b, W, H); await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(900);
  const r = await p.evaluate(() => { const q = document.querySelector('#hero-q').getBoundingClientRect(), bar = document.querySelector('#bar'), bt = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight; return { top: Math.round(q.top), bottom: Math.round(q.bottom), barTop: Math.round(bt), vh: innerHeight, h1: Math.round(document.querySelector('.hero__h1').getBoundingClientRect().bottom) }; });
  const tight = (W <= 375 && H <= 667);
  ok(`R6 first viewport ${W}x${H}: search bar ${tight ? '(small phone: at least its top)' : 'fully'} visible`, tight ? r.top < r.barTop - 20 : (r.bottom <= r.barTop - 2 && r.top > 0), JSON.stringify(r));
  await p.close();
}

/* ---- R12 split ---- */
{ const d = await newPage(b, 1440, 900); await d.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(500);
  await d.evaluate(() => document.querySelector('#split').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(400);
  const w0 = await d.evaluate(() => [...document.querySelectorAll('.sp')].map((x) => Math.round(x.getBoundingClientRect().width)));
  ok('R12 desktop: two halves side by side that touch, equal at rest', w0.length === 2 && Math.abs(w0[0] - w0[1]) < 3 && await d.evaluate(() => { const [a, c] = [...document.querySelectorAll('.sp')].map((x) => x.getBoundingClientRect()); return Math.abs(a.right - c.left) < 1.5 && a.height > 400; }), JSON.stringify(w0));
  const r2 = await d.evaluate(() => { const r = document.querySelectorAll('.sp')[1].getBoundingClientRect(); return [r.left + r.width / 2, r.top + 100]; });
  await d.mouse.move(r2[0] - 5, r2[1]); await d.mouse.move(r2[0], r2[1]); await sleep(900);
  const w1 = await d.evaluate(() => [...document.querySelectorAll('.sp')].map((x) => Math.round(x.getBoundingClientRect().width)));
  ok('R12 desktop: hovering a half widens it', w1[1] > w0[1] + 80 && w1[0] < w0[0] - 80, JSON.stringify([w0, w1]));
  ok('R12 each half carries concept name, address, phone + WhatsApp links', await d.evaluate(() => [...document.querySelectorAll('.sp')].every((h) => h.querySelector('.sp__name').textContent.trim() && h.querySelector('.sp__addr').textContent.trim() && h.querySelector('a[href^="tel:"]') && h.querySelector('a[href*="wa.me"]'))));
  ok('R12 headline adapted ("1 filozofija, 2 lokacije")', await d.evaluate(() => document.querySelector('#loc-title').textContent.trim() === '1 filozofija, 2 lokacije.'));
  await d.mouse.move(5, 5); await d.click('.sp:first-child .sp__name button'); await sleep(900);
  ok('R12 click keeps a half wide (touch tablets: tap)', await d.evaluate(() => { const [a, c] = [...document.querySelectorAll('.sp')].map((x) => x.getBoundingClientRect().width); return a > c + 80 && document.querySelector('.sp.is-active'); })); await d.close(); }
{ const t = await newPage(b, 390, 844); await t.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(500);
  await t.evaluate(() => document.querySelector('#split').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(400);
  const s0 = await t.evaluate(() => [...document.querySelectorAll('.sp')].map((x) => ({ h: Math.round(x.getBoundingClientRect().height), act: x.classList.contains('is-active'), more: getComputedStyle(x.querySelector('.sp__more')).display })));
  ok('R12 phone: first half open, second folded', s0[0].act && !s0[1].act && s0[0].more !== 'none' && s0[1].more === 'none' && s0[0].h > s0[1].h + 150, JSON.stringify(s0));
  await t.tap('.sp:nth-child(2) .sp__name button'); await sleep(700);
  const s1 = await t.evaluate(() => [...document.querySelectorAll('.sp')].map((x) => ({ act: x.classList.contains('is-active'), exp: x.querySelector('.sp__name button').getAttribute('aria-expanded'), more: getComputedStyle(x.querySelector('.sp__more')).display })));
  ok('R12 phone: tap switches to the other half (aria-expanded follows)', !s1[0].act && s1[1].act && s1[1].exp === 'true' && s1[0].exp === 'false' && s1[1].more !== 'none', JSON.stringify(s1)); await t.close(); }

/* ---- price list opened from a search (?q=) and "Svi rezultati u cenovniku" ---- */
{ const q = await newPage(b, 1440, 900); await q.goto(`${BASE}/index.html?q=ozilci%20od%20akni#usluge`, { waitUntil: 'load' }); await sleep(1500);
  ok('?q= fills the price-list search and filters it (synonym "ozilci od akni")', await q.evaluate(() => document.querySelector('#price-q').value === 'ozilci od akni' && [...document.querySelectorAll('.svc')].filter((s) => !s.hidden).length > 0 && [...document.querySelectorAll('.svc')].filter((s) => !s.hidden).length < 60 && /rezultat/.test(document.querySelector('#price-status').textContent)), await q.evaluate(() => document.querySelector('#price-status').textContent));
  await q.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await q.click('#price-clear'); await sleep(300);
  await q.type('#hero-q', 'celulit', { delay: 8 }); await sleep(600); await q.click('#hero-q-list .sres__more'); await sleep(1200);
  ok('"Svi rezultati u cenovniku" runs the same query in the price list (no reload)', await q.evaluate(() => document.querySelector('#price-q').value === 'celulit' && /rezultat/.test(document.querySelector('#price-status').textContent) && document.querySelector('#hero-q-list').hidden)); await q.close(); }
{ const q = await newPage(b, 1440, 900); await q.goto(`${BASE}/posebna-ponuda.html`, { waitUntil: 'load' }); await sleep(500);
  ok('R8 offers page: nav marks Posebna ponuda, 4 offers, editable data file documented', await q.evaluate(() => { const a = document.querySelector('.nav__links a[aria-current="page"]'); return a && a.textContent === 'Posebna ponuda' && document.querySelectorAll('.ocard').length === 4; }) && /HOW TO ADD, EDIT OR REMOVE AN OFFER/.test(fs.readFileSync(path.join(SITE, 'assets/offers.js'), 'utf8'))); await q.close(); }

/* ---- R13 final CTA + footer ---- */
{ const f = await newPage(b, 1440, 900); await f.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(400);
  const r = await f.evaluate(() => ({ h: document.querySelector('.cta__h2').textContent.replace(/\s+/g, ' ').trim(), tel: [...document.querySelectorAll('.cta a[href^="tel:"]')].map((a) => a.getAttribute('href')), mail: !!document.querySelector('.cta a[href="mailto:office@lepasvakidan.rs"]'), ig: !!document.querySelector('.cta a[href="https://instagram.com/bclepasvakidan"]'), wa: !!document.querySelector('.cta a[data-sheet="wa"]'), foot: document.querySelector('.foot__brand p').textContent.trim(), sub: document.querySelector('.hero__sub').textContent.trim() }));
  ok('R13 final CTA text', r.h === 'Vaše uživanje i briga o lepoti počinju ovde. Zakažite svoj termin.', r.h);
  ok('R13 CTA leads to calls (both numbers), e-mail, Instagram, WhatsApp', r.tel.length === 2 && r.mail && r.ig && r.wa, JSON.stringify(r));
  ok('R13 footer description equals the hero sentence', r.foot === r.sub, r.foot);
  await f.close(); }

/* ---- R7 comment mode ---- */
{ const q = await newPage(b, 1440, 900); await q.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await sleep(500);
  ok('R7 without the parameter nothing is injected', await q.evaluate(() => !document.querySelector('.lsd-rv, .lsd-rv-hint, #lsd-review-css'))); await q.close(); }
for (const [pg, W, exp] of [['index.html?komentari', 390, /^C-\d+ /], ['index.html#komentari', 1440, /^C-\d+ /], ['blog.html?komentari', 390, /^C-blog-\d+ /], ['blog/venus-glow.html?komentari', 390, /^C-tekst-\d+-\d+ /], ['tretmani/telo.html?komentari', 390, /^C-telo-\d+ /], ['posebna-ponuda.html?komentari', 1440, /^C-posebna-ponuda-\d+ /]]) {
  const q = await newPage(b, W, 844); await q.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(700); await scrollThrough(q, 700);
  const r = await q.evaluate(() => { const bs = [...document.querySelectorAll('.lsd-rv')]; const vw = document.documentElement.clientWidth; return { t: bs.map((x) => x.textContent), out: bs.filter((x) => { const r = x.getBoundingClientRect(); return r.left < -1 || r.right > vw + 1; }).length, doc: document.documentElement.scrollWidth - vw, hint: (document.querySelector('.lsd-rv-hint') || {}).textContent, hintIn: (() => { const h = document.querySelector('.lsd-rv-hint'); if (!h) return false; const r = h.getBoundingClientRect(); return r.left >= 0 && r.right <= vw; })() }; });
  ok(`R7 ${pg} @${W}: ${r.t.length} badges, codes ${r.t[2] ? r.t[2].split(' ')[0] : ''}, no zero-padded numbers, hint bar, no overflow`, r.t.length >= 3 && r.t.every((x) => exp.test(x) && !/-0\d/.test(x)) && /^Komentari: navedite oznaku, npr\. C-/.test(r.hint) && r.hintIn && r.out === 0 && r.doc <= 0, JSON.stringify(r).slice(0, 300));
  if (pg.startsWith('index.html?')) { const names = r.t.map((x) => x.replace(/^\S+ /, '')); ok('R7 home badges name the sections (Cenovnik, Lokacije ...)', ['Cenovnik', 'Lokacije', 'Blog'].every((n) => names.includes(n)), names.join(', ')); }
  await q.close();
}
{ const q = await newPage(b, 1440, 900); await q.goto(`${BASE}/index.html?komentari`, { waitUntil: 'load' }); await sleep(500);
  await q.evaluate(() => document.querySelector('.nav__links a[href="blog.html"]').click()); await q.waitForNavigation({ waitUntil: 'load' }); await sleep(500);
  ok('R7 ?komentari follows the links between pages', await q.evaluate(() => /komentari/.test(location.search) && document.querySelectorAll('.lsd-rv').length > 3), await q.evaluate(() => location.href)); await q.close(); }
ok('no console errors anywhere', [m].every((x) => !x.__log.errors.length), JSON.stringify(m.__log));
await b.close();
console.log(res.map((r) => r.join(' ')).join('\n')); const f = res.filter((r) => r[0] === 'FAIL').length; console.log(`\n${res.length - f}/${res.length} passed`); process.exit(f ? 1 : 0);
