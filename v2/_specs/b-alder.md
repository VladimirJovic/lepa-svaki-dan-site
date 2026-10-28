# SPEC B — "Alder" (Framer template) → manner rebuild in plain HTML/CSS/JS

`ECHOSYSTEM-MOTHER AGENCY` · design-manner spec · 2026-10-07

- Template: **Alder Dental — "A clearer kind of dentistry"** (Framer one-pager; og:title "Alder Dental — A clearer kind of dentistry").
- Live demo: **https://zany-goal-513290.framer.app/** (canonical + og:url, reachable, HTTP 200). Real screenshots were taken from it.
- Sources used, in order of trust: (1) **computed styles read from the live page** at 1440 / 1000 / 390 px (headless Chrome via Playwright); (2) the **source of the template's custom code components** (FlutedImage, GlassReveal, FlutedWord, Statement reveal, CountUp, BeforeAfter, Estimator, SlotPicker, OpenNow) and of the Button / Nav / FAQ components, read from the live site's published modules; (3) the saved file `~/Desktop/Download/aldertemplate_framer_website.html` (SSR markup, all CSS: tokens, breakpoints, dark theme, appear-animation JSON; its JS is corrupt); (4) the supplied static copy and rough screenshots (hints only, not used for numbers).
- Screenshots, all in `v2/_specs/b/` (I looked at every desktop slice one by one, and every mobile slice through the 4-up sheets): `d_vp_00…12.png` (1440×900 viewport slices, whole page, top→bottom), `m_vp_00…18.png` (390×844 slices; `m_sheet_0…4.png` = the same 4-up), `m_menu_open.png`, `d_panels_rest.png` / `d_panels_hover.png`, `d_reveal_sheet.png` (page-load wipe at ~0.1 / 0.35 / 0.6 / 0.9 s), `d_dark_theme.png`. Proof renders of **our** reference code: `proto_hero_pointer.png`, `proto_panels_hover.png`, `proto_reduced.png`, `proto_fword.png`, `proto_cutout_lens.png` (the Higgsfield cut-out through glass on a lila stage).
- **Reference code, tested in headless Chrome (no console errors, 1440 / 390 / reduced-motion): `v2/_specs/b/ref/flute.js` and `v2/_specs/b/ref/motion.js`.** The numbers in §5 are the template's own; the files implement them.
- Measurement note: 6000 px tall "screenshot windows" are useless on this template (hero is `100vh`, so it becomes 6000 px high). All captures here use real 1440×900 / 390×844 viewports and scroll slices.
- Not verified (said again in §8): button hover colours were read from component source, not from a rendered hover; Framer's duration-based springs are approximated with `cubic-bezier`; the Lepa-specific hero (cut-out through glass) was prototyped on a stand-in lila gradient, not on final art.

---

## 0. TL;DR of the template

A calm **warm-paper one-pager** (`#f3f2ed`) whose whole personality is **photography seen through reeded ("fluted") glass**. Every key image is cut into vertical flutes; at rest each flute shows a compressed, repeated copy of the picture, and the glass **clears under your pointer** (hero), **on hover** (treatment panels, portraits) or **as you scroll to it** (touch). Around that: **huge, tight, medium-weight Geist** (104 px / 0.94 / −5 px), **two-tone headings** (ink + grey second line), a **floating glass-pill nav** (blur 22), **hairline rules instead of boxes** (1 px `rgba(ink,.12)`), **no shadows anywhere**, one green accent, one warm "closed" dot, and exactly **one inverse ink card** (radius 36) as a full stop. Between the sections sit small **honest-utility widgets** (before/after glass slider, fee estimator, slot picker, "open now" chip, counters). Motion is spring-soft (bounce 0), fade-up 14–40 px, once, plus a frosted page-load wipe. Nothing loops except the open-status pulse and the hero lens "drift".

Page height: **10 509 px at 1440**, 12.3 k at 1000, **14 489 px at 390**.

---

## 1. Structure, breakpoints, collapse behaviour

### 1.1 Breakpoints (from the template's media queries and `__framer__breakpoints`)

| Name | Query | What switches |
|---|---|---|
| Desktop | `min-width:1200px` | desktop nav pill; 4-up grids; display 104 / h2 60 |
| Tablet | `min-width:810px and max-width:1199.98px` | **hamburger nav** (the desktop nav does NOT survive below 1200); 2-up grids; display 80 / h2 48 |
| Mobile | `max-width:809.98px` | 1-up stacks (team and facts stay 2-up); display 52 / h2 36; card radii shrink |

Framer layouts are **fluid** between these (percent widths, `max-width`s, `1fr` grids), so rebuild with the same three switches and fluid containers:

```css
.wrap{max-width:1360px;margin-inline:auto;padding-inline:40px}   /* content = 1280 at >=1360 */
@media (max-width:1199.98px){.wrap{padding-inline:32px}}          /* tablet: content = viewport-64 */
@media (max-width:809.98px){.wrap{padding-inline:20px}}           /* mobile: content = viewport-40 */
.card-wrap{padding-inline:20px}.card-wrap>.card{max-width:1320px;margin-inline:auto}   /* big cards: 60 px inset at 1440 */
@media (max-width:1199.98px){.card-wrap{padding-inline:16px}}
@media (max-width:809.98px){.card-wrap{padding-inline:10px}}
```

### 1.2 Section order, top → bottom (desktop 1440×900, measured; y = top edge)

| # | Section (template name) | y | height | Background | One-line job |
|---|---|---|---|---|---|
| – | Glass reveal | fixed | 100vh | frosted strips + cover | page-load wipe (§5 M1) |
| – | Navigation | fixed top 14 | 64 | glass pill | always on top, z 9 |
| 1 | **Welcome** (hero) | 0 | 900 (=100vh) | full-bleed fluted photo, ink shade | status chip, 2-line display H1, intro + 2 CTAs, hint chip |
| 2 | **The idea** | 900 | 778 | canvas | scroll-filled statement + 4 counters |
| 3 | **Treatments** | 1678 | 1563 | canvas | 4 fluted panels + "full list" rows |
| 4 | **First visit** | 3240 | 725 | **ink card, r36** | header + 3 numbered steps |
| 5 | **Results** | 3965 | 1276 | canvas | before/after glass slider + 4 case facts |
| 6 | **Fees** | 5241 | 1149 | canvas | centred header, estimator card, 3 "ways to pay" notes |
| 7 | **Dentists** | 6390 | 777 | canvas | 4 fluted portrait cards |
| 8 | **Reviews** | 7167 | 991 | canvas | centred header, 3-column masonry of quote cards |
| 9 | **Questions** | 8157 | 644 | canvas | sticky intro + 6-row accordion |
| 10 | **Visit** | 8801 | 965 | **fluted photo card, r36** + form card | location details + request form |
| 11 | **Footer** | 9766 | 744 | canvas | brand + 3 link columns + giant fluted wordmark + legal rule |

Mobile (390): hero 844 · idea 737 · treatments 3150 · first visit 1049 · results 1005 · fees 1661 · dentists 1009 · reviews 1693 · questions 913 · visit 1509 · footer 918.

### 1.3 Per-section anatomy: desktop / tablet / mobile

**Hero (Welcome)** — height `100vh` at every breakpoint (900 / 800 / 844 in my captures; use `100svh` with a `100vh` fallback).
- Desktop: image `inset:0`. Content block `position:absolute; bottom:0; left:0; right:0; padding:0 40px 44px; display:flex; justify-content:space-between; align-items:flex-end`. Left column 700 px: status chip → (gap 26) → H1 (2 lines, 196 px high). Right column 350 px: intro paragraph → (gap 26) → actions row (gap 10: "On photo" button 173 + "Outline on photo" button 133). Hint chip `position:absolute; top:104px; right:40px` (desktop only).
- Tablet: padding `0 32px 36px`, column layout (gap 32), headline 936 wide, intro 480 wide, no hint chip.
- Mobile: padding `0 20px 28px`, column (gap 24), headline block gap 20, intro block gap 22, H1 52 px; both CTAs in one row (173 + 133 wide). No hint chip.

**The idea** — desktop padding `150px 40px 130px`, gap 110: row = eyebrow column (260 wide) + statement (1020 wide, starts x = 340); then **Numbers**: `grid 4 × 1fr`, `column-gap 32`, one hairline across the top, each stat `padding-top 28`, inner gap 12. Tablet: padding `110px 32px 100px`, gap 72, eyebrow stacked above statement (gap 28), numbers 2×2 (gap 8 / 32, stat `padding 24 0 16`). Mobile: padding `80px 20px`, gap 56, statement 30 px, numbers 2×2 (gap 4 / 20, stat `padding 20 0 12`, numerals 52 px).

**Treatments** — desktop padding `0 40px 140px`, gap 56. Header = row (title block 640 wide: eyebrow + 2-line H2 ; note 360 wide pushed right, `align-items:flex-end`). Featured = `grid 4 × 1fr`, gap 12, panel **311 × 470, r20**. Full list = row: label column 260 (`The full list` 14/500 ink + one muted line) + list column 1020; container `padding-top 40`; list rows: **name 280 | summary 546 | meta 130 (right-aligned)**, `gap 32`, `padding 24px 0`, hairline on top of each row and under the last. Tablet: gap 44, header stacked, panels 2×2 (462 × 440), label above list (gap 8). Mobile: gap 36, **panels stacked 350 × 380, r18, gap 10**, rows stacked: title (22/26.4), summary, meta row `[price] [duration]` (gap 12, `padding-top 4`), row `padding 22px 0`, gap 8.

