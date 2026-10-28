#!/bin/sh
# Full QA of preview C. Needs the dev server:  python3 -m http.server 8753 --directory <v2>/c-luzia
# usage: sh _tools/c/qa/run-all.sh        (from v2/; takes several minutes; overflow.mjs alone is 224 page loads)
cd "$(dirname "$0")/../../.." || exit 1
node _tools/c/build-pages.mjs | tail -3
for s in html crawl anchors rcheck rfunc search func home gaps axe; do
  echo "=== $s"; node _tools/c/qa/$s.mjs 2>&1 | grep -v '^PASS' | tail -25
done
echo "=== overflow (28 pages x 8 widths)"; node _tools/c/qa/overflow.mjs 2>&1 | tail -15
echo "=== photo-contrast (text over photos, lines below 4.5)"; node _tools/c/qa/photo-contrast.mjs 2>&1 | tail -6
