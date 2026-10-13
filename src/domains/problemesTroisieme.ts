import { rngInt, rngPick } from '../lib/seededRandom';
import { droiteDuRepere, repere } from './figuresCycle4';
import { pronom, PRENOMS, type Brique } from './mathsCommun';
import { brique, entre, fauxEcrits, MOINS, nb, pgcd, ppcm, puissance, rat, somme, sup, terme, texteRat, type Rat } from './mathsCycle4';
import { ecritureChiffree } from './nombresEnLettres';
import { dureeEcrite, ecritFraction, fauxAvecUnite, fractionsAuChoix, INSTRUCTION, INSTRUCTION_DONNEES } from './problemesCollege';

/**
 * Les problèmes de la 3e (ancien programme de cycle 4, BO n° 31 du 30 juillet
 * 2020, repères annuels de 2019) : la fin du cycle, où l'on attend toutes les
 * notions du programme.
 *
 * - 1er trimestre : le PGCD dans une situation, les puissances de 10 et la
 *   notation scientifique, la racine carrée d'une aire ;
 * - 2e trimestre : image et antécédent d'une fonction, lecture du graphique
 *   d'une fonction affine, les systèmes de deux équations, les inéquations,
 *   les débits et la masse volumique ;
 * - 3e trimestre : l'effet d'un agrandissement ou d'une réduction sur les
 *   longueurs, les aires et les volumes, la médiane et l'étendue, les
 *   probabilités à deux épreuves, les évolutions successives en pourcentage.
 *
 * Hors programme, donc absent : les quartiles, les vecteurs, le second degré,
 * la dérivation, les statistiques à deux variables.
 */

// === 1er trimestre (étape 16) ======================================================================================

/** Un entier multiple de 10^exposant écrit à la française, sans erreur d'arrondi : (15, −1) → « 1,5 », (5, 2) → « 500 ». */
export function decimalExact(mantisse: number, exposant: number): string {
  const chiffres = String(Math.abs(mantisse));
  let entier: string;
  let fraction = '';
  if (exposant >= 0) {
    entier = chiffres + '0'.repeat(exposant);
  } else {
    const rempli = chiffres.padStart(-exposant + 1, '0');
    entier = rempli.slice(0, rempli.length + exposant);
    fraction = rempli.slice(rempli.length + exposant).replace(/0+$/, '');
  }
  return `${mantisse < 0 ? MOINS : ''}${ecritureChiffree(Number(entier))}${fraction ? `,${fraction}` : ''}`;
}

/** Le plus petit diviseur premier d'un entier. */
function plusPetitDiviseur(n: number): number {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return d;
  return n;
}

const pgcdContexte = brique('pgcd-contexte', 16, (rng) => {
  for (;;) {
    const g = rngInt(rng, 3, 36);
    const [p, q] = [rngInt(rng, 2, 14), rngInt(rng, 2, 14)];
    if (p === q || pgcd(p, q) !== 1 || g * p > 480 || g * q > 480 || g * p < 24 || g * q < 24) continue;
    const [a, b] = rng() < 0.5 ? [g * p, g * q] : [g * q, g * p];
    const contexte = rngInt(rng, 0, 3);
    const prompts = [
      `Une fleuriste a ${a} roses et ${b} tulipes. Elle veut composer le plus grand nombre possible de bouquets identiques, en utilisant toutes les fleurs. Combien de bouquets peut-elle faire ?`,
      `Un sol rectangulaire mesure ${a} cm sur ${b} cm. On veut le recouvrir de carreaux carrés identiques, sans aucune découpe. Quelle est la plus grande longueur possible du côté d'un carreau, en centimètres ?`,
      `Pour une fête, on prépare ${a} bonbons et ${b} chocolats. On veut faire le plus grand nombre possible de sachets identiques, sans rien laisser. Combien de sachets peut-on faire ?`,
      `Une école organise une sortie pour ${a} filles et ${b} garçons. Chaque groupe doit avoir le même nombre de filles et le même nombre de garçons, et tous les élèves doivent être dans un groupe. Quel est le plus grand nombre de groupes possible ?`,
    ];
    const unite = contexte === 1 ? 'cm' : '';
    const ecrire = (valeur: number) => (unite ? `${valeur} ${unite}` : String(valeur));
    const premier = plusPetitDiviseur(g);
    return {
      instruction: INSTRUCTION,
      prompt: prompts[contexte],
      correct: ecrire(g),
      // Le plus petit multiple commun, le plus petit des deux nombres, leur différence, un diviseur commun qui n'est pas le plus grand.
      wrong: [ppcm(a, b), Math.min(a, b), Math.abs(a - b), g / premier, g * 2, a + b].filter((valeur) => valeur !== g && valeur > 0).map(ecrire),
      explanation: `${a} = ${g} × ${a / g} et ${b} = ${g} × ${b / g}. Le plus grand diviseur commun de ${a} et ${b} est ${g}, car ${a / g} et ${b / g} n'ont que 1 comme diviseur commun.`,
    };
  }
});

// --- Les puissances de 10 ----------------------------------------------------------------------------------------------

const MANTISSES = [1.5, 2, 2.4, 3, 4, 4.5, 5, 6, 7.5, 8];

/** « 1,5 × 10⁸ » : un nombre en notation scientifique. */
const scientifique = (mantisse: number, exposant: number) => `${nb(mantisse)} × ${puissance(10, exposant)}`;

