import type { Domain, Level, Question, Trimester } from '../types';
import type { Figure } from '../lib/figures';
import { rngShuffle, type Rng } from '../lib/seededRandom';

/**
 * Ce que l'histoire et la géographie ont en commun : des questions écrites
 * une à une, rattachées à un niveau et à un trimestre.
 *
 * Contrairement au français et aux maths, la progression ne passe pas d'un
 * niveau à l'autre : chaque année a son programme (CM1 : programme publié au
 * BO n° 22 du 28 mai 2026 ; CM2 : programme de 2020, en vigueur pour le CM2
 * jusqu'en 2026-2027). Un élève de CM2 ne reçoit donc pas les questions du
 * CM1, qu'il n'a pas étudiées sous cette forme. À l'intérieur de l'année, la
 * progression reste cumulative : au 3e trimestre, les thèmes des deux
 * premiers reviennent en révision.
 */
export interface WrittenItem {
  level: Level;
  trimester: Trimester;
  prompt: string;
  correct: string;
  wrong: string[];
  explanation?: string;
  figure?: Figure;
  instruction?: string;
}

/** Une question déjà prête, avant son numéro dans la séance. */
export type Draft = Omit<Question, 'id' | 'domain'> & { key: string };

const DEFINITION_ARTICLES = ['Un', 'Une', 'Des', 'Le', 'La', 'Les'];

/** « Le Panthéon » reste capitalisé (un nom propre), mais l'article qui
 *  précède un nom commun s'écrit en minuscule au milieu d'une phrase :
 *  « un fief », pas « Un fief » — et « l'embouchure », pas « L'embouchure »
 *  (l'élision colle l'article au nom, sans espace). */
function lowerLeadingArticle(term: string): string {
  if (term.startsWith("L'")) return `l'${term.slice(2)}`;
  const spaceIndex = term.indexOf(' ');
  const first = spaceIndex === -1 ? term : term.slice(0, spaceIndex);
  if (!DEFINITION_ARTICLES.includes(first)) return term;
  const lowered = first.charAt(0).toLowerCase() + first.slice(1);
  return spaceIndex === -1 ? lowered : lowered + term.slice(spaceIndex);
}

/**
 * Le terme qu'un énoncé de vocabulaire définit — « Un fief est : » ou
 * « Le clergé, ce sont : » — c'est tout ce qui précède la première virgule
 * (une précision comme « , dans une abbaye, » ne fait pas partie du terme),
 * ou tout ce qui précède le verbe s'il n'y a pas de virgule. `null` si la
 * phrase ne définit rien : une question, ou un verbe autre que « est »/« sont »
 * (« Une boussole sert à : »), qu'on ne peut pas retourner sans risquer un
 * énoncé bancal.
 */
function definedTerm(prompt: string): string | null {
  if (!/ (?:est|sont)\s*:$/.test(prompt)) return null;
  const term = prompt.includes(',') ? prompt.slice(0, prompt.indexOf(',')) : prompt.replace(/\s+(?:est|sont)\s*:$/, '');
  return lowerLeadingArticle(term.trim());
}

/** Les mots par lesquels un groupe nominal commence naturellement en
 *  français. Une définition qui ne commence par aucun d'eux (ni par une
 *  majuscule, signe d'un nom propre) est un adjectif ou une tournure comme
 *  « facile à atteindre, grâce à de bonnes liaisons » : « Comment appelle-t-on
 *  facile à atteindre ? » ne se dit pas, on ne la retourne donc pas. */
const NOUN_PHRASE_STARTERS = new Set([
  'un', 'une', 'des', 'le', 'la', 'les', "l'", 'ce', 'cet', 'cette', 'ces',
  'de', 'du', "d'", 'son', 'sa', 'ses', 'leur', 'leurs', 'quelques', 'plusieurs',
  'tout', 'toute', 'tous', 'toutes', 'chaque', 'aucun', 'aucune',
]);

