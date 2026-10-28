# -*- coding: utf-8 -*-
"""texts_curation.py: the hand-curated (reviewed) data behind the texts pack.

Everything here is a decision, not an extraction: which price-list groups and services belong to which
article, which words map to what in the hidden search vocabulary, which image suits a segment, how the
copywriter's Word comments resolve to other articles. build-texts-pack.py expands and VALIDATES it
(every id must exist, every mapping must be backed by real text of the target, see "evidence").

Articles are addressed by a short key (ARTICLE_KEYS) that is asserted against the real slug at build time.
No literal em dash / en dash characters in this file.
ECHOSYSTEM-MOTHER AGENCY
"""

# ----------------------------------------------------------------------------- articles (key -> expected slug)
ARTICLE_KEYS = [
    ('candela', 'laserska-dermatologija-candela-laserima'),
    ('klasicna', 'dermatoloski-pregled-dermatologa'),
    ('radio', 'radiotalasno-uklanjanje-promena-na-kozi'),
    ('skalp', 'prp-i-mezoterapija'),
    ('biorev', 'regenerativne-procedure-i-biorevitalizacija-lica-vrata-i-dekoltea'),
    ('botoks', 'botulinski-toksin-tipa-a-botoks-tretman'),
    ('fileri', 'hijaluronski-fileri'),
    ('niti', 'lifting-nitima'),
    ('bioloski', 'bioloski-tretmani-lica'),
    ('dermapen', 'dermapen-i-hemijski-pilinzi-za-holivudski-tretman'),
    ('higijenski', 'higijenski-tretmani-lica'),
    ('myolift', '7e-myolift-md-tretman'),
    ('preime', 'preime-dermafacial'),
    ('glow', 'venus-glow'),
    ('vllice', 'venus-legacy'),
    ('awt', 'awt-acoustic-wave-therapy-storz-tretman-za-telo'),
    ('medcontour', 'med-contour-tretman-za-oblikovanje-tela'),
    ('neguj', 'tretmani-tela-za-opustanje-i-negu'),
    ('proballancer', 'proballancer-presoterapija'),
    ('vltelo', 'venus-legacy-tretmani'),
    ('velocity', 'bezbolna-i-bezbedna'),
]

# ----------------------------------------------------------------------------- segments
SEGMENTS = [
    dict(id='dermatologija', slug='dermatologija', name='Dermatologija', folder='Dermatologija'),
    dict(id='estetske', slug='estetske-procedure', name='Estetske procedure', folder='Estske procedure',
         folderNote='The folder on disk is spelled "Estske procedure" (typo); the segment name is "Estetske procedure".'),
    dict(id='kozmetika', slug='kozmeticki-tretmani', name='Kozmetički tretmani', folder='Kozmetički tretmani'),
    dict(id='telo', slug='telo', name='Telo', folder='Telo'),
]

# ----------------------------------------------------------------------------- price-list links
# Group ids are "<tabId>:<groupIndex>" (the data-group-id convention of the previews), service ids are "<tabId>:<groupIndex>:<serviceIndex>".
# G(group, role, basis, *selectors)  : one price-list group related to the article
# S(...)                              : a service selector inside that group:
#     all=True | idx=[..] | ids=[..] | name=<regex on folded name> | namedesc=<regex on folded name+description>
# SCAN(tabs, pattern, role, basis, only_groups=None, skip=()) : every service (outside `skip`) of those tabs whose name/description matches
def S(**kw):
    return kw


def G(group, role, basis, *sels, origin=None):
    return dict(kind='group', group=group, role=role, basis=basis, sels=list(sels), origin=origin)


def SCAN(tabs, pattern, role, basis, only_groups=None, skip=(), origin=None):
    return dict(kind='scan', tabs=list(tabs), pattern=pattern, role=role, basis=basis, only_groups=only_groups, skip=list(skip), origin=origin)


