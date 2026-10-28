#!/usr/bin/env node
/* =====================================================================================================================
   build-pages.mjs  ·  preview site B (b-alder)  ·  dependency-free node script (node >= 18)
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   WHAT IT DOES
   Reads the shared texts/content packs and writes the pre-rendered static pages of preview B:
     blog.html                       Blog index: 21 articles grouped by the 4 segments (+ chip bar)
     blog/<slug>.html   x 21         one page per article
     tretmani/<segment-slug>.html x 4  segment pages with the video-ready header
     posebna-ponuda.html             all offers (rendered from js/offers.js, the same function the browser runs)
   and keeps these regions of index.html in sync (between  <!--@@ name -->  and  <!--@@ /name -->  markers):
     sprite       icon sprite              header   skip link + header (nav, both phones, search) + full-screen menu
     learn        "Saznajte vise" cards    blogteaser  blog teaser on the home page
     static       contact block for a page that could not build itself (no JS)       herolocs  the two locations in the hero bar
     footer       footer + mobile action bar + search overlay + call sheet
   and fills every  <div class="cline" data-cline></div>  placeholder of index.html with the contact line (phones + e-mail from the data).
   The header / menu / footer / action bar / overlays are produced by ONE function (shell()) so every page has the identical shell.
   It also writes assets/content.js (slim copy of _shared/content/content.json, same shape the home page reads, without any
   per-service location or hashtag data), assets/search-index.js (data of the site search, js/search.js) and copies the
   media-pack images the pages use into assets/img.

   WHEN TO RUN IT     after ANY change of the shared texts or of the templates below:   node "_tools/b/build-pages.mjs"
   INPUT   _shared/content/{articles,segments,service-links,search-synonyms}.json, content.json, _shared/img/manifest.json
   OUTPUT  only inside b-alder/  (nothing else is ever written)

   WHERE TO CHANGE THINGS (for the next round of client feedback)
     CFG                        switches: placeholders marker, owner notes, hero videos (one line per segment), home picks
     COPY                       the strings this round added or replaced (hero lead, search, locations, closing CTA, footer)
     SEGVIS                     which image and which hero variant (photo / stage / light) a segment uses
     shell()                    header, menu, footer, action bar, search overlay, call sheet (identical on all pages)
     css/pages.css, main.css    all colours and sizes are CSS custom properties; nothing is coloured in this script
   ===================================================================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');                 // .../v2
const SITE = path.join(ROOT, 'b-alder');
const CONTENT = path.join(ROOT, '_shared', 'content');
const IMGSRC = path.join(ROOT, '_shared', 'img');
const rd = (f) => fs.readFileSync(f, 'utf8');
const rj = (f) => JSON.parse(rd(f));

/* ------------------------------------------------------------------------------------------------ switches */
const CFG = {
  baseUrl: 'https://lepa-svaki-dan-predlozi.vercel.app/b/',     // og:url / og:image only (same host as the home page, no canonical tag)
  /* [[dopuniti: ...]] blanks of the Word texts: rendered as a highlighted marker so the owner sees what to fill in.
     Never publish a text that still carries one. */
  ownerNotes: true,                    // quiet "Napomena za pregled" box above articles that have blanks or a copywriter note
  /* HERO VIDEO per segment: segment id -> file under b-alder/ (leave a segment out and it keeps its poster only).
     Real footage replaces these demo loops (see assets/video/README.txt). Phones may get a portrait file: { src, m }. */
  heroVideos: {
    dermatologija: { src: 'assets/video/dermatologija.mp4', m: 'assets/video/dermatologija-m.mp4' },   // m = portrait file for phones (optional)
    estetske: 'assets/video/estetske-procedure.mp4',
    kozmetika: 'assets/video/kozmeticki-tretmani.mp4',
    telo: 'assets/video/telo.mp4',
  },
  /* home blog teaser: one article per segment plus one featured (no popularity data exists, so it is labelled "Izdvajamo") */
  homeFeatured: 'art-7',
  homeBySegment: { dermatologija: 'art-2', estetske: 'art-6', kozmetika: 'art-9', telo: 'art-21' },
  /* the questions offered in the empty state of the search (ids of search-synonyms.json "questions") */
  searchQuestions: ['q-pore', 'q-podocnjaci', 'q-zatezanje-bez-operacije', 'q-tesko-noge', 'q-trudnoca', 'q-priprema-botoks'],
};

/* hero variants by image id: photo = dark veil + light text, stage = lila field with the cut-out portrait, light = bright photo + ink text.
   pos / posD = object-position on phones / from 810 px; cardPos = position inside the portrait-ish cards */
const SEGVIS = {
  'woman-portrait': { kind: 'stage', pos: '50% 8%', posD: '50% 8%', cardPos: '50% 8%' },
  'hero-orhideja': { kind: 'light', pos: '0% 50%', posD: '0% 50%', cardPos: '0% 50%' },
  'vertical-protocols': { kind: 'photo', pos: '52% 42%', posD: '50% 40%', cardPos: '50% 38%' },
  'vertical-laser': { kind: 'photo', pos: '52% 50%', posD: '40% 56%', cardPos: '34% 50%' },
};

/* ------------------------------------------------------------------------------------------------ data */
const ARTS = rj(path.join(CONTENT, 'articles.json'));
const SEGS = rj(path.join(CONTENT, 'segments.json')).segments;
const SL = rj(path.join(CONTENT, 'service-links.json'));
const C = rj(path.join(CONTENT, 'content.json'));
const SYN = rj(path.join(CONTENT, 'search-synonyms.json'));
const IMGM = Object.fromEntries(rj(path.join(IMGSRC, 'manifest.json')).images.map((i) => [i.id, i]));
const artById = Object.fromEntries(ARTS.map((a) => [a.id, a]));
const segById = Object.fromEntries(SEGS.map((s) => [s.id, s]));
const slById = Object.fromEntries(SL.articles.map((a) => [a.articleId, a]));
const segOfArt = (a) => segById[a.segmentId];
const segHref = (s, up) => `${up}tretmani/${s.slug}.html`;
const artHref = (a, up) => `${up}blog/${a.slug}.html`;
const groupMeta = {};                                                        // "tab:index" -> {title, tabLabel, count}
for (const t of C.pricing.tabs) t.groups.forEach((g, i) => { groupMeta[`${t.id}:${i}`] = { title: g.title, tabId: t.id, tabLabel: t.label, count: g.services.length }; });
const PHONES = C.contact.phones;
const WA = C.contact.primaryWhatsappHref;
const EMAIL = C.contact.email;
const EMAIL_HREF = C.contact.emailHref;
const IG = (C.contact.social.find((x) => /instagram/i.test(x.label)) || {}).href;
const IG_HANDLE = '@' + (IG || '').replace(/\/+$/, '').split('/').pop();
const LOCS = C.locations;                                                    // the two concepts (Lokacije section, contact labels)
const HOURS = C.contact.hours.display;                                       // "Pon-Sub, 9-21h"
const locOfPhone = (p) => LOCS.find((l) => l.key === p.location);

/* strings this round added or replaced (client feedback). Everything else comes from the content pack unchanged. */
const COPY = {
  heroLead: C.hero.claim,                                                   // "2 lokacije, 1 filozofija"
  heroSub: C.hero.sub,                                                      // "Spoj moderne medicine i estetike ..." (also the footer description)
  searchHero: 'Pretražite, npr. „kako smanjiti obim“',
  priceSearch: 'Pretražite cenovnik, npr. „celulit“',
  searchPh: 'Pretražite tretmane i tekstove, npr. „ožiljci od akni“',
  searchPhShort: 'Šta vas zanima?',
  locations: {
    eyebrow: 'Lokacije',
    title: 'Jedna filozofija, dve lokacije.',
    lead: 'Dva prostora, ista filozofija. Tačnu lokaciju i slobodan termin dogovaramo prilikom zakazivanja.',
    hintHover: 'Pređite mišem preko slike i uđite u svaki prostor pre nego što dođete.',
    hintTouch: 'Prevucite ili dodirnite sliku da vidite obe lokacije.',
  },
  cta: { eyebrow: 'Zakažite konsultaciju', headline: 'Vaše uživanje i briga o lepoti počinju ovde.', body: 'Zakažite svoj termin.' },
};

