import { describe, expect, it } from 'vitest';
import type { Stage } from '../lib/progression';
import { fitsInFrame, type Figure, type Point, type Shape } from '../lib/figures';
import { createRng } from '../lib/seededRandom';
import { directionAnswer, isConstructionRight, nodePoint, type Construction, type Node } from '../lib/construction';
import { CONSTRUCTION_FAMILIES, DIAGONAL_SHAPES, HALF_SHAPES, mirrorShape } from './geometrieConstructions';
import * as geometrie from './geometrie';

const STAGES: Stage[] = [1, 2, 3, 4, 5, 6];
const family = (name: string) => CONSTRUCTION_FAMILIES.find((entry) => entry.name === name)!;
const shapesOf = <K extends Shape['kind']>(shapes: Shape[], kind: K) =>
  shapes.filter((shape): shape is Extract<Shape, { kind: K }> => shape.kind === kind);

/** Toutes les questions d'une famille, à chaque étape où elle existe. */
function questionsOf(name: string, seeds = 40) {
  const { minStage, make } = family(name);
  return STAGES.filter((stage) => stage >= minStage).flatMap((stage) =>
    Array.from({ length: seeds }, (_, seed) => ({ stage, question: make(createRng(seed + 1), stage) }))
  );
}

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const cross = (a: Point, b: Point) => a[0] * b[1] - a[1] * b[0];
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1];
const close = (a: Point, b: Point) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;

