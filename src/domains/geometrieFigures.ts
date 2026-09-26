import { distance, polar, round, type Figure, type Point, type Shape } from '../lib/figures';

/**
 * Les dessins de la géométrie : polygones et leur codage, droites, angles,
 * solides en perspective, patrons, quadrillages. Chaque dessin est construit
 * juste — un carré a quatre côtés égaux et quatre angles droits, à l'arrondi
 * près — puis mis à l'échelle de son cadre.
 */

export const FIGURE_WIDTH = 300;
export const FIGURE_HEIGHT = 200;
const MARGIN = 26;

/** Met des points à l'échelle de leur cadre, centrés, sans les déformer. */
export function fitter(points: Point[], width = FIGURE_WIDTH, height = FIGURE_HEIGHT, margin = MARGIN): (p: Point) => Point {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min((width - 2 * margin) / (maxX - minX || 1), (height - 2 * margin) / (maxY - minY || 1));
  const offsetX = (width - (maxX - minX) * scale) / 2;
  const offsetY = (height - (maxY - minY) * scale) / 2;
  return ([x, y]) => round([offsetX + (x - minX) * scale, offsetY + (y - minY) * scale]);
}

/** Tourne des points autour de leur centre, d'un angle en degrés. */
export function rotate(points: Point[], degrees: number): Point[] {
  const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
  const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  const radians = (degrees * Math.PI) / 180;
  const [cos, sin] = [Math.cos(radians), Math.sin(radians)];
  return points.map(([x, y]) => [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos]);
}

/** Le carré qui code un angle droit au sommet `index` du polygone. */
export function angleDroit(points: Point[], index: number, size = 11): Shape {
  const n = points.length;
  return {
    kind: 'angleDroit',
    corner: points[index],
    towards: [points[(index + n - 1) % n], points[(index + 1) % n]],
    size,
    ink: 'couleur',
  };
}

/** Le codage des côtés : `counts[i]` petits traits sur le côté qui part du
 *  sommet i (0 : aucun). */
export function codageCotes(points: Point[], counts: number[]): Shape[] {
  return points.flatMap((from, index) => {
    const count = counts[index] ?? 0;
    if (count === 0) return [];
    return [{ kind: 'codage' as const, from, to: points[(index + 1) % points.length], count: count as 1 | 2 | 3, ink: 'couleur' as const }];
  });
}

export function polygonFigure(points: Point[], marks: (fitted: Point[]) => Shape[], alt: string): Figure {
  const place = fitter(points);
  const fitted = points.map(place);
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: [{ kind: 'polygon', points: fitted, fill: true }, ...marks(fitted)],
    alt,
  };
}

// --- Les polygones, en coordonnées libres (l'axe y vers le bas) -------------

/** Un polygone convexe à n sommets posés sur un cercle, à intervalles
 *  irréguliers : il ne ressemble jamais à un polygone régulier, mais reste
 *  bien lisible. */
export function irregularPolygon(n: number, random: () => number): Point[] {
  const step = 360 / n;
  const angles = Array.from({ length: n }, (_, index) => index * step + (random() - 0.5) * step * 0.5);
  return angles.map((angle) => polar([0, 0], 100, angle + 90));
}

export function regularPolygon(n: number, rotation = 0): Point[] {
  return Array.from({ length: n }, (_, index) => polar([0, 0], 100, 90 + rotation + (index * 360) / n));
}

export const square = (): Point[] => [[0, 0], [100, 0], [100, 100], [0, 100]];
export const rectangle = (ratio: number): Point[] => [[0, 0], [100 * ratio, 0], [100 * ratio, 100], [0, 100]];
/** Un losange de côté 100, d'angle aigu `angle` (en degrés). */
export function rhombus(angle: number): Point[] {
  const [dx, dy] = [100 * Math.cos((angle * Math.PI) / 180), 100 * Math.sin((angle * Math.PI) / 180)];
  return [[0, 0], [100, 0], [100 + dx, dy], [dx, dy]];
}
/** Un parallélogramme de côtés 100 et `side`, d'angle aigu `angle`. */
export function parallelogram(side: number, angle: number): Point[] {
  const [dx, dy] = [side * Math.cos((angle * Math.PI) / 180), side * Math.sin((angle * Math.PI) / 180)];
  return [[0, 0], [100, 0], [100 + dx, dy], [dx, dy]];
}
/** Un triangle rectangle en son premier sommet, de côtés de l'angle droit
 *  100 et `other`. */
