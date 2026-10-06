import type { Level, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngShuffle } from '../lib/seededRandom';

/** Les tables qu'on révise au cycle 3 : de 2 à 10. La table de 1 ne demande
 *  aucun entraînement. */
export const ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Les tables au programme, par niveau et par trimestre : les mêmes que celles
 * des questions de calcul (calculCycle2.ts). Au CE1, les tables de 2 et de 10
 * d'abord, puis celles de 5 et de 3, puis celle de 4 : les tables de 2, 3, 4,
 * 5 et 10, et pas d'autres. Au CE2, le début des tables de 6 et de 7, puis
 * toutes. Du CM1 à la 6e, de 2 à 10.
 */
export function tablesAuProgramme(level: Level, trimester: Trimester): number[] {
  if (level === 'CE1') return trimester === 1 ? [2, 10] : trimester === 2 ? [2, 3, 5, 10] : [2, 3, 4, 5, 10];
  if (level === 'CE2' && trimester === 1) return [2, 3, 4, 5, 6, 7, 10];
  return [...ALL_TABLES];
}

/** Une série de tables : assez longue pour tout brasser, assez courte pour
 *  rester un rituel de quelques minutes. */
export const TABLES_PER_SESSION = 20;

/** Un résultat de table à retrouver : « 7 × 8 ». */
export interface TableFact {
  id: string;
  /** La table travaillée. */
  table: number;
  /** Le facteur écrit en premier. */
  a: number;
  b: number;
  result: number;
}

/** Ne garde que des tables reconnues, sans doublon, dans l'ordre. Une
 *  sélection vide retombe sur toutes les tables. */
export function normaliseTables(candidates: unknown): number[] {
  const list = Array.isArray(candidates) ? candidates : [];
  const kept = ALL_TABLES.filter((table) => list.includes(table));
  return kept.length > 0 ? kept : [...ALL_TABLES];
}

/**
 * Tire une série de résultats dans les tables choisies. On fait le tour de
 * tous les produits avant d'en reproposer un, deux fois de suite le même
 * calcul n'arrive jamais, et le facteur de la table change de côté une fois
 * sur deux : « 7 × 4 » et « 4 × 7 » sont le même résultat, que l'élève doit
 * reconnaître dans les deux sens.
 */
export function buildTableFacts(tables: number[], rng: Rng, count = TABLES_PER_SESSION, allowed?: number[]): TableFact[] {
  // Avec `allowed` (les tables au programme du niveau), une sélection qui en
  // sort — enregistrée d'une année ou d'une classe à l'autre — est ramenée aux
  // tables du programme ; sans lui, rien ne change.
  const chosen = allowed ? restrictTables(tables, allowed) : normaliseTables(tables);
  const pool = chosen.flatMap((table) =>
    Array.from({ length: 9 }, (_, index) => ({ table, other: index + 2 }))
  );

  const order: Array<{ table: number; other: number }> = [];
  while (order.length < count) {
    const round = rngShuffle(rng, pool);
    const previous = order[order.length - 1];
    // À la jonction de deux tours, on évite de répéter le dernier calcul.
    if (previous && round.length > 1 && sameProduct(round[0], previous)) {
      [round[0], round[1]] = [round[1], round[0]];
    }
    order.push(...round);
  }

  return order.slice(0, count).map(({ table, other }, index) => {
    const swap = other !== table && rngInt(rng, 0, 1) === 1;
    const a = swap ? other : table;
    const b = swap ? table : other;
    return { id: `table-${index}-${a}-${b}`, table, a, b, result: a * b };
  });
}

/** Les tables choisies qui sont au programme ; toutes celles du programme si
 *  aucune des choisies n'y est. */
function restrictTables(candidates: unknown, allowed: number[]): number[] {
  const list = Array.isArray(candidates) ? candidates : [];
  const kept = allowed.filter((table) => list.includes(table));
  return kept.length > 0 ? kept : [...allowed];
}

function sameProduct(x: { table: number; other: number }, y: { table: number; other: number }): boolean {
  return (x.table === y.table && x.other === y.other) || (x.table === y.other && x.other === y.table);
}
