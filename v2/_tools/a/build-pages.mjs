#!/usr/bin/env node
/* =====================================================================================================
   LEPA SVAKI DAN · preview "A" · page builder (dependency-free, node >= 18)
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   Pre-renders the multi-page site from the shared texts pack, so every page is a real HTML file that reads without JS:
     blog.html                       Blog index (21 articles grouped by the 4 segments)
     blog/<slug>.html                21 article pages
     tretmani/<segment-slug>.html    4 segment pages (video-ready header)
     posebna-ponuda.html             all offers (data: js/offers-data.js)
   and keeps the SHARED SHELL (skip link, header with both phones and the search button, mobile menu, footer, action bar, booking sheet with both
   numbers, search overlay) identical on every page, including index.html (regions between <!--@name--> ... <!--@/name--> markers are rewritten).
   It also writes assets/data/pages-data.js (the slim data the home needs), assets/search-index.js (the data of the search, see
   build-search-index.mjs) and copies the media-pack images the pages use.

   MARKERS in index.html that this script fills:  shell:top, shell:bottom, gen:about (the info strip + the About block with the founder word and the
   "Bestseller tretmani"), gen:segments, gen:locations (the split), gen:offers, gen:blog, gen:cta (the closing block), gen:sheets (the payment note and the
   one-time price-list notice) and, inline and repeated: cline (the contact line under each home section), herosub (the hero sentence), heroclaim ("2 lokacije,
   1 filozofija"), phones (the numbers in the price-list intro).
   EVERY phone, e-mail, Instagram link and the hours come from the contact data of the pack (PHONES, EMAILS, SOCIAL, HOURS below): nothing is typed twice.
   THE PAIRS: phone 1 + mail 1, phone 2 + mail 2 (content.contact.emails). The second mail is not known yet: while emails[1].email is null, pair 2 shows its phone alone.
   THE INFO STRIP of the About block (15+ godina prakse, 2 koncepta, 1.000+ klijenata godisnje, Pon-Sub 9-21h) is rendered by stripHtml() below from content.stats.items
   and content.contact.hours: drop the client's real statistics and hours into the pack (_shared/content/_tools/apply-final-site.js, or content.json) and rebuild.
   PRICES are shown dinars first (js/price.js, also run here, so the pages and the browser can never disagree).
   STAGE 3: the search is ranked by relevance (js/search.js, the data above with the per-service tags and the evidence weights of the hidden vocabulary; test:
   node _tools/a/test-search-relevance.mjs) and every page loads the personalised offer: assets/data/personalize-config.js (the wording, the percentages, the codes, the rules)
   and js/personalize.js. Text pages carry body[data-art], segment pages body[data-seg], which tell it what the visitor is reading.

   Run:    node _tools/a/build-pages.mjs            (rebuild everything; safe to repeat)
           node _tools/a/build-pages.mjs --public   (same, but FAILS while any [[dopuniti: ...]] blank is left in a text)
   Input:  _shared/content/{articles,segments,service-links,content}.json, _shared/img/manifest.json, js/offers-data.js
   Output: only inside the preview A folder (pages, assets/data, copied images). Nothing else is touched.

   WHEN A TEXT CHANGES: edit it in the shared pack (python3 _shared/content/_tools/build-texts-pack.py), then run this script.
   HOW TO TURN ON THE HEADER VIDEO OF A SEGMENT: see SEGMENT_VIDEO below (drop the file in assets/video/ of the preview A folder, set the path, rebuild).
   ===================================================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { searchIndexSource } from './build-search-index.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '..', '..');
const SITE_DIR = fs.readdirSync(V2).find((d) => /^a-[a-z]+$/.test(d) && fs.existsSync(path.join(V2, d, 'index.html'))); // the folder of preview A
const SITE = path.join(V2, SITE_DIR);
const SHARED = path.join(V2, '_shared');
const PUBLIC_BUILD = process.argv.includes('--public');

/* ----------------------------------------------------------------------------------------------------
   CONFIG
   ---------------------------------------------------------------------------------------------------- */
/* Header video per segment. Empty string = poster only (today: no video exists, nothing is invented).
   To enable: put the files under assets/video/ of the preview A folder, e.g.  dermatologija: { mp4: 'assets/video/dermatologija.mp4', webm: 'assets/video/dermatologija.webm' }
   The page then loads the video only on a good connection, never with reduced motion or data saver, and the poster stays as the fallback.
   Advice for the files: 6 to 12 s seamless loop, no audio, 1280 px wide (H.264 mp4, optional VP9 webm), under 1.5 MB. */
const SEGMENT_VIDEO = {
  dermatologija: { mp4: '', webm: '' },
  estetske: { mp4: '', webm: '' },
  kozmetika: { mp4: '', webm: '' },
  telo: { mp4: '', webm: '' },
};
/* Layout of the hero card per segment ("right" = card on the right on desktop, keeps the orchids visible). object-position of the photo: mobile / desktop */
const SEGMENT_HERO = {
  dermatologija: { cutout: true },
  estetske: { side: 'right', pos: '8% 30%', posWide: '50% 50%' },
  kozmetika: { pos: '55% 38%', posWide: '50% 42%' },
  telo: { pos: '84% 45%', posWide: '50% 42%' },
};
/* Home blog teaser: one article per segment, plus the "most popular" one. This is an editorial choice, not analytics: replace when real numbers exist. */
const HOME_PICKS = { dermatologija: 'art-2', estetske: 'art-6', kozmetika: 'art-11', telo: 'art-21' };
const POPULAR = 'art-7';
/* Nicer address than the pack slug "bezbolna-i-bezbedna" (the pack manifest suggests exactly this one). */
const SLUG_OVERRIDES = { 'art-21': 'laserska-epilacija-venus-velocity' };
const SITE_NAME = 'Lepa Svaki Dan';
const OG_IMAGE = 'https://lepa-svaki-dan-predlozi.vercel.app/a/assets/img/og-image.jpg';
const PRICE_NOTE_SHOW = true;
const MARK_PLACEHOLDERS = true; // visible lila marker + note on the page, so the owner sees what is missing

/* ----------------------------------------------------------------------------------------------------
   LOAD
   ---------------------------------------------------------------------------------------------------- */
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
/* the price format of the browser (js/price.js: DINARS FIRST, euros below), run here so the static pages and the scripts render the same markup */
const PRICE = (() => { const m = { exports: {} }; vm.runInNewContext(fs.readFileSync(path.join(SITE, 'js/price.js'), 'utf8'), { module: m }, { filename: 'price.js' }); return m.exports; })();
const articles = readJSON(path.join(SHARED, 'content/articles.json'));
const segFile = readJSON(path.join(SHARED, 'content/segments.json'));
const links = readJSON(path.join(SHARED, 'content/service-links.json'));
const content = readJSON(path.join(SHARED, 'content/content.json'));
const imgManifest = readJSON(path.join(SHARED, 'img/manifest.json'));
const synonyms = readJSON(path.join(SHARED, 'content/search-synonyms.json'));

/* CONTACT DATA: the single source of every phone, e-mail, Instagram and hours string of the site (header, menu, sheets, contact lines,
   closing blocks, footer, split, search help). Nothing below hard-codes a number: change it in the pack and rebuild. */
const conceptOf = (key) => content.locations.find((l) => l.key === key);
const PHONES = content.contact.phones.map((p) => ({ key: p.location, area: p.area, concept: conceptOf(p.location).concept, address: conceptOf(p.location).address, display: p.display, tel: p.telHref, wa: p.whatsappHref, num: p.tel.replace(/^\+/, '') }));
const EMAIL = content.contact.email;       // the first (primary) address, used where one address is enough
/* the pairs: phone i + mail i. A pair whose mail is not set shows the phone alone (never an invented address). */
const EMAILS = (content.contact.emails || []).map((e) => ({ email: e.email || '', href: e.emailHref || (e.email ? 'mailto:' + e.email : ''), label: e.label }));
const PAIRS = PHONES.map((p, i) => ({ ...p, mail: (EMAILS[i] && EMAILS[i].email) || '' }));
const MAILS = EMAILS.filter((e) => e.email).map((e) => e.email);
/* the agreed final call to action (R13), used by the home and by the four segment pages */
const FINAL_CTA = { eyebrow: content.cta.home.eyebrow, headlineHtml: 'Vaše uživanje i briga o lepoti počinju ovde. Zakažite svoj termin.' };
const SOCIAL = Object.fromEntries(content.contact.social.filter((s) => s.href).map((s) => [s.label, s.href]));
const HOURS = content.contact.hours.display.replace(', ', ' · '); // "Pon-Sub, 9-21h" -> "Pon-Sub · 9-21h" (plain hyphen, a long dash looks odd in the hours)
const CLAIM = content.hero.claim;          // "2 lokacije, 1 filozofija"
const HERO_SUB = content.hero.sub;         // the sentence of the hero, repeated word for word in the footer

const segments = segFile.segments.slice().sort((a, b) => a.order - b.order);
const segById = Object.fromEntries(segments.map((s) => [s.id, s]));
const artById = Object.fromEntries(articles.map((a) => [a.id, a]));
articles.forEach((a) => { a.slug = SLUG_OVERRIDES[a.id] || a.slug; });
const linkByArt = Object.fromEntries(links.articles.map((a) => [a.articleId, a]));
const tabs = content.pricing.tabs;
const tabById = Object.fromEntries(tabs.map((t) => [t.id, t]));
const groupInfo = (gid) => { // "estetske:5" -> { tabId, idx, title, tabLabel, count }
  const m = /^([a-z]+):(\d+)$/.exec(gid); if (!m) return null;
  const t = tabById[m[1]], g = t && t.groups[+m[2]]; if (!g) return null;
  return { id: gid, tabId: t.id, idx: +m[2], title: g.title, tabLabel: t.label, count: g.services.length };
};
const grupaParam = (gid) => gid.replace(':', '-');
const imgById = Object.fromEntries(imgManifest.images.map((i) => [i.id, i]));

