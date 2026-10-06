import { polar, round, type Figure, type Point, type Shape } from '../lib/figures';
import type { Stage } from '../lib/progression';
import { rngInt, rngShuffle, type Rng } from '../lib/seededRandom';
import type { Node } from '../lib/construction';
import { cuboid, fitter, FIGURE_HEIGHT, FIGURE_WIDTH, isCubeNet, polyhedronFigure, roundSolidFigure, squarePyramid, triangularPrism, type Net } from './geometrieFigures';
import { boundary } from './geometrieMesures';
import { CONSTRUCTION_FAMILIES } from './geometrieConstructions';
import type { Family } from './geometrieCommun';

/**
 * Les dessins de la géométrie du CE1, du CE2 et de la 6e : des figures dont
 * les sommets portent des lettres, des figures rangées par quatre (A, B, C,
 * D), une règle, un quadrillage de robot, des solides et des patrons.
 *
 * Chaque dessin est décrit comme une donnée — des points, des segments, des
 * textes — et construit juste : les tests le relisent comme l'élève
 * (geometrieNiveaux.test.ts).
 */

// --- Les lettres des sommets ---------------------------------------------------------------------

/** Les lettres des sommets : sans I (qui ressemble au chiffre 1) ni O (le centre d'un cercle). */
export const LETTRES = 'ABCDEFGHJKLMNPQRSTUVW'.split('');

/** `n` lettres qui se suivent, à partir d'un rang tiré au sort : « EFGH ». */
export function lettresConsecutives(rng: Rng, n: number): string[] {
  const depart = rngInt(rng, 0, LETTRES.length - n);
  return LETTRES.slice(depart, depart + n);
}

/** `n` lettres différentes, dans un ordre quelconque. */
export const lettresDistinctes = (rng: Rng, n: number): string[] => rngShuffle(rng, LETTRES).slice(0, n);

/**
 * `n` longueurs de côtés qui forment bien un polygone : le plus long est plus court que tous les autres ensemble
 * (sinon le triangle de 12 cm, 3 cm et 4 cm n'existe pas). Les dessins ne sont pas à l'échelle, mais les nombres,
 * eux, doivent être ceux d'une figure qui existe.
 */
export function longueursDePolygone(rng: Rng, n: number, min: number, max: number): number[] {
  let longueurs: number[] = [];
  for (let essai = 0; essai < 100; essai++) {
    longueurs = Array.from({ length: n }, () => rngInt(rng, min, max));
    if (2 * Math.max(...longueurs) < longueurs.reduce((somme, valeur) => somme + valeur, 0)) return longueurs;
  }
  // Des côtés presque égaux existent toujours.
  return Array.from({ length: n }, (_, index) => max - (index % 2));
}

/** Un identifiant court pour un détail trop long (une liste de carreaux, de sommets) : mêmes données, même texte. */
export function condenser(texte: string): string {
  let hache = 5381;
  for (const caractere of texte) hache = ((hache * 33) ^ caractere.charCodeAt(0)) >>> 0;
  return hache.toString(36);
}

/** Le nom d'un segment, d'un polygone : « [AB] », « ABCD ». */
export const segmentNomme = (a: string, b: string) => `[${a}${b}]`;

export const barycentre = (points: Point[]): Point => [
  points.reduce((somme, [x]) => somme + x, 0) / points.length,
  points.reduce((somme, [, y]) => somme + y, 0) / points.length,
];

/** Le nom d'un sommet, écarté de la figure du côté opposé à son centre. */
export function etiquette(point: Point, centre: Point, texte: string, ecart = 14, ink?: 'couleur'): Shape {
  const [dx, dy] = [point[0] - centre[0], point[1] - centre[1]];
  const longueur = Math.hypot(dx, dy) || 1;
  return {
    kind: 'text',
    at: round([point[0] + (dx / longueur) * ecart, point[1] + (dy / longueur) * ecart + 5]),
    text: texte,
    anchor: 'middle',
    bold: true,
    size: 14,
    halo: true,
    ...(ink ? { ink } : {}),
  };
}

/**
 * Le nom d'un point, écarté du côté opposé à `centre`. S'il sortait du cadre,
 * il passe sur le côté (perpendiculairement), puis de l'autre côté du point :
 * jamais sur le segment qui arrive au point.
 */
