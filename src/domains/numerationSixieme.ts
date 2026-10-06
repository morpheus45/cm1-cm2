import type { Level, Question, Trimester } from '../types';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';
import { droiteGraduee } from './figuresMaths';
import { ecritureChiffree, numberToFrenchWords } from './nombresEnLettres';
import { accorde, decimalAleatoire, echanges, entierAvecBords, fabriquer, fauxNombres, texte, type Brique, type Enonce } from './mathsCommun';

/**
 * La numération de la 6e (programme de mathématiques du cycle 3, 2025).
 *
 * Les élèves de 6e de 2026-2027 ont fait leur CM2 sous l'ancien programme :
 * le premier trimestre revoit les grands nombres et les fractions simples
 * avant les décimaux.
 *
 * Progression, cumulative :
 * - 6e, 1er trimestre : les entiers jusqu'à 999 999 999 (classes, valeur des
 *   chiffres), les décimaux jusqu'aux millièmes (écriture, lecture, comparer,
 *   encadrer, intercaler, droite graduée), fractions décimales, fraction
 *   comme quotient ;
 * - 6e, 2e : le milliard, fractions (comparer, ordonner, encadrer, nombres
 *   mixtes, droite graduée), fractions, pourcentages (10, 25, 50, 75 %) et
 *   écriture décimale ;
 * - 6e, 3e : pourcentages de 20, 5 et 1 % par les fractions simples.
 *
 * Hors programme : relatifs, puissances, notation scientifique, racines.
 */

const MILLIARD = 1_000_000_000;
/** Jusqu'au milliard : le milliard lui-même n'arrive qu'au 2e trimestre. */
const plafond = (stage: Stage) => (stage >= 8 ? MILLIARD : MILLIARD - 1);

const forme = (name: string, minStage: Stage, make: (rng: Rng, stage: Stage) => Enonce): Brique => ({ name, minStage, make });

const NOMS_DES_RANGS = [
  'unités',
  'dizaines',
  'centaines',
  'unités de mille',
  'dizaines de mille',
  'centaines de mille',
  'unités de million',
  'dizaines de million',
  'centaines de million',
];
const RANGS_DECIMAUX = ['dixièmes', 'centièmes', 'millièmes'];

// --- Les grands nombres -----------------------------------------------------------------------------

/** Une classe de trois chiffres : souvent nulle ou ronde, c'est là que les zéros se perdent. */
function classe(rng: Rng): number {
  const hasard = rng();
  if (hasard < 0.2) return 0;
  if (hasard < 0.4) return rngPick(rng, [5, 7, 9, 10, 20, 50, 100, 200, 300, 500, 600, 800]);
  return rngInt(rng, 1, 999);
}

/** Un entier de 6 à 9 chiffres. */
function grandNombre(rng: Rng): number {
  const troisClasses = rng() < 0.65;
  const millions = troisClasses ? rngInt(rng, 1, 999) : 0;
  const milliers = troisClasses ? classe(rng) : rngInt(rng, 100, 999);
  return millions * 1_000_000 + milliers * 1000 + classe(rng);
}

const classesDe = (n: number): [number, number, number] => [Math.floor(n / 1_000_000), Math.floor((n % 1_000_000) / 1000), n % 1000];

/** Les erreurs sur un grand nombre : une classe écrite sans son zéro de complément (3 000 205 → 3 205),
 *  deux classes échangées, un zéro perdu ou ajouté, deux chiffres voisins échangés. */
function erreursGrandNombre(n: number): number[] {
  const [m, k, u] = classesDe(n);
  const s = String(n);
  const sansComplement = Number(`${m || ''}${k || ''}${u || ''}`);
  return [
    sansComplement,
    m * 1_000_000 + u * 1000 + k,
    s.includes('0') ? Number(s.replace('0', '')) : n + 100,
    s.includes('0') ? Number(s.replace('0', '00')) : n * 10,
    ...echanges(n),
    n + 1000,
    n - 1000,
    n + 10,
    n - 10,
  ];
}

const fauxGrands = (n: number, stage: Stage) => fauxNombres(n, erreursGrandNombre(n), { min: 1, max: plafond(stage) });

/** « 345 millions, 678 mille et 912 unités ». */
function enClasses(n: number): string {
  const [m, k, u] = classesDe(n);
  const morceaux = [m > 0 ? `${m} million${m > 1 ? 's' : ''}` : '', k > 0 ? `${k} mille` : '', u > 0 ? `${u} unité${u > 1 ? 's' : ''}` : ''].filter(Boolean);
  return morceaux.length === 1 ? morceaux[0] : `${morceaux.slice(0, -1).join(', ')} et ${morceaux[morceaux.length - 1]}`;
}

/** « 345 millions + 678 milliers + 912 unités », en classes. */
function sommeEnClasses(n: number): string {
  const [m, k, u] = classesDe(n);
  return [
    m > 0 ? `${ecritureChiffree(m)} ${accorde(m, 'million')}` : '',
    k > 0 ? `${ecritureChiffree(k)} ${accorde(k, 'millier')}` : '',
    u > 0 ? `${ecritureChiffree(u)} ${accorde(u, 'unité')}` : '',
  ]
    .filter(Boolean)
    .join(' + ');
}

const dicteeGrande = forme('grande-dictee', 7, (rng, stage) => {
  const n = grandNombre(rng);
  return {
    instruction: 'Écris ce nombre en chiffres',
    prompt: `« ${numberToFrenchWords(n)} »`,
    correct: ecritureChiffree(n),
    wrong: fauxGrands(n, stage).map(ecritureChiffree),
    explanation: `${ecritureChiffree(n)} : ${enClasses(n)}.`,
  };
});

/** Le nombre de mots d'une phrase, comme l'élève les compte : « quatre-vingt-dix » n'en fait qu'un. */
const nombreDeMots = (texte: string) => texte.split(/\s+/).filter(Boolean).length;

/** Les propositions d'une lecture tiennent en douze mots au plus : on cherche un nombre — et des
 *  erreurs — qui se disent en peu de mots. */
const MOTS_AU_PLUS = 12;

