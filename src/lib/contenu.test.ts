import { afterEach, describe, expect, it } from 'vitest';
import { activitiesFor, CONTENT_FROM, hasContent, notionsFor } from './contenu';
import { buildSession, MIXED_SUBJECTS_ERROR } from './sessionBuilder';
import { buildWorksheet } from './worksheet';
import { candidateOperations, candidateQuestions } from './evaluation';
import { revisionDomains, type SessionResult } from './results';
import {
  ALL_DOMAINS,
  ALL_LEVELS,
  ALL_SUBJECTS,
  ALL_TRIMESTERS,
  AVAILABLE_LEVELS,
  SUBJECT_ACTIVITIES,
  SUBJECT_DOMAINS,
} from '../types';
import type { Level } from '../types';

/** Les niveaux dont les questions sont écrites. */
const WITH_CONTENT: Level[] = ['CM1', 'CM2'];
/** Les six autres : rien n'y est encore écrit. */
const WITHOUT_CONTENT = ALL_LEVELS.filter((level) => !WITH_CONTENT.includes(level));

describe('les notions qui ont des questions', () => {
  it('sont toutes ouvertes au CM1 et au CM2, à chaque trimestre', () => {
    WITH_CONTENT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_DOMAINS.forEach((domain) => expect(hasContent(domain, level, trimester), `${domain} ${level} T${trimester}`).toBe(true))
      )
    );
  });

  it('ne sont ouvertes à aucun des six autres niveaux', () => {
    expect(WITHOUT_CONTENT).toEqual(['CE1', 'CE2', '6e', '5e', '4e', '3e']);
    WITHOUT_CONTENT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_DOMAINS.forEach((domain) => expect(hasContent(domain, level, trimester), `${domain} ${level} T${trimester}`).toBe(false))
      )
    );
  });

  it('se retrouvent, dans l\'ordre de la matière, parmi celles qu\'on propose', () => {
    WITH_CONTENT.forEach((level) =>
      ALL_SUBJECTS.forEach((subject) => expect(notionsFor(subject, level, 2)).toEqual(SUBJECT_DOMAINS[subject]))
    );
  });

  it('ouvrent, au CM1 et au CM2, toutes les séances de chaque matière', () => {
    WITH_CONTENT.forEach((level) =>
      ALL_SUBJECTS.forEach((subject) => expect(activitiesFor(subject, level, 3)).toEqual(SUBJECT_ACTIVITIES[subject]))
    );
  });

  it('donnent bien des questions quand elles sont ouvertes', () => {
    // C'est ce qui empêche d'ouvrir un niveau avant que ses questions existent.
    ALL_LEVELS.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_DOMAINS.filter((domain) => hasContent(domain, level, trimester)).forEach((domain) => {
          const questions = buildSession({ domains: [domain], level, trimester, seed: 11, count: 4 }).questions;
          expect(questions, `${domain} ${level} T${trimester}`).toHaveLength(4);
          questions.forEach((question) => expect(question.domain).toBe(domain));
        })
      )
    );
  });

  it('couvrent chaque niveau que l\'application propose, à chaque trimestre', () => {
    expect(AVAILABLE_LEVELS.length).toBeGreaterThan(0);
    AVAILABLE_LEVELS.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        expect(
          ALL_SUBJECTS.some((subject) => notionsFor(subject, level, trimester).length > 0),
          `${level} T${trimester} n'a rien à proposer`
        ).toBe(true)
      )
    );
  });
});

describe('un niveau sans questions', () => {
  it('ne propose aucune notion : en 5e, rien n\'est à choisir', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      ALL_SUBJECTS.forEach((subject) => {
        expect(notionsFor(subject, '5e', trimester)).toEqual([]);
        expect(activitiesFor(subject, '5e', trimester)).toEqual([]);
      })
    );
  });

  it('ne fait planter aucune séance, et n\'en tire aucune question', () => {
    WITHOUT_CONTENT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_SUBJECTS.forEach((subject) => {
          const session = buildSession({ domains: [...SUBJECT_DOMAINS[subject]], level, trimester, seed: 7 });
          expect(session.questions, `${subject} ${level} T${trimester}`).toEqual([]);
          expect(session.domains).toEqual([]);
          expect(session.subject).toBe(subject);
        })
      )
    );
  });

  it('refuse toujours de mêler deux matières, même quand rien n\'a de questions', () => {
    expect(() => buildSession({ domains: ['conjugaison', 'calcul'], level: '5e', trimester: 1, seed: 1 })).toThrow(
      MIXED_SUBJECTS_ERROR
    );
    expect(() => buildSession({ domains: [], level: '5e', trimester: 1, seed: 1 })).toThrow();
  });

  it('ne fait planter ni les opérations posées, ni les évaluations de la maîtresse', () => {
    WITHOUT_CONTENT.forEach((level) => {
      expect(buildWorksheet({ name: 'Léa', level, trimester: 1, seed: 3 }).operations).toEqual([]);
      expect(candidateOperations(level, 2, 5, 4)).toEqual([]);
      ALL_DOMAINS.forEach((domain) => expect(candidateQuestions(domain, level, 2, 5, 4)).toEqual([]));
    });
  });

  it('ne laisse à la révision ciblée aucune notion à choisir', () => {
    expect(revisionDomains([], 'maths', 2, notionsFor('maths', '5e', 1))).toEqual([]);
    expect(revisionDomains([], 'maths', 2)).toEqual(SUBJECT_DOMAINS.maths);
  });
});

