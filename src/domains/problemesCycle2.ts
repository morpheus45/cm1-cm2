import type { Level, Question, Trimester } from '../types';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';
import { diagrammeEnBarres } from './figuresMaths';
import { tablesAuProgramme } from './tables';
import { accorde, CONTENANTS, de, deuxPrenoms, fabriquer, fauxNombres, il, majuscule, OBJETS, pronom, que, type Brique, type Prenom } from './mathsCommun';
import { ARTICLES_A_PRIX, donnees, forme, heure, INSTRUCTION, INSTRUCTION_DONNEES, nombresEn, plafond, THEMES, type ArticleAPrix } from './problemesCommun';

/**
 * Les problèmes du CE1 et du CE2 (programme de mathématiques du cycle 2, 2025).
 *
 * Progression, cumulative :
 * - CE1, 1er trimestre : un pas, additifs et soustractifs (ajout, retrait,
 *   réunion, comparaison, écart), nombres jusqu'à 100 puis 1 000 ; prix en
 *   euros entiers, longueurs, jours et semaines ; lire un tableau et un
 *   pictogramme ;
 * - CE1, 2e : un pas multiplicatif (groupements égaux, rangées), durées en
 *   heures et demi-heures, masses et contenances, premiers diagrammes en barres ;
 * - CE1, 3e : deux étapes simples, partage et groupement sans le signe ÷,
 *   rendre la monnaie ;
 * - CE2, 1er : additifs à une et deux étapes jusqu'à 10 000, prix à virgule,
 *   durées de moins d'une heure, mètres et centimètres, tables de 6 et 7 ;
 * - CE2, 2e : « trois fois plus », division en ligne, fraction d'une
 *   quantité, multiplication posée, masses et contenances avec conversions,
 *   diagrammes et tableaux à lire et à compléter ;
 * - CE2, 3e : partage et groupement avec reste, trois étapes, rendu de
 *   monnaie avec décimaux, durées en heures et minutes, reste après une
 *   fraction.
 *
 * Aucune proportionnalité nommée comme telle, aucun pourcentage, aucune
 * division posée : hors programme du cycle 2.
 */

// --- La taille des nombres et les tables ------------------------------------------------------------------

/** Jusqu'où vont les nombres des problèmes additifs : 100 puis 1 000 au CE1, 1 000 et 10 000 au CE2. */
function borne(rng: Rng, stage: Stage): number {
  if (stage >= -2) return rng() < 0.5 ? 999 : 9999;
  // Au 1er trimestre du CE1, les nombres restent sous 100 ; 1 000 vient ensuite.
  const partDesPetits = stage === -5 ? 1 : stage === -4 ? 0.7 : 0.5;
  return rng() < partDesPetits ? 100 : 1000;
}

/** Les tables que l'on connaît à cette étape : celles de la séance de tables (tablesAuProgramme). */
function tablesDe(stage: Stage): number[] {
  return stage <= -3 ? tablesAuProgramme('CE1', (stage + 6) as Trimester) : tablesAuProgramme('CE2', (stage + 3) as Trimester);
}

/** Deux nombres dont la somme tient dans la borne. */
function termesDeLaSomme(rng: Rng, borneMax: number): [number, number] {
  const a = rngInt(rng, Math.ceil(borneMax * 0.1), Math.floor(borneMax * 0.7));
  return [a, rngInt(rng, Math.ceil(borneMax * 0.1), borneMax - a)];
}

/** Un nombre et ce qu'on lui retire : le reste garde de l'épaisseur. */
function termesDeLaDifference(rng: Rng, borneMax: number): [number, number] {
  const a = rngInt(rng, Math.ceil(borneMax * 0.4), borneMax);
  return [a, rngInt(rng, Math.ceil(borneMax * 0.1), Math.floor(a * 0.8))];
}

const fauxEntiers = (reponse: number, candidats: number[], stage: Stage) =>
  fauxNombres(reponse, candidats, { min: 1, max: plafond(stage) });

/** Les erreurs des problèmes additifs : l'opération contraire, un seul des deux nombres, une dizaine d'écart. */
function erreursAdditives(a: number, b: number, reponse: number, plus: boolean): number[] {
  const [petit, grand] = [Math.min(a, b), Math.max(a, b)];
  return [plus ? grand - petit : a + b, a, b, reponse + 10, reponse - 10, reponse + 1, reponse - 1, reponse + 100, reponse - 100];
}

// --- Les contextes : prix, longueurs, lieux --------------------------------------------------------------------

/** Un lieu où l'on compte deux sortes de choses : `max` est le plus grand total qu'on y trouve vraiment. */
export interface Paire {
  lieu: string;
  a: string;
  b: string;
  total: string;
  max: number;
}

export const PAIRES: Paire[] = [
  { lieu: 'Dans la cour', a: 'filles', b: 'garçons', total: "d'enfants", max: 200 },
  { lieu: 'Dans le pré', a: 'vaches', b: 'moutons', total: "d'animaux", max: 200 },
  { lieu: 'Dans le panier', a: 'pommes', b: 'poires', total: 'de fruits', max: 60 },
  { lieu: 'Dans le jardin', a: 'roses', b: 'tulipes', total: 'de fleurs', max: 200 },
  { lieu: 'Dans le bus', a: 'adultes', b: 'enfants', total: 'de personnes', max: 80 },
  { lieu: 'Dans la classe', a: 'filles', b: 'garçons', total: "d'élèves", max: 30 },
  { lieu: 'Au zoo', a: 'singes', b: 'zèbres', total: "d'animaux", max: 100 },
  { lieu: 'Au marché', a: 'tomates', b: 'carottes', total: 'de légumes', max: 10000 },
  { lieu: 'Au parc', a: 'canards', b: 'cygnes', total: "d'oiseaux", max: 100 },
  { lieu: 'Dans la ferme', a: 'poules', b: 'lapins', total: "d'animaux", max: 300 },
];

/** Des lieux où l'on compte par milliers, pour les nombres de quatre chiffres du CE2. */
export const PAIRES_GRANDES: Paire[] = [
  { lieu: 'Dans le stade', a: 'adultes', b: 'enfants', total: 'de spectateurs', max: 10000 },
  { lieu: 'Dans la bibliothèque', a: 'romans', b: 'albums', total: 'de livres', max: 10000 },
  { lieu: 'Dans le verger', a: 'pommiers', b: 'poiriers', total: "d'arbres", max: 10000 },
  { lieu: 'Dans la forêt', a: 'chênes', b: 'sapins', total: "d'arbres", max: 10000 },
  { lieu: 'À la librairie', a: 'romans', b: 'bandes dessinées', total: 'de livres', max: 10000 },
  { lieu: 'Dans le musée', a: 'tableaux', b: 'sculptures', total: "d'œuvres", max: 10000 },
];

/** Les lieux où l'on peut compter jusqu'à `limite` : quelques dizaines dans un panier, des milliers dans un stade. */
const lieuxJusqua = (limite: number): Paire[] => (limite > 1000 ? [...PAIRES_GRANDES, ...PAIRES.filter(({ max }) => max > 1000)] : PAIRES);

const RUBANS = ['un ruban', 'une ficelle', 'une corde', 'une planche', 'un fil', 'une baguette', 'une barre', 'un tuyau'];
const autre = (objet: string) => objet.replace(/^(un|une) /, (_, article: string) => `${article} autre `);

