import type { Level, Question, Trimester } from '../types';
import { rngInt, rngPick, type Rng } from '../lib/seededRandom';
import { stageOf } from '../lib/progression';
import { fabriquer, type Brique } from './mathsCommun';
import { brique, dixieme, entre, faux, INCONNUES, MOINS, nb, pgcd, plus, rat, relatif, somme, sup, terme, texteRat, type Rat } from './mathsCycle4';

/**
 * Le calcul du collège : les priorités opératoires, les relatifs, les
 * fractions, le calcul littéral et les équations.
 *
 * La 5e suit le nouveau programme de cycle 4 (BO n° 10 du 5 mars 2026), la 4e
 * et la 3e l'ancien (BO n° 31 du 30 juillet 2020). Une notion incertaine dans
 * programmes/maths.md arrive le plus tard possible.
 *
 * Progression, cumulative dans le cycle :
 * - 5e, 1er trimestre : les priorités opératoires, la division par un décimal,
 *   les opérations sur les décimaux, les carrés et les cubes dans un calcul, les
 *   premières écritures littérales (3a, a²), utiliser une formule, traduire
 *   une phrase par une expression ;
 * - 5e, 2e : additionner et soustraire des relatifs ; additionner et
 *   soustraire des fractions de dénominateurs quelconques, fraction d'une
 *   quantité ; réduire une expression, tester une égalité, des équations
 *   simples (x + a = b, ax = b) ;
 * - 5e, 3e : la somme algébrique, les parenthèses précédées d'un moins,
 *   multiplier une fraction par un entier ;
 * - 4e, 1er : multiplier et diviser des relatifs, multiplier et diviser des
 *   fractions, les priorités avec des relatifs et des fractions ;
 * - 4e, 2e : développer k(a + b), réduire avec des signes, les équations
 *   ax + b = c et ax + b = cx + d, substituer un relatif ;
 * - 4e, 3e : développer et réduire, une équation avec des parenthèses ;
 * - 3e, 1er : la double distributivité, les identités remarquables, factoriser,
 *   l'équation produit nul et x² = a ;
 * - 3e, 2e : les inéquations, les systèmes de deux équations, les racines carrées ;
 * - 3e, 3e : développer et réduire avec une identité, résoudre en factorisant.
 *
 * Hors programme, donc absent : la multiplication de relatifs en 5e, la
 * double distributivité et la factorisation avant la 3e, les équations
 * ax + b = cx + d avant la 4e, les inéquations et les systèmes avant la 3e.
 */

// --- Un calcul à plusieurs opérations, avec ses priorités ------------------------------------------------------------

type Operateur = '+' | '−' | '×' | '÷';
type Jeton = number | Operateur | '(' | ')';

/** « 12 + (3 + 4) × 5 », « 5 − 3 × (−2) » : un calcul écrit, un nombre négatif entre parenthèses sauf en tête ou derrière une parenthèse. */
function ecrire(jetons: Jeton[]): string {
  return jetons
    .map((jeton, rang) => {
      if (typeof jeton === 'number') return jeton < 0 && rang > 0 && jetons[rang - 1] !== '(' ? `(${nb(jeton)})` : nb(jeton);
      return jeton === '(' || jeton === ')' ? jeton : ` ${jeton} `;
    })
    .join('');
}

type Lecture = 'juste' | 'de-gauche-a-droite' | 'sans-parentheses';

function applique(a: number, op: Operateur, b: number): number {
  return op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
}

/** Un calcul lu comme il faut, ou lu de travers : de gauche à droite (les priorités oubliées), ou sans tenir compte des parenthèses. */
function calculer(jetons: Jeton[], lecture: Lecture = 'juste'): number {
  const plat = (liste: (number | Operateur)[]): number => {
    if (lecture === 'de-gauche-a-droite') {
      let total = liste[0] as number;
      for (let i = 1; i < liste.length; i += 2) total = applique(total, liste[i] as Operateur, liste[i + 1] as number);
      return total;
    }
    const pile: (number | Operateur)[] = [liste[0]];
    for (let i = 1; i < liste.length; i += 2) {
      const [op, droite] = [liste[i] as Operateur, liste[i + 1] as number];
      if (op === '×' || op === '÷') pile.push(applique(pile.pop() as number, op, droite));
      else pile.push(op, droite);
    }
    let total = pile[0] as number;
    for (let i = 1; i < pile.length; i += 2) total = applique(total, pile[i] as Operateur, pile[i + 1] as number);
    return total;
  };
  const piles: (number | Operateur)[][] = [[]];
  jetons
    .filter((jeton) => lecture !== 'sans-parentheses' || (jeton !== '(' && jeton !== ')'))
    .forEach((jeton) => {
      if (jeton === '(') piles.push([]);
      else if (jeton === ')') {
        const groupe = piles.pop() as (number | Operateur)[];
        piles[piles.length - 1].push(plat(groupe));
      } else piles[piles.length - 1].push(jeton);
    });
  return plat(piles[0]);
}

interface Modele {
  jetons: Jeton[];
  explication: string;
}

/** Un calcul à écrire en consigne, avec ses erreurs d'élève : les priorités oubliées, les parenthèses oubliées, un rang de trop ou de moins. */
function enonceDeCalcul({ jetons, explication }: Modele) {
  const juste = calculer(jetons);
  return {
    instruction: 'Calcule. Pense aux priorités',
    prompt: ecrire(jetons),
    correct: nb(juste),
    wrong: faux(juste, [calculer(jetons, 'de-gauche-a-droite'), calculer(jetons, 'sans-parentheses'), juste + 1, juste - 1, juste + 10, juste - 10, juste * 2]),
    explanation: explication,
  };
}

/** « n/d » quand le dénominateur n'est pas nul, sinon rien : une erreur de calcul ne divise jamais par zéro. */
const sur = (n: number, d: number): Rat | null => (d === 0 ? null : rat(n, d));
const ecritSolution = (lettre: string, r: Rat | null) => (r === null ? '' : `${lettre} = ${texteRat(r)}`);
const sansDoublons = (reponses: string[], juste: string) => [...new Set(reponses)].filter((r) => r !== '' && r !== juste);

// === 5e, 1er trimestre (étape 10) =============================================================================

