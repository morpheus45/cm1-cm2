/**
 * Les verbes de la conjugaison, sous forme de tables complètes plutôt que de
 * phrases toutes faites : chaque verbe porte sa conjugaison entière, à chaque
 * temps du programme, pour les six personnes. Le générateur (conjugaison.ts)
 * combine ensuite verbe × personne × temps pour fabriquer les phrases : c'est
 * cette combinatoire, et non une liste de phrases écrites à la main, qui
 * donne des centaines de questions différentes.
 *
 * Les verbes du 1er groupe et du 2e groupe sont construits par des règles
 * (radical + terminaison), vérifiées par conjugaisonVerbes.test.ts sur des
 * formes de référence. Les verbes irréguliers sont écrits en toutes lettres :
 * aucune règle ne les dérive de façon fiable.
 */

export type Person = 'je' | 'tu' | 'il' | 'nous' | 'vous' | 'ils';

export const PERSONS: Person[] = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

export type Tense =
  | 'présent'
  | 'imparfait'
  | 'futur'
  | 'passé composé'
  | 'passé simple'
  | 'plus-que-parfait'
  | 'conditionnel présent';

export const ALL_TENSES: Tense[] = [
  'présent',
  'imparfait',
  'futur',
  'passé composé',
  'passé simple',
  'plus-que-parfait',
  'conditionnel présent',
];

type Paradigm = Record<Person, string>;

export interface Verb {
  infinitive: string;
  /** Ce qui suit le verbe dans la phrase, quel que soit le sujet : « la mousse au chocolat. » */
  complement: string;
  /**
   * Faux pour les verbes qui se conjuguent avec « être » aux temps composés
   * (aller, venir) : leur participe s'accorde avec le sujet, ce que teste
   * accords.ts. Le domaine conjugaison ne pose alors pas de question au
   * passé composé ni au plus-que-parfait avec ces verbes-là.
   */
  canCompound: boolean;
  forms: Record<Tense, Paradigm>;
}

function paradigm(je: string, tu: string, il: string, nous: string, vous: string, ils: string): Paradigm {
  return { je, tu, il, nous, vous, ils };
}

// --- 1er groupe : radical + terminaisons, avec les variantes orthographiques
// enseignées à l'école (-cer, -ger, -yer, e→è, consonne doublée). -------------

type Pattern1 = 'regular' | 'cer' | 'ger' | 'yer' | 'e-accent' | 'double';

/** Le radical devant une terminaison qui commence par « a » ou « o » :
 *  commenc- devient commenç-, mang- devient mange-. */
function beforeAO(stem: string, pattern: Pattern1): string {
  if (pattern === 'cer') return `${stem.slice(0, -1)}ç`;
  if (pattern === 'ger') return `${stem}e`;
  return stem;
}

/** Le radical devant une terminaison muette (e, es, e, ent) ou tout le futur
 *  et le conditionnel : nettoy- devient nettoi-, achet- devient achèt-,
 *  appel- devient appell-. */
function muteStem(stem: string, pattern: Pattern1): string {
  if (pattern === 'yer') return `${stem.slice(0, -1)}i`;
  if (pattern === 'e-accent') return `${stem.slice(0, -2)}è${stem.slice(-1)}`;
  if (pattern === 'double') return `${stem}${stem.slice(-1)}`;
  return stem;
}

const AO_TRIGGER: Partial<Record<Tense, Person[]>> = {
  'présent': ['nous'],
  'imparfait': ['je', 'tu', 'il', 'ils'],
  'passé simple': ['je', 'tu', 'il', 'nous', 'vous'],
};

const MUTE_E_TRIGGER: Partial<Record<Tense, Person[]>> = {
  'présent': ['je', 'tu', 'il', 'ils'],
  'futur': PERSONS,
  'conditionnel présent': PERSONS,
};

