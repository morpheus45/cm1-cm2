import type { Figure, Point, Shape } from '../lib/figures';
import { rngInt, rngPick, type Rng } from '../lib/seededRandom';
import {
  cellCenter,
  directionAnswer,
  lineAcrossGrid,
  nodePoint,
  type Construction,
  type ConstructionGrid,
  type Node,
} from '../lib/construction';
import { GRID_COLUMNS, GRID_ROWS } from './geometrieFigures';
import { NO_CHOICES, type Family } from './geometrieCommun';

/**
 * Les constructions de géométrie : l'élève pose des points au doigt sur un
 * quadrillage, l'application vérifie (src/lib/construction.ts).
 *
 * Progression, cumulative :
 * - CM1, 1er trimestre : placer l'étoile dans une case ; reproduire une
 *   figure simple ;
 * - CM1, 2e : compléter un carré, un rectangle ; tracer une parallèle, une
 *   perpendiculaire (droites horizontales, verticales, à 45°) ;
 * - CM1, 3e : compléter une figure par symétrie (axe vertical ou horizontal) ;
 * - CM2, 1er : figures plus riches à reproduire, carrés penchés, droites
 *   obliques ;
 * - CM2, 2e : symétrie par rapport à un axe penché ;
 * - CM2, 3e : agrandir une figure (proportionnalité).
 */

/** La grille des constructions : 9 carreaux sur 6. */
export const BUILD_GRID: ConstructionGrid = { origin: [15, 15], cols: 9, rows: 6, cell: 30 };
const BUILD_WIDTH = 300;
const BUILD_HEIGHT = 210;

const at = (node: Node, grid = BUILD_GRID) => nodePoint(grid, node);
const add = (a: Node, b: Node): Node => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Node, b: Node): Node => [a[0] - b[0], a[1] - b[1]];
const scale = (a: Node, k: number): Node => [a[0] * k, a[1] * k];
const inGrid = ([col, row]: Node, grid = BUILD_GRID) => col >= 0 && row >= 0 && col <= grid.cols && row <= grid.rows;

function gridFigure(extra: Shape[], alt: string, grid = BUILD_GRID, width = BUILD_WIDTH, height = BUILD_HEIGHT): Figure {
  return {
    width,
    height,
    shapes: [{ kind: 'quadrillage', origin: grid.origin, cols: grid.cols, rows: grid.rows, cell: grid.cell }, ...extra],
    alt,
  };
}

/** Le nom d'un sommet, posé à l'écart de la figure (à l'opposé de son
 *  centre), avec un halo pour rester lisible sur le quadrillage ; près d'un
 *  bord du cadre, il passe à l'intérieur. */
function vertexLabel(node: Node, center: Point, text: string, ink: 'encre' | 'couleur' = 'encre'): Shape {
  const [x, y] = at(node);
  const [dx, dy] = [x - center[0], y - center[1]];
  const length = Math.hypot(dx, dy) || 1;
  const place = (sign: number): Point => [x + sign * (dx / length) * 13, y + sign * (dy / length) * 13 + 5];
  const fits = ([px, py]: Point) => px >= 8 && px <= BUILD_WIDTH - 8 && py >= 14 && py <= BUILD_HEIGHT - 3;
  const outside = place(1);
  return { kind: 'text', at: fits(outside) ? outside : place(-1), text, anchor: 'middle', bold: true, size: 14, ink, halo: true };
}

const centerOf = (nodes: Node[]): Point => {
  const points = nodes.map((node) => at(node));
  return [points.reduce((sum, [x]) => sum + x, 0) / points.length, points.reduce((sum, [, y]) => sum + y, 0) / points.length];
};

function build(construction: Omit<Construction, 'grid'> & { grid?: ConstructionGrid }): Construction {
  return { grid: BUILD_GRID, ...construction };
}

// --- Placer l'étoile dans une case -------------------------------------------------