const MODELES_DE_PRIORITES_5E: ((rng: Rng) => Modele)[] = [
  (rng) => {
    const [a, b, c] = [rngInt(rng, 2, 30), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    return { jetons: [a, '+', b, '×', c], explication: `La multiplication d'abord : ${b} × ${c} = ${b * c}, puis ${a} + ${b * c} = ${a + b * c}.` };
  },
  (rng) => {
    const [b, c] = [rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    const a = b * c + rngInt(rng, 2, 30);
    return { jetons: [a, '−', b, '×', c], explication: `La multiplication d'abord : ${b} × ${c} = ${b * c}, puis ${a} − ${b * c} = ${a - b * c}.` };
  },
  (rng) => {
    const [a, b, c] = [rngInt(rng, 2, 20), rngInt(rng, 2, 20), rngInt(rng, 2, 9)];
    return { jetons: ['(', a, '+', b, ')', '×', c], explication: `Les parenthèses d'abord : ${a} + ${b} = ${a + b}, puis ${a + b} × ${c} = ${(a + b) * c}.` };
  },
  (rng) => {
    const [c, ecart, a] = [rngInt(rng, 2, 9), rngInt(rng, 2, 12), rngInt(rng, 2, 9)];
    const b = c + ecart;
    return { jetons: [a, '×', '(', b, '−', c, ')'], explication: `Les parenthèses d'abord : ${b} − ${c} = ${ecart}, puis ${a} × ${ecart} = ${a * ecart}.` };
  },
  (rng) => {
    const [c, quotient, a] = [rngInt(rng, 2, 9), rngInt(rng, 2, 12), rngInt(rng, 2, 40)];
    return { jetons: [a, '+', c * quotient, '÷', c], explication: `La division d'abord : ${c * quotient} ÷ ${c} = ${quotient}, puis ${a} + ${quotient} = ${a + quotient}.` };
  },
  (rng) => {
    const [c, quotient, b] = [rngInt(rng, 2, 9), rngInt(rng, 2, 12), rngInt(rng, 2, 30)];
    return { jetons: ['(', c * quotient + b, '−', b, ')', '÷', c], explication: `Les parenthèses d'abord : ${c * quotient + b} − ${b} = ${c * quotient}, puis ${c * quotient} ÷ ${c} = ${quotient}.` };
  },
  (rng) => {
    let [a, b, c, d] = [rngInt(rng, 2, 9), rngInt(rng, 2, 9), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    while (a * b === c * d) [a, b, c, d] = [rngInt(rng, 2, 9), rngInt(rng, 2, 9), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    if (a * b < c * d) [a, b, c, d] = [c, d, a, b];
    return {
      jetons: [a, '×', b, '−', c, '×', d],
      explication: `Les multiplications d'abord : ${a} × ${b} = ${a * b} et ${c} × ${d} = ${c * d}, puis ${a * b} − ${c * d} = ${a * b - c * d}.`,
    };
  },
  (rng) => {
    const [a, b, c] = [rngInt(rng, 2, 12), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    const d = rngInt(rng, 1, a + b * c - 1);
    return {
      jetons: [a, '+', b, '×', c, '−', d],
      explication: `La multiplication d'abord : ${b} × ${c} = ${b * c}. Puis ${a} + ${b * c} = ${a + b * c}, et ${a + b * c} − ${d} = ${a + b * c - d}.`,
    };
  },
  (rng) => {
    const [a, b, c] = [rngInt(rng, 2, 15), rngInt(rng, 2, 15), rngInt(rng, 3, 9)];
    const d = rngInt(rng, 1, c - 1);
    return {
      jetons: ['(', a, '+', b, ')', '×', '(', c, '−', d, ')'],
      explication: `Les parenthèses d'abord : ${a} + ${b} = ${a + b} et ${c} − ${d} = ${c - d}, puis ${a + b} × ${c - d} = ${(a + b) * (c - d)}.`,
    };
  },
];

const priorites5e = brique('priorites', 10, (rng) => enonceDeCalcul(rngPick(rng, MODELES_DE_PRIORITES_5E)(rng)));

/** Des diviseurs décimaux exacts, d'un ou deux chiffres après la virgule. */
const DIVISEURS_DECIMAUX = [0.1, 0.2, 0.25, 0.4, 0.5, 0.05, 0.02, 1.5, 2.5, 0.3, 0.6, 0.8, 1.2, 0.75, 0.04, 0.15, 3.5, 0.9];

const divisionParUnDecimal = brique('division-decimale', 10, (rng) => {
  const diviseur = rngPick(rng, DIVISEURS_DECIMAUX);
  const decimalesDuDiviseur = String(diviseur).split('.')[1]?.length ?? 0;
  const quotient = decimalesDuDiviseur === 2 || rng() < 0.7 ? rngInt(rng, 2, 60) : rngInt(rng, 11, 99) / 10;
  const dividende = Math.round(quotient * diviseur * 1e6) / 1e6;
  const facteur = 10 ** decimalesDuDiviseur;
  return {
    instruction: 'Calcule',
    prompt: `${nb(dividende)} ÷ ${nb(diviseur)}`,
    correct: nb(quotient),
    // La virgule mal placée, la multiplication à la place de la division, le diviseur lu sans sa virgule.
    wrong: faux(quotient, [quotient * 10, quotient / 10, dividende * diviseur, dividende / (diviseur * 10), dividende / (diviseur * facteur), quotient * 100, quotient / 100], { min: 0, decimales: 3 }),
    explanation: `On multiplie les deux nombres par ${nb(facteur)} : ${nb(dividende)} ÷ ${nb(diviseur)} = ${nb(dividende * facteur)} ÷ ${nb(diviseur * facteur)} = ${nb(quotient)}.`,
  };
});

const operationsSurLesDecimaux = brique('operations-decimaux', 10, (rng) => {
  const sorte = rngInt(rng, 0, 3);
  if (sorte === 3) {
    const [a, b] = [rngInt(rng, 11, 199) / 10, rngInt(rng, 11, 99) / 10];
    const produit = Math.round(a * b * 1000) / 1000;
    return {
      instruction: 'Calcule',
      prompt: `${nb(a)} × ${nb(b)}`,
      correct: nb(produit),
      // La virgule oubliée ou mal placée : 1,2 × 0,3 = 3,6 au lieu de 0,36.
      wrong: faux(produit, [produit * 10, produit / 10, produit * 100, produit / 100, Math.round(a * 10 * b) / 10, a + b], { min: 0, decimales: 3 }),
      explanation: `On multiplie sans les virgules : ${nb(Math.round(a * 10))} × ${nb(Math.round(b * 10))} = ${nb(Math.round(a * 10) * Math.round(b * 10))}. Il y a 2 chiffres après les virgules : ${nb(produit)}.`,
    };
  }
  let [a, b] = [0, 0];
  while (a === b) [a, b] = [rngInt(rng, 100, 9999) / 100, rngInt(rng, 10, 999) / 100];
  const [grand, petit] = [Math.max(a, b), Math.min(a, b)];
  const ajout = sorte !== 1;
  const resultat = Math.round((ajout ? grand + petit : grand - petit) * 1000) / 1000;
  return {
    instruction: 'Calcule',
    prompt: `${nb(grand)} ${ajout ? '+' : '−'} ${nb(petit)}`,
    correct: nb(resultat),
    // Les virgules non alignées, l'opération échangée.
    wrong: faux(resultat, [resultat * 10, resultat / 10, resultat + 0.1, resultat - 0.1, resultat + 1, resultat - 1, ajout ? grand - petit : grand + petit], { min: 0, decimales: 3 }),
    explanation: `On aligne les virgules, puis on ${ajout ? 'ajoute' : 'retranche'} colonne par colonne : ${nb(resultat)}.`,
  };
});

const carresDansUnCalcul = brique('carres-calcul', 10, (rng) => {
  const sorte = rngInt(rng, 0, 6);
  const [a, b] = [rngInt(rng, 2, 12), rngInt(rng, 2, 9)];
  const cube = rngPick(rng, [2, 3, 4, 5]);
  if (sorte === 0) {
    return {
      instruction: 'Calcule',
      prompt: `${a}${sup(2)} + ${b}${sup(2)}`,
      correct: nb(a * a + b * b),
      wrong: faux(a * a + b * b, [(a + b) ** 2, a + b, 2 * (a + b), a * a + b, a * a + 2 * b], { min: 0 }),
      explanation: `${a}² = ${a * a} et ${b}² = ${b * b} : ${a * a} + ${b * b} = ${a * a + b * b}.`,
    };
  }
  if (sorte === 1) {
    const [grand, petit] = [Math.max(a, b + 3), b];
    return {
      instruction: 'Calcule',
      prompt: `${grand}${sup(2)} − ${petit}${sup(2)}`,
      correct: nb(grand * grand - petit * petit),
      wrong: faux(grand * grand - petit * petit, [(grand - petit) ** 2, grand - petit, grand * grand + petit * petit, 2 * (grand - petit), grand * grand - petit], { min: 0 }),
      explanation: `${grand}² = ${grand * grand} et ${petit}² = ${petit * petit} : ${grand * grand} − ${petit * petit} = ${grand * grand - petit * petit}.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Calcule. Pense aux priorités',
      prompt: `${b} × ${a}${sup(2)}`,
      correct: nb(b * a * a),
      // Le produit élevé au carré, le carré calculé comme un double.
      wrong: faux(b * a * a, [(b * a) ** 2, b * a * 2, b * b * a, b * a + a, b * a * a + b], { min: 0 }),
      explanation: `Le carré d'abord : ${a}² = ${a * a}, puis ${b} × ${a * a} = ${b * a * a}.`,
    };
  }
  if (sorte === 3) {
    const [x, y] = [rngInt(rng, 1, 9), rngInt(rng, 1, 5)];
    return {
      instruction: 'Calcule. Pense aux priorités',
      prompt: `(${x} + ${y})${sup(2)}`,
      correct: nb((x + y) ** 2),
      // (x + y)² n'est pas x² + y².
      wrong: faux((x + y) ** 2, [x * x + y * y, 2 * (x + y), x + y * y, 2 * (x + y) + 1, x * x + y], { min: 0 }),
      explanation: `Les parenthèses d'abord : ${x} + ${y} = ${x + y}, puis ${x + y}² = ${(x + y) ** 2}.`,
    };
  }
  if (sorte === 4) {
    const [x, y] = [rngInt(rng, 2, 12), rngInt(rng, 2, 6)];
    return {
      instruction: 'Calcule. Pense aux priorités',
      prompt: `${x} + ${y}${sup(2)}`,
      correct: nb(x + y * y),
      wrong: faux(x + y * y, [(x + y) ** 2, x + 2 * y, x * y * y, x + y, (x + y) * y], { min: 0 }),
      explanation: `Le carré d'abord : ${y}² = ${y * y}, puis ${x} + ${y * y} = ${x + y * y}.`,
    };
  }
  if (sorte === 5) {
    return {
      instruction: 'Calcule',
      prompt: `${a}${sup(2)} + ${cube}${sup(3)}`,
      correct: nb(a * a + cube ** 3),
      wrong: faux(a * a + cube ** 3, [a * a + cube * 3, a * 2 + cube ** 3, a * a + cube * cube, (a + cube) ** 2, a + cube], { min: 0 }),
      explanation: `${a}² = ${a * a} et ${cube}³ = ${cube ** 3} : ${a * a} + ${cube ** 3} = ${a * a + cube ** 3}.`,
    };
  }
  const grand = cube ** 3 + rngInt(rng, 5, 40);
  return {
    instruction: 'Calcule. Pense aux priorités',
    prompt: `${grand} − ${cube}${sup(3)}`,
    correct: nb(grand - cube ** 3),
    wrong: faux(grand - cube ** 3, [grand - cube * 3, grand - cube * cube, grand - cube, grand - cube ** 3 + 10, grand - cube ** 3 - 10], { min: 0 }),
    explanation: `Le cube d'abord : ${cube}³ = ${cube ** 3}, puis ${grand} − ${cube ** 3} = ${grand - cube ** 3}.`,
  };
});

/** Un exposant lisible, jusqu'à 9 : ⁹ n'a pas de chiffre au-delà. */
const exposantSimple = (k: number) => sup(Math.min(k, 9));

const ecrituresLitterales = brique('ecriture-litterale', 10, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const [k, m] = [rngInt(rng, 2, 12), rngInt(rng, 2, 9)];
  const sorte = rngInt(rng, 0, 6);
  if (sorte === 0) {
    return {
      instruction: 'Écris plus simplement',
      prompt: `${k} × ${x}`,
      correct: `${k}${x}`,
      wrong: [`${k} + ${x}`, `${x}${exposantSimple(k)}`, `${k}${x}${sup(2)}`, `${k + k}${x}`],
      explanation: `On n'écrit pas le signe × entre un nombre et une lettre : ${k} × ${x} = ${k}${x}.`,
    };
  }
  if (sorte === 1) {
    return {
      instruction: 'Écris plus simplement',
      prompt: `${x} × ${x}`,
      correct: `${x}${sup(2)}`,
      wrong: [`2${x}`, `${x}${sup(3)}`, `${x} + ${x}`, `2 + ${x}`],
      explanation: `${x} × ${x} s'écrit ${x}${sup(2)}, le carré de ${x}.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Écris plus simplement',
      prompt: `${x} + ${x}`,
      correct: `2${x}`,
      wrong: [`${x}${sup(2)}`, `2${x}${sup(2)}`, `${x}${x}`, `${x}${sup(3)}`],
      explanation: `${x} + ${x} = 2 × ${x} = 2${x}.`,
    };
  }
  if (sorte === 3) {
    return {
      instruction: 'Écris plus simplement',
      prompt: `${k} × ${x} × ${m}`,
      correct: `${k * m}${x}`,
      wrong: [`${k + m}${x}`, `${k}${m}${x}`, `${k * m}${x}${sup(2)}`, `${k * m + 1}${x}`],
      explanation: `On multiplie les nombres : ${k} × ${m} = ${k * m}, d'où ${k * m}${x}.`,
    };
  }
  if (sorte === 4) {
    return {
      instruction: 'Écris plus simplement',
      prompt: `${x} × ${x} × ${x}`,
      correct: `${x}${sup(3)}`,
      wrong: [`3${x}`, `${x}${sup(2)}`, `${x} + ${x} + ${x}`, `3${x}${sup(3)}`],
      explanation: `Trois facteurs égaux à ${x} : ${x} × ${x} × ${x} = ${x}${sup(3)}.`,
    };
  }
  if (sorte === 5) {
    const y = rngPick(rng, ['y', 'b', 't', 'n'].filter((l) => l !== x));
    return {
      instruction: 'Écris plus simplement',
      prompt: `${k} × ${x} × ${y}`,
      correct: `${k}${x}${y}`,
      wrong: [`${k} + ${x} + ${y}`, `${k}${x}${sup(2)}`, `${k + 1}${x}${y}`, `${x}${y}${exposantSimple(k)}`],
      explanation: `On n'écrit pas les signes × devant une lettre : ${k} × ${x} × ${y} = ${k}${x}${y}.`,
    };
  }
  return {
    instruction: 'Écris plus simplement',
    prompt: `${x} × ${k}`,
    correct: `${k}${x}`,
    wrong: [`${x} + ${k}`, `${x}${exposantSimple(k)}`, `${k}${x}${sup(2)}`, `${k + 1}${x}`],
    explanation: `Le nombre s'écrit devant la lettre : ${x} × ${k} = ${k}${x}.`,
  };
});

const formuleASubstituer = brique('formule', 10, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const [k, c, v] = [rngInt(rng, 2, 9), rngInt(rng, 1, 15), rngInt(rng, 2, 12)];
  const sorte = rngInt(rng, 0, 4);
  if (sorte <= 1) {
    const ajout = sorte === 0;
    const juste = ajout ? k * v + c : k * v - c;
    if (juste < 0) return formuleASubstituer.make(rng, 10);
    return {
      instruction: 'Calcule en remplaçant la lettre',
      prompt: `${k}${x} ${ajout ? '+' : '−'} ${c} pour ${x} = ${v}`,
      correct: nb(juste),
      // Le nombre et la valeur recollés (3a avec a = 4 : 34), l'addition au lieu de la multiplication.
      wrong: faux(juste, [Number(`${k}${v}`) + (ajout ? c : -c), k + v + (ajout ? c : -c), k * (v + c), k * (v - c), juste + k, juste - k], { min: 0 }),
      explanation: `${k}${x} = ${k} × ${v} = ${k * v}, puis ${k * v} ${ajout ? '+' : '−'} ${c} = ${juste}.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Calcule en remplaçant la lettre',
      prompt: `${k} × (${x} + ${c}) pour ${x} = ${v}`,
      correct: nb(k * (v + c)),
      wrong: faux(k * (v + c), [k * v + c, k + v + c, k * v * c, (k + v) * c, k * (v + c) + k], { min: 0 }),
      explanation: `${v} + ${c} = ${v + c}, puis ${k} × ${v + c} = ${k * (v + c)}.`,
    };
  }
  if (sorte === 3) {
    return {
      instruction: 'Calcule en remplaçant la lettre',
      prompt: `${x}${sup(2)} + ${c} pour ${x} = ${v}`,
      correct: nb(v * v + c),
      wrong: faux(v * v + c, [2 * v + c, (v + c) ** 2, v * c * 2, v * v + c * c, v + c], { min: 0 }),
      explanation: `${x}² = ${v}² = ${v * v}, puis ${v * v} + ${c} = ${v * v + c}.`,
    };
  }
  const [L, l] = [rngInt(rng, 5, 20), rngInt(rng, 2, 12)];
  const perimetre = 2 * (L + l);
  return {
    instruction: 'Utilise la formule du périmètre',
    prompt: `P = 2 × (L + l) avec L = ${L} et l = ${l}`,
    correct: nb(perimetre),
    wrong: faux(perimetre, [L + l, 2 * L + l, L * l, 2 * L * l, perimetre + 2, perimetre - 2], { min: 0 }),
    explanation: `${L} + ${l} = ${L + l}, puis 2 × ${L + l} = ${perimetre}.`,
  };
});

const MULTIPLICATEURS: Record<number, string> = { 2: 'le double de', 3: 'le triple de', 4: 'le quadruple de' };

const traduireUnePhrase = brique('traduire', 10, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const k = rngInt(rng, 2, 9);
  // Deux nombres différents : avec k = c, « 3 + 3x » vaudrait « 3x + 3 », et la mauvaise réponse serait juste.
  let c = k;
  while (c === k) c = rngInt(rng, 1, 12);
  const fois = MULTIPLICATEURS[k] ?? `${k} fois`;
  const Fois = `${fois[0].toUpperCase()}${fois.slice(1)}`;
  const sorte = rngInt(rng, 0, 4);
  if (sorte <= 1) {
    const ajout = sorte === 0;
    const signe = ajout ? 1 : -1;
    const juste = somme([{ coefficient: k, lettre: x }, { coefficient: signe * c }]);
    return {
      instruction: 'Choisis la bonne expression',
      prompt: `${Fois} ${x}, ${ajout ? 'augmenté' : 'diminué'} de ${c}`,
      correct: juste,
      // Le tout multiplié, la constante qui passe sur la lettre, les nombres recollés.
      wrong: [`${k}(${x} ${ajout ? '+' : '−'} ${c})`, somme([{ coefficient: 1, lettre: x }, { coefficient: signe * k * c }]), somme([{ coefficient: k * c, lettre: x }]), `${k} ${ajout ? '+' : '−'} ${c}${x}`],
      explanation: `${Fois} ${x} s'écrit ${k}${x}. On ${ajout ? 'ajoute' : 'retranche'} ensuite ${c} : ${juste}.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Choisis la bonne expression',
      prompt: `${Fois} la somme de ${x} et de ${c}`,
      correct: `${k}(${x} + ${c})`,
      wrong: [somme([{ coefficient: k, lettre: x }, { coefficient: c }]), somme([{ coefficient: 1, lettre: x }, { coefficient: k * c }]), `${k} + ${x} + ${c}`, `${k}${x} × ${c}`],
      explanation: `La somme de ${x} et de ${c} est ${x} + ${c}. On la multiplie par ${k} : ${k}(${x} + ${c}).`,
    };
  }
  if (sorte === 3) {
    return {
      instruction: 'Choisis la bonne expression',
      prompt: `La différence de ${x} et de ${c}`,
      correct: `${x} − ${c}`,
      wrong: [`${c} − ${x}`, `${x} + ${c}`, `${c}${x}`, `${x} ÷ ${c}`],
      explanation: `On écrit d'abord ${x}, puis ${c} : ${x} − ${c}.`,
    };
  }
  const juste = somme([{ coefficient: k, lettre: x }, { coefficient: c }]);
  return {
    instruction: 'Choisis la bonne expression',
    prompt: `Le produit de ${x} par ${k}, augmenté de ${c}`,
    correct: juste,
    wrong: [`${k}(${x} + ${c})`, `${k} + ${x} + ${c}`, somme([{ coefficient: k * c, lettre: x }]), somme([{ coefficient: 1, lettre: x }, { coefficient: k + c }])],
    explanation: `Le produit de ${x} par ${k} est ${k}${x}. On ajoute ${c} : ${juste}.`,
  };
});

// === 5e, 2e trimestre (étape 11) =============================================================================

/** Un relatif de −20 à 20, ou un décimal à une décimale : jamais nul. */
const relatifDeCalcul = (rng: Rng, decimal: boolean) => (decimal ? (rng() < 0.5 ? -1 : 1) * dixieme(rng, 12) : relatif(rng, 20));

const sommeDeRelatifs = brique('somme-relatifs', 11, (rng) => {
  const decimal = rng() < 0.25;
  const [a, b] = [relatifDeCalcul(rng, decimal), relatifDeCalcul(rng, decimal)];
  const juste = Math.round((a + b) * 10) / 10;
  const memeSigne = a < 0 === b < 0;
  return {
    instruction: 'Calcule',
    prompt: `${entre(a)} + ${entre(b)}`,
    correct: nb(juste),
    // Les distances à zéro additionnées avec un mauvais signe, le signe oublié, les nombres soustraits.
    wrong: faux(juste, [Math.abs(a) + Math.abs(b), -(Math.abs(a) + Math.abs(b)), -juste, a - b, b - a, Math.abs(Math.abs(a) - Math.abs(b))], { decimales: 1 }),
    explanation: memeSigne
      ? `Deux nombres de même signe : on ajoute les distances à zéro, ${nb(Math.abs(a))} + ${nb(Math.abs(b))} = ${nb(Math.abs(a) + Math.abs(b))}, et on garde le signe.`
      : `Deux nombres de signes contraires : on soustrait les distances à zéro, et le résultat a le signe du plus éloigné de zéro : ${nb(juste)}.`,
  };
});

const differenceDeRelatifs = brique('difference-relatifs', 11, (rng) => {
  const decimal = rng() < 0.25;
  const [a, b] = [relatifDeCalcul(rng, decimal), relatifDeCalcul(rng, decimal)];
  const juste = Math.round((a - b) * 10) / 10;
  return {
    instruction: 'Calcule',
    prompt: `${entre(a)} − ${entre(b)}`,
    correct: nb(juste),
    // Le signe de b oublié (−3 − (−5) = −8), la soustraction à l'envers, le résultat opposé.
    wrong: faux(juste, [a + b, -(a + b), b - a, -juste, Math.abs(a) - Math.abs(b), -(Math.abs(a) + Math.abs(b))], { decimales: 1 }),
    explanation: `Soustraire ${entre(b)}, c'est ajouter son opposé ${entre(-b)} : ${entre(a)} + ${entre(-b)} = ${nb(juste)}.`,
  };
});

/** Le plus petit dénominateur commun de deux dénominateurs. */
const denominateurCommun = (d1: number, d2: number) => (d1 * d2) / pgcd(d1, d2);

/** Les fractions qui ne valent pas `juste` parmi des candidats « n/d » : une erreur n'est jamais le résultat écrit autrement. */
const fractionsFausses = (candidats: [number, number][], juste: Rat) => {
  // En dernier recours, des fractions voisines du résultat : un numérateur ou un dénominateur d'écart.
  const voisines: [number, number][] = [[juste.n + 2, juste.d], [juste.n, juste.d + 2], [juste.n + 1, juste.d + 1], [juste.n + 3, juste.d]];
  return [...new Set([...candidats, ...voisines].filter(([n, d]) => n > 0 && d > 1 && n % d !== 0 && n * juste.d !== juste.n * d).map(([n, d]) => `${n}/${d}`))];
};

/** « 24/30. On simplifie : 4/5 » : le résultat d'un calcul sur les fractions, et sa simplification quand elle change quelque chose. */
const puisSimplifie = (n: number, d: number, simplifie: Rat) => (n === simplifie.n && d === simplifie.d ? `${n}/${d}` : `${n}/${d}. On simplifie : ${texteRat(simplifie)}`);

const sommeDeFractions = brique('somme-fractions', 11, (rng) => {
  for (;;) {
    const [d1, d2] = [rngInt(rng, 2, 12), rngInt(rng, 2, 12)];
    if (d1 === d2) continue;
    const [n1, n2] = [rngInt(rng, 1, d1 - 1), rngInt(rng, 1, d2 - 1)];
    const ajout = rng() < 0.6;
    const commun = denominateurCommun(d1, d2);
    const [m1, m2] = [n1 * (commun / d1), n2 * (commun / d2)];
    const resultat = rat(ajout ? m1 + m2 : m1 - m2, commun);
    if (resultat.n <= 0 || resultat.d === 1) continue;
    const numerateurs = ajout ? n1 + n2 : Math.abs(n1 - n2);
    // Les numérateurs et les dénominateurs additionnés, le dénominateur commun oublié.
    const wrong = fractionsFausses(
      [
        [numerateurs, ajout ? d1 + d2 : Math.abs(d1 - d2) || d1 + d2],
        [numerateurs, commun],
        [numerateurs, Math.max(d1, d2)],
        [resultat.n + 1, resultat.d],
        [resultat.n, resultat.d + 1],
        [ajout ? Math.abs(m1 - m2) : m1 + m2, commun],
      ],
      resultat
    );
    const [a, b] = [`${n1}/${d1}`, `${n2}/${d2}`];
    // Seule la fraction qui change de dénominateur est réécrite : 5/6 = 5/6 n'apprend rien.
    const reecrites = [d1 !== commun ? `${a} = ${m1}/${commun}` : '', d2 !== commun ? `${b} = ${m2}/${commun}` : ''].filter(Boolean).join(' et ');
    return {
      instruction: 'Calcule. Donne une fraction simplifiée',
      prompt: `${a} ${ajout ? '+' : '−'} ${b}`,
      correct: texteRat(resultat),
      wrong,
      explanation: `Avec le dénominateur commun ${commun} : ${reecrites}. Donc ${m1}/${commun} ${ajout ? '+' : '−'} ${m2}/${commun} = ${texteRat(resultat)}.`,
    };
  }
});

const fractionDUneQuantite = brique('fraction-quantite', 11, (rng) => {
  const d = rngInt(rng, 2, 12);
  const n = rngInt(rng, 1, d - 1);
  const part = rngInt(rng, 2, 20);
  const quantite = d * part;
  const juste = n * part;
  return {
    instruction: 'Calcule',
    prompt: `${n}/${d} de ${quantite}`,
    correct: nb(juste),
    // Le numérateur oublié, le produit par le numérateur, le complément.
    wrong: faux(juste, [part, quantite * n, quantite - juste, quantite / n + part, juste + part, juste - part, quantite * d], { min: 0, decimales: 1 }),
    explanation: n === 1 ? `${quantite} ÷ ${d} = ${juste}.` : `${quantite} ÷ ${d} = ${part}, puis ${part} × ${n} = ${juste}.`,
  };
});

const reduireUneExpression = brique('reduire', 11, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const sorte = rngInt(rng, 0, 2);
  const [k, m] = [rngInt(rng, 2, 12), rngInt(rng, 1, 9)];
  const [c, d] = [rngInt(rng, 1, 15), rngInt(rng, 1, 9)];
  if (sorte === 0) {
    return {
      instruction: "Réduis l'expression",
      prompt: `${terme(k, x)} + ${terme(m, x)}`,
      correct: terme(k + m, x),
      wrong: [terme(k + m, x, 2), terme(k * m, x), `${k + m}`, terme(2 * (k + m), x)],
      explanation: `${terme(k, x)} + ${terme(m, x)} = (${k} + ${m})${x} = ${terme(k + m, x)}.`,
    };
  }
  if (sorte === 1) {
    const grand = k + m;
    const juste = somme([{ coefficient: m, lettre: x }, { coefficient: c }]);
    return {
      instruction: "Réduis l'expression",
      prompt: somme([{ coefficient: grand, lettre: x }, { coefficient: -k, lettre: x }, { coefficient: c }]),
      correct: juste,
      wrong: [
        somme([{ coefficient: grand + k, lettre: x }, { coefficient: c }]),
        somme([{ coefficient: m, lettre: x }, { coefficient: -c }]),
        somme([{ coefficient: m + c, lettre: x }]),
        somme([{ coefficient: m, lettre: x, exposant: 2 }, { coefficient: c }]),
      ],
      explanation: `${terme(grand, x)} − ${terme(k, x)} = ${terme(m, x)}. Le nombre ${c} reste seul : ${juste}.`,
    };
  }
  const juste = somme([{ coefficient: k + m, lettre: x }, { coefficient: c + d }]);
  return {
    instruction: "Réduis l'expression",
    prompt: somme([{ coefficient: k, lettre: x }, { coefficient: c }, { coefficient: m, lettre: x }, { coefficient: d }]),
    correct: juste,
    // Tous les termes réunis sur la lettre, le produit des nombres seuls.
    wrong: [
      somme([{ coefficient: k + m + c + d, lettre: x }]),
      somme([{ coefficient: k + m, lettre: x }, { coefficient: c * d }]),
      somme([{ coefficient: k + m, lettre: x, exposant: 2 }, { coefficient: c + d }]),
      somme([{ coefficient: k * m, lettre: x }, { coefficient: c + d }]),
    ],
    explanation: `Les termes en ${x} : ${terme(k, x)} + ${terme(m, x)} = ${terme(k + m, x)}. Les nombres : ${c} + ${d} = ${c + d}.`,
  };
});

const solutionDUneEquation = brique('solution-equation', 11, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const [a, b, s] = [rngInt(rng, 2, 9), rngInt(rng, 1, 15), rngInt(rng, 1, 12)];
  const ajout = rng() < 0.7;
  const c = ajout ? a * s + b : a * s - b;
  if (c <= 0) return solutionDUneEquation.make(rng, 11);
  // Le nombre trouvé sans diviser, ou en changeant mal le signe.
  const candidats = [c - b, c + b, (c + b) / a, a * c, c - b * a, Math.round(c / a), s + 1, s - 1, s + 2];
  return {
    instruction: 'Teste les nombres proposés',
    prompt: `Quel nombre est solution de l'équation ${a}${x} ${ajout ? '+' : '−'} ${b} = ${c} ?`,
    correct: String(s),
    wrong: faux(s, candidats, { min: 0 }),
    explanation: `Pour ${x} = ${s} : ${a} × ${s} ${ajout ? '+' : '−'} ${b} = ${c}. L'égalité est vraie.`,
  };
});

const equationSimple = brique('equation-simple', 11, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const sorte = rngInt(rng, 0, 4);
  const decimal = rng() < 0.2 && sorte <= 1;
  const s = decimal ? rngInt(rng, 11, 99) / 10 : rngInt(rng, 2, 40);
  const a = decimal ? rngInt(rng, 11, 59) / 10 : rngInt(rng, 2, 40);
  const reponse = (v: number) => `${x} = ${nb(v)}`;
  const fausses = (juste: number, candidats: number[], decimales = 0) => faux(juste, candidats, { min: 0, decimales }).map((v) => `${x} = ${v}`);
  if (sorte === 0) {
    return {
      instruction: "Résous l'équation",
      prompt: `${x} + ${nb(a)} = ${nb(s + a)}`,
      correct: reponse(s),
      wrong: fausses(s, [s + 2 * a, a, s + a + a, Math.abs(a - s), s + a], 1),
      explanation: `On retranche ${nb(a)} aux deux membres : ${x} = ${nb(s + a)} − ${nb(a)} = ${nb(s)}.`,
    };
  }
  if (sorte === 1) {
    return {
      instruction: "Résous l'équation",
      prompt: `${x} − ${nb(a)} = ${nb(s)}`,
      correct: reponse(s + a),
      wrong: fausses(s + a, [s - a, a - s, s * a, s, s + a + 1], 1),
      explanation: `On ajoute ${nb(a)} aux deux membres : ${x} = ${nb(s)} + ${nb(a)} = ${nb(s + a)}.`,
    };
  }
  if (sorte === 2) {
    const k = rngInt(rng, 2, 9);
    return {
      instruction: "Résous l'équation",
      prompt: `${k}${x} = ${k * s}`,
      correct: reponse(s),
      wrong: fausses(s, [k * s - k, k * s * k, k * s + k, k, s + 1, s - 1]),
      explanation: `On divise les deux membres par ${k} : ${x} = ${k * s} ÷ ${k} = ${s}.`,
    };
  }
  if (sorte === 3) {
    return {
      instruction: "Résous l'équation",
      prompt: `${nb(s + a)} = ${x} + ${nb(a)}`,
      correct: reponse(s),
      wrong: fausses(s, [s + 2 * a, a, s + a, Math.abs(a - s)], 1),
      explanation: `On retranche ${nb(a)} aux deux membres : ${x} = ${nb(s + a)} − ${nb(a)} = ${nb(s)}.`,
    };
  }
  const k = rngInt(rng, 2, 9);
  return {
    instruction: "Résous l'équation",
    prompt: `${x} ÷ ${k} = ${s}`,
    correct: reponse(s * k),
    wrong: fausses(s * k, [s / k, s + k, s - k, s * k + k, k * s * 2], 1),
    explanation: `On multiplie les deux membres par ${k} : ${x} = ${s} × ${k} = ${s * k}.`,
  };
});

