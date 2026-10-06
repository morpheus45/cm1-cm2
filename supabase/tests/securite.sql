-- Vérifie les règles d'accès des fichiers 0*.sql.
-- Chaque vérification lève une exception en cas d'écart : le script s'arrête
-- au premier problème, et un « OK » final veut dire que tout a tenu.
\set ON_ERROR_STOP 1
set client_min_messages = warning;
-- Les vérifications ne renvoient rien d'utile à l'écran : seul compte
-- qu'elles ne lèvent pas d'exception.
\o /dev/null

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

create or replace function pg_temp.egal(p_obtenu text, p_attendu text, p_quoi text)
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

select pg_temp.doit_echouer($q$select count(*) from public.classes$q$,
  'permission denied', 'un anonyme ne doit lire aucune classe');
select pg_temp.doit_echouer($q$select count(*) from public.pupils$q$,
  'permission denied', 'un anonyme ne doit lire aucun élève');
select pg_temp.doit_echouer($q$select count(*) from public.sessions$q$,
  'permission denied', 'un anonyme ne doit lire aucune séance');
select pg_temp.doit_echouer($q$select count(*) from public.worksheets$q$,
  'permission denied', 'un anonyme ne doit lire aucune feuille d''opérations');
select pg_temp.doit_echouer($q$truncate public.sessions$q$,
  'permission denied', 'un anonyme ne doit pas pouvoir vider une table');
select pg_temp.doit_echouer($q$select public.cle_eleve('Léa', 'Martin')$q$,
  'permission denied', 'un anonyme n''a pas à appeler les fonctions internes');

select pg_temp.doit_echouer(
  $q$insert into public.pupils (class_id, first_name, last_name, pupil_key)
     values ('11111111-1111-1111-1111-111111111111', 'Pirate', 'X', 'x')$q$,
  'permission denied', 'un anonyme ne doit pas écrire un élève, même avec un identifiant deviné');

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

-- ------------------------------------------------ les problèmes de la classe ---
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.problemes (class_id, enonce, reponse, unite, calcul, fausses_reponses, trimestre) values
  ('11111111-1111-1111-1111-111111111111', 'Un paquet contient 12 billes. Combien de billes dans 3 paquets ?', '36', 'billes', '12 × 3', '["15", "39", "4"]', 1),
  ('11111111-1111-1111-1111-111111111111', 'Un problème que la maîtresse a retiré de la classe.', '10', '', '5 + 5', '[]', 1);
update public.problemes set actif = false where enonce like 'Un problème que la maîtresse a retiré%';
select pg_temp.doit_echouer(
  $q$insert into public.problemes (class_id, enonce, reponse, calcul, trimestre)
     values ('11111111-1111-1111-1111-111111111111', 'Une réponse qui n''est pas un nombre.', 'douze', '12', 1)$q$,
  'check constraint', 'la réponse d''un problème doit être un nombre');
select pg_temp.attendu(public.compter_demande_assistant()::bigint, 1, 'première demande du jour à l''assistant');
select pg_temp.attendu(public.compter_demande_assistant()::bigint, 2, 'deuxième demande du jour à l''assistant');

set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.attendu((select count(*) from public.problemes), 0, 'la maîtresse B ne voit aucun problème de A');
select pg_temp.doit_echouer(
  $q$insert into public.problemes (class_id, enonce, reponse, calcul, trimestre)
     values ('11111111-1111-1111-1111-111111111111', 'Un problème glissé dans la classe d''une autre.', '1', '1', 1)$q$,
  'row-level security', 'la maîtresse B ne doit pas ajouter de problème dans la classe A');
update public.problemes set actif = false;
select pg_temp.attendu(public.compter_demande_assistant()::bigint, 1, 'le compteur de B est le sien');
reset role;
select pg_temp.attendu((select count(*) from public.problemes where actif), 1,
  'la maîtresse B n''a retiré aucun problème de A');

set role anon;
select pg_temp.doit_echouer($q$select count(*) from public.problemes$q$,
  'permission denied', 'un anonyme ne doit pas lire la table des problèmes');
select pg_temp.attendu((select count(*) from public.problemes_de_la_classe('aaaaaa')), 1,
  'l''élève reçoit le seul problème en service de sa classe, code tapé en minuscules');
select pg_temp.attendu((select count(*) from public.problemes_de_la_classe('BBBBBB')), 0,
  'la classe B n''a aucun problème');
select pg_temp.attendu((select count(*) from public.problemes_de_la_classe('ZZZZZZ')), 0,
  'un code inconnu ne donne rien');
select pg_temp.doit_echouer($q$select public.compter_demande_assistant()$q$,
  'permission denied', 'un anonyme ne doit pas pouvoir compter de demande au chat');
