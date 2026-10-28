/* R3 audit: the gap between every h1/h2/h3 and the sub-line / lead that follows it must be <= 10 px from 810 px and <= 8 px on a phone.
   One CSS custom property drives it (--head-gap, css/main.css). Checks every page at 390 and 1440 (and the read value of --head-gap).
   usage: node qa-spacing.mjs [--pages a.html,b.html]                                                    Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, sleep, BASE, allPages } from './qa-lib.mjs';
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const pages = arg('pages') ? arg('pages').split(',') : allPages();
const b = await launch(); let bad = 0, checked = 0;
for (const pg of pages) {
  for (const W of [390, 1440]) {
    const p = await newPage(b, W, W < 768 ? 844 : 900);
    await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(400);
    await p.evaluate(() => document.documentElement.classList.add('reveal-fallback'));      // no pending reveal transforms while measuring
    const res = await p.evaluate((W) => {
      const lim = W >= 810 ? 10 : 8, out = [], gapVar = getComputedStyle(document.documentElement).getPropertyValue('--head-gap').trim();
      document.querySelectorAll('h1, h2, h3, h4').forEach((h) => {
        if (h.closest('[hidden], .menu:not(.is-open), .sov:not(.is-open), .csheet:not(.is-open)')) return;
        const hr = h.getBoundingClientRect(); if (!hr.width) return;
        let host = h; while (host.parentElement && host.parentElement.children.length === 1 && host.parentElement !== document.body) host = host.parentElement;   // h3 > a
        const n = host.nextElementSibling; if (!n) return;
        const tag = n.tagName; if (!/^(P|DIV|SPAN)$/.test(tag) || n.matches('.cline, .chips, .split__ui')) return;
        const first = tag === 'P' ? n : n.firstElementChild; if (!first || !/^(P|SPAN|DIV)$/.test(first.tagName) || !(first.textContent || '').trim()) return;
        if (getComputedStyle(n).display === 'none') return;
        const nr = n.getBoundingClientRect(); if (!nr.height) return;
        const gap = Math.round((nr.top - hr.bottom) * 10) / 10;
        if (gap < -2) return;                                                                 // beside, not below
        out.push({ gap, lim, h: (h.className || h.tagName) + ' "' + h.textContent.trim().slice(0, 28) + '"', n: (n.className || tag) });
      });
      return { out, gapVar };
    }, W);
    for (const r of res.out) { checked++; if (r.gap > r.lim) { bad++; console.log(`  ✗ ${pg} @${W}: ${r.h} -> .${String(r.n).split(' ')[0]} gap ${r.gap}px > ${r.lim}px`); } }
    await p.close();
    if (pg === pages[0]) console.log(`${pg} @${W}: --head-gap = ${res.gapVar}`);
  }
}
await b.close();
console.log(`${checked} heading/sub-line pairs measured on ${pages.length} pages`, bad ? `\n${bad} gap(s) too wide` : '\nall heading gaps within 8 px (phone) / 10 px (desktop)');
process.exit(bad ? 1 : 0);