// === 5e, 3e trimestre (étape 12) ===============================================================================

/** Une somme de relatifs écrite sans parenthèses : « −7 + 12 − 5 ». */
function sommeAlgebrique(termes: number[]): string {
  return termes.map((t, rang) => (rang === 0 ? nb(t) : t < 0 ? ` − ${nb(-t)}` : ` + ${nb(t)}`)).join('');
}

const sommeAlgebriqueSimplifiee = brique('somme-algebrique', 12, (rng) => {
  const decimal = rng() < 0.2;
  const longueur = rngInt(rng, 3, 4);
  let termes: number[] = [];
  while (termes.length === 0 || termes.every((t) => t > 0) || termes.every((t) => t < 0)) termes = Array.from({ length: longueur }, () => relatifDeCalcul(rng, decimal));
  const juste = Math.round(termes.reduce((total, t) => total + t, 0) * 10) / 10;
  const positifs = Math.round(termes.filter((t) => t > 0).reduce((total, t) => total + t, 0) * 10) / 10;
  const negatifs = Math.round(termes.filter((t) => t < 0).reduce((total, t) => total + t, 0) * 10) / 10;
  return {
    instruction: 'Calcule',
    prompt: sommeAlgebrique(termes),
    correct: nb(juste),
    // Tous les nombres additionnés sans leur signe, le signe de la somme oublié, un signe lu à l'envers.
    wrong: faux(juste, [Math.abs(positifs) + Math.abs(negatifs), -juste, positifs - negatifs, juste + 2 * Math.abs(termes[termes.length - 1]), juste - 2 * Math.abs(termes[0]), juste + 1, juste - 1], { decimales: 1 }),
    explanation: `Les nombres positifs : ${nb(positifs)}. Les nombres négatifs : ${nb(negatifs)}. Puis ${nb(positifs)} + ${entre(negatifs)} = ${nb(juste)}.`,
  };
});

