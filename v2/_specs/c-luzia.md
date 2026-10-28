# SPEC C — "Luzia" (Framer portfolio template) → manner rebuild in plain HTML/CSS/JS

`ECHOSYSTEM-MOTHER AGENCY` · design-manner spec · 2026-10-07

- Template: **Luzia — Portfolio Template** (Framer; demo persona "Michael Carter, Digital Product Designer"; template author credit in footer "Rosyid Qoim / Irise Studio")
- Live demo: **https://luzia.framer.website/** (canonical + og:url in the saved file; reachable, rendered fine in headless Chrome 1440 / 900 / 390)
- Sources analysed: `~/Desktop/Download/luzia_framer_website.html` (SSR markup, 5 `<style>` blocks, appear-animation JSON, breakpoint JSON) **plus the live page**, driven with Playwright + system Chrome: computed styles of every named layer at 1440 / 900 / 390, hover / click / scroll probes, rAF-sampled animation curves, pixel-diffs of hover states. The supplied `luzia_static.html` / `luzia_d.png` / `luzia_m.png` were only hints (blank hero, no images) and are superseded.
- Screenshots (all in `v2/_specs/c/`, I looked at them): `d_00…d_09.png` = desktop 1440×900 viewport slices every 800 px (full page, final animated state); `m_00…m_12.png` = mobile 390 (dpr 2, 780×1688) slices every 760 px; `t_00…t_04.png` + `sheet_tablet_900.png` = tablet 900; `m_menu_open.png`, `m_menu_closed*.png` = burger menu; `faq_open2.png` = two FAQ rows open; `work_rest.png` / `work_hover.png` = work-card rest vs hover; `hover_*.png` = crops of each hovered component, `hv_*.png` = before|after pairs, `sheet_hover_nav_footer_tags.png` = contact sheet of those pairs. **`luzia_live_d.png` (1440×6000) and `luzia_live_m.png` (390×7000) are tall-window captures where the hero is `100vh` = the whole window (a giant face) — real page heights are 7380 px desktop / 10365 px at 900 / 9739 px mobile. Do not use those two to judge proportions.**
- Measurement note: unlike many Framer templates, Luzia **is fluid** (percent / flex / `max-width` layers, not fixed artboards): the 1120 container simply keeps 40 px gutters down to 1200, and tablet / mobile are separate layouts that fluidly fill 810–1199 / 0–809.
- Not extracted / inferred (marked "inferred" below): hover border of the secondary pill (diff was 0.7 / 255, treated as border fading in), pressed / focus states (none exist in the template), the exact easing of the nav-sibling-dim (same family as other hovers assumed). Framer hover animations are JS (no CSS `:hover` in the saved file), so they were read from the running page.

---

## 0. TL;DR of the template

A **white, almost typographic portfolio** with one strong gesture: a **transparent cut-out portrait that fills the hero and rises behind a small headline**, its lower third dissolving into the page through a *progressive blur + white fade* and slowly zooming as you scroll. Below it: a **2×2 grid of 40 px-radius image cards**, a **three-card social-proof row** (light / one very dark with a huge diagonal shadow / light), a **three-up "shell" card trio** (grey shell → white inner panels, the middle one vivid purple in a black bezel), a **grain-textured black section with a zig-zag of five dark step cards**, a **two-column FAQ with independent accordions**, and a **black footer block with a slowly rotating 3-D flower**. Typography is *one family (Instrument Sans) in two weights (400 / 500)* at **−0.03 em tracking**, sentence case only. Colour is **white + #f7f7f7 + near-black #111**, a single vivid accent (#7430f7) that appears only on hover and on the one "prominent" card. Motion is a hero entrance, a scroll-linked hero zoom, a pulsing status dot, a rotating blob, and a vocabulary of **hover micro-moves** (zoom-out, text-roll, rotating arrow, fan-out, sibling-dim, colour swap). There is **no marquee, no counter animation, no tabs, no price list, no map, no carousel** — we extend for those (§7).

---

## 1. Structure, breakpoints, collapse behaviour

### 1.1 Breakpoints (media queries in CSS + `__framer__breakpoints` JSON)

| Name | Query | Layout notes |
|---|---|---|
| Desktop | `min-width:1200px` | container **1120** centred (nav / hero content **1360** = `min(1440, 100%) − 2×40`); hover-capable layouts |
| Tablet | `810px–1199.98px` | nav collapses to **burger**; container = viewport − 80 (40 px gutters); one-column cards 820 wide; social-proof drops the Awwwards card |
| Mobile | `max-width:809.98px` | gutters 20 px; one column; radii shrink 40→24; hover-only effects are baked into their "revealed" state |

Hash classes `hidden-72rtr7 / 504agf / 1tle0cj` are just the three duplicated DOM trees (Framer renders desktop, tablet and phone variants of nav / cards / buttons and hides two with `display:none`). **Rebuild with one DOM and `@media`.** Our nav has 6 links, so switch to burger at **≤ 1023 px** (as in the sibling specs) instead of 1199.

### 1.2 Section order, top → bottom (measured live; page height 7380 @1440×900 · 10365 @900×1000 · 9739 @390×844)

| # | Section (Framer name) | Desktop 1440 | Tablet 900 | Mobile 390 |
|---|---|---|---|---|
| 0 | **Nav** (`Desktop` / `Tablet Closed` / `Phone Closed`) | `position:fixed; top:0; z-index:10`, **68 px**, solid `#fff`, no border / shadow / blur, never changes on scroll. Pad 10 40; inner 1360×48: logo left · 3 links centred (204 px group, centre = 720) · Primary btn 135×48 right | fixed **66 px**: logo + burger | fixed **58 px** (pad 16 20 40, `overflow:hidden`): logo 18/500 left, burger 24 px right; open = **358 px** |
| 1 | **Hero** | **900 = 100vh** (`min-height:100vh`-like: 700 → 700, 1100 → 1100). Layers: image container (overflow hidden) · bottom blur 400 px · content row 350 px (absolute, bottom). Cut-out centred, `top:100px; bottom:-86px` (height = 100vh − 14), width = height × 1.2605 (src 2400×1904) | **1020**: text block 450 (pad-top 120) then image block **570** (img 718×570, blur 250) | **948**: text block 488 (pad-top 120) then image block **460** (img 563×447, centred, cropped to 390, blur 200) |
| 2 | **Works** ("Featured works") | **1340** = pad 200 + [headline 48 · gap 40 · grid 2×2 of **554×420**, gap 12 = 852] + pad 200 | **3011**: same pad 200; 4 cards **820×622** stacked, gap 12 | **1435**: pad 150 / 100; 4 cards **350×265** stacked, gap 12 |
| 3 | **Social proof** | **650** = 3 cards **368×450**, gap 12 (container 1128 → x 156…1284) + pad-bottom 200 | **650**: 2 cards **404×450** (dark quote + stats; Awwwards card hidden) + pad-bottom 200 | **1574** = pad 100 + 3 cards **350×450** (gap 12) + pad 100 |
| 4 | **Services** | **891**: headline row 173 · gap 60 · 3 shell cards **365×458**, gap 12 · pad-bottom 200 | **1954**: 3 shell cards stacked **820×500**, gap 12 (thumbs 251 tall) · pb 200 | **1736**: stacked **350×443** · pb 100 |
| 5 | **How it works** (dark) | **1711**, bg `#111`, radius **40 all corners**, grain overlay, pad 150: label column left (x 160–580) · content column **672 @ x 608**: statement (2-tone 36/43) · gap 60 · 5 step cards **437×218–241** zig-zag, row gap 16 | **1674**, pad 150 / 40: label above, statement, cards **533×216** zig-zag (65 %) | **1747**, radius 40, pad 100 / 20: label, statement, cards **350×230** full width, gap 20 (no zig-zag) |
| 6 | **FAQs** | **984**, pad 200: two columns **540 / 540**, gap 40: left = label+hairline, 2-tone statement 36/43, Primary btn · right = grey shell **540×584** | **1180**, pad 200 / 40: stacked; shell **820×524** | **1311**, pad 100 / 20 / 200: stacked; shell **350×697** |
| 7 | **CTA + footer** (`Desktop` / `Tablet` / `Phone`) | **904**, bg `#111`, radius **40 40 0 0**, grain, pad 120 / 0 / 60: CTA stack 400 wide (flower 221, h2 40/44 centred, inverse btn) · gap 80 · footer columns (3 link columns, gap 80) · credit row | **876**, pad 100 / 40 / 60 | **987**, pad 80 / 20 / 40: CTA centred; link columns wrap (2 + 1); credit stacks |

