import { rngInt, rngPick, rngShuffle } from '../lib/seededRandom';
import type { Family } from './geometrieCommun';
import { triangleEmboite, triangleEmboiteAvecAngles, triangleRectangle } from './geometrieDessinsCollege';
import { cm, coordonnees, degres, fauxMesures, identifiant, INSTRUCTION, INSTRUCTION_FIGURE, lettresDeFigure, lettresDeTriangle, question, repereDePoints, sontEcartes } from './geometrieCollege';
import { flecheDuRepere } from './figuresCycle4';
import { entre, nb } from './mathsCycle4';

/**
 * La géométrie de la 4e (ancien programme de cycle 4, BO n° 31 du 30 juillet
 * 2020, repères annuels de 2019).
 *
 * - 1er trimestre : l'inégalité triangulaire, les angles d'un triangle coupé
 *   par une parallèle à un côté, les symétries dans un repère (révision) ;
 * - 2e trimestre : le théorème de Pythagore et sa réciproque, la translation,
 *   la caractérisation du parallélogramme ;
 * - 3e trimestre : le cosinus (une longueur, un angle), le théorème de Thalès
 *   dans les triangles emboîtés et sa réciproque.
 *
 * Hors programme, donc absent : le sinus et la tangente, Thalès en papillon,
 * l'homothétie, la rotation, la sphère et la boule. Le théorème de Thalès et le
 * cosinus sont placés au 3e trimestre, le plus tard possible dans l'année que
 * les repères de 2019 leur donnent (À VÉRIFIER dans programmes/maths.md).
 */

// === 1er trimestre (étape 13) =====================================================================================

const inegaliteTriangulaire: Family = {
  name: 'inegalite-triangulaire',
  minStage: 13,
  make: (rng) => {
    const variante = rngInt(rng, 0, 3);
    if (variante <= 2) {
      const [a, b, c] = lettresDeTriangle(rng);
      const [premier, second] = [rngInt(rng, 3, 14), rngInt(rng, 2, 12)];
      const [petit, grand] = [Math.min(premier, second), Math.max(premier, second)];
      const [bas, haut] = [grand - petit, premier + second];
      // Une valeur possible (strictement entre les deux bornes), puis des valeurs impossibles : les bornes elles-mêmes (triangle aplati) et au-delà.
      const possibles = Array.from({ length: haut - bas - 1 }, (_, rang) => bas + 1 + rang);
      const juste = rngPick(rng, possibles);
      const impossibles = [bas, haut, haut + 1, haut + 2, haut + 4, bas - 1, bas - 2].filter((valeur) => valeur >= 1 && (valeur <= bas || valeur >= haut));
      return question(rng, {
        detail: identifiant('encadrement', a, b, c, premier, second, juste),
        instruction: INSTRUCTION,
        prompt: `Dans un triangle ${a}${b}${c}, on a ${a}${b} = ${cm(premier)} et ${a}${c} = ${cm(second)}. Quelle valeur peut avoir ${b}${c} ?`,
        correct: cm(juste),
        // Les deux bornes (le triangle serait aplati), une valeur trop grande, une valeur trop petite.
        wrong: impossibles.map(cm),
        explanation: `Chaque côté est plus petit que la somme des deux autres : ${b}${c} < ${premier} + ${second} = ${haut}, et ${b}${c} > ${grand} − ${petit} = ${bas}. Donc ${b}${c} est entre ${bas} cm et ${haut} cm.`,
      });
    }
    // Quel triplet de longueurs permet de construire un triangle ?
    const [petit, moyen] = [rngInt(rng, 3, 9), rngInt(rng, 4, 10)];
    const [a, b] = [Math.min(petit, moyen), Math.max(petit, moyen)];
    const possible: [number, number, number] = [a, b, rngInt(rng, b - a + 1, a + b - 1)];
    const aplati: [number, number, number] = [a + 1, b + 1, a + b + 2];
    const trop: [number, number, number] = [a, b + 1, a + b + rngInt(rng, 2, 6) + 1];
    const autre: [number, number, number] = [a + 2, 2 * a + 1, 3 * a + 5];
    const ecrire = ([x, y, z]: [number, number, number]) => `${cm(x)}, ${cm(y)} et ${cm(z)}`;
    const triplets = [possible, aplati, trop, autre];
    return question(rng, {
      detail: identifiant('triplet', ...triplets.flat()),
      instruction: INSTRUCTION,
      prompt: 'Un seul de ces ensembles de trois longueurs permet de construire un triangle. Lequel ?',
      correct: ecrire(possible),
      wrong: [aplati, trop, autre].map(ecrire),
      explanation: `Il faut que le plus grand côté soit plus petit que la somme des deux autres : ${nb(possible[0])} + ${nb(possible[1])} = ${nb(possible[0] + possible[1])} est plus grand que ${nb(possible[2])}.`,
    });
  },
};

