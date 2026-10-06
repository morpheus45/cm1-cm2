import { formatFrenchNumber } from '../lib/classProblems';
import type { Figure } from '../lib/figures';
import type { Domain, Level, Question } from '../types';
import { availableAt, type Stage, type Staged } from '../lib/progression';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';

/**
 * Ce que partagent les maths du CE1, du CE2 et de la 6e : une question est
 * fabriquée par une « brique » — une sorte de question, avec sa règle de
 * fabrication et l'étape de la scolarité où elle devient abordable
 * (`minStage`, voir src/lib/progression.ts) — puis ses propositions sont
 * composées : la bonne réponse, et trois erreurs d'élève plausibles.
 *
 * Le CM1 et le CM2 gardent leurs propres générateurs, que rien de ceci ne
 * touche (voir empreintesCM.test.ts).
 */

/** Les niveaux dont les questions de maths sont fabriquées par des briques. */
export const NIVEAUX_A_BRIQUES: Level[] = ['CE1', 'CE2', '6e'];

/** Un énoncé fabriqué, avant la composition des propositions. */
export interface Enonce {
  /** Ce qui distingue deux questions de la même sorte : une séance ne pose
   *  jamais deux fois la même. Par défaut, l'énoncé lui-même. */
  detail?: string;
  instruction: string;
  prompt: string;
  /** La bonne réponse, écrite comme elle sera proposée. */
  correct: string;
  /** Des erreurs d'élève plausibles : on en garde trois, tirées au sort. Une
   *  erreur qui vaut la bonne réponse, ou qui la répète, est écartée. */
  wrong: string[];
  /** Le nombre de propositions : quatre, sauf pour « < », « > », « = ». */
  howMany?: number;
  explanation?: string;
  figure?: Figure;
}

export interface Brique extends Staged {
  name: string;
  make: (rng: Rng, stage: Stage) => Enonce;
}

/** L'écriture d'une proposition : un entier (« 15 »), un décimal (« 1,5 »), ou
 *  autre chose (une fraction, une unité, une phrase). */
const ecriture = (texte: string) => (/^\d+,\d+$/.test(texte) ? 'décimal' : /^\d+$/.test(texte) ? 'entier' : 'autre');

/**
 * Les propositions : la bonne réponse et des erreurs, mélangées, sans
 * doublon. La bonne réponse n'est jamais seule de son écriture : un décimal
 * parmi trois entiers (« 1,5 » parmi « 15 », « 150 », « 15000 ») se verrait
 * tout de suite. Au moins une des mauvaises réponses lui ressemble, quand les
 * erreurs connues le permettent.
 */
