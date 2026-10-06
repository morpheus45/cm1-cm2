/**
 * De quoi refaire à la main, dans les tests, les calculs des questions de la
 * 5e, de la 4e et de la 3e : des nombres rationnels exacts (entiers de taille
 * quelconque, jamais d'arrondi), un lecteur d'expressions numériques écrites
 * comme à l'école (« (−3) × 4 + 2⁵ », « 3/4 ÷ 9/10 », « √81 + √(5²) ») et un
 * lecteur de polynômes d'une variable (« 3(x + 2) − x² », « (2x − 1)(x + 4) »).
 *
 * Rien ici n'est partagé avec les générateurs (mathsCycle4.ts) : c'est ce qui
 * rend la vérification indépendante. Ce fichier n'est lu que par les tests.
 */

// --- Des rationnels exacts ----------------------------------------------------------------------------------------

export interface Q {
  n: bigint;
  d: bigint;
}

const absB = (a: bigint) => (a < 0n ? -a : a);
const pgcdB = (a: bigint, b: bigint): bigint => (b === 0n ? absB(a) : pgcdB(b, a % b));

export function q(n: bigint | number, d: bigint | number = 1n): Q {
  let [x, y] = [BigInt(n), BigInt(d)];
  if (y === 0n) throw new Error('Division par zéro');
  if (y < 0n) [x, y] = [-x, -y];
  const g = pgcdB(x, y) || 1n;
  return { n: x / g, d: y / g };
}

export const addQ = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const subQ = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const mulQ = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
export const divQ = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
export const negQ = (a: Q) => q(-a.n, a.d);
export const eqQ = (a: Q, b: Q) => a.n === b.n && a.d === b.d;
export const cmpQ = (a: Q, b: Q) => {
  const [x, y] = [a.n * b.d, b.n * a.d];
  return x < y ? -1 : x > y ? 1 : 0;
};
export const absQ = (a: Q) => q(absB(a.n), a.d);
export const estEntier = (a: Q) => a.d === 1n;
export const signeQ = (a: Q) => (a.n < 0n ? -1 : a.n > 0n ? 1 : 0);

export function puissanceQ(a: Q, exposant: number): Q {
  if (exposant < 0) return divQ(q(1), puissanceQ(a, -exposant));
  let resultat = q(1);
  for (let k = 0; k < exposant; k++) resultat = mulQ(resultat, a);
  return resultat;
}

/** La racine carrée d'un rationnel qui en a une, `null` sinon. */
export function racineQ(a: Q): Q | null {
  if (a.n < 0n) return null;
  const racine = (m: bigint): bigint | null => {
    let [bas, haut] = [0n, m + 1n];
    while (bas < haut) {
      const milieu = (bas + haut) / 2n;
      if (milieu * milieu < m) bas = milieu + 1n;
      else haut = milieu;
    }
    return bas * bas === m ? bas : null;
  };
  const [x, y] = [racine(a.n), racine(a.d)];
  return x === null || y === null ? null : q(x, y);
}

/** 3/4 → 0,75 : une valeur en nombre flottant, pour comparer des ordres de grandeur seulement. */
export const versNombre = (a: Q) => Number(a.n) / Number(a.d);

// --- Lire un nombre écrit ------------------------------------------------------------------------------------------

const ESPACES = /[\s\u00a0\u202f\u2060]/g;
const EXPOSANTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Le signe moins des maths ou celui du clavier. */
const estMoins = (c: string) => c === '−' || c === '-' || c === '–';

/** « −3 450,25 » (espaces comprises), « 0,5 », « 12 » : un nombre décimal écrit, en rationnel exact. `null` s'il ne s'en lit pas un. */
export function lireNombre(texte: string): Q | null {
  const propre = texte.replace(ESPACES, '');
  const m = /^([−\-–]?)(\d+)(?:,(\d+))?$/.exec(propre);
  if (!m) return null;
  const decimales = m[3] ?? '';
  const valeur = q(BigInt(`${m[2]}${decimales}`), 10n ** BigInt(decimales.length));
  return m[1] ? negQ(valeur) : valeur;
}

