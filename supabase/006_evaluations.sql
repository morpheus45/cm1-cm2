-- Les évaluations de la maîtresse : les mêmes questions pour toute la classe,
-- lancées par elle seule, faites une seule fois par chaque élève.
--
-- À exécuter après 005_conservation_une_annee.sql, dans l'éditeur SQL du
-- projet Supabase. Rejouable : on le relance sans rien perdre.
--
-- La maîtresse prépare une évaluation (une matière, des questions choisies),
-- l'ouvre en classe, puis la clôture. Les tablettes de la classe la reçoivent
-- par le code de classe ; chaque élève rend une copie, que la base corrige
-- elle-même. La copie compte aussi comme une séance : les tableaux de la
-- maîtresse et la révision ciblée de l'élève en tiennent compte. Elle vit et
-- meurt avec cette séance : effacée à la rentrée comme elle
-- (005_conservation_une_annee.sql), ou avec l'élève.

-- ------------------------------------------------------------ la classe ---

-- La zone de vacances de l'école : elle place les périodes du calendrier.
-- Vide, l'application prend la zone par défaut (src/lib/calendrier.ts).
alter table public.classes add column if not exists zone text;
alter table public.classes drop constraint if exists classes_zone_check;
alter table public.classes add constraint classes_zone_check check (zone is null or zone in ('A', 'B', 'C'));

-- Une séance peut maintenant être une évaluation.
alter table public.sessions drop constraint if exists sessions_activity_check;
alter table public.sessions add constraint sessions_activity_check
  check (activity in ('questions', 'posees', 'revision', 'evaluation'));

-- ------------------------------------------------------- les évaluations ---

create table if not exists public.evaluations (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  title       text not null check (length(btrim(title)) between 1 and 80),
  subject     text not null check (subject in ('francais', 'maths', 'histoire', 'geographie')),
  -- La période du calendrier (1 à 5), et le trimestre dont viennent les
  -- questions.
  period      smallint check (period between 1 and 5),
  trimester   smallint not null check (trimester between 1 and 3),
  -- Les questions, figées au moment où la maîtresse les choisit : chaque
  -- élève reçoit exactement les mêmes.
  -- [{ "kind": "question", "question": {...} }, { "kind": "operation", "operation": {...} }]
  items       jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 40),
  -- Préparée, ouverte aux élèves, puis terminée.
  status      text not null default 'preparee' check (status in ('preparee', 'ouverte', 'terminee')),
  created_at  timestamptz not null default now(),
  opened_at   timestamptz,
  closed_at   timestamptz
);

create index if not exists evaluations_class_idx on public.evaluations (class_id, created_at desc);

-- La copie d'un élève. Son identifiant est celui de la séance qui
-- l'accompagne, tiré au hasard par la tablette : une copie renvoyée après une
-- coupure n'est gardée qu'une fois. Et un élève ne rend qu'une copie par
-- évaluation.
create table if not exists public.evaluation_copies (
  id             uuid primary key references public.sessions (id) on delete cascade,
  evaluation_id  uuid not null references public.evaluations (id) on delete cascade,
  pupil_id       uuid not null references public.pupils (id) on delete cascade,
  -- Une réponse par question, dans l'ordre : { "given": ..., "correct": true }
  answers        jsonb not null check (jsonb_typeof(answers) = 'array'),
  -- Le résultat par notion, comme pour une séance.
  results        jsonb not null check (jsonb_typeof(results) = 'array'),
  at             timestamptz not null default now(),
  unique (evaluation_id, pupil_id)
);

create index if not exists evaluation_copies_evaluation_idx on public.evaluation_copies (evaluation_id);

-- Une copie effacée emporte sa séance, et la feuille d'opérations qui va
-- avec : une évaluation supprimée, ou refaite, ne laisse pas de résultats
-- orphelins dans les tableaux. `security definer` : la maîtresse ne peut pas
-- effacer une séance elle-même.
create or replace function public.copie_efface_sa_seance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.sessions where id = old.id;
  return old;
end;
$$;

drop trigger if exists copie_efface_sa_seance on public.evaluation_copies;
create trigger copie_efface_sa_seance
  after delete on public.evaluation_copies
  for each row execute function public.copie_efface_sa_seance();

-- Dès qu'un élève a rendu sa copie, les questions ne changent plus : sa copie
-- répond à celles-là, dans cet ordre.
create or replace function public.evaluations_questions_figees()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.items is distinct from old.items
      or new.subject is distinct from old.subject
      or new.trimester is distinct from old.trimester
      or new.class_id is distinct from old.class_id)
     and exists (select 1 from public.evaluation_copies k where k.evaluation_id = old.id) then
    raise exception 'questions figées : des élèves ont déjà rendu leur copie';
  end if;
  return new;
end;
$$;

