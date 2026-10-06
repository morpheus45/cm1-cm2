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
import { decimalAleatoire, decimalesDe, echanges, fabriquer, fauxNombres, texte, type Brique, type Enonce } from './mathsCommun';

/**
 * Le calcul de la 6e (programme de mathématiques du cycle 3, 2025).
 *
 * Les élèves de 6e de 2026-2027 ont fait leur CM2 sous l'ancien programme :
 * le premier trimestre commence par des acquis du CM (tables, opérations
 * posées sur les entiers, division par un chiffre) avant de monter en
 * difficulté. Les ordres de grandeur sont ceux du programme : décimaux jusqu'à
 * trois décimales, partie entière jusqu'à quatre chiffres, division
 * euclidienne d'un dividende d'au plus 9 999 par un diviseur de un ou deux
 * chiffres, division décimale par un diviseur d'un chiffre.
 *
 * Progression, cumulative :
 * - 6e, 1er trimestre : acquis du CM (addition et soustraction de grands
 *   entiers, multiplication par deux chiffres, division par un chiffre,
 *   tables, multiples de 10, 100, 1 000, compléments) ; addition et
 *   soustraction de décimaux, multiplication d'un décimal par un entier,
 *   ×10, ×100, ×1 000 et leurs divisions, fraction simple d'une quantité ;
 * - 6e, 2e : division euclidienne, multiplication de deux décimaux,
 *   priorités opératoires, somme et différence de fractions de même
 *   dénominateur ou de dénominateurs multiples, fraction multipliée par un
 *   entier, pourcentages de 10, 25, 50 et 75 % ;
 * - 6e, 3e : division d'un décimal par un entier, pourcentages de 20, 5 et 1 %
 *   (par les fractions simples) ; la revue des quatre opérations.
 *
 * Hors programme : relatifs, calcul littéral, équations écrites, produit en
 * croix (voir programmes/maths.md).
 */

const arrondiA = (n: number, decimales = 3) => {
  const echelle = Math.pow(10, decimales);
  return Math.round(n * echelle) / echelle;
};

const pgcd = (a: number, b: number): number => (b === 0 ? a : pgcd(b, a % b));

/** Un décimal lu sans sa virgule : 12,25 devient 1225. */
const sansVirgule = (n: number) => Number(String(n).replace('.', ''));
/** Ses chiffres après la virgule, lus comme un entier : 12,25 devient 25. */
const apresLaVirgule = (n: number) => Number(String(n).split('.')[1] ?? 0);

// --- Les opérations posées sur les entiers : les acquis du CM -------------------------------

function termes(rng: Rng, tirer: () => [number, number], demande: (a: number, b: number) => boolean): [number, number] {
  const exiger = rng() < 0.85;
  let essai = tirer();
  for (let tentative = 0; exiger && tentative < 25 && !demande(...essai); tentative++) essai = tirer();
  return essai;
}

const additionEntiere: Technique = {
  name: 'add-ent',
  minStage: 7,
  posable: true,
  build: (rng) => {
    const [a, b] = termes(
      rng,
      () => {
        const premier = rngInt(rng, 1000, 79999);
        return [premier, rngInt(rng, 1000, 99999 - premier)];
      },
      (x, y) => rangsDeRetenue(x, y).length > 1
    );
    return operation(a, b, '+', a + b);
  },
  erreurs: ({ a, b }) => erreursAddition(a, b),
  explication: ({ result }) => `On ajoute colonne par colonne, de droite à gauche, avec les retenues. Résultat : ${result}.`,
};

const soustractionEntiere: Technique = {
  name: 'sub-ent',
  minStage: 7,
  posable: true,
  build: (rng) => {
    const [a, b] = termes(
      rng,
      () => {
        const grand = rngInt(rng, 10000, 99999);
        return [grand, rngInt(rng, 1000, Math.floor(grand * 0.8))];
      },
      (x, y) => rangsDEmprunt(x, y).length > 1
    );
    return operation(a, b, '-', a - b);
  },
  erreurs: ({ a, b }) => erreursSoustraction(a, b),
  explication: ({ result }) => `On retranche colonne par colonne, en empruntant quand il le faut. Résultat : ${result}.`,
};

