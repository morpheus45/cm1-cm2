import type { Level, Question, Trimester } from '../types';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';
import { droiteGraduee, figurePartagee } from './figuresMaths';
import { ecritureChiffree, numberToFrenchWords } from './nombresEnLettres';
import { accorde, echanges, entierAvecBords, fabriquer, fauxNombres, type Brique, type Enonce } from './mathsCommun';

/**
 * La numération du CE1 et du CE2 (programme de mathématiques du cycle 2, 2025).
 *
 * Progression, cumulative :
 * - CE1, 1er trimestre : lire, écrire, comparer, ranger les nombres jusqu'à 100
 *   puis jusqu'à 1 000 ; unités, dizaines, centaines ; décompositions ; 99 → 100
 *   et 999 → 1 000 ; droite graduée de 1 en 1, de 10 en 10, de 100 en 100 ;
 *   encadrer à la dizaine et à la centaine ;
 * - CE1, 2e : ranger ; fractions : la moitié, le tiers, le quart d'une figure ;
 * - CE1, 3e : comparer des fractions unitaires, les placer sur une droite
 *   graduée ; la monnaie, et l'écriture à virgule d'un prix ;
 * - CE2, 1er : les nombres jusqu'à 10 000 : mots, chiffres, valeur des chiffres,
 *   comparer, ranger, encadrer, droite graduée ; fractions simples inférieures
 *   ou égales à 1 ; les prix à virgule ;
 * - CE2, 2e : comparer des fractions de même dénominateur, les placer sur une
 *   droite graduée.
 *
 * Pas de décimal comme nombre (la virgule ne vient qu'avec la monnaie), pas de
 * nombre au-delà de 1 000 au CE1 ni de 10 000 au CE2, jamais de fraction
 * supérieure à 1. Le CE1 ne connaît que le demi, le tiers et le quart ; le CE2
 * y ajoute cinquième, sixième, huitième et dixième.
 */

const MAX_CE1 = 1000;
const MAX_CE2 = 10000;
/** Le plus grand nombre que le niveau connaît, à cette étape. */
const plafond = (stage: Stage) => (stage <= -3 ? MAX_CE1 : MAX_CE2);

const forme = (name: string, minStage: Stage, make: (rng: Rng, stage: Stage) => Enonce): Brique => ({ name, minStage, make });

// --- Les nombres de chaque niveau --------------------------------------------------------------

/** Un nombre du CE1 : de deux chiffres surtout au début de l'année, de trois ensuite ; les bords
 *  (70 à 99, les centaines rondes) reviennent souvent, c'est là qu'on se trompe. */
function nombreCE1(rng: Rng, stage: Stage): number {
  if (rng() < (stage <= -5 ? 0.55 : 0.25)) return entierAvecBords(rng, 10, 99, [20, 21, 31, 70, 71, 77, 80, 81, 90, 91, 99]);
  return entierAvecBords(rng, 100, 999, [100, 101, 110, 180, 190, 199, 200, 300, 400, 500, 600, 700, 800, 900, 999]);
}

/** Un nombre du CE2 : de 1 000 à 9 999. */
const nombreCE2 = (rng: Rng): number =>
  entierAvecBords(rng, 1000, 9999, [1000, 1001, 1010, 1100, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 4040, 6070, 8090, 9999]);

// --- Les rangs : unités, dizaines, centaines, milliers ------------------------------------

const RANGS = [
  { nom: 'unité', pluriel: 'unités', poids: 1 },
  { nom: 'dizaine', pluriel: 'dizaines', poids: 10 },
  { nom: 'centaine', pluriel: 'centaines', poids: 100 },
  { nom: 'millier', pluriel: 'milliers', poids: 1000 },
];
const motDuRang = (rang: number, k: number) => (k > 1 ? RANGS[rang].pluriel : RANGS[rang].nom);

/** Les chiffres non nuls d'un nombre, du plus fort rang au plus faible. */
function termes(n: number): { rang: number; chiffre: number }[] {
  return String(n)
    .split('')
    .map((chiffre, index, tous) => ({ rang: tous.length - 1 - index, chiffre: Number(chiffre) }))
    .filter(({ chiffre }) => chiffre > 0);
}

/** « 300 + 40 + 7 ». */
const sommeDeValeurs = (n: number): string => termes(n).map(({ rang, chiffre }) => ecritureChiffree(chiffre * RANGS[rang].poids)).join(' + ');

/** « 3 centaines + 4 dizaines + 7 unités ». */
const sommeEnMots = (n: number): string => termes(n).map(({ rang, chiffre }) => `${chiffre} ${motDuRang(rang, chiffre)}`).join(' + ');

/** « 3 centaines, 4 dizaines et 7 unités ». */
function enMots(n: number): string {
  const morceaux = termes(n).map(({ rang, chiffre }) => `${chiffre} ${motDuRang(rang, chiffre)}`);
  return morceaux.length === 1 ? morceaux[0] : `${morceaux.slice(0, -1).join(', ')} et ${morceaux[morceaux.length - 1]}`;
}

/** Les erreurs d'écriture ou de lecture d'un nombre : deux chiffres échangés, un zéro de trop au milieu,
 *  un rang de trop ou de moins. */
function erreursDeNombre(n: number): number[] {
  const s = String(n);
  const zeros = s.length >= 3 ? [Number(`${s[0]}0${s.slice(1)}`), Number(`${s.slice(0, -1)}0${s.slice(-1)}`)] : [];
  return [...echanges(n), ...zeros, n + 10, n - 10, n + 1, n - 1, n + 100, n - 100, n + 1000, n - 1000];
}

