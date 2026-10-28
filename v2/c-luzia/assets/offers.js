/* =====================================================================================================
   POSEBNA PONUDA (special offers): the data behind posebna-ponuda.html and the offers teaser on the home page.
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   HOW TO ADD, EDIT OR REMOVE AN OFFER AND ITS PRICE
   - ADD:     copy one whole { ... } block below (keep a comma between blocks), paste it where it should appear (the order here is the
              order on the page), and give it a NEW unique "id" and "slug" (slug = lowercase letters, digits and dashes; it becomes the #anchor).
   - EDIT:    change the text between the quotes. "price" is written "385€ / 45.000 rsd" = EUR, a space, a slash, a space, RSD
              (keep the " / " separator, the page splits the price on it). "includes" is the short description of the package.
   - REMOVE:  delete the whole { ... } block (and its comma, so the list stays valid).
   - OPTIONAL fields (leave null to hide): "oldPrice" (same format as price, shown struck through), "validity" (a sentence such as
              "Važi do kraja meseca"; nothing is shown unless it is filled in), "note" (small line under the price),
              "featured": true (the one highlighted lila card; use it on a single offer), "cenovnikRef" (link to the price-list
              line: id is the service id such as "protokoli:2:2"; set the whole cenovnikRef to null to hide the link).
   - The WhatsApp button text is built from the title: no extra field is needed.
   The pages read THIS file directly, so a saved edit shows up on a reload. To refresh the pre-rendered copy (the version that works
   without JavaScript) run:  node _tools/c/build-pages.mjs
   ===================================================================================================== */
window.LSD_CONTENT = window.LSD_CONTENT || {};
window.LSD_CONTENT.offers = [
  {
    "id": "offer-1",
    "slug": "instant-glow-up",
    "tag": "Sezonski paket",
    "title": "Instant Glow Up",
    "includes": "Sublime laser + PROFHILO ili LOLA, brz i vidljiv rezultat pre važnog događaja.",
    "price": "385€ / 45.000 rsd",
    "oldPrice": null,
    "validity": null,
    "note": null,
    "featured": false,
    "cta": {
      "label": "Zakaži ovaj paket",
      "href": "https://wa.me/381648239439"
    },
    "cenovnikRef": {
      "id": "protokoli:1:5",
      "tab": "protokoli",
      "group": "Anti-aging protokoli",
      "name": "INSTANT GLOW UP"
    }
  },
  {
    "id": "offer-2",
    "slug": "wedding-ready",
    "tag": "Za venčanje",
    "title": "Wedding Ready",
    "includes": "Venus Legacy čitavog tela, Fresh Up tretman lica, limfna drenaža, Myolift masaža.",
    "price": "255€ / 30.000 rsd",
    "oldPrice": null,
    "validity": null,
    "note": "Dostupan i paket za 2 osobe, 428€ / 50.000 rsd.",
    "featured": true,
    "cta": {
      "label": "Zakaži ovaj paket",
      "href": "https://wa.me/381648239439"
    },
    "cenovnikRef": {
      "id": "protokoli:2:2",
      "tab": "protokoli",
      "group": "Posebna stanja i prilike",
      "name": "WEDDING READY"
    }
  },
  {
    "id": "offer-3",
    "slug": "new-mum-recharge",
    "tag": "Za mame",
    "title": "New Mum Recharge",
    "includes": "Presoterapija + Dermafacial / Venus Glow + masaža lica, vrata i dekoltea.",
    "price": "85€ / 10.000 rsd",
    "oldPrice": null,
    "validity": null,
    "note": null,
    "featured": false,
    "cta": {
      "label": "Zakaži ovaj paket",
      "href": "https://wa.me/381648239439"
    },
    "cenovnikRef": {
      "id": "protokoli:2:1",
      "tab": "protokoli",
      "group": "Posebna stanja i prilike",
      "name": "NEW MUM RECHARGE"
    }
  },
  {
    "id": "offer-4",
    "slug": "celo-telo",
    "tag": "Summer Body Ready",
    "title": "Celo telo",
    "includes": "Venus Legacy tela, boosteri + 6× presoterapija.",
    "price": "885€ / 103.700 rsd",
    "oldPrice": null,
    "validity": null,
    "note": null,
    "featured": false,
    "cta": {
      "label": "Zakaži ovaj paket",
      "href": "https://wa.me/381648239439"
    },
    "cenovnikRef": {
      "id": "protokoli:3:6",
      "tab": "protokoli",
      "group": "Summer Body Ready protokoli",
      "name": "CELO TELO"
    }
  }
];
