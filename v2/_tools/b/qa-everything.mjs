/* Runs the whole QA of preview B one script after the other and prints one line per script. Needs the dev server:
     python3 -m http.server 8752 --directory <v2>/b-alder      and      QA_BASE=http://127.0.0.1:8752
   usage: node qa-everything.mjs [--quick]     (--quick skips the layout sweep of all 28 pages x 8 widths and the contrast audit)
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const quick = process.argv.includes('--quick');
const steps = [
  ['build (regenerates every page, content, search index)', 'build-pages.mjs'],
  ['links (every href / src / srcset / ?grupa=)', 'qa-links.mjs'],
  ['text (21 articles word for word, hygiene)', 'qa-text.mjs'],
  ['feedback items R1 to R15 (static + rendered + interactions)', 'qa-rules.mjs'],
  ['R3 heading gaps (8 px phone / 10 px desktop)', 'qa-spacing.mjs'],
  ['R6 search (32 queries, overlay, keyboard, price list)', 'qa-search.mjs'],
  ['functional (deep links, menu, chip bar, video rules, offers, no-JS, action bar)', 'qa-func.mjs'],
  ['accessibility (axe-core, incl. dialogs)', 'qa-axe.mjs'],
  ...(quick ? [] : [['contrast AA on the rendered pages and dialogs', 'qa-contrast.mjs', ['--states']], ['layout: 28 pages x 8 widths, console, tap targets', 'qa-all.mjs']]),
];
let failed = 0;
for (const [label, file, args = []] of steps) {
  const t = Date.now();
  const r = spawnSync('node', [path.join(HERE, file), ...args], { encoding: 'utf8', env: { ...process.env, QA_BASE: process.env.QA_BASE || 'http://127.0.0.1:8752' }, maxBuffer: 64 * 1024 * 1024 });
  const ok = r.status === 0; if (!ok) failed++;
  const last = (r.stdout || '').trim().split('\n').slice(-1)[0] || (r.stderr || '').trim().split('\n').slice(-1)[0];
  console.log(`${ok ? '✓' : '✗'} ${label}  (${((Date.now() - t) / 1000).toFixed(0)} s)  ${last}`);
  if (!ok) console.log((r.stdout || '').split('\n').filter((l) => /✗/.test(l)).slice(0, 12).join('\n'));
}
console.log(failed ? `\n${failed} step(s) failed` : '\nEverything passed.');
process.exit(failed ? 1 : 0);
