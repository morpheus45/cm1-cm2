import * as demo from './demoTeacherCloud';
import { resetDemoStore } from './demoTeacherCloud';
import * as real from './teacherCloud';

/**
 * Le point unique où l'espace maîtresse choisit d'où viennent ses données :
 * de Supabase, comme d'habitude, ou de la classe de démonstration. Le reste
 * de l'application ne le sait pas — `TeacherSpace` et les écrans qu'il ouvre
 * appellent toujours les mêmes fonctions, importées d'ici plutôt que de
 * `teacherCloud` directement.
 *
 * Sans ce point unique, chaque écran devrait tester lui-même s'il est en
 * démonstration avant chaque appel : une source de données interchangeable
 * l'évite complètement.
 */

let demoActive = false;

export function isDemoActive(): boolean {
  return demoActive;
}

/** Entre en démonstration : une classe fraîche, jamais celle laissée par une
 *  visite précédente. */
export function enterDemo(): void {
  resetDemoStore();
  demoActive = true;
}

/** Sort de la démonstration et efface tout ce qu'elle contenait : rien n'en
 *  reste, ni pour la prochaine visiteuse, ni au-delà de cet onglet. */
export function exitDemo(): void {
  demoActive = false;
  resetDemoStore();
}

// --- Types et fonctions pures : identiques, qu'on soit en démonstration ou non ---
export type {
  ClassProblemEntry,
  CloudClass,
  EvaluationDraft,
  TeacherAccount,
  WorksheetStatus,
} from './teacherCloud';
export { frenchAuthError, mapClasses, mapProblemRows, mapWorksheetIndex, pupilIdFor } from './teacherCloud';

// --- Le reste : envoyé à Supabase, ou à la classe de démonstration ---
export const signIn: typeof real.signIn = (...args) => (demoActive ? demo.signIn(...args) : real.signIn(...args));
export const signUp: typeof real.signUp = (...args) => (demoActive ? demo.signUp(...args) : real.signUp(...args));
export const signOut: typeof real.signOut = (...args) => (demoActive ? demo.signOut(...args) : real.signOut(...args));
export const currentTeacher: typeof real.currentTeacher = (...args) =>
  demoActive ? demo.currentTeacher(...args) : real.currentTeacher(...args);
export const readMyClasses: typeof real.readMyClasses = (...args) =>
  demoActive ? demo.readMyClasses(...args) : real.readMyClasses(...args);
export const createClass: typeof real.createClass = (...args) =>
  demoActive ? demo.createClass(...args) : real.createClass(...args);
export const setClassZone: typeof real.setClassZone = (...args) =>
  demoActive ? demo.setClassZone(...args) : real.setClassZone(...args);
export const deletePupil: typeof real.deletePupil = (...args) =>
  demoActive ? demo.deletePupil(...args) : real.deletePupil(...args);
export const readWorksheetIndex: typeof real.readWorksheetIndex = (...args) =>
  demoActive ? demo.readWorksheetIndex(...args) : real.readWorksheetIndex(...args);
export const readWorksheet: typeof real.readWorksheet = (...args) =>
  demoActive ? demo.readWorksheet(...args) : real.readWorksheet(...args);
export const saveCorrection: typeof real.saveCorrection = (...args) =>
  demoActive ? demo.saveCorrection(...args) : real.saveCorrection(...args);
export const readClassProblems: typeof real.readClassProblems = (...args) =>
  demoActive ? demo.readClassProblems(...args) : real.readClassProblems(...args);
export const addClassProblem: typeof real.addClassProblem = (...args) =>
  demoActive ? demo.addClassProblem(...args) : real.addClassProblem(...args);
export const setClassProblemActive: typeof real.setClassProblemActive = (...args) =>
  demoActive ? demo.setClassProblemActive(...args) : real.setClassProblemActive(...args);
export const deleteClassProblem: typeof real.deleteClassProblem = (...args) =>
  demoActive ? demo.deleteClassProblem(...args) : real.deleteClassProblem(...args);
export const readEvaluations: typeof real.readEvaluations = (...args) =>
  demoActive ? demo.readEvaluations(...args) : real.readEvaluations(...args);
export const readCopies: typeof real.readCopies = (...args) =>
  demoActive ? demo.readCopies(...args) : real.readCopies(...args);
export const readEvaluation: typeof real.readEvaluation = (...args) =>
  demoActive ? demo.readEvaluation(...args) : real.readEvaluation(...args);
export const createEvaluation: typeof real.createEvaluation = (...args) =>
  demoActive ? demo.createEvaluation(...args) : real.createEvaluation(...args);
export const setEvaluationStatus: typeof real.setEvaluationStatus = (...args) =>
  demoActive ? demo.setEvaluationStatus(...args) : real.setEvaluationStatus(...args);
export const deleteEvaluation: typeof real.deleteEvaluation = (...args) =>
  demoActive ? demo.deleteEvaluation(...args) : real.deleteEvaluation(...args);
export const redoCopy: typeof real.redoCopy = (...args) =>
  demoActive ? demo.redoCopy(...args) : real.redoCopy(...args);
