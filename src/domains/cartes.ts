import type { Level, Trimester } from '../types';
import type { Figure, Point, Shape } from '../lib/figures';
import { rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { choose, type Draft } from './histoireGeographie';
import { FRANCE_MAP, PLANISPHERE } from './cartesFonds';

/**
 * Les questions sur carte : le planisphère (continents, océans) et la carte
 * de France (villes, mers, fleuves, massifs, pays voisins, directions).
 *
 * Les fonds viennent de `cartesFonds.ts`, généré par
 * `tools/generate-maps.mjs` à partir de Natural Earth. Ce que la question
 * désigne est en orange, ou marqué d'une lettre ; jamais nommé sur la carte.
 *
 * Progression :
 * - CM1, 1er trimestre : continents et océans ; la France sur le
 *   planisphère ; les grandes villes ; les mers qui bordent la France ;
 * - CM1, 2e trimestre : fleuves, massifs, pays voisins ; lire une carte
 *   (la ville la plus au nord, la direction d'un trajet, quatre directions) ;
 * - CM2, dès le 1er trimestre : tous ces repères, huit directions pour « se
 *   déplacer ».
 */

export type Continent = keyof typeof PLANISPHERE.continents;
export type Ocean = keyof typeof PLANISPHERE.oceans;
export type Place = keyof typeof PLANISPHERE.places;
export type City = keyof typeof FRANCE_MAP.cities;
export type River = keyof typeof FRANCE_MAP.rivers;
export type Massif = keyof typeof FRANCE_MAP.massifs;
export type Sea = keyof typeof FRANCE_MAP.seas;
export type Country = keyof typeof FRANCE_MAP.countries;

export const CONTINENT_NAMES: Record<Continent, string> = {
  afrique: 'l\'Afrique',
  amerique: 'l\'Amérique',
  antarctique: 'l\'Antarctique',
  asie: 'l\'Asie',
  europe: 'l\'Europe',
  oceanie: 'l\'Océanie',
};

const CONTINENT_HINTS: Record<Continent, string> = {
  afrique: 'L\'Afrique est au sud de l\'Europe. L\'équateur la traverse.',
  amerique: 'L\'Amérique s\'étire du nord au sud, entre l\'océan Atlantique et l\'océan Pacifique.',
  antarctique: 'L\'Antarctique est le continent glacé, autour du pôle Sud.',
  asie: 'L\'Asie, le plus grand continent, s\'étend de l\'Europe jusqu\'à l\'océan Pacifique.',
  europe: 'L\'Europe, notre continent, est au nord de l\'Afrique et à l\'ouest de l\'Asie.',
  oceanie: 'L\'Océanie, avec l\'Australie et des milliers d\'îles, est au sud-est de l\'Asie.',
};

export const OCEAN_NAMES: Record<Ocean, string> = {
  atlantique: 'l\'océan Atlantique',
  pacifique: 'l\'océan Pacifique',
  indien: 'l\'océan Indien',
  arctique: 'l\'océan Arctique',
  austral: 'l\'océan Austral',
};

const OCEAN_HINTS: Record<Ocean, string> = {
  atlantique: 'L\'océan Atlantique sépare l\'Europe et l\'Afrique de l\'Amérique.',
  pacifique: 'L\'océan Pacifique, le plus grand, sépare l\'Asie et l\'Océanie de l\'Amérique.',
  indien: 'L\'océan Indien est au sud de l\'Asie, entre l\'Afrique et l\'Océanie.',
  arctique: 'L\'océan Arctique entoure le pôle Nord.',
  austral: 'L\'océan Austral entoure l\'Antarctique.',
};

export const CITY_NAMES: Record<City, string> = {
  paris: 'Paris',
  lyon: 'Lyon',
  marseille: 'Marseille',
  toulouse: 'Toulouse',
  bordeaux: 'Bordeaux',
  lille: 'Lille',
  nantes: 'Nantes',
  strasbourg: 'Strasbourg',
  nice: 'Nice',
  rennes: 'Rennes',
  montpellier: 'Montpellier',
};

const CITY_HINTS: Record<City, string> = {
  paris: 'Paris, la capitale, est dans le nord du pays, sur la Seine.',
  lyon: 'Lyon est au centre-est, là où la Saône rejoint le Rhône.',
  marseille: 'Marseille est au sud-est, au bord de la mer Méditerranée.',
  toulouse: 'Toulouse est au sud-ouest, sur la Garonne.',
  bordeaux: 'Bordeaux est au sud-ouest, sur la Garonne, près de l\'océan Atlantique.',
  lille: 'Lille est tout au nord, près de la Belgique.',
  nantes: 'Nantes est à l\'ouest, sur la Loire, près de l\'océan Atlantique.',
  strasbourg: 'Strasbourg est à l\'est, au bord du Rhin, face à l\'Allemagne.',
  nice: 'Nice est au sud-est, au bord de la Méditerranée, près de l\'Italie.',
  rennes: 'Rennes est à l\'ouest, en Bretagne.',
  montpellier: 'Montpellier est au sud, près de la mer Méditerranée.',
};

/** Les villes de chaque niveau : les huit plus grandes au CM1, onze au CM2. */
export const CITY_POOL: Record<Level, City[]> = {
  CM1: ['paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'lille', 'nantes', 'strasbourg'],
  CM2: ['paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'lille', 'nantes', 'strasbourg', 'nice', 'rennes', 'montpellier'],
};

export const RIVER_NAMES: Record<River, string> = {
  seine: 'la Seine',
  loire: 'la Loire',
  garonne: 'la Garonne',
  rhone: 'le Rhône',
};

const RIVER_HINTS: Record<River, string> = {
  seine: 'La Seine traverse Paris et se jette dans la Manche.',
  loire: 'La Loire, le plus long fleuve de France, se jette dans l\'océan Atlantique.',
  garonne: 'La Garonne descend des Pyrénées, passe à Toulouse puis à Bordeaux.',
  rhone: 'Le Rhône vient de Suisse, passe à Lyon et se jette dans la Méditerranée.',
};

export const MASSIF_NAMES: Record<Massif, string> = {
  alpes: 'les Alpes',
  pyrenees: 'les Pyrénées',
  'massif-central': 'le Massif central',
  jura: 'le Jura',
  vosges: 'les Vosges',
};

const MASSIF_HINTS: Record<Massif, string> = {
  alpes: 'Les Alpes, à l\'est, portent le mont Blanc, le plus haut sommet de France.',
  pyrenees: 'Les Pyrénées, au sud-ouest, marquent la frontière avec l\'Espagne.',
  'massif-central': 'Le Massif central est au centre et au sud du pays. Ses volcans sont éteints.',
  jura: 'Le Jura, à l\'est, longe la frontière avec la Suisse.',
  vosges: 'Les Vosges, au nord-est, séparent la Lorraine de l\'Alsace.',
};

export const SEA_NAMES: Record<Sea, string> = {
  manche: 'la Manche',
  'mer-du-nord': 'la mer du Nord',
  atlantique: 'l\'océan Atlantique',
  mediterranee: 'la mer Méditerranée',
};

const SEA_HINTS: Record<Sea, string> = {
  manche: 'La Manche sépare la France du Royaume-Uni.',
  'mer-du-nord': 'La mer du Nord borde la côte tout au nord, à Dunkerque.',
  atlantique: 'L\'océan Atlantique borde l\'ouest de la France.',
  mediterranee: 'La mer Méditerranée borde le sud de la France et la Corse.',
};

export const COUNTRY_NAMES: Record<Country, string> = {
  espagne: 'l\'Espagne',
  italie: 'l\'Italie',
  suisse: 'la Suisse',
  allemagne: 'l\'Allemagne',
  belgique: 'la Belgique',
  'royaume-uni': 'le Royaume-Uni',
};

const COUNTRY_HINTS: Record<Country, string> = {
  espagne: 'L\'Espagne est au sud-ouest, de l\'autre côté des Pyrénées.',
  italie: 'L\'Italie est au sud-est, de l\'autre côté des Alpes.',
  suisse: 'La Suisse est à l\'est, derrière le Jura.',
  allemagne: 'L\'Allemagne est au nord-est, de l\'autre côté du Rhin.',
  belgique: 'La Belgique est au nord, tout près de Lille.',
  'royaume-uni': 'Le Royaume-Uni est de l\'autre côté de la Manche.',
};

/** Des pays qu'on ne voit pas sur la carte, pour les mauvaises réponses. */
const OTHER_COUNTRIES = ['le Portugal', 'les Pays-Bas', 'l\'Autriche'];

const keys = <T extends string>(record: Record<T, unknown>) => Object.keys(record) as T[];

// --- Les fonds ---------------------------------------------------------------------

function planisphere(extra: Shape[], alt: string, highlight?: Continent): Figure {
  const { width, height, globe, land, continents, equator } = PLANISPHERE;
  const [eastX, eastY] = equator[equator.length - 1];
  const shapes: Shape[] = [
    { kind: 'aire', rings: globe, ground: 'mer', ink: 'pale', width: 0.8 },
    { kind: 'aire', rings: land, ground: 'terre', ink: 'aucune' },
  ];
  if (highlight) shapes.push({ kind: 'aire', rings: continents[highlight], ground: 'surbrillance', ink: 'aucune' });
  shapes.push(
    { kind: 'aire', rings: land, ink: 'encre', width: 0.5 },
    { kind: 'trace', points: equator, ink: 'pale', width: 0.7, dashed: true },
    { kind: 'text', at: [Math.min(eastX, width - 8), eastY - 3], text: 'équateur', ink: 'pale', size: 8.5, anchor: 'end' },
    ...extra
  );
  return { width, height, shapes, alt };
}

function franceMap(extra: Shape[], alt: string, layers: { rivers?: boolean; massifs?: boolean } = {}): Figure {
  const { width, height, france, neighbours, rivers, massifs } = FRANCE_MAP;
  const shapes: Shape[] = [
    { kind: 'aire', rings: [[[0, 0], [width, 0], [width, height], [0, height]]], ground: 'mer', ink: 'aucune' },
    { kind: 'aire', rings: neighbours, ground: 'voisin', ink: 'frontiere', width: 0.6 },
    { kind: 'aire', rings: france, ground: 'terre', ink: 'encre', width: 1 },
  ];
  if (layers.rivers) {
    for (const river of keys(rivers)) shapes.push({ kind: 'trace', points: rivers[river].path, ink: 'eau', width: 1.8 });
  }
  if (layers.massifs) {
    for (const massif of keys(massifs)) for (const at of massifs[massif].peaks) shapes.push({ kind: 'montagne', at: at as Point });
  }
  shapes.push(...extra);
  return { width, height, shapes, alt };
}

const letter = (at: Point, text = 'A'): Shape => ({ kind: 'lettre', at, text });

// --- Le planisphère ----------------------------------------------------------------

function continentQuestion(rng: Rng): Draft {
  const continent = rngPick(rng, keys(CONTINENT_NAMES));
  return {
    key: `carte-continent-${continent}`,
    instruction: 'Regarde le planisphère',
    prompt: 'Quel continent est colorié en orange ?',
    figure: planisphere([], 'Un planisphère : les continents sur les océans, l\'un d\'eux colorié en orange.', continent),
    ...choose(rng, CONTINENT_NAMES[continent], Object.values(CONTINENT_NAMES)),
    explanation: CONTINENT_HINTS[continent],
  };
}

function oceanQuestion(rng: Rng): Draft {
  const ocean = rngPick(rng, keys(OCEAN_NAMES));
  return {
    key: `carte-ocean-${ocean}`,
    instruction: 'Regarde le planisphère',
    prompt: 'Quel océan porte la lettre A ?',
    figure: planisphere([letter(PLANISPHERE.oceans[ocean] as Point)], 'Un planisphère ; la lettre A est posée sur un océan.'),
    ...choose(rng, OCEAN_NAMES[ocean], Object.values(OCEAN_NAMES)),
    explanation: OCEAN_HINTS[ocean],
  };
}

const LETTERS = ['A', 'B', 'C', 'D'];

/** « Quelle lettre marque la France ? » : la France et trois pays lointains,
 *  assez écartés pour que les pastilles ne se touchent pas. */
function franceOnPlanisphere(rng: Rng): Draft {
  const others = keys(PLANISPHERE.places).filter((place) => place !== 'france');
  const places = PLANISPHERE.places as Record<Place, Point>;
  let picked: Place[] = [];
  for (let attempt = 0; attempt < 30; attempt++) {
    picked = ['france', ...rngShuffle(rng, others).slice(0, 3)];
    const apart = picked.every((a, i) => picked.every((b, j) => j <= i || Math.hypot(places[a][0] - places[b][0], places[a][1] - places[b][1]) >= 22));
    if (apart) break;
  }
  const order = rngShuffle(rng, picked);
  return {
    key: `carte-france-monde-${order.join('-')}`,
    instruction: 'Regarde le planisphère',
    prompt: 'Quelle lettre marque la France ?',
    figure: planisphere(
      order.map((place, index) => letter(places[place], LETTERS[index])),
      'Un planisphère ; quatre lettres, de A à D, marquent quatre pays.'
    ),
    choices: LETTERS,
    correctIndex: order.indexOf('france'),
    explanation: 'La France est en Europe, à l\'ouest du continent.',
  };
}

// --- La carte de France : repères --------------------------------------------------

function cityQuestion(rng: Rng, level: Level): Draft {
  const pool = CITY_POOL[level];
  const city = rngPick(rng, pool);
  return {
    key: `carte-ville-${city}`,
    instruction: 'Regarde la carte de France',
    prompt: 'Quelle grande ville est marquée par le gros point orange ?',
    figure: franceMap(
      pool.map((entry) => ({ kind: 'ville', at: FRANCE_MAP.cities[entry].at as Point, highlight: entry === city })),
      'Une carte de France avec ses grandes villes ; l\'une d\'elles est marquée d\'un gros point orange.',
      { rivers: true }
    ),
    ...choose(rng, CITY_NAMES[city], pool.map((entry) => CITY_NAMES[entry])),
    explanation: CITY_HINTS[city],
  };
}

function seaQuestion(rng: Rng): Draft {
  const sea = rngPick(rng, keys(SEA_NAMES));
  return {
    key: `carte-mer-${sea}`,
    instruction: 'Regarde la carte de France',
    prompt: 'Quelle mer, ou quel océan, porte la lettre A ?',
    figure: franceMap([letter(FRANCE_MAP.seas[sea] as Point)], 'Une carte de France ; la lettre A est posée sur une mer ou un océan.'),
    ...choose(rng, SEA_NAMES[sea], Object.values(SEA_NAMES)),
    explanation: SEA_HINTS[sea],
  };
}

function riverQuestion(rng: Rng): Draft {
  const river = rngPick(rng, keys(RIVER_NAMES));
  return {
    key: `carte-fleuve-${river}`,
    instruction: 'Regarde la carte de France',
    prompt: 'Quel fleuve porte la lettre A ?',
    figure: franceMap(
      [letter(FRANCE_MAP.rivers[river].label as Point)],
      'Une carte de France avec ses quatre grands fleuves en bleu ; la lettre A est posée près de l\'un d\'eux.',
      { rivers: true }
    ),
    ...choose(rng, RIVER_NAMES[river], Object.values(RIVER_NAMES)),
    explanation: RIVER_HINTS[river],
  };
}

function massifQuestion(rng: Rng): Draft {
  const massif = rngPick(rng, keys(MASSIF_NAMES));
  return {
    key: `carte-massif-${massif}`,
    instruction: 'Regarde la carte de France',
    prompt: 'Quel massif montagneux porte la lettre A ?',
    figure: franceMap(
      [letter(FRANCE_MAP.massifs[massif].label as Point)],
      'Une carte de France avec ses montagnes ; la lettre A est posée près de l\'un des massifs.',
      { massifs: true }
    ),
    ...choose(rng, MASSIF_NAMES[massif], Object.values(MASSIF_NAMES)),
    explanation: MASSIF_HINTS[massif],
  };
}

function countryQuestion(rng: Rng): Draft {
  const country = rngPick(rng, keys(COUNTRY_NAMES));
  return {
    key: `carte-pays-${country}`,
    instruction: 'Regarde la carte de France',
    prompt: 'Quel pays porte la lettre A ?',
    figure: franceMap([letter(FRANCE_MAP.countries[country] as Point)], 'Une carte de France et des pays voisins ; la lettre A est posée sur l\'un d\'eux.'),
    ...choose(rng, COUNTRY_NAMES[country], [...Object.values(COUNTRY_NAMES), ...OTHER_COUNTRIES]),
    explanation: COUNTRY_HINTS[country],
  };
}

// --- Lire une carte : les directions -----------------------------------------------

export type Direction = 'nord' | 'nord-est' | 'est' | 'sud-est' | 'sud' | 'sud-ouest' | 'ouest' | 'nord-ouest';

/** L'angle de chaque direction, en degrés, 0 vers le nord, dans le sens des
 *  aiguilles d'une montre. */
export const DIRECTION_ANGLES: Record<Direction, number> = {
  nord: 0,
  'nord-est': 45,
  est: 90,
  'sud-est': 135,
  sud: 180,
  'sud-ouest': 225,
  ouest: 270,
  'nord-ouest': 315,
};

const MAIN_DIRECTIONS: Direction[] = ['nord', 'est', 'sud', 'ouest'];
const ALL_DIRECTIONS = Object.keys(DIRECTION_ANGLES) as Direction[];

/** « le nord », mais « l'est ». */
export const directionLabel = (direction: Direction) => (/^[eo]/.test(direction) ? `l'${direction}` : `le ${direction}`);
/** « au nord », mais « à l'est ». */
const towardsLabel = (direction: Direction) => (/^[eo]/.test(direction) ? `à l'${direction}` : `au ${direction}`);
/** « de Lyon », mais « d'Orléans ». */
const ofCity = (name: string) => (/^[aeiouyéèêâîôûh]/i.test(name) ? `d'${name}` : `de ${name}`);

const angleGap = (a: number, b: number) => {
  const gap = Math.abs(a - b) % 360;
  return Math.min(gap, 360 - gap);
};

/** La direction d'un trajet sur la carte, telle que l'élève la voit : le
 *  nord en haut. */
export function screenBearing([ax, ay]: Point, [bx, by]: Point): number {
  return ((Math.atan2(bx - ax, ay - by) * 180) / Math.PI + 360) % 360;
}

/** La même direction sur le globe (cap initial), pour vérifier que la carte
 *  ne trompe pas. */
export function geoBearing(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const [φ1, φ2, Δλ] = [from.lat * rad, to.lat * rad, (to.lon - from.lon) * rad];
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) / rad) + 360) % 360;
}

