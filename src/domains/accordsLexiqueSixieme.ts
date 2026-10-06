import type { Stage } from '../lib/progression';
import type { AdjectifEcrit, Categorie, Genre, NomEcrit, Nombre, Position } from './accordsLexiqueCycle2';

/**
 * Le lexique des accords de la 6e : des noms et des adjectifs plus riches
 * que ceux du cycle 2, et ce que les cas complexes du programme demandent —
 * un sujet placé après le verbe, un sujet éloigné de son verbe, plusieurs
 * sujets, le participe passé avec « être » et avec « avoir ».
 *
 * Tout est à l'étape 7 (6e, 1er trimestre) sauf ce qui arrive plus tard :
 * le participe passé avec « avoir » et un COD placé avant le verbe, au
 * 2e trimestre.
 *
 * Chaque phrase est vérifiée pour ce qu'elle dit : aucun adjectif n'est
 * croisé avec un nom qu'il ne peut pas qualifier (« un orage sportif », « une
 * école dangereuse »), aucun verbe avec un sujet qui ne peut pas l'accomplir
 * (« dans le ciel nagent des oiseaux »).
 */

const T1: Stage = 7;
const T2: Stage = 8;

function noms(categorie: Categorie, liste: [string, string, Genre][]): NomEcrit[] {
  return liste.map(([singulier, pluriel, genre]) => ({ singulier, pluriel, genre, categorie, depuis: T1 }));
}

export const NOMS_6E: NomEcrit[] = [
  ...noms('personne', [
    ['voyageur', 'voyageurs', 'm'],
    ['voyageuse', 'voyageuses', 'f'],
    ['directeur', 'directeurs', 'm'],
    ['directrice', 'directrices', 'f'],
    ['champion', 'champions', 'm'],
    ['championne', 'championnes', 'f'],
    ['oncle', 'oncles', 'm'],
    ['tante', 'tantes', 'f'],
    ['cousin', 'cousins', 'm'],
    ['cousine', 'cousines', 'f'],
    ['voisin', 'voisins', 'm'],
    ['voisine', 'voisines', 'f'],
    ['ami', 'amis', 'm'],
    ['amie', 'amies', 'f'],
    ['boulanger', 'boulangers', 'm'],
    ['boulangère', 'boulangères', 'f'],
    ['infirmier', 'infirmiers', 'm'],
    ['infirmière', 'infirmières', 'f'],
    ['chanteur', 'chanteurs', 'm'],
    ['chanteuse', 'chanteuses', 'f'],
    ['garçon', 'garçons', 'm'],
    ['fille', 'filles', 'f'],
  ]),
  ...noms('animal', [
    ['chat', 'chats', 'm'],
    ['chien', 'chiens', 'm'],
    ['cheval', 'chevaux', 'm'],
    ['oiseau', 'oiseaux', 'm'],
    ['renard', 'renards', 'm'],
    ['loup', 'loups', 'm'],
    ['éléphant', 'éléphants', 'm'],
    ['lion', 'lions', 'm'],
    ['lionne', 'lionnes', 'f'],
    ['tigre', 'tigres', 'm'],
    ['singe', 'singes', 'm'],
    ['girafe', 'girafes', 'f'],
    ['mouton', 'moutons', 'm'],
    ['vache', 'vaches', 'f'],
    ['poule', 'poules', 'f'],
    ['lapin', 'lapins', 'm'],
    ['serpent', 'serpents', 'm'],
    ['tortue', 'tortues', 'f'],
    ['cygne', 'cygnes', 'm'],
    ['canard', 'canards', 'm'],
  ]),
  ...noms('objet', [
    ['ordinateur', 'ordinateurs', 'm'],
    ['cahier', 'cahiers', 'm'],
    ['cartable', 'cartables', 'm'],
    ['trousse', 'trousses', 'f'],
    ['livre', 'livres', 'm'],
    ['tableau', 'tableaux', 'm'],
    ['instrument', 'instruments', 'm'],
    ['outil', 'outils', 'm'],
    ['panier', 'paniers', 'm'],
    ['valise', 'valises', 'f'],
    ['lampe', 'lampes', 'f'],
    ['fenêtre', 'fenêtres', 'f'],
    ['porte', 'portes', 'f'],
    ['chaise', 'chaises', 'f'],
    ['table', 'tables', 'f'],
    ['vélo', 'vélos', 'm'],
    ['miroir', 'miroirs', 'm'],
    ['horloge', 'horloges', 'f'],
    ['couteau', 'couteaux', 'm'],
    ['bijou', 'bijoux', 'm'],
    ['journal', 'journaux', 'm'],
    ['chapeau', 'chapeaux', 'm'],
    ['manteau', 'manteaux', 'm'],
  ]),
  ...noms('lieu', [
    ['bibliothèque', 'bibliothèques', 'f'],
    ['école', 'écoles', 'f'],
    ['musée', 'musées', 'm'],
    ['village', 'villages', 'm'],
    ['ville', 'villes', 'f'],
    ['jardin', 'jardins', 'm'],
    ['gymnase', 'gymnases', 'm'],
    ['stade', 'stades', 'm'],
    ['château', 'châteaux', 'm'],
    ['pont', 'ponts', 'm'],
    ['rue', 'rues', 'f'],
    ['place', 'places', 'f'],
    ['gare', 'gares', 'f'],
    ['cabane', 'cabanes', 'f'],
    ['maison', 'maisons', 'f'],
    ['hôpital', 'hôpitaux', 'm'],
    ['cinéma', 'cinémas', 'm'],
    ['église', 'églises', 'f'],
    ['marché', 'marchés', 'm'],
  ]),
  ...noms('nature', [
    ['rivière', 'rivières', 'f'],
    ['forêt', 'forêts', 'f'],
    ['montagne', 'montagnes', 'f'],
    ['plage', 'plages', 'f'],
    ['lac', 'lacs', 'm'],
    ['orage', 'orages', 'm'],
    ['tempête', 'tempêtes', 'f'],
    ['paysage', 'paysages', 'm'],
    ['champ', 'champs', 'm'],
    ['arbre', 'arbres', 'm'],
    ['fleur', 'fleurs', 'f'],
    ['nuage', 'nuages', 'm'],
    ['colline', 'collines', 'f'],
    ['vague', 'vagues', 'f'],
  ]),
  ...noms('activite', [
    ['voyage', 'voyages', 'm'],
    ['exposé', 'exposés', 'm'],
    ['aventure', 'aventures', 'f'],
    ['leçon', 'leçons', 'f'],
    ['exercice', 'exercices', 'm'],
    ['sortie', 'sorties', 'f'],
    ['jeu', 'jeux', 'm'],
    ['visite', 'visites', 'f'],
  ]),
  ...noms('spectacle', [
    ['spectacle', 'spectacles', 'm'],
    ['concert', 'concerts', 'm'],
    ['film', 'films', 'm'],
    ['fête', 'fêtes', 'f'],
    ['documentaire', 'documentaires', 'm'],
  ]),
  ...noms('nourriture', [
    ['gâteau', 'gâteaux', 'm'],
    ['fromage', 'fromages', 'm'],
    ['pomme', 'pommes', 'f'],
    ['salade', 'salades', 'f'],
    ['soupe', 'soupes', 'f'],
    ['tarte', 'tartes', 'f'],
    ['légume', 'légumes', 'm'],
    ['fruit', 'fruits', 'm'],
    ['pain', 'pains', 'm'],
    ['dessert', 'desserts', 'm'],
  ]),
];

