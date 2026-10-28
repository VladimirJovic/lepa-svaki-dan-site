// Crawl every internal link / asset reference of every html page of the site. Pripremio ECHOSYSTEM-MOTHER AGENCY
// Checks: file exists, #hash exists in the target page, ?grupa= / ?usluga= point to a real price-list group / service.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { SITE } from './lib.mjs';

const pages = [];
(function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets') walk(p); } else if (e.name.endsWith('.html')) pages.push(p); }); })(SITE);

const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(SITE, 'assets/content.js'), 'utf8'), ctx);
const C = ctx.window.LSD_CONTENT;
const groups = new Set(), services = new Set();
C.pricing.tabs.forEach((t) => t.groups.forEach((g, gi) => { groups.add(`${t.id}:${gi}`); g.services.forEach((s) => services.add(s.id)); }));

const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const cache = {};
const html = (f) => cache[f] || (cache[f] = fs.readFileSync(f, 'utf8'));
let checked = 0; const bad = [];
for (const f of pages) {
  const src = html(f), rel = path.relative(SITE, f);
  const refs = [];
  for (const m of src.matchAll(/\s(?:href|src)="([^"]*)"/g)) refs.push(m[1]);
  for (const m of src.matchAll(/\ssrcset="([^"]*)"/g)) m[1].split(',').forEach((x) => refs.push(x.trim().split(/\s+/)[0]));
  for (const m of src.matchAll(/\simagesrcset="([^"]*)"/g)) m[1].split(',').forEach((x) => refs.push(x.trim().split(/\s+/)[0]));
  for (const r of new Set(refs)) {
    if (!r || /^(https?:|mailto:|tel:|data:|javascript:)/.test(r)) continue;
    checked++;
    if (r.startsWith('#')) { if (r.length > 1 && !idsOf(src).has(decodeURIComponent(r.slice(1)))) bad.push(`${rel}: in-page anchor ${r} has no target`); continue; }
    const [pathAndQuery, hash] = r.split('#');
    const [p, q] = pathAndQuery.split('?');
    const target = path.resolve(path.dirname(f), decodeURIComponent(p || ''));
    if (!p) { /* query only */ } else if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) { bad.push(`${rel}: missing file ${r}`); continue; }
    if (hash && p.endsWith('.html')) { if (!idsOf(html(target)).has(decodeURIComponent(hash.split('/')[0]))) bad.push(`${rel}: ${r} -> id #${hash} not found in ${path.relative(SITE, target)}`); }
    if (q) {
      const sp = new URLSearchParams(q);
      if (sp.get('grupa') && !groups.has(sp.get('grupa'))) bad.push(`${rel}: ${r} -> unknown price-list group`);
      if (sp.get('usluga') && !services.has(sp.get('usluga'))) bad.push(`${rel}: ${r} -> unknown service id`);
    }
  }
}
console.log(`pages: ${pages.length}, references checked: ${checked}`);
console.log(bad.length ? 'BROKEN:\n' + bad.join('\n') : 'no broken links');
process.exit(bad.length ? 1 : 0);
