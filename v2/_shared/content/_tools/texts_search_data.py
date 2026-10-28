# -*- coding: utf-8 -*-
"""texts_search_data.py: curated entries of the HIDDEN search vocabulary (search-synonyms.json).

Women look for treatments the way they ask for them ("glass skin", "kako smanjiti obim"), not the way the
price list names them. Each entry maps phrase variants to groups / services / articles / offers that REALLY
support the phrase. build-texts-pack.py proves it: every target must contain one of the entry's `terms`
(regex on diacritics-folded lowercase text) in its own name/description/title/text, or be linked (primary or
related, see service-links.json) to a targeted article whose text contains the term. No proof, no build.

Phrases are written with diacritics; the builder adds the folded (ASCII) variant of every phrase.
Group ids "<tab>:<group index>", service ids "<tab>:<group index>:<service index>", article keys as in texts_curation.py.
No literal em dash / en dash characters in this file.
ECHOSYSTEM-MOTHER AGENCY
"""


def E(id, phrases, terms, groups=(), services=(), articles=(), offers=(), strength='strong', note='',
      service_scan=None, direct_evidence=True, gift_services=False, caution=None):
    return dict(id=id, phrases=list(phrases), terms=list(terms), groups=list(groups), services=list(services),
                articles=list(articles), offers=list(offers), strength=strength, note=note,
                service_scan=service_scan, direct_evidence=direct_evidence, gift_services=gift_services, caution=caution)


def SCAN(tabs, pattern, field='namedesc'):
    return dict(tabs=list(tabs), pattern=pattern, field=field)


LASER_GROUPS = ['laserska:0', 'laserska:1', 'laserska:2', 'laserska:3', 'laserska:4']

