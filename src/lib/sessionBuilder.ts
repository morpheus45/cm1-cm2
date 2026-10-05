import { ALL_DOMAINS, subjectOf } from '../types';
import type { Domain, Level, Question, Subject, Trimester } from '../types';
import { createRng, rngShuffle, type Rng } from './seededRandom';
import { classProblemToQuestion, pickClassProblems, type ClassProblem } from './classProblems';
import { classQuestionToQuestion, pickClassQuestions, type ClassQuestion } from './classQuestions';
import { hasContent } from './contenu';
import * as conjugaison from '../domains/conjugaison';
import * as accords from '../domains/accords';
import * as orthographe from '../domains/orthographe';
import * as numeration from '../domains/numeration';
import * as calcul from '../domains/calcul';
import * as problemes from '../domains/problemes';
import * as geometrie from '../domains/geometrie';
import * as histoire from '../domains/histoire';
import * as geographie from '../domains/geographie';
import { questionSignature } from './questionHistory';

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
  /** Ses questions dans les autres matières, s'il y en a. */
  classQuestions?: ClassQuestion[];
  /**
   * Les signatures de questions à éviter si possible, des plus anciennes aux
   * plus récentes — l'historique des dix dernières séances de la matière
   * (voir questionHistory.ts). En cas de manque, la séance reprend d'abord
   * les plus anciennes plutôt que de raccourcir la séance.
   */
  avoidSignatures?: string[];
}

export interface Session {
  subject: Subject;
  /** Les notions retenues, dans l'ordre où leurs questions se suivent : celles
   *  qui ont des questions pour ce niveau et ce trimestre. */
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

/** Assez de candidats pour qu'exclure les questions récemment vues laisse
 *  toujours un choix confortable, même quand une notion n'en a besoin que
 *  de deux ou trois. */
const CANDIDATE_POOL_SIZE = 200;

/**
 * Pioche `count` questions fraîches auprès d'une notion, en évitant si
 * possible les signatures données. Si la notion n'a pas assez de questions
 * jamais vues, la séance reprend d'abord celles vues il y a le plus
 * longtemps (`avoid` est ordonné des plus anciennes aux plus récentes).
 * Rend toujours exactement `count` questions, même si la notion n'a pas
 * `count` énoncés distincts : mieux vaut répéter que raccourcir la séance.
 */
function pickFreshQuestions(
  generator: Generator,
  level: Level,
  trimester: Trimester,
  rng: Rng,
  count: number,
  avoid: string[]
): Question[] {
  if (count <= 0) return [];
  const candidates = generator(level, trimester, rng, Math.max(count, CANDIDATE_POOL_SIZE));
  const seenSignatures = new Set<string>();
  const unique: Question[] = [];
  candidates.forEach((question) => {
    const signature = questionSignature(question);
    if (seenSignatures.has(signature)) return;
    seenSignatures.add(signature);
    unique.push(question);
  });

  const avoidRank = new Map(avoid.map((signature, index) => [signature, index]));
  const fresh = unique.filter((question) => !avoidRank.has(questionSignature(question)));
  const stale = unique
    .filter((question) => avoidRank.has(questionSignature(question)))
    .sort((a, b) => avoidRank.get(questionSignature(a))! - avoidRank.get(questionSignature(b))!);
  const picked = [...fresh, ...stale];
  return picked.length >= count ? picked.slice(0, count) : candidates.slice(0, count);
}

/**
 * Construit une séance. Les questions ne sont pas mélangées entre les
 * notions : l'élève fait d'abord tout le bloc de conjugaison, puis tout le
 * bloc d'accords, etc. — dans l'ordre fixe de `ALL_DOMAINS`.
 *
 * Une notion sans question pour ce niveau et ce trimestre (src/lib/contenu.ts)
 * est laissée de côté : la séance se fait avec les autres, et sans aucune
 * notion elle est vide plutôt que de planter.
 */

export function buildSession({
  domains,
  level,
  trimester,
  seed,
  count = QUESTIONS_PER_SESSION,
  classProblems = [],
  classQuestions = [],
  avoidSignatures = [],
}: SessionRequest): Session {
  const requestedDomains = ALL_DOMAINS.filter((domain) => domains.includes(domain));
  const subject = subjectOfDomains(requestedDomains);
  const orderedDomains = requestedDomains.filter((domain) => hasContent(domain, level, trimester));
  if (orderedDomains.length === 0) return { subject, domains: [], level, trimester, questions: [] };

  const rng = createRng(seed);
  const perDomain = Math.floor(count / orderedDomains.length);
  const remainder = count - perDomain * orderedDomains.length;

  const questions: Question[] = [];
  orderedDomains.forEach((domain, index) => {
    const domainCount = perDomain + (index < remainder ? 1 : 0);
    if (domainCount === 0) return;
    // Les questions de la maîtresse prennent au plus la moitié du bloc :
    // elles se mêlent aux questions de l'application au lieu de les
    // remplacer. Les problèmes de maths ont leur propre liste, vérifiée par
    // le calcul ; les autres notions piochent dans ses questions à elle.
    const own =
      domain === 'problemes'
        ? pickClassProblems(classProblems, trimester, rng, Math.ceil(domainCount / 2)).map((problem) =>
            classProblemToQuestion(problem, rng)
          )
        : pickClassQuestions(classQuestions, domain, trimester, rng, Math.ceil(domainCount / 2)).map((question) =>
            classQuestionToQuestion(question, rng)
          );
    const generated = pickFreshQuestions(
      GENERATORS[domain],
      level,
      trimester,
      rng,
      domainCount - own.length,
      avoidSignatures
    );
    questions.push(...(own.length > 0 ? rngShuffle(rng, [...own, ...generated]) : generated));
  });

  return { subject, domains: orderedDomains, level, trimester, questions };
}
