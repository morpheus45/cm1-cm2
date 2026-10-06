import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { distance, fitsInFrame, type Figure, type Point, type Shape } from '../lib/figures';
import { directionAnswer, isConstructionRight, isPlacedRight, nodePoint, sameNode, type Node } from '../lib/construction';
import { parseFrenchNumber } from '../lib/classProblems';
import { availableAt, stageOf } from '../lib/progression';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { generate } from './geometrie';
import { FAMILLES_CYCLE2 } from './geometrieCycle2';
import { FAMILLES_6E } from './geometrieSixieme';
import { isCubeNet } from './geometrieFigures';
import { formatLength } from './geometrieMesures';

/**
 * La géométrie du CE1, du CE2 et de la 6e : chaque question est refaite ici à
 * partir de son dessin, lu comme l'élève le lit — des longueurs mesurées sur
 * la figure, des angles calculés entre les traits, des points alignés, des
 * axes de symétrie cherchés en repliant la figure —, puis comparée à la bonne
 * réponse proposée et aux autres, qui ne doivent pas la valoir.
 */

const NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const GRAINES = 40;

function questions(level: Level, trimester: Trimester, count = 24, seeds = GRAINES): Question[] {
  return Array.from({ length: seeds }, (_, seed) => generate(level, trimester, createRng(seed * 31 + 5), count)).flat();
}

const parCellule = <T>(faire: (level: Level, trimester: Trimester) => T) =>
  NIVEAUX.flatMap((level) => ALL_TRIMESTERS.map((trimester) => ({ level, trimester, valeur: faire(level, trimester) })));

const FAMILLES = { cycle2: FAMILLES_CYCLE2, sixieme: FAMILLES_6E };
const MOTIFS_DES_FAMILLES = {
  cycle2: FAMILLES_CYCLE2.map((famille) => ({ nom: famille.name, motif: new RegExp(`^geometrie-${famille.name}-\\d+-`) })),
  sixieme: FAMILLES_6E.map((famille) => ({ nom: famille.name, motif: new RegExp(`^geometrie-${famille.name}-\\d+-`) })),
};

function familleDe(question: Question, level: Level): string {
  const trouvees = MOTIFS_DES_FAMILLES[level === '6e' ? 'sixieme' : 'cycle2'].filter(({ motif }) => motif.test(question.id));
  if (trouvees.length !== 1) throw new Error(`${question.id} : ${trouvees.length} familles possibles`);
  return trouvees[0].nom;
}

// --- Lire un dessin ----------------------------------------------------------------------------------

type Texte = Extract<Shape, { kind: 'text' }>;
type Segment = Extract<Shape, { kind: 'segment' }>;
type Polygone = Extract<Shape, { kind: 'polygon' }>;

const textes = (figure: Figure) => figure.shapes.filter((forme): forme is Texte => forme.kind === 'text');
const segments = (figure: Figure) => figure.shapes.filter((forme): forme is Segment => forme.kind === 'segment');
const polygones = (figure: Figure) => figure.shapes.filter((forme): forme is Polygone => forme.kind === 'polygon');
const points = (figure: Figure) => figure.shapes.flatMap((forme) => (forme.kind === 'point' ? [forme.at] : []));
const lettresDuDessin = (figure: Figure, taille?: number) => textes(figure).filter((texte) => /^[A-Z]$/.test(texte.text) && (taille === undefined || texte.size === taille));

/** L'angle en degrés au sommet `o`, entre les demi-droites vers `a` et vers `b`. */
function angle(o: Point, a: Point, b: Point): number {
  const [ux, uy, vx, vy] = [a[0] - o[0], a[1] - o[1], b[0] - o[0], b[1] - o[1]];
  return (Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))))) * 180) / Math.PI;
}

const barycentre = (liste: Point[]): Point => [liste.reduce((s, [x]) => s + x, 0) / liste.length, liste.reduce((s, [, y]) => s + y, 0) / liste.length];
const plusProche = <T>(liste: T[], position: (element: T) => Point, cible: Point): T => liste.reduce((meilleur, element) => (distance(position(element), cible) < distance(position(meilleur), cible) ? element : meilleur));

/** Les lettres des sommets d'un polygone, dans l'ordre : la lettre posée le plus près de chaque sommet. */
function lettresDesSommets(figure: Figure, sommets: Point[]): string {
  const lettres = lettresDuDessin(figure, 14);
  return sommets.map((sommet) => plusProche(lettres, (texte) => texte.at, sommet).text).join('');
}

/** Les angles d'un polygone convexe, en degrés, sommet par sommet. */
const anglesDuPolygone = (sommets: Point[]) => sommets.map((sommet, index) => angle(sommet, sommets[(index + sommets.length - 1) % sommets.length], sommets[(index + 1) % sommets.length]));
const cotesDuPolygone = (sommets: Point[]) => sommets.map((sommet, index) => distance(sommet, sommets[(index + 1) % sommets.length]));
const egaux = (valeurs: number[], tolerance: number) => Math.max(...valeurs) - Math.min(...valeurs) <= tolerance;

/** Le nombre d'axes de symétrie d'un polygone convexe, en le repliant : un axe passe par le centre, et par un sommet ou le milieu d'un côté. */
function axesDeSymetrie(sommets: Point[]): number {
  const centre = barycentre(sommets);
  const directions = [
    ...sommets.map((sommet) => Math.atan2(sommet[1] - centre[1], sommet[0] - centre[0])),
    ...sommets.map((sommet, index) => {
      const suivant = sommets[(index + 1) % sommets.length];
      return Math.atan2((sommet[1] + suivant[1]) / 2 - centre[1], (sommet[0] + suivant[0]) / 2 - centre[0]);
    }),
  ];
  const axes: number[] = [];
  directions.forEach((theta) => {
    const [c, s] = [Math.cos(2 * theta), Math.sin(2 * theta)];
    // La symétrie d'axe incliné de theta, centrée sur le barycentre.
    const image = (point: Point): Point => {
      const [dx, dy] = [point[0] - centre[0], point[1] - centre[1]];
      return [centre[0] + c * dx + s * dy, centre[1] + s * dx - c * dy];
    };
    const replie = sommets.every((point) => sommets.some((autre) => distance(image(point), autre) < 1.2));
    const modulo = ((theta % Math.PI) + Math.PI) % Math.PI;
    if (replie && !axes.some((deja) => Math.min(Math.abs(deja - modulo), Math.PI - Math.abs(deja - modulo)) < 0.01)) axes.push(modulo);
  });
  return axes.length;
}

// --- Les réponses attendues ---------------------------------------------------------------------------------------------

type Attendu = { genre: 'texte'; valeur: string } | { genre: 'nombre'; valeur: number; unite?: string } | { genre: 'construction' };

const texte = (valeur: string): Attendu => ({ genre: 'texte', valeur });
const nombre = (valeur: number, unite?: string): Attendu => ({ genre: 'nombre', valeur, unite });

