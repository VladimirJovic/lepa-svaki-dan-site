/* review.js: COMMENT MODE of the preview. Dependency-free. Pripremio ECHOSYSTEM-MOTHER AGENCY.

   It does nothing at all unless the address carries  ?komentari  or  #komentari  (for example  .../index.html?komentari ). Without it nothing
   is injected: no element, no style, no listener.

   With it, every top-level section gets a small badge in its top-left corner with a code:
        <preview letter>-<page prefix>-<number> <section name>      e.g.  B-3 Cenovnik   (home page: no prefix)   B-blog-2 Dermatologija   B-tekst7-1 Tekst
   The numbers have no leading zero. The header and the footer are shared by all pages and are called B-zaglavlje and B-podnožje.
   A small fixed hint says how to quote a code. While the mode is on, links to other pages of the preview keep it (the address gets ?komentari).
   Page prefixes: blog, ponuda, dermatologija, estetske, kozmetika, telo, tekst1 ... tekst21 (the 21 texts in the order of the Blog page).
   TO CHANGE   LETTER (the preview letter), NAMES (home section names), the page prefix is the data-rv attribute of <body>.                           */
(function () {
  'use strict';
  var on = /[?&#]komentari(=|&|$)/.test(location.search + '&' + location.hash.replace(/^#/, '#'));
  if (!on) return;

  var LETTER = 'B';
  var NAMES = {
    hero: 'Naslovna', 'o-nama': 'O nama', tretmani: 'Tretmani', 'saznajte-vise': 'Saznajte više', omiljeni: 'Omiljeni tretmani', usluge: 'Cenovnik',
    pokloni: 'Pokloni', lokacije: 'Lokacije', utisci: 'Utisci', 'posebna-ponuda': 'Posebna ponuda', blog: 'Blog', zakazi: 'Zakazivanje'
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var prefix = (document.body.getAttribute('data-rv') || '').trim();

  /* the badges live on the body (not inside the sections), so no section's stacking context or clipping can hide them behind the fixed header */
  var css = '.rv-b{position:absolute;z-index:95;max-width:min(92vw,360px);box-sizing:border-box;padding:5px 10px 6px;background:#5A5758;color:#fff;border:1px solid #fff;border-top:0;border-left:0;border-radius:0 0 6px 0;font:700 12px/1.25 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;box-shadow:0 1px 6px rgba(0,0,0,.25)}' +
    '.rv-b b{font-weight:800;color:#F7E5B9}.rv-b--nav{position:fixed;top:calc(var(--nav-top,10px) + var(--nav-h,60px) + 10px + env(safe-area-inset-top,0px));left:auto;right:12px;border:1px solid #fff;border-radius:6px}' +
    '.rv-hint{position:fixed;z-index:96;left:8px;bottom:calc(var(--bar-h,0px) + env(safe-area-inset-bottom,0px) + 8px);max-width:calc(100vw - 16px);box-sizing:border-box;padding:6px 12px;background:#5A5758;color:#fff;border:1px solid #fff;border-radius:999px;font:600 12px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;pointer-events:none;box-shadow:0 1px 8px rgba(0,0,0,.3)}' +
    '.rv-hint b{color:#F7E5B9}html.lock .rv-b,html.lock .rv-hint{display:none}@media (max-height:480px){.rv-hint{display:none}}';
  var st = document.createElement('style'); st.id = 'rv-style'; st.textContent = css; document.head.appendChild(st);

  function nameOf(el) {
    var n = el.getAttribute('data-rv-name'); if (n) return n;
    if (el.id && NAMES[el.id]) return NAMES[el.id];
    /* the section's own label first (aria-labelledby, then aria-label), then its first heading; a block that only holds the contact line is called that */
    var lb = el.getAttribute('aria-labelledby'), lbEl = lb && document.getElementById(lb);
    var h = $('h1, h2, h3', el); var t = ((lbEl && lbEl.textContent) || el.getAttribute('aria-label') || (h && h.textContent) || '').replace(/\s+/g, ' ').trim();
    if (!t && !h && $('.cline', el)) t = 'Telefoni i e-pošta';
    return t.length > 28 ? t.slice(0, 27).replace(/\s+\S*$/, '') + '…' : t || 'Odeljak';
  }
  var visible = function (el) { return el.offsetWidth > 0 && el.offsetHeight > 0; };
  function tops() {
    var out = [], main = $('main'); if (!main) return out;
    var push = function (el) { if (el && out.indexOf(el) < 0 && visible(el)) out.push(el); };
    var SEL = ':scope > section, :scope > header, :scope > article, :scope > aside, :scope > nav, :scope > [data-rv-name]';
    Array.prototype.forEach.call(main.children, function (c) {
      if (c.matches('section, header, article, aside, nav')) { push(c); return; }
      var inner = $$(SEL, c);
      if (inner.length) inner.forEach(push); else push(c);
    });
    return out;
  }
  var base = LETTER + (prefix ? '-' + prefix : '');
  var items = [];                                         // { el, node }
  function add(el, code, name, cls) {
    var b = document.createElement('span'); b.className = 'rv-b' + (cls ? ' ' + cls : ''); b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<b>' + code + '</b> ' + name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    document.body.appendChild(b); if (!cls) items.push({ el: el, node: b });
  }
  var header = $('header.nav'), footer = $('footer#footer'), n = 0;
  if (header) add(header, LETTER + '-zaglavlje', '', 'rv-b--nav');
  tops().forEach(function (el) { n++; add(el, base + '-' + n, nameOf(el)); });
  if (footer) add(footer, LETTER + '-podnožje', '');
  /* top-left corner of each section, in page coordinates; a section that starts under the fixed header gets its badge just below it */
  function place() {
    var np = $('.nav__pill'), navB = np ? np.getBoundingClientRect().bottom + 8 : 0;
    items.forEach(function (i) {
      var r = i.el.getBoundingClientRect(), top = r.top + window.pageYOffset, left = r.left + window.pageXOffset;
      if (r.top > -2 && r.top < navB && window.pageYOffset < 5) top = navB + window.pageYOffset;
      i.node.style.top = Math.round(top) + 'px'; i.node.style.left = Math.round(Math.max(0, left)) + 'px';
    });
  }
  place(); addEventListener('load', place); addEventListener('resize', place); addEventListener('orientationchange', place);
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(document.body);
  var hint = document.createElement('div'); hint.className = 'rv-hint'; hint.setAttribute('role', 'note');
  hint.innerHTML = 'Komentari: navedite oznaku, npr. <b>' + base + '-' + Math.max(1, Math.min(3, n)) + '</b>'; document.body.appendChild(hint);

  /* keep the mode while browsing the preview: links to other pages carry ?komentari (set at click time, so links built later are covered) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || e.defaultPrevented) return;
    if (a.origin !== location.origin || !/\.html$|\/$/.test(a.pathname)) return;
    if (a.pathname === location.pathname && a.search === location.search) return;
    if (/[?&]komentari(=|&|$)/.test(a.search)) return;
    a.search = (a.search ? a.search + '&' : '?') + 'komentari';
  }, true);
})();