LINKS = {
    'candela': [
        G('estetske:5', 'primary', 'Price-list group "Dermatologija" holds the Candela laser services the article describes',
          S(name=r'candela', basis='name', why='service name contains "Candela" (Nordlys, MatrixPro Sublime, Sublative)'),
          S(ids=['estetske:5:13'], basis='text', why='the article lists removal of broken capillaries ("uklanjanje kapilara") among the Candela indications')),
    ],
    'klasicna': [
        G('estetske:5', 'primary', 'Price-list group "Dermatologija" holds the dermatological exams the article describes',
          S(ids=['estetske:5:0', 'estetske:5:1'], basis='name', why='"Specijalistički dermatološki pregled" and "pregled sa dermoskopijom mladeža" are the exam and the dermatoscopy described in the article')),
        G('estetske:7', 'related', 'The article names alopecia (hair loss) among the problems a dermatologist treats'),
    ],
    'radio': [
        G('estetske:5', 'primary', 'Price-list group "Dermatologija" holds the radiowave removal services',
          S(name=r'radiotalas', basis='name', why='service name contains "Radiotalasno uklanjanje promena"')),
    ],
    'skalp': [
        G('estetske:7', 'primary', 'Price-list group "Rast kose" lists PRP and mesotherapy for the scalp',
          S(idx=[2, 3, 4, 5], basis='name', why='"PRP tretman kose", "PRP paket ... kosa", "Mezoterapija kose" are the two treatments the article describes (the exosome lines are not mentioned in the text)')),
        G('estetske:3', 'related', 'The article says PRP and mesotherapy are also combined in aesthetic treatments of the face',
          S(ids=['estetske:3:13', 'estetske:3:14', 'estetske:3:15', 'estetske:3:16'], basis='text', why='PRP and mesotherapy for face and body')),
    ],
    'biorev': [
        G('estetske:3', 'primary', 'Price-list group "Biorevitalizacija i skinbosteri" is the article subject (biorevitalization, PRP, mesotherapy, skin boosters)',
          S(name=r'biorevital|skinbooster|prp|mezoterapija', basis='name', why='name contains "biorevitalizacija", "skinbooster", "PRP" or "Mezoterapija", the four procedures the article lists')),
    ],
    'botoks': [
        G('estetske:2', 'primary', 'Price-list group "Botox tretman" is the article subject',
          S(all=True, basis='group', why='every service of the group "Botox tretman" (wrinkle correction, lip flip, hyperhidrosis)')),
        G('estetske:1', 'related', 'Packages in the filler group that include Botox',
          S(namedesc=r'botox', basis='name or description', why='name or description contains "Botox"')),
        G('lice:3', 'related', 'The article names chemical peels as good preparation for Botox'),
        G('lice:1', 'related', 'The article names biological treatments as good preparation for Botox'),
        G('lice:2', 'related', 'The article names Venus Glow as good preparation for Botox'),
        G('protokoli:0', 'related', 'The article names the Glow&Go protocols as good preparation for Botox'),
    ],
    'fileri': [
        G('estetske:1', 'primary', 'Price-list group "Hijaluronski fileri" is the article subject',
          S(namedesc=r'hijaluron|filer', basis='name or description', why='name or description contains "Hijaluron" or "filer" (the "Botox + Profhilo" line is not a filler and stays out)')),
        G('estetske:2', 'related', 'The article combines fillers with Botox in the Full Face approach'),
    ],
    'niti': [
        G('estetske:4', 'primary', 'Price-list group "Lifting niti i mezoniti" is the article subject',
          S(name=r'\bniti\b|mezoniti', basis='name', why='name contains "niti" or "mezoniti"')),
    ],
    'bioloski': [
        G('lice:1', 'primary', 'Price-list group "Biološki tretmani" is the article subject',
          S(all=True, basis='group', why='every service of the group "Biološki tretmani"')),
        G('lice:0', 'related', 'The article pairs biological treatments with the hygienic treatments as the basic non-invasive care'),
        G('telo:1', 'related', 'The article offers presoterapija as an add-on to a biological treatment'),
    ],
    'dermapen': [
        G('lice:5', 'primary', 'Price-list group "Dermapen" is half of the article subject',
          S(all=True, basis='group', why='every service of the group "Dermapen"')),
        G('lice:3', 'primary', 'Price-list group "Hemijski pilinzi" is the other half of the article subject',
          S(all=True, basis='group', why='every service of the group "Hemijski pilinzi"')),
    ],
    'higijenski': [
        G('lice:0', 'primary', 'Price-list group "Higijenski tretmani" is the article subject',
          S(name=r'higijenski', basis='name', why='service name contains "higijenski": exactly the services the old site links to this text (SERVICE_BLOG_LINKS)'),
          origin='SERVICE_BLOG_LINKS'),
    ],
    'myolift': [
        G('lice:7', 'primary', 'Price-list group "Myolift i masaže lica" holds the Myolift services',
          S(namedesc=r'myolift', basis='name or description', why='name or description contains "Myolift"')),
        SCAN(['lice', 'protokoli'], r'myolift', 'related', 'Services in other groups whose name or description contains "Myolift"', skip=['lice:7']),
    ],
    'preime': [
        G('lice:2', 'primary', 'Price-list group "Venus Glow / Dermafacial" holds the Dermafacial protocols',
          S(name=r'dermafacial', basis='name', why='service name contains "Dermafacial": exactly the services the old site links to this text (SERVICE_BLOG_LINKS)'),
          origin='SERVICE_BLOG_LINKS'),
        SCAN(['lice', 'telo', 'protokoli'], r'dermafacial', 'related', 'Services in other groups whose name or description contains "Dermafacial"', skip=['lice:2']),
    ],
    'glow': [
        G('lice:2', 'primary', 'Price-list group "Venus Glow / Dermafacial" holds the Venus Glow services',
          S(namedesc=r'venus glow', basis='name or description', why='name or description contains "Venus Glow"')),
        SCAN(['lice', 'telo', 'protokoli'], r'venus glow', 'related', 'Services in other groups whose name or description contains "Venus Glow"', skip=['lice:2']),
    ],
    'vllice': [
        G('lice:6', 'primary', 'Price-list group "Venus Legacy lice" is the article subject',
          S(all=True, basis='group', why='every service of the group "Venus Legacy lice"')),
        SCAN(['lice', 'protokoli'], r'venus legacy', 'related', 'Face services in other groups whose name or description contains "Venus Legacy"',
             only_groups=['lice:7', 'protokoli:1'], skip=['lice:6']),
    ],
    'awt': [
        G('telo:3', 'primary', 'Price-list group "AWT, Anticelulit i preoblikovanje" is the article subject',
          S(all=True, basis='group', why='every service of the group "AWT, Anticelulit i preoblikovanje"')),
        G('telo:1', 'related', 'The article recommends combining AWT with presoterapija'),
        G('telo:0', 'related', 'The article recommends combining AWT with Venus Legacy'),
    ],
    'medcontour': [
        G('telo:4', 'primary', 'Price-list group "MedContour, Smanjenje masnih naslaga" is the article subject',
          S(all=True, basis='group', why='every service of the group "MedContour, Smanjenje masnih naslaga"')),
    ],
    'neguj': [
        G('telo:5', 'primary', 'Price-list group "Tretmani za ciljanu negu" holds the treatments the article presents',
          S(name=r'kick start diet|silky smooth|lose goose|fall in relaxation', basis='name', why='the four named treatments of the article (the price list spells "LOSE GOOSE" where the article says "Loose Goose")')),
        G('telo:2', 'related', 'The article describes the anticelulit treatment as peeling, boosters and an anticelulit massage',
          S(name=r'anticelulit', basis='text', why='"Anticelulit masaža" is the massage part of the anticelulit treatment described')),
        G('telo:1', 'related', 'Presoterapija is part of Kick Start Diet and is combined with the anticelulit treatments'),
        G('telo:0', 'related', 'Venus Legacy is named as the usual device combination for anticelulit and tightening'),
    ],
    'proballancer': [
        G('telo:1', 'primary', 'Price-list group "Presoterapija ProBallancer" is the article subject',
          S(all=True, basis='group', why='every service of the group "Presoterapija ProBallancer"')),
        SCAN(['lice', 'telo', 'protokoli'], r'presoterapij', 'related', 'Services in other groups whose name or description contains "presoterapija" (the article says it combines with all face and body treatments)', skip=['telo:1']),
    ],
    'vltelo': [
        G('telo:0', 'primary', 'Price-list group "Venus Legacy telo" is the article subject',
          S(all=True, basis='group', why='every service of the group "Venus Legacy telo"')),
        SCAN(['protokoli'], r'venus legacy', 'related', 'Body protocols whose name or description contains "Venus Legacy"', only_groups=['protokoli:2', 'protokoli:3']),
    ],
    'velocity': [
        G('laserska:0', 'primary', 'Every group of the tab "Laserska epilacija" is laser hair removal; the old site ties this tab to "Venus Velocity diodni laser"',
          S(all=True, basis='group', why='row of the tab "Laserska epilacija"'), origin='tab'),
        G('laserska:1', 'primary', 'Tab "Laserska epilacija", group "Lice"', S(all=True, basis='group', why='row of the tab "Laserska epilacija"'), origin='tab'),
        G('laserska:2', 'primary', 'Tab "Laserska epilacija", group "Telo, gornji deo"', S(all=True, basis='group', why='row of the tab "Laserska epilacija"'), origin='tab'),
        G('laserska:3', 'primary', 'Tab "Laserska epilacija", group "Telo, donji deo"', S(all=True, basis='group', why='row of the tab "Laserska epilacija"'), origin='tab'),
        G('laserska:4', 'primary', 'Tab "Laserska epilacija", group "Kombinacije"', S(all=True, basis='group', why='row of the tab "Laserska epilacija"'), origin='tab'),
    ],
}

