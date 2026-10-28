#!/usr/bin/env node
/* ============================================================================
   build-content.js : Lepa Svaki Dan v2 CONTENT PACK builder
   ----------------------------------------------------------------------------
   Reads the OLD site (index.html, blog.html, posebna-ponuda.html), pulls the
   real JS data structures out of the source and evaluates them in a vm sandbox
   (nothing is retyped by hand), parses the static markup copy, then writes:
     ../content.json   ../content.js   ../COPY_NOTES.md   ../MANIFEST.md
   The shared content fixes (owner title, dashes, see content-fixes.js and
   CHANGES.md) are applied in memory right after the data is assembled, so every
   regeneration reproduces them. Then runs the independent verifier
   (verify-content.js) and embeds its report in MANIFEST.md.

   Usage:  node build-content.js
   ECHOSYSTEM-MOTHER AGENCY
   ============================================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const FX = require('./content-fixes.js');

const OLD_DIR = process.env.LSD_OLD_DIR || '/Users/vladajovic/Developer/LEPA SVAKI DAN/lepasvakidrugidan';
const OUT_DIR = path.resolve(__dirname, '..');
const SRC = {
  index: path.join(OLD_DIR, 'index.html'),
  blog: path.join(OLD_DIR, 'blog.html'),
  offers: path.join(OLD_DIR, 'posebna-ponuda.html'),
};
const read = (p) => fs.readFileSync(p, 'utf8');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const RAW = { index: read(SRC.index), blog: read(SRC.blog), offers: read(SRC.offers) };

/* ------------------------------------------------------------------ helpers */
function fail(msg) { throw new Error('EXTRACT FAIL: ' + msg); }

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
/* Rich fragment -> { text, html }.
   html: only <em> (= old "font-display-italic text-lila" accent), <strong>, <br> survive; source entities kept.
   text: plain, <br> -> "\n", entities decoded. */
function rich(fragment) {
  let h = fragment
    .replace(/<span class="font-display-italic text-lila">([\s\S]*?)<\/span>/g, '<em>$1</em>')
    .replace(/ style="[^"]*"/g, '')
    .replace(/<br\s*\/?>/g, '<br>')
    .replace(/\s+/g, ' ')
    .replace(/\s*<br>\s*/g, '<br>')
    .trim();
  let t = h.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
  t = decode(t).replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').trim();
  return { text: t, html: h };
}
const plain = (fragment) => rich(fragment).text;

function sectionBy(html, openRe) {
  const m = openRe.exec(html);
  if (!m) fail('section not found ' + openRe);
  const end = html.indexOf('</section>', m.index);
  if (end < 0) fail('section end not found ' + openRe);
  return html.slice(m.index, end);
}
/* first element (leaf) whose class attr contains token */
function elByClass(html, token, tag) {
  const t = tag || '[a-z0-9]+';
  const re = new RegExp('<(' + t + ')\\b[^>]*class="[^"]*\\b' + token.replace(/[-]/g, '\\-') + '\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/\\1>');
  const m = re.exec(html);
  if (!m) fail('element .' + token + ' not found');
  return m[2];
}
function allByClass(html, token, tag) {
  const t = tag || '[a-z0-9]+';
  const re = new RegExp('<(' + t + ')\\b[^>]*class="[^"]*\\b' + token.replace(/[-]/g, '\\-') + '\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/\\1>', 'g');
  return [...html.matchAll(re)].map((m) => m[2]);
}
function attr(tagHtml, name) {
  const m = new RegExp('\\b' + name + '="([^"]*)"').exec(tagHtml);
  return m ? decode(m[1]) : null;
}
function grab(html, re, label) {
  const m = re.exec(html);
  if (!m) fail('pattern not found: ' + (label || re));
  return m;
}

/* balanced scan of a JS const initializer (strings/comments aware) */
function constExpr(script, name) {
  const marker = 'const ' + name + ' =';
  const at = script.indexOf(marker);
  if (at < 0) fail('const not found: ' + name);
  let i = at + marker.length;
  const start = i;
  let depth = 0;
  while (i < script.length) {
    const c = script[i], n = script[i + 1];
    if (c === '/' && n === '/') { i = script.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && n === '*') { i = script.indexOf('*/', i) + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < script.length && script[i] !== q) { if (script[i] === '\\') i++; i++; }
      i++; continue;
    }
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') depth--;
    else if (c === ';' && depth === 0) return script.slice(start, i).trim();
    i++;
  }
  fail('unterminated const ' + name);
}
function scriptOf(html) {
  const m = /<script>([\s\S]*?)<\/script>/.exec(html);
  if (!m) fail('no inline script');
  return m[1];
}
const SCRIPT = { index: scriptOf(RAW.index), blog: scriptOf(RAW.blog), offers: scriptOf(RAW.offers) };

function evalConst(script, name, sandbox) {
  return vm.runInNewContext('(' + constExpr(script, name) + ')', sandbox || {});
}
/* JSON round trip: drops functions, detaches vm-realm prototypes */
const clean = (o) => JSON.parse(JSON.stringify(o));

const TRANSLIT = { 'č': 'c', 'ć': 'c', 'š': 's', 'ž': 'z', 'đ': 'dj', 'Č': 'c', 'Ć': 'c', 'Š': 's', 'Ž': 'z', 'Đ': 'dj' };
function slugify(s) {
  return s.replace(/[čćšžđČĆŠŽĐ]/g, (c) => TRANSLIT[c]).toLowerCase()
    .replace(/™|®/g, '').replace(/&/g, ' i ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
/* "51€ / 6.000 rsd" -> numeric ranges. 'na upit' / em dash placeholder -> onRequest */
function parsePrice(p) {
  if (p == null || p === '\u2014' || /na upit/i.test(p)) return { onRequest: true, eur: null, rsd: null };
  const slash = p.indexOf('/');
  const eurPart = slash >= 0 ? p.slice(0, slash) : p;
  const rsdPart = slash >= 0 ? p.slice(slash + 1) : '';
  const nums = (s) => [...s.matchAll(/\d[\d.]*/g)].map((m) => parseInt(m[0].replace(/\./g, ''), 10));
  const e = nums(eurPart), r = nums(rsdPart);
  return {
    onRequest: false,
    eur: e.length ? { min: Math.min(...e), max: Math.max(...e) } : null,
    rsd: r.length ? { min: Math.min(...r), max: Math.max(...r) } : null,
  };
}
function durationOf(...texts) {
  for (const t of texts) {
    const m = t && /(\d+)\s*min\b/i.exec(t);
    if (m) return m[1] + ' min';
  }
  return null;
}

/* ====================================================================== DATA */
/* ---- index.html JS data (evaluated, not retyped) ---- */
const ICON_NAMES = ['SPARKLE', 'LEAF', 'DROPLET', 'CONTOUR', 'FEATHER', 'GEM', 'BLOOM', 'BLOSSOM', 'WAVES', 'BALANCE', 'FLAME'];
const iconSandbox = {};
ICON_NAMES.forEach((n) => { iconSandbox['ICON_' + n] = evalConst(SCRIPT.index, 'ICON_' + n); });

const pricingTabsSrc = clean(evalConst(SCRIPT.index, 'pricingTabs'));
const laserGroupsSrc = clean(evalConst(SCRIPT.index, 'laserGroups'));
const verticalsSrc = clean(evalConst(SCRIPT.index, 'verticals'));
const testimonialsSrc = clean(evalConst(SCRIPT.index, 'testimonials'));
const favoritesSrc = clean(evalConst(SCRIPT.index, 'FAVORITES_PICKS'));
const giftsSrc = clean(evalConst(SCRIPT.index, 'GIFT_PICKS'));
const offersIndexSrc = clean(evalConst(SCRIPT.index, 'OFFERS_INDEX'));
const tagRulesSrc = clean(evalConst(SCRIPT.index, 'TAG_RULES'));
const tagRulesBlogSrc = clean(evalConst(SCRIPT.blog, 'TAG_RULES'));
const synonymsSrc = clean(evalConst(SCRIPT.index, 'SEARCH_SYNONYMS'));
const synonymsBlogSrc = clean(evalConst(SCRIPT.blog, 'SEARCH_SYNONYMS'));
const quizSrcRaw = evalConst(SCRIPT.index, 'QUIZ_QUESTIONS', iconSandbox);
const serviceBlogRulesRaw = evalConst(SCRIPT.index, 'SERVICE_BLOG_LINKS');
const specialOffersSrc = clean(evalConst(SCRIPT.offers, 'specialOffers'));
const blogPostsSrc = clean(evalConst(SCRIPT.blog, 'blogPosts'));
const blogCategoriesSrc = clean(evalConst(SCRIPT.blog, 'BLOG_CATEGORIES'));

const warnings = [];
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
if (!sameJson(tagRulesSrc, tagRulesBlogSrc)) warnings.push('TAG_RULES differ between index.html and blog.html.');
if (!sameJson(synonymsSrc, synonymsBlogSrc)) warnings.push('SEARCH_SYNONYMS differ between index.html and blog.html.');
if (!sameJson(offersIndexSrc.map((o) => ({ title: o.title, description: o.description, price: o.price, tagLabel: o.tagLabel })),
  specialOffersSrc.map((o) => ({ title: o.title, description: o.description, price: o.price, tagLabel: o.tag })))) {
  warnings.push('OFFERS_INDEX (index.html) differs from specialOffers (posebna-ponuda.html).');
}

/* SERVICE_BLOG_LINKS: keep rule as substring + title; verify by calling the real fn */
const serviceBlogRules = serviceBlogRulesRaw.map((r) => {
  const src = r.match.toString();
  const sub = /includes\((["'])(.*?)\1\)/.exec(src);
  if (!sub) fail('cannot read SERVICE_BLOG_LINKS match fn: ' + src);
  return { matchFn: r.match, matchSubstring: sub[2], matchSource: src, postTitle: r.postTitle };
});
const blogLinkOf = (name) => { const r = serviceBlogRules.find((x) => x.matchFn(name)); return r ? r.postTitle : null; };

/* TAG derivation = identical logic to old deriveTags() */
const deriveTags = (text) => {
  const lower = (text || '').toLowerCase();
  return tagRulesSrc.filter((r) => r.match.some((m) => lower.includes(m))).map((r) => r.tag);
};

/* ------------------------------------------------------------ index markup */
const H = RAW.index;
const metaOf = (html) => ({
  title: decode(grab(html, /<title>([\s\S]*?)<\/title>/, 'title')[1]),
  description: decode(grab(html, /<meta name="description" content="([^"]*)"/, 'description')[1]),
});

/* nav */
const navHome = grab(H, /<div class="nav-links">([\s\S]*?)<\/div>/, 'nav-links')[1];
const navSub = grab(RAW.offers, /<div class="nav-links">([\s\S]*?)<\/div>/, 'nav-links(sub)')[1];
const navLinksHome = [...navHome.matchAll(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ label: plain(m[2]), href: m[1] }));
const navLinksSub = [...navSub.matchAll(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ label: plain(m[2]), href: m[1] }));
if (navLinksHome.length !== navLinksSub.length) fail('nav link count mismatch');
const navLinks = navLinksHome.map((l, i) => ({ label: l.label, hrefOnHome: l.href, hrefFromSubpage: navLinksSub[i].href }));

const phoneItems = [...grab(H, /<div class="nav-phone-menu" id="nav-phone-menu">([\s\S]*?)<\/div>\s*<\/div>\s*<a href="https:\/\/wa\.me\/[^"]*" target="_blank" rel="noreferrer" class="nav-cta">/, 'phone menu')[1]
  .matchAll(/<div class="nav-phone-item">([\s\S]*?)<div class="nav-phone-item-actions">([\s\S]*?)<\/div>\s*<\/div>/g)].map((m) => {
  const head = m[1], act = m[2];
  const tel = grab(act, /<a href="(tel:[^"]*)" class="nav-phone-action call">([\s\S]*?)<\/a>/, 'tel');
  const wa = grab(act, /<a href="(https:\/\/wa\.me\/[^"]*)"[^>]*class="nav-phone-action wa">([\s\S]*?)<\/a>/, 'wa');
  return {
    area: plain(elByClass(head, 'nav-phone-item-loc')),
    display: plain(elByClass(head, 'nav-phone-item-num')),
    telHref: tel[1], telLabel: plain(tel[2]),
    whatsappHref: wa[1], whatsappLabel: plain(wa[2]),
  };
});
if (phoneItems.length !== 2) fail('expected 2 phone items, got ' + phoneItems.length);
const navCta = grab(H, /<a href="([^"]*)"[^>]*class="nav-cta"><span class="nav-cta-short">([\s\S]*?)<\/span><span class="nav-cta-full">([\s\S]*?)<\/span><\/a>/, 'nav-cta');
const phoneBtnText = plain(elByClass(H, 'nav-phone-btn-text'));

