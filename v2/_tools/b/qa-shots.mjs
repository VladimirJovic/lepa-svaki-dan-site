/* usage: node qa-shots.mjs <page> <width[,width...]> [name] [--viewport] [--rm]   (writes PNGs into the scratchpad shots folder)
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, scrollThrough, sleep, BASE, OUT } from './qa-lib.mjs';
const [page, widths = '390', name] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const vp = process.argv.includes('--viewport'), rm = process.argv.includes('--rm');
const b = await launch();
for (const W of widths.split(',').map(Number)) {
  const p = await newPage(b, W, W < 768 ? 844 : 900, { dpr: 1, rm });
  await p.goto(`${BASE}/${page}`, { waitUntil: 'networkidle0' });
  await sleep(800);
  if (!vp) await scrollThrough(p);
  const f = `${OUT}/${name || page.replace(/[\/.]/g, '_')}-${W}${vp ? '-vp' : ''}.png`;
  await p.screenshot({ path: f, fullPage: !vp });
  console.log(f, p.__log.errors.length ? p.__log.errors : '', p.__log.notfound.length ? p.__log.notfound : '');
  await p.close();
}
await b.close();
