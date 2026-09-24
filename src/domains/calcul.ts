import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngShuffle } from '../lib/seededRandom';

type Operation = '+' | '-' | '×' | '÷';

function randomDecimal(rng: Rng, max: number): number {
  return Math.round(rngInt(rng, 10, max * 10)) / 10;
}

function distractorsForResult(rng: Rng, correct: number, isDecimal: boolean): number[] {
  const candidates = new Set<number>();
  const step = isDecimal ? 0.1 : 1;
  let attempts = 0;
  while (candidates.size < 3 && attempts < 100) {
    attempts += 1;
    const offset = rngInt(rng, 1, 12) * step * (rngInt(rng, 0, 1) === 0 ? 1 : -1);
    const candidate = Math.round((correct + offset) * 10) / 10;
    if (candidate > 0 && candidate !== correct) {
      candidates.add(candidate);
    }
  }
  let fallback = correct + step;
  while (candidates.size < 3) {
    if (fallback !== correct && fallback > 0) candidates.add(Math.round(fallback * 10) / 10);
    fallback += step;
  }
  return Array.from(candidates);
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

interface BuiltOperation {
  a: number;
  b: number;
  op: Operation;
  result: number;
  isDecimal: boolean;
}

function buildCM1Operation(rng: Rng): BuiltOperation {
  const op = rngShuffle(rng, ['+', '-', '×', '÷'] as Operation[])[0];
  if (op === '+') {
    const a = rngInt(rng, 100, 500);
    const b = rngInt(rng, 100, 500);
    return { a, b, op, result: a + b, isDecimal: false };
  }
  if (op === '-') {
    const a = rngInt(rng, 200, 900);
    const b = rngInt(rng, 10, a - 1);
    return { a, b, op, result: a - b, isDecimal: false };
  }
  if (op === '×') {
    const a = rngInt(rng, 2, 9);
    const b = rngInt(rng, 2, 12);
    return { a, b, op, result: a * b, isDecimal: false };
  }
  const b = rngInt(rng, 2, 9);
  const result = rngInt(rng, 2, 12);
  return { a: b * result, b, op, result, isDecimal: false };
}

function buildCM2Operation(rng: Rng): BuiltOperation {
  const op = rngShuffle(rng, ['+', '-', '×', '÷'] as Operation[])[0];
  if (op === '+') {
    const a = randomDecimal(rng, 80);
    const b = randomDecimal(rng, 80);
    return { a, b, op, result: Math.round((a + b) * 10) / 10, isDecimal: true };
  }
  if (op === '-') {
    const a = randomDecimal(rng, 80) + 10;
    const b = randomDecimal(rng, Math.max(1, Math.floor(a) - 1));
    return { a, b, op, result: Math.round((a - b) * 10) / 10, isDecimal: true };
  }
  if (op === '×') {
    const a = rngInt(rng, 10, 99);
    const b = rngInt(rng, 2, 20);
    return { a, b, op, result: a * b, isDecimal: false };
  }
  const b = rngInt(rng, 2, 20);
  const result = rngInt(rng, 10, 50);
  return { a: b * result, b, op, result, isDecimal: false };
}

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const { a, b, op, result, isDecimal } = level === 'CM1' ? buildCM1Operation(rng) : buildCM2Operation(rng);
    const distractors = distractorsForResult(rng, result, isDecimal);
    const choices = rngShuffle(rng, [result, ...distractors].map(formatNumber));
    questions.push({
      id: `calcul-${i}-${op}-${a}-${b}`,
      domain: 'calcul',
      prompt: `Combien font ${formatNumber(a)} ${op} ${formatNumber(b)} ?`,
      choices,
      correctIndex: choices.indexOf(formatNumber(result)),
    });
  }
  return questions;
}
