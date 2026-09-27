import { pupilKey, type Pupil } from '../types';
import { cloudClient, isCloudConfigured, isValidJoinCode, normaliseJoinCode } from './cloud';
import { parseOpenEvaluations, type EvaluationAnswer, type OpenEvaluation, type ReceivedQuestions } from './evaluation';
import { roundStroke } from './worksheet';

/**
 * Les évaluations, sur la tablette de l'élève : celles que la maîtresse a
 * ouvertes, les copies qui attendent de partir, et où en est chaque élève.
 *
 * Une tablette peut servir à plusieurs élèves : tout est rangé par élève, et
 * un élève qui a quitté l'évaluation en cours de route la reprend là où il
 * s'était arrêté — même si la tablette a été éteinte entre-temps.
 */

const OPEN_KEY = 'exercices-cm1-cm2:evaluations-ouvertes';
const COPIES_KEY = 'exercices-cm1-cm2:copies-en-attente';
const PROGRESS_KEY = 'exercices-cm1-cm2:evaluations-en-cours';

/** Les copies qui attendent le réseau : bien plus que n'en produit une
 *  classe entre deux connexions. */
const MAX_PENDING = 100;
/** Les élèves suivis par tablette, toutes évaluations ouvertes confondues. */
const MAX_PROGRESS = 80;
/** Les identifiants de copies envoyés pour savoir lesquelles la base garde. */
const MAX_ASKED = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage refusé ou plein : cette fois, rien n'est gardé.
  }
}

// --- Les évaluations ouvertes -------------------------------------------------

export interface OpenEvaluations {
  evaluations: OpenEvaluation[];
  /** Quand la liste a été reçue ; `null` si elle ne l'a jamais été. */
  fetchedAt: string | null;
}

/** Ce que la tablette garde pour une classe : la dernière liste reçue, et les
 *  questions de chaque évaluation ouverte. */
interface StoredEvaluations {
  rows: unknown;
  questions: Record<string, ReceivedQuestions>;
  fetchedAt: string | null;
}

function readStored(code: string): StoredEvaluations {
  const stored = read(OPEN_KEY);
  if (!isRecord(stored) || stored.joinCode !== code) return { rows: [], questions: {}, fetchedAt: null };
  const questions = isRecord(stored.questions)
    ? Object.fromEntries(
        Object.entries(stored.questions).filter(
          (entry): entry is [string, ReceivedQuestions] => isRecord(entry[1]) && typeof entry[1].version === 'string'
        )
      )
    : {};
  return { rows: stored.rows, questions, fetchedAt: typeof stored.fetchedAt === 'string' ? stored.fetchedAt : null };
}

/** La dernière liste reçue pour ce code de classe : hors connexion, c'est
 *  elle qui sert. */
export function cachedOpenEvaluations(joinCode: string): OpenEvaluations {
  const stored = readStored(normaliseJoinCode(joinCode));
  return { evaluations: parseOpenEvaluations(stored.rows, stored.questions), fetchedAt: stored.fetchedAt };
}

/**
 * Va chercher les évaluations ouvertes de la classe. La liste est légère, et
 * se redemande souvent ; les questions d'une évaluation ne se demandent
 * qu'une fois, à son ouverture, puis restent sur la tablette. Sans réseau, ou
 * sans code, rien ne change et la fonction rend `null`.
 */