/* ------------------------------------------------------------------------------------------------ helpers */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
const nTekst = (n) => `${n} ${plural(n, 'tekst', 'teksta', 'tekstova')}`;
const nUsluga = (n) => `${n} ${plural(n, 'usluga', 'usluge', 'usluga')}`;
const minRead = (a) => `${a.readMinutes} min čitanja`;
const fold = (s) => s.toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '');
const slugify = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'odeljak';
/* the pack's excerpt is cut at 170 characters without an ellipsis: show one when the first paragraph was really cut */
const excerptOf = (a) => { const p = (a.blocks.find((b) => b.type === 'p') || {}).text || ''; return a.excerpt.trim() === p.trim() ? a.excerpt : a.excerpt.replace(/[\s,;:.\-]+$/, '') + '…'; };
const wbr = (s) => esc(s).replace(/\//g, '/<wbr>');                          // lets "Dermatoloski/pregled" break on a phone
const ico = (id, cls) => `<svg class="ico${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const groupHref = (gid, up) => `${up}index.html?grupa=${gid}#usluge`;
const tel = (p) => p.telHref;
/* atomic writes (temp file + rename): the dev server or a browser never sees a half-written page */
const atomic = (f, content) => { const t = f + '.tmp'; fs.writeFileSync(t, content); fs.renameSync(t, f); };
const written = [];
const writeFile = (rel, content) => { const f = path.join(SITE, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); atomic(f, content); written.push(rel); };
const usedImgs = new Set();

/* images from the media pack: srcset of every variant, explicit width/height of the largest, optional position */
function img(id, { up = '', sizes = '100vw', alt = '', lazy = true, cls = '', pos = '' } = {}) {
  const m = IMGM[id]; if (!m) throw new Error('image not in media pack: ' + id);
  usedImgs.add(id);
  const vs = m.variants, src = vs[Math.min(1, vs.length - 1)], big = vs[vs.length - 1];
  const srcset = vs.map((v) => `${up}assets/img/${v.file} ${v.w}w`).join(', ');
  return `<img src="${up}assets/img/${src.file}" srcset="${srcset}" sizes="${sizes}" width="${big.w}" height="${big.h}" alt="${esc(alt)}"` +
    `${cls ? ` class="${cls}"` : ''}${pos ? ` style="object-position:${pos}"` : ''}${lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`;
}

/* ------------------------------------------------------------------------------------------------ article text -> HTML */
function hrefForTarget(t, up) {
  if (!t) return null;
  if (t.type === 'article' && artById[t.id]) return { href: artHref(artById[t.id], up) };
  if (t.type === 'segment' && segById[t.id]) return { href: segHref(segById[t.id], up) };
  if (t.type === 'pricelist') return { href: t.id === 'all' ? `${up}index.html#usluge` : groupMeta[t.id] ? groupHref(t.id, up) : null };
  return null;                                                                // none / external: no link in the body copy
}
const plainInline = (s) => esc(s).replace(/\[\[dopuniti: ([^\]]+)\]\]/g, (m, k) => `<mark class="ph">[dopuniti: ${k}]</mark>`);
function inline(text, links = []) {
  const ranges = [];
  const taken = (s, e) => ranges.some((r) => s < r.e && e > r.s);
  for (const l of links) {
    if (!l.href || !l.text) continue;
    let from = 0, idx;
    while ((idx = text.indexOf(l.text, from)) !== -1) {
      if (!taken(idx, idx + l.text.length)) { ranges.push({ s: idx, e: idx + l.text.length, href: l.href }); break; }
      from = idx + 1;
    }
  }
  ranges.sort((a, b) => a.s - b.s);
  let out = '', pos = 0;
  for (const r of ranges) {
    out += plainInline(text.slice(pos, r.s)) + `<a href="${esc(r.href)}">${plainInline(text.slice(r.s, r.e))}</a>`;
    pos = r.e;
  }
  return out + plainInline(text.slice(pos));
}
/* links for one block: the copywriter's Word hyperlinks (target mapped by the pack) plus her "confident" Word comments */
function blockLinks(art, bi, up, item) {
  const b = art.blocks[bi], out = [];
  for (const l of b.links || []) {
    if (item != null && l.item !== item) continue;
    const r = hrefForTarget(l.target, up); if (!r) continue;
    if (l.target.type === 'article' && l.target.id === art.id) continue;
    out.push({ text: l.text, href: r.href });
  }
  for (const h of art.crossLinkHints || []) {
    if (h.resolution !== 'confident' || h.blockIndex !== bi) continue;
    const aid = (h.targetArticleIds || []).find((x) => x !== art.id), sid = (h.targetSegmentIds || [])[0];
    const href = aid ? artHref(artById[aid], up) : sid ? segHref(segById[sid], up) : null;
    if (!href || (!aid && (h.targetArticleIds || []).includes(art.id))) continue;
    if (item != null) { const it = b.items?.[item] || ''; if (!it.includes(h.anchorText)) continue; if (b.items.findIndex((x) => x.includes(h.anchorText)) !== item) continue; }
    out.push({ text: h.anchorText, href });
  }
  return out;
}
function renderBody(art, up) {
  const used = new Set(), toc = [], notes = [];
  let html = '';
  art.blocks.forEach((b, bi) => {
    if (b.flag) { notes.push({ kind: 'source', text: b.text }); return; }     // a copywriter's note, not article copy: shown in the owner note only
    if (b.type === 'h2' || b.type === 'h3') {
      let id = slugify(b.text), n = 2; const base = id; while (used.has(id)) id = `${base}-${n++}`; used.add(id);
      if (b.type === 'h2') toc.push({ id, text: b.text });
      html += `<${b.type} id="${id}">${inline(b.text)}</${b.type}>`;
    } else if (b.type === 'p') {
      html += `<p${bi === 0 ? ' class="lead-p"' : ''}>${inline(b.text, blockLinks(art, bi, up))}</p>`;
    } else if (b.type === 'ul' || b.type === 'ol') {
      html += `<${b.type}>` + b.items.map((t, ii) => `<li>${inline(t, blockLinks(art, bi, up, ii))}</li>`).join('') + `</${b.type}>`;
    }
  });
  return { html, toc, notes };
}

/* ------------------------------------------------------------------------------------------------ contact (all from the data, never typed twice) */
/* one compact quiet line: both phones and the e-mail. Used at the end of every main content section / page. */
const clineHtml = () => `<div class="cline" data-cline role="group" aria-label="Kontakt">` +
  PHONES.map((p) => `<a href="${esc(tel(p))}">${ico('phone')}<span>${esc(p.display)}</span></a>`).join('') +
  `<a href="${esc(EMAIL_HREF)}">${ico('mail')}<span>${esc(EMAIL)}</span></a></div>`;
/* rows of the closing contact block: calls, WhatsApp, e-mail, Instagram (two columns on wide screens, filled column by column) */
function contactRows() {
  const rows = [];
  PHONES.forEach((p) => rows.push(`<li><a href="${esc(tel(p))}"><span>Poziv</span><b>${esc(p.display)}</b></a></li>`));
  rows.push(`<li><a href="${esc(EMAIL_HREF)}"><span>E-pošta</span><b>${esc(EMAIL)}</b></a></li>`);
  PHONES.forEach((p) => rows.push(`<li><a href="${esc(p.whatsappHref)}" target="_blank" rel="noopener"><span>WhatsApp</span><b>${esc(p.display)}</b></a></li>`));
  if (IG) rows.push(`<li><a href="${esc(IG)}" target="_blank" rel="noopener"><span>Instagram</span><b>${esc(IG_HANDLE)}</b></a></li>`);
  return rows.join('');
}

