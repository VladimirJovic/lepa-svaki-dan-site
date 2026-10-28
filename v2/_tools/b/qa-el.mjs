/* usage: node qa-el.mjs <page> <selector> <width[,width]> [name]  (screenshot of one element, scrolled into view first)  Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, scrollThrough, sleep, BASE, OUT } from './qa-lib.mjs';
const [page, sel, widths = '390', name] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const b = await launch();
for (const W of widths.split(',').map(Number)) {
  const p = await newPage(b, W, W < 768 ? 844 : 900);
  await p.goto(`${BASE}/${page}`, { waitUntil: 'networkidle0' });
  await sleep(800); await scrollThrough(p);
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start', behavior: 'instant' }), sel);
  await sleep(1200);
  const el = await p.$(sel);
  const f = `${OUT}/${name || sel.replace(/\W/g, '')}-${W}.png`;
  await el.screenshot({ path: f });
  console.log(f, p.__log.errors);
  await p.close();
}
await b.close();