# ----------------------------------------------------------------------------- hero images and segment intros
HERO = {
    'dermatologija': dict(id='woman-portrait', fit='approximate',
                          caveat='The pack has no clinical, laser or dermatology photo. This cut-out beauty portrait of a woman with a radiant complexion is the closest honest match (skin). Replace with a real clinic photo when one exists.',
                          alternates=['hero-orhideja']),
    'estetske': dict(id='hero-orhideja', fit='mood-only',
                     caveat='No photo in the pack shows an injectable or thread procedure. The orchid image is neutral and makes no medical claim; use woman-portrait instead if it is not used for Dermatologija.',
                     alternates=['woman-portrait']),
    'kozmetika': dict(id='vertical-protocols', fit='exact',
                      caveat='Shows a facial massage during a face treatment, which is what most articles of this segment describe (biological, hygienic, Venus Glow, Myolift).',
                      alternates=['founder-portrait']),
    'telo': dict(id='vertical-laser', fit='approximate',
                 caveat='The file is called "vertical-laser" but the photo shows a back massage, not a laser. It fits the body-care and massage articles; none of the pack photos shows a device (AWT, Med Contour, Venus Legacy, laser epilation).',
                 alternates=['vertical-body', 'location-novi-beograd']),
}

# intro = a verbatim quote. kind 'article': (article key, block index, sentence number 1-based or 0 for the whole block);
# kind 'content': a dotted path into content.json
INTRO = {
    'dermatologija': dict(kind='article', article='klasicna', block=0, sentence=1,
                          alternative=dict(kind='article', article='candela', block=0, sentence=1)),
    'estetske': dict(kind='content', path='verticals[2].summary',
                     alternative=dict(kind='article', article='fileri', block=0, sentence=1)),
    'kozmetika': dict(kind='content', path='verticals[0].summary',
                      alternative=dict(kind='article', article='bioloski', block=0, sentence=1)),
    'telo': dict(kind='content', path='verticals[1].summary',
                 note='The old site line names Venus Legacy, presoterapija, anticelulit protocols and massages; the segment also holds the AWT, Med Contour and laser epilation texts, which this line does not name.',
                 alternative=dict(kind='article', article='neguj', block=0, sentence=1)),
}