const anglesTriangleEtParallele: Family = {
  name: 'angles-triangle-parallele',
  minStage: 13,
  make: (rng) => {
    const [a, b, c, d, e] = lettresDeFigure(rng, 5);
    const [angleB, angleC] = [rngInt(rng, 35, 85), rngInt(rng, 35, 85)];
    if (angleB === angleC || angleB + angleC > 150) return anglesTriangleEtParallele.make(rng, 13);
    const angleA = 180 - angleB - angleC;
    const [cherche, juste, nom] = rngPick(rng, [
      ['en D', angleB, `${a}${d}${e}`],
      ['en E', angleC, `${a}${e}${d}`],
      ['en A', angleA, `${b}${a}${c}`],
    ] as [string, number, string][]);
    const { figure } = triangleEmboiteAvecAngles(angleB, angleC, rngPick(rng, [0.4, 0.5, 0.6]), [a, b, c, d, e], `Un triangle ${a}${b}${c} et un segment [${d}${e}] parallèle à [${b}${c}], avec ${d} sur [${a}${b}] et ${e} sur [${a}${c}].`);
    return question(rng, {
      detail: identifiant('parallele', a, b, c, d, e, angleB, angleC, cherche),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Dans le triangle ${a}${b}${c}, le point ${d} est sur [${a}${b}] et le point ${e} est sur [${a}${c}]. Les droites (${d}${e}) et (${b}${c}) sont parallèles. L'angle ${a}${b}${c} mesure ${degres(angleB)} et l'angle ${a}${c}${b} mesure ${degres(angleC)}. Combien mesure l'angle ${nom} ?`,
      figure,
      correct: degres(juste),
      // Le supplémentaire à la place de l'égal, l'autre angle de la base, la somme des deux angles donnés.
      wrong: fauxMesures(juste, [180 - juste, angleB, angleC, angleA, angleB + angleC, 180 - angleB, juste + 10, juste - 10], degres, { min: 1, max: 179 }),
      explanation:
        cherche === 'en A'
          ? `La somme des angles du triangle vaut 180° : 180 − ${angleB} − ${angleC} = ${angleA}.`
          : `Les droites (${d}${e}) et (${b}${c}) sont parallèles : les angles ${nom} et ${cherche === 'en D' ? `${a}${b}${c}` : `${a}${c}${b}`} sont correspondants, donc égaux.`,
    });
  },
};

const symetriesDansUnRepere: Family = {
  name: 'symetries-repere',
  minStage: 13,
  make: (rng) => {
    const valeurs = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
    const [x, y] = [rngPick(rng, valeurs), rngPick(rng, valeurs)];
    const [lettre] = lettresDeFigure(rng, 1);
    const variante = rngInt(rng, 0, 2);
    const cas = [
      { axe: "l'axe des abscisses", image: coordonnees(x, -y) },
      { axe: "l'axe des ordonnées", image: coordonnees(-x, y) },
      { axe: "l'origine O", image: coordonnees(-x, -y) },
    ][variante];
    const autres = [coordonnees(x, -y), coordonnees(-x, y), coordonnees(-x, -y), coordonnees(y, x), coordonnees(-y, -x)].filter((texte) => texte !== cas.image);
    return question(rng, {
      detail: identifiant('symetries', lettre, x, y, variante),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Dans un repère, le point ${lettre} a pour coordonnées ${coordonnees(x, y)}. Quelles sont les coordonnées de son symétrique par rapport à ${cas.axe} ?`,
      figure: repereDePoints(-5, 5, [{ lettre: 'O', x: 0, y: 0 }, { lettre, x, y }], `Un repère quadrillé avec l'origine O et le point ${lettre}.`),
      correct: cas.image,
      // Les images par les deux autres symétries, les nombres échangés.
      wrong: autres,
      explanation:
        variante === 0
          ? `Par rapport à l'axe des abscisses, l'abscisse ne change pas et l'ordonnée change de signe : ${cas.image}.`
          : variante === 1
            ? `Par rapport à l'axe des ordonnées, l'ordonnée ne change pas et l'abscisse change de signe : ${cas.image}.`
            : `Par rapport à l'origine, les deux coordonnées changent de signe : ${cas.image}.`,
    });
  },
};