const puissancesDeDixContexte = brique('puissances-de-dix-contexte', 16, (rng) => {
  const variante = rngInt(rng, 0, 3);
  if (variante === 0 || variante === 3) {
    // Un quotient m/n × 10^(a−b) : le résultat q × 10^(a−b) est un entier, la mantisse de départ est m = q × n.
    for (;;) {
      const n = rngPick(rng, [2, 3, 4, 5]);
      const q = rngPick(rng, [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]);
      const m = q * n;
      if (m >= 10) continue;
      const [a, b] = variante === 0 ? [rngInt(rng, 7, 9), rngInt(rng, 3, 5)] : [rngInt(rng, 11, 13), rngInt(rng, 8, 10)];
      const q10 = Math.round(q * 10);
      const exposantDuResultat = a - b - 1;
      const juste = decimalExact(q10, exposantDuResultat);
      const prompt =
        variante === 0
          ? `Une sonde spatiale se déplace à ${scientifique(n, b)} km/h. Elle doit parcourir ${scientifique(m, a)} km. Combien d'heures dure le trajet ?`
          : `Un disque dur peut stocker ${scientifique(m, a)} octets. Un film occupe ${scientifique(n, b)} octets. Combien de films peut-on stocker, au maximum ?`;
      const unite = variante === 0 ? 'h' : '';
      const ecrire = (texte: string) => (unite ? `${texte} ${unite}` : texte);
      return {
        instruction: INSTRUCTION,
        prompt,
        correct: ecrire(juste),
        // Une erreur sur l'exposant : un rang de trop ou de moins, deux rangs.
        wrong: [decimalExact(q10, exposantDuResultat + 1), decimalExact(q10, exposantDuResultat - 1), decimalExact(q10, exposantDuResultat + 2), decimalExact(q10, exposantDuResultat - 2), decimalExact(q10, exposantDuResultat + 3)].filter((texte) => texte !== juste).map(ecrire),
        explanation: `${nb(m)} ÷ ${n} = ${nb(q)} et ${puissance(10, a)} ÷ ${puissance(10, b)} = ${puissance(10, a - b)}. Le résultat est ${nb(q)} × ${puissance(10, a - b)} = ${juste}.`,
      };
    }
  }
  if (variante === 1) {
    const m = rngPick(rng, MANTISSES);
    const e = rngPick(rng, [-5, -6, -7, -8]);
    const [cible, unite] = rngPick(rng, [[-9, 'nm'], [-3, 'mm']] as [number, string][]);
    const m10 = Math.round(m * 10);
    const exposant = e - cible - 1;
    const juste = decimalExact(m10, exposant);
    const nom = rngPick(rng, ['Un virus', 'Une bactérie', 'Un grain de pollen', 'Un globule rouge']);
    return {
      instruction: INSTRUCTION,
      prompt: `${nom} mesure ${scientifique(m, e)} m. Quelle est sa taille en ${unite === 'nm' ? 'nanomètres' : 'millimètres'} ? On rappelle que 1 ${unite} = ${puissance(10, cible)} m.`,
      correct: `${juste} ${unite}`,
      // L'exposant mal calculé : un rang de trop ou de moins, ou le signe de l'exposant oublié.
      wrong: [decimalExact(m10, exposant + 1), decimalExact(m10, exposant - 1), decimalExact(m10, exposant + 2), decimalExact(m10, exposant - 2), decimalExact(m10, exposant + 3)].filter((texte) => texte !== juste).map((texte) => `${texte} ${unite}`),
      explanation: `${scientifique(m, e)} ÷ ${puissance(10, cible)} = ${nb(m)} × ${puissance(10, e - cible)} = ${juste} ${unite}.`,
    };
  }
  // Un produit : m × n × 10^(e + f).
  const m = rngPick(rng, [2, 2.5, 4, 5, 8]);
  const n = rngPick(rng, [2, 4, 5, 8]);
  const [e, f] = [rngPick(rng, [-5, -4, -3]), rngPick(rng, [5, 6, 7])];
  const produit10 = Math.round(m * n * 10);
  const exposant = e + f - 1;
  const juste = decimalExact(produit10, exposant);
  return {
    instruction: INSTRUCTION,
    prompt: `Un grain de sable pèse ${scientifique(m, e)} kg. Quelle est la masse de ${scientifique(n, f)} grains de sable, en kilogrammes ?`,
    correct: `${juste} kg`,
    wrong: [decimalExact(produit10, exposant + 1), decimalExact(produit10, exposant - 1), decimalExact(produit10, exposant + 2), decimalExact(produit10, exposant - 2), decimalExact(produit10, f - e - 1)].filter((texte) => texte !== juste).map((texte) => `${texte} kg`),
    explanation: `${nb(m)} × ${nb(n)} = ${nb(m * n)} et ${puissance(10, e)} × ${puissance(10, f)} = ${puissance(10, e + f)}. Donc ${nb(m * n)} × ${puissance(10, e + f)} = ${juste} kg.`,
  };
});

// --- La racine carrée d'une aire --------------------------------------------------------------------------------------------

const carreAireRacine = brique('carre-aire-racine', 16, (rng) => {
  const a = rngInt(rng, 2, 13);
  const aire = a * a;
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const unite = rngPick(rng, ['cm', 'm']);
    return {
      instruction: INSTRUCTION,
      prompt: `L'aire d'un carré est de ${aire} ${unite}². Quelle est la longueur de son côté ?`,
      correct: `${a} ${unite}`,
      // La moitié, le quart, le carré de l'aire, la racine prise pour l'aire divisée par quatre.
      wrong: fauxAvecUnite(a, [aire / 2, aire / 4, aire, 4 * a, a + 1, a - 1, aire - a], unite, { min: 1, decimales: 1 }),
      explanation: `Le côté c vérifie c² = ${aire}, donc c = √${aire} = ${a} ${unite}.`,
    };
  }
  if (variante === 1) {
    return {
      instruction: INSTRUCTION,
      prompt: `L'aire d'un carré est de ${aire} cm². Quel est son périmètre ?`,
      correct: `${4 * a} cm`,
      // Le côté seul, le quadruple de l'aire, l'aire divisée par quatre.
      wrong: fauxAvecUnite(4 * a, [a, 4 * aire, aire / 4, 2 * a, aire, 4 * a + 4, 4 * a - 4], 'cm', { min: 1, decimales: 1 }),
      explanation: `Le côté vaut √${aire} = ${a} cm. Le périmètre est 4 × ${a} = ${4 * a} cm.`,
    };
  }
  const prix = rngPick(rng, [3, 4, 5, 6, 8, 10, 12]);
  return {
    instruction: INSTRUCTION,
    prompt: `Un jardin carré a une aire de ${aire} m². On veut l'entourer d'une clôture qui coûte ${prix} € le mètre. Quel est le prix de la clôture ?`,
    correct: `${4 * a * prix} €`,
    // Le prix pour un seul côté, l'aire multipliée par le prix, un périmètre calculé avec l'aire.
    wrong: fauxAvecUnite(4 * a * prix, [a * prix, aire * prix, 4 * aire * prix, 2 * a * prix, 4 * a + prix, 4 * a * prix + prix, 4 * a * prix - prix], '€', { min: 1 }),
    explanation: `Le côté vaut √${aire} = ${a} m. Le périmètre est 4 × ${a} = ${4 * a} m, soit ${4 * a} × ${prix} = ${4 * a * prix} €.`,
  };
});

export const BRIQUES_TROISIEME_T1 = [pgcdContexte, puissancesDeDixContexte, carreAireRacine];

// === 2e trimestre (étape 17) ======================================================================================

