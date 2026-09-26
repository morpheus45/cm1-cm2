import type { Level, Question, Trimester } from '../types';
import type { Figure, Point } from '../lib/figures';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';
import {
  angleDroit,
  angleFigure,
  circleFigure,
  codageCotes,
  cuboid,
  equilateralTriangle,
  GRID_COLUMNS,
  GRID_ROWS,
  gridFigure,
  irregularPolygon,
  isCubeNet,
  isoscelesTrapezoid,
  isoscelesTriangle,
  kite,
  linesFigure,
  netsFigure,
  parallelogram,
  polygonFigure,
  polyhedronFigure,
  rectangle,
  regularPolygon,
  rhombus,
  rightTrapezoid,
  rightTriangle,
  rotate,
  roundSolidFigure,
  scaleneTriangle,
  square,
  squarePyramid,
  triangularPrism,
  type CircleElement,
  type LinesRelation,
  type Net,
} from './geometrieFigures';

/**
 * La géométrie du CM1 et du CM2 (programme de mathématiques 2025, « Espace
 * et géométrie ») : reconnaître et nommer, avec une figure à regarder.
 *
 * Progression, cumulative comme ailleurs :
 * - CM1, 1er trimestre : polygones, droites parallèles et perpendiculaires,
 *   angles droits, repérage sur quadrillage ;
 * - CM1, 2e : quadrilatères et triangles particuliers (avec leur codage),
 *   le cercle ;
 * - CM1, 3e : solides et leurs faces, arêtes, sommets ; axes de symétrie ;
 *   rayon et diamètre ;
 * - CM2, 1er : angles aigus, droits, obtus ; le parallélogramme ;
 * - CM2, 2e : propriétés des figures ; symétrie de figures plus riches ;
 * - CM2, 3e : patrons du cube ; le degré.
 */

interface Family {
  name: string;
  minStage: Stage;
  make: (rng: Rng, stage: Stage) => Omit<Question, 'id' | 'domain'> & { detail: string };
}

