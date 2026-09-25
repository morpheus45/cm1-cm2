import type { Level, Trimester } from '../types';

/**
 * Les six étapes de la scolarité couverte par l'application, dans l'ordre :
 * CM1-T1, CM1-T2, CM1-T3, CM2-T1, CM2-T2, CM2-T3.
 *
 * Toute la progression pédagogique s'exprime avec ce seul nombre : chaque
 * notion porte l'étape à partir de laquelle elle devient disponible
 * (`minStage`), et le filtre est une inégalité large. La progression est donc
 * cumulative par construction — au 3e trimestre l'élève revoit aussi ce qu'il
 * a appris au 1er.
 */
export type Stage = 1 | 2 | 3 | 4 | 5 | 6;

export function stageOf(level: Level, trimester: Trimester): Stage {
  return ((level === 'CM1' ? 0 : 3) + trimester) as Stage;
}

export const STAGE_LABELS: Record<Stage, string> = {
  1: 'CM1 — 1er trimestre',
  2: 'CM1 — 2e trimestre',
  3: 'CM1 — 3e trimestre',
  4: 'CM2 — 1er trimestre',
  5: 'CM2 — 2e trimestre',
  6: 'CM2 — 3e trimestre',
};

/** Tout élément de banque de contenu porte l'étape où il devient éligible. */
export interface Staged {
  minStage: Stage;
}

export function availableAt<T extends Staged>(items: T[], stage: Stage): T[] {
  return items.filter((item) => item.minStage <= stage);
}
