import type { Level, Question, Trimester } from '../types';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { stageOf } from '../lib/progression';
import { droiteGraduee } from './figuresMaths';
import { ecritureChiffree } from './nombresEnLettres';
import { fabriquer, type Brique } from './mathsCommun';
import { autres, brique, dixieme, entre, faux, fixe, MOINS, nb, pgcd, puissance, puissanceDe, rat, relatif, sup, texteRat } from './mathsCycle4';

/**
 * La numération du collège : les nombres relatifs, les puissances, les
 * fractions, la divisibilité, l'écriture scientifique.
 *
 * La 5e suit le nouveau programme de cycle 4 (BO n° 10 du 5 mars 2026). La 4e
 * et la 3e suivent l'ancien (BO n° 31 du 30 juillet 2020), dont la répartition
 * par année vient des repères annuels de 2019. Quand une notion n'est pas
 * sûre (programmes/maths.md : [PROP], « À VÉRIFIER »), elle arrive le plus tard
 * possible : un élève de 3e qui revoit ce qu'il a déjà vu ne perd rien, un
 * élève de 4e à qui l'on pose ce qu'il n'a pas vu se trompe pour rien.
 *
 * Progression, cumulative dans le cycle (un élève de 3e revoit la 5e et la 4e) :
 * - 5e, 1er trimestre : l'opposé, la valeur absolue, la droite graduée des
 *   relatifs, comparer et ranger des relatifs ; le carré et le cube (carrés
 *   de 0 à 12, cubes de 0 à 5 et de 10) ; les critères de divisibilité par 3
 *   et par 9 ; les arrondis des décimaux ;
 * - 5e, 2e : comparer des fractions de dénominateurs quelconques ; la distance
 *   de deux points d'une droite graduée ; des fractions égales ;
 * - 5e, 3e : passer d'une fraction à un nombre décimal, à une fraction
 *   décimale, à un pourcentage ;
 * - 4e, 1er : le signe d'un produit de relatifs ; les puissances d'un nombre
 *   (exposant entier positif) et de 10 ; simplifier une fraction ; l'inverse ;
 * - 4e, 2e : les puissances d'un relatif ; le quotient de puissances de 10 ;
 *   a × 10ⁿ en écriture décimale ;
 * - 4e, 3e : ranger des fractions ;
 * - 3e, 1er : multiples et diviseurs, nombres premiers, décomposition en
 *   facteurs premiers, PGCD, fraction irréductible ; puissances d'exposant
 *   négatif, écriture scientifique, racine carrée ; −3² et (−3)² ;
 * - 3e, 2e : les règles de calcul sur les puissances ; encadrer une racine ;
 * - 3e, 3e : calculer en écriture scientifique.
 *
 * Hors programme, donc absent : la multiplication de relatifs en 5e, les puissances
 * d'exposant négatif et l'écriture scientifique avant la 3e, la racine carrée avant la 3e,
 * le PGCD et les nombres premiers avant la 3e.
 */

const relatifDecimal = (rng: Rng, max: number) => (rng() < 0.5 ? -1 : 1) * dixieme(rng, max);

/** « 4 + 2 + 7 + 5 = 18 » : la somme des chiffres d'un entier. */
const sommeDesChiffres = (n: number) => String(n).split('').map(Number).reduce((total, chiffre) => total + chiffre, 0);
const additionDesChiffres = (n: number) => `${String(n).split('').join(' + ')} = ${sommeDesChiffres(n)}`;

/** Une fraction « n/d » écrite. */
const ecritFraction = ([n, d]: [number, number]) => `${n}/${d}`;
const memeValeur = (n1: number, d1: number, n2: number, d2: number) => n1 * d2 === n2 * d1;

// === 5e, 1er trimestre (étape 10) =============================================================================

const oppose = brique('oppose', 10, (rng) => {
  const decimal = rng() < 0.3;
  const n = decimal ? relatifDecimal(rng, 60) : relatif(rng, 100);
  const decimales = decimal ? 2 : 0;
  const sorte = rngInt(rng, 0, 2);
  if (sorte === 2) {
    return {
      instruction: "Cherche l'opposé",
      prompt: `Quel est l'opposé de l'opposé de ${nb(n)} ?`,
      correct: nb(n),
      wrong: faux(n, [-n, n + 1, n - 1, 2 * n], { decimales }),
      explanation: `L'opposé de l'opposé d'un nombre est ce nombre : ${nb(n)}.`,
    };
  }
  // « l'opposé de n » et « le nombre qui a pour opposé n » ont la même réponse : −n.
  const [de, reponse] = [n, -n];
  // L'inverse, qu'on confond avec l'opposé : « −1/7 » pour −7.
  const inverses = !decimal && Math.abs(n) >= 2 ? [`${n < 0 ? MOINS : ''}1/${Math.abs(n)}`, `${n < 0 ? '' : MOINS}1/${Math.abs(n)}`] : [];
  return {
    instruction: "Cherche l'opposé",
    prompt: sorte === 0 ? `Quel est l'opposé de ${nb(de)} ?` : `Quel nombre a pour opposé ${nb(de)} ?`,
    correct: nb(reponse),
    wrong: [...faux(reponse, [-reponse, reponse * 10, reponse / 10, reponse + 1, reponse - 1], { decimales }), ...inverses.filter((e) => e !== nb(reponse))],
    explanation: `Deux nombres opposés sont à la même distance de zéro, de part et d'autre : ${nb(de)} et ${nb(-de)}.`,
  };
});

const valeurAbsolue = brique('valeur-absolue', 10, (rng) => {
  if (rngInt(rng, 0, 2) === 2) {
    let liste: number[] = [];
    while (new Set(liste.map(Math.abs)).size < 4 || !liste.some((n) => n < 0)) liste = Array.from({ length: 4 }, () => relatif(rng, 15));
    const plusLoin = liste.reduce((meilleur, n) => (Math.abs(n) > Math.abs(meilleur) ? n : meilleur));
    return {
      instruction: 'Compare les distances à zéro',
      prompt: `Quel nombre a la plus grande valeur absolue : ${liste.map(nb).join(', ')} ?`,
      correct: nb(plusLoin),
      wrong: liste.filter((n) => n !== plusLoin).map(nb),
      explanation: `Les valeurs absolues sont ${liste.map((n) => nb(Math.abs(n))).join(', ')} : la plus grande est celle de ${nb(plusLoin)}.`,
    };
  }
  const decimal = rng() < 0.3;
  const n = decimal ? relatifDecimal(rng, 60) : relatif(rng, 100);
  const absolu = Math.abs(n);
  return {
    instruction: 'Cherche la distance à zéro',
    prompt: rngInt(rng, 0, 1) === 0 ? `Quelle est la distance à zéro de ${nb(n)} ?` : `Quelle est la valeur absolue de ${nb(n)} ?`,
    correct: nb(absolu),
    wrong: faux(absolu, [-absolu, n, absolu + 1, absolu - 1, absolu * 10, absolu / 10], { decimales: decimal ? 2 : 0 }),
    explanation: `${nb(n)} est à ${nb(absolu)} unité${absolu > 1 ? 's' : ''} de zéro : sa valeur absolue est ${nb(absolu)}.`,
  };
});

const droiteDesRelatifs = brique('droite-relatifs', 10, (rng) => {
  const pas = rngPick(rng, [1, 1, 2, 5, 10, 0.5]);
  const debut = rngInt(rng, -9, 1) * pas;
  const rang = rngInt(rng, 1, 9);
  const valeur = debut + rang * pas;
  const fin = debut + 10 * pas;
  const etiquettes = { 0: nb(debut), 10: nb(fin) };
  return {
    detail: `${debut}-${pas}-${rang}`,
    instruction: `La droite est graduée de ${nb(pas)} en ${nb(pas)}`,
    prompt: 'Quel nombre indique la flèche ?',
    figure: droiteGraduee({ intervalles: 10, etiquettes, fleche: rang }, `Une droite graduée de ${etiquettes[0]} à ${etiquettes[10]}, avec dix intervalles.`),
    correct: nb(valeur),
    // La graduation voisine, l'opposé, et celle qu'on compte depuis l'autre bout.
    wrong: faux(valeur, [valeur - pas, valeur + pas, -valeur, fin - rang * pas, valeur + 2 * pas, valeur - 2 * pas], { decimales: 1 }),
    explanation: `On part de ${nb(debut)} et l'on avance de ${nb(pas)} en ${nb(pas)} : après ${rang} graduation${rang > 1 ? 's' : ''}, on lit ${nb(valeur)}.`,
  };
});