/* ------------------------------------------------------------------------------------------------ shared cards */
function acard(a, up, { showSeg = true } = {}) {
  const s = segOfArt(a);
  return `<article class="acard" data-reveal style="--y:24px"><p class="acard__meta">${showSeg ? `<span class="pill">${esc(s.name)}</span>` : ''}<span>${minRead(a)}</span></p>` +
    `<h3 class="acard__t"><a class="acard__a" href="${artHref(a, up)}">${wbr(a.title)}</a></h3>` +
    `<p class="acard__ex">${inline(excerptOf(a))}</p>` +
    `<span class="acard__go" aria-hidden="true"><span>Pročitaj</span><i class="acard__ic">${ico('arrow')}</i></span></article>`;
}
const priceRow = (gid, up, role) => {
  const g = groupMeta[gid]; if (!g) return '';
  return `<li><a class="prow2" href="${groupHref(gid, up)}"><span class="prow2__n">${esc(g.title)}<small>${esc(g.tabLabel)} · ${nUsluga(g.count)}</small>` +
    `${role ? `<i class="pill prow2__r">${role}</i>` : ''}</span><span class="prow2__go" aria-hidden="true">${ico('arrow')}</span></a></li>`;
};

/* closing contact block used at the end of every sub page: text, WhatsApp, call sheet, then every way to reach us */
function ctaBlock(up, key = 'blog') {
  const c = C.cta[key];
  return `<section class="psec cta cta--solo" id="zakazi" aria-labelledby="cta-h" data-rv-name="Kontakt"><div class="wrap"><div class="cta__card"><div class="cta__glow" aria-hidden="true"></div>` +
    `<div class="cta__txt"><img class="cta__logo" src="${up}assets/logo/logo-block-lila-white-brackets.svg" alt="Beauty Concept, Lepa Svaki Dan" width="245" height="174" loading="lazy">` +
    `<p class="eyebrow eyebrow--ink">${esc(c.eyebrow)}</p><h2 class="h-lg" id="cta-h">${esc(c.headline.replace(/\n/g, ' '))}</h2><p class="cta__body">${esc(c.body)}</p>` +
    `<div class="cta__btns"><a class="btn btn--ink" href="${WA}" target="_blank" rel="noopener">${ico('wa')}Piši na WhatsApp</a>` +
    `<a class="btn btn--ghost-ink" href="${tel(PHONES[0])}" data-sheet="call">${ico('phone')}Pozovi</a></div></div>` +
    `<ul class="cta__contacts">${contactRows()}</ul></div></div></section>`;
}

/* ------------------------------------------------------------------------------------------------ the shared shell */
const SPRITE = (() => {
  const m = rd(path.join(SITE, 'index.html')).match(/<!--@@ sprite -->\s*([\s\S]*?)\s*<!--@@ \/sprite -->/);
  if (!m) throw new Error('index.html is missing the <!--@@ sprite --> region');
  return m[1].replace(/^<!-- icon sprite -->\s*/, '');
})();
function navHref(label, home, up) {
  const l = C.nav.links.find((x) => x.label === label);
  const raw = home ? l.hrefOnHome : l.hrefFromSubpage;
  return raw.startsWith('#') ? raw : up + raw;
}
/* the two numbers belong to the two concepts; the label is only used in the call sheet, the header shows the bare numbers */
const phoneSheet = (kind) => PHONES.map((p) => {
  const l = locOfPhone(p);
  const href = kind === 'call' ? tel(p) : p.whatsappHref, ext = kind === 'call' ? '' : ' target="_blank" rel="noopener"';
  return `<a class="btn btn--block csheet__b" href="${esc(href)}"${ext}>${ico(kind === 'call' ? 'phone' : 'wa')}<span>${kind === 'call' ? 'Pozovi' : 'WhatsApp'} <b>${esc(p.display)}</b>${l ? `<small>${esc(l.concept)}, ${esc(l.area)}</small>` : ''}</span></a>`;
}).join('\n      ');

function shell({ home = false, up = '', current = '' }) {
  const links = C.nav.links.map((l) => ({ label: l.label, href: navHref(l.label, home, up) }));
  const cur = { Tretmani: 'tretmani', 'Posebna ponuda': 'ponuda', Blog: 'blog' };
  const li = () => links.map((l) => `<li><a href="${l.href}"${cur[l.label] && cur[l.label] === current ? ' aria-current="page"' : ''}>${l.label}</a></li>`).join('');
  const header =
`<a class="skip" href="#main">Preskoči na sadržaj</a>

<!-- NAV -->
<header class="nav" id="top" data-rv-name="Zaglavlje">
  <nav class="nav__pill" aria-label="Glavna navigacija">
    <a class="nav__logo" href="${home ? '#top' : up + 'index.html'}" aria-label="Lepa Svaki Dan, ${home ? 'početak stranice' : 'početna stranica'}"><img src="${up}assets/logo/logo-horizontal-white.svg" alt="Beauty Concept, Lepa Svaki Dan" width="256" height="74"></a>
    <ul class="nav__links">
      ${li()}
    </ul>
    <div class="nav__tel" role="group" aria-label="Telefoni">${PHONES.map((p) => `<a href="${esc(tel(p))}">${esc(p.display)}</a>`).join('')}</div>
    <button class="nav__s" type="button" data-search-open aria-haspopup="dialog" aria-label="Pretraga">${ico('search')}</button>
    <a class="btn btn--sm nav__cta" href="${WA}" target="_blank" rel="noopener">Zakaži ${ico('arrow')}</a>
    <button class="burger" type="button" aria-label="Meni" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
  </nav>
</header>

<!-- MOBILE MENU -->
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Meni">
  <div class="menu__top">
    <img src="${up}assets/logo/logo-horizontal-white.svg" alt="Beauty Concept, Lepa Svaki Dan" width="256" height="74">
    <button class="burger is-x" type="button" aria-label="Zatvori meni" data-menu-close><span></span><span></span></button>
  </div>
  <ul class="menu__links">
    ${li()}
  </ul>
  <div class="menu__acts">
    <a class="btn btn--block menu__cta" href="${WA}" target="_blank" rel="noopener"><span>Zakaži termin ›</span></a>
    ${PHONES.map((p) => `<a class="btn btn--ghost btn--block" href="${tel(p)}">${ico('phone')}<span>Pozovi <b>${esc(p.display)}</b></span></a>`).join('\n    ')}
    <a class="btn btn--ghost btn--block" href="${WA}" target="_blank" rel="noopener">${ico('wa')}<span>WhatsApp</span></a>
  </div>
  <img class="menu__mark" src="${up}assets/logo/lsd-line-white.svg" alt="" width="259" height="26">
</div>`;

  const f = C.footer.columns;
  const explore = [...SEGS.map((s) => [s.name, segHref(s, up)]), ['Posebna ponuda', `${up}posebna-ponuda.html`], ['Blog', `${up}blog.html`]];
  /* footer contact: both numbers as calls, WhatsApp, e-mail (the pack had the numbers as WhatsApp links only) */
  const footContact = PHONES.map((p) => `<li><a href="${esc(tel(p))}">${esc(p.display)}</a></li>`).join('') +
    `<li><a href="${esc(WA)}" target="_blank" rel="noopener">WhatsApp</a></li><li><a href="${esc(EMAIL_HREF)}">${esc(EMAIL)}</a></li>`;
  const footer =
`<!-- FOOTER -->
<footer class="foot" id="footer" data-rv-name="Podnožje">
  <img class="swash swash--foot" src="${up}assets/graphics/swash.svg" alt="" width="961" height="794" loading="lazy" decoding="async" aria-hidden="true">
  <div class="wrap">
    <div class="foot__top">
      <div class="foot__brand">
        <img src="${up}assets/logo/lsd-line-white.svg" alt="Lepa Svaki Dan" width="259" height="26">
        <p>${esc(COPY.heroSub)}</p>
        <a class="btn" href="${WA}" target="_blank" rel="noopener">Zakaži termin ›</a>
      </div>
      <div class="foot__cols">
        <div class="foot__col"><h3>${esc(f.contact.heading)}</h3><ul>${footContact}</ul></div>
        <div class="foot__col"><h3>${esc(f.social.heading)}</h3><ul>${f.social.links.map((x) => (x.href && x.href !== '#' ? `<li><a href="${esc(x.href)}" target="_blank" rel="noopener">${esc(x.label)}</a></li>` : `<li><span class="off">${esc(x.label)}</span></li>`)).join('')}</ul></div>
        <div class="foot__col"><h3>${esc(f.locations.heading)}</h3><ul>${f.locations.items.map((x) => `<li><span><span><b>${esc(x.concept)}</b><small>${esc(x.address)}</small></span></span></li>`).join('')}</ul></div>
        <div class="foot__col"><h3>Istražite</h3><ul>${explore.map(([t, h]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul></div>
      </div>
    </div>
    <div class="foot__mark">
      <img src="${up}assets/logo/logo-horizontal-white.svg" width="256" height="74" alt="Beauty Concept, Lepa Svaki Dan" loading="lazy" decoding="async">
    </div>
    <div class="foot__legal">
      <p>${esc(C.footer.copyright.template).replace('{year}', '<span data-year>2026</span>')}</p>
      <p class="foot__credit">${esc(C.footer.credit)}</p>
      <a class="foot__top-link" href="#top">${esc(C.footer.backToTopAria)}</a>
    </div>
  </div>
</footer>

<!-- MOBILE ACTION BAR: Pozovi and WhatsApp open a sheet with both numbers (the href is the no-JS fallback) -->
<div class="bar" id="bar" role="region" aria-label="Brze akcije">
  <a class="bar__a" href="${tel(PHONES[0])}" data-sheet="call">${ico('phone')}<span>Pozovi</span></a>
  <a class="bar__a" href="${WA}" target="_blank" rel="noopener" data-sheet="wa">${ico('wa')}<span>WhatsApp</span></a>
  <a class="bar__a bar__a--p" href="#zakazi"><span>Zakaži</span>${ico('arrow')}</a>
</div>

<!-- CALL / WHATSAPP SHEET -->
<div class="csheet" id="csheet" role="dialog" aria-modal="true" aria-labelledby="csheet-h">
  <div class="csheet__bd" data-sheet-close></div>
  <div class="csheet__p">
    <p class="csheet__t" id="csheet-h" data-sheet-title>Pozovite nas</p>
    <div class="csheet__l" data-kind="call">
      ${phoneSheet('call')}
    </div>
    <div class="csheet__l" data-kind="wa" hidden>
      ${phoneSheet('wa')}
    </div>
    <button class="btn btn--ghost btn--block csheet__x" type="button" data-sheet-close><span>Zatvori</span></button>
  </div>
</div>

<!-- SEARCH OVERLAY (js/search.js, data in assets/search-index.js) -->
<div class="sov" id="search" role="dialog" aria-modal="true" aria-label="Pretraga tretmana i tekstova">
  <div class="sov__bd" data-search-close></div>
  <div class="sov__p">
    <form class="sov__f" role="search" id="sform" autocomplete="off">
      <button class="sov__back" type="button" data-search-close aria-label="Zatvori pretragu">${ico('back')}</button>
      ${ico('search').replace('class="ico"', 'class="ico sov__ico"')}
      <input id="sq" type="search" name="q" placeholder="${esc(COPY.searchPhShort)}" data-ph-short="${esc(COPY.searchPhShort)}" data-ph-long="${esc(COPY.searchPh)}" aria-label="Pretraga tretmana i tekstova" aria-controls="sres" enterkeyhint="search" autocapitalize="off" autocorrect="off" spellcheck="false">
      <button class="sov__clear" id="sclear" type="button" aria-label="Obriši pretragu" hidden>${ico('close')}</button>
      <button class="sov__x" type="button" data-search-close aria-label="Zatvori pretragu"><span>Zatvori</span></button>
    </form>
    <p class="sov__live" id="slive" role="status" aria-live="polite"></p>
    <div class="sov__res" id="sres" tabindex="-1"></div>
  </div>
</div>`;
  return { header, footer };
}