/** Là où des gens entrent et sortent : `min` et `max` sont la plus petite et la plus grande affluence qu'on y voit vraiment. */
const SEQUENCES = [
  { lieu: 'Dans le train', objet: 'voyageurs', sortent: 'descendent', entrent: 'montent', min: 20, max: 90 },
  { lieu: 'Dans le bus', objet: 'passagers', sortent: 'descendent', entrent: 'montent', min: 20, max: 90 },
  { lieu: 'Dans le camping', objet: 'campeurs', sortent: 'partent', entrent: 'arrivent', min: 20, max: 3000 },
  { lieu: 'Dans le cinéma', objet: 'spectateurs', sortent: 'sortent', entrent: 'entrent', min: 30, max: 300 },
  { lieu: 'Dans le stade', objet: 'supporters', sortent: 'partent', entrent: 'arrivent', min: 300, max: 3000 },
  { lieu: 'Dans la salle', objet: 'personnes', sortent: 'partent', entrent: 'arrivent', min: 20, max: 500 },
  { lieu: 'Dans le musée', objet: 'visiteurs', sortent: 'sortent', entrent: 'entrent', min: 20, max: 3000 },
  { lieu: 'Dans la gare', objet: 'voyageurs', sortent: 'partent', entrent: 'arrivent', min: 20, max: 3000 },
  { lieu: 'Dans le parc', objet: 'visiteurs', sortent: 'partent', entrent: 'arrivent', min: 20, max: 3000 },
];

const ACTIVITES = ['Le film', 'Le spectacle', 'Le match', 'Le concert', 'Le cours', 'Le dessin animé', 'Le trajet', 'Le goûter'];

const RANGEES = [
  { lieu: 'Dans le jardin', objets: 'salades' },
  { lieu: 'Dans la salle', objets: 'chaises' },
  { lieu: 'Sur la plaque', objets: 'gâteaux' },
  { lieu: 'Dans la boîte', objets: 'chocolats' },
  { lieu: 'Sur le mur', objets: 'briques' },
  { lieu: 'Dans le champ', objets: 'pommiers' },
  { lieu: 'Dans le parking', objets: 'voitures' },
  { lieu: 'Sur la grille', objets: 'carrés' },
];

// --- Les problèmes à un pas : additifs et soustractifs -----------------------------------------------------------------

/** Qui possède des milliers de choses : un commerce, une école — pas un enfant. */
interface Stock extends Prenom {
  objets: string[];
  /** Ce qu'il fait quand il en reçoit, quand il en donne. */
  entre: string;
  sort: string;
}

const STOCKS: Stock[] = [
  { nom: 'la librairie', fille: true, objets: ['livres', 'cahiers', 'stylos'], entre: 'reçoit', sort: 'vend' },
  { nom: 'la bibliothèque', fille: true, objets: ['livres'], entre: 'reçoit', sort: 'prête' },
  { nom: "l'école", fille: true, objets: ['cahiers', 'crayons', 'feutres', 'livres'], entre: 'reçoit', sort: 'utilise' },
  { nom: 'le collège', fille: false, objets: ['cahiers', 'crayons', 'livres'], entre: 'reçoit', sort: 'utilise' },
  { nom: 'la papeterie', fille: true, objets: ['cahiers', 'stylos', 'crayons', 'feutres', 'gommes'], entre: 'reçoit', sort: 'vend' },
  { nom: 'le magasin de sport', fille: false, objets: ['ballons', 'casquettes'], entre: 'reçoit', sort: 'vend' },
  { nom: 'la boulangerie', fille: true, objets: ['croissants', 'gâteaux', 'biscuits'], entre: 'prépare', sort: 'vend' },
  { nom: 'le fermier', fille: false, objets: ['œufs', 'pommes', 'poires'], entre: 'ramasse', sort: 'vend' },
];

/** Un commerce ou une école, et une chose qu'il compte par milliers. */
function unStock(rng: Rng): { stock: Stock; objet: string } {
  const stock = rngPick(rng, STOCKS);
  return { stock, objet: rngPick(rng, stock.objets) };
}

const ajout = forme('ajout', -5, (rng, stage) => {
  const limite = borne(rng, stage);
  const [a, b] = termesDeLaSomme(rng, limite);
  const resultat = {
    instruction: INSTRUCTION,
    correct: String(a + b),
    wrong: nombresEn(fauxEntiers(a + b, erreursAdditives(a, b, a + b, true), stage)),
    explanation: `On ajoute : ${a} + ${b} = ${a + b}.`,
  };
  if (limite > 1000) {
    const { stock, objet } = unStock(rng);
    return { ...resultat, prompt: `${majuscule(stock.nom)} a ${a} ${objet}. ${il(stock)} en ${stock.entre} ${b}. Combien ${de(objet)} a-t-${pronom(stock)} maintenant ?` };
  }
  const [moi] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  return { ...resultat, prompt: `${moi.nom} a ${a} ${objet}. ${il(moi)} en gagne ${b}. Combien ${de(objet)} a-t-${pronom(moi)} maintenant ?` };
});

const retrait = forme('retrait', -5, (rng, stage) => {
  const limite = borne(rng, stage);
  const [a, b] = termesDeLaDifference(rng, limite);
  const resultat = {
    instruction: INSTRUCTION,
    correct: String(a - b),
    wrong: nombresEn(fauxEntiers(a - b, erreursAdditives(a, b, a - b, false), stage)),
    explanation: `On retranche : ${a} − ${b} = ${a - b}.`,
  };
  if (limite > 1000) {
    const { stock, objet } = unStock(rng);
    return { ...resultat, prompt: `${majuscule(stock.nom)} a ${a} ${objet}. ${il(stock)} en ${stock.sort} ${b}. Combien lui en reste-t-il ?` };
  }
  const [moi] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  return { ...resultat, prompt: `${moi.nom} a ${a} ${objet}. ${il(moi)} en perd ${b}. Combien lui en reste-t-il ?` };
});

const reunion = forme('reunion', -5, (rng, stage) => {
  const limite = borne(rng, stage);
  const paire = rngPick(rng, lieuxJusqua(limite));
  const [a, b] = termesDeLaSomme(rng, Math.min(limite, paire.max));
  return {
    instruction: INSTRUCTION,
    prompt: `${paire.lieu}, il y a ${a} ${paire.a} et ${b} ${paire.b}. Combien y a-t-il ${paire.total} en tout ?`,
    correct: String(a + b),
    wrong: nombresEn(fauxEntiers(a + b, erreursAdditives(a, b, a + b, true), stage)),
    explanation: `On réunit : ${a} + ${b} = ${a + b}.`,
  };
});

const complement = forme('complement', -5, (rng, stage) => {
  const limite = borne(rng, stage);
  const paire = rngPick(rng, lieuxJusqua(limite));
  const [total, partie] = termesDeLaDifference(rng, Math.min(limite, paire.max));
  return {
    instruction: INSTRUCTION,
    prompt: `${paire.lieu}, il y a ${total} ${paire.total.replace(/^d'|^de /, '')}. ${partie} sont des ${paire.a}. Les autres sont des ${paire.b}. Combien y a-t-il ${de(paire.b)} ?`,
    correct: String(total - partie),
    wrong: nombresEn(fauxEntiers(total - partie, erreursAdditives(total, partie, total - partie, false), stage)),
    explanation: `On cherche ce qui manque : ${total} − ${partie} = ${total - partie}.`,
  };
});

