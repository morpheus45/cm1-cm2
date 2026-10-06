import {
  AVOIR_IMPARFAIT,
  AVOIR_PRESENT,
  compoundWith,
  ETRE_PRESENT,
  GROUP1_VERBS,
  GROUP2_VERBS,
  IRREGULAR_VERBS,
  group1,
  group2,
  paradigm,
  type Paradigm,
  type Person,
  type Verb,
} from './conjugaisonVerbes';

/**
 * Les verbes du CE1, du CE2 et de la 6e.
 *
 * Chaque verbe porte, comme au CM, une phrase qui le suit (`complement`) et qui
 * convient à tous les sujets et à tous les temps : ni possessif (« son »
 * ne suivrait pas « nous »), ni indicateur de temps (« hier » refuserait le
 * futur), ni verbe pronominal. Les phrases du cycle 2 sont courtes et ne
 * nomment que des choses qu'un enfant de sept ans connaît ; celles de la 6e
 * sont plus longues et plus variées.
 */

// --- Cycle 2 : CE1 et CE2 --------------------------------------------------

/**
 * Les verbes du 1er groupe du cycle 2. Le programme ne cite que le modèle
 * « parler » : tous sont réguliers (radical + terminaison). Les verbes à
 * radical particulier — manger et nager (« nous mangeons »), commencer et
 * lancer (« nous commençons »), nettoyer, acheter, appeler, jeter — sont
 * laissés au cycle 3, où le programme les rencontre. Aucun verbe qui se
 * conjugue avec « être » au passé composé non plus (arriver, tomber,
 * rester) : l'accord du participe passé ne s'enseigne qu'au CM1.
 */
export const VERBES_REGULIERS_CYCLE_2: Verb[] = [
  group1('aimer', 'les fraises.'),
  group1('chanter', 'une chanson.'),
  group1('jouer', 'au ballon.'),
  group1('regarder', 'un dessin animé.'),
  group1('écouter', 'de la musique.'),
  group1('marcher', 'dans la rue.'),
  group1('danser', 'dans la cour.'),
  group1('dessiner', 'un chat.'),
  group1('laver', 'la voiture.'),
  group1('chercher', 'les clés.'),
  group1('montrer', 'un livre.'),
  group1('tourner', 'la page.'),
  group1('sauter', 'très haut.'),
  group1('pousser', 'la porte.'),
  group1('fermer', 'la fenêtre.'),
  group1('porter', 'un sac.'),
  group1('donner', 'un bonbon.'),
  group1('trouver', 'une clé.'),
  group1('parler', 'tout bas.'),
  group1('couper', 'le pain.'),
  group1('coller', 'une image.'),
  group1('cacher', 'un jouet.'),
  group1('préparer', 'un gâteau.'),
  group1('inviter', 'un copain.'),
  group1('bavarder', 'en classe.'),
  group1('raconter', 'une histoire.'),
  group1('ramasser', 'les feuilles.'),
  group1('poser', 'le crayon.'),
  group1('arroser', 'les fleurs.'),
  group1('planter', 'un arbre.'),
  group1('tirer', 'la corde.'),
  group1('frapper', 'à la porte.'),
  group1('allumer', 'la lampe.'),
  group1('visiter', 'un château.'),
  group1('décorer', 'la classe.'),
  group1('habiter', 'en ville.'),
  group1('gonfler', 'un ballon.'),
  group1('attraper', 'le ballon.'),
  group1('caresser', 'le chat.'),
  group1('réparer', 'le vélo.'),
  group1('creuser', 'un trou.'),
  group1('glisser', 'sur la glace.'),
  group1('grimper', "dans l'arbre."),
  group1('éplucher', 'une carotte.'),
  group1('verser', 'du lait.'),
  group1('compter', 'les billes.'),
  group1('pêcher', 'un poisson.'),
  group1('tricoter', 'une écharpe.'),
  group1('emballer', 'un cadeau.'),
  group1('déchirer', 'une feuille.'),
];

function irregulier(infinitive: string): Verb {
  const verbe = IRREGULAR_VERBS.find((candidate) => candidate.infinitive === infinitive);
  if (!verbe) throw new Error(`verbe irrégulier manquant : ${infinitive}`);
  return verbe;
}

/** Être et avoir : les seuls verbes irréguliers du CE1. */
export const ETRE_ET_AVOIR: Verb[] = [irregulier('être'), irregulier('avoir')];

/** Les huit verbes irréguliers du 3e groupe du CE2, dans l'ordre du
 *  programme : faire, aller, dire, venir (T1), puis pouvoir, voir, vouloir,
 *  prendre (T2). */
