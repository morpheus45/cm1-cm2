import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { evaluateCalculation, parseFrenchNumber } from '../lib/classProblems';
import { needsBrouillon } from '../lib/brouillon';
import { stageOf, type Stage } from '../lib/progression';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { buildOperations, eligibleOperationKinds, generate } from './calcul';
import { BRIQUES_CYCLE2 } from './calculCycle2';
import { BRIQUES_6E } from './calculSixieme';
import { rangsDEmprunt, rangsDeRetenue } from './calculErreurs';

/**
 * Le calcul du CE1, du CE2 et de la 6e : chaque question est refaite ici à
 * partir de son énoncé, par un calcul qui n'a rien à voir avec celui du
 * générateur (le calculateur de src/lib/classProblems.ts, des fractions à
 * dénominateur commun), puis comparée à la bonne réponse proposée — et aux
 * trois autres, qui ne doivent pas la valoir.
 */

const NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const GRAINES = 60;

function questions(level: Level, trimester: Trimester, count = 24, seeds = GRAINES): Question[] {
  return Array.from({ length: seeds }, (_, seed) => generate(level, trimester, createRng(seed * 31 + 5), count)).flat();
}

const parCellule = <T>(faire: (level: Level, trimester: Trimester) => T) =>
  NIVEAUX.flatMap((level) => ALL_TRIMESTERS.map((trimester) => ({ level, trimester, valeur: faire(level, trimester) })));

/** La brique qui a fabriqué la question : son nom est dans l'identifiant,
 *  « calcul-nom-rang-détail ». */
function briqueDe(question: Question, level: Level): string {
  const noms = (level === '6e' ? BRIQUES_6E : BRIQUES_CYCLE2).map((brique) => brique.name);
  const trouves = noms.filter((nom) => new RegExp(`^calcul-${nom}-\\d+-`).test(question.id));
  expect(trouves, question.id).toHaveLength(1);
  return trouves[0];
}

// --- Le calcul refait à partir de l'énoncé -------------------------------------------------------

const NOMBRES_EN_LETTRES: Record<string, number> = { un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9 };
const DENOMINATEURS: Record<string, number> = {
  tiers: 3,
  quart: 4,
  quarts: 4,
  cinquième: 5,
  cinquièmes: 5,
  sixième: 6,
  huitième: 8,
  dixième: 10,
  dixièmes: 10,
};
/** Combien de mm, de g ou de cL dans chaque unité. */
const UNITES: Record<string, number> = { km: 1_000_000, m: 1000, dm: 100, cm: 10, mm: 1, t: 1_000_000, kg: 1000, g: 1, L: 100, dL: 10, cL: 1 };

type Attendu = { genre: 'nombre'; valeur: number } | { genre: 'texte'; valeur: string } | { genre: 'fraction'; n: number; d: number };

const nombre = (valeur: number): Attendu => ({ genre: 'nombre', valeur });

