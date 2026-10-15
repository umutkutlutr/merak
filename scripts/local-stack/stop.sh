#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
if [[ -f "$GOTRUE_PIDFILE" ]]; then
  kill "$(cat "$GOTRUE_PIDFILE")" 2>/dev/null && echo "[stop] gotrue stopped"; rm -f "$GOTRUE_PIDFILE"
fi
if "$PG_BIN/pg_isready" -h "$PGHOST" -p "$PGPORT" -q 2>/dev/null; then
  pg_run "$PG_BIN/pg_ctl" -D "$PGDATA" -m fast -w stop >/dev/null && echo "[stop] postgres stopped"
fi