### 1.3 Hero anatomy (the signature)

`Hero` = full-width flex, `overflow` on the image container only. All vertical numbers at 1440×900:

| Layer | Desktop | Tablet / mobile |
|---|---|---|
| **Image container** | 1440×900, `position:relative; overflow:hidden` | block under the text: 900×570 / 390×460 |
| **Cut-out `Img`** | `position:absolute; left:50%; top:100px; bottom:-86px` (height 886), width 1116.8 (= 886 × 2400/1904), `transform:translateX(-50%) …` ; webp 2400×1904 | tablet: `top:0; bottom:0; left:50%`, 718×570 · mobile: `top:23px; bottom:-10px; left:50%`, 563×447 (wider than 390 → cropped both sides ≈ 87 px) |
| **Blur** (bottom fade) | `position:absolute; left:0; right:0; bottom:0; height:400px; backdrop-filter:blur(20px); mask-image:linear-gradient(transparent 20%, #000 75%); background:linear-gradient(rgba(255,255,255,0) 51%, rgba(255,255,255,.5))` | 250 / 200 px tall, same recipe |
| **Content** (z above blur) | `position:absolute; inset:auto 0 0; height:350; padding:0 40`; row inner 1360 `padding-bottom:40`, `align-items:center`: **Headline column** left (max 600; `justify-content:flex-end`, gap 16: status chip → H1 40/44) · **Desc column** right (400 wide, gap 24: paragraph 16/22.4 → Primary btn) vertically centred in the 350 row (so its bottom sits ~75 px above the H1 baseline) | static flow *above* the image: pad `120 40 0` / `120 20 0`; Tag → H1 → paragraph → button, gap 16 / 32; **H1 is not overlaid on the face on small screens** |

Z-order: image → blur → content; nav `z:10` above everything. Because the white fade is ≤ 50 % alpha at the very bottom, dark text over the person works only where she is light (white shirt) — see §7 for our navy blazer.

### 1.4 How grids collapse

- **Works grid**: `display:grid; grid-template-columns:1fr 1fr; gap:12px` → one column at ≤1199. Card aspect is constant **554 : 420 (1.319)** at all three sizes (554×420 / 820×622 / 350×265) — use `aspect-ratio:554/420`. Radius 40 → 24 at mobile. The tag row is **always visible** (no hover dependence).
- **Social proof**: `flex`, 3 × 368 (desktop) → 2 × 404 (tablet; card 1 `display:none`) → column of 3 × 350×450 (mobile). Card heights are fixed 450 at every size.
- **Services trio**: 3 columns (365 each) → stacked full-width cards. Thumbnail strip is 3 equal tiles (99 → 251 tall on tablet because tiles are `aspect-ratio:1` with `flex:1`), tags wrap (`flex-wrap`, gap 8).
- **How it works**: the zig-zag is just `justify-content:flex-start / flex-end` on alternating rows with cards at **65 %** of the 672 column; on mobile cards go **100 %** and the alternation stops.
- **FAQ**: 2 columns → 1; the shell keeps its internal rhythm.
- **Footer**: `Main Nav` (2 columns, gap 80) + `Links` (1 column) in a row (desktop/tablet) → column; columns wrap 2+1 on mobile. Credit row: `space-between` → stacked, gap 20.
- **Hero**: overlay composition → stacked composition at ≤1199 (the reason the mobile H1 stays crisp).

---

## 2. Typography, spacing, radii, shadows, borders

### 2.1 Family and OpenType

**Instrument Sans** only (Google Font, weights **400 and 500**; the CSS also loads Inter 400/600/700/900 for the unused bold/italic slots — ignore). Every text style sets
`font-feature-settings:"blwf","cv09","cv03","cv04","cv11"` (alternate glyph set; keep if the face supports it), `-webkit-font-smoothing:antialiased`, `text-transform:none`, `letter-spacing:-0.03em` (56 of 61 presets; 3 are −0.04em, 2 are 0). **No uppercase, no italics, no serif anywhere.** No `text-wrap:balance` (lines are controlled by `max-width`).

### 2.2 Scale (computed on the live page; `size / line-height · weight · tracking`)

| Role | Desktop 1440 | Tablet 900 | Mobile 390 |
|---|---|---|---|
| **H1** hero headline · **CTA headline** | 40 / 44 · 500 · −1.2 | 36 / 39.6 · 500 · −1.08 | 32 / 35.2 · 500 · −0.96 |
| **H2** section statement ("Featured works", "Design solutions…", "A simple and efficient…", FAQ statement) | 36 / 43.2 · 500 · −1.44 | 32 / 38.4 · 500 · −1.28 | 28 / 33.6 · 500 · −1.12 |
| **Card title** (work-card name, awards title, step title + step number) | 24 / 31.2 · 500 · −0.72 | 22 / 28.6 · 500 · −0.66 (work name, step title, step number) · awards 24 / 31.2 | 20 / 26 · 500 · −0.6 (all of them) |
| **Quote** (dark card) | 24 / 31.2 · **400** · −0.72 | 24 / 31.2 · 400 | 20 / 26 · 400 · −0.6 |
| **Section label / shell title / FAQ question / stat chip / logo** | 20 / 26 · 500 (label muted; stat chip 400) · −0.6 | 18 / 23.4 · 500 · −0.54 (logo 18) | 18 / 23.4 · 500 · −0.54 |
| **Step number** (muted, inside the 40 px circle) | 24 / 31.2 · 500 | 22 / 28.6 | 20 / 26 |
| **Body / description / tag text / footer links** | 16 / 22.4 · 400 · −0.48 | 16 / 22.4 | 15 / 21 · 400 · −0.45 |
| **Button label** | 16 / 20.8 · 500 · −0.48 | 16 / 20.8 | 15 / 19.5 · 500 |
| **Nav link** | 15 / 18 · 500 · −0.45 | burger-menu links 16 / 19.2 | 16 / 19.2 |

Two-tone statements: **one `<h2>` with two spans** — first sentence muted `#6c7179`, last sentence ink `#111` (light sections: *muted → ink*; dark "How it works": *white → muted*; CTA: *muted → white*). This is the template's only typographic flourish; keep it.

### 2.3 Spacing system

Not a strict scale; numbers actually used: **4, 6, 8, 12, 16, 24, 32, 40, 60, 80, 100, 120, 150, 200**. Rules of thumb:
- **Section vertical rhythm**: 200 px (desktop/tablet) / 100–150 (mobile) of empty canvas between sections; content blocks are bounded only by that air (no section bg except the two dark ones).
- **Gutters between cards: 12 px, always** (work grid, social-proof row, services trio, stacked mobile cards). Shell interior gap **6**, FAQ list gap **8**, tag gap **8** (cards) / **12** (work-card overlay), step rows **16** (desktop) / **20** (mobile).
- **Card inner padding**: 24 (social cards, step cards, shell body, FAQ row 16), work-card overlay `0 24 24`.
- **Container**: 1120 (sections), 1128 (social row = 3×368 + 2×12), 1360 (nav, hero row), 672 (content column of dark section), 600 / 400 (hero H1 / paragraph).

### 2.4 Radii · shadows · borders