const TOUTES: Categorie[] = ['personne', 'animal', 'objet', 'lieu', 'nature', 'activite', 'spectacle', 'nourriture'];
const COURANTES: Categorie[] = ['personne', 'animal', 'objet', 'lieu', 'activite', 'spectacle', 'nourriture'];
const VIVANTS: Categorie[] = ['personne', 'animal'];

function adjectif(
  masculinSingulier: string,
  femininSingulier: string,
  masculinPluriel: string,
  femininPluriel: string,
  position: Position,
  categories: Categorie[],
  formeDevantVoyelle?: string,
  sauf?: string[]
): AdjectifEcrit {
  return { depuis: T1, masculinSingulier, femininSingulier, masculinPluriel, femininPluriel, position, categories, formeDevantVoyelle, sauf };
}

/**
 * Les adjectifs de la 6e, aux accords que les élèves manquent : -eux/-euse,
 * -if/-ive, -er/-ère, -el/-elle, -al/-aux, -eau/-elle/-eaux, et ceux dont le
 * masculin pluriel ne change pas (mauvais, gros, doux, heureux).
 */
export const ADJECTIFS_6E: AdjectifEcrit[] = [
  adjectif('premier', 'première', 'premiers', 'premières', 'avant', TOUTES),
  adjectif('dernier', 'dernière', 'derniers', 'dernières', 'avant', TOUTES),
  adjectif('mauvais', 'mauvaise', 'mauvais', 'mauvaises', 'avant', TOUTES),
  adjectif('bon', 'bonne', 'bons', 'bonnes', 'avant', COURANTES, undefined, [
    'église',
    'gare',
    'pont',
    'rue',
    'place',
    'château',
    'village',
    'ville',
    'hôpital',
    'stade',
    'gymnase',
  ]),
  adjectif('beau', 'belle', 'beaux', 'belles', 'avant', TOUTES, 'bel'),
  adjectif('nouveau', 'nouvelle', 'nouveaux', 'nouvelles', 'avant', COURANTES, 'nouvel', ['château', 'village']),
  adjectif('vieux', 'vieille', 'vieux', 'vieilles', 'avant', TOUTES, 'vieil', ['orage', 'tempête', 'vague', 'nuage', 'paysage', 'garçon', 'fille']),
  // « Une petite amie » ne se dit pas d'une enfant ; « un petit oncle » et « une grande tante » sont des grands-oncles et des grands-tantes.
  adjectif('petit', 'petite', 'petits', 'petites', 'avant', TOUTES, undefined, ['ami', 'amie', 'oncle', 'tante']),
  adjectif('grand', 'grande', 'grands', 'grandes', 'avant', TOUTES, undefined, ['oncle', 'tante']),
  adjectif('gros', 'grosse', 'gros', 'grosses', 'avant', ['animal', 'objet', 'nature', 'nourriture'], undefined, [
    'rivière',
    'forêt',
    'montagne',
    'plage',
    'paysage',
    'colline',
  ]),
  adjectif('long', 'longue', 'longs', 'longues', 'avant', ['activite', 'spectacle']),
  adjectif('jeune', 'jeune', 'jeunes', 'jeunes', 'avant', VIVANTS),
  adjectif('courageux', 'courageuse', 'courageux', 'courageuses', 'après', VIVANTS),
  adjectif('curieux', 'curieuse', 'curieux', 'curieuses', 'après', VIVANTS),
  adjectif('sportif', 'sportive', 'sportifs', 'sportives', 'après', ['personne']),
  adjectif('actif', 'active', 'actifs', 'actives', 'après', VIVANTS),
  adjectif('bruyant', 'bruyante', 'bruyants', 'bruyantes', 'après', VIVANTS, undefined, ['tortue', 'girafe', 'serpent']),
  adjectif('fier', 'fière', 'fiers', 'fières', 'après', ['personne']),
  adjectif('léger', 'légère', 'légers', 'légères', 'après', ['objet', 'nourriture'], undefined, ['horloge', 'fenêtre']),
  adjectif('doux', 'douce', 'doux', 'douces', 'après', VIVANTS, undefined, ['serpent', 'tigre', 'lion', 'lionne', 'loup', 'renard']),
  adjectif('ponctuel', 'ponctuelle', 'ponctuels', 'ponctuelles', 'après', ['personne']),
  adjectif('musical', 'musicale', 'musicaux', 'musicales', 'après', ['spectacle']),
  adjectif('fatigué', 'fatiguée', 'fatigués', 'fatiguées', 'après', VIVANTS),
  adjectif('content', 'contente', 'contents', 'contentes', 'après', VIVANTS),
  adjectif('heureux', 'heureuse', 'heureux', 'heureuses', 'après', VIVANTS),
  adjectif('tranquille', 'tranquille', 'tranquilles', 'tranquilles', 'après', [...VIVANTS, 'lieu']),
];

