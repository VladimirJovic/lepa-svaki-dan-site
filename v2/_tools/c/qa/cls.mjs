// Layout shift (CLS) of the home, a segment page and an article on a phone and on desktop, including the lazy search index loading
import { launch, newPage, sleep, scrollThrough, BASE } from './lib.mjs';
const b = await launch(); let worst = 0;
for (const [pg, W] of [['index.html', 390], ['index.html', 1440], ['tretmani/telo.html', 390], ['blog/hijaluronski-fileri.html', 390], ['blog.html', 1440]]) {
  const p = await newPage(b, W, W < 768 ? 844 : 900);
  await p.evaluateOnNewDocument(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(1200); await scrollThrough(p, 700); await sleep(600);
  const v = await p.evaluate(() => window.__cls); worst = Math.max(worst, v);
  console.log(`${pg} @${W}: CLS ${v.toFixed(4)}`); await p.close();
}
await b.close(); console.log(worst < 0.1 ? 'CLS good (< 0.1)' : 'CLS needs work');