describe('un niveau couvert en partie', () => {
  const original = structuredClone(CONTENT_FROM);
  // Chaque essai défait ce qu'il a changé : la table est partagée.
  afterEach(() => ALL_DOMAINS.forEach((domain) => (CONTENT_FROM[domain] = structuredClone(original[domain]))));

  const weakCalcul = (id: string): SessionResult => ({
    id,
    pupil: { firstName: 'Léa', lastName: 'M' },
    at: '2026-10-02T09:00:00.000Z',
    level: 'CM1',
    trimester: 1,
    subject: 'maths',
    activity: 'questions',
    domains: [
      { domain: 'calcul', correct: 0, total: 10 },
      { domain: 'numeration', correct: 9, total: 10 },
      { domain: 'problemes', correct: 8, total: 10 },
      { domain: 'geometrie', correct: 10, total: 10 },
    ],
  });

  it('commence au trimestre indiqué, et continue ensuite', () => {
    CONTENT_FROM.problemes.CM1 = 2;
    expect(hasContent('problemes', 'CM1', 1)).toBe(false);
    expect(hasContent('problemes', 'CM1', 2)).toBe(true);
    expect(hasContent('problemes', 'CM1', 3)).toBe(true);
    expect(hasContent('problemes', 'CM2', 1)).toBe(true);
    expect(notionsFor('maths', 'CM1', 1)).toEqual(['numeration', 'calcul', 'geometrie']);
    expect(notionsFor('maths', 'CM1', 2)).toEqual(SUBJECT_DOMAINS.maths);
  });

  it('retire de la séance la notion sans questions, et garde le compte', () => {
    delete CONTENT_FROM.calcul.CM1;
    const session = buildSession({ domains: [...SUBJECT_DOMAINS.maths], level: 'CM1', trimester: 1, seed: 3 });
    expect(session.domains).toEqual(['numeration', 'problemes', 'geometrie']);
    expect(session.questions).toHaveLength(12);
    session.questions.forEach((question) => expect(question.domain).not.toBe('calcul'));
    // Le CM2 n'a rien perdu.
    expect(buildSession({ domains: [...SUBJECT_DOMAINS.maths], level: 'CM2', trimester: 1, seed: 3 }).domains).toEqual(
      SUBJECT_DOMAINS.maths
    );
  });

  it('ferme les tables et les opérations posées quand le calcul manque', () => {
    delete CONTENT_FROM.calcul.CM1;
    expect(notionsFor('maths', 'CM1', 1)).toEqual(['numeration', 'problemes', 'geometrie']);
    expect(activitiesFor('maths', 'CM1', 1)).toEqual(['questions', 'revision']);
    expect(activitiesFor('maths', 'CM2', 1)).toEqual(SUBJECT_ACTIVITIES.maths);
    // Le français n'a jamais proposé ni tables ni opérations posées.
    expect(activitiesFor('francais', 'CM1', 1)).toEqual(['questions', 'revision']);
  });

  it('ne laisse à la révision ciblée que les notions qui ont des questions', () => {
    const own = [weakCalcul('a')];
    expect(revisionDomains(own, 'maths', 2)).toEqual(['calcul', 'problemes']);
    delete CONTENT_FROM.calcul.CM1;
    const available = notionsFor('maths', 'CM1', 1);
    expect(revisionDomains(own, 'maths', 2, available)).toEqual(['problemes', 'numeration']);
  });

  it('retire aussi du choix une matière dont plus aucune notion n\'a de questions', () => {
    SUBJECT_DOMAINS.geographie.forEach((domain) => delete CONTENT_FROM[domain].CM1);
    expect(notionsFor('geographie', 'CM1', 1)).toEqual([]);
    expect(activitiesFor('geographie', 'CM1', 1)).toEqual([]);
    expect(notionsFor('geographie', 'CM2', 1)).toEqual(SUBJECT_DOMAINS.geographie);
  });
});
