import type { Level } from '../types';
import type { Stage } from '../lib/progression';

/**
 * Les homophones du CE1, du CE2 et de la 6e.
 *
 * Chaque famille s'écrit en gabarits : une liste de phrases à trou dont le mot juste est connu, et la
 * liste des mots qui iraient AUSSI dans ces phrases (`valides`). Une mauvaise réponse n'est jamais
 * tirée au hasard dans tout le vocabulaire : elle est choisie parmi les mots que l'élève a déjà
 * rencontrés (`parmi`), jamais parmi ceux qui conviendraient. « Léa ... un vélo rouge » accepte « a »
 * mais aussi « est » (la phrase est absurde, mais elle est juste) : « est » y est donc déclaré valide,
 * et ne sera jamais proposé.
 *
 * Les familles viennent à l'étape où la référence les place :
 *  - CE1-T1 : a / à, et / est ; CE1-T2 : on / ont, son / sont (révisés au CE1-T3 et au CE2-T1) ;
 *  - CE2-T2 : ou / où, ce / se, ces / ses, la / là ;
 *  - 6e-T1 : les homophones du cycle 2, sans « la / là » ; 6e-T2 : c'est / s'est, c'était / s'était,
 *    quel / quelle / qu'elle, la / là / l'a / l'as, leur / leurs, mes / mais ; 6e-T3 : quelque /
 *    quel que, plutôt / plus tôt, ni / n'y.
 * Le CE1 et le CE2 voient le même cycle : les gabarits sont communs. Ceux de la 6e sont écrits à part,
 * avec des phrases plus riches.
 */

export interface Gabarit {
  /** La famille, pour qui lit les tests : « a / à ». */
  famille: string;
  /** Le mot juste de toutes les phrases. */
  bonne: string;
  /** L'homophone qu'on propose toujours, quand il ne convient pas : « à » pour « a ». */
  compagnon?: string;
  /** Les autres mots qui iraient aussi dans ces phrases : jamais proposés. */
  valides: string[];
  /** Les mots dont on tire les mauvaises réponses. */
  parmi: readonly string[];
  /** Vrai quand `parmi` est la liste d'un cycle : seuls les mots déjà rencontrés sont alors proposés. */
  progressif: boolean;
  /** Des phrases à un seul trou. */
  phrases: string[];
  /** La première étape où ces phrases sont posées. */
  depuis: Stage;
}

// Les étapes : CE1 de -5 à -3, CE2 de -2 à 0, 6e de 7 à 9.
const CE1_T1: Stage = -5;
const CE1_T2: Stage = -4;
const CE1_T3: Stage = -3;
const CE2_T2: Stage = -1;
const SIXIEME_T1: Stage = 7;
const SIXIEME_T2: Stage = 8;
const SIXIEME_T3: Stage = 9;

function croiser(a: readonly string[], b: readonly string[], composer: (x: string, y: string) => string): string[] {
  return a.flatMap((x) => b.map((y) => composer(x, y)));
}

/** Toutes les paires de deux éléments différents, dans les deux sens. */
function paires(liste: readonly string[], composer: (x: string, y: string) => string): string[] {
  return liste.flatMap((x) => liste.filter((y) => y !== x).map((y) => composer(x, y)));
}

// --- Le cycle 2 : CE1 et CE2 ----------------------------------------------------------------------------------------

/** Les seize mots du cycle 2, dans l'ordre où le programme les rencontre. */
export const MOTS_CYCLE_2 = ['a', 'à', 'et', 'est', 'on', 'ont', 'son', 'sont', 'ou', 'où', 'ce', 'se', 'ces', 'ses', 'la', 'là'] as const;
/** Les mots de la 6e qui reprennent le cycle 2 : tout, sauf « la / là », qui reviennent à quatre au 2e trimestre. */
export const MOTS_6E_REVISION = ['a', 'à', 'et', 'est', 'on', 'ont', 'son', 'sont', 'ou', 'où', 'ce', 'se', 'ces', 'ses'] as const;

function gabarit(
  famille: string,
  bonne: string,
  depuis: Stage,
  parmi: readonly string[],
  phrases: string[],
  options: { compagnon?: string; valides?: string[] } = {}
): Gabarit {
  const progressif = parmi === MOTS_CYCLE_2 || parmi === MOTS_6E_REVISION;
  return { famille, bonne, depuis, parmi, phrases, progressif, compagnon: options.compagnon, valides: options.valides ?? [] };
}

const PRENOMS = ['Léa', 'Paul', 'Nora', 'Tom', 'Lola', 'Hugo', 'Emma', 'Sami'];

/** Les sujets de la 3e personne du singulier. */
const SUJETS_SINGULIER = [...PRENOMS, 'Il', 'Elle', 'Mon frère', 'Ma sœur', 'Mon papa', 'Ma maman', 'Le voisin', 'La voisine', 'Mon cousin', 'Ma cousine'];
/** Ceux de la 3e personne du pluriel. */
const SUJETS_PLURIEL = ['Les enfants', 'Mes amis', 'Les filles', 'Les garçons', 'Mes cousins', 'Les voisins', 'Ils', 'Elles', 'Mes parents', 'Les élèves'];

// On « a » faim, on « a » peur : jamais « est » devant ces mots, ce qui laisse « a » seul possible. « chaud » et
// « froid » sont écartés : « Paul est chaud » ou « Il est froid » se disent.
const AVOIR_UNE_ENVIE = ['faim', 'soif', 'peur', 'sommeil', 'mal au ventre', 'de la fièvre', 'de la chance', 'mal aux dents'];

// Ce qu'on peut posséder : « Léa est un vélo rouge » est une phrase juste (même absurde), « est » est donc valide.
const POSSESSIONS = [
  'un vélo rouge',
  'un ballon bleu',
  'un cartable neuf',
  'une trousse verte',
  'un cahier jaune',
  'un gros livre',
  'une trottinette',
  'un bonnet noir',
  'une écharpe rose',
  'un sac rose',
  'un jouet',
  'une poupée',
  'un stylo noir',
  'une lampe',
];

// Des participes de verbes du 1er groupe : après « a » et « ont », jamais « est » ni « sont ».
const AVOIR_FAIT = ['mangé une pomme', 'chanté une chanson', 'dessiné un chat', 'cherché les clés', 'lavé la voiture', 'joué au ballon', 'préparé un gâteau', 'regardé un film'];

