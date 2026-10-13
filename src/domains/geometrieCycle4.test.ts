import { describe, expect, it } from 'vitest';
import { distance, fitsInFrame, polar, round, type Figure, type Point, type Shape } from '../lib/figures';
import { stageOf, type Stage } from '../lib/progression';
import { createRng } from '../lib/seededRandom';
import { ALL_TRIMESTERS, type Level, type Trimester } from '../types';
import { generate } from './geometrie';
import { INSTRUCTION, INSTRUCTION_FIGURE } from './geometrieCollege';
import type { Family } from './geometrieCommun';
import { FAMILLES_CYCLE4 } from './geometrieCycle4';

/**
 * La géométrie de la 5e, de la 4e et de la 3e : chaque question est refaite
 * ici à partir de son énoncé et de sa figure, sans rien emprunter aux
 * générateurs, puis comparée aux propositions, dont une seule doit être juste.
 * Une figure se relit comme la lirait un élève : les graduations d'un repère,
 * les angles marqués d'un arc, les longueurs écrites le long des côtés, les
 * droites que l'on annonce parallèles ou alignées.
 */

type Tirage = ReturnType<Family['make']>;
type Forme<K extends Shape['kind']> = Extract<Shape, { kind: K }>;

/** Cinquante graines par famille et par étape suffisent à chaque exécution ; VITE_GRAINES_CYCLE4=2000 npm test pour une vérification plus longue. */
const GRAINES = Number(import.meta.env.VITE_GRAINES_CYCLE4 ?? 50);
const ETAPE_MAX = 18;

const parFamille = new Map<string, { tirage: Tirage; etape: Stage }[]>();
function tirages(famille: Family): { tirage: Tirage; etape: Stage }[] {
  const deja = parFamille.get(famille.name);
  if (deja) return deja;
  const etapes = Array.from({ length: ETAPE_MAX - famille.minStage + 1 }, (_, rang) => (famille.minStage + rang) as Stage);
  const liste = etapes.flatMap((etape) => Array.from({ length: GRAINES }, (_, graine) => ({ tirage: famille.make(createRng(graine * 7919 + etape * 13 + 1), etape), etape })));
  parFamille.set(famille.name, liste);
  return liste;
}

function assure(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// --- Lire les nombres, les mesures, les coordonnées ---------------------------------------------------------------------

const lire = (texte: string): number => Number(texte.replace(/[\u00a0\u202f ]/g, '').replace('−', '-').replace(',', '.'));
const proche = (a: number, b: number, tolerance = 1e-6): boolean => Math.abs(a - b) <= tolerance;
const arrondi = (n: number, decimales: number): number => Number(n.toFixed(decimales));
const rad = (degres: number): number => (degres * Math.PI) / 180;
const deg = (radians: number): number => (radians * 180) / Math.PI;
const NOMBRE = '−?\\d+(?:,\\d+)?';

/** Une proposition « 12,5 cm », « 52° », « 7 » : sa valeur et son unité. */
function mesure(choix: string): { valeur: number; unite: string } | null {
  const m = /^(−?\d[\d\u00a0\u202f]*(?:,\d+)?)(?: (cm²|cm³|cm|m)|(°))?$/.exec(choix);
  return m ? { valeur: lire(m[1]), unite: m[2] ?? m[3] ?? '' } : null;
}
/** La proposition vaut ce nombre, avec cette unité. */
const vaut =
  (attendu: number, unite: string, tolerance = 1e-9) =>
  (choix: string): boolean => {
    const lu = mesure(choix);
    return lu !== null && lu.unite === unite && proche(lu.valeur, attendu, tolerance);
  };

const COORDONNEES = new RegExp(`\\((${NOMBRE}) ; (${NOMBRE})\\)`, 'g');
/** Les paires « (3 ; −2) » d'un texte, dans l'ordre. */
const coordonneesDe = (texte: string): [number, number][] => [...texte.matchAll(COORDONNEES)].map((m) => [lire(m[1]), lire(m[2])]);
const coordonneesDe1 = (choix: string): [number, number] | null => (new RegExp(`^\\((${NOMBRE}) ; (${NOMBRE})\\)$`).test(choix) ? coordonneesDe(choix)[0] : null);
const estCoord =
  (x: number, y: number) =>
  (choix: string): boolean => {
    const lu = coordonneesDe1(choix);
    return lu !== null && proche(lu[0], x) && proche(lu[1], y);
  };
/** « 36π cm³ » : un multiple de π. */
const estPi =
  (coefficient: number, unite: 'cm²' | 'cm³') =>
  (choix: string): boolean => {
    const m = /^(\d[\d\u00a0\u202f]*(?:,\d+)?)π (cm[²³])$/.exec(choix);
    return m !== null && m[2] === unite && proche(lire(m[1]), coefficient);
  };

/** Une seule proposition est juste, et c'est celle que la question annonce. */
function verifier(t: Tirage, estJuste: (choix: string) => boolean): void {
  const justes = t.choices.filter(estJuste);
  if (justes.length !== 1 || !estJuste(t.choices[t.correctIndex])) {
    throw new Error(`« ${t.prompt} » → ${t.choices.join(' | ')} (annoncée : ${t.choices[t.correctIndex]}) : ${justes.length} proposition(s) juste(s) selon l'énoncé`);
  }
}

// --- Relire une figure ----------------------------------------------------------------------------------------------------------

const formes = <K extends Shape['kind']>(figure: Figure, genre: K): Forme<K>[] => figure.shapes.filter((forme): forme is Forme<K> => forme.kind === genre);
const polygone = (figure: Figure): Point[] => formes(figure, 'polygon')[0].points;
const nomDeSommet = (forme: Forme<'text'>): boolean => forme.bold === true && forme.size === 14 && forme.halo === true && /^[A-Z]['′]?$/.test(forme.text);

/** L'angle en `sommet`, entre les demi-droites vers `a` et vers `b`, en degrés. */
function angleEn(sommet: Point, a: Point, b: Point): number {
  const [ux, uy, vx, vy] = [a[0] - sommet[0], a[1] - sommet[1], b[0] - sommet[0], b[1] - sommet[1]];
  return deg(Math.acos((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))));
}
const alignes = (p: Point, q: Point, r: Point): boolean => Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])) / (distance(p, q) * distance(p, r)) < 0.02;
const paralleles = (a: Point, b: Point, c: Point, d: Point): boolean => Math.abs((b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])) / (distance(a, b) * distance(c, d)) < 0.02;
/** `q` est entre `p` et `r`, sur le segment. */
const entre = (p: Point, q: Point, r: Point): boolean => (p[0] - q[0]) * (r[0] - q[0]) + (p[1] - q[1]) * (r[1] - q[1]) < 0;

/** Les points nommés d'un repère, avec leurs coordonnées lues sur les graduations. */
function lireLeRepere(figure: Figure): Map<string, [number, number]> {
  const textes = formes(figure, 'text');
  const echelle = (graduations: { pixel: number; valeur: number }[]) => {
    assure(graduations.length >= 2, 'graduations illisibles');
    const [premiere, derniere] = [graduations[0], graduations[graduations.length - 1]];
    return (pixel: number) => premiere.valeur + ((pixel - premiere.pixel) * (derniere.valeur - premiere.valeur)) / (derniere.pixel - premiere.pixel);
  };
  const graduation = (forme: Forme<'text'>) => forme.size === 11 && /^−?\d+$/.test(forme.text);
  const lireX = echelle(textes.filter((forme) => graduation(forme) && forme.anchor === 'middle').map((forme) => ({ pixel: forme.at[0], valeur: lire(forme.text) })).sort((a, b) => a.pixel - b.pixel));
  const lireY = echelle(textes.filter((forme) => graduation(forme) && forme.anchor === 'end').map((forme) => ({ pixel: forme.at[1] - 4, valeur: lire(forme.text) })).sort((a, b) => a.pixel - b.pixel));
  const cercles = formes(figure, 'circle');
  const noms = textes.filter((forme) => forme.bold === true && forme.size === 14 && forme.halo === true);
  assure(noms.length === cercles.length, 'un nom pour chaque point');
  // Chaque nom va avec le point dont il est le plus près : l'appariement qui minimise la distance totale.
  const permutations = <T,>(liste: T[]): T[][] => (liste.length <= 1 ? [liste] : liste.flatMap((element, rang) => permutations([...liste.slice(0, rang), ...liste.slice(rang + 1)]).map((reste) => [element, ...reste])));
  const [meilleure] = permutations(cercles.map((_, rang) => rang)).sort((a, b) => a.reduce((somme, c, rang) => somme + distance(cercles[c].center, noms[rang].at), 0) - b.reduce((somme, c, rang) => somme + distance(cercles[c].center, noms[rang].at), 0));
  const points = new Map<string, [number, number]>();
  noms.forEach((nom, rang) => {
    const cercle = cercles[meilleure[rang]];
    assure(distance(cercle.center, nom.at) < 22, `le nom ${nom.text} est loin de son point`);
    const [x, y] = [lireX(cercle.center[0]), lireY(cercle.center[1])];
    assure(proche(x, Math.round(x), 0.05) && proche(y, Math.round(y), 0.05), `le point ${nom.text} n'est pas sur un nœud du quadrillage (${x} ; ${y})`);
    points.set(nom.text, [Math.round(x), Math.round(y)]);
  });
  return points;
}

