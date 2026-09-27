import type { Level } from '../types';
import type { Zone } from './calendrier';
import { withCorrections, type Corrections } from './correction';
import { proposalToRow, type ProblemProposal } from './classProblems';
import { draftToRow, type ClassQuestionDraft } from './classQuestions';
import {
  type EvaluationCopy,
  type EvaluationStatus,
  type EvaluationSummary,
  type TeacherEvaluation,
} from './evaluation';
import type { SessionResult } from './results';
import { buildDemoDataset, DEMO_CLASS_ID, DEMO_TEACHER_EMAIL, DEMO_TEACHER_ID } from './demoTeacherData';
import {
  nameKey,
  type ClassProblemEntry,
  type ClassQuestionEntry,
  type CloudClass,
  type EvaluationDraft,
  type TeacherAccount,
  type WorksheetStatus,
} from './teacherCloud';
import type { Worksheet } from './worksheet';

/**
 * La même interface que `teacherCloud.ts`, sans Supabase : une classe
 * fictive gardée en mémoire, qui répond exactement comme la vraie — la
 * maîtresse peut tout essayer, rien ne part sur le réseau, et tout
 * disparaît en quittant la démonstration (`resetDemoStore`).
 */

interface WorksheetEntry {
  worksheet: Worksheet;
  status: WorksheetStatus;
}

interface Store {
  classes: CloudClass[];
  worksheets: Record<string, WorksheetEntry>;
  classProblems: Record<string, ClassProblemEntry[]>;
  classQuestions: Record<string, ClassQuestionEntry[]>;
  evaluations: Record<string, EvaluationSummary>;
  evaluationItems: Record<string, TeacherEvaluation['items']>;
  evaluationCopies: Record<string, EvaluationCopy[]>;
}

function freshStore(): Store {
  const dataset = buildDemoDataset();
  const worksheets: Record<string, WorksheetEntry> = {};
  Object.entries(dataset.worksheets).forEach(([sessionId, entry]) => {
    worksheets[sessionId] = { worksheet: entry.worksheet, status: entry.status };
  });
  return {
    classes: [dataset.cloudClass],
    worksheets,
    classProblems: { [DEMO_CLASS_ID]: dataset.classProblems },
    classQuestions: { [DEMO_CLASS_ID]: dataset.classQuestions },
    evaluations: { [dataset.evaluationSummary.id]: dataset.evaluationSummary },
    evaluationItems: { [dataset.evaluationSummary.id]: dataset.evaluationDetail.items },
    evaluationCopies: { [dataset.evaluationSummary.id]: dataset.evaluationDetail.copies },
  };
}

let store = freshStore();

/** Efface toute trace de la visite précédente et refabrique la classe :
 *  appelée à l'entrée comme à la sortie de la démonstration. */
export function resetDemoStore(): void {
  store = freshStore();
}

function demoAccount(): TeacherAccount {
  return { id: DEMO_TEACHER_ID, email: DEMO_TEACHER_EMAIL };
}

export async function signIn(_email: string, _password: string): Promise<TeacherAccount> {
  return demoAccount();
}

export async function signUp(_email: string, _password: string): Promise<TeacherAccount | null> {
  return demoAccount();
}

export async function signOut(): Promise<void> {
  // Rien à faire : sortir de la démonstration se fait par son bandeau.
}

export async function currentTeacher(): Promise<TeacherAccount | null> {
  return demoAccount();
}

export async function readMyClasses(): Promise<CloudClass[]> {
  return structuredClone(store.classes);
}

export async function createClass(name: string, level: Level): Promise<{ id: string; joinCode: string }> {
  const id = `demo-classe-${crypto.randomUUID()}`;
  const joinCode = `DEMO${String(store.classes.length + 1).padStart(2, '0')}`;
  store.classes.push({
    id,
    name: name || 'Nouvelle classe',
    level,
    joinCode,
    zone: null,
    sessions: [],
    pupils: [],
    pupilIds: {},
  });
  store.classProblems[id] = [];
  store.classQuestions[id] = [];
  return { id, joinCode };
}

export async function setClassZone(classId: string, zone: Zone): Promise<void> {
  const target = store.classes.find((entry) => entry.id === classId);
  if (target) target.zone = zone;
}

export async function deletePupil(pupilId: string): Promise<void> {
  store.classes.forEach((cls) => {
    const key = Object.entries(cls.pupilIds).find(([, id]) => id === pupilId)?.[0];
    if (!key) return;
    cls.pupils = cls.pupils.filter((pupil) => nameKey(pupil.firstName, pupil.lastName) !== key);
    cls.sessions = cls.sessions.filter((session) => nameKey(session.pupil.firstName, session.pupil.lastName) !== key);
    delete cls.pupilIds[key];
  });
}

export async function readWorksheetIndex(): Promise<Record<string, WorksheetStatus>> {
  return Object.fromEntries(Object.entries(store.worksheets).map(([id, entry]) => [id, entry.status]));
}

export async function readWorksheet(session: SessionResult): Promise<Worksheet> {
  const entry = store.worksheets[session.id];
  if (!entry) throw new Error('Cette feuille est introuvable, ou illisible.');
  return structuredClone(entry.worksheet);
}

