import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';

export type Tense =
  | 'présent'
  | 'imparfait'
  | 'futur'
  | 'passé composé'
  | 'passé simple'
  | 'plus-que-parfait'
  | 'conditionnel présent';

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
  return TENSE_ORDER.filter((tense) => TENSE_MIN_STAGE[tense] <= stage);
}

/** « Complète la phrase » : les mauvaises réponses sont d'autres personnes du
 *  même temps, jamais un temps que l'élève n'a pas encore vu. */
interface FormItem {
  sentence: string;
  infinitive: string;
  tense: Tense;
  correct: string;
  distractors: [string, string, string];
}

const FORM_ITEMS: FormItem[] = [
  // --- Présent ---
  { sentence: 'Tu ... la mousse au chocolat.', infinitive: 'aimer', tense: 'présent', correct: 'aimes', distractors: ['aime', 'aiment', 'aimez'] },
  { sentence: 'Nous ... un chien noir.', infinitive: 'avoir', tense: 'présent', correct: 'avons', distractors: ['avez', 'ont', 'as'] },
  { sentence: 'Elle ... ses devoirs.', infinitive: 'faire', tense: 'présent', correct: 'fait', distractors: ['fais', 'faisons', 'font'] },
  { sentence: 'Vous ... le bus le matin.', infinitive: 'prendre', tense: 'présent', correct: 'prenez', distractors: ['prends', 'prend', 'prennent'] },
  { sentence: "Je ... à l'école à pied.", infinitive: 'aller', tense: 'présent', correct: 'vais', distractors: ['vas', 'va', 'allons'] },
  { sentence: 'Ils ... dans la cour.', infinitive: 'jouer', tense: 'présent', correct: 'jouent', distractors: ['joue', 'joues', 'jouons'] },
  { sentence: 'Nous ... la fenêtre.', infinitive: 'ouvrir', tense: 'présent', correct: 'ouvrons', distractors: ['ouvre', 'ouvrez', 'ouvrent'] },
  { sentence: 'Tu ... ton exercice.', infinitive: 'finir', tense: 'présent', correct: 'finis', distractors: ['finit', 'finissons', 'finissent'] },
  { sentence: 'Elles ... contentes.', infinitive: 'être', tense: 'présent', correct: 'sont', distractors: ['est', 'sommes', 'êtes'] },
  { sentence: 'On ... une belle histoire.', infinitive: 'lire', tense: 'présent', correct: 'lit', distractors: ['lis', 'lisons', 'lisent'] },
  { sentence: 'Vous ... du vélo le dimanche.', infinitive: 'faire', tense: 'présent', correct: 'faites', distractors: ['fais', 'fait', 'font'] },
  { sentence: 'Je ... mon cartable.', infinitive: 'prendre', tense: 'présent', correct: 'prends', distractors: ['prend', 'prenons', 'prennent'] },
  { sentence: 'Nous ... à la cantine.', infinitive: 'manger', tense: 'présent', correct: 'mangeons', distractors: ['mange', 'manges', 'mangent'] },
  { sentence: 'Tu ... plus vite que moi.', infinitive: 'courir', tense: 'présent', correct: 'cours', distractors: ['court', 'courons', 'courent'] },
  // --- Imparfait ---
  { sentence: 'La bibliothécaire ... des histoires.', infinitive: 'raconter', tense: 'imparfait', correct: 'racontait', distractors: ['racontais', 'racontaient', 'racontiez'] },
  { sentence: 'Il ... beau ce jour-là.', infinitive: 'faire', tense: 'imparfait', correct: 'faisait', distractors: ['faisais', 'faisaient', 'faisions'] },
  { sentence: 'Nous ... à la piscine le mercredi.', infinitive: 'aller', tense: 'imparfait', correct: 'allions', distractors: ['allais', 'allait', 'allaient'] },
  { sentence: 'Tu ... un vélo rouge.', infinitive: 'vouloir', tense: 'imparfait', correct: 'voulais', distractors: ['voulait', 'voulions', 'voulaient'] },
  { sentence: 'Vous ... souvent en retard.', infinitive: 'être', tense: 'imparfait', correct: 'étiez', distractors: ['étais', 'était', 'étions'] },
  { sentence: 'Ils ... beaucoup de chance.', infinitive: 'avoir', tense: 'imparfait', correct: 'avaient', distractors: ['avais', 'avait', 'aviez'] },
  // --- Futur ---
  { sentence: "Ils ... l'ascenseur.", infinitive: 'prendre', tense: 'futur', correct: 'prendront', distractors: ['prendra', 'prendrons', 'prendrez'] },
  { sentence: 'Elle ... demain matin.', infinitive: 'venir', tense: 'futur', correct: 'viendra', distractors: ['viendras', 'viendrons', 'viendront'] },
  { sentence: 'Nous ... le film ce soir.', infinitive: 'voir', tense: 'futur', correct: 'verrons', distractors: ['verrai', 'verra', 'verront'] },
  { sentence: 'Vous ... la vérité.', infinitive: 'dire', tense: 'futur', correct: 'direz', distractors: ['dirai', 'dira', 'diront'] },
  { sentence: 'Tu ... grand plus tard.', infinitive: 'être', tense: 'futur', correct: 'seras', distractors: ['serai', 'sera', 'serons'] },
  { sentence: "J'... un nouveau cartable.", infinitive: 'avoir', tense: 'futur', correct: 'aurai', distractors: ['auras', 'aura', 'aurons'] },
  // --- Passé composé ---
  { sentence: "J'... ma vieille trottinette.", infinitive: 'remplacer', tense: 'passé composé', correct: 'ai remplacé', distractors: ['as remplacé', 'a remplacé', 'avons remplacé'] },
  { sentence: 'Elle ... un bel oiseau.', infinitive: 'voir', tense: 'passé composé', correct: 'a vu', distractors: ['ai vu', 'as vu', 'ont vu'] },
  { sentence: 'Nous ... le train de huit heures.', infinitive: 'prendre', tense: 'passé composé', correct: 'avons pris', distractors: ['avez pris', 'ont pris', 'as pris'] },
  { sentence: 'Ils ... merci à la maîtresse.', infinitive: 'dire', tense: 'passé composé', correct: 'ont dit', distractors: ['a dit', 'avons dit', 'avez dit'] },
  { sentence: 'Elle ... à huit heures.', infinitive: 'partir', tense: 'passé composé', correct: 'est partie', distractors: ['est parti', 'sont parties', 'es partie'] },
  { sentence: 'Tu ... tes devoirs.', infinitive: 'finir', tense: 'passé composé', correct: 'as fini', distractors: ['a fini', 'avons fini', 'ont fini'] },
  // --- Passé simple ---
  { sentence: 'Le chevalier ... au combat.', infinitive: 'partir', tense: 'passé simple', correct: 'partit', distractors: ['partis', 'partirent', 'partîmes'] },
  { sentence: 'Elle ... son cahier et sortit.', infinitive: 'prendre', tense: 'passé simple', correct: 'prit', distractors: ['pris', 'prirent', 'prîmes'] },
  { sentence: 'Ils ... un renard dans la forêt.', infinitive: 'voir', tense: 'passé simple', correct: 'virent', distractors: ['vit', 'vis', 'vîmes'] },
  { sentence: 'Nous ... très peur.', infinitive: 'avoir', tense: 'passé simple', correct: 'eûmes', distractors: ['eut', 'eurent', 'eus'] },
  { sentence: 'Il ... très courageux.', infinitive: 'être', tense: 'passé simple', correct: 'fut', distractors: ['furent', 'fus', 'fûmes'] },
  // --- Plus-que-parfait ---
  { sentence: 'Il ... quand nous sommes arrivés.', infinitive: 'manger', tense: 'plus-que-parfait', correct: 'avait mangé', distractors: ['avais mangé', 'avaient mangé', 'avions mangé'] },
  { sentence: 'Elle ... avant la pluie.', infinitive: 'partir', tense: 'plus-que-parfait', correct: 'était partie', distractors: ['était parti', 'étaient parties', 'étais partie'] },
  { sentence: 'Nous ... nos devoirs.', infinitive: 'finir', tense: 'plus-que-parfait', correct: 'avions fini', distractors: ['aviez fini', 'avait fini', 'avaient fini'] },
  { sentence: 'Ils ... leurs affaires.', infinitive: 'oublier', tense: 'plus-que-parfait', correct: 'avaient oublié', distractors: ['avait oublié', 'avions oublié', 'aviez oublié'] },
  // --- Conditionnel présent ---
  { sentence: "J'... visiter Paris un jour.", infinitive: 'aimer', tense: 'conditionnel présent', correct: 'aimerais', distractors: ['aimerait', 'aimerions', 'aimeraient'] },
  { sentence: "Tu ... m'aider, s'il te plaît.", infinitive: 'pouvoir', tense: 'conditionnel présent', correct: 'pourrais', distractors: ['pourrait', 'pourrions', 'pourraient'] },
  { sentence: 'Nous ... partir en vacances.', infinitive: 'vouloir', tense: 'conditionnel présent', correct: 'voudrions', distractors: ['voudrais', 'voudrait', 'voudraient'] },
  { sentence: 'Elle ... si elle avait le temps.', infinitive: 'venir', tense: 'conditionnel présent', correct: 'viendrait', distractors: ['viendrais', 'viendrions', 'viendraient'] },
];

