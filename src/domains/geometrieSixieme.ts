import type { Figure, Point, Shape } from '../lib/figures';
import { polar, round } from '../lib/figures';
import type { Construction, Node } from '../lib/construction';
import { directionAnswer, lineAcrossGrid, nodePoint } from '../lib/construction';
import { rngInt, rngPick, rngShuffle } from '../lib/seededRandom';
import { choose, NO_CHOICES, type Family } from './geometrieCommun';
import { BUILD_GRID } from './geometrieConstructions';
import {
  angleDroit,
  circleFigure,
  codageCotes,
  equilateralTriangle,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  irregularPolygon,
  isoscelesTriangle,
  isoscelesTrapezoid,
  kite,
  netsFigure,
  parallelogram,
  rectangle,
  regularPolygon,
  rhombus,
  rotate,
  scaleneTriangle,
  square,
} from './geometrieFigures';
import {
  angleNomme,
  cercleEtSegments,
  condenser,
  droitesSecantes,
  etiquette,
  etiquetteDansLeCadre,
  lettresConsecutives,
  lettresDistinctes,
  longueurSurLeCote,
  PATRONS_DU_CUBE,
  PAS_DES_PATRONS,
  polygoneNomme,
  rapporteurFigure,
  reprendre,
  LETTRES_DES_CASES,
  segmentNomme,
} from './geometrieDessins';
import { QUESTION_FAMILIES } from './geometrieQuestions';

/**
 * La géométrie de la 6e (programme de mathématiques du cycle 3, 2025,
 * « Espace et géométrie » et « Grandeurs et mesures »).
 *
 * Les élèves de 6e ont fait leur CM2 sous l'ancien programme : le 1er
 * trimestre reprend ce qu'ils savent (cercle, perpendiculaires et
 * parallèles, périmètres, angle aigu, droit ou obtus), le nouveau arrive
 * ensuite.
 * - 1er trimestre : milieu et distance ; cercle, disque, rayon, diamètre,
 *   corde ; périmètre du carré, du rectangle et des polygones, en nombres
 *   décimaux ; droites parallèles et perpendiculaires, et ce qu'on en
 *   déduit ; angle aigu, droit, obtus ;
 * - 2e trimestre : mesurer un angle au rapporteur ; angles opposés par le
 *   sommet, angle plat, angles supplémentaires ; axes de symétrie, symétrique
 *   d'un point, compléter une figure par symétrie ; aire du rectangle et du
 *   carré, conversions m², dm², cm² ;
 * - 3e trimestre : médiatrice d'un segment (propriété et construction) ;
 *   bissectrice d'un angle ; angles d'un triangle (somme, rectangle,
 *   isocèle, équilatéral) ; patron du cube.
 *
 * Hors programme, donc absent : le théorème de Pythagore, la trigonométrie,
 * les coordonnées, l'aire du disque et du triangle, le périmètre du cercle
 * par la formule.
 */

/** 3,5 · 12 · 4,25 : un nombre écrit à la française. */
const virgule = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Les tailles d'angle proposées : entières, jamais nulles, jamais plates. */
const degres = (valeurs: number[]) => valeurs.filter((valeur) => Number.isInteger(valeur) && valeur > 0 && valeur < 180).map((valeur) => `${valeur}°`);

// === 1er trimestre ============================================================================

/** A, I et B alignés, les deux moitiés codées pareil. */
function segmentAvecMilieu(a: string, i: string, b: string, inclinaison: number): Figure {
  const centre: Point = [150, 100];
  const [debut, fin] = [round(polar(centre, 105, inclinaison + 180)), round(polar(centre, 105, inclinaison))];
  const milieu = round(centre);
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: [
      { kind: 'segment', from: debut, to: fin, width: 3 },
      { kind: 'codage', from: debut, to: milieu, count: 1, ink: 'couleur' },
      { kind: 'codage', from: milieu, to: fin, count: 1, ink: 'couleur' },
      ...[debut, milieu, fin].map((point): Shape => ({ kind: 'point', at: point })),
      etiquette(debut, milieu, a, 16),
      etiquette(fin, milieu, b, 16),
      { kind: 'text', at: [milieu[0], milieu[1] - 13], text: i, anchor: 'middle', bold: true, size: 14, halo: true },
    ],
    alt: `Un segment ${segmentNomme(a, b)} dont le point ${i} est le milieu.`,
  };
}

const milieuEtDistance: Family = {
  name: 'milieu-distance',
  minStage: 7,
  make: (rng) => {
    const [a, b, i] = lettresDistinctes(rng, 3);
    const inclinaison = rngPick(rng, [0, 8, -8, 15, -15]);
    const variante = rngInt(rng, 0, 2);
    const total = rngInt(rng, 3, 24);
    const moitie = total / 2;
    const figure = segmentAvecMilieu(a, i, b, inclinaison);
    const cm = (valeur: number) => `${virgule(valeur)} cm`;
    if (variante === 0 || variante === 2) {
      const [de, vers] = variante === 0 ? [a, i] : [i, b];
      return {
        detail: `moitie-${a}${i}${b}-${total}-${de}${vers}`,
        instruction: 'Le milieu partage le segment en deux parties égales',
        prompt: `Le point ${i} est le milieu du segment ${segmentNomme(a, b)}. ${a}${b} = ${total} cm. Combien mesure ${segmentNomme(de, vers)} ?`,
        figure,
        // Le segment entier, son double, une demi-unité d'écart.
        ...choose(rng, cm(moitie), [cm(total), cm(total * 2), cm(moitie + 1), cm(moitie - 1), cm(moitie + 0.5), cm(total - 1)].filter((texte) => !texte.startsWith('0 ') && !texte.startsWith('-'))),
        explanation: `${i} est le milieu : ${total} ÷ 2 = ${virgule(moitie)}.`,
      };
    }
    // La moitié est donnée : un décimal à une décimale, au plus.
    const donnee = rngInt(rng, 3, 25) / 2;
    return {
      detail: `entier-${a}${i}${b}-${donnee}`,
      instruction: 'Le milieu partage le segment en deux parties égales',
      prompt: `Le point ${i} est le milieu de ${segmentNomme(a, b)}. ${a}${i} = ${virgule(donnee)} cm. Combien mesure ${segmentNomme(a, b)} ?`,
      figure,
      ...choose(rng, cm(donnee * 2), [cm(donnee), cm(donnee * 4), cm(donnee * 2 + 1), cm(donnee * 2 - 1), cm(donnee + 2)]),
      explanation: `${a}${b} = 2 × ${a}${i} = 2 × ${virgule(donnee)} = ${virgule(donnee * 2)}.`,
    };
  },
};

