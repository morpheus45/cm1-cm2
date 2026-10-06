import type { Question, Trimester } from '../types';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';
import { schemaEnBarres, tableauADoubleEntree, tableauDeProportionnalite } from './figuresMaths';
import { de, decimalAleatoire, deuxPrenoms, fabriquer, fauxNombres, il, OBJETS, pronom, texte, type Brique } from './mathsCommun';
import { ARTICLES_A_PRIX, donnees, forme, heure, INSTRUCTION, INSTRUCTION_DONNEES } from './problemesCommun';

/**
 * Les problèmes de la 6e (programme de mathématiques du cycle 3, 2025).
 *
 * Les élèves de 6e ont fait leur CM2 sous l'ancien programme : le 1er
 * trimestre ne demande que ce qu'ils savent déjà (entiers, décimaux, un ou
 * deux pas), le nouveau arrive ensuite.
 * - 1er trimestre : problèmes additifs et soustractifs avec des décimaux
 *   (prix, longueurs, masses, contenances), produit d'un décimal par un
 *   entier, deux pas avec des entiers, partage exact, nombre inconnu avec un
 *   schéma en barres, horaires et durées, périmètres, lecture d'un tableau
 *   et d'un diagramme ;
 * - 2e trimestre : division euclidienne (diviseur de deux chiffres, avec
 *   reste), fractions d'une quantité et reste, somme de fractions de même
 *   dénominateur, pourcentages de 10, 25, 50 et 75 %, produit de deux
 *   décimaux, aires (rectangle, carré, m², dm², cm²), durées en plusieurs
 *   étapes, tableau à double entrée ;
 * - 3e trimestre : division d'un décimal par un entier, proportionnalité
 *   sans produit en croix (passage à l'unité, linéarité, tableaux, vitesse,
 *   échelles), probabilités (« a chances sur b », vocabulaire),
 *   pré-algèbre (programmes de calcul, balance, motifs), volume par
 *   dénombrement de cubes, pourcentages de 20, 5 et 1 %, fractions de
 *   dénominateurs multiples.
 *
 * Hors programme, donc absent : nombres relatifs, équations écrites, produit
 * en croix, coefficient de proportionnalité nommé, aire du disque, volume du
 * pavé par formule, moyenne.
 */

/** Le plus grand nombre d'une réponse : on ne propose rien au-delà. */
const MAXIMUM = 1_000_000;

// --- Les nombres décimaux, comptés en centièmes ---------------------------------------------------
//
// On calcule sur des entiers (des centièmes), et l'on n'écrit le résultat à la française qu'à la fin :
// aucune erreur d'arrondi ne se glisse entre le calcul et ce que l'élève lit.

/** 235 centièmes → « 2,35 » ; 180 → « 1,8 » ; 300 → « 3 ». */
const dec = (centiemes: number) => texte(centiemes / 100);

/** Avec exactement `decimales` chiffres après la virgule : 180, 2 → « 1,80 ». */
const fixe = (centiemes: number, decimales: number) => (centiemes / 100).toFixed(decimales).replace('.', ',');

/** Un montant : 760 → « 7,60 € », 1200 → « 12 € ». */
const euros = (centimes: number) => (centimes % 100 === 0 ? `${centimes / 100} €` : `${fixe(centimes, 2)} €`);

/** Une grandeur et son unité. */
const grandeur = (centiemes: number, unite: string) => (unite === '€' ? euros(centiemes) : `${dec(centiemes)} ${unite}`);

/** Un décimal à `decimales` chiffres (le dernier jamais nul), en centièmes. */
const centiemes = (rng: Rng, entierMin: number, entierMax: number, decimales: number) =>
  Math.round(decimalAleatoire(rng, entierMin, entierMax, decimales) * 100);

/** Des centimes d'euro comme on en voit sur une étiquette. */
const CENTIMES_USUELS = [5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 65, 70, 75, 80, 90, 95];

/** Un prix en centimes : des euros et des centimes d'étiquette. */
const prix = (rng: Rng, eurosMin: number, eurosMax: number) => rngInt(rng, eurosMin, eurosMax) * 100 + rngPick(rng, CENTIMES_USUELS);

/** Trois erreurs au moins autour d'un résultat en centièmes, écrites avec leur unité. */
const fauxGrandeurs = (reponse: number, candidats: number[], unite: string) =>
  fauxNombres(reponse, candidats, { min: 1, max: MAXIMUM * 100 }).map((valeur) => grandeur(valeur, unite));

/** Les mêmes, pour des entiers ordinaires. */
const fauxEntiers = (reponse: number, candidats: number[], unite = '') =>
  fauxNombres(reponse, candidats, { min: 1, max: MAXIMUM }).map((valeur) => (unite ? `${valeur} ${unite}` : String(valeur)));

/** Chaque chiffre soustrait du plus grand : l'erreur du « petit chiffre du grand ». */
function petitChiffreDuGrand(a: number, b: number): number {
  const longueur = Math.max(String(a).length, String(b).length);
  const [x, y] = [String(a).padStart(longueur, '0'), String(b).padStart(longueur, '0')];
  return Number(x.split('').map((chiffre, index) => Math.abs(Number(chiffre) - Number(y[index]))).join(''));
}

/** Les chiffres additionnés un à un, sans retenue. */
function sansRetenueSomme(a: number, b: number): number {
  const longueur = Math.max(String(a).length, String(b).length);
  const [x, y] = [String(a).padStart(longueur, '0'), String(b).padStart(longueur, '0')];
  return Number(x.split('').map((chiffre, index) => (Number(chiffre) + Number(y[index])) % 10).join(''));
}

/** Les chiffres multipliés un à un par `n`, les retenues oubliées. */
const sansRetenueProduit = (a: number, n: number) =>
  Number(String(a).split('').map((chiffre) => (Number(chiffre) * n) % 10).join(''));

/** Un décimal à une seule décimale lu comme s'il en avait deux : 1,8 lu 1,08. */
const lu = (centiemesDuNombre: number, decimales: number) =>
  decimales === 1 ? Math.floor(centiemesDuNombre / 100) * 100 + (centiemesDuNombre % 100) / 10 : centiemesDuNombre;

/** Les nombres de décimales de deux termes : le plus souvent, ils diffèrent (là où l'on se trompe). */
const DECIMALES: [number, number][] = [[2, 1], [1, 2], [2, 1], [1, 2], [2, 2], [1, 1]];

const ARTICLES_PLURIELS = [
  { nom: 'cahiers', chacun: 'chacun' },
  { nom: 'stylos', chacun: 'chacun' },
  { nom: 'gommes', chacun: 'chacune' },
  { nom: 'règles', chacun: 'chacune' },
  { nom: 'carnets', chacun: 'chacun' },
  { nom: 'glaces', chacun: 'chacune' },
  { nom: 'pains', chacun: 'chacun' },
  { nom: 'crayons', chacun: 'chacun' },
];

/** « 2 h 40 min », « 1 h », « 35 min » : une durée comme on l'écrit à l'école. */
const dureeEcrite = (minutes: number) => {
  const [h, m] = [Math.floor(minutes / 60), minutes % 60];
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
};

const heureDe = (minutes: number) => heure(Math.floor(minutes / 60), minutes % 60);

// === 1er trimestre =========================================================================================

const GRANDEURS = [
  { un: 'Un sac de pommes', deux: 'Un sac de poires', verbe: 'pèse', unite: 'kg', maximum: 12, somme: 'Quelle est la masse des deux sacs ?', ecart: 'Quelle est la différence de masse ?' },
  { un: 'Un ruban', deux: 'Une corde', verbe: 'mesure', unite: 'm', maximum: 12, somme: 'Quelle est la longueur totale ?', ecart: 'Quelle est la différence de longueur ?' },
  { un: 'Un livre', deux: 'Un puzzle', verbe: 'coûte', unite: '€', minimum: 6, maximum: 15, somme: 'Combien coûtent les deux ?', ecart: 'Quelle est la différence de prix ?' },
  { un: 'Un bidon', deux: 'Un seau', verbe: 'contient', unite: 'L', maximum: 10, somme: 'Combien de litres y a-t-il en tout ?', ecart: 'Quelle est la différence de contenance ?' },
];

/** Un décimal pour cette grandeur : un prix s'écrit avec ses deux décimales, les autres ont une ou deux décimales. */
const valeurDeGrandeur = (rng: Rng, g: { unite: string; minimum?: number; maximum: number }, entierMin: number, entierMax: number, decimales: number) => {
  const haut = Math.min(entierMax, g.maximum);
  // Un prix a un plancher (un livre ne coûte pas 1,05 €), sauf quand le plafond du tirage descend plus bas.
  const bas = Math.max(entierMin, g.minimum ?? entierMin) <= haut ? Math.max(entierMin, g.minimum ?? entierMin) : entierMin;
  return g.unite === '€' ? prix(rng, bas, haut) : centiemes(rng, bas, haut, decimales);
};

const decimauxAdditif = forme('decimaux-additif', 7, (rng) => {
  const g = rngPick(rng, GRANDEURS);
  // Un prix s'écrit toujours avec deux décimales : les virgules y sont déjà alignées.
  const [da, db] = g.unite === '€' ? [2, 2] : rngPick(rng, DECIMALES);
  const [a, b] = [valeurDeGrandeur(rng, g, 1, 30, da), valeurDeGrandeur(rng, g, 1, 20, db)];
  const somme = a + b;
  const entiers = (c: number, d: number) => c / Math.pow(10, 2 - d);
  const sansVirgule = (entiers(a, da) + entiers(b, db)) * Math.pow(10, 2 - da);
  const d = Math.max(da, db);
  return {
    instruction: INSTRUCTION,
    prompt: `${g.un} ${g.verbe} ${grandeur(a, g.unite)}. ${g.deux} ${g.verbe} ${grandeur(b, g.unite)}. ${g.somme}`,
    correct: grandeur(somme, g.unite),
    // Les virgules mal alignées (1,8 lu 1,08), les nombres additionnés sans virgule, les retenues oubliées.
    wrong: fauxGrandeurs(somme, [a + lu(b, db), lu(a, da) + b, sansVirgule, sansRetenueSomme(a, b), somme * 10, somme / 10, somme + 10, somme - 10, somme + 100, somme - 100], g.unite),
    explanation: `On aligne les virgules : ${fixe(a, d)} + ${fixe(b, d)} = ${fixe(somme, d)}.`,
  };
});

const RETRAITS = [
  { debut: 'Un ruban mesure', retire: 'On en coupe', unite: 'm', question: 'Combien mesure le morceau restant ?' },
  { debut: 'Un seau contient', retire: 'On en verse', unite: 'L', question: "Combien de litres d'eau reste-t-il ?" },
  { debut: 'Un sac pèse', retire: 'On en retire', unite: 'kg', question: 'Quelle est la nouvelle masse du sac ?' },
];

