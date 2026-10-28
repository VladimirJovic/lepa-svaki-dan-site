# -*- coding: utf-8 -*-
import json, os, sys, datetime, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meta import META
OUT='/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/_shared/img'
TMP='/private/tmp/claude-501/-Users-vladajovic-Developer-LEPA-SVAKI-DAN/bc2efc8a-11c4-49f0-aa07-b61dd8357a51/scratchpad/work/tmp'
DATE='2026-10-07'
rec=json.load(open(TMP+'/records.json'))
ORDER=['hero-cutout','hero-orhideja','about','cta-bg','founder-portrait','location-novi-beograd','location-waterfront',
       'vertical-body','vertical-esthetic','vertical-face','vertical-laser','vertical-protocols','woman-portrait','logo','logo-transparent']
TONE_SR={'dark':'tamna','mid':'srednja','bright':'svetla'}

# --- JSON
images=[]; files=[]
for k in ORDER:
    r=dict(rec[k]); m=META[k]
    r.update({'alt':m['alt'],'shows':m['shows'],'bestUse':m['use'],'fits':{'verticals':m['verticals'],'themes':m['themes']},
              'faces':m['faces'],'faceCount':len(m['faces']),'hasFace':bool(m['faces']),'avoidOverlay':m['avoid'],
              'safeZones':m['safe'],'cropNotes':m['crop'],'warnings':m['warn']})
    r['coordsNote']='fractions [x0,y0,x1,y1] of the image (for hero-cutout: of the TRIMMED cutout, same as the exported variants)'
    if k!='hero-cutout': r['path']=f'_shared/img/'
    images.append(r)
    for v in r['variants']:
        p=os.path.join(OUT,v['file']); files.append({'file':v['file'],'id':k,'w':v['w'],'h':v['h'],'kb':v['kb'],'bytes':os.path.getsize(p)})
cut_qa={
 'sourceFacts':'2688x3024 RGBA, alfa max 254 (nijedan piksel potpuno neproziran), ~75k piksela alfa-šuma (1-8) razbacanih po celom platnu, 3.6M potpuno providnih',
 'steps':['alfa nivoi: <=6 -> 0, >=250 -> 255 (uklonjen šum i "1/255 curenje" pozadine)',
          'izolovane flekice: 27 komponenti, 0 uklonjeno (nema plutajućih fleka > 20px od figure)',
          'defringe/color-bleed: RGB piksela sa alfa<130 i potpuno providnih povučen ka najbližem neprozirnom pikselu (nema tamnog RGB-a ispod providnog pa nema oboda ni pri skaliranju)',
          'trim: bbox alfa>8 + 4px margina -> 2031x3001 (ravan donji rez je original)',
          'izvoz: resize LANCZOS, cwebp -q 85 -alpha_q 95 -m 6 -sharp_yuv'],
 'fringe':{'before':'alfa 8-40: dLum -7.0; 40-100: +4.9; 100-200: +10.8 (svetlija ivica, blago desaturisana)','after':'alfa 8-40: -1.7; 40-100: +2.4; 100-200: +9.1','verdict':'nema tamnog oboda; blagi svetli pomak je realno prelomljena kosa'},
 'composites':['lila #C7B5D8','charcoal #454340','white #FFFFFF'],'result':'ivica čista na sve tri podloge (pregledano 1:1 na kosi levo, desno, teme)'
}
manifest={'name':'Lepa Svaki Dan v2 - media pack','generatedBy':'ECHOSYSTEM-MOTHER AGENCY','generated':DATE,'folder':'_shared/img/',
  'settings':{'photoWidths':[480,800,1200,1800],'quality':78,'format':'webp (cwebp 1.6.0, -m 6 -sharp_yuv, metadata stripped)',
              'cutout':{'widths':[600,900,1300],'quality':85,'alphaQuality':95},'logos':'webp lossless (native 350px)',
              'placeholder':'24px wide, blurred, base64 webp data-URI'},
  'usage':{'srcset':'<img src="about-800.webp" srcset="about-480.webp 480w, about-800.webp 800w, about-1200.webp 1200w, about-1800.webp 1800w" sizes="100vw" width="2000" height="1333" alt="...">',
           'placeholder':'style="background:center/cover url(<placeholder>)"'},
  'cutoutQA':cut_qa,'images':images,'files':files,
  'totals':{'files':len(files),'kb':round(sum(f['bytes'] for f in files)/1024,1)}}