/** Les angles marqués d'un arc : le sommet, la mesure de l'arc, le texte écrit à côté (celui qui est posé le plus exactement le long de la bissectrice de l'arc). */
function arcsMarques(figure: Figure): { centre: Point; mesure: number; texte: string }[] {
  const textes = formes(figure, 'text');
  return formes(figure, 'arc').map((arc) => {
    const milieu = (arc.from + arc.to) / 2;
    const ecart = (forme: Forme<'text'>) =>
      Math.min(...[36, 38, 40].map((rayon) => distance(forme.at, round([polar(arc.center, rayon, milieu)[0], polar(arc.center, rayon, milieu)[1] + 4]))));
    const [marque] = [...textes].sort((a, b) => ecart(a) - ecart(b));
    assure(marque !== undefined && ecart(marque) < 1.5, 'un arc sans texte');
    return { centre: arc.center, mesure: arc.to - arc.from, texte: marque.text };
  });
}

/** Chaque nom de sommet d'un polygone, associé au sommet le plus proche. */
function sommetsNommes(figure: Figure): Map<string, Point> {
  const sommets = polygone(figure);
  const noms = new Map<string, Point>();
  for (const nom of formes(figure, 'text').filter(nomDeSommet)) {
    const [plusProche] = [...sommets].sort((a, b) => distance(a, nom.at) - distance(b, nom.at));
    assure(distance(plusProche, nom.at) < 24, `le nom ${nom.text} est loin de tout sommet`);
    noms.set(nom.text, plusProche);
  }
  assure(new Set(noms.values()).size === sommets.length, 'un nom par sommet');
  return noms;
}

/** Ce qui est écrit le long de [RP], [PQ] et [QR] d'un triangle rectangle : « 4 cm », « ? » ou rien. Chaque longueur est rattachée au côté dont le milieu est le plus proche. */
function etiquettesDesCotes(figure: Figure): string[] {
  const sommets = polygone(figure);
  const milieux = [0, 1, 2].map((rang): Point => [(sommets[rang][0] + sommets[(rang + 1) % 3][0]) / 2, (sommets[rang][1] + sommets[(rang + 1) % 3][1]) / 2]);
  const lus = ['', '', ''];
  for (const longueur of formes(figure, 'text').filter((forme) => forme.size === 12)) {
    const rang = [0, 1, 2].sort((a, b) => distance(longueur.at, milieux[a]) - distance(longueur.at, milieux[b]))[0];
    assure(lus[rang] === '' && distance(longueur.at, milieux[rang]) < 45, `deux longueurs sur le même côté, ou une longueur loin de tout côté : ${longueur.text}`);
    lus[rang] = longueur.text;
  }
  return lus;
}

/** L'encombrement d'un texte, estimé : environ 0,58 fois sa taille par caractère, sa taille de haut. */
function boite(forme: Forme<'text'>): { gauche: number; droite: number; haut: number; bas: number } {
  const taille = forme.size ?? 14;
  const largeur = forme.text.length * taille * 0.58;
  const gauche = forme.anchor === 'start' ? forme.at[0] : forme.anchor === 'end' ? forme.at[0] - largeur : forme.at[0] - largeur / 2;
  return { gauche, droite: gauche + largeur, haut: forme.at[1] - taille * 0.78, bas: forme.at[1] + taille * 0.22 };
}
/** La part du plus petit texte qui est recouverte par l'autre. */
function recouvrement(a: ReturnType<typeof boite>, b: ReturnType<typeof boite>): number {
  const commun = Math.max(0, Math.min(a.droite, b.droite) - Math.max(a.gauche, b.gauche)) * Math.max(0, Math.min(a.bas, b.bas) - Math.max(a.haut, b.haut));
  return commun / Math.min((a.droite - a.gauche) * (a.bas - a.haut), (b.droite - b.gauche) * (b.bas - b.haut));
}

// --- Les triangles rectangles -----------------------------------------------------------------------------------------------

const cle = (a: string, b: string): string => [a, b].sort().join('');
/** Les longueurs écrites dans un énoncé : « RP = 4,5 cm » donne { RP → 4,5 }. */
function lesCotes(prompt: string): Map<string, number> {
  const cotes = new Map<string, number>();
  for (const m of prompt.matchAll(new RegExp(`\\b(\\w)(\\w) = (${NOMBRE}) cm\\b`, 'g'))) cotes.set(cle(m[1], m[2]), lire(m[3]));
  return cotes;
}

function triangleRectangleDe(prompt: string): { r: string; p: string; q: string } {
  const m = /Le triangle (\w)(\w)(\w) est rectangle en (\w)\./.exec(prompt);
  assure(m !== null && m[1] === m[4], `triangle rectangle illisible : ${prompt}`);
  return { r: m[1], p: m[2], q: m[3] };
}

type Role = 'adjacent' | 'oppose' | 'hypotenuse';
/** Vus de l'angle en P, [RP] est adjacent, [RQ] opposé et [PQ] est l'hypoténuse. */
function role(nom: string, { r, p, q }: { r: string; p: string; q: string }): Role {
  if (nom === cle(r, p)) return 'adjacent';
  if (nom === cle(r, q)) return 'oppose';
  assure(nom === cle(p, q), `le côté ${nom} n'est pas un côté du triangle ${r}${p}${q}`);
  return 'hypotenuse';
}
/** Les longueurs sont proportionnelles à 1 (hypoténuse), sin (opposé) et cos (adjacent) de l'angle. */
const PROPORTION: Record<Role, (angle: number) => number> = { hypotenuse: () => 1, oppose: (angle) => Math.sin(rad(angle)), adjacent: (angle) => Math.cos(rad(angle)) };

/** Les côtés écrits sur la figure d'un triangle rectangle : celui qu'on cherche porte « ? », les autres leur longueur, les derniers rien. */
function verifierLesCotes(t: Tirage, triangle: { r: string; p: string; q: string }, cherche: string): void {
  const { r, p, q } = triangle;
  const cotes = lesCotes(t.prompt);
  const lus = etiquettesDesCotes(t.figure!);
  [cle(r, p), cle(p, q), cle(q, r)].forEach((nom, rang) => {
    if (nom === cherche) assure(lus[rang] === '?', `${t.prompt} : [${nom}] devrait porter « ? », il porte « ${lus[rang]} »`);
    else if (cotes.has(nom)) assure(vaut(cotes.get(nom)!, 'cm')(lus[rang]), `${t.prompt} : [${nom}] devrait porter ${cotes.get(nom)} cm, il porte « ${lus[rang]} »`);
    else assure(lus[rang] === '', `${t.prompt} : [${nom}] ne devrait rien porter, il porte « ${lus[rang]} »`);
  });
}

/** Pythagore : la longueur cherchée, entière (4e) ou arrondie au dixième (3e). */
function oraclePythagore(t: Tirage): void {
  const triangle = triangleRectangleDe(t.prompt);
  const { r, p, q } = triangle;
  const cotes = lesCotes(t.prompt);
  const m = /Calcule (?:la longueur )?(\w)(\w)\b/.exec(t.prompt);
  assure(m !== null, `côté cherché illisible : ${t.prompt}`);
  const cherche = cle(m[1], m[2]);
  const [rp, rq, pq] = [cotes.get(cle(r, p)), cotes.get(cle(r, q)), cotes.get(cle(p, q))];
  const carre = cherche === cle(p, q) ? rp! ** 2 + rq! ** 2 : pq! ** 2 - (cherche === cle(r, p) ? rq! : rp!) ** 2;
  assure(carre > 0, `carré négatif : ${t.prompt}`);
  const racine = Math.sqrt(carre);
  if (/arrondie au dixième/.test(t.prompt)) {
    assure(!Number.isInteger(racine), `la racine de ${carre} est entière alors qu'on la fait arrondir`);
    verifier(t, vaut(arrondi(racine, 1), 'cm'));
  } else {
    assure(proche(racine, Math.round(racine), 1e-9), `la racine de ${carre} n'est pas entière`);
    verifier(t, vaut(Math.round(racine), 'cm'));
  }
  verifierLesCotes(t, triangle, cherche);
}

