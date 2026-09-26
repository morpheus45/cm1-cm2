-- L'histoire et la géographie rejoignent le français et les maths.
--
-- À exécuter après 001_classes_eleves_seances.sql, dans l'éditeur SQL du
-- projet Supabase. Rejouable : on le relance sans rien perdre.
--
-- La base n'acceptait que deux matières : une séance d'histoire ou de
-- géographie envoyée par un élève aurait été refusée, et serait restée en
-- attente sur sa tablette. On élargit la liste ; rien d'autre ne change.

alter table public.sessions drop constraint if exists sessions_subject_check;
alter table public.sessions
  add constraint sessions_subject_check
  check (subject in ('francais', 'maths', 'histoire', 'geographie'));
