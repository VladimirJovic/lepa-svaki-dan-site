/* app.js: the HOME page. Renders the data-driven sections from window.LSD_CONTENT and runs the Cenovnik (tabs, accordion, search, deep links).
   The shared shell (header, menu, action bar, footer) lives in js/shell.js, the site search in js/search.js (the price-list filter below uses the
   same engine); the blog teaser and the "Saznajte vise" cards are written into index.html by _tools/b/build-pages.mjs. Pripremio ECHOSYSTEM-MOTHER AGENCY. */
(function () {
  'use strict';
  var C = window.LSD_CONTENT, L = window.LSD || {};
  if (!C) { console.error('LSD_CONTENT missing'); return; }
  var RM = L.RM;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var get = function (path) {
    if (path.indexOf('copy.') === 0) return C.copy[path.slice(5)];
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, C);
  };
  var ico = function (id, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  var WA = C.contact.primaryWhatsappHref;
  var PH = C.contact.phones, IG = (C.contact.social.filter(function (x) { return /instagram/i.test(x.label); })[0] || {}).href;

  /* ---------- images (media pack) ---------- */
  var IMG = {
    'vertical-laser': [2000, 1333, [480, 800, 1200, 1800]], 'vertical-protocols': [2000, 2000, [480, 800, 1200, 1800]],
    'vertical-body': [2000, 1333, [480, 800, 1200, 1800]], 'vertical-esthetic': [2000, 1334, [480, 800, 1200, 1800]],
    'vertical-face': [2000, 2000, [480, 800, 1200, 1800]], 'location-novi-beograd': [2000, 2000, [480, 800, 1200, 1800]],
    'location-waterfront': [2000, 1142, [480, 800, 1200, 1800]], 'woman-portrait': [1500, 1675, [480, 800, 1200]]
  };
  var ALT = {
    'vertical-laser': 'Terapeut masira leđa žene koja leži na stolu, uz upaljene sveće u mekom svetlu.',
    'vertical-protocols': 'Terapeutkinja nežno masira lice žene čija je glava umotana belim peškirom, tokom tretmana lica.',
    'vertical-body': 'Staklene bočice sa uljima za masažu, sveće, kamenje i biljni jastučić na drvenom poslužavniku, a u pozadini zamućena žena odmara.',
    'vertical-esthetic': 'Dvoje gostiju u belim bademantilima opušteno leži na masažnim stolovima, a u prvom planu su cvet plumerije, ulja, so i peškir.',
    'vertical-face': 'Pogled odozgo na mirisnu sveću u ćilibarnom staklu sa suvim travama i senkama biljaka na bež podlozi.',
    'location-novi-beograd': 'Terapeut masira leđa klijentkinje toplim biljnim jastučićima u svetlom salonu sa zelenim zidom.',
    'location-waterfront': 'Žena zatvorenih očiju meditira u sedećem položaju na krznenom tepihu, okružena upaljenim svećama u toplo osvetljenoj sobi.',
    'woman-portrait': 'Portret žene sa zategnutom punđom i blistavim tenom, pogleda skrenutog u stranu, ruka joj počiva na ramenu.'
  };
  var img = function (name, sizes, pos, lazy) {
    var d = IMG[name], w = d[2];
    var srcset = w.map(function (x) { return 'assets/img/' + name + '-' + x + '.webp ' + x + 'w'; }).join(', ');
    return '<img src="assets/img/' + name + '-' + w[Math.min(1, w.length - 1)] + '.webp" srcset="' + srcset + '" sizes="' + sizes + '" width="' + d[0] + '" height="' + d[1] + '" alt=""' +
      (pos ? ' style="object-position:' + pos + '"' : '') + (lazy === false ? '' : ' loading="lazy"') + ' decoding="async">';
  };

  /* ---------- helpers on prices ---------- */
  var split = function (p) { var i = (p || '').indexOf(' / '); return i > 0 ? [p.slice(0, i), p.slice(i + 3)] : [p || '', '']; };
  var norm = function (x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj'); };
  var tabById = {}; C.pricing.tabs.forEach(function (t) { tabById[t.id] = t; });
  var tabCount = function (t) { return t.groups.reduce(function (a, g) { return a + g.services.length; }, 0); };

  /* ---------- 1. data bindings ---------- */
  $$('[data-t]').forEach(function (el) { var v = get(el.getAttribute('data-t')); if (v != null) el.textContent = v; });
  $$('[data-h]').forEach(function (el) { var v = get(el.getAttribute('data-h')); if (v != null) el.innerHTML = v; });
  $$('[data-html="quote.html"]').forEach(function (el) { el.innerHTML = C.quote.html.replace(/^"/, '').replace(/"$/, ''); });

  /* ---------- 2. numbers ---------- */
  (function () {
    var h = C.stats.items.map(function (s, i) {
      return '<div class="stat" data-reveal style="--d:' + (i * .08) + 's"><b><span class="count" data-end="' + s.value + '">' + E(s.display) + '</span>' + (s.suffix ? '<small>' + E(s.suffix) + '</small>' : '') + '</b><span>' + E(s.label) + '</span></div>';
    });
    var hrs = C.contact.hours.display.split(/,\s*| · /);   // "Pon-Sub" , "9-21h"
    var m = (hrs[1] || '').match(/^(.*?)(h)$/);
    h.push('<div class="stat" data-reveal style="--d:.24s"><b>' + E(m ? m[1] : hrs[1]) + (m ? '<small>' + m[2] + '</small>' : '') + '</b><span>' + E(hrs[0]) + '</span></div>');
    $('#numbers').innerHTML = h.join('');
  })();

  /* ---------- 3. treatment panels ---------- */
  (function () {
    var cfg = {
      /* str = glass strength at rest; the portrait with a face stays gentle so features are never sliced */
      lice: { img: 'vertical-protocols', pos: '50% 50%', str: 2, sizes: '(min-width:1200px) 420px, (min-width:810px) 50vw, 100vw' },
      telo: { img: 'vertical-body', pos: '56% 50%', str: 2, sizes: '(min-width:1200px) 420px, (min-width:810px) 50vw, 100vw' },
      estetske: { img: 'woman-portrait', pos: '50% 8%', str: 1.5, stage: true, sizes: '(min-width:1200px) 420px, (min-width:810px) 50vw, 100vw' },
      laserska: { img: 'vertical-face', pos: '50% 50%', str: 2, sizes: '(min-width:1200px) 640px, (min-width:810px) 50vw, 100vw' },
      protokoli: { img: 'vertical-esthetic', pos: '42% 50%', str: 2, sizes: '(min-width:1200px) 640px, 100vw' }
    };
    $('#panels').innerHTML = C.verticals.map(function (v, i) {
      var c = cfg[v.cenovnikTab], t = tabById[v.cenovnikTab], no = String(i + 1);
      return '<a class="panel' + (c.stage ? ' panel--stage' : '') + '" href="#usluge" data-open-tab="' + v.cenovnikTab + '" data-flute-root data-reveal style="--y:36px;--d:' + (i % 3) * .08 + 's">' +
        '<div class="flute' + (c.stage ? ' flute--stage' : '') + '" data-mode="hover" data-flute="20" data-strength="' + c.str + '"' + (c.stage ? ' data-cutout' : '') + ' aria-hidden="true">' + img(c.img, c.sizes, c.pos) + '</div>' +
        '<span class="panel__no" aria-hidden="true">' + no + '</span>' +
        '<div class="plate"><h3>' + E(v.title) + '</h3><p class="panel__sum">' + E(v.summary) + '</p>' +
        /* the count is the Cenovnik's own count, so the card and the category tab can never disagree; no derived 'from' price is printed */
        '<div class="panel__meta"><span>' + tabCount(t) + ' ' + E(C.pricing.ui.groupCountSuffix) + '</span><span class="panel__go">' + ico('arrow') + '</span></div></div></a>';
    }).join('');
  })();

  /* ---------- 4. favourites, gifts ---------- */
  (function () {
    $('#favs').innerHTML = C.favorites.map(function (f, i) {
      var p = split(f.price);
      return '<li data-reveal style="--y:20px;--d:' + i * .06 + 's"><a class="row" href="#usluge" data-open-service="' + E(f.cenovnik.id) + '">' +
        '<span class="row__n">' + E(f.name) + ' <i class="pill">' + E(f.tagLabel) + '</i></span>' +
        (f.description ? '<span class="row__d">' + E(f.description) + '</span>' : '') +
        '<span class="row__p"><b>' + E(p[0]) + '</b><span>' + E(p[1]) + '</span></span></a></li>';
    }).join('');
    $('#gifts').innerHTML = C.gifts.map(function (f, i) {
      var p = split(f.price), href = WA + '?text=' + encodeURIComponent('Zdravo, zanima me: ' + f.name);
      return '<li class="note" data-reveal style="--y:24px;--d:' + i * .08 + 's"><span class="note__ic">' + ico('gift') + '</span>' +
        '<h3>' + E(f.name) + '</h3>' + (f.description ? '<p>' + E(f.description) + '</p>' : '<p>' + E(f.tagLabel) + '</p>') +
        '<div class="note__f"><span class="pr"><b>' + E(p[0]) + '</b><span>' + E(p[1]) + '</span></span><a class="btn btn--ghost btn--sm" href="' + E(href) + '" target="_blank" rel="noopener">' + E(C.nav.cta.short) + ' ' + ico('arrow') + '</a></div></li>';
    }).join('');
  })();

  /* ---------- 5. locations: ONE split of two halves that touch (hover widens a half on a mouse, a tap or a swipe switches on touch) ---------- */
  (function () {
    var img2 = { nb: 'location-novi-beograd', bw: 'location-waterfront' }, host = $('#split'), hint = $('#split-hint');
    if (!host) return;
    host.innerHTML = C.locations.map(function (l, i) {
      var n = img2[l.key];
      return '<article class="half" data-loc="' + l.key + '" data-i="' + i + '" data-reveal style="--y:36px;--d:' + i * .1 + 's">' +
        '<div class="photo photo--grade" role="img" aria-label="' + E(ALT[n]) + '">' + img(n, '(min-width:810px) 56vw, 88vw', null) + '</div>' +
        '<div class="plate"><p class="eyebrow">' + E(l.eyebrow) + '</p><h3>' + E(l.concept) + '<span>' + E(l.area) + '</span></h3>' +
        '<ul class="loc__list"><li>' + ico('pin') + '<span>' + E(l.address) + '</span></li><li>' + ico('clock') + '<span>' + E(C.contact.hours.display) + '</span></li></ul>' +
        '<div class="loc__act"><a class="btn" href="' + E(l.phone.telHref) + '">' + ico('phone') + '<span>Pozovi <b>' + E(l.phone.display) + '</b></span></a>' +
        '<a class="btn btn--ghost" href="' + E(l.phone.whatsappHref) + '" target="_blank" rel="noopener">' + ico('wa') + '<span>WhatsApp</span></a></div></div></article>';
    }).join('');
    var halves = $$('.half', host), coarse = matchMedia('(hover: none)'), narrow = matchMedia('(max-width: 809.98px)'), cur = 0;
    var mobileHint = C.sections.locations.hintTouch, deskHint = C.sections.locations.hintHover;
    var ui = $('#split-ui');
    ui.insertAdjacentHTML('beforeend', '<div class="split__nav" aria-hidden="false"><span class="split__count" aria-live="polite"></span>' + halves.map(function (h, i) {
      return '<button type="button" class="split__dot" data-go="' + i + '" aria-label="' + E(C.locations[i].concept + ', ' + C.locations[i].area) + '"></button>';
    }).join('') + '</div>');
    var count = $('.split__count', ui), dots = $$('.split__dot', ui);
    var mark = function (i) {
      cur = i;
      halves.forEach(function (h, k) { h.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      count.textContent = (i + 1) + ' / ' + halves.length;
    };
    var go = function (i) {
      mark(i);
      if (narrow.matches) host.scrollTo({ left: halves[i].offsetLeft - host.offsetLeft - (host.clientWidth - halves[i].offsetWidth) / 2 * 0, behavior: RM ? 'auto' : 'smooth' });
    };
    var setHint = function () { hint.textContent = narrow.matches || coarse.matches ? mobileHint : deskHint; };
    setHint(); narrow.addEventListener('change', setHint); coarse.addEventListener('change', setHint);
    mark(0);
    /* narrow screens: the halves are a snap track, the dot follows the swipe */
    var tick = 0;
    host.addEventListener('scroll', function () {
      if (!narrow.matches || tick) return;
      tick = requestAnimationFrame(function () {
        tick = 0; var w = halves[1].offsetLeft - halves[0].offsetLeft || 1, i = Math.round(host.scrollLeft / w);
        if (i !== cur && i >= 0 && i < halves.length) mark(i);
      });
    }, { passive: true });
    ui.addEventListener('click', function (e) { var d = e.target.closest('[data-go]'); if (d) go(+d.getAttribute('data-go')); });
    /* a tap on the half that is not showing switches to it (taps on its links still work) */
    host.addEventListener('click', function (e) {
      var h = e.target.closest('.half'); if (!h || e.target.closest('a')) return;
      var i = +h.getAttribute('data-i'); if (narrow.matches || coarse.matches) { if (i !== cur) go(i); else if (!narrow.matches) h.classList.toggle('is-active'); }
    });
  })();

  /* ---------- 6. testimonials, offers teaser ---------- */
  (function () {
    $('#quotes').innerHTML = C.testimonials.map(function (t, i) {
      return '<figure class="quote" data-reveal style="--y:28px;--d:' + (i % 2) * .1 + 's"><blockquote><p>' + E(t.quote) + '</p></blockquote><figcaption><b>' + E(t.author) + '</b><span>' + E(t.tag) + '</span></figcaption></figure>';
    }).join('');

    /* teaser: the full offers live on posebna-ponuda.html; every card here links to its place on that page */
    $('#offers').innerHTML = C.offers.map(function (o, i) {
      var p = L.offerPrice(o);
      return '<li class="offer" data-reveal style="--y:28px;--d:' + (i % 4) * .08 + 's"><p class="offer__tag">' + E(o.tag) + '</p>' +
        '<p class="offer__price"><span>' + E(p.eur) + '</span><small>€</small></p>' +
        '<p class="offer__rsd">' + E(p.rsd) + '</p><h3>' + E(o.title) + '</h3><p>' + E(o.description) + '</p>' +
        (o.note ? '<p class="offer__note">' + E(o.note) + '</p>' : '') +
        '<a class="btn btn--light" href="posebna-ponuda.html#' + E(o.slug) + '">Pogledaj ponudu ' + ico('arrow') + '</a></li>';
    }).join('');
  })();

  /* ---------- 7. closing contact: calls (both numbers), WhatsApp, e-mail, Instagram ---------- */
  var contactRows = function () {
    var rows = [];
    PH.forEach(function (p) { rows.push('<li><a href="' + E(p.telHref) + '"><span>Poziv</span><b>' + E(p.display) + '</b></a></li>'); });
    rows.push('<li><a href="' + E(C.contact.emailHref) + '"><span>E-pošta</span><b>' + E(C.contact.email) + '</b></a></li>');
    PH.forEach(function (p) { rows.push('<li><a href="' + E(p.whatsappHref) + '" target="_blank" rel="noopener"><span>WhatsApp</span><b>' + E(p.display) + '</b></a></li>'); });
    if (IG) rows.push('<li><a href="' + E(IG) + '" target="_blank" rel="noopener"><span>Instagram</span><b>@' + E(IG.replace(/\/+$/, '').split('/').pop()) + '</b></a></li>');
    return rows.join('');
  };
  (function () {
    $('#ctabtns').innerHTML = '<a class="btn btn--ink" href="' + E(WA) + '" target="_blank" rel="noopener">' + ico('wa') + 'Piši na WhatsApp</a>' +
      '<a class="btn btn--ghost-ink" href="' + E(PH[0].telHref) + '" data-sheet="call">' + ico('phone') + 'Pozovi</a>';
    $('#ctalist').innerHTML = contactRows();
  })();

  /* ---------- 8. Cenovnik ---------- */
  var P = (function () {
    var tabsEl = $('#ptabs'), plist = $('#plist'), gindex = $('#gindex'), qEl = $('#pq'), xEl = $('#pqx'), hint = $('#phint'), swipe = $('#pswipe'), fold = $('#pfold');
    var minQ = C.search.minChars || 2, T = C.pricing.tabs;
    var st = { tab: T[0].id, q: '', wasOn: false };
    var opened = {};          // remembered open state per group while searching
    var TOUCH = matchMedia('(hover: none)').matches;
    var TXT = { closeAll: 'Zatvori sve', openAll: 'Otvori sve' };

    qEl.placeholder = C.pricing.searchPlaceholder;
    $('#chip-valid').textContent = C.copy['price.validChip'].replace('{date}', C.pricing.validFrom);
    $('#chip-pay').textContent = C.copy['price.payChip'];
    swipe.textContent = C.copy['tabs.swipe'];

    // ONE unified price list: there is no location filter and no location on any row (the exact place is agreed when booking).

    // tabs
    tabsEl.innerHTML = T.map(function (t, i) {
      return '<button type="button" class="tab" role="tab" id="tab-' + t.id + '" aria-controls="pp-' + t.id + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-tab-id="' + t.id + '"><span>' + E(t.label) + '</span><small>' + tabCount(t) + '</small></button>';
    }).join('');

    // panels / groups / rows
    var svcHTML = function (s, std) {
      var p = split(s.price), tags = '';
      if (std && s.highlight && C.pricing.ui.highlightBadge) tags += '<i class="tag tag--hi">' + E(C.pricing.ui.highlightBadge.replace(/^[^\p{L}\p{N}]+/u, '')) + '</i>';
      return '<li class="svc" data-service-id="' + E(s.id) + '" data-s="' + E(norm(s.name + ' ' + (s.description || ''))) + '">' +
        '<span class="svc__n">' + E(s.name) + '</span>' + (s.description ? '<span class="svc__d">' + E(s.description) + '</span>' : '') +
        '<span class="svc__p">' + (s.onRequest || !p[1] ? '<span class="na">' + E(p[0]) + '</span>' : '<b>' + E(p[0]) + '</b><span>' + E(p[1]) + '</span>') + '</span>' +
        '<span class="svc__t">' + tags + '</span></li>';
    };
    plist.innerHTML = T.map(function (t, ti) {
      var groups = t.groups.map(function (g, gi) {
        var gid = t.id + ':' + gi;
        return '<section class="grp" data-group-id="' + gid + '" data-total="' + g.services.length + '" data-gs="' + E(norm(g.title)) + '">' +
          '<h3 class="grp__h"><button type="button" class="grp__b" id="gb-' + t.id + '-' + gi + '" aria-expanded="false" aria-controls="g-' + t.id + '-' + gi + '"><span class="grp__t">' + E(g.title) + '</span><span class="grp__c">' + g.services.length + ' ' + E(C.pricing.ui.groupCountSuffix) + '</span><span class="grp__x">' + ico('plus') + '</span></button></h3>' +
          '<div class="grp__p" id="g-' + t.id + '-' + gi + '"><div class="grp__i"><ul class="svcs">' + g.services.map(function (x) { return svcHTML(x, t.kind === 'standard'); }).join('') + '</ul></div></div></section>';
      }).join('');
      return '<div role="tabpanel" id="pp-' + t.id + '" aria-labelledby="tab-' + t.id + '" data-panel="' + t.id + '"' + (ti ? ' hidden' : '') + '>' +
        (t.note ? '<p class="pnote">' + t.note.html + '</p>' : '') + '<div class="pgroups">' + groups + '</div></div>';
    }).join('');

    var groupEls = function (tab) { return $$('.grp', $('#pp-' + tab)); };
    var syncQ = 0;
    var syncFold = function () {      // 'Zatvori sve' / 'Otvori sve' reflects the groups of the category that is showing
      syncQ = 0;
      var gs = groupEls(st.tab).filter(function (g) { return !g.hidden; });
      if (!gs.length) { fold.hidden = true; return; }
      var any = gs.some(function (g) { return g.classList.contains('is-open'); });
      fold.hidden = false; fold.textContent = any ? TXT.closeAll : TXT.openAll; fold.setAttribute('data-act', any ? 'close' : 'open');
    };
    var setGroup = function (g, open) {
      g.classList.toggle('is-open', open);
      $('.grp__b', g).setAttribute('aria-expanded', open);
      if (!syncQ) syncQ = requestAnimationFrame(syncFold);
    };
    T.forEach(function (t) { var g = groupEls(t.id)[0]; if (g) setGroup(g, true); });

    // footer notes (payment, fine print)
    var icons = ['card', 'euro', 'rata'];
    $('#paynotes').innerHTML = '<li class="notes__t eyebrow" style="grid-column:1/-1;border:0;padding:0">' + E(C.payment.modal.title) + '</li>' + C.payment.modal.paragraphs.map(function (p, i) {
      return '<li class="note" data-reveal style="--d:' + i * .08 + 's"><span class="note__ic">' + ico(icons[i] || 'card') + '</span><p style="grid-column:2;color:var(--text);font-size:16px;line-height:1.5">' + p.html + '</p></li>';
    }).join('');
    $('#pfine').innerHTML = C.pricing.footnote.map(function (n) { return '<p>' + n.html + '</p>'; }).join('');

    // ----- tab switching
    var fades = function () {
      tabsEl.classList.toggle('fade-l', tabsEl.scrollLeft > 6);
      tabsEl.classList.toggle('fade-r', tabsEl.scrollLeft + tabsEl.clientWidth < tabsEl.scrollWidth - 6);
      if (tabsEl.scrollWidth <= tabsEl.clientWidth + 2) swipe.classList.remove('on');
    };
    var seenSwipe = false;
    tabsEl.addEventListener('scroll', function () { fades(); if (!seenSwipe && tabsEl.scrollLeft > 20) { seenSwipe = true; swipe.classList.remove('on'); } }, { passive: true });
    addEventListener('resize', fades);

    var setTab = function (id, focus, noScroll) {
      st.tab = id;
      $$('.tab', tabsEl).forEach(function (b) { var on = b.getAttribute('data-tab-id') === id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus({ preventScroll: true }); });
      $$('[data-panel]', plist).forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== id; });
      var b = $('#tab-' + id);
      if (!noScroll && tabsEl.scrollWidth > tabsEl.clientWidth) tabsEl.scrollTo({ left: b.offsetLeft - (tabsEl.clientWidth - b.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
      buildIndex(); apply();
    };
    // when the category changes while the user is deep inside a long list, land on the top of the new list instead of mid/end of it
    var keepListInView = function () {
      var body = $('.price__body'), top = body.getBoundingClientRect().top, lim = stickyH() + 4;
      if (top < lim) scrollTo({ top: top + scrollY - lim, behavior: 'instant' });
    };
    tabsEl.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) { seenSwipe = true; swipe.classList.remove('on'); setTab(b.getAttribute('data-tab-id')); keepListInView(); history.replaceState(null, '', '#usluge/' + b.getAttribute('data-tab-id')); } });
    tabsEl.addEventListener('keydown', function (e) {
      var ks = { ArrowRight: 1, ArrowLeft: -1, Home: 'h', End: 'e' }; if (!(e.key in ks)) return;
      e.preventDefault(); var i = T.findIndex(function (t) { return t.id === st.tab; });
      i = ks[e.key] === 'h' ? 0 : ks[e.key] === 'e' ? T.length - 1 : (i + ks[e.key] + T.length) % T.length; setTab(T[i].id, true); keepListInView();
    });

    // ----- accordion
    plist.addEventListener('click', function (e) {
      var b = e.target.closest('.grp__b'); if (!b) return;
      var g = b.closest('.grp'), open = !g.classList.contains('is-open'); setGroup(g, open);
      if (st.q) opened[g.getAttribute('data-group-id')] = open;
    });

    // ----- close / open every group of the showing category (a fully open list is ~10 screens long on a phone)
    fold.addEventListener('click', function () {
      var open = fold.getAttribute('data-act') === 'open';
      groupEls(st.tab).forEach(function (g) { if (!g.hidden) { setGroup(g, open); if (st.q) opened[g.getAttribute('data-group-id')] = open; } });
      if (!open) keepListInView();
    });

    // ----- group index (desktop)
    function buildIndex() {
      gindex.innerHTML = groupEls(st.tab).filter(function (g) { return !g.hidden; }).map(function (g) {
        return '<a href="#' + $('.grp__b', g).id + '" data-g="' + g.getAttribute('data-group-id') + '">' + E($('.grp__t', g).textContent) + '<span>' + g.getAttribute('data-vis') + '</span></a>';
      }).join('');
    }
    gindex.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return; e.preventDefault();
      var g = $('[data-group-id="' + a.getAttribute('data-g') + '"]', plist); setGroup(g, true); scrollToEl(g, 8);
    });
    var gio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var id = e.target.getAttribute('data-group-id'); $$('a', gindex).forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-g') === id); }); } });
    }, { rootMargin: '-30% 0px -60% 0px' }) : null;
    if (gio) $$('.grp', plist).forEach(function (g) { gio.observe(g); });

    // ----- filtering (the search box of the list). Same engine as the site search (js/search.js): wording, diacritics, partial words,
    //       several words and the hidden synonym vocabulary ("ozilci od akni", "kako smanjiti obim", "blistava koza"). Nothing is printed as a tag.
    var rows = $$('.svc', plist), grps = $$('.grp', plist);
    var loadAsked = false;
    function plainMatch(r, tokens) {       // used for the instant of the first keystroke, until the search index has arrived
      var s = r.getAttribute('data-s') + ' ' + r.closest('.grp').getAttribute('data-gs');
      return tokens.every(function (t) { return s.indexOf(t) > -1; });
    }
    function apply() {
      var q = norm(st.q.trim()), on = q.length >= minQ, tokens = on ? q.split(/\s+/) : [], perTab = {}, total = 0, eng = null;
      if (on && L.search) {
        if (L.search.isReady()) eng = L.search.services(st.q);
        else if (!loadAsked) { loadAsked = true; L.search.load().then(function () { loadAsked = false; if (st.q) { runSearch(); } }, function () { loadAsked = false; }); }
      }
      rows.forEach(function (r) {
        var ok = true;
        if (on) ok = eng ? !!eng.ids[r.getAttribute('data-service-id')] : plainMatch(r, tokens);
        r.hidden = !ok;
      });
      grps.forEach(function (g) {
        var n = $$('.svc:not([hidden])', g).length, tab = g.getAttribute('data-group-id').split(':')[0];
        g.setAttribute('data-vis', n); g.hidden = n === 0;
        $('.grp__c', g).textContent = n + ' ' + C.pricing.ui.groupCountSuffix;
        perTab[tab] = (perTab[tab] || 0) + n;
        if (on) { var key = g.getAttribute('data-group-id'); setGroup(g, key in opened ? opened[key] : n > 0); }
        else if (st.wasOn) setGroup(g, g.getAttribute('data-group-id').split(':')[1] === '0');
      });
      st.wasOn = on;
      T.forEach(function (t) { var b = $('#tab-' + t.id), n = perTab[t.id] || 0; $('small', b).textContent = n; b.classList.toggle('is-dim', on && n === 0); total += n; });
      xEl.hidden = !st.q;
      if (on && total === 0) hint.textContent = C.search.emptyTemplate.replace('{query}', st.q.trim());
      else if (on) hint.textContent = (perTab[st.tab] || 0) + ' ' + C.pricing.ui.groupCountSuffix;
      else hint.textContent = '';
      buildIndex();
      if (!syncQ) syncQ = requestAnimationFrame(syncFold);
      return { on: on, perTab: perTab, total: total };
    }
    var debounce = 0;
    function runSearch() {
      st.q = qEl.value; clearTimeout(debounce);
      if (!st.q) opened = {};
      var r = apply();
      if (r.on && r.total > 0 && !r.perTab[st.tab]) { var first = T.find(function (t) { return r.perTab[t.id]; }); if (first) setTab(first.id, false, true); }
    }
    qEl.addEventListener('input', function () { st.q = qEl.value; clearTimeout(debounce); debounce = setTimeout(runSearch, C.search.debounceMs || 150); });
    $('#psearch').addEventListener('submit', function (e) { e.preventDefault(); runSearch(); qEl.blur(); });
    xEl.addEventListener('click', function () { qEl.value = ''; st.q = ''; opened = {}; apply(); qEl.focus(); });

    // On a phone the keyboard covers the lower half of the screen, and the results start well below the search box.
    // While the box is focused, park it near the top; once it is dismissed, bring the first result into view.
    var lastDown = 0, lastDownIn = false;
    document.addEventListener('pointerdown', function (e) { lastDown = Date.now(); lastDownIn = !!e.target.closest('#pbox, .price__foot'); }, true);
    qEl.addEventListener('focus', function () { if (TOUCH) scrollToSearch(); });
    qEl.addEventListener('blur', function (e) {
      if (e.relatedTarget || (Date.now() - lastDown < 500 && lastDownIn)) return;     // the user tapped something else in the list: leave the scroll alone
      setTimeout(revealResults, 320);                                                  // after the keyboard has gone
    });
    $('#tosearch').addEventListener('click', function () { scrollToSearch(); qEl.focus({ preventScroll: true }); });

    // ----- scroll helpers (measured from the DOM, so they stay right when the nav or the category bar change size on short screens)
    var navBottom = function () { return $('.nav__pill').getBoundingClientRect().bottom; };
    var stickyH = function () { var tb = $('#tabsbar'); return navBottom() + (getComputedStyle(tb).position === 'sticky' ? tb.offsetHeight : 0); };
    function scrollToEl(el, gap) { var y = el.getBoundingClientRect().top + scrollY - stickyH() - (gap || 12); scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); }
    // land on the category bar and the first group of the chosen list, not on the section heading above them
    function scrollToTabs() { var y = $('#pbox').getBoundingClientRect().top + scrollY - navBottom() - 4; scrollTo({ top: Math.max(0, y), behavior: RM ? 'auto' : 'smooth' }); }
    function scrollToSearch() { var y = $('#psearch').getBoundingClientRect().top + scrollY - navBottom() - 12; scrollTo({ top: Math.max(0, y), behavior: RM ? 'auto' : 'smooth' }); }
    function revealResults() {
      if (norm(st.q.trim()).length < minQ) return;
      var r = $('.svc:not([hidden])', $('#pp-' + st.tab)); if (!r) return;
      var top = r.getBoundingClientRect().top;
      if (top > innerHeight * .6 || top < stickyH()) scrollToEl(r.closest('.grp'), 8);
    }
    function openService(id) {
      var r = $('[data-service-id="' + id + '"]', plist); if (!r) return;
      if (r.hidden) { st.q = ''; qEl.value = ''; opened = {}; apply(); }
      var tab = id.split(':')[0]; if (tab !== st.tab) setTab(tab, false, false);
      setGroup(r.closest('.grp'), true);
      setTimeout(function () { scrollToEl(r, 90); r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash'); }, 60);
    }
    // open ONE group (id "tab:index", e.g. "estetske:5"): switch to its category, open the accordion, scroll to it and highlight it.
    // Used by the "U cenovniku" boxes of the articles and segment pages (index.html?grupa=estetske:5#usluge) and by #usluge/estetske:5
    // an optional service id ("estetske:5:2", the best match of a search) is scrolled to and highlighted instead of the group header
    function openGroup(id, sid) {
      var g = $('[data-group-id="' + id + '"]', plist); if (!g) return false;
      var tab = id.split(':')[0];
      if (g.hidden) { st.q = ''; qEl.value = ''; opened = {}; apply(); }
      if (tab !== st.tab) setTab(tab, false, false);
      setGroup(g, true);
      setTimeout(function () {
        var r = sid ? $('[data-service-id="' + sid + '"]', g) : null;
        if (r) { scrollToEl(r, 90); r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash'); }
        else { scrollToEl(g, 8); g.classList.remove('flash-g'); void g.offsetWidth; g.classList.add('flash-g'); }
      }, 80);
      return true;
    }
    function fromHash(initial) {
      var m = location.hash.match(/^#usluge\/([A-Za-z]+)(?::(\d+))?$/);
      if (!m || !tabById[m[1]]) return;
      if (m[2] != null && $('[data-group-id="' + m[1] + ':' + m[2] + '"]', plist)) { setTimeout(function () { openGroup(m[1] + ':' + m[2]); }, initial === true ? 450 : 0); return; }
      setTab(m[1], false, false);
      setTimeout(scrollToTabs, initial === true ? 400 : 0);     // a deep link lands on the list, not on the section heading
    }
    function fromQuery() {
      var m = location.search.match(/[?&]grupa=([A-Za-z]+:\d+)/), u = location.search.match(/[?&]usluga=([A-Za-z]+:\d+:\d+)/);
      if (m) setTimeout(function () { openGroup(m[1], u && u[1]); }, 450);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-open-tab]');
      if (a) {      // a treatment card: select its category and scroll to the category bar and list, so the tap visibly does something
        e.preventDefault(); var id = a.getAttribute('data-open-tab');
        setTab(id, false, false); history.replaceState(null, '', '#usluge/' + id); scrollToTabs(); return;
      }
      var s = e.target.closest('[data-open-service]');
      if (s) { e.preventDefault(); history.replaceState(null, '', '#usluge'); openService(s.getAttribute('data-open-service')); }
    });
    addEventListener('hashchange', function () { fromHash(); }); fromHash(true); fromQuery();
    apply(); fades();
    if (TOUCH && tabsEl.scrollWidth > tabsEl.clientWidth) swipe.classList.add('on');
    L.price = { setTab: setTab, openService: openService, openGroup: openGroup, apply: apply };
    return L.price;
  })();

  /* ---------- 9. effects ---------- */
  var wipeOn = !document.documentElement.classList.contains('no-wipe') && !RM;
  if (L.initFlutes) L.initFlutes();
  if (L.reveal) L.reveal(document);
  if (L.countUp) $$('.count').forEach(L.countUp);
  if (L.openNow) $$('.open').forEach(L.openNow);
  if (wipeOn) setTimeout(function () { var w = $('.wipe'); if (w) w.remove(); }, 1900);
  document.documentElement.classList.add('ready');      // cancels the head-script reveal fallback
})();
