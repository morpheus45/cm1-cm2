-- L'anglais, les sciences et l'EMC rejoignent les quatre premières matières.
--
-- À exécuter après 008_niveaux_ce1_3e.sql, dans l'éditeur SQL du projet
-- Supabase. Rejouable : on le relance sans rien perdre.
--
-- Sans ce fichier, une séance d'anglais, de sciences ou d'EMC envoyée par un
-- élève serait refusée et resterait en attente sur sa tablette, une
-- évaluation dans ces matières ne pourrait pas être créée, et la maîtresse ne
-- pourrait pas y ajouter ses propres questions. On élargit les trois listes ;
-- aucune donnée n'est touchée.

alter table public.sessions drop constraint if exists sessions_subject_check;
alter table public.sessions
  add constraint sessions_subject_check
  check (subject in ('francais', 'maths', 'histoire', 'geographie', 'anglais', 'sciences', 'emc'));

alter table public.evaluations drop constraint if exists evaluations_subject_check;
alter table public.evaluations
  add constraint evaluations_subject_check
  check (subject in ('francais', 'maths', 'histoire', 'geographie', 'anglais', 'sciences', 'emc'));

-- Toutes les notions de l'application, sauf les problèmes de maths.
alter table public.questions_classe drop constraint if exists questions_classe_domain_check;
alter table public.questions_classe
  add constraint questions_classe_domain_check
  check (domain in (
    'conjugaison', 'accords', 'orthographe',
    'numeration', 'calcul', 'geometrie',
    'chronologie', 'evenements', 'mots-histoire',
    'cartes', 'habiter', 'mots-geographie',
    'anglais-mots', 'anglais-phrases',
    'sciences-vivant', 'sciences-matiere',
    'emc-vivre-ensemble', 'emc-republique'
  ));
