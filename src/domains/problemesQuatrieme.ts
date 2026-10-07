import { rngInt, rngPick, type Rng } from '../lib/seededRandom';
import { tableauDeDonnees } from './figuresMaths';
import { deuxPrenoms, pronom, PRENOMS, type Brique } from './mathsCommun';
import { brique, entre, fauxEcrits, MOINS, nb, pgcd, puissance, rat, texteRat } from './mathsCycle4';
import { avecUnite, deNom, dureeEcrite, ecritFraction, entierSauf, euros, fauxAvecUnite, fauxPourcents, fractionsAuChoix, INSTRUCTION, INSTRUCTION_DONNEES, pourcent, queNom } from './problemesCollege';

/**
 * Les problèmes de la 4e (ancien programme de cycle 4, BO n° 31 du 30 juillet
 * 2020, repères annuels de 2019). Les élèves arrivent de la 5e : ils savent
 * ajouter et soustraire des relatifs, les pourcentages simples, une équation
 * simple. Le 1er trimestre apporte les relatifs multipliés, les puissances,
 * les évolutions en pourcentage et les échelles.
 *
 * - 1er trimestre : le produit et le quotient de relatifs dans une situation,
 *   une évolution en pourcentage et son coefficient multiplicateur, les
 *   échelles, une fraction d'une fraction, un tableau d'effectifs et les
 *   fréquences, les puissances dans une situation ;
 * - 2e trimestre : les grandeurs composées (vitesse, durée, distance), la mise
 *   en équation (ax + b = c), la comparaison de deux tarifs (ax + b = cx), un
 *   programme de calcul à l'envers, le pourcentage d'évolution entre deux
 *   valeurs ;
 * - 3e trimestre : la probabilité d'un événement et de son contraire.
 *
 * Hors programme, donc absent : la moyenne pondérée, la médiane et l'étendue
 * (3e), le PGCD, la notation scientifique, les fonctions, les systèmes.
 */

// === 1er trimestre (étape 13) ======================================================================================

const produitRelatifsContexte = brique('produit-relatifs-contexte', 13, (rng) => {
  const variante = rngInt(rng, 0, 5);
  const personne = rngPick(rng, PRENOMS);
  const a = rngInt(rng, 2, 12);
  const n = rngInt(rng, 2, 9);
  if (variante <= 3) {
    const [prompt, unite, montant] =
      variante === 0
        ? [`La température baisse de ${a} °C chaque heure. Quelle est la variation de température au bout de ${n} heures ?`, '°C', a]
        : variante === 1
          ? [`Un plongeur descend de ${a} m chaque minute. Quelle est la variation de son altitude au bout de ${n} minutes ?`, 'm', a]
          : variante === 2
            ? [`Chaque mois, ${a * 5} € sont prélevés sur le compte ${deNom(personne.nom)}. Quelle est la variation du solde au bout de ${n} mois ?`, '€', a * 5]
            : [`Dans un jeu, chaque erreur fait perdre ${a} points. ${personne.nom} fait ${n} erreurs. Quelle est la variation de son score ?`, 'points', a];
    const m = Number(montant);
    const resultat = -m * n;
    return {
      instruction: INSTRUCTION,
      prompt: String(prompt),
      correct: avecUnite(resultat, String(unite)),
      // Le signe oublié, l'addition au lieu du produit, un rang de trop ou de moins.
      wrong: fauxAvecUnite(resultat, [m * n, -(m + n), m - n, resultat + m, resultat - m, -m * (n + 1), -m * (n - 1)], String(unite), {}),
      explanation: `Chaque fois, la variation est ${nb(-m)}. Au total : ${entre(-m)} × ${n} = ${nb(resultat)}.`,
    };
  }
  if (variante === 4) {
    const part = rngPick(rng, [5, 10, 15, 20, 25, 30, 40]);
    const dette = part * n;
    return {
      instruction: INSTRUCTION,
      prompt: `Une dette de ${dette} € est partagée en parts égales entre ${n} amis. Quel est le solde de chacun ?`,
      correct: `${nb(-part)} €`,
      // Le signe oublié, la dette entière, la soustraction à la place de la division.
      wrong: fauxAvecUnite(-part, [part, -dette, dette, -(dette - n), -part * n * 2, -part - 5, -part + 5], '€', {}),
      explanation: `La dette est un nombre négatif : ${nb(-dette)} ÷ ${n} = ${nb(-part)}.`,
    };
  }
  const prelevement = rngPick(rng, [10, 15, 20, 25, 30, 40, 50]);
  const semaines = rngInt(rng, 3, 12);
  return {
    instruction: INSTRUCTION,
    prompt: `Chaque semaine, ${prelevement} € sont prélevés sur un compte. Au bout de plusieurs semaines, le solde a varié de ${nb(-prelevement * semaines)} €. Combien de semaines se sont écoulées ?`,
    correct: nb(semaines),
    // Le quotient de deux négatifs pris pour un négatif, la différence, un rang de trop ou de moins.
    wrong: fauxEcrits(semaines, [-semaines, prelevement * semaines - prelevement, semaines + 1, semaines - 1, prelevement - semaines, semaines * 2], nb, {}),
    explanation: `${nb(-prelevement * semaines)} ÷ ${entre(-prelevement)} = ${semaines} : le quotient de deux nombres négatifs est positif.`,
  };
});

// --- Les évolutions en pourcentage -----------------------------------------------------------------------------------

const ARTICLES = [
  { nom: 'jeu vidéo', un: 'Un', feminin: false },
  { nom: 'blouson', un: 'Un', feminin: false },
  { nom: 'sac à dos', un: 'Un', feminin: false },
  { nom: 'casque audio', un: 'Un', feminin: false },
  { nom: 'paire de baskets', un: 'Une', feminin: true },
  { nom: 'trottinette', un: 'Une', feminin: true },
  { nom: 'montre', un: 'Une', feminin: true },
  { nom: 'veste', un: 'Une', feminin: true },
];

