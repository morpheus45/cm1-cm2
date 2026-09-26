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

-- ------------------------------------------------------------ extensions ---

-- « unaccent » sert à reconnaître un même élève quelle que soit la façon dont
-- son nom a été tapé. Supabase range ses extensions dans le schéma
-- « extensions » : on fait de même, pour que ce fichier s'exécute à
-- l'identique en local et là-bas.
create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

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
  last_name   text not null check (length(btrim(last_name)) between 0 and 40),
  -- Ce qui identifie l'élève dans sa classe : sans accents, sans majuscules,
  -- sans espaces en trop. « Léa Martin » et « lea  MARTIN » sont la même
  -- enfant. Comparer les noms tels que tapés en faisait deux élèves — le
  -- premier jet de ce fichier avait ce défaut, un test l'a attrapé.
  pupil_key   text not null,
  created_at  timestamptz not null default now(),
  unique (class_id, pupil_key)
);

-- `security definer` : le calcul appelle une extension, et ne doit pas
-- dépendre des droits de celui qui écrit. Sans cela, l'appel échouait pour
-- tout rôle n'ayant pas accès au schéma « extensions » — y compris la
-- maîtresse qui ajoute un élève à la main. La fonction ne fait que calculer
-- une chaîne : l'exécuter avec plus de droits n'expose rien.
create or replace function public.cle_eleve(p_first_name text, p_last_name text)
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select btrim(lower(regexp_replace(
    extensions.unaccent(btrim(coalesce(p_first_name, '')) || ' ' || btrim(coalesce(p_last_name, ''))),
    '\s+', ' ', 'g'
  )));
$$;

create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  pupil_id    uuid not null references public.pupils (id) on delete cascade,
  at          timestamptz not null default now(),
  level       text not null check (level in ('CM1', 'CM2')),
  trimester   smallint not null check (trimester between 1 and 3),
  subject     text not null check (subject in ('francais', 'maths')),
  activity    text not null check (activity in ('questions', 'posees', 'revision')),
  -- [{ "domain": "calcul", "correct": 4, "total": 6 }, ...]
  results     jsonb not null
);

create index if not exists sessions_pupil_at_idx on public.sessions (pupil_id, at desc);

-- Les types de séance acceptés. La contrainte est réécrite à chaque exécution,
-- parce que « create table if not exists » ne touche pas une table existante :
-- sans cela, une base créée par une version antérieure de ce fichier garderait
-- l'ancienne liste. C'est arrivé : la révision ciblée, ajoutée à
-- l'application, était refusée par la base, et la séance perdue.
alter table public.sessions drop constraint if exists sessions_activity_check;
alter table public.sessions add constraint sessions_activity_check
  check (activity in ('questions', 'posees', 'revision'));

create table if not exists public.worksheets (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions (id) on delete cascade,
  pupil_id      uuid not null references public.pupils (id) on delete cascade,
  -- [{ "id": "...", "statement": "244 + 282", "expected": "526" }, ...]
  operations    jsonb not null,
  -- { "<id d'opération>": { "given": "526", "strokes": [...] } }
  answers       jsonb not null,
  -- La correction de la maîtresse (src/lib/correction.ts) : ses traits
  -- rouges, tracés par-dessus, et son appréciation.
  -- { "version": 1, "appreciation": "...",
  --   "operations": { "<id d'opération>": { "teacherStrokes": [...] } } }
  corrections   jsonb,
  corrected_at  timestamptz
);

create index if not exists worksheets_pupil_idx on public.worksheets (pupil_id);

-- La clé est recalculée à chaque écriture, par la base elle-même : un élève
-- ajouté à la main par la maîtresse, ou renommé, reste cohérent avec ceux
-- qu'a créés l'application.
create or replace function public.pupils_calcule_cle()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  new.pupil_key := public.cle_eleve(new.first_name, new.last_name);
  return new;
end;
$$;

drop trigger if exists pupils_cle on public.pupils;
create trigger pupils_cle
  before insert or update of first_name, last_name on public.pupils
  for each row execute function public.pupils_calcule_cle();

-- ------------------------------------------------------------------ RLS ---

alter table public.classes    enable row level security;
alter table public.pupils     enable row level security;
alter table public.sessions   enable row level security;
alter table public.worksheets enable row level security;

-- Droits posés noir sur blanc, sans compter sur les réglages du projet.
-- Supabase donne d'office aux rôles « anon » (la clé publique) et
-- « authenticated » (une maîtresse connectée) tous les droits sur ce qui est
-- créé ici, tables comme fonctions — la RLS étant alors la seule barrière.
-- On en retire donc tout ce qui ne sert pas : le visiteur sans compte ne
-- touche à aucune table, pas même en lecture ; la maîtresse garde lecture et
-- écriture — sa RLS décide ensuite quelles lignes — mais pas TRUNCATE, qui
-- viderait une table sans passer par la RLS.
revoke all on table public.classes, public.pupils, public.sessions, public.worksheets
  from public, anon, authenticated;
grant select, insert, update, delete
  on table public.classes, public.pupils, public.sessions, public.worksheets
  to authenticated;

