import {
  ALL_DOMAINS,
  ALL_SUBJECTS,
  DOMAIN_SUBJECT,
  ofSubject,
  pupilKey,
  pupilLabel,
  SUBJECT_LABELS,
  type Domain,
  type Level,
  type Pupil,
  type Question,
  type Subject,
  type Trimester,
} from '../types';
import type { PeriodNumber } from './calendrier';
import type { ClassProblem } from './classProblems';
import type { ClassQuestion } from './classQuestions';
import { isConstructionRight, type Construction, type Node } from './construction';
import { isDomainResult, masteryOf, type DomainResult, type Mastery } from './results';
import { buildSession } from './sessionBuilder';
import { buildWorksheet, isAnswerCorrect, type Stroke, type WorksheetOperation } from './worksheet';

/**
 * Les évaluations de la maîtresse.
 *
 * Elle choisit, pour une matière, les questions qu'elle veut poser, puis les
 * ouvre en classe. Les questions sont figées au moment du choix : ce sont des
 * données, pas une graine de hasard, et chaque élève reçoit exactement les
 * mêmes, dans le même ordre.
 *
 * Pendant l'évaluation, l'élève ne voit ni la correction ni sa note, comme
 * pour un contrôle sur papier. La base corrige chaque copie elle-même
 * (supabase/006_evaluations.sql) ; la tablette refait la même correction,
 * pour cibler ensuite la révision de l'élève.
 */

export type EvaluationItem =
  | { kind: 'question'; question: Question }
  | { kind: 'operation'; operation: WorksheetOperation };

/** Au-delà, une évaluation devient trop longue pour un enfant de CM1 — et la
 *  base la refuse. */
export const MAX_ITEMS = 40;

/** Ce que l'on conseille à la maîtresse : de quoi se prononcer sur chaque
 *  notion, en une séance de classe. */
export const ADVISED_PER_DOMAIN = 4;

/** La réponse d'un élève, telle qu'elle part dans sa copie. */
export interface EvaluationAnswer {
  /** L'index du choix, les points posés sur la grille, ou le résultat écrit. */
  given: number | Node[] | string | null;
  /** Une construction se vérifie sur la tablette, qui envoie son verdict. */
  correct?: boolean;
  /** Les traits d'une opération posée, pour la correction au stylet. */
  strokes?: Stroke[];
}

export function choiceAnswer(index: number): EvaluationAnswer {
  return { given: index };
}

export function constructionAnswer(construction: Construction, placed: Node[]): EvaluationAnswer {
  return { given: placed, correct: isConstructionRight(construction, placed) };
}

export function operationAnswer(given: string, strokes: Stroke[]): EvaluationAnswer {
  return { given, strokes };
}

/** La notion d'une question ; une opération posée, c'est du calcul. */
export function itemDomain(item: EvaluationItem): Domain {
  return item.kind === 'operation' ? 'calcul' : item.question.domain;
}

/** La même correction que la base : une réponse absente ou mal formée est
 *  fausse. */
export function isRightAnswer(item: EvaluationItem, answer: EvaluationAnswer | undefined): boolean {
  if (!answer) return false;
  if (item.kind === 'operation') {
    return typeof answer.given === 'string' && isAnswerCorrect(answer.given, item.operation.expected);
  }
  const { question } = item;
  if (question.choices.length > 0) {
    // La tablette envoie un nombre ; la base accepte aussi « 2 » écrit en
    // texte, et la tablette corrige de même.
    const index = typeof answer.given === 'string' && /^\d{1,4}$/.test(answer.given) ? Number(answer.given) : answer.given;
    return index === question.correctIndex;
  }
  return answer.correct === true;
}

/** Le résultat par notion, dans l'ordre où les notions apparaissent. */
export function evaluationResults(items: EvaluationItem[], answers: EvaluationAnswer[]): DomainResult[] {
  const byDomain = new Map<Domain, DomainResult>();
  items.forEach((item, index) => {
    const domain = itemDomain(item);
    const entry = byDomain.get(domain) ?? { domain, correct: 0, total: 0 };
    entry.total += 1;
    if (isRightAnswer(item, answers[index])) entry.correct += 1;
    byDomain.set(domain, entry);
  });
  return [...byDomain.values()];
}