// Entre deux enfants, jamais plus de mille choses : au-delà, c'est l'affaire d'un commerce (voir `ajout`).
const ecart = forme('ecart', -5, (rng, stage) => {
  const [premier, second] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  const [a, b] = termesDeLaDifference(rng, Math.min(borne(rng, stage), 999));
  return {
    instruction: INSTRUCTION,
    prompt: `${premier.nom} a ${a} ${objet}. ${second.nom} a ${b} ${objet}. Combien ${de(objet)} ${premier.nom} a-t-${pronom(premier)} de plus ${que(second.nom)} ?`,
    correct: String(a - b),
    wrong: nombresEn(fauxEntiers(a - b, erreursAdditives(a, b, a - b, false), stage)),
    explanation: `On compare : ${a} − ${b} = ${a - b}.`,
  };
});

const comparaison = forme('comparaison', -5, (rng, stage) => {
  const [premier, second] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  const plus = rng() < 0.5;
  const limite = Math.min(borne(rng, stage), 999);
  const [a, k] = plus ? termesDeLaSomme(rng, limite) : termesDeLaDifference(rng, limite);
  const reponse = plus ? a + k : a - k;
  return {
    instruction: INSTRUCTION,
    prompt: `${premier.nom} a ${a} ${objet}. ${second.nom} en a ${k} de ${plus ? 'plus' : 'moins'}. Combien en a ${second.nom} ?`,
    correct: String(reponse),
    // L'opération contraire : « de plus » lu comme « de moins ».
    wrong: nombresEn(fauxEntiers(reponse, [plus ? a - k : a + k, a, k, reponse + 10, reponse - 10, reponse + 1, reponse - 1], stage)),
    explanation: `${k} de ${plus ? 'plus' : 'moins'} : ${a} ${plus ? '+' : '−'} ${k} = ${reponse}.`,
  };
});

/** Deux prix qui ont l'air vrais, de deux articles différents : leur somme tient sous `limite` euros. */
function deuxPrix(rng: Rng, limite: number): { premier: ArticleAPrix; second: ArticleAPrix; a: number; b: number } {
  const [premier, second] = rngShuffle(rng, ARTICLES_A_PRIX.filter(({ min }) => min * 2 <= limite)).slice(0, 2);
  const a = rngInt(rng, premier.min, Math.min(premier.max, limite - second.min));
  let b = rngInt(rng, second.min, Math.min(second.max, limite - a));
  // Deux prix égaux ne feraient pas une différence : on retire le second.
  for (let essai = 0; essai < 8 && b === a; essai++) b = rngInt(rng, second.min, Math.min(second.max, limite - a));
  return { premier, second, a, b };
}

const argent = forme('argent', -5, (rng, stage) => {
  const { premier, second, a, b } = deuxPrix(rng, stage >= -2 ? 100 : 40);
  const debut = `${majuscule(premier.un)} coûte ${a} €. ${majuscule(second.un)} coûte ${b} €.`;
  if (rng() < 0.6 || a === b) {
    return {
      instruction: INSTRUCTION,
      prompt: `${debut} Combien paie-t-on pour les deux ?`,
      correct: `${a + b} €`,
      wrong: nombresEn(fauxEntiers(a + b, erreursAdditives(a, b, a + b, true), stage), '€'),
      explanation: `On ajoute les prix : ${a} + ${b} = ${a + b}.`,
    };
  }
  const [grand, petit] = [Math.max(a, b), Math.min(a, b)];
  return {
    instruction: INSTRUCTION,
    prompt: `${debut} Quelle est la différence de prix ?`,
    correct: `${grand - petit} €`,
    wrong: nombresEn(fauxEntiers(grand - petit, erreursAdditives(grand, petit, grand - petit, false), stage), '€'),
    explanation: `On compare les prix : ${grand} − ${petit} = ${grand - petit}.`,
  };
});

const longueurs = forme('longueurs', -5, (rng, stage) => {
  const objet = rngPick(rng, RUBANS);
  const limite = stage >= -2 ? 900 : stage === -5 ? 100 : 300;
  const mise = rng() < 0.5;
  if (mise) {
    const [a, b] = termesDeLaSomme(rng, limite);
    return {
      instruction: INSTRUCTION,
      prompt: `${majuscule(objet)} mesure ${a} cm. ${majuscule(autre(objet))} mesure ${b} cm. On les met bout à bout. Quelle est la longueur totale ?`,
      correct: `${a + b} cm`,
      wrong: nombresEn(fauxEntiers(a + b, erreursAdditives(a, b, a + b, true), stage), 'cm'),
      explanation: `Bout à bout : ${a} + ${b} = ${a + b}.`,
    };
  }
  const [a, b] = termesDeLaDifference(rng, limite);
  return {
    instruction: INSTRUCTION,
    prompt: `${majuscule(objet)} mesure ${a} cm. ${majuscule(autre(objet))} mesure ${b} cm. Quelle est la différence de longueur ?`,
    correct: `${a - b} cm`,
    wrong: nombresEn(fauxEntiers(a - b, erreursAdditives(a, b, a - b, false), stage), 'cm'),
    explanation: `On compare : ${a} − ${b} = ${a - b}.`,
  };
});

const jours = forme('jours', -5, (rng) => {
  const semaines = rngInt(rng, 2, 3);
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    return {
      instruction: INSTRUCTION,
      prompt: `Une semaine compte 7 jours. Combien de jours y a-t-il dans ${semaines} semaines ?`,
      correct: String(7 * semaines),
      wrong: nombresEn(fauxNombres(7 * semaines, [7 + semaines, 7 * (semaines + 1), 7 * (semaines - 1), 7 * semaines + 1, 7 * semaines - 1, 10 * semaines], { min: 2, max: 40 })),
      explanation: Array.from({ length: semaines }, () => '7').join(' + ') + ` = ${7 * semaines}.`,
    };
  }
  if (variante === 1) {
    const enPlus = rngInt(rng, 1, 5);
    const total = 7 * semaines + enPlus;
    return {
      instruction: INSTRUCTION,
      prompt: `Une semaine compte 7 jours. Combien de jours y a-t-il dans ${semaines} semaines et ${enPlus} ${accorde(enPlus, 'jour')} ?`,
      correct: String(total),
      // Les jours en plus oubliés, ou comptés comme une semaine de plus.
      wrong: nombresEn(fauxNombres(total, [7 * semaines, 7 * (semaines + 1), semaines + enPlus, 7 + enPlus, total + 1, total - 1, total + 7], { min: 2, max: 40 })),
      explanation: `${7 * semaines} + ${enPlus} = ${total}.`,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `Une semaine compte 7 jours. Combien de semaines y a-t-il dans ${7 * semaines} jours ?`,
    correct: String(semaines),
    wrong: nombresEn(fauxNombres(semaines, [7, 7 * semaines - 7, semaines + 1, semaines - 1, semaines + 2, 7 * semaines], { min: 1, max: 40 })),
    explanation: `${Array.from({ length: semaines }, () => '7').join(' + ')} = ${7 * semaines}, donc ${semaines} semaines.`,
  };
});

// --- La multiplication : groupements, rangées ------------------------------------------------------------------------------

const groupements = forme('groupements', -4, (rng, stage) => {
  const [moi] = deuxPrenoms(rng);
  const contenant = rngPick(rng, CONTENANTS);
  const [k, n] = [rngPick(rng, tablesDe(stage)), rngInt(rng, 2, 10)];
  return {
    instruction: INSTRUCTION,
    prompt: `${majuscule(contenant.un)} contient ${k} ${contenant.objets}. ${moi.nom} a ${n} ${contenant.pluriel}. Combien a-t-${pronom(moi)} ${de(contenant.objets)} en tout ?`,
    correct: String(n * k),
    // L'addition à la place de la multiplication, un groupe de trop ou de moins.
    wrong: nombresEn(fauxEntiers(n * k, [n + k, n * k + k, n * k - k, n * k + n, n * k - n, n * (k + 1), (n + 1) * k], stage)),
    explanation: `${n} groupes de ${k} : ${n} × ${k} = ${n * k}.`,
  };
});