/* hero */
const heroSec = sectionBy(H, /<section class="hero">/);
const heroPhrases = (() => {
  const marker = 'const PHRASES =';
  const at = SCRIPT.index.indexOf(marker);
  if (at < 0) fail('marker not found ' + marker);
  const from = SCRIPT.index.indexOf('[', at);
  let d = 0, i = from;
  for (; i < SCRIPT.index.length; i++) { if (SCRIPT.index[i] === '[') d++; else if (SCRIPT.index[i] === ']') { d--; if (d === 0) break; } }
  return vm.runInNewContext('(' + SCRIPT.index.slice(from, i + 1) + ')');
})().map((p) => {
  const r = rich(p.html || p.text);
  const out = { text: r.text, holdMs: p.hold };
  if (p.html) { out.html = r.html.replace(/<span class="shine-word">([\s\S]*?)<\/span>/, '<em>$1</em>'); out.accent = plain(/<span class="shine-word">([\s\S]*?)<\/span>/.exec(p.html)[1]); }
  return out;
});
const heroBarValues = allByClass(heroSec, 'hero-bar-value').map(plain);
const heroBarLabels = allByClass(heroSec, 'hero-bar-label').map(plain);
const heroCtas = [...heroSec.matchAll(/<a href="([^"]*)" class="btn (btn-[a-z]+)">([\s\S]*?)<\/a>/g)].map((m) => ({ label: plain(m[3]), href: m[1], style: m[2] }));
const heroSearchPlaceholder = decode(grab(heroSec, /id="search-input-hero" placeholder="([^"]*)"/, 'hero placeholder')[1]);

/* about / founder */
const aboutSec = sectionBy(H, /<section id="o-nama"/);
const aboutCopyBlock = grab(aboutSec, /<div class="about-copy">([\s\S]*?)<div class="stats-row/, 'about-copy')[1];
const aboutParas = [...aboutCopyBlock.matchAll(/<p class="copy reveal">([\s\S]*?)<\/p>/g)].map((m) => plain(m[1]));
const aboutTitle = rich(grab(aboutCopyBlock, /<h2 class="section-title reveal">([\s\S]*?)<\/h2>/, 'about h2')[1]);
const statItems = [...aboutSec.matchAll(/<span class="stat-value counter" data-target="(\d+)" data-suffix="([^"]*)">[^<]*<\/span><div class="stat-label">([\s\S]*?)<\/div>/g)].map((m) => {
  const value = parseInt(m[1], 10);
  return { value, suffix: m[2], display: value.toLocaleString('sr-RS') + m[2], label: plain(m[3]) };
});
if (statItems.length !== 3) fail('expected 3 stats');
const founderGrid = grab(aboutSec, /<div class="founder-grid">([\s\S]*)$/, 'founder-grid')[1];
const founderQuote = rich(grab(founderGrid, /<h3 class="founder-quote reveal">([\s\S]*?)<\/h3>/, 'founder quote')[1]);

/* locations */
const locSec = sectionBy(H, /<section id="lokacije"/);
function captionOf(side) {
  const m = new RegExp('<div class="split-caption ' + side + '">([\\s\\S]*?)</div>\\s*(?:</div>|<div class="split)').exec(locSec);
  if (!m) fail('caption ' + side);
  return {
    eyebrow: plain(elByClass(m[1] + '</div>', 'loc-eyebrow')),
    concept: plain(elByClass(m[1] + '</div>', 'loc-name')),
    area: plain(elByClass(m[1] + '</div>', 'loc-sub')),
    address: plain(elByClass(m[1] + '</div>', 'loc-addr')),
  };
}
const capL = captionOf('left'), capR = captionOf('right');
const coinFaceRe = /<div class="coin-face( back)?">([\s\S]*?)<\/div>\s*<\/div>\s*(?=<div class="coin-face back">|<\/div>\s*<\/button>)/g;
const coinFaces = [...locSec.matchAll(coinFaceRe)].map((m) => {
  const b = m[2];
  const ph = grab(b, /<div class="phone"><a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/, 'coin phone');
  return {
    tag: plain(elByClass(b, 'tag')), concept: plain(elByClass(b, 'name')), area: plain(elByClass(b, 'sub')),
    address: plain(elByClass(b, 'addr')), phoneDisplay: plain(ph[2]), whatsappHref: ph[1],
    image: attr(grab(b, /<img [^>]*>/, 'coin img')[0], 'src'),
  };
});
if (coinFaces.length !== 2) fail('expected 2 coin faces, got ' + coinFaces.length);
const locSubDesktop = grab(SCRIPT.index, /sub\.textContent = window\.innerWidth >= 1024\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)";/, 'locations sub');
const locHeadH2 = rich(grab(locSec, /<h2 class="section-title section-title-md reveal">([\s\S]*?)<\/h2>/, 'loc h2')[1]);