function attendu(question: Question): Attendu {
  const { prompt, instruction } = question;
  let m: RegExpExecArray | null;
  if ((m = /^Le double de (\d+)$/.exec(prompt))) return nombre(2 * Number(m[1]));
  if ((m = /^La moitié de (\d+)$/.exec(prompt))) return nombre(Number(m[1]) / 2);
  if ((m = /^Le (tiers|quart|cinquième|sixième|huitième|dixième) de (\d+)$/.exec(prompt))) return nombre(Number(m[2]) / DENOMINATEURS[m[1]]);
  if ((m = /^Les (\S+) (tiers|quarts|cinquièmes|dixièmes) de (\d+)$/.exec(prompt))) {
    return nombre((Number(m[3]) / DENOMINATEURS[m[2]]) * NOMBRES_EN_LETTRES[m[1]]);
  }
  if ((m = /^(\d+) de (plus|moins) que (\d+)$/.exec(prompt))) return nombre(m[2] === 'plus' ? Number(m[3]) + Number(m[1]) : Number(m[3]) - Number(m[1]));
  if ((m = /^(\d+) % de (\d+)$/.exec(prompt))) return nombre((Number(m[1]) * Number(m[2])) / 100);
  if ((m = /^(\S+) \+ … = (\S+)$/.exec(prompt))) return nombre((parseFrenchNumber(m[2]) as number) - (parseFrenchNumber(m[1]) as number));
  if ((m = /^(\d+) × … = (\d+)$/.exec(prompt))) return nombre(Number(m[2]) / Number(m[1]));
  if ((m = /^… × (\d+) = (\d+)$/.exec(prompt))) return nombre(Number(m[2]) / Number(m[1]));
  if ((m = /^(\d+) (\S+) = … (\S+)$/.exec(prompt))) return nombre((Number(m[1]) * UNITES[m[2]]) / UNITES[m[3]]);
  if ((m = /^(\d+) × (\d+) = (\d+) × \d+ \+ … × \d+$/.exec(prompt))) return nombre(Number(m[1]) - Number(m[3]));
  if ((m = /^Quelle multiplication est égale à (.+) \?$/.exec(prompt))) {
    const termes = m[1].split(' + ');
    return { genre: 'texte', valeur: `${termes.length} × ${termes[0]}` };
  }
  if (instruction?.startsWith('Division euclidienne') && (m = /^(\d+) ÷ (\d+)$/.exec(prompt))) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return { genre: 'texte', valeur: `${Math.floor(a / b)}, reste ${a % b}` };
  }
  if ((m = /^(\d+)\/(\d+) ([+-]) (\d+)\/(\d+)$/.exec(prompt))) {
    const [a, b, c, d] = [Number(m[1]), Number(m[2]), Number(m[4]), Number(m[5])];
    return { genre: 'fraction', n: m[3] === '+' ? a * d + c * b : a * d - c * b, d: b * d };
  }
  if ((m = /^(\d+) × (\d+)\/(\d+)$/.exec(prompt))) return { genre: 'fraction', n: Number(m[1]) * Number(m[2]), d: Number(m[3]) };
  // Le reste : une opération, avec ses priorités et ses parenthèses.
  const valeur = evaluateCalculation(prompt);
  if (valeur === null) throw new Error(`Énoncé de calcul non reconnu : « ${prompt} »`);
  return nombre(valeur);
}

const fraction = (choix: string): [number, number] => {
  const [n, d] = choix.split('/').map(Number);
  return [n, d];
};

/** Cette proposition est-elle la bonne réponse ? */
function estLaBonne(question: Question, choix: string): boolean {
  const reponse = attendu(question);
  if (reponse.genre === 'texte') return choix === reponse.valeur;
  if (reponse.genre === 'fraction') {
    const [n, d] = fraction(choix);
    return n * reponse.d === reponse.n * d;
  }
  const valeur = parseFrenchNumber(choix);
  return valeur !== null && Math.abs(valeur - reponse.valeur) < 1e-9;
}

describe('les questions de calcul du CE1, du CE2 et de la 6e', () => {
  it('ont quatre propositions différentes et une bonne réponse', () => {
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

  it('sont reproductibles à graine égale, et ne changent pas selon le nombre de questions demandées', () => {
    NIVEAUX.forEach((level) => {
      expect(generate(level, 2, createRng(9), 20)).toEqual(generate(level, 2, createRng(9), 20));
    });
  });

  it('proposent la bonne réponse, refaite à partir de l\'énoncé, et aucune autre qui la vaille', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) =>
      valeur.forEach((question) => {
        const juste = question.choices.filter((choix) => estLaBonne(question, choix));
        expect(juste, `${level} T${trimester} « ${question.prompt} » : ${question.choices.join(' / ')}`).toEqual([question.choices[question.correctIndex]]);
      })
    );
  });

  it('écrivent tous leurs nombres à la française, sans zéro inutile ni nombre négatif', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ valeur }) =>
      valeur.forEach((question) =>
        question.choices
          .filter((choix) => !choix.includes('/') && !choix.includes('reste') && !choix.includes('×') && !choix.includes('+'))
          .forEach((choix) => {
            expect(choix, question.prompt).toMatch(/^(0|[1-9]\d*)(,\d*[1-9])?$/);
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
        // Seule à avoir une virgule, ou seule à ne pas en avoir : on la verrait.
        expect(juste.includes(',') ? avecVirgule === 1 : avecVirgule === 3, `${question.prompt} : ${question.choices.join(' / ')}`).toBe(false);
      })
    );
  });
});