- **Radius ladder**: **40** (work cards, social cards on desktop/tablet, dark section blocks, footer top) · **24** (shell cards, step cards, FAQ shell, everything on mobile instead of 40) · **20** (inner panels of shell, FAQ rows) · **16** (buttons, chips, stat chips, FAQ chip) · **12** (tags, icon chips, thumbs, outlined icon buttons, icon-only secondary on mobile) · **8** (avatar, mobile awards preview) · **100** (pills: status chip, "trusted" pill, number circle).
- **Shadows are directional, bottom-right (light from top-left), layered 5–8×, and only on a few objects**: primary button, FAQ chip, the dark quote card, the prominent service card. Light cards have *no* shadow (flat grey on white). Vertical-only soft shadows on stat chips and the "trusted" pill.
  - `--shadow-btn` (primary btn, FAQ chip): `0.47px 0.47px 0.67px -0.2px rgba(0,0,0,.05), 1.29px 1.29px 1.83px -0.4px rgba(0,0,0,.06), 2.84px 2.84px 4.01px -0.6px rgba(0,0,0,.08), 6.29px 6.29px 8.9px -0.8px rgba(0,0,0,.11), 16px 16px 22.63px -1px rgba(0,0,0,.2)`
  - `--shadow-card` (dark quote card, prominent service card): `0.67px 0.67px 0.95px -0.125px rgba(0,0,0,.05), 1.59px 1.59px 2.25px -0.25px rgba(0,0,0,.06), 2.9px 2.9px 4.11px -0.375px rgba(0,0,0,.06), 4.83px 4.83px 6.83px -0.5px rgba(0,0,0,.07), 7.8px 7.8px 11.03px -0.625px rgba(0,0,0,.08), 12.77px 12.77px 18.05px -0.75px rgba(0,0,0,.1), 21.98px 21.98px 31.09px -0.875px rgba(0,0,0,.13), 40px 40px 56.57px -1px rgba(0,0,0,.2)`
  - `--shadow-chip` (stat chips): `0 .72px .72px -.83px rgba(0,0,0,.075), 0 2.75px 2.75px -1.67px rgba(0,0,0,.075), 0 12px 12px -2.5px rgba(0,0,0,.075)`
  - `--shadow-pill` ("trusted" pill): `0 .64px .64px -.625px rgba(0,0,0,.125), 0 1.93px 1.93px -1.25px rgba(0,0,0,.125), 0 5.1px 5.1px -1.875px rgba(0,0,0,.125), 0 16px 16px -2.5px rgba(0,0,0,.125)`
  - service title bar on hover (same family, alpha .05): `0 .6px .6px -.83px, 0 2.29px 2.29px -1.67px, 0 10px 10px -2.5px`.
- **Borders**: none on surfaces. **1 px `#d1d3d6`** only on *outlined tags* (drawn as an inset border layer, `--border-*` vars) and a 1 px `#1f1f1f` on the dark step cards (`#111` on `#111` bg → the border *is* the card edge). Secondary button carries an invisible 1 px border (`rgba(209,211,214,0)`) that is the hover target (inferred). Hairline `#f7f7f7` 1 px rule after the FAQ label.

---

## 3. Colours and their roles

Framer tokens (exact), role in the template, and what role our substitute must play (brand tokens from `v2/_shared/brand/tokens/brand.css`; note the sibling spec A quotes older `index.html` tokens — the brand pack is authoritative).

| Role | Luzia | Where it is used | Lepa Svaki Dan substitute |
|---|---|---|---|
| **Canvas** | `#ffffff` (token 7718b53b) | body, nav, hero, FAQ rows, inner panels | `--white #FFF` or very slightly tinted `--lila-50 #F9F8FC` (keep the *white* inner panels white so the shell/panel contrast survives) |
| **Surface** | `#f7f7f7` | shells, Secondary btn, filled tags, awards + stats cards, hairlines | `--lila-100 #F4F0F9` (or `--lila-50`) |
| **Line / border** | `#d1d3d6` | outlined-tag border, secondary text on black (role line), inverse-button hover bg | `--lila-200 #E8E1F4` on light; on dark use `rgba(255,255,255,.35)` |
| **Muted** | `#6c7179` | labels, descriptions, first half of 2-tone, secondary text on dark | on light: `--charcoal #5A5758` (7.15:1 on white). **On dark do NOT reuse it** — `#6c7179` on `#111` is 3.8:1 and Luzia's step descriptions fail; use ≈ `#A5A1A2` on `--charcoal-deep` (5.2:1) |
| **Ink soft** | `#1f1f1f` | hero paragraph, stat numerals, secondary-btn text, step-card border, circle gradient | `--charcoal-deep #322F30` |
| **Ink / dark section** | `#111111` | headings, primary button, dark sections, dark quote card, FAQ chip | `--ink #231F20` for text + buttons; `--charcoal-deep #322F30` for the two big dark blocks and the dark quote card |
| **Accent (hover + prominent)** | `#7430f7` | primary-button hover, the one prominent service card (white text 6.0:1), check icon | `--lila-700 #8466BA` (white 4.57:1 — passes for 16/500) **or** keep text ink and use `--lila #C6B4E3` (ink 8.6:1). Prominent card recommended = `--lila` panels in a `--charcoal-deep` bezel with ink text |
| **Accent tint** | `#f5f2ff` | icon chip on prominent card | `--lila-100` |
| **Success / live** | `#00c047` | pulse dot, "Trusted by many" pill (white text on it is only 2.4:1 — fails), rocket icon | location dots only: Beauty = lila, Wellbeing = `--bw` green (see sibling spec). Never as a button / pill background with white text |
| **Yellow** | `#efce03` (+ tint `#fefee8`) | medal, smiley, first service icon | optional brand `--gold #C18F16` as the only warm accent (icon strokes, never text on white: 2.9:1) |
| **Mint tint** | `#eefff3` | third service icon chip, hero-tag ring | `--lila-50` |
| **Grain** | white-noise webp 1536², `mix-blend-mode:darken` over `#111` | both dark sections | SVG noise tile (§4.12) |

Contrast checks I computed: `#111` on white 18:1; `#6c7179` on white 4.9 / on `#f7f7f7` 4.6 / on `#111` **3.8 (fail)**; white on accent 6.0; `#d1d3d6` on `#111` 12.6; white on `#00c047` **2.4 (fail)**.

---

## 4. Components (declarations worth copying)

### 4.1 Tokens

```css
:root{
  --canvas:#fff; --surface:#f7f7f7; --line:#d1d3d6; --muted:#6c7179;
  --ink-2:#1f1f1f; --ink:#111; --accent:#7430f7; --accent-tint:#f5f2ff;
  --ok:#00c047; --yellow:#efce03; --ok-tint:#eefff3; --yellow-tint:#fefee8;
  --font:"Instrument Sans",system-ui,sans-serif; --track:-.03em;
  --ease-settle:cubic-bezier(.22,1,.36,1);   /* all hovers: Framer spring ≈ duration .4-.45, bounce 0 */
  --ease-io:cubic-bezier(.44,0,.56,1);       /* hero appear tweens */
  --t-hover:.65s;                            /* 90 % reached at ~.27 s, 99 % at ~.5 s */
  --shadow-btn:…; --shadow-card:…; --shadow-chip:…; --shadow-pill:…;  /* §2.4 */
}
body{margin:0;background:var(--canvas);color:var(--ink);font:400 16px/1.4 var(--font);
  letter-spacing:var(--track);font-feature-settings:"blwf","cv09","cv03","cv04","cv11";-webkit-font-smoothing:antialiased}
```

### 4.2 Nav — desktop