export const FAMILLES_QUATRIEME_T1: Family[] = [inegaliteTriangulaire, anglesTriangleEtParallele, symetriesDansUnRepere];

// === 2e trimestre (étape 14) ======================================================================================

/** Des triplets pythagoriciens : (a, b, c) avec a² + b² = c². */
const TRIPLETS: [number, number, number][] = [
  [3, 4, 5],
  [6, 8, 10],
  [9, 12, 15],
  [12, 16, 20],
  [15, 20, 25],
  [5, 12, 13],
  [10, 24, 26],
  [15, 36, 39],
  [8, 15, 17],
  [16, 30, 34],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
];

const pythagoreLongueur: Family = {
  name: 'pythagore-longueur',
  minStage: 14,
  make: (rng) => {
    const [r, p, q] = lettresDeTriangle(rng);
    const [x, y, hypotenuse] = rngPick(rng, TRIPLETS);
    // Les deux côtés de l'angle droit : [RP] et [RQ], dans un ordre tiré au sort.
    const [rp, rq] = rng() < 0.5 ? [x, y] : [y, x];
    const cherche = rngInt(rng, 0, 2);
    const nom = `${r}${p}${q}`;
    if (cherche === 0) {
      return question(rng, {
        detail: identifiant('hypotenuse', nom, rp, rq),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${r}${p} = ${cm(rp)} et ${r}${q} = ${cm(rq)}. Calcule ${p}${q}.`,
        figure: triangleRectangle(rq / rp, [r, p, q], [cm(rp), '?', cm(rq)], [], `Un triangle ${nom} rectangle en ${r}, dont l'hypoténuse porte un point d'interrogation.`),
        correct: cm(hypotenuse),
        // Les côtés additionnés, la différence, la somme des carrés sans la racine.
        wrong: fauxMesures(hypotenuse, [rp + rq, Math.abs(rq - rp), rp * rp + rq * rq, hypotenuse + 1, hypotenuse - 1, rp * rq, hypotenuse + 2], cm, { min: 1, decimales: 0 }),
        explanation: `Le triangle ${nom} est rectangle en ${r} : d'après le théorème de Pythagore, ${p}${q}² = ${r}${p}² + ${r}${q}² = ${rp * rp} + ${rq * rq} = ${hypotenuse * hypotenuse}. Donc ${p}${q} = ${hypotenuse} cm.`,
      });
    }
    const [connu, inconnu] = cherche === 1 ? [rp, rq] : [rq, rp];
    const [nomConnu, nomInconnu] = cherche === 1 ? [`${r}${p}`, `${r}${q}`] : [`${r}${q}`, `${r}${p}`];
    return question(rng, {
      detail: identifiant('cote', nom, connu, inconnu, cherche),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${p}${q} = ${cm(hypotenuse)} et ${nomConnu} = ${cm(connu)}. Calcule ${nomInconnu}.`,
      figure: triangleRectangle(rq / rp, [r, p, q], [cherche === 1 ? cm(connu) : '?', cm(hypotenuse), cherche === 1 ? '?' : cm(connu)], [], `Un triangle ${nom} rectangle en ${r}, dont un côté de l'angle droit porte un point d'interrogation.`),
      correct: cm(inconnu),
      // Le côté connu retranché de l'hypoténuse, la somme, la différence des carrés sans la racine.
      wrong: fauxMesures(inconnu, [hypotenuse - connu, hypotenuse + connu, hypotenuse * hypotenuse - connu * connu, inconnu + 1, inconnu - 1, hypotenuse * connu, inconnu + 2], cm, { min: 1, decimales: 0 }),
      explanation: `L'hypoténuse est [${p}${q}] : d'après le théorème de Pythagore, ${nomInconnu}² = ${p}${q}² − ${nomConnu}² = ${hypotenuse * hypotenuse} − ${connu * connu} = ${inconnu * inconnu}. Donc ${nomInconnu} = ${inconnu} cm.`,
    });
  },
};

const pythagoreReciproque: Family = {
  name: 'pythagore-reciproque',
  minStage: 14,
  make: (rng) => {
    const [r, p, q] = lettresDeTriangle(rng);
    const rectangle = rng() < 0.5;
    const [x, y, z] = rngPick(rng, TRIPLETS.slice(0, 9));
    // Pas rectangle : l'hypoténuse s'allonge, mais pas jusqu'à aplatir le triangle (x + y doit rester plus grand que z + k).
    const [petit, moyen, grand] = rectangle ? [x, y, z] : [x, y, z + rngInt(rng, 1, Math.min(3, x + y - z - 1))];
    // La somme des carrés des deux petits côtés n'égale pas le carré du grand : jamais par hasard.
    const vraiment = petit * petit + moyen * moyen === grand * grand;
    const cotes = rngShuffle(rng, [petit, moyen, grand]);
    const relation = (conclusion: string, signe: string) => `${conclusion} : ${petit}² + ${moyen}² ${signe} ${grand}²`;
    const [bonneConclusion, bonSigne] = vraiment ? ['Oui', '='] : ['Non', '≠'];
    const nom = `${r}${p}${q}`;
    return question(rng, {
      detail: identifiant('reciproque', nom, ...cotes),
      instruction: INSTRUCTION,
      prompt: `Un triangle ${nom} a pour côtés ${cm(cotes[0])}, ${cm(cotes[1])} et ${cm(cotes[2])}. Est-il rectangle ?`,
      correct: relation(bonneConclusion, bonSigne),
      // La conclusion contraire, la relation contraire, les deux à la fois.
      wrong: [relation(vraiment ? 'Non' : 'Oui', bonSigne), relation(bonneConclusion, vraiment ? '≠' : '='), relation(vraiment ? 'Non' : 'Oui', vraiment ? '≠' : '=')],
      explanation: vraiment
        ? `Le plus grand côté mesure ${grand} cm. ${petit}² + ${moyen}² = ${petit * petit + moyen * moyen} et ${grand}² = ${grand * grand} : les deux nombres sont égaux, donc le triangle est rectangle.`
        : `Le plus grand côté mesure ${grand} cm. ${petit}² + ${moyen}² = ${petit * petit + moyen * moyen} et ${grand}² = ${grand * grand} : ces nombres sont différents, donc le triangle n'est pas rectangle.`,
    });
  },
};

