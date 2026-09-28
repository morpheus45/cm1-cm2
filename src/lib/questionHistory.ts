import { pupilKey } from '../types';
import type { Pupil, Question, Subject } from '../types';

/**
 * La mémoire des questions déjà vues, par élève et par matière : elle ne
 * garde que des signatures d'énoncés (jamais un nom, une réponse ou quoi que
 * ce soit d'autre), pour que la séance du jour ne repose pas une question
 * posée dans les dix dernières séances de la même matière.
 *
 * Elle suit la même règle de conservation que le reste de la tablette (voir
 * conservation.ts) : effacée entièrement à la rentrée.
 */
const STORAGE_KEY = 'exercices-cm1-cm2:historique-questions';

/** Le nombre de séances de la matière que la mémoire couvre. */
const SESSIONS_REMEMBERED = 10;

/** Ce qui distingue deux questions pour cette mémoire : l'énoncé, pas les
 *  choix ni la bonne réponse — deux tirages du même énoncé restent la même
 *  question, même si les propositions sont mélangées différemment. */
export function questionSignature(question: Question): string {
  return [question.domain, question.instruction ?? '', question.prompt].join('§');
}

interface SessionSignatures {
  signatures: string[];
}

type SubjectHistory = SessionSignatures[];

type PupilHistory = Partial<Record<Subject, SubjectHistory>>;

type Store = Record<string, PupilHistory>;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Comme pour les autres données de la tablette, ce contenu vient du
 *  navigateur de l'élève : un historique mal formé est ignoré plutôt que de
 *  casser la séance. */
function parseStore(raw: string | null): Store {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null) return {};
  const store: Store = {};
  Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
    if (typeof value !== 'object' || value === null) return;
    const pupilHistory: PupilHistory = {};
    Object.entries(value as Record<string, unknown>).forEach(([subject, sessions]) => {
      if (!Array.isArray(sessions)) return;
      const validSessions = sessions
        .filter((session): session is { signatures: unknown } => typeof session === 'object' && session !== null)
        .map((session) => (session as { signatures: unknown }).signatures)
        .filter(isStringArray)
        .map((signatures): SessionSignatures => ({ signatures }));
      if (validSessions.length > 0) pupilHistory[subject as Subject] = validSessions;
    });
    if (Object.keys(pupilHistory).length > 0) store[key] = pupilHistory;
  });
  return store;
}

function loadStore(): Store {
  try {
    return parseStore(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
}

function saveStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Stockage refusé : la mémoire ne sera pas gardée, mais la séance a eu lieu.
  }
}

/**
 * Les signatures vues dans les dix dernières séances de la matière, des plus
 * anciennes aux plus récentes : en cas de manque, la séance du jour reprend
 * d'abord les plus anciennes (voir sessionBuilder.ts).
 */
export function recentSignatures(pupil: Pupil, subject: Subject): string[] {
  const sessions = loadStore()[pupilKey(pupil)]?.[subject] ?? [];
  const seen = new Set<string>();
  const ordered: string[] = [];
  sessions.forEach((session) =>
    session.signatures.forEach((signature) => {
      if (seen.has(signature)) return;
      seen.add(signature);
      ordered.push(signature);
    })
  );
  return ordered;
}

/** Note les questions qu'une séance vient de montrer, pour qu'elles ne
 *  reviennent pas tout de suite. */
export function recordShownQuestions(pupil: Pupil, subject: Subject, questions: Question[]): void {
  if (questions.length === 0) return;
  const store = loadStore();
  const key = pupilKey(pupil);
  const pupilHistory = store[key] ?? {};
  const subjectHistory = pupilHistory[subject] ?? [];
  const next = [...subjectHistory, { signatures: questions.map(questionSignature) }].slice(-SESSIONS_REMEMBERED);
  store[key] = { ...pupilHistory, [subject]: next };
  saveStore(store);
}

/** Efface toute la mémoire, pour tous les élèves : la règle de rentrée. */
export function forgetQuestionHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage refusé : il n'y a rien à effacer non plus.
  }
}
