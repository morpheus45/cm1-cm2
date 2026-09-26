import { describe, expect, it } from 'vitest';
import { distance, fitsInFrame, type Figure, type Point, type Shape } from '../lib/figures';
import { createRng } from '../lib/seededRandom';
import { buildSession } from '../lib/sessionBuilder';
import type { Stage } from '../lib/progression';
import { CUBE_NETS, FAMILIES, generate, NOT_CUBE_NETS, SOLID_COUNTS } from './geometrie';
import {
  angleAt,
  cuboid,
  equilateralTriangle,
  GRID_COLUMNS,
  GRID_ROWS,
  irregularPolygon,
  isCubeNet,
  isoscelesTriangle,
  kite,
  parallelogram,
  polyhedronEdges,
  rectangle,
  rhombus,
  rightTrapezoid,
  rightTriangle,
  scaleneTriangle,
  sides,
  square,
  squarePyramid,
  triangularPrism,
} from './geometrieFigures';

const close = (a: number, b: number, tolerance = 0.01) => Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b));
const angles = (points: Point[]) => points.map((_, index) => angleAt(points, index));
const rightAngles = (points: Point[]) => angles(points).filter((angle) => close(angle, 90, 0.001)).length;

describe('les figures sont justes', () => {
  it('le carré : quatre côtés égaux, quatre angles droits', () => {
    const lengths = sides(square());
    expect(lengths.every((length) => close(length, lengths[0]))).toBe(true);
    expect(rightAngles(square())).toBe(4);
  });

  it('le rectangle : côtés opposés égaux, pas un carré, quatre angles droits', () => {
    const [a, b, c, d] = sides(rectangle(1.7));
    expect(close(a, c) && close(b, d)).toBe(true);
    expect(close(a, b)).toBe(false);
    expect(rightAngles(rectangle(1.7))).toBe(4);
  });

  it('le losange : quatre côtés égaux, aucun angle droit', () => {
    const lengths = sides(rhombus(58));
    expect(lengths.every((length) => close(length, lengths[0]))).toBe(true);
    expect(rightAngles(rhombus(58))).toBe(0);
  });

  it('le parallélogramme : côtés opposés égaux, ni losange ni rectangle', () => {
    const [a, b, c, d] = sides(parallelogram(70, 62));
    expect(close(a, c) && close(b, d)).toBe(true);
    expect(close(a, b)).toBe(false);
    expect(rightAngles(parallelogram(70, 62))).toBe(0);
  });

  it('les triangles particuliers, et le quelconque qui ne l\'est pas', () => {
    [55, 65, 150].forEach((other) => {
      expect(rightAngles(rightTriangle(other))).toBe(1);
      const [a, , c] = sides(rightTriangle(other));
      expect(close(a, c)).toBe(false);
    });
    [40, 45, 110].forEach((apex) => {
      const [a, b, c] = sides(isoscelesTriangle(apex));
      expect(close(a, c)).toBe(true);
      expect(close(a, b)).toBe(false);
      expect(rightAngles(isoscelesTriangle(apex))).toBe(0);
    });
    const equal = sides(equilateralTriangle());
    expect(equal.every((length) => close(length, equal[0]))).toBe(true);
    const scalene = sides(scaleneTriangle());
    expect(Math.min(...scalene) / Math.max(...scalene)).toBeLessThan(0.9);
    [[0, 1], [1, 2], [0, 2]].forEach(([i, j]) => expect(Math.abs(scalene[i] - scalene[j]) / scalene[i]).toBeGreaterThan(0.05));
    angles(scaleneTriangle()).forEach((angle) => expect(Math.abs(angle - 90)).toBeGreaterThan(10));
  });

  it('le trapèze rectangle a deux angles droits, le cerf-volant deux paires de côtés égaux', () => {
    expect(rightAngles(rightTrapezoid())).toBe(2);
    const [a, b, c, d] = sides(kite());
    expect(close(a, d) && close(b, c) && !close(a, b)).toBe(true);
  });

  it('un polygone « irrégulier » reste convexe et a le bon nombre de côtés', () => {
    const rng = createRng(3);
    [3, 4, 5, 6, 8].forEach((n) => {
      const points = irregularPolygon(n, rng);
      expect(points).toHaveLength(n);
      const total = angles(points).reduce((sum, angle) => sum + angle, 0);
      expect(close(total, (n - 2) * 180, 0.001)).toBe(true);
    });
  });
});