export function etiquetteDansLeCadre(point: Point, centre: Point, texte: string, largeur = 300, hauteur = 210, ecart = 14, ink?: 'couleur'): Shape {
  const [dx, dy] = [point[0] - centre[0], point[1] - centre[1]];
  const longueur = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / longueur, dy / longueur];
  const places: Point[] = [
    [ux, uy],
    [-uy, ux],
    [uy, -ux],
    [-ux, -uy],
  ].map(([vx, vy]) => round([point[0] + vx * ecart, point[1] + vy * ecart + 5]));
  const [x, y] = places.find(([px, py]) => px >= 10 && px <= largeur - 10 && py >= 14 && py <= hauteur - 4) ?? places[3];
  return { kind: 'text', at: [x, y], text: texte, anchor: 'middle', bold: true, size: 14, halo: true, ...(ink ? { ink } : {}) };
}

/** Un polygone dont les sommets portent leurs lettres. `marques` ajoute ce qu'il faut (codage, angles droits, longueurs). */
export function polygoneNomme(points: Point[], lettres: string[], marques: (sommets: Point[], centre: Point) => Shape[], alt: string, marge = 40): Figure {
  const placer = fitter(points, FIGURE_WIDTH, FIGURE_HEIGHT, marge);
  const sommets = points.map(placer);
  const centre = barycentre(sommets);
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: [{ kind: 'polygon', points: sommets, fill: true }, ...marques(sommets, centre), ...sommets.map((sommet, index) => etiquette(sommet, centre, lettres[index]))],
    alt,
  };
}

/** Un nombre écrit sur un côté, à l'extérieur de la figure. */
export function longueurSurLeCote(de: Point, vers: Point, centre: Point, texte: string): Shape {
  const milieu: Point = [(de[0] + vers[0]) / 2, (de[1] + vers[1]) / 2];
  const [dx, dy] = [milieu[0] - centre[0], milieu[1] - centre[1]];
  const longueur = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [dx / longueur, dy / longueur];
  // Sur un côté vertical, le texte s'écarte de sa demi-largeur : il ne touche ni le trait ni son codage.
  const demiLargeur = (texte.length * 12 * 0.56) / 2;
  const ecart = 12 + Math.abs(nx) * demiLargeur;
  return { kind: 'text', at: round([milieu[0] + nx * ecart, milieu[1] + ny * ecart + 5]), text: texte, anchor: 'middle', size: 12, bold: true, halo: true };
}

// --- Des figures rangées par quatre : A, B, C, D ---------------------------------------------------

/** Les centres des quatre cases d'une figure rangée par quatre, et leur lettre. */
export const CENTRES_DES_CASES: Point[] = [[78, 56], [222, 56], [78, 156], [222, 156]];
export const LETTRES_DES_CASES = ['A', 'B', 'C', 'D'];
const HAUTEUR_PAR_QUATRE = 208;

const lettreDeLaCase = (index: number): Shape => ({ kind: 'text', at: [CENTRES_DES_CASES[index][0] - 62, CENTRES_DES_CASES[index][1] - 32], text: LETTRES_DES_CASES[index], bold: true, size: 17 });

export type FormePlane = 'carre' | 'rectangle' | 'triangle' | 'cercle' | 'quadrilatere';

function dessinDeLaForme(forme: FormePlane, [cx, cy]: Point): Shape {
  switch (forme) {
    case 'carre':
      return { kind: 'polygon', points: [[cx - 28, cy - 28], [cx + 28, cy - 28], [cx + 28, cy + 28], [cx - 28, cy + 28]], fill: true };
    case 'rectangle':
      return { kind: 'polygon', points: [[cx - 44, cy - 24], [cx + 44, cy - 24], [cx + 44, cy + 24], [cx - 44, cy + 24]], fill: true };
    case 'triangle':
      return { kind: 'polygon', points: [[cx - 42, cy + 28], [cx + 44, cy + 28], [cx + 8, cy - 30]], fill: true };
    case 'cercle':
      return { kind: 'circle', center: [cx, cy], radius: 30 };
    case 'quadrilatere':
      return { kind: 'polygon', points: [[cx - 44, cy - 18], [cx + 38, cy - 32], [cx + 46, cy + 22], [cx - 30, cy + 32]], fill: true };
  }
}

