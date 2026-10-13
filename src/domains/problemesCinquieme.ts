import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { diagrammeEnBarres } from './figuresMaths';
import { diagrammeCirculaire, droiteDuRepere, repere, tableauDeValeurs } from './figuresCycle4';
import { deuxPrenoms, il, pronom, PRENOMS, type Brique } from './mathsCommun';
import { brique, entre, fauxEcrits, fixe, MOINS, nb, pgcd, rat, relatif, sup, texteRat, type Rat } from './mathsCycle4';
import { THEMES } from './problemesCommun';
import { avecUnite, deNom, ecritFraction, entierSauf, euros, fauxAvecUnite, fauxEuros, fauxPourcents, fractionsAuChoix, INSTRUCTION, INSTRUCTION_DONNEES, pourcent, queNom, sommeAvecSigne } from './problemesCollege';

/**
 * Les problèmes de la 5e (programme de mathématiques du cycle 4, BO n° 10 du
 * 5 mars 2026). Les élèves arrivent du cycle 3 : les nombres relatifs, les
 * pourcentages, les fonctions et les probabilités sont nouveaux.
 *
 * - 1er trimestre : les relatifs dans une situation (température, altitude,
 *   solde), la proportionnalité (prix, coefficient, tableau), utiliser une
 *   formule, un programme de calcul, les fréquences, lire un diagramme en
 *   barres, les achats avec des décimaux, la division par un décimal, le
 *   carré et le cube dans une situation ;
 * - 2e trimestre : l'écart entre deux relatifs, un bilan de gains et de
 *   pertes, une fraction d'une quantité, les fractions de dénominateurs
 *   quelconques, les pourcentages (remise), le graphique d'une situation
 *   proportionnelle, les équations simples ;
 * - 3e trimestre : la moyenne, le diagramme circulaire, comparer deux séries,
 *   l'équiprobabilité, le volume d'un prisme droit, l'aire d'un triangle et
 *   d'un parallélogramme.
 *
 * Hors programme, donc absent : multiplier ou diviser des relatifs, la
 * médiane, les équations avec la lettre des deux côtés, la racine carrée, le
 * produit en croix présenté comme une règle.
 */

/** Le nom des gens qu'un thème de données compte : « élèves », « enfants ». */
const gens = (total: string) => total.replace(/^d'|^de /, '');

// === 1er trimestre (étape 10) ======================================================================================

const LIEUX_FROIDS = ['À Chamonix', 'À Briançon', 'À Grenoble', 'À Annecy', 'À Besançon', 'À Nancy', 'À Strasbourg', 'À Clermont-Ferrand', 'À Lille', 'À Reims'];
const PROFONDEURS = ['Un sous-marin', 'Un plongeur', 'Un drone', 'Un petit robot sous-marin', 'Un ballon-sonde'];

/** Un nombre relatif, parfois un demi (à partir du 2e trimestre) : -3,5 ; 12. */
const relatifOuDemi = (rng: Rng, max: number, demi: boolean) => {
  const n = relatif(rng, max);
  return demi && rng() < 0.4 ? n + (n > 0 ? 0.5 : -0.5) : n;
};

const evolutionRelatifs = brique('evolution-relatifs', 10, (rng, stage) => {
  const contexte = rngInt(rng, 0, 2);
  const demi = stage >= 11 && contexte === 0;
  const depart = relatifOuDemi(rng, contexte === 1 ? 60 : contexte === 0 ? 12 : 80, demi);
  const hausse = rng() < 0.5;
  const c = contexte === 1 ? rngInt(rng, 5, 80) : demi && rng() < 0.4 ? rngInt(rng, 2, 14) + 0.5 : rngInt(rng, 2, contexte === 0 ? 15 : 90);
  const variation = hausse ? c : -c;
  const resultat = depart + variation;
  const unite = contexte === 0 ? '°C' : contexte === 1 ? 'm' : '€';
  let prompt: string;
  if (contexte === 0) {
    prompt = `${rngPick(rng, LIEUX_FROIDS)}, il fait ${nb(depart)} °C à ${rngPick(rng, [6, 7, 8, 9])} h. Dans la journée, la température ${hausse ? 'monte' : 'baisse'} de ${nb(c)} °C. Quelle est la température en fin de journée ?`;
  } else if (contexte === 1) {
    prompt = `${rngPick(rng, PROFONDEURS)} est à ${nb(depart)} m par rapport au niveau de la mer. Il ${hausse ? 'monte' : 'descend'} de ${nb(c)} m. À quelle altitude se trouve-t-il alors ?`;
  } else {
    const personne = rngPick(rng, PRENOMS);
    prompt = `${personne.nom} a un solde de ${nb(depart)} € sur son compte. ${il(personne)} ${hausse ? 'dépose' : 'dépense'} ${nb(c)} €. Quel est son nouveau solde ?`;
  }
  const absolu = Math.abs(depart);
  return {
    instruction: INSTRUCTION,
    prompt,
    correct: avecUnite(resultat, unite),
    // L'autre sens, le signe oublié ou inversé, les valeurs absolues ajoutées ou retranchées.
    wrong: fauxAvecUnite(resultat, [depart - variation, -resultat, absolu + c, -(absolu + c), Math.abs(absolu - c), absolu - c, c - absolu], unite, { decimales: demi ? 1 : 0 }),
    explanation: `${hausse ? 'Une hausse s\'ajoute' : 'Une baisse se retranche'} : ${sommeAvecSigne(depart, variation)} = ${nb(resultat)}.`,
  };
});

// --- La proportionnalité ---------------------------------------------------------------------------------------

interface Marchandise {
  /** « 6 cahiers », « 6 kg de pommes » : la quantité, écrite pour ce nombre. */
  quantite: (n: number) => string;
  /** Les objets qu'on compte sont « identiques » : le prix de chacun est le même. */
  identiques?: boolean;
  /** Le prix d'une unité, en centimes : de ... à ..., par pas de cinq centimes. */
  centimes: [number, number];
}

const MARCHANDISES: Marchandise[] = [
  { quantite: (n) => `${n} cahiers`, identiques: true, centimes: [120, 480] },
  { quantite: (n) => `${n} stylos`, identiques: true, centimes: [80, 350] },
  { quantite: (n) => `${n} gommes`, identiques: true, centimes: [60, 200] },
  { quantite: (n) => `${n} pains au chocolat`, identiques: true, centimes: [90, 160] },
  { quantite: (n) => `${n} billets de cinéma`, identiques: true, centimes: [550, 900] },
  { quantite: (n) => `${n} kg de pommes`, centimes: [120, 480] },
  { quantite: (n) => `${n} kg de cerises`, centimes: [450, 950] },
  { quantite: (n) => `${n} L de lait`, centimes: [90, 170] },
  { quantite: (n) => `${n} m de tissu`, centimes: [350, 1250] },
  { quantite: (n) => `${n} m de ruban`, centimes: [60, 240] },
];

const prixUnitaire = (rng: Rng, { centimes: [min, max] }: Marchandise) => rngInt(rng, min / 5, max / 5) * 5;

const proportionnalitePrix = brique('proportionnalite-prix', 10, (rng) => {
  const marchandise = rngPick(rng, MARCHANDISES);
  const u = prixUnitaire(rng, marchandise);
  const n = rngInt(rng, 2, 12);
  const m = rng() < 0.4 ? n * rngInt(rng, 2, 4) : entierSauf(rng, 2, 25, [n]);
  const [total, reponse] = [n * u, m * u];
  return {
    instruction: INSTRUCTION,
    prompt: `${marchandise.quantite(n)}${marchandise.identiques ? ' identiques' : ''} coûtent ${euros(total)}. Combien coûtent ${marchandise.quantite(m)} ?`,
    correct: euros(reponse),
    // La différence des quantités ajoutée au prix, le prix multiplié par la quantité, le prix des seuls objets en plus, la règle à l'envers.
    wrong: fauxEuros(reponse, [total + (m - n) * 100, total * m, u * (m - n), Math.round((total * n) / m), reponse + 100, reponse - 100, u * (m + 1)]),
    explanation: `Pour un seul : ${nb(total / 100)} ÷ ${n} = ${nb(u / 100)}. Pour ${m} : ${m} × ${nb(u / 100)} = ${nb(reponse / 100)}.`,
  };
});

const coefficient = brique('coefficient', 10, (rng) => {
  const marchandise = rngPick(rng, MARCHANDISES);
  const u = prixUnitaire(rng, marchandise);
  const n = rngInt(rng, 2, 12);
  const total = n * u;
  const [valeurDuCoefficient, prix] = [u / 100, total / 100];
  return {
    instruction: INSTRUCTION,
    prompt: `${marchandise.quantite(n)}${marchandise.identiques ? ' identiques' : ''} coûtent ${euros(total)}. Le prix est proportionnel à la quantité. Quel est le coefficient de proportionnalité, c'est-à-dire le nombre par lequel on multiplie la quantité pour obtenir le prix ?`,
    correct: nb(valeurDuCoefficient),
    // Le prix lui-même, la somme ou le produit des deux nombres, le quotient à l'envers, un euro de trop ou de moins.
    wrong: fauxEcrits(valeurDuCoefficient, [prix, prix + n, prix - n, prix * n, n / prix, valeurDuCoefficient + 1, valeurDuCoefficient - 1], nb, { min: 0.01, decimales: 2 }),
    explanation: `${nb(prix)} ÷ ${n} = ${nb(valeurDuCoefficient)} : on multiplie la quantité par ${nb(valeurDuCoefficient)} pour avoir le prix.`,
  };
});

interface SituationDeTableau {
  lignes: [string, string];
  /** La question, pour la quantité `m`. */
  demande: (m: number) => string;
  /** La valeur de la seconde ligne pour une unité, en centièmes (un prix en centimes) ou en unités. */
  rapport: [number, number];
  /** Comment s'écrit la réponse. */
  unite: string;
  /** Les valeurs sont-elles des montants en centimes ? */
  monnaie?: boolean;
}

const SITUATIONS_DE_TABLEAU: SituationDeTableau[] = [
  { lignes: ['Masse (kg)', 'Prix (€)'], demande: (m) => `Quel est le prix de ${m} kg de pommes ?`, rapport: [120, 480], unite: '€', monnaie: true },
  { lignes: ['Masse (kg)', 'Prix (€)'], demande: (m) => `Quel est le prix de ${m} kg de cerises ?`, rapport: [450, 950], unite: '€', monnaie: true },
  { lignes: ['Volume (L)', 'Prix (€)'], demande: (m) => `Combien coûtent ${m} L de lait ?`, rapport: [90, 170], unite: '€', monnaie: true },
  { lignes: ['Longueur (m)', 'Prix (€)'], demande: (m) => `Combien coûtent ${m} m de tissu ?`, rapport: [350, 1250], unite: '€', monnaie: true },
  { lignes: ['Durée (h)', 'Distance (km)'], demande: (m) => `Un cycliste roule à vitesse constante. Quelle distance parcourt-il en ${m} h ?`, rapport: [12, 30], unite: 'km' },
  { lignes: ['Personnes', 'Farine (g)'], demande: (m) => `Pour ${m} personnes, quelle masse de farine faut-il ?`, rapport: [25, 90], unite: 'g' },
  { lignes: ['Gâteaux', 'Œufs'], demande: (m) => `Combien d'œufs faut-il pour ${m} gâteaux ?`, rapport: [2, 5], unite: 'œufs' },
  { lignes: ['Durée (min)', 'Eau (L)'], demande: (m) => `Un robinet coule à débit constant. Combien de litres a-t-il coulé en ${m} min ?`, rapport: [4, 15], unite: 'L' },
];

const tableauDeProportionnalite = brique('tableau-proportionnalite', 10, (rng) => {
  const situation = rngPick(rng, SITUATIONS_DE_TABLEAU);
  const [min, max] = situation.rapport;
  const u = situation.monnaie ? rngInt(rng, min / 5, max / 5) * 5 : rngInt(rng, min, max);
  const connues = rngShuffle(rng, [1, 2, 3, 4, 5, 6, 8, 10, 12]).slice(0, 3).sort((a, b) => a - b);
  const m = entierSauf(rng, 2, 30, connues);
  const pasDeLaQuantite = situation.monnaie ? 100 : 1;
  const ecrit = (valeur: number) => (situation.monnaie ? fixe(valeur / 100, 2) : nb(valeur));
  const figure = tableauDeValeurs(
    [
      [situation.lignes[0], [...connues, m].map(String)],
      [situation.lignes[1], [...connues.map((q) => ecrit(q * u)), null]],
    ],
    `Un tableau de proportionnalité de deux lignes et quatre colonnes : une valeur est remplacée par un point d'interrogation.`
  );
  const reponse = m * u;
  const [a, b, c] = connues;
  const ecrire = (valeur: number) => (situation.monnaie ? euros(Math.round(valeur)) : avecUnite(valeur, situation.unite));
  return {
    detail: `tableau-${situation.lignes.join('-')}-${connues.join('.')}-${m}-${u}`,
    instruction: INSTRUCTION_DONNEES,
    prompt: `Ce tableau est un tableau de proportionnalité. ${situation.demande(m)}`,
    figure,
    correct: ecrire(reponse),
    // La différence des quantités ajoutée à la dernière valeur, la dernière valeur multipliée par la quantité, la valeur de la première colonne.
    wrong: fauxEcrits(reponse, [c * u + (m - c) * pasDeLaQuantite, c * u * m, a * u + (m - a) * pasDeLaQuantite, b * u + (m - b) * pasDeLaQuantite, m * u + u, m * u - u, (m + 1) * u], ecrire, { min: 1 }),
    explanation: `Le coefficient de proportionnalité est ${ecrit(c * u)} ÷ ${c} = ${ecrit(u)}. Alors ${m} × ${ecrit(u)} = ${ecrit(reponse)}.`,
  };
});

// --- Utiliser une formule -----------------------------------------------------------------------------------------

const TARIFS = [
  { lieu: 'Un club de sport', par: 'mois', mot: 'de mois', fixe: [10, 30], unitaire: [6, 14] },
  { lieu: 'Un cinéma', par: 'séance', mot: 'de séances', fixe: [5, 15], unitaire: [3, 8] },
  { lieu: 'Un parc de loisirs', par: 'visite', mot: 'de visites', fixe: [8, 20], unitaire: [4, 9] },
  { lieu: 'Un atelier de poterie', par: 'séance', mot: 'de séances', fixe: [12, 30], unitaire: [7, 16] },
  { lieu: 'Un loueur de vélos', par: 'heure', mot: "d'heures", fixe: [4, 12], unitaire: [2, 6] },
];

const formuleContexte = brique('formule-contexte', 10, (rng) => {
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const [L, l] = [rngInt(rng, 5, 25), rngInt(rng, 2, 20)];
    const p = 2 * (L + l);
    return {
      instruction: INSTRUCTION,
      prompt: `La formule P = 2 × (L + l) donne le périmètre d'un rectangle de longueur L et de largeur l. Quel est P pour L = ${L} cm et l = ${l} cm ?`,
      correct: `${p} cm`,
      // La demi-somme sans le double, le double d'un seul côté, l'aire à la place du périmètre.
      wrong: fauxAvecUnite(p, [L + l, 2 * L + l, L * l, 2 * L * l, p + 2, p - 2, L + 2 * l], 'cm', { min: 1 }),
      explanation: `On calcule d'abord la parenthèse : ${L} + ${l} = ${L + l}, puis 2 × ${L + l} = ${p}.`,
    };
  }
  if (variante === 1) {
    const tarif = rngPick(rng, TARIFS);
    const [a, b] = [rngInt(rng, tarif.fixe[0], tarif.fixe[1]), rngInt(rng, tarif.unitaire[0], tarif.unitaire[1])];
    const n = rngInt(rng, 2, 12);
    const prix = a + b * n;
    return {
      instruction: INSTRUCTION,
      prompt: `${tarif.lieu} fait payer ${a} € de frais fixes, puis ${b} € par ${tarif.par}. Le prix P en euros vérifie P = ${a} + ${b} × n, où n est le nombre ${tarif.mot}. Quel est P pour n = ${n} ?`,
      correct: `${prix} €`,
      // L'addition faite avant la multiplication, tout additionné, l'inscription oubliée.
      wrong: fauxAvecUnite(prix, [(a + b) * n, a + b + n, b * n, a * n + b, a * b * n, prix + a, prix - b], '€', { min: 1 }),
      explanation: `La multiplication d'abord : ${b} × ${n} = ${b * n}, puis ${a} + ${b * n} = ${prix}.`,
    };
  }
  const [L, l, h] = [rngInt(rng, 3, 12), rngInt(rng, 2, 9), rngInt(rng, 2, 8)];
  const volume = L * l * h;
  return {
    instruction: INSTRUCTION,
    prompt: `La formule V = L × l × h donne le volume d'un pavé droit. Quel est V pour L = ${L} cm, l = ${l} cm et h = ${h} cm ?`,
    correct: `${volume} cm³`,
    // Les trois nombres additionnés, deux seulement multipliés, une aire.
    wrong: [`${L + l + h} cm³`, `${L * l} cm³`, `${volume} cm²`, `${2 * (L * l + L * h + l * h)} cm³`, `${volume + L} cm³`, `${L * l * h * 2} cm³`].filter((texte) => texte !== `${volume} cm³`),
    explanation: `${L} × ${l} = ${L * l}, puis ${L * l} × ${h} = ${volume}. Le volume s'exprime en cm³.`,
  };
});

