export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngPick<T>(rng: Rng, arr: T[]): T {
  return arr[rngInt(rng, 0, arr.length - 1)];
}

export function rngShuffle<T>(rng: Rng, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rngInt(rng, 0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function rngPickN<T>(rng: Rng, pool: T[], n: number): T[] {
  if (pool.length === 0) return [];
  const result: T[] = [];
  while (result.length < n) {
    result.push(...rngShuffle(rng, pool));
  }
  return result.slice(0, n);
}