export const IRREGULIERS_CE2_D_ABORD: Verb[] = ['faire', 'aller', 'dire', 'venir'].map(irregulier);
export const IRREGULIERS_CE2_ENSUITE: Verb[] = ['pouvoir', 'voir', 'vouloir', 'prendre'].map(irregulier);

/** Le verbe se conjugue-t-il avec « être » au passé composé (aller, venir) ?
 *  Son participe s'accorde alors avec le sujet. */
export function seConjugueAvecEtre(verbe: Verb): boolean {
  return verbe.forms['passé composé'].il.startsWith('est ');
}

/**
 * Les erreurs d'élève du présent des verbes irréguliers, celles que le
 * programme met en garde : « vous dites », « vous faites » (pas « disez »,
 * « faisez ») ; « ils vont », « ils font » (pas « allent », « faisent »), et
 * les verbes qu'on conjugue par analogie avec le 1er groupe. Aucune de ces
 * formes n'existe : elles ne peuvent jamais être une bonne réponse.
 */
export const ERREURS_DU_PRESENT: Record<string, Partial<Record<Person, string>>> = {
  faire: { vous: 'faisez', ils: 'faisent' },
  dire: { vous: 'disez' },
  aller: { ils: 'allent' },
  prendre: { ils: 'prendent' },
  voir: { ils: 'voyent' },
  vouloir: { ils: 'voulent' },
};

// --- 6e ---------------------------------------------------------------------

/** Les phrases de la 6e pour les verbes du CM : plus longues, plus variées. */
const COMPLEMENTS_6E: Record<string, string> = {
  // 1er groupe
  aimer: 'les histoires de pirates.',
  jouer: 'aux échecs avec un voisin.',
  chanter: 'à la chorale du village.',
  regarder: 'un documentaire sur les volcans.',
  écouter: 'la radio dans la cuisine.',
  marcher: 'le long de la rivière.',
  préparer: 'un voyage en Écosse.',
  dessiner: 'le plan de la maison.',
  laver: 'les carreaux de la cuisine.',
  chercher: 'un livre à la bibliothèque.',
  montrer: 'le chemin aux voyageurs.',
  tourner: 'la clé dans la serrure.',
  danser: 'sur la place du village.',
  commencer: 'un nouveau chapitre.',
  lancer: 'la balle par-dessus le mur.',
  placer: 'les chaises autour de la table.',
  manger: 'une salade de fruits.',
  ranger: 'les outils dans le garage.',
  nager: 'dans la rivière glacée.',
  changer: 'de place avec un voisin.',
  nettoyer: 'la cage du hamster.',
  employer: 'des mots précis.',
  essuyer: 'la table avec une éponge.',
  acheter: 'des légumes au marché.',
  lever: 'la tête vers le ciel.',
  peser: 'les fruits sur la balance.',
  appeler: 'le médecin du village.',
  jeter: 'les papiers à la poubelle.',
  rappeler: 'la règle à tout le monde.',
  // 2e groupe
  finir: 'le travail avant midi.',
  choisir: 'un roman à la bibliothèque.',
  grandir: 'très vite.',
  réussir: 'une recette difficile.',
  remplir: 'la bouteille au robinet.',
  punir: 'le chien désobéissant.',
  rougir: 'de honte devant tout le monde.',
  guérir: 'rapidement.',
  nourrir: 'les oiseaux en hiver.',
  obéir: 'aux règles du jeu.',
  // 3e groupe
  être: 'à la bibliothèque de la ville.',
  avoir: 'de la patience.',
  aller: 'au marché avec un ami.',
  faire: 'un gâteau pour la fête.',
  dire: 'la vérité au directeur.',
  venir: "à la fête de l'école.",
  prendre: 'le train de huit heures.',
  pouvoir: 'sortir après le repas.',
  voir: 'un renard dans le champ.',
  vouloir: 'visiter le musée de la ville.',
};

const ETRE_IMPARFAIT = paradigm('étais', 'étais', 'était', 'étions', 'étiez', 'étaient');

/**
 * Un verbe du 3e groupe écrit en toutes lettres, à partir de ce qui le
 * distingue : aucune règle ne dérive ses formes de façon sûre. L'imparfait
 * s'appuie sur le radical de « nous » au présent, le futur et le
 * conditionnel sur leur radical propre (« mettr- », « saur- »).
 */
interface Troisieme {
  present: [string, string, string, string, string, string];
  radicalImparfait: string;
  radicalFutur: string;
  passeSimple: [string, string, string, string, string, string];
  participe: string;
  /** Se conjugue avec « être » aux temps composés. */
  avecEtre?: boolean;
}