/** « −3/4 », « 5 », « 0,25 » : un nombre ou une fraction écrite, en rationnel exact. */
export function lireRationnel(texte: string): Q | null {
  const propre = texte.replace(ESPACES, '');
  const fraction = /^([−\-–]?)(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)$/.exec(propre);
  if (fraction) {
    const [haut, bas] = [lireNombre(fraction[2]), lireNombre(fraction[3])];
    if (!haut || !bas || bas.n === 0n) return null;
    const valeur = divQ(haut, bas);
    return fraction[1] ? negQ(valeur) : valeur;
  }
  return lireNombre(propre);
}

// --- Lire une expression numérique ---------------------------------------------------------------------------------

type Jeton = { genre: 'nombre'; valeur: Q } | { genre: 'op'; op: string } | { genre: 'exposant'; valeur: number };

function decouper(texte: string): Jeton[] {
  const source = texte.replace(ESPACES, '');
  const jetons: Jeton[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const nombre = /^\d+(?:,\d+)?(?:\/\d+(?:,\d+)?)?/.exec(source.slice(i));
    if (nombre) {
      const valeur = lireRationnel(nombre[0]);
      if (!valeur) throw new Error(`Nombre illisible : ${nombre[0]}`);
      jetons.push({ genre: 'nombre', valeur });
      i += nombre[0].length;
      continue;
    }
    if (EXPOSANTS.includes(c) || c === '⁻') {
      let j = i;
      while (j < source.length && (EXPOSANTS.includes(source[j]) || source[j] === '⁻')) j++;
      const chiffres = source
        .slice(i, j)
        .replace('⁻', '-')
        .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (x) => String(EXPOSANTS.indexOf(x)));
      jetons.push({ genre: 'exposant', valeur: Number(chiffres) });
      i = j;
      continue;
    }
    if ('+×÷·*()√'.includes(c) || estMoins(c)) {
      jetons.push({ genre: 'op', op: estMoins(c) ? '-' : c === '·' || c === '*' ? '×' : c });
      i += 1;
      continue;
    }
    throw new Error(`Caractère inattendu « ${c} » dans « ${texte} »`);
  }
  return jetons;
}

/** Calcule une expression écrite : + − × ÷, parenthèses, puissances (exposants Unicode), fractions « a/b », racines carrées exactes. */
export function evaluer(texte: string): Q {
  const jetons = decouper(texte);
  let position = 0;
  const voir = () => jetons[position];
  const prendre = () => jetons[position++];
  const operateur = (op: string) => {
    const jeton = voir();
    return jeton !== undefined && jeton.genre === 'op' && jeton.op === op;
  };

  function atome(): Q {
    const jeton = prendre();
    if (jeton === undefined) throw new Error(`Expression incomplète : ${texte}`);
    if (jeton.genre === 'nombre') return jeton.valeur;
    if (jeton.genre === 'op' && jeton.op === '(') {
      const dedans = somme();
      if (!operateur(')')) throw new Error(`Parenthèse manquante : ${texte}`);
      prendre();
      return dedans;
    }
    if (jeton.genre === 'op' && jeton.op === '√') {
      const sous = atome();
      const racine = racineQ(sous);
      if (racine === null) throw new Error(`Racine non exacte dans ${texte}`);
      return racine;
    }
    throw new Error(`Jeton inattendu dans ${texte}`);
  }

  function puissance(): Q {
    let base = atome();
    const suivant = voir();
    if (suivant !== undefined && suivant.genre === 'exposant') {
      prendre();
      base = puissanceQ(base, suivant.valeur);
    }
    return base;
  }

  function unaire(): Q {
    if (operateur('-')) {
      prendre();
      return negQ(unaire());
    }
    if (operateur('+')) {
      prendre();
      return unaire();
    }
    return puissance();
  }

  function produit(): Q {
    let valeur = unaire();
    while (operateur('×') || operateur('÷')) {
      const op = (prendre() as { op: string }).op;
      const droite = unaire();
      valeur = op === '×' ? mulQ(valeur, droite) : divQ(valeur, droite);
    }
    return valeur;
  }

  function somme(): Q {
    let valeur = produit();
    while (operateur('+') || operateur('-')) {
      const op = (prendre() as { op: string }).op;
      const droite = produit();
      valeur = op === '+' ? addQ(valeur, droite) : subQ(valeur, droite);
    }
    return valeur;
  }

  const resultat = somme();
  if (position !== jetons.length) throw new Error(`Reste de l'expression illisible : ${texte}`);
  return resultat;
}

