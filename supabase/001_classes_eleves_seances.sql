-- Base de l'espace maîtresse : classes, élèves, séances, feuilles corrigées.
--
-- À exécuter une fois dans l'éditeur SQL du projet Supabase.
--
-- Deux principes gouvernent ce fichier :
--
--  1. L'application de l'élève n'a pas de compte. Elle ne touche donc JAMAIS
--     directement aux tables : elle appelle une fonction qui vérifie le code
--     de la classe avant d'écrire. La clé publique de l'application ne permet
--     rien d'autre — pas de lecture des élèves, pas de modification.
--
--  2. La maîtresse, elle, a un compte, et ne voit que ses propres classes.
--     C'est la base de données qui l'impose (RLS), pas le code de la page :
--     une erreur dans l'interface ne peut pas exposer la classe d'à côté.

-- ---------------------------------------------------------------- tables ---

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  level       text not null check (level in ('CM1', 'CM2')),
  -- Le code que l'élève saisit une fois, sur sa tablette.
  join_code   text not null unique check (join_code ~ '^[A-Z0-9]{6}$'),
  created_at  timestamptz not null default now()
);

create table if not exists public.pupils (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  first_name  text not null check (length(btrim(first_name)) between 1 and 40),
  last_name   text not null check (length(btrim(last_name)) between 1 and 40),
  created_at  timestamptz not null default now(),
  unique (class_id, first_name, last_name)
);

create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  pupil_id    uuid not null references public.pupils (id) on delete cascade,
  at          timestamptz not null default now(),
  level       text not null check (level in ('CM1', 'CM2')),
  trimester   smallint not null check (trimester between 1 and 3),
  subject     text not null check (subject in ('francais', 'maths')),
  activity    text not null check (activity in ('questions', 'posees')),
  -- [{ "domain": "calcul", "correct": 4, "total": 6 }, ...]
  results     jsonb not null
);

create index if not exists sessions_pupil_at_idx on public.sessions (pupil_id, at desc);

create table if not exists public.worksheets (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions (id) on delete cascade,
  pupil_id      uuid not null references public.pupils (id) on delete cascade,
  -- [{ "id": "...", "statement": "244 + 282", "expected": "526" }, ...]
  operations    jsonb not null,
  -- { "<id d'opération>": { "given": "526", "strokes": [...] } }
  answers       jsonb not null,
  -- Les annotations de la maîtresse, tracées par-dessus.
  -- { "<id d'opération>": { "teacherStrokes": [...], "comment": "..." } }
  corrections   jsonb,
  corrected_at  timestamptz
);

create index if not exists worksheets_pupil_idx on public.worksheets (pupil_id);

-- ------------------------------------------------------------------ RLS ---

alter table public.classes    enable row level security;
alter table public.pupils     enable row level security;
alter table public.sessions   enable row level security;
alter table public.worksheets enable row level security;

-- La maîtresse ne voit que ses classes.
create policy "maitresse gere ses classes" on public.classes
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create policy "maitresse gere ses eleves" on public.pupils
  for all using (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

create policy "maitresse lit les seances de ses eleves" on public.sessions
  for select using (
    exists (
      select 1 from public.pupils p
      join public.classes c on c.id = p.class_id
      where p.id = pupil_id and c.teacher_id = auth.uid()
    )
  );

create policy "maitresse corrige les feuilles de ses eleves" on public.worksheets
  for all using (
    exists (
      select 1 from public.pupils p
      join public.classes c on c.id = p.class_id
      where p.id = pupil_id and c.teacher_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.pupils p
      join public.classes c on c.id = p.class_id
      where p.id = pupil_id and c.teacher_id = auth.uid()
    )
  );

-- Aucune politique pour le rôle anonyme : sans compte, on ne peut rien lire
-- ni écrire directement. Tout passe par la fonction ci-dessous.

-- ------------------------------------------------------ dépôt d'une séance ---

-- `security definer` : la fonction s'exécute avec les droits de son
-- propriétaire, ce qui lui permet d'écrire là où l'appelant anonyme n'a
-- aucun droit. Elle ne rend jamais autre chose qu'un identifiant, donc elle
-- ne peut pas servir à lire la classe.
create or replace function public.depose_seance(
  p_join_code   text,
  p_first_name  text,
  p_last_name   text,
  p_level       text,
  p_trimester   smallint,
  p_subject     text,
  p_activity    text,
  p_results     jsonb,
  p_worksheet   jsonb default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id   uuid;
  v_pupil_id   uuid;
  v_session_id uuid;
begin
  select id into v_class_id from public.classes where join_code = upper(btrim(p_join_code));
  if v_class_id is null then
    raise exception 'code de classe inconnu';
  end if;

  -- L'élève est créé la première fois qu'il dépose une séance ; ensuite on le
  -- retrouve. Pas de doublon « Léa » / « léa  » : on compare une fois nettoyé.
  insert into public.pupils (class_id, first_name, last_name)
  values (v_class_id, btrim(p_first_name), btrim(p_last_name))
  on conflict (class_id, first_name, last_name) do update set first_name = excluded.first_name
  returning id into v_pupil_id;

  insert into public.sessions (pupil_id, level, trimester, subject, activity, results)
  values (v_pupil_id, p_level, p_trimester, p_subject, p_activity, p_results)
  returning id into v_session_id;

  if p_worksheet is not null then
    insert into public.worksheets (session_id, pupil_id, operations, answers)
    values (
      v_session_id,
      v_pupil_id,
      p_worksheet -> 'operations',
      p_worksheet -> 'answers'
    );
  end if;

  return v_session_id;
end;
$$;

revoke all on function public.depose_seance(text, text, text, text, smallint, text, text, jsonb, jsonb) from public;
grant execute on function public.depose_seance(text, text, text, text, smallint, text, text, jsonb, jsonb) to anon, authenticated;