const DEFINITIONS_DU_CERCLE: { prompt: string; bonne: string; fausses: string[]; pourquoi: string }[] = [
  {
    prompt: 'Comment s\'appelle le segment qui relie le centre d\'un cercle à un point du cercle ?',
    bonne: 'un rayon',
    fausses: ['un diamètre', 'une corde', 'un disque'],
    pourquoi: 'Un segment du centre à un point du cercle est un rayon.',
  },
  {
    prompt: 'Un segment relie deux points d\'un cercle sans passer par le centre. Comment s\'appelle-t-il ?',
    bonne: 'une corde',
    fausses: ['un rayon', 'un diamètre', 'un disque'],
    pourquoi: 'Il relie deux points du cercle sans passer par le centre : c\'est une corde.',
  },
  {
    prompt: 'Quelle est la plus longue corde d\'un cercle ?',
    bonne: 'le diamètre',
    fausses: ['le rayon', 'la moitié du rayon', 'le centre'],
    pourquoi: 'Le diamètre est la plus longue des cordes : il passe par le centre.',
  },
  {
    prompt: 'Tous les points d\'un cercle sont à la même distance de quoi ?',
    bonne: 'de son centre',
    fausses: ['de son diamètre', 'de sa corde', 'de son disque'],
    pourquoi: 'Chaque point du cercle est à la même distance du centre : le rayon.',
  },
  {
    prompt: 'Comment s\'appelle la surface à l\'intérieur d\'un cercle, bord compris ?',
    bonne: 'un disque',
    fausses: ['un rayon', 'un diamètre', 'une corde'],
    pourquoi: 'La surface limitée par un cercle est un disque.',
  },
];

const cercle6e: Family = {
  name: 'cercle-6e',
  minStage: 7,
  make: (rng) => {
    const variante = rngPick(rng, [0, 0, 1, 1, 2]);
    if (variante === 0) {
      const versLeDiametre = rng() < 0.5;
      const objet = rngPick(rng, ['cercle', 'disque']);
      if (versLeDiametre) {
        const rayon = rngInt(rng, 2, 30) / 2;
        return {
          detail: `diametre-${objet}-${rayon}`,
          instruction: 'Le diamètre est le double du rayon',
          prompt: `Le rayon d'un ${objet} mesure ${virgule(rayon)} cm. Quel est son diamètre ?`,
          figure: circleFigure('rayon', rngInt(rng, 10, 160)),
          ...choose(rng, `${virgule(rayon * 2)} cm`, [`${virgule(rayon)} cm`, `${virgule(rayon * 4)} cm`, `${virgule(rayon * 2 + 1)} cm`, `${virgule(rayon / 2)} cm`, `${virgule(rayon + 2)} cm`]),
          explanation: `${virgule(rayon)} × 2 = ${virgule(rayon * 2)}.`,
        };
      }
      const diametre = rngInt(rng, 3, 30);
      return {
        detail: `rayon-${objet}-${diametre}`,
        instruction: 'Le rayon est la moitié du diamètre',
        prompt: `Un ${objet} a un diamètre de ${diametre} cm. Quel est son rayon ?`,
        figure: circleFigure('diametre', rngInt(rng, 10, 160)),
        ...choose(rng, `${virgule(diametre / 2)} cm`, [`${diametre} cm`, `${diametre * 2} cm`, `${virgule(diametre / 2 + 1)} cm`, `${virgule(diametre / 4)} cm`, `${virgule(diametre / 2 - 1)} cm`]),
        explanation: `${diametre} ÷ 2 = ${virgule(diametre / 2)}.`,
      };
    }
    if (variante === 1) {
      const cercle = cercleEtSegments(rng);
      const demande = rngPick(rng, ['diamètre', 'rayon', 'corde'] as const);
      const noms = [cercle.diametre, cercle.rayon, cercle.corde];
      const choix = [...noms].sort();
      const bonne = demande === 'diamètre' ? cercle.diametre : demande === 'rayon' ? cercle.rayon : cercle.corde;
      return {
        detail: `segments-${demande}-${noms.join('')}-${condenser(JSON.stringify(cercle.figure.shapes))}`,
        instruction: 'Le point O est le centre du cercle',
        prompt: demande === 'corde' ? 'Quel segment est une corde qui n\'est pas un diamètre ?' : `Quel segment est un ${demande} du cercle ?`,
        figure: cercle.figure,
        choices: choix,
        correctIndex: choix.indexOf(bonne),
        explanation:
          demande === 'diamètre'
            ? `${bonne} relie deux points du cercle en passant par le centre O.`
            : demande === 'rayon'
              ? `${bonne} relie le centre O à un point du cercle.`
              : `${bonne} relie deux points du cercle sans passer par le centre.`,
      };
    }
    const definition = rngPick(rng, DEFINITIONS_DU_CERCLE);
    return {
      detail: `definition-${definition.bonne}`,
      prompt: definition.prompt,
      ...choose(rng, definition.bonne, definition.fausses),
      explanation: definition.pourquoi,
    };
  },
};

/** Un nombre qui s'écrit avec deux décimales au plus : 3,375 ne se propose pas. */
const deuxDecimalesAuPlus = (x: number) => x > 0 && Math.abs(x * 100 - Math.round(x * 100)) < 1e-6;

/** Des longueurs en dixièmes de centimètre, écrites en centimètres : 75 → « 7,5 ». */
const dixiemes = (valeur: number) => virgule(valeur / 10);

