// usage: node probe.mjs <page> <width> '<js expression returning JSON>'
import { launch, newPage, sleep, BASE } from './lib.mjs';
const [page, W, expr] = process.argv.slice(2);
const b = await launch();
const p = await newPage(b, +W, +W < 768 ? 844 : 900);
await p.goto(BASE + '/' + page, { waitUntil: 'networkidle0' });
await sleep(500);
console.log(JSON.stringify(await p.evaluate(expr), null, 1));
console.log(JSON.stringify(p.__log));
await b.close();
