/* offers.js: offer helpers shared by the home teaser and the Posebna ponuda page, and the renderer of posebna-ponuda.html.
   Pripremio ECHOSYSTEM-MOTHER AGENCY.

   ===================================================================================================================
   HOW TO ADD, EDIT OR REMOVE AN OFFER (AND ITS PRICE)
   ===================================================================================================================
   The offers live in ONE place: the array  window.LSD_CONTENT.offers  at the bottom of  assets/content.js
   (the home teaser and posebna-ponuda.html both read it when the page opens, so a saved edit shows up on reload).
   A static copy of the same markup is also written into posebna-ponuda.html by  _tools/b/build-pages.mjs  so the page
   reads without JavaScript; after editing the offers run  node _tools/b/build-pages.mjs  once to refresh that copy.
   (assets/content.js itself is generated from _shared/content/content.json; to keep an edit for good, make it there too.)

   ADD     copy one whole { ... } block of the array, paste it after the last one (comma between blocks) and change:
             id          unique, e.g. "offer-5"
             slug        unique, lower case, no spaces; it is the page anchor (posebna-ponuda.html#slug)
             tag         the small gold label above the title, e.g. "Sezonski paket"
             title       the name of the offer
             description what is included, one or two sentences
             price       the text shown as a fallback, "385€ / 45.000 rsd" (euro, then " / ", then dinars)
             priceEur    { "min": 385, "max": 385 }       the big number. min = max for a fixed price; max > min shows "od 385"
             priceRsd    { "min": 45000, "max": 45000 }   the dinar line under it, formatted automatically (45.000 rsd)
             note        optional extra line (for example the price for two people), or null
             validity    optional validity wording, shown EXACTLY as written (for example "Važi do 31.12.2026."), or null to hide it
             cta         { "label": "Zakaži ovaj paket", "href": "https://wa.me/381648239439" }  the WhatsApp number; the message is added here
             cenovnikRef optional { "id": "protokoli:1:5", "group": "Anti-aging protokoli" }  adds a link to that price list group, or null
   EDIT    change the text or numbers in the block. PRICE: change priceEur and priceRsd (and the price string).
   REMOVE  delete the whole block (and the comma that belonged to it). The home teaser and this page follow automatically.
   ORDER   the order of the array is the order on both pages.
   =================================================================================================================== */
(function (root) {
  'use strict';
  var L = root.LSD = root.LSD || {};
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var dots = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };

  /* euro figure for the big number and the dinar line. Falls back to the "385€ / 45.000 rsd" string when the numbers are missing. */
  L.offerPrice = function (o) {
    var parts = String(o.price || '').split(' / '), eur = '', rsd = parts[1] || '';
    if (o.priceEur && o.priceEur.min != null) eur = (o.priceEur.max > o.priceEur.min ? 'od ' : '') + o.priceEur.min;
    else eur = (parts[0] || '').replace(/[^\d.,]/g, '');
    if (o.priceRsd && o.priceRsd.min != null) rsd = (o.priceRsd.max > o.priceRsd.min ? 'od ' : '') + dots(o.priceRsd.min) + ' rsd';
    return { eur: eur, rsd: rsd };
  };
  /* WhatsApp link with a prefilled message */
  L.offerWaHref = function (o) {
    var base = (o.cta && o.cta.href) || 'https://wa.me/381648239439';
    return base + (base.indexOf('?') > -1 ? '&' : '?') + 'text=' + encodeURIComponent('Zdravo, zanima me paket: ' + o.title + (o.price ? ' (' + o.price + ')' : ''));
  };
  /* the offer card of posebna-ponuda.html (the build script runs this same function to write the static copy) */
  L.offerCard = function (o, i) {
    var p = L.offerPrice(o), ref = '';
    if (o.cenovnikRef && o.cenovnikRef.id) {
      var gid = String(o.cenovnikRef.id).split(':').slice(0, 2).join(':');
      ref = '<a class="offer__ref" href="index.html?grupa=' + E(gid) + '#usluge">U cenovniku' + (o.cenovnikRef.group ? ': ' + E(o.cenovnikRef.group) : '') + ' ›</a>';
    }
    return '<li class="offer offer--page" id="' + E(o.slug) + '" data-reveal style="--y:28px;--d:' + ((i % 2) * .08).toFixed(2) + 's">' +
      '<p class="offer__tag">' + E(o.tag) + '</p>' +
      '<p class="offer__price"><span>' + E(p.eur) + '</span><small>€</small></p>' +
      '<p class="offer__rsd">' + E(p.rsd) + '</p>' +
      '<h2 class="offer__h">' + E(o.title) + '</h2>' +
      '<p class="offer__d">' + E(o.description) + '</p>' +
      (o.note ? '<p class="offer__note">' + E(o.note) + '</p>' : '') +
      (o.validity ? '<p class="offer__valid">' + E(o.validity) + '</p>' : '') +
      ref +
      '<a class="btn btn--light" href="' + E(L.offerWaHref(o)) + '" target="_blank" rel="noopener">' + E((o.cta && o.cta.label) || 'Zakaži ovaj paket') + ' <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a></li>';
  };

  /* browser: re-render the list from the data, so an edit in assets/content.js shows up without rebuilding */
  if (typeof document !== 'undefined') {
    var list = document.getElementById('offers-list');
    var data = root.LSD_CONTENT && root.LSD_CONTENT.offers;
    if (list && data && data.length) {
      list.innerHTML = data.map(L.offerCard).join('');   /* pages.js (loaded after this file) reveals the cards */
    }
  }
})(typeof window !== 'undefined' ? window : this);