select pg_temp.doit_echouer($q$select count(*) from public.assistant_usage$q$,
  'permission denied', 'un anonyme ne doit pas lire le compteur du chat');
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.doit_echouer($q$select count(*) from public.assistant_usage$q$,
  'permission denied', 'le compteur ne se lit ni ne se modifie directement');
reset role;

-- ---------------------------------------- les demandes pour l'administrateur ---
set role anon;
select pg_temp.doit_echouer($q$select public.transmettre_a_l_administrateur('x', 'y')$q$,
  'permission denied', 'un anonyme ne doit rien pouvoir transmettre à l''administrateur');
reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select public.transmettre_a_l_administrateur('Peux-tu changer la couleur du site ?', 'Changer la couleur du site');
select pg_temp.doit_echouer($q$select count(*) from public.demandes_administrateur$q$,
  'permission denied', 'une maîtresse ne lit pas les demandes, même les siennes');
reset role;
select pg_temp.attendu(
  (select count(*) from public.demandes_administrateur
    where teacher_email = 'a@ecole.fr' and resume = 'Changer la couleur du site' and not traitee), 1,
  'la demande est rangée pour l''administrateur, avec l''adresse de la maîtresse');

-- ------------------------------------------ l'élève voit sa correction ---
-- La maîtresse A corrige la feuille de Léa (séance 3333…) ; celle de Noé
-- attend encore.
update public.worksheets
   set corrections = '{"version":1,"appreciation":"Bien","operations":{}}', corrected_at = now()
 where session_id = '33333333-3333-3333-3333-333333333333';
set role anon;
select public.depose_seance('44444444-4444-4444-4444-444444444444', 'AAAAAA', 'Noé', 'Petit', 'CM1',
  2::smallint, 'maths', 'posees', '[{"domain":"calcul","correct":2,"total":6}]',
  '{"operations":[],"answers":{}}');
select pg_temp.attendu(
  (select count(*) from public.corrections_de_mes_feuilles(array['33333333-3333-3333-3333-333333333333'::uuid])
    where corrections ->> 'appreciation' = 'Bien' and corrected_at is not null), 1,
  'la tablette de Léa retrouve sa feuille corrigée, avec l''appréciation');
select pg_temp.attendu(
  (select count(*) from public.corrections_de_mes_feuilles(array['44444444-4444-4444-4444-444444444444'::uuid])), 0,
  'une feuille pas encore corrigée ne se montre pas');
select pg_temp.attendu(
  (select count(*) from public.corrections_de_mes_feuilles(array[gen_random_uuid(), gen_random_uuid()])), 0,
  'un identifiant inventé ne donne rien');
select pg_temp.attendu((select count(*) from public.corrections_de_mes_feuilles(null)), 0,
  'rien demandé, rien rendu');
select pg_temp.attendu(
  (select count(*) from public.corrections_de_mes_feuilles(
     array(select gen_random_uuid() from generate_series(1, 50)) || '33333333-3333-3333-3333-333333333333'::uuid)), 0,
  'au-delà de cinquante identifiants, la suite est ignorée');
select pg_temp.doit_echouer($q$select count(*) from public.worksheets$q$,
  'permission denied', 'la table des feuilles reste fermée à la clé publique');
reset role;

-- L'histoire et la géographie (004_histoire_geographie.sql).
set role anon;
select public.depose_seance(gen_random_uuid(), 'AAAAAA', 'Léa', 'Martin', 'CM1', 2::smallint, 'histoire', 'questions',
  '[{"domain":"chronologie","correct":3,"total":4}]');
select public.depose_seance(gen_random_uuid(), 'AAAAAA', 'Léa', 'Martin', 'CM1', 2::smallint, 'geographie', 'revision',
  '[{"domain":"cartes","correct":4,"total":4}]');
select pg_temp.doit_echouer(
  $q$select public.depose_seance(gen_random_uuid(),'AAAAAA','Léa','Martin','CM1',2::smallint,'musique','questions','[]')$q$,
  'sessions_subject_check', 'une matière inconnue doit être refusée');
reset role;
select pg_temp.attendu(
  (select count(*) from public.sessions where subject in ('histoire', 'geographie')), 2,
  'les séances d''histoire et de géographie doivent être acceptées par la base');

-- ------------------------------------------------------ la conservation ---
-- Une année scolaire, pas davantage : le 1er septembre, tout ce qui date de
-- l'année précédente disparaît (005_conservation_une_annee.sql).
reset role;
select pg_temp.attendu(
  (select count(*) from (values
     (public.debut_annee_scolaire('2026-09-27 12:00+02') = '2026-09-01 00:00+02'),
     (public.debut_annee_scolaire('2027-06-30 18:00+02') = '2026-09-01 00:00+02'),
     (public.debut_annee_scolaire('2027-01-15 09:00+01') = '2026-09-01 00:00+02'),
     (public.debut_annee_scolaire('2026-08-31 23:30+02') = '2025-09-01 00:00+02'),
     (public.debut_annee_scolaire('2026-08-31 22:30+00') = '2026-09-01 00:00+02')) v(juste)
   where juste), 5,
  'l''année scolaire commence le 1er septembre à minuit, heure de Paris');