/** Les choix : la bonne réponse et des mauvaises, mélangés, sans doublon. */
function choose(rng: Rng, correct: string, wrong: string[], howMany = 4) {
  const distractors = rngShuffle(rng, [...new Set(wrong)].filter((entry) => entry !== correct)).slice(0, howMany - 1);
  const choices = rngShuffle(rng, [correct, ...distractors]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

const POLYGON_NAMES: Record<number, string> = {
  3: 'un triangle',
  4: 'un quadrilatère',
  5: 'un pentagone',
  6: 'un hexagone',
  8: 'un octogone',
};

const polygones: Family = {
  name: 'polygones',
  minStage: 1,
  make: (rng, stage) => {
    const counts = stage >= 4 ? [3, 4, 5, 6, 8] : [3, 4, 5, 6];
    const sidesCount = rngPick(rng, counts);
    const points = irregularPolygon(sidesCount, rng);
    return {
      detail: String(sidesCount),
      instruction: 'Compte ses côtés',
      prompt: 'Comment s\'appelle ce polygone ?',
      figure: polygonFigure(points, () => [], 'Un polygone.'),
      ...choose(rng, POLYGON_NAMES[sidesCount], counts.map((count) => POLYGON_NAMES[count])),
      explanation: `Il a ${sidesCount} côtés : c\'est ${POLYGON_NAMES[sidesCount]}.`,
    };
  },
};

const DROITES: Record<LinesRelation, string> = {
  paralleles: 'Elles sont parallèles.',
  perpendiculaires: 'Elles sont perpendiculaires.',
  secantes: 'Elles se coupent sans former d\'angle droit.',
};

const droites: Family = {
  name: 'droites',
  minStage: 1,
  make: (rng) => {
    const relation = rngPick(rng, ['paralleles', 'perpendiculaires', 'secantes'] as LinesRelation[]);
    const figure = linesFigure(relation, rngInt(rng, 0, 150), rngInt(rng, 35, 60));
    return {
      detail: relation,
      instruction: 'Observe bien les deux droites',
      prompt: 'Comment sont ces deux droites ?',
      figure,
      ...choose(rng, DROITES[relation], Object.values(DROITES), 3),
      explanation:
        relation === 'paralleles'
          ? 'Elles ne se coupent jamais, même prolongées : elles sont parallèles.'
          : relation === 'perpendiculaires'
            ? 'Elles se coupent en formant un angle droit : elles sont perpendiculaires.'
            : 'Elles se coupent, mais l\'angle n\'est pas droit : elles sont sécantes.',
    };
  },
};

/** Des figures dont on compte les angles droits. */
const RIGHT_ANGLE_SHAPES: { name: string; points: () => Point[]; count: number }[] = [
  { name: 'rectangle', points: () => rectangle(1.6), count: 4 },
  { name: 'triangle-rectangle', points: () => rightTriangle(70), count: 1 },
  { name: 'trapeze-rectangle', points: rightTrapezoid, count: 2 },
  { name: 'parallelogramme', points: () => parallelogram(80, 60), count: 0 },
  { name: 'losange', points: () => rhombus(55), count: 0 },
  { name: 'triangle', points: scaleneTriangle, count: 0 },
];

const anglesDroits: Family = {
  name: 'angles-droits',
  minStage: 1,
  make: (rng) => {
    const shape = rngPick(rng, RIGHT_ANGLE_SHAPES);
    const points = rotate(shape.points(), rngPick(rng, [0, 0, 15, -12, 90]));
    return {
      detail: shape.name,
      instruction: 'Vérifie avec ton équerre si tu veux',
      prompt: 'Combien cette figure a-t-elle d\'angles droits ?',
      figure: polygonFigure(points, () => [], 'Une figure à plusieurs côtés.'),
      ...choose(rng, String(shape.count), ['0', '1', '2', '3', '4']),
      explanation: shape.count === 0 ? 'Aucun de ses angles n\'est droit.' : `Elle a ${shape.count} angle${shape.count > 1 ? 's' : ''} droit${shape.count > 1 ? 's' : ''}.`,
    };
  },
};

const quadrillage: Family = {
  name: 'quadrillage',
  minStage: 1,
  make: (rng) => {
    const [column, row] = [rngInt(rng, 0, 4), rngInt(rng, 0, 4)];
    const correct = `${GRID_COLUMNS[column]}${GRID_ROWS[row]}`;
    const neighbours = [
      [column, (row + 1) % 5],
      [(column + 1) % 5, row],
      [(column + 4) % 5, row],
      [column, (row + 4) % 5],
      [row, column],
    ].map(([c, r]) => `${GRID_COLUMNS[c]}${GRID_ROWS[r]}`);
    return {
      detail: correct,
      instruction: 'La lettre de la colonne, puis le chiffre de la ligne',
      prompt: 'Dans quelle case est l\'étoile ?',
      figure: gridFigure(column, row),
      ...choose(rng, correct, neighbours),
      explanation: `Colonne ${GRID_COLUMNS[column]}, ligne ${GRID_ROWS[row]} : c\'est la case ${correct}.`,
    };
  },
};

type QuadName = 'carre' | 'rectangle' | 'losange' | 'parallelogramme';
const QUAD_LABELS: Record<QuadName, string> = {
  carre: 'un carré',
  rectangle: 'un rectangle',
  losange: 'un losange',
  parallelogramme: 'un parallélogramme',
};

function quadFigure(name: QuadName, rotation: number): Figure {
  const base =
    name === 'carre' ? square() : name === 'rectangle' ? rectangle(1.7) : name === 'losange' ? rhombus(58) : parallelogram(70, 62);
  const points = rotate(base, rotation);
  return polygonFigure(
    points,
    (fitted) => [
      ...codageCotes(fitted, name === 'carre' || name === 'losange' ? [1, 1, 1, 1] : [1, 2, 1, 2]),
      ...(name === 'carre' || name === 'rectangle' ? [0, 1, 2, 3].map((index) => angleDroit(fitted, index)) : []),
    ],
    'Un quadrilatère avec son codage : les petits traits marquent les côtés de même longueur, les petits carrés les angles droits.'
  );
}

const quadrilateres: Family = {
  name: 'quadrilateres',
  minStage: 2,
  make: (rng, stage) => {
    const names: QuadName[] = stage >= 4 ? ['carre', 'rectangle', 'losange', 'parallelogramme'] : ['carre', 'rectangle', 'losange'];
    const name = rngPick(rng, names);
    const why: Record<QuadName, string> = {
      carre: 'Quatre côtés de même longueur et quatre angles droits : c\'est un carré.',
      rectangle: 'Quatre angles droits et les côtés opposés de même longueur : c\'est un rectangle.',
      losange: 'Quatre côtés de même longueur, sans angle droit : c\'est un losange.',
      parallelogramme: 'Les côtés opposés sont de même longueur, sans angle droit : c\'est un parallélogramme.',
    };
    return {
      detail: name,
      instruction: 'Aide-toi du codage',
      prompt: 'Quel est le nom exact de ce quadrilatère ?',
      figure: quadFigure(name, rngInt(rng, -25, 25)),
      ...choose(rng, QUAD_LABELS[name], names.map((entry) => QUAD_LABELS[entry]), names.length),
      explanation: why[name],
    };
  },
};

type TriangleName = 'rectangle' | 'isocele' | 'equilateral' | 'quelconque';
const TRIANGLE_LABELS: Record<TriangleName, string> = {
  rectangle: 'un triangle rectangle',
  isocele: 'un triangle isocèle',
  equilateral: 'un triangle équilatéral',
  quelconque: 'un triangle quelconque',
};

const triangles: Family = {
  name: 'triangles',
  minStage: 2,
  make: (rng) => {
    const name = rngPick(rng, ['rectangle', 'isocele', 'equilateral', 'quelconque'] as TriangleName[]);
    const base =
      name === 'rectangle'
        ? rightTriangle(rngPick(rng, [55, 65, 150]))
        : name === 'isocele'
          ? isoscelesTriangle(rngPick(rng, [40, 45, 110]))
          : name === 'equilateral'
            ? equilateralTriangle()
            : scaleneTriangle();
    const points = rotate(base, rngInt(rng, -30, 30));
    const figure = polygonFigure(
      points,
      (fitted) =>
        name === 'rectangle'
          ? [angleDroit(fitted, 0)]
          : name === 'isocele'
            ? codageCotes(fitted, [1, 0, 1])
            : name === 'equilateral'
              ? codageCotes(fitted, [1, 1, 1])
              : [],
      'Un triangle avec son codage.'
    );
    const why: Record<TriangleName, string> = {
      rectangle: 'Il a un angle droit : c\'est un triangle rectangle.',
      isocele: 'Il a deux côtés de même longueur : c\'est un triangle isocèle.',
      equilateral: 'Ses trois côtés ont la même longueur : c\'est un triangle équilatéral.',
      quelconque: 'Ni angle droit, ni côtés de même longueur : c\'est un triangle quelconque.',
    };
    return {
      detail: name,
      instruction: 'Aide-toi du codage',
      prompt: 'Quel est le nom exact de ce triangle ?',
      figure,
      ...choose(rng, TRIANGLE_LABELS[name], Object.values(TRIANGLE_LABELS)),
      explanation: why[name],
    };
  },
};

const CIRCLE_LABELS: Record<CircleElement, string> = {
  centre: 'le centre du cercle',
  rayon: 'un rayon du cercle',
  diametre: 'un diamètre du cercle',
};

const cercle: Family = {
  name: 'cercle',
  minStage: 2,
  make: (rng) => {
    const element = rngPick(rng, ['centre', 'rayon', 'diametre'] as CircleElement[]);
    return {
      detail: element,
      instruction: 'Regarde ce qui est en couleur',
      prompt: element === 'centre' ? 'Comment s\'appelle le point en couleur ?' : 'Comment s\'appelle le segment en couleur ?',
      figure: circleFigure(element, rngInt(rng, 0, 170)),
      ...choose(rng, CIRCLE_LABELS[element], [...Object.values(CIRCLE_LABELS), 'un côté du cercle']),
      explanation:
        element === 'centre'
          ? 'Tous les points du cercle sont à la même distance de ce point : c\'est le centre.'
          : element === 'rayon'
            ? 'Il relie le centre à un point du cercle : c\'est un rayon.'
            : 'Il relie deux points du cercle en passant par le centre : c\'est un diamètre.',
    };
  },
};

const rayonDiametre: Family = {
  name: 'rayon-diametre',
  minStage: 3,
  make: (rng) => {
    const radius = rngInt(rng, 2, 9);
    const askDiameter = rng() < 0.5;
    const given = askDiameter ? radius : radius * 2;
    const answer = askDiameter ? radius * 2 : radius;
    const wrong = [given, answer + 2, askDiameter ? radius * 3 : radius * 4, answer + 1].map((value) => `${value} cm`);
    return {
      detail: `${askDiameter ? 'd' : 'r'}${given}`,
      prompt: askDiameter
        ? `Le rayon d\'un cercle mesure ${radius} cm. Combien mesure son diamètre ?`
        : `Le diamètre d\'un cercle mesure ${radius * 2} cm. Combien mesure son rayon ?`,
      figure: circleFigure(askDiameter ? 'rayon' : 'diametre', rngInt(rng, 10, 160)),
      ...choose(rng, `${answer} cm`, wrong),
      explanation: 'Le diamètre mesure le double du rayon ; le rayon, la moitié du diamètre.',
    };
  },
};

type SolidName = 'cube' | 'pave' | 'pyramide' | 'prisme' | 'cylindre' | 'cone' | 'boule';
const SOLID_LABELS: Record<SolidName, string> = {
  cube: 'un cube',
  pave: 'un pavé droit',
  pyramide: 'une pyramide',
  prisme: 'un prisme',
  cylindre: 'un cylindre',
  cone: 'un cône',
  boule: 'une boule',
};

function solidFigure(name: SolidName): Figure {
  const alt = 'Un solide, dessiné en perspective : les arêtes cachées sont en pointillés.';
  switch (name) {
    case 'cube':
      return polyhedronFigure(cuboid(100, 100, 100), alt);
    case 'pave':
      return polyhedronFigure(cuboid(170, 80, 90), alt);
    case 'pyramide':
      return polyhedronFigure(squarePyramid(), alt);
    case 'prisme':
      return polyhedronFigure(triangularPrism(), alt);
    default:
      return roundSolidFigure(name);
  }
}

const solides: Family = {
  name: 'solides',
  minStage: 3,
  make: (rng) => {
    const name = rngPick(rng, Object.keys(SOLID_LABELS) as SolidName[]);
    return {
      detail: name,
      prompt: 'Comment s\'appelle ce solide ?',
      figure: solidFigure(name),
      ...choose(rng, SOLID_LABELS[name], Object.values(SOLID_LABELS)),
      explanation: `C\'est ${SOLID_LABELS[name]}.`,
    };
  },
};

export const SOLID_COUNTS: { name: SolidName; asked: string; faces: number; aretes: number; sommets: number }[] = [
  { name: 'cube', asked: 'ce cube a-t-il', faces: 6, aretes: 12, sommets: 8 },
  { name: 'pave', asked: 'ce pavé droit a-t-il', faces: 6, aretes: 12, sommets: 8 },
  { name: 'pyramide', asked: 'cette pyramide a-t-elle', faces: 5, aretes: 8, sommets: 5 },
  { name: 'prisme', asked: 'ce prisme a-t-il', faces: 5, aretes: 9, sommets: 6 },
];

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const elementsSolides: Family = {
  name: 'faces-aretes-sommets',
  minStage: 3,
  make: (rng) => {
    const solid = rngPick(rng, SOLID_COUNTS);
    const what = rngPick(rng, ['faces', 'aretes', 'sommets'] as const);
    const label = { faces: 'faces', aretes: 'arêtes', sommets: 'sommets' }[what];
    const answer = solid[what];
    return {
      detail: `${solid.name}-${what}`,
      instruction: 'Pense aussi à ce qui est caché',
      prompt: `Combien ${solid.asked} de ${label} ?`,
      figure: solidFigure(solid.name),
      ...choose(rng, String(answer), [4, 5, 6, 8, 9, 10, 12].map(String)),
      explanation: `${capitalize(SOLID_LABELS[solid.name])} a ${solid.faces} faces, ${solid.aretes} arêtes et ${solid.sommets} sommets.`,
    };
  },
};

const SYMMETRY_SHAPES: { name: string; minStage: Stage; axes: number; figure: () => Figure }[] = [
  { name: 'carre', minStage: 3, axes: 4, figure: () => polygonFigure(square(), () => [], 'Une figure.') },
  { name: 'rectangle', minStage: 3, axes: 2, figure: () => polygonFigure(rectangle(1.7), () => [], 'Une figure.') },
  { name: 'triangle-equilateral', minStage: 3, axes: 3, figure: () => polygonFigure(equilateralTriangle(), () => [], 'Une figure.') },
  { name: 'triangle-isocele', minStage: 3, axes: 1, figure: () => polygonFigure(isoscelesTriangle(45), () => [], 'Une figure.') },
  { name: 'cerf-volant', minStage: 3, axes: 1, figure: () => polygonFigure(kite(), () => [], 'Une figure.') },
  { name: 'triangle-quelconque', minStage: 3, axes: 0, figure: () => polygonFigure(scaleneTriangle(), () => [], 'Une figure.') },
  { name: 'losange', minStage: 4, axes: 2, figure: () => polygonFigure(rotate(rhombus(60), -30), () => [], 'Une figure.') },
  { name: 'parallelogramme', minStage: 4, axes: 0, figure: () => polygonFigure(parallelogram(70, 60), () => [], 'Une figure.') },
  { name: 'trapeze-isocele', minStage: 5, axes: 1, figure: () => polygonFigure(isoscelesTrapezoid(), () => [], 'Une figure.') },
  { name: 'hexagone-regulier', minStage: 5, axes: 6, figure: () => polygonFigure(regularPolygon(6), () => [], 'Une figure.') },
];

const axesSymetrie: Family = {
  name: 'axes-symetrie',
  minStage: 3,
  make: (rng, stage) => {
    const shape = rngPick(rng, SYMMETRY_SHAPES.filter((entry) => entry.minStage <= stage));
    return {
      detail: shape.name,
      instruction: 'Un axe partage la figure en deux moitiés qui se superposent',
      prompt: 'Combien cette figure a-t-elle d\'axes de symétrie ?',
      figure: shape.figure(),
      ...choose(rng, String(shape.axes), ['0', '1', '2', '3', '4', '6']),
      explanation:
        shape.axes === 0
          ? 'Cette figure n\'a aucun axe de symétrie.'
          : `Cette figure a ${shape.axes} axe${shape.axes > 1 ? 's' : ''} de symétrie.`,
    };
  },
};

type AngleKind = 'aigu' | 'droit' | 'obtus';

const angles: Family = {
  name: 'angles',
  minStage: 4,
  make: (rng) => {
    const kind = rngPick(rng, ['aigu', 'droit', 'obtus'] as AngleKind[]);
    const degrees = kind === 'aigu' ? rngInt(rng, 25, 65) : kind === 'droit' ? 90 : rngInt(rng, 115, 155);
    return {
      detail: `${kind}-${degrees}`,
      instruction: 'Compare-le à l\'angle droit de ton équerre',
      prompt: 'Cet angle est :',
      figure: angleFigure(degrees, rngInt(rng, 0, 60)),
      ...choose(rng, `un angle ${kind}`, ['un angle aigu', 'un angle droit', 'un angle obtus'], 3),
      explanation:
        kind === 'aigu'
          ? 'Il est plus petit qu\'un angle droit : c\'est un angle aigu.'
          : kind === 'droit'
            ? 'Il a exactement l\'ouverture de l\'équerre : c\'est un angle droit.'
            : 'Il est plus grand qu\'un angle droit : c\'est un angle obtus.',
    };
  },
};

/** Ce qu'il faut savoir des figures, sans dessin. */
const PROPERTIES: { minStage: Stage; prompt: string; correct: string; wrong: string[]; explanation: string }[] = [
  { minStage: 2, prompt: 'Quel quadrilatère a quatre côtés de même longueur et quatre angles droits ?', correct: 'le carré', wrong: ['le rectangle', 'le losange', 'le triangle'], explanation: 'Le carré a quatre côtés égaux et quatre angles droits.' },
  { minStage: 2, prompt: 'Quel quadrilatère a quatre angles droits et ses côtés opposés de même longueur ?', correct: 'le rectangle', wrong: ['le losange', 'le pentagone', 'le triangle'], explanation: 'Le rectangle a quatre angles droits ; ses côtés opposés ont la même longueur.' },
  { minStage: 2, prompt: 'Quel quadrilatère a quatre côtés de même longueur, sans avoir forcément d\'angle droit ?', correct: 'le losange', wrong: ['le rectangle', 'le triangle', 'le pentagone'], explanation: 'Le losange a quatre côtés de même longueur.' },
  { minStage: 2, prompt: 'Combien de côtés de même longueur a un triangle équilatéral ?', correct: '3', wrong: ['0', '1', '2'], explanation: 'Dans un triangle équilatéral, les trois côtés ont la même longueur.' },
  { minStage: 2, prompt: 'Un triangle rectangle a :', correct: 'un angle droit', wrong: ['deux angles droits', 'trois angles droits', 'quatre côtés'], explanation: 'Un triangle rectangle a exactement un angle droit.' },
  { minStage: 3, prompt: 'Combien de faces a un cube ?', correct: '6', wrong: ['4', '8', '12'], explanation: 'Un cube a 6 faces, toutes des carrés.' },
  { minStage: 3, prompt: 'Quelle est la forme des faces d\'un cube ?', correct: 'des carrés', wrong: ['des triangles', 'des cercles', 'des hexagones'], explanation: 'Les 6 faces d\'un cube sont des carrés.' },
  { minStage: 3, prompt: 'Quel solide peut rouler dans toutes les directions ?', correct: 'la boule', wrong: ['le cube', 'le cylindre', 'la pyramide'], explanation: 'La boule n\'a ni face plate ni arête : elle roule dans tous les sens.' },
  { minStage: 4, prompt: 'Deux droites perpendiculaires se coupent en formant :', correct: 'un angle droit', wrong: ['un angle aigu', 'un angle obtus', 'aucun angle'], explanation: 'Des droites perpendiculaires se coupent à angle droit.' },
  { minStage: 4, prompt: 'Deux droites parallèles :', correct: 'ne se coupent jamais', wrong: ['se coupent à angle droit', 'se coupent une fois', 'forment un triangle'], explanation: 'Deux droites parallèles ne se coupent jamais, même prolongées.' },
  { minStage: 5, prompt: 'Un carré est aussi :', correct: 'un rectangle et un losange', wrong: ['un triangle', 'un pentagone', 'un cercle'], explanation: 'Un carré a quatre angles droits (comme un rectangle) et quatre côtés égaux (comme un losange).' },
  { minStage: 5, prompt: 'Dans un parallélogramme, les côtés opposés sont :', correct: 'parallèles et de même longueur', wrong: ['perpendiculaires', 'toujours de longueurs différentes', 'courbes'], explanation: 'Les côtés opposés d\'un parallélogramme sont parallèles et de même longueur.' },
  { minStage: 6, prompt: 'Combien mesure un angle droit ?', correct: '90°', wrong: ['45°', '100°', '180°'], explanation: 'Un angle droit mesure 90 degrés.' },
  { minStage: 6, prompt: 'Un angle aigu mesure :', correct: 'moins de 90°', wrong: ['exactement 90°', 'plus de 90°', 'toujours 180°'], explanation: 'Un angle aigu est plus petit qu\'un angle droit : moins de 90°.' },
];

const proprietes: Family = {
  name: 'proprietes',
  minStage: 2,
  make: (rng, stage) => {
    const item = rngPick(rng, PROPERTIES.filter((entry) => entry.minStage <= stage));
    return {
      detail: item.prompt.slice(0, 24),
      prompt: item.prompt,
      ...choose(rng, item.correct, item.wrong),
      explanation: item.explanation,
    };
  },
};

/** Des patrons de cube, et des assemblages de six carrés qui n'en sont pas —
 *  vérifiés un par un dans les tests. */
export const CUBE_NETS: Net[] = [
  [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [2, 0], [0, 2]],
];
export const NOT_CUBE_NETS: Net[] = [
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [2, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [2, 3]],
];

const patrons: Family = {
  name: 'patrons',
  minStage: 6,
  make: (rng) => {
    const good = rngPick(rng, CUBE_NETS);
    const bad = rngShuffle(rng, NOT_CUBE_NETS).slice(0, 3);
    const order = rngShuffle(rng, [good, ...bad]);
    const letter = ['A', 'B', 'C', 'D'][order.indexOf(good)];
    return {
      detail: letter,
      instruction: 'Imagine que tu plies les carrés',
      prompt: 'Lequel de ces dessins est un patron de cube ?',
      figure: netsFigure(order),
      choices: ['A', 'B', 'C', 'D'],
      correctIndex: ['A', 'B', 'C', 'D'].indexOf(letter),
      explanation: `Le dessin ${letter}, une fois plié, forme un cube : ses six carrés deviennent les six faces.`,
    };
  },
};

export const FAMILIES: Family[] = [
  polygones,
  droites,
  anglesDroits,
  quadrillage,
  quadrilateres,
  triangles,
  cercle,
  proprietes,
  rayonDiametre,
  solides,
  elementsSolides,
  axesSymetrie,
  angles,
  patrons,
];

// Garde-fou : les assemblages annoncés comme patrons en sont vraiment.
if (!CUBE_NETS.every(isCubeNet) || NOT_CUBE_NETS.some(isCubeNet)) {
  throw new Error('Patrons de cube mal vérifiés');
}

/** `n` familles prises à tour de rôle dans la liste. */
function cycle(list: Family[], n: number): Family[] {
  return list.length === 0 ? [] : Array.from({ length: n }, (_, index) => list[index % list.length]);
}

/**
 * Les questions de géométrie d'une séance : la moitié au moins sur ce que le
 * trimestre en cours apporte de nouveau, le reste en révision, jamais deux
 * fois la même question.
 */
export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const stage = stageOf(level, trimester);
  const available = FAMILIES.filter((family) => family.minStage <= stage);
  const recent = available.filter((family) => family.minStage === stage);
  const fromRecent = recent.length > 0 ? Math.ceil(count / 2) : 0;
  const picked = rngShuffle(rng, [
    ...cycle(rngShuffle(rng, recent), fromRecent),
    ...cycle(rngShuffle(rng, available), count - fromRecent),
  ]);
  const seen = new Set<string>();
  return picked.map((family, index) => {
    let made = family.make(rng, stage);
    for (let attempt = 0; attempt < 6 && seen.has(`${family.name}-${made.detail}`); attempt++) {
      made = family.make(rng, stage);
    }
    seen.add(`${family.name}-${made.detail}`);
    const { detail, ...question } = made;
    return { id: `geometrie-${family.name}-${index}-${detail}`, domain: 'geometrie' as const, ...question };
  });
}