export const rightTriangle = (other: number): Point[] => [[0, 0], [100, 0], [0, other]];
/** Un triangle isocèle de sommet principal d'angle `apex` (en degrés). */
export function isoscelesTriangle(apex: number): Point[] {
  const half = (apex / 2) * (Math.PI / 180);
  return [[0, 0], [-100 * Math.sin(half), 100 * Math.cos(half)], [100 * Math.sin(half), 100 * Math.cos(half)]];
}
export const equilateralTriangle = (): Point[] => isoscelesTriangle(60);
/** Un triangle quelconque : trois côtés et trois angles bien différents. */
export const scaleneTriangle = (): Point[] => [[0, 0], [150, 20], [40, 110]];
export const rightTrapezoid = (): Point[] => [[0, 0], [90, 0], [150, 100], [0, 100]];
export const isoscelesTrapezoid = (): Point[] => [[40, 0], [140, 0], [180, 90], [0, 90]];
/** Le cerf-volant : deux paires de côtés égaux, un seul axe de symétrie. */
export const kite = (): Point[] => [[0, -60], [55, 0], [0, 130], [-55, 0]];

/** Les côtés d'un polygone, dans l'ordre. */
export function sides(points: Point[]): number[] {
  return points.map((point, index) => distance(point, points[(index + 1) % points.length]));
}