insert into public.pupils (id, class_id, first_name, last_name, pupil_key, created_at) values
  ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111111', 'Ancien', 'A', 'x', now() - interval '2 years'),
  ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111111', 'Fidèle', 'F', 'x', now() - interval '2 years');
insert into public.sessions (id, pupil_id, at, level, trimester, subject, activity, results) values
  ('55555555-5555-5555-5555-555555555511', '55555555-5555-5555-5555-555555555501',
    public.debut_annee_scolaire() - interval '1 day', 'CM1', 3, 'maths', 'posees', '[]'),
  ('55555555-5555-5555-5555-555555555512', '55555555-5555-5555-5555-555555555502',
    public.debut_annee_scolaire() - interval '300 days', 'CM1', 1, 'francais', 'questions', '[]'),
  ('55555555-5555-5555-5555-555555555513', '55555555-5555-5555-5555-555555555502',
    public.debut_annee_scolaire() + interval '1 day', 'CM2', 1, 'francais', 'questions', '[]');
insert into public.worksheets (session_id, pupil_id, operations, answers) values
  ('55555555-5555-5555-5555-555555555511', '55555555-5555-5555-5555-555555555501', '[]', '{}');
insert into public.assistant_usage (teacher_id, day, requests) values
  ('00000000-0000-0000-0000-00000000000a', (public.debut_annee_scolaire() - interval '10 days')::date, 3);
insert into public.demandes_administrateur (teacher_id, teacher_email, demande, created_at) values
  ('00000000-0000-0000-0000-00000000000a', 'a@ecole.fr', 'Une demande de l''an dernier.',
    public.debut_annee_scolaire() - interval '1 day');
create temp table avant_effacement as select count(*) as seances from public.sessions;

select public.effacer_annee_precedente();

select pg_temp.attendu((select count(*) from public.sessions where at < public.debut_annee_scolaire()), 0,
  'aucune séance de l''année précédente ne reste');
select pg_temp.attendu((select count(*) from public.sessions), (select seances - 2 from avant_effacement),
  'seules les deux séances de l''an dernier sont effacées');
select pg_temp.attendu(
  (select count(*) from public.worksheets where session_id = '55555555-5555-5555-5555-555555555511'), 0,
  'la feuille d''opérations part avec sa séance');
select pg_temp.attendu((select count(*) from public.pupils where id = '55555555-5555-5555-5555-555555555501'), 0,
  'un élève qui n''a travaillé que l''an dernier disparaît');
select pg_temp.attendu((select count(*) from public.pupils where id = '55555555-5555-5555-5555-555555555502'), 1,
  'un élève qui a travaillé cette année reste');
select pg_temp.attendu(
  (select count(*) from public.assistant_usage where day < public.debut_annee_scolaire()::date), 0,
  'le compteur des demandes de l''an dernier disparaît');
select pg_temp.attendu(
  (select count(*) from public.demandes_administrateur where created_at < public.debut_annee_scolaire()), 0,
  'les demandes transmises l''an dernier disparaissent');
select pg_temp.attendu((select count(*) from public.classes), 3, 'les classes des maîtresses restent');
select pg_temp.attendu((select count(*) from public.problemes), 2, 'les problèmes des classes restent');

-- ------------------------------------------------------- les évaluations ---
-- (006_evaluations.sql) La maîtresse A prépare une évaluation de maths : une
-- question de numération, une de calcul, une construction au doigt et une
-- opération posée.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.classes set zone = 'B' where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.doit_echouer(
  $q$update public.classes set zone = 'D' where id = '11111111-1111-1111-1111-111111111111'$q$,
  'classes_zone_check', 'une zone de vacances inconnue doit être refusée');
select pg_temp.attendu(
  (select count(*) from jsonb_array_elements(public.lire_ma_classe()) c where c ->> 'zone' = 'B'), 1,
  'la maîtresse A relit la zone de sa classe');

insert into public.evaluations (id, class_id, title, subject, period, trimester, items) values
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111',
   'Maths — fin de la période 1', 'maths', 1, 1,
   '[{"kind":"question","question":{"id":"q1","domain":"numeration","prompt":"a","choices":["1","2","3"],"correctIndex":1}},
     {"kind":"question","question":{"id":"q2","domain":"calcul","prompt":"b","choices":["4","5"],"correctIndex":0}},
     {"kind":"question","question":{"id":"q3","domain":"geometrie","prompt":"c","choices":[],"correctIndex":-1,"construction":{}}},
     {"kind":"operation","operation":{"id":"op1","statement":"12 + 30","expected":"42"}}]'),
  ('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111111',
   'Français — pas encore ouverte', 'francais', 1, 1,
   '[{"kind":"question","question":{"id":"q1","domain":"accords","prompt":"a","choices":["x","y"],"correctIndex":0}}]');
