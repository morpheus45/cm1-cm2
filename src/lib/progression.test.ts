import { describe, expect, it } from 'vitest';
import { availableAt, stageOf, type Stage } from './progression';
import { ALL_TRIMESTERS } from '../types';
import type { Level } from '../types';

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
