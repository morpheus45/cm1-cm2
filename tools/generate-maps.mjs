/**
 * Fabrique les fonds de carte de la géographie — un planisphère et une carte
 * de France —, projetés une fois pour toutes en coordonnées d'écran et écrits
 * dans src/domains/cartesFonds.ts.
 *
 * Les contours viennent de Natural Earth (domaine public), par le paquet
 * world-atlas. Les villes, les fleuves, les massifs et les étiquettes sont
 * placés ici, en longitude et latitude ; les fleuves sont des tracés
 * simplifiés, passant par les villes qu'ils traversent.
 *
 * Le générateur refuse d'écrire une carte fausse : une ville hors de France,
 * une mer posée sur la terre, un pays mal étiqueté ou une étiquette plus
 * proche d'un autre fleuve que du sien arrêtent tout.
 *
 * Usage : node tools/generate-maps.mjs
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { feature, merge } from 'topojson-client';
import { geoConicConformal, geoContains, geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo';

const require = createRequire(import.meta.url);
const world110 = require('world-atlas/countries-110m.json');
const land110 = require('world-atlas/land-110m.json');
const world50 = require('world-atlas/countries-50m.json');

const OUTPUT = fileURLToPath(new URL('../src/domains/cartesFonds.ts', import.meta.url));

// --- Outils ------------------------------------------------------------------------

function fail(message) {
  throw new Error(`Carte refusée : ${message}`);
}

/** Les contours d'un objet géographique, projetés et coupés au cadre. */
function ringsOf(object, projection) {
  const rings = [];
  let current = null;
  const context = {
    moveTo(x, y) {
      current = [[x, y]];
      rings.push(current);
    },
    lineTo(x, y) {
      current.push([x, y]);
    },
    closePath() {},
    arc() {},
  };
  geoPath(projection, context)(object);
  return rings;
}

function segmentDistance([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Douglas-Peucker sur une ligne ouverte : les extrémités restent. */
function simplifyLine(points, tolerance) {
  if (points.length <= 2) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [a, b] = stack.pop();
    let farthest = -1;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      const d = segmentDistance(points[i], points[a], points[b]);
      if (d > farthest) {
        farthest = d;
        index = i;
      }
    }
    if (farthest > tolerance) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const HALF = (value) => Math.round(value * 2) / 2;

function dedupe(points) {
  return points.filter((point, i) => i === 0 || point[0] !== points[i - 1][0] || point[1] !== points[i - 1][1]);
}

function area(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % ring.length];
    sum += ax * by - bx * ay;
  }
  return sum / 2;
}

/** Simplifie un contour fermé, l'arrondit au demi-point, et écarte les
 *  îlots trop petits pour se voir. */
function simplifyRing(ring, tolerance, minArea) {
  let points = dedupe(ring.map(([x, y]) => [x, y]));
  if (points.length > 1 && points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1]) points.pop();
  if (points.length < 3) return null;
  let far = 0;
  let best = -1;
  points.forEach(([x, y], i) => {
    const d = Math.hypot(x - points[0][0], y - points[0][1]);
    if (d > best) {
      best = d;
      far = i;
    }
  });
  const first = simplifyLine(points.slice(0, far + 1), tolerance);
  const second = simplifyLine([...points.slice(far), points[0]], tolerance);
  points = dedupe([...first.slice(0, -1), ...second.slice(0, -1)].map(([x, y]) => [HALF(x), HALF(y)]));
  if (points.length > 1 && points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1]) points.pop();
  if (points.length < 3 || Math.abs(area(points)) < minArea) return null;
  return points;
}

function simplifyRings(rings, tolerance, minArea) {
  return rings.map((ring) => simplifyRing(ring, tolerance, minArea)).filter(Boolean);
}

/** Le point est-il dans la surface (règle pair-impair, trous compris) ? */
function inside([x, y], rings) {
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

function distanceToLine(point, line) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) best = Math.min(best, segmentDistance(point, line[i - 1], line[i]));
  return best;
}

function project(projection, lonLat) {
  const point = projection(lonLat);
  if (!point) fail(`point impossible à projeter : ${lonLat}`);
  return [HALF(point[0]), HALF(point[1])];
}

function inFrame([x, y], width, height, margin) {
  return x >= margin && y >= margin && x <= width - margin && y <= height - margin;
}

