import type { Domain, Subject } from './types';

/**
 * L'arc-en-ciel de l'École : une couleur par notion. Le français en occupe le
 * côté chaud — rouge, orange, jaune —, les maths le côté froid — vert, bleu,
 * violet, rose. L'arc rappelle à l'œil ce que l'application impose : une
 * séance reste d'un seul côté.
 *
 * L'histoire et la géographie ont chacune leur arc : l'or, le bordeaux et le
 * bleu roi des blasons pour l'une ; le bleu de la mer, le vert des plaines et
 * la terre cuite des reliefs pour l'autre, comme sur une carte.
 *
 * `band` colore les dessins (l'arc, les gommettes) ; `deep` les textes et les
 * bordures, lisible sur `tint` comme sur le papier (contraste de 4,5:1 au
 * moins, vérifié) ; `tint` les fonds. Dans chaque matière, les couleurs des
 * notions restent distinctes pour les daltoniens (écart ΔE ≥ 8 entre toutes
 * les paires, vérifié) ; une notion est de toute façon toujours nommée.
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
  calcul: { band: '#2E9BE0', deep: '#1A5DB8', tint: '#E2ECFB' },
  problemes: { band: '#7A4FE0', deep: '#6534CF', tint: '#EEE7FF' },
  geometrie: { band: '#D0479B', deep: '#A62A74', tint: '#FBE6F2' },
  chronologie: { band: '#D4A02C', deep: '#835B00', tint: '#FFF3D6' },
  evenements: { band: '#B0355E', deep: '#982A51', tint: '#FBE5EE' },
  'mots-histoire': { band: '#4A62C4', deep: '#3A4FA8', tint: '#E7EBFA' },
  cartes: { band: '#1A8FB5', deep: '#136A88', tint: '#E0F2F8' },
  habiter: { band: '#A5C23A', deep: '#4A6512', tint: '#EEF5D8' },
  'mots-geographie': { band: '#C0603A', deep: '#9A4222', tint: '#FBE8DF' },
};

/** La couleur qui annonce une matière. */
export const SUBJECT_COLORS: Record<Subject, NotionColors> = {
  francais: NOTION_COLORS.conjugaison,
  maths: NOTION_COLORS.calcul,
  histoire: NOTION_COLORS.evenements,
  geographie: NOTION_COLORS.cartes,
};

/** Le rouge du stylo de la maîtresse — tampons, corrections. */
export const TEACHER_RED = '#C0263D';
