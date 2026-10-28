// characters per line of the article prose at several widths (target 45-75)
import { launch, newPage, sleep, BASE } from './lib.mjs';
const b = await launch();
const pg = process.argv[2] || 'blog/hijaluronski-fileri.html';
for (const W of [320, 360, 390, 414, 768, 1024, 1100, 1280, 1440]) {
  const p = await newPage(b, W, 900);
  await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(300);
  const r = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.prose p, .prose li').forEach((el) => {
      const tn = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) tn.push(n);
      const lines = []; let lastTop = null, cnt = 0;
      tn.forEach((t) => { for (let i = 0; i < t.length; i++) { const rg = document.createRange(); rg.setStart(t, i); rg.setEnd(t, i + 1); const rc = rg.getClientRects()[0]; if (!rc) { cnt++; continue; } if (lastTop === null || Math.abs(rc.top - lastTop) > 6) { if (lastTop !== null) lines.push(cnt); cnt = 0; lastTop = rc.top; } cnt++; } });
      lines.push(cnt);
      if (lines.length >= 3) out.push(...lines.slice(0, -1)); // skip the (short) last line
    });
    out.sort((a, b) => a - b);
    const q = (x) => out[Math.min(out.length - 1, Math.floor(out.length * x))];
    const el = document.querySelector('.prose');
    return { n: out.length, median: q(.5), p90: q(.9), max: out[out.length - 1], proseW: Math.round(el.getBoundingClientRect().width), fs: getComputedStyle(el).fontSize };
  });
  console.log(W, JSON.stringify(r));
  await p.close();
}
await b.close();