/* ------------------------------------------------------------------------------------------------ page wrapper */
function page({ file, title, description, up = '', current = '', body, kind, preload = '', scripts = [], rv = '' }) {
  const { header, footer } = shell({ up, current });
  const url = CFG.baseUrl + file;
  const html =
`<!doctype html>
<html lang="sr" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#FFFFFF">
<meta name="color-scheme" content="light">
<link rel="icon" href="${up}favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="${up}apple-touch-icon.png">

<meta property="og:type" content="${kind === 'article' ? 'article' : 'website'}">
<meta property="og:locale" content="sr_RS">
<meta property="og:site_name" content="Lepa Svaki Dan">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${CFG.baseUrl}assets/img/og-1200x630.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${CFG.baseUrl}assets/img/og-1200x630.jpg">

<link rel="preload" href="${up}assets/fonts/GalanoGrotesqueRegular.woff2" as="font" type="font/woff2" crossorigin>
${preload}<link rel="stylesheet" href="${up}assets/brand/brand.css">
<link rel="stylesheet" href="${up}css/main.css">
<link rel="stylesheet" href="${up}css/pages.css">
<script>
(function(d){d.classList.remove('no-js');d.classList.add('js','no-wipe');
/* safety net: if pages.js has not finished within 3.5 s nothing may stay invisible */
setTimeout(function(){if(!d.classList.contains('ready'))d.classList.add('reveal-fallback')},3500)})(document.documentElement);
</script>
</head>
<body class="page page--${kind}" data-rv="${esc(rv)}">

${SPRITE}

${header}

<main id="main">
${body}
</main>

${footer}

${[...scripts, 'js/search.js', 'js/review.js'].map((s) => `<script src="${up}${s}" defer></script>`).join('\n')}
</body>
</html>
`;
  writeFile(file, html);
}

/* ------------------------------------------------------------------------------------------------ BLOG index */
function buildBlog() {
  const b = C.sections.blog, pg = C.site.pages.blog;
  const chips = SEGS.map((s) => `<li><a class="segchip" href="#${s.id}">${esc(s.name)}<small>${s.articleIds.length}</small></a></li>`).join('');
  const secs = SEGS.map((s, i) => {
    const arts = s.articleIds.map((id) => artById[id]);
    return `<section class="bseg" id="${s.id}" data-seg aria-labelledby="${s.id}-h">
  <header class="bseg__head" data-reveal>
    <span class="bseg__no" aria-hidden="true">${i + 1}</span>
    <div class="bseg__t"><h2 class="h-md" id="${s.id}-h">${esc(s.name)}</h2><p class="bseg__intro">${esc(s.intro.text)}</p></div>
    <a class="link bseg__more" href="tretmani/${s.slug}.html">Sve o oblasti ${esc(s.name)} ›</a>
  </header>
  <ul class="agrid">${arts.map((a) => `<li>${acard(a, '')}</li>`).join('')}</ul>
</section>`;
  }).join('\n');
  const body = `<header class="phead" aria-labelledby="blog-h">
  <div class="wrap phead__in">
    <p class="eyebrow">${esc(b.eyebrow)}</p>
    <h1 class="h-lg" id="blog-h">${stripEm(b.titleHtml)}</h1>
    <p class="lead">${esc(b.intro)}</p>
    <p class="phead__meta">${nTekst(ARTS.length)} u ${SEGS.length} oblasti</p>
  </div>
</header>
<nav class="chipbar" data-chipbar aria-label="Oblasti bloga"><div class="wrap"><ul class="chipbar__in">${chips}</ul></div></nav>
<div class="wrap blog-index">
${secs}
</div>
<div class="wrap">${clineHtml()}</div>
${ctaBlock('', 'blog')}`;
  page({ file: 'blog.html', title: pg.title, description: pg.description, current: 'blog', kind: 'blog', rv: 'blog', body, scripts: ['js/motion.js', 'js/shell.js', 'js/pages.js'] });
}
/* headings are one colour: the pack's <em> accents are dropped from every title this script writes itself */
function stripEm(html) { return String(html).replace(/<\/?em>/g, ''); }

/* ------------------------------------------------------------------------------------------------ related articles */
function relatedFor(art) {
  const me = new Map((slById[art.id].groups || []).map((g) => [g.groupId, g.role === 'primary' ? 2 : 1]));
  const seg = segOfArt(art), i = seg.articleIds.indexOf(art.id);
  const adj = new Set([seg.articleIds[i - 1], seg.articleIds[i + 1]]);
  const linked = new Set();
  art.blocks.forEach((b) => (b.links || []).forEach((l) => l.target?.type === 'article' && linked.add(l.target.id)));
  (art.crossLinkHints || []).forEach((h) => h.resolution === 'confident' && (h.targetArticleIds || []).forEach((x) => linked.add(x)));
  return ARTS.filter((a) => a.id !== art.id && !adj.has(a.id))
    .map((a) => {
      let s = 0;
      for (const g of slById[a.id].groups || []) if (me.has(g.groupId)) s += me.get(g.groupId) * (g.role === 'primary' ? 2 : 1);
      if (a.segmentId === art.segmentId) s += 0.5;
      if (linked.has(a.id)) s += 3;
      if ((artById[a.id].blocks || []).some((b) => (b.links || []).some((l) => l.target?.id === art.id))) s += 2;
      return { a, s };
    })
    .sort((x, y) => y.s - x.s || ARTS.indexOf(x.a) - ARTS.indexOf(y.a)).slice(0, 3).map((x) => x.a);
}

