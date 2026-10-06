import type { Stage } from '../lib/progression';

/**
 * Le lexique des accords du CE1 et du CE2 : des noms avec leur genre et leur
 * pluriel, des adjectifs avec leurs quatre formes, des couples masculin et
 * féminin. Les mots sont ceux d'un enfant de sept ou huit ans : des choses qu'il
 * voit et qu'il touche.
 *
 * Chaque mot porte l'étape (`depuis`) où le programme de cycle 2 l'enseigne :
 *  - CE1, 1er trimestre (−5) : le pluriel en -s et le féminin en -e des noms ;
 *  - CE1, 2e trimestre (−4) : l'accord de l'adjectif, le féminin des noms avec
 *    doublement de la consonne ou en -euse ;
 *  - CE2, 1er trimestre (−2) : l'adjectif aux formes moins régulières
 *    (blanc, long, neuf) ;
 *  - CE2, 2e trimestre (−1) : le pluriel en -x (bateaux, cheveux, bijoux) et
 *    en -aux (chevaux, journaux), l'adjectif en -eux et beau, nouveau, vieux.
 *
 * Aucun mot n'est ici que le CM1 ou le CM2 enseignent : leurs listes sont à
 * part (accordsLexique.ts).
 */

export type Genre = 'm' | 'f';
export type Nombre = 'singulier' | 'pluriel';

/**
 * Les catégories de sens des noms : elles empêchent de croiser un adjectif et
 * un nom qui ne vont pas ensemble (« un jardin fort », « une pomme heureuse »,
 * « un chien vert ») ou un nom et un verbe sans rapport. Un nom n'a qu'une
 * catégorie ; un adjectif porte la liste de celles avec lesquelles il fait sens.
 *
 *  - `colorable` : un objet, un vêtement ou une maison, qui peut avoir
 *    n'importe quelle couleur ;
 *  - `vehicule` : de même, et qui peut aussi être rapide ;
 *  - `nourriture` : ce qu'on mange, fruits, légumes, friandises ;
 *  - `plat` : ce qu'on prépare et qu'on mange chaud ou froid (une soupe, une
 *    tarte), seul à pouvoir être « chaud » ou « froid » ;
 *  - `plante`, `lieu` : ce qui pousse, où l'on va.
 */
export type Categorie =
  | 'personne'
  | 'animal'
  | 'colorable'
  | 'vehicule'
  | 'nourriture'
  | 'plat'
  | 'plante'
  | 'lieu'
  // Celles de la 6e (accordsLexiqueSixieme.ts) : des objets, des éléments de
  // la nature, des activités, des spectacles.
  | 'objet'
  | 'nature'
  | 'activite'
  | 'spectacle';

export interface NomEcrit {
  singulier: string;
  pluriel: string;
  genre: Genre;
  categorie: Categorie;
  depuis: Stage;
}

function noms(depuis: Stage, categorie: Categorie, liste: [string, string, Genre][]): NomEcrit[] {
  return liste.map(([singulier, pluriel, genre]) => ({ singulier, pluriel, genre, categorie, depuis }));
}

/** Les noms au pluriel en -s : dès la rentrée du CE1. Aucun nom en -s, -x ou -z,
 *  dont le pluriel ne change pas, et aucun mot dont l'orthographe a été
 *  rectifiée en 1990 (maître, boîte, île, flûte, coût, goût…). */
