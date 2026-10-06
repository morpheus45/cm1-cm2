import { afterEach, describe, expect, it } from 'vitest';
import { activitiesFor, CONTENT_FROM, notionsFor } from './contenu';
import { ALL_DOMAINS, ALL_LEVELS, ALL_SUBJECTS, ALL_TRIMESTERS, CYCLE_OF_LEVEL, SUBJECT_ACTIVITIES, SUBJECT_DOMAINS } from '../types';
import type { Level } from '../types';

/**
 * Au collège — le cycle 4, de la 5e à la 3e —, l'élève ne récite plus ses
 * tables et ne pose plus ses opérations en colonnes : ces deux séances ne sont
 * proposées qu'à l'école primaire et en 6e. Les niveaux du collège ne sont pas
 * encore ouverts (`CONTENT_FROM` ne les connaît pas : c'est une décision de
 * Cédric) ; ces tests les ouvrent le temps d'un test, puis remettent la liste
 * comme elle était.
 */
const COLLEGE: Level[] = ['5e', '4e', '3e'];
const AVANT_LE_COLLEGE: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e'];

describe('les séances du collège', () => {
  const original = structuredClone(CONTENT_FROM);
  afterEach(() => ALL_DOMAINS.forEach((domain) => (CONTENT_FROM[domain] = structuredClone(original[domain]))));

  const ouvrirLeCollege = () =>
    [...SUBJECT_DOMAINS.francais, ...SUBJECT_DOMAINS.maths].forEach((domain) => COLLEGE.forEach((level) => (CONTENT_FROM[domain][level] = 1)));

  it('sont ce que dit le cycle : la 5e, la 4e et la 3e sont du cycle 4, les autres niveaux non', () => {
    COLLEGE.forEach((level) => expect(CYCLE_OF_LEVEL[level], level).toBe(4));
    AVANT_LE_COLLEGE.forEach((level) => expect(CYCLE_OF_LEVEL[level], level).not.toBe(4));
    expect(ALL_LEVELS).toEqual([...AVANT_LE_COLLEGE, ...COLLEGE]);
  });

  it('cachent les tables de multiplication et les opérations posées, tant que les maths y ont des questions', () => {
    // Avant l'ouverture : rien à proposer, comme avant.
    COLLEGE.forEach((level) => ALL_TRIMESTERS.forEach((trimester) => expect(activitiesFor('maths', level, trimester)).toEqual([])));
    ouvrirLeCollege();
    COLLEGE.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        // Le calcul a des questions, et pourtant : ni « posees » ni « tables ».
        expect(notionsFor('maths', level, trimester), `${level} T${trimester}`).toEqual(SUBJECT_DOMAINS.maths);
        expect(activitiesFor('maths', level, trimester), `${level} T${trimester}`).toEqual(['questions', 'revision']);
      })
    );
  });

  it('gardent au collège les séances de questions et de révision ciblée, dans toutes les matières ouvertes', () => {
    ouvrirLeCollege();
    COLLEGE.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        expect(activitiesFor('francais', level, trimester)).toEqual(SUBJECT_ACTIVITIES.francais);
        // L'histoire et la géographie n'y ont pas de questions : aucune séance.
        expect(activitiesFor('histoire', level, trimester)).toEqual([]);
        expect(activitiesFor('geographie', level, trimester)).toEqual([]);
      })
    );
  });

  it('ne retirent rien avant le collège : le CE1, le CE2, le CM1, le CM2 et la 6e gardent leurs tables et leurs opérations posées', () => {
    ouvrirLeCollege();
    AVANT_LE_COLLEGE.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        expect(activitiesFor('maths', level, trimester), `${level} T${trimester}`).toEqual(SUBJECT_ACTIVITIES.maths);
        expect(activitiesFor('maths', level, trimester)).toContain('posees');
        expect(activitiesFor('maths', level, trimester)).toContain('tables');
      })
    );
  });

  it('se laissent ouvrir niveau par niveau : la 5e ouverte seule ne change pas la 4e', () => {
    SUBJECT_DOMAINS.maths.forEach((domain) => (CONTENT_FROM[domain]['5e'] = 1));
    expect(activitiesFor('maths', '5e', 1)).toEqual(['questions', 'revision']);
    expect(activitiesFor('maths', '4e', 1)).toEqual([]);
    expect(activitiesFor('maths', '3e', 3)).toEqual([]);
  });

  it('ne gardent que les séances de la matière : aucune séance ne vient d\'une autre matière', () => {
    ouvrirLeCollege();
    ALL_SUBJECTS.forEach((subject) =>
      COLLEGE.forEach((level) =>
        activitiesFor(subject, level, 2).forEach((activity) => expect(SUBJECT_ACTIVITIES[subject], `${subject} ${level}`).toContain(activity))
      )
    );
  });
});
