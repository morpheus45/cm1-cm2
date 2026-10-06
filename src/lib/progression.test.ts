import { describe, expect, it } from 'vitest';
import { availableAt, cycleOfStage, isAvailableAt, stageOf, STAGE_LABELS, type Stage } from './progression';
import { ALL_LEVELS, ALL_TRIMESTERS, CYCLE_OF_LEVEL, LEVEL_LABELS, TRIMESTER_LABELS } from '../types';
import type { Level, Trimester } from '../types';
import { eligibleOperationKinds, buildOperations } from '../domains/calcul';
import { eligibleTenses } from '../domains/conjugaison';
import { eligibleTemplateCount } from '../domains/problemes';
import { createRng } from './seededRandom';

describe('stageOf', () => {
  it('numbers the six steps of the school path in order', () => {
    expect(stageOf('CM1', 1)).toBe(1);
    expect(stageOf('CM1', 2)).toBe(2);
    expect(stageOf('CM1', 3)).toBe(3);
    expect(stageOf('CM2', 1)).toBe(4);
    expect(stageOf('CM2', 2)).toBe(5);
    expect(stageOf('CM2', 3)).toBe(6);
  });

  it('never goes backwards as the year progresses', () => {
    const stages = (['CM1', 'CM2'] as Level[]).flatMap((level) =>
      ALL_TRIMESTERS.map((trimester) => stageOf(level, trimester))
    );
    const sorted = [...stages].sort((a, b) => a - b);
    expect(stages).toEqual(sorted);
  });
});

describe('availableAt', () => {
  const items = [{ minStage: 1 as Stage }, { minStage: 3 as Stage }, { minStage: 6 as Stage }];

  it('keeps every notion already taught, not only the newest ones', () => {
    expect(availableAt(items, 3)).toHaveLength(2);
    expect(availableAt(items, 6)).toHaveLength(3);
  });

  it('hides notions that are not taught yet', () => {
    expect(availableAt(items, 1)).toEqual([{ minStage: 1 }]);
  });

  it('is monotonic: a later stage never offers fewer notions', () => {
    const sizes = ([1, 2, 3, 4, 5, 6] as Stage[]).map((stage) => availableAt(items, stage).length);
    sizes.forEach((size, index) => {
      if (index > 0) expect(size).toBeGreaterThanOrEqual(sizes[index - 1]);
    });
  });
});

describe('les vingt-quatre étapes, du CE1 à la 3e', () => {
  // Le CM1 et le CM2 gardent leur numérotation d'origine (1 à 6) : le contenu
  // déjà écrit et les seuils des générateurs n'ont pas bougé.
  const expected: Array<[Level, Trimester, Stage]> = [
    ['CE1', 1, -5], ['CE1', 2, -4], ['CE1', 3, -3],
    ['CE2', 1, -2], ['CE2', 2, -1], ['CE2', 3, 0],
    ['CM1', 1, 1], ['CM1', 2, 2], ['CM1', 3, 3],
    ['CM2', 1, 4], ['CM2', 2, 5], ['CM2', 3, 6],
    ['6e', 1, 7], ['6e', 2, 8], ['6e', 3, 9],
    ['5e', 1, 10], ['5e', 2, 11], ['5e', 3, 12],
    ['4e', 1, 13], ['4e', 2, 14], ['4e', 3, 15],
    ['3e', 1, 16], ['3e', 2, 17], ['3e', 3, 18],
  ];

  it.each(expected)('%s, trimestre %i : étape %i', (level, trimester, stage) => {
    expect(stageOf(level, trimester)).toBe(stage);
  });

  it('couvre les huit niveaux et les trois trimestres', () => {
    expect(expected).toHaveLength(ALL_LEVELS.length * ALL_TRIMESTERS.length);
    expect(expected.map(([level, trimester]) => `${level}-${trimester}`)).toEqual(
      ALL_LEVELS.flatMap((level) => ALL_TRIMESTERS.map((trimester) => `${level}-${trimester}`))
    );
  });

  it('avance d\'un cran à chaque trimestre, de −5 à 18, sans trou ni doublon', () => {
    const stages = ALL_LEVELS.flatMap((level) => ALL_TRIMESTERS.map((trimester) => stageOf(level, trimester)));
    expect(stages).toEqual(Array.from({ length: 24 }, (_, index) => index - 5));
  });

  it('donne à chaque étape son libellé, du niveau puis du trimestre', () => {
    expect(Object.keys(STAGE_LABELS)).toHaveLength(24);
    ALL_LEVELS.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        expect(STAGE_LABELS[stageOf(level, trimester)]).toBe(`${LEVEL_LABELS[level]} — ${TRIMESTER_LABELS[trimester]}`);
      })
    );
    expect(STAGE_LABELS[-5]).toBe('CE1 — 1er trimestre');
    expect(STAGE_LABELS[18]).toBe('3e — 3e trimestre');
  });

  it('range chaque étape dans le cycle de son niveau', () => {
    ALL_LEVELS.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        expect(cycleOfStage(stageOf(level, trimester))).toBe(CYCLE_OF_LEVEL[level]);
      })
    );
    expect([cycleOfStage(0), cycleOfStage(1), cycleOfStage(9), cycleOfStage(10)]).toEqual([2, 3, 3, 4]);
  });
});