const multiplicationEntiere: Technique = {
  name: 'mult-ent',
  minStage: 7,
  posable: true,
  build: (rng, _stage, posee) => {
    const a = posee ? rngInt(rng, 112, 999) : rngInt(rng, 12, 99);
    const b = rngInt(rng, 11, 99);
    return operation(a, b, '×', a * b);
  },
  erreurs: ({ a, b }) => erreursProduit(a, b),
  explication: ({ b, result }) =>
    b % 10 === 0
      ? `On multiplie par ${b / 10}, puis par 10. Résultat : ${result}.`
      : `On multiplie par ${b % 10}, puis par ${b - (b % 10)}. On additionne les deux lignes. Résultat : ${result}.`,
};

const divisionParUnChiffre: Technique = {
  name: 'div-exacte',
  minStage: 7,
  posable: true,
  build: (rng) => {
    const [diviseur, quotient] = [rngInt(rng, 2, 9), rngInt(rng, 12, 120)];
    return operation(diviseur * quotient, diviseur, '÷', quotient);
  },
  erreurs: ({ a, b }) => erreursQuotient(a, b),
  explication: ({ a, b, result }) => `On vérifie : ${b} × ${result} = ${a}.`,
};

// --- Les décimaux ---------------------------------------------------------------------------------

/** Les erreurs d'une somme ou d'une différence de décimaux : les virgules
 *  ignorées (on aligne à droite), les parties décimales traitées comme des
 *  entiers, la virgule déplacée. */
function erreursDecimales({ a, b, result, op }: { a: number; b: number; result: number; op: '+' | '-' }): number[] {
  const decimales = Math.max(decimalesDe(a), decimalesDe(b));
  const echelle = Math.pow(10, decimales);
  const entiers = (op === '+' ? Math.floor(a) + Math.floor(b) : Math.abs(Math.floor(a) - Math.floor(b)));
  const parties = op === '+' ? apresLaVirgule(a) + apresLaVirgule(b) : Math.abs(apresLaVirgule(a) - apresLaVirgule(b));
  const ignorees = op === '+' ? sansVirgule(a) + sansVirgule(b) : Math.abs(sansVirgule(a) - sansVirgule(b));
  return [ignorees / echelle, entiers + parties / echelle, result * 10, result / 10, result + 0.1, result - 0.1, result + 1, result - 1];
}

const additionDecimale: Technique = {
  name: 'add-dec',
  minStage: 7,
  posable: true,
  build: (rng, _stage, posee) => {
    const premier = rngInt(rng, 1, 3);
    // Des nombres de décimales différents trois fois sur quatre : c'est
    // l'alignement des virgules qu'on travaille.
    const second = rng() < 0.75 ? rngPick(rng, [1, 2, 3].filter((d) => d !== premier)) : rngInt(rng, 1, 3);
    const [min, max] = posee ? [10, 999] : [1, 99];
    const a = decimalAleatoire(rng, min, max, premier);
    const b = decimalAleatoire(rng, min, max, second);
    return operation(a, b, '+', arrondiA(a + b), true);
  },
  erreurs: ({ a, b, result }) => erreursDecimales({ a, b, result, op: '+' }),
  explication: ({ result }) => `On aligne les virgules, puis on ajoute colonne par colonne. Résultat : ${texte(result)}.`,
};

const soustractionDecimale: Technique = {
  name: 'sub-dec',
  minStage: 7,
  posable: true,
  build: (rng, _stage, posee) => {
    const premier = rngInt(rng, 1, 3);
    const second = rng() < 0.75 ? rngPick(rng, [1, 2, 3].filter((d) => d !== premier)) : rngInt(rng, 1, 3);
    const a = decimalAleatoire(rng, posee ? 20 : 5, posee ? 999 : 99, premier);
    const b = decimalAleatoire(rng, 1, Math.floor(a) - 1, second);
    return operation(a, b, '-', arrondiA(a - b), true);
  },
  erreurs: ({ a, b, result }) => erreursDecimales({ a, b, result, op: '-' }),
  explication: ({ result }) => `On aligne les virgules, puis on retranche colonne par colonne. Résultat : ${texte(result)}.`,
};