export interface Trip {
  from: City;
  to: City;
  direction: Direction;
}

/** Les trajets sans ambiguïté : la direction se lit à 12° près sur la carte,
 *  et le globe dit la même chose. Quatre directions au CM1, huit au CM2. */
export function tripsFor(level: Level): Trip[] {
  const pool = CITY_POOL[level];
  const allowed = level === 'CM1' ? MAIN_DIRECTIONS : ALL_DIRECTIONS;
  const trips: Trip[] = [];
  for (const from of pool) {
    for (const to of pool) {
      if (from === to) continue;
      const a = FRANCE_MAP.cities[from];
      const b = FRANCE_MAP.cities[to];
      if (Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1]) < 40) continue;
      const onMap = screenBearing(a.at as Point, b.at as Point);
      const direction = allowed.find((candidate) => angleGap(onMap, DIRECTION_ANGLES[candidate]) <= 12);
      if (direction && angleGap(geoBearing(a, b), DIRECTION_ANGLES[direction]) <= 16) trips.push({ from, to, direction });
    }
  }
  return trips;
}

const TEXT_SIZE = 11;
/** L'écart entre le point d'une ville et son nom. */
const LABEL_GAP = 6.5;
/** La place qu'occupe un nom de ville : une estimation large, faute de
 *  mesurer le texte. */