// --- Le sujet placé après le verbe ----------------------------------------------

export interface Lieu {
  texte: string;
  nombre: Nombre;
}

/** Un verbe qui s'accorde avec un sujet placé après lui (« Dans le ciel volent
 *  des oiseaux »), les lieux où l'on peut l'entendre et ce qui peut l'accomplir.
 *  Un lieu au pluriel et un sujet au singulier (« Sur les branches chante un
 *  oiseau ») font le piège : le verbe s'accorde avec le sujet, pas avec le lieu. */
export interface Scene {
  verbe: string;
  lieux: Lieu[];
  sujets: [string, string, Genre][];
}

const s = (texte: string): Lieu => ({ texte, nombre: 'singulier' });
const p = (texte: string): Lieu => ({ texte, nombre: 'pluriel' });

export const SCENES: Scene[] = [
  {
    verbe: 'voler',
    lieux: [s('Dans le ciel'), s('Au-dessus de la forêt'), p('Au-dessus des champs'), p('Dans les nuages')],
    sujets: [
      ['oiseau', 'oiseaux', 'm'],
      ['avion', 'avions', 'm'],
      ['hélicoptère', 'hélicoptères', 'm'],
    ],
  },
  // Les insectes ne volent pas dans les nuages : deux scènes pour « voler ».
  {
    verbe: 'voler',
    lieux: [s('Dans le jardin'), p('Au-dessus des fleurs'), s('Dans la cuisine'), s('Près de la fenêtre')],
    sujets: [
      ['papillon', 'papillons', 'm'],
      ['abeille', 'abeilles', 'f'],
      ['mouche', 'mouches', 'f'],
    ],
  },
  {
    verbe: 'chanter',
    lieux: [s('Sur le toit'), p('Dans les arbres'), p('Sur les branches'), s('Dans le jardin')],
    sujets: [
      ['oiseau', 'oiseaux', 'm'],
      ['merle', 'merles', 'm'],
      ['rossignol', 'rossignols', 'm'],
      ['moineau', 'moineaux', 'm'],
    ],
  },
  {
    verbe: 'nager',
    lieux: [s('Dans la rivière'), s('Dans le lac'), p('Dans les mares'), s("Dans l'étang")],
    sujets: [
      ['poisson', 'poissons', 'm'],
      ['canard', 'canards', 'm'],
      ['cygne', 'cygnes', 'm'],
      ['grenouille', 'grenouilles', 'f'],
    ],
  },
  {
    verbe: 'pousser',
    lieux: [s('Dans le jardin'), s('Au bord de la route'), p('Dans les champs'), s('Au bord de la rivière')],
    sujets: [
      ['fleur', 'fleurs', 'f'],
      ['arbre', 'arbres', 'm'],
      ['champignon', 'champignons', 'm'],
      ['tulipe', 'tulipes', 'f'],
    ],
  },
  // Les lampes ne brillent pas dans le ciel, ni les étoiles dans la cuisine : deux scènes pour « briller ».
  {
    verbe: 'briller',
    lieux: [s('Dans le ciel'), s('Dans la nuit'), s('Au-dessus de la mer'), p('Au-dessus des toits')],
    sujets: [
      ['étoile', 'étoiles', 'f'],
      ['planète', 'planètes', 'f'],
      ['comète', 'comètes', 'f'],
    ],
  },
  {
    verbe: 'briller',
    lieux: [s('Dans la rue'), s('Dans la cuisine'), p('Dans les maisons'), s('Au bord du chemin')],
    sujets: [
      ['lampe', 'lampes', 'f'],
      ['lumière', 'lumières', 'f'],
      ['bougie', 'bougies', 'f'],
    ],
  },
  {
    verbe: 'rouler',
    lieux: [s('Sur la route'), p('Dans les rues'), s('Sur le pont'), p('Sur les chemins')],
    sujets: [
      ['voiture', 'voitures', 'f'],
      ['camion', 'camions', 'm'],
      ['vélo', 'vélos', 'm'],
      ['moto', 'motos', 'f'],
    ],
  },
  {
    verbe: 'dormir',
    lieux: [s('Dans le panier'), s('Sur le canapé'), s('Près du radiateur')],
    sujets: [
      ['chat', 'chats', 'm'],
      ['chien', 'chiens', 'm'],
      ['bébé', 'bébés', 'm'],
    ],
  },
  {
    verbe: 'dormir',
    lieux: [s('Dans la grange'), p('Sous les arbres'), s('Dans le pré')],
    sujets: [
      ['mouton', 'moutons', 'm'],
      ['cheval', 'chevaux', 'm'],
      ['vache', 'vaches', 'f'],
    ],
  },
  {
    verbe: 'jouer',
    lieux: [s('Dans la cour'), p('Dans les jardins'), s('Sur la plage'), s('Dans le parc')],
    sujets: [
      ['garçon', 'garçons', 'm'],
      ['fille', 'filles', 'f'],
      ['chien', 'chiens', 'm'],
      ['enfant', 'enfants', 'm'],
    ],
  },
  {
    verbe: 'courir',
    lieux: [s('Dans le champ'), s('Sur la plage'), s('Dans la prairie')],
    sujets: [
      ['cheval', 'chevaux', 'm'],
      ['chien', 'chiens', 'm'],
      ['lapin', 'lapins', 'm'],
      ['garçon', 'garçons', 'm'],
    ],
  },
  // Les pommes ne tombent pas sur les vitres : deux scènes pour « tomber ».
  {
    verbe: 'tomber',
    lieux: [s('Sur le toit'), p('Sur les vitres'), p('Sur les routes')],
    sujets: [
      ['goutte', 'gouttes', 'f'],
      ['flocon', 'flocons', 'm'],
      ['grêlon', 'grêlons', 'm'],
    ],
  },
  {
    verbe: 'tomber',
    lieux: [s('Dans le jardin'), s("Dans l'herbe"), s('Sous le pommier')],
    sujets: [
      ['feuille', 'feuilles', 'f'],
      ['pomme', 'pommes', 'f'],
      ['poire', 'poires', 'f'],
    ],
  },
  // Le train n'arrive pas à la porte, le facteur pas sur le quai : deux scènes pour « arriver ».
  {
    verbe: 'arriver',
    lieux: [s('À la gare'), s('Sur le quai'), s('À la station')],
    sujets: [
      ['train', 'trains', 'm'],
      ['voyageur', 'voyageurs', 'm'],
      ['autocar', 'autocars', 'm'],
    ],
  },
  {
    verbe: 'arriver',
    lieux: [s('À la porte'), s('Chez le voisin'), s('À la maison')],
    sujets: [
      ['facteur', 'facteurs', 'm'],
      ['voisin', 'voisins', 'm'],
      ['invité', 'invités', 'm'],
    ],
  },
  {
    verbe: 'sauter',
    lieux: [s("Dans l'herbe"), p('Sur les rochers'), s('Dans le pré')],
    sujets: [
      ['grenouille', 'grenouilles', 'f'],
      ['lapin', 'lapins', 'm'],
      ['mouton', 'moutons', 'm'],
      ['chat', 'chats', 'm'],
    ],
  },
];

