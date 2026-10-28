// R3: distance between a heading's box and the line right under it (and the label right above it) on every page, phone + desktop
import fs from 'node:fs'; import path from 'node:path';
import { launch, newPage, sleep, scrollThrough, BASE, SITE } from './lib.mjs';
const pages = []; (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets') walk(p); } else if (e.name.endsWith('.html')) pages.push(path.relative(SITE, p)); }); })(SITE);
const only = process.argv[2]; const b = await launch(); let n = 0, bad = []; const max = { m: 0, d: 0 };
for (const pg of pages.filter((p) => !only || p.includes(only))) for (const W of [320, 390, 768, 1024, 1440]) {
  const p = await newPage(b, W, 900); await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(250); await scrollThrough(p, 900);
  const r = await p.evaluate(() => {
    const out = []; const lim = innerWidth < 768 ? 8.01 : 10.01;
    const vis = (e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length > 0; };
    document.querySelectorAll('h1, h2, h3').forEach((h) => {
      if (!vis(h) || h.closest('.sov, #search-ov, .sheet, [hidden], .menu:not(.is-open)')) return;
      // the line directly under: next element that carries text (skip decorative)
      let nx = h.nextElementSibling; while (nx && (!vis(nx) || !(nx.textContent || '').trim() || nx.getAttribute('aria-hidden') === 'true')) nx = nx.nextElementSibling;
      const hb = h.getBoundingClientRect();
      if (nx && !nx.matches('ul, ol, .acards, .scards, .shells, .snap-row, .works, .tposts, .split, details, .tabs-bar, .price__search, .shell, .price__chips, .otease__list, .toc, .contact__locs, .cta__btns, .hsearch, .hero__search, .sec-head__btn, .otease__btn')) {
        const nb = nx.getBoundingClientRect(); const g = nb.top - hb.bottom;
        const sibTitle = h.closest('.grp, .shell__bar, .pbox__row');
        if (!sibTitle) out.push({ k: `${h.tagName} "${h.textContent.trim().slice(0, 26)}" -> ${nx.tagName.toLowerCase()}.${(nx.className + '').split(' ')[0]}`, g: Math.round(g * 10) / 10, lim });
      }
      // a label (eyebrow) right above
      const pv = h.previousElementSibling; if (pv && vis(pv) && pv.classList.contains('eyebrow')) { const g = hb.top - pv.getBoundingClientRect().bottom; out.push({ k: `eyebrow -> ${h.tagName} "${h.textContent.trim().slice(0, 20)}"`, g: Math.round(g * 10) / 10, lim }); }
    });
    return out;
  });
  r.forEach((x) => { n++; if (W < 768) max.m = Math.max(max.m, x.g); else max.d = Math.max(max.d, x.g); if (x.g > x.lim) bad.push(`${pg} @${W}: ${x.k} = ${x.g}px (limit ${x.lim})`); });
  await p.close();
}
await b.close();
console.log(`${n} heading gaps measured; max on phones ${max.m}px (limit 8), max from 768px ${max.d}px (limit 10)`);
console.log(bad.length ? 'TOO BIG:\n' + [...new Set(bad)].slice(0, 40).join('\n') : 'all heading gaps within the limit');