ENTRIES = [
    E('glass-skin', ['glass skin', 'glasskin', 'glas skin', 'staklena koža', 'staklasta koža'],
      [r'blistav', r'sjaj', r'hidrat', r'hydrat', r'glow', r'osvez'],
      groups=['lice:2'], services=['lice:2:0', 'lice:1:6'], articles=['glow', 'preime', 'biorev'], strength='medium',
      note='Trend term the site never uses. Mapped to the treatments whose own text promises deep hydration and a glowing, fresh look (Venus Glow, Dermafacial, biorevitalization). No promise of a specific result.'),

    E('blistava-koza', ['blistava koža', 'blistav ten', 'sjajna koža', 'sjaj kože', 'glow', 'glow koža', 'glow efekat', 'instant glow'],
      [r'blistav', r'sjaj', r'glow'],
      groups=['lice:2', 'protokoli:0'],
      services=['lice:2:0', 'lice:2:2', 'lice:1:6', 'lice:1:8', 'lice:1:10', 'protokoli:0:0', 'protokoli:0:2'],
      articles=['glow', 'preime', 'biorev'], offers=['offer-1'],
      note='The old site already ties "glow", "sjaj" and "blista" to its #glow tag. Mapped to the Glow protocols and Venus Glow / Dermafacial, plus the Instant Glow Up offer (its own title says "Glow Up").'),

    E('ciscenje-lica', ['čišćenje lica', 'dubinsko čišćenje', 'dubinsko čišćenje lica', 'čišćenje pora', 'čišćenje kože', 'higijenski tretman', 'higijenski tretman lica', 'higijenski', 'komedoekspresija'],
      [r'cisc', r'cist'],
      groups=['lice:0', 'lice:2'],
      services=['lice:0:0', 'lice:0:1', 'lice:0:2', 'lice:0:3', 'lice:0:4', 'lice:2:0', 'lice:1:5'],
      articles=['higijenski', 'glow', 'preime'],
      note='Hygienic treatments are the classic facial cleansing (peeling, comedone extraction, hydration); Venus Glow and Dermafacial are described as deep pore cleansing; SKIN DETOX lists "dubinsko čišćenje".'),

    E('cista-koza', ['čista koža', 'clear skin', 'bistra koža', 'čist ten'],
      [r'cist', r'cisc', r'akn'],
      groups=['lice:0', 'lice:2'],
      services=['lice:0:0', 'lice:0:1', 'lice:0:2', 'lice:0:3', 'lice:0:4', 'lice:2:0', 'estetske:5:5'],
      articles=['higijenski', 'glow', 'dermapen'], strength='medium',
      note='The old site maps "čista koža" and "clear skin" to its #akne tag. Mapped to the cleansing treatments plus the Candela acne treatment; the peel text mentions pore cleansing and acne.'),

    E('akne', ['akne', 'akni', 'akna', 'bubuljice', 'bubuljica', 'mitiseri', 'mitisera', 'problematična koža'],
      [r'akn', r'bubulj', r'mitiser'],
      groups=['lice:0', 'lice:3', 'estetske:5'],
      services=['estetske:5:5', 'lice:0:0', 'lice:0:1', 'lice:0:2', 'lice:0:3', 'lice:0:4', 'lice:3:0', 'lice:3:1', 'lice:3:5'],
      articles=['higijenski', 'dermapen', 'klasicna', 'candela'],
      note='Acne is cosmetic care (hygienic treatments, chemical peels: "ublažavanje") and a dermatological problem (exam, Candela Nordlys acne treatment). No cure is promised anywhere in the texts.'),

    E('lecenje-akni', ['lečenje akni', 'lečenje akni na licu', 'kako da se rešim akni', 'kako se leče akne', 'tretman akni', 'tretman akne'],
      [r'akn'],
      groups=['estetske:5'], services=['estetske:5:5', 'estetske:5:0', 'estetske:5:1'],
      articles=['klasicna', 'candela', 'higijenski', 'dermapen'], strength='medium',
      note='The old site maps "lečenje akni" to #akne. Medical treatment = dermatologist exam and the Candela Nordlys acne treatment; the cosmetic texts only say hygienic treatments and peels "ublažavaju".'),

    E('oziljci-od-akni', ['ožiljci od akni', 'ožiljci posle akni', 'ozilci od akni'],
      [r'ozilj'],
      groups=['estetske:5', 'lice:5', 'lice:3'], services=['estetske:5:6', 'lice:5:0', 'lice:5:1'],
      articles=['candela', 'dermapen'],
      note='"ozilci" is the shorthand used in the brief, kept as a variant. Candela Nordlys Frax is the only price-list line that names acne scars; the Dermapen / peel article says the combination reduces scars from acne.'),

    E('oziljci', ['ožiljci', 'ožiljak', 'ožiljaka', 'ozilci'],
      [r'ozilj'],
      groups=['estetske:5', 'lice:5', 'lice:3'], services=['estetske:5:6', 'lice:5:0', 'lice:5:1'],
      articles=['candela', 'dermapen', 'klasicna'], strength='medium',
      note='Generic scars: same treatments as acne scars. Wording of the texts: Dermapen "redukcija ožiljaka", Candela "uklanjanje ... ožiljaka", aesthetic dermatology "laserski tretmani za ... ožiljaka". No removal is promised.'),

    E('pigmentacija', ['pigmentacija', 'pigmentacije', 'hiperpigmentacija', 'hiperpigmentacije', 'pigmentne mrlje', 'pigmentne fleke'],
      [r'pigment'],
      groups=['estetske:5', 'lice:3', 'lice:5'], services=[],
      articles=['candela', 'dermapen', 'preime', 'klasicna'], strength='medium',
      note='The texts mention pigmentation for Candela lasers, chemical peels with Dermapen, Dermafacial and aesthetic dermatology. No price-list service is named after pigmentation, so only groups are mapped (the device or peel is decided at the consultation).'),

    E('flekice', ['flekice', 'flekica', 'fleke', 'fleka', 'pigmentne fleke'],
      [r'flek'],
      groups=['lice:2', 'estetske:5'], services=['lice:2:3', 'lice:2:4'], articles=['preime', 'candela'], strength='medium',
      note='Dermafacial text: "smanjenju mitisera i flekica"; Candela GentleLaser text: "pigmentih fleka". No price-list line is named after spots.'),

    E('bore', ['bore', 'bora', 'borice', 'bore na licu', 'fine linije', 'sitne bore', 'mimične bore', 'nazolabijalne bore'],
      [r'\bbor[aeiu]\b'],
      groups=['estetske:2', 'lice:6', 'lice:7'], services=['estetske:2:0', 'estetske:2:1', 'estetske:2:2'],
      articles=['botoks', 'vllice', 'myolift', 'biorev', 'dermapen', 'preime', 'fileri'],
      note='Botox wrinkle correction is the direct match (service names say "Korekcija bora"); the other articles describe softening, smoothing or reducing wrinkles in their own words.'),

    E('anti-age', ['anti age', 'anti-age', 'antiage', 'anti aging', 'anti-aging', 'antiaging', 'anti ejdž', 'starenje', 'znaci starenja', 'znakovi starenja', 'prvi znaci starenja'],
      [r'anti.?ag', r'staren'],
      groups=['protokoli:1', 'estetske:3', 'lice:5'],
      services=['protokoli:1:0', 'protokoli:1:1', 'protokoli:1:2', 'protokoli:1:3', 'protokoli:1:4', 'protokoli:1:5', 'lice:5:0', 'lice:5:2', 'lice:5:4'],
      articles=['biorev', 'botoks', 'fileri', 'myolift', 'dermapen', 'vltelo', 'glow'],
      note='The price-list group "Anti-aging protokoli" is the direct match; Dermapen lines say "anti-aging" in their name or description; the articles use "anti-aging" or "znaci starenja".'),

    E('podmladjivanje', ['podmlađivanje', 'podmlađivanje lica', 'podmlađivanje kože', 'podmladiti lice', 'pomlađivanje', 'pomladiti se'],
      [r'podmlad', r'pomlad'],
      groups=['lice:5', 'lice:2', 'estetske:3'], services=['lice:5:0', 'lice:2:3', 'lice:2:4'],
      articles=['dermapen', 'preime', 'biorev', 'fileri'],
      note='Dermapen text: "najdelotvornija metoda za podmlađivanje kože"; Dermafacial title: "sofisticirano podmlađivanje kože"; biorevitalization and fillers use the same word.'),

    E('lifting', ['lifting', 'lifting lica', 'lifting vrata', 'lifting niti', 'nehirurški lifting', 'zatezanje kože', 'zatezanje lica', 'zatezanje', 'podizanje lica', 'podizanje obrva', 'mezoniti', 'niti'],
      [r'lift', r'zatez', r'zategn', r'niti'],
      groups=['estetske:4', 'lice:6', 'telo:0'],
      services=['estetske:4:0', 'estetske:4:1', 'estetske:4:2', 'lice:7:9', 'protokoli:1:4'],
      articles=['niti', 'vllice', 'vltelo', 'myolift', 'preime'],
      note='Threads ("Lifting nitima") are the surgical-free lifting; Venus Legacy is described as tightening and lifting of face and body; Myolift and Dermafacial (radiowave lifting) also use the word.'),

    E('botoks', ['botoks', 'botox', 'botulin', 'botulinski toksin', 'botoks tretman', 'botox tretman'],
      [r'botox', r'botoks', r'botulin'],
      groups=['estetske:2'],
      services=['estetske:2:0', 'estetske:2:1', 'estetske:2:2', 'estetske:2:3', 'estetske:2:4', 'estetske:2:5', 'estetske:1:4', 'estetske:1:5', 'estetske:1:6'],
      articles=['botoks'],
      note='Whole price-list group "Botox tretman" plus the three filler-group packages that include Botox.'),

    E('fileri', ['fileri', 'filer', 'hijaluron', 'hijaluronski fileri', 'hijaluronska kiselina', 'hijaluronidaza'],
      [r'filer', r'hijaluron'],
      groups=['estetske:1'],
      services=['estetske:1:0', 'estetske:1:1', 'estetske:1:2', 'estetske:1:3', 'estetske:1:4', 'estetske:1:5'],
      articles=['fileri'],
      note='Price-list group "Hijaluronski fileri" (the "Botox + Profhilo" line is not a filler and stays out).'),

    E('usne', ['usne', 'usana', 'povećanje usana', 'volumen usana', 'korekcija usana', 'punije usne', 'lip filler', 'lip flip'],
      [r'\busn', r'\busan', r'\blip\b'],
      groups=['estetske:1'], services=['estetske:1:1', 'estetske:2:3', 'protokoli:1:2'], articles=['fileri'],
      note='"Hijaluron 0.55ml, usne" and the article section "Korekcija usana" are the direct match. LIP FLIP is a Botox treatment of the upper lip and PLUMP IT UP includes a Myolift of the lips: both only share the body part, no volume is promised.'),

    E('kosa', ['kosa', 'kose', 'kosu', 'za kosu', 'tretman kose', 'rast kose', 'skalp', 'teme', 'vlasište'],
      [r'\bkos[aeiu]\b', r'skalp', r'teme\b'],
      groups=['estetske:7', 'estetske:4'],
      services=['estetske:7:0', 'estetske:7:1', 'estetske:7:2', 'estetske:7:3', 'estetske:7:4', 'estetske:7:5', 'estetske:4:1', 'estetske:4:2'],
      articles=['skalp', 'klasicna'],
      note='Price-list group "Rast kose" plus the two thread/mesotherapy lines that name hair ("lice ili kosa"). The dermatologist text lists hair among the things a dermatologist treats.'),

    E('opadanje-kose', ['opadanje kose', 'opada mi kosa', 'opadanje kose kod žena', 'gubitak kose', 'alopecija', 'ćelavost', 'proređena kosa'],
      [r'opadanj', r'alopecij'],
      groups=['estetske:7'], services=['estetske:7:2', 'estetske:7:3', 'estetske:7:4', 'estetske:7:5', 'estetske:5:0'],
      articles=['skalp', 'klasicna'],
      note='PRP and mesotherapy of the scalp are the treatments the article ties to active hair loss; the dermatologist text lists alopecia. The exosome lines are not mapped (the text does not mention them).'),

    E('celulit', ['celulit', 'celulita', 'anticelulit', 'anti celulit', 'anticelulit masaža', 'narandžasta kora', 'cellulite'],
      [r'celulit'],
      groups=['telo:3', 'telo:4', 'telo:0', 'telo:2', 'estetske:4'],
      services=['telo:2:4', 'telo:2:5', 'telo:3:0', 'telo:3:1', 'telo:3:2', 'telo:3:3', 'estetske:4:3', 'estetske:4:4'],
      articles=['awt', 'medcontour', 'vltelo', 'neguj'],
      note='AWT ("Anticelulit" in the group title), Med Contour, Venus Legacy body, the anticelulit massages and the mesotherapy of cellulite all say celulit in their own text.'),

    E('kako-smanjiti-obim', ['kako smanjiti obim', 'smanjiti obim', 'smanjenje obima', 'smanjenje obima tela', 'obim butina', 'obim struka', 'obim stomaka', 'skinuti centimetre'],
      [r'\bobim', r'masnih naslag', r'masne naslag'],
      groups=['telo:4', 'telo:0', 'telo:3'], services=['telo:4:0', 'telo:4:1', 'telo:4:2', 'telo:4:3', 'telo:4:4'],
      articles=['medcontour', 'vltelo', 'awt'], strength='medium',
      note='Site wording: Med Contour "razbija masne naslage" (price-list group "Smanjenje masnih naslaga"), AWT "topljenje masnih naslaga", Venus Legacy "smanjeni obim". No centimetre result is promised.'),

    E('mrsavljenje', ['mršavljenje', 'smršati', 'gubitak kilograma', 'skidanje kilograma', 'dijeta', 'proces mršavljenja'],
      [r'mrsav', r'diet', r'kilogram'],
      groups=['telo:1', 'telo:5'], services=['telo:5:0', 'telo:1:0', 'telo:1:1', 'telo:1:2', 'telo:1:3', 'telo:1:4'],
      articles=['proballancer', 'neguj'], strength='medium',
      note='Mapped by the site\'s own wording only ("pomaže mršavljenje", "Kick Start Diet", "u procesu mršavljenja"). Not medical advice, no weight-loss promise.'),

    E('oblikovanje-tela', ['oblikovanje tela', 'preoblikovanje tela', 'body contouring', 'body contour', 'oblikovanje figure', 'konture tela', 'konturisanje tela'],
      [r'oblikovan'],
      groups=['telo:4', 'telo:3', 'telo:0'],
      services=['telo:3:0', 'telo:3:1', 'telo:3:2', 'telo:3:3', 'telo:4:0', 'telo:4:1', 'telo:4:2', 'telo:4:3', 'telo:4:4'],
      articles=['medcontour', 'vltelo', 'neguj'],
      note='Med Contour is titled "tretman za oblikovanje tela", Venus Legacy "preoblikovanje i zatezanje tela", the AWT group "preoblikovanje"; the care article names "smanjenje celulita i oblikovanje tela".'),

    E('depilacija', ['depilacija', 'depilirati', 'depiliranje', 'brijanje', 'uklanjanje dlaka', 'dlake'],
      [r'depil', r'epilac', r'dlaci'],
      groups=LASER_GROUPS, articles=['velocity'], strength='medium',
      note='The site offers no waxing or classic depilation: its only hair removal is laser epilation (Venus Velocity). The article itself compares it with depilation ("smanjuje troškove depilacije"). Mapped at group level so the whole laser price list shows.'),

    E('trajno-uklanjanje-dlacica', ['trajno uklanjanje dlačica', 'trajno uklanjanje dlaka', 'trajna epilacija', 'laserska epilacija', 'laser za dlačice', 'epilacija', 'dlačice', 'venus velocity'],
      [r'epilac', r'dlaci'],
      groups=LASER_GROUPS, service_scan=SCAN(['laserska'], r'.', 'name'), articles=['velocity'],
      note='Every row of the price-list tab "Laserska epilacija" (28 services) and the Venus Velocity article. The old site maps "trajno uklanjanje dlačica" to #laserska-epilacija as well. The article says "da se zauvek rešite bolnog urastanja dlačica"; results are never promised as permanent in the text.'),

    E('masaza', ['masaža', 'masaže', 'masirati', 'relax masaža', 'anticelulit masaža', 'masaža leđa', 'masaža lica', 'face gym', 'facijalna masaža', 'masaža tela'],
      [r'masaz'],
      groups=['telo:2', 'lice:7'],
      services=['telo:2:0', 'telo:2:1', 'telo:2:2', 'telo:2:3', 'telo:2:4', 'telo:2:5', 'lice:7:2', 'lice:7:3', 'lice:7:4', 'lice:7:5', 'lice:7:9'],
      articles=['neguj', 'bioloski'],
      note='Dedicated massage lines: the group "Masaže" (body) and the Face Gym / remodeling / energy massages (face). Many protocols contain a massage step; they are not listed one by one.'),

    E('relaks', ['relaks', 'relax', 'relaksacija', 'opuštanje', 'antistres', 'antistress', 'stres'],
      [r'relax', r'relaks', r'opust', r'antistress'],
      groups=['telo:2', 'telo:5'], services=['telo:2:0', 'telo:2:2', 'telo:5:3', 'telo:5:1'],
      articles=['neguj', 'bioloski'],
      note='"Relax / Antistress" massage, "Antistress 30", "FALL IN RELAXATION" and SILKY SMOOTH (the article: "tretmani za opuštanje i negu kože"); the biological facial treatment starts with a relaxing massage.'),

    E('detoks', ['detoks', 'detox', 'detoksikacija', 'skin detox', 'body detox', 'hangover', 'hangover detox', 'izbacivanje toksina'],
      [r'detox', r'detoks', r'toksin'],
      groups=['estetske:6', 'telo:1'], services=['estetske:6:0', 'lice:1:5', 'lice:2:4'], articles=['proballancer', 'medcontour'], strength='medium',
      note='The site never promises detoxification of the body. "Detox"/"detoks" appears in service names (Hangover Detox, SKIN DETOX, Skin Detox) and the texts say presoterapija and Med Contour help the body to expel toxins.'),

    E('presoterapija', ['presoterapija', 'presoterapiju', 'limfna drenaža', 'drenaža', 'proballancer', 'aparaturna limfna drenaža'],
      [r'presoterap', r'drenaz', r'proballancer'],
      groups=['telo:1'], service_scan=SCAN(['lice', 'telo', 'protokoli'], r'presoterap|proballancer'), articles=['proballancer'],
      note='Group "Presoterapija ProBallancer" plus every service in other groups whose name or description contains presoterapija.'),

    E('ledja', ['leđa', 'leđni', 'masaža leđa', 'bol u leđima'],
      [r'ledj'],
      groups=['telo:2', 'telo:3'], services=['telo:2:1', 'telo:3:1'], articles=['awt', 'medcontour'], strength='medium',
      note='No back-pain or physio claim exists anywhere. Mapped to the partial massage that names the back and to the two body devices whose texts list the back among treatable regions.'),

    E('vrat', ['vrat', 'vrata', 'vratu', 'dekolte', 'dekolteu', 'tretman vrata', 'masaža vrata'],
      [r'\bvrat', r'dekolt'],
      service_scan=SCAN(['lice', 'telo', 'estetske', 'protokoli'], r'\bvrat|dekolt'),
      articles=['biorev', 'niti', 'vllice', 'vltelo', 'bioloski'],
      note='Body-part word: every service that names neck or décolleté (face + neck packages, Dermapen, Venus Legacy, Botox, mesotherapy, the partial massage) and the articles that treat neck and décolleté.'),

    E('ukljesteni-vrat', ['uklješteni vrat', 'uklješten vrat', 'ukočen vrat', 'bol u vratu'],
      [r'\bvrat', r'terapeuts'],
      groups=['telo:2'], services=['telo:2:1', 'telo:2:0'], strength='weak',
      note='No article or service claims to treat a stiff neck or pain. Only the massage group is offered as the closest hook (the partial massage names neck, shoulders and head; one massage is called "Terapeutska"). Show as a soft suggestion, never as a treatment claim.'),

    E('rastezanje', ['rastezanje', 'istezanje', 'stretching', 'rastezanje mišića', 'istezanje mišića'],
      [r'masaz'], groups=['telo:2'], services=['telo:2:0', 'telo:2:3'], strength='weak', direct_evidence=False,
      note='The price list and the texts contain no stretching or mobility service (searched "istez", "rastez", "stretch"). The massage group is the closest honest hook only. If the person means stretch marks, see the entry "strije".'),

    E('strije', ['strije', 'strija', 'strije od rastezanja', 'rastezne strije', 'rastezanje kože'],
      [r'strij'],
      groups=['telo:0'], articles=['vltelo'], strength='medium',
      note='The Venus Legacy body text says the device "smanjuje vidljivost strija". No price-list line is named after stretch marks, so only the group is mapped.'),

    E('priprema-za-vencanje', ['priprema za venčanje', 'venčanje', 'mlada', 'mlade', 'nevesta', 'za mladu', 'wedding', 'wedding ready', 'pred venčanje', 'svadba'],
      [r'wedding', r'vencanj', r'dogadjaj'],
      groups=['protokoli:2'], services=['protokoli:2:2', 'protokoli:2:3'], offers=['offer-2', 'offer-1'],
      note='WEDDING READY (single and for two) is the direct match. Instant Glow Up is added only because its own description says "pre važnog događaja". No article mentions weddings.'),

    E('poklon', ['poklon', 'poklon vaučer', 'vaučer', 'pokloniti', 'za poklon', 'poklon za ženu', 'poklon za mamu', 'gift', 'gift card', 'poklon kartica'],
      [r'poklon'],
      groups=['lice:0', 'lice:7', 'lice:1'], services=['lice:0:0', 'lice:7:2', 'lice:1:10', 'lice:7:8'], gift_services=True, strength='medium',
      note='Mapped to the four services the old site shows in its "Tretmani za poklon" picks. The old source marks that list as a SAMPLE; the final list from the client is pending, so update when it arrives.'),
]