// --- Le sujet éloigné de son verbe, et plusieurs sujets -------------------------------

/** Ce qu'une personne fait : un verbe de la liste de 6e et ce qui le suit,
 *  choisi pour ne répéter aucun mot des sujets (« la sœur des voisins joue avec un voisin »). */
export const ACTIONS_DE_PERSONNES: [string, string][] = [
  ['chanter', 'à la chorale'],
  ['dessiner', 'un paysage'],
  ['préparer', 'un gâteau'],
  ['regarder', 'un documentaire'],
  ['écouter', 'la radio'],
  ['laver', 'la voiture'],
  ['nettoyer', 'la terrasse'],
  ['attendre', 'le bus'],
  ['répondre', 'aux questions'],
  ['lire', 'un roman'],
  ['écrire', 'une lettre'],
  ['choisir', 'un livre'],
  ['finir', 'le travail'],
  ['danser', 'sur la scène'],
  ['marcher', 'le long de la rivière'],
  ['ranger', 'les affaires'],
];

/** Ce qu'un animal fait. */
export const ACTIONS_D_ANIMAUX: [string, string][] = [
  ['dormir', 'sur le canapé'],
  ['courir', 'dans le jardin'],
  ['jouer', 'avec une balle'],
  ['manger', 'dans la gamelle'],
];