const REGULIERS: NomEcrit[] = [
  ...noms(-5, 'personne', [
    ['garçon', 'garçons', 'm'],
    ['fille', 'filles', 'f'],
    ['voisin', 'voisins', 'm'],
    ['voisine', 'voisines', 'f'],
    ['ami', 'amis', 'm'],
    ['amie', 'amies', 'f'],
    ['copain', 'copains', 'm'],
    ['copine', 'copines', 'f'],
    ['cousin', 'cousins', 'm'],
    ['cousine', 'cousines', 'f'],
    ['frère', 'frères', 'm'],
    ['sœur', 'sœurs', 'f'],
    ['roi', 'rois', 'm'],
    ['reine', 'reines', 'f'],
    ['bébé', 'bébés', 'm'],
    ['maman', 'mamans', 'f'],
    ['papa', 'papas', 'm'],
    ['clown', 'clowns', 'm'],
    ['pirate', 'pirates', 'm'],
    ['fée', 'fées', 'f'],
    ['dame', 'dames', 'f'],
  ]),
  ...noms(-5, 'animal', [
    ['chat', 'chats', 'm'],
    ['chatte', 'chattes', 'f'],
    ['chien', 'chiens', 'm'],
    ['chienne', 'chiennes', 'f'],
    ['lapin', 'lapins', 'm'],
    ['lapine', 'lapines', 'f'],
    ['poule', 'poules', 'f'],
    ['coq', 'coqs', 'm'],
    ['vache', 'vaches', 'f'],
    ['cochon', 'cochons', 'm'],
    ['mouton', 'moutons', 'm'],
    ['âne', 'ânes', 'm'],
    ['canard', 'canards', 'm'],
    ['poisson', 'poissons', 'm'],
    ['lion', 'lions', 'm'],
    ['lionne', 'lionnes', 'f'],
    ['tigre', 'tigres', 'm'],
    ['girafe', 'girafes', 'f'],
    ['singe', 'singes', 'm'],
    ['loup', 'loups', 'm'],
    ['renard', 'renards', 'm'],
    ['éléphant', 'éléphants', 'm'],
    ['tortue', 'tortues', 'f'],
    ['grenouille', 'grenouilles', 'f'],
    ['abeille', 'abeilles', 'f'],
    ['fourmi', 'fourmis', 'f'],
    ['mouche', 'mouches', 'f'],
    ['araignée', 'araignées', 'f'],
    ['escargot', 'escargots', 'm'],
    ['papillon', 'papillons', 'm'],
    ['serpent', 'serpents', 'm'],
    ['chèvre', 'chèvres', 'f'],
  ]),
  ...noms(-5, 'colorable', [
    ['livre', 'livres', 'm'],
    ['cahier', 'cahiers', 'm'],
    ['stylo', 'stylos', 'm'],
    ['crayon', 'crayons', 'm'],
    ['cartable', 'cartables', 'm'],
    ['trousse', 'trousses', 'f'],
    ['règle', 'règles', 'f'],
    ['gomme', 'gommes', 'f'],
    ['ballon', 'ballons', 'm'],
    ['poupée', 'poupées', 'f'],
    ['jouet', 'jouets', 'm'],
    ['sac', 'sacs', 'm'],
    ['panier', 'paniers', 'm'],
    ['chaise', 'chaises', 'f'],
    ['table', 'tables', 'f'],
    ['lampe', 'lampes', 'f'],
    ['bol', 'bols', 'm'],
    ['tasse', 'tasses', 'f'],
    ['assiette', 'assiettes', 'f'],
    ['bouteille', 'bouteilles', 'f'],
    ['verre', 'verres', 'm'],
    ['fourchette', 'fourchettes', 'f'],
    ['porte', 'portes', 'f'],
    ['lit', 'lits', 'm'],
    ['armoire', 'armoires', 'f'],
    ['maison', 'maisons', 'f'],
    ['robe', 'robes', 'f'],
    ['pantalon', 'pantalons', 'm'],
    ['bonnet', 'bonnets', 'm'],
    ['écharpe', 'écharpes', 'f'],
    ['gant', 'gants', 'm'],
    ['chaussure', 'chaussures', 'f'],
    ['chaussette', 'chaussettes', 'f'],
    ['jupe', 'jupes', 'f'],
    ['pull', 'pulls', 'm'],
    ['veste', 'vestes', 'f'],
  ]),
  ...noms(-5, 'vehicule', [
    ['vélo', 'vélos', 'm'],
    ['voiture', 'voitures', 'f'],
    ['camion', 'camions', 'm'],
    ['moto', 'motos', 'f'],
    ['avion', 'avions', 'm'],
    ['train', 'trains', 'm'],
    ['trottinette', 'trottinettes', 'f'],
    ['tracteur', 'tracteurs', 'm'],
    ['fusée', 'fusées', 'f'],
  ]),
  ...noms(-5, 'nourriture', [
    ['pomme', 'pommes', 'f'],
    ['poire', 'poires', 'f'],
    ['banane', 'bananes', 'f'],
    ['fraise', 'fraises', 'f'],
    ['cerise', 'cerises', 'f'],
    ['orange', 'oranges', 'f'],
    ['bonbon', 'bonbons', 'm'],
    ['carotte', 'carottes', 'f'],
    ['tomate', 'tomates', 'f'],
    ['fromage', 'fromages', 'm'],
    ['glace', 'glaces', 'f'],
    ['biscuit', 'biscuits', 'm'],
    ['pain', 'pains', 'm'],
    ['confiture', 'confitures', 'f'],
    ['chocolat', 'chocolats', 'm'],
  ]),
  ...noms(-5, 'plat', [
    ['soupe', 'soupes', 'f'],
    ['tarte', 'tartes', 'f'],
    ['crêpe', 'crêpes', 'f'],
    ['salade', 'salades', 'f'],
    ['pizza', 'pizzas', 'f'],
    ['omelette', 'omelettes', 'f'],
  ]),
  ...noms(-5, 'plante', [
    ['fleur', 'fleurs', 'f'],
    ['feuille', 'feuilles', 'f'],
    ['arbre', 'arbres', 'm'],
    ['branche', 'branches', 'f'],
    ['tulipe', 'tulipes', 'f'],
    ['sapin', 'sapins', 'm'],
  ]),
  ...noms(-5, 'lieu', [
    ['école', 'écoles', 'f'],
    ['jardin', 'jardins', 'm'],
    ['ville', 'villes', 'f'],
    ['rue', 'rues', 'f'],
    ['route', 'routes', 'f'],
    ['classe', 'classes', 'f'],
    ['parc', 'parcs', 'm'],
    ['pont', 'ponts', 'm'],
    ['gare', 'gares', 'f'],
    ['forêt', 'forêts', 'f'],
    ['plage', 'plages', 'f'],
    ['montagne', 'montagnes', 'f'],
  ]),
];