const CHIFFRES = (prompt: string) => (prompt.match(/\d+(?:,\d+)?/g) ?? []).map((valeur) => parseFrenchNumber(valeur) as number);
const egal = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Un texte de longueur « 8 cm », « 7,5 cm » : sa valeur. */
const longueurEcrite = (texteDuDessin: string) => {
  const m = /^(\d+(?:,\d+)?) cm$/.exec(texteDuDessin);
  return m ? (parseFrenchNumber(m[1]) as number) : null;
};

/** Ce que disent les quatre figures A, B, C, D : leur nature. */
function naturesDesFormes(figure: Figure): string[] {
  const lettres = lettresDuDessin(figure, 17);
  return lettres.map((lettre) => {
    const centre: Point = [lettre.at[0] + 62, lettre.at[1] + 32];
    const candidates = figure.shapes.filter((forme) => forme.kind === 'polygon' || forme.kind === 'circle');
    const forme = plusProche(candidates, (candidate) => (candidate.kind === 'circle' ? candidate.center : barycentre((candidate as Polygone).points)), centre);
    if (forme.kind === 'circle') return 'cercle';
    const sommets = (forme as Polygone).points;
    if (sommets.length === 3) return 'triangle';
    const droits = anglesDuPolygone(sommets).every((valeur) => Math.abs(valeur - 90) < 1);
    if (!droits) return 'quadrilatère';
    return egaux(cotesDuPolygone(sommets), 1.5) ? 'carré' : 'rectangle';
  });
}

/** Quatre angles A, B, C, D : leur mesure. */
function anglesDesCases(figure: Figure): number[] {
  const lettres = lettresDuDessin(figure, 17);
  const arcs = figure.shapes.filter((forme): forme is Extract<Shape, { kind: 'arc' }> => forme.kind === 'arc');
  return lettres.map((lettre) => {
    const centre: Point = [lettre.at[0] + 62, lettre.at[1] + 32];
    const arc = plusProche(arcs, (candidat) => candidat.center, centre);
    const bras = segments(figure).filter((trait) => distance(trait.from, arc.center) < 0.2);
    return angle(arc.center, bras[0].to, bras[1].to);
  });
}

/** La règle : une longueur lue entre deux graduations, en millimètres. */
function lireLaRegle(figure: Figure): { debut: number; fin: number } {
  const graduations = textes(figure).filter((entree) => entree.size === 13 && /^\d+$/.test(entree.text));
  const [zero, dernier] = [graduations.find((entree) => entree.text === '0')!, graduations.reduce((a, b) => (Number(b.text) > Number(a.text) ? b : a))];
  const parMillimetre = (dernier.at[0] - zero.at[0]) / (Number(dernier.text) * 10);
  const trait = segments(figure).find((entree) => entree.ink === 'couleur' && entree.width === 3.5)!;
  return { debut: Math.round((trait.from[0] - zero.at[0]) / parMillimetre), fin: Math.round((trait.to[0] - zero.at[0]) / parMillimetre) };
}

/** Une construction juste : la solution attendue est acceptée, et rien de plus simple ne l'est. */
function verifierLaConstruction(question: Question) {
  const construction = question.construction!;
  expect(question.choices, question.id).toEqual([]);
  expect(question.correctIndex, question.id).toBe(-1);
  expect(question.explanation, question.id).toBeTruthy();
  const { rule } = construction;
  if (rule.kind === 'points') {
    expect(isConstructionRight(construction, rule.expected), question.id).toBe(true);
    expect(rule.expected.length, question.id).toBe(construction.count);
    (construction.fixed ?? []).forEach((fixe) => expect(rule.expected.some((attendu) => sameNode(attendu, fixe)), `${question.id} : un point donné est à poser`).toBe(false));
    // Un point de moins, ou un point faux, ne passe pas.
    expect(isConstructionRight(construction, rule.expected.slice(1)), question.id).toBe(false);
  } else {
    const reponse = directionAnswer(construction.grid, rule);
    expect(reponse, question.id).not.toBeNull();
    expect(isConstructionRight(construction, [reponse!]), question.id).toBe(true);
    expect(isPlacedRight(construction, rule.from), question.id).toBe(false);
  }
}

const DIRECTIONS: Record<string, Node> = { 'à droite': [1, 0], 'à gauche': [-1, 0], 'en bas': [0, 1], 'en haut': [0, -1] };
const nomDeCase = ([colonne, ligne]: Node) => `${'ABCDE'[colonne]}${ligne + 1}`;

const SOLIDES_DES_OBJETS: Record<string, string> = {
  dé: 'un cube',
  'boîte de chaussures': 'un pavé droit',
  ballon: 'une boule',
  'boîte de conserve': 'un cylindre',
  'cornet de glace': 'un cône',
  brique: 'un pavé droit',
  'balle de tennis': 'une boule',
  'chapeau pointu de clown': 'un cône',
  'tube de colle': 'un cylindre',
  'boîte de céréales': 'un pavé droit',
  bille: 'une boule',
  'pot de confiture': 'un cylindre',
};

/** Les droites d'une figure à trois droites nommées : leur direction, en degrés, de 0 à 180. */
const directionDeLaDroite = (trait: Segment) => (((Math.atan2(trait.to[1] - trait.from[1], trait.to[0] - trait.from[0]) * 180) / Math.PI) % 180 + 180) % 180;

/** La mesure de l'angle XOY : les lettres sont posées au bout des deux droites qui se coupent en O. */
function mesureDeLAngle(figure: Figure, x: string, y: string): number {
  const centre = points(figure)[0];
  const bouts = segments(figure).flatMap((trait) => [trait.from, trait.to]);
  const lettres = lettresDuDessin(figure, 14).filter((entree) => entree.text !== 'O');
  const bout = (nom: string) => plusProche(bouts, (point) => point, lettres.find((entree) => entree.text === nom)!.at);
  return angle(centre, bout(x), bout(y));
}

const FACTEURS_D_AIRES: Record<string, number> = { 'm²': 10000, 'dm²': 100, 'cm²': 1 };