const decimauxSoustractif = forme('decimaux-soustractif', 7, (rng) => {
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const [moi] = deuxPrenoms(rng);
    const article = rngPick(rng, ARTICLES_A_PRIX);
    // Un billet qui convient à l'article : le prix a l'air vrai et reste sous le billet.
    const bas = (billet: number) => Math.max(article.min, Math.ceil(billet * 0.3));
    const haut = (billet: number) => Math.min(article.max - 1, billet - 1);
    const billet = rngPick(rng, [5, 10, 20, 50].filter((candidat) => bas(candidat) <= haut(candidat)));
    const eurosDuPrix = rngInt(rng, bas(billet), haut(billet));
    const aPayer = eurosDuPrix * 100 + rngPick(rng, CENTIMES_USUELS);
    const rendu = billet * 100 - aPayer;
    return {
      instruction: INSTRUCTION,
      prompt: `${moi.nom} achète ${article.un} à ${euros(aPayer)}. ${il(moi)} paie avec un billet de ${billet} €. Combien lui rend-on ?`,
      correct: euros(rendu),
      // Les euros et les centimes soustraits chacun de leur côté, sans l'échange ; un euro de trop ou de moins.
      wrong: fauxGrandeurs(rendu, [(billet - eurosDuPrix) * 100 + (aPayer % 100), rendu + 100, rendu - 100, rendu + 10, rendu - 10, aPayer, billet * 100 + aPayer], '€'),
      explanation: `${billet} − ${fixe(aPayer, 2)} = ${fixe(rendu, 2)}.`,
    };
  }
  const [da, db] = rngPick(rng, DECIMALES);
  if (variante === 1) {
    const g = rngPick(rng, GRANDEURS);
    const [dp, dq] = g.unite === '€' ? [2, 2] : [da, db];
    // Le plus cher des deux dépasse d'au moins un euro le plancher des prix : l'autre en a encore un.
    const a = valeurDeGrandeur(rng, g, g.unite === '€' ? 7 : 3, 20, dp);
    const b = valeurDeGrandeur(rng, g, 1, Math.floor(a / 100) - 1, dq);
    const reste = a - b;
    const d = Math.max(dp, dq);
    return {
      instruction: INSTRUCTION,
      prompt: `${g.un} ${g.verbe} ${grandeur(a, g.unite)}. ${g.deux} ${g.verbe} ${grandeur(b, g.unite)}. ${g.ecart}`,
      correct: grandeur(reste, g.unite),
      wrong: fauxGrandeurs(reste, [petitChiffreDuGrand(a, b), a - lu(b, dq), a + b, reste + 10, reste - 10, reste + 100, reste - 100, reste * 10], g.unite),
      explanation: `On aligne les virgules : ${fixe(a, d)} − ${fixe(b, d)} = ${fixe(reste, d)}.`,
    };
  }
  const g = rngPick(rng, RETRAITS);
  const a = centiemes(rng, 3, 20, da);
  const b = centiemes(rng, 1, Math.floor(a / 100) - 1, db);
  const reste = a - b;
  const d = Math.max(da, db);
  return {
    instruction: INSTRUCTION,
    prompt: `${g.debut} ${dec(a)} ${g.unite}. ${g.retire} ${dec(b)} ${g.unite}. ${g.question}`,
    correct: `${dec(reste)} ${g.unite}`,
    wrong: fauxGrandeurs(reste, [petitChiffreDuGrand(a, b), a - lu(b, db), a + b, reste + 10, reste - 10, reste + 100, reste - 100, reste * 10], g.unite),
    explanation: `On aligne les virgules : ${fixe(a, d)} − ${fixe(b, d)} = ${fixe(reste, d)}.`,
  };
});

const PRODUITS = [
  { debut: 'Un stylo coûte', question: (n: number) => `Combien coûtent ${n} stylos ?`, unite: '€', entier: [1, 4] },
  { debut: 'Un cahier coûte', question: (n: number) => `Quel est le prix de ${n} cahiers ?`, unite: '€', entier: [2, 5] },
  { debut: 'Un pain coûte', question: (n: number) => `Combien paie-t-on pour ${n} pains ?`, unite: '€', entier: [1, 3] },
  { debut: 'Un paquet de farine pèse', question: (n: number) => `Combien pèsent ${n} paquets ?`, unite: 'kg', entier: [1, 5] },
  { debut: 'Une bouteille contient', question: (n: number) => `Combien de litres contiennent ${n} bouteilles ?`, unite: 'L', entier: [1, 3] },
  { debut: 'Un pas de Tom mesure', question: (n: number) => `Quelle distance fait-il en ${n} pas ?`, unite: 'm', entier: [0, 1] },
  { debut: 'Une planche mesure', question: (n: number) => `Quelle longueur font ${n} planches mises bout à bout ?`, unite: 'm', entier: [1, 4] },
];

const decimauxFoisEntier = forme('decimaux-fois-entier', 7, (rng) => {
  const g = rngPick(rng, PRODUITS);
  const decimales = g.unite === '€' ? 2 : rngPick(rng, [1, 2]);
  const a = g.unite === '€' ? prix(rng, g.entier[0], g.entier[1]) : centiemes(rng, g.entier[0], g.entier[1], decimales);
  const n = rngInt(rng, 3, 12);
  const produit = a * n;
  return {
    instruction: INSTRUCTION,
    prompt: `${g.debut} ${grandeur(a, g.unite)}. ${g.question(n)}`,
    correct: grandeur(produit, g.unite),
    // La partie entière seule multipliée, les retenues oubliées, « on ajoute » au lieu de « on multiplie », la virgule déplacée.
    wrong: fauxGrandeurs(produit, [Math.floor(a / 100) * n * 100 + (a % 100), sansRetenueProduit(a, n), a + n * 100, produit * 10, produit / 10, produit + 10, produit - 10, produit + 100], g.unite),
    explanation: `${n} × ${fixe(a, decimales)} = ${fixe(produit, decimales)}.`,
  };
});

