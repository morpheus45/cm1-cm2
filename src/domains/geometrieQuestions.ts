import type { Point, Shape } from '../lib/figures';
import { polar } from '../lib/figures';
import type { Stage } from '../lib/progression';
import { rngInt, rngPick, rngShuffle } from '../lib/seededRandom';
import { choose, type Family } from './geometrieCommun';

/**
 * D'autres questions de géométrie, à choix :
 * - CM1, 1er trimestre : parmi trois droites nommées, lesquelles sont
 *   parallèles, lesquelles sont perpendiculaires ;
 * - CM1, 3e : dans un cercle, quel segment est un diamètre, un rayon ;
 * - CM2, 1er : quel angle est le plus grand, le plus petit — les côtés les
 *   plus longs ne font pas l'angle le plus grand ;
 * - CM2, 2e et 3e : quelle phrase est vraie (propriétés des figures).
 */

const FRAME: [number, number, number, number] = [12, 12, 288, 188];

/** La portion d'une droite (un point, un angle en degrés) visible dans le
 *  cadre. */
export function clipLine([px, py]: Point, degrees: number, [left, top, right, bottom] = FRAME): [Point, Point] | null {
  const [dx, dy] = [Math.cos((degrees * Math.PI) / 180), Math.sin((degrees * Math.PI) / 180)];
  let low = -Infinity;
  let high = Infinity;
  const clip = (start: number, delta: number, min: number, max: number) => {
    if (Math.abs(delta) < 1e-9) {
      if (start < min || start > max) [low, high] = [1, 0];
      return;
    }
    const [t1, t2] = [(min - start) / delta, (max - start) / delta].sort((a, b) => a - b);
    low = Math.max(low, t1);
    high = Math.min(high, t2);
  };
  clip(px, dx, left, right);
  clip(py, dy, top, bottom);
  if (low >= high) return null;
  const at = (t: number): Point => [Math.round((px + dx * t) * 10) / 10, Math.round((py + dy * t) * 10) / 10];
  return [at(low), at(high)];
}

const NAMES = ['(d1)', '(d2)', '(d3)'];

