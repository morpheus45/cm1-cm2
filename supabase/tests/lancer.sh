#!/usr/bin/env bash
# Lance la migration sur un PostgreSQL local jetable, deux fois (elle doit
# être rejouable), puis vérifie les règles d'accès.
#
# Il faut PostgreSQL 16 installé (paquet « postgresql »). Rien n'est envoyé
# à Supabase : tout se passe sur la machine, et la base est détruite ensuite.
set -euo pipefail

cd "$(dirname "$0")/.."
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT="${PORT:-54329}"
DATA="$(mktemp -d)"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  chown postgres:postgres "$DATA"
  RUN_AS=(su postgres -c)
fi

run() { if [ ${#RUN_AS[@]} -gt 0 ]; then "${RUN_AS[@]}" "$*"; else eval "$*"; fi; }

run "$PGBIN/initdb -D $DATA -A trust -U postgres" >/dev/null
run "$PGBIN/pg_ctl -D $DATA -o '-p $PORT -k /tmp' -l $DATA/log start" >/dev/null
trap 'run "$PGBIN/pg_ctl -D $DATA stop -m fast" >/dev/null 2>&1 || true; rm -rf "$DATA"' EXIT
sleep 2

PSQL=(psql -h /tmp -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)

# Ce que Supabase fournit d'office : le schéma auth, auth.uid() et les rôles.
"${PSQL[@]}" <<'SQL'
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
-- Supabase accorde d'office aux rôles anon et authenticated tous les droits
-- sur ce qui sera créé dans « public » — tables ET fonctions. Sans ces deux
-- lignes, le test serait plus sévère que la réalité : une fonction que l'on
-- croit réservée aux maîtresses resterait appelable par un anonyme là-bas.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
SQL

echo "Migration, première exécution…"
"${PSQL[@]}" -f 001_classes_eleves_seances.sql 2>&1 | grep -v NOTICE || true
echo "Migration, seconde exécution (elle doit être rejouable)…"
"${PSQL[@]}" -f 001_classes_eleves_seances.sql 2>&1 | grep -v NOTICE || true
echo "Règles d'accès…"
"${PSQL[@]}" -f tests/securite.sql