const lectureGrande = forme('grande-lecture', 7, (rng, stage) => {
  let n = grandNombre(rng);
  for (let essai = 0; essai < 60 && nombreDeMots(numberToFrenchWords(n)) >= MOTS_AU_PLUS; essai++) n = grandNombre(rng);
  return {
    instruction: 'Choisis comment on lit ce nombre',
    prompt: ecritureChiffree(n),
    correct: numberToFrenchWords(n),
    wrong: fauxGrands(n, stage)
      .map(numberToFrenchWords)
      .filter((mots) => nombreDeMots(mots) <= MOTS_AU_PLUS),
    explanation: `${ecritureChiffree(n)} : ${enClasses(n)}.`,
  };
});

const decompositionGrande = forme('grande-decomposition', 7, (rng, stage) => {
  const n = grandNombre(rng);
  if (rng() < 0.5) {
    return {
      instruction: 'Écris le nombre',
      prompt: sommeEnClasses(n),
      correct: ecritureChiffree(n),
      wrong: fauxGrands(n, stage).map(ecritureChiffree),
      explanation: `${sommeEnClasses(n)} : ${ecritureChiffree(n)}.`,
    };
  }
  return {
    instruction: 'Choisis la bonne décomposition en classes',
    prompt: `Décompose ${ecritureChiffree(n)}`,
    correct: sommeEnClasses(n),
    wrong: fauxGrands(n, stage).map(sommeEnClasses),
    explanation: `${ecritureChiffree(n)} = ${sommeEnClasses(n)}.`,
  };
});

const classesDuNombre = forme('classes', 7, (rng, stage) => {
  const n = grandNombre(rng);
  const s = String(n);
  const rang = rngInt(rng, 0, s.length - 1);
  const chiffre = Number(s[s.length - 1 - rang]);
  const ecrit = ecritureChiffree(n);
  // « le chiffre 6 » ne doit désigner qu'un rang : un chiffre qui n'apparaît qu'une fois, et qui n'est pas 0.
  const uniques = s.split('').filter((candidat) => candidat !== '0' && s.split(candidat).length === 2);
  const sorte = rngInt(rng, 0, 2);
  if (sorte === 0 || (sorte === 1 && uniques.length === 0)) {
    return {
      instruction: 'Cherche le bon chiffre',
      prompt: `Dans ${ecrit}, quel est le chiffre des ${NOMS_DES_RANGS[rang]} ?`,
      correct: String(chiffre),
      wrong: fauxNombres(chiffre, [...s.split('').map(Number), chiffre + 1, chiffre - 1, 0], { min: 0, max: 9 }).map(String),
      explanation: `${ecrit} : ${enClasses(n)}.`,
    };
  }
  if (sorte === 1) {
    const unique = rngPick(rng, uniques);
    const rangUnique = s.length - 1 - s.indexOf(unique);
    const valeur = Number(unique) * Math.pow(10, rangUnique);
    return {
      instruction: 'Cherche la bonne valeur',
      prompt: `Dans ${ecrit}, quelle est la valeur du chiffre ${unique} ?`,
      correct: ecritureChiffree(valeur),
      wrong: fauxNombres(valeur, [Number(unique), valeur * 10, valeur / 10, valeur * 100, valeur / 100, Number(unique) * 1000], { min: 1, max: plafond(stage) }).map(ecritureChiffree),
      explanation: `Le chiffre ${unique} est celui des ${NOMS_DES_RANGS[rangUnique]} : il vaut ${ecritureChiffree(valeur)}.`,
    };
  }
  // On ne demande les millions que dans un nombre qui en a : « 0 million » ne ferait que dérouter.
  const [rangDuHaut, nom] = rngPick(rng, ([[3, 'milliers'], [6, 'millions']] as [number, string][]).filter(([rangMin]) => n >= Math.pow(10, rangMin)));
  const [haut, bas] = [Math.floor(n / Math.pow(10, rangDuHaut)), n % Math.pow(10, rangDuHaut)];
  return {
    instruction: 'Compte toutes les parts',
    prompt: `Combien y a-t-il de ${nom} dans ${ecrit} ?`,
    correct: ecritureChiffree(haut),
    wrong: fauxNombres(haut, [Number(String(n)[0]), bas, n, haut * 10, Math.floor(haut / 10), haut + 1], { min: 1, max: plafond(stage) }).map(ecritureChiffree),
    explanation: `${ecrit} contient ${ecritureChiffree(haut)} ${nom}.`,
  };
});

/** Quelques nombres qui se ressemblent : les chiffres d'un même nombre, rangés autrement. */
function nombresVoisins(rng: Rng, tirer: (rng: Rng) => number, combien: number): number[] {
  for (let essai = 0; ; essai++) {
    const base = tirer(rng);
    const permutations = new Set<number>([base]);
    for (let k = 0; k < 50 && permutations.size < combien; k++) {
      const melange = rngShuffle(rng, String(base).split(''));
      if (melange[0] !== '0') permutations.add(Number(melange.join('')));
    }
    if (permutations.size >= combien || essai > 30) return rngShuffle(rng, [...permutations, base + 1000, base - 1000].filter((n) => n > 0)).slice(0, combien);
  }
}

const comparerGrands = forme('grands-comparer', 7, (rng) => {
  const liste = nombresVoisins(rng, grandNombre, 4);
  const plusGrand = rng() < 0.5;
  const reponse = plusGrand ? Math.max(...liste) : Math.min(...liste);
  return {
    instruction: plusGrand ? 'Choisis le plus grand nombre' : 'Choisis le plus petit nombre',
    prompt: liste.map(ecritureChiffree).join(', '),
    correct: ecritureChiffree(reponse),
    wrong: liste.filter((n) => n !== reponse).map(ecritureChiffree),
    explanation: `On compare d'abord le nombre de chiffres, puis les chiffres un à un, en partant de la gauche.`,
  };
});

const BORDS_GRANDS = [99_999, 999_999, 9_999_999, 99_999_999, 100_000, 1_000_000, 10_000_000, 100_000_000, 199_999, 2_999_999, 49_999_999];

