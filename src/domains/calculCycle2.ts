import type { Level, Question, Trimester } from '../types';
import { rngInt, rngPick, type Rng } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';
import {
  erreursAddition,
  erreursProduit,
  erreursQuotient,
  erreursSoustraction,
  rangsDEmprunt,
  rangsDeRetenue,
} from './calculErreurs';
import { briqueDeTechnique, MENTAL, operation, tableDeMultiplication, type Technique } from './calculCommun';
import { fabriquer, fauxNombres, type Brique, type Enonce } from './mathsCommun';

/**
 * Le calcul du CE1 et du CE2 (programme de mathématiques du cycle 2, 2025).
 *
 * Progression, cumulative :
 * - CE1, 1er trimestre : tables d'addition, compléments à 10 et à la dizaine,
 *   doubles et moitiés, ajouter 1, 10 ou 100 ; addition posée de deux puis
 *   trois chiffres, somme au plus 1 000 ; tables de 2 et de 10 ;
 * - CE1, 2e : soustraction posée (un seul algorithme), calcul réfléchi, sens
 *   de la multiplication, tables de 5 et de 3 ;
 * - CE1, 3e : table de 4, tables dans les deux sens, m et cm, kg et g, km et m ;
 * - CE2, 1er : additions et soustractions posées jusqu'à 4 chiffres, ×10 et
 *   ×100, quarts, début des tables de 6 et de 7, km, m, dm, cm, mm ;
 * - CE2, 2e : tables de 8 et de 9, multiples de 10 et de 100, multiplication
 *   posée par un chiffre, division en ligne (symbole ÷), distributivité,
 *   fraction d'une quantité, tonne, kg, g, L, dL, cL ;
 * - CE2, 3e : multiplication posée par deux chiffres, toutes les tables.
 *
 * Pas de décimaux (l'écriture à virgule ne vient qu'avec la monnaie), pas de
 * division posée, pas de reste en calcul : le texte du cycle 2 n'y est pas
 * explicite et ces points restent à vérifier (voir programmes/maths.md).
 */

const arrondi = (n: number) => Math.round(n);

/** Tire des termes jusqu'à ce que l'opération demande bien la technique : une
 *  retenue, un emprunt, dans la plupart des cas — sans quoi « 23 + 41 » ne fait
 *  travailler aucune retenue. */
function avecTechnique(rng: Rng, tirer: () => [number, number], demande: (a: number, b: number) => boolean): [number, number] {
  const exiger = rng() < 0.85;
  let termes = tirer();
  for (let essai = 0; exiger && essai < 25 && !demande(...termes); essai++) termes = tirer();
  return termes;
}

// --- Les opérations, posées ou de tête ---------------------------------------------------

const additionTables: Technique = {
  name: 'add-tables',
  minStage: -5,
  posable: false,
  instruction: MENTAL,
  build: (rng) => {
    const [a, b] = [rngInt(rng, 2, 10), rngInt(rng, 2, 10)];
    return operation(a, b, '+', a + b);
  },
  erreurs: ({ a, b, result }) => [result + 1, result - 1, result + 2, result - 2, result + 10, result - 10, a * b],
  explication: ({ a, b, result }) => `${a} + ${b} = ${result}.`,
};

const soustractionTables: Technique = {
  name: 'sub-tables',
  minStage: -5,
  posable: false,
  instruction: MENTAL,
  build: (rng) => {
    const b = rngInt(rng, 3, 9);
    const a = rngInt(rng, Math.max(11, b + 2), 20);
    return operation(a, b, '-', a - b);
  },
  // Le plus petit chiffre retranché du plus grand : 15 − 7 donne 10 + (7 − 5).
  erreurs: ({ a, b, result }) => [10 + Math.abs((a % 10) - b), result + 1, result - 1, result + 2, result - 2, a + b, result + 10],
  explication: ({ a, b, result }) => `${a} − ${b} = ${result}.`,
};

