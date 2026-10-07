import type { Stage } from '../lib/progression';
import { rngInt, type Rng } from '../lib/seededRandom';
import { ecritureChiffree } from './nombresEnLettres';
import { fauxNombres, type Brique, type Enonce } from './mathsCommun';

/**
 * Ce que partagent les maths de la 5e, de la 4e et de la 3e (le cycle 4) :
 * l'écriture des nombres relatifs, des puissances et des fractions, comme on
 * l'écrit en France — la virgule décimale, le vrai signe moins, les espaces
 * entre les classes —, et quelques calculs exacts sur les fractions, pour que
 * les bonnes réponses ne souffrent d'aucune erreur d'arrondi.
 *
 * L'écran n'affiche que du texte : ni LaTeX ni HTML. Les puissances s'écrivent
 * donc avec les exposants Unicode (2⁵, 10⁻³), les fractions avec une barre
 * oblique (3/4), les racines avec « √ », comme le font déjà les unités (m², cm³).
 *
 * Les étapes du cycle 4 (src/lib/progression.ts) : 5e = 10, 11, 12 ; 4e = 13,
 * 14, 15 ; 3e = 16, 17, 18, un trimestre chacune.
 */

/** Le signe moins des maths (U+2212), jamais le trait d'union du clavier : « −3 », « 5 − 2 ». */
export const MOINS = '−';

export const brique = (name: string, minStage: Stage, make: (rng: Rng, stage: Stage) => Enonce): Brique => ({ name, minStage, make });

// --- Écrire les nombres ------------------------------------------------------------------------------------------

/**
 * Un nombre écrit à la française : le signe moins, la virgule décimale, une
 * espace insécable entre les classes des entiers de quatre chiffres et plus
 * (« −1 250,5 »). Neuf décimales au plus, le dernier chiffre jamais nul.
 */
export function nb(n: number): string {
  const absolu = Math.abs(Number(n.toFixed(9)));
  const [entier, decimales = ''] = absolu.toFixed(9).replace(/\.?0+$/, '').split('.');
  const ecrit = `${ecritureChiffree(Number(entier))}${decimales ? `,${decimales}` : ''}`;
  return absolu === 0 ? '0' : `${n < 0 ? MOINS : ''}${ecrit}`;
}

/** Un nombre avec exactement `decimales` chiffres après la virgule : 3 → « 3,00 ». */
export function fixe(n: number, decimales: number): string {
  const absolu = Math.abs(n).toFixed(decimales).replace('.', ',');
  const [entier, apres] = absolu.split(',');
  const ecrit = `${ecritureChiffree(Number(entier))}${apres === undefined ? '' : `,${apres}`}`;
  return Number(absolu.replace(',', '.')) === 0 ? ecrit : `${n < 0 ? MOINS : ''}${ecrit}`;
}

/** Un nombre dans une expression : un nombre négatif prend ses parenthèses — « (−3) », « 4 ». */
export const entre = (n: number): string => (n < 0 ? `(${nb(n)})` : nb(n));

const EXPOSANTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Un entier en exposant : 5 → « ⁵ », −3 → « ⁻³ ». */
export const sup = (n: number): string => String(n).replace('-', '⁻').replace(/\d/g, (chiffre) => EXPOSANTS[Number(chiffre)]);

/** Une puissance : « 2⁵ », « 10⁻³ ». */
export const puissance = (base: number | string, exposant: number): string => `${typeof base === 'number' ? nb(base) : base}${sup(exposant)}`;

/** Une puissance dont la base est négative s'écrit entre parenthèses : « (−2)³ ». */
export const puissanceDe = (base: number, exposant: number): string => `${entre(base)}${sup(exposant)}`;

// --- Les fractions, en nombres entiers -----------------------------------------------------------------------

export const pgcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : pgcd(b, a % b));
export const ppcm = (a: number, b: number): number => (a / pgcd(a, b)) * b;

/** Un nombre rationnel : numérateur et dénominateur entiers, le dénominateur positif, sous forme irréductible. */
export interface Rat {
  n: number;
  d: number;
}

export function rat(n: number, d = 1): Rat {
  if (d === 0) throw new Error('Dénominateur nul');
  const g = pgcd(n, d) || 1;
  return d < 0 ? { n: -n / g, d: -d / g } : { n: n / g, d: d / g };
}

