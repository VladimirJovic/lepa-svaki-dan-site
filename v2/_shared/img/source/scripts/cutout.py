import numpy as np, sys, subprocess, os
from PIL import Image
from scipy import ndimage as ndi

SP='/private/tmp/claude-501/-Users-vladajovic-Developer-LEPA-SVAKI-DAN/bc2efc8a-11c4-49f0-aa07-b61dd8357a51/scratchpad'
OUT='/Users/vladajovic/Developer/LEPA SVAKI DAN/v2/_shared/img'

def clean_cutout(path, alpha_lo=6, alpha_hi=250, speck_area=300, speck_dist=20, w_span=130, w_off=10, verbose=True):
    im=Image.open(path).convert('RGBA')
    a=np.array(im).astype(np.float32)
    rgb=a[...,:3]; al=a[...,3].copy()
    al0=al.copy()
    # 1. remove alpha noise + remove isolated floating specks
    m=al>alpha_lo
    lab,n=ndi.label(m, structure=np.ones((3,3)))
    areas=ndi.sum(m,lab,index=np.arange(1,n+1))
    main=np.argmax(areas)+1
    dist_main=ndi.distance_transform_edt(lab!=main)
    kill=np.zeros_like(m)
    removed=0
    for i,ar in enumerate(areas, start=1):
        if i==main: continue
        comp=lab==i
        if ar<speck_area and dist_main[comp].min()>speck_dist:
            kill|=comp; removed+=1
    if verbose: print('components',n,'removed specks',removed, 'main area',areas[main-1])
    al[kill]=0
    # 2. levels: <=lo ->0, >=hi ->255
    al2=np.clip((al-alpha_lo)*255.0/(alpha_hi-alpha_lo),0,255)
    # 3. defringe / colour bleed
    solid=al0>=240
    d,(iy,ix)=ndi.distance_transform_edt(~solid, return_indices=True)
    near=rgb[iy,ix]
    w=np.clip((al0-w_off)/w_span,0,1)[...,None]
    w[al0>=240]=1.0
    rgb2=w*rgb+(1-w)*near
    out=np.dstack([np.clip(rgb2,0,255),al2]).round().astype(np.uint8)
    return Image.fromarray(out,'RGBA')

def trim(im, thr=8, margin=4):
    al=np.array(im)[...,3]
    ys,xs=np.where(al>thr)
    x0,y0,x1,y1=xs.min(),ys.min(),xs.max()+1,ys.max()+1
    x0=max(0,x0-margin); y0=max(0,y0-margin); x1=min(im.width,x1+margin); y1=min(im.height,y1+margin)
    return im.crop((x0,y0,x1,y1)), (x0,y0,x1,y1)

if __name__=='__main__':
    src=sys.argv[1]
    im=clean_cutout(src)
    t,box=trim(im)
    print('trim box',box,'->',t.size)
    t.save(SP+'/work/hero-cutout-clean-full.png')
