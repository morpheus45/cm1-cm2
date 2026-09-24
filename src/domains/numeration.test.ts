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
    expect(numberToFrenchWords(200000)).toBe('deux cent mille');
    expect(numberToFrenchWords(80000)).toBe('quatre-vingt mille');
    expect(numberToFrenchWords(280000)).toBe('deux cent quatre-vingt mille');
    expect(numberToFrenchWords(200000000)).toBe('deux cents millions');
  });

  it('correctly handles 71 with "et" (soixante et onze)', () => {
    expect(numberToFrenchWords(71)).toBe('soixante et onze');
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

  it('choices[correctIndex] matches the number spelled out in dictée prompts', () => {
    const questions = [...generate('CM1', createRng(11), 20), ...generate('CM2', createRng(11), 20)];
    questions.forEach((q) => {
      const match = q.prompt.match(/Quel nombre correspond à « (.+) » \?/);
      if (!match) return;
      const words = match[1];
      const correctChoice = q.choices[q.correctIndex];
      expect(numberToFrenchWords(Number(correctChoice))).toBe(words);
    });
  });
});