const textWidth = (text: string) => text.length * TEXT_SIZE * 0.56;

/** Où écrire le nom d'une ville, autour de son point. */
export type Side = 'droite' | 'gauche' | 'dessus' | 'dessous';

interface Label {
  city: City;
  side: Side;
}

type Box = [number, number, number, number];

/** Le cadre d'un nom posé à côté de son point. */
function labelBox({ city, side }: Label): Box {
  const [x, y] = FRANCE_MAP.cities[city].at;
  const width = textWidth(CITY_NAMES[city]);
  switch (side) {
    case 'droite':
      return [x + LABEL_GAP, y - 8.5, x + LABEL_GAP + width, y + 3.5];
    case 'gauche':
      return [x - LABEL_GAP - width, y - 8.5, x - LABEL_GAP, y + 3.5];
    case 'dessus':
      return [x - width / 2, y - 16.5, x + width / 2, y - 4.5];
    case 'dessous':
      return [x - width / 2, y + 4.5, x + width / 2, y + 16.5];
  }
}

const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Le segment traverse-t-il le cadre ? (échantillonné, largement) */
function crosses(box: Box, [ax, ay]: Point, [bx, by]: Point): boolean {
  const grown: Box = [box[0] - 2, box[1] - 2, box[2] + 2, box[3] + 2];
  for (let i = 0; i <= 40; i++) {
    const [x, y] = [ax + ((bx - ax) * i) / 40, ay + ((by - ay) * i) / 40];
    if (x >= grown[0] && x <= grown[2] && y >= grown[1] && y <= grown[3]) return true;
  }
  return false;
}

