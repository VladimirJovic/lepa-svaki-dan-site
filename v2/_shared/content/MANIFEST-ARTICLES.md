# MANIFEST-ARTICLES: Lepa Svaki Dan v2 texts pack

The treatment texts of the 21 Word documents (written by the owner, Tamara, with a copywriter) as data for the three v2 previews, plus the price-list links and a hidden search vocabulary. Complements `MANIFEST.md` (the old-site content pack). Generated 2026-10-07T16:33:36Z by ECHOSYSTEM-MOTHER AGENCY with `python3 _tools/build-texts-pack.py`.

- Verification: **ALL PASSED** (64 checks, `python3 _tools/verify-texts-pack.py`).
- Language: Serbian (sr), diacritics preserved. Reviewed content fixes are applied (see `CHANGES.md`): the owner is not a doctor, no em dashes.

## 1. Files (all in `v2/_shared/content/`)

| File | What it is |
|---|---|
| `articles.json` | Array of **21** article objects (see section 2). UTF-8 JSON. |
| `articles.js` | `window.LSD_ARTICLES = [...];` identical data, loads from `file://` via `<script src="../_shared/content/articles.js">`. |
| `segments.json` | **4** segments: ordered article ids, price-list tabs/groups, suggested hero image, one verbatim intro quote. |
| `service-links.json` | Per article the related price-list groups and services (primary/related, with the basis of every match), the two old SERVICE_BLOG_LINKS rules reconciled, unmatched articles (none), reverse index group -> articles and service -> articles. |
| `search-synonyms.json` | HIDDEN search vocabulary: **36** entries + **12** invented natural-language questions, phrase variants with and without diacritics -> groups/services/articles/segments/offers, with a note and machine-checked evidence per target. |
| `CHANGES.md` | Every replacement made by the content fixes. |
| `MANIFEST-ARTICLES.md` | This file. |
| `_tools/build-texts-pack.py`, `_tools/texts_curation.py`, `_tools/texts_search_data.py`, `_tools/lsd_common.py` | Builder and the reviewed curation data (price-list links, search entries, hero images, comment resolutions). |
| `_tools/verify-texts-pack.py`, `_tools/verification-report.texts.json` | Independent verifier and its machine-readable report. |
| `_tools/content-fixes.js`, `_tools/content-fixes.rules.json`, `_tools/fixes-log.content.json`, `_tools/fixes-log.articles.json` | The shared fix rules and the logs of what they changed. |

Source documents: `/Users/vladajovic/Developer/LEPA SVAKI DAN/procedure/` (4 folders = 4 segments; the folder "Estske procedure" is spelled with a typo, the segment is "Estetske procedure").

## 2. Shape of `articles.json`

```json
{ "id": "art-6", "slug": "botulinski-toksin-tipa-a-botoks-tretman", "segmentId": "estetske",
  "title": "...", "subtitle": "", "blocks": [ {"type":"h2","text":"..."}, {"type":"p","text":"...","links":[...]}, {"type":"ul","items":["..."]} ],
  "excerpt": "...", "readMinutes": 3, "sourceFile": "procedure/.../x.docx",
  "hasPlaceholders": false, "placeholders": [], "wordCount": 565, "titleWordCount": 6,
  "legacy": {...}, "crossLinkHints": [...] }
```

| Field | Meaning |
|---|---|
| `id`, `slug`, `segmentId` | `art-1` ... `art-21` in document order (= old blog order); `slug` = ASCII kebab-case of the title; `segmentId` = `dermatologija`, `estetske`, `kozmetika` or `telo` (the old blog category keys). |
| `title`, `subtitle` | The first line of the document split at its FIRST colon. `subtitle` is `""` when the line has no colon (11 of 21 first lines have a colon, 10 do not). |
| `blocks[]` | Document order and structure preserved: `h2` (Word Heading 2), `h3` (Heading 3, **used in 5 articles; a fifth type beyond h2/p/ul/ol, because the documents have sub-sections**), `p`, `ul` / `ol` with `items[]`. `ol` only where Word numbering is decimal (1 list); every other list is a bullet list. Empty paragraphs are skipped. The title line is not a block. |
| `blocks[].links[]` | Hyperlinks the copywriter put in the Word text (59): `{text, legacyHref, target}` (lists also carry `item`). `legacyHref` is the URL on the live lepasvakidan.rs site, kept for reference only. `target` = `{type: article\|segment\|pricelist\|external\|none, id}` says where it should point in the new site. |
| `blocks[].flag` | Only on one paragraph (Preime Dermafacial): a copywriter note naming the site the text was taken from, not article copy. |
| `excerpt` | First 170 characters of the first paragraph, cut at a word boundary, no ellipsis; a trailing colon/comma is dropped. |
| `readMinutes`, `wordCount` | `wordCount` = words of all blocks (a word = a token with a letter or digit; every placeholder counts as one word; the title is not included); `readMinutes` = ceil(wordCount / 200), minimum 1. |
| `placeholders[]` | The blanks of the Word documents: `{token, kind, blockIndex, blockType, itemIndex?, context}`. The blank is replaced in the text by `[[dopuniti: ime lekara]]` (a doctor) or `[[dopuniti: naziv lasera]]` (a laser device), chosen from the sentence. The "dr" in front of a blank belongs to another doctor and is left in place. **Never show a text with a token on a public page.** |
| `legacy` | The matching old blog post in `content.json` `blog[]`: `blogIndex` (= article number - 1), `blogTitle`, `titleMatch` (`exact`, or `order` when the title changed), `blogWordCount`, `blogHadBlanks`. |
| `crossLinkHints[]` | The copywriter's Word comments (17): which words should link to which other text. `{comment, anchorText, blockIndex, resolution: confident\|partial\|none, basis, targetArticleIds, targetSegmentIds}`. Hints are data, not instructions to the builders. |

