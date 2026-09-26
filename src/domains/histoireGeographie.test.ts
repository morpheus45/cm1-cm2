import { describe, expect, it } from 'vitest';
import { ofSubject, type Level, type Trimester } from '../types';
import { fitsInFrame, type Shape } from '../lib/figures';
import { createRng } from '../lib/seededRandom';
import { buildSession } from '../lib/sessionBuilder';
import type { WrittenItem } from './histoireGeographie';
import * as histoire from './histoire';
import * as geographie from './geographie';

const everyItem: [string, WrittenItem][] = [
  ...Object.entries(histoire.ITEMS).flatMap(([domain, items]) => items.map((item) => [domain, item] as [string, WrittenItem])),
  ...Object.entries(geographie.ITEMS).flatMap(([domain, items]) => items.map((item) => [domain, item] as [string, WrittenItem])),
];

const LEVELS: Level[] = ['CM1', 'CM2'];
const TRIMESTERS: Trimester[] = [1, 2, 3];

describe('les questions écrites d\'histoire et de géographie', () => {
  it('ont une bonne réponse, et trois mauvaises qui ne la répètent pas', () => {
    everyItem.forEach(([, item]) => {
      expect(item.wrong, item.prompt).not.toContain(item.correct);
      expect(new Set(item.wrong.filter((entry) => entry !== item.correct)).size, item.prompt).toBeGreaterThanOrEqual(3);
      expect(item.prompt.trim().length).toBeGreaterThan(8);
      expect(item.explanation, item.prompt).toBeTruthy();
    });
  });

  it('ne posent jamais deux fois la même question dans une même notion', () => {
    [histoire.ITEMS, geographie.ITEMS].forEach((bank) =>
      Object.values(bank).forEach((items) =>
        LEVELS.forEach((level) => {
          const prompts = items.filter((item) => item.level === level).map((item) => item.prompt);
          expect(new Set(prompts).size).toBe(prompts.length);
        })
      )
    );
  });

  it('ont des questions pour chaque trimestre de chaque niveau, dans chaque notion', () => {
    [histoire.ITEMS, geographie.ITEMS].forEach((bank) =>
      Object.entries(bank).forEach(([domain, items]) =>
        LEVELS.forEach((level) =>
          TRIMESTERS.forEach((trimester) =>
            expect(
              items.filter((item) => item.level === level && item.trimester === trimester).length,
              `${domain} ${level} T${trimester}`
            ).toBeGreaterThanOrEqual(domain === 'chronologie' ? 2 : 3)
          )
        )
      )
    );
  });

  it('écrivent « l\'est », « l\'ouest », jamais « le est »', () => {
    const texts = everyItem.flatMap(([, item]) => [item.prompt, item.correct, ...item.wrong, item.explanation ?? '']);
    texts.forEach((text) => expect(text).not.toMatch(/(^|\s)le (est|ouest)\b/));
  });
});

describe('les siècles', () => {
  it('se comptent comme à l\'école', () => {
    expect(histoire.centuryOf(476)).toBe(5);
    expect(histoire.centuryOf(1000)).toBe(10);
    expect(histoire.centuryOf(1001)).toBe(11);
    expect(histoire.centuryOf(1789)).toBe(18);
    expect(histoire.centuryOf(1800)).toBe(18);
    expect(histoire.centuryOf(1801)).toBe(19);
    expect(histoire.centuryOf(2002)).toBe(21);
  });

  it('s\'écrivent en chiffres romains', () => {
    expect([1, 4, 5, 9, 10, 14, 18, 19, 21].map(histoire.roman)).toEqual(['I', 'IV', 'V', 'IX', 'X', 'XIV', 'XVIII', 'XIX', 'XXI']);
    expect(histoire.centuryLabel(1)).toBe('Ier siècle');
    expect(histoire.centuryLabel(16)).toBe('XVIe siècle');
  });
});

describe('les frises', () => {
  it('placent chaque repère à sa place, de gauche à droite', () => {
    const reperes = histoire.REPERES.filter((entry) => entry.level === 'CM1' && entry.trimester === 2).slice(0, 4);
    const figure = histoire.timelineFigure(reperes, ['C', 'A', 'D', 'B']);
    expect(fitsInFrame(figure)).toBe(true);
    const marks = figure.shapes.filter((shape): shape is Extract<Shape, { kind: 'circle' }> => shape.kind === 'circle');
    const xs = marks.map((mark) => mark.center[0]);
    const years = reperes.map((entry) => entry.year);
    // Même ordre sur la frise que dans le temps.
    const byYear = [...years.keys()].sort((a, b) => years[a] - years[b]);
    const byX = [...xs.keys()].sort((a, b) => xs[a] - xs[b]);
    expect(byX).toEqual(byYear);
  });

  it('donnent comme réponse la lettre posée sur l\'année demandée', () => {
    for (let seed = 1; seed <= 40; seed++) {
      histoire
        .generateChronologie('CM2', 3, createRng(seed), 12)
        .filter((question) => question.figure)
        .forEach((question) => {
          const year = Number(question.prompt.match(/\((\d{3,4})\)/)?.[1]);
          const shapes = question.figure!.shapes;
          const marks = shapes.filter((shape): shape is Extract<Shape, { kind: 'circle' }> => shape.kind === 'circle');
          const letters = shapes.filter(
            (shape): shape is Extract<Shape, { kind: 'text' }> => shape.kind === 'text' && /^[ABCD]$/.test(shape.text)
          );
          const answer = question.choices[question.correctIndex];
          const letter = letters.find((entry) => entry.text === answer)!;
          const mark = marks.find((entry) => Math.abs(entry.center[0] - letter.at[0]) < 0.01)!;
          const reperes = histoire.REPERES.filter((entry) => entry.level === 'CM2');
          const others = marks.filter((entry) => entry !== mark);
          // La marque de la réponse est celle dont l'abscisse correspond à l'année.
          expect(reperes.some((entry) => entry.year === year)).toBe(true);
          others.forEach((other) => expect(other.center[0]).not.toBeCloseTo(mark.center[0], 3));
        });
    }
  });
});