/** À qui appartient le sujet : un complément du nom, avec le nombre du dernier
 *  mot — c'est lui qui trompe — selon le sujet. */
export interface ComplementDuNom {
  texte: string;
  nombre: Nombre;
  /** Le mot qui porte le complément : le sujet ne doit pas le répéter. */
  mot: string;
}

function complement(texte: string, nombre: Nombre, mot: string): ComplementDuNom {
  return { texte, nombre, mot };
}

/** Ceux qu'on relie à d'autres personnes : un frère, une voisine, un ami. */
export const RELATIONS = ['garçon', 'fille', 'voisin', 'voisine', 'ami', 'amie', 'cousin', 'cousine', 'oncle', 'tante'];

export const COMPLEMENTS_DE_RELATIONS: ComplementDuNom[] = [
  complement('de ma voisine', 'singulier', 'voisine'),
  complement('des voisins', 'pluriel', 'voisin'),
  complement('de la directrice', 'singulier', 'directrice'),
  complement('de mon oncle', 'singulier', 'oncle'),
  complement('de mes cousins', 'pluriel', 'cousin'),
  complement('de ma tante', 'singulier', 'tante'),
  complement('de mes amis', 'pluriel', 'ami'),
];

const DE_L_ECOLE = complement("de l'école", 'singulier', 'école');
const DU_VILLAGE = complement('du village', 'singulier', 'village');
const DE_LA_VILLE = complement('de la ville', 'singulier', 'ville');
const DU_QUARTIER = complement('du quartier', 'singulier', 'quartier');

/** Le complément du nom qui va avec cette personne : on dit « la boulangère du village » et « le
 *  frère de ma voisine », jamais « les champions de la directrice » ni « le directeur du quartier ». */
export function complementsPourPersonne(singulier: string): ComplementDuNom[] {
  if (RELATIONS.includes(singulier)) return COMPLEMENTS_DE_RELATIONS;
  if (['voyageur', 'voyageuse'].includes(singulier)) return [complement('du train', 'singulier', 'train'), complement('de la gare', 'singulier', 'gare')];
  if (['directeur', 'directrice'].includes(singulier)) return [DE_L_ECOLE];
  if (['champion', 'championne'].includes(singulier)) return [DE_L_ECOLE, DU_VILLAGE, DE_LA_VILLE];
  if (['boulanger', 'boulangère', 'chanteur', 'chanteuse'].includes(singulier)) return [DU_VILLAGE, DU_QUARTIER, DE_LA_VILLE];
  if (['infirmier', 'infirmière'].includes(singulier)) return [DE_L_ECOLE, DU_VILLAGE, DU_QUARTIER];
  return [];
}

/** Les animaux dont on dit « le chat de ma tante » : les animaux de compagnie et de la ferme. */
export const ANIMAUX_DOMESTIQUES = ['chat', 'chien', 'cheval', 'lapin', 'mouton', 'vache', 'poule', 'canard'];

export const COMPLEMENTS_D_ANIMAUX: ComplementDuNom[] = [
  complement('de la ferme', 'singulier', 'ferme'),
  complement('de ma tante', 'singulier', 'tante'),
  complement('des voisins', 'pluriel', 'voisin'),
  complement('du jardin', 'singulier', 'jardin'),
  complement('de mes cousins', 'pluriel', 'cousin'),
];

/** Les noms d'enfants : de quoi écrire « Léa et Paul », « Nora et Tom ». */
export const PRENOMS_6E = ['Léa', 'Paul', 'Nora', 'Tom', 'Camille', 'Hugo', 'Lucas', 'Manon', 'Sami', 'Lola'];

/** Des groupes de deux sujets au singulier, à la place de deux prénoms. */
export const COUPLES_DE_SUJETS: string[] = [
  'Mon frère et ma sœur',
  'Le garçon et la fille',
  'Ma tante et mon oncle',
  'Le voisin et la voisine',
  'Mon cousin et ma cousine',
  'Le directeur et la directrice',
];

export const COUPLES_D_ANIMAUX: string[] = ['Le chat et le chien', 'La poule et le coq', 'Le cheval et la vache', 'Le lapin et le mouton'];

// --- Le participe passé ---------------------------------------------------------------

export interface Participe {
  infinitif: string;
  masculinSingulier: string;
  femininSingulier: string;
  masculinPluriel: string;
  femininPluriel: string;
  depuis: Stage;
}

function participe(depuis: Stage, infinitif: string, ms: string, fs: string, mp: string, fp: string): Participe {
  return { infinitif, masculinSingulier: ms, femininSingulier: fs, masculinPluriel: mp, femininPluriel: fp, depuis };
}

