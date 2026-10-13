import { describe, expect, it } from 'vitest';
import { distance, fitsInFrame, type Figure, type Point, type Shape } from '../lib/figures';
import { MESURE_DU_SECTEUR, degresVers, disqueAvecRayon, papillon, parallelogrammeAvecHauteur, parallelesEtSecante, triangleAvecAngles, triangleAvecHauteur, triangleEmboite, triangleEmboiteAvecAngles, triangleRectangle, type Secteur } from './geometrieDessinsCollege';

/**
 * Les dessins du collège sont relus comme le ferait un élève : les angles
 * qu'on y lit sont ceux qu'on y a écrits, les droites annoncées parallèles le
 * sont, un angle droit est droit.
 */

type Forme<K extends Shape['kind']> = Extract<Shape, { kind: K }>;
const formes = <K extends Shape['kind']>(figure: Figure, genre: K): Forme<K>[] => figure.shapes.filter((forme): forme is Forme<K> => forme.kind === genre);

/** L'angle en B du triangle ABC, en degrés. */
function angleEn(b: Point, a: Point, c: Point): number {
  const [ux, uy, vx, vy] = [a[0] - b[0], a[1] - b[1], c[0] - b[0], c[1] - b[1]];
  return (Math.acos((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))) * 180) / Math.PI;
}

/** Deux vecteurs sont-ils parallèles (produit en croix quasi nul) ? */
const paralleles = ([ux, uy]: Point, [vx, vy]: Point) => Math.abs(ux * vy - uy * vx) / (Math.hypot(ux, uy) * Math.hypot(vx, vy)) < 0.01;
const vecteur = (de: Point, vers: Point): Point => [vers[0] - de[0], vers[1] - de[1]];

describe('le triangle dont on lit les angles', () => {
  it.each([
    [48, 67],
    [30, 100],
    [70, 40],
    [55, 55],
  ])('trace un triangle d\'angles %i° et %i° (le troisième en découle) et écrit les angles à leurs sommets', (a, b) => {
    const figure = triangleAvecAngles(a, b, ['A', 'B', 'C'], [`${a}°`, `${b}°`, '?'], null, 'Un triangle.');
    expect(fitsInFrame(figure)).toBe(true);
    const polygone = formes(figure, 'polygon')[0].points;
    expect(angleEn(polygone[0], polygone[1], polygone[2])).toBeCloseTo(a, 0);
    expect(angleEn(polygone[1], polygone[2], polygone[0])).toBeCloseTo(b, 0);
    expect(angleEn(polygone[2], polygone[0], polygone[1])).toBeCloseTo(180 - a - b, 0);
    // Chaque arc est centré sur son sommet et couvre l'angle du triangle en ce sommet.
    const arcs = formes(figure, 'arc');
    expect(arcs).toHaveLength(3);
    arcs.forEach((arc, index) => {
      expect(arc.center).toEqual(polygone[index]);
      expect(arc.to - arc.from).toBeCloseTo([a, b, 180 - a - b][index], 0);
    });
    expect(formes(figure, 'text').map((texte) => texte.text)).toEqual(expect.arrayContaining([`${a}°`, `${b}°`, '?', 'A', 'B', 'C']));
  });

  it('code deux côtés égaux d\'un triangle isocèle', () => {
    const figure = triangleAvecAngles(70, 70, ['A', 'B', 'C'], [null, '70°', '?'], [0, 1, 1], 'Un triangle isocèle.');
    const polygone = formes(figure, 'polygon')[0].points;
    expect(distance(polygone[2], polygone[0])).toBeCloseTo(distance(polygone[1], polygone[2]), 0);
    expect(formes(figure, 'codage')).toHaveLength(2);
  });
});