/** Une courbe douce par les points de passage (Catmull-Rom), pour que les
 *  fleuves ne soient pas des lignes brisées. */
function smooth(points, steps = 4) {
  const out = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (k) =>
        0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([HALF(at(0)), HALF(at(1))]);
    }
  }
  return dedupe(out);
}

/** La place d'une lettre de carte autour de son centre : sa pastille
 *  (LETTER_RADIUS, dans src/lib/figures.ts) et un peu d'air. */
const LETTER_ROOM = 10.5;

// --- Le planisphère ----------------------------------------------------------------

const PLANISPHERE_WIDTH = 320;

/** Le continent de chaque terre, selon l'usage de l'école française (six
 *  continents, l'Amérique d'un seul tenant). La règle générale se lit sur le
 *  centre de chaque morceau d'un pays — la Guyane est en Amérique, même si
 *  elle est française ; les exceptions nomment un pays entier. La Russie est
 *  coupée à l'Oural (60° est). */
const CONTINENT_EXCEPTIONS = {
  Turkey: 'asie',
  Georgia: 'asie',
  Armenia: 'asie',
  Azerbaijan: 'asie',
  Cyprus: 'europe',
  'N. Cyprus': 'europe',
  Eritrea: 'afrique',
  'Papua New Guinea': 'oceanie',
  'Timor-Leste': 'asie',
  'Fr. S. Antarctic Lands': null,
};

function continentOf(name, [lon, lat]) {
  if (name in CONTINENT_EXCEPTIONS) return CONTINENT_EXCEPTIONS[name];
  if (lat < -60) return 'antarctique';
  // Les îles de part et d'autre de la ligne de changement de date.
  if (lon < -168 && lat < 0) return 'oceanie';
  if (lon > 165 && lat > 45) return 'amerique';
  if (lon < -25) return 'amerique';
  if (lon > 110 && lat < -8) return 'oceanie';
  if (lat > 36 && lon < 45) return 'europe';
  if (lat < 37.5 && lon > -20 && lon < 52 && !(lon > 34 && lat > 12)) return 'afrique';
  return 'asie';
}

/** Coupe un contour (longitude, latitude) d'un côté du méridien `cut`. Les
 *  longitudes à l'ouest de -100° sont décalées d'un tour, pour que la
 *  Tchoukotka reste à l'est. */
function clipRing(ring, keepWest, cut = 60) {
  const shifted = ring.map(([lon, lat]) => [lon < -100 ? lon + 360 : lon, lat]);
  const kept = ([lon]) => (keepWest ? lon <= cut : lon >= cut);
  const out = [];
  for (let i = 0; i < shifted.length - 1; i++) {
    const a = shifted[i];
    const b = shifted[i + 1];
    if (kept(a)) out.push(a);
    if (kept(a) !== kept(b)) {
      const t = (cut - a[0]) / (b[0] - a[0]);
      out.push([cut, a[1] + t * (b[1] - a[1])]);
    }
  }
  if (out.length < 3) return null;
  out.push(out[0]);
  return out.map(([lon, lat]) => [lon > 180 ? lon - 360 : lon, lat]);
}

function splitRussia(geometry, keepWest) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const pieces = polygons
    .map((polygon) => polygon.map((ring) => clipRing(ring, keepWest)).filter(Boolean))
    .filter((polygon) => polygon.length > 0);
  return { type: 'MultiPolygon', coordinates: pieces };
}

/** Où poser le nom des océans, et quelques pays pour « Où est la France ? ». */
const OCEAN_LABELS = {
  atlantique: [-38, 22],
  pacifique: [-138, 2],
  indien: [78, -22],
  arctique: [0, 75.5],
  austral: [72, -57],
};

const PLACES = {
  france: { id: '250', at: [2.5, 46.6] },
  bresil: { id: '076', at: [-51, -10] },
  canada: { id: '124', at: [-102, 58] },
  australie: { id: '036', at: [134, -25] },
  inde: { id: '356', at: [79, 22] },
  chine: { id: '156', at: [103, 34] },
  egypte: { id: '818', at: [29.5, 26] },
  mexique: { id: '484', at: [-102, 23.5] },
  argentine: { id: '032', at: [-65, -36] },
  'etats-unis': { id: '840', at: [-99, 39] },
};

