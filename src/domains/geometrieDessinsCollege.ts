import { polar, round, type Figure, type Point, type Shape } from '../lib/figures';
import { angleDroit, codageCotes, fitter, FIGURE_HEIGHT, FIGURE_WIDTH } from './geometrieFigures';
import { barycentre, etiquetteDansLeCadre, longueurSurLeCote, polygoneNomme } from './geometrieDessins';

/**
 * Les dessins de la géométrie du collège (5e, 4e, 3e) : des triangles dont on
 * lit les angles, deux parallèles coupées par une sécante, les configurations
 * du théorème de Thalès, un triangle rectangle, un parallélogramme et un
 * triangle avec leur hauteur, un disque.
 *
 * Chaque dessin est construit juste — les angles écrits sont les angles tracés,
 * les droites annoncées parallèles le sont — puis les tests le relisent comme
 * l'élève (geometrieCycle4.test.ts).
 */

// --- Les angles ---------------------------------------------------------------------------------------------------------

/** La direction de `vers` vu de `de`, en degrés, dans le sens direct (0° vers la droite, 90° vers le haut de l'écran). */
export const degresVers = (de: Point, vers: Point): number => (Math.atan2(-(vers[1] - de[1]), vers[0] - de[0]) * 180) / Math.PI;

/** L'arc qui marque l'angle intérieur (au plus 180°) entre les demi-droites [sommet a) et [sommet b), et la direction de sa bissectrice. */
export function arcDAngle(sommet: Point, a: Point, b: Point, rayon: number): { arc: Shape; milieu: number; mesure: number } {
  const [da, db] = [degresVers(sommet, a), degresVers(sommet, b)];
  const ecart = (((db - da) % 360) + 360) % 360;
  const [from, mesure] = ecart <= 180 ? [da, ecart] : [db, 360 - ecart];
  return { arc: { kind: 'arc', center: sommet, radius: rayon, from, to: from + mesure, ink: 'couleur' }, milieu: from + mesure / 2, mesure };
}

/** Un angle marqué d'un arc et d'un texte (« 58° », « ? », « x »), le texte posé le long de la bissectrice. */
export function marqueAngle(sommet: Point, a: Point, b: Point, texte: string, rayon = 20, rayonDuTexte = 38): Shape[] {
  const { arc, milieu } = arcDAngle(sommet, a, b, rayon);
  const [x, y] = polar(sommet, rayonDuTexte, milieu);
  return [arc, { kind: 'text', at: round([x, y + 4]), text: texte, anchor: 'middle', bold: true, size: 13, ink: 'couleur', halo: true }];
}

// --- Un triangle dont on lit les angles -------------------------------------------------------------------------------

/**
 * Un triangle ABC d'angles `a` en A et `b` en B (le troisième en découle), posé sur sa base [AB]. `textes` donne
 * ce qui s'écrit à chaque sommet : « 48° », « ? », ou rien. `egaux` code deux côtés de même longueur.
 */
export function triangleAvecAngles(a: number, b: number, lettres: [string, string, string], textes: [string | null, string | null, string | null], egaux: [number, number, number] | null, alt: string): Figure {
  const c = 180 - a - b;
  const longueurAC = (100 * Math.sin((b * Math.PI) / 180)) / Math.sin((c * Math.PI) / 180);
  const points: Point[] = [[0, 0], [100, 0], [longueurAC * Math.cos((a * Math.PI) / 180), -longueurAC * Math.sin((a * Math.PI) / 180)]];
  return polygoneNomme(
    points,
    lettres,
    (sommets) => {
      const marques = sommets.flatMap((sommet, index) => {
        const texte = textes[index];
        return texte === null ? [] : marqueAngle(sommet, sommets[(index + 1) % 3], sommets[(index + 2) % 3], texte, 18, 36);
      });
      return [...marques, ...(egaux ? codageCotes(sommets, egaux) : [])];
    },
    alt,
    44
  );
}

// --- Deux parallèles coupées par une sécante ---------------------------------------------------------------------------

export type Secteur = 'NE' | 'NW' | 'SW' | 'SE';

/** Les deux directions qui bornent chaque secteur, quand la sécante a pour direction `theta` (en degrés). */
const BORNES_DU_SECTEUR: Record<Secteur, (theta: number) => [number, number]> = {
  NE: (theta) => [0, theta],
  NW: (theta) => [theta, 180],
  SW: (theta) => [180, theta + 180],
  SE: (theta) => [theta + 180, 360],
};

/** Ce que mesure chaque secteur : `theta` ou son supplémentaire. */
export const MESURE_DU_SECTEUR = (secteur: Secteur, theta: number): number => (secteur === 'NE' || secteur === 'SW' ? theta : 180 - theta);