/** Quatre figures planes, rangées par quatre et nommées A, B, C, D. */
export function formesFigure(formes: FormePlane[]): Figure {
  return {
    width: FIGURE_WIDTH,
    height: HAUTEUR_PAR_QUATRE,
    shapes: formes.flatMap((forme, index) => [dessinDeLaForme(forme, CENTRES_DES_CASES[index]), lettreDeLaCase(index)]),
    alt: 'Quatre figures, nommées A, B, C et D.',
  };
}

/** Quatre angles, rangés par quatre et nommés A, B, C, D : deux bras de même longueur, un petit arc. */
export function anglesParQuatre(tailles: number[], rotations: number[]): Figure {
  const shapes: Shape[] = [];
  tailles.forEach((taille, index) => {
    const [cx, cy] = CENTRES_DES_CASES[index];
    const [a, b]: [Point, Point] = [polar([0, 0], 46, rotations[index]), polar([0, 0], 46, rotations[index] + taille)];
    // La boîte du sommet et des deux bras est centrée dans la case.
    const [dx, dy] = [cx - (Math.min(0, a[0], b[0]) + Math.max(0, a[0], b[0])) / 2, cy - (Math.min(0, a[1], b[1]) + Math.max(0, a[1], b[1])) / 2];
    const sommet = round([dx, dy]);
    shapes.push(
      { kind: 'segment', from: sommet, to: round([a[0] + dx, a[1] + dy]), width: 3 },
      { kind: 'segment', from: sommet, to: round([b[0] + dx, b[1] + dy]), width: 3 },
      { kind: 'arc', center: sommet, radius: 14, from: rotations[index], to: rotations[index] + taille, ink: 'couleur' },
      lettreDeLaCase(index)
    );
  });
  return { width: FIGURE_WIDTH, height: HAUTEUR_PAR_QUATRE, shapes, alt: 'Quatre angles, nommés A, B, C et D.' };
}

/** Quatre triangles, rangés par quatre, chacun donné par ses trois sommets autour de l'origine. */
export function trianglesParQuatre(triangles: Point[][]): Figure {
  const shapes: Shape[] = [];
  triangles.forEach((triangle, index) => {
    const [cx, cy] = CENTRES_DES_CASES[index];
    const xs = triangle.map(([x]) => x);
    const ys = triangle.map(([, y]) => y);
    const [dx, dy] = [cx - (Math.min(...xs) + Math.max(...xs)) / 2, cy - (Math.min(...ys) + Math.max(...ys)) / 2];
    shapes.push({ kind: 'polygon', points: triangle.map(([x, y]) => round([x + dx, y + dy])), fill: true }, lettreDeLaCase(index));
  });
  return { width: FIGURE_WIDTH, height: HAUTEUR_PAR_QUATRE, shapes, alt: 'Quatre triangles, nommés A, B, C et D.' };
}

// --- Des points alignés ---------------------------------------------------------------------------------------

export interface PointNomme {
  lettre: string;
  point: Point;
}

/** Des points posés sur la feuille, chacun avec sa lettre juste à côté. */
export function pointsNommes(points: PointNomme[], alt: string): Figure {
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: points.flatMap(({ lettre, point }): Shape[] => [
      { kind: 'point', at: point },
      { kind: 'text', at: [point[0] + 10, point[1] - 8], text: lettre, anchor: 'middle', bold: true, size: 14, halo: true },
    ]),
    alt,
  };
}

/** Le point de la droite (AB) qui est à l'abscisse curviligne `t` de son milieu. */
export const surLaDroite = (milieu: Point, degres: number, t: number): Point => round(polar(milieu, t, degres));

/** Un point à `ecart` pixels au moins de la droite qui passe par `origine`, de direction `degres`. */
export function distanceALaDroite(point: Point, origine: Point, degres: number): number {
  const [ux, uy] = [Math.cos((degres * Math.PI) / 180), -Math.sin((degres * Math.PI) / 180)];
  return Math.abs((point[0] - origine[0]) * uy - (point[1] - origine[1]) * ux);
}

// --- La règle : lire une longueur ---------------------------------------------------------------------------

