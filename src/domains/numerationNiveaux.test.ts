import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { fitsInFrame, type Figure, type Point, type Shape } from '../lib/figures';
import { availableAt, stageOf } from '../lib/progression';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { generate } from './numeration';
import { BRIQUES_CYCLE2 } from './numerationCycle2';
import { BRIQUES_6E } from './numerationSixieme';
import { numberToFrenchWords } from './nombresEnLettres';

/**
 * La numération du CE1, du CE2 et de la 6e : chaque question est refaite ici
 * à partir de son énoncé et de son dessin — le dessin lu comme l'élève le lit
 * (graduations, flèche, parts coloriées) —, puis comparée aux quatre
 * propositions, dont une seule doit être juste.
 */

const NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const GRAINES = 50;

function questions(level: Level, trimester: Trimester, count = 24, seeds = GRAINES): Question[] {
  return Array.from({ length: seeds }, (_, seed) => generate(level, trimester, createRng(seed * 37 + 11), count)).flat();
}

const parCellule = <T>(faire: (level: Level, trimester: Trimester) => T) =>
  NIVEAUX.flatMap((level) => ALL_TRIMESTERS.map((trimester) => ({ level, trimester, valeur: faire(level, trimester) })));

const MOTIFS_DES_BRIQUES = {
  cycle2: BRIQUES_CYCLE2.map((brique) => ({ nom: brique.name, motif: new RegExp(`^numeration-${brique.name}-\\d+-`) })),
  sixieme: BRIQUES_6E.map((brique) => ({ nom: brique.name, motif: new RegExp(`^numeration-${brique.name}-\\d+-`) })),
};

function briqueDe(question: Question, level: Level): string {
  const trouves = MOTIFS_DES_BRIQUES[level === '6e' ? 'sixieme' : 'cycle2'].filter(({ motif }) => motif.test(question.id));
  if (trouves.length !== 1) throw new Error(`${question.id} : ${trouves.length} sortes de question possibles`);
  return trouves[0].nom;
}

// --- Lire les nombres comme le fait l'élève ----------------------------------------------------------------

/** « 4 352 » (avec ses espaces insécables), « 3,14 », « 2 500 » → 4352, 3.14, 2500. */
const nombre = (texte: string): number => Number(texte.replace(/[\s ]/g, '').replace(',', '.'));

/** Les mots d'un nombre, dans l'autre sens : de 0 à 9 999, par construction. */
const MOTS_VERS_NOMBRE = new Map<string, number>(Array.from({ length: 10000 }, (_, n) => [numberToFrenchWords(n), n]));

const RANGS: Record<string, number> = { unités: 0, dizaines: 1, centaines: 2, milliers: 3, millions: 6, 'unités de mille': 3, 'dizaines de mille': 4, 'centaines de mille': 5, 'unités de million': 6, 'dizaines de million': 7, 'centaines de million': 8 };

const aire = (points: Point[]) =>
  Math.abs(points.reduce((somme, [x, y], index) => somme + x * points[(index + 1) % points.length][1] - points[(index + 1) % points.length][0] * y, 0)) / 2;

const shapesOf = <K extends Shape['kind']>(figure: Figure, kind: K) => figure.shapes.filter((shape): shape is Extract<Shape, { kind: K }> => shape.kind === kind);

/** La droite graduée, relue : les graduations, ce qui est écrit dessous, la flèche, les lettres. */
function lireLaDroite(figure: Figure) {
  const graduations = shapesOf(figure, 'segment')
    .filter((segment) => segment.width === 2 && segment.from[0] === segment.to[0])
    .map((segment) => segment.from[0])
    .sort((a, b) => a - b);
  const rangDe = (x: number) => graduations.findIndex((valeur) => Math.abs(valeur - x) < 0.2);
  const textes = shapesOf(figure, 'text');
  const etiquettes = new Map(textes.filter((texte) => texte.at[1] > 70).map((texte) => [rangDe(texte.at[0]), texte.text]));
  const fleche = shapesOf(figure, 'segment').find((segment) => segment.ink === 'couleur' && segment.from[0] === segment.to[0]);
  const lettres = new Map(textes.filter((texte) => /^[A-D]$/.test(texte.text)).map((texte) => [texte.text, rangDe(texte.at[0])]));
  return { intervalles: graduations.length - 1, etiquettes, rangFleche: fleche ? rangDe(fleche.from[0]) : undefined, lettres };
}

