import { describe, expect, it } from 'vitest';
import { ALL_TABLES, buildTableFacts, normaliseTables, TABLES_PER_SESSION } from './tables';
import { createRng } from '../lib/seededRandom';

describe('tables de multiplication', () => {
  it('ne tire que dans les tables choisies, avec un résultat exact', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const facts = buildTableFacts([7, 8], createRng(seed));
      expect(facts).toHaveLength(TABLES_PER_SESSION);
      for (const fact of facts) {
        expect([7, 8]).toContain(fact.table);
        expect([fact.a, fact.b]).toContain(fact.table);
        expect(fact.result).toBe(fact.a * fact.b);
        expect(Math.max(fact.a, fact.b)).toBeLessThanOrEqual(10);
        expect(Math.min(fact.a, fact.b)).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('ne pose jamais deux fois de suite le même calcul', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const facts = buildTableFacts([3], createRng(seed));
      for (let i = 1; i < facts.length; i++) {
        const same =
          Math.min(facts[i].a, facts[i].b) === Math.min(facts[i - 1].a, facts[i - 1].b) &&
          Math.max(facts[i].a, facts[i].b) === Math.max(facts[i - 1].a, facts[i - 1].b);
        expect(same).toBe(false);
      }
    }
  });

  it('fait le tour d\'une table avant de reproposer un calcul', () => {
    const facts = buildTableFacts([6], createRng(42)).slice(0, 9);
    const others = new Set(facts.map((fact) => (fact.a === 6 ? fact.b : fact.a)));
    expect(others.size).toBe(9);
  });

  it('donne des identifiants uniques', () => {
    const facts = buildTableFacts(ALL_TABLES, createRng(7));
    expect(new Set(facts.map((fact) => fact.id)).size).toBe(facts.length);
  });

  it('se méfie de la sélection enregistrée', () => {
    expect(normaliseTables([9, 2, 2, 42, 'x'])).toEqual([2, 9]);
    expect(normaliseTables([])).toEqual(ALL_TABLES);
    expect(normaliseTables(null)).toEqual(ALL_TABLES);
  });
});
