import type { Figure, Point, Shape } from '../lib/figures';
import { polar, round } from '../lib/figures';
import type { Construction, Node } from '../lib/construction';
import { nodePoint } from '../lib/construction';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import type { Stage } from '../lib/progression';
import { choose, NO_CHOICES, type Family } from './geometrieCommun';
import { BUILD_GRID } from './geometrieConstructions';
import {
  angleDroit,
  circleFigure,
  equilateralTriangle,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  gridFigure,
  irregularPolygon,
  isoscelesTriangle,
  netsFigure,
  rectangle,
  rhombus,
  rightTriangle,
  rotate,
  scaleneTriangle,
  square,
} from './geometrieFigures';
import { formatLength, polyomino, rulerFigure, rulerLength } from './geometrieMesures';
import {
  anglesParQuatre,
  CARREAUX,
  carreauxParTrois,
  CERCLE,
  condenser,
  distanceALaDroite,
  etiquetteDansLeCadre,
  formesFigure,
  grilleDuRobot,
  LETTRES_DES_CASES,
  lettresConsecutives,
  lettresDistinctes,
  longueurSurLeCote,
  longueursDePolygone,
  nomDeLaCase,
  NOM_DU_SOLIDE,
  nomsSurLaRegle,
  pointDuCercle,
  pointsNommes,
  PATRONS_DU_CUBE,
  PAS_DES_PATRONS,
  polygoneNomme,
  reglePourTracer,
  REGLE_A_TRACER,
  reprendre,
  segmentNomme,
  solideFigure,
  surLaDroite,
  surLeCercle,
  trianglesParQuatre,
  type FormePlane,
  type Solide,
} from './geometrieDessins';

/**
 * La géométrie du CE1 et du CE2 (programme de mathématiques du cycle 2, 2025,
 * « Espace et géométrie »), avec des figures dont les sommets portent des
 * lettres : un énoncé n'est jamais deux fois le même.
 *
 * Progression, cumulative d'un trimestre à l'autre dans le cycle :
 * - CE1, 1er trimestre : reconnaître le carré, le rectangle, le triangle, le
 *   cercle ; compter côtés et sommets ; l'angle droit à l'équerre ; des points
 *   alignés ; les solides (cube, pavé droit, boule, cylindre, cône) ; repérer
 *   une case sur un quadrillage ;
 * - CE1, 2e : les côtés égaux du carré et du rectangle ; reproduire une
 *   figure sur quadrillage ; lire une longueur en centimètres sur une règle ;
 *   tracer un segment de longueur donnée ;
 * - CE1, 3e : lire une longueur dont le segment ne part pas de 0 ; suivre un
 *   robot sur un quadrillage (programmation de déplacements) ;
 * - CE2, 1er : le périmètre d'un polygone, en ajoutant ses côtés ; les
 *   millimètres sur la règle ; le milieu d'un segment ; le triangle
 *   rectangle ;
 * - CE2, 2e : le cercle (centre, rayon, diamètre) ; le losange ; les axes de
 *   symétrie, compléter une figure par symétrie ; faces, arêtes et sommets,
 *   patron du cube ; le périmètre du carré et du rectangle ;
 * - CE2, 3e : un robot qui répète un parcours (boucle) ; comparer des aires
 *   en comptant des carreaux.
 *
 * Hors programme, donc absent : la symétrie axiale au CE1, l'aire et le
 * périmètre par formule au CE1, les angles aigus et obtus, le rapporteur.
 */

const NOMS_DES_QUATRE_FIGURES = LETTRES_DES_CASES;

// === CE1, 1er trimestre ======================================================================

const NOM_DE_LA_FORME = { carre: 'un carré', rectangle: 'un rectangle', triangle: 'un triangle', cercle: 'un cercle' } as const;
type FormeDemandee = keyof typeof NOM_DE_LA_FORME;

/** Les trois autres figures : jamais une qui se confonde avec celle qu'on cherche (un carré est un rectangle particulier). */
const AUTRES_FORMES: Record<FormeDemandee, FormePlane[]> = {
  carre: ['rectangle', 'triangle', 'cercle'],
  rectangle: ['triangle', 'cercle', 'quadrilatere'],
  triangle: ['carre', 'rectangle', 'cercle'],
  cercle: ['carre', 'triangle', 'rectangle'],
};

const POURQUOI_LA_FORME: Record<FormeDemandee, string> = {
  carre: 'Le carré a quatre côtés égaux et quatre angles droits.',
  rectangle: 'Le rectangle a quatre angles droits, mais pas quatre côtés égaux.',
  triangle: 'Un triangle a trois côtés et trois sommets.',
  cercle: 'Un cercle est tout rond : il n\'a ni côté ni sommet.',
};

const formesPlanes: Family = {
  name: 'formes-planes',
  minStage: -5,
  make: (rng) => {
    const demandee = rngPick(rng, Object.keys(NOM_DE_LA_FORME) as FormeDemandee[]);
    const formes = rngShuffle(rng, [demandee, ...AUTRES_FORMES[demandee]]);
    return {
      detail: `${demandee}-${formes.join('.')}`,
      instruction: 'Regarde bien les quatre figures',
      prompt: `Quelle figure est ${NOM_DE_LA_FORME[demandee]} ?`,
      figure: formesFigure(formes),
      choices: [...NOMS_DES_QUATRE_FIGURES],
      correctIndex: formes.indexOf(demandee),
      explanation: POURQUOI_LA_FORME[demandee],
    };
  },
};

const sommetsEtCotes: Family = {
  name: 'sommets-cotes',
  minStage: -5,
  make: (rng) => {
    const n = rngPick(rng, [3, 4, 5, 6]);
    const lettres = lettresConsecutives(rng, n);
    const nom = lettres.join('');
    const demande = rngPick(rng, ['sommets', 'côtés'] as const);
    return {
      detail: `${nom}-${demande}`,
      instruction: demande === 'sommets' ? 'Un sommet est un coin de la figure' : 'Un côté est un trait entre deux sommets',
      prompt: `Combien de ${demande} a la figure ${nom} ?`,
      figure: polygoneNomme(irregularPolygon(n, rng), lettres, () => [], `Une figure à plusieurs côtés, dont les sommets sont nommés ${lettres.join(', ')}.`),
      ...choose(rng, String(n), ['3', '4', '5', '6', '7']),
      explanation: `La figure ${nom} a ${n} sommets et ${n} côtés.`,
    };
  },
};

const TAILLES_NON_DROITES = [35, 50, 60, 120, 135, 150];

/** Des figures dont on compte les angles droits : rien ne les code, l'élève vérifie à l'équerre. */
const FIGURES_A_ANGLES_DROITS: { n: number; points: () => Point[]; droits: number }[] = [
  { n: 4, points: () => rectangle(1.6), droits: 4 },
  { n: 4, points: square, droits: 4 },
  { n: 3, points: () => rightTriangle(70), droits: 1 },
  { n: 4, points: () => [[0, 0], [150, 10], [110, 100], [25, 85]], droits: 0 },
  { n: 3, points: scaleneTriangle, droits: 0 },
];

