import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate, numberToFrenchWords } from './numeration';

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
  });
});

describe('numeration generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "numeration" and unique choices', () => {
    const questions = generate('CM2', createRng(3), 8);
    questions.forEach((q) => {
      expect(q.domain).toBe('numeration');
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.choices.length);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM1', createRng(55), 8);
    const b = generate('CM1', createRng(55), 8);
    expect(a).toEqual(b);
  });
});
