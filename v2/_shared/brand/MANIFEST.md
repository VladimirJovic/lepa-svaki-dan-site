# Brand pack: LEPA SVAKI DAN / BEAUTY CONCEPT

**ECHOSYSTEM-MOTHER AGENCY**  ·  brand pack for the website previews (v2)  ·  generated 2026-10-07

Everything in this folder is derived from one source: `/Users/vladajovic/Developer/LEPA SVAKI DAN/!!!BeautyConceptBRAND BOOK.pdf` (13 pages, Adobe Illustrator 2017 export, May 2021). The brandbook author is Duda Ludosan; the brandbook carries the author's contact line on every page, which is intentionally NOT reproduced in any file of this pack.

Folder: `/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/_shared/brand/`

```
brand/
  MANIFEST.md        this file
  preview.html       visual contact sheet of everything (open in a browser)
  logo/              19 logo variants, each as SVG + PNG (RGBA, 2400 px wide)
  graphics/          swash (x3), corner brackets (x2), hairline-dot divider
  tokens/brand.css   colours, scale, contrast table, @font-face, helper class
  fonts/             Galano Grotesque Regular + Bold, woff2 + woff
```

## 1. What the brandbook contains (page map)

| Page | Content | Format in PDF | Used for |
|---|---|---|---|
| 1 | Logo BC 1 colour positive B&W + negative on charcoal block | vector | logo-full-black, logo-block-charcoal |
| 2 | "Brend blok": charcoal block, lila block, 70% lila block with gold foil | vector + raster foil | logo-block-* (lila/charcoal). Foil block is raster, not extracted |
| 3 | Logo BC 1 colour positive (lila) + negative lila block, swatches | vector | logo-full-lila, logo-full-white, logo-block-lila |
| 4 | Logo BC 2 colours (lila+gold), horizontal lockups | vector | logo-full-lila-gold, logo-horizontal-* |
| 5 | LSD independent marks: single line, stacked in brackets; colour blocks | vector + raster foil | lsd-* |
| 6-10 | Mockups: gift bag, letterhead, business card, folder, envelopes | raster (JPEG + soft mask) | swash is read from pp 8-9 |
| 11 | "Kolor paleta": Pantone 2635 C / 2645 C / Black C, 80/40/20% tints, gold and silver foil | vector + raster foil | tokens/brand.css |
| 12 | "Tipografija": Galano Grotesque Light / Regular / Medium specimen (CONCEPT wordmark is Galano Light) | vector text | tokens/brand.css notes, fonts/ |
| 13 | Wall signage mockup | raster | not used |

## 2. Files

### root

| File | Size | What it is | Recommended use |
|---|---|---|---|
| `MANIFEST.md` | this file | Inventory of the pack | Read first |
| `preview.html` | 14.9 KB | Contact sheet: every logo on light, dark and lila, graphics, colour chips, type specimen. Relative paths + brand.css | Open in a browser to review the pack; not for production |

### logo/  (19 variants x SVG + PNG)

