import type { Level, Question } from '../types';
import { rngInt, rngPickN, rngShuffle, type Rng } from '../lib/seededRandom';

/**
 * Le français du CE1, du CE2 et de la 6e s'écrit à part de celui du CM1 et du
 * CM2 : chaque niveau a ses propres listes (verbes, noms, adjectifs, mots à
 * orthographier), choisies d'après son programme et le vocabulaire des
 * enfants de son âge, et sa propre répartition par trimestre. Rien de ce qui
 * sert au CM1 et au CM2 ne passe par ici, et rien d'ici ne leur parvient : le
 * test empreintesFrancaisCM.test.ts le garantit.
 *
 * Ce fichier réunit ce que les trois notions (conjugaison, accords,
 * orthographe) font de la même façon pour ces niveaux : répartir une séance
 * entre des familles de questions, tirer des questions distinctes, écrire
 * correctement l'élision.
 */

/** Les trois niveaux dont les questions de français sont écrites ici. */
export const NIVEAUX_ECRITS: Level[] = ['CE1', 'CE2', '6e'];

export function estNiveauEcrit(level: Level): boolean {
  return NIVEAUX_ECRITS.includes(level);
}

/** Ce qui distingue deux questions pour l'élève : la consigne et l'énoncé,
 *  comme dans la mesure de couverture et l'historique des séances. */
export function signature(question: Question): string {
  return `${question.instruction ?? ''}|${question.prompt}`;
}

/** Le mot commence-t-il par une voyelle, accentuée ou non, ou par un h muet ?
 *  Les mots de nos listes qui commencent par un h (homme, habiter, hôpital)
 *  ont tous un h muet : aucun h aspiré n'y figure. */
export function commenceParVoyelle(mot: string): boolean {
  return /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(mot);
}

/** « de » devant un mot : « de chats », mais « d'amis ». */
export function deMot(mot: string): string {
  return commenceParVoyelle(mot) ? `d'${mot}` : `de ${mot}`;
}

export function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Les mêmes éléments sans doublon, dans leur ordre, en ignorant la casse ;
 *  `exclure` écarte d'avance ce qui ne doit pas figurer (la bonne réponse). */
export function sansDoublon(mots: string[], exclure: string[] = []): string[] {
  const vus = new Set(exclure.map((mot) => mot.toLowerCase()));
  return mots.filter((mot) => {
    const cle = mot.toLowerCase();
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  });
}

/**
 * Tire `n` éléments distincts d'une liste, sans la copier ni la mélanger tout
 * entière (certaines listes comptent des milliers de candidats et une séance
 * n'en tire que quelques dizaines). Quand la liste est plus courte que `n`,
 * elle est reprise autant de fois qu'il le faut : mieux vaut répéter que
 * raccourcir la séance.
 */
export function echantillon<T>(rng: Rng, liste: readonly T[], n: number): T[] {
  if (liste.length === 0 || n <= 0) return [];
  if (n >= liste.length) return rngPickN(rng, liste as T[], n);
  const echanges = new Map<number, number>();
  const tirage: T[] = [];
  for (let i = 0; i < n; i++) {
    const j = rngInt(rng, i, liste.length - 1);
    const valeurJ = echanges.get(j) ?? j;
    echanges.set(j, echanges.get(i) ?? i);
    tirage.push(liste[valeurJ]);
  }
  return tirage;
}

/**
 * Tire jusqu'à `n` éléments distincts en choisissant d'abord un verbe, puis
 * un de ses temps, puis un élément : chaque verbe pèse autant que les autres,
 * et chaque temps d'un verbe autant que les autres temps de ce verbe, quelle
 * que soit leur taille. Les verbes du CE2 en ont besoin : huit verbes
 * irréguliers doivent compter autant que cinquante verbes réguliers, et le
 * passé composé d'« aller », qui n'a que cinq sujets possibles, autant que
 * son présent, qui en a vingt et un.
 */
export function echantillonParGroupes<T>(rng: Rng, groupes: readonly (readonly (readonly T[])[])[], n: number): T[] {
  const utiles = groupes.map((sousGroupes) => sousGroupes.filter((groupe) => groupe.length > 0)).filter((sousGroupes) => sousGroupes.length > 0);
  if (utiles.length === 0 || n <= 0) return [];
  const dejaTires = new Set<T>();
  const tirage: T[] = [];
  const total = utiles.reduce((somme, sousGroupes) => somme + sousGroupes.reduce((s, groupe) => s + groupe.length, 0), 0);
  for (let essai = 0; tirage.length < n && essai < n * 8 + 40; essai++) {
    const sousGroupes = utiles[rngInt(rng, 0, utiles.length - 1)];
    const groupe = sousGroupes[rngInt(rng, 0, sousGroupes.length - 1)];
    const element = groupe[rngInt(rng, 0, groupe.length - 1)];
    if (dejaTires.has(element)) continue;
    dejaTires.add(element);
    tirage.push(element);
    if (dejaTires.size >= total) break;
  }
  return tirage;
}

