#!/usr/bin/env bash
# Shared settings for the Docker-less local stack (PostgreSQL 16 + Supabase Auth/GoTrue).
# Everything here is LOCAL DEV ONLY. Never reuse these values outside a developer machine.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_DIR="$ROOT/.local"

# --- PostgreSQL ---
export PG_BIN="${PG_BIN:-$(dirname "$(command -v pg_ctl 2>/dev/null || echo /usr/lib/postgresql/16/bin/pg_ctl)")}"
export PGDATA="${PGDATA:-$LOCAL_DIR/pg/data}"
export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-54329}"
export PG_SUPERUSER="postgres"
export PG_SUPERPASS="postgres"
export PG_DB="merak"
export PG_LOG="$LOCAL_DIR/pg/postgres.log"
# PostgreSQL refuses to run as root. When the shell is root (CI containers, cloud sandboxes) the
# server runs as this unprivileged OS user; on a normal developer machine commands run as you.
export PG_OS_USER="${PG_OS_USER:-postgres}"
pg_run() {
  if [[ "$(id -u)" == "0" ]]; then
    runuser -u "$PG_OS_USER" -- env PGDATA="$PGDATA" PGPORT="$PGPORT" "$@"
  else
    "$@"
  fi
}
pg_own() {
  if [[ "$(id -u)" == "0" ]]; then
    mkdir -p "$LOCAL_DIR/pg"; chown -R "$PG_OS_USER" "$LOCAL_DIR/pg"
  fi
}

export APP_DB_ROLE="app_api"
export APP_DB_PASS="app_api_local_dev"
export AUTH_DB_ROLE="supabase_auth_admin"
export AUTH_DB_PASS="supabase_auth_local_dev"

export DATABASE_ADMIN_URL="postgres://$PG_SUPERUSER:$PG_SUPERPASS@$PGHOST:$PGPORT/$PG_DB"
export DATABASE_URL="postgres://$APP_DB_ROLE:$APP_DB_PASS@$PGHOST:$PGPORT/$PG_DB"
export AUTH_DATABASE_URL="postgres://$AUTH_DB_ROLE:$AUTH_DB_PASS@$PGHOST:$PGPORT/$PG_DB"

# --- GoTrue (Supabase Auth) ---
export GOTRUE_BIN="$LOCAL_DIR/bin/gotrue"
export GOTRUE_PORT="${GOTRUE_PORT:-9999}"
export GOTRUE_URL="http://localhost:$GOTRUE_PORT"
export GOTRUE_PIDFILE="$LOCAL_DIR/gotrue.pid"
export GOTRUE_LOG="$LOCAL_DIR/gotrue.log"
# HS256 shared secret (>= 32 chars). Supabase local uses the same mechanism; hosted projects use JWKS.
export SUPABASE_JWT_SECRET="${SUPABASE_JWT_SECRET:-merak-local-dev-jwt-secret-do-not-use-in-prod-0123456789}"
export GOTRUE_SITE_URL="${GOTRUE_SITE_URL:-http://localhost:8081}"

gotrue_env() {
  # Printed as KEY=VALUE lines for `env` / dotenv consumers.
  cat <<ENV
GOTRUE_DB_DRIVER=postgres
DATABASE_URL=$AUTH_DATABASE_URL
GOTRUE_DB_NAMESPACE=auth
GOTRUE_API_HOST=${GOTRUE_API_HOST:-127.0.0.1}
PORT=$GOTRUE_PORT
API_EXTERNAL_URL=$GOTRUE_URL
GOTRUE_SITE_URL=$GOTRUE_SITE_URL
GOTRUE_URI_ALLOW_LIST=http://localhost:8081,http://localhost:5173,http://127.0.0.1:8081,http://127.0.0.1:5173,merak://*
GOTRUE_JWT_SECRET=$SUPABASE_JWT_SECRET
GOTRUE_JWT_EXP=3600
GOTRUE_JWT_AUD=authenticated
GOTRUE_JWT_ISSUER=$GOTRUE_URL
GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated
GOTRUE_JWT_ADMIN_ROLES=supabase_admin,service_role
GOTRUE_DISABLE_SIGNUP=false
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_EXTERNAL_PHONE_ENABLED=false
GOTRUE_MAILER_AUTOCONFIRM=true
GOTRUE_SMS_AUTOCONFIRM=true
GOTRUE_PASSWORD_MIN_LENGTH=8
GOTRUE_RATE_LIMIT_EMAIL_SENT=1000
GOTRUE_RATE_LIMIT_TOKEN_REFRESH=1000
GOTRUE_RATE_LIMIT_VERIFY=1000
GOTRUE_LOG_LEVEL=info
GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED=true
GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL=10
ENV
}
