/* =====================================================================================================
   LEPA SVAKI DAN · "A" preview · SHARED SHELL behaviour (vanilla JS, no libraries)
   Loaded on every page (home, blog, articles, segments, posebna ponuda). Pripremio ECHOSYSTEM-MOTHER AGENCY

   - overlays: mobile menu (full-screen sheet) and sheets, with focus trap, ESC, aria-expanded, scroll lock, inert background
   - booking / phone sheet with both numbers (every [data-book] control), nav (stuck / hides on scroll down / scroll spy on the home),
     in-page anchors, mobile action bar, reveal on scroll, footer year, text-page table of contents,
     header video of the segment pages (data-video, see initHeroVideo)
   - exposes window.LSDShell for js/app.js (home only)
   ===================================================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = function (fn) { var t = false; return function () { if (t) return; t = true; requestAnimationFrame(function () { t = false; fn(); }); }; };

  /* ---------------------------------------------------------------- overlays (menu, sheets) */
  var FOC = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  var ov = null;
  var inertTargets = function () { return [$('#nav'), $('#main'), $('.foot'), $('#abar'), $('#giftCard')].filter(Boolean); };   // #giftCard: the personalised offer (js/personalize.js) sits outside the page, it must not be reachable behind a dialog
  function lockScroll(on) {
    if (on) {
      var sw = window.innerWidth - root.clientWidth;
      root.style.overflow = 'hidden';
      if (sw > 0) root.style.paddingRight = sw + 'px';
    } else { root.style.overflow = ''; root.style.paddingRight = ''; }
  }
  function openOv(el, trigger) {
    if (ov) closeOv(true);
    ov = { el: el, trigger: trigger };
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('is-open');
    lockScroll(true);
    root.classList.add('ov-open');                                   // CSS: the gift card and other floating things step aside while any overlay is open
    inertTargets().forEach(function (n) { n.inert = true; });
    if (trigger && trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new Event('lsd:overlay-opened'));
    var f = $$(FOC, el).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
    var first = $('[data-autofocus]', el) || f.find(function (n) { return !n.hasAttribute('data-close') || n.classList.contains('menu__close'); }) || f[0];
    setTimeout(function () { if (first) first.focus({ preventScroll: true }); }, 30);
  }
  function closeOv(quick) {
    if (!ov) return;
    var o = ov; ov = null;
    o.el.classList.remove('is-open');
    lockScroll(false);
    root.classList.remove('ov-open');
    inertTargets().forEach(function (n) { n.inert = false; });
    if (o.trigger && o.trigger.hasAttribute('aria-expanded')) o.trigger.setAttribute('aria-expanded', 'false');
    setTimeout(function () { if (!o.el.classList.contains('is-open')) o.el.hidden = true; }, quick || RM ? 0 : 420);
    if (o.trigger && !quick) o.trigger.focus({ preventScroll: true });
    document.dispatchEvent(new Event('lsd:overlay-closed'));   // js/app.js waits for it before it shows the one-time price-list notice
  }
  document.addEventListener('keydown', function (e) {
    if (!ov) return;
    if (e.key === 'Escape') { e.preventDefault(); closeOv(); return; }
    if (e.key !== 'Tab') return;
    var f = $$(FOC, ov.el).filter(function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    else if (!ov.el.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
  });
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close]');
    if (!c || !ov || !ov.el.contains(c)) return;
    var href = c.getAttribute && c.getAttribute('href');
    closeOv(!!href);
    if (href && href.charAt(0) === '#') {
      e.preventDefault();
      var t = $(href);
      if (t) setTimeout(function () { t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', href); focusTarget(t); }, 60);
    }
  });
  // in-page links must also move keyboard focus (skip link, nav), otherwise the next Tab continues from the top of the page
  function focusTarget(t) {
    if (!t.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  }
  function scrollToEl(el, offset) {
    var y = el.getBoundingClientRect().top + window.scrollY - (offset || 0);
    window.scrollTo({ top: Math.max(0, y), behavior: RM ? 'auto' : 'smooth' });
  }
  var burger = $('.burger');
  if (burger) burger.addEventListener('click', function () { openOv($('#menu'), burger); });
  window.addEventListener('resize', function () { if (ov && ov.el.id === 'menu' && window.innerWidth >= 1240) closeOv(true); });   // the burger header ends at 1239px

  /* ---------------------------------------------------------------- booking / phone sheet
     Every booking CTA opens this small sheet with BOTH numbers as big buttons, so nobody is sent silently to one of them.
     data-book="" a call and a WhatsApp button per number · "call" two phone buttons · "wa" two WhatsApp buttons · data-pkg adds the package to the WhatsApp text.
     (The package sentence is the same one js/offers.js uses: keep in sync.) The numbers and names are in the sheet's markup (built from the contact data). */
  var pkgText = function (pkg) { return 'Zdravo, zanima me paket „' + pkg + '“ i želim da zakažem termin.'; };
  /* data-wa-msg: a whole ready message instead of the package sentence (the personalised offer of js/personalize.js uses it); data-book-label: the line shown above the numbers;
     data-return: id of the element that gets the focus back when the sheet closes (the trigger itself may be gone by then) */
  var BOOK_T = { '': 'Zakaži termin', call: 'Pozovite nas', wa: 'Pišite nam na WhatsApp' };
  function openBook(trigger, mode, pkg, msg, label) {
    var list = $('#bookList'), pk = $('#bookPkg');
    if (!list) return;
    list.setAttribute('data-mode', mode);
    $$('li', list).forEach(function (li) {
      var tel = $('.bbtn--tel', li), wa = $('.bbtn--wa', li), num = li.getAttribute('data-num'), name = li.getAttribute('data-name');
      var set = function (a, m, s) { $('.bbtn__m', a).textContent = m; $('.bbtn__s', a).textContent = s; };
      if (mode === 'call') set(tel, num, name);
      else if (mode === 'wa') set(wa, 'WhatsApp', name);
      else { set(tel, 'Pozovi', num); set(wa, 'WhatsApp', num); }
      var base = 'https://wa.me/' + wa.getAttribute('data-wa');
      wa.href = msg ? base + '?text=' + encodeURIComponent(msg) : pkg ? base + '?text=' + encodeURIComponent(pkgText(pkg)) : base;
    });
    $('#bookTitle').textContent = BOOK_T[mode] || BOOK_T[''];
    pk.hidden = !(pkg || label); pk.textContent = label || (pkg ? 'Paket: ' + pkg : '');
    openOv($('#bookSheet'), trigger);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-book]');
    if (!b) return;
    e.preventDefault();
    var back = b.getAttribute('data-return');
    openBook(back ? $('#' + back) : b.closest('#menu') ? null : b, b.getAttribute('data-book') || '', b.dataset.pkg || '', b.getAttribute('data-wa-msg') || '', b.getAttribute('data-book-label') || '');
  });

  /* ---------------------------------------------------------------- nav: stuck, hide on scroll down, scroll spy */
  var nav = $('#nav'), lastY = window.scrollY, navHidden = false;
  function setSticky() { root.style.setProperty('--sticky-top', navHidden ? '0px' : (nav.offsetHeight + 4) + 'px'); }
  var onScroll = raf(function () {
    var y = window.scrollY, d = y - lastY;
    nav.classList.toggle('is-stuck', y > 40);
    if (y < 160) navHidden = false;
    else if (d > 6) navHidden = true;
    else if (d < -6) navHidden = false;
    nav.classList.toggle('is-hidden', navHidden && !ov);
    setSticky();
    lastY = y;
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', setSticky);
  nav.addEventListener('focusin', function () { navHidden = false; nav.classList.remove('is-hidden'); setSticky(); });
  setSticky(); onScroll();
  // anchors: never leave the target under the (re-appearing) nav
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || a.hasAttribute('data-close')) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var t = $(id);
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', id);
    focusTarget(t);
  });

  if ('IntersectionObserver' in window) {
    // scroll spy: only on the home, where the nav items are in-page sections (data-spy maps the two page links to their teaser sections)
    var links = {};
    $$('.nav__pill a').forEach(function (a) {
      var h = a.getAttribute('href'), k = a.getAttribute('data-spy') || (h.charAt(0) === '#' ? h.slice(1) : '');
      if (k) links[k] = a;
    });
    if ($('#top') && Object.keys(links).length) {
      var spy = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          Object.keys(links).forEach(function (k) { links[k].classList.toggle('is-active', k === x.target.id); });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      Object.keys(links).forEach(function (k) { var s = document.getElementById(k); if (s) spy.observe(s); });
      spy.observe($('#top'));
    }
    // hide the mobile action bar while a closing contact block / the footer is on screen
    var bar = $('#abar'), offEls = $$('[data-abar-off], .foot');
    if (bar && offEls.length) {
      var barObs = new IntersectionObserver(function (en) {
        en.forEach(function (x) { x.target.__vis = x.isIntersecting; });
        bar.classList.toggle('is-off', offEls.some(function (n) { return n.__vis; }));
      }, { threshold: 0.2 });
      offEls.forEach(function (n) { barObs.observe(n); });
    }
  }

  /* ---------------------------------------------------------------- reveal on scroll (progressive enhancement: without JS everything is visible) */
  var revealIO = null;
  function setupReveal() {
    if (!('IntersectionObserver' in window) || RM) return;
    // whatever is already on screen (or scrolled past, e.g. a #hash landing) is shown at once: no hide-then-fade flash when JS arrives late
    var vh = window.innerHeight, all = $$('.rv');
    all.forEach(function (n) { if (n.getBoundingClientRect().top < vh * 0.94) n.classList.add('is-in'); });
    root.classList.add('rv-on');
    revealIO = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        // intersecting now, or already scrolled past (fast fling / jump link): never leave it invisible
        if (x.isIntersecting || x.boundingClientRect.bottom < 0) { x.target.classList.add('is-in'); revealIO.unobserve(x.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    all.forEach(function (n) { if (!n.classList.contains('is-in')) revealIO.observe(n); });
    // failsafe: anything on screen that the observer has not delivered yet is revealed (background tab, restored page, slow main thread)
    var sweep = function () { var h = window.innerHeight; $$('.rv:not(.is-in)').forEach(function (n) { var r = n.getBoundingClientRect(); if (r.bottom > 0 && r.top < h && r.width) n.classList.add('is-in'); }); };
    setTimeout(sweep, 2200);
    window.addEventListener('pageshow', sweep);
    window.addEventListener('beforeprint', function () { $$('.rv').forEach(function (n) { n.classList.add('is-in'); }); });
  }

  /* ---------------------------------------------------------------- header video of the segment pages
     <section class="shero" data-video="mp4 url" data-video-webm="webm url (optional)">. With both attributes empty nothing happens: the poster photo stays.
     The video is created and loaded only when ALL of these hold: a file is set, no reduced-motion preference, no data saver, not a slow (2g/3g)
     connection, and the page has finished loading. It is muted, looped, inline, paused while off screen or in a background tab, and the
     poster photo stays underneath as the fallback. A visible pause button is shown once it plays (moving content longer than 5 s needs one). */
  function initHeroVideo() {
    var hero = $('.shero[data-video], .shero[data-video-webm]');
    if (!hero || hero.__vid) return;
    var mp4 = hero.getAttribute('data-video'), webm = hero.getAttribute('data-video-webm');
    if (!mp4 && !webm) return;
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (RM || (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '') || c.effectiveType === '3g'))) return;
    var media = $('.shero__media', hero), poster = $('.shero__poster', hero), btn = $('.shero__pp', hero);
    var v = document.createElement('video');
    v.className = 'shero__video';
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.tabIndex = -1; v.disablePictureInPicture = true;
    if (poster) v.poster = poster.currentSrc || poster.src;
    [['video/webm', webm], ['video/mp4', mp4]].forEach(function (p) {
      if (!p[1]) return;
      var s = document.createElement('source'); s.src = p[1]; s.type = p[0]; v.appendChild(s);
    });
    media.appendChild(v);
    hero.__vid = v;
    var userPaused = false, inView = true;
    function sync() {
      if (userPaused || !inView || document.hidden) { v.pause(); return; }
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    }
    v.addEventListener('playing', function () { hero.classList.add('has-video'); if (btn) btn.hidden = false; });
    if (btn) btn.addEventListener('click', function () {
      userPaused = !userPaused;
      btn.classList.toggle('is-paused', userPaused);
      btn.setAttribute('aria-label', btn.getAttribute(userPaused ? 'data-play' : 'data-pause'));
      sync();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (v.readyState) sync(); }, { threshold: 0.15 }).observe(hero);
    document.addEventListener('visibilitychange', function () { if (v.readyState) sync(); });
    v.load(); sync();
  }
  function startVideo() { setTimeout(initHeroVideo, 300); }
  if (document.readyState === 'complete') startVideo(); else window.addEventListener('load', startVideo);

  /* ---------------------------------------------------------------- small things */
  var year = $('#year'); if (year) year.textContent = Math.max(2026, new Date().getFullYear());
  // table of contents of long texts: closed on phones (it would push the text down), open from tablet landscape up
  if (window.matchMedia('(min-width:1024px)').matches) $$('details.toc').forEach(function (d) { d.open = true; });

  // after every deferred script has rendered its cards (js/offers.js, js/app.js), so those cards are observed too
  if (document.readyState === 'complete') setupReveal(); else document.addEventListener('DOMContentLoaded', setupReveal);

  window.LSDShell = { openOv: openOv, closeOv: closeOv, isOpen: function () { return !!ov; }, focusTarget: focusTarget, scrollToEl: scrollToEl, raf: raf, RM: RM, initHeroVideo: initHeroVideo,
    reveal: function (nodes) { if (!revealIO) return; nodes.forEach(function (n) { if (!n.classList.contains('is-in')) revealIO.observe(n); }); } };
})();