export async function refreshOpenEvaluations(joinCode: string): Promise<OpenEvaluations | null> {
  const code = normaliseJoinCode(joinCode);
  if (!isValidJoinCode(code) || !isCloudConfigured()) return null;
  const known = readStored(code).questions;
  const questions: Record<string, ReceivedQuestions> = {};
  let rows: unknown;
  try {
    const supabase = await cloudClient();
    if (!supabase) return null;
    const response = await supabase.rpc('evaluations_ouvertes', { p_join_code: code, p_copy_ids: askedCopyIds() });
    if (response.error) return null;
    rows = response.data;
    for (const evaluation of parseOpenEvaluations(rows)) {
      const kept = known[evaluation.id];
      if (kept && kept.version === evaluation.version) {
        questions[evaluation.id] = kept;
        continue;
      }
      const received = await supabase.rpc('questions_de_l_evaluation', { p_join_code: code, p_evaluation_id: evaluation.id });
      if (!received.error && received.data) questions[evaluation.id] = { version: evaluation.version, items: received.data };
    }
  } catch {
    // Hors connexion, la bibliothèque de Supabase peut même ne pas se charger.
    if (rows === undefined) return null;
  }
  const fetchedAt = new Date().toISOString();
  write(OPEN_KEY, { joinCode: code, rows, questions, fetchedAt });
  const evaluations = parseOpenEvaluations(rows, questions);
  saveProgress(afterRefresh(loadProgress(), code, evaluations, fetchedAt));
  return { evaluations, fetchedAt };
}

// --- Où en est chaque élève -----------------------------------------------------

/** Ce que la base a fait de la copie. */
export type CopyDelivery = 'en-attente' | 'rendue' | 'deja-faite' | 'refusee';

export interface EvaluationProgress {
  evaluationId: string;
  joinCode: string;
  pupil: Pupil;
  /** Les réponses déjà données, dans l'ordre. Vidées une fois la copie partie
   *  dans la file d'envoi : elles y sont. */
  answers: EvaluationAnswer[];
  startedAt: string;
  /** Une fois l'évaluation finie : l'identifiant de la copie. */
  copyId?: string;
  delivery?: CopyDelivery;
  /** Quand la base a confirmé qu'elle gardait la copie. */
  deliveredAt?: string;
}

const DELIVERIES: CopyDelivery[] = ['en-attente', 'rendue', 'deja-faite', 'refusee'];

export function parseProgress(raw: unknown): EvaluationProgress[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): EvaluationProgress[] => {
    if (
      !isRecord(entry) ||
      typeof entry.evaluationId !== 'string' ||
      typeof entry.joinCode !== 'string' ||
      !isRecord(entry.pupil) ||
      typeof entry.pupil.firstName !== 'string' ||
      typeof entry.pupil.lastName !== 'string' ||
      !Array.isArray(entry.answers) ||
      !entry.answers.every((answer) => isRecord(answer) && 'given' in answer) ||
      typeof entry.startedAt !== 'string'
    ) {
      return [];
    }
    return [
      {
        evaluationId: entry.evaluationId,
        joinCode: entry.joinCode,
        pupil: { firstName: entry.pupil.firstName, lastName: entry.pupil.lastName },
        answers: entry.answers as unknown as EvaluationAnswer[],
        startedAt: entry.startedAt,
        ...(typeof entry.copyId === 'string' ? { copyId: entry.copyId } : {}),
        ...(DELIVERIES.includes(entry.delivery as CopyDelivery) ? { delivery: entry.delivery as CopyDelivery } : {}),
        ...(typeof entry.deliveredAt === 'string' ? { deliveredAt: entry.deliveredAt } : {}),
      },
    ];
  });
}

export function loadProgress(): EvaluationProgress[] {
  return parseProgress(read(PROGRESS_KEY));
}

export function saveProgress(list: EvaluationProgress[]): void {
  write(PROGRESS_KEY, list.slice(-MAX_PROGRESS));
}

const sameEntry = (entry: EvaluationProgress, evaluationId: string, pupil: Pupil) =>
  entry.evaluationId === evaluationId && pupilKey(entry.pupil) === pupilKey(pupil);

export function progressFor(list: EvaluationProgress[], evaluationId: string, pupil: Pupil): EvaluationProgress | null {
  return list.find((entry) => sameEntry(entry, evaluationId, pupil)) ?? null;
}

/** Remplace l'avancement de cet élève pour cette évaluation. */
export function withProgress(list: EvaluationProgress[], entry: EvaluationProgress): EvaluationProgress[] {
  return [...list.filter((other) => !sameEntry(other, entry.evaluationId, entry.pupil)), entry];
}

export function withoutProgress(list: EvaluationProgress[], evaluationId: string, pupil: Pupil): EvaluationProgress[] {
  return list.filter((entry) => !sameEntry(entry, evaluationId, pupil));
}

