import type { Question } from '../types';
import type { Stage } from '../lib/progression';
import { rngShuffle, type Rng } from '../lib/seededRandom';

/** Une sorte de question de géométrie, disponible à partir d'une étape de
 *  la scolarité (`minStage`). `detail` distingue deux questions de la même
 *  sorte : une séance ne pose jamais deux fois la même. */
export interface Family {
  name: string;
  minStage: Stage;
  make: (rng: Rng, stage: Stage) => Omit<Question, 'id' | 'domain'> & { detail: string };
}

/** Les choix : la bonne réponse et des mauvaises, mélangés, sans doublon. */
export function choose(rng: Rng, correct: string, wrong: string[], howMany = 4) {
  const distractors = rngShuffle(rng, [...new Set(wrong)].filter((entry) => entry !== correct)).slice(0, howMany - 1);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

/** Une construction n'a pas de choix : l'élève pose des points. */
export const NO_CHOICES = { choices: [] as string[], correctIndex: -1 };
