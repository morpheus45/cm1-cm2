import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { fitsInFrame, type Figure, type Shape } from '../lib/figures';
import { availableAt, stageOf } from '../lib/progression';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { RANG_DES_GRADUATIONS } from './figuresCycle4';
import { generate } from './problemes';
import { BRIQUES_PROBLEMES_CYCLE4 } from './problemesCycle4';
import { THEMES } from './problemesCommun';
import { addQ, divQ, eqQ, evaluerAvecLettres, lireNombre, lireRationnel, mulQ, negQ, puissanceQ, q, racineQ, subQ, absQ, cmpQ, type Q } from './verificationCycle4';

/**
 * Les problèmes de la 5e, de la 4e et de la 3e : chaque question est refaite
 * ici à partir de son énoncé et de sa figure — avec des rationnels exacts qui
 * ne partagent rien avec les générateurs (verificationCycle4.ts) —, puis
 * comparée aux propositions, dont une seule doit être juste. Une figure se
 * relit comme la lirait un élève : les graduations, les barres, les parts, les
 * cases d'un tableau.
 */

const NIVEAUX: Level[] = ['5e', '4e', '3e'];
/** Cinquante graines par cellule suffisent à chaque exécution ; VITE_GRAINES_CYCLE4=2000 npm test pour une vérification plus longue. */
const GRAINES = Number(import.meta.env.VITE_GRAINES_CYCLE4 ?? 50);

function questions(level: Level, trimester: Trimester, count = 24, seeds = GRAINES): Question[] {
  return Array.from({ length: seeds }, (_, seed) => generate(level, trimester, createRng(seed * 31 + 5), count)).flat();
}

const parCellule = <T>(faire: (level: Level, trimester: Trimester) => T) =>
  NIVEAUX.flatMap((level) => ALL_TRIMESTERS.map((trimester) => ({ level, trimester, valeur: faire(level, trimester) })));

const MOTIFS = BRIQUES_PROBLEMES_CYCLE4.map((brique) => ({ nom: brique.name, motif: new RegExp(`^problemes-${brique.name}-\\d+-`) }));

function briqueDe(question: Question): string {
  const trouves = MOTIFS.filter(({ motif }) => motif.test(question.id));
  if (trouves.length !== 1) throw new Error(`${question.id} : ${trouves.length} sortes de question possibles`);
  return trouves[0].nom;
}

// --- Lire une proposition ----------------------------------------------------------------------------------------------

type Juge = (choix: string) => boolean;

const nombre = (texte: string): Q => {
  const valeur = lireNombre(texte);
  if (valeur === null) throw new Error(`Nombre illisible : « ${texte} »`);
  return valeur;
};

/** « −12,5 °C », « 1 200 km », « +32 % » : un nombre écrit et son unité (ce qui suit la première espace ordinaire). */
function lireValeur(choix: string): { valeur: Q; unite: string } | null {
  const m = /^([+−-]?\d[\d\u00a0\u202f]*(?:,\d+)?)(?: (.+))?$/.exec(choix);
  if (!m) return null;
  const valeur = lireNombre(m[1].replace(/^\+/, ''));
  return valeur ? { valeur, unite: m[2] ?? '' } : null;
}

/** La proposition vaut ce nombre, avec cette unité. */
const vaut =
  (attendu: Q, unite = ''): Juge =>
  (choix) => {
    const lu = lireValeur(choix);
    return lu !== null && eqQ(lu.valeur, attendu) && lu.unite === unite;
  };

/** La proposition vaut cette fraction, quelle que soit son écriture (« 2/4 » vaut « 1/2 »). */
const vautLaFraction =
  (attendu: Q): Juge =>
  (choix) => {
    const lu = lireRationnel(choix);
    return lu !== null && eqQ(lu, attendu);
  };

/** « 1 h 12 min », « 45 min », « 2 h » : une durée en minutes. */
function lireDuree(texte: string): number | null {
  const m = /^(?:(\d+) h)?(?: ?(\d+) min)?$/.exec(texte);
  if (!m || (m[1] === undefined && m[2] === undefined)) return null;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}
const vautLaDuree =
  (minutes: number): Juge =>
  (choix) =>
    lireDuree(choix) === minutes;

const dureeEnMinutes = (texte: string): number => {
  const minutes = lireDuree(texte);
  if (minutes === null) throw new Error(`Durée illisible : « ${texte} »`);
  return minutes;
};

const EXPOSANTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const exposantLu = (texte: string): number => Number(texte.replace('⁻', '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String(EXPOSANTS.indexOf(c))));

const pgcdEntiers = (a: number, b: number): number => (b === 0 ? a : pgcdEntiers(b, a % b));
const entiers = (texte: string) => (texte.match(/\d+/g) ?? []).map(Number);

// --- Relire une figure ------------------------------------------------------------------------------------------------------

type Texte = Extract<Shape, { kind: 'text' }>;
type Segment = Extract<Shape, { kind: 'segment' }>;
const textes = (figure: Figure): Texte[] => figure.shapes.filter((forme): forme is Texte => forme.kind === 'text');
const segments = (figure: Figure): Segment[] => figure.shapes.filter((forme): forme is Segment => forme.kind === 'segment');

interface Graduation {
  pixel: number;
  valeur: Q;
}

/** Les graduations d'un repère : celles de l'axe horizontal (écrites sous le cadre) et celles de l'axe vertical (à gauche). */
function graduationsDuRepere(figure: Figure): { x: Graduation[]; y: Graduation[] } {
  const lues = (liste: Texte[], pixel: (texte: Texte) => number): Graduation[] =>
    liste.map((texte) => ({ pixel: pixel(texte), valeur: nombre(texte.text) })).sort((a, b) => a.pixel - b.pixel);
  return {
    x: lues(textes(figure).filter((texte) => texte.at[1] === RANG_DES_GRADUATIONS.ligneX && lireNombre(texte.text) !== null), (texte) => texte.at[0]),
    y: lues(textes(figure).filter((texte) => texte.at[0] === RANG_DES_GRADUATIONS.colonneY && lireNombre(texte.text) !== null), (texte) => texte.at[1] - 4),
  };
}

/** La valeur exacte d'une graduation écrite à ce pixel, ou `null` si aucune n'y est écrite. */
const valeurAuPixel = (graduations: Graduation[], pixel: number): Q | null => graduations.find((g) => Math.abs(g.pixel - pixel) < 0.25)?.valeur ?? null;

/** La valeur, à peu près, d'un pixel quelconque d'un axe : par interpolation entre la première et la dernière graduation. */
function valeurApprochee(graduations: Graduation[], pixel: number): number {
  const [premiere, derniere] = [graduations[0], graduations[graduations.length - 1]];
  const [v0, v1] = [Number(premiere.valeur.n) / Number(premiere.valeur.d), Number(derniere.valeur.n) / Number(derniere.valeur.d)];
  return v0 + ((pixel - premiere.pixel) * (v1 - v0)) / (derniere.pixel - premiere.pixel);
}

/** La droite colorée d'un repère. */
function droiteColoree(figure: Figure): Segment {
  const trouvees = segments(figure).filter((segment) => segment.ink === 'couleur');
  expect(trouvees, 'une seule droite colorée').toHaveLength(1);
  return trouvees[0];
}

/** Les barres d'un diagramme en barres : leur nom et la valeur lue sur l'axe gradué. */
function barresLues(figure: Figure): { nom: string; valeur: number }[] {
  const graduations = textes(figure)
    .filter((texte) => texte.anchor === 'end' && texte.at[0] === 39 && /^\d+$/.test(texte.text))
    .map((texte) => ({ pixel: texte.at[1] - 4.5, valeur: Number(texte.text) }))
    .sort((a, b) => a.pixel - b.pixel);
  const [haut, bas] = [graduations[0], graduations[graduations.length - 1]];
  const valeurDe = (pixel: number) => Math.round(bas.valeur + ((pixel - bas.pixel) * (haut.valeur - bas.valeur)) / (haut.pixel - bas.pixel));
  const noms = textes(figure).filter((texte) => texte.anchor === 'middle' && texte.at[1] === 165);
  return figure.shapes
    .filter((forme): forme is Extract<Shape, { kind: 'polygon' }> => forme.kind === 'polygon' && forme.points.length === 4)
    .map((barre) => {
      const centre = (barre.points[0][0] + barre.points[2][0]) / 2;
      const etiquette = noms.find((texte) => Math.abs(texte.at[0] - centre) < 1);
      return { nom: etiquette?.text ?? '?', valeur: valeurDe(barre.points[1][1]) };
    });
}

/** Un tableau de deux colonnes (modalité, effectif) : ses lignes, hors en-tête. */
function lignesDuTableau(figure: Figure): { modalite: string; effectif: number }[] {
  const [, , ...reste] = textes(figure);
  return Array.from({ length: reste.length / 2 }, (_, rang) => ({ modalite: reste[2 * rang].text, effectif: Number(reste[2 * rang + 1].text) }));
}

/** Un tableau de proportionnalité : ses deux lignes, nom puis valeurs. */
function lignesDeProportionnalite(figure: Figure): { nom: string; valeurs: string[] }[] {
  const parLigne = new Map<number, Texte[]>();
  textes(figure).forEach((texte) => parLigne.set(texte.at[1], [...(parLigne.get(texte.at[1]) ?? []), texte]));
  return [...parLigne.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, ligne]) => ({ nom: ligne[0].text, valeurs: ligne.slice(1).map((texte) => texte.text) }));
}