const renduDecimal = forme('rendu-decimal', 7, (rng) => {
  const [moi] = deuxPrenoms(rng);
  const article = rngPick(rng, ARTICLES_PLURIELS);
  const unitaire = prix(rng, 1, 4);
  const n = rngInt(rng, 2, 5);
  const depense = unitaire * n;
  const billet = rngPick(rng, [10, 20, 50].filter((candidat) => candidat * 100 > depense));
  const rendu = billet * 100 - depense;
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} achète ${n} ${article.nom} à ${euros(unitaire)} ${article.chacun}. ${il(moi)} paie avec un billet de ${billet} €. Combien lui rend-on ?`,
    correct: euros(rendu),
    // Seule la première étape faite, un seul article payé, les chiffres soustraits sans l'échange.
    wrong: fauxGrandeurs(rendu, [depense, billet * 100 - unitaire, petitChiffreDuGrand(billet * 100, depense), rendu + 100, rendu - 100, rendu + 10, rendu - 10, billet * 100 + depense], '€'),
    explanation: `${n} × ${fixe(unitaire, 2)} = ${fixe(depense, 2)}, puis ${billet} − ${fixe(depense, 2)} = ${fixe(rendu, 2)}.`,
  };
});

const deuxEtapesEntiers = forme('deux-etapes-entiers', 7, (rng) => {
  const variante = rngInt(rng, 0, 3);
  if (variante === 0) {
    const [rangees, places] = [rngInt(rng, 12, 30), rngInt(rng, 12, 28)];
    const total = rangees * places;
    const vendues = rngInt(rng, 40, Math.floor(total * 0.7));
    const libres = total - vendues;
    return {
      instruction: INSTRUCTION,
      prompt: `Une salle de cinéma a ${rangees} rangées de ${places} places. ${vendues} places sont déjà vendues. Combien reste-t-il de places libres ?`,
      correct: String(libres),
      wrong: fauxEntiers(libres, [total, total + vendues, rangees + places - vendues, libres + 10, libres - 10, libres + 100, libres - 100, vendues]),
      explanation: `${rangees} × ${places} = ${total}, puis ${total} − ${vendues} = ${libres}.`,
    };
  }
  if (variante === 1) {
    const [cartons, livres, stock] = [rngInt(rng, 12, 30), rngInt(rng, 12, 48), rngInt(rng, 30, 200)];
    const total = cartons * livres + stock;
    return {
      instruction: INSTRUCTION,
      prompt: `Une libraire reçoit ${cartons} cartons de ${livres} livres. Elle avait déjà ${stock} livres en stock. Combien a-t-elle de livres maintenant ?`,
      correct: String(total),
      wrong: fauxEntiers(total, [cartons * livres, cartons + livres + stock, total + 10, total - 10, total + 100, total - 100, cartons * (livres + stock)]),
      explanation: `${cartons} × ${livres} = ${cartons * livres}, puis ${cartons * livres} + ${stock} = ${total}.`,
    };
  }
  if (variante === 2) {
    const [premier, second] = deuxPrenoms(rng);
    const [enfants, part] = [rngInt(rng, 3, 9), rngInt(rng, 12, 60)];
    const tout = enfants * part;
    const a = rngInt(rng, Math.ceil(tout * 0.2), Math.floor(tout * 0.8));
    return {
      instruction: INSTRUCTION,
      prompt: `${premier.nom} a ${a} billes et ${second.nom} en a ${tout - a}. Ils partagent toutes leurs billes entre ${enfants} enfants. Combien de billes reçoit chaque enfant ?`,
      correct: String(part),
      wrong: fauxEntiers(part, [tout, a, tout - a, part + 1, part - 1, tout - enfants, part + 10, part - 10]),
      explanation: `${a} + ${tout - a} = ${tout}, puis ${tout} ÷ ${enfants} = ${part}.`,
    };
  }
  const [k, paquets, vendues] = [rngInt(rng, 4, 9), rngInt(rng, 6, 30), rngInt(rng, 10, 80)];
  const reste = k * paquets;
  const depart = reste + vendues;
  return {
    instruction: INSTRUCTION,
    prompt: `Une fleuriste a ${depart} tulipes. Elle en vend ${vendues}. Elle fait des bouquets de ${k} tulipes avec le reste. Combien de bouquets fait-elle ?`,
    correct: String(paquets),
    wrong: fauxEntiers(paquets, [reste, depart, Math.floor(depart / k), paquets + 1, paquets - 1, paquets + 10, paquets - 10, vendues]),
    explanation: `${depart} − ${vendues} = ${reste}, puis ${reste} ÷ ${k} = ${paquets}.`,
  };
});

const divisionPartage = forme('division-partage', 7, (rng) => {
  const [diviseur, quotient] = [rngInt(rng, 3, 9), rngInt(rng, 12, 99)];
  const dividende = diviseur * quotient;
  const partage = rng() < 0.5;
  const objet = rngPick(rng, OBJETS);
  return {
    instruction: INSTRUCTION,
    prompt: partage
      ? `On partage ${dividende} ${objet} entre ${diviseur} enfants. Chacun reçoit autant. Combien ${de(objet)} reçoit chaque enfant ?`
      : `Un marchand a ${dividende} ${objet}. Il les range par lots de ${diviseur}. Combien de lots fait-il ?`,
    correct: String(quotient),
    // La soustraction au lieu du partage, un chiffre perdu ou ajouté au quotient.
    wrong: fauxEntiers(quotient, [dividende - diviseur, dividende + diviseur, quotient + 1, quotient - 1, quotient * 10, quotient + 10, quotient - 10, diviseur]),
    explanation: `${diviseur} × ${quotient} = ${dividende}, donc ${dividende} ÷ ${diviseur} = ${quotient}.`,
  };
});

const inconnu = forme('inconnu', 7, (rng) => {
  const variante = rngInt(rng, 0, 3);
  const [moi] = deuxPrenoms(rng);
  if (variante === 0) {
    const objet = rngPick(rng, OBJETS);
    const [depart, gain] = [rngInt(rng, 15, 90), rngInt(rng, 12, 60)];
    const total = depart + gain;
    return {
      instruction: INSTRUCTION,
      prompt: `${moi.nom} a des ${objet}. ${il(moi)} en gagne ${gain}. ${il(moi)} en a maintenant ${total}. Combien en avait-${pronom(moi)} au début ?`,
      figure: schemaEnBarres(String(total), [{ texte: '?', poids: depart, inconnue: true }, { texte: String(gain), poids: gain }]),
      correct: String(depart),
      // L'opération contraire, un des deux nombres de l'énoncé.
      wrong: fauxEntiers(depart, [total + gain, gain, total, depart + 10, depart - 10, depart + 1, depart - 1]),
      explanation: `On cherche la partie qui manque : ${total} − ${gain} = ${depart}.`,
    };
  }
  if (variante === 1) {
    const [total, reste] = [rngInt(rng, 40, 120), rngInt(rng, 10, 35)];
    return {
      instruction: INSTRUCTION,
      prompt: `${moi.nom} a ${total} €. ${il(moi)} achète un jeu. Il lui reste ${reste} €. Quel est le prix du jeu ?`,
      figure: schemaEnBarres(`${total} €`, [{ texte: '?', poids: total - reste, inconnue: true }, { texte: `${reste} €`, poids: reste }]),
      correct: `${total - reste} €`,
      wrong: fauxEntiers(total - reste, [total + reste, reste, total, total - reste + 10, total - reste - 10, total - reste + 1, total - reste - 1], '€'),
      explanation: `On cherche la partie qui manque : ${total} − ${reste} = ${total - reste}.`,
    };
  }
  const [parts, valeur] = [rngInt(rng, 3, 9), rngInt(rng, 6, 40)];
  const total = parts * valeur;
  const dePart = Array.from({ length: parts }, () => ({ texte: '?', poids: 1, inconnue: true }));
  if (variante === 2) {
    return {
      instruction: INSTRUCTION,
      prompt: `${parts} amis paient la même somme. Ils paient ${total} € en tout. Combien paie chaque ami ?`,
      figure: schemaEnBarres(`${total} €`, dePart),
      correct: `${valeur} €`,
      wrong: fauxEntiers(valeur, [total * parts, total - parts, parts, valeur + 1, valeur - 1, valeur + 10, valeur - 10, total + parts], '€'),
      explanation: `On partage : ${total} ÷ ${parts} = ${valeur}.`,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `Un nombre multiplié par ${parts} donne ${total}. Quel est ce nombre ?`,
    figure: schemaEnBarres(String(total), dePart),
    correct: String(valeur),
    wrong: fauxEntiers(valeur, [total * parts, total - parts, parts, valeur + 1, valeur - 1, valeur + 10, valeur - 10, total + parts]),
    explanation: `On cherche une des parts : ${total} ÷ ${parts} = ${valeur}.`,
  };
});

/** Des heures d'arrivée, des durées, des heures de départ : des minutes comptées en base soixante. */
const horaires = forme('horaires', 7, (rng) => {
  const variante = rngInt(rng, 0, 2);
  const retenue = rng() < 0.75;
  const choisirMinutes = (min: number, max: number) => rngInt(rng, min / 5, max / 5) * 5;
  if (variante === 0) {
    const [h, m] = [rngInt(rng, 6, 17), choisirMinutes(5, 55)];
    const dh = rngInt(rng, 1, 4);
    const dm = retenue ? choisirMinutes(60 - m, 55) : choisirMinutes(5, Math.max(5, 55 - m));
    const duree = dh * 60 + dm;
    const arrivee = h * 60 + m + duree;
    const correct = heureDe(arrivee);
    return {
      instruction: INSTRUCTION,
      prompt: `Le train part à ${heure(h, m)}. Le trajet dure ${dureeEcrite(duree)}. À quelle heure arrive-t-il ?`,
      correct,
      // La retenue des minutes oubliée, les minutes ou les heures laissées de côté, un écart de 10 minutes ou d'une heure.
      wrong: [heureDe(arrivee - 60), heure(h + dh, (m + dm) % 60), heure(h + dh, m), heure(h + dh, dm), heureDe(arrivee + 10), heureDe(arrivee - 10), heureDe(arrivee + 60)].filter((texte) => texte !== correct),
      explanation: `${m} min + ${dm} min = ${m + dm} min. ${correct}.`,
    };
  }
  if (variante === 1) {
    const [h, m] = [rngInt(rng, 7, 20), choisirMinutes(10, 55)];
    const dh = rngInt(rng, 1, 3);
    // Avec la retenue, les minutes de la fin sont plus petites que celles du début : 20 h 45 → 22 h 20.
    const dm = retenue ? choisirMinutes(5, m - 5) : choisirMinutes(m, 55);
    const duree = (h + dh) * 60 + dm - (h * 60 + m);
    const correct = dureeEcrite(duree);
    return {
      instruction: INSTRUCTION,
      prompt: `Un film commence à ${heure(h, m)}. Il finit à ${heure(h + dh, dm)}. Quelle est la durée du film ?`,
      correct,
      // Les minutes soustraites chiffre à chiffre (45 − 20 = 25 au lieu de 20 − 45), un écart de 10 minutes ou d'une heure.
      wrong: [dureeEcrite(dh * 60 + Math.abs(dm - m)), dureeEcrite(duree + 10), dureeEcrite(duree - 10), dureeEcrite(duree + 60), dureeEcrite(Math.max(5, duree - 60)), dureeEcrite(dh * 60)].filter((texte) => texte !== correct),
      explanation: `De ${heure(h, m)} à ${heure(h + dh, dm)}, il y a ${correct}.`,
    };
  }
  const [h, m] = [rngInt(rng, 9, 20), choisirMinutes(5, 55)];
  const duree = rngInt(rng, 1, 3) * 60 + choisirMinutes(10, 55);
  const arrivee = h * 60 + m;
  const depart = arrivee - duree;
  const correct = heureDe(depart);
  return {
    instruction: INSTRUCTION,
    prompt: `Le car arrive à ${heure(h, m)} après ${dureeEcrite(duree)} de route. À quelle heure est-il parti ?`,
    correct,
    wrong: [heureDe(arrivee + duree), heureDe(depart + 60), heureDe(depart - 60), heureDe(depart + 10), heureDe(depart - 10), heure(h - Math.floor(duree / 60), Math.abs(m - (duree % 60)))].filter((texte) => texte !== correct),
    explanation: `${heure(h, m)} − ${dureeEcrite(duree)} = ${correct}.`,
  };
});

const POLYGONES = [
  { nom: 'Un triangle équilatéral', cotes: 3 },
  { nom: 'Un pentagone régulier', cotes: 5 },
  { nom: 'Un hexagone régulier', cotes: 6 },
  { nom: 'Un octogone régulier', cotes: 8 },
];

const perimetre = forme('perimetre', 7, (rng) => {
  const variante = rngInt(rng, 0, 3);
  const unite = variante === 1 ? 'm' : rngPick(rng, ['cm', 'm']);
  const dixiemes = (min: number, max: number, avecDecimale: boolean) => (avecDecimale ? rngInt(rng, min * 10 + 1, max * 10 - 1) : rngInt(rng, min, max) * 10);
  const ecrit = (t: number) => `${texte(t / 10)} ${unite}`;
  if (variante === 0 || variante === 1) {
    // Un jardin est plus large qu'une bande de 3 m.
    const [longueur, largeur] = variante === 1 ? [dixiemes(12, 40, rng() < 0.4), dixiemes(6, 11, rng() < 0.4)] : [dixiemes(8, 40, rng() < 0.4), dixiemes(3, 7, rng() < 0.4)];
    const p = 2 * (longueur + largeur);
    return {
      instruction: INSTRUCTION,
      prompt:
        variante === 0
          ? `Un rectangle mesure ${texte(longueur / 10)} ${unite} de long et ${texte(largeur / 10)} ${unite} de large. Quel est son périmètre ?`
          : `Un jardin rectangulaire mesure ${texte(longueur / 10)} ${unite} sur ${texte(largeur / 10)} ${unite}. On pose une clôture tout autour. Quelle longueur de clôture faut-il ?`,
      correct: ecrit(p),
      // L'aire, le demi-périmètre, un côté oublié.
      wrong: fauxNombres(p, [(longueur * largeur) / 10, longueur + largeur, 2 * longueur + largeur, longueur + 2 * largeur, p + 10, p - 10, 4 * longueur], { min: 1, max: MAXIMUM }).map(ecrit),
      explanation: `2 × (${texte(longueur / 10)} + ${texte(largeur / 10)}) = ${texte(p / 10)}.`,
    };
  }
  if (variante === 2) {
    const cote = dixiemes(3, 20, rng() < 0.5);
    const p = 4 * cote;
    return {
      instruction: INSTRUCTION,
      prompt: `Un carré a un côté de ${texte(cote / 10)} ${unite}. Quel est son périmètre ?`,
      correct: ecrit(p),
      wrong: fauxNombres(p, [(cote * cote) / 10, 2 * cote, 3 * cote, cote + 4, p + 10, p - 10], { min: 1, max: MAXIMUM }).map(ecrit),
      explanation: `4 × ${texte(cote / 10)} = ${texte(p / 10)}.`,
    };
  }
  const polygone = rngPick(rng, POLYGONES);
  const cote = dixiemes(2, 9, rng() < 0.5);
  const p = polygone.cotes * cote;
  return {
    instruction: INSTRUCTION,
    prompt: `${polygone.nom} a des côtés de ${texte(cote / 10)} ${unite}. Quel est son périmètre ?`,
    correct: ecrit(p),
    wrong: fauxNombres(p, [(polygone.cotes - 1) * cote, (polygone.cotes + 1) * cote, cote + polygone.cotes * 10, p + 10, p - 10, 2 * cote], { min: 1, max: MAXIMUM }).map(ecrit),
    explanation: `${polygone.cotes} côtés égaux : ${polygone.cotes} × ${texte(cote / 10)} = ${texte(p / 10)}.`,
  };
});

// === 2e trimestre ==========================================================================================

const divisionEuclidienne = forme('division-euclidienne', 8, (rng) => {
  const objet = rngPick(rng, OBJETS);
  const k = rngInt(rng, 11, 60);
  const quotient = rngInt(rng, 5, 150);
  const reste = rngInt(rng, 1, k - 1);
  const total = k * quotient + reste;
  const question = rngInt(rng, 0, 2);
  const enonce = `Une marchande a ${total} ${objet}. Elle les range par paquets de ${k}.`;
  const explication = `${total} = ${k} × ${quotient} + ${reste}.`;
  if (question === 0) {
    return {
      instruction: INSTRUCTION,
      prompt: `${enonce} Combien de paquets complets fait-elle ?`,
      correct: String(quotient),
      wrong: fauxEntiers(quotient, [quotient + 1, quotient - 1, reste, quotient + 2, total - k, Math.floor(total / (k + 1)), quotient + 10, quotient - 10]),
      explanation: explication,
    };
  }
  if (question === 1) {
    return {
      instruction: INSTRUCTION,
      prompt: `${enonce} Combien ${de(objet)} reste-t-il ?`,
      correct: String(reste),
      wrong: fauxEntiers(reste, [quotient, reste + 1, reste - 1, k - reste, total - quotient, reste + 10, reste - 10]),
      explanation: explication,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `${enonce} Combien de paquets lui faut-il pour tout ranger ?`,
    correct: String(quotient + 1),
    // Le reste oublié : seuls les paquets complets sont comptés.
    wrong: fauxEntiers(quotient + 1, [quotient, quotient + 2, quotient - 1, reste, total - k, quotient + 11]),
    explanation: `${explication} Il faut un paquet de plus.`,
  };
});

const NOMS_DE_FRACTIONS: Record<number, string> = { 2: 'la moitié', 3: 'le tiers', 4: 'le quart', 5: 'le cinquième', 6: 'le sixième', 8: 'le huitième', 10: 'le dixième' };

const FRACTIONS: [number, number][] = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [1, 10], [3, 10], [7, 10],
];

/** « la moitié », « le quart », « les 3/4 » : une fraction, comme on la dit. */
const fractionDite = (n: number, d: number) => (n === 1 ? NOMS_DE_FRACTIONS[d] : `les ${n}/${d}`);

const fractionDeQuantite = forme('fraction-de-quantite', 8, (rng) => {
  const [moi] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  const [n, d] = rngPick(rng, FRACTIONS);
  const unite = rngInt(rng, 2, 12);
  const total = d * unite;
  const part = n * unite;
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} a ${total} ${objet}. ${il(moi)} en donne ${fractionDite(n, d)}. Combien ${de(objet)} donne-t-${pronom(moi)} ?`,
    correct: String(part),
    // Ce qui reste, une seule part, la fraction à l'envers.
    wrong: fauxEntiers(part, [total - part, unite, (total * d) / n, part + unite, part - unite, total - unite, part + 1, part - 1]),
    explanation: n === 1 ? `${total} ÷ ${d} = ${part}.` : `${total} ÷ ${d} = ${unite}, puis ${n} × ${unite} = ${part}.`,
  };
});

