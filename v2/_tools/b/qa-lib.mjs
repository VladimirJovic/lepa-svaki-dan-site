/* QA helpers for preview B (puppeteer-core, see the Obsidian note "Headless Chrome mobile screenshot"). Not part of the site.
   Pripremio ECHOSYSTEM-MOTHER AGENCY */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('/Users/vladajovic/.npm/_npx/8003d8991b0d346b/node_modules/');
export const puppeteer = require('puppeteer-core');
export const SITE = '/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/b-alder';
export const BASE = process.env.QA_BASE || 'http://127.0.0.1:8742';
export const OUT = process.env.QA_OUT || '/private/tmp/claude-501/-Users-vladajovic-Developer-LEPA-SVAKI-DAN/bc2efc8a-11c4-49f0-aa07-b61dd8357a51/scratchpad/shots';
fs.mkdirSync(OUT, { recursive: true });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function launch() {
  return puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
}
export async function newPage(b, W, H, opts = {}) {
  const p = await b.newPage();
  const mobile = opts.mobile ?? W < 768;
  await p.setViewport({ width: W, height: H ?? (W < 768 ? 844 : 900), deviceScaleFactor: opts.dpr ?? 1, isMobile: mobile, hasTouch: mobile });
  if (opts.rm) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const log = { errors: [], failed: [], notfound: [] };
  p.on('pageerror', (e) => log.errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') log.errors.push('console.error: ' + m.text()); });
  p.on('requestfailed', (r) => log.failed.push(r.url()));
  p.on('response', (r) => { if (r.status() >= 400) log.notfound.push(r.status() + ' ' + r.url()); });
  p.__log = log;
  return p;
}
export async function scrollThrough(p, step) {
  const H = await p.evaluate(() => innerHeight);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const s = step || Math.round(H * 0.6);
  for (let y = 0; y < total; y += s) { await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await sleep(90); }
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(350);
}
/* every html page of the site, relative to the site root */
export function allPages() {
  const out = [];
  const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const full = path.join(d, f.name); if (f.isDirectory()) { if (!['assets', 'css', 'js'].includes(f.name)) walk(full); } else if (f.name.endsWith('.html')) out.push(path.relative(SITE, full)); } };
  walk(SITE);
  return out.sort();
}
