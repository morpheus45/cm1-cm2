import { SUBJECT_ACTIVITIES, SUBJECT_DOMAINS } from '../types';
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
 * Aujourd'hui, le CM1 et le CM2 seulement, dès le 1er trimestre. Écrire les
 * questions d'un niveau ne suffit pas : c'est ici qu'on l'ouvre, notion par
 * notion (le test src/lib/contenu.test.ts vérifie qu'une notion ouverte donne
 * bien des questions). Ouvrir un niveau à l'élève et à la maîtresse est une
 * autre décision : `AVAILABLE_LEVELS`, dans src/types.ts.
 */
export const CONTENT_FROM: Record<Domain, Partial<Record<Level, Trimester>>> = {
  conjugaison: { CM1: 1, CM2: 1 },
  accords: { CM1: 1, CM2: 1 },
  orthographe: { CM1: 1, CM2: 1 },
  numeration: { CM1: 1, CM2: 1 },
  calcul: { CM1: 1, CM2: 1 },
  problemes: { CM1: 1, CM2: 1 },
  geometrie: { CM1: 1, CM2: 1 },
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
