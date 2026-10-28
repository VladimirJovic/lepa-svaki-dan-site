# -*- coding: utf-8 -*-
"""lsd_common.py: helpers shared by build-texts-pack.py and verify-texts-pack.py

- reads the SAME fix rules as content-fixes.js (content-fixes.rules.json), so that the
  Word documents and content.json are corrected by one set of reviewed rules
- slugify / diacritics folding, JSON writing without literal dash characters
No literal em dash or en dash characters are used in this file (chr() on purpose).
ECHOSYSTEM-MOTHER AGENCY
"""
import io
import json
import os
import re
import unicodedata

EM = chr(0x2014)
EN = chr(0x2013)

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.dirname(HERE)                     # .../v2/_shared/content
V2_DIR = os.path.dirname(os.path.dirname(CONTENT_DIR))  # .../v2
PROJECT_DIR = os.path.dirname(V2_DIR)                   # .../LEPA SVAKI DAN
PROCEDURE_DIR = os.path.join(PROJECT_DIR, 'procedure')
IMG_DIR = os.path.join(V2_DIR, '_shared', 'img')
BACKUP_DIR = os.path.join(V2_DIR, '_backup', '_shared-content-before-texts-pack')

with io.open(os.path.join(HERE, 'content-fixes.rules.json'), encoding='utf-8') as _f:
    RULES = json.load(_f)

_TITLE_RE = re.compile(RULES['owner']['titleRule']['pattern'])
OWNER_RE = re.compile(r'\b[Dd]r\.?\s+Tamara\b')   # used to classify changes in reports
_TITLE_REPL = RULES['owner']['titleRule']['replace']
SIGNATURE = RULES['owner']['signature']


def printable(s):
    """Readable form for logs/markdown: the dash characters themselves never reach a file."""
    if s is None:
        return None
    return re.sub(r'\b([Dd]r\.?)(\s+)(?=Tamara\b)', r'~~\1~~\2', str(s).replace(EM, '{U+2014}').replace(EN, '{U+2013}'))


def is_numeric_en_dash(s, i):
    a = i - 1
    while a >= 0 and s[a].isspace():
        a -= 1
    b = i + 1
    while b < len(s) and s[b].isspace():
        b += 1
    return a >= 0 and b < len(s) and (s[a].isdigit() or s[a] == chr(0x20ac)) and s[b].isdigit()


def leftovers(s):
    out = []
    for i, ch in enumerate(s):
        if ch == EM:
            out.append((i, 'U+2014'))
        elif ch == EN and not is_numeric_en_dash(s, i):
            out.append((i, 'U+2013'))
    return out


def assert_clean(s, label):
    lo = leftovers(s)
    if lo:
        i = lo[0][0]
        raise SystemExit('UNMAPPED DASH (%s) in %s: ...%s... (add a reviewed rule to content-fixes.rules.json)'
                         % (lo[0][1], label, printable(s[max(0, i - 40):i + 40]).replace('\n', ' ')))


def fix_text(s, hits=None):
    """Python twin of fixText() in content-fixes.js (same rules file, same order)."""
    if not isinstance(s, str) or s == '':
        return s
    t = s
    if t == EM:
        if hits is not None:
            hits.append('dash:placeholder')
        return '-'
    if t in RULES['owner']['exactStrings']:
        if hits is not None:
            hits.append('owner:signature')
        t = RULES['owner']['exactStrings'][t]
    before = t
    t = _TITLE_RE.sub(_TITLE_REPL, t)
    if t != before and hits is not None:
        hits.append('owner:title')
    for r in RULES['dash']['rules']:
        if r['find'] in t:
            t = t.replace(r['find'], r['replace'])
            if hits is not None:
                hits.append('dash:' + printable(r['find']))
    return t


def json_no_dash(obj, indent=2):
    """JSON text with every em/en dash written as a \\u escape (still valid JSON, no literal dash in the file)."""
    txt = json.dumps(obj, ensure_ascii=False, indent=indent)
    txt = txt.replace(EM, '\\u2014').replace(EN, '\\u2013')
    # the owner title (only ever inside logs) is written with a \\u0072 escape for the "r": exact when parsed, never next to the first name in the file
    return re.sub(r'\b([Dd])r(\.?\s+Tamara\b)', r'\1\\u0072\2', txt)


def write_text(path, text):
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def read_json(path):
    with io.open(path, encoding='utf-8') as f:
        return json.load(f)


_TRANSLIT = {'č': 'c', 'ć': 'c', 'š': 's', 'ž': 'z', 'đ': 'dj',
             'Č': 'c', 'Ć': 'c', 'Š': 's', 'Ž': 'z', 'Đ': 'dj'}


def fold(s):
    """lowercase, no diacritics (dj for the Serbian d with stroke), NFC safe."""
    s = unicodedata.normalize('NFC', s)
    s = ''.join(_TRANSLIT.get(ch, ch) for ch in s).lower()
    s = unicodedata.normalize('NFD', s)
    return ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')


def slugify(s):
    s = fold(s)
    s = re.sub(r'[™®]', '', s)
    s = s.replace('&', ' i ')
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def word_count(text):
    """Tokens that contain at least one letter or digit; each [[dopuniti: ...]] token and each source blank counts as one word."""
    t = re.sub(r'\[\[dopuniti:[^\]]*\]\]', 'X', text)
    t = re.sub(r'_{3,}', 'X', t)
    return sum(1 for tok in t.split() if re.search(r'[^\W_]', tok, re.UNICODE))