const additionPosee: Technique = {
  name: 'add-posee',
  minStage: -5,
  posable: true,
  build: (rng, stage) => {
    // Au CE1, des termes de deux ou trois chiffres, somme au plus 1 000 ; au
    // CE2, qui la revoit, des termes de trois chiffres (les quatre chiffres
    // ont leur technique : add-posee-4).
    const [a, b] = avecTechnique(
      rng,
      () => {
        const trois = stage >= -2 || rng() < 0.35;
        const premier = trois ? rngInt(rng, 100, 899) : rngInt(rng, 10, 99);
        const second = rngInt(rng, stage >= -2 ? 100 : 10, trois ? Math.min(999, 1000 - premier) : 99);
        return rng() < 0.5 ? [premier, second] : [second, premier];
      },
      (x, y) => rangsDeRetenue(x, y).length > 0
    );
    return operation(a, b, '+', a + b);
  },
  erreurs: ({ a, b }) => erreursAddition(a, b),
  explication: ({ a, b, result }) => {
    const [unitesA, unitesB] = [a % 10, b % 10];
    return unitesA + unitesB >= 10
      ? `Les unités : ${unitesA} + ${unitesB} = ${unitesA + unitesB}. On écrit ${(unitesA + unitesB) % 10} et on retient 1. Résultat : ${result}.`
      : `On ajoute les unités, puis les dizaines. Résultat : ${result}.`;
  },
};

const soustractionPosee: Technique = {
  name: 'sub-posee',
  minStage: -4,
  posable: true,
  build: (rng, stage) => {
    const [a, b] = avecTechnique(
      rng,
      () => {
        const trois = stage >= -2 || rng() < 0.45;
        const grand = trois ? rngInt(rng, 100, 999) : rngInt(rng, 30, 99);
        return [grand, rngInt(rng, 10, Math.max(10, Math.floor(grand * 0.8)))];
      },
      (x, y) => rangsDEmprunt(x, y).length > 0
    );
    return operation(a, b, '-', a - b);
  },
  erreurs: ({ a, b }) => erreursSoustraction(a, b),
  explication: ({ a, b, result }) => {
    const [unitesA, unitesB] = [a % 10, b % 10];
    return unitesA < unitesB
      ? `On ne peut pas faire ${unitesA} − ${unitesB} : on prend une dizaine. ${10 + unitesA} − ${unitesB} = ${10 + unitesA - unitesB}. Résultat : ${result}.`
      : `On retranche les unités, puis les dizaines. Résultat : ${result}.`;
  },
};

const additionPosee4: Technique = {
  name: 'add-posee-milliers',
  minStage: -2,
  posable: true,
  build: (rng) => {
    const [a, b] = avecTechnique(
      rng,
      () => {
        const grand = rngInt(rng, 1000, 8999);
        const petit = rngInt(rng, 100, Math.min(9999, 10000 - grand));
        return rng() < 0.5 ? [grand, petit] : [petit, grand];
      },
      (x, y) => rangsDeRetenue(x, y).length > 0
    );
    return operation(a, b, '+', a + b);
  },
  erreurs: ({ a, b }) => erreursAddition(a, b),
  explication: ({ a, b, result }) => {
    const retenues = rangsDeRetenue(a, b).length;
    return retenues > 0
      ? `On ajoute colonne par colonne, avec ${retenues === 1 ? 'la retenue' : 'les retenues'}. Résultat : ${result}.`
      : `On ajoute colonne par colonne. Résultat : ${result}.`;
  },
};

const soustractionPosee4: Technique = {
  name: 'sub-posee-milliers',
  minStage: -2,
  posable: true,
  build: (rng) => {
    const [a, b] = avecTechnique(
      rng,
      () => {
        const grand = rngInt(rng, 1000, 9999);
        return [grand, rngInt(rng, 100, Math.floor(grand * 0.8))];
      },
      (x, y) => rangsDEmprunt(x, y).length > 0
    );
    return operation(a, b, '-', a - b);
  },
  erreurs: ({ a, b }) => erreursSoustraction(a, b),
  explication: ({ a, b, result }) => {
    const emprunts = rangsDEmprunt(a, b).length;
    return emprunts > 0
      ? `On retranche colonne par colonne, en empruntant quand il le faut. Résultat : ${result}.`
      : `On retranche colonne par colonne. Résultat : ${result}.`;
  },
};