const comparerRelatifs = brique('comparer-relatifs', 10, (rng) => {
  if (rngInt(rng, 0, 7) === 0) {
    const x = relatifDecimal(rng, 30);
    return {
      instruction: 'Compare avec <, > ou =',
      prompt: `${nb(x)} … ${fixe(x, 2)}`,
      correct: '=',
      wrong: autres('='),
      howMany: 3,
      explanation: `Un zéro à la fin de la partie décimale ne change pas le nombre : ${nb(x)} = ${fixe(x, 2)}.`,
    };
  }
  const decimaux = rng() < 0.4;
  let [a, b] = [0, 0];
  while (a === b) [a, b] = decimaux ? [relatifDecimal(rng, 20), relatifDecimal(rng, 20)] : [rngInt(rng, -30, 30), rngInt(rng, -30, 30)];
  const [petit, grand] = [Math.min(a, b), Math.max(a, b)];
  const regle =
    a < 0 && b < 0
      ? 'Entre deux nombres négatifs, le plus petit est le plus éloigné de zéro'
      : a < 0 || b < 0
        ? "Un nombre négatif est plus petit qu'un nombre positif"
        : 'On compare les parties entières, puis les dixièmes';
  const bonne = a < b ? '<' : '>';
  return {
    instruction: 'Compare avec <, > ou =',
    prompt: `${nb(a)} … ${nb(b)}`,
    correct: bonne,
    wrong: autres(bonne),
    howMany: 3,
    explanation: `${regle} : ${nb(petit)} < ${nb(grand)}.`,
  };
});

const rangerRelatifs = brique('ranger-relatifs', 10, (rng) => {
  let liste: number[] = [];
  while (new Set(liste).size < 4 || liste.every((n) => n >= 0) || liste.every((n) => n < 0)) liste = Array.from({ length: 4 }, () => rngInt(rng, -12, 12));
  const croissant = [...liste].sort((a, b) => a - b);
  const ecrit = (rangement: number[]) => rangement.map(nb).join(' < ');
  const negatifs = croissant.filter((n) => n < 0);
  const positifs = croissant.filter((n) => n >= 0);
  // Rangés par distance à zéro ; les négatifs lus comme des positifs ; l'ordre inversé ; deux voisins échangés.
  const candidats = [
    [...liste].sort((a, b) => Math.abs(a) - Math.abs(b)),
    [...[...negatifs].reverse(), ...positifs],
    [...croissant].reverse(),
    [...positifs, ...negatifs],
    ...[0, 1, 2].map((rang) => croissant.map((n, i) => (i === rang ? croissant[rang + 1] : i === rang + 1 ? croissant[rang] : n))),
  ];
  return {
    instruction: "Range dans l'ordre croissant",
    prompt: liste.map(nb).join(', '),
    correct: ecrit(croissant),
    wrong: candidats.map(ecrit),
    explanation: `Les négatifs sont les plus petits, et le plus éloigné de zéro est le plus petit : ${ecrit(croissant)}.`,
  };
});

const BASES_DES_CUBES = [0, 1, 2, 3, 4, 5, 10];

const carresEtCubes = brique('carres-cubes', 10, (rng) => {
  const sorte = rngInt(rng, 0, 7);
  if (sorte <= 1) {
    const n = rngInt(rng, 0, 12);
    return {
      instruction: 'Calcule',
      prompt: sorte === 0 ? `${n}²` : `Quel est le carré de ${n} ?`,
      correct: nb(n ** 2),
      wrong: faux(n ** 2, [2 * n, n + 2, n ** 3, n ** 2 + n, n ** 2 - n, n * 10 + 2], { min: 0 }),
      explanation: `${n}² = ${n} × ${n} = ${n ** 2}.`,
    };
  }
  if (sorte <= 3) {
    const n = rngPick(rng, BASES_DES_CUBES);
    return {
      instruction: 'Calcule',
      prompt: sorte === 2 ? `${n}³` : `Quel est le cube de ${n} ?`,
      correct: nb(n ** 3),
      wrong: faux(n ** 3, [3 * n, n ** 2, n ** 4, 3 ** n, n ** 3 + n, n * n * 2], { min: 0 }),
      explanation: `${n}³ = ${n} × ${n} × ${n} = ${n ** 3}.`,
    };
  }
  if (sorte <= 5) {
    const [n, facteurs] = [rngInt(rng, 2, 12), sorte === 4 ? 2 : 3];
    return {
      instruction: 'Écris avec une puissance',
      prompt: Array.from({ length: facteurs }, () => String(n)).join(' × '),
      correct: puissance(n, facteurs),
      wrong: [puissance(facteurs, n), puissance(n, facteurs + 1), puissance(n, facteurs - 1 || 4), nb(facteurs * n)],
      explanation: `${facteurs} facteurs égaux à ${n} : on écrit ${puissance(n, facteurs)}, ${facteurs === 2 ? 'le carré' : 'le cube'} de ${n}.`,
    };
  }
  const n = rngInt(rng, 2, 12);
  const exposant = rngInt(rng, 2, 3);
  const produit = (facteurs: number) => Array.from({ length: facteurs }, () => String(n)).join(' × ');
  return {
    instruction: "Écris sous la forme d'un produit",
    prompt: puissance(n, exposant),
    correct: produit(exposant),
    // Le produit de la base par l'exposant, la somme au lieu du produit, un facteur de trop ou de moins.
    wrong: [`${n} × ${exposant}`, Array.from({ length: exposant }, () => String(n)).join(' + '), produit(exposant + 1), produit(exposant + 2), ...(exposant > 2 ? [produit(exposant - 1)] : [])],
    explanation: `${puissance(n, exposant)} : ${exposant} facteurs égaux à ${n}, soit ${produit(exposant)}.`,
  };
});

/** Un entier entre `min` et `max` qui vérifie `accepte`. */
function entierParmi(rng: Rng, min: number, max: number, accepte: (n: number) => boolean): number {
  for (let essai = 0; essai < 1000; essai++) {
    const n = rngInt(rng, min, max);
    if (accepte(n)) return n;
  }
  throw new Error('Aucun nombre trouvé');
}

const divisibilite = brique('divisibilite', 10, (rng) => {
  const sorte = rngPick(rng, ['3', '9', '3 pas 9']);
  const [verifie, dit, regle] =
    sorte === '3'
      ? [(n: number) => n % 3 === 0, 'divisible par 3', 'multiple de 3']
      : sorte === '9'
        ? [(n: number) => n % 9 === 0, 'divisible par 9', 'multiple de 9']
        : [(n: number) => n % 3 === 0 && n % 9 !== 0, 'divisible par 3 mais pas par 9', 'multiple de 3 mais pas de 9'];
  const bon = entierParmi(rng, 150, 9500, verifie);
  // Le piège : divisible par 3 quand on cherche 9, par 9 quand on cherche « 3 mais pas 9 », par 2 ou 5 sinon.
  const voisins = [1, 2, 3, 6, 9, 10, 11, 18, 27, 30, 33].flatMap((pas) => [bon + pas, bon - pas]).filter((n) => n >= 100 && n <= 9999 && !verifie(n));
  const pieges = voisins.filter((n) => (sorte === '9' ? n % 3 === 0 : sorte === '3 pas 9' ? n % 9 === 0 : n % 2 === 0 || n % 5 === 0));
  const simples = voisins.filter((n) => !pieges.includes(n));
  const mauvais = [...rngShuffle(rng, pieges).slice(0, 1), ...rngShuffle(rng, simples)].slice(0, 3);
  return {
    instruction: 'Utilise le critère de divisibilité',
    prompt: `Lequel de ces nombres est ${dit} ?`,
    correct: ecritureChiffree(bon),
    wrong: mauvais.map(ecritureChiffree),
    explanation: `${additionDesChiffres(bon)}. ${sommeDesChiffres(bon)} est un ${regle}.`,
  };
});

