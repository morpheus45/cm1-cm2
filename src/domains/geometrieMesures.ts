import type { Figure, Point, Shape } from '../lib/figures';
import { distance } from '../lib/figures';
import type { Stage } from '../lib/progression';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import type { Node } from '../lib/construction';
import { angleDroit, codageCotes, fitter, irregularPolygon } from './geometrieFigures';
import { choose, type Family } from './geometrieCommun';

/**
 * Mesurer : lire une règle, calculer un périmètre, une aire.
 *
 * Progression, cumulative :
 * - CM1, 1er trimestre : lire une longueur en centimètres sur une règle (le
 *   segment ne part pas toujours de 0) ;
 * - CM1, 2e : centimètres et millimètres ; le périmètre, en ajoutant les
 *   côtés ;
 * - CM1, 3e : l'aire, en comptant les carreaux (et ne pas la confondre avec
 *   le périmètre) ;
 * - CM2, 1er : longueurs en nombres décimaux ; périmètre du carré et du
 *   rectangle par la formule ;
 * - CM2, 2e : aires avec des demi-carreaux ; aire du rectangle en cm².
 */

// --- Lire une règle ------------------------------------------------------------------

const RULER_LEFT = 22;
const RULER_WIDTH = 256;
const RULER_TOP = 64;
const RULER_BOTTOM = 106;
const SEGMENT_Y = 52;

/** Combien de centimètres montrer : juste ce qu'il faut (6 à 10), pour que
 *  les millimètres restent lisibles sur un petit écran. */
export const rulerLength = (end: number) => Math.min(10, Math.max(6, Math.ceil(end / 10) + 1));

/** Une longueur en millimètres, écrite comme au niveau de l'élève : en
 *  centimètres au 1er trimestre du CM1, en centimètres et millimètres
 *  ensuite, en nombre décimal au CM2. */
export function formatLength(mm: number, stage: Stage): string {
  if (stage >= 4) return `${String(mm / 10).replace('.', ',')} cm`;
  if (mm % 10 === 0) return `${mm / 10} cm`;
  if (mm < 10) return `${mm} mm`;
  return `${Math.floor(mm / 10)} cm ${mm % 10} mm`;
}

export function rulerFigure(start: number, end: number): Figure {
  const centimeters = rulerLength(end);
  const xAt = (mm: number) => Math.round((RULER_LEFT + (mm * RULER_WIDTH) / (centimeters * 10)) * 10) / 10;
  const shapes: Shape[] = [
    { kind: 'polygon', points: [[12, RULER_TOP], [288, RULER_TOP], [288, RULER_BOTTOM], [12, RULER_BOTTOM]], fill: true },
  ];
  for (let mm = 0; mm <= centimeters * 10; mm++) {
    const length = mm % 10 === 0 ? 14 : mm % 5 === 0 ? 9 : 5;
    shapes.push({ kind: 'segment', from: [xAt(mm), RULER_TOP], to: [xAt(mm), RULER_TOP + length], width: mm % 10 === 0 ? 1.6 : 1, ink: mm % 5 === 0 ? 'encre' : 'pale' });
  }
  for (let cm = 0; cm <= centimeters; cm++) {
    shapes.push({ kind: 'text', at: [xAt(cm * 10), RULER_TOP + 31], text: String(cm), anchor: 'middle', size: 13, bold: true });
  }
  shapes.push(
    { kind: 'segment', from: [xAt(start), SEGMENT_Y], to: [xAt(end), SEGMENT_Y], ink: 'couleur', width: 3.5 },
    { kind: 'segment', from: [xAt(start), SEGMENT_Y - 7], to: [xAt(start), RULER_TOP - 1], ink: 'couleur', width: 2 },
    { kind: 'segment', from: [xAt(end), SEGMENT_Y - 7], to: [xAt(end), RULER_TOP - 1], ink: 'couleur', width: 2 }
  );
  return { width: 300, height: 124, shapes, alt: 'Une règle graduée en centimètres et en millimètres, et un segment posé juste au-dessus.' };
}