const resteApresUneFraction = forme('reste-fraction', 8, (rng) => {
  const [moi] = deuxPrenoms(rng);
  const objet = rngPick(rng, OBJETS);
  const [n, d] = rngPick(rng, FRACTIONS);
  const unite = rngInt(rng, 2, 12);
  const [total, part] = [d * unite, n * unite];
  const reste = total - part;
  return {
    instruction: INSTRUCTION,
    prompt: `${moi.nom} a ${total} ${objet}. ${il(moi)} en perd ${fractionDite(n, d)}. Combien ${de(objet)} lui reste-t-il ?`,
    correct: String(reste),
    wrong: fauxEntiers(reste, [part, total + part, unite, total - unite, reste + unite, reste - unite, reste + 1, reste - 1]),
    explanation: n === 1 ? `${total} ÷ ${d} = ${part}, puis ${total} − ${part} = ${reste}.` : `${total} ÷ ${d} = ${unite}, ${n} × ${unite} = ${part}, puis ${total} − ${part} = ${reste}.`,
  };
});

const PARTAGES = ['une pizza', 'une tarte', 'une galette', 'une brioche', 'une quiche'];

/** Une fraction écrite « 5/8 ». */
const fraction = (numerateur: number, denominateur: number) => `${numerateur}/${denominateur}`;

/** Deux fractions valent-elles le même nombre ? (Une mauvaise réponse ne doit jamais valoir la bonne.) */
const memeValeur = (a: [number, number], b: [number, number]) => a[0] * b[1] === b[0] * a[1];

function fractionsAuChoix(correct: [number, number], candidats: [number, number][]): string[] {
  return candidats.filter((candidat) => !memeValeur(candidat, correct) && candidat[0] > 0 && candidat[1] > 0).map(([n, d]) => fraction(n, d));
}

const fractionsSomme = forme('fractions-somme', 8, (rng) => {
  const [premier, second] = deuxPrenoms(rng);
  const partage = rngPick(rng, PARTAGES);
  const nom = partage.replace(/^une /, 'la ');
  const d = rngPick(rng, [4, 5, 6, 8, 10]);
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const n1 = rngInt(rng, 1, d - 2);
    const n2 = rngInt(rng, 1, d - 1 - n1);
    const somme = n1 + n2;
    return {
      instruction: INSTRUCTION,
      prompt: `${premier.nom} mange ${fraction(n1, d)} d'${partage}. ${second.nom} en mange ${fraction(n2, d)}. Quelle fraction de ${nom} ont-ils mangée ?`,
      correct: fraction(somme, d),
      // Les numérateurs et les dénominateurs additionnés, un seul des deux morceaux, ce qui reste.
      wrong: fractionsAuChoix([somme, d], [[somme, 2 * d], [n1 * n2, d], [n1, d], [n2, d], [d - somme, d], [somme, d + 1], [somme + 1, d]]),
      explanation: `Même dénominateur : ${n1} + ${n2} = ${somme}, donc ${fraction(somme, d)}.`,
    };
  }
  if (variante === 1) {
    const n = rngInt(rng, 1, d - 1);
    return {
      instruction: INSTRUCTION,
      prompt: `${premier.nom} mange ${fraction(n, d)} d'${partage}. Quelle fraction de ${nom} reste-t-il ?`,
      correct: fraction(d - n, d),
      wrong: fractionsAuChoix([d - n, d], [[n, d], [d - n, 2 * d], [n, d - n], [d, n], [d - n + 1, d], [d - n - 1, d]]),
      explanation: `Le tout vaut ${fraction(d, d)} : ${d} − ${n} = ${d - n}, donc ${fraction(d - n, d)}.`,
    };
  }
  const reste = rngInt(rng, 3, d - 1);
  const dernier = rngInt(rng, 1, reste - 1);
  return {
    instruction: INSTRUCTION,
    prompt: `Il restait ${fraction(reste, d)} d'${partage}. ${premier.nom} en mange ${fraction(dernier, d)}. Quelle fraction de ${nom} reste-t-il ?`,
    correct: fraction(reste - dernier, d),
    wrong: fractionsAuChoix([reste - dernier, d], [[reste - dernier, 2 * d], [reste + dernier, d], [dernier, d], [reste, d], [reste - dernier + 1, d], [reste - dernier - 1, d]]),
    explanation: `Même dénominateur : ${reste} − ${dernier} = ${reste - dernier}, donc ${fraction(reste - dernier, d)}.`,
  };
});

/** Les nombres dont on prend 10, 25, 50, 75 % : toujours un résultat entier. */
const BASES_DE_POURCENTAGE: Record<number, { pas: number; min: number; max: number }> = {
  10: { pas: 10, min: 2, max: 30 },
  25: { pas: 4, min: 2, max: 50 },
  50: { pas: 2, min: 3, max: 100 },
  75: { pas: 4, min: 2, max: 50 },
  20: { pas: 5, min: 2, max: 40 },
  5: { pas: 20, min: 1, max: 15 },
  1: { pas: 100, min: 1, max: 9 },
};

function pourcentage(name: string, minStage: Stage, valeurs: number[]): Brique {
  return forme(name, minStage, (rng) => {
    const p = rngPick(rng, valeurs);
    const { pas, min, max } = BASES_DE_POURCENTAGE[p];
    const base = pas * rngInt(rng, min, max);
    const part = (base * p) / 100;
    const variante = rngInt(rng, 0, 3);
    const article = base <= 100 ? 'Un jeu vidéo' : base <= 300 ? 'Un vélo' : 'Un ordinateur';
    if (variante === 0) {
      return {
        instruction: INSTRUCTION,
        prompt: `${article} coûte ${base} €. On applique une réduction de ${p} %. Quel est le montant de la réduction ?`,
        correct: `${part} €`,
        // Le pourcentage pris pour la réponse, le prix après réduction, la moitié ou le double.
        wrong: fauxEntiers(part, [p, base - part, part * 2, part / 2, base, part + 10, part - 10, base + part], '€'),
        explanation: `${p} % de ${base} : ${base} × ${p} ÷ 100 = ${part}.`,
      };
    }
    if (variante === 1) {
      return {
        instruction: INSTRUCTION,
        prompt: `${article} coûte ${base} €. On applique une réduction de ${p} %. Quel est le nouveau prix ?`,
        correct: `${base - part} €`,
        // La réduction au lieu du prix, le prix augmenté au lieu de réduit.
        wrong: fauxEntiers(base - part, [part, base + part, base - p, base - part + 10, base - part - 10, base, p], '€'),
        explanation: `${p} % de ${base} = ${part}, puis ${base} − ${part} = ${base - part}.`,
      };
    }
    if (variante === 2) {
      const objet = rngPick(rng, ['billes', 'timbres', 'cartes', 'bonbons']);
      return {
        instruction: INSTRUCTION,
        prompt: `Une boîte contient ${base} ${objet}. ${p} % sont rouges. Combien y en a-t-il de rouges ?`,
        correct: String(part),
        wrong: fauxEntiers(part, [p, base - part, part * 2, part / 2, base, part + 10, part - 10, base + part]),
        explanation: `${p} % de ${base} : ${base} × ${p} ÷ 100 = ${part}.`,
      };
    }
    return {
      instruction: INSTRUCTION,
      prompt: `Un livre a ${base} pages. Léa en a lu ${p} %. Combien de pages lui reste-t-il à lire ?`,
      correct: String(base - part),
      wrong: fauxEntiers(base - part, [part, base + part, base - p, base - part + 10, base - part - 10, base, p]),
      explanation: `${p} % de ${base} = ${part}, puis ${base} − ${part} = ${base - part}.`,
    };
  });
}