select pg_temp.doit_echouer(
  $q$insert into public.evaluations (class_id, title, subject, trimester, items)
     values ('11111111-1111-1111-1111-111111111111', 'Vide', 'maths', 1, '[]')$q$,
  'evaluations_items_check', 'une évaluation sans question doit être refusée');

set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.attendu((select count(*) from public.evaluations), 0, 'la maîtresse B ne voit aucune évaluation de A');
select pg_temp.attendu(
  jsonb_array_length(public.lire_evaluations('11111111-1111-1111-1111-111111111111'))::bigint, 0,
  'la maîtresse B ne lit pas les évaluations de A, même en donnant l''identifiant de la classe');
select pg_temp.doit_echouer(
  $q$insert into public.evaluations (class_id, title, subject, trimester, items)
     values ('11111111-1111-1111-1111-111111111111', 'Intruse', 'maths', 1, '[{"kind":"question"}]')$q$,
  'row-level security', 'la maîtresse B ne doit pas glisser d''évaluation dans la classe A');
update public.evaluations set status = 'ouverte';
reset role;
select pg_temp.attendu((select count(*) from public.evaluations where status = 'ouverte'), 0,
  'la maîtresse B n''a ouvert aucune évaluation de A');

set role anon;
select pg_temp.attendu((select count(*) from public.evaluations_ouvertes('AAAAAA')), 0,
  'une évaluation préparée n''est pas encore proposée aux élèves');
select pg_temp.egal(public.questions_de_l_evaluation('AAAAAA', '66666666-6666-6666-6666-666666666601')::text, null,
  'les questions d''une évaluation préparée ne sortent pas');
select pg_temp.doit_echouer(
  $q$select public.rendre_evaluation(gen_random_uuid(), 'AAAAAA', '66666666-6666-6666-6666-666666666601',
       'Léa', 'Martin', '[{},{},{},{}]')$q$,
  'évaluation fermée', 'aucune copie n''arrive avant que la maîtresse ouvre l''évaluation');
reset role;

-- La maîtresse A ouvre l'évaluation de maths.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.evaluations set status = 'ouverte', opened_at = now()
 where id = '66666666-6666-6666-6666-666666666601';
reset role;

set role anon;
select pg_temp.doit_echouer($q$select count(*) from public.evaluations$q$,
  'permission denied', 'un anonyme ne doit lire aucune évaluation directement');
select pg_temp.doit_echouer($q$select count(*) from public.evaluation_copies$q$,
  'permission denied', 'un anonyme ne doit lire aucune copie');
select pg_temp.doit_echouer(
  $q$select public.lire_evaluations('11111111-1111-1111-1111-111111111111')$q$,
  'permission denied', 'un anonyme ne doit pas lire les évaluations d''une classe');
select pg_temp.doit_echouer(
  $q$select public.lire_copies('66666666-6666-6666-6666-666666666601')$q$,
  'permission denied', 'un anonyme ne doit pas lire les copies d''une évaluation');
select pg_temp.attendu(
  (select count(*) from public.evaluations_ouvertes('aaaaaa')
    where level = 'CM1' and subject = 'maths' and question_count = 4 and version ~ '^[0-9a-f]{32}$'), 1,
  'la tablette reçoit l''évaluation ouverte de sa classe : quatre questions, et leur empreinte');
select pg_temp.attendu(
  jsonb_array_length(public.questions_de_l_evaluation('aaaaaa', '66666666-6666-6666-6666-666666666601'))::bigint, 4,
  'puis ses questions, une fois');
select pg_temp.egal(public.questions_de_l_evaluation('BBBBBB', '66666666-6666-6666-6666-666666666601')::text, null,
  'les questions ne sortent pas avec le code d''une autre classe');
select pg_temp.attendu((select count(*) from public.evaluations_ouvertes('BBBBBB')), 0,
  'la classe B n''a aucune évaluation');
select pg_temp.attendu((select count(*) from public.evaluations_ouvertes('ZZZZZZ')), 0,
  'un code inconnu ne donne rien');

-- Léa rend sa copie : la numération juste, le calcul faux, la construction
-- réussie, l'opération juste (écrite « 42,0 »).
select pg_temp.egal(
  public.rendre_evaluation('77777777-7777-7777-7777-777777777701', 'aaaaaa',
    '66666666-6666-6666-6666-666666666601', 'Léa', 'Martin',
    '[{"given":1},{"given":1},{"given":[[1,2]],"correct":true},{"given":"42,0","strokes":[{"points":[[0.1,0.2]]}]}]'),
  'rendue', 'la copie de Léa est rendue');
