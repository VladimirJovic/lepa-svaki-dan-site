/* Link crawl of preview B (static, no browser): every html page of b-alder, every href / src / srcset / data-video / url() reference.
   Checks that files exist, that #fragments exist as ids on the target page, that ?grupa=tab:n names a real price-list group,
   and lists external hosts. Exit code 1 on any broken link.      Pripremio ECHOSYSTEM-MOTHER AGENCY */
import fs from 'node:fs';
import path from 'node:path';
import { SITE, allPages } from './qa-lib.mjs';
const C = JSON.parse(fs.readFileSync('/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/_shared/content/content.json', 'utf8'));
const groups = new Set(); C.pricing.tabs.forEach((t) => t.groups.forEach((g, i) => groups.add(`${t.id}:${i}`)));
const pages = allPages();
const idsOf = {};
const rd = (p) => fs.readFileSync(path.join(SITE, p), 'utf8');
for (const p of pages) idsOf[p] = new Set([...rd(p).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
let bad = 0, total = 0; const ext = new Map();
const fail = (page, msg) => { bad++; console.log(`  ✗ ${page}: ${msg}`); };
const resolve = (page, ref) => path.normalize(path.join(path.dirname(page), ref));
for (const page of pages) {
  const html = rd(page).replace(/<!--[\s\S]*?-->/g, '');
  const refs = [];
  for (const m of html.matchAll(/\s(href|src|poster|data-video|data-video-m)="([^"]*)"/g)) refs.push([m[1], m[2]]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) m[1].split(',').forEach((s) => refs.push(['srcset', s.trim().split(/\s+/)[0]]));
  for (const m of html.matchAll(/imagesrcset="([^"]*)"/g)) m[1].split(',').forEach((s) => refs.push(['imagesrcset', s.trim().split(/\s+/)[0]]));
  for (const [kind, ref] of refs) {
    total++;
    if (!ref || /^(mailto:|tel:|data:|javascript:)/.test(ref)) { if (/^tel:\+\d+$/.test(ref) || /^mailto:[^@\s]+@[^@\s]+$/.test(ref) || !ref.match(/^(mailto|tel):/)) continue; fail(page, `malformed ${ref}`); continue; }
    if (/^https?:\/\//.test(ref)) { const h = new URL(ref).host; ext.set(h, (ext.get(h) || 0) + 1); continue; }
    const [pathAndQuery, frag] = ref.split('#'); const [rel, query] = pathAndQuery.split('?');
    const target = rel === '' ? page : resolve(page, rel);
    if (rel !== '' && !fs.existsSync(path.join(SITE, target))) { fail(page, `${kind} → missing file ${ref}`); continue; }
    if (kind === 'href' && query) { const g = query.match(/(?:^|&)grupa=([^&]+)/); if (g && !groups.has(decodeURIComponent(g[1]))) fail(page, `unknown price-list group in ${ref}`); }
    if (frag && target.endsWith('.html')) {
      const f = frag.split('/')[0];
      if (!idsOf[target]?.has(f)) fail(page, `#${frag} not found on ${target} (from ${ref})`);
    }
  }
}
for (const css of ['css/main.css', 'css/pages.css', 'assets/brand/brand.css']) {
  const t = fs.readFileSync(path.join(SITE, css), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of t.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) { total++; if (/^(data:|https?:|#)/.test(m[1])) continue; const f = resolve(css, m[1]); if (!fs.existsSync(path.join(SITE, f))) fail(css, `url(${m[1]}) missing`); }
}
console.log(`${pages.length} pages, ${total} references checked; external hosts: ${[...ext].map(([h, n]) => `${h} (${n})`).join(', ') || 'none'}`);
console.log(bad ? `${bad} broken` : 'no broken links');
process.exit(bad ? 1 : 0);