const perimetre6e: Family = {
  name: 'perimetre-6e',
  minStage: 7,
  make: (rng) => {
    const variante = rngInt(rng, 0, 3);
    const cm = (valeur: number) => `${dixiemes(valeur)} cm`;
    if (variante === 0) {
      const [a, b, c, d] = lettresConsecutives(rng, 4);
      const longueur = rngInt(rng, 40, 150);
      const largeur = rngInt(rng, 20, longueur - 10);
      const perimetre = 2 * (longueur + largeur);
      return {
        detail: `rectangle-${a}${b}${c}${d}-${longueur}-${largeur}`,
        instruction: 'Le périmètre est la longueur du tour de la figure',
        prompt: `Un rectangle ${a}${b}${c}${d} mesure ${dixiemes(longueur)} cm de long et ${dixiemes(largeur)} cm de large. Quel est son périmètre ?`,
        figure: polygoneNomme(
          [[0, 0], [longueur, 0], [longueur, largeur], [0, largeur]],
          [a, b, c, d],
          (sommets, centre) => [
            ...sommets.map((_, index) => angleDroit(sommets, index)),
            longueurSurLeCote(sommets[0], sommets[1], centre, cm(longueur)),
            longueurSurLeCote(sommets[1], sommets[2], centre, cm(largeur)),
          ],
          `Un rectangle ${a}${b}${c}${d} dont deux côtés portent leur longueur.`,
          54
        ),
        // L'aire, le demi-périmètre, un côté oublié.
        ...choose(rng, cm(perimetre), [cm((longueur * largeur) / 10), cm(longueur + largeur), cm(2 * longueur + largeur), cm(longueur + 2 * largeur), cm(perimetre + 10), cm(perimetre - 10)]),
        explanation: `2 × (${dixiemes(longueur)} + ${dixiemes(largeur)}) = ${dixiemes(perimetre)} cm.`,
      };
    }
    if (variante === 1) {
      const [a, b, c, d] = lettresConsecutives(rng, 4);
      const cote = rngInt(rng, 20, 120);
      return {
        detail: `carre-${a}${b}${c}${d}-${cote}`,
        instruction: 'Un carré a quatre côtés de même longueur',
        prompt: `Un carré ${a}${b}${c}${d} a un côté de ${dixiemes(cote)} cm. Quel est son périmètre ?`,
        figure: polygoneNomme(
          [[0, 0], [100, 0], [100, 100], [0, 100]],
          [a, b, c, d],
          (sommets, centre) => [...sommets.map((_, index) => angleDroit(sommets, index)), longueurSurLeCote(sommets[0], sommets[1], centre, cm(cote))],
          `Un carré ${a}${b}${c}${d} dont un côté porte sa longueur.`,
          54
        ),
        ...choose(rng, cm(4 * cote), [cm((cote * cote) / 10), cm(2 * cote), cm(3 * cote), cm(cote + 40), cm(4 * cote + 10)]),
        explanation: `4 × ${dixiemes(cote)} = ${dixiemes(4 * cote)} cm.`,
      };
    }
    if (variante === 2) {
      const [nom, cotes] = rngPick(rng, [['un triangle équilatéral', 3], ['un pentagone régulier', 5], ['un hexagone régulier', 6], ['un octogone régulier', 8]] as [string, number][]);
      const cote = rngInt(rng, 15, 95);
      return {
        detail: `regulier-${cotes}-${cote}`,
        instruction: 'Un polygone régulier a tous ses côtés égaux',
        prompt: `${nom.charAt(0).toUpperCase()}${nom.slice(1)} a un côté de ${dixiemes(cote)} cm. Quel est son périmètre ?`,
        ...choose(rng, cm(cotes * cote), [cm((cotes - 1) * cote), cm((cotes + 1) * cote), cm(cote + cotes * 10), cm(cotes * cote + 10), cm(2 * cote)]),
        explanation: `${cotes} côtés égaux : ${cotes} × ${dixiemes(cote)} = ${dixiemes(cotes * cote)} cm.`,
      };
    }
    const n = rngPick(rng, [4, 5, 6]);
    const lettres = lettresConsecutives(rng, n);
    const nom = lettres.join('');
    const longueurs = Array.from({ length: n }, () => rngInt(rng, 15, 95));
    const total = longueurs.reduce((somme, valeur) => somme + valeur, 0);
    return {
      detail: `polygone-${nom}-${longueurs.join('.')}`,
      instruction: 'Ajoute les longueurs de tous les côtés',
      prompt: `Quel est le périmètre du polygone ${nom} ?`,
      figure: polygoneNomme(
        irregularPolygon(n, rng),
        lettres,
        (sommets, centre) => sommets.map((sommet, index) => longueurSurLeCote(sommet, sommets[(index + 1) % n], centre, cm(longueurs[index]))),
        `Un polygone ${nom} dont chaque côté porte sa longueur en centimètres.`,
        44
      ),
      ...choose(rng, cm(total), [cm(total - Math.min(...longueurs)), cm(total + Math.max(...longueurs)), cm(total + 10), cm(total - 10), cm(total + 1)]),
      explanation: `On ajoute tous les côtés : ${longueurs.map(dixiemes).join(' + ')} = ${dixiemes(total)} cm.`,
    };
  },
};

const droitesNommees = QUESTION_FAMILIES.find((famille) => famille.name === 'droites-nommees');
if (!droitesNommees) throw new Error('La famille « droites-nommees » a disparu.');

const DROITES = (rng: () => number) => {
  const lettres = lettresDistinctes(rng, 6);
  return [`(${lettres[0]}${lettres[1]})`, `(${lettres[2]}${lettres[3]})`, `(${lettres[4]}${lettres[5]})`] as const;
};

const PERPENDICULAIRES_ET_PARALLELES: { enonce: (d: readonly [string, string, string]) => string; bonne: string; pourquoi: string }[] = [
  {
    enonce: ([d1, d2, d3]) => `Les droites ${d1} et ${d2} sont parallèles. La droite ${d3} est perpendiculaire à ${d1}. Que peut-on dire de ${d3} et ${d2} ?`,
    bonne: 'Elles sont perpendiculaires.',
    pourquoi: 'Une perpendiculaire à l\'une de deux droites parallèles l\'est aussi à l\'autre.',
  },
  {
    enonce: ([d1, d2, d3]) => `Les droites ${d1} et ${d2} sont perpendiculaires à la droite ${d3}. Que peut-on dire de ${d1} et ${d2} ?`,
    bonne: 'Elles sont parallèles.',
    pourquoi: 'Deux droites perpendiculaires à une même droite sont parallèles.',
  },
  {
    enonce: ([d1, d2, d3]) => `Les droites ${d1} et ${d2} sont parallèles. Les droites ${d2} et ${d3} sont parallèles. Que peut-on dire de ${d1} et ${d3} ?`,
    bonne: 'Elles sont parallèles.',
    pourquoi: 'Deux droites parallèles à une même troisième sont parallèles entre elles.',
  },
];

const proprietesDesDroites: Family = {
  name: 'proprietes-droites',
  minStage: 7,
  make: (rng) => {
    const droites = DROITES(rng);
    const fiche = rngPick(rng, PERPENDICULAIRES_ET_PARALLELES);
    return {
      detail: `${droites.join('')}-${PERPENDICULAIRES_ET_PARALLELES.indexOf(fiche)}`,
      instruction: 'Fais un petit dessin si tu veux',
      prompt: fiche.enonce(droites),
      ...choose(rng, fiche.bonne, ['Elles sont parallèles.', 'Elles sont perpendiculaires.', 'Elles sont confondues.', 'On ne peut rien dire.']),
      explanation: fiche.pourquoi,
    };
  },
};

