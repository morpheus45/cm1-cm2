import { describe, expect, it } from 'vitest';
import {
  directionAnswer,
  isConstructionRight,
  isPlacedRight,
  lineAcrossGrid,
  nodePoint,
  snap,
  type Construction,
  type ConstructionGrid,
  type Node,
} from './construction';

const grid: ConstructionGrid = { origin: [10, 20], cols: 6, rows: 4, cell: 30 };

const points = (expected: Node[]): Construction => ({
  grid,
  target: 'noeud',
  count: expected.length,
  rule: { kind: 'points', expected },
  solution: [],
});

const direction = (relation: 'parallele' | 'perpendiculaire', along: Node): Construction => ({
  grid,
  target: 'noeud',
  count: 1,
  rule: { kind: 'direction', from: [2, 2], along, relation },
  solution: [],
});

describe('la grille', () => {
  it('pose un point touché au nœud le plus proche', () => {
    expect(snap(grid, 'noeud', nodePoint(grid, [2, 3]))).toEqual([2, 3]);
    expect(snap(grid, 'noeud', [10 + 2 * 30 + 12, 20 + 3 * 30 - 14])).toEqual([2, 3]);
    expect(snap(grid, 'noeud', [10 + 2 * 30 + 16, 20 + 3 * 30])).toEqual([3, 3]);
    // Un peu hors de la grille : on ramène au bord ; trop loin : rien.
    expect(snap(grid, 'noeud', [5, 15])).toEqual([0, 0]);
    expect(snap(grid, 'noeud', [-20, 15])).toBeNull();
  });

  it('choisit la case qui contient le point touché', () => {
    expect(snap(grid, 'case', [10 + 30 * 2 + 1, 20 + 30 * 3 + 29])).toEqual([2, 3]);
    expect(snap(grid, 'case', [10 + 30 * 6 + 1, 25])).toBeNull();
  });

  it('trace une droite d\'un bord à l\'autre de la grille', () => {
    expect(lineAcrossGrid(grid, [1, 2], [2, 2])).toEqual([nodePoint(grid, [0, 2]), nodePoint(grid, [6, 2])]);
    expect(lineAcrossGrid(grid, [1, 1], [2, 2])).toEqual([nodePoint(grid, [0, 0]), nodePoint(grid, [4, 4])]);
    expect(lineAcrossGrid(grid, [1, 1], [1, 1])).toBeNull();
  });
});

describe('la vérification', () => {
  it('accepte les points attendus, dans n\'importe quel ordre', () => {
    const construction = points([[1, 1], [3, 2], [5, 0]]);
    expect(isConstructionRight(construction, [[5, 0], [1, 1], [3, 2]])).toBe(true);
    expect(isConstructionRight(construction, [[5, 0], [1, 1], [3, 3]])).toBe(false);
    expect(isConstructionRight(construction, [[5, 0], [1, 1]])).toBe(false);
    expect(isConstructionRight(construction, [[5, 0], [5, 0], [1, 1]])).toBe(false);
    expect(isPlacedRight(construction, [3, 2])).toBe(true);
    expect(isPlacedRight(construction, [3, 3])).toBe(false);
  });

  it('accepte tout point d\'une parallèle, et rien d\'autre', () => {
    const construction = direction('parallele', [2, 1]);
    expect(isConstructionRight(construction, [[4, 3]])).toBe(true);
    expect(isConstructionRight(construction, [[0, 1]])).toBe(true);
    expect(isConstructionRight(construction, [[3, 3]])).toBe(false);
    // Le point de départ lui-même ne trace aucune droite.
    expect(isConstructionRight(construction, [[2, 2]])).toBe(false);
  });

  it('accepte tout point d\'une perpendiculaire', () => {
    const construction = direction('perpendiculaire', [2, 1]);
    expect(isConstructionRight(construction, [[1, 4]])).toBe(true);
    expect(isConstructionRight(construction, [[3, 0]])).toBe(true);
    expect(isConstructionRight(construction, [[4, 3]])).toBe(false);
  });

  it('trouve une bonne réponse à montrer dans la correction', () => {
    for (const relation of ['parallele', 'perpendiculaire'] as const) {
      for (const along of [[1, 0], [0, 1], [1, 1], [2, 1], [1, -2]] as Node[]) {
        const construction = direction(relation, along);
        const answer = directionAnswer(grid, construction.rule as Extract<Construction['rule'], { kind: 'direction' }>);
        expect(answer).not.toBeNull();
        expect(isConstructionRight(construction, [answer!])).toBe(true);
      }
    }
  });
});