const angleDroitALEquerre: Family = {
  name: 'angle-droit',
  minStage: -5,
  make: (rng) => {
    if (rng() < 0.5) {
      const tailles = rngShuffle(rng, [90, ...rngShuffle(rng, TAILLES_NON_DROITES).slice(0, 3)]);
      const rotations = tailles.map(() => rngInt(rng, 0, 359));
      const droit = tailles.indexOf(90);
      return {
        detail: `quatre-${tailles.join('.')}-${rotations.join('.')}`,
        instruction: 'Compare avec le coin de ton équerre',
        prompt: 'Quel angle est un angle droit ?',
        figure: anglesParQuatre(tailles, rotations),
        choices: [...NOMS_DES_QUATRE_FIGURES],
        correctIndex: droit,
        explanation: `L'angle ${LETTRES_DES_CASES[droit]} est un angle droit : il va dans le coin de l'équerre.`,
      };
    }
    const forme = rngPick(rng, FIGURES_A_ANGLES_DROITS);
    const lettres = lettresConsecutives(rng, forme.n);
    const nom = lettres.join('');
    const rotation = rngPick(rng, [0, 0, 15, -12, 90]);
    const points = rotate(forme.points(), rotation);
    return {
      detail: `${nom}-${forme.droits}-${forme.n}-${rotation}`,
      instruction: 'Vérifie avec ton équerre',
      prompt: `Combien d'angles droits a la figure ${nom} ?`,
      figure: polygoneNomme(points, lettres, () => [], `Une figure à plusieurs côtés, dont les sommets sont nommés ${lettres.join(', ')}.`),
      ...choose(rng, String(forme.droits), ['0', '1', '2', '3', '4']),
      explanation: forme.droits === 0 ? 'Aucun de ses angles n\'est droit.' : `Elle a ${forme.droits} angle${forme.droits > 1 ? 's' : ''} droit${forme.droits > 1 ? 's' : ''}.`,
    };
  },
};

const pointsAlignes: Family = {
  name: 'points-alignes',
  minStage: -5,
  make: (rng) => {
    const [a, b, ...candidats] = lettresDistinctes(rng, 6);
    const milieu: Point = [150, 100];
    for (let essai = 0; ; essai++) {
      const degres = rngPick(rng, [0, 20, 35, 50, 70, 90, 110, 125, 145, 160]);
      const [pointA, pointB, pointAligne] = [
        surLaDroite(milieu, degres, -rngInt(rng, 50, 78)),
        surLaDroite(milieu, degres, -rngInt(rng, 0, 14)),
        surLaDroite(milieu, degres, rngInt(rng, 42, 78)),
      ];
      const autres: Point[] = [];
      for (let tentative = 0; autres.length < 3 && tentative < 400; tentative++) {
        const point: Point = [rngInt(rng, 28, 272), rngInt(rng, 26, 174)];
        // Nettement à côté de la droite (AB), et loin de tous les autres points.
        const lointain = [pointA, pointB, pointAligne, ...autres].every(([x, y]) => Math.hypot(point[0] - x, point[1] - y) >= 28);
        if (distanceALaDroite(point, milieu, degres) >= 20 && lointain) autres.push(point);
      }
      if (autres.length < 3) {
        if (essai > 50) throw new Error('Aucun dessin de points alignés ne tient dans le cadre.');
        continue;
      }
      // Le premier des quatre candidats est le point aligné ; les lettres sont rendues dans l'ordre alphabétique.
      const [lettreAlignee, ...autresLettres] = candidats;
      const points = [
        { lettre: a, point: pointA },
        { lettre: b, point: pointB },
        { lettre: lettreAlignee, point: pointAligne },
        ...autresLettres.map((lettre, index) => ({ lettre, point: autres[index] })),
      ];
      const choix = [...candidats].sort();
      return {
        detail: `${a}${b}-${degres}-${lettreAlignee}-${condenser(JSON.stringify(autres))}`,
        instruction: 'Pose ta règle pour vérifier',
        prompt: `Quel point est aligné avec ${a} et ${b} ?`,
        figure: pointsNommes(points, 'Six points, chacun avec sa lettre.'),
        choices: choix,
        correctIndex: choix.indexOf(lettreAlignee),
        explanation: `Les points ${a}, ${b} et ${lettreAlignee} sont sur une même droite.`,
      };
    }
  },
};

const SOLIDES_DU_CE1: Solide[] = ['cube', 'pave', 'cylindre', 'cone', 'boule'];

/** Des objets de tous les jours, et le solide auquel ils ressemblent : un seul par objet. */
const OBJETS_ET_SOLIDES: [string, Solide][] = [
  ['un dé', 'cube'],
  ['une boîte de chaussures', 'pave'],
  ['un ballon', 'boule'],
  ['une boîte de conserve', 'cylindre'],
  ['un cornet de glace', 'cone'],
  ['une brique', 'pave'],
  ['une balle de tennis', 'boule'],
  ['un chapeau pointu de clown', 'cone'],
  ['un tube de colle', 'cylindre'],
  ['une boîte de céréales', 'pave'],
  ['une bille', 'boule'],
  ['un pot de confiture', 'cylindre'],
];

const solidesDuCE1: Family = {
  name: 'solides-ce1',
  minStage: -5,
  make: (rng) => {
    if (rng() < 0.5) {
      const solide = rngPick(rng, SOLIDES_DU_CE1);
      return {
        detail: `figure-${solide}`,
        instruction: 'Regarde bien le solide',
        prompt: 'Comment s\'appelle ce solide ?',
        figure: solideFigure(solide),
        ...choose(rng, NOM_DU_SOLIDE[solide], SOLIDES_DU_CE1.map((nom) => NOM_DU_SOLIDE[nom])),
        explanation: `C'est ${NOM_DU_SOLIDE[solide]}.`,
      };
    }
    const [objet, solide] = rngPick(rng, OBJETS_ET_SOLIDES);
    return {
      detail: `objet-${objet}`,
      instruction: 'Pense à la forme de l\'objet',
      prompt: `Quel solide ressemble à ${objet} ?`,
      ...choose(rng, NOM_DU_SOLIDE[solide], SOLIDES_DU_CE1.map((nom) => NOM_DU_SOLIDE[nom])),
      explanation: `${objet.charAt(0).toUpperCase()}${objet.slice(1)} a la forme d'${NOM_DU_SOLIDE[solide]}.`,
    };
  },
};

