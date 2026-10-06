import { polar, round, type Figure, type Point, type Shape } from '../lib/figures';

/**
 * Les dessins des nombres : la droite graduée, les fractions d'une figure.
 * Comme ceux de la géométrie (geometrieFigures.ts), ils sont décrits comme
 * des données : les tests vérifient qu'ils tiennent dans leur cadre et que ce
 * qu'ils montrent est ce que la question demande.
 */

export const LARGEUR = 300;

// --- La droite graduée --------------------------------------------------------------------

export interface DroiteGraduee {
  /** Le nombre d'intervalles : la droite a `intervalles + 1` graduations. */
  intervalles: number;
  /** Ce qui est écrit sous une graduation : son rang (0 = la première) et son texte. */
  etiquettes: Record<number, string>;
  /** La graduation que désigne une flèche, avec un « ? » au-dessus. */
  fleche?: number;
  /** Des lettres posées sur des graduations (A, B, C, D) : « quelle lettre est à la place de… ». */
  lettres?: Record<number, string>;
}

const GAUCHE = 30;
const DROITE = 270;
const AXE = 62;

/** L'abscisse de la graduation `rang`. */
export const abscisse = (rang: number, intervalles: number): number =>
  Math.round((GAUCHE + ((DROITE - GAUCHE) * rang) / intervalles) * 10) / 10;

export function droiteGraduee({ intervalles, etiquettes, fleche, lettres }: DroiteGraduee, alt: string): Figure {
  const shapes: Shape[] = [{ kind: 'segment', from: [GAUCHE - 14, AXE], to: [DROITE + 14, AXE], width: 2.5 }];
  for (let rang = 0; rang <= intervalles; rang++) {
    const x = abscisse(rang, intervalles);
    shapes.push({ kind: 'segment', from: [x, AXE - 8], to: [x, AXE + 8], width: 2 });
  }
  Object.entries(etiquettes).forEach(([rang, texte]) =>
    shapes.push({ kind: 'text', at: [abscisse(Number(rang), intervalles), AXE + 28], text: texte, anchor: 'middle', size: 13, bold: true })
  );
  if (fleche !== undefined) {
    const x = abscisse(fleche, intervalles);
    shapes.push(
      { kind: 'segment', from: [x, 22], to: [x, AXE - 12], ink: 'couleur', width: 3 },
      { kind: 'segment', from: [x, AXE - 12], to: [x - 6, AXE - 21], ink: 'couleur', width: 3 },
      { kind: 'segment', from: [x, AXE - 12], to: [x + 6, AXE - 21], ink: 'couleur', width: 3 },
      { kind: 'text', at: [x, 16], text: '?', anchor: 'middle', size: 16, bold: true, ink: 'couleur' }
    );
  }
  Object.entries(lettres ?? {}).forEach(([rang, lettre]) => {
    const x = abscisse(Number(rang), intervalles);
    shapes.push({ kind: 'point', at: [x, AXE], ink: 'couleur' }, { kind: 'text', at: [x, AXE - 16], text: lettre, anchor: 'middle', size: 16, bold: true, ink: 'couleur' });
  });
  return { width: LARGEUR, height: 100, shapes, alt };
}

// --- Les fractions d'une figure ----------------------------------------------------------

export type FormePartagee = 'barre' | 'disque';

/** Une barre ou un disque partagé en `parts` parts égales, dont les `coloriees`
 *  premières sont coloriées. */