export const plus = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const moins = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const fois = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
export const surRat = (a: Rat, b: Rat): Rat => rat(a.n * b.d, a.d * b.n);
export const egaux = (a: Rat, b: Rat): boolean => a.n === b.n && a.d === b.d;
export const valeur = (a: Rat): number => a.n / a.d;

/** « 3/4 », « −3/4 », « 5 » : une fraction écrite, ou l'entier qu'elle vaut. */
export const texteRat = (a: Rat): string => (a.d === 1 ? nb(a.n) : `${a.n < 0 ? MOINS : ''}${Math.abs(a.n)}/${a.d}`);

/** Une fraction telle qu'on la donne, non simplifiée : « 6/8 ». */
export const fraction = (n: number, d: number): string => `${n < 0 ? MOINS : ''}${Math.abs(n)}/${d}`;

/** Une fraction dans une expression : « (−3/4) » si elle est négative. */
export const fractionEntre = (n: number, d: number): string => (n < 0 ? `(${fraction(n, d)})` : fraction(n, d));

// --- Des nombres au hasard, et des erreurs d'élève ---------------------------------------------------------------

/** Un entier relatif non nul de −max à max, pas plus de fois positif que négatif sur la durée. */
export function relatif(rng: Rng, max: number, min = 1): number {
  const absolu = rngInt(rng, min, max);
  return rng() < 0.5 ? -absolu : absolu;
}

/** Un décimal à une décimale, jamais entier : 2,5 ; 12,3. */
export function dixieme(rng: Rng, max: number): number {
  const entier = rngInt(rng, 0, max);
  const chiffre = rngInt(rng, 1, 9);
  return (entier * 10 + chiffre) / 10;
}

/**
 * Des erreurs d'élève, écrites, autour d'un résultat entier ou décimal : les
 * candidats connus d'abord, puis les nombres voisins s'il en faut trois. Un
 * relatif n'est pas un nombre « faux » parce qu'il est négatif : le plancher est
 * bas.
 */
export function faux(correct: number, candidats: number[], options: { min?: number; max?: number; decimales?: number } = {}): string[] {
  return fauxEcrits(correct, candidats, nb, options);
}

/** Les mêmes erreurs, écrites comme on veut : avec leur unité (« 12,50 € »), en pourcentage, en fraction. */
export function fauxEcrits(correct: number, candidats: number[], ecrire: (n: number) => string, options: { min?: number; max?: number; decimales?: number } = {}): string[] {
  // 0,2 et 0,20000000000000018 sont le même nombre pour l'élève : on nettoie avant de comparer.
  const net = (n: number) => Number(n.toFixed(9));
  return fauxNombres(net(correct), candidats.map(net), { min: -1e9, ...options }).map(ecrire);
}

/** Les propositions « <, >, = » d'une comparaison : la bonne, et les deux autres. */
export const SIGNES = ['<', '>', '='];

export const autres = (bonne: string): string[] => SIGNES.filter((signe) => signe !== bonne);

/** Les lettres des inconnues d'une expression : x en tête, comme à l'école. */
export const INCONNUES = ['x', 'x', 'x', 'a', 'n', 't', 'y'];

/** « 3x », « −x », « x » : un terme en x, avec son coefficient. */
export function terme(coefficient: number, lettre: string, exposant = 1): string {
  const variable = exposant === 1 ? lettre : `${lettre}${sup(exposant)}`;
  if (coefficient === 1) return variable;
  if (coefficient === -1) return `${MOINS}${variable}`;
  return `${nb(coefficient)}${variable}`;
}

/** Une somme de termes, écrite avec ses signes : « 3x − 5 », « −x + 2 ». Les termes nuls disparaissent ; une somme vide vaut 0. */
export function somme(termes: { coefficient: number; lettre?: string; exposant?: number }[]): string {
  const ecrits = termes
    .filter(({ coefficient }) => coefficient !== 0)
    .map(({ coefficient, lettre, exposant }) => ({ negatif: coefficient < 0, texte: lettre ? terme(Math.abs(coefficient), lettre, exposant ?? 1) : nb(Math.abs(coefficient)) }));
  if (ecrits.length === 0) return '0';
  return ecrits.reduce((texte, { negatif, texte: morceau }, index) => (index === 0 ? `${negatif ? MOINS : ''}${morceau}` : `${texte} ${negatif ? MOINS : '+'} ${morceau}`), '');
}

export type { Brique, Enonce };