const ENDINGS_1: Record<'présent' | 'imparfait' | 'futur' | 'passé simple' | 'conditionnel présent', Paradigm> = {
  'présent': paradigm('e', 'es', 'e', 'ons', 'ez', 'ent'),
  'imparfait': paradigm('ais', 'ais', 'ait', 'ions', 'iez', 'aient'),
  'futur': paradigm('ai', 'as', 'a', 'ons', 'ez', 'ont'),
  'passé simple': paradigm('ai', 'as', 'a', 'âmes', 'âtes', 'èrent'),
  'conditionnel présent': paradigm('ais', 'ais', 'ait', 'ions', 'iez', 'aient'),
};

const STEM_CHANGING_PATTERNS: Pattern1[] = ['yer', 'e-accent', 'double'];

function group1Forms(infinitive: string, pattern: Pattern1): Record<Tense, Paradigm> {
  const stem = infinitive.slice(0, -2);
  const stemFor = (tense: Tense, person: Person): string => {
    if (AO_TRIGGER[tense]?.includes(person)) return beforeAO(stem, pattern);
    if (MUTE_E_TRIGGER[tense]?.includes(person)) return muteStem(stem, pattern);
    return stem;
  };
  const simple = (tense: 'présent' | 'imparfait' | 'passé simple'): Paradigm =>
    paradigm(
      ...PERSONS.map((person) => `${stemFor(tense, person)}${ENDINGS_1[tense][person]}`) as [string, string, string, string, string, string]
    );

  // Le futur et le conditionnel s'appuient sur l'infinitif lui-même — sa
  // graphie porte déjà le c doux ou le g doux (commencer, manger) — sauf
  // pour les verbes dont le radical change durablement (nettoyer, acheter,
  // appeler).
  const futureRadical = STEM_CHANGING_PATTERNS.includes(pattern) ? `${muteStem(stem, pattern)}er` : infinitive;
  const futur = paradigm(
    ...PERSONS.map((person) => `${futureRadical}${ENDINGS_1.futur[person]}`) as [string, string, string, string, string, string]
  );
  const conditionnel = paradigm(
    ...PERSONS.map((person) => `${futureRadical}${ENDINGS_1['conditionnel présent'][person]}`) as [
      string,
      string,
      string,
      string,
      string,
      string,
    ]
  );

  const participe = `${stem}é`;
  const compound = (auxiliaire: Paradigm): Paradigm =>
    paradigm(...PERSONS.map((person) => `${auxiliaire[person]} ${participe}`) as [string, string, string, string, string, string]);

  return {
    'présent': simple('présent'),
    'imparfait': simple('imparfait'),
    'futur': futur,
    'passé simple': simple('passé simple'),
    'conditionnel présent': conditionnel,
    'passé composé': compound(AVOIR_PRESENT),
    'plus-que-parfait': compound(AVOIR_IMPARFAIT),
  };
}

// --- 2e groupe : finir, choisir... aucune variante orthographique. ----------

function group2Forms(infinitive: string): Record<Tense, Paradigm> {
  const stem = infinitive.slice(0, -2);
  const participe = `${stem}i`;
  const compound = (auxiliaire: Paradigm): Paradigm =>
    paradigm(...PERSONS.map((person) => `${auxiliaire[person]} ${participe}`) as [string, string, string, string, string, string]);
  return {
    'présent': paradigm(`${stem}is`, `${stem}is`, `${stem}it`, `${stem}issons`, `${stem}issez`, `${stem}issent`),
    'imparfait': paradigm(
      `${stem}issais`,
      `${stem}issais`,
      `${stem}issait`,
      `${stem}issions`,
      `${stem}issiez`,
      `${stem}issaient`
    ),
    'futur': paradigm(
      `${infinitive}ai`,
      `${infinitive}as`,
      `${infinitive}a`,
      `${infinitive}ons`,
      `${infinitive}ez`,
      `${infinitive}ont`
    ),
    'passé simple': paradigm(`${stem}is`, `${stem}is`, `${stem}it`, `${stem}îmes`, `${stem}îtes`, `${stem}irent`),
    'conditionnel présent': paradigm(
      `${infinitive}ais`,
      `${infinitive}ais`,
      `${infinitive}ait`,
      `${infinitive}ions`,
      `${infinitive}iez`,
      `${infinitive}aient`
    ),
    'passé composé': compound(AVOIR_PRESENT),
    'plus-que-parfait': compound(AVOIR_IMPARFAIT),
  };
}