/**
 * Après avoir reçu la liste des évaluations ouvertes d'une classe : ce qui
 * concerne une évaluation fermée entre-temps est oublié, et chaque copie que
 * la base dit garder est notée comme rendue.
 */
export function afterRefresh(
  list: EvaluationProgress[],
  joinCode: string,
  evaluations: OpenEvaluation[],
  fetchedAt: string
): EvaluationProgress[] {
  return list.flatMap((entry) => {
    if (entry.joinCode !== joinCode) return [entry];
    const evaluation = evaluations.find((candidate) => candidate.id === entry.evaluationId);
    if (!evaluation) return [];
    if (entry.copyId && evaluation.returnedCopyIds.includes(entry.copyId) && entry.delivery !== 'rendue') {
      return [{ ...entry, delivery: 'rendue' as const, deliveredAt: fetchedAt }];
    }
    return [entry];
  });
}

/** Les copies que cette tablette a rendues, dont elle demande des nouvelles. */
export function askedCopyIds(list: EvaluationProgress[] = loadProgress()): string[] {
  return list
    .map((entry) => entry.copyId)
    .filter((id): id is string => typeof id === 'string')
    .slice(-MAX_ASKED);
}

export type EvaluationState =
  | { kind: 'a-faire' }
  | { kind: 'en-cours'; answered: number }
  | { kind: 'rendue' }
  /** La maîtresse a effacé la copie : l'élève la refait. */
  | { kind: 'a-refaire'; previousCopyId: string };

/**
 * Où en est un élève pour une évaluation ouverte.
 *
 * Une copie compte comme rendue tant qu'elle attend dans la file d'envoi, ou
 * que la base la garde. Si la base l'avait reçue et ne l'a plus, c'est que la
 * maîtresse a demandé de refaire l'évaluation — à condition que la liste
 * soit plus récente que la confirmation : une liste reçue avant l'envoi ne
 * pouvait pas encore connaître la copie.
 */
export function evaluationState(
  evaluation: OpenEvaluation,
  pupil: Pupil,
  list: EvaluationProgress[],
  pendingCopyIds: string[],
  fetchedAt: string | null
): EvaluationState {
  const entry = progressFor(list, evaluation.id, pupil);
  if (!entry) return { kind: 'a-faire' };
  if (!entry.copyId) return { kind: 'en-cours', answered: Math.min(entry.answers.length, evaluation.questionCount) };
  if (evaluation.returnedCopyIds.includes(entry.copyId) || pendingCopyIds.includes(entry.copyId)) return { kind: 'rendue' };
  if (
    entry.delivery === 'rendue' &&
    entry.deliveredAt !== undefined &&
    fetchedAt !== null &&
    fetchedAt > entry.deliveredAt
  ) {
    return { kind: 'a-refaire', previousCopyId: entry.copyId };
  }
  return { kind: 'rendue' };
}

// --- La file des copies ---------------------------------------------------------

/**
 * Les paramètres de `rendre_evaluation`, dans le fichier SQL. Un test les
 * compare au fichier : une faute de frappe ici ne se verrait qu'en ligne, par
 * des copies qui n'arrivent jamais.
 */
export function copyParams(
  copyId: string,
  joinCode: string,
  evaluationId: string,
  pupil: Pupil,
  answers: EvaluationAnswer[]
) {
  return {
    p_copy_id: copyId,
    p_join_code: normaliseJoinCode(joinCode),
    p_evaluation_id: evaluationId,
    p_first_name: pupil.firstName,
    p_last_name: pupil.lastName,
    p_answers: answers.map((answer) =>
      answer.strokes ? { ...answer, strokes: answer.strokes.map(roundStroke) } : answer
    ),
  };
}

export type CopyParams = ReturnType<typeof copyParams>;

export function parseCopyOutbox(raw: unknown): CopyParams[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is CopyParams =>
      isRecord(item) &&
      typeof item.p_copy_id === 'string' &&
      typeof item.p_join_code === 'string' &&
      typeof item.p_evaluation_id === 'string' &&
      Array.isArray(item.p_answers)
  );
}