/** Ce que les noms ne doivent pas couvrir : les points des villes, la flèche
 *  du nord, et les traits donnés (la flèche d'un trajet). */
interface Obstacles {
  cities: City[];
  segments?: [Point, Point][];
}

function northBox(): Box {
  const [x, y] = FRANCE_MAP.seas.atlantique;
  return [x - 7, y - 21, x + 7, y + 11];
}

/** Des noms de villes lisibles : dans le cadre, sans se chevaucher, sans
 *  couvrir un point, la flèche du nord ni un trajet. Chaque ville essaie ses
 *  places dans l'ordre préféré ; `null` si aucune ne convient. */
export function placeLabels(cities: City[], prefer: (city: City) => Side[], obstacles: Obstacles = { cities }): Label[] | null {
  const labels: Label[] = [];
  for (const city of cities) {
    const order = [...prefer(city), 'droite', 'gauche', 'dessus', 'dessous'] as Side[];
    const fit = [...new Set(order)]
      .map((side) => ({ city, side }))
      .find((label) => {
        const box = labelBox(label);
        const inside = box[0] >= 2 && box[2] <= FRANCE_MAP.width - 2 && box[1] >= 2 && box[3] <= FRANCE_MAP.height - 2;
        const dots = obstacles.cities.every((other) => {
          const [x, y] = FRANCE_MAP.cities[other].at;
          return !overlaps(box, [x - 3, y - 3, x + 3, y + 3]);
        });
        const lines = (obstacles.segments ?? []).every(([a, b]) => !crosses(box, a, b));
        return inside && dots && lines && !overlaps(box, northBox()) && labels.every((placed) => !overlaps(box, labelBox(placed)));
      });
    if (!fit) return null;
    labels.push(fit);
  }
  return labels;
}

