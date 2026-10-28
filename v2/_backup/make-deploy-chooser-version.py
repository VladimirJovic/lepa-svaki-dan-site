#!/usr/bin/env python3
"""Rebuild v2/_deploy/{a,b,c} from the working previews and scrub developer notes.
Run:  python3 v2/_tools/make-deploy.py   then   cd v2/_deploy && npx vercel@latest deploy --prod --yes   (delete .env.local afterwards)"""
import os,re,shutil,subprocess,sys
V2=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
BASE='https://lepa-svaki-dan-predlozi.vercel.app'
PAIRS=[('a-lumine','a'),('b-alder','b'),('c-luzia','c')]
EXCL=['--exclude=.DS_Store','--exclude=*.map','--exclude=README.txt','--exclude=source','--exclude=*.md']
for src,dst in PAIRS:
    subprocess.check_call(['rsync','-a','--delete']+EXCL+[f'{V2}/{src}/',f'{V2}/_deploy/{dst}/'])
RULES=[
 (r'_tools/[A-Za-z0-9_\-./]+','the build script'),
 (r'v2/_shared/[A-Za-z0-9_\-./]+','the shared content pack'),
 (r'(?i)client feedback(,? round 2)?','design notes'),
 (r'(?i)the owner sees what is missing; a public build refuses them','placeholders for the missing words'),
 (r'(?i)\bthe owner\b','the client'),
 (r'(?i)\bowner\b','client'),
]
import time
BUILD=time.strftime('%Y%m%d%H%M')
VER=re.compile(r"((?:\.\./|\./)*assets/(?:[A-Za-z0-9_\-]+/)*[A-Za-z0-9_\-]+\.js)(?=[\"'])")
n=0
for _,dst in PAIRS:
    for r,_d,fs in os.walk(f'{V2}/_deploy/{dst}'):
        for f in fs:
            if not f.endswith(('.html','.css','.js','.json','.svg','.txt')): continue
            p=os.path.join(r,f); s=open(p,encoding='utf8').read(); o=s
            for pat,rep in RULES: s=re.sub(pat,rep,s)
            if f.endswith(('.html','.js')): s=VER.sub(r'\1?v='+BUILD,s)
            if s!=o: open(p,'w',encoding='utf8').write(s); n+=1
print('scrubbed files:',n)
