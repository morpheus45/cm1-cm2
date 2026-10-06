import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { fitsInFrame, type Figure, type Shape } from '../lib/figures';
import { availableAt, stageOf } from '../lib/progression';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { generate } from './numeration';
import { BRIQUES_NUMERATION_CYCLE4 } from './numerationCycle4';
import { absQ, addQ, cmpQ, divQ, eqQ, evaluer, lireNombre, lireRationnel, mulQ, negQ, q, racineQ, signeQ, subQ, type Q } from './verificationCycle4';

/**
 * La numération de la 5e, de la 4e et de la 3e : chaque question est refaite
 * ici à partir de son énoncé — par un lecteur d'expressions exact, qui ne
 * partage rien avec les générateurs (verificationCycle4.ts) — puis comparée aux
 * propositions, dont une seule doit être juste.
 */

const NIVEAUX: Level[] = ['5e', '4e', '3e'];
/** Cinquante graines par cellule suffisent à chaque exécution ; VITE_GRAINES_CYCLE4=2000 npm test pour une vérification plus longue. */
const GRAINES = Number(import.meta.env.VITE_GRAINES_CYCLE4 ?? 50);

function questions(level: Level, trimester: Trimester, count = 24, seeds = GRAINES): Question[] {
  return Array.from({ length: seeds }, (_, seed) => generate(level, trimester, createRng(seed * 37 + 11), count)).flat();
}

const parCellule = <T>(faire: (level: Level, trimester: Trimester) => T) =>
  NIVEAUX.flatMap((level) => ALL_TRIMESTERS.map((trimester) => ({ level, trimester, valeur: faire(level, trimester) })));

const MOTIFS = BRIQUES_NUMERATION_CYCLE4.map((brique) => ({ nom: brique.name, motif: new RegExp(`^numeration-${brique.name}-\\d+-`) }));

function briqueDe(question: Question): string {
  const trouves = MOTIFS.filter(({ motif }) => motif.test(question.id));
  if (trouves.length !== 1) throw new Error(`${question.id} : ${trouves.length} sortes de question possibles`);
  return trouves[0].nom;
}

// --- Refaire les calculs --------------------------------------------------------------------------------------------

type Juge = (choix: string) => boolean;

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻';
const nombre = (texte: string) => lireNombre(texte) as Q;
const rationnel = (texte: string) => lireRationnel(texte) as Q;
const vautLeNombre = (attendu: Q): Juge => (choix) => {
  const valeur = lireRationnel(choix);
  return valeur !== null && eqQ(valeur, attendu);
};
const entierDe = (texte: string) => Number(texte.replace(/[\s\u00a0]/g, ''));
const estPremier = (n: number) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, k) => k + 2).every((d) => n % d !== 0);
const pgcdEntiers = (a: number, b: number): number => (b === 0 ? a : pgcdEntiers(b, a % b));

/** L'exposant écrit en chiffres Unicode : « ⁻¹² » → −12. */
function exposantDe(ecrit: string): number {
  const chiffres = ecrit.replace('⁻', '').split('').map((c) => SUP.indexOf(c)).join('');
  return (ecrit.startsWith('⁻') ? -1 : 1) * Number(chiffres);
}

/** Une puissance « b^e » écrite avec ses exposants : sa base et son exposant, ou `null`. */
function lirePuissance(texte: string): { base: string; exposant: number } | null {
  const m = new RegExp(`^(\\d+)([${SUP}]+)$`).exec(texte);
  return m ? { base: m[1], exposant: exposantDe(m[2]) } : null;
}

/** « a × 10ⁿ », avec a entre 1 et 10 (10 exclu) : l'écriture scientifique, sa valeur. */
function lireEcritureScientifique(texte: string): Q | null {
  const m = new RegExp(`^([\\d,]+) × 10([${SUP}]+)$`).exec(texte);
  if (!m) return null;
  const mantisse = nombre(m[1]);
  if (cmpQ(mantisse, q(1)) < 0 || cmpQ(mantisse, q(10)) >= 0) return null;
  return evaluer(texte);
}