**First visit (ink card)** — outer padding `0 20px`; card 1320 wide, **r36**, `padding 96px 80px 80px`, `gap 80`. Header row: title block 640 (eyebrow in `#b3bbb5`, H2 60/60 cream + second line `#858d87`-ish muted) + note block 360 (paragraph `#b3bbb5` + "Dark" button). Steps = `grid 3 × 1fr`, gap 40, each step: top hairline `rgba(243,242,237,.16)`, `padding-top 24`, column gap 64: number row (104 px numeral left, duration pill right) then text block (gap 10: H3 34 + paragraph 16/24.8 `#b3bbb5`). Tablet: radius 28, padding `72px 48px 56px`, gap 56, header stacked (gap 28), steps 3 × (gap 24). Mobile: section padding `0 10px`, r24, padding `48px 22px 30px`, gap 36, steps **1 column**, each `padding 20 0 28`, gap 24, numeral 52.

**Results** — desktop padding `140px 40px`, gap 56. Slider 1280 × ~620, **r28** (r20 on mobile, 345 × 296). Case notes `grid 4 × 1fr`, gap `24 / 32`, each: top hairline, `padding-top 20`, gap 8: label 14/21 muted + value 22/26.4. Tablet: padding `110 32`, gap 40, facts 2×2. Mobile: padding `80 20`, gap 32, facts 2×2 (gap 16 / 20).

**Fees** — desktop padding `0 40px 140px`, gap 64. **Centred header** (max 820): eyebrow, H2 (2 lines, second grey), lead 20/29 muted (max ~560). Estimator card 1280 wide, **r28**, `padding 12`, inner `grid 1.08fr / 1fr`, gap 12 (container query: ≤760 → 1 column, total 52 px; ≤420 → total 40 px and price ranges hidden). Then "Ways to pay" = `grid 3 × 1fr`, gap `16 / 48`; each note = row (gap 18) `padding-top 28`, hairline on top, 44 px icon circle + text (title 22/26.4, body 14/21 muted). Tablet/mobile: notes stack as full-width rows with `padding 24px 0`.

**Dentists** — desktop padding `0 40px 140px`, gap 56. Team = `grid 4 × 1fr`, gap `40 / 12`; card = column gap 18: photo **311 × 380 r20** (fluted) + text (gap 6: name 22/26.4, role 14/21 muted, credentials 14/21 muted). A glass chip ("Nervous patients" …) sits inside the photo, `left 14, bottom 14`. Tablet: 2 columns (462 wide, photo 462 × 440). **Mobile: stays 2 columns** (170 wide, photo 170 × 230, **r16**, gap `28 / 10`).

**Reviews** — desktop padding `0 40px 140px`, gap 64, centred header, then **3 independent columns (masonry)**, gap 12, card = surface, **r24**, `padding 32 32 28`, column gap 36 (quote → name block), 1 px ring. Tablet: 2 columns, gap 48 above. Mobile: 1 column, gap 10, card r20, `padding 26 24 24`, gap 26.

**Questions** — desktop padding `0 40px 140px`; row gap 96: **intro 400 wide, `position:sticky; top:116px`** (eyebrow, 2-line H2, muted paragraph, Outline button, gap 28) + list 784 wide. Item = hairline top, row `padding 24px 0`, gap 24 between question (22/26.4) and 36 px toggle; answer `padding 0 72px 28px 0`. Tablet: column gap 48; mobile: column gap 36 (intro not sticky).

**Visit** — outer padding `0 20px`; card 1320 × 964, **r36**, `padding 88 80 88 88`, gap 64; background = fluted photo (static, tint .62, no motion). Left (638): eyebrow, H2 60 (cream + second line cream at 62 %), status chip, then "Practical details" `grid 2 × 1fr` (gap `32 / 40`, hairline on top, `padding-top 36`): label 14/21 at 62 % cream + value 20/29 cream. Right: **request form card 450 wide, r28, padding 36, gap 14**, surface bg, 1 px ring. Tablet: column (gap 56), card r28, padding `64 48 48`. Mobile: section padding `0 10px`, card r24, padding `48 12 12`, gap 40, details `padding 0 10`, details grid 1 column (gap 24), form card **r18**, `padding 26 20 24`.

**Footer** — desktop padding `110px 40px 28px`, gap 72: row of **brand** (340 wide: logo, 16/24.8 muted blurb, Primary button, gap 22) and **3 link columns** (gap 96, right side; heading 14/21 muted, links 14/500 ink, gap 14), then the **fluted wordmark** (1280 × 222), then legal row (hairline on top, `padding-top 22`, three parts: copyright left, links centre, credit right). Tablet: padding `88 32 28`, gap 56, brand above links (links gap 88), wordmark 936 × 163. Mobile: padding `64 20 24`, gap 44, links wrap in 2 columns (gap `36 / 44`), wordmark 350 × 61, legal stacks (gap 10).

### 1.4 How the grids collapse (summary)

| Block | Desktop | Tablet | Mobile |
|---|---|---|---|
| Treatment panels | 4 × (311×470) | 2 × (462×440) | 1 × (350×380), gap 10 |
| Numbers / Case facts | 4 | 2 | 2 |
| Steps | 3 | 3 (gap 24) | 1 |
| Team | 4 | 2 | **2** (170 wide) |
| Reviews | 3 masonry columns | 2 | 1 |
| Ways to pay | 3 across | stacked rows | stacked rows |
| Nav | glass pill with links | hamburger pill | hamburger pill |
| Hint chip | shown | hidden | hidden |

---

## 2. Typography, spacing, radii, shadows, borders

### 2.1 Families