// --- Un programme de calcul --------------------------------------------------------------------------------------

type GenreDEtape = 'multiplier' | 'ajouter' | 'soustraire' | 'carre';

interface Etape {
  genre: GenreDEtape;
  /** Le nombre de l'étape (rien pour le carré). */
  valeur: number;
}

const appliquer = ({ genre, valeur }: Etape, n: number): number =>
  genre === 'multiplier' ? n * valeur : genre === 'ajouter' ? n + valeur : genre === 'soustraire' ? n - valeur : n * n;

const dire = ({ genre, valeur }: Etape, premiere: boolean): string =>
  genre === 'multiplier'
    ? premiere ? `on le multiplie par ${valeur}` : `on multiplie le résultat par ${valeur}`
    : genre === 'ajouter'
      ? premiere ? `on lui ajoute ${valeur}` : `on ajoute ${valeur}`
      : genre === 'soustraire'
        ? `on soustrait ${valeur}`
        : 'on élève le résultat au carré';

/** Ce que fait une étape, écrit en calcul : « 5 × 4 = 20 », « 20 + 7 = 27 », « 3² = 9 ». */
const calculDeLEtape = ({ genre, valeur }: Etape, avant: number, apres: number): string =>
  genre === 'carre' ? `${entre(avant)}${sup(2)} = ${nb(apres)}` : `${nb(avant)} ${genre === 'multiplier' ? '×' : genre === 'ajouter' ? '+' : MOINS} ${valeur} = ${nb(apres)}`;

/** Les étapes d'un programme : « multiplier, ajouter, soustraire », jamais deux fois la même de suite. */
function etapesAuHasard(rng: Rng, nombre: number, avecCarre: boolean): Etape[] {
  const genres: GenreDEtape[] = [];
  while (genres.length < nombre) {
    const genre = rngPick<GenreDEtape>(rng, avecCarre && genres.length > 0 ? ['multiplier', 'ajouter', 'soustraire', 'carre'] : ['multiplier', 'ajouter', 'soustraire']);
    if (genres[genres.length - 1] !== genre) genres.push(genre);
  }
  return genres.map((genre) => ({ genre, valeur: genre === 'multiplier' ? rngInt(rng, 2, 9) : genre === 'carre' ? 0 : rngInt(rng, 2, 15) }));
}

const executer = (etapes: Etape[], depart: number): number => etapes.reduce((n, etape) => appliquer(etape, n), depart);

