#!/usr/bin/env bash
# One-time local bootstrap: initdb, roles, database, schemas, GoTrue migrations.
# Idempotent: safe to re-run.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
mkdir -p "$LOCAL_DIR/pg" "$LOCAL_DIR/bin"

if [[ ! -x "$GOTRUE_BIN" ]]; then
  echo "[init] gotrue binary missing -> building from source (this takes a few minutes)"
  bash "$ROOT/scripts/local-stack/build-gotrue.sh"
fi

if [[ ! -f "$PGDATA/PG_VERSION" ]]; then
  echo "[init] initdb at $PGDATA"
  pg_own
  PWFILE="$(mktemp)"; echo "$PG_SUPERPASS" > "$PWFILE"; chmod 644 "$PWFILE"
  pg_run "$PG_BIN/initdb" -D "$PGDATA" -U "$PG_SUPERUSER" --pwfile="$PWFILE" --auth-local=scram-sha-256 --auth-host=scram-sha-256 -E UTF8 --locale=C.UTF-8 >/dev/null
  rm -f "$PWFILE"
  pg_run tee -a "$PGDATA/postgresql.conf" >/dev/null <<CONF
port = $PGPORT
listen_addresses = '127.0.0.1'
timezone = 'UTC'
log_timezone = 'UTC'
max_connections = 100
CONF
fi

bash "$ROOT/scripts/local-stack/start.sh" --pg-only

PSQL=("$PG_BIN/psql" -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PG_SUPERUSER" -d postgres -q)
export PGPASSWORD="$PG_SUPERPASS"
echo "[init] roles and database"
"${PSQL[@]}" <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$AUTH_DB_ROLE') THEN
    CREATE ROLE $AUTH_DB_ROLE LOGIN NOINHERIT CREATEROLE NOREPLICATION PASSWORD '$AUTH_DB_PASS';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$APP_DB_ROLE') THEN
    CREATE ROLE $APP_DB_ROLE LOGIN NOINHERIT NOCREATEROLE NOREPLICATION PASSWORD '$APP_DB_PASS';
  END IF;
  -- Roles that Supabase's Data API would use. They exist so that privilege tests are meaningful.
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END \$\$;
SELECT 'CREATE DATABASE $PG_DB' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$PG_DB') \gexec
SQL

"${PSQL[@]}" -d "$PG_DB" <<SQL
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION $AUTH_DB_ROLE;
GRANT CREATE ON DATABASE $PG_DB TO $AUTH_DB_ROLE;
ALTER ROLE $AUTH_DB_ROLE SET search_path = 'auth';
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION $APP_DB_ROLE;
GRANT CREATE ON DATABASE $PG_DB TO $APP_DB_ROLE;
ALTER ROLE $APP_DB_ROLE SET search_path = 'app';
-- The API role never touches auth.* ; Data API roles never touch app.*
REVOKE ALL ON SCHEMA app FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SCHEMA public FROM $APP_DB_ROLE;
GRANT USAGE ON SCHEMA public TO $APP_DB_ROLE;
SQL

echo "[init] gotrue migrate (auth schema)"
( set -a; eval "$(gotrue_env)"; set +a; "$GOTRUE_BIN" migrate ) >> "$GOTRUE_LOG" 2>&1
echo "[init] done. Next: pnpm stack:start && pnpm db:migrate && pnpm db:seed"