## 3. Counts

| Item | Count |
|---|---|
| Articles | **21** (Dermatologija 4, Estetske procedure 4, Kozmetički tretmani 7, Telo 6) |
| Blocks | 396 (h2 71, h3 17, p 298, ul 9, ol 1) |
| Words (all articles) | 9,681 |
| Articles with placeholders | **4** (6 blanks) |
| Hyperlinks in the texts / Word comments | 59 / 17 |
| Price-list groups linked / without an article | 28 of 31 / 3 |
| Services linked to an article | 164 of 210 |
| Unmatched articles | 0 |
| Search entries / questions / phrases | 36 / 12 / 314 |

## 4. Article -> segment -> price-list groups -> placeholders

Groups: **bold** = primary (the group is the subject), plain = related. Group ids are `<tab>:<index>`.

| # | Article | Segment | Words | Min | Price-list groups | Placeholders |
|---|---|---|---|---|---|---|
| 1 | Laserska dermatologija Candela laserima | Dermatologija | 207 | 2 | **Dermatologija** `estetske:5` | 2 (ime lekara, naziv lasera) |
| 2 | Dermatološki/pregled dermatologa | Dermatologija | 361 | 2 | **Dermatologija** `estetske:5`; Rast kose `estetske:7` | 2 (ime lekara) |
| 3 | Radiotalasno uklanjanje promena na koži | Dermatologija | 325 | 2 | **Dermatologija** `estetske:5` | 1 (ime lekara) |
| 4 | PRP i mezoterapija: Tretmani skalpa za pospešivanje rasta kose | Dermatologija | 442 | 3 | **Rast kose** `estetske:7`; Biorevitalizacija i skinbosteri `estetske:3` | 1 (ime lekara) |
| 5 | Regenerativne procedure i biorevitalizacija lica, vrata i dekoltea | Estetske procedure | 497 | 3 | **Biorevitalizacija i skinbosteri** `estetske:3` | none |
| 6 | Botulinski toksin tipa A - Botoks tretman | Estetske procedure | 565 | 3 | **Botox tretman** `estetske:2`; Biološki tretmani `lice:1`; Venus Glow / Dermafacial `lice:2`; Hemijski pilinzi `lice:3`; Hijaluronski fileri `estetske:1`; GLOW & GO `protokoli:0` | none |
| 7 | Hijaluronski fileri | Estetske procedure | 1227 | 7 | **Hijaluronski fileri** `estetske:1`; Botox tretman `estetske:2` | none |
| 8 | Lifting nitima: Nehirurški lifting i konturisanje | Estetske procedure | 395 | 2 | **Lifting niti i mezoniti** `estetske:4` | none |
| 9 | Biološki tretmani lica: Užitak koji sebi morate priuštiti | Kozmetički tretmani | 434 | 3 | **Biološki tretmani** `lice:1`; Higijenski tretmani `lice:0`; Presoterapija ProBallancer `telo:1` | none |
| 10 | Dermapen i hemijski pilinzi za „holivudski tretman“ | Kozmetički tretmani | 455 | 3 | **Hemijski pilinzi** `lice:3`; **Dermapen** `lice:5` | none |
| 11 | Higijenski tretmani lica: Za dubinsko čišćenje i regeneraciju kože | Kozmetički tretmani | 399 | 2 | **Higijenski tretmani** `lice:0` | none |
| 12 | 7E MyoLift™ MD tretman: Neinvazivni trening vašeg lica | Kozmetički tretmani | 496 | 3 | **Myolift i masaže lica** `lice:7`; Biološki tretmani `lice:1`; Venus Glow / Dermafacial `lice:2`; Anti-aging protokoli `protokoli:1`; Posebna stanja i prilike `protokoli:2` | none |
| 13 | Preime Dermafacial: Napredna tehnologija za sofisticirano podmlađivanje kože | Kozmetički tretmani | 281 | 2 | **Venus Glow / Dermafacial** `lice:2`; Biološki tretmani `lice:1`; Tretmani za ciljanu negu `telo:5`; Posebna stanja i prilike `protokoli:2` | none |
| 14 | Venus Glow: Za dubinsko čišćenje i hidrataciju kože | Kozmetički tretmani | 397 | 2 | **Venus Glow / Dermafacial** `lice:2`; Biološki tretmani `lice:1`; Tretmani za ciljanu negu `telo:5`; GLOW & GO `protokoli:0`; Posebna stanja i prilike `protokoli:2` | none |
| 15 | Venus Legacy: Revolucija u zatezanju kože lica | Kozmetički tretmani | 421 | 3 | **Venus Legacy lice** `lice:6`; Myolift i masaže lica `lice:7`; Anti-aging protokoli `protokoli:1` | none |
| 16 | AWT (Acoustic Wave Therapy) Storz tretman za telo | Telo | 332 | 2 | **AWT, Anticelulit i preoblikovanje** `telo:3`; Venus Legacy telo `telo:0`; Presoterapija ProBallancer `telo:1` | none |
| 17 | Med Contour tretman za oblikovanje tela | Telo | 286 | 2 | **MedContour, Smanjenje masnih naslaga** `telo:4` | none |
| 18 | Tretmani tela za opuštanje i negu | Telo | 518 | 3 | **Tretmani za ciljanu negu** `telo:5`; Venus Legacy telo `telo:0`; Presoterapija ProBallancer `telo:1`; Masaže `telo:2` | none |
| 19 | ProBallancer presoterapija: Aparaturna limfna drenaža | Telo | 332 | 2 | **Presoterapija ProBallancer** `telo:1`; Biološki tretmani `lice:1`; Myolift i masaže lica `lice:7`; Masaže `telo:2`; Tretmani za ciljanu negu `telo:5`; GLOW & GO `protokoli:0`; Posebna stanja i prilike `protokoli:2`; Summer Body Ready protokoli `protokoli:3` | none |
| 20 | Venus Legacy tretmani: Za preoblikovanje i zatezanje tela | Telo | 536 | 3 | **Venus Legacy telo** `telo:0`; Posebna stanja i prilike `protokoli:2`; Summer Body Ready protokoli `protokoli:3` | none |
| 21 | Bezbolna i bezbedna: Laserska epilacija Venus Velocity aparatom | Telo | 775 | 4 | **Paketi, celo telo** `laserska:0`; **Lice** `laserska:1`; **Telo, gornji deo** `laserska:2`; **Telo, donji deo** `laserska:3`; **Kombinacije** `laserska:4` | none |

