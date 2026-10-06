import type { Level, Question, Trimester } from '../types';
import { availableAt, stageOf } from '../lib/progression';
import { rngShuffle, type Rng } from '../lib/seededRandom';
import type { Family } from './geometrieCommun';
import { FAMILLES_CYCLE2 } from './geometrieCycle2';
import { FAMILLES_6E } from './geometrieSixieme';

/**
 * Les questions de géométrie du CE1, du CE2 et de la 6e : chaque niveau a ses
 * propres sortes de questions (geometrieCycle2.ts, geometrieSixieme.ts), avec
 * leurs propres nombres, et la séance se compose comme celle des autres
 * domaines de maths (mathsCommun.ts) : la part du trimestre pour ce qu'il
 * apporte de nouveau, le reste en révision, jamais deux fois la même question.
 */

/** `n` familles prises à tour de rôle dans la liste. */
function cycle<T>(liste: T[], n: number): T[] {
  return liste.length === 0 ? [] : Array.from({ length: n }, (_, index) => liste[index % liste.length]);
}

export function famillesDuNiveau(level: Level): Family[] {
  return level === '6e' ? FAMILLES_6E : FAMILLES_CYCLE2;
}

export function genererLesNouveauxNiveaux(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const stage = stageOf(level, trimester);
  const disponibles = availableAt(famillesDuNiveau(level), stage);
  if (disponibles.length === 0) return [];
  const recentes = disponibles.filter((famille) => famille.minStage === stage);
  // Comme ailleurs : la moitié sur ce que le trimestre apporte, moins quand il apporte peu.
  const fromRecent = Math.ceil(count * Math.min(1 / 2, recentes.length / 6));
  const picked = rngShuffle(rng, [...cycle(rngShuffle(rng, recentes), fromRecent), ...cycle(rngShuffle(rng, disponibles), count - fromRecent)]);
  const seen = new Set<string>();
  return picked.map((famille, index) => {
    let made = famille.make(rng, stage);
    for (let attempt = 0; attempt < 6 && seen.has(`${famille.name}-${made.detail}`); attempt++) made = famille.make(rng, stage);
    seen.add(`${famille.name}-${made.detail}`);
    const { detail, ...question } = made;
    return { id: `geometrie-${famille.name}-${index}-${detail}`, domain: 'geometrie' as const, ...question };
  });
}
