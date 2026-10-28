/* Client feedback round 2: one check per item (R1 to R15), static (files) and rendered (every page). Exit code 1 on any failure.
   usage: node qa-rules.mjs                                                                                     Pripremio ECHOSYSTEM-MOTHER AGENCY */
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, sleep, BASE, SITE, allPages } from './qa-lib.mjs';
const ROOT = path.resolve(SITE, '..');
let bad = 0;
/* the em dash and its escape spellings are built from pieces, so this script carries none of them itself */
const DASHES = [String.fromCharCode(8212), '&md' + 'ash;', '\\' + 'u2014', '\\\\' + 'u2014'];
const hasDash = (t) => DASHES.some((d) => t.includes(d));
const ok = (c, m) => { if (!c) { bad++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f, out); else if (/\.(html|css|js|svg|txt|json|mjs)$/.test(e.name)) out.push(f); } return out; };
const siteFiles = walk(SITE), toolFiles = walk(path.join(ROOT, '_tools', 'b'));
const read = (f) => fs.readFileSync(f, 'utf8');
const rel = (f) => path.relative(ROOT, f);
const pages = allPages();
const C = JSON.parse(read(path.join(ROOT, '_shared', 'content', 'content.json')));

console.log('STATIC (every file of the site' + ' and of the tools)');
{
  const hits = [...siteFiles, ...toolFiles].filter((f) => hasDash(read(f)));
  ok(!hits.length, 'R15 no em dash (character, &md' + 'ash; or its escape) in any file of the site and the tools: ' + (hits.map(rel).join(', ') || 'none'));
  const emo = siteFiles.filter((f) => /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}]/u.test(read(f)));
  ok(!emo.length, 'R11 no emoji or pictographic character in any site file: ' + (emo.map(rel).join(', ') || 'none'));
  const sprite = read(path.join(SITE, 'index.html')).match(/<defs>([\s\S]*?)<\/defs>/)[1];
  const cols = [...sprite.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8}|rgb[^"]*)"/g)];
  ok(!cols.length, 'R11 every icon of the sprite is one colour (currentColor), no multi-colour graphics: ' + cols.length + ' fixed colours');
  const dr = siteFiles.filter((f) => /\bdr\.?\s+(Tamar|Vuja)|\bDr\.?\s+Tamar/i.test(read(f)));
  ok(!dr.length, 'R10 no "dr Tamara" in any site file: ' + (dr.map(rel).join(', ') || 'none'));
  const founder = read(path.join(SITE, 'assets', 'content.js'));
  ok(/Tamara Vujačić, Lepa Svaki Dan/.test(founder), 'R10 signature "Tamara Vujačić, Lepa Svaki Dan" in the data');
  const drLine = (founder.match(/"name":"[^"]*dr spec[^"]*"/g) || []);
  console.log('  i  R10 note: ' + drLine.length + ' price-list line(s) still carry "dr spec." (' + drLine.join(' ') + '): the 210 service names are fixed by the guardrail, needs the owner\'s word');
  const near = siteFiles.filter((f) => !/brand\.css$/.test(f) && /#231F20|#292627|#322F30|#454340|rgba\(35, ?31, ?32/i.test(read(f)));
  ok(!near.length, 'R2 no near-black (#231F20 #292627 #322F30 #454340, rgba(35,31,32)) outside the brand token file: ' + (near.map(rel).join(', ') || 'none'));
  const css = read(path.join(SITE, 'css', 'main.css')) + read(path.join(SITE, 'css', 'pages.css'));
  ok(/--dark:\s*var\(--charcoal\)/.test(css) && /--charcoal:\s*#5A5758/i.test(read(path.join(SITE, 'assets/brand/brand.css'))), 'R2 --dark is the brandbook 75% BLACK #5A5758 (token --charcoal)');
  ok(/--head-gap:\s*8px/.test(css) && /--head-gap:\s*10px/.test(css), 'R3 --head-gap defined once for the phone (8px) and once from 810px (10px)');
  ok(/--foil:\s*linear-gradient/.test(css) && (css.match(/var\(--foil/g) || []).length > 20 && !/gold-line/.test(css), 'R4 --foil gradient defined and used (' + (css.match(/var\(--foil/g) || []).length + ' uses), the flat gold hairline variable is gone');
  ok(!/decimal-leading-zero/.test(css), 'R14 no decimal-leading-zero counter in the CSS');
  const loc = siteFiles.filter((f) => /locfilter|loc-filter|filterLoc|data-location|priceNB|priceBW/.test(read(f)));
  ok(!loc.length, 'R1 no location filter / toggle code and no priceNB / priceBW in any shipped file: ' + (loc.map(rel).join(', ') || 'none'));
  const tags = siteFiles.filter((f) => /data-tags|"tags":|tagRules|#akne|#antiaging/.test(read(f)));
  ok(!tags.length, 'R6 no hashtags or tag rules shipped: ' + (tags.map(rel).join(', ') || 'none'));
  const tmpl = siteFiles.filter((f) => /lumine|alder|luzia|framer/i.test(read(f)));
  ok(!tmpl.length, 'no template names in any site file: ' + (tmpl.map(rel).join(', ') || 'none'));
  const slim = JSON.parse(read(path.join(SITE, 'assets', 'content.js')).match(/window\.LSD_CONTENT=(\{.*\});/)[1]);
  let n = 0, laserOk = 0; for (const t of slim.pricing.tabs) for (const g of t.groups) for (const s of g.services) { n++; if (Object.keys(s).some((k) => /loc|nb|bw|tags|priceNB|priceBW/i.test(k))) bad++; }
  const lasers = slim.pricing.tabs.find((t) => t.id === 'laserska').groups.flatMap((g) => g.services);
  const full = C.pricing.tabs.find((t) => t.id === 'laserska').groups.flatMap((g) => g.services);
  laserOk = lasers.filter((s, i) => s.price === full[i].price && s.name === full[i].name).length;
  ok(n === 210 && slim.pricing.tabs.length === 5 && slim.pricing.tabs.reduce((a, t) => a + t.groups.length, 0) === 31, `guardrail: ${n} services, ${slim.pricing.tabs.length} tabs, 31 groups; service rows carry only id/name/description/price/onRequest/highlight`);
  ok(laserOk === 28, `R1 laser rows show the old site's unified price only (cheaper of the two, "od" when they differ): ${laserOk}/28 identical to the pack`);
  ok(slim.pricing.validFrom === C.pricing.validFrom && JSON.stringify(slim.payment) === JSON.stringify(C.payment), 'guardrail: validity date and payment note unchanged');
  const h = read(path.join(SITE, 'index.html'));
  ok(h.includes('<p class="hero__lead">2 lokacije, 1 filozofija</p>') && h.includes('Spoj moderne medicine i estetike sa tradicionalnom negom i tretmanima za očuvanje i unapređenje lepote.'), 'R9 hero lead line and the exact sentence');
  ok(pages.every((p) => /<meta name="robots" content="noindex">/.test(read(path.join(SITE, p))) && /Pripremio ECHOSYSTEM-MOTHER AGENCY/.test(read(path.join(SITE, p)))), 'noindex and the credit line on all ' + pages.length + ' pages');
  ok(pages.every((p) => /js\/review\.js/.test(read(path.join(SITE, p))) && /js\/search\.js/.test(read(path.join(SITE, p)))), 'R6/R7 search.js and review.js on every page');
  ok(/HOW TO ADD, EDIT OR REMOVE AN OFFER/.test(read(path.join(SITE, 'js', 'offers.js'))) && /window\.LSD_CONTENT\.offers=/.test(read(path.join(SITE, 'assets', 'content.js'))), 'R8 offers: editability notes in js/offers.js and the data array at the end of assets/content.js');
}

console.log('RENDERED (' + pages.length + ' pages, 390 px)');
const b = await launch();
const results = [];
for (const pg of pages) {
  const p = await newPage(b, 390, 844);
  await p.goto(`${BASE}/${pg}`, { waitUntil: 'networkidle0' }); await sleep(250);
  await p.evaluate(() => { document.documentElement.classList.add('reveal-fallback'); });
  const r = await p.evaluate(() => {
    const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length; };
    const out = { text: document.body.innerText, dash: document.body.innerText.includes(String.fromCharCode(8212)), tagHash: [], lead0: [], recolour: [], purple: [], cline: 0, clineOk: true, clineSmall: 0, h1: document.querySelectorAll('h1').length, locInTreat: [] };
    document.querySelectorAll('main *').forEach((e) => {
      if (!vis(e)) return;
      for (const n of e.childNodes) if (n.nodeType === 3) {
        const t = n.textContent;
        if (/(^|[\s(])#[A-Za-zČčĆćŠšŽžĐđ]{2,}/.test(t)) out.tagHash.push(t.trim().slice(0, 30));
        if (/(^|[\s(\/])0[1-9](?=$|[\s.,)\/])/.test(t) && !/\d:0\d|\d\.0\d\.\d/.test(t)) out.lead0.push(t.trim().slice(0, 30));
      }
      for (const ps of ['::before', '::after']) { const c = getComputedStyle(e, ps).content; if (/^"0[1-9]/.test(c)) out.lead0.push(e.className + ps + ' ' + c); }
    });
    // headings and sentences: ONE colour (no recolouring span, no faded half)
    document.querySelectorAll('h1, h2, h3, h4, .statement, .hero__lead').forEach((h) => {
      if (!vis(h)) return; const c = getComputedStyle(h).color;
      h.querySelectorAll('*').forEach((k) => { if (!(k.textContent || '').trim() || k.closest('svg')) return; const s = getComputedStyle(k); if (s.color !== c || parseFloat(s.opacity) < 1) out.recolour.push(h.className + ' > ' + k.tagName + ' ' + s.color); });
    });
    const purplish = (col) => { const m = col.match(/rgba?\((\d+), (\d+), (\d+)/); if (!m) return false; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > g + 25 && r > g + 8 && b >= r && Math.max(r, g, b) - Math.min(r, g, b) > 30; };
    document.querySelectorAll('main p a, main p span:not([class]), main p em, main p strong, main li a, main li strong, main blockquote *, main .lead *').forEach((k) => {
      if (!vis(k) || k.closest('.pill, mark, .foil, .eyebrow, .btn, .bseg__more')) return;
      const par = k.parentElement; if (!par) return;
      if (getComputedStyle(k).color !== getComputedStyle(par).color && purplish(getComputedStyle(k).color)) out.purple.push(k.tagName + ' ' + getComputedStyle(k).color + ' "' + k.textContent.trim().slice(0, 20) + '"');
    });
    const cl = [...document.querySelectorAll('main .cline')]; out.cline = cl.length;
    cl.forEach((c) => { const hs = [...c.querySelectorAll('a')].map((a) => a.getAttribute('href')); if (!(hs.includes('tel:+381648239439') && hs.includes('tel:+38166177117') && hs.includes('mailto:office@lepasvakidan.rs'))) out.clineOk = false; c.querySelectorAll('a').forEach((a) => { if (a.getBoundingClientRect().height < 43.5) out.clineSmall++; }); });
    // R1: no location words inside treatment blocks
    document.querySelectorAll('#panels, #favs, #gifts, #plist, #offers, #offers-list, .acard, .segcard, .prow2, .blist, .bfeat').forEach((e) => { const m = e.innerText.match(/Novi Beograd|Waterfront|Obe lokacije|Beauty Concept|Wellbeing Concept/g); if (m) out.locInTreat.push((e.id || e.className) + ': ' + m.join(',')); });
    out.scrollW = document.documentElement.scrollWidth; out.clientW = document.documentElement.clientWidth;
    return out;
  });
  results.push({ pg, ...r }); await p.close();
}
const sumBad = (k) => results.filter((r) => r[k] && (Array.isArray(r[k]) ? r[k].length : true));
ok(!sumBad('dash').length, 'R15 no em dash in the rendered text of any page');
ok(!sumBad('tagHash').length, 'R6 no hashtag in the rendered text: ' + (sumBad('tagHash').map((r) => r.pg + ' ' + r.tagHash[0]).join('; ') || 'none'));
ok(!sumBad('lead0').length, 'R14 no leading zero in numbering: ' + (sumBad('lead0').map((r) => r.pg + ' ' + r.lead0.slice(0, 2)).join('; ') || 'none'));
ok(!sumBad('recolour').length, 'R2 every heading and the founder statement are ONE colour (no recolouring span, no faded half): ' + (sumBad('recolour').map((r) => r.pg + ' ' + r.recolour[0]).join('; ') || 'none'));
ok(!sumBad('purple').length, 'R2 no purple word inside running text (links keep the colour of the sentence): ' + (sumBad('purple').map((r) => r.pg + ' ' + r.purple[0]).join('; ') || 'none'));
ok(!sumBad('locInTreat').length, 'R1 no location chip, badge or label on any treatment, favourite, gift, offer, price row or article card: ' + (sumBad('locInTreat').map((r) => r.pg + ' ' + r.locInTreat[0]).join('; ') || 'none'));
ok(results.every((r) => r.h1 === 1), 'one h1 per page');
const noCl = results.filter((r) => r.cline < 1);
ok(!noCl.length, 'R5 contact line on every page: ' + (noCl.map((r) => r.pg).join(', ') || results.length + ' pages'));
ok(results.every((r) => r.clineOk), 'R5 every contact line carries both phones and the e-mail (tel:, mailto:)');
ok(results.every((r) => r.clineSmall === 0), 'R5 contact line targets are at least 44 px on a phone');
const home = results.find((r) => r.pg === 'index.html');
ok(home.cline >= 9, 'R5 home: a contact line at the end of ' + home.cline + ' main sections (not in Lokacije and not in the final CTA)');

console.log('INTERACTIONS');
{
  const p = await newPage(b, 1440, 900);
  await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' }); await sleep(2300);
  const r = await p.evaluate(() => {
    const t = (s) => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim();
    const nav = [...document.querySelectorAll('.nav__tel a')].map((a) => ({ h: a.getAttribute('href'), t: a.textContent.trim(), vis: a.getBoundingClientRect().width > 0, hh: Math.round(a.getBoundingClientRect().height) }));
    const hero = { lead: t('.hero__lead'), sub: t('.hero__sub'), search: document.querySelector('.hsearch').getBoundingClientRect().bottom, foot: t('.foot__brand p') };
    const cta = { h: t('#cta-h'), body: t('.cta__body'), hrefs: [...document.querySelectorAll('#zakazi a')].map((a) => a.getAttribute('href')) };
    const halves = [...document.querySelectorAll('.half')].map((h) => { const r = h.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), name: h.querySelector('h3')?.firstChild?.textContent, addr: h.querySelector('.loc__list li span')?.textContent, tel: h.querySelector('a[href^="tel:"]')?.getAttribute('href'), wa: h.querySelector('a[href*="wa.me"]')?.getAttribute('href') }; });
    return { nav, hero, cta, halves, head: t('#loc-h') };
  });
  ok(r.nav.length === 2 && r.nav.every((n) => /^tel:\+381/.test(n.h) && n.vis && n.hh >= 44), 'R9 desktop header shows both numbers as tel: links (44 px high): ' + r.nav.map((n) => n.t).join(' | '));
  ok(r.hero.lead === '2 lokacije, 1 filozofija' && r.hero.sub === 'Spoj moderne medicine i estetike sa tradicionalnom negom i tretmanima za očuvanje i unapređenje lepote.', 'R9 hero lead line + sentence: "' + r.hero.lead + '"');
  ok(r.hero.foot === r.hero.sub, 'R13 the footer description equals the hero sentence');
  ok(r.cta.h === 'Vaše uživanje i briga o lepoti počinju ovde.' && r.cta.body === 'Zakažite svoj termin.', 'R13 closing CTA text: "' + r.cta.h + ' ' + r.cta.body + '"');
  const hs = r.cta.hrefs; ok(hs.filter((h) => /^tel:/.test(h)).length >= 2 && hs.some((h) => /^mailto:office@lepasvakidan\.rs/.test(h)) && hs.some((h) => h === 'https://instagram.com/bclepasvakidan') && hs.some((h) => /wa\.me/.test(h)), 'R13 closing CTA leads to calls (both numbers), e-mail, Instagram and WhatsApp');
  ok(r.halves.length === 2 && r.halves[0].r === r.halves[1].l, `R12 two halves touch (right edge ${r.halves[0].r} = left edge ${r.halves[1].l}), widths ${r.halves[0].w}/${r.halves[1].w}; headline "${r.head}"`);
  ok(r.halves.every((h) => h.name && h.addr && /^tel:/.test(h.tel) && /wa\.me/.test(h.wa)), 'R12 each half carries concept name, address, phone and WhatsApp: ' + r.halves.map((h) => `${h.name} / ${h.addr} / ${h.tel}`).join(' ; '));
  await p.evaluate(() => document.querySelector('.split').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(500);
  const box = await p.evaluate(() => { const r = document.querySelectorAll('.half')[0].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 100 }; });
  await p.mouse.move(box.x, box.y); await sleep(1100);
  const w = await p.evaluate(() => [...document.querySelectorAll('.half')].map((h) => Math.round(h.getBoundingClientRect().width)));
  ok(w[0] > w[1] + 80, `R12 hover widens a half: ${w.join(' / ')} px`);
  await p.close();
}
{
  const p = await newPage(b, 390, 844);
  await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' }); await sleep(2300);
  const hero = await p.evaluate(() => { const r = document.querySelector('.hsearch').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, vh: innerHeight, ph: document.querySelector('.hsearch__t').textContent }; });
  ok(hero.bottom < hero.vh - 70, `R6 hero search bar is visible without scrolling on 390x844 (bottom ${Math.round(hero.bottom)} of ${hero.vh}, above the action bar): "${hero.ph}"`);
  await p.evaluate(() => document.querySelector('#lokacije .split').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(500);
  await p.evaluate(() => document.querySelector('.split__dot[data-go="1"]').click()); await sleep(900);
  const sw = await p.evaluate(() => ({ cur: document.querySelector('.split__dot[aria-current="true"]').getAttribute('data-go'), count: document.querySelector('.split__count').textContent, left: document.querySelector('.split').scrollLeft }));
  ok(sw.cur === '1' && sw.left > 100 && sw.count === '2 / 2', `R12 touch: the dot switches to the second panel (snap track scrolled ${Math.round(sw.left)} px), counter "${sw.count}"`);
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(300);
  await p.tap('.bar__a[data-sheet="call"]'); await sleep(600);
  let sh = await p.evaluate(() => ({ open: document.querySelector('#csheet').classList.contains('is-open'), btns: [...document.querySelectorAll('#csheet .csheet__l:not([hidden]) a')].map((a) => a.getAttribute('href')), h: [...document.querySelectorAll('#csheet .csheet__l:not([hidden]) a')].map((a) => Math.round(a.getBoundingClientRect().height)), title: document.querySelector('[data-sheet-title]').textContent }));
  ok(sh.open && sh.btns.length === 2 && sh.btns.every((h) => /^tel:/.test(h)) && sh.h.every((x) => x >= 56), `R9 "Pozovi" opens a sheet with two big call buttons: ${sh.btns.join(' ')} (${sh.title})`);
  await p.keyboard.press('Escape'); await sleep(400);
  await p.tap('.bar__a[data-sheet="wa"]'); await sleep(600);
  sh = await p.evaluate(() => ({ open: document.querySelector('#csheet').classList.contains('is-open'), btns: [...document.querySelectorAll('#csheet .csheet__l:not([hidden]) a')].map((a) => a.getAttribute('href')) }));
  ok(sh.open && sh.btns.length === 2 && sh.btns.every((h) => /wa\.me/.test(h)), 'R9 "WhatsApp" opens a sheet with both numbers: ' + sh.btns.join(' '));
  await p.keyboard.press('Escape'); await sleep(300);
  await p.tap('.nav .burger'); await sleep(600);
  const mm = await p.evaluate(() => [...document.querySelectorAll('#menu a[href^="tel:"]')].map((a) => ({ h: a.getAttribute('href'), hh: Math.round(a.getBoundingClientRect().height) })));
  ok(mm.length === 2 && mm.every((m) => m.hh >= 52), 'R9 mobile menu lists both numbers with large tap targets: ' + mm.map((m) => m.h + ' ' + m.hh + 'px').join(', '));
  await p.close();
}
console.log('R7 comment mode');
for (const [pg, W] of [['index.html', 390], ['blog.html', 390], ['blog/hijaluronski-fileri.html', 320], ['tretmani/telo.html', 390], ['posebna-ponuda.html', 1440], ['index.html', 1440]]) {
  for (const q of ['', '?komentari']) {
    const p = await newPage(b, W, 844);
    await p.goto(`${BASE}/${pg}${q}`, { waitUntil: 'networkidle0' }); await sleep(1200);
    const r = await p.evaluate(() => ({ b: [...document.querySelectorAll('.rv-b')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()), hint: document.querySelector('.rv-hint')?.textContent || '', style: !!document.getElementById('rv-style'), over: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
    if (!q) ok(r.b.length === 0 && !r.hint && !r.style, `${pg}: without the parameter nothing is injected`);
    else {
      const sec = r.b.filter((x) => !/zaglavlje|podnožje/.test(x));
      ok(sec.length >= 2 && sec.every((x) => /^B-([a-z]+[0-9]*-)?[1-9][0-9]* /.test(x)) && !r.over && /npr\. B-/.test(r.hint), `${pg} @${W}: ${r.b.length} badges, e.g. "${sec[0]}" ... "${sec[sec.length - 1]}"; hint "${r.hint}"; no overflow`);
    }
    await p.close();
  }
}
await b.close();
console.log(bad ? `\n${bad} check(s) failed` : '\nall feedback checks passed');
process.exit(bad ? 1 : 0);
