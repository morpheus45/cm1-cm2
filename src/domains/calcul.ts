import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngShuffle } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';

type Operation = '+' | '-' | '×' | '÷';

export interface BuiltOperation {
  a: number;
  b: number;
  op: Operation;
  result: number;
  isDecimal: boolean;
}

export interface OperationKind {
  /** Étape à partir de laquelle la technique est au programme. */
  minStage: Stage;
  /**
   * Une opération « posée » s'écrit en colonnes sur le cahier. Les tables de
   * multiplication n'en sont pas : elles se récitent, les poser n'aurait
   * aucun sens.
   */
  posable: boolean;
  /**
   * `posed` indique que l'opération sera écrite en colonnes sur le cahier.
   * Les nombres sont alors plus grands : « 14 ÷ 7 » se fait de tête, le poser
   * ne fait travailler aucune technique.
   */
  build: (rng: Rng, stage: Stage, posed: boolean) => BuiltOperation;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function randomDecimal(rng: Rng, max: number): number {
  return rngInt(rng, 10, max * 10) / 10;
}

/**
 * Un décimal bon à poser : au moins deux chiffres devant la virgule, et une
 * partie décimale jamais nulle. Sans cela le tirage sortait « 37 + 1,8 », qui
 * ne fait travailler ni l'alignement des virgules ni la retenue.
 */
function posedDecimal(rng: Rng, min: number, max: number): number {
  const whole = rngInt(rng, min, Math.max(min, max));
  return whole + rngInt(rng, 1, 9) / 10;
}

/**
 * Techniques opératoires, dans l'ordre où elles sont enseignées :
 * addition/soustraction posées et tables (CM1-T1), multiplication par un
 * chiffre (T2), multiplication à deux chiffres et division (T3) ; révision des
 * quatre opérations sur de plus grands nombres (CM2-T1), puis les décimaux —
 * addition et soustraction (T2), multiplication et division (T3).
 */
const OPERATION_KINDS: OperationKind[] = [
  {
    minStage: 1,
    posable: true,
    build: (rng, stage) => {
      const bound = stage >= 4 ? 5000 : 500;
      const floorValue = stage >= 4 ? 1000 : 100;
      const a = rngInt(rng, floorValue, bound);
      const b = rngInt(rng, floorValue, bound);
      return { a, b, op: '+', result: a + b, isDecimal: false };
    },
  },
  {
    minStage: 1,
    posable: true,
    build: (rng, stage) => {
      const a = stage >= 4 ? rngInt(rng, 2000, 9000) : rngInt(rng, 200, 900);
      // Le reste garde de l'épaisseur : « 478 - 473 » ne fait pas travailler
      // la technique de la soustraction posée.
      const b = rngInt(rng, 10, Math.floor(a * 0.8));
      return { a, b, op: '-', result: a - b, isDecimal: false };
    },
  },
  {
    // Tables de multiplication : calcul mental, dès le premier trimestre.
    minStage: 1,
    posable: false,
    build: (rng) => {
      const a = rngInt(rng, 2, 9);
      const b = rngInt(rng, 2, 10);
      return { a, b, op: '×', result: a * b, isDecimal: false };
    },
  },
  {
    // Multiplication posée par un nombre à un chiffre.
    minStage: 2,
    posable: true,
    build: (rng, _stage, posed) => {
      const a = posed ? rngInt(rng, 112, 999) : rngInt(rng, 12, 99);
      const b = rngInt(rng, 2, 9);
      return { a, b, op: '×', result: a * b, isDecimal: false };
    },
  },
  {
    // Multiplication posée par un nombre à deux chiffres.
    minStage: 3,
    posable: true,
    build: (rng, stage, posed) => {
      const a = posed ? rngInt(rng, 112, 999) : rngInt(rng, 11, 99);
      const b = stage >= 4 ? rngInt(rng, 11, 99) : rngInt(rng, 11, 25);
      return { a, b, op: '×', result: a * b, isDecimal: false };
    },
  },
  {
    // Division euclidienne, toujours tombant juste.
    minStage: 3,
    posable: true,
    build: (rng, stage, posed) => {
      const b = stage >= 4 ? rngInt(rng, 2, 20) : rngInt(rng, 2, 9);
      // Posée, la division doit porter sur un dividende d'au moins trois
      // chiffres : c'est la technique qu'on travaille, pas la table.
      const result = posed
        ? rngInt(rng, 50, 99)
        : stage >= 4
          ? rngInt(rng, 10, 50)
          : rngInt(rng, 2, 12);
      return { a: b * result, b, op: '÷', result, isDecimal: false };
    },
  },
  {
    // Addition de nombres décimaux.
    minStage: 5,
    posable: true,
    build: (rng, _stage, posed) => {
      const a = posed ? posedDecimal(rng, 10, 80) : randomDecimal(rng, 80);
      const b = posed ? posedDecimal(rng, 10, 80) : randomDecimal(rng, 80);
      return { a, b, op: '+', result: round1(a + b), isDecimal: true };
    },
  },
  {
    // Soustraction de nombres décimaux.
    minStage: 5,
    posable: true,
    build: (rng, _stage, posed) => {
      if (posed) {
        const a = posedDecimal(rng, 30, 90);
        const b = posedDecimal(rng, 10, Math.floor(a) - 10);
        return { a, b, op: '-', result: round1(a - b), isDecimal: true };
      }
      const a = round1(randomDecimal(rng, 90) + 10);
      const b = randomDecimal(rng, Math.max(1, Math.floor(a) - 1));
      return { a, b, op: '-', result: round1(a - b), isDecimal: true };
    },
  },
  {
    // Multiplication d'un décimal par un entier.
    minStage: 6,
    posable: true,
    build: (rng, _stage, posed) => {
      const a = posed ? posedDecimal(rng, 10, 90) : randomDecimal(rng, 30);
      const b = rngInt(rng, 2, 9);
      return { a, b, op: '×', result: round1(a * b), isDecimal: true };
    },
  },
  {
    // Division donnant un quotient décimal exact.
    minStage: 6,
    posable: true,
    build: (rng, _stage, posed) => {
      const b = posed ? rngInt(rng, 3, 9) : rngInt(rng, 2, 9);
      const result = posed ? posedDecimal(rng, 20, 60) : randomDecimal(rng, 20);
      return { a: round1(result * b), b, op: '÷', result, isDecimal: true };
    },
  },
];

function distractorsForResult(rng: Rng, correct: number, isDecimal: boolean): number[] {
  const candidates = new Set<number>();
  const step = isDecimal ? 0.1 : 1;
  let attempts = 0;
  while (candidates.size < 3 && attempts < 100) {
    attempts += 1;
    const offset = rngInt(rng, 1, 12) * step * (rngInt(rng, 0, 1) === 0 ? 1 : -1);
    const candidate = round1(correct + offset);
    if (candidate > 0 && candidate !== correct) {
      candidates.add(candidate);
    }
  }
  let fallback = correct + step;
  while (candidates.size < 3) {
    if (fallback !== correct && fallback > 0) candidates.add(round1(fallback));
    fallback += step;
  }
  return Array.from(candidates);
}

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

/**
 * Tire `count` opérations parmi les techniques déjà enseignées, en faisant le
 * tour de ces techniques avant d'en reproposer une. `posableOnly` ne garde que
 * celles qui s'écrivent en colonnes.
 */
export function buildOperations(
  level: Level,
  trimester: Trimester,
  rng: Rng,
  count: number,
  { posableOnly = false }: { posableOnly?: boolean } = {}
): BuiltOperation[] {
  const stage = stageOf(level, trimester);
  const kinds = eligibleOperationKinds(level, trimester).filter(
    (kind) => !posableOnly || kind.posable
  );
  const order = rngShuffle(rng, kinds);
  return Array.from({ length: count }, (_, index) =>
    order[index % order.length].build(rng, stage, posableOnly)
  );
}

export function eligibleOperationKinds(level: Level, trimester: Trimester): OperationKind[] {
  const stage = stageOf(level, trimester);
  return OPERATION_KINDS.filter((kind) => kind.minStage <= stage);
}

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const questions: Question[] = [];
  const operations = buildOperations(level, trimester, rng, count);

  for (let i = 0; i < count; i++) {
    const { a, b, op, result, isDecimal } = operations[i];
    const distractors = distractorsForResult(rng, result, isDecimal);
    // Toutes les propositions sont écrites de la même façon : sinon le format
    // (« 14 » au milieu de « 13,1 ») désignerait la bonne réponse.
    const formatChoice = (n: number) => (isDecimal ? n.toFixed(1).replace('.', ',') : formatNumber(n));
    const choices = rngShuffle(rng, [result, ...distractors].map(formatChoice));
    questions.push({
      id: `calcul-${i}-${op}-${a}-${b}`,
      domain: 'calcul',
      instruction: 'Calcule',
      prompt: `${formatNumber(a)} ${op} ${formatNumber(b)}`,
      choices,
      correctIndex: choices.indexOf(formatChoice(result)),
    });
  }

  return questions;
}
