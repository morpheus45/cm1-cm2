-- Supprimer son compte depuis l'appli, comme l'exige Google Play.
--
-- À exécuter après 001_classes_eleves_seances.sql, dans l'éditeur SQL du
-- projet Supabase. Rejouable : on le relance sans rien perdre.
--
-- Le compte de l'adulte est effacé ; ses classes, ses élèves et leurs
-- séances partent avec lui (clés étrangères « on delete cascade »).

create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'connexion requise';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;

notify pgrst, 'reload schema';
