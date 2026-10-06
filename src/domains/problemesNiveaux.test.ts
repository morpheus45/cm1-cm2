import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { parseFrenchNumber } from '../lib/classProblems';
import { fitsInFrame, type Figure, type Shape } from '../lib/figures';
import { availableAt, stageOf } from '../lib/progression';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { eligibleTemplateCount, generate } from './problemes';
import { BRIQUES_CYCLE2, PAIRES, PAIRES_GRANDES } from './problemesCycle2';
import { BRIQUES_SIXIEME } from './problemesSixieme';
import { ARTICLES_A_PRIX, THEMES } from './problemesCommun';

/**
 * Les problèmes du CE1, du CE2 et de la 6e : chaque question est refaite ici
 * à partir de son énoncé — et, quand il y en a un, de son dessin lu comme
 * l'élève le lit —, par un calcul qui n'a rien à voir avec celui du
 * générateur, puis comparée à la bonne réponse proposée et aux trois autres,
 * qui ne doivent pas la valoir.
 */

const NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const GRAINES = 60;

function questions(level: Level, trimester: Trimester, count = 24, seeds = GRAINES): Question[] {
  return Array.from({ length: seeds }, (_, seed) => generate(level, trimester, createRng(seed * 31 + 5), count)).flat();
}

const parCellule = <T>(faire: (level: Level, trimester: Trimester) => T) =>
  NIVEAUX.flatMap((level) => ALL_TRIMESTERS.map((trimester) => ({ level, trimester, valeur: faire(level, trimester) })));

/** La brique qui a fabriqué la question : son nom est dans l'identifiant, « problemes-nom-rang-détail ». */
const MOTIFS_DES_BRIQUES = {
  cycle2: BRIQUES_CYCLE2.map((brique) => ({ nom: brique.name, motif: new RegExp(`^problemes-${brique.name}-\\d+-`) })),
  sixieme: BRIQUES_SIXIEME.map((brique) => ({ nom: brique.name, motif: new RegExp(`^problemes-${brique.name}-\\d+-`) })),
};

function briqueDe(question: Question, level: Level): string {
  const trouves = MOTIFS_DES_BRIQUES[level === '6e' ? 'sixieme' : 'cycle2'].filter(({ motif }) => motif.test(question.id));
  if (trouves.length !== 1) throw new Error(`${question.id} : ${trouves.length} sortes de question possibles`);
  return trouves[0].nom;
}

// --- Lire le texte et le dessin ----------------------------------------------------------------

const nombresDe = (texte: string): number[] => (texte.match(/\d+(?:,\d+)?/g) ?? []).map((nombre) => parseFrenchNumber(nombre) as number);

const egal = (a: number, b: number) => Math.abs(a - b) < 1e-9;

type Texte = Extract<Shape, { kind: 'text' }>;
const textesDe = (figure: Figure): Texte[] => figure.shapes.filter((forme): forme is Texte => forme.kind === 'text');

/** Un tableau à deux colonnes : [catégorie, nombre]. */
function lireTableau(figure: Figure): [string, number][] {
  const lignes = textesDe(figure).slice(2);
  return Array.from({ length: lignes.length / 2 }, (_, index) => [lignes[2 * index].text, Number(lignes[2 * index + 1].text)] as [string, number]);
}

/** Un pictogramme : chaque rond vaut ce que dit la légende. */
function lirePictogramme(figure: Figure): [string, number][] {
  const textes = textesDe(figure);
  const legende = textes.find((texte) => texte.text.startsWith('= '));
  const valeurDuRond = Number(/^= (\d+)/.exec(legende!.text)![1]);
  const ronds = figure.shapes.filter((forme) => forme.kind === 'circle' && forme.fill === true && forme.center[0] >= 100);
  return textes
    .filter((texte) => texte.at[0] === 14)
    .map((texte) => [texte.text, valeurDuRond * ronds.filter((rond) => rond.kind === 'circle' && rond.center[1] === texte.at[1] - 5).length] as [string, number]);
}

/** Un diagramme en barres : la hauteur de chaque barre, lue sur les graduations. */
function lireBarres(figure: Figure): [string, number][] {
  const textes = textesDe(figure);
  const graduations = textes.filter((texte) => texte.anchor === 'end' && /^\d+$/.test(texte.text)).map((texte) => ({ y: texte.at[1] - 4.5, valeur: Number(texte.text) }));
  const noms = textes.filter((texte) => texte.anchor === 'middle').sort((a, b) => a.at[0] - b.at[0]);
  const barres = figure.shapes.filter((forme) => forme.kind === 'aire').sort((a, b) => (a.kind === 'aire' && b.kind === 'aire' ? a.rings[0][0][0] - b.rings[0][0][0] : 0));
  return barres.map((barre, index) => {
    if (barre.kind !== 'aire') throw new Error('barre attendue');
    const haut = barre.rings[0][1][1];
    const graduation = graduations.find((candidate) => Math.abs(candidate.y - haut) < 0.2);
    if (!graduation) throw new Error(`Aucune graduation à la hauteur ${haut}`);
    return [noms[index].text, graduation.valeur] as [string, number];
  });
}

/** Un tableau à double entrée ou de proportionnalité : des rangs de textes, du haut vers le bas. */
function lireGrille(figure: Figure): { nom: string | null; valeurs: string[] }[] {
  const parY = new Map<number, Texte[]>();
  textesDe(figure).forEach((texte) => parY.set(texte.at[1], [...(parY.get(texte.at[1]) ?? []), texte]));
  return [...parY.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, textes]) => {
      const tries = [...textes].sort((a, b) => a.at[0] - b.at[0]);
      const nom = tries.find((texte) => texte.anchor === undefined);
      return { nom: nom ? nom.text : null, valeurs: tries.filter((texte) => texte.anchor === 'middle').map((texte) => texte.text) };
    });
}

// --- Les durées et les heures ------------------------------------------------------------------