const pourcentageEvolution = brique('pourcentage-evolution', 13, (rng) => {
  const article = rngPick(rng, ARTICLES);
  const hausse = rng() < 0.5;
  const p = rngPick(rng, [5, 10, 15, 20, 25, 30, 40, 50]);
  if (rng() < 0.35) {
    const coefficientJuste = 1 + (hausse ? p : -p) / 100;
    const contraire = 1 + (hausse ? -p : p) / 100;
    return {
      instruction: INSTRUCTION,
      prompt: `Pour ${hausse ? 'augmenter' : 'diminuer'} un prix de ${p} %, par quel nombre faut-il le multiplier ?`,
      correct: nb(coefficientJuste),
      // Le pourcentage écrit en nombre, l'évolution contraire, le pourcentage ajouté à 1 sans le diviser par 100.
      wrong: fauxEcrits(coefficientJuste, [p / 100, contraire, 1 + p, p, 1 + p / 10, 1 - p / 10, 100 + p], nb, { min: 0.01, decimales: 2 }),
      explanation: `${hausse ? 'Ajouter' : 'Retirer'} ${p} %, c'est multiplier par 1 ${hausse ? '+' : MOINS} ${nb(p / 100)} = ${nb(coefficientJuste)}.`,
    };
  }
  const prix = rngInt(rng, 1, 20) * 20;
  const variation = (prix * p) / 100;
  const final = hausse ? prix + variation : prix - variation;
  return {
    instruction: INSTRUCTION,
    prompt: `${article.un} ${article.nom} coûte ${prix} €. Son prix ${hausse ? 'augmente' : 'baisse'} de ${p} %. Quel est le nouveau prix ?`,
    correct: `${nb(final)} €`,
    // Le pourcentage ajouté ou retranché comme des euros, la variation seule, l'évolution dans l'autre sens.
    wrong: fauxAvecUnite(final, [hausse ? prix + p : prix - p, variation, hausse ? prix - variation : prix + variation, prix * (1 + p / 100) + (hausse ? 10 : -10), final + 5, final - 5, prix * p], '€', { min: 0.1, decimales: 2 }),
    explanation: `Le coefficient multiplicateur est ${nb(1 + (hausse ? p : -p) / 100)} : ${nb(prix)} × ${nb(1 + (hausse ? p : -p) / 100)} = ${nb(final)}.`,
  };
});

// --- Les échelles ------------------------------------------------------------------------------------------------------------

const ECHELLES_DE_CARTE = [10000, 20000, 25000, 50000, 100000, 200000];

const echelleConversion = brique('echelle-conversion', 13, (rng) => {
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const echelle = rngPick(rng, ECHELLES_DE_CARTE);
    const d = rngInt(rng, 2, 18);
    const km = (d * echelle) / 100000;
    return {
      instruction: INSTRUCTION,
      prompt: `Sur une carte à l'échelle 1/${nb(echelle)}, la distance entre deux villages mesure ${d} cm. Quelle est la distance réelle, en kilomètres ?`,
      correct: `${nb(km)} km`,
      // Les centimètres pris pour des kilomètres, les mètres, une conversion ratée d'un facteur 10.
      wrong: fauxAvecUnite(km, [d * echelle, (d * echelle) / 100, km * 10, km / 10, km * 100, (d * echelle) / 1000], 'km', { min: 0.01, decimales: 3 }),
      explanation: `${d} × ${nb(echelle)} = ${nb(d * echelle)} cm sur le terrain, soit ${nb((d * echelle) / 100)} m, soit ${nb(km)} km.`,
    };
  }
  if (variante === 1) {
    const echelle = rngPick(rng, [25000, 50000, 100000, 200000]);
    const km = echelle === 200000 ? rngInt(rng, 2, 10) * 2 : rngInt(rng, 2, 14);
    const cm = (km * 100000) / echelle;
    return {
      instruction: INSTRUCTION,
      prompt: `Deux villes sont distantes de ${km} km. Sur une carte à l'échelle 1/${nb(echelle)}, quelle est leur distance, en centimètres ?`,
      correct: `${nb(cm)} cm`,
      // Une conversion ratée d'un facteur 10, la multiplication par l'échelle à la place de la division.
      wrong: fauxAvecUnite(cm, [cm * 10, cm / 10, cm * 100, km * echelle, cm + 2, cm - 2, km], 'cm', { min: 0.1, decimales: 2 }),
      explanation: `${km} km = ${nb(km * 100000)} cm, puis ${nb(km * 100000)} ÷ ${nb(echelle)} = ${nb(cm)} cm.`,
    };
  }
  const echelle = rngPick(rng, [10, 20, 25, 40, 50]);
  const longueur = rngPick(rng, [3, 3.5, 4, 4.5, 5]);
  const cm = (longueur * 100) / echelle;
  const objet = rngPick(rng, [
    { nom: 'voiture', reel: 'La voiture réelle' },
    { nom: 'camion', reel: 'Le camion réel' },
    { nom: 'bateau', reel: 'Le bateau réel' },
  ]);
  return {
    instruction: INSTRUCTION,
    prompt: `Une maquette de ${objet.nom} est construite à l'échelle 1/${echelle}. ${objet.reel} mesure ${nb(longueur)} m. Quelle est la longueur de la maquette, en centimètres ?`,
    correct: `${nb(cm)} cm`,
    wrong: fauxAvecUnite(cm, [cm * 10, cm / 10, longueur * echelle, longueur / echelle, cm * 100, cm + 5, cm - 5], 'cm', { min: 0.1, decimales: 2 }),
    explanation: `${nb(longueur)} m = ${nb(longueur * 100)} cm, puis ${nb(longueur * 100)} ÷ ${echelle} = ${nb(cm)} cm.`,
  };
});

// --- Les fractions de fractions -------------------------------------------------------------------------------------------

/** Une fraction irréductible propre, de dénominateur au plus `max`. */
function fractionPropre(rng: Rng, max: number): [number, number] {
  for (;;) {
    const d = rngInt(rng, 2, max);
    const n = rngInt(rng, 1, d - 1);
    if (pgcd(n, d) === 1) return [n, d];
  }
}