/* ----------------------------------------------------------------------------------------------------
   HELPERS
   ---------------------------------------------------------------------------------------------------- */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  const w = a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && !(b >= 12 && b <= 14) ? few : many;
  return n + ' ' + w;
}
/* a short last word of an excerpt is glued to the word before it with a non-breaking space, so a teaser never ends on a lonely "u…" (layout only) */
const glueTail = (t) => String(t).trim().replace(/ ([^ ]{1,4})$/, '\u00a0$1');   // only a short last word (up to 4 characters); a long one wraps by itself
const nTekst = (n) => plural(n, 'tekst', 'teksta', 'tekstova');
const nUsluga = (n) => plural(n, 'usluga', 'usluge', 'usluga');
const nGrupa = (n) => plural(n, 'grupa', 'grupe', 'grupa');
const nMesto = (n) => plural(n, 'mesto', 'mesta', 'mesta');
const posixRel = (from, to) => {
  const m = /^([^?#]*)(.*)$/.exec(to), target = m[1], suffix = m[2];
  const r = path.posix.relative(path.posix.dirname(from), target);
  return (r || path.posix.basename(target)) + suffix;
};
const slugify = (s) => String(s).toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
const TOKEN = /\[\[dopuniti:\s*([^\]]+?)\s*\]\]/g;
const stripTokens = (s) => String(s).replace(TOKEN, '').replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
const segUrl = (s) => 'tretmani/' + s.slug + '.html';
const artUrl = (a) => 'blog/' + a.slug + '.html';
const cenovnikUrl = (gid) => 'index.html?grupa=' + grupaParam(gid) + '#usluge';

/* inline text: hyperlinks the copywriter put in the Word text (targets mapped to the new site), placeholders as visible markers */
/* the tail of a long paragraph never ends on a stub like "iz pora." (2 short words alone on the last line): the last words (up to 3, until the tail has 16 characters) are joined with
   non-breaking spaces. Layout only, the words are the client's. Applied to the plain text after the last link of an article paragraph (o.glue). */
function glueEnd(t) {
  const w = String(t).trimEnd().split(' ');
  if (w.length < 9) return t;
  let n = 1, len = w[w.length - 1].length;
  while (n < 3 && len < 16 && n < w.length - 1) { n++; len += 1 + w[w.length - n].length; }
  if (n < 2 || len > 30) return t;
  return w.slice(0, w.length - n).join(' ') + ' ' + w.slice(w.length - n).join('\u00a0');
}
function renderInline(text, linkList, from, o = {}) {
  const spans = [];
  (linkList || []).forEach((l) => {
    if (!l.target || l.target.type === 'none') return;
    const at = text.indexOf(l.text);
    if (at < 0) return;
    if (spans.some((s) => at < s.end && at + l.text.length > s.start)) return;
    spans.push({ start: at, end: at + l.text.length, l });
  });
  spans.sort((a, b) => a.start - b.start);
  // a slash glued between words ("Dermatološki/pregled") gets a break opportunity, so narrow cards never cut the title
  const plain = (t) => esc(t).replace(/\/(?=[A-Za-zČĆŠŽĐčćšžđ])/g, '/<wbr>').replace(TOKEN, (m, k) => (MARK_PLACEHOLDERS ? '<mark class="ph">[dopuniti: ' + k + ']</mark>' : ''));
  let out = '', pos = 0;
  spans.forEach((s) => {
    out += plain(text.slice(pos, s.start));
    const t = s.l.target; let href = '', ext = false;
    if (t.type === 'article' && artById[t.id]) href = posixRel(from, artUrl(artById[t.id]));
    else if (t.type === 'segment' && segById[t.id]) href = posixRel(from, segUrl(segById[t.id]));
    else if (t.type === 'pricelist') href = posixRel(from, t.id === 'all' ? 'index.html#usluge' : cenovnikUrl(t.id));
    else if (t.type === 'external') { href = s.l.legacyHref; ext = true; }
    out += href ? '<a href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(s.l.text) + '</a>' : esc(s.l.text);
    pos = s.end;
  });
  return out + plain(o.glue ? glueEnd(text.slice(pos)) : text.slice(pos));
}

/* ----------------------------------------------------------------------------------------------------
   DERIVED DATA
   ---------------------------------------------------------------------------------------------------- */
const segArticles = (sid) => segById[sid].articleIds.map((id) => artById[id]);
const articleGroups = (a) => { // [{...groupInfo, role}] primary first
  const l = linkByArt[a.id]; if (!l) return [];
  const out = l.groups.map((g) => ({ ...groupInfo(g.groupId), role: g.role })).filter((g) => g.id);
  return out.sort((x, y) => (x.role === 'primary' ? 0 : 1) - (y.role === 'primary' ? 0 : 1));
};
const readLabel = (a) => a.readMinutes + ' min čitanja';
function prevNext(a) {
  const ids = segById[a.segmentId].articleIds, i = ids.indexOf(a.id);
  return { prev: i > 0 ? artById[ids[i - 1]] : null, next: i < ids.length - 1 ? artById[ids[i + 1]] : null };
}
function relatedOf(a) {
  const mine = articleGroups(a), mineIds = new Set(mine.map((g) => g.id)), mineRole = Object.fromEntries(mine.map((g) => [g.id, g.role]));
  const pn = prevNext(a), skip = new Set([a.id, pn.prev && pn.prev.id, pn.next && pn.next.id].filter(Boolean));
  const mentioned = new Set();
  a.blocks.forEach((b) => (b.links || []).forEach((l) => { if (l.target && l.target.type === 'article') mentioned.add(l.target.id); }));
  const scored = articles.filter((o) => !skip.has(o.id)).map((o, i) => {
    let s = 0;
    articleGroups(o).forEach((g) => { if (mineIds.has(g.id)) s += g.role === 'primary' && mineRole[g.id] === 'primary' ? 3 : g.role === 'primary' || mineRole[g.id] === 'primary' ? 2 : 1; });
    if (mentioned.has(o.id)) s += 3;
    o.blocks.forEach((b) => (b.links || []).forEach((l) => { if (l.target && l.target.type === 'article' && l.target.id === a.id) s += 2; }));
    if (o.segmentId === a.segmentId) s += 0.5;
    return { o, s, i };
  });
  scored.sort((x, y) => y.s - x.s || x.i - y.i);
  return scored.slice(0, 3).map((x) => x.o);
}

/* ----------------------------------------------------------------------------------------------------
   IMAGES (from the media pack; copied into the site when missing or different)
   ---------------------------------------------------------------------------------------------------- */
const copied = [];
function useImage(id) { // -> { files: [{w,h,src}], w, h, srcset, alt, type }
  const im = imgById[id]; if (!im) throw new Error('media pack has no image ' + id);
  im.variants.forEach((v) => {
    const from = path.join(SHARED, 'img', v.file), to = path.join(SITE, 'assets/img', v.file);
    if (!fs.existsSync(to) || fs.statSync(to).size !== fs.statSync(from).size) { fs.copyFileSync(from, to); copied.push(v.file); }
  });
  const vs = im.variants;
  return { id, type: im.type, variants: vs, w: vs[vs.length - 1].w, h: vs[vs.length - 1].h, alt: im.alt };
}
const imgSrcset = (im, base, only) => im.variants.filter((v) => !only || only.includes(v.w)).map((v) => base + 'assets/img/' + v.file + ' ' + v.w + 'w').join(', ');
const imgSrc = (im, base, w) => { const v = im.variants.find((x) => x.w === w) || im.variants[Math.min(1, im.variants.length - 1)]; return base + 'assets/img/' + v.file; };
const baseOf = (from) => '../'.repeat(from.split('/').length - 1);
const segHero = (sid) => useImage(segById[sid].heroImage.id);

/* ----------------------------------------------------------------------------------------------------
   SHARED SHELL
   ---------------------------------------------------------------------------------------------------- */
const ICONS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M19 12l-7-7M19 12l-7 7"/></symbol>
    <symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></symbol>
    <symbol id="i-chat" viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4.1A8 8 0 1 1 20 12z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .7a3.5 3.5 0 0 1-1.7-1.7l.7-1-1-2z"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></symbol>
    <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.2a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4"/></symbol>
    <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
    <symbol id="i-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
    <symbol id="i-medal" viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M8.6 13.4L7 21l5-3 5 3-1.6-7.6"/></symbol>
    <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.2A6.5 6.5 0 0 1 21.5 20"/></symbol>
    <symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z"/></symbol>
    <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7.5l8 6 8-6"/></symbol>
    <symbol id="i-ig" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.6" cy="7.4" r=".6"/></symbol>
    <symbol id="i-fb" viewBox="0 0 24 24"><path d="M14 8.5h2V5.2h-2.4A3.6 3.6 0 0 0 10 8.8V11H8v3.2h2V20h3.2v-5.8h2.3l.5-3.2h-2.8V9.1c0-.4.3-.6.8-.6z"/></symbol>
    <symbol id="i-up" viewBox="0 0 24 24"><path d="M12 19V5M12 5l-6 6M12 5l6 6"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
    <symbol id="i-pause" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24"><path d="M8.5 5.8v12.4L18.5 12 8.5 5.8z"/></symbol>
    <symbol id="i-gift" viewBox="0 0 24 24"><path d="M4.5 11.5h15v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8z"/><path d="M3.5 8h17v3.5h-17z"/><path d="M12 8v12.5"/><path d="M12 8C10.6 4.6 7 4.2 7 6.2c0 1.6 2.8 1.8 5 1.8zM12 8c1.4-3.4 5-3.8 5-1.8 0 1.6-2.8 1.8-5 1.8z"/></symbol>
    <symbol id="i-wallet" viewBox="0 0 24 24"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><path d="M4 7.5v9A2.5 2.5 0 0 0 6.5 19H19a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z"/><circle cx="16" cy="13.5" r="1"/></symbol>
  </defs>
</svg>`;
const ico = (n, cls) => `<svg class="i${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

/* THE MENU ORDER IS FIXED BY THE CLIENT (feedback 3): Naše usluge, O nama, Posebna ponuda, Cenovnik, Lokacije, Blog.
   "Naše usluge" is the treatments section of the home (#tretmani). The header pill, the mobile menu and the footer all read this one list. */
const NAV = [
  { key: 'tretmani', label: 'Naše usluge', href: 'index.html#tretmani', home: '#tretmani' },
  { key: 'o-nama', label: 'O nama', href: 'index.html#o-nama', home: '#o-nama' },
  { key: 'ponuda', label: 'Posebna ponuda', href: 'posebna-ponuda.html', spy: 'posebna-ponuda' },
  { key: 'usluge', label: 'Cenovnik', href: 'index.html#usluge', home: '#usluge' },
  { key: 'lokacije', label: 'Lokacije', href: 'index.html#lokacije', home: '#lokacije' },
  { key: 'blog', label: 'Blog', href: 'blog.html', spy: 'blog' },
];

/* THE LOGO: the stacked lockup of the published site (BEAUTY & WELLBEING CONCEPT / hairline / LEPA . SVAKI . DAN), the deeper ink (#403C3D) version, thin strokes need it
   (prepared in _shared/brand/logo-wb, 1005x632 from the client's own 350x225 web PNG). 1x = 240 px, 2x = 480 px wide webp in assets/logo. */
const LOGO_ALT = 'Beauty &amp; Wellbeing Concept, Lepa Svaki Dan';
const logoImg = (b, cls, h, extra = '') => `<img${cls ? ' class="' + cls + '"' : ''} src="${b}assets/logo/logo-wb-ink-240.webp" srcset="${b}assets/logo/logo-wb-ink-240.webp 1x, ${b}assets/logo/logo-wb-ink-480.webp 2x" width="${Math.round(h * 1005 / 632)}" height="${h}" alt="${LOGO_ALT}"${extra}>`;

/* the two phones, as links (header, mobile menu, contact line, closing block, split all read PHONES) */
const phoneAria = (p) => `Pozovite ${p.concept}, ${p.area}, ${p.display}`;

function shellTop(from, current /* nav key or '' */) {
  const home = from === 'index.html', b = baseOf(from);
  const link = (n) => (home && n.home ? n.home : posixRel(from, n.href));
  const cur = (n) => (n.key === current ? (from === n.href ? ' aria-current="page"' : ' aria-current="true"') + ' class="is-active"' : '');
  const spy = (n) => (home && n.spy ? ' data-spy="' + n.spy + '"' : '');
  const logoHref = home ? '#top' : posixRel(from, 'index.html');
  return `<a class="skip" href="#main">Preskoči na sadržaj</a>

<!-- icon sprite -->
${ICONS}

<!-- NAV -->
<header class="nav" id="nav">
  <div class="nav__row">
    <a class="nav__logo" href="${logoHref}" aria-label="Beauty &amp; Wellbeing Concept, Lepa Svaki Dan, ${home ? 'početak stranice' : 'početna stranica'}">
      ${logoImg(b, 'logo-wb', 58)}
    </a>
    <nav class="nav__pill" aria-label="Glavna navigacija">
      <ul>
${NAV.map((n) => `        <li><a href="${link(n)}"${spy(n)}${cur(n)}>${n.label}</a></li>`).join('\n')}
      </ul>
    </nav>
    <div class="nav__actions">
      <div class="nav__phones" role="group" aria-label="Telefoni">
        ${ico('phone')}
${PHONES.map((p) => `        <a href="${p.tel}" aria-label="${phoneAria(p)}">${p.display}</a>`).join('\n')}
      </div>
      <button class="nav__search" type="button" data-search aria-haspopup="dialog" aria-label="Pretraga">${ico('search')}</button>
      <button class="nav__cta btn btn--ink" type="button" data-book aria-haspopup="dialog">Zakaži</button>
      <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Meni"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>

<!-- MOBILE MENU -->
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Meni" hidden>
  <div class="menu__top">
    ${logoImg(b, 'menu__logo', 60)}
    <button class="menu__close" type="button" aria-label="Zatvori meni" data-close><svg class="i"><use href="#i-x"/></svg></button>
  </div>
  <button class="menu__search" type="button" data-search aria-haspopup="dialog">${ico('search')}<span>Pretraži tretmane i tekstove</span></button>
  <nav class="menu__nav" aria-label="Meni">
    <ul>
${NAV.map((n, i) => `      <li style="--i:${i}"><a href="${link(n)}" data-close${n.key === current ? ' aria-current="' + (from === n.href ? 'page' : 'true') + '"' : ''}>${n.label}</a></li>`).join('\n')}
    </ul>
  </nav>
  <div class="menu__contact">
    <p class="menu__h">Pozovite nas</p>
${PHONES.map((p) => `    <a class="menu__phone" href="${p.tel}" aria-label="${phoneAria(p)}">${ico('phone')}<span><b>${p.area}</b> ${p.display}</span></a>`).join('\n')}
    <button class="btn btn--ink menu__wa" type="button" data-book="wa" aria-haspopup="dialog">${ico('chat')}WhatsApp</button>
  </div>
</div>`;
}

function shellBottom(from) {
  const b = baseOf(from), home = from === 'index.html';
  const link = (n) => (home && n.home ? n.home : posixRel(from, n.href));
  return `<!-- FOOTER -->
<footer class="foot" id="kontakt">
  <div class="wrap">
    <div class="foot__grid">
      <div class="foot__brand">
        <div class="foot__mark">${logoImg(b, '', 84, ' loading="lazy" decoding="async"')}</div>
        <p>${esc(HERO_SUB)}</p>
      </div>
      <div class="foot__col foot__col--nav">
        <h3>Navigacija</h3>
        <ul>
${NAV.map((n) => `          <li><a href="${link(n)}">${n.label}</a></li>`).join('\n')}
        </ul>
      </div>
      <div class="foot__col">
        <h3>Kontakt</h3>
        <ul>
${PAIRS.map((p, i) => `          <li><a class="foot__ph foot__ph--${i + 1}" href="${p.tel}" aria-label="${phoneAria(p)}">${p.display}</a></li>${p.mail ? `
          <li><a class="foot__ph foot__ph--${i + 1}" href="mailto:${p.mail}">${p.mail}</a></li>` : ''}`).join('\n')}
        </ul>
      </div>
      <div class="foot__col">
        <h3>Lokacije</h3>
        <ul>
${PHONES.map((p) => `          <li><span class="foot__loc">${p.concept}</span><em>${p.address}</em></li>`).join('\n')}
        </ul>
      </div>
      <div class="foot__col">
        <h3>Pratite nas</h3>
        <ul>
          <li><a href="${SOCIAL.Instagram}" target="_blank" rel="noopener">${ico('ig')}Instagram</a></li>
          <li><a href="${SOCIAL.Facebook}" target="_blank" rel="noopener">${ico('fb')}Facebook</a></li>
        </ul>
      </div>
    </div>
    <img class="foot__line" src="${b}assets/logo/lsd-line-grey.svg" width="259" height="26" alt="" loading="lazy" decoding="async">
    <div class="foot__bottom">
      <p class="foot__copy">© <span id="year">2026</span> Lepa Svaki Dan. Sva prava zadržana.</p>
      <p class="foot__credit">Pripremio ECHOSYSTEM-MOTHER AGENCY</p>
      <a class="foot__top" href="#top" aria-label="Vrati se na vrh">${ico('up')}</a>
    </div>
  </div>
</footer>

<!-- MOBILE ACTION BAR -->
<nav class="abar" id="abar" aria-label="Brze akcije">
  <button class="abar__b" type="button" data-book="call" aria-haspopup="dialog">${ico('phone')}<span>Pozovi</span></button>
  <button class="abar__b" type="button" data-book="wa" aria-haspopup="dialog">${ico('chat')}<span>WhatsApp</span></button>
  <button class="abar__b abar__b--main" type="button" data-book aria-haspopup="dialog">${ico('sparkle')}<span>Zakaži</span></button>
</nav>

<!-- BOOKING SHEET: both numbers, as big buttons (js/shell.js fills the labels by mode) -->
<div class="sheet" id="bookSheet" role="dialog" aria-modal="true" aria-labelledby="bookTitle" hidden>
  <div class="sheet__scrim" data-close></div>
  <div class="sheet__panel">
    <button class="sheet__x" type="button" aria-label="Zatvori" data-close><svg class="i"><use href="#i-x"/></svg></button>
    <h2 id="bookTitle" class="sheet__t">Zakaži termin</h2>
    <p class="sheet__s">${HOURS}</p>
    <p class="sheet__pkg" id="bookPkg" hidden></p>
    <ul class="book" id="bookList" data-mode="">
${PHONES.map((p) => `      <li data-num="${p.display}" data-name="${p.concept}, ${p.area}">
        <p class="book__n"><b>${p.concept}</b><span>${p.area}</span></p>
        <a class="bbtn bbtn--tel" href="${p.tel}">${ico('phone')}<span class="bbtn__t"><span class="bbtn__m">Pozovi</span><span class="bbtn__s">${p.display}</span></span></a>
        <a class="bbtn bbtn--wa" data-wa="${p.num}" href="${p.wa}" target="_blank" rel="noopener">${ico('chat')}<span class="bbtn__t"><span class="bbtn__m">WhatsApp</span><span class="bbtn__s">${p.display}</span></span></a>
      </li>`).join('\n')}
    </ul>
  </div>
</div>

<!-- SEARCH OVERLAY (js/search.js; results are written into #srchBody) -->
<div class="srch" id="searchOv" role="dialog" aria-modal="true" aria-label="Pretraga" hidden>
  <div class="srch__scrim" data-close></div>
  <div class="srch__panel">
    <div class="srch__top">
      <form class="srch__form" id="srchForm" role="search" aria-label="Pretraga" autocomplete="off">
        ${ico('search', 'srch__ico')}
        <label class="sr" for="srchQ">Pretraži tretmane, tekstove i ponude</label>
        <input id="srchQ" type="search" inputmode="search" enterkeyhint="search" placeholder="Pretraži ili pitaj, npr. kako smanjiti obim" autocomplete="off" autocapitalize="off" spellcheck="false" aria-controls="srchBody" data-autofocus>
        <button class="srch__clear" type="button" id="srchClear" aria-label="Obriši pretragu" hidden>${ico('x')}</button>
      </form>
      <button class="srch__close" type="button" data-close aria-label="Zatvori pretragu">${ico('x')}</button>
    </div>
    <p class="sr" id="srchLive" role="status" aria-live="polite"></p>
    <div class="srch__body" id="srchBody"></div>
    <template id="srchHelp">
      <div class="srch__help">
${PHONES.map((p) => `        <a class="btn btn--lila" href="${p.tel}" aria-label="${phoneAria(p)}">${ico('phone')}<span>${p.display}<small>${p.area}</small></span></a>`).join('\n')}
${PHONES.map((p) => `        <a class="btn btn--green" href="${p.wa}" target="_blank" rel="noopener" aria-label="WhatsApp ${p.concept}, ${p.area}">${ico('chat')}<span>WhatsApp<small>${p.area}</small></span></a>`).join('\n')}
      </div>
    </template>
  </div>
</div>`;
}

function headTag(from, o) {
  const b = baseOf(from);
  return `<!doctype html>
<html lang="sr" class="no-js" data-root="${b}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#F4F2E9">
<meta name="color-scheme" content="light">
<link rel="icon" href="${b}assets/logo/lsd-stacked-block-lila.svg" type="image/svg+xml">
<link rel="icon" href="${b}assets/img/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="${b}favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="${b}assets/img/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="sr_RS">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${b}assets/fonts/GalanoGrotesqueRegular.woff2" as="font" type="font/woff2" crossorigin>
${o.preload || ''}<link rel="stylesheet" href="${b}css/brand.css">
<link rel="stylesheet" href="${b}css/site.css">
<link rel="stylesheet" href="${b}css/pages.css">
<script>document.documentElement.className="js"</script>
</head>`;
}

/* scripts every page loads after its own: the search (engine and UI, the index itself loads on first use), the comment mode (does nothing without ?komentari) and the personalised
   offer (its configuration, then the script; body[data-art] / body[data-seg] tell it which text or segment page this is) */
const SHARED_SCRIPTS = ['js/search.js', 'js/review.js', 'assets/data/personalize-config.js', 'js/personalize.js'];

/* a whole page: head + shell + <main> + shell + scripts */
function pageHtml(from, o) {
  const b = baseOf(from);
  return `${headTag(from, o)}
<body${o.bodyClass ? ' class="' + o.bodyClass + '"' : ''} data-page="${o.pageId || ''}"${o.bodyData || ''}>
${shellTop(from, o.nav || '')}

<main id="main" tabindex="-1">
${o.main}
</main>

${shellBottom(from)}

${['js/price.js', ...(o.scripts || []), ...SHARED_SCRIPTS].map((s) => `<script src="${b}${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}

/* ----------------------------------------------------------------------------------------------------
   COMPONENTS
   ---------------------------------------------------------------------------------------------------- */
const arrowSvg = '<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg>';
const arrowSpan = '<span class="arrow" aria-hidden="true">' + arrowSvg + '</span>';

function crumbs(from, items) { // items: [{label, href?}] last = current
  return `<nav class="crumbs" aria-label="Putanja">
      <ol>
${items.map((it, i) => (i === items.length - 1 ? `        <li><span aria-current="page">${esc(it.label)}</span></li>` : `        <li><a href="${esc(posixRel(from, it.href))}">${esc(it.label)}</a></li>`)).join('\n')}
      </ol>
    </nav>`;
}

/* .phead: the lilac header band of the text pages (same gradient and swash as the home hero) */
function phead(from, o) {
  return `<section class="phead" id="top" aria-labelledby="h1">
  <div class="wrap phead__in">
    ${o.crumbs ? crumbs(from, o.crumbs) : ''}
    <div class="phead__copy a-head">
      <p class="eyebrow">${o.eyebrow}</p>
      <h1 id="h1" class="phead__h1">${o.h1}</h1>
      ${o.sub ? `<p class="phead__sub">${o.sub}</p>` : ''}
      ${o.meta ? `<ul class="phead__meta">${o.meta.map((m) => `<li>${m}</li>`).join('')}</ul>` : ''}
    </div>
  </div>
</section>`;
}

/* the closing contact block (the home's final call to action and the end of every other page): both numbers with a call and a WhatsApp button,
   the e-mail, Instagram and the hours. Texts come from the pack (content.cta.*); phones, e-mail, Instagram from the contact data. */
function contactBlock(from, copy, o = {}) {
  const wa = (p) => p.wa + (o.waText ? '?text=' + encodeURIComponent(o.waText) : '');
  return `<section class="sec sec--cta" id="zakazi" aria-labelledby="cb-t" data-abar-off>
  <div class="wrap">
    <div class="tile tile--feat cblock bk rv">
      <span class="cta__swash" aria-hidden="true"></span>
      <div class="cblock__main">
        <p class="eyebrow">${esc(copy.eyebrow)}</p>
        <h2 id="cb-t" class="cta__h">${copy.headlineHtml.replace(/<br\s*\/?>/gi, ' ')}</h2>${copy.body ? `
        <p class="cta__p">${esc(copy.body)}</p>` : ''}
      </div>
      <ul class="cblock__locs">
${PAIRS.map((p, i) => `        <li class="cblock__loc cblock__loc--${i === 0 ? 'lila' : 'green'}">
          <p class="cblock__n"><b>${p.concept}</b><span>${p.area}</span></p>
          <a class="btn ${i === 0 ? 'btn--lila' : 'btn--green'}" href="${p.tel}" aria-label="${phoneAria(p)}">${ico('phone')}${p.display}</a>
          <a class="btn btn--line" href="${esc(wa(p))}" target="_blank" rel="noopener" aria-label="WhatsApp ${p.concept}, ${p.area}">${ico('chat')}WhatsApp</a>${p.mail ? `
          <a class="cblock__mail" href="mailto:${p.mail}">${ico('mail')}<span>${p.mail}</span></a>` : ''}
        </li>`).join('\n')}
      </ul>
      <ul class="cblock__more">
        <li><a href="${SOCIAL.Instagram}" target="_blank" rel="noopener">${ico('ig')}Instagram</a></li>
        <li><span>${ico('clock')}${HOURS}</span></li>
      </ul>
    </div>
  </div>
</section>`;
}

/* the quiet contact line under every text (R5): the PAIRS phone 1 + mail 1, phone 2 + mail 2, rendered from the contact data.
   A pair whose mail is not set yet shows its phone alone. Lila dot / icon = Beauty Concept, green = Wellbeing Concept. */
function contactLine() {
  return `<div class="cline" role="group" aria-label="Kontakt">
  <p class="cline__t">Pozovite ili pišite nam</p>
  <ul class="cline__l">
${PAIRS.map((p, i) => `    <li class="cline__pair cline__pair--${i === 0 ? 'lila' : 'green'}">
      <a href="${p.tel}" aria-label="${phoneAria(p)}">${ico('phone')}<span>${p.display}</span></a>${p.mail ? `
      <a href="mailto:${p.mail}">${ico('mail')}<span>${p.mail}</span></a>` : ''}
    </li>`).join('\n')}
  </ul>
</div>`;
}

/* blog card (index, related, home): the title is the stretched link */
function blogCard(from, a, o = {}) {
  const seg = segById[a.segmentId], h = o.h || 'h3';
  return `<article class="bp${o.feat ? ' bp--feat bk' : ''} rv" style="--i:${o.i || 0}">
  <div class="bp__top"><span class="chip ${o.feat ? 'chip--ghost' : 'chip--line'}">${esc(o.label || seg.name)}</span><span class="bp__min">${readLabel(a)}</span>${MARK_PLACEHOLDERS && a.hasPlaceholders ? '<span class="chip chip--ph" title="Tekst ima mesta za dopunu">za dopunu</span>' : ''}</div>
  <${h} class="bp__t"><a class="bp__a" href="${esc(posixRel(from, artUrl(a)))}">${renderInline(a.title, [], from)}</a></${h}>
  <p class="bp__x">${renderInline(glueTail(a.excerpt), [], from)}${/[.!?“”"]$/.test(a.excerpt.trim()) ? '' : '…'}</p>
  <div class="bp__bot"><span class="bp__more">Pročitaj više</span>${arrowSpan}</div>
</article>`;
}

/* segment image tag (cards) */
function segImg(from, sid, sizes, cls, w) {
  const im = segHero(sid), b = baseOf(from), only = im.type === 'cutout' ? undefined : [480, 800, 1200];
  return `<img class="${cls}" src="${imgSrc(im, b, w || 800)}" srcset="${imgSrcset(im, b, only)}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(segById[sid].heroImage.alt || im.alt)}" loading="lazy" decoding="async">`;
}

function segCard(from, s, i, o = {}) {
  const cut = segHero(s.id).type === 'cutout';
  return `<article class="seg${cut ? ' seg--cutout' : ''} rv" style="--i:${i % 4}">
  ${segImg(from, s.id, o.sizes || '(min-width:1024px) 290px, (min-width:640px) 50vw, 92vw', 'seg__img')}
  <div class="seg__top"><span class="chip chip--lila">${nTekst(s.articleIds.length)}</span>${arrowSpan}</div>
  <div class="seg__bot">
    <h3 class="seg__t"><a class="seg__a" href="${esc(posixRel(from, segUrl(s)))}">${esc(s.name)}</a></h3>
    <p class="seg__s">${esc(s.intro.text)}</p>
  </div>
</article>`;
}

/* price-list group row (cards in segment pages, rows in the article box) */
function groupRow(from, g, o = {}) {
  return `<li class="gc${g.role === 'primary' ? ' gc--main' : ''}"><a class="gc__a" href="${esc(posixRel(from, cenovnikUrl(g.id)))}"><span class="gc__no" aria-hidden="true">${g.idx + 1}</span><span class="gc__tx"><b>${esc(g.title)}</b><i>${esc(g.tabLabel)} · ${nUsluga(g.count)}</i></span>${arrowSpan}</a></li>`;
}

/* ----------------------------------------------------------------------------------------------------
   PAGES
   ---------------------------------------------------------------------------------------------------- */
function articlePage(a) {
  const from = artUrl(a), b = baseOf(from), seg = segById[a.segmentId], pn = prevNext(a), rel = relatedOf(a), groups = articleGroups(a);
  const h2s = [], ids = new Set();
  const idFor = (t) => { let s = 's-' + (slugify(t) || 'odeljak'), n = 2, base = s; while (ids.has(s)) s = base + '-' + n++; ids.add(s); return s; };
  const body = a.blocks.map((blk) => {
    if (blk.flag) return `<aside class="note note--flag"><p class="note__h">Napomena iz dokumenta, ne za objavu</p><p>${renderInline(blk.text, blk.links, from)}</p></aside>`;
    if (blk.type === 'h2') { const id = idFor(blk.text); h2s.push({ id, text: blk.text }); return `<h2 id="${id}">${renderInline(blk.text, [], from)}</h2>`; }
    if (blk.type === 'h3') return `<h3>${renderInline(blk.text, [], from)}</h3>`;
    if (blk.type === 'p') return `<p>${renderInline(blk.text, blk.links, from, { glue: true })}</p>`;
    if (blk.type === 'ul' || blk.type === 'ol') {
      const items = blk.items.map((it, i) => `<li>${renderInline(it, (blk.links || []).filter((l) => l.item === i), from)}</li>`).join('');
      return `<${blk.type}${blk.type === 'ul' ? ' class="plist"' : ''}>${items}</${blk.type}>`;
    }
    throw new Error('unknown block type ' + blk.type);
  }).join('\n      ');
  const toc = h2s.length >= 4 ? `<details class="toc"><summary><span>U ovom tekstu</span><span class="toc__ch" aria-hidden="true"><svg class="i"><use href="#i-chev"/></svg></span></summary><ol>${h2s.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol></details>` : '';
  const phNote = MARK_PLACEHOLDERS && a.hasPlaceholders
    ? `<aside class="note"><p class="note__h">Za dopunu</p><p>U ovom tekstu ${a.placeholders.length === 1 ? 'nedostaje' : 'nedostaju'} ${nMesto(a.placeholders.length)} (${[...new Set(a.placeholders.map((p) => p.kind))].join(', ')}). Označena su ljubičasto: <mark class="ph">[dopuniti: ...]</mark></p></aside>` : '';
  const primary = groups.filter((g) => g.role === 'primary'), related = groups.filter((g) => g.role !== 'primary');
  const aside = `<aside class="art__side" aria-label="Cenovnik i kontakt">
      <section class="pbox" aria-labelledby="pb-t">
        <h2 id="pb-t" class="pbox__t">U cenovniku</h2>
        <p class="pbox__s">Grupe usluga iz cenovnika koje se odnose na ovaj tekst. Svaka veza otvara i označava grupu.</p>
        <ul class="gcl">${primary.map((g) => groupRow(from, g)).join('')}</ul>
        ${related.length ? `<p class="pbox__sub">Povezano</p><ul class="gcl">${related.map((g) => groupRow(from, g)).join('')}</ul>` : ''}
        <a class="pbox__all" href="${esc(posixRel(from, 'index.html#usluge'))}">Ceo cenovnik ›</a>
      </section>
      <a class="sidelink" href="${esc(posixRel(from, segUrl(seg)))}"><span class="sidelink__tx"><span>Oblast</span><b>${esc(seg.name)}</b></span>${arrowSpan}</a>
    </aside>`;
  const pnHtml = (pn.prev || pn.next) ? `<nav class="pn sec" aria-label="Ostali tekstovi iz oblasti ${esc(seg.name)}"><div class="wrap pn__in">
${pn.prev ? `<a class="pn__a pn__a--prev" href="${esc(posixRel(from, artUrl(pn.prev)))}" rel="prev"><span class="pn__l">Prethodni tekst</span><b>${renderInline(pn.prev.title, [], from)}</b></a>` : '<span class="pn__gap"></span>'}
${pn.next ? `<a class="pn__a pn__a--next" href="${esc(posixRel(from, artUrl(pn.next)))}" rel="next"><span class="pn__l">Sledeći tekst</span><b>${renderInline(pn.next.title, [], from)}</b></a>` : '<span class="pn__gap"></span>'}
</div></nav>` : '';
  const main = `${phead(from, {
    crumbs: [{ label: 'Početna', href: 'index.html' }, { label: 'Blog', href: 'blog.html' }, { label: seg.name, href: 'blog.html#' + seg.id }, { label: stripTokens(a.title) }],
    eyebrow: esc(seg.name), h1: renderInline(a.title, [], from), sub: a.subtitle ? renderInline(a.subtitle, [], from) : '',
    meta: [readLabel(a)],
  })}
<article class="sec art" aria-labelledby="h1">
  <div class="wrap art__grid">
    <div class="art__col">
      ${phNote}
      ${toc}
      <div class="prose">
      ${body}
      </div>
      ${contactLine()}
    </div>
    ${aside}
  </div>
</article>
${pnHtml}
<section class="sec" aria-labelledby="rel-t">
  <div class="wrap">
    <header class="sec__head rv"><p class="eyebrow">Pročitajte i</p><h2 id="rel-t" class="h2">Povezani <em>tekstovi.</em></h2></header>
    <div class="bps">${rel.map((r, i) => blogCard(from, r, { i })).join('')}</div>
  </div>
</section>
${contactBlock(from, content.cta.blog, { waText: 'Zdravo, zanima me tretman iz teksta „' + stripTokens(a.title).replace(/[„“”"]/g, '') + '“ i želim da zakažem konsultaciju.' })}`;   // quotes inside the title would double the closing quotes
  return pageHtml(from, {
    title: stripTokens(a.title) + ' | ' + SITE_NAME,
    description: stripTokens(a.excerpt) || stripTokens(a.title),
    nav: 'blog', main, scripts: ['js/shell.js'], pageId: 'tekst' + a.id.replace('art-', ''), bodyData: ' data-art="' + a.id + '"',
  });
}

function blogPage() {
  const from = 'blog.html', sec = content.sections.blog;
  const chips = `<div class="blog__cats rv" role="group" aria-label="Oblasti tekstova" id="blogCats">
      <a class="fchip" href="#tekstovi" data-seg="sve" aria-current="true">Svi tekstovi · ${articles.length}</a>
${segments.map((s) => `      <a class="fchip" href="#${s.id}" data-seg="${s.id}">${esc(s.name)} · ${s.articleIds.length}</a>`).join('\n')}
    </div>`;
  const blocks = segments.map((s, si) => {
    const im = segHero(s.id), cut = im.type === 'cutout', sa = segArticles(s.id);
    return `<section class="bseg" id="${s.id}" data-seg="${s.id}" aria-labelledby="bs-${s.id}">
    <div class="sban${cut ? ' sban--cutout' : ''} rv">
      <div class="sban__tx">
        <p class="eyebrow">${si + 1} · ${nTekst(sa.length)}</p>
        <h2 id="bs-${s.id}" class="sban__t">${esc(s.name)}</h2>
        <p class="sban__s">${esc(s.intro.text)}</p>
        <a class="btn btn--line btn--sm" href="${esc(posixRel(from, segUrl(s)))}">Sve o oblasti ›</a>
      </div>
      <figure class="sban__img">${segImg(from, s.id, '(min-width:1024px) 420px, (min-width:640px) 45vw, 92vw', '', 800)}</figure>
    </div>
    <div class="bps">${sa.map((a, i) => blogCard(from, a, { i: i % 3 })).join('')}</div>
  </section>`;
  }).join('\n  ');
  const main = `${phead(from, {
    crumbs: [{ label: 'Početna', href: 'index.html' }, { label: 'Blog' }],
    eyebrow: esc(sec.eyebrow), h1: sec.titleHtml, sub: esc(sec.intro),
  })}
<section class="sec" id="tekstovi" aria-label="Svi tekstovi po oblastima">
  <div class="wrap">
    ${chips}
    <p class="sr" id="blogLive" role="status" aria-live="polite"></p>
    <div class="bseg-list" id="blogSegs">
  ${blocks}
    </div>
    ${contactLine()}
  </div>
</section>
${contactBlock(from, content.cta.blog)}`;
  return pageHtml(from, {
    title: 'Blog | ' + SITE_NAME,
    description: 'Tekstovi o tretmanima, procedurama i protokolima iz ponude Lepa Svaki Dan: dermatologija, estetske procedure, kozmetički tretmani i tretmani tela.',
    nav: 'blog', main, scripts: ['js/shell.js', 'js/blog.js'], pageId: 'blog',
  });
}

function segmentPage(s) {
  const from = segUrl(s), b = baseOf(from), im = segHero(s.id), cfg = SEGMENT_HERO[s.id] || {}, vid = SEGMENT_VIDEO[s.id] || {};
  const sa = segArticles(s.id), cut = im.type === 'cutout';
  const gl = s.priceList.groups.map((g) => ({ ...groupInfo(g.groupId), role: g.role })).filter((g) => g.id).sort((x, y) => (x.role === 'primary' ? 0 : 1) - (y.role === 'primary' ? 0 : 1));
  const first = gl[0];
  const others = segments.filter((x) => x.id !== s.id);
  const poster = `<img class="shero__poster" src="${imgSrc(im, b, 1200)}" srcset="${imgSrcset(im, b)}" sizes="100vw" width="${im.w}" height="${im.h}" alt="${esc(s.heroImage.alt || im.alt)}" fetchpriority="high" decoding="async">`;
  const preload = `<link rel="preload" as="image" type="image/webp" href="${imgSrc(im, b, 1200)}" imagesrcset="${imgSrcset(im, b)}" imagesizes="100vw" fetchpriority="high">\n`;
  const hero = `<section class="shero${cut ? ' shero--cutout' : ''}${cfg.side === 'right' ? ' shero--right' : ''}" id="top" aria-labelledby="h1" data-video="${esc(vid.mp4)}" data-video-webm="${esc(vid.webm)}" style="${cfg.pos ? '--pos:' + cfg.pos + ';' : ''}${cfg.posWide ? '--pos-wide:' + cfg.posWide + ';' : ''}">
  <div class="shero__media">
    ${poster}
  </div>
  <div class="shero__veil" aria-hidden="true"></div>
  <div class="wrap shero__in">
    <div class="shero__card bk a-head">
      ${crumbs(from, [{ label: 'Početna', href: 'index.html' }, { label: 'Tretmani', href: 'index.html#tretmani' }, { label: s.name }])}
      <p class="eyebrow">Tretmani</p>
      <h1 id="h1" class="shero__h1">${esc(s.name)}</h1>
      <p class="shero__intro">${esc(s.intro.text)}</p>
      <ul class="shero__facts"><li class="chip chip--lila">${nTekst(sa.length)}</li><li class="chip chip--lila">${nGrupa(gl.length)} u cenovniku</li></ul>
      <div class="shero__ctas"><a class="btn btn--ink" href="#tekstovi">Tekstovi</a><a class="btn btn--line" href="#cenovnik-oblasti">Usluge i cene</a></div>
    </div>
  </div>
  <button class="shero__pp" type="button" hidden aria-pressed="false" aria-label="Zaustavi video" data-pause="Zaustavi video" data-play="Pokreni video"><svg class="i i-pause" aria-hidden="true"><use href="#i-pause"/></svg><svg class="i i-play" aria-hidden="true"><use href="#i-play"/></svg></button>
</section>`;
  const main = `${hero}
<section class="sec" id="tekstovi" aria-labelledby="tx-t">
  <div class="wrap">
    <header class="sec__head rv"><p class="eyebrow">Tekstovi</p><h2 id="tx-t" class="h2">Saznajte više o oblasti <em>${esc(s.name)}.</em></h2></header>
    <div class="bps">${sa.map((a, i) => blogCard(from, a, { i: i % 3 })).join('')}</div>
  </div>
</section>
<section class="sec" id="cenovnik-oblasti" aria-labelledby="cn-t">
  <div class="wrap">
    <header class="sec__head rv"><p class="eyebrow">U cenovniku</p><h2 id="cn-t" class="h2">Usluge i <em>cene.</em></h2>
      <p class="sec__intro">Grupe iz cenovnika koje pripadaju ovoj oblasti. Svaka veza otvara i označava grupu u cenovniku.</p></header>
    <ul class="gcl gcl--grid rv">${gl.map((g) => groupRow(from, g)).join('')}</ul>
    <p class="gcl__all"><a class="btn btn--line" href="${esc(posixRel(from, 'index.html#usluge'))}">Ceo cenovnik ›</a></p>
    ${contactLine()}
  </div>
</section>
<section class="sec" aria-labelledby="ot-t">
  <div class="wrap">
    <header class="sec__head rv"><p class="eyebrow">Ostale oblasti</p><h2 id="ot-t" class="h2">Pogledajte i <em>ostalo.</em></h2></header>
    <ul class="gcl gcl--grid gcl--3 rv">${others.map((o) => `<li class="gc"><a class="gc__a" href="${esc(posixRel(from, segUrl(o)))}"><span class="gc__tx"><b>${esc(o.name)}</b><i>${nTekst(o.articleIds.length)}</i></span>${arrowSpan}</a></li>`).join('')}</ul>
  </div>
</section>
${contactBlock(from, FINAL_CTA)}`;
  return pageHtml(from, {
    title: s.name + ' | ' + SITE_NAME,
    description: s.intro.text,
    nav: 'tretmani', main, preload, scripts: ['js/shell.js'], bodyClass: 'has-shero', pageId: s.slug, bodyData: ' data-seg="' + s.id + '"',
  });
}

/* offers: js/offers-data.js is the editable source (seeded once from the content pack); this script renders the same markup the browser would */
function loadOffersModule() {
  const dataFile = path.join(SITE, 'js/offers-data.js');
  if (!fs.existsSync(dataFile)) seedOffers(dataFile);
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(dataFile, 'utf8'), sandbox, { filename: 'offers-data.js' });
  const mod = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(SITE, 'js/offers.js'), 'utf8'), { module: mod, LSDPrice: PRICE }, { filename: 'offers.js' });
  return { api: mod.exports, offers: sandbox.window.LSD_CONTENT.offers };
}
function seedOffers(file) {
  const q = (s) => JSON.stringify(s == null ? null : s);
  const items = content.offers.map((o) => `  {
    id: ${q(o.id)},
    slug: ${q(o.slug)},
    tag: ${q(o.tag)},
    title: ${q(o.title)},
    includes: ${q(o.includes)},
    price: ${q(o.price)},
    oldPrice: ${q(o.oldPrice)},
    validity: ${q(o.validity)},
    note: ${q(o.note)},
    cenovnikRef: { id: ${q(o.cenovnikRef && o.cenovnikRef.id)} },
    cta: { label: ${q(o.cta && o.cta.label)} }
  }`).join(',\n');
  fs.writeFileSync(file, `/* =====================================================================================================
   POSEBNA PONUDA · the data of every offer.   Pripremio ECHOSYSTEM-MOTHER AGENCY

   HOW TO ADD, EDIT OR REMOVE AN OFFER (and its price)
   - EDIT:   change the text between the quotes. The price is one string, "385€ / 45.000 rsd" (EUR, a slash with spaces, RSD).
   - ADD:    copy one whole { ... } block, paste it after the last one (keep the comma between blocks), give it a new id and slug.
   - REMOVE: delete its whole { ... } block (and the comma next to it).
   - ORDER:  the first block is shown as the large dark card, the others follow in this order.
   - The home page teaser and the page posebna-ponuda.html both read this list, so one edit changes both after a refresh.
   - After editing, run: node _tools/a/build-pages.mjs   (it re-renders the readable-without-JS copy of the page AND the search index from this file).

   FIELDS of one offer
     id, slug     unique names. The slug is the address of the card: posebna-ponuda.html#ponuda-<slug>
     tag          small label above the title
     title        name of the package
     includes     what the package includes (one sentence)
     price        "385€ / 45.000 rsd"   EUR, a slash with spaces around it, RSD
     oldPrice     optional crossed-out price, same pattern, or null
     validity     optional validity wording, e.g. "Važi do 30.11.2026.", or null. Shown only when filled in, so no validity is claimed otherwise
     note         optional small extra line, or null
     cenovnikRef  { id: "protokoli:2:1" } the price-list group (or service) of the package; it gives the link "U cenovniku"
     cta          { label: "Zakaži ovaj paket" } text of the button. It opens the small sheet with both numbers (call or WhatsApp); the WhatsApp text is the ready message
                  "Zdravo, zanima me paket „<title>“ i želim da zakažem termin." No address is stored or shown per package (one price list, client wish).

   Seeded once from the content pack (_shared/content/content.json, offers[]). This file is now the place to edit: the builder never
   overwrites it. Delete the file to seed it again from the pack.
   ===================================================================================================== */
window.LSD_CONTENT = window.LSD_CONTENT || {};
window.LSD_CONTENT.offers = [
${items}
];
`);
}