export interface AngleMarque {
  /** Où il se trouve : sur la première droite (1) ou la seconde (2). */
  droite: 1 | 2;
  secteur: Secteur;
  texte: string;
}

/**
 * Deux droites parallèles (d) et (d') — la première en haut — coupées par une sécante de direction `theta` (de 0° à
 * 180°, 90° exclu). `rotation` incline tout le dessin. Les angles marqués portent leur texte.
 */
export function parallelesEtSecante(theta: number, rotation: number, marques: AngleMarque[], alt: string): Figure {
  const centre: Point = [150, 100];
  const demiEcart = 35;
  const tourne = ([u, v]: Point): Point => {
    const r = (rotation * Math.PI) / 180;
    return round([centre[0] + u * Math.cos(r) - v * Math.sin(r), centre[1] - (u * Math.sin(r) + v * Math.cos(r))]);
  };
  const t = (theta * Math.PI) / 180;
  const longueurDeLaSecante = demiEcart / Math.sin(t) + 32;
  const intersection = (droite: 1 | 2): Point => (droite === 1 ? [demiEcart / Math.tan(t), demiEcart] : [-demiEcart / Math.tan(t), -demiEcart]);
  const shapes: Shape[] = [
    { kind: 'segment', from: tourne([-120, demiEcart]), to: tourne([120, demiEcart]), width: 2.5 },
    { kind: 'segment', from: tourne([-120, -demiEcart]), to: tourne([120, -demiEcart]), width: 2.5 },
    { kind: 'segment', from: tourne([-longueurDeLaSecante * Math.cos(t), -longueurDeLaSecante * Math.sin(t)]), to: tourne([longueurDeLaSecante * Math.cos(t), longueurDeLaSecante * Math.sin(t)]), width: 2.5 },
    { kind: 'text', at: tourne([122, demiEcart + 10]), text: '(d)', anchor: 'middle', bold: true, size: 13, halo: true },
    { kind: 'text', at: tourne([122, -demiEcart + 10]), text: "(d')", anchor: 'middle', bold: true, size: 13, halo: true },
  ];
  marques.forEach(({ droite, secteur, texte }) => {
    const [debut, fin] = BORNES_DU_SECTEUR[secteur](theta);
    const sommet = tourne(intersection(droite));
    const milieu = (debut + fin) / 2 + rotation;
    const [x, y] = polar(sommet, 38, milieu);
    shapes.push(
      { kind: 'arc', center: sommet, radius: 20, from: debut + rotation, to: fin + rotation, ink: 'couleur' },
      { kind: 'text', at: round([x, y + 4]), text: texte, anchor: 'middle', bold: true, size: 14, ink: 'couleur', halo: true }
    );
  });
  return { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt };
}

// --- Un triangle rectangle -----------------------------------------------------------------------------------------------------------

export interface AngleDuTriangleRectangle {
  /** Le sommet de l'angle : 1 (au bout de la base) ou 2 (en haut). */
  sommet: 1 | 2;
  texte: string;
}

/**
 * Un triangle rectangle de sommets R (l'angle droit, en bas à gauche), P (au bout de la base) et Q (en haut) : la
 * base [RP] et la hauteur [RQ] sont dans le rapport `rapport` (RQ/RP). `cotes` écrit une longueur sur [RP], [PQ] et
 * [QR] ; `angles` marque un ou deux des angles aigus.
 */
export function triangleRectangle(rapport: number, lettres: [string, string, string], cotes: [string | null, string | null, string | null], angles: AngleDuTriangleRectangle[], alt: string): Figure {
  const points: Point[] = [[0, 0], [100, 0], [0, -100 * Math.min(2.2, Math.max(0.45, rapport))]];
  return polygoneNomme(
    points,
    lettres,
    (sommets, centre) => {
      const formes: Shape[] = [angleDroit(sommets, 0, 12)];
      cotes.forEach((texte, index) => {
        if (texte !== null) formes.push(longueurSurLeCote(sommets[index], sommets[(index + 1) % 3], centre, texte));
      });
      angles.forEach(({ sommet, texte }) => formes.push(...marqueAngle(sommets[sommet], sommets[(sommet + 1) % 3], sommets[(sommet + 2) % 3], texte, 20, 40)));
      return formes;
    },
    alt,
    46
  );
}

// --- Le théorème de Thalès ---------------------------------------------------------------------------------------------------

