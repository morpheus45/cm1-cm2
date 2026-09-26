-- Les problèmes que la maîtresse prépare pour sa classe, avec Claude, et le
-- compteur qui borne le chat.
--
-- À exécuter après 001_classes_eleves_seances.sql, dans l'éditeur SQL du
-- projet Supabase. Rejouable : on le relance sans rien perdre.
--
-- Les mêmes principes que 001 : la maîtresse ne voit et ne modifie que les
-- problèmes de ses classes (RLS) ; l'élève, sans compte, ne reçoit que les
-- problèmes en service de SA classe, par une fonction qui vérifie le code.

-- --------------------------------------------------------- les problèmes ---

create table if not exists public.problemes (
  id                uuid primary key default gen_random_uuid(),
  class_id          uuid not null references public.classes (id) on delete cascade,
  enonce            text not null check (length(btrim(enonce)) between 10 and 600),
  -- Un nombre écrit à la française : chiffres, et une virgule au besoin.
  reponse           text not null check (reponse ~ '^[0-9]+(,[0-9]+)?$'),
  unite             text not null default '' check (length(unite) <= 20),
  -- Le calcul qui mène à la réponse : l'application le refait avant que la
  -- maîtresse puisse ajouter le problème.
  calcul            text not null check (length(calcul) between 1 and 120),
  fausses_reponses  jsonb not null default '[]'::jsonb
                    check (jsonb_typeof(fausses_reponses) = 'array' and jsonb_array_length(fausses_reponses) <= 5),
  trimestre         smallint not null check (trimestre between 1 and 3),
  actif             boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists problemes_classe_idx on public.problemes (class_id);

alter table public.problemes enable row level security;

-- Comme pour les autres tables : rien pour la clé publique, lecture et
-- écriture pour la maîtresse, sa RLS décidant des lignes.
revoke all on table public.problemes from public, anon, authenticated;
grant select, insert, update, delete on table public.problemes to authenticated;

drop policy if exists "maitresse gere les problemes de ses classes" on public.problemes;
create policy "maitresse gere les problemes de ses classes" on public.problemes
  for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- Ce que reçoit la tablette d'un élève : les problèmes en service de sa
-- classe, et rien d'autre — ni la classe d'à côté, ni les problèmes retirés.
-- Un code inconnu ne donne rien, sans dire s'il existe.
create or replace function public.problemes_de_la_classe(p_join_code text)
returns table (
  id uuid,
  enonce text,
  reponse text,
  unite text,
  fausses_reponses jsonb,
  trimestre smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.enonce, p.reponse, p.unite, p.fausses_reponses, p.trimestre
  from public.problemes p
  join public.classes c on c.id = p.class_id
  where c.join_code = upper(btrim(coalesce(p_join_code, '')))
    and p.actif
  order by p.created_at
  limit 200;
$$;

revoke all on function public.problemes_de_la_classe(text) from public, anon, authenticated;
grant execute on function public.problemes_de_la_classe(text) to anon, authenticated;

-- ------------------------------------------------ le compteur du chat ---

-- Chaque question posée à Claude coûte quelques centimes : un plafond par
-- maîtresse et par jour évite toute mauvaise surprise sur la facture.
create table if not exists public.assistant_usage (
  teacher_id  uuid not null references auth.users (id) on delete cascade,
  day         date not null default current_date,
  requests    integer not null default 0,
  primary key (teacher_id, day)
);

alter table public.assistant_usage enable row level security;
revoke all on table public.assistant_usage from public, anon, authenticated;

-- Compte une demande de la maîtresse connectée et rend le total du jour. La
-- fonction du chat refuse au-delà de son plafond.
create or replace function public.compter_demande_assistant()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'connexion requise';
  end if;
  insert into public.assistant_usage (teacher_id, day, requests)
  values (auth.uid(), current_date, 1)
  on conflict (teacher_id, day)
  do update set requests = public.assistant_usage.requests + 1
  returning requests into v_count;
  return v_count;
end;
$$;

revoke all on function public.compter_demande_assistant() from public, anon, authenticated;
grant execute on function public.compter_demande_assistant() to authenticated;

notify pgrst, 'reload schema';
