-- Les résultats des élèves ne se gardent qu'une année scolaire.
--
-- À exécuter après 004_histoire_geographie.sql, dans l'éditeur SQL du projet
-- Supabase. Rejouable : on le relance sans rien perdre de l'année en cours.
--
-- Le RGPD demande de ne garder les données que le temps nécessaire. La règle
-- retenue : une année scolaire. Chaque 1er septembre, tout ce qui date de
-- l'année précédente est effacé — les séances, les feuilles d'opérations et
-- leur correction, les élèves qui n'ont travaillé que l'an dernier. Les
-- tablettes font de même de leur côté (src/lib/conservation.ts). Les classes
-- et les problèmes de la maîtresse restent : ce sont ses outils, pas des
-- données d'élèves.
--
-- ATTENTION : exécuter ce fichier efface aussitôt ce qui date d'avant le
-- 1er septembre de l'année scolaire en cours.

-- Le début de l'année scolaire d'un moment donné : le 1er septembre, à
-- minuit, heure de Paris. Juin 2027 appartient à l'année qui a commencé le
-- 1er septembre 2026.
create or replace function public.debut_annee_scolaire(p_moment timestamptz default now())
returns timestamptz
language sql
stable
set search_path = public
as $$
  select make_timestamptz(
    extract(year from p_moment at time zone 'Europe/Paris')::int
      - case when extract(month from p_moment at time zone 'Europe/Paris') >= 9 then 0 else 1 end,
    9, 1, 0, 0, 0, 'Europe/Paris');
$$;

-- `security definer` : l'effacement passe outre les règles d'accès, qui ne
-- laissent chaque maîtresse toucher qu'à sa classe. Personne ne peut
-- l'appeler de l'extérieur : seule la tâche programmée ci-dessous le lance.
create or replace function public.effacer_annee_precedente()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debut timestamptz := public.debut_annee_scolaire();
begin
  -- Les feuilles d'opérations et leur correction partent avec leur séance
  -- (on delete cascade).
  delete from public.sessions where at < v_debut;
  delete from public.pupils p
  where p.created_at < v_debut
    and not exists (select 1 from public.sessions s where s.pupil_id = p.id);
  -- Le compteur des demandes à l'assistant, et les demandes transmises à
  -- l'administrateur, qui portent l'adresse de la maîtresse.
  delete from public.assistant_usage where day < (v_debut at time zone 'Europe/Paris')::date;
  delete from public.demandes_administrateur where created_at < v_debut;
end;
$$;

revoke all on function public.debut_annee_scolaire(timestamptz) from public, anon, authenticated;
revoke all on function public.effacer_annee_precedente() from public, anon, authenticated;

-- Chaque nuit, à 3 h 15 (heure UTC) : la nuit du 1er septembre, l'année
-- précédente disparaît ; les autres nuits, il n'y a rien à effacer. Sur
-- Supabase, l'extension pg_cron est fournie ; ailleurs (la base de test),
-- on s'en passe.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('effacer-annee-precedente', '15 3 * * *', 'select public.effacer_annee_precedente()');
  else
    raise notice 'pg_cron absent : l''effacement de chaque rentrée n''est pas programmé sur cette base.';
  end if;
end $$;

-- Et dès maintenant, pour ce qui date déjà d'une année précédente.
do $$ begin perform public.effacer_annee_precedente(); end $$;

notify pgrst, 'reload schema';