/** Les deux petits traits en « > » qui marquent un segment parallèle à un autre, posés en son milieu et tournés vers `vers`. */
export function chevronsDeParallele(de: Point, vers: Point): Shape[] {
  const direction = degresVers(de, vers);
  const milieu: Point = [(de[0] + vers[0]) / 2, (de[1] + vers[1]) / 2];
  const barbe = (ecart: number): Shape => ({ kind: 'segment', from: milieu, to: round(polar(milieu, 8, direction + 180 + ecart)), ink: 'couleur', width: 2 });
  return [barbe(32), barbe(-32)];
}

/** La figure de Thalès à triangles emboîtés ou en papillon : les points sont donnés pour que les tests les relisent. */
export interface FigureDeThales {
  figure: Figure;
  points: Record<'A' | 'B' | 'C' | 'D' | 'E', Point>;
}

/** Les triangles emboîtés ABC et ADE : D sur [AB], E sur [AC] à la fraction `t` du chemin depuis A, (DE) parallèle à (BC). */
function emboites(a: Point, b: Point, c: Point, t: number, lettres: [string, string, string, string, string], alt: string): FigureDeThales {
  const [d, e]: Point[] = [round([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]), round([a[0] + t * (c[0] - a[0]), a[1] + t * (c[1] - a[1])])];
  const points = { A: a, B: b, C: c, D: d, E: e };
  const centre = barycentre([a, b, c]);
  const shapes: Shape[] = [
    { kind: 'polygon', points: [a, b, c], fill: true },
    { kind: 'segment', from: d, to: e, width: 3, ink: 'couleur' },
    ...chevronsDeParallele(d, e),
    ...chevronsDeParallele(b, c),
    ...[a, b, c, d, e].map((point, index) => etiquetteDansLeCadre(point, centre, lettres[index], 300, 200, 15)),
  ];
  return { figure: { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt }, points };
}

/** ABC, D sur [AB], E sur [AC], (DE) parallèle à (BC) : D et E sont à la fraction `t` du chemin de A vers B et vers C. */
export function triangleEmboite(t: number, decalageB: number, decalageC: number, lettres: [string, string, string, string, string], alt: string): FigureDeThales {
  return emboites([150, 24], [34 + decalageB, 168], [266 - decalageC, 168], t, lettres, alt);
}

/** Les mêmes triangles emboîtés, dessinés à l'échelle des angles : le triangle ABC a ses angles en B et en C égaux à `angleB` et `angleC` (aigus). */
export function triangleEmboiteAvecAngles(angleB: number, angleC: number, t: number, lettres: [string, string, string, string, string], alt: string): FigureDeThales {
  const [tanB, tanC] = [Math.tan((angleB * Math.PI) / 180), Math.tan((angleC * Math.PI) / 180)];
  const hauteur = 100 / (1 / tanB + 1 / tanC);
  // B à l'origine, C à 100 sur l'horizontale, A à la rencontre des deux demi-droites : au-dessus de la base.
  const brut: Point[] = [[hauteur / tanB, -hauteur], [0, 0], [100, 0]];
  const placer = fitter(brut, FIGURE_WIDTH, FIGURE_HEIGHT, 40);
  const [a, b, c] = brut.map(placer);
  return emboites(a, b, c, t, lettres, alt);
}

/** La figure « en papillon » : les droites (BD) et (CE) se coupent en A, (BC) et (DE) sont parallèles, A est entre B et D, entre C et E. */
export function papillon(rapport: number, lettres: [string, string, string, string, string], alt: string): FigureDeThales {
  const a: Point = [150, 100];
  const [b, c]: Point[] = [round(polar(a, 66, 145)), round(polar(a, 74, 38))];
  const [d, e]: Point[] = [round([a[0] - rapport * (b[0] - a[0]), a[1] - rapport * (b[1] - a[1])]), round([a[0] - rapport * (c[0] - a[0]), a[1] - rapport * (c[1] - a[1])])];
  const points = { A: a, B: b, C: c, D: d, E: e };
  const shapes: Shape[] = [
    { kind: 'segment', from: b, to: d, width: 2.5 },
    { kind: 'segment', from: c, to: e, width: 2.5 },
    { kind: 'segment', from: b, to: c, width: 3, ink: 'couleur' },
    { kind: 'segment', from: d, to: e, width: 3, ink: 'couleur' },
    ...chevronsDeParallele(b, c),
    ...chevronsDeParallele(d, e),
    { kind: 'point', at: a },
    // Le nom du point de rencontre se place dans l'espace libre au-dessus : en dessous, il couvrirait le petit segment, et sur les côtés il toucherait les droites.
    { kind: 'text', at: [a[0], a[1] - 11], text: lettres[0], anchor: 'middle', bold: true, size: 14, halo: true },
    ...[b, c, d, e].map((point, index) => etiquetteDansLeCadre(point, a, lettres[index + 1], 300, 200, 15)),
  ];
  return { figure: { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt }, points };
}