const angleAigu: Family = {
  name: 'angle-type',
  minStage: 7,
  make: (rng) => {
    const [a, b, c] = lettresConsecutives(rng, 3);
    const genre = rngPick(rng, ['aigu', 'droit', 'obtus'] as const);
    const taille = genre === 'aigu' ? rngInt(rng, 25, 75) : genre === 'droit' ? 90 : rngInt(rng, 105, 160);
    const rotation = rngInt(rng, 0, 359);
    return {
      detail: `${a}${b}${c}-${genre}-${taille}-${rotation}`,
      instruction: 'Compare-le à l\'angle droit de ton équerre',
      prompt: `L'angle ${a}${b}${c} est-il aigu, droit ou obtus ?`,
      figure: angleNomme(taille, rotation, [a, b, c]),
      ...choose(rng, genre, ['aigu', 'droit', 'obtus'], 3),
      explanation:
        genre === 'aigu'
          ? 'Il est plus petit qu\'un angle droit : il est aigu.'
          : genre === 'droit'
            ? 'Il va exactement dans le coin de l\'équerre : il est droit.'
            : 'Il est plus grand qu\'un angle droit : il est obtus.',
    };
  },
};

// === 2e trimestre =============================================================================

const angleAuRapporteur: Family = {
  name: 'angle-rapporteur',
  minStage: 8,
  make: (rng) => {
    const [a, b, c] = lettresConsecutives(rng, 3);
    const mesure = rngInt(rng, 4, 32) * 5;
    return {
      detail: `${a}${b}${c}-${mesure}`,
      instruction: 'Lis la graduation où le bras passe, en partant de 0',
      prompt: `Combien mesure l'angle ${a}${b}${c} ?`,
      figure: rapporteurFigure(mesure, [a, b, c]),
      // L'autre graduation (180 − mesure), une dizaine ou une demi-dizaine d'écart, l'angle droit moins la mesure.
      ...choose(rng, `${mesure}°`, degres([180 - mesure, mesure + 10, mesure - 10, mesure + 5, mesure - 5, 90 - mesure, mesure + 20])),
      explanation: `Le bras passe sur la graduation ${mesure} : l'angle mesure ${mesure}°.`,
    };
  },
};

const anglesEtDroites: Family = {
  name: 'angles-vocabulaire',
  minStage: 8,
  make: (rng) => {
    const [a, b, c, d] = lettresDistinctes(rng, 4);
    const alpha = rngInt(rng, 0, 179);
    const beta = rngPick(rng, [35, 40, 50, 55, 65, 70, 115, 125, 130, 145]);
    const nom = (x: string, y: string) => `${x}O${y}`;
    const detail = `${a}${b}${c}${d}-${alpha}-${beta}`;
    const figure = droitesSecantes(alpha, beta, [a, b, c, d]);
    const variante = rngInt(rng, 0, 3);
    if (variante === 0) {
      const choix = [nom(b, d), nom(c, b), nom(d, a), nom(a, b)];
      return {
        detail: `opposes-${detail}`,
        instruction: 'Deux angles opposés par le sommet ont le même sommet et sont face à face',
        prompt: `Les droites (${a}${b}) et (${c}${d}) se coupent en O. Quel angle est opposé par le sommet à l'angle ${nom(a, c)} ?`,
        figure,
        choices: [...choix].sort(),
        correctIndex: [...choix].sort().indexOf(nom(b, d)),
        explanation: `${nom(b, d)} est face à ${nom(a, c)} : ils sont opposés par le sommet.`,
      };
    }
    if (variante === 1) {
      const choix = [nom(a, b), nom(a, c), nom(c, b), nom(d, a)];
      return {
        detail: `plat-${detail}`,
        instruction: 'Un angle plat est un demi-tour : ses côtés sont alignés',
        prompt: `Les droites (${a}${b}) et (${c}${d}) se coupent en O. Quel angle est un angle plat ?`,
        figure,
        choices: [...choix].sort(),
        correctIndex: [...choix].sort().indexOf(nom(a, b)),
        explanation: `${a}, O et ${b} sont alignés : l'angle ${nom(a, b)} est plat.`,
      };
    }
    if (variante === 2) {
      return {
        detail: `egaux-${detail}`,
        instruction: 'Deux angles opposés par le sommet ont la même mesure',
        prompt: `Les droites (${a}${b}) et (${c}${d}) se coupent en O. L'angle ${nom(a, c)} mesure ${beta}°. Combien mesure l'angle ${nom(b, d)} ?`,
        figure,
        ...choose(rng, `${beta}°`, degres([180 - beta, 90 - beta, beta + 10, beta - 10, 2 * beta])),
        explanation: `${nom(a, c)} et ${nom(b, d)} sont opposés par le sommet : ils mesurent ${beta}°.`,
      };
    }
    return {
      detail: `supplementaires-${detail}`,
      instruction: 'Deux angles adjacents qui forment un angle plat font 180°',
      prompt: `Les droites (${a}${b}) et (${c}${d}) se coupent en O. L'angle ${nom(a, c)} mesure ${beta}°. Combien mesure l'angle ${nom(c, b)} ?`,
      figure,
      ...choose(rng, `${180 - beta}°`, degres([beta, 90 - beta, 90 + beta, 360 - beta, 180 - beta + 10, 180 - beta - 10])),
      explanation: `${nom(a, c)} et ${nom(c, b)} forment un angle plat : 180 − ${beta} = ${180 - beta}.`,
    };
  },
};

const FIGURES_A_AXES_6E: { n: number; points: () => Point[]; axes: number; pourquoi: string }[] = [
  { n: 4, points: square, axes: 4, pourquoi: 'Un carré a quatre axes de symétrie.' },
  { n: 4, points: () => rectangle(1.7), axes: 2, pourquoi: 'Un rectangle a deux axes de symétrie.' },
  { n: 4, points: () => rhombus(60), axes: 2, pourquoi: 'Un losange a deux axes de symétrie.' },
  { n: 4, points: () => parallelogram(70, 60), axes: 0, pourquoi: 'Un parallélogramme quelconque n\'a aucun axe de symétrie.' },
  { n: 4, points: kite, axes: 1, pourquoi: 'Un cerf-volant a un seul axe de symétrie.' },
  { n: 4, points: isoscelesTrapezoid, axes: 1, pourquoi: 'Un trapèze isocèle a un axe de symétrie.' },
  { n: 3, points: equilateralTriangle, axes: 3, pourquoi: 'Un triangle équilatéral a trois axes de symétrie.' },
  { n: 3, points: () => isoscelesTriangle(45), axes: 1, pourquoi: 'Un triangle isocèle a un axe de symétrie.' },
  { n: 3, points: scaleneTriangle, axes: 0, pourquoi: 'Un triangle quelconque n\'a aucun axe de symétrie.' },
  { n: 5, points: () => regularPolygon(5), axes: 5, pourquoi: 'Un pentagone régulier a cinq axes de symétrie.' },
  { n: 6, points: () => regularPolygon(6), axes: 6, pourquoi: 'Un hexagone régulier a six axes de symétrie.' },
];