/** Un angle aigu cherché ou donné, vu depuis le sommet P : sinus, cosinus, tangente. */
function oracleTrigonometrieLongueur(t: Tirage): void {
  const triangle = triangleRectangleDe(t.prompt);
  const { r, p, q } = triangle;
  const angle = /l'angle (\w)(\w)(\w) mesure (\d+)°/.exec(t.prompt);
  assure(angle !== null && angle[1] === r && angle[2] === p && angle[3] === q, `angle illisible : ${t.prompt}`);
  const alpha = Number(angle[4]);
  const cotes = lesCotes(t.prompt);
  assure(cotes.size === 1, `un seul côté connu : ${t.prompt}`);
  const [[connu, valeur]] = [...cotes];
  const demande = /Calcule (?:la longueur )?(\w)(\w)\b/.exec(t.prompt);
  assure(demande !== null, `côté cherché illisible : ${t.prompt}`);
  const cherche = cle(demande[1], demande[2]);
  const attendu = (valeur * PROPORTION[role(cherche, triangle)](alpha)) / PROPORTION[role(connu, triangle)](alpha);
  verifier(t, vaut(arrondi(attendu, 1), 'cm'));
  verifierLesCotes(t, triangle, cherche);
  // L'angle marqué en P est celui que l'énoncé donne, et la figure le dessine à peu près à son échelle.
  const [arc, ...autres] = arcsMarques(t.figure!);
  assure(autres.length === 0 && arc.texte === `${alpha}°` && distance(arc.centre, polygone(t.figure!)[1]) < 0.5 && Math.abs(arc.mesure - alpha) < 1.5, `angle mal marqué : ${t.prompt}`);
}

/** L'angle en P d'un triangle rectangle dont on connaît deux côtés : arcsinus, arccosinus ou arctangente. */
function oracleTrigonometrieAngle(t: Tirage): void {
  const triangle = triangleRectangleDe(t.prompt);
  const { r, p, q } = triangle;
  const demande = /Calcule (?:la mesure de )?l'angle (\w)(\w)(\w), arrondie? au degré\./.exec(t.prompt);
  assure(demande !== null && demande[1] === r && demande[2] === p && demande[3] === q, `angle cherché illisible : ${t.prompt}`);
  const cotes = [...lesCotes(t.prompt)].map(([nom, valeur]) => ({ role: role(nom, triangle), valeur }));
  assure(cotes.length === 2 && cotes[0].role !== cotes[1].role, `deux côtés connus : ${t.prompt}`);
  const valeurDe = (voulu: Role) => cotes.find((c) => c.role === voulu)?.valeur;
  const [opp, adj, hyp] = [valeurDe('oppose'), valeurDe('adjacent'), valeurDe('hypotenuse')];
  const attendu = opp !== undefined && hyp !== undefined ? deg(Math.asin(opp / hyp)) : adj !== undefined && hyp !== undefined ? deg(Math.acos(adj / hyp)) : deg(Math.atan(opp! / adj!));
  verifier(t, vaut(Math.round(attendu), '°'));
  verifierLesCotes(t, triangle, '');
  const [arc, ...autres] = arcsMarques(t.figure!);
  assure(autres.length === 0 && arc.texte === '?' && distance(arc.centre, polygone(t.figure!)[1]) < 0.5 && Math.abs(arc.mesure - attendu) < 1.5, `angle mal marqué : ${t.prompt}`);
}

// --- Thalès --------------------------------------------------------------------------------------------------------------------------

/** Les points d'une figure de Thalès, associés à leur nom (le plus proche de chaque nom). */
function pointsDeThales(figure: Figure): Map<string, Point> {
  const candidats = new Map<string, Point>();
  const ajouter = (point: Point) => candidats.set(point.join(','), point);
  formes(figure, 'polygon').forEach((forme) => forme.points.forEach(ajouter));
  formes(figure, 'point').forEach((forme) => ajouter(forme.at));
  // Les petits traits des chevrons ne sont pas des points de la figure.
  formes(figure, 'segment').filter((forme) => distance(forme.from, forme.to) > 15).forEach((forme) => [forme.from, forme.to].forEach(ajouter));
  const noms = new Map<string, Point>();
  for (const nom of formes(figure, 'text').filter(nomDeSommet)) {
    const [plusProche] = [...candidats.values()].sort((a, b) => distance(a, nom.at) - distance(b, nom.at));
    assure(distance(plusProche, nom.at) < 24, `le nom ${nom.text} est loin de tout point`);
    noms.set(nom.text, plusProche);
  }
  assure(noms.size === 5 && new Set(noms.values()).size === 5, 'cinq noms pour cinq points');
  return noms;
}

function oracleThales(t: Tirage, enPapillon: boolean): void {
  let lettres: Record<'A' | 'B' | 'C' | 'D' | 'E', string>;
  if (enPapillon) {
    const m = /Les droites \((\w)(\w)\) et \((\w)(\w)\) se coupent en (\w)\. Les droites \((\w)(\w)\) et \((\w)(\w)\) sont parallèles\./.exec(t.prompt);
    assure(m !== null, `papillon illisible : ${t.prompt}`);
    lettres = { A: m[5], B: m[1], D: m[2], C: m[3], E: m[4] };
    // (BC) et (DE) sont les droites parallèles annoncées.
    assure(m[6] === lettres.B && m[7] === lettres.C && m[8] === lettres.D && m[9] === lettres.E, `parallèles illisibles : ${t.prompt}`);
  } else {
    const m = /Dans le triangle (\w)(\w)(\w), le point (\w) est sur \[(\w)(\w)\] et le point (\w) est sur \[(\w)(\w)\]\. Les droites \((\w)(\w)\) et \((\w)(\w)\) sont parallèles\./.exec(t.prompt);
    assure(m !== null, `triangle emboîté illisible : ${t.prompt}`);
    lettres = { A: m[1], B: m[2], C: m[3], D: m[4], E: m[7] };
    assure(m[5] === lettres.A && m[6] === lettres.B && m[8] === lettres.A && m[9] === lettres.C, `D sur [AB] et E sur [AC] : ${t.prompt}`);
    assure(m[10] === lettres.D && m[11] === lettres.E && m[12] === lettres.B && m[13] === lettres.C, `parallèles illisibles : ${t.prompt}`);
  }
  const canon = new Map(Object.entries(lettres).map(([nom, lettre]) => [lettre, nom] as [string, string]));
  const cleCanonique = (nom: string): string => [...nom].map((lettre) => canon.get(lettre)!).sort().join('');
  const valeurs = new Map<string, number>();
  for (const m of t.prompt.matchAll(new RegExp(`\\b(\\w\\w) = (${NOMBRE}) cm\\b`, 'g'))) valeurs.set(cleCanonique(m[1]), lire(m[2]));
  const demande = /Calcule (\w\w)\./.exec(t.prompt);
  assure(demande !== null && valeurs.size === 3, `énoncé illisible : ${t.prompt}`);
  const cherche = cleCanonique(demande[1]);
  // AD/AB = AE/AC = DE/BC : une paire complète donne le rapport, l'autre membre de la paire de l'inconnue donne le reste.
  const paires: [string, string][] = [['AD', 'AB'], ['AE', 'AC'], ['DE', 'BC']];
  const complete = paires.find(([haut, bas]) => valeurs.has(haut) && valeurs.has(bas));
  assure(complete !== undefined, `aucune paire complète : ${t.prompt}`);
  const rapport = valeurs.get(complete[0])! / valeurs.get(complete[1])!;
  const [haut, bas] = paires.find((paire) => paire.includes(cherche))!;
  const attendu = cherche === haut ? valeurs.get(bas)! * rapport : valeurs.get(haut)! / rapport;
  verifier(t, vaut(attendu, 'cm', 1e-6));
  // La figure : les droites annoncées sont parallèles, les points sont alignés comme on le dit, le rapport dessiné est le rapport des longueurs.
  const points = pointsDeThales(t.figure!);
  const [A, B, C, D, E] = (['A', 'B', 'C', 'D', 'E'] as const).map((nom) => points.get(lettres[nom])!);
  assure(paralleles(B, C, D, E), `(BC) et (DE) ne sont pas parallèles sur la figure : ${t.prompt}`);
  assure(alignes(A, B, D) && alignes(A, C, E), `les points ne sont pas alignés sur la figure : ${t.prompt}`);
  if (enPapillon) assure(entre(B, A, D) && entre(C, A, E), `A doit être entre B et D, entre C et E : ${t.prompt}`);
  else assure(entre(A, D, B) && entre(A, E, C), `D doit être sur [AB], E sur [AC] : ${t.prompt}`);
  assure(Math.abs(distance(A, D) / distance(A, B) - rapport) < 0.06 && Math.abs(distance(A, E) / distance(A, C) - rapport) < 0.06, `rapport dessiné ${distance(A, D) / distance(A, B)} au lieu de ${rapport} : ${t.prompt}`);
}

