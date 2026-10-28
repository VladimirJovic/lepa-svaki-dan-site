/* ============================================================================
   content-fixes.js : shared content corrections for the Lepa Svaki Dan content pack
   ----------------------------------------------------------------------------
   Rules live in content-fixes.rules.json (read here and by lsd_common.py):
     1. the founder (Tamara Ćosić, osnivačica Lepe Svaki Dan) is not a doctor: the title before her name is removed; Tamara Vujačić IS a doctor
        and keeps "dr"; founder.signature = "Tamara Ćosić, osnivačica Lepe Svaki Dan" and it is used
        wherever the owner is signed (founder.signatureName)
     2. no em dash (U+2014) anywhere; en dash (U+2013) only inside numeric ranges
        (explicit, reviewed replacement per sentence; anything unknown THROWS,
        nothing is guessed silently)
   Exports: fixText(s), applyFixes(content), assertClean(text, label), isClean(text)
   The source of this file contains no literal dash characters on purpose.
   ECHOSYSTEM-MOTHER AGENCY
   ============================================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const EM = String.fromCharCode(0x2014); /* em dash */
const EN = String.fromCharCode(0x2013); /* en dash */
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, 'content-fixes.rules.json'), 'utf8'));
const TITLE_RE = new RegExp(RULES.owner.titleRule.pattern, RULES.owner.titleRule.flags);
const SIGNATURE = RULES.owner.signature;

/* en dash is allowed only between numbers (prev non-space char = digit or euro sign, next non-space char = digit) */
function isNumericEnDash(s, i) {
  let a = i - 1; while (a >= 0 && /\s/.test(s[a])) a--;
  let b = i + 1; while (b < s.length && /\s/.test(s[b])) b++;
  return a >= 0 && b < s.length && /[\d€]/.test(s[a]) && /\d/.test(s[b]);
}
function leftovers(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === EM) out.push({ i, ch: 'U+2014' });
    else if (s[i] === EN && !isNumericEnDash(s, i)) out.push({ i, ch: 'U+2013' });
  }
  return out;
}
const isClean = (s) => leftovers(s).length === 0;
function assertClean(s, label) {
  const l = leftovers(s);
  if (l.length) {
    const i = l[0].i;
    throw new Error('UNMAPPED DASH (' + l[0].ch + ') in ' + label + ': ...' + s.slice(Math.max(0, i - 40), i + 40).replace(/\n/g, ' ') + '... (add a reviewed rule to content-fixes.rules.json)');
  }
}

/* returns the fixed string; if `hits` (array) is given, the ids of the rules that fired are pushed into it */
function fixText(s, hits) {
  if (typeof s !== 'string' || s === '') return s;
  let t = s;
  const hit = (name) => { if (hits) hits.push(name); };
  if (t === EM) { hit('dash:placeholder'); return '-'; }
  if (Object.prototype.hasOwnProperty.call(RULES.owner.exactStrings, t)) { hit('owner:signature'); t = RULES.owner.exactStrings[t]; }
  const before = t;
  t = t.replace(TITLE_RE, RULES.owner.titleRule.replace);
  if (t !== before) hit('owner:title');
  for (const r of (RULES.typos || [])) {
    if (t.includes(r.find)) { t = t.split(r.find).join(r.replace); hit('typo:' + r.find); }
  }
  for (const r of RULES.dash.rules) {
    if (t.includes(r.find)) { t = t.split(r.find).join(r.replace); hit('dash:' + r.find.replace(new RegExp(EM, 'g'), '{U+2014}').replace(new RegExp(EN, 'g'), '{U+2013}')); }
  }
  return t;
}