const programmeDeCalcul = brique('programme-de-calcul', 10, (rng, stage) => {
  const relatifs = stage >= 13;
  for (;;) {
    const etapes = etapesAuHasard(rng, rngInt(rng, 2, 3), stage >= 16);
    const depart = relatifs ? relatif(rng, 9) : rngInt(rng, 2, 12);
    const chemin = etapes.reduce<number[]>((valeurs, etape) => [...valeurs, appliquer(etape, valeurs[valeurs.length - 1])], [depart]);
    // Avant la 4e, tout reste positif : on ne multiplie pas de relatifs.
    if (!relatifs && chemin.some((valeur) => valeur < 0)) continue;
    if (Math.abs(chemin[chemin.length - 1]) > 999) continue;
    const resultat = chemin[chemin.length - 1];
    // Un résultat nul ne laisse presque aucune erreur plausible : on en cherche un autre.
    if (resultat === 0) continue;
    const phrases = etapes.map((etape, rang) => dire(etape, rang === 0));
    const enonce = phrases.length === 2 ? `${phrases[0]}, puis ${phrases[1]}` : `${phrases[0]}, ${phrases[1]}, puis ${phrases[2]}`;
    const echange = [etapes[1], etapes[0], ...etapes.slice(2)];
    const sansSigne = Math.abs(depart);
    return {
      instruction: INSTRUCTION,
      prompt: `Programme de calcul : on choisit un nombre, ${enonce}. Quel résultat obtient-on si on choisit ${nb(depart)} ?`,
      correct: nb(resultat),
      // Les deux premières étapes échangées, la dernière oubliée, la première oubliée, le signe du départ perdu.
      wrong: [
        executer(echange, depart),
        executer(etapes.slice(0, -1), depart),
        executer(etapes.slice(1), depart),
        executer(etapes, sansSigne),
        resultat + 1,
        resultat - 1,
        resultat + 2,
        resultat + 10,
        depart + resultat,
      ]
        // Avant la 4e, on ne multiplie pas de relatifs : aucune proposition négative.
        .filter((valeur) => valeur !== resultat && (relatifs || valeur >= 0))
        .map(nb),
      explanation: `${etapes.map((etape, rang) => calculDeLEtape(etape, chemin[rang], chemin[rang + 1])).join(', puis ')}.`,
    };
  }
});

// --- Les fréquences ---------------------------------------------------------------------------------------------------

interface SituationDeFrequence {
  /** La phrase qui donne le total `t` et l'effectif `c`. */
  enonce: (t: number, c: number) => string;
  /** Ce dont on veut la fréquence : « des élèves qui viennent à vélo ». */
  de: string;
}

const SITUATIONS_DE_FREQUENCE: SituationDeFrequence[] = [
  { enonce: (t, c) => `Dans une classe de ${t} élèves, ${c} viennent à vélo.`, de: 'des élèves qui viennent à vélo' },
  { enonce: (t, c) => `Une équipe a joué ${t} matchs et en a gagné ${c}.`, de: 'des matchs gagnés' },
  { enonce: (t, c) => `Sur ${t} élèves interrogés, ${c} préfèrent le chocolat.`, de: 'des élèves qui préfèrent le chocolat' },
  { enonce: (t, c) => `Une fleuriste vend ${t} fleurs, dont ${c} roses.`, de: 'des roses' },
  { enonce: (t, c) => `Dans un verger de ${t} arbres, ${c} sont des pommiers.`, de: 'des pommiers' },
  { enonce: (t, c) => `Lors d'un sondage auprès de ${t} personnes, ${c} se disent favorables à un nouveau parc.`, de: 'des personnes favorables' },
  { enonce: (t, c) => `Une boîte contient ${t} bonbons, dont ${c} à la fraise.`, de: 'des bonbons à la fraise' },
  { enonce: (t, c) => `Sur ${t} jours de classe, il a plu ${c} jours.`, de: 'des jours de pluie' },
];

const frequence = brique('frequence', 10, (rng) => {
  const situation = rngPick(rng, SITUATIONS_DE_FREQUENCE);
  const total = rngPick(rng, [20, 25, 40, 50, 100, 200]);
  const effectif = entierSauf(rng, Math.ceil(total / 20), Math.floor((total * 19) / 20), [total / 2]);
  const p = (100 * effectif) / total;
  const enFraction = rng() < 0.4;
  const debut = `${situation.enonce(total, effectif)} Quelle est la fréquence ${situation.de} ?`;
  if (enFraction) {
    const juste = rat(effectif, total);
    return {
      instruction: INSTRUCTION,
      prompt: `${debut} Écris-la sous la forme d'une fraction simplifiée.`,
      correct: texteRat(juste),
      // Le complémentaire, l'effectif rapporté à ce qui reste, la fraction à l'envers, un effectif de plus.
      wrong: fractionsAuChoix(juste, [[total - effectif, total], [effectif, total - effectif], [total, effectif], [effectif + 1, total], [effectif, total + effectif], [total - effectif, effectif]]),
      explanation: `La fréquence est l'effectif divisé par le total : ${effectif}/${total}${texteRat(juste) === `${effectif}/${total}` ? '' : ` = ${texteRat(juste)}`}.`,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `${debut} Écris-la en pourcentage.`,
    correct: pourcent(p),
    // L'effectif lui-même, le pourcentage complémentaire, un dixième de trop ou de moins.
    wrong: fauxPourcents(p, [effectif, 100 - p, (100 * effectif) / (total - effectif), total, p + 10, p - 10, p * 2], { decimales: 1, max: 1000 }),
    explanation: `${effectif}/${total} = ${nb(p / 100)}, donc ${nb(p)} %.`,
  };
});

// --- Lire un diagramme en barres -----------------------------------------------------------------------------------

const lectureDiagramme = brique('lecture-diagramme', 10, (rng) => {
  const theme = rngPick(rng, THEMES);
  const total = rngPick(rng, [20, 40, 50, 100, 200]);
  const pas = total / 10;
  // Dix parts réparties entre quatre ou cinq catégories, chacune au moins une : chaque barre tombe sur une graduation.
  const nombre = rngInt(rng, 4, 5);
  const parts = Array.from({ length: nombre }, () => 1);
  for (let reste = 10 - nombre; reste > 0; reste--) parts[rngInt(rng, 0, nombre - 1)] += 1;
  const items = rngShuffle(rng, theme.items).slice(0, nombre);
  const valeurs = parts.map((part) => part * pas);
  const maximum = (Math.max(...parts) + 1) * pas;
  const figure = diagrammeEnBarres(items.map((item, rang) => [item.nom, valeurs[rang]]), maximum, pas, 'Nombre');
  const rang = rngInt(rng, 0, nombre - 1);
  const [item, effectif] = [items[rang], valeurs[rang]];
  const detail = `barres-${theme.entete}-${items.map((entree, i) => `${entree.nom}${valeurs[i]}`).join('.')}-${rang}`;
  if (rng() < 0.4) {
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `Ce diagramme en barres donne les réponses des ${gens(theme.total)} interrogés. Combien ${theme.total} ont été interrogés en tout ?`,
      figure,
      correct: String(total),
      // Seules la plus grande barre ou la dernière lue, la somme des graduations, un écart d'une graduation.
      wrong: fauxEcrits(total, [Math.max(...valeurs), maximum, total + pas, total - pas, valeurs[0], total + 2 * pas, effectif], String, { min: 1 }),
      explanation: `On additionne toutes les barres : ${valeurs.join(' + ')} = ${total}.`,
    };
  }
  const p = (100 * effectif) / total;
  return {
    detail,
    instruction: INSTRUCTION_DONNEES,
    prompt: `Sur les ${total} ${gens(theme.total)} interrogés, quel pourcentage a choisi ${item.dit} ?`,
    figure,
    correct: pourcent(p),
    // L'effectif lu sans le diviser, le pourcentage complémentaire, la graduation à côté.
    wrong: fauxPourcents(p, [effectif, 100 - p, p + 10, p - 10, p * 2, (100 * effectif) / (total - effectif)], { decimales: 0, max: 1000 }),
    explanation: `On lit ${effectif} pour ${item.dit} : ${effectif}/${total} = ${nb(p / 100)}, donc ${nb(p)} %.`,
  };
});

// --- Les achats, avec des décimaux ------------------------------------------------------------------------------------

const ARTICLES = [
  { nom: 'cahiers', chacun: "l'un", centimes: [150, 450] },
  { nom: 'stylos', chacun: "l'un", centimes: [80, 300] },
  { nom: 'gommes', chacun: "l'une", centimes: [60, 200] },
  { nom: 'règles', chacun: "l'une", centimes: [100, 300] },
  { nom: 'carnets', chacun: "l'un", centimes: [120, 350] },
  { nom: 'pains au chocolat', chacun: "l'un", centimes: [90, 160] },
  { nom: 'jus de fruits', chacun: "l'un", centimes: [120, 260] },
  { nom: 'tickets de bus', chacun: "l'un", centimes: [140, 220] },
  { nom: 'sandwichs', chacun: "l'un", centimes: [250, 450] },
];

const achatsDecimaux = brique('achats-decimaux', 10, (rng) => {
  const personne = rngPick(rng, PRENOMS);
  const [premier, second] = rngShuffle(rng, ARTICLES).slice(0, 2);
  const [u1, u2] = [premier, second].map(({ centimes: [min, max] }) => rngInt(rng, min / 5, max / 5) * 5);
  const [n1, n2] = [rngInt(rng, 2, 5), rngInt(rng, 2, 5)];
  const depense = n1 * u1 + n2 * u2;
  const billet = rngPick(rng, [20, 50, 100].filter((valeur) => valeur * 100 > depense + 100));
  const rendu = billet * 100 - depense;
  return {
    instruction: INSTRUCTION,
    prompt: `${personne.nom} achète ${n1} ${premier.nom} à ${euros(u1)} ${premier.chacun} et ${n2} ${second.nom} à ${euros(u2)} ${second.chacun}. ${il(personne)} paie avec un billet de ${billet} €. Combien d'argent lui rend-on ?`,
    correct: euros(rendu),
    // La dépense à la place du rendu, un seul prix par article, un seul article, le billet et la dépense additionnés.
    wrong: fauxEuros(rendu, [depense, billet * 100 + depense, billet * 100 - u1 - u2, billet * 100 - n1 * u1, billet * 100 - n2 * u2, rendu + 100, rendu - 100]),
    explanation: `Dépense : ${n1} × ${nb(u1 / 100)} + ${n2} × ${nb(u2 / 100)} = ${nb(depense / 100)}. Rendu : ${billet} − ${nb(depense / 100)} = ${nb(rendu / 100)}.`,
  };
});

