import { polar, round, type Figure, type Point, type Shape } from '../lib/figures';
import { nb } from './mathsCycle4';

/**
 * Les dessins des maths du collège, décrits comme des données, à la façon de
 * figuresMaths.ts : un repère gradué où l'on lit une valeur, un diagramme
 * circulaire où chaque part porte son pourcentage, un tableau dont les nombres
 * sont écrits à la française (une virgule, jamais un point).
 *
 * Les tests relisent ces figures — les graduations, les points, la courbe, les
 * étiquettes — et vérifient qu'elles montrent ce que la question affirme.
 */

export const LARGEUR = 300;
export const HAUTEUR = 200;

const arrondi = (n: number): number => Math.round(n * 10) / 10;

// --- Le repère ---------------------------------------------------------------------------------

/**
 * Un axe : de `min` à `max`, une graduation tous les `pas`, et le nom de la
 * grandeur (« Prix (€) »). Quand les graduations sont serrées, `etiquette`
 * n'écrit un nombre que toutes les `etiquette` graduations (1 par défaut).
 */
export interface Axe {
  min: number;
  max: number;
  pas: number;
  nom: string;
  etiquette?: number;
}

/** Le cadre du repère dans la figure : les graduations sont écrites en dessous et à gauche. */
export const CADRE_DU_REPERE = { gauche: 54, droite: 286, haut: 30, bas: 158 };

/** Les graduations d'un axe, de `min` à `max` : des multiples de `pas`, sans erreur d'arrondi. */
export function graduations(axe: Axe): number[] {
  const nombre = Math.round((axe.max - axe.min) / axe.pas);
  return Array.from({ length: nombre + 1 }, (_, rang) => Number((axe.min + rang * axe.pas).toFixed(9)));
}

/** Où se pose le texte d'une graduation : sous l'axe des x, à gauche de l'axe des y. */
export const RANG_DES_GRADUATIONS = { ligneX: CADRE_DU_REPERE.bas + 15, colonneY: CADRE_DU_REPERE.gauche - 8 };

export type Trace = (px: (x: number) => number, py: (y: number) => number) => Shape[];

/**
 * Un repère quadrillé, gradué sur les deux axes, avec ce que `tracer` y
 * dessine : une droite, des points. Les axes passent par l'origine quand elle
 * est dans le cadre ; sinon ils longent le bord. Ce qu'on lit est exact : le
 * quadrillage est tracé à chaque graduation.
 */
export function repere(x: Axe, y: Axe, tracer: Trace, alt: string): Figure {
  const { gauche, droite, haut, bas } = CADRE_DU_REPERE;
  const px = (valeur: number) => arrondi(gauche + ((valeur - x.min) / (x.max - x.min)) * (droite - gauche));
  const py = (valeur: number) => arrondi(bas - ((valeur - y.min) / (y.max - y.min)) * (bas - haut));
  const shapes: Shape[] = [];
  graduations(x).forEach((valeur, rang) => {
    shapes.push({ kind: 'segment', from: [px(valeur), haut], to: [px(valeur), bas], ink: 'pale', width: 1 });
    if (rang % (x.etiquette ?? 1) === 0) shapes.push({ kind: 'text', at: [px(valeur), RANG_DES_GRADUATIONS.ligneX], text: nb(valeur), anchor: 'middle', size: 11 });
  });
  graduations(y).forEach((valeur, rang) => {
    shapes.push({ kind: 'segment', from: [gauche, py(valeur)], to: [droite, py(valeur)], ink: 'pale', width: 1 });
    if (rang % (y.etiquette ?? 1) === 0) shapes.push({ kind: 'text', at: [RANG_DES_GRADUATIONS.colonneY, py(valeur) + 4], text: nb(valeur), anchor: 'end', size: 11 });
  });
  const abscisseDeLAxe = x.min <= 0 && x.max >= 0 ? px(0) : gauche;
  const ordonneeDeLAxe = y.min <= 0 && y.max >= 0 ? py(0) : bas;
  shapes.push(
    { kind: 'segment', from: [abscisseDeLAxe, haut - 6], to: [abscisseDeLAxe, bas], width: 2.2 },
    { kind: 'segment', from: [gauche, ordonneeDeLAxe], to: [droite + 6, ordonneeDeLAxe], width: 2.2 },
    { kind: 'text', at: [gauche + 4, 14], text: y.nom, anchor: 'start', size: 12, bold: true },
    { kind: 'text', at: [droite, HAUTEUR - 6], text: x.nom, anchor: 'end', size: 12, bold: true }
  );
  shapes.push(...tracer(px, py));
  return { width: LARGEUR, height: HAUTEUR, shapes, alt };
}

