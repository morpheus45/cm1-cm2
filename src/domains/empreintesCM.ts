import { SUBJECT_DOMAINS, type Level, type Question, type Trimester } from '../types';
import { buildSession } from '../lib/sessionBuilder';
import { needsBrouillon } from '../lib/brouillon';
import { buildWorksheet } from '../lib/worksheet';
import { createRng } from '../lib/seededRandom';
import * as numeration from './numeration';
import * as calcul from './calcul';
import * as problemes from './problemes';
import * as geometrie from './geometrie';
import { ALL_TABLES, buildTableFacts } from './tables';

/**
 * Le garde-fou des maths du CM1 et du CM2.
 *
 * Écrire les questions du CE1, du CE2 et de la 6e ne doit rien changer à ce
 * que voient les élèves de CM1 et de CM2 : ni un énoncé, ni un choix, ni un
 * dessin, ni l'ordre des questions d'une séance. Ce fichier calcule
 * l'empreinte de tout ce que les générateurs de maths produisent pour ces deux
 * niveaux, avec des graines fixes ; `empreintesCM.json` en garde la liste,
 * relevée sur le code d'avant l'arrivée des nouveaux niveaux, et
 * `empreintesCM.test.ts` vérifie qu'elle est toujours la même.
 *
 * Une empreinte est un résumé de 53 bits d'un texte : deux textes qui
 * diffèrent d'un seul caractère n'ont, à un contre 9 000 000 000 000 000 près,
 * pas la même. Rien d'autre que ce texte n'entre dans le calcul.
 */

/** Les graines : des petites, des grandes, celles du CM1 et celles de l'année. */
export const GRAINES = [1, 2, 3, 7, 42, 1234, 2026, 99999];

export const NIVEAUX_CM: Level[] = ['CM1', 'CM2'];
export const TRIMESTRES: Trimester[] = [1, 2, 3];

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

/** Le résumé de 53 bits d'un texte (cyrb53), écrit en hexadécimal. */
export function empreinte(texte: string, graine = 0): string {
  let h1 = 0xdeadbeef ^ graine;
  let h2 = 0x41c6ce57 ^ graine;
  for (let i = 0; i < texte.length; i++) {
    const code = texte.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

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
 * - « opérations posées » et « tables » : les deux autres séances de maths ;
 * - « brouillon » : les questions qui offrent un brouillon à l'élève.
 */
export function empreintesCM(): Record<string, string[]> {
  const empreintes: Record<string, string[]> = {};

  for (const [notion, generer] of Object.entries(GENERATEURS)) {
    for (const level of NIVEAUX_CM) {
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

  for (const level of NIVEAUX_CM) {
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

  for (const graine of GRAINES) {
    empreintes[`tables graine ${graine}`] = [
      empreinte(JSON.stringify(buildTableFacts(ALL_TABLES, createRng(graine)))),
      empreinte(JSON.stringify(buildTableFacts([7, 8], createRng(graine)))),
      empreinte(JSON.stringify(buildTableFacts([3], createRng(graine), 45))),
    ];
  }

  return empreintes;
}