function attendu(question: Question, level: Level): Attendu {
  const nom = familleDe(question, level);
  const { prompt, figure } = question;
  const chiffres = CHIFFRES(prompt);
  let m: RegExpExecArray | null;
  switch (nom) {
    // --- CE1 et CE2
    case 'formes-planes': {
      const demandee = /Quelle figure est un (\S+) \?/.exec(prompt)![1];
      const natures = naturesDesFormes(figure!);
      const cherchee = { carré: 'carré', rectangle: 'rectangle', triangle: 'triangle', cercle: 'cercle' }[demandee]!;
      expect(natures.filter((nature) => nature === cherchee), `${question.id} : une seule figure convient`).toHaveLength(1);
      if (cherchee === 'rectangle') expect(natures, `${question.id} : un carré est aussi un rectangle`).not.toContain('carré');
      return texte('ABCD'[natures.indexOf(cherchee)]);
    }
    case 'sommets-cotes': {
      const nomDeLaFigure = /la figure (\S+) \?/.exec(prompt)![1];
      const sommets = polygones(figure!)[0].points;
      expect(lettresDesSommets(figure!, sommets), question.id).toBe(nomDeLaFigure);
      return nombre(sommets.length);
    }
    case 'angle-droit': {
      if (prompt === 'Quel angle est un angle droit ?') {
        const mesures = anglesDesCases(figure!);
        const droits = mesures.filter((mesure) => Math.abs(mesure - 90) < 0.5);
        expect(droits, question.id).toHaveLength(1);
        mesures.filter((mesure) => Math.abs(mesure - 90) >= 0.5).forEach((mesure) => expect(Math.abs(mesure - 90), `${question.id} : trop près de l'angle droit`).toBeGreaterThanOrEqual(25));
        return texte('ABCD'[mesures.findIndex((mesure) => Math.abs(mesure - 90) < 0.5)]);
      }
      const nomDeLaFigure = /la figure (\S+) \?/.exec(prompt)![1];
      const sommets = polygones(figure!)[0].points;
      expect(lettresDesSommets(figure!, sommets), question.id).toBe(nomDeLaFigure);
      const mesures = anglesDuPolygone(sommets);
      mesures.forEach((mesure) => expect(Math.min(Math.abs(mesure - 90), 5) === 5 || Math.abs(mesure - 90) < 0.6, `${question.id} : un angle presque droit`).toBe(true));
      return nombre(mesures.filter((mesure) => Math.abs(mesure - 90) < 0.6).length);
    }
    case 'points-alignes': {
      const [, a, b] = /aligné avec (\S) et (\S) \?/.exec(prompt)!;
      const lieux = new Map(points(figure!).map((point) => [lettresDuDessin(figure!).find((entree) => Math.hypot(entree.at[0] - point[0] - 10, entree.at[1] - point[1] + 8) < 0.5)!.text, point]));
      const [pa, pb] = [lieux.get(a)!, lieux.get(b)!];
      const ecart = (point: Point) => Math.abs((pb[0] - pa[0]) * (pa[1] - point[1]) - (pa[0] - point[0]) * (pb[1] - pa[1])) / distance(pa, pb);
      const autres = [...lieux.entries()].filter(([lettre]) => lettre !== a && lettre !== b);
      const alignes = autres.filter(([, point]) => ecart(point) < 0.8);
      expect(alignes, question.id).toHaveLength(1);
      autres.filter(([, point]) => ecart(point) >= 0.8).forEach(([, point]) => expect(ecart(point), `${question.id} : trop près de la droite`).toBeGreaterThanOrEqual(15));
      return texte(alignes[0][0]);
    }
    case 'solides-ce1': {
      if (!figure) {
        const objet = /ressemble à une? (.+) \?/.exec(prompt)![1];
        return texte(SOLIDES_DES_OBJETS[objet]);
      }
      const formes = figure.shapes;
      if (formes.some((forme) => forme.kind === 'circle')) return texte('une boule');
      // Un cylindre a deux bases (trois ellipses : le dessus entier, le dessous vu et caché) ; un cône une seule (deux ellipses).
      const ellipses = formes.filter((forme) => forme.kind === 'ellipse');
      if (ellipses.length > 0) return texte(ellipses.length === 3 ? 'un cylindre' : 'un cône');
      const traits = segments(figure);
      expect(traits, question.id).toHaveLength(12);
      const xs = traits.flatMap((trait) => [trait.from[0], trait.to[0]]);
      const ys = traits.flatMap((trait) => [trait.from[1], trait.to[1]]);
      const rapport = (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys));
      return texte(Math.abs(rapport - 1) < 0.03 ? 'un cube' : 'un pavé droit');
    }
    case 'repere-case': {
      const etoile = figure!.shapes.find((forme) => forme.kind === 'etoile') as Extract<Shape, { kind: 'etoile' }>;
      return texte(nomDeCase([Math.floor((etoile.at[0] - 85) / 32), Math.floor((etoile.at[1] - 30) / 32)]));
    }
    case 'repere-construire-case': {
      const nomVise = /\*\*(\S+)\*\*/.exec(prompt)![1];
      const construction = question.construction!;
      expect(construction.target, question.id).toBe('case');
      expect(construction.rule.kind === 'points' && nomDeCase(construction.rule.expected[0]), question.id).toBe(nomVise);
      return { genre: 'construction' };
    }
    case 'cotes-egaux': {
      const [nomDeLaFigure] = /[Ll]e (?:carré|rectangle) (\S+) a/.exec(prompt)!.slice(1);
      const sommets = polygones(figure!)[0].points;
      expect(lettresDesSommets(figure!, sommets), question.id).toBe(nomDeLaFigure);
      const cotes = cotesDuPolygone(sommets);
      const milieux = sommets.map((sommet, index): Point => [(sommet[0] + sommets[(index + 1) % 4][0]) / 2, (sommet[1] + sommets[(index + 1) % 4][1]) / 2]);
      // Les longueurs écrites sur la figure donnent l'échelle ; le côté demandé se mesure sur le dessin.
      const echelles = textes(figure!).flatMap((entree) => {
        const valeur = longueurEcrite(entree.text);
        if (valeur === null) return [];
        const cote = milieux.indexOf(plusProche(milieux, (milieu) => milieu, entree.at));
        return [valeur / cotes[cote]];
      });
      expect(egaux(echelles, 0.03 * echelles[0]), `${question.id} : le dessin n'est pas à l'échelle de ses longueurs`).toBe(true);
      const demande = /Combien mesure \[(\S)(\S)\] \?/.exec(prompt)!;
      const [x, y] = [nomDeLaFigure.indexOf(demande[1]), nomDeLaFigure.indexOf(demande[2])];
      const cote = Math.min(x, y) === 0 && Math.max(x, y) === 3 ? 3 : Math.min(x, y);
      return nombre(Math.round(cotes[cote] * echelles[0]), 'cm');
    }
    case 'regle-lire':
    case 'regle-depart':
    case 'regle-millimetres': {
      const { debut, fin } = lireLaRegle(figure!);
      const [g, h] = /segment \[(\S)(\S)\]/.exec(prompt)!.slice(1);
      const trait = segments(figure!).find((entree) => entree.ink === 'couleur' && entree.width === 3.5)!;
      const noms = lettresDuDessin(figure!, 14).sort((a, b) => a.at[0] - b.at[0]);
      expect(noms.map((entree) => entree.text), question.id).toEqual([g, h]);
      expect([Math.abs(noms[0].at[0] - trait.from[0]), Math.abs(noms[1].at[0] - trait.to[0])].every((ecart) => ecart < 0.6), `${question.id} : les lettres sont aux extrémités`).toBe(true);
      return texte(formatLength(fin - debut, nom === 'regle-millimetres' ? -2 : nom === 'regle-depart' ? -3 : -4));
    }
    case 'tracer-segment': {
      const [a, b] = /segment \[(\S)(\S)\]/.exec(prompt)!.slice(1);
      const longueur = chiffres[0];
      const construction = question.construction!;
      const depart = points(figure!)[0];
      const graduation = plusProche(textes(figure!).filter((entree) => entree.size === 13 && /^\d+$/.test(entree.text)), (entree) => [entree.at[0], depart[1]], depart);
      expect(Math.abs(graduation.at[0] - depart[0]), `${question.id} : le point de départ est sur une graduation`).toBeLessThan(0.5);
      const fin = Number(graduation.text) + longueur;
      expect(construction.rule.kind === 'points' && construction.rule.expected, question.id).toEqual([[fin, 0]]);
      // Le nœud attendu est bien sur la graduation de la règle.
      const attendue = textes(figure!).find((entree) => entree.size === 13 && entree.text === String(fin))!;
      expect(Math.abs(nodePoint(construction.grid, [fin, 0])[0] - attendue.at[0]), question.id).toBeLessThan(0.5);
      expect(lettresDuDessin(figure!, 14)[0].text, question.id).toBe(a);
      expect(construction.solution.some((forme) => forme.kind === 'text' && forme.text === b), question.id).toBe(true);
      return { genre: 'construction' };
    }
    case 'deplacements':
    case 'deplacements-boucle': {
      const depart = /case ([A-E][1-5])\./.exec(prompt)![1];
      const noeud: Node = ['ABCDE'.indexOf(depart[0]), Number(depart[1]) - 1];
      const repetitions = /répète (\d+) fois/.exec(prompt);
      let [colonne, ligne] = noeud;
      const pas = [...prompt.matchAll(/(\d+) cases? (à droite|à gauche|en bas|en haut)/g)];
      for (let tour = 0; tour < (repetitions ? Number(repetitions[1]) : 1); tour++) {
        pas.forEach((entree) => {
          colonne += DIRECTIONS[entree[2]][0] * Number(entree[1]);
          ligne += DIRECTIONS[entree[2]][1] * Number(entree[1]);
          expect(colonne >= 0 && colonne <= 4 && ligne >= 0 && ligne <= 4, `${question.id} : le robot sort de la grille`).toBe(true);
        });
      }
      const robot = figure!.shapes.find((forme) => forme.kind === 'circle') as Extract<Shape, { kind: 'circle' }>;
      expect(nomDeCase([Math.floor((robot.center[0] - 85) / 32), Math.floor((robot.center[1] - 30) / 32)]), `${question.id} : le robot est au départ`).toBe(depart);
      return texte(nomDeCase([colonne, ligne]));
    }
    case 'perimetre-polygone': {
      if (!figure) {
        const [x, y, z] = chiffres;
        verifierQuePolygoneExiste([x, y, z], question.id);
        return nombre(x + y + z, 'cm');
      }
      const nomDuPolygone = /polygone (\S+) \?/.exec(prompt)![1];
      const sommets = polygones(figure)[0].points;
      expect(lettresDesSommets(figure, sommets), question.id).toBe(nomDuPolygone);
      const longueurs = textes(figure).flatMap((entree) => (longueurEcrite(entree.text) === null ? [] : [longueurEcrite(entree.text)!]));
      expect(longueurs, `${question.id} : une longueur par côté`).toHaveLength(sommets.length);
      verifierQuePolygoneExiste(longueurs, question.id);
      return nombre(longueurs.reduce((somme, valeur) => somme + valeur, 0), 'cm');
    }
    case 'milieu': {
      const [a, b] = /segment \[(\S)(\S)\]/.exec(prompt)!.slice(1);
      const trait = segments(figure!).find((entree) => entree.width === 3)!;
      const lieux = points(figure!);
      const lettres = lettresDuDessin(figure!, 14);
      const lettreDe = (point: Point) => plusProche(lettres, (entree) => entree.at, point).text;
      expect([lettreDe(trait.from), lettreDe(trait.to)], question.id).toEqual([a, b]);
      const milieu: Point = [(trait.from[0] + trait.to[0]) / 2, (trait.from[1] + trait.to[1]) / 2];
      const candidats = lieux.filter((point) => distance(point, trait.from) > 1 && distance(point, trait.to) > 1);
      const justes = candidats.filter((point) => distance(point, milieu) < 0.6);
      expect(justes, question.id).toHaveLength(1);
      candidats.filter((point) => distance(point, milieu) >= 0.6).forEach((point) => expect(distance(point, milieu), `${question.id} : trop près du milieu`).toBeGreaterThan(20));
      return texte(lettreDe(justes[0]));
    }
    case 'construire-milieu': {
      const [k, l] = /segment \[(\S)(\S)\]/.exec(prompt)!.slice(1);
      const construction = question.construction!;
      const [a, b] = construction.fixed!;
      expect(construction.rule.kind === 'points' && construction.rule.expected, question.id).toEqual([[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]]);
      const trait = segments(figure!).find((entree) => entree.width === 3)!;
      expect([trait.from, trait.to], question.id).toEqual([nodePoint(construction.grid, a), nodePoint(construction.grid, b)]);
      expect(lettresDuDessin(figure!, 14).map((entree) => entree.text).sort(), question.id).toEqual([k, l].sort());
      return { genre: 'construction' };
    }
    case 'triangle-rectangle': {
      const lettres = lettresDuDessin(figure!, 17);
      const droits = polygones(figure!).map((triangle) => anglesDuPolygone(triangle.points).some((mesure) => Math.abs(mesure - 90) < 0.5));
      expect(droits.filter(Boolean), question.id).toHaveLength(1);
      polygones(figure!).forEach((triangle, index) => {
        if (!droits[index]) anglesDuPolygone(triangle.points).forEach((mesure) => expect(Math.abs(mesure - 90), `${question.id} : trop près de l'angle droit`).toBeGreaterThanOrEqual(21));
      });
      const centre = (triangle: Polygone): Point => barycentre(triangle.points);
      const triangle = polygones(figure!)[droits.indexOf(true)];
      const lettre = plusProche(lettres, (entree): Point => [entree.at[0] + 62, entree.at[1] + 32], centre(triangle)).text;
      return texte(lettre);
    }
    case 'cercle-ce2':
    case 'cercle-6e': {
      if (/rayon|diamètre/.test(prompt) && (m = /^Le rayon d'un (?:cercle|disque) mesure (\d+(?:,\d+)?) cm/.exec(prompt))) return nombre(2 * (parseFrenchNumber(m[1]) as number), 'cm');
      if ((m = /diamètre de (\d+) cm/.exec(prompt))) return nombre(Number(m[1]) / 2, 'cm');
      if ((m = /^Le diamètre d'un cercle mesure (\d+) cm/.exec(prompt))) return nombre(Number(m[1]) / 2, 'cm');
      if (question.figure && /Quel segment est/.test(prompt)) return texte(segmentDuCercle(question, prompt));
      return texte(DEFINITIONS[prompt]);
    }
    case 'losange': {
      const [nomDeLaFigure] = /losange (\S+) a/.exec(prompt)!.slice(1);
      const sommets = polygones(figure!)[0].points;
      expect(lettresDesSommets(figure!, sommets), question.id).toBe(nomDeLaFigure);
      expect(egaux(cotesDuPolygone(sommets), 1.5), `${question.id} : un losange a quatre côtés égaux`).toBe(true);
      return nombre(chiffres[0], 'cm');
    }
    case 'axes-symetrie':
    case 'axes-symetrie-6e': {
      const nomDeLaFigure = /la figure (\S+) \?/.exec(prompt)![1];
      const sommets = polygones(figure!)[0].points;
      expect(lettresDesSommets(figure!, sommets), question.id).toBe(nomDeLaFigure);
      return nombre(axesDeSymetrie(sommets));
    }
    case 'solides-ce2': {
      if (!figure) {
        const solide = /faces d'(un cube|un pavé droit)/.exec(prompt)![1];
        return texte(solide === 'un cube' ? 'des carrés' : 'des rectangles');
      }
      const traits = segments(figure);
      const sommets = new Set(traits.flatMap((trait) => [trait.from.join(), trait.to.join()]));
      const [aretes, nombreDeSommets] = [traits.length, sommets.size];
      // La formule d'Euler : sommets − arêtes + faces = 2.
      const faces = 2 - nombreDeSommets + aretes;
      return nombre(/de faces/.test(prompt) ? faces : /d'arêtes/.test(prompt) ? aretes : nombreDeSommets);
    }
    case 'patron-cube':
    case 'patron-cube-6e': {
      const lettres = lettresDuDessin(figure!, 16);
      const carres = polygones(figure!);
      const reseaux = lettres.map((lettre) => {
        const cellules = carres
          .filter((carre) => (carre.points[0][0] < 150) === (lettre.at[0] < 150) && (carre.points[0][1] < 100) === (lettre.at[1] < 100))
          .map((carre): [number, number] => [Math.round((carre.points[0][0] - lettre.at[0] - 22) / 16), Math.round((carre.points[0][1] - (lettre.at[1] - 12)) / 16)]);
        return { lettre: lettre.text, cube: isCubeNet(cellules) };
      });
      expect(reseaux.filter((reseau) => reseau.cube), question.id).toHaveLength(1);
      return texte(reseaux.find((reseau) => reseau.cube)!.lettre);
    }
    case 'perimetre-carre-rectangle': {
      expect(textes(figure!).filter((entree) => longueurEcrite(entree.text) !== null).length, question.id).toBeGreaterThan(0);
      const ecrites = textes(figure!).flatMap((entree) => (longueurEcrite(entree.text) === null ? [] : [longueurEcrite(entree.text)!]));
      expect(ecrites.every((valeur) => chiffres.includes(valeur)), `${question.id} : les longueurs de la figure sont celles de l'énoncé`).toBe(true);
      return nombre(prompt.includes('carré') ? 4 * chiffres[0] : 2 * (chiffres[0] + chiffres[1]), 'cm');
    }
    case 'aires-recouvrement': {
      const aires = figure!.shapes.filter((forme): forme is Extract<Shape, { kind: 'aire' }> => forme.kind === 'aire');
      const comptes = aires.map((aire) => aire.rings.length);
      expect(new Set(comptes).size, `${question.id} : trois aires différentes`).toBe(3);
      if (/Combien de carreaux recouvre la figure (\S) \?/.test(prompt)) return nombre(comptes['ABC'.indexOf(/figure (\S) \?/.exec(prompt)![1])]);
      return texte('ABC'[comptes.indexOf(prompt.includes('plus grande') ? Math.max(...comptes) : Math.min(...comptes))]);
    }
    // --- Les constructions reprises du CM
    case 'reproduire-figure':
    case 'construire-symetrie-ce2':
    case 'construire-symetrie-6e':
    case 'construire-droite-6e':
      return { genre: 'construction' };
    // --- 6e
    case 'milieu-distance': {
      const [, i, a, b] = /Le point (\S) est le milieu (?:du segment|de) \[(\S)(\S)\]/.exec(prompt)!;
      expect(lettresDuDessin(figure!, 14).map((entree) => entree.text).sort(), question.id).toEqual([a, b, i].sort());
      expect(figure!.shapes.filter((forme) => forme.kind === 'codage'), `${question.id} : les deux moitiés sont codées`).toHaveLength(2);
      const donnee = parseFrenchNumber(/(\d+(?:,\d+)?) cm/.exec(prompt)![1]) as number;
      // La longueur donnée est celle du segment entier (« AB = 7 cm ») ou d'une moitié (« AI = 4,5 cm »).
      return nombre(prompt.includes(`${a}${b} = `) ? donnee / 2 : 2 * donnee, 'cm');
    }
    case 'perimetre-6e': {
      if (!figure) {
        if (/triangle|pentagone|hexagone|octogone/.test(prompt)) {
          const cotes = { triangle: 3, pentagone: 5, hexagone: 6, octogone: 8 }[/(triangle|pentagone|hexagone|octogone)/.exec(prompt)![1] as 'triangle'];
          return nombre(Math.round(cotes * chiffres[0] * 10) / 10, 'cm');
        }
      }
      if (/polygone (\S+) \?/.test(prompt)) {
        const sommets = polygones(figure!)[0].points;
        expect(lettresDesSommets(figure!, sommets), question.id).toBe(/polygone (\S+) \?/.exec(prompt)![1]);
        const longueurs = textes(figure!).flatMap((entree) => (longueurEcrite(entree.text) === null ? [] : [longueurEcrite(entree.text)!]));
        expect(longueurs, question.id).toHaveLength(sommets.length);
        verifierQuePolygoneExiste(longueurs, question.id);
        return nombre(Math.round(longueurs.reduce((somme, valeur) => somme + valeur, 0) * 10) / 10, 'cm');
      }
      const ecrites = textes(figure!).flatMap((entree) => (longueurEcrite(entree.text) === null ? [] : [longueurEcrite(entree.text)!]));
      expect(ecrites.every((valeur) => chiffres.includes(valeur)), `${question.id} : les longueurs de la figure sont celles de l'énoncé`).toBe(true);
      return nombre(Math.round((prompt.includes('carré') ? 4 * chiffres[0] : 2 * (chiffres[0] + chiffres[1])) * 10) / 10, 'cm');
    }
    case 'droites-nommees-6e': {
      const traits = segments(figure!).filter((trait) => trait.width === 2.5);
      expect(traits, question.id).toHaveLength(3);
      const noms = textes(figure!).filter((entree) => /^\(d\d\)$/.test(entree.text));
      expect(noms, question.id).toHaveLength(3);
      // Chaque nom est posé tout près de sa droite.
      const parNom = new Map(noms.map((entree) => [entree.text, plusProche(traits, (trait): Point => pointLePlusProche(entree.at, trait), entree.at)]));
      const paires = [['(d1)', '(d2)'], ['(d1)', '(d3)'], ['(d2)', '(d3)']];
      const parallele = /parallèles/.test(prompt);
      const bonnes = paires.filter(([x, y]) => {
        const ecart = Math.abs(directionDeLaDroite(parNom.get(x)!) - directionDeLaDroite(parNom.get(y)!));
        return parallele ? Math.min(ecart, 180 - ecart) < 1 : Math.abs(ecart - 90) < 1;
      });
      expect(bonnes, question.id).toHaveLength(1);
      return texte(`${bonnes[0][0]} et ${bonnes[0][1]}`);
    }
    case 'proprietes-droites': {
      if (/perpendiculaires à la droite/.test(prompt)) return texte('Elles sont parallèles.');
      if (/parallèles\. Les droites .* sont parallèles/.test(prompt)) return texte('Elles sont parallèles.');
      return texte('Elles sont perpendiculaires.');
    }
    case 'angle-type': {
      const [a, b, c] = /angle (\S)(\S)(\S) est-il/.exec(prompt)!.slice(1);
      const sommet = points(figure!)[0];
      const [bras1, bras2] = segments(figure!).filter((trait) => distance(trait.from, sommet) < 0.2);
      const lettres = lettresDuDessin(figure!, 14);
      expect([plusProche(lettres, (entree) => entree.at, bras1.to).text, plusProche(lettres, (entree) => entree.at, sommet).text, plusProche(lettres, (entree) => entree.at, bras2.to).text].join(''), question.id).toBe(`${a}${b}${c}`);
      const mesure = angle(sommet, bras1.to, bras2.to);
      expect(Math.abs(mesure - 90) < 0.5 || Math.abs(mesure - 90) > 14, `${question.id} : trop près de l'angle droit`).toBe(true);
      return texte(Math.abs(mesure - 90) < 0.5 ? 'droit' : mesure < 90 ? 'aigu' : 'obtus');
    }
    case 'angle-rapporteur': {
      const [a, b, c] = /angle (\S)(\S)(\S) \?/.exec(prompt)!.slice(1);
      const sommet = points(figure!)[0];
      const [bras1, bras2] = segments(figure!).filter((trait) => trait.ink === 'couleur' && distance(trait.from, sommet) < 0.2);
      expect(bras1.to[1], `${question.id} : un bras suit la graduation 0`).toBe(sommet[1]);
      const lettres = lettresDuDessin(figure!, 14);
      expect([plusProche(lettres, (entree) => entree.at, bras1.to).text, plusProche(lettres, (entree) => entree.at, bras2.to).text], question.id).toEqual([a, c]);
      expect(lettres.some((entree) => entree.text === b), question.id).toBe(true);
      return nombre(Math.round(angle(sommet, bras1.to, bras2.to)), '°');
    }
    case 'angles-vocabulaire': {
      const mesure = (x: string, y: string) => mesureDeLAngle(figure!, x, y);
      if (/opposé par le sommet à l'angle (\S+) \?/.test(prompt)) {
        const donne = /l'angle (\S)O(\S) \?/.exec(prompt)!;
        const cible = mesure(donne[1], donne[2]);
        const justes = question.choices.filter((choix) => Math.abs(mesure(choix[0], choix[2]) - cible) < 0.5);
        expect(justes, question.id).toHaveLength(1);
        return texte(justes[0]);
      }
      if (/angle plat/.test(prompt)) {
        const plats = question.choices.filter((choix) => Math.abs(mesure(choix[0], choix[2]) - 180) < 0.5);
        expect(plats, question.id).toHaveLength(1);
        return texte(plats[0]);
      }
      const donne = /L'angle (\S)O(\S) mesure (\d+)°/.exec(prompt)!;
      expect(Math.round(mesure(donne[1], donne[2])), `${question.id} : l'angle donné est celui du dessin`).toBe(Number(donne[3]));
      const demande = /Combien mesure l'angle (\S)O(\S) \?/.exec(prompt)!;
      return nombre(Math.round(mesure(demande[1], demande[2])), '°');
    }
    case 'construire-symetrique': {
      const construction = question.construction!;
      const axe = segments(figure!).find((trait) => trait.ink === 'couleur' && trait.width === 3)!;
      const lieu = points(figure!)[0];
      // Le symétrique du point par rapport à l'axe tracé, calculé sur le dessin puis ramené à la grille.
      const [ux, uy] = [axe.to[0] - axe.from[0], axe.to[1] - axe.from[1]];
      const longueurCarree = ux * ux + uy * uy;
      const t = ((lieu[0] - axe.from[0]) * ux + (lieu[1] - axe.from[1]) * uy) / longueurCarree;
      const pied: Point = [axe.from[0] + t * ux, axe.from[1] + t * uy];
      const image: Point = [2 * pied[0] - lieu[0], 2 * pied[1] - lieu[1]];
      const noeud: Node = [(image[0] - construction.grid.origin[0]) / construction.grid.cell, (image[1] - construction.grid.origin[1]) / construction.grid.cell];
      expect(Math.abs(noeud[0] - Math.round(noeud[0])) < 0.02 && Math.abs(noeud[1] - Math.round(noeud[1])) < 0.02, `${question.id} : le symétrique est sur un nœud`).toBe(true);
      expect(construction.rule.kind === 'points' && construction.rule.expected, question.id).toEqual([[Math.round(noeud[0]), Math.round(noeud[1])]]);
      return { genre: 'construction' };
    }
    case 'aire-6e': {
      if ((m = /^Complète : (\S+) (m²|dm²|cm²) = … (m²|dm²|cm²)$/.exec(prompt))) {
        const valeur = parseFrenchNumber(m[1]) as number;
        return nombre(Math.round(((valeur * FACTEURS_D_AIRES[m[2]]) / FACTEURS_D_AIRES[m[3]]) * 100) / 100);
      }
      const ecrites = textes(figure!).flatMap((entree) => (longueurEcrite(entree.text) === null ? [] : [longueurEcrite(entree.text)!]));
      expect(ecrites.every((valeur) => chiffres.includes(valeur)), `${question.id} : les longueurs de la figure sont celles de l'énoncé`).toBe(true);
      return nombre(Math.round((prompt.includes('carré') ? chiffres[0] * chiffres[0] : chiffres[0] * chiffres[1]) * 100) / 100, 'cm²');
    }
    case 'mediatrice': {
      if (figure) {
        const trait = segments(figure).find((entree) => entree.width === 3)!;
        const pm = points(figure).find((point) => point[0] === 150 && point[1] < 150)!;
        expect(Math.abs(distance(trait.from, pm) - distance(trait.to, pm)), `${question.id} : M est à égale distance de A et de B`).toBeLessThan(0.5);
        // « MA = 5,5 cm » : la distance de M à B est la même.
        return nombre(parseFrenchNumber(/= (\d+(?:,\d+)?) cm/.exec(prompt)![1]) as number, 'cm');
      }
      const segment = /\[(\S+)\]/.exec(prompt)![0];
      return texte(prompt.includes('Par quel point') ? `le milieu de ${segment}` : `la médiatrice de ${segment}`);
    }
    case 'construire-mediatrice': {
      const construction = question.construction!;
      const [a, b] = construction.fixed!;
      const milieu: Node = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      expect(Number.isInteger(milieu[0]) && Number.isInteger(milieu[1]), question.id).toBe(true);
      expect(construction.rule.kind === 'direction' && sameNode(construction.rule.from, milieu), question.id).toBe(true);
      expect(construction.rule.kind === 'direction' && construction.rule.relation, question.id).toBe('perpendiculaire');
      expect(construction.rule.kind === 'direction' && sameNode(construction.rule.along, [b[0] - a[0], b[1] - a[1]]), question.id).toBe(true);
      return { genre: 'construction' };
    }
    case 'bissectrice': {
      const bissectrice = /demi-droite \[\S(\S)\)/.exec(prompt)![1];
      const sommet = points(figure!)[0];
      const traits = segments(figure!).filter((trait) => distance(trait.from, sommet) < 0.2);
      const pointille = traits.find((trait) => trait.dashed)!;
      const [bras1, bras2] = traits.filter((trait) => !trait.dashed);
      const entier = angle(sommet, bras1.to, bras2.to);
      // La demi-droite en pointillés coupe bien l'angle en deux angles égaux.
      expect(Math.abs(angle(sommet, bras1.to, pointille.to) - angle(sommet, pointille.to, bras2.to)), question.id).toBeLessThan(0.6);
      const donnee = Number(/mesure (\d+)°/.exec(prompt)![1]);
      const demande = /Combien mesure l'angle (\S+) \?/.exec(prompt)![1];
      if (demande[2] === bissectrice) {
        expect(Math.round(entier), `${question.id} : l'angle entier est celui du dessin`).toBe(donnee);
        return nombre(Math.round(entier / 2), '°');
      }
      expect(Math.round(entier / 2), `${question.id} : l'angle donné est la moitié de celui du dessin`).toBe(donnee);
      return nombre(Math.round(entier), '°');
    }
    case 'triangle-angles': {
      const sommets = polygones(figure!)[0].points;
      const lettres = /triangle (\S)(\S)(\S)/.exec(prompt)!.slice(1).join('');
      expect(lettresDesSommets(figure!, sommets), question.id).toBe(lettres);
      const mesures = anglesDuPolygone(sommets).map(Math.round);
      expect(mesures.reduce((somme, valeur) => somme + valeur, 0), question.id).toBeGreaterThanOrEqual(179);
      const demande = /Combien mesure l'angle (\S) \?/.exec(prompt);
      if (!demande) {
        mesures.forEach((mesure) => expect(mesure, question.id).toBe(60));
        return nombre(60, '°');
      }
      // Les angles donnés dans l'énoncé sont ceux du dessin.
      [...prompt.matchAll(/l'angle (\S) mesure (\d+)°/g)].forEach((donnee) => expect(mesures[lettres.indexOf(donnee[1])], `${question.id} : l'angle ${donnee[1]} du dessin`).toBe(Number(donnee[2])));
      if (/rectangle en (\S)/.test(prompt)) expect(mesures[lettres.indexOf(/rectangle en (\S)/.exec(prompt)![1])], question.id).toBe(90);
      return nombre(mesures[lettres.indexOf(demande[1])], '°');
    }
    default:
      throw new Error(`Aucun contrôle pour la famille « ${nom} »`);
  }
}

const DEFINITIONS: Record<string, string> = {
  "Comment s'appelle le segment qui relie le centre d'un cercle à un point du cercle ?": 'un rayon',
  "Un segment relie deux points d'un cercle sans passer par le centre. Comment s'appelle-t-il ?": 'une corde',
  "Quelle est la plus longue corde d'un cercle ?": 'le diamètre',
  "Tous les points d'un cercle sont à la même distance de quoi ?": 'de son centre',
  "Comment s'appelle la surface à l'intérieur d'un cercle, bord compris ?": 'un disque',
};

/** Le point d'un segment le plus proche de `point`. */
function pointLePlusProche(point: Point, trait: Segment): Point {
  const [ux, uy] = [trait.to[0] - trait.from[0], trait.to[1] - trait.from[1]];
  const t = Math.max(0, Math.min(1, ((point[0] - trait.from[0]) * ux + (point[1] - trait.from[1]) * uy) / (ux * ux + uy * uy)));
  return [trait.from[0] + t * ux, trait.from[1] + t * uy];
}

const distancePointDroite = (point: Point, trait: Segment) => {
  const [ux, uy] = [trait.to[0] - trait.from[0], trait.to[1] - trait.from[1]];
  return Math.abs(ux * (trait.from[1] - point[1]) - (trait.from[0] - point[0]) * uy) / Math.hypot(ux, uy);
};

/** Le segment du cercle qui est un diamètre, un rayon ou une corde, d'après sa position sur le dessin. */
function segmentDuCercle(question: Question, prompt: string): string {
  const figure = question.figure!;
  const cercle = figure.shapes.find((forme) => forme.kind === 'circle') as Extract<Shape, { kind: 'circle' }>;
  const traits = segments(figure).filter((trait) => trait.width === 2.5);
  const lettres = lettresDuDessin(figure, 14);
  const lettreDe = (point: Point) => (distance(point, cercle.center) < 0.5 ? 'O' : plusProche(lettres.filter((entree) => entree.text !== 'O'), (entree) => entree.at, point).text);
  const nommes = traits.map((trait) => ({ nom: `[${lettreDe(trait.from)}${lettreDe(trait.to)}]`, de: trait.from, vers: trait.to }));
  const nature = (trait: { de: Point; vers: Point }) => {
    const [deCentre, versCentre] = [distance(trait.de, cercle.center), distance(trait.vers, cercle.center)];
    if (deCentre < 0.5 || versCentre < 0.5) return 'rayon';
    return distancePointDroite(cercle.center, { kind: 'segment', from: trait.de, to: trait.vers }) < 1 ? 'diamètre' : 'corde';
  };
  const demande = /un (diamètre|rayon)|une (corde)/.exec(prompt)!;
  const voulue = demande[1] ?? demande[2];
  const justes = nommes.filter((trait) => nature(trait) === voulue);
  expect(justes, question.id).toHaveLength(1);
  // Les noms proposés sont ceux des trois segments du dessin.
  expect([...question.choices].sort(), question.id).toEqual(nommes.map((trait) => trait.nom).sort().map((nom) => nom));
  return justes[0].nom;
}

/** Cette proposition est-elle la bonne réponse ? */
function estLaBonne(reponse: Attendu, choix: string): boolean {
  if (reponse.genre === 'texte') return choix === reponse.valeur;
  if (reponse.genre === 'construction') return false;
  // Une mesure d'angle s'écrit collée à son signe (« 65° ») ; les autres unités sont séparées par une espace.
  const m = /^(\d+(?:,\d+)?)(?: (.+)|(°))?$/.exec(choix);
  return m !== null && egal(parseFrenchNumber(m[1]) as number, reponse.valeur) && (m[2] ?? m[3]) === reponse.unite;
}

/** Des côtés qui forment un polygone : le plus long est plus court que tous les autres ensemble. */
function verifierQuePolygoneExiste(longueurs: number[], contexte: string) {
  expect(2 * Math.max(...longueurs), `${contexte} : ces côtés ne forment pas un polygone (${longueurs.join(', ')})`).toBeLessThan(longueurs.reduce((somme, valeur) => somme + valeur, 0));
}

describe('les questions de géométrie du CE1, du CE2 et de la 6e', () => {
  it('ont trois ou quatre propositions différentes, ou une construction, une consigne et une explication', () => {
    parCellule((level, trimester) => questions(level, trimester, 12)).forEach(({ level, trimester, valeur }) => {
      expect(valeur.length, `${level} T${trimester}`).toBe(12 * GRAINES);
      valeur.forEach((question) => {
        expect(question.domain).toBe('geometrie');
        expect(question.explanation, question.id).toBeTruthy();
        expect(question.instruction, question.id).toBeTruthy();
        if (question.construction) {
          expect(question.choices, question.id).toEqual([]);
          return;
        }
        expect(question.choices.length, `${level} T${trimester} ${question.prompt}`).toBeGreaterThanOrEqual(3);
        expect(question.choices.length, question.prompt).toBeLessThanOrEqual(4);
        expect(new Set(question.choices).size, question.prompt).toBe(question.choices.length);
        expect(question.choices[question.correctIndex], question.prompt).toBeDefined();
      });
    });
  });

  it('sont reproductibles à graine égale', () => {
    NIVEAUX.forEach((level) => {
      expect(generate(level, 2, createRng(9), 20)).toEqual(generate(level, 2, createRng(9), 20));
    });
  });

  it('proposent la bonne réponse, refaite à partir du dessin, et aucune autre qui la vaille', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) =>
      valeur.forEach((question) => {
        const reponse = attendu(question, level);
        if (reponse.genre === 'construction') {
          expect(question.construction, `${level} T${trimester} ${question.id}`).toBeDefined();
          return;
        }
        const justes = question.choices.filter((choix) => estLaBonne(reponse, choix));
        expect(justes, `${level} T${trimester} « ${question.prompt} » : ${question.choices.join(' / ')}`).toEqual([question.choices[question.correctIndex]]);
      })
    );
  });

  it('proposent des constructions justes : la solution est acceptée, un point manquant ne l\'est pas', () => {
    parCellule((level, trimester) => questions(level, trimester).filter((question) => question.construction)).forEach(({ valeur }) => valeur.forEach(verifierLaConstruction));
  });

  it('ont des dessins qui tiennent dans leur cadre, avec un texte alternatif qui ne donne pas la réponse', () => {
    parCellule((level, trimester) => questions(level, trimester).filter((question) => question.figure)).forEach(({ valeur }) =>
      valeur.forEach((question) => {
        expect(fitsInFrame(question.figure!), question.id).toBe(true);
        expect(question.figure!.alt.length, question.id).toBeGreaterThan(10);
        const bonne = question.choices[question.correctIndex];
        if (bonne !== undefined && /^\d+( |$)/.test(bonne)) expect(question.figure!.alt, `${question.id} : ${bonne}`).not.toMatch(new RegExp(`(^|\\s)${bonne.split(' ')[0]}(\\s|\\.|,|$)`));
      })
    );
  });
});

describe('les sortes de questions de géométrie', () => {
  const nomsDe = (level: Level, trimester: Trimester) => new Set(questions(level, trimester, 24, 40).map((question) => familleDe(question, level)));
  const famillesDe = (level: Level) => (level === '6e' ? FAMILLES.sixieme : FAMILLES.cycle2);

  it('tirent chaque sorte déjà enseignée : aucune n\'échappe aux vérifications', () => {
    parCellule((level, trimester) => nomsDe(level, trimester)).forEach(({ level, trimester, valeur }) => {
      const attendues = availableAt(famillesDe(level), stageOf(level, trimester)).map((famille) => famille.name);
      expect([...valeur].sort(), `${level} T${trimester}`).toEqual([...attendues].sort());
    });
  });

  it('ne laissent sortir aucune sorte avant son étape', () => {
    parCellule((level, trimester) => nomsDe(level, trimester)).forEach(({ level, trimester, valeur }) => {
      const stage = stageOf(level, trimester);
      valeur.forEach((nom) => expect(famillesDe(level).find((famille) => famille.name === nom)!.minStage, `${level} T${trimester} ${nom}`).toBeLessThanOrEqual(stage));
    });
  });

  it('apportent du nouveau à chaque trimestre : au moins deux sortes dans le cycle 2, quatre en 6e', () => {
    parCellule((level, trimester) => famillesDe(level).filter((famille) => famille.minStage === stageOf(level, trimester)).length).forEach(({ level, trimester, valeur }) => {
      expect(valeur, `${level} T${trimester}`).toBeGreaterThanOrEqual(level === '6e' ? 4 : 2);
    });
  });
});

describe('ce que la géométrie des nouveaux niveaux ne dit pas encore', () => {
  const tout = (question: Question) => [question.instruction ?? '', question.prompt, ...question.choices, question.explanation ?? '', question.figure?.alt ?? ''].join(' ');
  const contient = (level: Level, trimester: Trimester, motif: RegExp) => questions(level, trimester).some((question) => motif.test(tout(question)));

  it('n\'écrit au CE1 et au CE2 ni décimal, ni degré, ni angle aigu ou obtus, ni rapporteur', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questions(level, trimester).forEach((question) => {
          expect(tout(question), `${level} T${trimester} ${question.prompt}`).not.toMatch(/\d,\d|°|aigu|obtus|rapporteur|médiatrice|bissectrice|disque|corde/);
        })
      )
    );
  });

  it('commence les angles et le périmètre au CE2, et la symétrie au 2e trimestre du CE2', () => {
    expect(contient('CE1', 3, /périmètre|\baire\b|symétrie|milieu/)).toBe(false);
    expect(contient('CE2', 1, /périmètre/)).toBe(true);
    expect(contient('CE2', 1, /symétrie|diamètre|losange/)).toBe(false);
    expect(contient('CE2', 2, /symétrie/)).toBe(true);
    expect(contient('CE2', 2, /losange/)).toBe(true);
    expect(contient('CE2', 3, /\baire\b/)).toBe(true);
  });

  it('commence en 6e par ce que les élèves savent, puis l\'angle, la symétrie et l\'aire, puis la médiatrice', () => {
    expect(contient('6e', 1, /rapporteur|symétri|médiatrice|bissectrice|cm²|opposé/)).toBe(false);
    expect(contient('6e', 2, /rapporteur/)).toBe(true);
    expect(contient('6e', 2, /symétri/)).toBe(true);
    expect(contient('6e', 2, /cm²/)).toBe(true);
    expect(contient('6e', 2, /médiatrice|bissectrice/)).toBe(false);
    expect(contient('6e', 3, /médiatrice/)).toBe(true);
    expect(contient('6e', 3, /bissectrice/)).toBe(true);
  });

  it('n\'écrit en 6e ni Pythagore, ni trigonométrie, ni aire du disque, ni périmètre du cercle par la formule', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('6e', trimester).forEach((question) => {
        expect(tout(question), question.prompt).not.toMatch(/Pythagore|sinus|cosinus|tangente|π|aire du disque|2πr|coordonnées/);
      })
    );
  });

  it('ne dépasse pas, au CE1 et au CE2, les longueurs d\'un cahier : douze centimètres, vingt-quatre pour un diamètre', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questions(level, trimester).forEach((question) => {
          const longueurs = [...question.prompt.matchAll(/(\d+) cm(?! \d)/g)].map((m) => Number(m[1]));
          longueurs.forEach((longueur) => expect(longueur, question.prompt).toBeLessThanOrEqual(24));
        })
      )
    );
  });
});