/** « 14 h 25 », « 2 h 40 min », « 3 h », « 35 min », « 1 h 30 » : des minutes. */
function minutesDe(texte: string): number {
  const heure = /^(\d+) h(?: (\d+)(?: min)?)?$/.exec(texte);
  if (heure) return Number(heure[1]) * 60 + Number(heure[2] ?? 0);
  const minutes = /^(\d+) min$/.exec(texte);
  if (minutes) return Number(minutes[1]);
  if (texte === 'une demi-heure') return 30;
  if (texte === "un quart d'heure") return 15;
  throw new Error(`Durée ou heure non reconnue : « ${texte} »`);
}

const heureDansLEnonce = (heure: string, minutes: string | undefined) => Number(heure) * 60 + Number(minutes ?? 0);

// --- Le résultat attendu -----------------------------------------------------------------------------

type Attendu =
  | { genre: 'nombre'; valeur: number; unite?: string }
  | { genre: 'minutes'; valeur: number }
  | { genre: 'texte'; valeur: string }
  | { genre: 'fraction'; n: number; d: number }
  | { genre: 'chances'; a: number; b: number };

const nombre = (valeur: number, unite?: string): Attendu => ({ genre: 'nombre', valeur, unite });

const UNITE = /\d(?:,\d+)? (€|kg|km|cm|cL|dm|m|L|g|t)(?![\p{L}²³])/u;
const uniteDe = (prompt: string) => UNITE.exec(prompt)?.[1];

const SORTENT = /(\d+) (descendent|partent|sortent)\b/g;
const ENTRENT = /(\d+) (montent|arrivent|entrent)\b/g;

/** Les personnes qui arrivent et celles qui partent : le solde, à partir du nombre de départ. */
function solde(prompt: string): number {
  const [depart] = nombresDe(prompt);
  const sorties = [...prompt.matchAll(SORTENT)].reduce((somme, m) => somme + Number(m[1]), 0);
  const entrees = [...prompt.matchAll(ENTRENT)].reduce((somme, m) => somme + Number(m[1]), 0);
  return depart - sorties + entrees;
}

const FRACTIONS_DITES: Record<string, [number, number]> = {
  'la moitié': [1, 2],
  'le tiers': [1, 3],
  'le quart': [1, 4],
  'le cinquième': [1, 5],
  'le sixième': [1, 6],
  'le huitième': [1, 8],
  'le dixième': [1, 10],
};

/** La fraction d'une phrase : « le quart », « les 3/4 ». */
function fractionDite(prompt: string): [number, number] {
  const mot = Object.keys(FRACTIONS_DITES).find((candidat) => prompt.includes(candidat));
  if (mot) return FRACTIONS_DITES[mot];
  const m = /les (\d+)\/(\d+)/.exec(prompt);
  if (!m) throw new Error(`Fraction non reconnue : « ${prompt} »`);
  return [Number(m[1]), Number(m[2])];
}

const NOMS_DES_POLYGONES: Record<string, number> = { 'triangle équilatéral': 3, 'pentagone régulier': 5, 'hexagone régulier': 6, 'octogone régulier': 8 };

const nomDeLaCategorie = (dit: string): string => {
  const trouve = THEMES.flatMap((theme) => theme.items).find((item) => item.dit === dit);
  if (!trouve) throw new Error(`Catégorie inconnue : « ${dit} »`);
  return trouve.nom;
};