export const CASE_GRID: ConstructionGrid = { origin: [85, 30], cols: 5, rows: 5, cell: 32 };

const constructionCase: Family = {
  name: 'construire-case',
  minStage: 1,
  make: (rng) => {
    const cell: Node = [rngInt(rng, 0, 4), rngInt(rng, 0, 4)];
    const name = `${GRID_COLUMNS[cell[0]]}${GRID_ROWS[cell[1]]}`;
    const { origin, cell: size } = CASE_GRID;
    const labels: Shape[] = [
      ...GRID_COLUMNS.map((letter, index): Shape => ({ kind: 'text', at: [origin[0] + size * index + size / 2, origin[1] - 8], text: letter, anchor: 'middle', bold: true })),
      ...GRID_ROWS.map((digit, index): Shape => ({ kind: 'text', at: [origin[0] - 10, origin[1] + size * index + size / 2 + 6], text: digit, anchor: 'end', bold: true })),
    ];
    return {
      detail: name,
      instruction: 'La lettre de la colonne, puis le chiffre de la ligne',
      prompt: `Pose l'étoile dans la case **${name}**.`,
      figure: gridFigure(labels, 'Un quadrillage de cinq colonnes, A à E, et cinq lignes, 1 à 5.', CASE_GRID, 300, 200),
      ...NO_CHOICES,
      construction: {
        grid: CASE_GRID,
        target: 'case',
        count: 1,
        rule: { kind: 'points', expected: [cell] },
        mark: 'etoile',
        solution: [{ kind: 'etoile', at: cellCenter(CASE_GRID, cell), radius: 12, ink: 'couleur' }],
      },
      explanation: `La case ${name} : la colonne ${GRID_COLUMNS[cell[0]]}, puis la ligne ${GRID_ROWS[cell[1]]}.`,
    };
  },
};

// --- Reproduire, agrandir ------------------------------------------------------------

/** Des figures à reproduire, sommets sur les nœuds, dans l'ordre du tour. */
export const SIMPLE_SHAPES: Node[][] = [
  [[0, 0], [3, 3], [0, 3]],
  [[1, 0], [3, 3], [0, 4]],
  [[0, 0], [3, 0], [3, 2], [0, 2]],
  [[0, 0], [2, 0], [2, 2], [0, 2]],
  [[1, 0], [2, 0], [3, 3], [0, 3]],
  [[1, 0], [3, 0], [2, 3], [0, 3]],
  [[1, 0], [2, 2], [1, 4], [0, 2]],
];

export const RICH_SHAPES: Node[][] = [
  [[0, 2], [1, 0], [2, 2], [2, 4], [0, 4]],
  [[0, 0], [3, 0], [3, 1], [1, 1], [1, 3], [0, 3]],
  [[0, 0], [2, 1], [3, 0], [3, 3], [0, 3]],
  [[1, 0], [3, 1], [2, 4], [0, 3]],
];

/** Des petites figures à agrandir deux fois. */
export const SMALL_SHAPES: Node[][] = [
  [[0, 0], [2, 0], [2, 1], [0, 1]],
  [[0, 0], [2, 2], [0, 2]],
  [[0, 0], [1, 0], [2, 2], [0, 2]],
  [[1, 0], [2, 1], [1, 3], [0, 1]],
  [[0, 0], [2, 0], [1, 3]],
];

const extent = (nodes: Node[]) => [Math.max(...nodes.map(([col]) => col)), Math.max(...nodes.map(([, row]) => row))];

/** Le modèle à gauche, la copie à droite, départ donné : l'élève pose les
 *  autres sommets. `factor` 2 pour agrandir. */