const suivantGrand = forme('grand-suivant', 7, (rng, stage) => {
  const apres = rng() < 0.5;
  const n = entierAvecBords(rng, 100_000, plafond(stage) - 1, [...BORDS_GRANDS, ...(stage >= 8 ? [plafond(stage) - 1] : [])], 2);
  const reponse = apres ? n + 1 : n - 1;
  return {
    instruction: apres ? 'Cherche le nombre qui suit' : 'Cherche le nombre qui précède',
    prompt: `Quel nombre vient juste ${apres ? 'après' : 'avant'} ${ecritureChiffree(n)} ?`,
    correct: ecritureChiffree(reponse),
    wrong: fauxNombres(reponse, [apres ? n - 1 : n + 1, apres ? n + 10 : n - 10, apres ? n + 1000 : n - 1000, apres ? n + 100 : n - 100, n], { min: 1, max: plafond(stage) }).map(ecritureChiffree),
    explanation: `${ecritureChiffree(reponse)} vient juste ${apres ? 'après' : 'avant'} ${ecritureChiffree(n)}.`,
  };
});

// --- Les décimaux ----------------------------------------------------------------------------------------------

/**
 * Un décimal du programme : jusqu'à trois décimales, partie entière jusqu'à
 * quatre chiffres. Quand il se dit en lettres (« soixante et onze unités et
 * neuf cent soixante et onze millièmes »), la partie entière reste à deux
 * chiffres : au-delà, la phrase ne se lit plus d'un coup d'œil.
 */
function decimal(rng: Rng, decimales = rngInt(rng, 1, 3), enLettres = false): number {
  const hasard = rng();
  const entier = hasard < 0.15 ? 0 : hasard < 0.7 || enLettres ? rngInt(rng, 1, 99) : rngInt(rng, 100, 9999);
  return decimalAleatoire(rng, entier, entier, decimales);
}

const decimalesDeN = (n: number) => (String(n).split('.')[1] ?? '').length;
const ecritDecimal = (n: number) => {
  const [entier, apres] = texte(n).split(',');
  return apres === undefined ? ecritureChiffree(Number(entier)) : `${ecritureChiffree(Number(entier))},${apres}`;
};

/** « un » devant un nom féminin : « vingt et une unités », « mille une unités ». */
const auFeminin = (mots: string) => mots.replace(/(^|[\s-])un$/, '$1une');

/** « trois unités et quatorze centièmes » ; « sept dixièmes » quand il n'y a pas d'unité. */
function decimalEnLettres(entier: number, fraction: number, rang: string): string {
  const mot = rang.replace(/s$/, '');
  const decimales = `${numberToFrenchWords(fraction)} ${fraction > 1 ? rang : mot}`;
  if (entier === 0) return decimales;
  return `${entier === 1 ? 'une unité' : `${auFeminin(numberToFrenchWords(entier))} unités`} et ${decimales}`;
}

const lireUnDecimal = (n: number) => {
  const d = decimalesDeN(n);
  const fraction = Math.round((n - Math.floor(n)) * Math.pow(10, d));
  return { entier: Math.floor(n), fraction, rang: RANGS_DECIMAUX[d - 1] };
};

const ecritureDecimale = forme('decimal-ecriture', 7, (rng) => {
  const n = decimal(rng, rngInt(rng, 1, 3), true);
  const { entier, fraction, rang } = lireUnDecimal(n);
  const chiffres = String(fraction).padStart(decimalesDeN(n), '0');
  const [e, d] = [String(entier), decimalesDeN(n)];
  // « trois unités et quatorze centièmes » : 3,014 (un zéro de trop), 3,41, 31,4, 314 (la virgule oubliée).
  const candidats = [
    Number(`${e}.0${chiffres}`),
    Number(`${e}.${chiffres.split('').reverse().join('')}`),
    Number(`${e}${chiffres[0]}.${chiffres.slice(1) || '0'}`),
    Number(`${e}${chiffres}`),
    Number(`0.${e}${chiffres}`),
    n * 10,
    n / 10,
  ];
  return {
    instruction: 'Écris ce nombre en chiffres',
    prompt: `« ${decimalEnLettres(entier, fraction, rang)} »`,
    correct: ecritDecimal(n),
    wrong: fauxNombres(n, candidats, { min: 0, decimales: Math.min(3, d + 1) }).map(ecritDecimal),
    explanation: `${ecritDecimal(n)} : ${entier > 0 ? `${entier} unité${entier > 1 ? 's' : ''} et ` : ''}${fraction} ${fraction > 1 ? rang : rang.replace(/s$/, '')}.`,
  };
});

const lectureDecimale = forme('decimal-lecture', 7, (rng) => {
  const n = decimal(rng, rngInt(rng, 1, 3), true);
  const { entier, fraction, rang } = lireUnDecimal(n);
  const autresRangs = RANGS_DECIMAUX.filter((candidat) => candidat !== rang);
  return {
    instruction: 'Choisis comment on lit ce nombre',
    prompt: ecritDecimal(n),
    correct: decimalEnLettres(entier, fraction, rang),
    // Le même nombre avec un autre rang : « quatorze dixièmes » pour 3,14 ; les deux parties échangées.
    wrong: [
      ...autresRangs.map((autre) => decimalEnLettres(entier, fraction, autre)),
      // Les deux parties échangées, avec le bon rang ou avec un autre : jamais le même nombre que le vrai.
      ...(entier > 0
        ? [rang, ...autresRangs].map((autre) => decimalEnLettres(fraction, entier, autre).replace(/^(.*) et (.*)$/, '$1 et $2'))
        : [`${auFeminin(numberToFrenchWords(fraction))} unités`]),
    ],
    explanation: `${ecritDecimal(n)} se lit ${decimalEnLettres(entier, fraction, rang)}.`,
  };
});

