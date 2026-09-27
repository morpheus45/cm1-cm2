import type { Staged } from '../lib/progression';
import { ALL_VERBS } from './conjugaisonVerbes';

/**
 * Les homophones et le vocabulaire, fabriqués à partir de modèles de phrases
 * croisés avec un lexique — plutôt qu'une poignée de phrases écrites à la
 * main pour chaque famille. Chaque famille reste à l'étape où le programme
 * l'enseigne (voir orthographe.test.ts) ; c'est la combinatoire qui fait le
 * nombre de questions, la progression reste celle d'avant.
 */
export interface HomophoneItem extends Staged {
  prompt: string;
  correct: string;
  pairPartner: string;
}

const NAMES = ['Léa', 'Paul', 'Marion', 'Tom', 'Sami', 'Nora', 'Hugo', 'Chloé', 'Lucas', 'Manon'];
const SUBJECTS_3SG = [...NAMES, 'Il', 'Elle', 'Mon frère', 'Ma sœur', 'Le chat', 'La maîtresse'];
const SUBJECTS_3PL = [
  'Les enfants',
  'Mes parents',
  'Les élèves',
  'Ils',
  'Elles',
  'Les voisins',
  'Mes cousins',
  'Les filles',
  'Les garçons',
  'Les chiens',
];

const POSSESSIONS = [
  'un chat noir',
  'un beau vélo',
  'une trottinette',
  'un cahier rouge',
  'un ballon bleu',
  'une écharpe rose',
  'un chien blanc',
  'un joli cartable',
  'une jolie casquette',
  'un nouveau stylo',
];

const PLACES = [
  "l'école",
  'la piscine',
  'la cantine',
  'la bibliothèque',
  'la boulangerie',
  'la boum',
  'la fête',
  'la montagne',
  'la mer',
  'la ferme',
];

// Des adjectifs invariables en genre : « content » se dirait « contente »
// pour un sujet féminin, ce qui casserait l'accord si le sujet varie sans que
// l'adjectif ne suive. Rester sur des adjectifs qui ne changent pas évite le
// problème plutôt que de le contourner.
const STATE_ADJECTIVES = [
  'calme',
  'sage',
  'rapide',
  'malade',
  'aimable',
  'timide',
  'honnête',
  'sympathique',
  'célèbre',
  'tranquille',
];

// Même remarque au pluriel : aucun de ces groupes n'accorde un adjectif ou un
// participe avec le sujet, quel que soit son genre.
const PLURAL_STATES = [
  'en récréation',
  'à la cantine',
  'dans la cour',
  'en retard',
  'au tableau',
  'en voyage',
  'à la piscine',
  'dans le bus',
  'dans la salle de classe',
  'avec la maîtresse',
];

function pairs<T>(items: T[]): [T, T][] {
  const result: [T, T][] = [];
  items.forEach((a) => items.forEach((b) => {
    if (a !== b) result.push([a, b]);
  }));
  return result;
}

// --- a / à --------------------------------------------------------------

const A_A_ITEMS: HomophoneItem[] = [
  ...SUBJECTS_3SG.flatMap((subject) =>
    POSSESSIONS.map((object): HomophoneItem => ({
      minStage: 1,
      prompt: `${subject} ... ${object}.`,
      correct: 'a',
      pairPartner: 'à',
    }))
  ),
  ...SUBJECTS_3SG.flatMap((subject) =>
    PLACES.map((place): HomophoneItem => ({
      minStage: 1,
      prompt: `${subject} va ... ${place}.`,
      correct: 'à',
      pairPartner: 'a',
    }))
  ),
];

// --- et / est -------------------------------------------------------------

const ET_EST_ITEMS: HomophoneItem[] = [
  ...pairs(NAMES).map(([a, b]): HomophoneItem => ({
    minStage: 1,
    prompt: `${a} ... ${b} jouent ensemble.`,
    correct: 'et',
    pairPartner: 'est',
  })),
  ...SUBJECTS_3SG.flatMap((subject) =>
    STATE_ADJECTIVES.map((adjective): HomophoneItem => ({
      minStage: 1,
      prompt: `${subject} ... ${adjective}.`,
      correct: 'est',
      pairPartner: 'et',
    }))
  ),
];