// --- Lire un polynôme d'une variable ---------------------------------------------------------------------------------

/** Un polynôme : le coefficient de chaque degré. */
export type Poly = Map<number, Q>;

const polyConstante = (valeur: Q): Poly => (valeur.n === 0n ? new Map() : new Map([[0, valeur]]));
const polyVariable = (): Poly => new Map([[1, q(1)]]);

function polyAdd(a: Poly, b: Poly, signe: 1 | -1 = 1): Poly {
  const resultat: Poly = new Map(a);
  b.forEach((coefficient, degre) => {
    const somme = addQ(resultat.get(degre) ?? q(0), signe === 1 ? coefficient : negQ(coefficient));
    if (somme.n === 0n) resultat.delete(degre);
    else resultat.set(degre, somme);
  });
  return resultat;
}

function polyMul(a: Poly, b: Poly): Poly {
  let resultat: Poly = new Map();
  a.forEach((ca, da) => b.forEach((cb, db) => (resultat = polyAdd(resultat, new Map([[da + db, mulQ(ca, cb)]])))));
  return resultat;
}

function polyPuissance(a: Poly, exposant: number): Poly {
  if (exposant < 0) throw new Error('Exposant négatif sur un polynôme');
  let resultat = polyConstante(q(1));
  for (let k = 0; k < exposant; k++) resultat = polyMul(resultat, a);
  return resultat;
}

export const polyEgaux = (a: Poly, b: Poly) => {
  const difference = polyAdd(a, b, -1);
  return difference.size === 0;
};

export const polyDegre = (a: Poly) => (a.size === 0 ? -Infinity : Math.max(...a.keys()));

export function polyEvaluer(a: Poly, valeur: Q): Q {
  let total = q(0);
  a.forEach((coefficient, degre) => (total = addQ(total, mulQ(coefficient, puissanceQ(valeur, degre)))));
  return total;
}

/** « x² − 5x + 6 » mis en forme normale : « 1 x^2 − 5 x^1 + 6 x^0 » (pour les messages d'erreur des tests). */
export const polyEnTexte = (a: Poly) =>
  [...a.entries()]
    .sort(([x], [y]) => y - x)
    .map(([degre, coefficient]) => `${coefficient.n}${coefficient.d === 1n ? '' : `/${coefficient.d}`}x^${degre}`)
    .join(' + ') || '0';