const parenthesesDansUneSomme = brique('parentheses-moins', 12, (rng) => {
  const [a, b, c] = [rngInt(rng, 2, 20), rngInt(rng, 2, 15), rngInt(rng, 2, 15)];
  const sorte = rngInt(rng, 0, 2);
  const jetons: Jeton[] = sorte === 0 ? [a, '−', '(', b, '−', c, ')'] : sorte === 1 ? [a, '−', '(', b, '+', c, ')'] : [-a, '+', '(', b, '−', c, ')'];
  const juste = calculer(jetons);
  const dedans = sorte === 1 ? b + c : b - c;
  return {
    instruction: 'Calcule',
    prompt: ecrire(jetons),
    correct: nb(juste),
    // Le signe moins qui ne change pas les signes à l'intérieur de la parenthèse.
    wrong: faux(juste, [calculer(jetons, 'sans-parentheses'), -juste, a - b + c, a + b - c, a - b - c, juste + 2, juste - 2]),
    explanation:
      sorte === 2
        ? `Les parenthèses d'abord : ${b} − ${c} = ${nb(dedans)}, puis ${nb(-a)} + ${entre(dedans)} = ${nb(juste)}.`
        : `Les parenthèses d'abord : ${b} ${sorte === 1 ? '+' : '−'} ${c} = ${nb(dedans)}, puis ${a} − ${entre(dedans)} = ${nb(juste)}.`,
  };
});

