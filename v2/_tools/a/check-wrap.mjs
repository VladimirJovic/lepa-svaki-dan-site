#!/usr/bin/env node
/* =====================================================================================================
   LEPA SVAKI DAN · preview "A" · LINE-BREAK CHECK (client feedback 3, "Tekstovi na sajtu": no awkward breaks in the descriptive texts of the sections)
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   Measures the line boxes of every paragraph, lead, heading, list text and quote of a page (a Range per word, getClientRects) and flags
     - ORPHAN   the last line is one short word (up to 7 letters) or less than 12% of the longest line, in a text of 2 or more lines
     - RAGGED   in a heading / lead / quote (at most 4 lines) the shortest line is under 40% of the longest one (a one-word line in the middle counts too)
     - NARROW   a line in the middle of a paragraph is ONE word under 25% of the box (a bad break, not just a short word at the end)
   Layout only: the client's wording is never changed. The fixes are text-wrap: balance / pretty, max-width, non-breaking spaces in prices.
   Pages: home (also with the price-list notice and the gift dialog of the personalised offer open), one article, one segment page, the offers page, the blog. Widths: 320 360 390 768 1024 1440.

   Run (a dev server must serve the preview A folder):
       python3 -m http.server 8761 --directory <the folder of preview A> &
       node _tools/a/check-wrap.mjs [--base http://localhost:8761] [--widths 360,390,768] [--pages /index.html,/blog.html] [--quiet]
   Exit code 1 when something is flagged.
   ===================================================================================================== */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(HERE, '..', 'qa') + '/');
