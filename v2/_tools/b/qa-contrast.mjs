/* WCAG AA contrast audit on the RENDERED page (R2): for every visible text run the screenshot is taken with the text made transparent, so
   the pixels behind the words (photo, veil, gradient, glass plate) are real; the worst pixel (95th / 5th percentile) is compared with the
   computed text colour. Normal text needs 4.5:1, large text (>= 24 px, or >= 18.66 px bold) 3:1. Foil labels (background-clip:text) are
   judged by their solid fallback colour. Decorative aria-hidden numerals and placeholder text are skipped.
   usage: node qa-contrast.mjs [--pages a.html,b.html] [--widths 390,1440] [--states]     (--states also opens menu, search overlay and call sheet)
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, sleep, BASE } from './qa-lib.mjs';
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const pages = (arg('pages') || 'index.html,blog.html,posebna-ponuda.html,blog/hijaluronski-fileri.html,tretmani/dermatologija.html,tretmani/estetske-procedure.html,tretmani/kozmeticki-tretmani.html,tretmani/telo.html').split(',');
const widths = (arg('widths') || '390,1440').split(',').map(Number);
const states = process.argv.includes('--states');
const b = await launch(); let bad = 0, total = 0, worst = 99;
const PIX = `
(async (b64, items) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const lin = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const L = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
  return items.map((it) => {
    const x0 = Math.max(0, Math.floor(it.x)), y0 = Math.max(0, Math.floor(it.y)), w = Math.min(img.width - x0, Math.ceil(it.w)), h = Math.min(img.height - y0, Math.ceil(it.h));
    if (w < 2 || h < 2) return null;
    const d = x.getImageData(x0, y0, w, h).data, ls = [], mean = [0, 0, 0]; let n = 0;
    for (let i = 0; i < d.length; i += 4) { ls.push(L(d[i], d[i + 1], d[i + 2])); mean[0] += d[i]; mean[1] += d[i + 1]; mean[2] += d[i + 2]; n++; }
    ls.sort((a, b) => a - b);
    return { lo: ls[Math.floor(ls.length * .05)], hi: ls[Math.min(ls.length - 1, Math.floor(ls.length * .95))], mean: mean.map((m) => m / n) };
  });
})`;
async function audit(p, label, pg, W) {
  const H = await p.evaluate(() => innerHeight), total_h = await p.evaluate(() => document.documentElement.scrollHeight);
  const seen = new Map();
  const steps = [];
  for (let y = 0; y < total_h; y += Math.round(H * .8)) steps.push(y);
  const lock = await p.evaluate(() => document.documentElement.classList.contains('lock'));
  for (const y of lock ? [0] : steps) {
    if (!lock) { await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await sleep(160); }
    const items = await p.evaluate(() => {
      const out = [], vw = innerWidth, vh = innerHeight;
      const np = document.querySelector('.nav__pill'), bar = document.querySelector('#bar');
      const navB = np && getComputedStyle(document.querySelector('.nav')).position === 'fixed' ? np.getBoundingClientRect().bottom + 3 : 0;
      const barT = bar && getComputedStyle(bar).position === 'fixed' && getComputedStyle(bar).display !== 'none' && !bar.classList.contains('is-off') ? bar.getBoundingClientRect().top - 3 : vh;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; let k = 0;
      while ((n = walker.nextNode())) {
        const t = (n.textContent || '').replace(/\s+/g, ' ').trim(); if (!t) continue;
        const el = n.parentElement; if (!el || el.closest('script, style, noscript, svg, [aria-hidden="true"], [hidden], .skip, .rv-b, .rv-hint, .vh')) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        let op = 1, hid = false; for (let a = el; a && a !== document.documentElement; a = a.parentElement) { const s = getComputedStyle(a); op *= parseFloat(s.opacity); if (s.visibility === 'hidden' || s.display === 'none') hid = true; }
        if (hid || op < .05) continue;
        const r = document.createRange(); r.selectNodeContents(n); const rs = [...r.getClientRects()].filter((q) => q.width > 1 && q.height > 1);
        if (!rs.length) continue;
        const box = rs.reduce((a, q) => ({ l: Math.min(a.l, q.left), t: Math.min(a.t, q.top), r: Math.max(a.r, q.right), b: Math.max(a.b, q.bottom) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
        if (box.r < 0 || box.l > vw || box.b < 0 || box.t > vh) continue;
        if (box.t < 0 || box.b > vh || box.l < 0 || box.r > vw) continue;  // measured when fully in view (the next step); a chip half scrolled out of a row is under the scroll fade
        if (!el.closest('.nav, .bar, .menu, .sov, .csheet') && (box.t < navB || box.b > barT)) continue;   // next to a fixed bar: its edge would be sampled
        const cx = (box.l + box.r) / 2, covered = [box.t + 1, (box.t + box.b) / 2, box.b - 1].some((yy) => { const hit = document.elementFromPoint(cx, yy); return !hit || !(el.contains(hit) || hit.contains(el)); });
        if (covered) continue;   // covered by a fixed bar or an overlay: not readable there, measured elsewhere
        if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') el.setAttribute('data-nt-bg', '');
        let fg = cs.color; const fill = cs.webkitTextFillColor; if (fill && !/rgba\(0, 0, 0, 0\)|transparent/.test(fill)) fg = fill;
        const m = fg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); if (!m) continue;
        const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight) || 400;
        const id = el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + Math.round(box.l) + ',' + Math.round(box.t + scrollY);
        out.push({ id, text: t.slice(0, 34), x: box.l, y: box.t, w: box.r - box.l, h: box.b - box.t, fg: [+m[1], +m[2], +m[3]], a: (m[4] === undefined ? 1 : +m[4]) * op, large: fs >= 24 || (fs >= 18.66 && fw >= 700), fs });
      }
      return out;
    });
    if (!items.length) continue;
    await p.addStyleTag({ content: 'html.nt *,html.nt *::before,html.nt *::after{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important;-webkit-text-stroke-color:transparent !important}html.nt ::placeholder{color:transparent !important}[data-nt-bg]{background:none !important}' });
    await p.evaluate(() => document.documentElement.classList.add('nt'));
    const shot = await p.screenshot({ encoding: 'base64' });
    await p.evaluate(() => document.documentElement.classList.remove('nt'));
    const px = await p.evaluate(PIX + '(' + JSON.stringify(shot) + ',' + JSON.stringify(items) + ')');
    items.forEach((it, i) => {
      const s = px[i]; if (!s) return;
      const lum = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
      const mix = it.fg.map((v, k) => v * it.a + s.mean[k] * (1 - it.a));
      const lf = lum(mix);
      const worstBg = lf > (s.lo + s.hi) / 2 ? s.hi : s.lo;        // light text: the lightest pixels behind it hurt, dark text: the darkest
      const cr = (Math.max(lf, worstBg) + .05) / (Math.min(lf, worstBg) + .05);
      const need = it.large ? 3 : 4.5;
      if (process.env.QA_DEBUG && it.id.includes(process.env.QA_DEBUG)) console.log('DEBUG', it.id, JSON.stringify({ lo: s.lo, hi: s.hi, mean: s.mean, lf, cr, box: [it.x, it.y, it.w, it.h] }));
      const key = it.id; const prev = seen.get(key);
      if (!prev || cr < prev.cr) seen.set(key, { ...it, cr, need });
    });
  }
  let nbad = 0;
  for (const r of seen.values()) { total++; worst = Math.min(worst, r.cr); if (r.cr < r.need) { bad++; nbad++; console.log(`  ✗ ${label}: ${r.id} "${r.text}" ${r.cr.toFixed(2)}:1 < ${r.need} (${r.fs}px, rgb ${r.fg.map(Math.round).join(',')})`); } }
  return seen.size;
}
for (const pg of pages) {
  for (const W of widths) {
    const p = await newPage(b, W, W < 768 ? 844 : 900);
    await p.goto(`${BASE}/${pg}`, { waitUntil: 'networkidle0' }); await sleep(600);
    await p.evaluate(() => { document.documentElement.classList.add('reveal-fallback'); document.querySelector('.wipe')?.remove(); document.querySelectorAll('.flute').forEach((f) => (f.style.transition = 'none')); });
    await p.addStyleTag({ content: '.bar{transition:none !important}' });
    const n = await audit(p, `${pg} @${W}`, pg, W);
    console.log(`${pg} @${W}: ${n} text runs`);
    if (states) {
      if (W < 1200) { await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.click('.nav .burger'); await sleep(600); await audit(p, `${pg} @${W} menu`, pg, W); await p.keyboard.press('Escape'); await sleep(500); }
      await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await p.click('.nav__s'); await sleep(500); await p.type('#sq', 'akne'); await sleep(500); await audit(p, `${pg} @${W} search "akne"`, pg, W);
      await p.evaluate(() => { const i = document.querySelector('#sq'); i.value = ''; i.dispatchEvent(new Event('input')); }); await sleep(400); await audit(p, `${pg} @${W} search idle`, pg, W);
      await p.evaluate(() => { const i = document.querySelector('#sq'); i.value = 'xyzxyz'; i.dispatchEvent(new Event('input')); }); await sleep(400); await audit(p, `${pg} @${W} search none`, pg, W);
      await p.keyboard.press('Escape'); await sleep(500);
      if (W < 810) { await p.evaluate(() => window.LSD.sheet.show('call')); await sleep(600); await audit(p, `${pg} @${W} call sheet`, pg, W); }
    }
    await p.close();
  }
}
await b.close();
console.log(`${total} text runs audited, lowest contrast ${worst.toFixed(2)}:1`, bad ? `\n${bad} below AA` : '\nall text meets AA');
process.exit(bad ? 1 : 0);