// --- Relire ce qui vient de la base ------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isPoint = (value: unknown) => Array.isArray(value) && value.length === 2 && value.every(isFiniteNumber);
const isNode = (value: unknown): value is Node =>
  Array.isArray(value) && value.length === 2 && value.every((part) => Number.isInteger(part));
const isShapeList = (value: unknown) =>
  Array.isArray(value) && value.every((shape) => isRecord(shape) && typeof shape.kind === 'string');
const isOptionalText = (value: unknown) => value === undefined || typeof value === 'string';

function isFigure(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height) &&
    value.width > 0 &&
    value.height > 0 &&
    isShapeList(value.shapes) &&
    typeof value.alt === 'string'
  );
}

function isConstruction(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.grid) || !isRecord(value.rule)) return false;
  const { grid, rule } = value;
  const gridOk =
    isPoint(grid.origin) &&
    [grid.cols, grid.rows].every((size) => Number.isInteger(size) && (size as number) > 0) &&
    isFiniteNumber(grid.cell) &&
    grid.cell > 0;
  const ruleOk =
    rule.kind === 'points'
      ? Array.isArray(rule.expected) && rule.expected.every(isNode)
      : rule.kind === 'direction' &&
        isNode(rule.from) &&
        isNode(rule.along) &&
        (rule.relation === 'parallele' || rule.relation === 'perpendiculaire');
  return (
    gridOk &&
    ruleOk &&
    (value.target === 'noeud' || value.target === 'case') &&
    Number.isInteger(value.count) &&
    (value.count as number) >= 1 &&
    isShapeList(value.solution) &&
    (value.fixed === undefined || (Array.isArray(value.fixed) && value.fixed.every(isNode))) &&
    (value.preview === undefined || (isRecord(value.preview) && isNode(value.preview.through))) &&
    (value.mark === undefined || value.mark === 'point' || value.mark === 'etoile')
  );
}

function isQuestion(value: unknown): value is Question {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !ALL_DOMAINS.includes(value.domain as Domain) ||
    typeof value.prompt !== 'string' ||
    !isOptionalText(value.instruction) ||
    !isOptionalText(value.explanation) ||
    !Array.isArray(value.choices) ||
    !value.choices.every((choice) => typeof choice === 'string') ||
    !Number.isInteger(value.correctIndex) ||
    (value.figure !== undefined && !isFigure(value.figure))
  ) {
    return false;
  }
  const correctIndex = value.correctIndex as number;
  if (value.choices.length > 0) {
    return value.construction === undefined && correctIndex >= 0 && correctIndex < value.choices.length;
  }
  // Une construction se fait sur sa figure : sans figure, rien à toucher.
  return value.figure !== undefined && isConstruction(value.construction);
}

function isOperation(value: unknown): value is WorksheetOperation {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.statement === 'string' &&
    typeof value.expected === 'string'
  );
}

/**
 * Les questions d'une évaluation, relues avant d'être montrées. Une seule
 * question illisible rend toute l'évaluation illisible : une copie répond à
 * chaque question, dans l'ordre, et ne peut pas en sauter une. Une question
 * d'une autre matière la rend illisible aussi : une évaluation, comme une
 * séance, n'en mêle jamais deux.
 */
export function parseItems(raw: unknown, subject: Subject): EvaluationItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return null;
  const items: EvaluationItem[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) return null;
    if (entry.kind === 'question' && isQuestion(entry.question) && DOMAIN_SUBJECT[entry.question.domain] === subject) {
      items.push({ kind: 'question', question: entry.question });
    } else if (entry.kind === 'operation' && subject === 'maths' && isOperation(entry.operation)) {
      items.push({ kind: 'operation', operation: entry.operation });
    } else {
      return null;
    }
  }
  return items;
}

/** Une évaluation ouverte, telle que la reçoit la tablette de l'élève. */
export interface OpenEvaluation {
  id: string;
  title: string;
  subject: Subject;
  /** Le niveau de la classe : celui des questions. */
  level: Level;
  trimester: Trimester;
  /** Combien de questions : connu avant les questions elles-mêmes. */
  questionCount: number;
  /** L'empreinte des questions : si elle change, la tablette les redemande. */
  version: string;
  /** Les questions, une fois reçues ; `null` tant qu'elles ne le sont pas. */
  items: EvaluationItem[] | null;
  openedAt: string;
  /** Les copies de cette tablette que la base garde pour cette évaluation. */
  returnedCopyIds: string[];
}

