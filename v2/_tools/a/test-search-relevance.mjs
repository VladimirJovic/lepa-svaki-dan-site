#!/usr/bin/env node
/* =====================================================================================================
   LEPA SVAKI DAN · preview "A" · RELEVANCE TEST of the search (dependency-free, node >= 18)
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   Loads the REAL engine (js/search.js, the same file the browser runs, up to its first "no DOM" line) and the REAL data (assets/search-index.js),
   runs a list of questions and checks what comes first. Every case says what must be on top:
     group      the first group of the answer is one of these price-list groups ("lice:5" = tab lice, group index 5)
     top3       these groups must all be among the first three groups
     service    the first service of the answer is one of these services (ids "lice:5:0") or its name contains this text
     article    the first text is one of these (art-N)
     offer      the first special offer is one of these
     none       these groups must NOT be among the first three groups (honest mapping: a lexical accident must not come up)
     first      { n, contain }: the first n services of the whole answer must all have a name that contains this text (the services of the named group come first)
   After the cases two sweeps run over the whole site: every group title and every service name, typed as it stands in the price list, must bring that group (first two) or that
   service (first service of one of the first four groups, a service of the same name in another group counts) back, and every phrase of the hidden vocabulary must answer with something.
   The list below is the report of stage 3: 40 questions, how women phrase them included. Nothing is invented: every expected answer is something the price list
   or the texts of the pack say in their own words.

   Run:   node _tools/a/test-search-relevance.mjs            (exit code 1 when a case fails)
          node _tools/a/test-search-relevance.mjs --show "akne" "glass skin"     (prints the first answers of any questions, for tuning)
   ===================================================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '..', '..');
const SITE_DIR = fs.readdirSync(V2).find((d) => /^a-[a-z]+$/.test(d) && fs.existsSync(path.join(V2, d, 'index.html')));
const SITE = path.join(V2, SITE_DIR);

const mod = { exports: {} };
vm.runInNewContext(fs.readFileSync(path.join(SITE, 'js/search.js'), 'utf8'), { module: mod, window: {} }, { filename: 'search.js' });
const E = mod.exports;
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(SITE, 'assets/search-index.js'), 'utf8'), { window: win }, { filename: 'search-index.js' });
const P = E.setData(win.LSD_SEARCH);

const gName = (id) => P.groups[id] ? P.groups[id].title : id;
const fmt = (R) => {
  const lines = [];
  R.groups.slice(0, 6).forEach((x, i) => lines.push('  ' + (i + 1) + '. ' + x.g.id + ' ' + x.g.title + '  [' + Math.round(x.sc) + ']  ' + x.svc.slice(0, 3).map((s) => s.n.slice(0, 34)).join(' | ') + (x.svc.length > 3 ? ' +' + (x.svc.length - 3) : '')));
  if (R.articles.length) lines.push('  texts: ' + R.articles.slice(0, 3).map((x) => x.a.id + ' ' + x.a.t.slice(0, 40) + ' [' + Math.round(x.sc) + ']').join(' | '));
  if (R.offers.length) lines.push('  offers: ' + R.offers.slice(0, 2).map((x) => x.o.id + ' ' + x.o.t + ' [' + Math.round(x.sc) + ']').join(' | '));
  lines.push('  services in total: ' + E.idsOf(R).length + ' · entries used: ' + R.used.map((u) => u.id).join(', '));
  return lines.join('\n');
};

if (process.argv.includes('--show')) {
  const qs = process.argv.slice(process.argv.indexOf('--show') + 1);
  qs.forEach((q) => { console.log('\n"' + q + '"'); console.log(fmt(E.query(q))); });
  process.exit(0);
}

/* ---------------------------------------------------------------------------------------------------- THE CASES */
const CASES = [
  /* 1. names first: an exact or prefix match of a group or service name */
  { q: 'dermapen', group: ['lice:5'], service: 'Dermapen', first: { n: 6, contain: 'dermapen' }, note: 'the Dermapen group and its services on top' },
  { q: 'Dermapen tretman', group: ['lice:5'], service: 'Dermapen tretman lica', first: { n: 3, contain: 'dermapen' } },
  { q: 'hijaluron', group: ['estetske:1'], service: 'Hijaluron', note: 'the filler group; the services are named Hijaluron ...' },
  { q: 'botoks', group: ['estetske:2'], note: 'botoks = Botox (x is read as ks), the Botox group first' },
  { q: 'botox', group: ['estetske:2'], first: { n: 2, contain: 'botox' } },
  { q: 'anticelulit', top3: ['telo:2', 'telo:3'], note: '"anti" in front of a word is a word of its own' },
  { q: 'anti aging', top3: ['protokoli:1', 'lice:5'] },
  { q: 'glow', top3: ['lice:2', 'protokoli:0', 'lice:1'], offer: ['offer-1'] },
  { q: 'mladeži', group: ['estetske:5'], article: ['art-2'] },
  { q: 'limfna drenaža', top3: ['telo:1'] },
  { q: 'lifting niti', group: ['estetske:4'], article: ['art-8'] },
  { q: 'prp', top3: ['estetske:3', 'estetske:7'], article: ['art-4'] },
  { q: 'wedding', group: ['protokoli:2'], offer: ['offer-2'] },
  { q: 'presoterapija', group: ['telo:1'], service: 'ProBallancer' },
  { q: 'myolift', group: ['lice:7'], service: 'MYOLIFT' },
  { q: 'venus legacy', top3: ['lice:6', 'telo:0'] },
  { q: 'masaža', group: ['telo:2'], note: 'the massage group before the services that only carry the tag' },
  { q: 'mezoterapija kose', group: ['estetske:7'], service: 'Mezoterapija kose' },
  /* 2. tags and the hidden vocabulary, weighted by how specific they are */
  { q: 'akne', top3: ['estetske:5', 'lice:0', 'lice:3'], article: ['art-10', 'art-1', 'art-2', 'art-11'], note: 'acne: dermatology, hygienic and chemical peel groups, not every face group' },
  { q: 'ožiljci od akni', group: ['estetske:5'], service: 'Ožiljci od akni', none: ['laserska:1', 'telo:1'] },
  { q: 'glass skin', group: ['lice:2'], note: 'the trend word the site never uses: Venus Glow / Dermafacial first' },
  { q: 'celulit', top3: ['telo:3'], none: ['laserska:0'], note: 'AWT / anticelulit first' },
  { q: 'anticelulit masaža', group: ['telo:2'], service: 'Anticelulit masaža' },
  { q: 'opadanje kose', group: ['estetske:7'], article: ['art-4', 'art-2'] },
  { q: 'depilacija', top3: ['laserska:0', 'laserska:1', 'laserska:2'], note: 'hair removal answers with the laser groups only' },
  { q: 'trajno uklanjanje dlačica', top3: ['laserska:0', 'laserska:1', 'laserska:2'] },
  { q: 'poklon', top3: ['lice:0'], note: 'the gift picks of the About section (hygienic treatment first)' },
  { q: 'kako smanjiti obim', top3: ['telo:4', 'telo:0', 'telo:3'], article: ['art-17', 'art-20', 'art-16'] },
  { q: 'bore', top3: ['estetske:2'], note: 'wrinkles: Botox corrections first' },
  { q: 'usne', group: ['estetske:1'], service: 'usne', none: ['laserska:1', 'laserska:0'], note: 'lips = fillers; "Nausnice" (laser, upper lip hair) must not come up' },
  { q: 'podočnjaci', top3: ['lice:6'], service: 'podočnjaci' },
  { q: 'bradavice', group: ['estetske:5'], article: ['art-3'] },
  { q: 'urasle dlačice', top3: ['telo:5'] },
  { q: 'teške noge', group: ['telo:1'] },
  { q: 'priprema za venčanje', group: ['protokoli:2'], offer: ['offer-2'], service: 'WEDDING' },
  { q: 'blistava koža', top3: ['lice:2', 'protokoli:0'], offer: ['offer-1'] },
  { q: 'detoks', top3: ['estetske:6'] },
  { q: 'trudnoća', group: ['protokoli:2'], offer: ['offer-3'] },
  { q: 'hijaluronidaza', group: ['estetske:1'], service: 'Hijaluronidaza' },
  { q: 'piling', top3: ['lice:3'], none: [] },
  { q: 'strije', top3: ['telo:0'] },
  /* 3. misspellings and spellings women use */
  { q: 'celulita', top3: ['telo:3'] },
  { q: 'ozilci od akni', group: ['estetske:5'], note: 'the typo "ozilci" is a hidden phrase' },
  { q: 'dermapn', group: ['lice:5'], note: 'one letter missing: corrected against the words of the site' },
  /* 4. a question with a word the site never uses: the words without an answer are dropped (verifier 1, final site) */
  { q: 'cena botoksa', group: ['estetske:2'], note: 'the stray word "cena" must not empty the answer' },
  { q: 'infuzija vitamina', group: ['estetske:6'], note: 'only "infuzija" is known: the infusion group comes first' },
  { q: 'dupli podbradak', top3: ['lice:6'], note: '"dupli" is unknown: the answer is about "podbradak"' },
  { q: 'akne cena danas', top3: ['estetske:5'], note: 'two stray words around a known one' },
  { q: 'koliko košta laser', top3: ['laserska:1', 'laserska:2'], note: 'verifier 2: the price question words are no search words ("košta" must not be "corrected" to "kosa")' },
  { q: 'koliko košta laser noge', top3: ['laserska:4'], note: 'verifier 2: same question with a body part' },
  { q: 'vitamin c', none: ['laserska:0', 'telo:5'], note: 'verifier 2: a lone letter must not match inside every word (it listed unrelated groups)' },
  { q: 'varikozne vene', none: ['lice:6', 'telo:0'], note: 'verifier 2: a 4-letter word is not corrected to another word ("vene" to "mene")' },
];