Flat white bar, fixed, no scroll behaviour. Logo left (text, 20/26 · 500), three links centred (padding `6px 12px`, 15/18 · 500), Primary button right.
```css
.nav{position:fixed;inset:0 0 auto;z-index:10;height:68px;background:#fff;padding:10px 40px;display:flex}
.nav__in{width:100%;max-width:1360px;margin:auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center}
.nav__links a{padding:6px 12px;font:500 15px/18px var(--font);transition:opacity .4s var(--ease-settle)}
.nav__links:hover a:not(:hover){opacity:.3}      /* hovered link stays 1, siblings fall to .3 */
.nav__logo:hover{opacity:.3}                      /* logo dims itself */
```
Hover facts (measured): hovering **About** sets *Work* and *Contact* to opacity **0.3** while About stays 1; hovering the logo sets the logo to 0.3.

### 4.3 Nav — mobile / tablet

58 px (tablet 66) white bar: logo left, **Phosphor "List" 24 px** (stroke-ish, `#6c7179`) right. Tap swaps it for **"X"** and the bar **grows instantly to 358 px** (no transition in the template; header `overflow:hidden`, white, no scrim, page not locked): stacked links (16/19.2 · 500, row `padding:6px 12px 6px 0`, gap 8), a row of **three 40×40 outlined icon buttons** (X, mail, YouTube; radius 12, 1 px `#d1d3d6`, gap 10), then a **full-width Primary button** (350×48). Sections for us: add the same panel but animated (§5, M13).

### 4.4 Buttons

```css
.btn{display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:12px 24px;border-radius:16px;
  font:500 16px/20.8px var(--font);overflow:hidden;white-space:nowrap;
  transition:background-color var(--t-hover) var(--ease-settle),border-color var(--t-hover) var(--ease-settle)}
.btn--primary{background:var(--ink);color:#fff;box-shadow:var(--shadow-btn)}
.btn--primary:hover{background:var(--accent)}                       /* black → vivid accent, text stays white */
.btn--secondary{background:var(--surface);color:var(--ink-2);border:1px solid rgba(209,211,214,0)}  /* "All Works →", arrow 20px */
.btn--secondary:hover{border-color:var(--line)}                     /* inferred */
.btn--inverse{background:#fff;color:var(--ink-2)}                   /* on dark */
.btn--inverse:hover{background:var(--line)}
.btn--icon{width:48px;height:48px;padding:0;border-radius:12px;background:var(--surface)}  /* mobile "All works" */
```
Sizes: 48 px tall at every breakpoint (nav 135×48, hero 112×48, mobile nav CTA 350×48). Mobile label 15/19.5. There is no focus ring and no pressed state in the template — add `:focus-visible{outline:2px solid var(--accent);outline-offset:3px}` and `:active{transform:translateY(1px)}`.

### 4.5 Chips and tags

- **Status chip** (hero): `display:inline-flex;gap:12px;padding:5px 10px;border-radius:100px;background:#fff`, text 16/22.4 muted; 10 px dot `#00c047` + a pulsing ring (§5 M3).
- **Outlined tag**: `padding:6px 12px;border:1px solid var(--line);border-radius:12px;font:400 16px/22.4px` — white text on photos / on the purple card.
- **Filled tag**: same box, `background:var(--surface);color:var(--muted)`; wraps (`flex-wrap:wrap;gap:8px`); the last tag is literally "+more".
- **Icon chip**: 40×40, radius 12, padding 8, tinted bg (`#fefee8` / `#f5f2ff` / `#eefff3`) holding a 24 px Phosphor icon in `#efce03` / `#7430f7` / `#00c047`.
- **FAQ chip**: `background:var(--ink);color:#fff;border-radius:16px;padding:8px 16px;box-shadow:var(--shadow-btn)` ("I'm here to help you", centred above the list).
- **Stat chip**: white, radius 16, padding `12px 16px`, 20/26 text (numeral `#1f1f1f`, rest `#111`) + 24 px icon right, `--shadow-chip`.
- **"Trusted by many" pill**: `#00c047`, radius 100, padding `5px 12px 5px 5px`, 87×26 overlapping avatar circles + 16/22.4 white text, `--shadow-pill`.

### 4.6 Work card (image card) — the verticals, locations and blog tiles

```css
.work{position:relative;display:block;aspect-ratio:554/420;border-radius:40px;overflow:hidden;isolation:isolate;color:#fff}
.work img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
  transform:scale(1.06);transition:transform var(--t-hover) var(--ease-settle)}   /* rest = 588 px wide inside a 554 card */
.work:hover img{transform:scale(1)}                                                /* hover = zoom OUT to 554 */
.work__meta{position:absolute;inset:auto 0 0;z-index:1;padding:0 24px 24px;display:flex;flex-direction:column;gap:12px}  /* z-index:1 makes the ::before sit ABOVE the img */
.work__meta::before{content:"";position:absolute;inset:0;z-index:-1;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  -webkit-mask:linear-gradient(transparent 5%,rgba(0,0,0,.475) 49.95%,#000);mask:linear-gradient(transparent 5%,rgba(0,0,0,.475) 49.95%,#000)}
.work__title{font:500 24px/31.2px var(--font);letter-spacing:-.03em}
```
The overlay is **only a progressive blur** (no dark scrim); legibility comes from the photo being mid/dark at the bottom. Overlay box is 102 px tall (title 31 + 12 + tags 34 + 24). Mobile: radius 24, title 20/26, same structure. The tile is a full `<a>`.
Verified: rest state is the *larger* image (scale ≈1.06), hover animates to scale 1 (pixel diff of `work_rest.png` vs `work_hover.png`).

### 4.7 Shell card (services trio) — "grey frame, white panels"

```css
.shell{background:var(--surface);border-radius:24px;padding:6px;display:flex;flex-direction:column;gap:6px}
.shell__bar{display:flex;align-items:center;gap:12px;padding:8px 8px 8px 12px;background:#fff;border-radius:20px;overflow:hidden}
.shell__title{flex:1;height:26px;overflow:hidden}                       /* text-roll window, see M11 */
.shell__title span{display:block;height:26px;font:500 20px/26px var(--font)}
.shell__icon{width:40px;height:40px;padding:8px;border-radius:12px;overflow:hidden;background:var(--yellow-tint)}
.shell__body{background:#fff;border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:32px;color:var(--muted)}
.shell__content{display:flex;flex-direction:column;gap:16px}           /* text 16/22.4 muted + thumbs */
.shell__thumbs{display:flex;gap:4px}.shell__thumbs img{flex:1;aspect-ratio:1;border-radius:12px;object-fit:cover}
.shell__tags{display:flex;flex-wrap:wrap;gap:8px}
/* the ONE prominent card: black bezel, accent panels, big shadow */
.shell--prominent{background:var(--ink);box-shadow:var(--shadow-card)}
.shell--prominent .shell__bar,.shell--prominent .shell__body{background:var(--accent);color:#fff}
.shell--prominent .shell__bar span{color:#fff}.shell--prominent .shell__icon{background:var(--accent-tint)}
```
Desktop 365×458 (body 353×384: padding 24 + content 227 + gap 32 + tags 77 + 24). Tablet 820×500, mobile 350×443.

### 4.8 Social-proof trio