function distanceToSegment([px, py]: Point, [[ax, ay], [bx, by]]: [Point, Point]): number {
  const [dx, dy] = [bx - ax, by - ay];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const droitesNommees: Family = {
  name: 'droites-nommees',
  minStage: 1,
  make: (rng) => {
    for (;;) {
      const relation = rng() < 0.5 ? 'paralleles' : 'perpendiculaires';
      const theta = rngInt(rng, 0, 179);
      const first: Point = [rngInt(rng, 110, 190), rngInt(rng, 70, 130)];
      const offset = rngPick(rng, [-1, 1]) * rngInt(rng, 45, 65);
      const normal: Point = [-Math.sin((theta * Math.PI) / 180), Math.cos((theta * Math.PI) / 180)];
      const second: Point =
        relation === 'paralleles' ? [first[0] + normal[0] * offset, first[1] + normal[1] * offset] : [rngInt(rng, 100, 200), rngInt(rng, 60, 140)];
      const secondAngle = relation === 'paralleles' ? theta : theta + 90;
      // La troisième coupe les deux autres, sans angle droit : à 25° au moins
      // de leurs directions et de la perpendiculaire.
      const delta = rngPick(rng, [-1, 1]) * rngInt(rng, 25, 65);
      const third: Point = [rngInt(rng, 100, 200), rngInt(rng, 60, 140)];
      const lines = [clipLine(first, theta), clipLine(second, secondAngle), clipLine(third, theta + delta)];
      if (lines.some((line) => !line || Math.hypot(line[1][0] - line[0][0], line[1][1] - line[0][1]) < 130)) continue;
      const segments = lines as [Point, Point][];
      // Le nom de chaque droite, près d'une extrémité, à l'intérieur du cadre.
      const labels: Point[] = [];
      let placed = true;
      for (const [lineIndex, [start, end]] of segments.entries()) {
        const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
        const [ux, uy] = [(end[0] - start[0]) / length, (end[1] - start[1]) / length];
        const options: Point[] = [
          [start[0] + ux * 22 - uy * 13, start[1] + uy * 22 + ux * 13 + 5],
          [start[0] + ux * 22 + uy * 13, start[1] + uy * 22 - ux * 13 + 5],
          [end[0] - ux * 22 - uy * 13, end[1] - uy * 22 + ux * 13 + 5],
          [end[0] - ux * 22 + uy * 13, end[1] - uy * 22 - ux * 13 + 5],
        ];
        // Dans le cadre, loin des autres noms, et nettement plus près de sa
        // droite que des deux autres : aucun nom ne doit prêter à confusion.
        const fit = options.find(
          ([x, y]) =>
            x >= 24 &&
            x <= 276 &&
            y >= 20 &&
            y <= 192 &&
            labels.every(([lx, ly]) => Math.hypot(x - lx, y - ly) >= 34) &&
            segments.every((other, otherIndex) => otherIndex === lineIndex || distanceToSegment([x, y - 5], other) >= 24)
        );
        if (!fit) {
          placed = false;
          break;
        }
        labels.push(fit);
      }
      if (!placed) continue;
      const names = rngShuffle(rng, NAMES);
      const pair = [names[0], names[1]].sort().join(' et ');
      const pairs = ['(d1) et (d2)', '(d1) et (d3)', '(d2) et (d3)'];
      const word = relation === 'paralleles' ? 'parallèles' : 'perpendiculaires';
      return {
        detail: `${relation}-${theta}-${names.join('')}`,
        instruction: relation === 'paralleles' ? 'Deux droites parallèles ne se coupent jamais' : 'Tu peux vérifier avec ton équerre',
        prompt: `Quelles droites sont ${word} ?`,
        figure: {
          width: 300,
          height: 200,
          shapes: [
            ...segments.map(([from, to]): Shape => ({ kind: 'segment', from, to, width: 2.5 })),
            ...labels.map((at, index): Shape => ({ kind: 'text', at, text: names[index], anchor: 'middle', bold: true, size: 13, halo: true })),
          ],
          alt: 'Trois droites nommées (d1), (d2) et (d3).',
        },
        choices: pairs,
        correctIndex: pairs.indexOf(pair),
        explanation:
          relation === 'paralleles'
            ? `${pair} ont la même direction : elles ne se couperont jamais.`
            : `${pair} se coupent en formant un angle droit.`,
      };
    }
  },
};

const cercleSegments: Family = {
  name: 'cercle-segments',
  minStage: 3,
  make: (rng) => {
    const center: Point = [150, 100];
    const radius = 70;
    const a = rngInt(rng, 0, 179);
    const side = rngPick(rng, [1, -1]);
    const c = a + side * rngInt(rng, 60, 120);
    // La corde : sur l'autre moitié du cercle, loin de C et du centre, pour
    // ne croiser aucun autre segment.
    const d = a + 180 + side * rngInt(rng, 25, 35);
    const e = d + side * rngInt(rng, 80, 100);
    const on = (degrees: number, extra = 0) => polar(center, radius + extra, degrees);
    const [A, B, C, D, E] = [on(a), on(a + 180), on(c), on(d), on(e)];
    const letter = (degrees: number, text: string): Shape => {
      const [x, y] = on(degrees, 14);
      return { kind: 'text', at: [x, y + 5], text, anchor: 'middle', bold: true, size: 13, halo: true };
    };
    const [ox, oy] = polar(center, 14, c + 180);
    const asked = rng() < 0.5 ? 'diametre' : 'rayon';
    const choices = ['[AB]', '[OC]', '[DE]'];
    return {
      detail: `${asked}-${a}-${c}`,
      instruction: 'Le point O est le centre du cercle',
      prompt: `Quel segment est ${asked === 'diametre' ? 'un **diamètre**' : 'un **rayon**'} du cercle ?`,
      figure: {
        width: 300,
        height: 200,
        shapes: [
          { kind: 'circle', center, radius },
          { kind: 'segment', from: A, to: B, width: 2.5 },
          { kind: 'segment', from: center, to: C, width: 2.5 },
          { kind: 'segment', from: D, to: E, width: 2.5 },
          ...[A, B, C, D, E, center].map((at): Shape => ({ kind: 'point', at })),
          letter(a, 'A'),
          letter(a + 180, 'B'),
          letter(c, 'C'),
          letter(d, 'D'),
          letter(e, 'E'),
          { kind: 'text', at: [ox, oy + 5], text: 'O', anchor: 'middle', bold: true, size: 13, halo: true },
        ],
        alt: 'Un cercle de centre O et trois segments : [AB], [OC] et [DE].',
      },
      choices,
      correctIndex: asked === 'diametre' ? 0 : 1,
      explanation:
        asked === 'diametre'
          ? '[AB] relie deux points du cercle en passant par le centre O : c\'est un diamètre. [DE] ne passe pas par le centre.'
          : '[OC] relie le centre O à un point du cercle : c\'est un rayon.',
    };
  },
};

const ANGLE_SIZES = [25, 40, 55, 70, 85, 100, 115, 130, 145, 160];

/** Trois angles de tailles bien différentes (20° d'écart au moins). */
function threeAngles(rng: () => number): number[] {
  for (;;) {
    const picked = rngShuffle(rng, ANGLE_SIZES).slice(0, 3);
    const sorted = [...picked].sort((x, y) => x - y);
    if (sorted[1] - sorted[0] >= 20 && sorted[2] - sorted[1] >= 20) return picked;
  }
}

const anglePlusGrand: Family = {
  name: 'angle-plus-grand',
  minStage: 4,
  make: (rng) => {
    const sizes = threeAngles(rng);
    const sorted = [...sizes].sort((x, y) => x - y);
    // Le plus grand angle a les côtés les plus courts : on compare
    // l'ouverture, pas la longueur des traits.
    const armOf = (size: number) => [62, 50, 38][sorted.indexOf(size)];
    const letters = ['A', 'B', 'C'];
    const shapes: Shape[] = [];
    sizes.forEach((size, index) => {
      const cx = 50 + index * 100;
      const arm = armOf(size);
      const cos = Math.cos((size * Math.PI) / 180);
      const span = arm - Math.min(0, arm * cos);
      const vertex: Point = [Math.round((cx - span / 2 - Math.min(0, arm * cos)) * 10) / 10, 118];
      shapes.push(
        { kind: 'segment', from: vertex, to: polar(vertex, arm, 0), width: 2.5 },
        { kind: 'segment', from: vertex, to: polar(vertex, arm, size), width: 2.5 },
        { kind: 'arc', center: vertex, radius: 13, from: 0, to: size, ink: 'couleur' },
        { kind: 'text', at: [cx, 148], text: letters[index], anchor: 'middle', bold: true, size: 15 }
      );
    });
    const biggest = rng() < 0.5;
    const target = biggest ? Math.max(...sizes) : Math.min(...sizes);
    const letter = letters[sizes.indexOf(target)];
    const choices = letters.map((entry) => `l'angle ${entry}`);
    return {
      detail: `${biggest ? 'grand' : 'petit'}-${sizes.join('.')}`,
      instruction: 'Compare l\'ouverture des angles, pas la longueur de leurs côtés',
      prompt: `Quel angle est le plus ${biggest ? 'grand' : 'petit'} ?`,
      figure: { width: 300, height: 160, shapes, alt: 'Trois angles, A, B et C, dessinés côte à côte.' },
      choices,
      correctIndex: letters.indexOf(letter),
      explanation: biggest
        ? `L'angle ${letter} est le plus ouvert : c'est le plus grand, même si ses côtés sont les plus courts.`
        : `L'angle ${letter} est le moins ouvert : c'est le plus petit, même si ses côtés sont les plus longs.`,
    };
  },
};

interface Statements {
  minStage: Stage;
  right: string;
  wrong: [string, string, string];
  why: string;
}

/** Une phrase vraie et trois fausses, sur les propriétés des figures. */
export const STATEMENTS: Statements[] = [
  {
    minStage: 5,
    right: 'Un carré est un rectangle particulier.',
    wrong: ['Un rectangle est toujours un carré.', 'Un losange a toujours quatre angles droits.', 'Un triangle peut avoir deux angles droits.'],
    why: 'Un carré a quatre angles droits, comme tout rectangle ; il a en plus quatre côtés égaux.',
  },
  {
    minStage: 5,
    right: 'Le diamètre d\'un cercle mesure le double de son rayon.',
    wrong: ['Le rayon d\'un cercle mesure le double de son diamètre.', 'Un cercle a quatre côtés.', 'Le centre d\'un cercle est sur le cercle.'],
    why: 'Le diamètre traverse le cercle en passant par le centre : ce sont deux rayons bout à bout.',
  },
  {
    minStage: 5,
    right: 'Un triangle équilatéral a ses trois côtés de même longueur.',
    wrong: ['Un triangle rectangle a trois angles droits.', 'Un triangle isocèle a trois côtés de longueurs différentes.', 'Un triangle a quatre sommets.'],
    why: '« Équilatéral » veut dire « côtés égaux » : ses trois côtés ont la même longueur.',
  },
  {
    minStage: 5,
    right: 'Les diagonales d\'un rectangle ont la même longueur.',
    wrong: ['Un rectangle a seulement deux angles droits.', 'Les côtés d\'un rectangle ont tous la même longueur.', 'Un parallélogramme a toujours un angle droit.'],
    why: 'Dans un rectangle, les deux diagonales ont la même longueur et se coupent en leur milieu.',
  },
  {
    minStage: 5,
    right: 'Un cube a 6 faces, 12 arêtes et 8 sommets.',
    wrong: ['Un cube a 8 faces.', 'Un pavé droit a 6 sommets.', 'Une pyramide à base carrée a 4 faces.'],
    why: 'Un cube a 6 faces carrées, 12 arêtes et 8 sommets ; une pyramide à base carrée a 5 faces.',
  },
  {
    minStage: 6,
    right: 'Deux droites perpendiculaires à une même droite sont parallèles entre elles.',
    wrong: ['Deux droites parallèles finissent toujours par se couper.', 'Deux droites perpendiculaires ne se coupent jamais.', 'Deux droites qui se coupent forment toujours un angle droit.'],
    why: 'Deux droites qui font chacune un angle droit avec la même droite ont la même direction : elles sont parallèles.',
  },
  {
    minStage: 6,
    right: 'Un losange a quatre côtés de même longueur.',
    wrong: ['Un losange a toujours quatre angles droits.', 'Un rectangle a toujours quatre côtés égaux.', 'Un triangle rectangle a deux angles droits.'],
    why: 'Un losange a quatre côtés égaux ; ses angles ne sont pas forcément droits.',
  },
];

const phraseVraie: Family = {
  name: 'phrase-vraie',
  minStage: 5,
  make: (rng, stage) => {
    const available = STATEMENTS.filter((entry) => entry.minStage <= stage);
    const index = rngInt(rng, 0, available.length - 1);
    const { right, wrong, why } = available[index];
    return {
      detail: String(STATEMENTS.indexOf(available[index])),
      instruction: 'Une seule phrase est vraie',
      prompt: 'Quelle phrase est vraie ?',
      ...choose(rng, right, wrong),
      explanation: why,
    };
  },
};

export const QUESTION_FAMILIES: Family[] = [droitesNommees, cercleSegments, anglePlusGrand, phraseVraie];
