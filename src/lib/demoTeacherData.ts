import { pupilLabel, type Domain, type Level, type Pupil, type Trimester } from '../types';
import { DEFAULT_ZONE } from './calendrier';
import { createRng, rngInt, type Rng } from './seededRandom';
import { buildSession } from './sessionBuilder';
import { buildWorksheet, type Worksheet } from './worksheet';
import {
  evaluationResults,
  freezeItems,
  isRightAnswer,
  type EvaluationAnswer,
  type EvaluationCopy,
  type EvaluationItem,
  type EvaluationSummary,
  type TeacherEvaluation,
} from './evaluation';
import type { SessionResult } from './results';
import { nameKey, type ClassProblemEntry, type ClassQuestionEntry, type CloudClass, type WorksheetStatus } from './teacherCloud';

/**
 * La classe de démonstration : des données fictives, entièrement fabriquées
 * par ce fichier — jamais par Supabase — pour qu'une visiteuse découvre
 * l'espace maîtresse sans compte ni élève réel.
 *
 * Tout ici est déterministe (`seededRandom`) : la classe est la même à
 * chaque ouverture de la démonstration, ce que vérifient les tests.
 */

export const DEMO_JOIN_CODE = 'DEMO01';
export const DEMO_CLASS_ID = 'demo-classe';
export const DEMO_CLASS_NAME = 'CM1 de Mme Martin';
export const DEMO_LEVEL: Level = 'CM1';
export const DEMO_TRIMESTER: Trimester = 1;
export const DEMO_TEACHER_ID = 'demo-maitresse';
export const DEMO_TEACHER_EMAIL = 'classe de démonstration';

/** Les huit élèves fictifs de la classe. */
export const DEMO_PUPILS: Pupil[] = [
  { firstName: 'Chloé', lastName: 'D' },
  { firstName: 'Léo', lastName: 'M' },
  { firstName: 'Inès', lastName: 'B' },
  { firstName: 'Adam', lastName: 'R' },
  { firstName: 'Jade', lastName: 'L' },
  { firstName: 'Nathan', lastName: 'P' },
  { firstName: 'Lina', lastName: 'K' },
  { firstName: 'Hugo', lastName: 'T' },
];

interface WorksheetEntry {
  session: SessionResult;
  worksheet: Worksheet;
  status: WorksheetStatus;
}

export interface DemoDataset {
  cloudClass: CloudClass;
  worksheets: Record<string, WorksheetEntry>;
  classProblems: ClassProblemEntry[];
  classQuestions: ClassQuestionEntry[];
  evaluationSummary: EvaluationSummary;
  evaluationDetail: TeacherEvaluation;
}

/** Le niveau de réussite propre à chaque élève : une classe de démonstration
 *  n'a d'intérêt que si elle montre de vrais écarts, comme une vraie classe. */
function skillOf(pupilIndex: number, domainIndex: number, rng: Rng): number {
  const base = 0.35 + ((pupilIndex * 2 + domainIndex) % 5) * 0.12;
  const jitter = (rng() - 0.5) * 0.1;
  return Math.min(0.95, Math.max(0.2, base + jitter));
}

function domainResult(rng: Rng, ratio: number, count: number): number {
  let correct = 0;
  for (let i = 0; i < count; i++) if (rng() < ratio) correct++;
  return correct;
}

const WEEKDAY_MS = 24 * 60 * 60 * 1000;

/** Une date de rentrée 2026, décalée de quelques jours par élève et par
 *  semaine : des séances qui s'étalent, comme une vraie classe qui avance. */
function sessionDate(weekOffset: number, pupilIndex: number): string {
  const base = Date.UTC(2026, 8, 2, 9, 0, 0); // mercredi 2 septembre 2026, 9 h.
  const day = base + weekOffset * 7 * WEEKDAY_MS + (pupilIndex % 4) * WEEKDAY_MS;
  return new Date(day).toISOString();
}

/** Une séance de questions, sans feuille : son résultat par notion est tiré
 *  au sort selon le niveau propre à l'élève dans chacune. */
function questionsSession(
  pupil: Pupil,
  pupilIndex: number,
  subject: SessionResult['subject'],
  domains: Domain[],
  weekOffset: number,
  seed: number
): SessionResult {
  const rng = createRng(seed);
  const results = domains.map((domain, domainIndex) => {
    const ratio = skillOf(pupilIndex, domainIndex, rng);
    const total = rngInt(rng, 3, 5);
    return { domain, correct: domainResult(rng, ratio, total), total };
  });
  return {
    id: `demo-seance-${pupilIndex}-${subject}-${weekOffset}`,
    pupil,
    at: sessionDate(weekOffset, pupilIndex),
    level: DEMO_LEVEL,
    trimester: DEMO_TRIMESTER,
    subject,
    activity: 'questions',
    domains: results,
  };
}

/** Une feuille d'opérations posées, avec ses réponses d'élève : de quoi
 *  remplir la file « à corriger » d'une vraie maîtresse. */
