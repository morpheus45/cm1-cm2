import { rngInt, rngPick, rngShuffle } from '../lib/seededRandom';
import type { Family } from './geometrieCommun';
import { solideFigure } from './geometrieDessins';
import { papillon, triangleRectangle } from './geometrieDessinsCollege';
import { cm, cm3, coordonnees, degres, fauxMesures, identifiant, INSTRUCTION, INSTRUCTION_FIGURE, lettresDeFigure, lettresDeTriangle, question, repereDePoints } from './geometrieCollege';
import { nb } from './mathsCycle4';

/**
 * La géométrie de la 3e (ancien programme de cycle 4, BO n° 31 du 30 juillet
 * 2020, repères annuels de 2019) : la fin du cycle, où l'on attend toutes les
 * notions du programme. Ce qui a été vu en 5e et en 4e revient en révision.
 *
 * - 1er trimestre : le théorème de Pythagore avec des longueurs qui ne sont
 *   pas entières (la racine carrée, la calculatrice), dans un triangle et dans
 *   une situation ;
 * - 2e trimestre : le théorème de Thalès en papillon et dans une situation
 *   (l'ombre d'un arbre), le sinus et la tangente (une longueur, un angle, le
 *   choix du bon rapport), la trigonométrie dans une situation ;
 * - 3e trimestre : l'homothétie (de rapport positif), la rotation, les volumes
 *   de la pyramide, du cône et de la boule, l'aire de la sphère, reconnaître
 *   une transformation.
 *
 * Hors programme, donc absent : les vecteurs, les angles inscrits,
 * l'homothétie de rapport négatif (À VÉRIFIER dans programmes/maths.md). Le
 * volume de la pyramide et du cône est au 3e trimestre de la 3e : la 4e le voit
 * peut-être (4e-T3, [PROP]), la 3e le revoit certainement.
 */

const arrondi = (n: number, decimales: number): number => Math.round(n * 10 ** decimales) / 10 ** decimales;
const rad = (angle: number): number => (angle * Math.PI) / 180;
const enDegres = (radians: number): number => (radians * 180) / Math.PI;
const minuscule = (texte: string): string => texte.charAt(0).toLowerCase() + texte.slice(1);
/** Un nombre qui s'écrit avec deux décimales au plus : 8 ou 13,5, pas 2,6666666. */
const fini = (n: number): boolean => Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;

// === 1er trimestre (étape 16) =====================================================================================

