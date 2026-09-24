import { ALL_DOMAINS } from '../types';
import type { Domain, Level, Question } from '../types';
import { createRng, rngShuffle, type Rng } from './seededRandom';
import * as conjugaison from '../domains/conjugaison';
import * as accords from '../domains/accords';
import * as orthographe from '../domains/orthographe';
import * as numeration from '../domains/numeration';
import * as calcul from '../domains/calcul';
import * as problemes from '../domains/problemes';

type Generator = (level: Level, rng: Rng, count: number) => Question[];

const GENERATORS: Record<Domain, Generator> = {
  conjugaison: conjugaison.generate,
  accords: accords.generate,
  orthographe: orthographe.generate,
  numeration: numeration.generate,
  calcul: calcul.generate,
  problemes: problemes.generate,
};

export function buildSession(subjects: Domain[], level: Level, seed: number, count = 8): Question[] {
  const orderedSubjects = ALL_DOMAINS.filter((domain) => subjects.includes(domain));
  if (orderedSubjects.length === 0) {
    throw new Error('Au moins une matière doit être sélectionnée.');
  }
  const rng = createRng(seed);
  const perSubject = Math.floor(count / orderedSubjects.length);
  const remainder = count - perSubject * orderedSubjects.length;

  const all: Question[] = [];
  orderedSubjects.forEach((subject, index) => {
    const subjectCount = perSubject + (index < remainder ? 1 : 0);
    if (subjectCount > 0) {
      all.push(...GENERATORS[subject](level, rng, subjectCount));
    }
  });

  return rngShuffle(rng, all);
}