/** Les mauvaises réponses d'un nombre : jamais au-delà des nombres du niveau. Une décomposition en
 *  rangs s'arrête aux milliers : 10 000 ne s'y décompose pas (`rangs`). */
const fauxDuNiveau = (n: number, candidats: number[], stage: Stage, min = 1, rangs = false) =>
  fauxNombres(n, candidats, { min, max: rangs ? Math.min(plafond(stage), 9999) : plafond(stage) });

// --- Lire et écrire les nombres ------------------------------------------------------------------

function dictee(name: string, minStage: Stage, tirer: (rng: Rng, stage: Stage) => number): Brique {
  return forme(name, minStage, (rng, stage) => {
    const n = tirer(rng, stage);
    return {
      instruction: 'Écris ce nombre en chiffres',
      prompt: `« ${numberToFrenchWords(n)} »`,
      correct: ecritureChiffree(n),
      wrong: fauxDuNiveau(n, erreursDeNombre(n), stage).map(ecritureChiffree),
      explanation: `${ecritureChiffree(n)} : ${enMots(n)}.`,
    };
  });
}

function lecture(name: string, minStage: Stage, tirer: (rng: Rng, stage: Stage) => number): Brique {
  return forme(name, minStage, (rng, stage) => {
    const n = tirer(rng, stage);
    return {
      instruction: 'Choisis comment on lit ce nombre',
      prompt: ecritureChiffree(n),
      correct: numberToFrenchWords(n),
      wrong: fauxDuNiveau(n, erreursDeNombre(n), stage).map(numberToFrenchWords),
      explanation: `${ecritureChiffree(n)} : ${enMots(n)}.`,
    };
  });
}

// --- Décomposer, valeur des chiffres ---------------------------------------------------------------

function decomposition(name: string, minStage: Stage, tirer: (rng: Rng, stage: Stage) => number): Brique {
  return forme(name, minStage, (rng, stage) => {
    const sorte = rngInt(rng, 0, 2);
    // Un nombre à un seul chiffre non nul (« 8 000 ») n'a rien à décomposer : on en cherche un autre.
    let n = tirer(rng, stage);
    while (sorte !== 1 && termes(n).length < 2) n = tirer(rng, stage);
    const lesTermes = termes(n);
    const ecrit = ecritureChiffree(n);
    if (sorte === 0) {
      // Chaque chiffre à son rang : 300 + 40 + 7 ; ou les chiffres seuls : 3 + 4 + 7.
      const chiffresSeuls = lesTermes.map(({ chiffre }) => chiffre).join(' + ');
      return {
        instruction: 'Choisis la bonne décomposition',
        prompt: `Décompose ${ecrit}`,
        correct: sommeDeValeurs(n),
        // Des sommes comme la bonne : « 20 » ou « 9 » ne ressemblent pas à une décomposition, on les écarte.
        wrong: [
          ...fauxDuNiveau(n, erreursDeNombre(n).filter((faux) => termes(faux).length >= 2), stage, 1, true).map(sommeDeValeurs),
          ...(chiffresSeuls !== sommeDeValeurs(n) ? [chiffresSeuls] : []),
        ],
        explanation: `${ecrit} = ${sommeDeValeurs(n)}.`,
      };
    }
    if (sorte === 1) {
      return {
        instruction: 'Écris le nombre',
        prompt: sommeEnMots(n),
        correct: ecrit,
        // 3 centaines et 7 unités : 37 et 3 007 sont les erreurs classiques, à côté de 370.
        wrong: fauxDuNiveau(n, erreursDeNombre(n), stage, 1, true).map(ecritureChiffree),
        explanation: `${sommeEnMots(n)} : ${ecrit}.`,
      };
    }
    const cache = rngPick(rng, lesTermes);
    const valeur = cache.chiffre * RANGS[cache.rang].poids;
    const morceaux = lesTermes.map((terme) => (terme === cache ? '…' : ecritureChiffree(terme.chiffre * RANGS[terme.rang].poids)));
    return {
      instruction: 'Complète',
      prompt: `${ecrit} = ${morceaux.join(' + ')}`,
      correct: ecritureChiffree(valeur),
      // Le chiffre seul, un rang de trop, un rang de moins.
      wrong: fauxDuNiveau(valeur, [cache.chiffre, valeur * 10, valeur / 10, valeur * 100, cache.chiffre * 100], stage, 1, true).map(ecritureChiffree),
      explanation: `${ecrit} = ${sommeDeValeurs(n)}.`,
    };
  });
}

/** Un nombre dont on interroge un chiffre : tous ses chiffres sont différents, pour qu'« le chiffre 4 » ne désigne qu'un seul rang. */
function nombreAChiffresDifferents(rng: Rng, tirer: (rng: Rng) => number): number {
  for (let essai = 0; ; essai++) {
    const n = tirer(rng);
    if (new Set(String(n)).size === String(n).length || essai > 60) return n;
  }
}

