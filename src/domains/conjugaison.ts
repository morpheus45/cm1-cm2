import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';
import { isAvailableAt, stageOf, type Stage } from '../lib/progression';
import { ALL_VERBS, PERSONS, type Person, type Tense, type Verb } from './conjugaisonVerbes';

export type { Tense };

/**
 * Étape à partir de laquelle chaque temps est enseigné. Aucun temps hors de
 * cette liste n'est proposé, ni comme question ni comme mauvaise réponse.
 *
 * CM1 : présent (T1), imparfait (T2), futur et passé composé (T3).
 * CM2 : révision des quatre temps (T1), passé simple et plus-que-parfait (T2),
 * conditionnel présent (T3).
 */
const TENSE_MIN_STAGE: Record<Tense, Stage> = {
  'présent': 1,
  'imparfait': 2,
  'futur': 3,
  'passé composé': 3,
  'passé simple': 5,
  'plus-que-parfait': 5,
  'conditionnel présent': 6,
};

const TENSE_ORDER: Tense[] = [
  'présent',
  'imparfait',
  'futur',
  'passé composé',
  'passé simple',
  'plus-que-parfait',
  'conditionnel présent',
];

export function eligibleTenses(level: Level, trimester: Trimester): Tense[] {
  const stage = stageOf(level, trimester);
  return TENSE_ORDER.filter((tense) => isAvailableAt(TENSE_MIN_STAGE[tense], stage));
}

/** Un temps composé (passé composé, plus-que-parfait) : les verbes qui se
 *  conjuguent avec « être » n'y participent pas dans ce domaine. */
function isCompoundTense(tense: Tense): boolean {
  return tense === 'passé composé' || tense === 'plus-que-parfait';
}

/**
 * Le sujet d'une phrase : un pronom ou un nom propre, associé à la personne
 * grammaticale dont il emprunte la conjugaison. Multiplier les sujets d'une
 * même personne (« il », « Léa », « Paul »...) fabrique de nombreuses phrases
 * différentes à partir d'une seule table de conjugaison.
 */
interface SubjectSlot {
  person: Person;
  text: string;
  /** Le passé simple ne s'enseigne qu'aux troisièmes personnes : ce sujet
   *  peut-il y figurer ? */
  thirdPerson: boolean;
}

const SUBJECT_SLOTS: SubjectSlot[] = [
  { person: 'je', text: 'Je', thirdPerson: false },
  { person: 'tu', text: 'Tu', thirdPerson: false },
  { person: 'il', text: 'Il', thirdPerson: true },
  { person: 'il', text: 'Elle', thirdPerson: true },
  { person: 'il', text: 'Léa', thirdPerson: true },
  { person: 'il', text: 'Paul', thirdPerson: true },
  { person: 'il', text: 'Marion', thirdPerson: true },
  { person: 'il', text: 'Tom', thirdPerson: true },
  { person: 'nous', text: 'Nous', thirdPerson: false },
  { person: 'vous', text: 'Vous', thirdPerson: false },
  { person: 'ils', text: 'Ils', thirdPerson: true },
  { person: 'ils', text: 'Elles', thirdPerson: true },
  { person: 'ils', text: 'Les enfants', thirdPerson: true },
  { person: 'ils', text: 'Mes parents', thirdPerson: true },
  { person: 'ils', text: 'Les élèves', thirdPerson: true },
];

/** L'élision ne touche que « je », devant une forme qui commence par une
 *  voyelle ou un h muet : « j'aime », mais « je finis ». Le trou cache la
 *  forme, pas l'élision — elle se décide d'après la bonne réponse, la seule
 *  que la phrase doive rendre grammaticale. */
function elides(subject: SubjectSlot, form: string): boolean {
  return subject.person === 'je' && /^[aeiouyh]/i.test(form);
}

function subjectWithBlank(subject: SubjectSlot, correctForm: string): string {
  return elides(subject, correctForm) ? "J'..." : `${subject.text} ...`;
}

function subjectWithBoldForm(subject: SubjectSlot, correctForm: string): string {
  return elides(subject, correctForm) ? `J'**${correctForm}**` : `${subject.text} **${correctForm}**`;
}

/** « au présent », mais « à l'imparfait ». */
function atTense(tense: Tense): string {
  return /^[aeiouy]/i.test(tense) ? `à l'${tense}` : `au ${tense}`;
}

interface Candidate {
  verb: Verb;
  tense: Tense;
  subject: SubjectSlot;
  key: string;
}

