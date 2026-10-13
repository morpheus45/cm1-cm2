import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { availableAt, stageOf } from '../lib/progression';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { generate } from './calcul';
import { BRIQUES_CALCUL_CYCLE4 } from './calculCycle4';
import { divQ, eqQ, evaluer, evaluerAvecLettres, lireNombre, lirePolynome, lireRationnel, memeExpression, negQ, q, racineQ, subQ, type Q } from './verificationCycle4';

/**
 * Le calcul de la 5e, de la 4e et de la 3e : chaque question est refaite ici à
 * partir de son énoncé — un lecteur d'expressions exact, qui ne partage rien avec
 * les générateurs (verificationCycle4.ts) —, puis comparée aux propositions, dont
 * une seule doit être juste. Les équations se vérifient en remplaçant la lettre,
 * les développements et les factorisations en comparant les expressions en
 * plusieurs points.
 */

const NIVEAUX: Level[] = ['5e', '4e', '3e'];
/** Cinquante graines par cellule suffisent à chaque exécution ; VITE_GRAINES_CYCLE4=2000 npm test pour une vérification plus longue. */
const GRAINES = Number(import.meta.env.VITE_GRAINES_CYCLE4 ?? 50);

function questions(level: Level, trimester: Trimester, count = 24, seeds = GRAINES): Question[] {
  return Array.from({ length: seeds }, (_, seed) => generate(level, trimester, createRng(seed * 31 + 5), count)).flat();
}

const parCellule = <T>(faire: (level: Level, trimester: Trimester) => T) =>
  NIVEAUX.flatMap((level) => ALL_TRIMESTERS.map((trimester) => ({ level, trimester, valeur: faire(level, trimester) })));

const MOTIFS = BRIQUES_CALCUL_CYCLE4.map((brique) => ({ nom: brique.name, motif: new RegExp(`^calcul-${brique.name}-\\d+-`) }));

function briqueDe(question: Question): string {
  const trouves = MOTIFS.filter(({ motif }) => motif.test(question.id));
  if (trouves.length !== 1) throw new Error(`${question.id} : ${trouves.length} sortes de question possibles`);
  return trouves[0].nom;
}

// --- Refaire les calculs --------------------------------------------------------------------------------------------

type Juge = (choix: string) => boolean;

const nombre = (texte: string) => lireNombre(texte) as Q;
const rationnel = (texte: string) => lireRationnel(texte) as Q;
const vautLeNombre = (attendu: Q): Juge => (choix) => {
  const valeur = lireRationnel(choix);
  return valeur !== null && eqQ(valeur, attendu);
};
const pgcdEntiers = (a: number, b: number): number => (b === 0 ? a : pgcdEntiers(b, a % b));
const estIrreductible = (fraction: string) => {
  const m = /^(\d+)\/(\d+)$/.exec(fraction);
  return m !== null && pgcdEntiers(Number(m[1]), Number(m[2])) === 1;
};
const lettresDe = (expression: string) => [...new Set(expression.match(/\p{L}/gu) ?? [])];

/** Une expression littérale lue sans planter : une proposition qui ne se lit pas n'est pas la bonne. */
const memeQue = (attendu: string, lettres: string[]): Juge => (choix) => {
  try {
    return memeExpression(choix, attendu, lettres);
  } catch {
    return false;
  }
};

const MULTIPLICATEURS: Record<string, number> = { 'Le double de': 2, 'Le triple de': 3, 'Le quadruple de': 4 };
const facteurDe = (texte: string) => MULTIPLICATEURS[texte] ?? Number(/^(\d+) fois$/.exec(texte)?.[1]);

/** Ce que vaut une équation « gauche = droite » quand la lettre vaut `valeur`. */
const verifieEquation = (equation: string, lettre: string, valeur: Q) => {
  const [gauche, droite] = equation.split(' = ');
  return eqQ(evaluerAvecLettres(gauche, { [lettre]: valeur }), evaluerAvecLettres(droite, { [lettre]: valeur }));
};

/** « x = −3/2 » : la lettre et la valeur d'une solution. */
const lireSolution = (choix: string) => {
  const m = /^(\p{L}) = (.+)$/u.exec(choix);
  return m ? { lettre: m[1], valeur: lireRationnel(m[2]) } : null;
};

/** « −5 et 3 », « 4 », « Aucune solution » : un ensemble de solutions écrit, rangé. */
function lireEnsemble(choix: string): Q[] | null {
  if (choix === 'Aucune solution') return [];
  const valeurs = choix.split(' et ').map(lireRationnel);
  return valeurs.every((v) => v !== null) ? (valeurs as Q[]) : null;
}
const memeEnsemble = (a: Q[], b: Q[]) => a.length === b.length && a.every((v) => b.some((w) => eqQ(v, w)));