const chiffreDecimal = forme('decimal-chiffre', 7, (rng) => {
  // Trois décimales, une partie entière courte : on cherche des chiffres tous différents.
  let n = decimalAleatoire(rng, 1, 99, 3);
  for (let essai = 0; essai < 60 && new Set(String(n).replace('.', '')).size !== String(n).replace('.', '').length; essai++) {
    n = decimalAleatoire(rng, 1, 99, 3);
  }
  const [entier, apres] = String(n).split('.');
  const toutes = String(n).replace('.', '');
  const rangsDeLEntier = ['unités', 'dizaines', 'centaines', 'milliers'];
  const choix = [
    ...RANGS_DECIMAUX.map((nom, index) => ({ nom, chiffre: Number(apres[index]), poids: Math.pow(10, -(index + 1)) })),
    ...entier.split('').reverse().map((chiffre, index) => ({ nom: rangsDeLEntier[index], chiffre: Number(chiffre), poids: Math.pow(10, index) })),
  ];
  const { nom, chiffre, poids } = rngPick(rng, choix);
  const ecrit = ecritDecimal(n);
  // La valeur d'un chiffre n'a de sens que s'il n'apparaît qu'une fois, et qu'il n'est pas 0.
  const unique = toutes.split(chiffre === 0 ? '9' : String(chiffre)).length === 2 && chiffre !== 0;
  if (rng() < 0.5 || !unique) {
    return {
      instruction: 'Cherche le bon chiffre',
      prompt: `Dans ${ecrit}, quel est le chiffre des ${nom} ?`,
      correct: String(chiffre),
      wrong: fauxNombres(chiffre, [...choix.map((c) => c.chiffre), chiffre + 1, chiffre - 1, 0], { min: 0, max: 9 }).map(String),
      explanation: 'Après la virgule : les dixièmes, les centièmes, les millièmes.',
    };
  }
  const valeur = Math.round(chiffre * poids * 1000) / 1000;
  return {
    instruction: 'Cherche la bonne valeur',
    prompt: `Dans ${ecrit}, quelle est la valeur du chiffre ${chiffre} ?`,
    correct: texte(valeur),
    wrong: fauxNombres(valeur, [chiffre, valeur * 10, valeur / 10, valeur * 100, valeur / 100, valeur * 1000, valeur / 1000], { min: 0, decimales: 3 }).map(texte),
    explanation: `Le chiffre ${chiffre} est celui des ${nom} : il vaut ${texte(valeur)}.`,
  };
});

/** Quatre décimaux qui se ressemblent : 4,12 ; 4,2 ; 4,102 ; 4,21 — le plus long n'est pas le plus grand. */
function decimauxVoisins(rng: Rng): number[] {
  for (;;) {
    const entier = rng() < 0.7 ? rngInt(rng, 1, 99) : rngInt(rng, 100, 999);
    const [a, b, c] = [rngInt(rng, 1, 9), rngInt(rng, 0, 9), rngInt(rng, 1, 9)];
    const valeurs = [
      entier + a / 10,
      entier + (10 * a + b) / 100,
      entier + (100 * a + 10 * b + c) / 1000,
      entier + (10 * b + c) / 100,
      entier + (100 * b + 10 * a + c) / 1000,
      entier + c / 10,
      entier + (10 * c + a) / 100,
    ].map((v) => Math.round(v * 1000) / 1000);
    const distincts = [...new Set(valeurs)];
    if (distincts.length >= 4) return rngShuffle(rng, distincts).slice(0, 4);
  }
}

const comparerDecimaux = forme('decimal-comparer', 7, (rng) => {
  const liste = decimauxVoisins(rng);
  const plusGrand = rng() < 0.5;
  const reponse = plusGrand ? Math.max(...liste) : Math.min(...liste);
  return {
    instruction: plusGrand ? 'Choisis le plus grand nombre' : 'Choisis le plus petit nombre',
    prompt: liste.map(ecritDecimal).join(', '),
    correct: ecritDecimal(reponse),
    wrong: liste.filter((n) => n !== reponse).map(ecritDecimal),
    explanation: 'On compare les parties entières, puis les dixièmes, les centièmes et les millièmes.',
  };
});

const comparerDecimauxAvecSignes = forme('decimal-signes', 7, (rng) => {
  const egaux = rng() < 0.25;
  if (egaux) {
    const n = decimal(rng, rngInt(rng, 1, 2));
    // Au plus trois décimales, zéros compris.
    const zeros = '0'.repeat(rngInt(rng, 1, 3 - decimalesDeN(n)));
    return {
      instruction: 'Compare avec <, > ou =',
      prompt: `${ecritDecimal(n)} … ${ecritDecimal(n)}${decimalesDeN(n) > 0 ? '' : ','}${zeros}`,
      correct: '=',
      wrong: ['<', '>', '='],
      howMany: 3,
      explanation: `Un zéro à la fin de la partie décimale ne change pas le nombre : ${ecritDecimal(n)}${zeros} = ${ecritDecimal(n)}.`,
    };
  }
  const [a, b] = decimauxVoisins(rng).slice(0, 2);
  return {
    instruction: 'Compare avec <, > ou =',
    prompt: `${ecritDecimal(a)} … ${ecritDecimal(b)}`,
    correct: a < b ? '<' : '>',
    wrong: ['<', '>', '='],
    howMany: 3,
    explanation: `${ecritDecimal(Math.min(a, b))} est plus petit que ${ecritDecimal(Math.max(a, b))} : on compare chaque rang, en partant de la gauche.`,
  };
});

const encadrerUnDecimal = forme('decimal-encadrer', 7, (rng) => {
  const d = rngInt(rng, 1, 3);
  const n = decimal(rng, d);
  const rang = rngInt(rng, 0, d - 1);
  // Entre deux entiers (rang 0), deux dixièmes (1), deux centièmes (2) qui se suivent.
  const pas = Math.pow(10, -rang);
  const bas = Math.round(Math.floor(Math.round(n * Math.pow(10, rang) * 1000) / 1000) * pas * 1000) / 1000;
  const haut = Math.round((bas + pas) * 1000) / 1000;
  const ecrit = (a: number, b: number, c: number) => `${ecritDecimal(a)} < ${ecritDecimal(b)} < ${ecritDecimal(c)}`;
  const nom = ['entiers', 'dixièmes', 'centièmes'][rang];
  return {
    instruction: `Encadre entre deux ${nom} qui se suivent`,
    prompt: ecritDecimal(n),
    correct: ecrit(bas, n, haut),
    wrong: [
      ecrit(haut, n, Math.round((haut + pas) * 1000) / 1000),
      ecrit(Math.round((bas + 2 * pas) * 1000) / 1000, n, Math.round((haut + 2 * pas) * 1000) / 1000),
      ecrit(haut, n, bas),
      ...(bas - pas >= 0 ? [ecrit(Math.round((bas - pas) * 1000) / 1000, n, bas)] : []),
    ],
    explanation: `${ecritDecimal(bas)} et ${ecritDecimal(haut)} sont deux ${nom} qui se suivent : ${ecrit(bas, n, haut)}.`,
  };
});

