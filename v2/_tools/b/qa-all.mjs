/* QA of preview B: every page x every width.
   - no horizontal page scroll (documentElement.clientWidth vs scrollWidth, plus every element's box against the viewport)
   - no console errors / failed requests
   - tap targets < 44 px (excluding links inside running text)
   - one h1, body font >= 16 px, images with width/height, alt present
   usage: node qa-all.mjs [--pages a.html,b.html] [--widths 320,390]            Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { launch, newPage, scrollThrough, sleep, BASE, allPages } from './qa-lib.mjs';
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const pages = arg('pages') ? arg('pages').split(',') : allPages();
const widths = (arg('widths') || '320,360,375,390,414,768,1024,1440').split(',').map(Number);
let b = await launch();
let bad = 0, retries = 0;
const rep = (s) => { bad++; console.log('  ✗ ' + s); };
for (const pg of pages) {
  console.log(pg);
  for (const W of widths) {
    let p, r;
    for (let attempt = 0; attempt < 3 && !r; attempt++) {              // the shared machine may close Chrome under us: relaunch and retry
      try {
        if (!b.connected) b = await launch();
        p = await newPage(b, W, W < 768 ? 800 : 900);
        await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' });
        await sleep(450); if (process.argv.includes('--scroll')) await scrollThrough(p, 500);   // layout checks do not need the reveal state
        r = await measure(p);
      } catch (e) { retries++; try { await p.close(); } catch {} if (attempt === 2) throw e; }
    }
    report(pg, W, p, r);
    await p.close();
  }
}
async function measure(p) {
  {
    return await p.evaluate(() => {
      const de = document.documentElement, vw = de.clientWidth, out = { vw, sw: de.scrollWidth, over: [], small: [], imgs: [], h1: document.querySelectorAll('h1').length, font: getComputedStyle(document.body).fontSize };
      const clips = (el) => { for (let a = el.parentElement; a && a !== document.body && a !== de; a = a.parentElement) { const o = getComputedStyle(a); if (o.overflowX !== 'visible') return true; } return false; };
      document.querySelectorAll('body *').forEach((el) => {
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.menu:not(.is-open)') || el.closest('[hidden]')) return;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
        if ((r.right > vw + 1 || r.left < -1) && cs.position !== 'fixed' && !clips(el)) out.over.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
        if (el.matches('a, button, summary') && !el.closest('p, .lead, .prose, .ednote, .bseg__intro, .acard__ex, .foot__legal') && !el.matches('.acard__a, .ahead__seg') && (r.height < 43.5 || r.width < 43.5) && !el.matches('.skip')) {
          if (!(el.matches('a.link, .tlink') && r.height >= 30)) out.small.push((el.className || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' "' + (el.textContent || '').trim().slice(0, 24) + '"');
        }
        if (el.tagName === 'IMG') { if (!el.getAttribute('width') || !el.getAttribute('height')) out.imgs.push('no w/h: ' + el.getAttribute('src')); if (el.getAttribute('alt') == null) out.imgs.push('no alt: ' + el.getAttribute('src')); }
      });
      return out;
    });
  }
}
function report(pg, W, p, r) {
  {
    const tag = `  ${String(W).padStart(4)}`;
    if (r.sw > r.vw) rep(`${tag} page scrolls horizontally: scrollWidth ${r.sw} > ${r.vw}`);
    if (r.over.length) rep(`${tag} elements outside the viewport (${r.over.length}): ${[...new Set(r.over)].slice(0, 6).join(' | ')}`);
    if (p.__log.errors.length) rep(`${tag} console: ${p.__log.errors.slice(0, 3).join(' | ')}`);
    if (p.__log.failed.length || p.__log.notfound.length) rep(`${tag} failed/404: ${[...p.__log.failed, ...p.__log.notfound].slice(0, 3).join(' | ')}`);
    if (r.h1 !== 1) rep(`${tag} h1 count ${r.h1}`);
    if (parseFloat(r.font) < 16) rep(`${tag} body font ${r.font}`);
    if (r.imgs.length) rep(`${tag} images: ${[...new Set(r.imgs)].slice(0, 3).join(' | ')}`);
    if (r.small.length && (W === 390 || W === 320 || W === 1440)) console.log(`${tag}  small tap targets (${r.small.length}): ${[...new Set(r.small)].slice(0, 8).join(' | ')}`);
  }
}
await b.close();
console.log((retries ? `\n(${retries} browser retries)` : '') + (bad ? `\n${bad} problem(s)` : '\nall clear'));
process.exit(bad ? 1 : 0);