function buildPlanisphere() {
  const countries = world110.objects.countries.geometries;
  const features = feature(world110, world110.objects.countries).features;
  const byContinent = {};
  let russia = null;
  countries.forEach((geometry, index) => {
    const name = geometry.properties.name;
    if (name === 'Russia') {
      russia = features[index];
      return;
    }
    // Chaque morceau d'un pays (île, territoire) va sur son continent.
    const pieces =
      geometry.type === 'MultiPolygon'
        ? geometry.arcs.map((arcs) => ({ type: 'Polygon', arcs, properties: geometry.properties }))
        : [geometry];
    for (const piece of pieces) {
      const continent = continentOf(name, geoCentroid(feature(world110, piece)));
      if (continent) (byContinent[continent] ??= []).push(piece);
    }
  });
  if (!russia) fail('la Russie manque au fond de carte');
  for (const name of Object.keys(CONTINENT_EXCEPTIONS)) {
    if (!countries.some((geometry) => geometry.properties.name === name)) fail(`pays inconnu dans les exceptions : ${name}`);
  }

  const sphere = { type: 'Sphere' };
  // Toute la largeur, trois points de marge ; la hauteur en découle.
  const projection = geoNaturalEarth1().fitWidth(PLANISPHERE_WIDTH - 6, sphere);
  const [tx, ty] = projection.translate();
  projection.translate([tx + 3, ty + 3]);
  const [[, top], [, bottom]] = geoPath(projection).bounds(sphere);
  const height = Math.ceil(bottom + 3);
  if (top < 2.9) fail('le globe dépasse le haut du cadre');

  const tolerance = 0.45;
  const minArea = 1.2;
  const continents = {};
  for (const [continent, geometries] of Object.entries(byContinent)) {
    const merged = merge(world110, geometries);
    const pieces = [merged];
    if (continent === 'europe') pieces.push(splitRussia(russia.geometry, true));
    if (continent === 'asie') pieces.push(splitRussia(russia.geometry, false));
    continents[continent] = simplifyRings(
      pieces.flatMap((piece) => ringsOf(piece, projection)),
      tolerance,
      minArea
    );
    const total = continents[continent].reduce((sum, ring) => sum + Math.abs(area(ring)), 0);
    if (total > PLANISPHERE_WIDTH * height * 0.3) fail(`${continent} couvre presque tout le globe : contour à l'envers`);
  }
  for (const continent of ['afrique', 'amerique', 'antarctique', 'asie', 'europe', 'oceanie']) {
    if (!continents[continent]?.length) fail(`continent vide : ${continent}`);
  }

  const land = simplifyRings(ringsOf(feature(land110, land110.objects.land), projection), tolerance, minArea);
  const globe = simplifyRings(ringsOf(sphere, projection), 0.3, 0);
  const equator = simplifyLine(
    ringsOf({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, 0]) }, projection).flat(),
    0.3
  ).map(([x, y]) => [HALF(x), HALF(y)]);

  const oceans = {};
  for (const [ocean, lonLat] of Object.entries(OCEAN_LABELS)) {
    const at = project(projection, lonLat);
    if (inside(at, land)) fail(`l'étiquette de l'océan ${ocean} tombe sur la terre`);
    if (!inFrame(at, PLANISPHERE_WIDTH, height, LETTER_ROOM)) fail(`l'étiquette de l'océan ${ocean} sort du cadre`);
    oceans[ocean] = at;
  }

  const places = {};
  for (const [place, { id, at: lonLat }] of Object.entries(PLACES)) {
    const country = features.find((entry) => entry.id === id);
    if (!country) fail(`pays introuvable : ${place}`);
    if (!geoContains(country, lonLat)) fail(`le repère de ${place} n'est pas dans le pays`);
    const at = project(projection, lonLat);
    if (!inFrame(at, PLANISPHERE_WIDTH, height, LETTER_ROOM)) fail(`le repère de ${place} sort du cadre`);
    places[place] = at;
  }

  return { width: PLANISPHERE_WIDTH, height, globe, land, continents, equator, oceans, places };
}

// --- La carte de France ------------------------------------------------------------

const FRANCE_WIDTH = 300;

/** Le cadre de la carte, en longitude et latitude. */
const FRANCE_CORNERS = [[-5.4, 41.25], [10.1, 41.25], [-5.4, 51.75], [10.1, 51.75]];