function chiffres(name: string, minStage: Stage, tirer: (rng: Rng, stage: Stage) => number, avecMilliers: boolean): Brique {
  return forme(name, minStage, (rng, stage) => {
    const n = nombreAChiffresDifferents(rng, (r) => tirer(r, stage));
    const longueur = String(n).length;
    const ecrit = ecritureChiffree(n);
    const rang = rngInt(rng, 0, longueur - 1);
    const chiffre = Number(String(n)[longueur - 1 - rang]);
    const sorte = rngInt(rng, 0, avecMilliers ? 2 : 1);
    if (sorte === 0 || (sorte === 1 && chiffre === 0)) {
      return {
        instruction: 'Cherche le bon chiffre',
        prompt: `Dans ${ecrit}, quel est le chiffre des ${RANGS[rang].pluriel} ?`,
        correct: String(chiffre),
        // Les autres chiffres du nombre : celui d'à côté, celui d'un autre rang.
        wrong: fauxNombres(chiffre, [...String(n).split('').map(Number), chiffre + 1, chiffre - 1, 0], { min: 0, max: 9 }).map(String),
        explanation: `${ecrit} : ${enMots(n)}.`,
      };
    }
    if (sorte === 1) {
      const valeur = chiffre * RANGS[rang].poids;
      return {
        instruction: 'Cherche la bonne valeur',
        prompt: `Dans ${ecrit}, quelle est la valeur du chiffre ${chiffre} ?`,
        correct: ecritureChiffree(valeur),
        wrong: fauxDuNiveau(valeur, [chiffre, valeur * 10, valeur / 10, chiffre * 100, chiffre * 1000], stage, 1, true).map(ecritureChiffree),
        explanation: `Le chiffre ${chiffre} est celui des ${RANGS[rang].pluriel} : il vaut ${ecritureChiffree(valeur)}.`,
      };
    }
    // Le nombre de dizaines, de centaines : toutes celles qu'on peut former.
    const hautRang = rngPick(rng, [1, 2].filter((candidat) => candidat < longueur));
    const nombre = Math.floor(n / RANGS[hautRang].poids);
    return {
      instruction: 'Compte toutes les parts',
      prompt: `Combien y a-t-il de ${RANGS[hautRang].pluriel} dans ${ecrit} ?`,
      correct: ecritureChiffree(nombre),
      // Le seul chiffre de ce rang, le nombre lui-même.
      wrong: fauxDuNiveau(nombre, [Number(String(n)[longueur - 1 - hautRang]), n, Math.floor(n / RANGS[hautRang + 1 < 4 ? hautRang + 1 : hautRang].poids), nombre * 10, nombre + 1, nombre - 1], stage).map(ecritureChiffree),
      explanation: `${ecrit} contient ${ecritureChiffree(nombre)} ${RANGS[hautRang].pluriel}.`,
    };
  });
}

const echangesDeRang: Brique = forme('echanges-de-rang', -5, (rng, stage) => {
  // Le CE1 ne connaît que les unités, les dizaines et les centaines : le millier est une notion du CE2.
  const rangs = stage <= -3 ? RANGS.slice(0, 3) : RANGS;
  const rang = rngInt(rng, 0, rangs.length - 2);
  const [petit, grand] = [rangs[rang], rangs[rang + 1]];
  return {
    instruction: 'Complète',
    prompt: `10 ${petit.pluriel}, c'est 1 …`,
    correct: grand.nom,
    wrong: rangs.filter((candidat) => candidat !== grand).map((candidat) => candidat.nom),
    explanation: `10 ${petit.pluriel} font 1 ${grand.nom}.`,
  };
});

// --- Avant, après, suite --------------------------------------------------------------------------------

function suivant(name: string, minStage: Stage, tirer: (rng: Rng) => number): Brique {
  return forme(name, minStage, (rng, stage) => {
    const apres = rng() < 0.5;
    const n = tirer(rng);
    const reponse = apres ? n + 1 : n - 1;
    return {
      instruction: apres ? 'Cherche le nombre qui suit' : 'Cherche le nombre qui précède',
      prompt: `Quel nombre vient juste ${apres ? 'après' : 'avant'} ${ecritureChiffree(n)} ?`,
      correct: ecritureChiffree(reponse),
      // L'avant pour l'après (et inversement), dix de plus, deux de plus.
      wrong: fauxDuNiveau(reponse, [apres ? n - 1 : n + 1, apres ? n + 10 : n - 10, apres ? n + 2 : n - 2, apres ? n + 100 : n - 100, n], stage, 0).map(ecritureChiffree),
      explanation: `${ecritureChiffree(reponse)} vient juste ${apres ? 'après' : 'avant'} ${ecritureChiffree(n)}.`,
    };
  });
}

const BORDS_CE1 = [9, 19, 29, 39, 49, 59, 69, 79, 89, 99, 109, 199, 299, 399, 499, 599, 699, 799, 899, 998, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 110, 120, 190];
const BORDS_CE2 = [999, 1999, 2999, 3999, 4999, 5999, 6999, 7999, 8999, 9999, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 1099, 1100, 1900, 2090, 2100];

const nombreQuiSuitCE1 = (rng: Rng): number => entierAvecBords(rng, 10, 999, BORDS_CE1, 2);
const nombreQuiSuitCE2 = (rng: Rng): number => entierAvecBords(rng, 1000, 9998, BORDS_CE2, 2);

function suite(name: string, minStage: Stage, pas: number[], debut: (rng: Rng, pas: number) => number, maximum: number): Brique {
  return forme(name, minStage, (rng, stage) => {
    const ecart = rngPick(rng, pas);
    const monte = rng() < 0.6;
    const premier = debut(rng, ecart);
    const valeurs = [0, 1, 2, 3].map((index) => (monte ? premier + index * ecart : premier - index * ecart));
    const [vus, reponse] = [valeurs.slice(0, 3), valeurs[3]];
    if (reponse < 0 || reponse > maximum) return suiteSansSortir(rng, stage, ecart, maximum);
    return {
      instruction: 'Complète la suite',
      prompt: `${vus.map(ecritureChiffree).join(', ')}, …`,
      correct: ecritureChiffree(reponse),
      // Le pas oublié (+1), le pas de la suite à l'envers, un pas de trop.
      wrong: fauxNombres(reponse, [vus[2] + (monte ? 1 : -1), monte ? reponse - 2 * ecart : reponse + 2 * ecart, monte ? reponse + ecart : reponse - ecart, vus[2] + (monte ? ecart * 2 : -ecart * 2), vus[2]], { min: 0, max: plafond(stage) }).map(ecritureChiffree),
      explanation: `La suite ${monte ? 'monte' : 'descend'} de ${ecritureChiffree(ecart)} en ${ecritureChiffree(ecart)}.`,
    };
  });
}

