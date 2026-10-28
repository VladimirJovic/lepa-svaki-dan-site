#!/usr/bin/env node
/* ============================================================================
   verify-content.js : independent re-verification of the content pack
   ----------------------------------------------------------------------------
   Does NOT reuse the extraction code of build-content.js. Three independent
   recomputations from the OLD html:
     A. raw-text recount (regex over the source lines, no JS evaluation)
     B. provenance: every verbatim string in content.json must occur in the
        old source (raw, entity-decoded, or tag-stripped text)
     C. rendered-DOM recount: the real old pages are executed in jsdom and the
        rendered cenovnik / bento / picks / offers / blog cards are read back
   plus: content.js parity with content.json and "NEW copy really is new".

   The shared content fixes (owner title, dashes; content-fixes.js) are the ONLY
   allowed deviation from the old source: every comparison against the old site
   passes the old text through the same fixText() first, so a retyped or altered
   string is still caught while the reviewed fixes are expected.

   Usage: node verify-content.js     (exit code 1 on any failure)
   ECHOSYSTEM-MOTHER AGENCY
   ============================================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const FX = require('./content-fixes.js');

function decode(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
const collapse = (s) => s.replace(/\s+/g, ' ').trim();

/* different algorithm than build-content.js: strip dots first, split on dash */
function firstNumbers(part) {
  return part.replace(/\./g, '').split(/[\u2013-]/).map((x) => parseInt(x.replace(/[^\d]/g, ''), 10)).filter((n) => !Number.isNaN(n));
}
function priceMins(priceStr) {
  if (!priceStr || priceStr === '\u2014' || /na upit/i.test(priceStr)) return { eur: 0, rsd: 0, eurMax: 0, rsdMax: 0, has: false };
  const [e, r = ''] = priceStr.replace(/^od\s+/, '').split('/');
  const en = firstNumbers(e), rn = firstNumbers(r);
  return { eur: en.length ? Math.min(...en) : 0, rsd: rn.length ? Math.min(...rn) : 0, eurMax: en.length ? Math.max(...en) : 0, rsdMax: rn.length ? Math.max(...rn) : 0, has: true };
}