/** Les parts d'un diagramme circulaire : « Foot 25 % » donne un nom et un pourcentage. */
function partsLues(figure: Figure): { nom: string; pourcentage: number }[] {
  return textes(figure).map((texte) => {
    const m = /^(.+) (\d+(?:,\d+)?) %$/.exec(texte.text);
    if (!m) throw new Error(`Étiquette illisible : ${texte.text}`);
    return { nom: m[1], pourcentage: Number(m[2].replace(',', '.')) };
  });
}

const ITEMS = THEMES.flatMap((theme) => theme.items);
const nomDeLaCategorie = (dit: string): string => {
  const trouve = ITEMS.find((item) => item.dit === dit);
  if (!trouve) throw new Error(`Catégorie inconnue : ${dit}`);
  return trouve.nom;
};

// --- Des événements, comptés un à un ----------------------------------------------------------------------------------------

function predicatDe(phrase: string): (n: number) => boolean {
  let m: RegExpExecArray | null;
  if (phrase === 'un nombre pair') return (n) => n % 2 === 0;
  if (phrase === 'un nombre impair') return (n) => n % 2 === 1;
  if ((m = /^un multiple de (\d+)$/.exec(phrase))) return (n) => n % Number(m![1]) === 0;
  if ((m = /^un nombre supérieur ou égal à (\d+)$/.exec(phrase))) return (n) => n >= Number(m![1]);
  if ((m = /^un nombre strictement inférieur à (\d+)$/.exec(phrase))) return (n) => n < Number(m![1]);
  if ((m = /^un nombre supérieur à (\d+)$/.exec(phrase))) return (n) => n > Number(m![1]);
  if ((m = /^un nombre inférieur ou égal à (\d+)$/.exec(phrase))) return (n) => n <= Number(m![1]);
  if (phrase === 'un nombre à un chiffre') return (n) => n < 10;
  if (phrase === 'un nombre à deux chiffres') return (n) => n >= 10 && n < 100;
  if (phrase === 'un carré parfait') return (n) => Number.isInteger(Math.sqrt(n));
  throw new Error(`Événement inconnu : ${phrase}`);
}

/** Le jeu de 32 cartes : quatre couleurs, huit valeurs. */
const JEU_DE_32 = ['cœur', 'carreau', 'pique', 'trèfle'].flatMap((couleur) => ['7', '8', '9', '10', 'valet', 'dame', 'roi', 'as'].map((valeur) => ({ couleur, valeur })));
const ROUGES = ['cœur', 'carreau'];

function carteDe(phrase: string): (carte: { couleur: string; valeur: string }) => boolean {
  if (phrase === 'un roi') return (c) => c.valeur === 'roi';
  if (phrase === 'un as') return (c) => c.valeur === 'as';
  if (phrase === 'un cœur') return (c) => c.couleur === 'cœur';
  if (phrase === 'un trèfle') return (c) => c.couleur === 'trèfle';
  if (phrase === 'une figure (valet, dame ou roi)') return (c) => ['valet', 'dame', 'roi'].includes(c.valeur);
  if (phrase === 'une carte noire') return (c) => !ROUGES.includes(c.couleur);
  if (phrase === 'un as rouge') return (c) => c.valeur === 'as' && ROUGES.includes(c.couleur);
  if (phrase === 'un huit ou un neuf') return (c) => c.valeur === '8' || c.valeur === '9';
  throw new Error(`Carte inconnue : ${phrase}`);
}

/** Des programmes de calcul : les étapes dites en toutes lettres, refaites avec des rationnels exacts. */
function executerLeProgramme(etapes: string[], depart: Q): Q {
  return etapes.reduce((n, etape) => {
    let m: RegExpExecArray | null;
    if ((m = /multiplie (?:le résultat )?par (\d+)$/.exec(etape))) return mulQ(n, q(Number(m[1])));
    if ((m = /ajoute (\d+)$/.exec(etape))) return addQ(n, q(Number(m[1])));
    if ((m = /soustrait (\d+)$/.exec(etape))) return subQ(n, q(Number(m[1])));
    if (/au carré$/.test(etape)) return mulQ(n, n);
    throw new Error(`Étape inconnue : ${etape}`);
  }, depart);
}
const etapesDuProgramme = (texte: string) => texte.split(/, puis |, /);

// === Refaire chaque question =======================================================================================================