describe('la rose des vents', () => {
  it('montre en couleur la direction de la bonne réponse', () => {
    const angleOf = { 'le nord': 0, 'le nord-est': 45, "l'est": 90, 'le sud-est': 135, 'le sud': 180, 'le sud-ouest': 225, "l'ouest": 270, 'le nord-ouest': 315 } as Record<string, number>;
    for (let seed = 1; seed <= 30; seed++) {
      (['CM1', 'CM2'] as Level[]).forEach((level) =>
        geographie
          .generateCartes(level, 1, createRng(seed), 12)
          .filter((question) => question.figure)
          .forEach((question) => {
            const arrow = question.figure!.shapes.find(
              (shape): shape is Extract<Shape, { kind: 'segment' }> => shape.kind === 'segment' && shape.ink === 'couleur'
            )!;
            const [dx, dy] = [arrow.to[0] - arrow.from[0], arrow.to[1] - arrow.from[1]];
            const degrees = (Math.round((Math.atan2(dx, -dy) * 180) / Math.PI) + 360) % 360;
            expect(degrees).toBe(angleOf[question.choices[question.correctIndex]]);
            expect(fitsInFrame(question.figure!)).toBe(true);
          })
      );
    }
  });
});

describe('les séances d\'histoire et de géographie', () => {
  const promptsOf = (bank: Record<string, WrittenItem[]>, level: Level) =>
    new Set(Object.values(bank).flatMap((items) => items.filter((item) => item.level === level).map((item) => item.prompt)));

  it('ne donnent au CM2 aucune question du CM1, et inversement', () => {
    [histoire.ITEMS, geographie.ITEMS].forEach((bank) => {
      // Une question posée aux deux niveaux (« le covoiturage ») n'est pas une
      // fuite : seules comptent celles propres à un niveau.
      const both = promptsOf(bank, 'CM1');
      const cm2Prompts = promptsOf(bank, 'CM2');
      const cm1 = new Set([...both].filter((prompt) => !cm2Prompts.has(prompt)));
      const cm2 = new Set([...cm2Prompts].filter((prompt) => !both.has(prompt)));
      for (let seed = 1; seed <= 20; seed++) {
        TRIMESTERS.forEach((trimester) => {
          const subject = bank === histoire.ITEMS ? 'histoire' : 'geographie';
          const domains = bank === histoire.ITEMS ? (['chronologie', 'evenements', 'mots-histoire'] as const) : (['cartes', 'habiter', 'mots-geographie'] as const);
          const forCm2 = buildSession({ domains: [...domains], level: 'CM2', trimester, seed });
          const forCm1 = buildSession({ domains: [...domains], level: 'CM1', trimester, seed });
          expect(forCm2.subject).toBe(subject);
          forCm2.questions.forEach((question) => expect(cm1.has(question.prompt), question.prompt).toBe(false));
          forCm1.questions.forEach((question) => expect(cm2.has(question.prompt), question.prompt).toBe(false));
        });
      }
    });
  });

  it('n\'avancent pas plus vite que l\'année : rien du 3e trimestre au 1er', () => {
    [histoire.ITEMS, geographie.ITEMS].forEach((bank) => {
      for (let seed = 1; seed <= 20; seed++) {
        LEVELS.forEach((level) => {
          const ofLevel = Object.values(bank).flatMap((items) => items.filter((item) => item.level === level));
          const first = new Set(ofLevel.filter((item) => item.trimester === 1).map((item) => item.prompt));
          const later = new Set(ofLevel.filter((item) => item.trimester > 1 && !first.has(item.prompt)).map((item) => item.prompt));
          const domains = bank === histoire.ITEMS ? (['chronologie', 'evenements', 'mots-histoire'] as const) : (['cartes', 'habiter', 'mots-geographie'] as const);
          buildSession({ domains: [...domains], level, trimester: 1, seed }).questions.forEach((question) =>
            expect(later.has(question.prompt), question.prompt).toBe(false)
          );
        });
      }
    });
  });

  it('ne mêlent jamais l\'histoire et la géographie', () => {
    expect(() => buildSession({ domains: ['chronologie', 'cartes'], level: 'CM1', trimester: 1, seed: 1 })).toThrow();
    expect(() => buildSession({ domains: ['habiter', 'calcul'], level: 'CM1', trimester: 1, seed: 1 })).toThrow();
  });

  it('ont toujours leurs douze questions, bien formées', () => {
    (['chronologie', 'evenements', 'mots-histoire', 'cartes', 'habiter', 'mots-geographie'] as const).forEach((domain) =>
      LEVELS.forEach((level) =>
        TRIMESTERS.forEach((trimester) => {
          const session = buildSession({ domains: [domain], level, trimester, seed: 7 });
          expect(session.questions, `${domain} ${level} T${trimester}`).toHaveLength(12);
          session.questions.forEach((question) => {
            expect(new Set(question.choices).size).toBe(question.choices.length);
            expect(question.choices[question.correctIndex]).toBeDefined();
            expect(question.explanation).toBeTruthy();
          });
        })
      )
    );
  });
});

describe('le nom des matières dans une phrase', () => {
  it('s\'élide devant une voyelle ou un h muet', () => {
    expect(ofSubject('histoire')).toBe("d'histoire");
    expect(ofSubject('geographie')).toBe('de géographie');
    expect(ofSubject('francais')).toBe('de français');
    expect(ofSubject('maths')).toBe('de maths');
  });
});