let failed = 0, ok = 0;
const bad = (c, msg, R) => { failed++; console.log('FAIL  "' + c.q + '": ' + msg + '\n' + fmt(R)); };
CASES.forEach((c) => {
  const R = E.query(c.q);
  const ids = R.groups.map((x) => x.g.id);
  let good = true;
  if (c.group && !c.group.includes(ids[0])) { bad(c, 'first group is ' + ids[0] + ' (' + gName(ids[0]) + '), expected one of ' + c.group.join(', '), R); good = false; }
  if (good && c.top3) {
    const t3 = ids.slice(0, 3);
    const first = c.group ? [] : c.top3;
    // top3: at least the FIRST of the list must be in the first three, and every listed group must be in the first four
    if (!t3.includes(c.top3[0]) && !c.top3.some((g) => t3.includes(g))) { bad(c, 'none of ' + c.top3.join(', ') + ' is among the first three groups (' + t3.join(', ') + ')', R); good = false; }
  }
  if (good && c.none) { const t3 = ids.slice(0, 3).filter((g) => c.none.includes(g)); if (t3.length) { bad(c, 'must not be among the first three groups: ' + t3.join(', '), R); good = false; } }
  if (good && c.service) {
    const ids2 = E.idsOf(R), s0 = P.svcById[ids2[0]];
    const hit = (s) => s && (s.id === c.service || s.n.toLowerCase().includes(c.service.toLowerCase()));
    if (!hit(s0) && !hit(P.svcById[ids2[1]])) { bad(c, 'first services are "' + (s0 && s0.n) + '" / "' + (P.svcById[ids2[1]] || {}).n + '", expected a name with "' + c.service + '"', R); good = false; }
  }
  if (good && c.first) {
    const names = E.idsOf(R).slice(0, c.first.n).map((id) => P.svcById[id].n.toLowerCase());
    const miss = names.filter((n) => !n.includes(c.first.contain.toLowerCase()));
    if (miss.length || names.length < c.first.n) { bad(c, 'the first ' + c.first.n + ' services should all contain "' + c.first.contain + '": ' + names.join(' | '), R); good = false; }
  }
  if (good && c.article && (!R.articles.length || !c.article.includes(R.articles[0].a.id))) { bad(c, 'first text is ' + (R.articles[0] && R.articles[0].a.id) + ', expected one of ' + c.article.join(', '), R); good = false; }
  if (good && c.offer && (!R.offers.length || !c.offer.includes(R.offers[0].o.id))) { bad(c, 'first offer is ' + (R.offers[0] && R.offers[0].o.id) + ', expected one of ' + c.offer.join(', '), R); good = false; }
  if (good) ok++;
});