// Pas de « calme » : « Léa se calme » est une phrase juste, « se » aurait deux places possibles.
const ETRE_SINGULIER = [
  'sage',
  'rapide',
  'timide',
  'malade',
  'drôle',
  'jeune',
  'triste',
  'tranquille',
  'en retard',
  'à la maison',
  'dans la cour',
  'au parc',
  'dans le jardin',
  'en vacances',
  'à la piscine',
];
const ETRE_PLURIEL = [
  'sages',
  'rapides',
  'timides',
  'malades',
  'drôles',
  'jeunes',
  'tristes',
  'tranquilles',
  'en retard',
  'à la maison',
  'dans la cour',
  'au parc',
  'dans le jardin',
  'en vacances',
  'à la piscine',
  'dans le bus',
];

// « à la » et « à l' » : jamais « au », qui ne s'écrit pas « à le ».
const LIEUX = ["l'école", 'la piscine', 'la cantine', 'la maison', 'la plage', 'la ferme', 'la gare', 'la bibliothèque', 'la boulangerie', 'la campagne'];
// Chaque jeu a son article : « Léa joue ce chat » ou « Léa joue son cache-cache » se diraient aussi.
const JEUX = ['la marelle', 'la balle', 'la corde', 'la poupée', 'la toupie', 'la ronde'];

// Pas de « livre » : « la livre » se dit, et « Léa regarde et livre » aussi.
const CHOSES_MASCULINES = ['cartable', 'vélo', 'ballon', 'cahier', 'stylo', 'sac', 'bonnet', 'manteau', 'gâteau'];
const VERBES_DE_POSSESSION = ['cherche', 'range', 'prend', 'perd', 'trouve', 'montre'];

const ACTIVITES_DE_ON = [
  'joue au ballon',
  'chante une chanson',
  'danse dans la cour',
  'mange une pomme',
  'dessine un chat',
  'écoute de la musique',
  'prépare un gâteau',
  'saute très haut',
  'marche dans la rue',
  'cherche les clés',
  'ferme la fenêtre',
];
const DEBUTS_DE_PHRASE_ON = ['', 'Ici, ', 'Dans la cour, ', 'Le soir, ', 'Quand il pleut, ', 'Le dimanche, ', 'À la plage, '];

const OBJETS_DU_CARTABLE = ['cahier', 'ballon', 'vélo', 'stylo', 'manteau', 'gâteau', 'dessin', 'cartable', 'tableau', 'jouet', 'chapeau'];
const SE_FAIRE = ['lave les mains', 'promène dans le parc', 'repose un moment', 'couche très tôt', 'lève très tôt', 'cache derrière la porte', 'trompe de chemin', 'dépêche'];
const SE_FAIRE_PLURIEL = ['lavent les mains', 'promènent dans le parc', 'reposent un moment', 'cachent derrière la porte', 'dépêchent'];

const CHOSES_MONTREES = ['enfants', 'fleurs', 'histoires', 'photos', 'chansons', 'idées', 'affaires', 'amis'];
const CHOSES_RANGEES = ['affaires', 'jouets', 'crayons', 'livres', 'photos', 'cahiers', 'chaussures', 'vêtements'];

// Des paires de choses entre lesquelles on choisit : « Veux-tu le thé ... le café ? », « J'aime le thé ... le café. ».
const CHOIX = [
  ['le thé', 'le café'],
  ['la pomme', 'la poire'],
  ['le rouge', 'le bleu'],
  ['jouer dehors', 'lire un livre'],
  ['dessiner', 'chanter'],
  ['la mer', 'la montagne'],
  ['le vélo', 'la trottinette'],
  ['le pain', 'le riz'],
  ['le chat', 'le chien'],
];

// Des féminins qui commencent par une consonne : « la » et jamais « l' », jamais « son » non plus.
const VERBES_ET_NOMS_FEMININS: [string, string[]][] = [
  ['regarde', ['télévision', 'voiture', 'maison', 'rue', 'lune']],
  ['ferme', ['porte', 'fenêtre', 'valise', 'trousse']],
  ['lave', ['voiture', 'chaise', 'fenêtre', 'table', 'assiette']],
  ['range', ['chaise', 'trousse', 'valise', 'chambre', 'table']],
  ['cherche', ['clé', 'trousse', 'valise', 'poupée']],
  ['ouvre', ['porte', 'fenêtre', 'valise', 'trousse']],
  ['dessine', ['maison', 'voiture', 'lune', 'poule', 'fleur']],
];

const LA_PHRASES = PRENOMS.flatMap((prenom) => VERBES_ET_NOMS_FEMININS.flatMap(([verbe, noms]) => noms.map((nom) => `${prenom} ${verbe} ... ${nom}.`)));
const LA_PHRASES_LA = [
  'Pose ton sac ..., près de la porte.',
  'Mon cartable est ..., sur la chaise.',
  'Regarde ..., un oiseau !',
  'Viens ... !',
  'Mets ton manteau ..., sur le crochet.',
  "Range tes livres ..., dans l'armoire.",
  'Assieds-toi ..., à côté de moi.',
  'Il y a un nuage ..., dans le ciel.',
];

/**
 * Les gabarits communs au CE1 et au CE2. Quand le CE1 en est à « on / ont », il a déjà vu « a / à » et
 * « et / est » : les mauvaises réponses d'une étape ne sortent que des mots déjà rencontrés.
 */