**Card 1 — Awwwards (light, hover reveals preview)**: 368×450, `#f7f7f7`, radius 40, padding 24, `overflow:hidden`; top: "W." logo 40×40 + medal icon (30 px yellow); title 24/31.2 · 500; body 16 muted; below, a **preview screenshot** (320×469, radius 8 on mobile) absolutely positioned at `top:194px` so its upper half peeks from the card bottom; an `Overlay` (`rgba(17,17,17,.3)`) and a 40×40 radius-12 **arrow chip** (`rgba(255,255,255,.5)` + `backdrop-filter:blur(5px)`, white ↗ 20 px) at its top-right, both `opacity:0` at rest on desktop.
**Card 2 — Quote (dark)**: `#111`, radius 40, padding 24, `box-shadow:var(--shadow-card)`, `justify-content:space-between`: Phosphor "Quotes" 40 px in muted, quote 24/31.2 · **400** white, bottom row: 36×36 avatar (radius 8) + name white 16 / role `#d1d3d6` 16, gap 12.
**Card 3 — Stats (light, stacked chips)**: `#f7f7f7`, radius 40; three stat chips centred, stacked like a deck; green "Trusted by many" pill pinned to the top (hidden at rest on desktop).
Stat chip geometry (desktop, rest): `Project` 320×50 (front, y 0), `Experiences` scale .95 (304×48, y +15), `Happy client` scale .9 (288×45, y +30); `Project` and `Experiences` carry `--shadow-chip`.
Chip icons (Phosphor, 24 px): CheckCircle `#7430f7` ("20+ projects completed"), RocketLaunch `#00c047` ("5+ years of experiences"), Smiley `#efce03` ("10+ happy clients").

### 4.9 Step card (dark section)

```css
.step{width:65%;background:var(--ink);border:1px solid var(--ink-2);border-radius:24px;padding:24px;display:flex;flex-direction:column;gap:20px}
.step:nth-child(even){margin-left:auto}                       /* zig-zag; mobile: width:100%, margin:0 */
.step__no{width:40px;height:40px;border-radius:100px;display:grid;place-items:center;
  background:linear-gradient(0deg,var(--ink-2),var(--ink));font:500 24px/31.2px var(--font);color:var(--muted)}
.step h3{font:500 24px/31.2px var(--font);color:#fff;margin:0}
.step p{color:var(--muted);margin:0}                          /* ← raise contrast on our dark, see §3 */
```
Column gap structure: number circle → (title + 12 + body) block. No hover, no scroll effect on these cards.

### 4.10 Accordion (FAQ)

```css
.faq{background:var(--surface);border-radius:24px;padding:24px 8px 8px;display:flex;flex-direction:column;align-items:center;gap:24px}
.faq__list{width:100%;display:flex;flex-direction:column;gap:8px}
.faq__item{background:#fff;border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}
.faq__q{display:flex;align-items:center;justify-content:space-between;gap:12px;font:500 20px/26px var(--font)}   /* 18/23.4 on tablet+mobile */
.faq__a{color:var(--muted)}                                   /* 16/22.4, 15/21 mobile */
.faq__icon{width:28px;height:28px;transition:transform .3s var(--ease-settle)}   /* Phosphor Plus 18px glyph; open = rotate(45deg) → ×  */
```
Behaviour (measured by clicking): **items toggle independently** (opening #2 leaves #1 open), the **first item is open on load**, closed row 58 px, open row 160 px (1-line question + 4-line answer). Height animates in ≈ 0.2 s with a ~1 % overshoot (a stiff spring, ≈ `.28s cubic-bezier(.2,.9,.3,1.04)`); the "+" turns into "×" by 45° rotation.

### 4.11 Counters, marquee

**None in the template.** The "20+ / 5+ / 10+" stats are static text inside chips. There is no logo ticker and no infinite scroller. (The old Lepa site has a count-up; if we keep it: animate once on intersect, `font-variant-numeric:tabular-nums`, server-rendered final value, never show "0+".)

### 4.12 Grain overlay (dark sections)

Template: absolutely-positioned 1536² webp, `object-fit:cover`, wrapper `mix-blend-mode:darken`, over `#111`. Measured result on the page: pixels range **0–17**, mean ≈ 10.7, σ ≈ 5 (i.e. the grain only ever *darkens* the black; ~20 % of pixels sit at exactly 17). Equivalent without an image:
```css
.grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:darken;background-size:256px 256px;
 background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='.25 0 0 0 -.075  .25 0 0 0 -.075  .25 0 0 0 -.075  0 0 0 0 1'/></filter><rect width='256' height='256' filter='url(%23n)'/></svg>")}
```
(Target ratios, measured on `#111` = 17: noise mean ≈ 63 % of the base value, σ ≈ 30 %, capped at the base. For our `#322F30` base (≈ 48) that means mean ≈ 30, σ ≈ 14 → scale the matrix constants ×2.8; judge by eye on a phone.) Keep the tile at 256 px and never animate anything underneath it — no 1536² bitmap on phones.

### 4.13 Footer / CTA block

Dark block `radius:40px 40px 0 0`, `overflow:clip`, grain, padding `120 0 60` (tablet `100 40 60`, mobile `80 20 40`), `gap:80`:
1. **CTA stack** (400 wide, centred, gap 32): a **221×221 `<canvas>`** WebGL flower (purple/black 3-D blob; a code component) that **rotates continuously −18°/s** (CCW, ≈ 20 s per turn) → H2 40/44 two-tone (muted `#6c7179` first clause, white rest, centred) → **Inverse button** (white, "Book a Call", 124×48).
2. **Link columns** (gap 80): label (16/22.4 `#6c7179`) + links (16/22.4 white, gap 14, column gap 16 between label and list). Hover: link colour → **`#6c7179`** (white fades to muted; measured via pixel diff + preset CSS var `--framer-link-hover-text-color`).
3. **Credit row** (padding-top 12, `justify-content:space-between`): `©Irise Studio 2026. All rights reserved.` muted · right: "Made in **Framer**" / "Created by **Rosyid Qoim**" (muted + white, gap 40). Mobile adds a 1 px hairline above it.

### 4.14 Icons

Phosphor icon set (viewBox 256, `weight="regular"`, drawn as inline SVG, 24 px default / 18 px inside Plus / 20 px in arrows): List, X, Plus, ArrowRight, ArrowUpRight, Quotes, Medal, CheckCircle, RocketLaunch, Smiley, EnvelopeSimple, YoutubeLogo, XLogo. Replace with inline SVG `stroke:currentColor` or the same Phosphor paths.

---

## 5. Motion — every animation, with touch and reduced-motion equivalents

**Facts**: the saved file's `__framer__appearAnimationsContent` contains exactly **four appear effects, all in the hero**; everything else is JS-driven hover variants and one scroll-linked transform, all read from the running page with an rAF sampler. Hover curves fit a **critically damped spring, duration ≈ 0.4–0.45 s** (50 % at ~105 ms, 90 % at ~270 ms, 99 % at ~500 ms) = **`0.65 s cubic-bezier(.22,1,.36,1)`** in CSS. The hero tweens use `cubic-bezier(.44,0,.56,1)` (Framer's "ease"). The Framer reduced-motion hook is **not** active in this build, so the original ignores `prefers-reduced-motion`; ours must not.