const rangees = forme('rangees', -4, (rng, stage) => {
  const { lieu, objets } = rngPick(rng, RANGEES);
  const [colonnes, lignes] = [rngPick(rng, tablesDe(stage)), rngInt(rng, 2, 10)];
  return {
    instruction: INSTRUCTION,
    prompt: `${lieu}, il y a ${lignes} rangées de ${colonnes} ${objets}. Combien y a-t-il ${de(objets)} ?`,
    correct: String(lignes * colonnes),
    wrong: nombresEn(fauxEntiers(lignes * colonnes, [lignes + colonnes, lignes * colonnes + colonnes, lignes * colonnes - colonnes, lignes * colonnes + lignes, lignes * colonnes - lignes, (lignes + 1) * colonnes], stage)),
    explanation: `${lignes} rangées de ${colonnes} : ${lignes} × ${colonnes} = ${lignes * colonnes}.`,
  };
});

const chacun = forme('chacun', -4, (rng, stage) => {
  const [moi] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  const [k, n] = [rngPick(rng, tablesDe(stage)), rngInt(rng, 2, 10)];
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} a ${n} amis. ${il(moi)} donne ${k} ${objet} à chacun. Combien ${de(objet)} donne-t-${pronom(moi)} ?`,
    correct: String(n * k),
    wrong: nombresEn(fauxEntiers(n * k, [n + k, n * k + k, n * k - k, n * k + n, n * k - n, n * (k + 1)], stage)),
    explanation: `${n} fois ${k} : ${n} × ${k} = ${n * k}.`,
  };
});

// --- Les durées, les masses, les contenances ---------------------------------------------------------------------------------

const duree = forme('duree', -4, (rng, stage) => {
  const activite = rngPick(rng, ACTIVITES);
  const debutH = rngInt(rng, 8, 17);
  // Au 2e trimestre, des heures et des demi-heures ; le quart d'heure vient au 3e.
  const debutM = rngPick(rng, stage >= -3 ? [0, 15, 30, 45] : [0, 30]);
  const [dureeTexte, dureeMinutes] = rngPick(
    rng,
    (stage >= -3
      ? [['1 h', 60], ['2 h', 120], ['3 h', 180], ['une demi-heure', 30], ['un quart d\'heure', 15], ['1 h 30', 90]]
      : [['1 h', 60], ['2 h', 120], ['3 h', 180], ['une demi-heure', 30]]) as [string, number][]
  );
  const fin = debutH * 60 + debutM + dureeMinutes;
  const [finH, finM] = [Math.floor(fin / 60), fin % 60];
  const correct = heure(finH, finM);
  const candidats = [
    heure(finH + 1, finM),
    heure(finH - 1, finM),
    heure(finH, finM === 0 ? 30 : 0),
    heure(debutH + Math.round(dureeMinutes / 60), debutM),
    heure(finH, (finM + 30) % 60),
    heure(finH + 1, (finM + 30) % 60),
  ].filter((texte) => texte !== correct);
  return {
    instruction: INSTRUCTION,
    prompt: `${activite} commence à ${heure(debutH, debutM)}. Il dure ${dureeTexte}. À quelle heure finit-il ?`,
    correct,
    wrong: candidats,
    explanation: `${heure(debutH, debutM)} + ${dureeTexte} = ${correct}.`,
  };
});

const ALIMENTS_PESES = [
  { un: 'un gâteau', pluriel: 'gâteaux' },
  { un: 'un pain', pluriel: 'pains' },
  { un: 'un melon', pluriel: 'melons' },
  { un: 'un fromage', pluriel: 'fromages' },
  { un: 'un paquet de riz', pluriel: 'paquets de riz' },
  { un: 'un pot de miel', pluriel: 'pots de miel' },
];

/** [masse d'un objet en grammes, nombre d'objets] : le total ne dépasse pas 1 000 g. */
const COMBINAISONS_DE_MASSES: [number, number][] = [
  [50, 2], [50, 3], [50, 5], [100, 2], [100, 3], [100, 5], [200, 2], [200, 3], [200, 5], [250, 2], [250, 4], [500, 2],
];

const masses = forme('masses', -4, (rng, stage) => {
  const sorte = rngInt(rng, 0, 2);
  if (sorte === 0) {
    const [a, b] = termesDeLaSomme(rng, stage >= -2 ? 60 : 30);
    return {
      instruction: INSTRUCTION,
      prompt: `Un sac de pommes de terre pèse ${a} kg. Un sac de carottes pèse ${b} kg. Combien pèsent les deux sacs ?`,
      correct: `${a + b} kg`,
      wrong: nombresEn(fauxEntiers(a + b, erreursAdditives(a, b, a + b, true), stage), 'kg'),
      explanation: `${a} + ${b} = ${a + b}.`,
    };
  }
  if (sorte === 1) {
    const aliment = rngPick(rng, ALIMENTS_PESES);
    // Des masses dont le total reste sous 1 kg : 50 g, 100 g, 200 g, 250 g, 500 g.
    const [poids, n] = rngPick(rng, COMBINAISONS_DE_MASSES.filter(([, fois]) => tablesDe(stage).includes(fois)));
    const total = poids * n;
    return {
      instruction: INSTRUCTION,
      prompt: `${majuscule(aliment.un)} pèse ${poids} g. Combien pèsent ${n} ${aliment.pluriel} ?`,
      correct: `${total} g`,
      wrong: nombresEn(fauxNombres(total, [poids + n, total + poids, total - poids, total + 100, total - 100, total * 2], { min: 1, max: 1000 }), 'g'),
      explanation: `${n} fois ${poids} g : ${total} g.`,
    };
  }
  const [grand, petit] = termesDeLaDifference(rng, 60);
  const [premier, second] = deuxPrenoms(rng);
  return {
    instruction: INSTRUCTION,
    prompt: `${premier.nom} pèse ${grand} kg. ${second.nom} pèse ${petit} kg. Combien de kilogrammes ${premier.nom} pèse-t-${pronom(premier)} de plus ?`,
    correct: `${grand - petit} kg`,
    wrong: nombresEn(fauxEntiers(grand - petit, erreursAdditives(grand, petit, grand - petit, false), stage), 'kg'),
    explanation: `${grand} − ${petit} = ${grand - petit}.`,
  };
});

const contenances = forme('contenances', -4, (rng, stage) => {
  const plus = rng() < 0.5;
  if (plus) {
    const [a, b] = termesDeLaSomme(rng, 40);
    return {
      instruction: INSTRUCTION,
      prompt: `Un bidon contient ${a} L d'eau. On y verse ${b} L. Combien de litres y a-t-il ?`,
      correct: `${a + b} L`,
      wrong: nombresEn(fauxEntiers(a + b, erreursAdditives(a, b, a + b, true), stage), 'L'),
      explanation: `${a} + ${b} = ${a + b}.`,
    };
  }
  const [a, b] = termesDeLaDifference(rng, 40);
  return {
    instruction: INSTRUCTION,
    prompt: `Il y a ${a} L d'eau dans un réservoir. On en utilise ${b} L. Combien de litres reste-t-il ?`,
    correct: `${a - b} L`,
    wrong: nombresEn(fauxEntiers(a - b, erreursAdditives(a, b, a - b, false), stage), 'L'),
    explanation: `${a} − ${b} = ${a - b}.`,
  };
});

