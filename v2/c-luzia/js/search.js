/* Lepa Svaki Dan - preview "C": ONE search engine for every page.
   - The hero search bar of the home page (results drop down under the field),
   - the search overlay opened by the header search button on every other page (and on the home page),
   - the price-list search of the home page (js/main.js asks this engine which services match).
   Data: assets/search-index.js (window.LSD_SEARCH_DATA, generated from content + articles + search-synonyms.json), loaded lazily,
   only when somebody searches (the home page fetches it when the browser is idle, so the first keystroke is instant).
   Matching: case- and diacritics-insensitive (c/c/s/z/dj folding), partial words, several words (all must match), light stemming
   (Serbian endings), and the HIDDEN synonym vocabulary (how women ask: "ozilci od akni", "kako smanjiti obim", "blistava koza").
   Tags and phrases are never rendered. Vanilla JS, no libraries.
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var me = doc.currentScript;
  var ROOT = me && me.getAttribute('src') ? me.getAttribute('src').replace(/js\/search\.js.*$/, '') : '';   // '' on the home page, '../' on sub pages
  var MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  var LOW_D = String.fromCharCode(0x111);   // d with stroke
  var IDX = null, loading = false, waiters = [];

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fold(s) { return String(s).toLowerCase().normalize('NFD').replace(MARKS, '').split(LOW_D).join('dj').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function plural(n, one, few, many) { var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? one : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? few : many; }
  function icon(id, s) { return '<svg class="ico" width="' + (s || 20) + '" height="' + (s || 20) + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function eur(n) { return 'od ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '€'; }
  function eurOf(price) { var m = String(price).match(/(\d{1,3}(?:\.\d{3})*|\d+)(?:[–-]\d[\d.]*)?\s*€/); return m ? +m[1].replace(/\./g, '') : null; }

  /* ---------------------------------------------------------------- index ---------- */
  function load(cb) {
    if (IDX) { cb(IDX); return; }
    waiters.push(cb);
    if (loading) return;
    loading = true;
    if (window.LSD_SEARCH_DATA) { build(); return; }
    var s = doc.createElement('script');
    s.src = ROOT + 'assets/search-index.js'; s.async = true;
    s.onload = build;
    s.onerror = function () { loading = false; waiters = []; };
    doc.head.appendChild(s);
  }
  function build() {
    var D = window.LSD_SEARCH_DATA, I = { tabs: D.tabs.map(function (t) { return { id: t[0], label: t[1] }; }), gById: {}, sById: {}, aById: {}, oBySlug: {} };
    I.groups = D.groups.map(function (g) {
      var o = { id: g[0], title: g[1], tab: g[2], n: g[3], min: g[4], svcs: [], hay: ' ' + fold(g[1] + ' ' + D.tabs[g[2]][1]) + ' ' };
      I.gById[o.id] = o; return o;
    });
    I.svcs = D.svcs.map(function (s) {
      var g = I.groups[s[3]], o = { id: s[0], name: s[1], desc: s[2], g: g, price: s[4], eur: eurOf(s[4]), nameF: ' ' + fold(s[1]) + ' ', descF: ' ' + fold(s[2]) + ' ', grpF: g.hay, tagF: ' ' + fold(s[5]) + ' ' };
      g.svcs.push(o); I.sById[o.id] = o; return o;
    });
    I.segs = D.segs.map(function (s) { return { id: s[0], slug: s[1], name: s[2] }; });
    I.arts = D.arts.map(function (a) {
      var o = { id: a[0], slug: a[1], seg: I.segs[a[2]], title: a[3], sub: a[4], ex: a[5], min: a[6], heads: a[7], text: a[8], titleF: ' ' + fold(a[3]) + ' ', headF: ' ' + fold(a[7] + ' ' + a[4] + ' ' + a[5]) + ' ', bodyF: ' ' + fold(a[8]) + ' ' };
      I.aById[o.id] = o; return o;
    });
    I.offers = D.offers.map(function (o) { var r = { slug: o[0], title: o[1], tag: o[2], inc: o[3], price: o[4], titleF: ' ' + fold(o[1]) + ' ', tagF: ' ' + fold(o[2]) + ' ', incF: ' ' + fold(o[3]) + ' ' }; I.oBySlug[r.slug] = r; return r; });
    I.syn = D.syn;
    IDX = I; loading = false;
    var w = waiters; waiters = []; w.forEach(function (f) { f(IDX); });
  }
  /* the offers page / home page carry the live, hand-edited offers (assets/offers.js): prefer them over the copy in the index */
  function liveOffers() {
    var L = window.LSD_CONTENT && window.LSD_CONTENT.offers; if (!L || !L.length) return IDX.offers;
    return L.map(function (o) { return { slug: o.slug, title: o.title, tag: o.tag, inc: o.includes, price: o.price, titleF: ' ' + fold(o.title) + ' ', tagF: ' ' + fold(o.tag) + ' ', incF: ' ' + fold(o.includes) + ' ' }; });
  }

  /* ---------------------------------------------------------------- matching ---------- */
  var STOP = {}; 'za od i da se na u sa mi li je su to kako sta mogu koji koje koja iz ili bez pre posle sve kod ima imam hocu zelim treba mozete molim me vas nas ne ni a o s'.split(' ').forEach(function (w) { STOP[w] = 1; });
  function parse(q) {
    var f = fold(q), all = f ? f.split(' ') : [], core = all.filter(function (t) { return !STOP[t]; });
    return { f: f, toks: core.length ? core : all };
  }
  function stem(t) { return t.length >= 5 ? t.replace(/[aeiou]$/, '') : t; }
  function hit(hay, t) {                       // 3 = a word starts with it, 2 = starts with its stem, 1 = inside a word (4+ letters)
    if (hay.indexOf(' ' + t) > -1) return 3;
    var st = stem(t); if (st !== t && st.length >= 4 && hay.indexOf(' ' + st) > -1) return 2;
    if (t.length >= 4 && hay.indexOf(t) > -1) return 1;
    return 0;
  }
  function scoreWith(toks, fields) {            // fields: [[hay, weight], ...]; every token must hit some field
    var sum = 0;
    for (var i = 0; i < toks.length; i++) {
      var best = 0;
      for (var k = 0; k < fields.length; k++) { var h = hit(fields[k][0], toks[i]); if (h) best = Math.max(best, h * fields[k][1]); }
      if (!best) return 0;
      sum += best;
    }
    return sum;
  }
  var SF = { s: 1, m: 0.85, w: 0.6 };
  /* synonym entries that answer the query. The most specific wins: an exact phrase beats an entry that only contains a shorter word of the query
     ("ukljesteni vrat" must not pull in everything written about "vrat"); among contained phrases the longest ones win. */
  function synMatches(P) {
    var out = [], qf = P.f; if (qf.length < 3) return out;
    var pad = ' ' + qf + ' ';
    IDX.syn.forEach(function (e) {
      var best = 0, len = 0;
      for (var i = 0; i < e.p.length; i++) {
        var p = e.p[i], sc = 0;
        if (p === qf) sc = 100;
        else if (p.length >= 4 && pad.indexOf(' ' + p + ' ') > -1) sc = 80;                          // the query contains the phrase
        else if (p.indexOf(qf) === 0) sc = 55;                                                      // typing the start of a phrase
        else if (qf.length >= 4 && (' ' + p + ' ').indexOf(' ' + qf) > -1) sc = 35;                   // the query starts a word inside a phrase
        if (sc > best || (sc === best && p.length > len)) { best = sc; len = p.length; }
      }
      if (best) out.push({ e: e, s: best * SF[e.s], kind: best, len: len });
    });
    var exact = out.filter(function (m) { return m.kind === 100; });
    if (exact.length) return exact;
    var cont = out.filter(function (m) { return m.kind === 80; });
    if (cont.length) { var mx = Math.max.apply(null, cont.map(function (m) { return m.len; })); return cont.filter(function (m) { return m.len >= mx * 0.6; }); }
    return out.filter(function (m) { return m.s >= 30; });
  }
  function add(map, k, v) { map[k] = (map[k] || 0) + v; }

  /* the full answer for a query: price groups (with matched services), texts, offers */
  function run(q) {
    var P = parse(q), res = { q: q, P: P, groups: [], arts: [], offers: [], soft: false, total: 0 };
    if (!P.f || P.f.length < 2) return res;
    var syn = synMatches(P), gSc = {}, sSc = {}, aSc = {}, oSc = {}, strong = false;
    syn.forEach(function (m) {
      var e = m.e, w = m.s; if (e.s !== 'w') strong = true;
      e.g.forEach(function (g) { add(gSc, g, w); });
      e.v.forEach(function (v) { var s = IDX.sById[v]; if (s) { add(sSc, v, w); add(gSc, s.g.id, w * 0.5); } });
      e.a.forEach(function (a, i) { add(aSc, a, w * (1 - Math.min(i, 5) * 0.08)); });
      e.o.forEach(function (o) { add(oSc, o, w); });
    });
    // direct text hits
    IDX.svcs.forEach(function (s) {
      var d = scoreWith(P.toks, [[s.nameF, 4], [s.grpF, 2], [s.descF, 1.5], [s.tagF, 1]]);
      if (d) { add(sSc, s.id, d * 4); add(gSc, s.g.id, d * 3); }
    });
    IDX.groups.forEach(function (g) { var d = scoreWith(P.toks, [[g.hay, 4]]); if (d) add(gSc, g.id, d * 4); });
    IDX.arts.forEach(function (a) { var d = scoreWith(P.toks, [[a.titleF, 6], [a.headF, 3], [a.bodyF, 1]]); if (d) add(aSc, a.id, d * 4); });
    liveOffers().forEach(function (o) { var d = scoreWith(P.toks, [[o.titleF, 4], [o.tagF, 2], [o.incF, 1]]); if (d) add(oSc, o.slug, d * 4); });

    // groups: rows with the services that matched in them
    var rows = Object.keys(gSc).map(function (id) {
      var g = IDX.gById[id]; if (!g) return null;
      var ms = g.svcs.filter(function (s) { return sSc[s.id]; }).sort(function (a, b) { return sSc[b.id] - sSc[a.id]; });
      var lo = ms.map(function (s) { return s.eur; }).filter(function (n) { return n != null; });
      return { g: g, score: gSc[id], ms: ms, min: lo.length ? Math.min.apply(null, lo) : g.min };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; });
    // a generic word can match half of the list: keep the strongest rows only
    var top = rows.length ? rows[0].score : 0;
    res.groups = rows.filter(function (r) { return r.score >= top * 0.22; }).slice(0, 6);
    res.arts = Object.keys(aSc).map(function (id) { return { a: IDX.aById[id], score: aSc[id] }; }).filter(function (x) { return x.a; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4);
    res.offers = Object.keys(oSc).map(function (sl) { return { o: liveOffers().filter(function (x) { return x.slug === sl; })[0], score: oSc[sl] }; }).filter(function (x) { return x.o; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 2);
    // only the "weak" hooks and nothing written down about it: show them as a soft suggestion, never as a treatment claim
    var direct = IDX.svcs.some(function (s) { return scoreWith(P.toks, [[s.nameF, 4], [s.grpF, 2], [s.descF, 1.5]]) > 0; });
    res.soft = !!syn.length && !strong && !direct;
    res.total = res.groups.length + res.arts.length + res.offers.length;
    return res;
  }
  /* services for the price list: direct text hits + the synonym targets (a synonym without listed services opens its whole groups) */
  function services(q) {
    var P = parse(q), ids = {};
    if (!IDX || P.f.length < 2) return { ids: ids, n: 0 };
    IDX.svcs.forEach(function (s) { if (scoreWith(P.toks, [[s.nameF, 4], [s.grpF, 2], [s.descF, 1.5], [s.tagF, 1]])) ids[s.id] = 1; });
    synMatches(P).forEach(function (m) {
      if (m.e.v.length) m.e.v.forEach(function (v) { ids[v] = 1; });
      else m.e.g.forEach(function (g) { var G = IDX.gById[g]; if (G) G.svcs.forEach(function (s) { ids[s.id] = 1; }); });
    });
    return { ids: ids, n: Object.keys(ids).length };
  }

  /* ---------------------------------------------------------------- rendering ---------- */
  function foldMap(s) {
    var f = '', map = [];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i).toLowerCase(), b = ch === LOW_D ? 'dj' : ch.normalize('NFD').replace(MARKS, '');
      for (var k = 0; k < b.length; k++) { f += b.charAt(k); map.push(i); }
    }
    return { f: f, map: map };
  }
  function hl(text, toks) {                     // marks the typed words (word starts) with a soft lila band; text colour unchanged
    var fm = foldMap(text), ranges = [];
    toks.forEach(function (t) {
      [t, stem(t)].forEach(function (x, ix) {
        if (!x || x.length < 2 || (ix && x === t)) return;
        var p = -1;
        while ((p = fm.f.indexOf(x, p + 1)) > -1) {
          if (p === 0 || !/[a-z0-9]/.test(fm.f.charAt(p - 1))) { ranges.push([fm.map[p], fm.map[p + x.length - 1] + 1]); break; }
        }
      });
    });
    if (!ranges.length) return esc(text);
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    ranges.forEach(function (r) { if (r[0] < pos) { if (r[1] > pos) { out += '<mark>' + esc(text.slice(pos, r[1])) + '</mark>'; pos = r[1]; } return; } out += esc(text.slice(pos, r[0])) + '<mark>' + esc(text.slice(r[0], r[1])) + '</mark>'; pos = r[1]; });
    return out + esc(text.slice(pos));
  }
  function wordStart(f, x) {                    // index of x at the start of a word in a folded string, or -1
    var p = -1;
    while ((p = f.indexOf(x, p + 1)) > -1) { if (p === 0 || !/[a-z0-9]/.test(f.charAt(p - 1))) return p; }
    return -1;
  }
  function snippet(a, P) {                      // the part of the text that holds the typed word; the excerpt when the excerpt already does (or only the title / a synonym matched)
    var exF = fold(a.ex), inEx = P.toks.some(function (t) { return exF.indexOf(t) > -1 || exF.indexOf(stem(t)) > -1; });
    if (!inEx) {
      var fm = a._fm || (a._fm = foldMap(a.text)), p = -1, i;
      for (i = 0; i < P.toks.length && p < 0; i++) { p = wordStart(fm.f, P.toks[i]); if (p < 0) p = wordStart(fm.f, stem(P.toks[i])); }
      if (p > -1) {
        var from = fm.map[p], s = Math.max(0, from - 48);
        if (s) { var sp = a.text.indexOf(' ', s); s = sp > -1 && sp < from ? sp + 1 : s; }
        var t = a.text.slice(s, s + 140); if (s + 140 < a.text.length) t = t.replace(/\s+\S*$/, '');
        return (s ? '\u2026' : '') + t + (s + t.length < a.text.length ? '\u2026' : '');
      }
    }
    return a.ex.length > 125 ? a.ex.slice(0, 122).replace(/\s+\S*$/, '') + '\u2026' : a.ex;
  }
  var uid = 0;
  function row(attrs, inner) { uid++; return '<a class="sres__item' + (attrs.cls || '') + '" role="option" tabindex="-1" id="sr-' + uid + '" href="' + esc(attrs.href) + '"' + (attrs.group ? ' data-group="' + esc(attrs.group) + '"' : '') + '>' + inner + '</a>'; }
  function render(res) {
    uid = 0;
    var P = res.P, h = '', tabs = IDX.tabs;
    if (res.groups.length) {
      h += '<div class="sres__sec" role="group" aria-label="' + (res.soft ? 'Najbliže u ponudi' : 'Tretmani') + '"><p class="sres__h eyebrow">' + (res.soft ? 'Najbliže u ponudi' : 'Tretmani') + '</p>';
      var byTab = {}, order = [];
      res.groups.forEach(function (r) { var k = r.g.tab; if (!byTab[k]) { byTab[k] = []; order.push(k); } byTab[k].push(r); });
      order.forEach(function (k) {
        h += '<p class="sres__sub">' + esc(tabs[k].label) + '</p>';
        byTab[k].forEach(function (r) {
          var names = r.ms.slice(0, 2).map(function (s) { return s.name; }).join(', '), more = r.ms.length - 2;
          var meta = r.ms.length ? esc(names) + (more > 0 ? ' · još ' + more : '') : r.g.n + ' ' + plural(r.g.n, 'usluga', 'usluge', 'usluga') + ' u grupi';
          h += row({ href: ROOT + 'index.html?grupa=' + r.g.id + '#usluge', group: r.g.id }, '<span class="sres__t">' + hl(r.g.title, P.toks) + '</span><span class="sres__m">' + meta + '</span>' + (r.min != null ? '<span class="sres__p">' + eur(r.min) + '</span>' : ''));
        });
      });
      h += '</div>';
    }
    if (res.arts.length) {
      h += '<div class="sres__sec" role="group" aria-label="Tekstovi"><p class="sres__h eyebrow">Tekstovi</p>';
      res.arts.forEach(function (x) {
        var a = x.a;
        h += row({ href: ROOT + 'blog/' + a.slug + '.html', cls: ' sres__item--txt' }, '<span class="sres__t">' + hl(a.title, P.toks) + '</span><span class="sres__m">' + esc(a.seg.name) + ' · ' + a.min + ' ' + plural(a.min, 'minut', 'minuta', 'minuta') + ' čitanja</span><span class="sres__ex">' + hl(snippet(a, P), P.toks) + '</span><span class="sres__go" aria-hidden="true">' + icon('arrow-ur', 20) + '</span>');
      });
      h += '</div>';
    }
    if (res.offers.length) {
      h += '<div class="sres__sec" role="group" aria-label="Posebna ponuda"><p class="sres__h eyebrow">Posebna ponuda</p>';
      res.offers.forEach(function (x) {
        var o = x.o, p = o.price.split(' / ')[0];
        h += row({ href: ROOT + 'posebna-ponuda.html#' + o.slug }, '<span class="sres__t">' + hl(o.title, P.toks) + '</span><span class="sres__m">' + esc(o.tag) + '</span><span class="sres__p">' + esc(p) + '</span>');
      });
      h += '</div>';
    }
    if (res.groups.length) h += '<a class="sres__more" href="' + ROOT + 'index.html?q=' + encodeURIComponent(res.q) + '#usluge" data-more="1"><span>Svi rezultati u cenovniku</span>' + icon('arrow-r', 18) + '</a>';
    return h;
  }
  function contactRows() {                      // numbers come from the contact sheet markup (which is built from the data)
    var tel = $$('#contact-sheet .sheet__big[data-mode="tel"] a'), wa = $$('#contact-sheet .sheet__big[data-mode="wa"] a'), h = '';
    tel.forEach(function (a, i) {
      var num = $('strong', a).textContent;
      h += '<div><span>' + esc(num) + '</span><a class="btn btn--line" href="' + esc(a.getAttribute('href')) + '">' + icon('phone', 18) + 'Pozovi</a>' + (wa[i] ? '<a class="btn btn--line" href="' + esc(wa[i].getAttribute('href')) + '" target="_blank" rel="noopener">' + icon('chat', 18) + 'WhatsApp</a>' : '') + '</div>';
    });
    return h;
  }
  function renderEmpty(q) {
    return '<div class="sres__empty"><strong>Nismo pronašli „' + esc(q) + '“</strong><p>Probajte drugu reč ili pitanje, ili nam se javite: rado ćemo vam preporučiti pravi tretman.</p><div class="sres__call">' + contactRows() + '</div></div>';
  }
  function renderQuick() {
    var segs = IDX.segs.map(function (s) { return '<a href="' + ROOT + 'tretmani/' + s.slug + '.html" role="option" tabindex="-1" id="sr-q' + s.id + '"><span>' + esc(s.name) + '</span>' + icon('arrow-ur', 18) + '</a>'; }).join('');
    return '<div class="sres__sec" role="group" aria-label="Brzi linkovi"><p class="sres__h eyebrow">Pogledajte po segmentima</p><div class="sres__quick">' + segs +
      '<a href="' + ROOT + 'index.html#usluge" role="option" tabindex="-1" id="sr-qc"><span>Cenovnik</span>' + icon('arrow-r', 18) + '</a><a href="' + ROOT + 'posebna-ponuda.html" role="option" tabindex="-1" id="sr-qp"><span>Posebna ponuda</span>' + icon('arrow-r', 18) + '</a><a href="' + ROOT + 'blog.html" role="option" tabindex="-1" id="sr-qb"><span>Blog</span>' + icon('arrow-r', 18) + '</a></div></div>';
  }

  /* ---------------------------------------------------------------- one search field (hero or overlay) ---------- */
  function Field(form, opts) {
    var input = $('.hsearch__in', form), clear = $('.hsearch__clear', form), hint = $('.hsearch__hint', form);
    var panel = doc.getElementById(input.getAttribute('aria-controls')), live = doc.getElementById(input.id + '-live');
    var overlay = !!opts.overlay, active = -1, deb = 0, open = false, last = '';
    var phMq = matchMedia('(max-width: 767px)'), phTiny = matchMedia('(max-width: 359px)');   // three lengths: the whole question, a short one, a tiny one (320px phones)
    function placeholder() { input.setAttribute('placeholder', phTiny.matches ? input.getAttribute('data-ph-tiny') : phMq.matches ? input.getAttribute('data-ph-short') : input.getAttribute('data-ph-long')); }
    placeholder(); phMq.addEventListener('change', placeholder); phTiny.addEventListener('change', placeholder);

    function items() { return $$('[role="option"]', panel); }
    function clearActive() { active = -1; input.removeAttribute('aria-activedescendant'); items().forEach(function (x) { x.removeAttribute('aria-selected'); }); }
    function setActive(i, scroll) {
      var it = items(); if (!it.length) { clearActive(); return; }
      active = (i + it.length) % it.length;
      it.forEach(function (x, k) { if (k === active) x.setAttribute('aria-selected', 'true'); else x.removeAttribute('aria-selected'); });
      input.setAttribute('aria-activedescendant', it[active].id);
      if (scroll !== false) it[active].scrollIntoView({ block: 'nearest' });
    }
    function setOpen(on) {
      open = on; input.setAttribute('aria-expanded', String(on));
      if (!overlay) { panel.hidden = !on; form.classList.toggle('is-open', on); }
      if (!on) { active = -1; input.removeAttribute('aria-activedescendant'); }
    }
    function sizePanel() {                       // hero on a phone: the list may never run under the on-screen keyboard
      if (overlay) return;
      var vv = window.visualViewport, vh = vv ? vv.height : innerHeight, r = form.getBoundingClientRect();
      panel.style.maxHeight = Math.max(180, Math.min(520, vh - Math.max(r.top, 0) - 68 - 14)) + 'px';
    }
    function showResults(started) {
      var q = input.value.trim();
      clear.hidden = !q;
      if (q.length < 2) {
        last = ''; live.textContent = '';
        if (overlay) load(function () { if (input.value.trim().length < 2) { panel.innerHTML = renderQuick(); setOpen(true); } }); else setOpen(false);
        return;
      }
      load(function () {
        if (input.value.trim() !== q) return;    // typed on meanwhile
        var res = run(q); last = q;
        panel.innerHTML = res.total ? render(res) : renderEmpty(q);
        live.textContent = res.total ? 'Pronađeno ' + res.total + ' ' + plural(res.total, 'rezultat', 'rezultata', 'rezultata') + '.' : 'Nema rezultata za ' + q + '.';
        setOpen(true); sizePanel(); panel.scrollTop = 0; clearActive();
        if (started && !overlay && matchMedia('(max-width: 1199px)').matches) { var y = form.getBoundingClientRect().top + scrollY - (($('.nav__pill') || { getBoundingClientRect: function () { return { bottom: 80 }; } }).getBoundingClientRect().bottom) - 10; if (y > 0 && Math.abs(y - scrollY) > 4) scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); }
      });
    }
    function go(el) {
      if (!el) return;
      var g = el.getAttribute('data-group'), more = el.getAttribute('data-more');
      if (window.LSD_PRICE && (g || more)) { if (g) window.LSD_PRICE.openGroup(g); else window.LSD_PRICE.search(input.value.trim()); opts.afterGo && opts.afterGo(); if (!overlay) setOpen(false); return; }
      location.href = el.href;
    }
    input.addEventListener('input', function () {
      var started = !open; clearTimeout(deb); clear.hidden = !input.value;
      deb = setTimeout(function () { showResults(started); }, 90);
    });
    input.addEventListener('focus', function () { load(function () { }); if (input.value.trim().length >= 2 && !open) showResults(false); else if (overlay && !open) showResults(false); });
    input.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); if (!open) showResults(false); else setActive(active + 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); if (open) setActive(active < 0 ? items().length - 1 : active - 1); }
      else if (k === 'Home' && open && active >= 0) { e.preventDefault(); setActive(0); }
      else if (k === 'End' && open && active >= 0) { e.preventDefault(); setActive(items().length - 1); }
      else if (k === 'Escape') {
        if (overlay) return;                       // the overlay handler closes the whole dialog
        if (open) { e.preventDefault(); setOpen(false); } else if (input.value) { e.preventDefault(); input.value = ''; clear.hidden = true; }
      }
    });
    function submitNow() { var it = items(); if (it.length) go(it[active >= 0 ? active : 0]); }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); clearTimeout(deb);
      var q = input.value.trim(); if (q.length < 2) return;
      if (open && last === q) submitNow(); else load(function () { showResults(false); submitNow(); });
    });
    clear.addEventListener('click', function () { input.value = ''; clear.hidden = true; showResults(false); input.focus(); });
    if (hint) hint.addEventListener('click', function (e) { var b = e.target.closest('button[data-q]'); if (!b) return; input.value = b.getAttribute('data-q'); clear.hidden = false; input.focus(); showResults(true); });
    panel.addEventListener('mousemove', function (e) { if (!e.movementX && !e.movementY) return; var it = e.target.closest('[role="option"]'); if (it) { var i = items().indexOf(it); if (i !== active) setActive(i, false); } }); // real pointer movement only (a list that re-renders under a resting pointer fires synthetic moves)
    panel.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (a.hasAttribute('data-group') || a.hasAttribute('data-more')) { if (window.LSD_PRICE) { e.preventDefault(); go(a); } }
    });
    if (!overlay) {
      doc.addEventListener('click', function (e) { if (open && !form.contains(e.target)) setOpen(false); });
      form.addEventListener('focusout', function () { setTimeout(function () { if (open && !form.contains(doc.activeElement) && doc.activeElement !== doc.body) setOpen(false); }, 0); });
      if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { if (open) sizePanel(); });
      addEventListener('resize', function () { if (open) sizePanel(); });
    }
    return { input: input, show: showResults, close: function () { setOpen(false); }, reset: function () { input.value = ''; clear.hidden = true; panel.innerHTML = ''; setOpen(false); }, setOpen: setOpen };
  }

  /* ---------------------------------------------------------------- overlay (header button) ---------- */
  function Overlay() {
    var ov = $('#search-ov'), btn = $('#search-open'), closeBtn = $('#search-close'); if (!ov || !btn) return null;
    var form = $('form.hsearch', ov), field = Field(form, { overlay: true, afterGo: function () { close(false); } });
    var opener = null, inertEls = [$('main'), $('footer'), $('#bar'), $('#nav'), $('#menu')].filter(Boolean);
    ov.hidden = false;
    function setInert(on) { inertEls.forEach(function (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }); }
    function open() {
      opener = doc.activeElement;
      if (html.classList.contains('menu-open')) return;
      load(function () { });
      ov.classList.add('is-open'); html.classList.add('search-open'); setInert(true);
      btn.setAttribute('aria-expanded', 'true');
      field.show(false);
      setTimeout(function () { field.input.focus({ preventScroll: true }); }, 60);
    }
    function close(ret) {
      ov.classList.remove('is-open'); html.classList.remove('search-open'); setInert(false);
      btn.setAttribute('aria-expanded', 'false'); field.reset();
      if (ret !== false && opener && opener.focus) opener.focus({ preventScroll: true });
    }
    btn.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); open(); });
    closeBtn.addEventListener('click', function () { close(true); });
    doc.addEventListener('keydown', function (e) {
      if (!ov.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.key !== 'Tab') return;
      var f = $$('input, button, a[href]', ov).filter(function (x) { return !x.hidden && x.offsetParent !== null && x.tabIndex >= 0; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    ov.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a && ov.contains(a) && !a.hasAttribute('data-group') && !a.hasAttribute('data-more')) setTimeout(function () { close(false); }, 0); });
    return { open: open, close: close };
  }

  /* ---------------------------------------------------------------- init + public API ---------- */
  function init() {
    var hero = $('form.hsearch[data-search="hero"]');
    if (hero) {
      Field(hero, { overlay: false });
      if ('requestIdleCallback' in window) requestIdleCallback(function () { load(function () { }); }, { timeout: 2500 }); else setTimeout(function () { load(function () { }); }, 1500);
    }
    window.LSD_SEARCH_UI = { overlay: Overlay() };
  }
  window.LSD_SEARCH = { ready: load, fold: fold, run: function (q) { return IDX ? run(q) : null; }, services: services };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
