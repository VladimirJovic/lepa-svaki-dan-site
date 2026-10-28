# MANIFEST — Lepa Svaki Dan v2 content pack

Single source of truth for the three v2 design previews (A, B, C). Everything on the previews must come from `content.json` / `content.js`, which were extracted 1:1 from the old site. Reviewers: compare the numbers in section 3 against each built preview.

- Generated: 2026-10-07T11:57:03.725Z (ECHOSYSTEM-MOTHER AGENCY)
- Language: Serbian (sr), diacritics preserved exactly. Prices, names and numbers are untouched source strings.
- Verification status: **ALL 61 CHECKS PASSED** (see section 4).

## 1. Files

| File | What it is |
| --- | --- |
| `content.json` | Canonical data (UTF-8 JSON). Use for build scripts / Node. |
| `content.js` | `window.LSD_CONTENT = {...};` — identical data, loads from `file://` via `<script src="../_shared/content/content.js">` (no fetch needed). |
| `MANIFEST.md` | This file: structure, counts, checksums, verification, open issues. |
| `COPY_NOTES.md` | 12 suggested NEW short UI strings (flagged as additions, not 1:1 content). |
| `_tools/build-content.js` | Re-extracts everything from the old site and regenerates all files above. `node _tools/build-content.js` |
| `_tools/verify-content.js` | Independent re-verification (raw-text recount + provenance + rendered-DOM recount in jsdom). `node _tools/verify-content.js` |
| `_tools/mutation-test.js` | Corrupts copies of the pack and proves the verifier catches each corruption. `node _tools/mutation-test.js` |
| `_tools/write-manifest.js`, `_tools/verification-report.json` | Manifest renderer and the full machine-readable verification report. |

Old site (source, untouched): `/Users/vladajovic/Developer/LEPA SVAKI DAN/lepasvakidrugidan`. Image files are referenced by path only; this pack does not copy them (`v2/_shared/img/` is the intended shared destination).

| Source file | Bytes | sha256 |
| --- | --- | --- |
| `index.html` | 149,416 | `27236adac529d1a35b30838299a1284c2fc33507122df1ea4d0375b1930f5fd9` |
| `blog.html` | 140,808 | `c841d70590689d3d9fb8db7d4d923518ddbad320755b4cf48cbcfe46f742b719` |
| `posebna-ponuda.html` | 35,938 | `7d88b9afb35d184f1bdaa37d27fe3ace05c372746d8f87ecd583d2b4ca8669e1` |

## 2. Structure of `content.json`

| Key | Content |
| --- | --- |
| `_meta` | Source hashes, conventions, `counts`, `checksums`, `warnings`. |
| `site`, `nav`, `hero`, `about`, `stats`, `quote`, `founder` | Page meta (title/description of the 3 pages), nav links + phone menu + CTA, hero (claim, morphing headline phrases, sub, CTAs, bar with hours), about copy, **stats** (15+ / 2 / 1.000+ as displayed), founder quote block, founder info. |
| `locations[]` | 2 locations: concept, area, address, phone (display + coin variant), tel/WhatsApp links, image + alt. `mapUrl` and `hours` are `null` (not in old site). |
| `contact` | Email, primary WhatsApp, phones, global hours, social links, `mapUrls: null`. |
| `pricing` | Cenovnik: heading, contact note, footnotes, validity date, **`tabs[]`** (4 standard tabs + laser tab, groups, services), UI strings, display rules. |
| `payment` | Payment modal text (3 paragraphs) + one-line payment note. |
| `favorites[]`, `gifts[]` | FAVORITES_PICKS / GIFT_PICKS with the resolved cenovnik entry. |
| `verticals[]` | 5 treatment categories (title, summary, stated count string, image, location, link). |
| `testimonials[]` | 4 testimonials (quote, author, tag). |
| `quiz` | QUIZ_QUESTIONS (kept for later) + result-screen UI strings + inline SVG icons. |
| `offers[]` | posebna-ponuda.html: 4 offers (tag, title, description = what is included, price, note, CTA). `oldPrice`/`validity` = `null`. |
| `blog[]`, `blogCategories[]`, `serviceBlogLinks[]` | blog.html teasers (title, derived slug/anchor, excerpt, image, category, tags; `date` = `null`), category tabs with counts, service-to-article links. |
| `search` | TAG_RULES, SEARCH_SYNONYMS, OFFERS_INDEX, placeholders, empty-state template, scoring note. |
| `sections` | Heading/intro/UI copy for locations, favorites, gifts, verticals, testimonials, offers, blog sections. |
| `cta{home,offers,blog}` | The three CTA bands (eyebrow, headline, body, buttons). |
| `footer` | Brand, description, 3 link columns, copyright template, credit. |
| `images` | 14 image files used by the old site (relative path, absolute path, bytes, usage, alt). |
| `allServices[]` | Flat index: `{id, tab, tabLabel, group, name, description, price, priceEur, priceRsd, onRequest, duration, location, locationLabel, tags, highlight, note, blogPost}` (laser rows also carry `priceNB`/`priceBW`). |
| `copy.newStrings[]` | The NEW UI strings (all `isNew: true`). |

