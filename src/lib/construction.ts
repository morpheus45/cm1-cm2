import type { Point, Shape } from './figures';

/**
 * Les constructions : au lieu de choisir une réponse, l'élève pose des points
 * sur un quadrillage, au doigt, au stylet ou au clavier — compléter une
 * figure par symétrie, reproduire une figure, tracer une parallèle, placer
 * un point dans une case.
 *
 * Tout se passe sur les nœuds (croisements) ou les cases d'une grille : un
 * doigt n'a pas besoin d'être précis, le point posé va au nœud le plus
 * proche. La vérification est exacte : on compare des nœuds, pas des pixels.
 */

/** Un nœud de la grille, ou une case : (colonne, ligne), l'origine en haut à
 *  gauche, des entiers. */
export type Node = [number, number];

export interface ConstructionGrid {
  /** Le coin haut gauche de la grille, en unités de la figure. */
  origin: Point;
  cols: number;
  rows: number;
  /** Le côté d'un carreau, en unités de la figure. */
  cell: number;
}

export type ConstructionRule =
  /** Poser exactement ces nœuds (ou ces cases), dans n'importe quel ordre. */
  | { kind: 'points'; expected: Node[] }
  /** Poser un nœud qui, avec `from`, trace une droite parallèle ou
   *  perpendiculaire à la direction `along`. */
  | { kind: 'direction'; from: Node; along: Node; relation: 'parallele' | 'perpendiculaire' };

export interface Construction {
  grid: ConstructionGrid;
  /** Ce que l'élève touche : les nœuds de la grille, ou ses cases. */
  target: 'noeud' | 'case';
  /** Combien de points poser. */
  count: number;
  rule: ConstructionRule;
  /** La correction, tracée une fois la réponse donnée ; ses traits sont à
   *  l'encre `couleur`, que l'écran met en vert. */
  solution: Shape[];
  /** Ce que l'écran trace au fil des points : la droite qui passe par
   *  `through` et le point posé. */
  preview?: { kind: 'droite'; through: Node };
  /** Le symbole posé : un point, ou une étoile dans une case. */
  mark?: 'point' | 'etoile';
  /** Les points déjà donnés (départ, sommets connus) : on n'y pose rien. */
  fixed?: Node[];
}

export function nodePoint({ origin, cell }: ConstructionGrid, [col, row]: Node): Point {
  return [origin[0] + col * cell, origin[1] + row * cell];
}

export function cellCenter({ origin, cell }: ConstructionGrid, [col, row]: Node): Point {
  return [origin[0] + (col + 0.5) * cell, origin[1] + (row + 0.5) * cell];
}

/** Où va un point touché : au nœud le plus proche, ou dans la case qui le
 *  contient ; `null` s'il tombe hors de la grille (à une demi-case près). */
export function snap(grid: ConstructionGrid, target: Construction['target'], [x, y]: Point): Node | null {
  const u = (x - grid.origin[0]) / grid.cell;
  const v = (y - grid.origin[1]) / grid.cell;
  if (target === 'case') {
    const [col, row] = [Math.floor(u), Math.floor(v)];
    return col >= 0 && row >= 0 && col < grid.cols && row < grid.rows ? [col, row] : null;
  }
  if (u < -0.5 || v < -0.5 || u > grid.cols + 0.5 || v > grid.rows + 0.5) return null;
  return [Math.min(grid.cols, Math.max(0, Math.round(u))), Math.min(grid.rows, Math.max(0, Math.round(v)))];
}

export const sameNode = (a: Node, b: Node) => a[0] === b[0] && a[1] === b[1];

/** Ce point posé est-il juste, à lui seul ? Pour colorer la correction. */
export function isPlacedRight(construction: Construction, node: Node): boolean {
  const { rule } = construction;
  if (rule.kind === 'points') return rule.expected.some((expected) => sameNode(expected, node));
  const [dx, dy] = [node[0] - rule.from[0], node[1] - rule.from[1]];
  if (dx === 0 && dy === 0) return false;
  const [ax, ay] = rule.along;
  return rule.relation === 'parallele' ? dx * ay - dy * ax === 0 : dx * ax + dy * ay === 0;
}

/** La construction est-elle juste ? Autant de points que demandé, tous
 *  justes, sans doublon — et, pour une liste de points, tous présents. */
export function isConstructionRight(construction: Construction, placed: Node[]): boolean {
  if (placed.length !== construction.count) return false;
  const distinct = placed.every((node, index) => placed.findIndex((other) => sameNode(other, node)) === index);
  return distinct && placed.every((node) => isPlacedRight(construction, node));
}

/** La droite qui passe par deux nœuds, coupée aux bords de la grille : pour
 *  la tracer d'un bord à l'autre. */
export function lineAcrossGrid(grid: ConstructionGrid, a: Node, b: Node): [Point, Point] | null {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  if (dx === 0 && dy === 0) return null;
  // Les valeurs de t où la droite a + t·(b - a) quitte le rectangle de la grille.
  let low = -Infinity;
  let high = Infinity;
  const clip = (start: number, delta: number, max: number) => {
    if (delta === 0) return;
    const [t1, t2] = [(0 - start) / delta, (max - start) / delta].sort((m, n) => m - n);
    low = Math.max(low, t1);
    high = Math.min(high, t2);
  };
  clip(a[0], dx, grid.cols);
  clip(a[1], dy, grid.rows);
  if (low > high) return null;
  const at = (t: number): Point => nodePoint(grid, [a[0] + dx * t, a[1] + dy * t] as Node);
  return [at(low), at(high)];
}

/** Un nœud valable pour la règle de direction, quand il en faut un pour
 *  montrer la correction : le plus proche de `from` dans la grille. */
export function directionAnswer(grid: ConstructionGrid, rule: Extract<ConstructionRule, { kind: 'direction' }>): Node | null {
  const [ax, ay] = rule.along;
  const [sx, sy] = rule.relation === 'parallele' ? [ax, ay] : [-ay, ax];
  const divisor = gcd(Math.abs(sx), Math.abs(sy)) || 1;
  const [stepX, stepY] = [sx / divisor, sy / divisor];
  for (let k = 1; k <= Math.max(grid.cols, grid.rows); k++) {
    for (const sign of [1, -1]) {
      const node: Node = [rule.from[0] + sign * k * stepX, rule.from[1] + sign * k * stepY];
      if (node[0] >= 0 && node[1] >= 0 && node[0] <= grid.cols && node[1] <= grid.rows) return node;
    }
  }
  return null;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
