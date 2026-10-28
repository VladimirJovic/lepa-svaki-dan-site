// usage: node snap-el.mjs <page> <width> <selector> <name> [dpr] [padTop]  -> element screenshot (scrolled into view, nav hidden)
import { launch, newPage, sleep, scrollThrough, BASE, OUT } from './lib.mjs';
import fs from 'node:fs'; fs.mkdirSync(OUT, { recursive: true });
const [page, W, sel, name, dpr = '1'] = process.argv.slice(2);
const b = await launch(); const p = await newPage(b, +W, +W < 768 ? 844 : 900, { dpr: +dpr });
await p.goto(`${BASE}/${page}`, { waitUntil: 'load' }); await sleep(500); await scrollThrough(p, 700);
await p.addStyleTag({ content: '.nav,.bar{visibility:hidden!important}' });
const el = await p.$(sel); await el.evaluate((e) => e.scrollIntoView({ block: 'start', behavior: 'instant' })); await sleep(600);
await el.screenshot({ path: `${OUT}${name}-${W}.png` });
console.log(JSON.stringify(p.__log));
await b.close();