const fonctionImageAntecedent = brique('fonction-image-antecedent', 17, (rng) => {
  const variante = rngInt(rng, 0, 4);
  if (variante <= 1) {
    // f(x) = ax + b, l'image d'un nombre, éventuellement négatif.
    const a = rngPick(rng, [-5, -4, -3, -2, 2, 3, 4, 5, 6]);
    const b = rngPick(rng, [-9, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8, 9]);
    const x = rngPick(rng, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
    const f = a * x + b;
    return {
      instruction: INSTRUCTION,
      prompt: `On considère la fonction f définie par f(x) = ${somme([{ coefficient: a, lettre: 'x' }, { coefficient: b }])}. Quelle est l'image de ${nb(x)} par la fonction f ?`,
      correct: nb(f),
      // Le signe de b changé, le signe du produit perdu, la valeur de x ajoutée au lieu d'être multipliée.
      wrong: fauxEcrits(f, [a * x - b, -a * x + b, a * Math.abs(x) + b, a + b + x, (a + b) * x, f + 1, f - 1, -f], nb, { decimales: 0 }),
      explanation: `On remplace x par ${entre(x)} : f(${nb(x)}) = ${nb(a)} × ${entre(x)} ${b < 0 ? MOINS : '+'} ${nb(Math.abs(b))} = ${nb(f)}.`,
    };
  }
  if (variante === 2) {
    // L'antécédent : f(x) = y donne x = (y − b)/a.
    const a = rngPick(rng, [-4, -3, -2, 2, 3, 4, 5]);
    const b = rngPick(rng, [-8, -6, -5, -3, -2, 1, 2, 4, 5, 7, 9]);
    const x = rngPick(rng, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7]);
    const y = a * x + b;
    return {
      instruction: INSTRUCTION,
      prompt: `On considère la fonction f définie par f(x) = ${somme([{ coefficient: a, lettre: 'x' }, { coefficient: b }])}. Quel est l'antécédent de ${nb(y)} par la fonction f ?`,
      correct: nb(x),
      // L'image calculée à la place de l'antécédent, le signe de b oublié, la division oubliée.
      wrong: fauxEcrits(x, [a * y + b, (y + b) / a, y / a - b, y - b, y / a, -x, x + 1, x - 1], nb, { decimales: 1 }),
      explanation: `On résout ${somme([{ coefficient: a, lettre: 'x' }, { coefficient: b }])} = ${nb(y)} : ${terme(a, 'x')} = ${nb(y)} ${b < 0 ? '+' : MOINS} ${nb(Math.abs(b))} = ${nb(y - b)}, donc x = ${nb(y - b)} ÷ ${entre(a)} = ${nb(x)}.`,
    };
  }
  if (variante === 3) {
    // Une fonction linéaire : f(x) = ax.
    const a = rngPick(rng, [-7, -5, -4, -3, 2, 3, 4, 5, 6, 8]);
    const x = rngPick(rng, [-8, -6, -5, -4, -3, 2, 3, 4, 5, 7]);
    const f = a * x;
    const antecedent = rng() < 0.5;
    return {
      instruction: INSTRUCTION,
      prompt: antecedent
        ? `Une fonction linéaire f est définie par f(x) = ${terme(a, 'x')}. Quel est l'antécédent de ${nb(f)} par f ?`
        : `Une fonction linéaire f est définie par f(x) = ${terme(a, 'x')}. Quelle est l'image de ${nb(x)} par f ?`,
      correct: nb(antecedent ? x : f),
      wrong: antecedent
        ? fauxEcrits(x, [a * f, -x, f / a + 1, f - a, f + a, x + 1, x - 1], nb, { decimales: 1 })
        : fauxEcrits(f, [-f, a + x, a - x, f + a, f - a, f + x, a / x], nb, { decimales: 1 }),
      explanation: antecedent ? `On résout ${terme(a, 'x')} = ${nb(f)} : x = ${nb(f)} ÷ ${entre(a)} = ${nb(x)}.` : `f(${nb(x)}) = ${entre(a)} × ${entre(x)} = ${nb(f)}.`,
    };
  }
  // Une fonction du second degré : seulement des images.
  const [b, c] = [rngPick(rng, [-6, -4, -3, -2, -1, 1, 2, 3, 4, 5]), rngPick(rng, [-8, -5, -3, -2, -1, 1, 2, 3, 4, 6])];
  const x = rngPick(rng, [-5, -4, -3, -2, -1, 2, 3, 4, 5]);
  const f = x * x + b * x + c;
  return {
    instruction: INSTRUCTION,
    prompt: `On considère la fonction f définie par f(x) = ${somme([{ coefficient: 1, lettre: 'x', exposant: 2 }, { coefficient: b, lettre: 'x' }, { coefficient: c }])}. Quelle est l'image de ${nb(x)} par la fonction f ?`,
    correct: nb(f),
    // Le carré d'un nombre négatif pris pour un nombre négatif, le carré pris pour le double, le signe de b changé.
    wrong: fauxEcrits(f, [-x * x + b * x + c, 2 * x + b * x + c, x * x - b * x + c, x * x + b * x - c, f + 1, f - 1, f + 2 * Math.abs(x)], nb, { decimales: 0 }),
    explanation: `f(${nb(x)}) = ${entre(x)}${sup(2)} ${b < 0 ? MOINS : '+'} ${nb(Math.abs(b))} × ${entre(x)} ${c < 0 ? MOINS : '+'} ${nb(Math.abs(c))} = ${nb(x * x)} ${b * x < 0 ? MOINS : '+'} ${nb(Math.abs(b * x))} ${c < 0 ? MOINS : '+'} ${nb(Math.abs(c))} = ${nb(f)}.`,
  };
});

// --- Lire le graphique d'une fonction affine -------------------------------------------------------------------------------------

const X_DU_GRAPHIQUE = { min: -4, max: 4 };
const Y_DU_GRAPHIQUE = { min: -6, max: 6 };

/** Les abscisses entre lesquelles la droite y = ax + b reste dans le cadre du graphique. */
function bornesDeLaDroite(a: number, b: number): [number, number] {
  const aux = [(Y_DU_GRAPHIQUE.min - b) / a, (Y_DU_GRAPHIQUE.max - b) / a].sort((p, q) => p - q);
  return [Math.max(X_DU_GRAPHIQUE.min, aux[0]), Math.min(X_DU_GRAPHIQUE.max, aux[1])];
}

