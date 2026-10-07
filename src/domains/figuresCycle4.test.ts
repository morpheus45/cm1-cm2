import { describe, expect, it } from 'vitest';
import { distance, fitsInFrame, type Figure, type Point, type Shape } from '../lib/figures';
import { anglesDuDiagramme, CADRE_DU_REPERE, diagrammeCirculaire, droiteDuRepere, graduations, pointDuRepere, RANG_DES_GRADUATIONS, repere, tableauDeValeurs } from './figuresCycle4';

/**
 * Les figures du collège doivent montrer ce que la question affirme : un
 * repère dont les graduations sont aux bons endroits, un diagramme circulaire
 * dont les parts sont proportionnelles à leurs pourcentages, un tableau écrit
 * à la française. Elles sont relues ici comme le ferait un élève : à partir de
 * ce qui est dessiné.
 */

type Texte = Extract<Shape, { kind: 'text' }>;
type Segment = Extract<Shape, { kind: 'segment' }>;

const textes = (figure: Figure): Texte[] => figure.shapes.filter((forme): forme is Texte => forme.kind === 'text');
const segments = (figure: Figure): Segment[] => figure.shapes.filter((forme): forme is Segment => forme.kind === 'segment');
const nombreEcrit = (texte: string): number => Number(texte.replace('−', '-').replace(',', '.'));