function offersPage() {
  const from = 'posebna-ponuda.html', { api, offers } = loadOffersModule(), sec = content.sections.offers;
  const main = `${phead(from, {
    crumbs: [{ label: 'Početna', href: 'index.html' }, { label: 'Posebna ponuda' }],
    eyebrow: esc(sec.eyebrow), h1: sec.titleHtml, sub: esc(sec.intro),
  })}
<section class="sec" id="paketi" aria-label="Paketi">
  <div class="wrap">
    <div class="pogrid" id="offers-list">${api.page(offers, { base: '' })}</div>
    ${PRICE_NOTE_SHOW ? `<p class="pnote rv">${esc(content.payment.note)} <a href="index.html#usluge">Pogledajte ceo cenovnik ›</a></p>` : ''}
    ${contactLine()}
  </div>
</section>
${contactBlock(from, content.cta.offers)}`;
  return pageHtml(from, {
    title: 'Posebna ponuda | ' + SITE_NAME,
    description: sec.intro,
    nav: 'ponuda', main, scripts: ['js/offers-data.js', 'js/offers.js', 'js/shell.js'], pageId: 'ponuda',
  });
}

/* ----------------------------------------------------------------------------------------------------
   HOME REGIONS (index.html): shell + generated sections
   ---------------------------------------------------------------------------------------------------- */