// --- Deux étapes, partage, monnaie ------------------------------------------------------------------------------------------------

const BILLETS = [10, 20, 50];

const ARTICLES_PLURIELS = [
  { nom: 'gommes', chacun: 'chacune' },
  { nom: 'règles', chacun: 'chacune' },
  { nom: 'stylos', chacun: 'chacun' },
  { nom: 'cahiers', chacun: 'chacun' },
  { nom: 'ballons', chacun: 'chacun' },
  { nom: 'glaces', chacun: 'chacune' },
  { nom: 'jeux', chacun: 'chacun' },
];

const deuxEtapes = forme('deux-etapes', -3, (rng, stage) => {
  const [moi] = deuxPrenoms(rng);
  const sorte = rngInt(rng, 0, 2);
  if (sorte === 0) {
    const contenant = rngPick(rng, CONTENANTS);
    const [k, n, b] = [rngPick(rng, tablesDe(stage)), rngInt(rng, 2, 6), rngInt(rng, 2, 20)];
    const reponse = n * k + b;
    return {
      instruction: INSTRUCTION,
      prompt: `${moi.nom} a ${n} ${contenant.pluriel} de ${k} ${contenant.objets}. ${il(moi)} reçoit ${b} ${contenant.objets} de plus. Combien en a-t-${pronom(moi)} ?`,
      correct: String(reponse),
      // Seule la première étape faite, ou le groupe oublié.
      wrong: nombresEn(fauxEntiers(reponse, [n * k, k + b, n + k + b, n * (k + b), n * k - b, reponse + k], stage)),
      explanation: `${n} × ${k} = ${n * k}, puis ${n * k} + ${b} = ${reponse}.`,
    };
  }
  if (sorte === 1) {
    const { nom, chacun: ch } = rngPick(rng, ARTICLES_PLURIELS);
    const prix = rngPick(rng, [2, 3, 4, 5]);
    const n = rngInt(rng, 2, 5);
    // Ni un billet qui ne paie pas, ni un billet démesuré : pas 50 € pour 4 €.
    const billet = rngPick(rng, BILLETS.filter((candidat) => candidat > n * prix && candidat <= Math.max(10, 3 * n * prix)));
    const reponse = billet - n * prix;
    return {
      instruction: INSTRUCTION,
      prompt: `${moi.nom} achète ${n} ${nom} à ${prix} € ${ch}. ${il(moi)} paie avec un billet de ${billet} €. Combien lui rend-on ?`,
      correct: `${reponse} €`,
      wrong: nombresEn(fauxEntiers(reponse, [n * prix, billet - prix, billet + n * prix, billet - n, reponse + prix, reponse - prix, reponse + 1], stage), '€'),
      explanation: `${n} × ${prix} = ${n * prix}, puis ${billet} − ${n * prix} = ${reponse}.`,
    };
  }
  const sequence = rngPick(rng, SEQUENCES.filter(({ min, max }) => min <= 30 && max >= 90));
  const a = rngInt(rng, 30, 90);
  const [b, c] = [rngInt(rng, 5, 20), rngInt(rng, 5, 20)];
  const reponse = a - b + c;
  return {
    instruction: INSTRUCTION,
    prompt: `${sequence.lieu}, il y a ${a} ${sequence.objet}. ${b} ${sequence.sortent}. ${c} ${sequence.entrent}. Combien y a-t-il ${de(sequence.objet)} ?`,
    correct: String(reponse),
    wrong: nombresEn(fauxEntiers(reponse, [a - b, a + c, a - b - c, a + b + c, a - c, reponse + 10, reponse - 10], stage)),
    explanation: `${a} − ${b} = ${a - b}, puis ${a - b} + ${c} = ${reponse}.`,
  };
});

const partage = forme('partage', -3, (rng, stage) => {
  const [n, k] = [rngPick(rng, tablesDe(stage)), rngInt(rng, 2, 10)];
  const total = n * k;
  if (rng() < 0.5) {
    const objet = rngPick(rng, OBJETS);
    return {
      instruction: INSTRUCTION,
      prompt: `On partage ${total} ${objet} entre ${n} enfants. Chaque enfant reçoit autant. Combien ${de(objet)} reçoit chaque enfant ?`,
      correct: String(k),
      // La multiplication ou la soustraction au lieu du partage, un enfant de plus ou de moins.
      wrong: nombresEn(fauxEntiers(k, [total - n, total + n, k + 1, k - 1, n, total, Math.floor(total / (n + 1)), k + 2], stage)),
      explanation: `${n} × ${k} = ${total}, donc ${total} partagés en ${n}, c'est ${k}.`,
    };
  }
  const contenant = rngPick(rng, CONTENANTS);
  return {
    instruction: INSTRUCTION,
    prompt: `On range ${total} ${contenant.objets} dans des ${contenant.pluriel} de ${k}. Combien faut-il ${de(contenant.pluriel)} ?`,
    correct: String(n),
    wrong: nombresEn(fauxEntiers(n, [total - k, total + k, n + 1, n - 1, k, total, n + 2], stage)),
    explanation: `${n} × ${k} = ${total}, donc il faut ${n} ${contenant.pluriel}.`,
  };
});