/** « À quel temps ? » : n'a de sens qu'à partir de 4 temps enseignés, sinon il
 *  n'y a pas assez de mauvaises réponses légitimes. */
interface IdentificationItem {
  prompt: string;
  tense: Tense;
}

const IDENTIFICATION_ITEMS: IdentificationItem[] = [
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
  { prompt: "J'**ai remplacé** ma vieille trottinette.", tense: 'passé composé' },
  { prompt: 'Elle **a vu** un bel oiseau.', tense: 'passé composé' },
  { prompt: 'Nous **avons pris** le train.', tense: 'passé composé' },
  { prompt: 'Ils **ont dit** merci.', tense: 'passé composé' },
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

const MIN_TENSES_FOR_IDENTIFICATION = 4;

/** « au présent », mais « à l'imparfait ». */
function atTense(tense: Tense): string {
  return /^[aeiouy]/i.test(tense) ? `à l'${tense}` : `au ${tense}`;
}

/** Clé d'une phrase, verbe masqué : sert à ne pas poser deux fois la même
 *  phrase dans une séance, une fois à compléter et une fois à identifier. */
function sentenceKey(text: string): string {
  return text.replace(/\*\*.+?\*\*/, '...');
}

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const tenses = eligibleTenses(level, trimester);
  const tenseSet = new Set<Tense>(tenses);

  const formPool = FORM_ITEMS.filter((item) => tenseSet.has(item.tense));
  const canIdentify = tenses.length >= MIN_TENSES_FOR_IDENTIFICATION;
  const identificationCount = canIdentify ? Math.floor(count / 2) : 0;
  const formCount = count - identificationCount;

  const formQuestions = rngPickN(rng, formPool, formCount).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `conjugaison-forme-${index}-${item.infinitive}-${item.correct}`,
      domain: 'conjugaison' as const,
      instruction: `Complète ${atTense(item.tense)} — verbe « ${item.infinitive} »`,
      prompt: item.sentence,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  if (identificationCount <= 0) {
    return formQuestions;
  }

  const usedSentences = new Set(formQuestions.map((q) => sentenceKey(q.prompt)));
  const eligibleIdentification = IDENTIFICATION_ITEMS.filter((item) => tenseSet.has(item.tense));
  const unusedIdentification = eligibleIdentification.filter(
    (item) => !usedSentences.has(sentenceKey(item.prompt))
  );
  const identificationPool = unusedIdentification.length > 0 ? unusedIdentification : eligibleIdentification;
  const identificationQuestions = rngPickN(rng, identificationPool, identificationCount).map((item, index) => {
    const distractors = rngShuffle(rng, tenses.filter((t) => t !== item.tense)).slice(0, 3);
    const choices = rngShuffle(rng, [item.tense, ...distractors]);
    return {
      id: `conjugaison-temps-${index}-${item.tense}`,
      domain: 'conjugaison' as const,
      instruction: 'À quel temps est le verbe souligné ?',
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.tense),
    };
  });

  return rngShuffle(rng, [...formQuestions, ...identificationQuestions]);
}