/* BACK TO TOP (FAB): round button, fixed bottom right. Appears after scrolling about one screen, sits above the mobile action bar
   (it measures the bar, so it also follows when the bar slides away), smooth scroll unless reduced motion is on.
   Tune: BAR (selector of the fixed action bar), Z (stacking), BG / FG / RING (colours) in the next line. */
(function () {
  if (document.getElementById('fab-top')) return;
  var BAR = '#abar', Z = 140, BG = '#E5E2D9', FG = '#403C3D', RING = 'rgba(182,120,81,.6)';
  var css = '.fab-top{position:fixed;z-index:' + Z + ';right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));width:48px;height:48px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;background:' + BG + ';color:' + FG + ';box-shadow:inset 0 0 0 1px ' + RING + ',0 8px 22px -6px rgba(90,87,88,.28);cursor:pointer;opacity:0;visibility:hidden;transform:translateY(calc(14px - var(--lift,0px))) scale(.9);transition:opacity .25s ease,transform .35s cubic-bezier(.22,1,.36,1),visibility 0s linear .35s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
    '.fab-top.is-on{opacity:1;visibility:visible;transform:translateY(calc(0px - var(--lift,0px))) scale(1);transition:opacity .25s ease,transform .35s cubic-bezier(.22,1,.36,1),visibility 0s}' +
    '.fab-top svg{display:block;width:22px;height:22px;transition:transform .3s cubic-bezier(.22,1,.36,1)}' +
    '.fab-top:focus-visible{outline:2px solid ' + FG + ';outline-offset:3px;box-shadow:inset 0 0 0 1px ' + RING + ',0 0 0 5px #F4F2E9,0 8px 22px -6px rgba(90,87,88,.28)}' +
    '@media (hover:hover){.fab-top:hover svg{transform:translateY(-2px)}}' +
    '@media (min-width:1024px){.fab-top{right:max(24px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom))}}' +
    '@media (prefers-reduced-motion:reduce){.fab-top,.fab-top.is-on,.fab-top svg{transition:none}}' +
    '@media print{.fab-top{display:none}}';
  var st = document.createElement('style'); st.id = 'fab-top-css'; st.textContent = css; document.head.appendChild(st);
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'fab-top'; b.className = 'fab-top'; b.title = 'Nazad na vrh';
  b.setAttribute('aria-label', 'Nazad na vrh'); b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1;
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
  document.body.appendChild(b);
  var on = false, queued = false, later = 0;
  function lift() {
    var y = 0, bar = document.querySelector(BAR);
    if (bar) {
      var cs = getComputedStyle(bar);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') {
        var r = bar.getBoundingClientRect();
        if (r.height > 0 && r.top < innerHeight - 2 && parseFloat(cs.opacity || '1') > 0.5) y = Math.max(0, innerHeight - r.top);
      }
    }
    b.style.setProperty('--lift', Math.round(y) + 'px');
  }
  function update() {
    queued = false;
    var show = (window.pageYOffset || document.documentElement.scrollTop || 0) > Math.min(700, innerHeight * 0.7);
    if (show !== on) { on = show; b.classList.toggle('is-on', show); b.tabIndex = show ? 0 : -1; b.setAttribute('aria-hidden', show ? 'false' : 'true'); }
    lift();
    clearTimeout(later); later = setTimeout(lift, 380);   /* the bar animates away/back; measure again when it settled */
  }
  function req() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  b.addEventListener('click', function (e) {
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    if (e.detail === 0) {   /* keyboard: hand the focus back to the top of the page */
      var h = document.querySelector('h1');
      if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); setTimeout(function () { h.focus({ preventScroll: true }); }, calm ? 0 : 500); }
    }
  });
  update();
})();