const fractionFoisUnEntier = brique('fraction-fois-entier', 12, (rng) => {
  for (;;) {
    const d = rngInt(rng, 2, 12);
    const [n, k] = [rngInt(rng, 1, d - 1), rngInt(rng, 2, 12)];
    const resultat = rat(n * k, d);
    if (resultat.d === 1) continue;
    // Le dénominateur multiplié lui aussi, le facteur ajouté au lieu d'être multiplié.
    const wrong = fractionsFausses([[n * k, d * k], [n, d * k], [n + k, d], [n + k, d + k], [n * k, d + k], [resultat.n + 1, resultat.d], [resultat.n, resultat.d + 1]], resultat);
    return {
      instruction: 'Calcule. Donne une fraction simplifiée',
      prompt: `${k} × ${n}/${d}`,
      correct: texteRat(resultat),
      wrong,
      explanation: `${k} × ${n}/${d} = ${puisSimplifie(k * n, d, resultat)}.`,
    };
  }
});

// === 4e, 1er trimestre (étape 13) ================================================================================

const produitDeRelatifs = brique('produit-relatifs', 13, (rng) => {
  const decimal = rng() < 0.25;
  let [a, b] = [1, 1];
  // Au moins un facteur négatif : un produit de deux positifs n'apprend rien sur les signes.
  while (a > 0 && b > 0) [a, b] = decimal ? [((rng() < 0.5 ? -1 : 1) * rngInt(rng, 11, 99)) / 10, relatif(rng, 9, 2)] : [relatif(rng, 12, 2), relatif(rng, 12, 2)];
  const juste = Math.round(a * b * 100) / 100;
  return {
    instruction: 'Calcule',
    prompt: `${entre(a)} × ${entre(b)}`,
    correct: nb(juste),
    // La règle des signes mal appliquée : (−2) × (−3) = −6 ; la somme à la place du produit.
    wrong: faux(juste, [-juste, a + b, -(a + b), juste * 10, juste / 10, Math.abs(a * b) + 1], { decimales: 2 }),
    explanation: `${a < 0 === b < 0 ? 'Deux nombres de même signe : le produit est positif' : 'Deux nombres de signes contraires : le produit est négatif'}. ${nb(Math.abs(a))} × ${nb(Math.abs(b))} = ${nb(Math.abs(juste))}.`,
  };
});

const quotientDeRelatifs = brique('quotient-relatifs', 13, (rng) => {
  let [diviseur, quotient] = [1, 1];
  // Au moins un nombre négatif dans la division : sinon, il n'y a pas de règle des signes à appliquer.
  while (diviseur > 0 && quotient > 0) [diviseur, quotient] = [relatif(rng, 12, 2), relatif(rng, 15, 2)];
  const q = rng() < 0.2 ? quotient + 0.5 * (quotient < 0 ? -1 : 1) : quotient;
  const dividende = Math.round(diviseur * q * 100) / 100;
  return {
    instruction: 'Calcule',
    prompt: `${entre(dividende)} ÷ ${entre(diviseur)}`,
    correct: nb(q),
    // La règle des signes, le diviseur soustrait, le quotient à l'envers.
    wrong: faux(q, [-q, dividende - diviseur, diviseur, Math.round(q * 10) / 10 + 1, q * 10, q / 10], { decimales: 1 }),
    explanation: `${dividende < 0 === diviseur < 0 ? 'Deux nombres de même signe : le quotient est positif' : 'Deux nombres de signes contraires : le quotient est négatif'}. ${nb(Math.abs(dividende))} ÷ ${nb(Math.abs(diviseur))} = ${nb(Math.abs(q))}.`,
  };
});

/** Deux fractions positives de dénominateurs de 2 à 12, jamais égales à un entier : « 2/2 » ne se pose pas. */
function deuxFractions(rng: Rng): [[number, number], [number, number]] {
  const une = (): [number, number] => {
    const d = rngInt(rng, 2, 12);
    let n = d;
    while (n % d === 0) n = rngInt(rng, 1, d + 4);
    return [n, d];
  };
  return [une(), une()];
}

const produitDeFractions = brique('produit-fractions', 13, (rng) => {
  for (;;) {
    const [[n1, d1], [n2, d2]] = deuxFractions(rng);
    const resultat = rat(n1 * n2, d1 * d2);
    if (resultat.d === 1) continue;
    // Les dénominateurs additionnés, les numérateurs additionnés, le produit en croix.
    const wrong = fractionsFausses([[n1 * n2, d1 + d2], [n1 + n2, d1 * d2], [n1 * d2, d1 * n2], [n1 * n2, Math.max(d1, d2)], [resultat.n + 1, resultat.d], [resultat.n, resultat.d + 1], [n1 + n2, d1 + d2]], resultat);
    return {
      instruction: 'Calcule. Donne une fraction simplifiée',
      prompt: `${n1}/${d1} × ${n2}/${d2}`,
      correct: texteRat(resultat),
      wrong,
      explanation: `On multiplie les numérateurs et les dénominateurs : ${puisSimplifie(n1 * n2, d1 * d2, resultat)}.`,
    };
  }
});

const quotientDeFractions = brique('quotient-fractions', 13, (rng) => {
  for (;;) {
    const [[n1, d1], [n2, d2]] = deuxFractions(rng);
    const resultat = rat(n1 * d2, d1 * n2);
    if (resultat.d === 1) continue;
    // Les fractions multipliées sans inverser, la mauvaise fraction inversée.
    const wrong = fractionsFausses([[n1 * n2, d1 * d2], [n2 * d1, n1 * d2], [n1 * d2, d1 + n2], [resultat.n + 1, resultat.d], [resultat.n, resultat.d + 1]], resultat);
    return {
      instruction: 'Calcule. Donne une fraction simplifiée',
      prompt: `${n1}/${d1} ÷ ${n2}/${d2}`,
      correct: texteRat(resultat),
      wrong,
      explanation: `Diviser par ${n2}/${d2}, c'est multiplier par son inverse ${texteRat(rat(d2, n2))} : ${n1}/${d1} × ${texteRat(rat(d2, n2))} = ${puisSimplifie(n1 * d2, d1 * n2, resultat)}.`,
    };
  }
});

