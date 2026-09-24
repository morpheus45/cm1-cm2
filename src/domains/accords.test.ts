import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './accords';

describe('accords generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "accords" and 4 unique choices', () => {
    const questions = generate('CM2', createRng(3), 10);
    questions.forEach((q) => {
      expect(q.domain).toBe('accords');
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM2', createRng(42), 8);
    const b = generate('CM2', createRng(42), 8);
    expect(a).toEqual(b);
  });

  it('includes participe-passé questions only at CM2 level', () => {
    const cm1Questions = generate('CM1', createRng(5), 12);
    const cm2Questions = generate('CM2', createRng(5), 12);
    const hasParticipe = (qs: ReturnType<typeof generate>) =>
      qs.some((q) => q.id.startsWith('accords-participe'));
    expect(hasParticipe(cm1Questions)).toBe(false);
    expect(hasParticipe(cm2Questions)).toBe(true);
  });
});