const multiplicationPar10Et100: Technique = {
  name: 'mult-par-dix-cent',
  minStage: -2,
  posable: false,
  instruction: MENTAL,
  build: (rng) => {
    const par100 = rng() < 0.5;
    const a = par100 ? rngInt(rng, 2, 99) : rngInt(rng, 11, 999);
    return operation(a, par100 ? 100 : 10, '×', a * (par100 ? 100 : 10));
  },
  // « × 10 » compris comme « + 10 », un zéro de trop, un zéro de moins.
  erreurs: ({ a, b, result }) => [a + b, result * 10, result / 10, a, result + b],
  explication: ({ b }) =>
    b === 10
      ? "Multiplier par 10, c'est décaler chaque chiffre d'un rang."
      : "Multiplier par 100, c'est décaler chaque chiffre de deux rangs.",
};

const multiplesDe10Et100: Technique = {
  name: 'mult-multiples',
  minStage: -1,
  posable: false,
  build: (rng) => {
    const dizaines = rng() < 0.5;
    const a = rngInt(rng, 2, 9) * (dizaines ? 10 : 100);
    const b = rngInt(rng, 2, 9);
    return operation(a, b, '×', a * b);
  },
  erreurs: ({ a, b, result }) => [result * 10, result / 10, result + 10, result - 10, a + b],
  explication: ({ a, b, result }) => {
    const base = a >= 100 ? a / 100 : a / 10;
    return `${base} × ${b} = ${base * b}, donc ${a} × ${b} = ${result}.`;
  },
};

const multiplicationPosee1: Technique = {
  name: 'mult-posee-un-chiffre',
  minStage: -1,
  posable: true,
  build: (rng, _stage, posee) => {
    const a = posee ? rngInt(rng, 112, 999) : rngInt(rng, 12, 99);
    const b = rngInt(rng, 2, 9);
    return operation(a, b, '×', a * b);
  },
  erreurs: ({ a, b }) => erreursProduit(a, b),
  explication: ({ result }) => `On multiplie chiffre par chiffre, avec les retenues. Résultat : ${result}.`,
};

const multiplicationPosee2: Technique = {
  name: 'mult-posee-deux-chiffres',
  minStage: 0,
  posable: true,
  build: (rng, _stage, posee) => {
    const a = posee ? rngInt(rng, 112, 999) : rngInt(rng, 12, 99);
    const b = rngInt(rng, 11, 99);
    return operation(a, b, '×', a * b);
  },
  erreurs: ({ a, b }) => erreursProduit(a, b),
  explication: ({ b, result }) =>
    `On multiplie par ${b % 10}, puis par ${b - (b % 10)}. On additionne les deux lignes. Résultat : ${result}.`,
};

/** Une division en ligne, comme l'opération inverse de la multiplication :
 *  dans les tables, sans reste. */
const divisionEnLigne: Technique = {
  name: 'div-ligne',
  minStage: -1,
  posable: false,
  instruction: MENTAL,
  build: (rng) => {
    const [diviseur, quotient] = [rngInt(rng, 2, 10), rngInt(rng, 2, 10)];
    return operation(diviseur * quotient, diviseur, '÷', quotient);
  },
  erreurs: ({ a, b }) => erreursQuotient(a, b),
  explication: ({ a, b, result }) => `${b} × ${result} = ${a}, donc ${a} ÷ ${b} = ${result}.`,
};

/** Calcul réfléchi : on arrondit à la dizaine, puis on compense. */
const additionReflechie: Technique = {
  name: 'add-mental',
  minStage: -4,
  posable: false,
  instruction: MENTAL,
  build: (rng) => {
    const b = rngPick(rng, [9, 11, 19, 21, 20, 30, 40, 50, 60]);
    const a = rngInt(rng, 12, 90);
    return operation(a, b, '+', a + b);
  },
  erreurs: ({ a, b, result }) => [a + arrondi(b / 10) * 10, result + 10, result - 10, result + 1, result - 1, a + b + 10],
  explication: ({ a, b, result }) => {
    const rond = arrondi(b / 10) * 10;
    return rond === b
      ? `On ajoute ${b / 10} dizaines à ${a} : ${result}.`
      : `${a} + ${b} = ${a} + ${rond} ${rond > b ? '−' : '+'} ${Math.abs(rond - b)} = ${result}.`;
  },
};