const nameShape = ({ city, side }: Label): Shape => {
  const [x, y] = FRANCE_MAP.cities[city].at;
  const common = { kind: 'text' as const, text: CITY_NAMES[city], size: TEXT_SIZE, bold: true, halo: true };
  switch (side) {
    case 'droite':
      return { ...common, at: [x + LABEL_GAP, y + 3.5], anchor: 'start' };
    case 'gauche':
      return { ...common, at: [x - LABEL_GAP, y + 3.5], anchor: 'end' };
    case 'dessus':
      return { ...common, at: [x, y - 7], anchor: 'middle' };
    case 'dessous':
      return { ...common, at: [x, y + 14], anchor: 'middle' };
  }
};

/** Une petite flèche du nord, posée dans l'océan Atlantique. */
function northArrow(): Shape[] {
  const [x, y] = FRANCE_MAP.seas.atlantique;
  return [
    { kind: 'segment', from: [x, y + 9], to: [x, y - 7], width: 1.6 },
    { kind: 'polyline', points: [[x - 4, y - 3], [x, y - 8], [x + 4, y - 3]], width: 1.6 },
    { kind: 'text', at: [x, y - 11], text: 'N', size: 10, anchor: 'middle', bold: true, halo: true },
  ];
}

const EXTREMES: Record<'nord' | 'sud' | 'est' | 'ouest', { prompt: string; score: (city: City) => number; geo: (city: City) => number; onMap: string }> = {
  nord: { prompt: 'la plus au nord', score: (city) => -FRANCE_MAP.cities[city].at[1], geo: (city) => FRANCE_MAP.cities[city].lat, onMap: 'c\'est la plus haute sur la carte' },
  sud: { prompt: 'la plus au sud', score: (city) => FRANCE_MAP.cities[city].at[1], geo: (city) => -FRANCE_MAP.cities[city].lat, onMap: 'c\'est la plus basse sur la carte' },
  est: { prompt: 'la plus à l\'est', score: (city) => FRANCE_MAP.cities[city].at[0], geo: (city) => FRANCE_MAP.cities[city].lon, onMap: 'c\'est la plus à droite sur la carte' },
  ouest: { prompt: 'la plus à l\'ouest', score: (city) => -FRANCE_MAP.cities[city].at[0], geo: (city) => -FRANCE_MAP.cities[city].lon, onMap: 'c\'est la plus à gauche sur la carte' },
};