function posedWorksheet(
  pupil: Pupil,
  pupilIndex: number,
  weekOffset: number,
  seed: number,
  corrected: boolean
): WorksheetEntry {
  const rng = createRng(seed);
  const createdAt = sessionDate(weekOffset, pupilIndex);
  const worksheet = buildWorksheet({ name: pupilLabel(pupil), level: DEMO_LEVEL, trimester: DEMO_TRIMESTER, seed, createdAt });
  const ratio = skillOf(pupilIndex, 1, rng);
  let correct = 0;
  worksheet.operations.forEach((operation) => {
    const isRight = rng() < ratio;
    if (isRight) correct++;
    const given = isRight ? operation.expected : wrongAnswer(operation.expected, rng);
    worksheet.answers[operation.id] = { given, strokes: [] };
  });
  if (corrected) worksheet.appreciation = APPRECIATIONS[pupilIndex % APPRECIATIONS.length];
  const session: SessionResult = {
    id: `demo-posees-${pupilIndex}`,
    pupil,
    at: createdAt,
    level: DEMO_LEVEL,
    trimester: DEMO_TRIMESTER,
    subject: 'maths',
    activity: 'posees',
    domains: [{ domain: 'calcul', correct, total: worksheet.operations.length }],
  };
  return {
    session,
    worksheet,
    status: { correctedAt: corrected ? sessionDate(weekOffset, pupilIndex) : null },
  };
}

const APPRECIATIONS = [
  'Bon travail, continue ainsi.',
  'Attention aux retenues, on y retravaille.',
  'Beaucoup de progrès, bravo.',
  'Encore quelques hésitations sur les grands nombres.',
];

function wrongAnswer(expected: string, rng: Rng): string {
  const value = Number(expected.replace(',', '.'));
  if (!Number.isFinite(value)) return '0';
  const offset = rngInt(rng, 1, 9) * (rng() < 0.5 ? -1 : 1);
  return String(Math.max(0, Math.round(value + offset)));
}

/** Les questions et opérations d'une évaluation de fin de période, figées
 *  comme le ferait une vraie maîtresse dans le créateur d'évaluation. */
function buildEvaluationItems(seed: number): EvaluationItem[] {
  const session = buildSession({
    domains: ['numeration', 'calcul', 'problemes'],
    level: DEMO_LEVEL,
    trimester: DEMO_TRIMESTER,
    seed,
    count: 9,
  });
  const worksheet = buildWorksheet({ name: '', level: DEMO_LEVEL, trimester: DEMO_TRIMESTER, seed: seed + 1, count: 2 });
  const items: EvaluationItem[] = [
    ...session.questions.map((question): EvaluationItem => ({ kind: 'question', question })),
    ...worksheet.operations.map((operation): EvaluationItem => ({ kind: 'operation', operation })),
  ];
  return freezeItems(items);
}

/** La réponse d'un élève à une question ou une opération de l'évaluation,
 *  juste ou fausse selon son niveau, mais toujours plausible. */
function answerFor(item: EvaluationItem, correct: boolean, rng: Rng): EvaluationAnswer {
  if (item.kind === 'operation') {
    return { given: correct ? item.operation.expected : wrongAnswer(item.operation.expected, rng) };
  }
  const { question } = item;
  if (question.choices.length > 0) {
    const wrongIndex = (question.correctIndex + 1) % question.choices.length;
    return { given: correct ? question.correctIndex : wrongIndex };
  }
  return { given: [], correct };
}

function buildEvaluationCopy(
  pupil: Pupil,
  pupilIndex: number,
  items: EvaluationItem[],
  copyId: string,
  at: string
): EvaluationCopy {
  const rng = createRng(9000 + pupilIndex);
  const answers = items.map((item, index) => answerFor(item, rng() < skillOf(pupilIndex, index, rng), rng));
  const results = evaluationResults(items, answers);
  return {
    id: copyId,
    pupil,
    answers: items.map((item, index) => ({ given: answers[index].given, correct: isRightAnswer(item, answers[index]) })),
    results,
    at,
  };
}

const DEMO_CLASS_PROBLEMS_BASE: Array<Omit<ClassProblemEntry, 'id'>> = [
  {
    enonce: 'Léo a 24 billes. Il en gagne 15 à la récréation. Combien de billes a-t-il maintenant ?',
    reponse: '39',
    unite: 'billes',
    calcul: '24 + 15',
    fausses_reponses: ['9', '45', '29'],
    trimestre: 1,
    actif: true,
  },
  {
    enonce: "Une boulangère fait 6 fournées de 18 croissants. Combien de croissants a-t-elle faits en tout ?",
    reponse: '108',
    unite: 'croissants',
    calcul: '6 × 18',
    fausses_reponses: ['24', '96', '114'],
    trimestre: 1,
    actif: true,
  },
  {
    enonce: 'Une classe de 28 élèves se répartit en équipes de 4. Combien d’équipes forme-t-on ?',
    reponse: '7',
    unite: 'équipes',
    calcul: '28 ÷ 4',
    fausses_reponses: ['4', '6', '12'],
    trimestre: 2,
    actif: true,
  },
  {
    enonce: 'Un fermier récolte 145 kg de pommes le matin et 87 kg l’après-midi. Combien de kilos a-t-il récoltés ?',
    reponse: '232',
    unite: 'kg',
    calcul: '145 + 87',
    fausses_reponses: ['58', '222', '242'],
    trimestre: 1,
    actif: true,
  },
];

