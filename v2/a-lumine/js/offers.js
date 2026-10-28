/* =====================================================================================================
   LEPA SVAKI DAN · Posebna ponuda · renderer (vanilla JS, no libraries)
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   Reads window.LSD_CONTENT.offers (js/offers-data.js: THAT file is where offers are added, edited, removed). Prices come out of js/price.js (dinars first).
   The same code runs in two places, so the markup can never drift apart:
   - in the browser: fills #offers-list (page posebna-ponuda.html) and #offers-teaser (home) from the data;
   - in tools/a/build-pages.mjs: renders the identical HTML into the static pages (readable without JS).
   The button of a package never picks an address: it opens the sheet of the shell with both numbers (js/shell.js adds the package to the WhatsApp text).
   ===================================================================================================== */
(function (root) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ico = function (n) { return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  /* "385€ / 45.000 rsd" -> big RSD + small EUR (js/price.js: dinars first on the whole site) */
  var Price = root.LSDPrice;
  function px(p) { return Price.html(p); }
  function waText(title) { return 'Zdravo, zanima me paket „' + title + '“ i želim da zakažem termin.'; }
  function slug(o) { return o.slug || String(o.id || 'ponuda'); }
  function anchor(o) { return 'ponuda-' + slug(o); }
  /* price-list group of the offer: "protokoli:1" (or the service id "protokoli:1:5", the last part is dropped) */
  function groupId(o) {
    var r = o.cenovnikRef, id = r && (typeof r === 'string' ? r : r.id);
    var m = /^([a-z]+):(\d+)/.exec(id || '');
    return m ? m[1] + '-' + m[2] : '';
  }
  function cenovnikHref(o, base) { var g = groupId(o); return g ? (base || '') + 'index.html?grupa=' + g + '#usluge' : ''; }
  function ctaLabel(o) { return (o.cta && o.cta.label) || 'Zakaži ovaj paket'; }

  /* the button opens the booking sheet with both numbers and the package in the WhatsApp text (no JS: it jumps to the contact block) */
  function cta(o, cls) {
    var aria = ' aria-label="' + esc(ctaLabel(o) + ': ' + o.title) + '"';
    return '<a class="' + cls + '"' + aria + ' href="#zakazi" data-book data-pkg="' + esc(o.title) + '" aria-haspopup="dialog">' + ico('chat') + esc(ctaLabel(o)) + '</a>';
  }

  /* full card (page posebna-ponuda.html) */
  function card(o, i, opt) {
    opt = opt || {};
    var feat = i === 0, g = cenovnikHref(o, opt.base), old = o.oldPrice ? Price.text(o.oldPrice).replace(/\u00a0\(.*\)$/, '') : '';
    return '<article class="po' + (feat ? ' po--feat bk' : '') + ' rv" id="' + esc(anchor(o)) + '" style="--i:' + (i % 2) + '">' +
      '<div class="po__main"><span class="chip ' + (feat ? 'chip--ghost' : 'chip--line') + '">' + esc(o.tag) + '</span>' +
      '<h2 class="po__t">' + esc(o.title) + '</h2>' +
      '<p class="po__d">' + esc(o.includes || o.description) + '</p>' +
      (o.note ? '<p class="po__n">' + esc(Price.inline(o.note)) + '</p>' : '') +
      (o.validity ? '<p class="po__v">' + ico('clock') + esc(o.validity) + '</p>' : '') + '</div>' +
      '<div class="po__bot"><div class="po__price">' + (old ? '<span class="po__old"><span class="sr">Prethodna cena: </span><s>' + esc(old) + '</s></span>' : '') + px(o.price) + '</div>' +
      '<div class="po__act">' + cta(o, 'btn btn--sm po__cta') + (g ? '<a class="po__more" href="' + esc(g) + '">U cenovniku ›</a>' : '') + '</div></div></article>';
  }
  function page(offers, opt) { return offers.map(function (o, i) { return card(o, i, opt); }).join(''); }

  /* compact card (home teaser): the whole card opens the offer on the page */
  function teaser(offers, opt) {
    var base = (opt && opt.base) || '';
    return offers.map(function (o, i) {
      return '<li class="pt rv" style="--i:' + (i % 4) + '"><span class="chip chip--line">' + esc(o.tag) + '</span>' +
        '<h3 class="pt__t"><a class="pt__a" href="' + base + 'posebna-ponuda.html#' + esc(anchor(o)) + '">' + esc(o.title) + '</a></h3>' +
        '<p class="pt__d">' + esc(o.includes || o.description) + '</p>' +
        '<div class="pt__bot">' + px(o.price) + '<span class="arrow arrow--sm" aria-hidden="true">' + ico('arrow') + '</span></div></li>';
    }).join('');
  }

  function mount() {
    var D = root.LSD_CONTENT, list = root.document && root.document.getElementById('offers-list'), tz = root.document && root.document.getElementById('offers-teaser');
    if (!D || !D.offers) return;
    if (list) list.innerHTML = page(D.offers);
    if (tz) tz.innerHTML = teaser(D.offers);
  }

  var api = { page: page, card: card, teaser: teaser, waText: waText, mount: mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LSDOffers = api;
  if (root.document && root.LSD_CONTENT) mount();
})(typeof window !== 'undefined' ? window : this);