describe('les nombres du programme', () => {
  const nombresDe = (question: Question) => (question.prompt.match(/\d+(?:,\d+)?/g) ?? []).map((texte) => parseFrenchNumber(texte) as number);

  it('restent au CE1 dans les nombres jusqu\'à 1 000, sans décimal, sans division ni fraction', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE1', trimester).forEach((question) => {
        const juste = parseFrenchNumber(question.choices[question.correctIndex]);
        [...nombresDe(question), ...(juste === null ? [] : [juste])].forEach((n) => expect(n, question.prompt).toBeLessThanOrEqual(1000));
        // Les mauvaises réponses non plus ne dépassent pas 1 000.
        question.choices.forEach((choix) => {
          if (/^\d+$/.test(choix)) expect(Number(choix), `${question.prompt} : ${choix}`).toBeLessThanOrEqual(1000);
        });
        [question.prompt, ...question.choices].forEach((texte) => {
          expect(texte).not.toMatch(/[,÷%/]/);
        });
      })
    );
  });

  it('restent au CE2 dans les nombres jusqu\'à 10 000, et au produit de moins de 100 000', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE2', trimester).forEach((question) => {
        nombresDe(question).forEach((n) => expect(n, question.prompt).toBeLessThanOrEqual(10000));
        const juste = parseFrenchNumber(question.choices[question.correctIndex]);
        if (juste !== null) expect(juste, question.prompt).toBeLessThan(100000);
        // Une mauvaise réponse a la taille des nombres du niveau : 10 000, ou 100 000 pour un produit.
        question.choices.forEach((choix) => {
          if (/^\d+$/.test(choix)) expect(Number(choix), `${question.prompt} : ${choix}`).toBeLessThan(question.prompt.includes('×') ? 100000 : 10001);
        });
        [question.prompt, ...question.choices].forEach((texte) => expect(texte).not.toMatch(/[,%]/));
      })
    );
  });

  it('n\'écrivent la division qu\'au CE2, en ligne, sans reste, dans les tables', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('CE1', trimester).forEach((question) => expect(question.prompt).not.toContain('÷'))
    );
    questions('CE2', 1).forEach((question) => expect(question.prompt).not.toContain('÷'));
    [2, 3].forEach((trimester) =>
      questions('CE2', trimester as Trimester)
        .filter((question) => question.prompt.includes('÷'))
        .forEach((question) => {
          const [a, , b] = question.prompt.split(' ').map(Number);
          expect(a % b, question.prompt).toBe(0);
          expect(b, question.prompt).toBeGreaterThanOrEqual(2);
          expect(b, question.prompt).toBeLessThanOrEqual(10);
          expect(a, question.prompt).toBeLessThanOrEqual(100);
        })
    );
  });

  it('ne parlent de pourcentage, de décimal et de priorités qu\'en 6e', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questions(level, trimester).forEach((question) => {
          expect(question.prompt).not.toMatch(/%|\(|,/);
        })
      )
    );
  });

  it('ne demandent en 6e ni calcul littéral, ni nombre négatif, ni puissance', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questions('6e', trimester).forEach((question) => {
        expect(question.prompt).not.toMatch(/\^|²|³|√|\b[a-z]\s*[+×=]/);
        [...question.choices].forEach((choix) => expect(choix.startsWith('-') || choix.startsWith('−')).toBe(false));
      })
    );
  });

  it('gardent au CE1 les tables de 2 et de 10, puis de 5 et de 3, puis de 4 — et pas d\'autres', () => {
    const autorisees: Record<Trimester, number[]> = { 1: [2, 10], 2: [2, 10, 5, 3], 3: [2, 10, 5, 3, 4] };
    ALL_TRIMESTERS.forEach((trimester) => {
      const produits = questions('CE1', trimester).filter((question) => /^calcul-mult-table/.test(question.id));
      expect(produits.length).toBeGreaterThan(0);
      produits.forEach((question) => {
        const [a, b] = question.prompt.split(' × ').map(Number);
        // Une des deux est la table travaillée ; l'autre, un facteur de 0 à 10.
        expect(autorisees[trimester].some((table) => a === table || b === table), question.prompt).toBe(true);
        expect(Math.max(a, b), question.prompt).toBeLessThanOrEqual(10);
      });
    });
  });

  it('commencent les tables de 6 et de 7 au début du CE2, celles de 8 et de 9 au 2e trimestre', () => {
    const produits = (trimester: Trimester) =>
      questions('CE2', trimester)
        .filter((question) => /^calcul-mult-table/.test(question.id))
        .map((question) => question.prompt.split(' × ').map(Number));
    const auProgramme = [2, 3, 4, 5, 6, 7, 10];
    // Au 1er trimestre, un des deux facteurs est une table déjà connue : 8 × 9 n'y est pas.
    produits(1).forEach(([a, b]) => expect(auProgramme.some((table) => a === table || b === table), `${a} × ${b}`).toBe(true));
    expect(produits(1).some(([a, b]) => a === 6 || b === 6)).toBe(true);
    expect(produits(1).some(([a, b]) => a === 7 || b === 7)).toBe(true);
    expect(produits(2).some(([a, b]) => [8, 9].includes(a) && [8, 9].includes(b))).toBe(true);
  });
});