const lectureGraphiqueFonction = brique('lecture-graphique-fonction', 17, (rng) => {
  const a = rngPick(rng, [-3, -2, -1, 1, 2, 3]);
  const b = rngPick(rng, [-3, -2, -1, 1, 2, 3]);
  const [de, jusqua] = bornesDeLaDroite(a, b);
  const figure = repere(
    { ...X_DU_GRAPHIQUE, pas: 1, nom: 'x' },
    { ...Y_DU_GRAPHIQUE, pas: 1, nom: 'y', etiquette: 2 },
    (px, py) => [droiteDuRepere(px, py, a, b, de, jusqua)],
    'Un repère quadrillé avec une droite qui représente une fonction f.'
  );
  const lisibles = Array.from({ length: 9 }, (_, rang) => rang - 4).filter((x) => Math.abs(a * x + b) <= 6);
  const variante = rngInt(rng, 0, 4);
  const detail = `graphique-fonction-${a}-${b}-${variante}`;
  if (variante === 0) {
    const x = rngPick(rng, lisibles.filter((valeur) => valeur !== 0));
    const f = a * x + b;
    return {
      detail: `${detail}-${x}`,
      instruction: INSTRUCTION_DONNEES,
      prompt: `La droite représente une fonction f. Quelle est l'image de ${nb(x)} par f ?`,
      figure,
      correct: nb(f),
      // L'abscisse lue à la place de l'ordonnée, l'opposé, la graduation voisine.
      wrong: fauxEcrits(f, [x, -f, f + 1, f - 1, -x, f + 2, f - 2], nb, { decimales: 0, min: -9, max: 9 }),
      explanation: `On part de ${nb(x)} sur l'axe horizontal, on monte ou on descend jusqu'à la droite, puis on lit l'ordonnée : ${nb(f)}.`,
    };
  }
  if (variante === 1) {
    const x = rngPick(rng, lisibles.filter((valeur) => valeur !== 0));
    const f = a * x + b;
    return {
      detail: `${detail}-${x}`,
      instruction: INSTRUCTION_DONNEES,
      prompt: `La droite représente une fonction f. Quel est l'antécédent de ${nb(f)} par f ?`,
      figure,
      correct: nb(x),
      wrong: fauxEcrits(x, [f, -x, x + 1, x - 1, -f, x + 2, x - 2], nb, { decimales: 0, min: -9, max: 9 }),
      explanation: `On part de ${nb(f)} sur l'axe vertical, on rejoint la droite, puis on lit l'abscisse : ${nb(x)}.`,
    };
  }
  if (variante === 2) {
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `La droite représente une fonction affine f. Quelle est son ordonnée à l'origine ?`,
      figure,
      correct: nb(b),
      // Le coefficient directeur, l'opposé, l'abscisse du point où la droite coupe l'axe horizontal.
      wrong: fauxEcrits(b, [a, -b, -a, b + 1, b - 1, -b / a, b + 2], nb, { decimales: 1, min: -9, max: 9 }),
      explanation: `L'ordonnée à l'origine est l'ordonnée du point où la droite coupe l'axe vertical : ${nb(b)}.`,
    };
  }
  if (variante === 3) {
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `La droite représente une fonction affine f. Quel est son coefficient directeur ?`,
      figure,
      correct: nb(a),
      // L'ordonnée à l'origine, l'opposé, l'inverse pour une pente simple.
      wrong: fauxEcrits(a, [b, -a, -b, a + 1, a - 1, 1 / a, a + 2], nb, { decimales: 1, min: -9, max: 9 }),
      explanation: `Quand on avance de 1 vers la droite, la droite ${a > 0 ? 'monte' : 'descend'} de ${Math.abs(a)} : le coefficient directeur est ${nb(a)}.`,
    };
  }
  const expression = (pente: number, ordonnee: number) => `f(x) = ${somme([{ coefficient: pente, lettre: 'x' }, { coefficient: ordonnee }])}`;
  return {
    detail,
    instruction: INSTRUCTION_DONNEES,
    prompt: `La droite représente une fonction affine f. Laquelle de ces expressions est celle de f ?`,
    figure,
    correct: expression(a, b),
    // Le coefficient et l'ordonnée échangés, un signe changé.
    wrong: [expression(b, a), expression(-a, b), expression(a, -b), expression(-a, -b), expression(a + 1, b)].filter((texte) => texte !== expression(a, b)),
    explanation: `L'ordonnée à l'origine est ${nb(b)} et, quand x augmente de 1, y ${a > 0 ? 'augmente' : 'diminue'} de ${Math.abs(a)} : ${expression(a, b)}.`,
  };
});

// --- Les systèmes -----------------------------------------------------------------------------------------------------------------------

const systemeProbleme = brique('systeme-probleme', 17, (rng) => {
  const variante = rngInt(rng, 0, 2);
  if (variante === 0) {
    const lieu = rngPick(rng, ['au zoo', 'au cinéma', 'au musée', 'au théâtre']);
    for (;;) {
      const enfant = rngInt(rng, 3, 9);
      const adulte = enfant + rngInt(rng, 2, 9);
      const [n1, m1, n2, m2] = [rngInt(rng, 1, 4), rngInt(rng, 1, 5), rngInt(rng, 1, 4), rngInt(rng, 1, 5)];
      if (n1 * m2 - n2 * m1 === 0 || n1 === n2 || m1 === m2) continue;
      const [t1, t2] = [n1 * adulte + m1 * enfant, n2 * adulte + m2 * enfant];
      const question = rngInt(rng, 0, 2);
      const reponse = question === 0 ? enfant : question === 1 ? adulte : adulte + enfant;
      const demande = question === 0 ? "le prix d'un billet enfant" : question === 1 ? "le prix d'un billet adulte" : "le prix d'un billet adulte et d'un billet enfant";
      const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
      return {
        instruction: INSTRUCTION,
        prompt: `${lieu.charAt(0).toUpperCase()}${lieu.slice(1)}, ${pluriel(n1, 'adulte')} et ${pluriel(m1, 'enfant')} paient ${t1} €. ${pluriel(n2, 'adulte')} et ${pluriel(m2, 'enfant')} paient ${t2} €. Quel est ${demande} ?`,
        correct: `${reponse} €`,
        // L'autre prix, la somme moyenne par personne, la différence des totaux.
        wrong: fauxAvecUnite(reponse, [question === 0 ? adulte : enfant, t1 / (n1 + m1), t2 / (n2 + m2), Math.abs(t1 - t2), adulte + enfant + (question === 2 ? 1 : 0), reponse + 1, reponse - 1], '€', { min: 1, decimales: 1 }),
        explanation: `On pose a le prix adulte et e le prix enfant : ${n1}a + ${m1}e = ${t1} et ${n2}a + ${m2}e = ${t2}. On trouve a = ${adulte} et e = ${enfant}.`,
      };
    }
  }
  if (variante === 1) {
    for (;;) {
      const [x, y] = [rngInt(rng, 6, 40), rngInt(rng, 2, 30)];
      if (x <= y) continue;
      const s = x + y;
      const d = x - y;
      const petit = rng() < 0.3;
      return {
        instruction: INSTRUCTION,
        prompt: `La somme de deux nombres est ${s} et leur différence est ${d}. Quel est le ${petit ? 'plus petit' : 'plus grand'} de ces deux nombres ?`,
        correct: String(petit ? y : x),
        wrong: fauxEcrits(petit ? y : x, [petit ? x : y, s / 2, s - d, d / 2, s + d, petit ? y + 1 : x + 1, petit ? y - 1 : x - 1], nb, { min: 1, decimales: 1 }),
        explanation: `Avec x le plus grand et y le plus petit : x + y = ${s} et x − y = ${d}. En additionnant, 2x = ${s + d} donc x = ${x}, puis y = ${y}.`,
      };
    }
  }
  const [poules, lapins] = [rngInt(rng, 4, 20), rngInt(rng, 3, 15)];
  const [tetes, pattes] = [poules + lapins, 2 * poules + 4 * lapins];
  return {
    instruction: INSTRUCTION,
    prompt: `Dans une basse-cour, il y a des poules, qui ont 2 pattes, et des lapins, qui ont 4 pattes. On compte ${tetes} têtes et ${pattes} pattes. Combien y a-t-il de lapins ?`,
    correct: String(lapins),
    // Le nombre de poules, le quart des pattes, la moitié des têtes, la différence oubliée de sa moitié.
    wrong: fauxEcrits(lapins, [poules, pattes / 4, tetes / 2, pattes - 2 * tetes, lapins + 1, lapins - 1, tetes - lapins + 1], nb, { min: 1, decimales: 1 }),
    explanation: `Avec p poules et l lapins : p + l = ${tetes} et 2p + 4l = ${pattes}. Donc 2l = ${pattes} − 2 × ${tetes} = ${pattes - 2 * tetes}, et l = ${lapins}.`,
  };
});