Old JS name → path in `content.json`:

| Old name | Path |
| --- | --- |
| `pricingTabs` | `pricing.tabs` where `kind === "standard"` (4 tabs) |
| `laserGroups` | `pricing.tabs` where `id === "laserska"` → `.groups` (5 groups; `priceNB`/`priceBW` kept, `price` = what the old site shows) |
| `verticals` / `testimonials` | `verticals[]` / `testimonials[]` |
| `QUIZ_QUESTIONS` | `quiz.questions` |
| `SERVICE_BLOG_LINKS` | `serviceBlogLinks[]` (+ `service.blogPost`) |
| `FAVORITES_PICKS` / `GIFT_PICKS` | `favorites[]` / `gifts[]` |
| `OFFERS_INDEX` / `TAG_RULES` / `SEARCH_SYNONYMS` | `search.offersIndex` / `search.tagRules` / `search.synonyms` |
| `specialOffers` (posebna-ponuda.html) | `offers[]` |
| `blogPosts` (blog.html) | `blog[]` (teaser fields only; bodies stay in the old file) |

## 3. Counts and checksums (compare built sites against these)

Counts as the old site renders them (laser epilacija is the 5th tab in the old cenovnik UI):

| Item | Count | Read from |
| --- | --- | --- |
| Cenovnik tabs | **5** (4 standard + 1 laser) | `pricing.tabs.length` |
| Cenovnik groups | **31** (26 standard + 5 laser) | sum of `tabs[].groups.length` |
| Services (total) | **210** (182 standard + 28 laser rows) | `allServices.length` |
| Services with "💜 akcija" badge (highlight) | 44 | standard tabs only |
| Services priced "na upit" | 3 | `allServices[].onRequest` |
| Services with stated duration | 3 | `allServices[].duration` (only "N min" in the name) |
| Services linked to a blog post | 7 | `allServices[].blogPost` |
| Testimonials | **4** | `testimonials.length` |
| Special offers | **4** | `offers.length` |
| Blog posts | **21** (dermatologija 4, estetske 4, kozmetika 7, telo 6) | `blog.length` |
| Treatment categories (verticals) | 5 | `verticals.length` |
| Favorites / gift picks | 4 / 4 | `favorites`, `gifts` |
| Quiz questions / options | 3 / 11 | `quiz.questions` |
| Locations / phones | 2 / 2 | `locations`, `contact.phones` |
| Nav links | 6 | `nav.links` |
| Stats shown | 15+ godina prakse · 2 koncepta u Beogradu · 1.000+ klijenata godišnje | `stats.items[].display` |
| Price list valid from | 15.03.2026. | `pricing.validFrom` |
| TAG_RULES / SEARCH_SYNONYMS | 34 / 10 | `search` |
| Image files | 14 | `images` |

Per tab:

| Tab id | Label | Groups | Services | Highlighted |
| --- | --- | --- | --- | --- |
| `lice` | Tretmani lica | 8 | 58 | 6 |
| `telo` | Tretmani tela | 6 | 36 | 4 |
| `estetske` | Estetske procedure | 8 | 62 | 20 |
| `protokoli` | Naši protokoli | 4 | 26 | 14 |
| `laserska` | Laserska epilacija | 5 | 28 | 3 |