/** Les mêmes constantes que la règle de geometrieMesures.ts : le nom des extrémités se pose au-dessus du segment. */
const REGLE_GAUCHE = 22;
const REGLE_LARGEUR = 256;
const SEGMENT_DE_LA_REGLE_Y = 52;

/** Les noms des deux extrémités d'un segment posé sur une règle, au-dessus de lui. */
export function nomsSurLaRegle(depart: number, fin: number, centimetres: number, lettres: [string, string]): Shape[] {
  const x = (mm: number) => Math.round((REGLE_GAUCHE + (mm * REGLE_LARGEUR) / (centimetres * 10)) * 10) / 10;
  return [depart, fin].map((mm, index): Shape => ({ kind: 'text', at: [x(mm), SEGMENT_DE_LA_REGLE_Y - 14], text: lettres[index], anchor: 'middle', bold: true, size: 14, halo: true }));
}

// --- La règle : tracer un segment ------------------------------------------------------------------------------

/** La règle sur laquelle on trace : onze centimètres, un nœud à chaque graduation. */
export const REGLE_A_TRACER = { gauche: 20, cote: 24, centimetres: 11, y: 82 };

export function reglePourTracer(depart: number, lettre: string): Figure {
  const { gauche, cote, centimetres, y } = REGLE_A_TRACER;
  const x = (cm: number) => gauche + cote * cm;
  const shapes: Shape[] = [{ kind: 'polygon', points: [[8, 58], [x(centimetres) + 12, 58], [x(centimetres) + 12, 106], [8, 106]], fill: true }];
  for (let cm = 0; cm <= centimetres; cm++) {
    shapes.push({ kind: 'segment', from: [x(cm), 58], to: [x(cm), 68], width: 1.6 });
    shapes.push({ kind: 'text', at: [x(cm), 100], text: String(cm), anchor: 'middle', size: 13, bold: true });
  }
  shapes.push(
    { kind: 'segment', from: [gauche, y], to: [x(centimetres), y], ink: 'pale', width: 1 },
    { kind: 'point', at: [x(depart), y] },
    { kind: 'text', at: [x(depart), 42], text: lettre, anchor: 'middle', bold: true, size: 14, halo: true }
  );
  return { width: FIGURE_WIDTH, height: 124, shapes, alt: 'Une règle graduée en centimètres. Un point est posé sur une graduation.' };
}

// --- Le quadrillage du robot -----------------------------------------------------------------------------------------

export const ROBOT_ORIGINE: Point = [85, 30];
export const ROBOT_CASE = 32;
export const COLONNES_DU_ROBOT = ['A', 'B', 'C', 'D', 'E'];
export const LIGNES_DU_ROBOT = ['1', '2', '3', '4', '5'];

/** Un quadrillage de 5 × 5 cases, nommées par une lettre et un chiffre, et un robot dans l'une d'elles. */
export function grilleDuRobot(case_: Node): Figure {
  const shapes: Shape[] = [{ kind: 'quadrillage', origin: ROBOT_ORIGINE, cols: 5, rows: 5, cell: ROBOT_CASE }];
  COLONNES_DU_ROBOT.forEach((lettre, index) =>
    shapes.push({ kind: 'text', at: [ROBOT_ORIGINE[0] + ROBOT_CASE * index + ROBOT_CASE / 2, ROBOT_ORIGINE[1] - 8], text: lettre, anchor: 'middle', bold: true })
  );
  LIGNES_DU_ROBOT.forEach((chiffre, index) =>
    shapes.push({ kind: 'text', at: [ROBOT_ORIGINE[0] - 10, ROBOT_ORIGINE[1] + ROBOT_CASE * index + ROBOT_CASE / 2 + 6], text: chiffre, anchor: 'end', bold: true })
  );
  shapes.push({ kind: 'circle', center: [ROBOT_ORIGINE[0] + ROBOT_CASE * (case_[0] + 0.5), ROBOT_ORIGINE[1] + ROBOT_CASE * (case_[1] + 0.5)], radius: 11, ink: 'couleur', fill: true });
  return { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt: 'Un quadrillage de cinq colonnes, A à E, et cinq lignes, 1 à 5, avec un robot dans une case.' };
}

export const nomDeLaCase = ([colonne, ligne]: Node) => `${COLONNES_DU_ROBOT[colonne]}${LIGNES_DU_ROBOT[ligne]}`;