export const GABARITS_CYCLE_2: Gabarit[] = [
  // --- a / à (CE1-T1) ---
  gabarit('a / à', 'a', CE1_T1, MOTS_CYCLE_2, croiser(SUJETS_SINGULIER, AVOIR_UNE_ENVIE, (sujet, envie) => `${sujet} ... ${envie}.`), { compagnon: 'à' }),
  gabarit('a / à', 'a', CE1_T2, MOTS_CYCLE_2, croiser(SUJETS_SINGULIER, POSSESSIONS, (sujet, chose) => `${sujet} ... ${chose}.`), { compagnon: 'à', valides: ['est'] }),
  gabarit('a / à', 'a', CE1_T3, MOTS_CYCLE_2, croiser(SUJETS_SINGULIER, AVOIR_FAIT, (sujet, fait) => `${sujet} ... ${fait}.`), { compagnon: 'à' }),
  gabarit('a / à', 'à', CE1_T1, MOTS_CYCLE_2, croiser(SUJETS_SINGULIER, LIEUX, (sujet, lieu) => `${sujet} va ... ${lieu}.`), { compagnon: 'a' }),
  gabarit('a / à', 'à', CE1_T1, MOTS_CYCLE_2, croiser([...PRENOMS, 'Il', 'Elle', 'Mon frère', 'Ma sœur'], JEUX, (sujet, jeu) => `${sujet} joue ... ${jeu}.`), {
    compagnon: 'a',
  }),
  // « Paul donne un bonbon et Léa » se lit comme une phrase : « et » et « ou » y sont valides.
  gabarit(
    'a / à',
    'à',
    CE1_T2,
    MOTS_CYCLE_2,
    croiser(['Léa', 'Paul', 'Nora', 'Tom'], ['mon frère', 'ma sœur', 'la voisine', 'le facteur', 'Lola', 'Hugo', 'Emma', 'Sami'], (donneur, receveur) => `${donneur} donne un bonbon ... ${receveur}.`),
    { compagnon: 'a', valides: ['et', 'ou'] }
  ),

  // --- et / est (CE1-T1) ---
  // « Léa ou Paul jouent » : « ou » convient aussi, dès qu'il est connu.
  gabarit(
    'et / est',
    'et',
    CE1_T1,
    MOTS_CYCLE_2,
    [
      ...paires(PRENOMS, (a, b) => `${a} ... ${b} jouent dans la cour.`),
      ...paires(PRENOMS, (a, b) => `${a} ... ${b} mangent une pomme.`),
      ...croiser(['Le chat', 'Le chien', 'Le lapin', 'Le canard', 'La poule'], ['un oiseau', 'une souris', 'une grenouille', 'un papillon'], (animal, autre) => `${animal} ... ${autre} dorment.`),
    ],
    { compagnon: 'est', valides: ['ou'] }
  ),
  // « J'aime le rouge ou le bleu » se dit, et « J'aime la mer à la montagne » se lit comme « à la montagne » : « ou » et « à » conviennent.
  gabarit('et / est', 'et', CE1_T2, MOTS_CYCLE_2, CHOIX.map(([a, b]) => `J'aime ${a} ... ${b}.`), { compagnon: 'est', valides: ['ou', 'à'] }),
  gabarit('et / est', 'est', CE1_T1, MOTS_CYCLE_2, croiser(SUJETS_SINGULIER, ETRE_SINGULIER, (sujet, etat) => `${sujet} ... ${etat}.`), { compagnon: 'et' }),

  // --- on / ont (CE1-T2) ---
  // « Ici, se chante une chanson » se dit : « se » et « et » sont valides, comme « la » et « là » (« la danse »).
  gabarit('on / ont', 'on', CE1_T2, MOTS_CYCLE_2, DEBUTS_DE_PHRASE_ON.flatMap((debut) => ACTIVITES_DE_ON.map((activite) => `${debut}... ${activite}.`)), {
    compagnon: 'ont',
    valides: ['et', 'se', 'la', 'là'],
  }),
  gabarit('on / ont', 'ont', CE1_T2, MOTS_CYCLE_2, croiser(SUJETS_PLURIEL, AVOIR_UNE_ENVIE, (sujet, envie) => `${sujet} ... ${envie}.`), { compagnon: 'on' }),
  gabarit('on / ont', 'ont', CE1_T2, MOTS_CYCLE_2, croiser(SUJETS_PLURIEL, POSSESSIONS, (sujet, chose) => `${sujet} ... ${chose}.`), { compagnon: 'on', valides: ['sont'] }),
  gabarit('on / ont', 'ont', CE1_T3, MOTS_CYCLE_2, croiser(SUJETS_PLURIEL, AVOIR_FAIT, (sujet, fait) => `${sujet} ... ${fait}.`), { compagnon: 'on' }),

  // --- son / sont (CE1-T2) ---
  // « Léa cherche ce cartable » : « ce » convient aussi, devant un nom masculin.
  gabarit(
    'son / sont',
    'son',
    CE1_T2,
    MOTS_CYCLE_2,
    SUJETS_SINGULIER.flatMap((sujet) => VERBES_DE_POSSESSION.flatMap((verbe) => CHOSES_MASCULINES.map((chose) => `${sujet} ${verbe} ... ${chose}.`))),
    { compagnon: 'sont', valides: ['ce'] }
  ),
  gabarit('son / sont', 'sont', CE1_T2, MOTS_CYCLE_2, croiser(SUJETS_PLURIEL, ETRE_PLURIEL, (sujet, etat) => `${sujet} ... ${etat}.`), { compagnon: 'son' }),

  // --- ou / où (CE2-T2) ---
  // « Veux-tu du thé et du café ? » et « Tu préfères le chat à la mer » : « et » et « à » conviennent aussi.
  gabarit(
    'ou / où',
    'ou',
    CE2_T2,
    MOTS_CYCLE_2,
    CHOIX.flatMap(([a, b]) => [`Veux-tu ${a} ... ${b} ?`, `Tu préfères ${a} ... ${b} ?`, `Tu choisis ${a} ... ${b} ?`]),
    { compagnon: 'où', valides: ['et', 'à'] }
  ),
  // « Là est mon cartable » et « On est mon cartable ? » se disent : « là » et « on » sont valides en tête de phrase.
  gabarit('ou / où', 'où', CE2_T2, MOTS_CYCLE_2, ['mon cartable', 'ma trousse', 'ton vélo', 'le chat', 'la clé', 'ma veste', 'son sac'].map((chose) => `... est ${chose} ?`), {
    compagnon: 'ou',
    valides: ['là', 'on'],
  }),
  gabarit(
    'ou / où',
    'où',
    CE2_T2,
    MOTS_CYCLE_2,
    [
      ...['tu habites', 'tu vas', 'Léa travaille', 'tu as mis ton sac', 'se trouve la gare', 'Paul a rangé les clés'].map((fin) => `Dis-moi ... ${fin}.`),
      ...['est sa veste', 'se trouve la gare', 'habite Paul', 'dort le chat', 'sont mes clés'].map((fin) => `Léa ne sait pas ... ${fin}.`),
    ],
    { compagnon: 'ou' }
  ),
  // « Voici la ville et j'habite… » se lit comme une phrase : « et » est valide.
  gabarit('ou / où', 'où', CE2_T2, MOTS_CYCLE_2, ['la ville', 'la maison', "l'école", 'la rue'].map((lieu) => `Voici ${lieu} ... j'habite.`), {
    compagnon: 'ou',
    valides: ['et'],
  }),

  // --- ce / se (CE2-T2) ---
  // « Son cahier est sur la table » se dit : « son » est valide devant ces noms.
  gabarit(
    'ce / se',
    'ce',
    CE2_T2,
    MOTS_CYCLE_2,
    OBJETS_DU_CARTABLE.flatMap((objet) => [`... ${objet} est sur la table.`, `Léa regarde ... ${objet}.`, `Paul prend ... ${objet}.`, `... ${objet} est à moi.`, `Tom aime beaucoup ... ${objet}.`]),
    { compagnon: 'se', valides: ['son'] }
  ),
  // « Léa la promène dans le parc » se dit : « la » est valide devant ces verbes.
  gabarit('ce / se', 'se', CE2_T2, MOTS_CYCLE_2, croiser(SUJETS_SINGULIER, SE_FAIRE, (sujet, geste) => `${sujet} ... ${geste}.`), { compagnon: 'ce', valides: ['la'] }),
  gabarit('ce / se', 'se', CE2_T2, MOTS_CYCLE_2, croiser(SUJETS_PLURIEL, SE_FAIRE_PLURIEL, (sujet, geste) => `${sujet} ... ${geste}.`), { compagnon: 'ce', valides: ['la'] }),

  // --- ces / ses (CE2-T2) ---
  // Le « -là » ne va qu'avec « ces », « propres » ne va qu'avec « ses » : c'est le seul indice, et il est dans la phrase.
  gabarit(
    'ces / ses',
    'ces',
    CE2_T2,
    MOTS_CYCLE_2,
    CHOSES_MONTREES.flatMap((chose) => [`... ${chose}-là sont formidables.`, `Regarde ... ${chose}-là !`, `J'aime beaucoup ... ${chose}-là.`]),
    { compagnon: 'ses' }
  ),
  gabarit('ces / ses', 'ses', CE2_T2, MOTS_CYCLE_2, croiser(SUJETS_SINGULIER, CHOSES_RANGEES, (sujet, chose) => `${sujet} range ... propres ${chose}.`), { compagnon: 'ces' }),

  // --- la / là (CE2-T2) ---
  gabarit('la / là', 'la', CE2_T2, MOTS_CYCLE_2, LA_PHRASES, { compagnon: 'là' }),
  gabarit('la / là', 'là', CE2_T2, MOTS_CYCLE_2, LA_PHRASES_LA, { compagnon: 'la' }),
];