-- Renvoyée après une coupure : rien ne change.
select pg_temp.egal(
  public.rendre_evaluation('77777777-7777-7777-7777-777777777701', 'AAAAAA',
    '66666666-6666-6666-6666-666666666601', 'Léa', 'Martin',
    '[{"given":1},{"given":1},{"given":[[1,2]],"correct":true},{"given":"42,0"}]'),
  'rendue', 'une copie renvoyée est reconnue');
-- Léa recommence sur une autre tablette : sa première copie compte.
select pg_temp.egal(
  public.rendre_evaluation('77777777-7777-7777-7777-777777777702', 'AAAAAA',
    '66666666-6666-6666-6666-666666666601', 'lea', 'MARTIN',
    '[{"given":0},{"given":0},{"correct":true},{"given":"42"}]'),
  'deja_faite', 'un élève ne rend qu''une copie par évaluation');
-- Noé : une tablette trafiquée qui se dit juste partout.
select pg_temp.egal(
  public.rendre_evaluation('77777777-7777-7777-7777-777777777703', 'AAAAAA',
    '66666666-6666-6666-6666-666666666601', 'Noé', 'Petit',
    '[{"given":"abc","correct":true},{"given":"1","correct":true},{"correct":false},{"given":"41","correct":true}]'),
  'rendue', 'la copie de Noé est rendue');
-- Tom : des réponses absurdes sont fausses, sans erreur.
select pg_temp.egal(
  public.rendre_evaluation('77777777-7777-7777-7777-777777777704', 'AAAAAA',
    '66666666-6666-6666-6666-666666666601', 'Tom', 'B',
    '[{"given":99999999999},{"given":-1},{"given":null},{"given":"quarante-deux"}]'),
  'rendue', 'la copie de Tom est rendue');
select pg_temp.doit_echouer(
  $q$select public.rendre_evaluation(gen_random_uuid(), 'AAAAAA', '66666666-6666-6666-6666-666666666601',
       'Zoé', 'R', '[{"given":1}]')$q$,
  'réponses illisibles', 'une copie qui n''a pas une réponse par question doit être refusée');
select pg_temp.doit_echouer(
  $q$select public.rendre_evaluation(gen_random_uuid(), 'AAAAAA', '66666666-6666-6666-6666-666666666601',
       'Zoé', 'R', '{"given":1}')$q$,
  'réponses illisibles', 'des réponses qui ne sont pas une liste doivent être refusées');
select pg_temp.doit_echouer(
  $q$select public.rendre_evaluation(gen_random_uuid(), 'AAAAAA', '66666666-6666-6666-6666-666666666601',
       '  ', 'R', '[{},{},{},{}]')$q$,
  'prénom manquant', 'une copie sans prénom doit être refusée');
select pg_temp.doit_echouer(
  $q$select public.rendre_evaluation(null, 'AAAAAA', '66666666-6666-6666-6666-666666666601',
       'Zoé', 'R', '[{},{},{},{}]')$q$,
  'identifiant de copie manquant', 'une copie sans identifiant doit être refusée');
select pg_temp.doit_echouer(
  $q$select public.rendre_evaluation(gen_random_uuid(), 'ZZZZZZ', '66666666-6666-6666-6666-666666666601',
       'Zoé', 'R', '[{},{},{},{}]')$q$,
  'code de classe inconnu', 'une copie avec un code inconnu doit être refusée');
select pg_temp.doit_echouer(
  $q$select public.rendre_evaluation(gen_random_uuid(), 'BBBBBB', '66666666-6666-6666-6666-666666666601',
       'Zoé', 'R', '[{},{},{},{}]')$q$,
  'évaluation inconnue', 'une copie ne peut pas viser l''évaluation d''une autre classe');
select pg_temp.egal(
  (select array_to_string(rendues, ',') from public.evaluations_ouvertes('AAAAAA',
     array['77777777-7777-7777-7777-777777777701'::uuid, '77777777-7777-7777-7777-777777777702'::uuid, gen_random_uuid()])),
  '77777777-7777-7777-7777-777777777701',
  'la tablette apprend lesquelles de ses copies la base garde');
select pg_temp.attendu(
  (select coalesce(cardinality(rendues), 0) from public.evaluations_ouvertes('AAAAAA')), 0,
  'sans identifiant, la tablette n''apprend rien des copies');
reset role;

-- Ce que la base a gardé, et corrigé elle-même.
select pg_temp.egal(
  (select results::text from public.evaluation_copies where id = '77777777-7777-7777-7777-777777777701'),
  '[{"total": 1, "domain": "numeration", "correct": 1}, {"total": 2, "domain": "calcul", "correct": 1}, {"total": 1, "domain": "geometrie", "correct": 1}]',
  'la copie de Léa est corrigée par notion, dans l''ordre des questions');
