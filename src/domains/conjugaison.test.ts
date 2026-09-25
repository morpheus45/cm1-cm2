import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate, eligibleTenses } from './conjugaison';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';

const LEVELS: Level[] = ['CM1', 'CM2'];

function tenseOfFormQuestion(instruction: string): string {
  return instruction.replace(/^Complète (au |à l')/, '').replace(/ — verbe .*$/, '');
}

describe('conjugaison generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', 1, createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', 3, createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "conjugaison"', () => {
    generate('CM1', 2, createRng(1), 5).forEach((q) => expect(q.domain).toBe('conjugaison'));
  });

  it('gives each question exactly 4 distinct choices with a valid correctIndex', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(2), 12).forEach((q) => {
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices).size).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(4);
        });
      });
    });
  });

  it('is reproducible for the same seed, level and trimester', () => {
    expect(generate('CM1', 2, createRng(99), 6)).toEqual(generate('CM1', 2, createRng(99), 6));
  });

  it('follows the standard progression of tenses', () => {
    expect(eligibleTenses('CM1', 1)).toEqual(['présent']);
    expect(eligibleTenses('CM1', 2)).toEqual(['présent', 'imparfait']);
    expect(eligibleTenses('CM1', 3)).toEqual(['présent', 'imparfait', 'futur', 'passé composé']);
    expect(eligibleTenses('CM2', 1)).toEqual(['présent', 'imparfait', 'futur', 'passé composé']);
    expect(eligibleTenses('CM2', 2)).toContain('passé simple');
    expect(eligibleTenses('CM2', 2)).not.toContain('conditionnel présent');
    expect(eligibleTenses('CM2', 3)).toContain('conditionnel présent');
  });

  it('never asks about a tense that has not been taught yet', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        const allowed = eligibleTenses(level, trimester);
        generate(level, trimester, createRng(7), 40).forEach((q) => {
          if (q.id.startsWith('conjugaison-forme-')) {
            expect(allowed).toContain(tenseOfFormQuestion(q.instruction ?? ''));
          } else {
            q.choices.forEach((choice) => expect(allowed).toContain(choice));
          }
        });
      });
    });
  });

  it('never offers an untaught tense as a wrong answer either', () => {
    const questions = generate('CM1', 3, createRng(4), 30);
    const cm1Tenses = eligibleTenses('CM1', 3);
    questions
      .filter((q) => q.id.startsWith('conjugaison-temps-'))
      .forEach((q) => q.choices.forEach((choice) => expect(cm1Tenses).toContain(choice)));
  });

  it('asks to complete the sentence, not to name the tense, while only one tense is known', () => {
    const questions = generate('CM1', 1, createRng(5), 20);
    expect(questions.every((q) => q.id.startsWith('conjugaison-forme-'))).toBe(true);
  });

  it('starts naming tenses once four of them have been taught', () => {
    const questions = generate('CM1', 3, createRng(5), 20);
    expect(questions.some((q) => q.id.startsWith('conjugaison-temps-'))).toBe(true);
  });

  it('never asks the same sentence twice in one session', () => {
    const questions = generate('CM2', 3, createRng(3), 12);
    const keys = questions.map((q) => q.prompt.replace(/\*\*.+?\*\*/, '...'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('writes the instruction in correct French for every tense', () => {
    const instructions = new Set(
      generate('CM2', 3, createRng(77), 80)
        .filter((q) => q.id.startsWith('conjugaison-forme-'))
        .map((q) => (q.instruction ?? '').split(' — ')[0])
    );
    expect(instructions).toContain("Complète à l'imparfait");
    expect(instructions).toContain('Complète au présent');
    instructions.forEach((text) => expect(text).not.toContain('Complète au imparfait'));
  });

  it('keeps revising earlier tenses at the end of the year', () => {
    const questions = generate('CM2', 3, createRng(11), 60);
    const tenses = new Set(
      questions
        .filter((q) => q.id.startsWith('conjugaison-forme-'))
        .map((q) => tenseOfFormQuestion(q.instruction ?? ''))
    );
    expect(tenses.has('présent')).toBe(true);
    expect(tenses.has('conditionnel présent')).toBe(true);
  });
});