function troisiemeGroupe(infinitive: string, complement: string, spec: Troisieme): Verb {
  const avecRadical = (radical: string, terminaisons: [string, string, string, string, string, string]): Paradigm =>
    paradigm(...(terminaisons.map((terminaison) => `${radical}${terminaison}`) as [string, string, string, string, string, string]));
  const auxPresent = spec.avecEtre ? ETRE_PRESENT : AVOIR_PRESENT;
  const auxImparfait = spec.avecEtre ? ETRE_IMPARFAIT : AVOIR_IMPARFAIT;
  return {
    infinitive,
    complement,
    canCompound: !spec.avecEtre,
    forms: {
      'présent': paradigm(...spec.present),
      'imparfait': avecRadical(spec.radicalImparfait, ['ais', 'ais', 'ait', 'ions', 'iez', 'aient']),
      'futur': avecRadical(spec.radicalFutur, ['ai', 'as', 'a', 'ons', 'ez', 'ont']),
      'passé simple': paradigm(...spec.passeSimple),
      'conditionnel présent': avecRadical(spec.radicalFutur, ['ais', 'ais', 'ait', 'ions', 'iez', 'aient']),
      'passé composé': compoundWith(auxPresent, spec.participe),
      'plus-que-parfait': compoundWith(auxImparfait, spec.participe),
    },
  };
}

/** Des verbes du 3e groupe de plus que les huit irréguliers du programme :
 *  la 6e conjugue « les verbes des trois groupes ». */
const AUTRES_TROISIEME_GROUPE: Verb[] = [
  troisiemeGroupe('partir', 'en voyage avec un ami.', {
    present: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'],
    radicalImparfait: 'part',
    radicalFutur: 'partir',
    passeSimple: ['partis', 'partis', 'partit', 'partîmes', 'partîtes', 'partirent'],
    participe: 'parti',
    avecEtre: true,
  }),
  troisiemeGroupe('sortir', 'de la maison à cinq heures.', {
    present: ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'],
    radicalImparfait: 'sort',
    radicalFutur: 'sortir',
    passeSimple: ['sortis', 'sortis', 'sortit', 'sortîmes', 'sortîtes', 'sortirent'],
    participe: 'sorti',
    avecEtre: true,
  }),
  troisiemeGroupe('mettre', 'la table pour la fête.', {
    present: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'],
    radicalImparfait: 'mett',
    radicalFutur: 'mettr',
    passeSimple: ['mis', 'mis', 'mit', 'mîmes', 'mîtes', 'mirent'],
    participe: 'mis',
  }),
  troisiemeGroupe('lire', "un roman d'aventures.", {
    present: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'],
    radicalImparfait: 'lis',
    radicalFutur: 'lir',
    passeSimple: ['lus', 'lus', 'lut', 'lûmes', 'lûtes', 'lurent'],
    participe: 'lu',
  }),
  troisiemeGroupe('écrire', 'une lettre à un ami.', {
    present: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'],
    radicalImparfait: 'écriv',
    radicalFutur: 'écrir',
    passeSimple: ['écrivis', 'écrivis', 'écrivit', 'écrivîmes', 'écrivîtes', 'écrivirent'],
    participe: 'écrit',
  }),
  troisiemeGroupe('savoir', 'la chanson par cœur.', {
    present: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'],
    radicalImparfait: 'sav',
    radicalFutur: 'saur',
    passeSimple: ['sus', 'sus', 'sut', 'sûmes', 'sûtes', 'surent'],
    participe: 'su',
  }),
  troisiemeGroupe('dormir', 'dans la tente du jardin.', {
    present: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'],
    radicalImparfait: 'dorm',
    radicalFutur: 'dormir',
    passeSimple: ['dormis', 'dormis', 'dormit', 'dormîmes', 'dormîtes', 'dormirent'],
    participe: 'dormi',
  }),
  troisiemeGroupe('attendre', 'le bus devant la mairie.', {
    present: ['attends', 'attends', 'attend', 'attendons', 'attendez', 'attendent'],
    radicalImparfait: 'attend',
    radicalFutur: 'attendr',
    passeSimple: ['attendis', 'attendis', 'attendit', 'attendîmes', 'attendîtes', 'attendirent'],
    participe: 'attendu',
  }),
  troisiemeGroupe('répondre', 'à la question du guide.', {
    present: ['réponds', 'réponds', 'répond', 'répondons', 'répondez', 'répondent'],
    radicalImparfait: 'répond',
    radicalFutur: 'répondr',
    passeSimple: ['répondis', 'répondis', 'répondit', 'répondîmes', 'répondîtes', 'répondirent'],
    participe: 'répondu',
  }),
  troisiemeGroupe('ouvrir', 'la fenêtre du salon.', {
    present: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'],
    radicalImparfait: 'ouvr',
    radicalFutur: 'ouvrir',
    passeSimple: ['ouvris', 'ouvris', 'ouvrit', 'ouvrîmes', 'ouvrîtes', 'ouvrirent'],
    participe: 'ouvert',
  }),
];