// --- Les inéquations -------------------------------------------------------------------------------------------------------------------------

const inequationProbleme = brique('inequation-probleme', 17, (rng) => {
  const variante = rngInt(rng, 0, 2);
  const personne = rngPick(rng, PRENOMS);
  if (variante === 0) {
    for (;;) {
      const c = rngInt(rng, 4, 15);
      const budget = rngInt(rng, 30, 120);
      if (budget % c === 0) continue;
      const maximum = Math.floor(budget / c);
      return {
        instruction: INSTRUCTION,
        prompt: `${personne.nom} a ${budget} €. Un livre coûte ${c} €. Combien de livres peut-${pronom(personne)} acheter au maximum ?`,
        correct: String(maximum),
        // L'arrondi à l'entier supérieur, un livre de plus ou de moins, le quotient écrit avec une virgule.
        wrong: fauxEcrits(maximum, [maximum + 1, maximum - 1, Math.round(budget / c), budget - c, maximum + 2], nb, { min: 1 }),
        explanation: `On cherche x tel que ${c}x ≤ ${budget}, donc x ≤ ${nb(Math.round((budget / c) * 10) / 10)} environ. Le plus grand entier est ${maximum}.`,
      };
    }
  }
  if (variante === 1) {
    for (;;) {
      const [prise, km, budget] = [rngInt(rng, 2, 6), rngPick(rng, [1, 2, 3]), rngInt(rng, 15, 60)];
      if ((budget - prise) % km === 0) continue;
      const maximum = Math.floor((budget - prise) / km);
      return {
        instruction: INSTRUCTION,
        prompt: `Un taxi facture ${prise} € de prise en charge, puis ${km} € par kilomètre. ${personne.nom} dispose de ${budget} €. Combien de kilomètres entiers peut-${pronom(personne)} parcourir au maximum ?`,
        correct: String(maximum),
        // La prise en charge oubliée, l'arrondi supérieur, la prise en charge ajoutée.
        wrong: fauxEcrits(maximum, [Math.floor(budget / km), maximum + 1, Math.floor((budget + prise) / km), maximum - 1, budget - prise, maximum + 2], nb, { min: 1 }),
        explanation: `On cherche x tel que ${prise} + ${km}x ≤ ${budget}, donc ${km}x ≤ ${budget - prise}, x ≤ ${nb(Math.round(((budget - prise) / km) * 10) / 10)} environ. Le plus grand entier est ${maximum}.`,
      };
    }
  }
  for (;;) {
    const [prix, cout, objectif] = [rngInt(rng, 3, 15), rngInt(rng, 20, 80), rngInt(rng, 100, 400)];
    if ((objectif + cout) % prix === 0) continue;
    const minimum = Math.ceil((objectif + cout) / prix);
    return {
      instruction: INSTRUCTION,
      prompt: `Une association veut gagner au moins ${objectif} €. Elle a dépensé ${cout} € pour fabriquer des calendriers, qu'elle vend ${prix} € chacun. Combien de calendriers doit-elle vendre au minimum ?`,
      correct: String(minimum),
      // L'arrondi à l'entier inférieur, le coût oublié, un calendrier de moins ou de plus.
      wrong: fauxEcrits(minimum, [minimum - 1, Math.ceil(objectif / prix), Math.floor((objectif + cout) / prix) - 1, Math.ceil((objectif - cout) / prix), minimum + 1, minimum + 2], nb, { min: 1 }),
      explanation: `Il faut ${prix}x − ${cout} ≥ ${objectif}, donc ${prix}x ≥ ${objectif + cout}, x ≥ ${nb(Math.round(((objectif + cout) / prix) * 10) / 10)} environ. Le plus petit entier est ${minimum}.`,
    };
  }
});

// --- Débit et masse volumique ----------------------------------------------------------------------------------------------------------------