const axesDeSymetrie6e: Family = {
  name: 'axes-symetrie-6e',
  minStage: 8,
  make: (rng) => {
    const forme = rngPick(rng, FIGURES_A_AXES_6E);
    const lettres = lettresConsecutives(rng, forme.n);
    const nom = lettres.join('');
    const rotation = rngPick(rng, [0, 0, 15, -20]);
    return {
      detail: `${nom}-${forme.axes}-${forme.n}-${rotation}`,
      instruction: 'Un axe partage la figure en deux moitiés qui se superposent par pliage',
      prompt: `Combien d'axes de symétrie a la figure ${nom} ?`,
      figure: polygoneNomme(rotate(forme.points(), rotation), lettres, () => [], `Une figure à plusieurs côtés, dont les sommets sont nommés ${lettres.join(', ')}.`),
      ...choose(rng, String(forme.axes), ['0', '1', '2', '3', '4', '5', '6']),
      explanation: forme.pourquoi,
    };
  },
};

const construireSymetrie6e = reprendre('construire-symetrie', 8, 'construire-symetrie-6e', 5);

/** Une figure de la grille des constructions, avec ce qu'on y dessine. */
function grilleDeConstruction(extra: Shape[], alt: string): Figure {
  const { origin, cols, rows, cell } = BUILD_GRID;
  return { width: 300, height: 210, shapes: [{ kind: 'quadrillage', origin, cols, rows, cell }, ...extra], alt };
}

type Axe = { nom: string; a: Node; b: Node; image: (noeud: Node) => Node; surLAxe: (noeud: Node) => boolean };

/** Les axes de symétrie de la grille : vertical, horizontal, et les deux diagonales. */
function tirerUnAxe(rng: () => number): Axe {
  const sorte = rngPick(rng, ['vertical', 'horizontal', 'montante', 'descendante']);
  if (sorte === 'vertical') {
    const k = rngInt(rng, 3, 6);
    return { nom: sorte, a: [k, 0], b: [k, 1], image: ([x, y]) => [2 * k - x, y], surLAxe: ([x]) => x === k };
  }
  if (sorte === 'horizontal') {
    const k = rngInt(rng, 2, 4);
    return { nom: sorte, a: [0, k], b: [1, k], image: ([x, y]) => [x, 2 * k - y], surLAxe: ([, y]) => y === k };
  }
  if (sorte === 'montante') {
    // La droite y = x + c : le symétrique de (x, y) est (y − c, x + c).
    const c = rngInt(rng, -1, 1);
    return { nom: sorte, a: [0, c], b: [1, c + 1], image: ([x, y]) => [y - c, x + c], surLAxe: ([x, y]) => y === x + c };
  }
  // La droite x + y = s : le symétrique de (x, y) est (s − y, s − x).
  const s = rngInt(rng, 5, 7);
  return { nom: sorte, a: [s, 0], b: [s - 1, 1], image: ([x, y]) => [s - y, s - x], surLAxe: ([x, y]) => x + y === s };
}

const construireSymetrique: Family = {
  name: 'construire-symetrique',
  minStage: 8,
  make: (rng) => {
    const [lettre] = lettresDistinctes(rng, 1);
    const grille = BUILD_GRID;
    for (let essai = 0; ; essai++) {
      const axe = tirerUnAxe(rng);
      const point: Node = [rngInt(rng, 0, grille.cols), rngInt(rng, 0, grille.rows)];
      const image = axe.image(point);
      const dansLaGrille = ([x, y]: Node) => x >= 0 && y >= 0 && x <= grille.cols && y <= grille.rows;
      const trait = lineAcrossGrid(grille, axe.a, axe.b);
      if (axe.surLAxe(point) || !dansLaGrille(image) || !trait) {
        if (essai > 400) throw new Error('Aucun symétrique ne tient dans la grille.');
        continue;
      }
      const [pa, pi] = [nodePoint(grille, point), nodePoint(grille, image)];
      const milieuDuTrait: Point = [(trait[0][0] + trait[1][0]) / 2, (trait[0][1] + trait[1][1]) / 2];
      const construction: Construction = {
        grid: grille,
        target: 'noeud',
        count: 1,
        rule: { kind: 'points', expected: [image] },
        fixed: [point],
        solution: [
          { kind: 'segment', from: pa, to: pi, ink: 'couleur', dashed: true, width: 1.5 },
          { kind: 'circle', center: pi, radius: 7, ink: 'couleur', fill: true },
        ],
      };
      return {
        detail: `${lettre}-${axe.nom}-${point.join('.')}-${axe.a.join('.')}`,
        instruction: 'Le symétrique est de l\'autre côté de l\'axe, à la même distance',
        prompt: `Place le point ${lettre}', symétrique du point ${lettre} par rapport à la droite (d).`,
        figure: grilleDeConstruction(
          [
            { kind: 'segment', from: trait[0], to: trait[1], ink: 'couleur', width: 3 },
            { kind: 'text', at: [milieuDuTrait[0] + 14, milieuDuTrait[1] - 8], text: '(d)', anchor: 'middle', bold: true, size: 14, ink: 'couleur', halo: true },
            { kind: 'point', at: pa },
            etiquetteDansLeCadre(pa, milieuDuTrait, lettre, 300, 210, 13),
          ],
          `Un quadrillage avec une droite (d) en couleur et un point ${lettre}.`
        ),
        ...NO_CHOICES,
        construction,
        explanation: `${lettre} et ${lettre}' sont à la même distance de la droite (d), de part et d'autre.`,
      };
    }
  },
};

const CONVERSIONS_D_AIRES: { de: string; vers: string; facteur: number }[] = [
  { de: 'm²', vers: 'dm²', facteur: 100 },
  { de: 'dm²', vers: 'cm²', facteur: 100 },
  { de: 'dm²', vers: 'm²', facteur: 0.01 },
  { de: 'cm²', vers: 'dm²', facteur: 0.01 },
  { de: 'm²', vers: 'cm²', facteur: 10000 },
];