/** Les problèmes de lecture : un tableau, un pictogramme ou un diagramme, et ce qu'on y lit. */
function donnees(question: Question, lecture: (figure: Figure) => [string, number][]): Attendu {
  const valeurs = lecture(question.figure!);
  const valeur = (dit: string) => valeurs.find(([nom]) => nom === nomDeLaCategorie(dit))![1];
  let m: RegExpExecArray | null;
  if ((m = /^Combien d'\S+ de plus ont choisi (.+) que (.+) \?$/.exec(question.prompt))) return nombre(valeur(m[1]) - valeur(m[2]));
  if ((m = /^Combien d'\S+ ont choisi (.+) ou (.+) \?$/.exec(question.prompt))) return nombre(valeur(m[1]) + valeur(m[2]));
  if ((m = /^Combien d'\S+ ont choisi (.+) \?$/.exec(question.prompt))) return nombre(valeur(m[1]));
  if (THEMES.some((theme) => theme.leMieuxClasse === question.prompt)) {
    const meilleur = valeurs.reduce((a, b) => (b[1] > a[1] ? b : a));
    return { genre: 'texte', valeur: meilleur[0] };
  }
  throw new Error(`Question de lecture non reconnue : « ${question.prompt} »`);
}

const ORACLES: Record<string, (question: Question) => Attendu> = {
  // --- CE1, 1er trimestre
  ajout: ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return nombre(a + b);
  },
  retrait: ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return nombre(a - b);
  },
  reunion: ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return nombre(a + b);
  },
  complement: ({ prompt }) => {
    const [total, partie] = nombresDe(prompt);
    return nombre(total - partie);
  },
  ecart: ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return nombre(a - b);
  },
  comparaison: ({ prompt }) => {
    const [a, k] = nombresDe(prompt);
    return nombre(prompt.includes('de plus') ? a + k : a - k);
  },
  argent: ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    // Une différence de prix ne dépend pas de l'ordre où les deux prix sont dits.
    return nombre(prompt.includes('pour les deux') ? a + b : Math.abs(a - b), '€');
  },
  longueurs: ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return nombre(prompt.includes('bout à bout') ? a + b : a - b, 'cm');
  },
  jours: ({ prompt }) => {
    const [, premier, second] = nombresDe(prompt);
    if (prompt.includes('Combien de semaines')) return nombre(premier / 7);
    return nombre(/ et \d+ jours? \?$/.test(prompt) ? 7 * premier + second : 7 * premier);
  },
  tableau: (question) => donnees(question, lireTableau),
  pictogramme: (question) => donnees(question, lirePictogramme),
  // --- CE1, 2e trimestre
  groupements: ({ prompt }) => {
    const [k, n] = nombresDe(prompt);
    return nombre(k * n);
  },
  rangees: ({ prompt }) => {
    const [lignes, colonnes] = nombresDe(prompt);
    return nombre(lignes * colonnes);
  },
  chacun: ({ prompt }) => {
    const [n, k] = nombresDe(prompt);
    return nombre(n * k);
  },
  duree: ({ prompt }) => {
    const m = /commence à (\d+) h(?: (\d\d))?\. Il dure (.+)\. À quelle heure/.exec(prompt)!;
    return { genre: 'minutes', valeur: heureDansLEnonce(m[1], m[2]) + minutesDe(m[3]) };
  },
  masses: ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    if (prompt.includes('pèse-t-')) return nombre(a - b, 'kg');
    if (prompt.includes('les deux sacs')) return nombre(a + b, 'kg');
    return nombre(a * b, 'g');
  },
  contenances: ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return nombre(prompt.includes('On y verse') ? a + b : a - b, 'L');
  },
  diagramme: (question) => donnees(question, lireBarres),
  // --- CE1, 3e trimestre
  'deux-etapes': ({ prompt }) => {
    const n = nombresDe(prompt);
    if (prompt.includes('billet de')) return nombre(n[2] - n[0] * n[1], '€');
    if (prompt.includes('de plus.')) return nombre(n[0] * n[1] + n[2]);
    return nombre(solde(prompt));
  },
  partage: ({ prompt }) => {
    const [total, k] = nombresDe(prompt);
    return nombre(total / k);
  },
  rendu: ({ prompt }) => {
    const [prix, billet] = nombresDe(prompt);
    return nombre(billet - prix, '€');
  },
  // --- CE2, 1er trimestre
  'deux-etapes-ce2': ({ prompt }) => nombre(solde(prompt)),
  'prix-decimaux': ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return nombre(prompt.includes('pour les deux') ? a + b : a - b, '€');
  },
  'duree-minutes': ({ prompt }) => {
    const fin = /commence à (\d+) h(?: (\d\d))?\. Il finit à (\d+) h(?: (\d\d))?\./.exec(prompt);
    if (fin) return { genre: 'minutes', valeur: heureDansLEnonce(fin[3], fin[4]) - heureDansLEnonce(fin[1], fin[2]) };
    const duree = /commence à (\d+) h(?: (\d\d))?\. Il dure (\d+) minutes\./.exec(prompt)!;
    return { genre: 'minutes', valeur: heureDansLEnonce(duree[1], duree[2]) + Number(duree[3]) };
  },
  'longueurs-ce2': ({ prompt }) => {
    const [metres, centimetres] = nombresDe(prompt);
    return nombre(prompt.includes('longueur totale') ? metres * 100 + centimetres : metres * 100 - centimetres, 'cm');
  },
  // --- CE2, 2e trimestre
  'fois-plus': ({ prompt }) => {
    const [a, k] = nombresDe(prompt);
    return nombre(a * k);
  },
  'grand-produit': ({ prompt }) => {
    const [groupes, par] = nombresDe(prompt);
    return nombre(groupes * par);
  },
  'fraction-pb': ({ prompt }) => {
    const [total] = nombresDe(prompt);
    const [n, d] = fractionDite(prompt);
    return nombre((total * n) / d);
  },
  'masses-ce2': ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return prompt.includes('en grammes') ? nombre(a * 1000 + b, 'g') : nombre(a * 1000 - b, 'kg');
  },
  'contenances-ce2': ({ prompt }) => {
    const [litres, cl] = nombresDe(prompt);
    return nombre(prompt.includes('On y ajoute') ? litres * 100 + cl : litres * 100 - cl, 'cL');
  },
  'diagramme-completer': (question) => {
    const visibles = lireBarres(question.figure!).reduce((somme, [, valeur]) => somme + valeur, 0);
    const [total] = nombresDe(question.prompt);
    return nombre(total - visibles);
  },
  // --- CE2, 3e trimestre
  'reste-division': ({ prompt }) => {
    const [total, k] = nombresDe(prompt);
    if (prompt.includes('complètement')) return nombre(Math.floor(total / k));
    if (prompt.includes('reste-t-il')) return nombre(total % k);
    return nombre(Math.ceil(total / k));
  },
  'trois-etapes': ({ prompt }) => {
    const [n, a, m, b, billet] = nombresDe(prompt);
    return nombre(billet - n * a - m * b, '€');
  },
  'rendu-decimal': ({ prompt }) => {
    const n = nombresDe(prompt);
    // En 6e, « achète 3 cahiers à 2,40 € chacun » ; au CE2, « achète une règle à 16,80 € ».
    return n.length === 3 ? nombre(n[2] - n[0] * n[1], '€') : nombre(n[1] - n[0], '€');
  },
  'duree-heures-minutes': ({ prompt }) => {
    const m = /part à (\d+) h(?: (\d\d))?\. Il dure (\d+) h (\d+) min\./.exec(prompt)!;
    return { genre: 'minutes', valeur: heureDansLEnonce(m[1], m[2]) + Number(m[3]) * 60 + Number(m[4]) };
  },
  'fraction-reste': ({ prompt }) => {
    const [total] = nombresDe(prompt);
    const [n, d] = fractionDite(prompt);
    return nombre(total - (total * n) / d);
  },
  // --- 6e, 1er trimestre
  'decimaux-additif': ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return nombre(a + b, uniteDe(prompt));
  },
  'decimaux-soustractif': ({ prompt }) => {
    const [a, b] = nombresDe(prompt);
    return prompt.includes('billet de') ? nombre(b - a, '€') : nombre(a - b, uniteDe(prompt));
  },
  'decimaux-fois-entier': ({ prompt }) => {
    const [a, n] = nombresDe(prompt);
    return nombre(a * n, uniteDe(prompt));
  },
  'deux-etapes-entiers': ({ prompt }) => {
    const n = nombresDe(prompt);
    if (prompt.includes('salle de cinéma')) return nombre(n[0] * n[1] - n[2]);
    if (prompt.includes('libraire')) return nombre(n[0] * n[1] + n[2]);
    if (prompt.includes('partagent toutes leurs billes')) return nombre((n[0] + n[1]) / n[2]);
    return nombre((n[0] - n[1]) / n[2]);
  },
  'division-partage': ({ prompt }) => {
    const [total, k] = nombresDe(prompt);
    return nombre(total / k);
  },
  inconnu: ({ prompt }) => {
    const [premier, second] = nombresDe(prompt);
    if (prompt.includes('en gagne')) return nombre(second - premier);
    if (prompt.includes('Il lui reste')) return nombre(premier - second, '€');
    if (prompt.includes('amis paient')) return nombre(second / premier, '€');
    return nombre(second / premier);
  },
  horaires: ({ prompt }) => {
    const arrivee = /part à (\d+) h(?: (\d\d))?\. Le trajet dure (.+)\. À quelle heure/.exec(prompt);
    if (arrivee) return { genre: 'minutes', valeur: heureDansLEnonce(arrivee[1], arrivee[2]) + minutesDe(arrivee[3]) };
    const duree = /commence à (\d+) h(?: (\d\d))?\. Il finit à (\d+) h(?: (\d\d))?\./.exec(prompt);
    if (duree) return { genre: 'minutes', valeur: heureDansLEnonce(duree[3], duree[4]) - heureDansLEnonce(duree[1], duree[2]) };
    const depart = /arrive à (\d+) h(?: (\d\d))? après (.+) de route/.exec(prompt)!;
    return { genre: 'minutes', valeur: heureDansLEnonce(depart[1], depart[2]) - minutesDe(depart[3]) };
  },
  perimetre: ({ prompt }) => {
    const unite = uniteDe(prompt);
    const polygone = Object.keys(NOMS_DES_POLYGONES).find((nom) => prompt.includes(nom));
    const n = nombresDe(prompt);
    if (polygone) return nombre(NOMS_DES_POLYGONES[polygone] * n[0], unite);
    if (prompt.includes('carré')) return nombre(4 * n[0], unite);
    return nombre(2 * (n[0] + n[1]), unite);
  },
  'tableau-6e': (question) => donnees(question, lireTableau),
  'diagramme-6e': (question) => donnees(question, lireBarres),
  // --- 6e, 2e trimestre
  'division-euclidienne': ({ prompt }) => {
    const [total, k] = nombresDe(prompt);
    if (prompt.includes('complets')) return nombre(Math.floor(total / k));
    if (prompt.includes('reste-t-il')) return nombre(total % k);
    return nombre(Math.ceil(total / k));
  },
  'fraction-de-quantite': ({ prompt }) => {
    const [total] = nombresDe(prompt);
    const [n, d] = fractionDite(prompt);
    return nombre((total * n) / d);
  },
  'reste-fraction': ({ prompt }) => {
    const [total] = nombresDe(prompt);
    const [n, d] = fractionDite(prompt);
    return nombre(total - (total * n) / d);
  },
  'fractions-somme': ({ prompt }) => {
    const fractions = [...prompt.matchAll(/(\d+)\/(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    if (prompt.includes('Il restait')) return { genre: 'fraction', n: fractions[0][0] - fractions[1][0], d: fractions[0][1] };
    if (prompt.includes('mangée')) return { genre: 'fraction', n: fractions[0][0] + fractions[1][0], d: fractions[0][1] };
    return { genre: 'fraction', n: fractions[0][1] - fractions[0][0], d: fractions[0][1] };
  },
  'pourcentage-simple': ({ prompt }) => pourcentage(prompt),
  'produit-decimaux': ({ prompt }) => {
    const n = nombresDe(prompt);
    if (prompt.includes('aire')) return nombre(n[0] * n[1], 'm²');
    return nombre(n[0] * n[1], '€');
  },
  'aire-rectangle': ({ prompt }) => {
    const unite = uniteDe(prompt);
    const n = nombresDe(prompt);
    return nombre(prompt.includes('carré') ? n[0] * n[0] : n[0] * n[1], `${unite}²`);
  },
  'aire-conversion': ({ prompt }) => {
    const [longueur, largeur] = nombresDe(prompt);
    const unite = /en (cm²|dm²) \?$/.exec(prompt)![1];
    return nombre(longueur * largeur * 100, unite);
  },
  'horaires-etapes': ({ prompt }) => {
    let m: RegExpExecArray | null;
    if ((m = /part à (\d+) h(?: (\d\d))?\. \S+ marche (\d+) min, puis prend le bus (\d+) min\./.exec(prompt))) {
      return { genre: 'minutes', valeur: heureDansLEnonce(m[1], m[2]) + Number(m[3]) + Number(m[4]) };
    }
    if ((m = /Un film dure (.+)\. La publicité avant le film dure (\d+) min\./.exec(prompt))) return { genre: 'minutes', valeur: minutesDe(m[1]) + Number(m[2]) };
    m = /commence à (\d+) h(?: (\d\d))?\. Il dure (\d+) min, puis il y a (\d+) min de pause, puis (\d+) min de travail\./.exec(prompt)!;
    return { genre: 'minutes', valeur: heureDansLEnonce(m[1], m[2]) + Number(m[3]) + Number(m[4]) + Number(m[5]) };
  },
  'double-entree': (question) => {
    const [entetes, ...lignes] = lireGrille(question.figure!);
    const dansLEnonce = (nom: string) => question.prompt.toLowerCase().includes(nom.toLowerCase());
    if (question.prompt.includes('point d\'interrogation')) {
      const [, total] = /(\d+) (?:articles|fruits|élèves)/.exec(question.prompt)!;
      const ligne = lignes.find((candidate) => candidate.valeurs.includes('?'))!;
      const autres = ligne.valeurs.filter((valeur) => valeur !== '?').reduce((somme, valeur) => somme + Number(valeur), 0);
      return nombre(Number(total) - autres);
    }
    const colonnes = entetes.valeurs.map((nom, index) => ({ nom, index })).filter(({ nom }) => dansLEnonce(nom));
    if (colonnes.length !== 1) throw new Error(`Colonne ambiguë : « ${question.prompt} »`);
    if (question.prompt.includes('en tout') || question.prompt.includes('trois classes')) {
      return nombre(lignes.reduce((somme, ligne) => somme + Number(ligne.valeurs[colonnes[0].index]), 0));
    }
    const rangs = lignes.filter((ligne) => dansLEnonce(ligne.nom!));
    if (rangs.length !== 1) throw new Error(`Ligne ambiguë : « ${question.prompt} »`);
    return nombre(Number(rangs[0].valeurs[colonnes[0].index]));
  },
  // --- 6e, 3e trimestre
  'division-decimale': ({ prompt }) => {
    const [diviseur, dividende] = nombresDe(prompt);
    return nombre(dividende / diviseur, uniteDe(prompt));
  },
  'passage-unite': ({ prompt }) => {
    const n = nombresDe(prompt);
    if (prompt.includes('coûtent')) return nombre((n[1] * n[2]) / n[0], '€');
    return nombre((n[0] * n[2]) / n[1]);
  },
  recette: ({ prompt }) => {
    const [n1, q1, n2] = nombresDe(prompt);
    return nombre((q1 * n2) / n1, uniteDe(prompt));
  },
  'tableau-proportionnalite': (question) => {
    const [haut, bas] = lireGrille(question.figure!);
    const colonne = [...haut.valeurs, ...bas.valeurs].findIndex((valeur) => valeur === '?') % haut.valeurs.length;
    const connue = haut.valeurs.findIndex((valeur, index) => index !== colonne && valeur !== '?' && bas.valeurs[index] !== '?');
    const [h, b] = [Number(haut.valeurs[connue]), Number(bas.valeurs[connue])];
    return haut.valeurs[colonne] === '?' ? nombre((Number(bas.valeurs[colonne]) * h) / b) : nombre((Number(haut.valeurs[colonne]) * b) / h);
  },
  vitesse: ({ prompt }) => {
    const n = nombresDe(prompt);
    if (prompt.includes('Combien de temps')) return nombre(n[1] / n[0], 'h');
    if (prompt.includes('30 min')) return nombre(n[0] / 2, 'km');
    return nombre(n[0] * n[1], 'km');
  },
  echelle: ({ prompt }) => {
    // « 1 cm représente k … » : le 1 est celui de l'échelle.
    const [, k, x] = nombresDe(prompt);
    if (prompt.includes('sur la carte ?')) return nombre(x / k, 'cm');
    if (prompt.includes('distance réelle')) return nombre(k * x, 'km');
    return nombre(k * x, 'm');
  },
  'probabilite-chances': ({ prompt }) => {
    let m: RegExpExecArray | null;
    if ((m = /^Un sac contient (\d+) billes? (\S+) et (\d+)/.exec(prompt))) return { genre: 'chances', a: Number(m[1]), b: Number(m[1]) + Number(m[3]) };
    if ((m = /d'obtenir (.+) \?$/.exec(prompt))) {
      const faces = [1, 2, 3, 4, 5, 6];
      const regles: Record<string, (face: number) => boolean> = {
        'un nombre pair': (f) => f % 2 === 0,
        'un nombre impair': (f) => f % 2 === 1,
        'un nombre supérieur à 4': (f) => f > 4,
        'un multiple de 3': (f) => f % 3 === 0,
        'le nombre 6': (f) => f === 6,
        'un nombre inférieur à 3': (f) => f < 3,
        'un nombre plus grand que 2': (f) => f > 2,
        'un nombre plus petit que 5': (f) => f < 5,
      };
      return { genre: 'chances', a: faces.filter(regles[m[1]]).length, b: 6 };
    }
    m = /^Une roue a (\d+) secteurs égaux : (\d+) rouges?, (\d+) bleus? et (\d+) verts?\./.exec(prompt)!;
    return { genre: 'chances', a: Number(m[3]), b: Number(m[1]) };
  },
  'probabilite-vocabulaire': ({ prompt }) => {
    if (prompt.includes('un 7') || prompt.includes('un 0')) return { genre: 'texte', valeur: 'impossible' };
    if (prompt.includes('inférieur à 7') || prompt.includes('entre 1 et 6')) return { genre: 'texte', valeur: 'certain' };
    const sac = /^Un sac contient (.+?)\. On tire/.exec(prompt)![1];
    const rouges = /(\d+) billes? rouges?/.exec(sac);
    const bleues = /(\d+) billes? bleues?/.exec(sac);
    const rouge = rouges ? Number(rouges[1]) : 0;
    const bleue = bleues ? Number(bleues[1]) : 0;
    const evenement = /« (.+) »/.exec(prompt)![1];
    const favorables = evenement.includes('bleue') ? bleue : rouge;
    const total = rouge + bleue;
    if (favorables === 0) return { genre: 'texte', valeur: 'impossible' };
    if (favorables === total) return { genre: 'texte', valeur: 'certain' };
    return { genre: 'texte', valeur: favorables * 5 <= total ? 'improbable' : 'probable' };
  },
  'programme-de-calcul': ({ prompt }) => {
    const m = /choisis un nombre, (multiplie-le par (\d+), puis (ajoute|retire) (\d+)|ajoute (\d+), puis multiplie le résultat par (\d+))\./.exec(prompt)!;
    const modele = m[2] !== undefined ? (m[3] === 'ajoute' ? 0 : 2) : 1;
    const [k, b] = modele === 1 ? [Number(m[6]), Number(m[5])] : [Number(m[2]), Number(m[4])];
    const avant = /avec (\d+) \?$/.exec(prompt);
    if (avant) {
      const x = Number(avant[1]);
      return nombre(modele === 0 ? x * k + b : modele === 1 ? (x + b) * k : x * k - b);
    }
    const resultat = Number(/On obtient (\d+)\./.exec(prompt)![1]);
    return nombre(modele === 0 ? (resultat - b) / k : modele === 1 ? resultat / k - b : (resultat + b) / k);
  },
  balance: ({ prompt }) => {
    const [n, ajout, total] = nombresDe(prompt);
    return nombre((total - ajout) / n, 'g');
  },
  motif: ({ prompt }) => {
    const n = nombresDe(prompt);
    if (prompt.includes('À chaque motif')) return nombre(n[1] + n[2] * (n[3] - 1));
    // « Le motif 1 a P, le motif 2 en a Q et le motif 3 en a R. … le motif S ? »
    return nombre(n[1] + (n[3] - n[1]) * (n[6] - 1));
  },
  'volume-cubes': ({ prompt }) => {
    const n = nombresDe(prompt);
    return nombre(n.slice(1).reduce((produit, valeur) => produit * valeur, 1), 'cm³');
  },
  'pourcentage-autres': ({ prompt }) => pourcentage(prompt),
  'fractions-multiples': ({ prompt }) => {
    const fractions = [...prompt.matchAll(/(\d+)\/(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const [[n1, d1], [n2, d2]] = fractions;
    return prompt.includes('Il restait')
      ? { genre: 'fraction', n: n1 * d2 - n2 * d1, d: d1 * d2 }
      : { genre: 'fraction', n: n1 * d2 + n2 * d1, d: d1 * d2 };
  },
};

function pourcentage(prompt: string): Attendu {
  const p = Number(/(\d+) %/.exec(prompt)![1]);
  const base = Number(/(?:coûte|contient|a) (\d+)/.exec(prompt)![1]);
  const part = (base * p) / 100;
  if (prompt.includes('montant de la réduction')) return nombre(part, '€');
  if (prompt.includes('nouveau prix')) return nombre(base - part, '€');
  if (prompt.includes('lui reste-t-il à lire')) return nombre(base - part);
  return nombre(part);
}

function attendu(question: Question, level: Level): Attendu {
  const nom = briqueDe(question, level);
  const oracle = ORACLES[nom];
  if (!oracle) throw new Error(`Aucun contrôle pour la sorte de question « ${nom} »`);
  return oracle(question);
}

/** Cette proposition est-elle la bonne réponse ? */
function estLaBonne(question: Question, level: Level, choix: string): boolean {
  const reponse = attendu(question, level);
  if (reponse.genre === 'texte') return choix === reponse.valeur;
  if (reponse.genre === 'minutes') {
    try {
      return minutesDe(choix) === reponse.valeur;
    } catch {
      return false;
    }
  }
  if (reponse.genre === 'fraction') {
    const m = /^(\d+)\/(\d+)$/.exec(choix);
    return m !== null && Number(m[1]) * reponse.d === reponse.n * Number(m[2]);
  }
  if (reponse.genre === 'chances') {
    const m = /^(\d+) chances? sur (\d+)$/.exec(choix);
    return m !== null && Number(m[1]) * reponse.b === reponse.a * Number(m[2]);
  }
  const m = /^(\d+(?:,\d+)?)(?: (.+))?$/.exec(choix);
  if (!m) return false;
  return egal(parseFrenchNumber(m[1]) as number, reponse.valeur) && m[2] === reponse.unite;
}

// === Les contrôles ================================================================================

describe('les problèmes du CE1, du CE2 et de la 6e', () => {
  it('ont quatre propositions différentes, une explication et une consigne', () => {
    parCellule((level, trimester) => questions(level, trimester, 12)).forEach(({ level, trimester, valeur }) => {
      expect(valeur.length, `${level} T${trimester}`).toBe(12 * GRAINES);
      valeur.forEach((question) => {
        expect(question.domain).toBe('problemes');
        expect(question.choices, `${level} T${trimester} ${question.prompt}`).toHaveLength(4);
        expect(new Set(question.choices).size, question.prompt).toBe(4);
        expect(question.choices[question.correctIndex], question.prompt).toBeDefined();
        expect(question.instruction, question.prompt).toBeTruthy();
        expect(question.explanation, question.prompt).toBeTruthy();
      });
    });
  });

  it('sont reproductibles à graine égale', () => {
    NIVEAUX.forEach((level) => {
      expect(generate(level, 2, createRng(9), 20)).toEqual(generate(level, 2, createRng(9), 20));
    });
  });

  it('ne reposent jamais deux fois le même énoncé dans une séance de douze questions', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        Array.from({ length: GRAINES }, (_, seed) => generate(level, trimester, createRng(seed * 17 + 1), 12)).forEach((seance) => {
          const enonces = seance.map((question) => `${question.prompt}§${question.figure ? JSON.stringify(question.figure.shapes) : ''}`);
          expect(new Set(enonces).size, `${level} T${trimester}`).toBe(enonces.length);
        })
      )
    );
  });

  it('proposent la bonne réponse, refaite à partir de l\'énoncé et du dessin, et aucune autre qui la vaille', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) =>
      valeur.forEach((question) => {
        const juste = question.choices.filter((choix) => estLaBonne(question, level, choix));
        expect(juste, `${level} T${trimester} « ${question.prompt} » : ${question.choices.join(' / ')}`).toEqual([question.choices[question.correctIndex]]);
      })
    );
  });

  it('écrivent leurs nombres à la française : virgule, pas de zéro inutile, pas de signe moins', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ valeur }) =>
      valeur.forEach((question) =>
        [question.prompt, ...question.choices].forEach((texte) => {
          expect(texte, question.prompt).not.toMatch(/\d\.\d/);
          expect(texte, question.prompt).not.toMatch(/(?<![\d,])\d+,\d*0(?!\d)(?! €)/);
          expect(texte, question.prompt).not.toMatch(/(^|\s)-\d/);
        })
      )
    );
  });

  it('ne laissent pas deviner la bonne réponse à son écriture : entier ou décimal', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ valeur }) =>
      valeur.forEach((question) => {
        const juste = question.choices[question.correctIndex];
        if (!/^[\d,]+$/.test(juste)) return;
        const avecVirgule = question.choices.filter((choix) => choix.includes(',')).length;
        expect(juste.includes(',') ? avecVirgule === 1 : avecVirgule === 3, `${question.prompt} : ${question.choices.join(' / ')}`).toBe(false);
      })
    );
  });

  it('donnent la même unité à toutes les propositions d\'une question, sauf quand l\'erreur est l\'unité', () => {
    const SANS_ERREUR_D_UNITE = /^(?!.*(aire|volume)).*$/;
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ valeur }) =>
      valeur
        .filter((question) => SANS_ERREUR_D_UNITE.test(question.prompt))
        .forEach((question) => {
          const unites = question.choices.map((choix) => (/^\d+(?:,\d+)?(?: (.+))?$/.exec(choix) ?? [])[1]);
          if (unites.some((unite) => unite === undefined) && unites.some((unite) => unite !== undefined)) {
            throw new Error(`Une unité manque : ${question.prompt} : ${question.choices.join(' / ')}`);
          }
        })
    );
  });
});

