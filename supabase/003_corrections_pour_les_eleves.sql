-- L'élève retrouve sur sa tablette la feuille d'opérations que sa maîtresse
-- a corrigée : ses traits rouges et son appréciation.
--
-- À exécuter après 001_classes_eleves_seances.sql, dans l'éditeur SQL du
-- projet Supabase. Rejouable : on le relance sans rien perdre.
--
-- L'élève n'a pas de compte. Ce qui lui ouvre sa feuille, c'est l'identifiant
-- de sa séance : tiré au hasard par sa tablette (un UUID, 122 bits de
-- hasard), envoyé avec la séance, connu seulement de cette tablette et de la
-- maîtresse. Il ne se devine pas : une autre tablette, même dans la même
-- classe, ne peut pas lire la feuille d'un camarade. Les tables restent
-- fermées à la clé publique.

create or replace function public.corrections_de_mes_feuilles(p_session_ids uuid[])
returns table (
  session_id uuid,
  operations jsonb,
  answers jsonb,
  corrections jsonb,
  corrected_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  -- Cinquante feuilles au plus par demande : les plus récentes de la
  -- tablette. Une feuille pas encore corrigée ne se montre pas.
  select w.session_id, w.operations, w.answers, w.corrections, w.corrected_at
  from public.worksheets w
  where w.session_id = any ((coalesce(p_session_ids, '{}'::uuid[]))[1:50])
    and w.corrected_at is not null
  order by w.corrected_at desc;
$$;

revoke all on function public.corrections_de_mes_feuilles(uuid[]) from public, anon, authenticated;
grant execute on function public.corrections_de_mes_feuilles(uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