const chiffreManquant = brique('chiffre-manquant', 10, (rng) => {
  const neuf = rng() < 0.6;
  const modulo = neuf ? 9 : 3;
  for (;;) {
    const chiffres = Array.from({ length: rngInt(rng, 3, 4) }, (_, rang) => rngInt(rng, rang === 0 ? 1 : 0, 9));
    const place = rngInt(rng, 1, chiffres.length - 1);
    const reste = chiffres.reduce((total, chiffre, rang) => (rang === place ? total : total + chiffre), 0);
    const tous = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const valables = tous.filter((x) => (reste + x) % modulo === 0);
    // Pour 9, un seul chiffre convient (pas 0 et 9 à la fois). Pour 3, on cherche le plus petit.
    if (neuf && valables.length !== 1) continue;
    const invalides = tous.filter((x) => !valables.includes(x));
    // Les pièges : de bons chiffres pour 3 mais pas pour 9, ou de bons chiffres qui ne sont pas les plus petits.
    const pieges = neuf ? invalides.filter((x) => (reste + x) % 3 === 0) : valables.slice(1);
    const mauvais = [...rngShuffle(rng, pieges).slice(0, 2), ...rngShuffle(rng, invalides.filter((x) => !pieges.includes(x)))].slice(0, 3);
    const bon = valables[0];
    const ecrit = chiffres.map((chiffre, rang) => (rang === place ? '*' : String(chiffre))).join('');
    return {
      instruction: `Utilise le critère de divisibilité par ${modulo}`,
      prompt: neuf
        ? `Par quel chiffre remplacer * pour que ${ecrit} soit divisible par 9 ?`
        : `Quel est le plus petit chiffre à mettre à la place de * pour que ${ecrit} soit divisible par 3 ?`,
      correct: String(bon),
      wrong: mauvais.map(String),
      explanation: `Les autres chiffres ont pour somme ${reste}. Avec ${bon}, la somme devient ${reste + bon}, un multiple de ${modulo}.`,
    };
  }
});

const RANGS_DE_L_ARRONDI = ["à l'unité", 'au dixième', 'au centième', 'au millième'];

const arrondi = brique('arrondi', 10, (rng) => {
  const rang = rngInt(rng, 0, 3);
  const decimales = Math.min(4, rang + rngInt(rng, 1, 2));
  const echelle = 10 ** decimales;
  let apres = rngInt(rng, 1, echelle - 1);
  while (apres % 10 === 0) apres = rngInt(rng, 1, echelle - 1);
  const n = rngInt(rng, 0, 99) * echelle + apres;
  /** Le nombre n/echelle arrondi à `r` décimales, en entiers de 10^-r, la règle de l'école : 5 ou plus, on monte. */
  const arrondiA = (r: number) => Math.floor((n + 10 ** (decimales - r) / 2) / 10 ** (decimales - r));
  const ecrit = (valeurEntiere: number, r: number) => fixe(valeurEntiere / 10 ** r, r);
  const juste = arrondiA(rang);
  const suivant = Math.floor(apres / 10 ** (decimales - rang - 1)) % 10;
  // Le nombre tronqué, un dernier chiffre de trop ou de moins, l'arrondi à un autre rang.
  const candidats: [number, number][] = [
    [Math.floor(n / 10 ** (decimales - rang)), rang],
    [juste + 1, rang],
    [juste - 1, rang],
    [n, decimales],
    ...(rang > 0 ? ([[arrondiA(rang - 1), rang - 1]] as [number, number][]) : []),
    ...(rang + 1 < decimales ? ([[arrondiA(rang + 1), rang + 1]] as [number, number][]) : []),
    [juste + 2, rang],
  ];
  return {
    instruction: `Arrondis ${RANGS_DE_L_ARRONDI[rang]}`,
    prompt: fixe(n / echelle, decimales),
    correct: ecrit(juste, rang),
    // Un autre rang qui donnerait la même valeur (12,30 et 12,3) n'est pas une erreur : c'est la même réponse, et deux erreurs égales n'en font qu'une.
    wrong: candidats
      .filter(([valeurEntiere, r], rangDuCandidat) => valeurEntiere / 10 ** r !== juste / 10 ** rang && valeurEntiere >= 0 && candidats.findIndex(([autre, ar]) => autre / 10 ** ar === valeurEntiere / 10 ** r) === rangDuCandidat)
      .map(([valeurEntiere, r]) => ecrit(valeurEntiere, r)),
    explanation: `Le chiffre suivant est ${suivant} : on ${suivant >= 5 ? 'augmente le dernier chiffre de 1' : 'garde le dernier chiffre'}. On obtient ${ecrit(juste, rang)}.`,
  };
});

// === 5e, 2e trimestre (étape 11) =============================================================================

/** Une fraction de dénominateur de 2 à 12, entre 0 et 2, jamais égale à 1. */
function uneFraction(rng: Rng): [number, number] {
  const d = rngInt(rng, 2, 12);
  let n = d;
  while (n === d) n = rngInt(rng, 1, 2 * d - 1);
  return [n, d];
}

const comparerFractions = brique('comparer-fractions', 11, (rng) => {
  const sorte = rngInt(rng, 0, 3);
  if (sorte <= 1) {
    let [[n1, d1], [n2, d2]] = [uneFraction(rng), uneFraction(rng)];
    if (rngInt(rng, 0, 4) === 0) {
      // Deux écritures de la même fraction : 2/3 et 8/12.
      const d = rngInt(rng, 2, 6);
      let n = d;
      while (n === d) n = rngInt(rng, 1, 2 * d - 1);
      const k = rngInt(rng, 2, Math.floor(12 / d));
      [n1, d1, n2, d2] = [n, d, n * k, d * k];
    }
    while (n1 === n2 && d1 === d2) [n2, d2] = uneFraction(rng);
    const bonne = memeValeur(n1, d1, n2, d2) ? '=' : n1 * d2 < n2 * d1 ? '<' : '>';
    const commun = d1 * d2;
    return {
      instruction: 'Compare avec <, > ou =',
      prompt: `${n1}/${d1} … ${n2}/${d2}`,
      correct: bonne,
      wrong: autres(bonne),
      howMany: 3,
      explanation: `Avec le même dénominateur ${commun} : ${n1}/${d1} = ${n1 * d2}/${commun} et ${n2}/${d2} = ${n2 * d1}/${commun}.`,
    };
  }
  // La plus grande ou la plus petite de quatre fractions, toutes de valeurs différentes.
  let fractions: [number, number][] = [];
  while (new Set(fractions.map(([n, d]) => n / d)).size < 4) fractions = Array.from({ length: 4 }, () => uneFraction(rng));
  const plusGrande = sorte === 2;
  const meilleure = fractions.reduce((a, b) => ((a[0] * b[1] > b[0] * a[1]) === plusGrande ? a : b));
  return {
    instruction: plusGrande ? 'Cherche la plus grande fraction' : 'Cherche la plus petite fraction',
    prompt: `Quelle est ${plusGrande ? 'la plus grande' : 'la plus petite'} de ces fractions : ${fractions.map(ecritFraction).join(', ')} ?`,
    correct: ecritFraction(meilleure),
    wrong: fractions.filter((f) => f !== meilleure).map(ecritFraction),
    explanation: `En valeurs décimales : ${fractions.map(([n, d]) => `${ecritFraction([n, d])} ≈ ${nb(Math.round((n / d) * 100) / 100)}`).join(', ')}.`,
  };
});

const distanceSurUneDroite = brique('distance-droite', 11, (rng) => {
  const decimaux = rng() < 0.25;
  let [a, b] = [0, 0];
  while (a === b) [a, b] = decimaux ? [relatifDecimal(rng, 20), relatifDecimal(rng, 20)] : [rngInt(rng, -20, 20), rngInt(rng, -20, 20)];
  const [p, q] = rngPick(rng, [['A', 'B'], ['M', 'N'], ['E', 'F'], ['P', 'Q'], ['R', 'S'], ['K', 'L']]);
  const distance = Math.abs(a - b);
  return {
    instruction: 'Cherche la distance entre deux points',
    prompt: `Sur une droite graduée, le point ${p} a pour abscisse ${nb(a)} et le point ${q} a pour abscisse ${nb(b)}. Quelle est la distance ${p}${q} ?`,
    correct: nb(distance),
    // L'écart des valeurs absolues, la somme des valeurs absolues, la somme des abscisses.
    wrong: faux(distance, [Math.abs(Math.abs(a) - Math.abs(b)), Math.abs(a) + Math.abs(b), -distance, a + b, distance + 1, distance - 1], { decimales: decimaux ? 1 : 0, min: 0 }),
    explanation: `La distance est ${nb(Math.max(a, b))} − ${entre(Math.min(a, b))} = ${nb(distance)}.`,
  };
});

