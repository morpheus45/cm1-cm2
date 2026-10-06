import { afterEach, describe, expect, it } from 'vitest';
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

/** Les niveaux dont les questions sont écrites : du CE1 à la 6e. */
const WITH_CONTENT: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e'];
/** Les trois autres, au collège : rien n'y est encore écrit. */
const WITHOUT_CONTENT = ALL_LEVELS.filter((level) => !WITH_CONTENT.includes(level));
/** Le CM1 et le CM2 ont leurs quatre matières. */
const WITH_EVERY_SUBJECT: Level[] = ['CM1', 'CM2'];
/** Le CE1, le CE2 et la 6e n'ont que le français et les maths : leur histoire
 *  et leur géographie ne sont pas écrites. */
const FRENCH_AND_MATHS_ONLY = WITH_CONTENT.filter((level) => !WITH_EVERY_SUBJECT.includes(level));
const SUBJECTS_WRITTEN: Subject[] = ['francais', 'maths'];
const SUBJECTS_NOT_WRITTEN: Subject[] = ['histoire', 'geographie'];
const NOTIONS_WRITTEN: Domain[] = SUBJECTS_WRITTEN.flatMap((subject) => SUBJECT_DOMAINS[subject]);
const NOTIONS_NOT_WRITTEN: Domain[] = SUBJECTS_NOT_WRITTEN.flatMap((subject) => SUBJECT_DOMAINS[subject]);

describe('les notions qui ont des questions', () => {
  it('sont toutes ouvertes au CM1 et au CM2, à chaque trimestre', () => {
    WITH_EVERY_SUBJECT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_DOMAINS.forEach((domain) => expect(hasContent(domain, level, trimester), `${domain} ${level} T${trimester}`).toBe(true))
      )
    );
  });

  it('sont, au CE1, au CE2 et en 6e, celles du français et des maths, dès le 1er trimestre', () => {
    expect(FRENCH_AND_MATHS_ONLY).toEqual(['CE1', 'CE2', '6e']);
    expect(NOTIONS_WRITTEN).toEqual([
      'conjugaison',
      'accords',
      'orthographe',
      'numeration',
      'calcul',
      'problemes',
      'geometrie',
    ]);
    FRENCH_AND_MATHS_ONLY.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        NOTIONS_WRITTEN.forEach((domain) => expect(hasContent(domain, level, trimester), `${domain} ${level} T${trimester}`).toBe(true))
      )
    );
  });

  it('ne sont pas, au CE1, au CE2 et en 6e, celles de l\'histoire et de la géographie', () => {
    expect(NOTIONS_NOT_WRITTEN).toHaveLength(6);
    FRENCH_AND_MATHS_ONLY.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        NOTIONS_NOT_WRITTEN.forEach((domain) => expect(hasContent(domain, level, trimester), `${domain} ${level} T${trimester}`).toBe(false))
      )
    );
  });

  it('ne sont ouvertes à aucun des trois niveaux du collège qui restent', () => {
    expect(WITHOUT_CONTENT).toEqual(['5e', '4e', '3e']);
    WITHOUT_CONTENT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        ALL_DOMAINS.forEach((domain) => expect(hasContent(domain, level, trimester), `${domain} ${level} T${trimester}`).toBe(false))
      )
    );
  });

  it('se retrouvent, dans l\'ordre de la matière, parmi celles qu\'on propose', () => {
    WITH_EVERY_SUBJECT.forEach((level) =>
      ALL_SUBJECTS.forEach((subject) => expect(notionsFor(subject, level, 2)).toEqual(SUBJECT_DOMAINS[subject]))
    );
    FRENCH_AND_MATHS_ONLY.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        SUBJECTS_WRITTEN.forEach((subject) =>
          expect(notionsFor(subject, level, trimester), `${subject} ${level} T${trimester}`).toEqual(SUBJECT_DOMAINS[subject])
        );
        SUBJECTS_NOT_WRITTEN.forEach((subject) =>
          expect(notionsFor(subject, level, trimester), `${subject} ${level} T${trimester}`).toEqual([])
        );
      });
    });
  });

  it('ouvrent, au CM1 et au CM2, toutes les séances de chaque matière', () => {
    WITH_EVERY_SUBJECT.forEach((level) =>
      ALL_SUBJECTS.forEach((subject) => expect(activitiesFor(subject, level, 3)).toEqual(SUBJECT_ACTIVITIES[subject]))
    );
  });

  it('ouvrent, au CE1, au CE2 et en 6e, toutes les séances du français et des maths, et aucune de l\'histoire ni de la géographie', () => {
    FRENCH_AND_MATHS_ONLY.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        SUBJECTS_WRITTEN.forEach((subject) =>
          expect(activitiesFor(subject, level, trimester), `${subject} ${level} T${trimester}`).toEqual(SUBJECT_ACTIVITIES[subject])
        );
        SUBJECTS_NOT_WRITTEN.forEach((subject) =>
          expect(activitiesFor(subject, level, trimester), `${subject} ${level} T${trimester}`).toEqual([])
        );
      })
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
        ALL_SUBJECTS.filter((subject) => notionsFor(subject, level, trimester).length > 0).forEach((subject) => {
          const session = buildSession({ domains: [...SUBJECT_DOMAINS[subject]], level, trimester, seed: 5 });
          expect(session.subject).toBe(subject);
          expect(session.domains, `${subject} ${level} T${trimester}`).toEqual(SUBJECT_DOMAINS[subject]);
          expect(session.questions, `${subject} ${level} T${trimester}`).toHaveLength(12);
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

  it('ouvrent exactement les niveaux que l\'application propose', () => {
    // Un niveau proposé sans question, ou des questions sans niveau proposé :
    // dans les deux cas l'un des deux fichiers (src/types.ts, src/lib/contenu.ts) est resté en arrière.
    expect(WITH_CONTENT).toEqual(AVAILABLE_LEVELS);
    ALL_LEVELS.forEach((level) =>
      expect(
        ALL_DOMAINS.some((domain) => hasContent(domain, level, 1)),
        level
      ).toBe(AVAILABLE_LEVELS.includes(level))
    );
  });
});

