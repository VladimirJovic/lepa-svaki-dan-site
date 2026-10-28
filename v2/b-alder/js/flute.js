/* flute.js: fluted-glass image engine (modes lens | hover | inview | scroll | static). No dependencies.

   Markup:  <div class="flute" data-mode="lens" data-flute="34" data-flute-t="28" data-flute-m="20" data-strength="2.6" data-lens="38"
                 data-park="62" data-gloss=".6" data-faint="0" data-cutout data-drift="off" data-root=".selector" role="img" aria-label="...">
              <img src srcset sizes width height alt="">      (object-position decides the crop; the same value is read here)
            </div>
   The <img> stays as the no-JS / not-yet-built picture. The strips re-use img.currentSrc, so nothing is downloaded twice.
   Touch / no-hover: hover cards clear while they are >= 70 % in view; the hero lens drifts by itself and can be steered by a horizontal drag.
   data-settle="ms": on touch the hero lens widens until the whole picture is clear once that time has passed (nobody should have to hunt for the picture on a phone).
   prefers-reduced-motion: no loops; content images are shown clear, the hero lens is parked and wide. */
(function () {
  'use strict';
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var smooth = function (a, b, x) { var t = clamp((x - a) / ((b - a) || 1)); return t * t * (3 - 2 * t); };
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COARSE = matchMedia('(hover: none)').matches;
  var WIDE = 2.6;                      // lens half-width multiplier at which every strip is clear
  var GLOSS = 'linear-gradient(90deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.03) 16%,rgba(0,0,0,0) 52%,rgba(0,0,0,.34) 100%)';

  function flute(el) {
    var img = el.querySelector('img');
    if (!img || el.__flute) return;
    var D = el.dataset;
    var o = {
      mode: D.mode || 'lens', flute: +(D.flute || 34), fluteT: +(D.fluteT || 0), fluteM: +(D.fluteM || 0),
      strength: +(D.strength || 2.6), lens: +(D.lens || 36), gloss: D.gloss !== undefined ? +D.gloss : .6,
      drift: D.drift !== 'off', settle: +(D.settle || 0), cutout: D.cutout !== undefined, park: +(D.park || 62) / 100, faint: +(D.faint || 0),
      inset: (D.inset || '0 0 0 0').split(/\s+/).map(function (v) { return (+v || 0) / 100; })   // top right bottom left, % of the box (cut-outs with transparent padding)
    };
    var host = document.createElement('div');
    host.className = 'flute__strips';
    host.setAttribute('aria-hidden', 'true');
    img.after(host);
    var s = { W: 0, H: 0, nw: 0, nh: 0, L: 0, R: 0, B: 0, V: 0, Hx: 0, Uy: 0, src: '', strips: [], gloss: [],
              raf: 0, visible: false, pointer: false, lensX: -1, lensT: -1, open: 0, openT: 0, grow: 1, growT: 1, clear: 0, clearT: 0, t0: performance.now(), frame: 0 };
    el.__flute = s;

    function build() {
      var W = el.clientWidth, H = el.clientHeight;
      if (!W || !H || !s.nw || !s.src) return;
      var fl = innerWidth < 810 ? (o.fluteM || o.flute) : innerWidth < 1200 ? (o.fluteT || o.flute) : o.flute;
      var L = clamp(Math.round(W / Math.max(8, fl)), 4, 90);
      var ox = W * o.inset[3], oy = H * o.inset[0], iw = W * (1 - o.inset[1] - o.inset[3]), ih = H * (1 - o.inset[0] - o.inset[2]);
      var z = Math.max(iw / s.nw, ih / s.nh);
      var pos = getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
      var fx = (isNaN(pos[0]) ? 50 : pos[0]) / 100, fy = (isNaN(pos[1]) ? 50 : pos[1]) / 100;
      s.W = W; s.H = H; s.L = L; s.R = W / L; s.B = s.nw * z; s.V = s.nh * z;
      s.Hx = (s.B - iw) * fx - ox; s.Uy = (s.V - ih) * fy - oy;
      host.textContent = ''; s.strips = []; s.gloss = [];
      var frag = document.createDocumentFragment();
      for (var i = 0; i < L; i++) {
        var d = document.createElement('div');
        d.style.cssText = 'position:absolute;top:0;bottom:0;left:' + (i * s.R) + 'px;width:' + (s.R + .6) + 'px;background-image:url("' + s.src + '");background-repeat:no-repeat';
        var g = document.createElement('div');
        g.style.cssText = 'position:absolute;inset:0;background:' + GLOSS + ';opacity:' + o.gloss;
        d.appendChild(g); frag.appendChild(d); s.strips.push(d); s.gloss.push(g);
      }
      host.appendChild(frag);
      if (o.cutout) img.style.visibility = 'hidden';
      if (RM) staticState();
      el.classList.add('is-built');
      paint(); kick();
    }
    function staticState() {            // reduced motion: lens parked, content images clear
      s.lensX = s.lensT = s.W * o.park; s.open = s.openT = 1;
      if (o.mode === 'lens') s.grow = s.growT = WIDE;
      s.clear = s.clearT = (o.mode === 'static' ? 0 : 1);
    }
    function paint() {
      var half = s.W * o.lens / 200 * s.grow, mid = (s.L - 1) / 2, i, a, d, sc, st;
      for (i = 0; i < s.L; i++) {
        a = (i + .5) * s.R; d = 1;       // d: 1 = ribbed, 0 = clear
        if (o.mode === 'lens') d = 1 - s.open * (1 - smooth(half * .3, half, Math.abs(a - s.lensX)));
        else if (o.mode !== 'static') { var t = mid ? Math.abs(i - mid) / mid : 0, k = clamp(s.clear * 1.7 - t * .7); d = 1 - k * k * (3 - 2 * k); }
        sc = 1 + (o.strength - 1) * d; st = s.strips[i];
        st.style.backgroundSize = (s.B / sc) + 'px ' + s.V + 'px';
        st.style.backgroundPosition = (s.R / 2 - (a + s.Hx) / sc) + 'px ' + (-s.Uy) + 'px';
        s.gloss[i].style.opacity = d * o.gloss;
      }
      if (o.faint) host.style.opacity = o.faint + (1 - o.faint) * s.clear * s.clear;
      if (o.mode !== 'lens') { var on = s.clearT > .5; el.classList.toggle('is-clear', on); if (root !== el) root.classList.toggle('is-clear', on); }
    }
    function tick() {
      s.raf = 0;
      if (!s.visible || RM) return;
      var again = false;
      if (o.mode === 'lens') {
        if (!s.pointer) {
          if (o.drift) { s.lensT = s.W * (.5 + .3 * Math.sin((performance.now() - s.t0) * .00042)); again = true; }
          else s.lensT = s.W * o.park;
          s.openT = 1;
        }
        if (s.lensX < 0) s.lensX = s.lensT;
        if (o.settle && COARSE && performance.now() - s.t0 > o.settle) s.growT = WIDE;
        s.lensX += (s.lensT - s.lensX) * .09; s.open += (s.openT - s.open) * .06; s.grow += (s.growT - s.grow) * .05;
        if (Math.abs(s.lensT - s.lensX) > .3 || Math.abs(s.openT - s.open) > .002 || Math.abs(s.growT - s.grow) > .01) again = true;
        if (COARSE && (s.frame++ & 1) && again) { s.raf = requestAnimationFrame(tick); return; }   // half rate on touch devices
      } else if (o.mode !== 'static') {
        s.clear += (s.clearT - s.clear) * .07;
        if (Math.abs(s.clearT - s.clear) > .002) again = true; else s.clear = s.clearT;
      }
      paint();
      if (again) s.raf = requestAnimationFrame(tick);
    }
    function kick() { if (!s.raf && s.visible && !RM && s.strips.length) s.raf = requestAnimationFrame(tick); }

    // ---- input
    var root = (D.root && el.closest(D.root)) || el.closest('[data-flute-root]') || el;
    if (!RM) {
      if (o.mode === 'lens') {
        root.style.touchAction = 'pan-y';
        var move = function (e) {
          var r = el.getBoundingClientRect();
          if (e.clientY < r.top || e.clientY > r.bottom) return;
          s.pointer = true; s.lensT = clamp(e.clientX - r.left, 0, r.width); s.openT = 1; kick();
        };
        root.addEventListener('pointermove', move, { passive: true });
        root.addEventListener('pointerleave', function () { s.pointer = false; kick(); });
        root.addEventListener('pointercancel', function () { s.pointer = false; kick(); });
      } else if (o.mode === 'hover') {
        if (!COARSE) {
          root.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { s.clearT = 1; kick(); } });
          root.addEventListener('pointerleave', function () { s.clearT = 0; kick(); });
        }
        root.addEventListener('focusin', function () { s.clearT = 1; kick(); });
        root.addEventListener('focusout', function () { s.clearT = COARSE ? s.clearT : 0; kick(); });
      }
    }
    var onScroll = function () {
      if (!s.visible) return;
      var r = el.getBoundingClientRect();
      s.clearT = clamp((innerHeight - r.top) / (r.height + 40)); kick();
    };
    if (o.mode === 'scroll' && !RM) addEventListener('scroll', onScroll, { passive: true });

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        s.visible = e.isIntersecting;
        if (o.mode === 'inview' && e.intersectionRatio >= .35) s.clearT = 1;                 // once seen, stays clear
        if (o.mode === 'hover' && COARSE) s.clearT = +(e.intersectionRatio >= .7);           // touch: clear while >= 70 % in view
        if (o.mode === 'scroll' && s.visible) onScroll();
      });
      if (RM && s.strips.length) { staticState(); paint(); }
      kick();
    }, { threshold: [0, .35, .7], rootMargin: '80px 0px' });
    io.observe(el);
    if (o.settle && COARSE && !RM) setTimeout(kick, o.settle + 40);      // wake the loop once the settle time has passed

    var lastW = 0, lastH = 0;
    new ResizeObserver(function () {
      var W = el.clientWidth, H = el.clientHeight;
      if (W === lastW && H === lastH) return;
      lastW = W; lastH = H; build();
    }).observe(el);

    function ready() {
      s.src = img.currentSrc || img.src; s.nw = img.naturalWidth; s.nh = img.naturalHeight;
      if (!s.nw && /\.svg(\?|$)/.test(s.src)) { s.nw = +img.getAttribute('width') || 256; s.nh = +img.getAttribute('height') || 74; }
      build();
    }
    img.addEventListener('load', ready);
    if (img.complete && (img.naturalWidth || /\.svg/.test(img.src))) ready();
  }

  function init(root) {
    (root || document).querySelectorAll('.flute:not([data-ready])').forEach(function (el) { el.setAttribute('data-ready', ''); flute(el); });
  }
  window.LSD = window.LSD || {};
  window.LSD.initFlutes = init;
  window.LSD.RM = RM; window.LSD.COARSE = COARSE;
})();