const fractionsEgales = brique('fractions-egales', 11, (rng) => {
  let [n, d] = [0, 0];
  while (n >= d || pgcd(n, d) !== 1) [n, d] = [rngInt(rng, 1, 11), rngInt(rng, 2, 12)];
  const k = rngInt(rng, 2, 9);
  const correct = `${n * k}/${d * k}`;
  // Le même nombre ajouté en haut et en bas, un seul des deux termes multiplié.
  const wrong = [`${n + k}/${d + k}`, `${n * k}/${d}`, `${n}/${d * k}`, `${n * k}/${d + k}`, `${n + k}/${d * k}`, `${n * k + 1}/${d * k}`, `${n * k}/${d * k + 1}`].filter((f) => {
    const [x, y] = f.split('/').map(Number);
    return !memeValeur(x, y, n, d);
  });
  return {
    instruction: 'Cherche une fraction égale',
    prompt: `Quelle fraction est égale à ${n}/${d} ?`,
    correct,
    wrong,
    explanation: `On multiplie le numérateur et le dénominateur par ${k} : ${n}/${d} = ${correct}.`,
  };
});

// === 5e, 3e trimestre (étape 12) ===============================================================================

const DENOMINATEURS_DECIMAUX = [2, 4, 5, 8, 10, 20, 25, 50];
/** Les dénominateurs dont les fractions s'écrivent en centièmes : pas de huitièmes. */
const DENOMINATEURS_EN_CENTIEMES = [2, 4, 5, 10, 20, 25, 50];

const ecrituresDUnNombre = brique('ecritures-nombre', 12, (rng) => {
  const sorte = rngInt(rng, 0, 4);
  const d = rngPick(rng, sorte === 3 ? DENOMINATEURS_EN_CENTIEMES : DENOMINATEURS_DECIMAUX);
  const n = rngInt(rng, 1, d - 1);
  const decimal = n / d;
  const pourcent = (100 * n) / d;
  if (sorte === 0) {
    return {
      instruction: "Cherche l'écriture décimale",
      prompt: `${n}/${d}`,
      correct: nb(decimal),
      wrong: [`${n},${d}`, `0,${n}${d}`, nb(decimal * 10), nb(decimal / 10), nb(1 - decimal)].filter((e) => e !== nb(decimal)),
      explanation: `${n}/${d} = ${n} ÷ ${d} = ${nb(decimal)}.`,
    };
  }
  if (sorte === 1) {
    return {
      instruction: 'Cherche le pourcentage',
      prompt: `${n}/${d}`,
      correct: `${nb(pourcent)} %`,
      wrong: faux(pourcent, [decimal, n + d, 100 - pourcent, pourcent * 2, pourcent / 2, d - n, n], { min: 0, decimales: 1 }).map((x) => `${x} %`),
      explanation: `${n}/${d} = ${nb(decimal)} = ${nb(pourcent)} %.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Cherche le pourcentage',
      prompt: nb(decimal),
      correct: `${nb(pourcent)} %`,
      wrong: faux(pourcent, [decimal, decimal * 10, decimal / 10, pourcent * 10, pourcent / 10], { min: 0, decimales: 2 }).map((x) => `${x} %`),
      explanation: `${nb(decimal)} = ${nb(pourcent)}/100 = ${nb(pourcent)} %.`,
    };
  }
  if (sorte === 3) {
    // Une fraction décimale : 35/100, jamais « 7/20 » parmi les propositions.
    const centiemes = Math.round(decimal * 100);
    return {
      instruction: 'Écris en fraction décimale',
      prompt: nb(decimal),
      correct: `${centiemes}/100`,
      wrong: [`${centiemes}/10`, `${centiemes}/1000`, `${centiemes + 1}/100`, `1/${centiemes}`, `${nb(decimal * 10)}/10`].filter((f) => f !== `${centiemes}/100` && !f.includes(',')),
      explanation: `${nb(decimal)} se lit ${centiemes} centièmes : ${centiemes}/100.`,
    };
  }
  const simple = rat(Math.round(pourcent * 2), 200);
  return {
    instruction: 'Cherche la fraction la plus simple',
    prompt: `${nb(pourcent)} %`,
    correct: texteRat(simple),
    wrong: [`1/${Math.round(pourcent)}`, `${simple.d}/${simple.n}`, `${Math.min(simple.n + 1, simple.d - 1)}/${simple.d}`, `${simple.n}/${simple.d + 1}`, `${simple.n + 1}/${simple.d + 1}`].filter((f) => {
      const [x, y] = f.split('/').map(Number);
      return x > 0 && y > 0 && !memeValeur(x, y, simple.n, simple.d);
    }),
    explanation: `${nb(pourcent)} % = ${nb(pourcent)}/100 = ${texteRat(simple)}.`,
  };
});

// === 4e, 1er trimestre (étape 13) ================================================================================

const signeDUnProduit = brique('signe-produit', 13, (rng) => {
  const positif = rng() < 0.5;
  /** Un produit de deux à quatre facteurs, dont le signe est celui qu'on veut et dont un facteur au moins est négatif : on ne devine pas le signe aux parenthèses. */
  const produit = (voulu: boolean): string => {
    const facteurs = rngInt(rng, 2, 4);
    const negatifs = rngPick(rng, Array.from({ length: facteurs + 1 }, (_, k) => k).filter((k) => k > 0 && (k % 2 === 0) === voulu));
    const signes = rngShuffle(rng, Array.from({ length: facteurs }, (_, rang) => rang < negatifs));
    return signes.map((negatif) => entre(negatif ? -rngInt(rng, 2, 9) : rngInt(rng, 2, 9))).join(' × ');
  };
  const correct = produit(positif);
  const mauvais = new Set<string>();
  while (mauvais.size < 3) {
    const autre = produit(!positif);
    if (autre !== correct) mauvais.add(autre);
  }
  const negatifs = correct.split('(').length - 1;
  return {
    instruction: positif ? 'Cherche le produit positif' : 'Cherche le produit négatif',
    prompt: positif ? 'Lequel de ces produits est positif ?' : 'Lequel de ces produits est négatif ?',
    correct,
    wrong: [...mauvais],
    explanation: `Il y a ${negatifs} facteur${negatifs > 1 ? 's' : ''} négatif${negatifs > 1 ? 's' : ''}, un nombre ${negatifs % 2 === 0 ? 'pair, donc le produit est positif' : 'impair, donc le produit est négatif'}.`,
  };
});

const puissanceDUnNombre = brique('puissance', 13, (rng) => {
  const base = rngInt(rng, 2, 10);
  const exposant = rngInt(rng, 2, base <= 3 ? 7 : base <= 5 ? 5 : 4);
  const valeur = base ** exposant;
  const dit = rngInt(rng, 0, 2);
  return {
    instruction: 'Calcule',
    prompt: dit === 0 ? puissance(base, exposant) : dit === 1 ? `Quelle est la valeur de ${puissance(base, exposant)} ?` : `${puissance(base, exposant)} = …`,
    correct: nb(valeur),
    // La base fois l'exposant, l'exposant au lieu de la base, un facteur de plus ou de moins.
    wrong: faux(valeur, [base * exposant, exposant ** base, base ** (exposant - 1), base ** (exposant + 1), base + exposant, valeur + base, valeur - base], { min: 0 }),
    explanation: `${puissance(base, exposant)} = ${Array.from({ length: exposant }, () => base).join(' × ')} = ${nb(valeur)}.`,
  };
});

const puissancesDeDix = brique('puissances-de-dix', 13, (rng) => {
  const sorte = rngInt(rng, 0, 3);
  // Écrit sans exposant, le produit tient en neuf zéros au plus : on les compte d'un coup d'œil.
  const n = rngInt(rng, 1, sorte === 3 ? 6 : 9);
  const m = rngInt(rng, 1, sorte === 3 ? 9 - n : 9);
  const zeros = (k: number) => `${k} zéro${k > 1 ? 's' : ''}`;
  if (sorte === 0) {
    return {
      instruction: 'Écris sans exposant',
      prompt: puissance(10, n),
      correct: ecritureChiffree(10 ** n),
      wrong: [ecritureChiffree(10 ** (n - 1)), ecritureChiffree(10 ** (n + 1)), nb(10 * n), `${n}0`, ecritureChiffree(10 ** n / 10 + 1)].filter((e) => e !== ecritureChiffree(10 ** n)),
      explanation: `${puissance(10, n)} s'écrit avec un 1 suivi de ${zeros(n)} : ${ecritureChiffree(10 ** n)}.`,
    };
  }
  if (sorte === 1) {
    return {
      instruction: 'Écris avec une puissance de 10',
      prompt: ecritureChiffree(10 ** n),
      correct: puissance(10, n),
      wrong: [puissance(10, n - 1), puissance(10, n + 1), puissance(n, 10), nb(10 * n)],
      explanation: `${ecritureChiffree(10 ** n)} : un 1 suivi de ${zeros(n)}, soit ${puissance(10, n)}.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Écris avec une seule puissance de 10',
      prompt: `${puissance(10, n)} × ${puissance(10, m)}`,
      correct: puissance(10, n + m),
      wrong: [puissance(10, n * m), puissance(100, n + m), puissance(10, n + m + 1), puissance(10, n + m - 1), puissance(10, Math.abs(n - m) + 1)],
      explanation: `On additionne les exposants : ${n} + ${m} = ${n + m}.`,
    };
  }
  return {
    instruction: 'Écris sans exposant',
    prompt: `${puissance(10, n)} × ${puissance(10, m)}`,
    correct: ecritureChiffree(10 ** (n + m)),
    wrong: [ecritureChiffree(10 ** (n * m)), ecritureChiffree(10 ** (n + m - 1)), ecritureChiffree(10 ** (n + m + 1)), ecritureChiffree(100 * n * m), ecritureChiffree(10 * (n + m)), ecritureChiffree(10 ** (n + m + 2))].filter((e) => e !== ecritureChiffree(10 ** (n + m))),
    explanation: `${puissance(10, n)} × ${puissance(10, m)} = ${puissance(10, n + m)} : un 1 suivi de ${zeros(n + m)}.`,
  };
});

const simplifierUneFraction = brique('simplifier-fraction', 13, (rng) => {
  let [a, b] = [0, 0];
  while (a >= b || pgcd(a, b) !== 1) [a, b] = [rngInt(rng, 1, 11), rngInt(rng, 2, 12)];
  const k = rngInt(rng, 2, 9);
  const [n, d] = [a * k, b * k];
  // Une simplification qui s'arrête en chemin : égale, mais pas irréductible.
  const partiels = [2, 3, 5, 7].filter((p) => k % p === 0 && k / p >= 2).map((p) => `${n / p}/${d / p}`);
  const wrong = [...partiels.slice(0, 1), `${n}/${d}`, `${a + 1}/${b}`, `${a}/${b + 1}`, `${n - k}/${d - k}`, `${b}/${a}`].filter((f) => {
    const [x, y] = f.split('/').map(Number);
    return x > 0 && y > 0 && x !== y;
  });
  return {
    instruction: 'Simplifie la fraction',
    prompt: `Quelle fraction est égale à ${n}/${d} et ne peut plus être simplifiée ?`,
    correct: `${a}/${b}`,
    // Les fractions égales mais pas assez simplifiées sont de mauvaises réponses : l'énoncé dit « ne peut plus être simplifiée ».
    wrong,
    explanation: `${n} et ${d} sont tous deux divisibles par ${k} : ${n}/${d} = ${a}/${b}.`,
  };
});

const inverseDUnNombre = brique('inverse', 13, (rng) => {
  const sorte = rngInt(rng, 0, 4);
  if (sorte === 4) {
    const [n, avecVirgule] = rngPick(rng, [[2, '0,5'], [4, '0,25'], [5, '0,2'], [10, '0,1'], [20, '0,05']] as [number, string][]);
    return {
      instruction: "Cherche l'inverse",
      prompt: `Quel est l'inverse de ${avecVirgule} ?`,
      correct: String(n),
      wrong: [MOINS + avecVirgule, avecVirgule, MOINS + n, String(n + 1)],
      explanation: `${avecVirgule} × ${n} = 1 : l'inverse de ${avecVirgule} est ${n}.`,
    };
  }
  if (sorte === 3) {
    const n = rngInt(rng, 2, 20);
    const negatif = rng() < 0.4;
    const s = negatif ? MOINS : '';
    const contraire = negatif ? '' : MOINS;
    return {
      instruction: "Cherche l'inverse",
      prompt: `Quel est l'inverse de ${s}${n} ?`,
      correct: `${s}1/${n}`,
      wrong: [`${contraire}1/${n}`, `${contraire}${n}`, `${s}${n}`, `1/${n + 1}`],
      explanation: `${s}${n} × ${s}1/${n} = 1 : l'inverse de ${s}${n} est ${s}1/${n}.`,
    };
  }
  let [a, b] = [0, 0];
  while (a === b || pgcd(a, b) !== 1) [a, b] = [rngInt(rng, 1, 12), rngInt(rng, 2, 12)];
  const negatif = sorte === 2;
  const s = negatif ? MOINS : '';
  const contraire = negatif ? '' : MOINS;
  return {
    instruction: "Cherche l'inverse",
    prompt: `Quel est l'inverse de ${s}${a}/${b} ?`,
    correct: `${s}${b}/${a}`,
    // L'opposé, la fraction elle-même, l'opposé de l'inverse, le complément à 1.
    wrong: [`${contraire}${a}/${b}`, `${s}${a}/${b}`, `${contraire}${b}/${a}`, ...(b > a ? [`${s}${b - a}/${b}`] : [`${s}${a}/${b + 1}`])],
    explanation: `${negatif ? `(${s}${a}/${b}) × (${s}${b}/${a})` : `${a}/${b} × ${b}/${a}`} = 1 : on échange le numérateur et le dénominateur.`,
  };
});

