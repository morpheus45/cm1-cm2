import type { Staged } from '../lib/progression';

export type Gender = 'm' | 'f';
export type GrammaticalNumber = 'singulier' | 'pluriel';

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
}

/** Pluriels réguliers, dès le premier trimestre. */
const REGULAR_NOUNS: [string, string, Gender][] = [
  ['jardin', 'jardins', 'm'],
  ['chien', 'chiens', 'm'],
  ['dessin', 'dessins', 'm'],
  ['cartable', 'cartables', 'm'],
  ['ballon', 'ballons', 'm'],
  ['vélo', 'vélos', 'm'],
  ['stylo', 'stylos', 'm'],
  ['cahier', 'cahiers', 'm'],
  ['sac', 'sacs', 'm'],
  ['crayon', 'crayons', 'm'],
  ['livre', 'livres', 'm'],
  ['classeur', 'classeurs', 'm'],
  ['garçon', 'garçons', 'm'],
  ['voisin', 'voisins', 'm'],
  ['ami', 'amis', 'm'],
  ['maison', 'maisons', 'f'],
  ['fille', 'filles', 'f'],
  ['table', 'tables', 'f'],
  ['fleur', 'fleurs', 'f'],
  ['feuille', 'feuilles', 'f'],
  ['cuillère', 'cuillères', 'f'],
  ['image', 'images', 'f'],
  ['écharpe', 'écharpes', 'f'],
  ['chaise', 'chaises', 'f'],
  ['lampe', 'lampes', 'f'],
  ['pomme', 'pommes', 'f'],
  ['tarte', 'tartes', 'f'],
  ['voiture', 'voitures', 'f'],
  ['école', 'écoles', 'f'],
  ['salade', 'salades', 'f'],
];

/**
 * Pluriels irréguliers en -eau/-al : ils arrivent au 3e trimestre du CM1,
 * comme le montre le test `keeps irregular plurals for the third trimester`.
 */
const IRREGULAR_NOUNS: [string, string, Gender][] = [
  ['tableau', 'tableaux', 'm'],
  ['bateau', 'bateaux', 'm'],
  ['chapeau', 'chapeaux', 'm'],
  ['gâteau', 'gâteaux', 'm'],
  ['journal', 'journaux', 'm'],
  ['cheval', 'chevaux', 'm'],
  ['animal', 'animaux', 'm'],
  ['hôpital', 'hôpitaux', 'm'],
];

export const NOUNS: Noun[] = [
  ...REGULAR_NOUNS.map(([singular, plural, gender]) => ({ minStage: 1 as const, singular, plural, gender })),
  ...IRREGULAR_NOUNS.map(([singular, plural, gender]) => ({ minStage: 3 as const, singular, plural, gender })),
];

export interface Adjective extends Staged {
  masculineSingular: string;
  feminineSingular: string;
  masculinePlural: string;
  femininePlural: string;
}

function adj(minStage: Adjective['minStage'], ms: string, fs: string, mp: string, fp: string): Adjective {
  return { minStage, masculineSingular: ms, feminineSingular: fs, masculinePlural: mp, femininePlural: fp };
}

/** L'accord en genre : au programme à partir du 2e trimestre du CM1. */
export const ADJECTIVES: Adjective[] = [
  adj(1, 'petit', 'petite', 'petits', 'petites'),
  adj(1, 'grand', 'grande', 'grands', 'grandes'),
  adj(1, 'joli', 'jolie', 'jolis', 'jolies'),
  adj(1, 'gentil', 'gentille', 'gentils', 'gentilles'),
  adj(1, 'heureux', 'heureuse', 'heureux', 'heureuses'),
  adj(1, 'mauvais', 'mauvaise', 'mauvais', 'mauvaises'),
  adj(1, 'long', 'longue', 'longs', 'longues'),
  adj(1, 'léger', 'légère', 'légers', 'légères'),
  adj(1, 'premier', 'première', 'premiers', 'premières'),
  adj(1, 'agréable', 'agréable', 'agréables', 'agréables'),
  adj(1, 'rapide', 'rapide', 'rapides', 'rapides'),
  adj(1, 'fort', 'forte', 'forts', 'fortes'),
  adj(1, 'doux', 'douce', 'doux', 'douces'),
  adj(1, 'frais', 'fraîche', 'frais', 'fraîches'),
  adj(1, 'bon', 'bonne', 'bons', 'bonnes'),
  // Irréguliers, avec les pluriels en -eau/-al du 3e trimestre.
  adj(3, 'beau', 'belle', 'beaux', 'belles'),
  adj(3, 'vieux', 'vieille', 'vieux', 'vieilles'),
  adj(3, 'nouveau', 'nouvelle', 'nouveaux', 'nouvelles'),
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