const rendu = forme('rendu', -3, (rng, stage) => {
  const [moi] = deuxPrenoms(rng);
  const article = rngPick(rng, ARTICLES_A_PRIX);
  // Un billet qui convient à l'article : ni une gomme payée avec 50 €, ni un prix plus gros que le billet.
  const basDuPrix = (billet: number) => Math.max(article.min, Math.ceil(billet * 0.2));
  const hautDuPrix = (billet: number) => Math.min(article.max, Math.floor(billet * 0.9));
  const billet = rngPick(rng, BILLETS.filter((candidat) => basDuPrix(candidat) <= hautDuPrix(candidat)));
  const prix = rngInt(rng, basDuPrix(billet), hautDuPrix(billet));
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} achète ${article.un} à ${prix} €. ${il(moi)} paie avec un billet de ${billet} €. Combien la vendeuse lui rend-elle ?`,
    correct: `${billet - prix} €`,
    wrong: nombresEn(fauxEntiers(billet - prix, [billet + prix, prix, billet, billet - prix + 1, billet - prix - 1, billet - prix + 10, billet - prix - 10], stage), '€'),
    explanation: `On cherche ce qui manque : ${billet} − ${prix} = ${billet - prix}.`,
  };
});

// --- Le CE2 : plus de chiffres, des prix à virgule, des durées, la division ---------------------------------------------------------------------

const deuxEtapesCE2 = forme('deux-etapes-ce2', -2, (rng, stage) => {
  const sequence = rngPick(rng, SEQUENCES.filter(({ max }) => max >= 2500));
  const a = rngInt(rng, 300, 2500);
  const [b, c] = [rngInt(rng, 40, 250), rngInt(rng, 40, 250)];
  const reponse = a - b + c;
  const sortentPuisEntrent = rng() < 0.5;
  const phrases = sortentPuisEntrent ? `${b} ${sequence.sortent}. ${c} ${sequence.entrent}.` : `${c} ${sequence.entrent}. ${b} ${sequence.sortent}.`;
  return {
    instruction: INSTRUCTION,
    prompt: `${sequence.lieu}, il y a ${a} ${sequence.objet}. ${phrases} Combien y a-t-il ${de(sequence.objet)} ?`,
    correct: String(reponse),
    wrong: nombresEn(fauxEntiers(reponse, [a - b, a + c, a - b - c, a + b + c, reponse + 10, reponse - 10, reponse + 100, reponse - 100], stage)),
    explanation: `${a} − ${b} = ${a - b}, puis ${a - b} + ${c} = ${reponse}.`,
  };
});

/** Un montant en centimes, écrit à la française : 350 → « 3,50 € ». */
const montant = (centimes: number) => (centimes % 100 === 0 ? `${centimes / 100} €` : `${Math.floor(centimes / 100)},${String(centimes % 100).padStart(2, '0')} €`);

const CENTIMES_USUELS = [0, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];

const prixDecimaux = forme('prix-decimaux', -2, (rng, stage) => {
  const [premier, second] = rngShuffle(rng, ARTICLES_A_PRIX).slice(0, 2);
  // Des euros dans la fourchette de l'article, et des centimes d'étiquette.
  const tirer = (article: ArticleAPrix) => rngInt(rng, article.min, article.max - 1) * 100 + rngPick(rng, CENTIMES_USUELS.filter((c) => c > 0));
  const [a, b] = [tirer(premier), tirer(second)];
  // Les euros ajoutés sans la retenue des centimes, la virgule oubliée, un euro ou dix centimes d'écart.
  const sansRetenue = (x: number, y: number) => (Math.floor(x / 100) + Math.floor(y / 100)) * 100 + ((x % 100) + (y % 100)) % 100;
  if (rng() < 0.6) {
    const somme = a + b;
    return {
      instruction: INSTRUCTION,
      prompt: `${majuscule(premier.un)} coûte ${montant(a)}. ${majuscule(second.un)} coûte ${montant(b)}. Combien paie-t-on pour les deux ?`,
      correct: montant(somme),
      wrong: [sansRetenue(a, b), somme + 100, somme - 100, somme + 10, somme - 10, somme * 10]
        .filter((centimes) => centimes !== somme && centimes > 0)
        .map(montant),
      explanation: `${montant(a)} + ${montant(b)} = ${montant(somme)}.`,
    };
  }
  const [moi] = deuxPrenoms(rng);
  // Le plus petit billet qui paie l'article, avec au moins un euro de monnaie à rendre.
  const billet = [1000, 2000, 5000].find((candidat) => candidat >= a + 100)!;
  const reste = billet - a;
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} a ${montant(billet)}. ${il(moi)} achète ${premier.un} à ${montant(a)}. Combien lui reste-t-il ?`,
    correct: montant(reste),
    wrong: [billet + a, a, reste + 100, reste - 100, reste + 10, reste - 10, Math.floor(billet / 100) * 100 - Math.floor(a / 100) * 100 + (a % 100)]
      .filter((centimes) => centimes !== reste && centimes > 0)
      .map(montant),
    explanation: `${montant(billet)} − ${montant(a)} = ${montant(reste)}.`,
  };
});