/* ------------------------------------------------------------------------------------------------ ARTICLE pages */
function buildArticle(art) {
  const up = '../', seg = segOfArt(art), sl = slById[art.id];
  const { html, toc, notes } = renderBody(art, up);
  const i = seg.articleIds.indexOf(art.id);
  const prev = i > 0 ? artById[seg.articleIds[i - 1]] : null, next = i < seg.articleIds.length - 1 ? artById[seg.articleIds[i + 1]] : null;
  const rel = relatedFor(art);

  const kinds = [...new Set(art.placeholders.map((p) => p.kind))];
  const noteItems = [];
  if (art.placeholders.length) noteItems.push(`Tekst ima ${art.placeholders.length} ${plural(art.placeholders.length, 'mesto', 'mesta', 'mesta')} za dopunu (${kinds.map(esc).join(', ')}). Označena su ovako: <mark class="ph">[dopuniti: ...]</mark>.`);
  notes.filter((n) => n.kind === 'source').forEach((n) => noteItems.push(`U Word dokumentu stoji beleška: „${esc(n.text)}“. To nije deo teksta i ovde se ne prikazuje u tekstu; pre objave treba proveriti prava na tekst.`));
  const ed = CFG.ownerNotes && noteItems.length
    ? `<aside class="ednote" role="note" aria-label="Napomena za pregled"><p class="ednote__t">Napomena za pregled</p><ul>${noteItems.map((x) => `<li>${x}</li>`).join('')}</ul></aside>` : '';

  const tocHtml = toc.length >= 4
    ? `<details class="toc"><summary>Sadržaj teksta<small>${toc.length}</small></summary><ol>${toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></details>` : '';

  const prim = (sl.groups || []).filter((g) => g.role === 'primary'), relg = (sl.groups || []).filter((g) => g.role !== 'primary');
  const inprice = `<aside class="inprice" aria-labelledby="ip-h" data-rv-name="U cenovniku">
  <p class="eyebrow">Cenovnik</p>
  <h2 class="inprice__h" id="ip-h">U cenovniku</h2>
  <p class="inprice__p">Otvorite grupu u cenovniku i pogledajte usluge i cene.</p>
  <ul class="prow2s">${prim.map((g) => priceRow(g.groupId, up, 'Ovaj tretman')).join('')}${relg.map((g) => priceRow(g.groupId, up, '')).join('')}</ul>
</aside>`;

  const pager = `<nav class="pager" aria-label="Tekstovi u oblasti ${esc(seg.name)}">` +
    (prev ? `<a class="pager__a pager__a--prev" href="${artHref(prev, up)}" rel="prev"><span class="pager__l">${ico('arrow')}Prethodni tekst</span><span class="pager__t">${wbr(prev.title)}</span></a>` : '<span class="pager__sp"></span>') +
    (next ? `<a class="pager__a pager__a--next" href="${artHref(next, up)}" rel="next"><span class="pager__l">Sledeći tekst${ico('arrow')}</span><span class="pager__t">${wbr(next.title)}</span></a>` : '<span class="pager__sp"></span>') + `</nav>`;

  const body = `<header class="ahead">
  <div class="wrap"><div class="ahead__col">
    <nav class="crumbs" aria-label="Putanja"><ol><li><a href="${up}blog.html">Blog</a></li><li><a href="${up}blog.html#${seg.id}">${esc(seg.name)}</a></li></ol></nav>
    <div class="ahead__in">
      <a class="pill ahead__seg" href="${segHref(seg, up)}">${esc(seg.name)}</a>
      <div class="ahead__t">
        <h1 class="h-art">${wbr(art.title)}</h1>
        ${art.subtitle ? `<p class="ahead__sub">${inline(art.subtitle)}</p>` : ''}
        <p class="ahead__meta"><span>${minRead(art)}</span></p>
      </div>
    </div>
  </div></div>
</header>
<div class="wrap art">
  <article class="art__main" data-rv-name="Tekst">
    ${ed}${tocHtml}
    <div class="prose">${html}</div>
    ${clineHtml()}
  </article>
  <div class="art__side">${inprice}</div>
</div>
<div class="wrap pager-wrap">${pager}</div>
<section class="psec related" aria-labelledby="rel-h">
  <div class="wrap">
    <header class="head" data-reveal><p class="eyebrow">Blog</p><h2 class="h-md" id="rel-h">Povezani tekstovi</h2></header>
    <ul class="agrid agrid--3">${rel.map((a) => `<li>${acard(a, up)}</li>`).join('')}</ul>
  </div>
</section>
${ctaBlock(up, 'blog')}`;
  const desc = excerptOf(art).replace(/\[\[dopuniti: [^\]]+\]\]/g, '').trim();
  page({ file: `blog/${art.slug}.html`, title: `${art.title} | Blog | Lepa Svaki Dan`, description: desc, up, current: 'blog', kind: 'article', rv: 'tekst' + art.id.replace(/\D/g, ''), body, scripts: ['js/motion.js', 'js/shell.js', 'js/pages.js'] });
}

