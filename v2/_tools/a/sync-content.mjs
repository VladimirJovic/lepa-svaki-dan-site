#!/usr/bin/env node
/* =====================================================================================================
   LEPA SVAKI DAN · preview "A" · builds js/content.js (the SLIM data of the home page) from the shared content pack
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   js/content.js is what the home page reads at run time: the price list (5 tabs, 31 groups, 210 services), the favourites,
   the five treatment tiles and the testimonials. Everything else of the home is pre-rendered HTML, or comes from js/offers-data.js.
   The gift picks are NOT shipped here any more: they are the "Bestseller tretmani" of the About section, pre-rendered by build-pages.mjs from the pack
   (gifts[], each linked to its price-list row).

   WHAT THIS TOOL LEAVES OUT ON PURPOSE (client feedback, October 2026)
   - every per-service location field (location, priceNB, priceBW, priceFrom): the price list is ONE list, "where is what" is answered on the phone.
     Laser rows keep exactly the single price the old site showed ("od X", the lower of the two prices, or the only one): it is already
     the `price` of the pack, this tool checks it against the old site's rule and stops if one row differs.
   - per-service tags / hashtags and the tag rules: they are not shipped here. The tags live on only as HIDDEN search words (plain words, no hash sign) inside assets/search-index.js,
     next to the hidden vocabulary: they decide what is found and in which order (_tools/a/build-search-index.mjs), they are never shown.
   - the location label of the treatment tiles, the coin / split strings of the old locations section.
   - emoji: stripped from every string (the old badge "💜 akcija" becomes the word "akcija", shown with a simple line icon).

   Run:  node _tools/a/sync-content.mjs      (then node _tools/a/build-pages.mjs, which also rebuilds the search index)
   ===================================================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '..', '..');
const SITE_DIR = fs.readdirSync(V2).find((d) => /^a-[a-z]+$/.test(d) && fs.existsSync(path.join(V2, d, 'index.html'))); // the folder of preview A
const target = path.join(V2, SITE_DIR, 'js/content.js');
const full = JSON.parse(fs.readFileSync(path.join(V2, '_shared/content/content.json'), 'utf8'));

/* emoji and pictographs (and their joiners / variation selectors) out of every string; hours with an en dash stay */
const PICTO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu;
const clean = (s) => String(s).replace(PICTO, '').replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');

/* the rule of the old site (lepasvakidrugidan/index.html, unifiedLaserPrice): ONE price per laser row */
const firstEuro = (s) => { if (!s || s === '-' || s === '\u2014') return null; const m = String(s).split('/')[0].match(/[\d.]+/); return m ? parseInt(m[0].replace(/\./g, ''), 10) : null; };
function unifiedLaserPrice(s) {
  const nb = firstEuro(s.priceNB), bw = firstEuro(s.priceBW);
  if (nb === null && bw === null) return 'na upit';
  if (nb === null) return s.priceBW;
  if (bw === null) return s.priceNB;
  if (nb === bw) return s.priceNB;
  return 'od ' + (nb < bw ? s.priceNB : s.priceBW);
}

const problems = [];
let nServices = 0, nGroups = 0;
const service = (s, laser) => {
  nServices++;
  if (laser) { const u = unifiedLaserPrice(s); if (u !== s.price) problems.push('laser row differs from the old site rule: ' + s.id + ' "' + s.price + '" vs "' + u + '"'); }
  const o = { id: s.id, name: clean(s.name) };
  if (s.description) o.description = clean(s.description);
  o.price = clean(s.price);
  if (s.onRequest) o.onRequest = true;
  if (s.duration) o.duration = clean(s.duration);
  if (s.blogPost) o.blogPost = s.blogPost;
  if (s.highlight) o.highlight = true;
  return o;
};
const tabs = full.pricing.tabs.map((t) => {
  const laser = t.kind === 'laser';
  const o = { id: t.id, label: clean(t.label), kind: t.kind };
  if (t.note) o.note = { html: t.note.html };
  if (t.columns) o.columns = { service: t.columns.service, price: t.columns.price };
  o.groups = t.groups.map((g) => { nGroups++; return { title: clean(g.title), services: g.services.map((s) => service(s, laser)) }; });
  return o;
});

const slim = {
  pricing: {
    validFrom: full.pricing.validFrom,
    ui: { groupCountSuffix: full.pricing.ui.groupCountSuffix, highlightBadge: clean(full.pricing.ui.highlightBadge) },
    tabs,
  },
  favorites: full.favorites.map((f) => ({ name: clean(f.name), description: f.description ? clean(f.description) : undefined, price: f.price, tagLabel: f.tagLabel, cenovnik: { id: f.cenovnik.id } })),
  /* the five treatment tiles: no location label, no dot. A tile that states "od N €" (the laser tile) also carries that price in dinars first
     (fromPrice = the data string of the cheapest row of its tab, "od 16€ / 1.800 rsd"), so the tile can show 1.800 rsd large and 16€ small */
  verticals: full.verticals.map((v) => {
    const o = { title: clean(v.title), summary: clean(v.summary), statedCount: clean(v.statedCount), cenovnikTab: v.cenovnikTab, cenovnikServiceCount: v.cenovnikServiceCount };
    const m = /^od\s+([\d.]+)\s*€/.exec(o.statedCount);
    if (m) {
      const eur = parseInt(m[1].replace(/\./g, ''), 10);
      const rows = tabs.find((t) => t.id === v.cenovnikTab).groups.flatMap((g) => g.services).filter((s) => !s.onRequest && firstEuro(s.price) === eur);
      if (!rows.length) problems.push('vertical "' + v.title + '" states "' + o.statedCount + '" but no row of its tab costs ' + eur + '€');
      else o.fromPrice = rows[0].price.replace(/^od\s+/, 'od ');
    }
    return o;
  }),
  testimonials: full.testimonials.map((t) => ({ id: t.id, quote: clean(t.quote), author: clean(t.author), tag: clean(t.tag) })),
  sections: {
    verticals: { linkLabel: full.sections.verticals.linkLabel },
    testimonials: { autoRotateMs: full.sections.testimonials.autoRotateMs },
    offers: { title: clean(full.sections.offers.title) },
  },
};

if (nServices !== 210 || tabs.length !== 5 || nGroups !== 31) problems.push('guardrail: expected 210 services / 5 tabs / 31 groups, got ' + nServices + ' / ' + tabs.length + ' / ' + nGroups);
const body = JSON.stringify(slim);
if (/\u2014/.test(body)) problems.push('em dash in the synced content');
if (PICTO.test(body)) problems.push('emoji left in the synced content');
if (/"(location|priceNB|priceBW|priceFrom|tags)"/.test(body)) problems.push('a location or tag key is still in the synced content');
if (problems.length) { console.error('SYNC REFUSED:\n  ' + problems.join('\n  ')); process.exit(1); }
fs.writeFileSync(target, 'window.LSD_CONTENT=' + body + ';\n');
console.log('js/content.js written: ' + nServices + ' services, ' + tabs.length + ' tabs, ' + nGroups + ' groups, ' + body.length + ' bytes (no location fields, no tags, no emoji).');