function group1(infinitive: string, complement: string, pattern: Pattern1 = 'regular'): Verb {
  return { infinitive, complement, canCompound: true, forms: group1Forms(infinitive, pattern) };
}

function group2(infinitive: string, complement: string): Verb {
  return { infinitive, complement, canCompound: true, forms: group2Forms(infinitive) };
}

// --- Auxiliaires, utilisés pour les temps composés des verbes ci-dessus. ---

const AVOIR_PRESENT = paradigm('ai', 'as', 'a', 'avons', 'avez', 'ont');
const AVOIR_IMPARFAIT = paradigm('avais', 'avais', 'avait', 'avions', 'aviez', 'avaient');
const ETRE_PRESENT = paradigm('suis', 'es', 'est', 'sommes', 'êtes', 'sont');

// --- Verbes irréguliers : tables écrites en toutes lettres. -----------------

function compoundWith(auxiliaire: Paradigm, participe: string): Paradigm {
  return paradigm(...PERSONS.map((person) => `${auxiliaire[person]} ${participe}`) as [string, string, string, string, string, string]);
}

const ETRE: Verb = {
  infinitive: 'être',
  // Adjectif invariable en genre : le sujet peut être féminin (Elle, Léa,
  // Marion...) et « content » resterait faux à l'oreille pour ces sujets.
  complement: 'très sage.',
  canCompound: true,
  forms: {
    'présent': ETRE_PRESENT,
    'imparfait': paradigm('étais', 'étais', 'était', 'étions', 'étiez', 'étaient'),
    'futur': paradigm('serai', 'seras', 'sera', 'serons', 'serez', 'seront'),
    'passé simple': paradigm('fus', 'fus', 'fut', 'fûmes', 'fûtes', 'furent'),
    'conditionnel présent': paradigm('serais', 'serais', 'serait', 'serions', 'seriez', 'seraient'),
    'passé composé': compoundWith(AVOIR_PRESENT, 'été'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'été'),
  },
};

const AVOIR: Verb = {
  infinitive: 'avoir',
  complement: 'un chien noir.',
  canCompound: true,
  forms: {
    'présent': AVOIR_PRESENT,
    'imparfait': AVOIR_IMPARFAIT,
    'futur': paradigm('aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'),
    'passé simple': paradigm('eus', 'eus', 'eut', 'eûmes', 'eûtes', 'eurent'),
    'conditionnel présent': paradigm('aurais', 'aurais', 'aurait', 'aurions', 'auriez', 'auraient'),
    'passé composé': compoundWith(AVOIR_PRESENT, 'eu'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'eu'),
  },
};

const ALLER: Verb = {
  infinitive: 'aller',
  complement: "à l'école à pied.",
  // Aux temps composés, « aller » se conjugue avec être : son participe
  // s'accorde avec le sujet. Ce domaine ne pose alors pas de question à ces
  // temps-là pour ce verbe ; accords.ts teste cet accord-là.
  canCompound: false,
  forms: {
    'présent': paradigm('vais', 'vas', 'va', 'allons', 'allez', 'vont'),
    'imparfait': paradigm('allais', 'allais', 'allait', 'allions', 'alliez', 'allaient'),
    'futur': paradigm('irai', 'iras', 'ira', 'irons', 'irez', 'iront'),
    'passé simple': paradigm('allai', 'allas', 'alla', 'allâmes', 'allâtes', 'allèrent'),
    'conditionnel présent': paradigm('irais', 'irais', 'irait', 'irions', 'iriez', 'iraient'),
    'passé composé': compoundWith(ETRE_PRESENT, 'allé'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'allé'),
  },
};