describe('availableAt : cumulatif à l\'intérieur d\'un cycle seulement', () => {
  const at = (minStage: Stage) => ({ minStage });

  it('reste cumulatif du CM1 à la 6e, qui forment le cycle 3', () => {
    const items = [at(1), at(4), at(7)];
    expect(availableAt(items, stageOf('CM1', 1))).toEqual([at(1)]);
    expect(availableAt(items, stageOf('CM2', 1))).toEqual([at(1), at(4)]);
    expect(availableAt(items, stageOf('6e', 1))).toEqual(items);
  });

  it('reste cumulatif au cycle 2, du CE1 au CE2', () => {
    const items = [at(-5), at(-2), at(0)];
    expect(availableAt(items, stageOf('CE1', 3))).toEqual([at(-5)]);
    expect(availableAt(items, stageOf('CE2', 3))).toEqual(items);
  });

  it('reste cumulatif au cycle 4, de la 5e à la 3e', () => {
    const items = [at(10), at(13), at(18)];
    expect(availableAt(items, stageOf('4e', 1))).toEqual([at(10), at(13)]);
    expect(availableAt(items, stageOf('3e', 3))).toEqual(items);
  });

  it('ne remonte jamais d\'un cycle à l\'autre', () => {
    // Un élève de CM1 ne revoit pas le programme du CE2, ni un élève de 5e
    // celui de la 6e ou du CM2.
    expect(availableAt([at(0), at(1)], stageOf('CM1', 1))).toEqual([at(1)]);
    expect(availableAt([at(6), at(9), at(10)], stageOf('5e', 1))).toEqual([at(10)]);
    expect(availableAt([at(-3), at(1), at(10)], stageOf('3e', 3))).toEqual([at(10)]);
  });

  it('cache toujours ce qui n\'est pas encore enseigné', () => {
    expect(availableAt([at(2), at(3)], stageOf('CM1', 1))).toEqual([]);
    expect(availableAt([at(11)], stageOf('5e', 1))).toEqual([]);
  });

  it('ne change rien au CM1 et au CM2 : toutes les étapes de 1 à 6 sont d\'un même cycle', () => {
    const stages: Stage[] = [1, 2, 3, 4, 5, 6];
    stages.forEach((stage) => stages.forEach((minStage) => expect(isAvailableAt(minStage, stage)).toBe(minStage <= stage)));
  });

  it('s\'applique de la même façon dans chaque générateur qui filtre sur minStage', () => {
    // Au CM1 et au CM2, rien n'a bougé. En 5e, aucun contenu du cycle 4 n'est
    // écrit : rien ne doit remonter du CM2 — alors que l'ancienne inégalité
    // `minStage <= stage` y aurait tout laissé passer.
    expect(eligibleOperationKinds('CM1', 1)).toHaveLength(3);
    expect(eligibleOperationKinds('CM2', 3)).toHaveLength(10);
    expect(eligibleTenses('CM1', 1)).toEqual(['présent']);
    expect(eligibleTemplateCount('CM2', 3)).toBe(11);

    expect(eligibleOperationKinds('5e', 3)).toEqual([]);
    expect(eligibleTenses('5e', 3)).toEqual([]);
    expect(eligibleTemplateCount('5e', 3)).toBe(0);
    expect(buildOperations('5e', 3, createRng(1), 6, { posableOnly: true })).toEqual([]);

    // La 6e est du cycle 3 : en conjugaison, elle reprend tout ce que le CM1 et
    // le CM2 ont enseigné. En calcul, elle a ses propres techniques, écrites
    // avec les nombres de son programme : les seuils du CM ne lui servent plus
    // (calculNiveaux.test.ts).
    expect(eligibleOperationKinds('6e', 1)).toHaveLength(11);
    expect(eligibleOperationKinds('6e', 3)).toHaveLength(14);
    expect(eligibleTenses('6e', 1)).toEqual(eligibleTenses('CM2', 3));
    expect(eligibleTemplateCount('6e', 1)).toBe(eligibleTemplateCount('CM2', 3));
  });
});
