import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate, numberToFrenchWords } from './numeration';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';

const LEVELS: Level[] = ['CM1', 'CM2'];

/** Plus grand nombre pouvant être dicté à chaque étape. */
const MAX_NUMBER: Record<string, number> = {
  'CM1-1': 9_999,
  'CM1-2': 99_999,
  'CM1-3': 999_999,
  'CM2-1': 9_999_999,
  'CM2-2': 9_999_999_999,
  'CM2-3': 9_999_999_999,
};

function dicteeNumbers(level: Level, trimester: Trimester, seed: number, count: number): number[] {
  return generate(level, trimester, createRng(seed), count)
    .filter((q) => q.id.startsWith('numeration-dictee'))
    .map((q) => Number(q.choices[q.correctIndex]));
}


describe('numberToFrenchWords', () => {
  it('converts known values correctly', () => {
    expect(numberToFrenchWords(34)).toBe('trente-quatre');
    expect(numberToFrenchWords(600)).toBe('six cents');
    expect(numberToFrenchWords(180)).toBe('cent quatre-vingts');
    expect(numberToFrenchWords(79)).toBe('soixante-dix-neuf');
    expect(numberToFrenchWords(93)).toBe('quatre-vingt-treize');
    expect(numberToFrenchWords(5000)).toBe('cinq mille');
    expect(numberToFrenchWords(5010)).toBe('cinq mille dix');
    expect(numberToFrenchWords(842)).toBe('huit cent quarante-deux');
    expect(numberToFrenchWords(1001)).toBe('mille un');
    expect(numberToFrenchWords(0)).toBe('zéro');
    expect(numberToFrenchWords(200000)).toBe('deux cent mille');
    expect(numberToFrenchWords(80000)).toBe('quatre-vingt mille');
    expect(numberToFrenchWords(280000)).toBe('deux cent quatre-vingt mille');
    expect(numberToFrenchWords(200000000)).toBe('deux cents millions');
  });

  it('correctly handles 71 with "et" (soixante et onze)', () => {
    expect(numberToFrenchWords(71)).toBe('soixante et onze');
  });

  it('spells every "et un" the same way, without hyphens', () => {
    expect(numberToFrenchWords(21)).toBe('vingt et un');
    expect(numberToFrenchWords(31)).toBe('trente et un');
    expect(numberToFrenchWords(41)).toBe('quarante et un');
    expect(numberToFrenchWords(51)).toBe('cinquante et un');
    expect(numberToFrenchWords(61)).toBe('soixante et un');
    expect(numberToFrenchWords(531)).toBe('cinq cent trente et un');
  });

  it('keeps 81 and 91 without "et", as the rule requires', () => {
    expect(numberToFrenchWords(81)).toBe('quatre-vingt-un');
    expect(numberToFrenchWords(91)).toBe('quatre-vingt-onze');
  });

  it('correctly handles 72-79 with hyphen (not broken by 71 fix)', () => {
    expect(numberToFrenchWords(72)).toBe('soixante-douze');
  });

  it('correctly handles 90-99 without "et" (not broken by 71 fix)', () => {
    expect(numberToFrenchWords(91)).toBe('quatre-vingt-onze');
  });

  it('correctly handles 171 with "et" for embedded 71 (via threeDigits)', () => {
    expect(numberToFrenchWords(171)).toBe('cent soixante et onze');
  });
});

describe('numeration generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', 1, createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', 3, createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "numeration" and unique choices', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(3), 8).forEach((q) => {
          expect(q.domain).toBe('numeration');
          expect(new Set(q.choices).size).toBe(q.choices.length);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(q.choices.length);
        });
      });
    });
  });

  it('is reproducible for the same seed, level and trimester', () => {
    expect(generate('CM1', 2, createRng(55), 8)).toEqual(generate('CM1', 2, createRng(55), 8));
  });

  it('choices[correctIndex] matches the number spelled out in dictée prompts', () => {
    const questions = [
      ...generate('CM1', 3, createRng(11), 20),
      ...generate('CM2', 3, createRng(11), 20),
    ];
    questions.forEach((q) => {
      const match = q.prompt.match(/« (.+) »/);
      if (!match || !q.id.startsWith('numeration-dictee')) return;
      expect(numberToFrenchWords(Number(q.choices[q.correctIndex]))).toBe(match[1]);
    });
  });

  it('never dictates a number larger than the programme of the trimester', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        const max = MAX_NUMBER[`${level}-${trimester}`];
        dicteeNumbers(level, trimester, 17, 60).forEach((n) => expect(n).toBeLessThanOrEqual(max));
      });
    });
  });

  it('grows the size of the numbers as the year goes on', () => {
    const biggest = (level: Level, trimester: Trimester) =>
      Math.max(...dicteeNumbers(level, trimester, 3, 120));
    expect(biggest('CM1', 2)).toBeGreaterThan(9_999);
    expect(biggest('CM1', 3)).toBeGreaterThan(99_999);
    expect(biggest('CM2', 1)).toBeGreaterThan(999_999);
    expect(biggest('CM2', 2)).toBeGreaterThan(9_999_999);
  });

  it('keeps smaller numbers in the mix at the end of the year', () => {
    const numbers = dicteeNumbers('CM2', 3, 5, 120);
    expect(Math.min(...numbers)).toBeLessThan(10_000);
  });

  it('introduces fractions, decimals and percentages at the right moment', () => {
    const bankPrompts = (level: Level, trimester: Trimester) =>
      generate(level, trimester, createRng(29), 40)
        .filter((q) => q.id.startsWith('numeration-bank'))
        .map((q) => q.prompt);

    expect(bankPrompts('CM1', 1)).toHaveLength(0);
    expect(bankPrompts('CM1', 2)).toHaveLength(0);
    expect(bankPrompts('CM1', 3).some((p) => p.includes('fraction'))).toBe(true);

    expect(bankPrompts('CM2', 1).every((p) => p.includes('fraction'))).toBe(true);

    // Seules deux questions de banque par séance : il faut plusieurs tirages
    // pour voir toute la palette d'un trimestre.
    const overManySeeds = (level: Level, trimester: Trimester) =>
      Array.from({ length: 30 }, (_, seed) =>
        generate(level, trimester, createRng(seed + 1), 8)
          .filter((q) => q.id.startsWith('numeration-bank'))
          .map((q) => q.prompt)
      ).flat();

    expect(overManySeeds('CM1', 3).every((p) => p.includes('fraction'))).toBe(true);
    expect(overManySeeds('CM2', 2).some((p) => p.includes('écriture'))).toBe(true);
    expect(overManySeeds('CM2', 2).some((p) => p.includes('pourcentage'))).toBe(false);
    expect(overManySeeds('CM2', 3).some((p) => p.includes('pourcentage'))).toBe(true);
  });
});