/** La valeur de la graduation `rang`, d'après les deux étiquettes des bouts. */
function valeurDeLaGraduation(droite: ReturnType<typeof lireLaDroite>, rang: number): number {
  const [debut, fin] = [nombre(droite.etiquettes.get(0) as string), nombre(droite.etiquettes.get(droite.intervalles) as string)];
  return debut + (rang * (fin - debut)) / droite.intervalles;
}

/** La part coloriée d'une figure partagée, en fraction du tout. */
function partColoriee(figure: Figure): number {
  const [coloriee] = shapesOf(figure, 'aire');
  const total = shapesOf(figure, 'circle')[0] ? Math.PI * shapesOf(figure, 'circle')[0].radius ** 2 : aire(shapesOf(figure, 'polygon')[0].points);
  return aire(coloriee.rings[0]) / total;
}

const pgcd = (a: number, b: number): number => (b === 0 ? a : pgcd(b, a % b));
const fraction = (texte: string): [number, number] => {
  const [n, d] = texte.split('/').map(Number);
  return [n, d];
};
const memeFraction = ([n1, d1]: [number, number], [n2, d2]: [number, number]) => n1 * d2 === n2 * d1;

/** Vaut ce que dit une somme écrite (« 300 + 40 + 7 ») ou un nombre (« 347 »). */
const valeurEcrite = (texte: string): number => texte.split(' + ').reduce((somme, terme) => somme + nombre(terme), 0);

const MOTS_FRACTIONS: Record<string, number> = { demi: 2, demis: 2, tiers: 3, quart: 4, quarts: 4, cinquième: 5, cinquièmes: 5, sixième: 6, sixièmes: 6, huitième: 8, huitièmes: 8, dixième: 10, dixièmes: 10 };
const NUMERATEURS: Record<string, number> = { un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9 };

const centimes = (texte: string): number => Math.round(nombre(texte.replace('€', '')) * 100);

/** Ce que vaut « 3 centaines + 4 dizaines + 7 unités » ou « 345 millions + 678 milliers ». */
const POIDS_DES_MOTS: Record<string, number> = { million: 1e6, millions: 1e6, millier: 1e3, milliers: 1e3, centaine: 100, centaines: 100, dizaine: 10, dizaines: 10, unité: 1, unités: 1 };
const valeurEnMots = (texte: string): number =>
  texte.split(' + ').reduce((somme, terme) => {
    const [, k, mot] = /^(.+) (\S+)$/.exec(terme) as RegExpExecArray;
    return somme + nombre(k) * POIDS_DES_MOTS[mot];
  }, 0);

/** Un énoncé « Dans N, … » : le nombre, écrit sans espaces, et ce qu'on y cherche. */
const dans = (prompt: string, motif: RegExp) => {
  const r = motif.exec(prompt) as RegExpExecArray;
  return { ecrit: r[1].replace(/[\s ]/g, ''), cherche: r[2] };
};

