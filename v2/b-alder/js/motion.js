/* motion.js: count-up, scroll reveal, open-now chip. No dependencies. (The statement word-by-word fade is gone: a sentence is one colour at rest and
   while it scrolls in, no faded half.)
   Every effect has a reduced-motion fallback (final state at once). Pripremio ECHOSYSTEM-MOTHER AGENCY. */
(function () {
  'use strict';
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Count-up: <span class="count" data-end="1000" data-dec="0">  (starts at 60 % visible, 1.6 s, expo-out) */
  function countUp(el) {
    var end = +el.dataset.end, dec = +(el.dataset.dec || 0), dur = (+el.dataset.dur || 1.6) * 1000;
    var fmt = function (v) { return v.toLocaleString('sr-RS', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
    if (RM) { el.textContent = fmt(end); return; }
    el.textContent = fmt(0);
    var ease = function (t) { return t >= 1 ? 1 : (1 - Math.pow(2, -10 * t)) / (1 - Math.pow(2, -10)); };
    new IntersectionObserver(function (es, io) {
      if (!es[0].isIntersecting) return; io.disconnect();
      var t0 = performance.now();
      (function f(now) { var k = clamp((now - t0) / dur); el.textContent = fmt(end * ease(k)); if (k < 1) requestAnimationFrame(f); })(t0);
    }, { threshold: .6 }).observe(el);
  }

  /* 2. Scroll reveal: <... data-reveal style="--y:28px;--d:.12s"> -> adds .in once (threshold .15) */
  function reveal(root) {
    var els = Array.prototype.slice.call((root || document).querySelectorAll('[data-reveal]:not(.in):not([data-reveal="hero"])'));
    if (RM) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* 3. Open-now chip: <p class="open" data-tz="Europe/Belgrade" data-hours="Mon-Sat 9-21"><span class="dot"></span><span class="txt"></span></p> */
  function openNow(el) {
    var tz = el.dataset.tz || 'Europe/Belgrade', days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], sched = {};
    (el.dataset.hours || 'Mon-Sat 9-21').split(';').forEach(function (p) {
      var a = p.trim().split(/\s+/), r = a[0].split('-'), i = days.indexOf(r[0]), j = r[1] ? days.indexOf(r[1]) : i;
      var h = (a[1] || '').split('-').map(Number); if (i < 0 || !h[1]) return;
      for (var k = i; ; k = (k + 1) % 7) { sched[k] = h; if (k === j) break; }
    });
    var fmt = function (h) { return Math.floor(h) + (h % 1 ? ':' + String(Math.round(h % 1 * 60)).padStart(2, '0') : '') + 'h'; };
    var names = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub'];
    function now() {
      var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var g = function (t) { return f.find(function (x) { return x.type === t; }).value; };
      return { day: days.indexOf(g('weekday')), t: (+g('hour') % 24) + (+g('minute')) / 60 };
    }
    var txtEl = el.querySelector('.txt');
    function render() {
      var n = now(), s = sched[n.day], open = false, txt = '';
      if (s && n.t >= s[0] && n.t < s[1]) { open = true; txt = 'Otvoreno · do ' + fmt(s[1]); }
      else if (s && n.t < s[0]) txt = 'Zatvoreno · otvara se u ' + fmt(s[0]);
      else { for (var k = 1; k <= 7; k++) { var nx = sched[(n.day + k) % 7]; if (nx) { txt = 'Zatvoreno · otvara se ' + (k === 1 ? 'sutra' : names[(n.day + k) % 7]) + ' u ' + fmt(nx[0]); break; } } }
      el.classList.toggle('is-open', open); txtEl.textContent = txt;
    }
    render(); setInterval(render, 30000);
  }

  window.LSD = window.LSD || {};
  window.LSD.countUp = countUp; window.LSD.reveal = reveal; window.LSD.openNow = openNow;
})();
