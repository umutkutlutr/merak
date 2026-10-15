#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
"$PG_BIN/pg_isready" -h "$PGHOST" -p "$PGPORT" && echo "postgres: up ($DATABASE_URL)" || echo "postgres: down"
curl -fsS "$GOTRUE_URL/health" && echo " <- gotrue: up ($GOTRUE_URL)" || echo "gotrue: down"
