#!/usr/bin/env node
/* =====================================================================================================
   LEPA SVAKI DAN / BEAUTY CONCEPT - preview "C" page builder  (dependency-free, node >= 18)
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   WHAT IT DOES
   Reads the shared texts pack (v2/_shared/content: articles.json, segments.json, service-links.json, search-synonyms.json, content.json)
   and writes REAL, pre-rendered, JS-free static HTML into the C preview folder (the c-* folder next to this _tools folder):

     blog.html                      Blog index (21 articles grouped by 4 segments, filter chips)
     blog/<slug>.html     x 21      One page per article
     tretmani/<slug>.html x 4       One page per segment (video-ready header)
     posebna-ponuda.html            Special offers (pre-rendered from assets/offers.js, re-rendered live by js/pages.js)

   and it keeps these things in sync inside the site:
     index.html                     only the regions between  <!-- build:NAME --> ... <!-- /build:NAME -->  markers
                                    (shared header + menu + search overlay, hero search bar, contact lines, "Saznajte vise" cards,
                                    locations split, offers teaser, blog teaser, footer + action bar + contact sheet)
     assets/content.js              slim copy of content.json for the home page script (window.LSD_CONTENT): no location, no tags, no addresses
     assets/search-index.js         data of the ONE search engine (js/search.js): price groups + services (with hidden tags), the 21 article texts,
                                    the offers and the HIDDEN synonym vocabulary from search-synonyms.json. Re-run after changing texts, prices,
                                    offers or synonyms.
     assets/offers.js               SEEDED ONCE from content.json, afterwards hand-edited (see the comment at its top). Never overwritten
                                    unless you pass --reseed-offers.
     assets/img/*-1800.webp         the few wide hero variants from the media pack

   HOW TO RUN (any time the texts, prices, offers or synonyms change):
     node _tools/c/build-pages.mjs            # from v2/
     node _tools/c/build-pages.mjs --reseed-offers   # also rewrite assets/offers.js from content.json (loses hand edits)

   SHARED SHELL: header (logo, links, both phones, search button, booking button), mobile menu, search overlay, footer with the closing call to action,
   the mobile action bar and the contact sheet (both numbers) are produced by ONE function (shellTop() / shellBottom()) for every page,
   so they are identical everywhere (only the link form differs: "#x" on the home, "index.html#x" on sub pages).
   CONTACT LINE: clineHtml() writes the quiet "phone, phone, e-mail" line used under every text; the values come from content.json (contact.phones, contact.email).
   HEADER VIDEO PER SEGMENT: put assets/video/<segment-slug>.mp4 (optional .webm next to it) and re-run: the segment page then
   gets data-video / data-video-webm on its hero and js/pages.js loads it on good connections only (see SEGMENTS below).
   ===================================================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '../..');
const SITE = process.env.SITE_DIR ? path.resolve(process.env.SITE_DIR) : path.join(V2, fs.readdirSync(V2).find((d) => /^c-/.test(d)));
const SHARED = path.join(V2, '_shared');
const ARGS = new Set(process.argv.slice(2));
const BASE = 'https://lepa-svaki-dan-predlozi.vercel.app/c/'; // only used for the og:image of sub pages (same host the home page already names)

const read = (p) => fs.readFileSync(p, 'utf8');
const readJSON = (p) => JSON.parse(read(p));
const CONTENT = readJSON(path.join(SHARED, 'content/content.json'));
const ARTICLES = readJSON(path.join(SHARED, 'content/articles.json'));
const SEG_PACK = readJSON(path.join(SHARED, 'content/segments.json')).segments;
const LINKS = readJSON(path.join(SHARED, 'content/service-links.json'));
const OFFERS_VIEW = require(path.join(SITE, 'js/offers-view.js'));

/* ------------------------------------------------------------------ helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const brk = (s) => esc(s).replace(/\//g, '/<wbr>'); // allow a line break after a slash in titles ("Dermatološki/pregled"), display only
const asciiSlug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? one : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? few : many; };
const nWord = (n, one, few, many) => `${n} ${plural(n, one, few, many)}`;
const write = (rel, data) => { const f = path.join(SITE, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
/* sentence-case for shouting-caps names of the price list (same rules as js/main.js tame()) */
const KEEP_UP = { PRX: 1, PRP: 1, AWT: 1, ND: 1, YAG: 1, II: 1, HA: 1, CA: 1 };
const KEEP_CAP = { LEPA: 1, SVAKI: 1, DAN: 1, VENUS: 1, DERMAFACIAL: 1, DERMAWORLD: 1, MYOLIFT: 1, PROFHILO: 1, LOLA: 1, FACE: 1, GYM: 1, EYE: 1, ZONE: 1, CINDERELLA: 1 };
function tame(s) {
  s = String(s);
  const allCaps = !/[a-zčćšžđ]/.test(s);
  return s.replace(/[A-Za-zČĆŠŽĐčćšžđ]+/g, (w, off) => {
    if (w.length < 2) return (allCaps && w === 'I' && off > 0) ? 'i' : w;
    if (w !== w.toUpperCase() || KEEP_UP[w]) return w;
    const low = w.toLowerCase();
    return (off === 0 || KEEP_CAP[w]) ? low.charAt(0).toUpperCase() + low.slice(1) : low;
  });
}
const icon = (id, s = 20) => `<svg class="ico" width="${s}" height="${s}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

/* ------------------------------------------------------------------ data model ---------- */
const CONTACT = CONTENT.contact;
const LOCS = CONTENT.locations;
const HOURS = CONTACT.hours.display; // "Pon-Sub, 9-21h"
const WA = CONTACT.primaryWhatsappHref;
const TEL = CONTACT.phones[0];
const MAIL = { label: CONTACT.email, href: CONTACT.emailHref };
const SOCIAL = Object.fromEntries(CONTACT.social.map((s) => [s.label, s.href]));
const HERO_SUB = CONTENT.hero.sub;                    // the one sentence under the hero heading, repeated word for word as the footer description
const HERO_LEAD = CONTENT.hero.claim;                 // "2 lokacije, 1 filozofija"
/* search: placeholder (a natural question, as asked in a search engine) and the example queries offered under the field.
   Examples are plain words, never rendered as tags / hashtags. */
const SEARCH_PH = { long: 'Pitajte: kako smanjiti obim?', short: 'Šta vas zanima? Npr. akne', tiny: 'Pitajte, npr. akne' };
const SEARCH_EXAMPLES = ['glass skin', 'akne', 'celulit', 'botoks', 'opadanje kose', 'poklon'];
const byId = Object.fromEntries(ARTICLES.map((a) => [a.id, a]));
const segById = Object.fromEntries(SEG_PACK.map((s) => [s.id, s]));
const segLabel = (id) => segById[id].name;

/* group index: "tab:index" -> {id, tab, tabLabel, title, count} (from the price list itself) */
const GROUPS = {};
CONTENT.pricing.tabs.forEach((t) => t.groups.forEach((g, gi) => { GROUPS[`${t.id}:${gi}`] = { id: `${t.id}:${gi}`, tab: t.id, tabLabel: t.label, title: tame(g.title), count: g.services.length }; }));
const linkOf = Object.fromEntries(LINKS.articles.map((l) => [l.articleId, l]));

/* Per segment presentation. The hero image ids come from segments.json (chosen by what the picture really shows).
   kind: "cutout" = transparent portrait on a lila block, "photo" = full-bleed photo. tone: "dark" = white text on a charcoal scrim, "light" = ink text on a pale scrim.
   pos = object-position used on phones / wide screens. */
const SEGMENTS = {
  dermatologija: { img: 'woman-portrait', kind: 'cutout', tone: 'light', widths: [480, 800, 1200], w: 800, h: 893, pos: '50% 20%', cardPos: '50% 22%' },
  estetske: { img: 'hero-orhideja', kind: 'photo', tone: 'light', widths: [480, 800, 1200, 1800], w: 800, h: 450, pos: '14% 50%', cardPos: '10% 50%' },
  kozmetika: { img: 'vertical-protocols', kind: 'photo', tone: 'dark', widths: [480, 800, 1200, 1800], w: 800, h: 800, pos: '50% 40%', cardPos: '50% 45%' },
  telo: { img: 'vertical-laser', kind: 'photo', tone: 'dark', widths: [480, 800, 1200, 1800], w: 800, h: 533, pos: '44% 42%', cardPos: '50% 40%' }
};
const SEGS = SEG_PACK.map((s) => ({ ...s, ...SEGMENTS[s.id], videoFile: `assets/video/${s.slug}.mp4`, webmFile: `assets/video/${s.slug}.webm` }));
SEGS.forEach((s) => {
  s.hasVideo = fs.existsSync(path.join(SITE, s.videoFile));
  s.hasWebm = fs.existsSync(path.join(SITE, s.webmFile));
  s.priceGroups = s.priceList.groups.map((g) => ({ ...GROUPS[g.groupId], role: g.role })); // primary first, in pack order
  s.articles = s.articleIds.map((id) => byId[id]);
});
const segBySlug = Object.fromEntries(SEGS.map((s) => [s.slug, s]));
const segByKey = Object.fromEntries(SEGS.map((s) => [s.id, s]));

/* in-article position (prev / next / related) */
ARTICLES.forEach((a) => {
  const seg = segByKey[a.segmentId], i = seg.articleIds.indexOf(a.id);
  a.prev = i > 0 ? byId[seg.articleIds[i - 1]] : null;
  a.next = i < seg.articleIds.length - 1 ? byId[seg.articleIds[i + 1]] : null;
});
/* related: linked from the text / hinted by the copywriter (3 points each), same primary group (2), same related group (1), small bonus for the same segment; prev / next are skipped when enough others exist */
function related(a) {
  const score = {};
  const add = (id, n) => { if (id && id !== a.id && byId[id]) score[id] = (score[id] || 0) + n; };
  a.blocks.forEach((b) => (b.links || []).forEach((l) => { if (l.target.type === 'article') add(l.target.id, 3); }));
  (a.crossLinkHints || []).forEach((h) => (h.targetArticleIds || []).forEach((id) => add(id, 3)));
  const mine = linkOf[a.id];
  const prim = new Set(mine.primaryGroupIds), rel = new Set(mine.relatedGroupIds);
  ARTICLES.forEach((o) => {
    if (o.id === a.id) return;
    const l = linkOf[o.id];
    l.primaryGroupIds.forEach((g) => { if (prim.has(g)) add(o.id, 2); else if (rel.has(g)) add(o.id, 1); });
    l.relatedGroupIds.forEach((g) => { if (prim.has(g) || rel.has(g)) add(o.id, 1); });
    if (o.segmentId === a.segmentId) add(o.id, 0.5);
  });
  const rank = Object.keys(score).sort((x, y) => score[y] - score[x] || (+x.slice(4)) - (+y.slice(4)));
  const skip = new Set([a.prev && a.prev.id, a.next && a.next.id].filter(Boolean));
  const out = rank.filter((id) => !skip.has(id)).slice(0, 3);
  for (const id of rank) { if (out.length >= 3) break; if (!out.includes(id)) out.push(id); }
  return out.map((id) => byId[id]);
}
ARTICLES.forEach((a) => { a.related = related(a); });

/* ------------------------------------------------------------------ small html parts ---------- */
const deep = (R, o) => { // price list deep links: ?grupa=<tab:index> or ?usluga=<tab:index:service>; the #usluge hash is the no-JS fallback
  if (o.group) return `${R}index.html?grupa=${o.group}#usluge`;
  if (o.service) return `${R}index.html?usluga=${o.service}#usluge`;
  return `${R}index.html#usluge`;
};
function imgTag(o) {
  const set = o.widths.map((w) => `${o.R}assets/img/${o.name}-${w}.webp ${w}w`).join(', ');
  const src = `${o.R}assets/img/${o.name}-${o.widths.includes(800) ? 800 : o.widths[0]}.webp`;
  return `<img${o.cls ? ` class="${o.cls}"` : ''} src="${src}" srcset="${set}" sizes="${o.sizes}" width="${o.w}" height="${o.h}" alt="${esc(o.alt)}"${o.lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async"${o.pos ? ` style="object-position:${o.pos}"` : ''}>`;
}
const segImg = (s, R, extra) => imgTag({ R, name: s.img, widths: s.widths, w: s.w, h: s.h, alt: s.heroImage.alt, pos: s.pos, ...extra });
function crumbs(R, items) { // items: [{label, href?}] ; last one is the current page
  return `<nav class="crumbs" aria-label="Putanja"><ol>${items.map((it, i) => (i === items.length - 1 && !it.href) ? `<li><span aria-current="page">${esc(it.label)}</span></li>` : `<li><a href="${it.href}">${esc(it.label)}</a></li>`).join('')}</ol></nav>`;
}
const waLink = (base, text) => `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;

/* ------------------------------------------------------------------ SHELL: head, header + menu, footer + bar ---------- */
function head(o) {
  const R = o.R;
  return `<!doctype html>
