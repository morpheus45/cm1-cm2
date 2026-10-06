import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';
import * as conjugaison from './conjugaison';
import * as accords from './accords';
import * as orthographe from './orthographe';

/**
 * Le français est fabriqué à partir de règles, comme les maths : chaque
 * notion doit offrir au moins 300 questions différentes par niveau et par
 * trimestre. La mesure reprend celle du constat initial : 800 tirages d'une
 * séance de 12 questions, en comptant les énoncés distincts
 * (instruction + énoncé).
 */
/** Les niveaux dont chaque notion écrit ses questions. Une notion rejoint la liste des cinq niveaux
 *  quand ses questions du CE1, du CE2 et de la 6e sont écrites. */
const CINQ_NIVEAUX: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e'];
const LEVELS_OF: Record<string, Level[]> = {
  conjugaison: CINQ_NIVEAUX,
  accords: ['CM1', 'CM2'],
  orthographe: ['CM1', 'CM2'],
};
const DRAWS = 800;
const QUESTIONS_PER_DRAW = 12;
const MINIMUM_DISTINCT = 300;

type Generator = (level: Level, trimester: Trimester, rng: ReturnType<typeof createRng>, count: number) => { instruction?: string; prompt: string }[];

function distinctCount(generate: Generator, level: Level, trimester: Trimester): number {
  const seen = new Set<string>();
  for (let seed = 1; seed <= DRAWS; seed++) {
    generate(level, trimester, createRng(seed * 7919 + 3), QUESTIONS_PER_DRAW).forEach((question) => {
      seen.add(`${question.instruction ?? ''}|${question.prompt}`);
    });
  }
  return seen.size;
}

describe('au moins 300 questions différentes par niveau et par trimestre', () => {
  const domains: [string, Generator][] = [
    ['conjugaison', conjugaison.generate],
    ['accords', accords.generate],
    ['orthographe', orthographe.generate],
  ];

  domains.forEach(([name, generate]) => {
    LEVELS_OF[name].forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        it(`${name} — ${level} trimestre ${trimester}`, () => {
          expect(distinctCount(generate, level, trimester)).toBeGreaterThanOrEqual(MINIMUM_DISTINCT);
        });
      });
    });
  });
});