/** Deux segments se coupent-ils ailleurs qu'en une extrémité commune ? */
function crossing(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = cross(sub(p4, p3), sub(p1, p3));
  const d2 = cross(sub(p4, p3), sub(p2, p3));
  const d3 = cross(sub(p2, p1), sub(p3, p1));
  const d4 = cross(sub(p2, p1), sub(p4, p1));
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function isSimple(polygon: Point[]): boolean {
  const edges = polygon.map((point, index) => [point, polygon[(index + 1) % polygon.length]] as const);
  return edges.every((a, i) => edges.every((b, j) => j <= i + 1 || (i === 0 && j === edges.length - 1) || !crossing(a[0], a[1], b[0], b[1])));
}

describe('les constructions', () => {
  it('acceptent la bonne réponse et refusent une réponse décalée', () => {
    CONSTRUCTION_FAMILIES.forEach(({ name }) =>
      questionsOf(name).forEach(({ question }) => {
        const construction = question.construction as Construction;
        expect(question.choices).toEqual([]);
        expect(question.correctIndex).toBe(-1);
        expect(question.explanation).toBeTruthy();
        expect(fitsInFrame(question.figure!), question.detail).toBe(true);
        expect(fitsInFrame({ ...question.figure!, shapes: construction.solution }), question.detail).toBe(true);
        const { rule, grid } = construction;
        const answer: Node[] = rule.kind === 'points' ? rule.expected : [directionAnswer(grid, rule)!];
        expect(answer).toHaveLength(construction.count);
        const [maxCol, maxRow] = construction.target === 'case' ? [grid.cols - 1, grid.rows - 1] : [grid.cols, grid.rows];
        answer.forEach(([col, row]) => {
          expect(col).toBeGreaterThanOrEqual(0);
          expect(row).toBeGreaterThanOrEqual(0);
          expect(col).toBeLessThanOrEqual(maxCol);
          expect(row).toBeLessThanOrEqual(maxRow);
        });
        expect(isConstructionRight(construction, answer)).toBe(true);
        // Aucune bonne réponse n'est sur un point déjà donné, qu'on ne peut pas toucher.
        (construction.fixed ?? []).forEach((fixed) => answer.forEach((node) => expect(node).not.toEqual(fixed)));
        const wrong: Node[] =
          rule.kind === 'points'
            ? answer.map(([col, row], index): Node => (index === 0 ? [col + (col < maxCol ? 1 : -1), row] : [col, row]))
            : [rule.relation === 'parallele' ? [rule.from[0] - rule.along[1], rule.from[1] + rule.along[0]] : [rule.from[0] + rule.along[0], rule.from[1] + rule.along[1]]];
        expect(isConstructionRight(construction, wrong)).toBe(false);
      })
    );
  });

  it('écrivent leurs noms dans le cadre', () => {
    CONSTRUCTION_FAMILIES.forEach(({ name }) =>
      questionsOf(name).forEach(({ question }) => {
        const figure = question.figure as Figure;
        shapesOf([...figure.shapes, ...question.construction!.solution], 'text').forEach((text) => {
          expect(text.at[0], question.detail).toBeGreaterThanOrEqual(6);
          expect(text.at[0], question.detail).toBeLessThanOrEqual(figure.width - 6);
          expect(text.at[1], question.detail).toBeGreaterThanOrEqual(12);
          expect(text.at[1], question.detail).toBeLessThanOrEqual(figure.height - 2);
        });
      })
    );
  });

  it('reproduisent et agrandissent exactement le modèle', () => {
    (['construire-reproduire', 'construire-agrandir'] as const).forEach((name) =>
      questionsOf(name).forEach(({ question }) => {
        const model = shapesOf(question.figure!.shapes, 'polygon')[0].points;
        const copy = shapesOf(question.construction!.solution, 'polygon')[0].points;
        const factor = name === 'construire-agrandir' ? 2 : 1;
        expect(copy).toHaveLength(model.length);
        copy.forEach((point, index) => {
          const [mx, my] = sub(model[index], model[0]);
          expect(close(sub(point, copy[0]), [mx * factor, my * factor])).toBe(true);
        });
        // Le départ donné est le premier sommet de la copie.
        expect(close(shapesOf(question.figure!.shapes, 'circle')[0].center, copy[0])).toBe(true);
        expect(isSimple(copy)).toBe(true);
      })
    );
  });

  it('complètent un vrai rectangle, ou un vrai carré', () => {
    questionsOf('construire-completer').forEach(({ question }) => {
      const [a, b, c] = shapesOf(question.figure!.shapes, 'polyline')[0].points;
      const [, d] = shapesOf(question.construction!.solution, 'polyline')[0].points;
      const [ab, bc, cd, da] = [sub(b, a), sub(c, b), sub(d, c), sub(a, d)];
      expect(dot(ab, bc)).toBeCloseTo(0);
      expect(dot(bc, cd)).toBeCloseTo(0);
      expect(Math.hypot(...ab)).toBeCloseTo(Math.hypot(...cd));
      expect(Math.hypot(...bc)).toBeCloseTo(Math.hypot(...da));
      const square = Math.abs(Math.hypot(...ab) - Math.hypot(...bc)) < 1e-6;
      expect(question.prompt).toContain(square ? '**carré**' : '**rectangle**');
    });
  });

  it('tracent des symétriques exacts, sans croisement', () => {
    (['vertical', 'horizontal', 'penche'] as const).forEach((axis) => {
      const count = axis === 'penche' ? DIAGONAL_SHAPES.length : HALF_SHAPES.length;
      for (let index = 0; index < count; index++) {
        if (axis === 'horizontal' && Math.max(...HALF_SHAPES[index].map(([d]) => d)) > 3) continue;
        for (const flip of [false, true]) {
          for (const shift of [0, 3]) {
            const { given, mirrored } = mirrorShape(axis, index, flip, shift);
            given.forEach((node, i) => {
              const image = mirrored[i];
              if (axis === 'vertical') {
                expect(image[1]).toBe(node[1]);
                expect((node[0] + image[0]) / 2).toBe(5);
              } else if (axis === 'horizontal') {
                expect(image[0]).toBe(node[0]);
                expect((node[1] + image[1]) / 2).toBe(3);
              } else {
                expect(image).toEqual([node[1], node[0]]);
              }
            });
            // Les extrémités sont sur l'axe, les autres sommets non.
            const onAxis = (i: number) => given[i][0] === mirrored[i][0] && given[i][1] === mirrored[i][1];
            expect(onAxis(0) && onAxis(given.length - 1)).toBe(true);
            given.slice(1, -1).forEach((_, i) => expect(onAxis(i + 1)).toBe(false));
            // La figure complète est un vrai polygone.
            const whole = [...given, ...[...mirrored].reverse().slice(1, -1)].map((node) => nodePoint({ origin: [0, 0], cols: 9, rows: 6, cell: 1 }, node));
            expect(isSimple(whole)).toBe(true);
          }
        }
      }
    });
  });

  it('font tracer des droites vraiment parallèles ou perpendiculaires', () => {
    questionsOf('construire-droite').forEach(({ stage, question }) => {
      const construction = question.construction!;
      const rule = construction.rule;
      if (rule.kind !== 'direction') throw new Error('Une droite se vérifie par sa direction.');
      const drawn = shapesOf(question.figure!.shapes, 'segment')[0];
      expect(cross(sub(drawn.to, drawn.from), rule.along)).toBeCloseTo(0);
      const expected = shapesOf(construction.solution, 'segment')[0];
      const direction = sub(expected.to, expected.from);
      if (rule.relation === 'parallele') expect(cross(direction, rule.along)).toBeCloseTo(0);
      else expect(dot(direction, rule.along)).toBeCloseTo(0);
      // La droite attendue passe par M.
      const m = nodePoint(construction.grid, rule.from);
      expect(cross(sub(m, expected.from), direction)).toBeCloseTo(0);
      // Au CM1, seulement des droites horizontales, verticales ou à 45°.
      if (stage < 4) expect(Math.max(Math.abs(rule.along[0]), Math.abs(rule.along[1]))).toBe(1);
    });
  });

  it('arrivent au bon trimestre dans les séances', () => {
    const seen = new Set<string>();
    STAGES.forEach((stage) => {
      const level = stage <= 3 ? 'CM1' : 'CM2';
      const trimester = (((stage - 1) % 3) + 1) as 1 | 2 | 3;
      for (let seed = 1; seed <= 40; seed++) {
        geometrie.generate(level, trimester, createRng(seed), 12).forEach((question) => {
          const found = CONSTRUCTION_FAMILIES.find(({ name }) => question.id.startsWith(`geometrie-${name}-`));
          if (!found) return;
          expect(found.minStage, question.id).toBeLessThanOrEqual(stage);
          seen.add(found.name);
        });
      }
    });
    expect([...seen].sort()).toEqual(CONSTRUCTION_FAMILIES.map(({ name }) => name).sort());
  });
});