function copyQuestion(rng: Rng, shape: Node[], factor: 1 | 2, shapeIndex: number) {
  const [w, h] = extent(shape);
  const modelOffset: Node = [0, rngInt(rng, 0, BUILD_GRID.rows - h)];
  const model = shape.map((node) => add(node, modelOffset));
  const copyOffset: Node = [rngInt(rng, 5 - (factor - 1), BUILD_GRID.cols - w * factor), rngInt(rng, 0, BUILD_GRID.rows - h * factor)];
  const copy = shape.map((node) => add(scale(node, factor), copyOffset));
  const [start, ...rest] = copy;
  const separator = BUILD_GRID.origin[0] + (factor === 2 ? 3.5 : 4.5) * BUILD_GRID.cell;
  return {
    detail: `${shapeIndex}-${copyOffset.join('.')}-${modelOffset[1]}`,
    figure: gridFigure(
      [
        { kind: 'segment', from: [separator, BUILD_GRID.origin[1]], to: [separator, BUILD_GRID.origin[1] + BUILD_GRID.rows * BUILD_GRID.cell], ink: 'pale', dashed: true, width: 1.5 },
        { kind: 'polygon', points: model.map((node) => at(node)) },
        { kind: 'circle', center: at(start), radius: 5, fill: true },
      ],
      factor === 2
        ? 'Un quadrillage : à gauche, une petite figure ; à droite, le premier sommet de la figure agrandie.'
        : 'Un quadrillage : à gauche, une figure modèle ; à droite, le premier sommet de sa copie.'
    ),
    ...NO_CHOICES,
    construction: build({
      target: 'noeud',
      count: rest.length,
      rule: { kind: 'points', expected: rest },
      fixed: [start],
      solution: [{ kind: 'polygon', points: copy.map((node) => at(node)), ink: 'couleur' }],
    }),
  };
}

const constructionReproduire: Family = {
  name: 'construire-reproduire',
  minStage: 1,
  make: (rng, stage) => {
    const shapes = stage >= 4 ? [...SIMPLE_SHAPES, ...RICH_SHAPES] : SIMPLE_SHAPES;
    const index = rngInt(rng, 0, shapes.length - 1);
    return {
      ...copyQuestion(rng, shapes[index], 1, index),
      instruction: 'Le premier sommet est déjà placé',
      prompt: 'Reproduis la figure à droite : pose ses autres sommets.',
      explanation: 'Sur le modèle, compte les carreaux d\'un sommet à l\'autre. Refais les mêmes pas à partir du point de départ.',
    };
  },
};

const constructionAgrandir: Family = {
  name: 'construire-agrandir',
  minStage: 6,
  make: (rng) => {
    const index = rngInt(rng, 0, SMALL_SHAPES.length - 1);
    return {
      ...copyQuestion(rng, SMALL_SHAPES[index], 2, index),
      instruction: 'Chaque longueur est multipliée par 2',
      prompt: 'Agrandis la figure deux fois : pose ses autres sommets.',
      explanation: 'Agrandir deux fois : chaque côté devient deux fois plus long. Les angles ne changent pas.',
    };
  },
};

// --- Compléter un carré, un rectangle --------------------------------------------------

