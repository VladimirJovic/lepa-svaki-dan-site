/* =====================================================================================================
   LEPA SVAKI DAN · PRICE FORMAT (one helper for the whole site)   Pripremio ECHOSYSTEM-MOTHER AGENCY

   THE RULE (client feedback 3): a price is shown in DINARS FIRST: the larger, primary number is the price in dinars ("6.000 rsd"), and below it, smaller,
   the price in euros ("51€"). Where only one currency exists, that one is shown on its own. The data keeps the old pattern "EUR / RSD":
       "51€ / 6.000 rsd"                      -> 6.000 rsd   over   51€
       "od 24–40€ / 2.800–4.700 rsd"          -> od 2.800–4.700 rsd   over   od 24–40€      (the "od" of the data stands before the euro part: both lines carry it)
       "385€"                                 -> 385€ alone
   The same file runs in the browser (price list, favourites, search, offers) and in the page builder (tools/a/build-pages.mjs renders the identical
   markup into the static pages), so the price can never look different in two places.

   API  (window.LSDPrice / module.exports)
     parse(p)         -> { from: bool, rsd: "6.000" | "2.800–4.700" | "", eur: "51€" | "24–40€" | "" }
     html(p, cls)     -> '<span class="px"><span class="px__p"><span class="px__o">od </span><span class="px__n">6.000</span><span class="px__u"> rsd</span></span><span class="px__s">51€</span></span>'
     text(p)          -> "6.000 rsd (51€)" / "od 2.800–4.700 rsd (od 24–40€)" / "385€"      (one line: meta lines, labels)
     inline(s)        -> rewrites "428€ / 50.000 rsd" inside a sentence to "50.000 rsd / 428€"
   ===================================================================================================== */
(function (root) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function parse(p) {
    var s = String(p == null ? '' : p).trim(), out = { from: false, rsd: '', eur: '' };
    if (!s) return out;
    s.split(/\s+\/\s+/).forEach(function (part) {
      part = part.trim();
      var from = /^od\s+/i.test(part);
      var body = part.replace(/^od\s+/i, '').trim().replace(/(\d)\s*-\s*(\d)/g, '$1\u2013$2');   // a numeric range is written with an en dash
      if (from) out.from = true;
      if (/rsd|din\.?$/i.test(body)) out.rsd = body.replace(/\s*(rsd|din\.?)\s*$/i, '').trim();
      else if (body.indexOf('€') >= 0) out.eur = body.replace(/\s*€\s*$/, '').trim() + '€';
    });
    return out;
  }

  function html(p, cls) {
    var x = parse(p);
    if (!x.rsd && !x.eur) return '';
    var prefix = x.from ? '<span class="px__o">od </span>' : '';
    var main = x.rsd
      ? prefix + '<span class="px__n">' + esc(x.rsd) + '</span><span class="px__u"> rsd</span>'
      : prefix + '<span class="px__n">' + esc(x.eur.replace(/€$/, '')) + '</span><span class="px__u">€</span>';
    var sub = x.rsd && x.eur ? '<span class="px__s">' + (x.from ? 'od ' : '') + esc(x.eur) + '</span>' : '';
    return '<span class="px' + (cls ? ' ' + cls : '') + '"><span class="px__p">' + main + '</span>' + sub + '</span>';
  }

  /* non-breaking spaces (\u00a0): a price in a running line is never split across two lines ("od 6.000 rsd (51€)" stays one piece) */
  function text(p) {
    var x = parse(p), o = x.from ? 'od\u00a0' : '';
    if (x.rsd) return o + x.rsd + '\u00a0rsd' + (x.eur ? '\u00a0(' + o + x.eur + ')' : '');
    return x.eur ? o + x.eur : '';
  }

  /* "…428€ / 50.000 rsd…" inside a sentence (an offer note) -> "…50.000 rsd / 428€…"; text without that pattern is returned as it is */
  var INLINE = /(\d[\d.]*(?:\s*[–-]\s*\d[\d.]*)?)€\s*\/\s*(\d[\d.]*(?:\s*[–-]\s*\d[\d.]*)?\s*rsd)/g;
  function inline(s) { return String(s == null ? '' : s).replace(INLINE, function (m, eur, rsd) { return (rsd + ' / ' + eur + '€').replace(/ /g, '\u00a0'); }); }

  var api = { parse: parse, html: html, text: text, inline: inline };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LSDPrice = api;
})(typeof window !== 'undefined' ? window : this);