/** Répartit `total` questions entre des familles selon leurs poids : la part
 *  de chacune est proportionnelle à son poids, les restes allant aux plus
 *  grosses fractions. Le résultat somme toujours à `total`. */
export function repartir(total: number, poids: number[]): number[] {
  const somme = poids.reduce((a, b) => a + b, 0);
  if (somme <= 0 || total <= 0) return poids.map(() => 0);
  const exactes = poids.map((poidsFamille) => (poidsFamille * total) / somme);
  const parts = exactes.map(Math.floor);
  let reste = total - parts.reduce((a, b) => a + b, 0);
  const ordre = exactes
    .map((exacte, rang) => ({ rang, fraction: exacte - Math.floor(exacte) }))
    .sort((a, b) => b.fraction - a.fraction || a.rang - b.rang);
  for (const { rang } of ordre) {
    if (reste <= 0) break;
    if (poids[rang] > 0) {
      parts[rang] += 1;
      reste -= 1;
    }
  }
  return parts;
}

/**
 * Fabrique jusqu'à `n` questions distinctes à partir d'une liste de
 * candidats. `vues` retient les énoncés déjà posés dans la séance : un même
 * énoncé n'y revient pas. `construire` peut refuser un candidat (en rendant
 * `null`) quand il ne se prête pas à la question.
 */
export function fabriquerDistinctes<C>(
  rng: Rng,
  candidats: readonly C[],
  n: number,
  vues: Set<string>,
  construire: (rng: Rng, candidat: C, rang: number) => Question | null
): Question[] {
  const questions: Question[] = [];
  if (candidats.length === 0 || n <= 0) return questions;
  // Une marge : certains candidats seront refusés, d'autres redonneront un
  // énoncé déjà posé.
  const ordre = echantillon(rng, candidats, Math.min(candidats.length, n * 4 + 8));
  for (const candidat of ordre) {
    if (questions.length >= n) break;
    const question = construire(rng, candidat, questions.length);
    if (!question) continue;
    const cle = signature(question);
    if (vues.has(cle)) continue;
    vues.add(cle);
    questions.push(question);
  }
  return questions;
}

/** Une famille de questions : de quel poids elle pèse dans une séance, et
 *  comment elle en fabrique. */
export interface Famille {
  nom: string;
  poids: number;
  fabriquer: (rng: Rng, n: number, vues: Set<string>) => Question[];
}

/**
 * Compose une séance de `count` questions à partir de familles : chacune en
 * fournit sa part, les questions sont mêlées. Si une famille n'a pas assez
 * de candidats distincts, les autres se partagent le manque ; si plus
 * aucune n'a de question nouvelle à offrir, la séance reprend des énoncés
 * déjà posés plutôt que de rester courte.
 */
export function composer(rng: Rng, count: number, familles: Famille[]): Question[] {
  const actives = familles.filter((famille) => famille.poids > 0);
  if (actives.length === 0 || count <= 0) return [];
  const vues = new Set<string>();
  const quotas = repartir(
    count,
    actives.map((famille) => famille.poids)
  );
  const questions: Question[] = [];
  actives.forEach((famille, rang) => {
    if (quotas[rang] > 0) questions.push(...famille.fabriquer(rng, quotas[rang], vues));
  });

  // Les familles à court de candidats : les autres comblent le manque.
  for (let passe = 0; passe < 3 && questions.length < count; passe++) {
    for (const famille of actives) {
      if (questions.length >= count) break;
      questions.push(...famille.fabriquer(rng, count - questions.length, vues));
    }
  }

  // Plus rien de nouveau : on reprend des énoncés, d'une famille à l'autre.
  let tentatives = 0;
  while (questions.length < count && tentatives < 20) {
    const famille = actives[tentatives % actives.length];
    questions.push(...famille.fabriquer(rng, count - questions.length, new Set<string>()));
    tentatives += 1;
  }
  return rngShuffle(rng, questions.slice(0, count));
}