const fractionDeFraction = brique('fraction-de-fraction', 13, (rng) => {
  const variante = rngInt(rng, 0, 3);
  if (variante <= 1) {
    const [n1, d1] = fractionPropre(rng, 8);
    let [n2, d2] = fractionPropre(rng, 8);
    while (n2 === n1 && d2 === d1) [n2, d2] = fractionPropre(rng, 8);
    const produit = rat(n1 * n2, d1 * d2);
    const contextes = [
      `Un jardin est planté de fleurs sur ${n1}/${d1} de sa surface. Parmi ces fleurs, ${n2}/${d2} sont des roses. Quelle fraction du jardin est plantée de roses ?`,
      `Dans une classe, ${n1}/${d1} des élèves sont des filles. Parmi elles, ${n2}/${d2} jouent au basket. Quelle fraction de la classe est formée de filles qui jouent au basket ?`,
      `Une bouteille est remplie à ${n1}/${d1}. On boit ${n2}/${d2} de ce qu'elle contient. Quelle fraction de la bouteille entière a-t-on bue ?`,
    ];
    return {
      instruction: INSTRUCTION,
      prompt: rngPick(rng, contextes),
      correct: texteRat(produit),
      // Les deux fractions additionnées terme à terme, la somme, le produit mal formé, le quotient.
      wrong: fractionsAuChoix(produit, [
        [n1 + n2, d1 + d2],
        [n1 * d2 + n2 * d1, d1 * d2],
        [n1 * n2, d1 + d2],
        [n1 * d2, d1 * n2],
        [n1 * n2, d1 * d2 + 1],
        [n1 * d1, n2 * d2],
      ]),
      explanation: `Prendre ${n2}/${d2} de ${n1}/${d1}, c'est multiplier : (${n1} × ${n2})/(${d1} × ${d2}) = ${n1 * n2}/${d1 * d2}${texteRat(produit) === `${n1 * n2}/${d1 * d2}` ? '' : ` = ${texteRat(produit)}`}.`,
    };
  }
  if (variante === 2) {
    // Des verres de n2/d2 L dans n1/d1 L : le nombre de verres est entier.
    const [n2, d2] = rngPick(rng, [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 8], [2, 5], [3, 8], [3, 10], [3, 4]] as [number, number][]);
    const k = rngInt(rng, 2, 9);
    const total = rat(k * n2, d2);
    const verre = rat(n2, d2);
    return {
      instruction: INSTRUCTION,
      prompt: `Une carafe contient ${texteRat(total)} L de jus de fruits. On remplit des verres de ${texteRat(verre)} L chacun. Combien de verres peut-on remplir ?`,
      correct: String(k),
      // Le produit au lieu du quotient, la fraction à l'envers, un verre de plus ou de moins.
      wrong: [String(k + 1), String(k - 1), String(k * 2), ...fractionsAuChoix(rat(k, 1), [[total.n * verre.n, total.d * verre.d], [total.n * verre.d + 1, total.d * verre.n]])].filter((texte) => texte !== String(k) && texte !== '0'),
      explanation: `On divise par ${texteRat(verre)} : ${texteRat(total)} × ${verre.d}/${verre.n} = ${k}.`,
    };
  }
  const [n, d] = fractionPropre(rng, 8);
  const pas = rngInt(rng, 3, 12);
  const personne = rngPick(rng, PRENOMS);
  const distance = rat(n * pas, d);
  return {
    instruction: INSTRUCTION,
    prompt: `Un pas ${deNom(personne.nom)} mesure ${n}/${d} m. Quelle distance parcourt-${pronom(personne)} en ${pas} pas, en mètres ?`,
    correct: texteRat(distance),
    // Le nombre de pas ajouté à la fraction, le produit mal simplifié, le quotient.
    wrong: fractionsAuChoix(distance, [
      [n + pas * d, d],
      [n, d * pas],
      [n * pas, d * pas],
      [pas * d, n],
      [n * pas + 1, d],
      [n * pas, d + pas],
    ]),
    explanation: `On multiplie : ${pas} × ${n}/${d} = ${n * pas}/${d}${texteRat(distance) === `${n * pas}/${d}` ? '' : ` = ${texteRat(distance)}`}.`,
  };
});

// --- Un tableau d'effectifs ------------------------------------------------------------------------------------------------------

interface SerieStatistique {
  /** « la pointure de chaque élève » : ce que le tableau relève. */
  releve: string;
  entete: string;
  valeurs: number[];
  /** Les élèves qui ont la valeur v : « chaussent du 38 », « ont eu 12 ». */
  ont: (v: number) => string;
  /** Les élèves qui ont au moins v : « chaussent du 38 ou plus ». */
  auMoins: (v: number) => string;
}

const accord = (v: number, mot: string) => `${v} ${mot}${v > 1 ? 's' : ''}`;

const SERIES: SerieStatistique[] = [
  { releve: 'la pointure de chaque élève', entete: 'Pointure', valeurs: [36, 37, 38, 39, 40, 41, 42], ont: (v) => `chaussent du ${v}`, auMoins: (v) => `chaussent du ${v} ou plus` },
  {
    releve: 'le nombre de frères et sœurs de chaque élève',
    entete: 'Frères et sœurs',
    valeurs: [0, 1, 2, 3, 4, 5],
    ont: (v) => (v === 0 ? "n'ont ni frère ni sœur" : v === 1 ? 'ont exactement un frère ou une sœur' : `ont exactement ${v} frères et sœurs`),
    auMoins: (v) => (v === 1 ? 'ont au moins un frère ou une sœur' : `ont au moins ${v} frères et sœurs`),
  },
  {
    releve: 'le nombre de livres lus pendant les vacances',
    entete: 'Livres lus',
    valeurs: [0, 1, 2, 3, 4, 5, 6],
    ont: (v) => (v === 0 ? "n'ont lu aucun livre" : `ont lu ${accord(v, 'livre')}`),
    auMoins: (v) => `ont lu au moins ${accord(v, 'livre')}`,
  },
  { releve: 'la note obtenue au dernier contrôle', entete: 'Note', valeurs: [8, 10, 12, 14, 16, 18], ont: (v) => `ont eu ${v}`, auMoins: (v) => `ont eu ${v} ou plus` },
];