/** Une évaluation dont la tablette a reçu les questions : on peut la
 *  commencer. */
export type ReadyEvaluation = OpenEvaluation & { items: EvaluationItem[] };

export function isReady(evaluation: OpenEvaluation): evaluation is ReadyEvaluation {
  return evaluation.items !== null;
}

/** Les questions reçues pour une évaluation, et l'empreinte qu'elles avaient. */
export interface ReceivedQuestions {
  version: string;
  items: unknown;
}

const isSubject = (value: unknown): value is Subject => ALL_SUBJECTS.includes(value as Subject);
const isTrimester = (value: unknown): value is Trimester => [1, 2, 3].includes(value as number);
const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_ITEMS;

/**
 * Ce que rend `evaluations_ouvertes`, avec les questions déjà reçues par la
 * tablette. Une évaluation illisible est écartée : mieux vaut ne pas la
 * proposer que de la montrer à moitié. Des questions illisibles, ou d'une
 * autre version, comptent comme pas encore reçues.
 */
export function parseOpenEvaluations(raw: unknown, questions: Record<string, ReceivedQuestions> = {}): OpenEvaluation[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row): OpenEvaluation[] => {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.title !== 'string') return [];
    if (!isSubject(row.subject) || !isTrimester(row.trimester) || !isCount(row.question_count)) return [];
    if ((row.level !== 'CM1' && row.level !== 'CM2') || typeof row.version !== 'string') return [];
    const received = questions[row.id];
    const items = received && received.version === row.version ? parseItems(received.items, row.subject) : null;
    return [
      {
        id: row.id,
        title: row.title,
        subject: row.subject,
        level: row.level,
        trimester: row.trimester,
        questionCount: row.question_count,
        version: row.version,
        items: items && items.length === row.question_count ? items : null,
        openedAt: typeof row.opened_at === 'string' ? row.opened_at : '',
        returnedCopyIds: Array.isArray(row.rendues)
          ? row.rendues.filter((id): id is string => typeof id === 'string')
          : [],
      },
    ];
  });
}

export type EvaluationStatus = 'preparee' | 'ouverte' | 'terminee';

export const STATUS_LABELS: Record<EvaluationStatus, string> = {
  preparee: 'Préparée',
  ouverte: 'Ouverte aux élèves',
  terminee: 'Terminée',
};

/** La copie d'un élève, corrigée par la base. */
export interface EvaluationCopy {
  id: string;
  pupil: Pupil;
  /** Une réponse par question : ce que l'élève a donné, et si c'est juste. */
  answers: Array<{ given: unknown; correct: boolean }>;
  results: DomainResult[];
  at: string;
}

/** Une évaluation dans la liste de la maîtresse : sans ses questions ni ses
 *  copies, que l'on ne charge qu'en l'ouvrant. */
export interface EvaluationSummary {
  id: string;
  title: string;
  subject: Subject;
  period: PeriodNumber | null;
  trimester: Trimester;
  status: EvaluationStatus;
  createdAt: string;
  openedAt: string | null;
  closedAt: string | null;
  questionCount: number;
  copyCount: number;
}

/** Une évaluation ouverte par la maîtresse : ses questions et ses copies. */
export interface TeacherEvaluation extends EvaluationSummary {
  items: EvaluationItem[];
  copies: EvaluationCopy[];
}

function parseCopy(raw: unknown): EvaluationCopy | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.at !== 'string') return null;
  if (!Array.isArray(raw.answers) || !Array.isArray(raw.results) || !raw.results.every(isDomainResult)) return null;
  return {
    id: raw.id,
    pupil: {
      firstName: typeof raw.first_name === 'string' ? raw.first_name : '',
      lastName: typeof raw.last_name === 'string' ? raw.last_name : '',
    },
    answers: raw.answers.map((answer) => ({
      given: isRecord(answer) ? answer.given : null,
      correct: isRecord(answer) && answer.correct === true,
    })),
    results: raw.results,
    at: raw.at,
  };
}

