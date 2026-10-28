/* Lepa Svaki Dan - preview "C": behaviour of the sub pages (blog index filter, segment header video, offers page).
   Everything here is progressive enhancement: the pages are pre-rendered and read without JS.
   Needs js/shell.js (window.LSD_UI). Vanilla JS, no libraries.
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
(function () {
  'use strict';
  var doc = document;
  var UI = window.LSD_UI || { reduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- blog index: segment chips filter / jump ---------- */
  (function blogFilter() {
    var nav = $('#segchips'); if (!nav) return;
    var chips = $$('.segchip', nav), secs = $$('.bseg'), status = $('#blog-status');
    function label(id) { var c = chips.filter(function (x) { return x.dataset.seg === id; })[0]; return c ? c.firstChild.textContent : ''; }
    function apply(id) {
      if (!secs.some(function (s) { return s.dataset.segment === id; })) id = 'sve';
      secs.forEach(function (s) { s.hidden = id !== 'sve' && s.dataset.segment !== id; });
      chips.forEach(function (c) { if (c.dataset.seg === id) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
      var shown = secs.filter(function (s) { return !s.hidden; });
      var n = shown.reduce(function (a, s) { return a + $$('.acard', s).length; }, 0);
      status.textContent = id === 'sve' ? '' : 'Prikazano: ' + label(id) + ', ' + n + ' ' + (n === 1 ? 'tekst' : n < 5 ? 'teksta' : 'tekstova') + '.';
      return id;
    }
    function toChips() { var y = nav.getBoundingClientRect().top + scrollY - 96; if (y < scrollY) scrollTo({ top: Math.max(0, y), behavior: UI.reduce ? 'auto' : 'smooth' }); }
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('.segchip'); if (!a) return;
      e.preventDefault();
      var id = apply(a.dataset.seg);
      try { history.replaceState(null, '', id === 'sve' ? location.pathname : '#seg-' + id); } catch (x) { }
      toChips();
    });
    function fromHash() {
      var m = decodeURIComponent(location.hash || '').match(/^#seg-([a-z]+)$/);
      var id = apply(m ? m[1] : 'sve');
      if (m && id !== 'sve') setTimeout(function () { var y = nav.getBoundingClientRect().top + scrollY - 96; scrollTo({ top: Math.max(0, y), behavior: 'auto' }); }, 30);
    }
    addEventListener('hashchange', fromHash);
    fromHash();
  })();

  /* ---------------------------------------------------------------- segment header: video-ready ----------
     Markup: <section class="shero" data-video="path.mp4" data-video-webm="path.webm">. Nothing is downloaded until the header is
     on screen, and never with reduced motion, data saver or a connection slower than 4g. The poster image stays under the video
     as the fallback (no video, error, autoplay refused). A pause button is shown while the video runs (WCAG 2.2.2). */
  function heroVideo(hero) {
    var src = hero.getAttribute('data-video'); if (!src || hero.__vid) return;
    if (UI.reduce) return;
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c && (c.saveData || (c.effectiveType && c.effectiveType !== '4g'))) return;
    hero.__vid = true;
    var btn = $('.shero__toggle', hero), lbl = btn && $('.shero__lbl', btn), vid = null, userPaused = false, visible = false;
    function fail() { hero.classList.remove('is-playing'); if (vid) { vid.remove(); vid = null; } if (btn) btn.hidden = true; }
    function build() {
      vid = doc.createElement('video');
      vid.className = 'shero__video';
      vid.muted = true; vid.defaultMuted = true; vid.loop = true; vid.playsInline = true; vid.preload = 'auto'; vid.disablePictureInPicture = true;
      vid.setAttribute('muted', ''); vid.setAttribute('playsinline', ''); vid.setAttribute('aria-hidden', 'true'); vid.tabIndex = -1;
      var webm = hero.getAttribute('data-video-webm'), last;
      if (webm) { var w = doc.createElement('source'); w.src = webm; w.type = 'video/webm'; vid.appendChild(w); }
      last = doc.createElement('source'); last.src = src; last.type = 'video/mp4'; vid.appendChild(last);
      last.addEventListener('error', fail);
      vid.addEventListener('playing', function () { hero.classList.add('is-playing'); if (btn) btn.hidden = false; });
      $('.shero__media', hero).appendChild(vid);
      var p = vid.play(); if (p && p.catch) p.catch(function () { /* autoplay refused: the poster simply stays */ });
    }
    function setPaused(on) {
      userPaused = on;
      if (btn) { btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', on ? 'Pokreni video u zaglavlju' : 'Pauziraj video u zaglavlju'); if (lbl) lbl.textContent = on ? 'Pokreni video' : 'Pauziraj video'; }
      if (vid) { if (on) vid.pause(); else if (visible) vid.play(); }
    }
    if (btn) btn.addEventListener('click', function () { setPaused(!userPaused); });
    function sync() { if (!vid) return; if (visible && !userPaused && !doc.hidden) { var p = vid.play(); if (p && p.catch) p.catch(function () { }); } else vid.pause(); }
    doc.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !vid) { build(); } sync(); }, { threshold: .15 }).observe(hero);
    } else { visible = true; build(); }
  }
  $$('.shero[data-video]').forEach(heroVideo);
  if (window.LSD_UI) window.LSD_UI.heroVideo = heroVideo; // for tests / manual use

  /* ---------------------------------------------------------------- posebna ponuda: render from window.LSD_CONTENT.offers ---------- */
  (function offers() {
    var host = $('#offers-list'), V = window.LSD_OFFERS_VIEW, C = window.LSD_CONTENT;
    if (!host || !V || !C || !C.offers) return;
    var s = V.sig(C.offers); if (host.getAttribute('data-sig') === s) return; // pre-rendered copy is current
    host.innerHTML = V.cards(C.offers); host.setAttribute('data-sig', s);
    var t = location.hash && doc.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView();
  })();
})();