const produitDeDecimaux = forme('produit-decimaux', 8, (rng) => {
  // Deux décimaux à une décimale, comptés en dixièmes : leur produit est un nombre de centièmes.
  const [a, b] = [rngInt(rng, 12, 59), rngInt(rng, 12, 59)];
  const produit = a * b;
  const [da, db] = [texte(a / 10), texte(b / 10)];
  // La virgule mal placée, la somme au lieu du produit, les parties entières seules.
  const candidats = [produit * 10, produit / 10, (a + b) * 10, Math.floor(a / 10) * Math.floor(b / 10) * 100, produit + 10, produit - 10, produit * 100];
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    return {
      instruction: INSTRUCTION,
      prompt: `Un rectangle mesure ${da} m de long et ${db} m de large. Quelle est son aire ?`,
      correct: `${dec(produit)} m²`,
      wrong: [...fauxGrandeurs(produit, candidats, 'm²'), `${dec(produit)} m`],
      explanation: `${da} × ${db} = ${dec(produit)}.`,
    };
  }
  const [article, unite, achete] = variante === 1 ? ['Un litre de jus', 'L', 'Léa'] : ['Un kilogramme de poires', 'kg', 'Tom'];
  return {
    instruction: INSTRUCTION,
    prompt: `${article} coûte ${euros(a * 10)}. ${achete} en achète ${db} ${unite}. Combien paie-t-${achete === 'Léa' ? 'elle' : 'il'} ?`,
    correct: euros(produit),
    wrong: fauxGrandeurs(produit, candidats, '€'),
    explanation: `${fixe(a * 10, 2)} × ${db} = ${fixe(produit, 2)}.`,
  };
});

const aireDuRectangle = forme('aire-rectangle', 8, (rng) => {
  const unite = rngPick(rng, ['cm', 'm']);
  if (rng() < 0.6) {
    const [longueur, largeur] = [rngInt(rng, 6, 25), rngInt(rng, 3, 15)];
    const aire = longueur * largeur;
    const perimetre = 2 * (longueur + largeur);
    return {
      instruction: INSTRUCTION,
      prompt: `Un rectangle mesure ${longueur} ${unite} de long et ${largeur} ${unite} de large. Quelle est son aire ?`,
      correct: `${aire} ${unite}²`,
      // Le périmètre, la somme des côtés, la bonne valeur avec l'unité de longueur.
      wrong: [`${perimetre} ${unite}²`, `${aire} ${unite}`, `${longueur + largeur} ${unite}²`, `${aire * 2} ${unite}²`, `${Math.floor(aire / 2)} ${unite}²`, `${aire + 10} ${unite}²`].filter((texte) => texte !== `${aire} ${unite}²`),
      explanation: `${longueur} × ${largeur} = ${aire}, en ${unite}².`,
    };
  }
  const cote = rngInt(rng, 4, 20);
  const aire = cote * cote;
  return {
    instruction: INSTRUCTION,
    prompt: `Un carré a un côté de ${cote} ${unite}. Quelle est son aire ?`,
    correct: `${aire} ${unite}²`,
    wrong: [`${4 * cote} ${unite}²`, `${aire} ${unite}`, `${2 * cote} ${unite}²`, `${aire + cote} ${unite}²`, `${aire - cote} ${unite}²`].filter((texte) => texte !== `${aire} ${unite}²`),
    explanation: `${cote} × ${cote} = ${aire}, en ${unite}².`,
  };
});

const aireEtConversion = forme('aire-conversion', 8, (rng) => {
  const [petit, grand, facteur] = rngPick(rng, [['cm²', 'dm²', 100], ['dm²', 'm²', 100]] as [string, string, number][]);
  const [longueur, largeur] = [rngInt(rng, 2, 9), rngInt(rng, 2, 9)];
  // Les côtés sont donnés dans la grande unité de longueur (dm ou m) ; l'aire est demandée dans la petite unité d'aire.
  const lGrand = petit === 'cm²' ? 'dm' : 'm';
  const aire = longueur * largeur;
  const reponse = aire * facteur;
  return {
    instruction: INSTRUCTION,
    prompt: `Un rectangle mesure ${longueur} ${lGrand} sur ${largeur} ${lGrand}. Quelle est son aire en ${petit} ?`,
    correct: `${reponse} ${petit}`,
    // Aucune conversion, le facteur 10 ou 1 000 au lieu de 100, la mauvaise unité.
    wrong: [`${aire} ${petit}`, `${aire * 10} ${petit}`, `${aire * 1000} ${petit}`, `${reponse} ${grand}`, `${aire * facteur * 10} ${petit}`].filter((texte) => texte !== `${reponse} ${petit}`),
    explanation: `${longueur} × ${largeur} = ${aire} ${grand}. Et 1 ${grand} = ${facteur} ${petit}.`,
  };
});

const horairesEnPlusieursEtapes = forme('horaires-etapes', 8, (rng) => {
  const variante = rngInt(rng, 0, 2);
  const minutes = (min: number, max: number) => rngInt(rng, min / 5, max / 5) * 5;
  const [moi] = deuxPrenoms(rng);
  if (variante === 0) {
    const [h, m] = [rngInt(rng, 6, 9), minutes(10, 55)];
    const [marche, bus] = [minutes(10, 35), minutes(25, 55)];
    const arrivee = h * 60 + m + marche + bus;
    const correct = heureDe(arrivee);
    return {
      instruction: INSTRUCTION,
      prompt: `${moi.nom} part à ${heure(h, m)}. ${il(moi)} marche ${marche} min, puis prend le bus ${bus} min. À quelle heure arrive-t-${pronom(moi)} ?`,
      correct,
      // Une seule des deux durées, la retenue des minutes oubliée.
      wrong: [heureDe(h * 60 + m + marche), heureDe(h * 60 + m + bus), heureDe(arrivee + 10), heureDe(arrivee - 10), heureDe(arrivee + 60), heureDe(arrivee - 60)].filter((texte) => texte !== correct),
      explanation: `${marche} + ${bus} = ${marche + bus} min. ${heure(h, m)} + ${dureeEcrite(marche + bus)} = ${correct}.`,
    };
  }
  if (variante === 1) {
    const [film, pub] = [rngInt(rng, 1, 2) * 60 + minutes(15, 55), minutes(10, 25)];
    const total = film + pub;
    const correct = dureeEcrite(total);
    return {
      instruction: INSTRUCTION,
      prompt: `Un film dure ${dureeEcrite(film)}. La publicité avant le film dure ${pub} min. Quelle est la durée totale ?`,
      correct,
      // La publicité oubliée, un écart de 10 minutes ou d'une heure, la retenue des minutes oubliée.
      wrong: [dureeEcrite(film), dureeEcrite(total + 10), dureeEcrite(total - 10), dureeEcrite(total + 60), dureeEcrite(film - pub), ...((film % 60) + pub >= 60 ? [dureeEcrite(total - 60)] : [])].filter((texte, index, tous) => texte !== correct && tous.indexOf(texte) === index),
      explanation: `${dureeEcrite(film)} + ${pub} min = ${correct}.`,
    };
  }
  const [h, m] = [rngInt(rng, 13, 17), minutes(5, 55)];
  const [premiere, pause, seconde] = [minutes(25, 55), minutes(10, 20), minutes(20, 55)];
  const fin = h * 60 + m + premiere + pause + seconde;
  const correct = heureDe(fin);
  return {
    instruction: INSTRUCTION,
    prompt: `Le cours commence à ${heure(h, m)}. Il dure ${premiere} min, puis il y a ${pause} min de pause, puis ${seconde} min de travail. À quelle heure finit-il ?`,
    correct,
    wrong: [heureDe(fin - pause), heureDe(fin - seconde), heureDe(fin + 10), heureDe(fin - 10), heureDe(fin + 60), heureDe(h * 60 + m + premiere + seconde + 10)].filter((texte) => texte !== correct),
    explanation: `${premiere} + ${pause} + ${seconde} = ${premiere + pause + seconde} min. ${correct}.`,
  };
});

interface ContexteDoubleEntree {
  colonnes: { nom: string; dit: string }[];
  lignes: { nom: string; dit: string }[];
  lecture: (colonne: string, ligne: string) => string;
  total: (colonne: string) => string;
  inconnue: (ligne: string, total: number) => string;
}

const CONTEXTES_DOUBLE_ENTREE: ContexteDoubleEntree[] = [
  {
    colonnes: [{ nom: 'Pains', dit: 'de pains' }, { nom: 'Gâteaux', dit: 'de gâteaux' }, { nom: 'Tartes', dit: 'de tartes' }],
    lignes: [{ nom: 'Lundi', dit: 'le lundi' }, { nom: 'Mardi', dit: 'le mardi' }, { nom: 'Mercredi', dit: 'le mercredi' }],
    lecture: (colonne, ligne) => `Combien ${colonne} la boulangerie vend-elle ${ligne} ?`,
    total: (colonne) => `Combien ${colonne} la boulangerie vend-elle en tout, du lundi au mercredi ?`,
    inconnue: (ligne, total) => `${ligne}, la boulangerie vend ${total} articles en tout. Quel nombre remplace le point d'interrogation ?`,
  },
  {
    colonnes: [{ nom: 'Pommes', dit: 'de pommes' }, { nom: 'Poires', dit: 'de poires' }, { nom: 'Fraises', dit: 'de fraises' }],
    lignes: [{ nom: 'Samedi', dit: 'le samedi' }, { nom: 'Dimanche', dit: 'le dimanche' }, { nom: 'Lundi', dit: 'le lundi' }],
    lecture: (colonne, ligne) => `Combien ${colonne} le marchand vend-il ${ligne} ?`,
    total: (colonne) => `Combien ${colonne} le marchand vend-il en tout, sur les trois jours ?`,
    inconnue: (ligne, total) => `${ligne}, le marchand vend ${total} fruits en tout. Quel nombre remplace le point d'interrogation ?`,
  },
  {
    colonnes: [{ nom: 'Foot', dit: 'du foot' }, { nom: 'Judo', dit: 'du judo' }, { nom: 'Danse', dit: 'de la danse' }],
    lignes: [{ nom: '6e A', dit: 'en 6e A' }, { nom: '6e B', dit: 'en 6e B' }, { nom: '6e C', dit: 'en 6e C' }],
    lecture: (colonne, ligne) => `Combien d'élèves font ${colonne} ${ligne} ?`,
    total: (colonne) => `Combien d'élèves font ${colonne} dans les trois classes ?`,
    inconnue: (ligne, total) => `${ligne}, ${total} élèves font du sport en tout. Quel nombre remplace le point d'interrogation ?`,
  },
];

