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
select pg_temp.attendu(public.compter_demande_assistant()::bigint, 1, 'première demande du jour à Claude');
select pg_temp.attendu(public.compter_demande_assistant()::bigint, 2, 'deuxième demande du jour à Claude');

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

-- ------------------------------------------------------------ les droits ---
-- Supabase accorde d'office tous les droits à anon et authenticated ; le
-- lanceur reproduit ce réglage. Ce qui suit vérifie ce qu'il en reste après
-- la migration, droit par droit.
select pg_temp.attendu(
  (select count(*) from unnest(array['public.classes', 'public.pupils', 'public.sessions', 'public.worksheets',
                                     'public.problemes', 'public.assistant_usage',
                                     'public.demandes_administrateur']) t,
     unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) d
   where has_table_privilege('anon', t, d)), 0,
  'la clé publique ne donne aucun droit sur les tables');
select pg_temp.attendu(
  (select count(*) from unnest(array['public.classes', 'public.pupils', 'public.sessions', 'public.worksheets']) t,
     unnest(array['truncate', 'references', 'trigger']) d
   where has_table_privilege('authenticated', t, d)), 0,
  'une maîtresse ne peut pas vider une table en contournant la RLS');
select pg_temp.attendu(
  (select count(*) from unnest(array['public.cle_eleve(text, text)', 'public.pupils_calcule_cle()',
                                     'public.creer_classe(text, text)', 'public.lire_ma_classe()',
                                     'public.compter_demande_assistant()',
                                     'public.transmettre_a_l_administrateur(text, text)']) f
   where has_function_privilege('anon', f, 'execute')), 0,
  'la clé publique n''ouvre que le dépôt de séance et les problèmes de sa classe');
select pg_temp.attendu(
  (select count(*) from unnest(array['public.cle_eleve(text, text)', 'public.pupils_calcule_cle()']) f
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

\o
\echo 'OK : toutes les règles d''accès tiennent.'