// --- Diviser par un décimal ----------------------------------------------------------------------------------------------

const DECOUPES: { enonce: (total: string, morceau: string) => string; question: string; unite: string }[] = [
  { enonce: (t, d) => `Un ruban de ${t} m est découpé en morceaux de ${d} m.`, question: 'Combien de morceaux obtient-on ?', unite: 'm' },
  { enonce: (t, d) => `Une planche de ${t} m est sciée en morceaux de ${d} m.`, question: 'Combien de morceaux obtient-on ?', unite: 'm' },
  { enonce: (t, d) => `Un fil de ${t} m est coupé en brins de ${d} m.`, question: 'Combien de brins obtient-on ?', unite: 'm' },
  { enonce: (t, d) => `On verse ${t} L de jus de fruits dans des verres de ${d} L.`, question: 'Combien de verres peut-on remplir ?', unite: 'L' },
  { enonce: (t, d) => `Un tuyau de ${t} m est découpé en tronçons de ${d} m.`, question: 'Combien de tronçons obtient-on ?', unite: 'm' },
  { enonce: (t, d) => `Une bouteille contient ${t} L d'eau. On remplit des gourdes de ${d} L.`, question: 'Combien de gourdes remplit-on ?', unite: 'L' },
];

const decoupeDecimale = brique('decoupe-decimale', 10, (rng) => {
  const decoupe = rngPick(rng, DECOUPES);
  // Le morceau en centièmes d'unité : 0,25 → 25.
  const morceau = rngPick(rng, [20, 25, 40, 50, 60, 75, 80, 120, 150, 250]);
  const k = rngInt(rng, 4, 40);
  const total = morceau * k;
  return {
    instruction: INSTRUCTION,
    prompt: `${decoupe.enonce(nb(total / 100), nb(morceau / 100))} ${decoupe.question}`,
    correct: String(k),
    // La multiplication à la place de la division, la virgule décalée d'un rang, la différence.
    wrong: fauxEcrits(k, [(total * morceau) / 10000, k * 10, k / 10, k * 100, Math.round(total / 100 - morceau / 100), k + 1, k - 1], nb, { min: 0.1, decimales: 1 }),
    explanation: `On cherche combien de fois ${nb(morceau / 100)} entre dans ${nb(total / 100)} : ${nb(total / 100)} ÷ ${nb(morceau / 100)} = ${k}.`,
  };
});

// --- Le carré et le cube dans une situation -------------------------------------------------------------------------------

const carreCubeContexte = brique('carre-cube-contexte', 10, (rng) => {
  const variante = rngInt(rng, 0, 3);
  if (variante === 0) {
    const c = rngInt(rng, 2, 12);
    const aire = c * c;
    return {
      instruction: INSTRUCTION,
      prompt: `Un terrain carré a un côté de ${c} m. Quelle est son aire ?`,
      correct: `${aire} m²`,
      // Le double du côté, le périmètre, la bonne valeur sans l'unité de surface.
      wrong: [`${2 * c} m²`, `${4 * c} m²`, `${aire} m`, `${aire + c} m²`, `${aire - c} m²`, `${c * 3} m²`].filter((texte) => texte !== `${aire} m²`),
      explanation: `L'aire d'un carré est son côté au carré : ${c}² = ${c} × ${c} = ${aire}, soit ${aire} m².`,
    };
  }
  if (variante === 1) {
    const c = rngPick(rng, [2, 3, 4, 5, 10]);
    const volume = c * c * c;
    return {
      instruction: INSTRUCTION,
      prompt: `Un cube a une arête de ${c} cm. Quel est son volume ?`,
      correct: `${volume} cm³`,
      // Le triple de l'arête, le carré, la bonne valeur dans une unité d'aire.
      wrong: [`${3 * c} cm³`, `${c * c} cm³`, `${volume} cm²`, `${6 * c * c} cm³`, `${volume + c} cm³`, `${2 * c * c} cm³`].filter((texte) => texte !== `${volume} cm³`),
      explanation: `Le volume d'un cube est son arête au cube : ${c}³ = ${c} × ${c} × ${c} = ${volume}, soit ${volume} cm³.`,
    };
  }
  if (variante === 2) {
    const c = rngInt(rng, 3, 12);
    const carreaux = c * c;
    return {
      instruction: INSTRUCTION,
      prompt: `On veut carreler une salle carrée de ${c} m de côté avec des carreaux d'un mètre carré chacun. Combien de carreaux faut-il ?`,
      correct: String(carreaux),
      // Le côté, le périmètre, le cube, une rangée de plus ou de moins.
      wrong: [2 * c, 4 * c, carreaux + c, carreaux - c, c * c * c, carreaux + 1, carreaux - 1].filter((valeur) => valeur !== carreaux && valeur > 0).map(String),
      explanation: `Il y a ${c} rangées de ${c} carreaux : ${c}² = ${carreaux}.`,
    };
  }
  const c = rngPick(rng, [2, 3, 4, 5]);
  const petits = c * c * c;
  return {
    instruction: INSTRUCTION,
    prompt: `Un cube de ${c} cm d'arête est entièrement rempli de petits cubes d'un centimètre d'arête. Combien y a-t-il de petits cubes ?`,
    correct: String(petits),
    wrong: [3 * c, c * c, 6 * c * c, petits + c, petits - c, 2 * petits].filter((valeur) => valeur !== petits).map(String),
    explanation: `Il y a ${c} couches de ${c} × ${c} cubes : ${c}³ = ${petits}.`,
  };
});


export const BRIQUES_CINQUIEME_T1: Brique[] = [
  evolutionRelatifs,
  proportionnalitePrix,
  coefficient,
  tableauDeProportionnalite,
  formuleContexte,
  programmeDeCalcul,
  frequence,
  lectureDiagramme,
  achatsDecimaux,
  decoupeDecimale,
  carreCubeContexte,
];

// === 2e trimestre (étape 11) ======================================================================================

/** Deux relatifs, le plus petit d'abord : de signes contraires le plus souvent, là où l'on se trompe. */
function deuxRelatifs(rng: Rng, max: number): [number, number] {
  const unPositifUnNegatif = rng() < 0.7;
  if (unPositifUnNegatif) return [-rngInt(rng, 1, Math.max(2, Math.round(max / 2))), rngInt(rng, 1, max)];
  if (rng() < 0.5) {
    const haut = -rngInt(rng, 1, Math.round(max / 3));
    return [haut - rngInt(rng, 2, Math.round(max / 2)), haut];
  }
  const bas = rngInt(rng, 1, Math.round(max / 3));
  return [bas, bas + rngInt(rng, 2, Math.round(max / 2))];
}

const relatifsEcart = brique('relatifs-ecart', 11, (rng) => {
  const contexte = rngInt(rng, 0, 2);
  const [bas, haut] = deuxRelatifs(rng, contexte === 0 ? 30 : contexte === 1 ? 900 : 120);
  const ecart = haut - bas;
  const unite = contexte === 0 ? '°C' : contexte === 1 ? 'm' : '€';
  let prompt: string;
  if (contexte === 0) {
    prompt = `Un jour d'hiver, la température minimale est de ${nb(bas)} °C et la température maximale de ${nb(haut)} °C. Quel est l'écart entre ces deux températures ?`;
  } else if (contexte === 1) {
    prompt = `Dans une région, le point le plus haut est à ${nb(haut)} m d'altitude et le point le plus bas à ${nb(bas)} m. Quelle est la différence d'altitude entre ces deux points ?`;
  } else {
    const [premier, second] = deuxPrenoms(rng);
    prompt = `${premier.nom} a un solde de ${nb(bas)} € et ${second.nom} un solde de ${nb(haut)} €. Quelle est la différence entre ces deux soldes ?`;
  }
  return {
    instruction: INSTRUCTION,
    prompt,
    correct: avecUnite(ecart, unite),
    // Les deux nombres additionnés avec leurs signes, les valeurs absolues soustraites, le signe moins gardé.
    wrong: fauxAvecUnite(ecart, [haut + bas, Math.abs(haut + bas), Math.abs(Math.abs(haut) - Math.abs(bas)), -ecart, Math.abs(haut) + Math.abs(bas), ecart + 10, ecart - 10], unite, { min: 0 }),
    explanation: `L'écart est le plus grand moins le plus petit : ${nb(haut)} − ${entre(bas)} = ${nb(ecart)}.`,
  };
});

/** Un événement de plus ou de moins : « reçoit 40 € » (positif), « paie 35 € » (négatif). */
interface Evenement {
  valeur: number;
  texte: string;
}

const relatifsBilan = brique('relatifs-bilan', 11, (rng) => {
  const contexte = rngInt(rng, 0, 3);
  const depart = relatif(rng, contexte === 1 ? 15 : 40);
  const [e1, e2] = [relatif(rng, contexte === 1 ? 15 : 60, contexte === 1 ? 2 : 5), relatif(rng, contexte === 1 ? 15 : 60, contexte === 1 ? 2 : 5)];
  const resultat = depart + e1 + e2;
  const personne = rngPick(rng, PRENOMS);
  const [pronomMajuscule, pronomMinuscule] = [il(personne), il(personne).toLowerCase()];
  const decrit = (valeur: number, positif: string, negatif: string, unite: string): Evenement => ({ valeur, texte: `${valeur > 0 ? positif : negatif} ${nb(Math.abs(valeur))} ${unite}` });
  let prompt: string;
  let ecrire: (valeur: number) => string = (valeur) => `${nb(valeur)}`;
  if (contexte === 0) {
    const [a, b] = [e1, e2].map((valeur) => decrit(valeur, 'reçoit', 'paie', '€'));
    prompt = `${personne.nom} a un solde de ${nb(depart)} €. ${pronomMajuscule} ${a.texte}, puis ${pronomMinuscule} ${b.texte}. Quel est son solde final ?`;
    ecrire = (valeur) => `${nb(valeur)} €`;
  } else if (contexte === 1) {
    const [a, b] = [e1, e2].map((valeur) => decrit(valeur, 'monte de', 'descend de', 'm'));
    prompt = `Un plongeur est à ${nb(depart)} m par rapport à la surface. Il ${a.texte}, puis il ${b.texte}. À quelle altitude est-il alors ?`;
    ecrire = (valeur) => `${nb(valeur)} m`;
  } else if (contexte === 2) {
    const [a, b] = [e1, e2].map((valeur) => decrit(valeur, 'gagne', 'perd', 'points'));
    prompt = `Au début d'une partie, ${personne.nom} a ${nb(depart)} points. ${pronomMajuscule} ${a.texte}, puis ${pronomMinuscule} ${b.texte}. Combien de points a-t-${pronomMinuscule} à la fin ?`;
    ecrire = (valeur) => `${nb(valeur)} ${Math.abs(valeur) >= 2 ? 'points' : 'point'}`;
  } else {
    const [a, b] = [e1, e2].map((valeur) => decrit(valeur, 'monte de', 'baisse de', '°C'));
    prompt = `À minuit, il fait ${nb(depart)} °C. Pendant la nuit, la température ${a.texte}, puis elle ${b.texte}. Quelle est la température au petit matin ?`;
    ecrire = (valeur) => `${nb(valeur)} °C`;
  }
  return {
    instruction: INSTRUCTION,
    prompt,
    correct: ecrire(resultat),
    // Tout additionné ou tout retranché, un seul des deux événements pris dans le mauvais sens, les signes oubliés.
    wrong: fauxEcrits(resultat, [depart - e1 - e2, depart + Math.abs(e1) + Math.abs(e2), depart + e1 - e2, depart - e1 + e2, Math.abs(depart) + e1 + e2, -resultat, depart - Math.abs(e1) - Math.abs(e2)], ecrire, {}),
    explanation: `${nb(depart)} ${e1 < 0 ? MOINS : '+'} ${nb(Math.abs(e1))} ${e2 < 0 ? MOINS : '+'} ${nb(Math.abs(e2))} = ${nb(resultat)}.`,
  };
});

