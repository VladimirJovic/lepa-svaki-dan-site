/* Lepa Svaki Dan - preview "C": HOME page behaviour. Vanilla JS, no libraries. Data comes from window.LSD_CONTENT (assets/content.js, assets/offers.js).
   Shared behaviour (menu, nav state, reveal, action bar) lives in js/shell.js, which loads first.
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
(function () {
  'use strict';
  var C = window.LSD_CONTENT;
  var doc = document, html = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover: hover)').matches;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj'); }
  function plural(n, one, few, many) { var m10 = n % 10, m100 = n % 100; return (m10 === 1 && m100 !== 11) ? one : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? few : many; }
  function usl(n) { return n + ' ' + plural(n, 'usluga', 'usluge', 'usluga'); } // 1 usluga, 2-4 usluge, 5+ usluga
  /* The client's data uses SHOUTING CAPS for many protocol names (CINDERELLA GLOW, REVIVE & RADIATE, STOMAK). The data stays untouched
     (search, ids, counts); only the rendered string is sentence-cased: acronyms and brand names from the short lists below keep their form. */
  var KEEP_UP = { PRX: 1, PRP: 1, AWT: 1, ND: 1, YAG: 1, II: 1, HA: 1, CA: 1 };
  var KEEP_CAP = { LEPA: 1, SVAKI: 1, DAN: 1, VENUS: 1, DERMAFACIAL: 1, DERMAWORLD: 1, MYOLIFT: 1, PROFHILO: 1, LOLA: 1, FACE: 1, GYM: 1, EYE: 1, ZONE: 1, CINDERELLA: 1 };
  function tame(s) {
    s = String(s);
    var allCaps = !/[a-zčćšžđ]/.test(s);
    return s.replace(/[A-Za-zČĆŠŽĐčćšžđ]+/g, function (w, off) {
      if (w.length < 2) return (allCaps && w === 'I' && off > 0) ? 'i' : w; // "ZADNJICA I STOMAK" -> "zadnjica i stomak"
      if (w !== w.toUpperCase() || KEEP_UP[w]) return w;
      var low = w.toLowerCase();
      return (off === 0 || KEEP_CAP[w]) ? low.charAt(0).toUpperCase() + low.slice(1) : low;
    });
  }
  function splitPrice(p) {
    if (/^na upit$/i.test(p)) return { req: p };
    var a = String(p).split(' / ');
    return { eur: a[0], rsd: a[1] || '' };
  }
  function icon(id, s) { return '<svg class="ico" width="' + (s || 20) + '" height="' + (s || 20) + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  html.classList.add('js-ready');
  if (!C) { html.classList.remove('js'); return; } // no data: show the static markup, never leave .rv content at opacity 0

  /* ---------------------------------------------------------------- images ---------- */
  var IMG = {
    verticals: [
      { n: 'vertical-protocols', w: 800, h: 800, pos: '50% 50%', alt: 'Terapeutkinja nežno masira lice žene čija je glava umotana belim peškirom, tokom tretmana lica.' },
      { n: 'vertical-body', w: 800, h: 533, pos: '50% 50%', alt: 'Staklene bočice sa uljima za masažu, sveće, kamenje i biljni jastučić na drvenom poslužavniku, a u pozadini zamućena žena odmara.' },
      { n: 'woman-portrait', w: 800, h: 893, pos: '50% 22%', cutout: true, alt: 'Portret žene sa zategnutom punđom i blistavim tenom, pogleda skrenutog u stranu, ruka joj počiva na ramenu.' },
      { n: 'vertical-laser', w: 800, h: 533, pos: '50% 40%', alt: 'Terapeut u sivoj uniformi tretira leđa žene koja leži na stolu, uz upaljene sveće u mekom svetlu.' },
      { n: 'vertical-esthetic', w: 800, h: 534, pos: '50% 42%', alt: 'Dvoje gostiju u belim bademantilima opušteno leži na masažnim stolovima, a u prvom planu su cvet plumerije, ulja, so i peškir.' }
    ]
  };
  function imgTag(o, sizes, cls, lazy) {
    var set = o.set || [480, 800, 1200];
    var ss = set.map(function (w) { return 'assets/img/' + o.n + '-' + w + '.webp ' + w + 'w'; }).join(', ');
    return '<img class="' + cls + '" src="assets/img/' + o.n + '-800.webp" srcset="' + ss + '" sizes="' + sizes + '" width="' + o.w + '" height="' + o.h + '" alt="' + esc(o.alt) + '" style="object-position:' + o.pos + '"' + (lazy === false ? '' : ' loading="lazy"') + ' decoding="async">';
  }

  /* ---------------------------------------------------------------- marquee ---------- */
  (function marquee() {
    var host = $('#marquee .marquee__track'); if (!host) return;
    var items = ['LEPA . SVAKI . DAN', 'LEPA . SVAKI . DAN', 'LEPA . SVAKI . DAN', 'LEPA . SVAKI . DAN', 'LEPA . SVAKI . DAN', 'LEPA . SVAKI . DAN']; // brand signature line between the gold hairlines
    var list = '<ul class="marquee__list">' + items.concat(items).map(function (t) { return '<li class="marquee__item">' + esc(t) + '</li>'; }).join('') + '</ul>';
    host.innerHTML = list + list;
  })();

  /* ---------------------------------------------------------------- verticals (work cards) ---------- */
  (function works() {
    var host = $('#works'); if (!host) return;
    host.innerHTML = C.verticals.map(function (v, i) {
      var im = IMG.verticals[i];
      var wide = i === 4;
      var sizes = wide ? '(min-width:1200px) 1120px, (min-width:768px) 92vw, 92vw' : '(min-width:1200px) 554px, (min-width:768px) 46vw, 92vw';
      return '<a class="work rv' + (im.cutout ? ' work--cutout' : '') + '" href="#usluge/' + v.cenovnikTab + '" data-open-tab="' + v.cenovnikTab + '" style="--rv-d:' + ((i % 2) * .08) + 's">' +
        imgTag(im, sizes, 'work__img', true) +
        '<span class="brk" aria-hidden="true"></span>' +
        '<span class="work__arrow" aria-hidden="true">' + icon('arrow-ur') + '</span>' +
        '<span class="work__meta">' +
          '<span class="work__title">' + esc(v.title) + '</span>' +
          '<span class="work__sum">' + esc(v.summary) + '</span>' +
          '<span class="work__tags"><span class="chip chip--photo">' + usl(v.cenovnikServiceCount) + '</span></span>' +
        '</span></a>';
    }).join('');
  })();

  /* ---------------------------------------------------------------- shell cards: favorites, gifts, offers ---------- */
  function priceBlock(p) {
    var s = splitPrice(p);
    return '<div class="shell__price"><span class="price-big">' + esc(s.eur || s.req) + '</span>' + (s.rsd ? '<span class="price-sub">' + esc(s.rsd) + '</span>' : '') + '</div>';
  }
  function linkToService(item, label) {
    var c = item.cenovnik || {};
    return '<a class="shell__link" href="#usluge/' + (c.tab || '') + '" data-service="' + esc(c.id || '') + '">' + esc(label) + icon('arrow-r', 18) + '</a>';
  }
  (function favorites() {
    var host = $('#favorites'); if (!host) return;
    host.innerHTML = C.favorites.map(function (f, i) {
      var c = f.cenovnik || {};
      return '<article class="shell rv' + (i === 0 ? ' shell--prominent' : '') + '" style="--rv-d:' + ((i % 2) * .08) + 's">' +
        '<div class="shell__bar"><h3 class="shell__title">' + esc(tame(f.name)) + '</h3>' +
        '<a class="shell__go" href="#usluge/' + (c.tab || '') + '" data-service="' + esc(c.id || '') + '" aria-label="Pogledaj u cenovniku: ' + esc(tame(f.name)) + '">' + icon('arrow-ur') + '</a></div>' +
        '<div class="shell__body">' + (i === 0 ? '<span class="brk brk--gold" aria-hidden="true"></span>' : '') + '<p class="shell__desc">' + esc(f.description || '') + '</p>' + priceBlock(f.price) +
        '<div class="shell__foot"><span class="chip chip--outline-sm">' + esc(f.tagLabel) + '</span>' + linkToService(f, 'Pogledaj u cenovniku') + '</div></div></article>';
    }).join('');
  })();
  (function gifts() {
    var host = $('#gift-list'); if (!host) return;
    host.innerHTML = C.gifts.map(function (g) {
      var c = g.cenovnik || {};
      return '<article class="shell shell--gift">' +
        '<div class="shell__bar"><h3 class="shell__title">' + esc(tame(g.name)) + '</h3>' +
        '<a class="shell__go" href="#usluge/' + (c.tab || '') + '" data-service="' + esc(c.id || '') + '" aria-label="Pogledaj u cenovniku: ' + esc(tame(g.name)) + '">' + icon('arrow-ur') + '</a></div>' +
        '<div class="shell__body"><span class="chip chip--outline-sm" style="align-self:flex-start">' + esc(g.tagLabel) + '</span>' +
        '<p class="shell__desc">' + esc(g.description || '') + '</p>' + priceBlock(g.price) + '</div></article>';
    }).join('');
  })();
  /* offers teaser: pre-rendered by the build script from assets/offers.js; re-rendered here only when the data changed (data-sig) */
  (function offersTeaser() {
    var host = $('#offers'), V = window.LSD_OFFERS_VIEW, list = C.offers; if (!host || !V || !list) return;
    var s = V.sig(list); if (host.getAttribute('data-sig') === s) return;
    host.innerHTML = V.teaser(list); host.setAttribute('data-sig', s);
  })();

  /* ---------------------------------------------------------------- locations: "1 filozofija, 2 lokacije" split ----------
     Phones (< 768px): the two halves are stacked, tap one to open it, the other folds to its title strip (one is always open).
     Desktop / tablet: side by side; hover (pointer devices) widens the half under the pointer, a click or tap keeps one half wide (tap again to release).
     The widening is only animated after the first interaction, so the page never "grows" at load or on rotation. */
  (function split() {
    var host = $('#split'); if (!host) return;
    var halves = $$('.sp', host), narrow = matchMedia('(max-width: 767px)');
    function set(i, scroll) {
      halves.forEach(function (h, k) {
        var on = k === i, b = $('.sp__name button', h);
        h.classList.toggle('is-active', on);
        if (narrow.matches) { b.setAttribute('aria-expanded', String(on)); b.removeAttribute('aria-pressed'); }
        else { b.removeAttribute('aria-expanded'); b.setAttribute('aria-pressed', String(on)); }
      });
      if (scroll && i > -1 && narrow.matches) halves[i].scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
    function reset() { set(narrow.matches ? 0 : -1); }
    halves.forEach(function (h, i) {
      h.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        host.classList.add('is-live');
        var on = h.classList.contains('is-active');
        if (narrow.matches) { if (!on) set(i, true); } else set(on ? -1 : i);
      });
    });
    host.addEventListener('pointerenter', function () { host.classList.add('is-live'); }, { once: true });
    host.addEventListener('focusin', function () { host.classList.add('is-live'); }, { once: true });
    narrow.addEventListener('change', reset);
    reset();
  })();

  /* ---------------------------------------------------------------- testimonials ---------- */
  (function testimonials() {
    var track = $('#testi-track'); if (!track) return;
    var T = C.testimonials, n = T.length, idx = 0, timer = null, hovered = false, inView = false;
    track.innerHTML = T.map(function (t, i) {
      var ini = t.author.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
      return '<div class="tq" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + n + '">' +
        '<blockquote class="tq__text"><p>' + esc(t.quote) + '</p></blockquote>' +
        '<div class="tq__by"><span class="avatar avatar--lila" aria-hidden="true">' + esc(ini) + '</span><span><strong>' + esc(t.author) + '</strong><small>' + esc(t.tag) + '</small></span></div></div>';
    }).join('');
    var dots = $('#testi-dots'), count = $('#testi-count');
    dots.innerHTML = T.map(function (t, i) { return '<button class="testi__dot" type="button" data-i="' + i + '" aria-label="' + (i + 1) + ' / ' + n + '"><i></i></button>'; }).join('');
    function paint() {
      count.textContent = (idx + 1) + ' / ' + n;
      $$('.testi__dot', dots).forEach(function (d, i) { if (i === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    }
    function go(i, smooth) {
      idx = (i + n) % n;
      track.scrollTo({ left: idx * track.clientWidth, behavior: (reduce || smooth === false) ? 'auto' : 'smooth' });
      paint();
    }
    var raf = 0;
    track.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; var i = Math.round(track.scrollLeft / track.clientWidth); if (i !== idx && i >= 0 && i < n) { idx = i; paint(); } });
    }, { passive: true });
    $('#testi-prev').addEventListener('click', function () { go(idx - 1); restart(); });
    $('#testi-next').addEventListener('click', function () { go(idx + 1); restart(); });
    dots.addEventListener('click', function (e) { var b = e.target.closest('.testi__dot'); if (b) { go(+b.dataset.i); restart(); } });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(idx + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(idx - 1); e.preventDefault(); } });
    window.addEventListener('resize', function () { track.scrollTo({ left: idx * track.clientWidth, behavior: 'auto' }); });
    paint();
    // auto-rotate: pointer devices only, never with reduced motion, paused on hover / focus / when off screen
    var auto = canHover && !reduce;
    var every = Math.max((C.sections.testimonials.autoRotateMs || 5000), 8000);
    function tick() { if (!hovered && inView && !track.contains(doc.activeElement)) go(idx + 1); }
    function restart() { if (!auto) return; clearInterval(timer); timer = setInterval(tick, every); }
    if (auto) {
      var stage = $('.testi__stage');
      stage.addEventListener('mouseenter', function () { hovered = true; });
      stage.addEventListener('mouseleave', function () { hovered = false; });
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: .4 }).observe(stage);
      restart();
    }
  })();

  /* ---------------------------------------------------------------- cenovnik ---------- */
  var price = (function () {
    var P = C.pricing, tabs = P.tabs;
    var tabsEl = $('#tabs'), panelsEl = $('#panels'), barEl = $('#tabs-bar'), qEl = $('#price-q'), clearEl = $('#price-clear');
    var statusEl = $('#price-status'), hintEl = $('#price-hint'), shellEl = $('#price-shell'), searchBoxEl = $('.price__search'), countEl = $('#price-count'), openAllEl = $('#open-all');
    var cur = tabs[0].id, prevOpen = null, searching = false;
    var openAllLabel = openAllEl.textContent = 'Otvori sve grupe';

    tabsEl.innerHTML = tabs.map(function (t, i) {
      return '<button class="tab" role="tab" type="button" id="tab-' + t.id + '" aria-selected="' + (i === 0) + '" aria-controls="panel-' + t.id + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-tab-id="' + t.id + '">' + esc(t.label) + '<small>' + t.serviceCount + '</small></button>';
    }).join('');

    function svcHtml(s, t) {
      var pr = splitPrice(s.price);
      var wide = pr.rsd && (pr.rsd.length > 12 || pr.eur.length > 9);
      return '<li class="svc' + (wide ? ' svc--wide' : '') + '" data-service-id="' + s.id + '"><span class="svc__name">' + esc(tame(s.name)) + '</span>' +
        (s.description ? '<span class="svc__desc">' + esc(s.description) + '</span>' : '') +
        (s.highlight && t.kind !== 'laser' ? '<span class="svc__tags"><span class="chip chip--mark">akcija</span></span>' : '') +
        '<span class="svc__price">' + (pr.req ? '<span class="svc__req svc__cap">' + esc(pr.req) + '</span>' : '<span class="svc__eur">' + esc(pr.eur) + '</span>' + (pr.rsd ? '<span class="svc__rsd">' + esc(pr.rsd) + '</span>' : '')) + '</span></li>';
    }
    function grpHtml(t, g, gi) {
      var base = t.id + '-' + gi, open = gi === 0;
      return '<section class="grp' + (open ? ' is-open' : '') + '" data-group-id="' + t.id + ':' + gi + '">' +
        '<h3><button class="grp__btn" type="button" id="gb-' + base + '" aria-expanded="' + open + '" aria-controls="gp-' + base + '">' +
        '<span class="grp__txt"><span class="grp__t">' + esc(tame(g.title)) + '</span><span class="grp__c">' + usl(g.services.length) + '</span></span>' +
        '<span class="grp__i" aria-hidden="true">' + icon('plus') + '</span></button></h3>' +
        '<div class="grp__body" id="gp-' + base + '" role="region" aria-labelledby="gb-' + base + '"><div class="grp__in"><ul class="svc-list">' + g.services.map(function (s) { return svcHtml(s, t); }).join('') + '</ul></div></div></section>';
    }
    panelsEl.innerHTML = tabs.map(function (t, i) {
      return '<div class="panel" role="tabpanel" id="panel-' + t.id + '" aria-labelledby="tab-' + t.id + '" data-panel-id="' + t.id + '"' + (i ? ' hidden' : '') + '>' +
        (t.note ? '<p class="price__note">' + t.note.html + '</p>' : '') + t.groups.map(function (g, gi) { return grpHtml(t, g, gi); }).join('') + '</div>';
    }).join('');

    /* rows of the list (the shared engine, js/search.js, decides which of them match a query) */
    var rows = [];
    tabs.forEach(function (t) { t.groups.forEach(function (g, gi) { g.services.forEach(function (s) {
      rows.push({ tab: t.id, gi: gi, id: s.id, hay: norm(s.name + ' ' + (s.description || '') + ' ' + g.title + ' ' + t.label), el: panelsEl.querySelector('[data-service-id="' + s.id + '"]'), match: true });
    }); }); });
    var groupEls = $$('.grp', panelsEl);

    function tabById(id) { return tabs.filter(function (t) { return t.id === id; })[0]; }
    function setOpen(g, open) {
      g.classList.toggle('is-open', open);
      var b = $('.grp__btn', g); b.setAttribute('aria-expanded', String(open));
    }
    function visibleGroups(panel) { return $$('.grp', panel).filter(function (g) { return !g.hidden; }); }
    function updateMeta() {
      var panel = $('#panel-' + cur), t = tabById(cur);
      var gs = visibleGroups(panel), n = $$('.svc', panel).filter(function (s) { return !s.hidden; }).length;
      countEl.textContent = gs.length + ' ' + plural(gs.length, 'grupa', 'grupe', 'grupa') + ' · ' + usl(n);
      openAllEl.hidden = gs.length < 4;
      var all = gs.length && gs.every(function (g) { return g.classList.contains('is-open'); });
      openAllEl.textContent = all ? 'Zatvori sve grupe' : openAllLabel;
      openAllEl.dataset.all = all ? '1' : '';
    }
    function fades() {
      var max = tabsEl.scrollWidth - tabsEl.clientWidth;
      barEl.classList.toggle('can-left', tabsEl.scrollLeft > 4);
      barEl.classList.toggle('can-right', tabsEl.scrollLeft < max - 4);
    }
    /* where the list starts: the shell sits right under the sticky tabs bar, so this is the scroll position that shows the active tab and its first group */
    function navBottom() { var n = $('.nav__pill'); return n ? n.getBoundingClientRect().bottom : 0; }
    function listTopY() {
      var stuck = parseFloat(getComputedStyle(barEl).top) || 0;
      return shellEl.getBoundingClientRect().top + scrollY - stuck - barEl.offsetHeight + 4;
    }
    function scrollToList(instant) { scrollTo({ top: Math.max(0, listTopY()), behavior: (instant || reduce) ? 'auto' : 'smooth' }); }
    function scrollToSearch() { scrollTo({ top: Math.max(0, searchBoxEl.getBoundingClientRect().top + scrollY - navBottom() - 10), behavior: reduce ? 'auto' : 'smooth' }); }
    function selectTab(id, o) {
      o = o || {};
      if (!tabById(id)) return;
      cur = id;
      $$('.tab', tabsEl).forEach(function (b) { var on = b.dataset.tabId === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      $$('.panel', panelsEl).forEach(function (p) { p.hidden = p.dataset.panelId !== id; });
      var tb = $('#tab-' + id), left = tb.offsetLeft - (tabsEl.clientWidth - tb.offsetWidth) / 2;
      tabsEl.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
      if (o.hash !== false) { try { history.replaceState(null, '', '#usluge/' + id); } catch (e) { } }
      updateMeta(); setTimeout(fades, 350);
      if (searching) renderStatus();
      // switching category from deep inside a long list: the new (shorter, collapsed) list must start in view, not leave the user in the sections below
      if (o.fromUser && shellEl.getBoundingClientRect().top < barEl.getBoundingClientRect().bottom - 2) scrollToList();
    }

    tabsEl.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) selectTab(b.dataset.tabId, { fromUser: true }); });
    tabsEl.addEventListener('keydown', function (e) {
      var ids = tabs.map(function (t) { return t.id; }), i = ids.indexOf(cur), n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % ids.length; else if (e.key === 'ArrowLeft') n = (i - 1 + ids.length) % ids.length;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = ids.length - 1;
      if (n !== null) { e.preventDefault(); selectTab(ids[n], { fromUser: true }); $('#tab-' + ids[n]).focus({ preventScroll: true }); }
    });
    tabsEl.addEventListener('scroll', function () { requestAnimationFrame(fades); }, { passive: true });
    addEventListener('resize', fades);

    panelsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.grp__btn'); if (!b) return;
      var g = b.closest('.grp'); setOpen(g, !g.classList.contains('is-open')); updateMeta();
    });
    openAllEl.addEventListener('click', function () {
      var gs = visibleGroups($('#panel-' + cur)), all = openAllEl.dataset.all === '1';
      gs.forEach(function (g) { setOpen(g, !all); }); updateMeta();
    });

    /* search */
    var minChars = 2, counts = {}, total = 0, deb = 0;
    function tabCounts(on) { // while searching, the little tab badges show matches instead of totals
      tabs.forEach(function (t) { var sm = $('#tab-' + t.id + ' small'), b = $('#tab-' + t.id); if (!sm) return; sm.textContent = on ? (counts[t.id] || 0) : t.serviceCount; b.classList.toggle('is-empty', !!on && !counts[t.id]); });
    }
    function renderStatus() {
      var q = qEl.value.trim();
      if (!searching) { statusEl.textContent = ''; return; }
      var here = counts[cur] || 0;
      if (!total) { statusEl.textContent = 'Nema rezultata za \u201e' + q + '\u201c. Pozovite nas ili pi\u0161ite na WhatsApp, rado \u0107emo vam preporu\u010diti pravi tretman.'; return; }
      // matches in the other categories are already shown as the badges on the tabs (empty tabs are dimmed), so the status only adds the total
      var more = total - here;
      statusEl.textContent = here + ' ' + plural(here, 'rezultat', 'rezultata', 'rezultata') + ' u kategoriji ' + tabById(cur).label + (more ? ' · još ' + more + ' u drugim kategorijama' : '');
    }
    var narrowMq = matchMedia('(max-width: 1023px)');
    function showResults(started) { // phones: put the search field right under the nav so the status line and the first results are above the keyboard / the fold
      if (!narrowMq.matches || !total) return;
      var vv = window.visualViewport, vh = vv ? vv.height : innerHeight, st = statusEl.getBoundingClientRect();
      if (started || st.top < navBottom() || st.bottom > vh * .6) scrollTo({ top: Math.max(0, searchBoxEl.getBoundingClientRect().top + scrollY - navBottom() - 8), behavior: reduce ? 'auto' : 'smooth' });
    }
    function applySearch() {
      var q = qEl.value.trim();
      clearEl.hidden = !q;
      if (q.length < minChars) { endSearch(); return; }
      var E = window.LSD_SEARCH;
      if (E) E.ready(function () { if (qEl.value.trim() === q) paint(q, E.services(q).ids); }); // the index loads on first use; the list updates when it is there
      else { var tk = norm(q).split(/\s+/).filter(Boolean), ids = {}; rows.forEach(function (r) { if (tk.every(function (t) { return r.hay.indexOf(t) > -1; })) ids[r.id] = 1; }); paint(q, ids); }
    }
    function paint(q, ids) {
      var started = !searching;
      if (started) { prevOpen = groupEls.map(function (g) { return g.classList.contains('is-open'); }); searching = true; hintEl.hidden = true; }
      counts = {}; total = 0;
      rows.forEach(function (r) {
        var m = !!ids[r.id];
        r.match = m; r.el.hidden = !m;
        if (m) { counts[r.tab] = (counts[r.tab] || 0) + 1; total++; }
      });
      groupEls.forEach(function (g) {
        var all = $$('.svc', g), vis = all.filter(function (s) { return !s.hidden; }).length;
        g.hidden = !vis; if (vis) setOpen(g, true);
        $('.grp__c', g).textContent = vis === all.length ? usl(vis) : vis + ' od ' + all.length + ' usluga';
      });
      tabCounts(true);
      if (!counts[cur] && total) { var best = tabs.slice().sort(function (a, b) { return (counts[b.id] || 0) - (counts[a.id] || 0); })[0]; selectTab(best.id, { hash: false }); }
      else { updateMeta(); }
      renderStatus();
      showResults(started);
    }
    function endSearch() {
      if (!searching) { renderStatus(); return; }
      searching = false; hintEl.hidden = false; counts = {}; tabCounts(false);
      rows.forEach(function (r) { r.el.hidden = false; r.match = true; });
      groupEls.forEach(function (g, i) { g.hidden = false; setOpen(g, prevOpen ? prevOpen[i] : false); $('.grp__c', g).textContent = usl($$('.svc', g).length); });
      updateMeta(); renderStatus();
    }
    qEl.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(applySearch, 120); clearEl.hidden = !qEl.value; });
    qEl.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && qEl.value) { qEl.value = ''; applySearch(); }
      else if (e.key === 'Enter') { clearTimeout(deb); applySearch(); qEl.blur(); } // "search" key: show the results, drop the keyboard
    });
    clearEl.addEventListener('click', function () { qEl.value = ''; applySearch(); qEl.focus(); });
    hintEl.addEventListener('click', function (e) { var b = e.target.closest('button[data-q]'); if (b) { qEl.value = b.dataset.q; clearTimeout(deb); applySearch(); } });
    // the long placeholder is cut off on a phone: keep the short form there (the tappable examples sit right below)
    var phLong = qEl.getAttribute('placeholder'), phShort = qEl.getAttribute('data-ph-short') || 'Pretraži cenovnik', phMq = matchMedia('(max-width: 479px)');
    function placeholder() { qEl.setAttribute('placeholder', phMq.matches ? phShort : phLong); }
    placeholder(); phMq.addEventListener('change', placeholder);

    function openTab(id) { qEl.value = ''; applySearch(); selectTab(id); scrollToList(); }
    function openService(id) {
      var el = panelsEl.querySelector('[data-service-id="' + id + '"]'); if (!el) return;
      qEl.value = ''; applySearch();
      var tab = id.split(':')[0]; selectTab(tab);
      var g = el.closest('.grp'); setOpen(g, true); updateMeta();
      setTimeout(function () { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash'); }, 60);
    }
    /* deep link into one group (from article pages, segment pages, ?grupa=<tab:index> or #usluge/<tab:index>): right tab, group open, scrolled just below the sticky bars, briefly highlighted */
    function openGroup(id) {
      var g = panelsEl.querySelector('[data-group-id="' + id + '"]'); if (!g) return false;
      qEl.value = ''; applySearch();
      selectTab(id.split(':')[0], { hash: false });
      setOpen(g, true); updateMeta();
      setTimeout(function () {
        var stuck = parseFloat(getComputedStyle(barEl).top) || 0;
        var y = g.getBoundingClientRect().top + scrollY - stuck - barEl.offsetHeight - 6;
        scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
        g.classList.remove('is-flash'); void g.offsetWidth; g.classList.add('is-flash');
      }, 120);
      return true;
    }
    function searchFor(q) { // from the hero search ("Svi rezultati u cenovniku") or ?q=
      qEl.value = q; clearTimeout(deb); applySearch();
      var E = window.LSD_SEARCH; if (E) E.ready(function () { setTimeout(scrollToSearch, 60); }); else scrollToSearch();
    }
    selectTab(cur, { hash: false }); fades();
    return { openTab: openTab, openService: openService, openGroup: openGroup, search: searchFor, scrollToList: scrollToList, scrollToSearch: scrollToSearch, selectTab: selectTab, has: tabById };
  })();

  window.LSD_PRICE = { openGroup: price.openGroup, openService: price.openService, search: price.search };

  /* in-page links into the price list */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    var svc = a.getAttribute('data-service'), tab = a.getAttribute('data-open-tab');
    if (svc) { e.preventDefault(); price.openService(svc); }
    else if (tab) { e.preventDefault(); price.openTab(tab); }
    else if (a.getAttribute('href') === '#usluge' && a.closest('#menu')) { // phone menu: land on search + tabs + first group, not on the section heading
      e.preventDefault(); price.scrollToSearch(); try { history.replaceState(null, '', '#usluge'); } catch (x) { }
    }
  });
  function fromQuery() { // ?grupa=estetske:5  or  ?usluga=protokoli:2:2  (links from the blog, segment and offers pages)
    var q; try { q = new URLSearchParams(location.search); } catch (e) { return false; }
    var s = q.get('usluga'), g = q.get('grupa'), t = q.get('q');
    if (s && doc.querySelector('[data-service-id="' + s.replace(/"/g, '') + '"]')) { price.openService(s); return true; }
    if (g && price.openGroup(g)) return true;
    if (t && t.trim().length >= 2) { price.search(t.trim()); return true; }
    return false;
  }
  function fromHash() {
    var h = decodeURIComponent(location.hash || '');
    var m = h.match(/^#usluge\/([a-z]+)(?::(\d+))?$/);
    if (m && price.has(m[1])) {
      if (m[2] !== undefined && price.openGroup(m[1] + ':' + m[2])) return true;
      price.selectTab(m[1], { hash: false }); setTimeout(price.scrollToList, 30); return true;
    }
    return false;
  }
  addEventListener('hashchange', fromHash);
  if (!fromQuery() && !fromHash() && location.hash.length > 1) {
    var tgt = doc.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (tgt) setTimeout(function () { tgt.scrollIntoView(); }, 30);
  }

  /* payment note sheet */
  (function sheet() {
    var dlg = $('#pay-sheet'), btn = $('#chip-pay'); if (!dlg || !btn) return;
    if (typeof dlg.showModal !== 'function') { btn.hidden = true; return; }
    btn.addEventListener('click', function () { dlg.showModal(); html.classList.add('sheet-open'); html.style.overflow = 'hidden'; });
    function close() { dlg.close(); }
    $('#pay-ok').addEventListener('click', close); $('#pay-x').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () { html.classList.remove('sheet-open'); html.style.overflow = ''; btn.focus(); });
  })();

  /* ---------------------------------------------------------------- hero parallax (home only) ---------- */
  (function heroScroll() {
    var img = $('#hero-img'), ticking = false; if (!img) return;
    var w = innerWidth, k = w >= 1200 ? .000154 : w >= 810 ? .000107 : .000112, ty = w >= 1200 ? .3 : .12;
    function frame() {
      ticking = false; var y = Math.min(scrollY, innerHeight * 1.3);
      if (!reduce) img.style.transform = 'translate(-50%,' + (y * ty).toFixed(1) + 'px) scale(' + (1 + y * k).toFixed(4) + ')';
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    addEventListener('resize', function () { w = innerWidth; k = w >= 1200 ? .000154 : w >= 810 ? .000107 : .000112; ty = w >= 1200 ? .3 : .12; frame(); });
    frame();
  })();

  /* ---------------------------------------------------------------- home-only observers ---------- */
  (function observers() {
    var once = window.LSD_UI.once, t0 = performance.now();
    once('.stat__n', { threshold: .6 }, function (el) {
      if (reduce || performance.now() - t0 < 700) return; // visible at load: keep the final value, count up only when scrolled into view
      var end = +el.dataset.count, suf = el.dataset.suffix || '', st = null, dur = 1300;
      function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + suf; }
      function step(t) { if (!st) st = t; var p = Math.min(1, (t - st) / dur), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); el.textContent = fmt(Math.max(1, Math.round(end * e))); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(end); }
      requestAnimationFrame(step);
    });
    // marquee pause when off screen
    var mq = $('#marquee');
    if (mq && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { mq.classList.toggle('is-paused', !en[0].isIntersecting); }).observe(mq);
    // the price list (nav + tabs + action bar would otherwise cover a third of a short phone): hide the mobile action bar while it is on screen
    var list = $('#price-shell');
    if (list && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { window.LSD_UI.barHold('list', en[0].isIntersecting); }, { rootMargin: '0px 0px -72px 0px' }).observe(list);
  })();
})();