const soustractionReflechie: Technique = {
  name: 'sub-mental',
  minStage: -4,
  posable: false,
  instruction: MENTAL,
  build: (rng) => {
    const b = rngPick(rng, [9, 11, 19, 21, 20, 30, 40, 50]);
    const a = rngInt(rng, b + 12, 99);
    return operation(a, b, '-', a - b);
  },
  erreurs: ({ a, b, result }) => [a - arrondi(b / 10) * 10, result + 10, result - 10, result + 1, result - 1, a - b + 20],
  explication: ({ a, b, result }) => {
    const rond = arrondi(b / 10) * 10;
    return rond === b
      ? `On retranche ${b / 10} dizaines à ${a} : ${result}.`
      : `${a} − ${b} = ${a} − ${rond} ${rond > b ? '+' : '−'} ${Math.abs(rond - b)} = ${result}.`;
  },
};

export const TECHNIQUES_CYCLE2: Technique[] = [
  additionTables,
  soustractionTables,
  additionPosee,
  tableDeMultiplication('mult-table', -5, [2, 10]),
  soustractionPosee,
  additionReflechie,
  soustractionReflechie,
  tableDeMultiplication('mult-table-cinq-trois', -4, [5, 3]),
  tableDeMultiplication('mult-table-quatre', -3, [4]),
  additionPosee4,
  soustractionPosee4,
  multiplicationPar10Et100,
  tableDeMultiplication('mult-table-six-sept', -2, [6, 7]),
  tableDeMultiplication('mult-table-huit-neuf', -1, [8, 9]),
  multiplesDe10Et100,
  multiplicationPosee1,
  divisionEnLigne,
  multiplicationPosee2,
  tableDeMultiplication('mult-table-toutes', 0, [2, 3, 4, 5, 6, 7, 8, 9, 10]),
];

// --- Les autres calculs : trous, doubles, conversions ---------------------------------------

/** Le plus grand nombre du niveau : 1 000 au CE1, 10 000 au CE2. */
const plafondDesNombres = (stage: Stage) => (stage <= -3 ? 1000 : 10000);

/** Les produits du CE2 vont jusqu'à 100 000 (multiplication posée). */
const plafondDesResultats = (stage: Stage, op: string) => (stage <= -3 ? 1000 : op === '×' ? 99999 : 10000);

const forme = (name: string, minStage: Stage, make: (rng: Rng, stage: Stage) => Enonce): Brique => ({ name, minStage, make });

const nombres = (valeurs: number[]) => valeurs.map(String);

const complementA10 = forme('complement-dix', -5, (rng, stage) => {
  const a = rngInt(rng, 1, 9);
  const reponse = 10 - a;
  return {
    instruction: 'Trouve le nombre qui manque',
    prompt: `${a} + … = 10`,
    correct: String(reponse),
    wrong: nombres(fauxNombres(reponse, [a, reponse + 1, reponse - 1, reponse + 2, 10 + a], { min: 0, max: plafondDesNombres(stage) })),
    explanation: `${a} + ${reponse} = 10.`,
  };
});

const complementALaDizaine = forme('complement-dizaine', -5, (rng, stage) => {
  let a = rngInt(rng, 11, 98);
  while (a % 10 === 0) a = rngInt(rng, 11, 98);
  const suivante = Math.ceil(a / 10) * 10;
  const reponse = suivante - a;
  return {
    instruction: 'Trouve le nombre qui manque',
    prompt: `${a} + … = ${suivante}`,
    correct: String(reponse),
    // Le chiffre des unités lu à la place du complément : 47 + 7 = 54 ?
    wrong: nombres(fauxNombres(reponse, [a % 10, reponse + 1, reponse - 1, reponse + 2, 10 - reponse + 1], { min: 1, max: plafondDesNombres(stage) })),
    explanation: `Il manque ${reponse} pour aller de ${a} à ${suivante}.`,
  };
});