// --- Fractions ---------------------------------------------------------------------------------------------------------------

const CONTEXTES_DE_FRACTION: { enonce: (t: number, n: number, d: number) => string; part: string; reste: string }[] = [
  { enonce: (t, n, d) => `Un roman compte ${t} pages. Léa en a lu ${n}/${d}.`, part: 'Combien de pages cela représente-t-il ?', reste: 'Combien de pages reste-t-il à lire ?' },
  { enonce: (t, n, d) => `Un randonneur doit parcourir ${t} km. Il en a déjà fait ${n}/${d}.`, part: 'Combien de kilomètres a-t-il déjà faits ?', reste: 'Combien de kilomètres lui reste-t-il à faire ?' },
  { enonce: (t, n, d) => `Dans un collège de ${t} élèves, ${n}/${d} des élèves sont demi-pensionnaires.`, part: "Combien d'élèves sont demi-pensionnaires ?", reste: "Combien d'élèves ne sont pas demi-pensionnaires ?" },
  { enonce: (t, n, d) => `Un réservoir de ${t} L est rempli à ${n}/${d}.`, part: 'Combien de litres contient-il ?', reste: 'Combien de litres manque-t-il pour le remplir ?' },
  { enonce: (t, n, d) => `Tom a ${t} € dans sa tirelire. Il en dépense ${n}/${d}.`, part: "Combien d'euros dépense-t-il ?", reste: "Combien d'euros lui reste-t-il ?" },
  { enonce: (t, n, d) => `Une bibliothèque possède ${t} livres. ${n}/${d} des livres sont des bandes dessinées.`, part: 'Combien y a-t-il de bandes dessinées ?', reste: 'Combien de livres ne sont pas des bandes dessinées ?' },
];

const fractionQuantite = brique('fraction-quantite', 11, (rng) => {
  const contexte = rngPick(rng, CONTEXTES_DE_FRACTION);
  const d = rngInt(rng, 3, 12);
  const n = rngPick(rng, Array.from({ length: d - 1 }, (_, rang) => rang + 1).filter((candidat) => pgcd(candidat, d) === 1));
  const k = rngInt(rng, 2, 15);
  const total = d * k;
  const part = n * k;
  const reste = total - part;
  const demandeLeReste = rng() < 0.4;
  const reponse = demandeLeReste ? reste : part;
  return {
    instruction: INSTRUCTION,
    prompt: `${contexte.enonce(total, n, d)} ${demandeLeReste ? contexte.reste : contexte.part}`,
    correct: String(reponse),
    // Le numérateur multiplié par le total, une seule part, le complémentaire, la réponse de l'autre question.
    wrong: fauxEcrits(reponse, [n * total, k, demandeLeReste ? part : reste, reponse + k, reponse - k, total - k, Math.round(total / n)], String, { min: 1 }),
    explanation: `Pour 1/${d} de ${total} : ${total} ÷ ${d} = ${k}.${n > 1 ? ` Pour ${n}/${d} : ${n} × ${k} = ${part}.` : ''}${demandeLeReste ? ` Il reste ${total} − ${part} = ${reste}.` : ''}`,
  };
});

const OBJETS_A_PARTAGER = [
  { nom: 'tarte', feminin: true },
  { nom: 'pizza', feminin: true },
  { nom: 'tablette de chocolat', feminin: true },
  { nom: 'pastèque', feminin: true },
  { nom: 'brioche', feminin: true },
  { nom: 'gâteau', feminin: false },
  { nom: 'melon', feminin: false },
  { nom: 'quatre-quarts', feminin: false },
];

/** « 9/12 = 3/4 » : la fraction telle qu'elle vient, puis simplifiée si elle ne l'est pas. */
const ecritBrut = (n: number, d: number, simplifiee: Rat): string => (`${n}/${d}` === texteRat(simplifiee) ? texteRat(simplifiee) : `${n}/${d} = ${texteRat(simplifiee)}`);

const fractionsContexte = brique('fractions-contexte', 11, (rng) => {
  const objet = rngPick(rng, OBJETS_A_PARTAGER);
  const [premier, second] = deuxPrenoms(rng);
  let d1: number, d2: number, n1: number, n2: number;
  let somme: Rat;
  do {
    d1 = rngInt(rng, 2, 9);
    d2 = rngInt(rng, 2, 12);
    n1 = rngInt(rng, 1, d1 - 1);
    n2 = rngInt(rng, 1, d2 - 1);
    somme = rat(n1 * d2 + n2 * d1, d1 * d2);
  } while (d1 === d2 || pgcd(n1, d1) !== 1 || pgcd(n2, d2) !== 1 || somme.n >= somme.d || (d2 % d1 === 0 && rng() < 0.6));
  const ppcmDesDenominateurs = (d1 * d2) / pgcd(d1, d2);
  const [a, b] = [n1 * (ppcmDesDenominateurs / d1), n2 * (ppcmDesDenominateurs / d2)];
  const du = `${objet.feminin ? 'de la' : 'du'} ${objet.nom}`;
  const mange = objet.feminin ? 'mangée' : 'mangé';
  const demandeLeReste = rng() < 0.5;
  const debut = `${premier.nom} mange ${n1}/${d1} ${du}, puis ${second.nom} mange ${n2}/${d2} ${du}.`;
  const reponse = demandeLeReste ? rat(ppcmDesDenominateurs - a - b, ppcmDesDenominateurs) : somme;
  return {
    instruction: INSTRUCTION,
    prompt: demandeLeReste ? `${debut} Quelle fraction ${du} reste-t-il ?` : `${debut} Quelle fraction ${du} ont-ils ${mange} à eux deux ?`,
    correct: texteRat(reponse),
    // Numérateurs et dénominateurs additionnés chacun de leur côté, la somme sur le produit des dénominateurs, la réponse de l'autre question.
    wrong: fractionsAuChoix(reponse, [
      [n1 + n2, d1 + d2],
      [n1 + n2, d1 * d2],
      [n1 + n2, ppcmDesDenominateurs],
      demandeLeReste ? [somme.n, somme.d] : [somme.d - somme.n, somme.d],
      [n1 * n2, d1 * d2],
      [(demandeLeReste ? reponse.n : somme.n) + 1, reponse.d],
    ]),
    explanation: `Même dénominateur : ${n1}/${d1} = ${a}/${ppcmDesDenominateurs} et ${n2}/${d2} = ${b}/${ppcmDesDenominateurs}. ${
      demandeLeReste ? `Il reste (${ppcmDesDenominateurs} − ${a} − ${b})/${ppcmDesDenominateurs} = ${ecritBrut(ppcmDesDenominateurs - a - b, ppcmDesDenominateurs, reponse)}.` : `Ensemble : (${a} + ${b})/${ppcmDesDenominateurs} = ${ecritBrut(a + b, ppcmDesDenominateurs, reponse)}.`
    }`,
  };
});

// --- Les pourcentages ------------------------------------------------------------------------------------------------------------

const ARTICLES_SOLDES = [
  { nom: 'jeu vidéo', feminin: false },
  { nom: 'blouson', feminin: false },
  { nom: 'sac à dos', feminin: false },
  { nom: 'casque audio', feminin: false },
  { nom: 'paire de baskets', feminin: true },
  { nom: 'trottinette', feminin: true },
  { nom: 'montre', feminin: true },
  { nom: 'veste', feminin: true },
];

