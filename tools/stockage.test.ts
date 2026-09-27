import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCAL_DATA } from '../src/lib/conservation';

/** Tous les fichiers du code de l'application, tests exceptés. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe('les données gardées sur la tablette', () => {
  it('ont toutes une règle de conservation (src/lib/conservation.ts)', () => {
    const keys = new Set(
      sources(join(process.cwd(), 'src')).flatMap((path) => readFileSync(path, 'utf8').match(/exercices-cm1-cm2:[a-z-]+/g) ?? [])
    );
    expect(keys.size).toBeGreaterThan(5);
    [...keys].forEach((key) => expect(Object.keys(LOCAL_DATA), key).toContain(key));
  });
});