const aire6e: Family = {
  name: 'aire-6e',
  minStage: 8,
  make: (rng) => {
    const variante = rngInt(rng, 0, 2);
    if (variante === 2) {
      const { de, vers, facteur } = rngPick(rng, CONVERSIONS_D_AIRES);
      // On multiplie un entier de 2 à 40 ; on divise un multiple de 50 : le résultat a deux décimales au plus.
      const valeur = facteur >= 1 ? rngInt(rng, 2, 40) : rngInt(rng, 2, 60) * 50;
      const resultat = Math.round(valeur * facteur * 100) / 100;
      const ecrit = (x: number) => virgule(x);
      // Aucune conversion, une virgule déplacée d'un cran de trop ou de moins, le facteur 10 ou 1 000 au lieu de 100.
      const fausses = [valeur, resultat * 10, resultat / 10, resultat * 100, resultat / 100, resultat * 1000].filter((x) => x > 0 && Math.abs(x * 100 - Math.round(x * 100)) < 1e-6);
      return {
        detail: `conversion-${de}-${vers}-${valeur}`,
        instruction: 'Une unité d\'aire est 100 fois plus petite que la suivante',
        prompt: `Complète : ${ecrit(valeur)} ${de} = … ${vers}`,
        ...choose(rng, ecrit(resultat), fausses.map(ecrit)),
        explanation: facteur >= 1 ? `1 ${de} = ${facteur} ${vers}, donc ${ecrit(valeur)} × ${facteur} = ${ecrit(resultat)}.` : `${ecrit(valeur)} ÷ ${virgule(1 / facteur)} = ${ecrit(resultat)}.`,
      };
    }
    const [a, b, c, d] = lettresConsecutives(rng, 4);
    if (variante === 0) {
      const longueur = rngInt(rng, 25, 120);
      const largeur = rngInt(rng, 15, longueur - 5);
      const aire = (longueur * largeur) / 100;
      const cm2 = (x: number) => `${virgule(x)} cm²`;
      return {
        detail: `rectangle-${a}${b}${c}${d}-${longueur}-${largeur}`,
        instruction: 'L\'aire se mesure en centimètres carrés (cm²)',
        prompt: `Un rectangle ${a}${b}${c}${d} mesure ${dixiemes(longueur)} cm de long et ${dixiemes(largeur)} cm de large. Quelle est son aire ?`,
        figure: polygoneNomme(
          [[0, 0], [longueur, 0], [longueur, largeur], [0, largeur]],
          [a, b, c, d],
          (sommets, centre) => [
            ...sommets.map((_, index) => angleDroit(sommets, index)),
            longueurSurLeCote(sommets[0], sommets[1], centre, `${dixiemes(longueur)} cm`),
            longueurSurLeCote(sommets[1], sommets[2], centre, `${dixiemes(largeur)} cm`),
          ],
          `Un rectangle ${a}${b}${c}${d} dont deux côtés portent leur longueur.`,
          54
        ),
        // Le périmètre, la somme des côtés, la virgule mal placée, la bonne mesure avec une unité de longueur.
        ...choose(rng, cm2(aire), [...[(2 * (longueur + largeur)) / 10, (longueur + largeur) / 10, aire * 10, aire / 10].filter(deuxDecimalesAuPlus).map(cm2), `${virgule(aire)} cm`]),
        explanation: `${dixiemes(longueur)} × ${dixiemes(largeur)} = ${virgule(aire)} cm².`,
      };
    }
    const cote = rngInt(rng, 15, 90);
    const aire = (cote * cote) / 100;
    const cm2 = (x: number) => `${virgule(x)} cm²`;
    return {
      detail: `carre-${a}${b}${c}${d}-${cote}`,
      instruction: 'L\'aire d\'un carré est son côté fois son côté',
      prompt: `Un carré ${a}${b}${c}${d} a un côté de ${dixiemes(cote)} cm. Quelle est son aire ?`,
      figure: polygoneNomme(
        [[0, 0], [100, 0], [100, 100], [0, 100]],
        [a, b, c, d],
        (sommets, centre) => [...sommets.map((_, index) => angleDroit(sommets, index)), longueurSurLeCote(sommets[0], sommets[1], centre, `${dixiemes(cote)} cm`)],
        `Un carré ${a}${b}${c}${d} dont un côté porte sa longueur.`,
        54
      ),
      ...choose(rng, cm2(aire), [...[(4 * cote) / 10, (2 * cote) / 10, aire * 10, aire / 10].filter(deuxDecimalesAuPlus).map(cm2), `${virgule(aire)} cm`]),
      explanation: `${dixiemes(cote)} × ${dixiemes(cote)} = ${virgule(aire)} cm².`,
    };
  },
};

// === 3e trimestre =============================================================================

/** Un segment horizontal [AB], sa médiatrice en pointillés et un point M dessus. */
function mediatriceFigure(a: string, b: string, m: string, hauteur: number): Figure {
  const [pa, pb, milieu, pm]: Point[] = [[50, 150], [250, 150], [150, 150], [150, 150 - hauteur]];
  return {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    shapes: [
      { kind: 'segment', from: pa, to: pb, width: 3 },
      { kind: 'segment', from: [150, 28], to: [150, 176], dashed: true, ink: 'couleur', width: 2 },
      { kind: 'angleDroit', corner: milieu, towards: [pb, pm], size: 11, ink: 'couleur' },
      { kind: 'codage', from: pa, to: milieu, count: 1, ink: 'couleur' },
      { kind: 'codage', from: milieu, to: pb, count: 1, ink: 'couleur' },
      ...[pa, pb, pm].map((point): Shape => ({ kind: 'point', at: point })),
      etiquette(pa, milieu, a, 14),
      etiquette(pb, milieu, b, 14),
      { kind: 'text', at: [pm[0] + 14, pm[1] + 5], text: m, anchor: 'middle', bold: true, size: 14, halo: true },
    ],
    alt: `Un segment ${segmentNomme(a, b)}, sa médiatrice en pointillés et un point ${m} sur cette droite.`,
  };
}

