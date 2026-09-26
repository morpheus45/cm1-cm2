import { describe, expect, it } from 'vitest';
import type { Stage } from '../lib/progression';
import { fitsInFrame, type Point, type Shape } from '../lib/figures';
import { createRng } from '../lib/seededRandom';
import type { Node } from '../lib/construction';
import { MEASURE_FAMILIES, boundary, formatLength, polyomino } from './geometrieMesures';

const STAGES: Stage[] = [1, 2, 3, 4, 5, 6];
const family = (name: string) => MEASURE_FAMILIES.find((entry) => entry.name === name)!;
const shapesOf = <K extends Shape['kind']>(shapes: Shape[], kind: K) =>
  shapes.filter((shape): shape is Extract<Shape, { kind: K }> => shape.kind === kind);

function questionsOf(name: string, seeds = 50) {
  const { minStage, make } = family(name);
  return STAGES.filter((stage) => stage >= minStage).flatMap((stage) =>
    Array.from({ length: seeds }, (_, seed) => ({ stage, question: make(createRng(seed + 1), stage) }))
  );
}

/** L'aire d'un polygone (formule du lacet). */
const area = (points: Point[]) =>
  Math.abs(points.reduce((sum, [x, y], index) => {
    const [nx, ny] = points[(index + 1) % points.length];
    return sum + x * ny - nx * y;
  }, 0)) / 2;

describe('les mesures', () => {
  it('sont bien formées : une seule bonne réponse, une figure dans son cadre', () => {
    MEASURE_FAMILIES.forEach(({ name }) =>
      questionsOf(name).forEach(({ question }) => {
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(question.choices[question.correctIndex]).toBeDefined();
        expect(question.explanation).toBeTruthy();
        expect(fitsInFrame(question.figure!), `${name} ${question.detail}`).toBe(true);
        // Les longueurs écrites restent dans le cadre, texte compris.
        shapesOf(question.figure!.shapes, 'text').forEach((text) => {
          const half = (text.text.length * (text.size ?? 15) * 0.56) / 2;
          expect(text.at[0] - half, `${name} ${text.text}`).toBeGreaterThanOrEqual(0);
          expect(text.at[0] + half, `${name} ${text.text}`).toBeLessThanOrEqual(question.figure!.width);
        });
      })
    );
  });

  it('écrivent les longueurs comme au niveau de l\'élève', () => {
    expect(formatLength(50, 1)).toBe('5 cm');
    expect(formatLength(47, 2)).toBe('4 cm 7 mm');
    expect(formatLength(8, 3)).toBe('8 mm');
    expect(formatLength(47, 4)).toBe('4,7 cm');
    expect(formatLength(40, 5)).toBe('4 cm');
  });

  it('lisent la règle : la fin moins le début', () => {
    questionsOf('mesure-regle').forEach(({ stage, question }) => {
      const [start, end] = question.detail.split('-').map(Number);
      expect(question.choices[question.correctIndex]).toBe(formatLength(end - start, stage));
      // Au début du CM1, des centimètres entiers seulement.
      if (stage === 1) expect((end - start) % 10).toBe(0);
      // Le segment dessiné commence et finit bien à ces graduations.
      const segment = shapesOf(question.figure!.shapes, 'segment').find((shape) => shape.width === 3.5)!;
      // L'échelle se lit sur la règle elle-même : de la graduation 0 à la 1.
      const graduations = shapesOf(question.figure!.shapes, 'text');
      const centimeter = graduations.find((text) => text.text === '1')!.at[0] - graduations.find((text) => text.text === '0')!.at[0];
      expect(segment.to[0] - segment.from[0]).toBeCloseTo(((end - start) * centimeter) / 10, 0);
      // La règle montre toute la longueur, et un centimètre de plus au moins.
      expect(Number(graduations[graduations.length - 1].text) * 10).toBeGreaterThanOrEqual(end + 5);
    });
  });

  it('calculent le périmètre en ajoutant les côtés écrits', () => {
    questionsOf('mesure-perimetre').forEach(({ question }) => {
      const lengths = question.detail.split('-').map(Number);
      const written = shapesOf(question.figure!.shapes, 'text').map((text) => Number(text.text.replace(' cm', '')));
      expect(written).toEqual(lengths);
      expect(question.choices[question.correctIndex]).toBe(`${lengths.reduce((sum, value) => sum + value, 0)} cm`);
    });
    questionsOf('mesure-perimetre-formule').forEach(({ question }) => {
      const [kind, a, b] = question.detail.split('-');
      const expected = kind === 'carre' ? 4 * Number(a) : 2 * (Number(a) + Number(b));
      expect(question.choices[question.correctIndex]).toBe(`${expected} cm`);
    });
  });

  it('comptent les carreaux, et les demi-carreaux', () => {
    ([['mesure-aire-carreaux', false], ['mesure-aire-demi', true]] as const).forEach(([name, halves]) =>
      questionsOf(name).forEach(({ question }) => {
        const surface = shapesOf(question.figure!.shapes, 'aire')[0];
        const units = surface.rings.reduce((sum, ring) => sum + area(ring), 0) / (30 * 30);
        const answer = Number(question.choices[question.correctIndex].replace(' carreaux', '').replace(',', '.'));
        expect(answer).toBeCloseTo(units);
        if (halves) expect(surface.rings.some((ring) => ring.length === 3)).toBe(true);
        // Les demi-carreaux sont des triangles rectangles d'un demi-carreau.
        surface.rings.filter((ring) => ring.length === 3).forEach((ring) => expect(area(ring) / 900).toBeCloseTo(0.5));
      })
    );
  });

  it('ne confondent pas l\'aire et le périmètre', () => {
    questionsOf('mesure-aire-carreaux').forEach(({ question }) => {
      const edges = shapesOf(question.figure!.shapes, 'segment').length;
      // Le périmètre (en côtés de carreau) est proposé comme piège.
      expect(question.choices).toContain(`${edges} carreaux`);
      expect(question.choices[question.correctIndex]).not.toBe(`${edges} carreaux`);
    });
  });

  it('dessinent des figures d\'un seul tenant, sans trou', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const cells = polyomino(createRng(seed), 9, 9, 6);
      expect(new Set(cells.map((cell) => cell.join(','))).size).toBe(9);
      // Le bord d'une figure sans trou est une seule boucle : autant de
      // sommets que de côtés, chacun touché deux fois.
      const edges = boundary(cells.map(([col, row]): Node[] => [[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1]]));
      const degree = new Map<string, number>();
      edges.flat().forEach((node) => degree.set(node.join(','), (degree.get(node.join(',')) ?? 0) + 1));
      [...degree.values()].forEach((value) => expect(value % 2).toBe(0));
    }
  });

  it('calculent l\'aire du rectangle en cm²', () => {
    questionsOf('mesure-aire-rectangle').forEach(({ question }) => {
      const [width, height] = question.detail.split('-').map(Number);
      expect(question.choices[question.correctIndex]).toBe(`${width * height} cm²`);
    });
  });
});