Per group (title: services):

- **Tretmani lica**: Higijenski tretmani 6 · Biološki tretmani 11 · Venus Glow / Dermafacial 5 · Hemijski pilinzi 9 · Mezoporacija 2 · Dermapen 7 · Venus Legacy lice 7 · Myolift i masaže lica 11
- **Tretmani tela**: Venus Legacy telo 8 · Presoterapija ProBallancer 5 · Masaže 6 · AWT, Anticelulit i preoblikovanje 4 · MedContour, Smanjenje masnih naslaga 6 · Tretmani za ciljanu negu 7
- **Estetske procedure**: Pregled i konsultacije 2 · Hijaluronski fileri 7 · Botox tretman 6 · Biorevitalizacija i skinbosteri 17 · Lifting niti i mezoniti 6 · Dermatologija 14 · Infuziona suplementacija 4 · Rast kose 6
- **Naši protokoli**: GLOW & GO 6 · Anti-aging protokoli 6 · Posebna stanja i prilike 5 · Summer Body Ready protokoli 9
- **Laserska epilacija**: Paketi, celo telo 5 · Lice 6 · Telo, gornji deo 5 · Telo, donji deo 7 · Kombinacije 5

### Price checksums

Rule: for every service take the **lowest** figure of the price string (before `/` for €, after `/` for rsd; `.` is the thousands separator; ranges such as `400–500€` use the lower bound; `na upit` and `—` count as 0). Laser rows use the price the old UI shows (lower of NB/BW, prefixed `od `).

| Checksum | Value |
| --- | --- |
| Σ € of 182 standard services (lowest figure) | **37,957** |
| Σ € of 182 standard services (highest figure of ranges) | 38,082 |
| Σ rsd of 182 standard services (lowest) | **4,437,700** |
| Σ rsd of 182 standard services (highest) | 4,452,500 |
| Σ € laser as displayed (28 rows, merged price) | **5,935** |
| Σ € laser Novi Beograd column (28 rows) | 3,355 |
| Σ € laser Waterfront column (28 rows) | 5,541 |
| Σ € of all 210 services as displayed | **43,892** |
| Σ € of the 4 special offers / Σ rsd | **1,610** / 188,700 |
| sha256 of `tab|group|name|price` lines (210 lines, source order) | `b45b4b30a55758ef833b3e1f0c0863cfa97c5206daf90816f004186547e0f53e` |

**Recommended review hook for builders:** give every rendered service a `data-service-id="<id>"` (id from `allServices[].id`), every tab `data-tab-id`, every group `data-group-id`. A reviewer can then run, in DevTools on a preview:

```js
const n = (s) => document.querySelectorAll(s).length;
({ services: n('[data-service-id]'), tabs: n('[data-tab-id]'), groups: n('[data-group-id]') }) // expect 210 / 5 / 31 on the full price list
```

If a preview intentionally shows only a teaser subset (e.g. 3 blog posts, 4 offers), it must state that in its own notes; the full counts above still apply to the data.

## 4. Verification (re-computed from the OLD html, not from the extractor)

Run at 2026-10-07T11:57:04.097Z — 61/61 checks passed, 0 failures.