describe('les dessins des problèmes', () => {
  it('tiennent dans leur cadre, avec leur texte alternatif', () => {
    parCellule((level, trimester) => questions(level, trimester).filter((question) => question.figure)).forEach(({ valeur }) =>
      valeur.forEach((question) => {
        expect(fitsInFrame(question.figure!), question.id).toBe(true);
        expect(question.figure!.alt.length, question.id).toBeGreaterThan(10);
      })
    );
  });

  it('en ont : le CE1 lit des tableaux, des pictogrammes et des diagrammes, la 6e des tableaux à double entrée', () => {
    const avecDessin = (level: Level, trimester: Trimester) => questions(level, trimester).some((question) => question.figure);
    expect(avecDessin('CE1', 1)).toBe(true);
    expect(avecDessin('CE1', 2)).toBe(true);
    expect(avecDessin('CE2', 2)).toBe(true);
    expect(avecDessin('6e', 1)).toBe(true);
    expect(avecDessin('6e', 2)).toBe(true);
    expect(avecDessin('6e', 3)).toBe(true);
  });
});

describe('les nombres du programme', () => {
  const tout = (question: Question) => [question.prompt, ...question.choices, question.explanation ?? ''];

  it('restent au CE1 sous 100 au 1er trimestre, puis sous 1 000, sans décimal, division, fraction ni pourcentage', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE1', trimester).forEach((question) => {
        const plafond = trimester === 1 ? 100 : 1000;
        const bonne = parseFrenchNumber(question.choices[question.correctIndex]);
        // Le total d'une lecture de données peut dépasser : on ne regarde que l'énoncé et la bonne réponse.
        [...nombresDe(question.prompt), ...(bonne === null ? [] : [bonne])].forEach((n) => expect(n, `${question.prompt} (T${trimester})`).toBeLessThanOrEqual(plafond));
        question.choices.forEach((choix) => {
          if (/^\d+$/.test(choix)) expect(Number(choix), `${question.prompt} : ${choix}`).toBeLessThanOrEqual(1000);
        });
        tout(question).forEach((texte) => {
          expect(texte, question.prompt).not.toMatch(/\d,\d|[÷%]|\d\/\d/);
        });
      })
    );
  });

  it('restent au CE2 sous 10 000 et ne mettent des décimaux que dans les prix et le rendu de monnaie, sans pourcentage', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE2', trimester).forEach((question) => {
        nombresDe(question.prompt).forEach((n) => expect(n, question.prompt).toBeLessThanOrEqual(10000));
        question.choices.forEach((choix) => {
          if (/^\d+$/.test(choix)) expect(Number(choix), `${question.prompt} : ${choix}`).toBeLessThanOrEqual(100000);
        });
        tout(question).forEach((texte) => expect(texte, question.prompt).not.toMatch(/%|probabilit|proportionnel|chances? sur/));
        if (/\d,\d/.test(tout(question).join(' '))) expect(tout(question).join(' '), question.prompt).toContain('€');
      })
    );
  });

  it('commencent la multiplication au 2e trimestre du CE1, la division au CE2 et les fractions au 2e trimestre du CE2', () => {
    const contient = (level: Level, trimester: Trimester, motif: RegExp) => questions(level, trimester).some((question) => tout(question).some((texte) => motif.test(texte)));
    expect(contient('CE1', 1, /×/)).toBe(false);
    expect(contient('CE1', 2, /×/)).toBe(true);
    expect(contient('CE1', 3, /×/)).toBe(true);
    expect(contient('CE2', 1, /fois plus|÷/)).toBe(false);
    expect(contient('CE2', 2, /fois plus/)).toBe(true);
    expect(contient('CE2', 2, /÷/)).toBe(true);
    // « un quart d'heure » se dit au CE1 : c'est le quart d'une quantité qui vient plus tard.
    expect(contient('CE1', 3, /moitié|tiers|le quart|÷/)).toBe(false);
    expect(contient('CE2', 1, /moitié|tiers|le quart/)).toBe(false);
    expect(contient('CE2', 2, /moitié|tiers|quart|cinquième|dixième/)).toBe(true);
  });

  it('écrivent en 6e des décimaux de trois décimales au plus', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('6e', trimester).forEach((question) =>
        [question.prompt, ...question.choices].forEach((texte) => {
          expect(texte, question.prompt).not.toMatch(/\d,\d{4,}/);
        })
      )
    );
  });

  it('ne parlent de pourcentage qu\'à partir du 2e trimestre de la 6e, et de proportionnalité, de probabilité et d\'échelle qu\'au 3e', () => {
    const contient = (trimester: Trimester, motif: RegExp) => questions('6e', trimester).some((question) => tout(question).some((texte) => motif.test(texte)));
    expect(contient(1, /%/)).toBe(false);
    expect(contient(2, /%/)).toBe(true);
    [/chances? sur|probable|certain|impossible/, /proportionnalité|même prix/, /échelle|1 cm représente/, /km\/h/, /motif|programme de calcul|balance/].forEach((motif) => {
      expect(contient(1, motif), String(motif)).toBe(false);
      expect(contient(2, motif), String(motif)).toBe(false);
    });
    expect(contient(3, /chances? sur/)).toBe(true);
    expect(contient(3, /1 cm représente/)).toBe(true);
  });

  it('n\'écrivent en 6e ni nombre relatif, ni équation, ni produit en croix, ni formule', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('6e', trimester).forEach((question) =>
        tout(question).forEach((texte) => {
          expect(texte, question.prompt).not.toMatch(/produit en croix|coefficient|équation|relatif|Pythagore|moyenne|aire du disque|π|\bx\b/);
          expect(texte, question.prompt).not.toMatch(/(^|\s)[−-]\d/);
        })
      )
    );
  });
});