const effectifsEtFrequences = brique('effectifs-frequences', 13, (rng) => {
  const serie = rngPick(rng, SERIES);
  const total = rngPick(rng, [20, 25, 40, 50]);
  const nombre = rngInt(rng, 4, 5);
  const debut = rngInt(rng, 0, serie.valeurs.length - nombre);
  const valeurs = serie.valeurs.slice(debut, debut + nombre);
  const effectifs = valeurs.map(() => 1);
  for (let reste = total - nombre; reste > 0; reste--) effectifs[rngInt(rng, 0, nombre - 1)] += 1;
  // Les effectifs sont tous différents du total divisé par le nombre de valeurs : une répartition trop régulière ferait trop de coïncidences.
  const figure = tableauDeDonnees([serie.entete, 'Effectif'], valeurs.map((valeur, rang) => [String(valeur), effectifs[rang]]));
  const variante = rngInt(rng, 0, 2);
  // « Au moins v » ne porte pas sur la plus petite valeur : ce serait toute la classe.
  const rang = rngInt(rng, variante === 2 ? 1 : 0, nombre - 1);
  const [v, effectif] = [valeurs[rang], effectifs[rang]];
  const detail = `effectifs-${serie.entete}-${valeurs.map((valeur, i) => `${valeur}x${effectifs[i]}`).join('.')}-${rang}`;
  const debutDuPrompt = `Le tableau donne ${serie.releve} dans une classe.`;
  if (variante === 0) {
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `${debutDuPrompt} Combien d'élèves compte la classe ?`,
      figure,
      correct: String(total),
      // Le plus grand effectif, le nombre de valeurs, la somme des valeurs lues dans la première colonne.
      wrong: fauxEcrits(total, [Math.max(...effectifs), nombre, valeurs.reduce((s, valeur) => s + valeur, 0), total + 2, total - 2, total + 5], String, { min: 1 }),
      explanation: `On additionne les effectifs : ${effectifs.join(' + ')} = ${total}.`,
    };
  }
  if (variante === 1) {
    const p = (100 * effectif) / total;
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `${debutDuPrompt} Quelle est la fréquence, en pourcentage, des élèves qui ${serie.ont(v)} ?`,
      figure,
      correct: pourcent(p),
      // L'effectif lu sans être divisé, le pourcentage complémentaire, l'effectif rapporté à autre chose que le total.
      wrong: fauxPourcents(p, [effectif, 100 - p, p + 5, p - 5, (100 * effectif) / (total - effectif), p * 2], { decimales: 1, max: 100 }),
      explanation: `La fréquence est l'effectif divisé par le total : ${effectif}/${total} = ${nb(effectif / total)}, soit ${nb(p)} %.`,
    };
  }
  const plusGrands = effectifs.slice(rang).reduce((somme, e) => somme + e, 0);
  return {
    detail,
    instruction: INSTRUCTION_DONNEES,
    prompt: `${debutDuPrompt} Combien d'élèves ${serie.auMoins(v)} ?`,
    figure,
    correct: String(plusGrands),
    // Un seul effectif, les effectifs des valeurs plus petites, tous les élèves.
    wrong: fauxEcrits(plusGrands, [effectif, total - plusGrands, total, plusGrands - effectif, plusGrands + effectifs[Math.max(0, rang - 1)], effectifs.slice(rang + 1).reduce((s, e) => s + e, 0)], String, { min: 0 }),
    explanation: `On additionne les effectifs à partir de la valeur ${v} : ${effectifs.slice(rang).join(' + ')} = ${plusGrands}.`,
  };
});

// --- Les puissances dans une situation -------------------------------------------------------------------------------------------------

const puissancesSituation = brique('puissances-situation', 13, (rng) => {
  const variante = rngInt(rng, 0, 3);
  const [base, exposant, prompt] =
    variante === 0
      ? ((n: number) => [2, n, `Une bactérie se divise en deux toutes les heures. Au départ, il y a une seule bactérie. Combien y en a-t-il au bout de ${n} heures ?`] as const)(rngInt(rng, 4, 10))
      : variante === 1
        ? ((n: number) => [3, n, `Une rumeur se répand : chaque personne qui l'apprend la répète à 3 nouvelles personnes. Combien de personnes l'apprennent à l'étape ${n}, en partant d'une seule personne à l'étape 0 ?`] as const)(rngInt(rng, 2, 6))
        : variante === 2
          ? ((n: number) => [2, n, `On plie une feuille de papier en deux, puis encore en deux, ${n} fois de suite. Combien de couches de papier y a-t-il alors ?`] as const)(rngInt(rng, 3, 8))
          : ((n: number) => [2, n, `Un tournoi à élimination directe compte ${n} tours : à chaque tour, les équipes jouent deux par deux et le perdant est éliminé. Combien d'équipes ont commencé le tournoi ?`] as const)(rngInt(rng, 3, 6));
  const valeur = base ** exposant;
  return {
    instruction: INSTRUCTION,
    prompt,
    correct: nb(valeur),
    // L'exposant multiplié par la base, l'exposant et la base échangés, un rang de trop ou de moins.
    wrong: fauxEcrits(valeur, [base * exposant, exposant ** base, base ** (exposant - 1), base ** (exposant + 1), base + exposant, valeur + base, valeur - base], nb, { min: 1 }),
    explanation: `Le nombre est multiplié par ${base} à chaque étape, ${exposant} fois : ${puissance(base, exposant)} = ${nb(valeur)}.`,
  };
});

export const BRIQUES_QUATRIEME_T1: Brique[] = [produitRelatifsContexte, pourcentageEvolution, echelleConversion, fractionDeFraction, effectifsEtFrequences, puissancesSituation];

// === 2e trimestre (étape 14) ======================================================================================

/** Des durées de trajet, en minutes : jamais exactement une heure, où la conversion ne sert à rien. */
const DUREES_DE_TRAJET = [30, 45, 75, 90, 120, 135, 150, 180, 210, 240];

/** Ceux qui roulent, avec des vitesses qui leur ressemblent (en km/h). */
const VEHICULES = [
  { nom: 'Un cycliste', il: 'il', vitesses: [12, 15, 18, 20, 24, 30] },
  { nom: 'Un bus', il: 'il', vitesses: [30, 40, 45, 50, 60, 75] },
  { nom: 'Une voiture', il: 'elle', vitesses: [40, 50, 60, 70, 80, 90, 100, 120] },
  { nom: 'Un train', il: 'il', vitesses: [60, 90, 100, 120, 150, 160] },
];

/** « 1,2 » ou « 10/3 » : le nombre d'heures d'un trajet, en décimal quand il se termine, en fraction sinon. */
const heuresEcrites = (distance: number, vitesse: number): string => {
  const { n, d } = rat(distance, vitesse);
  return [1, 2, 4, 5, 10, 20, 25].includes(d) ? nb(n / d) : texteRat(rat(n, d));
};