const MODELES_DE_PRIORITES_4E: ((rng: Rng) => Modele)[] = [
  (rng) => {
    const [a, b, c] = [rngInt(rng, 2, 20), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    return { jetons: [a, '+', b, '×', -c], explication: `La multiplication d'abord : ${b} × ${entre(-c)} = ${nb(-b * c)}, puis ${a} + ${entre(-b * c)} = ${nb(a - b * c)}.` };
  },
  (rng) => {
    const [a, b, c] = [rngInt(rng, 2, 20), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    return { jetons: [a, '−', b, '×', -c], explication: `La multiplication d'abord : ${b} × ${entre(-c)} = ${nb(-b * c)}, puis ${a} − ${entre(-b * c)} = ${nb(a + b * c)}.` };
  },
  (rng) => {
    const [a, b, c] = [rngInt(rng, 2, 9), rngInt(rng, 2, 15), rngInt(rng, 2, 9)];
    return { jetons: ['(', -a, '+', b, ')', '×', -c], explication: `Les parenthèses d'abord : ${nb(-a)} + ${b} = ${nb(b - a)}, puis ${entre(b - a)} × ${entre(-c)} = ${nb((b - a) * -c)}.` };
  },
  (rng) => {
    const [a, petit] = [rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    const grand = petit + rngInt(rng, 1, 7);
    return { jetons: [-a, '×', '(', petit, '−', grand, ')'], explication: `Les parenthèses d'abord : ${petit} − ${grand} = ${nb(petit - grand)}, puis ${nb(-a)} × ${entre(petit - grand)} = ${nb(-a * (petit - grand))}.` };
  },
  (rng) => {
    const [b, quotient, c, d] = [rngInt(rng, 2, 9), rngInt(rng, 2, 9), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    return {
      jetons: [-b * quotient, '÷', b, '+', c, '×', -d],
      explication: `Les multiplications et divisions d'abord : ${nb(-b * quotient)} ÷ ${b} = ${nb(-quotient)} et ${c} × ${entre(-d)} = ${nb(-c * d)}. Puis ${nb(-quotient)} + ${entre(-c * d)} = ${nb(-quotient - c * d)}.`,
    };
  },
  (rng) => {
    const [a, b, c, d] = [rngInt(rng, 2, 9), rngInt(rng, 2, 9), rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
    return {
      jetons: [a, '×', -b, '−', c, '×', -d],
      explication: `Les multiplications d'abord : ${a} × ${entre(-b)} = ${nb(-a * b)} et ${c} × ${entre(-d)} = ${nb(-c * d)}. Puis ${nb(-a * b)} − ${entre(-c * d)} = ${nb(-a * b + c * d)}.`,
    };
  },
];

const prioritesAvecRelatifs = brique('priorites-relatifs', 13, (rng) => enonceDeCalcul(rngPick(rng, MODELES_DE_PRIORITES_4E)(rng)));

/** Une fraction de dénominateur de 2 à 6, comprise entre 0 et 1 : les calculs à trois fractions restent à l'échelle d'un cahier. */
const petiteFraction = (rng: Rng): [number, number] => {
  const d = rngInt(rng, 2, 6);
  return [rngInt(rng, 1, d - 1), d];
};

const prioritesAvecFractions = brique('priorites-fractions', 13, (rng) => {
  for (;;) {
    const [[n1, d1], [n2, d2], [n3, d3]] = [petiteFraction(rng), petiteFraction(rng), petiteFraction(rng)];
    const [f1, f2, f3] = [rat(n1, d1), rat(n2, d2), rat(n3, d3)];
    const produit = rat(f2.n * f3.n, f2.d * f3.d);
    const juste = plus(f1, produit);
    // Les priorités oubliées : (f1 + f2) × f3.
    const gauche = rat((f1.n * f2.d + f2.n * f1.d) * f3.n, f1.d * f2.d * f3.d);
    if (juste.d === 1 || juste.d > 60 || gauche.d === 1 || juste.n * gauche.d === gauche.n * juste.d) continue;
    const wrong = sansDoublons([gauche, rat(juste.n + 1, juste.d), rat(juste.n, juste.d + 1), plus(f1, f2), rat(juste.n + 2, juste.d), rat(juste.n, juste.d + 2), rat(juste.n * 2, juste.d + 1)].map(texteRat), texteRat(juste));
    return {
      instruction: 'Calcule. Pense aux priorités',
      prompt: `${n1}/${d1} + ${n2}/${d2} × ${n3}/${d3}`,
      correct: texteRat(juste),
      wrong,
      explanation: `La multiplication d'abord : ${n2}/${d2} × ${n3}/${d3} = ${texteRat(produit)}. Puis ${n1}/${d1} + ${texteRat(produit)} = ${texteRat(juste)}.`,
    };
  }
});

// === 4e, 2e trimestre (étape 14) ================================================================================

const developperUneDistributivite = brique('developper-simple', 14, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const k = relatif(rng, 9, 2);
  const [a, b] = [rngPick(rng, [1, 1, 2, 3, 4, 5]), relatif(rng, 12)];
  const juste = somme([{ coefficient: k * a, lettre: x }, { coefficient: k * b }]);
  return {
    instruction: 'Développe',
    prompt: `${nb(k)}(${somme([{ coefficient: a, lettre: x }, { coefficient: b }])})`,
    correct: juste,
    // Le second terme oublié, le signe de k qui ne passe pas au second terme, les nombres additionnés.
    wrong: sansDoublons(
      [
        somme([{ coefficient: k * a, lettre: x }, { coefficient: b }]),
        somme([{ coefficient: k * a, lettre: x }, { coefficient: -k * b }]),
        somme([{ coefficient: k, lettre: x }, { coefficient: k * b }]),
        somme([{ coefficient: k + a, lettre: x }, { coefficient: k + b }]),
        somme([{ coefficient: k * a, lettre: x }, { coefficient: k + b }]),
      ],
      juste
    ),
    explanation: `On multiplie chaque terme par ${nb(k)} : ${nb(k)} × ${terme(a, x)} = ${terme(k * a, x)} et ${nb(k)} × ${entre(b)} = ${nb(k * b)}.`,
  };
});

const equationDuPremierDegre = brique('equation-ax-b', 14, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const [a, s, b] = [relatif(rng, 9, 2), relatif(rng, 12), relatif(rng, 15)];
  const c = a * s + b;
  // Le terme constant passé sans changer de signe, la division oubliée, le produit au lieu du quotient.
  const candidats = [sur(c - b, 1), sur(c + b, a), sur(-(c - b), a), sur((c - b) * a, 1), sur(c, a), sur(s + 1, 1), sur(s - 1, 1)];
  return {
    instruction: "Résous l'équation",
    prompt: `${somme([{ coefficient: a, lettre: x }, { coefficient: b }])} = ${nb(c)}`,
    correct: ecritSolution(x, rat(s)),
    wrong: sansDoublons(candidats.map((r) => ecritSolution(x, r)), ecritSolution(x, rat(s))),
    explanation: `${b > 0 ? `On retranche ${b}` : `On ajoute ${nb(-b)}`} aux deux membres : ${terme(a, x)} = ${nb(c - b)}. On divise par ${nb(a)} : ${x} = ${nb(s)}.`,
  };
});

const equationDesDeuxCotes = brique('equation-complete', 14, (rng) => {
  const x = rngPick(rng, INCONNUES);
  for (;;) {
    const [a, c, b, s] = [relatif(rng, 9), relatif(rng, 9), relatif(rng, 12), relatif(rng, 9)];
    if (a === c) continue;
    const d = a * s + b - c * s;
    // Un terme déplacé sans changer son signe : le nombre d'un côté, la lettre de l'autre.
    const candidats = [sur(-d - b, a - c), sur(d + b, a - c), sur(d - b, a + c), sur(d - b, c - a), sur(d + b, a + c), sur(d - b + (a - c), a - c), sur(d - b - (a - c), a - c)];
    return {
      instruction: "Résous l'équation",
      prompt: `${somme([{ coefficient: a, lettre: x }, { coefficient: b }])} = ${somme([{ coefficient: c, lettre: x }, { coefficient: d }])}`,
      correct: ecritSolution(x, rat(s)),
      wrong: sansDoublons(candidats.map((r) => ecritSolution(x, r)), ecritSolution(x, rat(s))),
      explanation: `On regroupe les termes en ${x} d'un côté, les nombres de l'autre : ${terme(a - c, x)} = ${nb(d - b)}. D'où ${x} = ${nb(s)}.`,
    };
  }
});

const substituerUnRelatif = brique('substituer-relatif', 14, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const v = -rngInt(rng, 2, 9);
  const sorte = rngInt(rng, 0, 2);
  if (sorte === 0) {
    const [a, b] = [rngInt(rng, 2, 9), relatif(rng, 15)];
    const juste = a * v + b;
    return {
      instruction: 'Calcule en remplaçant la lettre',
      prompt: `${somme([{ coefficient: a, lettre: x }, { coefficient: b }])} pour ${x} = ${nb(v)}`,
      correct: nb(juste),
      wrong: faux(juste, [-a * v + b, a * v - b, -juste, a + v + b, juste + 2 * Math.abs(b), juste - 2 * a]),
      explanation: `${a} × ${entre(v)} = ${nb(a * v)}, puis ${nb(a * v)} ${b < 0 ? '−' : '+'} ${nb(Math.abs(b))} = ${nb(juste)}.`,
    };
  }
  if (sorte === 1) {
    const b = rngInt(rng, 1, 15);
    const juste = v * v + b;
    return {
      instruction: 'Calcule en remplaçant la lettre',
      prompt: `${x}${sup(2)} + ${b} pour ${x} = ${nb(v)}`,
      correct: nb(juste),
      // (−3)² lu comme −3² : −9 + b.
      wrong: faux(juste, [-(v * v) + b, 2 * v + b, -juste, v + b, v * v - b]),
      explanation: `${x}² = ${entre(v)}² = ${v * v}, car un carré est positif. Puis ${v * v} + ${b} = ${juste}.`,
    };
  }
  const [a, b] = [rngInt(rng, 2, 5), rngInt(rng, 1, 9)];
  const juste = a * v * v - b * v;
  return {
    instruction: 'Calcule en remplaçant la lettre',
    prompt: `${somme([{ coefficient: a, lettre: x, exposant: 2 }, { coefficient: -b, lettre: x }])} pour ${x} = ${nb(v)}`,
    correct: nb(juste),
    wrong: faux(juste, [-a * v * v - b * v, a * v * v + b * v, a * v - b * v, -juste, a * v * v]),
    explanation: `${x}² = ${v * v}, donc ${a} × ${v * v} = ${a * v * v}. Puis ${nb(a * v * v)} − ${b} × ${entre(v)} = ${nb(a * v * v)} + ${nb(-b * v)} = ${nb(juste)}.`,
  };
});

const reduireAvecDesSignes = brique('reduire-signes', 14, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const [k1, k2, k3] = [relatif(rng, 9), relatif(rng, 9), relatif(rng, 9)];
  const [c1, c2] = [relatif(rng, 12), relatif(rng, 12)];
  const lettres = k1 + k2 + k3;
  const nombres = c1 + c2;
  const juste = somme([{ coefficient: lettres, lettre: x }, { coefficient: nombres }]);
  return {
    instruction: "Réduis l'expression",
    prompt: somme([{ coefficient: k1, lettre: x }, { coefficient: c1 }, { coefficient: k2, lettre: x }, { coefficient: c2 }, { coefficient: k3, lettre: x }]),
    correct: juste,
    wrong: sansDoublons(
      [
        somme([{ coefficient: Math.abs(k1) + Math.abs(k2) + Math.abs(k3), lettre: x }, { coefficient: nombres }]),
        somme([{ coefficient: lettres, lettre: x }, { coefficient: -nombres }]),
        somme([{ coefficient: -lettres, lettre: x }, { coefficient: nombres }]),
        somme([{ coefficient: lettres + nombres, lettre: x }]),
        somme([{ coefficient: lettres, lettre: x, exposant: 2 }, { coefficient: nombres }]),
        somme([{ coefficient: lettres + 1, lettre: x }, { coefficient: nombres }]),
        somme([{ coefficient: lettres - 1, lettre: x }, { coefficient: nombres }]),
        somme([{ coefficient: lettres, lettre: x }, { coefficient: nombres + 1 }]),
        somme([{ coefficient: lettres, lettre: x }, { coefficient: nombres - 1 }]),
        somme([{ coefficient: nombres }]),
      ],
      juste
    ),
    explanation: `Les termes en ${x} : ${sommeAlgebrique([k1, k2, k3])} = ${nb(lettres)}. Les nombres : ${sommeAlgebrique([c1, c2])} = ${nb(nombres)}.`,
  };
});

// === 4e, 3e trimestre (étape 15) ================================================================================

const developperEtReduire = brique('developper-reduire', 15, (rng) => {
  const x = rngPick(rng, INCONNUES);
  const [k, l] = [relatif(rng, 6, 2), relatif(rng, 6, 2)];
  const [b, d] = [relatif(rng, 9), relatif(rng, 9)];
  const [premier, second] = [somme([{ coefficient: 1, lettre: x }, { coefficient: b }]), somme([{ coefficient: 1, lettre: x }, { coefficient: d }])];
  const juste = somme([{ coefficient: k + l, lettre: x }, { coefficient: k * b + l * d }]);
  return {
    instruction: 'Développe et réduis',
    prompt: `${nb(k)}(${premier}) ${l < 0 ? '−' : '+'} ${nb(Math.abs(l))}(${second})`,
    correct: juste,
    // Le signe du second produit oublié, un produit non distribué.
    wrong: sansDoublons(
      [
        somme([{ coefficient: k - l, lettre: x }, { coefficient: k * b - l * d }]),
        somme([{ coefficient: k + l, lettre: x }, { coefficient: k * b + d }]),
        somme([{ coefficient: k + l, lettre: x }, { coefficient: b + l * d }]),
        somme([{ coefficient: k + l, lettre: x }, { coefficient: -(k * b + l * d) }]),
        somme([{ coefficient: k * l, lettre: x }, { coefficient: k * b + l * d }]),
      ],
      juste
    ),
    explanation: `${nb(k)}(${premier}) = ${somme([{ coefficient: k, lettre: x }, { coefficient: k * b }])} et ${nb(l)}(${second}) = ${somme([{ coefficient: l, lettre: x }, { coefficient: l * d }])}. On réduit : ${juste}.`,
  };
});

const equationAvecDesParentheses = brique('equation-parentheses', 15, (rng) => {
  const x = rngPick(rng, INCONNUES);
  for (;;) {
    const [k, b, c, s] = [relatif(rng, 6, 2), relatif(rng, 9), relatif(rng, 6, 1), relatif(rng, 9)];
    if (k === c) continue;
    const d = k * (s + b) - c * s;
    // La parenthèse mal développée : le nombre qui n'est pas multiplié, le signe changé.
    const candidats = [sur(d - b, k - c), sur(d + k * b, k - c), sur(d - k * b, k + c), sur(-(d - k * b), k - c), sur(d, k - c)];
    return {
      instruction: "Résous l'équation",
      prompt: `${nb(k)}(${somme([{ coefficient: 1, lettre: x }, { coefficient: b }])}) = ${somme([{ coefficient: c, lettre: x }, { coefficient: d }])}`,
      correct: ecritSolution(x, rat(s)),
      wrong: sansDoublons(candidats.map((r) => ecritSolution(x, r)), ecritSolution(x, rat(s))),
      explanation: `On développe : ${somme([{ coefficient: k, lettre: x }, { coefficient: k * b }])} = ${somme([{ coefficient: c, lettre: x }, { coefficient: d }])}. On regroupe et l'on trouve ${x} = ${nb(s)}.`,
    };
  }
});

// === 3e, 1er trimestre (étape 16) ================================================================================

const LETTRES_DE_LA_TROISIEME = ['x', 'x', 'x', 'a', 'n'];

/** « (x + 3) », « (2x − 5) » : un binôme écrit entre parenthèses. */
const binome = (a: number, lettre: string, b: number) => `(${somme([{ coefficient: a, lettre }, { coefficient: b }])})`;

/** « ax² + bx + c » écrit, les termes nuls disparaissent. */
const trinome = (lettre: string, cA: number, cB: number, cC: number) => somme([{ coefficient: cA, lettre, exposant: 2 }, { coefficient: cB, lettre }, { coefficient: cC }]);

const doubleDistributivite = brique('double-distributivite', 16, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const [a, c] = [rngPick(rng, [1, 1, 1, 2, 3]), rngPick(rng, [1, 1, 2, 3])];
  const [b, d] = [relatif(rng, 9), relatif(rng, 9)];
  const [A, B, C] = [a * c, a * d + b * c, b * d];
  const juste = trinome(x, A, B, C);
  return {
    instruction: 'Développe et réduis',
    prompt: `${binome(a, x, b)}${binome(c, x, d)}`,
    correct: juste,
    // Les termes croisés oubliés, le signe du dernier terme, un produit pris pour une somme.
    wrong: sansDoublons([trinome(x, A, 0, C), trinome(x, A, B, -C), trinome(x, A, -B, C), trinome(x, A, B + 1, C), trinome(x, a + c, b + d, C), trinome(x, A, B, b + d)], juste),
    explanation: `${terme(a, x)} × ${terme(c, x)} = ${terme(A, x, 2)}. Les termes croisés : ${terme(a * d, x)} et ${terme(b * c, x)}. Enfin ${entre(b)} × ${entre(d)} = ${nb(C)}. Donc ${juste}.`,
  };
});