// --- Les solides ------------------------------------------------------------------------------------------------------------

export type Solide = 'cube' | 'pave' | 'pyramide' | 'prisme' | 'cylindre' | 'cone' | 'boule';

export const NOM_DU_SOLIDE: Record<Solide, string> = {
  cube: 'un cube',
  pave: 'un pavé droit',
  pyramide: 'une pyramide',
  prisme: 'un prisme',
  cylindre: 'un cylindre',
  cone: 'un cône',
  boule: 'une boule',
};

export function solideFigure(solide: Solide): Figure {
  const alt = 'Un solide, dessiné en perspective : les arêtes cachées sont en pointillés.';
  switch (solide) {
    case 'cube':
      return polyhedronFigure(cuboid(100, 100, 100), alt);
    case 'pave':
      return polyhedronFigure(cuboid(170, 80, 90), alt);
    case 'pyramide':
      return polyhedronFigure(squarePyramid(), alt);
    case 'prisme':
      return polyhedronFigure(triangularPrism(), alt);
    default:
      return roundSolidFigure(solide);
  }
}

// --- Les patrons du cube -------------------------------------------------------------------------------------------------

/** Des patrons de cube, et des assemblages de six carrés qui n'en sont pas : vérifiés un par un au chargement. */
export const PATRONS_DU_CUBE: Net[] = [
  [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [2, 0], [0, 2]],
];
export const PAS_DES_PATRONS: Net[] = [
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [2, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [2, 3]],
];

if (!PATRONS_DU_CUBE.every(isCubeNet) || PAS_DES_PATRONS.some(isCubeNet)) {
  throw new Error('Patrons de cube mal vérifiés');
}

// --- Compter des carreaux ----------------------------------------------------------------------------------------------

export const CARREAUX = { cote: 13, colonnes: 6, lignes: 6, largeurDeLaCase: 98, hauteurDuCadre: 124 };

/** Trois figures faites de carreaux, côte à côte, nommées A, B, C. */
export function carreauxParTrois(figures: Node[][]): Figure {
  const { cote, colonnes, lignes } = CARREAUX;
  const shapes: Shape[] = [];
  figures.forEach((cases, index) => {
    const origine: Point = [10 + index * 98, 30];
    const noeud = ([colonne, ligne]: Node): Point => [origine[0] + colonne * cote, origine[1] + ligne * cote];
    const morceaux: Node[][] = cases.map(([colonne, ligne]) => [[colonne, ligne], [colonne + 1, ligne], [colonne + 1, ligne + 1], [colonne, ligne + 1]]);
    shapes.push(
      { kind: 'quadrillage', origin: origine, cols: colonnes, rows: lignes, cell: cote },
      { kind: 'aire', rings: morceaux.map((morceau) => morceau.map(noeud)), ground: 'couleur', ink: 'aucune' },
      ...boundary(morceaux).map(([a, b]): Shape => ({ kind: 'segment', from: noeud(a), to: noeud(b), width: 2.5 })),
      { kind: 'text', at: [origine[0] + (colonnes * cote) / 2, 20], text: LETTRES_DES_CASES[index], anchor: 'middle', bold: true, size: 16 }
    );
  });
  return { width: FIGURE_WIDTH, height: CARREAUX.hauteurDuCadre, shapes, alt: 'Trois figures faites de carreaux, nommées A, B et C.' };
}

// --- Le cercle nommé -------------------------------------------------------------------------------------------------------

export interface CercleNomme {
  centre: Point;
  rayon: number;
}

export const CERCLE: CercleNomme = { centre: [150, 100], rayon: 68 };

/** Un point du cercle, à `degres`, avec sa lettre un peu à l'extérieur. */
export function pointDuCercle(degres: number, lettre: string): Shape[] {
  const point = round(polar(CERCLE.centre, CERCLE.rayon, degres));
  const [lx, ly] = polar(CERCLE.centre, CERCLE.rayon + 14, degres);
  return [{ kind: 'point', at: point }, { kind: 'text', at: round([lx, ly + 5]), text: lettre, anchor: 'middle', bold: true, size: 14, halo: true }];
}

export const surLeCercle = (degres: number): Point => round(polar(CERCLE.centre, CERCLE.rayon, degres));