const vitesseGrandeursComposees = brique('vitesse-grandeurs-composees', 14, (rng) => {
  const variante = rngInt(rng, 0, 4);
  if (variante === 0) {
    for (;;) {
      const vehicule = rngPick(rng, VEHICULES);
      const v = rngPick(rng, vehicule.vitesses);
      const t = rngPick(rng, DUREES_DE_TRAJET);
      if ((v * t) % 60 !== 0) continue;
      const d = (v * t) / 60;
      const [h, m] = [Math.floor(t / 60), t % 60];
      // Les minutes lues comme une partie décimale (2 h 30 → 2,30), les minutes multipliées sans être converties, les heures seules.
      const lu = h + m / 100;
      const conversion = m === 0 ? '' : `${dureeEcrite(t)} = ${nb(t / 60)} h, donc `;
      return {
        instruction: INSTRUCTION,
        prompt: `${vehicule.nom} roule à ${v} km/h pendant ${dureeEcrite(t)}. Quelle distance parcourt-${vehicule.il} ?`,
        correct: `${nb(d)} km`,
        wrong: fauxAvecUnite(d, [v * lu, v * t, v * h, v + t, d + v, d - v, (v * t) / 100], 'km', { min: 1, decimales: 2 }),
        explanation: `${conversion}d = v × t = ${v} × ${nb(t / 60)} = ${nb(d)} km.`,
      };
    }
  }
  if (variante === 1) {
    for (;;) {
      const vehicule = rngPick(rng, VEHICULES);
      const v = rngPick(rng, vehicule.vitesses);
      const t = rngPick(rng, DUREES_DE_TRAJET);
      if ((v * t) % 60 !== 0) continue;
      const d = (v * t) / 60;
      const m = t % 60;
      const conversion = m === 0 ? '' : `${dureeEcrite(t)} = ${nb(t / 60)} h, donc `;
      return {
        instruction: INSTRUCTION,
        prompt: `${vehicule.nom} parcourt ${d} km en ${dureeEcrite(t)}. Quelle est sa vitesse moyenne, en km/h ?`,
        correct: `${nb(v)} km/h`,
        // La distance divisée par les minutes, la distance divisée par la durée lue en partie décimale, le produit.
        wrong: fauxAvecUnite(v, [d / t, d / (Math.floor(t / 60) + (t % 60) / 100), d * t, d + t, v + 5, v - 5, d / 2], 'km/h', { min: 0.1, decimales: 1 }),
        explanation: `${conversion}v = d ÷ t = ${d} ÷ ${nb(t / 60)} = ${nb(v)} km/h.`,
      };
    }
  }
  if (variante === 2) {
    for (;;) {
      const v = rngPick(rng, [30, 40, 45, 50, 60, 75, 80, 90, 100, 120]);
      const d = rngInt(rng, 3, 40) * 10;
      const minutes = (d * 60) / v;
      if (!Number.isInteger(minutes) || minutes < 20 || minutes > 300 || minutes % 60 === 0) continue;
      const heuresDecimales = d / v;
      const h = Math.floor(minutes / 60);
      // La partie décimale de la durée en heures lue comme des minutes : 1,5 h → 1 h 50 min.
      const partieDecimale = Math.round((heuresDecimales - Math.floor(heuresDecimales)) * 100);
      const mauvaise = partieDecimale === 0 ? '' : `${h} h ${partieDecimale} min`;
      return {
        instruction: INSTRUCTION,
        prompt: `Une voiture roule à ${v} km/h. Combien de temps met-elle pour parcourir ${d} km ?`,
        correct: dureeEcrite(minutes),
        // La partie décimale lue comme des minutes, l'heure arrondie, un quart d'heure ou dix minutes d'écart.
        wrong: [mauvaise, dureeEcrite(minutes + 10), dureeEcrite(minutes + 15), minutes > 25 ? dureeEcrite(minutes - 10) : '', dureeEcrite(60 * Math.round(d / v)), dureeEcrite(minutes + 30)].filter((texte) => texte !== '' && texte !== dureeEcrite(minutes)),
        explanation: `t = d ÷ v = ${d} ÷ ${v} = ${heuresEcrites(d, v)} h, soit ${dureeEcrite(minutes)}.`,
      };
    }
  }
  if (variante === 3) {
    const v = rngPick(rng, [18, 36, 54, 72, 90, 108, 126, 144]);
    const ms = v / 3.6;
    const sujet = v <= 36 ? 'Un cycliste' : v <= 72 ? 'Un scooter' : v <= 108 ? 'Une voiture' : 'Un train';
    return {
      instruction: INSTRUCTION,
      prompt: `${sujet} roule à ${v} km/h. Quelle est sa vitesse en mètres par seconde ?`,
      correct: `${nb(ms)} m/s`,
      // La conversion dans le mauvais sens, la division par 60, par 10.
      wrong: fauxAvecUnite(ms, [v * 3.6, v / 60, v / 10, v / 3, v / 6, ms + 2, ms - 2], 'm/s', { min: 0.1, decimales: 2 }),
      explanation: `1 km/h = 1 000 m ÷ 3 600 s, donc on divise par 3,6 : ${v} ÷ 3,6 = ${nb(ms)} m/s.`,
    };
  }
  const ms = rngPick(rng, [5, 10, 15, 20, 25, 30, 35, 40]);
  const kmh = ms * 3.6;
  const sujet = ms <= 10 ? 'Un cycliste' : ms <= 25 ? 'Un cheval au galop' : 'Un guépard';
  return {
    instruction: INSTRUCTION,
    prompt: `${sujet} se déplace à ${ms} m/s. Quelle est sa vitesse en kilomètres par heure ?`,
    correct: `${nb(kmh)} km/h`,
    wrong: fauxAvecUnite(kmh, [ms / 3.6, ms * 60, ms * 3, ms * 6, ms * 10, kmh + 5, kmh - 5], 'km/h', { min: 0.1, decimales: 2 }),
    explanation: `En une heure, il y a 3 600 s et 1 000 m font 1 km : ${ms} × 3,6 = ${nb(kmh)} km/h.`,
  };
});

// --- Mettre un problème en équation -------------------------------------------------------------------------------------------------------