const mediatrice: Family = {
  name: 'mediatrice',
  minStage: 9,
  make: (rng) => {
    const [a, b, m] = lettresDistinctes(rng, 3);
    if (rng() < 0.65) {
      const distance = rngInt(rng, 4, 30) / 2;
      return {
        detail: `egale-${a}${b}${m}-${distance}`,
        instruction: 'Un point de la médiatrice est à égale distance des deux extrémités',
        prompt: `Le point ${m} est sur la médiatrice du segment ${segmentNomme(a, b)}. ${m}${a} = ${virgule(distance)} cm. Combien mesure ${segmentNomme(m, b)} ?`,
        figure: mediatriceFigure(a, b, m, rngInt(rng, 40, 100)),
        ...choose(rng, `${virgule(distance)} cm`, [`${virgule(distance * 2)} cm`, `${virgule(distance / 2)} cm`, `${virgule(distance + 1)} cm`, `${virgule(distance - 1)} cm`, `${virgule(distance + 0.5)} cm`].filter((texte) => !texte.startsWith('0 ') && !texte.startsWith('-'))),
        explanation: `${m} est sur la médiatrice : ${m}${b} = ${m}${a} = ${virgule(distance)} cm.`,
      };
    }
    const definition = rngPick(rng, [
      {
        prompt: `La médiatrice du segment ${segmentNomme(a, b)} est perpendiculaire à ${segmentNomme(a, b)}. Par quel point passe-t-elle ?`,
        bonne: `le milieu de ${segmentNomme(a, b)}`,
        fausses: [`le point ${a}`, `le point ${b}`, `un point quelconque de ${segmentNomme(a, b)}`],
        pourquoi: 'La médiatrice est perpendiculaire au segment et passe par son milieu.',
      },
      {
        prompt: `La droite (d) est perpendiculaire à ${segmentNomme(a, b)} et passe par son milieu. Comment s'appelle (d) ?`,
        bonne: `la médiatrice de ${segmentNomme(a, b)}`,
        fausses: [`la bissectrice de ${segmentNomme(a, b)}`, `un rayon de ${segmentNomme(a, b)}`, `la diagonale de ${segmentNomme(a, b)}`],
        pourquoi: 'Perpendiculaire à un segment, en son milieu : c\'est sa médiatrice.',
      },
    ]);
    return {
      detail: `definition-${a}${b}-${definition.bonne.slice(0, 12)}`,
      prompt: definition.prompt,
      ...choose(rng, definition.bonne, definition.fausses),
      explanation: definition.pourquoi,
    };
  },
};

const construireMediatrice: Family = {
  name: 'construire-mediatrice',
  minStage: 9,
  make: (rng) => {
    const [k, l] = lettresDistinctes(rng, 2);
    const grille = BUILD_GRID;
    for (let essai = 0; ; essai++) {
      const [dx, dy] = [rngPick(rng, [2, 4, 6, -2, -4, -6, 0]), rngPick(rng, [2, 4, -2, -4, 0])];
      const a: Node = [rngInt(rng, 0, grille.cols), rngInt(rng, 0, grille.rows)];
      const b: Node = [a[0] + dx, a[1] + dy];
      const milieu: Node = [a[0] + dx / 2, a[1] + dy / 2];
      const regle = { kind: 'direction' as const, from: milieu, along: [dx, dy] as Node, relation: 'perpendiculaire' as const };
      const reponse = (dx === 0 && dy === 0) || b[0] < 0 || b[1] < 0 || b[0] > grille.cols || b[1] > grille.rows ? null : directionAnswer(grille, regle);
      const droite = reponse ? lineAcrossGrid(grille, milieu, reponse) : null;
      if (!reponse || !droite) {
        if (essai > 500) throw new Error('Aucune médiatrice ne tient dans la grille.');
        continue;
      }
      const [pa, pb] = [nodePoint(grille, a), nodePoint(grille, b)];
      const centre: Point = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      return {
        detail: `${k}${l}-${a.join('.')}-${b.join('.')}`,
        instruction: 'La médiatrice passe par le milieu du segment, à angle droit',
        prompt: `Trace la médiatrice du segment ${segmentNomme(k, l)} : pose un point de cette droite, autre que le milieu.`,
        figure: grilleDeConstruction(
          [{ kind: 'segment', from: pa, to: pb, width: 3 }, { kind: 'point', at: pa }, { kind: 'point', at: pb }, etiquetteDansLeCadre(pa, centre, k), etiquetteDansLeCadre(pb, centre, l)],
          `Un quadrillage avec un segment ${segmentNomme(k, l)}.`
        ),
        ...NO_CHOICES,
        construction: {
          grid: grille,
          target: 'noeud',
          count: 1,
          rule: regle,
          fixed: [a, b],
          preview: { kind: 'droite', through: milieu },
          solution: [{ kind: 'segment', from: droite[0], to: droite[1], ink: 'couleur', width: 2.5, dashed: true }],
        },
        explanation: 'La médiatrice est perpendiculaire au segment et passe par son milieu.',
      };
    }
  },
};

const bissectrice: Family = {
  name: 'bissectrice',
  minStage: 9,
  make: (rng) => {
    const [a, b, c, d] = lettresConsecutives(rng, 4);
    const entier = rngInt(rng, 10, 44) * 2;
    const moitie = entier / 2;
    const rotation = rngInt(rng, 0, 359);
    const figure = angleNomme(entier, rotation, [a, b, c], d);
    const detail = `${a}${b}${c}${d}-${entier}-${rotation}`;
    if (rng() < 0.6) {
      return {
        detail: `moitie-${detail}`,
        instruction: 'La bissectrice partage l\'angle en deux angles égaux',
        prompt: `La demi-droite [${b}${d}) est la bissectrice de l'angle ${a}${b}${c}. L'angle ${a}${b}${c} mesure ${entier}°. Combien mesure l'angle ${a}${b}${d} ?`,
        figure,
        ...choose(rng, `${moitie}°`, degres([entier, moitie + 10, moitie - 10, entier / 4, 180 - entier, 90 - moitie, moitie + 5])),
        explanation: `${entier} ÷ 2 = ${moitie} : chaque angle mesure ${moitie}°.`,
      };
    }
    return {
      detail: `double-${detail}`,
      instruction: 'La bissectrice partage l\'angle en deux angles égaux',
      prompt: `La demi-droite [${b}${d}) est la bissectrice de l'angle ${a}${b}${c}. L'angle ${a}${b}${d} mesure ${moitie}°. Combien mesure l'angle ${a}${b}${c} ?`,
      figure,
      ...choose(rng, `${entier}°`, degres([moitie, entier + 10, entier - 10, entier * 2, 180 - entier, 90 - moitie])),
      explanation: `Les deux angles sont égaux : ${moitie} × 2 = ${entier}°.`,
    };
  },
};

type TriangleDAngles = 'quelconque' | 'rectangle' | 'isocele-sommet' | 'isocele-base' | 'equilateral';

