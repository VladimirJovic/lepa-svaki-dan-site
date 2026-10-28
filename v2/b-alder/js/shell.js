/* shell.js: behaviour of the shared shell (header, full-screen menu, mobile action bar, call sheet, footer) on EVERY page.
   The shell markup itself is written by _tools/b/build-pages.mjs, identical on all pages. The search overlay is js/search.js.
   No dependencies. Pripremio ECHOSYSTEM-MOTHER AGENCY. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var L = window.LSD = window.LSD || {};

  /* ---------- one modal helper for the menu, the call sheet and the search overlay ----------
     opens a dialog: the page behind it goes inert, scroll is locked, Tab stays inside, ESC closes, focus returns to the opener.
     opts: { focus: selector | function returning the element to focus first, onOpen, onClose } */
  L.modal = function (root, opts) {
    opts = opts || {};
    var opener = null, isOpen = false;
    var behind = function () { return [$('#main'), $('.nav'), $('#footer'), $('#bar'), $('.skip')].filter(Boolean); };
    var focusables = function () {
      return $$('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', root).filter(function (n) { return !n.closest('[hidden]') && (n.offsetParent !== null || getComputedStyle(n).position === 'fixed'); });
    };
    function open(from) {
      if (isOpen) return; isOpen = true;
      opener = from || document.activeElement;
      root.classList.add('is-open');
      document.documentElement.classList.add('lock');
      behind().forEach(function (n) { n.inert = true; });
      var t = typeof opts.focus === 'function' ? opts.focus() : opts.focus ? $(opts.focus, root) : null;
      if (t) t.focus({ preventScroll: true });          // synchronous: a phone only raises the keyboard inside the tap that asked for it
      if (opts.onOpen) opts.onOpen();
    }
    function close(restore) {
      if (!isOpen) return; isOpen = false;
      root.classList.remove('is-open');
      document.documentElement.classList.remove('lock');
      behind().forEach(function (n) { n.inert = false; });
      if (restore !== false && opener && opener.focus) opener.focus({ preventScroll: true });
      if (opts.onClose) opts.onClose();
    }
    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') {
        var f = focusables(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    return { open: open, close: close, isOpen: function () { return isOpen; } };
  };

  /* ---------- full-screen menu: focus trap, ESC, aria-expanded, scroll lock ---------- */
  (function () {
    var menu = $('#menu'), burger = $('.nav .burger'), closeBtn = $('[data-menu-close]');
    if (!menu || !burger || !closeBtn) return;
    var m = L.modal(menu, {
      focus: function () { return closeBtn; },
      onOpen: function () { burger.setAttribute('aria-expanded', 'true'); },
      onClose: function () { burger.setAttribute('aria-expanded', 'false'); }
    });
    burger.addEventListener('click', function () { m.open(burger); });
    closeBtn.addEventListener('click', function () { m.close(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) m.close(false); });
    matchMedia('(min-width:1200px)').addEventListener('change', function (q) { if (q.matches) m.close(false); });
  })();

  /* ---------- call / WhatsApp sheet of the mobile action bar: both numbers, never a silent choice ---------- */
  (function () {
    var sheet = $('#csheet'); if (!sheet) return;
    var title = $('[data-sheet-title]', sheet), lists = $$('.csheet__l', sheet);
    var T = { call: 'Pozovite nas', wa: 'Pišite nam na WhatsApp' };
    var m = L.modal(sheet, { focus: function () { return $('.csheet__l:not([hidden]) a', sheet); } });
    function show(kind, from) {
      title.textContent = T[kind] || T.call;
      lists.forEach(function (l) { l.hidden = l.getAttribute('data-kind') !== kind; });
      m.open(from);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-sheet]');
      if (a && !(e.metaKey || e.ctrlKey || e.shiftKey)) { e.preventDefault(); show(a.getAttribute('data-sheet'), a); return; }
      if (e.target.closest('[data-sheet-close]')) m.close();
      else if (sheet.classList.contains('is-open') && e.target.closest('.csheet__b')) setTimeout(function () { m.close(false); }, 200);
    });
    L.sheet = { show: show, close: m.close };
  })();

  /* ---------- action bar: hides over the contact block (#zakazi) and the footer so it never covers them ---------- */
  (function () {
    var bar = $('#bar'); if (!bar || !('IntersectionObserver' in window)) return;
    var hide = {}, io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { hide[e.target.id] = e.isIntersecting; });
      bar.classList.toggle('is-off', !!(hide.zakazi || hide.footer));
    }, { threshold: .05 });
    ['zakazi', 'footer'].forEach(function (id) { var n = document.getElementById(id); if (n) io.observe(n); });

    /* desktop nav: on the home page the link of the section in view is marked; other pages carry aria-current="page" from the markup */
    var links = {}; $$('.nav__links a').forEach(function (a) { var h = a.getAttribute('href') || ''; if (h.charAt(0) === '#' && h.length > 1) links[h.slice(1)] = a; });
    var ids = Object.keys(links); if (!ids.length) return;
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var a = links[e.target.id]; if (!a) return; if (e.isIntersecting) { $$('.nav__links a').forEach(function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); } else a.removeAttribute('aria-current'); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(function (id) { var n = document.getElementById(id); if (n) sio.observe(n); });
  })();

  /* ---------- footer year ---------- */
  var y = $('[data-year]'); if (y) y.textContent = Math.max(2026, new Date().getFullYear());
})();

/* BACK TO TOP (FAB): round button, fixed bottom right. Appears after scrolling about one screen, sits above the mobile action bar
   (it measures the bar, so it also follows when the bar slides away), smooth scroll unless reduced motion is on.
   Tune: BAR (selector of the fixed action bar), Z (stacking), BG / FG / RING (colours) in the next line. */
(function () {
  if (document.getElementById('fab-top')) return;
  var BAR = '#bar', Z = 35, BG = '#C6B4E3', FG = '#403C3D', RING = 'rgba(182,120,81,.9)';
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