describe('les solides', () => {
  it('cachent les bonnes arêtes : celles du sommet du fond, en bas à gauche', () => {
    const hidden = (edges: { a: number; b: number; hidden: boolean }[]) => edges.filter((edge) => edge.hidden);
    const cube = hidden(polyhedronEdges(cuboid(100, 100, 100)));
    expect(cube).toHaveLength(3);
    cube.forEach((edge) => expect([edge.a, edge.b]).toContain(4));
    const pyramid = hidden(polyhedronEdges(squarePyramid()));
    expect(pyramid).toHaveLength(3);
    pyramid.forEach((edge) => expect([edge.a, edge.b]).toContain(3));
    const prism = hidden(polyhedronEdges(triangularPrism()));
    expect(prism).toHaveLength(3);
    prism.forEach((edge) => expect([edge.a, edge.b]).toContain(3));
  });

  it('ont les faces, arêtes et sommets annoncés aux élèves', () => {
    const solids = { cube: cuboid(100, 100, 100), pave: cuboid(170, 80, 90), pyramide: squarePyramid(), prisme: triangularPrism() };
    SOLID_COUNTS.forEach((entry) => {
      const solid = solids[entry.name as keyof typeof solids];
      expect(solid.faces).toHaveLength(entry.faces);
      expect(polyhedronEdges(solid)).toHaveLength(entry.aretes);
      expect(solid.vertices).toHaveLength(entry.sommets);
    });
  });
});

describe('les patrons du cube', () => {
  it('reconnaît les onze patrons du cube, et eux seuls', () => {
    const eleven: [number, number][][] = [
      [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]],
      [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
      [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]],
      [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
      [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
      [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]],
      [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]].map(([c, r]) => [c, r] as [number, number]),
      [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
      [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]],
      [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
      [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]],
    ];
    eleven.forEach((net) => expect(isCubeNet(net), JSON.stringify(net)).toBe(true));
    expect(isCubeNet([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]])).toBe(false);
    expect(isCubeNet([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1]])).toBe(false);
    expect(isCubeNet([[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [2, 1]])).toBe(false);
  });

  it('les patrons proposés aux élèves sont bien classés', () => {
    CUBE_NETS.forEach((net) => expect(isCubeNet(net)).toBe(true));
    NOT_CUBE_NETS.forEach((net) => expect(isCubeNet(net)).toBe(false));
  });
});

/** Toutes les questions, pour toutes les graines : ce qu'un élève peut voir. */
function allQuestions(stage: Stage) {
  const level = stage <= 3 ? 'CM1' : 'CM2';
  const trimester = (((stage - 1) % 3) + 1) as 1 | 2 | 3;
  return Array.from({ length: 30 }, (_, seed) => generate(level, trimester, createRng(seed + 1), 12)).flat();
}

const shapesOf = (figure: Figure | undefined, kind: Shape['kind']) => (figure?.shapes ?? []).filter((shape) => shape.kind === kind);