<html lang="sr-Latn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light">
<link rel="icon" href="${R}assets/logo/lsd-stacked-block-lila.svg" type="image/svg+xml">
<link rel="icon" href="${R}assets/img/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="${R}favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="${R}assets/img/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="sr_RS">
<meta property="og:site_name" content="Lepa Svaki Dan">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:image" content="${BASE}assets/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${R}assets/fonts/GalanoGrotesqueRegular.woff2" as="font" type="font/woff2" crossorigin>
<script>var h=document.documentElement;h.className+=' js';setTimeout(function(){if(!h.classList.contains('js-live'))h.classList.remove('js')},3500)</script>
<link rel="stylesheet" href="${R}css/tokens.css">
<link rel="stylesheet" href="${R}css/style.css">
<link rel="stylesheet" href="${R}css/pages.css">
</head>
<body${o.bodyClass ? ` class="${o.bodyClass}"` : ''} id="top"${o.page ? ` data-page="${o.page}"` : ''}>
`;
}

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="i-arrow-ur" viewBox="0 0 24 24"><path d="M7 17 17 7M8.5 7H17v8.5"/></symbol>
  <symbol id="i-arrow-r" viewBox="0 0 24 24"><path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/></symbol>
  <symbol id="i-arrow-l" viewBox="0 0 24 24"><path d="M19 12H5M10.5 6.5 5 12l5.5 5.5"/></symbol>
  <symbol id="i-down" viewBox="0 0 24 24"><path d="M12 5v14M6.5 13.5 12 19l5.5-5.5"/></symbol>
  <symbol id="i-up" viewBox="0 0 24 24"><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M21 16.9v2.6a1.8 1.8 0 0 1-2 1.8A17.8 17.8 0 0 1 3.7 5 1.8 1.8 0 0 1 5.5 3h2.6a1.8 1.8 0 0 1 1.8 1.5c.1 1 .4 1.9.7 2.8a1.8 1.8 0 0 1-.4 1.9L9 10.4a14.4 14.4 0 0 0 4.6 4.6l1.2-1.2a1.8 1.8 0 0 1 1.9-.4c.9.3 1.8.6 2.8.7a1.8 1.8 0 0 1 1.5 1.8z"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2.5 21.5z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><path d="M3.5 6h17v12h-17zM4 7l8 6.2L20 7"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></symbol>
</svg>`;

function navLinks(o) { // o.home: hash links, else index.html#...; o.current: label of the section the page belongs to
  return CONTENT.nav.links.map((l) => {
    const href = o.home ? l.hrefOnHome : o.R + l.hrefFromSubpage;
    const cur = (!o.home && o.current === l.label) ? ` aria-current="${o.currentExact ? 'page' : 'true'}"` : '';
    return `<a href="${href}"${cur}>${esc(l.label)}</a>`;
  });
}

/* SEARCH FIELD (Google-style). One markup for the hero bar of the home page (results drop down under the field) and for the
   overlay opened by the header search button on every page (results fill the overlay). js/search.js wires both. */
function searchField(id, o = {}) {
  const R = o.R || '';
  const hints = SEARCH_EXAMPLES.map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('');
  return `<form class="hsearch${o.overlay ? ' hsearch--ov' : ''}" role="search" action="${R}index.html#usluge" method="get" data-search="${o.overlay ? 'overlay' : 'hero'}">
  <div class="hsearch__field">
    <svg class="hsearch__ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-search"/></svg>
    <label class="sr-only" for="${id}">Pretraga tretmana, tekstova i ponuda</label>
    <input class="hsearch__in" id="${id}" name="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(SEARCH_PH.short)}" data-ph-long="${esc(SEARCH_PH.long)}" data-ph-short="${esc(SEARCH_PH.short)}" data-ph-tiny="${esc(SEARCH_PH.tiny)}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list">
    <button class="hsearch__clear" type="button" aria-label="Obriši pretragu" hidden>${icon('x', 18)}</button>
    <button class="hsearch__go" type="submit" aria-label="Pretraži">${icon('arrow-r', 20)}</button>
  </div>
  <p class="hsearch__hint"><span>Pokušajte:</span>${hints}</p>${o.overlay ? '' : `
  <div class="sres" id="${id}-list" role="listbox" aria-label="Rezultati pretrage" hidden></div>`}
  <p class="sr-only" role="status" aria-live="polite" id="${id}-live"></p>
</form>`;
}