describe('les sortes de problèmes', () => {
  const nomsDe = (level: Level, trimester: Trimester) => new Set(questions(level, trimester, 24, 40).map((question) => briqueDe(question, level)));
  const briquesDe = (level: Level) => (level === '6e' ? BRIQUES_SIXIEME : BRIQUES_CYCLE2);

  it('tirent chaque sorte déjà enseignée : aucune n\'échappe aux vérifications', () => {
    parCellule((level, trimester) => nomsDe(level, trimester)).forEach(({ level, trimester, valeur }) => {
      const attendues = availableAt(briquesDe(level), stageOf(level, trimester)).map((brique) => brique.name);
      expect([...valeur].sort(), `${level} T${trimester}`).toEqual([...attendues].sort());
      attendues.forEach((nom) => expect(ORACLES[nom], `${nom} n'a pas de contrôle`).toBeDefined());
    });
  });

  it('ne laissent sortir aucune sorte avant son étape', () => {
    parCellule((level, trimester) => nomsDe(level, trimester)).forEach(({ level, trimester, valeur }) => {
      const stage = stageOf(level, trimester);
      valeur.forEach((nom) => expect(briquesDe(level).find((brique) => brique.name === nom)!.minStage, `${level} T${trimester} ${nom}`).toBeLessThanOrEqual(stage));
    });
  });

  it('ont des contrôles pour toutes les sortes, et rien d\'autre', () => {
    const toutes = new Set([...BRIQUES_CYCLE2, ...BRIQUES_SIXIEME].map((brique) => brique.name));
    // Pas de contrôle orphelin, et un contrôle pour chaque sorte (le « rendu-decimal » du CE2 et de la 6e partage le sien).
    Object.keys(ORACLES).forEach((nom) => expect(toutes.has(nom), `${nom} : contrôle sans sorte de question`).toBe(true));
    [...toutes].forEach((nom) => expect(ORACLES[nom], nom).toBeDefined());
  });

  it('se multiplient d\'un trimestre à l\'autre et d\'un niveau à l\'autre dans le cycle 2', () => {
    const compte = (level: Level, trimester: Trimester) => eligibleTemplateCount(level, trimester);
    const suite = [compte('CE1', 1), compte('CE1', 2), compte('CE1', 3), compte('CE2', 1), compte('CE2', 2), compte('CE2', 3)];
    suite.forEach((valeur, index) => {
      if (index > 0) expect(valeur, `étape ${index}`).toBeGreaterThan(suite[index - 1]);
    });
    expect([compte('6e', 1), compte('6e', 2), compte('6e', 3)]).toEqual([11, 21, 35]);
    expect(suite[0]).toBe(11);
  });

  it('proposent aux élèves de 6e, dès le 1er trimestre, des problèmes qui ne demandent que ce qu\'ils savent', () => {
    // Pas de fraction, de pourcentage ni de division euclidienne avant le 2e trimestre.
    questions('6e', 1).forEach((question) => {
      expect([question.prompt, ...question.choices].join(' '), question.prompt).not.toMatch(/\d\/\d|%|probable|échelle/);
    });
  });
});