Articles WITHOUT a price-list group: **none**. Price-list groups without an article: Mezoporacija `lice:4`, Pregled i konsultacije `estetske:0`, Infuziona suplementacija `estetske:6`.

## 5. Open items for the client

1. **Missing names.** 6 blanks in 4 articles: Laserska dermatologija Candela laserima (2); Dermatološki/pregled dermatologa (2); Radiotalasno uklanjanje promena na koži (1); PRP i mezoterapija (1). The doctor's name (and the Candela laser model available in the centre) must come from the client. Nothing was invented.
2. **Possible hint, not used:** the price list names "dr Krstić" for the specialist dermatological exam (estetske:5:0). It may be the doctor of the blanks, but the texts do not say so; confirm before filling anything in.
3. `Specijalistički pregled Tamara Vujačić` (estetske:0:1): see `CHANGES.md` section A.
4. The first line of `Klasična dermatologija.docx` reads "Dermatološki/pregled dermatologa" (no space after the slash). Kept verbatim; the old blog title was "Klasična dermatologija: Šta obuhvata dermatološki pregled?" (`legacy.blogTitle`).
5. The title "Bezbolna i bezbedna: Laserska epilacija Venus Velocity aparatom" gives the slug `bezbolna-i-bezbedna` (title = part before the colon, as specified). Consider the slug `laserska-epilacija-venus-velocity` when the real URLs are decided.
6. The copywriter links point to the live site (lepasvakidan.rs, see `links[].legacyHref`); `links[].target` maps them to this pack where a text exists. No text exists for mesotherapy, massages, the "Glow&Go" protocols or a doctor biography.
7. Preime Dermafacial: the Word text ends with a note naming the manufacturer's website as the source of the text (`blocks[].flag`). Check the rights before publishing that text.
8. Typos kept verbatim for the copywriter to confirm (art-N = article number): "leserske" (art-1), "pigmentih" (art-1), "interdermalni" (art-3), "stpljivim" and "pišete" (art-4), "odgovori" for "odgovorni" (art-6), "liftiga", "majči pogled" and "izgleda očiju" (art-8), "prvu prvenciju" (art-9), "boda" for "voda" and "važa koža" (art-14), "rezulate", "tekturu" and "eletromagnetna" (art-15), "kolegana" (art-16), "Najčešćše" (art-17), "čuščje" and "čineću" (art-18; the price list says "guščije"), "elektromangnetna" (art-20), "laserke epilacije" (art-21); "Miolift" next to "MyoLift" (art-12).
9. The three previews (a-lumine, b-alder, c-luzia) and `_deploy/` still carry the old owner title and em dashes in their own content copies; they need a re-sync from this pack (see `CHANGES.md` section E).

