import type { Domain, Level, Question, Trimester } from '../types';
import type { Figure } from '../lib/figures';
import { rngShuffle, type Rng } from '../lib/seededRandom';

/**
 * Ce que l'histoire et la géographie ont en commun : des questions écrites
 * une à une, rattachées à un niveau et à un trimestre.
 *
 * Contrairement au français et aux maths, la progression ne passe pas d'un
 * niveau à l'autre : chaque année a son programme (CM1 : programme publié au
 * BO n° 22 du 28 mai 2026 ; CM2 : programme de 2020, en vigueur pour le CM2
 * jusqu'en 2026-2027). Un élève de CM2 ne reçoit donc pas les questions du
 * CM1, qu'il n'a pas étudiées sous cette forme. À l'intérieur de l'année, la
 * progression reste cumulative : au 3e trimestre, les thèmes des deux
 * premiers reviennent en révision.
 */
export interface WrittenItem {
  level: Level;
  trimester: Trimester;
  prompt: string;
  correct: string;
  wrong: string[];
  explanation?: string;
  figure?: Figure;
  instruction?: string;
}

/** Une question déjà prête, avant son numéro dans la séance. */
export type Draft = Omit<Question, 'id' | 'domain'> & { key: string };

/** Les choix : la bonne réponse et trois mauvaises, mélangés, sans doublon. */
export function choose(rng: Rng, correct: string, wrong: string[], howMany = 4) {
  const distractors = rngShuffle(rng, [...new Set(wrong)].filter((entry) => entry !== correct)).slice(0, howMany - 1);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

export function isEligible(item: { level: Level; trimester: Trimester }, level: Level, trimester: Trimester): boolean {
  return item.level === level && item.trimester <= trimester;
}

export function fromItem(rng: Rng, item: WrittenItem): Draft {
  return {
    key: item.prompt,
    instruction: item.instruction,
    prompt: item.prompt,
    figure: item.figure,
    ...choose(rng, item.correct, item.wrong),
    explanation: item.explanation,
  };
}

/**
 * Assemble les questions d'une notion : la moitié au moins sur le trimestre
 * en cours (quand il en a), le reste en révision de l'année. Une question
 * déjà posée dans la séance ne revient qu'en dernier recours, quand plus
 * aucune source n'a de question nouvelle ; la séance a toujours son compte
 * de questions.
 *
 * `current` et `review` sont des fabriques de questions : questions écrites,
 * dates, siècles, frises.
 */
export function assemble(
  domain: Domain,
  rng: Rng,
  count: number,
  trimester: Trimester,
  current: (() => Draft)[],
  review: (() => Draft)[]
): Question[] {
  const all = [...current, ...review];
  if (all.length === 0) return [];
  const fromCurrent = current.length > 0 ? Math.ceil(count / 2) : 0;
  const plan = [
    ...Array.from({ length: fromCurrent }, (_, index) => current[index % current.length]),
    ...Array.from({ length: count - fromCurrent }, (_, index) => all[index % all.length]),
  ];
  const seen = new Set<string>();
  const drafts = plan.map((planned) => {
    let fallback: Draft | null = null;
    for (const make of [planned, ...rngShuffle(rng, all.filter((other) => other !== planned))]) {
      for (let attempt = 0; attempt < 6; attempt++) {
        const draft = make();
        fallback ??= draft;
        if (!seen.has(draft.key)) {
          seen.add(draft.key);
          return draft;
        }
      }
    }
    return fallback as Draft;
  });
  return rngShuffle(rng, drafts).map(({ key, ...question }, index) => ({
    id: `${domain}-t${trimester}-${index}-${key.slice(0, 40)}`,
    domain,
    ...question,
  }));
}

/** Des fabriques de questions tirées au hasard dans une liste, mélangée une
 *  fois : chaque appel rend la suivante. */
export function drawer(rng: Rng, items: WrittenItem[]): () => Draft {
  const order = rngShuffle(rng, items);
  let next = 0;
  return () => fromItem(rng, order[next++ % order.length]);
}