/** Ce que rend `lire_evaluations`. */
export function parseEvaluationSummaries(raw: unknown): EvaluationSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row): EvaluationSummary[] => {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.title !== 'string') return [];
    if (!isSubject(row.subject) || !isTrimester(row.trimester) || typeof row.created_at !== 'string') return [];
    const status = row.status as EvaluationStatus;
    if (!['preparee', 'ouverte', 'terminee'].includes(status) || !isCount(row.question_count)) return [];
    return [
      {
        id: row.id,
        title: row.title,
        subject: row.subject,
        period: [1, 2, 3, 4, 5].includes(row.period as number) ? (row.period as PeriodNumber) : null,
        trimester: row.trimester,
        status,
        createdAt: row.created_at,
        openedAt: typeof row.opened_at === 'string' ? row.opened_at : null,
        closedAt: typeof row.closed_at === 'string' ? row.closed_at : null,
        questionCount: row.question_count,
        copyCount: Number.isInteger(row.copy_count) ? (row.copy_count as number) : 0,
      },
    ];
  });
}

/** Ce que rend `lire_copies`. Une copie mal formée est écartée. */
export function parseCopies(raw: unknown): EvaluationCopy[] {
  return (Array.isArray(raw) ? raw : []).map(parseCopy).filter((copy): copy is EvaluationCopy => copy !== null);
}

/** Une évaluation de la liste, avec ses questions et ses copies ; `null` si
 *  ses questions sont illisibles. */
export function withDetail(summary: EvaluationSummary, rawItems: unknown, rawCopies: unknown): TeacherEvaluation | null {
  const items = parseItems(rawItems, summary.subject);
  if (!items) return null;
  const copies = parseCopies(rawCopies);
  return { ...summary, items, copies, copyCount: copies.length };
}

// --- Préparer une évaluation --------------------------------------------------

/** « Maths — fin de la période 1 » : le titre proposé, que la maîtresse peut
 *  changer. */
export function evaluationTitle(subject: Subject, period: PeriodNumber | null): string {
  return period ? `${SUBJECT_LABELS[subject]} — fin de la période ${period}` : `Évaluation ${ofSubject(subject)}`;
}

/**
 * Des questions à proposer à la maîtresse, pour une notion : celles de
 * l'application, au niveau de la classe et au trimestre de la période. Ses
 * propres problèmes s'y mêlent, comme dans les séances.
 */
export function candidateQuestions(
  domain: Domain,
  level: Level,
  trimester: Trimester,
  seed: number,
  count: number,
  classProblems: ClassProblem[] = [],
  classQuestions: ClassQuestion[] = []
): Question[] {
  return buildSession({ domains: [domain], level, trimester, seed, count, classProblems, classQuestions }).questions;
}

export function candidateOperations(level: Level, trimester: Trimester, seed: number, count: number): WorksheetOperation[] {
  return buildWorksheet({ name: '', level, trimester, seed, count }).operations;
}

/** Ce qui distingue deux questions pour la maîtresse : deux tirages peuvent
 *  donner la même, qu'on ne lui propose pas deux fois. */
export function itemSignature(item: EvaluationItem): string {
  if (item.kind === 'operation') return `operation§${item.operation.statement}`;
  const { question } = item;
  return [
    question.domain,
    question.instruction ?? '',
    question.prompt,
    [...question.choices].sort().join('|'),
    question.choices[question.correctIndex] ?? '',
    question.construction ? JSON.stringify(question.construction.rule) : '',
  ].join('§');
}

/**
 * Fige les questions choisies, dans l'ordre où l'élève les verra : les
 * notions dans l'ordre de la matière, comme pendant une séance, et les
 * opérations posées à la fin. Chacune reçoit un identifiant propre à
 * l'évaluation.
 */
export function freezeItems(items: EvaluationItem[]): EvaluationItem[] {
  const rank = (item: EvaluationItem) => (item.kind === 'operation' ? ALL_DOMAINS.length : ALL_DOMAINS.indexOf(item.question.domain));
  let questions = 0;
  let operations = 0;
  return [...items]
    .sort((a, b) => rank(a) - rank(b))
    .map((item): EvaluationItem =>
      item.kind === 'question'
        ? { kind: 'question', question: { ...item.question, id: `q${++questions}` } }
        : { kind: 'operation', operation: { ...item.operation, id: `op${++operations}` } }
    );
}

// --- Les résultats, pour la maîtresse ---------------------------------------