const miseEnEquation = brique('mise-en-equation', 14, (rng) => {
  const variante = rngInt(rng, 0, 4);
  if (variante === 0) {
    const [fixe, m, mois] = [rngPick(rng, [10, 15, 20, 25, 30]), rngInt(rng, 4, 15), rngInt(rng, 3, 14)];
    const total = fixe + m * mois;
    const personne = rngPick(rng, PRENOMS);
    return {
      instruction: INSTRUCTION,
      prompt: `Un club de sport demande ${fixe} € d'inscription, puis ${m} € par mois. ${personne.nom} a payé ${total} € en tout. Pendant combien de mois s'est-${pronom(personne)} abonné${personne.fille ? 'e' : ''} ?`,
      correct: String(mois),
      // L'inscription oubliée, l'inscription comptée en plus, la division de la mauvaise somme.
      wrong: fauxEcrits(mois, [total / m, (total + fixe) / m, total - fixe - m, Math.round(total / (m + fixe)), mois + 1, mois - 1, total - m * fixe], nb, { min: 1, decimales: 0 }),
      explanation: `On pose x le nombre de mois : ${m}x + ${fixe} = ${total}, donc ${m}x = ${total - fixe} et x = ${mois}.`,
    };
  }
  if (variante === 1) {
    const [l, e] = [rngInt(rng, 4, 20), rngInt(rng, 2, 9)];
    const perimetre = 2 * (2 * l + e);
    return {
      instruction: INSTRUCTION,
      prompt: `Un rectangle a un périmètre de ${perimetre} cm. Sa longueur dépasse sa largeur de ${e} cm. Quelle est sa largeur ?`,
      correct: `${l} cm`,
      // Le demi-périmètre, le périmètre divisé par quatre, la différence oubliée.
      wrong: fauxAvecUnite(l, [perimetre / 2 - e, perimetre / 4, perimetre / 2, (perimetre - e) / 4, l + e, l - 1, l + 1], 'cm', { min: 1, decimales: 2 }),
      explanation: `On pose x la largeur : 2 × (x + x + ${e}) = ${perimetre}, donc 2x + ${e} = ${perimetre / 2}, puis x = ${l}.`,
    };
  }
  if (variante === 2) {
    const [premier, second] = deuxPrenoms(rng);
    const [x, e] = [rngInt(rng, 6, 30), rngInt(rng, 2, 9)];
    return {
      instruction: INSTRUCTION,
      prompt: `${premier.nom} a ${e} ans de plus ${queNom(second.nom)}. À eux deux, ils ont ${2 * x + e} ans. Quel est l'âge ${deNom(second.nom)} ?`,
      correct: `${x} ans`,
      // La moitié de la somme, l'écart d'âge oublié, l'âge de l'autre personne.
      wrong: fauxAvecUnite(x, [(2 * x + e) / 2, x + e, 2 * x + e - e, x - e, x + 1, x - 1, 2 * x], 'ans', { min: 1, decimales: 1 }),
      explanation: `On pose x l'âge ${deNom(second.nom)} : x + (x + ${e}) = ${2 * x + e}, donc 2x = ${2 * x}, puis x = ${x}.`,
    };
  }
  if (variante === 3) {
    const x = rngInt(rng, 5, 60);
    return {
      instruction: INSTRUCTION,
      prompt: `La somme de trois nombres entiers consécutifs est ${3 * x + 3}. Quel est le plus petit de ces trois nombres ?`,
      correct: String(x),
      // Le tiers de la somme, le nombre du milieu, le plus grand.
      wrong: fauxEcrits(x, [(3 * x + 3) / 3, x + 1, x + 2, (3 * x + 3) / 3 - 2, x - 1, x + 3], nb, { min: 1, decimales: 0 }),
      explanation: `On pose x le plus petit : x + (x + 1) + (x + 2) = ${3 * x + 3}, donc 3x + 3 = ${3 * x + 3} et x = ${x}.`,
    };
  }
  const [n, cahier, stylo] = [rngInt(rng, 2, 6), rngInt(rng, 10, 40) * 10, rngInt(rng, 5, 20) * 10];
  const total = n * cahier + stylo;
  return {
    instruction: INSTRUCTION,
    prompt: `${n} cahiers identiques et un stylo à ${euros(stylo)} coûtent ${euros(total)} en tout. Quel est le prix d'un cahier ?`,
    correct: euros(cahier),
    // Le stylo oublié, le total divisé par le nombre de cahiers, le stylo compté en plus.
    wrong: [euros(total / n), euros(total - stylo), euros(Math.round((total + stylo) / n)), euros(cahier + stylo), euros(cahier + 10), euros(cahier - 10)].filter((texte) => texte !== euros(cahier)),
    explanation: `On pose x le prix d'un cahier : ${n}x + ${nb(stylo / 100)} = ${nb(total / 100)}, donc ${n}x = ${nb((total - stylo) / 100)} et x = ${nb(cahier / 100)}.`,
  };
});

// --- Comparer deux tarifs --------------------------------------------------------------------------------------------------------------------