/** Lit un polynôme en `lettre` : « 3(x + 2) − x² », « (2x − 1)(x + 4) », « −x(x − 5) ». */
export function lirePolynome(texte: string, lettre = 'x'): Poly {
  const source = texte.replace(ESPACES, '');
  const jetons: string[] = [];
  for (let i = 0; i < source.length; ) {
    const c = source[i];
    const nombre = /^\d+(?:,\d+)?/.exec(source.slice(i));
    if (nombre) {
      jetons.push(nombre[0]);
      i += nombre[0].length;
    } else if (EXPOSANTS.includes(c) || c === '⁻') {
      let j = i;
      while (j < source.length && (EXPOSANTS.includes(source[j]) || source[j] === '⁻')) j++;
      jetons.push(`^${source.slice(i, j).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (x) => String(EXPOSANTS.indexOf(x)))}`);
      i = j;
    } else if (c === lettre || '+×·*()'.includes(c) || estMoins(c)) {
      jetons.push(estMoins(c) ? '-' : c === '·' || c === '*' ? '×' : c);
      i += 1;
    } else throw new Error(`Caractère inattendu « ${c} » dans « ${texte} »`);
  }
  let position = 0;
  const voir = () => jetons[position];
  const prendre = () => jetons[position++];

  const atome = (): Poly => {
    const jeton = prendre();
    if (jeton === undefined) throw new Error(`Expression incomplète : ${texte}`);
    if (jeton === '(') {
      const dedans = somme();
      if (prendre() !== ')') throw new Error(`Parenthèse manquante : ${texte}`);
      return dedans;
    }
    if (jeton === lettre) return polyVariable();
    if (/^\d/.test(jeton)) return polyConstante(lireNombre(jeton) as Q);
    throw new Error(`Jeton inattendu « ${jeton} » dans ${texte}`);
  };
  const puissance = (): Poly => {
    const base = atome();
    const suivant = voir();
    if (suivant !== undefined && suivant.startsWith('^')) {
      prendre();
      return polyPuissance(base, Number(suivant.slice(1)));
    }
    return base;
  };
  const facteur = (): Poly => {
    if (voir() === '-') {
      prendre();
      return polyMul(polyConstante(q(-1)), facteur());
    }
    if (voir() === '+') {
      prendre();
      return facteur();
    }
    return puissance();
  };
  const terme = (): Poly => {
    let valeur = facteur();
    for (;;) {
      const suivant = voir();
      if (suivant === '×') {
        prendre();
        valeur = polyMul(valeur, facteur());
      } else if (suivant === '(' || suivant === lettre) {
        // Le produit sans signe : « 3x », « 2(x + 1) », « (x + 1)(x − 2) ».
        valeur = polyMul(valeur, puissance());
      } else return valeur;
    }
  };
  function somme(): Poly {
    let valeur = terme();
    while (voir() === '+' || voir() === '-') {
      const op = prendre();
      valeur = polyAdd(valeur, terme(), op === '+' ? 1 : -1);
    }
    return valeur;
  }
  const resultat = somme();
  if (position !== jetons.length) throw new Error(`Reste de l'expression illisible : ${texte}`);
  return resultat;
}

/** « 3x + 5 = 20 » → la différence des deux membres, un polynôme qui s'annule aux solutions. */
export function lireEquation(texte: string, lettre = 'x'): Poly {
  const [gauche, droite] = texte.split('=');
  if (droite === undefined || texte.split('=').length !== 2) throw new Error(`Pas une équation : ${texte}`);
  return polyAdd(lirePolynome(gauche, lettre), lirePolynome(droite, lettre), -1);
}

// --- Lire une expression avec des lettres ---------------------------------------------------------------------------------

/**
 * Calcule une expression littérale pour des valeurs données des lettres : « 3x − 5 », « (x + 3)(x − 5) », « 2(x + 1)² »,
 * « xy² », « x ÷ 3 ». Le produit sans signe (« 3x », « x(x − 5) », « xy ») est lu comme le lit un élève, l'exposant ne porte que sur
 * ce qui le précède (« 2x² » = 2 × x²).
 */
