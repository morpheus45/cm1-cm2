import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './problemes';

describe('problemes generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 6)).toHaveLength(6);
    expect(generate('CM2', createRng(1), 6)).toHaveLength(6);
  });

  it('tags every question with domain "problemes" and 6 unique choices', () => {
    const questions = generate('CM2', createRng(3), 5);
    questions.forEach((q) => {
      expect(q.domain).toBe('problemes');
      expect(q.choices).toHaveLength(6);
      expect(new Set(q.choices).size).toBe(6);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(6);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM2', createRng(17), 6);
    const b = generate('CM2', createRng(17), 6);
    expect(a).toEqual(b);
  });

  it('ends every prompt with a question mark', () => {
    const questions = generate('CM1', createRng(4), 6);
    questions.forEach((q) => expect(q.prompt.trim().endsWith('?')).toBe(true));
  });
});