function readCopies(): CopyParams[] {
  return parseCopyOutbox(read(COPIES_KEY));
}

export function pendingCopyIds(): string[] {
  return readCopies().map((item) => item.p_copy_id);
}

export function enqueueCopy(params: CopyParams): void {
  const pending = readCopies().filter((item) => item.p_copy_id !== params.p_copy_id);
  write(COPIES_KEY, [...pending, params].slice(-MAX_PENDING));
}

/** Ce que devient une copie : reçue, déjà rendue par cet élève, en attente
 *  du réseau, ou refusée pour de bon. */
export type CopyOutcome = 'sent' | 'already' | 'queued' | 'rejected';

/** Les refus définitifs, qui viennent de `rendre_evaluation` : renvoyer la
 *  copie n'y changerait rien. */
export function isFinalRefusal(error: { message: string }): boolean {
  return /code de classe inconnu|évaluation inconnue|évaluation fermée|réponses illisibles|prénom manquant|identifiant de copie manquant/i.test(
    error.message
  );
}

/**
 * Tente d'envoyer toutes les copies qui attendent. Comme pour les séances,
 * seul un refus définitif fait sortir une copie de la file : un réseau absent,
 * ou une base pas encore prête, la laisse en attente. Renvoyer est sans
 * danger : la base reconnaît une copie déjà reçue.
 */
export async function flushCopies(
  send: (params: CopyParams) => Promise<{ data: unknown; error: { message: string } | null }>
): Promise<Record<string, CopyOutcome>> {
  const outcomes: Record<string, CopyOutcome> = {};
  const remaining: CopyParams[] = [];
  for (const params of readCopies()) {
    try {
      const { data, error } = await send(params);
      if (!error) {
        outcomes[params.p_copy_id] = data === 'deja_faite' ? 'already' : 'sent';
      } else if (isFinalRefusal(error)) {
        outcomes[params.p_copy_id] = 'rejected';
      } else {
        outcomes[params.p_copy_id] = 'queued';
        remaining.push(params);
      }
    } catch {
      outcomes[params.p_copy_id] = 'queued';
      remaining.push(params);
    }
  }
  write(COPIES_KEY, remaining);
  return outcomes;
}

export async function sendCopy(params: CopyParams) {
  const supabase = await cloudClient();
  if (!supabase) return { data: null, error: { message: 'non configuré' } };
  const { data, error } = await supabase.rpc('rendre_evaluation', params);
  return { data, error: error ? { message: error.message } : null };
}

/** Ce que la base a fait de chaque copie, reporté dans l'avancement des
 *  élèves. */
export function withOutcomes(
  list: EvaluationProgress[],
  outcomes: Record<string, CopyOutcome>,
  at: string
): EvaluationProgress[] {
  const delivery: Record<CopyOutcome, CopyDelivery> = {
    sent: 'rendue',
    already: 'deja-faite',
    queued: 'en-attente',
    rejected: 'refusee',
  };
  return list.map((entry) => {
    const outcome = entry.copyId ? outcomes[entry.copyId] : undefined;
    if (!outcome) return entry;
    return {
      ...entry,
      delivery: delivery[outcome],
      ...(outcome === 'sent' ? { deliveredAt: at } : {}),
    };
  });
}

/** Envoie ce qui attend, et note le résultat dans l'avancement des élèves. */
export async function deliverCopies(): Promise<Record<string, CopyOutcome>> {
  if (!isCloudConfigured() || readCopies().length === 0) return {};
  const outcomes = await flushCopies(sendCopy);
  saveProgress(withOutcomes(loadProgress(), outcomes, new Date().toISOString()));
  return outcomes;
}

/** À la rentrée : les évaluations, les copies et les avancements de l'an
 *  dernier. */
export function forgetEvaluations(): void {
  try {
    localStorage.removeItem(OPEN_KEY);
    localStorage.removeItem(COPIES_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Stockage refusé : il n'y avait rien à effacer.
  }
}