/** Les nombres dont on cherche le double, par étape. */
function nombreADoubler(rng: Rng, stage: Stage): number {
  if (stage <= -5) return rng() < 0.75 ? rngInt(rng, 2, 20) : rngPick(rng, [25, 30, 40, 50]);
  if (stage <= -3) return rng() < 0.7 ? rngInt(rng, 11, 100) : rngInt(rng, 6, 20) * 10;
  return rng() < 0.7 ? rngInt(rng, 50, 500) : rngInt(rng, 2, 10) * 50;
}

/** Les nombres dont on cherche la moitié (toujours pairs). */
function nombreAPartager(rng: Rng, stage: Stage): number {
  if (stage <= -5) return rng() < 0.75 ? 2 * rngInt(rng, 2, 20) : rngPick(rng, [50, 60, 80, 100]);
  if (stage <= -3) return rng() < 0.7 ? 2 * rngInt(rng, 5, 50) : rngInt(rng, 1, 20) * 20;
  return rng() < 0.5 ? rngInt(rng, 2, 50) * 20 : 2 * rngInt(rng, 20, 500);
}

const double: Brique = {
  name: 'double',
  minStage: -5,
  make: (rng, stage) => {
    const a = nombreADoubler(rng, stage);
    return {
      instruction: MENTAL,
      prompt: `Le double de ${a}`,
      correct: String(2 * a),
      wrong: nombres(fauxNombres(2 * a, [2 * a + 10, 2 * a - 10, 2 * a + 2, 2 * a - 2, a + 2, 3 * a], { min: 1, max: plafondDesNombres(stage) })),
      explanation: `Le double de ${a} : ${a} + ${a} = ${2 * a}.`,
    };
  },
};

const moitie: Brique = {
  name: 'moitie',
  minStage: -5,
  make: (rng, stage) => {
    const a = nombreAPartager(rng, stage);
    const moitieDeA = a / 2;
    return {
      instruction: MENTAL,
      prompt: `La moitié de ${a}`,
      correct: String(moitieDeA),
      // Le double au lieu de la moitié : une confusion qui revient.
      wrong: nombres(fauxNombres(moitieDeA, [2 * a, moitieDeA + 1, moitieDeA - 1, moitieDeA + 10, moitieDeA - 10, a - 10], { min: 1, max: plafondDesNombres(stage) })),
      explanation: `La moitié de ${a} : ${moitieDeA} + ${moitieDeA} = ${a}.`,
    };
  },
};

/** « 10 de plus que 47 » : ajouter ou retrancher 1, 10, 100 (ou 1 000). */
function plusOuMoins(name: string, minStage: Stage, pas: number[], plage: (rng: Rng) => number): Brique {
  return {
    name,
    minStage,
    make: (rng, stage) => {
      for (;;) {
        const k = rngPick(rng, pas);
        const a = plage(rng);
        const plus = rng() < 0.5;
        const reponse = plus ? a + k : a - k;
        if (reponse < 1 || reponse > 10000) continue;
        const autres = pas.filter((autre) => autre !== k);
        return {
          instruction: MENTAL,
          prompt: `${k} de ${plus ? 'plus' : 'moins'} que ${a}`,
          correct: String(reponse),
          // Le mauvais rang : on a ajouté 1, 10 ou 100 à la place du bon pas.
          wrong: nombres(
            fauxNombres(reponse, [...autres.flatMap((autre) => [a + autre, a - autre]), plus ? a - k : a + k], { min: 0, max: plafondDesNombres(stage) })
          ),
          explanation: `${a} ${plus ? '+' : '−'} ${k} = ${reponse}.`,
        };
      }
    },
  };
}

const plusMoins = plusOuMoins('plus-moins', -5, [1, 10, 100], (rng) => (rng() < 0.6 ? rngInt(rng, 10, 99) : rngInt(rng, 100, 899)));
const plusMoinsMilliers = plusOuMoins('plus-moins-milliers', -2, [1, 10, 100, 1000], (rng) => rngInt(rng, 1000, 8999));