// --- Les oracles, famille par famille ----------------------------------------------------------------------------------

const ORACLES: Record<string, (t: Tirage, etape: Stage) => void> = {
  // ---- 5e, 1er trimestre
  'reperage-lecture': (t) => {
    const points = lireLeRepere(t.figure!);
    assure(points.size === 4, 'quatre points nommés');
    const m = /du point (\w) \?$/.exec(t.prompt);
    assure(m !== null, t.prompt);
    const [x, y] = points.get(m[1])!;
    if (t.prompt.startsWith('Quelles sont les coordonnées')) verifier(t, estCoord(x, y));
    else if (t.prompt.startsWith("Quelle est l'abscisse")) verifier(t, vaut(x, ''));
    else if (t.prompt.startsWith("Quelle est l'ordonnée")) verifier(t, vaut(y, ''));
    else throw new Error(`question de lecture inconnue : ${t.prompt}`);
  },
  'reperage-points': (t) => {
    const points = lireLeRepere(t.figure!);
    const [[x, y]] = coordonneesDe(t.prompt);
    const lettres = [...points].filter(([, [px, py]]) => px === x && py === y).map(([lettre]) => lettre);
    assure(lettres.length === 1, `un seul point en (${x} ; ${y}) : ${t.prompt}`);
    verifier(t, (choix) => choix === lettres[0]);
    assure(t.choices.every((choix) => points.has(choix)), 'les propositions sont les points de la figure');
  },
  'reperage-calcul': (t) => {
    const paires = coordonneesDe(t.prompt);
    let m: RegExpExecArray | null;
    if (t.prompt.includes('Quelle est la distance')) {
      const [[x1, y1], [x2, y2]] = paires;
      assure(x1 === x2 || y1 === y2, 'les deux points partagent une coordonnée');
      verifier(t, vaut(Math.abs(x1 - x2) + Math.abs(y1 - y2), ''));
    } else if (t.prompt.includes('est un rectangle')) {
      const [[px, py], [qx, qy], [rx, ry]] = paires;
      verifier(t, estCoord(px + rx - qx, py + ry - qy));
    } else if ((m = new RegExp(`a pour abscisse (${NOMBRE}) et pour ordonnée (${NOMBRE})\\.`).exec(t.prompt))) {
      verifier(t, estCoord(lire(m[1]), lire(m[2])));
    } else if ((m = /situé sur l'axe des (abscisses|ordonnées)/.exec(t.prompt))) {
      verifier(t, (choix) => {
        const lu = coordonneesDe1(choix);
        return lu !== null && (m![1] === 'abscisses' ? lu[1] === 0 : lu[0] === 0);
      });
    } else throw new Error(`question de calcul inconnue : ${t.prompt}`);
  },
  'triangle-angles-somme': (t) => {
    let attendu: number;
    let m: RegExpExecArray | null;
    let sommetCherche: string;
    let marques: [string, number][] = [];
    if ((m = /Dans le triangle \w{3}, l'angle en (\w) mesure (\d+)° et l'angle en (\w) mesure (\d+)°\. Combien mesure l'angle en (\w) \?/.exec(t.prompt))) {
      attendu = 180 - Number(m[2]) - Number(m[4]);
      sommetCherche = m[5];
      marques = [[m[1], Number(m[2])], [m[3], Number(m[4])]];
    } else if ((m = /est isocèle en (\w)\. L'angle en (\w) mesure (\d+)°\. Combien mesure l'angle en (\w) \?/.exec(t.prompt))) {
      const mesureConnue = Number(m[3]);
      attendu = m[2] === m[1] ? (180 - mesureConnue) / 2 : 180 - 2 * mesureConnue;
      sommetCherche = m[4];
      marques = [[m[2], mesureConnue]];
    } else if ((m = /est rectangle en (\w)\. L'angle en (\w) mesure (\d+)°\. Combien mesure l'angle en (\w) \?/.exec(t.prompt))) {
      attendu = 90 - Number(m[3]);
      sommetCherche = m[4];
      marques = [[m[2], Number(m[3])]];
    } else throw new Error(`somme des angles inconnue : ${t.prompt}`);
    verifier(t, vaut(attendu, '°'));
    // La figure : l'arc « ? » est au sommet demandé et mesure ce qu'on cherche, les autres arcs sont à leur sommet et mesurent ce qui est écrit.
    const sommets = sommetsNommes(t.figure!);
    const rectangle = /rectangle en/.test(t.prompt);
    const tolerance = rectangle ? 3 : 1;
    const arcs = arcsMarques(t.figure!);
    for (const arc of arcs) {
      const lettre = [...sommets].find(([, point]) => distance(point, arc.centre) < 0.5)?.[0];
      assure(lettre !== undefined, `un arc qui n'est centré sur aucun sommet : ${t.prompt}`);
      if (arc.texte === '?') {
        assure(lettre === sommetCherche && Math.abs(arc.mesure - attendu) <= tolerance, `l'angle « ? » doit être en ${sommetCherche} et mesurer ${attendu} : ${t.prompt}`);
      } else {
        const ecrit = Number(arc.texte.replace('°', ''));
        const [, valeur] = marques.find(([nom]) => nom === lettre) ?? [];
        assure(valeur === ecrit && Math.abs(arc.mesure - ecrit) <= tolerance, `l'angle écrit ${ecrit}° doit être en ${lettre} (l'énoncé y donne ${valeur}°) et mesurer ${ecrit}° : ${t.prompt}`);
      }
    }
    assure(arcs.filter((arc) => arc.texte === '?').length === 1, 'un seul angle cherché');
  },
  // ---- 5e, 2e trimestre
  'angles-paralleles': (t) => {
    const donne = Number(/L'angle marqué mesure (\d+)°/.exec(t.prompt)![1]);
    const arcs = arcsMarques(t.figure!);
    assure(arcs.length === 2, 'deux angles marqués');
    const connu = arcs.find((arc) => arc.texte !== 'x')!;
    const inconnu = arcs.find((arc) => arc.texte === 'x')!;
    assure(connu.texte === `${donne}°` && Math.abs(connu.mesure - donne) < 0.5, `l'angle marqué doit mesurer ${donne}° sur la figure : ${t.prompt}`);
    // Deux angles formés par deux parallèles et une sécante sont égaux ou supplémentaires.
    assure(proche(inconnu.mesure, donne, 0.5) || proche(inconnu.mesure + donne, 180, 0.5), `x doit égaler ${donne}° ou son supplémentaire : ${inconnu.mesure}`);
    verifier(t, vaut(Math.round(inconnu.mesure), '°'));
  },
  'symetrie-centrale-repere': (t) => {
    const paires = coordonneesDe(t.prompt);
    const points = lireLeRepere(t.figure!);
    const lettre = /(?:le point |on a )(\w)(?: a pour coordonnées|\()/.exec(t.prompt);
    assure(lettre !== null, t.prompt);
    if (t.prompt.includes('par rapport à O')) {
      const [[x, y]] = paires;
      assure(points.get('O')!.join() === '0,0' && points.get(lettre[1])!.join() === [x, y].join(), `figure et énoncé en désaccord : ${t.prompt}`);
      verifier(t, estCoord(-x, -y));
    } else {
      const [[x, y], [a, b]] = paires;
      assure(points.get('I')!.join() === [a, b].join() && points.get(lettre[1])!.join() === [x, y].join(), `figure et énoncé en désaccord : ${t.prompt}`);
      verifier(t, estCoord(2 * a - x, 2 * b - y));
    }
  },
  'symetrie-centrale-proprietes': (t) => {
    let m: RegExpExecArray | null;
    if ((m = new RegExp(`On a O\\w = (${NOMBRE}) cm\\. Combien mesure \\[\\w\\w'\\] \\?`).exec(t.prompt))) verifier(t, vaut(2 * lire(m[1]), 'cm'));
    else if ((m = new RegExp(`le segment \\[(\\w)(\\w)\\] a pour symétrique le segment \\[\\1'\\2'\\]\\. On a \\1\\2 = (${NOMBRE}) cm\\.`).exec(t.prompt))) verifier(t, vaut(lire(m[3]), 'cm'));
    else if ((m = /l'angle (\w{3}) a pour symétrique l'angle (\w)'(\w)'(\w)'\. L'angle \1 mesure (\d+)°\./.exec(t.prompt))) verifier(t, vaut(Number(m[5]), '°'));
    else if (t.prompt.startsWith('Laquelle de ces figures possède un centre de symétrie')) {
      // Ni un triangle, ni un trapèze, ni un cerf-volant, ni un pentagone n'a de centre de symétrie.
      verifier(t, (choix) => !/triangle|trapèze|cerf-volant|pentagone/.test(choix));
    } else throw new Error(`propriété inconnue : ${t.prompt}`);
  },
  'droites-du-triangle': (t) => {
    let m: RegExpExecArray | null;
    // Le milieu s'appelle M, le pied de la hauteur H : aucun sommet du triangle n'a ce nom.
    const triangle = /(?:Dans le triangle|Le triangle) (\w{3})/.exec(t.prompt)?.[1] ?? '';
    assure(!triangle.includes('M') && !triangle.includes('H'), `un sommet porte le nom du milieu ou du pied de la hauteur : ${t.prompt}`);
    if ((m = new RegExp(`médiatrice du segment \\[(\\w)(\\w)\\]\\. On a (\\w)\\1 = (${NOMBRE}) cm\\. Combien mesure \\[\\3\\2\\] \\?`).exec(t.prompt))) verifier(t, vaut(lire(m[4]), 'cm'));
    else if ((m = new RegExp(`milieu de \\[(\\w)(\\w)\\] et \\1\\2 = (${NOMBRE}) cm\\.`).exec(t.prompt))) verifier(t, vaut(lire(m[3]) / 2, 'cm'));
    else if ((m = new RegExp(`a une aire de (${NOMBRE}) cm²\\. Le point M est le milieu`).exec(t.prompt))) verifier(t, vaut(lire(m[1]) / 2, 'cm²'));
    else if (/la hauteur issue de/.test(t.prompt)) verifier(t, vaut(90, '°'));
    else throw new Error(`droite du triangle inconnue : ${t.prompt}`);
  },
  // ---- 5e, 3e trimestre
  'parallelogramme-proprietes': (t) => {
    let m: RegExpExecArray | null;
    if ((m = new RegExp(`^(\\w)(\\w)(\\w)(\\w) est un parallélogramme\\. On a (\\w\\w) = (${NOMBRE}) cm et (\\w\\w) = (${NOMBRE}) cm\\. Combien mesure \\[(\\w\\w)\\] \\?`).exec(t.prompt))) {
      const [p, q, r, s] = [m[1], m[2], m[3], m[4]];
      const cotes = [cle(p, q), cle(q, r), cle(r, s), cle(s, p)];
      const donnes = new Map([[cle(m[5][0], m[5][1]), lire(m[6])], [cle(m[7][0], m[7][1]), lire(m[8])]]);
      const cherche = cle(m[9][0], m[9][1]);
      // Les côtés opposés ont la même longueur.
      verifier(t, vaut(donnes.get(cotes[(cotes.indexOf(cherche) + 2) % 4])!, 'cm'));
    } else if ((m = new RegExp(`^(\\w)(\\w)(\\w)(\\w) est un parallélogramme\\. L'angle en (\\w) mesure (\\d+)°\\. Combien mesure l'angle en (\\w) \\?`).exec(t.prompt))) {
      const sommets = [m[1], m[2], m[3], m[4]];
      const [donne, cherche] = [sommets.indexOf(m[5]), sommets.indexOf(m[7])];
      const mesureDonnee = Number(m[6]);
      // Les angles opposés sont égaux, les angles consécutifs supplémentaires.
      const attendu = (cherche - donne + 4) % 4 === 2 ? mesureDonnee : 180 - mesureDonnee;
      verifier(t, vaut(attendu, '°'));
      // Sur la figure, l'angle du sommet donné mesure ce que l'énoncé annonce.
      const noms = sommetsNommes(t.figure!);
      const points = polygone(t.figure!);
      const rang = points.indexOf(noms.get(m[5])!);
      assure(Math.abs(angleEn(points[rang], points[(rang + 1) % 4], points[(rang + 3) % 4]) - mesureDonnee) < 1.5, `l'angle en ${m[5]} doit mesurer ${mesureDonnee}° sur la figure : ${t.prompt}`);
      const rangCherche = points.indexOf(noms.get(m[7])!);
      assure(Math.abs(angleEn(points[rangCherche], points[(rangCherche + 1) % 4], points[(rangCherche + 3) % 4]) - attendu) < 1.5, `l'angle en ${m[7]} doit mesurer ${attendu}° sur la figure : ${t.prompt}`);
    } else if ((m = new RegExp(`Les diagonales \\[(\\w\\w)\\] et \\[(\\w\\w)\\] du parallélogramme (\\w{4}) se coupent en O\\. On a (\\w\\w) = (${NOMBRE}) cm\\. Combien mesure \\[O(\\w)\\] \\?`).exec(t.prompt))) {
      assure(m[4] === m[1] || m[4] === m[2], 'la diagonale donnée est l\'une des deux');
      assure(m[4].includes(m[6]), `[O${m[6]}] est une moitié de la diagonale [${m[4]}] : ${t.prompt}`);
      verifier(t, vaut(lire(m[5]) / 2, 'cm'));
    } else throw new Error(`parallélogramme inconnu : ${t.prompt}`);
  },
  'aire-triangle-parallelogramme': (t) => {
    let m: RegExpExecArray | null;
    const textes = formes(t.figure!, 'text').map((forme) => forme.text);
    if ((m = new RegExp(`^Un (triangle|parallélogramme) a une base de (${NOMBRE}) cm et la hauteur correspondante mesure (${NOMBRE}) cm\\. Quelle est son aire \\?`).exec(t.prompt))) {
      const [base, hauteur] = [lire(m[2]), lire(m[3])];
      verifier(t, vaut(m[1] === 'triangle' ? (base * hauteur) / 2 : base * hauteur, 'cm²'));
      assure(textes.includes(`${m[2]} cm`) && textes.includes(`${m[3]} cm`), `la figure doit écrire la base et la hauteur : ${t.prompt}`);
    } else if ((m = new RegExp(`^Un (triangle|parallélogramme) a une aire de (${NOMBRE}) cm² et une base de (${NOMBRE}) cm\\. Quelle est la hauteur correspondante \\?`).exec(t.prompt))) {
      const [aire, base] = [lire(m[2]), lire(m[3])];
      verifier(t, vaut(m[1] === 'triangle' ? (2 * aire) / base : aire / base, 'cm'));
      assure(textes.includes(`${m[3]} cm`) && textes.includes('?'), `la figure doit écrire la base et « ? » pour la hauteur : ${t.prompt}`);
    } else throw new Error(`aire inconnue : ${t.prompt}`);
  },
  'aire-du-disque': (t) => {
    let m: RegExpExecArray | null;
    const textes = formes(t.figure!, 'text').map((forme) => forme.text);
    if ((m = new RegExp(`pour rayon (${NOMBRE}) cm\\. Quelle est son aire, en prenant 3,14`).exec(t.prompt))) {
      verifier(t, vaut(3.14 * lire(m[1]) ** 2, 'cm²', 1e-6));
      assure(textes.includes(`${m[1]} cm`), 'la figure écrit le rayon');
    } else if ((m = new RegExp(`pour (rayon|diamètre) (${NOMBRE}) cm\\. Quelle est son aire exacte \\?`).exec(t.prompt))) {
      const rayon = m[1] === 'rayon' ? lire(m[2]) : lire(m[2]) / 2;
      verifier(t, estPi(rayon * rayon, 'cm²'));
      assure(textes.includes(`${m[2]} cm`), `la figure écrit ${m[1]} ${m[2]} cm`);
    } else throw new Error(`disque inconnu : ${t.prompt}`);
  },
  'volume-prisme-cylindre': (t) => {
    let m: RegExpExecArray | null;
    if ((m = new RegExp(`un triangle d'aire (${NOMBRE}) cm² et pour hauteur (${NOMBRE}) cm\\. Quel est son volume \\?`).exec(t.prompt))) verifier(t, vaut(lire(m[1]) * lire(m[2]), 'cm³'));
    else if ((m = new RegExp(`rayon de base (${NOMBRE}) cm et pour hauteur (${NOMBRE}) cm\\. Quel est son volume exact \\?`).exec(t.prompt))) verifier(t, estPi(lire(m[1]) ** 2 * lire(m[2]), 'cm³'));
    else if ((m = new RegExp(`rayon de base (${NOMBRE}) cm et pour hauteur (${NOMBRE}) cm\\. Quel est son volume, en prenant 3,14`).exec(t.prompt))) verifier(t, vaut(3.14 * lire(m[1]) ** 2 * lire(m[2]), 'cm³', 1e-6));
    else throw new Error(`volume inconnu : ${t.prompt}`);
  },
  // ---- 4e, 1er trimestre
  'inegalite-triangulaire': (t) => {
    let m: RegExpExecArray | null;
    if ((m = new RegExp(`on a (\\w\\w) = (${NOMBRE}) cm et (\\w\\w) = (${NOMBRE}) cm\\. Quelle valeur peut avoir (\\w\\w) \\?`).exec(t.prompt))) {
      const [a, b] = [lire(m[2]), lire(m[4])];
      verifier(t, (choix) => {
        const lu = mesure(choix);
        return lu !== null && lu.unite === 'cm' && lu.valeur > Math.abs(a - b) && lu.valeur < a + b;
      });
    } else if (t.prompt.startsWith('Un seul de ces ensembles de trois longueurs')) {
      verifier(t, (choix) => {
        const cotes = nombresDe(choix).sort((a, b) => a - b);
        return cotes.length === 3 && cotes[2] < cotes[0] + cotes[1];
      });
    } else throw new Error(`inégalité inconnue : ${t.prompt}`);
  },
  'angles-triangle-parallele': (t) => {
    const m = new RegExp(`^Dans le triangle (\\w)(\\w)(\\w), le point (\\w) est sur \\[\\1\\2\\] et le point (\\w) est sur \\[\\1\\3\\]\\. Les droites \\(\\4\\5\\) et \\(\\2\\3\\) sont parallèles\\. L'angle (\\w{3}) mesure (\\d+)° et l'angle (\\w{3}) mesure (\\d+)°\\. Combien mesure l'angle (\\w{3}) \\?`).exec(t.prompt);
    assure(m !== null, `énoncé illisible : ${t.prompt}`);
    const [a, b, c, d, e] = [m[1], m[2], m[3], m[4], m[5]];
    const donnes = new Map([[m[6], Number(m[7])], [m[8], Number(m[9])]]);
    assure(donnes.has(`${a}${b}${c}`) && donnes.has(`${a}${c}${b}`), `les angles donnés sont ceux de la base : ${t.prompt}`);
    // On lit la réponse sur la figure, dessinée à l'échelle des angles de la base.
    const points = pointsDeThales(t.figure!);
    const [A, B, C, D, E] = [a, b, c, d, e].map((nom) => points.get(nom)!);
    assure(paralleles(B, C, D, E) && entre(A, D, B) && entre(A, E, C), `la figure doit montrer D sur [AB], E sur [AC] et (DE) // (BC) : ${t.prompt}`);
    assure(Math.abs(angleEn(B, A, C) - donnes.get(`${a}${b}${c}`)!) < 1 && Math.abs(angleEn(C, A, B) - donnes.get(`${a}${c}${b}`)!) < 1, `les angles de la base doivent être ceux de l'énoncé : ${t.prompt}`);
    const nomCherche = m[10];
    const [x, y, z] = [...nomCherche].map((nom) => points.get(nom)!);
    verifier(t, vaut(Math.round(angleEn(y, x, z)), '°'));
  },
  'symetries-repere': (t) => {
    const points = lireLeRepere(t.figure!);
    const [[x, y]] = coordonneesDe(t.prompt);
    const lettre = /Dans un repère, le point (\w) a pour coordonnées/.exec(t.prompt)![1];
    assure(points.get(lettre)!.join() === [x, y].join() && points.get('O')!.join() === '0,0', `figure et énoncé en désaccord : ${t.prompt}`);
    if (t.prompt.includes("l'axe des abscisses")) verifier(t, estCoord(x, -y));
    else if (t.prompt.includes("l'axe des ordonnées")) verifier(t, estCoord(-x, y));
    else {
      assure(t.prompt.includes("l'origine O"), t.prompt);
      verifier(t, estCoord(-x, -y));
    }
  },
  // ---- 4e, 2e trimestre
  'pythagore-longueur': oraclePythagore,
  'pythagore-reciproque': (t) => {
    const cotes = nombresDe(t.prompt).sort((a, b) => a - b);
    assure(cotes.length === 3, t.prompt);
    const rectangle = cotes[0] ** 2 + cotes[1] ** 2 === cotes[2] ** 2;
    verifier(t, (choix) => {
      const m = /^(Oui|Non) : (\d+)² \+ (\d+)² (=|≠) (\d+)²$/.exec(choix);
      return m !== null && m[1] === (rectangle ? 'Oui' : 'Non') && m[4] === (rectangle ? '=' : '≠') && [Number(m[2]), Number(m[3]), Number(m[5])].join() === cotes.join();
    });
  },
  'translation-repere': (t) => {
    const [[a, b], [a2, b2], [m, n]] = coordonneesDe(t.prompt);
    const points = lireLeRepere(t.figure!);
    const noms = /transforme (\w)\(.* en (\w)'\(.*\) transforme (\w)\(/.exec(t.prompt);
    assure(noms !== null, t.prompt);
    assure(points.get(noms[1])!.join() === [a, b].join() && points.get(`${noms[2]}'`)!.join() === [a2, b2].join() && points.get(noms[3])!.join() === [m, n].join(), `figure et énoncé en désaccord : ${t.prompt}`);
    verifier(t, estCoord(m + a2 - a, n + b2 - b));
  },
  'parallelogramme-caracterisation': (t) => {
    const fait = t.prompt.replace(/ Quelle est la nature la plus précise.*$/, '');
    // Ce que dit le fait, en propriétés : un parallélogramme, un angle droit, trois angles droits, des diagonales égales ou perpendiculaires, des côtés consécutifs égaux, quatre côtés égaux.
    const proprietes = new Set<string>();
    if (/se coupent en leur milieu|parallèles deux à deux|sont parallèles et de même longueur|est un parallélogramme/.test(fait) || /^On a \w\w = \w\w = [\d,]+ cm et \w\w = \w\w = [\d,]+ cm\.$/.test(fait)) proprietes.add('parallélogramme');
    if (/un angle droit/.test(fait)) proprietes.add('angle droit');
    if (/trois angles droits/.test(fait)) proprietes.add('trois angles droits');
    if (/diagonales ont la même longueur/.test(fait)) proprietes.add('diagonales égales');
    if (/diagonales sont perpendiculaires/.test(fait)) proprietes.add('diagonales perpendiculaires');
    if (/deux côtés consécutifs ont la même longueur/.test(fait)) proprietes.add('côtés consécutifs égaux');
    if (/quatre côtés de même longueur/.test(fait)) proprietes.add('quatre côtés égaux');
    if (/est un losange/.test(fait)) proprietes.add('losange');
    if (/est un rectangle/.test(fait)) proprietes.add('rectangle');
    const a = (propriete: string) => proprietes.has(propriete);
    const rectangle = a('rectangle') || a('trois angles droits') || (a('parallélogramme') && (a('angle droit') || a('diagonales égales')));
    const losange = a('losange') || a('quatre côtés égaux') || (a('parallélogramme') && (a('côtés consécutifs égaux') || a('diagonales perpendiculaires')));
    const carre = (a('losange') && a('angle droit')) || (a('rectangle') && a('côtés consécutifs égaux')) || (rectangle && losange);
    const nature = carre ? 'un carré' : rectangle ? 'un rectangle' : losange ? 'un losange' : 'un parallélogramme';
    verifier(t, (choix) => choix === nature);
  },
  // ---- 4e, 3e trimestre
  'cosinus-longueur': oracleTrigonometrieLongueur,
  'cosinus-angle': oracleTrigonometrieAngle,
  'thales-emboites': (t) => oracleThales(t, false),
  'thales-reciproque': (t) => {
    const m = /^Dans le triangle (\w)(\w)(\w), le point (\w) est sur \[\1\2\] et le point (\w) est sur \[\1\3\]\./.exec(t.prompt);
    assure(m !== null, t.prompt);
    const [a, b, c, d, e] = [m[1], m[2], m[3], m[4], m[5]];
    const valeurs = new Map<string, number>();
    for (const g of t.prompt.matchAll(new RegExp(`\\b(\\w\\w) = (${NOMBRE}) cm\\b`, 'g'))) valeurs.set(g[1], lire(g[2]));
    const [ad, ab, ae, ac] = [valeurs.get(`${a}${d}`)!, valeurs.get(`${a}${b}`)!, valeurs.get(`${a}${e}`)!, valeurs.get(`${a}${c}`)!];
    // Les produits en croix, en dixièmes pour rester entier.
    const parallele = Math.round(ad * 10) * Math.round(ac * 10) === Math.round(ae * 10) * Math.round(ab * 10);
    verifier(t, (choix) => {
      const g = /^(Oui|Non) : (\S+)\/(\S+) (=|≠) (\S+)\/(\S+)$/.exec(choix);
      return g !== null && g[1] === (parallele ? 'Oui' : 'Non') && g[4] === (parallele ? '=' : '≠') && [lire(g[2]), lire(g[3]), lire(g[5]), lire(g[6])].join() === [ad, ab, ae, ac].join();
    });
    assure(b !== c && d !== e, 'lettres distinctes');
  },
  // ---- 3e, 1er trimestre
  'pythagore-racine': oraclePythagore,
  'pythagore-probleme': (t) => {
    const [a, b] = nombresDe(t.prompt);
    const hypotenuseCherchee = /Quelle est la longueur (?:de l'échelle|de sa diagonale|du câble)/.test(t.prompt);
    const unite = /\d m\b/.test(t.prompt) ? 'm' : 'cm';
    const attendu = hypotenuseCherchee ? Math.sqrt(a * a + b * b) : Math.sqrt(Math.abs(a * a - b * b));
    // Les mesures viennent d'un triplet pythagoricien : la réponse est un nombre simple.
    assure(proche(attendu * 100, Math.round(attendu * 100), 1e-6), `réponse non décimale ${attendu} : ${t.prompt}`);
    verifier(t, vaut(attendu, unite, 1e-6));
  },
  // ---- 3e, 2e trimestre
  'thales-papillon': (t) => oracleThales(t, true),
  'thales-situation': (t) => {
    const m = new RegExp(`de (${NOMBRE}) m(?:,| a) .*ombre de (${NOMBRE}) m\\..* (?:mesure|de) (${NOMBRE}) m`).exec(t.prompt);
    assure(m !== null, `ombres illisibles : ${t.prompt}`);
    const [h1, o1, troisieme] = [lire(m[1]), lire(m[2]), lire(m[3])];
    if (t.prompt.includes('Quelle est la hauteur')) verifier(t, vaut((h1 * troisieme) / o1, 'm', 1e-6));
    else {
      assure(t.prompt.includes("Quelle est la longueur de cette ombre"), t.prompt);
      verifier(t, vaut((o1 * troisieme) / h1, 'm', 1e-6));
    }
  },
  'trigonometrie-longueur': oracleTrigonometrieLongueur,
  'trigonometrie-angle': oracleTrigonometrieAngle,
  'trigonometrie-choix': (t) => {
    const triangle = triangleRectangleDe(t.prompt);
    const m = /On connaît (l'hypoténuse|le côté adjacent|le côté opposé) \[(\w\w)\] et (l'hypoténuse|le côté adjacent|le côté opposé) \[(\w\w)\], et on cherche l'angle (\w)(\w)(\w)\./.exec(t.prompt);
    assure(m !== null && m[5] === triangle.r && m[6] === triangle.p && m[7] === triangle.q, `énoncé illisible : ${t.prompt}`);
    const DIT: Record<string, Role> = { "l'hypoténuse": 'hypotenuse', 'le côté adjacent': 'adjacent', 'le côté opposé': 'oppose' };
    // Ce que l'énoncé dit de chaque côté est ce que les lettres en font.
    assure(DIT[m[1]] === role(cle(m[2][0], m[2][1]), triangle) && DIT[m[3]] === role(cle(m[4][0], m[4][1]), triangle), `un côté mal nommé : ${t.prompt}`);
    const connus = new Set([DIT[m[1]], DIT[m[3]]]);
    const attendu = connus.has('hypotenuse') ? (connus.has('oppose') ? 'Le sinus' : 'Le cosinus') : 'La tangente';
    verifier(t, (choix) => choix === attendu);
    assure(!/\d/.test(t.figure!.alt), 'pas de nombre dans la description');
  },
  'trigonometrie-situation': (t) => {
    const [premier, alpha] = nombresDe(t.prompt);
    const angle = /(\d+)°/.exec(t.prompt);
    assure(angle !== null && Number(angle[1]) === alpha, t.prompt);
    const l = premier;
    const sin = Math.sin(rad(alpha));
    const cos = Math.cos(rad(alpha));
    const tan = Math.tan(rad(alpha));
    let attendu: number;
    if (/Une échelle de .* À quelle hauteur touche-t-elle le mur/.test(t.prompt)) attendu = l * sin;
    else if (/Une échelle de .* À quelle distance du mur se trouve son pied/.test(t.prompt)) attendu = l * cos;
    else if (/Depuis un point du sol .* Quelle est la hauteur de l'arbre/.test(t.prompt)) attendu = l * tan;
    else if (/Un toboggan de .* Quelle est la hauteur de son sommet/.test(t.prompt)) attendu = l * sin;
    else if (/Une échelle doit toucher un mur à .* Quelle longueur d'échelle faut-il/.test(t.prompt)) attendu = l / sin;
    else if (/Un arbre mesure .* À quelle distance de son pied/.test(t.prompt)) attendu = l / tan;
    else throw new Error(`situation inconnue : ${t.prompt}`);
    verifier(t, vaut(arrondi(attendu, 1), 'm'));
  },
  // ---- 3e, 3e trimestre
  'homothetie-repere': (t) => {
    const points = lireLeRepere(t.figure!);
    const m = new RegExp(`l'homothétie de centre (O|I(?:\\(${NOMBRE} ; ${NOMBRE}\\))?) et de rapport (\\d+)(?:/(\\d+))? transforme (\\w)\\(`).exec(t.prompt);
    assure(m !== null, `homothétie illisible : ${t.prompt}`);
    const paires = coordonneesDe(t.prompt);
    const [centre, [x, y]] = m[1] === 'O' ? [[0, 0], paires[0]] : [paires[0], paires[1]];
    const k = Number(m[2]) / Number(m[3] ?? 1);
    assure(points.get(m[1][0])!.join() === centre.join() && points.get(m[4])!.join() === [x, y].join(), `figure et énoncé en désaccord : ${t.prompt}`);
    verifier(t, estCoord(centre[0] + k * (x - centre[0]), centre[1] + k * (y - centre[1])));
  },
  'rotation-repere': (t) => {
    const points = lireLeRepere(t.figure!);
    const m = /la rotation de centre O et d'angle (\d+)°, dans le sens inverse des aiguilles d'une montre, transforme (\w)\(/.exec(t.prompt);
    assure(m !== null, `rotation illisible : ${t.prompt}`);
    const [[x, y]] = coordonneesDe(t.prompt);
    assure(points.get(m[2])!.join() === [x, y].join() && points.get('O')!.join() === '0,0', `figure et énoncé en désaccord : ${t.prompt}`);
    const alpha = rad(Number(m[1]));
    // La matrice de la rotation, calculée avec cos et sin.
    verifier(t, estCoord(Math.round(x * Math.cos(alpha) - y * Math.sin(alpha)), Math.round(x * Math.sin(alpha) + y * Math.cos(alpha))));
  },
  'volumes-solides': (t) => {
    let m: RegExpExecArray | null;
    if ((m = new RegExp(`^Une pyramide a pour base un carré de (${NOMBRE}) cm de côté et pour hauteur (${NOMBRE}) cm\\.`).exec(t.prompt))) verifier(t, vaut((lire(m[1]) ** 2 * lire(m[2])) / 3, 'cm³'));
    else if ((m = new RegExp(`^Un cône a pour rayon de base (${NOMBRE}) cm et pour hauteur (${NOMBRE}) cm\\.`).exec(t.prompt))) verifier(t, estPi((lire(m[1]) ** 2 * lire(m[2])) / 3, 'cm³'));
    else if ((m = new RegExp(`^Une boule a pour rayon (${NOMBRE}) cm\\.`).exec(t.prompt))) verifier(t, estPi((4 * lire(m[1]) ** 3) / 3, 'cm³'));
    else if ((m = new RegExp(`^Une sphère a pour rayon (${NOMBRE}) cm\\.`).exec(t.prompt))) verifier(t, estPi(4 * lire(m[1]) ** 2, 'cm²'));
    else throw new Error(`solide inconnu : ${t.prompt}`);
  },
  'transformation-reconnaitre': (t) => {
    const [[x1, y1], [a2, b2], [x2, y2], [c2, d2]] = coordonneesDe(t.prompt);
    const IMAGES: [RegExp, (x: number, y: number) => [number, number]][] = [
      [/^Une symétrie centrale/, (x, y) => [-x, -y]],
      [/axe des abscisses/, (x, y) => [x, -y]],
      [/axe des ordonnées/, (x, y) => [-x, y]],
      [/^Une rotation de centre O et d'angle 90°, sens inverse des aiguilles d'une montre$/, (x, y) => [-y, x]],
      [/^Une homothétie de centre O et de rapport 2$/, (x, y) => [2 * x, 2 * y]],
    ];
    verifier(t, (choix) => {
      if (choix === 'Une translation') return a2 - x1 === c2 - x2 && b2 - y1 === d2 - y2;
      const regle = IMAGES.find(([motif]) => motif.test(choix));
      assure(regle !== undefined, `transformation inconnue : ${choix}`);
      const [e, f] = regle[1](x1, y1);
      const [g, h] = regle[1](x2, y2);
      return e === a2 && f === b2 && g === c2 && h === d2;
    });
  },
};

/** Les nombres d'un texte, dans l'ordre. */
function nombresDe(texte: string): number[] {
  return (texte.match(/−?\d+(?:,\d+)?/g) ?? []).map(lire);
}

// --- Les tests --------------------------------------------------------------------------------------------------------------------

describe('chaque famille de géométrie a son oracle', () => {
  it('compte autant d\'oracles que de familles', () => {
    expect(Object.keys(ORACLES).sort()).toEqual(FAMILLES_CYCLE4.map((famille) => famille.name).sort());
    expect(new Set(FAMILLES_CYCLE4.map((famille) => famille.name)).size).toBe(FAMILLES_CYCLE4.length);
  });
});

describe.each(FAMILLES_CYCLE4.map((famille) => [famille.name, famille] as const))('la famille %s', (_nom, famille) => {
  it('donne une réponse juste, seule juste, relue sur l\'énoncé et sur la figure', () => {
    for (const { tirage, etape } of tirages(famille)) ORACLES[famille.name](tirage, etape);
  });

  it('propose quatre réponses différentes, une consigne qui correspond, une explication', () => {
    for (const { tirage } of tirages(famille)) {
      expect(tirage.choices, tirage.prompt).toHaveLength(4);
      expect(new Set(tirage.choices).size, tirage.prompt).toBe(4);
      expect(tirage.correctIndex).toBeGreaterThanOrEqual(0);
      expect(tirage.correctIndex).toBeLessThan(4);
      expect(tirage.instruction, tirage.prompt).toBe(tirage.figure ? INSTRUCTION_FIGURE : INSTRUCTION);
      expect(tirage.explanation?.length ?? 0, tirage.prompt).toBeGreaterThan(20);
      expect(tirage.detail, tirage.prompt).toMatch(/^[A-Za-z0-9-]+$/);
    }
  });

  it('dessine des figures qui tiennent dans leur cadre, décrites sans donner la réponse', () => {
    for (const { tirage } of tirages(famille)) {
      if (!tirage.figure) continue;
      expect(fitsInFrame(tirage.figure), tirage.prompt).toBe(true);
      expect(tirage.figure.alt.length, tirage.prompt).toBeGreaterThan(15);
      // Aucun nombre dans la description : ni une mesure, ni la réponse.
      expect(tirage.figure.alt, tirage.prompt).not.toMatch(/\d/);
    }
  });

  it('n\'écrit aucun texte par-dessus un autre', () => {
    for (const { tirage } of tirages(famille)) {
      if (!tirage.figure) continue;
      const cases = formes(tirage.figure, 'text').map((forme) => ({ forme, boite: boite(forme) }));
      cases.forEach((a, i) =>
        cases.slice(i + 1).forEach((b) => {
          expect(recouvrement(a.boite, b.boite), `« ${a.forme.text} » et « ${b.forme.text} » se recouvrent dans : ${tirage.prompt}`).toBeLessThan(0.1);
        })
      );
    }
  });

  it('s\'écrit à la française : moins typographique, virgule décimale, exposants, pas de balise', () => {
    for (const { tirage } of tirages(famille)) {
      for (const texte of [tirage.instruction ?? '', tirage.prompt, ...tirage.choices, tirage.explanation ?? '']) {
        expect(texte, texte).not.toMatch(/(^|[\s(])-\d/);
        expect(texte, texte).not.toMatch(/\d\.\d/);
        expect(texte, texte).not.toMatch(/NaN|undefined|Infinity|\[object|<\/?[a-z]|\\\(|\$|\^/);
        expect(texte, texte).not.toMatch(/  |^ | $/);
        expect(texte, texte).not.toMatch(/[’“”«»]/);
      }
    }
  });

  it('donne les mêmes questions avec les mêmes graines', () => {
    const [une, autre] = [famille.make(createRng(4242), famille.minStage), famille.make(createRng(4242), famille.minStage)];
    expect(autre).toEqual(une);
  });

  it('propose de la variété', () => {
    const enonces = new Set(tirages(famille).filter(({ etape }) => etape === 18).map(({ tirage }) => tirage.prompt));
    expect(enonces.size).toBeGreaterThanOrEqual(Math.min(12, GRAINES / 2));
  });
});

// --- Le programme -------------------------------------------------------------------------------------------------------------------

describe('chaque notion arrive à son trimestre, pas avant', () => {
  const NOTIONS: { nom: string; depuis: Stage; motif: RegExp }[] = [
    { nom: 'le théorème de Pythagore', depuis: 14, motif: /Pythagore/ },
    { nom: 'la translation', depuis: 14, motif: /translation|translat/i },
    { nom: 'le théorème de Thalès', depuis: 15, motif: /Thalès/ },
    { nom: 'le cosinus', depuis: 15, motif: /cos\(|cosinus/ },
    { nom: 'la racine carrée', depuis: 16, motif: /√/ },
    { nom: 'le sinus et la tangente', depuis: 17, motif: /sin\(|tan\(|sinus|tangente/ },
    { nom: 'l\'homothétie', depuis: 18, motif: /homothétie/ },
    { nom: 'la rotation', depuis: 18, motif: /rotation|quart de tour|trois quarts de tour/ },
    { nom: 'la boule et la sphère', depuis: 18, motif: /boule|sphère/ },
    { nom: 'la pyramide et le cône', depuis: 18, motif: /pyramide|cône/ },
    { nom: 'le nombre π', depuis: 12, motif: /π/ },
    { nom: 'le volume d\'un prisme ou d\'un cylindre', depuis: 12, motif: /prisme|cylindre/ },
    { nom: 'l\'aire d\'un disque', depuis: 12, motif: /\baire\b[^.]*disque|disque[^.]*\baire\b/ },
  ];
  const HORS_PROGRAMME = /vecteur|angle inscrit|produit scalaire|quartile|dérivée|logarithme|équation de droite|fonction/i;

  it.each(NOTIONS)('$nom n\'est posé qu\'à partir de l\'étape $depuis', ({ depuis, motif }) => {
    for (const famille of FAMILLES_CYCLE4) {
      for (const { tirage, etape } of tirages(famille)) {
        if (etape >= depuis) continue;
        const texte = [tirage.prompt, ...tirage.choices, tirage.explanation ?? ''].join(' ');
        expect(texte, `${famille.name} à l'étape ${etape}`).not.toMatch(motif);
      }
    }
  });

  it('ne sort jamais du programme', () => {
    for (const famille of FAMILLES_CYCLE4) {
      for (const { tirage } of tirages(famille)) {
        expect([tirage.prompt, ...tirage.choices, tirage.explanation ?? ''].join(' '), famille.name).not.toMatch(HORS_PROGRAMME);
      }
    }
  });

  it('n\'emploie que des homothéties de rapport positif', () => {
    const famille = FAMILLES_CYCLE4.find((f) => f.name === 'homothetie-repere')!;
    for (const { tirage } of tirages(famille)) expect(tirage.prompt).not.toMatch(/rapport −/);
  });

  it('apporte au moins une sorte de question nouvelle à chaque trimestre', () => {
    for (const etape of [10, 11, 12, 13, 14, 15, 16, 17, 18]) {
      expect(FAMILLES_CYCLE4.filter((famille) => famille.minStage === etape).length, `étape ${etape}`).toBeGreaterThanOrEqual(2);
    }
    expect(Math.min(...FAMILLES_CYCLE4.map((famille) => famille.minStage))).toBe(10);
    expect(Math.max(...FAMILLES_CYCLE4.map((famille) => famille.minStage))).toBe(18);
  });
});

describe('une séance de géométrie au collège', () => {
  const NIVEAUX: Level[] = ['5e', '4e', '3e'];
  const SEANCES = Math.max(20, Math.floor(GRAINES));

  NIVEAUX.forEach((level) => {
    ALL_TRIMESTERS.forEach((trimester: Trimester) => {
      it(`${level} trimestre ${trimester} : douze questions de géométrie, jamais deux fois la même, qui font réviser le programme`, () => {
        const etape = stageOf(level, trimester);
        const disponibles = FAMILLES_CYCLE4.filter((famille) => famille.minStage <= etape).map((famille) => famille.name);
        const vues = new Set<string>();
        for (let graine = 1; graine <= SEANCES * 4; graine++) {
          const questions = generate(level, trimester, createRng(graine * 7919 + 3), 12);
          expect(questions).toHaveLength(12);
          expect(new Set(questions.map((question) => question.id)).size).toBe(12);
          for (const question of questions) {
            expect(question.domain).toBe('geometrie');
            expect(question.choices).toHaveLength(4);
            const famille = disponibles.find((nom) => question.id.startsWith(`geometrie-${nom}-`));
            expect(famille, `${question.id} n'est pas une famille disponible à l'étape ${etape}`).toBeDefined();
            vues.add(famille!);
          }
        }
        // Tout ce que le niveau a déjà vu revient, et ce que le trimestre apporte est là.
        expect([...vues].sort()).toEqual([...disponibles].sort());
      });
    });
  });
});
