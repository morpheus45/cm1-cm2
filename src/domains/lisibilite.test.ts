import { describe, expect, it } from 'vitest';
import { SUBJECT_DOMAINS, subjectOf, type Level, type Trimester } from '../types';
import { buildSession } from '../lib/sessionBuilder';

/**
 * Les questions sont lues par des enfants de 8 à 11 ans : des phrases
 * courtes, sans point-virgule, des réponses qu'on lit d'un coup d'œil. Ce test
 * passe en revue tout ce qu'un élève peut lire pendant une séance.
 */
const LEVELS: Level[] = ['CM1', 'CM2'];
const TRIMESTERS: Trimester[] = [1, 2, 3];

/** Les mots d'une phrase : les nombres comptent, les signes non. */
const wordsOf = (sentence: string) => sentence.split(/\s+/).filter((token) => /[\p{L}\d]/u.test(token));
/** Une phrase s'arrête au point, au point d'exclamation ou d'interrogation, et aux deux-points. */
const sentencesOf = (text: string) => text.split(/[.!?:…]+(?:\s|$)/).filter((part) => wordsOf(part).length > 0);

function everyQuestion() {
  return Object.values(SUBJECT_DOMAINS).flatMap((domains) =>
    domains.flatMap((domain) =>
      LEVELS.flatMap((level) =>
        TRIMESTERS.flatMap((trimester) =>
          Array.from({ length: 12 }, (_, seed) =>
            buildSession({ domains: [domain], level, trimester, seed: (seed + 1) * 7919, classProblems: [] }).questions
          ).flat()
        )
      )
    )
  );
}

describe('ce que lit l\'élève', () => {
  const questions = everyQuestion();

  it('n\'a jamais de point-virgule', () => {
    questions.forEach((q) =>
      [q.instruction ?? '', q.prompt, ...q.choices, q.explanation ?? ''].forEach((text) => expect(text, text).not.toContain(';'))
    );
  });

  it('fait des phrases courtes', () => {
    questions.forEach((q) => {
      [q.instruction ?? '', q.prompt].flatMap(sentencesOf).forEach((sentence) =>
        expect(wordsOf(sentence).length, sentence).toBeLessThanOrEqual(20)
      );
      sentencesOf(q.explanation ?? '').forEach((sentence) => expect(wordsOf(sentence).length, sentence).toBeLessThanOrEqual(18));
    });
  });

  it('propose des réponses qu\'on lit d\'un coup d\'œil', () => {
    questions.forEach((q) => q.choices.forEach((choice) => expect(wordsOf(choice).length, choice).toBeLessThanOrEqual(12)));
  });

  it('n\'a pas de parenthèses en histoire et en géographie', () => {
    questions
      .filter((q) => ['histoire', 'geographie'].includes(subjectOf(q.domain)))
      .forEach((q) =>
        [q.instruction ?? '', q.prompt, ...q.choices, q.explanation ?? ''].forEach((text) => expect(text, text).not.toMatch(/[()]/))
      );
  });
});