// === 4e, 2e trimestre (étape 14) ================================================================================

const puissanceDUnRelatif = brique('puissance-relatif', 14, (rng) => {
  const base = -rngInt(rng, 2, 9);
  const exposant = rngInt(rng, 2, base >= -3 ? 5 : 3);
  const valeur = base ** exposant;
  return {
    instruction: 'Calcule',
    prompt: puissanceDe(base, exposant),
    correct: nb(valeur),
    // Le signe oublié, l'exposant pris pour un facteur, la puissance de l'opposé.
    wrong: faux(valeur, [-valeur, base * exposant, -(base * exposant), Math.abs(base) ** (exposant - 1), base ** (exposant + 1)]),
    explanation: `${puissanceDe(base, exposant)} = ${Array.from({ length: exposant }, () => entre(base)).join(' × ')} = ${nb(valeur)} : le résultat est ${valeur > 0 ? 'positif' : 'négatif'}, car l'exposant est ${exposant % 2 === 0 ? 'pair' : 'impair'}.`,
  };
});

const quotientDePuissancesDeDix = brique('quotient-puissances-dix', 14, (rng) => {
  const m = rngInt(rng, 3, 9);
  const n = rngInt(rng, 1, m - 1);
  const exposants = [m + n, Math.floor(m / n), m - n + 1, m - n - 1, m * n].filter((e) => e >= 1 && e !== m - n);
  return {
    instruction: 'Écris avec une seule puissance de 10',
    prompt: `${puissance(10, m)} ÷ ${puissance(10, n)}`,
    correct: puissance(10, m - n),
    wrong: [...new Set(exposants)].map((e) => puissance(10, e)),
    explanation: `On soustrait les exposants : ${m} − ${n} = ${m - n}.`,
  };
});

const produitParUnePuissanceDeDix = brique('produit-puissance-dix', 14, (rng) => {
  const mantisse = rngPick(rng, [() => rngInt(rng, 2, 99) / 10, () => rngInt(rng, 101, 999) / 100, () => rngInt(rng, 2, 9)])();
  const n = rngInt(rng, 1, 6);
  const valeur = Math.round(mantisse * 10 ** n * 1000) / 1000;
  return {
    instruction: 'Écris sans exposant',
    prompt: `${nb(mantisse)} × ${puissance(10, n)}`,
    correct: nb(valeur),
    // La virgule déplacée dans l'autre sens, d'un rang de trop ou de moins ; les zéros ajoutés sans déplacer la virgule.
    wrong: faux(valeur, [mantisse / 10 ** n, valeur * 10, valeur / 10, mantisse * n, Number(`${String(mantisse).replace('.', '')}${'0'.repeat(n)}`)], { min: 0, decimales: 6 }),
    explanation: `Multiplier par ${puissance(10, n)}, c'est décaler la virgule de ${n} rang${n > 1 ? 's' : ''} vers la droite : ${nb(valeur)}.`,
  };
});

// === 4e, 3e trimestre (étape 15) ================================================================================