/** Les verbes qui se conjuguent avec « être » : le participe passé s'accorde avec le sujet. */
export const PARTICIPES_AVEC_ETRE: Participe[] = [
  participe(T1, 'partir', 'parti', 'partie', 'partis', 'parties'),
  participe(T1, 'arriver', 'arrivé', 'arrivée', 'arrivés', 'arrivées'),
  participe(T1, 'tomber', 'tombé', 'tombée', 'tombés', 'tombées'),
  participe(T1, 'monter', 'monté', 'montée', 'montés', 'montées'),
  participe(T1, 'descendre', 'descendu', 'descendue', 'descendus', 'descendues'),
  participe(T1, 'rentrer', 'rentré', 'rentrée', 'rentrés', 'rentrées'),
  participe(T1, 'sortir', 'sorti', 'sortie', 'sortis', 'sorties'),
  participe(T1, 'venir', 'venu', 'venue', 'venus', 'venues'),
  participe(T1, 'rester', 'resté', 'restée', 'restés', 'restées'),
  participe(T1, 'retourner', 'retourné', 'retournée', 'retournés', 'retournées'),
  participe(T1, 'entrer', 'entré', 'entrée', 'entrés', 'entrées'),
  participe(T1, 'aller', 'allé', 'allée', 'allés', 'allées'),
  participe(T1, 'devenir', 'devenu', 'devenue', 'devenus', 'devenues'),
  participe(T1, 'revenir', 'revenu', 'revenue', 'revenus', 'revenues'),
];

/** Un nom qui peut être le complément d'objet d'un verbe : (singulier, pluriel, genre). */
type Objet = [string, string, Genre];

const OBJETS: Record<string, Objet> = {
  fleur: ['fleur', 'fleurs', 'f'],
  pomme: ['pomme', 'pommes', 'f'],
  cerise: ['cerise', 'cerises', 'f'],
  fraise: ['fraise', 'fraises', 'f'],
  poire: ['poire', 'poires', 'f'],
  tulipe: ['tulipe', 'tulipes', 'f'],
  lettre: ['lettre', 'lettres', 'f'],
  carte: ['carte', 'cartes', 'f'],
  histoire: ['histoire', 'histoires', 'f'],
  poème: ['poème', 'poèmes', 'm'],
  message: ['message', 'messages', 'm'],
  phrase: ['phrase', 'phrases', 'f'],
  texte: ['texte', 'textes', 'm'],
  livre: ['livre', 'livres', 'm'],
  journal: ['journal', 'journaux', 'm'],
  page: ['page', 'pages', 'f'],
  film: ['film', 'films', 'm'],
  photo: ['photo', 'photos', 'f'],
  image: ['image', 'images', 'f'],
  émission: ['émission', 'émissions', 'f'],
  spectacle: ['spectacle', 'spectacles', 'm'],
  dessin: ['dessin', 'dessins', 'm'],
  documentaire: ['documentaire', 'documentaires', 'm'],
  gâteau: ['gâteau', 'gâteaux', 'm'],
  tarte: ['tarte', 'tartes', 'f'],
  salade: ['salade', 'salades', 'f'],
  valise: ['valise', 'valises', 'f'],
  exposé: ['exposé', 'exposés', 'm'],
  soupe: ['soupe', 'soupes', 'f'],
  cahier: ['cahier', 'cahiers', 'm'],
  jouet: ['jouet', 'jouets', 'm'],
  chambre: ['chambre', 'chambres', 'f'],
  chaise: ['chaise', 'chaises', 'f'],
  voiture: ['voiture', 'voitures', 'f'],
  assiette: ['assiette', 'assiettes', 'f'],
  chemise: ['chemise', 'chemises', 'f'],
  pull: ['pull', 'pulls', 'm'],
  vitre: ['vitre', 'vitres', 'f'],
  robe: ['robe', 'robes', 'f'],
  cartable: ['cartable', 'cartables', 'm'],
  cadeau: ['cadeau', 'cadeaux', 'm'],
  billet: ['billet', 'billets', 'm'],
  vélo: ['vélo', 'vélos', 'm'],
  décision: ['décision', 'décisions', 'f'],
  manteau: ['manteau', 'manteaux', 'm'],
  chapeau: ['chapeau', 'chapeaux', 'm'],
  écharpe: ['écharpe', 'écharpes', 'f'],
  animal: ['animal', 'animaux', 'm'],
  oiseau: ['oiseau', 'oiseaux', 'm'],
  ami: ['ami', 'amis', 'm'],
  amie: ['amie', 'amies', 'f'],
  cabane: ['cabane', 'cabanes', 'f'],
  vase: ['vase', 'vases', 'm'],
  verre: ['verre', 'verres', 'm'],
  lampe: ['lampe', 'lampes', 'f'],
  clé: ['clé', 'clés', 'f'],
  gant: ['gant', 'gants', 'm'],
  stylo: ['stylo', 'stylos', 'm'],
  chat: ['chat', 'chats', 'm'],
  chien: ['chien', 'chiens', 'm'],
  exercice: ['exercice', 'exercices', 'm'],
  devoir: ['devoir', 'devoirs', 'm'],
  lecture: ['lecture', 'lectures', 'f'],
  porte: ['porte', 'portes', 'f'],
  fenêtre: ['fenêtre', 'fenêtres', 'f'],
  tableau: ['tableau', 'tableaux', 'm'],
  mur: ['mur', 'murs', 'm'],
  maison: ['maison', 'maisons', 'f'],
  portrait: ['portrait', 'portraits', 'm'],
  bateau: ['bateau', 'bateaux', 'm'],
  chanson: ['chanson', 'chansons', 'f'],
  conte: ['conte', 'contes', 'm'],
  leçon: ['leçon', 'leçons', 'f'],
  pont: ['pont', 'ponts', 'm'],
  château: ['château', 'châteaux', 'm'],
  ballon: ['ballon', 'ballons', 'm'],
  balle: ['balle', 'balles', 'f'],
  fusée: ['fusée', 'fusées', 'f'],
  flèche: ['flèche', 'flèches', 'f'],
  poisson: ['poisson', 'poissons', 'm'],
  papillon: ['papillon', 'papillons', 'm'],
  trésor: ['trésor', 'trésors', 'm'],
  grotte: ['grotte', 'grottes', 'f'],
  secret: ['secret', 'secrets', 'm'],
  chemin: ['chemin', 'chemins', 'm'],
  règle: ['règle', 'règles', 'f'],
  question: ['question', 'questions', 'f'],
  mot: ['mot', 'mots', 'm'],
};

