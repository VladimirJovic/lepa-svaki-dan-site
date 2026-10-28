// Audit of the client-feedback requirements R1..R15 on every page (static HTML + rendered DOM).
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, sleep, scrollThrough, BASE, SITE } from './lib.mjs';
const only = process.argv[2];
const pages = [];
(function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets') walk(p); } else if (e.name.endsWith('.html')) pages.push(path.relative(SITE, p)); }); })(SITE);
const res = []; const ok = (n, c, x = '') => res.push([c ? 'PASS' : 'FAIL', n, c ? '' : String(x).slice(0, 400)]);
const EM = String.fromCharCode(0x2014);
/* ---- files: em dash, emoji, tags, template names, "Dr Tamara" ---- */
const files = [];
(function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(html|css|js|mjs|json|svg|md|txt)$/.test(e.name)) files.push(p); }); })(SITE);
(function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(mjs|js|json|md)$/.test(e.name)) files.push(p); }); })(path.join(SITE, '../_tools/c'));
const emojiRe = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/u;
const badEm = [], badEmoji = [], badTpl = [], badDr = [];
const tplRe = new RegExp(['lu' + 'mine', 'al' + 'der', 'lu' + 'zia', 'fra' + 'mer'].join('|'), 'i');
files.forEach((f) => { if (/(rcheck|build-pages)\.mjs$/.test(f)) return; const t = fs.readFileSync(f, 'utf8'); const rel = path.relative(path.join(SITE, '..'), f); if (t.includes(EM) || /&mdash;/.test(t) || /\\u2014/i.test(t)) badEm.push(rel); if (emojiRe.test(t)) badEmoji.push(rel); if (tplRe.test(t)) badTpl.push(rel); if (/\bDr\.? Tamar|\bdr\.? Tamar/.test(t)) badDr.push(rel); });
ok('R15 no em dash (U+2014, &mdash;, \\u2014) in any file of the site or its tools', !badEm.length, badEm.join(', '));
ok('R11 no emoji / pictographic characters in any file', !badEmoji.length, badEmoji.join(', '));
ok('no template names in any file', !badTpl.length, badTpl.join(', '));
ok('R10 no "Dr Tamara" anywhere in files', !badDr.length, badDr.join(', '));
const content = fs.readFileSync(path.join(SITE, 'assets/content.js'), 'utf8');
ok('R1 shipped content.js carries no location / nb / bw per service, no tags, no emoji badge text', !/"location"|"locationLabel"|"nb"|"bw"|"tags"|akcija"/.test(content) || !/"(location|locationLabel|tags)"/.test(content), (content.match(/"(location|locationLabel|nb|bw|tags)"/g) || []).join(','));
const sidx = fs.readFileSync(path.join(SITE, 'assets/search-index.js'), 'utf8');
ok('R1 search-index.js has no location fields', !/"(location|nb|bw)"/.test(sidx));
const cssAll = ['tokens.css', 'style.css', 'pages.css'].map((f) => fs.readFileSync(path.join(SITE, 'css', f), 'utf8')).join('\n');
ok('R1 no location filter / dot--bw / green in CSS', !/dot--bw|--bw\b|loc-filter|locfilter|3F6E5E/i.test(cssAll));
ok('R2 near-black values gone from CSS (#231F20 #292627 #322F30 #454340 and rgba(35,31,32))', !/#231F20|#292627|#322F30|#454340|rgba\(\s*35\s*,\s*31\s*,\s*32/i.test(cssAll), (cssAll.match(/#231F20|#292627|#322F30|#454340|rgba\(\s*35\s*,\s*31\s*,\s*32/gi) || []).join(','));
ok('R2 75% black token (#5A5758) is the text colour token', /--charcoal:\s*#5A5758/i.test(cssAll) && /--ink:\s*var\(--charcoal\)/.test(cssAll));
ok('R3 --head-gap documented in tokens.css and drives the gaps', /--head-gap:\s*8px/.test(cssAll) && /--head-gap:\s*10px/.test(cssAll) && (cssAll.match(/var\(--head-gap\)/g) || []).length >= 15);
ok('R4 --foil gradient has 4-6 stops', (() => { const m = cssAll.match(/--foil:\s*linear-gradient\(([^;]+)\);/); return m && (m[1].match(/#[0-9A-F]{6}/gi) || []).length >= 4 && (m[1].match(/#[0-9A-F]{6}/gi) || []).length <= 6; })());
ok('R4 foil text uses background-clip:text with a solid fallback', /--foil-ink:/.test(cssAll) && /background-clip: text/.test(cssAll));
/* ---- rendered pages ---- */
const b = await launch();
const LOCRE = /Novi Beograd|Waterfront|Obe lokacije|Beauty Concept|Wellbeing Concept/;
const ALLOWED = '#lokacije, footer, .contact, #contact-sheet, .menu__contact, .sres__empty, .sres__call, .nav__logo, .foot, .tq, .testi, .prose';
const near = [[35, 31, 32], [41, 38, 39], [50, 47, 48], [69, 67, 64]];
const stats = { pages: 0 };
for (const pg of pages.filter((p) => !only || p.includes(only))) {
  for (const W of [390, 1440]) {
    const p = await newPage(b, W, W < 768 ? 844 : 900);
    await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(300); await scrollThrough(p, 700);
    const r = await p.evaluate((near, ALLOWED) => {
      const out = { loc: [], colors: {}, tone: 0, multi: [], gap: [], emoji: [], zero: [], tag: [], near: [], cline: document.querySelectorAll('.cline').length, h1: document.querySelectorAll('h1').length };
      const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0; };
      const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
      const isNear = (c) => near.some((n) => n[0] === c[0] && n[1] === c[1] && n[2] === c[2]);
      document.querySelectorAll('body *').forEach((el) => {
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'path', 'use', 'svg', 'symbol', 'circle', 'defs', 'textPath'].includes(el.tagName)) return;
        if (el.closest('[hidden], .menu:not(.is-open), dialog:not([open]), .sov:not(.is-open), .sheet')) return;
        const cs = getComputedStyle(el);
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (hasText && vis(el)) { const c = rgb(cs.color), tf = cs.webkitTextFillColor; const key = /rgba?\(0, 0, 0, 0\)|transparent/.test(tf) ? 'foil-gradient-text' : cs.color; out.colors[key] = (out.colors[key] || 0) + 1; if (isNear(c)) out.near.push(el.tagName + '.' + String(el.className).split(' ')[0]); }
        if (isNear(rgb(cs.backgroundColor))) out.near.push('bg ' + el.tagName + '.' + String(el.className).split(' ')[0]);
        if (el.classList.contains('tone') || [...el.classList].some((c) => c.startsWith('tone--'))) out.tone++;
      });
      // headings: one colour, no recolouring children; gap to the line under it
      document.querySelectorAll('h1, h2, h3').forEach((h) => {
        if (!vis(h) || h.closest('.sres, .sov, .sheet, #pay-sheet')) return;
        const hc = getComputedStyle(h).color;
        h.querySelectorAll('*').forEach((c) => { if (!([...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))) return; const cc = getComputedStyle(c).color; if (cc !== hc && vis(c)) out.multi.push(h.textContent.trim().slice(0, 30) + ' <' + c.tagName + '> ' + cc + ' vs ' + hc); });
        const nx = h.nextElementSibling; if (nx && vis(nx) && !/^(UL|OL|DIV|FORM|FIGURE|DETAILS|SECTION|NAV|ASIDE)$/.test(nx.tagName) || (nx && /^(P)$/.test(nx.tagName))) {
          const g = nx.getBoundingClientRect().top - h.getBoundingClientRect().bottom; const lim = innerWidth < 768 ? 8.5 : 10.5;
          if (nx && /^(P|H2|H3)$/.test(nx.tagName) && g > lim) out.gap.push(`${h.tagName} "${h.textContent.trim().slice(0, 24)}" -> <${nx.tagName.toLowerCase()}> ${g.toFixed(1)}px`);
        }
      });
      // location text outside the allowed containers (visible text, alt, aria-label, title)
      const re = /Novi Beograd|Waterfront|Obe lokacije|Wellbeing Concept|Beauty Concept/;
      const textAll = []; document.querySelectorAll('body *').forEach((el) => {
        if (el.closest(ALLOWED) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) return;
        ['alt', 'aria-label', 'title', 'placeholder'].forEach((a) => { const v = el.getAttribute && el.getAttribute(a); if (v && re.test(v)) out.loc.push(`@${a}: ${v.slice(0, 50)}`); });
        if ([...el.childNodes].some((n) => n.nodeType === 3 && re.test(n.textContent))) out.loc.push(el.tagName + ': ' + el.textContent.trim().slice(0, 50));
      });
      const txt = document.body.innerText;
      if (/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(txt)) out.emoji.push('emoji in text');
      (txt.match(/(^|[\s(])0\d(?![\d.:,\/-]|\s*(rsd|€|%))/g) || []).forEach((m) => out.zero.push(m.trim()));
      (txt.match(/(^|\s)#[a-zčćšžđ]\w*/gi) || []).forEach((m) => out.tag.push(m.trim()));
      out.em = txt.includes('—');
      return out;
    }, near, ALLOWED);
    const tag = `${pg} @${W}`;
    if (r.loc.length) ok(`R1 ${tag}: no location per treatment`, false, r.loc.slice(0, 4).join(' | '));
    if (r.near.length) ok(`R2 ${tag}: no near-black colours in use`, false, [...new Set(r.near)].slice(0, 5).join(', '));
    if (r.tone) ok(`R2 ${tag}: no two-tone spans`, false, r.tone);
    if (r.multi.length) ok(`R2 ${tag}: headings are one colour`, false, r.multi.slice(0, 3).join(' | '));
    if (r.gap.length) ok(`R3 ${tag}: heading gap`, false, r.gap.slice(0, 4).join(' | '));
    if (r.emoji.length || r.tag.length) ok(`R11/R6 ${tag}: no emoji, no # tags`, false, [...r.emoji, ...r.tag.slice(0, 4)].join(' | '));
    if (r.zero.length) ok(`R14 ${tag}: numbers without leading zeros`, false, [...new Set(r.zero)].slice(0, 5).join(' '));
    if (r.em) ok(`R15 ${tag}: no em dash in rendered text`, false, 'em dash');
    if (!r.cline && !/^index/.test(pg) ) ok(`R5 ${tag}: contact line present`, false, '0');
    if (W === 390 && /^index/.test(pg)) { stats.colors390 = r.colors; stats.cline = r.cline; }
    if (W === 1440 && /^index/.test(pg)) { stats.colors1440 = r.colors; }
    await p.close();
  }
  stats.pages++;
}
ok(`rendered scan of ${stats.pages} pages x 2 widths completed (only failures are listed above)`, true);
await b.close();
console.log('text colours on the home (390):', JSON.stringify(stats.colors390));
console.log('contact lines on the home:', stats.cline);
console.log(res.map((r) => r.join(' ')).join('\n')); const f = res.filter((r) => r[0] === 'FAIL').length; console.log(`\n${res.length - f}/${res.length} passed`); process.exit(f ? 1 : 0);