json.dump(manifest,open(OUT+'/manifest.json','w'),indent=1,ensure_ascii=False)

# --- MD
def vtxt(r): return ' / '.join(f"{v['w']}×{v['h']}" for v in r['variants'])
def ktxt(r): return ' / '.join(f"{v['kb']:g}" for v in r['variants'])
L=[]
L.append('# MEDIA PACK — Lepa Svaki Dan v2\n')
L.append(f"`_shared/img/` · {len(files)} webp fajlova · {manifest['totals']['kb']:.0f} KB ukupno · generisano {DATE}\n")
L.append('Fotografije: webp 480/800/1200/1800 (samo širine ≤ izvora), kvalitet 78, metapodaci uklonjeni. Isečak: webp sa alfom 600/900/1300 (q85). Logotipi: lossless webp u izvornoj širini. Placeholder (24px, zamućen, base64) je u `manifest.json` (`placeholder`).\n')
L.append('```html\n<img src="about-800.webp" srcset="about-480.webp 480w, about-800.webp 800w, about-1200.webp 1200w, about-1800.webp 1800w"\n     sizes="(min-width:1024px) 50vw, 100vw" width="2000" height="1333" alt="…" loading="lazy" decoding="async"\n     style="background:center/cover url(DATA_URI_IZ_manifest.json)">\n```\n')
L.append('## Pregled slika\n')
L.append('| Slika | Izvor (px) | Varijante (px) | KB po varijanti | Ton | Alt tekst (sr) | Najbolja upotreba |')
L.append('|---|---|---|---|---|---|---|')
for r in images:
    k=r['id']; base=r['variants'][0]['file'].rsplit('-',1)[0]
    ext=', '.join(str(v['w']) for v in r['variants'])
    name=f"`{base}-{{{ext}}}.webp`" if len(r['variants'])>1 else f"`{r['variants'][0]['file']}`"
    src=f"{r['sourceSize'][0]}×{r['sourceSize'][1]} ({r['sourceKB']:g} KB)"
    if k=='hero-cutout': src=f"2688×3024 → trim {r['trimmedSize'][0]}×{r['trimmedSize'][1]} ({r['sourceKB']:g} KB)"
    tone=f"{TONE_SR[r['tone']]} ({r['luminance']:.2f}), {r['avgColor']}"
    L.append(f"| {name} | {src} | {vtxt(r)} | {ktxt(r)} | {tone} | {r['alt']} | {r['bestUse']} |")
