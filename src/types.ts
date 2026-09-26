export type Level = 'CM1' | 'CM2';

/** Moment de l'année scolaire. La progression est cumulative : le trimestre 3
 *  révise aussi les notions vues aux trimestres 1 et 2. */
export type Trimester = 1 | 2 | 3;

export const ALL_TRIMESTERS: Trimester[] = [1, 2, 3];

export const TRIMESTER_LABELS: Record<Trimester, string> = {
  1: '1er trimestre',
  2: '2e trimestre',
  3: '3e trimestre',
};

/** Une matière au sens de l'école : le français d'un côté, les maths de
 *  l'autre. Une séance ne porte jamais sur les deux à la fois. */
export type Subject = 'francais' | 'maths';

/**
 * Ce que l'élève fait pendant la séance. Les questions à choix se répondent
 * du bout du doigt ; une opération posée s'écrit à la main, en colonnes, et
 * laisse une trace que la maîtresse pourra lire à la correction.
 */
export type Activity = 'questions' | 'posees';

export const ALL_ACTIVITIES: Activity[] = ['questions', 'posees'];

export const ACTIVITY_LABELS: Record<Activity, string> = {
  questions: 'Questions',
  posees: 'Opérations posées',
};

/** Poser une opération n'a de sens qu'en maths. */
export const SUBJECT_ACTIVITIES: Record<Subject, Activity[]> = {
  francais: ['questions'],
  maths: ['questions', 'posees'],
};

/** Une notion travaillée à l'intérieur d'une matière. */
export type Domain =
  | 'conjugaison'
  | 'accords'
  | 'orthographe'
  | 'numeration'
  | 'calcul'
  | 'problemes';

export interface Question {
  id: string;
  domain: Domain;
  /** Consigne affichée au-dessus de l'énoncé ("Complète au présent"). */
  instruction?: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export const ALL_SUBJECTS: Subject[] = ['francais', 'maths'];

export const SUBJECT_LABELS: Record<Subject, string> = {
  francais: 'Français',
  maths: 'Maths',
};

export const SUBJECT_EMOJI: Record<Subject, string> = {
  francais: '📖',
  maths: '🔢',
};

/** L'ordre des notions à l'intérieur d'une matière : c'est aussi l'ordre dans
 *  lequel les blocs de questions se suivent pendant une séance. */
export const SUBJECT_DOMAINS: Record<Subject, Domain[]> = {
  francais: ['conjugaison', 'accords', 'orthographe'],
  maths: ['numeration', 'calcul', 'problemes'],
};

export const DOMAIN_SUBJECT: Record<Domain, Subject> = {
  conjugaison: 'francais',
  accords: 'francais',
  orthographe: 'francais',
  numeration: 'maths',
  calcul: 'maths',
  problemes: 'maths',
};

export function subjectOf(domain: Domain): Subject {
  return DOMAIN_SUBJECT[domain];
}

export const ALL_DOMAINS: Domain[] = [...SUBJECT_DOMAINS.francais, ...SUBJECT_DOMAINS.maths];

export const DOMAIN_LABELS: Record<Domain, string> = {
  conjugaison: 'Conjugaison',
  accords: 'Accords',
  orthographe: 'Orthographe et vocabulaire',
  numeration: 'Numération',
  calcul: 'Calcul',
  problemes: 'Problèmes',
};
