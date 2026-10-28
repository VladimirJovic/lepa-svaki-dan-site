/* axe-core accessibility run on the rendered pages and on the open dialogs (menu, search overlay with results, call sheet).
   usage: node qa-axe.mjs [--pages a.html,b.html]                                                       Pripremio ECHOSYSTEM-MOTHER AGENCY */
import fs from 'node:fs';
import { launch, newPage, sleep, BASE, allPages } from './qa-lib.mjs';
const AXE = fs.readFileSync('/Users/vladajovic/.npm/_npx/8003d8991b0d346b/node_modules/axe-core/axe.min.js', 'utf8');
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const pages = arg('pages') ? arg('pages').split(',') : ['index.html', 'blog.html', 'posebna-ponuda.html', 'blog/hijaluronski-fileri.html', 'tretmani/dermatologija.html', 'tretmani/telo.html'];
const b = await launch(); let bad = 0;
async function run(p, label) {
  await p.evaluate(AXE);
  const v = await p.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, ex: x.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + ((n.any[0] && n.any[0].message) || '').slice(0, 100)) })));
  if (v.length) { bad += v.length; console.log(`  ✗ ${label}: ` + JSON.stringify(v)); } else console.log(`  ✓ ${label}: 0 violations`);
}
for (const pg of pages) for (const W of [390, 1440]) {
  const p = await newPage(b, W, W < 768 ? 844 : 900);
  await p.goto(`${BASE}/${pg}`, { waitUntil: 'networkidle0' }); await sleep(700);
  await p.evaluate(() => { document.documentElement.classList.add('reveal-fallback'); document.querySelector('.wipe')?.remove(); });
  await run(p, `${pg} @${W}`);
  if (pg === 'index.html') {
    await p.evaluate(() => document.querySelectorAll('.tab').forEach((t) => t.click()));
    await p.click('.nav__s'); await sleep(500); await run(p, `${pg} @${W} search idle`);
    await p.type('#sq', 'akne'); await sleep(600); await run(p, `${pg} @${W} search results`);
    await p.evaluate(() => { const i = document.querySelector('#sq'); i.value = 'qqzz'; i.dispatchEvent(new Event('input')); }); await sleep(400); await run(p, `${pg} @${W} search empty`);
    await p.keyboard.press('Escape'); await sleep(500);
    if (W < 810) { await p.evaluate(() => window.LSD.sheet.show('call')); await sleep(500); await run(p, `${pg} @${W} call sheet`); await p.keyboard.press('Escape'); await sleep(400); await p.click('.nav .burger'); await sleep(600); await run(p, `${pg} @${W} menu`); }
  }
  await p.close();
}
await b.close();
console.log(bad ? `\n${bad} violation(s)` : '\naxe: no violations');
process.exit(bad ? 1 : 0);