| # | Effect | Original (exact) | Mobile / touch equivalent | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| M1 | **Hero appear** | image: opacity .001→1, `scale 1.1→1`, `y 50→0`, **1 s**, delay 0, ease `[.44,0,.56,1]` · status chip + H1: opacity .001→1, `y 20→0`, **.6 s**, delay **.2 s** · paragraph+button: same, delay **.4 s** | identical (opacity + transform only, cheap) | all visible immediately, no transform |
| M2 | **Hero scroll zoom (the only scroll-linked effect)** | image transform = `translateX(-50%) translateY(0.3·scrollY px) scale(1 + k·scrollY)`; **k = 0.000154 desktop, 0.000112 mobile, 0.000107 tablet** (≈ +14 % at 900 px). Sampled at scrollY 0 / 450 / 900 / 1100: scale 1 / 1.069 / 1.139 / 1.170, translateY 0 / 135 / 270 / 330 | keep (same numbers; hero image box is `overflow:hidden` and fades into the page), but update through `requestAnimationFrame` with a passive scroll listener and stop after `scrollY > 1.3·innerHeight`; optionally `animation-timeline:scroll(root)` where supported | no zoom, no translate (static image) |
| M3 | **Status dot pulse** (infinite) | 10 px solid dot + a ring that scales **1 → 3** (to 30 px) while opacity **~.9 → 0** over ~**1.1 s** ease-out, then ~1.1 s rest (≈ 2.2 s cycle) | same, pure CSS | static dot, ring fixed at scale 2 / opacity .25 |
| M4 | **Primary button hover** | bg `#111 → #7430f7` over ~.45 s settle ease; label stays white | `@media (hover:hover)` guard; `:active` shows the accent colour; min-height 48 | keep (colour only) |
| M5 | **Inverse / secondary hover** | white → `#d1d3d6` (inverse); secondary border `transparent → #d1d3d6` (inferred) | same via `:active` | keep |
| M6 | **Nav link sibling-dim** | hovered link 1, the other links `opacity .3`; logo hover → `.3` | not applicable (burger); menu rows get `:active{opacity:.5}` | keep (opacity only) |
| M7 | **Work-card zoom-out** | image `scale ≈1.06 → 1` (588 → 554 px wide in a 554 card), settle ease ~.65 s; reverses on leave | no hover on touch → render the card at **scale 1.06** and **play the settle once when the card crosses the viewport centre** (`IntersectionObserver`, threshold .5, one-shot, ~.9 s); `:active` = scale .98 on the whole card | scale 1, no animation |
| M8 | **Awwwards card peek** | preview image slides **up 113 px** (top 194 → 81), dark overlay `0 → 1` (.3 black), arrow chip `opacity 0 → 1` and moves up 4 px; same settle ease | **Luzia's own mobile variant is static**: image at rest position, arrow chip **always visible**, whole card is the link; keep that (no hover reveal) | static final (chip visible) |
| M9 | **Stats deck fan-out** | rest = three chips stacked 15 px apart, scale 1 / .95 / .9, soft shadows; **hover** (desktop only) = all scale 1, spread to ±75 px (front chip −61, back +59 in the measured box), shadows of the two upper chips fade to 0, and the green pill goes `scale .8 → 1`, `opacity 0 → 1`, `y −20`, growing 200×34 → 250×42 | below 1200 Luzia ships the **expanded** layout statically (tablet/mobile screenshots). Do the same, and also fan the deck **once when it scrolls into view** on desktop so non-hover users see it | expanded layout, no motion |
| M10 | **Dark quote card** | static; only its 40 px diagonal shadow | static | static |
| M11 | **Shell-card hover (services)** | title **text-roll**: `Branding Design` slides up **26 px** and `Start a Project` rolls in (two stacked 26 px lines in an `overflow:hidden` wrapper); the category icon rolls up out of the chip and the **↗ arrow rotates 45° → 0** into it (icon column shifts 36 px); title bar gains a soft shadow; **`Details` panel opacity 1 → 0.3** | Luzia's mobile cards are **static** with the ↗ arrow already shown and no dimming — keep; make the whole card (or the arrow chip, 40 px visual / 48 px hit) the tap target | no roll, no dim; arrow chip shown |
| M12 | **FAQ toggle** | row height 58 → open with a stiff spring (~.2 s, ~1 % overshoot), "+" → "×" by **rotate 45°**, items independent, item 1 open by default | same; keep tap area = full row (min 56) | height snaps (no animation), icon swaps |
| M13 | **Burger menu** | header height **58 → 358 px instantly**, hamburger ⇄ X swap, no scrim | use it, but animate: `grid-template-rows 0fr→1fr` **.3 s `cubic-bezier(.2,.8,.2,1)`**, rows fade in with 40 ms stagger, `inert` on page behind, close on link tap / ESC | instant height, no stagger |
| M14 | **Footer link hover** | colour white → `#6c7179`, settle ease | `:active` same | keep |
| M15 | **CTA flower spin** | canvas wrapper `rotate(−18°/s)` linear, infinite (-105° → -171° in 3.7 s) | same (CSS `animation:spin 20s linear infinite reverse`); pause when off-screen (`animation-play-state` toggled by `IntersectionObserver`) | no rotation |

### 5.1 Implementation snippets

```css
@keyframes lz-in{from{opacity:.001;translate:0 var(--dy,20px);scale:var(--s0,1)}to{opacity:1;translate:0 0;scale:1}}
.hero__img{--dy:50px;--s0:1.1;animation:lz-in 1s cubic-bezier(.44,0,.56,1) both}         /* uses individual props so the −50% centring is untouched */
.hero__tag,.hero__h1{animation:lz-in .6s cubic-bezier(.44,0,.56,1) .2s both}
.hero__desc{animation:lz-in .6s cubic-bezier(.44,0,.56,1) .4s both}
@keyframes lz-pulse{0%{transform:scale(1);opacity:.9}50%{transform:scale(3);opacity:0}100%{transform:scale(3);opacity:0}}
.dot::after{content:"";position:absolute;inset:0;border-radius:50%;background:currentColor;animation:lz-pulse 2.2s cubic-bezier(.22,1,.36,1) infinite}
@keyframes lz-spin{to{transform:rotate(-360deg)}}  .flower{animation:lz-spin 20s linear infinite}
/* text-roll */
.roll{height:26px;overflow:hidden}.roll>span{display:block;height:26px;transition:transform var(--t-hover) var(--ease-settle)}
@media (hover:hover){.shell:hover .roll>span{transform:translateY(-26px)} .shell:hover .shell__body{opacity:.3}}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
  .hero__img,.hero__tag,.hero__h1,.hero__desc{opacity:1!important;translate:none!important;scale:1!important}
}
```
```js
// hero scroll zoom (M2) — rAF, passive, stops past the hero
const img=document.querySelector('.hero__img'),k=innerWidth>=1200?.000154:innerWidth>=810?.000107:.000112;let t=0;
addEventListener('scroll',()=>{if(t)return;t=requestAnimationFrame(()=>{t=0;const y=Math.min(scrollY,innerHeight*1.3);
  img.style.transform=`translate(-50%,${y*.3}px) scale(${1+y*k})`})},{passive:true});
```

---

## 6. The 8 design moves a rebuild must keep

1. **A transparent cut-out portrait as the whole hero**, centred, with a **small (40/44) headline overlapping its torso** and the paragraph + button on the opposite bottom corner; the figure's lower third dissolves through *backdrop blur 20 px + white gradient*, and the figure **zooms slowly while you scroll** (`translateY .3×`, scale +14 % per 900 px).
2. **One typeface, two weights, tight tracking** (400/500, −0.03 em, 1.1–1.4 leading), sentence case only — hierarchy comes from size and **two-tone statements** (muted first clause, ink second), not from weight or caps.
3. **"Shell + panel" nesting with a one-step radius ladder** (40 → 24 → 20 → 16 → 12): grey shell with 6 px padding holds white panels; everything concentric, flat, border-less.
4. **Diagonal, many-layered shadows used sparingly** — only on the black primary button, the black chip and the *one* dark card / the *one* purple card; all other surfaces are flat grey on white.
5. **Black as the action colour, a single vivid accent as the reward**: buttons are `#111` and turn accent on hover; exactly one card per view is saturated (purple in a black bezel).
6. **Alternating white ↔ black blocks with 40 px-rounded edges and film grain on the black** (grain only darkens: `mix-blend-mode:darken`), separated by **200 px of empty canvas**; no dividers.
7. **A tiny, repeated hover vocabulary**: zoom-out, text-roll, rotating arrow, deck fan-out, sibling-dim, colour swap, pulse dot, slow spinning blob — every one has a *static revealed state* on mobile, never a hidden affordance.
8. **12 px gutters and fixed aspect cards**: 554:420 image cards, 368×450 proof cards, 365×458 shell cards; the layout is a rhythm of identical-gap tiles, and the page is almost entirely cards — no text columns longer than two sentences.

---

## 7. Mapping to the Lepa Svaki Dan page

Data source: `v2/_shared/content/content.json` (210 services in 5 tabs / 31 groups; 5 verticals; 4 favorites; 4 gifts; 4 offers; 4 testimonials; 21 blog posts; 2 locations; hours `Pon — Sub · 9—21h`; brand tokens `v2/_shared/brand/tokens/brand.css`; images `v2/_shared/img/*`). **Do not invent** ratings, award badges, client logos, per-location hours or map links that are not in the data.

