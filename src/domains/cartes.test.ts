import { describe, expect, it } from 'vitest';
import type { Level, Trimester } from '../types';
import { fitsInFrame, type Figure, type Point, type Shape } from '../lib/figures';
import { createRng } from '../lib/seededRandom';
import { FRANCE_MAP, PLANISPHERE } from './cartesFonds';
import * as cartes from './cartes';
import * as geographie from './geographie';

/** Le point est-il dans la surface (règle pair-impair) ? */
function inside([x, y]: Point, rings: Point[][]): boolean {
  let crossings = 0;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) crossings++;
    }
  }
  return crossings % 2 === 1;
}

function distanceToLine([px, py]: Point, line: Point[]): number {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1];
    const [bx, by] = line[i];
    const length = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / length));
    best = Math.min(best, Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay))));
  }
  return best;
}

const city = (name: cartes.City) => FRANCE_MAP.cities[name].at as Point;
const land = [...FRANCE_MAP.france, ...FRANCE_MAP.neighbours] as Point[][];

/** Retrouve la clé d'un repère à partir de son nom affiché. */
function keyOf<T extends string>(names: Record<T, string>, shown: string): T {
  const found = (Object.keys(names) as T[]).find((key) => names[key] === shown);
  if (!found) throw new Error(`Nom inconnu : ${shown}`);
  return found;
}

const shapesOf = <K extends Shape['kind']>(figure: Figure, kind: K) =>
  figure.shapes.filter((shape): shape is Extract<Shape, { kind: K }> => shape.kind === kind);

describe('les fonds de carte', () => {
  it('ont les six continents et un nom pour chaque repère', () => {
    expect(Object.keys(PLANISPHERE.continents).sort()).toEqual(Object.keys(cartes.CONTINENT_NAMES).sort());
    expect(Object.keys(PLANISPHERE.oceans).sort()).toEqual(Object.keys(cartes.OCEAN_NAMES).sort());
    expect(Object.keys(FRANCE_MAP.cities).sort()).toEqual(Object.keys(cartes.CITY_NAMES).sort());
    expect(Object.keys(FRANCE_MAP.rivers).sort()).toEqual(Object.keys(cartes.RIVER_NAMES).sort());
    expect(Object.keys(FRANCE_MAP.massifs).sort()).toEqual(Object.keys(cartes.MASSIF_NAMES).sort());
    expect(Object.keys(FRANCE_MAP.seas).sort()).toEqual(Object.keys(cartes.SEA_NAMES).sort());
    expect(Object.keys(FRANCE_MAP.countries).sort()).toEqual(Object.keys(cartes.COUNTRY_NAMES).sort());
    Object.values(PLANISPHERE.continents).forEach((rings) => expect(rings.length).toBeGreaterThan(0));
  });

  it('placent chaque ville en France, là où elle est', () => {
    Object.keys(FRANCE_MAP.cities).forEach((name) => expect(inside(city(name as cartes.City), FRANCE_MAP.france as Point[][])).toBe(true));
    // Le nord est en haut (y petit), l'est à droite.
    expect(city('lille')[1]).toBeLessThan(city('paris')[1]);
    expect(city('paris')[1]).toBeLessThan(city('lyon')[1]);
    expect(city('lyon')[1]).toBeLessThan(city('marseille')[1]);
    expect(city('strasbourg')[0]).toBeGreaterThan(city('paris')[0]);
    expect(city('rennes')[0]).toBeLessThan(city('paris')[0]);
    expect(city('bordeaux')[0]).toBeLessThan(city('toulouse')[0]);
    expect(city('nice')[0]).toBeGreaterThan(city('marseille')[0]);
  });

  it('font passer les fleuves par leurs villes', () => {
    const river = (name: cartes.River) => FRANCE_MAP.rivers[name].path as Point[];
    expect(distanceToLine(city('paris'), river('seine'))).toBeLessThan(3);
    expect(distanceToLine(city('nantes'), river('loire'))).toBeLessThan(3);
    expect(distanceToLine(city('toulouse'), river('garonne'))).toBeLessThan(3);
    expect(distanceToLine(city('bordeaux'), river('garonne'))).toBeLessThan(3);
    expect(distanceToLine(city('lyon'), river('rhone'))).toBeLessThan(3);
    // Et pas par les villes des autres.
    expect(distanceToLine(city('paris'), river('loire'))).toBeGreaterThan(15);
    expect(distanceToLine(city('lyon'), river('seine'))).toBeGreaterThan(15);
    // Leur milieu est en France.
    (Object.keys(FRANCE_MAP.rivers) as cartes.River[]).forEach((name) => {
      const path = river(name);
      expect(inside(path[Math.floor(path.length / 2)], FRANCE_MAP.france as Point[][])).toBe(true);
    });
  });

  it('dressent les massifs là où ils sont', () => {
    const center = (name: cartes.Massif) => {
      const peaks = FRANCE_MAP.massifs[name].peaks as Point[];
      return [peaks.reduce((sum, [x]) => sum + x, 0) / peaks.length, peaks.reduce((sum, [, y]) => sum + y, 0) / peaks.length];
    };
    expect(center('alpes')[0]).toBeGreaterThan(city('lyon')[0]);
    expect(center('pyrenees')[1]).toBeGreaterThan(city('toulouse')[1]);
    expect(center('vosges')[0]).toBeLessThan(city('strasbourg')[0]);
    expect(center('massif-central')[1]).toBeGreaterThan(city('paris')[1]);
    expect(center('massif-central')[0]).toBeLessThan(city('lyon')[0]);
    expect(center('jura')[1]).toBeLessThan(center('alpes')[1]);
  });

  it('posent les mers sur l\'eau et les noms de pays sur leur voisin', () => {
    Object.values(FRANCE_MAP.seas).forEach((at) => expect(inside(at as Point, land)).toBe(false));
    Object.values(FRANCE_MAP.countries).forEach((at) => {
      expect(inside(at as Point, FRANCE_MAP.neighbours as Point[][])).toBe(true);
      expect(inside(at as Point, FRANCE_MAP.france as Point[][])).toBe(false);
    });
    Object.values(PLANISPHERE.oceans).forEach((at) => expect(inside(at as Point, PLANISPHERE.land as Point[][])).toBe(false));
    Object.values(PLANISPHERE.places).forEach((at) => expect(inside(at as Point, PLANISPHERE.land as Point[][])).toBe(true));
  });
});

