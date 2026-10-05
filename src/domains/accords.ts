import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';
import { isAvailableAt, stageOf } from '../lib/progression';
import {
  ADJECTIVES,
  adjectiveForm,
  ETRE_SUBJECTS,
  ETRE_VERBS,
  etreForm,
  NOUNS,
  nounForm,
  type Adjective,
  type AdjectivePosition,
  type EtreSubject,
  type EtreVerb,
  type Gender,
  type GrammaticalNumber,
  type Noun,
} from './accordsLexique';
import { ALL_VERBS, PERSONS, type Verb } from './conjugaisonVerbes';

/**
 * « un », « une », « des » : jamais d'élision à écrire, contrairement à
 * « le »/« la », ce qui laisse le lexique libre de tout mot. Au pluriel,
 * quand un adjectif est placé avant le nom, l'écrit soigné demande « de »
 * et non « des » (« de grandes filles ») — sauf noms composés, absents de
 * ce lexique.
 */
function article(gender: Gender, number: GrammaticalNumber, position: AdjectivePosition, capitalise: boolean): string {
  const word = number === 'pluriel' ? (position === 'avant' ? 'de' : 'des') : gender === 'm' ? 'un' : 'une';
  return capitalise ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word;
}

const NUMBERS: GrammaticalNumber[] = ['singulier', 'pluriel'];