const pourcentageRemise = brique('pourcentage-remise', 11, (rng) => {
  const article = rngPick(rng, ARTICLES_SOLDES);
  const prix = rngInt(rng, 2, 20) * 10;
  const p = rngPick(rng, [10, 20, 25, 30, 40, 50]);
  const remise = (prix * p) / 100;
  const final = prix - remise;
  const demandeLaRemise = rng() < 0.5;
  const [Il, soldes] = article.feminin ? ['Elle', 'soldée'] : ['Il', 'soldé'];
  const debut = `${article.feminin ? 'Une' : 'Un'} ${article.nom} coûte ${nb(prix)} €. ${Il} est ${soldes} avec ${p} % de réduction.`;
  if (demandeLaRemise) {
    return {
      instruction: INSTRUCTION,
      prompt: `${debut} Quel est le montant de la réduction ?`,
      correct: `${nb(remise)} €`,
      // Le prix soldé, le pourcentage pris pour des euros, le prix de départ divisé par le pourcentage.
      wrong: fauxAvecUnite(remise, [final, p, prix / p, prix + remise, remise * 2, remise + 5, remise - 5], '€', { min: 0.1, decimales: 2 }),
      explanation: `${p} % de ${nb(prix)} : ${nb(prix)} × ${p} ÷ 100 = ${nb(remise)}.`,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `${debut} Quel est son nouveau prix ?`,
    correct: `${nb(final)} €`,
    // Le pourcentage retranché comme des euros, la réduction elle-même, la réduction ajoutée.
    wrong: fauxAvecUnite(final, [prix - p, remise, prix + remise, prix * (1 - p / 100) + 10, final + 5, final - 5, prix - 2 * remise], '€', { min: 0.1, decimales: 2 }),
    explanation: `Réduction : ${nb(prix)} × ${p} ÷ 100 = ${nb(remise)}. Nouveau prix : ${nb(prix)} − ${nb(remise)} = ${nb(final)}.`,
  };
});

// --- Le graphique d'une situation proportionnelle ----------------------------------------------------------------------

interface SituationDeGraphique {
  x: string;
  y: string;
  /** Le coefficient : ce que vaut y pour x = 1. */
  coefficients: number[];
  direct: (x: number) => string;
  inverse: (y: number) => string;
  uniteDeY: string;
  uniteDeX: string;
}

const SITUATIONS_DE_GRAPHIQUE: SituationDeGraphique[] = [
  { x: 'Masse (kg)', y: 'Prix (€)', coefficients: [1.5, 2, 2.5, 3, 4, 5], direct: (x) => `Combien coûtent ${x} kg de pommes ?`, inverse: (y) => `Avec ${nb(y)} €, combien de kilogrammes de pommes peut-on acheter ?`, uniteDeY: '€', uniteDeX: 'kg' },
  { x: 'Durée (h)', y: 'Distance (km)', coefficients: [10, 12, 15, 20, 25], direct: (x) => `Un cycliste roule à vitesse constante. Quelle distance parcourt-il en ${x} h ?`, inverse: (y) => `Un cycliste roule à vitesse constante. En combien d'heures parcourt-il ${nb(y)} km ?`, uniteDeY: 'km', uniteDeX: 'h' },
  { x: 'Durée (min)', y: 'Eau (L)', coefficients: [2, 3, 4, 5, 6], direct: (x) => `Un robinet coule à débit constant. Combien de litres coulent en ${x} min ?`, inverse: (y) => `Un robinet coule à débit constant. En combien de minutes coulent ${nb(y)} L ?`, uniteDeY: 'L', uniteDeX: 'min' },
  { x: 'Longueur (m)', y: 'Prix (€)', coefficients: [3, 4, 5, 6, 8], direct: (x) => `Combien coûtent ${x} m de tissu ?`, inverse: (y) => `Avec ${nb(y)} €, combien de mètres de tissu peut-on acheter ?`, uniteDeY: '€', uniteDeX: 'm' },
  { x: 'Personnes', y: 'Farine (g)', coefficients: [40, 50, 60, 75, 80], direct: (x) => `Pour ${x} personnes, quelle masse de farine faut-il ?`, inverse: (y) => `Avec ${nb(y)} g de farine, pour combien de personnes peut-on cuisiner ?`, uniteDeY: 'g', uniteDeX: 'personnes' },
];

const X_MAX_DU_GRAPHIQUE = 8;

const graphiqueProportionnel = brique('graphique-proportionnel', 11, (rng) => {
  const situation = rngPick(rng, SITUATIONS_DE_GRAPHIQUE);
  const k = rngPick(rng, situation.coefficients);
  const x0 = rngInt(rng, 2, X_MAX_DU_GRAPHIQUE);
  const y0 = k * x0;
  const figure = repere(
    { min: 0, max: X_MAX_DU_GRAPHIQUE, pas: 1, nom: situation.x },
    { min: 0, max: X_MAX_DU_GRAPHIQUE * k, pas: k, nom: situation.y },
    (px, py) => [droiteDuRepere(px, py, k, 0, 0, X_MAX_DU_GRAPHIQUE)],
    `Un graphique : une droite qui part de l'origine du repère, entre ${situation.x} et ${situation.y}.`
  );
  const detail = `graphique-${situation.x}-${situation.y}-${k}-${x0}`;
  if (rng() < 0.5) {
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `Ce graphique représente une situation de proportionnalité. ${situation.direct(x0)}`,
      figure,
      correct: avecUnite(y0, situation.uniteDeY),
      // La valeur de départ lue sur le mauvais axe, une graduation de trop ou de moins, l'addition à la place du coefficient.
      wrong: fauxAvecUnite(y0, [x0, y0 + k, y0 - k, x0 + k, x0 * (k + 1), y0 / 2, k], situation.uniteDeY, { min: 0.5, decimales: 2 }),
      explanation: `On lit le point de la droite d'abscisse ${x0} : son ordonnée est ${nb(y0)}.`,
    };
  }
  return {
    detail,
    instruction: INSTRUCTION_DONNEES,
    prompt: `Ce graphique représente une situation de proportionnalité. ${situation.inverse(y0)}`,
    figure,
    correct: avecUnite(x0, situation.uniteDeX),
    // La valeur donnée à la place de celle qu'on cherche, la division par le coefficient mal faite, une graduation de trop ou de moins.
    wrong: fauxAvecUnite(x0, [y0, x0 + 1, x0 - 1, y0 - k, y0 / 2, x0 + 2, k], situation.uniteDeX, { min: 1, decimales: 2 }),
    explanation: `On cherche l'abscisse du point de la droite dont l'ordonnée est ${nb(y0)} : c'est ${x0}.`,
  };
});

// --- Les équations simples --------------------------------------------------------------------------------------------------

const equationSimple = brique('equation-simple', 11, (rng) => {
  const personne = rngPick(rng, PRENOMS);
  const variante = rngInt(rng, 0, 3);
  const x = rngInt(rng, 3, 40);
  if (variante === 0) {
    const a = rngInt(rng, 3, 40);
    return {
      instruction: INSTRUCTION,
      prompt: `${personne.nom} pense à un nombre. ${il(personne)} lui ajoute ${a} et obtient ${x + a}. Quel est ce nombre ?`,
      correct: String(x),
      // L'opération faite dans le mauvais sens, un nombre de trop ou de moins.
      wrong: fauxEcrits(x, [x + 2 * a, x + a + a, a * (x + a), x + 1, x - 1, a, x + a], String, { min: 1 }),
      explanation: `On résout x + ${a} = ${x + a} : x = ${x + a} − ${a} = ${x}.`,
    };
  }
  if (variante === 1) {
    const a = rngInt(rng, 2, 9);
    return {
      instruction: INSTRUCTION,
      prompt: `${personne.nom} pense à un nombre. ${il(personne)} le multiplie par ${a} et obtient ${a * x}. Quel est ce nombre ?`,
      correct: String(x),
      wrong: fauxEcrits(x, [a * a * x, a * x - a, a * x + a, x + 1, x - 1, a * x - x, x + a], String, { min: 1 }),
      explanation: `On résout ${a} × x = ${a * x} : x = ${a * x} ÷ ${a} = ${x}.`,
    };
  }
  if (variante === 2) {
    const [a, c] = [rngInt(rng, 2, 30), rngInt(rng, 2, 30)];
    const inconnu = a + c;
    return {
      instruction: INSTRUCTION,
      prompt: `${personne.nom} pense à un nombre. ${il(personne)} lui soustrait ${a} et obtient ${c}. Quel est ce nombre ?`,
      correct: String(inconnu),
      // L'opération faite dans le mauvais sens, le résultat lu comme la réponse.
      wrong: fauxEcrits(inconnu, [Math.abs(c - a), a * c, c, inconnu + 1, inconnu - 1, inconnu + a, 2 * c + a], String, { min: 1 }),
      explanation: `On résout x − ${a} = ${c} : x = ${c} + ${a} = ${inconnu}.`,
    };
  }
  const fois = rngPick(rng, [2, 3, 4, 5]);
  const [premier, second] = deuxPrenoms(rng);
  return {
    instruction: INSTRUCTION,
    prompt: `${premier.nom} a ${fois} fois plus de billes ${queNom(second.nom)}. ${premier.nom} a ${fois * x} billes. Combien de billes ${second.nom} a-t-${pronom(second)} ?`,
    correct: String(x),
    wrong: fauxEcrits(x, [fois * x - fois, fois * x + fois, fois * fois * x, x + 1, x - 1, fois * x - x, x * (fois - 1)], String, { min: 1 }),
    explanation: `Si x est le nombre de billes ${deNom(second.nom)}, ${fois} × x = ${fois * x}, donc x = ${fois * x} ÷ ${fois} = ${x}.`,
  };
});

export const BRIQUES_CINQUIEME_T2: Brique[] = [relatifsEcart, relatifsBilan, fractionQuantite, fractionsContexte, pourcentageRemise, graphiqueProportionnel, equationSimple];

// === 3e trimestre (étape 12) ======================================================================================

/** « 12, 15, 9 et 14 » : une liste de nombres écrite en français. */
export const liste = (valeurs: number[]): string =>
  valeurs.length === 1 ? nb(valeurs[0]) : `${valeurs.slice(0, -1).map(nb).join(', ')} et ${nb(valeurs[valeurs.length - 1])}`;

/** Des valeurs entières dont la moyenne est exacte avec deux décimales au plus. */
function valeursDeMoyenneExacte(rng: Rng, n: number, min: number, max: number): number[] {
  for (;;) {
    const valeurs = Array.from({ length: n }, () => rngInt(rng, min, max));
    const { d } = rat(
      valeurs.reduce((total, valeur) => total + valeur, 0),
      n
    );
    if ([1, 2, 4, 5, 10, 20, 25].includes(d) && new Set(valeurs).size >= Math.min(3, n)) return valeurs;
  }
}