const intercalerUnDecimal = forme('decimal-intercaler', 7, (rng) => {
  const entier = rngInt(rng, 1, 99);
  const dixieme = rngInt(rng, 0, 8);
  const bas = entier + dixieme / 10;
  const haut = entier + (dixieme + 1) / 10;
  const entre = entier + (10 * dixieme + rngInt(rng, 1, 9)) / 100;
  const arrondi = (v: number) => Math.round(v * 1000) / 1000;
  return {
    instruction: 'Cherche le nombre qui est entre les deux',
    prompt: `Entre ${ecritDecimal(bas)} et ${ecritDecimal(haut)}`,
    correct: ecritDecimal(arrondi(entre)),
    // Les bornes elles-mêmes, un nombre hors de l'intervalle : jamais un nombre compris entre les deux.
    wrong: [bas, haut, arrondi(haut + 0.1), arrondi(bas - 0.1), arrondi(entier + dixieme / 100), arrondi(haut + 0.01)].map(ecritDecimal),
    explanation: `${ecritDecimal(bas)} < ${ecritDecimal(arrondi(entre))} < ${ecritDecimal(haut)}.`,
  };
});

const droiteDecimale = forme('decimal-droite', 7, (rng) => {
  const entreEntiers = rng() < 0.5;
  const entier = rngInt(rng, 0, 98);
  const debut = entreEntiers ? entier : entier + rngInt(rng, 0, 8) / 10;
  const pas = entreEntiers ? 0.1 : 0.01;
  const valeur = (rang: number) => Math.round((debut + rang * pas) * 1000) / 1000;
  const rang = rngInt(rng, 1, 9);
  const etiquettes: Record<number, string> = { 0: ecritDecimal(valeur(0)), 10: ecritDecimal(valeur(10)) };
  return {
    detail: `${debut}-${pas}-${rang}`,
    instruction: `La droite est graduée de ${texte(pas)} en ${texte(pas)}`,
    prompt: 'Quel nombre indique la flèche ?',
    figure: droiteGraduee({ intervalles: 10, etiquettes, fleche: rang }, `Une droite graduée de ${etiquettes[0]} à ${etiquettes[10]}, avec dix intervalles.`),
    correct: ecritDecimal(valeur(rang)),
    // La graduation voisine, celle du bout opposé, et 3,6 lu 3,06 : le rang de la virgule oublié.
    wrong: fauxNombres(valeur(rang), [valeur(rang - 1), valeur(rang + 1), valeur(10 - rang), entreEntiers ? debut + rang / 100 : debut + rang / 1000, valeur(rang + 2)], {
      min: 0,
      decimales: 3,
    }).map(ecritDecimal),
    explanation: `On compte ${rang} graduation${rang > 1 ? 's' : ''} de ${texte(pas)} depuis ${ecritDecimal(valeur(0))} : ${ecritDecimal(valeur(rang))}.`,
  };
});

// --- Les fractions ----------------------------------------------------------------------------------

const ecritFraction = (n: number, d: number) => `${n}/${d}`;
const memeValeur = (n1: number, d1: number, n2: number, d2: number) => n1 * d2 === n2 * d1;
const pgcd = (a: number, b: number): number => (b === 0 ? a : pgcd(b, a % b));

const NOMS: Record<number, { un: string; pluriel: string }> = {
  2: { un: 'demi', pluriel: 'demis' },
  3: { un: 'tiers', pluriel: 'tiers' },
  4: { un: 'quart', pluriel: 'quarts' },
  5: { un: 'cinquième', pluriel: 'cinquièmes' },
  6: { un: 'sixième', pluriel: 'sixièmes' },
  8: { un: 'huitième', pluriel: 'huitièmes' },
  10: { un: 'dixième', pluriel: 'dixièmes' },
};
const NUMERATEURS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const DENOMINATEURS = [2, 3, 4, 5, 6, 8, 10];

/** Le CM revient au début de l'année : « trois quarts » s'écrit 3/4. */
const fractionEnMots = forme('fraction-mots', 7, (rng) => {
  const d = rngPick(rng, DENOMINATEURS);
  const n = rngInt(rng, 1, Math.min(d - 1, 9));
  const mots = `${NUMERATEURS[n]} ${n > 1 ? NOMS[d].pluriel : NOMS[d].un}`;
  const faux: [number, number][] = [
    [n, d - 1],
    [n, d + 1],
    [d, n],
    [n + 1, d],
    [1, d],
    [n, d + 2],
  ];
  return {
    instruction: 'Écris cette fraction en chiffres',
    prompt: `« ${mots} »`,
    correct: ecritFraction(n, d),
    wrong: faux.filter(([a, b]) => a >= 1 && b >= 2 && !memeValeur(a, b, n, d)).map(([a, b]) => ecritFraction(a, b)),
    explanation: `${mots} s'écrit ${ecritFraction(n, d)} : ${n} part${n > 1 ? 's' : ''} sur ${d}.`,
  };
});