/** Les noms au pluriel en -x ou en -aux : ils arrivent au CE2, 2e trimestre
 *  (« le -x du pluriel est nouveau au CE2 »). */
const EN_X_OU_AUX: NomEcrit[] = [
  ...noms(-1, 'animal', [
    ['oiseau', 'oiseaux', 'm'],
    ['cheval', 'chevaux', 'm'],
    ['animal', 'animaux', 'm'],
  ]),
  ...noms(-1, 'colorable', [
    ['rideau', 'rideaux', 'm'],
    ['drapeau', 'drapeaux', 'm'],
    ['tableau', 'tableaux', 'm'],
    ['couteau', 'couteaux', 'm'],
    ['chapeau', 'chapeaux', 'm'],
    ['manteau', 'manteaux', 'm'],
    ['bijou', 'bijoux', 'm'],
    ['caillou', 'cailloux', 'm'],
    ['journal', 'journaux', 'm'],
    ['jeu', 'jeux', 'm'],
  ]),
  ...noms(-1, 'vehicule', [['bateau', 'bateaux', 'm']]),
  ...noms(-1, 'plat', [['gâteau', 'gâteaux', 'm']]),
  ...noms(-1, 'nourriture', [['chou', 'choux', 'm']]),
  ...noms(-1, 'lieu', [['château', 'châteaux', 'm']]),
];

export const NOMS_CYCLE_2: NomEcrit[] = [...REGULIERS, ...EN_X_OU_AUX];

// --- Les adjectifs -----------------------------------------------------------

export type Position = 'avant' | 'après';

export interface AdjectifEcrit {
  masculinSingulier: string;
  femininSingulier: string;
  masculinPluriel: string;
  femininPluriel: string;
  position: Position;
  categories: Categorie[];
  depuis: Stage;
  /** Placé avant un nom masculin singulier qui commence par une voyelle, il
   *  prend une autre forme (« un bel ami », « un nouvel ami », « un vieil
   *  ami ») : ces groupes ne sont pas posés. */
  formeDevantVoyelle?: string;
  /** Des noms de ses catégories avec lesquels il sonne faux (« une grosse
   *  plage », « une horloge légère ») : ces groupes ne sont pas posés. */
  sauf?: string[];
}