export interface DomainOutcome extends DomainResult {
  mastery: Mastery;
}

export interface PupilOutcome {
  copyId: string;
  pupil: Pupil;
  at: string;
  correct: number;
  total: number;
  domains: DomainOutcome[];
  /** Les notions en maîtrise insuffisante : les lacunes. */
  lacunes: Domain[];
  /** Les notions en maîtrise fragile. */
  fragilites: Domain[];
}

export interface QuestionOutcome {
  index: number;
  item: EvaluationItem;
  domain: Domain;
  /** Combien d'élèves ont réussi la question. */
  success: number;
  /** Sur combien de copies. */
  copies: number;
}

/** Pour une notion, les élèves à reprendre : un groupe de besoin. */
export interface NeedGroup {
  domain: Domain;
  lacunes: Pupil[];
  fragilites: Pupil[];
}

export interface EvaluationAnalysis {
  pupils: PupilOutcome[];
  questions: QuestionOutcome[];
  groups: NeedGroup[];
  /** Les élèves connus de la classe qui n'ont pas rendu de copie. */
  missing: Pupil[];
}

const byLabel = (a: Pupil, b: Pupil) => pupilLabel(a).localeCompare(pupilLabel(b), 'fr');

/**
 * Ce que l'évaluation dit de la classe. Les niveaux sont ceux du livret
 * scolaire, calculés notion par notion sur les questions de l'évaluation :
 * la maîtresse a choisi ces questions pour se prononcer, le seuil de huit
 * réponses des tableaux de suivi ne s'applique donc pas.
 */
export function analyseEvaluation(evaluation: TeacherEvaluation, classPupils: Pupil[]): EvaluationAnalysis {
  const pupils = evaluation.copies
    .map((copy): PupilOutcome => {
      const domains = copy.results
        .filter((entry) => entry.total > 0)
        .map((entry) => ({ ...entry, mastery: masteryOf(entry.correct / entry.total) }));
      return {
        copyId: copy.id,
        pupil: copy.pupil,
        at: copy.at,
        correct: domains.reduce((sum, entry) => sum + entry.correct, 0),
        total: domains.reduce((sum, entry) => sum + entry.total, 0),
        domains,
        lacunes: domains.filter((entry) => entry.mastery === 1).map((entry) => entry.domain),
        fragilites: domains.filter((entry) => entry.mastery === 2).map((entry) => entry.domain),
      };
    })
    .sort((a, b) => byLabel(a.pupil, b.pupil));

  const questions = evaluation.items.map((item, index) => ({
    index,
    item,
    domain: itemDomain(item),
    success: evaluation.copies.filter((copy) => copy.answers[index]?.correct === true).length,
    copies: evaluation.copies.length,
  }));

  const domains = [...new Set(evaluation.items.map(itemDomain))];
  const groups = domains.map((domain) => ({
    domain,
    lacunes: pupils.filter((outcome) => outcome.lacunes.includes(domain)).map((outcome) => outcome.pupil),
    fragilites: pupils.filter((outcome) => outcome.fragilites.includes(domain)).map((outcome) => outcome.pupil),
  }));

  const returned = new Set(evaluation.copies.map((copy) => pupilKey(copy.pupil)));
  const missing = classPupils.filter((pupil) => !returned.has(pupilKey(pupil))).sort(byLabel);

  return { pupils, questions, groups, missing };
}

/** Ce que l'élève a répondu, écrit pour la maîtresse. */
export function givenLabel(item: EvaluationItem, given: unknown): string {
  if (given === null || given === undefined || given === '') return 'pas de réponse';
  if (item.kind === 'operation') return typeof given === 'string' ? given : 'réponse illisible';
  if (item.question.choices.length > 0) {
    return typeof given === 'number' && item.question.choices[given] !== undefined
      ? item.question.choices[given]
      : 'réponse illisible';
  }
  return Array.isArray(given) ? `${given.length} point${given.length > 1 ? 's' : ''} posé${given.length > 1 ? 's' : ''}` : 'construction';
}

/** La bonne réponse, écrite pour la maîtresse. */
export function expectedLabel(item: EvaluationItem): string {
  if (item.kind === 'operation') return item.operation.expected;
  if (item.question.choices.length > 0) return item.question.choices[item.question.correctIndex];
  return 'la construction attendue';
}
