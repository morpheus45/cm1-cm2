import { forgetClassProblems, forgetOutbox } from './cloud';
import { forgetPreferences } from './preferences';
import { forgetEvaluations } from './pupilEvaluations';
import { loadStoredCorrections, saveStoredCorrections } from './pupilCorrections';
import { loadResults, saveResults, schoolYearOf } from './results';
import { forgetStars } from './stars';

/**
 * Ce que la tablette garde, et combien de temps : une année scolaire.
 *
 * À chaque lancement, les séances et les feuilles corrigées d'une année
 * scolaire passée sont effacées. À la première ouverture après le
 * 1er septembre, la tablette repart à zéro : le prénom de l'élève, son code
 * de classe, les envois qui attendaient, les évaluations, les étoiles. La base de la classe
 * applique la même règle (supabase/005_conservation_une_annee.sql).
 */
export const SCHOOL_YEAR_KEY = 'exercices-cm1-cm2:annee-scolaire';

/** Chaque donnée gardée sur la tablette, et ce qu'elle devient à la rentrée.
 *  Un test vérifie qu'aucune n'a été oubliée. */
export const LOCAL_DATA: Record<string, string> = {
  'exercices-cm1-cm2:resultats': 'les séances : seules celles de l\'année scolaire en cours restent',
  'exercices-cm1-cm2:feuilles-corrigees': 'les feuilles corrigées : seules celles de l\'année en cours restent',
  'exercices-cm1-cm2:envois-en-attente': 'les séances pas encore envoyées : effacées à la rentrée',
  'exercices-cm1-cm2:preferences': 'le prénom, l\'initiale, le code de classe et les réglages : effacés à la rentrée',
  'exercices-cm1-cm2:problemes-de-la-classe': 'les problèmes de la maîtresse : effacés à la rentrée',
  'exercices-cm1-cm2:evaluations-ouvertes': 'les évaluations ouvertes par la maîtresse : effacées à la rentrée',
  'exercices-cm1-cm2:copies-en-attente': 'les copies d\'évaluation pas encore envoyées : effacées à la rentrée',
  'exercices-cm1-cm2:evaluations-en-cours': 'où en est chaque élève dans une évaluation ouverte : effacé à la rentrée, et dès qu\'elle est terminée',
  'exercices-cm1-cm2:stars': 'les étoiles : remises à zéro à la rentrée',
  'exercices-cm1-cm2:classe-choisie': 'la dernière classe ouverte par la maîtresse : gardée, aucune donnée d\'élève',
  [SCHOOL_YEAR_KEY]: 'l\'année scolaire du dernier lancement',
};

/** Ce qui date de l'année scolaire `year`, ou d'après. */
export function fromSchoolYear<T extends { at: string }>(entries: T[], year: number): T[] {
  return entries.filter((entry) => schoolYearOf(entry.at) >= year);
}

/** Applique la règle ; rend vrai à la première ouverture d'une nouvelle
 *  année scolaire. */
export function applyRetention(now: Date = new Date()): boolean {
  const year = schoolYearOf(now.toISOString());

  const sessions = loadResults();
  const keptSessions = fromSchoolYear(sessions, year);
  if (keptSessions.length !== sessions.length) saveResults(keptSessions);

  const corrections = loadStoredCorrections();
  const keptCorrections = fromSchoolYear(corrections, year);
  if (keptCorrections.length !== corrections.length) saveStoredCorrections(keptCorrections);

  let previous: number | null = null;
  try {
    const raw = localStorage.getItem(SCHOOL_YEAR_KEY);
    previous = raw !== null && Number.isFinite(Number(raw)) ? Number(raw) : null;
  } catch {
    // Stockage refusé : il n'y a rien à effacer non plus.
  }
  // Sans année enregistrée — tout premier lancement, ou version précédente
  // de l'application —, on ne sait pas de quand datent les réglages : seules
  // les données datées sont triées.
  const newYear = previous !== null && previous < year;
  if (newYear) {
    forgetOutbox();
    forgetClassProblems();
    forgetEvaluations();
    forgetPreferences();
    forgetStars();
  }
  try {
    localStorage.setItem(SCHOOL_YEAR_KEY, String(year));
  } catch {
    // Stockage refusé : la règle s'appliquera au prochain lancement.
  }
  return newYear;
}
