// usage: node shot.mjs <page-path> <width> <name> [full|vp] [dpr]   -> OUT/<name>-<width>.png (full page in slices if tall)
import { launch, newPage, scrollThrough, sleep, BASE, OUT } from './lib.mjs';
import fs from 'node:fs';
const [page, W, name, mode = 'full', dpr = '1'] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const b = await launch();
const p = await newPage(b, +W, +W < 768 ? 844 : 900, { dpr: +dpr });
await p.goto(BASE + '/' + page, { waitUntil: 'networkidle0' });
await sleep(600);
if (mode === 'full') {
  await scrollThrough(p);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const slice = 2400; let i = 0;
  for (let y = 0; y < H; y += slice) {
    await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await sleep(250);
    await p.screenshot({ path: `${OUT}${name}-${W}-${String(i++).padStart(2, '0')}.png`, clip: { x: 0, y, width: +W, height: Math.min(slice, H - y) } });
  }
  console.log('height', H, 'slices', i);
} else {
  await p.screenshot({ path: `${OUT}${name}-${W}.png` });
}
console.log('errors', JSON.stringify(p.__log));
await b.close();
