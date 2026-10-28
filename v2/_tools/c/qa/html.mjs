// Static HTML checks over every page: unique ids, landmarks, img attributes, rel on _blank, meta, brand credit, forbidden words / em dash.
import fs from 'node:fs';
import path from 'node:path';
import { SITE } from './lib.mjs';
const pages = [];
(function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets') walk(p); } else if (e.name.endsWith('.html')) pages.push(p); }); })(SITE);
const bad = [];
const forbidden = new RegExp(['lu' + 'mine', 'al' + 'der', 'lu' + 'zia', 'fra' + 'mer', String.fromCharCode(0x2014)].join('|'), 'i');
for (const f of pages) {
  const s = fs.readFileSync(f, 'utf8'), rel = path.relative(SITE, f);
  const ids = [...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) bad.push(`${rel}: duplicate ids ${[...new Set(dup)].join(',')}`);
  for (const m of s.matchAll(/<img\b[^>]*>/g)) { const t = m[0]; if (!/\salt="/.test(t)) bad.push(`${rel}: img without alt ${t.slice(0, 60)}`); if (!/\swidth="\d+"/.test(t) || !/\sheight="\d+"/.test(t)) bad.push(`${rel}: img without width/height ${t.slice(0, 80)}`); }
  for (const m of s.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) bad.push(`${rel}: _blank without noopener`);
  if (!/<meta name="robots" content="noindex">/.test(s)) bad.push(`${rel}: no noindex`);
  if (/rel="canonical"/.test(s)) bad.push(`${rel}: has canonical`);
  if (!/<title>[^<]{8,}<\/title>/.test(s)) bad.push(`${rel}: title`);
  if (!/<meta name="description" content="[^"]{30,}">/.test(s)) bad.push(`${rel}: description`);
  for (const lm of ['<header class="nav"', '<main id="main"', '<footer class="dark foot"', 'aria-label="Glavna navigacija"', 'id="bar"', 'role="region" aria-label="Brze akcije"']) if (!s.includes(lm)) bad.push(`${rel}: missing ${lm}`);
  if (!s.includes('Pripremio ECHOSYSTEM-MOTHER AGENCY')) bad.push(`${rel}: credit line missing`);
  if (forbidden.test(s)) bad.push(`${rel}: forbidden word / em dash`);
  if (/\[\[dopuniti/.test(s)) bad.push(`${rel}: raw placeholder token`);
  const imgs = [...s.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const eager = imgs.filter((t) => !/loading="lazy"/.test(t)); if (eager.length > 2) bad.push(`${rel}: ${eager.length} non-lazy images`);
  if (/<script src="[^"]*" defer><\/script>/.test(s) === false) bad.push(`${rel}: scripts`);
}
// shell identical on every page (link form normalised: "#x" on the home == "index.html#x" on sub pages; comments ignored)
const norm = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/(href|src|action)="(?:\.\.\/)?/g, '$1="').replace(/href="index\.html#/g, 'href="#').replace(/href="index\.html"/g, 'href="#top"').replace(/ aria-current="[^"]*"/g, '').replace(/\s+/g, '');
const top = (s) => { const i = s.indexOf('<a class="skip"'); return norm(s.slice(i, s.indexOf('<main id="main">', i))); };
const bottom = (s) => { const i = s.indexOf('<footer class="dark foot"'); const ends = ['<dialog', '<script', '<noscript'].map((t) => s.indexOf(t, i)).filter((x) => x > 0); return norm(s.slice(i, Math.min(...ends))); };
const ref = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8'), rt = top(ref), rb = bottom(ref);
for (const f of pages) { const s = fs.readFileSync(f, 'utf8'), n = path.relative(SITE, f); if (top(s) !== rt) bad.push(`${n}: header/menu differs from home`); if (bottom(s) !== rb) bad.push(`${n}: footer/bar differs from home`); }
console.log(`${pages.length} pages checked`);
console.log(bad.length ? 'PROBLEMS:\n' + bad.join('\n') : 'html: ids unique, alt + size on every img, noopener, noindex, no canonical, credit line, shell identical, no template names / em dash / raw tokens');