/** Pythagore dont la réponse n'est pas entière : la racine carrée d'un nombre qui n'est pas un carré, arrondie au dixième. */
const pythagoreAvecRacine: Family = {
  name: 'pythagore-racine',
  minStage: 16,
  make: (rng) => {
    const [r, p, q] = lettresDeTriangle(rng);
    const nom = `${r}${p}${q}`;
    const hypotenuseCherchee = rng() < 0.55;
    for (let essai = 0; essai < 1000; essai++) {
      if (hypotenuseCherchee) {
        const [rp, rq] = [rngInt(rng, 2, 12), rngInt(rng, 2, 12)];
        const carre = rp * rp + rq * rq;
        const racine = Math.sqrt(carre);
        // Ni un carré parfait, ni une racine presque entière (« 10,0 » laisserait croire qu'elle est exacte), ni un triangle trop plat pour le dessin.
        if (Number.isInteger(racine) || Math.abs(racine - Math.round(racine)) < 0.05 || rq / rp < 0.5 || rq / rp > 2) continue;
        const juste = arrondi(racine, 1);
        return question(rng, {
          detail: identifiant('hypotenuse', nom, rp, rq),
          instruction: INSTRUCTION_FIGURE,
          prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${r}${p} = ${cm(rp)} et ${r}${q} = ${cm(rq)}. Calcule la longueur ${p}${q}, arrondie au dixième.`,
          figure: triangleRectangle(rq / rp, [r, p, q], [cm(rp), '?', cm(rq)], [], `Un triangle ${nom} rectangle en ${r}, dont l'hypoténuse porte un point d'interrogation.`),
          correct: cm(juste),
          // Les côtés additionnés ou soustraits, le carré sans la racine, la racine arrondie à l'unité, la différence des carrés.
          wrong: fauxMesures(juste, [rp + rq, Math.abs(rq - rp), carre, Math.round(racine), arrondi(Math.sqrt(Math.abs(rq * rq - rp * rp)), 1), arrondi(juste + 0.5, 1), arrondi(juste - 0.4, 1)], cm, { decimales: 1 }),
          explanation: `Le triangle ${nom} est rectangle en ${r} : d'après le théorème de Pythagore, ${p}${q}² = ${rp}² + ${rq}² = ${carre}. Donc ${p}${q} = √${carre} ≈ ${nb(juste)} cm.`,
        });
      }
      const hypotenuse = rngInt(rng, 6, 16);
      const connu = rngInt(rng, 2, hypotenuse - 1);
      const carre = hypotenuse * hypotenuse - connu * connu;
      const racine = Math.sqrt(carre);
      if (Number.isInteger(racine) || Math.abs(racine - Math.round(racine)) < 0.05 || racine < 2 || racine / connu < 0.5 || racine / connu > 2) continue;
      const juste = arrondi(racine, 1);
      return question(rng, {
        detail: identifiant('cote', nom, hypotenuse, connu),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${p}${q} = ${cm(hypotenuse)} et ${r}${p} = ${cm(connu)}. Calcule la longueur ${r}${q}, arrondie au dixième.`,
        figure: triangleRectangle(racine / connu, [r, p, q], [cm(connu), cm(hypotenuse), '?'], [], `Un triangle ${nom} rectangle en ${r}, dont un côté de l'angle droit porte un point d'interrogation.`),
        correct: cm(juste),
        // La différence des longueurs, la somme des carrés, la différence des carrés sans la racine, la somme des longueurs.
        wrong: fauxMesures(juste, [hypotenuse - connu, arrondi(Math.sqrt(hypotenuse * hypotenuse + connu * connu), 1), carre, hypotenuse + connu, arrondi(juste + 0.5, 1), arrondi(juste - 0.4, 1)], cm, { decimales: 1 }),
        explanation: `L'hypoténuse est [${p}${q}] : d'après le théorème de Pythagore, ${r}${q}² = ${p}${q}² − ${r}${p}² = ${hypotenuse * hypotenuse} − ${connu * connu} = ${carre}. Donc ${r}${q} = √${carre} ≈ ${nb(juste)} cm.`,
      });
    }
    throw new Error('pythagore-racine : aucun tirage valable');
  },
};

type Mesure = 'pied' | 'hauteur' | 'longueur';

/**
 * Une situation qui cache un triangle rectangle. Ses mesures viennent d'un triplet pythagoricien mis à l'échelle (des
 * décimaux simples) : « pied » et « hauteur » sont les côtés de l'angle droit, « longueur » est l'hypoténuse. Chaque
 * énoncé ne cite que les deux mesures connues. `ordre` dit quel côté est le plus grand quand la situation l'impose : un
 * écran est plus large que haut, le pied d'une échelle est plus près du mur que sa hauteur.
 */
interface SituationDePythagore {
  unite: string;
  ordre?: 'pied-grand' | 'pied-petit';
  variantes: { triplet: [number, number, number]; echelles: number[] }[];
  enonce: Record<Mesure, (m: Record<Mesure, string>) => string>;
  question: Record<Mesure, string>;
}

const SITUATIONS: SituationDePythagore[] = [
  {
    unite: 'm',
    ordre: 'pied-petit',
    variantes: [
      { triplet: [3, 4, 5], echelles: [0.5, 1] },
      { triplet: [5, 12, 13], echelles: [0.5, 1] },
      { triplet: [8, 15, 17], echelles: [0.5] },
    ],
    enonce: {
      longueur: (m) => `Une échelle est appuyée contre un mur : son pied est à ${m.pied} du mur et elle touche le mur à ${m.hauteur} de hauteur.`,
      pied: (m) => `Une échelle de ${m.longueur} est appuyée contre un mur. Elle touche le mur à ${m.hauteur} de hauteur.`,
      hauteur: (m) => `Une échelle de ${m.longueur} est appuyée contre un mur : son pied est à ${m.pied} du mur.`,
    },
    question: { longueur: "Quelle est la longueur de l'échelle ?", pied: 'À quelle distance du mur son pied se trouve-t-il ?', hauteur: 'À quelle hauteur touche-t-elle le mur ?' },
  },
  {
    unite: 'cm',
    ordre: 'pied-grand',
    variantes: [
      { triplet: [3, 4, 5], echelles: [8, 10, 12] },
      { triplet: [8, 15, 17], echelles: [3, 4] },
    ],
    enonce: {
      longueur: (m) => `Un écran rectangulaire mesure ${m.pied} de large et ${m.hauteur} de haut.`,
      pied: (m) => `Un écran rectangulaire mesure ${m.hauteur} de haut et sa diagonale mesure ${m.longueur}.`,
      hauteur: (m) => `Un écran rectangulaire mesure ${m.pied} de large et sa diagonale mesure ${m.longueur}.`,
    },
    question: { longueur: 'Quelle est la longueur de sa diagonale ?', pied: 'Quelle est sa largeur ?', hauteur: 'Quelle est sa hauteur ?' },
  },
  {
    unite: 'm',
    ordre: 'pied-grand',
    variantes: [
      { triplet: [3, 4, 5], echelles: [4, 5, 10] },
      { triplet: [5, 12, 13], echelles: [4, 5] },
      { triplet: [7, 24, 25], echelles: [4, 5] },
      { triplet: [8, 15, 17], echelles: [4, 5] },
    ],
    enonce: {
      longueur: (m) => `Un terrain rectangulaire mesure ${m.pied} sur ${m.hauteur}.`,
      pied: (m) => `Un terrain rectangulaire a une diagonale de ${m.longueur} et un côté de ${m.hauteur}.`,
      hauteur: (m) => `Un terrain rectangulaire a une diagonale de ${m.longueur} et un côté de ${m.pied}.`,
    },
    question: { longueur: 'Quelle est la longueur de sa diagonale ?', pied: "Quelle est la longueur de l'autre côté ?", hauteur: "Quelle est la longueur de l'autre côté ?" },
  },
  {
    unite: 'm',
    variantes: [
      { triplet: [3, 4, 5], echelles: [0.5, 1, 2] },
      { triplet: [5, 12, 13], echelles: [0.5, 1] },
      { triplet: [8, 15, 17], echelles: [0.5, 1] },
    ],
    enonce: {
      longueur: (m) => `Un câble est tendu entre le sommet d'un mât vertical de ${m.hauteur} de haut et un point du sol situé à ${m.pied} du pied du mât.`,
      pied: (m) => `Un câble de ${m.longueur} est tendu entre le sommet d'un mât vertical de ${m.hauteur} de haut et le sol.`,
      hauteur: (m) => `Un câble de ${m.longueur} est tendu entre le sommet d'un mât vertical et un point du sol situé à ${m.pied} du pied du mât.`,
    },
    question: { longueur: 'Quelle est la longueur du câble ?', pied: 'À quelle distance du pied du mât le câble touche-t-il le sol ?', hauteur: 'Quelle est la hauteur du mât ?' },
  },
];

const pythagoreProbleme: Family = {
  name: 'pythagore-probleme',
  minStage: 16,
  make: (rng) => {
    const indice = rngInt(rng, 0, SITUATIONS.length - 1);
    const situation = SITUATIONS[indice];
    const {
      triplet: [x, y, z],
      echelles,
    } = rngPick(rng, situation.variantes);
    const echelle = rngPick(rng, echelles);
    const [petit, grand] = [arrondi(x * echelle, 2), arrondi(y * echelle, 2)];
    const [pied, hauteur] = situation.ordre === 'pied-grand' ? [grand, petit] : situation.ordre === 'pied-petit' ? [petit, grand] : rng() < 0.5 ? [grand, petit] : [petit, grand];
    const longueur = arrondi(z * echelle, 2);
    const cherche = rngPick<Mesure>(rng, ['longueur', 'longueur', 'pied', 'hauteur']);
    const valeurs: Record<Mesure, number> = { pied, hauteur, longueur };
    const ecrire = (valeur: number): string => `${nb(valeur)} ${situation.unite}`;
    const mesures: Record<Mesure, string> = { pied: ecrire(pied), hauteur: ecrire(hauteur), longueur: ecrire(longueur) };
    const juste = valeurs[cherche];
    const [a, b] = (['pied', 'hauteur', 'longueur'] as Mesure[]).filter((cle) => cle !== cherche).map((cle) => valeurs[cle]);
    const carreJuste = arrondi(juste * juste, 4);
    const cote = cherche === 'pied' ? hauteur : pied;
    return question(rng, {
      detail: identifiant('situation', indice, pied, hauteur, longueur, cherche),
      instruction: INSTRUCTION,
      prompt: `${situation.enonce[cherche](mesures)} ${situation.question[cherche]}`,
      correct: ecrire(juste),
      // Les deux mesures additionnées ou soustraites, les carrés additionnés ou soustraits sans la racine, la racine de la mauvaise opération.
      wrong: fauxMesures(
        juste,
        cherche === 'longueur' ? [a + b, Math.abs(b - a), arrondi(a * a + b * b, 2), juste + 1, juste - 1] : [a + b, Math.abs(b - a), carreJuste, arrondi(Math.sqrt(a * a + b * b), 2), juste + 1, juste - 1],
        ecrire,
        { decimales: 2 }
      ),
      explanation:
        cherche === 'longueur'
          ? `La longueur cherchée est l'hypoténuse d'un triangle rectangle : ${nb(a)}² + ${nb(b)}² = ${nb(carreJuste)}, puis √${nb(carreJuste)} = ${nb(juste)} ${situation.unite}.`
          : `Ici, ${nb(longueur)} ${situation.unite} est l'hypoténuse d'un triangle rectangle : ${nb(longueur)}² − ${nb(cote)}² = ${nb(carreJuste)}, puis √${nb(carreJuste)} = ${nb(juste)} ${situation.unite}.`,
    });
  },
};

export const FAMILLES_TROISIEME_T1: Family[] = [pythagoreAvecRacine, pythagoreProbleme];

// === 2e trimestre (étape 17) ======================================================================================

/** Les rapports AD/AB d'un papillon : une réduction ou, à l'envers, un agrandissement. */
const RAPPORTS: [number, number][] = [[1, 2], [1, 3], [2, 3], [2, 5], [3, 5], [3, 4], [3, 8], [4, 5], [2, 7], [5, 8]];
const UNITES = [0.5, 1, 1.5, 2, 2.5, 3];

const papillonAlt = (a: string, b: string, c: string, d: string, e: string): string => `Deux droites (${b}${d}) et (${c}${e}) qui se coupent en ${a}, et deux segments parallèles [${b}${c}] et [${d}${e}].`;

const thalesEnPapillon: Family = {
  name: 'thales-papillon',
  minStage: 17,
  make: (rng) => {
    const [a, b, c, d, e] = lettresDeFigure(rng, 5);
    const [p, q] = rngPick(rng, RAPPORTS);
    // Le rapport AD/AB = AE/AC = DE/BC : une réduction (p/q) ou un agrandissement (q/p).
    const [haut, bas] = rng() < 0.5 ? [p, q] : [q, p];
    const [u, w, z] = [rngPick(rng, UNITES), rngPick(rng, UNITES), rngPick(rng, UNITES)];
    const longueurs = { AB: bas * u, AD: haut * u, AC: bas * w, AE: haut * w, BC: bas * z, DE: haut * z };
    const lettre: Record<string, string> = { A: a, B: b, C: c, D: d, E: e };
    const nom = (cle: string) => `${lettre[cle[0]]}${lettre[cle[1]]}`;
    const cas: { cherche: keyof typeof longueurs; donnees: (keyof typeof longueurs)[]; fausses: number[]; calcul: string }[] = [
      { cherche: 'DE', donnees: ['AB', 'AD', 'BC'], fausses: [(longueurs.BC * longueurs.AB) / longueurs.AD, longueurs.BC + longueurs.AD - longueurs.AB, (longueurs.AB * longueurs.AD) / longueurs.BC], calcul: `${nom('DE')} = ${nom('BC')} × ${nom('AD')} ÷ ${nom('AB')}` },
      { cherche: 'BC', donnees: ['AB', 'AD', 'DE'], fausses: [(longueurs.DE * longueurs.AD) / longueurs.AB, longueurs.DE + longueurs.AB - longueurs.AD, (longueurs.AB * longueurs.AD) / longueurs.DE], calcul: `${nom('BC')} = ${nom('DE')} × ${nom('AB')} ÷ ${nom('AD')}` },
      { cherche: 'AE', donnees: ['AB', 'AD', 'AC'], fausses: [(longueurs.AC * longueurs.AB) / longueurs.AD, longueurs.AC + longueurs.AD - longueurs.AB, (longueurs.AB * longueurs.AD) / longueurs.AC], calcul: `${nom('AE')} = ${nom('AC')} × ${nom('AD')} ÷ ${nom('AB')}` },
      { cherche: 'AC', donnees: ['AB', 'AD', 'AE'], fausses: [(longueurs.AE * longueurs.AD) / longueurs.AB, longueurs.AE + longueurs.AB - longueurs.AD, (longueurs.AB * longueurs.AD) / longueurs.AE], calcul: `${nom('AC')} = ${nom('AE')} × ${nom('AB')} ÷ ${nom('AD')}` },
    ];
    const { cherche, donnees, fausses, calcul } = cas[rngInt(rng, 0, cas.length - 1)];
    const juste = longueurs[cherche];
    const [premiere, deuxieme, troisieme] = donnees.map((cle) => `${nom(cle)} = ${cm(longueurs[cle])}`);
    // Le dessin ne tient que pour un rapport jusqu'à 2 environ : au-delà, on dessine la même figure vue de l'autre côté, les deux triangles échangés.
    const rapport = haut / bas;
    const { figure } = rapport > 2 ? papillon(bas / haut, [a, d, e, b, c], papillonAlt(a, b, c, d, e)) : papillon(rapport, [a, b, c, d, e], papillonAlt(a, b, c, d, e));
    return question(rng, {
      detail: identifiant('papillon', a, b, c, d, e, p, q, haut, u, w, z, cherche),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Les droites (${b}${d}) et (${c}${e}) se coupent en ${a}. Les droites (${b}${c}) et (${d}${e}) sont parallèles. On a ${premiere}, ${deuxieme} et ${troisieme}. Calcule ${nom(cherche)}.`,
      figure,
      correct: cm(juste),
      // Le rapport à l'envers, une addition à la place de la proportion, deux longueurs qui ne se correspondent pas.
      wrong: fauxMesures(juste, [...fausses.map((valeur) => arrondi(valeur, 1)), juste + 1, juste - 1, juste + 2], cm, { decimales: 1 }),
      explanation: `Les droites (${b}${c}) et (${d}${e}) sont parallèles : d'après le théorème de Thalès, ${nom('AD')}/${nom('AB')} = ${nom('AE')}/${nom('AC')} = ${nom('DE')}/${nom('BC')}. Donc ${calcul} = ${nb(juste)} cm.`,
    });
  },
};

/** Ce qu'on mesure avec son ombre : « d'un arbre » se dit « de l'arbre », « du poteau ». */
const OBJETS_A_MESURER = [
  { nom: 'un arbre', de: "de l'arbre", facteurs: [3, 4, 5, 6, 8, 10] },
  { nom: 'un poteau', de: 'du poteau', facteurs: [2, 3, 4, 5] },
  { nom: 'un clocher', de: 'du clocher', facteurs: [10, 12, 15, 20] },
  { nom: 'un immeuble', de: "de l'immeuble", facteurs: [10, 12, 15, 20] },
  { nom: 'un pylône', de: 'du pylône', facteurs: [8, 10, 12, 15] },
  { nom: 'un mât', de: 'du mât', facteurs: [4, 5, 6, 8, 10] },
];
/** Ce qu'on connaît : un objet de hauteur connue et son ombre. */
const REPERES: { phrase: (hauteur: string, ombre: string) => string; hauteurs: number[] }[] = [
  { phrase: (hauteur, ombre) => `Un bâton de ${hauteur}, planté verticalement, a une ombre de ${ombre}.`, hauteurs: [1, 1.2, 1.5, 2] },
  { phrase: (hauteur, ombre) => `Un piquet de ${hauteur}, planté verticalement, a une ombre de ${ombre}.`, hauteurs: [1, 1.2, 1.5] },
  { phrase: (hauteur, ombre) => `Une personne de ${hauteur} a une ombre de ${ombre}.`, hauteurs: [1.5, 1.6, 1.8] },
];

/** Les ombres au même moment : deux triangles aux côtés parallèles, donc proportionnels. */
const thalesSituation: Family = {
  name: 'thales-situation',
  minStage: 17,
  make: (rng) => {
    const [indiceObjet, indiceRepere] = [rngInt(rng, 0, OBJETS_A_MESURER.length - 1), rngInt(rng, 0, REPERES.length - 1)];
    const [objet, repere] = [OBJETS_A_MESURER[indiceObjet], REPERES[indiceRepere]];
    const [h1, o1] = [rngPick(rng, repere.hauteurs), rngPick(rng, [0.5, 1, 1.5, 2, 2.5, 3])];
    const k = rngPick(rng, objet.facteurs);
    const [h2, o2] = [arrondi(h1 * k, 2), arrondi(o1 * k, 2)];
    const hauteurCherchee = rng() < 0.6;
    const ecrire = (valeur: number): string => `${nb(valeur)} m`;
    const cas = hauteurCherchee
      ? {
          juste: h2,
          // Le rapport à l'envers, une addition à la place de la proportion, une mesure recopiée.
          fausses: [(h1 * o1) / o2, h1 + (o2 - o1), o2, o2 - o1, (o2 * o1) / h1],
          texte: `Au même moment, l'ombre d'${objet.nom} mesure ${ecrire(o2)}. Quelle est la hauteur ${objet.de} ?`,
          calcul: `${nb(h1)} × ${nb(o2)} ÷ ${nb(o1)}`,
        }
      : {
          juste: o2,
          fausses: [(o1 * h1) / h2, o1 + (h2 - h1), h2, h2 - h1, (h2 * h1) / o1],
          texte: `Au même moment, ${objet.nom} de ${ecrire(h2)} de haut a une ombre. Quelle est la longueur de cette ombre ?`,
          calcul: `${nb(o1)} × ${nb(h2)} ÷ ${nb(h1)}`,
        };
    return question(rng, {
      detail: identifiant('ombre', indiceObjet, indiceRepere, h1, o1, k, hauteurCherchee ? 'haut' : 'ombre'),
      instruction: INSTRUCTION,
      prompt: `${repere.phrase(ecrire(h1), ecrire(o1))} On suppose les rayons du soleil parallèles. ${cas.texte}`,
      correct: ecrire(cas.juste),
      wrong: fauxMesures(cas.juste, cas.fausses.map((valeur) => arrondi(valeur, 2)), ecrire, { decimales: 2 }),
      explanation: `Les rayons du soleil sont parallèles : les deux triangles formés par l'objet et son ombre sont proportionnels. D'après le théorème de Thalès, on calcule ${cas.calcul} = ${nb(cas.juste)} m.`,
    });
  },
};

/** Les angles de la trigonométrie : de 20° à 70°, jamais 45° (où sinus et cosinus se confondent). */
const ANGLES = [20, 25, 30, 35, 40, 50, 55, 60, 65, 70];
/** Ceux que le triangle rectangle dessiné montre à peu près juste (le dessin garde ses proportions entre 24° et 65°). */
const ANGLES_DU_DESSIN = ANGLES.filter((angle) => angle >= 25 && angle <= 65);

const trigonometrieLongueur: Family = {
  name: 'trigonometrie-longueur',
  minStage: 17,
  make: (rng) => {
    const [r, p, q] = lettresDeTriangle(rng);
    const nom = `${r}${p}${q}`;
    const angle = rngPick(rng, ANGLES_DU_DESSIN);
    const longueur = rngInt(rng, 5, 18);
    const variante = rngInt(rng, 0, 3);
    const [sin, cos, tan] = [Math.sin(rad(angle)), Math.cos(rad(angle)), Math.tan(rad(angle))];
    const figure = (cotes: [string | null, string | null, string | null]) => triangleRectangle(tan, [r, p, q], cotes, [{ sommet: 1, texte: degres(angle) }], `Un triangle ${nom} rectangle en ${r}, dont l'angle en ${p} est marqué.`);
    // Vus de l'angle en P : [RP] est le côté adjacent, [RQ] le côté opposé, [PQ] l'hypoténuse.
    const cas = [
      // Le sinus : l'opposé, connaissant l'hypoténuse.
      { donne: `${p}${q} = ${cm(longueur)}`, cherche: `${r}${q}`, valeur: longueur * sin, fausses: [longueur * cos, longueur / sin, longueur * tan, longueur / cos], figure: figure([null, cm(longueur), '?']), formule: `sin(${angle}°) = ${r}${q} ÷ ${p}${q}, donc ${r}${q} = ${longueur} × sin(${angle}°)` },
      // Le sinus : l'hypoténuse, connaissant l'opposé.
      { donne: `${r}${q} = ${cm(longueur)}`, cherche: `${p}${q}`, valeur: longueur / sin, fausses: [longueur * sin, longueur / cos, longueur / tan, longueur * cos], figure: figure([null, '?', cm(longueur)]), formule: `sin(${angle}°) = ${r}${q} ÷ ${p}${q}, donc ${p}${q} = ${longueur} ÷ sin(${angle}°)` },
      // La tangente : l'opposé, connaissant l'adjacent.
      { donne: `${r}${p} = ${cm(longueur)}`, cherche: `${r}${q}`, valeur: longueur * tan, fausses: [longueur / tan, longueur * sin, longueur * cos, longueur / sin], figure: figure([cm(longueur), null, '?']), formule: `tan(${angle}°) = ${r}${q} ÷ ${r}${p}, donc ${r}${q} = ${longueur} × tan(${angle}°)` },
      // La tangente : l'adjacent, connaissant l'opposé.
      { donne: `${r}${q} = ${cm(longueur)}`, cherche: `${r}${p}`, valeur: longueur / tan, fausses: [longueur * tan, longueur / sin, longueur * cos, longueur * sin], figure: figure(['?', null, cm(longueur)]), formule: `tan(${angle}°) = ${r}${q} ÷ ${r}${p}, donc ${r}${p} = ${longueur} ÷ tan(${angle}°)` },
    ][variante];
    const juste = arrondi(cas.valeur, 1);
    return question(rng, {
      detail: identifiant('longueur', nom, longueur, angle, variante),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${cas.donne} et l'angle ${r}${p}${q} mesure ${degres(angle)}. Calcule la longueur ${cas.cherche}, arrondie au dixième.`,
      figure: cas.figure,
      correct: cm(juste),
      // Un autre rapport trigonométrique, le bon rapport mal utilisé (multiplié à la place de divisé).
      wrong: fauxMesures(juste, cas.fausses.map((valeur) => arrondi(valeur, 1)), cm, { decimales: 1 }),
      explanation: `Dans le triangle rectangle ${nom} : ${cas.formule} ≈ ${nb(juste)} cm.`,
    });
  },
};

const trigonometrieAngle: Family = {
  name: 'trigonometrie-angle',
  minStage: 17,
  make: (rng) => {
    const [r, p, q] = lettresDeTriangle(rng);
    const nom = `${r}${p}${q}`;
    const sinus = rng() < 0.5;
    for (let essai = 0; essai < 1000; essai++) {
      if (sinus) {
        const hypotenuse = rngInt(rng, 6, 20);
        const oppose = rngInt(rng, 3, hypotenuse - 1);
        const angle = enDegres(Math.asin(oppose / hypotenuse));
        const juste = Math.round(angle);
        // Un angle que le dessin montre juste, ni 45° ni un angle presque rond (« 37,02° » ne se lit pas comme 37°).
        if (angle < 25 || angle > 65 || Math.abs(angle - 45) < 3 || Math.abs(angle - juste) < 0.1) continue;
        const adjacent = Math.sqrt(hypotenuse * hypotenuse - oppose * oppose);
        return question(rng, {
          detail: identifiant('sinus', nom, oppose, hypotenuse),
          instruction: INSTRUCTION_FIGURE,
          prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${r}${q} = ${cm(oppose)} et ${p}${q} = ${cm(hypotenuse)}. Calcule la mesure de l'angle ${r}${p}${q}, arrondie au degré.`,
          figure: triangleRectangle(oppose / adjacent, [r, p, q], [null, cm(hypotenuse), cm(oppose)], [{ sommet: 1, texte: '?' }], `Un triangle ${nom} rectangle en ${r}, dont l'angle en ${p} porte un point d'interrogation.`),
          correct: degres(juste),
          // Le complémentaire (le cosinus à la place du sinus), la tangente à la place du sinus.
          wrong: fauxMesures(juste, [90 - juste, Math.round(enDegres(Math.atan(oppose / hypotenuse))), juste + 5, juste - 5, juste + 10], degres, { min: 1, max: 89, decimales: 0 }),
          explanation: `Dans le triangle rectangle ${nom}, sin(${r}${p}${q}) = ${r}${q} ÷ ${p}${q} = ${oppose} ÷ ${hypotenuse}. À la calculatrice, l'angle vaut environ ${juste}°.`,
        });
      }
      const [adjacent, oppose] = [rngInt(rng, 3, 15), rngInt(rng, 3, 15)];
      const angle = enDegres(Math.atan(oppose / adjacent));
      const juste = Math.round(angle);
      if (adjacent === oppose || angle < 25 || angle > 65 || Math.abs(angle - juste) < 0.1) continue;
      const hypotenuse = Math.hypot(adjacent, oppose);
      return question(rng, {
        detail: identifiant('tangente', nom, oppose, adjacent),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Le triangle ${nom} est rectangle en ${r}. On a ${r}${p} = ${cm(adjacent)} et ${r}${q} = ${cm(oppose)}. Calcule la mesure de l'angle ${r}${p}${q}, arrondie au degré.`,
        figure: triangleRectangle(oppose / adjacent, [r, p, q], [cm(adjacent), null, cm(oppose)], [{ sommet: 1, texte: '?' }], `Un triangle ${nom} rectangle en ${r}, dont l'angle en ${p} porte un point d'interrogation.`),
        correct: degres(juste),
        // Le quotient à l'envers (le complémentaire), la tangente calculée avec l'hypoténuse.
        wrong: fauxMesures(juste, [90 - juste, Math.round(enDegres(Math.atan(oppose / hypotenuse))), Math.round(enDegres(Math.atan(adjacent / hypotenuse))), juste + 5, juste - 5], degres, { min: 1, max: 89, decimales: 0 }),
        explanation: `Dans le triangle rectangle ${nom}, tan(${r}${p}${q}) = ${r}${q} ÷ ${r}${p} = ${oppose} ÷ ${adjacent}. À la calculatrice, l'angle vaut environ ${juste}°.`,
      });
    }
    throw new Error('trigonometrie-angle : aucun tirage valable');
  },
};

type Cote = 'adjacent' | 'oppose' | 'hypotenuse';

const trigonometrieChoix: Family = {
  name: 'trigonometrie-choix',
  minStage: 17,
  make: (rng) => {
    const [r, p, q] = lettresDeTriangle(rng);
    const nom = `${r}${p}${q}`;
    const cotes: Record<Cote, string> = { adjacent: `${r}${p}`, oppose: `${r}${q}`, hypotenuse: `${p}${q}` };
    const cas: { donnees: [Cote, Cote]; formule: string; raison: string }[] = [
      { donnees: ['oppose', 'hypotenuse'], formule: 'Le sinus', raison: `sin(${r}${p}${q}) = côté opposé ÷ hypoténuse` },
      { donnees: ['adjacent', 'hypotenuse'], formule: 'Le cosinus', raison: `cos(${r}${p}${q}) = côté adjacent ÷ hypoténuse` },
      { donnees: ['oppose', 'adjacent'], formule: 'La tangente', raison: `tan(${r}${p}${q}) = côté opposé ÷ côté adjacent` },
    ];
    const choisi = rngPick(rng, cas);
    const [premier, second] = rng() < 0.5 ? choisi.donnees : [choisi.donnees[1], choisi.donnees[0]];
    const cote = (cle: Cote) => `${cle === 'hypotenuse' ? "l'hypoténuse" : cle === 'adjacent' ? 'le côté adjacent' : 'le côté opposé'} [${cotes[cle]}]`;
    return question(rng, {
      detail: identifiant('choix', nom, premier, second),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Le triangle ${nom} est rectangle en ${r}. On connaît ${cote(premier)} et ${cote(second)}, et on cherche l'angle ${r}${p}${q}. Que faut-il utiliser ?`,
      figure: triangleRectangle(0.8, [r, p, q], [null, null, null], [{ sommet: 1, texte: '?' }], `Un triangle ${nom} rectangle en ${r}, dont l'angle en ${p} porte un point d'interrogation.`),
      correct: choisi.formule,
      wrong: [...cas.map((autre) => autre.formule).filter((formule) => formule !== choisi.formule), 'Le théorème de Pythagore'],
      explanation: `Vus de l'angle ${r}${p}${q}, ces deux côtés sont ${cote(choisi.donnees[0])} et ${cote(choisi.donnees[1])} : ${choisi.raison}.`,
    });
  },
};

/** Des situations de la vie courante où l'on mesure une longueur avec un angle : un sinus, un cosinus ou une tangente. */
const trigonometrieSituation: Family = {
  name: 'trigonometrie-situation',
  minStage: 17,
  make: (rng) => {
    const angle = rngPick(rng, ANGLES);
    const [sin, cos, tan] = [Math.sin(rad(angle)), Math.cos(rad(angle)), Math.tan(rad(angle))];
    const variante = rngInt(rng, 0, 5);
    const metres = (valeur: number): string => `${nb(arrondi(valeur, 1))} m`;
    // Chaque situation a sa plage de longueurs : une échelle de 25 m ou un toboggan de 3 m n'existent guère.
    const situations = [
      // Une échelle, la hauteur atteinte : le sinus.
      { plage: [3, 9], texte: (l: number) => `Une échelle de ${nb(l)} m est appuyée contre un mur. Elle forme un angle de ${degres(angle)} avec le sol. À quelle hauteur touche-t-elle le mur ?`, valeur: (l: number) => l * sin, fausses: (l: number) => [l * cos, l * tan, l / sin, l / cos], formule: (l: number) => `sin(${angle}°) = hauteur ÷ ${l}, donc hauteur = ${l} × sin(${angle}°)` },
      // Une échelle, le pied : le cosinus.
      { plage: [3, 9], texte: (l: number) => `Une échelle de ${nb(l)} m est appuyée contre un mur. Elle forme un angle de ${degres(angle)} avec le sol. À quelle distance du mur se trouve son pied ?`, valeur: (l: number) => l * cos, fausses: (l: number) => [l * sin, l * tan, l / cos, l / sin], formule: (l: number) => `cos(${angle}°) = distance ÷ ${l}, donc distance = ${l} × cos(${angle}°)` },
      // Un arbre vu sous un angle : la tangente.
      { plage: [5, 30], texte: (l: number) => `Depuis un point du sol situé à ${nb(l)} m du pied d'un arbre, on voit son sommet sous un angle de ${degres(angle)} avec l'horizontale. Quelle est la hauteur de l'arbre ? On néglige la taille de l'observateur.`, valeur: (l: number) => l * tan, fausses: (l: number) => [l / tan, l * sin, l * cos, l / sin], formule: (l: number) => `tan(${angle}°) = hauteur ÷ ${l}, donc hauteur = ${l} × tan(${angle}°)` },
      // Un toboggan : le sinus.
      { plage: [3, 8], texte: (l: number) => `Un toboggan de ${nb(l)} m de long fait un angle de ${degres(angle)} avec le sol. Quelle est la hauteur de son sommet par rapport au sol ?`, valeur: (l: number) => l * sin, fausses: (l: number) => [l * cos, l / sin, l * tan, l / cos], formule: (l: number) => `sin(${angle}°) = hauteur ÷ ${l}, donc hauteur = ${l} × sin(${angle}°)` },
      // Une échelle à choisir, sa longueur : le sinus à l'envers.
      { plage: [3, 8], texte: (l: number) => `Une échelle doit toucher un mur à ${nb(l)} m de hauteur, en formant un angle de ${degres(angle)} avec le sol. Quelle longueur d'échelle faut-il ?`, valeur: (l: number) => l / sin, fausses: (l: number) => [l * sin, l / cos, l * cos, l / tan], formule: (l: number) => `sin(${angle}°) = ${l} ÷ longueur, donc longueur = ${l} ÷ sin(${angle}°)` },
      // Un arbre vu sous un angle, la distance : la tangente à l'envers.
      { plage: [4, 25], texte: (l: number) => `Un arbre mesure ${nb(l)} m de haut. À quelle distance de son pied doit-on se placer pour voir son sommet sous un angle de ${degres(angle)} avec l'horizontale ? On néglige la taille de l'observateur.`, valeur: (l: number) => l / tan, fausses: (l: number) => [l * tan, l / sin, l * cos, l * sin], formule: (l: number) => `tan(${angle}°) = ${l} ÷ distance, donc distance = ${l} ÷ tan(${angle}°)` },
    ];
    const cas = situations[variante];
    const longueur = rngInt(rng, cas.plage[0], cas.plage[1]);
    const juste = arrondi(cas.valeur(longueur), 1);
    return question(rng, {
      detail: identifiant('situation', variante, longueur, angle),
      instruction: INSTRUCTION,
      prompt: `${cas.texte(longueur)} Arrondis au dixième de mètre.`,
      correct: metres(juste),
      // Un autre rapport trigonométrique, le bon rapport mal utilisé (multiplié à la place de divisé).
      wrong: fauxMesures(juste, cas.fausses(longueur).map((valeur) => arrondi(valeur, 1)), metres, { decimales: 1 }),
      explanation: `Dans le triangle rectangle que dessine la situation : ${cas.formule(longueur)} ≈ ${nb(juste)} m.`,
    });
  },
};

export const FAMILLES_TROISIEME_T2: Family[] = [thalesEnPapillon, thalesSituation, trigonometrieLongueur, trigonometrieAngle, trigonometrieChoix, trigonometrieSituation];

// === 3e trimestre (étape 18) ======================================================================================

/** Le rapport k = num/den d'une homothétie : un agrandissement ou une réduction, jamais négatif. */
const RAPPORTS_DE_L_HOMOTHETIE: [number, number][] = [[2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [3, 2]];

const homothetieDansUnRepere: Family = {
  name: 'homothetie-repere',
  minStage: 18,
  make: (rng) => {
    for (let essai = 0; essai < 1000; essai++) {
      const [lettre] = lettresDeFigure(rng, 1);
      const [num, den] = rngPick(rng, RAPPORTS_DE_L_HOMOTHETIE);
      const centreEstO = rng() < 0.6;
      const [a, b] = centreEstO ? [0, 0] : [rngPick(rng, [-2, -1, 1, 2]), rngPick(rng, [-2, -1, 1, 2])];
      const [x, y] = [rngInt(rng, -5, 5), rngInt(rng, -5, 5)];
      const [dx, dy] = [x - a, y - b];
      // Le déplacement du centre vers le point doit se partager exactement, pour que l'image ait des coordonnées entières.
      if ((dx === 0 && dy === 0) || (dx * num) % den !== 0 || (dy * num) % den !== 0) continue;
      const fois = (valeur: number): number => (valeur * num) / den;
      const diviseePar = (valeur: number): number => (valeur * den) / num;
      const [dx2, dy2] = [fois(dx), fois(dy)];
      const [x2, y2] = [a + dx2, b + dy2];
      if (Math.abs(x2) > 12 || Math.abs(y2) > 12) continue;
      const rapport = den === 1 ? nb(num) : `${num}/${den}`;
      const centre = centreEstO ? 'O' : 'I';
      const candidats: [number, number][] = [
        // Le rapport ajouté au lieu d'être multiplié, un seul des deux nombres transformé, le rapport à l'envers, le sens changé.
        [x + num / den, y + num / den],
        [x2, y],
        [x, y2],
        [a + diviseePar(dx), b + diviseePar(dy)],
        [a - dx2, b - dy2],
        // Le centre oublié.
        [fois(x), fois(y)],
        [dx2, dy2],
        // Les nombres échangés ou un signe changé.
        [y2, x2],
        [-x2, y2],
        [x2, -y2],
      ];
      return question(rng, {
        detail: identifiant('homothetie', lettre, x, y, a, b, num, den),
        instruction: INSTRUCTION_FIGURE,
        prompt: centreEstO
          ? `Dans un repère, l'homothétie de centre O et de rapport ${rapport} transforme ${lettre}${coordonnees(x, y)} en ${lettre}'. Quelles sont les coordonnées de ${lettre}' ?`
          : `Dans un repère, l'homothétie de centre I${coordonnees(a, b)} et de rapport ${rapport} transforme ${lettre}${coordonnees(x, y)} en ${lettre}'. Quelles sont les coordonnées de ${lettre}' ?`,
        figure: repereDePoints(-5, 5, [{ lettre: centre, x: a, y: b }, { lettre, x, y }], `Un repère quadrillé avec le centre ${centre} et le point ${lettre}.`),
        correct: coordonnees(x2, y2),
        wrong: candidats.filter(([u, v]) => Number.isInteger(u) && Number.isInteger(v)).map(([u, v]) => coordonnees(u, v)),
        explanation: centreEstO
          ? `Chaque coordonnée est multipliée par le rapport ${rapport} : ${nb(x)} × ${rapport} = ${nb(x2)} et ${nb(y)} × ${rapport} = ${nb(y2)}.`
          : `Le déplacement de I vers ${lettre} est ${coordonnees(dx, dy)}. Multiplié par ${rapport}, il devient ${coordonnees(dx2, dy2)}. Donc ${lettre}' est en ${coordonnees(x2, y2)}.`,
      });
    }
    throw new Error('homothetie-repere : aucun tirage valable');
  },
};

const rotationDansUnRepere: Family = {
  name: 'rotation-repere',
  minStage: 18,
  make: (rng) => {
    const valeurs = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
    for (let essai = 0; essai < 1000; essai++) {
      const [x, y] = [rngPick(rng, valeurs), rngPick(rng, valeurs)];
      // Le point n'est ni sur un axe ni sur une diagonale : aucune image ne se confond avec une autre.
      if (Math.abs(x) === Math.abs(y)) continue;
      const [lettre] = lettresDeFigure(rng, 1);
      const angle = rngPick(rng, [90, 180, 270]);
      const images: Record<number, [number, number]> = { 90: [-y, x], 180: [-x, -y], 270: [y, -x] };
      const [x2, y2] = images[angle];
      const autres = [90, 180, 270].filter((valeur) => valeur !== angle).map((valeur) => images[valeur]);
      return question(rng, {
        detail: identifiant('rotation', lettre, x, y, angle),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Dans un repère, la rotation de centre O et d'angle ${angle}°, dans le sens inverse des aiguilles d'une montre, transforme ${lettre}${coordonnees(x, y)} en ${lettre}'. Quelles sont les coordonnées de ${lettre}' ?`,
        figure: repereDePoints(-5, 5, [{ lettre: 'O', x: 0, y: 0 }, { lettre, x, y }], `Un repère quadrillé avec l'origine O et le point ${lettre}.`),
        correct: coordonnees(x2, y2),
        // Une autre rotation (dont le sens contraire), une symétrie par rapport à un axe, les nombres échangés.
        wrong: [...autres.map(([u, v]) => coordonnees(u, v)), coordonnees(x, -y), coordonnees(-x, y), coordonnees(y, x)],
        explanation:
          angle === 90
            ? `Un quart de tour dans ce sens envoie (x ; y) sur (−y ; x) : ${lettre}' est en ${coordonnees(x2, y2)}.`
            : angle === 180
              ? `Un demi-tour envoie (x ; y) sur (−x ; −y) : ${lettre}' est en ${coordonnees(x2, y2)}.`
              : `Trois quarts de tour dans ce sens envoient (x ; y) sur (y ; −x) : ${lettre}' est en ${coordonnees(x2, y2)}.`,
      });
    }
    throw new Error('rotation-repere : aucun tirage valable');
  },
};

const volumesDeSolides: Family = {
  name: 'volumes-solides',
  minStage: 18,
  make: (rng) => {
    const variante = rngInt(rng, 0, 3);
    /** Des multiples de π, écrits seulement s'ils se lisent sans décimale interminable. */
    const multiples = (unite: string, valeurs: number[]): string[] => valeurs.filter(fini).map((valeur) => `${nb(valeur)}π ${unite}`);
    if (variante === 0) {
      const [cote, hauteur] = [rngInt(rng, 2, 9), rngPick(rng, [3, 6, 9, 12])];
      const volume = (cote * cote * hauteur) / 3;
      return question(rng, {
        detail: identifiant('pyramide', cote, hauteur),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Une pyramide a pour base un carré de ${cm(cote)} de côté et pour hauteur ${cm(hauteur)}. Quel est son volume ?`,
        figure: solideFigure('pyramide'),
        correct: cm3(volume),
        // Le tiers oublié, la moitié à la place du tiers, le côté à la place de son carré, le tiers multiplié.
        wrong: fauxMesures(volume, [cote * cote * hauteur, (cote * cote * hauteur) / 2, (cote * hauteur) / 3, cote * cote * hauteur * 3, volume + hauteur], cm3, { decimales: 1 }),
        explanation: `Volume de la pyramide = aire de la base × hauteur ÷ 3 = ${cote * cote} × ${hauteur} ÷ 3 = ${nb(volume)} cm³.`,
      });
    }
    if (variante === 1) {
      const [rayon, hauteur] = rngPick(rng, [[2, 3], [3, 4], [3, 7], [4, 3], [5, 3], [6, 5], [2, 6], [3, 8], [4, 6]] as [number, number][]);
      const volume = (rayon * rayon * hauteur) / 3;
      return question(rng, {
        detail: identifiant('cone', rayon, hauteur),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Un cône a pour rayon de base ${cm(rayon)} et pour hauteur ${cm(hauteur)}. Quel est son volume exact ?`,
        figure: solideFigure('cone'),
        correct: `${nb(volume)}π cm³`,
        // Le tiers oublié, la moitié à la place du tiers, le rayon à la place de son carré, la circonférence à la place de l'aire.
        wrong: multiples('cm³', [rayon * rayon * hauteur, (rayon * rayon * hauteur) / 2, (rayon * hauteur) / 3, (2 * rayon * hauteur) / 3, volume * 2, volume + rayon]),
        explanation: `Volume du cône = π × rayon² × hauteur ÷ 3 = π × ${rayon * rayon} × ${hauteur} ÷ 3 = ${nb(volume)}π cm³.`,
      });
    }
    if (variante === 2) {
      const rayon = rngPick(rng, [3, 6, 9]);
      const volume = (4 * rayon ** 3) / 3;
      return question(rng, {
        detail: identifiant('boule', rayon),
        instruction: INSTRUCTION_FIGURE,
        prompt: `Une boule a pour rayon ${cm(rayon)}. Quel est son volume exact ?`,
        figure: solideFigure('boule'),
        correct: `${nb(volume)}π cm³`,
        // L'aire de la sphère, le rayon seul, le facteur 4/3 oublié ou le rayon au carré, la moitié, le triple.
        wrong: multiples('cm³', [4 * rayon * rayon, rayon ** 3, 4 * rayon ** 3, (4 * rayon * rayon) / 3, volume / 2, volume * 3]),
        explanation: `Volume de la boule = 4/3 × π × rayon³ = 4/3 × π × ${rayon ** 3} = ${nb(volume)}π cm³.`,
      });
    }
    const rayon = rngInt(rng, 2, 12);
    const aire = 4 * rayon * rayon;
    return question(rng, {
      detail: identifiant('sphere', rayon),
      instruction: INSTRUCTION_FIGURE,
      prompt: `Une sphère a pour rayon ${cm(rayon)}. Quelle est son aire exacte ?`,
      figure: solideFigure('boule'),
      correct: `${nb(aire)}π cm²`,
      // L'aire d'un disque, la circonférence, le facteur 4 oublié ou le rayon non élevé au carré.
      wrong: multiples('cm²', [rayon * rayon, 2 * rayon, 2 * rayon * rayon, aire * 2, 4 * rayon, aire + rayon]),
      explanation: `Aire de la sphère = 4 × π × rayon² = 4 × π × ${rayon * rayon} = ${nb(aire)}π cm².`,
    });
  },
};

/** Les transformations du repère que l'on sait reconnaître en 3e, avec l'image qu'elles donnent à un point. */
const TRANSFORMATIONS: { nom: string; regle: string; image: (x: number, y: number) => [number, number] }[] = [
  { nom: 'Une symétrie centrale de centre O', regle: 'les deux coordonnées changent de signe', image: (x, y) => [-x, -y] },
  { nom: "Une symétrie par rapport à l'axe des abscisses", regle: "l'abscisse reste la même et l'ordonnée change de signe", image: (x, y) => [x, -y] },
  { nom: "Une symétrie par rapport à l'axe des ordonnées", regle: "l'ordonnée reste la même et l'abscisse change de signe", image: (x, y) => [-x, y] },
  { nom: "Une rotation de centre O et d'angle 90°, sens inverse des aiguilles d'une montre", regle: 'le point (x ; y) devient (−y ; x)', image: (x, y) => [-y, x] },
  { nom: 'Une homothétie de centre O et de rapport 2', regle: 'les deux coordonnées sont doublées', image: (x, y) => [2 * x, 2 * y] },
];
const TRANSLATION = 'Une translation';

const reconnaitreUneTransformation: Family = {
  name: 'transformation-reconnaitre',
  minStage: 18,
  make: (rng) => {
    const valeurs = [-4, -3, -2, -1, 1, 2, 3, 4];
    const proposees = [...TRANSFORMATIONS.map(({ nom }) => nom), TRANSLATION];
    for (let essai = 0; essai < 1000; essai++) {
      const [[x1, y1], [x2, y2]] = [[rngPick(rng, valeurs), rngPick(rng, valeurs)], [rngPick(rng, valeurs), rngPick(rng, valeurs)]];
      // Deux points différents, hors des diagonales où deux transformations se confondent.
      if ((x1 === x2 && y1 === y2) || Math.abs(x1) === Math.abs(y1) || Math.abs(x2) === Math.abs(y2)) continue;
      const [tx, ty] = [rngPick(rng, [-4, -3, -2, 2, 3, 4]), rngPick(rng, [-4, -3, -2, 2, 3, 4])];
      const choisie = rngPick(rng, proposees);
      const transformation = TRANSFORMATIONS.find(({ nom }) => nom === choisie);
      const image = (x: number, y: number): [number, number] => (transformation ? transformation.image(x, y) : [x + tx, y + ty]);
      const [[a2, b2], [c2, d2]] = [image(x1, y1), image(x2, y2)];
      // Chaque transformation proposée est essayée sur les deux points : une seule doit les envoyer sur leurs images.
      const memeVecteur = a2 - x1 === c2 - x2 && b2 - y1 === d2 - y2;
      const conviennent = proposees.filter((nom) => {
        if (nom === TRANSLATION) return memeVecteur;
        const essayee = TRANSFORMATIONS.find((t) => t.nom === nom);
        if (!essayee) return false;
        const [e, f] = essayee.image(x1, y1);
        const [g, h] = essayee.image(x2, y2);
        return e === a2 && f === b2 && g === c2 && h === d2;
      });
      if (conviennent.length !== 1 || conviennent[0] !== choisie) continue;
      return question(rng, {
        detail: identifiant('reconnaitre', x1, y1, x2, y2, proposees.indexOf(choisie), transformation ? '' : `${tx}-${ty}`),
        instruction: INSTRUCTION,
        prompt: `Dans un repère, une transformation envoie A${coordonnees(x1, y1)} sur A'${coordonnees(a2, b2)} et B${coordonnees(x2, y2)} sur B'${coordonnees(c2, d2)}. De quelle transformation s'agit-il ?`,
        correct: choisie,
        wrong: rngShuffle(
          rng,
          proposees.filter((nom) => nom !== choisie)
        ).slice(0, 3),
        explanation: transformation
          ? `Le point A devient A' et le point B devient B' : ${transformation.regle}. C'est ${minuscule(choisie)}.`
          : `Les deux points sont déplacés de la même façon : ${nb(tx)} en abscisse et ${nb(ty)} en ordonnée. C'est une translation.`,
      });
    }
    throw new Error('transformation-reconnaitre : aucun tirage valable');
  },
};

export const FAMILLES_TROISIEME_T3: Family[] = [homothetieDansUnRepere, rotationDansUnRepere, volumesDeSolides, reconnaitreUneTransformation];

/** Les familles de la 3e, dans l'ordre où le programme les amène. */
export const FAMILLES_TROISIEME: Family[] = [...FAMILLES_TROISIEME_T1, ...FAMILLES_TROISIEME_T2, ...FAMILLES_TROISIEME_T3];
