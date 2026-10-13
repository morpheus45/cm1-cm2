import { rngInt, rngPick, rngShuffle } from '../lib/seededRandom';
import type { Family } from './geometrieCommun';
import { lettresConsecutives, lettresDistinctes, polygoneNomme } from './geometrieDessins';
import { MESURE_DU_SECTEUR, disqueAvecRayon, parallelesEtSecante, parallelogrammeAvecHauteur, triangleAvecAngles, triangleAvecHauteur, triangleRectangle, type Secteur } from './geometrieDessinsCollege';
import { parallelogram, polyhedronFigure, roundSolidFigure, triangularPrism } from './geometrieFigures';
import { cm, cm2, cm3, coordonnees, degres, fauxMesures, identifiant, INSTRUCTION, INSTRUCTION_FIGURE, lettresDeFigure, lettresDeTriangle, question, repereDePoints, sontEcartes } from './geometrieCollege';
import { entre, nb } from './mathsCycle4';

/**
 * La géométrie de la 5e (programme de mathématiques du cycle 4, BO n° 10 du
 * 5 mars 2026).
 *
 * - 1er trimestre : le repérage dans le plan (lire des coordonnées, trouver un
 *   point, calculer sur les axes), la somme des angles d'un triangle (reprise
 *   du cycle 3) ;
 * - 2e trimestre : les angles formés par deux parallèles et une sécante, la
 *   symétrie centrale, la médiatrice, la médiane et la hauteur d'un triangle ;
 * - 3e trimestre : le parallélogramme, l'aire du triangle, du parallélogramme
 *   et du disque, le volume du prisme droit et du cylindre.
 *
 * Hors programme, donc absent : le théorème de Pythagore, le théorème de
 * Thalès, la trigonométrie, la translation, l'inégalité triangulaire (À
 * VÉRIFIER dans programmes/maths.md : elle arrive en 4e).
 */

/** Les coordonnées que prennent les points : positives au 1er trimestre, de signes quelconques ensuite, quand les relatifs sont connus. */
const valeursDeCoordonnees = (stage: number): number[] => (stage >= 11 ? [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7]);
const bornesDuRepere = (stage: number): [number, number] => (stage >= 11 ? [-5, 5] : [0, 8]);

const dansLeRepere = (stage: number, x: number, y: number) => {
  const [min, max] = bornesDuRepere(stage);
  return x >= min && x <= max && y >= min && y <= max;
};

// === 1er trimestre (étape 10) =====================================================================================

const reperageLecture: Family = {
  name: 'reperage-lecture',
  minStage: 10,
  make: (rng, stage) => {
    const valeurs = valeursDeCoordonnees(stage);
    const lettres = lettresDistinctes(rng, 4);
    let [xs, ys] = [rngShuffle(rng, valeurs).slice(0, 4), rngShuffle(rng, valeurs).slice(0, 4)];
    // Les quatre points sont écartés les uns des autres : leurs noms ne se gênent pas sur un repère de onze graduations.
    while (!sontEcartes(xs.map((x, rang) => ({ x, y: ys[rang] })))) [xs, ys] = [rngShuffle(rng, valeurs).slice(0, 4), rngShuffle(rng, valeurs).slice(0, 4)];
    const points = lettres.map((lettre, rang) => ({ lettre, x: xs[rang], y: ys[rang] }));
    const cible = rngPick(rng, points);
    const [min, max] = bornesDuRepere(stage);
    const figure = repereDePoints(min, max, points, `Un repère quadrillé avec quatre points nommés : ${lettres.join(', ')}.`);
    const variante = rngInt(rng, 0, 2);
    const { x, y, lettre } = cible;
    const detail = identifiant('lecture', variante, lettres.join(''), xs.join(''), ys.join(''), lettre);
    if (variante === 0) {
      const voisins: [number, number][] = [[y, x], [x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y], [-x, y], [x, -y]];
      return question(rng, {
        detail,
        instruction: INSTRUCTION_FIGURE,
        prompt: `Quelles sont les coordonnées du point ${lettre} ?`,
        figure,
        correct: coordonnees(x, y),
        // Les deux nombres échangés, un nombre voisin, un signe changé.
        wrong: voisins.filter(([a, b]) => dansLeRepere(stage, a, b)).map(([a, b]) => coordonnees(a, b)),
        explanation: `Le point ${lettre} est au-dessus de ${nb(x)} sur l'axe horizontal et en face de ${nb(y)} sur l'axe vertical : ${coordonnees(x, y)}.`,
      });
    }
    const [reponse, autre] = variante === 1 ? [x, y] : [y, x];
    return question(rng, {
      detail,
      instruction: INSTRUCTION_FIGURE,
      prompt: variante === 1 ? `Quelle est l'abscisse du point ${lettre} ?` : `Quelle est l'ordonnée du point ${lettre} ?`,
      figure,
      correct: nb(reponse),
      // L'autre coordonnée, un nombre voisin, l'opposé.
      wrong: [autre, reponse + 1, reponse - 1, -reponse, reponse + 2, reponse - 2, reponse + 3].filter((valeur) => valeur >= min && valeur <= max && valeur !== reponse).map(nb),
      explanation: variante === 1 ? `L'abscisse se lit sur l'axe horizontal : ${nb(x)}.` : `L'ordonnée se lit sur l'axe vertical : ${nb(y)}.`,
    });
  },
};