export interface VerbeAvecAvoir {
  infinitif: string;
  masculinSingulier: string;
  femininSingulier: string;
  masculinPluriel: string;
  femininPluriel: string;
  /** Ce qu'on peut le plus naturellement cueillir, écrire, perdre… */
  objets: Objet[];
  depuis: Stage;
}

function avoir(
  infinitif: string,
  ms: string,
  fs: string,
  mp: string,
  fp: string,
  objets: string[]
): VerbeAvecAvoir {
  return {
    infinitif,
    masculinSingulier: ms,
    femininSingulier: fs,
    masculinPluriel: mp,
    femininPluriel: fp,
    objets: objets.map((clef) => {
      const objet = OBJETS[clef];
      if (!objet) throw new Error(`objet manquant : ${clef}`);
      return objet;
    }),
    depuis: T2,
  };
}

/**
 * Les verbes dont le participe passé, avec « avoir », s'accorde avec le COD
 * quand il est placé avant le verbe (« les pommes que j'ai cueillies »), et
 * reste invariable sinon (« j'ai cueilli des pommes »). Les objets sont ceux
 * qu'on cueille, écrit ou perd vraiment : aucun ne rend la phrase absurde.
 */
export const PARTICIPES_AVEC_AVOIR: VerbeAvecAvoir[] = [
  avoir('cueillir', 'cueilli', 'cueillie', 'cueillis', 'cueillies', ['fleur', 'pomme', 'cerise', 'fraise', 'poire', 'tulipe']),
  avoir('écrire', 'écrit', 'écrite', 'écrits', 'écrites', ['lettre', 'carte', 'histoire', 'poème', 'message', 'phrase', 'texte']),
  avoir('lire', 'lu', 'lue', 'lus', 'lues', ['livre', 'histoire', 'lettre', 'journal', 'page', 'poème', 'message']),
  avoir('regarder', 'regardé', 'regardée', 'regardés', 'regardées', ['film', 'photo', 'image', 'émission', 'spectacle', 'dessin', 'documentaire']),
  avoir('préparer', 'préparé', 'préparée', 'préparés', 'préparées', ['gâteau', 'tarte', 'salade', 'valise', 'exposé', 'soupe']),
  avoir('ranger', 'rangé', 'rangée', 'rangés', 'rangées', ['livre', 'cahier', 'jouet', 'chambre', 'chaise']),
  avoir('laver', 'lavé', 'lavée', 'lavés', 'lavées', ['voiture', 'assiette', 'chemise', 'pull', 'vitre']),
  avoir('acheter', 'acheté', 'achetée', 'achetés', 'achetées', ['robe', 'livre', 'cartable', 'cadeau', 'billet', 'vélo']),
  avoir('prendre', 'pris', 'prise', 'pris', 'prises', ['photo', 'billet', 'livre', 'manteau', 'décision']),
  avoir('mettre', 'mis', 'mise', 'mis', 'mises', ['chaise', 'manteau', 'chapeau', 'livre', 'écharpe']),
  avoir('voir', 'vu', 'vue', 'vus', 'vues', ['film', 'spectacle', 'animal', 'oiseau', 'ami', 'amie']),
  avoir('faire', 'fait', 'faite', 'faits', 'faites', ['gâteau', 'dessin', 'exercice', 'tarte', 'cabane']),
  avoir('casser', 'cassé', 'cassée', 'cassés', 'cassées', ['vase', 'verre', 'assiette', 'jouet', 'lampe']),
  avoir('perdre', 'perdu', 'perdue', 'perdus', 'perdues', ['clé', 'gant', 'livre', 'cahier', 'écharpe']),
  avoir('trouver', 'trouvé', 'trouvée', 'trouvés', 'trouvées', ['clé', 'stylo', 'livre', 'chat', 'chien', 'photo']),
  avoir('choisir', 'choisi', 'choisie', 'choisis', 'choisies', ['robe', 'livre', 'cadeau', 'film', 'cartable']),
  avoir('finir', 'fini', 'finie', 'finis', 'finies', ['exercice', 'devoir', 'dessin', 'lecture']),
  avoir('ouvrir', 'ouvert', 'ouverte', 'ouverts', 'ouvertes', ['porte', 'fenêtre', 'lettre', 'livre', 'cadeau', 'valise']),
  avoir('peindre', 'peint', 'peinte', 'peints', 'peintes', ['tableau', 'mur', 'maison', 'porte', 'portrait']),
  avoir('dessiner', 'dessiné', 'dessinée', 'dessinés', 'dessinées', ['maison', 'chat', 'bateau', 'portrait', 'fleur']),
  avoir('écouter', 'écouté', 'écoutée', 'écoutés', 'écoutées', ['chanson', 'histoire', 'émission', 'conte']),
  avoir('oublier', 'oublié', 'oubliée', 'oubliés', 'oubliées', ['leçon', 'cartable', 'clé', 'livre', 'cahier', 'gant', 'écharpe']),
  avoir('construire', 'construit', 'construite', 'construits', 'construites', ['cabane', 'maison', 'pont', 'château', 'bateau']),
  avoir('lancer', 'lancé', 'lancée', 'lancés', 'lancées', ['ballon', 'balle', 'fusée', 'flèche']),
  avoir('attraper', 'attrapé', 'attrapée', 'attrapés', 'attrapées', ['ballon', 'balle', 'poisson', 'papillon']),
  avoir('découvrir', 'découvert', 'découverte', 'découverts', 'découvertes', ['trésor', 'grotte', 'secret', 'chemin']),
  avoir('comprendre', 'compris', 'comprise', 'compris', 'comprises', ['leçon', 'règle', 'exercice', 'histoire', 'question']),
  avoir('recevoir', 'reçu', 'reçue', 'reçus', 'reçues', ['lettre', 'cadeau', 'carte', 'message']),
  avoir('dire', 'dit', 'dite', 'dits', 'dites', ['mot', 'phrase', 'secret']),
];

