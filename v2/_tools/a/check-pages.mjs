#!/usr/bin/env node
/* =====================================================================================================
   LEPA SVAKI DAN · preview "A" · static checks of the multi-page site (dependency-free, node >= 18)
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   Run after build-pages.mjs:   node _tools/a/check-pages.mjs
   Crawls every internal link of every .html file in the preview A folder and checks:
   - the target file exists (href, src, srcset, imagesrcset, poster), relative to the page it is written in (works at every depth)
   - #anchors exist in the target page, ?grupa=<tab>-<n> points to a real price-list group
   - one h1, title, description, noindex, lang="sr", skip link, header + main + footer, shared shell identical on every page
   - no template names, no em dash, no "Dr Tamara", no [[dopuniti: ...]] left in a build made with --public
   - client feedback of October 2026: no near-black (#231F20, #292627, #322F30, #454340), no emoji / pictographs, no hashtags in the text,
     no leading-zero numbering, no location fields or per-treatment location labels in the shipped data and scripts, every phone / e-mail link
     is one of the contact data, the contact line under every text page and the comment mode / search scripts on every page
   - stage 1 of the final site (palette, header, hero): menu order Naše usluge, O nama, Posebna ponuda, Cenovnik, Lokacije, Blog in the header pill, the mobile menu
     and the footer navigation; the stacked Beauty & Wellbeing Concept logo; the six hero search chips; no glass windows in the hero; the info strip keeps
     the hours and the 15+ years; the rotator underline is per word; no dark fill left in the CSS; the founder is Tamara Ćosić (osnivačica), Tamara Vujačić
     always carries "dr"
   - stage 2 of the final site (About, order, contacts, price notice, dinars first, wrapping): page order hero > O nama > Naše usluge > Naši omiljeni tretmani > Saznajte više >
     Cenovnik > Lokacije > Utisci > Posebna ponuda > Blog > closing CTA; no #poklon section or reference anywhere; the About card "Reč osnivača i posebne pogodnosti" with the
     signature "Tamara Ćosić, osnivačica Lepe Svaki Dan" and the "Bestseller tretmani" block with the four gifts; the contact PAIRS (phone 1, mail 1, phone 2, mail 2: the second mail
     only when it is set); every price is dinars first (no old "EUR / RSD" text, no .px__e / .px__r); the one-time price-list notice exists on the home only and its strings are the data;
     the price helper is loaded on every page; the typo "orjentacionog" is gone; no manual <br> in a heading; "dr Tamara Vujačić" keeps her title in the price list
   - stage 3 of the final site (search relevance, personalised offer): every page loads assets/data/personalize-config.js and js/personalize.js after js/shell.js and js/search.js;
     text pages carry body[data-art], segment pages body[data-seg]; the search index is version 2 (tags, evidence weights) and still shows no hashtag; the configuration of the offer is valid
     (every topic points at hidden-vocabulary entries, price-list groups, texts and segments that exist, 2 to 4 groups in the dialog, a percentage, a code, no emoji / em dash /
     hashtag in its wording); the stacking order (card 130 < back-to-top 140 < action bar 150 < nav 200 < menu 400 < search 450 < dialogs 500); only the topic scores are stored
     (the storage key, no raw query); the gift icon is in the sprite
   - final verification 1: the footer back-to-top hides under the floating one and the footer keeps room for it; the header pill is at least 90% opaque; the 44 px hit area of the breadcrumbs of the segment hero;
     lila / green detail of the previous / next block; the partial answer of the search; the glued tail of the article paragraphs
   Exit code 1 when something is wrong.
   ===================================================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '..', '..');
const SITE_DIR = fs.readdirSync(V2).find((d) => /^a-[a-z]+$/.test(d) && fs.existsSync(path.join(V2, d, 'index.html'))); // the folder of preview A
const SITE = path.join(V2, SITE_DIR);
const content = JSON.parse(fs.readFileSync(path.join(V2, '_shared/content/content.json'), 'utf8'));
const tabs = Object.fromEntries(content.pricing.tabs.map((t) => [t.id, t.groups.length]));

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const all = walk(SITE);
const pages = all.filter((f) => f.endsWith('.html'));
const rel = (f) => path.relative(SITE, f).split(path.sep).join('/');
const idsOf = {};
const html = {};
pages.forEach((f) => { const t = fs.readFileSync(f, 'utf8'); html[rel(f)] = t; idsOf[rel(f)] = new Set([...t.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])); });

const problems = [];
const bad = (page, msg) => problems.push(page + ': ' + msg);
let linkCount = 0, external = new Set();

for (const [page, t] of Object.entries(html)) {
  const dir = path.posix.dirname(page);
  const refs = [];
  for (const m of t.matchAll(/\s(href|src|poster|data-video|data-video-webm)="([^"]*)"/g)) refs.push(m[2]);
  for (const m of t.matchAll(/\s(srcset|imagesrcset)="([^"]*)"/g)) m[2].split(',').forEach((s) => refs.push(s.trim().split(/\s+/)[0]));
  for (let r of refs) {
    r = r.replace(/&amp;/g, '&');
    if (!r || r.startsWith('data:') || r.startsWith('mailto:') || r.startsWith('tel:')) continue;
    if (/^https?:\/\//.test(r)) { external.add(r.replace(/\?.*$/, '')); continue; }
    linkCount++;
    const m = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(r);
    let target = m[1], query = m[2] || '', hash = m[3] || '';
    const file = target ? path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, target)) : page;
    const abs = path.join(SITE, file);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { bad(page, 'missing file ' + r); continue; }
    if (hash.length > 1 && file.endsWith('.html')) {
      const id = decodeURIComponent(hash.slice(1));
      if (!idsOf[file].has(id)) bad(page, 'missing anchor ' + r + ' (in ' + file + ')');
    }
    const q = /grupa=([a-z]+)-(\d+)/.exec(query);
    if (q) { if (!(q[1] in tabs) || +q[2] >= tabs[q[1]]) bad(page, 'unknown price-list group ' + r); }
    else if (query && /grupa=/.test(query)) bad(page, 'malformed grupa parameter ' + r);
  }

  // structure
  const h1 = (t.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) bad(page, h1 + ' h1');
  if (!/<title>[^<]{3,}<\/title>/.test(t)) bad(page, 'no title');
  if (!/<meta name="description" content="[^"]{10,}"/.test(t)) bad(page, 'no description');
  if (!/<meta name="robots" content="noindex">/.test(t)) bad(page, 'no noindex');
  if (!/<html lang="sr"/.test(t)) bad(page, 'no lang sr');
  if (!/class="skip"/.test(t)) bad(page, 'no skip link');
  if (!/<header class="nav"/.test(t) || !/<main id="main"/.test(t) || !/<footer class="foot"/.test(t)) bad(page, 'missing landmark');
  if (!/Pripremio ECHOSYSTEM-MOTHER AGENCY/.test(t)) bad(page, 'no agency credit');
  if (/rel="canonical"/.test(t)) bad(page, 'canonical present');
  for (const m of t.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) bad(page, 'img without alt: ' + m[0].slice(0, 80));
    if (!/\swidth="\d+"/.test(m[0]) || !/\sheight="\d+"/.test(m[0])) bad(page, 'img without width/height: ' + m[0].slice(0, 80));
  }
}

// the shell must be identical on every page apart from paths and the current-page marker
const norm = (s, page) => s.replace(/(\.\.\/)+/g, '').replace(/ aria-current="(page|true)"/g, '').replace(/ class="is-active"/g, '').replace(/href="(index\.html)?#/g, 'href="index.html#').replace(/href="#top"/g, 'href="index.html"').replace(/data-spy="[^"]*"/g, '').replace(/aria-label="Beauty &amp; Wellbeing Concept, Lepa Svaki Dan, [^"]*"/g, '');
const region = (t, a, b) => { const i = t.indexOf(a), j = t.indexOf(b, i); return i < 0 || j < 0 ? '' : t.slice(i, j); };
const shells = Object.entries(html).map(([p, t]) => [p, norm(region(t, '<!-- NAV -->', '</header>'), p), norm(region(t, '<!-- FOOTER -->', '<!-- BOOKING SHEET -->'), p)]);
const ref = shells.find(([p]) => p === 'blog.html');
shells.forEach(([p, nav, foot]) => {
  const stripNav = (s) => s.replace(/href="[^"]*"/g, 'href=""').replace(/src="[^"]*"/g, 'src=""').replace(/\s+>/g, '>');
  if (stripNav(nav) !== stripNav(ref[1])) bad(p, 'header differs from the shared shell');
  if (stripNav(foot) !== stripNav(ref[2])) bad(p, 'footer differs from the shared shell');
});

// forbidden content, whole site (the four names are assembled here so that this file itself stays clean)
const TEMPLATE_NAMES = new RegExp('\\b(' + ['Lu' + 'mine', 'Al' + 'der', 'Lu' + 'zia', 'Fra' + 'mer'].join('|') + ')\\b', 'i');
for (const f of all.filter((x) => /\.(html|css|js|svg)$/.test(x))) {
  const t = fs.readFileSync(f, 'utf8'), r = rel(f);
  if (TEMPLATE_NAMES.test(t)) bad(r, 'template name present');
  if (!r.startsWith('assets/logo') && /\u2014/.test(t)) bad(r, 'em dash present');
  if (/\b[Dd]r\.? Tamara Ćosić\b/.test(t)) bad(r, 'doctor title before the founder Tamara Ćosić');
}

/* ---- client feedback checks (October 2026) ---- */
const textOf = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<template[\s\S]*?<\/template>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
const PICTO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}]/u;
const NEAR_BLACK = /#(231F20|292627|322F30|454340)\b/i;
for (const f of all.filter((x) => /\.(html|css|js|svg|json)$/.test(x))) {
  const t = fs.readFileSync(f, 'utf8'), r = rel(f);
  if (NEAR_BLACK.test(t)) bad(r, 'near-black hex present (use the 75% black #5A5758)');
  if (PICTO.test(t)) bad(r, 'emoji / pictographic character present');
  if (/&mdash;|\\u2014/i.test(t)) bad(r, 'em dash escape present');
  if (/\b(priceNB|priceBW|priceFrom)\b|\blocation:\s*["']|"location"\s*:/.test(t) && !r.startsWith('blog/')) bad(r, 'location field in shipped data or script');
  if (/vt__loc|dot--(nb|bw|both)|data-loc\b|Obe lokacije/.test(t)) bad(r, 'per-treatment location marker present');
  /* the founder is Tamara Ćosić (osnivačica, not a doctor); Tamara Vujačić IS a doctor and always carries "dr" */
  if (/\b[Dd]r\.?\s+Tamara\s+Ćosić/.test(t) || /\bdoktor\w*\s+Tamara\s+Ćosić/i.test(t)) bad(r, 'doctor title before the founder Tamara Ćosić');
  if (/(?<![Dd]r\.? )(?<![Dd]r )Tamara\s+Vuja/.test(t) && !r.startsWith('blog/')) bad(r, 'Tamara Vujačić without her doctor title "dr"');
  if (/Tamara Vujačić, Lepa Svaki Dan|Tamara Vujačić, osnivač/.test(t)) bad(r, 'the founder is Tamara Ćosić, not Tamara Vujačić');
}
const PHONE_HREFS = new Set(content.contact.phones.map((p) => p.telHref));
const MAILS = (content.contact.emails || []).map((e) => e.email).filter(Boolean);
const WA_HREFS = new Set(content.contact.phones.map((p) => p.whatsappHref));
for (const [page, t] of Object.entries(html)) {
  const txt = textOf(t);
  if (/(^|\s)#[A-Za-zČĆŠŽĐčćšžđ]{2,}/.test(txt)) bad(page, 'a hashtag is visible in the text');
  if (/(^|[^\d.,:/\-])0[1-9](?![\d.,:/\-])/.test(txt)) bad(page, 'a number with a leading zero is visible: ' + (txt.match(/.{12}(^|[^\d.,:/\-])0[1-9](?![\d.,:/\-]).{8}/) || [''])[0].replace(/\s+/g, ' '));
  for (const m of t.matchAll(/href="(tel:[^"]+)"/g)) if (!PHONE_HREFS.has(m[1])) bad(page, 'unknown phone link ' + m[1]);
  for (const m of t.matchAll(/href="(mailto:[^"?]+)/g)) if (!MAILS.includes(m[1].replace(/^mailto:/, ''))) bad(page, 'unknown e-mail link ' + m[1]);
  for (const m of t.matchAll(/href="(https:\/\/wa\.me\/\d+)/g)) if (!WA_HREFS.has(m[1])) bad(page, 'unknown WhatsApp link ' + m[1]);
  const ids = [...t.replace(/<template[\s\S]*?<\/template>/g, '').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) bad(page, 'duplicate id: ' + [...new Set(dup)].join(', '));
  for (const m of t.matchAll(/aria-(?:labelledby|controls)="([^"]+)"/g)) m[1].split(/\s+/).forEach((id) => { if (!idsOf[page].has(id) && !/^(priceResults|srchBody|menu|bookSheet)$/.test(id)) bad(page, 'aria reference to a missing id: ' + id); });
  if (!/js\/search\.js/.test(t) || !/js\/review\.js/.test(t)) bad(page, 'search.js or review.js missing');
  if (!/id="searchOv"/.test(t) || !/data-search/.test(t)) bad(page, 'search overlay or its trigger missing');
  if (!/class="nav__phones"/.test(t) || (t.match(/class="nav__phones"[\s\S]*?<\/div>/)[0].match(/<a /g) || []).length !== 2) bad(page, 'header does not carry both phones');
  const needsLine = page !== 'index.html';
  if (needsLine && (t.match(/class="cline"/g) || []).length !== 1) bad(page, 'expected exactly one contact line, found ' + (t.match(/class="cline"/g) || []).length);
  if (!t.includes(content.hero.sub) && /class="foot__brand"/.test(t)) bad(page, 'footer description is not the hero sentence');
  if (/\u2014/.test(txt)) bad(page, 'em dash in rendered text');
}
{
  const t = html['index.html'];
  if ((t.match(/class="cline"/g) || []).length < 8) bad('index.html', 'fewer than 8 contact lines on the home');
  if (!t.includes('<p class="eyebrow hero__lead">' + '<!--@heroclaim-->' + content.hero.claim)) bad('index.html', 'hero lead line is not "' + content.hero.claim + '"');
  if (!t.includes(content.hero.sub)) bad('index.html', 'hero sentence missing');
  if (!/id="heroSearch"/.test(t)) bad('index.html', 'no hero search bar');
  if (!/Vaše uživanje i briga o lepoti počinju ovde\. Zakažite svoj termin\./.test(t)) bad('index.html', 'closing CTA text is not the agreed one');
  if (!t.includes('https://instagram.com/bclepasvakidan')) bad('index.html', 'Instagram link missing');
  const sec = (id) => (t.match(new RegExp('<section[^>]*id="' + id + '"[\\s\\S]*?</section>')) || [''])[0];
  if (/class="cline"/.test(sec('lokacije')) || /class="cline"/.test(sec('zakazi'))) bad('index.html', 'contact line inside Lokacije or the closing CTA');
}
{ // stage 1 of the final site (palette, header, hero): menu order, logo, hero search chips, tonal controls
  const ORDER = ['Naše usluge', 'O nama', 'Posebna ponuda', 'Cenovnik', 'Lokacije', 'Blog'];
  for (const [page, t] of Object.entries(html)) {
    const pill = (t.match(/<nav class="nav__pill"[\s\S]*?<\/nav>/) || [''])[0], menu = (t.match(/<nav class="menu__nav"[\s\S]*?<\/nav>/) || [''])[0];
    const foot = (t.match(/<h3>Navigacija<\/h3>[\s\S]*?<\/ul>/) || [''])[0];
    for (const [name, blk] of [['header pill', pill], ['mobile menu', menu], ['footer navigation', foot]]) {
      const labels = [...blk.matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1]);
      if (labels.join('|') !== ORDER.join('|')) bad(page, name + ' order is ' + labels.join(', ') + ' (expected ' + ORDER.join(', ') + ')');
    }
    if (!/<img class="logo-wb"[^>]*alt="Beauty &amp; Wellbeing Concept, Lepa Svaki Dan"/.test(t)) bad(page, 'header logo (stacked Beauty & Wellbeing Concept lockup) missing');
    if (/logo-horizontal-lila-gold|lsd-stacked-block-lila\.svg" width="66"/.test(t.replace(/<link[^>]*>/g, ''))) bad(page, 'the old header logo is still used');
    if (/#C6B4E3" *>|theme-color" content="#C6B4E3/.test(t)) bad(page, 'theme-color is still lila');
  }
  const h = html['index.html'];
  const chips = [...(h.match(/class="hsearch__try"[\s\S]*?<\/div>/) || [''])[0].matchAll(/data-q="([^"]+)"/g)].map((m) => m[1]);
  if (chips.join('|') !== 'glass skin|akne|celulit|botoks|opadanje kose|poklon') bad('index.html', 'hero search chips are: ' + chips.join(', '));
  if (/Pokušaj sa:/.test((h.match(/<section class="hero"[\s\S]*?<\/section>/) || [''])[0])) bad('index.html', 'old "Pokušaj sa" links still in the hero');
  if (/glass--book|glass--stat/.test(h)) bad('index.html', 'the two glass windows are still in the hero');
  if (!/class="hero__ctas[^"]*"[\s\S]*?Pogledaj tretmane[\s\S]*?Cenovnik usluga/.test(h)) bad('index.html', 'hero buttons missing');
  if (!/Pon-Sub/.test((h.match(/class="strip[\s\S]*?<\/ul>/) || [''])[0]) || !/15<|15\+/.test((h.match(/class="strip[\s\S]*?<\/ul>/) || [''])[0])) bad('index.html', 'the info strip of the About section lost the hours or the 15+ years');
  const css = ['brand.css', 'site.css', 'pages.css'].map((f) => fs.readFileSync(path.join(SITE, 'css', f), 'utf8')).join('\n');
  if (/\.rot::after/.test(css) || !/\.rot__w::after/.test(css)) bad('css/site.css', 'the rotator underline is not per word');
  // verifier 2: the headline is always two lines (a short word leaves no hole), the slot follows the word (rot-w keyframes + js), the crumb chevron ends the previous crumb, the blog chips have gaps
  if (!/<span class="hero__l2">svaki dan\.<\/span>/.test(h)) bad('index.html', 'the hero headline lost its second line (.hero__l2)');
  if (!/\.rot\.is-m\{/.test(css) || !/@keyframes rot-w\{/.test(css) || !/@keyframes rot-w1\{/.test(css) || !/is-m/.test(fs.readFileSync(path.join(SITE, 'js/app.js'), 'utf8'))) bad('css/site.css', 'the headline slot no longer follows the rotating word');
  if (/\.crumbs li\+li::before/.test(css) || !/\.crumbs li:not\(:last-child\)::after/.test(css)) bad('css/pages.css', 'the breadcrumb chevron is back at the start of the next crumb (a wrapped line would start with it)');
  if (!/\.blog__cats\{display:flex;flex-wrap:wrap;gap:/.test(css)) bad('css/pages.css', 'the blog filter chips have no gap');
  if (!/--kb,0px/.test(css) || !/visualViewport/.test(fs.readFileSync(path.join(SITE, 'js/search.js'), 'utf8'))) bad('css/pages.css', 'the search overlay does not keep its results above the phone keyboard');
  const darkFill = css.match(/background:\s*var\(--black-75\)|background:\s*var\(--ink\)|background:\s*#5A5758|--dark-block/gi);
  if (darkFill) bad('css', 'a dark fill is still in the styles: ' + [...new Set(darkFill)].join(', '));
}
{ // stage 2 of the final site: About, order, contacts, price notice, dinars first
  const h = html['index.html'];
  const order = ['top', 'o-nama', 'tretmani', 'omiljeni', 'saznajte-vise', 'usluge', 'lokacije', 'utisci', 'posebna-ponuda', 'blog', 'zakazi'];
  const at = order.map((id) => h.indexOf('id="' + id + '"'));
  if (at.some((x) => x < 0) || at.some((x, i) => i && x < at[i - 1])) bad('index.html', 'section order is not ' + order.join(' > '));
  if (/id="poklon"|href="#poklon"|gift-title|gifts__|class="gift/.test(h)) bad('index.html', 'the standalone gift section (#poklon) is still on the home');
  for (const [page, t] of Object.entries(html)) if (/#poklon\b/.test(t)) bad(page, 'a reference to #poklon');
  const siText = fs.readFileSync(path.join(SITE, 'assets/search-index.js'), 'utf8') + fs.readFileSync(path.join(SITE, 'js/review.js'), 'utf8') + fs.readFileSync(path.join(SITE, 'js/app.js'), 'utf8');
  if (/poklon:\s*'|#poklon|"poklon"\s*:|gifts\b/.test(siText.replace(/"[^"]*poklon[^"]*"/g, ''))) bad('js', 'a leftover of the gift section in the scripts or the search data');
  if (/id="tretmani"[\s\S]{0,400}eyebrow">Usluge</.test(h) || !/id="tretmani"[\s\S]{0,300}eyebrow">Naše usluge</.test(h)) bad('index.html', 'the services section does not say "Naše usluge"');
  const about = (h.match(/<section class="sec sec--about"[\s\S]*?<\/section>/) || [''])[0];
  if (!/Reč osnivača i posebne pogodnosti/.test(about)) bad('index.html', 'About card is not "Reč osnivača i posebne pogodnosti"');
  if (!about.includes(content.founder.signature) || content.founder.signature !== 'Tamara Ćosić, osnivačica Lepe Svaki Dan') bad('index.html', 'founder signature is not "Tamara Ćosić, osnivačica Lepe Svaki Dan"');
  if (!/Bestseller tretmani/.test(about) || (about.match(/class="bs__li/g) || []).length !== content.gifts.length) bad('index.html', 'the "Bestseller tretmani" block is missing or does not list all ' + content.gifts.length + ' gifts');
  if (about.indexOf('class="tile about__img') > about.indexOf('class="tile about__best')) bad('index.html', 'the Bestseller block is not below the photo');
  if (!/Specijalistički pregled dr Tamara Vujačić/.test(fs.readFileSync(path.join(SITE, 'js/content.js'), 'utf8')) || !/Hijaluron 1ml, dr spec\. Vujačić/.test(fs.readFileSync(path.join(SITE, 'js/content.js'), 'utf8'))) bad('js/content.js', 'the doctor lines lost "dr"');
  // the strip comes from the data
  for (const it of content.stats.items) if (!h.includes('data-count="' + it.value + '"') || !h.includes('>' + it.label + '<')) bad('index.html', 'info strip item missing: ' + it.label);
  // contact pairs: phone 1, mail 1 (if set), phone 2, mail 2 (if set)
  const E = content.contact.emails, P = content.contact.phones;
  const want = P.flatMap((p, i) => ['tel:' + p.tel].concat(E[i] && E[i].email ? ['mailto:' + E[i].email] : [])).join('|');
  for (const [page, t] of Object.entries(html)) {
    for (const m of t.matchAll(/<div class="cline"[\s\S]*?<\/ul>/g)) {
      const got = [...m[0].matchAll(/href="((?:tel|mailto):[^"]+)"/g)].map((x) => x[1]).join('|');
      if (got !== want) bad(page, 'contact line order is ' + got + ' (expected ' + want + ')');
    }
    const kont = (t.match(/<h3>Kontakt<\/h3>[\s\S]*?<\/ul>/) || [''])[0];
    const gotF = [...kont.matchAll(/href="((?:tel|mailto):[^"]+)"/g)].map((x) => x[1]).join('|');
    if (gotF !== want) bad(page, 'footer contact order is ' + gotF + ' (expected ' + want + ')');
  }
  // dinars first, everywhere
  for (const [page, t] of Object.entries(html)) {
    const txt = textOf(t).replace(/ /g, ' ');
    if (/\d\s*€\s*\/\s*[\d.]+\s*rsd/.test(txt)) bad(page, 'a price is written euros first ("EUR / RSD") in the text');
    if (/px__e|px__r|svc__e|svc__r/.test(t)) bad(page, 'old euro-first price classes in the markup');
    for (const m of t.matchAll(/<span class="px[ "][\s\S]*?<\/span><\/span>(?:<span class="px__s">[^<]*<\/span>)?<\/span>/g)) if (m[0].indexOf('px__s') >= 0 && m[0].indexOf('px__p') > m[0].indexOf('px__s')) bad(page, 'euro line before the dinar line');
    if (!/js\/price\.js/.test(t)) bad(page, 'js/price.js is not loaded');
    if (/<h[1-3][^>]*>[^<]*<br/.test(t)) bad(page, 'a manual <br> inside a heading');
  }
  for (const f of ['js/app.js', 'js/search.js', 'js/offers.js']) if (/splitPrice|priceBlock|px__e|px__r|\.split\(' \/ '\)/.test(fs.readFileSync(path.join(SITE, f), 'utf8'))) bad(f, 'old euro-first price code');
  for (const f of all.filter((x) => /\.(html|js|json)$/.test(x))) if (/orjentacion/.test(fs.readFileSync(f, 'utf8'))) bad(rel(f), 'typo "orjentacionog"');
  // the one-time notice
  if (!/id="priceNotice"/.test(h) || !/id="paySheet"/.test(h)) bad('index.html', 'price-list notice or payment note missing');
  for (const [page, t] of Object.entries(html)) if (page !== 'index.html' && /id="priceNotice"/.test(t)) bad(page, 'the price-list notice is on a page other than the home');
  const pp = content.payment.popup;
  for (const k of ['title', 'paymentHeading', 'searchHeading', 'searchButton', 'searchLink', 'okLabel']) if (!h.includes(pp[k].replace(/&/g, '&amp;'))) bad('index.html', 'notice string missing from the data: ' + k);
  if (!/orijentacionog/.test(h)) bad('index.html', 'the corrected payment note is missing');
}
{ // the search index carries no tags and no hashtags
  const si = fs.readFileSync(path.join(SITE, 'assets/search-index.js'), 'utf8');
  if (/"#[a-zčćšžđ]/i.test(si)) bad('assets/search-index.js', 'a hashtag in the search data');
  const cj = fs.readFileSync(path.join(SITE, 'js/content.js'), 'utf8');
  if (/"tags"\s*:/.test(cj)) bad('js/content.js', 'tags in the shipped content');
}
{ // stage 3: the personalised offer and the search data it relies on
  const vm = await import('node:vm');
  const read = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');
  const synonyms = JSON.parse(fs.readFileSync(path.join(V2, '_shared/content/search-synonyms.json'), 'utf8'));
  const articlesJson = JSON.parse(fs.readFileSync(path.join(V2, '_shared/content/articles.json'), 'utf8'));
  const segmentsJson = JSON.parse(fs.readFileSync(path.join(V2, '_shared/content/segments.json'), 'utf8'));
  const entryIds = new Set([...synonyms.entries, ...synonyms.questions].map((e) => e.id));
  const artIds = new Set(articlesJson.map((a) => a.id)), segIds = new Set(segmentsJson.segments.map((x) => x.id));
  const groupIds = new Set(content.pricing.tabs.flatMap((t) => t.groups.map((g, gi) => t.id + ':' + gi)));
  for (const [page, t] of Object.entries(html)) {
    const i1 = t.indexOf('js/shell.js"'), i2 = t.indexOf('js/search.js"'), i3 = t.indexOf('assets/data/personalize-config.js"'), i4 = t.indexOf('js/personalize.js"');
    if (i3 < 0 || i4 < 0 || !(i1 >= 0 && i1 < i2 && i2 < i3 && i3 < i4)) bad(page, 'personalize-config.js / personalize.js missing or loaded in the wrong order (after shell.js and search.js)');
    if (page.startsWith('blog/') && !/<body[^>]*data-art="art-\d+"/.test(t)) bad(page, 'text page without body[data-art]');
    if (page.startsWith('tretmani/') && !/<body[^>]*data-seg="[a-z]+"/.test(t)) bad(page, 'segment page without body[data-seg]');
    if (!/<symbol id="i-gift"/.test(t)) bad(page, 'gift icon missing from the sprite');
  }
  const si = read('assets/search-index.js');
  const sdata = {}; vm.runInNewContext(si, { window: sdata });
  const D = sdata.LSD_SEARCH;
  if (!D || D.v !== 2 || !Array.isArray(D.tg) || !D.tg.length) bad('assets/search-index.js', 'the search index is not version 2 with tags');
  else {
    if (D.tg.some((x) => /#/.test(x))) bad('assets/search-index.js', 'a tag carries a hash sign');
    if (!D.services.some((s) => s.t && s.t.length)) bad('assets/search-index.js', 'no service carries tags');
    for (const e of D.syn.entries) if (['g', 'v', 'a', 'o'].some((k) => !e[k + 'w'] || e[k + 'w'].length !== e[k].length)) { bad('assets/search-index.js', 'synonym entry ' + e.id + ' has no aligned evidence weights'); break; }
  }
  let cfg = null;
  try { const w = {}; vm.runInNewContext(read('assets/data/personalize-config.js'), { window: w }); cfg = w.LSD_PERSONALIZE; } catch (e) { bad('assets/data/personalize-config.js', 'does not run: ' + e.message); }
  if (cfg) {
    const F = 'assets/data/personalize-config.js';
    if (typeof cfg.demo !== 'boolean') bad(F, 'demo must be true or false (the ONE flag for "Primer ponude")');
    if (cfg.storageKey !== 'lsd-interest-v1') bad(F, 'the storage key is not lsd-interest-v1');
    if (!(cfg.threshold > 0) || !cfg.weights || !cfg.dwell || !cfg.card) bad(F, 'threshold, weights, dwell or card missing');
    if (!(cfg.dwell && cfg.dwell.seconds >= 20)) bad(F, 'dwell time under 20 seconds is not "stayed"');
    for (const k of ['cardTitle', 'cardOpen', 'eyebrow', 'headline', 'body', 'book', 'hide', 'close', 'demoBadge', 'demoNote', 'wa', 'validity', 'codeLabel']) if (!cfg.copy || !cfg.copy[k]) bad(F, 'copy.' + k + ' missing');
    if (cfg.copy && cfg.copy.cardTitle !== 'Iznenađenje za vas') bad(F, 'the card does not say "Iznenađenje za vas"');
    if (cfg.copy && cfg.copy.cardOpen !== 'Otkrij') bad(F, 'the card button is not "Otkrij"');
    if (cfg.copy && cfg.copy.demoBadge !== 'Primer ponude') bad(F, 'the badge is not "Primer ponude"');
    const seenIds = new Set(), seenCodes = new Set();
    for (const t of cfg.topics) {
      const w = F + ' topic ' + t.id;
      if (seenIds.has(t.id)) bad(w, 'duplicate id'); seenIds.add(t.id);
      if (!(t.discount > 0 && t.discount <= 100)) bad(w, 'discount is not a percentage');
      if (!t.code || seenCodes.has(t.code)) bad(w, 'code missing or used twice'); seenCodes.add(t.code);
      for (const k of ['label', 'offer', 'interest']) if (!t[k]) bad(w, k + ' missing');
      for (const e of t.entries || []) if (!entryIds.has(e)) bad(w, 'unknown hidden-vocabulary entry ' + e);
      for (const g of [...(t.groups || []), ...(t.offerGroups || [])]) if (!groupIds.has(g)) bad(w, 'unknown price-list group ' + g);
      for (const a of t.articles || []) if (!artIds.has(a)) bad(w, 'unknown text ' + a);
      if (!t.offerGroups || t.offerGroups.length < 2 || t.offerGroups.length > 4) bad(w, 'the dialog needs 2 to 4 groups');
      if (!(t.entries || []).length || !(t.groups || []).length) bad(w, 'no entries or no groups');
    }
    for (const [sid, list] of Object.entries(cfg.segments || {})) { if (!segIds.has(sid)) bad(F, 'unknown segment ' + sid); for (const x of list) if (!seenIds.has(x)) bad(F, 'segment ' + sid + ' points at the unknown topic ' + x); }
    for (const t of cfg.topics) for (const s of [t.label, t.offer, t.interest, t.code]) if (/[#\u2014]/.test(s)) bad(F, 'hash sign or em dash in the wording of ' + t.id);
  }
  const pcss = read('css/pages.css'), shell = read('js/shell.js'), pz = read('js/personalize.js'), sj = read('js/search.js');
  const z = (re) => { const m = re.exec(pcss + read('css/site.css')); return m ? +m[1] : NaN; };
  const zg = z(/\.gift\{[^}]*z-index:(\d+)/), za = z(/\.abar\{[^}]*z-index:(\d+)/), zn = z(/\.nav\{[^}]*z-index:(\d+)/), zm = z(/\.menu\{[^}]*z-index:(\d+)/), zs = z(/\.srch\{[^}]*z-index:(\d+)/), zd = z(/\.sheet\{[^}]*z-index:(\d+)/);
  const zf = +((/Z = (\d+)/.exec(shell) || [])[1]);
  if (!(zg < zf && zf < za && za < zn && zn < zm && zm < zs && zs < zd)) bad('css', 'stacking order is wrong: gift ' + zg + ', back-to-top ' + zf + ', action bar ' + za + ', nav ' + zn + ', menu ' + zm + ', search ' + zs + ', dialogs ' + zd);
  if (!/\.ov-open \.gift/.test(pcss) || !/classList\.add\('ov-open'\)/.test(shell)) bad('css/js', 'the gift card does not step aside while an overlay is open');
  if (!/#giftCard/.test(shell)) bad('js/shell.js', 'the gift card is not made inert behind a dialog');
  if ((pz.match(/localStorage\.setItem/g) || []).length !== 1) bad('js/personalize.js', 'localStorage must be written in exactly one place (the topic scores)');
  if (/\.(q|query|text|value)\b[^;\n]*localStorage|localStorage[^;\n]*\b(query|\.value)\b/.test(pz)) bad('js/personalize.js', 'a query or a field value seems to reach the storage');
  if (!/lsd:search/.test(pz) || !/lsd:search/.test(sj) || /detail:\s*\{[^}]*\bq:\s*q\b/.test(sj)) bad('js/search.js', 'the search signal is missing or carries the question');
  if (/document\.cookie|XMLHttpRequest|fetch\(|sendBeacon/.test(pz)) bad('js/personalize.js', 'no cookies, no network: the offer is computed in the browser only');
  if (!/demo-iznenadjenje/.test(pz) || !/reset-interest/.test(pz)) bad('js/personalize.js', 'the test parameters are missing');
}
{ // final verification 1: fixes that must not come back
  const read = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');
  const sc = read('css/site.css'), pc = read('css/pages.css'), sj2 = read('js/search.js');
  if (!/\.js \.foot__top\{display:none\}/.test(sc) || !/\.js \.foot\{padding-bottom:calc\(76px/.test(sc)) bad('css/site.css', 'the footer back-to-top is not hidden under the floating one, or the footer has no room for the floating button at the end of the page');
  if ((sc.match(/background:rgba\(244,242,233,\.(\d+)\);box-shadow:inset 0 0 0 1px rgba\(204,197,185,\.7\)/g) || []).some((m) => +/\.(\d+)\)/.exec(m)[1] < 90)) bad('css/site.css', 'the header pill / phones / search are too transparent over a photo (text contrast under AA on the segment pages)');
  if (!/\.shero__card \.crumbs a::after\{[^}]*inset:-2px 0/.test(pc)) bad('css/pages.css', 'the breadcrumb links of the segment hero need the 44 px hit area');
  if (!/\.pn__a::before\{/.test(pc) || !/\.pn__a--next::before\{background:var\(--green\)\}/.test(pc)) bad('css/pages.css', 'the previous / next block needs its lila and green detail');
  if (!/function partial\(/.test(sj2)) bad('js/search.js', 'a question with a word the site never uses must not empty the answer (partial answer is missing)');
  for (const [page, t] of Object.entries(html)) if (page.startsWith('blog/') && /<p>[^<]{200,}[^ <]{1,3} [^  <]{1,4} [^  <]{1,6}\.<\/p>/.test(t) && !/ /.test(t)) bad(page, 'article paragraphs must keep the last words together (glueEnd of build-pages.mjs)');
}
const blanks = Object.entries(html).filter(([, t]) => /\[dopuniti:/.test(t)).map(([p]) => p);

console.log('pages checked: ' + pages.length + ' · internal references checked: ' + linkCount + ' · external links: ' + external.size);
console.log('pages that still show [dopuniti: ...] markers (owner to fill in): ' + blanks.length + (blanks.length ? ' (' + blanks.join(', ') + ')' : ''));
if (problems.length) { console.log('\nPROBLEMS (' + problems.length + '):'); problems.forEach((p) => console.log('  ' + p)); process.exit(1); }
console.log('OK, no problems found.');
