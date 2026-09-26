/**
 * Les dessins des exercices — figures de géométrie, frises, quadrillages,
 * cartes —
 * décrits comme des données, jamais comme du SVG tout fait : on peut les
 * vérifier dans les tests (une figure ne sort pas de son cadre, un carré a
 * bien quatre côtés égaux), et l'écran les trace avec l'encre de l'école.
 *
 * Coordonnées en unités de la figure, l'origine en haut à gauche, comme à
 * l'écran.
 */

export type Point = [number, number];

/** L'encre d'un trait : celle du cahier, la couleur de la notion (pour
 *  désigner ce dont parle la question), un gris (arêtes cachées, repères) ;
 *  sur les cartes, le bleu des fleuves et le trait des frontières. */
export type Ink = 'encre' | 'couleur' | 'pale' | 'eau' | 'frontiere';

/** Le fond d'une surface de carte : la mer, la France, les pays voisins, ou
 *  l'orange de ce que désigne la question. */
export type Ground = 'mer' | 'terre' | 'voisin' | 'surbrillance';

export type Shape =
  | { kind: 'segment'; from: Point; to: Point; ink?: Ink; dashed?: boolean; width?: number }
  | { kind: 'polygon'; points: Point[]; ink?: Ink; fill?: boolean; dashed?: boolean }
  | { kind: 'polyline'; points: Point[]; ink?: Ink; dashed?: boolean; width?: number }
  | { kind: 'circle'; center: Point; radius: number; ink?: Ink; fill?: boolean }
  /** Une ellipse, entière ou seulement sa moitié haute ou basse (la face
   *  cachée d'un cylindre se dessine en pointillés). */
  | { kind: 'ellipse'; center: Point; rx: number; ry: number; ink?: Ink; dashed?: boolean; half?: 'haut' | 'bas' }
  /** Un arc de cercle, pour marquer un angle ; angles en degrés, dans le sens
   *  inverse des aiguilles d'une montre, 0 vers la droite. */
  | { kind: 'arc'; center: Point; radius: number; from: number; to: number; ink?: Ink }
  | { kind: 'point'; at: Point; ink?: Ink }
  /** Un texte ; `halo` le détache d'un fond chargé, comme un nom de ville
   *  sur une carte. */
  | { kind: 'text'; at: Point; text: string; ink?: Ink; size?: number; anchor?: 'start' | 'middle' | 'end'; bold?: boolean; halo?: boolean }
  /** Le petit carré qui code un angle droit, dans le coin `corner`, entre les
   *  directions de `towards`. */
  | { kind: 'angleDroit'; corner: Point; towards: [Point, Point]; size?: number; ink?: Ink }
  /** Les petits traits qui codent des longueurs égales, au milieu d'un côté. */
  | { kind: 'codage'; from: Point; to: Point; count: 1 | 2 | 3; ink?: Ink }
  | { kind: 'etoile'; at: Point; radius: number; ink?: Ink }
  /** Un quadrillage de `cols` × `rows` cases, sans légende. */
  | { kind: 'quadrillage'; origin: Point; cols: number; rows: number; cell: number; ink?: Ink }
  /** Une surface de carte : un ou plusieurs contours (continent, pays, îles),
   *  remplis de `ground`, bordés de `ink` — ou sans bord. */
  | { kind: 'aire'; rings: Point[][]; ground?: Ground; ink?: Ink | 'aucune'; width?: number }
  /** Un tracé de carte ouvert : un fleuve, l'équateur. */
  | { kind: 'trace'; points: Point[]; ink?: Ink; width?: number; dashed?: boolean }
  /** Une lettre posée sur une carte, dans une pastille blanche. */
  | { kind: 'lettre'; at: Point; text: string }
  /** Le symbole d'une montagne. */
  | { kind: 'montagne'; at: Point }
  /** Une ville ; celle que désigne la question est plus grosse, en orange. */
  | { kind: 'ville'; at: Point; highlight?: boolean };

/** Le rayon de la pastille d'une lettre de carte. */
export const LETTER_RADIUS = 9.5;

export interface Figure {
  width: number;
  height: number;
  shapes: Shape[];
  /** Ce que lit un lecteur d'écran : une description qui ne donne jamais la
   *  réponse. */
  alt: string;
}

/** Tous les points qu'une forme occupe : pour vérifier qu'une figure tient
 *  dans son cadre. */
export function shapePoints(shape: Shape): Point[] {
  switch (shape.kind) {
    case 'segment':
    case 'codage':
      return [shape.from, shape.to];
    case 'polygon':
    case 'polyline':
    case 'trace':
      return shape.points;
    case 'aire':
      return shape.rings.flat();
    case 'lettre':
      return [[shape.at[0] - LETTER_RADIUS, shape.at[1] - LETTER_RADIUS], [shape.at[0] + LETTER_RADIUS, shape.at[1] + LETTER_RADIUS]];
    case 'montagne':
      return [[shape.at[0] - 5, shape.at[1] - 5], [shape.at[0] + 5, shape.at[1] + 4]];
    case 'ville': {
      const r = shape.highlight ? 7 : 2.5;
      return [[shape.at[0] - r, shape.at[1] - r], [shape.at[0] + r, shape.at[1] + r]];
    }
    case 'circle':
    case 'etoile': {
      const [x, y] = 'center' in shape ? shape.center : shape.at;
      const r = shape.radius;
      return [[x - r, y - r], [x + r, y + r]];
    }
    case 'arc':
      return Array.from({ length: 9 }, (_, index) =>
        polar(shape.center, shape.radius, shape.from + ((shape.to - shape.from) * index) / 8)
      );
    case 'ellipse': {
      const [x, y] = shape.center;
      return [[x - shape.rx, y - shape.ry], [x + shape.rx, y + shape.ry]];
    }
    case 'point':
    case 'text':
      return [shape.at];
    case 'angleDroit':
      return [shape.corner, ...shape.towards];
    case 'quadrillage': {
      const [x, y] = shape.origin;
      return [[x, y], [x + shape.cols * shape.cell, y + shape.rows * shape.cell]];
    }
  }
}

export function fitsInFrame(figure: Figure, margin = 0): boolean {
  return figure.shapes.every((shape) =>
    shapePoints(shape).every(
      ([x, y]) => x >= margin - 1e-6 && y >= margin - 1e-6 && x <= figure.width - margin + 1e-6 && y <= figure.height - margin + 1e-6
    )
  );
}

export function distance([ax, ay]: Point, [bx, by]: Point): number {
  return Math.hypot(bx - ax, by - ay);
}

/** Le point de coordonnées polaires (rayon, angle en degrés, sens direct
 *  mathématique) autour de `center`, dans le repère de l'écran (y vers le
 *  bas). */
export function polar(center: Point, radius: number, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return [center[0] + radius * Math.cos(radians), center[1] - radius * Math.sin(radians)];
}

/** Arrondit un point au dixième : des figures lisibles dans les tests, et
 *  plus légères. */
export function round([x, y]: Point): Point {
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}
