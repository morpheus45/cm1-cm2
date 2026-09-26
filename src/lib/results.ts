import { ALL_DOMAINS, subjectOf } from '../types';
import type { Activity, Domain, Level, Subject, Trimester } from '../types';

/** Ce qu'une séance a produit, notion par notion. */
export interface DomainResult {
  domain: Domain;
  correct: number;
  total: number;
}

export interface SessionResult {
  id: string;
  /** Date de fin de séance, au format ISO. */
  at: string;
  level: Level;
  trimester: Trimester;
  subject: Subject;
  activity: Activity;
  domains: DomainResult[];
}

/**
 * Les quatre niveaux du livret scolaire unique. C'est le vocabulaire que la
 * maîtresse emploie déjà pour remplir le bulletin.
 */
export type Mastery = 1 | 2 | 3 | 4;

export const MASTERY_LABELS: Record<Mastery, string> = {
  1: 'Maîtrise insuffisante',
  2: 'Maîtrise fragile',
  3: 'Maîtrise satisfaisante',
  4: 'Très bonne maîtrise',
};

export const MASTERY_SHORT: Record<Mastery, string> = {
  1: 'insuffisante',
  2: 'fragile',
  3: 'satisfaisante',
  4: 'très bonne',
};

/**
 * Chaque couleur dépasse le rapport de contraste de 3:1 sur fond blanc, et
 * n'est jamais le seul porteur du sens : le niveau est toujours écrit à côté,
 * et numéroté de 1 à 4.
 */
export const MASTERY_COLORS: Record<Mastery, string> = {
  1: '#b42318',
  2: '#dc6803',
  3: '#3f8f2b',
  4: '#12502c',
};

/**
 * Seuils de réussite. Le livret scolaire ne fixe aucun pourcentage : ceux-ci
 * sont une convention de l'application, choisie pour qu'un élève qui réussit
 * les trois quarts d'un exercice soit dit « satisfaisant ». Ils sont
 * rassemblés ici pour qu'une maîtresse qui les trouve trop sévères n'ait
 * qu'un endroit à changer.
 */
export const MASTERY_THRESHOLDS: Array<{ min: number; mastery: Mastery }> = [
  { min: 0.85, mastery: 4 },
  { min: 0.65, mastery: 3 },
  { min: 0.4, mastery: 2 },
  { min: 0, mastery: 1 },
];

/**
 * En dessous de ce nombre de questions, aucun niveau n'est annoncé. Deux
 * bonnes réponses sur deux ne font pas une « très bonne maîtrise », et
 * afficher un niveau sur si peu tromperait la maîtresse.
 */
export const MINIMUM_ANSWERS_FOR_MASTERY = 8;

export function masteryOf(ratio: number): Mastery {
  const clamped = Math.min(1, Math.max(0, ratio));
  return (MASTERY_THRESHOLDS.find((step) => clamped >= step.min)?.mastery ?? 1) as Mastery;
}

export interface DomainSummary {
  domain: Domain;
  subject: Subject;
  correct: number;
  total: number;
  /** Part de réussite, ou null si l'élève n'a jamais travaillé cette notion. */
  ratio: number | null;
  /** null tant qu'il n'y a pas assez de questions pour se prononcer. */
  mastery: Mastery | null;
}

export function summariseByDomain(sessions: SessionResult[]): DomainSummary[] {
  return ALL_DOMAINS.map((domain) => {
    let correct = 0;
    let total = 0;
    sessions.forEach((session) =>
      session.domains
        .filter((entry) => entry.domain === domain)
        .forEach((entry) => {
          correct += entry.correct;
          total += entry.total;
        })
    );
    const ratio = total > 0 ? correct / total : null;
    return {
      domain,
      subject: subjectOf(domain),
      correct,
      total,
      ratio,
      mastery: total >= MINIMUM_ANSWERS_FOR_MASTERY && ratio !== null ? masteryOf(ratio) : null,
    };
  });
}

export interface SessionPoint {
  at: string;
  ratio: number;
}

/** Suite chronologique des séances, pour la courbe de progression. */
export function progressByDomain(
  sessions: SessionResult[],
  domain: Domain
): SessionPoint[] {
  return [...sessions]
    .sort((a, b) => a.at.localeCompare(b.at))
    .flatMap((session) =>
      session.domains
        .filter((entry) => entry.domain === domain && entry.total > 0)
        .map((entry) => ({ at: session.at, ratio: entry.correct / entry.total }))
    );
}

// --- Conservation locale ---------------------------------------------------

const STORAGE_KEY = 'exercices-cm1-cm2:resultats';

/** Au-delà, les plus anciennes séances sont oubliées : le stockage du
 *  navigateur est limité, et une année scolaire suffit largement. */
const MAX_SESSIONS = 300;

function isDomainResult(value: unknown): value is DomainResult {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    ALL_DOMAINS.includes(entry.domain as Domain) &&
    typeof entry.correct === 'number' &&
    typeof entry.total === 'number' &&
    Number.isFinite(entry.correct) &&
    Number.isFinite(entry.total) &&
    entry.total >= 0 &&
    entry.correct >= 0 &&
    entry.correct <= entry.total
  );
}

/** Comme pour les préférences, ce contenu vient du navigateur de l'élève :
 *  une séance mal formée est écartée plutôt que de casser le tableau de bord. */
export function parseResults(raw: string | null): SessionResult[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is SessionResult => {
    if (typeof item !== 'object' || item === null) return false;
    const session = item as Record<string, unknown>;
    return (
      typeof session.id === 'string' &&
      typeof session.at === 'string' &&
      !Number.isNaN(new Date(session.at).getTime()) &&
      (session.level === 'CM1' || session.level === 'CM2') &&
      [1, 2, 3].includes(session.trimester as number) &&
      (session.subject === 'francais' || session.subject === 'maths') &&
      Array.isArray(session.domains) &&
      session.domains.every(isDomainResult)
    );
  });
}

export function loadResults(): SessionResult[] {
  try {
    return parseResults(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveResults(sessions: SessionResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-MAX_SESSIONS)));
  } catch {
    // Stockage refusé : la séance ne sera pas conservée, mais elle a eu lieu.
  }
}

export function recordSession(session: SessionResult): SessionResult[] {
  const next = [...loadResults(), session];
  saveResults(next);
  return next.slice(-MAX_SESSIONS);
}