/* cenovnik */
const priceSec = sectionBy(H, /<section id="usluge"/);
const priceH2 = rich(grab(priceSec, /<h2 class="section-title reveal"[^>]*>([\s\S]*?)<\/h2>/, 'price h2')[1]);
const priceContactNote = rich(grab(priceSec, /<div class="laser-note laser-note-contact reveal"[^>]*>([\s\S]*?)<\/div>/, 'contact note')[1]);
const priceFootParas = [...grab(priceSec, /<div class="cenovnik-footnote">([\s\S]*?)<\/div>/, 'footnote')[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => rich(m[1]));
const validFrom = grab(priceFootParas[1].html, /<strong>(\d{2}\.\d{2}\.\d{4}\.)<\/strong>/, 'valid from')[1];
const laserNote = rich('<strong>Laserska epilacija</strong>' + grab(SCRIPT.index, /<div class="laser-note"><strong[^>]*>Laserska epilacija<\/strong>([\s\S]*?)<\/div>/, 'laser note')[1]);

/* picks / quiz / verticals / testimonials sections */
const favSec = sectionBy(H, /<section id="favoriti"/), giftSec = sectionBy(H, /<section id="pokloni"/);
const quizSec = sectionBy(H, /<section id="pronadji-ritual"/), vertSec = sectionBy(H, /<section id="tretmani"/), testSec = sectionBy(H, /<section id="utisci"/);
const secHead = (sec, withIntro) => ({
  eyebrow: plain(elByClass(sec, 'eyebrow')),
  title: rich(grab(sec, /<h2 class="section-title[^"]*reveal"[^>]*>([\s\S]*?)<\/h2>/, 'h2')[1]),
  intro: withIntro ? plain(grab(sec, /<p class="copy reveal"[^>]*>([\s\S]*?)<\/p>/, 'intro')[1]) : null,
});
const flat = (h) => ({ eyebrow: h.eyebrow, title: h.title.text, titleHtml: h.title.html, intro: h.intro });

/* cta bands (3 pages) */
function ctaOf(html) {
  const sec = sectionBy(html, /<section class="cta-band bg-onyx">/);
  const h2 = rich(grab(sec, /<h2 class="reveal">([\s\S]*?)<\/h2>/, 'cta h2')[1]);
  const btns = [...sec.matchAll(/<a href="([^"]*)"[^>]*class="btn (btn-[a-z-]+)">([\s\S]*?)<\/a>/g)].map((m) => ({ label: plain(m[3]), href: m[1], style: m[2] }));
  return {
    eyebrow: plain(grab(sec, /<div class="cta-eyebrow reveal"><span class="rule"><\/span>([\s\S]*?)<span class="rule"><\/span><\/div>/, 'cta eyebrow')[1]),
    headline: h2.text, headlineHtml: h2.html,
    body: plain(grab(sec, /<p class="reveal">([\s\S]*?)<\/p>/, 'cta p')[1]),
    buttons: btns,
    backgroundImage: attr(grab(sec, /<img class="cta-bg"[^>]*>/, 'cta-bg')[0], 'src'),
  };
}

/* footer */
const footer = grab(H, /<footer>([\s\S]*?)<\/footer>/, 'footer')[1];
const footerLinks = (colRe) => [...grab(footer, colRe, 'footer col')[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
const footerContact = footerLinks(/Kontakt<\/div>\s*<ul class="footer-list">([\s\S]*?)<\/ul>/).map((li) => {
  const a = grab(li, /<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/, 'footer a'); return { label: plain(a[2]), href: a[1] };
});
const footerSocial = footerLinks(/Pratite nas<\/div>\s*<ul class="footer-list">([\s\S]*?)<\/ul>/).map((li) => {
  const a = grab(li, /<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/, 'footer a'); return { label: plain(a[2]), href: a[1] };
});
const footerLocs = footerLinks(/Lokacije<\/div>\s*<ul class="footer-list">([\s\S]*?)<\/ul>/).map((li) => ({
  concept: plain(elByClass(li, 'loc-name')), address: plain(li.replace(/<div class="loc-name">[\s\S]*?<\/div>/, '')),
}));
const footerBrand = rich(elByClass(footer, 'footer-brand'));
const footerBottom = grab(footer, /<div class="footer-bottom">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*$/, 'footer-bottom');

/* payment modal */
const payModal = grab(H, /<div class="payment-modal">([\s\S]*?)<button class="payment-modal-ok"[^>]*>([\s\S]*?)<\/button>/, 'payment modal');
const payTitle = plain(grab(payModal[1], /<h3>([\s\S]*?)<\/h3>/, 'pay h3')[1]);
const payParas = [...payModal[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => rich(m[1]));

/* UI strings that live in JS templates / markup */
const ui = {
  highlightBadge: plain(grab(SCRIPT.index, /<span class="svc-highlight">([\s\S]*?)<\/span>/, 'highlight badge')[1]),
  articleHint: plain(grab(SCRIPT.index, /<span class="svc-article-hint">([\s\S]*?)<\/span>/, 'article hint')[1]),
  groupCountSuffix: grab(SCRIPT.index, /\$\{group\.services\.length\} ([^<]+)<\/span>/, 'group count')[1].trim(),
  laserTableHeadService: plain(grab(SCRIPT.index, /<div class="laser-head-row"><span>([\s\S]*?)<\/span><span[^>]*>([\s\S]*?)<\/span>/, 'laser head')[1]),
  laserTableHeadPrice: plain(grab(SCRIPT.index, /<div class="laser-head-row"><span>([\s\S]*?)<\/span><span[^>]*>([\s\S]*?)<\/span>/, 'laser head')[2]),
  searchEmptyTemplate: grab(SCRIPT.index, /<div class="search-empty">([\s\S]*?)<\/div>/, 'search empty')[1].replace('${esc(query)}', '{query}'),
  searchTypeTreatment: plain(grab(SCRIPT.index, /<span class="search-result-type">([\s\S]*?)<\/span>/, 'type treatment')[1]),
  searchTypeOffer: plain(grab(SCRIPT.index, /<span class="search-result-type text">([\s\S]*?)<\/span>/, 'type offer')[1]),
  searchTypeText: plain(grab(SCRIPT.blog, /<span class="search-result-type text">([\s\S]*?)<\/span>/, 'type text')[1]),
  pickTagFavorite: grab(SCRIPT.index, /renderPickGrid\("favorites-grid", FAVORITES_PICKS, "([^"]*)"\)/, 'fav tag')[1],
  pickTagGift: grab(SCRIPT.index, /renderPickGrid\("gifts-grid", GIFT_PICKS, "([^"]*)"\)/, 'gift tag')[1],
  bentoLinkLabel: plain(grab(SCRIPT.index, /<span class="bento-link">\s*([\s\S]*?)\s*<svg/, 'bento link')[1]),
  bentoLocationLabels: (() => { const m = grab(SCRIPT.index, /const locLabel = \{ beauty:"([^"]*)", wellbeing:"([^"]*)", both:"([^"]*)" \};/, 'locLabel'); return { beauty: m[1], wellbeing: m[2], both: m[3] }; })(),
  backToTopAria: attr(grab(H, /<button id="back-to-top"[^>]*>/, 'back to top')[0], 'aria-label'),
  burgerAria: attr(grab(H, /<button class="nav-burger"[^>]*>/, 'burger')[0], 'aria-label'),
  phoneButtonAria: attr(grab(H, /<button class="nav-phone-btn"[^>]*>/, 'phone btn')[0], 'aria-label'),
  coinAria: attr(grab(H, /<button class="coin" id="coin-btn"[^>]*>/, 'coin btn')[0], 'aria-label'),
  testimonialPrevAria: attr(grab(SCRIPT.index, /<button class="t-arrow" id="t-prev"[^>]*>/, 'prev')[0], 'aria-label'),
  testimonialNextAria: attr(grab(SCRIPT.index, /<button class="t-arrow" id="t-next"[^>]*>/, 'next')[0], 'aria-label'),
  modalCloseAria: attr(grab(H, /<button class="payment-modal-close"[^>]*>/, 'modal close')[0], 'aria-label'),
};

/* quiz UI strings */
const quizUi = {
  stepLabelDone: grab(SCRIPT.index, /isDone \? "([^"]*)" :/, 'quiz done label')[1],
  resultsEyebrow: plain(grab(SCRIPT.index, /<div class="quiz-results-head">\s*<div class="eyebrow eyebrow-center">([\s\S]*?)<\/div>/, 'quiz res eyebrow')[1]),
  resultsTitle: (() => { const r = rich(grab(SCRIPT.index, /<div class="quiz-results-head">[\s\S]*?<h3>([\s\S]*?)<\/h3>/, 'quiz res h3')[1]); return r; })(),
  resultsSub: plain(grab(SCRIPT.index, /<div class="quiz-results-head">[\s\S]*?<p>([\s\S]*?)<\/p>/, 'quiz res p')[1]),
  emptyText: rich(grab(SCRIPT.index, /<div class="quiz-empty">([\s\S]*?)<\/div>/, 'quiz empty')[1]),
  fullListLabel: plain(grab(SCRIPT.index, /<a href="#usluge" class="btn btn-lila">([\s\S]*?)<\/a>/, 'quiz full list')[1]),
  resetLabel: plain(grab(SCRIPT.index, /<button class="btn btn-outline" id="quiz-reset">([\s\S]*?)<\/button>/, 'quiz reset')[1]),
  matchLabel: grab(SCRIPT.index, /<span>Match \$\{r\.score\}<\/span>/, 'match label') && 'Match',
};
const quizQuestions = quizSrcRaw.map((q) => ({
  id: q.id, prompt: q.prompt,
  options: q.options.map((o) => ({
    key: o.key, label: o.label,
    iconKey: ICON_NAMES.find((n) => iconSandbox['ICON_' + n] === o.icon).toLowerCase(),
    keywords: [...o.keywords],
  })),
}));
const quizIcons = {};
ICON_NAMES.forEach((n) => { quizIcons[n.toLowerCase()] = iconSandbox['ICON_' + n]; });

/* testimonial UI (home) */
const testimonialUi = {
  autoRotateMs: parseInt(grab(SCRIPT.index, /tAutoTimer = setTimeout\(function tick\(\)\{[\s\S]*?\}, (\d+)\);/, 'auto rotate')[1], 10),
};

/* ---------------------------------------------------------- services model */
const LOC_LABEL = { nb: 'Novi Beograd', bw: 'Belgrade Waterfront', both: 'Obe lokacije' };
const allServices = [];
const seenSlugs = new Map();
function uniqueSlug(base) {
  const n = (seenSlugs.get(base) || 0) + 1; seenSlugs.set(base, n);
  return n === 1 ? base : base + '-' + n;
}

function enrichStandard(svc, tab, g, gi, si) {
  const id = `${tab.id}:${gi}:${si}`;
  const tags = deriveTags(svc.name + ' ' + (svc.description || ''));
  const pr = parsePrice(svc.price);
  const bl = blogLinkOf(svc.name);
  const out = { id, slug: uniqueSlug(slugify(tab.id + '-' + g.title + '-' + svc.name)), ...svc };
  out.priceEur = pr.eur; out.priceRsd = pr.rsd; out.onRequest = pr.onRequest;
  out.duration = durationOf(svc.name, svc.description);
  out.tags = tags;
  out.blogPost = bl;
  allServices.push({
    id, tab: tab.id, tabLabel: tab.label, group: g.title, name: svc.name,
    description: svc.description || null, price: svc.price, priceEur: pr.eur, priceRsd: pr.rsd, onRequest: pr.onRequest,
    duration: out.duration, location: svc.location, locationLabel: LOC_LABEL[svc.location],
    tags, highlight: !!svc.highlight, note: svc.note || null, blogPost: bl,
  });
  return out;
}
const unifiedLaserPrice = (svc) => { /* identical logic to old unifiedLaserPrice() */
  const first = (s) => { if (!s || s === '\u2014') return null; const m = s.split('/')[0].match(/[\d.]+/); return m ? parseInt(m[0].replace(/\./g, ''), 10) : null; };
  const nb = first(svc.priceNB), bw = first(svc.priceBW);
  if (nb === null && bw === null) return 'na upit';
  if (nb === null) return svc.priceBW;
  if (bw === null) return svc.priceNB;
  if (nb === bw) return svc.priceNB;
  return 'od ' + (nb < bw ? svc.priceNB : svc.priceBW);
};
function enrichLaser(svc, tab, g, gi, si) {
  const id = `${tab.id}:${gi}:${si}`;
  const price = unifiedLaserPrice(svc);
  const hasNB = svc.priceNB !== '\u2014', hasBW = svc.priceBW !== '\u2014';
  const location = hasNB && hasBW ? 'both' : hasNB ? 'nb' : 'bw';
  const tags = deriveTags(svc.name); /* old performSearch tags laser rows from the name only */
  const pr = parsePrice(price.replace(/^od /, ''));
  const out = { id, slug: uniqueSlug(slugify(tab.id + '-' + g.title + '-' + svc.name)), ...svc,
    price, priceFrom: price.startsWith('od '), location,
    priceNBParsed: parsePrice(svc.priceNB), priceBWParsed: parsePrice(svc.priceBW), tags };
  allServices.push({
    id, tab: tab.id, tabLabel: tab.label, group: g.title, name: svc.name,
    description: null, price, priceEur: pr.eur, priceRsd: pr.rsd, onRequest: pr.onRequest,
    duration: null, location, locationLabel: LOC_LABEL[location],
    tags, highlight: !!svc.highlight, note: null, blogPost: null,
    priceNB: svc.priceNB, priceBW: svc.priceBW,
  });
  return out;
}

const tabsOut = pricingTabsSrc.map((tab) => ({
  id: tab.id, label: tab.label, kind: 'standard',
  groups: tab.groups.map((g, gi) => ({
    title: g.title, serviceCount: g.services.length,
    services: g.services.map((s, si) => enrichStandard(s, tab, g, gi, si)),
  })),
}));
const laserTab = { id: 'laserska', label: plain(grab(SCRIPT.index, /data-tab="laserska"><span class="dot"><\/span>([\s\S]*?)<\/button>/, 'laser tab label')[1]) };
tabsOut.push({
  id: laserTab.id, label: laserTab.label, kind: 'laser',
  note: { text: laserNote.text, html: laserNote.html },
  columns: { service: ui.laserTableHeadService, price: ui.laserTableHeadPrice },
  groups: laserGroupsSrc.map((g, gi) => ({
    title: g.title, serviceCount: g.services.length,
    services: g.services.map((s, si) => enrichLaser(s, laserTab, g, gi, si)),
  })),
});
tabsOut.forEach((t) => { t.serviceCount = t.groups.reduce((a, g) => a + g.serviceCount, 0); });

/* pick grids: resolve to FIRST cenovnik hit by exact name (old goToServiceInCenovnik behaviour) */
function resolvePick(p, tagLabel) {
  const hit = allServices.find((s) => s.name === p.name);
  const same = hit ? hit.price === p.price && (p.description ? hit.description === p.description : true) : false;
  return { ...p, tagLabel, cenovnik: hit ? { id: hit.id, tab: hit.tab, group: hit.group, matchesCenovnikPrice: same } : null };
}
const favorites = favoritesSrc.map((p) => resolvePick(p, ui.pickTagFavorite));
const gifts = giftsSrc.map((p) => resolvePick(p, ui.pickTagGift));
[...favorites, ...gifts].forEach((p) => {
  if (!p.cenovnik) warnings.push('Pick "' + p.name + '" has no cenovnik match.');
  else if (!p.cenovnik.matchesCenovnikPrice) warnings.push('Pick "' + p.name + '" price/description differs from cenovnik.');
});

/* verticals: keep stated count strings verbatim; add actual counts */
const TAB_FOR_VERTICAL = { 'Tretmani lica': 'lice', 'Tretmani tela': 'telo', 'Estetske procedure': 'estetske', 'Laserska epilacija': 'laserska', 'Posebni protokoli': 'protokoli' };
const verticals = verticalsSrc.map((v) => {
  const tabId = TAB_FOR_VERTICAL[v.title] || null;
  const tab = tabsOut.find((t) => t.id === tabId);
  const actual = tab ? tab.serviceCount : null;
  const stated = parseInt((/^(\d+)/.exec(v.count) || [])[1], 10);
  if (tab && !isNaN(stated) && stated !== actual) {
    warnings.push(`Vertical "${v.title}" states "${v.count}" but cenovnik data has ${actual} services in tab "${tabId}" (old site text kept verbatim).`);
  }
  return {
    title: v.title, summary: v.summary, statedCount: v.count, image: v.image, location: v.location,
    locationLabel: ui.bentoLocationLabels[v.location], href: v.link || '#usluge', link: v.link || null,
    cenovnikTab: tabId, cenovnikServiceCount: actual,
  };
});

/* offers */
const offerCta = grab(RAW.offers, /<a href="(https:\/\/wa\.me\/[^"]*)"[^>]*class="offer-cta">Zakaži ovaj paket/, 'offer cta');
const offerCtaLabel = plain(grab(SCRIPT.offers, /class="offer-cta">([\s\S]*?)\s*<svg/, 'offer cta label')[1]);
const offers = specialOffersSrc.map((o, i) => {
  const pr = parsePrice(o.price);
  const ref = allServices.find((s) => s.name.toLowerCase() === o.title.toLowerCase() && s.price === o.price);
  return {
    id: 'offer-' + (i + 1), slug: slugify(o.title), tag: o.tag, title: o.title, description: o.description,
    includes: o.description, price: o.price, priceEur: pr.eur, priceRsd: pr.rsd,
    oldPrice: null, validity: null, note: o.note || null,
    cta: { label: offerCtaLabel, href: offerCta[1] },
    cenovnikRef: ref ? { id: ref.id, tab: ref.tab, group: ref.group, name: ref.name } : null,
  };
});
offers.forEach((o) => { if (!o.cenovnikRef) warnings.push('Offer "' + o.title + '" has no exact cenovnik match (name+price).'); });
const offersHero = (() => {
  const sec = sectionBy(RAW.offers, /<section class="offer-hero">/);
  return { eyebrow: plain(elByClass(sec, 'eyebrow')), title: rich(grab(sec, /<h1[^>]*>([\s\S]*?)<\/h1>/, 'offers h1')[1]), intro: plain(grab(sec, /<p class="copy reveal">([\s\S]*?)<\/p>/, 'offers intro')[1]) };
})();

/* blog (teaser data) */
const hasBlank = (s) => /_{4,}/.test(s);
const postText = (p) => p.blocks.map((b) => (b.type === 'list' ? b.items.join(' ') : b.text || '')).join(' ');
const blog = blogPostsSrc.map((p, i) => {
  const full = postText(p);
  return {
    index: i, slug: slugify(p.title), title: p.title, category: p.category, categoryLabel: p.categoryLabel,
    image: p.image, excerpt: p.excerpt, date: null,
    anchor: 'blog.html#post=' + encodeURIComponent(p.title), anchorByIndex: 'blog.html#post=' + i,
    tags: deriveTags(p.title + ' ' + p.excerpt + ' ' + full),
    blockCount: p.blocks.length, wordCount: full.split(/\s+/).filter(Boolean).length,
    hasPlaceholderBlanks: hasBlank(full) || hasBlank(p.excerpt),
  };
});
const blogCategories = blogCategoriesSrc.map((c) => ({
  key: c.key, label: c.label, count: c.key === 'sve' ? blog.length : blog.filter((p) => p.category === c.key).length,
}));
const blogHero = (() => {
  const sec = sectionBy(RAW.blog, /<section class="blog-hero">/);
  return {
    eyebrow: plain(elByClass(sec, 'eyebrow')), title: rich(grab(sec, /<h1[^>]*>([\s\S]*?)<\/h1>/, 'blog h1')[1]),
    intro: plain(grab(sec, /<p class="copy reveal">([\s\S]*?)<\/p>/, 'blog intro')[1]),
    searchPlaceholder: decode(grab(sec, /id="search-input" placeholder="([^"]*)"/, 'blog placeholder')[1]),
  };
})();
const blogUi = {
  readMore: plain(grab(RAW.blog, /<span class="post-card-link">([\s\S]*?)\s*<svg/, 'post-card-link')[1]),
  emptyCategory: plain(grab(RAW.blog, /<div class="blog-empty">([\s\S]*?)<\/div>/, 'blog empty')[1]),
  prev: plain(grab(RAW.blog, /<\/svg>\s*([^<\s][^<]*?)\s*<\/button>\s*<button id="post-next">/, 'prev')[1]),
  next: plain(grab(RAW.blog, /<button id="post-next">\s*([^<\s][^<]*?)\s*<svg/, 'next')[1]),
  closeAria: attr(grab(RAW.blog, /<button class="post-modal-close"[^>]*>/, 'post close')[0], 'aria-label'),
};
/* SERVICE_BLOG_LINKS resolve to real posts? */
const serviceBlogLinks = serviceBlogRules.map((r) => {
  const post = blog.find((p) => p.title === r.postTitle);
  if (!post) warnings.push('SERVICE_BLOG_LINKS target not found in blog: ' + r.postTitle);
  const linked = allServices.filter((s) => s.blogPost === r.postTitle).map((s) => s.id);
  return { matchSubstring: r.matchSubstring, matchSource: r.matchSource, postTitle: r.postTitle,
    postIndex: post ? post.index : null, postAnchor: post ? post.anchor : null, linkedServiceIds: linked };
});

/* ------------------------------------------------------------------ images */
const IMG_DIR = path.join(OLD_DIR, 'assets', 'images');
const imageFiles = fs.readdirSync(IMG_DIR).filter((f) => !f.startsWith('.')).sort();
const imageUse = {
  'hero-orhideja.jpg': 'Hero background (index)', 'woman-portrait.png': 'Hero portrait + testimonials portrait',
  'logo.png': 'Nav logo', 'logo-transparent.png': 'Hero logo (transparent)', 'about.jpg': 'About section image',
    'founder-portrait.jpg': 'Founder portrait (Tamara Vujačić); also blog post image',
  'location-novi-beograd.jpg': 'Beauty Concept, Novi Beograd', 'location-waterfront.jpg': 'Wellbeing Concept, Belgrade Waterfront',
  'vertical-face.jpg': 'Vertical: Tretmani lica', 'vertical-body.jpg': 'Vertical: Tretmani tela',
  'vertical-esthetic.jpg': 'Vertical: Estetske procedure', 'vertical-laser.jpg': 'Vertical: Laserska epilacija; blog post image',
  'vertical-protocols.jpg': 'Vertical: Posebni protokoli', 'cta-bg.png': 'CTA band background (all pages)',
};
const alts = {
  'about.jpg': decode(grab(H, /<img src="assets\/images\/about\.jpg" alt="([^"]*)"/, 'alt')[1]),
  'founder-portrait.jpg': decode(grab(H, /<img src="assets\/images\/founder-portrait\.jpg" alt="([^"]*)"/, 'alt')[1]),
  'logo.png': decode(grab(H, /<img src="assets\/images\/logo\.png" alt="([^"]*)"/, 'alt')[1]),
  'location-novi-beograd.jpg': decode(grab(H, /<img src="assets\/images\/location-novi-beograd\.jpg" alt="([^"]*)"/, 'alt')[1]),
  'location-waterfront.jpg': decode(grab(H, /<img src="assets\/images\/location-waterfront\.jpg" alt="([^"]*)"/, 'alt')[1]),
};
const images = {};
imageFiles.forEach((f) => {
  images[f] = { file: f, oldPath: 'assets/images/' + f, absolutePath: path.join(IMG_DIR, f), bytes: fs.statSync(path.join(IMG_DIR, f)).size, usage: imageUse[f] || null, alt: alts[f] || null };
});
const referencedImages = new Set([...RAW.index.matchAll(/assets\/images\/([\w.-]+)/g), ...RAW.blog.matchAll(/assets\/images\/([\w.-]+)/g), ...RAW.offers.matchAll(/assets\/images\/([\w.-]+)/g)].map((m) => m[1]));
referencedImages.forEach((f) => { if (!images[f]) warnings.push('Referenced image missing on disk: ' + f); });
imageFiles.forEach((f) => { if (!referencedImages.has(f)) warnings.push('Image on disk but not referenced: ' + f); });

/* ----------------------------------------------------------- contacts model */
const waNB = phoneItems[0].whatsappHref, waBW = phoneItems[1].whatsappHref;
const e164 = (tel) => tel.replace(/^tel:/, '');
const locationsOut = [
  { key: 'nb', verticalKey: 'beauty', concept: capL.concept, area: capL.area, address: capL.address, eyebrow: capL.eyebrow,
    coinTag: coinFaces[0].tag, image: coinFaces[0].image, tintGradient: 'linear-gradient(135deg, #AF96C7cc 0%, #AF96C766 100%)',
    phone: { display: phoneItems[0].display, displayCoin: coinFaces[0].phoneDisplay, tel: e164(phoneItems[0].telHref), telHref: phoneItems[0].telHref, whatsappHref: waNB },
    mapUrl: null, hours: null },
  { key: 'bw', verticalKey: 'wellbeing', concept: capR.concept, area: capR.area, address: capR.address, eyebrow: capR.eyebrow,
    coinTag: coinFaces[1].tag, image: coinFaces[1].image, tintGradient: 'linear-gradient(135deg, #3F6E5E66 0%, #3F6E5Ecc 100%)',
    phone: { display: phoneItems[1].display, displayCoin: coinFaces[1].phoneDisplay, tel: e164(phoneItems[1].telHref), telHref: phoneItems[1].telHref, whatsappHref: waBW },
    mapUrl: null, hours: null },
];
if (phoneItems[0].area !== capL.area || phoneItems[1].area !== capR.area) warnings.push('Phone-menu area names differ from location captions.');
if (coinFaces[0].address !== capL.address || coinFaces[1].address !== capR.address) warnings.push('Coin addresses differ from split captions.');
if (locationsOut[0].phone.display.replace(/\s/g, '') !== locationsOut[0].phone.displayCoin.replace(/\s/g, '')) warnings.push('NB phone digits differ between nav and coin.');

const heroBarHours = plain(elByClass(heroSec, 'hero-bar-hours'));
const hoursParsed = (() => { const m = /^(\S+)\s*\u2014\s*(\S+)\s*·\s*(\d+)\s*\u2014\s*(\d+)h$/.exec(heroBarHours); return m ? { fromDay: m[1], toDay: m[2], open: m[3].replace(/^0+(?=\d)/, '') + ':00', close: m[4].replace(/^0+(?=\d)/, '') + ':00' } : null; })(); /* hours without a leading zero ("9:00"): no zero-padded numbering anywhere in the data */
const hoursLabel = hoursParsed ? { ...hoursParsed } : null;

/* ====================================================================== COPY */
const NEW_COPY = [
  { id: 'bar.message', text: 'Piši nam', where: 'Mobile sticky action bar, WhatsApp slot (old UI only has the label "WhatsApp").', register: 'ti' },
  { id: 'bar.prices', text: 'Pogledaj cene', where: 'Mobile sticky action bar, jumps to #usluge (old UI has "Cenovnik" nav label only).', register: 'ti' },
  { id: 'bar.where', text: 'Gde smo', where: 'Mobile sticky action bar, jumps to #lokacije. There are NO map URLs in the old data, so no "Kako do nas" link is offered.', register: 'neutral' },
  { id: 'acc.show', text: 'Prikaži usluge', where: 'Accordion / expandable group hint (collapsed state), small caption next to the "N usluga" count.', register: 'neutral' },
  { id: 'acc.hide', text: 'Sakrij usluge', where: 'Accordion / expandable group hint (expanded state).', register: 'neutral' },
  { id: 'acc.openAll', text: 'Otvori sve grupe', where: 'Optional toolbar above a price list that has many groups (estetske tab has ' + tabsOut.find((t) => t.id === 'estetske').groups.length + ').', register: 'neutral' },
  { id: 'tabs.swipe', text: 'Prevuci za još kategorija', where: 'Mobile hint under horizontally scrollable price-list tabs (' + tabsOut.length + ' tabs overflow on phones).', register: 'ti' },
  { id: 'price.payChip', text: 'Plaćanje u dinarima', where: 'Short chip near the price list header; distils the existing payment note (see payment.modal) for people who never open the modal.', register: 'neutral' },
  { id: 'price.validChip', text: 'Cenovnik važi od {date}', where: 'Short chip near the price list header. {date} = pricing.validFrom ("15.03.2026.").', register: 'neutral' },
  { id: 'search.suggest', text: 'Pokušaj sa: akne, glow, piling', where: 'Search empty/idle helper under the search field. Words reuse the examples already in the old placeholder.', register: 'ti' },
  { id: 'teaser.blogAll', text: 'Svi tekstovi na blogu ›', where: 'Link under the blog[] teaser row on the home preview.', register: 'neutral' },
  { id: 'teaser.offersAll', text: 'Svi paketi ›', where: 'Link under the offers[] teaser row on the home preview.', register: 'neutral' },
];

/* ============================================================ SOURCE-QUALITY FINDINGS */
const dupNames = (() => {
  const m = new Map();
  allServices.forEach((s) => m.set(s.name, (m.get(s.name) || []).concat(s.id)));
  return [...m.entries()].filter(([, ids]) => ids.length > 1).map(([name, ids]) => ({ name, ids }));
})();
const blankPosts = blog.filter((p) => p.hasPlaceholderBlanks).map((p) => p.title);
if (blankPosts.length) warnings.push(`${blankPosts.length} blog posts still contain "________" blanks in the body (device/doctor name the client must fill): ${blankPosts.join(' | ')}. Blog is teaser-only in v2, but never show those bodies.`);
if (/sample izbor tretmana/i.test(RAW.index)) warnings.push('FAVORITES_PICKS and GIFT_PICKS are marked in the old source as a SAMPLE selection ("Tamara će dostaviti finalnu listu"); the final list from the client is still pending.');
if (/Banka Intesa/.test(RAW.index) && /Banca Intesa/.test(RAW.index)) warnings.push('Source inconsistency kept verbatim: "Banka Intesa" (price-list footnote) vs "Banca Intesa" (payment modal).');
const preime = blog.find((p) => /^Preime /.test(p.title));
if (preime) warnings.push('Blog title "' + preime.title + '" spells the brand "Preime". The new Word text (procedure/Kozmeti\u010dki tretmani/Preime Dermafacial protokoli.docx) uses the same spelling in the title, in the body and in the cited source URL (preimedermafacial.com), so it is most likely the real brand name and not a typo; confirm with the client. It is also the SERVICE_BLOG_LINKS key for the Dermafacial services, so any correction must be made in both places.');
if (/orjentacionog/.test(RAW.index)) warnings.push('Source typo corrected by the reviewed rules (content-fixes.rules.json, typos[]): the old payment modal misspells the word "orijentacionog" (an i is missing after the j).');
if (locationsOut[0].phone.display !== locationsOut[0].phone.displayCoin) warnings.push(`Novi Beograd phone is formatted two ways in the old site: "${locationsOut[0].phone.display}" (nav/CTA/footer/pricing) and "${locationsOut[0].phone.displayCoin}" (coin card). Both kept (phone.display / phone.displayCoin).`);
const ytSocial = footerSocial.find((s) => s.label === 'YouTube');
if (ytSocial && ytSocial.href === '#') warnings.push('YouTube footer link has no URL in the old site (href="#"); contact.social[].href is null for it. Do not render it as a working link.');
warnings.push('No map URLs, no per-location opening hours, no postal codes in the old site; locations[].mapUrl/hours and contact.mapUrls are null. Only global hours exist: "' + heroBarHours + '".');
warnings.push('Offers have no old price, validity period or per-offer CTA URL in the old site (oldPrice/validity are null; every CTA is the shared Novi Beograd WhatsApp link). Blog posts have no date or slug (date is null; slug/anchor are derived).');
warnings.push('Old pricing data has no duration field; only ' + allServices.filter((s) => s.duration).length + ' services state a duration in their name ("N min"), exposed as service.duration. Do not invent others.');
const laserHighlights = lasRowsEarly().filter((s) => s.highlight).length;
if (laserHighlights) warnings.push(`${laserHighlights} laser rows carry highlight:true in the data, but the old UI never renders a badge on laser rows.`);
if (dupNames.length) warnings.push(`${dupNames.length} service names occur in more than one group with possibly different prices (e.g. ${dupNames.slice(0, 3).map((d) => '"' + d.name + '"').join(', ')}); always address services by id (tab:group:index), never by name alone.`);
function lasRowsEarly() { return tabsOut.find((t) => t.kind === 'laser').groups.flatMap((g) => g.services); }

/* ============================================================ ASSEMBLE JSON */
const rePages = { home: metaOf(RAW.index), blog: metaOf(RAW.blog), offers: metaOf(RAW.offers) };
const founderName = decode(grab(RAW.index, /alt="((?:Dr )?Tamara Vujačić), osnivač"/, 'founder name')[1]);
const locAlt = (file) => alts[file];
locationsOut[0].image = { src: coinFaces[0].image, alt: locAlt('location-novi-beograd.jpg') };
locationsOut[1].image = { src: coinFaces[1].image, alt: locAlt('location-waterfront.jpg') };
const secOf = (sec, withIntro) => flat(secHead(sec, withIntro));

const content = {
  _meta: {
    pack: 'Lepa Svaki Dan v2 content pack',
    generatedBy: 'ECHOSYSTEM-MOTHER AGENCY',
    generatedAt: new Date().toISOString(),
    language: 'sr',
    source: {
      dir: OLD_DIR,
      files: Object.fromEntries(Object.entries(SRC).map(([k, p]) => [path.basename(p), { bytes: fs.statSync(p).size, sha256: sha256(RAW[k]) }])),
    },
    conventions: {
      html: 'Fields named *Html / html contain only <em> (= the old "font-display-italic text-lila" accent word), <strong>, <a> and <br>. Entities are kept as in the source (&amp;). Inline styles were stripped.',
      text: 'Plain-text twins of html fields. "\\n" marks an old <br>.',
      derived: 'Fields listed under "Derived fields" in MANIFEST.md were computed from source data; everything else is verbatim.',
      locationCodes: 'service.location: nb = Beauty Concept Novi Beograd, bw = Wellbeing Concept Belgrade Waterfront, both = obe. verticals[].location uses beauty/wellbeing/both.',
      noSourceValue: 'null = the old site has no such value (blog date, offer old price/validity, map URLs, per-location hours). Do not invent one.',
      ids: 'Service ids are "<tabId>:<groupIndex>:<serviceIndex>" (0-based, source order). Names are NOT unique.',
      imagePaths: 'Image paths are relative to the OLD site folder (assets/images/...). images{} lists absolute paths on disk.',
    },
  },
  site: {
    name: 'Lepa Svaki Dan',
    tagline: plain(grab(RAW.index, /alt="Lepa Svaki Dan, (Beauty & Wellbeing Concept)"/, 'tagline')[1].replace('&', '&amp;')),
    language: 'sr',
    pages: rePages,
    credit: { prefix: plain(grab(footer, /<div class="credit">([\s\S]*?)<span>/, 'credit prefix')[1]), agency: plain(grab(footer, /<div class="credit">[\s\S]*?<span>([\s\S]*?)<\/span>/, 'credit agency')[1]) },
  },
  nav: {
    links: navLinks,
    phoneButton: { label: phoneBtnText, ariaLabel: ui.phoneButtonAria, callLabel: phoneItems[0].telLabel, whatsappLabel: phoneItems[0].whatsappLabel },
    cta: { short: plain(navCta[2]), full: plain(navCta[3]), href: navCta[1] },
    burgerAria: ui.burgerAria,
  },
  hero: {
    claim: plain(elByClass(heroSec, 'txt')),
    searchPlaceholder: heroSearchPlaceholder,
    headline: { prefix: plain(elByClass(heroSec, 'morph-line')), phrases: heroPhrases, initialPhrase: plain(grab(heroSec, /id="morph-phrase">([\s\S]*?)<\/span>/, 'morph initial')[1]) },
    sub: plain(elByClass(heroSec, 'hero-sub')),
    ctas: heroCtas,
    bar: {
      locations: heroBarLabels.map((label, i) => ({ label, value: heroBarValues[i] })),
      hours: heroBarHours, hoursParsed,
    },
    images: {
      background: attr(grab(heroSec, /<img class="hero-bg"[^>]*>/, 'hero bg')[0], 'src'),
      portrait: attr(grab(heroSec, /<div class="hero-portrait"[^>]*><img[^>]*>/, 'hero portrait')[0].replace(/^[\s\S]*?(<img)/, '$1'), 'src'),
      logo: attr(grab(heroSec, /<img src="[^"]*" alt="[^"]*" class="hero-logo">/, 'hero logo')[0], 'src'),
    },
  },
  about: {
    eyebrow: plain(elByClass(aboutSec, 'eyebrow')),
    title: aboutTitle.text, titleHtml: aboutTitle.html,
    paragraphs: aboutParas,
    image: { src: attr(grab(aboutSec, /<div class="about-image">\s*<img[^>]*>/, 'about img')[0].replace(/^[\s\S]*?(<img)/, '$1'), 'src'), alt: alts['about.jpg'] },
  },
  stats: {
    items: statItems,
    heroClaim: plain(elByClass(heroSec, 'txt')),
    founderMeta: plain(elByClass(founderGrid, 'signature-meta')),
    note: 'items[].display is what the old counter renders at the end of its count-up (toLocaleString("sr-RS") + suffix). The static markup shows "0+"/"0" before the animation, which is NOT a real value.',
  },
  quote: {
    eyebrow: plain(elByClass(founderGrid, 'eyebrow')),
    text: founderQuote.text, html: founderQuote.html,
    paragraph: plain(grab(founderGrid, /<p class="copy reveal">([\s\S]*?)<\/p>/, 'founder p')[1]),
  },
  founder: {
    name: founderName,
    role: 'Osnivač',
    signatureName: plain(elByClass(founderGrid, 'signature-script')),
    signatureMeta: plain(elByClass(founderGrid, 'signature-meta')),
    image: { src: attr(grab(founderGrid, /<img[^>]*>/, 'founder img')[0], 'src'), alt: attr(grab(founderGrid, /<img[^>]*>/, 'founder img')[0], 'alt') },
  },
  locations: locationsOut,
  contact: {
    email: footerContact.find((c) => c.href.startsWith('mailto:')).label,
    emailHref: footerContact.find((c) => c.href.startsWith('mailto:')).href,
    primaryWhatsappHref: navCta[1],
    primaryPhone: locationsOut[0].phone.display,
    phones: locationsOut.map((l) => ({ location: l.key, area: l.area, ...l.phone })),
    hours: { display: heroBarHours, parsed: hoursParsed, perLocation: null },
    social: footerSocial.map((s) => ({ label: s.label, href: s.href === '#' ? null : s.href, rawHref: s.href })),
    mapUrls: null,
  },
  pricing: {
    eyebrow: plain(elByClass(priceSec, 'eyebrow')),
    title: priceH2.text, titleHtml: priceH2.html,
    contactNote: { text: priceContactNote.text, html: priceContactNote.html },
    searchPlaceholder: decode(grab(priceSec, /id="search-input" placeholder="([^"]*)"/, 'price placeholder')[1]),
    footnote: priceFootParas.map((p) => ({ text: p.text, html: p.html })),
    validFrom, validFromISO: validFrom.replace(/^(\d{2})\.(\d{2})\.(\d{4})\.$/, '$3-$2-$1'),
    tabs: tabsOut,
    ui: { highlightBadge: ui.highlightBadge, articleHint: ui.articleHint, groupCountSuffix: ui.groupCountSuffix, laserTableHeadService: ui.laserTableHeadService, laserTableHeadPrice: ui.laserTableHeadPrice },
    displayRules: [
      'service.location (nb/bw/both) is intentionally NOT shown per service on the old site (client decision, comment in old index.html / izmene.txt). Keep it in data; do not render a per-service location pill without client sign-off. (The 5 treatment categories in verticals[] DO show a location badge on the old site.)',
      'Laser tab shows ONE merged price per row (unified price: the lower of NB/BW prefixed "od ", or the only available price). priceNB/priceBW stay in data only.',
      'highlight=true renders the badge "' + ui.highlightBadge + '" on standard rows. Laser rows carry a highlight flag the old UI never rendered.',
      'Services whose name contains "higijenski" or "dermafacial" are linked to a blog post (service.blogPost = post title; see blog[] / serviceBlogLinks).',
      'Group header shows "<N> ' + ui.groupCountSuffix + '". Old UI opens the first group of a tab by default; one group open at a time.',
    ],
  },
  payment: {
    modal: { title: payTitle, paragraphs: payParas.map((p) => ({ text: p.text, html: p.html })), okLabel: plain(payModal[2]), closeAria: ui.modalCloseAria,
      behaviour: 'Old site opens it once per session (sessionStorage key lsd-payment-modal-shown) when #usluge first scrolls into view or any a[href="#usluge"] is clicked.' },
    note: priceFootParas[0].text,
  },
  favorites: favorites,
  gifts: gifts,
  verticals: verticals,
  testimonials: testimonialsSrc.map((t, i) => ({ id: 'testimonial-' + (i + 1), quote: t.quote, author: t.author, tag: t.tag })),
  quiz: {
    eyebrow: secOf(quizSec, true).eyebrow, title: secOf(quizSec, true).title, titleHtml: secOf(quizSec, true).titleHtml, intro: secOf(quizSec, true).intro,
    questions: quizQuestions, icons: quizIcons,
    ui: { stepLabelDone: quizUi.stepLabelDone, resultsEyebrow: quizUi.resultsEyebrow, resultsTitle: quizUi.resultsTitle.text, resultsTitleHtml: quizUi.resultsTitle.html,
      resultsSub: quizUi.resultsSub, emptyText: quizUi.emptyText.text, emptyTextHtml: quizUi.emptyText.html, fullListLabel: quizUi.fullListLabel, resetLabel: quizUi.resetLabel, matchLabel: quizUi.matchLabel },
    algorithm: 'Old site: keywords of the 3 chosen answers are matched (substring, case-insensitive) against name + description + group title of every standard cenovnik service (laser excluded); score = number of matching keywords; top 3 unique names win. Kept for later.',
  },
  offers: offers,
  blog: blog,
  blogCategories: blogCategories,
  serviceBlogLinks: serviceBlogLinks,
  search: {
    placeholderHome: heroSearchPlaceholder, placeholderBlog: blogHero.searchPlaceholder,
    emptyTemplate: ui.searchEmptyTemplate,
    resultTypes: { treatment: ui.searchTypeTreatment, offer: ui.searchTypeOffer, text: ui.searchTypeText },
    minChars: 2, maxResults: 10, debounceMs: 150,
    tagRules: tagRulesSrc, synonyms: synonymsSrc,
    offersIndex: offersIndexSrc,
    scoring: 'substring in haystack +5; tag in synonym-extra tags +4; tag text contains query +3.',
  },
  sections: {
    locations: {
      eyebrow: plain(elByClass(locSec, 'eyebrow')), title: locHeadH2.text, titleHtml: locHeadH2.html,
      subDesktop: locSubDesktop[1], subMobile: locSubDesktop[2],
      splitHint: plain(elByClass(locSec, 'split-hint')),
      flipButtonLabel: plain(grab(locSec, /<button class="coin-flip-btn" id="coin-flip-btn">\s*([\s\S]*?)\s*<svg/, 'flip btn')[1]),
      coinAria: ui.coinAria,
    },
    favorites: { ...secOf(favSec, true), tagLabel: ui.pickTagFavorite },
    gifts: { ...secOf(giftSec, true), tagLabel: ui.pickTagGift },
    verticals: { ...secOf(vertSec, false), linkLabel: ui.bentoLinkLabel, locationLabels: ui.bentoLocationLabels },
    testimonials: { ...secOf(testSec, false), autoRotateMs: testimonialUi.autoRotateMs, prevAria: ui.testimonialPrevAria, nextAria: ui.testimonialNextAria,
      portrait: attr(grab(SCRIPT.index, /<div class="t-portrait"><img[^>]*>/, 't portrait')[0].replace(/^[\s\S]*?(<img)/, '$1'), 'src') },
    offers: { eyebrow: offersHero.eyebrow, title: offersHero.title.text, titleHtml: offersHero.title.html, intro: offersHero.intro, ctaLabel: offerCtaLabel },
    blog: { ...blogHero, title: blogHero.title.text, titleHtml: blogHero.title.html, ui: blogUi },
  },
  cta: { home: ctaOf(RAW.index), offers: ctaOf(RAW.offers), blog: ctaOf(RAW.blog) },
  footer: {
    brand: footerBrand.text, brandHtml: footerBrand.html,
    description: plain(elByClass(footer, 'footer-desc')),
    columns: {
      contact: { heading: 'Kontakt', links: footerContact },
      social: { heading: 'Pratite nas', links: footerSocial.map((s) => ({ label: s.label, href: s.href })) },
      locations: { heading: 'Lokacije', items: footerLocs },
    },
    copyright: { template: plain(grab(footer, /<div class="footer-bottom">\s*<div>([\s\S]*?)<\/div>/, 'copyright')[1]).replace('2026', '{year}'), yearNote: 'Old site renders the current year (min 2026).' },
    credit: plain(elByClass(footer, 'credit')),
    backToTopAria: ui.backToTopAria,
  },
  images,
  allServices,
  copy: { newStrings: NEW_COPY.map((c) => ({ ...c, isNew: true })) },
};

/* ============================================================ CONTENT FIXES */
/* Shared corrections (see content-fixes.js, content-fixes.rules.json and CHANGES.md):
   the owner is not a doctor; no em dash; en dash only in numeric ranges.
   Applied IN PLACE on the assembled data before counts/checksums are computed.
   Prices and structure must stay untouched: priceLinesSha256 is asserted equal before/after. */
const linesSha = (svcs) => sha256(svcs.map((s) => [s.tab, s.group, s.name, s.price].join('|')).join('\n'));
const priceLinesSha = (svcs) => sha256(svcs.map((s) => [s.id, s.price, JSON.stringify(s.priceEur), JSON.stringify(s.priceRsd)].join('|')).join('\n'));
const sourceLinesSha = linesSha(allServices);
const sourcePriceSha = priceLinesSha(allServices);
const contentFixLog = FX.applyFixes(content);
FX.applyFixes({ warnings }).forEach((ch) => contentFixLog.push({ ...ch, path: '_meta.' + ch.path }));
if (priceLinesSha(allServices) !== sourcePriceSha) fail('content fixes changed a price or a service id (priceLinesSha256 differs)');
/* data-driven warning: doctor titles that were deliberately NOT touched */
allServices.filter((s) => /\bdr\.?\s/i.test(s.name)).forEach((s) => warnings.push('Price list line "' + s.name + '" (' + s.id + ') still carries a doctor title: it names a person other than the owner (or only a surname), so it was not assumed to be the owner. Confirm with the client.'));
allServices.filter((s) => /Tamara/.test(s.name)).forEach((s) => warnings.push('Owner title removed from the price list line "' + s.name + '" (' + s.id + '). A "specialist exam" under the owner\'s name is odd now that she is not a doctor: confirm with the client who performs it and how the line should read.'));
const founderPhotoAlt = content.images && content.images['founder-portrait.jpg'];
if (founderPhotoAlt) warnings.push('images["founder-portrait.jpg"] and founder.image still describe the file as the founder, but the media pack shows it is a stock photo of a face-mask treatment (not the owner): the alt text is inaccurate until a real portrait exists.');

/* ============================================================ COUNTS / SUMS */
const standardTabs = tabsOut.filter((t) => t.kind === 'standard');
const laser = tabsOut.find((t) => t.kind === 'laser');
const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
const stdServices = allServices.filter((s) => s.tab !== 'laserska');
const lasServices = allServices.filter((s) => s.tab === 'laserska');
const lasRows = laser.groups.flatMap((g) => g.services);
const counts = {
  tabs: tabsOut.length,
  standardTabs: standardTabs.length,
  groups: tabsOut.reduce((a, t) => a + t.groups.length, 0),
  standardGroups: standardTabs.reduce((a, t) => a + t.groups.length, 0),
  laserGroups: laser.groups.length,
  services: allServices.length,
  standardServices: stdServices.length,
  laserServices: lasServices.length,
  highlightedStandard: stdServices.filter((s) => s.highlight).length,
  onRequest: allServices.filter((s) => s.onRequest).length,
  withDuration: allServices.filter((s) => s.duration).length,
  withBlogLink: allServices.filter((s) => s.blogPost).length,
  testimonials: testimonialsSrc.length,
  offers: offers.length,
  blogPosts: blog.length,
  blogCategories: blogCategories.length - 1,
  verticals: verticals.length,
  favorites: favorites.length, gifts: gifts.length,
  quizQuestions: quizQuestions.length, quizOptions: sum(quizQuestions, (q) => q.options.length),
  tagRules: tagRulesSrc.length, synonyms: Object.keys(synonymsSrc).length,
  images: imageFiles.length,
  newCopyStrings: NEW_COPY.length,
  perTab: Object.fromEntries(tabsOut.map((t) => [t.id, { groups: t.groups.length, services: t.serviceCount }])),
  perBlogCategory: Object.fromEntries(blogCategories.map((c) => [c.key, c.count])),
};
const checksums = {
  standardEurMinSum: sum(stdServices, (s) => s.priceEur && s.priceEur.min),
  standardEurMaxSum: sum(stdServices, (s) => s.priceEur && s.priceEur.max),
  standardRsdMinSum: sum(stdServices, (s) => s.priceRsd && s.priceRsd.min),
  standardRsdMaxSum: sum(stdServices, (s) => s.priceRsd && s.priceRsd.max),
  laserNbEurMinSum: sum(lasRows, (s) => s.priceNBParsed.eur && s.priceNBParsed.eur.min),
  laserBwEurMinSum: sum(lasRows, (s) => s.priceBWParsed.eur && s.priceBWParsed.eur.min),
  laserUnifiedEurMinSum: sum(lasServices, (s) => s.priceEur && s.priceEur.min),
  allServicesEurMinSum: sum(allServices, (s) => s.priceEur && s.priceEur.min),
  offersEurSum: sum(offers, (o) => o.priceEur && o.priceEur.min),
  offersRsdSum: sum(offers, (o) => o.priceRsd && o.priceRsd.min),
  serviceLinesSha256: sourceLinesSha, /* hash of the SOURCE lines, computed before the content fixes: unchanged by them */
  serviceLinesSha256AfterFixes: linesSha(allServices), /* same lines after the fixes (only service names can differ) */
  priceLinesSha256: priceLinesSha(allServices), /* name-independent: id|price|priceEur|priceRsd, identical before and after the fixes */
};
content._meta.counts = counts;
const byRule = {};
contentFixLog.forEach((c) => c.rules.forEach((r) => { const k = r.split(':')[0]; byRule[k] = (byRule[k] || 0) + 1; }));
content._meta.fixes = { rulesFile: '_tools/content-fixes.rules.json', changedStrings: contentFixLog.length, byGroup: byRule, details: 'CHANGES.md', priceLinesUnchanged: true };
content._meta.conventions.fixes = 'Applied after extraction (see CHANGES.md): the owner is not a doctor (founder.signature added); no em dash anywhere; en dash only inside numeric ranges; hours are written "Pon-Sub, 9-21h"; the laser price placeholder is a plain hyphen. Prices are untouched (checksums.priceLinesSha256).';
content._meta.checksums = checksums;
content._meta.warnings = warnings;

/* ================================================================ WRITE FILES */
const json = JSON.stringify(content, null, 2);
FX.assertClean(json, 'content.json');
fs.writeFileSync(path.join(OUT_DIR, 'content.json'), json + '\n');
fs.writeFileSync(path.join(OUT_DIR, '_tools', 'fixes-log.content.json'), FX.jsonNoDash({ generatedAt: content._meta.generatedAt, changes: contentFixLog }, 2) + '\n');
const js = '/* Lepa Svaki Dan v2 content pack, generated by _tools/build-content.js (ECHOSYSTEM-MOTHER AGENCY). Works from file:// */\n' +
  'window.LSD_CONTENT = ' + json.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ';\n';
FX.assertClean(js, 'content.js');
fs.writeFileSync(path.join(OUT_DIR, 'content.js'), js);

/* COPY_NOTES.md */
const today = new Date().toISOString().slice(0, 10);
const reuse = [
  ['Pozovi', 'nav phone menu action (exists)'], ['WhatsApp', 'nav phone menu action (exists)'],
  ['Zakaži / Zakaži termin ›', 'nav CTA (exists)'], ['Cenovnik', 'nav label (exists)'], ['Lokacije', 'nav label (exists)'],
  ['Zakaži ovaj paket', 'offer card CTA (exists)'], ['Pročitaj više ›', 'article hint and blog card link (exists)'],
];
const copyNotes = [
  '# COPY_NOTES: suggested NEW UI strings',
  '',
  '**Status: NEW copy.** None of the strings below exist on the old site. They are suggestions for the three v2 previews; builders may use them but must treat them as additions (not 1:1 content). Everything else on the pages must come from `content.json`.',
  '',
  'Tone note: the old site mixes registers. Hero, quiz and hints use "ti" (Budi, tvoj, Pomeri), booking CTAs use "vi" (Zakažite, Pozovite). Each string below states its register; where it says `neutral` the wording works for both.',
  '',
  '| # | id | NEW string | Where it is used | Register |',
  '|---|----|------------|------------------|----------|',
  ...NEW_COPY.map((c, i) => `| ${i + 1} | \`${c.id}\` | ${c.text.replace(/\|/g, '\\|')} | ${c.where.replace(/\|/g, '\\|')} | ${c.register} |`),
  '',
  '## Existing strings to reuse (NOT new)',
  '',
  'The mobile action bar can combine the new labels above with these existing ones:',
  '',
  ...reuse.map(([s, w]) => `- "${s}": ${w}`),
  '',
  '## Notes for builders',
  '',
  '- `{date}` in `price.validChip` must be filled from `content.pricing.validFrom` (currently `' + validFrom + '`), never typed by hand.',
  '- There are no map URLs and no per-location opening hours in the old data (`contact.mapUrls` and `locations[].mapUrl` / `locations[].hours` are `null`). Do not add a "Kako do nas" / route button or per-location hours unless the client supplies them. The only hours text is `hero.bar.hours` ("' + content.hero.bar.hours + '").',
  '- The same strings are available in `content.json` under `copy.newStrings` (each with `isNew: true`).',
  '',
  '---',
  'Pripremio ECHOSYSTEM-MOTHER AGENCY · ' + today,
  '',
].join('\n');
FX.assertClean(copyNotes, 'COPY_NOTES.md');
fs.writeFileSync(path.join(OUT_DIR, 'COPY_NOTES.md'), copyNotes);

/* ============================================================ VERIFY + MANIFEST */
const verify = require('./verify-content.js');
const report = verify.run({ contentPath: path.join(OUT_DIR, 'content.json'), oldDir: OLD_DIR, copyNotesPath: path.join(OUT_DIR, 'COPY_NOTES.md') });
report.mutations = require('./mutation-test.js').run({ contentPath: path.join(OUT_DIR, 'content.json'), oldDir: OLD_DIR, copyNotesPath: path.join(OUT_DIR, 'COPY_NOTES.md') });
if (report.mutations.some((m) => !m.caught)) { report.ok = false; report.failures.push('mutation test: verifier missed ' + report.mutations.filter((m) => !m.caught).map((m) => m.name).join('; ')); }
fs.writeFileSync(path.join(OUT_DIR, '_tools', 'verification-report.json'), FX.jsonNoDash(report, 2) + '\n');

const manifest = require('./write-manifest.js').render({ content, counts, checksums, warnings, report, today, OLD_DIR, OUT_DIR, SRC, RAW, NEW_COPY });
FX.assertClean(manifest, 'MANIFEST.md');
fs.writeFileSync(path.join(OUT_DIR, 'MANIFEST.md'), manifest);

console.log(JSON.stringify({ counts: { ...counts, perTab: undefined, perBlogCategory: undefined }, checksums, warnings: warnings.length, verifyOk: report.ok, verifyFailures: report.failures.length }, null, 2));
if (!report.ok) { console.error('VERIFICATION FAILED:\n' + report.failures.join('\n')); }
process.exit(report.ok ? 0 : 1);
