# SPEC A — "Lumine" (Framer template) → manner rebuild in plain HTML/CSS/JS

`ECHOSYSTEM-MOTHER AGENCY` · design-manner spec · 2026-10-07

- Template: **Lumine — Luxury Nail, Lash & Brow Studio** (Framer, published Jul 9 2026)
- Live demo: **https://pretty-delivers-191144.framer.app/** (canonical + og:url, reachable, HTTP 200)
- Source file analysed: `~/Desktop/Download/pretty-delivers-191144_framer_app.html` (SSR markup + minified CSS) + the live site's published modules (nav / button / arrow components, appear-animation JSON) + computed styles read from the live page at 1440 / 1024 / 390 px.
- Screenshots (all in `v2/_specs/a/`, I looked at every one): `lumine_live_d_vp.png` (1440×900 hero), `lumine_live_d_2300.png` (full desktop page, final state), `lumine_live_t_vp.png` (810 tablet), `lumine_live_m_hero_final.jpg` (390 hero, final state), `lumine_live_m_vp.png` / `lumine_live_m_3200.png` (390, mid-animation, ignore blank gaps), `lumine_live_m_menu_open.jpg`, `lumine_live_m_owner_price.jpg`. `lumine_live_d_full.png` / `lumine_live_m_full.png` are 6000/8000 px tall windows: the page root is `min-height:100vh` with a `flex-grow:1` spacer that pins the final hours+CTA pair to the bottom of the window, so tall windows show a blank band above it (the real page ends at 2059 px desktop / 2901 px mobile). The blank band right after the hero in `lumine_live_m_3200.png` does **not** exist in the live 390×844 render (featured starts at y = 513 directly under the hero) — headless artifact, ignore.
- Measurement note: Framer artboards are **fixed-width frames** (1200 / 810 / 390). Between breakpoints the live site does not flow, it just centres the frame. Our rebuild must be **fluid** using the numbers below as the anchor values at 1440 / 810–1024 / 390.
- Not extracted / unverified: hover colour of the nav CTA (inline style flips `#ccc6ea → #f9f9f9` on synthetic hover, treated as "lightens"); the hero primary button hover was read from the component source, not from a rendered hover.

---

## 0. TL;DR of the template

One-page, **bento** layout on a near-white canvas (`#f9f9f9`). A **full-bleed lavender-gradient hero** (only the bottom corners rounded, 20 px) holds a **transparent-PNG portrait cut-out** bottom-anchored in the centre, a **147 px ultralight white ALL-CAPS ghost word** across its lower third that sits *in front of* the portrait, and **three pale "glass" tiles** (text + button, text, rating). Below: a 4-up trust strip, a 2×2 photo-tile grid + tall portrait tile, a 3-up row (plum silk price card / lilac stat / bare quote) and a final pair (pale hours card + deep-navy CTA card). Everything is a rounded-20 flat tile, **no shadows, no borders, no dividers**, one accent colour (`#9483d2`), one deep counter-tile, two typefaces (Inter display light + Manrope body). Motion is almost nil: a 1.3 s staggered hero entrance, opacity hovers, a rotating arrow, a slide-in mobile menu. There is **no marquee, no counter, no accordion, no scroll-linked effect** in this template (see §5 for how we extend it).

---

## 1. Structure, breakpoints, collapse behaviour

### 1.1 Breakpoints (from the media queries in the CSS + `__framer__breakpoints` JSON)

| Name | Query | Artboard | Root font-size |
|---|---|---|---|
| Desktop | `min-width:1200px` | content frame **1200 px**, centred; hero background is full-bleed | 16 px (`rem` presets measured at ~15 px) |
| Tablet | `810px–1199.98px` | content frame **810 px**, centred | `93.75%` → 15 px |
| Mobile | `max-width:809.98px` | **390 px**, effectively 100 % width with 20 px gutters | `93.75%` → 15 px |

Nav component switches to its mobile layout by a JS `ResizeObserver` at **nav width ≤ 768 px** (so the pill nav is still used at 810).
Recommended rebuild breakpoints: `1200 / 810` as above **plus** a fluid middle (use `clamp()` and `min()`; see §2). Our nav has 6 links, so switch to the burger at **≤ 1023 px** instead of 768.

### 1.2 Section order, top → bottom (desktop 1440 viewport; measured heights)

| # | Section (Framer name) | Desktop | Tablet (810) | Mobile (390) |
|---|---|---|---|---|
| 0 | **Nav** (`Desctop`/`Tablet`/`Phone`) | absolute overlay on hero, 100 px tall (20 px pad, 44 px row). Logo left, pill link-group centre, "Book Now" pill right | same, 100 px | **72 px opaque white** bar, blur(20px): logo (20 px) left; CTA pill + burger right |
| 1 | **hero section** | full-bleed, **919 px**, `linear-gradient(139deg,#cac2ed,#e5e5e7)`, radius `0 0 20 20` | 557 px | 513 px |
| 2 | **highlights** (trust strip) | row, h 102 (pad-top 20): 3× [66 px circle icon + title + sub] + 1 lilac "FAST & ON TIME" chip (290×78) | same, icons 50 px, gap 10 px | **hidden** |
| 3 | **featured** | h 509 (pad-top 20). Grid 66 % (766 px) = 2×2 photo tiles 370×234 (gap 21 row / 25 col) **+** tall portrait tile 32 % (371×489) | h 399: grid 508 px (tiles 245×181, gap 18), portrait 246×379 | column, gap 20, pad 20: 4 tiles **350×175**, portrait **350×429** |
| 4 | **3 blocks** | h 250 (pad-top 20): 3 tiles 32 % each (371×230, space-between ≈ 23.5 px): plum price card · lilac "10 years" tile · bare quote | h 208, tiles 246×188 | column, gap 20: each **350×187** (container 600) |
| 5 | **hours + glow** | h 280 (pad 20 20 30): two tiles 49 % (568×229): pale hours card · navy CTA card | h 259–265, tiles 462/472×209 | column, gap 27: hours 350×243, CTA 350×214 (container 539) |
| – | footer | **none** — page ends on the pair above (+ Framer badge, ignore) | | |

Total height: 2059 px desktop (1440), 1525 px at 1024, 2901 px mobile.

### 1.3 Hero anatomy (the signature)

Hero is `position:relative`, `display:flex; justify-content:center; gap:15px`. All children are **absolutely positioned** so layers can overlap:

| Layer | z | Desktop (1440 wide, hero 919 tall) | Tablet 810 (hero 557) | Mobile 390 (hero 513) |
|---|---|---|---|---|
| Portrait PNG (`hero model`) | 1 | 775×889, `bottom:0; left:calc(48.6667% − 387.5px)` (centre sits ~19 px left of true centre), `object-fit:cover; object-position:center`; source PNG 775×1050 transparent | 446×511, `left:calc(50% − 223px)` | 381×471, `left:calc(50% − 190.5px)` |
| Text row (headline + sub, left col 36 % = 417 px; "Love it or we fix it" tile right) | auto (children z1) | `top:253px`, width 1200, pad `0 20`, `align-items:flex-end` → text col 253–491, tile 310–491 | `top:128px`, tile 180×129 | **hidden** (headline, sub and the first glass tile do not exist on mobile) |
| Bottom tiles row (book tile + rating tile) | auto | `top:518px`, gap 23: **book** 232×181 (20 %) at left; **rating** 250×181 right-aligned | `top:299px`, tiles 180×129 | `bottom:25px; gap:20px; width:100%`: two tiles `flex:1` = 165×116 |
| Ghost word "NAILS & LASHES" (`h1`) | **2** (above portrait) | `bottom:66px`, box 1200×116, Inter 200 / **147 px / line-height 107 px** / uppercase / `#fff` / centred (text ≈ 1150 px wide ≈ 7.8 em) | `bottom:8px`, 91 px | **`top:86px`** (bottom:377px), 45 px / 50 px, spans edge to edge |

Nav (z 1000 / container z 3) overlays the hero; hero starts at y = 0 on all breakpoints (on mobile the 72 px opaque nav simply covers the top 72 px).

Rule behind the geometry: right-hand column has two tiles whose bottoms align with the left column — row 1 bottom edge y = 491 (headline block and "love it" tile), row 2 y = 518–699 (book tile and rating tile). 27 px between rows, 20 px inner gutters.

### 1.4 How grids collapse

- **featured**: `display:grid; grid-template-columns:repeat(2,minmax(50px,1fr)); grid-auto-rows:minmax(0,1fr); gap:21px 25px` → on mobile `repeat(1,…)` gap 20, fixed tile height 175. The portrait tile is a sibling flex column (32 % wide) → on mobile `width:100%; height:429px` after the grid.
- **3 blocks / hours+glow / highlights**: `flex` rows with `justify-content:space-between`; children `flex:none; width:32 %|49 %` (or `flex:1 0 0` for highlights) → `flex-direction:column; gap:20–27px; width:100%` on mobile.
- Order on tablet/mobile is explicit (`order:0` hero, `1` highlights, `2` featured, `3` 3 blocks, `1002` hours/glow).
- Hero mobile = **content diet**: photo + ghost word + 2 chips only. The 2nd/3rd hero tile, headline, sub and the whole trust strip are dropped, not stacked.

---

## 2. Typography, spacing, radii, shadows, borders

### 2.1 Families

- **Display / labels: Inter** (weights used 200, 300, 500, 600, 700) with OpenType features `"blwf","cv03","cv04","cv09","cv11"` on headings (cv11 = single-storey *a*, cv03/cv04 = open 6/9, cv09 = flat-top 3) and `"cv01","cv09","ss03"` on the 147 px / price numerals.
- **Body / UI numerals: Manrope** (400, 500; 700 bold slot) with `"ss03","cv01","cv09","cv05"`.
- `letter-spacing` is **normal (0)** everywhere except the logo (`-0.5px`). No tracking on the caps labels. `text-wrap:balance` on every heading and tile text.
- Colour of all text: ink `#4a4745`, muted `#807f7e`; white only on dark tiles / ghost word.

### 2.2 Scale (computed on the live page; `px / weight / line-height`)

| Role | Font | Desktop | Tablet (≈15 px root) | Mobile |
|---|---|---|---|---|
| **Ghost word** (h1, uppercase, white) | Inter | **147 / 200 / 107** | 91 / 200 / 107 | 45 / 200 / 50 |
| **Display headline** (h2 "Luxury Nail Care") and **rating numeral** "4.9" (accent) | Inter | **72 / 300 / 81** | 37 / 300 / 37 | 35 / 300 / 32 (headline hidden, numeral only) |
| **Tile title / h2** ("Book in 60 seconds", "Love it or we fix it", "10 years in business", quote text, "Ready to glow?") | Manrope | **32 / 500 / 35** | 23 / 500 / 27 | 21 / 500 / 24 |
| **Price numeral** ("$35") | Inter | 58.2 / 600 / 58.2 (`3.88 rem`) | 46.5 / 600 | 41.4 / 600 |
| **Tile label caps** (card names, role, "FAST & ON TIME") | Inter, uppercase | **20 / 500 / 20** | 18 / 500 / 18 | 17 / 500 / 20 |
| **Small title** (trust-strip title, "Linh Tran", "Hours") | Inter | 18 / 700 / 20 | 15 / 700 / 18 | 14 / 700 / 16 |
| **Body** (sub, tile sub, hours rows, quote author) | Manrope | **16 / 400 / 23** | 14 / 400 / 23 | 13 / 400 / 18 |
| **Micro** (trust-strip sub) | Manrope | 12 / 500 / 13 | 11 / 500 / 12 | 11 (hidden) |
| **Chip / price tag text** | Manrope | 16 / 500 / 20.8 | 12.45 / 500 / 16.2 | 10.05 / 500 / 13 |
| **Nav link** | Inter | 14 / 500 / 14 | same | 14 / 500 |
| **Nav / hero button label** | Inter 14/600 (nav) · Manrope 16/400 (hero button; 14 tablet, 13 mobile) | | | |
| **Logo** | Inter | 24 / 600, ls −0.5 | 24 | 20 |

Rebuild as tokens with `clamp()`: e.g. ghost `font-size:min(147px,11.5vw)` (text is ≈ 7.82 em wide so it always fits), display `clamp(35px,5vw,72px)`, tile title `clamp(21px,2.2vw,32px)`, body `clamp(13px,1.1vw,16px)`.

### 2.3 Spacing system

Not a strict scale, one unit rules: **20 px** (tile radius, section side/top padding, gutters). Other numbers seen: 2, 8, 9, 10, 13, 16, 23, 25, 27, 30, 33, 40, 50, 66.

