import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { activitiesFor, CONTENT_FROM, hasContent, notionsFor, subjectsFor } from './contenu';
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
import type { Domain, Level, Subject } from '../types';

/** Les huit niveaux ont des questions, dans les sept matières. */
const WITH_CONTENT: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'];
const COLLEGE: Level[] = ['5e', '4e', '3e'];
const PRIMAIRE_ET_SIXIEME: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e'];
const HISTOIRE_GEO: Subject[] = ['histoire', 'geographie'];
const NOTIONS_HISTOIRE_GEO: Domain[] = HISTOIRE_GEO.flatMap((subject) => SUBJECT_DOMAINS[subject]);

describe('les notions qui ont des questions', () => {
  it('sont toutes ouvertes à chaque niveau, dès le 1er trimestre', () => {
    WITH_CONTENT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_DOMAINS.forEach((domain) => expect(hasContent(domain, level, trimester), `${domain} ${level} T${trimester}`).toBe(true))
      )
    );
  });

  it('se retrouvent, dans l\'ordre de la matière, parmi celles qu\'on propose', () => {
    WITH_CONTENT.forEach((level) =>
      ALL_SUBJECTS.forEach((subject) => expect(notionsFor(subject, level, 2), `${subject} ${level}`).toEqual(SUBJECT_DOMAINS[subject]))
    );
  });

  it('ouvrent toutes les séances de chaque matière, sauf les tables et les opérations posées au collège', () => {
    PRIMAIRE_ET_SIXIEME.forEach((level) =>
      ALL_SUBJECTS.forEach((subject) => expect(activitiesFor(subject, level, 3), `${subject} ${level}`).toEqual(SUBJECT_ACTIVITIES[subject]))
    );
    COLLEGE.forEach((level) =>
      ALL_SUBJECTS.forEach((subject) =>
        expect(activitiesFor(subject, level, 3), `${subject} ${level}`).toEqual(
          SUBJECT_ACTIVITIES[subject].filter((activity) => activity !== 'posees' && activity !== 'tables')
        )
      )
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

  it('donnent, ouvertes, une séance entière par matière : douze questions, dans l\'ordre de la matière', () => {
    WITH_CONTENT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_SUBJECTS.forEach((subject) => {
          const session = buildSession({ domains: [...SUBJECT_DOMAINS[subject]], level, trimester, seed: 5 });
          expect(session.subject).toBe(subject);
          expect(session.domains, `${subject} ${level} T${trimester}`).toEqual(SUBJECT_DOMAINS[subject]);
          expect(session.questions, `${subject} ${level} T${trimester}`).toHaveLength(12);
        })
      )
    );
  });

  it('ouvrent exactement les niveaux que l\'application propose', () => {
    // Un niveau proposé sans question, ou des questions sans niveau proposé :
    // dans les deux cas l'un des deux fichiers (src/types.ts, src/lib/contenu.ts) est resté en arrière.
    expect(WITH_CONTENT).toEqual(AVAILABLE_LEVELS);
    ALL_LEVELS.forEach((level) =>
      expect(ALL_DOMAINS.some((domain) => hasContent(domain, level, 1)), level).toBe(AVAILABLE_LEVELS.includes(level))
    );
  });
});

describe('les matières qu\'on propose', () => {
  it('sont les sept, à chaque niveau et à chaque trimestre', () => {
    WITH_CONTENT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => expect(subjectsFor(level, trimester), `${level} T${trimester}`).toEqual(ALL_SUBJECTS))
    );
  });

  it('sont exactement celles qui ont une séance à proposer', () => {
    ALL_LEVELS.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_SUBJECTS.forEach((subject) =>
          expect(subjectsFor(level, trimester).includes(subject), `${subject} ${level} T${trimester}`).toBe(
            activitiesFor(subject, level, trimester).length > 0
          )
        )
      )
    );
  });
});

describe('une matière sans questions à un niveau ouvert', () => {
  // Toutes les matières sont écrites : on retire l'histoire et la géographie du CE1 le temps de chaque essai,
  // pour vérifier que l'application tient toujours debout dans ce cas.
  const original = structuredClone(CONTENT_FROM);
  beforeEach(() => NOTIONS_HISTOIRE_GEO.forEach((domain) => delete CONTENT_FROM[domain].CE1));
  afterEach(() => ALL_DOMAINS.forEach((domain) => (CONTENT_FROM[domain] = structuredClone(original[domain]))));

  it('disparaît du choix, sans emporter les autres', () => {
    expect(subjectsFor('CE1', 1)).toEqual(ALL_SUBJECTS.filter((subject) => !HISTOIRE_GEO.includes(subject)));
    expect(subjectsFor('CE2', 1)).toEqual(ALL_SUBJECTS);
  });

  it('ne fait planter aucune séance, et n\'en tire aucune question', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      HISTOIRE_GEO.forEach((subject) => {
        const session = buildSession({ domains: [...SUBJECT_DOMAINS[subject]], level: 'CE1', trimester, seed: 7 });
        expect(session.questions, `${subject} CE1 T${trimester}`).toEqual([]);
        expect(session.domains).toEqual([]);
        expect(session.subject).toBe(subject);
      })
    );
  });

  it('n\'offre à la maîtresse aucune question de cette matière pour ses évaluations, et laisse les autres niveaux intacts', () => {
    NOTIONS_HISTOIRE_GEO.forEach((domain) => {
      expect(candidateQuestions(domain, 'CE1', 2, 5, 4), `${domain} CE1`).toEqual([]);
      expect(candidateQuestions(domain, 'CE2', 2, 5, 4), `${domain} CE2`).toHaveLength(4);
    });
  });
});

describe('un niveau sans questions', () => {
  // Plus aucun niveau n'est vide : on vide la 5e le temps de chaque essai,
  // pour vérifier que l'application tient toujours debout dans ce cas.
  const WITHOUT_CONTENT: Level[] = ['5e'];
  const original = structuredClone(CONTENT_FROM);
  beforeEach(() => ALL_DOMAINS.forEach((domain) => delete CONTENT_FROM[domain]['5e']));
  afterEach(() => ALL_DOMAINS.forEach((domain) => (CONTENT_FROM[domain] = structuredClone(original[domain]))));

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
    expect(subjectsFor('CM1', 1)).toEqual(['francais', 'maths', 'histoire', 'anglais', 'sciences', 'emc']);
    expect(subjectsFor('CM2', 1)).toEqual(ALL_SUBJECTS);
    expect(notionsFor('geographie', 'CM1', 1)).toEqual([]);
    expect(activitiesFor('geographie', 'CM1', 1)).toEqual([]);
    expect(notionsFor('geographie', 'CM2', 1)).toEqual(SUBJECT_DOMAINS.geographie);
  });
});
