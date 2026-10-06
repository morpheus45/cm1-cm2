import { describe, expect, it } from 'vitest';
import { ALL_TABLES, buildTableFacts, normaliseTables, tablesAuProgramme, TABLES_PER_SESSION } from './tables';
import { ALL_LEVELS, ALL_TRIMESTERS } from '../types';
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

describe('les tables au programme de chaque niveau', () => {
  it('sont celles de 2, 3, 4, 5 et 10 au CE1, qui les découvre trimestre après trimestre', () => {
    expect(tablesAuProgramme('CE1', 1)).toEqual([2, 10]);
    expect(tablesAuProgramme('CE1', 2)).toEqual([2, 3, 5, 10]);
    expect(tablesAuProgramme('CE1', 3)).toEqual([2, 3, 4, 5, 10]);
  });

  it('commencent celles de 6 et de 7 au début du CE2, puis toutes', () => {
    expect(tablesAuProgramme('CE2', 1)).toEqual([2, 3, 4, 5, 6, 7, 10]);
    expect(tablesAuProgramme('CE2', 2)).toEqual(ALL_TABLES);
    expect(tablesAuProgramme('CE2', 3)).toEqual(ALL_TABLES);
  });

  it('restent de 2 à 10 du CM1 à la 3e, et s\'allongent sans jamais se contredire', () => {
    ALL_LEVELS.filter((level) => level !== 'CE1' && level !== 'CE2').forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => expect(tablesAuProgramme(level, trimester)).toEqual(ALL_TABLES))
    );
    const ordre = ALL_LEVELS.slice(0, 4).flatMap((level) => ALL_TRIMESTERS.map((trimester) => tablesAuProgramme(level, trimester)));
    ordre.forEach((tables, index) => {
      if (index > 0) ordre[index - 1].forEach((table) => expect(tables).toContain(table));
    });
  });

  it('ramènent une sélection enregistrée aux tables du niveau', () => {
    const programme = tablesAuProgramme('CE1', 1);
    for (let seed = 1; seed <= 40; seed++) {
      // Toutes les tables cochées : seules celles du programme sont posées.
      buildTableFacts(ALL_TABLES, createRng(seed), TABLES_PER_SESSION, programme).forEach((fact) => expect(programme).toContain(fact.table));
      // Aucune table du programme cochée : on retombe sur celles du programme.
      buildTableFacts([7, 8], createRng(seed), TABLES_PER_SESSION, programme).forEach((fact) => expect(programme).toContain(fact.table));
    }
    // Une sélection dans le programme est respectée.
    buildTableFacts([2], createRng(3), TABLES_PER_SESSION, programme).forEach((fact) => expect(fact.table).toBe(2));
  });

  it('ne changent rien sans la liste du programme : le CM garde sa série', () => {
    expect(buildTableFacts([7, 8], createRng(5))).toEqual(buildTableFacts([7, 8], createRng(5), TABLES_PER_SESSION, undefined));
  });
});