drop trigger if exists evaluations_questions_figees on public.evaluations;
create trigger evaluations_questions_figees
  before update on public.evaluations
  for each row execute function public.evaluations_questions_figees();

revoke all on function public.copie_efface_sa_seance() from public, anon, authenticated;
revoke all on function public.evaluations_questions_figees() from public, anon, authenticated;

alter table public.evaluations enable row level security;
alter table public.evaluation_copies enable row level security;

-- Comme pour les autres tables : rien pour la clé publique, la RLS pour la
-- maîtresse. Elle lit les copies de ses élèves, et peut en effacer une, mais
-- ne les écrit pas : seule la fonction qui les reçoit les crée.
revoke all on table public.evaluations, public.evaluation_copies from public, anon, authenticated;
grant select, insert, update, delete on table public.evaluations to authenticated;
grant select, delete on table public.evaluation_copies to authenticated;

drop policy if exists "maitresse gere ses evaluations" on public.evaluations;
create policy "maitresse gere ses evaluations" on public.evaluations
  for all using (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

drop policy if exists "maitresse lit les copies de ses eleves" on public.evaluation_copies;
create policy "maitresse lit les copies de ses eleves" on public.evaluation_copies
  for select using (
    exists (
      select 1 from public.evaluations e
      join public.classes c on c.id = e.class_id
      where e.id = evaluation_id and c.teacher_id = auth.uid()
    )
  );

-- Faire refaire une évaluation à un élève (absent, interrompu) : sa copie
-- s'efface, et avec elle sa séance.
drop policy if exists "maitresse fait refaire une copie" on public.evaluation_copies;
create policy "maitresse fait refaire une copie" on public.evaluation_copies
  for delete using (
    exists (
      select 1 from public.evaluations e
      join public.classes c on c.id = e.class_id
      where e.id = evaluation_id and c.teacher_id = auth.uid()
    )
  );

-- ------------------------------------------------------ côté élève ---------

-- Les évaluations ouvertes de la classe, pour les tablettes des élèves. Elles
-- ne contiennent aucune donnée d'élève. La tablette donne aussi les
-- identifiants des copies qu'elle a rendues, tirés au hasard et connus d'elle
-- seule : elle apprend lesquelles la base garde encore, et donc si la
-- maîtresse en a fait refaire une.
--
-- Les tablettes la redemandent souvent : elle ne rend que quelques mots par
-- évaluation. Les questions — des cartes, des figures, parfois cent fois plus
-- lourdes — se demandent une seule fois (questions_de_l_evaluation) ; leur
-- empreinte (`version`) dit à la tablette si elles ont changé.
drop function if exists public.evaluations_ouvertes(text, uuid[]);
create function public.evaluations_ouvertes(p_join_code text, p_copy_ids uuid[] default '{}')
returns table (
  id uuid,
  title text,
  subject text,
  level text,
  trimester smallint,
  question_count integer,
  version text,
  opened_at timestamptz,
  rendues uuid[]
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.title, e.subject, c.level, e.trimester,
    jsonb_array_length(e.items), md5(e.items::text), e.opened_at,
    coalesce((
      select array_agg(k.id)
      from public.evaluation_copies k
      where k.evaluation_id = e.id
        and k.id = any ((coalesce(p_copy_ids, '{}'::uuid[]))[1:200])
    ), '{}'::uuid[])
  from public.evaluations e
  join public.classes c on c.id = e.class_id
  where c.join_code = upper(btrim(coalesce(p_join_code, '')))
    and e.status = 'ouverte'
  order by e.opened_at
  limit 10;
$$;

revoke all on function public.evaluations_ouvertes(text, uuid[]) from public, anon, authenticated;
grant execute on function public.evaluations_ouvertes(text, uuid[]) to anon, authenticated;

-- Les questions d'une évaluation ouverte de la classe : rien pour une
-- évaluation préparée, terminée, ou d'une autre classe.
create or replace function public.questions_de_l_evaluation(p_join_code text, p_evaluation_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select e.items
  from public.evaluations e
  join public.classes c on c.id = e.class_id
  where c.join_code = upper(btrim(coalesce(p_join_code, '')))
    and e.id = p_evaluation_id
    and e.status = 'ouverte';
$$;

revoke all on function public.questions_de_l_evaluation(text, uuid) from public, anon, authenticated;
grant execute on function public.questions_de_l_evaluation(text, uuid) to anon, authenticated;

-- Un nombre écrit par un élève, comparable au résultat attendu : « 12,0 »
-- vaut « 12 », la virgule et le point se valent (isAnswerCorrect, dans
-- src/lib/worksheet.ts).
create or replace function public.nombre_normalise(p_value text)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when v ~ '^-?[0-9]{0,12}\.?[0-9]{0,6}$' and v ~ '[0-9]' then round(v::numeric, 3)
    else null
  end
  from (select replace(regexp_replace(coalesce(p_value, ''), '\s', '', 'g'), ',', '.') as v) t;
$$;

revoke all on function public.nombre_normalise(text) from public, anon, authenticated;

-- La copie d'un élève. `security definer`, comme le dépôt d'une séance : la
-- fonction écrit là où la tablette n'a aucun droit, et ne rend qu'un mot.
--
-- La correction est refaite ici : la tablette ne décide pas seule de ce qui
-- est juste. Une question à choix se compare à la bonne réponse, une
-- opération posée au résultat attendu. Seule une construction au doigt se
-- vérifie sur la tablette, qui envoie son verdict.
--
-- Une évaluation terminée accepte encore les copies en route : celle d'une
-- tablette qui avait perdu le réseau arrive après la clôture. Aucun élève ne
-- peut plus la commencer, puisqu'elle n'est plus proposée.
create or replace function public.rendre_evaluation(
  p_copy_id        uuid,
  p_join_code      text,
  p_evaluation_id  uuid,
  p_first_name     text,
  p_last_name      text,
  p_answers        jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id  uuid;
  v_level     text;
  v_eval      public.evaluations%rowtype;
  v_pupil_id  uuid;
  v_graded    jsonb;
  v_results   jsonb;
begin
  if p_copy_id is null then
    raise exception 'identifiant de copie manquant';
  end if;

  select c.id, c.level into v_class_id, v_level
  from public.classes c where c.join_code = upper(btrim(coalesce(p_join_code, '')));
  if v_class_id is null then
    raise exception 'code de classe inconnu';
  end if;

  select * into v_eval from public.evaluations e where e.id = p_evaluation_id and e.class_id = v_class_id;
  if v_eval.id is null then
    raise exception 'évaluation inconnue';
  end if;

  -- Déjà reçue : le réseau a coupé après l'enregistrement, la tablette renvoie.
  if exists (select 1 from public.evaluation_copies k where k.id = p_copy_id) then
    return 'rendue';
  end if;

  if v_eval.status = 'preparee' then
    raise exception 'évaluation fermée';
  end if;
  if jsonb_typeof(p_answers) is distinct from 'array'
     or jsonb_array_length(p_answers) <> jsonb_array_length(v_eval.items) then
    raise exception 'réponses illisibles';
  end if;
  if btrim(coalesce(p_first_name, '')) = '' then
    raise exception 'prénom manquant';
  end if;

  insert into public.pupils (class_id, first_name, last_name, pupil_key)
  values (
    v_class_id,
    btrim(p_first_name),
    btrim(coalesce(p_last_name, '')),
    public.cle_eleve(p_first_name, p_last_name)
  )
  on conflict (class_id, pupil_key) do update set pupil_key = excluded.pupil_key
  returning id into v_pupil_id;

  -- Chaque réponse face à sa question. Les `case` gardent les conversions
  -- à l'abri : une réponse mal formée est fausse, jamais une erreur.
  select jsonb_agg(jsonb_build_object('domain', g.domain, 'given', g.given, 'correct', g.correct) order by g.i)
  into v_graded
  from (
    select q.ord as i,
      case when q.item ->> 'kind' = 'operation' then 'calcul' else q.item -> 'question' ->> 'domain' end as domain,
      coalesce(a.answer -> 'given', 'null'::jsonb) as given,
      case
        when q.item ->> 'kind' = 'operation' then coalesce(
          public.nombre_normalise(a.answer ->> 'given') = public.nombre_normalise(q.item -> 'operation' ->> 'expected'),
          false)
        when jsonb_typeof(q.item -> 'question' -> 'choices') = 'array'
             and jsonb_array_length(q.item -> 'question' -> 'choices') > 0 then
          case
            when coalesce(a.answer ->> 'given', '') ~ '^[0-9]{1,4}$'
                 and coalesce(q.item -> 'question' ->> 'correctIndex', '') ~ '^[0-9]{1,4}$'
            then (a.answer ->> 'given')::int = (q.item -> 'question' ->> 'correctIndex')::int
            else false
          end
        else coalesce(a.answer -> 'correct' = 'true'::jsonb, false)
      end as correct
    from jsonb_array_elements(v_eval.items) with ordinality as q(item, ord)
    join jsonb_array_elements(p_answers) with ordinality as a(answer, ord) using (ord)
  ) g;

  -- Le résultat par notion, dans l'ordre où les notions apparaissent.
  select coalesce(jsonb_agg(jsonb_build_object('domain', d.domain, 'correct', d.ok, 'total', d.n) order by d.first), '[]'::jsonb)
  into v_results
  from (
    select x ->> 'domain' as domain,
      count(*) filter (where x -> 'correct' = 'true'::jsonb) as ok,
      count(*) as n,
      min(position) as first
    from jsonb_array_elements(v_graded) with ordinality as t(x, position)
    group by x ->> 'domain'
  ) d;

  -- La séance d'abord, la copie ensuite : la copie porte l'identifiant de la
  -- séance. Si l'élève a déjà rendu sa copie, depuis cette tablette ou une
  -- autre, rien n'est gardé de ce second envoi : la première copie compte.
  begin
    insert into public.sessions (id, pupil_id, level, trimester, subject, activity, results)
    values (p_copy_id, v_pupil_id, v_level, v_eval.trimester, v_eval.subject, 'evaluation', v_results);
    insert into public.evaluation_copies (id, evaluation_id, pupil_id, answers, results)
    values (
      p_copy_id,
      v_eval.id,
      v_pupil_id,
      (select jsonb_agg(x - 'domain' order by position) from jsonb_array_elements(v_graded) with ordinality as t(x, position)),
      v_results
    );
  exception when unique_violation then
    return 'deja_faite';
  end;

  -- Les opérations posées rejoignent les feuilles que la maîtresse corrige au
  -- stylet, comme celles d'une séance d'opérations.
  if exists (select 1 from jsonb_array_elements(v_eval.items) x where x ->> 'kind' = 'operation') then
    insert into public.worksheets (session_id, pupil_id, operations, answers)
    select p_copy_id, v_pupil_id,
      (select jsonb_agg(q.item -> 'operation' order by q.ord)
         from jsonb_array_elements(v_eval.items) with ordinality as q(item, ord)
         where q.item ->> 'kind' = 'operation'),
      (select jsonb_object_agg(
           q.item -> 'operation' ->> 'id',
           jsonb_build_object(
             'given', coalesce(a.answer ->> 'given', ''),
             'strokes', case when jsonb_typeof(a.answer -> 'strokes') = 'array' then a.answer -> 'strokes' else '[]'::jsonb end))
         from jsonb_array_elements(v_eval.items) with ordinality as q(item, ord)
         join jsonb_array_elements(p_answers) with ordinality as a(answer, ord) using (ord)
         where q.item ->> 'kind' = 'operation');
  end if;

  return 'rendue';
end;
$$;

revoke all on function public.rendre_evaluation(uuid, text, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.rendre_evaluation(uuid, text, uuid, text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------- côté maîtresse ------

-- Les évaluations d'une classe, sans leurs questions : la liste se relit
-- souvent pendant qu'une évaluation est ouverte, pour voir les copies
-- arriver. `security invoker` : la fonction ne lit que ce que la RLS laisse
-- voir à la maîtresse connectée.
create or replace function public.lire_evaluations(p_class_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'subject', e.subject,
    'period', e.period,
    'trimester', e.trimester,
    'status', e.status,
    'created_at', e.created_at,
    'opened_at', e.opened_at,
    'closed_at', e.closed_at,
    'question_count', jsonb_array_length(e.items),
    'copy_count', (select count(*) from public.evaluation_copies k where k.evaluation_id = e.id)
  ) order by e.created_at desc), '[]'::jsonb)
  from public.evaluations e
  where e.class_id = p_class_id;
$$;

revoke all on function public.lire_evaluations(uuid) from public, anon;
grant execute on function public.lire_evaluations(uuid) to authenticated;

-- Les copies d'une évaluation, avec le nom de chaque élève. `security
-- invoker` là aussi.
create or replace function public.lire_copies(p_evaluation_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', k.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'answers', k.answers,
    'results', k.results,
    'at', k.at
  ) order by p.last_name, p.first_name), '[]'::jsonb)
  from public.evaluation_copies k
  join public.pupils p on p.id = k.pupil_id
  where k.evaluation_id = p_evaluation_id;
$$;

revoke all on function public.lire_copies(uuid) from public, anon;
grant execute on function public.lire_copies(uuid) to authenticated;

-- La classe telle que la lit la maîtresse, avec maintenant sa zone.
create or replace function public.lire_ma_classe()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'level', c.level,
    'join_code', c.join_code,
    'zone', c.zone,
    'pupils', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'sessions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id,
            'at', s.at,
            'level', s.level,
            'trimester', s.trimester,
            'subject', s.subject,
            'activity', s.activity,
            'results', s.results
          ) order by s.at)
          from public.sessions s where s.pupil_id = p.id
        ), '[]'::jsonb)
      ) order by p.last_name, p.first_name)
      from public.pupils p where p.class_id = c.id
    ), '[]'::jsonb)
  ) order by c.created_at), '[]'::jsonb)
  from public.classes c;
$$;

revoke all on function public.lire_ma_classe() from public, anon;
grant execute on function public.lire_ma_classe() to authenticated;

notify pgrst, 'reload schema';