const translationDansUnRepere: Family = {
  name: 'translation-repere',
  minStage: 14,
  make: (rng) => {
    for (;;) {
      const [a, b] = [rngPick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]), rngPick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4])];
      const [u, v] = [rngPick(rng, [-4, -3, -2, -1, 1, 2, 3, 4]), rngPick(rng, [-4, -3, -2, -1, 1, 2, 3, 4])];
      const [m, n] = [rngPick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]), rngPick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4])];
      const [a2, b2] = [a + u, b + v];
      const [m2, n2] = [m + u, n + v];
      const dedans = (valeur: number) => Math.abs(valeur) <= 5;
      // Les trois points dessinés (le point, son image, l'autre point) sont écartés les uns des autres : leurs noms ne se superposent pas.
      if (!dedans(a2) || !dedans(b2) || !dedans(m2) || !dedans(n2) || !sontEcartes([{ x: a, y: b }, { x: a2, y: b2 }, { x: m, y: n }])) continue;
      const [lettre, image] = lettresDeFigure(rng, 2);
      const figure = repereDePoints(
        -5,
        5,
        [{ lettre, x: a, y: b }, { lettre: `${lettre}'`, x: a2, y: b2 }, { lettre: image, x: m, y: n }],
        `Un repère quadrillé avec le point ${lettre}, son image ${lettre}' et le point ${image}.`,
        (px, py) => flecheDuRepere(px, py, [a, b], [a2, b2])
      );
      return question(rng, {
        detail: identifiant('translation', lettre, image, a, b, a2, b2, m, n),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Dans un repère, la translation qui transforme ${lettre}${coordonnees(a, b)} en ${lettre}'${coordonnees(a2, b2)} transforme ${image}${coordonnees(m, n)} en ${image}'. Quelles sont les coordonnées de ${image}' ?`,
        figure,
        correct: coordonnees(m2, n2),
        // La translation dans l'autre sens, les coordonnées additionnées, le déplacement lui-même.
        wrong: [coordonnees(m - u, n - v), coordonnees(m + a2, n + b2), coordonnees(u, v), coordonnees(m2, n), coordonnees(m, n2), coordonnees(m + u, n - v), coordonnees(m - u, n + v), coordonnees(m + v, n + u)].filter((texte) => texte !== coordonnees(m2, n2)),
        explanation: `Le déplacement est de ${nb(u)} en abscisse et de ${nb(v)} en ordonnée (${nb(a2)} − ${entre(a)} et ${nb(b2)} − ${entre(b)}). On l'applique à ${image} : ${nb(m)} + ${entre(u)} = ${nb(m2)} et ${nb(n)} + ${entre(v)} = ${nb(n2)}.`,
      });
    }
  },
};

