import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './accords';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';

const LEVELS: Level[] = ['CM1', 'CM2'];
const IRREGULAR_PLURALS = ['tableaux', 'journaux', 'bateaux', 'chevaux'];

describe('accords generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', 1, createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', 3, createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "accords" and 4 unique choices', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(3), 10).forEach((q) => {
          expect(q.domain).toBe('accords');
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices).size).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(4);
        });
      });
    });
  });

  it('is reproducible for the same seed, level and trimester', () => {
    expect(generate('CM2', 2, createRng(42), 8)).toEqual(generate('CM2', 2, createRng(42), 8));
  });

  it('introduces the participe passé only from the second trimester of CM2', () => {
    const hasParticipe = (level: Level, trimester: Trimester) =>
      generate(level, trimester, createRng(5), 20).some((q) => q.id.startsWith('accords-participe'));
    expect(hasParticipe('CM1', 1)).toBe(false);
    expect(hasParticipe('CM1', 3)).toBe(false);
    expect(hasParticipe('CM2', 1)).toBe(false);
    expect(hasParticipe('CM2', 2)).toBe(true);
    expect(hasParticipe('CM2', 3)).toBe(true);
  });

  it('keeps irregular plurals for the third trimester of CM1 onwards', () => {
    const usesIrregular = (level: Level, trimester: Trimester) =>
      generate(level, trimester, createRng(9), 40).some((q) =>
        IRREGULAR_PLURALS.some((noun) => q.id.endsWith(`-${noun}`))
      );
    expect(usesIrregular('CM1', 1)).toBe(false);
    expect(usesIrregular('CM1', 2)).toBe(false);
    expect(usesIrregular('CM1', 3)).toBe(true);
    expect(usesIrregular('CM2', 1)).toBe(true);
  });

  it('still revises simple nominal groups at the end of CM2', () => {
    const questions = generate('CM2', 3, createRng(13), 40);
    expect(questions.some((q) => q.id.startsWith('accords-nominal'))).toBe(true);
  });
});