const RETOURNEES: Record<string, string> = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };

function jugeDe(question: Question): Juge {
  const { prompt, instruction = '' } = question;
  const nom = briqueDe(question);
  let m: RegExpExecArray | null;
  switch (nom) {
    case 'priorites':
    case 'priorites-relatifs':
    case 'division-decimale':
    case 'operations-decimaux':
    case 'carres-calcul':
    case 'somme-relatifs':
    case 'difference-relatifs':
    case 'somme-algebrique':
    case 'parentheses-moins':
    case 'produit-relatifs':
    case 'quotient-relatifs':
    case 'produit-fractions':
    case 'quotient-fractions':
    case 'fraction-fois-entier':
    case 'priorites-fractions':
    case 'somme-fractions':
      return vautLeNombre(evaluer(prompt));
    case 'fraction-quantite':
      if ((m = /^(\d+\/\d+) de (\d+)$/.exec(prompt))) return vautLeNombre(evaluer(`${m[1]} × ${m[2]}`));
      break;
    case 'ecriture-litterale':
    case 'reduire':
    case 'reduire-signes':
    case 'developper-simple':
    case 'developper-reduire':
    case 'double-distributivite':
    case 'identite-developper':
    case 'developper-identite':
    case 'factoriser-commun':
    case 'factoriser-identite':
      return memeQue(prompt, lettresDe(prompt));
    case 'formule':
    case 'substituer-relatif':
      if ((m = /^(.+) pour (\p{L}) = (.+)$/u.exec(prompt))) return vautLeNombre(evaluerAvecLettres(m[1], { [m[2]]: nombre(m[3]) }));
      if ((m = /^P = (.+) avec L = (\d+) et l = (\d+)$/.exec(prompt))) return vautLeNombre(evaluerAvecLettres(m[1], { L: nombre(m[2]), l: nombre(m[3]) }));
      break;
    case 'traduire': {
      if ((m = /^(Le double de|Le triple de|Le quadruple de|\d+ fois) la somme de (\p{L}) et de (\d+)$/u.exec(prompt))) return memeQue(`${facteurDe(m[1])}(${m[2]} + ${m[3]})`, [m[2]]);
      if ((m = /^(Le double de|Le triple de|Le quadruple de|\d+ fois) (\p{L}), (augmenté|diminué) de (\d+)$/u.exec(prompt))) {
        return memeQue(`${facteurDe(m[1])}${m[2]} ${m[3] === 'augmenté' ? '+' : '−'} ${m[4]}`, [m[2]]);
      }
      if ((m = /^La différence de (\p{L}) et de (\d+)$/u.exec(prompt))) return memeQue(`${m[1]} − ${m[2]}`, [m[1]]);
      if ((m = /^Le produit de (\p{L}) par (\d+), augmenté de (\d+)$/u.exec(prompt))) return memeQue(`${m[2]}${m[1]} + ${m[3]}`, [m[1]]);
      break;
    }
    case 'solution-equation':
      if ((m = /^Quel nombre est solution de l'équation (.+) \?$/.exec(prompt))) {
        const equation = m[1];
        const [lettre] = lettresDe(equation);
        return (choix) => verifieEquation(equation, lettre, nombre(choix));
      }
      break;
    case 'equation-simple':
    case 'equation-ax-b':
    case 'equation-complete':
    case 'equation-parentheses': {
      const [lettre] = lettresDe(prompt);
      return (choix) => {
        const solution = lireSolution(choix);
        return solution !== null && solution.lettre === lettre && solution.valeur !== null && verifieEquation(prompt, lettre, solution.valeur);
      };
    }
    case 'produit-nul':
      if ((m = /^(.+) = 0$/.exec(prompt))) {
        const [lettre] = lettresDe(prompt);
        return (choix) => {
          const ensemble = lireEnsemble(choix);
          return ensemble !== null && ensemble.length === 2 && !eqQ(ensemble[0], ensemble[1]) && ensemble.every((v) => eqQ(evaluerAvecLettres(m![1], { [lettre]: v }), q(0)));
        };
      }
      break;
    case 'equation-carre':
      if ((m = /^(\p{L})² = (.+)$/u.exec(prompt))) {
        const droite = nombre(m[2]);
        const racine = droite.n < 0n ? null : racineQ(droite);
        const attendu = racine === null ? [] : [racine, negQ(racine)];
        return (choix) => {
          const ensemble = lireEnsemble(choix);
          return ensemble !== null && memeEnsemble(ensemble, attendu);
        };
      }
      break;
    case 'resoudre-factorisant':
      if ((m = /^(.+) = 0$/.exec(prompt))) {
        const [lettre] = lettresDe(prompt);
        const racines = Array.from({ length: 401 }, (_, k) => q(k - 200)).filter((v) => eqQ(evaluerAvecLettres(m![1], { [lettre]: v }), q(0)));
        return (choix) => {
          const ensemble = lireEnsemble(choix);
          return ensemble !== null && memeEnsemble(ensemble, racines);
        };
      }
      break;
    case 'inequation':
      if ((m = /^(.+) (<|>|≤|≥) (.+)$/.exec(prompt))) {
        const [lettre] = lettresDe(m[1]);
        const polynome = lirePolynome(m[1], lettre);
        const [a, b] = [polynome.get(1) as Q, polynome.get(0) ?? q(0)];
        const frontiere = divQ(subQ(nombre(m[3]), b), a);
        const signe = a.n < 0n ? RETOURNEES[m[2]] : m[2];
        return (choix) => {
          const lue = new RegExp(`^${lettre} (<|>|≤|≥) (.+)$`).exec(choix);
          return lue !== null && lue[1] === signe && eqQ(rationnel(lue[2]), frontiere);
        };
      }
      break;
    case 'systeme':
      if ((m = /^(.+ = .+) et (.+ = .+)$/.exec(prompt))) {
        const equations = [m[1], m[2]];
        return (choix) => {
          const lue = /^x = (.+) et y = (.+)$/.exec(choix);
          if (!lue) return false;
          const valeurs = { x: rationnel(lue[1]), y: rationnel(lue[2]) };
          return equations.every((equation) => {
            const [gauche, droite] = equation.split(' = ');
            return eqQ(evaluerAvecLettres(gauche, valeurs), evaluerAvecLettres(droite, valeurs));
          });
        };
      }
      break;
    case 'racines-calcul':
      if ((m = /^\(√(\d+)\)²$/.exec(prompt))) return vautLeNombre(nombre(m[1]));
      return vautLeNombre(evaluer(prompt));
  }
  throw new Error(`Énoncé de calcul non reconnu (${nom}) : « ${instruction} » « ${prompt} »`);
}

// --- Les contrôles ----------------------------------------------------------------------------------------------------

describe('les questions de calcul de la 5e, de la 4e et de la 3e', () => {
  it('ont quatre propositions différentes, une consigne et une explication', () => {
    parCellule((level, trimester) => questions(level, trimester, 12)).forEach(({ level, trimester, valeur }) => {
      expect(valeur.length, `${level} T${trimester}`).toBe(12 * GRAINES);
      valeur.forEach((question) => {
        expect(question.domain).toBe('calcul');
        expect(question.choices, question.prompt).toHaveLength(4);
        expect(new Set(question.choices).size, question.prompt).toBe(4);
        expect(question.choices[question.correctIndex], question.prompt).toBeDefined();
        expect(question.instruction, question.prompt).toBeTruthy();
        expect(question.explanation, question.prompt).toBeTruthy();
      });
    });
  });

  it('sont reproductibles à graine égale', () => {
    NIVEAUX.forEach((level) => expect(generate(level, 2, createRng(9), 20)).toEqual(generate(level, 2, createRng(9), 20)));
  });

  it('proposent la bonne réponse, refaite à partir de l\'énoncé, et aucune autre qui la vaille', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) =>
      valeur.forEach((question) => {
        const justes = question.choices.filter(jugeDe(question));
        expect(justes, `${level} T${trimester} : ${question.instruction} ${question.prompt} → ${question.choices.join(' | ')}`).toEqual([question.choices[question.correctIndex]]);
      })
    );
  });

  it('donnent des fractions simplifiées, des développements sans parenthèses et des factorisations avec', () => {
    parCellule((level, trimester) => questions(level, trimester, 24, 30)).forEach(({ valeur }) =>
      valeur.forEach((question) => {
        const juste = question.choices[question.correctIndex];
        const nom = briqueDe(question);
        if (['somme-fractions', 'fraction-fois-entier', 'produit-fractions', 'quotient-fractions', 'priorites-fractions'].includes(nom)) {
          expect(estIrreductible(juste), `${question.prompt} → ${juste}`).toBe(true);
        }
        if (['developper-simple', 'developper-reduire', 'double-distributivite', 'identite-developper', 'developper-identite', 'reduire', 'reduire-signes'].includes(nom)) {
          expect(juste, `${question.prompt} → ${juste}`).not.toMatch(/[()]/);
        }
        if (['factoriser-commun', 'factoriser-identite'].includes(nom)) expect(juste, `${question.prompt} → ${juste}`).toMatch(/\(/);
      })
    );
  });

  it('ne laissent sortir aucune sorte hors de son étape', () => {
    parCellule((level, trimester) => {
      const vues = new Set(questions(level, trimester, 24, 80).map(briqueDe));
      const attendues = availableAt(BRIQUES_CALCUL_CYCLE4, stageOf(level, trimester)).map((brique) => brique.name);
      return { vues, attendues };
    }).forEach(({ level, trimester, valeur }) => expect([...valeur.vues].sort(), `${level} T${trimester}`).toEqual([...valeur.attendues].sort()));
  });

  it('apportent du nouveau à chaque trimestre : au moins une sorte, et sept au premier de la 5e', () => {
    const noms = BRIQUES_CALCUL_CYCLE4.map((brique) => brique.name);
    expect(new Set(noms).size).toBe(noms.length);
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        expect(BRIQUES_CALCUL_CYCLE4.filter((brique) => brique.minStage === stageOf(level, trimester)).length, `${level} T${trimester}`).toBeGreaterThanOrEqual(1)
      )
    );
    expect(BRIQUES_CALCUL_CYCLE4.filter((brique) => brique.minStage === stageOf('5e', 1)).length).toBeGreaterThanOrEqual(7);
  });
});