/** Cette proposition est-elle la bonne réponse ? Chaque forme d'énoncé a son propre calcul. */
function estLaBonne(q: Question, choix: string): boolean {
  const { prompt, instruction = '' } = q;
  let m: RegExpExecArray | null;

  // Les nombres en lettres, dans les deux sens.
  if (instruction === 'Écris ce nombre en chiffres') {
    const mots = prompt.slice(2, -2);
    if (/(dixième|centième|millième)/.test(mots)) {
      m = /^(?:(.+? unités?) et )?(.+?) (dixièmes?|centièmes?|millièmes?)$/.exec(mots) as RegExpExecArray;
      // « soixante et une unités » : « une » devant un nom féminin, « un » dans la liste des nombres.
      const entier = m[1] === undefined ? 0 : /^une unité$/.test(m[1]) ? 1 : (MOTS_VERS_NOMBRE.get(m[1].replace(/ unités$/, '').replace(/(^|[\s-])une$/, '$1un')) as number);
      const decimales = m[3].startsWith('dix') ? 1 : m[3].startsWith('cent') ? 2 : 3;
      return Math.abs(nombre(choix) - (entier + (MOTS_VERS_NOMBRE.get(m[2]) as number) / Math.pow(10, decimales))) < 1e-9;
    }
    if (mots === 'un milliard') return nombre(choix) === 1e9;
    return numberToFrenchWords(nombre(choix)) === mots;
  }
  if (instruction.startsWith('Choisis comment on lit')) {
    if (prompt.includes(',')) {
      const [entier, apres] = prompt.replace(/[\s ]/g, '').split(',');
      const rang = ['dixième', 'centième', 'millième'][apres.length - 1];
      const mots = (n: number) => `${numberToFrenchWords(n)} ${n > 1 ? `${rang}s` : rang}`;
      const unites = Number(entier) === 1 ? 'une unité' : `${numberToFrenchWords(Number(entier)).replace(/(^|[\s-])un$/, '$1une')} unités`;
      return choix === (Number(entier) === 0 ? mots(Number(apres)) : `${unites} et ${mots(Number(apres))}`);
    }
    if (prompt.includes('/')) {
      const [, numerateur, denominateur] = /^(\S+) (\S+)$/.exec(choix) as RegExpExecArray;
      return memeFraction(fraction(prompt), [NUMERATEURS[numerateur], MOTS_FRACTIONS[denominateur]]);
    }
    return choix === numberToFrenchWords(nombre(prompt));
  }
  if (instruction === 'Écris cette fraction en chiffres') {
    const [, numerateur, denominateur] = /^« (\S+) (\S+) »$/.exec(prompt) as RegExpExecArray;
    return memeFraction(fraction(choix), [NUMERATEURS[numerateur], MOTS_FRACTIONS[denominateur]]);
  }

  // Décomposer, valeur des chiffres, rangs.
  if (instruction === 'Choisis la bonne décomposition') return valeurEcrite(choix) === nombre(prompt.replace('Décompose ', ''));
  if (instruction === 'Choisis la bonne décomposition en classes') return valeurEnMots(choix) === nombre(prompt.replace('Décompose ', ''));
  if (instruction === 'Écris le nombre') return valeurEnMots(prompt) === nombre(choix);
  if (instruction === 'Complète' && /^[\d\s ]+ = .*…/.test(prompt)) {
    const [gauche, droite] = prompt.split(' = ');
    const visibles = droite.split(' + ').filter((terme) => terme !== '…').reduce((somme, terme) => somme + nombre(terme), 0);
    return nombre(gauche) - visibles === nombre(choix);
  }
  if (instruction === 'Cherche le bon chiffre') {
    const { ecrit, cherche } = dans(prompt, /^Dans (.+), quel est le chiffre des (.+) \?$/);
    const [entier, apres = ''] = ecrit.split(',');
    const decimal = ['dixièmes', 'centièmes', 'millièmes'].indexOf(cherche);
    return Number(choix) === Number(decimal >= 0 ? apres[decimal] : entier[entier.length - 1 - RANGS[cherche]]);
  }
  if (instruction === 'Cherche la bonne valeur') {
    const r = /^Dans (.+), quelle est la valeur du chiffre (\d) \?$/.exec(prompt) as RegExpExecArray;
    const ecrit = r[1].replace(/[\s ]/g, '');
    expect(ecrit.split(r[2]).length, prompt).toBe(2);
    const entier = ecrit.split(',')[0];
    const position = ecrit.replace(',', '').indexOf(r[2]);
    const rang = position < entier.length ? entier.length - 1 - position : -(position - entier.length + 1);
    return Math.abs(nombre(choix) - Number(r[2]) * Math.pow(10, rang)) < 1e-9;
  }
  if (instruction === 'Compte toutes les parts') {
    const { ecrit, cherche } = dans(prompt, /^Combien y a-t-il de (.+) dans (.+) \?$/) as unknown as { ecrit: string; cherche: string };
    const r = /^Combien y a-t-il de (.+) dans (.+) \?$/.exec(prompt) as RegExpExecArray;
    return nombre(choix) === Math.floor(nombre(r[2]) / Math.pow(10, RANGS[r[1]]));
  }
  if (/^10 .+, c'est 1 …$/.test(prompt)) {
    const suite = ['unités', 'dizaines', 'centaines', 'milliers'];
    return choix === ['unité', 'dizaine', 'centaine', 'millier'][suite.indexOf(prompt.replace(/^10 (.+), c'est 1 …$/, '$1')) + 1];
  }

  // Avant, après, suite.
  if ((m = /^Quel nombre vient juste (après|avant) (.+) \?$/.exec(prompt))) return nombre(choix) === nombre(m[2]) + (m[1] === 'après' ? 1 : -1);
  if (instruction === 'Complète la suite') {
    const termes = prompt.replace(', …', '').split(', ').map(nombre);
    const pas = termes[1] - termes[0];
    expect(termes[2] - termes[1], prompt).toBe(pas);
    return nombre(choix) === termes[2] + pas;
  }

  // Comparer, ranger, encadrer.
  if (instruction === 'Choisis le plus grand nombre' || instruction === 'Choisis le plus petit nombre') {
    const liste = prompt.split(', ').map(nombre);
    return nombre(choix) === (instruction.includes('grand') ? Math.max(...liste) : Math.min(...liste));
  }
  if (instruction === 'Choisis le plus grand prix' || instruction === 'Choisis le plus petit prix') {
    const liste = prompt.split(', ').map(centimes);
    return centimes(choix) === (instruction.includes('grand') ? Math.max(...liste) : Math.min(...liste));
  }
  if (instruction === 'Choisis la plus grande fraction' || instruction === 'Choisis la plus petite fraction') {
    const liste = prompt.split(', ').map(fraction);
    const grande = instruction.includes('grande');
    const cible = liste.reduce((a, b) => ((a[0] / a[1] < b[0] / b[1]) === grande ? b : a));
    return memeFraction(fraction(choix), cible);
  }
  if (instruction === 'Compare avec <, > ou =') {
    const [gauche, droite] = prompt.split(' … ');
    const valeur = (texte: string) => (texte.includes('/') ? fraction(texte)[0] / fraction(texte)[1] : valeurEcrite(texte));
    const [a, b] = [valeur(gauche), valeur(droite)];
    return choix === (Math.abs(a - b) < 1e-9 ? '=' : a < b ? '<' : '>');
  }
  if (instruction.startsWith('Range du plus')) {
    const croissant = instruction.includes('petit au plus grand');
    const valeur = (texte: string) => (texte.includes('/') ? fraction(texte)[0] / fraction(texte)[1] : nombre(texte));
    const attendu = [...prompt.split(', ')].sort((a, b) => (croissant ? valeur(a) - valeur(b) : valeur(b) - valeur(a)));
    return choix === attendu.join(croissant ? ' < ' : ' > ');
  }
  if (instruction.startsWith('Encadre entre deux')) {
    const [bas, milieu, haut] = choix.split(' < ').map(nombre);
    const valeur = nombre(prompt);
    const mot = instruction.replace('Encadre entre deux ', '').replace(' qui se suivent', '');
    const pas = ({ entiers: 1, dixièmes: 0.1, centièmes: 0.01, dizaines: 10, centaines: 100, milliers: 1000 } as Record<string, number>)[mot];
    return bas < valeur && valeur < haut && Math.abs(milieu - valeur) < 1e-9 && Math.abs(haut - bas - pas) < 1e-9 && Math.abs(bas / pas - Math.round(bas / pas)) < 1e-9;
  }
  if (instruction === 'Encadre cette fraction par deux entiers qui se suivent') {
    const [n, d] = fraction(prompt);
    const [, a, b] = /^entre (\d+) et (\d+)$/.exec(choix) as RegExpExecArray;
    return Number(a) < n / d && n / d < Number(b) && Number(b) - Number(a) === 1;
  }
  if (instruction === 'Cherche le nombre qui est entre les deux') {
    const [, bas, haut] = /^Entre (.+) et (.+)$/.exec(prompt) as RegExpExecArray;
    return nombre(bas) < nombre(choix) && nombre(choix) < nombre(haut);
  }

  // Les droites graduées.
  if (prompt === 'Quel nombre indique la flèche ?') {
    const droite = lireLaDroite(q.figure!);
    return Math.abs(nombre(choix) - valeurDeLaGraduation(droite, droite.rangFleche as number)) < 1e-9;
  }
  if ((m = /^Quelle lettre est à la place de (.+) \?$/.exec(prompt))) {
    const droite = lireLaDroite(q.figure!);
    return Math.abs(valeurDeLaGraduation(droite, droite.lettres.get(choix) as number) - nombre(m[1])) < 1e-9;
  }
  if (prompt === 'Quelle fraction indique la flèche ?') {
    const droite = lireLaDroite(q.figure!);
    const [n, d] = fraction(choix);
    const parts = Number(/(\d+) parts égales/.exec(instruction)![1]);
    const fleche = droite.rangFleche as number;
    // Au CE, la droite va de 0 à 1 : toutes ses parts sont celles de la consigne. En 6e, chaque unité a ses parts.
    return instruction.startsWith('La droite est graduée en') ? n * droite.intervalles === fleche * d : n * parts === fleche * d;
  }

  // Les fractions et les pourcentages.
  if (prompt === 'Quelle fraction est coloriée ?') {
    const parts = Number(/en (\d+) parts égales/.exec(instruction)![1]);
    const coloriees = Math.round(partColoriee(q.figure!) * parts);
    expect(Math.abs(partColoriee(q.figure!) * parts - coloriees), q.id).toBeLessThan(0.08);
    return memeFraction(fraction(choix), [coloriees, parts]);
  }
  if ((m = /partagée? en (\d+) parts égales\. On en mange (\d+)\./.exec(prompt))) return memeFraction(fraction(choix), [Number(m[2]), Number(m[1])]);
  if (instruction === 'Choisis la bonne fraction') {
    const [, a, b] = /^(\d+) ÷ (\d+)$/.exec(prompt) as RegExpExecArray;
    return memeFraction(fraction(choix), [Number(a), Number(b)]);
  }
  if (/^On (partage|coupe|verse) /.test(prompt)) {
    const [, a, b] = /(\d+) [^\d]*?(?:entre|en|dans) (\d+)/.exec(prompt) as RegExpExecArray;
    return memeFraction(fraction(choix), [Number(a), Number(b)]);
  }
  if (instruction === 'Écris avec une virgule') {
    if (prompt.includes('/')) return Math.abs(nombre(choix) - fraction(prompt)[0] / fraction(prompt)[1]) < 1e-9;
    return Math.abs(nombre(choix) - nombre(prompt.replace('%', '')) / 100) < 1e-9;
  }
  if (instruction === 'Écris avec une fraction décimale') {
    const [n, d] = fraction(choix);
    return Math.abs(n / d - nombre(prompt)) < 1e-9 && [10, 100].includes(d);
  }
  if (instruction === 'Écris avec une fraction simple') {
    return Math.abs(fraction(choix)[0] / fraction(choix)[1] - nombre(prompt.replace('%', '')) / 100) < 1e-9;
  }
  if (instruction === 'Choisis le bon pourcentage') {
    const [n, d] = fraction(prompt.replace('Quel pourcentage correspond à ', '').replace(' ?', ''));
    return Math.abs(nombre(choix.replace('%', '')) - (100 * n) / d) < 1e-9;
  }
  if (instruction === 'Écris avec un entier et une fraction') {
    const [n, d] = fraction(prompt);
    const [, entier, reste] = /^(\d+) \+ (\d+\/\d+)$/.exec(choix) as RegExpExecArray;
    return Math.abs(Number(entier) + fraction(reste)[0] / fraction(reste)[1] - n / d) < 1e-9;
  }

  // La monnaie.
  if (instruction === 'Choisis la bonne écriture du prix') {
    const [, euros, cents] = /^(\d+) euros? et (\d+) centimes$/.exec(prompt) as RegExpExecArray;
    return centimes(choix) === Number(euros) * 100 + Number(cents) && /^\d+,\d\d €$/.test(choix);
  }
  if (instruction === 'Choisis ce que veut dire ce prix') {
    const trouve = /^(\d+) euros? (\d+) centimes?$/.exec(choix);
    return trouve !== null && Number(trouve[1]) * 100 + Number(trouve[2]) === centimes(prompt);
  }

  // Le milliard.
  if (prompt === "Un milliard, c'est … millions") return nombre(choix) === 1000;
  if (prompt.startsWith('Combien de zéros dans')) return Number(choix) === 9;
  if (prompt.startsWith("Un million, c'est un milliard divisé par")) return nombre(choix) === 1000;
  throw new Error(`Énoncé de numération non reconnu : ${instruction} | ${prompt}`);
}

describe('les questions de numération du CE1, du CE2 et de la 6e', () => {
  it('ont des propositions différentes et une bonne réponse', () => {
    parCellule((level, trimester) => questions(level, trimester, 12)).forEach(({ level, trimester, valeur }) => {
      expect(valeur.length, `${level} T${trimester}`).toBe(12 * GRAINES);
      valeur.forEach((question) => {
        expect(question.domain).toBe('numeration');
        expect(question.choices.length, question.prompt).toBeGreaterThanOrEqual(3);
        expect(question.choices.length, question.prompt).toBeLessThanOrEqual(4);
        expect(new Set(question.choices).size, question.prompt).toBe(question.choices.length);
        expect(question.choices[question.correctIndex], question.prompt).toBeDefined();
        expect(question.instruction, question.prompt).toBeTruthy();
        expect(question.explanation, question.prompt).toBeTruthy();
      });
    });
  });

  it('ont quatre propositions, sauf « < », « > », « = » qui en ont trois', () => {
    parCellule((level, trimester) => questions(level, trimester, 12)).forEach(({ valeur }) =>
      valeur.forEach((question) => {
        const symboles = question.choices.every((choix) => ['<', '>', '='].includes(choix));
        expect(question.choices, question.prompt).toHaveLength(symboles ? 3 : 4);
      })
    );
  });

  it('sont reproductibles à graine égale', () => {
    NIVEAUX.forEach((level) => expect(generate(level, 3, createRng(21), 30)).toEqual(generate(level, 3, createRng(21), 30)));
  });

  it('proposent la bonne réponse, refaite à partir de l\'énoncé et du dessin, et aucune autre qui la vaille', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) =>
      valeur.forEach((question) => {
        const justes = question.choices.filter((choix) => estLaBonne(question, choix));
        expect(justes, `${level} T${trimester} ${briqueDe(question, level)} « ${question.instruction} | ${question.prompt} » : ${question.choices.join(' / ')}`).toEqual([
          question.choices[question.correctIndex],
        ]);
      })
    );
  });

  it('ne laissent pas deviner la bonne réponse à son écriture : entier, décimal ou fraction', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ valeur }) =>
      valeur.forEach((question) => {
        const classe = (texte: string) => (/^[\d\s ]+,\d+$/.test(texte) ? 'décimal' : /^[\d\s ]+$/.test(texte) ? 'entier' : 'autre');
        const juste = classe(question.choices[question.correctIndex]);
        if (juste === 'autre') return;
        const semblables = question.choices.filter((choix) => classe(choix) === juste).length;
        // La seule de son écriture : on la verrait.
        expect(semblables, `${question.prompt} : ${question.choices.join(' / ')}`).toBeGreaterThan(1);
      })
    );
  });
});