const debitMasseVolumique = brique('debit-masse-volumique', 17, (rng) => {
  const variante = rngInt(rng, 0, 4);
  if (variante === 0) {
    const [q, k] = [rngPick(rng, [6, 8, 10, 12, 15, 20, 25]), rngInt(rng, 5, 24)];
    const volume = q * k;
    return {
      instruction: INSTRUCTION,
      prompt: `Un robinet a un débit de ${q} L par minute. Combien de temps faut-il pour remplir une cuve de ${volume} L ?`,
      correct: dureeEcrite(k),
      // Les minutes prises pour des heures, un écart de cinq ou de dix minutes, le double.
      wrong: [dureeEcrite(k + 5), dureeEcrite(k * 60), dureeEcrite(Math.max(1, k - 5)), dureeEcrite(k + 10), dureeEcrite(k * 2), dureeEcrite(Math.max(1, k - 10))].filter((texte) => texte !== dureeEcrite(k)),
      explanation: `On divise le volume par le débit : ${volume} ÷ ${q} = ${k} minutes.`,
    };
  }
  if (variante === 1) {
    const [q, t] = [rngPick(rng, [2, 3, 4, 5, 6, 8, 12, 15]), rngInt(rng, 2, 9)];
    return {
      instruction: INSTRUCTION,
      prompt: `Une pompe débite ${q} m³ par heure. Quel volume d'eau pompe-t-elle en ${t} heures ?`,
      correct: `${q * t} m³`,
      wrong: fauxAvecUnite(q * t, [q + t, q / t, t / q, q * t * 60, q * t * 1000, q * t + q, q * t - q], 'm³', { min: 0.1, decimales: 2 }),
      explanation: `Débit × durée : ${q} × ${t} = ${q * t} m³.`,
    };
  }
  if (variante === 2) {
    const q = rngPick(rng, [5, 8, 10, 12, 15, 20, 30]);
    return {
      instruction: INSTRUCTION,
      prompt: `Un débit de ${q} litres par minute correspond à combien de litres par heure ?`,
      correct: `${q * 60} L/h`,
      // La division par 60, un facteur 100, un facteur 24.
      wrong: fauxAvecUnite(q * 60, [q / 60, q * 100, q * 24, q * 3600, q + 60, q * 6, q * 600], 'L/h', { min: 0.01, decimales: 2 }),
      explanation: `Une heure compte 60 minutes : ${q} × 60 = ${q * 60} litres par heure.`,
    };
  }
  if (variante === 3) {
    const [matiere, rho] = rngPick(rng, [['un morceau d\'aluminium', 2.7], ['un lingot de fer', 7.8], ['un bloc de cuivre', 8.9], ['un cube de zinc', 7.1], ['un morceau de plomb', 11.3]] as [string, number][]);
    const volume = rngPick(rng, [10, 20, 25, 40, 50]);
    const masse = Math.round(rho * volume * 10) / 10;
    return {
      instruction: INSTRUCTION,
      prompt: `${matiere.charAt(0).toUpperCase()}${matiere.slice(1)} de ${volume} cm³ a une masse de ${nb(masse)} g. Quelle est sa masse volumique, en g/cm³ ?`,
      correct: `${nb(rho)} g/cm³`,
      // Le quotient à l'envers, le produit, la différence.
      wrong: fauxAvecUnite(rho, [volume / masse, masse * volume, masse - volume, rho * 10, rho / 10, rho + 1, rho - 1], 'g/cm³', { min: 0.01, decimales: 2 }),
      explanation: `La masse volumique est la masse divisée par le volume : ${nb(masse)} ÷ ${volume} = ${nb(rho)} g/cm³.`,
    };
  }
  const [rho, volume] = [rngPick(rng, [2.7, 7.8, 8.9, 1.5, 0.9, 11.3]), rngPick(rng, [10, 20, 30, 40, 50, 100])];
  const masse = Math.round(rho * volume * 10) / 10;
  return {
    instruction: INSTRUCTION,
    prompt: `La masse volumique d'un matériau est de ${nb(rho)} g/cm³. Quelle est la masse de ${volume} cm³ de ce matériau, en grammes ?`,
    correct: `${nb(masse)} g`,
    wrong: fauxAvecUnite(masse, [volume / rho, rho + volume, masse * 10, masse / 10, rho * volume + volume, masse + rho, masse - rho], 'g', { min: 0.1, decimales: 2 }),
    explanation: `Masse = masse volumique × volume : ${nb(rho)} × ${volume} = ${nb(masse)} g.`,
  };
});

export const BRIQUES_TROISIEME_T2 = [fonctionImageAntecedent, lectureGraphiqueFonction, systemeProbleme, inequationProbleme, debitMasseVolumique];

// === 3e trimestre (étape 18) ======================================================================================

const agrandissementReduction = brique('agrandissement-reduction', 18, (rng) => {
  const variante = rngInt(rng, 0, 5);
  const k = rngPick(rng, [2, 3, 4, 5]);
  if (variante <= 1) {
    const exposant = variante === 0 ? 2 : 3;
    const initiale = variante === 0 ? rngInt(rng, 3, 40) : rngInt(rng, 2, 30);
    const unite = exposant === 2 ? 'cm²' : 'cm³';
    const final = initiale * k ** exposant;
    return {
      instruction: INSTRUCTION,
      prompt:
        exposant === 2
          ? `Une figure a une aire de ${initiale} cm². On l'agrandit avec un rapport de ${k}. Quelle est l'aire de la figure agrandie ?`
          : `Un solide a un volume de ${initiale} cm³. On l'agrandit avec un rapport de ${k}. Quel est le volume du solide agrandi ?`,
      correct: `${final} ${unite}`,
      // La multiplication par k seul, par la mauvaise puissance, par k fois l'exposant.
      wrong: fauxAvecUnite(final, [initiale * k, initiale * k ** (exposant === 2 ? 3 : 2), initiale * k * exposant, initiale + k, initiale * k ** (exposant + 1), final + initiale, final - initiale], unite, { min: 1 }),
      explanation: `Les longueurs sont multipliées par ${k}, ${exposant === 2 ? 'les aires' : 'les volumes'} par ${puissance(k, exposant)} = ${k ** exposant} : ${initiale} × ${k ** exposant} = ${final}.`,
    };
  }
  if (variante <= 3) {
    const exposant = variante === 2 ? 2 : 3;
    const final = rngInt(rng, 2, 9);
    const initiale = final * k ** exposant;
    const unite = exposant === 2 ? 'cm²' : 'cm³';
    return {
      instruction: INSTRUCTION,
      prompt:
        exposant === 2
          ? `Une figure a une aire de ${initiale} cm². On la réduit avec un rapport de 1/${k}. Quelle est l'aire de la figure réduite ?`
          : `Un solide a un volume de ${initiale} cm³. On le réduit avec un rapport de 1/${k}. Quel est le volume du solide réduit ?`,
      correct: `${final} ${unite}`,
      // La division par k seul, par la mauvaise puissance, la multiplication à la place de la division.
      wrong: fauxAvecUnite(final, [initiale / k, initiale / (exposant === 2 ? k ** 3 : k ** 2), initiale / (k * exposant), initiale - k, final * k, final + 1, final - 1], unite, { min: 1, decimales: 1 }),
      explanation: `Les longueurs sont divisées par ${k}, ${exposant === 2 ? 'les aires' : 'les volumes'} par ${puissance(k, exposant)} = ${k ** exposant} : ${initiale} ÷ ${k ** exposant} = ${final}.`,
    };
  }
  const exposant = variante === 4 ? 2 : 3;
  return {
    instruction: INSTRUCTION,
    prompt:
      exposant === 2
        ? `Les longueurs d'une figure sont multipliées par ${k}. Par combien son aire est-elle multipliée ?`
        : `Les longueurs d'un solide sont multipliées par ${k}. Par combien son volume est-il multiplié ?`,
    correct: String(k ** exposant),
    // Le même coefficient pour les longueurs et pour les aires, le produit par l'exposant, l'autre puissance.
    wrong: fauxEcrits(k ** exposant, [k, k * exposant, k ** (exposant === 2 ? 3 : 2), exposant * k ** exposant, k ** exposant + k], String, { min: 1 }),
    explanation: `${exposant === 2 ? 'Les aires sont multipliées' : 'Les volumes sont multipliés'} par le rapport à la puissance ${exposant} : ${puissance(k, exposant)} = ${k ** exposant}.`,
  };
});

