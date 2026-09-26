import { pupilKey, pupilLabel, type Level, type Pupil, type Trimester } from '../types';
import { cloudClient } from './cloud';
import { worksheetFromRow } from './correction';
import type { SessionResult } from './results';
import type { Worksheet } from './worksheet';

/**
 * Les feuilles d'opérations que la maîtresse a corrigées, sur la tablette de
 * l'élève.
 *
 * La tablette demande à la base la correction de SES feuilles : celles des
 * séances qu'elle a envoyées elle-même, désignées par leur identifiant tiré
 * au hasard (voir supabase/003_corrections_pour_les_eleves.sql). Elle les
 * garde pour les relire hors connexion. Une feuille reste « nouvelle » tant
 * que l'élève ne l'a pas ouverte — et le redevient si la maîtresse la
 * corrige à nouveau.
 */

const STORAGE_KEY = 'exercices-cm1-cm2:feuilles-corrigees';
/** Les feuilles gardées sur la tablette : les plus récemment corrigées. */
const MAX_KEPT = 12;
/** Les séances demandées à chaque fois : les plus récentes de la tablette. */
const MAX_ASKED = 50;

/** Ce que la tablette garde d'une feuille corrigée. */
export interface StoredCorrection {
  sessionId: string;
  pupil: Pupil;
  level: Level;
  trimester: Trimester;
  /** Date de la séance. */
  at: string;
  correctedAt: string;
  /** La ligne telle que la base l'a rendue : opérations, réponses, correction. */
  row: { operations: unknown; answers: unknown; corrections: unknown };
  /** La date de correction que l'élève a déjà vue. */
  seenCorrectedAt: string | null;
}

/** Une feuille corrigée, prête à afficher. */
export interface ReceivedCorrection {
  sessionId: string;
  worksheet: Worksheet;
  correctedAt: string;
  isNew: boolean;
}

/** Les séances dont la tablette demande la correction : ses opérations
 *  posées, les plus récentes d'abord. */
export function sessionIdsToAsk(sessions: SessionResult[]): string[] {
  return sessions
    .filter((session) => session.activity === 'posees')
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_ASKED)
    .map((session) => session.id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Relit ce que la tablette a gardé, en écartant ce qui n'a pas la bonne
 *  forme. */
export function parseStoredCorrections(raw: string | null): StoredCorrection[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? 'null');
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((entry): StoredCorrection[] => {
    if (
      !isRecord(entry) ||
      typeof entry.sessionId !== 'string' ||
      !isRecord(entry.pupil) ||
      typeof entry.pupil.firstName !== 'string' ||
      typeof entry.pupil.lastName !== 'string' ||
      (entry.level !== 'CM1' && entry.level !== 'CM2') ||
      ![1, 2, 3].includes(entry.trimester as number) ||
      typeof entry.at !== 'string' ||
      typeof entry.correctedAt !== 'string' ||
      !isRecord(entry.row)
    ) {
      return [];
    }
    return [
      {
        sessionId: entry.sessionId,
        pupil: { firstName: entry.pupil.firstName, lastName: entry.pupil.lastName },
        level: entry.level,
        trimester: entry.trimester as Trimester,
        at: entry.at,
        correctedAt: entry.correctedAt,
        row: { operations: entry.row.operations, answers: entry.row.answers, corrections: entry.row.corrections },
        seenCorrectedAt: typeof entry.seenCorrectedAt === 'string' ? entry.seenCorrectedAt : null,
      },
    ];
  });
}

/** Ajoute ce que la base vient de rendre à ce que la tablette savait déjà.
 *  Une ligne qui ne correspond à aucune séance de la tablette est ignorée. */
export function mergeCorrections(
  stored: StoredCorrection[],
  rows: unknown,
  sessions: SessionResult[]
): StoredCorrection[] {
  if (!Array.isArray(rows)) return stored;
  const byId = new Map(stored.map((entry) => [entry.sessionId, entry]));
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  rows.forEach((raw) => {
    if (!isRecord(raw) || typeof raw.session_id !== 'string' || typeof raw.corrected_at !== 'string') return;
    const session = sessionsById.get(raw.session_id);
    if (!session) return;
    byId.set(raw.session_id, {
      sessionId: raw.session_id,
      pupil: session.pupil,
      level: session.level,
      trimester: session.trimester,
      at: session.at,
      correctedAt: raw.corrected_at,
      row: { operations: raw.operations, answers: raw.answers, corrections: raw.corrections },
      seenCorrectedAt: byId.get(raw.session_id)?.seenCorrectedAt ?? null,
    });
  });
  return [...byId.values()]
    .sort((a, b) => b.correctedAt.localeCompare(a.correctedAt))
    .slice(0, MAX_KEPT);
}

/** Les feuilles corrigées d'un élève, la plus récemment corrigée d'abord. */
export function receivedFor(stored: StoredCorrection[], pupil: Pupil): ReceivedCorrection[] {
  const key = pupilKey(pupil);
  if (!key) return [];
  return stored
    .filter((entry) => pupilKey(entry.pupil) === key)
    .flatMap((entry) => {
      const worksheet = worksheetFromRow(entry.row, {
        name: pupilLabel(entry.pupil),
        level: entry.level,
        trimester: entry.trimester,
        createdAt: entry.at,
      });
      return worksheet
        ? [{ sessionId: entry.sessionId, worksheet, correctedAt: entry.correctedAt, isNew: entry.seenCorrectedAt !== entry.correctedAt }]
        : [];
    });
}

export function markSeen(stored: StoredCorrection[], sessionId: string): StoredCorrection[] {
  return stored.map((entry) =>
    entry.sessionId === sessionId ? { ...entry, seenCorrectedAt: entry.correctedAt } : entry
  );
}

/** Oublie les feuilles d'un élève — ou de tous, sans clé — quand ses
 *  données sont effacées de l'appareil. */
export function forgetCorrections(stored: StoredCorrection[], key: string | null): StoredCorrection[] {
  return key === null ? [] : stored.filter((entry) => pupilKey(entry.pupil) !== key);
}

export function loadStoredCorrections(): StoredCorrection[] {
  try {
    return parseStoredCorrections(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveStoredCorrections(stored: StoredCorrection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Stockage plein : on garde au moins les trois dernières.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(0, 3)));
    } catch {
      // Stockage refusé : les feuilles seront redemandées au prochain lancement.
    }
  }
}

/**
 * Demande à la base la correction des feuilles de la tablette. Rend la liste
 * à jour, ou `null` sans réseau, sans base configurée, ou sans feuille à
 * demander : ce qui était gardé reste valable.
 */
export async function fetchCorrections(sessions: SessionResult[]): Promise<StoredCorrection[] | null> {
  const ids = sessionIdsToAsk(sessions);
  if (ids.length === 0) return null;
  const supabase = await cloudClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('corrections_de_mes_feuilles', { p_session_ids: ids });
  if (error) return null;
  const merged = mergeCorrections(loadStoredCorrections(), data, sessions);
  saveStoredCorrections(merged);
  return merged;
}
