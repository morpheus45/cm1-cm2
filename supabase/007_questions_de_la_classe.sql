-- Les questions que la maîtresse ajoute elle-même à sa classe, dans
-- n'importe quelle matière — sauf les problèmes de maths, qui restent sur
-- leur propre écran (002_problemes_de_la_classe.sql), avec l'assistant de
-- Cédric et une vérification du calcul.
--
-- À exécuter après 001_classes_eleves_seances.sql, dans l'éditeur SQL du
-- projet Supabase. Rejouable : on le relance sans rien perdre.
--
-- Les mêmes principes que 002 : la maîtresse ne voit et ne modifie que les
-- questions de ses classes (RLS) ; l'élève, sans compte, ne reçoit que les
-- questions en service de SA classe, par une fonction qui vérifie le code.
-- Contrairement aux problèmes de maths, rien ici n'est recalculé par la
-- base ni par l'application : c'est à la maîtresse de s'assurer que sa
-- réponse est la bonne.

create table if not exists public.questions_classe (
  id                uuid primary key default gen_random_uuid(),
  class_id          uuid not null references public.classes (id) on delete cascade,
  -- Toutes les notions de l'application, sauf les problèmes de maths.
  domain            text not null check (domain in (
                      'conjugaison', 'accords', 'orthographe',
                      'numeration', 'calcul', 'geometrie',
                      'chronologie', 'evenements', 'mots-histoire',
                      'cartes', 'habiter', 'mots-geographie'
                    )),
  enonce            text not null check (length(btrim(enonce)) between 10 and 600),
  reponse           text not null check (length(btrim(reponse)) between 1 and 200),
  fausses_reponses  jsonb not null default '[]'::jsonb
                    check (
                      jsonb_typeof(fausses_reponses) = 'array'
                      and jsonb_array_length(fausses_reponses) between 1 and 5
                    ),
  trimestre         smallint not null check (trimestre between 1 and 3),
  actif             boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists questions_classe_classe_idx on public.questions_classe (class_id);

alter table public.questions_classe enable row level security;

-- Comme pour les autres tables : rien pour la clé publique, lecture et
-- écriture pour la maîtresse, sa RLS décidant des lignes.
revoke all on table public.questions_classe from public, anon, authenticated;
grant select, insert, update, delete on table public.questions_classe to authenticated;

drop policy if exists "maitresse gere les questions de ses classes" on public.questions_classe;
create policy "maitresse gere les questions de ses classes" on public.questions_classe
  for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- Ce que reçoit la tablette d'un élève : les questions en service de sa
-- classe, et rien d'autre — ni la classe d'à côté, ni les questions
-- retirées. Un code inconnu ne donne rien, sans dire s'il existe.
create or replace function public.questions_de_la_classe(p_join_code text)
returns table (
  id uuid,
  domain text,
  enonce text,
  reponse text,
  fausses_reponses jsonb,
  trimestre smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, q.domain, q.enonce, q.reponse, q.fausses_reponses, q.trimestre
  from public.questions_classe q
  join public.classes c on c.id = q.class_id
  where c.join_code = upper(btrim(coalesce(p_join_code, '')))
    and q.actif
  order by q.created_at
  limit 200;
$$;

revoke all on function public.questions_de_la_classe(text) from public, anon, authenticated;
grant execute on function public.questions_de_la_classe(text) to anon, authenticated;

notify pgrst, 'reload schema';