const dureeMinutes = forme('duree-minutes', -2, (rng, stage) => {
  const activite = rngPick(rng, ACTIVITES);
  const h = rngInt(rng, 8, 17);
  const debut = rngInt(rng, 0, 30);
  const longueur = rngInt(rng, 10, 59 - debut > 10 ? 59 - debut : 20);
  const fin = debut + longueur;
  if (rng() < 0.5) {
    return {
      instruction: INSTRUCTION,
      prompt: `${activite} commence à ${heure(h, debut)}. Il finit à ${heure(h, fin)}. Combien de minutes dure-t-il ?`,
      correct: `${longueur} min`,
      wrong: nombresEn(fauxNombres(longueur, [fin, debut, fin + debut, longueur + 10, longueur - 10, longueur + 5, longueur - 5], { min: 1, max: 100 }), 'min'),
      explanation: `${fin} − ${debut} = ${longueur} minutes.`,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `${activite} commence à ${heure(h, debut)}. Il dure ${longueur} minutes. À quelle heure finit-il ?`,
    correct: heure(h, fin),
    wrong: [heure(h, Math.abs(fin - 10)), heure(h, Math.min(59, fin + 10)), heure(h, longueur), heure(h, Math.max(0, fin - 5)), heure(h + 1, fin % 60)].filter((texte) => texte !== heure(h, fin)),
    explanation: `${debut} + ${longueur} = ${fin} : ${heure(h, fin)}.`,
  };
});

const longueursCE2 = forme('longueurs-ce2', -2, (rng, stage) => {
  const objet = rngPick(rng, RUBANS);
  const [metres, centimetres] = [rngInt(rng, 2, 9), rngInt(rng, 10, 90)];
  if (rng() < 0.5) {
    const total = metres * 100 + centimetres;
    return {
      instruction: INSTRUCTION,
      prompt: `${majuscule(objet)} mesure ${metres} m. ${majuscule(autre(objet))} mesure ${centimetres} cm. Quelle est la longueur totale en centimètres ?`,
      correct: `${total} cm`,
      // Les mètres et les centimètres ajoutés tels quels, un zéro oublié.
      wrong: nombresEn(fauxNombres(total, [metres + centimetres, metres * 10 + centimetres, total + 100, total - 100, total * 10, total + 10], { min: 1, max: 10000 }), 'cm'),
      explanation: `${metres} m = ${metres * 100} cm, puis ${metres * 100} + ${centimetres} = ${total}.`,
    };
  }
  const reste = metres * 100 - centimetres;
  return {
    instruction: INSTRUCTION,
    prompt: `${majuscule(objet)} mesure ${metres} m. On en coupe ${centimetres} cm. Combien reste-t-il de centimètres ?`,
    correct: `${reste} cm`,
    wrong: nombresEn(fauxNombres(reste, [metres * 100 + centimetres, metres * 10 - centimetres, reste + 100, reste - 100, reste + 10, reste - 10, centimetres], { min: 1, max: 10000 }), 'cm'),
    explanation: `${metres} m = ${metres * 100} cm, puis ${metres * 100} − ${centimetres} = ${reste}.`,
  };
});

// --- Le CE2, 2e trimestre ---------------------------------------------------------------------------------------------------------------------------------

const foisPlus = forme('fois-plus', -1, (rng, stage) => {
  const [premier, second] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  const [a, k] = [rngInt(rng, 3, 20), rngInt(rng, 2, 6)];
  return {
    instruction: INSTRUCTION,
    prompt: `${premier.nom} a ${a} ${objet}. ${second.nom} en a ${k} fois plus. Combien en a ${second.nom} ?`,
    correct: String(a * k),
    // « k fois plus » lu comme « k de plus », le nombre de fois oublié.
    wrong: nombresEn(fauxEntiers(a * k, [a + k, a * k + a, a * k - a, a * (k + 1), a * k + k, a * k - k, a], stage)),
    explanation: `${k} fois plus : ${a} × ${k} = ${a * k}.`,
  };
});

const grandProduit = forme('grand-produit', -1, (rng, stage) => {
  const caisses = rngPick(rng, [
    { qui: 'Un camion transporte', contenant: 'caisses', objet: 'bouteilles' },
    { qui: 'Un camion transporte', contenant: 'cartons', objet: 'livres' },
    { qui: 'Un confiseur prépare', contenant: 'sachets', objet: 'bonbons' },
    { qui: 'Un magasin reçoit', contenant: 'boîtes', objet: 'crayons' },
    { qui: 'Une boulangerie prépare', contenant: 'paquets', objet: 'biscuits' },
  ]);
  const [k, n] = [rngInt(rng, 12, 60), rngInt(rng, 3, 9)];
  const dizainesFois = stage >= 0 && rng() < 0.5;
  const [x, y] = dizainesFois ? [rngInt(rng, 12, 40), rngInt(rng, 11, 25)] : [k, n];
  return {
    instruction: INSTRUCTION,
    prompt: `${caisses.qui} ${y} ${caisses.contenant} de ${x} ${caisses.objet}. Combien y a-t-il ${de(caisses.objet)} en tout ?`,
    correct: String(x * y),
    wrong: nombresEn(fauxNombres(x * y, [x + y, x * y + x, x * y - x, x * y + 10, x * y - 10, x * y + y, x * (y + 1), x * y + 100], { min: 1, max: 100000 })),
    explanation: `${y} × ${x} = ${x * y}.`,
  };
});

const FRACTIONS_UNITAIRES = [
  { dit: 'la moitié', d: 2 },
  { dit: 'le tiers', d: 3 },
  { dit: 'le quart', d: 4 },
  { dit: 'le cinquième', d: 5 },
  { dit: 'le dixième', d: 10 },
];

const fractionDeLaQuantite = forme('fraction-pb', -1, (rng, stage) => {
  const [moi] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  const { dit, d } = rngPick(rng, FRACTIONS_UNITAIRES);
  const part = rngInt(rng, 2, Math.floor(100 / d) > 12 ? 12 : Math.floor(100 / d));
  const total = d * part;
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} a ${total} ${objet}. ${il(moi)} en donne ${dit}. Combien ${de(objet)} donne-t-${pronom(moi)} ?`,
    correct: String(part),
    // Ce qu'il lui reste, au lieu de ce qu'il donne ; « le quart » lu « 4 fois ».
    wrong: nombresEn(fauxEntiers(part, [total - part, total * d, part + 1, part - 1, Math.floor(total / 2), total - 1, part + 2], stage)),
    explanation: `${dit.replace(/^l/, 'L')} de ${total} : ${total} ÷ ${d} = ${part}.`,
  };
});

const massesCE2 = forme('masses-ce2', -1, (rng, stage) => {
  const [kilos, grammes] = [rngInt(rng, 2, 9), rngPick(rng, [100, 150, 200, 250, 300, 400, 450, 500, 600, 750])];
  if (rng() < 0.5) {
    const total = kilos * 1000 + grammes;
    return {
      instruction: INSTRUCTION,
      prompt: `Un colis pèse ${kilos} kg. Un autre colis pèse ${grammes} g. Combien pèsent les deux colis en grammes ?`,
      correct: `${total} g`,
      wrong: nombresEn(fauxNombres(total, [kilos + grammes, kilos * 100 + grammes, total + 1000, total - 1000, total * 10, total + 100], { min: 1, max: 10000 }), 'g'),
      explanation: `${kilos} kg = ${kilos * 1000} g, puis ${kilos * 1000} + ${grammes} = ${total}.`,
    };
  }
  const tonnes = rngInt(rng, 2, 9);
  const kg = rngPick(rng, [200, 300, 500, 600, 800]);
  const reste = tonnes * 1000 - kg;
  return {
    instruction: INSTRUCTION,
    prompt: `Un camion porte ${tonnes} t de sable. On en retire ${kg} kg. Combien de kilogrammes reste-t-il ?`,
    correct: `${reste} kg`,
    wrong: nombresEn(fauxNombres(reste, [tonnes * 100 - kg, tonnes * 1000 + kg, reste + 1000, reste - 1000, reste + 100, reste - 100], { min: 1, max: 10000 }), 'kg'),
    explanation: `${tonnes} t = ${tonnes * 1000} kg, puis ${tonnes * 1000} − ${kg} = ${reste}.`,
  };
});

const contenancesCE2 = forme('contenances-ce2', -1, (rng, stage) => {
  const [litres, cl] = [rngInt(rng, 1, 5), rngPick(rng, [10, 20, 25, 30, 40, 50, 60, 75])];
  const total = litres * 100 + cl;
  if (rng() < 0.5) {
    return {
      instruction: INSTRUCTION,
      prompt: `Un bidon contient ${litres} L. On y ajoute ${cl} cL. Combien de centilitres contient-il ?`,
      correct: `${total} cL`,
      wrong: nombresEn(fauxNombres(total, [litres + cl, litres * 10 + cl, total + 100, total - 100, total + 10, total * 10], { min: 1, max: 10000 }), 'cL'),
      explanation: `${litres} L = ${litres * 100} cL, puis ${litres * 100} + ${cl} = ${total}.`,
    };
  }
  const reste = litres * 100 - cl;
  return {
    instruction: INSTRUCTION,
    prompt: `Une carafe contient ${litres} L d'eau. On verse ${cl} cL. Combien de centilitres reste-t-il ?`,
    correct: `${reste} cL`,
    wrong: nombresEn(fauxNombres(reste, [litres * 10 - cl, litres * 100 + cl, reste + 100, reste - 100, reste + 10, reste - 10], { min: 1, max: 10000 }), 'cL'),
    explanation: `${litres} L = ${litres * 100} cL, puis ${litres * 100} − ${cl} = ${reste}.`,
  };
});

/** Un diagramme dont on cache une barre : le total, moins les barres que l'on voit. */
const diagrammeACompleter = forme('diagramme-completer', -1, (rng, stage) => {
  const theme = rngPick(rng, THEMES);
  const items = rngShuffle(rng, theme.items).slice(0, 5);
  const pas = rngPick(rng, [5, 10]);
  const valeurs = rngShuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5).map((cases) => cases * pas);
  const [cache, ...vus] = items.map((item, index) => ({ item, valeur: valeurs[index] }));
  const total = valeurs.reduce((somme, valeur) => somme + valeur, 0);
  const maximum = (Math.floor(Math.max(...vus.map(({ valeur }) => valeur)) / pas) + 1) * pas;
  return {
    detail: `completer-${theme.entete}-${valeurs.join('.')}`,
    instruction: INSTRUCTION_DONNEES,
    prompt: `Le diagramme ne montre pas ${cache.item.dit}. Il y a ${total} ${theme.total.replace(/^d'|^de /, '')} en tout. Combien ont choisi ${cache.item.dit} ?`,
    figure: diagrammeEnBarres(vus.map(({ item, valeur }) => [item.nom, valeur] as [string, number]), maximum, pas, 'Nombre'),
    correct: String(cache.valeur),
    // Le total, la somme des barres, un écart d'une graduation.
    wrong: nombresEn(fauxNombres(cache.valeur, [total, total - cache.valeur, cache.valeur + pas, cache.valeur - pas, cache.valeur + 1, vus[0].valeur], { min: 1, max: 1000 })),
    explanation: `${vus.map(({ valeur }) => valeur).join(' + ')} = ${total - cache.valeur}, puis ${total} − ${total - cache.valeur} = ${cache.valeur}.`,
  };
});

// --- Le CE2, 3e trimestre -----------------------------------------------------------------------------------------------------------------------------------------