export function composer(rng: Rng, correct: string, wrong: string[], howMany = 4): { choices: string[]; correctIndex: number } {
  const distincts = rngShuffle(rng, [...new Set(wrong)].filter((entry) => entry !== correct));
  let kept = distincts.slice(0, howMany - 1);
  const classe = ecriture(correct);
  if (classe !== 'autre' && kept.length > 0 && !kept.some((entry) => ecriture(entry) === classe)) {
    const pareille = distincts.slice(howMany - 1).find((entry) => ecriture(entry) === classe);
    if (pareille !== undefined) kept = [...kept.slice(0, -1), pareille];
  }
  const choices = rngShuffle(rng, [correct, ...kept]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

/** `n` éléments pris à tour de rôle dans la liste. */
function cycle<T>(list: T[], n: number): T[] {
  return list.length === 0 ? [] : Array.from({ length: n }, (_, index) => list[index % list.length]);
}

/**
 * Quelle part d'une séance porte sur ce que le trimestre apporte de nouveau :
 * la moitié quand il y a de quoi la remplir, moins quand une seule brique est
 * nouvelle — une séance ne doit pas se résumer à une seule sorte de question.
 */
function partDesNouveautes(nouvelles: number): number {
  return Math.min(1 / 2, nouvelles / 6);
}

const identifiant = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

/**
 * Les questions d'une séance : la part du trimestre pour ce qu'il apporte de
 * nouveau, le reste en révision de tout ce qui est déjà enseigné dans le
 * cycle, jamais deux fois la même question. Sans brique enseignée à cette
 * étape, aucune question plutôt qu'un plantage.
 */
export function fabriquer(domain: Domain, briques: Brique[], stage: Stage, rng: Rng, count: number): Question[] {
  const disponibles = availableAt(briques, stage);
  if (disponibles.length === 0) return [];
  const recentes = disponibles.filter((brique) => brique.minStage === stage);
  const fromRecent = Math.ceil(count * partDesNouveautes(recentes.length));
  const picked = rngShuffle(rng, [
    ...cycle(rngShuffle(rng, recentes), fromRecent),
    ...cycle(rngShuffle(rng, disponibles), count - fromRecent),
  ]);
  const seen = new Set<string>();
  return picked.map((brique, index) => {
    let made = brique.make(rng, stage);
    const key = (enonce: Enonce) => `${brique.name}§${enonce.detail ?? enonce.prompt}`;
    for (let attempt = 0; attempt < 6 && seen.has(key(made)); attempt++) made = brique.make(rng, stage);
    seen.add(key(made));
    const { choices, correctIndex } = composer(rng, made.correct, made.wrong, made.howMany);
    return {
      id: `${domain}-${brique.name}-${index}-${identifiant(made.detail ?? made.prompt)}`,
      domain,
      instruction: made.instruction,
      prompt: made.prompt,
      ...(made.figure ? { figure: made.figure } : {}),
      choices,
      correctIndex,
      ...(made.explanation ? { explanation: made.explanation } : {}),
    };
  });
}

// --- Des nombres et des erreurs --------------------------------------------------------

/** Les chiffres d'un entier, du plus fort au plus faible. */
export const chiffres = (n: number): number[] => String(n).split('').map(Number);

/** Deux chiffres voisins échangés : l'erreur de lecture la plus courante.
 *  Jamais de zéro devant. */
export function echanges(n: number): number[] {
  const digits = String(n).split('');
  const results: number[] = [];
  for (let position = 0; position < digits.length - 1; position++) {
    if (digits[position] === digits[position + 1]) continue;
    const copy = [...digits];
    [copy[position], copy[position + 1]] = [copy[position + 1], copy[position]];
    if (copy[0] !== '0') results.push(Number(copy.join('')));
  }
  return results;
}

/**
 * Des nombres faux autour d'un résultat : les erreurs que l'on connaît d'abord
 * (`candidats`), puis, s'il n'y en a pas trois, les voisins du résultat. Rien
 * d'égal à `correct`, de négatif (sous `min`), de trop grand (au-delà de `max`, le
 * plafond des nombres du niveau) ni de trop précis : un candidat
 * qui demande plus de `decimales` chiffres après la virgule est écarté, pas
 * arrondi — arrondi, il ne ressemblerait plus à l'erreur qu'il décrit.
 */
export function fauxNombres(
  correct: number,
  candidats: number[],
  { min = 0, max = Infinity, decimales = 0 }: { min?: number; max?: number; decimales?: number } = {}
): number[] {
  const echelle = Math.pow(10, decimales);
  const exact = (value: number) => Math.abs(value * echelle - Math.round(value * echelle)) < 1e-7;
  const valable = (value: number) => Number.isFinite(value) && value >= min && value <= max && exact(value) && Math.round(value * echelle) / echelle !== correct;
  const retenus = [...new Set(candidats.filter(valable).map((value) => Math.round(value * echelle) / echelle))];
  for (let step = 1; retenus.length < 3 && step < 40; step++) {
    [correct + step / echelle, correct - step / echelle].forEach((value) => {
      const rounded = Math.round(value * echelle) / echelle;
      if (valable(rounded) && !retenus.includes(rounded)) retenus.push(rounded);
    });
  }
  return retenus;
}

/** Un nombre entier tiré dans un intervalle, avec une chance sur `un_sur` de
 *  tomber sur un des `bords` — là où les élèves se trompent. */
export function entierAvecBords(rng: Rng, min: number, max: number, bords: number[], unSur = 3): number {
  const valables = bords.filter((value) => value >= min && value <= max);
  return valables.length > 0 && rngInt(rng, 1, unSur) === 1 ? rngPick(rng, valables) : rngInt(rng, min, max);
}

/** Un nombre écrit à la française : entier tel quel, décimal à la virgule. */
export const texte = (n: number): string => (Number.isInteger(n) ? String(n) : formatFrenchNumber(n));

/** Le nombre de chiffres après la virgule (trois au plus, comme au programme
 *  de la 6e). */
export function decimalesDe(n: number): number {
  for (let decimales = 0; decimales < 3; decimales++) {
    if (Math.abs(n * Math.pow(10, decimales) - Math.round(n * Math.pow(10, decimales))) < 1e-9) return decimales;
  }
  return 3;
}

/** Un décimal à `decimales` chiffres après la virgule, le dernier jamais nul :
 *  « 3,50 » ne serait qu'un « 3,5 » écrit autrement. */
export function decimalAleatoire(rng: Rng, entierMin: number, entierMax: number, decimales: number): number {
  const echelle = Math.pow(10, decimales);
  let fraction = rngInt(rng, 1, echelle - 1);
  while (fraction % 10 === 0) fraction = rngInt(rng, 1, echelle - 1);
  return (rngInt(rng, entierMin, entierMax) * echelle + fraction) / echelle;
}

// --- Le français des énoncés -----------------------------------------------------------------

export interface Prenom {
  nom: string;
  fille: boolean;
}

/** Des prénoms de filles et de garçons, pour que le pronom suive. */
export const PRENOMS: Prenom[] = [
  { nom: 'Léa', fille: true },
  { nom: 'Tom', fille: false },
  { nom: 'Inès', fille: true },
  { nom: 'Hugo', fille: false },
  { nom: 'Zoé', fille: true },
  { nom: 'Noé', fille: false },
  { nom: 'Jade', fille: true },
  { nom: 'Lucas', fille: false },
  { nom: 'Emma', fille: true },
  { nom: 'Nathan', fille: false },
  { nom: 'Manon', fille: true },
  { nom: 'Louis', fille: false },
  { nom: 'Chloé', fille: true },
  { nom: 'Adam', fille: false },
  { nom: 'Lina', fille: true },
  { nom: 'Yanis', fille: false },
  { nom: 'Clara', fille: true },
  { nom: 'Théo', fille: false },
  { nom: 'Anna', fille: true },
  { nom: 'Rayan', fille: false },
  { nom: 'Sofia', fille: true },
  { nom: 'Maël', fille: false },
  { nom: 'Eva', fille: true },
  { nom: 'Enzo', fille: false },
];

/** Deux prénoms différents. */
export function deuxPrenoms(rng: Rng): [Prenom, Prenom] {
  const first = rngPick(rng, PRENOMS);
  let second = rngPick(rng, PRENOMS);
  while (second.nom === first.nom) second = rngPick(rng, PRENOMS);
  return [first, second];
}

export const il = (personne: Prenom) => (personne.fille ? 'Elle' : 'Il');
export const pronom = (personne: Prenom) => (personne.fille ? 'elle' : 'il');

/** « de billes », « d'oranges » : l'élision, comme à l'écrit. Aucun nom à
 *  « h » aspiré dans les listes. */
export const de = (nom: string) => (/^[aeiouyéèêàâîôûœh]/i.test(nom) ? `d'${nom}` : `de ${nom}`);

/** « que Tom », « qu'Anna » : l'élision devant un prénom qui commence par une voyelle (le h aspiré de « Hugo »
 *  n'élide pas). */
export const que = (nom: string) => (/^[aeiouyéèêàâîôûœ]/i.test(nom) ? `qu'${nom}` : `que ${nom}`);

/** « 1 jour », « 2 jours » : le pluriel dès 2, comme à l'école (0 et 1 restent au singulier). */
export const accorde = (n: number, mot: string) => (n > 1 ? `${mot}s` : mot);

export const majuscule = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Des choses qu'on compte, au pluriel : « 12 billes ». */
export const OBJETS = [
  'billes',
  'cartes',
  'images',
  'autocollants',
  'timbres',
  'crayons',
  'bonbons',
  'pommes',
  'gâteaux',
  'livres',
  'jetons',
  'perles',
  'coquillages',
  'ballons',
  'stylos',
  'cahiers',
  'biscuits',
  'poissons',
  'feutres',
  'œufs',
];

/** Des contenants : « un sac de 4 billes », « 3 sacs ». */
export interface Contenant {
  un: string;
  pluriel: string;
  objets: string;
}

export const CONTENANTS: Contenant[] = [
  { un: 'un sac', pluriel: 'sacs', objets: 'billes' },
  { un: 'une boîte', pluriel: 'boîtes', objets: 'crayons' },
  { un: 'un paquet', pluriel: 'paquets', objets: 'gâteaux' },
  { un: 'un panier', pluriel: 'paniers', objets: 'pommes' },
  { un: 'une barquette', pluriel: 'barquettes', objets: 'fraises' },
  { un: 'une pochette', pluriel: 'pochettes', objets: 'autocollants' },
  { un: 'un étui', pluriel: 'étuis', objets: 'feutres' },
  { un: 'un filet', pluriel: 'filets', objets: 'oranges' },
  { un: 'une boîte', pluriel: 'boîtes', objets: 'biscuits' },
  { un: 'un sachet', pluriel: 'sachets', objets: 'bonbons' },
];
