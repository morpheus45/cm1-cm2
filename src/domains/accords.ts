import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';
import { stageOf } from '../lib/progression';
import {
  ADJECTIVES,
  adjectiveForm,
  ETRE_SUBJECTS,
  ETRE_VERBS,
  etreForm,
  NOUNS,
  nounForm,
  type Adjective,
  type EtreSubject,
  type EtreVerb,
  type Gender,
  type GrammaticalNumber,
  type Noun,
} from './accordsLexique';
import { ALL_VERBS, PERSONS, type Verb } from './conjugaisonVerbes';

/** « un », « une », « des » : jamais d'élision à écrire, contrairement à
 *  « le »/« la », ce qui laisse le lexique libre de tout mot. */
function article(gender: Gender, number: GrammaticalNumber, capitalise: boolean): string {
  const word = number === 'pluriel' ? 'des' : gender === 'm' ? 'un' : 'une';
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

function nominalDistractors(rng: Rng, nouns: Noun[], noun: Noun, number: GrammaticalNumber, correct: string): string[] {
  const sameNounOtherNumber = nounForm(noun, number === 'singulier' ? 'pluriel' : 'singulier');
  const otherForms = rngShuffle(rng, nouns.filter((candidate) => candidate !== noun)).flatMap((other) => [
    other.singular,
    other.plural,
  ]);
  return dedupe([sameNounOtherNumber, ...otherForms], correct).slice(0, 3);
}

function nominalQuestion(rng: Rng, index: number, nouns: Noun[], candidate: NominalCandidate): Question {
  const { noun, adjective, number } = candidate;
  const correct = nounForm(noun, number);
  const adjectiveText = adjectiveForm(adjective, noun.gender, number);
  const distractors = nominalDistractors(rng, nouns, noun, number, correct);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  return {
    id: `accords-nominal-${index}-${correct}`,
    domain: 'accords',
    instruction: 'Quel mot complète correctement le groupe ?',
    prompt: `${article(noun.gender, number, false)} ${adjectiveText} ...`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// --- Groupe nominal : l'adjectif manque, le nom est déjà là. ---------------

function adjectiveDistractors(rng: Rng, adjectives: Adjective[], adjective: Adjective, correct: string): string[] {
  const ownForms = [adjective.masculineSingular, adjective.feminineSingular, adjective.masculinePlural, adjective.femininePlural];
  const own = dedupe(ownForms, correct);
  if (own.length >= 3) return rngShuffle(rng, own).slice(0, 3);
  const otherForms = rngShuffle(rng, adjectives.filter((candidate) => candidate !== adjective)).flatMap((other) => [
    other.masculineSingular,
    other.feminineSingular,
    other.masculinePlural,
    other.femininePlural,
  ]);
  const extra = dedupe(otherForms, correct).filter((word) => !own.includes(word));
  return [...own, ...extra].slice(0, 3);
}

function adjectifQuestion(rng: Rng, index: number, adjectives: Adjective[], candidate: NominalCandidate): Question {
  const { noun, adjective, number } = candidate;
  const correct = adjectiveForm(adjective, noun.gender, number);
  const nounText = nounForm(noun, number);
  const distractors = adjectiveDistractors(rng, adjectives, adjective, correct);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  return {
    id: `accords-adjectif-${index}-${correct}`,
    domain: 'accords',
    instruction: "Quel mot complète correctement le groupe ?",
    prompt: `${article(noun.gender, number, false)} ${nounText} ...`,
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
    prompt: `${article(noun.gender, number, true)} ${nounForm(noun, number)} ... ${verb.complement}`,
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
  const nouns = NOUNS.filter((noun) => noun.minStage <= stage);
  const adjectives = ADJECTIVES.filter((adjective) => adjective.minStage <= stage);

  const nominalCandidates: NominalCandidate[] = nouns.flatMap((noun) =>
    adjectives.flatMap((adjective) => NUMBERS.map((number) => ({ noun, adjective, number })))
  );
  const sujetCandidates: SujetCandidate[] = nouns.flatMap((noun) =>
    ALL_VERBS.flatMap((verb) => NUMBERS.map((number) => ({ noun, verb, number })))
  );
  const adjectifCandidates: NominalCandidate[] = stage >= 2 ? nominalCandidates : [];
  const participeVerbs = ETRE_VERBS.filter((verb) => verb.minStage <= stage);
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