# ----------------------------------------------------------------------------- copywriter comments -> other articles
# (article key, comment id in that document) -> resolution
COMMENT_RESOLUTION = {
    ('candela', 0): dict(articles=['klasicna'], resolution='confident', basis='"text about classic dermatology"'),
    ('candela', 1): dict(articles=['klasicna'], resolution='confident', basis='"link to the text, i.e. that category" on the words "dermatološki pregled"'),
    ('klasicna', 0): dict(articles=['candela'], resolution='confident', basis='"text about laser dermatology"'),
    ('klasicna', 1): dict(articles=['candela'], resolution='confident', basis='category "Candela laserska dermatologija"'),
    ('radio', 0): dict(articles=['klasicna'], resolution='confident', basis='"text about dermatology"'),
    ('radio', 1): dict(articles=['klasicna'], resolution='partial', basis='the comment prefers the doctor\'s biography page (not part of this pack) and names the dermatological exam text as the fallback'),
    ('skalp', 0): dict(articles=['klasicna'], resolution='confident', basis='"link to the text about dermatology"'),
    ('biorev', 0): dict(articles=['skalp'], resolution='partial', basis='keywords PRP and mesotherapy have a text (PRP i mezoterapija); "skin boosters" has none in this pack'),
    ('biorev', 1): dict(segments=['estetske'], resolution='confident', basis='"can be linked with the category Estetske procedure"'),
    ('biorev', 2): dict(articles=['dermapen'], resolution='confident', basis='"text about chemical peels" is Dermapen i hemijski pilinzi'),
    ('botoks', 0): dict(articles=['dermapen', 'bioloski', 'glow'], resolution='partial', basis='chemical peels, biological treatments and Venus Glow have texts; "Glow&Go protocols" has none (price-list group protokoli:0)'),
    ('niti', 0): dict(articles=['botoks', 'skalp', 'fileri', 'dermapen'], resolution='partial', basis='botoks, PRP and mesotherapy (PRP i mezoterapija), fillers and Dermapen have texts'),
    ('myolift', 0): dict(articles=['vllice'], resolution='confident', basis='"text about the Venus Legacy treatment" in a face context'),
    ('proballancer', 0): dict(articles=[], resolution='none', basis='asks for a text that describes the ProBallancer device; no such text exists in this pack (this article is the only one about it)'),
    ('vltelo', 0): dict(articles=['vllice'], resolution='confident', basis='category "Venus Legacy tretmani za lice"'),
    ('velocity', 0): dict(articles=[], resolution='none', basis='asks for a text about the device (Venus Velocity); this article is the only one about it'),
    ('velocity', 1): dict(articles=[], resolution='none', basis='asks for a text about the device (Venus Velocity); this article is the only one about it'),
}