const multiplicationDecimaleParEntier: Technique = {
  name: 'mult-dec-ent',
  minStage: 7,
  posable: true,
  build: (rng, _stage, posee) => {
    const a = decimalAleatoire(rng, posee ? 10 : 1, posee ? 99 : 25, rngInt(rng, 1, 2));
    const b = rngInt(rng, 2, 9);
    return operation(a, b, '×', arrondiA(a * b), true);
  },
  // Seule la partie entière est multipliée ; la virgule oubliée ou mal placée.
  erreurs: ({ a, b, result }) => [Math.floor(a) * b + (a - Math.floor(a)), sansVirgule(a) * b, result * 10, result / 10, result + 0.1, result - 0.1],
  explication: ({ a, b, result }) =>
    `On multiplie sans la virgule : ${sansVirgule(a)} × ${b} = ${sansVirgule(a) * b}. On remet la virgule : ${texte(result)}.`,
};

const multiplicationParPuissanceDe10: Technique = {
  name: 'mult-puissance-dix',
  minStage: 7,
  posable: false,
  instruction: MENTAL,
  build: (rng) => {
    const facteur = rngPick(rng, [10, 100, 1000]);
    const a = rng() < 0.5 ? rngInt(rng, 2, 999) : decimalAleatoire(rng, 0, 99, rngInt(rng, 1, 2));
    return operation(a, facteur, '×', arrondiA(a * facteur), !Number.isInteger(a));
  },
  // Le nombre inchangé (« on ajoute des zéros »), « × 10 » compris comme « + 10 », un rang de trop ou de moins.
  erreurs: ({ a, b, result }) => [a, a + b, result * 10, result / 10, arrondiA((a * b) / 100), result + b],
  explication: ({ b }) =>
    `Multiplier par ${b}, c'est décaler la virgule de ${String(b).length - 1} rang${b > 10 ? 's' : ''} vers la droite.`,
};

const divisionParPuissanceDe10: Technique = {
  name: 'div-puissance-dix',
  minStage: 7,
  posable: false,
  instruction: MENTAL,
  build: (rng) => {
    const rang = rngInt(rng, 1, 3);
    const diviseur = Math.pow(10, rang);
    // Au plus trois décimales dans le résultat.
    const places = 3 - rang;
    let a = places === 0 || rng() < 0.5 ? rngInt(rng, 2, 999) : decimalAleatoire(rng, 0, 99, rngInt(rng, 1, places));
    // Pas de multiple du diviseur (« 470 ÷ 10 ») : c'est ce qui se fait au CM, avec un brouillon.
    while (Number.isInteger(a) && a % diviseur === 0) a = rngInt(rng, 2, 999);
    return operation(a, diviseur, '÷', arrondiA(a / diviseur), true);
  },
  erreurs: ({ a, b, result }) => [result * 10, result / 10, a * b, a, arrondiA(a / (b / 10)), arrondiA(a / (b * 10))],
  explication: ({ b }) =>
    `Diviser par ${b}, c'est décaler la virgule de ${String(b).length - 1} rang${b > 10 ? 's' : ''} vers la gauche.`,
};

const multiplesDeDixCentMille: Technique = {
  name: 'mult-multiples',
  minStage: 7,
  posable: false,
  build: (rng) => {
    // Au plus quatre zéros en tout : 30 × 400, 600 × 50, 2 000 × 30.
    const [rangA, rangB] = rngPick(rng, [[1, 1], [1, 2], [2, 1], [2, 2], [1, 3], [3, 1]] as [number, number][]);
    const a = rngInt(rng, 2, 9) * Math.pow(10, rangA);
    const b = rngInt(rng, 2, 9) * Math.pow(10, rangB);
    return operation(a, b, '×', a * b);
  },
  erreurs: ({ a, b, result }) => [result * 10, result / 10, result * 100, result / 100, a + b],
  explication: ({ a, b, result }) => {
    const [baseA, baseB] = [Number(String(a).replace(/0+$/, '')), Number(String(b).replace(/0+$/, ''))];
    return `${baseA} × ${baseB} = ${baseA * baseB}, puis on ajoute les zéros : ${result}.`;
  },
};

// --- Les autres calculs : fractions, compléments, pourcentages --------------------------

