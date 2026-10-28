/* Lepa Svaki Dan - preview "C": shared shell behaviour for EVERY page (home, blog, articles, segments, offers).
   Mobile menu (focus trap, ESC, aria-expanded, scroll lock), nav state on scroll, current-section marker (home), action bar hiding,
   scroll reveal, touch "settle" of photo cards, footer year. Vanilla JS, no libraries.
   Exposes window.LSD_UI = { once, esc, reduce, canHover, barHold } for js/main.js and js/pages.js.
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover: hover)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function once(sel, opts, fn) {
    var els = typeof sel === 'string' ? $$(sel) : sel; if (!els.length) return;
    if (!hasIO) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { fn(x.target); io.unobserve(x.target); } }); }, opts);
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------- action bar: several reasons to hide it ---------- */
  var bar = $('#bar'), holds = {};
  function barHold(name, on) { holds[name] = !!on; if (bar) bar.classList.toggle('is-hidden', Object.keys(holds).some(function (k) { return holds[k]; })); }

  window.LSD_UI = { once: once, esc: esc, reduce: reduce, canHover: canHover, barHold: barHold };

  /* ---------------------------------------------------------------- mobile menu ---------- */
  (function menuSheet() {
    var burger = $('#burger'), menu = $('#menu'); if (!burger || !menu) return;
    menu.hidden = false;
    var inertEls = [$('main'), $('footer'), $('#bar')].filter(Boolean);
    function setInert(on) { inertEls.forEach(function (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }); }
    function open() {
      menu.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Zatvori');
      html.classList.add('menu-open'); setInert(true);
      setTimeout(function () { var f = $('.menu__links a', menu); if (f) f.focus({ preventScroll: true }); }, 60);
    }
    function close(ret) {
      menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Meni');
      html.classList.remove('menu-open'); setInert(false); if (ret) burger.focus();
    }
    burger.addEventListener('click', function () { burger.getAttribute('aria-expanded') === 'true' ? close(true) : open(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    doc.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(true); return; }
      if (e.key !== 'Tab') return;
      var f = [burger].concat($$('a, button', menu)).filter(function (x) { return x.offsetParent !== null || x === burger; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // same query as the desktop navigation in css/style.css (wide screens, or a precise pointer from 1100px)
    matchMedia('(min-width: 1360px), (min-width: 1100px) and (pointer: fine)').addEventListener('change', function (m) { if (m.matches) close(false); });
  })();

  /* ---------------------------------------------------------------- contact sheet: Pozovi / WhatsApp offer BOTH numbers ----------
     Any element with data-sheet="tel" or "wa" (mobile action bar, menu, footer) opens a small sheet with two big buttons. The numbers are
     real links in the markup (built from the data); without JS the bar buttons simply lead to the footer contacts. */
  (function contactSheet() {
    var dlg = $('#contact-sheet'); if (!dlg || typeof dlg.showModal !== 'function') return;
    var title = $('#contact-sheet-t', dlg), lists = $$('.sheet__big', dlg), opener = null;
    var T = { tel: 'Pozovite nas', wa: 'Pišite nam na WhatsApp' };
    function open(mode) {
      lists.forEach(function (l) { l.hidden = l.getAttribute('data-mode') !== mode; });
      title.textContent = T[mode] || T.tel;
      dlg.showModal(); html.style.overflow = 'hidden';
    }
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('[data-sheet]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); opener = a; open(a.getAttribute('data-sheet'));
    });
    $('#contact-sheet-x').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); else if (e.target.closest('a')) setTimeout(function () { if (dlg.open) dlg.close(); }, 50); });
    dlg.addEventListener('close', function () { if (!html.classList.contains('sheet-open')) html.style.overflow = ''; if (opener && opener.offsetParent !== null) opener.focus({ preventScroll: true }); });
  })();

  /* ---------------------------------------------------------------- nav shadow on scroll ---------- */
  (function scrollState() {
    var ticking = false;
    function frame() { ticking = false; html.classList.toggle('is-scrolled', scrollY > 8); }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  })();

  /* ---------------------------------------------------------------- observers ---------- */
  (function observers() {
    var t0 = performance.now();
    function sweep() { // fast flings / anchor jumps can skip elements entirely: whatever is already above the viewport is released
      $$('.rv:not(.in)').forEach(function (e) { if (e.getBoundingClientRect().bottom < 0) e.classList.add('rv-now', 'in'); });
    }
    once('.rv', { threshold: .12, rootMargin: '0px 0px -6% 0px' }, function (el) {
      if (performance.now() - t0 < 700) el.classList.add('rv-now'); // already on screen at load: show at once, no fade
      el.classList.add('in');
      sweep();
    });
    // touch: photo cards settle (zoom-out) once when they cross the viewport centre; hover devices do it on hover
    if (!canHover) once('.work', { threshold: .55 }, function (el) { el.classList.add('is-settled'); });
    // footer CTA seal: pause the rotation off screen; hide the mobile action bar while the footer is on screen
    var cta = $('.cta');
    if (cta && hasIO) new IntersectionObserver(function (en) { cta.classList.toggle('is-paused', !en[0].isIntersecting); }).observe(cta);
    var foot = $('.foot');
    if (bar && foot && hasIO) new IntersectionObserver(function (en) { barHold('foot', en[0].isIntersecting); }, { rootMargin: '0px 0px -12% 0px' }).observe(foot);
    // nav: current section (home page only: the links that are in-page #anchors)
    var links = $$('.nav__links a[href^="#"]'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if (hasIO && links.length) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          var a = map[x.target.id]; if (!a) return;
          if (x.isIntersecting) { links.forEach(function (l) { l.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); } else a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-42% 0px -52% 0px' });
      Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
    }
    html.classList.add('js-live'); // observers are running: the head-script safety net can stand down
  })();

  var yr = $('#year'); if (yr) yr.textContent = Math.max(2026, new Date().getFullYear());
})();

/* BACK TO TOP (FAB): round button, fixed bottom right. Appears after scrolling about one screen, sits above the mobile action bar
   (it measures the bar, so it also follows when the bar slides away), smooth scroll unless reduced motion is on.
   Tune: BAR (selector of the fixed action bar), Z (stacking), BG / FG / RING (colours) in the next line. */
(function () {
  if (document.getElementById('fab-top')) return;
  var BAR = '#bar', Z = 45, BG = '#5A5758', FG = '#ffffff', RING = 'rgba(233,195,149,.85)';
  var css = '.fab-top{position:fixed;z-index:' + Z + ';right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));width:48px;height:48px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;background:' + BG + ';color:' + FG + ';box-shadow:inset 0 0 0 1px ' + RING + ',0 8px 22px -6px rgba(90,87,88,.5);cursor:pointer;opacity:0;visibility:hidden;transform:translateY(calc(14px - var(--lift,0px))) scale(.9);transition:opacity .25s ease,transform .35s cubic-bezier(.22,1,.36,1),visibility 0s linear .35s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
    '.fab-top.is-on{opacity:1;visibility:visible;transform:translateY(calc(0px - var(--lift,0px))) scale(1);transition:opacity .25s ease,transform .35s cubic-bezier(.22,1,.36,1),visibility 0s}' +
    '.fab-top svg{display:block;width:22px;height:22px;transition:transform .3s cubic-bezier(.22,1,.36,1)}' +
    '.fab-top:focus-visible{outline:2px solid ' + BG + ';outline-offset:3px;box-shadow:inset 0 0 0 1px ' + RING + ',0 0 0 5px #fff,0 8px 22px -6px rgba(90,87,88,.5)}' +
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