/* ------------------------------------------------------------------------------------------------ SEGMENT pages */
function segVis(seg) { const id = seg.heroImage.id; return { id, alt: seg.heroImage.alt, ...(SEGVIS[id] || { kind: 'photo', pos: '50% 50%', posD: '50% 50%', cardPos: '50% 50%' }) }; }
const SEG_RV = { dermatologija: 'dermatologija', estetske: 'estetske', kozmetika: 'kozmetika', telo: 'telo' };
function buildSegment(seg, idx) {
  const up = '../', v = segVis(seg), arts = seg.articleIds.map((id) => artById[id]);
  const vid = CFG.heroVideos[seg.id]; const vSrc = typeof vid === 'string' ? vid : vid?.src, vM = typeof vid === 'object' ? vid.m : null;
  if (vSrc && !fs.existsSync(path.join(SITE, vSrc))) console.warn('  ! hero video missing on disk:', vSrc);
  const prim = seg.priceList.groups.filter((g) => g.role === 'primary'), relg = seg.priceList.groups.filter((g) => g.role !== 'primary');
  const firstGroup = (prim[0] || relg[0] || {}).groupId;
  const nGroups = seg.priceList.groups.length;
  const m = IMGM[v.id], vs = m.variants;
  const isCut = v.kind === 'stage';
  const heroMedia = isCut
    ? `<div class="shero__media" aria-hidden="true"></div><div class="shero__fig">${img(v.id, { up, sizes: '(min-width:810px) 44vw, 78vw', alt: v.alt, lazy: false })}</div>`
    : `<div class="shero__media">${img(v.id, { up, sizes: '100vw', alt: v.alt, lazy: false })}</div>`;
  const preload = isCut
    ? `<link rel="preload" as="image" fetchpriority="high" imagesrcset="${vs.map((x) => `${up}assets/img/${x.file} ${x.w}w`).join(', ')}" imagesizes="(min-width:810px) 44vw, 78vw">\n`
    : `<link rel="preload" as="image" fetchpriority="high" imagesrcset="${vs.map((x) => `${up}assets/img/${x.file} ${x.w}w`).join(', ')}" imagesizes="100vw">\n`;
  const others = SEGS.filter((s) => s.id !== seg.id);
  const body = `<section class="shero shero--${v.kind}" id="hero" aria-labelledby="seg-h" style="--pos:${v.pos};--pos-d:${v.posD}"${vSrc ? ` data-video="${up}${vSrc}"` : ''}${vM ? ` data-video-m="${up}${vM}"` : ''}>
  ${heroMedia}
  <div class="shero__veil" aria-hidden="true"></div>
  <div class="wrap shero__in">
    <div class="shero__txt bc-brackets">
      <p class="eyebrow" data-reveal="hero" style="--y:12px;--d:.1s">Tretmani</p>
      <h1 class="h-seg" id="seg-h" data-reveal="hero" style="--y:24px;--d:.18s">${esc(seg.name)}</h1>
      <p class="shero__lead" data-reveal="hero" style="--y:18px;--d:.3s">${esc(seg.intro.text)}</p>
      <div class="shero__cta" data-reveal="hero" style="--y:14px;--d:.4s">
        <a class="btn${v.kind === 'photo' ? '' : ' btn--ink'}" href="${WA}" target="_blank" rel="noopener">Zakaži termin ${ico('arrow')}</a>
        ${firstGroup ? `<a class="btn ${v.kind === 'photo' ? 'btn--ghost' : 'btn--ghost-ink'}" href="${groupHref(firstGroup, up)}">Cenovnik</a>` : ''}
      </div>
    </div>
    <ul class="shero__facts" data-reveal="hero" style="--y:10px;--d:.5s"><li class="chip">${nTekst(arts.length)}</li><li class="chip">${nGroups} ${plural(nGroups, 'grupa', 'grupe', 'grupa')} u cenovniku</li></ul>
  </div>
</section>
<section class="psec" aria-labelledby="txt-h">
  <div class="wrap">
    <header class="head head--split" data-reveal>
      <p class="eyebrow">Tekstovi</p>
      <h2 class="h-md" id="txt-h">Tekstovi o oblasti ${esc(seg.name)}</h2>
      <p class="lead">${nTekst(arts.length)} iz naše ponude. <a class="link" href="${up}blog.html#${seg.id}">Svi na blogu ›</a></p>
    </header>
    <ul class="agrid">${arts.map((a) => `<li>${acard(a, up, { showSeg: false })}</li>`).join('')}</ul>
  </div>
</section>
<section class="psec psec--tint" aria-labelledby="cen-h">
  <div class="wrap cen">
    <header class="head" data-reveal>
      <p class="eyebrow">Cenovnik</p>
      <h2 class="h-md" id="cen-h">U cenovniku</h2>
      <p class="lead">Grupe usluga koje se odnose na ovu oblast. Otvaraju se u cenovniku, sa uslugama i cenama.</p>
    </header>
    <div class="cen__lists">
      ${prim.length ? `<div><h3 class="cen__h">Glavne grupe</h3><ul class="prow2s">${prim.map((g) => priceRow(g.groupId, up, '')).join('')}</ul></div>` : ''}
      ${relg.length ? `<div><h3 class="cen__h">Povezano</h3><ul class="prow2s">${relg.map((g) => priceRow(g.groupId, up, '')).join('')}</ul></div>` : ''}
    </div>
  </div>
</section>
<section class="psec" aria-labelledby="oth-h">
  <div class="wrap">
    <header class="head" data-reveal><p class="eyebrow">Saznajte više</p><h2 class="h-md" id="oth-h">Ostale oblasti</h2></header>
    <ul class="segs segs--3">${others.map((s, i) => segCard(s, up, i, SEGS.indexOf(s))).join('')}</ul>
    ${clineHtml()}
  </div>
</section>
${ctaBlock(up, 'blog')}`;
  page({ file: `tretmani/${seg.slug}.html`, title: `${seg.name} | Tretmani | Lepa Svaki Dan`, description: seg.intro.text, up, current: 'tretmani', kind: 'segment', rv: SEG_RV[seg.id] || seg.slug, body, preload, scripts: ['js/motion.js', 'js/shell.js', 'js/pages.js'] });
}

/* a segment card: the dark-plate panel of the home page, on a plain (not glass) photo. Numbers have no leading zero. */
function segCard(seg, up, i, no) {
  const v = segVis(seg), n = seg.articleIds.length;
  const cls = v.kind === 'stage' ? ' panel--stage' : v.kind === 'light' ? ' panel--light' : '';
  const ph = v.kind === 'stage' ? 'photo--stage' : 'photo--grade';
  return `<li data-reveal style="--y:36px;--d:${((i % 4) * 0.08).toFixed(2)}s"><a class="panel segcard is-clear${cls}" href="${segHref(seg, up)}">` +
    `<div class="photo ${ph}" aria-hidden="true">${img(v.id, { up, sizes: '(min-width:1200px) 320px, (min-width:810px) 50vw, 100vw', pos: v.cardPos })}</div>` +
    `<span class="panel__no" aria-hidden="true">${no + 1}</span><span class="panel__badge">${nTekst(n)}</span>` +
    `<div class="plate"><h3>${esc(seg.name)}</h3><p class="panel__sum">${esc(seg.intro.text)}</p>` +
    `<div class="panel__meta"><span>Saznajte više</span><span class="panel__go">${ico('arrow')}</span></div></div></a></li>`;
}

/* ------------------------------------------------------------------------------------------------ POSEBNA PONUDA */
const offersLib = (() => {                              // the SAME file the browser runs: the static markup cannot drift from the live render
  const sandbox = { window: {}, LSD_CONTENT: C };
  sandbox.window = sandbox;
  vm.runInNewContext(rd(path.join(SITE, 'js', 'offers.js')), sandbox);
  return sandbox.LSD;
})();
function buildOffers() {
  const s = C.sections.offers, pg = C.site.pages.offers;
  const icons = ['card', 'euro', 'rata'];
  const notes = C.payment.modal.paragraphs.map((p, i) => `<li class="note" data-reveal style="--d:${(i * 0.08).toFixed(2)}s"><span class="note__ic">${ico(icons[i] || 'card')}</span><p>${p.html}</p></li>`).join('');
  const body = `<header class="phead" aria-labelledby="off-h">
  <div class="wrap phead__in">
    <p class="eyebrow">${esc(s.eyebrow)}</p>
    <h1 class="h-lg" id="off-h">${stripEm(s.titleHtml)}</h1>
    <p class="lead">${esc(s.intro)}</p>
  </div>
</header>
<section class="psec offers offers--page" aria-label="Posebne ponude">
  <div class="wrap">
    <div class="card-dark">
      <div class="card-dark__glow" aria-hidden="true"></div>
      <img class="card-dark__logo" src="assets/logo/logo-full-white.svg" alt="" width="164" height="86" aria-hidden="true">
      <ul class="offers__grid offers__grid--page" id="offers-list">${C.offers.map(offersLib.offerCard).join('')}</ul>
    </div>
  </div>
</section>
<section class="psec" aria-labelledby="pay-h">
  <div class="wrap">
    <ul class="notes notes--3"><li class="notes__t eyebrow" id="pay-h">${esc(C.payment.modal.title)}</li>${notes}</ul>
    ${clineHtml()}
  </div>
</section>
${ctaBlock('', 'offers')}`;
  page({ file: 'posebna-ponuda.html', title: pg.title, description: pg.description, current: 'ponuda', kind: 'offers', rv: 'ponuda', body, scripts: ['assets/content.js', 'js/motion.js', 'js/shell.js', 'js/offers.js', 'js/pages.js'] });
}