const identitesADevelopper = brique('identite-developper', 16, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const [a, b] = [rngPick(rng, [1, 1, 1, 2, 3]), rngInt(rng, 1, 9)];
  const sorte = rngInt(rng, 0, 2);
  if (sorte === 2) {
    const juste = trinome(x, a * a, 0, -b * b);
    return {
      instruction: 'Développe et réduis',
      prompt: `${binome(a, x, b)}${binome(a, x, -b)}`,
      correct: juste,
      wrong: sansDoublons([trinome(x, a * a, 0, b * b), trinome(x, a * a, 2 * a * b, -b * b), trinome(x, a * a, -2 * a * b, b * b), trinome(x, a * a, 2 * a * b, b * b)], juste),
      explanation: `(A + B)(A − B) = A² − B², avec A = ${terme(a, x)} et B = ${b} : ${juste}.`,
    };
  }
  const signe = sorte === 0 ? 1 : -1;
  const juste = trinome(x, a * a, signe * 2 * a * b, b * b);
  return {
    instruction: 'Développe et réduis',
    prompt: `${binome(a, x, signe * b)}${sup(2)}`,
    correct: juste,
    // (a + b)² = a² + b², le double produit oublié, son signe changé, le carré qui devient négatif.
    wrong: sansDoublons([trinome(x, a * a, 0, b * b), trinome(x, a * a, signe * a * b, b * b), trinome(x, a * a, -signe * 2 * a * b, b * b), trinome(x, a * a, signe * 2 * a * b, -b * b), trinome(x, a * a, 0, signe * b * b)], juste),
    explanation: `(A ${signe > 0 ? '+' : '−'} B)² = A² ${signe > 0 ? '+' : '−'} 2AB + B², avec A = ${terme(a, x)} et B = ${b} : ${juste}.`,
  };
});

const factoriserParUnFacteurCommun = brique('factoriser-commun', 16, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const k = rngInt(rng, 2, 9);
  if (rng() < 0.65) {
    // k(ax + b), avec a et b sans diviseur commun : le facteur k est le plus grand possible.
    let [a, b] = [1, 0];
    while (b === 0 || pgcd(a, Math.abs(b)) !== 1) [a, b] = [rngInt(rng, 1, 5), relatif(rng, 9)];
    const prompt = somme([{ coefficient: k * a, lettre: x }, { coefficient: k * b }]);
    const juste = `${k}(${somme([{ coefficient: a, lettre: x }, { coefficient: b }])})`;
    return {
      instruction: 'Factorise',
      prompt,
      correct: juste,
      // Le facteur commun qui ne divise qu'un terme, le signe changé.
      wrong: [`${k}(${somme([{ coefficient: a, lettre: x }, { coefficient: k * b }])})`, `${k}(${somme([{ coefficient: a, lettre: x }, { coefficient: -b }])})`, `${k}(${somme([{ coefficient: k * a, lettre: x }, { coefficient: b }])})`, `${k}(${somme([{ coefficient: a + 1, lettre: x }, { coefficient: b }])})`],
      explanation: `Le facteur commun est ${k} : ${prompt} = ${k} × ${terme(a, x)} ${b < 0 ? '−' : '+'} ${k} × ${nb(Math.abs(b))} = ${juste}.`,
    };
  }
  // kx(mx + n), avec m et n sans diviseur commun.
  let [m, n] = [1, 0];
  while (n === 0 || pgcd(m, Math.abs(n)) !== 1) [m, n] = [rngInt(rng, 1, 4), relatif(rng, 7)];
  const prompt = somme([{ coefficient: k * m, lettre: x, exposant: 2 }, { coefficient: k * n, lettre: x }]);
  const juste = `${k}${x}(${somme([{ coefficient: m, lettre: x }, { coefficient: n }])})`;
  return {
    instruction: 'Factorise',
    prompt,
    correct: juste,
    wrong: [`${k}${x}(${somme([{ coefficient: m, lettre: x }, { coefficient: k * n }])})`, `${x}(${somme([{ coefficient: k * m, lettre: x }, { coefficient: n }])})`, `${k}${x}(${somme([{ coefficient: m, lettre: x }, { coefficient: -n }])})`, `${k}${x}(${somme([{ coefficient: k * m, lettre: x }, { coefficient: n }])})`],
    explanation: `Le facteur commun est ${k}${x} : ${prompt} = ${juste}.`,
  };
});

const factoriserUneIdentite = brique('factoriser-identite', 16, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const [a, b] = [rngPick(rng, [1, 1, 1, 2, 3]), rngInt(rng, 2, 9)];
  const sorte = rngInt(rng, 0, 2);
  const f = (s: number) => binome(a, x, s * b);
  if (sorte === 0) {
    const juste = `${f(-1)}${f(1)}`;
    return {
      instruction: 'Factorise',
      prompt: trinome(x, a * a, 0, -b * b),
      correct: juste,
      // Le carré d'une différence, le carré d'une somme, le carré du second nombre.
      wrong: [`${f(-1)}${sup(2)}`, `${f(1)}${sup(2)}`, `${binome(a, x, -b * b)}${binome(a, x, b * b)}`, `${f(-1)}${binome(a, x, b * b)}`],
      explanation: `A² − B² = (A − B)(A + B), avec A = ${terme(a, x)} et B = ${b} : ${juste}.`,
    };
  }
  const signe = sorte === 1 ? 1 : -1;
  const juste = `${f(signe)}${sup(2)}`;
  return {
    instruction: 'Factorise',
    prompt: trinome(x, a * a, signe * 2 * a * b, b * b),
    correct: juste,
    // Un signe changé, le produit de deux binômes de signes contraires, un nombre doublé ou carré.
    wrong: [`${f(-signe)}${sup(2)}`, `${f(-1)}${f(1)}`, `${binome(a, x, signe * b * b)}${sup(2)}`, `${binome(a, x, signe * 2 * b)}${sup(2)}`],
    explanation: `A² ${signe > 0 ? '+' : '−'} 2AB + B² = (A ${signe > 0 ? '+' : '−'} B)², avec A = ${terme(a, x)} et B = ${b} : ${juste}.`,
  };
});

const equationProduitNul = brique('produit-nul', 16, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const [a, c] = rng() < 0.5 ? [1, 1] : [rngPick(rng, [1, 2, 3, 4]), rngPick(rng, [1, 2, 3])];
  const [b, d] = [relatif(rng, 9), relatif(rng, 9)];
  const [r1, r2] = [rat(-b, a), rat(-d, c)];
  // Deux solutions différentes, et pas opposées : les erreurs de signe donnent alors d'autres couples.
  if (Math.abs(r1.n) * r2.d === Math.abs(r2.n) * r1.d) return equationProduitNul.make(rng, 16);
  const ordre = (u: Rat, v: Rat) => (u.n * v.d <= v.n * u.d ? [u, v] : [v, u]);
  const paire = (u: Rat, v: Rat) => ordre(u, v).map(texteRat).join(' et ');
  const oppose = (r: Rat) => rat(-r.n, r.d);
  const [petite, grande] = ordre(r1, r2);
  const juste = paire(petite, grande);
  return {
    instruction: "Résous l'équation",
    prompt: `${binome(a, x, b)}${binome(c, x, d)} = 0`,
    correct: juste,
    // Les signes oubliés : (x − 3)(x + 5) = 0 n'a pas pour solutions −3 et 5.
    wrong: sansDoublons([paire(oppose(petite), oppose(grande)), paire(oppose(petite), grande), paire(petite, oppose(grande)), paire(rat(b, a), rat(-d, c)), paire(rat(-b, 1), rat(-d, 1))], juste),
    explanation: `Un produit est nul quand l'un de ses facteurs est nul : ${somme([{ coefficient: a, lettre: x }, { coefficient: b }])} = 0 ou ${somme([{ coefficient: c, lettre: x }, { coefficient: d }])} = 0, soit ${x} = ${texteRat(r1)} ou ${x} = ${texteRat(r2)}.`,
  };
});

const equationDuCarre = brique('equation-carre', 16, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const n = rngInt(rng, 2, 13);
  if (rngInt(rng, 0, 4) === 0) {
    return {
      instruction: "Résous l'équation",
      prompt: `${x}${sup(2)} = ${nb(-n * n)}`,
      correct: 'Aucune solution',
      wrong: [`${n} et ${MOINS}${n}`, String(n), `${MOINS}${n}`, nb(n * n)],
      explanation: `Un carré n'est jamais négatif : ${x}² = ${nb(-n * n)} n'a pas de solution.`,
    };
  }
  return {
    instruction: "Résous l'équation",
    prompt: `${x}${sup(2)} = ${n * n}`,
    correct: `${n} et ${MOINS}${n}`,
    // Une seule solution, la moitié, le carré lui-même.
    wrong: [String(n), `${MOINS}${n}`, `${nb((n * n) / 2)} et ${MOINS}${nb((n * n) / 2)}`, `${n * n} et ${MOINS}${n * n}`],
    explanation: `${n}² = ${n * n} et (${MOINS}${n})² = ${n * n} : l'équation a deux solutions, ${n} et ${MOINS}${n}.`,
  };
});

// === 3e, 2e trimestre (étape 17) ================================================================================

const RETOURNEES: Record<string, string> = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
const STRICTES_OU_LARGES: Record<string, string> = { '<': '≤', '>': '≥', '≤': '<', '≥': '>' };