/** Ce que les propriétés d'un quadrilatère permettent d'affirmer, de la plus générale à la plus précise. */
const NATURES = ['un parallélogramme', 'un losange', 'un rectangle', 'un carré'];

const caracterisation: Family = {
  name: 'parallelogramme-caracterisation',
  minStage: 14,
  make: (rng) => {
    const [p, q, r, s] = lettresDeFigure(rng, 4);
    const nom = `${p}${q}${r}${s}`;
    const [x, y] = [rngInt(rng, 3, 9), rngInt(rng, 3, 9)];
    const [longueur, largeur] = [Math.max(x, y) + 1, Math.min(x, y)];
    const faits: { fait: string; nature: string }[] = [
      { fait: `Les diagonales du quadrilatère ${nom} se coupent en leur milieu.`, nature: 'un parallélogramme' },
      { fait: `Les côtés opposés du quadrilatère ${nom} sont parallèles deux à deux.`, nature: 'un parallélogramme' },
      { fait: `On a ${p}${q} = ${s}${r} = ${cm(longueur)} et ${q}${r} = ${s}${p} = ${cm(largeur)}.`, nature: 'un parallélogramme' },
      { fait: `Les côtés [${p}${q}] et [${s}${r}] sont parallèles et de même longueur.`, nature: 'un parallélogramme' },
      { fait: `${nom} est un parallélogramme qui a un angle droit.`, nature: 'un rectangle' },
      { fait: `${nom} est un parallélogramme dont les diagonales ont la même longueur.`, nature: 'un rectangle' },
      { fait: `${nom} a trois angles droits.`, nature: 'un rectangle' },
      { fait: `${nom} est un parallélogramme dont deux côtés consécutifs ont la même longueur.`, nature: 'un losange' },
      { fait: `${nom} est un parallélogramme dont les diagonales sont perpendiculaires.`, nature: 'un losange' },
      { fait: `${nom} a ses quatre côtés de même longueur.`, nature: 'un losange' },
      { fait: `${nom} est un losange qui a un angle droit.`, nature: 'un carré' },
      { fait: `${nom} est un rectangle dont deux côtés consécutifs ont la même longueur.`, nature: 'un carré' },
    ];
    const choisi = rngPick(rng, faits);
    return question(rng, {
      detail: identifiant('nature', nom, choisi.nature, choisi.fait.slice(0, 40), longueur, largeur),
      instruction: INSTRUCTION,
      prompt: `${choisi.fait} Quelle est la nature la plus précise que l'on peut affirmer pour ${nom} ?`,
      correct: choisi.nature,
      wrong: NATURES.filter((nature) => nature !== choisi.nature),
      explanation: `${choisi.nature.charAt(0).toUpperCase()}${choisi.nature.slice(1)} : c'est ce que cette propriété permet d'affirmer, sans rien de plus.`,
    });
  },
};

export const FAMILLES_QUATRIEME_T2: Family[] = [pythagoreLongueur, pythagoreReciproque, translationDansUnRepere, caracterisation];

// === 3e trimestre (étape 15) ======================================================================================

const arrondi = (n: number, decimales: number): number => Math.round(n * 10 ** decimales) / 10 ** decimales;
const rad = (degresValeur: number): number => (degresValeur * Math.PI) / 180;

