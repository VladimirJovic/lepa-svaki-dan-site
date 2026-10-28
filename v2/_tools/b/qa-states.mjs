/* Visual states for review (PNGs into the scratchpad shots folder): search overlay (idle, results, empty), call sheet, menu, locations split
   (hover / tap), comment mode. usage: node qa-states.mjs                                                       Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, sleep, BASE, OUT } from './qa-lib.mjs';
const b = await launch();
const shot = (p, n) => p.screenshot({ path: `${OUT}/st-${n}.png` });
{
  const p = await newPage(b, 390, 844);
  await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' }); await sleep(2300);
  await p.tap('.hsearch'); await sleep(700); await shot(p, 'search-idle-390');
  await p.type('#sq', 'ozilci od akni'); await sleep(700); await shot(p, 'search-results-390');
  await p.evaluate(() => { const i = document.querySelector('#sq'); i.value = 'qqzzxx'; i.dispatchEvent(new Event('input')); }); await sleep(500); await shot(p, 'search-none-390');
  await p.keyboard.press('Escape'); await sleep(500);
  await p.tap('.bar__a[data-sheet="call"]'); await sleep(700); await shot(p, 'sheet-call-390');
  await p.keyboard.press('Escape'); await sleep(500);
  await p.tap('.bar__a[data-sheet="wa"]'); await sleep(700); await shot(p, 'sheet-wa-390');
  await p.keyboard.press('Escape'); await sleep(400);
  await p.tap('.nav .burger'); await sleep(700); await shot(p, 'menu-390');
  await p.close();
}
{
  const p = await newPage(b, 1440, 900);
  await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' }); await sleep(2300);
  await p.click('.hsearch'); await sleep(600); await shot(p, 'search-idle-1440');
  await p.type('#sq', 'kako smanjiti obim'); await sleep(700); await shot(p, 'search-results-1440');
  await p.keyboard.press('Escape'); await sleep(400);
  await p.evaluate(() => document.querySelector('#lokacije .split').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(800);
  await shot(p, 'split-rest-1440');
  const box = await p.evaluate(() => { const r = document.querySelectorAll('.half')[1].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 80 }; });
  await p.mouse.move(box.x, box.y); await sleep(1000); await shot(p, 'split-hover2-1440');
  await p.close();
}
{
  const p = await newPage(b, 390, 844);
  await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' }); await sleep(2300);
  await p.evaluate(() => document.querySelector('#lokacije .split').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(600);
  await shot(p, 'split-1-390');
  await p.evaluate(() => document.querySelector('.split__dot[data-go="1"]').click()); await sleep(900); await shot(p, 'split-2-390');
  await p.close();
}
{
  const p = await newPage(b, 390, 844);
  await p.goto(`${BASE}/index.html?komentari`, { waitUntil: 'networkidle0' }); await sleep(2300); await shot(p, 'review-hero-390');
  await p.evaluate(() => document.querySelector('#usluge').scrollIntoView({ behavior: 'instant', block: 'start' })); await sleep(500); await shot(p, 'review-price-390');
  await p.close();
  const q = await newPage(b, 1440, 900);
  await q.goto(`${BASE}/blog/hijaluronski-fileri.html#komentari`, { waitUntil: 'networkidle0' }); await sleep(1200); await shot(q, 'review-article-1440');
  await q.close();
}
await b.close(); console.log('done');