describe('les questions sur carte', () => {
  const namesOf = (level: Level, trimester: Trimester) => {
    const { current, review } = cartes.mapMakersFor(level, trimester);
    return { current: current.map((maker) => maker.name).sort(), review: review.map((maker) => maker.name).sort() };
  };

  it('arrivent au bon trimestre', () => {
    expect(namesOf('CM1', 1)).toEqual({ current: ['continent', 'france-monde', 'mer', 'ocean', 'ville'], review: [] });
    expect(namesOf('CM1', 2)).toEqual({
      current: ['direction', 'extreme', 'fleuve', 'massif', 'pays'],
      review: ['continent', 'france-monde', 'mer', 'ocean', 'ville'],
    });
    expect(namesOf('CM1', 3).current).toEqual([]);
    expect(namesOf('CM2', 1).current).toEqual(['continent', 'direction', 'extreme', 'fleuve', 'massif', 'mer', 'ocean', 'pays', 'ville']);
    expect(namesOf('CM2', 3).review).toHaveLength(9);
  });

  it('désignent sur la carte la bonne réponse', () => {
    for (const level of ['CM1', 'CM2'] as Level[]) {
      const makers = [...cartes.mapMakersFor(level, 3).review];
      for (let seed = 1; seed <= 40; seed++) {
        const rng = createRng(seed);
        for (const maker of makers) {
          const draft = maker.make(rng, level);
          const answer = draft.choices[draft.correctIndex];
          const figure = draft.figure!;
          expect(new Set(draft.choices).size).toBe(draft.choices.length);
          expect(draft.choices).toHaveLength(4);
          expect(fitsInFrame(figure)).toBe(true);
          expect(figure.alt.length).toBeGreaterThan(20);
          if (maker.name !== 'extreme' && maker.name !== 'france-monde') expect(figure.alt).not.toContain(answer);
          const letter = shapesOf(figure, 'lettre')[0];
          switch (maker.name) {
            case 'continent': {
              const highlight = shapesOf(figure, 'aire').find((shape) => shape.ground === 'surbrillance')!;
              expect(highlight.rings).toBe(PLANISPHERE.continents[keyOf(cartes.CONTINENT_NAMES, answer)]);
              break;
            }
            case 'ocean':
              expect(letter.at).toEqual(PLANISPHERE.oceans[keyOf(cartes.OCEAN_NAMES, answer)]);
              break;
            case 'france-monde': {
              const marked = shapesOf(figure, 'lettre').find((shape) => shape.text === answer)!;
              expect(marked.at).toEqual(PLANISPHERE.places.france);
              expect(shapesOf(figure, 'lettre')).toHaveLength(4);
              break;
            }
            case 'ville': {
              const highlighted = shapesOf(figure, 'ville').filter((shape) => shape.highlight);
              expect(highlighted).toHaveLength(1);
              expect(highlighted[0].at).toEqual(city(keyOf(cartes.CITY_NAMES, answer)));
              expect(cartes.CITY_POOL[level]).toContain(keyOf(cartes.CITY_NAMES, answer));
              break;
            }
            case 'mer':
              expect(letter.at).toEqual(FRANCE_MAP.seas[keyOf(cartes.SEA_NAMES, answer)]);
              break;
            case 'fleuve':
              expect(letter.at).toEqual(FRANCE_MAP.rivers[keyOf(cartes.RIVER_NAMES, answer)].label);
              break;
            case 'massif':
              expect(letter.at).toEqual(FRANCE_MAP.massifs[keyOf(cartes.MASSIF_NAMES, answer)].label);
              break;
            case 'pays':
              expect(letter.at).toEqual(FRANCE_MAP.countries[keyOf(cartes.COUNTRY_NAMES, answer)]);
              break;
            case 'extreme': {
              const cities = draft.choices.map((choice) => keyOf(cartes.CITY_NAMES, choice));
              const winner = keyOf(cartes.CITY_NAMES, answer);
              // « est » est aussi un verbe : on lit la fin de la question.
              const side = /au nord \?$/.test(draft.prompt)
                ? 'nord'
                : /au sud \?$/.test(draft.prompt)
                  ? 'sud'
                  : /à l'est \?$/.test(draft.prompt)
                    ? 'est'
                    : 'ouest';
              expect(draft.prompt).toMatch(/la plus (au nord|au sud|à l'est|à l'ouest) \?$/);
              const score = (name: cartes.City) =>
                side === 'nord' ? -city(name)[1] : side === 'sud' ? city(name)[1] : side === 'est' ? city(name)[0] : -city(name)[0];
              cities.filter((name) => name !== winner).forEach((name) => expect(score(winner) - score(name)).toBeGreaterThanOrEqual(10));
              break;
            }
            case 'direction': {
              const [from, to] = shapesOf(figure, 'ville').map((shape) => shape.at);
              const bearing = cartes.screenBearing(from, to);
              const direction = keyOf(
                Object.fromEntries(Object.keys(cartes.DIRECTION_ANGLES).map((key) => [key, cartes.directionLabel(key as cartes.Direction)])) as Record<cartes.Direction, string>,
                answer
              );
              const gap = Math.abs(bearing - cartes.DIRECTION_ANGLES[direction]) % 360;
              expect(Math.min(gap, 360 - gap)).toBeLessThanOrEqual(12);
              if (level === 'CM1') expect(['le nord', 'le sud', 'l\'est', 'l\'ouest']).toContain(answer);
              break;
            }
            default:
              throw new Error(`Question sans vérification : ${maker.name}`);
          }
        }
      }
    }
  });

  it('écrivent les noms de villes dans le cadre, sans chevauchement', () => {
    for (const level of ['CM1', 'CM2'] as Level[]) {
      const makers = cartes.MAP_MAKERS.filter((maker) => maker.name === 'extreme' || maker.name === 'direction');
      for (let seed = 1; seed <= 60; seed++) {
        for (const maker of makers) {
          const figure = maker.make(createRng(seed), level).figure!;
          const boxes = shapesOf(figure, 'text')
            .filter((shape) => shape.text.length > 1)
            .map((shape) => {
              const width = shape.text.length * (shape.size ?? 15) * 0.56;
              const left = shape.anchor === 'end' ? shape.at[0] - width : shape.at[0];
              return [left, shape.at[1] - 11, left + width, shape.at[1]] as const;
            });
          boxes.forEach((box) => {
            expect(box[0]).toBeGreaterThanOrEqual(0);
            expect(box[2]).toBeLessThanOrEqual(figure.width);
          });
          boxes.forEach((a, i) =>
            boxes.forEach((b, j) => {
              if (j > i) expect(a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]).toBe(false);
            })
          );
        }
      }
    }
  });

  it('trouvent assez de trajets sans ambiguïté', () => {
    const cm1 = cartes.tripsFor('CM1');
    expect(cm1.length).toBeGreaterThanOrEqual(6);
    cm1.forEach((trip) => expect(['nord', 'sud', 'est', 'ouest']).toContain(trip.direction));
    expect(cartes.tripsFor('CM2').length).toBeGreaterThanOrEqual(15);
    // Lille est au nord de Paris ; Lyon au sud.
    const trip = (from: cartes.City, to: cartes.City) => cartes.tripsFor('CM2').find((entry) => entry.from === from && entry.to === to);
    expect(trip('paris', 'lille')?.direction ?? 'nord').toBe('nord');
    expect(trip('lyon', 'marseille')?.direction).toBe('sud');
  });

  it('entrent dans les séances de géographie, au bon trimestre', () => {
    let maps = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const questions = geographie.generateCartes('CM1', 1, createRng(seed), 12);
      expect(questions).toHaveLength(12);
      questions.forEach((question) => expect(question.id).not.toMatch(/carte-(fleuve|massif|pays|extreme|direction)/));
      maps += questions.filter((question) => question.figure?.shapes.some((shape) => shape.kind === 'aire')).length;
    }
    expect(maps).toBeGreaterThan(30);
    const cm2 = geographie.generateCartes('CM2', 1, createRng(7), 12);
    expect(new Set(cm2.map((question) => question.id)).size).toBe(12);
  });
});