const CITIES = {
  paris: [2.3522, 48.8566],
  lyon: [4.8357, 45.764],
  marseille: [5.3698, 43.2965],
  toulouse: [1.4442, 43.6047],
  bordeaux: [-0.5792, 44.8378],
  lille: [3.0573, 50.6292],
  nantes: [-1.5536, 47.2184],
  strasbourg: [7.7521, 48.5734],
  nice: [7.262, 43.7102],
  rennes: [-1.6778, 48.1173],
  montpellier: [3.8767, 43.6108],
};

/** Les fleuves, de la source à l'embouchure, par les villes qu'ils
 *  traversent ; puis l'endroit où poser leur lettre. */
const RIVERS = {
  seine: {
    course: [
      [4.72, 47.49], [4.57, 47.86], [4.08, 48.3], [3.73, 48.52], [2.95, 48.39], [2.66, 48.54], [2.41, 48.76],
      [2.35, 48.86], [2.25, 48.93], [2.09, 48.9], [1.72, 48.99], [1.41, 49.25], [1.1, 49.44], [0.73, 49.52],
      [0.25, 49.45], [0.1, 49.47],
    ],
    label: [3.35, 48.97],
  },
  loire: {
    course: [
      [4.22, 44.84], [3.93, 45.07], [4.24, 45.5], [4.23, 45.74], [4.07, 46.04], [3.98, 46.48], [3.46, 46.83],
      [3.16, 46.99], [2.93, 47.41], [2.63, 47.69], [1.91, 47.9], [1.33, 47.59], [0.98, 47.41], [0.69, 47.39],
      [-0.08, 47.26], [-0.52, 47.42], [-1.18, 47.37], [-1.55, 47.21], [-2.21, 47.27],
    ],
    label: [1.0, 46.95],
  },
  garonne: {
    course: [
      [0.87, 42.72], [0.69, 42.91], [0.72, 43.11], [1.09, 43.21], [1.33, 43.46], [1.44, 43.6], [1.23, 43.85],
      [1.05, 44.07], [0.62, 44.2], [0.31, 44.39], [0.16, 44.5], [-0.25, 44.55], [-0.57, 44.84], [-0.56, 45.04],
      [-0.75, 45.2], [-1.06, 45.57],
    ],
    label: [0.42, 43.76],
  },
  rhone: {
    course: [
      [6.14, 46.2], [5.83, 46.11], [5.83, 45.96], [5.69, 45.76], [5.37, 45.87], [5.1, 45.8], [4.84, 45.76],
      [4.87, 45.52], [4.84, 45.07], [4.89, 44.93], [4.73, 44.56], [4.65, 44.26], [4.81, 43.95], [4.66, 43.81],
      [4.63, 43.68], [4.8, 43.39], [4.84, 43.33],
    ],
    label: [5.38, 44.2],
  },
};

/** Les massifs : les sommets où poser un symbole, puis leur lettre. */
const MASSIFS = {
  alpes: {
    peaks: [[6.75, 46.05], [6.87, 45.83], [6.72, 45.45], [6.35, 45.1], [6.55, 44.8], [6.75, 44.45], [7.05, 44.15]],
    label: [5.5, 44.95],
  },
  pyrenees: {
    peaks: [[-1.05, 43.05], [-0.5, 42.92], [0.05, 42.8], [0.65, 42.72], [1.25, 42.62], [1.85, 42.55], [2.4, 42.5]],
    label: [-0.35, 43.58],
  },
  'massif-central': {
    peaks: [[2.95, 45.75], [2.75, 45.45], [2.7, 45.12], [3.35, 44.85], [3.7, 44.45], [3.5, 45.4], [2.2, 45.6]],
    label: [1.75, 44.85],
  },
  jura: {
    peaks: [[5.9, 46.3], [6.15, 46.6], [6.45, 46.9], [6.85, 47.2]],
    label: [5.33, 46.95],
  },
  vosges: {
    peaks: [[6.95, 47.85], [7.05, 48.1], [7.1, 48.35], [7.2, 48.6], [7.4, 48.95]],
    label: [6.2, 48.6],
  },
};

const SEAS = {
  manche: [-2.6, 50.05],
  'mer-du-nord': [2.7, 51.45],
  atlantique: [-4.2, 46.2],
  mediterranee: [4.8, 42.65],
};

