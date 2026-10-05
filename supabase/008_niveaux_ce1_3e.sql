-- Les huit niveaux : du CE1 à la 3e, et plus seulement le CM1 et le CM2.
--
-- À exécuter après 001_classes_eleves_seances.sql, dans l'éditeur SQL du
-- projet Supabase. Rejouable : on le relance sans rien perdre.
--
-- La base n'acceptait que deux niveaux, à deux endroits : la classe d'une
-- maîtresse (`classes`) et chaque séance d'un élève (`sessions`). Une classe
-- de 6e n'aurait pas pu être créée, et la séance d'un élève de CE1 aurait été
-- refusée, puis serait restée en attente sur sa tablette. On élargit les deux
-- listes ; rien d'autre ne change. Aucune donnée n'est touchée, et aucune
-- fonction n'est à réécrire : aucune ne vérifie le niveau elle-même, c'est la
-- contrainte de la table qui s'en charge.
--
-- Chaque contrainte porte le nom que PostgreSQL lui a donné quand
-- 001_classes_eleves_seances.sql a créé la table : <table>_<colonne>_check.
-- Elles sont supprimées puis reposées, parce que « create table if not
-- exists » ne touche pas une table qui existe déjà : sans cela, une base
-- créée avant ce fichier garderait l'ancienne liste.

alter table public.classes drop constraint if exists classes_level_check;
alter table public.classes
  add constraint classes_level_check
  check (level in ('CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'));

alter table public.sessions drop constraint if exists sessions_level_check;
alter table public.sessions
  add constraint sessions_level_check
  check (level in ('CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'));
