/* Offers view: the ONE place that turns the offers data (assets/offers.js, window.LSD_CONTENT.offers) into markup.
   Used by the build script (node, to pre-render the pages) and by the browser (js/pages.js, js/main.js re-render only when the data changed).
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.LSD_OFFERS_VIEW = factory();
})(this, function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function icon(id, s) { s = s || 20; return '<svg class="ico" width="' + s + '" height="' + s + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function split(p) { p = String(p || ''); var a = p.split(' / '); return { eur: a[0], rsd: a[1] || '' }; }
  /* signature of the data: pre-rendered markup carries it (data-sig); the browser re-renders only when it differs */
  function sig(o) { var s = JSON.stringify(o), h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function wa(o) {
    var base = (o.cta && o.cta.href) || 'https://wa.me/381648239439';
    var text = 'Zdravo, zanima me paket „' + o.title + '“ sa vašeg sajta. Molim vas za informacije i slobodan termin.';
    return base + (base.indexOf('?') > -1 ? '&' : '?') + 'text=' + encodeURIComponent(text);
  }
  function priceHref(o) {
    var r = o.cenovnikRef; if (!r || !r.id) return '';
    return 'index.html?usluga=' + encodeURIComponent(r.id).replace(/%3A/g, ':') + '#usluge';
  }
  function priceBlock(o) {
    var p = split(o.price), old = o.oldPrice ? split(o.oldPrice) : null;
    return '<div class="shell__price">' +
      (old ? '<span class="price-old"><span class="sr-only">Prethodna cena: </span><s>' + esc(old.eur) + (old.rsd ? ' / ' + esc(old.rsd) : '') + '</s></span>' : '') +
      '<span class="price-big">' + esc(p.eur) + '</span>' + (p.rsd ? '<span class="price-sub">' + esc(p.rsd) + '</span>' : '') + '</div>';
  }
  /* full cards for posebna-ponuda.html */
  function cards(offers, opt) {
    var ind = (opt && opt.indent) || '';
    return offers.map(function (o) {
      var feat = !!o.featured, link = priceHref(o);
      return ind + '<article class="shell ocard' + (feat ? ' shell--prominent' : '') + '" id="' + esc(o.slug) + '">\n' +
        ind + '  <div class="shell__bar"><h2 class="shell__title">' + esc(o.title) + '</h2><span class="shell__tag">' + esc(o.tag) + '</span></div>\n' +
        ind + '  <div class="shell__body">' + (feat ? '<span class="brk brk--gold" aria-hidden="true"></span>' : '') + '\n' +
        ind + '    <p class="shell__desc">' + esc(o.includes) + '</p>\n' +
        ind + '    ' + priceBlock(o) + '\n' +
        (o.validity ? ind + '    <p class="ocard__valid">' + esc(o.validity) + '</p>\n' : '') +
        (o.note ? ind + '    <p class="shell__note">' + esc(o.note) + '</p>\n' : '') +
        ind + '    <div class="ocard__actions">\n' +
        ind + '      <a class="btn btn--primary" href="' + esc(wa(o)) + '" target="_blank" rel="noopener">' + esc((o.cta && o.cta.label) || 'Zakaži ovaj paket') + '</a>\n' +
        (link ? ind + '      <a class="btn btn--secondary" href="' + esc(link) + '">Pogledaj u cenovniku</a>\n' : '') +
        ind + '    </div>\n' +
        ind + '  </div>\n' +
        ind + '</article>';
    }).join('\n');
  }
  /* compact rows for the home teaser */
  function teaser(offers, opt) {
    var ind = (opt && opt.indent) || '';
    return offers.map(function (o) {
      var p = split(o.price);
      return ind + '<a class="orow" href="posebna-ponuda.html#' + esc(o.slug) + '">' +
        '<span class="orow__txt"><span class="orow__tag">' + esc(o.tag) + '</span><span class="orow__t">' + esc(o.title) + '</span></span>' +
        '<span class="orow__price">' + esc(p.eur) + '</span>' +
        '<span class="orow__go" aria-hidden="true">' + icon('arrow-ur', 20) + '</span></a>';
    }).join('\n');
  }
  return { cards: cards, teaser: teaser, sig: sig, esc: esc };
});