const regle: Family = {
  name: 'mesure-regle',
  minStage: 1,
  make: (rng, stage) => {
    // Au 1er trimestre du CM1, des centimètres entiers ; ensuite, des
    // millimètres (en gardant souvent un départ sur une graduation nette).
    const whole = stage === 1;
    const start = whole ? rngPick(rng, [0, 0, 10, 20, 30]) : rngPick(rng, [0, 10, 20, 30, 5, 15, 25]);
    const length = whole ? rngInt(rng, 2, 6) * 10 : rngInt(rng, 15, 65);
    const end = start + length;
    const format = (mm: number) => formatLength(mm, stage);
    // Le piège classique : lire la graduation d'arrivée sans retirer le départ.
    const wrong = [format(end), format(length + 10), format(length - 10), format(length + 20)];
    if (!whole) wrong.push(format(length + 5), format(length - 5), format(length + 1));
    return {
      detail: `${start}-${end}`,
      instruction: start === 0 ? 'Regarde où finit le segment' : 'Le segment ne commence pas à 0 : regarde où il commence, et où il finit',
      prompt: 'Combien mesure ce segment ?',
      figure: rulerFigure(start, end),
      ...choose(rng, format(length), wrong),
      explanation:
        start === 0
          ? `Le segment va de 0 à ${format(end)}. Il mesure ${format(length)}.`
          : `Le segment va de ${format(start)} à ${format(end)}. Il mesure ${format(end)} − ${format(start)} = ${format(length)}.`,
    };
  },
};

// --- Le périmètre ----------------------------------------------------------------------

/** La longueur d'un côté, écrite au milieu, à l'extérieur de la figure :
 *  sur un côté vertical, le texte s'écarte de sa demi-largeur, pour ne
 *  toucher ni le trait ni son codage. */
function sideLabel(from: Point, to: Point, center: Point, text: string): Shape {
  const middle: Point = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const [dx, dy] = [middle[0] - center[0], middle[1] - center[1]];
  const length = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [dx / length, dy / length];
  const halfWidth = (text.length * 13 * 0.56) / 2;
  const offset = 13 + Math.abs(nx) * halfWidth;
  return { kind: 'text', at: [middle[0] + nx * offset, middle[1] + ny * offset + 5], text, anchor: 'middle', size: 13, bold: true, halo: true };
}

/** Un polygone dont les côtés portent leur longueur : plus de marge qu'une
 *  figure nue, pour que les longueurs écrites tiennent dans le cadre. */
function labelledPolygon(points: Point[], marks: (fitted: Point[]) => Shape[], alt: string): Figure {
  const fitted = points.map(fitter(points, 300, 200, 44));
  return { width: 300, height: 200, shapes: [{ kind: 'polygon', points: fitted, fill: true }, ...marks(fitted)], alt };
}

const centroid = (points: Point[]): Point => [
  points.reduce((sum, [x]) => sum + x, 0) / points.length,
  points.reduce((sum, [, y]) => sum + y, 0) / points.length,
];

const perimetre: Family = {
  name: 'mesure-perimetre',
  minStage: 2,
  make: (rng) => {
    const count = rngPick(rng, [3, 4, 5]);
    const points = irregularPolygon(count, rng);
    let lengths: number[] = [];
    const figure = labelledPolygon(
      points,
      (fitted) => {
        lengths = fitted.map((point, index) => Math.max(2, Math.round(distance(point, fitted[(index + 1) % count]) / 22)));
        const center = centroid(fitted);
        return fitted.map((point, index) => sideLabel(point, fitted[(index + 1) % count], center, `${lengths[index]} cm`));
      },
      `Un polygone à ${count} côtés ; la longueur de chaque côté est écrite à côté.`
    );
    const total = lengths.reduce((sum, value) => sum + value, 0);
    const [shortest, longest] = [Math.min(...lengths), Math.max(...lengths)];
    return {
      detail: lengths.join('-'),
      instruction: 'Le périmètre, c\'est la longueur du tour de la figure',
      prompt: 'Quel est le périmètre de cette figure ?',
      figure,
      ...choose(rng, `${total} cm`, [`${total - shortest} cm`, `${total + longest} cm`, `${total + 1} cm`, `${total - 1} cm`]),
      explanation: `On ajoute les longueurs de tous les côtés : ${lengths.join(' + ')} = ${total} cm.`,
    };
  },
};