// --- La médiane et l'étendue -------------------------------------------------------------------------------------------------------------------

const liste = (valeurs: number[]): string =>
  valeurs.length === 1 ? nb(valeurs[0]) : `${valeurs.slice(0, -1).map(nb).join(', ')} et ${nb(valeurs[valeurs.length - 1])}`;

const SERIES_A_ORDONNER = [
  { enonce: (v: number[]) => `Voici les notes d'une classe à un contrôle : ${liste(v)}.`, min: 3, max: 19 },
  { enonce: (v: number[]) => `Voici les temps de trajet, en minutes, de plusieurs élèves : ${liste(v)}.`, min: 5, max: 45 },
  { enonce: (v: number[]) => `Voici le nombre de buts marqués par une équipe lors de ses derniers matchs : ${liste(v)}.`, min: 0, max: 8 },
  { enonce: (v: number[]) => `Voici la taille, en centimètres, de plusieurs élèves : ${liste(v)}.`, min: 148, max: 176 },
];

const medianeEtendue = brique('mediane-etendue', 18, (rng) => {
  const serie = rngPick(rng, SERIES_A_ORDONNER);
  const n = rngInt(rng, 5, 9);
  let valeurs: number[];
  do {
    valeurs = Array.from({ length: n }, () => rngInt(rng, serie.min, serie.max));
  } while (new Set(valeurs).size < 3 || valeurs.every((valeur, rang) => rang === 0 || valeur >= valeurs[rang - 1]));
  const tries = [...valeurs].sort((a, b) => a - b);
  const mediane = n % 2 === 1 ? tries[(n - 1) / 2] : (tries[n / 2 - 1] + tries[n / 2]) / 2;
  const etendue = tries[n - 1] - tries[0];
  const moyenne = valeurs.reduce((total, valeur) => total + valeur, 0) / n;
  const triesEcrits = tries.join(', ');
  if (rng() < 0.6) {
    return {
      instruction: INSTRUCTION,
      prompt: `${serie.enonce(valeurs)} Quelle est la médiane de cette série ?`,
      correct: nb(mediane),
      // La valeur du milieu de la liste non rangée, la moyenne, l'étendue, la valeur centrale la plus grande.
      wrong: fauxEcrits(mediane, [valeurs[Math.floor(n / 2)], moyenne, etendue, n % 2 === 0 ? tries[n / 2] : tries[(n - 1) / 2 + 1], (tries[0] + tries[n - 1]) / 2, mediane + 1, mediane - 1], nb, { min: 0, decimales: 2 }),
      explanation: `On range les valeurs : ${triesEcrits}. ${n % 2 === 1 ? `Il y en a ${n}, la médiane est la valeur du milieu : ${nb(mediane)}.` : `Il y en a ${n}, la médiane est la moyenne des deux valeurs du milieu : ${nb(mediane)}.`}`,
    };
  }
  return {
    instruction: INSTRUCTION,
    prompt: `${serie.enonce(valeurs)} Quelle est l'étendue de cette série ?`,
    correct: nb(etendue),
    // La plus grande valeur, la plus petite, la somme des deux extrêmes, la moyenne.
    wrong: fauxEcrits(etendue, [tries[n - 1], tries[0], tries[0] + tries[n - 1], moyenne, mediane, etendue + 1, etendue - 1], nb, { min: 0, decimales: 2 }),
    explanation: `La plus grande valeur est ${tries[n - 1]} et la plus petite ${tries[0]} : l'étendue est ${tries[n - 1]} − ${tries[0]} = ${nb(etendue)}.`,
  };
});

// --- Les probabilités à deux épreuves ---------------------------------------------------------------------------------------------------

const EVENEMENTS_DE_LA_PIECE: { phrase: string; compte: number }[] = [
  { phrase: 'face deux fois', compte: 1 },
  { phrase: 'pile deux fois', compte: 1 },
  { phrase: 'une fois pile et une fois face, dans un ordre quelconque', compte: 2 },
  { phrase: 'au moins une fois face', compte: 3 },
  { phrase: 'deux résultats identiques', compte: 2 },
  { phrase: 'pile au premier lancer et face au second', compte: 1 },
];

