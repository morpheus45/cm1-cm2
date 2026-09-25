import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';
import { availableAt, stageOf, type Staged } from '../lib/progression';

/**
 * Chaque famille d'homophones entre au programme à une étape précise :
 * a/à et et/est dès le CM1-T1, on/ont au T2, ce/se au T3 ; puis son/sont
 * (CM2-T1), ces/ses et ou/où (CM2-T2), c'est/s'est (CM2-T3).
 * Les mots proposés comme mauvaises réponses sont pris dans les familles déjà
 * vues, jamais dans une famille non enseignée.
 */
interface HomophoneItem extends Staged {
  prompt: string;
  correct: string;
  pairPartner: string;
}

const HOMOPHONE_ITEMS: HomophoneItem[] = [
  // a / à
  { minStage: 1, prompt: 'Il joue ... la balle.', correct: 'à', pairPartner: 'a' },
  { minStage: 1, prompt: 'Elle ... un beau chat.', correct: 'a', pairPartner: 'à' },
  { minStage: 1, prompt: 'Nous allons ... la piscine.', correct: 'à', pairPartner: 'a' },
  { minStage: 1, prompt: 'Mon frère ... huit ans.', correct: 'a', pairPartner: 'à' },
  // et / est
  { minStage: 1, prompt: 'Le chat ... noir.', correct: 'est', pairPartner: 'et' },
  { minStage: 1, prompt: 'Paul ... Marie jouent ensemble.', correct: 'et', pairPartner: 'est' },
  { minStage: 1, prompt: 'Ce gâteau ... délicieux.', correct: 'est', pairPartner: 'et' },
  { minStage: 1, prompt: 'Je prends mon manteau ... mon écharpe.', correct: 'et', pairPartner: 'est' },
  // on / ont
  { minStage: 2, prompt: '... va au parc ?', correct: 'on', pairPartner: 'ont' },
  { minStage: 2, prompt: 'Ils ... mangé une pomme.', correct: 'ont', pairPartner: 'on' },
  { minStage: 2, prompt: '... chante une chanson.', correct: 'on', pairPartner: 'ont' },
  { minStage: 2, prompt: 'Les voisins ... un grand chien.', correct: 'ont', pairPartner: 'on' },
  // ce / se
  { minStage: 3, prompt: '... chien aboie fort.', correct: 'ce', pairPartner: 'se' },
  { minStage: 3, prompt: 'Elle ... lave les mains.', correct: 'se', pairPartner: 'ce' },
  { minStage: 3, prompt: '... livre est intéressant.', correct: 'ce', pairPartner: 'se' },
  { minStage: 3, prompt: 'Il ... promène dans le parc.', correct: 'se', pairPartner: 'ce' },
  // son / sont
  { minStage: 4, prompt: 'Il prend ... sac.', correct: 'son', pairPartner: 'sont' },
  { minStage: 4, prompt: 'Elles ... parties tôt.', correct: 'sont', pairPartner: 'son' },
  { minStage: 4, prompt: 'Range ... cahier.', correct: 'son', pairPartner: 'sont' },
  { minStage: 4, prompt: 'Les élèves ... en récréation.', correct: 'sont', pairPartner: 'son' },
  // ces / ses
  { minStage: 5, prompt: '... enfants-là jouent dehors.', correct: 'ces', pairPartner: 'ses' },
  { minStage: 5, prompt: 'Avant de partir, elle range ... propres affaires.', correct: 'ses', pairPartner: 'ces' },
  { minStage: 5, prompt: '... fleurs-ci sont magnifiques.', correct: 'ces', pairPartner: 'ses' },
  { minStage: 5, prompt: 'Il a oublié ... lunettes à la maison.', correct: 'ses', pairPartner: 'ces' },
  // ou / où
  { minStage: 5, prompt: 'Tu veux du thé ... du café ?', correct: 'ou', pairPartner: 'où' },
  { minStage: 5, prompt: '... habites-tu ?', correct: 'où', pairPartner: 'ou' },
  { minStage: 5, prompt: 'Je ne sais pas ... il est parti.', correct: 'où', pairPartner: 'ou' },
  { minStage: 5, prompt: 'Préfères-tu la mer ... la montagne ?', correct: 'ou', pairPartner: 'où' },
  // c'est / s'est
  { minStage: 6, prompt: '... une belle journée.', correct: "c'est", pairPartner: "s'est" },
  { minStage: 6, prompt: 'Il ... blessé au genou.', correct: "s'est", pairPartner: "c'est" },
  { minStage: 6, prompt: '... mon anniversaire.', correct: "c'est", pairPartner: "s'est" },
  { minStage: 6, prompt: 'Elle ... levée très tôt.', correct: "s'est", pairPartner: "c'est" },
];

/** Vocabulaire : arrive en fin de CM2. */
interface SynonymItem extends Staged {
  word: string;
  correct: string;
  distractors: [string, string, string];
}

const SYNONYM_ITEMS: SynonymItem[] = [
  { minStage: 6, word: 'content', correct: 'joyeux', distractors: ['triste', 'fatigué', 'énervé'] },
  { minStage: 6, word: 'grand', correct: 'immense', distractors: ['petit', 'léger', 'court'] },
  { minStage: 6, word: 'beau', correct: 'magnifique', distractors: ['laid', 'ordinaire', 'sombre'] },
  { minStage: 6, word: 'avoir peur', correct: 'craindre', distractors: ['aimer', 'oublier', 'chanter'] },
  { minStage: 6, word: 'regarder', correct: 'observer', distractors: ['écouter', 'toucher', 'sentir'] },
  { minStage: 6, word: 'petit', correct: 'minuscule', distractors: ['énorme', 'moyen', 'large'] },
];

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

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const stage = stageOf(level, trimester);
  const homophonePool = availableAt(HOMOPHONE_ITEMS, stage);
  const synonymPool = availableAt(SYNONYM_ITEMS, stage);

  const synonymBudget = Math.min(Math.floor(count / 3), synonymPool.length);
  const homophoneCount = count - synonymBudget;

  const homophoneQuestions = rngPickN(rng, homophonePool, homophoneCount).map((item, index) => {
    const capitalize = startsSentence(item.prompt);
    const distractors = pairDistractors(rng, item, homophonePool);
    const correct = applyCase(item.correct, capitalize);
    const choices = rngShuffle(rng, [correct, ...distractors.map((d) => applyCase(d, capitalize))]);
    return {
      id: `orthographe-homophone-${index}-${item.correct}`,
      domain: 'orthographe' as const,
      instruction: 'Choisis le mot qui convient',
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(correct),
    };
  });

  if (synonymBudget <= 0) {
    return homophoneQuestions;
  }

  const synonymQuestions = rngPickN(rng, synonymPool, synonymBudget).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `orthographe-synonyme-${index}-${item.correct}`,
      domain: 'orthographe' as const,
      instruction: 'Trouve le synonyme',
      prompt: `Un synonyme de « ${item.word} » est...`,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  return rngShuffle(rng, [...homophoneQuestions, ...synonymQuestions]);
}