const forme = (name: string, minStage: Stage, make: (rng: Rng) => Enonce): Brique => ({ name, minStage, make: (rng) => make(rng) });
const nombres = (valeurs: number[]) => valeurs.map(texte);

const NOMS_DES_FRACTIONS: Record<number, { un: string; pluriel: string }> = {
  3: { un: 'tiers', pluriel: 'tiers' },
  4: { un: 'quart', pluriel: 'quarts' },
  5: { un: 'cinquième', pluriel: 'cinquièmes' },
  10: { un: 'dixième', pluriel: 'dixièmes' },
};
const NUMERATEURS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];

const fractionDUneQuantite = forme('fraction-quantite', 7, (rng) => {
  const denominateur = rngPick(rng, [2, 3, 4, 4, 5, 10]);
  const numerateur = denominateur === 2 ? 1 : rngInt(rng, 1, Math.min(denominateur - 1, 9));
  const part = rngInt(rng, 2, denominateur >= 10 ? 12 : 25);
  const a = denominateur * part;
  const reponse = numerateur * part;
  const dit =
    denominateur === 2
      ? 'La moitié'
      : numerateur === 1
        ? `Le ${NOMS_DES_FRACTIONS[denominateur].un}`
        : `Les ${NUMERATEURS[numerateur]} ${NOMS_DES_FRACTIONS[denominateur].pluriel}`;
  return {
    instruction: MENTAL,
    prompt: `${dit} de ${a}`,
    correct: String(reponse),
    // Le numérateur oublié, le produit par le numérateur ou par le dénominateur : « le quart de 36 » lu comme « 4 fois 36 ».
    wrong: nombres(
      fauxNombres(reponse, [part, a * numerateur, a * denominateur, a - reponse, reponse + part, reponse - part, reponse + 1], { min: 1 })
    ),
    explanation: `${a} ÷ ${denominateur} = ${part}${numerateur > 1 ? `, puis ${part} × ${numerateur} = ${reponse}` : ''}.`,
  };
});

const complement = forme('complement', 7, (rng) => {
  const sorte = rngPick(rng, ['cent', 'mille', 'un']);
  if (sorte === 'un') {
    const a = rngInt(rng, 1, 19) * 5 / 100;
    const reponse = arrondiA(1 - a, 2);
    return {
      instruction: 'Trouve le nombre qui manque',
      prompt: `${texte(a)} + … = 1`,
      correct: texte(reponse),
      wrong: nombres(fauxNombres(reponse, [reponse + 0.1, reponse - 0.1, reponse + 0.01, reponse - 0.01, 1 + a, a], { min: 0, decimales: 2 })),
      explanation: `${texte(a)} + ${texte(reponse)} = 1.`,
    };
  }
  const cible = sorte === 'cent' ? 100 : 1000;
  const a = sorte === 'cent' ? rngInt(rng, 1, 99) : rngInt(rng, 1, 199) * 5;
  const reponse = cible - a;
  return {
    instruction: 'Trouve le nombre qui manque',
    prompt: `${a} + … = ${cible}`,
    correct: String(reponse),
    wrong: nombres(fauxNombres(reponse, [reponse + 10, reponse - 10, reponse + 1, reponse - 1, ...echanges(reponse), reponse + 100, reponse - 100], { min: 1 })),
    explanation: `${a} + ${reponse} = ${cible}.`,
  };
});

// --- Le deuxième trimestre --------------------------------------------------------------------------

const multiplicationDeDeuxDecimaux: Technique = {
  name: 'mult-dec-dec',
  minStage: 8,
  posable: true,
  build: (rng) => {
    // Des petits décimaux un cas sur cinq : 0,5 × 0,5, où l'on se trompe de rang.
    const petits = rng() < 0.2;
    const [entierA, entierB] = petits ? [rngInt(rng, 2, 9), rngInt(rng, 2, 9)] : [rngInt(rng, 12, 399), rngInt(rng, 12, 99)];
    const [a, b] = [entierA / 10, entierB / 10];
    return operation(a, b, '×', arrondiA(a * b), true);
  },
  // La virgule mal placée (0,5 × 0,5 donne 2,5 : la plus courante), les parties entières et décimales multipliées à part.
  erreurs: ({ a, b, result }) => [
    result * 10,
    result / 10,
    result * 100,
    Math.floor(a) * Math.floor(b) + (apresLaVirgule(a) * apresLaVirgule(b)) / 100,
    result + 0.1,
    result - 0.1,
  ],
  explication: ({ a, b, result }) => {
    const produit = sansVirgule(a) * sansVirgule(b);
    const ecrit = (produit / 100).toFixed(2).replace('.', ',');
    return `On multiplie sans les virgules : ${sansVirgule(a)} × ${sansVirgule(b)} = ${produit}. Il y a 2 chiffres après les virgules : ${ecrit}${ecrit === texte(result) ? '' : `, soit ${texte(result)}`}.`;
  },
};