const probabiliteDeuxEpreuves = brique('probabilite-deux-epreuves', 18, (rng) => {
  const variante = rngInt(rng, 0, 3);
  if (variante === 0) {
    const somme = rngInt(rng, 2, 12);
    const favorables = 6 - Math.abs(somme - 7);
    const juste = rat(favorables, 36);
    return {
      instruction: INSTRUCTION,
      prompt: `On lance deux dés équilibrés à 6 faces et on additionne les deux résultats. Quelle est la probabilité d'obtenir une somme égale à ${somme} ?`,
      correct: ecritFraction(favorables, 36),
      // Les onze sommes prises pour équiprobables, les sommes possibles rapportées à 12, un cas de plus ou de moins.
      wrong: fractionsAuChoix(juste, [[1, 11], [1, 12], [favorables, 12], [favorables, 6], [favorables + 1, 36], [favorables - 1, 36], [1, 36]]),
      explanation: `Il y a 6 × 6 = 36 résultats possibles, tous aussi probables. Ceux dont la somme vaut ${somme} sont au nombre de ${favorables} : ${favorables}/36${texteRat(juste) === `${favorables}/36` ? '' : ` = ${texteRat(juste)}`}.`,
    };
  }
  if (variante === 1) {
    const evenement = rngPick(rng, EVENEMENTS_DE_LA_PIECE);
    const juste = rat(evenement.compte, 4);
    return {
      instruction: INSTRUCTION,
      prompt: `On lance deux fois de suite une pièce équilibrée. Quelle est la probabilité d'obtenir ${evenement.phrase} ?`,
      correct: ecritFraction(evenement.compte, 4),
      // Les trois résultats « deux piles, deux faces, un de chaque » pris pour équiprobables, une probabilité à l'envers.
      wrong: fractionsAuChoix(juste, [[1, 3], [1, 2], [1, 4], [2, 3], [3, 4], [evenement.compte, 3], [evenement.compte, 2]]),
      explanation: `Les 4 résultats possibles sont PP, PF, FP et FF, tous aussi probables. ${evenement.compte} d'entre eux conviennent : ${evenement.compte}/4${texteRat(juste) === `${evenement.compte}/4` ? '' : ` = ${texteRat(juste)}`}.`,
    };
  }
  const rouges = rngInt(rng, 2, 6);
  const vertes = rngInt(rng, 2, 6);
  const total = rouges + vertes;
  const avecRemise = variante === 2;
  const deuxRouges = rng() < 0.5;
  const avec: Rat = deuxRouges ? rat(rouges * rouges, total * total) : rat(rouges * vertes, total * total);
  const sans: Rat = deuxRouges ? rat(rouges * (rouges - 1), total * (total - 1)) : rat(rouges * vertes, total * (total - 1));
  const juste = avecRemise ? avec : sans;
  const brut = avecRemise ? [deuxRouges ? rouges * rouges : rouges * vertes, total * total] : [deuxRouges ? rouges * (rouges - 1) : rouges * vertes, total * (total - 1)];
  const evenement = deuxRouges ? 'deux boules rouges' : 'une boule rouge au premier tirage, puis une boule verte au second';
  const calcul = deuxRouges
    ? avecRemise
      ? `${rouges}/${total} × ${rouges}/${total}`
      : `${rouges}/${total} × ${rouges - 1}/${total - 1}`
    : avecRemise
      ? `${rouges}/${total} × ${vertes}/${total}`
      : `${rouges}/${total} × ${vertes}/${total - 1}`;
  return {
    instruction: INSTRUCTION,
    prompt: `Un sac contient ${rouges} boules rouges et ${vertes} boules vertes. On tire une boule, ${avecRemise ? 'on la remet dans le sac' : 'sans la remettre'}, puis on en tire une seconde. Quelle est la probabilité d'obtenir ${evenement} ?`,
    correct: texteRat(juste),
    // L'autre façon de tirer, un dénominateur qui oublie la boule retirée, les deux probabilités additionnées, le premier tirage seul.
    wrong: fractionsAuChoix(juste, [
      [avecRemise ? sans.n : avec.n, avecRemise ? sans.d : avec.d],
      deuxRouges ? [rouges * (rouges - 1), total * total] : [rouges * vertes, total * (total - 1) + total],
      deuxRouges ? [2 * rouges, total] : [rouges * (total - 1) + vertes * total, total * (total - 1)],
      [rouges, total],
      deuxRouges ? [rouges - 1, total - 1] : [vertes, total - 1],
      [brut[0] + 1, brut[1]],
    ]),
    explanation: `${avecRemise ? 'Le sac est le même aux deux tirages' : `Au second tirage, il reste ${total - 1} boules`} : ${calcul} = ${brut[0]}/${brut[1]}${texteRat(juste) === `${brut[0]}/${brut[1]}` ? '' : ` = ${texteRat(juste)}`}.`,
  };
});

// --- Les évolutions successives ---------------------------------------------------------------------------------------------------------------------

const ARTICLES = ['jeu vidéo', 'blouson', 'sac à dos', 'casque audio', 'vélo', 'téléviseur', 'abonnement', 'billet de concert'];

/** « +32 % », « −4 % » : une évolution signée, comme on l'écrit. */
const evolutionSignee = (taux: number) => `${taux > 0 ? '+' : taux < 0 ? MOINS : ''}${nb(Math.abs(taux))} %`;

const evolutionsSuccessives = brique('evolutions-successives', 18, (rng) => {
  for (;;) {
    const [p1, p2] = [rngPick(rng, [5, 10, 15, 20, 25, 30, 40, 50]), rngPick(rng, [5, 10, 15, 20, 25, 30, 40, 50])];
    const [s1, s2] = [rng() < 0.5 ? 1 : -1, rng() < 0.5 ? 1 : -1];
    const [c1, c2] = [100 + s1 * p1, 100 + s2 * p2];
    // Aucun retour exact au prix de départ : ce serait une autre question.
    if (c1 * c2 === 10000) continue;
    const global = (c1 * c2) / 100 - 100;
    const prix = rngPick(rng, [100, 200, 250, 400, 500, 800, 50, 80, 120, 150, 160]);
    const final = (prix * c1 * c2) / 10000;
    if (Math.abs(final * 100 - Math.round(final * 100)) > 1e-6) continue;
    const dit = (s: number, p: number) => (s > 0 ? `augmente de ${p} %` : `baisse de ${p} %`);
    const suite = `Le prix d'un ${rngPick(rng, ARTICLES)} ${dit(s1, p1)}, puis ${dit(s2, p2)}.`;
    if (rng() < 0.5) {
      return {
        instruction: INSTRUCTION,
        prompt: `${suite} Le prix de départ est de ${nb(prix)} €. Quel est le prix final ?`,
        correct: `${nb(final)} €`,
        // Les pourcentages additionnés, le premier changement seulement, le second appliqué au prix de départ.
        wrong: fauxAvecUnite(final, [(prix * (100 + s1 * p1 + s2 * p2)) / 100, (prix * c1) / 100, (prix * c2) / 100, final + 5, final - 5, final + prix / 10, final - prix / 10], '€', { min: 0.1, decimales: 2 }),
        explanation: `Les coefficients sont ${nb(c1 / 100)} puis ${nb(c2 / 100)} : ${nb(prix)} × ${nb(c1 / 100)} × ${nb(c2 / 100)} = ${nb(final)}.`,
      };
    }
    const candidats = [s1 * p1 + s2 * p2, s1 * p1 - s2 * p2, global + 5, global - 5, global + 10, -global, s1 * p1];
    return {
      instruction: INSTRUCTION,
      prompt: `${suite} Quelle est l'évolution globale du prix, en pourcentage ?`,
      correct: evolutionSignee(global),
      // Les pourcentages additionnés ou soustraits, un des deux seulement, l'évolution contraire.
      wrong: [...new Set(candidats.filter((valeur) => Math.abs(valeur - global) > 1e-9).map(evolutionSignee))],
      explanation: `Les coefficients sont ${nb(c1 / 100)} et ${nb(c2 / 100)} : ${nb(c1 / 100)} × ${nb(c2 / 100)} = ${nb((c1 * c2) / 10000)}. L'évolution globale est ${evolutionSignee(global)}.`,
    };
  }
});

export const BRIQUES_TROISIEME_T3 = [agrandissementReduction, medianeEtendue, probabiliteDeuxEpreuves, evolutionsSuccessives];

/** Les problèmes de la 3e, dans l'ordre où le programme les amène. */
export const BRIQUES_TROISIEME: Brique[] = [...BRIQUES_TROISIEME_T1, ...BRIQUES_TROISIEME_T2, ...BRIQUES_TROISIEME_T3];