describe('des quantités et des prix qui ont l\'air vrais', () => {
  const enonces = () => parCellule((level, trimester) => questions(level, trimester, 24, 120)).flatMap(({ valeur }) => valeur.map((question) => question.prompt));
  const echapper = (texte: string) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  it('donnent à chaque article un prix de sa fourchette : un cahier ne coûte pas 38 €', () => {
    const prompts = enonces();
    ARTICLES_A_PRIX.forEach(({ un, min, max }) => {
      const motif = new RegExp(`(?:${echapper(un)}|${echapper(un.charAt(0).toUpperCase() + un.slice(1))}) (?:coûte|à) (\\d+)(?:,\\d+)? €`, 'g');
      const prix = prompts.flatMap((prompt) => [...prompt.matchAll(motif)].map((m) => Number(m[1])));
      expect(prix.length, `${un} n'est jamais acheté`).toBeGreaterThan(0);
      prix.forEach((euros) => {
        expect(euros, `${un} à ${euros} €`).toBeGreaterThanOrEqual(min);
        expect(euros, `${un} à ${euros} €`).toBeLessThanOrEqual(max);
      });
    });
  });

  it('ne mettent dans un lieu que ce qu\'il peut contenir : pas 8 000 personnes dans un bus', () => {
    const prompts = enonces();
    [...PAIRES, ...PAIRES_GRANDES].forEach((paire) => {
      const reunion = new RegExp(`^${echapper(paire.lieu)}, il y a (\\d+) ${echapper(paire.a)} et (\\d+) ${echapper(paire.b)}\\.`);
      const complement = new RegExp(`^${echapper(paire.lieu)}, il y a (\\d+) [^.]+\\. \\d+ sont des ${echapper(paire.a)}\\. Les autres sont des ${echapper(paire.b)}\\.`);
      prompts.forEach((prompt) => {
        const [, a, b] = reunion.exec(prompt) ?? [];
        if (a !== undefined) expect(Number(a) + Number(b), prompt).toBeLessThanOrEqual(paire.max);
        const [, total] = complement.exec(prompt) ?? [];
        if (total !== undefined) expect(Number(total), prompt).toBeLessThanOrEqual(paire.max);
      });
    });
  });

  it('réservent les milliers à des commerces et des écoles : un enfant ne possède pas 4 000 feutres', () => {
    enonces().forEach((prompt) => {
      const enfant = /^(?:Léa|Tom|Inès|Hugo|Zoé|Noé|Jade|Lucas|Emma|Nathan|Manon|Louis|Chloé|Adam|Lina|Yanis|Clara|Théo|Anna|Rayan|Sofia|Maël|Eva|Enzo) a (\d+) /.exec(prompt);
      if (enfant) expect(Number(enfant[1]), prompt).toBeLessThan(1000);
    });
  });
});