/** L'angle intérieur au sommet `index`, en degrés. */
export function angleAt(points: Point[], index: number): number {
  const n = points.length;
  const [px, py] = points[(index + n - 1) % n];
  const [cx, cy] = points[index];
  const [nx, ny] = points[(index + 1) % n];
  const a = Math.atan2(py - cy, px - cx);
  const b = Math.atan2(ny - cy, nx - cx);
  let angle = Math.abs(((a - b) * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// --- Les droites et les angles ----------------------------------------------

export type LinesRelation = 'paralleles' | 'perpendiculaires' | 'secantes';

/** Deux droites (de longs segments) : parallèles, perpendiculaires, ou
 *  sécantes sans angle droit (entre 35° et 60°). */
export function linesFigure(relation: LinesRelation, baseAngle: number, secantAngle: number): Figure {
  const half = 120;
  const ends = (through: Point, degrees: number): [Point, Point] => [polar(through, -half, degrees), polar(through, half, degrees)];
  const pairs: [Point, Point][] =
    relation === 'paralleles'
      ? [ends(polar([0, 0], 32, baseAngle + 90), baseAngle), ends(polar([0, 0], -32, baseAngle + 90), baseAngle)]
      : [ends(polar([0, 0], 14, baseAngle + 180), baseAngle), ends(polar([0, 0], 10, baseAngle + (relation === 'perpendiculaires' ? 90 : secantAngle)), baseAngle + (relation === 'perpendiculaires' ? 90 : secantAngle))];
  // Mise à l'échelle uniforme : les angles et le parallélisme sont conservés.
  const place = fitter(pairs.flat(), FIGURE_WIDTH, FIGURE_HEIGHT, 14);
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: pairs.map(([from, to]) => ({ kind: 'segment' as const, from: place(from), to: place(to), width: 3 })),
    alt: relation === 'paralleles' ? 'Deux droites.' : 'Deux droites qui se coupent.',
  };
}

/** Un angle de sommet O, de mesure `degrees`, marqué d'un arc. */
export function angleFigure(degrees: number, rotation: number): Figure {
  const origin: Point = [0, 0];
  const raw = [origin, polar(origin, 100, rotation), polar(origin, 100, rotation + degrees)];
  const place = fitter(raw, FIGURE_WIDTH, FIGURE_HEIGHT, 20);
  const [vertex, first, second] = raw.map(place);
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: [
      { kind: 'segment', from: vertex, to: first, width: 3 },
      { kind: 'segment', from: vertex, to: second, width: 3 },
      { kind: 'arc', center: vertex, radius: 26, from: rotation, to: rotation + degrees, ink: 'couleur' },
      { kind: 'point', at: vertex },
    ],
    alt: 'Un angle, marqué par un arc de cercle.',
  };
}

// --- Le cercle ----------------------------------------------------------------

export type CircleElement = 'centre' | 'rayon' | 'diametre';

export function circleFigure(element: CircleElement, degrees: number): Figure {
  const center: Point = [150, 100];
  const radius = 78;
  const shapes: Shape[] = [{ kind: 'circle', center, radius }];
  if (element === 'centre') {
    shapes.push({ kind: 'circle', center, radius: 5, ink: 'couleur', fill: true });
  } else {
    const from = element === 'rayon' ? center : round(polar(center, -radius, degrees));
    shapes.push({ kind: 'segment', from, to: round(polar(center, radius, degrees)), ink: 'couleur', width: 4 });
    shapes.push({ kind: 'point', at: center });
  }
  return { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt: 'Un cercle et, en couleur, un de ses éléments.' };
}

// --- Le quadrillage -------------------------------------------------------------

export const GRID_COLUMNS = ['A', 'B', 'C', 'D', 'E'];
export const GRID_ROWS = ['1', '2', '3', '4', '5'];

/** Un quadrillage de 5 × 5, lettres en haut, chiffres à gauche, et une étoile
 *  dans la case (colonne, ligne). */
export function gridFigure(column: number, row: number): Figure {
  const cell = 32;
  const origin: Point = [85, 30];
  const shapes: Shape[] = [{ kind: 'quadrillage', origin, cols: 5, rows: 5, cell }];
  GRID_COLUMNS.forEach((letter, index) =>
    shapes.push({ kind: 'text', at: [origin[0] + cell * index + cell / 2, origin[1] - 8], text: letter, anchor: 'middle', bold: true })
  );
  GRID_ROWS.forEach((digit, index) =>
    shapes.push({ kind: 'text', at: [origin[0] - 10, origin[1] + cell * index + cell / 2 + 6], text: digit, anchor: 'end', bold: true })
  );
  shapes.push({ kind: 'etoile', at: [origin[0] + cell * column + cell / 2, origin[1] + cell * row + cell / 2], radius: 12, ink: 'couleur' });
  return { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt: 'Un quadrillage de cinq colonnes, A à E, et cinq lignes, 1 à 5, avec une étoile dans une case.' };
}

// --- Les solides ---------------------------------------------------------------

type V3 = [number, number, number];

/** La perspective cavalière des cahiers : les fuyantes partent vers le haut à
 *  droite, à 45°, réduites de moitié. */
const RECEDE = 0.5 * Math.SQRT1_2;
const project = ([x, y, z]: V3): Point => [x + RECEDE * z, -(y + RECEDE * z)];
/** Vers l'observateur : une face est vue quand sa normale va de ce côté. */
const VIEW: V3 = [RECEDE, RECEDE, -1];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export interface Polyhedron {
  vertices: V3[];
  faces: number[][];
}

/** Les arêtes d'un polyèdre convexe, chacune vue ou cachée : une arête est
 *  vue dès qu'une de ses deux faces l'est. */
export function polyhedronEdges(solid: Polyhedron): { a: number; b: number; hidden: boolean }[] {
  const centroid = solid.vertices.reduce<V3>((sum, v) => [sum[0] + v[0], sum[1] + v[1], sum[2] + v[2]], [0, 0, 0]).map(
    (value) => value / solid.vertices.length
  ) as V3;
  const visible = solid.faces.map((face) => {
    const [p0, p1, p2] = face.map((index) => solid.vertices[index]);
    let normal = cross(sub(p1, p0), sub(p2, p0));
    const faceCenter = face
      .map((index) => solid.vertices[index])
      .reduce<V3>((sum, v) => [sum[0] + v[0], sum[1] + v[1], sum[2] + v[2]], [0, 0, 0])
      .map((value) => value / face.length) as V3;
    if (dot(normal, sub(faceCenter, centroid)) < 0) normal = [-normal[0], -normal[1], -normal[2]];
    return dot(normal, VIEW) > 1e-9;
  });
  const edges = new Map<string, { a: number; b: number; hidden: boolean }>();
  solid.faces.forEach((face, faceIndex) =>
    face.forEach((a, position) => {
      const b = face[(position + 1) % face.length];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      const known = edges.get(key);
      edges.set(key, { a: Math.min(a, b), b: Math.max(a, b), hidden: (known?.hidden ?? true) && !visible[faceIndex] });
    })
  );
  return [...edges.values()];
}

export const cuboid = (w: number, h: number, d: number): Polyhedron => ({
  vertices: [[0, 0, 0], [w, 0, 0], [w, h, 0], [0, h, 0], [0, 0, d], [w, 0, d], [w, h, d], [0, h, d]],
  faces: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]],
});

export const squarePyramid = (): Polyhedron => ({
  vertices: [[0, 0, 0], [100, 0, 0], [100, 0, 100], [0, 0, 100], [50, 120, 50]],
  faces: [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]],
});

export const triangularPrism = (): Polyhedron => ({
  // Assez long pour qu'on le reconnaisse : une « tente », pas une pyramide.
  vertices: [[0, 0, 0], [100, 0, 0], [50, 85, 0], [0, 0, 260], [100, 0, 260], [50, 85, 260]],
  faces: [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]],
});

export function polyhedronFigure(solid: Polyhedron, alt: string): Figure {
  const projected = solid.vertices.map(project);
  const place = fitter(projected);
  const points = projected.map(place);
  const edges = polyhedronEdges(solid);
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    // Les arêtes cachées d'abord, en pointillés, sous les arêtes vues.
    shapes: [...edges.filter((edge) => edge.hidden), ...edges.filter((edge) => !edge.hidden)].map((edge) => ({
      kind: 'segment' as const,
      from: points[edge.a],
      to: points[edge.b],
      dashed: edge.hidden,
      ink: edge.hidden ? ('pale' as const) : ('encre' as const),
      width: 3,
    })),
    alt,
  };
}