function homeSegments() {
  const from = 'index.html';
  return `<section class="sec" id="saznajte-vise" aria-labelledby="sv-title">
  <div class="wrap">
    <header class="sec__head rv">
      <p class="eyebrow">Saznajte više</p>
      <h2 id="sv-title" class="h2">Sve što treba da znate <em>pre tretmana.</em></h2>
      <p class="sec__intro">Izaberite oblast da pročitate tekstove o tretmanima i vidite odgovarajuće usluge u cenovniku.</p>
    </header>
    <div class="segs">
${segments.map((s, i) => segCard(from, s, i)).join('\n')}
    </div>
    ${contactLine()}
  </div>
</section>`;
}
function homeBlog() {
  const from = 'index.html', sec = content.sections.blog;
  const pop = artById[POPULAR];
  const picks = segments.map((s) => artById[HOME_PICKS[s.id]]);
  return `<section class="sec" id="blog" aria-labelledby="blog-title">
  <div class="wrap">
    <header class="sec__head rv">
      <p class="eyebrow">${esc(sec.eyebrow)}</p>
      <h2 id="blog-title" class="h2">${sec.titleHtml}</h2>
      <p class="sec__intro">${esc(sec.intro)}</p>
    </header>
    <div class="bps bps--home snap">
${blogCard(from, pop, { feat: true, label: 'Izdvajamo', i: 0 })}
${picks.map((a, i) => blogCard(from, a, { i: (i + 1) % 4 })).join('\n')}
    </div>
    <p class="blog__more"><a class="btn btn--line" href="blog.html">Svi tekstovi na blogu ›</a></p>
    ${contactLine()}
  </div>
</section>`;
}
function homeOffers() {
  const { api, offers } = loadOffersModule(), sec = content.sections.offers;
  return `<section class="sec" id="posebna-ponuda" aria-labelledby="off-title">
  <div class="wrap">
    <header class="sec__head rv">
      <p class="eyebrow">${esc(sec.eyebrow)}</p>
      <h2 id="off-title" class="h2">${sec.titleHtml}</h2>
      <p class="sec__intro">${esc(sec.intro)}</p>
    </header>
    <ul class="pts" id="offers-teaser">${api.teaser(offers, { base: '' })}</ul>
    <p class="blog__more"><a class="btn btn--line" href="posebna-ponuda.html">Svi paketi ›</a></p>
    ${contactLine()}
  </div>
</section>`;
}