/**
 * Une famille de constructions du CM qu'on reprend telle quelle pour un autre
 * niveau : mêmes figures, même vérification, sous un autre nom et à partir
 * d'une autre étape. `etapeDuCM` fixe ce que la construction du CM en fait
 * (des droites obliques, un axe penché) : c'est elle, et non l'étape du
 * niveau, qui règle la difficulté.
 */
export function reprendre(nom: string, minStage: Stage, nouveauNom: string, etapeDuCM: Stage): Family {
  const famille = CONSTRUCTION_FAMILIES.find((candidate) => candidate.name === nom);
  if (!famille) throw new Error(`Aucune construction nommée ${nom}`);
  return { name: nouveauNom, minStage, make: (rng) => famille.make(rng, etapeDuCM) };
}

// --- Un cercle et trois segments : diamètre, rayon, corde -------------------------------------------------------------

export interface CercleEtSegments {
  figure: Figure;
  /** Les noms des trois segments : un diamètre, un rayon, une corde qui n'est pas un diamètre. */
  diametre: string;
  rayon: string;
  corde: string;
}

/** Un diamètre [AB], un rayon [OC] et une corde [DE] qui ne passe pas par le centre : des lettres tirées au sort. */
export function cercleEtSegments(rng: Rng): CercleEtSegments {
  const [a, b, c, d, e] = lettresDistinctes(rng, 5);
  const alpha = rngInt(rng, 0, 179);
  const cote = rng() < 0.5 ? 1 : -1;
  const gamma = alpha + cote * rngInt(rng, 60, 120);
  // La corde est sur l'autre moitié du cercle, loin de C et du centre : elle ne croise aucun autre segment.
  const delta = alpha + 180 + cote * rngInt(rng, 25, 35);
  const epsilon = delta + cote * rngInt(rng, 80, 100);
  const noms = { diametre: segmentNomme(a, b), rayon: segmentNomme('O', c), corde: segmentNomme(d, e) };
  const figure: Figure = {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: [
      { kind: 'circle', center: CERCLE.centre, radius: CERCLE.rayon },
      { kind: 'segment', from: surLeCercle(alpha), to: surLeCercle(alpha + 180), width: 2.5 },
      { kind: 'segment', from: CERCLE.centre, to: surLeCercle(gamma), width: 2.5 },
      { kind: 'segment', from: surLeCercle(delta), to: surLeCercle(epsilon), width: 2.5 },
      { kind: 'point', at: CERCLE.centre },
      { kind: 'text', at: [CERCLE.centre[0] + 2, CERCLE.centre[1] + 20], text: 'O', anchor: 'middle', bold: true, size: 14, halo: true },
      ...pointDuCercle(alpha, a),
      ...pointDuCercle(alpha + 180, b),
      ...pointDuCercle(gamma, c),
      ...pointDuCercle(delta, d),
      ...pointDuCercle(epsilon, e),
    ],
    alt: `Un cercle de centre O et trois segments : ${noms.diametre}, ${noms.rayon} et ${noms.corde}.`,
  };
  return { figure, ...noms };
}

// --- Les angles ---------------------------------------------------------------------------------------------------------------

/** Un angle de sommet B, entre les demi-droites [BA) et [BC) : un arc, les trois lettres, et si on veut une demi-droite [BD) qui le partage en deux. */
export function angleNomme(degres: number, rotation: number, lettres: [string, string, string], bissectrice?: string): Figure {
  const bras = 100;
  const brutes: Point[] = [[0, 0], polar([0, 0], bras, rotation), polar([0, 0], bras, rotation + degres)];
  if (bissectrice) brutes.push(polar([0, 0], bras, rotation + degres / 2));
  const placer = fitter(brutes, FIGURE_WIDTH, FIGURE_HEIGHT, 40);
  const [sommet, a, c, d] = brutes.map(placer);
  const apres = (de: Point, vers: Point, texte: string): Shape => etiquette(vers, de, texte, 13);
  const demi = rotation + degres / 2;
  const shapes: Shape[] = [
    { kind: 'segment', from: sommet, to: a, width: 3 },
    { kind: 'segment', from: sommet, to: c, width: 3 },
    { kind: 'arc', center: sommet, radius: 24, from: rotation, to: rotation + degres, ink: 'couleur' },
    { kind: 'point', at: sommet },
    apres(sommet, a, lettres[0]),
    apres(sommet, c, lettres[2]),
    // Le sommet porte son nom du côté opposé à l'ouverture de l'angle.
    etiquette(sommet, round([sommet[0] + Math.cos((demi * Math.PI) / 180) * 30, sommet[1] - Math.sin((demi * Math.PI) / 180) * 30]), lettres[1], 14),
  ];
  if (bissectrice) {
    shapes.push({ kind: 'segment', from: sommet, to: d, dashed: true, ink: 'couleur', width: 2.5 }, apres(sommet, d, bissectrice));
  }
  return { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt: `Un angle de sommet ${lettres[1]}, marqué par un arc de cercle.` };
}