const reperagePoints: Family = {
  name: 'reperage-points',
  minStage: 10,
  make: (rng, stage) => {
    const valeurs = valeursDeCoordonnees(stage);
    // Le point cherché, son symétrique « échangé » (y ; x), et deux points qui partagent une seule de ses coordonnées. Ils sont écartés les uns des autres : leurs noms ne se gênent pas.
    let positions: [number, number][];
    let x: number;
    let ordonnee: number;
    let autreX: number;
    let autreY: number;
    do {
      x = rngPick(rng, valeurs);
      ordonnee = rngPick(rng, valeurs.filter((valeur) => valeur !== x));
      autreY = rngPick(rng, valeurs.filter((valeur) => valeur !== ordonnee && valeur !== x));
      autreX = rngPick(rng, valeurs.filter((valeur) => valeur !== x && valeur !== ordonnee));
      positions = [[x, ordonnee], [ordonnee, x], [x, autreY], [autreX, ordonnee]];
    } while (!sontEcartes(positions.map(([px, py]) => ({ x: px, y: py }))));
    const lettres = lettresDistinctes(rng, 4);
    const points = lettres.map((lettre, rang) => ({ lettre, x: positions[rang][0], y: positions[rang][1] }));
    const [min, max] = bornesDuRepere(stage);
    const figure = repereDePoints(min, max, rngShuffle(rng, points), `Un repère quadrillé avec quatre points nommés : ${[...lettres].sort().join(', ')}.`);
    return question(rng, {
      detail: identifiant('points', x, ordonnee, autreX, autreY, lettres.join('')),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Quel point a pour coordonnées ${coordonnees(x, ordonnee)} ?`,
      figure,
      correct: lettres[0],
      wrong: lettres.slice(1),
      explanation: `On cherche le point d'abscisse ${nb(x)} et d'ordonnée ${nb(ordonnee)} : c'est ${lettres[0]}. L'abscisse se donne toujours en premier.`,
    });
  },
};

const reperageCalcul: Family = {
  name: 'reperage-calcul',
  minStage: 10,
  make: (rng, stage) => {
    const valeurs = stage >= 11 ? [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const variante = rngInt(rng, 0, 3);
    if (variante === 0) {
      const [a, b] = lettresDeFigure(rng, 2);
      const u = rngPick(rng, valeurs);
      const w = rngPick(rng, valeurs.filter((valeur) => valeur !== u));
      const commun = rngPick(rng, valeurs);
      const horizontal = rng() < 0.5;
      const distance = Math.abs(w - u);
      const [grand, petit] = [Math.max(u, w), Math.min(u, w)];
      const pointA = horizontal ? coordonnees(u, commun) : coordonnees(commun, u);
      const pointB = horizontal ? coordonnees(w, commun) : coordonnees(commun, w);
      return question(rng, {
        detail: identifiant('distance', a, b, u, w, commun, horizontal ? 'h' : 'v'),
        instruction: INSTRUCTION,
        prompt: `Dans un repère, on a ${a}${pointA} et ${b}${pointB}. Quelle est la distance ${a}${b}, en unités ?`,
        correct: nb(distance),
        // Les nombres additionnés, les valeurs absolues soustraites, un rang de trop ou de moins.
        wrong: fauxMesures(distance, [Math.abs(u + w), Math.abs(Math.abs(u) - Math.abs(w)), distance + 1, distance - 1, Math.abs(u) + Math.abs(w) + 1, distance + 2], nb, { min: 1 }),
        explanation: `Les deux points ont ${horizontal ? 'la même ordonnée' : 'la même abscisse'} : on soustrait les ${horizontal ? 'abscisses' : 'ordonnées'}. ${nb(grand)} − ${entre(petit)} = ${nb(distance)}.`,
      });
    }
    if (variante === 1) {
      const [p, q, r, s] = lettresConsecutives(rng, 4);
      const [x1, x2] = rngShuffle(rng, valeurs).slice(0, 2);
      const [y1, y2] = rngShuffle(rng, valeurs).slice(0, 2);
      return question(rng, {
        detail: identifiant('rectangle', p, x1, x2, y1, y2),
        instruction: INSTRUCTION,
        prompt: `Dans un repère, ${p}${q}${r}${s} est un rectangle dont les côtés sont parallèles aux axes. On a ${p}${coordonnees(x1, y1)}, ${q}${coordonnees(x2, y1)} et ${r}${coordonnees(x2, y2)}. Quelles sont les coordonnées du point ${s} ?`,
        correct: coordonnees(x1, y2),
        // Les coordonnées d'un autre sommet, les deux nombres échangés.
        wrong: [coordonnees(x2, y1), coordonnees(x1, y1), coordonnees(x2, y2), coordonnees(y2, x1), coordonnees(x1, -y2), coordonnees(-x1, y2), coordonnees(x2, y2 + 1)],
        explanation: `${s} est sur la même verticale que ${p} (abscisse ${nb(x1)}) et sur la même horizontale que ${r} (ordonnée ${nb(y2)}) : ${coordonnees(x1, y2)}.`,
      });
    }
    if (variante === 2) {
      const [lettre] = lettresDistinctes(rng, 1);
      const x = rngPick(rng, valeurs);
      const y = rngPick(rng, valeurs.filter((valeur) => valeur !== x));
      return question(rng, {
        detail: identifiant('ordre', lettre, x, y),
        instruction: INSTRUCTION,
        prompt: `Dans un repère, le point ${lettre} a pour abscisse ${nb(x)} et pour ordonnée ${nb(y)}. Quelles sont ses coordonnées ?`,
        correct: coordonnees(x, y),
        // L'ordre échangé, une même valeur écrite deux fois.
        wrong: [coordonnees(y, x), coordonnees(x, x), coordonnees(y, y), coordonnees(-x, y), coordonnees(x, -y)],
        explanation: `Les coordonnées s'écrivent dans l'ordre : l'abscisse d'abord, l'ordonnée ensuite. ${lettre}${coordonnees(x, y)}.`,
      });
    }
    // Un point sur un axe : l'une de ses coordonnées est nulle.
    const surLesAbscisses = rng() < 0.5;
    const surLAxe = (variable: number) => (surLesAbscisses ? coordonnees(variable, 0) : coordonnees(0, variable));
    const surLAutreAxe = (variable: number) => (surLesAbscisses ? coordonnees(0, variable) : coordonnees(variable, 0));
    // Trois points qui ne sont sur aucun axe, tous différents : avec l'autre axe, il y a toujours trois mauvaises réponses.
    const [a, b] = [rngPick(rng, valeurs), rngPick(rng, valeurs)];
    let [c, d, e, f] = Array.from({ length: 4 }, () => rngPick(rng, valeurs));
    while (new Set([coordonnees(c, d), coordonnees(e, f), coordonnees(d, c), coordonnees(f, e)]).size < 3) [c, d, e, f] = Array.from({ length: 4 }, () => rngPick(rng, valeurs));
    return question(rng, {
      detail: identifiant('axe', surLesAbscisses ? 'abscisses' : 'ordonnees', a, b, c, d, e, f),
      instruction: INSTRUCTION,
      prompt: `Dans un repère, lequel de ces points est situé sur l'axe des ${surLesAbscisses ? 'abscisses' : 'ordonnées'} ?`,
      correct: surLAxe(a),
      // Un point de l'autre axe, des points qui ne sont sur aucun axe.
      wrong: [surLAutreAxe(b), coordonnees(c, d), coordonnees(e, f), coordonnees(d, c), coordonnees(f, e)],
      explanation: `Un point de l'axe des ${surLesAbscisses ? 'abscisses' : 'ordonnées'} a une ${surLesAbscisses ? 'ordonnée' : 'abscisse'} égale à 0.`,
    });
  },
};

