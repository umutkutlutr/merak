#!/usr/bin/env bash
# Destroys the local database (auth + app data) and re-initialises it. LOCAL ONLY.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
bash "$ROOT/scripts/local-stack/stop.sh"
rm -rf "$PGDATA"
bash "$ROOT/scripts/local-stack/init.sh"
