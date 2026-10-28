#!/usr/bin/env node
/* mutation-test.js: proves verify-content.js has teeth.
   Corrupts copies of content.json/content.js in a temp dir and checks that verify-content.js flags every corruption.
   ECHOSYSTEM-MOTHER AGENCY */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const verify = require('./verify-content.js');

const MUTATIONS = {
  'price changed in a cenovnik row': (c) => { c.pricing.tabs[0].groups[0].services[0].price = '52€ / 6.000 rsd'; },
  'diacritic dropped in a testimonial': (c) => { c.testimonials[0].quote = c.testimonials[0].quote.replace('već', 'vec'); },
  'service removed from a group': (c) => { c.pricing.tabs[1].groups[0].services.pop(); },
  'offer price altered': (c) => { c.offers[0].price = '395€ / 45.000 rsd'; },
  'blog excerpt retyped': (c) => { c.blog[3].excerpt = c.blog[3].excerpt.slice(0, -4) + '...!'; },
  'stat value changed': (c) => { c.stats.items[2].value = 1200; },
  'phone number changed': (c) => { c.locations[1].phone.display = '+381 66 177 118'; },
  '"new" copy string that already exists in the old site': (c) => { c.copy.newStrings[0].text = 'Zakaži'; },
};

function run({ contentPath, oldDir, copyNotesPath }) {
  const orig = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lsd-mut-'));
  fs.copyFileSync(copyNotesPath, path.join(tmp, 'COPY_NOTES.md'));
  const results = [];
  for (const [name, fn] of Object.entries(MUTATIONS)) {
    const c = JSON.parse(JSON.stringify(orig));
    fn(c);
    const j = JSON.stringify(c, null, 2);
    fs.writeFileSync(path.join(tmp, 'content.json'), j);
    fs.writeFileSync(path.join(tmp, 'content.js'), 'window.LSD_CONTENT = ' + j + ';');
    const r = verify.run({ contentPath: path.join(tmp, 'content.json'), oldDir, copyNotesPath: path.join(tmp, 'COPY_NOTES.md') });
    results.push({ name, caught: !r.ok, failures: r.failures.length, first: (r.failures[0] || '').slice(0, 140) });
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return results;
}
module.exports = { run };
if (require.main === module) {
  const out = path.resolve(__dirname, '..');
  const res = run({ contentPath: path.join(out, 'content.json'), oldDir: process.env.LSD_OLD_DIR || '/Users/vladajovic/Developer/LEPA SVAKI DAN/lepasvakidrugidan', copyNotesPath: path.join(out, 'COPY_NOTES.md') });
  res.forEach((r) => console.log((r.caught ? 'CAUGHT ' : 'MISSED ') + r.name + ' (' + r.failures + ' failure(s))'));
  const missed = res.filter((r) => !r.caught).length;
  console.log(missed ? 'MISSED ' + missed : 'ALL ' + res.length + ' MUTATIONS CAUGHT');
  process.exit(missed ? 1 : 0);
}
