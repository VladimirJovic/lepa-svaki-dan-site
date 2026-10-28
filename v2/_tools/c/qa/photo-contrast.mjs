// Text over photos: hide the text, screenshot the pixels behind each text box, and report the worst-case (lightest / darkest) contrast against the real text colour.
import { launch, newPage, sleep, scrollThrough, BASE, OUT } from './lib.mjs';
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const dir = OUT + 'pc-contrast/'; fs.mkdirSync(dir, { recursive: true });
const jobs = [
  ['index.html', ['.work__title', '.work__sum', '.work__tags .chip', '.sp__eyebrow', '.sp__name', '.sp__area', '.sp__addr', '.sp__phone', '.sp__phone a']],
  ['tretmani/telo.html', ['.shero__h1', '.shero__intro', '.shero__in .crumbs li', '.shero__chips .chip', '.shero__eyebrow']],
  ['tretmani/kozmeticki-tretmani.html', ['.shero__h1', '.shero__intro', '.shero__in .crumbs li', '.shero__chips .chip', '.shero__eyebrow']],
  ['tretmani/estetske-procedure.html', ['.shero__h1', '.shero__intro', '.shero__in .crumbs li', '.shero__chips .chip', '.shero__eyebrow']],
  ['tretmani/dermatologija.html', ['.shero__h1', '.shero__intro', '.shero__in .crumbs li', '.shero__chips .chip', '.shero__eyebrow']]
];
const b = await launch(); const items = [];
for (const [pg, sels] of jobs) for (const W of [390, 1440]) {
  const p = await newPage(b, W, W < 768 ? 844 : 900, { dpr: 1 });
  await p.goto(`${BASE}/${pg}`, { waitUntil: 'load' }); await sleep(500); await scrollThrough(p, 700);
  await p.addStyleTag({ content: '.nav,.bar,.lsd-rv{visibility:hidden!important} *,*::before,*::after{transition:none!important;animation:none!important}' });
  // open the first half on phones so its text is laid out
  for (const sel of sels) {
    const n = await p.$$eval(sel, (els) => els.length);
    for (let i = 0; i < Math.min(n, 6); i++) {
      const info = await p.evaluate((sel, i) => {
        const el = document.querySelectorAll(sel)[i]; if (!el) return null;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length) return null;
        const bgChip = /rgba\((?!.*, 0\))|rgb\(/.test(cs.backgroundColor) && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        return { color: cs.color, chip: bgChip, bg: cs.backgroundColor };
      }, sel, i);
      if (!info) continue; await sleep(120);
      const name = `${pg.replace(/[^a-z]/g, '')}-${W}-${sel.replace(/[^a-z]/gi, '')}-${i}`;
      const rects = await p.evaluate((sel, i) => { const el = document.querySelectorAll(sel)[i]; el.setAttribute('data-pc', '1'); return [...el.getClientRects()].map((r) => ({ x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height })); }, sel, i);
      await p.addStyleTag({ content: '[data-pc], [data-pc] * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }' });
      const r = rects[0]; if (!r || r.width < 4 || r.height < 4) { await p.evaluate(() => document.querySelectorAll('[data-pc]').forEach((e) => e.removeAttribute('data-pc'))); continue; }
      // chips carry their own background: keep it (it is part of what the text sits on)
      await p.screenshot({ path: dir + name + '.png', clip: { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, W - Math.max(0, r.x)), height: r.height } });
      items.push({ f: name + '.png', color: info.color, label: `${pg} @${W} ${sel}[${i}]` });
      await p.evaluate(() => document.querySelectorAll('[data-pc]').forEach((e) => e.removeAttribute('data-pc')));
      await p.reload({ waitUntil: 'load' }).catch(() => {}); await sleep(250); await scrollThrough(p, 900);
      await p.addStyleTag({ content: '.nav,.bar,.lsd-rv{visibility:hidden!important} *,*::before,*::after{transition:none!important;animation:none!important}' });
    }
  }
  await p.close();
}
await b.close();
fs.writeFileSync(dir + 'items.json', JSON.stringify(items));
const py = `
import json,sys
from PIL import Image
d=sys.argv[1]; items=json.load(open(d+'items.json'))
def lin(c):
    c/=255
    return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def L(rgb): return 0.2126*lin(rgb[0])+0.7152*lin(rgb[1])+0.0722*lin(rgb[2])
import re
worst=[]
for it in items:
    im=Image.open(d+it['f']).convert('RGB'); ix=min(10,im.width//5); iy=min(5,im.height//4); im=im.crop((ix,iy,im.width-ix,im.height-iy)); px=list(im.getdata())
    m=re.findall(r'[\\d.]+',it['color']); tc=[float(x) for x in m[:4]]
    if len(tc)==4 and tc[3]==0: tc=[148,96,58]
    Lt=L(tc)
    ls=sorted(L(p) for p in px); n=len(ls)
    lo=ls[int(n*0.02)]; hi=ls[min(n-1,int(n*0.98))]
    def cr(a,b): 
        a,b=max(a,b),min(a,b); return (a+0.05)/(b+0.05)
    c=min(cr(Lt,lo),cr(Lt,hi))
    worst.append((c,it['label'],it['color']))
worst.sort()
for c,l,col in worst[:25]: print(f'{c:5.2f}  {col:22s} {l}')
print('items',len(worst),'below 4.5:',sum(1 for w in worst if w[0]<4.5))
`;
fs.writeFileSync(dir + 'calc.py', py);
console.log(execFileSync('python3', [dir + 'calc.py', dir], { encoding: 'utf8' }));
