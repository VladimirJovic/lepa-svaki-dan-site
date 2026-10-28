#!/usr/bin/env python3
"""Media pack builder - ECHOSYSTEM-MOTHER AGENCY.
Builds responsive webp variants, placeholders and the hero cutout for Lepa Svaki Dan v2 previews.
Usage: python3 build_media.py   (needs Pillow, numpy, scipy, cwebp)
Metadata (alt text, notes) is merged from meta.py -> manifest.json / MANIFEST.md.
"""
import os, sys, io, json, base64, shutil, subprocess, hashlib, datetime
import numpy as np
from PIL import Image, ImageOps, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout import clean_cutout, trim

SRC='/Users/vladajovic/Developer/LEPA SVAKI DAN/lepasvakidrugidan/assets/images'
HF ='/private/tmp/claude-501/-Users-vladajovic-Developer-LEPA-SVAKI-DAN/bc2efc8a-11c4-49f0-aa07-b61dd8357a51/scratchpad/ref/hf.png'
OUT='/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/_shared/img'
TMP='/private/tmp/claude-501/-Users-vladajovic-Developer-LEPA-SVAKI-DAN/bc2efc8a-11c4-49f0-aa07-b61dd8357a51/scratchpad/work/tmp'
os.makedirs(OUT,exist_ok=True); os.makedirs(OUT+'/source',exist_ok=True); os.makedirs(TMP,exist_ok=True)

WIDTHS=[480,800,1200,1800]
Q=78

def cwebp(src_png, dst, q=Q, alpha_q=90, extra=()):
    cmd=['cwebp','-q',str(q),'-alpha_q',str(alpha_q),'-m','6','-sharp_yuv','-mt','-quiet',*extra,src_png,'-o',dst]
    subprocess.run(cmd,check=True,capture_output=True)

def kb(path): return round(os.path.getsize(path)/1024,1)

def placeholder(im):
    """24px wide blurred base64 webp data-URI"""
    w=24; h=max(1,round(im.height*w/im.width))
    t=im.resize((w,h),Image.LANCZOS)
    if t.mode=='RGBA':
        t=t.filter(ImageFilter.GaussianBlur(0.7))
    else:
        t=t.filter(ImageFilter.GaussianBlur(0.9))
    b=io.BytesIO(); t.save(b,'WEBP',quality=45,method=6)
    return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode(), len(b.getvalue())

def analyse(im):
    """avg colour, luminance, 3x3 grid luminance + detail (std) on a small thumbnail (alpha-weighted for RGBA)"""
    t=im.copy(); t.thumbnail((240,240),Image.LANCZOS)
    a=np.array(t.convert('RGBA')).astype(np.float32)
    rgb=a[...,:3]; al=a[...,3]/255.0
    lum=(0.2126*rgb[...,0]+0.7152*rgb[...,1]+0.0722*rgb[...,2])/255.0
    wsum=al.sum()+1e-6
    avg=(rgb*al[...,None]).sum((0,1))/wsum
    L=float((lum*al).sum()/wsum)
    H,W=lum.shape
    grid=[]
    for r in range(3):
        row=[]
        for c in range(3):
            y0,y1=r*H//3,(r+1)*H//3; x0,x1=c*W//3,(c+1)*W//3
            m=al[y0:y1,x0:x1]>0.5
            if m.sum()<20: row.append(None); continue
            cell=lum[y0:y1,x0:x1][m]
            row.append({'lum':round(float(cell.mean()),2),'detail':round(float(cell.std()),3)})
        grid.append(row)
    return '#%02x%02x%02x'%tuple(int(round(v)) for v in avg), round(L,3), grid

def tone(L):
    return 'dark' if L<0.33 else ('mid' if L<0.55 else 'bright')

records={}

