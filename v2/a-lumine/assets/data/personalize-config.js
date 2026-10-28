/* =====================================================================================================
   LEPA SVAKI DAN · "A" preview · PERSONALISED OFFER ("nagradna igra"): THE CONFIGURATION
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   WHAT THIS IS (client feedback 3, "Dodatne funkcionalnosti"): a visitor who looks for a topic on the site (searches it, reads a text about it, opens its price-list groups, stays on
   them) gets a small surprise: a card "Iznenađenje za vas" with a button "Otkrij", which reveals an offer of 10% for exactly the treatments the visitor was looking at
   ("Ukoliko traži ili uđe na tekst ili pregled usluga o aknama: 10% popusta na tretmane protiv akni").
   Maintaining and sharing the discounts is to be agreed with Tamara afterwards. THIS FILE IS THE ONLY PLACE with the wording, the percentages, the codes and the rules, so nothing
   needs changing in the code when the real terms exist.

   HOW IT WORKS (js/personalize.js, no cookies, no server, no third party)
   - Every action of the visitor that shows interest in a TOPIC adds points to that topic: a question that the hidden vocabulary of the search answers ("akne", "ožiljci od akni"),
     opening a text or a page of a segment about it, opening a price-list group of it, and DWELL TIME (about 25 seconds actively on such a text, page or group; a background
     tab or a visitor who stopped moving does not count).
   - ONLY the points per topic are stored, in the browser of the visitor (localStorage, key "lsd-interest-v1"), together with which offer was shown, opened or switched off.
     The words of a question are never stored. Points are forgotten after "forgetDays" days.
   - When ONE topic reaches "threshold" points and was not shown or switched off before, the card appears (bottom left; on a phone above the action bar). "Otkrij" opens a dialog
     that reveals the offer: the headline, 2 to 4 price-list groups as links, the code, the validity line, "Zakaži preko WhatsApp-a" (with a prefilled message, the visitor chooses
     one of the two numbers) and "Ne prikazuj više".

   HOW TO TEST IT (harmless in production: it only shows to the visitor what the visitor could earn anyway)
     index.html?demo-iznenadjenje=akne                  shows the card for the topic "akne" at once (any topic id below; the points are not touched)
     index.html?demo-iznenadjenje=akne&otkrij           and opens the dialog with the reveal
     index.html?reset-interest                          clears the stored points and the session limit, then continues normally
   (on every page of the site, not only the home).

   WHEN THE REAL TERMS EXIST
     1. set  demo: false   (the badge "Primer ponude" and the note about terms in preparation disappear everywhere),
     2. change "discount" per topic, "code", the "validity" line and the "copy" below. Codes, percentages and wording are examples until Tamara confirms them.
   HOW TO ADD A TOPIC: copy one block of "topics", give it a new "id", list the hidden-vocabulary entries ("entries": ids from _shared/content/search-synonyms.json), the price-list
   groups ("groups": "tab:index", as in the price list) and the texts ("articles": art-N) that belong to it, and the 2 to 4 groups of the dialog ("offerGroups"); the segment
   pages that lead to it are listed in "segments" at the end of this file.
   _tools/a/check-pages.mjs refuses a topic that points at something that does not exist.
   Honest mapping: a topic only lists what the site itself says about it. No treatment is invented and no medical promise is made in the wording.
   ===================================================================================================== */