- Section padding: `20px 20px 0` (top 20, sides 20, no bottom) for highlights / featured / 3 blocks; hours+glow `20 20 30`. Vertical rhythm between bento rows = the same 20 px top padding. No big empty bands anywhere: the whole page below the hero is one continuous tile mosaic with 20 px seams.
- Gutter between tiles: 25 / 21 (featured grid), ≈ 23.5 (3-up `space-between`), 23 (hero bottom row), 20 (mobile), 27 (mobile footer pair), 18 (tablet grid).
- Container: 1200 px frame, 20 px inner padding → **1160 px content**; tablet 810 → 770; mobile 390 → 350.
- Tile inner padding: 20 px (label offsets `top:20; left:20`), price row `bottom:33px` (22 mobile), "10 years" text `bottom:30px; left:20px`.
- Gaps inside tiles: 13 px (title ↔ button/sub in hero glass tiles), 30 px (headline ↔ sub), 16 px (icon circle ↔ text in trust strip), 8 px (title ↔ sub), 16 px (hours rows), 20 px (hours icon ↔ title).

### 2.4 Radii · shadows · borders

- **Radius 20 px** on: every tile/card, photo, hero bottom corners (`0 0 20px 20px`), pills (nav pill, links, buttons 35 px tall → fully rounded), chips. **10 px** on the 50×50 icon tiles of the footer pair. **50 % / 999 px** on circle buttons and trust-strip icon circles.
- **Shadows: none anywhere.** Depth comes only from tone steps (canvas `#f9f9f9` → tile `#f7f1f7` / `#efe6f4` → deep `#132436`) and from the portrait overlapping the hero edge.
- **Borders: none**, with one exception: the price-card chip `1px solid rgba(249,249,249,.85)` (`#f9f9f9d9`), radius 20, padding 10.
- Glass: the three hero tiles are *not* backdrop-blurred — they are a gradient whose last stop is 60 % transparent (see §4.3). The only real blur is the nav pill (`blur(10px)`) and the mobile header (`blur(20px)`).

---

## 3. Colours and their roles

Framer tokens (exact hex), then role. Our brand swap in the right column.

| Role | Lumine value | Where | Lepa Svaki Dan substitute (from `lepasvakidrugidan/index.html` tokens) |
|---|---|---|---|
| **Canvas** | `#f9f9f9` (token 87592269; SSR fallback `#faf8f5` is NOT what renders) | page bg | `--canvas #FAF7F6` |
| **Ink** | `#4a4745` | all headings/body/labels | `--ink-soft #383835` for light display weights, `--ink #231F20` for small text |
| **Muted** | `#807f7e` | trust-strip sub, hours rows, quote author | `--mist #88837E` (**≥ 18 px only**, see contrast note) |
| **Surface (lilac)** | `#efe6f4` / `#efe7f4` | icon circles, "FAST" chip, "10 years" tile, price-card arrow | `--nb-soft #F3EFF7` (+ `--card-blush #F7F0ED`) |
| **Surface-2 (softest)** | `#f7f1f7` | hours card | `--card #F7F3EF` / `--card-blush` |
| **Glass stops** | `#f5f2f9 → #efebf7 → rgba(235,230,245,.6)` | hero tiles | `#F5F1F9 → #F3EFF7 → rgba(231,222,239,.6)` |
| **Accent** | `#9483d2` | primary button, "4.9", star, trust-strip icons, "FAST" chip text | `--lila #AF96C7` (decor/numerals), see a11y note for text |
| **Accent-soft** | `#ccc6ea` | nav CTA pill; hero gradient start `#cac2ed` | `--lila-glow #C7B5D8` |
| **Hero gradient** | `linear-gradient(139deg,#cac2ed 0%,#e5e5e7 100%)` | hero | `linear-gradient(139deg,#C7B5D8 0%,#E8E4E8 100%)` |
| **Deep counter-tile** | `#132436` navy (text `#ebf1f8`; slate `#32404d` for button text; hover blue `#cbdef6`) | "Ready to glow?" tile | `--bw #3F6E5E` deep green for Wellbeing, or `--onyx-soft #302E2B` / footer `#695A74` plum-grey |
| **Feature tile (silk)** | plum `#4c1a35` → `#58203b`, rim light `#d67e94 / #b05583`; chip border `#f9f9f9d9` | price card background is a **1080² photo of satin** | brand-coloured silk: deep `#3b2a48` / lila rim, or champagne `#C59526` rim on onyx |
| **Ghost text** | `#ffffff` at 100 % on the lavender | ghost word | white |

### Contrast warnings baked into the template (do not copy blindly)

| Pair | Ratio | Verdict |
|---|---|---|
| `#4a4745` on `#f9f9f9` | 8.7:1 | pass |
| `#f9f9f9` on accent `#9483d2` (hero button label) | **≈3.1:1** | fails AA for 16 px text. Lepa: `--ink #231F20` on `--lila #AF96C7` = ≈6.2:1, or ink-filled button |
| accent `#9483d2` on `#efe6f4` ("FAST & ON TIME") | **≈2.6:1** | fail. Use `--accent-ink:#5f4fa3` (≈5.4:1) for lilac-on-lilac text |
| muted `#807f7e` on `#f9f9f9` / `#f7f1f7` | ≈3.8 / 3.6:1 | fails for small text. Use `#6b6661` (≈5.4:1) for the price list |
| white ghost word on lavender | ≈1.5:1 | decorative only → `aria-hidden="true"`, put the real H1 elsewhere |

---

## 4. Components (with the declarations worth copying)

### 4.1 Tokens

```css
:root{
  --canvas:#f9f9f9; --ink:#4a4745; --muted:#807f7e;
  --surface:#efe6f4; --surface-2:#f7f1f7; --glass-a:#f5f2f9; --glass-b:#efebf7;
  --accent:#9483d2; --accent-soft:#ccc6ea; --hero-a:#cac2ed; --hero-b:#e5e5e7;
  --deep:#132436; --on-deep:#ebf1f8; --slate:#32404d; --hover-blue:#cbdef6;
  --r:20px; --r-sm:10px; --gap:20px;
  --ease:cubic-bezier(.44,0,.56,1);         /* Framer "ease" used by every tween */
  --ease-menu:cubic-bezier(.4,0,.2,1);      /* mobile menu slide */
  --f-display:"Inter",system-ui,sans-serif; --f-body:"Manrope",system-ui,sans-serif;
}
body{background:var(--canvas);color:var(--ink);font:400 16px/23px var(--f-body);
  -webkit-font-smoothing:antialiased}
h1,h2,h3{margin:0;text-wrap:balance}
```

### 4.2 Nav — desktop floating pill

