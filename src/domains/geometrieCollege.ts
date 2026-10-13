import type { Figure, Point, Shape } from '../lib/figures';
import { pointDuRepere, repere, type Trace } from './figuresCycle4';
import { rngShuffle, type Rng } from '../lib/seededRandom';
import { LETTRES } from './geometrieDessins';
import { fauxEcrits, nb } from './mathsCycle4';
import { choose } from './geometrieCommun';

/**
 * Ce que partagent les questions de géométrie de la 5e, de la 4e et de la
 * 3e : les consignes, l'écriture d'une mesure, d'un point et de ses
 * coordonnées, et la composition d'une question.
 *
 * Les coordonnées s'écrivent « (3 ; −2) » : le point-virgule sépare les deux
 * nombres, comme en France où la virgule est déjà celle des décimaux. C'est le
 * seul endroit où l'application emploie un point-virgule (lisibilite.test.ts).
 */

export const INSTRUCTION = 'Lis bien, puis choisis la bonne réponse';
export const INSTRUCTION_FIGURE = 'Regarde bien la figure, puis choisis la bonne réponse';

/** 65° : le degré se colle au nombre, comme dans les manuels. */
export const degres = (n: number): string => `${nb(n)}°`;
export const cm = (n: number): string => `${nb(n)} cm`;
export const cm2 = (n: number): string => `${nb(n)} cm²`;
export const cm3 = (n: number): string => `${nb(n)} cm³`;

/** Les coordonnées d'un point : (3 ; −2). */
export const coordonnees = (x: number, y: number): string => `(${nb(x)} ; ${nb(y)})`;

/** Des mesures fausses autour d'une bonne réponse, écrites avec leur unité : jamais la bonne, au moins trois. */
export const fauxMesures = (correct: number, candidats: number[], ecrire: (n: number) => string, options: { min?: number; max?: number; decimales?: number } = {}): string[] =>
  fauxEcrits(correct, candidats, ecrire, { min: 0.1, ...options });

/** Une question prête à servir : ses choix sont composés, le détail la distingue d'une autre de la même sorte. */
export function question(
  rng: Rng,
  { detail, instruction, prompt, figure, correct, wrong, explanation }: { detail: string; instruction: string; prompt: string; figure?: Figure; correct: string; wrong: string[]; explanation: string }
) {
  const { choices, correctIndex } = choose(rng, correct, wrong);
  return { detail, instruction, prompt, ...(figure ? { figure } : {}), choices, correctIndex, explanation };
}

/** « 3 ; 5 » en identifiant : des chiffres et des tirets seulement. */
export const identifiant = (...morceaux: (string | number)[]): string =>
  morceaux
    .map((morceau) => String(morceau).replace('−', 'm').replace(/[^A-Za-z0-9]+/g, '-'))
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/** Un point du repère : sa lettre et ses coordonnées. */
export interface PointDuRepere {
  lettre: string;
  x: number;
  y: number;
}

/** Des points assez écartés pour que leurs noms ne se gênent pas : deux graduations au moins sur l'un des axes entre deux points. */
export const sontEcartes = (points: { x: number; y: number }[]): boolean =>
  points.every((premier, rang) => points.slice(rang + 1).every((second) => Math.max(Math.abs(premier.x - second.x), Math.abs(premier.y - second.y)) >= 2));

/** Où poser le nom d'un point, par rapport au point : en haut à droite d'abord, puis à droite, à gauche, en dessous, au-dessus. */
const DECALAGES_DES_NOMS: Point[] = [[9, -8], [11, 4], [-9, -8], [-11, 4], [9, 16], [-9, 16], [0, -14], [0, 19], [14, -1], [-14, -1], [12, 11], [-12, 11]];

interface Boite {
  gauche: number;
  droite: number;
  haut: number;
  bas: number;
}
/** La surface que deux boîtes ont en commun. */
const recouvrement = (a: Boite, b: Boite): number => Math.max(0, Math.min(a.droite, b.droite) - Math.max(a.gauche, b.gauche)) * Math.max(0, Math.min(a.bas, b.bas) - Math.max(a.haut, b.haut));