const divisionParDeuxChiffres: Technique = {
  name: 'div-ent',
  minStage: 8,
  posable: true,
  build: (rng) => {
    const diviseur = rngInt(rng, 11, 60);
    const quotient = rngInt(rng, 11, Math.min(99, Math.floor(9999 / diviseur)));
    return operation(diviseur * quotient, diviseur, '÷', quotient);
  },
  erreurs: ({ a, b }) => erreursQuotient(a, b),
  explication: ({ a, b, result }) => `On vérifie : ${b} × ${result} = ${a}.`,
};

const divisionEuclidienne = forme('div-euclid', 8, (rng) => {
  const diviseur = rng() < 0.5 ? rngInt(rng, 3, 9) : rngInt(rng, 11, 60);
  // Le dividende, reste compris, ne dépasse pas 999 (un chiffre au diviseur) ou 9 999.
  const quotient = rngInt(rng, 10, Math.floor(((diviseur < 10 ? 999 : 9999) - diviseur) / diviseur));
  const reste = rngInt(rng, 1, diviseur - 1);
  const a = diviseur * quotient + reste;
  const dit = (q: number, r: number) => `${q}, reste ${r}`;
  return {
    instruction: 'Division euclidienne : choisis le quotient et le reste',
    prompt: `${a} ÷ ${diviseur}`,
    correct: dit(quotient, reste),
    // Un reste plus grand que le diviseur : la division n'est pas finie.
    wrong: [
      dit(quotient - 1, reste + diviseur),
      dit(quotient, reste + 1),
      dit(quotient + 1, reste),
      dit(reste, quotient),
      dit(quotient, diviseur - reste),
      dit(quotient + 1, diviseur - reste),
    ],
    explanation: `${diviseur} × ${quotient} = ${diviseur * quotient}, et ${a} − ${diviseur * quotient} = ${reste}, plus petit que ${diviseur}.`,
  };
});