const tableauADoubleEntreeBrique = forme('double-entree', 8, (rng) => {
  const contexte = rngPick(rng, CONTEXTES_DOUBLE_ENTREE);
  const valeurs = contexte.lignes.map(() => contexte.colonnes.map(() => rngInt(rng, 6, 48)));
  const variante = rngInt(rng, 0, 2);
  const ligne = rngInt(rng, 0, 2);
  const colonne = rngInt(rng, 0, 2);
  const lignesDuTableau = (cache: [number, number] | null): [string, (number | null)[]][] =>
    contexte.lignes.map((nom, i) => [nom.nom, valeurs[i].map((valeur, j) => (cache && cache[0] === i && cache[1] === j ? null : valeur))]);
  const entetes = contexte.colonnes.map((entree) => entree.nom);
  const detail = `${contexte.lignes[0].nom}-${contexte.colonnes[0].nom}-${valeurs.flat().join('.')}-${variante}-${ligne}-${colonne}`;
  if (variante === 0) {
    const reponse = valeurs[ligne][colonne];
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: contexte.lecture(contexte.colonnes[colonne].dit, contexte.lignes[ligne].dit),
      figure: tableauADoubleEntree(entetes, lignesDuTableau(null)),
      correct: String(reponse),
      // Une case de la même ligne ou de la même colonne.
      wrong: fauxEntiers(reponse, [valeurs[ligne][(colonne + 1) % 3], valeurs[ligne][(colonne + 2) % 3], valeurs[(ligne + 1) % 3][colonne], valeurs[(ligne + 2) % 3][colonne], reponse + 1, reponse - 1]),
      explanation: `On lit la case : ${reponse}.`,
    };
  }
  if (variante === 1) {
    const total = valeurs.reduce((somme, valeursDeLaLigne) => somme + valeursDeLaLigne[colonne], 0);
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: contexte.total(contexte.colonnes[colonne].dit),
      figure: tableauADoubleEntree(entetes, lignesDuTableau(null)),
      correct: String(total),
      // Seulement deux lignes, la somme d'une ligne au lieu d'une colonne.
      wrong: fauxEntiers(total, [total - valeurs[0][colonne], total - valeurs[2][colonne], valeurs[ligne].reduce((somme, valeur) => somme + valeur, 0), total + 10, total - 10, total + 1, total - 1]),
      explanation: `On additionne la colonne : ${valeurs.map((v) => v[colonne]).join(' + ')} = ${total}.`,
    };
  }
  const totalDeLaLigne = valeurs[ligne].reduce((somme, valeur) => somme + valeur, 0);
  const reponse = valeurs[ligne][colonne];
  return {
    detail,
    instruction: INSTRUCTION_DONNEES,
    prompt: contexte.inconnue(contexte.lignes[ligne].nom, totalDeLaLigne),
    figure: tableauADoubleEntree(entetes, lignesDuTableau([ligne, colonne])),
    correct: String(reponse),
    // Le total lui-même, le total sans une seule case.
    wrong: fauxEntiers(reponse, [totalDeLaLigne, totalDeLaLigne - reponse, valeurs[ligne][(colonne + 1) % 3], reponse + 10, reponse - 10, reponse + 1, reponse - 1]),
    explanation: `${totalDeLaLigne} moins les autres cases : ${reponse}.`,
  };
});

// === 3e trimestre ==========================================================================================

const DIVISIONS_DECIMALES = [
  { debut: (d: number) => `Un ruban est coupé en ${d} morceaux égaux.`, mesure: (x: string) => `Le ruban mesure ${x}.`, question: 'Combien mesure chaque morceau ?', unite: 'm' },
  { debut: (d: number) => `${d} amis se partagent une somme à parts égales.`, mesure: (x: string) => `Ils ont ${x} en tout.`, question: 'Combien reçoit chaque ami ?', unite: '€' },
  { debut: (d: number) => `Une masse est répartie dans ${d} sacs identiques.`, mesure: (x: string) => `La masse totale est de ${x}.`, question: 'Quelle est la masse de chaque sac ?', unite: 'kg' },
  { debut: (d: number) => `On remplit ${d} bouteilles identiques.`, mesure: (x: string) => `On a ${x} de jus.`, question: 'Combien de litres met-on dans chaque bouteille ?', unite: 'L' },
];

const divisionDecimale = forme('division-decimale', 9, (rng) => {
  const g = rngPick(rng, DIVISIONS_DECIMALES);
  const d = rngInt(rng, 2, 9);
  const decimales = rngPick(rng, [1, 2]);
  const quotient = centiemes(rng, 1, 15, decimales);
  const dividende = quotient * d;
  const partieEntiere = Math.floor(dividende / (100 * d)) * 100;
  return {
    instruction: INSTRUCTION,
    prompt: `${g.debut(d)} ${g.mesure(grandeur(dividende, g.unite))} ${g.question}`,
    correct: grandeur(quotient, g.unite),
    // La virgule oubliée ou déplacée, la partie entière seule, la soustraction au lieu du partage.
    wrong: fauxGrandeurs(quotient, [quotient * 10, quotient / 10, partieEntiere, quotient + 10, quotient - 10, dividende - d * 100, quotient * 100], g.unite),
    explanation: `${fixe(dividende, decimales)} ÷ ${d} = ${fixe(quotient, decimales)}.`,
  };
});

const OBJETS_VENDUS = [
  { nom: 'cahiers', un: 'cahier', unite: '€' },
  { nom: 'stylos', un: 'stylo', unite: '€' },
  { nom: 'glaces', un: 'glace', unite: '€' },
  { nom: 'tickets de cinéma', un: 'ticket de cinéma', unite: '€' },
];

const passageALUnite = forme('passage-unite', 9, (rng) => {
  if (rng() < 0.7) {
    const objet = rngPick(rng, OBJETS_VENDUS);
    const prixUnitaire = rngPick(rng, [50, 75, 120, 150, 180, 200, 250, 300, 350, 450]);
    const n1 = rngInt(rng, 2, 8);
    const n2 = rngPick(rng, [2, 3, 4, 5, 6, 8, 10, 12].filter((candidat) => candidat !== n1));
    const [p1, p2] = [prixUnitaire * n1, prixUnitaire * n2];
    return {
      instruction: INSTRUCTION,
      prompt: `${n1} ${objet.nom} coûtent ${euros(p1)}. Combien coûtent ${n2} ${objet.nom} au même prix ?`,
      correct: euros(p2),
      // Le raisonnement additif (« 3 de plus, donc 3 € de plus »), le prix d'un seul, le prix non divisé.
      wrong: fauxGrandeurs(p2, [p1 + (n2 - n1) * 100, prixUnitaire, p1 * n2, p2 + 100, p2 - 100, ...(p2 % 100 === 0 ? [] : [p2 + 10, p2 - 10]), p1 * (n2 - n1), p2 * 2], '€'),
      explanation: `1 ${objet.un} coûte ${euros(prixUnitaire)}. ${n2} × ${fixe(prixUnitaire, 2)} = ${fixe(p2, 2)}.`,
    };
  }
  const [par, n1] = [rngPick(rng, [4, 6, 8, 9, 12, 15]), rngInt(rng, 2, 6)];
  const n2 = rngPick(rng, [3, 4, 5, 7, 8, 9, 10].filter((candidat) => candidat !== n1));
  const [q1, q2] = [par * n1, par * n2];
  return {
    instruction: INSTRUCTION,
    prompt: `Une machine fabrique ${q1} jouets en ${n1} heures. Combien en fabrique-t-elle en ${n2} heures ?`,
    correct: String(q2),
    wrong: fauxEntiers(q2, [q1 + (n2 - n1), par, q1 * n2, q2 + par, q2 - par, q2 + 10, q2 - 10, q1 * (n2 - n1)]),
    explanation: `En 1 heure : ${q1} ÷ ${n1} = ${par}. Puis ${n2} × ${par} = ${q2}.`,
  };
});

const INGREDIENTS = [
  { nom: 'de farine', unite: 'g', parPersonne: [25, 50, 75, 100] },
  { nom: 'de sucre', unite: 'g', parPersonne: [20, 25, 30, 40, 50] },
  { nom: 'de lait', unite: 'cL', parPersonne: [10, 15, 20, 25] },
  { nom: 'de beurre', unite: 'g', parPersonne: [10, 15, 20, 25] },
];

const recette = forme('recette', 9, (rng) => {
  const ingredient = rngPick(rng, INGREDIENTS);
  const u = rngPick(rng, ingredient.parPersonne);
  const n1 = rngPick(rng, [2, 4, 5, 6, 8]);
  const n2 = rngPick(rng, [3, 4, 6, 8, 9, 10, 12, 15].filter((candidat) => candidat !== n1));
  const [q1, q2] = [u * n1, u * n2];
  return {
    instruction: INSTRUCTION,
    prompt: `Pour ${n1} personnes, une recette demande ${q1} ${ingredient.unite} ${ingredient.nom}. Combien en faut-il pour ${n2} personnes ?`,
    correct: `${q2} ${ingredient.unite}`,
    // Ce que l'on ajoute au lieu de ce que l'on multiplie, la quantité d'une personne, la quantité non divisée.
    wrong: fauxEntiers(q2, [q1 + (n2 - n1), q1 * (n2 - n1), u, q1 * n2, q2 + u, q2 - u, q2 + 10, q2 - 10], ingredient.unite),
    explanation: `Pour 1 personne : ${q1} ÷ ${n1} = ${u}. Puis ${n2} × ${u} = ${q2}.`,
  };
});

const GRANDEURS_PROPORTIONNELLES = [
  { haut: 'Cahiers', bas: 'Prix en €', facteurs: [2, 3, 4, 5, 6] },
  { haut: 'Places', bas: 'Prix en €', facteurs: [6, 7, 8, 9, 12] },
  { haut: 'Heures', bas: 'Distance en km', facteurs: [30, 40, 50, 60, 80, 90] },
  { haut: 'Personnes', bas: 'Farine en g', facteurs: [50, 75, 100, 150, 200] },
];

const tableauDeProportionnaliteBrique = forme('tableau-proportionnalite', 9, (rng) => {
  const g = rngPick(rng, GRANDEURS_PROPORTIONNELLES);
  const facteur = rngPick(rng, g.facteurs);
  const haut = rngShuffle(rng, [1, 2, 3, 4, 5, 6, 8, 10, 12]).slice(0, 3);
  const bas = haut.map((valeur) => valeur * facteur);
  const colonne = rngInt(rng, 0, 2);
  const dansLeBas = rng() < 0.65;
  const reponse = dansLeBas ? bas[colonne] : haut[colonne];
  const connu = haut.findIndex((_, index) => index !== colonne);
  const lignes: [string, (number | null)[]][] = [
    [g.haut, haut.map((valeur, index) => (!dansLeBas && index === colonne ? null : valeur))],
    [g.bas, bas.map((valeur, index) => (dansLeBas && index === colonne ? null : valeur))],
  ];
  const autresCases = (dansLeBas ? bas : haut).filter((_, index) => index !== colonne).reduce((somme, valeur) => somme + valeur, 0);
  return {
    detail: `${g.haut}-${haut.join('.')}-${facteur}-${colonne}-${dansLeBas}`,
    instruction: INSTRUCTION_DONNEES,
    prompt: "Ce tableau est un tableau de proportionnalité. Quel nombre remplace le point d'interrogation ?",
    figure: tableauDeProportionnalite(lignes),
    correct: String(reponse),
    // Le raisonnement additif (même écart que dans une autre colonne), la somme des deux autres cases, une fois de trop ou de moins.
    wrong: fauxEntiers(reponse, [
      dansLeBas ? bas[connu] + (haut[colonne] - haut[connu]) : haut[connu] + (bas[colonne] - bas[connu]),
      autresCases,
      dansLeBas ? haut[colonne] + facteur : bas[colonne] + facteur,
      facteur,
      reponse + facteur,
      reponse - facteur,
      reponse + 1,
      reponse - 1,
    ]),
    explanation: dansLeBas ? `On multiplie par ${facteur} : ${haut[colonne]} × ${facteur} = ${reponse}.` : `On divise par ${facteur} : ${bas[colonne]} ÷ ${facteur} = ${reponse}.`,
  };
});

