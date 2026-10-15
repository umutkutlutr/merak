#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
mkdir -p "$LOCAL_DIR/pg"
if ! "$PG_BIN/pg_isready" -h "$PGHOST" -p "$PGPORT" -q 2>/dev/null; then
  echo "[start] postgres on $PGHOST:$PGPORT"
  pg_own
  pg_run "$PG_BIN/pg_ctl" -D "$PGDATA" -l "$PG_LOG" -w start >/dev/null
else
  echo "[start] postgres already running on $PGPORT"
fi
if [[ "${1:-}" == "--pg-only" ]]; then exit 0; fi

if [[ -f "$GOTRUE_PIDFILE" ]] && kill -0 "$(cat "$GOTRUE_PIDFILE")" 2>/dev/null; then
  echo "[start] gotrue already running (pid $(cat "$GOTRUE_PIDFILE"))"
else
  echo "[start] gotrue on $GOTRUE_URL"
  ( set -a; eval "$(gotrue_env)"; set +a; nohup "$GOTRUE_BIN" serve >> "$GOTRUE_LOG" 2>&1 & echo $! > "$GOTRUE_PIDFILE" )
  for _ in $(seq 1 40); do
    if curl -fsS "$GOTRUE_URL/health" >/dev/null 2>&1; then break; fi; sleep 0.25
  done
  curl -fsS "$GOTRUE_URL/health" >/dev/null || { echo "[start] gotrue failed to start; see $GOTRUE_LOG"; exit 1; }
fi
echo "[start] ok  postgres=$PGHOST:$PGPORT  gotrue=$GOTRUE_URL"
