import type { Staged } from '../lib/progression';

export type Gender = 'm' | 'f';
export type GrammaticalNumber = 'singulier' | 'pluriel';

/**
 * Les catégories de sens des noms : elles empêchent de croiser un adjectif
 * et un nom qui ne vont pas ensemble (« un jardin fort », « une feuille
 * heureuse ») ou un nom et un verbe sans rapport (« un crayon prépare le
 * repas »). Un nom n'a qu'une catégorie ; un adjectif porte la liste des
 * catégories avec lesquelles il fait sens.
 */
export type NounCategory = 'personne' | 'animal' | 'vehicule' | 'fragile' | 'objet';

/**
 * Le lexique des accords : des noms avec leur genre et leur pluriel, des
 * adjectifs avec leurs quatre formes. Le générateur (accords.ts) croise ce
 * lexique avec des modèles de phrases pour fabriquer des centaines de
 * questions, plutôt que d'écrire chaque phrase à la main.
 */
export interface Noun extends Staged {
  singular: string;
  plural: string;
  gender: Gender;
  category: NounCategory;
}

/** Pluriels réguliers, dès le premier trimestre. */
const REGULAR_NOUNS: [string, string, Gender, NounCategory][] = [
  ['jardin', 'jardins', 'm', 'objet'],
  ['chien', 'chiens', 'm', 'animal'],
  ['dessin', 'dessins', 'm', 'objet'],
  ['cartable', 'cartables', 'm', 'objet'],
  ['ballon', 'ballons', 'm', 'objet'],
  ['vélo', 'vélos', 'm', 'vehicule'],
  ['stylo', 'stylos', 'm', 'objet'],
  ['cahier', 'cahiers', 'm', 'objet'],
  ['sac', 'sacs', 'm', 'objet'],
  ['crayon', 'crayons', 'm', 'objet'],
  ['livre', 'livres', 'm', 'objet'],
  ['classeur', 'classeurs', 'm', 'objet'],
  ['garçon', 'garçons', 'm', 'personne'],
  ['voisin', 'voisins', 'm', 'personne'],
  ['ami', 'amis', 'm', 'personne'],
  ['maison', 'maisons', 'f', 'objet'],
  ['fille', 'filles', 'f', 'personne'],
  ['table', 'tables', 'f', 'objet'],
  ['fleur', 'fleurs', 'f', 'fragile'],
  ['feuille', 'feuilles', 'f', 'fragile'],
  ['cuillère', 'cuillères', 'f', 'objet'],
  ['image', 'images', 'f', 'objet'],
  ['écharpe', 'écharpes', 'f', 'objet'],
  ['chaise', 'chaises', 'f', 'objet'],
  ['lampe', 'lampes', 'f', 'objet'],
  ['pomme', 'pommes', 'f', 'fragile'],
  ['tarte', 'tartes', 'f', 'fragile'],
  ['voiture', 'voitures', 'f', 'vehicule'],
  ['école', 'écoles', 'f', 'objet'],
  ['salade', 'salades', 'f', 'fragile'],
];

/**
 * Pluriels irréguliers en -eau/-al : ils arrivent au 3e trimestre du CM1,
 * comme le montre le test `keeps irregular plurals for the third trimester`.
 */
const IRREGULAR_NOUNS: [string, string, Gender, NounCategory][] = [
  ['tableau', 'tableaux', 'm', 'objet'],
  ['bateau', 'bateaux', 'm', 'vehicule'],
  ['chapeau', 'chapeaux', 'm', 'objet'],
  ['gâteau', 'gâteaux', 'm', 'fragile'],
  ['journal', 'journaux', 'm', 'objet'],
  ['cheval', 'chevaux', 'm', 'animal'],
  ['animal', 'animaux', 'm', 'animal'],
  ['hôpital', 'hôpitaux', 'm', 'objet'],
];

export const NOUNS: Noun[] = [
  ...REGULAR_NOUNS.map(([singular, plural, gender, category]) => ({ minStage: 1 as const, singular, plural, gender, category })),
  ...IRREGULAR_NOUNS.map(([singular, plural, gender, category]) => ({ minStage: 3 as const, singular, plural, gender, category })),
];

/** Position habituelle par rapport au nom : « un grand jardin » (avant) mais
 *  « un jardin agréable » (après). Sert à fabriquer des énoncés naturels. */
export type AdjectivePosition = 'avant' | 'après';

export interface Adjective extends Staged {
  masculineSingular: string;
  feminineSingular: string;
  masculinePlural: string;
  femininePlural: string;
  position: AdjectivePosition;
  categories: NounCategory[];
}

const ALL_CATEGORIES: NounCategory[] = ['personne', 'animal', 'vehicule', 'fragile', 'objet'];

function adj(
  minStage: Adjective['minStage'],
  ms: string,
  fs: string,
  mp: string,
  fp: string,
  position: AdjectivePosition,
  categories: NounCategory[] = ALL_CATEGORIES
): Adjective {
  return { minStage, masculineSingular: ms, feminineSingular: fs, masculinePlural: mp, femininePlural: fp, position, categories };
}