describe('ce que chaque trimestre apporte', () => {
  const noms = (level: Level, trimester: Trimester) =>
    new Set(questions(level, trimester, 40, 30).map((question) => briqueDe(question, level)));

  it('ne laisse sortir aucune sorte de question avant son étape', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, trimester, valeur }) => {
      const briques = level === '6e' ? BRIQUES_6E : BRIQUES_CYCLE2;
      valeur.forEach((question) => {
        const brique = briques.find((entree) => entree.name === briqueDe(question, level));
        expect(brique, question.id).toBeDefined();
        expect(brique!.minStage, question.id).toBeLessThanOrEqual(stageOf(level, trimester));
      });
    });
  });

  it('au CE1 : la soustraction posée au 2e trimestre, les conversions au 3e', () => {
    expect(noms('CE1', 1).has('add-posee')).toBe(true);
    expect(noms('CE1', 1).has('sub-posee')).toBe(false);
    expect(noms('CE1', 1).has('repeter')).toBe(false);
    expect(noms('CE1', 2).has('sub-posee')).toBe(true);
    expect(noms('CE1', 2).has('repeter')).toBe(true);
    expect(noms('CE1', 2).has('conversion')).toBe(false);
    expect(noms('CE1', 3).has('conversion')).toBe(true);
    expect(noms('CE1', 3).has('trou-multiplication')).toBe(true);
  });

  it('au CE2 : la multiplication et la division au 2e trimestre, deux chiffres au multiplicateur au 3e', () => {
    expect(noms('CE2', 1).has('add-posee-milliers')).toBe(true);
    expect(noms('CE2', 1).has('mult-posee-un-chiffre')).toBe(false);
    expect(noms('CE2', 1).has('div-ligne')).toBe(false);
    expect(noms('CE2', 2).has('mult-posee-un-chiffre')).toBe(true);
    expect(noms('CE2', 2).has('div-ligne')).toBe(true);
    expect(noms('CE2', 2).has('mult-posee-deux-chiffres')).toBe(false);
    expect(noms('CE2', 3).has('mult-posee-deux-chiffres')).toBe(true);
  });

  it('en 6e : les acquis du CM et les décimaux au 1er trimestre, la division euclidienne et les pourcentages au 2e', () => {
    expect(noms('6e', 1).has('add-ent')).toBe(true);
    expect(noms('6e', 1).has('add-dec')).toBe(true);
    ['div-euclid', 'div-ent', 'mult-dec-dec', 'priorites', 'fractions-add', 'pourcentage'].forEach((nom) => {
      expect(noms('6e', 1).has(nom), nom).toBe(false);
      expect(noms('6e', 2).has(nom), nom).toBe(true);
    });
    ['div-dec-ent', 'pourcentage-autres'].forEach((nom) => {
      expect(noms('6e', 2).has(nom), nom).toBe(false);
      expect(noms('6e', 3).has(nom), nom).toBe(true);
    });
  });

  it('au CE2, revoit ce qui s\'apprend au CE1 ; en 6e, ne remonte pas au CM', () => {
    expect(noms('CE2', 1).has('add-posee')).toBe(true);
    expect(noms('CE2', 1).has('complement-dix')).toBe(true);
    // Les techniques du CM1 et du CM2 ont leurs propres seuils : la 6e a les siennes.
    expect(eligibleOperationKinds('6e', 1)).toHaveLength(11);
    expect(eligibleOperationKinds('6e', 3)).toHaveLength(14);
  });
});