describe('ce que le calcul du collège ne dit pas avant son heure', () => {
  const textes = (question: Question) => [question.instruction ?? '', question.prompt, ...question.choices, question.explanation ?? ''];
  const cellule = (level: Level, trimester: Trimester) => questions(level, trimester, 24, 40);

  it('ne multiplie ni ne divise de relatifs en 5e', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      cellule('5e', trimester).forEach((question) => expect(question.prompt, question.prompt).not.toMatch(/\(−[\d,]+\)\s*[×÷]|[×÷]\s*\(−[\d,]+\)/))
    );
  });

  it('ne met aucune lettre des deux côtés d\'une équation en 5e, ni de produit nul, d\'inéquation ou de système', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      cellule('5e', trimester)
        .filter((question) => question.prompt.includes(' = ') && !question.prompt.startsWith('P = '))
        .forEach((question) => expect(question.prompt, question.prompt).not.toMatch(/\p{L}.*=.*\p{L}/u))
    );
  });

  it('ne développe ni ne factorise rien avant la 3e : pas de produit de deux parenthèses, pas de carré d\'une somme de lettres', () => {
    (['5e', '4e'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        cellule(level, trimester).forEach((question) => {
          expect(question.prompt, question.prompt).not.toMatch(/\)\(/);
          expect(question.prompt, question.prompt).not.toMatch(/\([^)]*\p{L}[^)]*\)²/u);
          expect(question.instruction, question.prompt).not.toBe('Factorise');
        })
      )
    );
  });

  it('ne résout en 4e ni inéquation, ni système, ni équation produit nul, ni racine carrée', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      cellule('4e', trimester).forEach((question) => {
        textes(question).forEach((texte) => expect(texte, texte).not.toMatch(/√/));
        expect(question.instruction, question.prompt).not.toMatch(/inéquation|système/);
        expect(question.prompt, question.prompt).not.toMatch(/ = 0$/);
        expect(question.prompt, question.prompt).not.toMatch(/ [<>≤≥] /);
      })
    );
  });

  it('commence la 4e par les relatifs et les fractions, et garde l\'équation ax + b = cx + d pour le 2e trimestre', () => {
    const premier = new Set(cellule('4e', 1).map(briqueDe));
    ['produit-relatifs', 'quotient-relatifs', 'produit-fractions', 'quotient-fractions'].forEach((nom) => expect(premier.has(nom), nom).toBe(true));
    expect(premier.has('equation-complete')).toBe(false);
    expect(new Set(cellule('4e', 2).map(briqueDe)).has('equation-complete')).toBe(true);
  });

  it('garde pour la 3e la double distributivité, la factorisation et les identités', () => {
    const quatrieme = new Set(ALL_TRIMESTERS.flatMap((trimester) => cellule('4e', trimester).map(briqueDe)));
    ['double-distributivite', 'identite-developper', 'factoriser-commun', 'factoriser-identite', 'produit-nul', 'inequation', 'systeme'].forEach((nom) => expect(quatrieme.has(nom), nom).toBe(false));
    const troisieme = new Set(cellule('3e', 3).map(briqueDe));
    ['double-distributivite', 'identite-developper', 'factoriser-commun', 'factoriser-identite', 'produit-nul', 'inequation', 'systeme'].forEach((nom) => expect(troisieme.has(nom), nom).toBe(true));
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
