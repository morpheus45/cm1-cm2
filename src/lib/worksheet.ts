import type { Level, Trimester } from '../types';
import { buildOperations, formatNumber } from '../domains/calcul';
import { createRng } from './seededRandom';

/**
 * Un trait tracé par l'élève. Les points sont exprimés en fractions du cadre
 * d'écriture (0 à 1) et non en pixels : la même trace se redessine alors
 * identiquement sur un téléphone, sur la tablette de la maîtresse et dans le
 * PDF, quelle que soit la taille.
 */
export interface Stroke {
  points: Array<[number, number]>;
}

export interface WorksheetOperation {
  id: string;
  statement: string;
  expected: string;
}

export interface WorksheetAnswer {
  /** Ce que l'élève a saisi. Vide s'il a passé l'opération. */
  given: string;
  strokes: Stroke[];
  /** Les annotations de la maîtresse, tracées par-dessus à la correction. */
  teacherStrokes?: Stroke[];
}

export interface Worksheet {
  name: string;
  level: Level;
  trimester: Trimester;
  /** Date de la séance, au format ISO. */
  createdAt: string;
  operations: WorksheetOperation[];
  answers: Record<string, WorksheetAnswer>;
}

/** Le cadre d'écriture est plus large que haut, dans cette proportion, à
 *  l'écran comme dans le PDF : sans cela l'écriture serait déformée. */
export const WRITING_ASPECT_RATIO = 4 / 3;

/** Nombre de carreaux sur la largeur du cadre. */
export const WRITING_COLUMNS = 18;

export const OPERATIONS_PER_WORKSHEET = 6;

export function buildWorksheet({
  name,
  level,
  trimester,
  seed,
  count = OPERATIONS_PER_WORKSHEET,
  createdAt,
}: {
  name: string;
  level: Level;
  trimester: Trimester;
  seed: number;
  count?: number;
  createdAt?: string;
}): Worksheet {
  const rng = createRng(seed);
  const operations = buildOperations(level, trimester, rng, count, { posableOnly: true }).map(
    (operation, index) => ({
      id: `pose-${index}-${operation.op}-${operation.a}-${operation.b}`,
      statement: `${formatNumber(operation.a)} ${operation.op} ${formatNumber(operation.b)}`,
      expected: formatNumber(operation.result),
    })
  );

  return {
    name,
    level,
    trimester,
    createdAt: createdAt ?? new Date().toISOString(),
    operations,
    answers: {},
  };
}

/**
 * Compare la saisie de l'élève au résultat attendu. La virgule et le point
 * sont acceptés l'un pour l'autre, et « 12,0 » vaut « 12 » : l'exercice porte
 * sur la technique opératoire, pas sur la façon d'écrire le nombre.
 */
export function isAnswerCorrect(given: string, expected: string): boolean {
  const normalise = (value: string) => {
    const cleaned = value.trim().replace(/\s/g, '').replace(',', '.');
    if (cleaned === '' || !/^-?\d*\.?\d*$/.test(cleaned)) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? Math.round(parsed * 1000) / 1000 : null;
  };
  const left = normalise(given);
  const right = normalise(expected);
  return left !== null && right !== null && left === right;
}

export function worksheetScore(worksheet: Worksheet): { correct: number; total: number } {
  const correct = worksheet.operations.filter((operation) =>
    isAnswerCorrect(worksheet.answers[operation.id]?.given ?? '', operation.expected)
  ).length;
  return { correct, total: worksheet.operations.length };
}