/** Une suite qui monte, sûre de ne pas sortir des nombres du niveau. */
function suiteSansSortir(rng: Rng, stage: Stage, ecart: number, maximum: number): Enonce {
  const premier = Math.floor(rngInt(rng, 0, Math.max(0, maximum - 4 * ecart)) / ecart) * ecart;
  const valeurs = [0, 1, 2, 3].map((index) => premier + index * ecart);
  return {
    instruction: 'Complète la suite',
    prompt: `${valeurs.slice(0, 3).map(ecritureChiffree).join(', ')}, …`,
    correct: ecritureChiffree(valeurs[3]),
    wrong: fauxNombres(valeurs[3], [valeurs[2] + 1, valeurs[3] + ecart, valeurs[3] - 2 * ecart, valeurs[2]], { min: 0, max: plafond(stage) }).map(ecritureChiffree),
    explanation: `La suite monte de ${ecritureChiffree(ecart)} en ${ecritureChiffree(ecart)}.`,
  };
}

// --- Comparer, ranger, encadrer ---------------------------------------------------------------------------

/** Quatre nombres qui se ressemblent : les chiffres d'un même nombre, rangés autrement. */
function nombresVoisins(rng: Rng, tirer: (rng: Rng) => number, combien: number): number[] {
  for (let essai = 0; ; essai++) {
    const base = tirer(rng);
    const chiffresDeBase = String(base).split('');
    const permutations = new Set<number>([base]);
    for (let k = 0; k < 40 && permutations.size < combien; k++) {
      const melange = rngShuffle(rng, chiffresDeBase);
      if (melange[0] !== '0') permutations.add(Number(melange.join('')));
    }
    if (permutations.size >= combien) return rngShuffle(rng, [...permutations]).slice(0, combien);
    // Des chiffres tous pareils : on prend des voisins plutôt que des permutations.
    if (essai > 30) return rngShuffle(rng, [base, base + 10, base - 10, base + 100].filter((n) => n > 0)).slice(0, combien);
  }
}

function comparerEnListe(name: string, minStage: Stage, tirer: (rng: Rng) => number): Brique {
  return forme(name, minStage, (rng) => {
    const liste = nombresVoisins(rng, tirer, 4);
    const plusGrand = rng() < 0.5;
    const reponse = plusGrand ? Math.max(...liste) : Math.min(...liste);
    return {
      instruction: plusGrand ? 'Choisis le plus grand nombre' : 'Choisis le plus petit nombre',
      prompt: liste.map(ecritureChiffree).join(', '),
      correct: ecritureChiffree(reponse),
      wrong: liste.filter((n) => n !== reponse).map(ecritureChiffree),
      explanation: `On compare chiffre par chiffre, en partant de la gauche. ${ecritureChiffree(reponse)} est le plus ${plusGrand ? 'grand' : 'petit'}.`,
    };
  });
}

/** Le rang du premier chiffre qui diffère : c'est lui qui décide. */
function rangQuiDecide(a: number, b: number): number {
  const [x, y] = [String(a), String(b)];
  if (x.length !== y.length) return Math.max(x.length, y.length) - 1;
  const index = x.split('').findIndex((chiffre, position) => chiffre !== y[position]);
  return x.length - 1 - index;
}

function comparerAvecSignes(name: string, minStage: Stage, tirer: (rng: Rng) => number): Brique {
  return forme(name, minStage, (rng) => {
    const [a, b] = nombresVoisins(rng, tirer, 2);
    const ecrit = (n: number) => ecritureChiffree(n);
    const decomposee = rng() < 0.4;
    // Une écriture décomposée d'un côté : elle peut valoir exactement l'autre nombre.
    const egaux = decomposee && rng() < 0.4;
    const gauche = decomposee ? sommeDeValeurs(a) : ecrit(a);
    const droite = egaux ? ecrit(a) : ecrit(b);
    const reponse = egaux ? '=' : a < b ? '<' : '>';
    const [petit, grand] = a < b ? [a, b] : [b, a];
    return {
      instruction: 'Compare avec <, > ou =',
      prompt: `${gauche} … ${droite}`,
      correct: reponse,
      wrong: ['<', '>', '='],
      howMany: 3,
      explanation: egaux
        ? `${gauche} s'écrit ${ecrit(a)} : les deux nombres sont égaux.`
        : `Les ${RANGS[rangQuiDecide(a, b)].pluriel} décident : ${ecrit(petit)} est plus petit que ${ecrit(grand)}.`,
    };
  });
}

function ranger(name: string, minStage: Stage, tirer: (rng: Rng) => number): Brique {
  return forme(name, minStage, (rng) => {
    const liste = nombresVoisins(rng, tirer, 3);
    const croissant = rng() < 0.6;
    const signe = croissant ? '<' : '>';
    const range = [...liste].sort((a, b) => (croissant ? a - b : b - a));
    const ecrit = (nombres: number[]) => nombres.map(ecritureChiffree).join(` ${signe} `);
    const permutations = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ].map((ordre) => ordre.map((index) => range[index]));
    return {
      instruction: `Range du ${croissant ? 'plus petit au plus grand' : 'plus grand au plus petit'}`,
      prompt: liste.map(ecritureChiffree).join(', '),
      correct: ecrit(range),
      wrong: permutations.slice(1).map(ecrit),
      explanation: `On compare les nombres deux à deux : ${ecrit(range)}.`,
    };
  });
}