function dedupe(words: string[], exclude: string): string[] {
  const seen = new Set([exclude.toLowerCase()]);
  return words.filter((word) => {
    const key = word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- Groupe nominal : le nom manque, l'adjectif est déjà accordé. ----------

interface NominalCandidate {
  noun: Noun;
  adjective: Adjective;
  number: GrammaticalNumber;
}

/**
 * Un autre nom ne fait un distracteur valable que s'il est faux par le genre
 * ou par le nombre : sinon il compléterait tout aussi bien le groupe que la
 * bonne réponse (« un léger garçon / cahier » sont tous les deux masculins
 * singuliers, donc tous les deux justes — ce qu'on doit éviter).
 *
 * Au pluriel, un adjectif invariable en genre (« agréables ») ne marque rien
 * — et « des » non plus : rien dans la phrase ne trahit alors le genre du
 * nom attendu, si bien qu'un autre nom au pluriel, quel que soit son genre,
 * conviendrait tout autant. Il faut alors écarter tous les noms au même
 * nombre, pas seulement ceux du même genre.
 */
function nominalDistractors(rng: Rng, nouns: Noun[], noun: Noun, adjective: Adjective, number: GrammaticalNumber, correct: string): string[] {
  const genderMarked = number === 'singulier' || adjective.masculinePlural !== adjective.femininePlural;
  const candidates = nouns.flatMap((other) =>
    NUMBERS.filter((otherNumber) => otherNumber !== number || (genderMarked && other.gender !== noun.gender)).map(
      (otherNumber) => nounForm(other, otherNumber)
    )
  );
  return dedupe(rngShuffle(rng, candidates), correct).slice(0, 3);
}

function nominalQuestion(rng: Rng, index: number, nouns: Noun[], candidate: NominalCandidate): Question {
  const { noun, adjective, number } = candidate;
  const correct = nounForm(noun, number);
  const adjectiveText = adjectiveForm(adjective, noun.gender, number);
  const distractors = nominalDistractors(rng, nouns, noun, adjective, number, correct);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  const article_ = article(noun.gender, number, adjective.position, false);
  const prompt = adjective.position === 'avant' ? `${article_} ${adjectiveText} ...` : `${article_} ... ${adjectiveText}`;
  return {
    id: `accords-nominal-${index}-${correct}`,
    domain: 'accords',
    instruction: 'Quel mot complète correctement le groupe ?',
    prompt,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// --- Groupe nominal : l'adjectif manque, le nom est déjà là. ---------------

const GENDERS: Gender[] = ['m', 'f'];

/** Les cases (genre, nombre) qui produisent chaque forme distincte d'un
 *  adjectif. Nécessaire car certaines formes sont invariables au-delà du
 *  genre : « mauvais », « doux » et « frais » s'écrivent pareil au masculin
 *  singulier et au masculin pluriel. Exclure seulement la case (genre,
 *  nombre) visée laisserait passer la même chaîne via l'autre case. */
function adjectiveFormsWithMemberships(adjective: Adjective): { word: string; memberships: { gender: Gender; number: GrammaticalNumber }[] }[] {
  const byWord = new Map<string, { gender: Gender; number: GrammaticalNumber }[]>();
  GENDERS.forEach((gender) =>
    NUMBERS.forEach((number) => {
      const word = adjectiveForm(adjective, gender, number);
      const memberships = byWord.get(word) ?? [];
      memberships.push({ gender, number });
      byWord.set(word, memberships);
    })
  );
  return Array.from(byWord.entries()).map(([word, memberships]) => ({ word, memberships }));
}

/**
 * Même règle que pour les noms : une forme d'adjectif (la sienne ou celle
 * d'un autre adjectif) n'est un distracteur valable que si elle est fausse
 * par le genre ou par le nombre du nom donné — jamais une forme qui
 * s'accorderait tout aussi bien (« un cahier léger / agréable » sont tous
 * les deux masculins singuliers, donc tous les deux justes).
 */
function adjectiveDistractors(rng: Rng, adjectives: Adjective[], adjective: Adjective, noun: Noun, number: GrammaticalNumber, correct: string): string[] {
  const candidates = adjectives.flatMap((other) =>
    adjectiveFormsWithMemberships(other)
      .filter(({ memberships }) => !memberships.some((m) => m.gender === noun.gender && m.number === number))
      .map(({ word }) => word)
  );
  return dedupe(rngShuffle(rng, candidates), correct).slice(0, 3);
}

function adjectifQuestion(rng: Rng, index: number, adjectives: Adjective[], candidate: NominalCandidate): Question {
  const { noun, adjective, number } = candidate;
  const correct = adjectiveForm(adjective, noun.gender, number);
  const nounText = nounForm(noun, number);
  const distractors = adjectiveDistractors(rng, adjectives, adjective, noun, number, correct);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  const article_ = article(noun.gender, number, adjective.position, false);
  const prompt = adjective.position === 'après' ? `${article_} ${nounText} ...` : `${article_} ... ${nounText}`;
  return {
    id: `accords-adjectif-${index}-${correct}`,
    domain: 'accords',
    instruction: "Quel mot complète correctement le groupe ?",
    prompt,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// --- Sujet (un groupe nominal, pas un pronom) et verbe au présent. ---------

interface SujetCandidate {
  noun: Noun;
  verb: Verb;
  number: GrammaticalNumber;
}

function présentDistractors(rng: Rng, verb: Verb, correctPerson: 'il' | 'ils'): string[] {
  const correct = verb.forms['présent'][correctPerson];
  const others = PERSONS.filter((person) => person !== correctPerson);
  const forms = rngShuffle(rng, others).map((person) => verb.forms['présent'][person]);
  return dedupe(forms, correct).slice(0, 3);
}

function sujetQuestion(rng: Rng, index: number, candidate: SujetCandidate): Question {
  const { noun, verb, number } = candidate;
  const person = number === 'singulier' ? 'il' : 'ils';
  const correct = verb.forms['présent'][person];
  const distractors = présentDistractors(rng, verb, person);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  return {
    id: `accords-sujet-${index}-${verb.infinitive}-${correct}`,
    domain: 'accords',
    instruction: 'Quel verbe complète correctement la phrase ?',
    prompt: `${article(noun.gender, number, 'après', true)} ${nounForm(noun, number)} ... ${verb.complement}`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// --- Participe passé avec « être ». -----------------------------------------

interface ParticipeCandidate {
  verb: EtreVerb;
  subject: EtreSubject;
}

function participeQuestion(rng: Rng, index: number, candidate: ParticipeCandidate): Question {
  const { verb, subject } = candidate;
  const correct = etreForm(verb, subject.gender, subject.number);
  const forms = [verb.masculineSingular, verb.feminineSingular, verb.masculinePlural, verb.femininePlural];
  const distractors = rngShuffle(rng, dedupe(forms, correct)).slice(0, 3);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  const être = subject.number === 'singulier' ? 'est' : 'sont';
  return {
    id: `accords-participe-${index}-${correct}`,
    domain: 'accords',
    instruction: `Accorde le participe passé — verbe « ${verb.infinitive} »`,
    prompt: `${subject.text} ${être} ...`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// --- Répartition entre les quatre types de questions. -----------------------

type PoolKey = 'nominal' | 'adjectif' | 'sujet' | 'participe';

function allocate(count: number, keys: PoolKey[]): Record<PoolKey, number> {
  const per = Math.floor(count / keys.length);
  const remainder = count - per * keys.length;
  const allocation: Partial<Record<PoolKey, number>> = {};
  keys.forEach((key, index) => {
    allocation[key] = per + (index < remainder ? 1 : 0);
  });
  return { nominal: 0, adjectif: 0, sujet: 0, participe: 0, ...allocation };
}

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const stage = stageOf(level, trimester);
  const nouns = NOUNS.filter((noun) => isAvailableAt(noun.minStage, stage));
  const adjectives = ADJECTIVES.filter((adjective) => isAvailableAt(adjective.minStage, stage));

  const nominalCandidates: NominalCandidate[] = nouns.flatMap((noun) =>
    adjectives
      .filter((adjective) => adjective.categories.includes(noun.category))
      .flatMap((adjective) => NUMBERS.map((number) => ({ noun, adjective, number })))
  );
  // Les verbes de ce lexique décrivent des actions d'élève (faire les
  // devoirs, chercher les clés, réussir un contrôle...) : seule une personne
  // en est capable, sans quoi la phrase devient absurde (« un crayon prépare
  // le repas », « un chien réussit son contrôle »).
  const personNouns = nouns.filter((noun) => noun.category === 'personne');
  const sujetCandidates: SujetCandidate[] = personNouns.flatMap((noun) =>
    ALL_VERBS.flatMap((verb) => NUMBERS.map((number) => ({ noun, verb, number })))
  );
  const adjectifCandidates: NominalCandidate[] = stage >= 2 ? nominalCandidates : [];
  const participeVerbs = ETRE_VERBS.filter((verb) => isAvailableAt(verb.minStage, stage));
  const participeCandidates: ParticipeCandidate[] = participeVerbs.flatMap((verb) =>
    ETRE_SUBJECTS.map((subject) => ({ verb, subject }))
  );

  const pools: Record<PoolKey, unknown[]> = {
    nominal: nominalCandidates,
    adjectif: adjectifCandidates,
    sujet: sujetCandidates,
    participe: participeCandidates,
  };
  const activeKeys = (Object.keys(pools) as PoolKey[]).filter((key) => pools[key].length > 0);
  const allocation = allocate(count, activeKeys);

  const nominalQuestions = rngPickN(rng, nominalCandidates, allocation.nominal).map((candidate, index) =>
    nominalQuestion(rng, index, nouns, candidate)
  );
  const adjectifQuestions = rngPickN(rng, adjectifCandidates, allocation.adjectif).map((candidate, index) =>
    adjectifQuestion(rng, index, adjectives, candidate)
  );
  const sujetQuestions = rngPickN(rng, sujetCandidates, allocation.sujet).map((candidate, index) =>
    sujetQuestion(rng, index, candidate)
  );
  const participeQuestions = rngPickN(rng, participeCandidates, allocation.participe).map((candidate, index) =>
    participeQuestion(rng, index, candidate)
  );

  return rngShuffle(rng, [...nominalQuestions, ...adjectifQuestions, ...sujetQuestions, ...participeQuestions]);
}
