import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';

interface HomophoneItem {
  prompt: string;
  correct: string;
  pairPartner: string;
}

const CM1_HOMOPHONE_ITEMS: HomophoneItem[] = [
  { prompt: 'Il joue ... la balle.', correct: 'à', pairPartner: 'a' },
  { prompt: 'Elle ... un beau chat.', correct: 'a', pairPartner: 'à' },
  { prompt: 'Nous allons ... la piscine.', correct: 'à', pairPartner: 'a' },
  { prompt: 'Le chat ... noir.', correct: 'est', pairPartner: 'et' },
  { prompt: 'Paul ... Marie jouent ensemble.', correct: 'et', pairPartner: 'est' },
  { prompt: 'Ce gâteau ... délicieux.', correct: 'est', pairPartner: 'et' },
  { prompt: '... va au parc ?', correct: 'On', pairPartner: 'Ont' },
  { prompt: 'Ils ... mangé une pomme.', correct: 'ont', pairPartner: 'on' },
  { prompt: '... chante une chanson.', correct: 'On', pairPartner: 'Ont' },
  { prompt: '... chien aboie fort.', correct: 'Ce', pairPartner: 'Se' },
  { prompt: 'Elle ... lave les mains.', correct: 'se', pairPartner: 'ce' },
  { prompt: '... livre est intéressant.', correct: 'Ce', pairPartner: 'Se' },
];

const CM2_HOMOPHONE_ITEMS: HomophoneItem[] = [
  { prompt: 'Il prend ... sac.', correct: 'son', pairPartner: 'sont' },
  { prompt: 'Elles ... parties tôt.', correct: 'sont', pairPartner: 'son' },
  { prompt: 'Range ... cahier.', correct: 'son', pairPartner: 'sont' },
  { prompt: '... enfants-là jouent dehors.', correct: 'Ces', pairPartner: 'Ses' },
  { prompt: 'Avant de partir, elle range ... propres affaires.', correct: 'ses', pairPartner: 'ces' },
  { prompt: '... fleurs-ci sont magnifiques.', correct: 'Ces', pairPartner: 'Ses' },
  { prompt: '... une belle journée.', correct: "C'est", pairPartner: "S'est" },
  { prompt: 'Il ... blessé au genou.', correct: "s'est", pairPartner: "c'est" },
  { prompt: '... mon anniversaire.', correct: "C'est", pairPartner: "S'est" },
  { prompt: 'Tu veux du thé ... du café ?', correct: 'ou', pairPartner: 'où' },
  { prompt: '... habites-tu ?', correct: 'Où', pairPartner: 'Ou' },
  { prompt: 'Je ne sais pas ... il est parti.', correct: 'où', pairPartner: 'ou' },
];

interface SynonymItem {
  word: string;
  correct: string;
  distractors: [string, string, string];
}

const CM2_SYNONYM_ITEMS: SynonymItem[] = [
  { word: 'content', correct: 'joyeux', distractors: ['triste', 'fatigué', 'énervé'] },
  { word: 'grand', correct: 'immense', distractors: ['petit', 'léger', 'court'] },
  { word: 'beau', correct: 'magnifique', distractors: ['laid', 'ordinaire', 'sombre'] },
  { word: 'avoir peur', correct: 'craindre', distractors: ['aimer', 'oublier', 'chanter'] },
  { word: 'regarder', correct: 'observer', distractors: ['écouter', 'toucher', 'sentir'] },
  { word: 'petit', correct: 'minuscule', distractors: ['énorme', 'moyen', 'large'] },
];

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

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const homophonePool = level === 'CM1' ? CM1_HOMOPHONE_ITEMS : [...CM1_HOMOPHONE_ITEMS, ...CM2_HOMOPHONE_ITEMS];
  const synonymBudget = level === 'CM1' ? 0 : Math.min(Math.floor(count / 3), CM2_SYNONYM_ITEMS.length);
  const homophoneCount = count - synonymBudget;

  const homophoneQuestions = rngPickN(rng, homophonePool, homophoneCount).map((item, index) => {
    const distractors = pairDistractors(rng, item, homophonePool);
    const choices = rngShuffle(rng, [item.correct, ...distractors]);
    return {
      id: `orthographe-homophone-${index}-${item.correct}`,
      domain: 'orthographe' as const,
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  if (synonymBudget <= 0) {
    return homophoneQuestions;
  }

  const synonymQuestions = rngPickN(rng, CM2_SYNONYM_ITEMS, synonymBudget).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `orthographe-synonyme-${index}-${item.correct}`,
      domain: 'orthographe' as const,
      prompt: `Un synonyme de « ${item.word} » est...`,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  return rngShuffle(rng, [...homophoneQuestions, ...synonymQuestions]);
}
