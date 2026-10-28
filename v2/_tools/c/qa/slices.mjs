// usage: node slices.mjs <page-path> <width> <name> [sliceHeight] [dpr] [query]  -> OUT/<name>-<width>-NN.png (consecutive viewport-sized slices)
import { launch, newPage, scrollThrough, sleep, BASE, OUT } from './lib.mjs';
import fs from 'node:fs';
const [page, W, name, sl = '1100', dpr = '1', extra = ''] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const b = await launch();
const p = await newPage(b, +W, +W < 768 ? 844 : 900, { dpr: +dpr });
await p.goto(BASE + '/' + page + extra, { waitUntil: 'networkidle0' });
await sleep(600);
await scrollThrough(p);
const H = await p.evaluate(() => document.documentElement.scrollHeight);
const slice = +sl; let i = 0;
await p.addStyleTag({ content: '.nav,.bar{visibility:hidden!important}' });
for (let y = 0; y < H; y += slice) {
  await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await sleep(220);
  await p.screenshot({ path: `${OUT}${name}-${W}-${String(i++).padStart(2, '0')}.png`, clip: { x: 0, y, width: +W, height: Math.min(slice, H - y) } });
}
console.log('height', H, 'slices', i, JSON.stringify(p.__log));
await b.close();