const constructionCompleter: Family = {
  name: 'construire-completer',
  minStage: 2,
  make: (rng, stage) => {
    for (let attempt = 0; ; attempt++) {
      const square = rng() < 0.5;
      const tilted = stage >= 4 && rng() < 0.5;
      let u: Node;
      let v: Node;
      if (tilted) {
        u = rngPick(rng, [[2, 1], [1, 2], [3, 1], [2, -1], [1, -2]] as Node[]);
        v = scale([-u[1], u[0]], square ? 1 : 2);
        if (!square && Math.hypot(...v) > 5) v = [-u[1], u[0]];
      } else {
        const w = rngInt(rng, 2, square ? 4 : 5);
        const h = square ? w : rngInt(rng, 2, 4);
        u = [w, 0];
        v = [0, h];
        if (!square && w === h) continue;
      }
      // Tourner d'un quart de tour : (u, v) devient (v, -u), toujours
      // perpendiculaires.
      if (rng() < 0.5) [u, v] = [v, [-u[0], -u[1]]];
      const a: Node = [rngInt(rng, 0, BUILD_GRID.cols), rngInt(rng, 0, BUILD_GRID.rows)];
      const b = add(a, u);
      const c = add(b, v);
      const d = add(a, v);
      const isSquare = Math.hypot(...u) === Math.hypot(...v);
      if (![b, c, d].every((node) => inGrid(node)) || (tilted && !square && isSquare)) {
        if (attempt > 200) throw new Error('Aucun rectangle ne tient dans la grille.');
        continue;
      }
      const name = isSquare ? 'carré' : 'rectangle';
      const center = centerOf([a, b, c, d]);
      return {
        detail: `${a.join('.')}-${u.join('.')}-${v.join('.')}`,
        instruction: tilted ? 'La figure est penchée : compte les carreaux de chaque côté' : 'Compte les carreaux de chaque côté',
        prompt: `Place le point D pour que ABCD soit un **${name}**.`,
        figure: gridFigure(
          [
            { kind: 'polyline', points: [at(a), at(b), at(c)] },
            ...[a, b, c].map((node): Shape => ({ kind: 'point', at: at(node) })),
            vertexLabel(a, center, 'A'),
            vertexLabel(b, center, 'B'),
            vertexLabel(c, center, 'C'),
          ],
          `Un quadrillage : trois sommets A, B et C d'un ${name}, et ses côtés [AB] et [BC].`
        ),
        ...NO_CHOICES,
        construction: build({
          target: 'noeud',
          count: 1,
          rule: { kind: 'points', expected: [d] },
          fixed: [a, b, c],
          solution: [{ kind: 'polyline', points: [at(c), at(d), at(a)], ink: 'couleur' }, vertexLabel(d, center, 'D', 'couleur')],
        }),
        explanation: isSquare
          ? 'Un carré a quatre côtés de même longueur. De C à D, refais le chemin de B à A.'
          : 'Dans un rectangle, les côtés opposés ont la même longueur. De C à D, refais le chemin de B à A.',
      };
    }
  },
};

// --- Tracer une parallèle, une perpendiculaire -----------------------------------------

const cross = (a: Node, b: Node) => a[0] * b[1] - a[1] * b[0];