export function figurePartagee(forme: FormePartagee, parts: number, coloriees: number): Figure {
  const shapes: Shape[] = [];
  if (forme === 'barre') {
    const [x0, x1, y0, y1] = [30, 270, 38, 98];
    const x = (index: number) => round([x0 + ((x1 - x0) * index) / parts, 0])[0];
    if (coloriees > 0) {
      shapes.push({ kind: 'aire', rings: [[[x0, y0], [x(coloriees), y0], [x(coloriees), y1], [x0, y1]]], ground: 'couleur', ink: 'aucune' });
    }
    shapes.push({ kind: 'polygon', points: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] });
    for (let index = 1; index < parts; index++) shapes.push({ kind: 'segment', from: [x(index), y0], to: [x(index), y1], width: 2 });
    return { width: LARGEUR, height: 136, shapes, alt: `Une barre partagée en ${parts} parts égales, dont certaines sont coloriées.` };
  }
  const [centre, rayon]: [Point, number] = [[150, 70], 58];
  // Les parts se suivent à partir du haut, dans le sens des aiguilles d'une montre.
  const angle = (index: number) => 90 - (360 * index) / parts;
  if (coloriees > 0) {
    const arc: Point[] = [];
    const total = (360 * coloriees) / parts;
    const pas = Math.max(2, Math.ceil(total / 5));
    for (let k = 0; k <= pas; k++) arc.push(round(polar(centre, rayon, 90 - (total * k) / pas)));
    shapes.push({ kind: 'aire', rings: [coloriees === parts ? arc.slice(0, -1) : [centre, ...arc]], ground: 'couleur', ink: 'aucune' });
  }
  shapes.push({ kind: 'circle', center: centre, radius: rayon });
  if (parts > 1) for (let index = 0; index < parts; index++) shapes.push({ kind: 'segment', from: centre, to: round(polar(centre, rayon, angle(index))), width: 2 });
  return { width: LARGEUR, height: 140, shapes, alt: `Un disque partagé en ${parts} parts égales, dont certaines sont coloriées.` };
}

// --- Les données : tableau, pictogramme, diagramme en barres ------------------------------------

/** Un tableau à deux colonnes : l'en-tête, puis une ligne par catégorie. */
export function tableauDeDonnees(entetes: [string, string], lignes: [string, number][]): Figure {
  const [gauche, milieu, droite, haut, hauteur] = [14, 190, 286, 10, 28];
  const rangs = lignes.length + 1;
  const bas = haut + rangs * hauteur;
  const centre = (milieu + droite) / 2;
  const shapes: Shape[] = [{ kind: 'polygon', points: [[gauche, haut], [droite, haut], [droite, bas], [gauche, bas]] }];
  for (let rang = 1; rang < rangs; rang++) shapes.push({ kind: 'segment', from: [gauche, haut + rang * hauteur], to: [droite, haut + rang * hauteur], width: 2 });
  shapes.push({ kind: 'segment', from: [milieu, haut], to: [milieu, bas], width: 2 });
  shapes.push(
    { kind: 'text', at: [gauche + 10, haut + 19], text: entetes[0], bold: true, size: 14 },
    { kind: 'text', at: [centre, haut + 19], text: entetes[1], anchor: 'middle', bold: true, size: 14 }
  );
  lignes.forEach(([nom, valeur], index) => {
    const y = haut + (index + 1) * hauteur + 19;
    shapes.push({ kind: 'text', at: [gauche + 10, y], text: nom, size: 14 }, { kind: 'text', at: [centre, y], text: String(valeur), anchor: 'middle', size: 15, bold: true });
  });
  return { width: LARGEUR, height: bas + 10, shapes, alt: `Un tableau de ${lignes.length} lignes : ${entetes[0]} et ${entetes[1]}.` };
}

/** Un pictogramme : chaque rond vaut `valeurDuRond`, une ligne par catégorie. */
export function pictogramme(lignes: [string, number][], valeurDuRond: number, nomDeLUnite: string): Figure {
  const [haut, pas] = [20, 30];
  const shapes: Shape[] = [];
  lignes.forEach(([nom, valeur], index) => {
    const y = haut + index * pas;
    shapes.push({ kind: 'text', at: [14, y + 5], text: nom, size: 14 });
    for (let rond = 0; rond < valeur / valeurDuRond; rond++) shapes.push({ kind: 'circle', center: [140 + rond * 17, y], radius: 6, ink: 'couleur', fill: true });
  });
  const bas = haut + lignes.length * pas + 6;
  shapes.push(
    { kind: 'segment', from: [14, bas - 12], to: [286, bas - 12], ink: 'pale', width: 1.5 },
    { kind: 'circle', center: [22, bas + 8], radius: 6, ink: 'couleur', fill: true },
    { kind: 'text', at: [36, bas + 13], text: `= ${valeurDuRond} ${nomDeLUnite}`, size: 14, bold: true }
  );
  return { width: LARGEUR, height: bas + 24, shapes, alt: `Un pictogramme : chaque rond représente ${valeurDuRond} ${nomDeLUnite}.` };
}