function avecComplement6e(verbe: Verb): Verb {
  const complement = COMPLEMENTS_6E[verbe.infinitive];
  if (!complement) throw new Error(`phrase de 6e manquante pour : ${verbe.infinitive}`);
  return { ...verbe, complement };
}

/** Les verbes du 1er groupe, y compris ceux dont le radical change
 *  (commencer, manger, nettoyer, acheter, appeler), avec leurs phrases de 6e. */
export const VERBES_1ER_GROUPE_6E: Verb[] = GROUP1_VERBS.map(avecComplement6e);

/** Les verbes du 2e groupe, avec leurs phrases de 6e : finir, choisir… */
export const VERBES_2E_GROUPE_6E: Verb[] = [
  ...GROUP2_VERBS.map(avecComplement6e),
  group2('applaudir', 'les artistes du spectacle.'),
  group2('réfléchir', 'à la question posée.'),
  group2('ralentir', 'devant le passage piéton.'),
  group2('bâtir', 'une cabane au fond du jardin.'),
];

/** Les verbes du 3e groupe de la 6e : les huit irréguliers du programme,
 *  être et avoir, et dix autres. */
export const VERBES_3E_GROUPE_6E: Verb[] = [...IRREGULAR_VERBS.map(avecComplement6e), ...AUTRES_TROISIEME_GROUPE];

export const VERBES_6E: Verb[] = [...VERBES_1ER_GROUPE_6E, ...VERBES_2E_GROUPE_6E, ...VERBES_3E_GROUPE_6E];

/** Des infinitifs du 3e groupe qui n'ont pas de table ici : ils ne servent
 *  que de mauvaises réponses quand on demande de reconnaître le groupe d'un
 *  verbe (courir et cueillir finissent en -ir, mais ne sont pas du 2e groupe). */
export const AUTRES_INFINITIFS_3E_GROUPE = [
  'courir',
  'cueillir',
  'offrir',
  'tenir',
  'mourir',
  'servir',
  'sentir',
  'rendre',
  'vendre',
  'perdre',
  'descendre',
  'recevoir',
  'devoir',
  'boire',
  'croire',
  'vivre',
  'suivre',
  'conduire',
];

/** Le groupe d'un verbe du programme de 6e : -er sauf aller, c'est le 1er ; -ir
 *  avec « -issons » au présent, le 2e ; tous les autres, le 3e. Être et avoir,
 *  que les manuels rangent tantôt avec le 3e groupe, tantôt à part, ne servent
 *  jamais à reconnaître un groupe. */
export function groupeDe(verbe: Verb): 1 | 2 | 3 {
  if (verbe.infinitive !== 'aller' && verbe.infinitive.endsWith('er')) return 1;
  if (verbe.forms['présent'].nous.endsWith('issons')) return 2;
  return 3;
}

// --- L'impératif présent ----------------------------------------------------

export interface Imperatif {
  tu: string;
  nous: string;
  vous: string;
}

/** Les verbes dont l'impératif n'est pas dérivé du présent (ou n'existe pas). */
const IMPERATIFS_PARTICULIERS: Record<string, Imperatif | null> = {
  'être': { tu: 'sois', nous: 'soyons', vous: 'soyez' },
  'avoir': { tu: 'aie', nous: 'ayons', vous: 'ayez' },
  'aller': { tu: 'va', nous: 'allons', vous: 'allez' },
  // Pas d'ordre qui ait du sens : on ne commande pas de pouvoir, de savoir ou de vouloir.
  'pouvoir': null,
  'savoir': null,
  'vouloir': null,
  // Des verbes qui n'expriment pas une action qu'on ordonne.
  'grandir': null,
  'rougir': null,
  'guérir': null,
};

/**
 * L'impératif présent d'un verbe : « tu », « nous » et « vous ». Il se lit
 * dans le présent, avec une règle de plus : à la 2e personne du singulier
 * les verbes qui font « -es » au présent perdent leur « s » (chante, ouvre).
 * Rend `null` quand le verbe n'a pas d'impératif d'usage.
 */
export function imperatifDe(verbe: Verb): Imperatif | null {
  const particulier = IMPERATIFS_PARTICULIERS[verbe.infinitive];
  if (particulier !== undefined) return particulier;
  const présent = verbe.forms['présent'];
  const tu = présent.tu.endsWith('es') ? présent.tu.slice(0, -1) : présent.tu;
  return { tu, nous: présent.nous, vous: présent.vous };
}

/** Les personnes de l'impératif, pour qui écrit les tests. */
export const PERSONNES_IMPERATIF: Person[] = ['tu', 'nous', 'vous'];