const repereCase: Family = {
  name: 'repere-case',
  minStage: -5,
  make: (rng) => {
    const [colonne, ligne] = [rngInt(rng, 0, 4), rngInt(rng, 0, 4)];
    const bonne = nomDeLaCase([colonne, ligne]);
    // Les cases voisines, et la lettre et le chiffre échangés : les erreurs de lecture.
    const voisines = [
      [colonne, (ligne + 1) % 5],
      [(colonne + 1) % 5, ligne],
      [(colonne + 4) % 5, ligne],
      [colonne, (ligne + 4) % 5],
    ].map(([c, l]) => nomDeLaCase([c, l] as Node));
    return {
      detail: bonne,
      instruction: 'La lettre de la colonne, puis le chiffre de la ligne',
      prompt: 'Dans quelle case est l\'étoile ?',
      figure: gridFigure(colonne, ligne),
      ...choose(rng, bonne, voisines),
      explanation: `Colonne ${bonne[0]}, ligne ${bonne[1]} : c'est la case ${bonne}.`,
    };
  },
};

// === CE1, 2e trimestre ======================================================================

const cotesEgaux: Family = {
  name: 'cotes-egaux',
  minStage: -4,
  make: (rng) => {
    const [a, b, c, d] = lettresConsecutives(rng, 4);
    const nom = `${a}${b}${c}${d}`;
    if (rng() < 0.4) {
      const cote = rngInt(rng, 2, 12);
      const [de, vers] = rngPick(rng, [[c, d], [b, c], [d, a]] as [string, string][]);
      return {
        detail: `carre-${nom}-${cote}-${de}${vers}`,
        instruction: 'Un carré a quatre côtés de même longueur',
        prompt: `Le carré ${nom} a un côté ${segmentNomme(a, b)} de ${cote} cm. Combien mesure ${segmentNomme(de, vers)} ?`,
        figure: polygoneNomme(
          [[0, 0], [100, 0], [100, 100], [0, 100]],
          [a, b, c, d],
          (sommets, centre) => [...sommets.map((_, index) => angleDroit(sommets, index)), longueurSurLeCote(sommets[0], sommets[1], centre, `${cote} cm`)],
          `Un carré ${nom} dont un côté porte sa longueur.`,
          52
        ),
        ...choose(rng, `${cote} cm`, [`${cote + 1} cm`, `${cote - 1} cm`, `${cote * 2} cm`, `${cote * 4} cm`, `${cote + 2} cm`].filter((texte) => !texte.startsWith('0 ') && !texte.startsWith('-'))),
        explanation: 'Un carré a quatre côtés de même longueur.',
      };
    }
    const longueur = rngInt(rng, 4, 12);
    const largeur = rngInt(rng, 2, longueur - 2);
    const demande = rngPick(rng, [[c, d], [d, a]] as [string, string][]);
    const reponse = demande[0] === c ? longueur : largeur;
    return {
      detail: `rectangle-${nom}-${longueur}-${largeur}-${demande.join('')}`,
      instruction: 'Les côtés opposés d\'un rectangle sont égaux',
      prompt: `Le rectangle ${nom} a un côté ${segmentNomme(a, b)} de ${longueur} cm. Le côté ${segmentNomme(b, c)} mesure ${largeur} cm. Combien mesure ${segmentNomme(demande[0], demande[1])} ?`,
      figure: polygoneNomme(
        [[0, 0], [longueur, 0], [longueur, largeur], [0, largeur]],
        [a, b, c, d],
        (sommets, centre) => [
          ...sommets.map((_, index) => angleDroit(sommets, index)),
          longueurSurLeCote(sommets[0], sommets[1], centre, `${longueur} cm`),
          longueurSurLeCote(sommets[1], sommets[2], centre, `${largeur} cm`),
        ],
        `Un rectangle ${nom} dont deux côtés portent leur longueur.`,
        52
      ),
      ...choose(rng, `${reponse} cm`, [`${reponse === longueur ? largeur : longueur} cm`, `${longueur + largeur} cm`, `${reponse * 2} cm`, `${reponse + 1} cm`, `${reponse - 1} cm`].filter((texte) => !texte.startsWith('0 '))),
      explanation: 'Dans un rectangle, les côtés opposés ont la même longueur.',
    };
  },
};

// === La règle ================================================================================

/** Lire une longueur sur une règle : en centimètres entiers, avec un départ qui n'est pas toujours 0, puis en millimètres. */
function regleFamille(nom: string, minStage: Stage, depart: (rng: Rng) => number, longueur: (rng: Rng, depart: number) => number, instruction: string, enMillimetres = false): Family {
  return {
    name: nom,
    minStage,
    make: (rng, stage) => {
      const de = depart(rng);
      const mesure = longueur(rng, de);
      const fin = de + mesure;
      const [g, h] = lettresDistinctes(rng, 2);
      const format = (mm: number) => formatLength(mm, stage);
      // Le piège classique : lire la graduation d'arrivée sans retirer le départ.
      const fausses = [format(fin), format(mesure + 10), format(mesure - 10), format(mesure + 20), format(mesure - 20), ...(mesure % 10 === 0 ? [] : [format(mesure + 5), format(mesure - 5), format(mesure + 1)])].filter((texte) => !texte.startsWith('0 ') && !texte.startsWith('-'));
      return {
        detail: `${g}${h}-${de}-${fin}`,
        instruction,
        prompt: `Combien mesure le segment ${segmentNomme(g, h)} ?`,
        figure: (() => {
          const base = rulerFigure(de, fin);
          return { ...base, shapes: [...base.shapes, ...nomsSurLaRegle(de, fin, rulerLength(fin), [g, h])] };
        })(),
        ...choose(rng, format(mesure), fausses),
        explanation: enMillimetres
          ? `Le segment va de ${de} mm à ${fin} mm. ${fin} − ${de} = ${mesure} mm, soit ${format(mesure)}.`
          : de === 0
            ? `Le segment va de 0 à ${format(fin)}. Il mesure ${format(mesure)}.`
            : `Le segment va de ${format(de)} à ${format(fin)}. Il mesure ${format(fin)} − ${format(de)} = ${format(mesure)}.`,
      };
    },
  };
}

const regleLire = regleFamille('regle-lire', -4, () => 0, (rng) => rngInt(rng, 2, 9) * 10, 'Regarde où finit le segment');
const regleDepart = regleFamille(
  'regle-depart',
  -3,
  (rng) => rngPick(rng, [10, 20, 30, 40]),
  (rng, depart) => rngInt(rng, 2, Math.min(6, (100 - depart) / 10)) * 10,
  'Regarde où il commence, et où il finit'
);
const regleMillimetres = regleFamille(
  'regle-millimetres',
  -2,
  (rng) => rngPick(rng, [0, 5, 10, 15, 20, 25, 30]),
  (rng) => rngInt(rng, 15, 65),
  'Compte les centimètres, puis les millimètres',
  true
);