/* LOKACIJE as a split (R12): two photos that touch, each half carries its concept, address, phone and WhatsApp (all from the contact data) */
const SPLIT_IMG = {
  nb: { base: 'location-novi-beograd', ws: [480, 800], w: 800, h: 800, pos: '50% 35%', alt: 'Terapeut masira leđa klijentkinje toplim biljnim jastučićima u svetlom salonu sa zelenim zidom.' },
  bw: { base: 'location-waterfront', ws: [480, 800, 1200], w: 1200, h: 685, pos: '50% 50%', alt: 'Žena zatvorenih očiju meditira u sedećem položaju na krznenom tepihu, okružena upaljenim svećama u toplo osvetljenoj sobi.' },
};
function homeLocations() {
  const sec = content.sections.locations;
  const half = (p, i) => {
    const im = SPLIT_IMG[p.key];
    return `      <article class="split__h${i === 0 ? ' is-on' : ''}" data-split="${i}" style="--pos:${im.pos}" aria-label="${p.concept}, ${p.area}">
        <img class="split__img" src="assets/img/${im.base}-800.webp" srcset="${im.ws.map((w) => 'assets/img/' + im.base + '-' + w + '.webp ' + w + 'w').join(', ')}" sizes="(min-width:1024px) 600px, 92vw" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" loading="lazy" decoding="async">
        <button class="split__pick" type="button" aria-label="Prikaži ${p.concept}, ${p.area}">${ico('plus')}<span class="split__vt">${p.concept}</span></button>
        <div class="split__info">
          <p class="eyebrow">Lokacija ${i + 1}</p>
          <h3 class="split__t"><span>${p.concept}</span> ${p.area}</h3>
          <ul class="split__rows">
            <li>${ico('pin')}<span>${p.address}</span></li>
            <li><a href="${p.tel}" aria-label="${phoneAria(p)}">${ico('phone')}<span>${p.display}</span></a></li>
            <li><a href="${p.wa}" target="_blank" rel="noopener" aria-label="WhatsApp ${p.concept}, ${p.area}">${ico('chat')}<span>WhatsApp</span></a></li>
            <li>${ico('clock')}<span>${HOURS}</span></li>
          </ul>
        </div>
      </article>`;
  };
  return `<section class="sec" id="lokacije" aria-labelledby="loc-title">
  <div class="wrap">
    <header class="sec__head rv">
      <p class="eyebrow">${esc(sec.eyebrow)}</p>
      <h2 id="loc-title" class="h2">1 filozofija, <em>2 lokacije.</em></h2>
      <p class="sec__intro">Dva koncepta, dve adrese. Tačnu lokaciju i slobodan termin dogovaramo prilikom zakazivanja.</p>
    </header>
    <div class="split rv" id="split" role="group" aria-label="Naše dve lokacije, ${PHONES.map((p) => p.concept).join(' i ')}">
${PHONES.map(half).join('\n')}
    </div>
  </div>
</section>`;
}