# 12 natural-language questions invented for the search (not required wording of the brief)
QUESTIONS = [
    E('q-pore', ['kako da smanjim vidljivost pora', 'kako da smanjim pore', 'proširene pore', 'velike pore', 'vidljive pore', 'masna koža', 'masna koža i pore'],
      [r'\bpor[aeiu]\b', r'masn'],
      groups=['lice:0', 'lice:2', 'lice:3'], services=['lice:2:0', 'lice:0:0', 'lice:0:2'],
      articles=['higijenski', 'glow', 'dermapen', 'preime'],
      note='Hygienic treatment text: "smanjuju vidljivost pora"; Venus Glow and Dermafacial "čisti pore"; peel text "čišćenju pora", "proširene pore". The old site maps "masna koža" and "pore" to #akne.'),

    E('q-podocnjaci', ['šta mogu da uradim za podočnjake', 'podočnjaci', 'tamni podočnjaci', 'umoran izgled', 'umoran pogled'],
      [r'podocnjak'],
      groups=['lice:6', 'estetske:1'], services=['lice:6:0'], articles=['fileri', 'vllice'],
      note='Price-list line "Predeo oko očiju, podočnjaci" (Venus Legacy); the filler article has a section on correcting under-eye hollows; the Venus Legacy article lists removal of dark circles.'),

    E('q-bradavice', ['kako da uklonim bradavice ili ciste na koži', 'bradavice', 'viseće bradavice', 'uklanjanje bradavica', 'ciste na koži', 'meki fibromi', 'uklanjanje promena na koži', 'radiotalasno uklanjanje'],
      [r'bradavic', r'cist[ae]\b', r'fibrom', r'radiotalas'],
      groups=['estetske:5'], services=['estetske:5:10', 'estetske:5:11'], articles=['radio'],
      note='The radiowave article lists cysts, soft fibromas and hanging warts. It also says pigmented moles must NOT be removed this way (they need classic surgery), so moles are not a target here.'),

    E('q-urasle-dlacice', ['imam urasle dlačice posle depilacije, šta da radim', 'urasle dlačice', 'urastanje dlačica', 'guščija koža'],
      [r'urast', r'guscij', r'cuscj'],
      groups=['telo:5'], services=['telo:5:2', 'telo:5:1'], articles=['neguj', 'velocity'],
      note='LOSE GOOSE (the article: "čuščje kože ... urastanja dlačica") and SILKY SMOOTH ("posebno kod osoba koje su imale problem sa urastanjem dlačica"); the laser article says laser epilation helps to get rid of painful ingrown hairs.'),

    E('q-tesko-noge', ['šta pomaže kod teških nogu i otoka', 'teške noge', 'otok nogu', 'osećaj težine u nogama', 'zadržavanje tečnosti', 'otekle noge'],
      [r'otok', r'tezin', r'tecnost'],
      groups=['telo:1'], services=['telo:1:0', 'telo:1:1', 'telo:1:2', 'telo:1:3'], articles=['proballancer'],
      note='Presoterapija text: "smanjenje otoka i osećaja težine", "momentalan osećaj lakoće u nogama", "problema sa zadržavanjem viška tečnosti".'),

    E('q-posle-letovanja', ['kako da oporavim kožu tela posle letovanja', 'posle letovanja', 'nakon letovanja', 'oporavak kože posle letovanja'],
      [r'letovanj'],
      groups=['telo:5'], services=['telo:5:1'], articles=['neguj'],
      note='SILKY SMOOTH: the article calls it "idealan za oporavak kože nakon letovanja (ili kao priprema za novu sezonu)". Body skin only; no facial treatment says this.'),

    E('q-zatezanje-bez-operacije', ['postoji li zatezanje kože bez operacije', 'zatezanje bez operacije', 'lifting bez operacije', 'nehirurški lifting', 'neinvazivno zatezanje kože', 'bez skalpela'],
      [r'nehirurs', r'neinvaziv', r'bez operacij'],
      groups=['estetske:4', 'lice:6', 'telo:0'], articles=['niti', 'vllice', 'vltelo'],
      note='Threads are "nehirurški lifting" (title of the article), Venus Legacy is "potpuno neinvazivan" and tightens face and body. Groups only: the exact device is chosen at the consultation.'),

    E('q-znojenje', ['kako da rešim prekomerno znojenje ispod pazuha', 'smeta mi prekomerno znojenje ispod pazuha', 'znojenje', 'prekomerno znojenje', 'znojenje pazuha', 'hiperhidroza'],
      [r'znojen', r'hiperhidroz'],
      groups=['estetske:2'], services=['estetske:2:5'], articles=['botoks'],
      note='Price-list line "Hiperhidroza, pazuh" and the Botox article section on sweating therapy under the armpits.'),

    E('q-mladezi', ['kako da proverim mladeže', 'mladeži', 'mladež', 'pregled mladeža', 'dermoskopija', 'dermatoskopija', 'melanom'],
      [r'mladez', r'dermoskop', r'dermatoskop', r'melanom'],
      groups=['estetske:5'], services=['estetske:5:1', 'estetske:5:0'], articles=['klasicna'],
      note='"Specijalistički pregled sa dermoskopijom mladeža" and the dermatological exam text (dermatoscopy, melanoma, regular checks). The radiowave text is not mapped: it is about removal and excludes moles.'),

    E('q-trudnoca', ['koji tretmani su bezbedni u trudnoći', 'trudnoća', 'trudnice', 'u trudnoći', 'za trudnice', 'baby glow', 'mame', 'posle porođaja'],
      [r'trudnic', r'trudnoc', r'\bmam[eau]\b', r'\bmum\b'],
      groups=['protokoli:2'], services=['protokoli:2:0', 'protokoli:2:1'], offers=['offer-3'], articles=['proballancer'], strength='medium',
      caution=dict(articles=['awt', 'radio', 'velocity'],
                   note='These three texts list pregnancy as an exception or contraindication (AWT "ne preporučuje se trudnicama", radiowave "izuzetak su trudnice", laser epilation "trudnoća i dojenje"). They are NOT mapped; show them only as cautions. Always confirm with the team.'),
      note='Only positive mentions are mapped: BABY GLOW "za trudnice", NEW MUM RECHARGE "za mame", presoterapija ("u njemu mogu uživati i trudnice").'),

    E('q-priprema-botoks', ['kako da pripremim kožu pre botoksa', 'priprema za botoks', 'priprema kože za botoks', 'pre botoksa'],
      [r'priprema', r'botoks'],
      groups=['lice:3', 'lice:1', 'lice:2', 'protokoli:0'], articles=['botoks'],
      note='The Botox article has a section "Koji tretmani su dobra priprema za botoks?" and names chemical peels, biological treatments, Venus Glow and the Glow&Go protocols.'),

    E('q-laser-bolan', ['da li je laserska epilacija bolna', 'laser boli', 'bol kod laserske epilacije', 'da li boli laser'],
      [r'bolan', r'bolna', r'bezbol', r'peckanj'],
      articles=['velocity'],
      note='The article is titled "Bezbolna i bezbedna" and says "Tretman nije bolan, ali možete osetiti blagu toplotu ili blago peckanje". Article only; no price-list target needed.'),
]

# the phrases the brief requires (folded form), checked by the builder
REQUIRED = ['glass skin', 'blistava koza', 'ciscenje lica', 'cista koza', 'akne', 'lecenje akni', 'ozilci od akni', 'ozilci', 'pigmentacija', 'flekice',
            'bore', 'anti age', 'podmladjivanje', 'lifting', 'botoks', 'fileri', 'usne', 'kosa', 'opadanje kose', 'celulit', 'kako smanjiti obim',
            'mrsavljenje', 'oblikovanje tela', 'depilacija', 'trajno uklanjanje dlacica', 'masaza', 'relaks', 'detoks', 'presoterapija', 'ledja',
            'vrat', 'ukljesteni vrat', 'rastezanje', 'priprema za vencanje', 'poklon']