const NOURRITURES: Categorie[] = ['nourriture', 'plat'];
const TOUTES: Categorie[] = ['personne', 'animal', 'colorable', 'vehicule', 'nourriture', 'plat', 'plante', 'lieu'];
const VIVANTS: Categorie[] = ['personne', 'animal'];
const COULEUR: Categorie[] = ['colorable', 'vehicule'];

function adjectif(
  depuis: Stage,
  masculinSingulier: string,
  femininSingulier: string,
  masculinPluriel: string,
  femininPluriel: string,
  position: Position,
  categories: Categorie[],
  formeDevantVoyelle?: string,
  sauf?: string[]
): AdjectifEcrit {
  return { depuis, masculinSingulier, femininSingulier, masculinPluriel, femininPluriel, position, categories, formeDevantVoyelle, sauf };
}

/**
 * Les adjectifs du cycle 2. « Rouge », « sage » ou « calme » ne changent pas au
 * féminin : on y voit le pluriel seul. Les couleurs ne vont jamais aux
 * personnes, ni aux animaux sauf noir, blanc et gris.
 */
export const ADJECTIFS_CYCLE_2: AdjectifEcrit[] = [
  // CE1, 2e trimestre : l'accord de l'adjectif.
  // « Une petite amie » et « un petit copain » ne se disent pas d'enfants : ces groupes ne sont pas posés.
  adjectif(-4, 'petit', 'petite', 'petits', 'petites', 'avant', TOUTES, undefined, ['ami', 'amie', 'copain', 'copine']),
  adjectif(-4, 'grand', 'grande', 'grands', 'grandes', 'avant', TOUTES),
  adjectif(-4, 'joli', 'jolie', 'jolis', 'jolies', 'avant', TOUTES),
  adjectif(-4, 'noir', 'noire', 'noirs', 'noires', 'après', ['animal', ...COULEUR]),
  adjectif(-4, 'vert', 'verte', 'verts', 'vertes', 'après', COULEUR),
  adjectif(-4, 'rouge', 'rouge', 'rouges', 'rouges', 'après', COULEUR),
  adjectif(-4, 'jaune', 'jaune', 'jaunes', 'jaunes', 'après', COULEUR),
  adjectif(-4, 'rose', 'rose', 'roses', 'roses', 'après', COULEUR),
  adjectif(-4, 'bleu', 'bleue', 'bleus', 'bleues', 'après', COULEUR),
  adjectif(-4, 'content', 'contente', 'contents', 'contentes', 'après', VIVANTS),
  adjectif(-4, 'fatigué', 'fatiguée', 'fatigués', 'fatiguées', 'après', VIVANTS),
  adjectif(-4, 'fort', 'forte', 'forts', 'fortes', 'après', VIVANTS),
  adjectif(-4, 'sage', 'sage', 'sages', 'sages', 'après', VIVANTS),
  adjectif(-4, 'calme', 'calme', 'calmes', 'calmes', 'après', [...VIVANTS, 'lieu']),
  adjectif(-4, 'timide', 'timide', 'timides', 'timides', 'après', VIVANTS),
  adjectif(-4, 'rapide', 'rapide', 'rapides', 'rapides', 'après', [...VIVANTS, 'vehicule']),
  // Le féminin avec doublement de la consonne.
  adjectif(-4, 'gentil', 'gentille', 'gentils', 'gentilles', 'avant', VIVANTS),
  adjectif(-4, 'bon', 'bonne', 'bons', 'bonnes', 'avant', [...VIVANTS, ...NOURRITURES, ...COULEUR], undefined, ['sœur']),
  // CE1, 3e trimestre.
  adjectif(-3, 'chaud', 'chaude', 'chauds', 'chaudes', 'après', ['plat']),
  adjectif(-3, 'froid', 'froide', 'froids', 'froides', 'après', ['plat']),
  // CE2, 1er trimestre : des féminins moins réguliers.
  adjectif(-2, 'blanc', 'blanche', 'blancs', 'blanches', 'après', ['animal', ...COULEUR]),
  adjectif(-2, 'gris', 'grise', 'gris', 'grises', 'après', ['animal', ...COULEUR]),
  adjectif(-2, 'long', 'longue', 'longs', 'longues', 'avant', ['vehicule', 'lieu'], undefined, ['école', 'ville', 'classe', 'montagne', 'gare', 'forêt', 'château']),
  adjectif(-2, 'neuf', 'neuve', 'neufs', 'neuves', 'après', COULEUR),
  // CE2, 2e trimestre : le pluriel en -x, et les adjectifs qui changent de forme.
  adjectif(-1, 'heureux', 'heureuse', 'heureux', 'heureuses', 'après', VIVANTS),
  adjectif(-1, 'joyeux', 'joyeuse', 'joyeux', 'joyeuses', 'après', ['personne']),
  adjectif(-1, 'délicieux', 'délicieuse', 'délicieux', 'délicieuses', 'après', NOURRITURES),
  // « Un beau frère », « une belle maman » se lisent « beau-frère », « belle-maman » : ils ne sont pas posés.
  adjectif(-1, 'beau', 'belle', 'beaux', 'belles', 'avant', TOUTES, 'bel', ['frère', 'sœur', 'maman', 'papa']),
  adjectif(-1, 'nouveau', 'nouvelle', 'nouveaux', 'nouvelles', 'avant', ['personne', 'animal', 'colorable', 'vehicule', 'plat'], 'nouvel'),
  // « Un vieux garçon » et « une vieille fille » ont un autre sens.
  adjectif(-1, 'vieux', 'vieille', 'vieux', 'vieilles', 'avant', TOUTES, 'vieil', ['garçon', 'fille']),
  adjectif(-1, 'sec', 'sèche', 'secs', 'sèches', 'après', ['plante']),
];