/* the final call to action of the home page (R13): the exact sentence, both numbers with WhatsApp, e-mail, Instagram */
function homeCta() {
  return contactBlock('index.html', FINAL_CTA);
}

/* THE INFO STRIP of the About block (client: "the strip stays, with the texts Tamara will send: statistics, information, working hours").
   THE NUMBERS AND LABELS COME FROM content.stats.items (value, suffix, display, label, icon) and the hours chip from content.contact.hours:
   DROP TAMARA'S REAL VALUES THERE (pack: _shared/content/_tools/apply-final-site.js), then rebuild. Nothing of it is typed in index.html. */
function stripHtml() {
  const items = content.stats.items;
  return `    <ul class="strip rv" aria-label="Lepa Svaki Dan u brojkama">
${items.map((it) => `      <li class="strip__it">
        <span class="strip__ico">${ico(it.icon)}</span>
        <span><b class="strip__num" data-count="${it.value}"${it.suffix ? ' data-suffix="' + esc(it.suffix) + '"' : ''}>${esc(it.display)}</b><span class="strip__lbl">${esc(it.label)}</span></span>
      </li>`).join('\n')}
      <li class="strip__chip">${ico('clock')}${HOURS}</li>
    </ul>`;
}

/* one gift / bestseller as a compact row: name, short text, price (dinars first) and a link to its row of the price list */
const serviceHref = (sid) => { const m = /^([a-z]+):(\d+):\d+$/.exec(sid); return m ? 'index.html?grupa=' + m[1] + '-' + m[2] + '&amp;usluga=' + encodeURIComponent(sid) + '#usluge' : 'index.html#usluge'; };
function bestsellerRow(g, i) {
  return `        <li class="bs__li rv" style="--i:${i % 4}">
          <a class="bs__a" href="${serviceHref(g.cenovnik.id)}" data-goto="${esc(g.cenovnik.id)}" aria-label="Pogledaj u cenovniku: ${esc(g.name)}">
            <span class="bs__tx"><b class="bs__n">${esc(g.name)}</b>${g.description ? `<span class="bs__d">${esc(g.description)}</span>` : ''}</span>
            ${PRICE.html(g.price)}
            <span class="bs__go" aria-hidden="true">${ico('arrow')}</span>
          </a>
        </li>`;
}