const vitesse = forme('vitesse', 9, (rng) => {
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const [v, t] = [rngPick(rng, [30, 40, 50, 60, 80, 90, 100, 120]), rngInt(rng, 2, 5)];
    const d = v * t;
    return {
      instruction: INSTRUCTION,
      prompt: `Une voiture roule à ${v} km/h pendant ${t} h. Quelle distance parcourt-elle ?`,
      correct: `${d} km`,
      // Les deux nombres additionnés, une heure de trop ou de moins.
      wrong: fauxEntiers(d, [v + t, v * (t + 1), v * (t - 1), d + 10, d - 10, d * 10, v], 'km'),
      explanation: `En 1 h : ${v} km. En ${t} h : ${t} × ${v} = ${d} km.`,
    };
  }
  if (variante === 1) {
    const [v, t] = [rngPick(rng, [40, 50, 60, 80, 90]), rngInt(rng, 2, 6)];
    const d = v * t;
    return {
      instruction: INSTRUCTION,
      prompt: `Un train roule à ${v} km/h. Combien de temps met-il pour parcourir ${d} km ?`,
      correct: `${t} h`,
      wrong: fauxEntiers(t, [d - v, d + v, t + 1, t - 1, t + 2, v, Math.floor(d / 10)], 'h'),
      explanation: `${t} × ${v} = ${d}, donc il met ${t} h.`,
    };
  }
  const v = rngPick(rng, [12, 16, 20, 24, 30, 36, 40, 60]);
  const d = v / 2;
  return {
    instruction: INSTRUCTION,
    prompt: `Un cycliste roule à ${v} km/h. Quelle distance parcourt-il en 30 min ?`,
    correct: `${d} km`,
    wrong: fauxEntiers(d, [v * 30, v + 30, v, v * 2, d + 2, d - 2, d + 5, Math.floor(v / 3)], 'km'),
    explanation: `30 min, c'est la moitié d'une heure : ${v} ÷ 2 = ${d} km.`,
  };
});

const echelle = forme('echelle', 9, (rng) => {
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const [k, x] = [rngPick(rng, [2, 5, 10, 20, 50]), rngInt(rng, 3, 15)];
    return {
      instruction: INSTRUCTION,
      prompt: `Sur une carte, 1 cm représente ${k} km. Deux villes sont à ${x} cm sur la carte. Quelle est la distance réelle ?`,
      correct: `${k * x} km`,
      // L'addition au lieu de la multiplication, une conversion de trop.
      wrong: fauxEntiers(k * x, [k + x, k * x * 10, k * x + k, k * x - k, k * x + 10, k * x - 10, x], 'km'),
      explanation: `1 cm pour ${k} km : ${x} × ${k} = ${k * x} km.`,
    };
  }
  if (variante === 1) {
    const [k, x] = [rngPick(rng, [2, 5, 10, 20, 50]), rngInt(rng, 3, 12)];
    return {
      instruction: INSTRUCTION,
      prompt: `Sur une carte, 1 cm représente ${k} km. Deux villes sont distantes de ${k * x} km. Quelle est leur distance sur la carte ?`,
      correct: `${x} cm`,
      wrong: fauxEntiers(x, [k * x - k, k * x + k, k * x, x + 1, x - 1, k, x + 2], 'cm'),
      explanation: `${k * x} ÷ ${k} = ${x}, donc ${x} cm sur la carte.`,
    };
  }
  const [k, x] = [rngPick(rng, [2, 3, 4, 5]), rngInt(rng, 3, 9)];
  return {
    instruction: INSTRUCTION,
    prompt: `Sur le plan d'une maison, 1 cm représente ${k} m. Une pièce mesure ${x} cm sur le plan. Quelle est sa longueur réelle ?`,
    correct: `${k * x} m`,
    wrong: fauxEntiers(k * x, [k + x, k * x * 10, k * x + k, k * x - k, k * x + 1, k * x - 1, x], 'm'),
    explanation: `1 cm pour ${k} m : ${x} × ${k} = ${k * x} m.`,
  };
});

const chances = (a: number, b: number) => `${a} ${a === 1 ? 'chance' : 'chances'} sur ${b}`;

/** Des « a chances sur b » faux : jamais un qui vaille la même probabilité que le bon (1 sur 2 vaut 2 sur 4). */
function chancesAuChoix(correct: [number, number], candidats: [number, number][]): string[] {
  return candidats.filter(([a, b]) => a > 0 && b > 0 && a <= b && a * correct[1] !== correct[0] * b).map(([a, b]) => chances(a, b));
}

const probabiliteChances = forme('probabilite-chances', 9, (rng) => {
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    // Deux effectifs différents : avec autant de billes de chaque couleur, « 1 chance sur 2 » aurait trop peu d'erreurs possibles.
    const a = rngInt(rng, 1, 6);
    const b = rngPick(rng, [1, 2, 3, 4, 5, 6, 7].filter((candidat) => candidat !== a));
    const [couleur, autre] = rngPick(rng, [['rouge', 'bleue'], ['verte', 'jaune'], ['noire', 'blanche']]);
    const total = a + b;
    const accord = (n: number) => (n === 1 ? '' : 's');
    return {
      instruction: INSTRUCTION,
      prompt: `Un sac contient ${a} ${a === 1 ? 'bille' : 'billes'} ${couleur}${accord(a)} et ${b} ${b === 1 ? 'bille' : 'billes'} ${autre}${accord(b)}. On tire une bille au hasard. Combien de chances a-t-on de tirer une bille ${couleur} ?`,
      correct: chances(a, total),
      // Les billes de l'autre couleur, une seule bille parmi toutes, le rapport des deux couleurs.
      wrong: chancesAuChoix([a, total], [[b, total], [a, b], [1, total], [1, a], [total - 1, total], [a, total + 1], [a + 1, total], [a, total + 2]]),
      explanation: `Il y a ${total} billes, dont ${a} ${couleur}${accord(a)} : ${chances(a, total)}.`,
    };
  }
  if (variante === 1) {
    const [evenement, favorables] = rngPick(rng, [
      ['un nombre pair', 3],
      ['un nombre impair', 3],
      ['un nombre supérieur à 4', 2],
      ['un multiple de 3', 2],
      ['le nombre 6', 1],
      ['un nombre inférieur à 3', 2],
      ['un nombre plus grand que 2', 4],
      ['un nombre plus petit que 5', 4],
    ] as [string, number][]);
    return {
      instruction: INSTRUCTION,
      prompt: `On lance un dé à 6 faces. Combien de chances a-t-on d'obtenir ${evenement} ?`,
      correct: chances(favorables, 6),
      wrong: chancesAuChoix([favorables, 6], [[6 - favorables, 6], [favorables, 3], [1, 6], [1, favorables], [favorables, 5], [favorables + 1, 6], [favorables, 4], [favorables + 2, 6]]),
      explanation: `Un dé a 6 faces. ${favorables} ${favorables === 1 ? 'face convient' : 'faces conviennent'} : ${chances(favorables, 6)}.`,
    };
  }
  const total = rngPick(rng, [5, 6, 8, 10]);
  const rouges = rngInt(rng, 1, total - 3);
  const bleus = rngInt(rng, 1, total - rouges - 1);
  const verts = total - rouges - bleus;
  const accord = (n: number) => (n === 1 ? '' : 's');
  return {
    instruction: INSTRUCTION,
    prompt: `Une roue a ${total} secteurs égaux : ${rouges} rouge${accord(rouges)}, ${bleus} bleu${accord(bleus)} et ${verts} vert${accord(verts)}. On la fait tourner. Combien de chances a-t-on de s'arrêter sur le bleu ?`,
    correct: chances(bleus, total),
    wrong: chancesAuChoix([bleus, total], [[rouges, total], [verts, total], [bleus, total - bleus], [1, total], [1, bleus], [total - bleus, total]]),
    explanation: `${total} secteurs égaux, dont ${bleus} bleu${accord(bleus)} : ${chances(bleus, total)}.`,
  };
});

const VOCABULAIRE_PROBABILITE = ['impossible', 'improbable', 'probable', 'certain'];

const probabiliteVocabulaire = forme('probabilite-vocabulaire', 9, (rng) => {
  const variante = rngInt(rng, 0, 4);
  let enonce: string;
  let correct: string;
  if (variante === 0) {
    enonce = `Un sac contient ${rngInt(rng, 5, 12)} billes rouges. On tire une bille au hasard. Quel mot décrit l'événement « tirer une bille rouge » ?`;
    correct = 'certain';
  } else if (variante === 1) {
    enonce = `Un sac contient ${rngInt(rng, 5, 12)} billes rouges. On tire une bille au hasard. Quel mot décrit l'événement « tirer une bille bleue » ?`;
    correct = 'impossible';
  } else if (variante === 2) {
    enonce = `Un sac contient 1 bille rouge et ${rngPick(rng, [9, 11, 14, 19])} billes bleues. On tire une bille au hasard. Quel mot décrit l'événement « tirer la bille rouge » ?`;
    correct = 'improbable';
  } else if (variante === 3) {
    enonce = `Un sac contient ${rngPick(rng, [9, 11, 14, 19])} billes rouges et 1 bille bleue. On tire une bille au hasard. Quel mot décrit l'événement « tirer une bille rouge » ?`;
    correct = 'probable';
  } else {
    [enonce, correct] = rngPick(rng, [
      ["On lance un dé à 6 faces. Quel mot décrit l'événement « obtenir un 7 » ?", 'impossible'],
      ["On lance un dé à 6 faces. Quel mot décrit l'événement « obtenir un nombre inférieur à 7 » ?", 'certain'],
      ["On lance un dé à 6 faces. Quel mot décrit l'événement « obtenir un 0 » ?", 'impossible'],
      ["On lance un dé à 6 faces. Quel mot décrit l'événement « obtenir un nombre entre 1 et 6 » ?", 'certain'],
    ] as [string, string][]);
  }
  return {
    instruction: INSTRUCTION,
    prompt: enonce,
    correct,
    wrong: VOCABULAIRE_PROBABILITE.filter((mot) => mot !== correct),
    explanation:
      correct === 'certain'
        ? 'Il arrive à coup sûr : il est certain.'
        : correct === 'impossible'
          ? 'Il ne peut pas arriver : il est impossible.'
          : correct === 'probable'
            ? 'Il a presque toutes les chances d\'arriver : il est probable.'
            : 'Il a très peu de chances d\'arriver : il est improbable.',
  };
});

