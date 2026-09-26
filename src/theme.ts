import type { Domain, Subject } from './types';

/**
 * L'arc-en-ciel de l'École : une couleur par notion. Le français en occupe le
 * côté chaud — rouge, orange, jaune —, les maths le côté froid — vert, bleu,
 * violet. L'arc rappelle à l'œil ce que l'application impose : une séance
 * reste d'un seul côté.
 *
 * `band` colore les dessins (l'arc, les gommettes) ; `deep` les textes et les
 * bordures, lisible sur `tint` comme sur le papier (contraste de 4,5:1 au
 * moins, vérifié) ; `tint` les fonds.
 */
export interface NotionColors {
  band: string;
  deep: string;
  tint: string;
}

export const NOTION_COLORS: Record<Domain, NotionColors> = {
  conjugaison: { band: '#E5484D', deep: '#B91C3B', tint: '#FDE8EC' },
  accords: { band: '#F2842F', deep: '#B84A06', tint: '#FFEBDC' },
  orthographe: { band: '#F7C548', deep: '#8A6500', tint: '#FFF4D1' },
  numeration: { band: '#3DAE6B', deep: '#1B7A43', tint: '#E2F4E8' },
  calcul: { band: '#3D84D6', deep: '#1A5DB8', tint: '#E2ECFB' },
  problemes: { band: '#8B5CF0', deep: '#6534CF', tint: '#EEE7FF' },
};

/** La couleur qui annonce une matière : celle de sa première notion. */
export const SUBJECT_COLORS: Record<Subject, NotionColors> = {
  francais: NOTION_COLORS.conjugaison,
  maths: NOTION_COLORS.calcul,
};

/** Le rouge du stylo de la maîtresse — tampons, corrections. */
export const TEACHER_RED = '#C0263D';