// --- Un parallélogramme et un triangle avec leur hauteur -------------------------------------------------------------------------

/** Une figure posée sur une base horizontale, avec sa hauteur en pointillés, son pied marqué d'un angle droit, et les deux longueurs écrites. */
function figureAvecHauteur(sommets: Point[], pied: Point, sommetHaut: Point, base: [Point, Point], texteBase: string, texteHauteur: string, lettres: string[], alt: string): Figure {
  const placer = fitter([...sommets, pied], FIGURE_WIDTH, FIGURE_HEIGHT, 46);
  const [points, piedPlace, hautPlace] = [sommets.map(placer), placer(pied), placer(sommetHaut)];
  const [debut, fin] = [placer(base[0]), placer(base[1])];
  const centre = barycentre(points);
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: [
      { kind: 'polygon', points, fill: true },
      { kind: 'segment', from: hautPlace, to: piedPlace, dashed: true, ink: 'couleur', width: 2.5 },
      { kind: 'angleDroit', corner: piedPlace, towards: [hautPlace, piedPlace[0] <= debut[0] ? debut : fin], size: 10, ink: 'couleur' },
      { kind: 'text', at: round([(debut[0] + fin[0]) / 2, debut[1] + 24]), text: texteBase, anchor: 'middle', bold: true, size: 13, halo: true },
      { kind: 'text', at: round([piedPlace[0] + (hautPlace[0] <= centre[0] ? -8 : 8), (hautPlace[1] + piedPlace[1]) / 2 + 4]), text: texteHauteur, anchor: hautPlace[0] <= centre[0] ? 'end' : 'start', bold: true, size: 13, ink: 'couleur', halo: true },
      ...points.map((point, index) => etiquetteDansLeCadre(point, centre, lettres[index], 300, 200, 14)),
    ],
    alt,
  };
}

/** Un parallélogramme ABCD de base [AB] et de hauteur issue de D, de longueurs `base` et `hauteur`. */
export function parallelogrammeAvecHauteur(base: number, hauteur: number, texteBase: string, texteHauteur: string, lettres: [string, string, string, string], alt: string): Figure {
  const decalage = Math.min(base * 0.45, Math.max(hauteur * 0.5, base * 0.2));
  const [a, b, c, d]: Point[] = [[0, 0], [base, 0], [base + decalage, -hauteur], [decalage, -hauteur]];
  return figureAvecHauteur([a, b, c, d], [d[0], 0], d, [a, b], texteBase, texteHauteur, lettres, alt);
}

/** Un triangle ABC de base [BC] et de hauteur issue de A (dont le pied H est sur [BC]). */
export function triangleAvecHauteur(base: number, hauteur: number, positionDuPied: number, texteBase: string, texteHauteur: string, lettres: [string, string, string], alt: string): Figure {
  const [b, c, a]: Point[] = [[0, 0], [base, 0], [base * positionDuPied, -hauteur]];
  return figureAvecHauteur([a, b, c], [a[0], 0], a, [b, c], texteBase, texteHauteur, lettres, alt);
}

// --- Un disque -------------------------------------------------------------------------------------------------------------------------

/** Un disque de centre O, avec un rayon (ou un diamètre) écrit au-dessus de son trait. */
export function disqueAvecRayon(texte: string, estUnDiametre: boolean, alt: string): Figure {
  const centre: Point = [150, 100];
  const rayon = 66;
  const bout: Point = round(polar(centre, rayon, 25));
  const autreBout: Point = round(polar(centre, rayon, 205));
  const milieu: Point = estUnDiametre ? centre : [(centre[0] + bout[0]) / 2, (centre[1] + bout[1]) / 2];
  // Le texte se pose au-dessus du trait : perpendiculairement, vers le haut.
  const [nx, ny] = [-Math.sin((25 * Math.PI) / 180), -Math.cos((25 * Math.PI) / 180)];
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: [
      { kind: 'circle', center: centre, radius: rayon, fill: true },
      { kind: 'segment', from: estUnDiametre ? autreBout : centre, to: bout, ink: 'couleur', width: 2.8 },
      { kind: 'point', at: centre },
      { kind: 'text', at: [centre[0] - 4, centre[1] + 20], text: 'O', anchor: 'middle', bold: true, size: 14, halo: true },
      { kind: 'text', at: round([milieu[0] + nx * 15, milieu[1] + ny * 15 + 4]), text: texte, anchor: 'middle', bold: true, size: 13, ink: 'couleur', halo: true },
    ],
    alt,
  };
}