// --- La 6e -----------------------------------------------------------------------------------------------------------------

const SUJETS_6E_SINGULIER = [
  'Lucas',
  'Chloé',
  'Inès',
  'Karim',
  'Manon',
  'Nicolas',
  'Sarah',
  'Yanis',
  'Il',
  'Elle',
  'Mon cousin',
  'Ma cousine',
  'Mon voisin',
  'Ma voisine',
  'Mon ami Hugo',
  'Mon amie Emma',
];
const SUJETS_6E_PLURIEL = ['Les élèves', 'Mes camarades', 'Mes cousins', 'Mes voisins', 'Les professeurs', 'Mes amis', 'Ils', 'Elles', 'Les surveillants', 'Mes parents'];
const PRENOMS_6E = ['Lucas', 'Chloé', 'Inès', 'Karim', 'Manon', 'Nicolas', 'Sarah', 'Yanis'];

const AVOIR_6E = ['raison', 'tort', 'de la chance', 'du courage', 'de la patience', 'du talent', 'honte', 'peur du noir'];
const POSSESSIONS_6E = [
  'un exposé sur les volcans',
  'une idée géniale',
  'un rendez-vous chez le dentiste',
  'une bonne note en maths',
  'un ordinateur portable',
  'une collection de timbres',
  'un cours de piano',
  'une grande chambre',
  'un nouveau téléphone',
  'un vélo électrique',
  'une réponse précise',
  'un cousin très bavard',
];
const AVOIR_FAIT_6E = ['préparé un exposé', 'cherché une solution', 'trouvé la réponse', 'posé une question', 'montré son dessin', 'oublié son cahier', 'réparé son vélo', 'invité un ami'];
const ETRE_6E_SINGULIER = [
  'honnête',
  'sincère',
  'fidèle',
  'modeste',
  'habile',
  'agile',
  'sévère',
  'responsable',
  'aimable',
  'à la bibliothèque',
  'au collège',
  'en cours de maths',
  "en salle d'étude",
  'à la cantine',
  'au gymnase',
  'en retard',
];
const ETRE_6E_PLURIEL = ['honnêtes', 'sincères', 'fidèles', 'modestes', 'habiles', 'agiles', 'sévères', 'responsables', 'aimables', 'à la bibliothèque', 'au gymnase', 'à la cantine', 'en retard', 'au collège', 'à la maison'];
const LIEUX_6E = ['la bibliothèque', 'la piscine', 'la cantine', 'la gare', 'la mairie', 'la poste', 'la médiathèque', "l'infirmerie", 'la salle de sport', 'la salle de classe'];
// Chacun de ces verbes se construit avec « à » : « apprend à nager », « hésite à répondre ».
const ACTIVITES_AVEC_A: [string, string[]][] = [
  ['apprend', ['nager', 'jouer du piano', 'lire vite', 'dessiner', 'compter en anglais', 'cuisiner']],
  ['commence', ['lire', 'dessiner', 'compter', 'cuisiner', 'nager', 'courir']],
  ['réussit', ['nager', 'lire vite', 'dessiner', 'compter', 'cuisiner', 'jouer du piano']],
  ['hésite', ['nager', 'répondre', 'dessiner', 'compter', 'cuisiner', 'sauter']],
];
const ACTIVITES_DE_ON_6E = ['travaille en groupe', 'discute avec un ami', 'écoute en silence', 'range ses affaires', 'lit en silence', 'cherche sa salle', 'sort son cahier', 'prépare son sac'];
const DEBUTS_DE_PHRASE_ON_6E = ['', 'En classe, ', 'Au collège, ', 'Le matin, ', 'Pendant la récréation, ', 'Quand la cloche sonne, '];
const CHOIX_6E = [
  ['le chocolat', 'le fromage'],
  ['les jeux de société', 'les films'],
  ['lire un roman', 'regarder un documentaire'],
  ['le tennis', 'le judo'],
  ['la chimie', 'la physique'],
  ['le bus', 'le vélo'],
  ['les gâteaux', 'les fruits'],
  ['la guitare', 'le piano'],
];
const CHOSES_MASCULINES_6E = ['cartable', 'classeur', 'cahier', 'dictionnaire', 'compas', 'stylo', 'ordinateur', 'manteau', 'sac', 'exposé'];
const VERBES_DE_POSSESSION_6E = ['oublie', 'range', 'cherche', 'retrouve', 'montre'];
// Pas de « livre » : « la livre » se dit, « la » serait valide. Pas de nom qui commence par une voyelle : « cet exposé ».
const OBJETS_6E = ['classeur', 'cahier', 'dictionnaire', 'compas', 'stylo', 'tableau', 'dessin', 'devoir', 'bureau', 'ballon'];
const SE_FAIRE_6E = [
  'prépare pour le contrôle',
  'dépêche de rentrer',
  'souvient de son premier jour',
  'trompe de salle',
  'demande où est la salle',
  'lève à six heures',
  'repose après le sport',
  'concentre sur son travail',
  'trouve en retard',
  'rend au collège à vélo',
];
const SE_FAIRE_6E_PLURIEL = ['préparent pour le contrôle', 'dépêchent de rentrer', 'souviennent de leur premier jour', 'trompent de salle', 'reposent après le sport', 'concentrent sur leur travail'];
const CHOSES_MONTREES_6E = ['exercices', 'problèmes', 'leçons', 'questions', 'phrases', 'règles', 'consignes', 'devoirs'];
const CHOSES_RANGEES_6E = ['cahiers', 'affaires', 'crayons', 'livres', 'outils', 'dessins', 'exposés', 'notes'];

