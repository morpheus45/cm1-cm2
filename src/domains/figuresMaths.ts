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
