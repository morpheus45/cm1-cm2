import { ALL_SUBJECTS, SUBJECT_ACTIVITIES, SUBJECT_DOMAINS } from '../types';
import type { Activity, Domain, Level, Subject, Trimester } from '../types';

/**
 * Les notions qui ont des questions, niveau par niveau.
 *
 * Pour chaque notion, le premier trimestre où ses questions commencent, par
 * niveau. Un niveau absent de la liste n'a encore aucune question pour cette
 * notion : elle n'est alors ni proposée à l'élève, ni piochée par une séance,
 * ni offerte à la maîtresse pour une évaluation. L'application ne plante pas
 * pour autant : elle fait comme si la notion n'existait pas à ce niveau.
 *
 * Aujourd'hui, le CE1, le CE2, le CM1, le CM2 et la 6e, dès le 1er trimestre,
 * en français (conjugaison, accords, orthographe) et en maths (numération,
 * calcul, problèmes, géométrie). L'histoire et la géographie n'ont de
 * questions qu'au CM1 et au CM2 : elles disparaissent, pour les autres
 * niveaux, des choix de l'élève et de ceux de la maîtresse. Écrire les
 * questions d'un niveau ne suffit pas : c'est ici qu'on l'ouvre, notion par
 * notion (le test src/lib/contenu.test.ts vérifie qu'une notion ouverte donne
 * bien des questions). Ouvrir un niveau à l'élève et à la maîtresse est une
 * autre décision : `AVAILABLE_LEVELS`, dans src/types.ts.
 */
export const CONTENT_FROM: Record<Domain, Partial<Record<Level, Trimester>>> = {
  conjugaison: { CE1: 1, CE2: 1, CM1: 1, CM2: 1, '6e': 1 },
  accords: { CE1: 1, CE2: 1, CM1: 1, CM2: 1, '6e': 1 },
  orthographe: { CE1: 1, CE2: 1, CM1: 1, CM2: 1, '6e': 1 },
  numeration: { CE1: 1, CE2: 1, CM1: 1, CM2: 1, '6e': 1 },
  calcul: { CE1: 1, CE2: 1, CM1: 1, CM2: 1, '6e': 1 },
  problemes: { CE1: 1, CE2: 1, CM1: 1, CM2: 1, '6e': 1 },
  geometrie: { CE1: 1, CE2: 1, CM1: 1, CM2: 1, '6e': 1 },
  chronologie: { CM1: 1, CM2: 1 },
  evenements: { CM1: 1, CM2: 1 },
  'mots-histoire': { CM1: 1, CM2: 1 },
  cartes: { CM1: 1, CM2: 1 },
  habiter: { CM1: 1, CM2: 1 },
  'mots-geographie': { CM1: 1, CM2: 1 },
};

/** La notion a-t-elle des questions pour ce niveau, à ce trimestre ? */
export function hasContent(domain: Domain, level: Level, trimester: Trimester): boolean {
  const from = CONTENT_FROM[domain][level];
  return from !== undefined && from <= trimester;
}

/** Les notions d'une matière qui ont des questions, dans l'ordre de la
 *  matière. Vide quand le niveau n'a rien à proposer dans cette matière. */
export function notionsFor(subject: Subject, level: Level, trimester: Trimester): Domain[] {
  return SUBJECT_DOMAINS[subject].filter((domain) => hasContent(domain, level, trimester));
}

/**
 * Les matières qui ont au moins une notion avec des questions pour ce niveau,
 * à ce trimestre, dans l'ordre habituel. Les autres — l'histoire et la
 * géographie, au CE1, au CE2 et en 6e — ne sont proposées ni à l'élève ni à la
 * maîtresse : ni carte vide, ni bouton qui ne mène à rien.
 */
export function subjectsFor(level: Level, trimester: Trimester): Subject[] {
  return ALL_SUBJECTS.filter((subject) => notionsFor(subject, level, trimester).length > 0);
}

/** Les séances qui exigent des questions de calcul : poser une opération, ou
 *  réciter ses tables, c'est du calcul. */
const NEEDS_CALCUL: Activity[] = ['posees', 'tables'];

/**
 * Les types de séance qu'on peut proposer à l'élève : ceux de la matière, moins
 * ceux dont le contenu manque à ce niveau. Aucun quand la matière n'a pas une
 * seule notion à proposer.
 */
export function activitiesFor(subject: Subject, level: Level, trimester: Trimester): Activity[] {
  if (notionsFor(subject, level, trimester).length === 0) return [];
  const calcul = hasContent('calcul', level, trimester);
  return SUBJECT_ACTIVITIES[subject].filter((activity) => calcul || !NEEDS_CALCUL.includes(activity));
}