| Lepa section | Carried by (Luzia component) | Desktop | Mobile |
|---|---|---|---|
| **Nav** | Flat white bar §4.2 + Primary "Zakaži" | 68 px, logo image (`logo-transparent`) left, **6 links** centred (Tretmani, O nama, Lokacije, Cenovnik, Posebna ponuda, Blog; padding `6 12`, 15/500; sibling-dim on hover), Primary btn `nav.cta` (WhatsApp) right; solid white, fixed. | Burger at ≤ 1023: 58 px bar + animated panel (§5 M13): links 16/500, `Pozovi` / `WhatsApp` as the 3 outlined 40 px icon buttons, full-width Primary. **Plus** the sibling-spec sticky bottom bar (Piši nam · Pogledaj cene · Gde smo · Pozovi), 56 px + safe-area. |
| **Hero** | Cut-out hero §1.3 + status chip + two-tone H1 + paragraph column | Our cut-out `hero-cutout-1300/900/600.webp` is **portrait (0.677)**, not Luzia's landscape (1.26): keep the *height rule* `top:100; bottom:-86` and let width = height × .677 (≈ 600 px at 900). Chip = `hero.claim` "2 lokacije, 1 filozofija" (or computed "Otvoreno do 21h" from `Pon — Sub · 9—21h`, never a fake "slobodnih termina"). H1 (40/44) = typed phrases "Budi **smirena, srećna, lepa, svaki dan.**" (`hero.headline`), `svaki dan.` as the second tone. Right column: `hero.sub`, Primary "Pogledaj tretmane" + Secondary "Cenovnik usluga" (`hero.ctas`), search pill (`hero.searchPlaceholder`, 48 px, radius 16, `--surface`). **Legibility**: the navy blazer is dark under a dark H1 — raise the fade to `rgba(255,255,255,.75)` over the bottom 45 % and move H1 over the lighter hair / left margin, or shift the figure to `left:58 %`. | Stacked: chip → H1 32/35 → sub → buttons → search → image block 460 (cut-out ~311 px wide centred, or scaled to 390 and cropped at the waist) with the same bottom fade. Parallax kept. Hero is **not** 100 vh on phones. |
| **O nama + stats** | Social-proof trio §4.8 | 3 cards: **[light card]** = `about` (eyebrow, title "Lepota nije trenutak, već navika.", first paragraph, `about.image` peeking 194 px from the bottom; hover = slides up + ↗ chip "Više o nama") · **[dark quote card]** = founder: `quote.text` or "Lepota nije usluga. To je odnos koji se gradi godinama." 24/31 + Dr Tamara Vujačić · Osnivač, `founder-portrait` as the 36 px avatar (or enlarged to 72) · **[stats deck]** = 3 chips "15+ godina prakse / 2 koncepta u Beogradu / 1.000+ klijenata godišnje" (icons: Check / Rocket / Smiley → brand glyphs) + top pill = hours "Pon — Sub · 9—21h" (lila, **not** the green/white pill). | Three stacked 350×450 cards, deck **already expanded**, preview image visible with the ↗ chip, no hover. |
| **Tretmani (5 verticals)** | Work card §4.6 + Secondary "Svi tretmani →" | 2×2 grid of 554×420 (r40) + the 5th card **spanning both columns** (1120×420, `grid-column:1/-1`) — or 3+2. Title = `verticals[].title`; outlined tags = `statedCount` ("18 tretmana") + `locationLabel` ("Novi Beograd") — **note**: `statedCount` ≠ real count (58/36/62/26 in the price list); prefer `cenovnikServiceCount` ("58 usluga"). Whole card links to `#usluge` and selects tab `cenovnikTab`. Hover = image zoom-out + `blur` meta stays. | 350×265 (r24) stacked, tags always visible, settle animation on scroll-in (M7). Header row: H2 28 + 48×48 icon button. |
| **Favoriti (4)** | Shell card §4.7 (one prominent) | 2×2 grid of shell cards (≈ 554 wide, no thumbnail strip) — bar: name (data is UPPERCASE, e.g. CINDERELLA GLOW: keep as data, set 18 px / `letter-spacing:0` so product names like PROFHILO aren't mangled) + icon chip (↗); body: `description`, price **EUR 32 px / RSD muted** (`77€ / 9.000 rsd` → "77 €" + "9.000 rsd"), `tagLabel` "Favorit" as outlined chip, Primary-lite "Pogledaj u cenovniku" (opens that row). First favourite = **prominent** (accent panels in `--charcoal-deep` bezel). Hover = text-roll "Pogledaj u cenovniku" + arrow turn; dim only the description (price stays 100 %). | Horizontal `scroll-snap-x` row, card 84 % wide, or single column 350 wide; arrow chip always visible; prominent card is the first. |
| **Cenovnik** | FAQ shell §4.10 (group accordions) + Secondary/Filled tags as tab pills + shell bar idiom for group headers | see §7.1 | see §7.1 |
| **Pokloni (4)** | Shell card, compact (no thumbs) | 4-up row of 271×~300 shell cards (gap 12; (1120 − 3×12)/4): bar = voucher name, body = `description`, price, `tagLabel` "Za poklon", arrow chip → pay modal / WhatsApp. One card prominent. | 2×2 at tablet; mobile `scroll-snap` row (84 %) or 1 col. |
| **Lokacije ×2** | Work card §4.6 (2-col grid = our 2 locations) | Two 554×420 r40 cards with `location-novi-beograd` / `location-waterfront` images + `tintGradient`; overlay (blur meta) holds concept + area (24/31 white), address (16), outlined chips **[Pozovi] [WhatsApp]** (`tel:` / `wa.me`) and a small dot (lila = Beauty, `--bw` green = Wellbeing). Shared hours line under the pair ("Pon — Sub · 9—21h"). No map button (no URLs in data). | Cards become **auto-height** (image 350×200 on top, white panel below with address + two 48 px tel/WA buttons) because address + phones don't fit in 350×265. |
| **Utisci (4)** | Dark quote card §4.8 | A row of 368×450 quote cards (`scroll-snap-x`, 3 visible + peek): the **centred/active card is dark** with `--shadow-card`, the others are surface-light with the same layout; prev/next 48 px circle buttons + 4 dots; quote 24/31.2 · 400, author `Jovana M.` + tag `Klijent · 2 godine` in the name/role slot. Auto-rotate per `testimonials.autoRotateMs`, paused on hover / out of view. | One 350×450 card per view, swipe snap, no auto-rotate on touch, quote 20/26, dots with 44 px hit area. |
| **Posebna ponuda (3 of 4 shown)** | Services trio §4.7, **prominent in the middle** | 3 columns [light][**prominent**][light]: bar = `tag` ("Sezonski paket") + title; body = `includes`, `oldPrice` struck-through muted, price EUR big / RSD muted, CTA `offers[].cta` ("Zakaži ovaj paket"); link "Svi paketi ›" as Secondary pill in the section headline row. | Stacked 350 wide; prominent first; CTA full-width 48 px. |
| **Blog teaser** | Work card §4.6 (3-up variant) | 3 cards 365×~277 (r24) — image, category chip (outlined), title 20/26 white in the blur meta; link "Svi tekstovi na blogu ›" (Secondary). Hover = zoom-out. | 3 stacked 350×265 (M7 on scroll-in). |
| **CTA** | Dark footer CTA §4.13 | Black (`--charcoal-deep`) 40-radius-top block with grain; **spinning brand mark** (swash / BC monogram SVG, 221 px, 20 s per turn) replaces the WebGL flower; two-tone H2 from `cta.home.headline`: muted "Vaše uživanje i briga o lepoti" + white "počinju ovde."; buttons: Inverse "+381 64 8239 439" (WhatsApp) + Outline "Piši na WhatsApp ›". | Same, H2 32/35, buttons full-width 48 px. |
| **Footer** | Footer columns §4.13 | 3 link columns (Kontakt, Pratite nas, Lokacije) centred, gap 80, muted labels + white links (hover → muted); credit row: © line left, **"Pripremio ECHOSYSTEM-MOTHER AGENCY"** (`site.credit`) right. | Columns 2 + 1, 48 px link rows, hairline above credit, back-to-top button. |

### 7.1 Cenovnik — tabs + groups + 210 rows that must stay fully usable on a phone

Luzia has no price list, so we compose it from three Luzia parts: **FAQ shell + independent accordion rows** (groups), **Secondary / Filled-tag pills** (tabs), **FAQ chip + shadow** (section kicker). Data (verified in `content.json`): tabs **Tretmani lica 58 rows / 8 groups · Tretmani tela 36 / 6 · Estetske procedure 62 / 8 (largest group 17 rows) · Naši protokoli 26 / 4 · Laserska epilacija 28 / 5** = 210 rows / 31 groups; 47 `highlight:true`, 3 `onRequest`, 3 with `duration`, 7 with `blogPost`.

Structure (`#usluge`): H2 two-tone ("Cenovnik" muted + "…") · chips (`price.validChip` "Cenovnik važi od 15.03.2026.", `price.payChip` "Plaćanje u dinarima") · search pill · **tab bar** · group list inside the **grey shell** (`--surface`, radius 24, padding `24 8 8`) with the black FAQ-style chip as the shell header ("Cenovnik" / count) · footnote.

**Tabs**
- Pills = Luzia buttons at 48 px (mobile 44): inactive = **Secondary** (`--surface`, ink-soft text), **active = Primary** (`--ink`, white text, `--shadow-btn` removed on mobile for flat look); hover (desktop) = the accent swap. Row `display:flex; gap:8px`.
- Desktop: all 5 visible, centred, count as muted superscript.
- Mobile: **one horizontally scrollable row** (`overflow-x:auto; scroll-snap-type:x proximity; scrollbar-width:none`) with edge-fade mask, active tab `scrollIntoView({inline:'center'})`; the bar is `position:sticky; top:58px` (just under the 58 px header) with canvas bg — so a long tab never loses its tabs. `role="tablist"`, arrow keys, deep links `#usluge/lice`. Panels all in the DOM, toggled with `hidden` (no fetch).

**Groups = FAQ rows** (independent toggles; first group of each tab open; "Otvori sve grupe" toolbar for tabs with ≥ 8 groups)
- Closed row: `background:#fff; border-radius:20px; padding:16px; min-height:58–64px`; left a 32 px count badge ("17"), title 20/26 · 500 (18/23.4 on mobile, wraps), right Phosphor **Plus** that rotates 45° → × (M12). Gap between rows **8 px** inside the shell.
- Open: `grid-template-rows:0fr→1fr`, `.28s cubic-bezier(.2,.9,.3,1.04)`; reduced-motion instant. `scroll-margin-top` = header + tab bar (≈ 130 px).

**Service row (the unit that must work at 360–390 px)** — inside the open group, white panel continues, rows separated by **1 px `--lila-200`** hairlines (the one deliberate deviation from Luzia's "no rules": 210 rows need scan lines):
```
┌ name (500 16/21, wraps ≤3 lines)                          51 €  (600 16, tabular-nums) ┐
│ description (400 14/19, muted)                         6.000 rsd (13/18 muted)         │
│ [★ highlight tag]  [⏱ 45 min]  [Na upit]  [● lokacija]                                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
`display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:14px 16px;`; **EUR on top, RSD below** (`51€ / 6.000 rsd` split), ranges `min–max`, `onRequest` → "Na upit" outlined tag, **highlight** = Filled tag in `--lila-100` with `--lila-700` text, location = 10 px dot (lila / `--bw` / half-half) + **one legend line** instead of a badge per row; services with `blogPost` get a 44 px-hit "Pročitaj više ›". Laser tab keeps the same row (name | price) — no horizontal scroll anywhere. Muted description colour `--charcoal #5A5758` (7.2:1) — **not** Luzia's `#6c7179` on `#f7f7f7` (4.6:1, borderline).

**Search** (`pricing.searchPlaceholder`, `search.*` rules in data): 48 px pill, 16 px font (no iOS zoom), clear button, `aria-live="polite"` count; typing opens matching groups in the active tab and shows "n rezultata u drugim kategorijama" chips that switch tabs.
**Phone checklist**: no hover dependence; all tap targets ≥ 44; sticky tab bar ≤ 56 px; price column never wraps under 360 px (name column absorbs); bottom action bar never covers the last row (`padding-bottom` + `env(safe-area-inset-bottom)`); payment modal (`payment.modal`) = bottom sheet with `inert` background + ESC.

---

## 8. Gotchas, assets and build notes

- **One DOM, not three**: the saved HTML contains the nav, cards, buttons and footer rendered 3× (`ssr-variant` wrappers + `hidden-*` classes). Do not port that; use `@media`. Delete `#__framer-badge-container` ("Made in Framer" badge) and all `framer-*` classes.
- **100vh hero** (`min-height:100svh` on desktop only). Tall-window screenshots will show a giant face — not a bug.
- **Hover = JS in Framer**, so the saved file has no `:hover` rules; every hover above was measured on the live page. In headless Chrome the animations only advance when frames are produced (I used an rAF pump / screenshots) — irrelevant for real browsers.
- **Fonts**: Instrument Sans is on Google Fonts (400/500, Latin + Latin-ext covers č ć š đ ž). The brand pack ships **Galano Grotesque Regular + Bold only** (Light / Medium missing; the brandbook specifies Light/Regular/Medium). Luzia's whole hierarchy rides on a 400↔500 weight difference, so with Galano Regular for both the two-weight contrast disappears — compensate with size and the two-tone colour device, or use Instrument Sans for display + Galano for body until the designer supplies Medium. Keep tracking at **−0.02 em** for Galano (it is wider than Instrument Sans) and verify the diacritics in the supplied woff2 before shipping.
- **Cut-out image**: hero source is a 2400×1904 webp with alpha; ours: ship `hero-cutout-600/900/1300.webp` with `srcset`, `sizes="(min-width:1200px) 600px, (min-width:810px) 440px, 311px"`, `fetchpriority="high"`, explicit width/height (900×1330 etc.). Lazy-load every other image; first work-card row eager.
- **Noise**: use the SVG tile (§4.12), not a bitmap; check it on a real phone (`mix-blend-mode` + big blurred layers are the two heaviest things on this page). `backdrop-filter:blur(20px)` appears on the hero fade (400 px tall) and on each work-card meta (102 px) — on low-end Android fall back to a plain `linear-gradient(transparent, rgba(17,17,17,.55))` under the text.
- **Flower**: the original is a WebGL canvas component; we swap it for an SVG/PNG mark (spin 20 s) — do not load WebGL for a decoration.
- **Accessibility fixes vs template**: no focus rings, no skip link, no `prefers-reduced-motion`, `div` link overlays, two contrast failures (muted text on the dark section 3.8:1, white on `#00c047` 2.4:1), hover-only reveals (fan-out, awards peek) — all addressed in §3–§5. The two-tone H2 is one heading with spans, so screen readers read it as a sentence.
- **Reduced motion global rule** is in §5.1; also set `html{scroll-behavior:smooth}` only when motion is allowed.
- **What to extend (not in Luzia)**: tabs, search, carousels, sticky bottom action bar, price rows, location cards — all built from the same tokens (12 px gutters, 40→24→20→16→12 radii, flat grey shells, black primary, one accent moment per view).

---

Pripremio ECHOSYSTEM-MOTHER AGENCY · 2026-10-07
