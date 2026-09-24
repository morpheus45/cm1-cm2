import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './conjugaison';

describe('conjugaison generate', () => {
  it('returns the requested number of questions', () => {
    const questions = generate('CM1', createRng(1), 8);
    expect(questions).toHaveLength(8);
  });

  it('tags every question with domain "conjugaison"', () => {
    const questions = generate('CM1', createRng(1), 5);
    questions.forEach((q) => expect(q.domain).toBe('conjugaison'));
  });

  it('gives each question exactly 4 choices with a valid correctIndex', () => {
    const questions = generate('CM2', createRng(2), 10);
    questions.forEach((q) => {
      expect(q.choices).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
      expect(new Set(q.choices).size).toBe(4);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM1', createRng(99), 6);
    const b = generate('CM1', createRng(99), 6);
    expect(a).toEqual(b);
  });

  it('only uses CM1 tenses as answer options at CM1 level', () => {
    const cm1Tenses = ['présent', 'imparfait', 'futur', 'passé composé'];
    const questions = generate('CM1', createRng(4), 16);
    questions.forEach((q) => {
      q.choices.forEach((choice) => expect(cm1Tenses).toContain(choice));
    });
  });
});
