#!/usr/bin/env python3
"""Build the PUBLIC site (v2/_deploy) from the chosen version A (v2/a-lumine) and scrub developer notes.
The site now lives at the ROOT of https://lepa-svaki-dan-predlozi.vercel.app (no theme chooser; old /a/ /b/ /c/ links redirect to /).
Run:  python3 v2/_tools/make-deploy.py   then   cd v2/_deploy && npx vercel@latest deploy --prod --yes   (delete .env.local afterwards)"""
import os,re,json,subprocess,time
V2=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
SRC=f'{V2}/a-lumine'; OUT=f'{V2}/_deploy'
BASE='https://lepa-svaki-dan-predlozi.vercel.app'
EXCL=['--exclude=.DS_Store','--exclude=*.map','--exclude=README.txt','--exclude=source','--exclude=*.md',
      '--exclude=.vercel','--exclude=vercel.json','--exclude=.gitignore','--exclude=.env.local']
subprocess.check_call(['rsync','-a','--delete']+EXCL+[f'{SRC}/',f'{OUT}/'])
RULES=[
 (r'_tools/[A-Za-z0-9_\-./]+','the build script'),
 (r'v2/_shared/[A-Za-z0-9_\-./]+','the shared content pack'),
 (r'(?i)client feedback(,? round 2)?','design notes'),
 (r'(?i)the owner sees what is missing; a public build refuses them','placeholders for the missing words'),
 (r'(?i)\bthe owner\b','the client'),
 (r'(?i)\bowner\b','client'),
 (r'(?i)\bTODO\b','note'),
]
BUILD=time.strftime('%Y%m%d%H%M')
VER=re.compile(r"((?:\.\./|\./)*assets/(?:[A-Za-z0-9_\-]+/)*[A-Za-z0-9_\-]+\.js)(?=[\"'])")
n=0
for r,_d,fs in os.walk(OUT):
    if '/.vercel' in r: continue
    for f in fs:
        if not f.endswith(('.html','.css','.js','.json','.svg','.txt')): continue
        p=os.path.join(r,f); s=open(p,encoding='utf8').read(); o=s
        for pat,rep in RULES: s=re.sub(pat,rep,s)
        if f.endswith(('.html','.js')): s=VER.sub(r'\1?v='+BUILD,s)
        if f=='index.html' and r==OUT:
            s=s.replace(BASE+'/a/',BASE+'/')
        if s!=o: open(p,'w',encoding='utf8').write(s); n+=1
print('scrubbed files:',n,'| build',BUILD)
vj={
 "cleanUrls": False, "trailingSlash": True,
 "redirects": [
   {"source":"/a","destination":"/","permanent":False},
   {"source":"/a/","destination":"/","permanent":False},
   {"source":"/b/","destination":"/","permanent":False},
   {"source":"/c/","destination":"/","permanent":False},
   {"source":"/a/:path*","destination":"/:path*","permanent":False},
   {"source":"/b","destination":"/","permanent":False},
   {"source":"/b/:path*","destination":"/","permanent":False},
   {"source":"/c","destination":"/","permanent":False},
   {"source":"/c/:path*","destination":"/","permanent":False}],
 "headers": [
   {"source":"/(.*)","headers":[{"key":"X-Robots-Tag","value":"noindex, nofollow"},{"key":"X-Content-Type-Options","value":"nosniff"},{"key":"Referrer-Policy","value":"strict-origin-when-cross-origin"}]},
   {"source":"/assets/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=86400"}]},
   {"source":"/assets/(.*)\\.js","headers":[{"key":"Cache-Control","value":"public, max-age=0, must-revalidate"}]}]}
json.dump(vj,open(f'{OUT}/vercel.json','w'),indent=2)
print('vercel.json written (redirects /a /b /c -> /)')
