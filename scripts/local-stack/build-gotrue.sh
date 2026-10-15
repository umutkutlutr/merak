#!/usr/bin/env bash
# Builds the Supabase Auth server (GoTrue) from source for Docker-less local runs.
# Output: .local/bin/gotrue  (gitignored)
# Requires: git, Go >= the version in supabase/auth go.mod (GOTOOLCHAIN=auto fetches a newer one via proxy.golang.org if needed).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="${GOTRUE_VERSION:-v2.197.0}"
SRC_DIR="${GOTRUE_SRC_DIR:-$ROOT/.local/src/supabase-auth}"
OUT="$ROOT/.local/bin/gotrue"

if [[ -x "$OUT" ]] && "$OUT" version 2>/dev/null | grep -q "${VERSION#v}"; then
  echo "gotrue $VERSION already built at $OUT"; exit 0
fi

mkdir -p "$ROOT/.local/bin"
if [[ ! -d "$SRC_DIR/.git" ]]; then
  git clone --depth 1 --branch "$VERSION" https://github.com/supabase/auth "$SRC_DIR"
else
  (cd "$SRC_DIR" && git fetch --depth 1 origin "refs/tags/$VERSION:refs/tags/$VERSION" && git checkout -q "$VERSION")
fi
cd "$SRC_DIR"
export GOTOOLCHAIN=auto GOFLAGS=-mod=mod
go build -ldflags "-X github.com/supabase/auth/internal/utilities.Version=${VERSION#v}" -o "$OUT" .
echo "built $OUT"
"$OUT" version || true
