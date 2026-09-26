import type { SessionResult } from './results';
import type { CloudClass, WorksheetStatus } from './teacherCloud';

/**
 * Une maîtresse peut avoir plusieurs classes : un CM1 et un CM2, deux années
 * de suite, ou les deux niveaux d'une classe double. L'espace maîtresse en
 * montre une à la fois, et l'appareil se souvient de la dernière ouverte :
 * la tablette de la maîtresse rouvre sur sa classe du jour.
 */

const CHOSEN_CLASS_KEY = 'exercices-cm1-cm2:classe-choisie';
/** Une tablette d'école peut servir à plusieurs maîtresses : chacune retrouve
 *  sa classe, dans la limite de quelques comptes. */
const MAX_REMEMBERED = 8;

/** La classe à montrer : celle demandée si elle existe encore, sinon la
 *  première créée. */
export function pickCurrentClass(classes: CloudClass[], wantedId: string | null): CloudClass | null {
  return classes.find((entry) => entry.id === wantedId) ?? classes[0] ?? null;
}

/** Les feuilles d'opérations de la classe qui attendent leur correction, la
 *  plus ancienne d'abord : c'est l'ordre dans lequel « Corriger » les
 *  enchaîne. */
export function correctionQueue(
  cloudClass: CloudClass | null,
  worksheets: Record<string, WorksheetStatus>
): SessionResult[] {
  return (cloudClass?.sessions ?? [])
    .filter((session) => worksheets[session.id] && !worksheets[session.id].correctedAt)
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** Relit les choix enregistrés, en écartant tout ce qui n'a pas la bonne
 *  forme. */
export function parseChosenClasses(raw: string | null): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? 'null');
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
  return Object.fromEntries(
    Object.entries(parsed as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
  );
}

/** Ajoute le choix d'une maîtresse, le plus récent en dernier, et oublie les
 *  plus anciens au-delà de la limite. */
export function withChosenClass(
  chosen: Record<string, string>,
  teacherId: string,
  classId: string
): Record<string, string> {
  const others = Object.entries(chosen).filter(([id]) => id !== teacherId);
  return Object.fromEntries([...others, [teacherId, classId]].slice(-MAX_REMEMBERED));
}

export function loadChosenClass(teacherId: string): string | null {
  try {
    return parseChosenClasses(localStorage.getItem(CHOSEN_CLASS_KEY))[teacherId] ?? null;
  } catch {
    return null;
  }
}

export function saveChosenClass(teacherId: string, classId: string): void {
  try {
    const chosen = parseChosenClasses(localStorage.getItem(CHOSEN_CLASS_KEY));
    localStorage.setItem(CHOSEN_CLASS_KEY, JSON.stringify(withChosenClass(chosen, teacherId, classId)));
  } catch {
    // Navigation privée, stockage plein : la tablette rouvrira sur la
    // première classe, rien de plus.
  }
}
