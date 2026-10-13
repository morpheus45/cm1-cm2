import { ALL_SUBJECTS, SUBJECT_DOMAINS, type Level, type Question, type Trimester } from '../types';
import { buildSession } from '../lib/sessionBuilder';
import { activitiesFor, notionsFor } from '../lib/contenu';
import { needsBrouillon } from '../lib/brouillon';
import { buildWorksheet } from '../lib/worksheet';
import { createRng } from '../lib/seededRandom';
import * as numeration from './numeration';
import * as calcul from './calcul';
import * as problemes from './problemes';
import * as geometrie from './geometrie';
import { empreinte, GRAINES, NIVEAUX_CM, TRIMESTRES } from './empreintesCM';
import { ALL_TABLES, buildTableFacts, tablesAuProgramme } from './tables';

/**
 * Le garde-fou des maths du CE1, du CE2 et de la 6e — et de ce que l'élève
 * peut choisir du CE1 au CM2.
 *
 * Écrire les questions de la 5e, de la 4e et de la 3e ne doit rien changer à
 * ce que voient les élèves de ces trois niveaux, ni à ceux de CM1 et de CM2
 * (empreintesCM.ts) : ni un énoncé, ni un choix, ni un dessin, ni l'ordre des
 * questions d'une séance, ni les séances proposées. Ce fichier fait pour le
 * CE1, le CE2 et la 6e ce que `empreintesCM.ts` fait pour les deux niveaux du
 * CM : l'empreinte de tout ce que les générateurs de maths produisent, avec
 * des graines fixes. `empreintesNiveaux.json` en garde la liste, relevée sur le
 * code d'avant l'arrivée du cycle 4, et `empreintesNiveaux.test.ts` vérifie
 * qu'elle est toujours la même.
 *
 * S'y ajoute ce que le cycle 4 pouvait déranger sans le vouloir : les séances
 * (`activitiesFor`) et les notions (`notionsFor`) offertes du CE1 au CM2, dans
 * les quatre matières.
 */

/** Les niveaux de maths dont les questions sont fabriquées par des briques. */
export const NIVEAUX_ANCIENS: Level[] = ['CE1', 'CE2', '6e'];

/** Les niveaux ouverts à l'élève avant le cycle 4, pour les séances offertes. */
const NIVEAUX_OUVERTS: Level[] = ['CE1', 'CE2', ...NIVEAUX_CM, '6e'];

/** Le nombre de questions qu'une séance tire de chaque notion, en
 *  coulisses (src/lib/sessionBuilder.ts). */
const RESERVE = 200;

type Generateur = (level: Level, trimester: Trimester, rng: ReturnType<typeof createRng>, count: number) => Question[];

const GENERATEURS: Record<string, Generateur> = {
  numeration: numeration.generate,
  calcul: calcul.generate,
  problemes: problemes.generate,
  geometrie: geometrie.generate,
};

/** L'empreinte de chacune des questions, dans l'ordre, et du tout. */
function empreintesDe(questions: Question[]): string[] {
  return [...questions.map((question) => empreinte(JSON.stringify(question))), empreinte(JSON.stringify(questions))];
}

/**
 * Toutes les empreintes, sous un nom qui dit d'où elles viennent :
 *
 * - « notion niveau T graine » : les douze premières questions d'une séance
 *   de la notion, puis l'empreinte des deux cents que le constructeur de
 *   séances tire en réserve ;
 * - « séance » : la séance complète de maths, avec ses quatre notions ;
 * - « brouillon », « opérations posées » et « tables » : le brouillon, la
 *   feuille d'opérations posées et la série de tables du niveau ;
 * - « offre » : les séances et les notions que l'élève peut choisir.
 */
export function empreintesNiveaux(): Record<string, string[]> {
  const empreintes: Record<string, string[]> = {};

  for (const [notion, generer] of Object.entries(GENERATEURS)) {
    for (const level of NIVEAUX_ANCIENS) {
      for (const trimester of TRIMESTRES) {
        for (const graine of GRAINES) {
          const douze = generer(level, trimester, createRng(graine), 12);
          const reserve = generer(level, trimester, createRng(graine), RESERVE);
          empreintes[`${notion} ${level} T${trimester} graine ${graine}`] = [
            ...douze.map((question) => empreinte(JSON.stringify(question))),
            empreinte(JSON.stringify(reserve)),
          ];
        }
      }
    }
  }

  for (const level of NIVEAUX_ANCIENS) {
    for (const trimester of TRIMESTRES) {
      for (const graine of GRAINES) {
        const seance = buildSession({ domains: [...SUBJECT_DOMAINS.maths], level, trimester, seed: graine });
        empreintes[`séance ${level} T${trimester} graine ${graine}`] = empreintesDe(seance.questions);
        empreintes[`brouillon ${level} T${trimester} graine ${graine}`] = [
          seance.questions.map((question) => (needsBrouillon(question) ? '1' : '0')).join(''),
        ];

        const feuille = buildWorksheet({ name: 'Léa', level, trimester, seed: graine, createdAt: '2026-09-25T10:00:00.000Z' });
        empreintes[`opérations posées ${level} T${trimester} graine ${graine}`] = [empreinte(JSON.stringify(feuille))];
      }
    }
  }

  for (const level of NIVEAUX_ANCIENS) {
    for (const trimester of TRIMESTRES) {
      const tables = tablesAuProgramme(level, trimester);
      empreintes[`tables ${level} T${trimester}`] = [
        empreinte(JSON.stringify(tables)),
        ...GRAINES.map((graine) => empreinte(JSON.stringify(buildTableFacts(ALL_TABLES, createRng(graine), 20, tables)))),
      ];
    }
  }

  for (const level of NIVEAUX_OUVERTS) {
    for (const trimester of TRIMESTRES) {
      empreintes[`offre ${level} T${trimester}`] = ALL_SUBJECTS.map((subject) =>
        empreinte(JSON.stringify([activitiesFor(subject, level, trimester), notionsFor(subject, level, trimester)]))
      );
    }
  }

  return empreintes;
}