function buildCandidates(tenses: Tense[]): Candidate[] {
  const candidates: Candidate[] = [];
  ALL_VERBS.forEach((verb) => {
    tenses.forEach((tense) => {
      if (isCompoundTense(tense) && !verb.canCompound) return;
      SUBJECT_SLOTS.forEach((subject) => {
        if (tense === 'passé simple' && !subject.thirdPerson) return;
        candidates.push({ verb, tense, subject, key: `${verb.infinitive}|${tense}|${subject.text}` });
      });
    });
  });
  return candidates;
}

/** Les personnes proposées comme mauvaises réponses : celles d'un même verbe,
 *  au même temps — l'erreur d'élève la plus fréquente est de bien choisir le
 *  temps mais de mal accorder la personne. */
function distractorsFor(rng: Rng, verb: Verb, tense: Tense, correctPerson: Person): string[] {
  const correct = verb.forms[tense][correctPerson];
  const others = PERSONS.filter((person) => person !== correctPerson);
  const seen = new Set([correct]);
  const forms = rngShuffle(rng, others)
    .map((person) => verb.forms[tense][person])
    .filter((form) => {
      if (seen.has(form)) return false;
      seen.add(form);
      return true;
    });
  return forms.slice(0, 3);
}

function formQuestion(rng: Rng, index: number, candidate: Candidate): Question | null {
  const { verb, tense, subject } = candidate;
  const correct = verb.forms[tense][subject.person];
  const distractors = distractorsFor(rng, verb, tense, subject.person);
  if (distractors.length < 3) return null;
  const choices = rngShuffle(rng, [correct, ...distractors]);
  return {
    id: `conjugaison-forme-${index}-${verb.infinitive}-${correct}`,
    domain: 'conjugaison',
    instruction: `Complète ${atTense(tense)} — verbe « ${verb.infinitive} »`,
    prompt: `${subjectWithBlank(subject, correct)} ${verb.complement}`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

function identificationQuestion(rng: Rng, index: number, candidate: Candidate, tenses: Tense[]): Question | null {
  const { verb, tense, subject } = candidate;
  const correct = verb.forms[tense][subject.person];
  // « Il remplit », « je finis », « il dit » : la même forme au présent et au
  // passé simple. Un temps qui donne la même forme serait aussi une bonne
  // réponse : il ne peut pas être proposé.
  const otherTenses = rngShuffle(
    rng,
    tenses.filter((t) => t !== tense && verb.forms[t][subject.person] !== correct)
  ).slice(0, 3);
  if (otherTenses.length < 3) return null;
  const choices = rngShuffle(rng, [tense, ...otherTenses]);
  return {
    id: `conjugaison-temps-${index}-${tense}-${verb.infinitive}`,
    domain: 'conjugaison',
    instruction: 'À quel temps est le verbe souligné ?',
    prompt: `${subjectWithBoldForm(subject, correct)} ${verb.complement}`,
    choices,
    correctIndex: choices.indexOf(tense),
  };
}

const MIN_TENSES_FOR_IDENTIFICATION = 4;

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const tenses = eligibleTenses(level, trimester);
  const canIdentify = tenses.length >= MIN_TENSES_FOR_IDENTIFICATION;
  const identificationCount = canIdentify ? Math.floor(count / 2) : 0;
  const formCount = count - identificationCount;

  const candidates = buildCandidates(tenses);
  const formCandidates = rngPickN(rng, candidates, formCount * 2);
  const formQuestions: Question[] = [];
  const usedKeys = new Set<string>();
  for (const candidate of formCandidates) {
    if (formQuestions.length >= formCount) break;
    const question = formQuestion(rng, formQuestions.length, candidate);
    if (!question) continue;
    formQuestions.push(question);
    usedKeys.add(candidate.key);
  }

  if (identificationCount <= 0) {
    return formQuestions.slice(0, formCount);
  }

  const unusedCandidates = candidates.filter((candidate) => !usedKeys.has(candidate.key));
  const identificationPool = unusedCandidates.length >= identificationCount ? unusedCandidates : candidates;
  const identificationQuestions: Question[] = [];
  for (const candidate of rngPickN(rng, identificationPool, identificationPool.length)) {
    if (identificationQuestions.length >= identificationCount) break;
    if (usedKeys.has(candidate.key)) continue;
    const question = identificationQuestion(rng, identificationQuestions.length, candidate, tenses);
    if (!question) continue;
    identificationQuestions.push(question);
    usedKeys.add(candidate.key);
  }

  return rngShuffle(rng, [...formQuestions.slice(0, formCount), ...identificationQuestions]);
}
