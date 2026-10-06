import type { Figure } from './lib/figures';
import type { Construction } from './lib/construction';

export type Level = 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6e' | '5e' | '4e' | '3e';

/** Les huit niveaux de l'application, dans l'ordre de la scolarité. */
export const ALL_LEVELS: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'];

export const LEVEL_LABELS: Record<Level, string> = {
  CE1: 'CE1',
  CE2: 'CE2',
  CM1: 'CM1',
  CM2: 'CM2',
  '6e': '6e',
  '5e': '5e',
  '4e': '4e',
  '3e': '3e',
};

/** Ce qui vient de la base ou du navigateur n'est un niveau que s'il en est
 *  un : on le vérifie plutôt que de le croire. */
export function isLevel(value: unknown): value is Level {
  return ALL_LEVELS.includes(value as Level);
}

/** Les cycles du programme : le 2 pour le CE1 et le CE2, le 3 du CM1 à la
 *  6e, le 4 de la 5e à la 3e. */
export type Cycle = 2 | 3 | 4;

export const CYCLE_OF_LEVEL: Record<Level, Cycle> = {
  CE1: 2,
  CE2: 2,
  CM1: 3,
  CM2: 3,
  '6e': 3,
  '5e': 4,
  '4e': 4,
  '3e': 4,
};

/**
 * Les niveaux que l'application propose : à l'élève, pour choisir sa classe,
 * et à la maîtresse, pour créer la sienne. La base et le code savent déjà les
 * huit niveaux de `ALL_LEVELS`, mais un niveau n'entre dans cette liste
 * qu'une fois ses questions écrites : elle s'allongera au fil des contenus.
 * Aujourd'hui, du CE1 à la 6e. Le CE1, le CE2 et la 6e n'ont que le français
 * et les maths : leur histoire et leur géographie ne sont pas écrites, et
 * `CONTENT_FROM` (src/lib/contenu.ts) les masque. La 5e, la 4e et la 3e
 * attendent leurs questions.
 */
export const AVAILABLE_LEVELS: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e'];

/** Les niveaux du collège : l'élève y a des professeurs, plus de maîtresse. */
const COLLEGE_LEVELS: Level[] = ['6e', '5e', '4e', '3e'];

/**
 * Le mot dont l'élève se sert pour parler de son enseignant : « ta
 * maîtresse » du CE1 au CM2, « ton professeur » de la 6e à la 3e. Il ne vaut
 * que pour ce que lit l'élève : l'espace maîtresse garde son vocabulaire.
 */
export function teacherWord(level: Level): string {
  return COLLEGE_LEVELS.includes(level) ? 'ton professeur' : 'ta maîtresse';
}