const rangerDesFractions = brique('ranger-fractions', 15, (rng) => {
  let fractions: [number, number][] = [];
  while (new Set(fractions.map(([n, d]) => n / d)).size < 4) fractions = Array.from({ length: 4 }, () => uneFraction(rng));
  const croissant = [...fractions].sort((a, b) => a[0] * b[1] - b[0] * a[1]);
  const parNumerateur = [...fractions].sort((a, b) => a[0] - b[0]);
  const parDenominateur = [...fractions].sort((a, b) => b[1] - a[1]);
  const chaine = (liste: [number, number][]) => liste.map(ecritFraction).join(' < ');
  // Deux fractions voisines échangées : l'erreur d'un seul pas.
  const echanges = [0, 1, 2].map((rang) => chaine(croissant.map((f, i) => (i === rang ? croissant[rang + 1] : i === rang + 1 ? croissant[rang] : f))));
  return {
    instruction: "Range dans l'ordre croissant",
    prompt: fractions.map(ecritFraction).join(', '),
    correct: chaine(croissant),
    // Rangées par numérateur, par dénominateur, à l'envers, ou presque.
    wrong: [chaine(parNumerateur), chaine(parDenominateur), chaine([...croissant].reverse()), ...echanges],
    explanation: `En valeurs décimales : ${croissant.map(([n, d]) => `${ecritFraction([n, d])} ≈ ${nb(Math.round((n / d) * 100) / 100)}`).join(', ')}.`,
  };
});

// === 3e, 1er trimestre (étape 16) ================================================================================

const PREMIERS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149];
const estPremier = (n: number) => n > 1 && PREMIERS.every((p) => p >= n || n % p !== 0);
/** Des nombres qu'on prend pour des nombres premiers : impairs, sans diviseur évident. */
const FAUX_PREMIERS = [51, 57, 87, 91, 111, 119, 133, 143, 147];

/** Des nombres qui ne divisent pas `n`, les plus proches d'abord. */
const nonDiviseursProches = (n: number, pres: number) =>
  Array.from({ length: n - 3 }, (_, k) => k + 2)
    .filter((d) => n % d !== 0)
    .sort((a, b) => Math.abs(a - pres) - Math.abs(b - pres) || a - b);

const diviseurOuMultiple = brique('diviseur-multiple', 16, (rng) => {
  if (rng() < 0.5) {
    const n = rngInt(rng, 36, 360);
    const diviseurs = Array.from({ length: n }, (_, k) => k + 5).filter((d) => d < n && n % d === 0);
    if (diviseurs.length > 0) {
      const bon = rngPick(rng, diviseurs);
      return {
        instruction: 'Cherche un diviseur',
        prompt: `Quel nombre est un diviseur de ${n} ?`,
        correct: String(bon),
        wrong: nonDiviseursProches(n, bon).slice(0, 5).map(String),
        explanation: `${n} ÷ ${bon} = ${n / bon} : la division tombe juste, donc ${bon} est un diviseur de ${n}.`,
      };
    }
  }
  const k = rngInt(rng, 6, 19);
  const bon = k * rngInt(rng, 4, 25);
  const voisins = [bon + 1, bon - 1, bon + 2, bon - 2, bon + k - 1, bon - k + 1, bon + 10].filter((m) => m % k !== 0 && m > 0);
  return {
    instruction: 'Cherche un multiple',
    prompt: `Quel nombre est un multiple de ${k} ?`,
    correct: String(bon),
    wrong: voisins.map(String),
    explanation: `${bon} = ${k} × ${bon / k} : c'est un multiple de ${k}.`,
  };
});

const nombrePremier = brique('nombre-premier', 16, (rng) => {
  if (rng() < 0.3) {
    const premier = rngPick(rng, PREMIERS.filter((p) => p > 10 && p < 100));
    const fausses = rngShuffle(rng, FAUX_PREMIERS).slice(0, 3);
    const exemple = fausses[0];
    const diviseur = PREMIERS.find((p) => exemple % p === 0) as number;
    return {
      instruction: 'Cherche le nombre premier',
      prompt: 'Lequel de ces nombres est premier ?',
      correct: String(premier),
      wrong: fausses.map(String),
      explanation: `${premier} n'a que deux diviseurs : 1 et ${premier}. Les autres en ont davantage : par exemple, ${exemple} = ${diviseur} × ${exemple / diviseur}.`,
    };
  }
  const n = rngInt(rng, 20, 150);
  const premier = estPremier(n);
  const petit = PREMIERS.find((p) => n % p === 0) as number;
  const seulsDiviseurs = `Oui, ses seuls diviseurs sont 1 et ${n}`;
  const divisible = (p: number) => `Non, il est divisible par ${p}`;
  // De fausses raisons : un diviseur que le nombre n'a pas.
  const inexacts = rngShuffle(rng, [2, 3, 5, 7, 11].filter((p) => n % p !== 0)).map(divisible);
  return {
    instruction: 'Un nombre premier a exactement deux diviseurs',
    prompt: `Le nombre ${n} est-il premier ?`,
    correct: premier ? seulsDiviseurs : divisible(petit),
    wrong: premier ? inexacts.slice(0, 3) : [seulsDiviseurs, ...inexacts.slice(0, 2)],
    explanation: premier ? `Aucun nombre premier plus petit que ${Math.ceil(Math.sqrt(n))} ne divise ${n} : il est premier.` : `${n} = ${petit} × ${n / petit} : il a d'autres diviseurs que 1 et lui-même.`,
  };
});

/** Les facteurs premiers d'un entier, par ordre croissant, avec leurs répétitions : 84 → 2, 2, 3, 7. */
function facteursPremiers(n: number): number[] {
  const facteurs: number[] = [];
  let reste = n;
  for (let p = 2; reste > 1; p++) {
    while (reste % p === 0) {
      facteurs.push(p);
      reste /= p;
    }
  }
  return facteurs;
}

/** « 2² × 3 × 7 » : la décomposition en facteurs premiers, par ordre croissant. */
function ecritureDecomposee(n: number): string {
  const facteurs = facteursPremiers(n);
  return [...new Set(facteurs)]
    .map((p) => {
      const exposant = facteurs.filter((f) => f === p).length;
      return exposant === 1 ? String(p) : puissance(p, exposant);
    })
    .join(' × ');
}

const decomposition = brique('decomposition', 16, (rng) => {
  let n = 0;
  while (n < 12 || n > 300) n = Array.from({ length: rngInt(rng, 2, 4) }, () => rngPick(rng, [2, 2, 3, 3, 5, 7, 11])).reduce((produit, p) => produit * p, 1);
  const juste = ecritureDecomposee(n);
  const facteurs = facteursPremiers(n);
  const distincts = [...new Set(facteurs)];
  const produit = (liste: number[]) => liste.join(' × ');
  // Un facteur qui n'est pas premier ; un exposant oublié ; un facteur de trop ou de moins ; la décomposition d'un nombre voisin.
  const candidats = [
    ...(facteurs.length >= 3 ? [produit([facteurs[0] * facteurs[1], ...facteurs.slice(2)])] : []),
    ...(distincts.length < facteurs.length ? [produit(distincts)] : []),
    ...rngShuffle(rng, [2, 3, 5, 7]).slice(0, 2).map((p) => `${juste} × ${p}`),
    ...(facteurs.length >= 3 ? [produit(facteurs.slice(1))] : []),
    ...[1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6].map((ecart) => ecritureDecomposee(n + ecart)),
  ];
  return {
    instruction: 'Décompose en facteurs premiers',
    prompt: `Décompose ${n} en produit de facteurs premiers`,
    correct: juste,
    wrong: candidats.filter((c) => c.includes(' × ') && c !== juste),
    explanation: `On divise par 2, par 3, par 5… tant que c'est possible : ${n} = ${juste}.`,
  };
});

/** Les divisions de l'algorithme d'Euclide : « 126 = 84 × 1 + 42, 84 = 42 × 2 + 0 ». */
function etapesDEuclide(a: number, b: number): string[] {
  const etapes: string[] = [];
  let [x, y] = [Math.max(a, b), Math.min(a, b)];
  while (y !== 0) {
    etapes.push(`${x} = ${y} × ${Math.floor(x / y)} + ${x % y}`);
    [x, y] = [y, x % y];
  }
  return etapes;
}

const pgcdDeDeuxNombres = brique('pgcd', 16, (rng) => {
  let [p, q] = [0, 0];
  while (p === q || pgcd(p, q) !== 1 || etapesDEuclide(p, q).length > 4) [p, q] = [rngInt(rng, 2, 25), rngInt(rng, 2, 25)];
  const g = rngInt(rng, 2, 20);
  const [a, b] = [p * g, q * g];
  const diviseursCommuns = [2, 3, 5, 7].filter((d) => g % d === 0).map((d) => g / d);
  return {
    instruction: 'Cherche le plus grand diviseur commun',
    prompt: `Quel est le PGCD de ${a} et de ${b} ?`,
    correct: String(g),
    // Un diviseur commun qui n'est pas le plus grand, le PPCM, la différence, le double.
    wrong: faux(g, [...diviseursCommuns, p * q * g, Math.abs(a - b), g * 2, g + 1, g - 1], { min: 1, max: 100000 }),
    explanation: `Algorithme d'Euclide : ${etapesDEuclide(a, b).join(', ')}. Le dernier reste non nul est ${g}.`,
  };
});