// Des noms féminins qui commencent par une consonne, avec les verbes qui leur vont.
const VERBES_ET_NOMS_FEMININS_6E: [string, string[]][] = [
  ['lit', ['leçon', 'consigne', 'phrase', 'page', 'carte']],
  ['copie', ['leçon', 'phrase', 'consigne', 'page', 'carte']],
  ['relit', ['leçon', 'consigne', 'phrase', 'page']],
  ['ouvre', ['porte', 'fenêtre', 'valise', 'trousse']],
  ['ferme', ['porte', 'fenêtre', 'valise', 'trousse']],
  ['range', ['salle', 'chaise', 'trousse', 'chambre', 'table']],
  ['cherche', ['salle', 'réponse', 'solution', 'clé']],
  ['prépare', ['leçon', 'valise', 'salle', 'réponse']],
  ['trouve', ['réponse', 'solution', 'salle', 'clé']],
  ['écoute', ['radio', 'leçon', 'chanson', 'consigne']],
];
const LA_PHRASES_6E = PRENOMS_6E.flatMap((prenom) => VERBES_ET_NOMS_FEMININS_6E.flatMap(([verbe, noms]) => noms.map((nom) => `${prenom} ${verbe} ... ${nom}.`)));

// Le deuxième et le troisième trimestre de la 6e : les mots qui se ressemblent à l'oral.
const QUEL = ['quel', 'quelle', 'quels', 'quelles', "qu'elle", "qu'elles"] as const;
const C_EST = ["c'est", "s'est", 'ces', 'ses', 'se', 'ce'] as const;
const C_ETAIT = ["c'était", "s'était", 'ces', 'ses', 'se', 'ce'] as const;
const LA_LA = ['la', 'là', "l'a", "l'as"] as const;
// « leure » et « leures » ne sont pas des mots : ce sont les fautes qu'on fait.
const LEUR = ['leur', 'leurs', 'leure', 'leures'] as const;
const MES = ['mes', 'mais', 'mets', 'met'] as const;
const QUELQUE = ['quelque', 'quelques', 'quel que', 'quelle que'] as const;
const PLUTOT = ['plutôt', 'plus tôt', 'plustôt', 'plutot'] as const;
const NI = ['ni', "n'y", 'nid', 'nie'] as const;

const SUJETS_F = ['Léa', 'Marion', 'Nora', 'Chloé', 'Manon', 'Elle', 'Ma sœur', 'Ma tante'];
const SUJETS_M = ['Paul', 'Tom', 'Sami', 'Hugo', 'Lucas', 'Il', 'Mon frère', 'Mon oncle'];
// Chaque participe a son complément : « s'est trompé de chemin », « s'est dépêché de rentrer ».
const SE_ETRE_F = ['levée tôt', 'trompée de chemin', 'cachée derrière la porte', 'réveillée à sept heures', 'dépêchée de rentrer', 'perdue dans la forêt', 'endormie sur le canapé', 'habillée très vite'];
const SE_ETRE_M = ['levé tôt', 'trompé de chemin', 'caché derrière la porte', 'réveillé à sept heures', 'dépêché de rentrer', 'perdu dans la forêt', 'endormi sur le canapé', 'habillé très vite'];

// Un complément d'objet placé avant le verbe : le participe s'accorde, « l'a » se dit pour « le » ou « la ».
const OBJETS_ANTERIEURS: [string, string][] = [
  ['Ce gâteau', 'mangé'],
  ['Cette chanson', 'chantée'],
  ['Ce livre', 'lu'],
  ['Cette lettre', 'écrite'],
  ['Ce film', 'vu'],
  ['Cette clé', 'perdue'],
  ['Ce dessin', 'fait'],
  ['Cette photo', 'prise'],
];

/** Un sujet au milieu d'une phrase : « Elle » devient « elle », « Léa » reste « Léa ». */
function enMinuscule(sujet: string): string {
  return /^(Il|Elle|Mon |Ma )/.test(sujet) ? `${sujet.charAt(0).toLowerCase()}${sujet.slice(1)}` : sujet;
}

// Pas de « compas », qui ne change pas au pluriel : « leur compas » et « leurs compas » se disent.
const PLURIELS_CAHIERS = ['cahiers', 'livres', 'cartables', 'classeurs', 'dessins', 'manteaux', 'sacs', 'stylos'];
const SINGULIERS_CAHIERS = ['cahier', 'livre', 'cartable', 'classeur', 'dessin', 'manteau', 'sac', 'stylo'];