- **Geist** (Google Fonts, 400 / 500 / 600 / 700, subsets incl. latin-ext so č ć š ž đ render). Fallback in template: `Inter`, `system-ui`. Everything is Geist; display and body share the family, weight does the hierarchy (500 display, 400 body, 600 only for wordmarks).
- Global: `-webkit-font-smoothing:antialiased`; `font-feature-settings:"blwf","cv03","cv04","cv09","cv11"` (inherited from Framer's preset; harmless if the face lacks them); `text-wrap:balance` on H1/H2/statement, `text-wrap:pretty` on body.
- **Tracking is the signature**: every size ≥ 20 px has negative letter-spacing, ≈ **−0.043 em at display/h2, −0.035 em at h3, −0.02 em at lead**.

### 2.2 Scale (computed on the live page; px, weight, line-height, letter-spacing)

| Role | Desktop ≥1200 | Tablet | Mobile | Notes |
|---|---|---|---|---|
| **Display / H1** | 104 / 500 / 97.76 (0.94) / −5 | 80 / 75.2 / −3.6 | 52 / 48.88 / −2.2 | cream on photo; also the 01/02/03 step numerals |
| **Stat numeral** | 72 / 500 / 72 (1) / −3.24 | 72 / −3.24 | 52 / 52 / −2.34 | `tabular-nums`; unit suffix `0.42em` 400 muted, gap `.08em` |
| **H2 (section)** | 60 / 500 / 60 (1) / −2.6 | 48 / 48 / −2 | 36 / 36 / −1.4 | two-tone: line 2 in `--subtle` |
| **Statement** ("The idea") | `clamp(30px, 5.4cqw, 64px)` → **55.1** at 1020 box | 50.5 | 30 | 500, lh **1.06**, ls −0.035em, accent words coloured |
| **H3** (panel title, step title, form title) | 34 / 36.72 (1.08) / −1.2 | 30 / −1 | 26 / 28.08 / −0.8 | also the mobile nav links (26) |
| **Estimator total** | 66 / 500 / lh 66 (1) / −3.3 (−0.05em) | 66 | 36 (= 40 × `scale` .9) | switches by **container width**, not viewport: ≤ 760 → 52, ≤ 420 → 40 (× `scale`); `tabular-nums`; "–" at 64 % alpha |
| **Card title** (list name, FAQ question, fact value, clinician name, note title) | 22 / 500 / 26.4 (1.2) / −0.5 | same | same | the workhorse size |
| **Quote** | 26 / 400 / 33.8 (1.3) / −0.6 | 24 / −0.5 | 21 / 27.3 / −0.4 | review text |
| **Lead** | 20 / 400 / 29 (1.45) / −0.4 | 19 | 17 / 24.65 | hero intro (cream), fees lead (muted), visit values |
| **Body** | 16 / 400 / 24.8 (1.55) / −0.15 | 16 | 16 | section notes, footer blurb, step text |
| **Small** | 14 / 400 / 21 (1.5) / −0.05 | 14 | 14 | descriptions, meta, legal; muted |
| **Label** | 14 / 500 / 18.2 (1.3) / −0.1 | 14 | 14 | nav links, eyebrow, prices, chips |
| **Button** | 15 / 500 / 18 (1.2) / −0.1 | 15 | 15 | |
| Estimator row name | 21 / 500 / 24.15 / −0.03em | 21 | 19 | row range text 14, 72 % alpha |
| Date chip | day 12 / 400 (70 % alpha), number 19 / 500 / −0.03em | | | |
| Time chip | 14 / 500 / −0.01em | | | |
| Nav wordmark | 22 / 600 / 22 / −1 | | | mark = 30 px ink circle with a leaf glyph |
| **Footer wordmark** | 241 (=fits 1280) / 600 / lh 0.92 / −0.06em | 176 | 66 | auto-fitted, see §4.13 |

### 2.3 Spacing system

- **Section rhythm (desktop / tablet / mobile)**: idea `150·130` / `110·100` / `80·80` (top·bottom), gap 110 / 72 / 56; every other light section has **top 0 and bottom 140 / 110 / 80** (the previous section's bottom padding is the separator), except Results `140·140 / 110·110 / 80·80`. Header → content gap: **56 / 44 / 36** (Fees 64 / 48 / 40, Reviews 64 / 48 / 36, Results 56 / 40 / 32).
- **Inside a header**: eyebrow → H2 gap 24 (22 mobile); title block ↔ note: `justify-content:space-between`, note max-width 360.
- **Grid gaps**: panels 12 (mobile 10) · stats 32 · steps 40 (24) · team `40 / 12` (`36 / 12`, `28 / 10`) · reviews 12 (10) · facts `24 / 32` (`16 / 20`).
- **Card padding**: ink card `96·80·80` → `72·48·56` → `48·22·30`; visit card `88·80·88·88` → `64·48·48` → `48·12·12`; review `32·32·28` (`26·24·24`); form card 36 (`26·20·24`); estimator 12 (11).
- **Dividers**: always **1 px, `rgba(14,19,17,.12)`** (`rgba(243,242,237,.16)` inside the ink card), drawn with `::after` so they never change layout.

### 2.4 Radii, shadows, borders

| Thing | Radius |
|---|---|
| Nav pill | 32 |
| Big cards (ink card, visit card) | **36** / 28 tablet / 24 mobile |
| Estimator, slider, form card | 28 (mobile 22 / 20 / 18) |
| Review card | 24 (mobile 20) |
| Treatment panel, team photo | 20 (mobile 18 / 16) |
| Inputs, chips, estimator rows | **14** |
| Buttons, pills, toggles, icon circles, status chip | 999 |

- **Shadows: none anywhere** (computed `box-shadow:none` on every component; the only soft shadows are the slider knob `0 6px 24px rgba(0,0,0,.35)` and glass bar `0 0 40px rgba(0,0,0,.25)`). Depth = layered translucent glass + hairlines + tone.
- **Borders**: hairline 1 px as above on reviews, form card, list rows, fact/stat tops, legal rule, FAQ items, Outline buttons. Photo cards have no border.

---

## 3. Colours and their roles

### 3.1 Template tokens (light; dark in brackets, the theme toggle in the nav flips them)

| Role | Light | Dark | Used for |
|---|---|---|---|
| **Canvas** | `#f3f2ed` | `#0b0e0d` | page background, button text on ink |
| **Surface** | `#fbfbf8` | `#131816` | review cards, estimator card, form card, visit card base |
| **Surface-2** (chips, icon circles, theme toggle, FAQ toggle idle) | `#e7e5de` | `#1c2320` | secondary fills, hover of Outline buttons |
| **Ink** | `#0e1311` | `#f1f0ea` | text, primary button, **dark card**, selected rows |
| **Ink-2** (primary hover) | `#2a332e` | `#fff` | hover of primary button |
| **Muted** | `#4c5650` | `#a7b0aa` | body copy, descriptions, eyebrow text |
| **Subtle** | `#858d87` | `#6e7872` | H2 second line, tertiary |
| **Accent** | `#1c7353` | `#b9f0d4` | eyebrow dot, emphasis words in the statement, current-page link, success |
| **Warm** | `#e2764b` | same | "closed" dot, failed state |
| **Mint** (on-dark accent) | `#b9f0d4` | same | open dot, hint-chip dot |
| **Hairline** | `rgba(14,19,17,.12)` (`#0e13111f`) | `rgba(241,240,234,.13)` | all rules and rings |
| **Hairline on ink** | `rgba(243,242,237,.16)` | | steps, duration pills |
| **Glass (nav)** | `rgba(243,242,237,.76)` (`#f3f2edc2`) | `rgba(19,24,22,.62)` | nav pill, blur 22 |
| **Field** | `rgba(14,19,17,.04)` (`#0e13110a`) | `rgba(241,240,234,.06)` | inputs, date/time chips |
| **Cream** (text/buttons on photo) | `#f1f0ea` | | hero text, "On photo" button |
| **Photo shade** | `#0b0e0d` | | hero overlays, glass cover default |
| **On-ink muted** | `#b3bbb5` / `#a7b0aa` / cream @ .62–.64 | | paragraphs on the ink card |

Hero overlays: flat shade at **opacity .14** + `linear-gradient(to top, shade 0%, transparent 62%)` at **.9** (this is what keeps cream text readable on the photo). Per-flute gloss: `linear-gradient(90deg, rgba(255,255,255,.2) 0%, rgba(255,255,255,.03) 16%, rgba(0,0,0,0) 52%, rgba(0,0,0,.34) 100%)` at `opacity = .6 × distortion`.

Contrast (computed): ink on canvas **16.7:1**, muted on canvas **6.8:1**, accent on canvas **5.2:1**, cream on ink **16.7:1**, `#b3bbb5` on ink **9.6:1**; **subtle on canvas is only 3.0:1**: the template uses it only for ≥ 36 px headline second lines. Do not reuse it for small text.

### 3.2 Lepa substitution (decision; contrast figures computed)

| Role | Alder | **Lepa** (brand pack `tokens/brand.css`) | Note |
|---|---|---|---|
| Canvas | `#f3f2ed` | **`--lila-100 #F4F0F9`** (or `--lila-50 #F9F8FC`) | same lightness as Alder canvas |
| Surface | `#fbfbf8` | `#FFFFFF` (or `#FCFBFE`) | |
| Surface-2 | `#e7e5de` | **`--lila-200 #E8E1F4`** | chips, icon circles |
| Ink | `#0e1311` | **`--ink #231F20`** | on lila-100 = 14.5:1 |
| Ink-2 | `#2a332e` | `--charcoal-deep #322F30` | |
| Muted | `#4c5650` | **`--charcoal #5A5758`** | on lila-100 = 6.4:1, on white 7.2:1 |
| Subtle (≥ 36 px only) | `#858d87` | `#85807F` | 3.5:1 on lila-100 |
| Accent (text) | `#1c7353` | **`--lila-800 #61478F`** for emphasis words ≥ 30 px (6.7:1) / `--lila-700 #8466BA` for large display accent (4.1:1, passes ≥ 24 px) | **never `--lila` or gold as small text** (1.9 : 1 and 2.6 : 1) |
| Accent (dot, rule, glow) | `#1c7353` | `--lila-600 #AF96DB` / flat gold `#C18F16` | decorative only |
| Warm (closed) | `#e2764b` | keep `#e2764b` (semantic, not a brand colour) | |
| Open dot | `#b9f0d4` | keep mint, or Wellbeing sage when the location is Wellbeing | |
| Dark card | `#0e1311` | **`--lila-900 #3E2F57`** (text `--lila-100` = 10.7:1; muted `--lila-300 #D7CAEB` = 7.7:1) or neutral `#231F20` | exactly one per viewport |
| Photo shade | `#0b0e0d` | `#231F20` (neutral, so photos do not go purple) | |
| Hero stage | dark photo | **lila gradient** (see §7.0) | the one structural change |

### 3.3 Fonts for Lepa

Brand font = **Galano Grotesque** (pack has Regular 400 + Bold 700 only; checked: all of č ć š ž đ Č Ć Š Ž Đ € → ↗ present, `tnum` feature present). `font-weight:500` falls back to the 400 face, which is fine; **display = Regular 400**, wordmarks = Bold 700. Galano's x-height is 0.493 em and cap height 0.67 em, so add ≈ 1 px to body sizes and expect Serbian copy to run ~15 % longer than the English: use **display 88 / 68 / 44** (not 104 / 80 / 52) and let the H1 take three lines. Keep `font-family:"Galano Grotesque","Geist",system-ui,sans-serif`.

---

## 4. Components (exact CSS worth copying)

### 4.1 Tokens

```css
:root{
  --canvas:#f3f2ed; --surface:#fbfbf8; --surface-2:#e7e5de;
  --ink:#0e1311; --ink-2:#2a332e; --muted:#4c5650; --subtle:#858d87;
  --accent:#1c7353; --warm:#e2764b; --mint:#b9f0d4;
  --line:rgba(14,19,17,.12); --line-inv:rgba(243,242,237,.16);
  --glass:rgba(243,242,237,.76); --field:rgba(14,19,17,.04);
  --cream:#f1f0ea; --photo:#0b0e0d; --on-ink-muted:#b3bbb5;
  --r-field:14px; --r-panel:20px; --r-card:24px; --r-form:28px; --r-big:36px;
  --ease:cubic-bezier(.16,1,.3,1);     /* template's own CountUp / estimator curve; ≈ its bounce-0 springs */
  --ease-ui:cubic-bezier(.44,0,.56,1); /* button + link colour transitions */
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --canvas:#0b0e0d; --surface:#131816; --surface-2:#1c2320; --ink:#f1f0ea; --ink-2:#fff;
  --muted:#a7b0aa; --subtle:#6e7872; --accent:#b9f0d4; --line:rgba(241,240,234,.13);
  --glass:rgba(19,24,22,.62); --field:rgba(241,240,234,.06);}}
:root[data-theme="dark"]{ /* same values as above */ }
```

### 4.2 Nav, desktop (≥1200): floating glass pill

```css
.nav{position:fixed;top:14px;left:0;right:0;z-index:9;display:flex;justify-content:center;padding:0 20px;pointer-events:none}
.nav__pill{pointer-events:auto;position:relative;display:flex;align-items:center;justify-content:space-between;
  width:100%;max-width:1160px;height:64px;padding:0 8px 0 22px;border-radius:32px;overflow:clip;
  background:var(--glass);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}
.nav__pill::after{content:"";position:absolute;inset:0;border-radius:inherit;border:1px solid var(--line);pointer-events:none}
.nav__logo{display:flex;align-items:center;gap:10px;font:600 22px/22px var(--font);letter-spacing:-1px}
.nav__mark{width:30px;height:30px;border-radius:999px;background:var(--ink);color:var(--canvas);display:grid;place-items:center}
.nav__links{display:flex;gap:32px}
.nav__links a{font:500 14px/18.2px var(--font);letter-spacing:-.1px;color:var(--ink);transition:color .2s var(--ease-ui)}
.nav__links a:hover{color:var(--muted)} .nav__links a[aria-current]{color:var(--accent)}
.nav__actions{display:flex;align-items:center;gap:14px}   /* phone 14/500 · 40 px theme toggle (surface-2 circle) · Primary button 48 px */
@supports not (backdrop-filter:blur(1px)){.nav__pill{background:var(--canvas)}}
```
The same glass is used **over the dark photo and over paper** (it is not recoloured per section).

### 4.3 Nav, tablet + mobile (≤1199): the "Phone" variant

- Pill `margin:0 16px` (tablet, top 14) / `0 12px` (mobile, top 10), `height:60px`, `padding:0 8px 0 18px`, same glass, radius 32. Left: logo. Right: **44 × 44 circle** (`background:var(--surface-2)`) with two 18 × 2 bars (radius 2) at y = 18 and 25 inside the circle.
- **Open**: the pill becomes a column and grows downward (radius stays 32): `Top` row → `Links` (padding `20px 0 12px`, gap 14, links **26 / 28.08 / −0.8, 500**) → `Actions` (padding `8px 0 22px`, gap 18: phone 14/500, 40 px theme toggle, Primary button). Bars rotate **+45° / −45°** (× icon). Animation: spring `bounce .1, duration .45 s` ≈ `.45s cubic-bezier(.34,1.2,.5,1)`; I recommend `transition:height .45s var(--ease)` plus `grid-template-rows:0fr→1fr`.
- **Template weakness to fix**: the closed mobile pill has no CTA; our rebuild puts a 40 px "Zakaži" pill between logo and burger (hide < 360 px), see §7.

### 4.4 Buttons (6 variants, one shape)

```css
.btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;
  padding:15px 22px 15px 24px;border-radius:999px;border:0;cursor:pointer;text-decoration:none;
  font:500 15px/18px var(--font);letter-spacing:-.1px;background:var(--ink);color:var(--canvas);
  transition:background-color .25s var(--ease-ui),color .25s var(--ease-ui)}
.btn::after{content:"";position:absolute;inset:0;border-radius:inherit;border:1px solid var(--bd,transparent);pointer-events:none}
.btn svg{width:16px;height:16px;flex:none}               /* ↗ arrow, 16 px, static */
.btn:hover{background:var(--ink-2)}
.btn--outline{background:transparent;color:var(--ink);--bd:var(--line)} .btn--outline:hover{background:var(--surface-2)}
.btn--outline-light{background:transparent;color:var(--ink);--bd:rgba(11,14,13,.14)} .btn--outline-light:hover{background:rgba(11,14,13,.06)}
.btn--photo{background:var(--cream);color:var(--photo)} .btn--photo:hover{background:#fff}
.btn--photo-outline{background:transparent;color:var(--cream);--bd:rgba(241,240,234,.32)} .btn--photo-outline:hover{background:rgba(241,240,234,.14)}
.btn--on-ink{background:var(--canvas);color:var(--ink)} .btn--on-ink:hover{background:var(--surface-2)}
.btn--accent{background:var(--accent);color:var(--canvas)} .btn--accent:hover{background:#d6f7e6;color:var(--ink)}
.btn:focus-visible{outline:2px solid var(--accent);outline-offset:3px}      /* template has no focus ring: add */
@media (hover:none){.btn:hover{background:var(--ink)}.btn:active{background:var(--ink-2)}}
```
Form submit = same shape, `height:52px`, full width, states: pending `opacity:.7`, success bg accent, failed bg warm (all `.25s`).

### 4.5 Eyebrow, section header, status chip, hint chip

```css
.eyebrow{display:flex;align-items:center;gap:10px;font:500 14px/18.2px var(--font);letter-spacing:-.1px;color:var(--muted)}
.eyebrow::before{content:"";width:6px;height:6px;border-radius:99px;background:var(--accent)}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:48px}
.head__title{display:flex;flex-direction:column;gap:24px;max-width:640px}
.head h2{font:500 60px/1 var(--font);letter-spacing:-2.6px;text-wrap:balance;margin:0}
.head h2 em{font-style:normal;color:var(--subtle)}                 /* second line */
.head p{max-width:360px;font:400 16px/24.8px var(--font);letter-spacing:-.15px;color:var(--muted)}
.head--center{flex-direction:column;align-items:center;text-align:center;max-width:820px;margin-inline:auto}
@media (max-width:1199.98px){.head{flex-direction:column;align-items:flex-start;gap:24px}.head h2{font-size:48px;letter-spacing:-2px}}
@media (max-width:809.98px){.head h2{font-size:36px;letter-spacing:-1.4px}}

/* glass chips (status chip, hint chip, "known for" chip share one recipe) */
.chip-glass{display:inline-flex;align-items:center;gap:10px;border-radius:999px;color:var(--cream);
  background:rgba(241,240,234,.10);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3)}
.status{padding:10px 15px 10px 13px;background:rgba(241,240,234,.12);font:500 14px/1.2 var(--font);letter-spacing:-.01em;gap:9px;font-variant-numeric:tabular-nums}   /* template computes em-based padding .68em/1.05em/.9em, rounded */
.hint{padding:9px 15px 9px 12px;font:400 14px/21px var(--font);letter-spacing:-.05px}   /* + 6 px mint dot; desktop only */
.known{padding:8px 14px;background:rgba(241,240,234,.12);font:500 14px/18.2px var(--font)}
.dot{position:relative;width:8px;height:8px;border-radius:99px;background:var(--warm)}
.is-open .dot{background:var(--mint)}
.is-open .dot::before{content:"";position:absolute;inset:0;border-radius:inherit;background:inherit;animation:pulse 2.2s ease-out infinite}
@keyframes pulse{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(2.6);opacity:0}}
@media (prefers-reduced-motion:reduce){.is-open .dot::before{animation:none}}
```

### 4.6 Counters ("Numbers")

```css
.numbers{position:relative;display:grid;grid-template-columns:repeat(4,1fr);column-gap:32px}
.numbers::after{content:"";position:absolute;left:0;right:0;top:0;border-top:1px solid var(--line)}   /* ONE rule over all four */
.stat{display:flex;flex-direction:column;gap:12px;padding-top:28px}
.stat b{display:inline-flex;align-items:baseline;gap:.08em;font:500 72px/1 var(--font);letter-spacing:-.045em;font-variant-numeric:tabular-nums lining-nums;white-space:nowrap}
.stat b small{font:400 .42em/1 var(--font);letter-spacing:-.01em;color:var(--muted)}      /* "min", "/ 5", "years", "%" */
.stat p{max-width:240px;font:400 14px/21px var(--font);letter-spacing:-.05px;color:var(--muted)}
@media (max-width:1199.98px){.numbers{grid-template-columns:repeat(2,1fr);row-gap:8px}.stat{padding:24px 0 16px}}
@media (max-width:809.98px){.numbers{column-gap:20px;row-gap:4px}.stat{padding:20px 0 12px}.stat b{font-size:52px;letter-spacing:-2.34px}}
```

### 4.7 Treatment panel (fluted photo card)

```css
.panel{position:relative;display:block;height:470px;border-radius:var(--r-panel);overflow:hidden;isolation:isolate;color:var(--cream);text-decoration:none}
.panel .flute{position:absolute;inset:0}                 /* data-mode="hover" data-flute="20" data-strength="2.8" data-fy="25" data-tint=".1" */
.panel__no{position:absolute;left:22px;top:20px;font:500 14px/18.2px var(--font);letter-spacing:-.1px}
.panel__cap{position:absolute;left:0;right:0;bottom:0;padding:22px;display:flex;flex-direction:column;gap:8px}
.panel__cap h3{margin:0;font:500 34px/1.08 var(--font);letter-spacing:-1.2px}
.panel__meta{display:flex;align-items:center;gap:10px;font:400 14px/21px var(--font);letter-spacing:-.05px}
.panel__meta i{width:3px;height:3px;border-radius:9px;background:currentColor}
.grid-panels{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media (max-width:1199.98px){.panel{height:440px}.grid-panels{grid-template-columns:repeat(2,1fr)}.panel__cap h3{font-size:30px;letter-spacing:-1px}}
@media (max-width:809.98px){.grid-panels{grid-template-columns:1fr;gap:10px}.panel{height:380px;border-radius:18px}.panel__cap h3{font-size:26px;letter-spacing:-.8px}}
```
Template instances (read from the live DOM at 1440 / 1000 / 390; gloss .6 everywhere):

| Instance | mode | flute px (desktop / tablet / mobile) | strength | focusY | tint | bottom shade |
|---|---|---|---|---|---|---|
| Hero | **lens**, lens 36 %, drift on | **34 / 28 / 20** (42 / 36 / 20 strips) | 2.6 | 22 | .14 | .9 |
| Treatment panels | **hover** | 20 / 20 / 20 (16 / 23 / 18 strips) | 2.8 | 25 | .10 | .95 |
| Team photos | **hover** | 20 / 20 / 14 | 2.6 | 20 | .05 | .5 |
| Visit-card background | **static** | 44 / 44 / 46 (30 / 22 / 8 strips) | 3.0 | 50 | .62 | .7 |
| Footer wordmark (FlutedWord) | scroll-linked | 30 | 2.4 | – | faint .16 | – |

### 4.8 List row ("Treatment" row = name | description | price)

```css
.rows{position:relative}.rows::after{content:"";position:absolute;left:0;right:0;bottom:0;border-bottom:1px solid var(--line)}
.row{position:relative;display:flex;gap:32px;padding:24px 0}
.row::after{content:"";position:absolute;left:0;right:0;top:0;border-top:1px solid var(--line)}
.row h4{flex:0 0 280px;margin:0;font:500 22px/26.4px var(--font);letter-spacing:-.5px}
.row p{flex:1 1 0;max-width:546px;margin:0;font:400 14px/21px var(--font);letter-spacing:-.05px;color:var(--muted)}
.row__meta{flex:0 0 130px;display:flex;flex-direction:column;gap:4px;text-align:right}
.row__meta b{font:500 14px/18.2px var(--font);letter-spacing:-.1px}              /* "From $140" */
.row__meta span{font:400 14px/21px var(--font);color:var(--muted)}               /* "45 min" */
@media (max-width:809.98px){.row{flex-direction:column;gap:8px;padding:22px 0}.row h4{flex:none}.row__meta{flex-direction:row;gap:12px;padding-top:4px;text-align:left}}
```

### 4.9 Ink card + numbered steps

```css
.card-ink{background:var(--ink);color:var(--canvas);border-radius:var(--r-big);padding:96px 80px 80px;display:flex;flex-direction:column;gap:80px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.step{position:relative;display:flex;flex-direction:column;gap:64px;padding-top:24px}
.step::after{content:"";position:absolute;left:0;right:0;top:0;border-top:1px solid var(--line-inv)}
.step__no{display:flex;justify-content:space-between;align-items:flex-start;font:500 104px/.94 var(--font);letter-spacing:-5px}
.pill{padding:6px 12px;border:1px solid var(--line-inv);border-radius:999px;font:400 14px/21px var(--font);color:var(--on-ink-muted);letter-spacing:-.05px}
.step h3{font:500 34px/1.08 var(--font);letter-spacing:-1.2px;margin:0}
.step p{font:400 16px/24.8px var(--font);letter-spacing:-.15px;color:var(--on-ink-muted);margin:0}
@media (max-width:1199.98px){.card-ink{border-radius:28px;padding:72px 48px 56px;gap:56px}.steps{gap:24px}}
@media (max-width:809.98px){.card-ink{border-radius:24px;padding:48px 22px 30px;gap:36px}.steps{grid-template-columns:1fr;gap:0}.step{padding:20px 0 28px;gap:24px}.step__no{font-size:52px;letter-spacing:-2.2px}}
```

### 4.10 Before/after glass slider (+ fluted divider)

```css
.ba{position:relative;height:620px;border-radius:28px;overflow:hidden;background:#0b0e0d;cursor:ew-resize;touch-action:pan-y;user-select:none}
.ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.ba .b{clip-path:inset(0 50% 0 0)}                     /* JS sets the % */
.ba__label{position:absolute;bottom:16px;padding:7px 12px;border-radius:999px;font:500 13px/1 var(--font);letter-spacing:-.01em;color:var(--cream);
  background:rgba(11,14,13,.5);backdrop-filter:blur(10px);transition:opacity .2s}     /* left: 16 "Before" (hidden when v<18) · right: 16 "After" (hidden when v>82) */
.ba__bar{position:absolute;top:0;bottom:0;width:48px;margin-left:-24px;pointer-events:none;
  background:rgba(241,240,234,.08) repeating-linear-gradient(90deg,rgba(255,255,255,.22) 0,rgba(255,255,255,.02) 3px,rgba(0,0,0,.12) 9px,rgba(255,255,255,.22) 10px);
  backdrop-filter:blur(10px) saturate(1.25) brightness(1.08);border:solid rgba(255,255,255,.35);border-width:0 1px;box-shadow:0 0 40px rgba(0,0,0,.25)}
.ba__knob{position:absolute;top:50%;left:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:999px;background:var(--cream);color:var(--photo);display:grid;place-items:center;box-shadow:0 6px 24px rgba(0,0,0,.35)}  /* "‹ ›" 20 px, stroke 1.6 */
```
Markup: `role="slider" tabindex="0" aria-valuemin/max/now`, arrow keys ±4, pointer capture, `touch-action:pan-y`. Heights: 620 → 453 → 296 (r28 → r20).

### 4.11 Estimator (fees widget) and its row/slider/switch recipes

`.alder-est` = card `background:#fbfbf8;border-radius:28px;padding:12px`, grid `minmax(0,1.08fr) minmax(0,1fr)` gap 12, container-type inline-size. **Left list**: title 14/500 muted `padding:0 16px 14px`; rows are `<button aria-pressed>`: `padding:17px 16px;border-radius:14px;display:flex;justify-content:space-between;gap:16px;transition:background .25s,color .25s`; `:hover{background:color-mix(in srgb,var(--ink) 6%,transparent)}`; `[aria-pressed=true]{background:var(--ink);color:var(--surface)}`; name 21/500/−0.03em, range 14 at 72 % alpha. **Right panel** = ink (`#0e1311`) card, radius 16 (outer − 12), padding 32, column gap 28: label 14/500 at 64 % cream, **total 66/500 lh1 −0.05em**, caption 15 at 64 %, share bar (height 10, radius 99, `transition:width .45s,margin-left .45s var(--ease)`), range slider (28 px hit height, 2 px track at 16 %, **24 px thumb with a 6 px ring at 22 %**), switch (52 × 30, thumb 24, `transform:translateX(22px)`, `.3s var(--ease)`). Numbers tween **0.5 s `[.16,1,.3,1]`**. Layout switches by **container** width: ≤ 760 px → one column and total 52 px; ≤ 420 px → total 40 px and the per-row price range is hidden. The mobile instance runs with `scale:.9` (sizes × .9: row names 19, total 36, padding 11, corner 22).
For Lepa we reuse only the **row** (selected = ink fill, hover 6 %) and **chip** recipes, not the calculator (§7.2).

### 4.12 Review card, FAQ item, form controls

```css
/* review */
.review{position:relative;display:flex;flex-direction:column;gap:36px;padding:32px 32px 28px;background:var(--surface);border-radius:24px}
.review::after{content:"";position:absolute;inset:0;border-radius:inherit;border:1px solid var(--line);pointer-events:none}
.review q{quotes:none;font:400 26px/1.3 var(--font);letter-spacing:-.6px}
.review b{display:block;font:500 14px/18.2px var(--font);letter-spacing:-.1px} .review span{font:400 14px/21px var(--font);color:var(--muted)}
.masonry{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-items:start}   /* 3 flex columns; cards flow top-down per column */

/* FAQ / accordion */
.faq{position:relative}.faq::after{content:"";position:absolute;left:0;right:0;top:0;border-top:1px solid var(--line)}
.faq__q{display:flex;align-items:center;gap:24px;width:100%;padding:24px 0;text-align:left;font:500 22px/26.4px var(--font);letter-spacing:-.5px;cursor:pointer}
.faq__t{flex:none;width:36px;height:36px;border-radius:999px;background:var(--surface-2);display:grid;place-items:center;transition:transform .45s var(--ease),background-color .3s}  /* plus icon 16 px, 1.5 stroke */
.faq[open] .faq__t{background:var(--ink);color:var(--canvas);transform:rotate(45deg)}                                                    /* plus -> × */
.faq__a{padding:0 72px 28px 0;font:400 16px/1.55 var(--font);letter-spacing:-.15px;color:var(--muted)}

/* form field (name, phone, email, select, textarea) */
.field{display:flex;align-items:center;min-height:54px;padding:16px 18px;border-radius:var(--r-field);background:var(--field);font:400 16px/22.4px var(--font);letter-spacing:-.15px}
.field:focus-within{box-shadow:0 0 0 2px var(--ink)}                                      /* template has no focus style: add */
/* chips (date + time-of-day): border 1px var(--line); bg var(--field); radius 14; transition background/color/border .2s */
.chip{flex:1 1 0;min-width:0;padding:11px 6px;border:1px solid var(--line);border-radius:14px;background:var(--field);color:var(--ink);font:500 14px var(--font);letter-spacing:-.01em;transition:background .2s,color .2s,border-color .2s}
.chip--date{display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 0 10px}
.chip[aria-pressed=true]{background:var(--ink);border-color:var(--ink);color:var(--canvas)}
```
Slot picker: label row "When suits you?" 14/500 + "Optional" muted; 5 date chips (58 px high) in a `display:flex;gap:6px` row; then 3 time chips (42 px high: Morning / Afternoon / After 5 pm).

### 4.13 Footer wordmark (fluted word) and legal row

The wordmark is **the word, auto-fitted to the container width** (`font-size = 100 × containerWidth / widthAt100px`), 600 weight, `letter-spacing:-.06em`, `line-height .92`, ink colour, rendered as `D = round(width/30)` clipped flutes (43 at 1280, 12 at 350). Behaviour in §5 M16, code in `ref/motion.js → flutedWord`. Legal row: `border-top:1px solid var(--line); padding-top:22px; display:flex; justify-content:space-between` (stacks, gap 10, on mobile).

---

## 5. Motion — every animation, with touch and reduced-motion equivalents

Global conventions of the template: **springs have bounce 0** (no overshoot; duration-based: 0.9 s, delays staggered by 0.07–0.24 s); scroll reveals use **threshold 0.15, once**; offsets **14–40 px** (labels 14–20, headings 28, panels/cards 36–40); colour transitions `.2–.25 s cubic-bezier(.44,0,.56,1)`; bigger state changes `cubic-bezier(.16,1,.3,1)` at `.3–.5 s`. Our CSS stand-in for a bounce-0 spring: **`cubic-bezier(.16,1,.3,1)`** over the same duration (`--ease`).

| ID | Effect | Template numbers (extracted) | Desktop | **Mobile / touch equivalent** | **prefers-reduced-motion** |
|---|---|---|---|---|---|
| **M1** | **Page-load frosted wipe** ("Glass reveal"): a full-viewport cover with the wordmark, then 22 frosted strips clearing from the centre outward | 22 strips (`left:i·100/22 %`, `width:calc(100%/22 + 1px)`); strip `backdrop-filter:blur(18px) saturate(1.15)` + gradient `rgba(255,255,255,.13) 0 → .02 16 % → 0 52 % → rgba(0,0,0,.2) 100 %`; clear anim **0.682 s `cubic-bezier(.65,0,.35,1)`** (`opacity 1→0, visibility→hidden`); **delay = 0.308 s + (abs(i−10.5)/10.5)·0.418 s**; cover (bg = canvas, wordmark 28/600/−0.04em) holds to 40 % then fades over **0.605 s `ease`**. Total ≈ 1.4 s; replays on route change (not needed on a one-pager). Frames (`d_reveal_sheet.png`): cover + wordmark at 0.1 s → blurred strips at 0.35 s → hero sharp at 0.6–0.9 s | exact numbers left | **Same pure-CSS markup, but 12 strips and `blur(12px)`** (22 full-height backdrop blurs janks mid-range phones); run once per session (`sessionStorage`); cover shows the logo. | `.glass-reveal{display:none}` (template does exactly this) |
| **M2** | **Hero entrance** | status chip: `y:16, delay .15, .9 s` · **H1: `y:28, delay .22, 1.1 s`** · intro: `y:20, delay .36, .9 s` · CTA row: `y:20, delay .44, .9 s` · hint chip: `y:-8, delay 1.1, .9 s` (all `opacity .001→1`, spring bounce 0) | `@keyframes rise{from{opacity:.001;transform:translateY(var(--y))}}` with `animation:rise .9s var(--ease) var(--d) both` | same, but **add the M1 duration (~0.6 s) to every delay** only if M1 runs; keep H1 `y` = 20 | opacity-only 0.2 s, no `y` |
| **M3** | **Hero lens glass**: strips show a compressed copy (strength 2.6) except in a clear "lens" that follows the pointer and, with no pointer, **drifts** | lens half-width `t = W·lens/200` (lens 36 % → 0.18 W); strip distortion `d = 1 − open·(1 − smoothstep(0.3t, t, abs(x−lensX)))`; per-strip scale `s = 1 + (strength−1)·d`; `background-size = B/s px`, `background-position-x = R/2 − (a+H)/s`. **Idle drift:** `lensX = W·(0.5 + 0.3·sin(t_ms·0.00042))` (period ≈ 15 s). Lerp per frame: `lensX += (target−lensX)·0.09`, `open += (1−open)·0.06`. Pointer: lens = pointer x while inside, drift resumes on leave | `pointermove` (rAF-throttled) | **No hover on touch → the idle drift is the effect** (the template relies on it); additionally `touch-action:pan-y` + `pointermove` on the element lets a horizontal drag steer the lens while vertical scroll still works (`ref/flute.js` does this). The template shrinks the flute per breakpoint (hero 34 → 28 → 20 px, so 42 / 36 / 20 strips; `data-flute-t` / `data-flute-m` in the reference code) | **No loop.** Lens parked at 62 % (`data-park`; set it on the subject's face). Content images stay clear. Code: `staticState()` |
| **M4** | **Hint chip** "Move across the glass" | desktop only (`hidden` ≤ 1199), appears with M2 delay 1.1 s | shown top-right | **hidden** (the template hides it); do not teach a gesture that does not exist on touch | hidden or static |
| **M5** | **Open-status chip** (live) | computed from a time zone + hours (weekday open/close, Saturday, Sunday on/off), re-evaluated every 30 s; text "Open now · until 6:30 pm" / "Closed · opens 8 am" / "Closed · opens tomorrow 8 am"; dot mint when open with **pulse `2.2 s ease-out infinite` (scale 1→2.6, opacity .55→0 by 70 %)**, warm `#e2764b` when closed (no pulse) | as listed | identical (no hover dependency); chip ≥ 38 px high | pulse off, dot static |
| **M6** | **Scroll reveal (fade-up)** on almost every block | `opacity 0→1`, `y 14–40 → 0`, spring bounce 0 `0.9 s`, delay stagger **.07 .08 .10 .14 .15 .16 .21 .24 s** within a group, **threshold .15, once**; treatment panels start at `y:36` | `IntersectionObserver` adds `.in`; CSS: `opacity:0;transform:translateY(var(--y,24px));transition:opacity .9s var(--ease) var(--d,0s),transform .9s var(--ease) var(--d,0s)` | same, but **cap `--y` at 24 px, cap delays at .12 s** (single-column lists would otherwise stagger for seconds); `rootMargin:0px 0px -8% 0px` so it fires before the card is under the thumb | all `.in` immediately, no transform |
| **M7** | **Statement word reveal** ("The idea") | words wrapped in `inline-block` spans, `margin-right:.24em`; progress = scroll of the block from **top at 90 % of viewport → bottom at 55 %** (`progress = (0.9vh − top)/(0.35vh + height)`); word *i* of *N* ramps `opacity` **0.2 → 1** over `[i/N, min(1,(i+2.5)/N)]`; accent words (`*word*` markup) coloured `--accent` | rAF-throttled `scroll` | **identical (scroll-linked works natively on touch)**; keep it to ≤ 40 words so the ramp is short on a phone | all words opacity 1 |
| **M8** | **CountUp** numerals | starts when 60 % visible, once; **1.6 s, `cubic-bezier(.16,1,.3,1)`**, `toLocaleString('en-US')` with fixed decimals; affix 0.42 em / 400 / `#A7B0AA` (on light: muted) | as listed | identical | final value rendered at once |
| **M9** | **Panel / portrait glass clears** (`mode="hover"`) | per-flute distortion `d = 1 − smoothstep(clamp(clear·1.7 − 0.7·abs(i−mid)/mid))` → **centre flutes clear first, edges last**; `clear += (target−clear)·0.07` per frame (~1 s); target 1 while the pointer is inside the card, 0 when it leaves | hover | **`(hover:none)` → target = 1 while the card is ≥ 70 % in view, else 0** (IO thresholds 0 / .35 / .7). This is why the mobile copy says "Each panel clears as you scroll to it". | cards render **clear** (we deviate from the template, which would leave them ribbed, because ribbing hides content) |
| **M9b** | `mode="inview"` | like M9 but target 1 once ≥ 35 % visible and **stays** 1 | (unused in the template; good for the CTA/location photo) | same | clear |
| **M9c** | `mode="static"` | never clears (visit card background; tint .62 so text sits on it) | | | static |
| **M10** | **Before/after slider** | pointer capture drag, `touch-action:pan-y`, arrow keys ±4, `aria-valuenow`; **nudge on view** (≥ 60 % visible, once, unless the user already touched it): keyframes `[50, 34, 62, 50]` over **2.2 s, delay .3 s**, ease-in-out-quad per segment; labels fade by opacity at 18 / 82 | as listed | same; **bar 48 px is a good thumb target**, knob 46 px; hint stays (the nudge teaches the gesture) | no nudge |
| **M11** | **Button / link hover** | background `.25 s cubic-bezier(.44,0,.56,1)` (colours in §4.4); nav links colour `.2 s` same curve (ink → muted; current page → accent) | `:hover` | `@media (hover:none)` → feedback on `:active` only; never leave a "stuck hover" | no change (colour only) |
| **M12** | **Mobile menu** | pill grows, bars → ×, spring `bounce .1 / .45 s` | – | open/close with `.45s var(--ease)` height transition; `aria-expanded`, focus trap, `Esc`, scroll lock | instant |
| **M13** | **FAQ / group accordion** | spring `bounce .1 / .45 s`; toggle circle `rotate 0 → 45°`, bg `surface-2 → ink`, glyph colour swaps | click | tap on the **whole row** (≥ 56 px high), same animation; open group scrolls into view with `scroll-margin-top = nav bottom + toolbar` | instant, no rotation animation |
| **M14** | **Estimator**: row select, tweened result, slider, switch | rows `.25 s` background; result number tween **0.5 s `[.16,1,.3,1]`**; bar `width/margin-left .45 s var(--ease)`; switch thumb `.3 s var(--ease)` | | native `<input type=range>` (28 px hit height, 24 px thumb) works on touch | numbers jump |
| **M15** | **Chips (slot picker), submit states** | chips `background/color/border .2 s`; submit: default → pending (`opacity .7`, "Sending") → success (green, "Request sent. We will ring you.") / failed (warm, "Something went wrong. Try again"), `.25 s` | | chips ≥ 42 px high, 6 px gap | no transition |
| **M16** | **Footer fluted wordmark** (scroll-linked) | `target = clamp((viewportH − rect.top)/(rect.height + 40))`, `clear += (target−clear)·0.12`; per flute `scaleX(1/(1 + (strength−1)·d))` with `strength 2.4` and `d` as in M9 (centre clears first); whole word `opacity = faint + (1−faint)·clear²`, `faint .16`; flute 30 px | scroll | **identical, scroll-linked** (it is the template's mobile-friendly effect already) | word drawn straight, full opacity |
| **M17** | **Sticky FAQ intro** | `position:sticky; top:116px` (≈ nav bottom 78 + 38) | | not sticky (column layout) | n/a |
| **M18** | **Theme toggle** (light ⇄ dark tokens, §4.1) | 40 px circle in nav, `aria-label="Switch to dark theme"`; flips `body` custom properties | optional for Lepa | same | n/a |

### 5.1 How the glass works (the part that has to be exact)

Per flute *i* of *L* (`L = clamp(round(W / fluteSize), 4, 90)`, stride `R = W/L`, each strip `width:R+.6px`, `left:i·R`): every strip is an absolutely positioned `div` with the **same** `background-image`, whose `background-size` and `background-position` are rewritten every frame:

```js
// B,V = rendered (cover) image size; H = (B−W)·focusX ; U = (V−Hbox)·focusY ; a = (i+.5)·R ; d ∈ [0,1], 1 = ribbed
const s = 1 + (strength - 1) * d;
strip.style.backgroundSize     = `${B / s}px ${V}px`;
strip.style.backgroundPosition = `${R / 2 - (a + H) / s}px ${-U}px`;   // d=0 → s=1 → each flute shows exactly the pixels beneath it
gloss[i].style.opacity = d * gloss;                                     // per-flute gradient, only visible while ribbed
```
Stack inside the container (`position:relative; overflow:hidden; isolation:isolate; background:shade`): base `<img>` (object-fit cover, object-position `fx% fy%`) → strips → flat tint → bottom shade. The base image is only the pre-load / no-JS fallback. **For a transparent cut-out add `data-cutout`** (hides the base image, otherwise it ghosts through the strips).

Verified against the live DOM: hero at rest gives `background-size:615.385px 900px`, `background-position-x:−20.2198px` for strip 0 (matches the formulas with strength 2.6, W 1440, image 2000×1125); under the pointer it gives `1600px` and `−(left+80)px`, which is the identity.

**Reference files (tested):** `v2/_specs/b/ref/flute.js` (`lens|hover|inview|static`, touch + reduced-motion aware) and `v2/_specs/b/ref/motion.js` (`statement`, `countUp`, `reveal`, `flutedWord`, `openNow`, `beforeAfter`).

### 5.2 Frosted wipe, copy-paste CSS (M1)

```css
.glass-reveal{position:fixed;inset:0;z-index:10;overflow:hidden;pointer-events:none}
.glass-reveal-strip{position:absolute;top:0;bottom:0;backdrop-filter:blur(18px) saturate(1.15);-webkit-backdrop-filter:blur(18px) saturate(1.15);
  background:linear-gradient(90deg,rgba(255,255,255,.13) 0%,rgba(255,255,255,.02) 16%,rgba(0,0,0,0) 52%,rgba(0,0,0,.2) 100%);
  animation:gr-clear .682s cubic-bezier(.65,0,.35,1) both}
.glass-reveal-cover{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--canvas);animation:gr-cover .605s ease both}
@keyframes gr-clear{from{opacity:1;visibility:visible}to{opacity:0;visibility:hidden}}
@keyframes gr-cover{0%,40%{opacity:1;visibility:visible}to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion:reduce){.glass-reveal{display:none}}
/* 22 strips: style="left:calc(i*100%/22);width:calc(100%/22 + 1px);animation-delay:calc(.308s + (abs(i-10.5)/10.5)*.418s)" — generate at build time */
```

---

## 6. The 8 design moves a rebuild must keep

1. **Fluted-glass photography as the one signature**: images are ribbed at rest and **clear where attention is** (pointer lens on the hero, hover on cards, scroll-in-view on touch). Same effect re-used on hero, treatment panels, portraits, location photo (static) and the footer wordmark, so it reads as a system, not a trick.
2. **Huge, tight, medium-weight display type**: 104 px / 0.94 / −5 px, two-line H1 bottom-left over the photo; H2 at 60 px with the **second line in grey**; negative tracking at every size ≥ 20.
3. **A glass-pill nav that floats over everything** (radius 32, blur 22, canvas at 76 %, hairline ring) with the CTA inside it; on tablet/mobile the same pill becomes a hamburger that grows downward.
4. **Warm paper + one accent + one inverse card**: near-white canvas, ink, one green, one warm "closed" dot; **exactly one ink card (r36)** as the full stop; no shadows, no gradients except on photography.
5. **Hairlines instead of containers**: 1 px rules at 12 % ink, drawn above stat rows, list rows, steps, FAQ items, the legal row; eyebrow-with-dot labels; generous 140 px bottom padding between sections.
6. **Numbers and prices are the content**: counters with a small muted unit, "From $140 / 45 min" meta stacks, price ranges, tabular-nums everywhere, a result figure at 66 px.
7. **Honest micro-tools**: before/after glass slider, estimator, slot chips, open-now chip. One shared selection language: **ink fill = selected, r14, 6 % ink hover, `.2–.25 s` transitions**.
8. **Quiet, confident motion**: bounce-0 springs, 14–40 px fade-ups once at 15 %, scroll-linked word and wordmark reveals, one frosted wipe on load; only the status pulse and the hero drift ever repeat. **Mobile keeps the same moves** (panels clear by scrolling, drift replaces the pointer lens) and drops only the hint chip and hover tricks.

---

## 7. Mapping to the Lepa Svaki Dan page

Data source: `v2/_shared/content/content.json` (210 services, 5 tabs, 31 groups; 5 verticals; 4 favorites; 4 gifts; 4 offers; 4 testimonials; 21 blog posts; 2 locations; hours `Pon — Sub · 9—21h`, no per-location hours, no map URLs, no ratings). Images: `v2/_shared/img/*` (incl. `hero-cutout-{600,900,1300}.webp`, the Higgsfield portrait, transparent, aspect ≈ 0.68). **Do not invent ratings, hours per location, map links or review counts.** Copy comes from content.json; new UI strings from `COPY_NOTES.md`.

### 7.0 Decisions that change Alder's recipe for Lepa

1. **Hero = lila stage, not a dark photo.** Alder's hero is a dark portrait with cream text. Lepa's portrait is a **transparent cut-out**, so: background = brand lila gradient (`--lila-300 → --lila-500` plus two soft radial blobs in `--lila-200` / `--lila-600` so the glass has something to refract), text in **ink**, the cut-out inside a `.flute` box (`data-mode="lens" data-cutout data-flute="26" data-strength="2.6" data-lens="44" data-shade="transparent" data-tint="0" data-bottom="0" data-fy="30"`, right-anchored, 92–94 % of hero height, aspect .68). **I prototyped exactly this: `proto_cutout_lens.png`.** It works: ribbed silhouette at the edges, clear face under the lens. Two cautions: (a) the box edge is visible as a vertical cut at the outer flutes: make the box wider than the subject (transparent padding) or add `mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)`; (b) the Higgsfield image is an **AI person**, an already logged "replace with a real photo before launch" item; the effect works the same on a real cut-out.
   - Optional second layer (unverified, try it): `hero-orhideja` as a full-bleed fluted background (`mode="lens"`, low contrast) behind the stage. The orchid is mostly flat cream, so the glass would show little there; pick an image with detail or skip.
   - **Text over light stage**: no bottom shade; ink H1 on lila-300…500 is 8–14:1.
2. **Dark moment = `--lila-900 #3E2F57` card** (one per viewport), used for **Posebna ponuda** (with price counters), not for "steps".
3. **No dark mode, no phone number in the pill** below 1360 px (6 links need the room).
4. **Display sizes 88 / 68 / 44** and H1 may run 3 lines (see §3.3).
5. **Mobile gets a CTA in the closed nav pill** and a bottom action bar (`Piši nam · Pogledaj cene · Gde smo · Pozovi`, 56 px + `env(safe-area-inset-bottom)`, strings from `COPY_NOTES.md`).

### 7.1 Section → carrier

| Lepa section | Carried by (Alder component) | Desktop | Mobile |
|---|---|---|---|
| **Nav** | Glass pill (§4.2/4.3) | 6 links (Tretmani, O nama, Lokacije, Cenovnik, Posebna ponuda, Blog) at gap 28, CTA `Zakaži` (WhatsApp, `nav.cta`), phone only ≥ 1360, no theme toggle. | Hamburger pill; **CTA pill 40 px between logo and burger**; open menu = big 26 px links + `Pozovi` + `WhatsApp` + primary CTA. |
| **Page load** | Frosted wipe M1 | cover = Lepa logo (`logo-horizontal-lila`), canvas bg, 22 strips. | 12 strips, once per session. |
| **Hero** | Welcome (§1.3) + lens glass M3 + chips | Left: status chip (open-now, Europe/Belgrade, hours Pon–Sub 9–21 → "Otvoreno · do 21h" / "Zatvoreno · otvara se u 9h") above H1 "Budi smirena, srećna, lepa, svaki dan." (88 px, 3 lines, 860 max); right column: `hero.sub` + 2 CTAs ("Pogledaj tretmane" On-photo→**Primary**, "Cenovnik usluga" Outline). Hint chip "Pomeri preko stakla" (desktop only). `hero.claim` "2 lokacije, 1 filozofija" as a small glass chip top-right. | Stage ≈ 62 % of height with drifting lens, H1 44 px + intro + CTAs below/over the bottom; search field `hero.searchPlaceholder` (16 px input) as a pill under the CTAs. |
| **O nama + stats** | The idea (statement M7 + Numbers M8) | Eyebrow `about.eyebrow` + statement = `quote.text` or `about.title` with `<em>` word as `*accent*` (colour `--lila-800`); Numbers = **3 stats** (15+ / 2 / 1.000+; `stats.items`, `value`+`suffix` → counter + small muted unit) **+ a 4th cell "9–21h · Pon — Sub"** (from `contact.hours`). | statement 30 px, numbers 2×2 (4th cell fills the grid). |
| **Founder card** (inside O nama) | Dentists card (photo r20 + name + role + glass chip) | One card, `founder.name` "Dr Tamara Vujačić", role, chip `founder.signatureMeta` "Osnivač · 15+ godina prakse". **`founder-portrait.jpg` is a stock mask, not her (see media pack notes): leave the slot empty / hide until the real photo exists.** | 170-wide 2-up pattern or full-width 350×230. |
| **Tretmani (5 verticals)** | Treatment panels (§4.7) | **6-column grid: 3 panels span 2, 2 panels span 3** (5 do not fit Alder's 4-up cleanly), height 470 / 440; caption: H3 `title` (30 px), meta `statedCount` + `cenovnikServiceCount`, location dot (lila = Beauty, green = Wellbeing, split = both); whole panel links to `#usluge` and sets that tab. `mode="hover"`, flute 20, strength 2.8. | stacked 350 × 320 (shorter than Alder's 380), clear-on-scroll; 5 panels = ~1 700 px, acceptable. |
| **Favoriti (4)** | "The full list" rows (§4.8) | label column "Favoriti" + 4 rows: **name · description · price (EUR over RSD)**, `tagLabel` as a pill next to the name, row links to that service in the Cenovnik (`cenovnik.id`). | stacked rows; price on the right of the name line. |
| **Cenovnik** | tabs = chip recipe; groups = FAQ accordion; rows = list rows; estimator card shell | see §7.2 | see §7.2 |
| **Pokloni (4)** | "Ways to pay" notes (3-up → **4-up**, hairline on top, 44 px icon circle, title 22, text 14 muted, price in Label style) | 4 × notes, each ends with an Outline button. | stacked rows `padding 24 0`. |
| **Lokacije ×2** | Visit card, split in two | **Two cards side by side** (each ~650 wide, r36): fluted **static** location photo (flute 44, strength 3.0, tint .62) with cream text: eyebrow `Lokacija 1/2`, H2 = `concept`, area; practical details 2×2 (address, phone `tel:`, WhatsApp, shared hours with the open-now chip). Beauty card on `--lila-900`-tinted photo, Wellbeing on a sage-tinted one. No map button (no URLs in data). | stacked, r24, 48 px tap rows. |
| **Utisci (4)** | Reviews masonry (§4.12) | centred header; **2 columns × 2 cards** (634 wide; quote 26 px fits Serbian quotes of 150–200 chars); name = `author`, role = `tag`. | 1 column, quote 21 px; optional scroll-snap row at 86 % width. |
| **Posebna ponuda (4)** | **Ink card + steps grid (§4.9)**, but the big numeral is the **price** | 4 columns (`grid 4 × 1fr`, gap 40): hairline, **price counter 64–72 px** (EUR; RSD in the pill; `oldPrice` struck through in the pill when present), `title` 30 px, `includes` 16/24.8 muted, button `btn--on-ink` "Zakaži ovaj paket" (WhatsApp `cta.href`). One card, `--lila-900`. | 1 column, numeral 52, button full width (48 px). |
| **Blog teaser** | Dentists cards | 4 cards (first 4 of `blog`): fluted hover photo 311×380, **category glass chip** inside the photo (`categoryLabel`), title 22/26.4, date/read time muted; link "Svi tekstovi na blogu ›". | **2 × 2 grid** exactly like Alder's team (170 × 230, r16). |
| **CTA** | Visit card + request form, WhatsApp variant | Ink/lila-900 card r36 with fluted `cta-bg` (static, tint .62), H2 from `cta.home` (cream + second line at 62 %), and a **form card (450, r28)** = *WhatsApp quick-book*: 5 date chips + 3 time-of-day chips + optional name → button opens `https://wa.me/381648239439?text=…` with the choice pre-filled. **No backend, no data stored; needs the client's OK on the flow.** | form card r18 under the headline; chips 6 px gap. |
| **Footer** | Footer (§1.3) | brand blurb `footer.description`, 3 columns (`footer.columns`: contact, social, locations), **fluted wordmark "Lepa Svaki Dan"**, legal rule: © + `footer.credit` "Pripremio ECHOSYSTEM-MOTHER AGENCY". | columns 2-up, wordmark 350 wide (≈ 50 px high), legal stacked. |

### 7.2 Cenovnik — 210 services, 5 tabs, 31 groups: must stay fully usable on a phone

Alder has no tabs or long lists (7 rows), so this is **composed from its parts**; nothing here is a template feature.

```
#usluge
 ├─ centred header (§4.5): eyebrow "Cenovnik" · H2 "Usluge i *cene.*" (60 → 36) · lead 20/29 muted
 │   chips: "Cenovnik važi od {pricing.validFrom}" · "Plaćanje u dinarima"  (glass-free: field bg, r999, 14/500)
 ├─ sticky toolbar  (top = nav bottom + 8: 86 px desktop / 78 px mobile; z 8; bg canvas @ 90 % + blur 20)
 │     tabs (5)  +  search field (r14, 54 px, 16 px text)
 ├─ legend line: ● lila Beauty  ● green Wellbeing  ◐ obe
 └─ list region
     desktop: grid [260 | 1fr]  = Alder "full list" geometry
        left (sticky, top 156): "Grupe" index for the ACTIVE tab (14/500 links + muted counts, current = ink), scrolls to the group
        right: accordion groups (FAQ recipe) → service rows (list-row recipe)
     mobile: single column, groups only (index hidden)
```

**Tabs** (5: Tretmani lica 58 · Tretmani tela 36 · Estetske procedure 62 · Naši protokoli 26 · Laserska epilacija 28). Recipe = **Outline button pill** (`min-height:44px; padding:0 18px; border:1px solid var(--line); font:500 14px`) with **selected = ink fill, canvas text** (the template's selection language, `.2 s`), count in muted 12 px. Desktop: all 5 in one row. Mobile: one horizontally scrollable row (`overflow-x:auto; scroll-snap-type:x proximity; scrollbar-width:none`, edge fade mask 24 px, active tab `scrollIntoView({inline:'center'})`), `role="tablist"`, arrow keys, `#usluge/lice` deep links. All panels are in the DOM (static HTML from content.json, `hidden` toggled), no fetch.

**Groups** (31; up to 17 services in one, "Biorevitalizacija i skinbosteri"): FAQ item recipe (§4.12): hairline on top, row `padding:24px 0` (20 mobile), title **22/26.4** (19/22 mobile, wraps), muted count "6 usluga" under or beside it, **36 px toggle circle** (plus → × at 45°, surface-2 → ink), `min-height:64px` hit area on the whole row, `aria-expanded`. Only the **first group of a tab is open**; "Otvori sve grupe" shows for tabs with ≥ 8 groups. Open/close: `grid-template-rows:0fr→1fr` over **.45 s `var(--ease)`** (instant when reduced motion). `scroll-margin-top = 156 px` so a header never hides under nav + toolbar. `content-visibility:auto; contain-intrinsic-size:auto 80px` on closed groups.

**Service row.** Desktop = Alder's row exactly: **name 280 | description (muted 14/21, max 546) | meta 130 right-aligned**, `gap 32`, `padding 24px 0` (use 18 px: lists are long), hairline on top. Meta stack = **`51€` (14/500 ink) over `6.000 rsd` (14/400 muted)**: this is Alder's "From $140 / 45 min" slot used as currency pair; `onRequest` → "Na upit" pill; `duration` (only 3 services have it) → small pill under the description. Mobile = **compact variant, not Alder's fully stacked row** (that is 153 px each): 

```
┌ name (17/21, 500, up to 3 lines)                          51€  ┐   grid-template-columns:1fr auto; gap:4px 16px
│ description (14/21 muted)                       6.000 rsd       │   padding:16px 0; min-height 64
│ [★ Favorit] [Pročitaj više ›] [● lokacija]                      │   chips 12/500, ≥ 32 px high, link hit area 44
└─────────────────────────────────────────────────────────────────┘
```
`font-variant-numeric:tabular-nums`; the price column never wraps (the name column absorbs the squeeze); highlighted services (44) get the "★" pill; `blogPost` → "Pročitaj više ›". Location per row = **10 px dot** (lila / green / split) + one legend line above the list, not a text badge on every row. Laser tab (28 rows, 5 groups) uses the same row; keep `role="table"`-style semantics if desired; **no horizontal scroll anywhere**.

**Search**: field recipe (§4.12), 16 px font (no iOS zoom), clear button, `aria-live="polite"` result count; typing opens matching groups across the active tab and shows "n rezultata u drugim kategorijama" chips that switch tabs; `search.minChars`, `debounceMs`, `tagRules`, `synonyms` already in data.

**Payment / booking**: `payment.modal` opens as a **bottom sheet on mobile** (`inert` page, `Esc`, focus return), a centred card (r28) on desktop. Row CTA = Outline button "Zakaži" → WhatsApp with the service name pre-filled.

**Phone checklist**: no hover dependence · all tap targets ≥ 44 px (template's chips are 33–42, so raise them) · sticky toolbar ≤ 112 px total (tabs 44 + search 54 + paddings = 120 → on mobile collapse search behind a 44 px icon until focused) · body scroll never trapped · bottom action bar never covers the last row (`padding-bottom` + safe area) · the first open group must be visible without scrolling past the toolbar.

---

## 8. Gotchas, assets and build notes

- **Do not copy** the Framer artefacts: "Made in Framer" badge, the edit pencil, the duplicated nav / footer DOM variants (`hidden-*` classes), all `framer-*` classes, `will-change:transform` left on idle elements. Use real `@media` instead of triplicated markup.
- **Hero height** is exactly the viewport; use `min-height:100svh` (fallback `100vh`) and keep the bottom content block absolutely positioned so the address bar collapsing does not move the headline.
- **Performance**: strip counts self-scale (hero 20 / 36 / 42 at 390 / 1000 / 1440, 16 for a 311 px panel, 12 for a 170 px mobile portrait); animate only while visible (IntersectionObserver) and only via `background-size/position` + opacity; `backdrop-filter` is used on nav, chips, slider bar and the wipe, so give each a solid fallback (`@supports not (backdrop-filter:blur(1px))`); keep at most ~4 blurred elements in view.
- **Images for the glass**: choose photos with **detail across the frame** (faces, hair, textures): flat cream backgrounds (the orchid) show almost no ribbing. Portrait cut-outs need `data-cutout`, transparent PNG/WebP, and a stage colour behind. Ship `srcset` widths 480 / 800 / 1200 / 1800 (the strips share one URL, so the browser caches it once).
- **Accessibility fixes vs. the template**: no visible focus rings (add), chips 33–42 px (raise to 44), subtle `#858d87` text only on ≥ 36 px, glass nav without blur support, decorative flutes `aria-hidden` with the container carrying `role="img"` + `aria-label`, wipe hidden under reduced motion, hover-only clearing replaced on touch.
- **Template copy is dental** ("Dentists", "Fees", estimator, insurance): none of it is reusable; only structure and manner are.
- **Unverified / approximated**: (1) hover colours for button variants come from the component source (`#2a332e`, `#e7e5de`, `#fff`, `rgba(11,14,13,.06)`, `rgba(241,240,234,.14)`, `rgb(214,247,230)`), not from a rendered hover; (2) Framer's bounce-0 spring is represented by `cubic-bezier(.16,1,.3,1)`; (3) the FAQ open state was read from source, my click test did not expand it in headless; (4) dark theme tokens come from the CSS plus one screenshot (`d_dark_theme.png`); (5) the Lepa hero (cut-out through glass on lila) is a prototype on stand-in colours; (6) Galano Grotesque sizing is an estimate from its metrics, check it visually.

---

Pripremio ECHOSYSTEM-MOTHER AGENCY · 2026-10-07