/** L'accord en genre : au programme à partir du 2e trimestre du CM1. */
export const ADJECTIVES: Adjective[] = [
  adj(1, 'petit', 'petite', 'petits', 'petites', 'avant'),
  adj(1, 'grand', 'grande', 'grands', 'grandes', 'avant'),
  adj(1, 'joli', 'jolie', 'jolis', 'jolies', 'avant'),
  adj(1, 'gentil', 'gentille', 'gentils', 'gentilles', 'avant', ['personne', 'animal']),
  adj(1, 'heureux', 'heureuse', 'heureux', 'heureuses', 'après', ['personne', 'animal']),
  adj(1, 'mauvais', 'mauvaise', 'mauvais', 'mauvaises', 'avant'),
  // « long » décrit une forme : un fruit, une fleur ou un gâteau (catégorie
  // « fragile ») ne se décrivent pas par leur longueur.
  adj(1, 'long', 'longue', 'longs', 'longues', 'avant', ['vehicule', 'objet']),
  adj(1, 'léger', 'légère', 'légers', 'légères', 'après', ['vehicule', 'objet', 'fragile']),
  adj(1, 'premier', 'première', 'premiers', 'premières', 'avant'),
  // « agréable » ne va pas à un aliment (« une salade agréable ») : « bon »
  // ou « frais » leur conviennent, pas ce mot-là.
  adj(1, 'agréable', 'agréable', 'agréables', 'agréables', 'après', ['personne', 'animal', 'vehicule', 'objet']),
  adj(1, 'rapide', 'rapide', 'rapides', 'rapides', 'après', ['personne', 'animal', 'vehicule']),
  adj(1, 'fort', 'forte', 'forts', 'fortes', 'après', ['personne', 'animal']),
  adj(1, 'doux', 'douce', 'doux', 'douces', 'après', ['personne', 'animal', 'objet', 'fragile']),
  adj(1, 'frais', 'fraîche', 'frais', 'fraîches', 'après', ['fragile']),
  adj(1, 'bon', 'bonne', 'bons', 'bonnes', 'avant'),
  // Irréguliers, avec les pluriels en -eau/-al du 3e trimestre.
  adj(3, 'beau', 'belle', 'beaux', 'belles', 'avant'),
  adj(3, 'vieux', 'vieille', 'vieux', 'vieilles', 'avant'),
  adj(3, 'nouveau', 'nouvelle', 'nouveaux', 'nouvelles', 'avant'),
];

export function adjectiveForm(adjective: Adjective, gender: Gender, number: GrammaticalNumber): string {
  if (gender === 'm') return number === 'singulier' ? adjective.masculineSingular : adjective.masculinePlural;
  return number === 'singulier' ? adjective.feminineSingular : adjective.femininePlural;
}

export function nounForm(noun: Noun, number: GrammaticalNumber): string {
  return number === 'singulier' ? noun.singular : noun.plural;
}

/**
 * Le participe passé avec « être » : accordé en genre et en nombre avec le
 * sujet. Au programme dès le 3e trimestre du CM1 (programme 2025).
 */
export interface EtreVerb extends Staged {
  infinitive: string;
  masculineSingular: string;
  feminineSingular: string;
  masculinePlural: string;
  femininePlural: string;
}

function etreVerb(infinitive: string, ms: string, fs: string, mp: string, fp: string): EtreVerb {
  return { minStage: 3, infinitive, masculineSingular: ms, feminineSingular: fs, masculinePlural: mp, femininePlural: fp };
}

export const ETRE_VERBS: EtreVerb[] = [
  etreVerb('partir', 'parti', 'partie', 'partis', 'parties'),
  etreVerb('arriver', 'arrivé', 'arrivée', 'arrivés', 'arrivées'),
  etreVerb('tomber', 'tombé', 'tombée', 'tombés', 'tombées'),
  etreVerb('monter', 'monté', 'montée', 'montés', 'montées'),
  etreVerb('descendre', 'descendu', 'descendue', 'descendus', 'descendues'),
  etreVerb('rentrer', 'rentré', 'rentrée', 'rentrés', 'rentrées'),
  etreVerb('sortir', 'sorti', 'sortie', 'sortis', 'sorties'),
  etreVerb('venir', 'venu', 'venue', 'venus', 'venues'),
  etreVerb('rester', 'resté', 'restée', 'restés', 'restées'),
  etreVerb('retourner', 'retourné', 'retournée', 'retournés', 'retournées'),
];

export function etreForm(verb: EtreVerb, gender: Gender, number: GrammaticalNumber): string {
  if (gender === 'm') return number === 'singulier' ? verb.masculineSingular : verb.masculinePlural;
  return number === 'singulier' ? verb.feminineSingular : verb.femininePlural;
}

export interface EtreSubject {
  text: string;
  gender: Gender;
  number: GrammaticalNumber;
}

export const ETRE_SUBJECTS: EtreSubject[] = [
  { text: 'Léa', gender: 'f', number: 'singulier' },
  { text: 'Marion', gender: 'f', number: 'singulier' },
  { text: 'Camille', gender: 'f', number: 'singulier' },
  { text: 'Elle', gender: 'f', number: 'singulier' },
  { text: 'Paul', gender: 'm', number: 'singulier' },
  { text: 'Tom', gender: 'm', number: 'singulier' },
  { text: 'Sami', gender: 'm', number: 'singulier' },
  { text: 'Il', gender: 'm', number: 'singulier' },
  { text: 'Les filles', gender: 'f', number: 'pluriel' },
  { text: 'Elles', gender: 'f', number: 'pluriel' },
  { text: 'Mes cousines', gender: 'f', number: 'pluriel' },
  { text: 'Les garçons', gender: 'm', number: 'pluriel' },
  { text: 'Ils', gender: 'm', number: 'pluriel' },
  { text: 'Mes cousins', gender: 'm', number: 'pluriel' },
];
