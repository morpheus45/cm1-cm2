import type { Level, Trimester } from '../types';
import {
  roundStroke,
  type Stroke,
  type Worksheet,
  type WorksheetAnswer,
  type WorksheetOperation,
} from './worksheet';

/**
 * La correction d'une feuille d'opérations posées : les traits rouges de la
 * maîtresse, opération par opération, et son appréciation.
 *
 * C'est ce qui est enregistré dans la colonne `corrections` de la base. Le
 * numéro de version permettra de faire évoluer ce format sans qu'une
 * ancienne correction soit lue de travers.
 */
export interface Corrections {
  version: 1;
  appreciation: string;
  operations: Record<string, { teacherStrokes: Stroke[] }>;
}

/** Deux lignes au plus dans l'en-tête du PDF. */
export const APPRECIATION_MAX_LENGTH = 100;

export function cleanAppreciation(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, APPRECIATION_MAX_LENGTH);
}

/** Ce qui sera enregistré : les opérations sans annotation n'y figurent pas. */
export function correctionsOf(worksheet: Worksheet): Corrections {
  const operations: Corrections['operations'] = {};
  worksheet.operations.forEach((operation) => {
    const strokes = (worksheet.answers[operation.id]?.teacherStrokes ?? []).filter(
      (stroke) => stroke.points.length > 0
    );
    if (strokes.length > 0) operations[operation.id] = { teacherStrokes: strokes.map(roundStroke) };
  });
  return { version: 1, appreciation: cleanAppreciation(worksheet.appreciation ?? ''), operations };
}

export function isCorrectionEmpty(corrections: Corrections): boolean {
  return corrections.appreciation === '' && Object.keys(corrections.operations).length === 0;
}

function isPoint(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((coordinate) => typeof coordinate === 'number' && coordinate >= 0 && coordinate <= 1)
  );
}

/**
 * Des traits venus de la base. Un point hors du cadre, ou mal formé, est
 * écarté un par un : une trace abîmée s'affiche en partie plutôt que de
 * faire échouer tout l'écran.
 */
export function parseStrokes(raw: unknown): Stroke[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((stroke) => {
    const points = (stroke as { points?: unknown } | null)?.points;
    if (!Array.isArray(points)) return [];
    const kept = points.filter(isPoint).map(([x, y]) => [x, y] as [number, number]);
    return kept.length > 0 ? [{ points: kept }] : [];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseCorrections(raw: unknown): Corrections {
  const empty: Corrections = { version: 1, appreciation: '', operations: {} };
  if (!isRecord(raw)) return empty;
  const operations: Corrections['operations'] = {};
  if (isRecord(raw.operations)) {
    Object.entries(raw.operations).forEach(([id, entry]) => {
      const strokes = parseStrokes(isRecord(entry) ? entry.teacherStrokes : null);
      if (strokes.length > 0) operations[id] = { teacherStrokes: strokes };
    });
  }
  const appreciation = typeof raw.appreciation === 'string' ? cleanAppreciation(raw.appreciation) : '';
  return { version: 1, appreciation, operations };
}

/** Pose une correction sur la feuille : elle remplace la précédente. */
export function withCorrections(worksheet: Worksheet, corrections: Corrections): Worksheet {
  const answers: Record<string, WorksheetAnswer> = {};
  worksheet.operations.forEach((operation) => {
    const answer = worksheet.answers[operation.id];
    const teacherStrokes = corrections.operations[operation.id]?.teacherStrokes ?? [];
    if (answer) answers[operation.id] = { ...answer, teacherStrokes };
    else if (teacherStrokes.length > 0) answers[operation.id] = { given: '', strokes: [], teacherStrokes };
  });
  return { ...worksheet, answers, appreciation: corrections.appreciation };
}

export interface WorksheetMeta {
  name: string;
  level: Level;
  trimester: Trimester;
  createdAt: string;
}

/**
 * Reconstitue une feuille à partir d'une ligne de la table `worksheets`. Tout
 * est revérifié : une ligne sans opération lisible donne `null`, et l'écran
 * le dit, plutôt que de s'afficher cassé.
 */
export function worksheetFromRow(row: unknown, meta: WorksheetMeta): Worksheet | null {
  if (!isRecord(row) || !Array.isArray(row.operations)) return null;
  const operations: WorksheetOperation[] = row.operations.flatMap((entry) =>
    isRecord(entry) &&
    typeof entry.id === 'string' &&
    typeof entry.statement === 'string' &&
    typeof entry.expected === 'string'
      ? [{ id: entry.id, statement: entry.statement, expected: entry.expected }]
      : []
  );
  if (operations.length === 0) return null;

  const rawAnswers = isRecord(row.answers) ? row.answers : {};
  const answers: Record<string, WorksheetAnswer> = {};
  operations.forEach((operation) => {
    const entry = rawAnswers[operation.id];
    if (!isRecord(entry)) return;
    answers[operation.id] = {
      given: typeof entry.given === 'string' ? entry.given : '',
      strokes: parseStrokes(entry.strokes),
    };
  });

  return withCorrections({ ...meta, operations, answers }, parseCorrections(row.corrections));
}

/**
 * Coupe l'appréciation en lignes pour le PDF, entre deux mots. Un mot plus
 * long qu'une ligne est coupé net plutôt que de déborder de la page.
 */
export function wrapAppreciation(text: string, lineLength = 56, maxLines = 2): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of cleanAppreciation(text).split(' ').filter(Boolean)) {
    let rest = word;
    while (rest.length > lineLength) {
      if (current !== '') lines.push(current);
      current = '';
      lines.push(rest.slice(0, lineLength));
      rest = rest.slice(lineLength);
    }
    if (rest === '') continue;
    if (current === '') current = rest;
    else if (current.length + 1 + rest.length <= lineLength) current = `${current} ${rest}`;
    else {
      lines.push(current);
      current = rest;
    }
  }
  if (current !== '') lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, lineLength - 1)}…`;
  return kept;
}