select pg_temp.egal(
  (select string_agg(a ->> 'correct', ',' order by n) from public.evaluation_copies k,
     jsonb_array_elements(k.answers) with ordinality as t(a, n)
    where k.id = '77777777-7777-7777-7777-777777777703'),
  'false,false,false,false', 'la base ne croit pas une tablette qui se dit juste');
select pg_temp.egal(
  (select string_agg(a ->> 'correct', ',' order by n) from public.evaluation_copies k,
     jsonb_array_elements(k.answers) with ordinality as t(a, n)
    where k.id = '77777777-7777-7777-7777-777777777704'),
  'false,false,false,false', 'des réponses absurdes sont simplement fausses');
select pg_temp.attendu(
  (select count(*) from public.evaluation_copies k, jsonb_array_elements(k.answers) a where a ? 'domain'), 0,
  'les réponses gardées ne répètent pas la notion');
select pg_temp.attendu(
  (select count(*) from public.sessions
    where id = '77777777-7777-7777-7777-777777777701' and activity = 'evaluation' and subject = 'maths'
      and trimester = 1 and level = 'CM1'
      and results = (select results from public.evaluation_copies where id = '77777777-7777-7777-7777-777777777701')), 1,
  'la copie compte aussi comme une séance d''évaluation, pour les tableaux de la maîtresse');
select pg_temp.attendu(
  (select count(*) from public.sessions where id = '77777777-7777-7777-7777-777777777702'), 0,
  'la seconde copie de Léa n''a laissé aucune séance');
select pg_temp.egal(
  (select operations::text || ' ' || (answers -> 'op1' ->> 'given') || ' ' || jsonb_array_length(answers -> 'op1' -> 'strokes')
     from public.worksheets where session_id = '77777777-7777-7777-7777-777777777701'),
  '[{"id": "op1", "expected": "42", "statement": "12 + 30"}] 42,0 1',
  'l''opération posée de Léa rejoint les feuilles à corriger au stylet');
select pg_temp.attendu((select count(*) from public.pupils where first_name = 'Tom'), 1,
  'un élève qui rend sa première copie entre dans la classe');

-- La maîtresse A relit les copies ; la maîtresse B n'y touche pas.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.attendu(
  (select (e ->> 'copy_count')::bigint from jsonb_array_elements(
     public.lire_evaluations('11111111-1111-1111-1111-111111111111')) e
    where e ->> 'id' = '66666666-6666-6666-6666-666666666601' and (e ->> 'question_count')::int = 4), 3,
  'la maîtresse A voit que l''évaluation a reçu trois copies');
select pg_temp.attendu(
  jsonb_array_length(public.lire_copies('66666666-6666-6666-6666-666666666601'))::bigint, 3,
  'la maîtresse A lit les trois copies');
select pg_temp.attendu(
  (select count(*) from jsonb_array_elements(public.lire_copies('66666666-6666-6666-6666-666666666601')) k
    where k ->> 'first_name' = 'Léa' and k ->> 'last_name' = 'Martin' and jsonb_array_length(k -> 'answers') = 4), 1,
  'avec le nom de chaque élève et ses réponses');
select pg_temp.doit_echouer(
  $q$update public.evaluations set items = '[{"kind":"question"}]' where id = '66666666-6666-6666-6666-666666666601'$q$,
  'questions figées', 'les questions ne changent plus une fois des copies rendues');
select pg_temp.doit_echouer(
  $q$insert into public.evaluation_copies (id, evaluation_id, pupil_id, answers, results)
     select '77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', id, '[]', '[]' from public.pupils limit 1$q$,
  'permission denied', 'une maîtresse n''écrit pas de copie à la place d''un élève');
select pg_temp.doit_echouer(
  $q$update public.evaluation_copies set results = '[]'$q$,
  'permission denied', 'une maîtresse ne modifie pas une copie');

set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.attendu((select count(*) from public.evaluation_copies), 0, 'la maîtresse B ne voit aucune copie de A');
select pg_temp.attendu(
  jsonb_array_length(public.lire_copies('66666666-6666-6666-6666-666666666601'))::bigint, 0,
  'la maîtresse B ne lit aucune copie de A, même en donnant l''identifiant de l''évaluation');
delete from public.evaluation_copies;
delete from public.evaluations;
reset role;
select pg_temp.attendu((select count(*) from public.evaluation_copies), 3, 'la maîtresse B n''a effacé aucune copie de A');
select pg_temp.attendu((select count(*) from public.evaluations), 2, 'la maîtresse B n''a effacé aucune évaluation de A');