function shellTop(o) {
  const R = o.R, links = navLinks(o).map((a) => '      ' + a).join('\n');
  const menuLinks = navLinks({ ...o, current: null }).map((a) => '      ' + a).join('\n');
  const [p1, p2] = CONTACT.phones;
  const priceHref = o.home ? '#usluge' : R + 'index.html#usluge';
  return `<a class="skip" href="#main">Preskoči na sadržaj</a>

<!-- icon sprite -->
${SPRITE}

<!-- ============================= NAV (sticky pill) ============================= -->
<header class="nav" id="nav">
  <div class="nav__pill">
    <a class="nav__logo" href="${o.home ? '#top' : R + 'index.html'}" aria-label="Lepa Svaki Dan, Beauty Concept, početna stranica">
      <img src="${R}assets/logo/logo-horizontal-lila-gold.svg" width="190" height="55" alt="Beauty Concept, Lepa Svaki Dan">
    </a>
    <nav class="nav__links" aria-label="Glavna navigacija">
${links}
    </nav>
    <div class="nav__phones" role="group" aria-label="Telefoni">
      <a class="nav__tel" href="${p1.telHref}">${esc(p1.display)}</a>
      <a class="nav__tel" href="${p2.telHref}">${esc(p2.display)}</a>
    </div>
    <a class="nav__search" id="search-open" href="${priceHref}" aria-label="Pretraga" aria-haspopup="dialog">${icon('search', 22)}</a>
    <a class="btn btn--primary btn--sm nav__cta" href="${CONTENT.nav.cta.href}" target="_blank" rel="noopener">${esc(CONTENT.nav.cta.short)}</a>
    <button class="nav__burger" id="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Meni">
      <span class="burger__bars" aria-hidden="true"><i></i><i></i></span>
    </button>
  </div>
</header>

<!-- mobile / tablet menu -->
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Meni" hidden>
  <div class="menu__inner">
    <nav class="menu__links" aria-label="Mobilna navigacija">
${menuLinks}
    </nav>
    <div class="menu__contact">
      <a class="menu__phone" href="${p1.telHref}"><span>${esc(p1.area)}</span><strong>${esc(p1.display)}</strong></a>
      <a class="menu__phone" href="${p2.telHref}"><span>${esc(p2.area)}</span><strong>${esc(p2.display)}</strong></a>
      <div class="menu__icons">
        <a class="btn btn--secondary" href="${p1.whatsappHref}" target="_blank" rel="noopener" data-sheet="wa">${icon('chat')}WhatsApp</a>
        <a class="btn btn--secondary" href="${MAIL.href}">${icon('mail')}E-pošta</a>
      </div>
      <a class="btn btn--primary btn--block" href="${CONTENT.nav.cta.href}" target="_blank" rel="noopener">${esc(CONTENT.nav.cta.full)}</a>
    </div>
  </div>
</div>

<!-- search overlay (header search button, every page; js/search.js) -->
<div class="sov" id="search-ov" role="dialog" aria-modal="true" aria-label="Pretraga" hidden>
  <div class="sov__top">
${searchField('sov-q', { overlay: true, R }).replace(/^/gm, '    ')}
    <button class="sov__close" id="search-close" type="button" aria-label="Zatvori pretragu">${icon('x', 22)}</button>
  </div>
  <div class="sov__body">
    <div class="sres" id="sov-q-list" role="listbox" aria-label="Rezultati pretrage"></div>
  </div>
</div>
`;
}
function shellBottom(o) {
  const R = o.R, F = CONTENT.footer, [p1, p2] = CONTACT.phones;
  const locHref = o.home ? '#lokacije' : R + 'index.html#lokacije';
  const soc = F.columns.social.links.map((l) => (l.href && l.href !== '#') ? `<li><a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a></li>` : `<li><span class="foot__off">${esc(l.label)}</span></li>`).join('\n            ');
  return `<!-- ============================= CTA + FOOTER (dark, grain) ============================= -->
<footer class="dark foot" id="kontakt" data-sec="Kontakt i podnožje">
  <div class="grain" aria-hidden="true"></div>
  <div class="wrap foot__wrap">

    <div class="cta">
      <div class="seal" aria-hidden="true">
        <svg class="seal__ring" viewBox="0 0 220 220" width="220" height="220">
          <defs><path id="seal-path" d="M110 110m-86 0a86 86 0 1 1 172 0a86 86 0 1 1-172 0"/></defs>
          <text><textPath href="#seal-path" startOffset="0">LEPA • SVAKI • DAN • LEPA • SVAKI • DAN • LEPA • SVAKI • DAN •</textPath></text>
        </svg>
        <img class="seal__mark" src="${R}assets/logo/lsd-stacked-frame-white.svg" width="100" height="72" alt="" loading="lazy" decoding="async">
      </div>
      <p class="eyebrow eyebrow--center">Zakažite konsultaciju</p>
      <h2 class="cta__h2">Vaše uživanje i briga o lepoti počinju ovde. <span class="cta__h2-2">Zakažite svoj termin.</span></h2>
      <div class="cta__btns">
        <a class="btn btn--inverse" href="${p1.telHref}">${icon('phone')}${esc(p1.display)}</a>
        <a class="btn btn--inverse" href="${p2.telHref}">${icon('phone')}${esc(p2.display)}</a>
      </div>
      <div class="cta__more">
        <a href="${p1.whatsappHref}" target="_blank" rel="noopener" data-sheet="wa">${icon('chat', 18)}WhatsApp</a>
        <a href="${MAIL.href}">${icon('mail', 18)}${esc(MAIL.label)}</a>
        <a href="${SOCIAL.Instagram}" target="_blank" rel="noopener">Instagram</a>
      </div>
    </div>

    <div class="foot__main">
      <div class="foot__brand">
        <img src="${R}assets/logo/logo-full-white.svg" width="200" height="105" alt="Beauty Concept, Lepa Svaki Dan" loading="lazy" decoding="async">
        <p>${esc(HERO_SUB)}</p>
      </div>
      <div class="foot__cols">
        <div class="foot__col">
          <h3>${esc(F.columns.contact.heading)}</h3>
          <ul>
            <li><a href="${p1.telHref}">${esc(p1.display)}</a></li>
            <li><a href="${p2.telHref}">${esc(p2.display)}</a></li>
            <li><a href="${MAIL.href}">${esc(MAIL.label)}</a></li>
            <li><a href="${p1.whatsappHref}" target="_blank" rel="noopener" data-sheet="wa">WhatsApp</a></li>
          </ul>
        </div>
        <div class="foot__col">
          <h3>${esc(F.columns.social.heading)}</h3>
          <ul>
            ${soc}
          </ul>
        </div>
        <div class="foot__col">
          <h3>${esc(F.columns.locations.heading)}</h3>
          <ul>
${F.columns.locations.items.map((l) => `            <li><a href="${locHref}"><span>${esc(l.concept)}</span><small>${esc(l.address)}</small></a></li>`).join('\n')}
          </ul>
        </div>
      </div>
    </div>

    <div class="foot__credit">
      <p>© <span id="year">2026</span> Lepa Svaki Dan. Sva prava zadržana.</p>
      <p>${esc(F.credit)}</p>
      <a class="totop" href="#top" aria-label="${esc(F.backToTopAria)}">${icon('up', 22)}</a>
    </div>
  </div>
</footer>

<!-- mobile action bar: Pozovi and WhatsApp open a small sheet with BOTH numbers (js/shell.js); without JS they go to the footer contacts -->
<div class="bar" id="bar" role="region" aria-label="Brze akcije">
  <a class="bar__btn" href="#kontakt" data-sheet="tel" aria-haspopup="dialog">${icon('phone')}<span>Pozovi</span></a>
  <a class="bar__btn" href="#kontakt" data-sheet="wa" aria-haspopup="dialog">${icon('chat')}<span>WhatsApp</span></a>
  <a class="bar__btn bar__btn--primary" href="${CONTENT.nav.cta.href}" target="_blank" rel="noopener"><span>${esc(CONTENT.nav.cta.short)}</span></a>
</div>

<!-- contact sheet: both numbers as two big buttons -->
<dialog class="sheet" id="contact-sheet" aria-labelledby="contact-sheet-t">
  <div class="sheet__in">
    <h2 class="sheet__t" id="contact-sheet-t">Pozovite nas</h2>
    <p class="sheet__lead">Izaberite broj. Tačnu lokaciju i slobodan termin dogovaramo prilikom zakazivanja.</p>
    <div class="sheet__big" data-mode="tel">
      <a href="${p1.telHref}">${icon('phone')}<span><small>${esc(p1.area)}</small><strong>${esc(p1.display)}</strong></span></a>
      <a href="${p2.telHref}">${icon('phone')}<span><small>${esc(p2.area)}</small><strong>${esc(p2.display)}</strong></span></a>
    </div>
    <div class="sheet__big" data-mode="wa" hidden>
      <a href="${p1.whatsappHref}" target="_blank" rel="noopener">${icon('chat')}<span><small>${esc(p1.area)}</small><strong>${esc(p1.display)}</strong></span></a>
      <a href="${p2.whatsappHref}" target="_blank" rel="noopener">${icon('chat')}<span><small>${esc(p2.area)}</small><strong>${esc(p2.display)}</strong></span></a>
    </div>
    <button class="sheet__x round round--ghost" id="contact-sheet-x" type="button" aria-label="Zatvori">${icon('x', 20)}</button>
  </div>
</dialog>
`;
}
function scripts(R, extra) {
  return `<script src="${R}js/shell.js" defer></script>\n<script src="${R}js/search.js" defer></script>\n${(extra || []).map((s) => `<script src="${R}${s}" defer></script>`).join('\n')}${extra && extra.length ? '\n' : ''}<script src="${R}js/review.js" defer></script>\n</body>\n</html>\n`;
}
const NOSCRIPT_NOTE = ''; // pages are pre-rendered: they read without JS, nothing to warn about