/** Les gabarits de la 6e. */
export const GABARITS_6E: Gabarit[] = [
  // --- 1er trimestre : les homophones du cycle 2, sans « la / là ». ---
  gabarit('a / à', 'a', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_SINGULIER, POSSESSIONS_6E, (sujet, chose) => `${sujet} ... ${chose}.`), { compagnon: 'à', valides: ['est'] }),
  gabarit('a / à', 'a', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_SINGULIER, AVOIR_6E, (sujet, envie) => `${sujet} ... ${envie}.`), { compagnon: 'à' }),
  gabarit('a / à', 'a', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_SINGULIER, AVOIR_FAIT_6E, (sujet, fait) => `${sujet} ... ${fait}.`), { compagnon: 'à' }),
  gabarit('a / à', 'à', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_SINGULIER, LIEUX_6E, (sujet, lieu) => `${sujet} va ... ${lieu}.`), { compagnon: 'a' }),
  gabarit(
    'a / à',
    'à',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    SUJETS_6E_SINGULIER.flatMap((sujet) => ACTIVITES_AVEC_A.flatMap(([verbe, actions]) => actions.map((action) => `${sujet} ${verbe} ... ${action}.`))),
    { compagnon: 'a' }
  ),
  // « Lucas écrit une lettre et Chloé » : « et » et « ou » prolongent la phrase.
  gabarit(
    'a / à',
    'à',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    croiser(['Lucas', 'Chloé', 'Inès', 'Karim'], ['mon cousin', 'ma cousine', 'la directrice', 'le professeur', 'Manon', 'Nicolas', 'Sarah', 'Yanis'], (auteur, destinataire) => `${auteur} écrit une lettre ... ${destinataire}.`),
    { compagnon: 'a', valides: ['et', 'ou'] }
  ),
  gabarit(
    'et / est',
    'et',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    [...paires(PRENOMS_6E, (a, b) => `${a} ... ${b} préparent un exposé.`), ...['lourd', 'long', 'cher', 'bruyant', 'fragile', 'ancien'].map((adjectif) => `Ce sac est ${adjectif} ... encombrant.`)],
    { compagnon: 'est', valides: ['ou'] }
  ),
  gabarit('et / est', 'et', SIXIEME_T1, MOTS_6E_REVISION, CHOIX_6E.map(([a, b]) => `Il aime ${a} ... ${b}.`), { compagnon: 'est', valides: ['ou', 'à'] }),
  gabarit('et / est', 'est', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_SINGULIER, ETRE_6E_SINGULIER, (sujet, etat) => `${sujet} ... ${etat}.`), { compagnon: 'et' }),
  gabarit('on / ont', 'on', SIXIEME_T1, MOTS_6E_REVISION, DEBUTS_DE_PHRASE_ON_6E.flatMap((debut) => ACTIVITES_DE_ON_6E.map((activite) => `${debut}... ${activite}.`)), {
    compagnon: 'ont',
    valides: ['et', 'se'],
  }),
  gabarit('on / ont', 'ont', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_PLURIEL, AVOIR_6E, (sujet, envie) => `${sujet} ... ${envie}.`), { compagnon: 'on' }),
  gabarit('on / ont', 'ont', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_PLURIEL, POSSESSIONS_6E, (sujet, chose) => `${sujet} ... ${chose}.`), { compagnon: 'on', valides: ['sont'] }),
  gabarit('on / ont', 'ont', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_PLURIEL, AVOIR_FAIT_6E, (sujet, fait) => `${sujet} ... ${fait}.`), { compagnon: 'on' }),
  gabarit(
    'son / sont',
    'son',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    SUJETS_6E_SINGULIER.flatMap((sujet) => VERBES_DE_POSSESSION_6E.flatMap((verbe) => CHOSES_MASCULINES_6E.map((chose) => `${sujet} ${verbe} ... ${chose}.`))),
    { compagnon: 'sont', valides: ['ce'] }
  ),
  gabarit('son / sont', 'sont', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_PLURIEL, ETRE_6E_PLURIEL, (sujet, etat) => `${sujet} ... ${etat}.`), { compagnon: 'son' }),
  gabarit(
    'ou / où',
    'ou',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    CHOIX_6E.flatMap(([a, b]) => [`Veux-tu ${a} ... ${b} ?`, `Tu préfères ${a} ... ${b} ?`, `Tu choisis ${a} ... ${b} ?`]),
    { compagnon: 'où', valides: ['et', 'à'] }
  ),
  gabarit(
    'ou / où',
    'ou',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    ['Tu pars en juillet ... en août ?', 'Tu viens à pied ... à vélo ?', 'Tu lis ce soir ... demain ?', 'On travaille seuls ... en groupe ?', 'Tu écris au stylo ... au crayon ?'],
    { compagnon: 'où', valides: ['et'] }
  ),
  gabarit('ou / où', 'où', SIXIEME_T1, MOTS_6E_REVISION, ['le gymnase', 'la salle de musique', 'le bureau du principal', 'la cantine', 'le CDI', 'ma salle'].map((lieu) => `... se trouve ${lieu} ?`), {
    compagnon: 'ou',
  }),
  gabarit(
    'ou / où',
    'où',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    [
      ...['se trouve le gymnase', 'est ma salle', 'je dois aller', 'tu as rangé ton compas', 'se cache le trésor', 'Lucas a mis son sac'].map((fin) => `Dis-moi ... ${fin}.`),
      ...['le collège', 'la ville', 'le quartier', 'la rue'].map((lieu) => `Voici ${lieu} ... j'étudie.`),
    ],
    { compagnon: 'ou', valides: ['et'] }
  ),
  gabarit(
    'ce / se',
    'ce',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    OBJETS_6E.flatMap((objet) => [`... ${objet} est sur mon bureau.`, `Lucas range ... ${objet}.`, `Chloé ouvre ... ${objet}.`, `... ${objet} est à moi.`, `Karim cherche ... ${objet}.`]),
    { compagnon: 'se', valides: ['son'] }
  ),
  gabarit('ce / se', 'se', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_SINGULIER, SE_FAIRE_6E, (sujet, geste) => `${sujet} ... ${geste}.`), { compagnon: 'ce' }),
  gabarit('ce / se', 'se', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_PLURIEL, SE_FAIRE_6E_PLURIEL, (sujet, geste) => `${sujet} ... ${geste}.`), { compagnon: 'ce' }),
  gabarit(
    'ces / ses',
    'ces',
    SIXIEME_T1,
    MOTS_6E_REVISION,
    CHOSES_MONTREES_6E.flatMap((chose) => [`... ${chose}-là sont difficiles.`, `Regarde ... ${chose}-là !`, `Je préfère ... ${chose}-là.`]),
    { compagnon: 'ses' }
  ),
  gabarit('ces / ses', 'ses', SIXIEME_T1, MOTS_6E_REVISION, croiser(SUJETS_6E_SINGULIER, CHOSES_RANGEES_6E, (sujet, chose) => `${sujet} range ... propres ${chose}.`), { compagnon: 'ces' }),

  // --- 2e trimestre : c'est / s'est, c'était / s'était, quel / qu'elle, la / là / l'a / l'as, leur / leurs, mes / mais. ---
  gabarit(
    "c'est / s'est",
    "c'est",
    SIXIEME_T2,
    C_EST,
    ['une bonne idée', 'un jour de fête', 'un beau cadeau', 'une chance', 'un grand bonheur', 'ma sœur', 'mon cousin Paul', 'une belle histoire', 'un vrai problème', 'la vérité', 'trop tard', 'très simple'].flatMap((suite) => [
      `... ${suite}.`,
      `Je pense que ... ${suite}.`,
      `Dis-moi si ... ${suite}.`,
    ]),
    { compagnon: "s'est" }
  ),
  // « est » seul n'est jamais proposé : « Léa est levée tôt » est une phrase juste.
  gabarit(
    "c'est / s'est",
    "s'est",
    SIXIEME_T2,
    C_EST,
    [...croiser(SUJETS_F, SE_ETRE_F, (sujet, suite) => `${sujet} ... ${suite}.`), ...croiser(SUJETS_M, SE_ETRE_M, (sujet, suite) => `${sujet} ... ${suite}.`)],
    { compagnon: "c'est" }
  ),
  gabarit(
    "c'était / s'était",
    "c'était",
    SIXIEME_T2,
    C_ETAIT,
    ['un beau spectacle', 'une grande surprise', 'un drôle de jeu', 'une journée de fête', 'un cadeau magnifique', 'mon oncle', 'ma cousine', 'un bon moment'].flatMap((suite) => [
      `Hier, ... ${suite}.`,
      `Je me souviens : ... ${suite}.`,
    ]),
    { compagnon: "s'était" }
  ),
  gabarit(
    "c'était / s'était",
    "s'était",
    SIXIEME_T2,
    C_ETAIT,
    [
      ...croiser(SUJETS_F, SE_ETRE_F, (sujet, suite) => `Ce jour-là, ${enMinuscule(sujet)} ... ${suite}.`),
      ...croiser(SUJETS_M, SE_ETRE_M, (sujet, suite) => `Ce jour-là, ${enMinuscule(sujet)} ... ${suite}.`),
    ],
    { compagnon: "c'était" }
  ),
  gabarit("quel / qu'elle", 'quel', SIXIEME_T2, QUEL, ['âge as-tu', 'livre préfères-tu', 'jour sommes-nous', 'film as-tu vu', 'chemin faut-il prendre', 'cadeau veux-tu', 'sport aimes-tu'].map((fin) => `... ${fin} ?`), {
    compagnon: 'quelle',
  }),
  gabarit("quel / qu'elle", 'quelle', SIXIEME_T2, QUEL, ['heure est-il', 'fleur préfères-tu', 'couleur aimes-tu', 'chanson chantes-tu', 'saison préfères-tu', 'robe veux-tu', 'route faut-il prendre'].map((fin) => `... ${fin} ?`), {
    compagnon: "qu'elle",
  }),
  gabarit("quel / qu'elle", 'quels', SIXIEME_T2, QUEL, ['livres préfères-tu', 'jeux aimes-tu', 'jours viens-tu', 'amis as-tu invités', 'sports aimes-tu', 'films as-tu vus'].map((fin) => `... ${fin} ?`), {
    compagnon: 'quel',
  }),
  gabarit("quel / qu'elle", 'quelles', SIXIEME_T2, QUEL, ['fleurs préfères-tu', 'chansons aimes-tu', 'couleurs veux-tu', 'histoires as-tu lues', 'robes as-tu choisies', 'photos as-tu prises'].map((fin) => `... ${fin} ?`), {
    compagnon: "qu'elles",
  }),
  gabarit(
    "quel / qu'elle",
    "qu'elle",
    SIXIEME_T2,
    QUEL,
    ['Je crois ... a raison.', 'Il faut ... vienne demain.', 'Paul pense ... arrive à midi.', 'Je sais ... sait la réponse.', 'Nora dit ... aime le chocolat.', 'Je suis sûr ... sera contente.', 'Lucas espère ... viendra.', 'Je vois ... a compris.'],
    { compagnon: 'quelle' }
  ),
  gabarit(
    "quel / qu'elle",
    "qu'elles",
    SIXIEME_T2,
    QUEL,
    ['Je crois ... ont raison.', 'Il faut ... viennent demain.', 'Paul pense ... arrivent à midi.', 'Je sais ... savent la réponse.', 'Nora dit ... aiment le chocolat.', 'Je suis sûr ... seront contentes.', 'Lucas espère ... viendront.', 'Je vois ... ont compris.'],
    { compagnon: 'quelles' }
  ),
  gabarit("la / là / l'a / l'as", 'la', SIXIEME_T2, LA_LA, LA_PHRASES_6E, { compagnon: 'là' }),
  gabarit("la / là / l'a / l'as", 'là', SIXIEME_T2, LA_LA, LA_PHRASES_LA, { compagnon: 'la' }),
  gabarit(
    "la / là / l'a / l'as",
    "l'a",
    SIXIEME_T2,
    LA_LA,
    ['Léa', 'Paul', 'Nora', 'Tom', 'Camille', 'Hugo', 'Emma', 'Sami', 'Il', 'Elle', 'Mon frère', 'Ma sœur'].flatMap((sujet) =>
      OBJETS_ANTERIEURS.map(([objet, participe]) => `${objet}, ${enMinuscule(sujet)} ... ${participe}.`)
    ),
    { compagnon: 'la' }
  ),
  gabarit("la / là / l'a / l'as", "l'as", SIXIEME_T2, LA_LA, OBJETS_ANTERIEURS.flatMap(([objet, participe]) => [`${objet}, tu ... ${participe}.`, `${objet}, tu ... ${participe} ?`]), {
    compagnon: "l'a",
  }),
  // Le pronom « leur » ne prend jamais de « s » : « Je leur parle », « Maman leur donne du pain ».
  gabarit(
    'leur / leurs',
    'leur',
    SIXIEME_T2,
    LEUR,
    [
      ...croiser(SUJETS_6E_PLURIEL.slice(0, 7), SINGULIERS_CAHIERS, (sujet, objet) => `${sujet} rangent ... ${objet}.`),
      'Les enfants ont faim : Maman ... donne du pain.',
      'Mes cousins arrivent demain : je ... prépare un lit.',
      'Les voisins sont partis : je ... écris une lettre.',
      'Les élèves ont bien travaillé : le professeur ... dit bravo.',
      'Mes grands-parents sont loin : je ... téléphone souvent.',
      'Les joueurs sont fatigués : le coach ... accorde une pause.',
    ],
    { compagnon: 'leurs' }
  ),
  gabarit('leur / leurs', 'leurs', SIXIEME_T2, LEUR, croiser(SUJETS_6E_PLURIEL.slice(0, 7), PLURIELS_CAHIERS, (sujet, objet) => `${sujet} rangent ... ${objet}.`), { compagnon: 'leur' }),
  gabarit(
    'mes / mais',
    'mes',
    SIXIEME_T2,
    MES,
    ['affaires', 'cahiers', 'livres', 'clés', 'crayons', 'photos', 'jouets', 'chaussures'].flatMap((chose) => [`Je range ... ${chose}.`, `Tu cherches ... ${chose}.`]),
    { compagnon: 'mais' }
  ),
  gabarit(
    'mes / mais',
    'mais',
    SIXIEME_T2,
    MES,
    [
      'Je veux jouer, ... il pleut.',
      'Il est petit, ... il est fort.',
      "J'aime le chocolat, ... pas la vanille.",
      'Il est tard, ... je ne suis pas fatigué.',
      'Paul court vite, ... Tom court plus vite.',
      "Elle a faim, ... il n'y a plus de pain.",
      'Je veux bien, ... pas ce soir.',
    ],
    { compagnon: 'mes' }
  ),

  // --- 3e trimestre : quelque / quel que, plutôt / plus tôt, ni / n'y. ---
  gabarit(
    'quelque / quel que',
    'quel que',
    SIXIEME_T3,
    QUELQUE,
    ['soit ton choix, je viendrai.', 'soit le temps, nous partirons.', "soit le prix, je l'achète.", 'soit ton avis, dis-le.', 'soit le résultat, bravo !', "soit le moment, je t'attends."].map((suite) => `... ${suite}`),
    { compagnon: 'quelque' }
  ),
  gabarit(
    'quelque / quel que',
    'quelle que',
    SIXIEME_T3,
    QUELQUE,
    ["soit ta réponse, je t'écoute.", 'soit la saison, il fait doux ici.', 'soit la distance, nous irons.', 'soit ton idée, dis-la.', 'soit la couleur, elle me convient.', "soit l'heure, appelle-moi."].map((suite) => `... ${suite}`),
    { compagnon: 'quelque' }
  ),
  gabarit(
    'quelque / quel que',
    'quelques',
    SIXIEME_T3,
    QUELQUE,
    ['minutes', 'jours', 'amis', 'mots', 'questions', 'pommes', 'photos', 'livres'].flatMap((nom) => [`Il reste ... ${nom} avant la fin.`, `J'ai ... ${nom} à te montrer.`]),
    { compagnon: 'quelque' }
  ),
  // « quelque chose » et « quelque part » s'écrivent avec « quelque » au singulier, toujours.
  gabarit(
    'quelque / quel que',
    'quelque',
    SIXIEME_T3,
    QUELQUE,
    ['Paul a ... chose à te dire.', 'Il y a ... chose dans le sac.', 'Je cherche ... chose de sucré.', 'Léa a vu ... chose de drôle.', "Je l'ai mis ... part dans ma chambre."],
    { compagnon: 'quelques' }
  ),
  // Dans ces phrases, « plus tard » irait pour « plus tôt » : il n'est jamais proposé.
  gabarit(
    'plutôt / plus tôt',
    'plutôt',
    SIXIEME_T3,
    PLUTOT,
    [
      "Il fait ... froid aujourd'hui.",
      'Ce film est ... long.',
      'Cette histoire est ... drôle.',
      'La soupe est ... chaude.',
      'Ce garçon est ... timide.',
      "Nous irons à la mer ... qu'à la montagne.",
      'Le texte est ... difficile.',
      'Ce jeu est ... simple.',
    ],
    { compagnon: 'plus tôt' }
  ),
  gabarit(
    'plutôt / plus tôt',
    'plus tôt',
    SIXIEME_T3,
    PLUTOT,
    [
      'Le train part une heure ... que prévu.',
      "Léa s'est levée ... que d'habitude.",
      "Nous mangeons ... que d'habitude, ce soir.",
      'Il est arrivé deux minutes ... que moi.',
      'Le soleil se couche ... en hiver.',
      'Couche-toi ... ce soir.',
      'Si tu étais venu ..., tu aurais tout vu.',
    ],
    { compagnon: 'plutôt' }
  ),
  gabarit(
    "ni / n'y",
    'ni',
    SIXIEME_T3,
    NI,
    [
      ['viande', 'poisson'],
      ['sucre', 'sel'],
      ['pain', 'beurre'],
      ['lait', 'café'],
      ['chocolat', 'bonbons'],
      ['football', 'tennis'],
    ].map(([a, b]) => `Il ne mange ni ${a} ... ${b}.`),
    { compagnon: "n'y" }
  ),
  gabarit(
    "ni / n'y",
    "n'y",
    SIXIEME_T3,
    NI,
    ['Je ... crois pas.', 'Nous ... allons pas ce soir.', 'Léa ... pense jamais.', 'Il ... comprend rien.', "Tu ... vois rien d'ici.", 'Paul ... est jamais allé.'],
    { compagnon: 'ni' }
  ),
];

/** Les gabarits d'un niveau. */
export function gabaritsDuNiveau(level: Level): Gabarit[] {
  return level === '6e' ? GABARITS_6E : GABARITS_CYCLE_2;
}

/** Les mots que l'élève a déjà rencontrés à une étape : le mot juste de chaque gabarit déjà posé. */
export function motsConnus(gabarits: readonly Gabarit[], stage: Stage): Set<string> {
  return new Set(gabarits.filter((gabarit) => gabarit.depuis <= stage).map((gabarit) => gabarit.bonne));
}