/** Les chiffres d'une fraction « n/d » du prompt, rangée. */
const fractionsDe = (texte: string) => texte.split(', ').map(rationnel);

function jugeDe(question: Question): Juge {
  const { prompt, instruction = '' } = question;
  const nom = briqueDe(question);
  let m: RegExpExecArray | null;
  switch (nom) {
    case 'oppose':
      if ((m = /^Quel est l'opposé de l'opposé de (.+) \?$/.exec(prompt))) return vautLeNombre(nombre(m[1]));
      if ((m = /^Quel est l'opposé de (.+) \?$/.exec(prompt))) return vautLeNombre(negQ(nombre(m[1])));
      if ((m = /^Quel nombre a pour opposé (.+) \?$/.exec(prompt))) return vautLeNombre(negQ(nombre(m[1])));
      break;
    case 'valeur-absolue':
      if ((m = /^Quel nombre a la plus grande valeur absolue : (.+) \?$/.exec(prompt))) {
        const liste = m[1].split(', ').map(nombre);
        const plusLoin = liste.reduce((meilleur, n) => (cmpQ(absQ(n), absQ(meilleur)) > 0 ? n : meilleur));
        return vautLeNombre(plusLoin);
      }
      if ((m = /^Quelle est la (?:distance à zéro|valeur absolue) de (.+) \?$/.exec(prompt))) return vautLeNombre(absQ(nombre(m[1])));
      break;
    case 'droite-relatifs': {
      const droite = lireLaDroite(question.figure as Figure);
      return vautLeNombre(droite.valeurDeLaFleche);
    }
    case 'comparer-relatifs':
      if ((m = /^(.+) … (.+)$/.exec(prompt))) {
        const comparaison = cmpQ(nombre(m[1]), nombre(m[2]));
        return (choix) => choix === (comparaison < 0 ? '<' : comparaison > 0 ? '>' : '=');
      }
      break;
    case 'ranger-relatifs': {
      const liste = prompt.split(', ').map(nombre);
      const croissante = [...liste].sort(cmpQ);
      return (choix) => {
        const rangee = choix.split(' < ').map(nombre);
        return rangee.length === liste.length && rangee.every((n, rang) => eqQ(n, croissante[rang]));
      };
    }
    case 'carres-cubes':
      if (instruction === "Écris sous la forme d'un produit" && (m = new RegExp(`^(\\d+)([${SUP}]+)$`).exec(prompt))) {
        const [base, exposant] = [m[1], exposantDe(m[2])];
        return (choix) => choix === Array.from({ length: exposant }, () => base).join(' × ');
      }
      if (instruction === 'Écris avec une puissance' && /^(\d+)( × \d+)+$/.test(prompt)) {
        const facteurs = prompt.split(' × ');
        return (choix) => {
          const puissance = lirePuissance(choix);
          return puissance !== null && puissance.base === facteurs[0] && puissance.exposant === facteurs.length && facteurs.every((f) => f === facteurs[0]);
        };
      }
      if ((m = /^(\d+)²$/.exec(prompt))) return vautLeNombre(q(BigInt(m[1]) ** 2n));
      if ((m = /^Quel est le carré de (\d+) \?$/.exec(prompt))) return vautLeNombre(q(BigInt(m[1]) ** 2n));
      if ((m = /^(\d+)³$/.exec(prompt))) return vautLeNombre(q(BigInt(m[1]) ** 3n));
      if ((m = /^Quel est le cube de (\d+) \?$/.exec(prompt))) return vautLeNombre(q(BigInt(m[1]) ** 3n));
      break;
    case 'divisibilite': {
      m = /^Lequel de ces nombres est divisible par (\d)(?: mais pas par (\d))? \?$/.exec(prompt);
      if (m) {
        const [pour, pasPour] = [Number(m[1]), m[2] ? Number(m[2]) : 0];
        return (choix) => entierDe(choix) % pour === 0 && (pasPour === 0 || entierDe(choix) % pasPour !== 0);
      }
      break;
    }
    case 'chiffre-manquant': {
      m = /pour que (\d*\*\d*) soit divisible par (\d) \?$/.exec(prompt);
      if (m) {
        const [ecrit, diviseur] = [m[1], Number(m[2])];
        const valables = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((c) => Number(ecrit.replace('*', String(c))) % diviseur === 0);
        const attendu = prompt.startsWith('Quel est le plus petit') ? Math.min(...valables) : valables.length === 1 ? valables[0] : -1;
        return (choix) => Number(choix) === attendu;
      }
      break;
    }
    case 'arrondi': {
      m = /^Arrondis (à l'unité|au dixième|au centième|au millième)$/.exec(instruction);
      if (m) {
        const rang = ["à l'unité", 'au dixième', 'au centième', 'au millième'].indexOf(m[1]);
        const [entier, decimales = ''] = prompt.split(',');
        const [N, pas] = [BigInt(entier + decimales), 10n ** BigInt(decimales.length - rang)];
        const arrondi = (N + pas / 2n) / pas;
        return vautLeNombre(q(arrondi, 10n ** BigInt(rang)));
      }
      break;
    }
    case 'comparer-fractions':
      if ((m = /^(\d+\/\d+) … (\d+\/\d+)$/.exec(prompt))) {
        const comparaison = cmpQ(rationnel(m[1]), rationnel(m[2]));
        return (choix) => choix === (comparaison < 0 ? '<' : comparaison > 0 ? '>' : '=');
      }
      if ((m = /^Quelle est (la plus grande|la plus petite) de ces fractions : (.+) \?$/.exec(prompt))) {
        const liste = m[2].split(', ');
        const valeurs = liste.map(rationnel);
        const meilleure = valeurs.reduce((a, b) => ((cmpQ(a, b) > 0) === (m![1] === 'la plus grande') ? a : b));
        return vautLeNombre(meilleure);
      }
      break;
    case 'distance-droite':
      if ((m = /abscisse (.+) et le point \S a pour abscisse (.+)\. Quelle est la distance/.exec(prompt))) {
        return vautLeNombre(absQ(evaluer(`${m[1].replace(/^−(.+)$/, '(−$1)')} − ${m[2].replace(/^−(.+)$/, '(−$1)')}`)));
      }
      break;
    case 'fractions-egales':
      if ((m = /^Quelle fraction est égale à (\d+\/\d+) \?$/.exec(prompt))) return vautLeNombre(rationnel(m[1]));
      break;
    case 'ecritures-nombre':
      if (instruction === "Cherche l'écriture décimale") return vautLeNombre(rationnel(prompt));
      if (instruction === 'Cherche le pourcentage') {
        const valeur = rationnel(prompt);
        return (choix) => /^[\d,\s\u00a0]+ %$/.test(choix) && eqQ(nombre(choix.replace(' %', '')), mulQ(valeur, q(100)));
      }
      if (instruction === 'Écris en fraction décimale') {
        const valeur = nombre(prompt);
        return (choix) => /^\d+\/100$/.test(choix) && eqQ(rationnel(choix), valeur);
      }
      if (instruction === 'Cherche la fraction la plus simple') {
        const valeur = divQ(nombre(prompt.replace(' %', '')), q(100));
        return (choix) => {
          const [haut, bas] = choix.split('/').map(Number);
          return eqQ(rationnel(choix), valeur) && pgcdEntiers(haut, bas) === 1;
        };
      }
      break;
    case 'signe-produit': {
      const voulu = prompt.includes('positif') ? 1 : -1;
      return (choix) => signeQ(evaluer(choix)) === voulu;
    }
    case 'puissance':
      return vautLeNombre(evaluer(prompt.replace(/^Quelle est la valeur de (.+) \?$/, '$1').replace(/ = …$/, '')));
    case 'puissances-de-dix':
      if (instruction === 'Écris sans exposant') return vautLeNombre(evaluer(prompt));
      if (instruction === 'Écris avec une puissance de 10') {
        const valeur = nombre(prompt);
        return (choix) => new RegExp(`^10[${SUP}]+$`).test(choix) && eqQ(evaluer(choix), valeur);
      }
      if (instruction === 'Écris avec une seule puissance de 10') {
        const valeur = evaluer(prompt);
        return (choix) => new RegExp(`^10[${SUP}]+$`).test(choix) && eqQ(evaluer(choix), valeur);
      }
      break;
    case 'simplifier-fraction':
      if ((m = /^Quelle fraction est égale à (\d+\/\d+) et ne peut plus être simplifiée \?$/.exec(prompt))) {
        const valeur = rationnel(m[1]);
        return (choix) => {
          const [haut, bas] = choix.split('/').map(Number);
          return eqQ(rationnel(choix), valeur) && pgcdEntiers(haut, bas) === 1;
        };
      }
      break;
    case 'inverse':
      if ((m = /^Quel est l'inverse de (.+) \?$/.exec(prompt))) return vautLeNombre(divQ(q(1), rationnel(m[1])));
      break;
    case 'puissance-relatif':
    case 'puissance-signe':
      return vautLeNombre(evaluer(prompt));
    case 'quotient-puissances-dix': {
      const valeur = evaluer(prompt);
      return (choix) => new RegExp(`^10[${SUP}]+$`).test(choix) && eqQ(evaluer(choix), valeur);
    }
    case 'produit-puissance-dix':
      return vautLeNombre(evaluer(prompt));
    case 'ranger-fractions': {
      const croissante = [...fractionsDe(prompt)].sort(cmpQ);
      return (choix) => {
        const rangee = choix.split(' < ').map(rationnel);
        return rangee.length === 4 && rangee.every((f, rang) => eqQ(f, croissante[rang]));
      };
    }
    case 'diviseur-multiple':
      if ((m = /^Quel nombre est un diviseur de (\d+) \?$/.exec(prompt))) return (choix) => Number(m![1]) % Number(choix) === 0 && Number(choix) > 1 && Number(choix) < Number(m![1]);
      if ((m = /^Quel nombre est un multiple de (\d+) \?$/.exec(prompt))) return (choix) => Number(choix) % Number(m![1]) === 0;
      break;
    case 'nombre-premier':
      if (prompt === 'Lequel de ces nombres est premier ?') return (choix) => estPremier(Number(choix));
      if ((m = /^Le nombre (\d+) est-il premier \?$/.exec(prompt))) {
        const n = Number(m[1]);
        return (choix) => {
          if (choix === `Oui, ses seuls diviseurs sont 1 et ${n}`) return estPremier(n);
          const p = /^Non, il est divisible par (\d+)$/.exec(choix);
          return p !== null && n % Number(p[1]) === 0 && Number(p[1]) < n;
        };
      }
      break;
    case 'decomposition':
      if ((m = /^Décompose (\d+) en produit de facteurs premiers$/.exec(prompt))) {
        const n = Number(m[1]);
        return (choix) => {
          const facteurs = choix.split(' × ').map((f) => {
            const p = new RegExp(`^(\\d+)([${SUP}]*)$`).exec(f);
            return { base: Number(p?.[1]), exposant: p?.[2] ? exposantDe(p[2]) : 1 };
          });
          return facteurs.every((f) => estPremier(f.base)) && facteurs.reduce((produit, f) => produit * f.base ** f.exposant, 1) === n;
        };
      }
      break;
    case 'pgcd':
      if ((m = /^Quel est le PGCD de (\d+) et de (\d+) \?$/.exec(prompt))) return (choix) => Number(choix) === pgcdEntiers(Number(m![1]), Number(m![2]));
      break;
    case 'fraction-irreductible':
      if ((m = /^(\d+\/\d+)$/.exec(prompt))) {
        const valeur = rationnel(m[1]);
        return (choix) => {
          const [haut, bas] = choix.split('/').map(Number);
          return eqQ(rationnel(choix), valeur) && pgcdEntiers(haut, bas) === 1;
        };
      }
      break;
    case 'puissance-negative':
      if (instruction === 'Écris sous forme décimale') return vautLeNombre(evaluer(prompt));
      if (instruction === 'Écris avec une puissance de 10') {
        const valeur = nombre(prompt);
        return (choix) => new RegExp(`^10[${SUP}]+$`).test(choix) && eqQ(evaluer(choix), valeur);
      }
      if (instruction === 'Calcule') return vautLeNombre(evaluer(prompt));
      break;
    case 'ecriture-scientifique':
      if (instruction === 'Écris en écriture scientifique') {
        const valeur = nombre(prompt);
        return (choix) => {
          const ecrite = lireEcritureScientifique(choix);
          return ecrite !== null && eqQ(ecrite, valeur);
        };
      }
      if (instruction === 'Écris en écriture décimale') return vautLeNombre(evaluer(prompt));
      break;
    case 'racine-carree':
      if ((m = /^Quel nombre positif a pour carré (\d+) \?$/.exec(prompt))) return vautLeNombre(racineQ(q(BigInt(m[1]))) as Q);
      return vautLeNombre(evaluer(prompt));
    case 'regles-puissances': {
      const valeur = evaluer(prompt);
      const base = /^\(?(\d+)/.exec(prompt)![1];
      return (choix) => {
        const puissance = lirePuissance(choix);
        return puissance !== null && puissance.base === base && eqQ(evaluer(choix), valeur);
      };
    }
    case 'encadrer-racine':
      if ((m = /^Entre quels entiers consécutifs se trouve √(\d+) \?$/.exec(prompt))) {
        const n = Number(m[1]);
        return (choix) => {
          const [bas, haut] = choix.split(' et ').map(Number);
          return haut === bas + 1 && bas * bas < n && n < haut * haut;
        };
      }
      break;
    case 'calcul-scientifique': {
      const valeur = evaluer(prompt);
      return (choix) => {
        const ecrite = lireEcritureScientifique(choix);
        return ecrite !== null && eqQ(ecrite, valeur);
      };
    }
  }
  throw new Error(`Énoncé de numération non reconnu (${nom}) : « ${instruction} » « ${prompt} »`);
}

// --- Lire la droite graduée ------------------------------------------------------------------------------------------

const shapesOf = <K extends Shape['kind']>(figure: Figure, kind: K) => figure.shapes.filter((shape): shape is Extract<Shape, { kind: K }> => shape.kind === kind);

/** La droite graduée, relue comme l'élève la lit : les deux bouts écrits, le pas, et la graduation que la flèche désigne. */
function lireLaDroite(figure: Figure) {
  const graduations = shapesOf(figure, 'segment')
    .filter((segment) => segment.width === 2 && segment.from[0] === segment.to[0])
    .map((segment) => segment.from[0])
    .sort((a, b) => a - b);
  const rangDe = (x: number) => graduations.findIndex((valeur) => Math.abs(valeur - x) < 0.2);
  const etiquettes = new Map(shapesOf(figure, 'text').filter((texte) => texte.at[1] > 70).map((texte) => [rangDe(texte.at[0]), texte.text]));
  const fleche = shapesOf(figure, 'segment').find((segment) => segment.ink === 'couleur' && segment.from[0] === segment.to[0]) as Extract<Shape, { kind: 'segment' }>;
  const intervalles = graduations.length - 1;
  const [debut, fin] = [nombre(etiquettes.get(0) as string), nombre(etiquettes.get(intervalles) as string)];
  const pas = divQ(subQ(fin, debut), q(intervalles));
  return { intervalles, debut, fin, pas, valeurDeLaFleche: addQ(debut, mulQ(pas, q(rangDe(fleche.from[0])))) };
}

// --- Les contrôles ----------------------------------------------------------------------------------------------------

describe('les questions de numération de la 5e, de la 4e et de la 3e', () => {
  it('ont quatre propositions différentes (trois pour <, > ou =), une consigne et une explication', () => {
    parCellule((level, trimester) => questions(level, trimester, 12)).forEach(({ level, trimester, valeur }) => {
      expect(valeur.length, `${level} T${trimester}`).toBe(12 * GRAINES);
      valeur.forEach((question) => {
        expect(question.domain).toBe('numeration');
        const comparaison = question.choices.every((choix) => ['<', '>', '='].includes(choix));
        expect(question.choices, question.prompt).toHaveLength(comparaison ? 3 : 4);
        expect(new Set(question.choices).size, question.prompt).toBe(question.choices.length);
        expect(question.choices[question.correctIndex], question.prompt).toBeDefined();
        expect(question.instruction, question.prompt).toBeTruthy();
        expect(question.explanation, question.prompt).toBeTruthy();
      });
    });
  });

  it('sont reproductibles à graine égale, et ne changent pas selon le nombre de questions demandées', () => {
    NIVEAUX.forEach((level) => expect(generate(level, 2, createRng(9), 20)).toEqual(generate(level, 2, createRng(9), 20)));
  });

  it('proposent la bonne réponse, refaite à partir de l\'énoncé, et aucune autre qui la vaille', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) =>
      valeur.forEach((question) => {
        const juge = jugeDe(question);
        const justes = question.choices.filter(juge);
        expect(justes, `${level} T${trimester} : ${question.instruction} ${question.prompt} → ${question.choices.join(' | ')}`).toEqual([question.choices[question.correctIndex]]);
      })
    );
  });

  it('dessinent des droites graduées qui tiennent dans leur cadre, graduées comme la consigne le dit, sans donner la réponse', () => {
    const droites = parCellule((level, trimester) => questions(level, trimester, 24, 20).filter((question) => question.figure)).flatMap(({ valeur }) => valeur);
    expect(droites.length).toBeGreaterThan(20);
    droites.forEach((question) => {
      const figure = question.figure as Figure;
      expect(fitsInFrame(figure), question.id).toBe(true);
      const droite = lireLaDroite(figure);
      const pas = String(Number(droite.pas.n) / Number(droite.pas.d)).replace('.', ',');
      expect(question.instruction, question.id).toBe(`La droite est graduée de ${pas} en ${pas}`);
      const reponse = question.choices[question.correctIndex].replace(/[\u00a0\s]/g, '');
      const nombres = figure.alt.match(/[−\d,]+/g) ?? [];
      expect(nombres.map((n) => n.replace(/[\u00a0\s]/g, '')), `${question.id} : ${figure.alt}`).not.toContain(reponse);
    });
  });
});

describe('les sortes de questions de numération', () => {
  const noms = BRIQUES_NUMERATION_CYCLE4.map((brique) => brique.name);

  it('ont chacune un nom différent', () => {
    expect(new Set(noms).size).toBe(noms.length);
  });

  it('tirent chaque sorte déjà enseignée : aucune n\'échappe aux vérifications', () => {
    parCellule((level, trimester) => {
      const vues = new Set(questions(level, trimester, 24, 80).map(briqueDe));
      const attendues = availableAt(BRIQUES_NUMERATION_CYCLE4, stageOf(level, trimester)).map((brique) => brique.name);
      return { vues, attendues };
    }).forEach(({ level, trimester, valeur }) => {
      expect([...valeur.vues].sort(), `${level} T${trimester}`).toEqual([...valeur.attendues].sort());
    });
  });

  it('ne laissent sortir aucune sorte avant son étape, ni du cycle précédent', () => {
    // La 5e ne voit que les sortes de la 5e : ni la 4e, ni la 3e, et rien du CM2 ni de la 6e.
    expect(availableAt(BRIQUES_NUMERATION_CYCLE4, stageOf('5e', 1)).every((brique) => brique.minStage === 10)).toBe(true);
    expect(availableAt(BRIQUES_NUMERATION_CYCLE4, stageOf('4e', 1)).every((brique) => brique.minStage <= 13)).toBe(true);
    BRIQUES_NUMERATION_CYCLE4.forEach((brique) => expect(brique.minStage, brique.name).toBeGreaterThanOrEqual(10));
    BRIQUES_NUMERATION_CYCLE4.forEach((brique) => expect(brique.minStage, brique.name).toBeLessThanOrEqual(18));
  });

  it('apportent du nouveau à chaque trimestre : au moins une sorte, et huit au premier de la 5e', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        expect(BRIQUES_NUMERATION_CYCLE4.filter((brique) => brique.minStage === stageOf(level, trimester)).length, `${level} T${trimester}`).toBeGreaterThanOrEqual(1)
      )
    );
    expect(BRIQUES_NUMERATION_CYCLE4.filter((brique) => brique.minStage === stageOf('5e', 1)).length).toBeGreaterThanOrEqual(8);
  });
});