describe('les dessins de la numération', () => {
  it('tiennent dans leur cadre, avec leurs textes', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ valeur }) =>
      valeur
        .filter((question) => question.figure)
        .forEach((question) => {
          const figure = question.figure as Figure;
          expect(fitsInFrame(figure), question.id).toBe(true);
          shapesOf(figure, 'text').forEach((texte) => {
            const demi = (texte.text.length * (texte.size ?? 15) * 0.56) / 2;
            expect(texte.at[0] - demi, `${question.id} ${texte.text}`).toBeGreaterThanOrEqual(0);
            expect(texte.at[0] + demi, `${question.id} ${texte.text}`).toBeLessThanOrEqual(figure.width);
          });
          expect(figure.alt.length).toBeGreaterThan(10);
        })
    );
  });

  it('ne donnent pas la réponse dans leur description', () => {
    // La droite graduée dit son pas et ses bouts, pas la graduation que désigne la flèche : la valeur
    // peut y figurer par hasard (une flèche en 100 sur une droite de 100 en 100).
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ valeur }) =>
      valeur
        .filter((question) => question.figure && /fraction/.test(question.prompt))
        .forEach((question) => expect(question.figure!.alt, question.id).not.toContain(question.choices[question.correctIndex]))
    );
  });
});

describe('les nombres du programme', () => {
  const nombresDe = (question: Question) => [question.prompt, ...(question.choices.some((c) => /\d/.test(c)) ? [] : [])].join(' ').match(/\d[\d\s ]*(?:,\d+)?/g) ?? [];

  it('restent au CE1 dans les nombres jusqu\'à 1 000, sans décimal hors de la monnaie', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE1', trimester).forEach((question) => {
        const monnaie = /€|euro/.test([question.prompt, ...question.choices].join(' '));
        [...nombresDe(question), ...question.choices.filter((choix) => /^[\d\s ]+$/.test(choix))].forEach((texte) => {
          if (!monnaie) expect(nombre(texte), `${question.prompt} ${texte}`).toBeLessThanOrEqual(1000);
        });
        if (!monnaie) [question.prompt, ...question.choices].forEach((texte) => expect(texte, question.prompt).not.toMatch(/\d,\d/));
      })
    );
  });

  it('restent au CE2 dans les nombres jusqu\'à 10 000, sans décimal hors de la monnaie', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE2', trimester).forEach((question) => {
        const monnaie = /€|euro/.test([question.prompt, ...question.choices].join(' '));
        [...nombresDe(question), ...question.choices.filter((choix) => /^[\d\s ]+$/.test(choix))].forEach((texte) => {
          if (!monnaie) expect(nombre(texte), `${question.prompt} ${texte}`).toBeLessThanOrEqual(10000);
        });
        if (!monnaie) [question.prompt, ...question.choices].forEach((texte) => expect(texte, question.prompt).not.toMatch(/\d,\d/));
      })
    );
  });

  it('n\'écrivent jamais de fraction supérieure à 1 au CE1 ni au CE2', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questions(level, trimester).forEach((question) =>
          [question.prompt, ...question.choices].forEach((texte) => {
            (texte.match(/\d+\/\d+/g) ?? []).forEach((ecrite) => {
              const [n, d] = fraction(ecrite);
              expect(n, `${question.prompt} : ${ecrite}`).toBeLessThanOrEqual(d);
            });
          })
        )
      )
    );
  });

  it('ne connaissent au CE1 que le demi, le tiers et le quart : dénominateurs 2, 3 et 4', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE1', trimester).forEach((question) =>
        [question.prompt, question.instruction ?? '', ...question.choices].forEach((texte) => {
          (texte.match(/\d+\/(\d+)/g) ?? []).forEach((ecrite) => expect([2, 3, 4], `${question.prompt} : ${ecrite}`).toContain(fraction(ecrite)[1]));
          expect(texte).not.toMatch(/cinquième|sixième|huitième|dixième/);
        })
      )
    );
  });

  it('au CE2, les fractions ont pour dénominateur 2, 3, 4, 5, 6, 8 ou 10', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE2', trimester).forEach((question) =>
        [question.prompt, ...question.choices].forEach((texte) =>
          (texte.match(/\d+\/(\d+)/g) ?? []).forEach((ecrite) => expect([2, 3, 4, 5, 6, 8, 10], `${question.prompt} : ${ecrite}`).toContain(fraction(ecrite)[1]))
        )
      )
    );
  });

  it('vont en 6e jusqu\'au milliard, le milliard lui-même n\'arrivant qu\'au 2e trimestre', () => {
    const plusGrand = (trimester: Trimester) =>
      Math.max(
        ...questions('6e', trimester, 24, 80).flatMap((question) =>
          [question.prompt, ...question.choices].flatMap((texte) => (texte.match(/\d[\d ]*\d/g) ?? []).filter((m) => !m.includes(',')).map(nombre))
        )
      );
    expect(plusGrand(1)).toBeLessThan(1e9);
    expect(plusGrand(2)).toBeLessThanOrEqual(1e9);
    expect(plusGrand(3)).toBeLessThanOrEqual(1e9);
    expect(plusGrand(1)).toBeGreaterThan(1e8);
  });

  it('écrivent en 6e des décimaux de trois décimales au plus, et jamais de zéro inutile', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('6e', trimester).forEach((question) =>
        [question.prompt, ...question.choices].forEach((texte) =>
          (texte.match(/\d+,\d+/g) ?? []).forEach((ecrit) => {
            expect(ecrit.split(',')[1].length, `${question.prompt} : ${ecrit}`).toBeLessThanOrEqual(3);
            // Seule exception : « 2,5 … 2,50 », où l'on montre qu'un zéro ne change rien.
            if (!question.prompt.includes('…')) expect(ecrit, question.prompt).not.toMatch(/,\d*0$/);
          })
        )
      )
    );
  });

  it('ne parlent de pourcentage et de nombre mixte qu\'à partir du 2e trimestre de la 6e', () => {
    questions('6e', 1).forEach((question) =>
      [question.prompt, question.instruction ?? '', ...question.choices].forEach((texte) => {
        expect(texte).not.toMatch(/%/);
        expect(texte).not.toMatch(/\d \+ \d+\/\d+/);
      })
    );
    // 10, 25, 50 et 75 % au 2e trimestre ; 20, 5 et 1 % seulement au 3e.
    const pourcentages = (trimester: Trimester) =>
      new Set(
        questions('6e', trimester, 24, 80).flatMap((question) =>
          [question.prompt, ...question.choices].flatMap((texte) => (texte.match(/\b\d+ %/g) ?? []).map((ecrit) => Number(ecrit.replace(' %', ''))))
        )
      );
    expect([...pourcentages(2)].sort((a, b) => a - b)).toEqual([10, 25, 50, 75, 100]);
    expect([20, 5, 1].every((p) => pourcentages(3).has(p))).toBe(true);
  });

  it('commencent la fraction au 2e trimestre du CE1, la monnaie au 3e', () => {
    const noms = (trimester: Trimester) => new Set(questions('CE1', trimester, 40, 30).map((question) => briqueDe(question, 'CE1')));
    expect([...noms(1)].some((nom) => nom.startsWith('fraction') || nom.startsWith('monnaie'))).toBe(false);
    expect(noms(2).has('fraction-figure')).toBe(true);
    expect(noms(2).has('monnaie')).toBe(false);
    expect(noms(3).has('monnaie')).toBe(true);
    expect(noms(3).has('fraction-droite')).toBe(true);
  });

  it('tirent chaque sorte de question déjà enseignée : aucune n\'échappe aux vérifications', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) => {
      const attendues = availableAt(level === '6e' ? BRIQUES_6E : BRIQUES_CYCLE2, stageOf(level, trimester)).map((brique) => brique.name);
      const tirees = new Set(valeur.map((question) => briqueDe(question, level)));
      attendues.forEach((nom) => expect(tirees.has(nom), `${level} T${trimester} : ${nom}`).toBe(true));
    });
  });

  it('ne laissent sortir aucune sorte de question avant son étape', () => {
    parCellule((level, trimester) => questions(level, trimester, 12, 20)).forEach(({ level, trimester, valeur }) =>
      valeur.forEach((question) => {
        const briques = level === '6e' ? BRIQUES_6E : BRIQUES_CYCLE2;
        const brique = briques.find((entree) => entree.name === briqueDe(question, level));
        expect(brique!.minStage, question.id).toBeLessThanOrEqual(stageOf(level, trimester));
      })
    );
  });
});

describe('la numération écrite en lettres', () => {
  it('lit « quatre-vingts » et « soixante et onze » comme à l\'école', () => {
    expect(numberToFrenchWords(80)).toBe('quatre-vingts');
    expect(numberToFrenchWords(71)).toBe('soixante et onze');
    expect(MOTS_VERS_NOMBRE.get('mille')).toBe(1000);
    expect(pgcd(12, 18)).toBe(6);
  });
});