```css
.nav{position:absolute;inset:0 0 auto;z-index:1000;padding:20px}
.nav__row{display:flex;justify-content:space-between;align-items:center;max-width:1600px;margin:0 auto}
.nav__logo{font:600 24px/1 var(--f-display);letter-spacing:-.5px;color:#1a1a1a}
.nav__pill{background:rgba(255,255,255,.6);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  border-radius:20px;padding:9px}                      /* 44 px tall */
.nav__pill ul{display:flex;gap:40px;margin:0;padding:0;list-style:none}
.nav__pill li{padding:6px 12px;border-radius:20px;transition:background-color .3s ease}
.nav__pill a{display:block;font:500 14px/14px var(--f-display);color:#1a1a1a;text-decoration:none;transition:color .3s ease}
@media (hover:hover){.nav__pill li:hover{background:#000}.nav__pill li:hover a{color:#fff}}  /* template hover = solid black pill */
.nav__cta{width:100px;height:35px;border:0;border-radius:20px;background:var(--accent-soft);
  color:var(--slate);font:600 14px var(--f-display);transition:background .2s}   /* hover → lightens to #f9f9f9 */
```
Pill is *not* optically centred in the original (space-between with unequal side widths); use `grid-template-columns:1fr auto 1fr`.
Active link: filled pill (component props `menuActiveBg/Text`).

### 4.3 Nav — mobile

Header (≤ 768 nav width): `position:sticky(top:0) z 1000; background:#fff; backdrop-filter:blur(20px); padding:16px 20px 20px 12px; height:72px`. Logo 20 px/600. Right group `display:flex; gap:8px; flex-direction:row-reverse` → [burger][Book Now pill] (CTA pill stays visible next to the burger). Burger = button with `padding:8px`, three bars `24×2 / 16×2 / 24×2`, `gap:5px`, `border-radius:2px`, right-aligned, colour `#1a1a1a`. Open: wrapper `rotate(90deg)` (0.2 s) and two bars `rotate(±45deg)` at `top:11px` → X.
Menu panel: `position:fixed; top:71px; left:0; right:0; background:#faf8f5; padding:40px 24px; z-index:999; min-height:calc(100vh − 72px)`; list `flex column; gap:24px`; links Inter 14/500 `#1a1a1a` (we use 18–20 px). `body{overflow:hidden}` while open. Tap on any link or on the panel closes it.

### 4.4 Primary button ("Book Now" in hero tile)

```css
.btn{display:flex;align-items:center;justify-content:center;width:128px;height:35px;border:0;border-radius:20px;
  background:#9483d2;color:#f9f9f9;font:400 16px/23px var(--f-body);cursor:pointer;
  transition:background-color .2s var(--ease),opacity .2s var(--ease)}
@media (hover:hover){.btn:hover{background:#cdc7eb;opacity:.8}}
.btn:active{background:#000;opacity:1}          /* "pressed" variant = black */
.btn--small{background:transparent;box-shadow:inset 0 0 0 1px var(--accent-soft)} /* outline variant; hover fills #ccc6ea */
.btn--white{border:1px solid #bec8d1} /* hover #d3ceec */
```
Variants in the component: Default, Small (outline → filled on hover), White (outlined, light), HeroImage, Loading (black), Success (black), Error (`rgba(255,34,68,.15)`).

### 4.5 Glass tile (hero) and bento tile

```css
.glass{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:13px;
  width:250px;height:181px;border-radius:20px;overflow:clip;text-align:center;
  background:linear-gradient(145deg,#f5f2f9 14%,#efebf7 49%,rgba(235,230,245,.6) 87%)}
/* book tile: width 232px (20 %), button 55 % wide; rating tile: "4.9" Inter 300 72px accent + 30px star, gap 2px, then "Over 12K happy reviews" 16px */
```
The 60 % alpha end-stop is what lets the hero gradient/portrait faintly show through the lower right corner → "frosted" without blur.

Generic bento tile / photo tile:
```css
.tile{position:relative;border-radius:20px;overflow:hidden}
.tile>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
.tile__label{position:absolute;top:20px;left:20px;width:49%;font:500 20px/20px var(--f-display);
  text-transform:uppercase;color:var(--ink)}              /* sits on a pale empty corner of the photo, no scrim */
.tile__link{position:absolute;inset:0;z-index:5;opacity:0}  /* whole tile = invisible full-size <a> */
@media (hover:hover){.tile:hover{opacity:.8}}               /* spring .4s, bounce .2 */
.tile{transition:opacity .4s cubic-bezier(.2,.8,.2,1)}
.owner__name{font:700 18px/20px var(--f-display)} .owner__role{font:500 20px/20px var(--f-display);text-transform:uppercase}
```
Photo art direction: high-key, pale beige/grey/white studio backgrounds, subject pushed right/bottom, **empty top-left** reserved for the label. Source sizes 1496×1080, 1910×1080, 1859×1080, 1584×1080 (landscape) and 740×1080 (portrait).

### 4.6 Trust strip item + chip

```css
.hl{display:flex;align-items:center;gap:16px;flex:1 0 0}
.hl__ico{position:relative;flex:none;width:66px;aspect-ratio:1;border-radius:999px;background:var(--surface)}
.hl__ico svg{position:absolute;inset:0;margin:auto;width:49px;stroke:var(--accent);fill:none;stroke-width:1.5}  /* thin line icons: hand+heart, nail-polish bottle, crown (35 px) */
.hl h3{font:700 18px/20px var(--f-display)} .hl p{margin-top:8px;font:500 12px/13px var(--f-body);color:var(--muted)}
.hl--chip{flex:1 0 0;height:78px;border-radius:20px;background:var(--surface);display:grid;place-items:center;
  text-align:center;font:500 20px/20px var(--f-display);text-transform:uppercase;color:var(--accent)}
```
Row: `display:flex; justify-content:space-between; padding:20px 20px 0; height:102px`, 4 equal columns of 290 px.

### 4.7 Feature price card (plum silk) + arrow circle

