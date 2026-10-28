/* =====================================================================================================
   LEPA SVAKI DAN · "A" preview · COMMENT MODE (vanilla JS, no libraries)
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   Active ONLY when the address contains ?komentari or #komentari (for example  index.html?komentari  or  blog.html#komentari).
   Without it this file does nothing: no element, no style, no listener is added to the page.

   WHAT IT DOES
   - puts a small badge in the top-left corner of every top-level section of the page, with a code and the name of the section,
     e.g. "A-3 Cenovnik" (A = this preview, 3 = the third section from the top, no leading zero). On the other pages the code carries the
     page: "A-blog-2 Dermatologija", "A-ponuda-1 ...", "A-tekst7-3 Povezani tekstovi" (text number 7), "A-dermatologija-2 ...".
   - shows a small fixed hint bar: "Komentari: navedite oznaku, npr. A-3".
   - a tap on a badge copies its code (where the browser allows it).
   - links to other pages of the preview keep the mode (?komentari is added), so the codes stay visible while browsing.
   HOW TO SEND A COMMENT: write the code and what you want, e.g. "A-3: cene su preblizu naslovu" or "A-blog-2: slika je pretamna".
   ===================================================================================================== */
(function () {
  'use strict';
  var on = /[?&]komentari(?:=|&|$)/.test(location.search) || /^#komentari(?:[=&]|$)/.test(location.hash);
  if (!on) return;

  var doc = document;
  var page = (doc.body.getAttribute('data-page') || '').trim();
  var prefix = page ? 'A-' + page + '-' : 'A-';
  var NAMES = { top: 'Početak', 'o-nama': 'O nama', tretmani: 'Naše usluge', 'saznajte-vise': 'Saznajte više', omiljeni: 'Omiljeni tretmani', usluge: 'Cenovnik', lokacije: 'Lokacije', utisci: 'Utisci', 'posebna-ponuda': 'Posebna ponuda', blog: 'Blog', zakazi: 'Kontakt', tekstovi: 'Tekstovi', paketi: 'Paketi', 'cenovnik-oblasti': 'Usluge i cene', kontakt: 'Podnožje' };

  function nameOf(el) {
    if (el.classList.contains('phead') || el.classList.contains('shero')) return 'Zaglavlje';
    if (el.id && NAMES[el.id]) return NAMES[el.id];
    if (el.classList.contains('art')) return 'Tekst';
    if (el.classList.contains('pn')) return 'Ostali tekstovi';
    if (el.classList.contains('foot')) return 'Podnožje';
    var lb = el.getAttribute('aria-labelledby'), h = lb && doc.getElementById(lb);
    var txt = (h && h.textContent) || (el.querySelector('h2,h3,h1') || {}).textContent || el.getAttribute('aria-label') || el.id || 'Odeljak';
    txt = txt.replace(/\s+/g, ' ').replace(/[.:]+$/, '').trim();
    return txt.length > 28 ? txt.slice(0, 27).trim() + '…' : txt;
  }

  var css = doc.createElement('style');
  css.setAttribute('data-review', '');
  css.textContent =
    '.rv-badge{position:absolute;z-index:140;top:6px;left:6px;display:inline-flex;align-items:center;gap:6px;max-width:calc(100% - 12px);min-height:22px;padding:3px 9px;border:0;border-radius:999px;' +
    'background:#FAF9F4;color:#403C3D;font-family:inherit;font-weight:400;font-size:11px;line-height:1.2;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:copy;' +
    'box-shadow:inset 0 0 0 1px #B67851,0 2px 8px rgba(90,87,88,.16)}' +
    '.rv-badge b{font-weight:400;font-size:12px;letter-spacing:.04em}' +
    '.rv-badge.is-copied{background:#E8E1F4}' +
    '.rv-hint{position:fixed;z-index:149;left:50%;bottom:calc(var(--abar-h,0px) + 10px);translate:-50% 0;max-width:calc(100vw - 24px);padding:8px 16px;border-radius:999px;' +
    'background:#E5E2D9;color:#403C3D;font-family:inherit;font-weight:400;font-size:12px;line-height:1.3;letter-spacing:.02em;text-align:center;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(182,120,81,.5),0 4px 16px rgba(90,87,88,.16)}' +
    '@media (min-width:1024px){.rv-hint{bottom:12px}}';
  doc.head.appendChild(css);

  var sections = Array.prototype.slice.call(doc.querySelectorAll('main > section, main > article, main > nav, footer.foot')).filter(function (el) { return el.offsetHeight > 0; });
  sections.forEach(function (el, i) {
    var code = prefix + (i + 1);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var b = doc.createElement('button');
    b.type = 'button'; b.className = 'rv-badge';
    b.setAttribute('aria-label', 'Oznaka ' + code + ', ' + nameOf(el) + '. Dodirnite da je kopirate.');
    b.innerHTML = '<b></b><span></span>';
    b.firstChild.textContent = code; b.lastChild.textContent = nameOf(el);
    if (i === 0) b.style.top = 'calc(var(--nav-h, 72px) + max(12px, env(safe-area-inset-top)) + 4px)';   // first section: just under the fixed header
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { b.classList.add('is-copied'); setTimeout(function () { b.classList.remove('is-copied'); }, 900); }, function () {});
    });
    el.insertBefore(b, el.firstChild);
  });

  var hint = doc.createElement('div');
  hint.className = 'rv-hint';
  hint.setAttribute('role', 'note');
  hint.textContent = 'Komentari: navedite oznaku, npr. ' + prefix + '3';
  doc.body.appendChild(hint);

  // the mode follows the visitor to the other pages of the preview
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || /^(#|mailto:|tel:|https?:|javascript:)/i.test(href)) return;
    var m = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(href);
    if (/(^|[?&])komentari(=|&|$)/.test(m[2] || '')) return;
    a.setAttribute('href', m[1] + ((m[2] ? m[2] + '&' : '?') + 'komentari') + (m[3] || ''));
  }, true);
})();