export function formeDuNom(nom: NomEcrit, nombre: Nombre): string {
  return nombre === 'singulier' ? nom.singulier : nom.pluriel;
}

export function formeDeLAdjectif(adjectifEcrit: AdjectifEcrit, genre: Genre, nombre: Nombre): string {
  if (genre === 'm') return nombre === 'singulier' ? adjectifEcrit.masculinSingulier : adjectifEcrit.masculinPluriel;
  return nombre === 'singulier' ? adjectifEcrit.femininSingulier : adjectifEcrit.femininPluriel;
}

// --- Le féminin des noms -------------------------------------------------------

export type SorteDeFeminin = 'e' | 'doublement' | 'eur-euse';

export interface CoupleMasculinFeminin {
  masculin: string;
  feminin: string;
  sorte: SorteDeFeminin;
  depuis: Stage;
  /** L'erreur qu'on fait d'ordinaire en écrivant ce féminin : la consonne qu'on
   *  ne double pas, le -e qu'on met à la place du -euse. Absente pour le -e. */
  erreur?: string;
}

function couples(depuis: Stage, sorte: SorteDeFeminin, liste: [string, string, string?][]): CoupleMasculinFeminin[] {
  return liste.map(([masculin, feminin, erreur]) => ({ masculin, feminin, sorte, depuis, erreur }));
}

/** Les couples masculin et féminin : le -e d'abord (le seul qui change l'écrit
 *  sans changer la consonne), puis, au 2e trimestre du CE1, le doublement de la
 *  consonne (chat et chatte) et le -euse. */
export const COUPLES_MASCULIN_FEMININ: CoupleMasculinFeminin[] = [
  ...couples(-5, 'e', [
    ['ami', 'amie'],
    ['voisin', 'voisine'],
    ['cousin', 'cousine'],
    ['lapin', 'lapine'],
    ['marchand', 'marchande'],
    ['invité', 'invitée'],
    ['habitant', 'habitante'],
  ]),
  ...couples(-4, 'doublement', [
    ['chat', 'chatte', 'chate'],
    ['chien', 'chienne', 'chiene'],
    ['lion', 'lionne', 'lione'],
    ['paysan', 'paysanne', 'paysane'],
  ]),
  ...couples(-4, 'eur-euse', [
    ['chanteur', 'chanteuse', 'chanteure'],
    ['danseur', 'danseuse', 'danseure'],
    ['nageur', 'nageuse', 'nageure'],
    ['vendeur', 'vendeuse', 'vendeure'],
    ['joueur', 'joueuse', 'joueure'],
    ['voleur', 'voleuse', 'voleure'],
    ['menteur', 'menteuse', 'menteure'],
    ['coiffeur', 'coiffeuse', 'coiffeure'],
  ]),
  ...couples(-2, 'doublement', [['champion', 'championne', 'champione']]),
];
