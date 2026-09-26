import { describe, expect, it } from 'vitest';
import {
  masteryOf,
  parseResults,
  progressByDomain,
  pupilFolders,
  schoolYearLabel,
  schoolYearOf,
  sessionsInSchoolYear,
  summariseByDomain,
  weakestDomains,
  yearOutlook,
  MASTERY_COLORS,
  MASTERY_LABELS,
  MINIMUM_ANSWERS_FOR_MASTERY,
  type SessionResult,
} from './results';
import { ALL_DOMAINS, pupilKey, pupilLabel } from '../types';

const session = (overrides: Partial<SessionResult> = {}): SessionResult => ({
  id: 's1',
  pupil: { firstName: 'Nolhan', lastName: 'Martin' },
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

  it('couvre toutes les notions, même celles jamais travaillées', () => {
    const summary = summariseByDomain([session()]);
    expect(summary).toHaveLength(ALL_DOMAINS.length);
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
    expect(summary.filter((s) => s.subject === 'maths')).toHaveLength(4);
    expect(summary.filter((s) => s.subject === 'histoire')).toHaveLength(3);
    expect(summary.filter((s) => s.subject === 'geographie')).toHaveLength(3);
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

describe('l\'identité d\'un élève', () => {
  it('ignore accents, casse et espaces en trop', () => {
    expect(pupilKey({ firstName: ' Léa ', lastName: 'MARTIN' })).toBe(
      pupilKey({ firstName: 'lea', lastName: 'martin' })
    );
  });

  it('ne confond pas deux élèves de même prénom', () => {
    expect(pupilKey({ firstName: 'Léa', lastName: 'Martin' })).not.toBe(
      pupilKey({ firstName: 'Léa', lastName: 'Dubois' })
    );
  });

  it('affiche prénom et nom, et se rabat sur une mention quand il n\'y a rien', () => {
    expect(pupilLabel({ firstName: 'Nolhan', lastName: 'Martin' })).toBe('Nolhan Martin');
    expect(pupilLabel({ firstName: 'Nolhan', lastName: '' })).toBe('Nolhan');
    expect(pupilLabel({ firstName: '  ', lastName: '' })).toBe('Élève sans nom');
  });
});

describe('pupilFolders', () => {
  it('range les séances par élève, le plus récent en tête', () => {
    const folders = pupilFolders([
      session({ id: 'a', at: '2026-09-10T10:00:00.000Z' }),
      session({ id: 'b', at: '2026-09-18T10:00:00.000Z', pupil: { firstName: 'Léa', lastName: 'Dubois' } }),
      session({ id: 'c', at: '2026-09-12T10:00:00.000Z' }),
    ]);
    expect(folders.map((f) => f.pupil.firstName)).toEqual(['Léa', 'Nolhan']);
    expect(folders[1].sessions).toHaveLength(2);
    expect(folders[1].lastAt).toBe('2026-09-12T10:00:00.000Z');
  });

  it('ne fait qu\'un dossier malgré les accents, la casse et les espaces', () => {
    const folders = pupilFolders([
      session({ id: 'a', pupil: { firstName: 'Léa', lastName: 'Martin' } }),
      session({ id: 'b', pupil: { firstName: 'lea ', lastName: ' MARTIN' } }),
    ]);
    expect(folders).toHaveLength(1);
    expect(folders[0].sessions).toHaveLength(2);
  });

  it('sépare deux élèves qui partagent le prénom', () => {
    const folders = pupilFolders([
      session({ id: 'a', pupil: { firstName: 'Léa', lastName: 'Martin' } }),
      session({ id: 'b', pupil: { firstName: 'Léa', lastName: 'Dubois' } }),
    ]);
    expect(folders).toHaveLength(2);
  });
});

describe('l\'année scolaire', () => {
  it('commence en septembre', () => {
    expect(schoolYearOf('2026-09-01T08:00:00.000Z')).toBe(2026);
    expect(schoolYearOf('2026-08-31T08:00:00.000Z')).toBe(2025);
    expect(schoolYearOf('2027-06-30T08:00:00.000Z')).toBe(2026);
    expect(schoolYearLabel(2026)).toBe('2026-2027');
  });

  it('ne garde que les séances de l\'année demandée', () => {
    const kept = sessionsInSchoolYear(
      [
        session({ id: 'a', at: '2026-10-01T10:00:00.000Z' }),
        session({ id: 'b', at: '2027-05-01T10:00:00.000Z' }),
        session({ id: 'c', at: '2026-06-01T10:00:00.000Z' }),
      ],
      2026
    );
    expect(kept.map((s) => s.id)).toEqual(['a', 'b']);
  });
});

describe('yearOutlook', () => {
  it('sépare ce qui est tenu, ce qui est à revoir, et ce dont on ne sait rien', () => {
    const summaries = summariseByDomain([
      session({ domains: [{ domain: 'conjugaison', correct: 12, total: 12 }] }),
      session({ id: 's2', domains: [{ domain: 'calcul', correct: 2, total: 12 }] }),
    ]);
    const outlook = yearOutlook(summaries);
    expect(outlook.acquired.map((s) => s.domain)).toEqual(['conjugaison']);
    expect(outlook.toRevise.map((s) => s.domain)).toEqual(['calcul']);
    expect(outlook.untested).toHaveLength(ALL_DOMAINS.length - 2);
  });
});

describe('weakestDomains', () => {
  it('cible les notions les plus fragiles de la matière demandée', () => {
    const summaries = summariseByDomain([
      session({
        domains: [
          { domain: 'conjugaison', correct: 11, total: 12 },
          { domain: 'accords', correct: 3, total: 12 },
          { domain: 'orthographe', correct: 7, total: 12 },
        ],
      }),
    ]);
    expect(weakestDomains(summaries, 'francais', 2)).toEqual(['accords', 'orthographe']);
  });

  it('ne sort jamais de la matière demandée', () => {
    const summaries = summariseByDomain([
      session({ domains: [{ domain: 'calcul', correct: 1, total: 12 }] }),
    ]);
    weakestDomains(summaries, 'francais', 3).forEach((domain) =>
      expect(['conjugaison', 'accords', 'orthographe']).toContain(domain)
    );
  });

  it('fait passer une notion jamais travaillée devant une notion réussie', () => {
    // Ne pas savoir si l'élève tient une notion est une lacune, au même titre
    // que de savoir qu'il ne la tient pas.
    const summaries = summariseByDomain([
      session({ domains: [{ domain: 'conjugaison', correct: 12, total: 12 }] }),
    ]);
    expect(weakestDomains(summaries, 'francais', 1)).not.toEqual(['conjugaison']);
  });

  it('rend au moins une notion, même si on lui en demande zéro', () => {
    expect(weakestDomains(summariseByDomain([]), 'maths', 0)).toHaveLength(1);
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

  it('accueille une séance écrite avant que les élèves ne soient distingués', () => {
    const { pupil: _ignored, ...withoutPupil } = session();
    const [read] = parseResults(JSON.stringify([withoutPupil]));
    expect(read.pupil).toEqual({ firstName: '', lastName: '' });
  });

  it('écarte un compte de bonnes réponses impossible', () => {
    const raw = JSON.stringify([session({ domains: [{ domain: 'calcul', correct: 20, total: 12 }] })]);
    expect(parseResults(raw)).toEqual([]);
  });
});