/* ABOUT: the info strip, then the card "Reč osnivača i posebne pogodnosti" (the About copy + the founder quote + the signature of Tamara Ćosić, osnivačica),
   next to the photo; BELOW the photo the compact block "Bestseller tretmani" (the former gift section, the gift items linked to their price-list rows). */
function homeAbout() {
  const A = content.about, Q = content.quote, F = content.founder, BS = content.sections.bestsellers, GI = content.sections.gifts;
  const qParts = Q.html.split(/<br\s*\/?>/i).map((x) => x.trim().replace(/^"/, '„').replace(/"$/, '“'));
  return `<div class="wrap">
${stripHtml()}

    <div class="about">
      <article class="tile tile--pale about__copy rv" aria-labelledby="about-title">
        <p class="eyebrow eyebrow--wrap">${esc(A.founderWord.eyebrow)}</p>
        <h2 id="about-title" class="h2">${A.titleHtml}</h2>
${A.paragraphs.map((t) => `        <p class="about__p">${esc(t)}</p>`).join('\n')}
        <figure class="about__quote bk bk--accent">
          <blockquote>
            <p class="about__qt">${qParts.map((x) => '<span class="qs">' + x.replace(/<em>/g, '<em>') + '</span>').join(' ')}</p>
            <p class="about__qp">${esc(Q.paragraph)}</p>
          </blockquote>
          <figcaption class="about__sig"><b>${esc(F.signature)}</b><span>${esc(F.signatureMeta)}</span></figcaption>
        </figure>
        <img class="about__mark" src="assets/logo/lsd-stacked-frame-grey.svg" width="126" height="91" alt="" loading="lazy" decoding="async">
      </article>
      <figure class="tile about__img rv" style="--i:1">
        <img src="assets/img/about-800.webp" srcset="assets/img/about-480.webp 480w, assets/img/about-800.webp 800w, assets/img/about-1200.webp 1200w"
             sizes="(min-width:1024px) 560px, 92vw" width="1200" height="800" loading="lazy" decoding="async"
             alt="Žena zatvorenih očiju opušteno leži na tretmanskom stolu dok joj terapeut masira vrat i rame, na belim peškirima.">
      </figure>
      <section class="tile about__best rv" style="--i:2" aria-labelledby="best-title">
        <p class="eyebrow eyebrow--wrap">${esc(BS.eyebrow)}</p>
        <h3 id="best-title" class="about__bt">${esc(BS.title)}</h3>
        <p class="about__bp">${esc(GI.intro)}</p>
        <ul class="bs">
${content.gifts.map(bestsellerRow).join('\n')}
        </ul>
      </section>
    </div>
    <!--@cline-->
${contactLine()}
<!--@/cline-->
  </div>`;
}