const tracerSegment: Family = {
  name: 'tracer-segment',
  minStage: -4,
  make: (rng, stage) => {
    const [a, b] = lettresDistinctes(rng, 2);
    const depart = stage === -4 ? 0 : rngInt(rng, 0, 4);
    const longueur = rngInt(rng, 2, Math.min(8, REGLE_A_TRACER.centimetres - depart));
    const fin = depart + longueur;
    const { gauche, cote, y } = REGLE_A_TRACER;
    const x = (cm: number) => gauche + cote * cm;
    const construction: Construction = {
      grid: { origin: [gauche, y], cols: REGLE_A_TRACER.centimetres, rows: 0, cell: cote },
      target: 'noeud',
      count: 1,
      rule: { kind: 'points', expected: [[fin, 0]] },
      mark: 'point',
      fixed: [[depart, 0]],
      solution: [
        { kind: 'segment', from: [x(depart), y], to: [x(fin), y], ink: 'couleur', width: 3.5 },
        { kind: 'circle', center: [x(fin), y], radius: 6, ink: 'couleur', fill: true },
        { kind: 'text', at: [x(fin), 42], text: b, anchor: 'middle', bold: true, size: 14, ink: 'couleur', halo: true },
      ],
    };
    return {
      detail: `${a}${b}-${depart}-${longueur}`,
      instruction: 'Lis bien la graduation du point de départ',
      prompt: `Trace le segment ${segmentNomme(a, b)} de ${longueur} cm : pose le point ${b}.`,
      figure: reglePourTracer(depart, a),
      ...NO_CHOICES,
      construction,
      explanation: depart === 0 ? `Le point ${a} est sur 0. Pose ${b} sur ${fin}.` : `Le point ${a} est sur ${depart}. ${depart} + ${longueur} = ${fin} : pose ${b} sur ${fin}.`,
    };
  },
};

// === Le robot ===============================================================================

type Sens = 'droite' | 'gauche' | 'bas' | 'haut';
interface Pas {
  sens: Sens;
  cases: number;
}

const VECTEUR: Record<Sens, Node> = { droite: [1, 0], gauche: [-1, 0], bas: [0, 1], haut: [0, -1] };
const TEXTE_DU_SENS: Record<Sens, string> = { droite: 'à droite', gauche: 'à gauche', bas: 'en bas', haut: 'en haut' };
const SENS: Sens[] = ['droite', 'gauche', 'bas', 'haut'];
const textePas = ({ sens, cases }: Pas) => `${cases} case${cases > 1 ? 's' : ''} ${TEXTE_DU_SENS[sens]}`;
const dansLaGrille = ([colonne, ligne]: Node) => colonne >= 0 && ligne >= 0 && colonne <= 4 && ligne <= 4;

/** Le parcours d'un robot, case par case : toutes les cases où il passe. */
export function parcours(depart: Node, pas: Pas[], repetitions: number): Node[] {
  const chemin: Node[] = [depart];
  for (let tour = 0; tour < repetitions; tour++) {
    for (const { sens, cases } of pas) {
      for (let k = 0; k < cases; k++) {
        const [colonne, ligne] = chemin[chemin.length - 1];
        chemin.push([colonne + VECTEUR[sens][0], ligne + VECTEUR[sens][1]]);
      }
    }
  }
  return chemin;
}

/** Un programme et un départ tels que le robot reste dans la grille d'un bout à l'autre. */
function tirerUnProgramme(rng: Rng, nombreDePas: number, casesMax: number, repetitions: number) {
  for (let essai = 0; essai < 500; essai++) {
    const pas: Pas[] = Array.from({ length: nombreDePas }, () => ({ sens: rngPick(rng, SENS), cases: rngInt(rng, 1, casesMax) }));
    // Deux pas : l'un à l'horizontale, l'autre à la verticale (deux pas dans le même sens se diraient en un seul, dans le sens contraire ils s'annuleraient).
    const horizontal = (sens: Sens) => sens === 'droite' || sens === 'gauche';
    if (pas.length === 2 && horizontal(pas[0].sens) === horizontal(pas[1].sens)) continue;
    const depart: Node = [rngInt(rng, 0, 4), rngInt(rng, 0, 4)];
    const chemin = parcours(depart, pas, repetitions);
    if (chemin.every(dansLaGrille)) return { pas, depart, arrivee: chemin[chemin.length - 1] };
  }
  throw new Error('Aucun parcours de robot ne tient dans la grille.');
}

function robot(nom: string, minStage: Stage, avecBoucle: boolean): Family {
  return {
    name: nom,
    minStage,
    make: (rng) => {
      const repetitions = avecBoucle ? rngInt(rng, 2, 4) : 1;
      // Une boucle répète deux pas (un seul pas répété se dirait « n cases »).
      const { pas, depart, arrivee } = tirerUnProgramme(rng, avecBoucle ? 2 : rngInt(rng, 1, 2), avecBoucle ? 1 : 3, repetitions);
      const programme = pas.map(textePas).join(', puis ');
      const [a, b] = [nomDeLaCase(depart), nomDeLaCase(arrivee)];
      // Les erreurs : un sens pris pour son contraire, un pas de trop ou de moins, le départ, les axes mélangés.
      const contraire = (sens: Sens): Sens => ({ droite: 'gauche', gauche: 'droite', bas: 'haut', haut: 'bas' } as Record<Sens, Sens>)[sens];
      const echange = (sens: Sens): Sens => ({ droite: 'bas', bas: 'droite', gauche: 'haut', haut: 'gauche' } as Record<Sens, Sens>)[sens];
      const variantes: Node[] = [
        parcours(depart, pas.map(({ sens, cases }) => ({ sens: contraire(sens), cases })), repetitions).pop()!,
        parcours(depart, pas.map(({ sens, cases }) => ({ sens: echange(sens), cases })), repetitions).pop()!,
        parcours(depart, [{ ...pas[0], cases: pas[0].cases + 1 }, ...pas.slice(1)], repetitions).pop()!,
        parcours(depart, [{ ...pas[0], cases: Math.max(1, pas[0].cases - 1) }, ...pas.slice(1)], repetitions).pop()!,
        parcours(depart, pas.slice(0, -1), repetitions).pop()!,
        ...(avecBoucle ? [parcours(depart, pas, repetitions + 1).pop()!, parcours(depart, pas, repetitions - 1).pop()!] : []),
        depart,
      ];
      const plausibles = [...new Set(variantes.filter(dansLaGrille).map(nomDeLaCase))].filter((nom_) => nom_ !== b);
      // S'il en manque, d'autres cases : mieux vaut une case sans histoire qu'une proposition de moins.
      const fausses = plausibles.length >= 3 ? plausibles : [...plausibles, ...['A1', 'B2', 'C3', 'D4', 'E5', 'A5', 'E1'].filter((nom_) => nom_ !== b)];
      return {
        detail: `${a}-${programme}-${repetitions}`,
        instruction: 'Suis le robot case par case',
        prompt: avecBoucle
          ? `Le robot part de la case ${a}. Il répète ${repetitions} fois : ${programme}. Dans quelle case arrive-t-il ?`
          : `Le robot part de la case ${a}. Il fait : ${programme}. Dans quelle case arrive-t-il ?`,
        figure: grilleDuRobot(depart),
        ...choose(rng, b, fausses),
        explanation: `Le robot passe de ${a} à ${b}.`,
      };
    },
  };
}

