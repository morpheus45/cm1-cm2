import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';

type Tense =
  | 'présent'
  | 'imparfait'
  | 'futur'
  | 'passé composé'
  | 'passé simple'
  | 'plus-que-parfait'
  | 'conditionnel présent';

interface ConjugationSentence {
  prompt: string;
  tense: Tense;
}

const CM1_TENSES: Tense[] = ['présent', 'imparfait', 'futur', 'passé composé'];
const CM2_EXTRA_TENSES: Tense[] = ['passé simple', 'plus-que-parfait', 'conditionnel présent'];

const CM1_SENTENCES: ConjugationSentence[] = [
  { prompt: 'Tu **aimes** la mousse au chocolat.', tense: 'présent' },
  { prompt: 'Nous **avons** un chien noir.', tense: 'présent' },
  { prompt: 'Elle **fait** ses devoirs.', tense: 'présent' },
  { prompt: 'Vous **prenez** le bus le matin.', tense: 'présent' },
  { prompt: 'La bibliothécaire **racontait** des histoires aux enfants.', tense: 'imparfait' },
  { prompt: 'Il **faisait** beau ce jour-là.', tense: 'imparfait' },
  { prompt: 'Nous **allions** à la piscine le mercredi.', tense: 'imparfait' },
  { prompt: 'Tu **voulais** un vélo rouge.', tense: 'imparfait' },
  { prompt: "Ils **prendront** l'ascenseur.", tense: 'futur' },
  { prompt: 'Elle **viendra** demain matin.', tense: 'futur' },
  { prompt: 'Nous **verrons** le film ce soir.', tense: 'futur' },
  { prompt: 'Vous **direz** la vérité.', tense: 'futur' },
  { prompt: "J'**ai remplacé** ma vieille voiture.", tense: 'passé composé' },
  { prompt: 'Elle **a vu** un bel oiseau.', tense: 'passé composé' },
  { prompt: 'Nous **avons pris** le train.', tense: 'passé composé' },
  { prompt: 'Ils **ont dit** merci.', tense: 'passé composé' },
];

const CM2_EXTRA_SENTENCES: ConjugationSentence[] = [
  { prompt: 'Le chevalier **partit** au combat.', tense: 'passé simple' },
  { prompt: 'Elle **prit** son cahier et sortit.', tense: 'passé simple' },
  { prompt: 'Ils **virent** un renard dans la forêt.', tense: 'passé simple' },
  { prompt: 'Nous **eûmes** très peur.', tense: 'passé simple' },
  { prompt: 'Il **avait déjà mangé** quand nous sommes arrivés.', tense: 'plus-que-parfait' },
  { prompt: 'Elle **était partie** avant la pluie.', tense: 'plus-que-parfait' },
  { prompt: 'Nous **avions fini** nos devoirs.', tense: 'plus-que-parfait' },
  { prompt: 'Ils **avaient oublié** leurs affaires.', tense: 'plus-que-parfait' },
  { prompt: "J'**aimerais** visiter Paris un jour.", tense: 'conditionnel présent' },
  { prompt: "Tu **pourrais** m'aider, s'il te plaît.", tense: 'conditionnel présent' },
  { prompt: 'Nous **voudrions** partir en vacances.', tense: 'conditionnel présent' },
  { prompt: 'Elle **viendrait** si elle avait le temps.', tense: 'conditionnel présent' },
];

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const tenseSet = level === 'CM1' ? CM1_TENSES : [...CM1_TENSES, ...CM2_EXTRA_TENSES];
  const pool = level === 'CM1' ? CM1_SENTENCES : [...CM1_SENTENCES, ...CM2_EXTRA_SENTENCES];
  const picked = rngPickN(rng, pool, count);

  return picked.map((item, index) => {
    const distractorPool = tenseSet.filter((t) => t !== item.tense);
    const distractors = rngShuffle(rng, distractorPool).slice(0, 3);
    const choices = rngShuffle(rng, [item.tense, ...distractors]);
    return {
      id: `conjugaison-${index}-${item.tense}`,
      domain: 'conjugaison',
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.tense),
    };
  });
}