/** « Laquelle de ces villes est la plus au nord ? » : quatre villes nommées,
 *  une nette gagnante (dix points d'écart au moins, et le globe d'accord). */
function extremeQuestion(rng: Rng, level: Level): Draft {
  for (let attempt = 0; ; attempt++) {
    const side = rngPick(rng, keys(EXTREMES));
    const { prompt, score, geo, onMap } = EXTREMES[side];
    const cities = rngShuffle(rng, CITY_POOL[level]).slice(0, 4);
    const ranked = [...cities].sort((a, b) => score(b) - score(a));
    const clear = score(ranked[0]) - score(ranked[1]) >= 10 && geo(ranked[0]) > Math.max(...ranked.slice(1).map(geo));
    const labels = placeLabels(cities, (city) => (FRANCE_MAP.cities[city].at[0] > FRANCE_MAP.width / 2 ? ['gauche'] : ['droite']));
    if ((!clear || !labels) && attempt < 60) continue;
    if (!clear || !labels) throw new Error('Aucune combinaison de villes lisible.');
    const winner = ranked[0];
    return {
      key: `carte-extreme-${side}-${winner}`,
      instruction: 'Le nord est en haut de la carte',
      prompt: `Laquelle de ces villes est ${prompt} ?`,
      figure: franceMap(
        [...cities.map((city) => ({ kind: 'ville' as const, at: FRANCE_MAP.cities[city].at as Point })), ...labels.map(nameShape), ...northArrow()],
        `Une carte de France où sont nommées ${cities.map((city) => CITY_NAMES[city]).join(', ')}.`
      ),
      ...choose(rng, CITY_NAMES[winner], cities.map((city) => CITY_NAMES[city])),
      explanation: `${CITY_NAMES[winner]} est ${prompt} : ${onMap}.`,
    };
  }
}