/** Le rapporteur : un demi-disque gradué de 0° à 180°, de 10° en 10°, et un angle dont un bras suit la base. */
export const RAPPORTEUR = { sommet: [146, 158] as Point, rayon: 128 };

export function rapporteurFigure(degres: number, lettres: [string, string, string]): Figure {
  const { sommet, rayon } = RAPPORTEUR;
  const shapes: Shape[] = [
    { kind: 'arc', center: sommet, radius: rayon, from: 0, to: 180 },
    { kind: 'segment', from: [sommet[0] - rayon - 8, sommet[1]], to: [sommet[0] + rayon + 8, sommet[1]], width: 2 },
  ];
  for (let k = 0; k <= 180; k += 5) {
    const longueur = k % 10 === 0 ? 12 : 7;
    shapes.push({ kind: 'segment', from: round(polar(sommet, rayon, k)), to: round(polar(sommet, rayon - longueur, k)), width: k % 10 === 0 ? 1.6 : 1, ink: k % 10 === 0 ? 'encre' : 'pale' });
  }
  for (let k = 0; k <= 180; k += 10) {
    const [x, y] = polar(sommet, rayon - 21, k);
    // Les graduations 0 et 180 se posent au-dessus de la base, pas dessus.
    shapes.push({ kind: 'text', at: round([x, y + (k === 0 || k === 180 ? -4 : 3)]), text: String(k), anchor: 'middle', size: 9, bold: true });
  }
  const [bras1, bras2] = [round(polar(sommet, rayon + 8, 0)), round(polar(sommet, rayon + 8, degres))];
  shapes.push(
    { kind: 'segment', from: sommet, to: bras1, ink: 'couleur', width: 3 },
    { kind: 'segment', from: sommet, to: bras2, ink: 'couleur', width: 3 },
    { kind: 'point', at: sommet },
    etiquette(bras1, sommet, lettres[0], 12),
    etiquette(bras2, sommet, lettres[2], 12),
    { kind: 'text', at: [sommet[0], sommet[1] + 20], text: lettres[1], anchor: 'middle', bold: true, size: 14, halo: true }
  );
  return { width: FIGURE_WIDTH, height: 184, shapes, alt: 'Un rapporteur gradué de 0 à 180 degrés, et un angle dont un bras suit la graduation 0.' };
}

/** Deux droites qui se coupent en O : quatre points nommés, un sur chaque demi-droite. */
export function droitesSecantes(alpha: number, beta: number, lettres: [string, string, string, string]): Figure {
  const centre: Point = [150, 100];
  const rayon = 76;
  const bouts = [alpha, alpha + 180, alpha + beta, alpha + beta + 180];
  const shapes: Shape[] = [
    { kind: 'segment', from: round(polar(centre, rayon, alpha)), to: round(polar(centre, rayon, alpha + 180)), width: 2.5 },
    { kind: 'segment', from: round(polar(centre, rayon, alpha + beta)), to: round(polar(centre, rayon, alpha + beta + 180)), width: 2.5 },
    { kind: 'point', at: centre },
    { kind: 'text', at: [centre[0] + 12, centre[1] + 20], text: 'O', anchor: 'middle', bold: true, size: 14, halo: true },
  ];
  bouts.forEach((degres, index) => {
    const [x, y] = polar(centre, rayon + 13, degres);
    shapes.push({ kind: 'text', at: round([x, y + 5]), text: lettres[index], anchor: 'middle', bold: true, size: 14, halo: true });
  });
  return { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt: `Deux droites qui se coupent en O, avec les points ${lettres.join(', ')}.` };
}