const constructionDroite: Family = {
  name: 'construire-droite',
  minStage: 2,
  make: (rng, stage) => {
    const directions: Node[] = stage >= 4 ? [[2, 1], [1, 2], [2, -1], [1, -2], [3, 1], [3, -1]] : [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let attempt = 0; ; attempt++) {
      if (attempt > 300) throw new Error('Aucune droite ne tient dans la grille.');
      const relation = rng() < 0.5 ? 'parallele' : 'perpendiculaire';
      const along = rngPick(rng, directions);
      const p: Node = [rngInt(rng, 1, BUILD_GRID.cols - 1), rngInt(rng, 1, BUILD_GRID.rows - 1)];
      const m: Node = [rngInt(rng, 0, BUILD_GRID.cols), rngInt(rng, 0, BUILD_GRID.rows)];
      // M hors de (d), à un carreau au moins.
      if (Math.abs(cross(sub(m, p), along)) / Math.hypot(...along) < 1) continue;
      const rule = { kind: 'direction' as const, from: m, along, relation: relation as 'parallele' | 'perpendiculaire' };
      const answer = directionAnswer(BUILD_GRID, rule);
      const line = lineAcrossGrid(BUILD_GRID, p, add(p, along));
      const expectedLine = answer ? lineAcrossGrid(BUILD_GRID, m, answer) : null;
      if (!answer || !line || !expectedLine) continue;
      // Les deux droites doivent se voir : au moins deux carreaux de long.
      const long = ([from, to]: [Point, Point]) => Math.hypot(to[0] - from[0], to[1] - from[1]) >= 2 * BUILD_GRID.cell;
      if (!long(line) || !long(expectedLine)) continue;
      const [start, end] = line;
      const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
      const [ux, uy] = [(end[0] - start[0]) / length, (end[1] - start[1]) / length];
      // Le nom de (d), près d'une extrémité, du côté du centre de la grille.
      const middle = centerOf([[0, 0], [BUILD_GRID.cols, BUILD_GRID.rows]]);
      const sides: Point[] = [[-uy, ux], [uy, -ux]];
      const [nx, ny] = sides.sort(
        (a, b) =>
          Math.hypot(start[0] + a[0] * 14 - middle[0], start[1] + a[1] * 14 - middle[1]) -
          Math.hypot(start[0] + b[0] * 14 - middle[0], start[1] + b[1] * 14 - middle[1])
      )[0];
      const labelAt: Point = [start[0] + ux * 24 + nx * 14, start[1] + uy * 24 + ny * 14 + 5];
      const mPoint = at(m);
      // Le nom de M, à droite, ou à gauche près du bord droit ; dessous près du haut.
      const mLabel: Shape = {
        kind: 'text',
        at: [mPoint[0] + (m[0] >= BUILD_GRID.cols - 1 ? -9 : 9), mPoint[1] + (m[1] === 0 ? 18 : -7)],
        text: 'M',
        bold: true,
        size: 14,
        halo: true,
        anchor: m[0] >= BUILD_GRID.cols - 1 ? 'end' : 'start',
      };
      return {
        detail: `${relation}-${along.join('.')}-${p.join('.')}-${m.join('.')}`,
        instruction: 'La droite passe par M et par le point que tu poses',
        prompt:
          relation === 'parallele'
            ? 'Trace la droite **parallèle** à (d) qui passe par M : pose un deuxième point.'
            : 'Trace la droite **perpendiculaire** à (d) qui passe par M : pose un deuxième point.',
        figure: gridFigure(
          [
            { kind: 'segment', from: start, to: end, width: 2.5 },
            { kind: 'text', at: labelAt, text: '(d)', anchor: 'middle', bold: true, size: 14, halo: true },
            { kind: 'point', at: mPoint },
            mLabel,
          ],
          `Un quadrillage avec une droite (d) et un point M qui n'est pas sur (d).`
        ),
        ...NO_CHOICES,
        construction: build({
          target: 'noeud',
          count: 1,
          rule,
          fixed: [m],
          preview: { kind: 'droite', through: m },
          solution: [{ kind: 'segment', from: expectedLine[0], to: expectedLine[1], ink: 'couleur', width: 2.5, dashed: true }],
        }),
        explanation:
          relation === 'parallele'
            ? 'Une parallèle à (d) avance comme (d) : autant de carreaux, dans le même sens. Elle ne la coupera jamais.'
            : 'La perpendiculaire forme un angle droit avec (d) : vérifie avec ton équerre.',
      };
    }
  },
};

// --- Compléter par symétrie ------------------------------------------------------------

/** Des demi-figures, en (écart à l'axe, ligne) : elles partent de l'axe et y
 *  reviennent ; les sommets hors de l'axe sont à placer. */
export const HALF_SHAPES: [number, number][][] = [
  [[0, 0], [2, 2], [2, 5], [0, 5]],
  [[0, 1], [3, 1], [3, 3], [1, 4], [0, 4]],
  [[0, 0], [2, 0], [1, 2], [3, 5], [0, 5]],
  [[0, 0], [1, 2], [3, 2], [3, 4], [0, 6]],
  [[0, 1], [2, 0], [3, 2], [2, 4], [0, 3]],
  [[0, 0], [3, 3], [1, 3], [1, 6], [0, 6]],
];

/** Des demi-figures pour l'axe penché (la diagonale colonne = ligne) : les
 *  sommets hors de l'axe sont au-dessus (colonne > ligne). */
export const DIAGONAL_SHAPES: Node[][] = [
  [[0, 0], [3, 0], [4, 2], [4, 4]],
  [[1, 1], [4, 1], [5, 3], [5, 5]],
  [[0, 0], [2, 0], [2, 1], [5, 1], [5, 5]],
  [[2, 2], [5, 0], [6, 3], [6, 6]],
];