// --- on / ont --------------------------------------------------------------

const ON_ONT_ITEMS: HomophoneItem[] = [
  ...ALL_VERBS.map((verb): HomophoneItem => ({
    minStage: 2,
    prompt: `... ${verb.forms['présent'].il} ${verb.complement}`,
    correct: 'on',
    pairPartner: 'ont',
  })),
  ...SUBJECTS_3PL.flatMap((subject) =>
    POSSESSIONS.map((object): HomophoneItem => ({
      minStage: 2,
      prompt: `${subject} ont ${object}.`,
      correct: 'ont',
      pairPartner: 'on',
    }))
  ),
];

// --- ce / se ----------------------------------------------------------------

// Des objets masculins et des états qui leur conviennent tous, pour éviter
// à la fois un accord fautif (les prédicats restent au masculin) et une
// phrase absurde (« un livre aboie » n'aurait pas de sens).
const SIMPLE_OBJECTS = ['livre', 'cahier', 'ballon', 'vélo', 'stylo', 'jardin', 'gâteau', 'dessin', 'cartable', 'tableau'];
const CE_PREDICATES = [
  'est par terre',
  'est dans le sac',
  'est sur la table',
  'appartient à Léa',
  'est tout neuf',
  'traîne dans la classe',
];
const SE_PREDICATES = [
  'lave les mains',
  'promène dans le parc',
  'habille très vite',
  'brosse les dents',
  'coiffe devant le miroir',
  'repose un moment',
];

const CE_SE_ITEMS: HomophoneItem[] = [
  ...SIMPLE_OBJECTS.flatMap((object) =>
    CE_PREDICATES.map((predicate): HomophoneItem => ({
      minStage: 3,
      prompt: `... ${object} ${predicate}.`,
      correct: 'ce',
      pairPartner: 'se',
    }))
  ),
  ...SUBJECTS_3SG.flatMap((subject) =>
    SE_PREDICATES.map((predicate): HomophoneItem => ({
      minStage: 3,
      prompt: `${subject} ... ${predicate}.`,
      correct: 'se',
      pairPartner: 'ce',
    }))
  ),
];

// --- son / sont --------------------------------------------------------------

const OBJECTS_POSSESSED = ['sac', 'cahier', 'vélo', 'chapeau', 'livre', 'goûter', 'cartable', 'stylo', 'ballon', 'manteau'];

const SON_SONT_ITEMS: HomophoneItem[] = [
  ...SUBJECTS_3SG.flatMap((subject) =>
    OBJECTS_POSSESSED.map((object): HomophoneItem => ({
      minStage: 4,
      prompt: `${subject} range ... ${object}.`,
      correct: 'son',
      pairPartner: 'sont',
    }))
  ),
  ...SUBJECTS_3PL.flatMap((subject) =>
    PLURAL_STATES.map((state): HomophoneItem => ({
      minStage: 4,
      prompt: `${subject} ... ${state}.`,
      correct: 'sont',
      pairPartner: 'son',
    }))
  ),
];

// --- ces / ses ----------------------------------------------------------------

const THINGS_SHOWN = ['enfants', 'fleurs', 'histoires', 'photos', 'chansons', 'idées', 'affaires', 'amis'];

const CES_SES_ITEMS: HomophoneItem[] = [
  ...THINGS_SHOWN.map((thing): HomophoneItem => ({
    minStage: 5,
    prompt: `... ${thing}-là sont formidables.`,
    correct: 'ces',
    pairPartner: 'ses',
  })),
  ...SUBJECTS_3SG.flatMap((subject) =>
    THINGS_SHOWN.map((thing): HomophoneItem => ({
      minStage: 5,
      prompt: `${subject} range ... ${thing}.`,
      correct: 'ses',
      pairPartner: 'ces',
    }))
  ),
];

