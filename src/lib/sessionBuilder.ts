import { ALL_DOMAINS, subjectOf } from '../types';
import type { Domain, Level, Question, Subject, Trimester } from '../types';
import { createRng, rngShuffle, type Rng } from './seededRandom';
import { classProblemToQuestion, pickClassProblems, type ClassProblem } from './classProblems';
import * as conjugaison from '../domains/conjugaison';
import * as accords from '../domains/accords';
import * as orthographe from '../domains/orthographe';
import * as numeration from '../domains/numeration';
import * as calcul from '../domains/calcul';
import * as problemes from '../domains/problemes';
import * as geometrie from '../domains/geometrie';
import * as histoire from '../domains/histoire';
import * as geographie from '../domains/geographie';

type Generator = (level: Level, trimester: Trimester, rng: Rng, count: number) => Question[];

const GENERATORS: Record<Domain, Generator> = {
  conjugaison: conjugaison.generate,
  accords: accords.generate,
  orthographe: orthographe.generate,
  numeration: numeration.generate,
  calcul: calcul.generate,
  problemes: problemes.generate,
  geometrie: geometrie.generate,
  chronologie: histoire.generateChronologie,
  evenements: histoire.generateEvenements,
  'mots-histoire': histoire.generateMotsHistoire,
  cartes: geographie.generateCartes,
  habiter: geographie.generateHabiter,
  'mots-geographie': geographie.generateMotsGeographie,
};

/** Longueur d'une séance : assez pour travailler, assez court pour tenir. */
export const QUESTIONS_PER_SESSION = 12;

export interface SessionRequest {
  domains: Domain[];
  level: Level;
  trimester: Trimester;
  seed: number;
  count?: number;
  /** Les problèmes préparés par la maîtresse pour la classe, s'il y en a. */
  classProblems?: ClassProblem[];
}

export interface Session {
  subject: Subject;
  /** Les notions retenues, dans l'ordre où leurs questions se suivent. */
  domains: Domain[];
  level: Level;
  trimester: Trimester;
  questions: Question[];
}

export const MIXED_SUBJECTS_ERROR = 'Une séance porte sur une seule matière, jamais deux à la fois.';

export const NO_DOMAIN_ERROR = 'Au moins une notion doit être sélectionnée.';

/**
 * Matière commune à toutes les notions demandées. Lève une erreur si la liste
 * mêle deux matières : c'est le garde-fou qui garantit qu'une séance ne saute
 * jamais d'une dictée de nombres à un exercice de conjugaison, ni d'une frise
 * à une carte.
 */
export function subjectOfDomains(domains: Domain[]): Subject {
  if (domains.length === 0) {
    throw new Error(NO_DOMAIN_ERROR);
  }
  const subjects = new Set(domains.map(subjectOf));
  if (subjects.size > 1) {
    throw new Error(MIXED_SUBJECTS_ERROR);
  }
  return subjects.values().next().value as Subject;
}

/**
 * Construit une séance. Les questions ne sont pas mélangées entre les
 * notions : l'élève fait d'abord tout le bloc de conjugaison, puis tout le
 * bloc d'accords, etc. — dans l'ordre fixe de `ALL_DOMAINS`.
 */
export function buildSession({
  domains,
  level,
  trimester,
  seed,
  count = QUESTIONS_PER_SESSION,
  classProblems = [],
}: SessionRequest): Session {
  const orderedDomains = ALL_DOMAINS.filter((domain) => domains.includes(domain));
  const subject = subjectOfDomains(orderedDomains);

  const rng = createRng(seed);
  const perDomain = Math.floor(count / orderedDomains.length);
  const remainder = count - perDomain * orderedDomains.length;

  const questions: Question[] = [];
  orderedDomains.forEach((domain, index) => {
    const domainCount = perDomain + (index < remainder ? 1 : 0);
    if (domainCount === 0) return;
    // Les problèmes de la maîtresse prennent au plus la moitié du bloc : ils
    // se mêlent aux problèmes de l'application au lieu de les remplacer.
    const own =
      domain === 'problemes'
        ? pickClassProblems(classProblems, trimester, rng, Math.ceil(domainCount / 2)).map((problem) =>
            classProblemToQuestion(problem, rng)
          )
        : [];
    const generated = GENERATORS[domain](level, trimester, rng, domainCount - own.length);
    questions.push(...(own.length > 0 ? rngShuffle(rng, [...own, ...generated]) : generated));
  });

  return { subject, domains: orderedDomains, level, trimester, questions };
}