const deplacements = robot('deplacements', -3, false);
const deplacementsEnBoucle = robot('deplacements-boucle', 0, true);

// === Le périmètre, le milieu, le triangle rectangle ===============================================

const perimetrePolygone: Family = {
  name: 'perimetre-polygone',
  minStage: -2,
  make: (rng) => {
    if (rng() < 0.5) {
      const n = rngPick(rng, [3, 4, 5]);
      const lettres = lettresConsecutives(rng, n);
      const nom = lettres.join('');
      const longueurs = longueursDePolygone(rng, n, 3, 12);
      const total = longueurs.reduce((somme, valeur) => somme + valeur, 0);
      const figure = polygoneNomme(
        irregularPolygon(n, rng),
        lettres,
        (sommets, centre) => sommets.map((sommet, index) => longueurSurLeCote(sommet, sommets[(index + 1) % n], centre, `${longueurs[index]} cm`)),
        `Un polygone ${nom} dont chaque côté porte sa longueur.`,
        48
      );
      return {
        detail: `${nom}-${longueurs.join('.')}`,
        instruction: 'Le périmètre, c\'est la longueur du tour de la figure',
        prompt: `Quel est le périmètre du polygone ${nom} ?`,
        figure,
        ...choose(rng, `${total} cm`, [`${total - Math.min(...longueurs)} cm`, `${total + Math.max(...longueurs)} cm`, `${total + 1} cm`, `${total - 1} cm`, `${total + 2} cm`]),
        explanation: `On ajoute tous les côtés : ${longueurs.join(' + ')} = ${total} cm.`,
      };
    }
    const [x, y, z] = longueursDePolygone(rng, 3, 3, 12);
    const total = x + y + z;
    return {
      detail: `triangle-${x}-${y}-${z}`,
      instruction: 'Le périmètre, c\'est la longueur du tour de la figure',
      prompt: `Un triangle a trois côtés : ${x} cm, ${y} cm et ${z} cm. Quel est son périmètre ?`,
      ...choose(rng, `${total} cm`, [`${total - Math.min(x, y, z)} cm`, `${total + Math.max(x, y, z)} cm`, `${total + 1} cm`, `${total - 1} cm`, `${Math.max(x, y, z) * 3} cm`]),
      explanation: `On ajoute les trois côtés : ${x} + ${y} + ${z} = ${total} cm.`,
    };
  },
};

/** Une figure de la grille des constructions (9 carreaux sur 6, 30 de côté), avec ce qu'on y dessine. */
function grilleDeConstruction(extra: Shape[], alt: string): Figure {
  const { origin, cols, rows, cell } = BUILD_GRID;
  return { width: 300, height: 210, shapes: [{ kind: 'quadrillage', origin, cols, rows, cell }, ...extra], alt };
}

const milieuChoix: Family = {
  name: 'milieu',
  minStage: -2,
  make: (rng) => {
    const [a, b, ...candidats] = lettresDistinctes(rng, 6);
    const degres = rngPick(rng, [0, 10, -10, 20, -20]);
    const debut = polar([150, 100], 110, degres + 180);
    const fin = polar([150, 100], 110, degres);
    // Les quatre candidats sont sur le segment : un seul est à égale distance des extrémités.
    let fractions: number[] = [];
    for (let essai = 0; essai < 200 && fractions.length < 3; essai++) {
      const candidate = rngPick(rng, [0.15, 0.2, 0.3, 0.35, 0.65, 0.7, 0.8, 0.85]);
      if (fractions.every((autre) => Math.abs(autre - candidate) >= 0.12)) fractions = [...fractions, candidate];
    }
    const positions = rngShuffle(rng, [0.5, ...fractions]);
    const lettreDuMilieu = candidats[positions.indexOf(0.5)];
    const point = (fraction: number): Point => round([debut[0] + (fin[0] - debut[0]) * fraction, debut[1] + (fin[1] - debut[1]) * fraction]);
    // Perpendiculaire au segment (dans le repère de l'écran, où y descend) ; l'étiquette passe au-dessus.
    const normale: Point = [Math.sin((degres * Math.PI) / 180), Math.cos((degres * Math.PI) / 180)];
    const versLeHaut: Point = normale[1] > 0 ? [-normale[0], -normale[1]] : normale;
    const etiquetteDe = (fraction: number, texte: string): Shape => {
      const [x, y] = point(fraction);
      return { kind: 'text', at: round([x + versLeHaut[0] * 18, y + versLeHaut[1] * 18 + 5]), text: texte, anchor: 'middle', bold: true, size: 14, halo: true };
    };
    const tiret = (fraction: number): Shape => {
      const [x, y] = point(fraction);
      return { kind: 'segment', from: round([x - normale[0] * 7, y - normale[1] * 7]), to: round([x + normale[0] * 7, y + normale[1] * 7]), width: 2 };
    };
    const shapes: Shape[] = [
      { kind: 'segment', from: round(debut), to: round(fin), width: 3 },
      ...[0, 1, ...positions].map((fraction): Shape => ({ kind: 'point', at: point(fraction) })),
      etiquetteDe(0, a),
      etiquetteDe(1, b),
      ...positions.map((fraction, index) => etiquetteDe(fraction, candidats[index])),
      ...positions.map((fraction) => tiret(fraction)),
    ];
    const choix = [...candidats].sort();
    return {
      detail: `${a}${b}-${degres}-${positions.join('.')}-${candidats.join('')}`,
      instruction: 'Le milieu est à égale distance des deux extrémités',
      prompt: `Quel point est le milieu du segment ${segmentNomme(a, b)} ?`,
      figure: { width: FIGURE_WIDTH, height: FIGURE_HEIGHT, shapes, alt: `Un segment ${segmentNomme(a, b)} et quatre points posés sur lui.` },
      choices: choix,
      correctIndex: choix.indexOf(lettreDuMilieu),
      explanation: `Le point ${lettreDuMilieu} est à égale distance de ${a} et de ${b}.`,
    };
  },
};