// --- ou / où ------------------------------------------------------------------

const CHOICES_PAIRS: [string, string][] = [
  ['du thé', 'du café'],
  ['la mer', 'la montagne'],
  ['un livre', 'un jeu'],
  ['le vélo', 'la trottinette'],
  ['des pommes', 'des poires'],
  ['dessiner', 'lire'],
  ['chanter', 'danser'],
  ['le rouge', 'le bleu'],
];

const PLACES_ASKED = ["l'école", 'la piscine', 'la cantine', 'la bibliothèque', 'la maison', 'le stade', 'le parc', 'la classe'];

const OU_OU_ITEMS: HomophoneItem[] = [
  ...CHOICES_PAIRS.map(([a, b]): HomophoneItem => ({
    minStage: 5,
    prompt: `Tu préfères ${a} ... ${b} ?`,
    correct: 'ou',
    pairPartner: 'où',
  })),
  ...PLACES_ASKED.map((place): HomophoneItem => ({
    minStage: 5,
    prompt: `Je ne sais pas ... se trouve ${place}.`,
    correct: 'où',
    pairPartner: 'ou',
  })),
];

// --- c'est / s'est --------------------------------------------------------------

const CEST_ADJECTIVES = ['une belle journée', 'un jour de fête', 'une bonne idée', 'un joli cadeau', 'un grand bonheur'];

// « s'est » précède un participe passé, accordé avec le sujet : un sujet
// masculin et un sujet féminin n'emploient pas la même liste.
const MASCULINE_SUBJECTS = ['Paul', 'Tom', 'Sami', 'Hugo', 'Lucas', 'Il', 'Mon frère'];
const FEMININE_SUBJECTS = ['Léa', 'Marion', 'Nora', 'Chloé', 'Manon', 'Elle', 'Ma sœur'];
const SEST_PREDICATES_M = ['blessé au genou', 'levé très tôt', 'endormi sur le canapé', 'assis dans l\'herbe', 'perdu dans la forêt'];
const SEST_PREDICATES_F = ['blessée au genou', 'levée très tôt', 'endormie sur le canapé', 'assise dans l\'herbe', 'perdue dans la forêt'];

const CEST_SEST_ITEMS: HomophoneItem[] = [
  ...CEST_ADJECTIVES.map((phrase): HomophoneItem => ({
    minStage: 6,
    prompt: `... ${phrase}.`,
    correct: "c'est",
    pairPartner: "s'est",
  })),
  ...MASCULINE_SUBJECTS.flatMap((subject) =>
    SEST_PREDICATES_M.map((predicate): HomophoneItem => ({
      minStage: 6,
      prompt: `${subject} ... ${predicate}.`,
      correct: "s'est",
      pairPartner: "c'est",
    }))
  ),
  ...FEMININE_SUBJECTS.flatMap((subject) =>
    SEST_PREDICATES_F.map((predicate): HomophoneItem => ({
      minStage: 6,
      prompt: `${subject} ... ${predicate}.`,
      correct: "s'est",
      pairPartner: "c'est",
    }))
  ),
];

export const HOMOPHONE_ITEMS: HomophoneItem[] = [
  ...A_A_ITEMS,
  ...ET_EST_ITEMS,
  ...ON_ONT_ITEMS,
  ...CE_SE_ITEMS,
  ...SON_SONT_ITEMS,
  ...CES_SES_ITEMS,
  ...OU_OU_ITEMS,
  ...CEST_SEST_ITEMS,
];

/** Vocabulaire : arrive en fin de CM2. */
export interface SynonymItem extends Staged {
  word: string;
  correct: string;
  distractors: [string, string, string];
}