/* ------------------------------------------------------------------------------------------------ HOME regions */
function homeRegions() {
  const up = '';
  const learn = `<!-- SAZNAJTE VISE -->
<section class="sec learn" id="saznajte-vise" aria-labelledby="learn-h">
  <div class="wrap">
    <header class="head head--split" data-reveal>
      <p class="eyebrow">Saznajte više</p>
      <h2 class="h-md" id="learn-h">Izaberite oblast i saznajte više o tretmanima.</h2>
      <p class="lead">Stručni tekstovi o tretmanima, procedurama i protokolima iz naše ponude, za svaku oblast posebno.</p>
    </header>
    <ul class="segs">${SEGS.map((s, i) => segCard(s, up, i, i)).join('')}</ul>
    ${clineHtml()}
  </div>
</section>`;

  const blogImg = (a) => { const bi = C.blog[a.legacy.blogIndex]; const id = bi && path.basename(bi.image).replace(/\.\w+$/, ''); return IMGM[id] && IMGM[id].type === 'photo' ? id : 'vertical-face'; };
  const f = artById[CFG.homeFeatured], b = C.sections.blog;
  const picks = SEGS.map((s) => artById[CFG.homeBySegment[s.id]]);
  const blogTeaser = `<!-- BLOG -->
<section class="sec blog" id="blog" aria-labelledby="blog-h">
  <div class="wrap">
    <header class="head head--split" data-reveal>
      <p class="eyebrow">${esc(b.eyebrow)}</p>
      <h2 class="h-lg" id="blog-h">${stripEm(b.titleHtml)}</h2>
      <p class="lead">${esc(b.intro)}</p>
    </header>
    <div class="blogt">
      <article class="bfeat" data-reveal style="--y:36px">
        <a class="bfeat__ph" href="${artHref(f, up)}" tabindex="-1" aria-hidden="true"><span class="photo photo--grade">${img(blogImg(f), { up, sizes: '(min-width:1200px) 640px, (min-width:810px) 56vw, 100vw' })}</span><span class="post__cat">${esc(segOfArt(f).name)}</span></a>
        <div class="bfeat__txt">
          <p class="eyebrow">Izdvajamo</p>
          <h3><a class="bfeat__a" href="${artHref(f, up)}">${wbr(f.title)}</a></h3>
          <p class="bfeat__ex">${inline(excerptOf(f))}</p>
          <p class="bfeat__meta">${minRead(f)}</p>
          <a class="btn" href="${artHref(f, up)}">Pročitaj tekst ${ico('arrow')}</a>
        </div>
      </article>
      <ul class="blist">${picks.map((a, i) => `<li data-reveal style="--y:24px;--d:${(i * 0.08).toFixed(2)}s"><a class="blist__a" href="${artHref(a, up)}"><span class="blist__c">${esc(segOfArt(a).name)} · ${minRead(a)}</span><span class="blist__t">${wbr(a.title)}</span><span class="blist__go" aria-hidden="true">${ico('arrow')}</span></a></li>`).join('')}</ul>
    </div>
    <p class="blog__more"><a class="btn btn--ghost" href="blog.html">Svi tekstovi na blogu ${ico('arrow')}</a></p>
    ${clineHtml()}
  </div>
</section>`;
  /* no-JS contact block and hero bar: written from the same data as everything else (no number or address typed twice) */
  const stat = `<!-- STATIC FALLBACK: only visible when the page could not build itself (no JavaScript, blocked or failed scripts).
     Phone numbers, addresses and hours are plain HTML so a visitor on a bad connection can still call or write. -->
<aside class="static-contact" id="kontakt-static" aria-labelledby="static-h">
  <div class="wrap">
    <p class="eyebrow">Kontakt</p>
    <h2 id="static-h">Beauty Concept, Lepa Svaki Dan</h2>
    <noscript><p class="static-contact__note">Cenovnik i ostali sadržaj učitavaju se uz uključen JavaScript. Za cene i termine pozovite nas ili nam pišite na WhatsApp.</p></noscript>
    <div class="static-contact__locs">
      ${LOCS.map((l) => `<div class="static-contact__loc">
        <h3>${esc(l.concept)}<span>${esc(l.area)}</span></h3>
        <p>${esc(l.address)}</p>
        <p>${esc(HOURS)}</p>
        <a class="btn" href="${esc(l.phone.telHref)}">Pozovi ${esc(l.phone.display)}</a>
        <a class="btn btn--ghost" href="${esc(l.phone.whatsappHref)}" rel="noopener">WhatsApp</a>
      </div>`).join('\n      ')}
    </div>
    <p class="static-contact__note"><a class="link" href="${esc(EMAIL_HREF)}">${esc(EMAIL)}</a></p>
  </div>
</aside>`;
  const herolocs = `<dl class="hero__locs">\n        ${LOCS.map((l) => `<div><dt>${esc(l.eyebrow)}</dt><dd>${esc(l.area)}</dd></div>`).join('\n        ')}\n      </dl>`;
  const { header, footer } = shell({ home: true, up: '' });
  return { header, footer, learn, blogteaser: blogTeaser, static: stat, herolocs };
}
function syncHome() {
  const file = path.join(SITE, 'index.html');
  let html = rd(file);
  const regions = homeRegions();
  for (const name of ['header', 'learn', 'blogteaser', 'static', 'herolocs', 'footer']) {
    const re = new RegExp(`(<!--@@ ${name} -->)[\\s\\S]*?(<!--@@ /${name} -->)`);
    if (!re.test(html)) throw new Error(`index.html is missing the <!--@@ ${name} --> region`);
    html = html.replace(re, (m, a, b) => `${a}\n${regions[name]}\n${b}`);
  }
  const before = (html.match(/<div class="cline" data-cline/g) || []).length;
  html = html.replace(/<div class="cline" data-cline[^>]*>[\s\S]*?<\/div>/g, clineHtml());
  atomic(file, html); written.push(`index.html (regions: header, learn, blogteaser, static, herolocs, footer; ${before} contact lines)`);
}

/* ------------------------------------------------------------------------------------------------ slim content.js */
/* What the browser may see. The per-service location (location / nb / bw), the hashtags and the pack's internal notes are NOT shipped:
   the price list is ONE list (the exact place of every treatment is agreed when booking), and view-source must not show otherwise.
   Laser rows ship only the unified price string that the old site showed (cheaper of the two prices, "od" when they differ). */
function writeContentJs() {
  const c = C, pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
  const out = {
    site: { name: c.site.name, tagline: c.site.tagline, pages: c.site.pages, credit: c.site.credit },
    nav: c.nav,
    hero: { ...pick(c.hero, ['claim', 'headline', 'sub', 'ctas']) },
    about: pick(c.about, ['eyebrow', 'title', 'titleHtml', 'paragraphs']),
    stats: { items: c.stats.items, founderMeta: c.stats.founderMeta },
    quote: { ...c.quote, html: stripEm(c.quote.html) },
    founder: pick(c.founder, ['name', 'role', 'signatureName', 'signatureMeta']),
    locations: c.locations.map((l) => ({ ...pick(l, ['key', 'concept', 'area', 'address', 'eyebrow', 'phone']), image: { alt: l.image.alt } })),
    contact: { ...pick(c.contact, ['email', 'emailHref', 'primaryWhatsappHref', 'primaryPhone', 'hours', 'social']), phones: c.contact.phones.map((p) => pick(p, ['display', 'tel', 'telHref', 'whatsappHref'])) },
    pricing: {
      ...pick(c.pricing, ['eyebrow', 'title', 'titleHtml', 'contactNote', 'footnote', 'validFrom', 'ui']),
      searchPlaceholder: COPY.priceSearch,
      tabs: c.pricing.tabs.map((t) => ({ ...pick(t, ['id', 'label', 'kind', 'note']), groups: t.groups.map((g) => ({ title: g.title, services: g.services.map((s) => pick(s, ['id', 'name', 'description', 'price', 'onRequest', 'highlight'])) })) })),
    },
    payment: c.payment,
    favorites: c.favorites.map((f) => pick(f, ['name', 'description', 'price', 'tagLabel', 'cenovnik'])),
    gifts: c.gifts.map((f) => pick(f, ['name', 'description', 'price', 'tagLabel', 'cenovnik'])),
    verticals: c.verticals.map((v) => pick(v, ['title', 'summary', 'cenovnikTab', 'cenovnikServiceCount'])),
    testimonials: c.testimonials.map((t) => pick(t, ['id', 'quote', 'author', 'tag'])),
    search: { minChars: 2, debounceMs: 120, emptyTemplate: 'Nema rezultata za „{query}“.' },
    sections: {
      ...c.sections,
      /* R1: the pack's per-treatment location labels (Novi Beograd / Waterfront / Obe lokacije) are not shipped: nothing renders them any more */
      verticals: Object.fromEntries(Object.entries(c.sections.verticals).filter(([k]) => k !== 'locationLabels')),
      locations: { eyebrow: COPY.locations.eyebrow, title: COPY.locations.title, lead: COPY.locations.lead, hintHover: COPY.locations.hintHover, hintTouch: COPY.locations.hintTouch },
    },
    cta: { ...c.cta, home: { eyebrow: COPY.cta.eyebrow, headline: COPY.cta.headline, headlineHtml: esc(COPY.cta.headline), body: COPY.cta.body } },
    footer: { ...c.footer, description: COPY.heroSub },
    copy: Object.fromEntries(c.copy.newStrings.map((s) => [s.id, s.text])),
  };
  /* headings and sentences are ONE colour: the pack's <em> accents (recoloured halves) are removed from every string that ships */
  const noEm = (o) => (typeof o === 'string' ? o.replace(/<\/?em>/g, '') : Array.isArray(o) ? o.map(noEm) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, noEm(v)])) : o);
  for (const k of Object.keys(out)) out[k] = noEm(out[k]);
  /* highlight badge: the pack carries an emoji in it ("💜 akcija"); a plain word is what ships */
  out.pricing.ui = { ...out.pricing.ui, highlightBadge: String(out.pricing.ui.highlightBadge).replace(/^[^\p{L}\p{N}]+/u, '') };
  const offers = c.offers.map((o) => pick(o, ['id', 'slug', 'tag', 'title', 'description', 'price', 'priceEur', 'priceRsd', 'note', 'validity', 'cta', 'cenovnikRef']));
  const js = `/* Lepa Svaki Dan, content (trimmed copy of v2/_shared/content/content.json, same strings and shape).
   Generated by _tools/b/build-pages.mjs. Pripremio ECHOSYSTEM-MOTHER AGENCY.
   The OFFERS (Posebna ponuda) are the array at the bottom of this file. How to add, edit or remove an offer and its price:
   see the instructions at the top of js/offers.js. */
window.LSD_CONTENT=${JSON.stringify(out)};

/* =====================================================================================================
   OFFERS (Posebna ponuda): window.LSD_CONTENT.offers. One block per offer; the order here is the order on the home teaser and on
   posebna-ponuda.html. Add = copy a block, edit = change the text or the numbers, remove = delete the block. Full instructions: js/offers.js.
   ===================================================================================================== */
window.LSD_CONTENT.offers=${JSON.stringify(offers, null, 2)};
`;
  atomic(path.join(SITE, 'assets', 'content.js'), js); written.push('assets/content.js');
}