/* deep, in-place walk over every string leaf; returns the change log */
const pathOf = (trail) => trail.map((x, i) => (typeof x === 'number' ? '[' + x + ']' : (i ? '.' : '') + x)).join('');
function applyFixes(root) {
  const changes = [];
  (function walk(node, trail) {
    const keys = Array.isArray(node) ? node.map((_, i) => i) : Object.keys(node);
    for (const k of keys) {
      const v = node[k];
      if (typeof v === 'string') {
        const hits = [];
        const nv = fixText(v, hits);
        if (nv !== v) { changes.push({ path: pathOf(trail.concat(k)), before: v, after: nv, rules: hits }); node[k] = nv; }
      } else if (v && typeof v === 'object') {
        walk(v, trail.concat(k));
      }
    }
  })(root, []);
  /* the founder fields are FORCED to the reviewed values (client feedback 3): a regeneration from the old site, which still names Tamara Vujačić, keeps them */
  const FD = RULES.owner.founder;
  const force = (obj, key, value, label) => { if (obj && obj[key] !== value) { changes.push({ path: label, before: obj[key], after: value, rules: ['owner:founder'] }); obj[key] = value; } };
  if (FD && root.founder) {
    force(root.founder, 'name', FD.name, 'founder.name');
    force(root.founder, 'role', FD.role, 'founder.role');
    force(root.founder, 'signatureMeta', FD.signatureMeta, 'founder.signatureMeta');
    if (root.founder.image) force(root.founder.image, 'alt', FD.imageAlt, 'founder.image.alt');
    if (root.stats) force(root.stats, 'founderMeta', FD.signatureMeta, 'stats.founderMeta');
    const im = root.images && root.images['founder-portrait.jpg'];
    if (im) { force(im, 'alt', FD.imageAlt, 'images.founder-portrait.jpg.alt'); force(im, 'usage', FD.imageUsage, 'images.founder-portrait.jpg.usage'); }
    const home = root.site && root.site.pages && root.site.pages.home;
    if (home && typeof home.description === 'string') {
      /* "Dr Tamara Vujačić i tim." (old site) / "Tamara Ćosić i tim." / the final wording: always the final wording */
      force(home, 'description', home.description.replace(/(?:[Dd]r\.?\s+)?(?:Osnivačica\s+)*Tamara\s+(?:Vujačić|Ćosić)\s+i tim\./g, FD.homeDescriptionTo), 'site.pages.home.description');
    }
  }
  /* founder.signature (new field) and its use in founder.signatureName */
  if (root.founder) {
    const f = root.founder;
    const ordered = {};
    Object.keys(f).forEach((k) => {
      if (k === 'signature') return;
      ordered[k] = f[k];
      if (k === 'role') ordered.signature = SIGNATURE;
    });
    if (!('role' in f)) ordered.signature = SIGNATURE;
    Object.keys(f).forEach((k) => delete f[k]);
    Object.assign(f, ordered);
    changes.push({ path: 'founder.signature', before: null, after: SIGNATURE, rules: ['owner:signature-field'] });
    if (f.signatureName !== SIGNATURE) {
      changes.push({ path: 'founder.signatureName', before: f.signatureName, after: SIGNATURE, rules: ['owner:signature-use'] });
      f.signatureName = SIGNATURE;
    }
  }
  return changes;
}

/* JSON text that never contains a literal em/en dash (they are written as \u escapes, which stays valid JSON) */
function jsonNoDash(obj, space) {
  /* the owner title (only ever inside logs) is written with a \u0072 escape for the "r": exact when parsed, but the file
     never contains the title next to the first name */
  return JSON.stringify(obj, null, space).replace(new RegExp(EM, 'g'), '\\u2014').replace(new RegExp(EN, 'g'), '\\u2013')
    .replace(/\b([Dd])r(\.?\s+Tamara\s+Ćosić\b)/g, '$1\\u0072$2');
}
/* readable form for logs and markdown (before-strings must not contain the characters themselves) */
const printable = (s) => (s == null ? s : String(s).replace(new RegExp(EM, 'g'), '{U+2014}').replace(new RegExp(EN, 'g'), '{U+2013}').replace(/\b([Dd]r\.?)(\s+)(?=Tamara\s+Ćosić\b)/g, '~~$1~~$2'));

module.exports = { fixText, applyFixes, assertClean, isClean, leftovers, jsonNoDash, printable, SIGNATURE, RULES, EM, EN };