/** Un triangle ABC dont on connaît les angles en A et en B : le côté [AB] est horizontal, de longueur 100. */
export function triangleDesAngles(angleA: number, angleB: number): Point[] {
  const angleC = 180 - angleA - angleB;
  const rad = (degres: number) => (degres * Math.PI) / 180;
  const ac = (100 * Math.sin(rad(angleB))) / Math.sin(rad(angleC));
  return [[0, 0], [100, 0], [ac * Math.cos(rad(angleA)), -ac * Math.sin(rad(angleA))]];
}

const anglesDeTriangle6e: Family = {
  name: 'triangle-angles',
  minStage: 9,
  make: (rng) => {
    const [a, b, c] = lettresConsecutives(rng, 3);
    const type = rngPick(rng, ['quelconque', 'quelconque', 'rectangle', 'isocele-sommet', 'isocele-base', 'equilateral'] as TriangleDAngles[]);
    let [angleA, angleB] = [60, 60];
    let enonce = '';
    let reponse = 60;
    let candidats: number[] = [];
    let pourquoi = '';
    if (type === 'quelconque') {
      [angleA, angleB] = [rngInt(rng, 30, 100), rngInt(rng, 30, 100)];
      // Un triangle quelconque : trois angles différents, dont aucun n'est droit.
      const quelconque = (x: number, y: number) => 180 - x - y >= 25 && new Set([x, y, 180 - x - y]).size === 3 && ![x, y, 180 - x - y].includes(90);
      while (!quelconque(angleA, angleB)) [angleA, angleB] = [rngInt(rng, 30, 100), rngInt(rng, 30, 100)];
      reponse = 180 - angleA - angleB;
      enonce = `Dans le triangle ${a}${b}${c}, l'angle ${a} mesure ${angleA}° et l'angle ${b} mesure ${angleB}°. Combien mesure l'angle ${c} ?`;
      candidats = [angleA + angleB, 180 - angleA, 180 - angleB, reponse + 10, reponse - 10, 90 - reponse];
      pourquoi = `La somme des angles est 180° : 180 − ${angleA} − ${angleB} = ${reponse}.`;
    } else if (type === 'rectangle') {
      angleA = 90;
      angleB = rngInt(rng, 25, 65);
      reponse = 90 - angleB;
      enonce = `Le triangle ${a}${b}${c} est rectangle en ${a}. L'angle ${b} mesure ${angleB}°. Combien mesure l'angle ${c} ?`;
      candidats = [180 - angleB, angleB, 90 + angleB, reponse + 10, reponse - 10, 180 - 90 - angleB - 10];
      pourquoi = `L'angle droit mesure 90°, et 180 − 90 − ${angleB} = ${reponse}.`;
    } else if (type === 'isocele-sommet') {
      angleA = rngInt(rng, 15, 60) * 2;
      angleB = (180 - angleA) / 2;
      reponse = angleB;
      enonce = `Le triangle ${a}${b}${c} est isocèle en ${a}. L'angle ${a} mesure ${angleA}°. Combien mesure l'angle ${b} ?`;
      candidats = [180 - angleA, angleA, (180 - angleA) / 4, reponse + 10, reponse - 10, 90 - angleA];
      pourquoi = `Les deux angles de la base sont égaux : (180 − ${angleA}) ÷ 2 = ${reponse}.`;
    } else if (type === 'isocele-base') {
      angleB = rngInt(rng, 25, 75);
      angleA = 180 - 2 * angleB;
      reponse = angleA;
      enonce = `Le triangle ${a}${b}${c} est isocèle en ${a}. L'angle ${b} mesure ${angleB}°. Combien mesure l'angle ${a} ?`;
      candidats = [180 - angleB, 90 - angleB, 2 * angleB, angleB, reponse + 10, reponse - 10];
      pourquoi = `Les angles ${b} et ${c} sont égaux : 180 − 2 × ${angleB} = ${reponse}.`;
    } else {
      enonce = `Le triangle ${a}${b}${c} est équilatéral. Combien mesure chacun de ses angles ?`;
      candidats = [90, 45, 30, 120, 180, 50];
      pourquoi = 'Trois angles égaux dont la somme est 180° : 180 ÷ 3 = 60.';
    }
    const base = triangleDesAngles(angleA, angleB);
    const rotation = rngPick(rng, [0, 0, 15, -20, 180, 200]);
    return {
      detail: `${type}-${a}${b}${c}-${angleA}-${angleB}-${rotation}`,
      instruction: 'La somme des angles d\'un triangle est égale à 180°',
      prompt: enonce,
      figure: polygoneNomme(
        rotate(base, rotation),
        [a, b, c],
        (sommets) => (type === 'rectangle' ? [angleDroit(sommets, 0)] : type === 'isocele-sommet' || type === 'isocele-base' ? codageCotes(sommets, [1, 0, 1]) : type === 'equilateral' ? codageCotes(sommets, [1, 1, 1]) : []),
        `Un triangle ${a}${b}${c}.`,
        44
      ),
      ...choose(rng, `${reponse}°`, degres(candidats)),
      explanation: pourquoi,
    };
  },
};

const patronDuCube6e: Family = {
  name: 'patron-cube-6e',
  minStage: 9,
  make: (rng) => {
    const bon = rngPick(rng, PATRONS_DU_CUBE);
    const faux = rngShuffle(rng, PAS_DES_PATRONS).slice(0, 3);
    const ordre = rngShuffle(rng, [bon, ...faux]);
    const lettre = LETTRES_DES_CASES[ordre.indexOf(bon)];
    return {
      detail: `${lettre}-${PATRONS_DU_CUBE.indexOf(bon)}-${faux.map((patron) => PAS_DES_PATRONS.indexOf(patron)).join('')}`,
      instruction: 'Imagine que tu plies les carrés pour fermer un cube',
      prompt: 'Lequel de ces dessins est un patron de cube ?',
      figure: netsFigure(ordre),
      choices: [...LETTRES_DES_CASES],
      correctIndex: LETTRES_DES_CASES.indexOf(lettre),
      explanation: `Le dessin ${lettre}, une fois plié, forme un cube : six carrés, six faces.`,
    };
  },
};

export const FAMILLES_6E: Family[] = [
  // 1er trimestre
  milieuEtDistance,
  cercle6e,
  perimetre6e,
  { name: 'droites-nommees-6e', minStage: 7, make: droitesNommees.make },
  reprendre('construire-droite', 7, 'construire-droite-6e', 5),
  proprietesDesDroites,
  angleAigu,
  // 2e trimestre
  angleAuRapporteur,
  anglesEtDroites,
  axesDeSymetrie6e,
  construireSymetrie6e,
  construireSymetrique,
  aire6e,
  // 3e trimestre
  mediatrice,
  construireMediatrice,
  bissectrice,
  anglesDeTriangle6e,
  patronDuCube6e,
];
