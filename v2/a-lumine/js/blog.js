/* =====================================================================================================
   LEPA SVAKI DAN · "A" preview · blog index: segment chips filter the list (without JS they are plain jump links)
   Pripremio ECHOSYSTEM-MOTHER AGENCY
   ===================================================================================================== */
(function () {
  'use strict';
  var cats = document.getElementById('blogCats');
  if (!cats) return;
  var chips = Array.prototype.slice.call(cats.querySelectorAll('[data-seg]'));
  var segs = Array.prototype.slice.call(document.querySelectorAll('.bseg'));
  var live = document.getElementById('blogLive');
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function apply(key, announce) {
    var shown = 0, name = '';
    segs.forEach(function (s) {
      var on = key === 'sve' || s.dataset.seg === key;
      s.hidden = !on;
      if (on) { shown += s.querySelectorAll('.bp').length; if (key !== 'sve') name = s.querySelector('.sban__t').textContent; }
    });
    chips.forEach(function (c) { c.setAttribute('aria-current', c.dataset.seg === key ? 'true' : 'false'); });
    if (announce && live) { live.textContent = ''; setTimeout(function () { live.textContent = (key === 'sve' ? 'Prikazani su svi tekstovi' : 'Prikazano: ' + name) + ', ukupno ' + shown; }, 60); }
  }
  cats.addEventListener('click', function (e) {
    var c = e.target.closest('[data-seg]'); if (!c) return;
    e.preventDefault();
    var key = c.dataset.seg;
    apply(key, true);
    history.replaceState(null, '', key === 'sve' ? '#tekstovi' : '#' + key);
    c.focus({ preventScroll: true });
    // keep the start of the list in view: the chips stay where they are, only scroll when the list begins above the screen
    var first = segs.filter(function (s) { return !s.hidden; })[0];
    if (first && first.getBoundingClientRect().top < 0) first.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  });
  // arriving from "Blog > segment" in a text's breadcrumb (blog.html#estetske): show that segment
  var h = decodeURIComponent((location.hash || '').slice(1));
  if (segs.some(function (s) { return s.id === h; })) {
    apply(h, false);
    setTimeout(function () { var t = document.getElementById('tekstovi'); if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 0);
  } else apply('sve', false);
})();
