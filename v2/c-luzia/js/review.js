/* Lepa Svaki Dan - preview "C": COMMENT MODE (dependency-free).
   Active ONLY when the address contains ?komentari or #komentari (for example  index.html?komentari  or  blog.html#komentari).
   Without it this file does nothing and injects nothing.
   What it does: puts a small badge in the top-left corner of every top-level section, with a code and the section name, for example
   "C-3 Cenovnik" (preview letter, number of the section on the page WITHOUT a leading zero, name). Pages other than the home page carry a
   page prefix: "C-blog-2", "C-tekst-7-1" (text number 7), "C-posebna-ponuda-1", "C-dermatologija-2". A small fixed hint bar says how to write
   the comment ("Komentari: navedite oznaku, npr. C-3"). With ?komentari the mode follows the links between pages.
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
(function () {
  'use strict';
  var on = /(^|[?&])komentari(=|&|$)/.test(location.search) || /(^|[#&\/])komentari($|&)/.test(location.hash);
  if (!on) return;
  var LETTER = 'C';
  var doc = document;
  var viaQuery = /(^|[?&])komentari(=|&|$)/.test(location.search);

  function pageKey() {
    var b = doc.body.getAttribute('data-page'); if (b !== null) return b;
    /* path relative to the site root (the folder that holds js/), so it also works when the site lives in a sub-folder such as /c/ */
    var sc = doc.querySelector('script[src*="review.js"]'), root = '/';
    try { root = new URL('..', sc.src).pathname; } catch (e) {}
    var path = decodeURIComponent(location.pathname);
    var rel = path.indexOf(root) === 0 ? path.slice(root.length) : path.replace(/^\//, '');
    rel = rel.replace(/\/+$/, '').replace(/\.html$/, '');
    if (!rel || rel === 'index') return '';
    var parts = rel.split('/'), last = parts[parts.length - 1], dir = parts.length > 1 ? parts[parts.length - 2] : '';
    if (dir === 'blog') return 'tekst-' + last.slice(0, 18);
    return last;
  }
  function visible(el) { var r = el.getBoundingClientRect(); return !(el.hidden || el.getAttribute('aria-hidden') === 'true' || (r.width === 0 && r.height === 0)); }
  function short(t) { t = String(t).replace(/\s+/g, ' ').trim(); return t.length > 34 ? t.slice(0, 33).replace(/\s+\S*$/, '') + '…' : t; }
  /* wrappers that have no data-sec: a fixed name beats "the first heading inside" (which names a whole list after its first card), then aria-label, then the heading */
  var CLASS_NAMES = { 'art__layout': 'Tekst', 'blog-list': 'Lista tekstova', 'blog-contact': 'Kontakt' };
  function nameOf(el) {
    var n = el.getAttribute('data-sec'); if (n) return n;
    for (var k in CLASS_NAMES) if (CLASS_NAMES.hasOwnProperty(k) && el.classList.contains(k)) return CLASS_NAMES[k];
    n = el.getAttribute('aria-label'); if (n) return short(n);
    for (var i = 0; i < el.children.length; i++) { var c = el.children[i]; if (c.tagName === 'NAV' && c.getAttribute('aria-label')) return short(c.getAttribute('aria-label')); }
    var h = el.querySelector('h1, h2, h3'); if (h) return short(h.textContent);
    return el.id || 'Sekcija';
  }
  function sections() {
    var main = doc.querySelector('main'), out = [];
    if (main) Array.prototype.forEach.call(main.children, function (c) {
      if (c.tagName === 'ARTICLE') Array.prototype.forEach.call(c.children, function (x) { out.push(x); });
      else out.push(c);
    });
    var foot = doc.querySelector('footer'); if (foot) out.push(foot);
    return out.filter(function (el) { return /^(SECTION|HEADER|DIV|NAV|FOOTER|ASIDE)$/.test(el.tagName) && !el.classList.contains('marquee') && visible(el); });
  }

  var css = doc.createElement('style');
  css.id = 'lsd-review-css';
  css.textContent =
    '.lsd-rv-host{position:relative}' +
    '.lsd-rv{position:absolute;z-index:90;top:8px;left:8px;max-width:calc(100% - 16px);padding:2px 10px;background:rgba(255,255,255,.92);color:#5A5758;border:1px solid #5A5758;border-radius:999px;font:13px/1.35 "Galano Grotesque","Avenir Next","Helvetica Neue",Arial,sans-serif;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px rgba(90,87,88,.25);pointer-events:none}' +
    '.lsd-rv--top{top:calc(var(--nav-space,76px) + 8px)}' +
    '.lsd-rv-hint{position:fixed;z-index:95;left:50%;transform:translateX(-50%);bottom:calc(var(--bar-h,0px) + 10px + env(safe-area-inset-bottom,0px));width:max-content;max-width:calc(100vw - 24px);padding:8px 16px;background:#5A5758;color:#fff;border-radius:999px;font:14px/1.35 "Galano Grotesque","Avenir Next","Helvetica Neue",Arial,sans-serif;text-align:center;box-shadow:0 6px 20px rgba(90,87,88,.35)}' +
    '@media print{.lsd-rv,.lsd-rv-hint{display:none}}';
  doc.head.appendChild(css);

  var prefix = pageKey(), codes = [];
  sections().forEach(function (el, i) {
    var code = LETTER + '-' + (prefix ? prefix + '-' : '') + (i + 1);
    codes.push(code);
    if (getComputedStyle(el).position === 'static') el.classList.add('lsd-rv-host');
    var b = doc.createElement('span');
    b.className = 'lsd-rv' + (el.getBoundingClientRect().top + scrollY < 90 ? ' lsd-rv--top' : '');
    b.setAttribute('aria-hidden', 'true');
    b.setAttribute('data-code', code);
    b.textContent = code + ' ' + nameOf(el);
    el.insertBefore(b, el.firstChild);
  });
  var hint = doc.createElement('div');
  hint.className = 'lsd-rv-hint'; hint.setAttribute('role', 'note');
  hint.textContent = 'Komentari: navedite oznaku, npr. ' + (codes[2] || codes[0] || LETTER + '-1');
  doc.body.appendChild(hint);

  if (viaQuery) doc.addEventListener('click', function (e) {   // keep the mode while walking through the preview
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || e.defaultPrevented) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || !/\.html$|\/$/.test(u.pathname) || /(^|&)komentari(=|&|$)/.test(u.search.slice(1))) return;
    if (u.pathname === location.pathname && u.search === location.search && u.hash) return;   // in-page anchor
    u.search += (u.search ? '&' : '?') + 'komentari'; a.href = u.href;
  }, true);
})();