/** Un diagramme en barres, gradué de 0 à `maximum` de `pas` en `pas`. */
export function diagrammeEnBarres(barres: [string, number][], maximum: number, pas: number, unite: string): Figure {
  const [gauche, droite, bas, haut] = [48, 292, 148, 22];
  const y = (valeur: number) => Math.round((bas - ((bas - haut) * valeur) / maximum) * 10) / 10;
  const shapes: Shape[] = [];
  for (let valeur = pas; valeur <= maximum; valeur += pas) shapes.push({ kind: 'segment', from: [gauche, y(valeur)], to: [droite, y(valeur)], ink: 'pale', width: 1 });
  shapes.push({ kind: 'segment', from: [gauche, haut - 6], to: [gauche, bas], width: 2.5 }, { kind: 'segment', from: [gauche, bas], to: [droite, bas], width: 2.5 });
  for (let valeur = 0; valeur <= maximum; valeur += pas) {
    shapes.push({ kind: 'segment', from: [gauche - 5, y(valeur)], to: [gauche, y(valeur)], width: 2 }, { kind: 'text', at: [gauche - 9, y(valeur) + 4.5], text: String(valeur), anchor: 'end', size: 12 });
  }
  const case_ = (droite - gauche) / barres.length;
  barres.forEach(([nom, valeur], index) => {
    const centre = Math.round((gauche + case_ * (index + 0.5)) * 10) / 10;
    const demi = Math.round(case_ * 0.28 * 10) / 10;
    const anneau: Point[] = [[centre - demi, bas], [centre - demi, y(valeur)], [centre + demi, y(valeur)], [centre + demi, bas]];
    shapes.push({ kind: 'aire', rings: [anneau], ground: 'couleur', ink: 'aucune' }, { kind: 'polygon', points: anneau });
    shapes.push({ kind: 'text', at: [centre, bas + 17], text: nom, anchor: 'middle', size: 12 });
  });
  shapes.push({ kind: 'text', at: [gauche - 9, 12], text: unite, anchor: 'start', size: 12, ink: 'pale' });
  return { width: LARGEUR, height: bas + 30, shapes, alt: `Un diagramme en barres, gradué de 0 à ${maximum} de ${pas} en ${pas}.` };
}

/** Un tableau à double entrée : une ligne d'en-tête, une colonne d'en-tête, et les valeurs ; une valeur
 *  `null` est écrite « ? ». */
export function tableauADoubleEntree(colonnes: string[], lignes: [string, (number | null)[]][]): Figure {
  const [gauche, droite, haut, hauteur] = [14, 286, 10, 28];
  const premiere = 96;
  const largeur = (droite - gauche - premiere) / colonnes.length;
  const rangs = lignes.length + 1;
  const bas = haut + rangs * hauteur;
  const x = (colonne: number) => Math.round((gauche + premiere + largeur * colonne) * 10) / 10;
  const shapes: Shape[] = [{ kind: 'polygon', points: [[gauche, haut], [droite, haut], [droite, bas], [gauche, bas]] }];
  for (let rang = 1; rang < rangs; rang++) shapes.push({ kind: 'segment', from: [gauche, haut + rang * hauteur], to: [droite, haut + rang * hauteur], width: 2 });
  for (let colonne = 0; colonne < colonnes.length; colonne++) shapes.push({ kind: 'segment', from: [x(colonne), haut], to: [x(colonne), bas], width: 2 });
  colonnes.forEach((nom, colonne) => shapes.push({ kind: 'text', at: [(x(colonne) + x(colonne + 1)) / 2, haut + 19], text: nom, anchor: 'middle', bold: true, size: 13 }));
  lignes.forEach(([nom, valeurs], index) => {
    const yy = haut + (index + 1) * hauteur + 19;
    shapes.push({ kind: 'text', at: [gauche + 8, yy], text: nom, bold: true, size: 13 });
    valeurs.forEach((valeur, colonne) =>
      shapes.push({ kind: 'text', at: [(x(colonne) + x(colonne + 1)) / 2, yy], text: valeur === null ? '?' : String(valeur), anchor: 'middle', size: 15, bold: valeur === null, ink: valeur === null ? 'couleur' : 'encre' })
    );
  });
  return { width: LARGEUR, height: bas + 10, shapes, alt: `Un tableau à double entrée de ${lignes.length} lignes et ${colonnes.length} colonnes.` };
}