const deuxTarifs = brique('deux-tarifs', 14, (rng) => {
  const lieu = rngPick(rng, [
    { nom: 'une piscine', par: 'entrée', mot: "d'entrées" },
    { nom: 'une salle d\'escalade', par: 'séance', mot: 'de séances' },
    { nom: 'un cinéma', par: 'séance', mot: 'de séances' },
    { nom: 'un parc d\'attractions', par: 'visite', mot: 'de visites' },
  ]);
  if (rng() < 0.5) {
    // Tarif A : a + b·x ; tarif B : c·x.
    const b = rngInt(rng, 2, 6);
    const prixB = b + rngInt(rng, 2, 5);
    const x = rngInt(rng, 3, 14);
    const a = (prixB - b) * x;
    return {
      instruction: INSTRUCTION,
      prompt: `Dans ${lieu.nom}, le tarif A est de ${a} € d'abonnement, puis ${b} € par ${lieu.par}. Le tarif B est de ${prixB} € par ${lieu.par}, sans abonnement. Pour combien ${lieu.mot} les deux tarifs coûtent-ils le même prix ?`,
      correct: String(x),
      // L'abonnement divisé par un seul des deux tarifs, par leur somme, ou le prix d'une seule séance retiré.
      wrong: fauxEcrits(x, [a / prixB, a / (b + prixB), (a + b) / prixB, a - b, a / b, x + 1, x - 1], nb, { min: 1, decimales: 0 }),
      explanation: `On cherche x tel que ${a} + ${b}x = ${prixB}x, donc ${a} = ${prixB - b}x et x = ${x}.`,
    };
  }
  // Tarif A : a + b·x ; tarif B : d + c·x, avec b > c et d > a ... ou l'inverse.
  const [b, c] = [rngInt(rng, 5, 9), rngInt(rng, 2, 4)];
  const x = rngInt(rng, 3, 12);
  const a = rngInt(rng, 5, 15);
  const d = a + (b - c) * x;
  return {
    instruction: INSTRUCTION,
    prompt: `Dans ${lieu.nom}, le tarif A est de ${a} € d'abonnement, puis ${b} € par ${lieu.par}. Le tarif B est de ${d} € d'abonnement, puis ${c} € par ${lieu.par}. Pour combien ${lieu.mot} les deux tarifs coûtent-ils le même prix ?`,
    correct: String(x),
    // Les abonnements ajoutés au lieu d'être soustraits, les prix par séance additionnés.
    wrong: fauxEcrits(x, [(d + a) / (b - c), (d - a) / (b + c), (d - a) / b, (d - a) / c, d - a, x + 1, x - 1], nb, { min: 1, decimales: 0 }),
    explanation: `On cherche x tel que ${a} + ${b}x = ${d} + ${c}x, donc ${b - c}x = ${d - a} et x = ${x}.`,
  };
});

// --- Un programme de calcul à l'envers ---------------------------------------------------------------------------------------------------------------

const programmeInverse = brique('programme-inverse', 14, (rng) => {
  const relatifsPermis = rng() < 0.5;
  const x = relatifsPermis ? rngInt(rng, -9, 12) : rngInt(rng, 2, 15);
  const k = rngInt(rng, 2, 9);
  const a = rngInt(rng, 2, 20);
  const addition = rng() < 0.5;
  const multiplieDabord = rng() < 0.6;
  let r: number;
  let enonce: string;
  let explication: string;
  if (multiplieDabord) {
    r = k * x + (addition ? a : -a);
    enonce = `on le multiplie par ${k}, puis ${addition ? `on ajoute ${a}` : `on soustrait ${a}`}`;
    explication = `On remonte le programme : ${nb(r)} ${addition ? MOINS : '+'} ${a} = ${nb(r + (addition ? -a : a))}, puis ${nb(r + (addition ? -a : a))} ÷ ${k} = ${nb(x)}.`;
  } else {
    r = k * (x + (addition ? a : -a));
    enonce = `on ${addition ? `lui ajoute ${a}` : `lui soustrait ${a}`}, puis on multiplie le résultat par ${k}`;
    explication = `On remonte le programme : ${nb(r)} ÷ ${k} = ${nb(r / k)}, puis ${nb(r / k)} ${addition ? MOINS : '+'} ${a} = ${nb(x)}.`;
  }
  return {
    instruction: INSTRUCTION,
    prompt: `Programme de calcul : on choisit un nombre, ${enonce}. On obtient ${nb(r)}. Quel nombre a-t-on choisi ?`,
    correct: nb(x),
    // Les opérations refaites dans le même sens au lieu d'être inversées, l'ordre inversé, le signe perdu.
    wrong: fauxEcrits(
      x,
      multiplieDabord
        ? [k * r + (addition ? a : -a), r / k + (addition ? a : -a), (r + (addition ? a : -a)) / k, r - (addition ? a : -a), -x, x + 1, x - 1]
        : [k * r - (addition ? a : -a), r / k + (addition ? a : -a), r / k + (addition ? -a : a) + 2, r / (k + (addition ? a : -a)), -x, x + 1, x - 1],
      nb,
      { decimales: 1 }
    ),
    explanation: explication,
  };
});

// --- Le pourcentage d'évolution entre deux valeurs ---------------------------------------------------------------------------------------------------

const tauxEvolution = brique('taux-evolution', 14, (rng) => {
  const article = rngPick(rng, ARTICLES);
  const hausse = rng() < 0.5;
  const p = rngPick(rng, [5, 10, 20, 25, 40, 50]);
  const prix = rngInt(rng, 1, 15) * 20;
  const nouveau = hausse ? prix * (1 + p / 100) : prix * (1 - p / 100);
  const ecart = Math.abs(nouveau - prix);
  const deLArticle = `${article.feminin ? "d'une" : "d'un"} ${article.nom}`;
  return {
    instruction: INSTRUCTION,
    prompt: `Le prix ${deLArticle} passe de ${nb(prix)} € à ${nb(nouveau)} €. Quel est le pourcentage ${hausse ? "d'augmentation" : 'de réduction'} ?`,
    correct: pourcent(p),
    // L'écart en euros lu comme un pourcentage, l'écart rapporté au nouveau prix, le rapport des deux prix.
    wrong: fauxPourcents(p, [ecart, (100 * ecart) / nouveau, (100 * nouveau) / prix, 100 - p, p + 5, p - 5, p * 2], { decimales: 1, max: 1000, min: 1 }),
    explanation: `L'écart est ${hausse ? `${nb(nouveau)} ${MOINS} ${nb(prix)}` : `${nb(prix)} ${MOINS} ${nb(nouveau)}`} = ${nb(ecart)} €. On le rapporte au prix de départ : ${nb(ecart)}/${nb(prix)} = ${nb(ecart / prix)}, soit ${p} %.`,
  };
});

export const BRIQUES_QUATRIEME_T2: Brique[] = [vitesseGrandeursComposees, miseEnEquation, deuxTarifs, programmeInverse, tauxEvolution];

// === 3e trimestre (étape 15) ======================================================================================

interface EvenementDeCarte {
  phrase: string;
  /** Les numéros de 1 à n qui réalisent l'événement. */
  realise: (numero: number) => boolean;
}

