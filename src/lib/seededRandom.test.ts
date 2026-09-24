import { describe, expect, it } from 'vitest';
import { createRng, rngInt, rngPick, rngPickN, rngShuffle } from './seededRandom';

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produces a different sequence for a different seed', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('always returns numbers in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('rngInt', () => {
  it('stays within [min, max] inclusive', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const value = rngInt(rng, 5, 9);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(9);
    }
  });
});

describe('rngPick', () => {
  it('always returns an element from the array', () => {
    const rng = createRng(9);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(rngPick(rng, arr));
    }
  });
});

describe('rngShuffle', () => {
  it('returns an array with the same elements', () => {
    const rng = createRng(11);
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rngShuffle(rng, arr);
    expect(shuffled.slice().sort()).toEqual(arr.slice().sort());
  });

  it('does not mutate the input array', () => {
    const rng = createRng(11);
    const arr = [1, 2, 3];
    rngShuffle(rng, arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('is deterministic for a given seed', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffledA = rngShuffle(createRng(123), arr);
    const shuffledB = rngShuffle(createRng(123), arr);
    expect(shuffledA).toEqual(shuffledB);
  });
});

describe('rngPickN', () => {
  it('returns exactly n items when n <= pool length', () => {
    const rng = createRng(5);
    const result = rngPickN(rng, ['a', 'b', 'c', 'd'], 3);
    expect(result).toHaveLength(3);
    result.forEach((item) => expect(['a', 'b', 'c', 'd']).toContain(item));
  });

  it('cycles through the pool when n > pool length', () => {
    const rng = createRng(5);
    const result = rngPickN(rng, ['a', 'b'], 5);
    expect(result).toHaveLength(5);
    result.forEach((item) => expect(['a', 'b']).toContain(item));
  });

  it('returns an empty array for an empty pool', () => {
    const rng = createRng(5);
    expect(rngPickN(rng, [], 3)).toEqual([]);
  });
});