const COUNTRIES = {
  espagne: { id: '724', at: [-1.0, 42.1] },
  italie: { id: '380', at: [8.2, 44.95] },
  suisse: { id: '756', at: [7.6, 46.8] },
  allemagne: { id: '276', at: [8.4, 50.1] },
  belgique: { id: '056', at: [4.6, 50.5] },
  'royaume-uni': { id: '826', at: [-1.3, 51.25] },
};

function buildFrance() {
  const corners = { type: 'MultiPoint', coordinates: FRANCE_CORNERS };
  const projection = geoConicConformal().parallels([44, 49]).rotate([-3, 0]).fitWidth(FRANCE_WIDTH, corners);
  const [, [, bottom]] = geoPath(projection).bounds(corners);
  const height = Math.ceil(bottom);
  projection.clipExtent([[0, 0], [FRANCE_WIDTH, height]]);

  const features = feature(world50, world50.objects.countries).features;
  const franceFeature = features.find((entry) => entry.id === '250');
  if (!franceFeature) fail('la France manque au fond de carte');
  const tolerance = 0.35;
  const france = simplifyRings(ringsOf(franceFeature, projection), tolerance, 1);
  const neighbours = simplifyRings(
    features.filter((entry) => entry.id !== '250').flatMap((entry) => ringsOf(entry, projection)),
    tolerance,
    1
  );
  const land = [...france, ...neighbours];

  const cities = {};
  for (const [city, [lon, lat]] of Object.entries(CITIES)) {
    const at = project(projection, [lon, lat]);
    if (!inside(at, france)) fail(`${city} tombe hors de France`);
    cities[city] = { at, lat, lon };
  }

  const rivers = {};
  for (const [river, { course }] of Object.entries(RIVERS)) {
    rivers[river] = { path: smooth(course.map((lonLat) => project(projection, lonLat))) };
  }
  for (const [river, { label }] of Object.entries(RIVERS)) {
    const at = project(projection, label);
    const own = distanceToLine(at, rivers[river].path);
    // Assez loin pour que la pastille ne cache pas le fleuve, assez près pour
    // le désigner.
    if (own < LETTER_ROOM + 0.5 || own > 24) fail(`la lettre du fleuve ${river} est à ${own.toFixed(1)} de son tracé`);
    for (const other of Object.keys(RIVERS)) {
      if (other !== river && distanceToLine(at, rivers[other].path) < own * 2) fail(`la lettre du fleuve ${river} est trop près du fleuve ${other}`);
    }
    for (const [city, { at: cityAt }] of Object.entries(cities)) {
      if (Math.hypot(at[0] - cityAt[0], at[1] - cityAt[1]) < 14) fail(`la lettre du fleuve ${river} cache ${city}`);
    }
    rivers[river].label = at;
  }

  const massifs = {};
  for (const [massif, { peaks }] of Object.entries(MASSIFS)) {
    massifs[massif] = { peaks: peaks.map((lonLat) => project(projection, lonLat)) };
  }
  for (const [massif, { label }] of Object.entries(MASSIFS)) {
    const at = project(projection, label);
    const nearest = (name) => Math.min(...massifs[name].peaks.map(([x, y]) => Math.hypot(at[0] - x, at[1] - y)));
    const own = nearest(massif);
    // La pastille ne touche aucun symbole (5 points autour de chaque sommet).
    if (own < LETTER_ROOM + 5 || own > 30) fail(`la lettre du massif ${massif} est à ${own.toFixed(1)} de ses sommets`);
    for (const other of Object.keys(MASSIFS)) {
      if (other !== massif && nearest(other) < own * 2) fail(`la lettre du massif ${massif} est trop près du massif ${other}`);
    }
    for (const [city, { at: cityAt }] of Object.entries(cities)) {
      if (Math.hypot(at[0] - cityAt[0], at[1] - cityAt[1]) < 14) fail(`la lettre du massif ${massif} cache ${city}`);
    }
    massifs[massif].label = at;
  }

  const seas = {};
  for (const [sea, lonLat] of Object.entries(SEAS)) {
    const at = project(projection, lonLat);
    if (inside(at, land)) fail(`la lettre de ${sea} tombe sur la terre`);
    if (!inFrame(at, FRANCE_WIDTH, height, LETTER_ROOM)) fail(`la lettre de ${sea} sort du cadre`);
    seas[sea] = at;
  }

  const countries = {};
  for (const [country, { id, at: lonLat }] of Object.entries(COUNTRIES)) {
    const entry = features.find((candidate) => candidate.id === id);
    if (!entry || !geoContains(entry, lonLat)) fail(`l'étiquette de ${country} n'est pas dans le pays`);
    const at = project(projection, lonLat);
    if (!inside(at, neighbours) || inside(at, france)) fail(`l'étiquette de ${country} n'est pas sur un pays voisin`);
    if (!inFrame(at, FRANCE_WIDTH, height, LETTER_ROOM)) fail(`l'étiquette de ${country} sort du cadre`);
    countries[country] = at;
  }

  return { width: FRANCE_WIDTH, height, france, neighbours, cities, rivers, massifs, seas, countries };
}