-- Faire refaire : la copie de Noé s'efface, avec sa séance et sa feuille.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
delete from public.evaluation_copies where id = '77777777-7777-7777-7777-777777777703';
reset role;
select pg_temp.attendu(
  (select count(*) from public.sessions where id = '77777777-7777-7777-7777-777777777703')
  + (select count(*) from public.worksheets where session_id = '77777777-7777-7777-7777-777777777703'), 0,
  'une copie à refaire emporte sa séance et sa feuille d''opérations');

-- La maîtresse A clôture : plus aucune tablette ne la propose, mais la copie
-- d'une tablette restée sans réseau arrive encore. Noé refait la sienne.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.evaluations set status = 'terminee', closed_at = now()
 where id = '66666666-6666-6666-6666-666666666601';
reset role;
set role anon;
select pg_temp.attendu((select count(*) from public.evaluations_ouvertes('AAAAAA')), 0,
  'une évaluation terminée n''est plus proposée');
select pg_temp.egal(public.questions_de_l_evaluation('AAAAAA', '66666666-6666-6666-6666-666666666601')::text, null,
  'ni ses questions');
select pg_temp.egal(
  public.rendre_evaluation('77777777-7777-7777-7777-777777777705', 'AAAAAA',
    '66666666-6666-6666-6666-666666666601', 'Noé', 'Petit',
    '[{"given":1},{"given":0},{"correct":true},{"given":"42"}]'),
  'rendue', 'une copie en route arrive encore après la clôture');
reset role;
select pg_temp.egal(
  (select results::text from public.evaluation_copies where id = '77777777-7777-7777-7777-777777777705'),
  '[{"total": 1, "domain": "numeration", "correct": 1}, {"total": 2, "domain": "calcul", "correct": 2}, {"total": 1, "domain": "geometrie", "correct": 1}]',
  'la copie refaite de Noé est corrigée');

-- À la rentrée, une copie de l'an dernier part avec sa séance.
insert into public.sessions (id, pupil_id, at, level, trimester, subject, activity, results) values
  ('77777777-7777-7777-7777-777777777799', '55555555-5555-5555-5555-555555555502',
    public.debut_annee_scolaire() - interval '1 day', 'CM1', 3, 'maths', 'evaluation', '[]');
insert into public.evaluation_copies (id, evaluation_id, pupil_id, answers, results, at) values
  ('77777777-7777-7777-7777-777777777799', '66666666-6666-6666-6666-666666666601',
    '55555555-5555-5555-5555-555555555502', '[]', '[]', public.debut_annee_scolaire() - interval '1 day');
select public.effacer_annee_precedente();
select pg_temp.attendu(
  (select count(*) from public.evaluation_copies where id = '77777777-7777-7777-7777-777777777799'), 0,
  'une copie de l''année précédente disparaît avec sa séance');
select pg_temp.attendu((select count(*) from public.evaluation_copies), 3, 'les copies de l''année restent');

-- Une évaluation supprimée emporte ses copies, leurs séances et leurs feuilles.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
delete from public.evaluations where id = '66666666-6666-6666-6666-666666666601';
reset role;
select pg_temp.attendu(
  (select count(*) from public.evaluation_copies)
  + (select count(*) from public.sessions where activity = 'evaluation')
  + (select count(*) from public.worksheets where session_id::text like '77777777-%'), 0,
  'une évaluation supprimée ne laisse ni copie, ni séance, ni feuille');

-- ------------------------------------------------ les niveaux, du CE1 à la 3e ---
-- La base accepte les huit niveaux de l'application, pour les classes comme
-- pour les séances (008_niveaux_ce1_3e.sql), et refuse tout autre.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.attendu(
  (select count(*)
     from unnest(array['CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e']) as n(level),
          lateral public.creer_classe('Classe de ' || n.level, n.level)),
  8, 'la maîtresse crée une classe pour chacun des huit niveaux');
select pg_temp.doit_echouer(
  $q$select * from public.creer_classe('Classe de CP', 'CP')$q$,
  'classes_level_check', 'une classe d''un niveau inconnu doit être refusée');
reset role;
select pg_temp.attendu(
  (select count(*) from public.classes where name = 'Classe de ' || level), 8,
  'chaque classe garde le niveau demandé');

-- Un élève dépose une séance dans la classe de chaque niveau, du CE1 à la 3e.
create temp table classes_des_niveaux as
  select level, join_code from public.classes where name = 'Classe de ' || level;
grant select on classes_des_niveaux to anon;
set role anon;
select public.depose_seance(gen_random_uuid(), c.join_code, 'Élève ' || c.level, '', c.level, 1::smallint, 'maths', 'questions',
  '[{"domain":"calcul","correct":3,"total":4}]')
