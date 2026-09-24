import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './calcul';

describe('calcul generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "calcul" and 4 unique numeric-looking choices', () => {
    const questions = generate('CM1', createRng(3), 10);
    questions.forEach((q) => {
      expect(q.domain).toBe('calcul');
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM2', createRng(21), 8);
    const b = generate('CM2', createRng(21), 8);
    expect(a).toEqual(b);
  });

  it('prompts contain an operation sign and a question mark', () => {
    const questions = generate('CM1', createRng(8), 6);
    questions.forEach((q) => {
      expect(q.prompt).toMatch(/[+\-×÷]/);
      expect(q.prompt.endsWith('?')).toBe(true);
    });
  });
});