export function evaluerAvecLettres(texte: string, valeurs: Record<string, Q>): Q {
  const source = texte.replace(ESPACES, '');
  const jetons: string[] = [];
  for (let i = 0; i < source.length; ) {
    const c = source[i];
    const nombre = /^\d+(?:,\d+)?/.exec(source.slice(i));
    if (nombre) {
      jetons.push(nombre[0]);
      i += nombre[0].length;
    } else if (EXPOSANTS.includes(c) || c === '⁻') {
      let j = i;
      while (j < source.length && (EXPOSANTS.includes(source[j]) || source[j] === '⁻')) j++;
      jetons.push(`^${source.slice(i, j).replace('⁻', '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (x) => String(EXPOSANTS.indexOf(x)))}`);
      i = j;
    } else if (/\p{L}/u.test(c) && c !== '√') {
      if (!(c in valeurs)) throw new Error(`Lettre sans valeur « ${c} » dans « ${texte} »`);
      jetons.push(c);
      i += 1;
    } else if ('+×÷·*()'.includes(c) || estMoins(c)) {
      jetons.push(estMoins(c) ? '-' : c === '·' || c === '*' ? '×' : c);
      i += 1;
    } else throw new Error(`Caractère inattendu « ${c} » dans « ${texte} »`);
  }
  let position = 0;
  const voir = () => jetons[position];
  const prendre = () => jetons[position++];
  const estLettre = (jeton: string | undefined) => jeton !== undefined && /^\p{L}$/u.test(jeton);

  const atome = (): Q => {
    const jeton = prendre();
    if (jeton === undefined) throw new Error(`Expression incomplète : ${texte}`);
    if (jeton === '(') {
      const dedans = somme();
      if (prendre() !== ')') throw new Error(`Parenthèse manquante : ${texte}`);
      return dedans;
    }
    if (estLettre(jeton)) return valeurs[jeton];
    if (/^\d/.test(jeton)) return lireNombre(jeton) as Q;
    throw new Error(`Jeton inattendu « ${jeton} » dans ${texte}`);
  };
  const puissance = (): Q => {
    const base = atome();
    const suivant = voir();
    if (suivant !== undefined && suivant.startsWith('^')) {
      prendre();
      return puissanceQ(base, Number(suivant.slice(1)));
    }
    return base;
  };
  const facteur = (): Q => {
    if (voir() === '-') {
      prendre();
      return negQ(facteur());
    }
    if (voir() === '+') {
      prendre();
      return facteur();
    }
    return puissance();
  };
  const terme = (): Q => {
    let valeur = facteur();
    for (;;) {
      const suivant = voir();
      if (suivant === '×') {
        prendre();
        valeur = mulQ(valeur, facteur());
      } else if (suivant === '÷') {
        prendre();
        valeur = divQ(valeur, facteur());
      } else if (suivant === '(' || estLettre(suivant)) {
        // Le produit sans signe : « 3x », « x(x − 5) », « xy ».
        valeur = mulQ(valeur, puissance());
      } else return valeur;
    }
  };
  function somme(): Q {
    let valeur = terme();
    while (voir() === '+' || voir() === '-') {
      const op = prendre();
      const droite = terme();
      valeur = op === '+' ? addQ(valeur, droite) : subQ(valeur, droite);
    }
    return valeur;
  }
  const resultat = somme();
  if (position !== jetons.length) throw new Error(`Reste de l'expression illisible : ${texte}`);
  return resultat;
}

/** Les valeurs d'essai des lettres : assez de points pour qu'une identité de degré 4 au plus ne puisse pas être fausse sans qu'on le voie. */
const POINTS_D_ESSAI = [-3, -2, 2, 3, 5, 7, 11].map((n) => q(n));

/** Deux expressions littérales valent-elles la même chose pour toutes les valeurs des lettres ? Essayé en plusieurs points. */
export function memeExpression(a: string, b: string, lettres: string[] = ['x']): boolean {
  return POINTS_D_ESSAI.every((point, rang) => {
    const valeurs = Object.fromEntries(lettres.map((lettre, indice) => [lettre, POINTS_D_ESSAI[(rang + 2 * indice) % POINTS_D_ESSAI.length] ?? point]));
    return eqQ(evaluerAvecLettres(a, valeurs), evaluerAvecLettres(b, valeurs));
  });
}

/** Les nombres entiers de 1 à n, pour les boucles des tests. */
export const de1a = (n: number) => Array.from({ length: n }, (_, k) => k + 1);