/** Un point du repère, posé en (x ; y). */
export const pointDuRepere = (px: (x: number) => number, py: (y: number) => number, x: number, y: number): Shape => ({
  kind: 'circle',
  center: [px(x), py(y)],
  radius: 3.6,
  ink: 'couleur',
  fill: true,
});

/** Une droite d'équation y = a·x + b, tracée de l'abscisse `de` à l'abscisse `a`. */
export const droiteDuRepere = (px: (x: number) => number, py: (y: number) => number, pente: number, ordonnee: number, de: number, jusqua: number): Shape => ({
  kind: 'segment',
  from: [px(de), py(pente * de + ordonnee)],
  to: [px(jusqua), py(pente * jusqua + ordonnee)],
  ink: 'couleur',
  width: 2.6,
});

// --- Le diagramme circulaire ---------------------------------------------------------------------

const CENTRE_DU_DISQUE: Point = [150, 100];
const RAYON_DU_DISQUE = 50;

/** Les angles d'un diagramme circulaire : la part de 100 % occupe 360°, on part du haut et l'on tourne dans le sens des aiguilles d'une montre. */
export function anglesDuDiagramme(pourcentages: number[]): { debut: number; fin: number }[] {
  let cumul = 0;
  return pourcentages.map((pourcentage) => {
    const debut = 90 - cumul * 3.6;
    cumul += pourcentage;
    return { debut, fin: 90 - cumul * 3.6 };
  });
}

/**
 * Un diagramme circulaire : un disque partagé en parts proportionnelles aux
 * pourcentages, chaque part étiquetée de son nom et de son pourcentage
 * (« Foot 25 % »).
 */
export function diagrammeCirculaire(parts: [string, number][], alt: string): Figure {
  const angles = anglesDuDiagramme(parts.map(([, pourcentage]) => pourcentage));
  const shapes: Shape[] = [{ kind: 'circle', center: CENTRE_DU_DISQUE, radius: RAYON_DU_DISQUE }];
  angles.forEach(({ debut }) => shapes.push({ kind: 'segment', from: CENTRE_DU_DISQUE, to: round(polar(CENTRE_DU_DISQUE, RAYON_DU_DISQUE, debut)), width: 2 }));
  parts.forEach(([nom, pourcentage], rang) => {
    const milieu = (angles[rang].debut + angles[rang].fin) / 2;
    const [ex, ey] = round(polar(CENTRE_DU_DISQUE, RAYON_DU_DISQUE + 9, milieu));
    const cosinus = Math.cos((milieu * Math.PI) / 180);
    shapes.push({ kind: 'text', at: [ex, ey + 4], text: `${nom} ${nb(pourcentage)} %`, anchor: cosinus > 0.25 ? 'start' : cosinus < -0.25 ? 'end' : 'middle', size: 12, bold: true });
  });
  return { width: LARGEUR, height: HAUTEUR, shapes, alt };
}

// --- Un tableau de valeurs, écrit à la française -------------------------------------------------------

/**
 * Un tableau de valeurs, une ligne par grandeur : son nom, puis ses valeurs,
 * écrites telles quelles (« 3,40 »). Une valeur `null` est écrite « ? ».
 */
export function tableauDeValeurs(lignes: [string, (string | null)[]][], alt: string): Figure {
  const [gauche, droite, haut, hauteur, premiere] = [14, 286, 10, 32, 112];
  const colonnes = lignes[0][1].length;
  const largeur = (droite - gauche - premiere) / colonnes;
  const bas = haut + lignes.length * hauteur;
  const x = (colonne: number) => arrondi(gauche + premiere + largeur * colonne);
  const shapes: Shape[] = [{ kind: 'polygon', points: [[gauche, haut], [droite, haut], [droite, bas], [gauche, bas]] }];
  for (let rang = 1; rang < lignes.length; rang++) shapes.push({ kind: 'segment', from: [gauche, haut + rang * hauteur], to: [droite, haut + rang * hauteur], width: 2 });
  for (let colonne = 0; colonne < colonnes; colonne++) shapes.push({ kind: 'segment', from: [x(colonne), haut], to: [x(colonne), bas], width: 2 });
  lignes.forEach(([nom, valeurs], rang) => {
    const y = haut + rang * hauteur + 21;
    shapes.push({ kind: 'text', at: [gauche + 8, y], text: nom, bold: true, size: 13 });
    valeurs.forEach((valeur, colonne) =>
      shapes.push({ kind: 'text', at: [(x(colonne) + x(colonne + 1)) / 2, y], text: valeur === null ? '?' : valeur, anchor: 'middle', size: 15, bold: valeur === null, ink: valeur === null ? 'couleur' : 'encre' })
    );
  });
  return { width: LARGEUR, height: bas + 10, shapes, alt };
}
