#!/bin/sh
# Every check this extension has, in one script.
#
# Run it directly, or through `oss check unescaped`, or let CI call it. All
# three run exactly the same thing.
set -eu
cd "$(dirname "$0")/.."

fail=0
step() { printf '\n== %s\n' "$1"; }
fail_if() { if [ "$1" -ne 0 ]; then fail=1; fi; }

step "manifest.json is well-formed and consistent"
node -e '
  const fs = require("fs");
  const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const fail = (msg) => { console.error("FAIL: " + msg); process.exitCode = 1; };
  if (m.manifest_version !== 3) fail("not manifest v3");
  if (!/^\d+\.\d+\.\d+$/.test(m.version)) fail("version " + m.version + " is not x.y.z, which oss release needs");
  for (const f of [m.background.service_worker, ...m.sandbox.pages, ...Object.values(m.icons)]) {
    if (!fs.existsSync(f)) fail("manifest points at a missing file: " + f);
  }
  const hosts = (m.host_permissions || []).filter((h) => !/^https:\/\/drive(\.usercontent)?\.google\.com\/\*$/.test(h));
  if (hosts.length) fail("host access beyond Drive crept in: " + hosts.join(", "));
  console.log("manifest ok, version " + m.version);
' || fail_if $?

step "JavaScript parses"
for f in background.js sources.js viewer.js sandbox.js test.js scripts/check-package.mjs; do
  node --check "$f" && echo "ok $f" || fail_if $?
done

step "SVG is well-formed"
python3 - <<'PY' || fail=1
import glob, re, sys, xml.etree.ElementTree as ET
bad = 0
for path in glob.glob('meta/*.svg') + glob.glob('docs/*.html'):
    for i, svg in enumerate(re.findall(r'<svg\b.*?</svg>', open(path, encoding='utf-8').read(), re.S)):
        try:
            ET.fromstring(svg)
        except Exception as e:
            bad += 1
            print(f'FAIL {path} svg#{i+1}: {e}')
print('broken SVG blocks:', bad)
sys.exit(1 if bad else 0)
PY

step "Which source a click picks"
node test.js || fail=1

step "The extension carries no dependencies"
if ls package.json package-lock.json node_modules 2>/dev/null | grep -q .; then
  echo "FAIL: a dependency appeared in a project that is supposed to have none"
  fail=1
else
  echo "ok, still no dependencies"
fi

step "Icons are the size their name says"
python3 - <<'PY' || fail=1
import struct, sys
bad = 0
for size in (16, 32, 48, 128):
    w, h = struct.unpack('>II', open(f'icons/icon{size}.png', 'rb').read()[16:24])
    if (w, h) != (size, size):
        bad += 1
        print(f'FAIL icons/icon{size}.png is {w}x{h}')
w, h = struct.unpack('>II', open('screenshots/store-icon.png', 'rb').read()[16:24])
if (w, h) != (128, 128):
    bad += 1
    print(f'FAIL screenshots/store-icon.png is {w}x{h}')
print('icons ok' if not bad else '')
sys.exit(1 if bad else 0)
PY

step "Every permission has a justification written for the console"
node -e '
  const fs = require("fs");
  const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const declared = [...(m.permissions || []), ...(m.host_permissions?.length ? ["Host"] : [])];
  const section = (fs.readFileSync("meta/store-listing.md", "utf8").split("## Permission justifications")[1] || "").split(/\n## /)[0];
  const written = [...section.matchAll(/^\*\*([a-zA-Z]+)\*\*$/gm)].map((x) => x[1]);
  const fail = (msg) => { console.error("FAIL: " + msg); process.exitCode = 1; };
  for (const p of declared) if (!written.includes(p)) fail(`manifest declares ${p}, store-listing.md does not justify it`);
  for (const w of written) if (w !== "Remote" && !declared.includes(w)) fail(`store-listing.md justifies ${w}, which the manifest does not declare`);
  console.log("justified: " + declared.join(", "));
' || fail_if $?

step "The changelog has this version"
node -e '
  const v = require("./manifest.json").version;
  if (!require("fs").readFileSync("CHANGELOG.md", "utf8").includes(`## [${v}]`)) {
    console.error(`FAIL: CHANGELOG.md has no entry for ${v}`); process.exit(1);
  }
  console.log("changelog has " + v);
' || fail_if $?

step "Package the store upload, and check it against the store"
tools/package.sh || fail=1

if [ "$fail" -ne 0 ]; then
  printf '\nvalidate: FAILED\n'
  exit 1
fi
printf '\nvalidate: everything passes\n'