const fractionDecimale = forme('fraction-decimale', 7, (rng) => {
  const denominateur = rngPick(rng, [10, 100]);
  let numerateur = denominateur === 10 ? rngInt(rng, 1, 99) : rngInt(rng, 1, 999);
  while (numerateur % denominateur === 0) numerateur = rngInt(rng, 1, denominateur - 1);
  const valeur = numerateur / denominateur;
  const chiffres = String(numerateur);
  if (rng() < 0.5) {
    // 7/10 s'écrit 0,7 ; 3/100 s'écrit 0,03 ; 25/100 s'écrit 0,25.
    return {
      instruction: 'Écris avec une virgule',
      prompt: ecritFraction(numerateur, denominateur),
      correct: texte(valeur),
      wrong: fauxNombres(valeur, [valeur * 10, valeur / 10, numerateur, Number(`0.${chiffres.split('').reverse().join('')}`), valeur * 100, valeur / 100], { min: 0, decimales: 3 }).map(texte),
      explanation: `${ecritFraction(numerateur, denominateur)} = ${texte(valeur)} : ${denominateur === 10 ? 'des dixièmes' : 'des centièmes'}.`,
    };
  }
  // 0,25 s'écrit 25/100 : jamais 25/10, ni 25/1 000, ni 100/25.
  const fausses: [number, number][] = [
    [numerateur, denominateur * 10],
    [numerateur, denominateur / 10],
    [denominateur, numerateur],
    [numerateur * 10, denominateur],
    [numerateur, denominateur * 100],
  ];
  return {
    instruction: 'Écris avec une fraction décimale',
    prompt: texte(valeur),
    correct: ecritFraction(numerateur, denominateur),
    wrong: fausses.filter(([a, b]) => b >= 1 && !memeValeur(a, b, numerateur, denominateur)).map(([a, b]) => ecritFraction(a, b)),
    explanation: `${texte(valeur)} = ${ecritFraction(numerateur, denominateur)}.`,
  };
});

const QUOTIENTS = [
  { prompt: 'On partage 3 pizzas entre 4 enfants. Chacun reçoit la même part. Quelle fraction de pizza reçoit chacun ?', d: 4, n: 3 },
  { prompt: 'On partage 2 baguettes entre 5 personnes. Chacune reçoit la même part. Quelle fraction de baguette reçoit chacune ?', d: 5, n: 2 },
  { prompt: 'On coupe 3 m de ruban en 8 morceaux égaux. Quelle fraction de mètre mesure chaque morceau ?', d: 8, n: 3 },
  { prompt: 'On partage 5 L de jus entre 6 verres. Chaque verre reçoit la même quantité. Quelle fraction de litre reçoit chaque verre ?', d: 6, n: 5 },
  { prompt: 'On partage 7 tablettes de chocolat entre 10 enfants. Chacun reçoit la même part. Quelle fraction de tablette reçoit chacun ?', d: 10, n: 7 },
  { prompt: 'On partage 3 tartes entre 5 invités. Chacun reçoit la même part. Quelle fraction de tarte reçoit chacun ?', d: 5, n: 3 },
  { prompt: 'On coupe 4 m de fil en 5 morceaux égaux. Quelle fraction de mètre mesure chaque morceau ?', d: 5, n: 4 },
  { prompt: 'On verse 2 L de lait dans 3 bols identiques. Quelle fraction de litre contient chaque bol ?', d: 3, n: 2 },
];

/** Le quotient de 3 par 4 est la fraction 3/4 : la fraction comme partage (6e, 1er trimestre). */
const fractionQuotient = forme('fraction-quotient', 7, (rng) => {
  if (rng() < 0.5) {
    const d = rngPick(rng, [3, 4, 5, 6, 8, 10]);
    const n = rngPick(rng, Array.from({ length: d - 1 }, (_, index) => index + 1).filter((candidat) => candidat > 1 && pgcd(candidat, d) === 1));
    return {
      instruction: 'Choisis la bonne fraction',
      prompt: `${n} ÷ ${d}`,
      correct: ecritFraction(n, d),
      wrong: [ecritFraction(d, n), ecritFraction(1, d), ecritFraction(n, n + d), ecritFraction(d - n, d)].filter((choix) => choix !== ecritFraction(n, d)),
      explanation: `${n} ÷ ${d} = ${ecritFraction(n, d)} : c'est le quotient de ${n} par ${d}.`,
    };
  }
  const { prompt, d, n } = rngPick(rng, QUOTIENTS);
  return {
    instruction: 'Lis bien, puis choisis',
    prompt,
    correct: ecritFraction(n, d),
    wrong: [ecritFraction(d, n), ecritFraction(1, d), ecritFraction(n, n + d), ecritFraction(n + 1, d)].filter((choix) => choix !== ecritFraction(n, d)),
    explanation: `${n} partagé en ${d}, c'est ${ecritFraction(n, d)}.`,
  };
});

// --- Le deuxième trimestre : le milliard, les fractions, les pourcentages ---------------------------------------

const milliard = forme('milliard', 8, (rng) => {
  const sorte = rngInt(rng, 0, 4);
  const mille = ecritureChiffree(1000);
  if (sorte === 0) {
    return {
      instruction: 'Écris ce nombre en chiffres',
      prompt: '« un milliard »',
      correct: ecritureChiffree(MILLIARD),
      wrong: [ecritureChiffree(MILLIARD / 10), ecritureChiffree(MILLIARD / 1000), ecritureChiffree(MILLIARD / 100), ecritureChiffree(MILLIARD / 10_000)],
      explanation: 'Un milliard, c\'est 1 suivi de 9 zéros.',
    };
  }
  if (sorte === 1) {
    return {
      instruction: 'Cherche le nombre qui suit',
      prompt: `Quel nombre vient juste après ${ecritureChiffree(MILLIARD - 1)} ?`,
      correct: ecritureChiffree(MILLIARD),
      wrong: [ecritureChiffree(MILLIARD - 2), ecritureChiffree(MILLIARD / 10), ecritureChiffree(MILLIARD / 100), ecritureChiffree(MILLIARD - 10)],
      explanation: `${ecritureChiffree(MILLIARD - 1)} + 1 = ${ecritureChiffree(MILLIARD)} : un milliard.`,
    };
  }
  if (sorte === 2) {
    return {
      instruction: 'Complète',
      prompt: 'Un milliard, c\'est … millions',
      correct: mille,
      wrong: [ecritureChiffree(100), ecritureChiffree(10000), ecritureChiffree(1_000_000), ecritureChiffree(10)],
      explanation: `Un milliard, c'est ${mille} millions.`,
    };
  }
  if (sorte === 3) {
    return {
      instruction: 'Compte les zéros',
      prompt: `Combien de zéros dans ${ecritureChiffree(MILLIARD)} ?`,
      correct: '9',
      wrong: ['6', '8', '10', '12'],
      explanation: `${ecritureChiffree(MILLIARD)} : 1 suivi de 9 zéros.`,
    };
  }
  return {
    instruction: 'Complète',
    prompt: `Un million, c'est un milliard divisé par …`,
    correct: mille,
    wrong: [ecritureChiffree(100), ecritureChiffree(10000), ecritureChiffree(1_000_000), ecritureChiffree(10)],
    explanation: `${ecritureChiffree(MILLIARD)} ÷ ${mille} = ${ecritureChiffree(1_000_000)}.`,
  };
});