// --- L'écriture --------------------------------------------------------------------

/** Les contours en nombres entiers : des demi-points, multipliés par deux. */
const encodeRings = (rings) => `rings([${rings.map((ring) => `[${ring.flat().map((value) => value * 2).join(',')}]`).join(',')}])`;
const encodePoint = ([x, y]) => `[${x}, ${y}]`;
const encodeLine = (points) => `line([${points.flat().map((value) => value * 2).join(',')}])`;

function record(entries, encode) {
  return `{\n${Object.entries(entries)
    .map(([key, value]) => `    ${/^[a-z]+$/.test(key) ? key : `'${key}'`}: ${encode(value)},`)
    .join('\n')}\n  }`;
}

function write() {
  const planisphere = buildPlanisphere();
  const france = buildFrance();
  const source = `// Généré par tools/generate-maps.mjs — ne pas modifier à la main.
//
// Fonds de carte : Natural Earth (domaine public), par le paquet world-atlas.
// Villes, fleuves (tracés simplifiés), massifs et étiquettes : placés dans le
// générateur, en longitude et latitude, puis projetés ici en points d'écran.

import type { Point } from '../lib/figures';

/** Des demi-points stockés en entiers : on divise par deux. */
function line(flat: number[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < flat.length; i += 2) points.push([flat[i] / 2, flat[i + 1] / 2]);
  return points;
}

function rings(flat: number[][]): Point[][] {
  return flat.map(line);
}

/** Le planisphère (projection Natural Earth), centré sur l'Europe. */
export const PLANISPHERE = {
  width: ${planisphere.width},
  height: ${planisphere.height},
  globe: ${encodeRings(planisphere.globe)},
  land: ${encodeRings(planisphere.land)},
  continents: ${record(planisphere.continents, encodeRings)},
  equator: ${encodeLine(planisphere.equator)},
  oceans: ${record(planisphere.oceans, encodePoint)},
  places: ${record(planisphere.places, encodePoint)},
};

/** La France métropolitaine et ses voisins (projection conique conforme,
 *  comme les cartes officielles). */
export const FRANCE_MAP = {
  width: ${france.width},
  height: ${france.height},
  france: ${encodeRings(france.france)},
  neighbours: ${encodeRings(france.neighbours)},
  cities: ${record(france.cities, ({ at, lat, lon }) => `{ at: ${encodePoint(at)}, lat: ${lat}, lon: ${lon} }`)},
  rivers: ${record(france.rivers, ({ path, label }) => `{ path: ${encodeLine(path)}, label: ${encodePoint(label)} }`)},
  massifs: ${record(france.massifs, ({ peaks, label }) => `{ peaks: [${peaks.map(encodePoint).join(', ')}], label: ${encodePoint(label)} }`)},
  seas: ${record(france.seas, encodePoint)},
  countries: ${record(france.countries, encodePoint)},
};
`;
  writeFileSync(OUTPUT, source);
  const points = (rings) => rings.reduce((sum, ring) => sum + ring.length, 0);
  console.log(
    `Planisphère ${planisphere.width}×${planisphere.height} : terres ${points(planisphere.land)} points, continents ${Object.values(planisphere.continents).reduce((sum, rings) => sum + points(rings), 0)} points.`
  );
  console.log(`France ${france.width}×${france.height} : France ${points(france.france)} points, voisins ${points(france.neighbours)} points.`);
  console.log(`Écrit : ${OUTPUT} (${(source.length / 1024).toFixed(1)} Ko).`);
}

write();