L.append('')
L.append('## Svi fajlovi (jedan red po fajlu)\n')
L.append('| Fajl | Dimenzije | KB |'); L.append('|---|---|---|')
for f in files: L.append(f"| `{f['file']}` | {f['w']}×{f['h']} | {f['kb']:g} |")
L.append('| `source/hero-cutout-higgsfield-original.png` | 2688×3024 | 9633 (netaknuta kopija, sha256 identičan; NE deploy-ovati) |')
L.append('')
L.append('## Hero isečak (`hero-cutout-{600,900,1300}.webp`)\n')
L.append('Izvor: Higgsfield `hf.png` (2688×3024 RGBA, AI-generisana žena, ombre kosa, tamnoplavi sako). Netaknuta kopija: `source/hero-cutout-higgsfield-original.png`.\n')
L.append('Šta je urađeno:')
for s in cut_qa['steps']: L.append(f'- {s}')
L.append(f"\nProvera ivice: nijedan piksel originala nije bio potpuno neproziran (alfa max 254) i oko 75k piksela alfa-šuma bilo je razbacano po celom platnu (zato je „bbox“ bio ceo kadar) - to je očišćeno. Tamni obod (dark fringe) na kosi **nije pronađen**: ivični pikseli su u proseku blago svetliji od unutrašnjosti (alfa 100-200: +9 luma), što je realna svetla kosa i nije vidljivo. Kompozit na lila `#C7B5D8`, charcoal `#454340` i beloj proveren 1:1 (leva kosa, desna kosa, teme) - ivica čista na sve tri.\n")
L.append(f"Veličine: 600 → {images[0]['variants'][0]['kb']:g} KB, 900 → {images[0]['variants'][1]['kb']:g} KB, 1300 → {images[0]['variants'][2]['kb']:g} KB (cilj < 300 KB ispunjen). Donja ivica je ravan rez (donji deo sakoa) - sidriti na dno sekcije.\n")
L.append('## Detalji po slici\n')
L.append('Koordinate zona su u procentima kadra (x/y od gore levo). „Lice“ = ne pokrivati preklopom; „Izbegavati“ = žarište/ruke/proizvodi.\n')
def pct(b): return f"x {b[0]*100:.0f}–{b[2]*100:.0f}%, y {b[1]*100:.0f}–{b[3]*100:.0f}%"
for r in images:
    L.append(f"### {r['id']}")
    L.append(f"- **Prikazuje:** {r['shows']}")
    L.append(f"- **Ton:** {TONE_SR[r['tone']]} (luma {r['luminance']:.2f}), prosečna boja {r['avgColor']}. **Odgovara:** {', '.join(r['fits']['verticals'])} · teme: {', '.join(r['fits']['themes'])}")
    if r['faces']: L.append(f"- **Lice prisutno:** da - " + '; '.join(pct(b) for b in r['faces']))
    else: L.append("- **Lice prisutno:** ne")
    if r['avoidOverlay']: L.append("- **Izbegavati preklop:** " + '; '.join(pct(b) for b in r['avoidOverlay']))
    if r['safeZones'] not in ('-',): L.append(f"- **Bezbedne zone za tekst:** {r['safeZones']}")
    if r['cropNotes'] not in ('-',): L.append(f"- **Kadriranje:** {r['cropNotes']}")
    for w in r['warnings']: L.append(f"- ⚠ {w}")
    L.append('')
L.append('## Upozorenja (sažeto)\n')
warns=[
 '**Hero isečak je AI-generisana osoba** (Higgsfield). Pre lansiranja zameniti pravom fotografijom (osnivač/tim) ili je ne predstavljati kao stvarnu zaposlenu/klijentkinju; u kadru je sako+bela majica (korporativan izgled, ne salon lepote).',
 '**Imena fajlova ne odgovaraju sadržaju** (na trenutnom sajtu pogrešno mapirano): `vertical-face` = sveća (ne tretman lica), `vertical-laser` = masaža leđa (ne laser), `vertical-esthetic` = spa za dvoje (ne botoks/hijaluron), `vertical-protocols` = facijalna masaža (idealna za „Tretmani lica“), `vertical-body` = ulja/aromaterapija, `founder-portrait` = stock maska za lice (NIJE portret osnivača; alt na sajtu „Dr Tamara Vujačić, osnivač“ je netačan), `location-*` = tretman/meditacija, ne enterijer lokacija.',
 '`location-waterfront.jpg` izgleda AI-generisano (artefakt na nosu); `vertical-face.jpg` ima artefakte upscalinga/preoštravanja; `cta-bg.png` je 256-bojni PNG, mekan i kompresovan (samo uz tamni preklop).',
 'Logotipi su rasterski 350 px (mekani na retina ekranima); `logo-transparent` ima alfa max 234 (isprano sivo) i nema svetlu verziju za tamne pozadine. Treba vektor iz brand booka.',
 'Poreklo/licenca stock fotografija (`about`, `vertical-*`, `founder-portrait`, `woman-portrait`, `cta-bg`) nije dokumentovano - proveriti pre produkcije.',
 'Direktorijum `source/` sadrži 9.9 MB original - isključiti iz deploy-a (`.vercelignore`).',
 'Nedostaju kadrovi: laser epilacija, estetske procedure (injektabilni tretmani), stvarni enterijer/lokacije Novi Beograd i Waterfront, stvarni tim.']
for w in warns: L.append(f'- {w}')
L.append('')
L.append(f'---\nPripremio ECHOSYSTEM-MOTHER AGENCY · {DATE}')
open(OUT+'/MANIFEST.md','w',encoding='utf-8').write('\n'.join(L)+'\n')
print('files',len(files),'total KB',manifest['totals']['kb'])
