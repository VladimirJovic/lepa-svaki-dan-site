/* pages.js: behaviour of the sub pages (blog, articles, segments, Posebna ponuda). No dependencies.
   Pripremio ECHOSYSTEM-MOTHER AGENCY.

   1. HERO VIDEO ("header video per segment"). Every segment page has a full-width hero with a poster image. To switch a segment to video,
      give its hero a data-video attribute (and optionally data-video-m for phones, portrait crop):
          <section class="shero" data-video="../assets/video/dermatologija.mp4" data-video-m="../assets/video/dermatologija-m.mp4"> ... </section>
      (in the build script: CFG.heroVideos, one line per segment). The video is a muted, looping, inline autoplay layer ABOVE the poster:
        - it is only requested on a good connection (no Save-Data, not 2g/3g, downlink >= 1.5 Mbit/s when the browser tells us),
        - never with prefers-reduced-motion (the poster stays, nothing plays),
        - it starts after the page is idle, so the poster is what paints first (LCP) and the video never delays the text,
        - it fades in only when it is really playing; if autoplay is refused or the file fails, the poster simply stays,
        - it pauses when the hero is off screen or the tab is hidden.
   2. BLOG chip bar: marks the segment in view (scroll spy) and keeps its chip in sight; without JS the chips are plain jump links.
   3. Scroll reveal (motion.js) and the "ready" flag that cancels the reveal safety net.                                                    */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var L = window.LSD = window.LSD || {};
  var RM = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. hero video ---------- */
  function goodConnection() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    if (c.saveData) return false;
    if (c.effectiveType && /^(slow-2g|2g|3g)$/.test(c.effectiveType)) return false;
    if (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 1.5) return false;
    return true;
  }
  function heroVideo(hero) {
    var narrow = matchMedia('(max-width: 809.98px)').matches;
    var src = (narrow && hero.getAttribute('data-video-m')) || hero.getAttribute('data-video');
    var host = $('.shero__media', hero);
    if (!src || !host || RM.matches || !goodConnection()) return;
    var v = document.createElement('video');
    v.className = 'shero__video';
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('loop', '');
    v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
    v.disablePictureInPicture = true; v.setAttribute('disableremoteplayback', '');
    v.preload = 'auto';
    var img = $('img', host); if (img && img.currentSrc) v.poster = img.currentSrc;
    var drop = function () { if (v.parentNode) v.parentNode.removeChild(v); hero.classList.remove('is-video'); };
    v.addEventListener('playing', function () { hero.classList.add('is-video'); });
    v.addEventListener('error', drop);
    v.src = src;
    host.appendChild(v);
    var p = v.play(); if (p && p.catch) p.catch(drop);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { if (v.paused && !document.hidden) v.play().catch(function () {}); } else v.pause(); }); }, { threshold: .02 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) v.pause(); else if (v.parentNode) v.play().catch(function () {}); });
    var rm = function () { if (RM.matches) { v.pause(); drop(); } };
    if (RM.addEventListener) RM.addEventListener('change', rm);
  }
  $$('.shero[data-video]').forEach(function (hero) {
    var go = function () { heroVideo(hero); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 900);
  });

  /* ---------- 2. blog chip bar ---------- */
  (function () {
    var bar = $('[data-chipbar]'); if (!bar) return;
    var row = $('.chipbar__in', bar), chips = {}, secs = $$('[data-seg]');
    $$('a[href^="#"]', bar).forEach(function (a) { chips[a.getAttribute('href').slice(1)] = a; });
    var fades = function () {
      row.classList.toggle('fade-l', row.scrollLeft > 6);
      row.classList.toggle('fade-r', row.scrollLeft + row.clientWidth < row.scrollWidth - 6);
    };
    row.addEventListener('scroll', fades, { passive: true }); addEventListener('resize', fades); fades();
    var mark = function (id) {
      Object.keys(chips).forEach(function (k) { if (k === id) chips[k].setAttribute('aria-current', 'true'); else chips[k].removeAttribute('aria-current'); });
      var a = id && chips[id]; if (a && row.scrollWidth > row.clientWidth) row.scrollTo({ left: a.offsetLeft - (row.clientWidth - a.offsetWidth) / 2, behavior: RM.matches ? 'auto' : 'smooth' });
    };
    /* scroll spy: the current segment is the last one whose top has passed 35 % of the viewport; none while the page head is still in view */
    var tick = 0, cur = null;
    var spy = function () {
      tick = 0; var line = innerHeight * .35, id = null;
      secs.forEach(function (s) { if (s.getBoundingClientRect().top <= line) id = s.id; });
      if (id !== cur) { cur = id; mark(id); }
    };
    addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(spy); }, { passive: true });
    addEventListener('resize', spy); spy();
    addEventListener('hashchange', function () { var id = location.hash.slice(1); if (chips[id]) mark(id); });
  })();

  /* ---------- 3. reveal + ready ---------- */
  if (L.reveal) L.reveal(document);
  document.documentElement.classList.add('ready');
})();