const programmeDeCalcul = forme('programme-de-calcul', 9, (rng) => {
  const [k, b, x] = [rngInt(rng, 2, 9), rngInt(rng, 2, 15), rngInt(rng, 2, 12)];
  // 0 : multiplie par k, puis ajoute b ; 1 : ajoute b, puis multiplie par k ; 2 : multiplie par k, puis retire b.
  const modele = rngInt(rng, 0, 2);
  const etapes = [`multiplie-le par ${k}, puis ajoute ${b}`, `ajoute ${b}, puis multiplie le résultat par ${k}`, `multiplie-le par ${k}, puis retire ${b}`][modele];
  const calcule = (n: number) => (modele === 0 ? n * k + b : modele === 1 ? (n + b) * k : n * k - b);
  // Le modèle 2 retire b : le nombre de départ reste assez grand pour que le résultat soit positif.
  const depart = modele === 2 ? Math.max(x, Math.ceil(b / k) + 1) : x;
  const resultat = calcule(depart);
  const ordreInverse = modele === 0 ? (depart + b) * k : modele === 1 ? depart * k + b : (depart - b) * k;
  if (rng() < 0.65) {
    return {
      instruction: INSTRUCTION,
      prompt: `Voici un programme de calcul : choisis un nombre, ${etapes}. Quel résultat obtient-on avec ${depart} ?`,
      correct: String(resultat),
      // Les étapes dans l'autre ordre, une étape oubliée, l'autre opération.
      wrong: fauxEntiers(resultat, [ordreInverse, depart * k, depart + b, depart * k - b, depart * k + b + 1, resultat + 10, resultat - 10]),
      explanation:
        modele === 0
          ? `${depart} × ${k} = ${depart * k}, puis ${depart * k} + ${b} = ${resultat}.`
          : modele === 1
            ? `${depart} + ${b} = ${depart + b}, puis ${depart + b} × ${k} = ${resultat}.`
            : `${depart} × ${k} = ${depart * k}, puis ${depart * k} − ${b} = ${resultat}.`,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `Voici un programme de calcul : choisis un nombre, ${etapes}. On obtient ${resultat}. Quel nombre a été choisi ?`,
    correct: String(depart),
    // Le programme refait sur le résultat, une seule des deux étapes défaite.
    wrong: fauxEntiers(depart, [calcule(resultat), resultat - b, resultat + b, resultat / k, depart + 1, depart - 1, depart + 10]),
    explanation:
      modele === 0
        ? `${resultat} − ${b} = ${resultat - b}, puis ${resultat - b} ÷ ${k} = ${depart}.`
        : modele === 1
          ? `${resultat} ÷ ${k} = ${resultat / k}, puis ${resultat / k} − ${b} = ${depart}.`
          : `${resultat} + ${b} = ${resultat + b}, puis ${resultat + b} ÷ ${k} = ${depart}.`,
  };
});

const balance = forme('balance', 9, (rng) => {
  const [n, masse, ajout] = [rngInt(rng, 2, 5), rngPick(rng, [50, 100, 150, 200, 250, 300]), rngPick(rng, [50, 100, 150, 200, 250])];
  const total = n * masse + ajout;
  return {
    instruction: INSTRUCTION,
    prompt: `Une balance est en équilibre. Sur un plateau, il y a ${n} sacs identiques et une masse de ${ajout} g. Sur l'autre, il y a une masse de ${total} g. Quelle est la masse d'un sac ?`,
    correct: `${masse} g`,
    // On oublie de partager, on partage avant de retirer, on ajoute.
    wrong: fauxEntiers(masse, [total - ajout, total / n, total + ajout, ajout, masse + 50, masse - 50, total / (n + 1)], 'g'),
    explanation: `${total} − ${ajout} = ${n * masse}, puis ${n * masse} ÷ ${n} = ${masse}.`,
  };
});

const motifEvolutif = forme('motif', 9, (rng) => {
  const [premier, pas] = [rngInt(rng, 3, 9), rngInt(rng, 2, 6)];
  const rang = rngInt(rng, 6, 12);
  const reponse = premier + pas * (rang - 1);
  const objet = rngPick(rng, ['allumettes', 'carreaux', 'jetons', 'bâtons']);
  const decrit = rng() < 0.5;
  return {
    instruction: INSTRUCTION,
    prompt: decrit
      ? `Le motif 1 est fait de ${premier} ${objet}. À chaque motif, on ajoute ${pas} ${objet}. Combien ${de(objet)} y a-t-il dans le motif ${rang} ?`
      : `Le motif 1 a ${premier} ${objet}, le motif 2 en a ${premier + pas} et le motif 3 en a ${premier + 2 * pas}. On continue de la même façon. Combien ${de(objet)} a le motif ${rang} ?`,
    correct: String(reponse),
    // Le motif 1 oublié, une étape de trop, la proportionnalité à tort.
    wrong: fauxEntiers(reponse, [pas * rang, premier + pas * rang, premier * rang, reponse + pas, reponse - pas, premier + pas * (rang - 2)]),
    explanation: `On ajoute ${pas}, ${rang - 1} fois : ${premier} + ${rang - 1} × ${pas} = ${reponse}.`,
  };
});

const volumeParDenombrement = forme('volume-cubes', 9, (rng) => {
  const [longueur, largeur, hauteur] = [rngInt(rng, 2, 6), rngInt(rng, 2, 5), rngInt(rng, 2, 4)];
  const v = longueur * largeur * hauteur;
  const parCouche = longueur * largeur;
  return {
    instruction: INSTRUCTION,
    prompt: rng() < 0.5
      ? `Un pavé est fait de cubes de 1 cm³. Il a ${hauteur} couches de ${parCouche} cubes. Quel est son volume ?`
      : `Un pavé est fait de cubes de 1 cm³ : ${longueur} cubes de long, ${largeur} de large et ${hauteur} de haut. Quel est son volume ?`,
    correct: `${v} cm³`,
    // Une couche seulement, les nombres additionnés, la mauvaise unité (cm ou cm²).
    wrong: [`${parCouche} cm³`, `${longueur + largeur + hauteur} cm³`, `${v} cm²`, `${v} cm`, `${v + parCouche} cm³`, `${2 * (parCouche + longueur * hauteur + largeur * hauteur)} cm³`].filter((texte) => texte !== `${v} cm³`),
    explanation: `${parCouche} cubes par couche : ${hauteur} × ${parCouche} = ${v} cubes, donc ${v} cm³.`,
  };
});

const fractionsDeDenominateursMultiples = forme('fractions-multiples', 9, (rng) => {
  const [premier, second] = deuxPrenoms(rng);
  const partage = rngPick(rng, PARTAGES);
  const nom = partage.replace(/^une /, 'la ');
  // Le second dénominateur est un multiple du premier : 1/2 et 1/4, 1/3 et 1/6, 2/5 et 3/10.
  const [d1, k] = rngPick(rng, [[2, 2], [2, 3], [2, 4], [3, 2], [4, 2], [5, 2]] as [number, number][]);
  const d2 = d1 * k;
  const n1 = rngInt(rng, 1, d1 - 1);
  if (rng() < 0.6) {
    const n2 = rngInt(rng, 1, d2 - n1 * k - 1);
    const somme = n1 * k + n2;
    return {
      instruction: INSTRUCTION,
      prompt: `${premier.nom} mange ${fraction(n1, d1)} d'${partage}. ${second.nom} en mange ${fraction(n2, d2)}. Quelle fraction de ${nom} ont-ils mangée ?`,
      correct: fraction(somme, d2),
      // Les numérateurs et les dénominateurs additionnés, le premier dénominateur gardé.
      wrong: fractionsAuChoix([somme, d2], [[n1 + n2, d1 + d2], [n1 + n2, d2], [n1 + n2, d1], [somme, d1], [somme + 1, d2], [d2 - somme, d2]]),
      explanation: `${fraction(n1, d1)} = ${fraction(n1 * k, d2)}, puis ${n1 * k} + ${n2} = ${somme} : ${fraction(somme, d2)}.`,
    };
  }
  const restait = n1 * k + rngInt(rng, 1, d2 - n1 * k - 1);
  const reste = restait - n1 * k;
  return {
    instruction: INSTRUCTION,
    prompt: `Il restait ${fraction(restait, d2)} d'${partage}. ${premier.nom} en mange ${fraction(n1, d1)}. Quelle fraction de ${nom} reste-t-il ?`,
    correct: fraction(reste, d2),
    wrong: fractionsAuChoix([reste, d2], [[restait - n1, d2], [restait - n1, d1], [restait - n1, d2 - d1], [restait + n1 * k, d2], [reste, d1], [reste + 1, d2]]),
    explanation: `${fraction(n1, d1)} = ${fraction(n1 * k, d2)}, puis ${restait} − ${n1 * k} = ${reste} : ${fraction(reste, d2)}.`,
  };
});

export const BRIQUES_SIXIEME: Brique[] = [
  // 1er trimestre
  decimauxAdditif,
  decimauxSoustractif,
  decimauxFoisEntier,
  renduDecimal,
  deuxEtapesEntiers,
  divisionPartage,
  inconnu,
  horaires,
  perimetre,
  donnees('tableau-6e', 7, 'tableau'),
  donnees('diagramme-6e', 7, 'barres'),
  // 2e trimestre
  divisionEuclidienne,
  fractionDeQuantite,
  resteApresUneFraction,
  fractionsSomme,
  pourcentage('pourcentage-simple', 8, [10, 25, 50, 75]),
  produitDeDecimaux,
  aireDuRectangle,
  aireEtConversion,
  horairesEnPlusieursEtapes,
  tableauADoubleEntreeBrique,
  // 3e trimestre
  divisionDecimale,
  passageALUnite,
  recette,
  tableauDeProportionnaliteBrique,
  vitesse,
  echelle,
  probabiliteChances,
  probabiliteVocabulaire,
  programmeDeCalcul,
  balance,
  motifEvolutif,
  volumeParDenombrement,
  pourcentage('pourcentage-autres', 9, [20, 5, 1]),
  fractionsDeDenominateursMultiples,
];

/** Le nombre de sortes de problèmes enseignées à cette étape de la 6e. */
export function sortesDeProblemesSixieme(trimester: Trimester): number {
  const stage = stageOf('6e', trimester);
  return BRIQUES_SIXIEME.filter((brique) => brique.minStage <= stage).length;
}

/** Les problèmes de la 6e. */
export function genererSixieme(trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('problemes', BRIQUES_SIXIEME, stageOf('6e', trimester), rng, count);
}