-- Les deux fonctions internes ne s'appellent pas de l'extérieur : le
-- déclencheur les exécute avec les droits de leur propriétaire.
revoke all on function public.cle_eleve(text, text) from public, anon, authenticated;
revoke all on function public.pupils_calcule_cle() from public, anon, authenticated;

-- La maîtresse ne voit que ses classes.
drop policy if exists "maitresse gere ses classes" on public.classes;
create policy "maitresse gere ses classes" on public.classes
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

drop policy if exists "maitresse gere ses eleves" on public.pupils;
create policy "maitresse gere ses eleves" on public.pupils
  for all using (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

drop policy if exists "maitresse lit les seances de ses eleves" on public.sessions;
create policy "maitresse lit les seances de ses eleves" on public.sessions
  for select using (
    exists (
      select 1 from public.pupils p
      join public.classes c on c.id = p.class_id
      where p.id = pupil_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "maitresse corrige les feuilles de ses eleves" on public.worksheets;
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
-- Ancienne signature, sans identifiant de séance : supprimée si une version
-- antérieure de ce fichier a déjà été exécutée, pour qu'il n'en reste qu'une.
drop function if exists public.depose_seance(text, text, text, text, smallint, text, text, jsonb, jsonb);

create or replace function public.depose_seance(
  p_session_id  uuid,
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
begin
  if p_session_id is null then
    raise exception 'identifiant de séance manquant';
  end if;

  select id into v_class_id from public.classes where join_code = upper(btrim(p_join_code));
  if v_class_id is null then
    raise exception 'code de classe inconnu';
  end if;

  if jsonb_typeof(p_results) is distinct from 'array' then
    raise exception 'résultats illisibles';
  end if;

  -- L'élève est créé la première fois qu'il dépose une séance ; ensuite on le
  -- retrouve par sa clé. Le nom affiché reste celui de la première fois : une
  -- faute de frappe ultérieure ne le réécrit pas.
  insert into public.pupils (class_id, first_name, last_name, pupil_key)
  values (
    v_class_id,
    btrim(p_first_name),
    btrim(coalesce(p_last_name, '')),
    public.cle_eleve(p_first_name, p_last_name)
  )
  on conflict (class_id, pupil_key) do update set pupil_key = excluded.pupil_key
  returning id into v_pupil_id;

  -- L'identifiant vient de l'appareil de l'élève. Une séance renvoyée deux
  -- fois — le réseau a coupé après l'enregistrement mais avant la réponse —
  -- n'est donc enregistrée qu'une fois.
  insert into public.sessions (id, pupil_id, level, trimester, subject, activity, results)
  values (p_session_id, v_pupil_id, p_level, p_trimester, p_subject, p_activity, p_results)
  on conflict (id) do nothing;

  if p_worksheet is not null then
    insert into public.worksheets (session_id, pupil_id, operations, answers)
    select p_session_id, v_pupil_id, p_worksheet -> 'operations', p_worksheet -> 'answers'
    where not exists (select 1 from public.worksheets w where w.session_id = p_session_id);
  end if;

  return p_session_id;
end;
$$;

revoke all on function public.depose_seance(uuid, text, text, text, text, smallint, text, text, jsonb, jsonb) from public;
grant execute on function public.depose_seance(uuid, text, text, text, text, smallint, text, text, jsonb, jsonb) to anon, authenticated;

-- ------------------------------------------------ côté maîtresse ----------

-- Crée une classe pour la maîtresse connectée et lui rend son code.
--
-- `security invoker` : la fonction s'exécute avec les droits de l'appelant, et
-- c'est donc la RLS qui décide. Une maîtresse ne peut créer une classe qu'à
-- son propre nom ; un visiteur sans compte n'a pas d'identifiant, et
-- l'insertion échoue.
--
-- Le code évite les caractères qu'un enfant confond à l'écrit ou à l'oral :
-- ni 0 ni O, ni 1 ni I ni L.
create or replace function public.creer_classe(p_name text, p_level text)
returns table (class_id uuid, join_code text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code     text;
  v_id       uuid;
begin
  if auth.uid() is null then
    raise exception 'connexion requise';
  end if;
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    begin
      insert into public.classes (teacher_id, name, level, join_code)
      values (auth.uid(), btrim(p_name), p_level, v_code)
      returning id into v_id;
      exit;
    exception when unique_violation then
      -- Code déjà pris par une autre classe : on en tire un autre.
    end;
  end loop;
  return query select v_id, v_code;
end;
$$;

revoke all on function public.creer_classe(text, text) from public, anon;
grant execute on function public.creer_classe(text, text) to authenticated;

-- Tout ce que la maîtresse connectée peut voir, en un seul appel : ses
-- classes, leurs élèves, leurs séances. `security invoker` là aussi : la
-- fonction ne lit que ce que la RLS laisse voir à l'appelant, et ne peut
-- donc rien montrer de plus que les tables elles-mêmes.
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

-- Supabase garde en cache la liste des fonctions appelables : on lui demande
-- de la relire, sans quoi la nouvelle fonction resterait introuvable jusqu'au
-- prochain redémarrage de l'API. Sans effet en local.
notify pgrst, 'reload schema';