```css
.feat{position:relative;border-radius:20px;overflow:hidden;height:230px;color:#f9f9f9;
  background:url(silk.jpg) center/cover,#4c1a35}
/* css-only stand-in: */
/* background:radial-gradient(120% 90% at 100% 0%,#d67e94 0%,#b05583 16%,rgba(176,85,131,0) 42%),
              linear-gradient(160deg,#58203b,#4c1a35 55%,#4a1a34) */
.feat__top{position:absolute;top:20px;inset-inline:0;padding:0 20px;display:flex;justify-content:space-between;align-items:center;
  font:500 16px/1.3 var(--f-body)}
.chip{width:126px;padding:10px;border:1px solid rgba(249,249,249,.85);border-radius:20px;text-align:center}
.feat__bottom{position:absolute;bottom:33px;inset-inline:0;padding:0 20px;display:flex;justify-content:space-between;align-items:center}
.feat__price{font:600 58px/1 var(--f-display);color:#fff}
.arrow{width:67px;height:67px;border-radius:50%;background:var(--surface);display:grid;place-items:center;cursor:pointer;
  transition:background-color .3s ease-in-out}
.arrow svg{width:24px;height:24px;stroke:var(--deep);stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;
  transition:transform .3s ease-in-out}                   /* path: M5 12H19M19 12L12 5M19 12L12 19 */
@media (hover:hover){.arrow:hover{background:var(--hover-blue)}.arrow:hover svg{transform:rotate(45deg)}}
```
White variant (on navy CTA): bg `#fff`, 70 px (60 tablet/mobile), arrow `#132436`.

### 4.8 Stat tile and quote

- "10 years" tile: `background:#efe7f4; border-radius:20px; height:230` with text block `position:absolute; bottom:30px; left:0; padding-left:20px` → Manrope 32/500 title (balance disabled on tablet) + 16/400 sub. Large empty top half = the design (the number is a sentence, not a big numeral).
- Quote: **no background** — the tile is just text on canvas (`padding:20px 0 0 20px`), 32/500 Manrope curly-quoted, author `— Sarah K.` 16/400 muted. Mobile: 21/24.

### 4.9 Hours card + CTA pair

```css
.pair{display:flex;justify-content:space-between;padding:20px 20px 30px;max-width:1200px}
.pair>*{width:49%;height:229px;border-radius:20px;padding:20px;position:relative}
.hours{background:#f7f1f7}
.hours__head{display:flex;align-items:center;gap:20px}
.icon-tile{width:50px;height:50px;border-radius:10px;background:#e7deef;display:grid;place-items:center} /* clock 32px, stroke 1.5 black */
.hours__row{display:flex;justify-content:space-between;align-items:center;font:400 16px/23px var(--f-body);color:var(--muted)}
.hours__rows{display:flex;flex-direction:column;gap:16px;margin-top:16px}
.cta{background:#132436;color:#fff}
.cta .icon-tile{background:#132436}                      /* sparkles icon, stroke #f7f1f7, 31px */
.cta h2{font:500 32px/35px var(--f-body)}                /* title row: space-between with 70px white arrow circle */
.cta p{font:400 16px/23px var(--f-body);color:#ebf1f8}   /* two short lines, absolute top:141px;left:20px; width 51% */
```
Mobile (stacked): hours 350×243, CTA 350×214, `gap:27px`, page padding 20.

---

## 5. Motion — every animation, with touch and reduced-motion equivalents

Timing facts extracted from the `__framer__appearAnimationsContent` JSON, the published component code and CSS. **Everything below is all the motion the template has.** There are **no scroll-linked effects, no parallax, no marquee, no counter animations**. The Framer reduced-motion hook is wired but *disabled* in this build (`prefers-reduced-motion` flag is passed as `false`), so the original does not respect it — ours must.

Global easing: `cubic-bezier(.44,0,.56,1)` (symmetric ease-in-out, "Framer ease") for the hero tweens and button tweens; `cubic-bezier(.4,0,.2,1)` for the mobile menu; `ease-in-out` .3 s for arrow circle; `ease` .3 s for nav links.

| # | Effect | Original (exact) | Mobile / touch equivalent | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| M1 | **Hero portrait fade-in** | opacity .001 → 1, **0.8 s**, delay 0, no transform (all breakpoints) | identical (opacity only, cheap) | show immediately (opacity 1) |
| M2 | **Hero headline+sub block** (desktop/tablet only) | opacity only, **0.4 s**, delay **0.2 s** | n/a (hidden on mobile) | immediate |
| M3 | **"Love it or we fix it" tile** | `y −20 → 0` + fade, **0.6 s**, delay **0.5 s** | n/a on mobile; on tablet identical | immediate |
| M4 | **"Book in 60 seconds" tile** | `y +200 → 0` + fade, **0.6 s**, delay **0.3 s** | **reduce to `y 40 px`** (200 px flies over the next section on a phone and causes visual overlap); same timing | immediate |
| M5 | **Rating tile** | `y +20 → 0` + fade, **0.6 s**, delay **0.7 s** | identical | immediate |
| M6 | **Ghost word** | `y +100 → 0` + fade, **0.4 s**, delay **0.8 s** (tablet/mobile variant carries `translateX(-50%)` in its transform template, so animate with the CSS `translate`/separate property, not `transform`, to avoid clobbering centring) | `y 40 px`, 0.4 s, delay 0.5 s (nothing else is competing on mobile) | immediate |
|  | *Whole hero timeline ends at 1.3 s.* Order: portrait 0 → headline .2 → book .3 → love-it .5 → rating .7 → ghost .8. | | | |
| M7 | **Nav link hover** | `li` background → `#000`, link colour → `#fff`, **0.3 s ease** (bg) / 0.3 s ease (colour) | no hover on touch: show `:active` (same colours) + `:focus-visible` ring; desktop-only nav anyway | keep as is (a colour fade, no movement) |
| M8 | **Nav CTA hover** | background `#ccc6ea` → lighter (`#f9f9f9`), `transition: background .2s` | `:active` state same | keep |
| M9 | **Primary button** | hover: bg `#9483d2 → #cdc7eb`, opacity → .8; pressed: bg `#000`, opacity 1; tween **0.2 s**, ease `[.44,0,.56,1]` | `@media (hover:hover)` guard on hover; `:active` shows pressed black; min tap height 44 px (template is 35 px — enlarge on touch via `min-height:44px`) | keep (colour/opacity only) |
| M10 | **Bento photo tile hover** | whole tile `opacity → .8`, spring `duration .4, bounce .2` (≈ `cubic-bezier(.2,.8,.2,1)` .4 s for opacity) | `:active{opacity:.8}` (tap feedback), no sticky hover (`@media (hover:hover)`) | keep (opacity) |
| M11 | **Arrow circle** | bg → `#cbdef6`, arrow `rotate(0 → 45deg)`, **0.3 s ease-in-out** | `:active` same; additionally a one-time 45° "nudge" when the tile scrolls into view is optional; do not require hover to discover it | no rotation, only bg colour change |
| M12 | **Mobile menu open/close** | panel `opacity 0, x:100% → opacity 1, x:0`, **0.4 s, ease [.4,0,.2,1]**, exit reverses; each `li` `opacity 0, x −20 → 0` with **delay = index × 0.08 s**, duration **0.3 s**; burger wrapper `rotate 0→90°` **0.2 s** and bars morph to X; `body{overflow:hidden}` while open | this IS the mobile/touch pattern. Use `transform:translateX` + `opacity`, add `inert` on the page behind, close on link tap, ESC, and focus trap; keep 44 px+ row heights | panel simply fades (0.15 s) with no slide and no stagger; burger → X swaps instantly |
| M13 | **Page transitions / smooth scroll** | none (multi-page) | in our single page: `html{scroll-behavior:smooth}`, `section{scroll-margin-top:84px}` | `scroll-behavior:auto` |

