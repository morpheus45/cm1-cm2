import { rngInt, rngPick, type Rng } from '../lib/seededRandom';
import { fauxEcrits, fixe, nb, rat, texteRat, MOINS, type Rat } from './mathsCycle4';

/**
 * Ce que partagent les problèmes de la 5e, de la 4e et de la 3e : l'écriture
 * d'un montant, d'une grandeur et de son unité, d'un pourcentage ou d'une
 * fraction, et les erreurs d'élève qui s'écrivent avec eux.
 *
 * Les montants se calculent en centimes (des entiers) : aucune erreur d'arrondi
 * ne se glisse entre le calcul et ce que l'élève lit.
 */

export { INSTRUCTION, INSTRUCTION_DONNEES } from './problemesCommun';

/** 2540 centimes → « 25,40 € » ; 2500 → « 25 € ». */
export const euros = (centimes: number): string => (centimes % 100 === 0 ? `${nb(centimes / 100)} €` : `${fixe(centimes / 100, 2)} €`);

/** Une valeur et son unité : « 12,5 kg ». */
export const avecUnite = (valeur: number, unite: string): string => `${nb(valeur)} ${unite}`;

/** Un pourcentage : « 25 % », « 12,5 % ». */
export const pourcent = (valeur: number): string => `${nb(valeur)} %`;

/** Des erreurs d'élève, écrites avec leur unité. */
export const fauxAvecUnite = (correct: number, candidats: number[], unite: string, options: { min?: number; max?: number; decimales?: number } = {}): string[] =>
  fauxEcrits(correct, candidats, (valeur) => avecUnite(valeur, unite), options);

/** Des erreurs sur un montant en centimes. Plus de trois : les voisins ne sont là qu'en dernier recours, à dix centimes près. */
export const fauxEuros = (correct: number, candidats: number[]): string[] =>
  fauxEcrits(correct / 100, candidats.map((candidat) => candidat / 100), (valeur) => euros(Math.round(valeur * 100)), { min: 0.01, decimales: 2 });

/** Des erreurs en pourcentage. */
export const fauxPourcents = (correct: number, candidats: number[], options: { min?: number; max?: number; decimales?: number } = {}): string[] =>
  fauxEcrits(correct, candidats, pourcent, { min: 0, ...options });

/** Une fraction écrite, simplifiée : « 3/5 », « 7 » pour 7/1. */
export const ecritFraction = (n: number, d: number): string => texteRat(rat(n, d));

/**
 * Des fractions fausses autour d'une bonne réponse : simplifiées, jamais égales à elle, ni vides.
 * Une fraction qui vaut la bonne réponse sous une autre écriture (2/4 pour 1/2) serait juste : elle est écartée.
 */
export function fractionsAuChoix(correct: Rat, candidats: [number, number][]): string[] {
  const vues = new Set<string>([texteRat(correct)]);
  const resultat: string[] = [];
  candidats.forEach(([n, d]) => {
    if (d === 0 || !Number.isFinite(n) || !Number.isFinite(d)) return;
    const ecrit = texteRat(rat(n, d));
    if (vues.has(ecrit)) return;
    vues.add(ecrit);
    resultat.push(ecrit);
  });
  return resultat;
}

/** « 1 heure », « 2 heures » : le pluriel dès 2. */
export const heures = (n: number): string => `${nb(n)} ${n >= 2 ? 'heures' : 'heure'}`;

/** Un entier tiré dans l'intervalle, jamais l'un des `exclus`. */
export function entierSauf(rng: Rng, min: number, max: number, exclus: number[]): number {
  const permis = Array.from({ length: max - min + 1 }, (_, rang) => min + rang).filter((valeur) => !exclus.includes(valeur));
  return permis.length > 0 ? rngPick(rng, permis) : rngInt(rng, min, max);
}

/** Une opération avec ses signes : « −3 + 8 », « 4 − 9 », « −3 − 5 ». */
export const sommeAvecSigne = (a: number, variation: number): string => `${nb(a)} ${variation < 0 ? MOINS : '+'} ${nb(Math.abs(variation))}`;

/** « 2 h 40 min », « 1 h », « 35 min » : une durée comme on l'écrit à l'école. */
export const dureeEcrite = (minutes: number): string => {
  const [h, m] = [Math.floor(minutes / 60), minutes % 60];
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
};

/** « de Léa », « d'Inès » : l'élision devant un prénom qui commence par une voyelle (le « h » de Hugo ne s'élide pas, le « y » de Yanis non plus). */
export const deNom = (nom: string): string => (/^[AEIOUÉÈÊÀÂÎÔÛŒ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** « que Léa », « qu'Inès ». */
export const queNom = (nom: string): string => (/^[AEIOUÉÈÊÀÂÎÔÛŒ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);
