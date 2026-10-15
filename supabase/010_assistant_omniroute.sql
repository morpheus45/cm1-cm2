-- L'assistant de l'espace maîtresse passe par OmniRoute, sur le PC de Cédric.
--
-- À exécuter après 002_problemes_de_la_classe.sql, dans l'éditeur SQL du
-- projet Supabase. Rejouable : on le relance sans rien perdre.
--
-- Le PC de Cédric n'est pas joignable depuis internet, et ne doit pas l'être.
-- La fonction « assistant-problemes » dépose donc chaque question dans cette
-- table ; le relais du PC (tools/relais-assistant.py) la lit, la fait traiter
-- par OmniRoute et y écrit la réponse ; la fonction la reprend, la vérifie,
-- l'envoie à la maîtresse et efface la ligne. Seule la clé de service y a
-- accès : ni les tablettes, ni les maîtresses ne la voient.

create table if not exists public.assistant_travaux (
  id          uuid primary key default gen_random_uuid(),
  niveau      text not null check (niveau in ('CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e')),
  systeme     text not null check (length(systeme) <= 20000),
  messages    jsonb not null check (jsonb_typeof(messages) = 'array'),
  statut      text not null default 'en_attente' check (statut in ('en_attente', 'en_cours', 'pret', 'erreur')),
  reponse     text,
  created_at  timestamptz not null default now()
);

create index if not exists assistant_travaux_statut_idx on public.assistant_travaux (statut, created_at);

alter table public.assistant_travaux enable row level security;
revoke all on table public.assistant_travaux from public, anon, authenticated;

notify pgrst, 'reload schema';
