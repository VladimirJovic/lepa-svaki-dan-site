/* usage: node qa-slices.mjs <page> <width> <name> [sliceHeight=1750]
   Full-page capture in slices (a single fullPage screenshot repeats itself above 16384 px). Writes <OUT>/<name>-<width>-<n>.png and prints the count.
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, scrollThrough, sleep, BASE, OUT } from './qa-lib.mjs';
const [page, width = '390', name = 'sl', sliceH = '1750'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const W = +width, H = +sliceH;
const b = await launch();
const p = await newPage(b, W, W < 768 ? 844 : 900, { dpr: 1 });
await p.goto(`${BASE}/${page}`, { waitUntil: 'networkidle0' });
await sleep(700); await scrollThrough(p);
await p.addStyleTag({ content: '.nav,.bar{position:absolute !important}' });        // fixed bars would otherwise be repeated in every slice
const total = await p.evaluate(() => document.documentElement.scrollHeight);
let n = 0;
for (let y = 0; y < total; y += H, n++) {
  await p.screenshot({ path: `${OUT}/${name}-${W}-${n}.png`, clip: { x: 0, y, width: W, height: Math.min(H, total - y) }, captureBeyondViewport: true });
}
console.log(`${n} slices of ${H}px (page ${total}px) -> ${OUT}/${name}-${W}-N.png`, p.__log.errors.length ? p.__log.errors : '');
await b.close();
