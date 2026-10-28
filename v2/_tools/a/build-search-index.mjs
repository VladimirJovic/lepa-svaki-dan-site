/* =====================================================================================================
   LEPA SVAKI DAN · preview "A" · the data of the search (assets/search-index.js), written by build-pages.mjs
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   One index serves every search of the site (js/search.js): the overlay of every page, the search bar of the home page and the price-list search.
   It is made of
     - the 31 price-list groups and 210 services (name, description, price, group, category),
     - the 21 texts (title, sub-title, headings, excerpt, segment, address of the page),
     - the special offers (js/offers-data.js, so an edited offer is found after the next build),
     - the HIDDEN vocabulary of _shared/content/search-synonyms.json: how women phrase it ("ozilci od akni", "kako smanjiti obim",
       "blistava koza") mapped to the groups, services, texts and offers whose own wording supports it.
   Tags and hashtags are never shipped as text to show: the synonyms only decide what is found, nothing of them is ever displayed.

   STAGE 3 (relevance): the index now also carries
     - the per-service TAGS of the old price list ("#akne", "#dermapen", ...) as plain search words, WITHOUT the hash sign: tg[] is the list of tags (every tag is a list of
       spellings joined with "|"), and every service has t[] = the indexes of its tags. The engine (js/search.js) weights a tag by how SPECIFIC it is (a tag on 1 to 3 services is strong,
       "lice" or "telo" on 40 services almost nothing) and ranks: 1. names of groups and services, 2. tags and the hidden synonyms, 3. descriptions, 4. texts.
     - for every target of a synonym entry how well the site's own wording supports it (gw / vw / aw / ow: 3 = in the name or title, 2 = in a description or sub-title,
       1 = only through a linked text), so the services that carry the term in their name come first inside a group.
   HONEST MAPPING: a tag is dropped where it is only a spelling accident (TAG_DROP below), and a tag the old site misspelt is read as what the service itself says (TAG_PHRASES).

   The folding below MUST stay identical to fold() in js/search.js (lowercase, d-stroke to dj, combining marks dropped, x to ks, "anti" + word = two words, only a-z 0-9 + % space).
   ===================================================================================================== */
export const fold = (s) => String(s == null ? '' : s).toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/x/g, 'ks').replace(/[^a-z0-9+% ]+/g, ' ').replace(/\banti(?=[a-z]{3})/g, 'anti ').replace(/\s+/g, ' ').trim();   // "x" = "ks": Botox and botoks are one word; "anticelulit" = "anti celulit"

const STRENGTH = { strong: 3, medium: 2, weak: 1 };

/* HOW A TAG IS SPELT AS A SEARCH WORD. Default: the tag without "#", dashes as spaces ("lifting-niti" -> "lifting niti"). Listed here: the other ways a woman writes the same thing. */
const TAG_PHRASES = {
  'antiaging': ['antiaging', 'anti aging', 'anti age'],
  'pilinzi': ['pilinzi', 'piling'],
  'masaza': ['masaza', 'masaze'],
  'drenaza': ['drenaza', 'limfna drenaza'],
  'laserska-epilacija': ['laserska epilacija', 'epilacija'],
  'ozbiljci': ['oziljci', 'oziljak'],            // the old site spelt it "ozbiljci"; the one service that carries it is "Ožiljci od akni" (Candela Frax)
  'osetljiva-koza': ['osetljiva koza'],
  'trudnoca': ['trudnoca', 'trudnice'],
  'vencanje': ['vencanje', 'mlada'],
  'infuzije': ['infuzije', 'infuzija'],
  'kosa': ['kosa', 'kose'],
  'akne': ['akne', 'akni'],
  'biorevitalizacija': ['biorevitalizacija', 'biorevitalizujuci'],
  'podocnjaci': ['podocnjaci'],
  'lifting-niti': ['lifting niti', 'niti'],
};
/* tags that are a spelling accident on some rows: "#usne" on the laser rows "Nausnice" (= upper lip hair), which has nothing to do with lips (fillers). tag -> tabs where it is dropped */
const TAG_DROP = { usne: ['laserska'] };

/* how well the site's own wording supports one target of a synonym entry: 3 name / title, 2 description / sub-title, 1 only through a linked text (search-synonyms.json "evidence") */
function evidenceLevel(ev) {
  if (!ev || !ev.in) return 2;
  if (ev.via) return 1;
  const w = String(ev.in);
  if (/^(name|service name|group title|group|offer title|offer tag|title)\b/.test(w)) return 3;
  if (/^(description|service description|subtitle|offer description|tab)\b/.test(w)) return 2;
  if (/^block/.test(w)) return 1;
  return 2;
}
const euroOf = (price) => { const m = /([\d.]+)/.exec(String(price).split('/')[0]); return m ? parseInt(m[1].replace(/\./g, ''), 10) : null; };