- **A. Raw-text recount** (regex over the old source lines, no JS evaluation, different number parser): 5 tabs (incl. laser), 31 groups, 182 + 28 = 210 services, 44 highlighted, Σ € standard 37,957, Σ rsd standard 4,437,700, laser NB 3,355 / BW 5,541, 4 offers, 21 blog posts, 4 testimonials, 5 verticals, 3 quiz questions, 34 tag rules. All equal to the counts above.
- **B. Provenance:** 2,987 verbatim string values in `content.json` were each found in the old source (raw, entity-decoded or tag-stripped text); not found: **0**. Derived fields are excluded and listed in section 6.
- **C. Rendered-DOM recount:** the real old `index.html`, `posebna-ponuda.html` and `blog.html` were executed in jsdom; every tab was clicked and every rendered group/row (name, description, price, 💜 badge, blog-link, merged laser price) was compared row-by-row with `pricing.tabs`: **0 mismatches**. Rendered dom recount: 5 tabs, 31 groups, 182 + 28 services, Σ € standard 37,957, Σ rsd 4,437,700, laser merged 5,935; bento cards, favorites, gifts, quiz question 1, stats, testimonials (stepped through the carousel), nav links, footer social, 4 offer cards, 21 blog cards and blog tab counts all equal `content.json`.
- **D. Parity:** `content.js` deep-equals `content.json`.
- **E. NEW copy:** none of the 12 strings in `COPY_NOTES.md` exists as a text node or string literal in the old site; all are listed there.
- **Mutation test** (`_tools/mutation-test.js`): 8 deliberately corrupted copies (price changed in a cenovnik row; diacritic dropped in a testimonial; service removed from a group; offer price altered; blog excerpt retyped; stat value changed; phone number changed; "new" copy string that already exists in the old site) — verifier flagged 8/8.

## 5. Conventions

- **html:** Fields named *Html / html contain only <em> (= the old "font-display-italic text-lila" accent word), <strong>, <a> and <br>. Entities are kept as in the source (&amp;). Inline styles were stripped.
- **text:** Plain-text twins of html fields. "\n" marks an old <br>.
- **derived:** Fields listed under "Derived fields" in MANIFEST.md were computed from source data; everything else is verbatim.
- **locationCodes:** service.location: nb = Beauty Concept Novi Beograd, bw = Wellbeing Concept Belgrade Waterfront, both = obe. verticals[].location uses beauty/wellbeing/both.
- **noSourceValue:** null = the old site has no such value (blog date, offer old price/validity, map URLs, per-location hours). Do not invent one.
- **ids:** Service ids are "<tabId>:<groupIndex>:<serviceIndex>" (0-based, source order). Names are NOT unique.
- **imagePaths:** Image paths are relative to the OLD site folder (assets/images/...). images{} lists absolute paths on disk.

### Display rules carried over from the old site

- service.location (nb/bw/both) is intentionally NOT shown per service on the old site (client decision, comment in old index.html / izmene.txt). Keep it in data; do not render a per-service location pill without client sign-off. (The 5 treatment categories in verticals[] DO show a location badge on the old site.)
- Laser tab shows ONE merged price per row (unified price: the lower of NB/BW prefixed "od ", or the only available price). priceNB/priceBW stay in data only.
- highlight=true renders the badge "💜 akcija" on standard rows. Laser rows carry a highlight flag the old UI never rendered.
- Services whose name contains "higijenski" or "dermafacial" are linked to a blog post (service.blogPost = post title; see blog[] / serviceBlogLinks).
- Group header shows "<N> usluga". Old UI opens the first group of a tab by default; one group open at a time.
- Search (home): min 2 chars, 150 ms debounce, max 10 results; scoring in `search.scoring`. Synonyms and tag rules are in `search`.
- Payment modal: shown once per session when the price list first comes into view (`payment.modal.behaviour`).
- Hero headline cycles "Budi" + `hero.headline.phrases` (smirena, → srećna, → lepa, **svaki dan.**).

## 6. Derived fields (computed, not verbatim)

- Services: `id`, `slug`, `priceEur`, `priceRsd`, `onRequest`, `duration`, `tags` (same `deriveTags()` logic as the old search; laser rows tagged from the name only), `blogPost` (from SERVICE_BLOG_LINKS). Laser rows: `price`, `priceFrom`, `location`, `priceNBParsed`, `priceBWParsed` (old `unifiedLaserPrice()` logic; `location` is inferred from which columns have a price).
- `allServices[]` (whole flat index) and `pricing.validFromISO`, `stats.items[].display`, `hero.bar.hoursParsed`, `contact.hours.parsed`, `contact.social[].href` (`null` where the old href was `#`).
- `blog[]`: `index`, `slug`, `anchor`, `anchorByIndex`, `tags`, `blockCount`, `wordCount`, `hasPlaceholderBlanks`, `date` (= null). `serviceBlogLinks[]`: `postIndex`, `postAnchor`, `linkedServiceIds`.
- `offers[]`: `id`, `slug`, `priceEur`, `priceRsd`, `includes` (alias of `description`), `oldPrice`/`validity` (= null), `cta`, `cenovnikRef`.
- `favorites[]`/`gifts[]`: `tagLabel`, `cenovnik` (first cenovnik hit by name, as the old site does). `verticals[]`: `locationLabel`, `href`, `cenovnikTab`, `cenovnikServiceCount`, `statedCount` is verbatim.
- `locations[]`: `key`, `verticalKey`, `mapUrl`, `hours`. `quiz.questions[].options[].iconKey` (icon SVGs are verbatim in `quiz.icons`). All `*Html`/`html` twins (accent spans normalised to `<em>`).
- `images{}`: bytes/absolute paths/usage notes. `copy.newStrings`: NEW (see `COPY_NOTES.md`).

