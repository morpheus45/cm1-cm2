import { describe, expect, it } from 'vitest';
import type { Stage } from '../lib/progression';
import { fitsInFrame, type Point, type Shape } from '../lib/figures';
import { createRng } from '../lib/seededRandom';
import { QUESTION_FAMILIES, STATEMENTS } from './geometrieQuestions';

const STAGES: Stage[] = [1, 2, 3, 4, 5, 6];
const family = (name: string) => QUESTION_FAMILIES.find((entry) => entry.name === name)!;
const shapesOf = <K extends Shape['kind']>(shapes: Shape[], kind: K) =>
  shapes.filter((shape): shape is Extract<Shape, { kind: K }> => shape.kind === kind);

function questionsOf(name: string, seeds = 60) {
  const { minStage, make } = family(name);
  return STAGES.filter((stage) => stage >= minStage).flatMap((stage) =>
    Array.from({ length: seeds }, (_, seed) => ({ stage, question: make(createRng(seed + 1), stage) }))
  );
}

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const cross = (a: Point, b: Point) => a[0] * b[1] - a[1] * b[0];
const cosine = (u: Point, v: Point) => Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));

function distanceToSegment(point: Point, [a, b]: [Point, Point]): number {
  const [dx, dy] = sub(b, a);
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
}

function crossing(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = cross(sub(p4, p3), sub(p1, p3));
  const d2 = cross(sub(p4, p3), sub(p2, p3));
  const d3 = cross(sub(p2, p1), sub(p3, p1));
  const d4 = cross(sub(p2, p1), sub(p4, p1));
  return d1 * d2 < 0 && d3 * d4 < 0;
}

describe('les nouvelles questions de géométrie', () => {
  it('sont bien formées, et tiennent dans leur cadre', () => {
    QUESTION_FAMILIES.forEach(({ name }) =>
      questionsOf(name).forEach(({ question }) => {
        expect(question.choices.length).toBeGreaterThanOrEqual(3);
        expect(new Set(question.choices).size).toBe(question.choices.length);
        expect(question.choices[question.correctIndex]).toBeDefined();
        expect(question.explanation).toBeTruthy();
        if (!question.figure) return;
        expect(fitsInFrame(question.figure), `${name} ${question.detail}`).toBe(true);
        shapesOf(question.figure.shapes, 'text').forEach((text) => {
          const half = (text.text.length * (text.size ?? 15) * 0.56) / 2;
          expect(text.at[0] - half).toBeGreaterThanOrEqual(0);
          expect(text.at[0] + half).toBeLessThanOrEqual(question.figure!.width);
          expect(text.at[1]).toBeLessThanOrEqual(question.figure!.height);
        });
      })
    );
  });

  it('désignent les droites vraiment parallèles ou perpendiculaires', () => {
    questionsOf('droites-nommees').forEach(({ question }) => {
      const lines = shapesOf(question.figure!.shapes, 'segment').map((segment) => [segment.from, segment.to] as [Point, Point]);
      // Chaque nom va à la droite la plus proche.
      const byName = Object.fromEntries(
        shapesOf(question.figure!.shapes, 'text').map((text) => {
          const distances = lines.map((line) => distanceToSegment(text.at, line));
          return [text.text, lines[distances.indexOf(Math.min(...distances))]];
        })
      );
      expect(Object.keys(byName).sort()).toEqual(['(d1)', '(d2)', '(d3)']);
      const parallel = question.prompt.includes('parallèles');
      question.choices.forEach((pair, index) => {
        const [a, b] = pair.split(' et ').map((name) => byName[name]);
        const cos = cosine(sub(a[1], a[0]), sub(b[1], b[0]));
        if (index === question.correctIndex) expect(cos).toBeCloseTo(parallel ? 1 : 0, 3);
        else {
          // Les autres paires ne sont ni parallèles ni perpendiculaires.
          expect(cos).toBeLessThan(0.95);
          expect(cos).toBeGreaterThan(0.3);
        }
      });
    });
  });

  it('nomment diamètre le segment qui passe par le centre', () => {
    questionsOf('cercle-segments').forEach(({ question }) => {
      const circle = shapesOf(question.figure!.shapes, 'circle')[0];
      const [ab, oc, de] = shapesOf(question.figure!.shapes, 'segment').map((segment) => [segment.from, segment.to] as [Point, Point]);
      expect(distanceToSegment(circle.center, ab)).toBeLessThan(0.5);
      ab.forEach((end) => expect(Math.hypot(...sub(end, circle.center))).toBeCloseTo(circle.radius, 0));
      expect(oc[0]).toEqual(circle.center);
      expect(distanceToSegment(circle.center, de)).toBeGreaterThan(30);
      // La corde ne croise aucun autre segment.
      expect(crossing(de[0], de[1], oc[0], oc[1])).toBe(false);
      expect(crossing(de[0], de[1], ab[0], ab[1])).toBe(false);
      const answer = question.choices[question.correctIndex];
      expect(answer).toBe(question.prompt.includes('diamètre') ? '[AB]' : '[OC]');
    });
  });

  it('désignent l\'angle le plus ouvert, quelle que soit la longueur de ses côtés', () => {
    questionsOf('angle-plus-grand').forEach(({ question }) => {
      const arms = shapesOf(question.figure!.shapes, 'segment');
      const angles = [0, 1, 2].map((index) => {
        const [first, second] = [arms[2 * index], arms[2 * index + 1]];
        const u = sub(first.to, first.from);
        const v = sub(second.to, second.from);
        return {
          degrees: (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI,
          arm: Math.hypot(...u),
        };
      });
      const degrees = angles.map((angle) => angle.degrees);
      const target = question.prompt.includes('grand') ? Math.max(...degrees) : Math.min(...degrees);
      expect(question.correctIndex).toBe(degrees.indexOf(target));
      // Le plus grand angle a les côtés les plus courts.
      const widest = degrees.indexOf(Math.max(...degrees));
      expect(angles[widest].arm).toBe(Math.min(...angles.map((angle) => angle.arm)));
    });
  });

  it('proposent une seule phrase vraie', () => {
    STATEMENTS.forEach((entry) => expect(new Set([entry.right, ...entry.wrong]).size).toBe(4));
    questionsOf('phrase-vraie').forEach(({ stage, question }) => {
      const entry = STATEMENTS[Number(question.detail)];
      expect(entry.minStage).toBeLessThanOrEqual(stage);
      expect(question.choices[question.correctIndex]).toBe(entry.right);
      expect(question.choices).toHaveLength(4);
    });
  });
});