const EVENEMENTS_DE_CARTE = (seuil: number): EvenementDeCarte[] => [
  { phrase: 'un nombre pair', realise: (n) => n % 2 === 0 },
  { phrase: 'un nombre impair', realise: (n) => n % 2 === 1 },
  { phrase: 'un multiple de 3', realise: (n) => n % 3 === 0 },
  { phrase: 'un multiple de 4', realise: (n) => n % 4 === 0 },
  { phrase: 'un multiple de 5', realise: (n) => n % 5 === 0 },
  { phrase: `un nombre supérieur à ${seuil}`, realise: (n) => n > seuil },
  { phrase: `un nombre inférieur ou égal à ${seuil}`, realise: (n) => n <= seuil },
  { phrase: 'un nombre à un chiffre', realise: (n) => n < 10 },
  { phrase: 'un nombre à deux chiffres', realise: (n) => n >= 10 },
  { phrase: 'un carré parfait', realise: (n) => Number.isInteger(Math.sqrt(n)) },
];

const probabiliteEvenement = brique('probabilite-evenement', 15, (rng) => {
  const n = rngPick(rng, [12, 15, 20, 24, 25, 30]);
  const seuil = rngInt(rng, 5, n - 4);
  const evenements = EVENEMENTS_DE_CARTE(seuil).filter(({ realise }) => {
    const compte = Array.from({ length: n }, (_, rang) => rang + 1).filter(realise).length;
    return compte > 0 && compte < n;
  });
  const evenement = rngPick(rng, evenements);
  const favorables = Array.from({ length: n }, (_, rang) => rang + 1).filter(evenement.realise).length;
  const juste = rat(favorables, n);
  const [variante] = [rngInt(rng, 0, 1)];
  return {
    instruction: INSTRUCTION,
    prompt: `${variante === 0 ? `On tire au hasard une carte parmi ${n} cartes numérotées de 1 à ${n}.` : `Une urne contient ${n} jetons numérotés de 1 à ${n}. On en tire un au hasard.`} Quelle est la probabilité d'obtenir ${evenement.phrase} ?`,
    correct: ecritFraction(favorables, n),
    // Les cas favorables rapportés aux cas défavorables, la probabilité de l'événement contraire, un cas de plus ou de moins.
    wrong: fractionsAuChoix(juste, [
      [favorables, n - favorables],
      [n - favorables, n],
      [n, favorables],
      [favorables + 1, n],
      [favorables - 1, n],
      [1, favorables],
      [favorables, n + 1],
    ]),
    explanation: `${favorables} numéros conviennent sur ${n}, tous aussi probables : ${favorables}/${n}${texteRat(juste) === `${favorables}/${n}` ? '' : ` = ${texteRat(juste)}`}.`,
  };
});

const probabiliteContraire = brique('probabilite-contraire', 15, (rng) => {
  const variante = rngInt(rng, 0, 3);
  const personne = rngPick(rng, PRENOMS);
  if (variante === 0) {
    const p = rngPick(rng, [0.05, 0.1, 0.15, 0.2, 0.25, 0.35, 0.4, 0.45, 0.6, 0.65, 0.7, 0.85]);
    const contraire = 1 - p;
    return {
      instruction: INSTRUCTION,
      prompt: `La probabilité ${queNom(personne.nom)} réussisse un tir au but est de ${nb(p)}. Quelle est la probabilité qu'${pronom(personne)} ne le réussisse pas ?`,
      correct: nb(contraire),
      // La probabilité elle-même, la probabilité plus un, la différence prise à l'envers.
      wrong: fauxEcrits(contraire, [p, 1 + p, p - 1, 1 / p, contraire + 0.1, contraire - 0.1, contraire + 0.05], nb, { min: -1, decimales: 2 }),
      explanation: `L'événement contraire a pour probabilité 1 − ${nb(p)} = ${nb(contraire)}.`,
    };
  }
  if (variante === 1) {
    const d = rngInt(rng, 3, 12);
    const n = rngPick(rng, Array.from({ length: d - 1 }, (_, rang) => rang + 1).filter((candidat) => pgcd(candidat, d) === 1));
    const couleur = rngPick(rng, ['rouge', 'verte', 'bleue', 'jaune']);
    return {
      instruction: INSTRUCTION,
      prompt: `Dans un sac, la probabilité de tirer une boule ${couleur} est de ${n}/${d}. Quelle est la probabilité de ne pas tirer une boule ${couleur} ?`,
      correct: ecritFraction(d - n, d),
      wrong: fractionsAuChoix(rat(d - n, d), [[n, d], [d, n], [n + d, d], [d - n, n], [1, n], [d - n + 1, d], [n - d, d]]),
      explanation: `La probabilité du contraire est 1 − ${n}/${d} = ${d - n}/${d}.`,
    };
  }
  if (variante === 2) {
    const p = rngPick(rng, [5, 10, 15, 20, 25, 30, 35, 40, 60, 65, 70, 75, 80, 90]);
    return {
      instruction: INSTRUCTION,
      prompt: `La météo annonce ${p} % de chances de pluie demain. Quelle est la probabilité qu'il ne pleuve pas ?`,
      correct: pourcent(100 - p),
      wrong: fauxPourcents(100 - p, [p, 100 + p, p - 100, 100 - p + 5, 100 - p - 5, p * 2], { decimales: 0, max: 1000, min: -100 }),
      explanation: `La probabilité du contraire est 100 % − ${p} % = ${100 - p} %.`,
    };
  }
  const total = rngInt(rng, 10, 40);
  const rouges = entierSauf(rng, 2, total - 2, [total / 2]);
  const juste = rat(total - rouges, total);
  return {
    instruction: INSTRUCTION,
    prompt: `Dans un sac de ${total} jetons, ${rouges} sont rouges. On tire un jeton au hasard. Quelle est la probabilité de ne pas obtenir un jeton rouge ?`,
    correct: ecritFraction(total - rouges, total),
    wrong: fractionsAuChoix(juste, [[rouges, total], [total - rouges, rouges], [rouges, total - rouges], [total, rouges], [total - rouges + 1, total], [total - rouges - 1, total]]),
    explanation: `${total} − ${rouges} = ${total - rouges} jetons ne sont pas rouges : ${total - rouges}/${total}${texteRat(juste) === `${total - rouges}/${total}` ? '' : ` = ${texteRat(juste)}`}.`,
  };
});

export const BRIQUES_QUATRIEME_T3: Brique[] = [probabiliteEvenement, probabiliteContraire];

/** Les problèmes de la 4e, dans l'ordre où le programme les amène. */
export const BRIQUES_QUATRIEME: Brique[] = [...BRIQUES_QUATRIEME_T1, ...BRIQUES_QUATRIEME_T2, ...BRIQUES_QUATRIEME_T3];