function encadrer(name: string, minStage: Stage, rangs: number[], tirer: (rng: Rng, stage: Stage) => number): Brique {
  return forme(name, minStage, (rng, stage) => {
    const rang = rngPick(rng, rangs);
    const pas = RANGS[rang].poids;
    let n = tirer(rng, stage);
    // Un nombre rond n'est pas entre deux « dizaines » ; un nombre plus petit que le rang a 0 pour borne.
    while (n % pas === 0 || n < pas) n = tirer(rng, stage);
    const bas = Math.floor(n / pas) * pas;
    const haut = bas + pas;
    const ecrit = (a: number, b: number, c: number) => `${ecritureChiffree(a)} < ${ecritureChiffree(b)} < ${ecritureChiffree(c)}`;
    return {
      instruction: `Encadre entre deux ${RANGS[rang].pluriel} qui se suivent`,
      prompt: ecritureChiffree(n),
      correct: ecrit(bas, n, haut),
      // Des encadrements faux, jamais des encadrements plus larges mais justes : les deux bornes
      // décalées d'un rang ou de deux, ou rangées dans le mauvais sens.
      wrong: [
        ecrit(haut, n, haut + pas),
        ecrit(bas + 2 * pas, n, haut + 2 * pas),
        ecrit(haut, n, bas),
        ...(bas - pas >= 0 ? [ecrit(bas - pas, n, bas)] : []),
      ],
      explanation: `${ecritureChiffree(bas)} et ${ecritureChiffree(haut)} sont deux ${RANGS[rang].pluriel} qui se suivent : ${ecrit(bas, n, haut)}.`,
    };
  });
}

// --- La droite graduée ---------------------------------------------------------------------------------------

function droite(name: string, minStage: Stage, configs: { pas: number; debut: (rng: Rng) => number }[]): Brique {
  return forme(name, minStage, (rng, stage) => {
    const { pas, debut } = rngPick(rng, configs);
    const premier = debut(rng);
    const intervalles = 10;
    const valeur = (rang: number) => premier + rang * pas;
    const etiquettes: Record<number, string> = { 0: ecritureChiffree(valeur(0)), [intervalles]: ecritureChiffree(valeur(intervalles)) };
    const alt = `Une droite graduée de ${ecritureChiffree(pas)} en ${ecritureChiffree(pas)}, de ${etiquettes[0]} à ${etiquettes[intervalles]}.`;
    const instruction = `La droite est graduée de ${ecritureChiffree(pas)} en ${ecritureChiffree(pas)}`;
    if (rng() < 0.5) {
      // « Quel nombre indique la flèche ? » : une graduation entre les deux étiquettes.
      if (rng() < 0.5) etiquettes[5] = ecritureChiffree(valeur(5));
      const choix = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((rang) => !(rang in etiquettes));
      const rang = rngPick(rng, choix);
      const autres = [rang - 1, rang + 1, rang - 2, rang + 2, intervalles - rang].map(valeur);
      return {
        detail: `fleche-${premier}-${pas}-${rang}`,
        instruction,
        prompt: 'Quel nombre indique la flèche ?',
        figure: droiteGraduee({ intervalles, etiquettes, fleche: rang }, alt),
        correct: ecritureChiffree(valeur(rang)),
        wrong: fauxNombres(valeur(rang), autres, { min: Math.max(0, premier), max: Math.min(plafond(stage), valeur(intervalles)) }).map(ecritureChiffree),
        explanation: `On compte ${rang} ${accorde(rang, 'graduation')} de ${ecritureChiffree(pas)} depuis ${ecritureChiffree(valeur(0))} : ${ecritureChiffree(valeur(rang))}.`,
      };
    }
    // « Quelle lettre est à la place de 350 ? » : quatre lettres, une seule au bon endroit.
    const rangs = rngShuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const lettres = ['A', 'B', 'C', 'D'];
    const cherche = rngInt(rng, 0, 3);
    return {
      detail: `lettre-${premier}-${pas}-${rangs.join('.')}-${cherche}`,
      instruction,
      prompt: `Quelle lettre est à la place de ${ecritureChiffree(valeur(rangs[cherche]))} ?`,
      figure: droiteGraduee({ intervalles, etiquettes, lettres: Object.fromEntries(rangs.map((rang, index) => [rang, lettres[index]])) }, alt),
      correct: lettres[cherche],
      wrong: lettres.filter((lettre) => lettre !== lettres[cherche]),
      explanation: `${ecritureChiffree(valeur(rangs[cherche]))} est à ${rangs[cherche]} ${accorde(rangs[cherche], 'graduation')} de ${ecritureChiffree(valeur(0))} : c'est la lettre ${lettres[cherche]}.`,
    };
  });
}

// --- Les fractions ---------------------------------------------------------------------------------------------

/** Les fractions que le niveau connaît : demi, tiers, quart au CE1 ; cinquième, sixième, huitième et dixième au CE2. */
const DENOMINATEURS_CE1 = [2, 3, 4];
const DENOMINATEURS_CE2 = [2, 3, 4, 5, 6, 8, 10];
const denominateursDe = (stage: Stage) => (stage <= -3 ? DENOMINATEURS_CE1 : DENOMINATEURS_CE2);

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

/** « un quart », « trois quarts ». */
const fractionEnMots = (n: number, d: number) => `${NUMERATEURS[n]} ${n > 1 ? NOMS[d].pluriel : NOMS[d].un}`;
const ecritFraction = (n: number, d: number) => `${n}/${d}`;
const memeValeur = (n1: number, d1: number, n2: number, d2: number) => n1 * d2 === n2 * d1;