describe('les matières qu\'on propose', () => {
  it('sont les quatre, au CM1 et au CM2', () => {
    WITH_EVERY_SUBJECT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => expect(subjectsFor(level, trimester), `${level} T${trimester}`).toEqual(ALL_SUBJECTS))
    );
  });

  it('sont le français et les maths, au CE1, au CE2 et en 6e : ni histoire ni géographie', () => {
    FRENCH_AND_MATHS_ONLY.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => expect(subjectsFor(level, trimester), `${level} T${trimester}`).toEqual(SUBJECTS_WRITTEN))
    );
  });

  it('ne sont aucune, dans les trois niveaux du collège qui restent', () => {
    WITHOUT_CONTENT.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => expect(subjectsFor(level, trimester), `${level} T${trimester}`).toEqual([]))
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
  it('ne fait planter aucune séance d\'histoire ni de géographie, et n\'en tire aucune question', () => {
    FRENCH_AND_MATHS_ONLY.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        SUBJECTS_NOT_WRITTEN.forEach((subject) => {
          const session = buildSession({ domains: [...SUBJECT_DOMAINS[subject]], level, trimester, seed: 7 });
          expect(session.questions, `${subject} ${level} T${trimester}`).toEqual([]);
          expect(session.domains).toEqual([]);
          expect(session.subject).toBe(subject);
        })
      )
    );
  });

  it('n\'offre à la maîtresse aucune question d\'histoire ni de géographie pour ses évaluations', () => {
    FRENCH_AND_MATHS_ONLY.forEach((level) =>
      NOTIONS_NOT_WRITTEN.forEach((domain) => expect(candidateQuestions(domain, level, 2, 5, 4), `${domain} ${level}`).toEqual([]))
    );
  });

  it('offre en revanche, à la maîtresse, des questions de chaque notion du français et des maths', () => {
    FRENCH_AND_MATHS_ONLY.forEach((level) =>
      NOTIONS_WRITTEN.forEach((domain) => {
        const questions = candidateQuestions(domain, level, 2, 5, 4);
        expect(questions, `${domain} ${level}`).toHaveLength(4);
        questions.forEach((question) => expect(question.domain).toBe(domain));
      })
    );
  });

  it('laisse l\'histoire et la géographie au CM1 et au CM2, qui n\'ont rien perdu', () => {
    WITH_EVERY_SUBJECT.forEach((level) =>
      NOTIONS_NOT_WRITTEN.forEach((domain) => expect(candidateQuestions(domain, level, 2, 5, 4), `${domain} ${level}`).toHaveLength(4))
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
    expect(subjectsFor('CM1', 1)).toEqual(['francais', 'maths', 'histoire']);
    expect(subjectsFor('CM2', 1)).toEqual(ALL_SUBJECTS);
    expect(notionsFor('geographie', 'CM1', 1)).toEqual([]);
    expect(activitiesFor('geographie', 'CM1', 1)).toEqual([]);
    expect(notionsFor('geographie', 'CM2', 1)).toEqual(SUBJECT_DOMAINS.geographie);
  });
});