describe('les opérations à poser', () => {
  it('ne sont que des techniques qui se posent, avec un résultat exact', () => {
    parCellule((level, trimester) => buildOperations(level, trimester, createRng(4), 80, { posableOnly: true })).forEach(
      ({ level, trimester, valeur }) => {
        expect(valeur, `${level} T${trimester}`).toHaveLength(80);
        valeur.forEach(({ a, b, op, result }) => {
          expect(['+', '-', '×', '÷']).toContain(op);
          const calcul = evaluateCalculation(`${a} ${op} ${b}`.replace(/\./g, ','));
          expect(Math.abs((calcul as number) - result), `${a} ${op} ${b}`).toBeLessThan(1e-9);
        });
      }
    );
  });

  it('ne posent au CE1 que l\'addition au 1er trimestre, puis la soustraction ; au CE2, la multiplication ensuite', () => {
    const operateurs = (level: Level, trimester: Trimester) =>
      new Set(buildOperations(level, trimester, createRng(6), 80, { posableOnly: true }).map(({ op }) => op));
    expect([...operateurs('CE1', 1)]).toEqual(['+']);
    expect([...operateurs('CE1', 2)].sort()).toEqual(['+', '-']);
    expect([...operateurs('CE2', 1)].sort()).toEqual(['+', '-']);
    expect([...operateurs('CE2', 3)].sort()).toEqual(['+', '-', '×']);
    // Jamais de division posée au cycle 2.
    ALL_TRIMESTERS.forEach((trimester) => {
      expect(operateurs('CE1', trimester).has('÷')).toBe(false);
      expect(operateurs('CE2', trimester).has('÷')).toBe(false);
    });
    expect(operateurs('6e', 2).has('÷')).toBe(true);
  });

  it('demandent la technique : une retenue ou un emprunt dans la plupart des additions et des soustractions', () => {
    ([['CE1', 2], ['CE2', 1]] as [Level, Trimester][]).forEach(([level, trimester]) => {
      const operations = buildOperations(level, trimester, createRng(8), 400, { posableOnly: true });
      const additions = operations.filter(({ op }) => op === '+');
      const soustractions = operations.filter(({ op }) => op === '-');
      expect(additions.filter(({ a, b }) => rangsDeRetenue(a, b).length > 0).length / additions.length).toBeGreaterThan(0.75);
      expect(soustractions.filter(({ a, b }) => rangsDEmprunt(a, b).length > 0).length / soustractions.length).toBeGreaterThan(0.75);
    });
  });

  it('suivent le programme : somme au plus 1 000 au CE1, termes de 2 ou 3 chiffres ; moins de 10 000 au CE2', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      buildOperations('CE1', trimester, createRng(2), 120, { posableOnly: true }).forEach(({ a, b, op, result }) => {
        expect(result, `${a} ${op} ${b}`).toBeGreaterThanOrEqual(0);
        expect(Math.max(a, b), `${a} ${op} ${b}`).toBeLessThanOrEqual(999);
        expect(Math.max(a, b), `${a} ${op} ${b}`).toBeGreaterThanOrEqual(10);
        if (op === '+') expect(result).toBeLessThanOrEqual(1000);
      })
    );
    ALL_TRIMESTERS.forEach((trimester) =>
      buildOperations('CE2', trimester, createRng(2), 120, { posableOnly: true }).forEach(({ a, b, op, result }) => {
        expect(Math.max(a, b), `${a} ${op} ${b}`).toBeLessThan(10000);
        expect(result, `${a} ${op} ${b}`).toBeLessThan(100000);
        // Au CE2, on pose des nombres d'au moins trois chiffres.
        expect(Math.max(a, b), `${a} ${op} ${b}`).toBeGreaterThanOrEqual(100);
      })
    );
  });

  it('suivent le programme de la 6e : décimaux de trois décimales au plus, diviseur d\'un chiffre pour un décimal', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      buildOperations('6e', trimester, createRng(2), 200, { posableOnly: true }).forEach(({ a, b, op, result }) => {
        [a, b, result].forEach((n) => {
          const decimales = (String(n).split('.')[1] ?? '').length;
          expect(decimales, `${a} ${op} ${b}`).toBeLessThanOrEqual(3);
        });
        if (op === '÷' && !Number.isInteger(a)) {
          expect(b, `${a} ${op} ${b}`).toBeLessThanOrEqual(9);
          expect(trimester).toBe(3);
        }
        if (op === '÷' && Number.isInteger(a)) {
          expect(a, `${a} ${op} ${b}`).toBeLessThanOrEqual(9999);
          expect(b, `${a} ${op} ${b}`).toBeLessThan(100);
        }
      })
    );
  });
});