const perimetreFormule: Family = {
  name: 'mesure-perimetre-formule',
  minStage: 4,
  make: (rng) => {
    if (rng() < 0.4) {
      const side = rngInt(rng, 3, 9);
      const points: Point[] = [[0, 0], [side, 0], [side, side], [0, side]];
      return {
        detail: `carre-${side}`,
        instruction: 'Les côtés codés pareil ont la même longueur',
        prompt: 'Quel est le périmètre de ce carré ?',
        figure: labelledPolygon(
          points,
          (fitted) => [
            ...codageCotes(fitted, [1, 1, 1, 1]),
            ...fitted.map((_, index) => angleDroit(fitted, index)),
            sideLabel(fitted[0], fitted[1], centroid(fitted), `${side} cm`),
          ],
          'Un carré dont un côté porte sa longueur.'
        ),
        // Pour un carré de 4 cm, l'aire (16) égale le périmètre : d'autres
        // pièges prennent alors le relais.
        ...choose(rng, `${4 * side} cm`, [`${side * side} cm`, `${2 * side} cm`, `${side + 4} cm`, `${3 * side} cm`, `${4 * side + 2} cm`]),
        explanation: `Un carré a quatre côtés égaux : 4 × ${side} = ${4 * side} cm.`,
      };
    }
    const width = rngInt(rng, 4, 9);
    const height = rngInt(rng, 2, width - 1);
    const points: Point[] = [[0, 0], [width, 0], [width, height], [0, height]];
    const perimeter = 2 * (width + height);
    return {
      detail: `rectangle-${width}-${height}`,
      instruction: 'Les côtés codés pareil ont la même longueur',
      prompt: 'Quel est le périmètre de ce rectangle ?',
      figure: labelledPolygon(
        points,
        (fitted) => [
          ...codageCotes(fitted, [1, 2, 1, 2]),
          ...fitted.map((_, index) => angleDroit(fitted, index)),
          sideLabel(fitted[0], fitted[1], centroid(fitted), `${width} cm`),
          sideLabel(fitted[1], fitted[2], centroid(fitted), `${height} cm`),
        ],
        'Un rectangle : sa longueur et sa largeur sont écrites sur deux côtés.'
      ),
      ...choose(rng, `${perimeter} cm`, [`${width * height} cm`, `${width + height} cm`, `${2 * width + height} cm`, `${width + 2 * height} cm`, `${perimeter + 2} cm`]),
      explanation: `Périmètre du rectangle : 2 × (longueur + largeur) = 2 × (${width} + ${height}) = ${perimeter} cm.`,
    };
  },
};

// --- L'aire en carreaux ---------------------------------------------------------------

const AREA_ORIGIN: Point = [15, 15];
const AREA_CELL = 30;
const AREA_COLS = 9;
const AREA_ROWS = 6;

const nodeAt = ([col, row]: Node): Point => [AREA_ORIGIN[0] + col * AREA_CELL, AREA_ORIGIN[1] + row * AREA_CELL];
const key = ([col, row]: Node) => `${col},${row}`;

/** Une figure faite de carreaux entiers, d'un seul tenant et sans trou. */
export function polyomino(rng: Rng, size: number, cols: number, rows: number): Node[] {
  for (;;) {
    const cells: Node[] = [[rngInt(rng, 1, cols - 2), rngInt(rng, 1, rows - 2)]];
    const taken = new Set(cells.map(key));
    let guard = 0;
    while (cells.length < size && guard++ < 500) {
      const [col, row] = rngPick(rng, cells);
      const [dx, dy] = rngPick(rng, [[1, 0], [-1, 0], [0, 1], [0, -1]] as Node[]);
      const next: Node = [col + dx, row + dy];
      if (next[0] < 0 || next[1] < 0 || next[0] >= cols || next[1] >= rows || taken.has(key(next))) continue;
      cells.push(next);
      taken.add(key(next));
    }
    if (cells.length === size && !hasHole(cells, cols, rows)) return cells;
  }
}

