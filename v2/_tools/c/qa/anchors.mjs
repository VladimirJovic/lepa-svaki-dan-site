import { launch, newPage, sleep, BASE, OUT } from './lib.mjs';
const b = await launch();
for (const W of [390, 1440]) {
  const p = await newPage(b, W);
  await p.goto(`${BASE}/tretmani/telo.html`, { waitUntil: 'load' }); await sleep(500);
  for (const [sel, id] of [['.shero__ctas .btn--primary', 'tekstovi'], ['.shero__ctas .btn--hero', 'cenovnik']]) {
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(200);
    await p.click(sel); await sleep(1300);
    const r = await p.evaluate((id) => { const h = document.querySelector('#' + id + ' h2').getBoundingClientRect(); const n = document.querySelector('.nav__pill').getBoundingClientRect(); return { h2Top: Math.round(h.top), navBottom: Math.round(n.bottom), vh: innerHeight }; }, id);
    console.log(W, id, JSON.stringify(r), r.h2Top > r.navBottom && r.h2Top < r.vh * .5 ? 'OK' : 'CHECK');
    await p.screenshot({ path: `${OUT}anchor-${id}-${W}.png` });
  }
  await p.close();
}
await b.close();