const cosinusLongueur: Family = {
  name: 'cosinus-longueur',
  minStage: 15,
  make: (rng) => {
    const [r, p, q] = lettresDeTriangle(rng);
    const nom = `${r}${p}${q}`;
    const angle = rngPick(rng, [25, 30, 35, 40, 50, 55, 60, 65]);
    const adjacent = rngInt(rng, 4, 16);
    const cherche = rng() < 0.5;
    const figure = (cotes: [string | null, string | null, string | null]) =>
      triangleRectangle(Math.tan(rad(angle)), [r, p, q], cotes, [{ sommet: 1, texte: degres(angle) }], `Un triangle ${nom} rectangle en ${r}, dont l'angle en ${p} est marqué.`);
    if (cherche) {
      // L'hypoténuse, connaissant le côté adjacent à l'angle.
      const juste = arrondi(adjacent / Math.cos(rad(angle)), 1);
      return question(rng, {
        detail: identifiant('hypotenuse', nom, adjacent, angle),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${r}${p} = ${cm(adjacent)} et l'angle ${r}${p}${q} mesure ${degres(angle)}. Calcule ${p}${q}, arrondie au dixième.`,
        figure: figure([cm(adjacent), '?', null]),
        correct: cm(juste),
        // Le cosinus multiplié au lieu de diviser, le sinus, la tangente.
        wrong: fauxMesures(juste, [arrondi(adjacent * Math.cos(rad(angle)), 1), arrondi(adjacent / Math.sin(rad(angle)), 1), arrondi(adjacent / Math.tan(rad(angle)), 1), arrondi(adjacent * Math.sin(rad(angle)), 1), arrondi(adjacent * Math.tan(rad(angle)), 1)], cm, { decimales: 1 }),
        explanation: `Dans le triangle rectangle ${nom}, cos(${angle}°) = ${r}${p} ÷ ${p}${q}. Donc ${p}${q} = ${adjacent} ÷ cos(${angle}°) ≈ ${nb(juste)} cm.`,
      });
    }
    // Le côté adjacent, connaissant l'hypoténuse.
    const hypotenuse = rngInt(rng, 6, 20);
    const juste = arrondi(hypotenuse * Math.cos(rad(angle)), 1);
    return question(rng, {
      detail: identifiant('adjacent', nom, hypotenuse, angle),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${p}${q} = ${cm(hypotenuse)} et l'angle ${r}${p}${q} mesure ${degres(angle)}. Calcule ${r}${p}, arrondie au dixième.`,
      figure: figure(['?', cm(hypotenuse), null]),
      correct: cm(juste),
      // Le cosinus divisé au lieu de multiplier, le sinus, la tangente.
      wrong: fauxMesures(juste, [arrondi(hypotenuse / Math.cos(rad(angle)), 1), arrondi(hypotenuse * Math.sin(rad(angle)), 1), arrondi(hypotenuse * Math.tan(rad(angle)), 1), arrondi(hypotenuse / Math.sin(rad(angle)), 1), arrondi(hypotenuse / Math.tan(rad(angle)), 1)], cm, { decimales: 1 }),
      explanation: `Dans le triangle rectangle ${nom}, cos(${angle}°) = ${r}${p} ÷ ${p}${q}. Donc ${r}${p} = ${hypotenuse} × cos(${angle}°) ≈ ${nb(juste)} cm.`,
    });
  },
};

const cosinusAngle: Family = {
  name: 'cosinus-angle',
  minStage: 15,
  make: (rng) => {
    for (;;) {
      const [r, p, q] = lettresDeTriangle(rng);
      const nom = `${r}${p}${q}`;
      const hypotenuse = rngInt(rng, 6, 20);
      const adjacent = rngInt(rng, 3, hypotenuse - 1);
      const angle = (Math.acos(adjacent / hypotenuse) * 180) / Math.PI;
      const juste = Math.round(angle);
      const [par_sinus, par_tangente] = [Math.round((Math.asin(adjacent / hypotenuse) * 180) / Math.PI), Math.round((Math.atan(adjacent / hypotenuse) * 180) / Math.PI)];
      const complementaire = 90 - juste;
      // Aucune proposition ne doit tomber sur la bonne réponse après arrondi.
      if ([par_sinus, par_tangente, complementaire].some((valeur) => valeur === juste) || Math.abs(angle - 45) < 3 || angle < 25 || angle > 65 || Math.abs(angle - juste) < 0.1) continue;
      const opposeAuCarre = hypotenuse * hypotenuse - adjacent * adjacent;
      return question(rng, {
        detail: identifiant('angle', nom, adjacent, hypotenuse),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${r}${p} = ${cm(adjacent)} et ${p}${q} = ${cm(hypotenuse)}. Calcule l'angle ${r}${p}${q}, arrondi au degré.`,
        figure: triangleRectangle(Math.sqrt(opposeAuCarre) / adjacent, [r, p, q], [cm(adjacent), cm(hypotenuse), null], [{ sommet: 1, texte: '?' }], `Un triangle ${nom} rectangle en ${r}, dont l'angle en ${p} porte un point d'interrogation.`),
        correct: degres(juste),
        // Le sinus ou la tangente à la place du cosinus, le complémentaire de l'angle.
        wrong: fauxMesures(juste, [par_sinus, par_tangente, complementaire, juste + 5, juste - 5, 90 - par_sinus], degres, { min: 1, max: 89, decimales: 0 }),
        explanation: `Dans le triangle rectangle ${nom}, cos(${r}${p}${q}) = ${r}${p} ÷ ${p}${q} = ${adjacent} ÷ ${hypotenuse}. À la calculatrice, l'angle vaut environ ${juste}°.`,
      });
    }
  },
};