/** Un trou : une case vide qu'on ne peut pas rejoindre depuis le bord. */
function hasHole(cells: Node[], cols: number, rows: number): boolean {
  const taken = new Set(cells.map(key));
  const seen = new Set<string>();
  const queue: Node[] = [[-1, -1]];
  while (queue.length > 0) {
    const [col, row] = queue.pop()!;
    if (col < -1 || row < -1 || col > cols || row > rows || seen.has(key([col, row])) || taken.has(key([col, row]))) continue;
    seen.add(key([col, row]));
    queue.push([col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]);
  }
  return (cols + 2) * (rows + 2) - seen.size - cells.length > 0;
}

type Piece = Node[];

/** Les côtés du bord d'une surface faite de morceaux (carreaux, demi-carreaux) :
 *  un côté partagé par deux morceaux est intérieur. */
export function boundary(pieces: Piece[]): [Node, Node][] {
  const counts = new Map<string, { edge: [Node, Node]; count: number }>();
  pieces.forEach((piece) =>
    piece.forEach((node, index) => {
      const next = piece[(index + 1) % piece.length];
      const [a, b] = key(node) < key(next) ? [node, next] : [next, node];
      const id = `${key(a)}|${key(b)}`;
      const entry = counts.get(id);
      if (entry) entry.count++;
      else counts.set(id, { edge: [a, b], count: 1 });
    })
  );
  return [...counts.values()].filter(({ count }) => count === 1).map(({ edge }) => edge);
}

const squareOf = ([col, row]: Node): Piece => [[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1]];

function areaFigure(pieces: Piece[], alt: string): Figure {
  return {
    width: 300,
    height: 210,
    shapes: [
      { kind: 'quadrillage', origin: AREA_ORIGIN, cols: AREA_COLS, rows: AREA_ROWS, cell: AREA_CELL },
      { kind: 'aire', rings: pieces.map((piece) => piece.map(nodeAt)), ground: 'couleur', ink: 'aucune' },
      ...boundary(pieces).map(([a, b]): Shape => ({ kind: 'segment', from: nodeAt(a), to: nodeAt(b), width: 2.5 })),
    ],
    alt,
  };
}

const aireCarreaux: Family = {
  name: 'mesure-aire-carreaux',
  minStage: 3,
  make: (rng) => {
    const cells = polyomino(rng, rngInt(rng, 5, 11), AREA_COLS, AREA_ROWS);
    const pieces = cells.map(squareOf);
    const perimeter = boundary(pieces).length;
    const count = cells.length;
    // Le périmètre est toujours proposé : c'est la confusion à déjouer.
    const wrong = [`${perimeter} carreaux`, rngPick(rng, [`${count + 1} carreaux`, `${count + 2} carreaux`]), `${count - 1} carreaux`];
    return {
      detail: cells.map(key).sort().join(';'),
      instruction: 'L\'unité d\'aire est le carreau',
      prompt: 'Quelle est l\'aire de la figure coloriée ?',
      figure: areaFigure(pieces, 'Un quadrillage où une figure faite de carreaux entiers est coloriée.'),
      ...choose(rng, `${count} carreaux`, wrong),
      explanation: `Il y a ${count} carreaux coloriés. Le tour de la figure mesure ${perimeter} côtés de carreau : c'est son périmètre, pas son aire.`,
    };
  },
};

/** Un demi-carreau accolé à la figure : un triangle rectangle dans une case
 *  vide, dont un côté de l'angle droit est commun avec un carreau. */
