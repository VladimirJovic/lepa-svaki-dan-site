/* Text fidelity + hygiene checks for preview B (static):
   1. every article page carries the source words exactly (title, subtitle, every block in order; the copywriter's source note is not body copy)
   2. placeholders: every [[dopuniti: ...]] token of the source is a visible <mark class="ph"> and no raw [[ ]] remains
   3. no em dash anywhere in the pages, no "Dr"/"dr" directly before Tamara, no leftover template names in any site file
   4. exactly one h1 per page, lang="sr", noindex, no canonical, a title and a description on every page
   usage: node qa-text.mjs                                              Pripremio ECHOSYSTEM-MOTHER AGENCY */
import fs from 'node:fs';
import path from 'node:path';
import { SITE, allPages } from './qa-lib.mjs';
const ARTS = JSON.parse(fs.readFileSync('/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/_shared/content/articles.json', 'utf8'));
const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const strip = (h) => dec(h.replace(/<wbr>/g, '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const EMD = String.fromCharCode(8212);          // built from the code point so this file carries no em dash itself
let bad = 0; const fail = (m) => { bad++; console.log('  ✗ ' + m); };

for (const a of ARTS) {
  const f = `blog/${a.slug}.html`, html = fs.readFileSync(path.join(SITE, f), 'utf8');
  const prose = html.match(/<div class="prose">([\s\S]*?)<\/div>\n    <div class="cline"/);
  if (!prose) { fail(`${f}: prose not found`); continue; }
  const parts = prose[1].split(/(?=<(?:h2|h3|p|ul|ol)[ >])/).filter(Boolean);
  const got = strip(prose[1].replace(/<\/(h2|h3|p|li)>/g, '$& '));
  const want = a.blocks.filter((b) => !b.flag).map((b) => (b.items ? b.items.join(' ') : b.text)).join(' ').replace(/\[\[dopuniti: ([^\]]+)\]\]/g, '[dopuniti: $1]').replace(/\s+/g, ' ').trim();
  if (got !== want) { const i = [...want].findIndex((c, k) => c !== got[k]); fail(`${f}: body text differs at char ${i}: «${want.slice(Math.max(0, i - 25), i + 40)}» vs «${got.slice(Math.max(0, i - 25), i + 40)}»`); }
  const h1 = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '');
  if (h1 !== a.title.replace(/\s+/g, ' ')) fail(`${f}: h1 "${h1}" != title "${a.title}"`);
  if (a.subtitle && !html.includes(`<p class="ahead__sub">`)) fail(`${f}: subtitle missing`);
  if (a.subtitle) { const sub = strip((html.match(/<p class="ahead__sub">([\s\S]*?)<\/p>/) || [])[1] || ''); if (sub !== a.subtitle) fail(`${f}: subtitle "${sub}" != "${a.subtitle}"`); }
  const marks = (prose[1].match(/<mark class="ph">/g) || []).length;
  if (marks !== a.placeholders.length) fail(`${f}: ${marks} markers for ${a.placeholders.length} placeholders`);
  if (/\[\[/.test(html)) fail(`${f}: raw [[ token left`);
}
console.log(`${ARTS.length} articles compared word for word`);

for (const p of allPages()) {
  const html = fs.readFileSync(path.join(SITE, p), 'utf8');
  if (html.includes(EMD)) fail(`${p}: em dash`);
  if (/\bdr\.?\s+Tamar/i.test(html)) fail(`${p}: "dr Tamara"`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail(`${p}: h1 count`);
  if (!/<html lang="sr"/.test(html)) fail(`${p}: lang`);
  if (!/<meta name="robots" content="noindex">/.test(html)) fail(`${p}: noindex`);
  if (/rel="canonical"/.test(html)) fail(`${p}: canonical present`);
  if (!/<title>[^<]{5,}<\/title>/.test(html) || !/<meta name="description" content="[^"]{20,}"/.test(html)) fail(`${p}: title/description`);
}
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f, out); else if (/\.(html|css|js|svg|txt|json)$/.test(e.name)) out.push(f); } return out; };
for (const f of walk(SITE)) if (/lumine|alder|luzia|framer/i.test(fs.readFileSync(f, 'utf8'))) fail(`${path.relative(SITE, f)}: template name`);
for (const f of walk(SITE).filter((x) => /\.(js)$/.test(x) && !x.includes('content.js'))) if (fs.readFileSync(f, 'utf8').includes(EMD)) fail(`${path.relative(SITE, f)}: em dash in script`);
console.log(bad ? `${bad} problem(s)` : 'text and hygiene checks passed');
process.exit(bad ? 1 : 0);