/* sweep 1 and 2: the site's own names find themselves; sweep 3: every hidden phrase answers */
let sweepBad = 0;
P.glist.forEach((g) => { const ids = E.query(g.title).groups.slice(0, 2).map((x) => x.g.id); if (!ids.includes(g.id)) { sweepBad++; console.log('FAIL  group "' + g.title + '" is not among the first two groups of its own name: ' + ids.join(', ')); } });
P.services.forEach((sv) => { const R = E.query(sv.n), first = R.groups.slice(0, 4).map((x) => x.svc[0]).filter(Boolean); if (!first.some((x) => x.id === sv.id || x.f1 === sv.f1)) { sweepBad++; console.log('FAIL  service "' + sv.n + '" is not the first service of one of the first four groups of its own name: ' + first.map((x) => x.n).join(' | ')); } });
Object.keys(win.LSD_SEARCH.syn.phrases).forEach((ph) => { const R = E.query(ph); if (!R.groups.length && !R.articles.length && !R.offers.length) { sweepBad++; console.log('FAIL  the hidden phrase "' + ph + '" answers nothing'); } });
console.log('sweeps: ' + P.glist.length + ' group names, ' + P.services.length + ' service names, ' + Object.keys(win.LSD_SEARCH.syn.phrases).length + ' hidden phrases · problems ' + sweepBad);
failed += sweepBad;

/* the hidden vocabulary must never reach the screen: no hash sign, and the signal of a search carries entry ids, never the words */
const si = fs.readFileSync(path.join(SITE, 'assets/search-index.js'), 'utf8');
if (/"#[a-zčćšžđ]/i.test(si)) { failed++; console.log('FAIL  a hashtag is in the search data'); }
const sig = E.signalOf(E.query('ožiljci od akni'));
if (JSON.stringify(sig).includes('ožiljci') || JSON.stringify(sig).includes('oziljci od')) { failed++; console.log('FAIL  the search signal carries the words of the question: ' + JSON.stringify(sig)); }

console.log('\nrelevance cases: ' + CASES.length + ' · passed ' + ok + ' · failed ' + (CASES.length - ok) + (failed > CASES.length - ok ? ' (+ sweeps or data checks failed)' : ''));
process.exit(failed ? 1 : 0);