/** Les rapports AD/AB (= AE/AC = DE/BC) des figures de Thalès : p/q. */
const RAPPORTS_DE_THALES: [number, number][] = [[1, 2], [1, 3], [2, 3], [2, 5], [3, 5], [3, 4], [3, 8], [4, 5], [2, 7], [5, 8]];
const UNITES_DE_THALES = [0.5, 1, 1.5, 2, 2.5, 3];

const thalesEmboites: Family = {
  name: 'thales-emboites',
  minStage: 15,
  make: (rng) => {
    const [a, b, c, d, e] = lettresDeFigure(rng, 5);
    const [p, q] = rngPick(rng, RAPPORTS_DE_THALES);
    const [u, w, z] = [rngPick(rng, UNITES_DE_THALES), rngPick(rng, UNITES_DE_THALES), rngPick(rng, UNITES_DE_THALES)];
    const longueurs = { AB: q * u, AD: p * u, AC: q * w, AE: p * w, BC: q * z, DE: p * z };
    const lettre: Record<string, string> = { A: a, B: b, C: c, D: d, E: e };
    const nom = (cle: string) => `${lettre[cle[0]]}${lettre[cle[1]]}`;
    const variante = rngInt(rng, 0, 4);
    // [ce qu'on cherche, les trois longueurs données, le calcul].
    const cas: { cherche: keyof typeof longueurs; donnees: (keyof typeof longueurs)[]; juste: number; fausses: number[]; calcul: string }[] = [
      { cherche: 'BC', donnees: ['AD', 'AB', 'DE'], juste: longueurs.BC, fausses: [(longueurs.DE * longueurs.AD) / longueurs.AB, longueurs.DE + longueurs.AB - longueurs.AD, (longueurs.AB * longueurs.AD) / longueurs.DE], calcul: `${nom('BC')} = ${nom('DE')} × ${nom('AB')} ÷ ${nom('AD')}` },
      { cherche: 'DE', donnees: ['AD', 'AB', 'BC'], juste: longueurs.DE, fausses: [(longueurs.BC * longueurs.AB) / longueurs.AD, longueurs.BC - longueurs.AB + longueurs.AD, (longueurs.AB * longueurs.AD) / longueurs.BC], calcul: `${nom('DE')} = ${nom('BC')} × ${nom('AD')} ÷ ${nom('AB')}` },
      { cherche: 'AC', donnees: ['AD', 'AB', 'AE'], juste: longueurs.AC, fausses: [(longueurs.AE * longueurs.AD) / longueurs.AB, longueurs.AE + longueurs.AB - longueurs.AD, (longueurs.AB * longueurs.AD) / longueurs.AE], calcul: `${nom('AC')} = ${nom('AE')} × ${nom('AB')} ÷ ${nom('AD')}` },
      { cherche: 'AE', donnees: ['AD', 'AB', 'AC'], juste: longueurs.AE, fausses: [(longueurs.AC * longueurs.AB) / longueurs.AD, longueurs.AC - longueurs.AB + longueurs.AD, (longueurs.AB * longueurs.AD) / longueurs.AC], calcul: `${nom('AE')} = ${nom('AC')} × ${nom('AD')} ÷ ${nom('AB')}` },
      { cherche: 'AB', donnees: ['AD', 'AE', 'AC'], juste: longueurs.AB, fausses: [(longueurs.AD * longueurs.AE) / longueurs.AC, longueurs.AD + longueurs.AC - longueurs.AE, (longueurs.AC * longueurs.AE) / longueurs.AD], calcul: `${nom('AB')} = ${nom('AD')} × ${nom('AC')} ÷ ${nom('AE')}` },
    ];
    const { cherche, donnees, juste, fausses, calcul } = cas[variante];
    const { figure } = triangleEmboite(p / q, rngInt(rng, 0, 24), rngInt(rng, 0, 24), [a, b, c, d, e], `Un triangle ${a}${b}${c} et un segment [${d}${e}] parallèle à [${b}${c}], avec ${d} sur [${a}${b}] et ${e} sur [${a}${c}].`);
    const enonce = donnees.map((cle) => `${nom(cle)} = ${cm(longueurs[cle])}`);
    return question(rng, {
      detail: identifiant('thales', a, b, c, d, e, p, q, u, w, z, cherche),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Dans le triangle ${a}${b}${c}, le point ${d} est sur [${a}${b}] et le point ${e} est sur [${a}${c}]. Les droites (${d}${e}) et (${b}${c}) sont parallèles. On a ${enonce[0]}, ${enonce[1]} et ${enonce[2]}. Calcule ${nom(cherche)}.`,
      figure,
      correct: cm(juste),
      // Le rapport à l'envers, une addition à la place de la proportion, deux longueurs qui ne se correspondent pas.
      wrong: fauxMesures(juste, [...fausses.map((valeur) => arrondi(valeur, 1)), juste + 1, juste - 1, juste + 2], cm, { decimales: 1 }),
      explanation: `Les droites (${d}${e}) et (${b}${c}) sont parallèles : d'après le théorème de Thalès, ${nom('AD')}/${nom('AB')} = ${nom('AE')}/${nom('AC')} = ${nom('DE')}/${nom('BC')}. Donc ${calcul} = ${nb(juste)} cm.`,
    });
  },
};