/* ------------------------------------------------------------------ contact line (quiet, under every text; values from the data) ---------- */
function clineHtml() {
  const [p1, p2] = CONTACT.phones;
  return `<div class="cline" role="group" aria-label="Kontakt"><a href="${p1.telHref}">${icon('phone', 18)}${esc(p1.display)}</a><a href="${p2.telHref}">${icon('phone', 18)}${esc(p2.display)}</a><a href="${MAIL.href}">${icon('mail', 18)}${esc(MAIL.label)}</a></div>`;
}

/* ------------------------------------------------------------------ contact block (shared by sub pages) ---------- */
function ctaHeadline(c) { // "Niste sigurni koji je<br>tretman <em>za vas</em>?"  ->  one colour, plain text
  return esc(c.headlineHtml.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ''));
}
function contactBlock(R, cta, waText, id = 'kontakt-blok') {
  const locs = LOCS.map((l, i) => `
        <div class="cloc">
          <p class="cloc__eyebrow"><span class="dot dot--lila" aria-hidden="true"></span>${esc(l.eyebrow)}</p>
          <h3 class="cloc__name">${esc(l.concept)}</h3>
          <p class="cloc__addr">${esc(l.area)}, ${esc(l.address)}</p>
          <a class="cloc__phone" href="${l.phone.telHref}">${esc(l.phone.display)}</a>
          <div class="cloc__actions">
            <a class="btn btn--line" href="${l.phone.telHref}">${icon('phone')}Pozovi</a>
            <a class="btn btn--line" href="${waLink(l.phone.whatsappHref, waText)}" target="_blank" rel="noopener">${icon('chat')}WhatsApp</a>
          </div>
        </div>`).join('');
  return `<section class="sec contact" id="${id}" aria-labelledby="${id}-t" data-sec="Kontakt">
  <div class="wrap">
    <div class="contact__card">
      <div class="contact__head">
        <p class="eyebrow">${esc(cta.eyebrow)}</p>
        <h2 class="h2 h2--sub" id="${id}-t">${ctaHeadline(cta)}</h2>
        <p class="contact__p">${esc(cta.body)}</p>
      </div>
      <div class="contact__locs">${locs}
      </div>
      <p class="contact__foot">
        <a class="contact__mail" href="${MAIL.href}">${icon('mail')}${esc(MAIL.label)}</a>
        <span class="contact__hours"><span class="dot dot--ink" aria-hidden="true"></span>${esc(HOURS)}</span>
      </p>
    </div>
  </div>
</section>
`;
}
const CTA_BLOG = CONTENT.cta.blog, CTA_OFFERS = CONTENT.cta.offers;

/* ------------------------------------------------------------------ article body ---------- */
function linkHref(t, R, selfId) {
  switch (t.type) {
    case 'article': return t.id === selfId || !byId[t.id] ? null : `${R}blog/${byId[t.id].slug}.html`;
    case 'segment': return segByKey[t.id] ? `${R}tretmani/${segByKey[t.id].slug}.html` : null;
    case 'pricelist': return t.id === 'all' ? deep(R, {}) : GROUPS[t.id] ? deep(R, { group: t.id }) : null;
    case 'external': return t.__href || null;
    default: return null;
  }
}
const TOKEN = /\[\[dopuniti: ([^\]]+)\]\]/g;
function inline(text, links, R, selfId) {
  const ranges = [];
  let m; TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) ranges.push({ s: m.index, e: m.index + m[0].length, ph: m[1] });
  (links || []).forEach((l) => {
    const t = { ...l.target };
    if (t.type === 'external') t.__href = /^https?:\/\//.test(l.text) ? l.text : null;
    const href = linkHref(t, R, selfId); if (!href) return;
    const s = text.indexOf(l.text); if (s < 0) return;
    const e = s + l.text.length;
    if (ranges.some((r) => s < r.e && e > r.s)) return;
    ranges.push({ s, e, href, ext: t.type === 'external' });
  });
  ranges.sort((a, b) => a.s - b.s);
  let html = '', pos = 0;
  ranges.forEach((r) => {
    html += esc(text.slice(pos, r.s));
    if (r.ph) html += `<mark class="ph" data-ph="${esc(r.ph)}">[dopuniti: ${esc(r.ph)}]</mark>`;
    else html += `<a href="${r.href}"${r.ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(text.slice(r.s, r.e))}</a>`;
    pos = r.e;
  });
  return html + esc(text.slice(pos));
}
/* The copywriter's Word comments ("link this word to that text") that the pack resolved with confidence become extra in-text links.
   Only resolution "confident" is applied; "partial" and "none" stay unlinked (they need a human decision). Words are never changed. */
function hintLinks(a, bi, b) {
  const out = [];
  (a.crossLinkHints || []).filter((h) => h.blockIndex === bi && h.resolution === 'confident').forEach((h) => {
    const targets = [...(h.targetArticleIds || []).map((id) => ({ type: 'article', id })), ...(h.targetSegmentIds || []).map((id) => ({ type: 'segment', id }))];
    if (targets.length !== 1) return;
    if (b.type === 'ul' || b.type === 'ol') { const i = b.items.findIndex((it) => it.includes(h.anchorText)); if (i >= 0) out.push({ text: h.anchorText, item: i, target: targets[0] }); }
    else if ((b.text || '').includes(h.anchorText)) out.push({ text: h.anchorText, target: targets[0] });
  });
  return out;
}
function renderBody(a, R) {
  const out = [], toc = [], used = new Set();
  const idFor = (t) => { let id = asciiSlug(t.replace(TOKEN, '$1')).slice(0, 60) || 'odeljak', k = id, n = 2; while (used.has(k)) k = `${id}-${n++}`; used.add(k); return k; };
  a.blocks.forEach((b0, bi) => {
    const b = { ...b0, links: [...(b0.links || []), ...hintLinks(a, bi, b0)] };
    if (b.flag) { // copywriter note inside the Word file (source of the text): shown as a clearly marked editor note, not as article copy
      out.push(`<aside class="ednote ednote--inline" role="note"><strong>Napomena iz Word dokumenta, nije deo teksta:</strong> ${inline(b.text, b.links, R, a.id)}</aside>`);
      return;
    }
    if (b.type === 'h2' || b.type === 'h3') {
      const id = idFor(b.text);
      toc.push({ id, level: b.type === 'h2' ? 1 : 2, text: b.text.replace(TOKEN, '[dopuniti: $1]') });
      out.push(`<${b.type} id="${id}">${inline(b.text, b.links, R, a.id)}</${b.type}>`);
    } else if (b.type === 'p') {
      out.push(`<p>${inline(b.text, b.links, R, a.id)}</p>`);
    } else if (b.type === 'ul' || b.type === 'ol') {
      out.push(`<${b.type}>${b.items.map((it, i) => `<li>${inline(it, (b.links || []).filter((l) => l.item === i), R, a.id)}</li>`).join('')}</${b.type}>`);
    }
  });
  return { html: out.join('\n'), toc };
}
function tocHtml(toc) {
  if (toc.length < 6) return '';
  let h = '<details class="toc"><summary><span>Sadržaj teksta</span><span class="toc__i" aria-hidden="true">' + icon('plus', 18) + '</span></summary><ol class="toc__list">';
  toc.forEach((t) => { h += `<li class="toc__l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`; });
  return h + '</ol></details>';
}

/* ------------------------------------------------------------------ cards ---------- */
/* the excerpt is the first 170 characters of the first paragraph: show an ellipsis only when it really is cut off */
const excerptCut = (a) => { const f = a.blocks.find((b) => b.type === 'p'); return !!f && f.text.replace(/\s+/g, ' ').trim().length > a.excerpt.trim().length + 1; };
function articleCard(a, R, o = {}) {
  const seg = segByKey[a.segmentId];
  return `<article class="acard${o.rv === false ? '' : ' rv'}" data-segment="${a.segmentId}">
  <div class="acard__top"><span class="chip chip--fill">${esc(seg.name)}</span><span class="acard__min">${nWord(a.readMinutes, 'minut', 'minuta', 'minuta')} čitanja</span>${a.hasPlaceholders ? '<span class="chip chip--ph" title="U tekstu ima polja za dopunu">za dopunu</span>' : ''}</div>
  <h3 class="acard__title"><a class="acard__a" href="${R}blog/${a.slug}.html">${brk(a.title)}</a></h3>
  ${a.subtitle ? `<p class="acard__sub">${esc(a.subtitle)}</p>` : ''}
  <p class="acard__ex${excerptCut(a) ? ' acard__ex--cut' : ''}">${inline(a.excerpt, [], R, a.id)}</p>
  <p class="acard__go"><span>Pročitaj tekst</span><span class="acard__arrow" aria-hidden="true">${icon('arrow-ur', 20)}</span></p>
</article>`;
}
function priceBox(groups, R, o = {}) {
  if (!groups.length) return '';
  const prim = groups.filter((g) => g.role === 'primary'), rel = groups.filter((g) => g.role !== 'primary');
  const row = (g) => `<li><a class="pbox__row" href="${deep(R, { group: g.id })}"><span class="pbox__txt"><span class="pbox__t">${esc(g.title)}</span><span class="pbox__m">${esc(g.tabLabel)} · ${nWord(g.count, 'usluga', 'usluge', 'usluga')}</span></span><span class="pbox__go" aria-hidden="true">${icon('arrow-ur', 18)}</span></a></li>`;
  return `<aside class="pbox" aria-labelledby="${o.id || 'pbox'}-t">
  <p class="eyebrow">Cenovnik</p>
  <h2 class="pbox__h" id="${o.id || 'pbox'}-t">${o.title || 'U cenovniku'}</h2>
  ${o.lead ? `<p class="pbox__lead">${o.lead}</p>` : ''}
  <ul class="pbox__list">${prim.map(row).join('')}</ul>
  ${rel.length ? `<p class="pbox__sub">Povezano</p><ul class="pbox__list pbox__list--rel">${rel.map(row).join('')}</ul>` : ''}
</aside>`;
}