/**
 * Les points d'un repère avec leurs noms. Chaque nom est posé à côté de son point, à la première place qui ne
 * recouvre ni un autre nom, ni un point, ni le nom d'un axe, ni les graduations : sur un repère de onze graduations,
 * deux points voisins sont à treize pixels l'un de l'autre, et le nom de l'un tomberait sur l'autre. Quand aucune
 * place n'est tout à fait libre, la moins gênée l'emporte.
 */
function pointsNommes(px: (x: number) => number, py: (y: number) => number, min: number, max: number, points: PointDuRepere[]): Shape[] {
  const [gauche, droite, haut, bas] = [px(min), px(max), py(max), py(min)];
  // Ce que les noms ne doivent pas recouvrir : le nom de l'axe vertical, les graduations, et le bord de la figure.
  const interdits: Boite[] = [
    { gauche: gauche + 3, droite: gauche + 12, haut: 3, bas: 18 },
    { gauche: gauche - 40, droite: droite + 20, haut: bas + 3, bas: bas + 19 },
    { gauche: gauche - 40, droite: gauche - 3, haut: haut - 12, bas: bas + 12 },
  ];
  const cercles: Boite[] = points.map(({ x, y }) => ({ gauche: px(x) - 4.5, droite: px(x) + 4.5, haut: py(y) - 4.5, bas: py(y) + 4.5 }));
  const poses: Boite[] = [];
  const noms = points.map(({ x, y, lettre }): Shape => {
    const demiLargeur = (lettre.length * 14 * 0.58) / 2 + 1;
    const boite = ([dx, dy]: Point): Boite => ({ gauche: px(x) + dx - demiLargeur, droite: px(x) + dx + demiLargeur, haut: py(y) + dy - 10.5, bas: py(y) + dy + 3 });
    const cout = (candidate: Boite): number =>
      [...interdits, ...cercles, ...poses].reduce((somme, autre) => somme + recouvrement(candidate, autre), 0) + (candidate.gauche > 2 && candidate.droite < 298 && candidate.haut > 2 ? 0 : 1000);
    let decalage = DECALAGES_DES_NOMS[0];
    let moindre = Infinity;
    for (const candidat of DECALAGES_DES_NOMS) {
      const gene = cout(boite(candidat));
      if (gene < moindre) [decalage, moindre] = [candidat, gene];
      if (gene === 0) break;
    }
    poses.push(boite(decalage));
    return { kind: 'text', at: [Math.round((px(x) + decalage[0]) * 10) / 10, Math.round((py(y) + decalage[1]) * 10) / 10], text: lettre, anchor: 'middle', bold: true, size: 14, halo: true };
  });
  return [...points.map(({ x, y }) => pointDuRepere(px, py, x, y)), ...noms];
}

/**
 * Un repère orthonormé, gradué de `min` à `max` sur les deux axes, où des points portent leur lettre. `plus` y
 * ajoute ce qu'il faut (une flèche, une droite).
 */
export function repereDePoints(min: number, max: number, points: PointDuRepere[], alt: string, plus?: Trace): Figure {
  const axe = (nom: string) => ({ min, max, pas: 1, nom, etiquette: max - min > 10 ? 2 : 1 });
  return repere(axe('x'), axe('y'), (px, py) => [...pointsNommes(px, py, min, max, points), ...(plus ? plus(px, py) : [])], alt, { orthonorme: true });
}

/**
 * Des lettres pour nommer les points d'une figure : jamais « E ». Une figure dont les points s'appellent D et E, ou S
 * et E, donne un texte où « DE est », « SE est » se lisent comme les mots « de » et « se » : l'élision y verrait une
 * faute. Sans « E », aucun nom de segment ni de triangle ne forme un de ces mots (de, ne, se, que, me, te, je).
 * `exclure` écarte les lettres que l'énoncé a déjà données à un autre point (le milieu M, le pied H d'une hauteur).
 */
export function lettresDeFigure(rng: Rng, n: number, exclure: string[] = []): string[] {
  return rngShuffle(rng, LETTRES.filter((lettre) => lettre !== 'E' && !exclure.includes(lettre))).slice(0, n);
}

/** Trois lettres pour nommer un triangle. */
export const lettresDeTriangle = (rng: Rng): [string, string, string] => lettresDeFigure(rng, 3) as [string, string, string];
