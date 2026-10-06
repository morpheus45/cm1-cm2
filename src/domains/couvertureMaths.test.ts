import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';
import * as numeration from './numeration';
import * as calcul from './calcul';
import * as problemes from './problemes';
import * as geometrie from './geometrie';

/**
 * Les maths du CE1, du CE2 et de la 6e sont fabriquées à partir de règles,
 * comme celles du CM : chaque notion doit offrir assez de questions différentes
 * par niveau et par trimestre pour qu'un élève ne revoie pas les mêmes pendant
 * des semaines. La mesure est celle du français (couvertureFrancais.test.ts) :
 * 800 tirages d'une séance de 12 questions, en comptant les énoncés distincts
 * (instruction + énoncé).
 *
 * Les planchers :
 *  - numération et calcul : 300 énoncés différents, des nombres qu'on peut
 *    faire varier à volonté ;
 *  - problèmes et géométrie : 150. Un problème ou une figure demande plus de
 *    travail à écrire, et chaque énoncé doit être vérifié ; on n'a pas eu à
 *    descendre sous ce plancher, et aucune cellule n'a été dispensée.
 *
 * Les valeurs mesurées sont de plusieurs milliers dans presque toutes les
 * cellules : le plancher protège d'un effondrement, pas d'une marge étroite.
 */
const NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const TIRAGES = 800;
const QUESTIONS_PAR_TIRAGE = 12;

type Generateur = (level: Level, trimester: Trimester, rng: ReturnType<typeof createRng>, count: number) => { instruction?: string; prompt: string }[];

function enoncesDistincts(generer: Generateur, level: Level, trimester: Trimester): number {
  const vus = new Set<string>();
  for (let graine = 1; graine <= TIRAGES; graine++) {
    generer(level, trimester, createRng(graine * 7919 + 3), QUESTIONS_PAR_TIRAGE).forEach((question) => {
      vus.add(`${question.instruction ?? ''}|${question.prompt}`);
    });
  }
  return vus.size;
}

describe('au moins 300 questions différentes en numération et en calcul, par niveau et par trimestre', () => {
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

describe('au moins 150 questions différentes en problèmes et en géométrie, par niveau et par trimestre', () => {
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
