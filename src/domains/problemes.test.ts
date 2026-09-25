import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate, eligibleTemplateCount } from './problemes';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';

const LEVELS: Level[] = ['CM1', 'CM2'];

/** Phrases propres à chaque famille de problèmes, pour les repérer à coup sûr. */
const TWO_STEP_MARKERS = ['bibliothèque', 'carnets à', 'stade compte'];
const MANY_STEP_MARKERS = ['la vendeuse lui rend', 'croissants'];
const PROPORTIONALITY_MARKERS = ['au même prix chacun', 'de farine'];

function prompts(level: Level, trimester: Trimester, seed: number, count: number): string[] {
  return generate(level, trimester, createRng(seed), count).map((q) => q.prompt);
}

function usesAny(list: string[], markers: string[]): boolean {
  return list.some((prompt) => markers.some((marker) => prompt.includes(marker)));
}

describe('problemes generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', 1, createRng(1), 6)).toHaveLength(6);
    expect(generate('CM2', 3, createRng(1), 6)).toHaveLength(6);
  });

  it('tags every question with domain "problemes" and 6 unique choices', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(3), 5).forEach((q) => {
          expect(q.domain).toBe('problemes');
          expect(q.choices).toHaveLength(6);
          expect(new Set(q.choices).size).toBe(6);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(6);
        });
      });
    });
  });

  it('is reproducible for the same seed, level and trimester', () => {
    expect(generate('CM2', 2, createRng(17), 6)).toEqual(generate('CM2', 2, createRng(17), 6));
  });

  it('ends every prompt with a question mark', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(4), 6).forEach((q) =>
          expect(q.prompt.trim().endsWith('?')).toBe(true)
        );
      });
    });
  });

  it('choices[correctIndex] matches the correct value encoded in the id', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(12), 10).forEach((q) => {
          const parts = q.id.split('-');
          expect(q.choices[q.correctIndex]).toBe(parts[parts.length - 1]);
        });
      });
    });
  });

  it('sticks to one-step problems during the first trimester of CM1', () => {
    const list = prompts('CM1', 1, 8, 60);
    expect(usesAny(list, TWO_STEP_MARKERS)).toBe(false);
    expect(usesAny(list, MANY_STEP_MARKERS)).toBe(false);
    expect(usesAny(list, PROPORTIONALITY_MARKERS)).toBe(false);
  });

  it('adds two-step problems from the second trimester of CM1', () => {
    expect(usesAny(prompts('CM1', 2, 8, 60), TWO_STEP_MARKERS)).toBe(true);
  });

  it('holds back multi-step problems until the second trimester of CM2', () => {
    expect(usesAny(prompts('CM1', 3, 8, 60), MANY_STEP_MARKERS)).toBe(false);
    expect(usesAny(prompts('CM2', 1, 8, 60), MANY_STEP_MARKERS)).toBe(false);
    expect(usesAny(prompts('CM2', 2, 8, 60), MANY_STEP_MARKERS)).toBe(true);
  });

  it('holds back proportionality until the last trimester of CM2', () => {
    expect(usesAny(prompts('CM2', 2, 8, 60), PROPORTIONALITY_MARKERS)).toBe(false);
    expect(usesAny(prompts('CM2', 3, 8, 60), PROPORTIONALITY_MARKERS)).toBe(true);
  });

  it('still proposes one-step problems at the end of CM2', () => {
    const list = prompts('CM2', 3, 8, 60);
    expect(list.some((p) => p.includes('cour de récréation') || p.includes('paquets'))).toBe(true);
  });

  it('does not repeat a kind of problem while others have not been proposed', () => {
    const questions = generate('CM2', 3, createRng(2), 6);
    const shapes = questions.map((q) => q.prompt.replace(/\d+/g, '#'));
    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it('offers more and more kinds of problems as the year goes on', () => {
    const counts = LEVELS.flatMap((level) =>
      ALL_TRIMESTERS.map((trimester) => eligibleTemplateCount(level, trimester))
    );
    counts.forEach((count, index) => {
      if (index > 0) expect(count).toBeGreaterThanOrEqual(counts[index - 1]);
    });
    expect(counts[0]).toBeLessThan(counts[counts.length - 1]);
  });
});
