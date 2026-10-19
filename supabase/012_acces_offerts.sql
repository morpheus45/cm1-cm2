-- Accès offert à tous les niveaux de l'appli Android, sans abonnement :
-- pour les relecteurs de Google Play (qui n'achètent jamais) et, si besoin,
-- pour une famille à qui on offre l'appli.
--
-- À exécuter dans l'éditeur SQL du projet Supabase. Rejouable.
-- Pour offrir l'accès à un compte parent déjà créé dans l'appli :
--   insert into public.acces_offerts (email) values ('adresse@exemple.fr');

create table if not exists public.acces_offerts (
  email text primary key check (email = lower(email)),
  ajoute_le timestamptz not null default now()
);

-- Personne ne lit ni n'écrit la table depuis l'appli : seule la fonction
-- ci-dessous la consulte, pour le compte connecté uniquement.
alter table public.acces_offerts enable row level security;
revoke all on public.acces_offerts from public, anon, authenticated;

create or replace function public.acces_offert()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.acces_offerts
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.acces_offert() from public, anon;
grant execute on function public.acces_offert() to authenticated;

notify pgrst, 'reload schema';