/* the sheets of the home: the payment note (opened by the "Plaćanje u dinarima" chip) and the ONE-TIME NOTICE that opens the first time a visitor reaches
   the price list (js/app.js: setupPriceNotice). ALL STRINGS come from content.payment (modal = the payment note, popup = the notice): the copy of the
   notice is provisional and is refined with the client in that ONE place. */
function homeSheets() {
  const m = content.payment.modal, pp = content.payment.popup;
  const x = `<svg class="i" aria-hidden="true"><use href="#i-x"/></svg>`;
  return `<!-- PAYMENT NOTE (home only; the chip "Plaćanje u dinarima" opens it) -->
<div class="sheet" id="paySheet" role="dialog" aria-modal="true" aria-labelledby="payTitle" hidden>
  <div class="sheet__scrim" data-close></div>
  <div class="sheet__panel">
    <button class="sheet__x" type="button" aria-label="${esc(m.closeAria)}" data-close>${x}</button>
    <h2 id="payTitle" class="sheet__t">${esc(m.title)}</h2>
${m.paragraphs.map((q) => `    <p>${q.html}</p>`).join('\n')}
    <button class="btn btn--ink" type="button" data-close>${esc(m.okLabel)}</button>
  </div>
</div>

<!-- PRICE-LIST NOTICE (home only; opens ONCE per session the first time the visitor reaches the price list) -->
<div class="sheet sheet--notice" id="priceNotice" role="dialog" aria-modal="true" aria-labelledby="pnTitle" hidden>
  <div class="sheet__scrim" data-close></div>
  <div class="sheet__panel">
    <button class="sheet__x" type="button" aria-label="${esc(pp.closeAria)}" data-close>${x}</button>
    <p class="eyebrow">${esc(pp.eyebrow)}</p>
    <h2 id="pnTitle" class="sheet__t" tabindex="-1" data-autofocus>${esc(pp.title)}</h2>
    <div class="nc">
      <section class="nc__b nc__b--pay" aria-labelledby="pnPay">
        <span class="nc__ico" aria-hidden="true">${ico('wallet')}</span>
        <div class="nc__tx">
          <h3 id="pnPay" class="nc__h">${esc(pp.paymentHeading)}</h3>
${m.paragraphs.map((q) => `          <p>${q.html}</p>`).join('\n')}
        </div>
      </section>
      <section class="nc__b nc__b--search" aria-labelledby="pnFind">
        <span class="nc__ico" aria-hidden="true">${ico('search')}</span>
        <div class="nc__tx">
          <h3 id="pnFind" class="nc__h">${esc(pp.searchHeading)}</h3>
          <p>${esc(pp.searchText)}</p>
          <div class="nc__acts">
            <button class="btn btn--lila btn--sm" id="pnSearch" type="button" data-close>${ico('search')}${esc(pp.searchButton)}</button>
            <button class="nc__link" type="button" data-search>${esc(pp.searchLink)}</button>
          </div>
        </div>
      </section>
    </div>
    <div class="nc__foot"><button class="btn btn--ink nc__ok" type="button" data-close>${esc(pp.okLabel)}</button></div>
  </div>
</div>`;
}

function replaceRegion(html, name, inner) {
  const open = '<!--@' + name + '-->', close = '<!--@/' + name + '-->';
  const a = html.indexOf(open), z = html.indexOf(close);
  if (a < 0 || z < 0) throw new Error('index.html is missing the markers ' + open + ' ... ' + close);
  return html.slice(0, a + open.length) + '\n' + inner + '\n' + html.slice(z);
}

/* a marker that occurs several times (the contact line under each home section), or inline (the hero sentence) */
function replaceAllRegions(html, name, inner) {
  const open = '<!--@' + name + '-->', close = '<!--@/' + name + '-->';
  let out = '', pos = 0, n = 0;
  for (;;) {
    const a = html.indexOf(open, pos); if (a < 0) break;
    const z = html.indexOf(close, a); if (z < 0) throw new Error('unclosed marker ' + open);
    out += html.slice(pos, a + open.length) + inner + html.slice(z, z + close.length); pos = z + close.length; n++;
  }
  if (!n) throw new Error('index.html has no marker ' + open);
  return out + html.slice(pos);
}

/* ----------------------------------------------------------------------------------------------------
   DATA FOR THE HOME (slim)
   ---------------------------------------------------------------------------------------------------- */
function pagesData() {
  const legacyTitle = {};
  articles.forEach((a) => { if (a.legacy && a.legacy.blogTitle) legacyTitle[a.legacy.blogTitle] = a.slug; });
  const data = {
    note: 'Generated by _tools/a/build-pages.mjs from the shared texts pack. Do not edit by hand.',
    segments: segments.map((s) => ({ id: s.id, slug: s.slug, name: s.name, intro: s.intro.text, articleIds: s.articleIds })),
    articles: articles.map((a) => ({ id: a.id, slug: a.slug, segmentId: a.segmentId, title: stripTokens(a.title), subtitle: a.subtitle, minutes: a.readMinutes })),
    /* old blog title (as stored on a price-list service as blogPost) -> article page */
    articleByLegacyTitle: legacyTitle,
    /* price-list group -> article pages that are about it (primary groups only) */
    groupArticles: Object.fromEntries(Object.entries(links.groups).map(([gid, g]) => [gid, (g.articleIds || []).map((id) => artById[id].slug)]).filter(([, v]) => v.length)),
  };
  return 'window.LSD_PAGES = ' + JSON.stringify(data) + ';\n';
}

/* ----------------------------------------------------------------------------------------------------
   WRITE
   ---------------------------------------------------------------------------------------------------- */
const written = [];
function write(rel, text) {
  const f = path.join(SITE, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== text) { fs.writeFileSync(f, text); written.push(rel); }
}

/* the placeholders of the 4 texts, for the report and for --public */
const blanks = articles.filter((a) => a.hasPlaceholders);
if (PUBLIC_BUILD && blanks.length) {
  console.error('PUBLIC BUILD REFUSED: ' + blanks.length + ' texts still contain [[dopuniti: ...]] blanks:');
  blanks.forEach((a) => console.error('  ' + a.id + ' ' + a.title + ': ' + a.placeholders.map((p) => p.kind).join(', ')));
  process.exit(1);
}

articles.forEach((a) => write(artUrl(a), articlePage(a)));
segments.forEach((s) => write(segUrl(s), segmentPage(s)));
write('blog.html', blogPage());
write('posebna-ponuda.html', offersPage());
write('assets/data/pages-data.js', pagesData());
const SI = searchIndexSource({ content, articles, segments, synonyms, offers: loadOffersModule().offers, stripTokens });
write('assets/search-index.js', SI.source);

let home = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
home = replaceRegion(home, 'shell:top', shellTop('index.html', ''));
home = replaceRegion(home, 'shell:bottom', shellBottom('index.html'));
home = replaceRegion(home, 'gen:about', homeAbout());
home = replaceRegion(home, 'gen:sheets', homeSheets());
home = replaceRegion(home, 'gen:segments', homeSegments());
home = replaceRegion(home, 'gen:blog', homeBlog());
home = replaceRegion(home, 'gen:offers', homeOffers());
home = replaceRegion(home, 'gen:locations', homeLocations());
home = replaceRegion(home, 'gen:cta', homeCta());
home = replaceAllRegions(home, 'cline', '\n' + contactLine() + '\n');
home = replaceAllRegions(home, 'herosub', esc(HERO_SUB));
home = replaceAllRegions(home, 'heroclaim', esc(CLAIM));
home = replaceAllRegions(home, 'phones', 'Pozovite nas na ' + PHONES.map((p) => `<a href="${p.tel}">${p.display}</a>`).join(' ili ') + '.');
write('index.html', home);

console.log('Search index: ' + SI.stats.groups + ' groups, ' + SI.stats.services + ' services, ' + SI.stats.articles + ' texts, ' + SI.stats.offers + ' offers, ' + SI.stats.entries + ' synonym entries, ' + SI.stats.phrases + ' hidden phrases' + (SI.stats.dropped.length ? ', DROPPED targets: ' + SI.stats.dropped.join('; ') : '') + '.');
console.log('Pages built: ' + articles.length + ' articles, ' + segments.length + ' segment pages, blog.html, posebna-ponuda.html; home regions refreshed.');
console.log('Files written (changed): ' + written.length + (written.length ? '' : ' (everything was already up to date)'));
if (copied.length) console.log('Images copied from the media pack: ' + copied.join(', '));
console.log('Texts with blanks to fill in (' + blanks.length + '): ' + blanks.map((a) => a.id + ' ' + a.placeholders.length).join(', '));