const resteDeLaDivision = forme('reste-division', 0, (rng, stage) => {
  const contenant = rngPick(rng, CONTENANTS);
  const k = rngInt(rng, 3, 10);
  const boites = rngInt(rng, 3, 9);
  const reste = rngInt(rng, 1, k - 1);
  const total = boites * k + reste;
  const sorte = rngInt(rng, 0, 2);
  const [reponse, question, explication, candidats] =
    sorte === 0
      ? [boites, `Combien ${de(contenant.pluriel)} peut-on remplir complètement ?`, `${boites} × ${k} = ${boites * k}, et ${total} − ${boites * k} = ${reste}.`, [boites + 1, boites - 1, reste, total - k, boites + 2]]
      : sorte === 1
        ? [reste, `Combien ${de(contenant.objets)} reste-t-il ?`, `${boites} × ${k} = ${boites * k}, et ${total} − ${boites * k} = ${reste}.`, [boites, reste + 1, reste - 1, k - reste, total - boites]]
        : [boites + 1, `Combien faut-il ${de(contenant.pluriel)} pour tout ranger ?`, `${total} = ${boites} × ${k} + ${reste}. Il faut ${boites + 1} ${contenant.pluriel}.`, [boites, boites + 2, total - k, reste, boites - 1]];
  return {
    instruction: INSTRUCTION,
    prompt: `On a ${total} ${contenant.objets}. On les range dans des ${contenant.pluriel} de ${k}. ${question}`,
    correct: String(reponse),
    wrong: nombresEn(fauxEntiers(reponse as number, candidats as number[], stage)),
    explanation: explication as string,
  };
});

const troisEtapes = forme('trois-etapes', 0, (rng, stage) => {
  const [moi] = deuxPrenoms(rng);
  const [premier, second] = rngShuffle(rng, ARTICLES_PLURIELS).slice(0, 2);
  const [n, a, m, b] = [rngInt(rng, 2, 6), rngInt(rng, 2, 9), rngInt(rng, 2, 5), rngInt(rng, 2, 9)];
  const depense = n * a + m * b;
  const billet = rngPick(rng, [20, 50, 100].filter((candidat) => candidat > depense));
  const reponse = billet - depense;
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} achète ${n} ${premier.nom} à ${a} € ${premier.chacun}. ${il(moi)} achète aussi ${m} ${second.nom} à ${b} € ${second.chacun}. ${il(moi)} paie avec ${billet} €. Combien lui rend-on ?`,
    correct: `${reponse} €`,
    wrong: nombresEn(fauxEntiers(reponse, [depense, n * a, m * b, billet - n * a, billet - m * b, billet + depense, reponse + a], stage), '€'),
    explanation: `${n} × ${a} = ${n * a}, ${m} × ${b} = ${m * b}, puis ${billet} − ${depense} = ${reponse}.`,
  };
});

const renduDecimal = forme('rendu-decimal', 0, (rng, stage) => {
  const [moi] = deuxPrenoms(rng);
  const article = rngPick(rng, ARTICLES_A_PRIX);
  const prix = rngInt(rng, article.min, article.max - 1) * 100 + rngPick(rng, [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]);
  // Un billet qui paie l'article avec au moins un euro de monnaie, et qui n'est pas démesuré : pas 50 € pour une gomme.
  const billets = [1000, 2000, 5000].filter((candidat) => candidat >= prix + 100);
  const raisonnables = billets.filter((candidat) => prix * 5 >= candidat);
  const billet = rngPick(rng, raisonnables.length > 0 ? raisonnables : [billets[0]]);
  const reste = billet - prix;
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} achète ${article.un} à ${montant(prix)}. ${il(moi)} paie avec ${montant(billet)}. Combien la vendeuse lui rend-elle ?`,
    correct: montant(reste),
    // Les euros et les centimes soustraits chacun de leur côté, sans l'échange.
    wrong: [billet + prix, reste + 100, reste - 100, reste + 10, reste - 10, Math.floor(billet / 100) * 100 - Math.floor(prix / 100) * 100 + (prix % 100)]
      .filter((centimes) => centimes !== reste && centimes > 0)
      .map(montant),
    explanation: `${montant(billet)} − ${montant(prix)} = ${montant(reste)}.`,
  };
});

const dureeHeuresMinutes = forme('duree-heures-minutes', 0, (rng, stage) => {
  const activite = rngPick(rng, ['Le train', 'Le bus', 'Le voyage', 'Le trajet', 'Le spectacle', 'Le film']);
  const [h, m] = [rngInt(rng, 6, 15), rngPick(rng, [0, 10, 15, 20, 30, 40, 45, 50])];
  const [dh, dm] = [rngInt(rng, 1, 3), rngPick(rng, [10, 15, 20, 25, 30, 35, 40, 45])];
  const fin = h * 60 + m + dh * 60 + dm;
  const [finH, finM] = [Math.floor(fin / 60), fin % 60];
  const correct = heure(finH, finM);
  // L'heure de la retenue oubliée (45 min + 40 min = 85 min, soit 1 h 25), ou une des deux durées laissée de côté.
  const sansRetenue = m + dm > 59 ? heure(h + dh, m + dm - 60) : heure(h + dh + 1, m + dm);
  return {
    instruction: INSTRUCTION,
    prompt: `${activite} part à ${heure(h, m)}. Il dure ${dh} h ${dm} min. À quelle heure arrive-t-il ?`,
    correct,
    wrong: [heure(finH + 1, finM), heure(finH - 1, finM), heure(h + dh, m), sansRetenue, heure(finH, (finM + 30) % 60), heure(h + dh, dm)].filter((texte) => texte !== correct),
    explanation: `${m} + ${dm} = ${m + dm} min${m + dm > 59 ? `, soit 1 h ${m + dm - 60}` : ''} : ${correct}.`,
  };
});

const resteApresUneFraction = forme('fraction-reste', 0, (rng, stage) => {
  const [moi] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  const { dit, d } = rngPick(rng, FRACTIONS_UNITAIRES);
  const part = rngInt(rng, 2, Math.floor(100 / d) > 12 ? 12 : Math.floor(100 / d));
  const total = d * part;
  const reponse = total - part;
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} a ${total} ${objet}. ${il(moi)} en donne ${dit}. Combien ${de(objet)} lui reste-t-il ?`,
    correct: String(reponse),
    wrong: nombresEn(fauxEntiers(reponse, [part, total + part, reponse + 1, reponse - 1, total - 1, total * d, reponse + part], stage)),
    explanation: `${dit.replace(/^l/, 'L')} de ${total} : ${part}. Puis ${total} − ${part} = ${reponse}.`,
  };
});

export const BRIQUES_CYCLE2: Brique[] = [
  // CE1, 1er trimestre
  ajout,
  retrait,
  reunion,
  complement,
  ecart,
  comparaison,
  argent,
  longueurs,
  jours,
  donnees('tableau', -5, 'tableau'),
  donnees('pictogramme', -5, 'pictogramme'),
  // CE1, 2e trimestre
  groupements,
  rangees,
  chacun,
  duree,
  masses,
  contenances,
  donnees('diagramme', -4, 'barres'),
  // CE1, 3e trimestre
  deuxEtapes,
  partage,
  rendu,
  // CE2, 1er trimestre
  deuxEtapesCE2,
  prixDecimaux,
  dureeMinutes,
  longueursCE2,
  // CE2, 2e trimestre
  foisPlus,
  grandProduit,
  fractionDeLaQuantite,
  massesCE2,
  contenancesCE2,
  diagrammeACompleter,
  // CE2, 3e trimestre
  resteDeLaDivision,
  troisEtapes,
  renduDecimal,
  dureeHeuresMinutes,
  resteApresUneFraction,
];

/** Le nombre de sortes de problèmes enseignées à cette étape. */
export function sortesDeProblemesCycle2(level: Level, trimester: Trimester): number {
  const stage = stageOf(level, trimester);
  return BRIQUES_CYCLE2.filter((brique) => brique.minStage <= stage).length;
}

/** Les problèmes du CE1 et du CE2. */
export function genererCycle2(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('problemes', BRIQUES_CYCLE2, stageOf(level, trimester), rng, count);
}