describe('les questions de géométrie', () => {
  it('sont bien formées, et leur figure tient dans son cadre', () => {
    ([1, 2, 3, 4, 5, 6] as Stage[]).forEach((stage) =>
      allQuestions(stage).forEach((question) => {
        expect(question.choices.length).toBeGreaterThanOrEqual(3);
        expect(new Set(question.choices).size).toBe(question.choices.length);
        expect(question.choices[question.correctIndex]).toBeDefined();
        expect(question.explanation).toBeTruthy();
        if (question.figure) expect(fitsInFrame(question.figure), question.id).toBe(true);
      })
    );
  });

  it('ne sortent pas du trimestre : rien de nouveau avant son heure', () => {
    ([1, 2, 3, 4, 5, 6] as Stage[]).forEach((stage) => {
      const allowed = FAMILIES.filter((family) => family.minStage <= stage).map((family) => family.name);
      allQuestions(stage).forEach((question) =>
        expect(allowed.some((name) => question.id.startsWith(`geometrie-${name}-`)), question.id).toBe(true)
      );
    });
  });

  it('nomment le polygone d\'après son nombre de côtés', () => {
    const names: Record<number, string> = { 3: 'un triangle', 4: 'un quadrilatère', 5: 'un pentagone', 6: 'un hexagone', 8: 'un octogone' };
    allQuestions(6)
      .filter((question) => question.id.startsWith('geometrie-polygones-'))
      .forEach((question) => {
        const [polygon] = shapesOf(question.figure, 'polygon') as Extract<Shape, { kind: 'polygon' }>[];
        expect(question.choices[question.correctIndex]).toBe(names[polygon.points.length]);
      });
  });

  it('désignent la case où se trouve vraiment l\'étoile', () => {
    allQuestions(1)
      .filter((question) => question.id.startsWith('geometrie-quadrillage-'))
      .forEach((question) => {
        const [grid] = shapesOf(question.figure, 'quadrillage') as Extract<Shape, { kind: 'quadrillage' }>[];
        const [star] = shapesOf(question.figure, 'etoile') as Extract<Shape, { kind: 'etoile' }>[];
        const column = Math.floor((star.at[0] - grid.origin[0]) / grid.cell);
        const row = Math.floor((star.at[1] - grid.origin[1]) / grid.cell);
        expect(question.choices[question.correctIndex]).toBe(`${GRID_COLUMNS[column]}${GRID_ROWS[row]}`);
      });
  });

  it('classent les droites d\'après leur dessin', () => {
    allQuestions(1)
      .filter((question) => question.id.startsWith('geometrie-droites-'))
      .forEach((question) => {
        const [first, second] = shapesOf(question.figure, 'segment') as Extract<Shape, { kind: 'segment' }>[];
        const u = [first.to[0] - first.from[0], first.to[1] - first.from[1]];
        const v = [second.to[0] - second.from[0], second.to[1] - second.from[1]];
        const cos = Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]));
        const answer = question.choices[question.correctIndex];
        if (answer.includes('parallèles')) expect(cos).toBeGreaterThan(0.999);
        else if (answer.includes('perpendiculaires')) expect(cos).toBeLessThan(0.01);
        else expect(cos).toBeGreaterThan(0.4);
      });
  });

  it('classent l\'angle d\'après son ouverture', () => {
    allQuestions(4)
      // « angles-droits » est une autre famille : on ne garde que « angles ».
      .filter((question) => /^geometrie-angles-\d/.test(question.id))
      .forEach((question) => {
        const [first, second] = shapesOf(question.figure, 'segment') as Extract<Shape, { kind: 'segment' }>[];
        const degrees = angleAt([first.to, first.from, second.to], 1);
        const answer = question.choices[question.correctIndex];
        if (answer === 'un angle droit') expect(degrees).toBeCloseTo(90, 0);
        else if (answer === 'un angle aigu') expect(degrees).toBeLessThan(70);
        else expect(degrees).toBeGreaterThan(110);
      });
  });

  it('codent le carré de quatre côtés égaux et de quatre angles droits', () => {
    allQuestions(2)
      .filter((question) => question.id.startsWith('geometrie-quadrilateres-') && question.choices[question.correctIndex] === 'un carré')
      .forEach((question) => {
        expect(shapesOf(question.figure, 'codage')).toHaveLength(4);
        expect(shapesOf(question.figure, 'angleDroit')).toHaveLength(4);
        const [polygon] = shapesOf(question.figure, 'polygon') as Extract<Shape, { kind: 'polygon' }>[];
        const lengths = sides(polygon.points);
        lengths.forEach((length) => expect(close(length, lengths[0], 0.02)).toBe(true));
      });
  });
});

describe('la géométrie dans les séances de maths', () => {
  it('se mêle aux autres notions de maths, jamais au français', () => {
    const session = buildSession({ domains: ['calcul', 'geometrie'], level: 'CM1', trimester: 2, seed: 4 });
    expect(session.subject).toBe('maths');
    expect(session.questions.filter((question) => question.domain === 'geometrie')).toHaveLength(6);
    expect(() => buildSession({ domains: ['geometrie', 'conjugaison'], level: 'CM1', trimester: 2, seed: 4 })).toThrow();
  });

  it('ne répète pas deux fois la même figure dans une séance', () => {
    ([1, 2, 3, 4, 5, 6] as Stage[]).forEach((stage) => {
      const level = stage <= 3 ? 'CM1' : 'CM2';
      const trimester = (((stage - 1) % 3) + 1) as 1 | 2 | 3;
      const session = generate(level, trimester, createRng(stage), 12);
      const keys = session.map((question) => question.prompt + JSON.stringify(question.figure ?? null));
      expect(new Set(keys).size).toBe(keys.length);
      expect(distance([0, 0], [3, 4])).toBe(5);
    });
  });
});