/** Les mauvaises fractions autour de n/d : jamais plus grandes que 1, jamais égales en valeur à n/d. */
function fractionsFausses(n: number, d: number, denominateurs: number[]): [number, number][] {
  const candidats: [number, number][] = [
    [n, d - n],
    [n, d + 1],
    [n, d - 1],
    [n + 1, d],
    [n - 1, d],
    [1, d],
    [d - n, d],
    [n, d + 2],
    [1, n + 1],
  ];
  return candidats.filter(([a, b]) => a >= 1 && b >= 2 && a <= b && denominateurs.includes(b) && !memeValeur(a, b, n, d));
}

function fractionSurFigure(name: string, minStage: Stage, unitaire: boolean): Brique {
  return forme(name, minStage, (rng, stage) => {
    const denominateurs = denominateursDe(stage);
    const d = rngPick(rng, denominateurs);
    const n = unitaire ? 1 : rngInt(rng, 1, d - 1);
    const sorte = rngPick(rng, ['barre', 'disque'] as const);
    return {
      detail: `${sorte}-${n}-${d}`,
      instruction: `${sorte === 'barre' ? 'La barre' : 'Le disque'} est partagé${sorte === 'barre' ? 'e' : ''} en ${d} parts égales`,
      prompt: 'Quelle fraction est coloriée ?',
      figure: figurePartagee(sorte, d, n),
      correct: ecritFraction(n, d),
      wrong: fractionsFausses(n, d, denominateurs).map(([a, b]) => ecritFraction(a, b)),
      explanation: `${n} part${n > 1 ? 's' : ''} sur ${d} ${n > 1 ? 'sont coloriées' : 'est coloriée'} : ${ecritFraction(n, d)}.`,
    };
  });
}

const OBJETS_A_PARTAGER = [
  { de: 'du gâteau', un: 'Un gâteau' },
  { de: 'de la tarte', un: 'Une tarte' },
  { de: 'de la pizza', un: 'Une pizza' },
  { de: 'de la tablette', un: 'Une tablette de chocolat' },
  { de: 'de la galette', un: 'Une galette' },
  { de: 'du melon', un: 'Un melon' },
  { de: 'de la brioche', un: 'Une brioche' },
  { de: 'du pain', un: 'Un pain' },
];

function fractionEnHistoire(name: string, minStage: Stage, unitaire: boolean): Brique {
  return forme(name, minStage, (rng, stage) => {
    const denominateurs = denominateursDe(stage);
    const d = rngPick(rng, denominateurs);
    const n = unitaire ? 1 : rngInt(rng, 1, d - 1);
    const objet = rngPick(rng, OBJETS_A_PARTAGER);
    return {
      instruction: 'Lis bien, puis choisis',
      prompt: `${objet.un} est partagé${objet.un.startsWith('Une') ? 'e' : ''} en ${d} parts égales. On en mange ${n}. Quelle fraction ${objet.de} mange-t-on ?`,
      correct: ecritFraction(n, d),
      wrong: fractionsFausses(n, d, denominateurs).map(([a, b]) => ecritFraction(a, b)),
      explanation: `On mange ${n} part${n > 1 ? 's' : ''} sur ${d} : ${ecritFraction(n, d)}.`,
    };
  });
}

function fractionEnMotsBrique(name: string, minStage: Stage, unitaire: boolean): Brique {
  return forme(name, minStage, (rng, stage) => {
    const denominateurs = denominateursDe(stage);
    const d = rngPick(rng, denominateurs);
    const n = unitaire ? 1 : rngInt(rng, 1, d - 1);
    const motsFaux = (dd: number) => `${NUMERATEURS[n]} ${n > 1 ? NOMS[dd].pluriel : NOMS[dd].un}`;
    if (rng() < 0.5) {
      return {
        instruction: 'Écris cette fraction en chiffres',
        prompt: `« ${fractionEnMots(n, d)} »`,
        correct: ecritFraction(n, d),
        wrong: fractionsFausses(n, d, denominateurs).map(([a, b]) => ecritFraction(a, b)),
        explanation: `${fractionEnMots(n, d)} s'écrit ${ecritFraction(n, d)}.`,
      };
    }
    // « 1/3 » lu « un troisième » : l'erreur de lecture du dénominateur.
    const ordinal: Record<number, string> = { 2: 'deuxième', 3: 'troisième', 4: 'quatrième', 5: 'cinquième', 6: 'sixième', 8: 'huitième', 10: 'dixième' };
    return {
      instruction: 'Choisis comment on lit cette fraction',
      prompt: ecritFraction(n, d),
      correct: fractionEnMots(n, d),
      wrong: [
        ...denominateurs.filter((autre) => autre !== d).map(motsFaux),
        ...(d !== 5 && d !== 6 && d !== 8 && d !== 10 ? [`${NUMERATEURS[n]} ${ordinal[d]}`] : []),
      ],
      explanation: `${ecritFraction(n, d)} se lit ${fractionEnMots(n, d)}.`,
    };
  });
}