def process_photo(name, fname, alpha=False):
    p=os.path.join(SRC,fname)
    im=Image.open(p); im=ImageOps.exif_transpose(im)
    im=im.convert('RGBA' if alpha else 'RGB')
    if alpha:
        # colour bleed only (no alpha change) so resize/encode never leaks dark RGB into the edge
        im=clean_cutout(p, alpha_lo=0, alpha_hi=255, speck_area=0, w_off=0, w_span=1, verbose=False) if False else im
    sw,sh=im.size
    variants=[]
    for w in WIDTHS:
        if w>sw: continue
        h=round(sh*w/sw)
        r=im.resize((w,h),Image.LANCZOS)
        tmp=f'{TMP}/{name}-{w}.png'; r.save(tmp)
        out=f'{OUT}/{name}-{w}.webp'
        cwebp(tmp,out)
        variants.append({'w':w,'h':h,'file':f'{name}-{w}.webp','kb':kb(out)})
        os.remove(tmp)
    ph,phb=placeholder(im)
    avg,L,grid=analyse(im)
    records[name]={'id':name,'type':'cutout' if alpha else 'photo','source':f'lepasvakidrugidan/assets/images/{fname}',
        'sourceSize':[sw,sh],'sourceKB':kb(p),'hasAlpha':alpha,'variants':variants,
        'srcset':', '.join(f"{v['file']} {v['w']}w" for v in variants),
        'placeholder':ph,'placeholderBytes':phb,'avgColor':avg,'luminance':L,'tone':tone(L),'grid3x3':grid}

def process_logo(name, fname):
    p=os.path.join(SRC,fname)
    im=Image.open(p).convert('RGBA'); sw,sh=im.size
    al=np.array(im)[...,3]
    opaque=bool(al.min()==255)
    tmp=f'{TMP}/{name}.png'
    (im.convert('RGB') if opaque else im).save(tmp)
    out=f'{OUT}/{name}-{sw}.webp'
    subprocess.run(['cwebp','-lossless','-z','9','-quiet',tmp,'-o',out],check=True,capture_output=True)
    os.remove(tmp)
    avg,L,grid=analyse(im)
    records[name]={'id':name,'type':'logo','source':f'lepasvakidrugidan/assets/images/{fname}','sourceSize':[sw,sh],'sourceKB':kb(p),
        'hasAlpha':not opaque,'variants':[{'w':sw,'h':sh,'file':f'{name}-{sw}.webp','kb':kb(out)}],
        'srcset':f'{name}-{sw}.webp {sw}w','placeholder':None,'avgColor':avg,'luminance':L,'tone':tone(L),'grid3x3':None}

def process_cutout():
    shutil.copy2(HF, f'{OUT}/source/hero-cutout-higgsfield-original.png')
    assert hashlib.sha256(open(HF,'rb').read()).hexdigest()==hashlib.sha256(open(f'{OUT}/source/hero-cutout-higgsfield-original.png','rb').read()).hexdigest()
    im=clean_cutout(HF); t,box=trim(im)
    variants=[]
    for w in (600,900,1300):
        h=round(t.height*w/t.width)
        r=t.resize((w,h),Image.LANCZOS)
        tmp=f'{TMP}/hc-{w}.png'; r.save(tmp)
        out=f'{OUT}/hero-cutout-{w}.webp'
        cwebp(tmp,out,q=85,alpha_q=95)
        variants.append({'w':w,'h':h,'file':f'hero-cutout-{w}.webp','kb':kb(out)})
        os.remove(tmp)
    ph,phb=placeholder(t)
    avg,L,grid=analyse(t)
    records['hero-cutout']={'id':'hero-cutout','type':'cutout','source':'Higgsfield hf.png (AI-generated) - kopija u source/hero-cutout-higgsfield-original.png',
        'sourceSize':[2688,3024],'sourceKB':kb(HF),'trimmedSize':list(t.size),'trimBox':[int(v) for v in box],'hasAlpha':True,'variants':variants,
        'srcset':', '.join(f"{v['file']} {v['w']}w" for v in variants),'placeholder':ph,'placeholderBytes':phb,'avgColor':avg,'luminance':L,'tone':tone(L),'grid3x3':grid}
    return t

if __name__=='__main__':
    photos=[('about','about.jpg'),('cta-bg','cta-bg.png'),('founder-portrait','founder-portrait.jpg'),('hero-orhideja','hero-orhideja.jpg'),
            ('location-novi-beograd','location-novi-beograd.jpg'),('location-waterfront','location-waterfront.jpg'),
            ('vertical-body','vertical-body.jpg'),('vertical-esthetic','vertical-esthetic.jpg'),('vertical-face','vertical-face.jpg'),
            ('vertical-laser','vertical-laser.jpg'),('vertical-protocols','vertical-protocols.jpg')]
    for n,f in photos: process_photo(n,f)
    process_photo('woman-portrait','woman-portrait.png',alpha=True)
    process_logo('logo','logo.png'); process_logo('logo-transparent','logo-transparent.png')
    process_cutout()
    json.dump(records,open(TMP+'/records.json','w'),indent=1)
    for k,v in records.items():
        print(k, v['sourceSize'], [ (x['w'],x['kb']) for x in v['variants']], v['tone'], v['luminance'])