# legacy live-site URL path -> internal target. type: article | segment | pricelist | none | external
URL_TARGETS = {
    '/estetske-procedure/': dict(type='segment', id='estetske'),
    '/estetske-procedure/botox/': dict(type='article', key='botoks'),
    '/estetske-procedure/hijaluron/': dict(type='article', key='fileri'),
    '/estetske-procedure/mezoterapija/': dict(type='none', note='no dedicated mesotherapy text among the 21 documents (closest: PRP i mezoterapija, scalp)'),
    '/tretmani-lica/': dict(type='segment', id='kozmetika', note='live-site category "Tretmani lica" is the cosmetic face treatments; price-list tab "lice"'),
    '/tretmani-lica/bioloski-tretman-lica/': dict(type='article', key='bioloski'),
    '/tretmani-lica/higijenski-tretman-lica/': dict(type='article', key='higijenski'),
    '/tretmani-lica/venus-glow-vodena-mikrodermoabrazija/': dict(type='article', key='glow'),
    '/tretmani-tela/': dict(type='segment', id='telo', note='live-site category "Tretmani tela"; price-list tab "telo"'),
    '/tretmani-tela/presoterapija/': dict(type='article', key='proballancer'),
    '/tretmani-tela/venus-legacy/': dict(type='article', key='vltelo'),
    '/tretmani-tela/masaze-lica-i-tela/': dict(type='pricelist', id='telo:2', note='no massage text among the 21 documents; price-list group "Masaže"'),
    '/tretmani-tela/laserska-epilacija/': dict(type='article', key='velocity'),
    '/cenovnik/': dict(type='pricelist', id='all'),
}