/* ------------------------------------------------------------------ PAGE: blog index ---------- */
function pageBlog() {
  const R = '', B = CONTENT.sections.blog, P = CONTENT.site.pages.blog;
  const chips = [`<a class="segchip" href="#seg-sve" data-seg="sve" aria-current="true">Svi tekstovi<small>${ARTICLES.length}</small></a>`]
    .concat(SEGS.map((s) => `<a class="segchip" href="#seg-${s.id}" data-seg="${s.id}">${esc(s.name)}<small>${s.articles.length}</small></a>`)).join('\n      ');
  const sections = SEGS.map((s) => `
  <section class="bseg" id="seg-${s.id}" data-segment="${s.id}" aria-labelledby="seg-${s.id}-t">
    <header class="bseg__head">
      <div>
        <p class="eyebrow">${nWord(s.articles.length, 'tekst', 'teksta', 'tekstova')}</p>
        <h2 class="bseg__h" id="seg-${s.id}-t">${esc(s.name)}</h2>
      </div>
      <a class="btn btn--secondary bseg__btn" href="tretmani/${s.slug}.html">O segmentu ${esc(s.name)}${icon('arrow-r')}</a>
    </header>
    <div class="acards" data-n="${s.articles.length}">
${s.articles.map((a) => articleCard(a, R)).join('\n')}
    </div>
  </section>`).join('\n');
  const html = head({ R, title: P.title, description: P.description, page: 'blog' }) + shellTop({ R, current: 'Blog', currentExact: true }) + `
<main id="main">

<header class="phead">
  <div class="wrap">
    ${crumbs(R, [{ label: 'Početna', href: 'index.html' }, { label: 'Blog' }])}
    <p class="eyebrow">${esc(B.eyebrow)}</p>
    <h1 class="h1p">Sve što treba da znate o nezi kože i tela.</h1>
    <p class="phead__lead">${esc(B.intro)}</p>
  </div>
</header>

<div class="wrap">
  <nav class="segchips" id="segchips" aria-label="Segmenti bloga">
    <p class="segchips__l" id="segchips-l">Prikaži</p>
    <div class="segchips__row">
      ${chips}
    </div>
  </nav>
  <p class="blog-status" id="blog-status" role="status" aria-live="polite"></p>
</div>

<div class="wrap blog-list" id="seg-sve">
${sections}
</div>

<div class="wrap blog-contact">
  ${clineHtml()}
</div>

${contactBlock(R, CTA_BLOG, 'Zdravo, zanima me tretman iz tekstova na vašem sajtu. Molim vas za informacije i termin.')}
</main>

` + shellBottom({ R }) + scripts(R, ['js/pages.js']);
  write('blog.html', html);
}