window.LSD_PERSONALIZE = {
  /* ONE flag: true = the offers are shown as an EXAMPLE ("Primer ponude", the terms are being finalised); false = the real thing */
  demo: true,

  storageKey: 'lsd-interest-v1',
  forgetDays: 30,                 // the points of a visitor who was away longer than this are forgotten
  threshold: 4,                   // points one topic needs before the card appears

  /* POINTS. A question counts once its answer settled (the visitor stopped typing) and is scored by how the hidden vocabulary answered it:
     search x (how exactly it was asked, 0.3 to 1) x (strength of the entry: strong 1, medium 0.85, weak 0.5). "searchGroup" is for a question that no hidden entry answered but whose
     first groups belong to the topic ("dermapen"). A question typed again within "burstSeconds" (the visitor is still typing / correcting) only adds the difference.
     Texts, segments and groups count once per browser session each. */
  weights: {
    search: 2.5,
    searchGroup: 1,
    article: 2.5,
    segment: 0.75,
    group: 1.5,
    dwell: 1.5,
    burstSeconds: 12
  },
  /* DWELL TIME: "seconds" of ACTIVE time (the tab is visible and there was a pointer, key, touch or scroll event in the last "idleSeconds") on a text or segment page of the topic, or with an open
     price-list group of the topic on screen (at least "minVisible" of it), give "weights.dwell" points; again for every further "seconds", at most "max" times per page view. */
  dwell: { seconds: 25, idleSeconds: 8, max: 3, minVisible: 0.4 },
  /* THE CARD: shown "delayMs" after the topic reached the threshold (and when nothing else is open), counted as shown after "minVisibleMs" on screen, and at most "maxPerSession"
     cards in one browser session (a visitor is never nagged). After "Otkrij" a small round button "Vaše iznenađenje" stays at the same place until "Ne prikazuj više". */
  card: { delayMs: 1600, minVisibleMs: 4000, maxPerSession: 1 },

  /* ALL WORDING. {discount}, {offer}, {interest}, {code}, {headline} are filled from the topic. */
  copy: {
    cardTitle: 'Iznenađenje za vas',
    cardSub: 'Za tretmane koje ste razgledali',
    cardOpen: 'Otkrij',
    cardClose: 'Zatvori iznenađenje',
    miniLabel: 'Vaše iznenađenje',
    eyebrow: 'Iznenađenje za vas',
    headline: '{discount}% popusta na {offer}',
    body: 'Pogledali ste {interest}, pa smo za vas pripremili popust. Izaberite grupu ispod, a pravi tretman biramo zajedno.',
    groupsTitle: 'Tretmani na koje važi popust',
    codeLabel: 'Šifra ponude',
    validity: 'Rok važenja i način korišćenja popusta dogovaramo prilikom zakazivanja.',
    book: 'Zakaži preko WhatsApp-a',
    hide: 'Ne prikazuj više',
    close: 'Zatvori',
    demoBadge: 'Primer ponude',
    demoNote: 'Ovo je primer: uslovi, rok važenja i deljenje popusta se još definišu.',
    wa: 'Zdravo, zanima me ponuda „{headline}“ (šifra {code}) sa vašeg sajta i želim da zakažem termin.',
    waLabel: 'Ponuda: {headline}, šifra {code}'
  },

  /* THE TOPICS. entries = hidden-vocabulary entries of the search (search-synonyms.json) · groups = price-list groups of the topic · articles = texts (blog/*.html) ·
     offerGroups = the 2 to 4 groups the dialog links to */
  topics: [
    { id: 'akne', label: 'Akne i čista koža', offer: 'tretmane protiv akni', interest: 'tretmane za akne i čistu kožu', discount: 10, code: 'LSD-AKNE-10',
      entries: ['akne', 'lecenje-akni', 'oziljci-od-akni', 'oziljci', 'cista-koza', 'q-pore'],
      groups: ['lice:0', 'lice:3', 'estetske:5'], articles: ['art-11', 'art-10', 'art-1', 'art-2'],
      offerGroups: ['lice:0', 'lice:3', 'estetske:5'] },
    { id: 'glow', label: 'Glow i blistava koža', offer: 'tretmane za blistavu kožu', interest: 'tretmane za blistavu kožu', discount: 10, code: 'LSD-GLOW-10',
      entries: ['glass-skin', 'blistava-koza', 'ciscenje-lica'],
      groups: ['lice:2', 'lice:1', 'protokoli:0'], articles: ['art-14', 'art-13', 'art-9'],
      offerGroups: ['lice:2', 'lice:1', 'protokoli:0'] },
    { id: 'ten', label: 'Pigmentne mrlje', offer: 'tretmane za pigmentne mrlje', interest: 'tretmane za pigmentne mrlje', discount: 10, code: 'LSD-TEN-10',
      entries: ['pigmentacija', 'flekice'],
      groups: ['estetske:5', 'lice:3', 'lice:5'], articles: ['art-1', 'art-10', 'art-13'],
      offerGroups: ['lice:3', 'lice:5', 'estetske:5'] },
    { id: 'antiaging', label: 'Anti-aging i bore', offer: 'anti-aging tretmane', interest: 'anti-aging tretmane i bore', discount: 10, code: 'LSD-ANTIAGING-10',
      entries: ['bore', 'anti-age', 'podmladjivanje', 'lifting', 'q-zatezanje-bez-operacije'],
      groups: ['protokoli:1', 'estetske:3', 'estetske:4', 'lice:5', 'lice:6', 'lice:7'], articles: ['art-5', 'art-8', 'art-12', 'art-15'],
      offerGroups: ['protokoli:1', 'estetske:3', 'lice:7', 'lice:6'] },
    { id: 'botoks-fileri', label: 'Botoks i fileri', offer: 'botoks i hijaluronske filere', interest: 'botoks i filere', discount: 10, code: 'LSD-BOTOKS-10',
      entries: ['botoks', 'fileri', 'usne', 'q-priprema-botoks'],
      groups: ['estetske:2', 'estetske:1'], articles: ['art-6', 'art-7'],
      offerGroups: ['estetske:2', 'estetske:1'] },
    { id: 'telo', label: 'Oblikovanje tela i celulit', offer: 'tretmane za oblikovanje tela', interest: 'oblikovanje tela i celulit', discount: 10, code: 'LSD-TELO-10',
      entries: ['celulit', 'kako-smanjiti-obim', 'oblikovanje-tela', 'strije'],
      groups: ['telo:3', 'telo:4', 'telo:0', 'protokoli:3'], articles: ['art-16', 'art-17', 'art-20'],
      offerGroups: ['telo:3', 'telo:4', 'telo:0', 'protokoli:3'] },
    { id: 'kosa', label: 'Kosa', offer: 'tretmane za kosu', interest: 'tretmane za kosu', discount: 10, code: 'LSD-KOSA-10',
      entries: ['kosa', 'opadanje-kose'],
      groups: ['estetske:7'], articles: ['art-4'],
      offerGroups: ['estetske:7', 'estetske:4'] },
    { id: 'laser', label: 'Laserska epilacija', offer: 'lasersku epilaciju', interest: 'lasersku epilaciju', discount: 10, code: 'LSD-LASER-10',
      entries: ['trajno-uklanjanje-dlacica', 'depilacija', 'q-urasle-dlacice', 'q-laser-bolan'],
      groups: ['laserska:0', 'laserska:1', 'laserska:2', 'laserska:3', 'laserska:4'], articles: ['art-21'],
      offerGroups: ['laserska:0', 'laserska:1', 'laserska:2', 'laserska:3'] },
    { id: 'relaks', label: 'Masaže i relaksacija', offer: 'masaže', interest: 'masaže i opuštanje', discount: 10, code: 'LSD-RELAKS-10',
      entries: ['masaza', 'relaks', 'ledja', 'ukljesteni-vrat', 'rastezanje'],
      groups: ['telo:2', 'telo:5'], articles: ['art-18'],
      offerGroups: ['telo:2', 'telo:5'] },
    { id: 'drenaza', label: 'Presoterapija i detoks', offer: 'presoterapiju', interest: 'presoterapiju i detoks', discount: 10, code: 'LSD-DRENAZA-10',
      entries: ['presoterapija', 'q-tesko-noge', 'detoks', 'mrsavljenje'],
      groups: ['telo:1', 'estetske:6'], articles: ['art-19'],
      offerGroups: ['telo:1', 'estetske:6'] }
  ],

  /* A SEGMENT PAGE (tretmani/*.html) is an overview of many topics: it counts a little ("weights.segment") for each topic listed here, and dwell time on it counts for each of them. */
  segments: {
    dermatologija: ['akne', 'kosa', 'ten'],
    estetske: ['botoks-fileri', 'antiaging'],
    kozmetika: ['akne', 'glow', 'ten', 'antiaging'],
    telo: ['telo', 'laser', 'relaks', 'drenaza']
  }
};