| File | Size | What it is | Recommended use |
|---|---|---|---|
| `logo/logo-full-lila.svg` | SVG, viewBox 259.31 x 135.6, 18.4 KB | Full logo BEAUTY CONCEPT + LEPA . SVAKI . DAN with hairlines, one colour: lila PANTONE 2635 C. Brandbook p3 "Logo BC 1 boja pozitiv". | Primary logo on white / very light surfaces (header, footer, favicon source). Not for small sizes: lila on white is only 1.9:1. |
| `logo/logo-full-lila.png` | PNG 2400x1256, 123.1 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-full-black.svg` | SVG, viewBox 259.31 x 135.6, 18.3 KB | Same full logo in ink black (PANTONE Black C). Brandbook p1 "Logo BC 1 boja pozitiv B&W". | Print, mono contexts, accessibility-first headers, light photo backgrounds. |
| `logo/logo-full-black.png` | PNG 2400x1256, 119.1 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-full-white.svg` | SVG, viewBox 164.15 x 85.84, 17.6 KB | Same full logo in white (negative). Taken from the white artwork inside the lila block on brandbook p3; brandbook shows it only inside a block. | On lila, charcoal, ink or photo overlays (dark hero, footer on lila). Invisible on white by design. |
| `logo/logo-full-white.png` | PNG 2400x1256, 95.1 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-full-lila-gold.svg` | SVG, viewBox 259.31 x 135.6, 18.5 KB | Two-colour full logo: lila letters + flat gold hairlines and LEPA . SVAKI . DAN. Brandbook p4 "Logo BC 2 boje pozitiv". | Premium/hero moments on white or ink. Gold is the flat GOLD swatch (not the foil). |
| `logo/logo-full-lila-gold.png` | PNG 2400x1256, 123.1 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-horizontal-lila.svg` | SVG, viewBox 256.28 x 73.88, 17.1 KB | Horizontal lockup, all lila: BEAUTY CONCEPT | vertical hairline | LEPA / SVAKI / DAN. Brandbook p4 upper right. | Sticky navbar / mobile header where height is limited (aspect 3.5:1). |
| `logo/logo-horizontal-lila.png` | PNG 2400x692, 92.3 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-horizontal-lila-gold.svg` | SVG, viewBox 256.28 x 73.88, 17.1 KB | Horizontal lockup, lila wordmark + gold LEPA SVAKI DAN. Brandbook p4 lower right. | Navbar on white or ink when the two-colour version is wanted. |
| `logo/logo-horizontal-lila-gold.png` | PNG 2400x692, 93.5 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-horizontal-black.svg` | SVG, viewBox 256.28 x 73.88, 17.1 KB | Horizontal lockup in ink black. DERIVED: recolour of the all-lila horizontal (not in brandbook). | Mono navbar/footer on light backgrounds. |
| `logo/logo-horizontal-black.png` | PNG 2400x692, 89.2 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-horizontal-white.svg` | SVG, viewBox 256.28 x 73.88, 17.1 KB | Horizontal lockup in white. DERIVED: recolour of the all-lila horizontal (not in brandbook). | Navbar/footer over dark, lila or photo backgrounds. |
| `logo/logo-horizontal-white.png` | PNG 2400x692, 69.8 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/lsd-stacked-frame-black.svg` | SVG, viewBox 125.97 x 90.77, 3.5 KB | LEPA / SVAKI / DAN stacked mark with hairline separators inside open bracket frame, ink black. Brandbook p5 left. | Badge, stamp, favicon-ish square mark, section seal on light backgrounds. |
| `logo/lsd-stacked-frame-black.png` | PNG 2400x1730, 67.9 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/lsd-stacked-frame-lila.svg` | SVG, viewBox 125.97 x 90.77, 3.5 KB | Same stacked mark in lila PANTONE 2645 C (the deeper lila the brandbook uses for the LSD marks, #AF96DB). Brandbook p5 left. | Light backgrounds, decorative badge. Contrast on white 2.6:1: decorative only. |
| `logo/lsd-stacked-frame-lila.png` | PNG 2400x1730, 69.4 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/lsd-stacked-frame-white.svg` | SVG, viewBox 125.97 x 90.77, 3.5 KB | Same stacked mark in white. DERIVED: recolour of the black master. | Over lila, charcoal, ink or photos. |
| `logo/lsd-stacked-frame-white.png` | PNG 2400x1730, 56.9 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/lsd-line-black.svg` | SVG, viewBox 259.3 x 26.06, 4.0 KB | LEPA . SVAKI . DAN single line between two hairlines, ink black. Brandbook p5 top left. | Section divider/eyebrow, footer signature, loader text. |
| `logo/lsd-line-black.png` | PNG 2400x242, 24.6 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/lsd-line-lila.svg` | SVG, viewBox 259.3 x 26.06, 4.1 KB | Same single-line mark in PANTONE 2645 C lila (#AF96DB). Brandbook p5. | Decorative divider on white/light tints. |
| `logo/lsd-line-lila.png` | PNG 2400x242, 25.5 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/lsd-line-white.svg` | SVG, viewBox 259.3 x 26.06, 4.1 KB | Same single-line mark in white. DERIVED: recolour of the black master. | Over dark/lila/photo backgrounds. |
| `logo/lsd-line-white.png` | PNG 2400x242, 19.6 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-block-lila.svg` | SVG, viewBox 245.1 x 173.58, 18.9 KB | Framed logo block: white full logo on a lila (2635 C) rectangle, surrounded by open lila bracket frame with a transparent gap. Brandbook p3 right (same artwork as p2). | The brandbook "brend blok": stamp/avatar, hero lockup, OG image base. The white gap between block and brackets is transparent. |
| `logo/logo-block-lila.png` | PNG 2400x1700, 85.4 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-block-lila-white-brackets.svg` | SVG, viewBox 245.1 x 173.58, 18.9 KB | Same block with the bracket frame recoloured white. DERIVED variant for the reading "white logo and brackets". | Block placed on a dark or photographic background where lila brackets would vanish. |
| `logo/logo-block-lila-white-brackets.png` | PNG 2400x1700, 85.3 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/logo-block-charcoal.svg` | SVG, viewBox 245.1 x 173.58, 19.0 KB | Framed logo block: white full logo on dark charcoal (#322F30) rectangle with charcoal brackets. Brandbook p1 right / p2 left. | Dark lockup / footer badge on white or light tints. |
| `logo/logo-block-charcoal.png` | PNG 2400x1700, 99.1 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/lsd-stacked-block-lila.svg` | SVG, viewBox 140.33 x 101.32, 3.6 KB | Stacked LEPA SVAKI DAN white mark on a lila rectangle with lila bracket frame. Brandbook p5 right (top). | Square badge / app-icon style tile. |
| `logo/lsd-stacked-block-lila.png` | PNG 2400x1733, 63.2 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `logo/lsd-stacked-block-charcoal.svg` | SVG, viewBox 140.33 x 101.32, 3.6 KB | Stacked mark white on 75% black (#5A5758) rectangle with charcoal brackets. Brandbook p5 right (middle). | Neutral square badge. |
| `logo/lsd-stacked-block-charcoal.png` | PNG 2400x1733, 69.9 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |

All logo SVGs: tight viewBox (no padding, nothing outside the artwork), single flat fills, no `<text>`, no `<image>`, no external refs, no clip paths, transparent background, a `<title>` for accessibility. All text (including the live-text `LEPA . SVAKI . DAN` on pages 3-4, which is Galano in the PDF) is converted to outlines, so no font is needed. The bracket frames are filled outline paths, as in the brandbook.

Naming: `logo-*` = full BEAUTY CONCEPT lockups. `lsd-*` = LEPA SVAKI DAN independent marks (brandbook "LSD nezavisna primena"). `-frame-` = mark inside open brackets with transparent inside. `-block-` = solid rectangle + brackets with a transparent gap between them.

**Colours inside the logo files** (sampled, see tokens): lila `#C6B4E3`, deeper lila `#AF96DB` (only LSD lila marks), ink `#231F20`, gold `#C18F16`, charcoal `#5A5758` / `#322F30`, white `#FFFFFF`.

### graphics/ : swash

| File | Size | What it is | Recommended use |
|---|---|---|---|
| `graphics/swash.svg` | SVG, viewBox 961.24 x 794, 2.7 KB | Calligraphic swash = the T and Y letterforms of the BEAUTY logotype, rotated -36.2 deg and enlarged exactly as the faint ornament on the business card (p8) and folder (p9) mockups. Vector, lila #C6B4E3, uncropped. | Decorative corner ornament. Use at about 30% opacity (that is what the mockup paper shows), bleeding off a section edge. |
| `graphics/swash.png` | PNG 2400x1983, 122.6 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `graphics/swash-faint.svg` | SVG, viewBox 961.24 x 794, 2.6 KB | Identical geometry, pre-tinted to the colour sampled from the folder mockup (#E6E0EE). | Drop-in faint ornament on white / near-white without having to set opacity. |
| `graphics/swash-faint.png` | PNG 2400x1983, 121.4 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |
| `graphics/swash-crop.svg` | SVG, viewBox 664 x 436, 2.7 KB | Identical artwork, viewBox cropped to the card edge exactly as it is visible on the folder mockup (bleeds off bottom and right). | Corner decoration anchored to the bottom-right of a card or section, reproducing the brandbook look 1:1. |
| `graphics/swash-crop.png` | PNG 2400x1576, 78.3 KB | Raster export of the SVG above (transparent, tight crop). | Use when SVG is not possible (email, social, Framer image slot). |

**How the swash was made (and why it is exact).** The ornament on the business card and folder mockups is a raster image in the PDF (JPEG + soft mask), so there is no vector to lift directly. Looking closely, it is not an independent drawing: it is the **T and Y of the BEAUTY logotype**, rotated and enlarged. I proved this numerically instead of tracing: the vector T+Y outlines of the logo (page 3) were fitted to the swash mask extracted from the folder mockup with a similarity transform (rotation -36.2 deg, scale 5.85 mockup pixels per logo point, about 2.8 times the size of the T in the full logo). Overlap (IoU) of the fitted vector outline with the raster mask is **92.3%**; the remainder is JPEG blur and anti-aliasing. So `swash.svg` is the brand's own vector artwork, not a hand-traced approximation. No potrace/tracing was needed. The mockup colour is `#E6E0EE` on paper `#F3F3F3`, equal to lila at roughly 30% opacity.

On the mockups the swash is cut by the edge of the card/folder. `swash.svg` is the whole composition; `swash-crop.svg` reproduces the cut by viewBox only (the paths are the same).

### graphics/ : brackets and divider (stroke based, tint with `color`)

| File | Size | What it is | Recommended use |
|---|---|---|---|
| `graphics/corner-bracket.svg` | SVG, viewBox 245.11 x 173.58, 0.5 KB | Open bracket frame in the brandbook logo-block proportion (245.11 x 173.58, arm = 22.7% of width, stroke 1.61 = measured from p1/p3). Two stroked paths, `stroke="currentColor"`, `fill="none"`. | Frame for any content. Inline the SVG (or use as CSS `mask`) and set `color`. For flexible boxes prefer the pure-CSS helper `.bc-brackets` in tokens/brand.css, which stretches without distorting the stroke. |
| `graphics/corner-bracket-lsd.svg` | SVG, viewBox 125.97 x 90.77, 0.5 KB | Same motif in the proportion used around the stacked LEPA SVAKI DAN mark (125.97 x 90.77, arm 27%, stroke 0.745 = measured from p5). | Thin bracket for compact badges and quote marks. Same currentColor technique. |
| `graphics/divider-hairline-dot.svg` | SVG, viewBox 120 x 6, 0.4 KB | Hairline, gap, dot, gap, hairline (viewBox 120 x 6, hairline 0.514, dot r 2.2). Built from the brandbook hairline weight and bullet size, not a literal export: the brandbook has the dot only inside the text line. | Section divider; `currentColor`. |

### tokens/

| File | Size | What it is | Recommended use |
|---|---|---|---|
| `tokens/brand.css` | CSS, 8.5 KB | Design tokens: sampled brand colours, generated lila scale, semantic aliases, contrast table, `@font-face` (Galano Grotesque Regular 400 + Bold 700), `--font-weight-light`, bracket variables, `.bc-brackets` helper. | Link first in every preview page; everything else in the pack assumes these variable names. |

`brand.css` holds: sampled colours (pixel medians of the swatches of the PDF rendered at 200 dpi, cross-checked with vector fills), generated lila scale `--lila-50 ... --lila-900` (50-300 are white mixes that coincide with the brandbook 20/40/70% tints; 700/800/900 keep the hue of 2645 C and are darkened to 4.6 / 7.5 / 12:1 on white), semantic aliases, a contrast table against ink and white (in the header comment), `@font-face` for Galano Grotesque (relative `../fonts/`), `--font-weight-light`, bracket variables and the `.bc-brackets` helper class.

| Token | Value | Source |
|---|---|---|
| `--lila` | #C6B4E3 (198/180/227) | PANTONE 2635 C, CMYK 20/30/0/0. Swatches p2, p3, p4, p5, p11 |
| `--lila-70` | #D7CAEB | "70% PANTONE 2635 C" swatch p2 |
| `--lila-deep` | #AF96DB (175/150/219) | PANTONE 2645 C, CMYK 31/43/0/0. p5 and p11 |
| `--gold` | #C18F16 | flat GOLD swatch p4 |
| `--gold-foil / -light / -dark` | #D1A671 / #F7E5B9 / #AD7547 | mean / 90th / 10th percentile of the gold-foil texture p11 |
| `--charcoal` | #5A5758 | "75% BLACK" swatch p5 |
| `--charcoal-deep` | #322F30 | dark logo block p1/p2 |
| `--ink` | #231F20 | PANTONE Black C, p11 circle |

Contrast facts the site must respect: ink on lila 8.6:1 (good); **white on lila 1.9:1** (only for the large logo, never small text); lila text on white 1.9:1 (decorative only, use `--lila-700` = #8466BA, 4.6:1, for small lila text).

**Brandbook inconsistency worth knowing:** pp 3-4 print "RGB R88 G89 B91" beside the 2635 C swatch. That triplet is the 75% black, not lila; the sampled lila is 198/180/227.

### fonts/

| File | Size | What it is | Recommended use |
|---|---|---|---|
| `fonts/GalanoGrotesqueBold.woff` | 28.7 KB | Galano Grotesque Bold (700), WOFF (unmodified copy from `lepasvakidrugidan/assets/fonts/`) | Fallback for old browsers |
| `fonts/GalanoGrotesqueBold.woff2` | 24.9 KB | Galano Grotesque Bold (700), WOFF2 (converted from the WOFF with fontTools + brotli, lossless) | Primary @font-face source |
| `fonts/GalanoGrotesqueRegular.woff` | 27.9 KB | Galano Grotesque Regular (400), WOFF (unmodified copy from `lepasvakidrugidan/assets/fonts/`) | Fallback for old browsers |
| `fonts/GalanoGrotesqueRegular.woff2` | 24.6 KB | Galano Grotesque Regular (400), WOFF2 (converted from the WOFF with fontTools + brotli, lossless) | Primary @font-face source |

Both fonts: 458 glyphs, full Serbian Latin (č ć š ž đ and capitals, checked), `•`, `–`, `€`, typographic quotes, OpenType features `ss01-ss05`, `case`, `tnum`, `zero`. **No Cyrillic.** Font file metadata: "Copyright 2014 by Rene Bieder. All rights reserved", version 1.000. This is a commercial typeface: confirm the web-font licence covers the preview/production domain before publishing.

## 3. Warnings and limitations

1. **Galano Grotesque LIGHT (and MEDIUM) are not available.** The brandbook typography page (p12) specifies Light, Regular and Medium; running text and the CONCEPT wordmark are Light (pp 7-8, 12). The PDF embeds Light, Regular and Medium, but only as **subsets of 66 glyphs** (A-Z, a-z, digits, `! ?`; no punctuation, no č ć š ž đ), which are unusable and not licensed for web use. Only Regular and Bold exist in the project. `--font-weight-light: 300` and `--font-weight-medium: 500` are defined and safe to use now: both render as Regular until `GalanoGrotesqueLight.woff2/.woff` (and Medium) are dropped into `fonts/` and the commented `@font-face` in brand.css is enabled. Bold (700) exists in the project but is not a brandbook weight. **The designer should supply Galano Grotesque Light and Medium.**
2. **Gold-foil variants are not extracted.** The 70%-lila block with gold-foil (p2), the gold-foil LSD block (p5) and all foil mockups are raster textures; they cannot be isolated as logo files. The gold in the logo files is the flat `--gold` (#C18F16) of the brandbook two-colour logo, which looks different from the rose/copper foil. For a foil look use `--gradient-gold-foil`.
3. **Every requested variant (a)-(h) was isolated cleanly as vector.** Verified: parsed as XML, rendered in headless Chrome and in MuPDF on light (#FBF9FE), dark (#231F20) and lila (#C6B4E3) backgrounds, alpha bounding box equals the image bounds (0-1 px margin at 2400 px), no background fill (the only opaque pixels in the image corners are the artwork's own bracket and hairline ends), no white boxes, no page edges, no clipped parts.
4. **Derived (not in the brandbook as separate artwork), recolours of the brandbook masters:** `logo-full-white` (white artwork lives inside the lila block on p3), `logo-horizontal-black`, `logo-horizontal-white`, `lsd-stacked-frame-white`, `lsd-line-white`, `logo-block-lila-white-brackets`. Geometry is untouched; only fill colours changed.
5. **Two lilas.** The lila LSD marks (`lsd-*-lila`) use PANTONE 2645 C (#AF96DB) as in the brandbook, the main logo uses 2635 C (#C6B4E3). Keep that distinction or consciously unify.
6. **Minimum sizes (rule of thumb, not from the brandbook).** The 0.5 pt rules and the wide-tracked small caps get faint when small. Keep the tracked caps at least about 7 px tall: full logo and `lsd-line-*` at 180 px wide or more, horizontal lockups 200 px or more, stacked mark 90 px or more. Below that use a single-colour version in ink or white.
7. SVG sizes are in brandbook points (for example 259.8 x 135.6). The files carry `width`/`height` so they have an intrinsic size, but set the real size in CSS.
8. Not included on purpose: Myriad Pro (used by the brandbook only for its own captions), silver foil, the wall-sign / gift-bag / stationery mockups, and any personal data from the brandbook (names, phone, e-mail printed on the stationery mockups and in each page footer).

## 4. How it was produced

- Tooling checked first: `pdftocairo`, `pdftoppm`, `pdfinfo`, `pdfimages` (poppler), PyMuPDF 1.26, Pillow, fontTools + brotli, numpy, OpenCV, SciPy. **Not installed:** mutool, inkscape, ImageMagick, potrace (so nothing was traced with potrace).
- All 13 pages were rendered to PNG at 200 dpi and inspected one by one.
- Logos: `pdftocairo -svg` per page; a small parser flattens glyph `<use>` references into outline paths, selects the elements inside each variant's page region, normalises colours to the sampled palette, crops the viewBox to the exact artwork bounds and writes clean SVG. PNGs are rendered from those SVGs with MuPDF at 2400 px width with alpha.
- Swash: located in the raster of pp 8-9, mask extracted by the blue-minus-green difference of the paper, then fitted against the logo's own T and Y outlines (coarse FFT correlation over rotation/scale/mirror, then Nelder-Mead refinement).
- Fonts: `fontTools` WOFF to WOFF2 (brotli).
- Preview: `preview.html` loads the files with relative paths and `tokens/brand.css`; open it to review everything on light, dark and lila.

## 5. Quick use

```html
<link rel="stylesheet" href="_shared/brand/tokens/brand.css">
<img src="_shared/brand/logo/logo-full-black.svg" alt="Beauty Concept - Lepa Svaki Dan" width="260">
<div class="bc-brackets" style="color: var(--lila)">content in an open bracket frame</div>
<style>.swash{position:absolute;right:0;bottom:0;width:36vw;opacity:.3;pointer-events:none}</style>
<img class="swash" src="_shared/brand/graphics/swash.svg" alt="">
```

---

Pripremio ECHOSYSTEM-MOTHER AGENCY · 2026-10-07