const puppeteer = require('puppeteer-core');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:8761');
const WIDTHS = arg('widths', '320,360,390,768,1024,1440').split(',').map(Number);
const PAGES = arg('pages', '/index.html,/blog/hijaluronski-fileri.html,/tretmani/telo.html,/posebna-ponuda.html,/blog.html').split(',');
const QUIET = process.argv.includes('--quiet');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* runs inside the page: returns the findings */
function measure(opts) {
  const SKIP = '.nav,.menu,.abar,.srch,.rot,.rot-sr,.sr,.eyebrow,.chip,.btn,button,.tab,.fchip,svg,script,style,template,.foot__credit,.strip__chip,.lh,sup,.px,.cline__t,.crumbs,.toc summary,.phead__meta,.grp__show,.tabs-hint,.price__suggest';
  const BLOCKS = 'p,h1,h2,h3,h4,li,blockquote,figcaption,.vt__s,.fav__d,.bs__d,.bs__n,.pt__d,.po__d,.sa__x,.bp__x,.seg__s';
  const out = [];
  const visible = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || n.hidden) return false; } return el.getClientRects().length > 0; };
  const seen = new Set();
  document.querySelectorAll(BLOCKS).forEach((el) => {
    if (el.closest(SKIP) || el.matches('ul,ol,.bs__li,.pt,.fav,.gc,.vt,.seg,.split__t') || !visible(el)) return;
    if (el.closest('.sheet:not(.is-open)')) return;
    if (el.querySelector('p,h1,h2,h3,h4,li,blockquote')) return;            // only the innermost text blocks
    if (el.closest('.svc__p,.grp__btn,.tab,.td,.foot__col li a,.nav__phones,.cline__l,.cline__pair,.cblock__more,.split__rows,.bbtn,.gc,.gc__tx,.svc,.svc__more')) return;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (text.length < 22 || seen.has(el)) return;
    seen.add(el);
    // words and their boxes
    const words = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    for (let n; (n = tw.nextNode());) {
      const re = /[^\s ]+(?: [^\s ]+)*/g;                       // a run joined by non-breaking spaces is ONE unbreakable piece
      for (let m; (m = re.exec(n.nodeValue));) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const rects = [...r.getClientRects()].filter((q) => q.width > 0.5);
        if (!rects.length) continue;
        const q = rects[0];
        words.push({ w: m[0], cy: q.top + q.height / 2, h: q.height, l: Math.min(...rects.map((x) => x.left)), r: Math.max(...rects.map((x) => x.right)) });
      }
    }
    if (words.length < 3) return;
    words.sort((a, b) => a.cy - b.cy || a.l - b.l);
    const lines = [];
    const tol = Math.min(...words.map((w) => w.h)) * 0.55;
    words.forEach((w) => { const last = lines[lines.length - 1]; if (last && Math.abs(w.cy - last.cy) < tol) { last.words.push(w); last.l = Math.min(last.l, w.l); last.r = Math.max(last.r, w.r); } else lines.push({ cy: w.cy, l: w.l, r: w.r, words: [w] }); });
    if (lines.length < 2) return;
    const widths = lines.map((l) => l.r - l.l), maxW = Math.max(...widths);
    const box = el.getBoundingClientRect().width;
    const cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : '';
    const id = el.tagName.toLowerCase() + cls;
    const issues = [];
    const lastL = lines[lines.length - 1], lastW = lastL.words.map((x) => x.w).join(' ');
    const lastLen = lastW.replace(/[^\p{L}\p{N}]/gu, '').length;
    if (lastL.words.length === 1 && lastLen <= 7) issues.push('ORPHAN "' + lastW + '"');
    else if (lines.length >= 3 && widths[widths.length - 1] < maxW * 0.12) issues.push('ORPHAN tiny last line "' + lastW + '"');
    const heading = /^H[1-4]$/.test(el.tagName) || /(sec__intro|hero__sub|cta__p|phead__sub|about__qt|fav__t|vt__t|po__t|pt__t|about__bt|bs__n|nc__h)/.test(el.className);
    if (heading && lines.length <= 4) {
      const body = lines.length === 2 ? widths : widths;                       // all lines, the last one too: a balanced heading has no stub
      if (Math.min(...body) < maxW * 0.4 && !(lines.length === 2 && lastL.words.length > 1 && widths[1] >= maxW * 0.3)) issues.push('RAGGED ' + widths.map((x) => Math.round(x)).join('/'));
    }
    if (lines.length >= 3) lines.slice(1, -1).forEach((l, i) => { if (l.words.length === 1 && (l.r - l.l) < box * 0.25) issues.push('NARROW line ' + (i + 2) + ' "' + l.words.map((x) => x.w).join(' ') + '"'); });
    if (issues.length) out.push({ el: id, text: text.slice(0, 70), lines: lines.length, issues });
  });
  return out;
}

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
let total = 0, checked = 0;
const report = [];
for (const url of PAGES) {
  for (const W of WIDTHS) {
    const p = await b.newPage();
    const mobile = W < 768;
    await p.setViewport({ width: W, height: mobile ? 844 : 900, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('lsd-price-notice', '1'); } catch (e) { /* ignore */ } });
    await p.goto(BASE + url, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts && document.fonts.ready);
    await new Promise((r) => setTimeout(r, 250));
    const runs = [['', async () => {}]];
    if (url === '/index.html') runs.push([' (price notice open)', async () => { await p.evaluate(() => { window.LSDShell.openOv(document.getElementById('priceNotice'), null); }); await new Promise((r) => setTimeout(r, 700)); }]);
    if (url === '/index.html') runs.push([' (gift dialog open)', async () => { await p.evaluate(() => { window.LSDPersonalize.open('akne'); }); await new Promise((r) => setTimeout(r, 1800)); }]);
    for (const [label, prep] of runs) {
      await prep();
      const found = await p.evaluate(measure, {});
      checked++;
      found.forEach((f) => { total++; report.push(url + ' @' + W + label + '  ' + f.el + ' (' + f.lines + ' lines)  "' + f.text + '"  ->  ' + f.issues.join('; ')); });
      if (label) await p.evaluate(() => window.LSDShell.closeOv(true));
    }
    await p.close();
  }
}
await b.close();
if (!QUIET || report.length) report.forEach((r) => console.log(r));
console.log('\nline-break check: ' + checked + ' page/width runs, ' + total + ' finding' + (total === 1 ? '' : 's') + '.');
process.exit(total ? 1 : 0);
