import { describe, expect, it } from 'vitest';
import {
  masteryOf,
  parseResults,
  progressByDomain,
  summariseByDomain,
  MASTERY_COLORS,
  MASTERY_LABELS,
  MINIMUM_ANSWERS_FOR_MASTERY,
  type SessionResult,
} from './results';

const session = (overrides: Partial<SessionResult> = {}): SessionResult => ({
  id: 's1',
  at: '2026-09-20T10:00:00.000Z',
  level: 'CM1',
  trimester: 2,
  subject: 'francais',
  activity: 'questions',
  domains: [{ domain: 'conjugaison', correct: 8, total: 12 }],
  ...overrides,
});

/** Contraste WCAG d'une couleur sur fond blanc. */
function contrastOnWhite(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (luminance + 0.05);
}

describe('masteryOf', () => {
  it('place chaque part de réussite au bon niveau', () => {
    expect(masteryOf(0.95)).toBe(4);
    expect(masteryOf(0.85)).toBe(4);
    expect(masteryOf(0.7)).toBe(3);
    expect(masteryOf(0.65)).toBe(3);
    expect(masteryOf(0.5)).toBe(2);
    expect(masteryOf(0.4)).toBe(2);
    expect(masteryOf(0.2)).toBe(1);
    expect(masteryOf(0)).toBe(1);
  });

  it('ne sort jamais de l\'échelle, même sur une valeur aberrante', () => {
    expect(masteryOf(-1)).toBe(1);
    expect(masteryOf(5)).toBe(4);
  });

  it('ne descend jamais quand la réussite monte', () => {
    let previous = 0;
    for (let ratio = 0; ratio <= 1.0001; ratio += 0.01) {
      const level = masteryOf(ratio);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });
});

describe('les couleurs des niveaux', () => {
  it('sont toutes lisibles sur fond blanc', () => {
    Object.entries(MASTERY_COLORS).forEach(([level, hex]) => {
      expect(contrastOnWhite(hex), `niveau ${level} (${hex})`).toBeGreaterThanOrEqual(3);
    });
  });

  it('portent chacune un libellé écrit : la couleur ne porte jamais le sens seule', () => {
    Object.keys(MASTERY_COLORS).forEach((level) => {
      expect(MASTERY_LABELS[Number(level) as 1 | 2 | 3 | 4]).toBeTruthy();
    });
  });
});

describe('summariseByDomain', () => {
  it('additionne les séances notion par notion', () => {
    const summary = summariseByDomain([
      session(),
      session({ id: 's2', domains: [{ domain: 'conjugaison', correct: 10, total: 12 }] }),
    ]);
    const conjugaison = summary.find((s) => s.domain === 'conjugaison');
    expect(conjugaison).toMatchObject({ correct: 18, total: 24 });
    expect(conjugaison?.ratio).toBeCloseTo(0.75);
    expect(conjugaison?.mastery).toBe(4 - 1); // satisfaisante
  });

  it('couvre les six notions, même celles jamais travaillées', () => {
    const summary = summariseByDomain([session()]);
    expect(summary).toHaveLength(6);
    const calcul = summary.find((s) => s.domain === 'calcul');
    expect(calcul?.total).toBe(0);
    expect(calcul?.ratio).toBeNull();
    expect(calcul?.mastery).toBeNull();
  });

  it('ne se prononce pas sur trop peu de questions', () => {
    // Deux bonnes réponses sur deux ne font pas une « très bonne maîtrise ».
    const summary = summariseByDomain([
      session({ domains: [{ domain: 'conjugaison', correct: 2, total: 2 }] }),
    ]);
    expect(summary.find((s) => s.domain === 'conjugaison')?.mastery).toBeNull();
  });

  it('se prononce dès le seuil atteint', () => {
    const summary = summariseByDomain([
      session({
        domains: [
          { domain: 'conjugaison', correct: MINIMUM_ANSWERS_FOR_MASTERY, total: MINIMUM_ANSWERS_FOR_MASTERY },
        ],
      }),
    ]);
    expect(summary.find((s) => s.domain === 'conjugaison')?.mastery).toBe(4);
  });

  it('rattache chaque notion à sa matière', () => {
    const summary = summariseByDomain([]);
    expect(summary.filter((s) => s.subject === 'francais')).toHaveLength(3);
    expect(summary.filter((s) => s.subject === 'maths')).toHaveLength(3);
  });
});

describe('progressByDomain', () => {
  it('rend les séances dans l\'ordre du temps, quel qu\'ait été l\'ordre d\'écriture', () => {
    const points = progressByDomain(
      [
        session({ id: 'b', at: '2026-09-22T10:00:00.000Z', domains: [{ domain: 'calcul', correct: 9, total: 12 }] }),
        session({ id: 'a', at: '2026-09-20T10:00:00.000Z', domains: [{ domain: 'calcul', correct: 3, total: 12 }] }),
      ],
      'calcul'
    );
    expect(points.map((p) => p.at)).toEqual([
      '2026-09-20T10:00:00.000Z',
      '2026-09-22T10:00:00.000Z',
    ]);
    expect(points[0].ratio).toBeCloseTo(0.25);
  });

  it('ignore une séance sans question dans cette notion', () => {
    expect(progressByDomain([session({ domains: [{ domain: 'calcul', correct: 0, total: 0 }] })], 'calcul')).toEqual([]);
  });
});

describe('parseResults', () => {
  it('rend une liste vide quand rien n\'est enregistré', () => {
    expect(parseResults(null)).toEqual([]);
    expect(parseResults('pas du json')).toEqual([]);
    expect(parseResults('{}')).toEqual([]);
  });

  it('écarte une séance abîmée sans jeter les autres', () => {
    const good = session();
    const raw = JSON.stringify([good, { id: 'x' }, { ...good, id: 'y', level: 'CE2' }, null]);
    expect(parseResults(raw)).toEqual([good]);
  });

  it('écarte un compte de bonnes réponses impossible', () => {
    const raw = JSON.stringify([session({ domains: [{ domain: 'calcul', correct: 20, total: 12 }] })]);
    expect(parseResults(raw)).toEqual([]);
  });
});