export function searchIndexSource({ content, articles, segments, synonyms, offers, stripTokens }) {
  const tabs = content.pricing.tabs;
  const groupOut = [], serviceOut = [];
  const tagList = [], tagIx = {};   // tag id -> index in tg[]
  const tagOf = (raw, tabId) => {
    const id = String(raw).replace(/^#/, '');
    if (TAG_DROP[id] && TAG_DROP[id].includes(tabId)) return -1;
    if (!(id in tagIx)) { tagIx[id] = tagList.length; tagList.push((TAG_PHRASES[id] || [id.replace(/-/g, ' ')]).map(fold).filter(Boolean).join('|')); }
    return tagIx[id];
  };
  tabs.forEach((t, ti) => t.groups.forEach((g, gi) => {
    /* pf = the price string of the cheapest priced service of the group ("51€ / 6.000 rsd"); the overlay shows it dinars first ("od 6.000 rsd (51€)", js/price.js) */
    const priced = g.services.filter((s) => !s.onRequest).map((s) => ({ s, e: euroOf(s.price) })).filter((x) => x.e != null);
    const cheapest = priced.length ? priced.reduce((a, b) => (b.e < a.e ? b : a)) : null;
    groupOut.push({ id: t.id + ':' + gi, tab: ti, title: g.title, n: g.services.length, pf: cheapest ? cheapest.s.price.replace(/^od\s+/i, '') : '' });
    g.services.forEach((s) => {
      const o = { id: s.id, g: t.id + ':' + gi, n: s.name, d: s.description || '', p: s.price, q: s.onRequest ? 1 : 0 };
      const tg = [...new Set((s.tags || []).map((x) => tagOf(x, t.id)).filter((i) => i >= 0))];
      if (tg.length) o.t = tg;
      serviceOut.push(o);
    });
  }));
  const segName = Object.fromEntries(segments.map((s) => [s.id, s.name]));
  const articleOut = articles.map((a) => {
    const heads = a.blocks.filter((b) => b.type === 'h2' || b.type === 'h3').map((b) => stripTokens(b.text));
    return { id: a.id, slug: a.slug, seg: a.segmentId, segName: segName[a.segmentId], t: stripTokens(a.title), x: stripTokens(a.excerpt || ''), k: [stripTokens(a.subtitle || ''), ...heads].filter(Boolean).join(' | '), m: a.readMinutes };
  });
  const offerOut = offers.map((o) => ({ id: o.id, slug: o.slug || o.id, tag: o.tag, t: o.title, d: o.includes || o.description || '', p: o.price }));

  const known = {
    group: new Set(groupOut.map((g) => g.id)), service: new Set(serviceOut.map((s) => s.id)),
    article: new Set(articleOut.map((a) => a.id)), offer: new Set(offerOut.map((o) => o.id)),
  };
  const entries = [], phrases = {}, dropped = [];
  [...synonyms.entries, ...synonyms.questions].forEach((e) => {
    /* ids that exist, and next to them how well the site's wording supports each (the arrays stay the same length) */
    const keep = (list, set, kind) => { const ids = [], w = []; (list || []).forEach((id) => { if (set.has(id)) { ids.push(id); w.push(evidenceLevel((e.evidence || {})[id])); } else dropped.push(kind + ' ' + id + ' (' + e.id + ')'); }); return [ids, w]; };
    const ix = entries.length;
    const [g, gw] = keep(e.targets.groupIds, known.group, 'group'), [v, vw] = keep(e.targets.serviceIds, known.service, 'service');
    const [a, aw] = keep(e.targets.articleIds, known.article, 'article'), [o, ow] = keep(e.targets.offerIds, known.offer, 'offer');
    entries.push({ id: e.id, s: STRENGTH[e.strength] || 1, g, gw, v, vw, a, aw, o, ow });
    e.phrases.forEach((p) => { const f = fold(p); if (!f) return; (phrases[f] = phrases[f] || []); if (!phrases[f].includes(ix)) phrases[f].push(ix); });
  });

  const data = {
    v: 2,
    note: 'Generated by _tools/a/build-pages.mjs (build-search-index.mjs). Do not edit by hand. The vocabulary is hidden: it is never displayed.',
    tabs: tabs.map((t) => ({ id: t.id, label: t.label })),
    groups: groupOut, services: serviceOut, articles: articleOut, offers: offerOut,
    tg: tagList,
    syn: { entries, phrases },
  };
  return { source: 'window.LSD_SEARCH=' + JSON.stringify(data) + ';\n', stats: { groups: groupOut.length, services: serviceOut.length, articles: articleOut.length, offers: offerOut.length, entries: entries.length, phrases: Object.keys(phrases).length, tags: tagList.length, dropped } };
}