const FAIRE: Verb = {
  infinitive: 'faire',
  // Article défini plutôt que possessif : « faire les devoirs » convient à
  // n'importe quel sujet, alors que « ses devoirs » ne suivrait pas « nous »
  // ou « ils » (il faudrait « nos »/« leurs »).
  complement: 'les devoirs.',
  canCompound: true,
  forms: {
    'présent': paradigm('fais', 'fais', 'fait', 'faisons', 'faites', 'font'),
    'imparfait': paradigm('faisais', 'faisais', 'faisait', 'faisions', 'faisiez', 'faisaient'),
    'futur': paradigm('ferai', 'feras', 'fera', 'ferons', 'ferez', 'feront'),
    'passé simple': paradigm('fis', 'fis', 'fit', 'fîmes', 'fîtes', 'firent'),
    'conditionnel présent': paradigm('ferais', 'ferais', 'ferait', 'ferions', 'feriez', 'feraient'),
    'passé composé': compoundWith(AVOIR_PRESENT, 'fait'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'fait'),
  },
};

const DIRE: Verb = {
  infinitive: 'dire',
  complement: 'la vérité.',
  canCompound: true,
  forms: {
    'présent': paradigm('dis', 'dis', 'dit', 'disons', 'dites', 'disent'),
    'imparfait': paradigm('disais', 'disais', 'disait', 'disions', 'disiez', 'disaient'),
    'futur': paradigm('dirai', 'diras', 'dira', 'dirons', 'direz', 'diront'),
    'passé simple': paradigm('dis', 'dis', 'dit', 'dîmes', 'dîtes', 'dirent'),
    'conditionnel présent': paradigm('dirais', 'dirais', 'dirait', 'dirions', 'diriez', 'diraient'),
    'passé composé': compoundWith(AVOIR_PRESENT, 'dit'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'dit'),
  },
};

const VENIR: Verb = {
  infinitive: 'venir',
  complement: 'nous voir à la maison.',
  canCompound: false,
  forms: {
    'présent': paradigm('viens', 'viens', 'vient', 'venons', 'venez', 'viennent'),
    'imparfait': paradigm('venais', 'venais', 'venait', 'venions', 'veniez', 'venaient'),
    'futur': paradigm('viendrai', 'viendras', 'viendra', 'viendrons', 'viendrez', 'viendront'),
    'passé simple': paradigm('vins', 'vins', 'vint', 'vînmes', 'vîntes', 'vinrent'),
    'conditionnel présent': paradigm('viendrais', 'viendrais', 'viendrait', 'viendrions', 'viendriez', 'viendraient'),
    'passé composé': compoundWith(ETRE_PRESENT, 'venu'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'venu'),
  },
};

const PRENDRE: Verb = {
  infinitive: 'prendre',
  complement: 'le cartable.',
  canCompound: true,
  forms: {
    'présent': paradigm('prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'),
    'imparfait': paradigm('prenais', 'prenais', 'prenait', 'prenions', 'preniez', 'prenaient'),
    'futur': paradigm('prendrai', 'prendras', 'prendra', 'prendrons', 'prendrez', 'prendront'),
    'passé simple': paradigm('pris', 'pris', 'prit', 'prîmes', 'prîtes', 'prirent'),
    'conditionnel présent': paradigm('prendrais', 'prendrais', 'prendrait', 'prendrions', 'prendriez', 'prendraient'),
    'passé composé': compoundWith(AVOIR_PRESENT, 'pris'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'pris'),
  },
};

const POUVOIR: Verb = {
  infinitive: 'pouvoir',
  complement: "m'aider un peu.",
  canCompound: true,
  forms: {
    'présent': paradigm('peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'),
    'imparfait': paradigm('pouvais', 'pouvais', 'pouvait', 'pouvions', 'pouviez', 'pouvaient'),
    'futur': paradigm('pourrai', 'pourras', 'pourra', 'pourrons', 'pourrez', 'pourront'),
    'passé simple': paradigm('pus', 'pus', 'put', 'pûmes', 'pûtes', 'purent'),
    'conditionnel présent': paradigm('pourrais', 'pourrais', 'pourrait', 'pourrions', 'pourriez', 'pourraient'),
    'passé composé': compoundWith(AVOIR_PRESENT, 'pu'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'pu'),
  },
};