### 5.1 Implementation snippet (pure CSS, works without JS)

```css
@keyframes lm-in{from{opacity:0;translate:0 var(--dy,0)}to{opacity:1;translate:0 0}}
.a-photo{animation:lm-in .8s var(--ease) 0s both}
.a-head {animation:lm-in .4s var(--ease) .2s both}
.a-love {--dy:-20px;animation:lm-in .6s var(--ease) .5s both}
.a-book {--dy:200px;animation:lm-in .6s var(--ease) .3s both}
.a-rate {--dy:20px; animation:lm-in .6s var(--ease) .7s both}
.a-ghost{--dy:100px;animation:lm-in .4s var(--ease) .8s both}
@media (max-width:809.98px){.a-book{--dy:40px}.a-ghost{--dy:40px;animation-delay:.5s}}
@media (prefers-reduced-motion:reduce){
  [class*="a-"]{animation:none!important;opacity:1!important;translate:none!important}
  *{scroll-behavior:auto!important}
  .menu{transition:opacity .15s linear!important;transform:none!important}
}
```
(Use the individual `translate` property so a centring `transform:translateX(-50%)` on the ghost word is not overwritten.)

### 5.2 Optional extension (not in Lumine, needed for our long page)

Section reveal in the same idiom: `opacity 0→1` + `translateY(24px→0)`, **0.6 s `var(--ease)`**, 80 ms stagger per tile (`--i`), `IntersectionObserver` threshold .15 / `rootMargin:0 0 -8% 0`, fire once. Progressive enhancement only: hidden state is applied by JS adding `.js-rv` to `<html>`; no-JS and reduced-motion show everything. Do **not** gate any price-list content behind it (Lumine's own mobile screenshots show how blank a JS-gated page looks when animations don't run).

---

## 6. The 8 design moves a rebuild must keep

1. **Full-bleed pastel gradient hero with only the bottom corners rounded (20 px)**, sitting on a quiet near-white canvas. It is the only large gradient on the page.
2. **Bottom-anchored transparent cut-out portrait** that overlaps hero edges, with a **giant ultralight (200) white uppercase ghost word in front of her** (147 px, line-height 0.73, ≈ 7.8 em wide, crossing her torso). Depth through layering, not shadows.
3. **Extreme weight contrast**: light/ultralight display (200–300, 72 / 147 px) against 700-weight 18 px labels and tiny 12 px Manrope; no tracking, tight leading, `text-wrap:balance`, alternate Inter glyphs (single-storey *a*).
4. **Bento mosaic with one radius and one gutter**: every module is a flat 20 px-radius tile; tiles of unrelated jobs (photo, price, stat, quote, hours, CTA) share the same height/width language (232–250 × 181, 371 × 230, 568 × 229) and 20 px seams. **No shadows, no borders, no rules.**
5. **One accent + one deep counter-tile**: lavender accent used sparingly (button, "4.9", star, trust icons); the tonal ladder canvas → `#f7f1f7` → `#efe6f4` carries hierarchy; exactly **one dark tile per view** (plum silk card, navy CTA) as the full stop.
6. **Photo tiles with caps labels on an empty corner**: high-key studio photography, subject offset right, 20 px uppercase Inter label top-left, whole tile is the link, hover = opacity .8.
7. **Calm, almost-static motion**: a single 1.3 s staggered hero entrance and tiny hovers (opacity, 45° arrow turn). Nothing scrolls, nothing loops.
8. **Mobile is a content diet, not a stack**: hero keeps portrait + ghost word + 2 chips only, trust strip disappears, nav = white bar with **CTA pill always visible**, bento collapses to one column of full-width 175 px tiles with identical 20 px gutters.

---

## 7. Mapping to the Lepa Svaki Dan page