## 7. Warnings and open issues (16)

1. Vertical "Tretmani lica" states "18 tretmana" but cenovnik data has 58 services in tab "lice" (old site text kept verbatim).
2. Vertical "Tretmani tela" states "12 tretmana" but cenovnik data has 36 services in tab "telo" (old site text kept verbatim).
3. Vertical "Estetske procedure" states "22 procedure" but cenovnik data has 62 services in tab "estetske" (old site text kept verbatim).
4. Vertical "Posebni protokoli" states "10 paketa" but cenovnik data has 26 services in tab "protokoli" (old site text kept verbatim).
5. 4 blog posts still contain "________" blanks in the body (device/doctor name the client must fill): Laserska dermatologija Candela laserima | Klasična dermatologija: Šta obuhvata dermatološki pregled? | Radiotalasno uklanjanje promena na koži | PRP i mezoterapija: Tretmani skalpa za pospešivanje rasta kose. Blog is teaser-only in v2, but never show those bodies.
6. FAVORITES_PICKS and GIFT_PICKS are marked in the old source as a SAMPLE selection ("Tamara će dostaviti finalnu listu"); the final list from the client is still pending.
7. Source inconsistency kept verbatim: "Banka Intesa" (price-list footnote) vs "Banca Intesa" (payment modal).
8. Blog title "Preime Dermafacial: Napredna tehnologija za sofisticirano podmlađivanje kože" looks like a typo ("Preime", probably "Premium"); kept verbatim. It is also the SERVICE_BLOG_LINKS key for the Dermafacial services, so any correction must be made in both places.
9. Source typo kept verbatim: "orjentacionog" (payment modal; correct spelling is "orijentacionog").
10. Novi Beograd phone is formatted two ways in the old site: "+381 64 8239 439" (nav/CTA/footer/pricing) and "+381 64 823 9439" (coin card). Both kept (phone.display / phone.displayCoin).
11. YouTube footer link has no URL in the old site (href="#"); contact.social[].href is null for it. Do not render it as a working link.
12. No map URLs, no per-location opening hours, no postal codes in the old site; locations[].mapUrl/hours and contact.mapUrls are null. Only global hours exist: "Pon — Sub · 9—21h".
13. Offers have no old price, validity period or per-offer CTA URL in the old site (oldPrice/validity are null; every CTA is the shared Novi Beograd WhatsApp link). Blog posts have no date or slug (date is null; slug/anchor are derived).
14. Old pricing data has no duration field; only 3 services state a duration in their name ("N min"), exposed as service.duration. Do not invent others.
15. 3 laser rows carry highlight:true in the data, but the old UI never renders a badge on laser rows.
16. 4 service names occur in more than one group with possibly different prices (e.g. "Ruke", "Butine i zadnjica", "Celo telo"); always address services by id (tab:group:index), never by name alone.

## 8. Rebuild / re-verify

```bash
cd "/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/_shared/content"
node _tools/build-content.js     # re-extract from the old site, regenerate files, run verification
node _tools/verify-content.js    # verification only (exit code 1 on any mismatch)
```

The DOM recount needs `jsdom`; the tool looks in `$JSDOM_PATH`, then in `/Users/vladajovic/Developer/ChatBots for Business/node_modules/jsdom`. Override the old-site folder with `LSD_OLD_DIR`.

---
Pripremio ECHOSYSTEM-MOTHER AGENCY · 2026-10-07
