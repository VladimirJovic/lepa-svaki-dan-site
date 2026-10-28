# COPY_NOTES — suggested NEW UI strings

**Status: NEW copy.** None of the strings below exist on the old site. They are suggestions for the three v2 previews; builders may use them but must treat them as additions (not 1:1 content). Everything else on the pages must come from `content.json`.

Tone note: the old site mixes registers. Hero, quiz and hints use "ti" (Budi, tvoj, Pomeri), booking CTAs use "vi" (Zakažite, Pozovite). Each string below states its register; where it says `neutral` the wording works for both.

| # | id | NEW string | Where it is used | Register |
|---|----|------------|------------------|----------|
| 1 | `bar.message` | Piši nam | Mobile sticky action bar, WhatsApp slot (old UI only has the label "WhatsApp"). | ti |
| 2 | `bar.prices` | Pogledaj cene | Mobile sticky action bar, jumps to #usluge (old UI has "Cenovnik" nav label only). | ti |
| 3 | `bar.where` | Gde smo | Mobile sticky action bar, jumps to #lokacije. There are NO map URLs in the old data, so no "Kako do nas" link is offered. | neutral |
| 4 | `acc.show` | Prikaži usluge | Accordion / expandable group hint (collapsed state), small caption next to the "N usluga" count. | neutral |
| 5 | `acc.hide` | Sakrij usluge | Accordion / expandable group hint (expanded state). | neutral |
| 6 | `acc.openAll` | Otvori sve grupe | Optional toolbar above a price list that has many groups (estetske tab has 8). | neutral |
| 7 | `tabs.swipe` | Prevuci za još kategorija | Mobile hint under horizontally scrollable price-list tabs (5 tabs overflow on phones). | ti |
| 8 | `price.payChip` | Plaćanje u dinarima | Short chip near the price list header; distils the existing payment note (see payment.modal) for people who never open the modal. | neutral |
| 9 | `price.validChip` | Cenovnik važi od {date} | Short chip near the price list header. {date} = pricing.validFrom ("15.03.2026."). | neutral |
| 10 | `search.suggest` | Pokušaj sa: akne, glow, piling | Search empty/idle helper under the search field. Words reuse the examples already in the old placeholder. | ti |
| 11 | `teaser.blogAll` | Svi tekstovi na blogu › | Link under the blog[] teaser row on the home preview. | neutral |
| 12 | `teaser.offersAll` | Svi paketi › | Link under the offers[] teaser row on the home preview. | neutral |

## Existing strings to reuse (NOT new)

The mobile action bar can combine the new labels above with these existing ones:

- "Pozovi" — nav phone menu action (exists)
- "WhatsApp" — nav phone menu action (exists)
- "Zakaži / Zakaži termin ›" — nav CTA (exists)
- "Cenovnik" — nav label (exists)
- "Lokacije" — nav label (exists)
- "Zakaži ovaj paket" — offer card CTA (exists)
- "Pročitaj više ›" — article hint and blog card link (exists)

## Notes for builders

- `{date}` in `price.validChip` must be filled from `content.pricing.validFrom` (currently `15.03.2026.`), never typed by hand.
- There are no map URLs and no per-location opening hours in the old data (`contact.mapUrls` and `locations[].mapUrl` / `locations[].hours` are `null`). Do not add a "Kako do nas" / route button or per-location hours unless the client supplies them. The only hours text is `hero.bar.hours` ("Pon — Sub · 9—21h").
- The same strings are available in `content.json` under `copy.newStrings` (each with `isNew: true`).

---
Pripremio ECHOSYSTEM-MOTHER AGENCY · 2026-10-07