const repeterLAddition: Brique = {
  name: 'repeter',
  minStage: -4,
  make: (rng) => {
    const [a, n] = [rngInt(rng, 2, 9), rngInt(rng, 2, 5)];
    const somme = Array.from({ length: n }, () => String(a)).join(' + ');
    return {
      instruction: 'Choisis la bonne multiplication',
      prompt: `Quelle multiplication est égale à ${somme} ?`,
      correct: `${n} × ${a}`,
      // Jamais « a × n », qui vaut la même chose : une seule bonne réponse.
      wrong: [`${a} × ${a}`, `${n} × ${n}`, `${n + 1} × ${a}`, `${n} × ${a + 1}`, `${a} + ${n}`, `${n} × ${a - 1}`].filter(
        (choix) => choix !== `${a} × ${n}`
      ),
      explanation: `${n} fois ${a}, c'est ${n} × ${a}.`,
    };
  },
};

const trouDeMultiplication: Brique = {
  name: 'trou-multiplication',
  minStage: -3,
  make: (rng, stage) => {
    const [table, facteur] = [rngPick(rng, [2, 3, 4, 5, 10]), rngInt(rng, 2, 10)];
    const produit = table * facteur;
    const devant = rng() < 0.5;
    return {
      instruction: 'Trouve le nombre qui manque',
      prompt: devant ? `${table} × … = ${produit}` : `… × ${table} = ${produit}`,
      correct: String(facteur),
      // 5 × … = 30 lu comme 5 + … = 30 : la soustraction à la place de la table.
      wrong: nombres(fauxNombres(facteur, [produit - table, facteur + 1, facteur - 1, facteur + 2, table, produit / 2], { min: 1, max: plafondDesNombres(stage) })),
      explanation: `${table} × ${facteur} = ${produit}.`,
    };
  },
};

// --- Les conversions ---------------------------------------------------------------------------

interface Rapport {
  grand: string;
  petit: string;
  /** Combien de petites unités dans une grande. */
  fois: number;
}

function conversion(name: string, minStage: Stage, rapports: Rapport[], plafond: number, sens: (rng: Rng) => boolean = (rng) => rng() < 0.5): Brique {
  return {
    name,
    minStage,
    make: (rng, stage) => {
      const { grand, petit, fois } = rngPick(rng, rapports);
      const maximum = Math.max(1, Math.min(rng() < 0.4 ? 99 : 9, Math.floor(plafond / fois)));
      const v = rngInt(rng, 1, maximum);
      const versPetit = sens(rng);
      const [depart, arrivee] = versPetit ? [v, v * fois] : [v * fois, v];
      const [uniteDepart, uniteArrivee] = versPetit ? [grand, petit] : [petit, grand];
      return {
        instruction: 'Complète',
        prompt: `${depart} ${uniteDepart} = … ${uniteArrivee}`,
        correct: String(arrivee),
        // Un zéro de trop, un zéro de moins, l'unité voisine.
        wrong: nombres(fauxNombres(arrivee, [arrivee * 10, arrivee / 10, arrivee * 100, arrivee / 100, v + fois, depart * 10], { min: 1, max: plafondDesNombres(stage) })),
        explanation: `Dans 1 ${grand}, il y a ${fois} ${petit}.`,
      };
    },
  };
}

const conversionCE1 = conversion(
  'conversion',
  -3,
  [
    { grand: 'm', petit: 'cm', fois: 100 },
    { grand: 'm', petit: 'cm', fois: 100 },
    { grand: 'kg', petit: 'g', fois: 1000 },
    { grand: 'km', petit: 'm', fois: 1000 },
  ],
  1000
);

const conversionLongueurs = conversion(
  'conversion-longueurs',
  -2,
  [
    { grand: 'km', petit: 'm', fois: 1000 },
    { grand: 'm', petit: 'dm', fois: 10 },
    { grand: 'm', petit: 'cm', fois: 100 },
    { grand: 'm', petit: 'mm', fois: 1000 },
    { grand: 'dm', petit: 'cm', fois: 10 },
    { grand: 'dm', petit: 'mm', fois: 100 },
    { grand: 'cm', petit: 'mm', fois: 10 },
  ],
  10000
);