/* ------------------------------------------------------------------ PAGE: article ---------- */
function pageArticle(a) {
  const R = '../', seg = segByKey[a.segmentId], link = linkOf[a.id];
  const body = renderBody(a, R);
  const groups = [...link.primaryGroupIds.map((id) => ({ ...GROUPS[id], role: 'primary' })), ...link.relatedGroupIds.map((id) => ({ ...GROUPS[id], role: 'related' }))];
  const phCount = a.placeholders.length;
  const desc = a.excerpt.replace(TOKEN, '').replace(/\s+/g, ' ').trim();
  const kinds = [...new Set(a.placeholders.map((p) => p.kind))];
  const note = a.hasPlaceholders ? `<aside class="ednote" role="note">
    <p class="ednote__t">Za pregled teksta</p>
    <p>U ovom tekstu ima ${nWord(phCount, 'polje', 'polja', 'polja')} za dopunu. Označena su ovako: <mark class="ph">[dopuniti: ${esc(kinds[0])}]</mark>. Pre objave treba dopuniti: ${esc(kinds.join(', '))}.</p>
  </aside>` : '';
  const html = head({ R, title: `${a.title} | Blog | Lepa Svaki Dan`, description: desc, page: 'tekst-' + a.id.replace(/^art-/, '') }) + shellTop({ R, current: 'Blog' }) + `
<main id="main">
<article class="art">
  <header class="phead phead--art">
    <div class="wrap">
      ${crumbs(R, [{ label: 'Blog', href: R + 'blog.html' }, { label: seg.name, href: `${R}blog.html#seg-${seg.id}` }])}
      <p class="art__meta"><span class="chip chip--fill">${esc(seg.name)}</span><span class="art__min">${nWord(a.readMinutes, 'minut', 'minuta', 'minuta')} čitanja</span></p>
      <h1 class="h1p h1p--art">${brk(a.title)}</h1>
      ${a.subtitle ? `<p class="art__sub">${esc(a.subtitle)}</p>` : ''}
    </div>
  </header>

  <div class="wrap art__layout">
    <div class="art__main">
      ${note}
      ${tocHtml(body.toc)}
      <div class="prose" id="tekst">
<!--prose-->
${body.html}
<!--/prose-->
      </div>
      ${clineHtml()}
    </div>
    <div class="art__aside">
      ${priceBox(groups, R, { id: 'u-cenovniku', lead: 'Grupe usluga iz cenovnika koje se odnose na ovaj tekst. Klik otvara tu grupu u cenovniku.' })}
    </div>
  </div>

  <nav class="wrap pn" aria-label="Tekstovi u segmentu ${esc(seg.name)}">
    ${a.prev ? `<a class="pn__a pn__a--prev" href="${a.prev.slug}.html" rel="prev"><span class="pn__l">${icon('arrow-l', 18)}Prethodni tekst</span><span class="pn__t">${brk(a.prev.title)}</span></a>` : '<span class="pn__a pn__a--none" aria-hidden="true"></span>'}
    ${a.next ? `<a class="pn__a pn__a--next" href="${a.next.slug}.html" rel="next"><span class="pn__l">Sledeći tekst${icon('arrow-r', 18)}</span><span class="pn__t">${brk(a.next.title)}</span></a>` : '<span class="pn__a pn__a--none" aria-hidden="true"></span>'}
  </nav>

  <section class="sec related" aria-labelledby="related-t">
    <div class="wrap">
      <header class="sec-head">
        <p class="eyebrow">Još za čitanje</p>
        <h2 class="h2 h2--sub" id="related-t">Povezani tekstovi.</h2>
      </header>
      <div class="acards acards--3">
${a.related.map((r) => articleCard(r, '../')).join('\n')}
      </div>
    </div>
  </section>
</article>

${contactBlock(R, CTA_BLOG, `Zdravo, zanima me tretman iz teksta „${a.title}“ na vašem sajtu. Molim vas za informacije i termin.`)}
</main>

` + shellBottom({ R }) + scripts(R);
  write(`blog/${a.slug}.html`, html);
}

/* ------------------------------------------------------------------ PAGE: segment ---------- */
function heroMarkup(s, R) {
  const vid = s.hasVideo ? ` data-video="${R}${s.videoFile}"${s.hasWebm ? ` data-video-webm="${R}${s.webmFile}"` : ''}` : '';
  const arts = nWord(s.articles.length, 'tekst', 'teksta', 'tekstova');
  const grps = nWord(s.priceGroups.length, 'grupa', 'grupe', 'grupa');
  return `<section class="shero shero--${s.kind} shero--${s.tone}" id="zaglavlje" data-segment="${s.id}"${vid} aria-labelledby="seg-h1">
  <!-- HEADER VIDEO: this block is video-ready. To switch it on, add  data-video="${R}${s.videoFile}"  (optional  data-video-webm="${R}${s.webmFile}")  to this <section>,
       or just put the file at  ${s.videoFile}  and re-run  node _tools/c/build-pages.mjs.  js/pages.js then plays it muted + looping on good connections only
       (never with reduced motion or data saver); the poster image below stays as the fallback. Keep it short, around 720p, no audio track, under about 2 MB. -->
  <div class="shero__frame">
    <div class="shero__media">
      ${segImg(s, R, { cls: 'shero__poster', sizes: s.kind === 'cutout' ? '(min-width:1024px) 560px, 86vw' : '(min-width:1360px) 1360px, 100vw' })}
    </div>
    <div class="shero__scrim shero__scrim--light" aria-hidden="true"></div>
    <div class="shero__scrim shero__scrim--dark" aria-hidden="true"></div>
    <span class="brk brk--tight shero__brk" aria-hidden="true"></span>
    <div class="shero__in">
      ${crumbs(R, [{ label: 'Početna', href: R + 'index.html' }, { label: 'Tretmani', href: R + 'index.html#tretmani' }, { label: s.name }])}
      <p class="eyebrow shero__eyebrow">Tretmani</p>
      <h1 class="shero__h1" id="seg-h1">${esc(s.name)}</h1>
      <p class="shero__intro">${esc(s.intro.text)}</p>
      <p class="shero__chips"><span class="chip chip--hero">${arts}</span><span class="chip chip--hero">${grps} u cenovniku</span></p>
      <div class="shero__ctas">
        <a class="btn btn--primary" href="#tekstovi">Tekstovi o tretmanima${icon('arrow-r')}</a>
        <a class="btn btn--hero" href="#cenovnik">Grupe u cenovniku</a>
      </div>
    </div>
    <button class="shero__toggle" type="button" aria-pressed="false" aria-label="Pauziraj video u zaglavlju" hidden><span class="shero__ico" aria-hidden="true"></span><span class="shero__lbl">Pauziraj video</span></button>
  </div>
</section>`;
}
function pageSegment(s) {
  const R = '../';
  const others = SEGS.filter((o) => o.id !== s.id);
  const html = head({ R, title: `${s.name} | Tretmani | Lepa Svaki Dan`, description: s.intro.text, page: s.slug }) + shellTop({ R, current: 'Tretmani' }) + `
<main id="main">

${heroMarkup(s, R)}

<section class="sec seg-articles" id="tekstovi" aria-labelledby="tekstovi-t">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow">Blog</p>
      <h2 class="h2" id="tekstovi-t">Tekstovi o tretmanima: ${esc(s.name)}.</h2>
    </header>
    <div class="acards" data-n="${s.articles.length}">
${s.articles.map((a) => articleCard(a, R)).join('\n')}
    </div>
    ${clineHtml()}
  </div>
</section>

<section class="sec seg-price" id="cenovnik" aria-labelledby="cenovnik-t">
  <div class="wrap seg-price__in">
    <header class="sec-head">
      <p class="eyebrow">Cenovnik</p>
      <h2 class="h2" id="cenovnik-t">Usluge i cene za ovaj segment.</h2>
      <p class="sec-head__intro">Svaka grupa otvara odgovarajući deo cenovnika.</p>
    </header>
    ${priceBox(s.priceGroups, R, { id: 'seg-pbox', title: 'Grupe iz cenovnika' })}
    ${clineHtml()}
  </div>
</section>

${contactBlock(R, CTA_BLOG, `Zdravo, zanima me segment ${s.name} na vašem sajtu. Molim vas za informacije i termin.`)}

<section class="sec others" aria-labelledby="others-t">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow">Saznajte više</p>
      <h2 class="h2 h2--sub" id="others-t">Ostali segmenti.</h2>
    </header>
    <div class="scards scards--3">
${others.map((o) => segmentCard(o, R, { lazy: true })).join('\n')}
    </div>
  </div>
</section>
</main>

` + shellBottom({ R }) + scripts(R, ['js/pages.js']);
  write(`tretmani/${s.slug}.html`, html);
}
function segmentCard(s, R, o = {}) {
  const arts = nWord(s.articles.length, 'tekst', 'teksta', 'tekstova');
  return `<a class="scard${s.kind === 'cutout' ? ' scard--cutout' : ''}${o.rv === false ? '' : ' rv'}" href="${R}tretmani/${s.slug}.html">
  <span class="scard__media">${imgTag({ R, name: s.img, widths: [480, 800, 1200], w: s.w, h: s.h, alt: s.heroImage.alt, pos: s.cardPos, cls: 'scard__img', lazy: true, sizes: '(min-width:1200px) 262px, (min-width:768px) 44vw, 92vw' })}</span>
  <span class="scard__body">
    <span class="scard__t">${esc(s.name)}</span>
    <span class="scard__p">${esc(s.intro.text)}</span>
    <span class="scard__foot"><span class="chip chip--outline-sm">${arts}</span><span class="scard__go" aria-hidden="true">${icon('arrow-ur', 20)}</span></span>
  </span>
</a>`;
}

/* ------------------------------------------------------------------ PAGE: posebna ponuda ---------- */
function readOffers() {
  const f = path.join(SITE, 'assets/offers.js');
  const ctx = { window: {} }; vm.runInNewContext(read(f), ctx);
  return ctx.window.LSD_CONTENT.offers;
}
function offersSeed() {
  const header = `/* =====================================================================================================
   POSEBNA PONUDA (special offers): the data behind posebna-ponuda.html and the offers teaser on the home page.
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   HOW TO ADD, EDIT OR REMOVE AN OFFER AND ITS PRICE
   - ADD:     copy one whole { ... } block below (keep a comma between blocks), paste it where it should appear (the order here is the
              order on the page), and give it a NEW unique "id" and "slug" (slug = lowercase letters, digits and dashes; it becomes the #anchor).
   - EDIT:    change the text between the quotes. "price" is written "385€ / 45.000 rsd" = EUR, a space, a slash, a space, RSD
              (keep the " / " separator, the page splits the price on it). "includes" is the short description of the package.
   - REMOVE:  delete the whole { ... } block (and its comma, so the list stays valid).
   - OPTIONAL fields (leave null to hide): "oldPrice" (same format as price, shown struck through), "validity" (a sentence such as
              "Važi do kraja meseca"; nothing is shown unless it is filled in), "note" (small line under the price),
              "featured": true (the one highlighted lila card; use it on a single offer), "cenovnikRef" (link to the price-list
              line: id is the service id such as "protokoli:2:2"; set the whole cenovnikRef to null to hide the link).
   - The WhatsApp button text is built from the title: no extra field is needed.
   The pages read THIS file directly, so a saved edit shows up on a reload. To refresh the pre-rendered copy (the version that works
   without JavaScript) run:  node _tools/c/build-pages.mjs
   ===================================================================================================== */
window.LSD_CONTENT = window.LSD_CONTENT || {};
window.LSD_CONTENT.offers = `;
  const offers = CONTENT.offers.map((o, i) => ({
    id: o.id, slug: o.slug, tag: o.tag, title: o.title, includes: o.includes, price: o.price, oldPrice: o.oldPrice, validity: o.validity, note: o.note,
    featured: i === 1, cta: o.cta, cenovnikRef: o.cenovnikRef ? { id: o.cenovnikRef.id, tab: o.cenovnikRef.tab, group: o.cenovnikRef.group, name: o.cenovnikRef.name } : null
  }));
  return header + JSON.stringify(offers, null, 2).replace(/\n/g, '\n') + ';\n';
}
function pageOffers(offers) {
  const R = '', P = CONTENT.site.pages.offers, S = CONTENT.sections.offers;
  const html = head({ R, title: P.title, description: P.description, page: 'posebna-ponuda' }) + shellTop({ R, current: 'Posebna ponuda', currentExact: true }) + `
<main id="main">

<header class="phead">
  <div class="wrap">
    ${crumbs(R, [{ label: 'Početna', href: 'index.html' }, { label: 'Posebna ponuda' }])}
    <p class="eyebrow">${esc(S.eyebrow)}</p>
    <h1 class="h1p">Paketi za poseban trenutak.</h1>
    <p class="phead__lead">${esc(S.intro)}</p>
  </div>
</header>

<section class="sec sec--tight offers" aria-label="Paketi">
  <div class="wrap">
    <!-- Pre-rendered from assets/offers.js (readable without JS). js/pages.js re-renders it from window.LSD_CONTENT.offers when the data changed (data-sig). -->
    <div class="ocards" id="offers-list" data-sig="${OFFERS_VIEW.sig(offers)}">
${OFFERS_VIEW.cards(offers, { indent: '      ' })}
    </div>
    <div class="offers__foot">
      <p>${esc(CONTENT.pricing.footnote[0].text)}</p>
    </div>
    ${clineHtml()}
  </div>
</section>

${contactBlock(R, CTA_OFFERS, 'Zdravo, zanima me posebna ponuda sa vašeg sajta. Molim vas za informacije i termin.')}
</main>

` + shellBottom({ R }) + scripts(R, ['assets/offers.js', 'js/offers-view.js', 'js/pages.js']);
  write('posebna-ponuda.html', html);
}

/* ------------------------------------------------------------------ HOME: marker regions ---------- */
function replaceRegion(html, name, inner) {
  const a = `<!-- build:${name} -->`, b = `<!-- /build:${name} -->`;
  const i = html.indexOf(a), j = html.indexOf(b);
  if (i < 0 || j < 0) throw new Error(`index.html: marker "${name}" missing`);
  return html.slice(0, i + a.length) + '\n' + inner.replace(/\n+$/, '') + '\n' + html.slice(j);
}
function replaceRegions(html, name, inner) { // every <!-- build:NAME --> ... <!-- /build:NAME --> block (the same name may repeat)
  const a = `<!-- build:${name} -->`, b = `<!-- /build:${name} -->`;
  let out = '', pos = 0, n = 0;
  for (;;) {
    const i = html.indexOf(a, pos); if (i < 0) break;
    const j = html.indexOf(b, i); if (j < 0) throw new Error(`index.html: marker "${name}" not closed`);
    out += html.slice(pos, i + a.length) + '\n' + inner.replace(/\n+$/, '') + '\n'; pos = j; n++;
  }
  if (!n) throw new Error(`index.html: marker "${name}" missing`);
  return out + html.slice(pos);
}
const TEASER = { // blog teaser on the home page: one text per segment + one featured text
  featured: 'art-7',
  picks: [
    { id: 'art-2', img: 'woman-portrait', cutout: true, w: 800, h: 893, pos: '50% 6%', alt: SEGS[0].heroImage.alt },
    { id: 'art-6', img: 'hero-orhideja', w: 800, h: 450, pos: '14% 50%', alt: segByKey.estetske.heroImage.alt },
    { id: 'art-9', img: 'vertical-protocols', w: 800, h: 800, pos: '50% 42%', alt: segByKey.kozmetika.heroImage.alt },
    { id: 'art-18', img: 'vertical-body', w: 800, h: 533, pos: '50% 50%', alt: 'Staklene bočice sa uljima za masažu, sveće, kamenje i biljni jastučić na drvenom poslužavniku, a u pozadini zamućena žena odmara.' }
  ]
};
function blogTeaser() {
  const R = '', f = byId[TEASER.featured];
  const card = (a, im, i) => `<a class="work work--post rv${im.cutout ? ' work--cutout' : ''}" href="blog/${a.slug}.html" style="--rv-d:${(i * 0.08).toFixed(2)}s">
  ${imgTag({ R, name: im.img, widths: [480, 800, 1200], w: im.w, h: im.h, alt: im.alt, pos: im.pos, cls: 'work__img', lazy: true, sizes: '(min-width:1200px) 365px, (min-width:1024px) 31vw, (min-width:768px) 46vw, 92vw' })}
  <span class="brk" aria-hidden="true"></span>
  <span class="work__arrow" aria-hidden="true">${icon('arrow-ur')}</span>
  <span class="work__meta"><span class="work__tags"><span class="chip chip--photo">${esc(segLabel(a.segmentId))}</span></span><span class="work__title">${brk(a.title)}</span></span>
</a>`;
  const feature = `<a class="work work--post work--feature rv" href="blog/${f.slug}.html">
  <span class="brk brk--gold" aria-hidden="true"></span>
  <span class="work__arrow" aria-hidden="true">${icon('arrow-ur')}</span>
  <span class="work__meta"><span class="work__tags"><span class="chip chip--ink">Izdvojeni tekst</span><span class="chip chip--ink">${esc(segLabel(f.segmentId))}</span></span><span class="work__title">${esc(f.title)}</span><span class="work__sum">${esc(f.excerpt)}</span></span>
</a>`;
  return `<div class="tposts" id="posts">
${feature}
${TEASER.picks.map((p, i) => card(byId[p.id], p, i + 1)).join('\n')}
</div>`;
}
function saznajteVise() {
  const R = '';
  return `<section class="sec" id="saznajte-vise" aria-labelledby="learn-title" data-sec="Saznajte više">
  <div class="wrap">
    <header class="sec-head sec-head--row">
      <div>
        <p class="eyebrow">Saznajte više</p>
        <h2 class="h2 h2--long" id="learn-title">Pre nego što zakažete, upoznajte tretmane.</h2>
        <p class="sec-head__intro">Za svaki segment postoji posebna stranica sa stručnim tekstovima i grupama usluga iz cenovnika.</p>
      </div>
    </header>
    <div class="scards">
${SEGS.map((s, i) => segmentCard(s, R).replace('class="scard', `style="--rv-d:${(i * 0.07).toFixed(2)}s" class="scard`)).join('\n')}
    </div>
    ${clineHtml()}
  </div>
</section>`;
}
function offersTeaser(offers) {
  return `<section class="sec" id="posebna-ponuda" aria-labelledby="offers-title" data-sec="Posebna ponuda">
  <div class="wrap">
    <div class="otease">
      <header class="otease__head">
        <p class="eyebrow">${esc(CONTENT.sections.offers.eyebrow)}</p>
        <h2 class="h2" id="offers-title">Paketi za poseban trenutak.</h2>
        <p class="sec-head__intro">${esc(CONTENT.sections.offers.intro)}</p>
        <a class="btn btn--primary otease__btn" href="posebna-ponuda.html">Sve posebne ponude${icon('arrow-r')}</a>
      </header>
      <div class="otease__list" id="offers" data-sig="${OFFERS_VIEW.sig(offers)}">
${OFFERS_VIEW.teaser(offers, { indent: '        ' })}
      </div>
    </div>
    ${clineHtml()}
  </div>
</section>`;
}
/* LOCATIONS: "1 filozofija, 2 lokacije" split. Concept name, address and phones come from content.json (locations[]). */
const LOC_IMG = {
  nb: { name: 'location-novi-beograd', w: 800, h: 800, alt: 'Terapeut masira leđa klijentkinje toplim biljnim jastučićima u svetlom salonu sa zelenim zidom.' },
  bw: { name: 'location-waterfront', w: 800, h: 457, alt: 'Žena zatvorenih očiju meditira u sedećem položaju na krznenom tepihu, okružena upaljenim svećama u toplo osvetljenoj sobi.' }
};
function splitLocations() {
  const R = '';
  const half = (l) => {
    const im = LOC_IMG[l.key], id = `sp-${l.key}`;
    return `      <article class="sp" id="${id}" data-sp="${l.key}" aria-labelledby="${id}-t">
        <div class="sp__media">${imgTag({ R, name: im.name, widths: [480, 800, 1200], w: im.w, h: im.h, alt: im.alt, lazy: true, sizes: '(min-width:1360px) 680px, (min-width:768px) 50vw, 100vw' })}</div>
        <div class="sp__body">
          <p class="sp__eyebrow"><span class="dot" aria-hidden="true"></span>${esc(l.eyebrow)}</p>
          <h3 class="sp__name" id="${id}-t"><button type="button" aria-expanded="true" aria-controls="${id}-more">${esc(l.concept)}</button></h3>
          <p class="sp__area">${esc(l.area)}</p>
          <div class="sp__more" id="${id}-more">
            <p class="sp__addr">${esc(l.address)}</p>
            <div class="sp__actions">
              <a class="btn btn--glass" href="${l.phone.telHref}">${icon('phone')}Pozovi</a>
              <a class="btn btn--glass" href="${l.phone.whatsappHref}" target="_blank" rel="noopener">${icon('chat')}WhatsApp</a>
            </div>
            <p class="sp__phone"><a href="${l.phone.telHref}">${esc(l.phone.display)}</a></p>
          </div>
        </div>
      </article>`;
  };
  return `<section class="sec" id="lokacije" aria-labelledby="loc-title" data-sec="Lokacije">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow">${esc(CONTENT.sections.locations.eyebrow)}</p>
      <h2 class="h2" id="loc-title">1 filozofija, 2 lokacije.</h2>
      <p class="sec-head__intro">Isti pristup nezi i lepoti u dva koncepta u Beogradu: ${esc(LOCS[0].concept)} i ${esc(LOCS[1].concept)}.</p>
    </header>
    <div class="split" id="split">
${LOCS.map(half).join('\n')}
    </div>
    <p class="locs__hours"><span class="dot dot--ink" aria-hidden="true"></span>${esc(HOURS)}</p>
  </div>
</section>`;
}
function pageHome(offers) {
  const f = path.join(SITE, 'index.html');
  let h = read(f);
  const o = { R: '', home: true };
  h = replaceRegion(h, 'shell-top', shellTop(o));
  h = replaceRegion(h, 'hero-search', searchField('hero-q', { R: '' }));
  h = replaceRegions(h, 'cline', clineHtml());
  h = replaceRegion(h, 'saznajte-vise', saznajteVise());
  h = replaceRegion(h, 'locations', splitLocations());
  h = replaceRegion(h, 'offers-teaser', offersTeaser(offers));
  h = replaceRegion(h, 'blog-teaser', `<section class="sec" id="blog" aria-labelledby="blog-title" data-sec="Blog">
  <div class="wrap">
    <header class="sec-head sec-head--row">
      <div>
        <p class="eyebrow">${esc(CONTENT.sections.blog.eyebrow)}</p>
        <h2 class="h2 h2--long" id="blog-title">Sve što treba da znate o nezi kože i tela.</h2>
        <p class="sec-head__intro">${esc(CONTENT.sections.blog.intro)}</p>
      </div>
      <a class="btn btn--secondary sec-head__btn" href="blog.html">Svi tekstovi na blogu ›</a>
    </header>
${blogTeaser()}
    ${clineHtml()}
  </div>
</section>`);
  h = replaceRegion(h, 'shell-bottom', shellBottom(o));
  fs.writeFileSync(f, h);
}

/* ------------------------------------------------------------------ assets: content.js, offers.js, images ---------- */
function slimContent() {
  /* what the HOME page script really needs, nothing else. No per-service location, no tags (hidden search vocabulary lives in assets/search-index.js),
     no emoji badge text, no addresses / phones (those are real HTML). Everything is rendered from this file by js/main.js. */
  const pick = (o, keys) => { const r = {}; keys.forEach((k) => { if (o[k] !== undefined) r[k] = o[k]; }); return r; };
  const card = (x) => ({ ...pick(x, ['name', 'description', 'price', 'tagLabel']), cenovnik: { id: x.cenovnik.id, tab: x.cenovnik.tab } });
  const c = {
    verticals: CONTENT.verticals.map((v) => pick(v, ['title', 'summary', 'cenovnikTab', 'cenovnikServiceCount'])),
    favorites: CONTENT.favorites.map(card),
    gifts: CONTENT.gifts.map(card),
    testimonials: CONTENT.testimonials.map((t) => pick(t, ['id', 'quote', 'author', 'tag'])),
    sections: { testimonials: { autoRotateMs: CONTENT.sections.testimonials.autoRotateMs } },
    pricing: {
      tabs: CONTENT.pricing.tabs.map((t) => ({
        ...pick(t, ['id', 'label', 'kind', 'note', 'serviceCount']),
        groups: t.groups.map((g) => ({ ...pick(g, ['title', 'serviceCount']), services: g.services.map((sv) => pick(sv, ['id', 'name', 'description', 'price', 'highlight'])) }))
      }))
    }
  };
  const js = '/* Slim copy of v2/_shared/content/content.json for the home page script (generated by _tools/c/build-pages.mjs; offers live in assets/offers.js, search data in assets/search-index.js). ECHOSYSTEM-MOTHER AGENCY */\nwindow.LSD_CONTENT=' + JSON.stringify(c) + ';\n';
  write('assets/content.js', js);
  return js.length;
}

/* ------------------------------------------------------------------ search index (assets/search-index.js) ---------- */
/* Everything js/search.js needs to answer a query on any page, in compact arrays (loaded lazily, only when somebody searches):
   tabs, price groups (with the lowest EUR price), services (name, description, price, hidden tags), the 4 segments, the 21 articles (full text),
   the offers and the HIDDEN synonym vocabulary (search-synonyms.json: entries + questions, phrases folded). Tags and phrases are never shown. */
const foldS = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, ' ').trim();
const firstEur = (price) => { const m = String(price).match(/(\d{1,3}(?:\.\d{3})*|\d+)(?:[–-]\d[\d.]*)?\s*€/); return m ? +m[1].replace(/\./g, '') : null; };
function searchIndex() {
  const syn = readJSON(path.join(SHARED, 'content/search-synonyms.json'));
  const tabs = CONTENT.pricing.tabs.map((t) => [t.id, t.label]);
  const groups = [], svcs = [];
  CONTENT.pricing.tabs.forEach((t, ti) => t.groups.forEach((g, gi) => {
    const gx = groups.length, eur = g.services.map((s) => firstEur(s.price)).filter((n) => n != null);
    groups.push([`${t.id}:${gi}`, tame(g.title), ti, g.services.length, eur.length ? Math.min(...eur) : null]);
    g.services.forEach((s) => svcs.push([s.id, tame(s.name), s.description || '', gx, s.price, (s.tags || []).map((x) => x.replace(/^#/, '').replace(/-/g, ' ')).join(' ')]));
  }));
  const segs = SEGS.map((s) => [s.id, s.slug, s.name]);
  const arts = ARTICLES.map((a) => {
    const text = a.blocks.filter((b) => !b.flag).map((b) => (b.type === 'ul' || b.type === 'ol') ? b.items.join(' ') : b.text).join(' ').replace(TOKEN, '').replace(/\s+/g, ' ').trim();
    const heads = a.blocks.filter((b) => b.type === 'h2' || b.type === 'h3').map((b) => b.text.replace(TOKEN, '')).join(' | ');
    return [a.id, a.slug, SEGS.findIndex((s) => s.id === a.segmentId), a.title, a.subtitle || '', a.excerpt, a.readMinutes, heads, text];
  });
  const offers = readOffers().map((o) => [o.slug, o.title, o.tag, o.includes, o.price]);
  const mapEntry = (e, isQ) => ({ k: e.id, ...(isQ ? { q: e.question } : {}), p: [...new Set(e.phrases.map(foldS))], s: e.strength[0], g: e.targets.groupIds, v: e.targets.serviceIds, a: e.targets.articleIds, o: e.targets.offerIds });
  const data = { tabs, groups, svcs, segs, arts, offers, syn: [...syn.entries.map((e) => mapEntry(e, false)), ...syn.questions.map((e) => mapEntry(e, true))] };
  const js = '/* Search data for js/search.js (generated by _tools/c/build-pages.mjs from content.json + articles.json + search-synonyms.json + assets/offers.js). Hidden vocabulary: never rendered as tags. ECHOSYSTEM-MOTHER AGENCY */\nwindow.LSD_SEARCH_DATA=' + JSON.stringify(data) + ';\n';
  write('assets/search-index.js', js);
  return js.length;
}
function copyImages() {
  const need = [];
  SEGS.forEach((s) => s.widths.forEach((w) => need.push(`${s.img}-${w}.webp`)));
  need.push('vertical-body-480.webp', 'vertical-body-800.webp', 'vertical-body-1200.webp');
  [...new Set(need)].forEach((f) => {
    const dst = path.join(SITE, 'assets/img', f);
    if (!fs.existsSync(dst)) { fs.copyFileSync(path.join(SHARED, 'img', f), dst); console.log('  copied image', f); }
  });
}

/* ------------------------------------------------------------------ self checks ---------- */
function verifyArticles() {
  let bad = 0;
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  ARTICLES.forEach((a) => {
    const f = read(path.join(SITE, `blog/${a.slug}.html`));
    const m = f.match(/<!--prose-->\n([\s\S]*?)\n<!--\/prose-->/);
    const got = strip(m[1].replace(/<aside class="ednote[\s\S]*?<\/aside>/g, '').replace(/<\/(p|li|h2|h3)>/g, '$&\n')).split('\n').map((x) => x.trim()).filter(Boolean);
    const want = [];
    a.blocks.forEach((b) => { if (b.flag) return; if (b.type === 'ul' || b.type === 'ol') b.items.forEach((i) => want.push(i)); else want.push(b.text); });
    const norm = (t) => t.replace(TOKEN, '[dopuniti: $1]');
    const w = want.map(norm);
    if (got.length !== w.length || got.some((g, i) => g !== w[i])) { bad++; console.error('TEXT MISMATCH', a.id, got.length, w.length, got.find((g, i) => g !== w[i])); }
    const ph = (f.match(/class="ph"/g) || []).length - (a.hasPlaceholders ? 1 : 0); // one marker lives in the review note
    if (ph !== a.placeholders.length) { bad++; console.error('PLACEHOLDER COUNT', a.id, ph, a.placeholders.length); }
  });
  return bad;
}
function scanForbidden() {
  const bad = [];
  /* template names + em dash (also as an HTML or JS escape) + pictographic emoji + "Dr Tamara" must not appear anywhere in the site */
  const re = new RegExp(['lu' + 'mine', 'al' + 'der', 'lu' + 'zia', 'fra' + 'mer', String.fromCharCode(0x2014), '&mdash;', '\\\\' + 'u2014', 'dr\\.? tamar', '[\\u{1F000}-\\u{1FFFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{FE0F}]'].join('|'), 'iu');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    if (!/\.(html|css|js|json|svg)$/.test(e.name)) return;
    const t = read(p); if (re.test(t)) bad.push(path.relative(SITE, p));
  });
  walk(SITE);
  return bad;
}

/* ------------------------------------------------------------------ run ---------- */
console.log('site:', SITE);
if (ARGS.has('--reseed-offers') || !fs.existsSync(path.join(SITE, 'assets/offers.js'))) { write('assets/offers.js', offersSeed()); console.log('  seeded assets/offers.js'); }
const offers = readOffers();
console.log('content.js bytes', slimContent());
console.log('search-index.js bytes', searchIndex());
copyImages();
pageBlog();
ARTICLES.forEach(pageArticle);
SEGS.forEach(pageSegment);
pageOffers(offers);
pageHome(offers);
const bad = verifyArticles();
console.log(`built: blog.html, ${ARTICLES.length} articles, ${SEGS.length} segment pages, posebna-ponuda.html, index.html regions; ${offers.length} offers`);
SEGS.forEach((s) => console.log(`  ${s.slug}: video ${s.hasVideo ? 'ON (' + s.videoFile + ')' : 'not set (poster only)'}`));
const forb = scanForbidden();
if (forb.length) console.warn('WARNING forbidden words / em dash in:', forb.join(', '));
if (bad) { console.error(`${bad} article check(s) FAILED`); process.exit(1); }
console.log('article text check: all 21 identical to the source, placeholder markers match');