/** Les sujets de « avoir » : de quoi écrire « que Léa a », « que j'ai », « que nous avons ». */
export interface SujetAvecAvoir {
  /** « Léa », « Mes parents » : en tête de phrase, avec sa majuscule. */
  texte: string;
  /** « a », « ont », « ai »… */
  auxiliaire: string;
  /** « je » et « nous » se placent différemment : « que j'ai », « que nous avons ». */
  pronom: boolean;
  /** Un adulte de la famille : il n'a ni devoir, ni leçon, ni exposé à rendre. */
  adulte?: boolean;
}

/** Ce qu'un élève rend ou apprend : « Mon oncle a fini les devoirs » sonne faux. */
export const TRAVAUX_D_ELEVE = ['exposé', 'devoir', 'leçon', 'exercice'];

export const SUJETS_AVEC_AVOIR: SujetAvecAvoir[] = [
  ...['Léa', 'Paul', 'Nora', 'Tom', 'Camille', 'Hugo', 'Lucas', 'Manon', 'Sami', 'Lola'].map((texte) => ({ texte, auxiliaire: 'a', pronom: false })),
  { texte: 'Mon frère', auxiliaire: 'a', pronom: false },
  { texte: 'Ma sœur', auxiliaire: 'a', pronom: false },
  { texte: 'Ma tante', auxiliaire: 'a', pronom: false, adulte: true },
  { texte: 'Mon oncle', auxiliaire: 'a', pronom: false, adulte: true },
  { texte: 'Mes parents', auxiliaire: 'ont', pronom: false, adulte: true },
  { texte: 'Mes cousins', auxiliaire: 'ont', pronom: false },
  { texte: 'Les enfants', auxiliaire: 'ont', pronom: false },
  { texte: 'Je', auxiliaire: 'ai', pronom: true },
  { texte: 'Nous', auxiliaire: 'avons', pronom: true },
  { texte: 'Tu', auxiliaire: 'as', pronom: true },
  { texte: 'Vous', auxiliaire: 'avez', pronom: true },
];

/** Le complément qui va avec chaque sorte de nom, pour « La porte de mon frère est… » : un objet
 *  appartient à quelqu'un, un lieu se situe dans une ville, un plat vient de quelqu'un. */
export const COMPLEMENTS_PAR_CATEGORIE: Partial<Record<Categorie, ComplementDuNom[]>> = {
  animal: COMPLEMENTS_D_ANIMAUX,
  objet: [
    complement('de ma sœur', 'singulier', 'sœur'),
    complement('de mon frère', 'singulier', 'frère'),
    complement('de mes parents', 'pluriel', 'parent'),
    complement('de la voisine', 'singulier', 'voisine'),
    complement('des voisins', 'pluriel', 'voisin'),
  ],
  lieu: [DE_LA_VILLE, DU_VILLAGE, DU_QUARTIER],
  nature: [complement('de la région', 'singulier', 'région'), complement('du pays', 'singulier', 'pays'), DU_VILLAGE],
  spectacle: [DE_L_ECOLE, complement('des élèves', 'pluriel', 'élève'), DE_LA_VILLE, DU_VILLAGE],
  nourriture: [
    complement('de ma grand-mère', 'singulier', 'grand-mère'),
    complement('de la boulangère', 'singulier', 'boulangère'),
    complement('du marché', 'singulier', 'marché'),
    complement('des voisins', 'pluriel', 'voisin'),
  ],
};