const VOIR: Verb = {
  infinitive: 'voir',
  complement: 'un bel oiseau.',
  canCompound: true,
  forms: {
    'présent': paradigm('vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'),
    'imparfait': paradigm('voyais', 'voyais', 'voyait', 'voyions', 'voyiez', 'voyaient'),
    'futur': paradigm('verrai', 'verras', 'verra', 'verrons', 'verrez', 'verront'),
    'passé simple': paradigm('vis', 'vis', 'vit', 'vîmes', 'vîtes', 'virent'),
    'conditionnel présent': paradigm('verrais', 'verrais', 'verrait', 'verrions', 'verriez', 'verraient'),
    'passé composé': compoundWith(AVOIR_PRESENT, 'vu'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'vu'),
  },
};

const VOULOIR: Verb = {
  infinitive: 'vouloir',
  complement: 'partir en vacances.',
  canCompound: true,
  forms: {
    'présent': paradigm('veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'),
    'imparfait': paradigm('voulais', 'voulais', 'voulait', 'voulions', 'vouliez', 'voulaient'),
    'futur': paradigm('voudrai', 'voudras', 'voudra', 'voudrons', 'voudrez', 'voudront'),
    'passé simple': paradigm('voulus', 'voulus', 'voulut', 'voulûmes', 'voulûtes', 'voulurent'),
    'conditionnel présent': paradigm('voudrais', 'voudrais', 'voudrait', 'voudrions', 'voudriez', 'voudraient'),
    'passé composé': compoundWith(AVOIR_PRESENT, 'voulu'),
    'plus-que-parfait': compoundWith(AVOIR_IMPARFAIT, 'voulu'),
  },
};

export const IRREGULAR_VERBS: Verb[] = [ETRE, AVOIR, ALLER, FAIRE, DIRE, VENIR, PRENDRE, POUVOIR, VOIR, VOULOIR];

export const GROUP1_VERBS: Verb[] = [
  group1('aimer', 'la mousse au chocolat.'),
  group1('jouer', 'dans la cour.'),
  group1('chanter', 'une jolie chanson.'),
  group1('regarder', 'un film.'),
  group1('écouter', 'de la musique.'),
  group1('marcher', 'très vite.'),
  group1('préparer', 'le repas.'),
  group1('dessiner', 'un joli dessin.'),
  group1('laver', 'la vaisselle.'),
  group1('chercher', 'les clés.'),
  group1('montrer', 'le cahier.'),
  group1('tourner', 'la page.'),
  group1('danser', 'toute la soirée.'),
  group1('commencer', 'un exercice.', 'cer'),
  group1('lancer', 'le ballon.', 'cer'),
  group1('placer', 'les livres sur l\'étagère.', 'cer'),
  group1('manger', 'à la cantine.', 'ger'),
  group1('ranger', 'la chambre.', 'ger'),
  group1('nager', 'à la piscine.', 'ger'),
  group1('changer', "d'avis.", 'ger'),
  group1('nettoyer', 'la classe.', 'yer'),
  group1('employer', 'un mot nouveau.', 'yer'),
  group1('essuyer', 'la table.', 'yer'),
  group1('acheter', 'un cartable.', 'e-accent'),
  group1('lever', 'la main.', 'e-accent'),
  group1('peser', 'les fruits.', 'e-accent'),
  group1('appeler', 'le docteur.', 'double'),
  group1('jeter', 'le papier à la poubelle.', 'double'),
  group1('rappeler', 'la leçon.', 'double'),
];

export const GROUP2_VERBS: Verb[] = [
  group2('finir', 'un exercice.'),
  group2('choisir', 'un livre.'),
  group2('grandir', 'très vite.'),
  group2('réussir', 'un contrôle.'),
  group2('remplir', 'la fiche.'),
  group2('punir', 'les élèves bruyants.'),
  group2('rougir', 'de honte.'),
  group2('guérir', 'très vite.'),
  group2('nourrir', 'les poules.'),
  group2('obéir', 'tout de suite.'),
];

export const ALL_VERBS: Verb[] = [...GROUP1_VERBS, ...GROUP2_VERBS, ...IRREGULAR_VERBS];
