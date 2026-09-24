import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './orthographe';

describe('orthographe generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', createRng(1), 9)).toHaveLength(9);
  });

  it('tags every question with domain "orthographe" and 4 unique choices', () => {
    const questions = generate('CM2', createRng(3), 9);
    questions.forEach((q) => {
      expect(q.domain).toBe('orthographe');
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM2', createRng(7), 9);
    const b = generate('CM2', createRng(7), 9);
    expect(a).toEqual(b);
  });

  it('includes synonym questions only at CM2 level, when count allows it', () => {
    const cm1Questions = generate('CM1', createRng(2), 12);
    const cm2Questions = generate('CM2', createRng(2), 12);
    const hasSynonym = (qs: ReturnType<typeof generate>) =>
      qs.some((q) => q.id.startsWith('orthographe-synonyme'));
    expect(hasSynonym(cm1Questions)).toBe(false);
    expect(hasSynonym(cm2Questions)).toBe(true);
  });

  it('always produces 4 distinct choices, across many seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const questions = generate('CM1', createRng(seed), 12);
      questions.forEach((q) => {
        expect(new Set(q.choices).size).toBe(q.choices.length);
      });
    }
    for (let seed = 1; seed <= 200; seed++) {
      const questions = generate('CM2', createRng(seed), 12);
      questions.forEach((q) => {
        expect(new Set(q.choices).size).toBe(q.choices.length);
      });
    }
  });
});