function halfSquares(rng: Rng, cells: Node[], count: number): Piece[] {
  const taken = new Set(cells.map(key));
  const halves: Piece[] = [];
  const used = new Set<string>();
  const candidates = cells.flatMap(([col, row]) =>
    ([[1, 0], [-1, 0], [0, 1], [0, -1]] as Node[]).map(([dx, dy]): [Node, Node] => [[col + dx, row + dy], [dx, dy]])
  );
  for (const [cell, [dx, dy]] of rngShuffle(rng, candidates)) {
    if (halves.length === count) break;
    const [col, row] = cell;
    if (col < 0 || row < 0 || col >= AREA_COLS || row >= AREA_ROWS || taken.has(key(cell)) || used.has(key(cell))) continue;
    // Le côté commun avec le carreau voisin, puis le sommet de l'angle droit.
    const square = squareOf(cell);
    const shared: [Node, Node] =
      dx === 1 ? [square[0], square[3]] : dx === -1 ? [square[1], square[2]] : dy === 1 ? [square[0], square[1]] : [square[3], square[2]];
    const corner = rng() < 0.5 ? 0 : 1;
    const others = square.filter((node) => !shared.some((end) => end[0] === node[0] && end[1] === node[1]));
    // L'angle droit est à une extrémité du côté commun : le troisième sommet
    // est le voisin de cette extrémité, hors du côté commun.
    const apex = others.find((node) => Math.abs(node[0] - shared[corner][0]) + Math.abs(node[1] - shared[corner][1]) === 1)!;
    halves.push([shared[0], shared[1], apex]);
    used.add(key(cell));
  }
  return halves;
}

const aireDemi: Family = {
  name: 'mesure-aire-demi',
  minStage: 5,
  make: (rng) => {
    for (;;) {
      const cells = polyomino(rng, rngInt(rng, 4, 8), AREA_COLS, AREA_ROWS);
      const halvesCount = rngInt(rng, 1, 3);
      const halves = halfSquares(rng, cells, halvesCount);
      if (halves.length < halvesCount) continue;
      const total = cells.length + halvesCount / 2;
      const format = (value: number) => `${String(value).replace('.', ',')} carreaux`;
      return {
        detail: [...cells.map(key).sort(), ...halves.map((half) => half.map(key).join('/'))].join(';'),
        instruction: 'Deux demi-carreaux font un carreau',
        prompt: 'Quelle est l\'aire de la figure coloriée ?',
        figure: areaFigure([...cells.map(squareOf), ...halves], 'Un quadrillage où une figure faite de carreaux et de demi-carreaux est coloriée.'),
        ...choose(rng, format(total), [
          format(cells.length + halvesCount),
          format(cells.length),
          format(total + 1),
          format(total - 1),
          format(total + 0.5),
          format(total - 0.5),
        ]),
        explanation: `${cells.length} carreaux entiers, et ${halvesCount} demi-carreau${halvesCount > 1 ? 'x' : ''} qui font ${String(halvesCount / 2).replace('.', ',')} carreau${halvesCount >= 4 ? 'x' : ''}. En tout : ${format(total)}.`,
      };
    }
  },
};

const aireRectangle: Family = {
  name: 'mesure-aire-rectangle',
  minStage: 5,
  make: (rng) => {
    const width = rngInt(rng, 3, 9);
    const height = rngInt(rng, 2, Math.min(6, width));
    const points: Point[] = [[0, 0], [width, 0], [width, height], [0, height]];
    const area = width * height;
    const square = width === height;
    return {
      detail: `${width}-${height}`,
      instruction: 'L\'aire se mesure en centimètres carrés (cm²)',
      prompt: `Quelle est l'aire de ce ${square ? 'carré' : 'rectangle'} ?`,
      figure: labelledPolygon(
        points,
        (fitted) => [
          ...fitted.map((_, index) => angleDroit(fitted, index)),
          sideLabel(fitted[0], fitted[1], centroid(fitted), `${width} cm`),
          sideLabel(fitted[1], fitted[2], centroid(fitted), `${height} cm`),
        ],
        `Un ${square ? 'carré' : 'rectangle'} : ses deux dimensions sont écrites sur deux côtés.`
      ),
      ...choose(rng, `${area} cm²`, [`${2 * (width + height)} cm²`, `${width + height} cm²`, `${area} cm`, `${area + width} cm²`]),
      explanation: `Aire ${square ? 'du carré : côté × côté' : 'du rectangle : longueur × largeur'} = ${width} × ${height} = ${area} cm².`,
    };
  },
};

export const MEASURE_FAMILIES: Family[] = [regle, perimetre, aireCarreaux, perimetreFormule, aireDemi, aireRectangle];