const construireMilieu: Family = {
  name: 'construire-milieu',
  minStage: -2,
  make: (rng) => {
    const [k, l] = lettresDistinctes(rng, 2);
    for (let essai = 0; ; essai++) {
      const [dx, dy] = [rngPick(rng, [2, 4, 6, 8, -2, -4, -6, -8, 0]), rngPick(rng, [2, 4, -2, -4, 0])];
      const a: Node = [rngInt(rng, 0, BUILD_GRID.cols), rngInt(rng, 0, BUILD_GRID.rows)];
      const b: Node = [a[0] + dx, a[1] + dy];
      if ((dx === 0 && dy === 0) || b[0] < 0 || b[1] < 0 || b[0] > BUILD_GRID.cols || b[1] > BUILD_GRID.rows) {
        if (essai > 300) throw new Error('Aucun segment ne tient dans la grille.');
        continue;
      }
      const milieu: Node = [a[0] + dx / 2, a[1] + dy / 2];
      const [pa, pb] = [nodePoint(BUILD_GRID, a), nodePoint(BUILD_GRID, b)];
      const centre: Point = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      return {
        detail: `${k}${l}-${a.join('.')}-${b.join('.')}`,
        instruction: 'Compte les carreaux d\'une extrémité à l\'autre, puis prends la moitié',
        prompt: `Pose le milieu du segment ${segmentNomme(k, l)}.`,
        figure: grilleDeConstruction(
          [{ kind: 'segment', from: pa, to: pb, width: 3 }, { kind: 'point', at: pa }, { kind: 'point', at: pb }, etiquetteDansLeCadre(pa, centre, k), etiquetteDansLeCadre(pb, centre, l)],
          `Un quadrillage avec un segment ${segmentNomme(k, l)}.`
        ),
        ...NO_CHOICES,
        construction: {
          grid: BUILD_GRID,
          target: 'noeud',
          count: 1,
          rule: { kind: 'points', expected: [milieu] },
          fixed: [a, b],
          solution: [{ kind: 'circle', center: nodePoint(BUILD_GRID, milieu), radius: 7, ink: 'couleur', fill: true }],
        },
        explanation: 'Le milieu est à la même distance des deux extrémités : la moitié du chemin.',
      };
    }
  },
};

const triangleRectangle: Family = {
  name: 'triangle-rectangle',
  minStage: -2,
  make: (rng) => {
    const droit = rngInt(rng, 0, 3);
    const triangles: Point[][] = [];
    for (let index = 0; index < 4; index++) {
      for (;;) {
        const base: Point[] =
          index === droit
            ? [[0, 0], [rngInt(rng, 55, 75), 0], [0, rngInt(rng, 35, 48)]]
            : [[0, 0], [rngInt(rng, 50, 80), rngInt(rng, -10, 10)], [rngInt(rng, 5, 70), rngInt(rng, 30, 55)]];
        const angles = anglesDuTriangle(base);
        const tourne = rotate(base, rngInt(rng, 0, 359)).map(round);
        const etendues = [0, 1].map((axe) => Math.max(...tourne.map((point) => point[axe])) - Math.min(...tourne.map((point) => point[axe])));
        // Un angle droit exact pour le triangle rectangle, jamais près de 90° pour les autres, et la figure tient dans sa case.
        const bonAngle = index === droit ? angles.some((angle) => Math.abs(angle - 90) < 0.01) : angles.every((angle) => Math.abs(angle - 90) >= 22 && angle >= 22);
        if (bonAngle && etendues.every((etendue) => etendue <= 90)) {
          triangles.push(tourne);
          break;
        }
      }
    }
    return {
      detail: `${droit}-${condenser(JSON.stringify(triangles))}`,
      instruction: 'Vérifie avec ton équerre',
      prompt: 'Quel triangle est rectangle ?',
      figure: trianglesParQuatre(triangles),
      choices: [...NOMS_DES_QUATRE_FIGURES],
      correctIndex: droit,
      explanation: `Le triangle ${LETTRES_DES_CASES[droit]} a un angle droit : c'est un triangle rectangle.`,
    };
  },
};

/** Les trois angles d'un triangle, en degrés. */
export function anglesDuTriangle(points: Point[]): number[] {
  return points.map((point, index) => {
    const [avant, apres] = [points[(index + 2) % 3], points[(index + 1) % 3]];
    const [ux, uy, vx, vy] = [avant[0] - point[0], avant[1] - point[1], apres[0] - point[0], apres[1] - point[1]];
    return (Math.acos((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))) * 180) / Math.PI;
  });
}

// === CE2, 2e trimestre ======================================================================

const cercleCE2: Family = {
  name: 'cercle-ce2',
  minStage: -1,
  make: (rng) => {
    const variante = rngInt(rng, 0, 2);
    if (variante === 0) {
      const rayon = rngInt(rng, 2, 12);
      return {
        detail: `diametre-${rayon}`,
        instruction: 'Le diamètre est le double du rayon',
        prompt: `Le rayon d'un cercle mesure ${rayon} cm. Combien mesure son diamètre ?`,
        figure: circleFigure('rayon', rngInt(rng, 10, 160)),
        ...choose(rng, `${2 * rayon} cm`, [`${rayon} cm`, `${3 * rayon} cm`, `${2 * rayon + 2} cm`, `${2 * rayon - 1} cm`, `${rayon + 2} cm`]),
        explanation: `Le diamètre est le double du rayon : ${rayon} × 2 = ${2 * rayon} cm.`,
      };
    }
    if (variante === 1) {
      const rayon = rngInt(rng, 2, 12);
      return {
        detail: `rayon-${rayon}`,
        instruction: 'Le rayon est la moitié du diamètre',
        prompt: `Le diamètre d'un cercle mesure ${2 * rayon} cm. Combien mesure son rayon ?`,
        figure: circleFigure('diametre', rngInt(rng, 10, 160)),
        ...choose(rng, `${rayon} cm`, [`${2 * rayon} cm`, `${4 * rayon} cm`, `${rayon + 2} cm`, `${rayon - 1} cm`, `${rayon + 1} cm`].filter((texte) => !texte.startsWith('0 '))),
        explanation: `Le rayon est la moitié du diamètre : ${2 * rayon} ÷ 2 = ${rayon} cm.`,
      };
    }
    // Un diamètre [AB], un rayon [OC] et un segment qui ne passe pas par le centre.
    const [a, b, c, d, e] = lettresDistinctes(rng, 5);
    const alpha = rngInt(rng, 0, 179);
    const cote = rngPick(rng, [1, -1]);
    const gamma = alpha + cote * rngInt(rng, 60, 120);
    const delta = alpha + 180 + cote * rngInt(rng, 25, 35);
    const epsilon = delta + cote * rngInt(rng, 80, 100);
    const demande = rngPick(rng, ['diamètre', 'rayon'] as const);
    const noms = [segmentNomme(a, b), segmentNomme('O', c), segmentNomme(d, e)];
    const figure: Figure = {
      width: FIGURE_WIDTH,
      height: FIGURE_HEIGHT,
      shapes: [
        { kind: 'circle', center: CERCLE.centre, radius: CERCLE.rayon },
        { kind: 'segment', from: surLeCercle(alpha), to: surLeCercle(alpha + 180), width: 2.5 },
        { kind: 'segment', from: CERCLE.centre, to: surLeCercle(gamma), width: 2.5 },
        { kind: 'segment', from: surLeCercle(delta), to: surLeCercle(epsilon), width: 2.5 },
        { kind: 'point', at: CERCLE.centre },
        { kind: 'text', at: [CERCLE.centre[0] + 2, CERCLE.centre[1] + 20], text: 'O', anchor: 'middle', bold: true, size: 14, halo: true },
        ...pointDuCercle(alpha, a),
        ...pointDuCercle(alpha + 180, b),
        ...pointDuCercle(gamma, c),
        ...pointDuCercle(delta, d),
        ...pointDuCercle(epsilon, e),
      ],
      alt: `Un cercle de centre O et trois segments : ${noms.join(', ')}.`,
    };
    const choix = [...noms].sort();
    return {
      detail: `segments-${demande}-${noms.join('')}-${alpha}-${gamma}`,
      instruction: 'Le point O est le centre du cercle',
      prompt: `Quel segment est un ${demande} du cercle ?`,
      figure,
      choices: choix,
      correctIndex: choix.indexOf(demande === 'diamètre' ? noms[0] : noms[1]),
      explanation:
        demande === 'diamètre'
          ? `${noms[0]} relie deux points du cercle en passant par le centre : c'est un diamètre.`
          : `${noms[1]} relie le centre à un point du cercle : c'est un rayon.`,
    };
  },
};