describe('les parallèles coupées par une sécante', () => {
  const secteurs: Secteur[] = ['NE', 'NW', 'SW', 'SE'];

  it.each([
    [65, 0],
    [115, 6],
    [48, -7],
    [132, 4],
  ])('trace deux droites parallèles et une sécante de direction %i° (inclinaison %i°)', (theta, rotation) => {
    const figure = parallelesEtSecante(theta, rotation, [{ droite: 1, secteur: 'NE', texte: '65°' }, { droite: 2, secteur: 'SE', texte: 'x' }], 'Deux parallèles.');
    expect(fitsInFrame(figure)).toBe(true);
    const [d1, d2, secante] = formes(figure, 'segment');
    expect(paralleles(vecteur(d1.from, d1.to), vecteur(d2.from, d2.to))).toBe(true);
    expect(paralleles(vecteur(d1.from, d1.to), vecteur(secante.from, secante.to))).toBe(false);
    // La direction de la sécante est theta, à l'inclinaison près.
    const direction = (((degresVers(secante.from, secante.to) - rotation) % 180) + 180) % 180;
    expect(direction).toBeCloseTo(theta, 0);
    // Chaque arc est centré sur le point où la sécante coupe sa droite, et couvre la mesure de son secteur.
    const arcs = formes(figure, 'arc');
    const attendues: [Secteur, number][] = [['NE', MESURE_DU_SECTEUR('NE', theta)], ['SE', MESURE_DU_SECTEUR('SE', theta)]];
    arcs.forEach((arc, index) => {
      expect(arc.to - arc.from, `secteur ${attendues[index][0]}`).toBeCloseTo(attendues[index][1], 6);
      const droite = index === 0 ? d1 : d2;
      expect(paralleles(vecteur(droite.from, arc.center), vecteur(droite.from, droite.to))).toBe(true);
      expect(paralleles(vecteur(secante.from, arc.center), vecteur(secante.from, secante.to))).toBe(true);
    });
  });

  it('mesure theta ou son supplémentaire selon le secteur', () => {
    const mesures = secteurs.map((secteur) => MESURE_DU_SECTEUR(secteur, 65));
    expect(mesures).toEqual([65, 115, 65, 115]);
    // Deux secteurs voisins sont supplémentaires, deux secteurs opposés sont égaux.
    secteurs.forEach((secteur, rang) => {
      expect(mesures[rang] + mesures[(rang + 1) % 4]).toBe(180);
      expect(mesures[rang]).toBe(mesures[(rang + 2) % 4]);
    });
  });
});

describe('le triangle rectangle', () => {
  it.each([0.5, 0.75, 1, 1.3, 2.4])('a un angle droit en R et des côtés dans le rapport %f', (rapport) => {
    const figure = triangleRectangle(rapport, ['A', 'B', 'C'], ['6 cm', null, '?'], [{ sommet: 1, texte: '40°' }], 'Un triangle rectangle.');
    expect(fitsInFrame(figure)).toBe(true);
    const [a, b, c] = formes(figure, 'polygon')[0].points;
    expect(angleEn(a, b, c)).toBeCloseTo(90, 0);
    expect(distance(a, c) / distance(a, b)).toBeCloseTo(Math.min(2.2, Math.max(0.45, rapport)), 1);
    expect(formes(figure, 'angleDroit')).toHaveLength(1);
    // L'angle marqué de 40° est en B : son arc couvre l'angle du triangle en B.
    const [arc] = formes(figure, 'arc');
    expect(arc.center).toEqual(b);
    expect(arc.to - arc.from).toBeCloseTo(angleEn(b, c, a), 0);
  });
});

describe('les figures du théorème de Thalès', () => {
  it.each([
    [0.4, 0, 0],
    [0.55, 14, 20],
    [0.62, 30, 8],
  ])('place D sur [AB] et E sur [AC] avec (DE) parallèle à (BC), au rapport %f', (t, decalageB, decalageC) => {
    const { figure, points } = triangleEmboite(t, decalageB, decalageC, ['A', 'B', 'C', 'D', 'E'], 'Deux triangles emboîtés.');
    expect(fitsInFrame(figure)).toBe(true);
    const { A, B, C, D, E } = points;
    expect(paralleles(vecteur(D, E), vecteur(B, C))).toBe(true);
    expect(distance(A, D) / distance(A, B)).toBeCloseTo(t, 1);
    expect(distance(A, E) / distance(A, C)).toBeCloseTo(t, 1);
    expect(paralleles(vecteur(A, D), vecteur(A, B))).toBe(true);
    expect(paralleles(vecteur(A, E), vecteur(A, C))).toBe(true);
  });

  it.each([
    [62, 48, 0.4],
    [35, 80, 0.5],
    [75, 75, 0.6],
    [85, 35, 0.5],
  ])('dessine à l\'échelle des angles : B mesure %i°, C mesure %i°, D et E au rapport %f', (angleB, angleC, t) => {
    const { figure, points } = triangleEmboiteAvecAngles(angleB, angleC, t, ['A', 'B', 'C', 'D', 'E'], 'Deux triangles emboîtés.');
    expect(fitsInFrame(figure)).toBe(true);
    const { A, B, C, D, E } = points;
    expect(angleEn(B, A, C)).toBeCloseTo(angleB, 0);
    expect(angleEn(C, A, B)).toBeCloseTo(angleC, 0);
    expect(paralleles(vecteur(D, E), vecteur(B, C))).toBe(true);
    expect(distance(A, D) / distance(A, B)).toBeCloseTo(t, 1);
    expect(distance(A, E) / distance(A, C)).toBeCloseTo(t, 1);
    // Les angles ADE et ABC sont correspondants : égaux.
    expect(angleEn(D, A, E)).toBeCloseTo(angleB, 0);
  });

  it.each([0.5, 0.8, 1.3])('trace le papillon de rapport %f : A entre B et D, entre C et E, et (BC) parallèle à (DE)', (rapport) => {
    const { figure, points } = papillon(rapport, ['A', 'B', 'C', 'D', 'E'], 'Un papillon.');
    expect(fitsInFrame(figure)).toBe(true);
    const { A, B, C, D, E } = points;
    expect(paralleles(vecteur(B, C), vecteur(D, E))).toBe(true);
    // A est entre B et D, et entre C et E : les vecteurs AB et AD sont opposés.
    expect(vecteur(A, B)[0] * vecteur(A, D)[0] + vecteur(A, B)[1] * vecteur(A, D)[1]).toBeLessThan(0);
    expect(vecteur(A, C)[0] * vecteur(A, E)[0] + vecteur(A, C)[1] * vecteur(A, E)[1]).toBeLessThan(0);
    expect(distance(A, D) / distance(A, B)).toBeCloseTo(rapport, 1);
    expect(distance(A, E) / distance(A, C)).toBeCloseTo(rapport, 1);
  });
});