/** Les solides à faces courbes, dessinés comme dans les manuels. */
export type RoundSolid = 'cylindre' | 'cone' | 'boule';

export function roundSolidFigure(solid: RoundSolid): Figure {
  const shapes: Shape[] = [];
  if (solid === 'cylindre') {
    const [cx, top, bottom, rx, ry] = [150, 45, 155, 62, 18];
    shapes.push(
      { kind: 'ellipse', center: [cx, top], rx, ry },
      { kind: 'ellipse', center: [cx, bottom], rx, ry, half: 'bas' },
      { kind: 'ellipse', center: [cx, bottom], rx, ry, half: 'haut', dashed: true, ink: 'pale' },
      { kind: 'segment', from: [cx - rx, top], to: [cx - rx, bottom], width: 3 },
      { kind: 'segment', from: [cx + rx, top], to: [cx + rx, bottom], width: 3 }
    );
  } else if (solid === 'cone') {
    const [cx, apex, base, rx, ry] = [150, 22, 160, 68, 18];
    shapes.push(
      { kind: 'ellipse', center: [cx, base], rx, ry, half: 'bas' },
      { kind: 'ellipse', center: [cx, base], rx, ry, half: 'haut', dashed: true, ink: 'pale' },
      { kind: 'segment', from: [cx, apex], to: [cx - rx, base], width: 3 },
      { kind: 'segment', from: [cx, apex], to: [cx + rx, base], width: 3 }
    );
  } else {
    const [cx, cy, r] = [150, 100, 78];
    shapes.push(
      { kind: 'circle', center: [cx, cy], radius: r },
      { kind: 'ellipse', center: [cx, cy], rx: r, ry: 20, half: 'bas' },
      { kind: 'ellipse', center: [cx, cy], rx: r, ry: 20, half: 'haut', dashed: true, ink: 'pale' }
    );
  }
  return { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt: 'Un solide, dessiné en perspective.' };
}

// --- Les patrons du cube --------------------------------------------------------

export type Net = [number, number][];

/**
 * Un patron de cube, vérifié en faisant rouler un dé sur ses cases : chaque
 * case reçoit la face du dé posée dessus. C'est un patron si les six cases
 * reçoivent six faces différentes.
 */
export function isCubeNet(net: Net): boolean {
  if (net.length !== 6) return false;
  const key = ([c, r]: [number, number]) => `${c},${r}`;
  const cells = new Set(net.map(key));
  // Le dé : [dessous, dessus, nord, sud, est, ouest].
  type Die = [number, number, number, number, number, number];
  const roll = (die: Die, dc: number, dr: number): Die => {
    const [bottom, top, north, south, east, west] = die;
    if (dc === 1) return [east, west, north, south, top, bottom];
    if (dc === -1) return [west, east, north, south, bottom, top];
    if (dr === 1) return [south, north, bottom, top, east, west];
    return [north, south, top, bottom, east, west];
  };
  const seen = new Map<string, number>();
  const queue: [[number, number], Die][] = [[net[0], [0, 1, 2, 3, 4, 5]]];
  seen.set(key(net[0]), 0);
  while (queue.length > 0) {
    const [[c, r], die] = queue.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const next: [number, number] = [c + dc, r + dr];
      if (!cells.has(key(next)) || seen.has(key(next))) continue;
      const rolled = roll(die, dc, dr);
      seen.set(key(next), rolled[0]);
      queue.push([next, rolled]);
    }
  }
  return seen.size === 6 && new Set(seen.values()).size === 6;
}

/** Quatre dessins de six carrés, nommés A, B, C, D. */
export function netsFigure(nets: Net[]): Figure {
  const cell = 16;
  const slots: Point[] = [[20, 18], [165, 18], [20, 125], [165, 125]];
  const letters = ['A', 'B', 'C', 'D'];
  const shapes: Shape[] = [];
  nets.forEach((net, index) => {
    const [ox, oy] = slots[index];
    shapes.push({ kind: 'text', at: [ox, oy + 12], text: letters[index], bold: true, size: 16 });
    net.forEach(([c, r]) => {
      const [x, y] = [ox + 22 + c * cell, oy + r * cell];
      shapes.push({ kind: 'polygon', points: [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]], fill: true });
    });
  });
  return { width: FIGURE_WIDTH, height: 210, shapes, alt: 'Quatre assemblages de six carrés, nommés A, B, C et D.' };
}
