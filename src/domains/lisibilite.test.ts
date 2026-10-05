import { describe, expect, it } from 'vitest';
import {
  ALL_LEVELS,
  CYCLE_OF_LEVEL,
  SUBJECT_DOMAINS,
  subjectOf,
  type Cycle,
  type Level,
  type Question,
  type Trimester,
} from '../types';
import { buildSession } from '../lib/sessionBuilder';

/**
 * Les questions sont lues par des enfants de 8 à 11 ans : des phrases
 * courtes, sans point-virgule, des réponses qu'on lit d'un coup d'œil. Ce test
 * passe en revue tout ce qu'un élève peut lire pendant une séance.
 *
 * Les seuils suivent l'âge du lecteur, donc le cycle du niveau pour lequel la
 * question est fabriquée (CYCLE_OF_LEVEL) :
 *  - cycle 2 (CE1, CE2), des enfants de 7 à 8 ans qui déchiffrent encore :
 *    plus strict, des phrases de douze mots au plus et des réponses de huit ;
 *  - cycle 3 (CM1, CM2, 6e) : les seuils d'origine, que rien ne change —
 *    vingt mots par phrase, dix-huit dans une explication, douze par réponse ;
 *  - cycle 4 (5e, 4e, 3e), des élèves de 12 à 15 ans : plus souple, des
 *    phrases plus longues sont permises.
 * Le point-virgule reste proscrit à tous les âges, et les parenthèses en
 * histoire et en géographie aussi.
 *
 * Seules les questions du CM1 et du CM2 sont écrites aujourd'hui : les seuils
 * du cycle 2 et du cycle 4 attendent leur contenu, et s'appliqueront d'eux-mêmes
 * dès qu'un niveau ouvre ses notions (src/lib/contenu.ts).
 */
interface Seuils {
  /** Mots d'une phrase de la consigne ou de l'énoncé. */
  phrase: number;
  /** Mots d'une phrase de l'explication. */
  explication: number;
  /** Mots d'une réponse proposée. */
  choix: number;
}

const SEUILS: Record<Cycle, Seuils> = {
  2: { phrase: 12, explication: 12, choix: 8 },
  3: { phrase: 20, explication: 18, choix: 12 },
  4: { phrase: 28, explication: 24, choix: 16 },
};

const seuilsOf = (level: Level) => SEUILS[CYCLE_OF_LEVEL[level]];

/** Une question, avec le niveau pour lequel elle a été fabriquée. */
interface QuestionDuNiveau {
  level: Level;
  question: Question;
}

const TRIMESTERS: Trimester[] = [1, 2, 3];

/** Les mots d'une phrase : les nombres comptent, les signes non. */
const wordsOf = (sentence: string) => sentence.split(/\s+/).filter((token) => /[\p{L}\d]/u.test(token));
/** Une phrase s'arrête au point, au point d'exclamation ou d'interrogation, et aux deux-points. */
const sentencesOf = (text: string) => text.split(/[.!?:…]+(?:\s|$)/).filter((part) => wordsOf(part).length > 0);

function everyQuestion(): QuestionDuNiveau[] {
  return Object.values(SUBJECT_DOMAINS).flatMap((domains) =>
    domains.flatMap((domain) =>
      ALL_LEVELS.flatMap((level) =>
        TRIMESTERS.flatMap((trimester) =>
          Array.from({ length: 12 }, (_, seed) =>
            buildSession({ domains: [domain], level, trimester, seed: (seed + 1) * 7919, classProblems: [] }).questions
          )
            .flat()
            .map((question) => ({ level, question }))
        )
      )
    )
  );
}

describe('les seuils de lisibilité', () => {
  it('gardent pour le cycle 3 ceux de l\'application depuis le début', () => {
    expect(SEUILS[3]).toEqual({ phrase: 20, explication: 18, choix: 12 });
    (['CM1', 'CM2'] as Level[]).forEach((level) => expect(seuilsOf(level)).toBe(SEUILS[3]));
  });

  it('sont plus stricts au cycle 2 et plus souples au cycle 4 que ceux du cycle 3', () => {
    (['phrase', 'explication', 'choix'] as const).forEach((seuil) => {
      expect(SEUILS[2][seuil], seuil).toBeLessThan(SEUILS[3][seuil]);
      expect(SEUILS[3][seuil], seuil).toBeLessThan(SEUILS[4][seuil]);
    });
  });

  it('s\'appliquent à une question selon le niveau pour lequel elle est fabriquée', () => {
    expect(ALL_LEVELS.map((level) => seuilsOf(level).phrase)).toEqual([12, 12, 20, 20, 20, 28, 28, 28]);
  });
});

describe('ce que lit l\'élève', () => {
  const questions = everyQuestion();

  it('passe en revue au moins le CM1 et le CM2', () => {
    // Sans cela, un niveau qui n'aurait plus aucune question passerait tous
    // les contrôles ci-dessous sans rien avoir été lu.
    const levels = new Set(questions.map((entry) => entry.level));
    expect(levels.has('CM1')).toBe(true);
    expect(levels.has('CM2')).toBe(true);
  });

  it('n\'a jamais de point-virgule', () => {
    questions.forEach(({ question: q }) =>
      [q.instruction ?? '', q.prompt, ...q.choices, q.explanation ?? ''].forEach((text) => expect(text, text).not.toContain(';'))
    );
  });

  it('fait des phrases courtes', () => {
    questions.forEach(({ level, question: q }) => {
      const seuils = seuilsOf(level);
      [q.instruction ?? '', q.prompt].flatMap(sentencesOf).forEach((sentence) =>
        expect(wordsOf(sentence).length, `${level} : ${sentence}`).toBeLessThanOrEqual(seuils.phrase)
      );
      sentencesOf(q.explanation ?? '').forEach((sentence) =>
        expect(wordsOf(sentence).length, `${level} : ${sentence}`).toBeLessThanOrEqual(seuils.explication)
      );
    });
  });

  it('propose des réponses qu\'on lit d\'un coup d\'œil', () => {
    questions.forEach(({ level, question: q }) =>
      q.choices.forEach((choice) => expect(wordsOf(choice).length, `${level} : ${choice}`).toBeLessThanOrEqual(seuilsOf(level).choix))
    );
  });

  it('n\'a pas de parenthèses en histoire et en géographie', () => {
    questions
      .filter(({ question: q }) => ['histoire', 'geographie'].includes(subjectOf(q.domain)))
      .forEach(({ question: q }) =>
        [q.instruction ?? '', q.prompt, ...q.choices, q.explanation ?? ''].forEach((text) => expect(text, text).not.toMatch(/[()]/))
      );
  });
});