/** Quelques questions que la maîtresse a ajoutées elle-même, dans d'autres
 *  matières que les problèmes de maths — pour montrer que ça marche aussi
 *  en démonstration. */
const DEMO_CLASS_QUESTIONS_BASE: Array<Omit<ClassQuestionEntry, 'id'>> = [
  {
    domain: 'conjugaison',
    enonce: 'Conjugue le verbe « finir » à la troisième personne du pluriel, au présent.',
    reponse: 'ils finissent',
    fausses_reponses: ['ils finissaient', 'ils finiront'],
    trimestre: 1,
    actif: true,
  },
  {
    domain: 'chronologie',
    enonce: 'En quelle année a eu lieu la Révolution française ?',
    reponse: '1789',
    fausses_reponses: ['1889', '1715', '1848'],
    trimestre: 2,
    actif: true,
  },
  {
    domain: 'mots-geographie',
    enonce: 'Comment appelle-t-on une grande ville qui organise la vie autour d\'elle ?',
    reponse: 'une métropole',
    fausses_reponses: ['un hameau', 'un village'],
    trimestre: 1,
    actif: true,
  },
];

/** Construit la classe de démonstration, toujours la même : séances sur
 *  plusieurs semaines, feuilles à corriger, une évaluation terminée. */
export function buildDemoDataset(): DemoDataset {
  const pupilIds: Record<string, string> = {};
  const sessions: SessionResult[] = [];
  const worksheets: Record<string, WorksheetEntry> = {};

  DEMO_PUPILS.forEach((pupil, pupilIndex) => {
    pupilIds[nameKey(pupil.firstName, pupil.lastName)] = `demo-eleve-${pupilIndex}`;

    sessions.push(
      questionsSession(pupil, pupilIndex, 'francais', ['conjugaison', 'accords', 'orthographe'], 0, 1000 + pupilIndex),
      questionsSession(pupil, pupilIndex, 'maths', ['numeration', 'calcul', 'geometrie'], 1, 2000 + pupilIndex),
      questionsSession(pupil, pupilIndex, 'histoire', ['chronologie', 'evenements'], 2, 3000 + pupilIndex),
      questionsSession(pupil, pupilIndex, 'geographie', ['cartes', 'habiter'], 2, 4000 + pupilIndex)
    );

    // Les feuilles des trois premiers élèves attendent encore leur correction.
    const entry = posedWorksheet(pupil, pupilIndex, 3, 5000 + pupilIndex, pupilIndex >= 3);
    sessions.push(entry.session);
    worksheets[entry.session.id] = entry;
  });

  const evaluationItems = buildEvaluationItems(6000);
  const evaluationId = 'demo-evaluation-1';
  const openedAt = sessionDate(4, 0);
  const closedAt = sessionDate(4, 3);
  // Le dernier élève n'a pas rendu sa copie : une vraie classe en a toujours un.
  const submitted = DEMO_PUPILS.slice(0, 7);
  const copies = submitted.map((pupil, pupilIndex) =>
    buildEvaluationCopy(pupil, pupilIndex, evaluationItems, `demo-copie-${pupilIndex}`, sessionDate(4, pupilIndex))
  );
  submitted.forEach((pupil, pupilIndex) => {
    sessions.push({
      id: `demo-evaluation-session-${pupilIndex}`,
      pupil,
      at: sessionDate(4, pupilIndex),
      level: DEMO_LEVEL,
      trimester: DEMO_TRIMESTER,
      subject: 'maths',
      activity: 'evaluation',
      domains: copies[pupilIndex].results,
    });
  });

  const evaluationSummary: EvaluationSummary = {
    id: evaluationId,
    title: 'Maths — fin de la période 1',
    subject: 'maths',
    period: 1,
    trimester: DEMO_TRIMESTER,
    status: 'terminee',
    createdAt: sessionDate(3, 0),
    openedAt,
    closedAt,
    questionCount: evaluationItems.length,
    copyCount: copies.length,
  };

  const evaluationDetail: TeacherEvaluation = { ...evaluationSummary, items: evaluationItems, copies };

  const classProblems: ClassProblemEntry[] = DEMO_CLASS_PROBLEMS_BASE.map((problem, index) => ({
    ...problem,
    id: `demo-probleme-${index}`,
  }));

  const classQuestions: ClassQuestionEntry[] = DEMO_CLASS_QUESTIONS_BASE.map((question, index) => ({
    ...question,
    id: `demo-question-${index}`,
  }));

  const cloudClass: CloudClass = {
    id: DEMO_CLASS_ID,
    name: DEMO_CLASS_NAME,
    level: DEMO_LEVEL,
    joinCode: DEMO_JOIN_CODE,
    zone: DEFAULT_ZONE,
    sessions,
    pupils: DEMO_PUPILS,
    pupilIds,
  };

  return { cloudClass, worksheets, classProblems, classQuestions, evaluationSummary, evaluationDetail };
}