Data source: `v2/_shared/content/content.json` (210 services, 5 tabs, 31 groups; 5 verticals; 4 favorites; 4 gifts; 4 offers; 4 testimonials; 21 blog posts; 2 locations; hours `Pon — Sub · 9—21h`). Images: `v2/_shared/img/*` (incl. `hero-cutout-{600,900,1300}.webp` = the transparent portrait for the hero slot, aspect ≈ 0.68, vs Lumine's 0.74 — same slot, size it by height 92 % of hero). Do not invent ratings, hours per location, map links or review counts that are not in the data.

| Lepa section | Carried by (Lumine component) | Desktop | Mobile |
|---|---|---|---|
| **Nav** | Floating pill nav (§4.2) + CTA pill "Zakaži" | 6 links in pill (Tretmani, O nama, Lokacije, Cenovnik, Posebna ponuda, Blog), gap 24 (not 40), CTA = `nav.cta` (WhatsApp). | White 72 px bar, logo + CTA pill + burger (§4.3); menu panel links 18–20 px, with "Pozovi" / "WhatsApp" rows at the bottom. **Plus sticky bottom action bar** (Piši nam · Pogledaj cene · Gde smo · Pozovi), 56 px + `env(safe-area-inset-bottom)`. |
| **Hero** | Lavender hero shell + cut-out + ghost word + glass tiles (§1.3) | Left: headline = typed phrases "Budi smirena, srećna, lepa, svaki dan." in Inter-like 300/72 (balance, 3 lines max) + `hero.sub`; glass tile A top-right = `hero.claim` "2 lokacije, 1 filozofija"; glass tile B bottom-left = "Zakaži termin" + primary button; glass tile C bottom-right = stat "15+" godina prakse (data says 15+) in accent numeral (replaces the 4.9 rating, no ratings in data). Ghost word "LEPA SVAKI DAN" (14 chars, same width class as "NAILS & LASHES"), `aria-hidden`. Real `<h1>` is the headline. Hero CTAs from data: "Pogledaj tretmane", "Cenovnik usluga". | Portrait + ghost word at top (45 px) + 2 chips (Zakaži termin button · 15+ godina). Headline moves **below** the hero as a normal block (we cannot drop it like Lumine because our H1 is the brand message). Search field (hero.searchPlaceholder) sits under the headline as a pill (16 px input to avoid iOS zoom). |
| **O nama + stats** | Trust strip (§4.6) for the 3 stats + "FAST" chip for hours; "10 years" tile idiom for the about title; quote tile idiom for founder quote; **owner tile** (tall portrait + name/role overlay) for Dr Tamara Vujačić (`founder`) | Row 1: strip of 3 stats (15+ godina prakse · 2 koncepta u Beogradu · 1.000+ klijenata godišnje) + lilac chip "Pon — Sub · 9—21h". Row 2 bento: [owner tile 32 %] [lilac tile with "Lepota nije trenutak, već navika." + 2 paragraphs, text bottom-left as in "10 years"] [about image tile]. | Trust strip is **kept** (our stats are real content): 3 columns, icon circle 44 px, number Inter 700 20 px + 12 px label, no chip; then tiles stack 350 wide: owner 350×429, lilac text tile (auto height, min 187), image tile 350×175. |
| **Tretmani (5 verticals)** | Photo tiles with caps label (§4.5) | 5 tiles: 2×2 grid + 1 wide tile (or 3+2). Label = vertical title (uppercase 20/500), bottom-left small count "58 usluga" chip, location dot (lila = Beauty, green = Wellbeing, split = both). Whole tile links to `#usluge` + sets that tab. Hover opacity .8. | 5 full-width 175 px tiles, 20 px gap, label 17 px; `:active` opacity .8; the count chip stays. |
| **Favoriti (4)** | Plum silk **feature card** (§4.7) | 2×2 grid of feature cards (371×230): chip = `tagLabel` (e.g. "NO FILTER NEEDED"), name as title (Manrope 500), price Inter 600 ~44–58 px, arrow circle → opens that service in the Cenovnik. One card gets the silk photo; the other three use brand-tone gradients so only one reads "dark" per viewport. | Single column 350×187, or horizontal scroll-snap row (card 82 % width, `scroll-snap-align:start`) so 4 cards cost one screen; arrow circle 56 px. |
| **Cenovnik** | **Pill nav idiom (tabs)** + **hours-card rows** + lilac tiles for accordion headers (see §7.1) | see §7.1 | see §7.1 |
| **Pokloni (4)** | "10 years" lilac tile idiom as **gift card tile** (title bottom-left, price + arrow circle right) | 4-up row of lilac tiles 230 tall: tag chip top-left, name, price; arrow circle. | scroll-snap row (84 % width) or 1-column list; no hover reliance. |
| **Lokacije ×2** | **Hours + glow pair** (§4.9) | Left tile pale lilac (`--nb-soft`) = Beauty Concept, Novi Beograd, Trešnjinog cveta 1ž; right tile deep (`--bw` green) = Wellbeing Concept, Belgrade Waterfront, Hercegovačka 17. Icon tile 50×50 r10, title Inter 18/700, rows: address · phone · WhatsApp (as `hours__row`), shared hours row "Pon — Sub · 9—21h" (no per-location hours in data), arrow circle = "Piši nam" (WhatsApp). No map button (no map URLs in data). Location photo as tile background or inset 112 px thumb. | Stacked, gap 20–27, each full-width, phone/WhatsApp rows are 48 px tall tap targets (`tel:` / `wa.me`). |
| **Utisci (4)** | Quote tile (§4.8) | One large quote per view: text Manrope 500 32/35 on canvas (no bg), author muted, prev/next arrow circles (reuse §4.7 rotated -135°/45° idiom) + 4 dots; auto-rotate `testimonials.autoRotateMs`, pause on hover/focus and when out of view. | 21/24, swipeable `scroll-snap-x` (no auto-rotate on touch), dots 12 px with 44 px hit area. |
| **Posebna ponuda (4 offers)** | Feature card (plum) for the featured offer + lilac tiles for the other 3 | 3-up row like "3 blocks": [feature card: tag chip, title, price (385 € etc.), arrow "Zakaži ovaj paket"] [2 lilac tiles with title + "includes" bullet list + price]; `oldPrice` struck-through muted. Link "Svi paketi ›". | 1 column; offer cards 350 wide, `includes` as a compact list (13/18), price row bottom with arrow circle. |
| **Blog teaser** | Photo tiles with caps labels (§4.5) | 3 tiles from `blog.items` (image, category chip, title Manrope 500 21 px below the image or as tile label), + "Svi tekstovi na blogu ›". | 3 stacked 350×175 tiles (title overlay), or 1 tile + 2 text rows. |
| **CTA** | **Navy "Ready to glow?" card** (§4.9) widened to full 1160 | Deep tile, 2 lines of copy from `cta.home`, 70 px white arrow circle → WhatsApp; optional `cta-bg` image with 55 % deep overlay. | 350×214 → full-width, title 21/24, button as full-width pill (min 48 px) under the copy. |
| **Footer** | Not in Lumine → bookend of the hero | Deep (`--onyx-soft`/plum-grey) block with **top** corners 20 px (mirrors the hero's bottom corners), 3 columns (contact, social, locations), credit "Pripremio ECHOSYSTEM-MOTHER AGENCY" (as `site.credit`), copyright. | Columns stack, 20 px padding, links 48 px rows, back-to-top circle. |

### 7.1 Cenovnik — tabs + groups + 210 rows that must stay fully usable on a phone

Components composed from Lumine parts: **tab bar = nav pill idiom** (`rgba(255,255,255,.6)` + `blur(10px)`, radius 20, padding 9, items `padding:6px 12px` r20, active = filled), **group header = lilac tile with 50×50 icon tile (r10)**, **service rows = hours-row idiom** (flex space-between, no borders), **highlight chip = "FAST" chip**, **price accent = Inter numerals**.

Structure (`#usluge`): section title + two chips (`price.validChip` "Cenovnik važi od 15.03.2026." from `pricing.validFromISO`; `price.payChip` "Plaćanje u dinarima") + search pill + tab bar + group list + footnotes (`pricing.footnote`).

**Tabs (5: Tretmani lica 58 · Tretmani tela 36 · Estetske procedure 62 · Naši protokoli 26 · Laserska epilacija 28)**
- Desktop: centred pill group, all 5 visible, count as small muted superscript.
- Mobile: **one horizontally scrollable pill row** (`overflow-x:auto; scroll-snap-type:x proximity; scrollbar-width:none`), items `min-height:44px; padding:12px 16px; font:500 14px Inter; white-space:nowrap`, **edge fade masks** (`mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)`), hint "Prevuci za još kategorija" shown once; the active tab `scrollIntoView({inline:'center'})`. Bar is `position:sticky; top:72px` (just under the header) with canvas background + blur(20px) so tab + search are always reachable while scrolling a long tab. `role="tablist"`, arrow keys, `#usluge/lice` deep-links.
- Panels are all in the DOM (static HTML from `content.json`), toggled with `hidden`; no fetch.

**Groups (31 total; up to 9 per tab, "Biorevitalizacija i skinbosteri" has 17 services)**
- Each group = accordion `<button aria-expanded>` row: `min-height:64px; border-radius:20px; background:var(--surface-2)`; content: left 40–50 px icon tile (r10) holding the service count, title Inter 700 18 px (16 on mobile, wraps), right: chevron in a 36 px circle that rotates 45°/180° like the arrow circle (0.3 s ease-in-out). Only the first group of a tab is open on load; "Otvori sve grupe" toolbar for tabs with ≥ 8 groups.
- Open/close: animate `grid-template-rows:0fr→1fr` over **0.3 s `cubic-bezier(.4,0,.2,1)`** (reduced-motion: instant). Never `max-height` hacks. `content-visibility:auto; contain-intrinsic-size:auto 64px` on closed groups for perf (210 rows total is light, but keep first paint fast).
- `scroll-margin-top` = header + tab bar (≈ 140 px) so a group header never hides under sticky UI after opening/anchor jumps.

**Service row (the unit that must work on 390 px)**
```
┌ name (Manrope 500 15/20, wraps up to 3 lines)           price (Inter 600 16, tabular-nums) ┐
│ description (Manrope 400 13/18, #6b6661)                  second currency (13/18 muted)    │
│ [tag chip: ★ highlight]  [⏱ duration]  [Na upit]  [location dot]                          │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```
- `display:grid; grid-template-columns:1fr auto; gap:4px 16px; padding:14px 20px; border-top:1px solid rgba(74,71,69,.08)` (a hairline is the one deliberate deviation from Lumine's "no rules" — 210 rows need scan lines).
- Price source `51€ / 6.000 rsd`: show **EUR on top (600), RSD below (muted, 13 px)**, right-aligned; ranges `min–max`; `onRequest` → lilac pill "Na upit". `font-variant-numeric:tabular-nums`.
- Highlighted standard services (44) get the "FAST" chip style (`--nb-soft` bg, `--accent-ink #5f4fa3` text, 12 px caps) + `pricing.ui.highlightBadge`; services with `blogPost` get a "Pročitaj više ›" text link (44 px hit area).
- Location per service (`beauty` / `wellbeing` / `both`): 10 px dot (lila / green / half-half) + one legend line at the top of the list, **not** a text badge on every row.
- **Laser tab** (columns Usluga / Cena, 5 groups, 28 rows): same row component (the two-column table becomes the row's name/price columns); keep real `<table>` semantics via `role="table|row|cell"` if desired; **no horizontal scroll anywhere**.
- Contrast: use `#6b6661` for descriptions, not `#807f7e`.

**Search** (`pricing.searchPlaceholder`, `search.tagRules` / `synonyms` already in data): pill input 48 px tall, 16 px font, clear button, results count in an `aria-live="polite"` line; typing opens matching groups across the active tab (and shows "n rezultata u drugim kategorijama" chips that switch tabs). Debounce `search.debounceMs`, min chars `search.minChars`.

**Phone ergonomics checklist**: no hover dependence; all tap targets ≥ 44 px; sticky tab bar ≤ 56 px; body scroll never trapped; payment modal (`payment.modal`) opens as bottom sheet with `inert` page + ESC; bottom action bar never covers the last row (`padding-bottom` + safe-area); price column never wraps below 360 px (name column absorbs the squeeze).

---

## 8. Gotchas, assets and build notes

- **Fixed frames → fluid**: use `width:min(1200px,100% - 40px)` for the container; at ≥ 1200 the hero background stays full-bleed while content stays 1200. Between 810–1199 do not hard-set 810; use the tablet numbers as the target at ~900 and let `%`/`clamp` do the rest.
- **Hero height**: 919 px desktop is "one 900 px viewport + 19"; rebuild as `min-height:clamp(513px, calc(100svh + 19px), 960px)` on desktop, fixed 557 / 513 on tablet / mobile.
- **Z-order**: portrait z1, tiles (children) z1, ghost word z2, nav z1000 (z3 container). The ghost word must be `pointer-events:none`.
- **No JS needed** for the page except: mobile menu, accordion/tabs, search, optional reveal. Hero animation is pure CSS.
- **Fonts**: Google Fonts `Inter:wght@200..700` (variable, check that `cv03 cv04 cv09 cv11 ss03` are present in the Google build; if not, self-host Inter 4.0 variable) and `Manrope:wght@400;500;700`. `font-display:swap`. If the Lepa brand serif (Bodoni Moda) must stay, keep it only for the italic accent words in headings and use the Inter/Manrope pair for everything this spec describes; the 200-weight ghost word needs a genuinely thin face.
- **Images**: portrait cut-out is a PNG/WebP with alpha (775×1050 in Lumine); ship 600/900/1300 webp with `srcset`, `sizes="(min-width:1200px) 775px, (min-width:810px) 446px, 381px"`, `fetchpriority="high"`, explicit width/height. Photo tiles `loading="lazy"` except the first row.
- **Icons**: Lumine icons are mask-image SVGs coloured by `background-color`; replace with inline SVG (`stroke:currentColor`, 1.5 px, round caps).
- **The silk price card image** is a 1080² photo; either generate a brand-coloured silk (preferred) or use the CSS stand-in in §4.7.
- **Cleanup when copying from the saved HTML**: delete the Framer badge (`#__framer-badge-container`), the three duplicated nav/footer variants (`hidden-*` classes) and all `framer-*` classes; use `@media` instead of triplicated DOM.
- **Accessibility fixes vs. template**: add a skip link, `aria-label`s on arrow circles, real `<button>`/`<a>` (template has an invisible `div` link overlay), visible focus rings (the template has none), and obey `prefers-reduced-motion` (the template does not).

---

Pripremio ECHOSYSTEM-MOTHER AGENCY · 2026-10-07