/** Le côté opposé à un mouvement : pour que le nom d'une ville de départ
 *  s'écarte de la flèche qui en part. */
function behind(ux: number, uy: number): Side {
  if (Math.abs(ux) >= Math.abs(uy)) return ux > 0 ? 'gauche' : 'droite';
  return uy > 0 ? 'dessus' : 'dessous';
}

const opposite: Record<Side, Side> = { droite: 'gauche', gauche: 'droite', dessus: 'dessous', dessous: 'dessus' };

/** « Pour aller de Lyon à Marseille, dans quelle direction part-on ? » : le
 *  trajet est fléché, le nord est marqué ; les noms ne touchent pas la
 *  flèche. */
function directionQuestion(rng: Rng, level: Level): Draft {
  const trips = rngShuffle(rng, tripsFor(level));
  for (const { from, to, direction } of trips) {
    const [ax, ay] = FRANCE_MAP.cities[from].at;
    const [bx, by] = FRANCE_MAP.cities[to].at;
    const length = Math.hypot(bx - ax, by - ay);
    const [ux, uy] = [(bx - ax) / length, (by - ay) / length];
    const start: Point = [ax + ux * 7, ay + uy * 7];
    const tip: Point = [bx - ux * 7, by - uy * 7];
    const wing = (sign: number): Point => [tip[0] - ux * 7 + sign * uy * 4.5, tip[1] - uy * 7 - sign * ux * 4.5];
    // Le départ s'écrit derrière la flèche, l'arrivée au-delà de sa pointe.
    const labels = placeLabels(
      [from, to],
      (city) => (city === from ? [behind(ux, uy)] : [opposite[behind(ux, uy)]]),
      { cities: [from, to], segments: [[start, tip], [wing(1), tip], [wing(-1), tip]] }
    );
    if (!labels) continue;
    const options = level === 'CM1' ? MAIN_DIRECTIONS : ALL_DIRECTIONS;
    return {
      key: `carte-direction-${from}-${to}`,
      instruction: 'Le nord est en haut de la carte',
      prompt: `Pour aller de ${CITY_NAMES[from]} à ${CITY_NAMES[to]}, dans quelle direction part-on ?`,
      figure: franceMap(
        [
          { kind: 'segment', from: start, to: tip, width: 2.2 },
          { kind: 'polyline', points: [wing(1), tip, wing(-1)], width: 2.2 },
          { kind: 'ville', at: [ax, ay] },
          { kind: 'ville', at: [bx, by] },
          ...labels.map(nameShape),
          ...northArrow(),
        ],
        `Une carte de France : une flèche va de ${CITY_NAMES[from]} à ${CITY_NAMES[to]} ; une petite flèche marquée N indique la direction du nord.`
      ),
      ...choose(rng, directionLabel(direction), options.map(directionLabel)),
      explanation: `${CITY_NAMES[to]} est ${towardsLabel(direction)} ${ofCity(CITY_NAMES[from])}.`,
    };
  }
  throw new Error(`Aucun trajet lisible pour le ${level}.`);
}

