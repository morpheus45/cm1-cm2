import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';
import { availableAt, stageOf } from '../lib/progression';
import { ANTONYM_ITEMS, HOMOPHONE_ITEMS, SYNONYM_ITEMS, type AntonymItem, type HomophoneItem, type SynonymItem } from './orthographeLexique';
import { estNiveauEcrit } from './francaisNiveaux';
import { generateNiveau } from './orthographeNiveaux';

/** Le trou est-il en début de phrase ? Si oui toutes les propositions prennent
 *  une majuscule, sinon aucune : sans cela, la casse trahirait la paire
 *  d'homophones visée par la question. */
function startsSentence(prompt: string): boolean {
  return prompt.startsWith('...');
}

function applyCase(word: string, capitalize: boolean): string {
  if (!capitalize) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function pairDistractors(rng: Rng, item: HomophoneItem, otherItems: HomophoneItem[]): string[] {
  const seen = new Set<string>([item.correct.toLowerCase(), item.pairPartner.toLowerCase()]);
  const uniqueCandidates = otherItems
    .map((o) => o.correct)
    .filter((correct) => {
      const key = correct.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const extras = rngShuffle(rng, uniqueCandidates).slice(0, 2);
  return [item.pairPartner, ...extras];
}

function homophoneQuestion(rng: Rng, index: number, item: HomophoneItem, pool: HomophoneItem[]): Question {
  const capitalize = startsSentence(item.prompt);
  const distractors = pairDistractors(rng, item, pool);
  const correct = applyCase(item.correct, capitalize);
  const choices = rngShuffle(rng, [correct, ...distractors.map((d) => applyCase(d, capitalize))]);
  return {
    id: `orthographe-homophone-${index}-${item.correct}`,
    domain: 'orthographe',
    instruction: 'Choisis le mot qui convient',
    prompt: item.prompt,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

function synonymQuestion(index: number, rng: Rng, item: SynonymItem): Question {
  const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
  return {
    id: `orthographe-synonyme-${index}-${item.correct}`,
    domain: 'orthographe',
    instruction: 'Trouve le synonyme',
    prompt: `Un synonyme de « ${item.word} » est...`,
    choices,
    correctIndex: choices.indexOf(item.correct),
  };
}

function antonymQuestion(index: number, rng: Rng, item: AntonymItem): Question {
  const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
  return {
    id: `orthographe-contraire-${index}-${item.correct}`,
    domain: 'orthographe',
    instruction: 'Trouve le contraire',
    prompt: `Le contraire de « ${item.word} » est...`,
    choices,
    correctIndex: choices.indexOf(item.correct),
  };
}

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  // Le CE1, le CE2 et la 6e ont leur propre orthographe, écrite à part : celle du CM1 et du CM2 ne change pas.
  if (estNiveauEcrit(level)) return generateNiveau(level, trimester, rng, count);
  const stage = stageOf(level, trimester);
  const homophonePool = availableAt(HOMOPHONE_ITEMS, stage);
  const synonymPool = availableAt(SYNONYM_ITEMS, stage);
  const antonymPool = availableAt(ANTONYM_ITEMS, stage);

  const vocabularyBudget = Math.min(Math.floor(count / 3), synonymPool.length + antonymPool.length);
  const homophoneCount = count - vocabularyBudget;

  const homophoneQuestions = rngPickN(rng, homophonePool, homophoneCount).map((item, index) =>
    homophoneQuestion(rng, index, item, homophonePool)
  );

  if (vocabularyBudget <= 0) {
    return homophoneQuestions;
  }

  const synonymBudget = Math.min(Math.ceil(vocabularyBudget / 2), synonymPool.length);
  const antonymBudget = vocabularyBudget - synonymBudget;

  const synonymQuestions = rngPickN(rng, synonymPool, synonymBudget).map((item, index) => synonymQuestion(index, rng, item));
  const antonymQuestions = rngPickN(rng, antonymPool, antonymBudget).map((item, index) => antonymQuestion(index, rng, item));

  return rngShuffle(rng, [...homophoneQuestions, ...synonymQuestions, ...antonymQuestions]);
}
