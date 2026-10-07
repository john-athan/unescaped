#!/bin/sh
# Every check this project has, in one script.
#
# Run it directly, or through `oss check unescaped`, or let CI call it. All three
# run exactly the same thing, which is the point: a check that only exists
# inside a workflow file cannot be run before the push that triggers it.
set -eu
cd "$(dirname "$0")/.."

fail=0
step() { printf '\n== %s\n' "$1"; }
check() { if "$@"; then echo "ok"; else echo "FAILED: $*"; fail=1; fi; }

step "put the project's checks here"
echo "nothing to check yet"

exit $fail