function looksLikeNounPhrase(definition: string): boolean {
  if (/^[A-ZÀ-Ý]/.test(definition)) return true;
  const firstWord = definition.split(/[\s']/)[0].toLowerCase();
  return NOUN_PHRASE_STARTERS.has(firstWord) || NOUN_PHRASE_STARTERS.has(`${firstWord}'`);
}

/**
 * Fabrique la question inverse de chaque définition d'une banque de
 * vocabulaire : le terme et sa définition viennent tous deux de la phrase
 * déjà relue et vérifiée, rien n'est inventé. « Un fief est : une terre
 * donnée par un seigneur à son vassal » donne ainsi « Comment appelle-t-on
 * une terre donnée par un seigneur à son vassal ? » → « un fief ». Une
 * même notion pose alors deux questions bien distinctes là où elle n'en
 * posait qu'une — exactement le principe qui fait la combinatoire du
 * français et des maths, appliqué ici à un lexique qu'on ne peut pas
 * inventer.
 */
export function deriveDefinitionReverses(items: WrittenItem[]): WrittenItem[] {
  const withTerm = items
    // Une définition avec ses propres deux-points (« un lieu de nature en
    // ville : parc, jardin, square ») ferait une question à deux points :
    // on la laisse de côté plutôt que de la retourner.
    .filter((item) => !item.correct.includes(':') && looksLikeNounPhrase(item.correct))
    .map((item) => ({ item, term: definedTerm(item.prompt) }))
    .filter((entry): entry is { item: WrittenItem; term: string } => entry.term !== null);
  return withTerm.map(({ item, term }) => ({
    level: item.level,
    trimester: item.trimester,
    prompt: `Comment appelle-t-on ${item.correct} ?`,
    correct: term,
    wrong: [...new Set(withTerm.filter((other) => other.item.level === item.level && other.term !== term).map((other) => other.term))],
    explanation: item.explanation,
  }));
}

/** Les choix : la bonne réponse et trois mauvaises, mélangés, sans doublon. */
export function choose(rng: Rng, correct: string, wrong: string[], howMany = 4) {
  const distractors = rngShuffle(rng, [...new Set(wrong)].filter((entry) => entry !== correct)).slice(0, howMany - 1);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

export function isEligible(item: { level: Level; trimester: Trimester }, level: Level, trimester: Trimester): boolean {
  return item.level === level && item.trimester <= trimester;
}

export function fromItem(rng: Rng, item: WrittenItem): Draft {
  return {
    key: item.prompt,
    instruction: item.instruction,
    prompt: item.prompt,
    figure: item.figure,
    ...choose(rng, item.correct, item.wrong),
    explanation: item.explanation,
  };
}

/**
 * Assemble les questions d'une notion : la moitié au moins sur le trimestre
 * en cours (quand il en a), le reste en révision de l'année. Une question
 * déjà posée dans la séance ne revient qu'en dernier recours, quand plus
 * aucune source n'a de question nouvelle ; la séance a toujours son compte
 * de questions.
 *
 * `current` et `review` sont des fabriques de questions : questions écrites,
 * dates, siècles, frises.
 */
export function assemble(
  domain: Domain,
  rng: Rng,
  count: number,
  trimester: Trimester,
  current: (() => Draft)[],
  review: (() => Draft)[]
): Question[] {
  const all = [...current, ...review];
  if (all.length === 0) return [];
  const fromCurrent = current.length > 0 ? Math.ceil(count / 2) : 0;
  const plan = [
    ...Array.from({ length: fromCurrent }, (_, index) => current[index % current.length]),
    ...Array.from({ length: count - fromCurrent }, (_, index) => all[index % all.length]),
  ];
  const seen = new Set<string>();
  const drafts = plan.map((planned) => {
    let fallback: Draft | null = null;
    for (const make of [planned, ...rngShuffle(rng, all.filter((other) => other !== planned))]) {
      for (let attempt = 0; attempt < 6; attempt++) {
        const draft = make();
        fallback ??= draft;
        if (!seen.has(draft.key)) {
          seen.add(draft.key);
          return draft;
        }
      }
    }
    return fallback as Draft;
  });
  return rngShuffle(rng, drafts).map(({ key, ...question }, index) => ({
    id: `${domain}-t${trimester}-${index}-${key.slice(0, 40)}`,
    domain,
    ...question,
  }));
}

/** Des fabriques de questions tirées au hasard dans une liste, mélangée une
 *  fois : chaque appel rend la suivante. */
export function drawer(rng: Rng, items: WrittenItem[]): () => Draft {
  const order = rngShuffle(rng, items);
  let next = 0;
  return () => fromItem(rng, order[next++ % order.length]);
}
