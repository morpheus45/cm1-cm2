import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './calcul';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Question, Trimester } from '../types';

const LEVELS: Level[] = ['CM1', 'CM2'];

function operatorOf(question: Question): string {
  return question.prompt.split(' ')[1];
}

function operandsOf(question: Question): string[] {
  const [a, , b] = question.prompt.split(' ');
  return [a, b];
}

function isDecimal(question: Question): boolean {
  return question.prompt.includes(',') || question.choices.some((c) => c.includes(','));
}

describe('calcul generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', 1, createRng(1), 6)).toHaveLength(6);
    expect(generate('CM2', 3, createRng(1), 6)).toHaveLength(6);
  });

  it('tags every question with domain "calcul" and 4 unique choices', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(2), 12).forEach((q) => {
          expect(q.domain).toBe('calcul');
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices).size).toBe(4);
          expect(q.choices[q.correctIndex]).toBeDefined();
        });
      });
    });
  });

  it('is reproducible for the same seed, level and trimester', () => {
    expect(generate('CM2', 2, createRng(8), 10)).toEqual(generate('CM2', 2, createRng(8), 10));
  });

  it('writes every choice the same way, so the format never reveals the answer', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(19), 20).forEach((q) => {
          const withComma = q.choices.filter((c) => c.includes(','));
          expect(withComma.length === 0 || withComma.length === q.choices.length).toBe(true);
        });
      });
    });
  });

  it('does not divide before the third trimester of CM1', () => {
    ([1, 2] as Trimester[]).forEach((trimester) => {
      generate('CM1', trimester, createRng(4), 60).forEach((q) => expect(operatorOf(q)).not.toBe('÷'));
    });
    const withDivision = generate('CM1', 3, createRng(4), 60).some((q) => operatorOf(q) === '÷');
    expect(withDivision).toBe(true);
  });

  it('only multiplies within the tables during the first trimester of CM1', () => {
    generate('CM1', 1, createRng(6), 80)
      .filter((q) => operatorOf(q) === '×')
      .forEach((q) => {
        const [a, b] = operandsOf(q).map(Number);
        expect(a).toBeLessThanOrEqual(10);
        expect(b).toBeLessThanOrEqual(10);
      });
  });

  it('keeps every number whole until the second trimester of CM2', () => {
    const wholeOnly: Array<[Level, Trimester]> = [
      ['CM1', 1],
      ['CM1', 2],
      ['CM1', 3],
      ['CM2', 1],
    ];
    wholeOnly.forEach(([level, trimester]) => {
      generate(level, trimester, createRng(10), 60).forEach((q) => expect(isDecimal(q)).toBe(false));
    });
  });

  it('adds and subtracts decimals in CM2-T2, and only multiplies or divides them in CM2-T3', () => {
    generate('CM2', 2, createRng(12), 80)
      .filter(isDecimal)
      .forEach((q) => expect(['+', '-']).toContain(operatorOf(q)));

    const t3 = generate('CM2', 3, createRng(12), 120);
    expect(t3.some((q) => isDecimal(q) && ['×', '÷'].includes(operatorOf(q)))).toBe(true);
  });

  it('goes through the taught techniques before proposing one again', () => {
    // Au CM1-T1 trois techniques sont enseignées : les trois doivent sortir
    // avant qu'une seule ne revienne.
    const operators = generate('CM1', 1, createRng(2), 3).map(operatorOf);
    expect(new Set(operators).size).toBe(3);
  });

  it('still proposes whole-number operations at the end of CM2', () => {
    const questions = generate('CM2', 3, createRng(23), 60);
    expect(questions.some((q) => !isDecimal(q))).toBe(true);
  });
});
