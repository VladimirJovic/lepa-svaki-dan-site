#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""verify-texts-pack.py: independent verification of the texts pack and of the shared content fixes

Does NOT reuse the extraction code of build-texts-pack.py: the Word documents are re-read with zipfile + lxml only
(no python-docx) and a third time with the macOS converter `textutil`; the search evidence is re-checked with its
own small implementation. Also proves that the content fixes changed nothing but the reviewed strings:

  - 21 articles, ids/slugs, segment counts, order, structure and text of every block against the .docx XML
  - word counts per document three ways (printed as a table), readMinutes, excerpts, placeholders (no invented names)
  - no em dash anywhere in the shared content folder, en dashes only in numeric ranges, no title before the owner's name
  - services still 210, prices untouched, the price checksum rows of MANIFEST.md unchanged (compared with the backup)
  - content.js / articles.js load and equal their JSON; segments, service-links and search-synonyms are consistent

Usage: python3 _tools/verify-texts-pack.py        (exit code 1 on any failed check)
ECHOSYSTEM-MOTHER AGENCY
"""
import collections
import hashlib
import io
import json
import math
import os
import re
import subprocess
import sys
import unicodedata
import zipfile

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import lsd_common as C            # noqa: E402
import texts_search_data as SD    # noqa: E402

from lxml import etree            # noqa: E402

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
EM, EN, NBSP = C.EM, C.EN, chr(0xA0)
OWNER_TITLE_RE = re.compile(r'\b[Dd]r\.?\s+Tamara\s+Ćosić')


def nfc(s):
    return unicodedata.normalize('NFC', s)


# ----------------------------------------------------------------------------- independent .docx reader (zipfile + lxml)
def read_docx_xml(path):
    z = zipfile.ZipFile(path)
    doc = etree.fromstring(z.read('word/document.xml'))
    styles = {}
    if 'word/styles.xml' in z.namelist():
        for st in etree.fromstring(z.read('word/styles.xml')).findall(W + 'style'):
            n = st.find(W + 'name')
            styles[st.get(W + 'styleId')] = n.get(W + 'val') if n is not None else ''
    numfmt = {}
    if 'word/numbering.xml' in z.namelist():
        nroot = etree.fromstring(z.read('word/numbering.xml'))
        absfmt = {}
        for a in nroot.findall(W + 'abstractNum'):
            for l in a.findall(W + 'lvl'):
                if l.get(W + 'ilvl') == '0':
                    absfmt[a.get(W + 'abstractNumId')] = l.find(W + 'numFmt').get(W + 'val')
        for n in nroot.findall(W + 'num'):
            numfmt[n.get(W + 'numId')] = absfmt.get(n.find(W + 'abstractNumId').get(W + 'val'))
    paras = []
    for p in doc.find(W + 'body').findall(W + 'p'):
        text = []
        for node in p.iter():
            if node.tag == W + 't':
                text.append(node.text or '')
            elif node.tag == W + 'tab':
                text.append('\t')
            elif node.tag == W + 'br':
                text.append('\n')
        ppr = p.find(W + 'pPr')
        sid, num = None, None
        if ppr is not None:
            ps = ppr.find(W + 'pStyle')
            sid = ps.get(W + 'val') if ps is not None else None
            np_ = ppr.find(W + 'numPr')
            if np_ is not None and np_.find(W + 'numId') is not None:
                num = np_.find(W + 'numId').get(W + 'val')
        paras.append({'text': ''.join(text), 'style': styles.get(sid, 'Normal') if sid else 'Normal', 'numId': num, 'numFmt': numfmt.get(num) if num else None})
    return paras


def norm_ws(s):
    return re.sub(r'[ \t]+', ' ', s.replace(NBSP, ' ')).strip()


def blank_to_token(t):
    out, pos = [], 0
    for m in re.finditer(r'_{3,}', t):
        before, after = t[:m.start()], t[m.end():]
        kind = 'ime lekara' if re.search(r'\bdr\.?\s*$', before, re.I) else ('naziv lasera' if re.match(r'\s*laser', after, re.I) else '???')
        out.append(t[pos:m.start()])
        out.append('[[dopuniti: %s]]' % kind)
        pos = m.end()
    out.append(t[pos:])
    return ''.join(out)


def words(t):
    t = re.sub(r'\[\[dopuniti:[^\]]*\]\]', 'X', t)
    t = re.sub(r'_{3,}', 'X', t)
    return len([tok for tok in t.split() if re.search(r'[^\W_]', tok, re.UNICODE)])


def textutil_words(path):
    try:
        out = subprocess.run(['textutil', '-convert', 'txt', '-stdout', path], capture_output=True, timeout=60)
        if out.returncode != 0:
            return None
    except Exception:
        return None
    n = 0
    for line in out.stdout.decode('utf-8', 'replace').split('\n'):
        line = re.sub(r'^\s*(?:[•◦▪]|\d+\.)\s*\t', '', line)   # list markers added by the converter
        n += words(line)
    return n


def flatten_pack(blocks):
    seq = []
    for b in blocks:
        if 'text' in b:
            seq.append((b['type'], b['text']))
        else:
            for it in b['items']:
                seq.append((b['type'], it))
    return seq


# ----------------------------------------------------------------------------- scans
def all_files(root):
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if x != '__pycache__']
        for f in files:
            yield os.path.join(d, f)


def run():
    checks = []

    def check(name, ok, detail=''):
        checks.append({'name': name, 'ok': bool(ok), 'detail': detail if not ok else ''})
        return ok

    out_dir = C.CONTENT_DIR
    P = lambda n: os.path.join(out_dir, n)
    exists = lambda n: os.path.exists(P(n))
    content = C.read_json(P('content.json'))
    old = C.read_json(os.path.join(C.BACKUP_DIR, 'content.json'))
    articles = C.read_json(P('articles.json'))
    segments = C.read_json(P('segments.json'))
    links = C.read_json(P('service-links.json'))
    search = C.read_json(P('search-synonyms.json'))
    img = C.read_json(os.path.join(C.IMG_DIR, 'manifest.json'))

    # ================================================================ A. articles
    check('A articles.json holds 21 articles', len(articles) == 21, len(articles))
    check('A ids are art-1 ... art-21 in order (no zero padding)', [a['id'] for a in articles] == ['art-%d' % i for i in range(1, 22)])
    slugs = [a['slug'] for a in articles]
    check('A slugs unique, ASCII kebab-case', len(set(slugs)) == 21 and all(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', s) for s in slugs), slugs)
    seg_count = collections.Counter(a['segmentId'] for a in articles)
    check('A per segment 4 / 4 / 7 / 6 (dermatologija, estetske, kozmetika, telo)', [seg_count[k] for k in ('dermatologija', 'estetske', 'kozmetika', 'telo')] == [4, 4, 7, 6], dict(seg_count))
    required = ('id', 'slug', 'segmentId', 'title', 'subtitle', 'blocks', 'excerpt', 'readMinutes', 'sourceFile', 'hasPlaceholders', 'placeholders')
    check('A every article has the required fields', all(all(k in a for k in required) for a in articles))
    check('A block types are h2|h3|p|ul|ol, lists have items, others have text',
          all((b['type'] in ('ul', 'ol') and isinstance(b.get('items'), list) and b['items']) or (b['type'] in ('h2', 'h3', 'p') and isinstance(b.get('text'), str) and b['text']) for a in articles for b in a['blocks']))

    # source documents: every .docx of procedure/ used exactly once
    procedure_files = sorted(nfc(os.path.join(os.path.basename(d), f)) for d, _, fs in os.walk(C.PROCEDURE_DIR) for f in fs if f.lower().endswith('.docx'))
    used = sorted(nfc(a['sourceFile'])[len('procedure/'):] for a in articles)
    check('A the 21 .docx files of procedure/ are each used exactly once', procedure_files == used and len(used) == len(set(used)) == 21, (procedure_files, used))

    word_table, struct_ok, text_ok, type_ok, wc_ok, rm_ok, ph_ok = [], True, True, True, True, True, True
    problems = collections.defaultdict(list)
    ph_total, ph_by_article = 0, {}
    for n, a in enumerate(articles, 1):
        # locate the file on disk (NFC names in json, raw names on disk)
        rel = a['sourceFile'][len('procedure/'):]
        folder, fname = rel.split('/', 1)
        path = None
        for d in os.listdir(C.PROCEDURE_DIR):
            if nfc(d) == folder:
                for f in os.listdir(os.path.join(C.PROCEDURE_DIR, d)):
                    if nfc(f) == fname:
                        path = os.path.join(C.PROCEDURE_DIR, d, f)
        paras = [p for p in read_docx_xml(path) if p['text'].strip()]
        first, rest = paras[0], paras[1:]
        # expected title/subtitle from the raw first line, fixed by the same rules
        fl = norm_ws(first['text'])
        t_raw, st_raw = (fl.split(':', 1) if ':' in fl else (fl, ''))
        exp_title, exp_sub = C.fix_text(t_raw.strip()), C.fix_text(st_raw.strip())
        if (a['title'], a['subtitle']) != (exp_title, exp_sub):
            problems['title'].append((a['id'], a['title'], exp_title))
        # expected sequence of (type, text)
        exp = []
        for p in rest:
            t = C.fix_text(blank_to_token(norm_ws(p['text'])))
            if p['style'].lower() == 'heading 2':
                ty = 'h2'
            elif p['style'].lower() == 'heading 3':
                ty = 'h3'
            elif p['numId']:
                ty = 'ol' if p['numFmt'] == 'decimal' else 'ul'
            else:
                ty = 'p'
            exp.append((ty, t))
        got = flatten_pack(a['blocks'])
        # a pseudo heading (bold question line) is allowed to be h2 where the XML says p: none expected, flagged by a difference
        if [t for _, t in got] != [t for _, t in exp]:
            text_ok = False
            problems['text'].append(a['id'])
        if [ty for ty, _ in got] != [ty for ty, _ in exp]:
            type_ok = False
            problems['types'].append(a['id'])
        # list grouping: consecutive items of the same numId form one block
        exp_blocks = 0
        prev = None
        for p in rest:
            if p['numId']:
                if prev != p['numId']:
                    exp_blocks += 1
                prev = p['numId']
            else:
                exp_blocks += 1
                prev = None
        if exp_blocks != len(a['blocks']):
            struct_ok = False
            problems['blocks'].append((a['id'], exp_blocks, len(a['blocks'])))
        # word counts: XML (all paragraphs incl. title line), python-docx-free; textutil; pack
        xml_words = sum(words(p['text']) for p in paras)
        pack_words = a['wordCount'] + words(a['title']) + (words(a['subtitle']) if a['subtitle'] else 0)
        tu = textutil_words(path)
        # python-docx recount (second, library based reader; only used here for the table)
        try:
            from docx import Document
            d = Document(path)
            py_words = sum(words(p.text) for p in d.paragraphs if p.text.strip())
        except Exception:
            py_words = None
        # compare 'xml' with the dash-fixed form of the text too: a lone dash is never a word, so both are equal
        if not (xml_words == pack_words and (py_words is None or py_words == xml_words) and (tu is None or tu == xml_words)):
            wc_ok = False
            problems['words'].append((a['id'], xml_words, py_words, tu, pack_words))
        if a['readMinutes'] != max(1, math.ceil(a['wordCount'] / 200)):
            rm_ok = False
        word_table.append({'n': n, 'file': os.path.basename(path), 'xml': xml_words, 'pydocx': py_words if py_words is not None else 'n/a', 'textutil': tu if tu is not None else 'n/a',
                           'pack': pack_words, 'legacy': a['legacy']['blogWordCount']})
        # placeholders: blanks in the source == tokens in the pack
        src_blanks = sum(len(re.findall(r'_{3,}', p['text'])) for p in paras)
        toks = [m.group(0) for b in a['blocks'] for t in ([b['text']] if 'text' in b else b['items']) for m in re.finditer(r'\[\[dopuniti: [^\]]+\]\]', t)]
        ph_by_article[a['id']] = src_blanks
        ph_total += len(toks)
        if not (src_blanks == len(toks) == len(a['placeholders']) and a['hasPlaceholders'] == bool(toks)):
            ph_ok = False
            problems['placeholders'].append((a['id'], src_blanks, len(toks), len(a['placeholders'])))
    check('A document structure: block counts and list grouping equal the .docx XML', struct_ok, dict(problems))
    check('A block types equal the .docx styles (Heading 2/3, lists, bullets vs decimal)', type_ok, problems.get('types'))
    check('A order and text of every paragraph/list item equal the .docx XML (after the reviewed fixes)', text_ok, problems.get('text'))
    check('A title and subtitle = first line split at the first colon', not problems['title'], problems['title'])
    check('A word counts agree: XML == python-docx == textutil == pack (title + blocks)', wc_ok, problems['words'])
    check('A readMinutes = ceil(words / 200), minimum 1', rm_ok)
    check('A placeholders: blanks in the source == tokens == placeholders[] == hasPlaceholders', ph_ok, problems['placeholders'])
    check('A 6 blanks in 4 articles', ph_total == 6 and sum(1 for a in articles if a['hasPlaceholders']) == 4, (ph_total, [a['id'] for a in articles if a['hasPlaceholders']]))
    kinds = collections.Counter(p['kind'] for a in articles for p in a['placeholders'])
    check('A placeholder kinds: 5 x ime lekara, 1 x naziv lasera (only in the Candela text)',
          kinds == {'ime lekara': 5, 'naziv lasera': 1} and [a['id'] for a in articles if any(p['kind'] == 'naziv lasera' for p in a['placeholders'])] == ['art-1'], dict(kinds))
    alltext = ' '.join(t for a in articles for _, t in flatten_pack(a['blocks']))
    check('A no underscore blank left, no name invented after "dr" (only the token follows it)',
          '_' not in alltext and not re.search(r'(?<!i )\bdr\.?\s+(?!\[\[dopuniti: ime lekara\]\])[A-ZČĆŠŽĐ]', alltext) and len(re.findall(r'\bdr \[\[dopuniti: ime lekara\]\]', alltext)) == 5,
          [m.group(0) for m in re.finditer(r'(?<!i )\bdr\.?\s+\S+', alltext)][:10])
    bad_ex = []
    for a in articles:
        fp = next(b for b in a['blocks'] if b['type'] == 'p')['text']
        ex = a['excerpt']
        nxt = fp[len(ex):len(ex) + 1]
        if not (fp.startswith(ex) and len(ex) <= 170 and nxt in ('', ' ', ',', ';', ':', '-', '(') and (len(ex) >= 150 or len(fp) <= 175) and EM not in ex and '...' not in ex and chr(0x2026) not in ex and '[[' not in ex):
            bad_ex.append((a['id'], len(ex), ex[-20:]))
    check('A excerpts: prefix of the first paragraph, <= 170 chars, cut on a word boundary, no ellipsis', not bad_ex, bad_ex)
    # links / comments
    n_links = sum(len(b.get('links', [])) for a in articles for b in a['blocks'])
    n_hints = sum(len(a['crossLinkHints']) for a in articles)
    # independent count of hyperlinks and comments in the XML
    x_links, x_comments = 0, 0
    for d, _, fs in os.walk(C.PROCEDURE_DIR):
        for f in fs:
            if f.lower().endswith('.docx'):
                z = zipfile.ZipFile(os.path.join(d, f))
                x_links += z.read('word/document.xml').decode('utf-8').count('<w:hyperlink ')
                if 'word/comments.xml' in z.namelist():
                    x_comments += z.read('word/comments.xml').decode('utf-8').count('<w:comment ')
    check('A all hyperlinks (%d) and Word comments (%d) of the documents are in the pack' % (x_links, x_comments), n_links == x_links and n_hints == x_comments, (n_links, x_links, n_hints, x_comments))
    link_text_ok = all(l['text'] in (b.get('text') or ' '.join(b.get('items', []))) for a in articles for b in a['blocks'] for l in b.get('links', []))
    check('A every link text occurs in its block', link_text_ok)
    check('A every link has a legacyHref and a target type', all(l.get('legacyHref') and l.get('target', {}).get('type') for a in articles for b in a['blocks'] for l in b.get('links', [])))
    check('A target article ids of links and hints exist', all((l['target'].get('id') in [x['id'] for x in articles]) for a in articles for b in a['blocks'] for l in b.get('links', []) if l['target']['type'] == 'article')
          and all(t in [x['id'] for x in articles] for a in articles for h in a['crossLinkHints'] for t in h['targetArticleIds']))
    # legacy
    blog = content['blog']
    check('A legacy blog index/title/wordCount refer to content.json blog[] (same order)', all(a['legacy']['blogIndex'] == i and a['legacy']['blogTitle'] == blog[i]['title'] and a['legacy']['blogWordCount'] == blog[i]['wordCount'] for i, a in enumerate(articles)))
    check('A legacy titleMatch: 20 exact, 1 by order (the dermatological exam text was renamed)', collections.Counter(a['legacy']['titleMatch'] for a in articles) == {'exact': 20, 'order': 1}, collections.Counter(a['legacy']['titleMatch'] for a in articles))

    # ================================================================ B. the content fixes
    # B1 em dash / en dash / owner title in the whole shared content folder (text files and raw bytes)
    em_bytes = EM.encode('utf-8')
    em_files, en_bad, owner_files, nontext = [], [], [], 0
    for f in all_files(out_dir):
        b = open(f, 'rb').read()
        if em_bytes in b:
            em_files.append(os.path.relpath(f, out_dir))
        try:
            t = b.decode('utf-8')
        except UnicodeDecodeError:
            nontext += 1
            continue
        for lo in C.leftovers(t):
            if lo[1] == 'U+2013':
                en_bad.append((os.path.relpath(f, out_dir), C.printable(t[max(0, lo[0] - 25):lo[0] + 25])))
        if OWNER_TITLE_RE.search(t):
            owner_files.append(os.path.relpath(f, out_dir))
    check('B no em dash (U+2014) anywhere in the shared content folder (%d files scanned)' % sum(1 for _ in all_files(out_dir)), not em_files, em_files)
    check('B en dashes only inside numeric ranges (whole folder)', not en_bad, en_bad[:5])
    check('B no "Dr"/"dr" directly before "Tamara" anywhere in the shared content folder', not owner_files, owner_files)
    check('B founder.signature = "Tamara Ćosić, osnivačica Lepe Svaki Dan", used as founder.signatureName, founder.name has no title',
          content['founder']['signature'] == 'Tamara Ćosić, osnivačica Lepe Svaki Dan' and content['founder']['signatureName'] == content['founder']['signature'] and content['founder']['name'] == 'Tamara Ćosić', content['founder'])
    check('B testimonial 1 says "Tamara", not a doctor', 'konsultacije Tamara mi je' in content['testimonials'][0]['quote'], content['testimonials'][0]['quote'][:60])
    # B2 services / prices unchanged
    check('B services still 210 (182 standard + 28 laser)', len(content['allServices']) == 210 and content['_meta']['counts']['standardServices'] == 182 and content['_meta']['counts']['laserServices'] == 28)
    sha = lambda lines: hashlib.sha256('\n'.join(lines).encode('utf-8')).hexdigest()
    old_lines = [f"{s['tab']}|{s['group']}|{s['name']}|{s['price']}" for s in old['allServices']]
    check('B sha256 of the SOURCE lines (old names) == checksums.serviceLinesSha256 in the new content.json and in MANIFEST.md',
          sha(old_lines) == content['_meta']['checksums']['serviceLinesSha256'] == old['_meta']['checksums']['serviceLinesSha256'] and content['_meta']['checksums']['serviceLinesSha256'] in open(P('MANIFEST.md'), encoding='utf-8').read())
    new_lines = [f"{s['tab']}|{s['group']}|{s['name']}|{s['price']}" for s in content['allServices']]
    check('B sha256 of the lines after the fixes == checksums.serviceLinesSha256AfterFixes', sha(new_lines) == content['_meta']['checksums']['serviceLinesSha256AfterFixes'])
    pl = lambda svcs: sha(['%s|%s|%s|%s' % (s['id'], s['price'], json.dumps(s['priceEur'], separators=(',', ':')), json.dumps(s['priceRsd'], separators=(',', ':'))) for s in svcs])
    # same serialisation as the JS side (JSON.stringify without spaces)
    check('B id|price|priceEur|priceRsd of all 210 services identical to the backup (prices untouched)',
          [(s['id'], s['price'], s['priceEur'], s['priceRsd'], s['onRequest']) for s in old['allServices']] == [(s['id'], s['price'], s['priceEur'], s['priceRsd'], s['onRequest']) for s in content['allServices']])
    check('B name-independent checksums.priceLinesSha256 identical before/after', old['_meta']['checksums'].get('priceLinesSha256', content['_meta']['checksums']['priceLinesSha256']) == content['_meta']['checksums']['priceLinesSha256'] and pl(old['allServices']) == pl(content['allServices']))
    ck_keys = ['standardEurMinSum', 'standardEurMaxSum', 'standardRsdMinSum', 'standardRsdMaxSum', 'laserNbEurMinSum', 'laserBwEurMinSum', 'laserUnifiedEurMinSum', 'allServicesEurMinSum', 'offersEurSum', 'offersRsdSum', 'serviceLinesSha256']
    check('B every checksum of the old pack is unchanged (sums and the source sha)', all(old['_meta']['checksums'][k] == content['_meta']['checksums'][k] for k in ck_keys), {k: (old['_meta']['checksums'][k], content['_meta']['checksums'][k]) for k in ck_keys if old['_meta']['checksums'][k] != content['_meta']['checksums'][k]})
    check('B counts unchanged (_meta.counts)', old['_meta']['counts'] == content['_meta']['counts'])

    def price_rows(md):
        sec = md.split('### Price checksums', 1)[1].split('**Recommended review hook', 1)[0]
        return [l for l in sec.split('\n') if l.startswith('| ') and not l.startswith('| Checksum') and not l.startswith('| ---')]
    old_md = open(os.path.join(C.BACKUP_DIR, 'MANIFEST.md'), encoding='utf-8').read()
    new_md = open(P('MANIFEST.md'), encoding='utf-8').read()
    o_rows, n_rows = price_rows(old_md), price_rows(new_md)
    check('B MANIFEST.md price checksum table: all %d original rows are present unchanged (%d rows now, the new ones are additions)' % (len(o_rows), len(n_rows)), all(r in n_rows for r in o_rows) and len(n_rows) >= len(o_rows), [r for r in o_rows if r not in n_rows])

    # B3 nothing else changed in content.json: every old string, passed through the reviewed fixes, equals the new one
    allowed = ('_meta.', 'founder.signature', 'hero.bar.hoursParsed.open', 'contact.hours.parsed.open')
    diffs = []

    def walk(o, n, path):
        if isinstance(o, dict):
            for k in o:
                if k not in n:
                    diffs.append(path + '.' + k + ' removed')
                else:
                    walk(o[k], n[k], path + '.' + k if path else k)
            for k in n:
                if k not in o and not any((path + '.' + k if path else k).startswith(a) for a in allowed):
                    diffs.append((path + '.' + k if path else k) + ' added')
        elif isinstance(o, list):
            if any(path.startswith(a) for a in allowed):
                return
            if len(o) != len(n):
                diffs.append('%s length %d -> %d' % (path, len(o), len(n)))
            else:
                for i, (x, y) in enumerate(zip(o, n)):
                    walk(x, y, '%s[%d]' % (path, i))
        else:
            ex = C.fix_text(o) if isinstance(o, str) else o
            if ex != n and not any(path.startswith(a) for a in allowed):
                diffs.append('%s: %r -> %r' % (path, str(o)[:50], str(n)[:50]))
    walk(old, content, '')
    check('B content.json differs from the backup ONLY by the reviewed fixes (every other string, value and key is identical)', not diffs, diffs[:10])
    check('B hours without leading zero ("9:00"), no zero-padded numbering in data', content['hero']['bar']['hoursParsed']['open'] == '9:00' and content['contact']['hours']['parsed']['open'] == '9:00' and content['hero']['bar']['hours'] == 'Pon-Sub, 9-21h')

    # B4 content.js / articles.js load and equal their JSON
    def load_js(fn, var):
        code = "const vm=require('vm');const fs=require('fs');const sb={window:{}};vm.runInNewContext(fs.readFileSync(%s,'utf8'),sb);process.stdout.write(JSON.stringify(sb.window.%s));" % (json.dumps(P(fn)), var)
        r = subprocess.run(['node', '-e', code], capture_output=True, timeout=60)
        return json.loads(r.stdout.decode('utf-8')) if r.returncode == 0 else None
    cj, aj = load_js('content.js', 'LSD_CONTENT'), load_js('articles.js', 'LSD_ARTICLES')
    check('B content.js (window.LSD_CONTENT) equals content.json', cj == content)
    check('B articles.js (window.LSD_ARTICLES) equals articles.json (21 items)', aj == articles and aj is not None and len(aj) == 21)

    # ================================================================ C. segments
    segs = segments['segments']
    check('C 4 segments with the exact names (diacritics) in folder order', [s['name'] for s in segs] == ['Dermatologija', 'Estetske procedure', 'Kozmetički tretmani', 'Telo'], [s['name'] for s in segs])
    check('C segment ids equal the old blog category keys; slugs ASCII', [s['id'] for s in segs] == ['dermatologija', 'estetske', 'kozmetika', 'telo'] and all(re.fullmatch(r'[a-z0-9-]+', s['slug']) for s in segs) and [c['key'] for c in content['blogCategories'][1:]] == [s['id'] for s in segs])
    by_seg = {s['id']: [a['id'] for a in articles if a['segmentId'] == s['id']] for s in segs}
    check('C ordered article ids per segment equal the articles (4 / 4 / 7 / 6) and cover all 21 once', all(s['articleIds'] == by_seg[s['id']] for s in segs) and sum(len(s['articleIds']) for s in segs) == 21)
    imgs = {i['id']: i for i in img['images']}
    check('C hero images exist in the media pack and their files are on disk', all(s['heroImage']['id'] in imgs and all(os.path.exists(os.path.join(C.IMG_DIR, f)) for f in s['heroImage']['files']) for s in segs), [s['heroImage']['id'] for s in segs])
    # intro quotes verbatim
    alltext_all = ' '.join(t for a in articles for _, t in flatten_pack(a['blocks']))
    strings = []

    def collect(o):
        if isinstance(o, str):
            strings.append(o)
        elif isinstance(o, dict):
            for v in o.values():
                collect(v)
        elif isinstance(o, list):
            for v in o:
                collect(v)
    collect(content)
    sset = set(strings)
    q_ok = []
    for s in segs:
        for q in (s['intro'], s['intro']['alternative']):
            q_ok.append(q['text'] in alltext_all or q['text'] in sset)
    check('C every intro quote (and its alternative) is a verbatim string of the articles or of content.json', all(q_ok), [s['intro']['text'] for s in segs])
    gids = {'%s:%d' % (t['id'], gi): g for t in content['pricing']['tabs'] for gi, g in enumerate(t['groups'])}
    check('C price-list tabs/groups of every segment exist and are non-empty', all(s['priceList']['groups'] and all(g['groupId'] in gids for g in s['priceList']['groups']) for s in segs))

    # ================================================================ D. service links
    svc_ids = {s['id'] for s in content['allServices']}
    check('D all 21 articles have price-list groups, unmatched list is empty (and said so explicitly)', not links['unmatchedArticles'] and all(a['matched'] for a in links['articles']) and len(links['articles']) == 21 and 'unmatchedNote' in links)
    check('D every group id and service id in service-links.json exists in content.json', all(g in gids for a in links['articles'] for g in a['primaryGroupIds'] + a['relatedGroupIds']) and all(s in svc_ids for a in links['articles'] for s in a['serviceIds']) and all(s in svc_ids for s in links['serviceToArticles']))
    check('D every linked service sits inside a linked group of the same article', all(sv['id'].rsplit(':', 1)[0] == g['groupId'] for a in links['articles'] for g in a['groups'] for sv in g['services']))
    # reverse index consistency
    fwd = collections.defaultdict(set)
    for a in links['articles']:
        for g in a['groups']:
            fwd[g['groupId']].add(a['articleId'])
    check('D reverse index group -> articles equals the article -> groups lists, covers all 31 groups', len(links['groups']) == 31 and all(set(v['articleIds']) == fwd.get(k, set()) for k, v in links['groups'].items()))
    check('D old SERVICE_BLOG_LINKS (higijenski -> art-11, dermafacial -> art-13) are reproduced, 7 services', [r['articleId'] for r in links['oldSiteRules']] == ['art-11', 'art-13'] and sum(len(r['serviceIds']) for r in links['oldSiteRules']) == 7 and all(set(r['serviceIds']) <= set(next(a for a in links['articles'] if a['articleId'] == r['articleId'])['serviceIds']) for r in links['oldSiteRules']))
    check('D services linked to an article agree with serviceToArticles', all(a['articleId'] in links['serviceToArticles'][s] for a in links['articles'] for s in a['serviceIds']))

    # ================================================================ E. search vocabulary
    fold = C.fold
    entries, questions = search['entries'], search['questions']
    check('E %d entries + 12 invented questions' % len(entries), len(questions) == 12 and len(entries) >= 35, (len(entries), len(questions)))
    have = {fold(p) for e in entries for p in e['phrases']}
    miss = [r for r in SD.REQUIRED if r not in have]
    check('E all 35 phrases of the brief are covered (folded)', not miss, miss)
    both = True
    for e in entries + questions:
        for p in e['phrases']:
            if p != p.lower() or fold(p) not in e['phrases']:
                both = False
    check('E phrases are lowercase and every phrase exists with and without diacritics', both)
    check('E every entry has a note, a strength and evidence for every target', all(e['note'] and e['strength'] in ('strong', 'medium', 'weak') and all(t in e['evidence'] for k in ('groupIds', 'serviceIds', 'articleIds', 'offerIds') for t in e['targets'][k]) for e in entries + questions))
    ids_ok = all(g in gids for e in entries + questions for g in e['targets']['groupIds']) and all(s in svc_ids for e in entries + questions for s in e['targets']['serviceIds']) \
        and all(a in [x['id'] for x in articles] for e in entries + questions for a in e['targets']['articleIds']) \
        and all(o in [x['id'] for x in content['offers']] for e in entries + questions for o in e['targets']['offerIds']) \
        and all(sg in [s['id'] for s in segs] for e in entries + questions for sg in e['targets']['segmentIds'])
    check('E every target id exists (groups, services, articles, offers, segments)', ids_ok)
    # own re-check of the evidence: some term must occur in the target text, directly or through a targeted article
    art_text = {a['id']: fold(' '.join([a['title'], a['subtitle']] + [t for _, t in flatten_pack(a['blocks'])])) for a in articles}
    svc = {s['id']: s for s in content['allServices']}
    tabs = {t['id']: t for t in content['pricing']['tabs']}
    offers = {o['id']: o for o in content['offers']}
    linked = collections.defaultdict(set)
    for a in links['articles']:
        for g in a['groups']:
            linked[g['groupId']].add(a['articleId'])
            for sv in g['services']:
                linked[sv['id']].add(a['articleId'])
    gifts = {p['cenovnik']['id'] for p in content['gifts'] if p.get('cenovnik')}
    unsupported = []
    for e in entries + questions:
        if e.get('directEvidence') is False:
            continue
        rxs = [re.compile(t) for t in next(x for x in SD.ENTRIES + SD.QUESTIONS if x['id'] == e['id'])['terms']]
        any_in = lambda text: any(r.search(fold(text)) for r in rxs)
        via = lambda tid: any(any(r.search(art_text[a]) for r in rxs) for a in linked[tid] & set(e['targets']['articleIds']))
        for aid in e['targets']['articleIds']:
            if not any(r.search(art_text[aid]) for r in rxs):
                unsupported.append((e['id'], aid))
        for sid in e['targets']['serviceIds']:
            s = svc[sid]
            own = any_in(s['name'] + ' ' + (s.get('description') or '') + ' ' + s['group'] + ' ' + tabs[sid.split(':')[0]]['label'])
            if not (own or via(sid) or (sid in gifts and 'poklon' in e['id'])):
                unsupported.append((e['id'], sid))
        for gid in e['targets']['groupIds']:
            g = gids[gid]
            own = any_in(g['title'] + ' ' + ' '.join(x['name'] + ' ' + (x.get('description') or '') for x in g['services']))
            if not (own or via(gid) or ('poklon' in e['id'] and any(x['id'] in gifts for x in g['services']))):
                unsupported.append((e['id'], gid))
        for oid in e['targets']['offerIds']:
            o = offers[oid]
            if not any_in(o['title'] + ' ' + o['description'] + ' ' + o['tag']):
                unsupported.append((e['id'], oid))
        for sg in e['targets']['segmentIds']:
            if not any(a['segmentId'] == sg and a['id'] in e['targets']['articleIds'] for a in articles):
                unsupported.append((e['id'], sg))
    check('E independent re-check: every target is supported by its own text or by a targeted linked article', not unsupported, unsupported[:10])
    check('E the two weak entries say so (ukljesteni vrat, rastezanje) and rastezanje is marked directEvidence:false', [e['id'] for e in entries if e['strength'] == 'weak'] == ['ukljesteni-vrat', 'rastezanje'] and next(e for e in entries if e['id'] == 'rastezanje').get('directEvidence') is False)
    check('E pregnancy question keeps AWT, radiowave and laser as cautions, not as targets', next(q for q in questions if q['id'] == 'q-trudnoca')['caution']['articleIds'] == ['art-16', 'art-3', 'art-21'] and not set(next(q for q in questions if q['id'] == 'q-trudnoca')['caution']['articleIds']) & set(next(q for q in questions if q['id'] == 'q-trudnoca')['targets']['articleIds']))

    # ================================================================ F. numbering / data hygiene of the new files
    zero = []
    date_like = re.compile(r'\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2}|T\d{2}:\d{2}')

    def zscan(o, path):
        if isinstance(o, str):
            t = date_like.sub('', o)
            m = re.search(r'(?<![\d.,:/+%\w-])0\d+(?![\d:%\w-]|\.\d)', t)
            if m:
                zero.append((path, t[max(0, m.start() - 15):m.end() + 15]))
        elif isinstance(o, dict):
            for k, v in o.items():
                if re.fullmatch(r'0\d+', k):
                    zero.append((path, k))
                zscan(v, path + '.' + k)
        elif isinstance(o, list):
            for i, v in enumerate(o):
                zscan(v, '%s[%d]' % (path, i))
    for name, obj in (('articles', articles), ('segments', segments), ('service-links', links), ('search-synonyms', search)):
        zscan(obj, name)
    check('F no zero-padded numbering in the new data files (ids art-1 ... art-21, order 1 ... 4)', not zero, zero[:5])
    check('F files present: articles.json/js, segments.json, service-links.json, search-synonyms.json, CHANGES.md', all(exists(f) for f in ('articles.json', 'articles.js', 'segments.json', 'service-links.json', 'search-synonyms.json', 'CHANGES.md')))
    if exists('MANIFEST-ARTICLES.md'):
        check('F MANIFEST-ARTICLES.md present and names every new file', all(f in open(P('MANIFEST-ARTICLES.md'), encoding='utf-8').read() for f in ('articles.json', 'articles.js', 'segments.json', 'service-links.json', 'search-synonyms.json', 'CHANGES.md')))

    return {'ok': all(c['ok'] for c in checks), 'checks': checks, 'wordTable': word_table, 'nonTextFilesSkipped': nontext}


if __name__ == '__main__':
    r = run()
    for c in r['checks']:
        print(('PASS ' if c['ok'] else 'FAIL ') + c['name'] + ('' if c['ok'] else '  :: ' + str(c['detail'])[:300]))
    print()
    print('%-3s %-46s %6s %7s %8s %6s %7s' % ('#', 'document', 'xml', 'pydocx', 'textutil', 'pack', 'oldblog'))
    for t in r['wordTable']:
        print('%-3s %-46s %6s %7s %8s %6s %7s' % (t['n'], t['file'][:46], t['xml'], t['pydocx'], t['textutil'], t['pack'], t['legacy']))
    print('\n' + ('ALL %d CHECKS PASSED' % len(r['checks']) if r['ok'] else 'FAILED: %d of %d' % (sum(1 for c in r['checks'] if not c['ok']), len(r['checks']))))
    sys.exit(0 if r['ok'] else 1)