export async function saveCorrection(sessionId: string, corrections: Corrections): Promise<string> {
  const entry = store.worksheets[sessionId];
  if (!entry) throw new Error('La correction n’a pas été enregistrée : cette feuille n’est plus dans votre classe.');
  const correctedAt = new Date().toISOString();
  entry.worksheet = withCorrections(entry.worksheet, corrections);
  entry.status = { correctedAt };
  return correctedAt;
}

export async function readClassProblems(classId: string): Promise<ClassProblemEntry[]> {
  return structuredClone(store.classProblems[classId] ?? []);
}

export async function addClassProblem(classId: string, proposal: ProblemProposal): Promise<void> {
  const row = proposalToRow(proposal, classId);
  const entry: ClassProblemEntry = {
    id: `demo-probleme-${crypto.randomUUID()}`,
    enonce: row.enonce,
    reponse: row.reponse,
    unite: row.unite,
    fausses_reponses: row.fausses_reponses,
    trimestre: row.trimestre,
    calcul: row.calcul,
    actif: true,
  };
  store.classProblems[classId] = [...(store.classProblems[classId] ?? []), entry];
}

export async function setClassProblemActive(id: string, actif: boolean): Promise<void> {
  Object.values(store.classProblems).forEach((list) => {
    const target = list.find((problem) => problem.id === id);
    if (target) target.actif = actif;
  });
}

export async function deleteClassProblem(id: string): Promise<void> {
  Object.keys(store.classProblems).forEach((classId) => {
    store.classProblems[classId] = store.classProblems[classId].filter((problem) => problem.id !== id);
  });
}

export async function readClassQuestions(classId: string): Promise<ClassQuestionEntry[]> {
  return structuredClone(store.classQuestions[classId] ?? []);
}

export async function addClassQuestion(classId: string, draft: ClassQuestionDraft): Promise<void> {
  const row = draftToRow(draft, classId);
  const entry: ClassQuestionEntry = {
    id: `demo-question-${crypto.randomUUID()}`,
    domain: row.domain,
    enonce: row.enonce,
    reponse: row.reponse,
    fausses_reponses: row.fausses_reponses,
    trimestre: row.trimestre,
    actif: true,
  };
  store.classQuestions[classId] = [...(store.classQuestions[classId] ?? []), entry];
}

export async function setClassQuestionActive(id: string, actif: boolean): Promise<void> {
  Object.values(store.classQuestions).forEach((list) => {
    const target = list.find((question) => question.id === id);
    if (target) target.actif = actif;
  });
}

export async function deleteClassQuestion(id: string): Promise<void> {
  Object.keys(store.classQuestions).forEach((classId) => {
    store.classQuestions[classId] = store.classQuestions[classId].filter((question) => question.id !== id);
  });
}

export async function readEvaluations(classId: string): Promise<EvaluationSummary[]> {
  void classId;
  return structuredClone(Object.values(store.evaluations));
}

export async function readCopies(evaluationId: string): Promise<EvaluationCopy[]> {
  return structuredClone(store.evaluationCopies[evaluationId] ?? []);
}

export async function readEvaluation(summary: EvaluationSummary): Promise<TeacherEvaluation> {
  const items = store.evaluationItems[summary.id];
  if (!items) throw new Error('Cette évaluation est introuvable, ou illisible.');
  const copies = store.evaluationCopies[summary.id] ?? [];
  return { ...summary, items: structuredClone(items), copies: structuredClone(copies) };
}

export async function createEvaluation(classId: string, draft: EvaluationDraft): Promise<string> {
  void classId;
  const id = `demo-evaluation-${crypto.randomUUID()}`;
  const summary: EvaluationSummary = {
    id,
    title: draft.title.trim(),
    subject: draft.subject,
    period: draft.period,
    trimester: draft.trimester,
    status: 'preparee',
    createdAt: new Date().toISOString(),
    openedAt: null,
    closedAt: null,
    questionCount: draft.items.length,
    copyCount: 0,
  };
  store.evaluations[id] = summary;
  store.evaluationItems[id] = draft.items;
  store.evaluationCopies[id] = [];
  return id;
}

export async function setEvaluationStatus(id: string, status: Exclude<EvaluationStatus, 'preparee'>): Promise<void> {
  const summary = store.evaluations[id];
  if (!summary) throw new Error("Cette évaluation n'est plus dans votre classe.");
  const now = new Date().toISOString();
  store.evaluations[id] =
    status === 'ouverte' ? { ...summary, status, openedAt: now, closedAt: null } : { ...summary, status, closedAt: now };
}

export async function deleteEvaluation(id: string): Promise<void> {
  delete store.evaluations[id];
  delete store.evaluationItems[id];
  delete store.evaluationCopies[id];
}

export async function redoCopy(copyId: string): Promise<void> {
  Object.keys(store.evaluationCopies).forEach((evaluationId) => {
    store.evaluationCopies[evaluationId] = store.evaluationCopies[evaluationId].filter((copy) => copy.id !== copyId);
    const summary = store.evaluations[evaluationId];
    if (summary) store.evaluations[evaluationId] = { ...summary, copyCount: store.evaluationCopies[evaluationId].length };
  });
}
