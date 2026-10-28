// axe-core on one page of every kind at 390 and 1440 (WCAG 2.x A/AA + best practice rules)
import { launch, newPage, sleep, BASE } from './lib.mjs';
const AXE = '/Users/vladajovic/.npm/_npx/8003d8991b0d346b/node_modules/axe-core/axe.min.js';
const pages = ['index.html', 'blog.html', 'blog/hijaluronski-fileri.html', 'blog/laserska-dermatologija-candela-laserima.html', 'blog/bezbolna-i-bezbedna.html', 'tretmani/dermatologija.html', 'tretmani/estetske-procedure.html', 'tretmani/kozmeticki-tretmani.html', 'tretmani/telo.html', 'posebna-ponuda.html'];
const b = await launch(); let total = 0;
for (const pg of pages) for (const W of [390, 1440]) {
  const p = await newPage(b, W, W < 768 ? 844 : 900);
  await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(900);
  await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
  await sleep(1800);
  await p.addScriptTag({ path: AXE });
  const r = await p.evaluate(async () => { const x = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] }); return x.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.any[0] ? n.any[0].message : n.failureSummary || '').slice(0, 130)) })); });
  if (r.length) { total += r.length; console.log(`${pg} @${W}`); r.forEach((v) => console.log(`  [${v.impact}] ${v.id} x${v.n}\n     ${v.sample.join('\n     ')}`)); }
  await p.close();
}
await b.close(); console.log(total ? `${total} violation groups` : 'axe: no violations');