/**
 * Un triangle dont les trois angles sont marqués. Le plus grand angle est en haut : les deux autres, à la base, ont
 * assez de place pour que leurs mesures ne se touchent pas (deux grands angles à la base feraient un triangle étroit
 * dont les deux textes se superposeraient au milieu).
 */
function triangleAvecLePlusGrandAngleEnHaut(angles: { lettre: string; angle: number; texte: string }[], alt: string) {
  const haut = angles.reduce((plusGrand, courant) => (courant.angle > plusGrand.angle ? courant : plusGrand));
  const [gauche, droite] = angles.filter((sommet) => sommet !== haut);
  return triangleAvecAngles(gauche.angle, droite.angle, [gauche.lettre, droite.lettre, haut.lettre], [gauche.texte, droite.texte, haut.texte], null, alt);
}

const triangleAnglesSomme: Family = {
  name: 'triangle-angles-somme',
  minStage: 10,
  make: (rng) => {
    const [premier, deuxieme, sommet] = lettresDeTriangle(rng);
    const nom = `${premier}${deuxieme}${sommet}`;
    const variante = rngInt(rng, 0, 3);
    if (variante === 0) {
      const [a, b] = [rngInt(rng, 28, 100), rngInt(rng, 28, 100)];
      if (a + b > 150) return triangleAnglesSomme.make(rng, 10);
      const c = 180 - a - b;
      return question(rng, {
        detail: identifiant('somme', nom, a, b),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Dans le triangle ${nom}, l'angle en ${premier} mesure ${degres(a)} et l'angle en ${deuxieme} mesure ${degres(b)}. Combien mesure l'angle en ${sommet} ?`,
        figure: triangleAvecLePlusGrandAngleEnHaut([{ lettre: premier, angle: a, texte: degres(a) }, { lettre: deuxieme, angle: b, texte: degres(b) }, { lettre: sommet, angle: c, texte: '?' }], `Un triangle ${nom} dont deux angles sont marqués et le troisième porte un point d'interrogation.`),
        correct: degres(c),
        // Les deux angles additionnés, 180° moins un seul des angles, un écart de dix degrés.
        wrong: fauxMesures(c, [a + b, 180 - a, 180 - b, c + 10, c - 10, 90 - c, 360 - a - b], degres, { min: 1, max: 179 }),
        explanation: `La somme des angles d'un triangle vaut 180° : ${a} + ${b} = ${a + b}, puis 180 − ${a + b} = ${c}.`,
      });
    }
    if (variante === 1) {
      const sommetAngle = rngPick(rng, [20, 30, 36, 40, 44, 50, 56, 60, 64, 70, 76, 80, 90, 100, 110, 120]);
      const base = (180 - sommetAngle) / 2;
      return question(rng, {
        detail: identifiant('isocele-sommet', nom, sommetAngle),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Le triangle ${nom} est isocèle en ${sommet}. L'angle en ${sommet} mesure ${degres(sommetAngle)}. Combien mesure l'angle en ${premier} ?`,
        figure: triangleAvecAngles(base, base, [premier, deuxieme, sommet], ['?', null, degres(sommetAngle)], [0, 1, 1], `Un triangle isocèle en ${sommet}, dont l'angle au sommet est marqué.`),
        correct: degres(base),
        // 180° moins l'angle au sommet sans partager en deux, l'angle au sommet lui-même, le complément à 90°.
        wrong: fauxMesures(base, [180 - sommetAngle, sommetAngle, 90 - sommetAngle, 2 * sommetAngle, base + 10, base - 10, 180 - 2 * sommetAngle], degres, { min: 1, max: 179 }),
        explanation: `Les deux angles de la base sont égaux. 180 − ${sommetAngle} = ${180 - sommetAngle}, puis ${180 - sommetAngle} ÷ 2 = ${base}.`,
      });
    }
    if (variante === 2) {
      const base = rngInt(rng, 35, 80);
      const sommetAngle = 180 - 2 * base;
      return question(rng, {
        detail: identifiant('isocele-base', nom, base),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Le triangle ${nom} est isocèle en ${sommet}. L'angle en ${premier} mesure ${degres(base)}. Combien mesure l'angle en ${sommet} ?`,
        figure: triangleAvecAngles(base, base, [premier, deuxieme, sommet], [degres(base), null, '?'], [0, 1, 1], `Un triangle isocèle en ${sommet}, dont un angle de la base est marqué.`),
        correct: degres(sommetAngle),
        // Un seul angle de la base retranché, la base elle-même, le complément à 90°.
        wrong: fauxMesures(sommetAngle, [180 - base, base, 90 - base, 2 * base, sommetAngle + 10, sommetAngle - 10, 180 - base - 10], degres, { min: 1, max: 179 }),
        explanation: `Les deux angles de la base mesurent ${base}° : ${base} + ${base} = ${2 * base}, puis 180 − ${2 * base} = ${sommetAngle}.`,
      });
    }
    const aigu = rngInt(rng, 22, 68);
    return question(rng, {
      detail: identifiant('rectangle', nom, aigu),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Le triangle ${nom} est rectangle en ${premier}. L'angle en ${deuxieme} mesure ${degres(aigu)}. Combien mesure l'angle en ${sommet} ?`,
      figure: triangleRectangle(Math.tan((aigu * Math.PI) / 180), [premier, deuxieme, sommet], [null, null, null], [{ sommet: 1, texte: degres(aigu) }, { sommet: 2, texte: '?' }], `Un triangle ${nom} rectangle en ${premier}, dont un angle aigu est marqué.`),
      correct: degres(90 - aigu),
      // 180° moins l'angle, l'angle lui-même, 90° de plus.
      wrong: fauxMesures(90 - aigu, [180 - aigu, aigu, 90 + aigu, 180 - aigu - 90 + 10, 90 - aigu + 10, 90 - aigu - 10, 180 - 2 * aigu], degres, { min: 1, max: 179 }),
      explanation: `L'angle droit mesure 90°, et la somme des trois angles vaut 180° : 180 − 90 − ${aigu} = ${90 - aigu}.`,
    });
  },
};

export const FAMILLES_CINQUIEME_T1: Family[] = [reperageLecture, reperagePoints, reperageCalcul, triangleAnglesSomme];

// === 2e trimestre (étape 11) ======================================================================================

type Relation = 'correspondants' | 'alternes-internes' | 'opposes' | 'supplementaires';

const OPPOSE: Record<Secteur, Secteur> = { NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW' };
const VOISINS: Record<Secteur, Secteur[]> = { NE: ['NW', 'SE'], NW: ['NE', 'SW'], SW: ['NW', 'SE'], SE: ['NE', 'SW'] };
const SECTEURS: Secteur[] = ['NE', 'NW', 'SW', 'SE'];

const PHRASE_DE_LA_RELATION: Record<Relation, (donne: number, cherche: number) => string> = {
  correspondants: () => 'Les angles marqués sont correspondants : les droites étant parallèles, ils sont égaux.',
  'alternes-internes': () => 'Les angles marqués sont alternes-internes : les droites étant parallèles, ils sont égaux.',
  opposes: () => 'Les angles marqués sont opposés par le sommet : ils sont égaux.',
  supplementaires: (donne, cherche) => `Les angles marqués forment ensemble un angle plat : leur somme vaut 180°. 180 − ${donne} = ${cherche}.`,
};

const anglesParalleles: Family = {
  name: 'angles-paralleles',
  minStage: 11,
  make: (rng) => {
    const relation = rngPick<Relation>(rng, ['correspondants', 'alternes-internes', 'opposes', 'supplementaires']);
    // L'angle donné et l'angle cherché : leur place, selon ce qui les lie.
    let droiteDonnee: 1 | 2 = rngPick<1 | 2>(rng, [1, 2]);
    let secteurDonne = rngPick(rng, SECTEURS);
    let droiteCherchee: 1 | 2 = droiteDonnee === 1 ? 2 : 1;
    let secteurCherche: Secteur = secteurDonne;
    if (relation === 'alternes-internes') {
      const [d, s]: [1 | 2, Secteur] = rngPick(rng, [[1, 'SE'], [1, 'SW'], [2, 'NW'], [2, 'NE']] as [1 | 2, Secteur][]);
      [droiteDonnee, secteurDonne] = [d, s];
      droiteCherchee = d === 1 ? 2 : 1;
      secteurCherche = OPPOSE[s];
    } else if (relation === 'opposes') {
      droiteCherchee = droiteDonnee;
      secteurCherche = OPPOSE[secteurDonne];
    } else if (relation === 'supplementaires') {
      droiteCherchee = droiteDonnee;
      secteurCherche = rngPick(rng, VOISINS[secteurDonne]);
    }
    const donne = rngPick(rng, [35, 40, 42, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, 108, 112, 115, 118, 122, 125, 128, 132, 135, 138, 142]);
    const theta = secteurDonne === 'NE' || secteurDonne === 'SW' ? donne : 180 - donne;
    const cherche = MESURE_DU_SECTEUR(secteurCherche, theta);
    const rotation = rngPick(rng, [-7, -4, 0, 4, 7]);
    const figure = parallelesEtSecante(
      theta,
      rotation,
      [
        { droite: droiteDonnee, secteur: secteurDonne, texte: degres(donne) },
        { droite: droiteCherchee, secteur: secteurCherche, texte: 'x' },
      ],
      "Deux droites parallèles (d) et (d') coupées par une sécante. Deux angles sont marqués : l'un porte sa mesure, l'autre la lettre x."
    );
    return question(rng, {
      detail: identifiant('paralleles', relation, donne, rotation, droiteDonnee, secteurDonne),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Les droites (d) et (d') sont parallèles. L'angle marqué mesure ${degres(donne)}. Combien mesure l'angle marqué x ?`,
      figure,
      correct: degres(cherche),
      // Le supplémentaire à la place de l'égal, l'égal à la place du supplémentaire, le complément à 90°.
      wrong: fauxMesures(cherche, [180 - cherche, donne, 180 - donne, Math.abs(90 - cherche), cherche + 10, cherche - 10, 360 - 2 * cherche], degres, { min: 1, max: 179 }),
      explanation: PHRASE_DE_LA_RELATION[relation](donne, cherche),
    });
  },
};

const symetrieCentraleRepere: Family = {
  name: 'symetrie-centrale-repere',
  minStage: 11,
  make: (rng, stage) => {
    const valeurs = valeursDeCoordonnees(stage);
    const [lettre] = lettresDistinctes(rng, 1);
    const centreEstO = rng() < 0.6;
    if (centreEstO) {
      const [x, y] = [rngPick(rng, valeurs), rngPick(rng, valeurs)];
      const figure = repereDePoints(-5, 5, [{ lettre: 'O', x: 0, y: 0 }, { lettre, x, y }], `Un repère quadrillé avec l'origine O et le point ${lettre}.`);
      return question(rng, {
        detail: identifiant('centre-O', lettre, x, y),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Dans un repère, le point ${lettre} a pour coordonnées ${coordonnees(x, y)}. Quelles sont les coordonnées du symétrique de ${lettre} par rapport à O ?`,
        figure,
        correct: coordonnees(-x, -y),
        // Une symétrie par rapport à un axe, les nombres échangés.
        wrong: [coordonnees(x, -y), coordonnees(-x, y), coordonnees(y, x), coordonnees(-y, -x), coordonnees(-y, x), coordonnees(y, -x)].filter((texte) => texte !== coordonnees(-x, -y)),
        explanation: `O est le milieu de [${lettre}${lettre}']. On passe de ${coordonnees(x, y)} à ${coordonnees(-x, -y)} : les deux coordonnées changent de signe.`,
      });
    }
    for (;;) {
      const [a, b] = [rngInt(rng, -3, 3), rngInt(rng, -3, 3)];
      const [x, y] = [rngPick(rng, valeurs), rngPick(rng, valeurs)];
      const [sx, sy] = [2 * a - x, 2 * b - y];
      if ((a === 0 && b === 0) || Math.abs(sx) > 5 || Math.abs(sy) > 5 || (sx === x && sy === y) || (x === a && y === b)) continue;
      const figure = repereDePoints(-5, 5, [{ lettre: 'I', x: a, y: b }, { lettre, x, y }], `Un repère quadrillé avec le point I et le point ${lettre}.`);
      return question(rng, {
        detail: identifiant('centre-I', lettre, x, y, a, b),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Dans un repère, on a ${lettre}${coordonnees(x, y)} et I${coordonnees(a, b)}. Quelles sont les coordonnées du symétrique de ${lettre} par rapport à I ?`,
        figure,
        correct: coordonnees(sx, sy),
        // La symétrie par rapport à O, le vecteur de I vers le point, un seul nombre symétrisé.
        wrong: [coordonnees(-x, -y), coordonnees(a - x, b - y), coordonnees(sx, y), coordonnees(x, sy), coordonnees(x - a, y - b), coordonnees(2 * a + x, 2 * b + y)],
        explanation: `I est le milieu de [${lettre}${lettre}']. Pour chaque coordonnée : 2 × centre − point, soit 2 × ${entre(a)} − ${entre(x)} = ${nb(sx)} et 2 × ${entre(b)} − ${entre(y)} = ${nb(sy)}.`,
      });
    }
  },
};

const FIGURES_AVEC_CENTRE = ['un parallélogramme', 'un rectangle', 'un losange', 'un carré', 'un disque', 'un segment'];
const FIGURES_SANS_CENTRE = ['un triangle équilatéral', 'un triangle rectangle', 'un trapèze rectangle', 'un cerf-volant', 'un pentagone régulier', 'un trapèze isocèle', 'un triangle isocèle'];

const symetrieCentraleProprietes: Family = {
  name: 'symetrie-centrale-proprietes',
  minStage: 11,
  make: (rng) => {
    const variante = rngInt(rng, 0, 3);
    const [a, b, c] = lettresDeFigure(rng, 3);
    if (variante === 0) {
      const d = rngPick(rng, [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 7.5, 8, 9, 10, 12]);
      return question(rng, {
        detail: identifiant('milieu', a, d),
        instruction: INSTRUCTION,
        prompt: `Le point ${a}' est le symétrique du point ${a} par rapport au point O. On a O${a} = ${cm(d)}. Combien mesure [${a}${a}'] ?`,
        correct: cm(2 * d),
        // La moitié, la longueur donnée, le triple.
        wrong: fauxMesures(2 * d, [d, d / 2, 3 * d, 4 * d, 2 * d + 2, 2 * d - 2], cm, { decimales: 2 }),
        explanation: `O est le milieu de [${a}${a}'] : ${a}${a}' = 2 × ${nb(d)} = ${nb(2 * d)} cm.`,
      });
    }
    if (variante === 1) {
      const d = rngInt(rng, 3, 15);
      return question(rng, {
        detail: identifiant('longueur', a, b, d),
        instruction: INSTRUCTION,
        prompt: `Dans la symétrie de centre O, le segment [${a}${b}] a pour symétrique le segment [${a}'${b}']. On a ${a}${b} = ${cm(d)}. Combien mesure [${a}'${b}'] ?`,
        correct: cm(d),
        // Le double, la moitié, un écart.
        wrong: fauxMesures(d, [2 * d, d / 2, d + 2, d - 2, d + 5, 3 * d], cm, { decimales: 1 }),
        explanation: `Une symétrie centrale conserve les longueurs : ${a}'${b}' = ${a}${b} = ${nb(d)} cm.`,
      });
    }
    if (variante === 2) {
      const m = rngPick(rng, [25, 35, 40, 48, 55, 65, 72, 108, 115, 124, 135, 142]);
      return question(rng, {
        detail: identifiant('angle', a, b, c, m),
        instruction: INSTRUCTION,
        prompt: `Dans la symétrie de centre O, l'angle ${a}${b}${c} a pour symétrique l'angle ${a}'${b}'${c}'. L'angle ${a}${b}${c} mesure ${degres(m)}. Combien mesure l'angle ${a}'${b}'${c}' ?`,
        correct: degres(m),
        // Le supplémentaire, le double, le complément à 90°.
        wrong: fauxMesures(m, [180 - m, 2 * m, Math.abs(90 - m), 360 - m, m + 10, m - 10], degres, { min: 1, max: 359 }),
        explanation: `Une symétrie centrale conserve les angles : l'angle ${a}'${b}'${c}' mesure aussi ${m}°.`,
      });
    }
    const avec = rngPick(rng, FIGURES_AVEC_CENTRE);
    const sans = rngShuffle(rng, FIGURES_SANS_CENTRE).slice(0, 3);
    return question(rng, {
      detail: identifiant('centre-de-symetrie', avec, sans.join('-')),
      instruction: INSTRUCTION,
      prompt: 'Laquelle de ces figures possède un centre de symétrie ?',
      correct: avec,
      wrong: sans,
      explanation: `${avec.charAt(0).toUpperCase()}${avec.slice(1)} se superpose à lui-même après un demi-tour autour de son centre. Les autres figures n'ont pas de centre de symétrie.`,
    });
  },
};

const droitesDuTriangle: Family = {
  name: 'droites-du-triangle',
  minStage: 11,
  make: (rng) => {
    const variante = rngInt(rng, 0, 3);
    // Le milieu s'appelle M et le pied de la hauteur H : aucun sommet du triangle ne porte ces noms.
    const [a, b, c] = lettresDeFigure(rng, 3, ['M', 'H']);
    if (variante === 0) {
      const d = rngPick(rng, [3, 4, 5, 6, 7, 8, 9, 10, 12, 15]);
      return question(rng, {
        detail: identifiant('mediatrice', a, b, d),
        instruction: INSTRUCTION,
        prompt: `Le point ${c} est situé sur la médiatrice du segment [${a}${b}]. On a ${c}${a} = ${cm(d)}. Combien mesure [${c}${b}] ?`,
        correct: cm(d),
        // Le double, la moitié, un écart.
        wrong: fauxMesures(d, [2 * d, d / 2, d + 1, d - 1, d + 3, 3 * d], cm, { decimales: 1 }),
        explanation: `Les points de la médiatrice d'un segment sont à égale distance de ses extrémités : ${c}${b} = ${c}${a} = ${nb(d)} cm.`,
      });
    }
    if (variante === 1) {
      const moitie = rngPick(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
      return question(rng, {
        detail: identifiant('mediane', a, b, c, moitie),
        instruction: INSTRUCTION,
        prompt: `Dans le triangle ${a}${b}${c}, le point M est le milieu de [${b}${c}] et ${b}${c} = ${cm(2 * moitie)}. La médiane issue de ${a} passe par M. Combien mesure [${b}M] ?`,
        correct: cm(moitie),
        // La longueur entière, le double, la moitié de la moitié.
        wrong: fauxMesures(moitie, [2 * moitie, 4 * moitie, moitie / 2, moitie + 1, moitie - 1, moitie + 2], cm, { decimales: 1 }),
        explanation: `M est le milieu de [${b}${c}] : ${b}M = ${nb(2 * moitie)} ÷ 2 = ${nb(moitie)} cm.`,
      });
    }
    if (variante === 2) {
      const moitie = rngPick(rng, [6, 7, 8, 9, 10, 12, 14, 15, 18, 20, 24, 25, 30]);
      return question(rng, {
        detail: identifiant('aire-mediane', a, b, c, moitie),
        instruction: INSTRUCTION,
        prompt: `Le triangle ${a}${b}${c} a une aire de ${cm2(2 * moitie)}. Le point M est le milieu de [${b}${c}]. Quelle est l'aire du triangle ${a}${b}M ?`,
        correct: cm2(moitie),
        // L'aire entière, le double, le quart.
        wrong: fauxMesures(moitie, [2 * moitie, 4 * moitie, moitie / 2, moitie + 2, moitie - 2, 3 * moitie], cm2, { decimales: 1 }),
        explanation: `Une médiane partage un triangle en deux triangles de même aire : ${nb(2 * moitie)} ÷ 2 = ${nb(moitie)} cm².`,
      });
    }
    return question(rng, {
      detail: identifiant('hauteur', a, b, c),
      instruction: INSTRUCTION,
      prompt: `Dans le triangle ${a}${b}${c}, la droite (${a}H) est la hauteur issue de ${a}, avec H sur la droite (${b}${c}). Combien mesure l'angle ${a}H${b} ?`,
      correct: degres(90),
      // Un demi-angle droit, un angle plat, un angle de 60°.
      wrong: [degres(45), degres(180), degres(60), degres(30), degres(120)],
      explanation: `Une hauteur est perpendiculaire au côté opposé : l'angle ${a}H${b} est un angle droit, de 90°.`,
    });
  },
};

export const FAMILLES_CINQUIEME_T2: Family[] = [anglesParalleles, symetrieCentraleRepere, symetrieCentraleProprietes, droitesDuTriangle];

// === 3e trimestre (étape 12) ======================================================================================

/** Les sommets d'un parallélogramme : l'angle aigu mesure `aigu`, les côtés sont dans le rapport donné. */
const dessinDuParallelogramme = (rapport: number, aigu: number, lettres: [string, string, string, string], obtusEnP: boolean, marques: Parameters<typeof polygoneNomme>[2], alt: string) => {
  // Les sommets 0 et 2 de parallelogram() sont aigus, les sommets 1 et 3 sont obtus : pour que le premier nom soit celui d'un angle obtus, on décale les noms d'un rang.
  const noms: [string, string, string, string] = obtusEnP ? [lettres[3], lettres[0], lettres[1], lettres[2]] : lettres;
  return polygoneNomme(parallelogram(Math.min(160, Math.max(45, 100 * rapport)), aigu), noms, marques, alt, 44);
};

const parallelogrammeProprietes: Family = {
  name: 'parallelogramme-proprietes',
  minStage: 12,
  make: (rng) => {
    const [p, q, r, s] = lettresConsecutives(rng, 4);
    const nom = `${p}${q}${r}${s}`;
    const variante = rngInt(rng, 0, 2);
    const alt = `Un parallélogramme ${nom}.`;
    if (variante === 0) {
      const [longueur, largeur] = [rngInt(rng, 3, 12), rngInt(rng, 2, 9)];
      if (longueur === largeur) return parallelogrammeProprietes.make(rng, 12);
      const cote = rng() < 0.5;
      const reponse = cote ? longueur : largeur;
      return question(rng, {
        detail: identifiant('cotes', nom, longueur, largeur, cote ? 'cd' : 'da'),
        instruction: INSTRUCTION_FIGURE,
        prompt: `${nom} est un parallélogramme. On a ${p}${q} = ${cm(longueur)} et ${q}${r} = ${cm(largeur)}. Combien mesure [${cote ? `${r}${s}` : `${s}${p}`}] ?`,
        figure: dessinDuParallelogramme(largeur / longueur, rngPick(rng, [60, 70]), [p, q, r, s], false, () => [], alt),
        correct: cm(reponse),
        // L'autre côté, la somme, le double.
        wrong: fauxMesures(reponse, [cote ? largeur : longueur, longueur + largeur, 2 * reponse, reponse + 2, reponse - 1, longueur * 2 + largeur * 2], cm, { decimales: 1 }),
        explanation: `Dans un parallélogramme, les côtés opposés ont la même longueur : ${cote ? `${r}${s} = ${p}${q}` : `${s}${p} = ${q}${r}`} = ${nb(reponse)} cm.`,
      });
    }
    if (variante === 1) {
      const m = rngPick(rng, [50, 55, 60, 65, 70, 75, 80, 105, 110, 115, 120, 125]);
      const sommetCherche = rngPick(rng, [1, 2, 3]);
      const reponse = sommetCherche === 2 ? m : 180 - m;
      const nomDuSommet = [p, q, r, s][sommetCherche];
      return question(rng, {
        detail: identifiant('angles', nom, m, sommetCherche),
        instruction: INSTRUCTION_FIGURE,
        prompt: `${nom} est un parallélogramme. L'angle en ${p} mesure ${degres(m)}. Combien mesure l'angle en ${nomDuSommet} ?`,
        figure: dessinDuParallelogramme(0.7, m < 90 ? m : 180 - m, [p, q, r, s], m > 90, () => [], alt),
        correct: degres(reponse),
        // Le supplémentaire à la place de l'égal, l'égal à la place du supplémentaire, le complément à 90°.
        wrong: fauxMesures(reponse, [180 - reponse, m, 180 - m, Math.abs(90 - reponse), 360 - 2 * reponse, reponse + 10], degres, { min: 1, max: 179 }),
        explanation:
          sommetCherche === 2
            ? `Dans un parallélogramme, les angles opposés sont égaux : l'angle en ${nomDuSommet} mesure ${m}°.`
            : `Dans un parallélogramme, deux angles consécutifs sont supplémentaires : 180 − ${m} = ${reponse}.`,
      });
    }
    const diagonale = rngInt(rng, 3, 12) * 2;
    const [premiere, seconde] = rng() < 0.5 ? [`${p}${r}`, `${q}${s}`] : [`${q}${s}`, `${p}${r}`];
    const depart = premiere[0];
    return question(rng, {
      detail: identifiant('diagonales', nom, diagonale, premiere),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Les diagonales [${premiere}] et [${seconde}] du parallélogramme ${nom} se coupent en O. On a ${premiere} = ${cm(diagonale)}. Combien mesure [O${depart}] ?`,
      figure: dessinDuParallelogramme(0.7, 65, [p, q, r, s], false, (sommets) => {
        const milieu: [number, number] = [Math.round(((sommets[0][0] + sommets[2][0]) / 2) * 10) / 10, Math.round(((sommets[0][1] + sommets[2][1]) / 2) * 10) / 10];
        return [
          { kind: 'segment', from: sommets[0], to: sommets[2], width: 2 },
          { kind: 'segment', from: sommets[1], to: sommets[3], width: 2 },
          { kind: 'point', at: milieu },
          { kind: 'text', at: [milieu[0] + 4, milieu[1] - 9], text: 'O', anchor: 'middle', bold: true, size: 14, halo: true },
        ];
      }, alt),
      correct: cm(diagonale / 2),
      // La diagonale entière, le double, le quart.
      wrong: fauxMesures(diagonale / 2, [diagonale, 2 * diagonale, diagonale / 4, diagonale / 2 + 1, diagonale / 2 - 1, diagonale / 2 + 2], cm, { decimales: 1 }),
      explanation: `Les diagonales d'un parallélogramme se coupent en leur milieu : O${depart} = ${nb(diagonale)} ÷ 2 = ${nb(diagonale / 2)} cm.`,
    });
  },
};

const aireDeFigures: Family = {
  name: 'aire-triangle-parallelogramme',
  minStage: 12,
  make: (rng) => {
    const variante = rngInt(rng, 0, 3);
    const [base, hauteur] = [rngInt(rng, 4, 16), rngInt(rng, 3, 12)];
    const triangle = variante === 0 || variante === 3;
    const lettres = lettresDeFigure(rng, 4);
    if (triangle && (base * hauteur) % 2 !== 0) return aireDeFigures.make(rng, 12);
    const aire = triangle ? (base * hauteur) / 2 : base * hauteur;
    const figure = (texteHauteur: string) =>
      triangle
        ? triangleAvecHauteur(base, hauteur, rngPick(rng, [0.3, 0.4, 0.5, 0.6, 0.7]), cm(base), texteHauteur, [lettres[0], lettres[1], lettres[2]], 'Un triangle avec sa base et sa hauteur tracée en pointillés.')
        : parallelogrammeAvecHauteur(base, hauteur, cm(base), texteHauteur, [lettres[0], lettres[1], lettres[2], lettres[3]], 'Un parallélogramme avec sa base et sa hauteur tracée en pointillés.');
    const figureNom = triangle ? 'triangle' : 'parallélogramme';
    if (variante <= 1) {
      return question(rng, {
        detail: identifiant('aire', figureNom, base, hauteur, lettres.join('')),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Un ${figureNom} a une base de ${cm(base)} et la hauteur correspondante mesure ${cm(hauteur)}. Quelle est son aire ?`,
        figure: figure(cm(hauteur)),
        correct: cm2(aire),
        // Le produit sans la moitié (pour le triangle), la moitié du produit (pour le parallélogramme), la somme, le périmètre.
        wrong: fauxMesures(aire, [triangle ? base * hauteur : (base * hauteur) / 2, base + hauteur, 2 * (base + hauteur), (base * hauteur) / 4, aire + base, aire - hauteur], cm2, { decimales: 1 }),
        explanation: triangle ? `Aire du triangle = base × hauteur ÷ 2 = ${base} × ${hauteur} ÷ 2 = ${nb(aire)} cm².` : `Aire du parallélogramme = base × hauteur = ${base} × ${hauteur} = ${nb(aire)} cm².`,
      });
    }
    return question(rng, {
      detail: identifiant('hauteur', figureNom, base, hauteur, lettres.join('')),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Un ${figureNom} a une aire de ${cm2(aire)} et une base de ${cm(base)}. Quelle est la hauteur correspondante ?`,
      figure: figure('?'),
      correct: cm(hauteur),
      // La division oubliée du doublement (pour le triangle), l'aire diminuée de la base, le produit.
      wrong: fauxMesures(hauteur, [triangle ? aire / base : 2 * hauteur, aire - base, aire * base, hauteur + 1, hauteur - 1, hauteur * 2, aire / base + 1], cm, { decimales: 1 }),
      explanation: triangle ? `Aire = base × hauteur ÷ 2, donc hauteur = 2 × ${nb(aire)} ÷ ${base} = ${nb(hauteur)} cm.` : `Aire = base × hauteur, donc hauteur = ${nb(aire)} ÷ ${base} = ${nb(hauteur)} cm.`,
    });
  },
};

const aireDuDisque: Family = {
  name: 'aire-du-disque',
  minStage: 12,
  make: (rng) => {
    const variante = rngInt(rng, 0, 2);
    const rayon = rngInt(rng, 2, 12);
    const pi = (n: number) => `${nb(n)}π cm²`;
    if (variante === 2) {
      const aire = Math.round(314 * rayon * rayon) / 100;
      return question(rng, {
        detail: identifiant('disque-approche', rayon),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Un disque a pour rayon ${cm(rayon)}. Quelle est son aire, en prenant 3,14 pour valeur de π ?`,
        figure: disqueAvecRayon(cm(rayon), false, 'Un disque de centre O, dont un rayon est tracé et mesuré.'),
        correct: cm2(aire),
        // Le périmètre, le rayon au lieu du carré du rayon, le diamètre au carré.
        wrong: fauxMesures(aire, [Math.round(314 * 2 * rayon) / 100, Math.round(314 * rayon) / 100, Math.round(314 * 4 * rayon * rayon) / 100, Math.round((314 * rayon * rayon) / 2) / 100, aire + 3.14, aire - 3.14], cm2, { decimales: 2 }),
        explanation: `Aire du disque = π × rayon × rayon = 3,14 × ${rayon} × ${rayon} = ${nb(aire)} cm².`,
      });
    }
    const diametre = variante === 1;
    return question(rng, {
      detail: identifiant('disque', variante, rayon),
      instruction: INSTRUCTION_FIGURE,
      prompt: diametre ? `Un disque a pour diamètre ${cm(2 * rayon)}. Quelle est son aire exacte ?` : `Un disque a pour rayon ${cm(rayon)}. Quelle est son aire exacte ?`,
      figure: disqueAvecRayon(cm(diametre ? 2 * rayon : rayon), diametre, diametre ? 'Un disque de centre O, dont un diamètre est tracé et mesuré.' : 'Un disque de centre O, dont un rayon est tracé et mesuré.'),
      correct: pi(rayon * rayon),
      // Le diamètre au carré, le double du rayon, le rayon seul, le périmètre.
      wrong: [pi(4 * rayon * rayon), pi(2 * rayon), pi(rayon), pi(rayon * rayon * 2), pi(rayon * rayon + rayon), pi(rayon * rayon - rayon)].filter((texte) => texte !== pi(rayon * rayon)),
      explanation: `Aire du disque = π × rayon². Le rayon est ${nb(rayon)} cm : π × ${nb(rayon)}² = ${nb(rayon * rayon)}π cm².`,
    });
  },
};

const volumePrismeCylindre: Family = {
  name: 'volume-prisme-cylindre',
  minStage: 12,
  make: (rng) => {
    const variante = rngInt(rng, 0, 2);
    if (variante === 0) {
      const [aire, hauteur] = [rngInt(rng, 4, 40), rngInt(rng, 2, 15)];
      return question(rng, {
        detail: identifiant('prisme', aire, hauteur),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Un prisme droit a pour base un triangle d'aire ${cm2(aire)} et pour hauteur ${cm(hauteur)}. Quel est son volume ?`,
        figure: polyhedronFigure(triangularPrism(), 'Un prisme droit dont les bases sont des triangles, dessiné en perspective.'),
        correct: cm3(aire * hauteur),
        // La somme, la moitié du produit, la mauvaise unité.
        wrong: [cm3(aire + hauteur), cm3((aire * hauteur) / 2), cm2(aire * hauteur), cm3(aire * hauteur * 3), cm3(aire * hauteur + aire), cm3(2 * (aire + hauteur))].filter((texte) => texte !== cm3(aire * hauteur)),
        explanation: `Volume = aire de la base × hauteur = ${aire} × ${hauteur} = ${nb(aire * hauteur)} cm³.`,
      });
    }
    const [rayon, hauteur] = [rngInt(rng, 2, 9), rngInt(rng, 2, 12)];
    if (variante === 1) {
      const pi = (n: number) => `${nb(n)}π cm³`;
      const juste = rayon * rayon * hauteur;
      return question(rng, {
        detail: identifiant('cylindre', rayon, hauteur),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Un cylindre a pour rayon de base ${cm(rayon)} et pour hauteur ${cm(hauteur)}. Quel est son volume exact ?`,
        figure: roundSolidFigure('cylindre'),
        correct: pi(juste),
        // L'aire latérale, le rayon à la place de son carré, la hauteur au carré.
        wrong: [pi(2 * rayon * hauteur), pi(rayon * hauteur), pi(rayon * hauteur * hauteur), pi(rayon * rayon), pi(juste * 2), pi(juste + rayon)].filter((texte) => texte !== pi(juste)),
        explanation: `Volume = aire de la base × hauteur = π × ${nb(rayon)}² × ${nb(hauteur)} = ${nb(juste)}π cm³.`,
      });
    }
    const volume = Math.round(314 * rayon * rayon * hauteur) / 100;
    return question(rng, {
      detail: identifiant('cylindre-approche', rayon, hauteur),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Une boîte cylindrique a pour rayon de base ${cm(rayon)} et pour hauteur ${cm(hauteur)}. Quel est son volume, en prenant 3,14 pour valeur de π ?`,
      figure: roundSolidFigure('cylindre'),
      correct: cm3(volume),
      wrong: fauxMesures(volume, [Math.round(314 * 2 * rayon * hauteur) / 100, Math.round(314 * rayon * hauteur) / 100, Math.round(314 * rayon * rayon) / 100, volume * 2, volume / 2, volume + 3.14], cm3, { decimales: 2 }),
      explanation: `Volume = π × rayon² × hauteur = 3,14 × ${rayon} × ${rayon} × ${hauteur} = ${nb(volume)} cm³.`,
    });
  },
};

export const FAMILLES_CINQUIEME_T3: Family[] = [parallelogrammeProprietes, aireDeFigures, aireDuDisque, volumePrismeCylindre];

/** Les familles de la 5e, dans l'ordre où le programme les amène. */
export const FAMILLES_CINQUIEME: Family[] = [...FAMILLES_CINQUIEME_T1, ...FAMILLES_CINQUIEME_T2, ...FAMILLES_CINQUIEME_T3];