const priorites = forme('priorites', 8, (rng) => {
  const [a, b, c] = [rngInt(rng, 2, 20), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
  const sorte = rngInt(rng, 0, 3);
  let prompt: string;
  let reponse: number;
  let faux: number[];
  let regle: string;
  if (sorte === 0) {
    prompt = `${a} + ${b} × ${c}`;
    reponse = a + b * c;
    faux = [(a + b) * c, a * b + c, a + b + c, b * c];
    regle = `La multiplication d'abord : ${b} × ${c} = ${b * c}, puis ${a} + ${b * c} = ${reponse}.`;
  } else if (sorte === 1) {
    const premier = b * c + rngInt(rng, 2, 20);
    prompt = `${premier} - ${b} × ${c}`;
    reponse = premier - b * c;
    faux = [(premier - b) * c, premier - b - c, premier + b * c, b * c - premier];
    regle = `La multiplication d'abord : ${b} × ${c} = ${b * c}, puis ${premier} − ${b * c} = ${reponse}.`;
  } else if (sorte === 2) {
    prompt = `(${a} + ${b}) × ${c}`;
    reponse = (a + b) * c;
    faux = [a + b * c, a * c + b, a + b + c, (a + b) + c * 2];
    regle = `Les parenthèses d'abord : ${a} + ${b} = ${a + b}, puis ${a + b} × ${c} = ${reponse}.`;
  } else {
    const grand = b + rngInt(rng, 1, 9);
    prompt = `${c} × (${grand} - ${b})`;
    reponse = c * (grand - b);
    faux = [c * grand - b, c * grand - c * b + c, c * grand, grand - b + c];
    regle = `Les parenthèses d'abord : ${grand} − ${b} = ${grand - b}, puis ${c} × ${grand - b} = ${reponse}.`;
  }
  return {
    instruction: 'Calcule. Pense aux priorités',
    prompt,
    correct: String(reponse),
    wrong: nombres(fauxNombres(reponse, faux, { min: 0 })),
    explanation: regle,
  };
});

const fraction = (numerateur: number, denominateur: number) => `${numerateur}/${denominateur}`;
const memeValeur = (n1: number, d1: number, n2: number, d2: number) => n1 * d2 === n2 * d1;

const sommeDeFractions = forme('fractions-add', 8, (rng) => {
  for (;;) {
    const memeDenominateur = rng() < 0.55;
    const [da, db] = memeDenominateur
      ? ((d) => [d, d])(rngPick(rng, [3, 4, 5, 6, 8, 10]))
      : rngPick(rng, [[2, 4], [4, 2], [2, 6], [6, 2], [3, 6], [6, 3], [2, 8], [8, 2], [4, 8], [8, 4], [5, 10], [10, 5], [2, 10], [10, 2]]);
    const d = Math.max(da, db);
    const [na, nb] = [rngInt(rng, 1, Math.max(1, da - 1)), rngInt(rng, 1, Math.max(1, db - 1))];
    const plus = rng() < 0.6;
    const [ma, mb] = [na * (d / da), nb * (d / db)];
    const numerateur = plus ? ma + mb : ma - mb;
    if (numerateur <= 0 || pgcd(numerateur, d) !== 1 || (da === db && !plus && na === nb)) continue;
    const correct = fraction(numerateur, d);
    // Les numérateurs et les dénominateurs combinés (1/2 + 1/3 = 2/5), l'opération inversée,
    // les numérateurs combinés sans changer de dénominateur, une seule des deux fractions.
    const combine = (x: number, y: number) => (plus ? x + y : Math.abs(x - y));
    const candidats: [number, number][] = [
      [combine(na, nb), combine(da, db) || d + 1],
      [combine(na, nb), d],
      [plus ? Math.abs(na - nb) : na + nb, d],
      [numerateur, da * db],
      [numerateur + 1, d],
      [numerateur - 1, d],
      [na, d],
      [nb, d],
      [numerateur, d + 1],
    ];
    const wrong = candidats
      .filter(([n, den]) => n > 0 && den > 0 && !memeValeur(n, den, numerateur, d))
      .map(([n, den]) => fraction(n, den));
    const premier = fraction(na, da);
    const second = fraction(nb, db);
    return {
      instruction: 'Calcule',
      prompt: `${premier} ${plus ? '+' : '-'} ${second}`,
      correct,
      wrong,
      explanation:
        da === db
          ? `Même dénominateur : on garde ${d} et on ${plus ? 'ajoute' : 'retranche'} les numérateurs : ${plus ? `${na} + ${nb}` : `${na} − ${nb}`} = ${numerateur}.`
          : `On écrit les deux fractions avec le dénominateur ${d} : ${da < db ? `${premier} = ${fraction(ma, d)}` : `${second} = ${fraction(mb, d)}`}. On calcule : ${fraction(ma, d)} ${plus ? '+' : '−'} ${fraction(mb, d)} = ${correct}.`,
    };
  }
});

const fractionFoisEntier = forme('fraction-fois-entier', 8, (rng) => {
  for (;;) {
    const [n, d] = [rngInt(rng, 2, 6), rngPick(rng, [3, 4, 5, 6, 8, 10])];
    const a = rngInt(rng, 1, d - 1);
    if (pgcd(n * a, d) !== 1) continue;
    const correct = fraction(n * a, d);
    // Le dénominateur multiplié lui aussi : on retrouve la fraction de départ.
    const candidats: [number, number][] = [[n * a, n * d], [a, n * d], [n + a, d], [n + a, n + d], [n * a, d + n], [n * a + 1, d]];
    return {
      instruction: 'Calcule',
      prompt: `${n} × ${fraction(a, d)}`,
      correct,
      wrong: candidats.filter(([num, den]) => !memeValeur(num, den, n * a, d)).map(([num, den]) => fraction(num, den)),
      explanation: `${n} × ${fraction(a, d)} = ${fraction(n * a, d)} : on multiplie le numérateur par ${n}.`,
    };
  }
});

/** Des nombres à prendre en pourcentage : le résultat est toujours entier. */
function pourcentageDe(pourcentage: number, rng: Rng): { a: number; reponse: number } {
  const pas: Record<number, number> = { 10: 10, 25: 4, 50: 2, 75: 4, 20: 5, 5: 20, 1: 100 };
  const a = pas[pourcentage] * rngInt(rng, pourcentage === 1 ? 1 : 2, pourcentage === 1 ? 9 : pourcentage >= 25 ? 30 : 40);
  return { a, reponse: (a * pourcentage) / 100 };
}

function pourcentage(name: string, minStage: Stage, valeurs: number[]): Brique {
  return forme(name, minStage, (rng) => {
    const p = rngPick(rng, valeurs);
    const { a, reponse } = pourcentageDe(p, rng);
    return {
      instruction: MENTAL,
      prompt: `${p} % de ${a}`,
      correct: String(reponse),
      // Le pourcentage pris pour la réponse, le reste au lieu de la part, le double, la moitié.
      wrong: nombres(fauxNombres(reponse, [p, a - reponse, 2 * reponse, reponse / 2, a / 10, reponse + 10, reponse - 10], { min: 1 })),
      explanation:
        p === 50
          ? `50 %, c'est la moitié : ${a} ÷ 2 = ${reponse}.`
          : p === 25
            ? `25 %, c'est le quart : ${a} ÷ 4 = ${reponse}.`
            : p === 75
              ? `75 %, ce sont les trois quarts : ${a / 4} × 3 = ${reponse}.`
              : p === 10
                ? `10 %, c'est le dixième : ${a} ÷ 10 = ${reponse}.`
                : p === 20
                  ? `20 %, c'est le cinquième : ${a} ÷ 5 = ${reponse}.`
                  : p === 5
                    ? `5 %, c'est la moitié de 10 % : ${a / 10} ÷ 2 = ${reponse}.`
                    : `1 %, c'est le centième : ${a} ÷ 100 = ${reponse}.`,
    };
  });
}

// --- Le troisième trimestre ---------------------------------------------------------------------------

const divisionDecimaleParEntier: Technique = {
  name: 'div-dec-ent',
  minStage: 9,
  posable: true,
  build: (rng) => {
    const diviseur = rngInt(rng, 2, 9);
    const quotient = decimalAleatoire(rng, 1, 99, rngInt(rng, 1, 2));
    const a = arrondiA(quotient * diviseur, 2);
    return operation(a, diviseur, '÷', quotient, true);
  },
  erreurs: ({ a, b, result }) => [result * 10, result / 10, arrondiA(a - b), Math.floor(result), result + 0.1, result - 0.1, arrondiA(result + 0.01)],
  explication: ({ a, b, result }) => `${texte(result)} × ${b} = ${texte(a)}, donc ${texte(a)} ÷ ${b} = ${texte(result)}.`,
};

export const TECHNIQUES_6E: Technique[] = [
  additionEntiere,
  soustractionEntiere,
  multiplicationEntiere,
  divisionParUnChiffre,
  tableDeMultiplication('mult-table', 7, [2, 3, 4, 5, 6, 7, 8, 9, 10]),
  additionDecimale,
  soustractionDecimale,
  multiplicationDecimaleParEntier,
  multiplicationParPuissanceDe10,
  divisionParPuissanceDe10,
  multiplesDeDixCentMille,
  multiplicationDeDeuxDecimaux,
  divisionParDeuxChiffres,
  divisionDecimaleParEntier,
];

export const FORMES_6E: Brique[] = [
  fractionDUneQuantite,
  complement,
  divisionEuclidienne,
  priorites,
  sommeDeFractions,
  fractionFoisEntier,
  pourcentage('pourcentage', 8, [10, 25, 50, 75]),
  pourcentage('pourcentage-autres', 9, [20, 5, 1]),
];

export const BRIQUES_6E: Brique[] = [...TECHNIQUES_6E.map((technique) => briqueDeTechnique(technique)), ...FORMES_6E];

/** Les questions de calcul de la 6e. */
export function genererSixieme(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('calcul', BRIQUES_6E, stageOf(level, trimester), rng, count);
}