const inequationDuPremierDegre = brique('inequation', 17, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const [a, b, s] = [relatif(rng, 7, 2), relatif(rng, 12), relatif(rng, 9)];
  const c = a * s + b;
  const sorte = rngPick(rng, ['<', '>', '≤', '≥']);
  const bon = a < 0 ? RETOURNEES[sorte] : sorte;
  const reponse = (signe: string, valeur: number) => `${x} ${signe} ${nb(valeur)}`;
  return {
    instruction: "Résous l'inéquation",
    prompt: `${somme([{ coefficient: a, lettre: x }, { coefficient: b }])} ${sorte} ${nb(c)}`,
    correct: reponse(bon, s),
    // Le sens qui ne change pas (ou qui change à tort), l'inégalité stricte ou large, la division oubliée.
    wrong: sansDoublons([reponse(RETOURNEES[bon], s), reponse(STRICTES_OU_LARGES[bon], s), reponse(bon, c - b), reponse(RETOURNEES[STRICTES_OU_LARGES[bon]], s), reponse(bon, -s)], reponse(bon, s)),
    explanation: `On isole ${terme(a, x)} : ${terme(a, x)} ${sorte} ${nb(c - b)}. On divise par ${nb(a)}${a < 0 ? ", et le sens de l'inégalité change" : ''}. Donc ${reponse(bon, s)}.`,
  };
});

const systemeDeDeuxEquations = brique('systeme', 17, (rng) => {
  for (;;) {
    const [sx, sy] = [relatif(rng, 8), relatif(rng, 8)];
    const [a1, b1, a2, b2] = [rngInt(rng, 1, 4), relatif(rng, 4), relatif(rng, 4), relatif(rng, 4)];
    if (a1 * b2 - a2 * b1 === 0) continue;
    const [c1, c2] = [a1 * sx + b1 * sy, a2 * sx + b2 * sy];
    const equation = (a: number, b: number, c: number) => `${somme([{ coefficient: a, lettre: 'x' }, { coefficient: b, lettre: 'y' }])} = ${nb(c)}`;
    const reponse = (u: number, v: number) => `x = ${nb(u)} et y = ${nb(v)}`;
    const verifie = (u: number, v: number) => a1 * u + b1 * v === c1 && a2 * u + b2 * v === c2;
    // La solution échangée, un signe changé, un couple qui ne vérifie que la première équation.
    const seulementLaPremiere = Array.from({ length: 41 }, (_, k) => k - 20)
      .map((u): [number, number] => [u, (c1 - a1 * u) / b1])
      .find(([u, v]) => Number.isInteger(v) && Math.abs(v) <= 12 && !verifie(u, v) && u !== sx);
    const candidats: [number, number][] = [[sy, sx], [-sx, sy], [sx, -sy], [-sx, -sy], ...(seulementLaPremiere ? [seulementLaPremiere] : [])];
    return {
      instruction: 'Résous le système',
      prompt: `${equation(a1, b1, c1)} et ${equation(a2, b2, c2)}`,
      correct: reponse(sx, sy),
      wrong: candidats.filter(([u, v]) => !verifie(u, v)).map(([u, v]) => reponse(u, v)),
      explanation: `On vérifie : ${a1} × ${entre(sx)} + ${entre(b1)} × ${entre(sy)} = ${nb(c1)} et ${nb(a2)} × ${entre(sx)} + ${entre(b2)} × ${entre(sy)} = ${nb(c2)}.`,
    };
  }
});

/** Des sommes de deux carrés parfaits qui sont un carré parfait : √(9 + 16) = 5. */
const SOMMES_DE_CARRES: [number, number][] = [[9, 16], [16, 9], [36, 64], [64, 36], [25, 144], [144, 25], [64, 225], [81, 144], [49, 576]];

const racinesCarreesACalculer = brique('racines-calcul', 17, (rng) => {
  const [m, n] = [rngInt(rng, 2, 12), rngInt(rng, 2, 12)];
  const sorte = rngInt(rng, 0, 4);
  if (sorte === 0) {
    const a = rngPick(rng, [2, 3, 5, 6, 7, 10, 11, 13, 14, 15]);
    return {
      instruction: 'Calcule',
      prompt: `(√${a})${sup(2)}`,
      correct: String(a),
      wrong: faux(a, [a * a, a / 2, Math.round(Math.sqrt(a) * 10) / 10, 2 * a, a + 1], { min: 0, decimales: 1 }),
      explanation: `Le carré de √${a} est ${a}, par définition de la racine carrée.`,
    };
  }
  if (sorte === 1) {
    const [p, q] = rngPick(rng, SOMMES_DE_CARRES);
    const [rp, rq] = [Math.sqrt(p), Math.sqrt(q)];
    const juste = Math.sqrt(p + q);
    return {
      instruction: 'Calcule',
      prompt: `√(${p} + ${q})`,
      correct: nb(juste),
      // La racine d'une somme n'est pas la somme des racines.
      wrong: faux(juste, [rp + rq, rp * rq, (p + q) / 2, Math.abs(rq - rp), juste + 1], { min: 0, decimales: 1 }),
      explanation: `On calcule d'abord ${p} + ${q} = ${p + q}, puis √${p + q} = ${nb(juste)}. Et √${p} + √${q} = ${nb(rp + rq)} : ce n'est pas pareil.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Calcule',
      prompt: `√${m * m} × √${n * n}`,
      correct: nb(m * n),
      wrong: faux(m * n, [m + n, m * n * 2, Math.sqrt(m * m + n * n), m * m * n * n, m * n + 1], { min: 0, decimales: 1 }),
      explanation: `√${m * m} = ${m} et √${n * n} = ${n} : ${m} × ${n} = ${m * n}.`,
    };
  }
  if (sorte === 3) {
    const [grand, petit] = [Math.max(m, n) + 1, Math.min(m, n)];
    return {
      instruction: 'Calcule',
      prompt: `√${grand * grand} − √${petit * petit}`,
      correct: nb(grand - petit),
      wrong: faux(grand - petit, [Math.sqrt(grand * grand - petit * petit), grand + petit, (grand * grand - petit * petit) / 2, grand * petit, grand - petit + 1], { min: 0, decimales: 1 }),
      explanation: `√${grand * grand} = ${grand} et √${petit * petit} = ${petit} : ${grand} − ${petit} = ${grand - petit}.`,
    };
  }
  return {
    instruction: 'Calcule',
    prompt: `√(${m}${sup(2)} × ${n}${sup(2)})`,
    correct: nb(m * n),
    wrong: faux(m * n, [m + n, m * m * n * n, m * n * 2, (m * m + n * n) / 2], { min: 0, decimales: 1 }),
    explanation: `${m}² × ${n}² = ${m * m * n * n}. Sa racine carrée est ${m} × ${n} = ${m * n}.`,
  };
});

// === 3e, 3e trimestre (étape 18) ================================================================================

const developperAvecUneIdentite = brique('developper-identite', 18, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const [a, c, d] = [relatif(rng, 8), relatif(rng, 6), relatif(rng, 6)];
  const ecrit = (cB: number, cC: number) => somme([{ coefficient: cB, lettre: x }, { coefficient: cC }]);
  // (x + a)² − (x + c)(x + d) : les x² se détruisent.
  const juste = ecrit(2 * a - (c + d), a * a - c * d);
  return {
    instruction: 'Développe et réduis',
    prompt: `${binome(1, x, a)}${sup(2)} − ${binome(1, x, c)}${binome(1, x, d)}`,
    correct: juste,
    // Le signe moins qui ne change que le premier terme du produit, le double produit oublié, le produit non soustrait.
    wrong: sansDoublons([ecrit(2 * a + (c + d), a * a + c * d), ecrit(2 * a - (c + d), a * a + c * d), ecrit(-(c + d), a * a - c * d), ecrit(2 * a, a * a - c * d), ecrit(2 * a + c + d, a * a - c * d), ecrit(2 * a - (c + d) + 1, a * a - c * d), ecrit(2 * a - (c + d), a * a - c * d + 2)], juste),
    explanation: `${binome(1, x, a)}${sup(2)} = ${trinome(x, 1, 2 * a, a * a)}. Et ${binome(1, x, c)}${binome(1, x, d)} = ${trinome(x, 1, c + d, c * d)}. On soustrait : ${juste}.`,
  };
});

const resoudreEnFactorisant = brique('resoudre-factorisant', 18, (rng) => {
  const x = rngPick(rng, LETTRES_DE_LA_TROISIEME);
  const paire = (u: number, v: number) => `${nb(Math.min(u, v))} et ${nb(Math.max(u, v))}`;
  if (rng() < 0.5) {
    const k = relatif(rng, 9, 2);
    const juste = paire(0, k);
    return {
      instruction: "Résous l'équation",
      prompt: `${somme([{ coefficient: 1, lettre: x, exposant: 2 }, { coefficient: -k, lettre: x }])} = 0`,
      correct: juste,
      // Le facteur x oublié (une seule solution), les signes changés, la division par x.
      wrong: sansDoublons([paire(0, -k), nb(k), paire(k, -k), paire(1, k), paire(-k, k * 2)], juste),
      explanation: `On factorise : ${x}(${somme([{ coefficient: 1, lettre: x }, { coefficient: -k }])}) = 0. Donc ${x} = 0 ou ${x} = ${nb(k)}.`,
    };
  }
  const n = rngInt(rng, 2, 12);
  const juste = paire(-n, n);
  return {
    instruction: "Résous l'équation",
    prompt: `${somme([{ coefficient: 1, lettre: x, exposant: 2 }, { coefficient: -n * n }])} = 0`,
    correct: juste,
    wrong: sansDoublons([nb(n), nb(-n), paire(-n * n, n * n), paire(-n, n + 1), paire(0, n)], juste),
    explanation: `${x}² − ${n * n} = (${x} − ${n})(${x} + ${n}) = 0. Donc ${x} = ${n} ou ${x} = ${MOINS}${n}.`,
  };
});

export const BRIQUES_CALCUL_CYCLE4: Brique[] = [
  priorites5e,
  divisionParUnDecimal,
  operationsSurLesDecimaux,
  carresDansUnCalcul,
  ecrituresLitterales,
  formuleASubstituer,
  traduireUnePhrase,
  sommeDeRelatifs,
  differenceDeRelatifs,
  sommeDeFractions,
  fractionDUneQuantite,
  reduireUneExpression,
  solutionDUneEquation,
  equationSimple,
  sommeAlgebriqueSimplifiee,
  parenthesesDansUneSomme,
  fractionFoisUnEntier,
  produitDeRelatifs,
  quotientDeRelatifs,
  produitDeFractions,
  quotientDeFractions,
  prioritesAvecRelatifs,
  prioritesAvecFractions,
  developperUneDistributivite,
  equationDuPremierDegre,
  equationDesDeuxCotes,
  substituerUnRelatif,
  reduireAvecDesSignes,
  developperEtReduire,
  equationAvecDesParentheses,
  doubleDistributivite,
  identitesADevelopper,
  factoriserParUnFacteurCommun,
  factoriserUneIdentite,
  equationProduitNul,
  equationDuCarre,
  inequationDuPremierDegre,
  systemeDeDeuxEquations,
  racinesCarreesACalculer,
  developperAvecUneIdentite,
  resoudreEnFactorisant,
];

/** Les questions de calcul de la 5e, de la 4e et de la 3e. */
export function genererCycle4(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('calcul', BRIQUES_CALCUL_CYCLE4, stageOf(level, trimester), rng, count);
}