const conversionMassesEtContenances = conversion(
  'conversion-masses',
  -1,
  [
    { grand: 't', petit: 'kg', fois: 1000 },
    { grand: 'kg', petit: 'g', fois: 1000 },
    { grand: 'L', petit: 'dL', fois: 10 },
    { grand: 'L', petit: 'cL', fois: 100 },
    { grand: 'dL', petit: 'cL', fois: 10 },
  ],
  10000
);

// --- Le quart, le tiers : une fraction d'une quantité ---------------------------------------

const quart: Brique = {
  name: 'quart',
  minStage: -2,
  make: (rng, stage) => {
    const k = rngInt(rng, 2, 25);
    const a = 4 * k;
    return {
      instruction: MENTAL,
      prompt: `Le quart de ${a}`,
      correct: String(k),
      // La moitié, ou quatre fois : le quart n'est ni l'une ni l'autre.
      wrong: nombres(fauxNombres(k, [a / 2, 4 * a, k + 1, k - 1, a - 4, k + 2], { min: 1, max: plafondDesNombres(stage) })),
      explanation: `Le quart, c'est la moitié de la moitié : ${a} → ${a / 2} → ${k}.`,
    };
  },
};

const FRACTIONS_UNITAIRES: { article: string; nom: string; denominateur: number }[] = [
  { article: 'Le', nom: 'tiers', denominateur: 3 },
  { article: 'Le', nom: 'quart', denominateur: 4 },
  { article: 'Le', nom: 'cinquième', denominateur: 5 },
  { article: 'Le', nom: 'sixième', denominateur: 6 },
  { article: 'Le', nom: 'huitième', denominateur: 8 },
  { article: 'Le', nom: 'dixième', denominateur: 10 },
];

const fractionDUneQuantite: Brique = {
  name: 'fraction-quantite',
  minStage: -1,
  make: (rng, stage) => {
    const { article, nom, denominateur } = rngPick(rng, FRACTIONS_UNITAIRES);
    const k = rngInt(rng, 2, Math.floor(120 / denominateur));
    const a = denominateur * k;
    return {
      instruction: MENTAL,
      prompt: `${article} ${nom} de ${a}`,
      correct: String(k),
      // « Le quart de 12 » lu comme « 4 fois 12 », ou comme la moitié.
      wrong: nombres(fauxNombres(k, [a * denominateur, a / 2, k + 1, k - 1, a - denominateur, k + 2], { min: 1, max: plafondDesNombres(stage) })),
      explanation: `${denominateur} × ${k} = ${a}, donc ${article.toLowerCase()} ${nom} de ${a} est ${k}.`,
    };
  },
};

const distributivite: Brique = {
  name: 'distributivite',
  minStage: -1,
  make: (rng, stage) => {
    const [dizaines, unites, b] = [rngInt(rng, 1, 5), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    const a = 10 * dizaines + unites;
    return {
      instruction: 'Complète',
      prompt: `${a} × ${b} = ${10 * dizaines} × ${b} + … × ${b}`,
      correct: String(unites),
      wrong: nombres(fauxNombres(unites, [dizaines, 10 * dizaines, unites + 1, unites - 1, b, a], { min: 1, max: plafondDesNombres(stage) })),
      explanation: `${a} = ${10 * dizaines} + ${unites}, donc ${a} × ${b} = ${10 * dizaines * b} + ${unites * b}.`,
    };
  },
};

export const FORMES_CYCLE2: Brique[] = [
  complementA10,
  complementALaDizaine,
  double,
  moitie,
  plusMoins,
  repeterLAddition,
  trouDeMultiplication,
  conversionCE1,
  quart,
  plusMoinsMilliers,
  conversionLongueurs,
  fractionDUneQuantite,
  distributivite,
  conversionMassesEtContenances,
];

export const BRIQUES_CYCLE2: Brique[] = [...TECHNIQUES_CYCLE2.map((technique) => briqueDeTechnique(technique, plafondDesResultats)), ...FORMES_CYCLE2];

/** Les questions de calcul du CE1 et du CE2. */
export function genererCycle2(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('calcul', BRIQUES_CYCLE2, stageOf(level, trimester), rng, count);
}