describe('le repère', () => {
  const figure = repere(
    { min: 0, max: 8, pas: 1, nom: 'Masse (kg)' },
    { min: 0, max: 20, pas: 2.5, nom: 'Prix (€)' },
    (px, py) => [droiteDuRepere(px, py, 2.5, 0, 0, 8), pointDuRepere(px, py, 4, 10)],
    'Un repère.'
  );

  it('tient dans son cadre', () => {
    expect(fitsInFrame(figure)).toBe(true);
    expect(figure.alt).toBeTruthy();
  });

  it('écrit les graduations à la française, au bon endroit', () => {
    const enBas = textes(figure).filter((texte) => texte.at[1] === RANG_DES_GRADUATIONS.ligneX);
    expect(enBas.map((texte) => texte.text)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
    const aGauche = textes(figure).filter((texte) => texte.at[0] === RANG_DES_GRADUATIONS.colonneY);
    expect(aGauche.map((texte) => texte.text)).toEqual(['0', '2,5', '5', '7,5', '10', '12,5', '15', '17,5', '20']);
    // Les graduations sont régulièrement espacées : de 29 unités de la figure entre deux graduations des x.
    const ecarts = enBas.slice(1).map((texte, rang) => texte.at[0] - enBas[rang].at[0]);
    ecarts.forEach((ecart) => expect(ecart).toBeCloseTo(ecarts[0], 0));
  });

  it('place la droite sur les graduations : de (0 ; 0) à (8 ; 20), et le point en (4 ; 10)', () => {
    const { gauche, droite, bas, haut } = CADRE_DU_REPERE;
    const droiteTracee = segments(figure).find((segment) => segment.ink === 'couleur');
    expect(droiteTracee?.from).toEqual([gauche, bas]);
    expect(droiteTracee?.to).toEqual([droite, haut]);
    const point = figure.shapes.find((forme) => forme.kind === 'circle');
    expect(point).toMatchObject({ center: [(gauche + droite) / 2, (bas + haut) / 2] });
  });

  it('trace le quadrillage à chaque graduation, les axes par l\'origine et nomme les grandeurs', () => {
    expect(segments(figure).filter((segment) => segment.ink === 'pale')).toHaveLength(graduations({ min: 0, max: 8, pas: 1, nom: '' }).length + graduations({ min: 0, max: 20, pas: 2.5, nom: '' }).length);
    expect(textes(figure).map((texte) => texte.text)).toEqual(expect.arrayContaining(['Masse (kg)', 'Prix (€)']));
  });

  it('gradue des deux côtés de zéro, avec le vrai signe moins, et saute des étiquettes quand c\'est serré', () => {
    const avecNegatifs = repere(
      { min: -4, max: 4, pas: 1, nom: 'x' },
      { min: -6, max: 6, pas: 1, nom: 'y', etiquette: 2 },
      (px, py) => [droiteDuRepere(px, py, 2, -1, -2, 3.5)],
      'Un repère.'
    );
    expect(fitsInFrame(avecNegatifs)).toBe(true);
    const aGauche = textes(avecNegatifs).filter((texte) => texte.at[0] === RANG_DES_GRADUATIONS.colonneY);
    expect(aGauche.map((texte) => texte.text)).toEqual(['−6', '−4', '−2', '0', '2', '4', '6']);
    const enBas = textes(avecNegatifs).filter((texte) => texte.at[1] === RANG_DES_GRADUATIONS.ligneX);
    expect(enBas.map((texte) => texte.text)).toEqual(['−4', '−3', '−2', '−1', '0', '1', '2', '3', '4']);
    // L'axe vertical passe par l'abscisse 0, l'axe horizontal par l'ordonnée 0.
    const [axeVertical, axeHorizontal] = segments(avecNegatifs).filter((segment) => segment.width === 2.2);
    const milieu = (CADRE_DU_REPERE.gauche + CADRE_DU_REPERE.droite) / 2;
    expect(axeVertical.from[0]).toBe(milieu);
    expect(axeHorizontal.from[1]).toBe((CADRE_DU_REPERE.haut + CADRE_DU_REPERE.bas) / 2);
  });

  it('trouve ses graduations sans erreur d\'arrondi', () => {
    expect(graduations({ min: 0, max: 1, pas: 0.1, nom: '' })).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
    expect(graduations({ min: -2, max: 2, pas: 0.5, nom: '' })).toEqual([-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]);
  });
});

describe('le diagramme circulaire', () => {
  const parts: [string, number][] = [['Foot', 25], ['Judo', 40], ['Danse', 10], ['Vélo', 25]];
  const figure = diagrammeCirculaire(parts, 'Un diagramme circulaire.');

  it('tient dans son cadre et nomme chaque part avec son pourcentage', () => {
    expect(fitsInFrame(figure)).toBe(true);
    expect(textes(figure).map((texte) => texte.text)).toEqual(['Foot 25 %', 'Judo 40 %', 'Danse 10 %', 'Vélo 25 %']);
  });

  it('partage le disque en parts dont l\'angle est proportionnel au pourcentage, en tournant dans le sens des aiguilles d\'une montre depuis le haut', () => {
    const centre = figure.shapes.find((forme) => forme.kind === 'circle');
    expect(centre).toBeDefined();
    const [cx, cy] = (centre as { center: Point }).center;
    const rayons = segments(figure).filter((segment) => segment.from[0] === cx && segment.from[1] === cy);
    expect(rayons).toHaveLength(parts.length);
    // L'angle de chaque rayon, mesuré depuis le haut dans le sens des aiguilles d'une montre.
    const angles = rayons.map((rayon) => {
      const [dx, dy] = [rayon.to[0] - cx, rayon.to[1] - cy];
      return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    });
    expect(angles[0]).toBeCloseTo(0, 0);
    parts.forEach(([, pourcentage], rang) => {
      const suivant = rang === parts.length - 1 ? 360 : angles[rang + 1];
      expect(suivant - angles[rang], parts[rang][0]).toBeCloseTo(pourcentage * 3.6, 0);
    });
    rayons.forEach((rayon) => expect(distance(rayon.from, rayon.to)).toBeCloseTo((centre as { radius: number }).radius, 0));
  });

  it('calcule les angles de départ et d\'arrivée de chaque part', () => {
    const [premiere, derniere] = anglesDuDiagramme([25, 75]);
    expect(premiere).toEqual({ debut: 90, fin: 0 });
    // Un tour complet : on repart du haut (90°) et l'on tourne de 360°.
    expect(derniere.debut).toBeCloseTo(0, 6);
    expect(derniere.fin).toBeCloseTo(-270, 6);
  });
});

describe('le tableau de valeurs', () => {
  it('écrit les nombres comme on les écrit en français et marque l\'inconnue d\'un « ? »', () => {
    const figure = tableauDeValeurs(
      [
        ['Masse (kg)', ['2', '5', '8']],
        ['Prix (€)', ['3,40', '8,50', null]],
      ],
      'Un tableau.'
    );
    expect(fitsInFrame(figure)).toBe(true);
    const ecrits = textes(figure).map((texte) => texte.text);
    expect(ecrits).toEqual(['Masse (kg)', '2', '5', '8', 'Prix (€)', '3,40', '8,50', '?']);
    ecrits.forEach((texte) => expect(texte).not.toMatch(/\d\.\d/));
    expect(nombreEcrit('3,40')).toBeCloseTo(3.4, 9);
  });
});