/* ------------------------------------------------------------------------------------------------ search index (js/search.js) */
/* One compact data file for the site search. Same fold() as js/search.js (lower case, đ -> dj, no combining marks).
   The synonym phrases are HIDDEN vocabulary: they only find results, js/search.js never prints them (no hashtags, no chips). */
const foldQ = (s) => fold(String(s)).replace(/[^a-z0-9]+/g, ' ').trim();
const priceNum = (p) => { const m = /(\d[\d.]*)\s*€/.exec(String(p || '')); return m ? parseInt(m[1].replace(/\./g, ''), 10) : null; };
function writeSearchIndex() {
  const tabs = C.pricing.tabs.map((t) => ({ id: t.id, label: t.label }));
  const groups = [], svcs = [], gIdx = {}, sIdx = {};
  C.pricing.tabs.forEach((t, ti) => t.groups.forEach((g, gi) => {
    const gid = `${t.id}:${gi}`; gIdx[gid] = groups.length;
    const nums = g.services.map((s) => priceNum(s.price)).filter((n) => n != null);
    groups.push({ id: gid, t: g.title, ti, n: g.services.length, f: nums.length ? Math.min(...nums) : 0 });
    g.services.forEach((s, si) => { sIdx[`${gid}:${si}`] = svcs.length; svcs.push([gIdx[gid], si, s.name, s.price, s.description || '']); });
  }));
  const arts = ARTS.map((a) => {
    const text = a.blocks.filter((b) => !b.flag).map((b) => (b.items ? b.items.join(' ') : b.text)).join(' ').replace(/\[\[dopuniti: [^\]]+\]\]/g, ' ');
    const heads = a.blocks.filter((b) => b.type === 'h2' || b.type === 'h3').map((b) => b.text).join(' · ');
    return { id: a.id, slug: a.slug, seg: segOfArt(a).name, t: a.title, st: a.subtitle || '', ex: excerptOf(a).replace(/\[\[dopuniti: [^\]]+\]\]/g, '').trim(), h: heads, b: text, r: a.readMinutes };
  });
  const aIdx = Object.fromEntries(arts.map((a, i) => [a.id, i]));
  const offers = C.offers.map((o) => ({ id: o.id, slug: o.slug, t: o.title, tag: o.tag, p: o.price, d: o.description }));
  const oIdx = Object.fromEntries(offers.map((o, i) => [o.id, i]));
  /* synonyms: entries + the natural questions. strength s(trong) / m(edium) / w(eak = closest hook only, shown as a soft suggestion) */
  const ents = [], phrases = [], questions = [];
  const addEntry = (e) => {
    const ix = ents.length;
    ents.push({
      s: e.strength[0], w: e.directEvidence === false ? 1 : 0,
      g: e.targets.groupIds.map((x) => gIdx[x]).filter((x) => x != null),
      v: e.targets.serviceIds.map((x) => sIdx[x]).filter((x) => x != null),
      a: e.targets.articleIds.map((x) => aIdx[x]).filter((x) => x != null),
      o: e.targets.offerIds.map((x) => oIdx[x]).filter((x) => x != null),
    });
    const seen = new Set();
    for (const p of e.phrases) { const f = foldQ(p); if (f && !seen.has(f)) { seen.add(f); phrases.push([f, ix]); } }
    return ix;
  };
  SYN.entries.forEach(addEntry);
  const qIx = {}; for (const q of SYN.questions) qIx[q.id] = addEntry(q);
  CFG.searchQuestions.forEach((id) => { const q = SYN.questions.find((x) => x.id === id); if (q) questions.push([q.question, qIx[id]]); });
  const data = { v: 1, tabs, groups, svcs, arts, offers, syn: { e: ents, p: phrases, q: questions } };
  const js = `/* Lepa Svaki Dan, data of the site search (js/search.js). Generated by _tools/b/build-pages.mjs from the price list, the 21 texts, the offers and
   _shared/content/search-synonyms.json. The synonym phrases are hidden vocabulary: they find results and are never printed on the page.
   Pripremio ECHOSYSTEM-MOTHER AGENCY. */
window.LSD_SEARCH=${JSON.stringify(data)};
`;
  atomic(path.join(SITE, 'assets', 'search-index.js'), js); written.push(`assets/search-index.js (${groups.length} groups, ${svcs.length} services, ${arts.length} texts, ${offers.length} offers, ${phrases.length} phrases)`);
}

/* ------------------------------------------------------------------------------------------------ images */
function syncImages() {
  let copied = 0;
  for (const id of usedImgs) for (const v of IMGM[id].variants) {
    const to = path.join(SITE, 'assets', 'img', v.file), from = path.join(IMGSRC, v.file);
    if (!fs.existsSync(to) || fs.statSync(to).size !== fs.statSync(from).size) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); copied++; }
  }
  return copied;
}

/* ------------------------------------------------------------------------------------------------ hygiene: nothing may ship that the client asked us to remove */
function assertClean() {
  const bad = [];
  const rules = [
    [new RegExp(String.fromCharCode(8212) + '|&md' + 'ash;'), 'em dash'],
    [/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/u, 'emoji / pictograph'],
    [/\bdr\.?\s+Tamar/i, 'doctor title before Tamara'],
  ];
  for (const rel of written) {
    const f = path.join(SITE, rel.replace(/ \(.*$/, ''));
    if (!fs.existsSync(f)) continue;
    const t = rd(f);
    for (const [re, name] of rules) if (re.test(t)) bad.push(`${rel}: ${name}`);
  }
  if (bad.length) throw new Error('build output is not clean:\n  ' + bad.join('\n  '));
}

/* ------------------------------------------------------------------------------------------------ run */
const t0 = Date.now();
buildBlog();
ARTS.forEach(buildArticle);
SEGS.forEach(buildSegment);
buildOffers();
syncHome();
writeContentJs();
writeSearchIndex();
const copied = syncImages();
assertClean();
console.log(`built ${written.length} files in ${Date.now() - t0} ms (${ARTS.length} articles, ${SEGS.length} segments, ${C.offers.length} offers); ${copied} image files copied`);
if (process.argv.includes('--list')) written.forEach((w) => console.log('  ' + w));