/** Deux dénominateurs dont l'un est multiple de l'autre : les seuls qu'on compare en 6e. */
const COUPLES: [number, number][] = [[2, 4], [2, 6], [2, 8], [2, 10], [3, 6], [4, 8], [5, 10], [2, 2], [3, 3], [4, 4], [5, 5], [8, 8], [6, 6], [10, 10]];

const comparerDesFractions = forme('fractions-comparer', 8, (rng) => {
  const [petit, grand] = rngPick(rng, COUPLES);
  const [d1, d2] = rng() < 0.5 ? [petit, grand] : [grand, petit];
  const [n1, n2] = [rngInt(rng, 1, d1 + 3), rngInt(rng, 1, d2 + 3)];
  const reponse = n1 * d2 === n2 * d1 ? '=' : n1 * d2 < n2 * d1 ? '<' : '>';
  const [premier, second] = [ecritFraction(n1, d1), ecritFraction(n2, d2)];
  return {
    instruction: 'Compare avec <, > ou =',
    prompt: `${premier} … ${second}`,
    correct: reponse,
    wrong: ['<', '>', '='],
    howMany: 3,
    explanation:
      d1 === d2
        ? `Même dénominateur : on compare les numérateurs, ${n1} et ${n2}.`
        : `On écrit les deux fractions avec le dénominateur ${Math.max(d1, d2)} : ${d1 < d2 ? `${premier} = ${ecritFraction(n1 * (d2 / d1), d2)}` : `${second} = ${ecritFraction(n2 * (d1 / d2), d1)}`}.`,
  };
});