describe('ce que la numération du collège ne dit pas avant son heure', () => {
  const textes = (question: Question) => [question.instruction ?? '', question.prompt, ...question.choices, question.explanation ?? ''];
  const cellule = (level: Level, trimester: Trimester) => questions(level, trimester, 24, 40);

  it('n\'écrit en 5e ni multiplication de relatifs, ni exposant négatif, ni racine carrée, ni écriture scientifique, ni nombre premier', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      cellule('5e', trimester).forEach((question) =>
        textes(question).forEach((texte) => {
          expect(texte, texte).not.toMatch(/\(−[\d,]+\) ×|× \(−|⁻|√|écriture scientifique|premier|PGCD|irréductible|inverse/);
        })
      )
    );
  });

  it('n\'écrit en 4e ni exposant négatif, ni racine carrée, ni écriture scientifique, ni PGCD, ni nombre premier', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      cellule('4e', trimester).forEach((question) =>
        textes(question).forEach((texte) => {
          expect(texte, texte).not.toMatch(/⁻|√|écriture scientifique|premier|PGCD|irréductible|décomposition/);
        })
      )
    );
  });

  it('s\'en tient en 5e aux carrés de 0 à 12 et aux cubes de 0 à 5 et de 10', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      cellule('5e', trimester).forEach((question) => {
        const carres = [...question.prompt.matchAll(/(\d+)²/g)].map((c) => Number(c[1]));
        carres.forEach((n) => expect(n, question.prompt).toBeLessThanOrEqual(12));
        // Les cubes qu'on calcule : 0 à 5 et 10. Écrire 7 × 7 × 7 = 7³ n'est pas le calculer.
        const aCalculer = question.instruction === 'Calcule' ? (/^(\d+)³$/.exec(question.prompt) ?? /^Quel est le cube de (\d+) \?$/.exec(question.prompt)) : null;
        if (aCalculer) expect([0, 1, 2, 3, 4, 5, 10], question.prompt).toContain(Number(aCalculer[1]));
      })
    );
  });

  it('ne demande en 5e que les critères de divisibilité par 3 et par 9', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      cellule('5e', trimester)
        .filter((question) => /divisible/.test(question.prompt))
        .forEach((question) => expect(question.prompt, question.prompt).toMatch(/par [39]\b/))
    );
  });

  it('commence la 5e par les relatifs, et garde les fractions de dénominateurs quelconques pour le 2e trimestre', () => {
    const premier = cellule('5e', 1).map(briqueDe);
    expect(premier).toContain('oppose');
    expect(premier).toContain('droite-relatifs');
    expect(premier).not.toContain('comparer-fractions');
    expect(cellule('5e', 2).map(briqueDe)).toContain('comparer-fractions');
  });

  it('garde pour la 3e l\'écriture scientifique, les nombres premiers et le PGCD', () => {
    ['5e', '4e'].forEach((level) => ALL_TRIMESTERS.forEach((trimester) => expect(new Set(cellule(level as Level, trimester).map(briqueDe)).has('pgcd')).toBe(false)));
    const troisieme = new Set(cellule('3e', 1).map(briqueDe));
    ['ecriture-scientifique', 'nombre-premier', 'pgcd', 'racine-carree', 'decomposition'].forEach((nom) => expect(troisieme.has(nom), nom).toBe(true));
  });

  it('écrit les nombres à la française : virgule décimale, vrai signe moins, jamais de LaTeX ni de balise', () => {
    parCellule((level, trimester) => cellule(level, trimester)).forEach(({ valeur }) =>
      valeur.forEach((question) =>
        textes(question).forEach((texte) => {
          expect(texte, texte).not.toMatch(/\d\.\d/);
          expect(texte, texte).not.toMatch(/(^|[\s(])-\d/);
          expect(texte, texte).not.toMatch(/[\^\\${}]|<\/?[a-z]/i);
        })
      )
    );
  });
});