function fractionsAComparer(name: string, minStage: Stage): Brique {
  return forme(name, minStage, (rng, stage) => {
    const denominateurs = denominateursDe(stage);
    const sorte = stage <= -3 ? 0 : rngInt(rng, 0, 1);
    if (sorte === 0) {
      // Des fractions unitaires : plus le dénominateur est grand, plus la part est petite.
      const [d1, d2] = rngShuffle(rng, denominateurs).slice(0, 2);
      const reponse = d1 < d2 ? '>' : '<';
      return {
        instruction: 'Compare avec <, > ou =',
        prompt: `${ecritFraction(1, d1)} … ${ecritFraction(1, d2)}`,
        correct: reponse,
        wrong: ['<', '>', '='],
        howMany: 3,
        explanation: `Plus on partage en parts, plus chaque part est petite : ${ecritFraction(1, Math.min(d1, d2))} est plus grand que ${ecritFraction(1, Math.max(d1, d2))}.`,
      };
    }
    // Même dénominateur : le plus grand numérateur gagne.
    const d = rngPick(rng, denominateurs.filter((candidat) => candidat >= 5));
    const numerateurs = rngShuffle(rng, Array.from({ length: d - 1 }, (_, index) => index + 1)).slice(0, 4);
    const plusGrand = rng() < 0.5;
    const reponse = plusGrand ? Math.max(...numerateurs) : Math.min(...numerateurs);
    return {
      instruction: plusGrand ? 'Choisis la plus grande fraction' : 'Choisis la plus petite fraction',
      prompt: numerateurs.map((n) => ecritFraction(n, d)).join(', '),
      correct: ecritFraction(reponse, d),
      wrong: numerateurs.filter((n) => n !== reponse).map((n) => ecritFraction(n, d)),
      explanation: `Les parts sont les mêmes : la fraction qui a le plus ${plusGrand ? 'grand' : 'petit'} numérateur est la plus ${plusGrand ? 'grande' : 'petite'}.`,
    };
  });
}

function fractionSurDroite(name: string, minStage: Stage, unitaire: boolean): Brique {
  return forme(name, minStage, (rng, stage) => {
    const denominateurs = denominateursDe(stage);
    const d = rngPick(rng, denominateurs);
    const n = unitaire ? 1 : rngInt(rng, 1, d - 1);
    return {
      detail: `${n}-${d}`,
      instruction: `La droite est graduée en ${d} parts égales`,
      prompt: 'Quelle fraction indique la flèche ?',
      figure: droiteGraduee({ intervalles: d, etiquettes: { 0: '0', [d]: '1' }, fleche: n }, `Une droite graduée de 0 à 1, partagée en ${d} parts égales.`),
      correct: ecritFraction(n, d),
      wrong: fractionsFausses(n, d, denominateurs).map(([a, b]) => ecritFraction(a, b)),
      explanation: `La flèche est à ${n} part${n > 1 ? 's' : ''} de 0. Chaque part vaut 1/${d}. Donc ${ecritFraction(n, d)}.`,
    };
  });
}

// --- La monnaie -------------------------------------------------------------------------------------------------------

const CENTIMES = [5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
const deuxChiffres = (n: number) => String(n).padStart(2, '0');
const prix = (euros: number, centimes: number) => `${euros},${deuxChiffres(centimes)} €`;
const enCentimes = (euros: number, centimes: number) => euros * 100 + centimes;

/** Ce que vaut un prix écrit, en centimes : « 3,50 € » vaut 350, « 350 € » vaut 35 000. */
const valeurEnCentimes = (texte: string): number => Math.round(Number(texte.replace(/[^\d,]/g, '').replace(',', '.')) * 100);

function monnaie(name: string, minStage: Stage, maxEuros: number): Brique {
  return forme(name, minStage, (rng) => {
    const euros = rngInt(rng, 1, maxEuros);
    const centimes = rngPick(rng, CENTIMES);
    const retourne = Number(deuxChiffres(centimes).split('').reverse().join(''));
    const dizainesDeCentimes = Math.floor(centimes / 10);
    const juste = prix(euros, centimes);
    if (rng() < 0.5) {
      // « 3 euros et 50 centimes » s'écrit « 3,50 € » : pas « 350 € », « 3,05 € », « 50,03 € ».
      const candidats = [
        `${euros}${deuxChiffres(centimes)} €`,
        `${centimes},${deuxChiffres(euros % 100)} €`,
        prix(euros, retourne),
        prix(euros, dizainesDeCentimes),
        prix(euros * 10 + dizainesDeCentimes, centimes % 10),
      ];
      return {
        instruction: 'Choisis la bonne écriture du prix',
        prompt: `${euros} euro${euros > 1 ? 's' : ''} et ${centimes} centimes`,
        correct: juste,
        // Une proposition qui vaut le même prix n'est pas une erreur : on l'écarte.
        wrong: candidats.filter((texte) => valeurEnCentimes(texte) !== valeurEnCentimes(juste)),
        explanation: `${euros} euro${euros > 1 ? 's' : ''}, une virgule, puis ${centimes} centimes : ${juste}.`,
      };
    }
    // « 76 euros », pas « 76 euros 0 centime » : on ne dit pas les centimes quand il n'y en a pas.
    const dit = (e: number, c: number) => `${e} euro${e > 1 ? 's' : ''}${c > 0 ? ` ${c} centime${c > 1 ? 's' : ''}` : ''}`;
    return {
      instruction: 'Choisis ce que veut dire ce prix',
      prompt: juste,
      correct: dit(euros, centimes),
      wrong: [
        dit(euros, dizainesDeCentimes),
        dit(centimes, euros % 100),
        `${euros}${deuxChiffres(centimes)} euros`,
        dit(euros, retourne),
        dit(euros * 10 + dizainesDeCentimes, centimes % 10),
      ].filter((texte) => texte !== dit(euros, centimes)),
      explanation: `Avant la virgule, les euros : ${euros}. Après, les centimes : ${centimes}.`,
    };
  });
}

function prixAComparer(name: string, minStage: Stage): Brique {
  return forme(name, minStage, (rng) => {
    for (;;) {
      const euros = rngInt(rng, 1, 9);
      const centimes = rngPick(rng, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 65, 75, 80, 90]);
      // Les mêmes chiffres rangés autrement : 3,50 € ; 3,05 € ; 5,30 € ; 0,53 €.
      const ensemble = new Map<number, string>();
      const ajoute = (e: number, c: number) => {
        if (c >= 0 && c < 100 && e >= 0 && !ensemble.has(enCentimes(e, c))) ensemble.set(enCentimes(e, c), prix(e, c));
      };
      ajoute(euros, centimes);
      ajoute(euros, Math.floor(centimes / 10) + (centimes % 10) * 10);
      ajoute(euros, Math.floor(centimes / 10) || 5);
      ajoute(Math.floor(centimes / 10) || 1, euros * 10);
      ajoute(0, centimes);
      ajoute(centimes < 10 ? 1 : Math.floor(centimes / 10), euros);
      if (ensemble.size < 4) continue;
      const liste = rngShuffle(rng, [...ensemble.entries()]).slice(0, 4);
      const plusGrand = rng() < 0.5;
      const cible = (plusGrand ? Math.max : Math.min)(...liste.map(([valeur]) => valeur));
      return {
        instruction: plusGrand ? 'Choisis le plus grand prix' : 'Choisis le plus petit prix',
        prompt: liste.map(([, texte]) => texte).join(', '),
        correct: ensemble.get(cible) as string,
        wrong: liste.filter(([valeur]) => valeur !== cible).map(([, texte]) => texte),
        explanation: 'On compare d\'abord les euros, puis les centimes.',
      };
    }
  });
}