export const SYNONYM_ITEMS: SynonymItem[] = [
  { minStage: 6, word: 'content', correct: 'joyeux', distractors: ['triste', 'fatigué', 'énervé'] },
  { minStage: 6, word: 'grand', correct: 'immense', distractors: ['petit', 'léger', 'court'] },
  { minStage: 6, word: 'beau', correct: 'magnifique', distractors: ['laid', 'ordinaire', 'sombre'] },
  { minStage: 6, word: 'avoir peur', correct: 'craindre', distractors: ['aimer', 'oublier', 'chanter'] },
  { minStage: 6, word: 'regarder', correct: 'observer', distractors: ['écouter', 'toucher', 'sentir'] },
  { minStage: 6, word: 'petit', correct: 'minuscule', distractors: ['énorme', 'moyen', 'large'] },
  { minStage: 6, word: 'fatigué', correct: 'épuisé', distractors: ['reposé', 'joyeux', 'guéri'] },
  { minStage: 6, word: 'triste', correct: 'malheureux', distractors: ['joyeux', 'calme', 'fier'] },
  { minStage: 6, word: 'drôle', correct: 'amusant', distractors: ['ennuyeux', 'sérieux', 'triste'] },
  { minStage: 6, word: 'gentil', correct: 'aimable', distractors: ['méchant', 'timide', 'bruyant'] },
  { minStage: 6, word: 'difficile', correct: 'compliqué', distractors: ['facile', 'court', 'simple'] },
  { minStage: 6, word: 'facile', correct: 'simple', distractors: ['difficile', 'long', 'lourd'] },
  { minStage: 6, word: 'commencer', correct: 'débuter', distractors: ['finir', 'arrêter', 'attendre'] },
  { minStage: 6, word: 'finir', correct: 'terminer', distractors: ['commencer', 'continuer', 'attendre'] },
  { minStage: 6, word: 'parler', correct: 'discuter', distractors: ['écrire', 'lire', 'dessiner'] },
  { minStage: 6, word: 'rapide', correct: 'véloce', distractors: ['lent', 'calme', 'lourd'] },
  { minStage: 6, word: 'courageux', correct: 'brave', distractors: ['peureux', 'timide', 'faible'] },
  { minStage: 6, word: 'chercher', correct: 'rechercher', distractors: ['trouver', 'perdre', 'ranger'] },
  { minStage: 6, word: 'aider', correct: 'assister', distractors: ['gêner', 'oublier', 'punir'] },
  { minStage: 6, word: 'briller', correct: 'scintiller', distractors: ['noircir', 'tomber', 'geler'] },
];

/** Vocabulaire : les contraires, en fin de CM2 aussi. */
export interface AntonymItem extends Staged {
  word: string;
  correct: string;
  distractors: [string, string, string];
}

export const ANTONYM_ITEMS: AntonymItem[] = [
  { minStage: 6, word: 'grand', correct: 'petit', distractors: ['immense', 'joli', 'rapide'] },
  { minStage: 6, word: 'content', correct: 'triste', distractors: ['calme', 'sage', 'poli'] },
  { minStage: 6, word: 'chaud', correct: 'froid', distractors: ['tiède', 'sec', 'humide'] },
  { minStage: 6, word: 'rapide', correct: 'lent', distractors: ['fort', 'léger', 'court'] },
  { minStage: 6, word: 'facile', correct: 'difficile', distractors: ['simple', 'court', 'clair'] },
  { minStage: 6, word: 'plein', correct: 'vide', distractors: ['lourd', 'grand', 'rond'] },
  { minStage: 6, word: 'commencer', correct: 'finir', distractors: ['continuer', 'attendre', 'jouer'] },
  { minStage: 6, word: 'monter', correct: 'descendre', distractors: ['partir', 'rester', 'tomber'] },
  { minStage: 6, word: 'jour', correct: 'nuit', distractors: ['matin', 'soir', 'heure'] },
  { minStage: 6, word: 'gentil', correct: 'méchant', distractors: ['timide', 'calme', 'triste'] },
  { minStage: 6, word: 'propre', correct: 'sale', distractors: ['neuf', 'vieux', 'joli'] },
  { minStage: 6, word: 'fort', correct: 'faible', distractors: ['lourd', 'grand', 'rapide'] },
];