const losangeCE2: Family = {
  name: 'losange',
  minStage: -1,
  make: (rng) => {
    const [a, b, c, d] = lettresConsecutives(rng, 4);
    const nom = `${a}${b}${c}${d}`;
    const cote = rngInt(rng, 3, 12);
    const [de, vers] = rngPick(rng, [[b, c], [c, d], [d, a]] as [string, string][]);
    return {
      detail: `${nom}-${cote}-${de}${vers}`,
      instruction: 'Un losange a quatre côtés de même longueur',
      prompt: `Le losange ${nom} a un côté ${segmentNomme(a, b)} de ${cote} cm. Combien mesure ${segmentNomme(de, vers)} ?`,
      figure: polygoneNomme(rotate(rhombus(rngPick(rng, [55, 60, 65])), rngPick(rng, [0, 0, -15, 20])), [a, b, c, d], () => [], `Un losange ${nom}.`),
      ...choose(rng, `${cote} cm`, [`${cote + 1} cm`, `${cote - 1} cm`, `${cote * 2} cm`, `${cote * 4} cm`, `${cote + 2} cm`]),
      explanation: 'Un losange a quatre côtés de même longueur.',
    };
  },
};

const FIGURES_A_AXES: { n: number; points: () => Point[]; axes: number; pourquoi: string }[] = [
  { n: 4, points: square, axes: 4, pourquoi: 'Un carré a quatre axes de symétrie.' },
  { n: 4, points: () => rectangle(1.7), axes: 2, pourquoi: 'Un rectangle a deux axes de symétrie.' },
  { n: 4, points: () => rhombus(60), axes: 2, pourquoi: 'Un losange a deux axes de symétrie.' },
  { n: 3, points: equilateralTriangle, axes: 3, pourquoi: 'Un triangle équilatéral a trois axes de symétrie.' },
  { n: 3, points: () => isoscelesTriangle(45), axes: 1, pourquoi: 'Un triangle isocèle a un axe de symétrie.' },
  { n: 3, points: scaleneTriangle, axes: 0, pourquoi: 'Un triangle quelconque n\'a aucun axe de symétrie.' },
];

const axesDeSymetrie: Family = {
  name: 'axes-symetrie',
  minStage: -1,
  make: (rng) => {
    const forme = rngPick(rng, FIGURES_A_AXES);
    const lettres = lettresConsecutives(rng, forme.n);
    const nom = lettres.join('');
    return {
      detail: `${nom}-${forme.axes}-${forme.n}-${rngInt(rng, 0, 9)}`,
      instruction: 'Un axe partage la figure en deux moitiés qui se superposent',
      prompt: `Combien d'axes de symétrie a la figure ${nom} ?`,
      figure: polygoneNomme(rotate(forme.points(), rngPick(rng, [0, 0, 15, -20])), lettres, () => [], `Une figure à plusieurs côtés, dont les sommets sont nommés ${lettres.join(', ')}.`),
      ...choose(rng, String(forme.axes), ['0', '1', '2', '3', '4']),
      explanation: forme.pourquoi,
    };
  },
};

const construireSymetrie = reprendre('construire-symetrie', -1, 'construire-symetrie-ce2', 3);

const COMPTES_DES_SOLIDES: { solide: 'cube' | 'pave'; faces: number; aretes: number; sommets: number }[] = [
  { solide: 'cube', faces: 6, aretes: 12, sommets: 8 },
  { solide: 'pave', faces: 6, aretes: 12, sommets: 8 },
];

const solidesDuCE2: Family = {
  name: 'solides-ce2',
  minStage: -1,
  make: (rng) => {
    if (rng() < 0.7) {
      const fiche = rngPick(rng, COMPTES_DES_SOLIDES);
      const quoi = rngPick(rng, ['faces', 'aretes', 'sommets'] as const);
      const mot = { faces: 'de faces', aretes: 'd\'arêtes', sommets: 'de sommets' }[quoi];
      return {
        detail: `${fiche.solide}-${quoi}`,
        instruction: 'Pense aussi à ce qui est caché',
        prompt: `Combien ${mot} ${fiche.solide === 'cube' ? 'ce cube' : 'ce pavé droit'} a-t-il ?`,
        figure: solideFigure(fiche.solide),
        ...choose(rng, String(fiche[quoi]), [4, 5, 6, 8, 9, 10, 12].map(String)),
        explanation: `${NOM_DU_SOLIDE[fiche.solide].charAt(0).toUpperCase()}${NOM_DU_SOLIDE[fiche.solide].slice(1)} a ${fiche.faces} faces, ${fiche.aretes} arêtes et ${fiche.sommets} sommets.`,
      };
    }
    const [solide, bonne, pourquoi] = rngPick(rng, [
      ['un cube', 'des carrés', 'Les six faces d\'un cube sont des carrés.'],
      ['un pavé droit', 'des rectangles', 'Les faces d\'un pavé droit sont des rectangles.'],
    ] as [string, string, string][]);
    return {
      detail: `faces-${solide}`,
      instruction: 'Pense aux faces du solide',
      prompt: `Quelle est la forme des faces d'${solide} ?`,
      ...choose(rng, bonne, ['des triangles', 'des cercles', 'des hexagones', 'des losanges']),
      explanation: pourquoi,
    };
  },
};

