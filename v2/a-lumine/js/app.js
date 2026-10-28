/* =====================================================================================================
   LEPA SVAKI DAN · "A" preview · behaviour (vanilla JS, no libraries)
   Reads window.LSD_CONTENT (js/content.js, js/offers-data.js) and window.LSD_PAGES (assets/data/pages-data.js). The shared shell is js/shell.js,
   the search engine (also used by the price-list search below) is js/search.js, the price format (dinars first, euros below) is js/price.js.
   Pripremio ECHOSYSTEM-MOTHER AGENCY
   ===================================================================================================== */
(function () {
  'use strict';
  var D = window.LSD_CONTENT, PG = window.LSD_PAGES || {};
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ico = function (n) { return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  var raf = function (fn) { var t = false; return function () { if (t) return; t = true; requestAnimationFrame(function () { t = false; fn(); }); }; };

  /* ---------------------------------------------------------------- images */
  var IMG = {
    protocols: ['vertical-protocols', [480, 800, 1200], 1200, 1200],
    laser: ['vertical-laser', [480, 800, 1200], 1200, 800],
    esthetic: ['vertical-esthetic', [480, 800, 1200], 1200, 800],
    founder: ['founder-portrait', [480, 800], 800, 1200]
  };
  function pic(k, sizes, alt) {
    var m = IMG[k], b = m[0], ws = m[1];
    return '<img src="assets/img/' + b + '-' + ws[1] + '.webp" srcset="' + ws.map(function (w) { return 'assets/img/' + b + '-' + w + '.webp ' + w + 'w'; }).join(', ') +
      '" sizes="' + sizes + '" width="' + m[2] + '" height="' + m[3] + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">';
  }
  var Price = window.LSDPrice;   /* js/price.js: "51€ / 6.000 rsd" -> 6.000 rsd large, 51€ small below, on the whole site */

  /* ---------------------------------------------------------------- shared shell (js/shell.js): menu, sheets, booking chooser, nav, reveal */
  var Sh = window.LSDShell, openOv = Sh.openOv, focusTarget = Sh.focusTarget, scrollToEl = Sh.scrollToEl;
  $('#payChip').addEventListener('click', function (e) { openOv($('#paySheet'), e.currentTarget); });

  /* ---------------------------------------------------------------- verticals (Tretmani) */
  var V_MAP = {
    lice: { cls: 'lica', img: 'protocols', alt: 'Terapeutkinja nežno masira lice žene čija je glava umotana belim peškirom, tokom tretmana lica.', sizes: '(min-width:1024px) 470px, (min-width:640px) 50vw, 92vw' },
    telo: { cls: 'tela', img: 'laser', alt: 'Terapeut u sivoj uniformi masira leđa žene koja leži na stolu, uz upaljene sveće u mekom svetlu.', sizes: '(min-width:1024px) 372px, (min-width:640px) 50vw, 92vw' },
    estetske: { cls: 'estetske', img: 'founder', alt: 'Nanošenje tamne maske za lice četkicom na čelo žene koja opušteno leži, u svetlom prostoru sa biljkama.', sizes: '(min-width:1024px) 275px, (min-width:640px) 50vw, 92vw' },
    laserska: { cls: 'laserska', img: null },
    protokoli: { cls: 'protokoli', img: 'esthetic', alt: 'Dvoje gostiju u belim bademantilima opušteno leži na masažnim stolovima, a u prvom planu su cvet plumerije, ulja, so i peškir.', sizes: '(min-width:1024px) 372px, (min-width:640px) 50vw, 92vw' }
  };
  function renderVerticals() {
    var suf = D.pricing.ui.groupCountSuffix;
    $('#verticals').innerHTML = D.verticals.map(function (v, i) {
      var m = V_MAP[v.cenovnikTab];
      var offers = v.cenovnikTab === 'protokoli';
      var cnt = offers ? D.offers.length + ' paketa' : v.cenovnikServiceCount + ' ' + suf;
      var act = offers
        ? '<a class="arrow" href="posebna-ponuda.html" aria-label="' + esc(v.title + ': ' + D.sections.offers.title) + '">' + ico('arrow') + '</a>'
        : '<button class="arrow" type="button" data-goto-tab="' + v.cenovnikTab + '" aria-label="' + esc(D.sections.verticals.linkLabel + ': ' + v.title) + '">' + ico('arrow') + '</button>';
      /* the laser tile states its "from" price: dinars first (fromPrice comes from the price list, see _tools/a/sync-content.mjs) */
      var big = !m.img ? '<div class="vt__big">' + (v.fromPrice ? Price.html(v.fromPrice) : esc(v.statedCount)) + '</div>' : '';
      /* no address anywhere on the tiles (client wish: one price list; where is what is told on the phone): only the number of services */
      return '<article class="vt vt--' + m.cls + (m.img ? '' : ' vt--plain') + ' rv" style="--i:' + (i % 3) + '">' +
        (m.img ? pic(m.img, m.sizes, m.alt) : '<span class="vt__swash" aria-hidden="true"></span>') +
        '<div class="vt__top"><span class="chip chip--lila">' + esc(cnt) + '</span></div>' +
        '<div class="vt__bot"><div>' + big + '<h3 class="vt__t">' + esc(v.title) + '</h3><p class="vt__s">' + esc(v.summary) + '</p></div>' + act + '</div></article>';
    }).join('');
  }

  /* ---------------------------------------------------------------- favourites
     (the former gift section is the "Bestseller tretmani" block of the About section: pre-rendered by _tools/a/build-pages.mjs, same price format) */
  function renderPicks() {
    $('#favorites').innerHTML = D.favorites.map(function (f, i) {
      var dark = i === 0, green = f.name === 'NO FILTER NEEDED';
      return '<li class="fav' + (dark ? ' fav--dark bk' : '') + (green ? ' fav--green' : '') + ' rv" style="--i:' + (i % 2) + '">' +
        '<div class="fav__top"><span class="chip ' + (dark ? 'chip--ghost' : 'chip--line') + '">' + esc(f.tagLabel) + '</span></div>' +
        '<div><h3 class="fav__t">' + esc(f.name) + '</h3>' + (f.description ? '<p class="fav__d">' + esc(f.description) + '</p>' : '') + '</div>' +
        '<div class="fav__bot">' + Price.html(f.price) +
        '<button class="arrow" type="button" data-goto="' + f.cenovnik.id + '" aria-label="Pogledaj u cenovniku: ' + esc(f.name) + '">' + ico('arrow') + '</button></div></li>';
    }).join('');
  }

  /* ---------------------------------------------------------------- testimonials
     (Posebna ponuda and Blog teasers are pre-rendered by _tools/a/build-pages.mjs; the offers are filled live by js/offers.js) */
  function renderTesti() {
    var tr = $('#testiTrack'), n = D.testimonials.length;
    tr.setAttribute('role', 'group');
    tr.setAttribute('aria-label', 'Utisci klijenata, klizite levo ili desno');
    tr.innerHTML = D.testimonials.map(function (t, i) {
      return '<div class="testi__s" role="group" aria-roledescription="slajd" aria-label="' + (i + 1) + ' od ' + n + '"><blockquote class="testi__q">' + esc(t.quote) + '</blockquote>' +
        '<p class="testi__a"><b>' + esc(t.author) + '</b><span>' + esc(t.tag) + '</span></p></div>';
    }).join('');
    var dots = $('#tDots');
    dots.innerHTML = D.testimonials.map(function (t, i) { return '<button class="td" type="button" data-i="' + i + '" aria-label="Utisak ' + (i + 1) + ' od ' + n + '"></button>'; }).join('');
    var cur = 0, auto = null, stopped = false;
    function idx() { return Math.max(0, Math.min(n - 1, Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)))); }
    function mark() { cur = idx(); $$('.td', dots).forEach(function (d, i) { if (i === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); }); }
    function go(i) { tr.scrollTo({ left: ((i + n) % n) * tr.clientWidth, behavior: RM ? 'auto' : 'smooth' }); }
    tr.addEventListener('scroll', raf(mark), { passive: true });
    $('#tNext').addEventListener('click', function () { stop(); go(cur + 1); });
    $('#tPrev').addEventListener('click', function () { stop(); go(cur - 1); });
    dots.addEventListener('click', function (e) { var b = e.target.closest('.td'); if (b) { stop(); go(+b.dataset.i); } });
    tr.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { stop(); go(cur + 1); e.preventDefault(); } if (e.key === 'ArrowLeft') { stop(); go(cur - 1); e.preventDefault(); } });
    tr.addEventListener('pointerdown', stop);
    window.addEventListener('resize', function () { tr.scrollLeft = cur * tr.clientWidth; });
    function stop() { stopped = true; clearInterval(auto); }
    // gentle auto-rotate: fine-pointer desktops only, never with reduced motion, stops for good after any interaction
    if (!RM && window.matchMedia('(hover:hover) and (pointer:fine)').matches && 'IntersectionObserver' in window) {
      var box = $('#testi'), inView = false, paused = false;
      box.addEventListener('mouseenter', function () { paused = true; }); box.addEventListener('mouseleave', function () { paused = false; });
      box.addEventListener('focusin', stop);
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: .4 }).observe(box);
      auto = setInterval(function () { if (!stopped && inView && !paused && !document.hidden) go(cur + 1); }, D.sections.testimonials.autoRotateMs || 5000);
    }
    mark();
  }

  /* ---------------------------------------------------------------- CENOVNIK */
  /* ONE price list. No address per treatment anywhere (client decision: machines move in October, "where is what" is told on the phone). The data
     carries no location field at all; laser rows show the single merged price the old site showed ("od X", or the only price). */
  var P = D.pricing, TABS = P.tabs;
  var BADGE = String(P.ui.highlightBadge).replace(/^[^A-Za-zČĆŠŽĐčćšžđ]+/, '');
  var st = { tab: TABS[0].id, q: '', open: {}, hits: [], exp: {} };
  var RES_FIRST = 6, RES_STEP = 20, MIN_Q = 2;
  var $tabs = $('#priceTabs'), $panels = $('#pricePanels'), $res = $('#priceResults'), $stat = $('#priceStatus'), $live = $('#priceLive');
  var $q = $('#priceSearch'), $clear = $('#priceClear'), $bar = $('#tabsBar'), $hint = $('#tabsHint'), $sug = $('#priceSuggest');
  var INDEX = [];
  TABS.forEach(function (t) { t.groups.forEach(function (g, gi) { g.services.forEach(function (s) {
    INDEX.push({ s: s, t: t, g: g, gi: gi });
  }); }); });
  var byId = {}; INDEX.forEach(function (x) { byId[x.s.id] = x; });
  var announce = function (t) { $live.textContent = ''; setTimeout(function () { $live.textContent = t; }, 60); };

  function row(s, src) {
    var pr;
    if (s.onRequest) pr = '<span class="svc__q">Na upit</span>';
    else pr = Price.html(s.price);
    var meta = '';
    if (s.highlight && s.id.indexOf('laserska') !== 0) meta += '<span class="chip chip--sale">' + ico('sparkle') + esc(BADGE) + '</span>';
    if (s.duration) meta += '<span class="chip chip--dur">' + esc(s.duration) + '</span>';
    var slug = s.blogPost && PG.articleByLegacyTitle && PG.articleByLegacyTitle[s.blogPost];
    var more = slug ? '<a class="svc__more" href="blog/' + esc(slug) + '.html">Pročitaj više ›</a>' : '';
    return '<li class="svc" ' + (src ? 'data-result-id' : 'data-service-id') + '="' + s.id + '">' +
      '<div>' + (src ? '<span class="svc__src">' + esc(src) + '</span>' : '') + '<span class="svc__name">' + esc(s.name) + '</span>' + (s.description ? '<p class="svc__desc">' + esc(s.description) + '</p>' : '') + '<div class="svc__meta">' + meta + '</div>' + more + '</div>' +
      '<div class="svc__p">' + pr + '</div></li>';
  }
  var cnt = function (t) { return t.groups.reduce(function (n, g) { return n + g.services.length; }, 0); };

  function renderTabs() {
    $tabs.innerHTML = TABS.map(function (t) {
      var sel = t.id === st.tab;
      return '<button class="tab" role="tab" type="button" id="tab-' + t.id + '" data-tab-id="' + t.id + '" aria-selected="' + sel + '" aria-controls="panel-' + t.id + '" tabindex="' + (sel ? 0 : -1) + '">' +
        esc(t.label) + '<sup aria-label="' + cnt(t) + ' usluga">' + cnt(t) + '</sup></button>';
    }).join('');
  }
  /* the texts (blog/*.html) that are about this group: assets/data/pages-data.js, built from the texts pack */
  var ART = {}; (PG.articles || []).forEach(function (a) { ART[a.slug] = a; });
  function textLinks(tid, gi) {
    var l = PG.groupArticles && PG.groupArticles[tid + ':' + gi];
    if (!l || !l.length) return '';
    return '<div class="grp__txt"><span>Pročitajte</span>' + l.map(function (s) { var a = ART[s]; return a ? '<a href="blog/' + esc(s) + '.html">' + esc(a.title) + ' ›</a>' : ''; }).join('') + '</div>';
  }
  function renderPanels() {
    $panels.innerHTML = TABS.map(function (t) {
      var laser = t.kind === 'laser', groups = '';
      t.groups.forEach(function (g, gi) {
        var id = t.id + ':' + gi, list = g.services;
        if (!list.length) return;
        if (st.open[id] === undefined) st.open[id] = gi === 0 ? 1 : 0;
        var open = !!st.open[id];
        groups += '<section class="grp' + (open ? ' is-open' : '') + '" data-group-id="' + id + '">' +
          '<h3 class="grp__h"><button class="grp__btn" type="button" id="gb-' + t.id + '-' + gi + '" aria-expanded="' + open + '" aria-controls="gp-' + t.id + '-' + gi + '">' +
          '<span class="grp__no" aria-hidden="true">' + (gi + 1) + '</span>' +
          '<span><span class="grp__t">' + esc(g.title) + '</span><span class="grp__c">' + list.length + ' ' + esc(P.ui.groupCountSuffix) + '</span></span>' +
          '<span class="grp__tog"><span class="grp__show" data-lbl>' + (open ? 'Sakrij usluge' : 'Prikaži usluge') + '</span><span class="grp__ch">' + ico('chev') + '</span></span></button></h3>' +
          '<div class="grp__body" id="gp-' + t.id + '-' + gi + '"><div class="grp__in"><div class="grp__panel">' +
          (laser ? '<div class="lh" aria-hidden="true"><span>' + esc(t.columns.service) + '</span><span>' + esc(t.columns.price) + '</span></div>' : '') +
          '<ul class="grp__list">' + list.map(function (s) { return row(s); }).join('') + '</ul>' + textLinks(t.id, gi) + '</div></div></div></section>';
      });
      return '<div class="panel" role="tabpanel" id="panel-' + t.id + '" aria-labelledby="tab-' + t.id + '" data-panel-id="' + t.id + '"' + (t.id === st.tab ? '' : ' hidden') + '>' +
        (t.note ? '<p class="tabnote">' + t.note.html + '</p>' : '') + groups + '</div>';
    }).join('');
    updateStatus();
  }
  function updateStatus() {
    if (st.q) return;
    $stat.classList.remove('is-search');
    var t = TABS.filter(function (x) { return x.id === st.tab; })[0], n = cnt(t), many = t.groups.length >= 8;
    var allOpen = many && $$('.grp', $('[data-panel-id="' + st.tab + '"]')).every(function (g) { return g.classList.contains('is-open'); });
    var hadFocus = document.activeElement && document.activeElement.id === 'openAll';
    $stat.innerHTML = '<span>' + n + ' ' + esc(P.ui.groupCountSuffix) + '</span>' +
      (many ? '<button class="price__all" type="button" id="openAll">' + (allOpen ? 'Zatvori sve grupe' : 'Otvori sve grupe') + '</button>' : '');
    if (hadFocus) { var again = $('#openAll'); if (again) again.focus({ preventScroll: true }); }
  }
  function setTab(id, focus, scrollTab) {
    st.tab = id;
    $$('.tab', $tabs).forEach(function (b) { var s = b.dataset.tabId === id; b.setAttribute('aria-selected', s); b.tabIndex = s ? 0 : -1; if (s && focus) b.focus({ preventScroll: true }); });
    $$('.panel', $panels).forEach(function (p) { p.hidden = p.dataset.panelId !== id; });
    var b = $('#tab-' + id);
    if (b && scrollTab !== false) $tabs.scrollTo({ left: b.offsetLeft - ($tabs.clientWidth - b.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
    updateStatus();
  }
  function setGroup(g, open, instant) {
    g.classList.toggle('is-open', open);
    var b = $('.grp__btn', g); b.setAttribute('aria-expanded', open);
    $('[data-lbl]', g).textContent = open ? 'Sakrij usluge' : 'Prikaži usluge';
    st.open[g.dataset.groupId] = open ? 1 : 0;
  }
  $panels.addEventListener('click', function (e) {
    var b = e.target.closest('.grp__btn'); if (!b) return;
    var g = b.closest('.grp'); setGroup(g, !g.classList.contains('is-open')); updateStatus();
  });
  $stat.addEventListener('click', function (e) {
    if (e.target.id === 'openAll') {
      var gs = $$('.grp', $('[data-panel-id="' + st.tab + '"]')), all = gs.every(function (g) { return g.classList.contains('is-open'); });
      gs.forEach(function (g) { setGroup(g, !all); }); updateStatus();
    } else if (e.target.closest('[data-clear]')) { clearSearch(true); }
  });
  /* Tapping another category from deep inside a long list: the old panel disappears and the page gets shorter, so the viewer would be
     left far below (or outside) the new list. Bring the start of the new list back under the sticky tab bar, only ever upwards. */
  function listIntoView() {
    var navH = nav.offsetHeight + 4;   // scrolling up always brings the nav back
    var y = $stat.getBoundingClientRect().top + window.scrollY - $bar.offsetHeight - navH - 4;
    if (window.scrollY > y + 2) window.scrollTo({ top: Math.max(0, y), behavior: RM ? 'auto' : 'smooth' });
  }
  $tabs.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) { setTab(b.dataset.tabId, false); hideHint(); listIntoView(); } });
  $tabs.addEventListener('keydown', function (e) {
    var k = e.key, ids = TABS.map(function (t) { return t.id; }), i = ids.indexOf(st.tab);
    if (k === 'ArrowRight') i = (i + 1) % ids.length; else if (k === 'ArrowLeft') i = (i + ids.length - 1) % ids.length;
    else if (k === 'Home') i = 0; else if (k === 'End') i = ids.length - 1; else return;
    e.preventDefault(); setTab(ids[i], true);
  });
  function hideHint() { $hint.classList.add('is-gone'); }
  $tabs.addEventListener('scroll', function () { if ($tabs.scrollLeft > 24) hideHint(); }, { passive: true });

  /* search: min 2 characters; the matching itself is the shared engine (js/search.js: words, parts of words, how women phrase it, hidden vocabulary).
     Results are grouped by category, every category shows its own count and its best matches first (6, then 20 more per tap), so the list never
     silently stops and never becomes one endless column; the status row (with "Obriši pretragu") stays under the nav. No tags are ever shown. */
  var timer;
  function runSearch() {
    var raw = $q.value.trim(), nq = window.LSDSearch ? window.LSDSearch.fold(raw) : raw.toLowerCase();
    $clear.hidden = !raw;
    if (nq.length < MIN_Q) { if (st.q) clearSearch(false); return; }
    if (!window.LSDSearch) return;
    window.LSDSearch.ready(function () {
      if ($q.value.trim() !== raw) return;   // the visitor kept typing: a newer run will follow
      var hits = window.LSDSearch.serviceIds(raw).map(function (id) { return { x: byId[id] }; }).filter(function (h) { return h.x; });
      st.q = raw; st.hits = hits; st.exp = {};
      $panels.hidden = true; $bar.hidden = true; $hint.hidden = true; $res.hidden = false; $sug.hidden = true;
      drawResults();
      window.LSDSearch.track(raw);   // js/personalize.js learns which topic this question is about (never the words)
    });
  }
  function drawResults(focusTab, prev) {
    var hits = st.hits, raw = st.q, html = '';
    if (hits.length) {
      /* the tabs come in the order of their best answer (the hits are already in the order of relevance), not in the fixed order of the tabs */
      var order = [];
      hits.forEach(function (h) { if (order.indexOf(h.x.t) < 0) order.push(h.x.t); });
      order.forEach(function (t) {
        var items = hits.filter(function (h) { return h.x.t === t; });
        if (!items.length) return;
        var shown = Math.min(items.length, st.exp[t.id] || (items.length <= RES_FIRST + 2 ? items.length : RES_FIRST)), rest = items.length - shown;
        html += '<section class="rs-grp" data-rs="' + t.id + '"><h3 class="rs__g">' + esc(t.label) + ' <span>' + items.length + '</span></h3><ul class="grp__list rs">' +
          items.slice(0, shown).map(function (h) { return row(h.x.s, h.x.g.title); }).join('') + '</ul>' +
          (rest > 0 ? '<p class="rs__more"><button class="btn btn--line" type="button" data-more="' + t.id + '">Prikaži još ' + Math.min(RES_STEP, rest) + '</button><span>Prikazano ' + shown + ' od ' + items.length + '</span></p>' : '') + '</section>';
      });
    } else html = '<p class="rs__empty">Nismo pronašli „' + esc(raw) + '“ u cenovniku. Pokušajte drugačiju reč ili nas pozovite: pomoći ćemo vam da izaberete pravi tretman.</p>';
    $res.innerHTML = html;
    $stat.classList.add('is-search');
    $stat.innerHTML = '<span>' + hits.length + ' ' + (hits.length === 1 ? 'rezultat' : 'rezultata') + ' za „' + esc(raw) + '“</span><button class="price__all" type="button" data-clear>Obriši pretragu</button>';
    if (focusTab) { var fresh = $$('[data-rs="' + focusTab + '"] .svc', $res)[prev]; if (fresh) { fresh.tabIndex = -1; fresh.focus({ preventScroll: true }); } }
  }
  $res.addEventListener('click', function (e) {
    var m = e.target.closest('[data-more]'); if (!m) return;
    var id = m.dataset.more, sec = $('[data-rs="' + id + '"]', $res), prev = $$('.svc', sec).length;
    st.exp[id] = prev + RES_STEP; drawResults(id, prev);
  });
  function clearSearch(focus) {
    st.q = ''; st.hits = []; $q.value = ''; $clear.hidden = true;
    $res.hidden = true; $res.innerHTML = ''; $panels.hidden = false; $bar.hidden = false; $hint.hidden = false; $sug.hidden = false;
    updateStatus();
    if (focus) $q.focus({ preventScroll: true });
  }
  // the fixed action bar must never cover the field being typed in
  $q.addEventListener('focus', function () { root.classList.add('is-typing'); });
  $q.addEventListener('blur', function () { root.classList.remove('is-typing'); });
  $q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(runSearch, 150); });
  $('#priceSearchForm').addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(timer); runSearch(); $q.blur(); });
  $clear.addEventListener('click', function () { clearSearch(true); });
  $q.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $q.value) { e.preventDefault(); clearSearch(false); } });
  $sug.addEventListener('click', function (e) { var b = e.target.closest('[data-q]'); if (b) { $q.value = b.dataset.q; runSearch(); } });

  /* jump from favourites / bestsellers / verticals into the price list (focus follows, so Tab continues from the target, not from the card).
     The bestsellers are real links (?grupa=...&usluga=...) for readers without scripts: with scripts the page stays where it is. */
  function goService(id) {
    var x = byId[id]; if (!x) return;
    if (st.q) clearSearch(false);
    setTab(x.t.id, false, true);
    var g = $('[data-group-id="' + x.t.id + ':' + x.gi + '"]');
    if (g && !g.classList.contains('is-open')) setGroup(g, true);
    updateStatus();
    setTimeout(function () {
      var r = $('[data-service-id="' + id + '"]'); if (!r) return;
      var y = r.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.38;
      window.scrollTo({ top: Math.max(0, y), behavior: RM ? 'auto' : 'smooth' });
      r.classList.remove('is-flash'); void r.offsetWidth; r.classList.add('is-flash');
      r.tabIndex = -1; r.focus({ preventScroll: true });
      announce(x.s.name + ', ' + x.g.title + ', ' + x.t.label);
    }, RM ? 0 : 340);
  }
  function goTab(id) {
    if (st.q) clearSearch(false);
    setTab(id, false);
    scrollToEl($('.price__tools'), 16);
    var b = $('#tab-' + id); if (b) b.focus({ preventScroll: true });
    var t = TABS.filter(function (x) { return x.id === id; })[0];
    announce(t.label + ', ' + cnt(t) + ' ' + P.ui.groupCountSuffix);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-goto]'), b = e.target.closest('[data-goto-tab]');
    if (a) { if (a.tagName === 'A') { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); } goService(a.dataset.goto); } else if (b) goTab(b.dataset.gotoTab);
  });

  /* ---------------------------------------------------------------- counters (reveal itself lives in js/shell.js) */
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function setupCounters() {
    if (!('IntersectionObserver' in window) || RM) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        io.unobserve(x.target);
        var el = x.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1300;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(to * e)) + suf;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------------------- deep link into the price list
     ?grupa=<tab>-<index> (or #usluge/<tab>-<index>, the colon form "estetske:5" works too) opens that tab and that group, scrolls to it and highlights it.
     &usluga=<service id> (from a search result) also marks that service row. The texts (blog/*.html), the segment pages and the search link to the groups
     this way. #usluge-<tab> (a whole tab) keeps working. */
  function goGroup(tabId, gi, svcId) {
    var t = TABS.filter(function (x) { return x.id === tabId; })[0];
    if (!t || !t.groups[gi] || !t.groups[gi].services.length) return false;
    if (st.q) clearSearch(false);
    setTab(tabId, false, true);
    var g = $('[data-group-id="' + tabId + ':' + gi + '"]'); if (!g) return false;
    if (!g.classList.contains('is-open')) setGroup(g, true);
    updateStatus();
    setTimeout(function () {
      var r = svcId && $('[data-service-id="' + svcId + '"]');
      if (r) {
        var y = r.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.38;
        window.scrollTo({ top: Math.max(0, y), behavior: RM ? 'auto' : 'smooth' });
        r.classList.remove('is-flash'); void r.offsetWidth; r.classList.add('is-flash');
        r.tabIndex = -1; r.focus({ preventScroll: true });
        announce(byId[svcId].s.name + ', ' + t.groups[gi].title + ', ' + t.label);
        return;
      }
      g.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      g.classList.remove('is-flash'); void g.offsetWidth; g.classList.add('is-flash');
      g.tabIndex = -1; g.focus({ preventScroll: true });   // keyboard users continue from the group; no ring (the group clips it)
      announce(t.groups[gi].title + ', ' + t.label);
    }, RM ? 0 : 120);
    return true;
  }
  function deepLink() {
    var q = /[?&]grupa=([a-z]+)(?:-|:|%3A)(\d+)/i.exec(location.search), h = decodeURIComponent(location.hash || '');
    var m = q || /^#usluge[\/]([a-z]+)[-:](\d+)$/i.exec(h);
    if (m) { var u = /[?&]usluga=([^&#]+)/.exec(location.search); return goGroup(m[1].toLowerCase(), +m[2], u ? decodeURIComponent(u[1]) : ''); }
    m = /^#usluge[-/](\w+)$/.exec(h);
    if (m && TABS.some(function (t) { return t.id === m[1]; })) { setTimeout(function () { goTab(m[1]); }, 300); return true; }
    return false;
  }

  /* ---------------------------------------------------------------- LOKACIJE as a split (R12)
     Desktop with a mouse: both halves show their card, hover / focus widens one (CSS only). Touch and small screens: one half is open, the other is a
     narrow strip with its name; a tap on the strip, a swipe, or the arrow keys switch. The hidden half's card is inert (not focusable, not tappable). */
  function setupSplit() {
    var box = $('#split'); if (!box) return;
    var halves = $$('.split__h', box), mq = window.matchMedia('(min-width:1024px) and (hover:hover) and (pointer:fine)'), cur = 0;
    function apply() {
      var wide = mq.matches;
      halves.forEach(function (h, i) {
        var on = wide || i === cur, info = $('.split__info', h);
        h.classList.toggle('is-on', i === cur);
        if (info) info.inert = !on;
        var pick = $('.split__pick', h); if (pick) pick.hidden = on;
      });
    }
    function show(i) { cur = Math.max(0, Math.min(halves.length - 1, i)); apply(); }
    box.addEventListener('click', function (e) { var b = e.target.closest('.split__pick'); if (b) show(halves.indexOf(b.closest('.split__h'))); });
    // swipe between the two panels
    var sx = null, sy = null;
    box.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; });
    box.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(cur + (dx < 0 ? 1 : -1));
    });
    box.addEventListener('pointercancel', function () { sx = null; });
    box.addEventListener('keydown', function (e) {
      if (mq.matches || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || !e.target.closest('.split__info, .split__pick')) return;
      if (e.target.closest('input,textarea')) return;
      show(cur + (e.key === 'ArrowRight' ? 1 : -1));
    });
    if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
    apply();
  }

  /* ---------------------------------------------------------------- HERO ROTATOR SLOT
     "Budi ______" is one line and "svaki dan." the next. The slot (.rot) is as wide as the widest word until this runs; then it takes the three real widths (em, so they survive any font
     size) and glides from word to word in step with the roll (css/site.css, .rot.is-m). The width animations are tied to the start time of the word animations so they never drift apart. */
  function setupRotator() {
    var R = $('.rot'); if (!R) return;
    var ws = $$('.rot__w', R); if (ws.length < 2) return;
    var done = false;
    function measure() {
      var fs = parseFloat(getComputedStyle(R).fontSize) || 16, ok = true;
      ws.forEach(function (w, i) { var px = w.offsetWidth; if (!px) ok = false; R.style.setProperty('--w' + i, (px / fs).toFixed(3) + 'em'); });
      if (!ok) return;
      if (done) return;
      done = true;
      var wa = !RM && ws[0].getAnimations ? ws[0].getAnimations()[0] : null;
      R.classList.add('is-m');
      if (wa && wa.startTime != null && R.getAnimations) R.getAnimations().forEach(function (a) { try { a.startTime = wa.startTime; } catch (e) { /* ignore */ } });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure); else measure();
    window.addEventListener('load', function () { if (!done) measure(); }, { once: true });
  }

  /* ---------------------------------------------------------------- THE ONE-TIME PRICE-LIST NOTICE (client: first time the visitor scrolls to or arrives at the Cenovnik)
     A calm dialog (the shell's sheet: bottom sheet on phones, centred from 768px; focus is trapped, ESC and "Razumem" close it) with the payment-in-dinars note
     and a reminder to use the search. It opens ONCE per browser session (sessionStorage), only on this page, only when the section is really on screen
     (its top has passed 65% of the viewport, so a tall section never waits for "35% visible"), also when the visitor arrives by an anchor, and never while
     another dialog or overlay is open or while someone is typing: it then waits for that overlay to close. The chip "Plaćanje u dinarima" still opens the
     payment note on demand. All strings are in the pack (content.payment.popup, payment.modal), rendered by _tools/a/build-pages.mjs. */
  function setupPriceNotice() {
    var sec = $('#usluge'), dlg = $('#priceNotice'), KEY = 'lsd-price-notice';
    if (!sec || !dlg || !('IntersectionObserver' in window)) return;
    try { if (sessionStorage.getItem(KEY)) return; } catch (e) { /* no storage: it simply shows once per page view */ }
    var inView = false, shown = false, timer = 0, io;
    function tryShow() {
      clearTimeout(timer);
      if (shown || !inView) return;
      timer = setTimeout(function () {
        if (shown || !inView || Sh.isOpen()) return;                 // another dialog is open: the event below tries again when it closes
        var f = document.activeElement;
        if (f && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) return;   // never over someone who is typing
        shown = true; io.disconnect();
        try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
        openOv(dlg, f && f !== document.body ? f : null);
      }, 650);
    }
    io = new IntersectionObserver(function (en) { inView = en[0].isIntersecting; tryShow(); }, { rootMargin: '0px 0px -35% 0px', threshold: 0 });
    io.observe(sec);
    document.addEventListener('lsd:overlay-closed', tryShow);
    // "Pretraži": the dialog closes (data-close) and the search field of the price list gets the focus
    $('#pnSearch').addEventListener('click', function () {
      setTimeout(function () {
        var tools = $('.price__tools'), q = $('#priceSearch'); if (!q) return;
        var r = q.getBoundingClientRect();
        if (r.top < 96 || r.bottom > window.innerHeight - 96) scrollToEl(tools, 112);
        q.focus({ preventScroll: true });
      }, 140);
    });
  }

  /* "Prikaži sve rezultate u cenovniku": the search overlay (and ?q=... of a link from another page) runs the question in the price-list search, in place */
  function searchPrice(q) {
    if (!q) return;
    $q.value = q; clearTimeout(timer); runSearch();
    setTimeout(function () { scrollToEl($('.price__tools'), 112); }, RM ? 0 : 120);
  }
  function deepQuery() {
    var m = /[?&]q=([^&#]+)/.exec(location.search);
    if (!m) return false;
    var q = ''; try { q = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim().slice(0, 80); } catch (e) { return false; }
    if (!q) return false;
    $q.value = q; runSearch();
    return true;
  }

  /* what the search overlay (js/search.js) calls to open a price-list group on this very page */
  window.LSDApp = { goGroup: goGroup, searchPrice: searchPrice };

  /* ---------------------------------------------------------------- boot */
  function boot() {
    var fitPh = function () { window.LSDSearch.fitPlaceholder($q, ['Pretraži cenovnik ili pitaj, npr. ožiljci od akni', 'Pretraži cenovnik, npr. blistava koža', 'Pitaj, npr. kako smanjiti obim', 'Npr. blistava koža']); };
    fitPh(); window.addEventListener('resize', fitPh); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPh);
    $('#validChip').textContent = 'Cenovnik važi od ' + P.validFrom;
    renderVerticals(); renderPicks(); renderTesti();
    renderTabs(); renderPanels();
    setupCounters(); setupSplit(); setupRotator(); setupPriceNotice();
    if (!deepLink()) deepQuery();
  }
  boot();
})();