// --- La liste des briques -----------------------------------------------------------------------------------------------

const DROITE_CE1 = [
  { pas: 1, debut: (rng: Rng) => rngInt(rng, 0, 98) },
  { pas: 10, debut: (rng: Rng) => rngInt(rng, 0, 9) * 10 + rngInt(rng, 0, 8) * 100 },
  { pas: 100, debut: () => 0 },
];

const DROITE_CE2 = [
  { pas: 100, debut: (rng: Rng) => rngInt(rng, 1, 8) * 1000 },
  { pas: 1000, debut: () => 0 },
  { pas: 10, debut: (rng: Rng) => rngInt(rng, 10, 89) * 100 },
];

export const BRIQUES_CYCLE2: Brique[] = [
  // CE1, 1er trimestre
  dictee('dictee', -5, nombreCE1),
  lecture('lecture', -5, nombreCE1),
  decomposition('decomposition', -5, nombreCE1),
  chiffres('chiffres', -5, nombreCE1, false),
  echangesDeRang,
  suivant('suivant', -5, nombreQuiSuitCE1),
  comparerEnListe('comparer', -5, (rng) => nombreCE1(rng, -4)),
  comparerAvecSignes('comparer-signes', -5, (rng) => nombreCE1(rng, -4)),
  encadrer('encadrer', -5, [1, 2], nombreCE1),
  droite('droite', -5, DROITE_CE1),
  suite('suite', -5, [10, 100, 1], (rng, pas) => (pas === 1 ? entierAvecBords(rng, 10, 995, [97, 98, 99, 197, 198, 199, 297, 298, 299, 397, 398, 399], 2) : rngInt(rng, 5, 600)), MAX_CE1),
  // CE1, 2e trimestre
  ranger('ranger', -4, (rng) => nombreCE1(rng, -4)),
  fractionSurFigure('fraction-figure', -4, true),
  fractionEnHistoire('fraction-histoire', -4, true),
  fractionEnMotsBrique('fraction-mots', -4, true),
  // CE1, 3e trimestre
  fractionsAComparer('fractions-comparer', -3),
  fractionSurDroite('fraction-droite', -3, true),
  monnaie('monnaie', -3, 19),
  // CE2, 1er trimestre
  dictee('dictee-milliers', -2, (rng) => nombreCE2(rng)),
  lecture('lecture-milliers', -2, (rng) => nombreCE2(rng)),
  decomposition('decomposition-milliers', -2, (rng) => nombreCE2(rng)),
  chiffres('chiffres-milliers', -2, (rng) => nombreCE2(rng), true),
  suivant('suivant-milliers', -2, nombreQuiSuitCE2),
  comparerEnListe('comparer-milliers', -2, (rng) => nombreCE2(rng)),
  comparerAvecSignes('comparer-signes-milliers', -2, (rng) => nombreCE2(rng)),
  ranger('ranger-milliers', -2, (rng) => nombreCE2(rng)),
  encadrer('encadrer-milliers', -2, [1, 2, 3], (rng) => nombreCE2(rng)),
  droite('droite-milliers', -2, DROITE_CE2),
  suite('suite-milliers', -2, [10, 100, 1000], (rng, pas) => (pas === 1000 ? rngInt(rng, 1, 5) * 1000 : pas === 100 ? rngInt(rng, 10, 70) * 100 : rngInt(rng, 100, 880) * 10), MAX_CE2),
  fractionSurFigure('fraction-figure-ce2', -2, false),
  fractionEnHistoire('fraction-histoire-ce2', -2, false),
  fractionEnMotsBrique('fraction-mots-ce2', -2, false),
  monnaie('monnaie-ce2', -2, 99),
  prixAComparer('prix-comparer', -2),
  // CE2, 2e trimestre
  fractionsAComparer('fractions-comparer-ce2', -1),
  fractionSurDroite('fraction-droite-ce2', -1, false),
];

/** Les questions de numération du CE1 et du CE2. */
export function genererCycle2(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('numeration', BRIQUES_CYCLE2, stageOf(level, trimester), rng, count);
}
