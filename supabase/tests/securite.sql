-- Vérifie les règles d'accès de 001_classes_eleves_seances.sql.
-- Chaque vérification lève une exception en cas d'écart : le script s'arrête
-- au premier problème, et un « OK » final veut dire que tout a tenu.
\set ON_ERROR_STOP 1
set client_min_messages = warning;
-- Les vérifications ne renvoient rien d'utile à l'écran : seul compte
-- qu'elles ne lèvent pas d'exception.
\o /dev/null

-- Supabase accorde par défaut tous les droits sur les tables de « public »
-- à anon et authenticated : c'est la RLS, et elle seule, qui protège.
grant all on all tables in schema public to anon, authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@ecole.fr'),
  ('00000000-0000-0000-0000-00000000000b', 'b@ecole.fr');
insert into public.classes (id, teacher_id, name, level, join_code) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a', 'CM1 A', 'CM1', 'AAAAAA'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-00000000000b', 'CM2 B', 'CM2', 'BBBBBB');

-- Attend qu'une instruction échoue, avec un message précis.
create or replace function pg_temp.doit_echouer(p_sql text, p_motif text, p_quoi text)
returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'ÉCHEC : % — l''instruction est passée', p_quoi;
exception when others then
  if sqlerrm like 'ÉCHEC%' or sqlerrm not like '%' || p_motif || '%' then
    raise exception 'ÉCHEC : % — erreur inattendue : %', p_quoi, sqlerrm;
  end if;
end $$;

create or replace function pg_temp.attendu(p_obtenu bigint, p_attendu bigint, p_quoi text)
returns void language plpgsql as $$
begin
  if p_obtenu is distinct from p_attendu then
    raise exception 'ÉCHEC : % — attendu %, obtenu %', p_quoi, p_attendu, p_obtenu;
  end if;
end $$;

grant execute on all functions in schema pg_temp to anon, authenticated;

-- ------------------------------------------------------------- l'élève ---
set role anon;

select public.depose_seance(gen_random_uuid(), 'aaaaaa', 'Léa', 'Martin', 'CM1', 2::smallint, 'maths', 'questions',
  '[{"domain":"calcul","correct":3,"total":4}]');

select pg_temp.doit_echouer(
  $q$select public.depose_seance(gen_random_uuid(), 'ZZZZZZ','Léa','Martin','CM1',2::smallint,'maths','questions','[]')$q$,
  'code de classe inconnu', 'un code de classe inconnu doit être refusé');

select pg_temp.doit_echouer(
  $q$select public.depose_seance(gen_random_uuid(), 'AAAAAA','Léa','Martin','CM1',2::smallint,'maths','questions','{"x":1}')$q$,
  'résultats illisibles', 'des résultats qui ne sont pas une liste doivent être refusés');

select pg_temp.attendu((select count(*) from public.classes), 0, 'un anonyme ne lit aucune classe');
select pg_temp.attendu((select count(*) from public.pupils), 0, 'un anonyme ne lit aucun élève');
select pg_temp.attendu((select count(*) from public.sessions), 0, 'un anonyme ne lit aucune séance');

select pg_temp.doit_echouer(
  $q$insert into public.pupils (class_id, first_name, last_name, pupil_key)
     values ('11111111-1111-1111-1111-111111111111', 'Pirate', 'X', 'x')$q$,
  'row-level security', 'un anonyme ne doit pas écrire un élève, même avec un identifiant deviné');

-- La même élève, tapée de plusieurs façons.
select public.depose_seance(gen_random_uuid(), 'AAAAAA', 'lea', 'MARTIN', 'CM1', 2::smallint, 'francais', 'questions', '[]');
select public.depose_seance(gen_random_uuid(), 'AAAAAA', ' Léa ', '  Martin ', 'CM1', 2::smallint, 'francais', 'questions', '[]');
select public.depose_seance(gen_random_uuid(), 'AAAAAA', 'LÉA', 'martin', 'CM1', 2::smallint, 'francais', 'questions', '[]');
-- Une autre Léa.
select public.depose_seance(gen_random_uuid(), 'AAAAAA', 'Léa', 'Dubois', 'CM1', 2::smallint, 'maths', 'questions', '[]');
reset role;

select pg_temp.attendu((select count(*) from public.pupils), 2,
  'quatre façons d''écrire Léa Martin et une Léa Dubois font deux élèves');

-- Une séance renvoyée deux fois n'est enregistrée qu'une fois.
set role anon;
select public.depose_seance('33333333-3333-3333-3333-333333333333', 'AAAAAA', 'Léa', 'Martin', 'CM1',
  2::smallint, 'maths', 'posees', '[{"domain":"calcul","correct":5,"total":6}]',
  '{"operations":[],"answers":{}}');
select public.depose_seance('33333333-3333-3333-3333-333333333333', 'AAAAAA', 'Léa', 'Martin', 'CM1',
  2::smallint, 'maths', 'posees', '[{"domain":"calcul","correct":5,"total":6}]',
  '{"operations":[],"answers":{}}');
select pg_temp.doit_echouer(
  $q$select public.depose_seance(null,'AAAAAA','Léa','Martin','CM1',2::smallint,'maths','questions','[]')$q$,
  'identifiant de séance manquant', 'une séance sans identifiant doit être refusée');