// --- Qui voit quoi, et quand ---------------------------------------------------------

export interface MapMaker {
  name: string;
  /** Le premier trimestre où la question apparaît, par niveau ; `null` si
   *  elle n'est pas au programme de ce niveau. */
  from: Record<Level, Trimester | null>;
  make: (rng: Rng, level: Level) => Draft;
}

export const MAP_MAKERS: MapMaker[] = [
  { name: 'continent', from: { CM1: 1, CM2: 1 }, make: continentQuestion },
  { name: 'ocean', from: { CM1: 1, CM2: 1 }, make: oceanQuestion },
  { name: 'france-monde', from: { CM1: 1, CM2: null }, make: franceOnPlanisphere },
  { name: 'ville', from: { CM1: 1, CM2: 1 }, make: cityQuestion },
  { name: 'mer', from: { CM1: 1, CM2: 1 }, make: seaQuestion },
  { name: 'fleuve', from: { CM1: 2, CM2: 1 }, make: riverQuestion },
  { name: 'massif', from: { CM1: 2, CM2: 1 }, make: massifQuestion },
  { name: 'pays', from: { CM1: 2, CM2: 1 }, make: countryQuestion },
  { name: 'extreme', from: { CM1: 2, CM2: 1 }, make: extremeQuestion },
  { name: 'direction', from: { CM1: 2, CM2: 1 }, make: directionQuestion },
];

/** Les questions sur carte d'un niveau à un trimestre : les nouvelles, et
 *  celles des trimestres passés, à réviser. */
export function mapMakersFor(level: Level, trimester: Trimester): { current: MapMaker[]; review: MapMaker[] } {
  const available = MAP_MAKERS.filter((maker) => {
    const from = maker.from[level];
    return from !== null && from <= trimester;
  });
  return {
    current: available.filter((maker) => maker.from[level] === trimester),
    review: available.filter((maker) => (maker.from[level] ?? 4) < trimester),
  };
}

/** Une fabrique qui passe d'une sorte de carte à l'autre, dans un ordre
 *  tiré au hasard. */
export function mapDrawer(rng: Rng, level: Level, makers: MapMaker[]): () => Draft {
  const order = rngShuffle(rng, makers);
  let next = 0;
  return () => order[next++ % order.length].make(rng, level);
}