## 6. Verification (`_tools/verify-texts-pack.py`)

- PASS A articles.json holds 21 articles
- PASS A ids are art-1 ... art-21 in order (no zero padding)
- PASS A slugs unique, ASCII kebab-case
- PASS A per segment 4 / 4 / 7 / 6 (dermatologija, estetske, kozmetika, telo)
- PASS A every article has the required fields
- PASS A block types are h2|h3|p|ul|ol, lists have items, others have text
- PASS A the 21 .docx files of procedure/ are each used exactly once
- PASS A document structure: block counts and list grouping equal the .docx XML
- PASS A block types equal the .docx styles (Heading 2/3, lists, bullets vs decimal)
- PASS A order and text of every paragraph/list item equal the .docx XML (after the reviewed fixes)
- PASS A title and subtitle = first line split at the first colon
- PASS A word counts agree: XML == python-docx == textutil == pack (title + blocks)
- PASS A readMinutes = ceil(words / 200), minimum 1
- PASS A placeholders: blanks in the source == tokens == placeholders[] == hasPlaceholders
- PASS A 6 blanks in 4 articles
- PASS A placeholder kinds: 5 x ime lekara, 1 x naziv lasera (only in the Candela text)
- PASS A no underscore blank left, no name invented after "dr" (only the token follows it)
- PASS A excerpts: prefix of the first paragraph, <= 170 chars, cut on a word boundary, no ellipsis
- PASS A all hyperlinks (59) and Word comments (17) of the documents are in the pack
- PASS A every link text occurs in its block
- PASS A every link has a legacyHref and a target type
- PASS A target article ids of links and hints exist
- PASS A legacy blog index/title/wordCount refer to content.json blog[] (same order)
- PASS A legacy titleMatch: 20 exact, 1 by order (the dermatological exam text was renamed)
- PASS B no em dash (U+2014) anywhere in the shared content folder (26 files scanned)
- PASS B en dashes only inside numeric ranges (whole folder)
- PASS B no "Dr"/"dr" directly before "Tamara" anywhere in the shared content folder
- PASS B founder.signature = "Tamara Vujačić, Lepa Svaki Dan", used as founder.signatureName, founder.name has no title
- PASS B testimonial 1 says "Tamara", not a doctor
- PASS B services still 210 (182 standard + 28 laser)
- PASS B sha256 of the SOURCE lines (old names) == checksums.serviceLinesSha256 in the new content.json and in MANIFEST.md
- PASS B sha256 of the lines after the fixes == checksums.serviceLinesSha256AfterFixes
- PASS B id|price|priceEur|priceRsd of all 210 services identical to the backup (prices untouched)
- PASS B name-independent checksums.priceLinesSha256 identical before/after
- PASS B every checksum of the old pack is unchanged (sums and the source sha)
- PASS B counts unchanged (_meta.counts)
- PASS B MANIFEST.md price checksum table: all 10 original rows are present unchanged (12 rows now, the new ones are additions)
- PASS B content.json differs from the backup ONLY by the reviewed fixes (every other string, value and key is identical)
- PASS B hours without leading zero ("9:00"), no zero-padded numbering in data
- PASS B content.js (window.LSD_CONTENT) equals content.json
- PASS B articles.js (window.LSD_ARTICLES) equals articles.json (21 items)
- PASS C 4 segments with the exact names (diacritics) in folder order
- PASS C segment ids equal the old blog category keys; slugs ASCII
- PASS C ordered article ids per segment equal the articles (4 / 4 / 7 / 6) and cover all 21 once
- PASS C hero images exist in the media pack and their files are on disk
- PASS C every intro quote (and its alternative) is a verbatim string of the articles or of content.json
- PASS C price-list tabs/groups of every segment exist and are non-empty
- PASS D all 21 articles have price-list groups, unmatched list is empty (and said so explicitly)
- PASS D every group id and service id in service-links.json exists in content.json
- PASS D every linked service sits inside a linked group of the same article
- PASS D reverse index group -> articles equals the article -> groups lists, covers all 31 groups
- PASS D old SERVICE_BLOG_LINKS (higijenski -> art-11, dermafacial -> art-13) are reproduced, 7 services
- PASS D services linked to an article agree with serviceToArticles
- PASS E 36 entries + 12 invented questions
- PASS E all 35 phrases of the brief are covered (folded)
- PASS E phrases are lowercase and every phrase exists with and without diacritics
- PASS E every entry has a note, a strength and evidence for every target
- PASS E every target id exists (groups, services, articles, offers, segments)
- PASS E independent re-check: every target is supported by its own text or by a targeted linked article
- PASS E the two weak entries say so (ukljesteni vrat, rastezanje) and rastezanje is marked directEvidence:false
- PASS E pregnancy question keeps AWT, radiowave and laser as cautions, not as targets
- PASS F no zero-padded numbering in the new data files (ids art-1 ... art-21, order 1 ... 4)
- PASS F files present: articles.json/js, segments.json, service-links.json, search-synonyms.json, CHANGES.md
- PASS F MANIFEST-ARTICLES.md present and names every new file