const fractionIrreductible = brique('fraction-irreductible', 16, (rng) => {
  let [p, q] = [0, 0];
  while (p >= q || pgcd(p, q) !== 1) [p, q] = [rngInt(rng, 2, 19), rngInt(rng, 3, 24)];
  const g = rngInt(rng, 3, 24);
  const [n, d] = [p * g, q * g];
  // Une simplification qui s'arrête en chemin : égale, mais pas irréductible.
  const partiels = [2, 3, 5].filter((f) => g % f === 0 && g / f >= 2).map((f) => `${n / f}/${d / f}`);
  return {
    instruction: 'Rends la fraction irréductible',
    prompt: `${n}/${d}`,
    correct: `${p}/${q}`,
    wrong: [...partiels.slice(0, 1), `${p + 1}/${q}`, `${p}/${q + 1}`, `${q}/${p}`, `${n - g}/${d - g}`, `${p * 2}/${q * 2}`],
    explanation: `PGCD(${n}, ${d}) = ${g}. On divise le numérateur et le dénominateur par ${g} : ${p}/${q}.`,
  };
});

const puissanceDExposantNegatif = brique('puissance-negative', 16, (rng) => {
  const sorte = rngInt(rng, 0, 2);
  const n = rngInt(rng, 1, 7);
  const decimal = `0,${'0'.repeat(n - 1)}1`;
  if (sorte === 0) {
    return {
      instruction: 'Écris sous forme décimale',
      prompt: puissance(10, -n),
      correct: decimal,
      wrong: [`0,${'0'.repeat(n)}1`, `0,${'0'.repeat(Math.max(0, n - 2))}1`, `${MOINS}${ecritureChiffree(10 ** n)}`, `${MOINS}${decimal}`].filter((e) => e !== decimal),
      explanation: `${puissance(10, -n)} = 1/${ecritureChiffree(10 ** n)} = ${decimal}.`,
    };
  }
  if (sorte === 1) {
    return {
      instruction: 'Écris avec une puissance de 10',
      prompt: decimal,
      correct: puissance(10, -n),
      wrong: [puissance(10, -n - 1), puissance(10, -n + 1 || 1), puissance(10, n), puissance(10, -n * 2), puissance(10, -n - 2), puissance(10, 2 * n)].filter((e) => e !== puissance(10, -n)),
      explanation: `${decimal} = 1/${ecritureChiffree(10 ** n)} = ${puissance(10, -n)}.`,
    };
  }
  const base = rngPick(rng, [2, 3, 4, 5, 10]);
  const exposant = rngInt(rng, 1, base === 10 ? 3 : base >= 4 ? 2 : 4);
  const denominateur = base ** exposant;
  return {
    instruction: 'Calcule',
    prompt: puissance(base, -exposant),
    correct: `1/${denominateur}`,
    wrong: [`${MOINS}${denominateur}`, `${MOINS}1/${denominateur}`, String(denominateur), `1/${base * exposant}`, `${MOINS}${base * exposant}`].filter((e) => e !== `1/${denominateur}`),
    explanation: `${puissance(base, -exposant)} est l'inverse de ${puissance(base, exposant)} : 1/${denominateur}.`,
  };
});

/**
 * Le nombre `chiffres × 10^(exposant − decimales)` écrit en toutes lettres, sans arrondi : on déplace la virgule
 * du texte plutôt que de multiplier des décimaux (81 300 000, 0,0000045). `chiffres` ne finit pas par un zéro.
 */
function ecritDecimal(chiffres: number, decimales: number, exposant: number): string {
  const d = String(chiffres);
  const decalage = exposant - decimales;
  if (decalage >= 0) return ecritureChiffree(Number(d + '0'.repeat(decalage)));
  const position = d.length + decalage;
  const [entier, apres] = (position > 0 ? `${d.slice(0, position)},${d.slice(position)}` : `0,${'0'.repeat(-position)}${d}`).split(',');
  return `${ecritureChiffree(Number(entier))},${apres}`;
}

/** Un entier de `min` à `max` qui ne finit pas par zéro. */
function sansZeroFinal(rng: Rng, min: number, max: number): number {
  let n = 10;
  while (n % 10 === 0) n = rngInt(rng, min, max);
  return n;
}

const ecritureScientifique = brique('ecriture-scientifique', 16, (rng) => {
  const exposant = rngInt(rng, -6, 8) || 5;
  // Deux décimales au plus à la mantisse, une seule quand l'exposant est très négatif : l'écriture décimale reste lisible.
  const sorte = rngInt(rng, 0, exposant < -3 ? 1 : 2);
  const [chiffres, decimales] = sorte === 0 ? [rngInt(rng, 2, 9), 0] : sorte === 1 ? [sansZeroFinal(rng, 11, 99), 1] : [sansZeroFinal(rng, 101, 999), 2];
  const ecrit = (e: number) => `${nb(chiffres / 10 ** decimales)} × ${puissance(10, e)}`;
  const scientifique = ecrit(exposant);
  const decimal = ecritDecimal(chiffres, decimales, exposant);
  if (rng() < 0.4) {
    return {
      instruction: 'Écris en écriture décimale',
      prompt: scientifique,
      correct: decimal,
      // La virgule déplacée dans l'autre sens, d'un rang ou de deux de trop ou de moins.
      wrong: [-exposant, exposant + 1, exposant - 1, exposant + 2, exposant - 2].map((e) => ecritDecimal(chiffres, decimales, e)).filter((e) => e !== decimal),
      explanation: `${puissance(10, exposant)} ${exposant > 0 ? `déplace la virgule de ${exposant} rang${exposant > 1 ? 's' : ''} vers la droite` : `déplace la virgule de ${-exposant} rang${exposant < -1 ? 's' : ''} vers la gauche`} : ${decimal}.`,
    };
  }
  // Une mantisse décalée : 45 × 10³ ou 0,45 × 10⁵ valent bien 45 000, mais ne sont pas des écritures scientifiques.
  const decale = (k: number) => `${ecritDecimal(chiffres, decimales, k)} × ${puissance(10, exposant - k)}`;
  return {
    instruction: 'Écris en écriture scientifique',
    prompt: decimal,
    correct: scientifique,
    wrong: [decale(1), decale(-1), ecrit(-exposant), ecrit(exposant + 1), ecrit(exposant - 1)].filter((e) => e !== scientifique),
    explanation: `Le nombre devant la puissance de 10 est entre 1 et 10 : ${scientifique}.`,
  };
});