const thalesReciproque: Family = {
  name: 'thales-reciproque',
  minStage: 15,
  make: (rng) => {
    const [a, b, c, d, e] = lettresDeFigure(rng, 5);
    const [p, q] = rngPick(rng, RAPPORTS_DE_THALES);
    const [u, w] = [rngPick(rng, UNITES_DE_THALES), rngPick(rng, UNITES_DE_THALES)];
    const parallele = rng() < 0.5;
    const [ad, ab, ac] = [p * u, q * u, q * w];
    // Parallèles : AE/AC = AD/AB. Sinon, AE est décalé d'un demi-centimètre ou d'un centimètre.
    const ae = parallele ? p * w : p * w + rngPick(rng, [-1, -0.5, 0.5, 1]);
    if (ae <= 0 || ae >= ac) return thalesReciproque.make(rng, 15);
    const vraiment = Math.abs(ad * ac - ae * ab) < 1e-9;
    const rapport = (conclusion: string, signe: string) => `${conclusion} : ${nb(ad)}/${nb(ab)} ${signe} ${nb(ae)}/${nb(ac)}`;
    const [bonneConclusion, bonSigne] = vraiment ? ['Oui', '='] : ['Non', '≠'];
    return question(rng, {
      detail: identifiant('reciproque', a, b, c, d, e, ad, ab, ae, ac),
      instruction: INSTRUCTION,
      prompt: `Dans le triangle ${a}${b}${c}, le point ${d} est sur [${a}${b}] et le point ${e} est sur [${a}${c}]. On a ${a}${d} = ${cm(ad)}, ${a}${b} = ${cm(ab)}, ${a}${e} = ${cm(ae)} et ${a}${c} = ${cm(ac)}. Les droites (${d}${e}) et (${b}${c}) sont-elles parallèles ?`,
      correct: rapport(bonneConclusion, bonSigne),
      // La conclusion contraire, la relation contraire, les deux à la fois.
      wrong: [rapport(vraiment ? 'Non' : 'Oui', bonSigne), rapport(bonneConclusion, vraiment ? '≠' : '='), rapport(vraiment ? 'Non' : 'Oui', vraiment ? '≠' : '=')],
      explanation: vraiment
        ? `On compare ${a}${d}/${a}${b} et ${a}${e}/${a}${c} : les deux quotients sont égaux (${nb(ad)} × ${nb(ac)} = ${nb(ae)} × ${nb(ab)}). D'après la réciproque du théorème de Thalès, les droites sont parallèles.`
        : `On compare ${a}${d}/${a}${b} et ${a}${e}/${a}${c} : ${nb(ad)} × ${nb(ac)} = ${nb(ad * ac)} et ${nb(ae)} × ${nb(ab)} = ${nb(ae * ab)}. Les quotients sont différents : les droites ne sont pas parallèles.`,
    });
  },
};

export const FAMILLES_QUATRIEME_T3: Family[] = [cosinusLongueur, cosinusAngle, thalesEmboites, thalesReciproque];

/** Les familles de la 4e, dans l'ordre où le programme les amène. */
export const FAMILLES_QUATRIEME: Family[] = [...FAMILLES_QUATRIEME_T1, ...FAMILLES_QUATRIEME_T2, ...FAMILLES_QUATRIEME_T3];