describe('le brouillon des nouveaux niveaux', () => {
  /** Les sortes de question qui demandent de poser le calcul. */
  const AVEC_BROUILLON = new Set([
    'add-posee', 'sub-posee', 'add-posee-milliers', 'sub-posee-milliers', 'add-mental', 'sub-mental', 'mult-posee-un-chiffre', 'mult-posee-deux-chiffres', 'mult-multiples',
    'div-ligne', 'add-ent', 'sub-ent', 'mult-ent', 'div-exacte', 'add-dec', 'sub-dec', 'mult-dec-ent', 'mult-dec-dec', 'div-ent',
    'div-dec-ent', 'priorites', 'div-euclid', 'fractions-add', 'fraction-fois-entier',
  ]);
  const petitesSommes = (prompt: string) => {
    const m = /^(\d+) [+-] (\d+)$/.exec(prompt);
    return m !== null && Number(m[1]) <= 20 && Number(m[2]) <= 20;
  };

  it('est offert pour les opérations à poser, pas pour les tables ni pour les calculs de tête', () => {
    parCellule((level, trimester) => questions(level, trimester)).forEach(({ level, valeur }) =>
      valeur.forEach((question) => {
        const nom = briqueDe(question, level);
        const attendu = AVEC_BROUILLON.has(nom) && !petitesSommes(question.prompt);
        expect(needsBrouillon(question), `${nom} : ${question.prompt}`).toBe(attendu);
      })
    );
  });

  it('est offert pour les additions et soustractions posées, la multiplication et la division', () => {
    ['456 + 378', '9 - 4 + 2', '14 ÷ 7', '12 + 3 × 5', '3,25 × 4', '34 × 7'].forEach((prompt) =>
      expect(needsBrouillon({ domain: 'calcul', prompt }), prompt).toBe(true)
    );
    ['8 + 7', '15 - 7', '7 + … = 10', 'Le double de 14', '10 de plus que 47', '25 % de 80', '3,7 × 100', '47 ÷ 10', '35 × 10', '7 × 8'].forEach((prompt) =>
      expect(needsBrouillon({ domain: 'calcul', prompt }), prompt).toBe(false)
    );
  });

  it('ne change rien aux calculs du CM : 340 ÷ 10 et 120 - 10 gardent leur brouillon', () => {
    ['340 ÷ 10', '120 - 10', '250 + 10', '456 - 372', '24 ÷ 6', '12,5 + 3,4'].forEach((prompt) =>
      expect(needsBrouillon({ domain: 'calcul', prompt }), prompt).toBe(true)
    );
  });
});

const stages: Stage[] = [-5, -4, -3, -2, -1, 0, 7, 8, 9];

describe('le volume', () => {
  it('ne manque jamais de questions : même une séance de 200 en donne 200', () => {
    stages.forEach((stage) => {
      const [level, trimester] = (
        stage <= -3 ? ['CE1', stage + 6] : stage <= 0 ? ['CE2', stage + 3] : ['6e', stage - 6]
      ) as [Level, Trimester];
      expect(generate(level, trimester, createRng(1), 200)).toHaveLength(200);
    });
  });
});
