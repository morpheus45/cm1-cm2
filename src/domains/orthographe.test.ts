import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './orthographe';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';

const LEVELS: Level[] = ['CM1', 'CM2'];

/** Mots attendus à chaque étape, familles cumulées. */
const ALLOWED_WORDS: Record<string, string[]> = {
  'CM1-1': ['a', 'à', 'et', 'est'],
  'CM1-2': ['a', 'à', 'et', 'est', 'on', 'ont'],
  'CM1-3': ['a', 'à', 'et', 'est', 'on', 'ont', 'ce', 'se'],
  'CM2-1': ['a', 'à', 'et', 'est', 'on', 'ont', 'ce', 'se', 'son', 'sont'],
  'CM2-2': ['a', 'à', 'et', 'est', 'on', 'ont', 'ce', 'se', 'son', 'sont', 'ces', 'ses', 'ou', 'où'],
  'CM2-3': [
    'a', 'à', 'et', 'est', 'on', 'ont', 'ce', 'se', 'son', 'sont',
    'ces', 'ses', 'ou', 'où', "c'est", "s'est",
  ],
};

describe('orthographe generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', 1, createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', 3, createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "orthographe" and 4 unique choices', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(3), 12).forEach((q) => {
          expect(q.domain).toBe('orthographe');
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices).size).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(4);
        });
      });
    });
  });

  it('is reproducible for the same seed, level and trimester', () => {
    expect(generate('CM1', 3, createRng(21), 8)).toEqual(generate('CM1', 3, createRng(21), 8));
  });

  it('only uses homophone families already taught, answers and distractors alike', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        const allowed = ALLOWED_WORDS[`${level}-${trimester}`];
        generate(level, trimester, createRng(8), 40)
          .filter((q) => q.id.startsWith('orthographe-homophone'))
          .forEach((q) => {
            q.choices.forEach((choice) => expect(allowed).toContain(choice.toLowerCase()));
          });
      });
    });
  });

  it('introduces synonyms only at the very end of CM2', () => {
    const hasSynonym = (level: Level, trimester: Trimester) =>
      generate(level, trimester, createRng(6), 12).some((q) => q.id.startsWith('orthographe-synonyme'));
    expect(hasSynonym('CM1', 3)).toBe(false);
    expect(hasSynonym('CM2', 2)).toBe(false);
    expect(hasSynonym('CM2', 3)).toBe(true);
  });

  it('keeps a uniform capitalisation so the answer is not given away', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(15), 30)
          .filter((q) => q.id.startsWith('orthographe-homophone'))
          .forEach((q) => {
            const capitalised = q.choices.filter((c) => c[0] === c[0].toUpperCase());
            expect(capitalised.length === 0 || capitalised.length === q.choices.length).toBe(true);
          });
      });
    });
  });

  it('still revises the first-trimester homophones at the end of CM2', () => {
    const words = new Set(
      generate('CM2', 3, createRng(31), 60)
        .filter((q) => q.id.startsWith('orthographe-homophone'))
        .map((q) => q.choices[q.correctIndex].toLowerCase())
    );
    const early = ['a', 'à', 'et', 'est'];
    expect(early.some((word) => words.has(word))).toBe(true);
  });
});