const CONTEXTES_DE_MOYENNE: { enonce: (valeurs: number[], prenom: string) => string; min: number; max: number; unite: string }[] = [
  { enonce: (v, p) => `Voici les notes de ${p} en mathématiques : ${liste(v)}. Quelle est la moyenne de ces notes ?`, min: 4, max: 19, unite: '' },
  { enonce: (v) => `Une équipe de handball a marqué ${liste(v)} buts lors de ses ${v.length} derniers matchs. Quel est le nombre moyen de buts par match ?`, min: 18, max: 34, unite: 'buts' },
  { enonce: (v, p) => `Cette semaine, le temps de trajet de ${p} pour aller au collège a été de ${liste(v)} minutes. Quel est le temps moyen de trajet ?`, min: 8, max: 35, unite: 'min' },
  { enonce: (v) => `Une boulangerie a vendu ${liste(v)} baguettes pendant ${v.length} jours. Quel est le nombre moyen de baguettes vendues par jour ?`, min: 120, max: 260, unite: 'baguettes' },
  { enonce: (v) => `Pendant ${v.length} jours d'été, la température maximale a été de ${liste(v)} °C. Quelle est la température maximale moyenne ?`, min: 18, max: 36, unite: '°C' },
];

const moyenne = brique('moyenne', 12, (rng) => {
  const contexte = rngPick(rng, CONTEXTES_DE_MOYENNE);
  const n = rngInt(rng, 3, 6);
  const valeurs = valeursDeMoyenneExacte(rng, n, contexte.min, contexte.max);
  const prenom = rngPick(rng, PRENOMS).nom;
  const somme = valeurs.reduce((total, valeur) => total + valeur, 0);
  const resultat = somme / n;
  const tries = [...valeurs].sort((a, b) => a - b);
  const ecrire = (valeur: number) => (contexte.unite ? `${nb(valeur)} ${contexte.unite}` : nb(valeur));
  return {
    instruction: INSTRUCTION,
    prompt: contexte.enonce(valeurs, prenom).replace(`de ${prenom}`, deNom(prenom)),
    correct: ecrire(resultat),
    // La somme sans la division, une division par un nombre de trop ou de moins, la moitié de la plus petite et de la plus grande valeur, la valeur du milieu.
    wrong: fauxEcrits(resultat, [somme, somme / (n + 1), somme / (n - 1), (tries[0] + tries[n - 1]) / 2, tries[Math.floor(n / 2)], resultat + 1, resultat - 1, resultat + 0.5], ecrire, { min: 0, decimales: 2 }),
    explanation: `La somme est ${valeurs.join(' + ')} = ${somme}. On la divise par ${n} : ${somme} ÷ ${n} = ${nb(resultat)}.`,
  };
});

// --- Le diagramme circulaire -------------------------------------------------------------------------------------------------

const diagrammeCirculaireBrique = brique('diagramme-circulaire', 12, (rng) => {
  const theme = rngPick(rng, THEMES);
  const nombre = rngInt(rng, 4, 5);
  // Des parts de 5 % : chacune au moins 10 %, le total 100 %.
  const unites = Array.from({ length: nombre }, () => 2);
  for (let reste = 20 - 2 * nombre; reste > 0; reste--) unites[rngInt(rng, 0, nombre - 1)] += 1;
  const pourcentages = unites.map((unite) => unite * 5);
  const items = rngShuffle(rng, theme.items).slice(0, nombre);
  const total = rngPick(rng, [40, 60, 80, 120, 160, 200, 240, 300, 400, 500]);
  const figure = diagrammeCirculaire(
    items.map((item, rang) => [item.nom, pourcentages[rang]]),
    `Un diagramme circulaire partagé en ${nombre} parts, chacune étiquetée par un nom et un pourcentage.`
  );
  const personnes = gens(theme.total);
  const [i, j] = rngShuffle(rng, items.map((_, rang) => rang)).slice(0, 2);
  const effectif = (rang: number) => (pourcentages[rang] * total) / 100;
  const detail = `circulaire-${theme.entete}-${items.map((item, rang) => `${item.nom}${pourcentages[rang]}`).join('.')}-${total}-${i}-${j}`;
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const reponse = effectif(i);
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `Sur ${total} ${personnes} interrogés, combien ont choisi ${items[i].dit} ?`,
      figure,
      correct: String(reponse),
      // Le pourcentage lu comme un nombre d'élèves, le reste, un cinquième de trop.
      wrong: fauxEcrits(reponse, [pourcentages[i], total - reponse, reponse + total / 20, reponse - total / 20, total / pourcentages[i], reponse * 2, (reponse * 100) / total], String, { min: 1 }),
      explanation: `${pourcentages[i]} % de ${total} : ${total} × ${pourcentages[i]} ÷ 100 = ${reponse}.`,
    };
  }
  if (variante === 1) {
    const reponse = pourcentages[i] + pourcentages[j];
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `Quel pourcentage des ${personnes} interrogés a choisi ${items[i].dit} ou ${items[j].dit} ?`,
      figure,
      correct: pourcent(reponse),
      // Une seule des deux parts, l'écart des parts, le reste du disque.
      wrong: fauxPourcents(reponse, [pourcentages[i], pourcentages[j], Math.abs(pourcentages[i] - pourcentages[j]), 100 - reponse, reponse + 5, reponse - 5, reponse * 2], { max: 100, decimales: 0 }),
      explanation: `On additionne les deux parts : ${pourcentages[i]} % + ${pourcentages[j]} % = ${reponse} %.`,
    };
  }
  const [grand, petit] = pourcentages[i] > pourcentages[j] ? [i, j] : pourcentages[j] > pourcentages[i] ? [j, i] : [i, j];
  const ecart = effectif(grand) - effectif(petit);
  return {
    detail: `${detail}-${grand}-${petit}`,
    instruction: INSTRUCTION_DONNEES,
    prompt: `Sur ${total} ${personnes} interrogés, combien de plus ont choisi ${items[grand].dit} que ${items[petit].dit} ?`,
    figure,
    correct: String(ecart),
    // L'écart des pourcentages lu comme un nombre, l'effectif d'une seule des deux parts, leur somme.
    wrong: fauxEcrits(ecart, [pourcentages[grand] - pourcentages[petit], effectif(grand), effectif(petit), effectif(grand) + effectif(petit), ecart + total / 20, ecart - total / 20], String, { min: 1 }),
    explanation: `${nb(effectif(grand))} − ${nb(effectif(petit))} = ${nb(ecart)}, car ${pourcentages[grand]} % de ${total} est ${nb(effectif(grand))} et ${pourcentages[petit]} % de ${total} est ${nb(effectif(petit))}.`,
  };
});

// --- Les probabilités : l'équiprobabilité -------------------------------------------------------------------------------

interface EvenementNumerote {
  phrase: string;
  /** Combien des nombres de 1 à n réalisent l'événement. */
  compte: (n: number) => number;
}

const evenementsNumerotes = (rng: Rng, n: number): EvenementNumerote[] => {
  const seuil = rngInt(rng, 2, n - 2);
  const tous: EvenementNumerote[] = [
    { phrase: 'un nombre pair', compte: (m) => Math.floor(m / 2) },
    { phrase: 'un nombre impair', compte: (m) => Math.ceil(m / 2) },
    { phrase: 'un multiple de 3', compte: (m) => Math.floor(m / 3) },
    { phrase: 'un multiple de 4', compte: (m) => Math.floor(m / 4) },
    { phrase: `un nombre supérieur ou égal à ${seuil}`, compte: (m) => m - seuil + 1 },
    { phrase: `un nombre strictement inférieur à ${seuil}`, compte: () => seuil - 1 },
  ];
  return tous.filter(({ compte }) => compte(n) > 0 && compte(n) < n);
};

/** Une probabilité : la fraction de cas favorables, simplifiée. */
const probabiliteEcrite = (favorables: number, possibles: number): string => ecritFraction(favorables, possibles);

const COULEURS = [
  ['rouge', 'rouges'],
  ['verte', 'vertes'],
  ['bleue', 'bleues'],
  ['jaune', 'jaunes'],
];

const CARTES: { phrase: string; compte: number }[] = [
  { phrase: 'un roi', compte: 4 },
  { phrase: 'un as', compte: 4 },
  { phrase: 'un cœur', compte: 8 },
  { phrase: 'un trèfle', compte: 8 },
  { phrase: 'une figure (valet, dame ou roi)', compte: 12 },
  { phrase: 'une carte noire', compte: 16 },
  { phrase: 'un as rouge', compte: 2 },
  { phrase: 'un huit ou un neuf', compte: 8 },
];

const probabiliteEquiprobable = brique('probabilite-equiprobable', 12, (rng) => {
  const variante = rngInt(rng, 0, 3);
  let favorables: number;
  let possibles: number;
  let prompt: string;
  if (variante === 0 || variante === 1) {
    possibles = variante === 0 ? 6 : rngPick(rng, [8, 10, 12, 20]);
    const evenement = rngPick(rng, evenementsNumerotes(rng, possibles));
    favorables = evenement.compte(possibles);
    prompt =
      variante === 0
        ? `On lance un dé équilibré à 6 faces numérotées de 1 à 6. Quelle est la probabilité d'obtenir ${evenement.phrase} ?`
        : `Une roue de loterie est partagée en ${possibles} secteurs égaux, numérotés de 1 à ${possibles}. On la fait tourner. Quelle est la probabilité d'obtenir ${evenement.phrase} ?`;
  } else if (variante === 2) {
    const nombreDeCouleurs = rngInt(rng, 2, 3);
    const couleurs = rngShuffle(rng, COULEURS).slice(0, nombreDeCouleurs);
    const effectifs = couleurs.map(() => rngInt(rng, 1, 7));
    possibles = effectifs.reduce((total, e) => total + e, 0);
    const choisie = rngInt(rng, 0, nombreDeCouleurs - 1);
    favorables = effectifs[choisie];
    const accord = (e: number, [singulier, pluriel]: string[]) => `${e} ${e === 1 ? `boule ${singulier}` : `boules ${pluriel}`}`;
    const contenu = couleurs.map((couleur, rang) => accord(effectifs[rang], couleur));
    const enumeration = contenu.length === 2 ? `${contenu[0]} et ${contenu[1]}` : `${contenu[0]}, ${contenu[1]} et ${contenu[2]}`;
    prompt = `Un sac contient ${enumeration}. On tire une boule au hasard. Quelle est la probabilité d'obtenir une boule ${couleurs[choisie][0]} ?`;
  } else {
    const carte = rngPick(rng, CARTES);
    favorables = carte.compte;
    possibles = 32;
    prompt = `On tire une carte au hasard dans un jeu de 32 cartes. Quelle est la probabilité d'obtenir ${carte.phrase} ?`;
  }
  const juste = rat(favorables, possibles);
  return {
    instruction: INSTRUCTION,
    prompt,
    correct: probabiliteEcrite(favorables, possibles),
    // Les cas favorables rapportés aux cas défavorables, la probabilité du contraire, la fraction à l'envers, un cas favorable de plus.
    wrong: fractionsAuChoix(juste, [
      [favorables, possibles - favorables],
      [possibles - favorables, possibles],
      [possibles, favorables],
      [favorables + 1, possibles],
      [1, possibles],
      [favorables, possibles + favorables],
      [favorables - 1, possibles],
    ]),
    explanation: `${favorables} cas favorables sur ${possibles} cas possibles, tous aussi probables : ${favorables}/${possibles}${texteRat(juste) === `${favorables}/${possibles}` ? '' : ` = ${texteRat(juste)}`}.`,
  };
});