const patronDuCube: Family = {
  name: 'patron-cube',
  minStage: -1,
  make: (rng) => {
    const bon = rngPick(rng, PATRONS_DU_CUBE);
    const faux = rngShuffle(rng, PAS_DES_PATRONS).slice(0, 3);
    const ordre = rngShuffle(rng, [bon, ...faux]);
    const lettre = LETTRES_DES_CASES[ordre.indexOf(bon)];
    return {
      detail: `${lettre}-${PATRONS_DU_CUBE.indexOf(bon)}-${faux.map((patron) => PAS_DES_PATRONS.indexOf(patron)).join('')}`,
      instruction: 'Imagine que tu plies les carrés',
      prompt: 'Lequel de ces dessins est un patron de cube ?',
      figure: netsFigure(ordre),
      choices: [...LETTRES_DES_CASES],
      correctIndex: LETTRES_DES_CASES.indexOf(lettre),
      explanation: `Le dessin ${lettre}, une fois plié, forme un cube.`,
    };
  },
};

const perimetreCarreRectangle: Family = {
  name: 'perimetre-carre-rectangle',
  minStage: -1,
  make: (rng) => {
    const [a, b, c, d] = lettresConsecutives(rng, 4);
    if (rng() < 0.4) {
      const cote = rngInt(rng, 2, 12);
      return {
        detail: `carre-${cote}`,
        instruction: 'Un carré a quatre côtés de même longueur',
        prompt: `Un carré a un côté de ${cote} cm. Quel est son périmètre ?`,
        figure: polygoneNomme(
          [[0, 0], [100, 0], [100, 100], [0, 100]],
          [a, b, c, d],
          (sommets, centre) => [...sommets.map((_, index) => angleDroit(sommets, index)), longueurSurLeCote(sommets[0], sommets[1], centre, `${cote} cm`)],
          'Un carré dont un côté porte sa longueur.',
          52
        ),
        // Pour un carré de 4 cm, l'aire égale le périmètre : d'autres pièges prennent le relais.
        ...choose(rng, `${4 * cote} cm`, [`${cote * cote} cm`, `${2 * cote} cm`, `${3 * cote} cm`, `${cote + 4} cm`, `${4 * cote + 2} cm`]),
        explanation: `Il a quatre côtés égaux : 4 × ${cote} = ${4 * cote} cm.`,
      };
    }
    const longueur = rngInt(rng, 4, 12);
    const largeur = rngInt(rng, 2, longueur - 1);
    const perimetre = 2 * (longueur + largeur);
    return {
      detail: `rectangle-${longueur}-${largeur}`,
      instruction: 'Les côtés opposés d\'un rectangle sont égaux',
      prompt: `Un rectangle mesure ${longueur} cm de long et ${largeur} cm de large. Quel est son périmètre ?`,
      figure: polygoneNomme(
        [[0, 0], [longueur, 0], [longueur, largeur], [0, largeur]],
        [a, b, c, d],
        (sommets, centre) => [
          ...sommets.map((_, index) => angleDroit(sommets, index)),
          longueurSurLeCote(sommets[0], sommets[1], centre, `${longueur} cm`),
          longueurSurLeCote(sommets[1], sommets[2], centre, `${largeur} cm`),
        ],
        'Un rectangle dont deux côtés portent leur longueur.',
        52
      ),
      ...choose(rng, `${perimetre} cm`, [`${longueur * largeur} cm`, `${longueur + largeur} cm`, `${2 * longueur + largeur} cm`, `${longueur + 2 * largeur} cm`, `${perimetre + 2} cm`]),
      explanation: `${longueur} + ${largeur} + ${longueur} + ${largeur} = ${perimetre} cm.`,
    };
  },
};

// === CE2, 3e trimestre ======================================================================

/** Des carreaux : trois figures dont les aires diffèrent, nommées A, B, C. */
const airesParRecouvrement: Family = {
  name: 'aires-recouvrement',
  minStage: 0,
  make: (rng) => {
    // Trois nombres de carreaux bien différents : on compare en comptant.
    let tailles: number[] = [];
    while (tailles.length < 3) {
      const candidate = rngInt(rng, 4, 11);
      if (tailles.every((autre) => autre !== candidate)) tailles = [...tailles, candidate];
    }
    const figures = tailles.map((taille) => polyomino(rng, taille, CARREAUX.colonnes, CARREAUX.lignes));
    const question = rngInt(rng, 0, 2);
    const figure = carreauxParTrois(figures);
    if (question === 2) {
      const index = rngInt(rng, 0, 2);
      return {
        detail: `compter-${LETTRES_DES_CASES[index]}-${condenser(JSON.stringify(figures))}`,
        instruction: 'L\'unité d\'aire est le carreau',
        prompt: `Combien de carreaux recouvre la figure ${LETTRES_DES_CASES[index]} ?`,
        figure,
        ...choose(rng, String(tailles[index]), [tailles[index] + 1, tailles[index] - 1, tailles[index] + 2, tailles[index] - 2].map(String)),
        explanation: `On compte les carreaux de la figure ${LETTRES_DES_CASES[index]} : ${tailles[index]}.`,
      };
    }
    const plusGrande = question === 0;
    const cible = plusGrande ? Math.max(...tailles) : Math.min(...tailles);
    const index = tailles.indexOf(cible);
    return {
      detail: `${plusGrande ? 'grande' : 'petite'}-${condenser(JSON.stringify(figures))}`,
      instruction: 'Compte les carreaux de chaque figure',
      prompt: `Quelle figure a la plus ${plusGrande ? 'grande' : 'petite'} aire ?`,
      figure,
      choices: LETTRES_DES_CASES.slice(0, 3),
      correctIndex: index,
      explanation: `La figure ${LETTRES_DES_CASES[index]} recouvre ${cible} carreaux : c'est la plus ${plusGrande ? 'grande' : 'petite'}.`,
    };
  },
};

export const FAMILLES_CYCLE2: Family[] = [
  // CE1, 1er trimestre
  formesPlanes,
  sommetsEtCotes,
  angleDroitALEquerre,
  pointsAlignes,
  solidesDuCE1,
  repereCase,
  reprendre('construire-case', -5, 'repere-construire-case', 1),
  // CE1, 2e trimestre
  cotesEgaux,
  reprendre('construire-reproduire', -4, 'reproduire-figure', 1),
  regleLire,
  tracerSegment,
  // CE1, 3e trimestre
  regleDepart,
  deplacements,
  // CE2, 1er trimestre
  perimetrePolygone,
  regleMillimetres,
  milieuChoix,
  construireMilieu,
  triangleRectangle,
  // CE2, 2e trimestre
  cercleCE2,
  losangeCE2,
  axesDeSymetrie,
  construireSymetrie,
  solidesDuCE2,
  patronDuCube,
  perimetreCarreRectangle,
  // CE2, 3e trimestre
  deplacementsEnBoucle,
  airesParRecouvrement,
];
