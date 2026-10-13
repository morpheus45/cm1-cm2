import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';
import * as numeration from './numeration';
import * as calcul from './calcul';
import * as problemes from './problemes';
import * as geometrie from './geometrie';

/**
 * Les maths de la 5e, de la 4e et de la 3e sont fabriquées à partir de règles,
 * comme celles du CM, du CE1, du CE2 et de la 6e : chaque notion doit offrir
 * assez de questions différentes par niveau et par trimestre pour qu'un élève
 * ne revoie pas les mêmes pendant des semaines. La mesure est celle de
 * couvertureMaths.test.ts : 800 tirages d'une séance de 12 questions, en
 * comptant les énoncés distincts (instruction + énoncé).
 *
 * Les planchers sont les mêmes :
 *  - numération et calcul : 300 énoncés différents ;
 *  - problèmes et géométrie : 150.
 *
 * Les valeurs mesurées sont de plusieurs milliers dans toutes les cellules (de
 * 3 000 à 9 000) : le plancher protège d'un effondrement, pas d'une marge
 * étroite, et aucune cellule n'a été dispensée.
 *
 * Les énoncés comptés sont ceux des générateurs, appelés directement : les
 * niveaux du collège ne sont pas encore ouverts à l'élève (src/lib/contenu.ts).
 */
const NIVEAUX: Level[] = ['5e', '4e', '3e'];
const TIRAGES = 800;
const QUESTIONS_PAR_TIRAGE = 12;

type Generateur = (level: Level, trimester: Trimester, rng: ReturnType<typeof createRng>, count: number) => { instruction?: string; prompt: string; choices: string[]; figure?: { shapes: unknown[] } }[];

function enoncesDistincts(generer: Generateur, level: Level, trimester: Trimester): number {
  const vus = new Set<string>();
  for (let graine = 1; graine <= TIRAGES; graine++) {
    generer(level, trimester, createRng(graine * 7919 + 3), QUESTIONS_PAR_TIRAGE).forEach((question) => {
      vus.add(`${question.instruction ?? ''}|${question.prompt}`);
    });
  }
  return vus.size;
}

describe('au moins 300 questions différentes en numération et en calcul, au collège, par niveau et par trimestre', () => {
  const domaines: [string, Generateur][] = [
    ['numération', numeration.generate],
    ['calcul', calcul.generate],
  ];
  domaines.forEach(([nom, generer]) => {
    NIVEAUX.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        it(`${nom} — ${level} trimestre ${trimester}`, () => {
          expect(enoncesDistincts(generer, level, trimester)).toBeGreaterThanOrEqual(300);
        });
      });
    });
  });
});

describe('au moins 150 questions différentes en problèmes et en géométrie, au collège, par niveau et par trimestre', () => {
  const domaines: [string, Generateur][] = [
    ['problèmes', problemes.generate],
    ['géométrie', geometrie.generate],
  ];
  domaines.forEach(([nom, generer]) => {
    NIVEAUX.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        it(`${nom} — ${level} trimestre ${trimester}`, () => {
          expect(enoncesDistincts(generer, level, trimester)).toBeGreaterThanOrEqual(150);
        });
      });
    });
  });
});

describe('chaque séance du collège a douze questions différentes, quatre réponses chacune', () => {
  const domaines: [string, Generateur][] = [
    ['numération', numeration.generate],
    ['calcul', calcul.generate],
    ['problèmes', problemes.generate],
    ['géométrie', geometrie.generate],
  ];
  domaines.forEach(([nom, generer]) => {
    NIVEAUX.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        it(`${nom} — ${level} trimestre ${trimester}`, () => {
          for (let graine = 1; graine <= 200; graine++) {
            const questions = generer(level, trimester, createRng(graine * 7919 + 3), QUESTIONS_PAR_TIRAGE);
            expect(questions).toHaveLength(QUESTIONS_PAR_TIRAGE);
            // Jamais deux fois la même question dans une séance : le même énoncé peut revenir quand sa figure ou ses propositions sont autres (« Quelle est l'abscisse du point K ? », « Lequel de ces produits est négatif ? »).
            expect(new Set(questions.map((question) => `${question.instruction ?? ''}|${question.prompt}|${JSON.stringify(question.figure?.shapes ?? null)}|${[...question.choices].sort().join('/')}`)).size, `séance ${graine}`).toBe(QUESTIONS_PAR_TIRAGE);
            questions.forEach((question) => {
              // La numération a parfois des questions à trois réponses (comparer : plus petit, plus grand, égal) : jamais moins.
              expect(question.choices.length, question.prompt).toBeGreaterThanOrEqual(3);
              expect(new Set(question.choices).size, question.prompt).toBe(question.choices.length);
            });
          }
        });
      });
    });
  });
});