from classes_des_niveaux c;
select pg_temp.doit_echouer(
  $q$select public.depose_seance(gen_random_uuid(), (select join_code from classes_des_niveaux where level = 'CE1'),
       'Élève', '', 'CP', 1::smallint, 'maths', 'questions', '[]')$q$,
  'sessions_level_check', 'une séance d''un niveau inconnu doit être refusée');
reset role;
select pg_temp.attendu(
  (select count(*) from public.sessions s join public.pupils p on p.id = s.pupil_id
    where p.first_name = 'Élève ' || s.level), 8,
  'une séance se dépose pour chacun des huit niveaux');

-- La maîtresse lit la classe de 6e, et la séance de son élève.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.egal(
  (select (c ->> 'level') || '/' || (c -> 'pupils' -> 0 -> 'sessions' -> 0 ->> 'level')
     from jsonb_array_elements(public.lire_ma_classe()) c
    where c ->> 'name' = 'Classe de 6e'),
  '6e/6e', 'la maîtresse lit la classe de 6e et la séance de son élève');
reset role;

-- ------------------------------------------------------------ les droits ---
-- Supabase accorde d'office tous les droits à anon et authenticated ; le
-- lanceur reproduit ce réglage. Ce qui suit vérifie ce qu'il en reste après
-- la migration, droit par droit.
select pg_temp.attendu(
  (select count(*) from unnest(array['public.classes', 'public.pupils', 'public.sessions', 'public.worksheets',
                                     'public.problemes', 'public.assistant_usage',
                                     'public.demandes_administrateur',
                                     'public.evaluations', 'public.evaluation_copies']) t,
     unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) d
   where has_table_privilege('anon', t, d)), 0,
  'la clé publique ne donne aucun droit sur les tables');
select pg_temp.attendu(
  (select count(*) from unnest(array['public.classes', 'public.pupils', 'public.sessions', 'public.worksheets',
                                     'public.evaluations', 'public.evaluation_copies']) t,
     unnest(array['truncate', 'references', 'trigger']) d
   where has_table_privilege('authenticated', t, d)), 0,
  'une maîtresse ne peut pas vider une table en contournant la RLS');
select pg_temp.attendu(
  (select count(*) from unnest(array['insert', 'update']) d
   where has_table_privilege('authenticated', 'public.evaluation_copies', d)), 0,
  'une maîtresse n''écrit ni ne modifie les copies de ses élèves');
select pg_temp.attendu(
  (select count(*) from unnest(array['public.cle_eleve(text, text)', 'public.pupils_calcule_cle()',
                                     'public.creer_classe(text, text)', 'public.lire_ma_classe()',
                                     'public.compter_demande_assistant()',
                                     'public.transmettre_a_l_administrateur(text, text)',
                                     'public.debut_annee_scolaire(timestamptz)',
                                     'public.effacer_annee_precedente()',
                                     'public.lire_evaluations(uuid)', 'public.lire_copies(uuid)',
                                     'public.nombre_normalise(text)',
                                     'public.copie_efface_sa_seance()',
                                     'public.evaluations_questions_figees()']) f
   where has_function_privilege('anon', f, 'execute')), 0,
  'la clé publique n''ouvre que le dépôt de séance et les problèmes de sa classe');
select pg_temp.attendu(
  (select count(*) from unnest(array['public.cle_eleve(text, text)', 'public.pupils_calcule_cle()',
                                     'public.debut_annee_scolaire(timestamptz)',
                                     'public.effacer_annee_precedente()',
                                     'public.nombre_normalise(text)', 'public.copie_efface_sa_seance()',
                                     'public.evaluations_questions_figees()']) f
   where has_function_privilege('authenticated', f, 'execute')), 0,
  'les fonctions internes ne s''appellent pas de l''extérieur');
select pg_temp.attendu(
  (select count(*) from unnest(array[
      'public.depose_seance(uuid, text, text, text, text, smallint, text, text, jsonb, jsonb)']) f
   where has_function_privilege('anon', f, 'execute')), 1,
  'la clé publique permet toujours de déposer une séance');
select pg_temp.attendu(
  (select count(*) from unnest(array['public.corrections_de_mes_feuilles(uuid[])']) f
   where has_function_privilege('anon', f, 'execute')), 1,
  'la clé publique permet à la tablette de l''élève de relire ses feuilles corrigées');
select pg_temp.attendu(
  (select count(*) from unnest(array['public.evaluations_ouvertes(text, uuid[])',
      'public.questions_de_l_evaluation(text, uuid)',
      'public.rendre_evaluation(uuid, text, uuid, text, text, jsonb)']) f
   where has_function_privilege('anon', f, 'execute')), 3,
  'la clé publique permet de recevoir les évaluations ouvertes et d''y rendre sa copie');

\o
\echo 'OK : toutes les règles d''accès tiennent.'