describe('les figures avec une hauteur', () => {
  it.each([
    [8, 5],
    [12, 4],
    [6, 7],
  ])('trace un parallélogramme de base %i et de hauteur %i, dont la hauteur est perpendiculaire à la base', (base, hauteur) => {
    const figure = parallelogrammeAvecHauteur(base, hauteur, `${base} cm`, `${hauteur} cm`, ['A', 'B', 'C', 'D'], 'Un parallélogramme.');
    expect(fitsInFrame(figure)).toBe(true);
    const [a, b, c, d] = formes(figure, 'polygon')[0].points;
    expect(paralleles(vecteur(a, b), vecteur(d, c))).toBe(true);
    expect(paralleles(vecteur(a, d), vecteur(b, c))).toBe(true);
    const hauteurTracee = formes(figure, 'segment').find((segment) => segment.dashed);
    expect(hauteurTracee).toBeDefined();
    const pied = hauteurTracee!.to;
    expect(vecteur(hauteurTracee!.from, pied)[0] * vecteur(a, b)[0] + vecteur(hauteurTracee!.from, pied)[1] * vecteur(a, b)[1]).toBeCloseTo(0, 0);
    expect(distance(hauteurTracee!.from, pied) / distance(a, b)).toBeCloseTo(hauteur / base, 1);
  });

  it.each([
    [10, 6, 0.3],
    [7, 5, 0.5],
    [12, 4, 0.8],
  ])('trace un triangle de base %i et de hauteur %i, au pied en %f de la base', (base, hauteur, pied) => {
    const figure = triangleAvecHauteur(base, hauteur, pied, `${base} cm`, `${hauteur} cm`, ['A', 'B', 'C'], 'Un triangle.');
    expect(fitsInFrame(figure)).toBe(true);
    const [a, b, c] = formes(figure, 'polygon')[0].points;
    const hauteurTracee = formes(figure, 'segment').find((segment) => segment.dashed)!;
    expect(hauteurTracee.from).toEqual(a);
    expect(vecteur(a, hauteurTracee.to)[0] * vecteur(b, c)[0] + vecteur(a, hauteurTracee.to)[1] * vecteur(b, c)[1]).toBeCloseTo(0, 0);
    expect(distance(a, hauteurTracee.to) / distance(b, c)).toBeCloseTo(hauteur / base, 1);
  });
});

describe('le disque', () => {
  it('trace un rayon ou un diamètre, avec son texte', () => {
    const rayon = disqueAvecRayon('5 cm', false, 'Un disque.');
    const diametre = disqueAvecRayon('10 cm', true, 'Un disque.');
    [rayon, diametre].forEach((figure) => expect(fitsInFrame(figure)).toBe(true));
    const [cercle] = formes(rayon, 'circle');
    const [segmentDuRayon] = formes(rayon, 'segment');
    expect(distance(segmentDuRayon.from, segmentDuRayon.to)).toBeCloseTo(cercle.radius, 0);
    const [segmentDuDiametre] = formes(diametre, 'segment');
    expect(distance(segmentDuDiametre.from, segmentDuDiametre.to)).toBeCloseTo(2 * cercle.radius, 0);
  });
});