/** Le même mot en début de phrase : « Ta maîtresse corrigera ta copie. » */
export function teacherWordCapitalised(level: Level): string {
  const word = teacherWord(level);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Le même mot, avec l'article défini : « pour la maîtresse », « pour le
 *  professeur ». */
export function teacherWordDefinite(level: Level): string {
  return COLLEGE_LEVELS.includes(level) ? 'le professeur' : 'la maîtresse';
}

/**
 * Un élève. Le nom de famille reste facultatif : dans une famille le prénom
 * suffit, dans une classe de vingt-quatre avec deux Léa il ne suffit plus.
 */
export interface Pupil {
  firstName: string;
  lastName: string;
}

/** Ce qui identifie un élève : insensible aux accents, à la casse et aux
 *  espaces en trop, pour que « Léa  MARTIN » et « léa martin » soient le même
 *  enfant et non deux dossiers. */
export function pupilKey(pupil: Pupil): string {
  return [pupil.firstName, pupil.lastName]
    .map((part) =>
      part
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
    )
    .join(' ')
    .trim();
}

export function pupilLabel(pupil: Pupil): string {
  const lastName = pupil.lastName.trim();
  // Une initiale seule s'écrit avec son point : « Léa M. ».
  const shown = /^\p{L}$/u.test(lastName) ? `${lastName}.` : lastName;
  const label = [pupil.firstName.trim(), shown].filter(Boolean).join(' ');
  return label || 'Élève sans nom';
}

/** Moment de l'année scolaire. La progression est cumulative : le trimestre 3
 *  révise aussi les notions vues aux trimestres 1 et 2. */
export type Trimester = 1 | 2 | 3;

export const ALL_TRIMESTERS: Trimester[] = [1, 2, 3];

export const TRIMESTER_LABELS: Record<Trimester, string> = {
  1: '1er trimestre',
  2: '2e trimestre',
  3: '3e trimestre',
};

/** Une matière au sens de l'école. Une séance n'en mêle jamais deux : ni le
 *  français et les maths, ni l'histoire et la géographie. */
export type Subject = 'francais' | 'maths' | 'histoire' | 'geographie';

/**
 * Ce que l'élève fait pendant la séance. Les questions à choix se répondent
 * du bout du doigt ; une opération posée s'écrit à la main, en colonnes, et
 * laisse une trace que la maîtresse pourra lire à la correction.
 *
 * L'évaluation ne se choisit pas : seule la maîtresse la lance, et toute la
 * classe reçoit les mêmes questions (src/lib/evaluation.ts).
 */
export type Activity = 'questions' | 'posees' | 'tables' | 'revision' | 'evaluation';

/** Les types de séance enregistrés, ceux que la base accepte. Une série de
 *  tables de multiplication s'enregistre comme une séance de questions de
 *  calcul : elle n'y figure pas. */
export const ALL_ACTIVITIES: Activity[] = ['questions', 'posees', 'revision', 'evaluation'];

export const ACTIVITY_LABELS: Record<Activity, string> = {
  questions: 'Questions',
  posees: 'Opérations posées',
  tables: 'Tables de multiplication',
  revision: 'Révision ciblée',
  evaluation: 'Évaluation',
};

/** Ce qu'on dit à l'élève de chaque séance. Le mot qui désigne son enseignant
 *  suit son niveau : une maîtresse, puis des professeurs. */
export const ACTIVITY_HINTS: Record<Activity, (level: Level) => string> = {
  questions: () => 'Des questions sur tout ce que tu as coché.',
  posees: (level) => `Tu poses l'opération avec ton doigt. ${teacherWordCapitalised(level)} pourra la corriger.`,
  tables: () => 'Choisis tes tables et donne le résultat le plus vite possible, sans poser.',
  revision: () => 'Les exercices qui te donnent le plus de mal, pour progresser.',
  evaluation: (level) => `Les questions choisies par ${teacherWord(level)}, pour toute la classe.`,
};

/** Poser une opération n'a de sens qu'en maths. La révision ciblée existe
 *  dans toutes les matières, mais ne les mélange pas davantage que le reste.
 *  L'évaluation n'y figure pas : l'élève ne la lance jamais lui-même. */
export const SUBJECT_ACTIVITIES: Record<Subject, Activity[]> = {
  francais: ['questions', 'revision'],
  maths: ['questions', 'posees', 'tables', 'revision'],
  histoire: ['questions', 'revision'],
  geographie: ['questions', 'revision'],
};

/** Une notion travaillée à l'intérieur d'une matière. */
export type Domain =
  | 'conjugaison'
  | 'accords'
  | 'orthographe'
  | 'numeration'
  | 'calcul'
  | 'problemes'
  | 'geometrie'
  | 'chronologie'
  | 'evenements'
  | 'mots-histoire'
  | 'cartes'
  | 'habiter'
  | 'mots-geographie';

export interface Question {
  id: string;
  domain: Domain;
  /** Consigne affichée au-dessus de l'énoncé ("Complète au présent"). */
  instruction?: string;
  prompt: string;
  /** Un dessin à regarder avant de répondre : une figure, une frise. */
  figure?: Figure;
  choices: string[];
  correctIndex: number;
  /** Une phrase qui explique la bonne réponse, montrée une fois que l'élève a
   *  répondu. */
  explanation?: string;
  /** Une construction à faire au doigt sur la figure (poser des points sur un
   *  quadrillage). La question n'a alors pas de choix : `choices` est vide et
   *  `correctIndex` vaut -1. */
  construction?: Construction;
}

export const ALL_SUBJECTS: Subject[] = ['francais', 'maths', 'histoire', 'geographie'];

export const SUBJECT_LABELS: Record<Subject, string> = {
  francais: 'Français',
  maths: 'Maths',
  histoire: 'Histoire',
  geographie: 'Géographie',
};

/** « de français », « de maths », mais « d'histoire » : l'élision, comme à
 *  l'écrit. */
export function ofSubject(subject: Subject): string {
  const label = SUBJECT_LABELS[subject].toLowerCase();
  return /^[aeiouyéèh]/.test(label) ? `d'${label}` : `de ${label}`;
}

export const SUBJECT_EMOJI: Record<Subject, string> = {
  francais: '📖',
  maths: '🔢',
  histoire: '🏰',
  geographie: '🌍',
};

/** L'ordre des notions à l'intérieur d'une matière : c'est aussi l'ordre dans
 *  lequel les blocs de questions se suivent pendant une séance. */
export const SUBJECT_DOMAINS: Record<Subject, Domain[]> = {
  francais: ['conjugaison', 'accords', 'orthographe'],
  maths: ['numeration', 'calcul', 'problemes', 'geometrie'],
  histoire: ['chronologie', 'evenements', 'mots-histoire'],
  geographie: ['cartes', 'habiter', 'mots-geographie'],
};

export const DOMAIN_SUBJECT: Record<Domain, Subject> = {
  conjugaison: 'francais',
  accords: 'francais',
  orthographe: 'francais',
  numeration: 'maths',
  calcul: 'maths',
  problemes: 'maths',
  geometrie: 'maths',
  chronologie: 'histoire',
  evenements: 'histoire',
  'mots-histoire': 'histoire',
  cartes: 'geographie',
  habiter: 'geographie',
  'mots-geographie': 'geographie',
};

export function subjectOf(domain: Domain): Subject {
  return DOMAIN_SUBJECT[domain];
}

export const ALL_DOMAINS: Domain[] = ALL_SUBJECTS.flatMap((subject) => SUBJECT_DOMAINS[subject]);

/** L'arc-en-ciel de l'École : les notions du français et des maths, du rouge
 *  au rose. L'histoire et la géographie ont chacune leur arc. */
export const RAINBOW_DOMAINS: Domain[] = [...SUBJECT_DOMAINS.francais, ...SUBJECT_DOMAINS.maths];

/** Le nom court d'une notion, là où la place manque : les axes et les
 *  courbes des graphiques de la maîtresse. */
export const DOMAIN_SHORT_LABELS: Record<Domain, string> = {
  conjugaison: 'Conjugaison',
  accords: 'Accords',
  orthographe: 'Orthographe',
  numeration: 'Numération',
  calcul: 'Calcul',
  problemes: 'Problèmes',
  geometrie: 'Géométrie',
  chronologie: 'Repères',
  evenements: 'Personnages',
  'mots-histoire': 'Vocabulaire',
  cartes: 'Cartes',
  habiter: 'Habiter',
  'mots-geographie': 'Vocabulaire',
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  conjugaison: 'Conjugaison',
  accords: 'Accords',
  orthographe: 'Orthographe et vocabulaire',
  numeration: 'Numération',
  calcul: 'Calcul',
  problemes: 'Problèmes',
  geometrie: 'Géométrie',
  chronologie: 'Se repérer dans le temps',
  evenements: 'Personnages et événements',
  'mots-histoire': "Les mots de l'histoire",
  cartes: "Se repérer dans l'espace",
  habiter: 'Habiter le monde',
  'mots-geographie': 'Les mots de la géographie',
};
