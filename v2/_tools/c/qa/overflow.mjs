// Every page x widths 320..1440: horizontal overflow (document + per element), console errors, failed requests, tap targets (390 only). 
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, sleep, scrollThrough, BASE, SITE } from './lib.mjs';
const only = process.argv[2];
const pages = [];
(function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets') walk(p); } else if (e.name.endsWith('.html')) pages.push(path.relative(SITE, p)); }); })(SITE);
const widths = [320, 360, 375, 390, 414, 768, 1024, 1440];
const b = await launch();
const problems = []; let n = 0;
for (const pg of pages.filter((p) => !only || p.includes(only))) {
  for (const W of widths) {
    const p = await newPage(b, W, W < 768 ? 800 : 900);
    await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' });
    await sleep(250);
    await scrollThrough(p, 700);
    const r = await p.evaluate((W) => {
      const vw = document.documentElement.clientWidth, out = { vw, doc: document.documentElement.scrollWidth - vw, bad: [], tap: [], h1: document.querySelectorAll('h1').length };
      const clipped = (el) => { for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) { const o = getComputedStyle(a); if (['auto', 'scroll', 'hidden', 'clip'].includes(o.overflowX)) return true; } return false; };
      document.querySelectorAll('body *').forEach((el) => {
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]') || el.closest('.menu:not(.is-open)')) return;
        const rc = el.getBoundingClientRect(); if (!rc.width && !rc.height) return;
        if ((rc.right > vw + 1 || rc.left < -1) && !clipped(el) && cs.position !== 'fixed') out.bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(rc.left)}..${Math.round(rc.right)}`);
        if (W === 390 && /^(A|BUTTON)$/.test(el.tagName) && !el.closest('.prose, .skip, .menu:not(.is-open)') && !el.matches('.acard__a')) {
          const inline = cs.display === 'inline'; const rr = el.getClientRects()[0] || rc;
          if (!inline && (rr.height < 43.5 || rr.width < 43.5) && !(rr.width < 1)) out.tap.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(rr.width)}x${Math.round(rr.height)} "${(el.textContent || '').trim().slice(0, 24)}"`);
        }
      });
      // text that sticks out of a box that clips it (hidden / clip): invisible to the viewport test above, so test it against the clipping ancestor
      document.querySelectorAll('h1, h2, h3, h4, p, li, a, button, strong, small').forEach((el) => {
        if (el.closest('.marquee, [hidden], .menu:not(.is-open)') || getComputedStyle(el).display === 'none') return;
        let anc = null, scroller = false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (['auto', 'scroll'].includes(o.overflowX)) { scroller = true; break; } if (['hidden', 'clip'].includes(o.overflowX) && a.getBoundingClientRect().width) { anc = a; break; } } if (scroller) return;
        if (!anc) return;
        const rc = el.getBoundingClientRect(), ar = anc.getBoundingClientRect(); if (!rc.width) return;
        if (rc.right > ar.right + 1.5 || rc.left < ar.left - 1.5) out.bad.push(`CLIPPED ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${(el.textContent || '').trim().slice(0, 22)}" in ${anc.className.split(' ')[0] || anc.tagName.toLowerCase()} by ${Math.round(Math.max(rc.right - ar.right, ar.left - rc.left))}px`);
      });
      const skip = document.querySelector('.skip'); out.skipHidden = !skip || skip.getBoundingClientRect().bottom <= 0;
      return out;
    }, W);
    n++;
    const log = p.__log;
    if (r.doc > 0) problems.push(`${pg} @${W}: document scrollWidth exceeds viewport by ${r.doc}px`);
    if (r.bad.length) problems.push(`${pg} @${W}: ${r.bad.length} element(s) outside viewport: ${[...new Set(r.bad)].slice(0, 5).join('; ')}`);
    if (r.h1 !== 1) problems.push(`${pg} @${W}: ${r.h1} h1`);
    if (!r.skipHidden) problems.push(`${pg} @${W}: skip link visible`);
    if (r.tap.length) problems.push(`${pg} @${W}: small tap targets: ${[...new Set(r.tap)].slice(0, 6).join('; ')}`);
    if (log.errors.length || log.failed.length || log.notfound.length) problems.push(`${pg} @${W}: console/network: ${JSON.stringify(log)}`);
    await p.close();
  }
}
await b.close();
console.log(`${n} page loads (${pages.filter((p) => !only || p.includes(only)).length} pages x ${widths.length} widths)`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'no overflow, no console errors, one h1 everywhere, tap targets >= 44');