function run({ contentPath, oldDir, copyNotesPath }) {
  const failures = [];
  const checks = [];
  const check = (name, a, b) => {
    const ok = JSON.stringify(a) === JSON.stringify(b);
    checks.push({ name, ok, expected: b, actual: a });
    if (!ok) failures.push(`${name}: content=${JSON.stringify(a)} recomputed=${JSON.stringify(b)}`);
  };

  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const raw = {
    index: fs.readFileSync(path.join(oldDir, 'index.html'), 'utf8'),
    blog: fs.readFileSync(path.join(oldDir, 'blog.html'), 'utf8'),
    offers: fs.readFileSync(path.join(oldDir, 'posebna-ponuda.html'), 'utf8'),
  };

  /* ---------------- 0. content.js parity -------------------------------- */
  const jsPath = path.join(path.dirname(contentPath), 'content.js');
  const jsSrc = fs.readFileSync(jsPath, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(jsSrc, sandbox);
  check('content.js window.LSD_CONTENT deep-equals content.json', JSON.stringify(sandbox.window.LSD_CONTENT) === JSON.stringify(content), true);

  /* ---------------- A. raw-text recount --------------------------------- */
  const idxLines = raw.index.split('\n');
  const startP = idxLines.findIndex((l) => l.startsWith('const pricingTabs = ['));
  const endP = idxLines.findIndex((l, i) => i > startP && l === '];');
  const startL = idxLines.findIndex((l) => l.startsWith('const laserGroups = ['));
  const endL = idxLines.findIndex((l, i) => i > startL && l === '];');
  if ([startP, endP, startL, endL].some((x) => x < 0)) failures.push('raw recount: could not locate data blocks');
  const pBlock = idxLines.slice(startP, endP + 1);
  const lBlock = idxLines.slice(startL, endL + 1);
  const rawTabs = pBlock.filter((l) => /^\{ id:"/.test(l)).length;
  const rawGroups = pBlock.filter((l) => /^\s*\{ title:"/.test(l)).length;
  const rawSvcLines = pBlock.filter((l) => /^\s*\{ name:"/.test(l));
  const rawPrices = rawSvcLines.map((l) => (/price:"((?:[^"\\]|\\.)*)"/.exec(l) || [])[1]);
  const rawHighlights = rawSvcLines.filter((l) => /highlight:true/.test(l)).length;
  const rawLaserGroups = lBlock.filter((l) => /^\s*\{ title:"/.test(l)).length;
  const rawLaserLines = lBlock.filter((l) => /^\s*\{ name:"/.test(l));
  const rawNB = rawLaserLines.map((l) => (/priceNB:"([^"]*)"/.exec(l) || [])[1]);
  const rawBW = rawLaserLines.map((l) => (/priceBW:"([^"]*)"/.exec(l) || [])[1]);
  const sumOf = (arr, key) => arr.reduce((a, p) => a + priceMins(p)[key], 0);

  const rawCounts = {
    tabs: rawTabs + 1, /* + hard-coded laser tab button */
    groups: rawGroups + rawLaserGroups,
    standardServices: rawSvcLines.length,
    laserServices: rawLaserLines.length,
    services: rawSvcLines.length + rawLaserLines.length,
    highlightedStandard: rawHighlights,
  };
  const rawSums = {
    standardEurMinSum: sumOf(rawPrices, 'eur'), standardEurMaxSum: sumOf(rawPrices, 'eurMax'),
    standardRsdMinSum: sumOf(rawPrices, 'rsd'), standardRsdMaxSum: sumOf(rawPrices, 'rsdMax'),
    laserNbEurMinSum: sumOf(rawNB, 'eur'), laserBwEurMinSum: sumOf(rawBW, 'eur'),
  };
  const c = content._meta.counts, k = content._meta.checksums;
  check('A raw: tabs', c.tabs, rawCounts.tabs);
  check('A raw: groups', c.groups, rawCounts.groups);
  check('A raw: standard services', c.standardServices, rawCounts.standardServices);
  check('A raw: laser services', c.laserServices, rawCounts.laserServices);
  check('A raw: total services', c.services, rawCounts.services);
  check('A raw: highlighted standard', c.highlightedStandard, rawCounts.highlightedStandard);
  Object.keys(rawSums).forEach((key) => check('A raw: ' + key, k[key], rawSums[key]));

  /* offers / blog / testimonials raw recount */
  const rawOffersBlock = (/const specialOffers = \[([\s\S]*?)\n\];/.exec(raw.offers) || [])[1] || '';
  const rawOfferLines = rawOffersBlock.split('\n').filter((l) => /^\s*\{ tag:"/.test(l));
  check('A raw: offers count', c.offers, rawOfferLines.length);
  const rawOfferPrices = rawOfferLines.map((l) => (/price:"([^"]*)"/.exec(l) || [])[1]);
  check('A raw: offers EUR sum', k.offersEurSum, sumOf(rawOfferPrices, 'eur'));
  check('A raw: offers RSD sum', k.offersRsdSum, sumOf(rawOfferPrices, 'rsd'));
  const rawBlogCount = (raw.blog.match(/^\s{4}title: '/gm) || []).length;
  check('A raw: blog posts', c.blogPosts, rawBlogCount);
  const rawTestimonials = (raw.index.match(/^\s*\{ quote:"/gm) || []).length;
  check('A raw: testimonials', c.testimonials, rawTestimonials);
  const rawVerticals = (raw.index.match(/^\s*\{ title:"[^"]*", summary:"/gm) || []).length;
  check('A raw: verticals', c.verticals, rawVerticals);
  const rawQuizQ = (raw.index.match(/^\s*\{ id:"(goal|skin|depth)", prompt:/gm) || []).length;
  check('A raw: quiz questions', c.quizQuestions, rawQuizQ);
  const rawTagRules = (raw.index.match(/^\s*\{ tag:"#[^"]*", match:\[/gm) || []).length;
  check('A raw: tag rules', c.tagRules, rawTagRules);

  /* content self-consistency (tabs tree vs flat index) */
  const treeServices = content.pricing.tabs.reduce((a, t) => a + t.groups.reduce((b, g) => b + g.services.length, 0), 0);
  check('tree services == allServices.length', treeServices, content.allServices.length);
  const linesOf = (svcs, nameOf) => crypto.createHash('sha256').update(svcs.map((s, i) => [s.tab, s.group, nameOf(s, i), s.price].join('|')).join('\n')).digest('hex');
  check('serviceLines sha256 after fixes', k.serviceLinesSha256AfterFixes, linesOf(content.allServices, (s) => s.name));
  check('priceLines sha256 (id|price|priceEur|priceRsd, name independent)', k.priceLinesSha256,
    crypto.createHash('sha256').update(content.allServices.map((s) => [s.id, s.price, JSON.stringify(s.priceEur), JSON.stringify(s.priceRsd)].join('|')).join('\n')).digest('hex'));
  /* source checksum (before the fixes): restore the logged service-name edits and recompute */
  const fixLogPath = path.join(__dirname, 'fixes-log.content.json');
  if (fs.existsSync(fixLogPath)) {
    const restored = {};
    JSON.parse(fs.readFileSync(fixLogPath, 'utf8')).changes.forEach((ch) => { const m = /^allServices\[(\d+)\]\.name$/.exec(ch.path); if (m) restored[m[1]] = ch.before; });
    check('serviceLines sha256 of the SOURCE names (logged edits reverted) == MANIFEST checksum', k.serviceLinesSha256, linesOf(content.allServices, (s, i) => (restored[i] != null ? restored[i] : s.name)));
  }
  check('per-tab services sum', Object.values(c.perTab).reduce((a, t) => a + t.services, 0), c.services);
  /* stats display recompute */
  content.stats.items.forEach((s) => check('stat display ' + s.label, s.display, s.value.toLocaleString('sr-RS') + s.suffix));
  const rawStatTargets = [...raw.index.matchAll(/data-target="(\d+)" data-suffix="([^"]*)"/g)].map((m) => [parseInt(m[1], 10), m[2]]);
  check('stat targets/suffix vs raw', content.stats.items.map((s) => [s.value, s.suffix]), rawStatTargets);
  check('validFromISO derived from raw date', content.pricing.validFromISO, ((/<strong>(\d{2})\.(\d{2})\.(\d{4})\.<\/strong>/.exec(raw.index)) || []).slice(1).reverse().join('-'));
  check('payment/valid date vs raw', content.pricing.validFrom, (/<strong>(\d{2}\.\d{2}\.\d{4}\.)<\/strong>/.exec(raw.index) || [])[1]);

  /* the owner's signature is a reviewed replacement of the old signature line (see content-fixes.rules.json) */
  check('founder.signature is the reviewed signature', content.founder.signature, FX.SIGNATURE);
  check('founder.signatureName uses founder.signature', content.founder.signatureName, content.founder.signature);
  check('owner is not a doctor: no "dr"/"Dr" directly before "Tamara Ćosić" in any string (Tamara Vujačić IS a doctor and keeps "dr")', JSON.stringify(content).match(/\b[Dd]r\.?\s+Tamara\s+Ćosić/g) || [], []);
  check('founder is Tamara Ćosić, osnivačica Lepe Svaki Dan', [content.founder.name, content.founder.signature], ['Tamara Ćosić', 'Tamara Ćosić, osnivačica Lepe Svaki Dan']);
  check('no em dash and no non-numeric en dash in content.json', FX.leftovers(JSON.stringify(content)).length, 0);

  /* ---------------- B. provenance of verbatim strings ------------------- */
  const hay = [];
  Object.values(raw).forEach((r) => {
    hay.push(r);
    const d = decode(r);
    hay.push(d);
    hay.push(collapse(decode(r.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ' '))));
    hay.push(decode(r.replace(/<br\s*\/?>\s*/g, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n'));
  });
  hay.slice().forEach((h) => hay.push(FX.fixText(h))); /* the reviewed content fixes are the only allowed deviation from the source */
  const hayAll = hay.join('\n§§§\n');
  const hayCollapsed = collapse(hayAll);
  const SKIP_KEYS = new Set(['_meta', 'copy', 'html', 'absolutePath', 'usage', 'slug', 'id', 'anchor', 'anchorByIndex', 'tags', 'date', 'kind',
    'note', 'displayRules', 'algorithm', 'scoring', 'behaviour', 'yearNote', 'locationLabel', 'verticalKey', 'initialPhrase_', 'postAnchor', 'linkedServiceIds',
    'categoryCount', 'cenovnik', 'cenovnikRef', 'cenovnikTab', 'whatsappLabel_', 'priceNBParsed', 'priceBWParsed', 'hoursParsed', 'parsed', 'fromDay', 'toDay', 'open', 'close',
    'rawHref', 'matchesCenovnikPrice', 'cenovnikServiceCount', 'includes', 'iconKey', 'validFromISO', 'signature', 'signatureName']);
  const FORCED_FIELDS = new Set(['founder.name', 'founder.role', 'founder.signatureMeta', 'founder.image.alt', 'stats.founderMeta', 'images.founder-portrait.jpg.alt', 'site.pages.home.description']);
  /* 'display' is derived only under stats.items (counter output); elsewhere it is verbatim source text */
  const verbatimChecked = { n: 0 };
  const missing = [];
  const normalizedHasLine = (s) => hayAll.includes(s) || hayCollapsed.includes(collapse(s));
  function walk(node, trail) {
    if (node == null) return;
    if (typeof node === 'string') {
      const key = trail[trail.length - 1] || '';
      if (SKIP_KEYS.has(key) || /Html$/.test(key)) return;
      if (FORCED_FIELDS.has(trail.join('.'))) return;   /* the founder fields are forced by content-fixes.js (client feedback 3), they are not in the old source */
      if (key === 'display' && trail.includes('stats')) return;
      /* laser rows: price is the old unifiedLaserPrice() output; the "od " prefix is derived, the rest must be verbatim */
      if (key === 'price') node = node.replace(/^od /, '');
      /* templates with placeholders: check the literal parts */
      const pieces = node.split('\n').flatMap((line) => line.split(/\{(?:query|year|date)\}/)).map((x) => x.trim()).filter(Boolean);
      for (const piece of pieces) {
        verbatimChecked.n++;
        if (!normalizedHasLine(piece)) missing.push(trail.join('.') + ' = ' + JSON.stringify(piece.slice(0, 90)));
      }
      return;
    }
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, trail.concat(String(i)))); return; }
    if (typeof node === 'object') {
      for (const [kk, v] of Object.entries(node)) {
        if (SKIP_KEYS.has(kk)) continue;
        walk(v, trail.concat(kk));
      }
    }
  }
  walk(content, []);
  checks.push({ name: 'B provenance: verbatim strings checked', ok: true, expected: null, actual: verbatimChecked.n });
  if (missing.length) missing.forEach((m) => failures.push('B provenance (not found in old source): ' + m));
  checks.push({ name: 'B provenance: strings NOT found in source', ok: missing.length === 0, expected: 0, actual: missing.length });

  /* ---------------- E. NEW copy is really new --------------------------- */
  const segs = new Set();
  Object.values(raw).forEach((r) => {
    [...r.matchAll(/>([^<>]+)</g)].forEach((m) => { const t = collapse(decode(m[1])); if (t) segs.add(norm(t)); });
    [...r.matchAll(/"((?:[^"\\\n]|\\.){2,200})"|'((?:[^'\\\n]|\\.){2,200})'/g)].forEach((m) => segs.add(norm(decode(m[1] || m[2]))));
    [...r.matchAll(/`([^`]*)`/g)].forEach((m) => m[1].split(/<[^>]+>|\$\{[^}]*\}/).forEach((t) => { t = collapse(decode(t)); if (t) segs.add(norm(t)); }));
  });
  function norm(s) { return s.toLowerCase().replace(/[›»]/g, '').replace(/\s+/g, ' ').trim(); }
  const collisions = content.copy.newStrings.filter((s) => segs.has(norm(s.text)));
  collisions.forEach((s) => failures.push('E NEW copy already exists in old site: ' + s.text));
  checks.push({ name: 'E new-copy strings that already exist in old site', ok: collisions.length === 0, expected: 0, actual: collisions.length });
  check('E new copy count within 8..12', content.copy.newStrings.length >= 8 && content.copy.newStrings.length <= 12, true);
  const notesMd = fs.existsSync(copyNotesPath) ? fs.readFileSync(copyNotesPath, 'utf8') : '';
  const missingInNotes = content.copy.newStrings.filter((s) => !notesMd.includes(s.text.replace(/\|/g, '\\|')));
  check('E COPY_NOTES.md lists every new string', missingInNotes.length, 0);

  /* ---------------- C. rendered DOM recount (jsdom) ---------------------- */
  let dom = { status: 'skipped' };
  const jsdomPath = process.env.JSDOM_PATH || '/Users/vladajovic/Developer/ChatBots for Business/node_modules/jsdom';
  let JSDOM = null;
  try { ({ JSDOM } = require(jsdomPath)); } catch (e) { dom = { status: 'skipped', reason: 'jsdom not found at ' + jsdomPath + ' (set JSDOM_PATH)' }; }
  if (JSDOM) {
    dom = { status: 'ran', jsdomPath };
    const load = (file) => {
      const errors = [];
      const vc = new (require(jsdomPath).VirtualConsole)();
      vc.on('jsdomError', (e) => errors.push(String(e && e.message || e).slice(0, 160)));
      const d = new JSDOM(raw[file], {
        runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' + (file === 'index' ? 'index.html' : file === 'blog' ? 'blog.html' : 'posebna-ponuda.html'), virtualConsole: vc,
        beforeParse(w) {
          w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
          w.matchMedia = (q) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
          w.HTMLElement.prototype.scrollIntoView = function () {};
          w.scrollTo = () => {};
          w.CSS = { escape: (s) => s };
        },
      });
      return { w: d.window, errors };
    };
    const txt = (el) => (el ? FX.fixText(collapse(el.textContent)) : null);

    /* index.html */
    const { w, errors } = load('index');
    const doc = w.document;
    dom.indexScriptErrors = errors.length;
    const tabBtns = [...doc.querySelectorAll('#cenovnik-tabs .tab-btn')];
    const domTabs = [];
    tabBtns.forEach((btn) => {
      btn.click();
      const label = txt(doc.querySelector('#cenovnik-tabs .tab-btn.active'));
      const panel = doc.getElementById('cenovnik-panel');
      const groups = [...panel.querySelectorAll('.acc-group')].map((g) => ({
        title: txt(g.querySelector('.acc-title')), countLabel: txt(g.querySelector('.acc-count')),
        rows: [...g.querySelectorAll('.svc-row')].map((r) => ({
          name: txt(r.querySelector('.svc-name')), desc: txt(r.querySelector('.svc-desc')), price: txt(r.querySelector('.svc-price')),
          highlight: !!r.querySelector('.svc-highlight'), article: r.dataset.blogPost || null,
        })),
      }));
      const laserGroups = [...panel.querySelectorAll('.laser-group')].map((g) => ({
        title: txt(g.querySelector('h3')),
        rows: [...g.querySelectorAll('.laser-row')].map((r) => ({ name: txt(r.querySelector('.laser-cell-name')), price: txt(r.querySelector('.laser-cell-price')) })),
      }));
      domTabs.push({ label, groups, laserGroups });
    });
    const domGroups = domTabs.reduce((a, t) => a + t.groups.length + t.laserGroups.length, 0);
    const domStd = domTabs.reduce((a, t) => a + t.groups.reduce((b, g) => b + g.rows.length, 0), 0);
    const domLaser = domTabs.reduce((a, t) => a + t.laserGroups.reduce((b, g) => b + g.rows.length, 0), 0);
    const domHighlights = domTabs.reduce((a, t) => a + t.groups.reduce((b, g) => b + g.rows.filter((r) => r.highlight).length, 0), 0);
    const domStdPrices = domTabs.flatMap((t) => t.groups.flatMap((g) => g.rows.map((r) => r.price)));
    const domLaserPrices = domTabs.flatMap((t) => t.laserGroups.flatMap((g) => g.rows.map((r) => r.price)));
    dom.recount = { tabs: domTabs.length, groups: domGroups, standardServices: domStd, laserServices: domLaser, highlightedStandard: domHighlights,
      standardEurMinSum: domStdPrices.reduce((a, p) => a + priceMins(p).eur, 0), standardRsdMinSum: domStdPrices.reduce((a, p) => a + priceMins(p).rsd, 0),
      laserUnifiedEurMinSum: domLaserPrices.reduce((a, p) => a + priceMins(p).eur, 0) };
    check('C dom: tabs', c.tabs, domTabs.length);
    check('C dom: groups', c.groups, domGroups);
    check('C dom: standard services', c.standardServices, domStd);
    check('C dom: laser services', c.laserServices, domLaser);
    check('C dom: highlighted', c.highlightedStandard, domHighlights);
    check('C dom: standard EUR min sum', k.standardEurMinSum, dom.recount.standardEurMinSum);
    check('C dom: standard RSD min sum', k.standardRsdMinSum, dom.recount.standardRsdMinSum);
    check('C dom: laser unified EUR min sum', k.laserUnifiedEurMinSum, dom.recount.laserUnifiedEurMinSum);
    /* row-by-row */
    const tabTree = content.pricing.tabs;
    let rowMismatch = 0;
    tabTree.forEach((t, ti) => {
      const d = domTabs[ti];
      if (!d || d.label !== t.label) { rowMismatch++; return; }
      if (t.kind === 'standard') {
        t.groups.forEach((g, gi) => {
          const dg = d.groups[gi];
          if (!dg || dg.title !== g.title || dg.rows.length !== g.services.length) { rowMismatch++; return; }
          if (dg.countLabel !== g.services.length + ' ' + content.pricing.ui.groupCountSuffix) rowMismatch++;
          g.services.forEach((s, si) => {
            const r = dg.rows[si];
            if (r.name !== collapse(s.name) || r.price !== collapse(s.price) || (r.desc || null) !== (s.description ? collapse(s.description) : null) || r.highlight !== !!s.highlight || (r.article || null) !== (s.blogPost || null)) rowMismatch++;
          });
        });
      } else {
        t.groups.forEach((g, gi) => {
          const dg = d.laserGroups[gi];
          if (!dg || dg.title !== g.title || dg.rows.length !== g.services.length) { rowMismatch++; return; }
          g.services.forEach((s, si) => { const r = dg.rows[si]; if (r.name !== collapse(s.name) || r.price !== collapse(s.price)) rowMismatch++; });
        });
      }
    });
    check('C dom: row-by-row mismatches (name/desc/price/highlight/blog link/unified laser price)', rowMismatch, 0);

    /* sections */
    check('C dom: testimonial dots', c.testimonials, doc.querySelectorAll('#t-dots .t-dot').length);
    check('C dom: bento cards', c.verticals, doc.querySelectorAll('.bento-card').length);
    check('C dom: bento titles+counts', content.verticals.map((v) => [v.title, v.statedCount, v.locationLabel, v.href]),
      [...doc.querySelectorAll('.bento-card')].map((el) => [txt(el.querySelector('.bento-title')), txt(el.querySelector('.bento-count')), txt(el.querySelector('.loc-badge')), el.getAttribute('href')]));
    check('C dom: favorites', content.favorites.map((p) => [p.name, p.description || '', p.price]),
      [...doc.querySelectorAll('#favorites-grid .pick-card')].map((el) => [txt(el.querySelector('.pick-name')), txt(el.querySelector('.pick-desc')) || '', txt(el.querySelector('.pick-price'))]));
    check('C dom: gifts', content.gifts.map((p) => [p.name, p.description || '', p.price]),
      [...doc.querySelectorAll('#gifts-grid .pick-card')].map((el) => [txt(el.querySelector('.pick-name')), txt(el.querySelector('.pick-desc')) || '', txt(el.querySelector('.pick-price'))]));
    check('C dom: quiz question 1', [content.quiz.questions[0].prompt, content.quiz.questions[0].options.map((o) => o.label)],
      [txt(doc.querySelector('#quiz-card .quiz-question h3')), [...doc.querySelectorAll('#quiz-card .quiz-opt .label')].map(txt)]);
    check('C dom: stat labels', content.stats.items.map((s) => s.label), [...doc.querySelectorAll('.stat-label')].map(txt));
    /* every testimonial, by stepping the page's own carousel */
    const tAuthors = [], tTags = [];
    for (let i = 0; i < c.testimonials; i++) { tAuthors.push(txt(doc.getElementById('t-author'))); tTags.push(txt(doc.getElementById('t-tag'))); doc.getElementById('t-next').click(); }
    check('C dom: testimonial authors/tags', content.testimonials.map((t) => [t.author, t.tag]), tAuthors.map((a, i) => [a, tTags[i]]));
    check('C dom: nav links', content.nav.links.map((l) => [l.label, l.hrefOnHome]), [...doc.querySelectorAll('.nav-links a')].map((a) => [txt(a), a.getAttribute('href')]));
    check('C dom: footer social', content.footer.columns.social.links.map((l) => [l.label, l.href]), [...[...doc.querySelectorAll('footer .footer-col-2')].find((col) => txt(col.querySelector('.footer-heading')) === 'Pratite nas').querySelectorAll('a')].map((a) => [txt(a), a.getAttribute('href')]));

    /* posebna-ponuda.html */
    w.close();
    const o = load('offers');
    const offerCards = [...o.w.document.querySelectorAll('.offer-card')];
    dom.offersScriptErrors = o.errors.length;
    check('C dom: offers count', c.offers, offerCards.length);
    check('C dom: offers rows', content.offers.map((x) => [x.tag, x.title, x.description, x.note, x.price, x.cta.label, x.cta.href]),
      offerCards.map((el) => [txt(el.querySelector('.offer-tag')), txt(el.querySelector('.offer-title')), txt(el.querySelector('.offer-desc')), txt(el.querySelector('.offer-note')), txt(el.querySelector('.offer-price')), txt(el.querySelector('.offer-cta')), el.querySelector('.offer-cta').getAttribute('href')]));
    const offersDomRef = o.w;
    dom.offersEurSum = offerCards.reduce((a, el) => a + priceMins(txt(el.querySelector('.offer-price'))).eur, 0);
    check('C dom: offers EUR sum', k.offersEurSum, dom.offersEurSum);
    offersDomRef.close();

    /* blog.html */
    const b = load('blog');
    dom.blogScriptErrors = b.errors.length;
    const cards = [...b.w.document.querySelectorAll('.post-card')];
    check('C dom: blog posts', c.blogPosts, cards.length);
    check('C dom: blog cards title/excerpt/image/category', content.blog.map((p) => [p.title, p.excerpt, p.image, p.categoryLabel]),
      cards.map((el) => [txt(el.querySelector('.post-card-title')), txt(el.querySelector('.post-card-excerpt')), el.querySelector('img').getAttribute('src'), txt(el.querySelector('.post-card-cat'))]));
    check('C dom: blog tab labels/counts', content.blogCategories.map((x) => x.label + ' (' + x.count + ')'), [...b.w.document.querySelectorAll('#blog-tabs .tab-btn')].map(txt));
    check('C dom: blog tag pills == derived tags (first 4)', content.blog.map((p) => p.tags.slice(0, 4)),
      cards.map((el) => [...el.querySelectorAll('.tag-pill')].map((t) => '#' + txt(t))));
    b.w.close();
  }

  const ok = failures.length === 0;
  return {
    ok, failures, checks, dom,
    recount: { rawCounts, rawSums, rawOffers: rawOfferLines.length, rawBlog: rawBlogCount, rawTestimonials, rawVerticals, rawQuizQ, rawTagRules },
    provenance: { verbatimStringsChecked: verbatimChecked.n, notFound: missing.length },
    ranAt: new Date().toISOString(),
  };
}

module.exports = { run };
if (require.main === module) {
  const out = path.resolve(__dirname, '..');
  const r = run({ contentPath: path.join(out, 'content.json'), oldDir: process.env.LSD_OLD_DIR || '/Users/vladajovic/Developer/LEPA SVAKI DAN/lepasvakidrugidan', copyNotesPath: path.join(out, 'COPY_NOTES.md') });
  r.checks.forEach((x) => console.log((x.ok ? 'PASS ' : 'FAIL ') + x.name + (x.ok ? '' : '  expected=' + JSON.stringify(x.expected) + ' actual=' + JSON.stringify(x.actual))));
  console.log('\n' + (r.ok ? 'ALL CHECKS PASSED' : 'FAILURES: ' + r.failures.length));
  process.exit(r.ok ? 0 : 1);
}