reset role;
select pg_temp.attendu(
  (select count(*) from public.sessions where id = '33333333-3333-3333-3333-333333333333'), 1,
  'une séance renvoyée deux fois n''est enregistrée qu''une fois');
select pg_temp.attendu(
  (select count(*) from public.worksheets where session_id = '33333333-3333-3333-3333-333333333333'), 1,
  'sa feuille d''opérations non plus');
select pg_temp.attendu(
  (select count(*) from public.pupils where first_name = 'Léa' and last_name = 'Martin'), 1,
  'le nom affiché reste celui tapé la première fois');

-- Chaque type de séance de l'application doit être accepté par la base.
set role anon;
select public.depose_seance(gen_random_uuid(), 'AAAAAA', 'Léa', 'Martin', 'CM1', 2::smallint, 'francais', 'revision',
  '[{"domain":"accords","correct":6,"total":6}]');
reset role;
select pg_temp.attendu(
  (select count(*) from public.sessions where activity = 'revision'), 1,
  'une séance de révision ciblée doit être acceptée par la base');

-- ------------------------------------------------------- les maîtresses ---
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

select pg_temp.attendu((select count(*) from public.classes), 1, 'la maîtresse A voit sa classe');
select pg_temp.attendu((select count(*) from public.pupils), 2, 'la maîtresse A voit ses deux élèves');
select pg_temp.attendu((select count(*) from public.sessions), 7, 'la maîtresse A voit leurs sept séances');

insert into public.pupils (class_id, first_name, last_name, pupil_key)
  values ('11111111-1111-1111-1111-111111111111', 'Noé', 'Petit', 'valeur ignorée');
select pg_temp.attendu(
  (select count(*) from public.pupils where pupil_key = 'noe petit'), 1,
  'la maîtresse ajoute un élève à la main, et la base en calcule la clé');

set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

select pg_temp.attendu((select count(*) from public.classes), 1, 'la maîtresse B ne voit que sa classe');
select pg_temp.attendu((select count(*) from public.pupils), 0, 'la maîtresse B ne voit aucun élève de A');
select pg_temp.attendu((select count(*) from public.sessions), 0, 'la maîtresse B ne voit aucune séance de A');

delete from public.pupils;
update public.sessions set results = '[]';
update public.classes set teacher_id = '00000000-0000-0000-0000-00000000000b'
  where id = '11111111-1111-1111-1111-111111111111';

select pg_temp.doit_echouer(
  $q$insert into public.pupils (class_id, first_name, last_name, pupil_key)
     values ('11111111-1111-1111-1111-111111111111', 'Intrus', 'Z', 'z')$q$,
  'row-level security', 'la maîtresse B ne doit pas ajouter d''élève dans la classe A');
reset role;

select pg_temp.attendu((select count(*) from public.pupils where class_id = '11111111-1111-1111-1111-111111111111'), 3,
  'la maîtresse B n''a supprimé aucun élève de A');
select pg_temp.attendu(
  (select count(*) from public.classes
    where id = '11111111-1111-1111-1111-111111111111'
      and teacher_id = '00000000-0000-0000-0000-00000000000a'), 1,
  'la maîtresse B n''a pas pu s''approprier la classe A');


-- ------------------------------------------- création de classe, lecture ---
set role anon;
select pg_temp.doit_echouer(
  $q$select * from public.creer_classe('Intrus', 'CM1')$q$,
  'permission denied', 'un anonyme ne doit pas pouvoir créer de classe');
select pg_temp.doit_echouer(
  $q$select public.lire_ma_classe()$q$,
  'permission denied', 'un anonyme ne doit pas pouvoir lire une classe');
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
create temp table nouvelle as select * from public.creer_classe('CM1 bis', 'CM1');
select pg_temp.attendu(
  (select count(*) from nouvelle where join_code ~ '^[A-HJKMNP-Z2-9]{6}$'), 1,
  'le code de classe évite 0, O, 1, I et L');
select pg_temp.attendu(
  (select count(*) from public.classes), 2, 'la maîtresse A a maintenant deux classes');
select pg_temp.attendu(
  (select jsonb_array_length(public.lire_ma_classe())), 2, 'la maîtresse A lit ses deux classes');
select pg_temp.attendu(
  (select jsonb_array_length(public.lire_ma_classe() -> 0 -> 'pupils')), 3,
  'la maîtresse A lit les trois élèves de sa première classe');
select pg_temp.attendu(
  (select sum(jsonb_array_length(p -> 'sessions'))
     from jsonb_array_elements(public.lire_ma_classe() -> 0 -> 'pupils') p)::bigint, 7,
  'la maîtresse A lit leurs sept séances');

set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.attendu(
  (select jsonb_array_length(public.lire_ma_classe())), 1, 'la maîtresse B ne lit que sa classe');
select pg_temp.attendu(
  (select jsonb_array_length(public.lire_ma_classe() -> 0 -> 'pupils')), 0,
  'la maîtresse B ne lit aucun élève de A');
reset role;

\o
\echo 'OK : toutes les règles d''accès tiennent.'