type Axis = 'vertical' | 'horizontal' | 'penche';

/** La figure donnée, son symétrique, et l'axe tracé. */
export function mirrorShape(axis: Axis, index: number, flip: boolean, shift: number): { given: Node[]; mirrored: Node[]; axisLine: [Node, Node] } {
  if (axis === 'penche') {
    const given = DIAGONAL_SHAPES[index];
    const mirrored = given.map(([col, row]): Node => [row, col]);
    return flip ? { given: mirrored, mirrored: given, axisLine: [[0, 0], [1, 1]] } : { given, mirrored, axisLine: [[0, 0], [1, 1]] };
  }
  const half = HALF_SHAPES[index];
  const sign = flip ? 1 : -1;
  if (axis === 'vertical') {
    const axisCol = 5;
    return {
      given: half.map(([d, row]): Node => [axisCol + sign * d, row]),
      mirrored: half.map(([d, row]): Node => [axisCol - sign * d, row]),
      axisLine: [[axisCol, 0], [axisCol, 1]],
    };
  }
  const axisRow = 3;
  return {
    given: half.map(([d, col]): Node => [col + shift, axisRow + sign * d]),
    mirrored: half.map(([d, col]): Node => [col + shift, axisRow - sign * d]),
    axisLine: [[0, axisRow], [1, axisRow]],
  };
}

const constructionSymetrie: Family = {
  name: 'construire-symetrie',
  minStage: 3,
  make: (rng, stage) => {
    const axes: Axis[] = stage >= 5 ? ['vertical', 'horizontal', 'penche', 'penche'] : ['vertical', 'horizontal'];
    const axis = rngPick(rng, axes);
    // Pour un axe horizontal, les demi-figures ne dépassent pas 3 carreaux.
    const candidates = axis === 'penche'
      ? DIAGONAL_SHAPES.map((_, index) => index)
      : HALF_SHAPES.map((shape, index) => ({ shape, index })).filter(({ shape }) => axis === 'vertical' || Math.max(...shape.map(([d]) => d)) <= 3).map(({ index }) => index);
    const index = rngPick(rng, candidates);
    const flip = rng() < 0.5;
    const shift = rngInt(rng, 0, 3);
    const { given, mirrored, axisLine } = mirrorShape(axis, index, flip, shift);
    const onAxis = (node: Node, image: Node) => node[0] === image[0] && node[1] === image[1];
    const expected = mirrored.filter((image, i) => !onAxis(given[i], image));
    const [from, to] = lineAcrossGrid(BUILD_GRID, ...axisLine)!;
    return {
      detail: `${axis}-${index}-${flip}-${shift}`,
      instruction: 'L\'axe de symétrie est la droite en couleur',
      prompt: 'Complète la figure par symétrie : pose les sommets qui manquent.',
      figure: gridFigure(
        [
          { kind: 'segment', from, to, ink: 'couleur', width: 3 },
          { kind: 'polyline', points: given.map((node) => at(node)) },
        ],
        'Un quadrillage avec un axe de symétrie en couleur et la moitié d\'une figure.'
      ),
      ...NO_CHOICES,
      construction: build({
        target: 'noeud',
        count: expected.length,
        rule: { kind: 'points', expected },
        fixed: given,
        solution: [{ kind: 'polyline', points: mirrored.map((node) => at(node)), ink: 'couleur' }],
      }),
      explanation:
        axis === 'penche'
          ? 'L\'axe est penché. Chaque point et son symétrique sont à la même distance de l\'axe, chacun d\'un côté.'
          : 'Compte les carreaux jusqu\'à l\'axe. Puis compte-en autant de l\'autre côté.',
    };
  },
};

export const CONSTRUCTION_FAMILIES: Family[] = [
  constructionCase,
  constructionReproduire,
  constructionCompleter,
  constructionDroite,
  constructionSymetrie,
  constructionAgrandir,
];
