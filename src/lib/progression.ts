import { ALL_LEVELS, ALL_TRIMESTERS, CYCLE_OF_LEVEL } from '../types';
import type { Cycle, Level, Trimester } from '../types';

/**
 * Les étapes de la scolarité couverte par l'application, dans l'ordre : du
 * CE1-T1 au 3e-T3, trois par niveau.
 *
 * La numérotation part du CM1, dont le 1er trimestre vaut 1 : CM1-T1 = 1, …,
 * CM2-T3 = 6, comme au tout début de l'application, pour que ni le contenu déjà
 * écrit ni les seuils des générateurs ne changent. Les niveaux d'avant ont des
 * étapes négatives ou nulle (CE1 : −5 à −3, CE2 : −2 à 0), ceux d'après des
 * étapes au-delà de 6 (6e : 7 à 9, 5e : 10 à 12, 4e : 13 à 15, 3e : 16 à 18).
 *
 * Toute la progression pédagogique s'exprime avec ce seul nombre : chaque
 * notion porte l'étape à partir de laquelle elle devient disponible
 * (`minStage`). La progression est cumulative dans un cycle (voir
 * `isAvailableAt`) : au 3e trimestre l'élève revoit aussi ce qu'il a appris au
 * 1er.
 */
export type Stage =
  | -5 | -4 | -3 | -2 | -1 | 0
  | 1 | 2 | 3 | 4 | 5 | 6
  | 7 | 8 | 9 | 10 | 11 | 12
  | 13 | 14 | 15 | 16 | 17 | 18;

/** L'étape qui précède le 1er trimestre de chaque niveau. */
const OFFSET: Record<Level, number> = {
  CE1: -6,
  CE2: -3,
  CM1: 0,
  CM2: 3,
  '6e': 6,
  '5e': 9,
  '4e': 12,
  '3e': 15,
};

export function stageOf(level: Level, trimester: Trimester): Stage {
  return (OFFSET[level] + trimester) as Stage;
}

export const STAGE_LABELS: Record<Stage, string> = {
  [-5]: 'CE1 — 1er trimestre',
  [-4]: 'CE1 — 2e trimestre',
  [-3]: 'CE1 — 3e trimestre',
  [-2]: 'CE2 — 1er trimestre',
  [-1]: 'CE2 — 2e trimestre',
  0: 'CE2 — 3e trimestre',
  1: 'CM1 — 1er trimestre',
  2: 'CM1 — 2e trimestre',
  3: 'CM1 — 3e trimestre',
  4: 'CM2 — 1er trimestre',
  5: 'CM2 — 2e trimestre',
  6: 'CM2 — 3e trimestre',
  7: '6e — 1er trimestre',
  8: '6e — 2e trimestre',
  9: '6e — 3e trimestre',
  10: '5e — 1er trimestre',
  11: '5e — 2e trimestre',
  12: '5e — 3e trimestre',
  13: '4e — 1er trimestre',
  14: '4e — 2e trimestre',
  15: '4e — 3e trimestre',
  16: '3e — 1er trimestre',
  17: '3e — 2e trimestre',
  18: '3e — 3e trimestre',
};

/** Le cycle de chaque étape, déduit de celui de son niveau. */
const CYCLE_OF_STAGE = Object.fromEntries(
  ALL_LEVELS.flatMap((level) => ALL_TRIMESTERS.map((trimester) => [stageOf(level, trimester), CYCLE_OF_LEVEL[level]]))
) as Record<Stage, Cycle>;

export function cycleOfStage(stage: Stage): Cycle {
  return CYCLE_OF_STAGE[stage];
}

/** Tout élément de banque de contenu porte l'étape où il devient éligible. */
export interface Staged {
  minStage: Stage;
}

/**
 * Ce qui arrive à l'étape `minStage` est-il disponible à l'étape `stage` ? Oui
 * s'il est déjà enseigné (`minStage <= stage`) et du même cycle : la
 * progression est cumulative à l'intérieur d'un cycle, jamais d'un cycle à
 * l'autre — un élève de 5e ne revoit pas ce qui s'apprenait au CM2.
 *
 * C'est la seule règle de disponibilité de l'application : tout générateur
 * qui filtre sur `minStage` passe par elle.
 */
export function isAvailableAt(minStage: Stage, stage: Stage): boolean {
  return minStage <= stage && cycleOfStage(minStage) === cycleOfStage(stage);
}

export function availableAt<T extends Staged>(items: T[], stage: Stage): T[] {
  return items.filter((item) => isAvailableAt(item.minStage, stage));
}
