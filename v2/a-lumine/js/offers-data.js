/* =====================================================================================================
   POSEBNA PONUDA · the data of every offer.   Pripremio ECHOSYSTEM-MOTHER AGENCY

   HOW TO ADD, EDIT OR REMOVE AN OFFER (and its price)
   - EDIT:   change the text between the quotes. The price is one string, "385€ / 45.000 rsd" (EUR, a slash with spaces, RSD). The site SHOWS it dinars first: 45.000 rsd large, 385€ small below (js/price.js).
   - ADD:    copy one whole { ... } block, paste it after the last one (keep the comma between blocks), give it a new id and slug.
   - REMOVE: delete its whole { ... } block (and the comma next to it).
   - ORDER:  the first block is shown as the large feature card, the others follow in this order.
   - The home page teaser and the page posebna-ponuda.html both read this list, so one edit changes both after a refresh.
   - After editing, run: node _tools/a/build-pages.mjs   (it re-renders the readable-without-JS copy of the page AND the search index from this file).

   FIELDS of one offer
     id, slug     unique names. The slug is the address of the card: posebna-ponuda.html#ponuda-<slug>
     tag          small label above the title
     title        name of the package
     includes     what the package includes (one sentence)
     price        "385€ / 45.000 rsd"   EUR, a slash with spaces around it, RSD
     oldPrice     optional crossed-out price, same pattern, or null
     validity     optional validity wording, e.g. "Važi do 30.11.2026.", or null. Shown only when filled in, so no validity is claimed otherwise
     note         optional small extra line, or null
     cenovnikRef  { id: "protokoli:2:1" } the price-list group (or service) of the package; it gives the link "U cenovniku"
     cta          { label: "Zakaži ovaj paket" } text of the button. It opens the small sheet with both numbers (call or WhatsApp); the WhatsApp text is the ready message
                  "Zdravo, zanima me paket „<title>“ i želim da zakažem termin."
                  No address is stored or shown per package: the exact location is agreed on the phone (one price list, client wish).

   Seeded once from the content pack (_shared/content/content.json, offers[]). This file is now the place to edit: the builder never
   overwrites it. Delete the file to seed it again from the pack.
   ===================================================================================================== */
window.LSD_CONTENT = window.LSD_CONTENT || {};
window.LSD_CONTENT.offers = [
  {
    id: "offer-1",
    slug: "instant-glow-up",
    tag: "Sezonski paket",
    title: "Instant Glow Up",
    includes: "Sublime laser + PROFHILO ili LOLA, brz i vidljiv rezultat pre važnog događaja.",
    price: "385€ / 45.000 rsd",
    oldPrice: null,
    validity: null,
    note: null,
    cenovnikRef: { id: "protokoli:1:5" },
    cta: { label: "Zakaži ovaj paket" }
  },
  {
    id: "offer-2",
    slug: "wedding-ready",
    tag: "Za venčanje",
    title: "Wedding Ready",
    includes: "Venus Legacy čitavog tela, Fresh Up tretman lica, limfna drenaža, Myolift masaža.",
    price: "255€ / 30.000 rsd",
    oldPrice: null,
    validity: null,
    note: "Dostupan i paket za 2 osobe, 428€ / 50.000 rsd.",
    cenovnikRef: { id: "protokoli:2:2" },
    cta: { label: "Zakaži ovaj paket" }
  },
  {
    id: "offer-3",
    slug: "new-mum-recharge",
    tag: "Za mame",
    title: "New Mum Recharge",
    includes: "Presoterapija + Dermafacial / Venus Glow + masaža lica, vrata i dekoltea.",
    price: "85€ / 10.000 rsd",
    oldPrice: null,
    validity: null,
    note: null,
    cenovnikRef: { id: "protokoli:2:1" },
    cta: { label: "Zakaži ovaj paket" }
  },
  {
    id: "offer-4",
    slug: "celo-telo",
    tag: "Summer Body Ready",
    title: "Celo telo",
    includes: "Venus Legacy tela, boosteri + 6× presoterapija.",
    price: "885€ / 103.700 rsd",
    oldPrice: null,
    validity: null,
    note: null,
    cenovnikRef: { id: "protokoli:3:6" },
    cta: { label: "Zakaži ovaj paket" }
  }
];