const ordonnerDesFractions = forme('fractions-ordonner', 8, (rng) => {
  const [petit, grand] = rngPick(rng, COUPLES.filter(([a, b]) => a !== b));
  const liste: [number, number][] = [];
  while (liste.length < 3) {
    const d = rng() < 0.5 ? petit : grand;
    const n = rngInt(rng, 1, d + 2);
    if (!liste.some(([a, b]) => memeValeur(a, b, n, d))) liste.push([n, d]);
  }
  const valeur = ([n, d]: [number, number]) => n / d;
  const range = [...liste].sort((a, b) => valeur(a) - valeur(b));
  const ecrit = (fractions: [number, number][]) => fractions.map(([n, d]) => ecritFraction(n, d)).join(' < ');
  const permutations = [[0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((ordre) => ordre.map((index) => range[index]));
  return {
    instruction: 'Range du plus petit au plus grand',
    prompt: liste.map(([n, d]) => ecritFraction(n, d)).join(', '),
    correct: ecrit(range),
    wrong: permutations.map(ecrit),
    explanation: `On écrit les fractions avec le même dénominateur, puis on compare : ${ecrit(range)}.`,
  };
});

const encadrerUneFraction = forme('fraction-encadrer', 8, (rng) => {
  const d = rngPick(rng, [2, 3, 4, 5, 6, 8, 10]);
  let n = rngInt(rng, d + 1, 5 * d);
  while (n % d === 0) n = rngInt(rng, d + 1, 5 * d);
  const q = Math.floor(n / d);
  const ecrit = (a: number, b: number) => `entre ${a} et ${b}`;
  return {
    instruction: 'Encadre cette fraction par deux entiers qui se suivent',
    prompt: ecritFraction(n, d),
    correct: ecrit(q, q + 1),
    // Le quotient d'à côté, le reste pris pour l'entier, le dénominateur pris pour l'entier.
    wrong: [
      ecrit(q - 1, q),
      ecrit(q + 1, q + 2),
      ecrit(q + 2, q + 3),
      ecrit(n % d, (n % d) + 1),
      ecrit(Math.floor(n / (d + 1)), Math.floor(n / (d + 1)) + 1),
      ecrit(d, d + 1),
    ].filter((choix) => choix !== ecrit(q, q + 1)),
    explanation: `${q} × ${d} = ${q * d} et ${q + 1} × ${d} = ${(q + 1) * d} : ${ecritFraction(n, d)} est ${ecrit(q, q + 1)}.`,
  };
});

const nombreMixte = forme('fraction-mixte', 8, (rng) => {
  const d = rngPick(rng, [2, 3, 4, 5, 6, 8, 10]);
  const q = rngInt(rng, 1, 4);
  const r = rngInt(rng, 1, d - 1);
  const n = q * d + r;
  const ecrit = (a: number, b: number, c: number) => `${a} + ${ecritFraction(b, c)}`;
  return {
    instruction: 'Écris avec un entier et une fraction',
    prompt: ecritFraction(n, d),
    correct: ecrit(q, r, d),
    // Les deux nombres échangés, un entier de trop, un reste mal pris : 7/3 = 2 + 1/3 et non 1 + 2/3.
    wrong: [ecrit(r, q, d), ecrit(q + 1, r, d), ecrit(q, d - r, d), ecrit(q, r, n), ecrit(q, r + 1, d)].filter((choix) => choix !== ecrit(q, r, d)),
    explanation: `${n} = ${q} × ${d} + ${r}, donc ${ecritFraction(n, d)} = ${q} + ${ecritFraction(r, d)}.`,
  };
});

const fractionSurDroite = forme('fraction-droite', 8, (rng) => {
  const [unites, d] = [rngInt(rng, 2, 3), rngPick(rng, [2, 3, 4, 5])];
  const intervalles = unites * d;
  let k = rngInt(rng, 1, intervalles - 1);
  while (k % d === 0) k = rngInt(rng, 1, intervalles - 1);
  const etiquettes: Record<number, string> = Object.fromEntries(Array.from({ length: unites + 1 }, (_, index) => [index * d, String(index)]));
  const fausses: [number, number][] = [
    [k - 1, d],
    [k + 1, d],
    [k, d + 1],
    [k, d - 1],
    [k, intervalles],
    [d - (k % d), d],
    [k % d, d],
  ];
  return {
    detail: `${k}-${d}-${unites}`,
    instruction: `Chaque unité est partagée en ${d} parts égales`,
    prompt: 'Quelle fraction indique la flèche ?',
    figure: droiteGraduee({ intervalles, etiquettes, fleche: k }, `Une droite graduée de 0 à ${unites}, avec ${d} parts égales entre deux entiers.`),
    correct: ecritFraction(k, d),
    wrong: fausses.filter(([a, b]) => a >= 1 && b >= 2 && !memeValeur(a, b, k, d)).map(([a, b]) => ecritFraction(a, b)),
    explanation: `La flèche est à ${k} ${accorde(k, 'graduation')} de 0. Chaque graduation vaut 1/${d}. Donc ${ecritFraction(k, d)}.`,
  };
});

/** Les fractions de quantité et leurs pourcentages : 10, 25, 50, 75 % d'abord, 20, 5 et 1 % ensuite. */
const POURCENTAGES: Record<number, { n: number; d: number; mots: string }> = {
  10: { n: 1, d: 10, mots: 'un dixième' },
  25: { n: 1, d: 4, mots: 'un quart' },
  50: { n: 1, d: 2, mots: 'un demi' },
  75: { n: 3, d: 4, mots: 'trois quarts' },
  20: { n: 1, d: 5, mots: 'un cinquième' },
  5: { n: 1, d: 20, mots: 'un vingtième' },
  1: { n: 1, d: 100, mots: 'un centième' },
};

function pourcentages(name: string, minStage: Stage, valeurs: number[]): Brique {
  return forme(name, minStage, (rng) => {
    const p = rngPick(rng, valeurs);
    const { n, d } = POURCENTAGES[p];
    const decimale = texte(p / 100);
    // 5 % n'a pas de fraction simple au programme (un vingtième) : on ne le propose qu'avec la virgule.
    const sorte = p === 5 ? 2 : rngInt(rng, 0, 2);
    if (sorte === 0) {
      return {
        instruction: 'Choisis le bon pourcentage',
        prompt: `Quel pourcentage correspond à ${ecritFraction(n, d)} ?`,
        correct: `${p} %`,
        wrong: [...valeurs, 10, 25, 50, 75, 100].filter((autre) => autre !== p).map((autre) => `${autre} %`),
        explanation: `${ecritFraction(n, d)} = ${decimale} = ${p} %.`,
      };
    }
    if (sorte === 1) {
      // « 25 % » s'écrit « 1/4 » : jamais 1/25, ni 25/1, ni 2/5.
      const fausses: [number, number][] = [[1, p], [p, 1], [d, n], [n, d + 1], [n + 1, d]];
      return {
        instruction: 'Écris avec une fraction simple',
        prompt: `${p} %`,
        correct: ecritFraction(n, d),
        wrong: fausses.filter(([a, b]) => b >= 1 && !memeValeur(a, b, n, d)).map(([a, b]) => ecritFraction(a, b)),
        explanation: `${p} %, c'est ${POURCENTAGES[p].mots} : ${ecritFraction(n, d)}.`,
      };
    }
    return {
      instruction: 'Écris avec une virgule',
      prompt: `${p} %`,
      correct: decimale,
      // 75 % lu 7,5 ou 0,075 : la virgule déplacée ; ou 75 tout court.
      wrong: fauxNombres(p / 100, [p / 10, p / 1000, p, p / 100 + 0.1, Number(`0.${String(p).split('').reverse().join('')}`)], { min: 0, decimales: 3 }).map(texte),
      explanation: `${p} % = ${p}/100 = ${decimale}.`,
    };
  });
}

const fractionEnDecimal = forme('fraction-en-decimal', 8, (rng) => {
  const choix: [number, number][] = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10]];
  const [n, d] = rngPick(rng, choix);
  const valeur = n / d;
  return {
    instruction: 'Écris avec une virgule',
    prompt: ecritFraction(n, d),
    correct: texte(valeur),
    // 3/4 lu « 3,4 » ou « 0,34 » : le numérateur et le dénominateur de part et d'autre de la virgule.
    wrong: fauxNombres(valeur, [Number(`${n}.${d}`), Number(`0.${n}${d}`), valeur * 10, valeur / 10, valeur + 0.1, valeur - 0.1], { min: 0, decimales: 3 }).map(texte),
    explanation: `${n} ÷ ${d} = ${texte(valeur)}.`,
  };
});

export const BRIQUES_6E: Brique[] = [
  // 6e, 1er trimestre
  dicteeGrande,
  lectureGrande,
  decompositionGrande,
  classesDuNombre,
  comparerGrands,
  suivantGrand,
  ecritureDecimale,
  lectureDecimale,
  chiffreDecimal,
  comparerDecimaux,
  comparerDecimauxAvecSignes,
  encadrerUnDecimal,
  intercalerUnDecimal,
  droiteDecimale,
  fractionEnMots,
  fractionDecimale,
  fractionQuotient,
  // 6e, 2e trimestre
  milliard,
  comparerDesFractions,
  ordonnerDesFractions,
  encadrerUneFraction,
  nombreMixte,
  fractionSurDroite,
  pourcentages('pourcentages', 8, [10, 25, 50, 75]),
  fractionEnDecimal,
  // 6e, 3e trimestre
  pourcentages('pourcentages-autres', 9, [20, 5, 1]),
];

/** Les questions de numération de la 6e. */
export function genererSixieme(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('numeration', BRIQUES_6E, stageOf(level, trimester), rng, count);
}