// --- Comparer deux séries ----------------------------------------------------------------------------------------------------------

const comparerDeuxSeries = brique('comparer-deux-series', 12, (rng) => {
  const [premier, second] = deuxPrenoms(rng);
  const [n1, n2] = [rngInt(rng, 3, 5), rngInt(rng, 3, 5)];
  let a: number[];
  let b: number[];
  let moyenneA: number;
  let moyenneB: number;
  do {
    a = valeursDeMoyenneExacte(rng, n1, 6, 18);
    b = valeursDeMoyenneExacte(rng, n2, 6, 18);
    moyenneA = a.reduce((total, v) => total + v, 0) / n1;
    moyenneB = b.reduce((total, v) => total + v, 0) / n2;
  } while (moyenneA === moyenneB);
  const gagnant = moyenneA > moyenneB ? premier : second;
  const perdant = gagnant === premier ? second : premier;
  const enonce = `Aux contrôles de mathématiques, ${premier.nom} a obtenu ${liste(a)} et ${second.nom} a obtenu ${liste(b)}.`;
  const explication = `Moyenne ${deNom(premier.nom)} : ${nb(moyenneA)}. Moyenne ${deNom(second.nom)} : ${nb(moyenneB)}.`;
  if (rng() < 0.5) {
    return {
      instruction: INSTRUCTION,
      prompt: `${enonce} Qui a la meilleure moyenne ?`,
      correct: gagnant.nom,
      // L'autre élève, l'égalité, l'impossibilité de conclure.
      wrong: [perdant.nom, 'Les deux ont la même moyenne', 'On ne peut pas le savoir'],
      explanation: explication,
    };
  }
  const ecart = Math.abs(moyenneA - moyenneB);
  return {
    instruction: INSTRUCTION,
    prompt: `${enonce} Quelle est la différence entre leurs deux moyennes ?`,
    correct: nb(ecart),
    // La différence des sommes, la somme des deux moyennes, la différence des nombres de notes, un demi-point de trop ou de moins.
    wrong: fauxEcrits(ecart, [Math.abs(a.reduce((t, v) => t + v, 0) - b.reduce((t, v) => t + v, 0)), moyenneA + moyenneB, Math.abs(n1 - n2), ecart + 0.5, ecart - 0.5, ecart + 1, Math.abs(Math.max(...a) - Math.max(...b))], nb, { min: 0.01, decimales: 2 }),
    explanation: `${explication} L'écart est ${nb(Math.max(moyenneA, moyenneB))} − ${nb(Math.min(moyenneA, moyenneB))} = ${nb(ecart)}.`,
  };
});

// --- Volumes et aires dans une situation ---------------------------------------------------------------------------------------

const volumeContenance = brique('volume-contenance', 12, (rng) => {
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const [a, b, c] = [rngPick(rng, [20, 30, 40, 50, 60, 80]), rngPick(rng, [20, 30, 40, 50, 60, 80]), rngPick(rng, [10, 20, 30, 40, 50])];
    const litres = (a * b * c) / 1000;
    const objet = rngPick(rng, ['Un aquarium', 'Un bac à eau', 'Un coffre', 'Une jardinière']);
    return {
      instruction: INSTRUCTION,
      prompt: `${objet} a la forme d'un pavé droit de ${a} cm de long, ${b} cm de large et ${c} cm de haut. Quelle est sa contenance en litres ?`,
      correct: `${nb(litres)} L`,
      // Les unités mal converties (un facteur 10, 100 ou 1 000), la somme des dimensions.
      wrong: fauxAvecUnite(litres, [litres * 10, litres / 10, litres * 1000, litres / 100, a + b + c, (a * b * c) / 100, litres * 100], 'L', { min: 0.01, decimales: 2 }),
      explanation: `${a} × ${b} × ${c} = ${nb(a * b * c)} cm³. Comme 1 L = 1 000 cm³ : ${nb(a * b * c)} ÷ 1 000 = ${nb(litres)} L.`,
    };
  }
  const contexte = rngPick(rng, [
    { objet: 'Un bassin a la forme d\'un prisme droit.', mot: 'Son volume' },
    { objet: 'Un réservoir est un cylindre.', mot: 'Son volume' },
    { objet: 'Un silo à grains est un prisme droit.', mot: 'Son volume' },
    { objet: 'Une citerne a la forme d\'un cylindre.', mot: 'Son volume' },
  ]);
  const aire = rngInt(rng, 3, 40);
  const hauteur = rngPick(rng, [1.5, 2, 2.5, 3, 4, 5]);
  const volume = aire * hauteur;
  if (variante === 1) {
    return {
      instruction: INSTRUCTION,
      prompt: `${contexte.objet} L'aire de sa base est de ${aire} m² et sa hauteur de ${nb(hauteur)} m. Quel est son volume ?`,
      correct: `${nb(volume)} m³`,
      // La somme des deux nombres, la moitié du produit, la mauvaise unité.
      wrong: [`${nb(aire + hauteur)} m³`, `${nb(volume / 2)} m³`, `${nb(volume)} m²`, `${nb(volume * 2)} m³`, `${nb(aire * 3)} m³`, `${nb(volume + hauteur)} m³`].filter((texte) => texte !== `${nb(volume)} m³`),
      explanation: `Volume = aire de la base × hauteur : ${aire} × ${nb(hauteur)} = ${nb(volume)}, soit ${nb(volume)} m³.`,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `${contexte.objet} L'aire de sa base est de ${aire} m² et sa hauteur de ${nb(hauteur)} m. Combien de litres peut-il contenir ? On rappelle que 1 m³ = 1 000 L.`,
    correct: `${nb(volume * 1000)} L`,
    wrong: [`${nb(volume)} L`, `${nb(volume * 100)} L`, `${nb(volume * 10)} L`, `${nb(volume / 1000)} L`, `${nb(volume * 10000)} L`].filter((texte) => texte !== `${nb(volume * 1000)} L`),
    explanation: `${aire} × ${nb(hauteur)} = ${nb(volume)} m³, puis ${nb(volume)} × 1 000 = ${nb(volume * 1000)} L.`,
  };
});

const aireContexte = brique('aire-contexte', 12, (rng) => {
  const variante = rngInt(rng, 0, 2);
  const base = rngInt(rng, 5, 30) * 2;
  const hauteur = rngInt(rng, 4, 25);
  if (variante === 0) {
    const aire = (base * hauteur) / 2;
    return {
      instruction: INSTRUCTION,
      prompt: `Un terrain a la forme d'un triangle de base ${base} m et de hauteur ${hauteur} m. Quelle est son aire ?`,
      correct: `${nb(aire)} m²`,
      // Le produit sans diviser par deux, la somme, le quart du produit, le périmètre approché.
      wrong: [`${base * hauteur} m²`, `${base + hauteur} m²`, `${nb((base * hauteur) / 4)} m²`, `${nb(aire)} m`, `${nb(aire + hauteur)} m²`, `${2 * (base + hauteur)} m²`].filter((texte) => texte !== `${nb(aire)} m²`),
      explanation: `Aire du triangle : base × hauteur ÷ 2 = ${base} × ${hauteur} ÷ 2 = ${nb(aire)} m².`,
    };
  }
  if (variante === 1) {
    const aire = base * hauteur;
    return {
      instruction: INSTRUCTION,
      prompt: `Un champ a la forme d'un parallélogramme de base ${base} m et de hauteur ${hauteur} m. Quelle est son aire ?`,
      correct: `${nb(aire)} m²`,
      // La moitié du produit, la somme, le périmètre, la mauvaise unité.
      wrong: [`${nb(aire / 2)} m²`, `${base + hauteur} m²`, `${2 * (base + hauteur)} m²`, `${nb(aire)} m`, `${nb(aire + base)} m²`].filter((texte) => texte !== `${nb(aire)} m²`),
      explanation: `Aire du parallélogramme : base × hauteur = ${base} × ${hauteur} = ${nb(aire)} m².`,
    };
  }
  const aire = (base * hauteur) / 2;
  const prixAuMetre = rngPick(rng, [2, 3, 4, 5, 6]);
  const cout = aire * prixAuMetre;
  return {
    instruction: INSTRUCTION,
    prompt: `Un terrain triangulaire de base ${base} m et de hauteur ${hauteur} m est recouvert de gazon. Le gazon coûte ${prixAuMetre} € le mètre carré. Quel est le prix du gazon ?`,
    correct: `${nb(cout)} €`,
    // L'aire oubliée de sa moitié, l'aire seule, le prix d'un seul mètre carré ajouté.
    wrong: fauxAvecUnite(cout, [base * hauteur * prixAuMetre, aire, cout + prixAuMetre, (base + hauteur) * prixAuMetre, cout / 2, cout + aire, base * prixAuMetre], '€', { min: 1 }),
    explanation: `Aire : ${base} × ${hauteur} ÷ 2 = ${nb(aire)} m². Prix : ${nb(aire)} × ${prixAuMetre} = ${nb(cout)} €.`,
  };
});

export const BRIQUES_CINQUIEME_T3: Brique[] = [moyenne, diagrammeCirculaireBrique, probabiliteEquiprobable, comparerDeuxSeries, volumeContenance, aireContexte];

/** Les problèmes de la 5e, dans l'ordre où le programme les amène. */
export const BRIQUES_CINQUIEME: Brique[] = [...BRIQUES_CINQUIEME_T1, ...BRIQUES_CINQUIEME_T2, ...BRIQUES_CINQUIEME_T3];