function jugeDe(question: Question): Juge {
  const { prompt, figure } = question;
  const nom = briqueDe(question);
  let m: RegExpExecArray | null;
  switch (nom) {
    // --- 5e, 1er trimestre -----------------------------------------------------------------------------------------------
    case 'evolution-relatifs': {
      const signe = (mot: string) => (['monte', 'dépose'].includes(mot) ? 1 : -1);
      const ajoute = (depart: string, mot: string, variation: string) => addQ(nombre(depart), signe(mot) === 1 ? nombre(variation) : negQ(nombre(variation)));
      if ((m = /il fait (.+) °C à \d+ h\. Dans la journée, la température (monte|baisse) de (.+) °C\./.exec(prompt))) return vaut(ajoute(m[1], m[2], m[3]), '°C');
      if ((m = /est à (.+) m par rapport au niveau de la mer\. Il (monte|descend) de (.+) m\./.exec(prompt))) return vaut(ajoute(m[1], m[2], m[3]), 'm');
      if ((m = /a un solde de (.+) € sur son compte\. (?:Il|Elle) (dépose|dépense) (.+) €\./.exec(prompt))) return vaut(ajoute(m[1], m[2], m[3]), '€');
      break;
    }
    case 'proportionnalite-prix':
      if ((m = /^(\d+) .+ coûtent (.+) €\. Combien coûtent (\d+) /.exec(prompt))) return vaut(mulQ(divQ(nombre(m[2]), q(Number(m[1]))), q(Number(m[3]))), '€');
      break;
    case 'coefficient':
      if ((m = /^(\d+) .+ coûtent (.+) €\. Le prix est proportionnel/.exec(prompt))) return vaut(divQ(nombre(m[2]), q(Number(m[1]))));
      break;
    case 'tableau-proportionnalite': {
      const [haut, bas] = lignesDeProportionnalite(figure!);
      expect(haut.valeurs, prompt).toHaveLength(4);
      expect(bas.valeurs[3], 'la valeur cherchée est écrite « ? »').toBe('?');
      const coefficient = divQ(nombre(bas.valeurs[0]), nombre(haut.valeurs[0]));
      // Les trois colonnes connues sont bien proportionnelles.
      [1, 2].forEach((colonne) => expect(eqQ(divQ(nombre(bas.valeurs[colonne]), nombre(haut.valeurs[colonne])), coefficient), prompt).toBe(true));
      const demande = prompt.replace(/^Ce tableau est un tableau de proportionnalité\. /, '');
      expect(entiers(demande), demande).toEqual([Number(haut.valeurs[3])]);
      const unite = /\((.+)\)$/.exec(bas.nom)?.[1] ?? bas.nom.toLowerCase();
      return vaut(mulQ(coefficient, nombre(haut.valeurs[3])), unite);
    }
    case 'formule-contexte':
      if ((m = /^La formule P = 2 × \(L \+ l\) .* P pour L = (\d+) cm et l = (\d+) cm \?$/.exec(prompt))) return vaut(q(2 * (Number(m[1]) + Number(m[2]))), 'cm');
      if ((m = /fait payer (\d+) € de frais fixes, puis (\d+) € par .* P = \d+ \+ \d+ × n.* P pour n = (\d+) \?$/.exec(prompt))) return vaut(q(Number(m[1]) + Number(m[2]) * Number(m[3])), '€');
      if ((m = /^La formule V = L × l × h .* V pour L = (\d+) cm, l = (\d+) cm et h = (\d+) cm \?$/.exec(prompt))) return vaut(q(Number(m[1]) * Number(m[2]) * Number(m[3])), 'cm³');
      break;
    case 'programme-de-calcul':
      if ((m = /^Programme de calcul : on choisit un nombre, (.+)\. Quel résultat obtient-on si on choisit (.+) \?$/.exec(prompt))) return vaut(executerLeProgramme(etapesDuProgramme(m[1]), nombre(m[2])));
      break;
    case 'frequence': {
      const [total, effectif] = entiers(prompt.split('?')[0]);
      const frequence = divQ(q(effectif), q(total));
      if (/en pourcentage\.$/.test(prompt)) return vaut(mulQ(frequence, q(100)), '%');
      if (/fraction simplifiée\.$/.test(prompt)) return vautLaFraction(frequence);
      break;
    }
    case 'lecture-diagramme': {
      const barres = barresLues(figure!);
      const total = barres.reduce((somme, barre) => somme + barre.valeur, 0);
      if (/Combien d'(?:élèves|enfants) ont été interrogés en tout/.test(prompt)) return vaut(q(total));
      if ((m = /^Sur les (\d+) (?:élèves|enfants) interrogés, quel pourcentage a choisi (.+) \?$/.exec(prompt))) {
        expect(Number(m[1]), 'le total annoncé est celui des barres').toBe(total);
        const barre = barres.find((candidate) => candidate.nom === nomDeLaCategorie(m![2]));
        expect(barre, prompt).toBeDefined();
        return vaut(divQ(mulQ(q(barre!.valeur), q(100)), q(total)), '%');
      }
      break;
    }
    case 'achats-decimaux':
      if ((m = /achète (\d+) .+ à (.+) € l'une? et (\d+) .+ à (.+) € l'une?\. (?:Il|Elle) paie avec un billet de (\d+) €\./.exec(prompt))) {
        const depense = addQ(mulQ(q(Number(m[1])), nombre(m[2])), mulQ(q(Number(m[3])), nombre(m[4])));
        return vaut(subQ(q(Number(m[5])), depense), '€');
      }
      break;
    case 'decoupe-decimale': {
      const [total, morceau] = [...prompt.matchAll(/([\d\u00a0]+(?:,\d+)?) (?:m|L)\b/g)].map((trouve) => nombre(trouve[1]));
      return vaut(divQ(total, morceau));
    }
    case 'carre-cube-contexte':
      if ((m = /^Un terrain carré a un côté de (\d+) m\./.exec(prompt))) return vaut(q(Number(m[1]) ** 2), 'm²');
      if ((m = /^Un cube a une arête de (\d+) cm\./.exec(prompt))) return vaut(q(Number(m[1]) ** 3), 'cm³');
      if ((m = /salle carrée de (\d+) m de côté/.exec(prompt))) return vaut(q(Number(m[1]) ** 2));
      if ((m = /^Un cube de (\d+) cm d'arête est entièrement rempli/.exec(prompt))) return vaut(q(Number(m[1]) ** 3));
      break;

    // --- 5e, 2e trimestre ---------------------------------------------------------------------------------------------------
    case 'relatifs-ecart':
      if ((m = /minimale est de (.+) °C et la température maximale de (.+) °C/.exec(prompt))) return vaut(absQ(subQ(nombre(m[2]), nombre(m[1]))), '°C');
      if ((m = /le plus haut est à (.+) m d'altitude et le point le plus bas à (.+) m\./.exec(prompt))) return vaut(absQ(subQ(nombre(m[1]), nombre(m[2]))), 'm');
      if ((m = /a un solde de (.+) € et .+ un solde de (.+) €\./.exec(prompt))) return vaut(absQ(subQ(nombre(m[2]), nombre(m[1]))), '€');
      break;
    case 'relatifs-bilan': {
      const variation = (mot: string, valeur: string) => (/^(reçoit|monte de|gagne)$/.test(mot) ? nombre(valeur) : negQ(nombre(valeur)));
      if ((m = /a un solde de (.+) €\. (?:Il|Elle) (reçoit|paie) (.+) €, puis (?:il|elle) (reçoit|paie) (.+) €\./.exec(prompt))) return vaut(addQ(addQ(nombre(m[1]), variation(m[2], m[3])), variation(m[4], m[5])), '€');
      if ((m = /est à (.+) m par rapport à la surface\. Il (monte de|descend de) (.+) m, puis il (monte de|descend de) (.+) m\./.exec(prompt))) return vaut(addQ(addQ(nombre(m[1]), variation(m[2], m[3])), variation(m[4], m[5])), 'm');
      if ((m = /partie, \S+ a (.+) points\. (?:Il|Elle) (gagne|perd) (.+) points, puis (?:il|elle) (gagne|perd) (.+) points\./.exec(prompt))) {
        const total = addQ(addQ(nombre(m[1]), variation(m[2], m[3])), variation(m[4], m[5]));
        return (choix) => {
          const lu = lireValeur(choix);
          return lu !== null && eqQ(lu.valeur, total) && lu.unite === (absQ(total).n >= 2n ? 'points' : 'point');
        };
      }
      if ((m = /il fait (.+) °C\. Pendant la nuit, la température (monte de|baisse de) (.+) °C, puis elle (monte de|baisse de) (.+) °C\./.exec(prompt))) {
        const signe = (mot: string, valeur: string) => (mot === 'monte de' ? nombre(valeur) : negQ(nombre(valeur)));
        return vaut(addQ(addQ(nombre(m[1]), signe(m[2], m[3])), signe(m[4], m[5])), '°C');
      }
      break;
    }
    case 'fraction-quantite': {
      const [total] = entiers(prompt);
      const fraction = /(\d+)\/(\d+)/.exec(prompt);
      expect(fraction, prompt).not.toBeNull();
      const [n, d] = [Number(fraction![1]), Number(fraction![2])];
      expect(total % d, `${total} est un multiple de ${d}`).toBe(0);
      const part = (total / d) * n;
      return vaut(q(/reste|manque|ne sont pas/.test(prompt) ? total - part : part));
    }
    case 'fractions-contexte':
      if ((m = /mange (\d+)\/(\d+) .*, puis .* mange (\d+)\/(\d+) .*\. Quelle fraction .* (reste-t-il|ont-ils)/.exec(prompt))) {
        const somme = addQ(divQ(q(Number(m[1])), q(Number(m[2]))), divQ(q(Number(m[3])), q(Number(m[4]))));
        return vautLaFraction(m[5] === 'reste-t-il' ? subQ(q(1), somme) : somme);
      }
      break;
    case 'pourcentage-remise':
      if ((m = /coûte (\d+) €\. (?:Il|Elle) est soldée? avec (\d+) % de réduction\. Quel est (le montant de la réduction|son nouveau prix)/.exec(prompt))) {
        const remise = divQ(mulQ(q(Number(m[1])), q(Number(m[2]))), q(100));
        return vaut(m[3] === 'son nouveau prix' ? subQ(q(Number(m[1])), remise) : remise, '€');
      }
      break;
    case 'graphique-proportionnel': {
      const { x, y } = graduationsDuRepere(figure!);
      const droite = droiteColoree(figure!);
      // La droite part de l'origine et finit sur les dernières graduations : son coefficient s'en déduit exactement.
      expect(valeurAuPixel(x, droite.from[0])?.n, 'elle part de (0 ; 0)').toBe(0n);
      expect(valeurAuPixel(y, droite.from[1])?.n, 'elle part de (0 ; 0)').toBe(0n);
      const [xFin, yFin] = [valeurAuPixel(x, droite.to[0]), valeurAuPixel(y, droite.to[1])];
      expect(xFin, 'elle finit sur une graduation horizontale').not.toBeNull();
      expect(yFin, 'elle finit sur une graduation verticale').not.toBeNull();
      const coefficient = divQ(yFin!, xFin!);
      const unite = (nomDeLAxe: string) => /\((.+)\)$/.exec(nomDeLAxe)?.[1] ?? nomDeLAxe.toLowerCase();
      const [uniteDeY, uniteDeX] = [unite(textes(figure!).find((texte) => texte.at[1] === 14)!.text), unite(textes(figure!).find((texte) => texte.at[1] === 194)!.text)];
      const demande = prompt.replace(/^Ce graphique représente une situation de proportionnalité\. /, '');
      const lu = nombre(/(\d[\d\u00a0]*(?:,\d+)?)/.exec(demande)![1]);
      if (/combien de (?:kilogrammes|mètres)|En combien|pour combien de personnes/.test(demande)) return vaut(divQ(lu, coefficient), uniteDeX);
      return vaut(mulQ(coefficient, lu), uniteDeY);
    }
    case 'equation-simple':
      if ((m = /lui ajoute (\d+) et obtient (\d+)\./.exec(prompt))) return vaut(q(Number(m[2]) - Number(m[1])));
      if ((m = /le multiplie par (\d+) et obtient (\d+)\./.exec(prompt))) return vaut(q(Number(m[2]) / Number(m[1])));
      if ((m = /lui soustrait (\d+) et obtient (\d+)\./.exec(prompt))) return vaut(q(Number(m[1]) + Number(m[2])));
      if ((m = /a (\d+) fois plus de billes .*\. .* a (\d+) billes\./.exec(prompt))) return vaut(q(Number(m[2]) / Number(m[1])));
      break;

    // --- 5e, 3e trimestre -----------------------------------------------------------------------------------------------------
    case 'moyenne': {
      const liste = /(\d+(?:, \d+)* et \d+)/.exec(prompt);
      expect(liste, prompt).not.toBeNull();
      const valeurs = entiers(liste![1]);
      const moyenne = divQ(q(valeurs.reduce((s, v) => s + v, 0)), q(valeurs.length));
      const unite = /buts/.test(prompt) ? 'buts' : /minutes/.test(prompt) ? 'min' : /baguettes/.test(prompt) ? 'baguettes' : /°C/.test(prompt) ? '°C' : '';
      return vaut(moyenne, unite);
    }
    case 'diagramme-circulaire': {
      const parts = partsLues(figure!);
      expect(parts.reduce((s, p) => s + p.pourcentage, 0), 'les parts font 100 %').toBe(100);
      const pourcentageDe = (dit: string) => {
        const part = parts.find((candidate) => candidate.nom === nomDeLaCategorie(dit));
        expect(part, `${dit} dans ${prompt}`).toBeDefined();
        return part!.pourcentage;
      };
      if ((m = /^Sur (\d+) .* interrogés, combien de plus ont choisi (.+) que (.+) \?$/.exec(prompt))) return vaut(q(((pourcentageDe(m[2]) - pourcentageDe(m[3])) * Number(m[1])) / 100));
      if ((m = /^Sur (\d+) .* interrogés, combien ont choisi (.+) \?$/.exec(prompt))) return vaut(q((pourcentageDe(m[2]) * Number(m[1])) / 100));
      if ((m = /^Quel pourcentage des .* interrogés a choisi (.+) ou (.+) \?$/.exec(prompt))) return vaut(q(pourcentageDe(m[1]) + pourcentageDe(m[2])), '%');
      break;
    }
    case 'probabilite-equiprobable': {
      const probabilite = (favorables: number, possibles: number) => vautLaFraction(q(favorables, possibles));
      if ((m = /dé équilibré à 6 faces numérotées de 1 à 6\. .* d'obtenir (.+) \?$/.exec(prompt))) {
        const predicat = predicatDe(m[1]);
        return probabilite([1, 2, 3, 4, 5, 6].filter(predicat).length, 6);
      }
      if ((m = /partagée en (\d+) secteurs égaux, numérotés de 1 à \d+\. .* d'obtenir (.+) \?$/.exec(prompt))) {
        const n = Number(m[1]);
        return probabilite(Array.from({ length: n }, (_, rang) => rang + 1).filter(predicatDe(m[2])).length, n);
      }
      if ((m = /^Un sac contient (.+)\. On tire une boule au hasard\. .* d'obtenir une boule (\p{L}+) \?$/u.exec(prompt))) {
        const couleurs = [...m[1].matchAll(/(\d+) boules? (\p{L}+)/gu)].map((trouve) => ({ n: Number(trouve[1]), couleur: trouve[2].replace(/s$/, '') }));
        const total = couleurs.reduce((s, c) => s + c.n, 0);
        const choisie = couleurs.find((c) => c.couleur === m![2]);
        expect(choisie, prompt).toBeDefined();
        return probabilite(choisie!.n, total);
      }
      if ((m = /jeu de 32 cartes\. .* d'obtenir (.+) \?$/.exec(prompt))) return probabilite(JEU_DE_32.filter(carteDe(m[1])).length, 32);
      break;
    }
    case 'comparer-deux-series': {
      m = /, (\p{L}+) a obtenu (.+?) et (\p{L}+) a obtenu (.+?)\. (Qui a la meilleure moyenne|Quelle est la différence entre leurs deux moyennes) \?$/u.exec(prompt);
      if (!m) break;
      const moyenne = (liste: string) => divQ(q(entiers(liste).reduce((s, v) => s + v, 0)), q(entiers(liste).length));
      const [moyenneA, moyenneB] = [moyenne(m[2]), moyenne(m[4])];
      if (m[5].startsWith('Qui')) {
        expect(eqQ(moyenneA, moyenneB), 'les moyennes diffèrent').toBe(false);
        return (choix) => choix === (cmpQ(moyenneA, moyenneB) > 0 ? m![1] : m![3]);
      }
      return vaut(absQ(subQ(moyenneA, moyenneB)));
    }
    case 'volume-contenance':
      if ((m = /pavé droit de (\d+) cm de long, (\d+) cm de large et (\d+) cm de haut\. .* litres \?$/.exec(prompt))) return vaut(q(Number(m[1]) * Number(m[2]) * Number(m[3]), 1000), 'L');
      if ((m = /aire de sa base est de (\d+) m² et sa hauteur de (.+) m\. Quel est son volume \?$/.exec(prompt))) return vaut(mulQ(q(Number(m[1])), nombre(m[2])), 'm³');
      if ((m = /aire de sa base est de (\d+) m² et sa hauteur de (.+) m\. Combien de litres/.exec(prompt))) return vaut(mulQ(mulQ(q(Number(m[1])), nombre(m[2])), q(1000)), 'L');
      break;
    case 'aire-contexte':
      if ((m = /^Un terrain a la forme d'un triangle de base (\d+) m et de hauteur (\d+) m\./.exec(prompt))) return vaut(q(Number(m[1]) * Number(m[2]), 2), 'm²');
      if ((m = /parallélogramme de base (\d+) m et de hauteur (\d+) m\./.exec(prompt))) return vaut(q(Number(m[1]) * Number(m[2])), 'm²');
      if ((m = /triangulaire de base (\d+) m et de hauteur (\d+) m .* coûte (\d+) € le mètre carré/.exec(prompt))) return vaut(q(Number(m[1]) * Number(m[2]) * Number(m[3]), 2), '€');
      break;

    // --- 4e, 1er trimestre ---------------------------------------------------------------------------------------------------------
    case 'produit-relatifs-contexte':
      if ((m = /^La température baisse de (\d+) °C chaque heure\. .* au bout de (\d+) heures/.exec(prompt))) return vaut(q(-Number(m[1]) * Number(m[2])), '°C');
      if ((m = /^Un plongeur descend de (\d+) m chaque minute\. .* au bout de (\d+) minutes/.exec(prompt))) return vaut(q(-Number(m[1]) * Number(m[2])), 'm');
      if ((m = /^Chaque mois, (\d+) € sont prélevés .* au bout de (\d+) mois/.exec(prompt))) return vaut(q(-Number(m[1]) * Number(m[2])), '€');
      if ((m = /chaque erreur fait perdre (\d+) points\. .* fait (\d+) erreurs/.exec(prompt))) return vaut(q(-Number(m[1]) * Number(m[2])), 'points');
      if ((m = /^Une dette de (\d+) € est partagée en parts égales entre (\d+) amis/.exec(prompt))) return vaut(q(-Number(m[1]) / Number(m[2])), '€');
      if ((m = /^Chaque semaine, (\d+) € sont prélevés sur un compte\. .* a varié de (.+) €\. Combien de semaines/.exec(prompt))) return vaut(divQ(nombre(m[2]), q(-Number(m[1]))));
      break;
    case 'pourcentage-evolution':
      if ((m = /coûte (\d+) €\. Son prix (augmente|baisse) de (\d+) %\./.exec(prompt))) {
        const coefficient = q(100 + (m[2] === 'augmente' ? 1 : -1) * Number(m[3]), 100);
        return vaut(mulQ(q(Number(m[1])), coefficient), '€');
      }
      if ((m = /^Pour (augmenter|diminuer) un prix de (\d+) %, par quel nombre/.exec(prompt))) return vaut(q(100 + (m[1] === 'augmenter' ? 1 : -1) * Number(m[2]), 100));
      break;
    case 'echelle-conversion':
      if ((m = /à l'échelle 1\/([\d\u00a0]+), la distance entre deux villages mesure (\d+) cm\./.exec(prompt))) return vaut(q(Number(m[2]) * Number(nombre(m[1]).n), 100000), 'km');
      if ((m = /distantes de (\d+) km\. Sur une carte à l'échelle 1\/([\d\u00a0]+), .* centimètres/.exec(prompt))) return vaut(q(Number(m[1]) * 100000, Number(nombre(m[2]).n)), 'cm');
      if ((m = /à l'échelle 1\/(\d+)\. .* mesure (.+) m\. Quelle est la longueur de la maquette/.exec(prompt))) return vaut(divQ(mulQ(nombre(m[2]), q(100)), q(Number(m[1]))), 'cm');
      break;
    case 'fraction-de-fraction': {
      const fractions = [...prompt.matchAll(/(\d+)\/(\d+)/g)].map((trouve) => divQ(q(Number(trouve[1])), q(Number(trouve[2]))));
      if ((m = /contient (.+) L de jus de fruits\. On remplit des verres de (.+) L chacun/.exec(prompt))) return vautLaFraction(divQ(lireRationnel(m[1])!, lireRationnel(m[2])!));
      if ((m = /^Un pas .* mesure (\d+)\/(\d+) m\. Quelle distance parcourt-(?:il|elle) en (\d+) pas/.exec(prompt))) return vautLaFraction(mulQ(q(Number(m[1]), Number(m[2])), q(Number(m[3]))));
      expect(fractions, prompt).toHaveLength(2);
      return vautLaFraction(mulQ(fractions[0], fractions[1]));
    }
    case 'effectifs-frequences': {
      const lignes = lignesDuTableau(figure!);
      const total = lignes.reduce((s, ligne) => s + ligne.effectif, 0);
      if (/Combien d'élèves compte la classe/.test(prompt)) return vaut(q(total));
      const valeurDe = (phrase: string) => (/ni frère ni sœur|aucun livre/.test(phrase) ? 0 : /un frère ou une sœur/.test(phrase) ? 1 : entiers(phrase)[0]);
      if ((m = /Quelle est la fréquence, en pourcentage, des élèves qui (.+) \?$/.exec(prompt))) {
        const ligne = lignes.find((candidate) => Number(candidate.modalite) === valeurDe(m![1]));
        expect(ligne, prompt).toBeDefined();
        return vaut(q(100 * ligne!.effectif, total), '%');
      }
      if ((m = /^Le tableau donne .*\. Combien d'élèves (.+) \?$/.exec(prompt))) {
        const seuil = valeurDe(m[1]);
        return vaut(q(lignes.filter((ligne) => Number(ligne.modalite) >= seuil).reduce((s, ligne) => s + ligne.effectif, 0)));
      }
      break;
    }
    case 'puissances-situation':
      if ((m = /au bout de (\d+) heures/.exec(prompt))) return vaut(q(2 ** Number(m[1])));
      if ((m = /à l'étape (\d+), en partant/.exec(prompt))) return vaut(q(3 ** Number(m[1])));
      if ((m = /(\d+) fois de suite/.exec(prompt))) return vaut(q(2 ** Number(m[1])));
      if ((m = /compte (\d+) tours/.exec(prompt))) return vaut(q(2 ** Number(m[1])));
      break;

    // --- 4e, 2e trimestre ----------------------------------------------------------------------------------------------------------
    case 'vitesse-grandeurs-composees':
      if ((m = /roule à (\d+) km\/h pendant (.+)\. Quelle distance/.exec(prompt))) return vaut(q(Number(m[1]) * dureeEnMinutes(m[2]), 60), 'km');
      if ((m = /parcourt (\d+) km en (.+)\. Quelle est sa vitesse moyenne/.exec(prompt))) return vaut(q(Number(m[1]) * 60, dureeEnMinutes(m[2])), 'km/h');
      if ((m = /roule à (\d+) km\/h\. Combien de temps met-elle pour parcourir (\d+) km/.exec(prompt))) return vautLaDuree((Number(m[2]) * 60) / Number(m[1]));
      if ((m = /roule à (\d+) km\/h\. Quelle est sa vitesse en mètres par seconde/.exec(prompt))) return vaut(q(Number(m[1]) * 10, 36), 'm/s');
      if ((m = /se déplace à (\d+) m\/s\. Quelle est sa vitesse en kilomètres par heure/.exec(prompt))) return vaut(q(Number(m[1]) * 36, 10), 'km/h');
      break;
    case 'mise-en-equation':
      if ((m = /demande (\d+) € d'inscription, puis (\d+) € par mois\. .* a payé (\d+) € en tout/.exec(prompt))) return vaut(q(Number(m[3]) - Number(m[1]), Number(m[2])));
      if ((m = /périmètre de (\d+) cm\. Sa longueur dépasse sa largeur de (\d+) cm/.exec(prompt))) return vaut(q(Number(m[1]) / 2 - Number(m[2]), 2), 'cm');
      if ((m = /a (\d+) ans de plus .*\. À eux deux, ils ont (\d+) ans/.exec(prompt))) return vaut(q(Number(m[2]) - Number(m[1]), 2), 'ans');
      if ((m = /^La somme de trois nombres entiers consécutifs est (\d+)\./.exec(prompt))) return vaut(q(Number(m[1]) - 3, 3));
      if ((m = /^(\d+) cahiers identiques et un stylo à (.+) € coûtent (.+) € en tout/.exec(prompt))) return vaut(divQ(subQ(nombre(m[3]), nombre(m[2])), q(Number(m[1]))), '€');
      break;
    case 'deux-tarifs':
      if ((m = /tarif A est de (\d+) € d'abonnement, puis (\d+) € par .*\. Le tarif B est de (\d+) € par [^,]*, sans abonnement/.exec(prompt))) return vaut(q(Number(m[1]), Number(m[3]) - Number(m[2])));
      if ((m = /tarif A est de (\d+) € d'abonnement, puis (\d+) € par .*\. Le tarif B est de (\d+) € d'abonnement, puis (\d+) € par/.exec(prompt))) return vaut(q(Number(m[3]) - Number(m[1]), Number(m[2]) - Number(m[4])));
      break;
    case 'programme-inverse':
      if ((m = /^Programme de calcul : on choisit un nombre, (.+)\. On obtient (.+)\. Quel nombre a-t-on choisi \?$/.exec(prompt))) {
        // On retrouve le nombre de départ en essayant tous les entiers : un seul convient.
        const etapes = etapesDuProgramme(m[1]);
        const trouves = Array.from({ length: 201 }, (_, rang) => q(rang - 100)).filter((candidat) => eqQ(executerLeProgramme(etapes, candidat), nombre(m![2])));
        expect(trouves, prompt).toHaveLength(1);
        return vaut(trouves[0]);
      }
      break;
    case 'taux-evolution':
      if ((m = /passe de (.+) € à (.+) €\. Quel est le pourcentage/.exec(prompt))) return vaut(mulQ(divQ(absQ(subQ(nombre(m[2]), nombre(m[1]))), nombre(m[1])), q(100)), '%');
      break;

    // --- 4e, 3e trimestre ----------------------------------------------------------------------------------------------------------
    case 'probabilite-evenement':
      if ((m = /(?:parmi (\d+) cartes numérotées de 1 à \d+|contient (\d+) jetons numérotés de 1 à \d+)\..* d'obtenir (.+) \?$/.exec(prompt))) {
        const n = Number(m[1] ?? m[2]);
        return vautLaFraction(q(Array.from({ length: n }, (_, rang) => rang + 1).filter(predicatDe(m[3])).length, n));
      }
      break;
    case 'probabilite-contraire':
      if ((m = /est de (.+)\. Quelle est la probabilité qu'(?:il|elle) ne le réussisse pas/.exec(prompt))) return vautLaFraction(subQ(q(1), nombre(m[1])));
      if ((m = /est de (\d+)\/(\d+)\. Quelle est la probabilité de ne pas tirer/.exec(prompt))) return vautLaFraction(subQ(q(1), q(Number(m[1]), Number(m[2]))));
      if ((m = /annonce (\d+) % de chances de pluie/.exec(prompt))) return vaut(q(100 - Number(m[1])), '%');
      if ((m = /^Dans un sac de (\d+) jetons, (\d+) sont rouges\./.exec(prompt))) return vautLaFraction(q(Number(m[1]) - Number(m[2]), Number(m[1])));
      break;

    // --- 3e, 1er trimestre ------------------------------------------------------------------------------------------------------------
    case 'pgcd-contexte': {
      const [a, b] = entiers(prompt);
      return vaut(q(pgcdEntiers(a, b)), /centimètres/.test(prompt) ? 'cm' : '');
    }
    case 'puissances-de-dix-contexte': {
      const scientifiques = [...prompt.matchAll(/([\d,]+) × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)].map((trouve) => mulQ(nombre(trouve[1]), puissanceQ(q(10), exposantLu(trouve[2]))));
      if (/Une sonde spatiale/.test(prompt)) return vaut(divQ(scientifiques[1], scientifiques[0]), 'h');
      if (/Un disque dur/.test(prompt)) return vaut(divQ(scientifiques[0], scientifiques[1]));
      if ((m = /On rappelle que 1 (nm|mm) = 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+) m\./.exec(prompt))) return vaut(divQ(scientifiques[0], puissanceQ(q(10), exposantLu(m[2]))), m[1]);
      if (/Un grain de sable/.test(prompt)) return vaut(mulQ(scientifiques[0], scientifiques[1]), 'kg');
      break;
    }
    case 'carre-aire-racine':
      if ((m = /^L'aire d'un carré est de (\d+) (cm|m)²\. Quelle est la longueur de son côté/.exec(prompt))) return vaut(racineQ(q(Number(m[1])))!, m[2]);
      if ((m = /^L'aire d'un carré est de (\d+) cm²\. Quel est son périmètre/.exec(prompt))) return vaut(mulQ(racineQ(q(Number(m[1])))!, q(4)), 'cm');
      if ((m = /aire de (\d+) m²\. .* coûte (\d+) € le mètre/.exec(prompt))) return vaut(mulQ(mulQ(racineQ(q(Number(m[1])))!, q(4)), q(Number(m[2]))), '€');
      break;

    // --- 3e, 2e trimestre -------------------------------------------------------------------------------------------------------------
    case 'fonction-image-antecedent': {
      m = /f\(x\) = (.+?)\. Quel(?:le)? est (l'image|l'antécédent) de (.+?) par/.exec(prompt);
      if (!m) break;
      const f = (valeur: Q) => evaluerAvecLettres(m![1], { x: valeur });
      if (m[2] === "l'image") return vaut(f(nombre(m[3])));
      const cherche = nombre(m[3]);
      const trouves = Array.from({ length: 401 }, (_, rang) => q(rang - 200)).filter((candidat) => eqQ(f(candidat), cherche));
      expect(trouves, prompt).toHaveLength(1);
      return vaut(trouves[0]);
    }
    case 'lecture-graphique-fonction': {
      const { x, y } = graduationsDuRepere(figure!);
      const droite = droiteColoree(figure!);
      const [x1, y1, x2, y2] = [valeurApprochee(x, droite.from[0]), valeurApprochee(y, droite.from[1]), valeurApprochee(x, droite.to[0]), valeurApprochee(y, droite.to[1])];
      const pente = (y2 - y1) / (x2 - x1);
      const a = Math.round(pente);
      const b = Math.round(y1 - pente * x1);
      expect(Math.abs(pente - a), `le coefficient directeur se lit ${pente}`).toBeLessThan(0.06);
      expect(Math.abs(y1 - pente * x1 - b), `l'ordonnée à l'origine se lit ${y1 - pente * x1}`).toBeLessThan(0.1);
      if ((m = /Quelle est l'image de (.+) par f/.exec(prompt))) return vaut(q(a * Number(nombre(m[1]).n) + b));
      if ((m = /Quel est l'antécédent de (.+) par f/.exec(prompt))) return vaut(q(Number(nombre(m[1]).n) - b, a));
      if (/ordonnée à l'origine/.test(prompt)) return vaut(q(b));
      if (/coefficient directeur/.test(prompt)) return vaut(q(a));
      if (/Laquelle de ces expressions/.test(prompt)) {
        return (choix) => {
          const lu = /^f\(x\) = (.+)$/.exec(choix);
          return lu !== null && [-3, -1, 0, 2, 5].every((valeur) => eqQ(evaluerAvecLettres(lu[1], { x: q(valeur) }), q(a * valeur + b)));
        };
      }
      break;
    }
    case 'systeme-probleme': {
      if ((m = /(\d+) adultes? et (\d+) enfants? paient (\d+) €\. (\d+) adultes? et (\d+) enfants? paient (\d+) €\. Quel est (.+) \?$/.exec(prompt))) {
        const [n1, m1, t1, n2, m2, t2] = [m[1], m[2], m[3], m[4], m[5], m[6]].map(Number);
        const det = n1 * m2 - n2 * m1;
        const adulte = q(t1 * m2 - t2 * m1, det);
        const enfant = q(n1 * t2 - n2 * t1, det);
        return vaut(/adulte et d'un billet enfant/.test(m[7]) ? addQ(adulte, enfant) : /billet enfant/.test(m[7]) ? enfant : adulte, '€');
      }
      if ((m = /La somme de deux nombres est (\d+) et leur différence est (\d+)\. Quel est le (plus grand|plus petit)/.exec(prompt))) {
        const [s, d] = [Number(m[1]), Number(m[2])];
        return vaut(q(m[3] === 'plus grand' ? s + d : s - d, 2));
      }
      if ((m = /On compte (\d+) têtes et (\d+) pattes\. Combien y a-t-il de lapins/.exec(prompt))) return vaut(q(Number(m[2]) - 2 * Number(m[1]), 2));
      break;
    }
    case 'inequation-probleme':
      if ((m = /a (\d+) €\. Un livre coûte (\d+) €\./.exec(prompt))) return vaut(q(Math.floor(Number(m[1]) / Number(m[2]))));
      if ((m = /facture (\d+) € de prise en charge, puis (\d+) € par kilomètre\. .* dispose de (\d+) €/.exec(prompt))) return vaut(q(Math.floor((Number(m[3]) - Number(m[1])) / Number(m[2]))));
      if ((m = /gagner au moins (\d+) €\. Elle a dépensé (\d+) € .* vend (\d+) € chacun/.exec(prompt))) return vaut(q(Math.ceil((Number(m[1]) + Number(m[2])) / Number(m[3]))));
      break;
    case 'debit-masse-volumique':
      if ((m = /débit de (\d+) L par minute\. .* cuve de (\d+) L/.exec(prompt))) return vautLaDuree(Number(m[2]) / Number(m[1]));
      if ((m = /débite (\d+) m³ par heure\. .* en (\d+) heures/.exec(prompt))) return vaut(q(Number(m[1]) * Number(m[2])), 'm³');
      if ((m = /débit de (\d+) litres par minute correspond/.exec(prompt))) return vaut(q(Number(m[1]) * 60), 'L/h');
      if ((m = /de (\d+) cm³ a une masse de (.+) g\. .* masse volumique/.exec(prompt))) return vaut(divQ(nombre(m[2]), q(Number(m[1]))), 'g/cm³');
      if ((m = /masse volumique d'un matériau est de (.+) g\/cm³\. .* masse de (\d+) cm³/.exec(prompt))) return vaut(mulQ(nombre(m[1]), q(Number(m[2]))), 'g');
      break;

    // --- 3e, 3e trimestre ---------------------------------------------------------------------------------------------------------------
    case 'agrandissement-reduction':
      if ((m = /aire de (\d+) cm²\. On l'agrandit avec un rapport de (\d+)\./.exec(prompt))) return vaut(q(Number(m[1]) * Number(m[2]) ** 2), 'cm²');
      if ((m = /volume de (\d+) cm³\. On l'agrandit avec un rapport de (\d+)\./.exec(prompt))) return vaut(q(Number(m[1]) * Number(m[2]) ** 3), 'cm³');
      if ((m = /aire de (\d+) cm²\. On la réduit avec un rapport de 1\/(\d+)\./.exec(prompt))) return vaut(q(Number(m[1]), Number(m[2]) ** 2), 'cm²');
      if ((m = /volume de (\d+) cm³\. On le réduit avec un rapport de 1\/(\d+)\./.exec(prompt))) return vaut(q(Number(m[1]), Number(m[2]) ** 3), 'cm³');
      if ((m = /^Les longueurs d'une figure sont multipliées par (\d+)\. .* son aire/.exec(prompt))) return vaut(q(Number(m[1]) ** 2));
      if ((m = /^Les longueurs d'un solide sont multipliées par (\d+)\. .* son volume/.exec(prompt))) return vaut(q(Number(m[1]) ** 3));
      break;
    case 'mediane-etendue': {
      const liste = /(\d+(?:, \d+)* et \d+)\./.exec(prompt);
      expect(liste, prompt).not.toBeNull();
      const tries = entiers(liste![1]).sort((a, b) => a - b);
      const n = tries.length;
      if (/médiane/.test(prompt)) return vaut(n % 2 === 1 ? q(tries[(n - 1) / 2]) : q(tries[n / 2 - 1] + tries[n / 2], 2));
      return vaut(q(tries[n - 1] - tries[0]));
    }
    case 'probabilite-deux-epreuves': {
      if ((m = /somme égale à (\d+)/.exec(prompt))) {
        const paires = [1, 2, 3, 4, 5, 6].flatMap((a) => [1, 2, 3, 4, 5, 6].map((b) => a + b));
        return vautLaFraction(q(paires.filter((somme) => somme === Number(m![1])).length, 36));
      }
      if ((m = /pièce équilibrée\. Quelle est la probabilité d'obtenir (.+) \?$/.exec(prompt))) {
        const resultats = ['P', 'F'].flatMap((premier) => ['P', 'F'].map((second) => `${premier}${second}`));
        const evenements: Record<string, (r: string) => boolean> = {
          'face deux fois': (r) => r === 'FF',
          'pile deux fois': (r) => r === 'PP',
          'une fois pile et une fois face, dans un ordre quelconque': (r) => r === 'PF' || r === 'FP',
          'au moins une fois face': (r) => r.includes('F'),
          'deux résultats identiques': (r) => r[0] === r[1],
          'pile au premier lancer et face au second': (r) => r === 'PF',
        };
        const predicat = evenements[m[1]];
        expect(predicat, m[1]).toBeDefined();
        return vautLaFraction(q(resultats.filter(predicat).length, 4));
      }
      if ((m = /contient (\d+) boules rouges et (\d+) boules vertes\. On tire une boule, (on la remet dans le sac|sans la remettre), puis .* d'obtenir (deux boules rouges|une boule rouge au premier tirage, puis une boule verte au second) \?$/.exec(prompt))) {
        const [rouges, vertes] = [Number(m[1]), Number(m[2])];
        const sacs = [...Array.from({ length: rouges }, () => 'R'), ...Array.from({ length: vertes }, () => 'V')];
        const avecRemise = m[3] !== 'sans la remettre';
        let favorables = 0;
        let possibles = 0;
        sacs.forEach((premiere, i) =>
          sacs.forEach((seconde, j) => {
            if (!avecRemise && i === j) return;
            possibles += 1;
            if (m![4] === 'deux boules rouges' ? premiere === 'R' && seconde === 'R' : premiere === 'R' && seconde === 'V') favorables += 1;
          })
        );
        return vautLaFraction(q(favorables, possibles));
      }
      break;
    }
    case 'evolutions-successives':
      if ((m = /^Le prix d'un .+ (augmente|baisse) de (\d+) %, puis (augmente|baisse) de (\d+) %\. (.+)$/.exec(prompt))) {
        const [c1, c2] = [q(100 + (m[1] === 'augmente' ? 1 : -1) * Number(m[2]), 100), q(100 + (m[3] === 'augmente' ? 1 : -1) * Number(m[4]), 100)];
        const global = mulQ(c1, c2);
        const depart = /Le prix de départ est de (.+) €\./.exec(m[5]);
        if (depart) return vaut(mulQ(nombre(depart[1]), global), '€');
        return vaut(mulQ(subQ(global, q(1)), q(100)), '%');
      }
      break;
  }
  throw new Error(`Aucun juge pour ${nom} : ${prompt}`);
}

// === Les contrôles ===================================================================================================================

describe('les problèmes de la 5e, de la 4e et de la 3e', () => {
  it('ont quatre propositions différentes, une consigne et une explication', () => {
    parCellule((level, trimester) => questions(level, trimester, 12)).forEach(({ level, trimester, valeur }) => {
      expect(valeur.length, `${level} T${trimester}`).toBe(12 * GRAINES);
      valeur.forEach((question) => {
        expect(question.domain).toBe('problemes');
        expect(question.choices, question.prompt).toHaveLength(4);
        expect(new Set(question.choices).size, question.prompt).toBe(4);
        expect(question.choices[question.correctIndex], question.prompt).toBeDefined();
        expect(question.instruction, question.prompt).toBeTruthy();
        expect(question.explanation, question.prompt).toBeTruthy();
      });
    });
  });

  it('sont reproductibles à graine égale', () => {
    NIVEAUX.forEach((level) => expect(generate(level, 3, createRng(9), 20)).toEqual(generate(level, 3, createRng(9), 20)));
  });

  it('proposent la bonne réponse, refaite à partir de l\'énoncé et de la figure, et aucune autre qui la vaille', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) =>
      valeur.forEach((question) => {
        const justes = question.choices.filter(jugeDe(question));
        expect(justes, `${level} T${trimester} : ${question.prompt} → ${question.choices.join(' | ')}`).toEqual([question.choices[question.correctIndex]]);
      })
    );
  });

  it('ne laissent sortir aucune sorte hors de son étape', () => {
    parCellule((level, trimester) => {
      const vues = new Set(questions(level, trimester, 24, 80).map(briqueDe));
      const attendues = availableAt(BRIQUES_PROBLEMES_CYCLE4, stageOf(level, trimester)).map((brique) => brique.name);
      return { vues, attendues };
    }).forEach(({ level, trimester, valeur }) => expect([...valeur.vues].sort(), `${level} T${trimester}`).toEqual([...valeur.attendues].sort()));
  });

  it('apportent du nouveau à chaque trimestre : au moins deux sortes, et dix au premier de la 5e', () => {
    const noms = BRIQUES_PROBLEMES_CYCLE4.map((brique) => brique.name);
    expect(new Set(noms).size).toBe(noms.length);
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        expect(BRIQUES_PROBLEMES_CYCLE4.filter((brique) => brique.minStage === stageOf(level, trimester)).length, `${level} T${trimester}`).toBeGreaterThanOrEqual(2)
      )
    );
    expect(BRIQUES_PROBLEMES_CYCLE4.filter((brique) => brique.minStage === stageOf('5e', 1)).length).toBeGreaterThanOrEqual(10);
  });

  it('dessinent des figures qui tiennent dans leur cadre et dont la description ne donne pas la réponse', () => {
    parCellule((level, trimester) => questions(level, trimester, 24, 20)).forEach(({ valeur }) =>
      valeur
        .filter((question) => question.figure)
        .forEach((question) => {
          expect(fitsInFrame(question.figure!), question.prompt).toBe(true);
          expect(question.figure!.alt, question.prompt).toBeTruthy();
          // La description ne contient pas la bonne réponse écrite comme telle.
          const juste = question.choices[question.correctIndex];
          if (/^\d+$/.test(juste) && juste.length > 1) expect(question.figure!.alt, question.prompt).not.toContain(juste);
        })
    );
  });
});

describe('ce que les problèmes du collège ne disent pas avant leur heure', () => {
  const textes_ = (question: Question) => [question.instruction ?? '', question.prompt, ...question.choices, question.explanation ?? ''].join(' ');
  const cellule = (level: Level, trimester: Trimester) => questions(level, trimester, 24, 40);
  const sortes = (level: Level, trimester: Trimester) => new Set(cellule(level, trimester).map(briqueDe));

  it('ne multiplie ni ne divise de relatifs en 5e : les programmes de calcul restent positifs', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      cellule('5e', trimester).forEach((question) => {
        expect(question.prompt, question.prompt).not.toMatch(/choisit −/);
        expect(question.prompt, question.prompt).not.toMatch(/\(−[\d,]+\)\s*[×÷]|[×÷]\s*\(−[\d,]+\)/);
        if (briqueDe(question) === 'programme-de-calcul') question.choices.forEach((choix) => expect(choix, question.prompt).not.toMatch(/^−/));
      })
    );
  });

  it('garde pour la 4e les produits de relatifs, les puissances, les échelles et les évolutions en pourcentage', () => {
    const cinquieme = new Set(ALL_TRIMESTERS.flatMap((trimester) => [...sortes('5e', trimester)]));
    ['produit-relatifs-contexte', 'puissances-situation', 'echelle-conversion', 'pourcentage-evolution', 'fraction-de-fraction', 'vitesse-grandeurs-composees', 'mise-en-equation'].forEach((nom) => expect(cinquieme.has(nom), nom).toBe(false));
    ['produit-relatifs-contexte', 'puissances-situation', 'echelle-conversion', 'pourcentage-evolution', 'fraction-de-fraction'].forEach((nom) => expect(sortes('4e', 1).has(nom), nom).toBe(true));
  });

  it('garde pour la 3e le PGCD, la notation scientifique, les fonctions, les systèmes, les inéquations, la médiane et les deux épreuves', () => {
    const avant3e = new Set(['5e', '4e'].flatMap((level) => ALL_TRIMESTERS.flatMap((trimester) => [...sortes(level as Level, trimester)])));
    const propres = ['pgcd-contexte', 'puissances-de-dix-contexte', 'carre-aire-racine', 'fonction-image-antecedent', 'lecture-graphique-fonction', 'systeme-probleme', 'inequation-probleme', 'debit-masse-volumique', 'agrandissement-reduction', 'mediane-etendue', 'probabilite-deux-epreuves', 'evolutions-successives'];
    propres.forEach((nom) => expect(avant3e.has(nom), nom).toBe(false));
    const troisieme = new Set(ALL_TRIMESTERS.flatMap((trimester) => [...sortes('3e', trimester)]));
    propres.forEach((nom) => expect(troisieme.has(nom), nom).toBe(true));
  });

  it('n\'emploie ni racine carrée, ni fonction, ni système, ni inéquation, ni PGCD, ni médiane avant la 3e', () => {
    (['5e', '4e'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        cellule(level, trimester).forEach((question) => {
          expect(textes_(question), question.prompt).not.toMatch(/√|f\(x\)|fonction|antécédent|système|inéquation|PGCD|médiane|étendue|agrandi|réduit avec|notation scientifique/);
        })
      )
    );
  });

  it('ne parle pas de probabilité avant le 3e trimestre de la 5e, ni de pourcentage de réduction avant le 2e', () => {
    [1, 2].forEach((trimester) => cellule('5e', trimester as Trimester).forEach((question) => expect(textes_(question), question.prompt).not.toMatch(/probabilité/)));
    cellule('5e', 1).forEach((question) => expect(textes_(question), question.prompt).not.toMatch(/réduction/));
  });

  it('écrit les nombres à la française : virgule décimale, vrai signe moins, jamais de LaTeX ni de balise', () => {
    parCellule((level, trimester) => cellule(level, trimester)).forEach(({ valeur }) =>
      valeur.forEach((question) => {
        const lot = [question.instruction ?? '', question.prompt, ...question.choices, question.explanation ?? ''];
        lot.forEach((texte) => {
          expect(texte, texte).not.toMatch(/\d\.\d/);
          expect(texte, texte).not.toMatch(/(^|[\s(])-\d/);
          expect(texte, texte).not.toMatch(/[\^\\${}]|<\/?[a-z]/i);
          expect(texte, texte).not.toMatch(/NaN|undefined|Infinity/);
        });
      })
    );
  });
});