/** Un tableau de proportionnalité : une ligne par grandeur (sa colonne de noms, puis ses valeurs) ; une valeur
 *  `null` est écrite « ? ». */
export function tableauDeProportionnalite(lignes: [string, (number | null)[]][]): Figure {
  const [gauche, droite, haut, hauteur, premiere] = [14, 286, 10, 32, 112];
  const colonnes = lignes[0][1].length;
  const largeur = (droite - gauche - premiere) / colonnes;
  const bas = haut + lignes.length * hauteur;
  const x = (colonne: number) => Math.round((gauche + premiere + largeur * colonne) * 10) / 10;
  const shapes: Shape[] = [{ kind: 'polygon', points: [[gauche, haut], [droite, haut], [droite, bas], [gauche, bas]] }];
  for (let rang = 1; rang < lignes.length; rang++) shapes.push({ kind: 'segment', from: [gauche, haut + rang * hauteur], to: [droite, haut + rang * hauteur], width: 2 });
  for (let colonne = 0; colonne < colonnes; colonne++) shapes.push({ kind: 'segment', from: [x(colonne), haut], to: [x(colonne), bas], width: 2 });
  lignes.forEach(([nom, valeurs], rang) => {
    const y = haut + rang * hauteur + 21;
    shapes.push({ kind: 'text', at: [gauche + 8, y], text: nom, bold: true, size: 13 });
    valeurs.forEach((valeur, colonne) =>
      shapes.push({ kind: 'text', at: [(x(colonne) + x(colonne + 1)) / 2, y], text: valeur === null ? '?' : String(valeur), anchor: 'middle', size: 15, bold: valeur === null, ink: valeur === null ? 'couleur' : 'encre' })
    );
  });
  return { width: LARGEUR, height: bas + 10, shapes, alt: `Un tableau de proportionnalité de ${lignes.length} lignes et ${colonnes} colonnes.` };
}

export interface PartieDeBarre {
  texte: string;
  /** La longueur de la partie, relative aux autres : des parties égales ont le même poids. */
  poids: number;
  /** La partie que l'on cherche : coloriée, avec un « ? ». */
  inconnue?: boolean;
}

/** Un schéma en barres : le total au-dessus, accolé à toute la barre, puis les parties côte à côte. */
export function schemaEnBarres(total: string, parties: PartieDeBarre[]): Figure {
  const [gauche, droite, haut, bas] = [20, 280, 58, 100];
  const poidsTotal = parties.reduce((somme, partie) => somme + partie.poids, 0);
  const shapes: Shape[] = [
    { kind: 'segment', from: [gauche, 42], to: [droite, 42], width: 2 },
    { kind: 'segment', from: [gauche, 36], to: [gauche, 48], width: 2 },
    { kind: 'segment', from: [droite, 36], to: [droite, 48], width: 2 },
    { kind: 'text', at: [(gauche + droite) / 2, 28], text: total, anchor: 'middle', bold: true, size: 15 },
  ];
  let debut = gauche;
  parties.forEach((partie) => {
    const fin = Math.round((debut + ((droite - gauche) * partie.poids) / poidsTotal) * 10) / 10;
    const anneau: Point[] = [[Math.round(debut * 10) / 10, haut], [fin, haut], [fin, bas], [Math.round(debut * 10) / 10, bas]];
    if (partie.inconnue) shapes.push({ kind: 'aire', rings: [anneau], ground: 'couleur', ink: 'aucune' });
    shapes.push({ kind: 'polygon', points: anneau });
    shapes.push({ kind: 'text', at: [Math.round(((debut + fin) / 2) * 10) / 10, (haut + bas) / 2 + 5], text: partie.texte, anchor: 'middle', bold: true, size: 15 });
    debut = fin;
  });
  return { width: LARGEUR, height: 118, shapes, alt: `Un schéma en barres : un total de ${total}, partagé en ${parties.length} parties.` };
}