Word counts per document (independent recounts; "source" = every paragraph of the Word file counted straight from the XML, python-docx = its own text, textutil = macOS converter, pack = title + blocks of the pack; a blank or placeholder counts as one word, a lone dash as none):

| # | Document | source (XML) | python-docx | textutil | pack | old blog |
|---|---|---|---|---|---|---|
| 1 | Candela - Laserska dermatologija.docx | 211 | 211 | 211 | 211 | 207 |
| 2 | Klasična dermatologija.docx | 363 | 363 | 363 | 363 | 365 |
| 3 | Radiotalasi i uklanjanje promena.docx | 330 | 330 | 330 | 330 | 325 |
| 4 | Tretmani skalpa i rast kose.docx | 451 | 451 | 451 | 451 | 444 |
| 5 | Biorevitalizacija i regenerativne procedure.docx | 505 | 505 | 505 | 505 | 501 |
| 6 | Botulin toksin tipa A - Botoks.docx | 571 | 571 | 571 | 571 | 566 |
| 7 | Hijaluronski fileri.docx | 1229 | 1229 | 1229 | 1229 | 1228 |
| 8 | Lifting niti.docx | 401 | 401 | 401 | 401 | 397 |
| 9 | Biološki tretmani.docx | 442 | 442 | 442 | 442 | 435 |
| 10 | Dermapen i hemijski pilinzi.docx | 462 | 462 | 462 | 462 | 456 |
| 11 | Higijenski tretmani.docx | 408 | 408 | 408 | 408 | 403 |
| 12 | Myolift MD.docx | 504 | 504 | 504 | 504 | 502 |
| 13 | Preime Dermafacial protokoli.docx | 289 | 289 | 289 | 289 | 269 |
| 14 | Venus Glow protokoli.docx | 405 | 405 | 405 | 405 | 397 |
| 15 | Venus Legacy.docx | 428 | 428 | 428 | 428 | 422 |
| 16 | AWT Storz tretman.docx | 340 | 340 | 340 | 340 | 332 |
| 17 | Med Contour.docx | 292 | 292 | 292 | 292 | 288 |
| 18 | Negujući tretmani tela.docx | 524 | 524 | 524 | 524 | 521 |
| 19 | ProBallancer presoterapija.docx | 337 | 337 | 337 | 337 | 335 |
| 20 | Venus Legacy protokoli.docx | 544 | 544 | 544 | 544 | 541 |
| 21 | Venus Velocity laserska epilacija.docx | 783 | 783 | 783 | 783 | 779 |

## 7. Rebuild

```bash
cd "/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/_shared/content"
node _tools/build-content.js          # content.json/js (+ fixes), MANIFEST.md, COPY_NOTES.md
python3 _tools/build-texts-pack.py    # articles/segments/links/search + CHANGES.md + this file (pip3 install --user python-docx)
python3 _tools/verify-texts-pack.py   # exit code 1 on any failed check
```

---
Pripremio ECHOSYSTEM-MOTHER AGENCY · 2026-10-07
