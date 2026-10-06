import { formatFrenchNumber } from '../lib/classProblems';
import type { BuiltOperation, OperationKind } from './calcul';
import { rngInt, rngPick } from '../lib/seededRandom';
import type { Stage } from '../lib/progression';
import { erreursTable } from './calculErreurs';
import { fauxNombres, type Brique } from './mathsCommun';

/**
 * Ce que partagent le calcul du CE1, du CE2 et de la 6e : une technique est
 * une opération « a op b » que l'élève peut poser ou faire de tête, avec ses
 * erreurs connues et l'explication de sa réponse. Elle sert deux fois : à la
 * feuille d'opérations posées (src/lib/worksheet.ts) et aux questions à choix.
 */
export interface Technique extends OperationKind {
  name: string;
  /** Les erreurs d'élève plausibles pour cette opération. */
  erreurs: (operation: BuiltOperation) => number[];
  explication: (operation: BuiltOperation) => string;
  /** « Calcule dans ta tête » pour ce qui se fait de tête. */
  instruction?: string;
}

export const MENTAL = 'Calcule dans ta tête';

/** Un nombre écrit à la française : entier tel quel, décimal à la virgule. */
export const texte = (n: number): string => (Number.isInteger(n) ? String(n) : formatFrenchNumber(n));

export const operation = (a: number, b: number, op: BuiltOperation['op'], result: number, isDecimal = false): BuiltOperation => ({
  a,
  b,
  op,
  result,
  isDecimal,
});

/** Le nombre de chiffres après la virgule (trois au plus, comme au programme
 *  de la 6e). */
export function decimalesDe(n: number): number {
  for (let decimales = 0; decimales < 3; decimales++) {
    if (Math.abs(n * Math.pow(10, decimales) - Math.round(n * Math.pow(10, decimales))) < 1e-9) return decimales;
  }
  return 3;
}

/**
 * Une technique, prise comme question à choix : « Calcule » et l'opération.
 * `plafond` est le plus grand nombre que le niveau connaît : une mauvaise
 * réponse ne le dépasse jamais, pour qu'un élève de CE1 ne lise pas de nombre
 * au-delà de 1 000.
 */
export function briqueDeTechnique(technique: Technique, plafond: (stage: Stage, op: BuiltOperation['op']) => number = () => Infinity): Brique {
  return {
    name: technique.name,
    minStage: technique.minStage,
    make: (rng, stage) => {
      const fait = technique.build(rng, stage, false);
      // Un résultat entier au milieu de propositions décimales (« 10 » parmi
      // « 9,9 », « 10,1 ») se verrait comme la bonne réponse : quand le résultat
      // d'un calcul décimal tombe juste, toutes les propositions sont entières.
      const decimales = fait.isDecimal && !Number.isInteger(fait.result) ? 3 : 0;
      return {
        instruction: technique.instruction ?? 'Calcule',
        prompt: `${texte(fait.a)} ${fait.op} ${texte(fait.b)}`,
        correct: texte(fait.result),
        // Un décimal faux au bout de la liste : s'il n'y en a pas d'autre, la
        // bonne réponse serait la seule à avoir une virgule.
        wrong: fauxNombres(fait.result, [...technique.erreurs(fait), ...(decimales > 0 ? [fait.result + 0.1, fait.result - 0.1, fait.result + 0.01, fait.result - 0.01] : [])], {
          decimales,
          max: plafond(stage, fait.op),
        }).map(texte),
        explanation: technique.explication(fait),
      };
    },
  };
}

/** Comment retrouver un produit de la table : on décompose le plus petit
 *  facteur à partir de 5 (ou de 10 pour le 9). */
export function explicationTable(a: number, b: number, result: number): string {
  const [petit, grand] = [Math.min(a, b), Math.max(a, b)];
  if (grand === 10) return `Multiplier par 10, c'est ajouter un zéro : ${result}.`;
  if (petit === 9) return `${petit} × ${grand} = 10 × ${grand} − ${grand} = ${10 * grand} − ${grand} = ${result}.`;
  if (petit >= 6) {
    return `${petit} × ${grand} = 5 × ${grand} + ${petit - 5} × ${grand} = ${5 * grand} + ${(petit - 5) * grand} = ${result}.`;
  }
  return `${a} × ${b} = ${result}.`;
}

/** Une table de multiplication, de tête : « 7 × 8 ». Le facteur de la table
 *  change de côté une fois sur deux, et 0 ou 1 reviennent de temps en temps. */
export function tableDeMultiplication(name: string, minStage: Stage, tables: number[]): Technique {
  return {
    name,
    minStage,
    posable: false,
    instruction: MENTAL,
    build: (rng) => {
      const table = rngPick(rng, tables);
      const facteur = rng() < 0.12 ? rngInt(rng, 0, 1) : rngInt(rng, 2, 10);
      const [a, b] = rng() < 0.5 ? [table, facteur] : [facteur, table];
      return operation(a, b, '×', a * b);
    },
    erreurs: ({ a, b }) => erreursTable(a, b),
    explication: ({ a, b, result }) => explicationTable(a, b, result),
  };
}