const racineCarree = brique('racine-carree', 16, (rng) => {
  const sorte = rngInt(rng, 0, 3);
  const n = rngInt(rng, 2, 13);
  const carre = n * n;
  if (sorte === 0) {
    return {
      instruction: 'Calcule',
      prompt: `√${carre}`,
      correct: String(n),
      wrong: faux(n, [carre / 2, carre / 10, n * 2, n + 1, n - 1, carre - 1], { min: 1, decimales: 2 }),
      explanation: `${n} × ${n} = ${carre} et ${n} est positif : √${carre} = ${n}.`,
    };
  }
  if (sorte === 1) {
    return {
      instruction: 'Cherche le nombre positif',
      prompt: `Quel nombre positif a pour carré ${carre} ?`,
      correct: String(n),
      wrong: faux(n, [carre / 2, n * 2, n + 1, n - 1], { min: 1, decimales: 1 }).concat([MOINS + n]),
      explanation: `${n}² = ${carre}, et ${n} est positif : c'est √${carre}.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Calcule',
      prompt: `√(${n}²)`,
      correct: String(n),
      wrong: faux(n, [carre, n * 2, n / 2, -n], { min: -1000, decimales: 1 }),
      explanation: `On élève ${n} au carré, puis on prend la racine carrée : on retrouve ${n}.`,
    };
  }
  const m = rngInt(rng, 2, 12);
  return {
    instruction: 'Calcule',
    prompt: `√${m * m} + √${n * n}`,
    correct: String(m + n),
    // La racine de la somme, le produit, la différence.
    wrong: faux(m + n, [Math.sqrt(m * m + n * n), m * n, m - n, (m * m + n * n) / 2, m + n + 1], { min: -1000, decimales: 1 }),
    explanation: `√${m * m} = ${m} et √${n * n} = ${n} : ${m} + ${n} = ${m + n}.`,
  };
});

const puissanceAvecSigne = brique('puissance-signe', 16, (rng) => {
  const base = rngInt(rng, 2, 9);
  const exposant = rngInt(rng, 2, base <= 3 ? 4 : 3);
  const avecParentheses = rng() < 0.5;
  const valeur = base ** exposant;
  const reponse = avecParentheses ? (-base) ** exposant : -valeur;
  return {
    instruction: 'Calcule',
    prompt: avecParentheses ? `(${MOINS}${base})${sup(exposant)}` : `${MOINS}${base}${sup(exposant)}`,
    correct: nb(reponse),
    // L'autre lecture : l'exposant qui s'applique au signe ou non.
    wrong: faux(reponse, [-reponse, -base * exposant, base * exposant, valeur + 1], { min: -100000 }),
    explanation: avecParentheses
      ? `Les parenthèses : l'exposant s'applique à ${MOINS}${base}. ${Array.from({ length: exposant }, () => `(${MOINS}${base})`).join(' × ')} = ${nb(reponse)}.`
      : `Sans parenthèses, l'exposant ne s'applique qu'à ${base} : ${MOINS}${base}${sup(exposant)} = ${MOINS}(${base}${sup(exposant)}) = ${nb(reponse)}.`,
  };
});

// === 3e, 2e trimestre (étape 17) ================================================================================

/** Un exposant entier relatif, jamais nul. */
const exposantNonNul = (rng: Rng, min: number, max: number) => {
  let e = 0;
  while (e === 0) e = rngInt(rng, min, max);
  return e;
};

const reglesDesPuissances = brique('regles-puissances', 17, (rng) => {
  const base = rngInt(rng, 2, 9);
  const sorte = rngInt(rng, 0, 2);
  if (sorte === 2) {
    const [a, b] = [rngInt(rng, 2, 6), exposantNonNul(rng, -3, 5)];
    return {
      instruction: 'Écris avec une seule puissance',
      prompt: `(${puissance(base, a)})${sup(b)}`,
      correct: puissance(base, a * b),
      wrong: [puissance(base, a + b), puissance(base, a * b + 1), puissance(base, -(a * b)), puissance(base, a * b - 1), puissance(base * a, b)],
      explanation: `On multiplie les exposants : ${a} × ${entre(b)} = ${nb(a * b)}.`,
    };
  }
  let [m, n] = [exposantNonNul(rng, -6, 9), exposantNonNul(rng, -6, 9)];
  while (m + n === 0 || m === n) [m, n] = [exposantNonNul(rng, -6, 9), exposantNonNul(rng, -6, 9)];
  if (sorte === 0) {
    return {
      instruction: 'Écris avec une seule puissance',
      prompt: `${puissance(base, m)} × ${puissance(base, n)}`,
      correct: puissance(base, m + n),
      wrong: [puissance(base, m * n), puissance(base * base, m + n), puissance(base, m - n), puissance(base, m + n + 1), puissance(base, -(m + n))],
      explanation: `On additionne les exposants : ${nb(m)} + ${entre(n)} = ${nb(m + n)}.`,
    };
  }
  return {
    instruction: 'Écris avec une seule puissance',
    prompt: `${puissance(base, m)} ÷ ${puissance(base, n)}`,
    correct: puissance(base, m - n),
    wrong: [puissance(base, m + n), puissance(base, n - m), puissance(base, m * n), puissance(base, m - n + 1), puissance(base, m - n - 1)],
    explanation: `On soustrait les exposants : ${nb(m)} − ${entre(n)} = ${nb(m - n)}.`,
  };
});

const encadrerUneRacine = brique('encadrer-racine', 17, (rng) => {
  let n = rngInt(rng, 5, 168);
  while (Number.isInteger(Math.sqrt(n))) n = rngInt(rng, 5, 168);
  const bas = Math.floor(Math.sqrt(n));
  const entre2 = (a: number) => `${a} et ${a + 1}`;
  return {
    instruction: 'Encadre entre deux entiers qui se suivent',
    prompt: `Entre quels entiers consécutifs se trouve √${n} ?`,
    correct: entre2(bas),
    // La moitié de n, un entier trop petit ou trop grand.
    wrong: [entre2(bas - 1), entre2(bas + 1), entre2(bas + 2), entre2(Math.floor(n / 2))].filter((f) => !f.startsWith('0 ')),
    explanation: `${bas}² = ${bas * bas} et ${bas + 1}² = ${(bas + 1) ** 2}. Comme ${bas * bas} < ${n} < ${(bas + 1) ** 2}, √${n} est entre ${bas} et ${bas + 1}.`,
  };
});

// === 3e, 3e trimestre (étape 18) ================================================================================

const calculEnEcritureScientifique = brique('calcul-scientifique', 18, (rng) => {
  const [m, n] = [rngInt(rng, -8, 8), rngInt(rng, -8, 8)];
  const ecrit = (x: number, e: number) => `${nb(x)} × ${puissance(10, e)}`;
  if (rng() < 0.65) {
    const [a, b] = [rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    const mantisse = a * b;
    const [normal, exposant] = mantisse >= 10 ? [mantisse / 10, m + n + 1] : [mantisse, m + n];
    return {
      instruction: 'Donne le résultat en écriture scientifique',
      prompt: `(${a} × ${puissance(10, m)}) × (${b} × ${puissance(10, n)})`,
      correct: ecrit(normal, exposant),
      // Le produit non normalisé (égal, mais pas scientifique), les exposants multipliés, un rang de trop ou de moins.
      wrong: [ecrit(mantisse, m + n), ecrit(normal, m * n), ecrit(normal, exposant + 1), ecrit(normal, exposant - 1), ecrit(a + b, m + n), ecrit(normal, m - n), ecrit(normal, -exposant), ecrit(normal, exposant + 2)].filter((e) => e !== ecrit(normal, exposant)),
      explanation: `${a} × ${b} = ${mantisse}${mantisse >= 10 ? `, soit ${nb(normal)} × 10` : ''}. Et ${puissance(10, m)} × ${puissance(10, n)} = ${puissance(10, m + n)}. Résultat : ${ecrit(normal, exposant)}.`,
    };
  }
  const [quotient, bas] = [rngInt(rng, 2, 4), rngInt(rng, 2, 4)];
  const haut = quotient * bas;
  return {
    instruction: 'Donne le résultat en écriture scientifique',
    prompt: `(${haut} × ${puissance(10, m)}) ÷ (${bas} × ${puissance(10, n)})`,
    correct: ecrit(quotient, m - n),
    wrong: [ecrit(quotient, m + n), ecrit(quotient, n - m), ecrit(quotient, m - n + 1), ecrit(haut - bas, m - n), ecrit(quotient * 10, m - n - 1), ecrit(quotient, m - n - 1), ecrit(quotient, m * n)].filter((e) => e !== ecrit(quotient, m - n)),
    explanation: `${haut} ÷ ${bas} = ${quotient}. Et ${puissance(10, m)} ÷ ${puissance(10, n)} = ${puissance(10, m - n)}. Résultat : ${ecrit(quotient, m - n)}.`,
  };
});

export const BRIQUES_NUMERATION_CYCLE4: Brique[] = [
  oppose,
  valeurAbsolue,
  droiteDesRelatifs,
  comparerRelatifs,
  rangerRelatifs,
  carresEtCubes,
  divisibilite,
  chiffreManquant,
  arrondi,
  comparerFractions,
  distanceSurUneDroite,
  fractionsEgales,
  ecrituresDUnNombre,
  signeDUnProduit,
  puissanceDUnNombre,
  puissancesDeDix,
  simplifierUneFraction,
  inverseDUnNombre,
  puissanceDUnRelatif,
  quotientDePuissancesDeDix,
  produitParUnePuissanceDeDix,
  rangerDesFractions,
  diviseurOuMultiple,
  nombrePremier,
  decomposition,
  pgcdDeDeuxNombres,
  fractionIrreductible,
  puissanceDExposantNegatif,
  ecritureScientifique,
  racineCarree,
  puissanceAvecSigne,
  reglesDesPuissances,
  encadrerUneRacine,
  calculEnEcritureScientifique,
];

/** Les questions de numération de la 5e, de la 4e et de la 3e. */
export function genererCycle4(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('numeration', BRIQUES_NUMERATION_CYCLE4, stageOf(level, trimester), rng, count);
}
