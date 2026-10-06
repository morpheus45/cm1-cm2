import { SUBJECT_DOMAINS, type Level, type Question, type Trimester } from '../types';
import { buildSession } from '../lib/sessionBuilder';
import { createRng, type Rng } from '../lib/seededRandom';
import * as conjugaison from './conjugaison';
import * as accords from './accords';
import * as orthographe from './orthographe';

/**
 * Le garde-fou du français du CM1 et du CM2.
 *
 * Écrire les questions du CE1, du CE2 et de la 6e ne doit rien changer à ce
 * que voient les élèves de CM1 et de CM2 : ni un énoncé, ni un choix, ni la
 * bonne réponse, ni l'ordre des questions d'une séance. Ce fichier calcule
 * l'empreinte de tout ce que les trois générateurs de français (conjugaison,
 * accords, orthographe) produisent pour ces deux niveaux, avec des graines
 * fixes ; `empreintesFrancaisCM.json` en garde la liste, relevée sur le code
 * d'avant l'arrivée des nouveaux niveaux, et `empreintesFrancaisCM.test.ts`
 * vérifie qu'elle est toujours la même.
 *
 * Une empreinte est un résumé de 53 bits d'un texte : deux textes qui
 * diffèrent d'un seul caractère n'ont, à un contre 9 000 000 000 000 000 près,
 * pas la même. Ce qu'on résume est le texte JSON exact de la question, choix
 * et bonne réponse compris.
 */

/** Les graines : des petites, des grandes, celles du CM1 et celles de l'année. */
export const GRAINES = [1, 2, 3, 7, 42, 1234, 2026, 99999];

export const NIVEAUX_CM: Level[] = ['CM1', 'CM2'];
export const TRIMESTRES: Trimester[] = [1, 2, 3];

/** Le nombre de questions qu'une séance tire de chaque notion, en
 *  coulisses (src/lib/sessionBuilder.ts). */
const RESERVE = 200;

/** La mesure de couvertureFrancais.test.ts : 800 tirages de 12 questions. */
const TIRAGES = 800;
const QUESTIONS_PAR_TIRAGE = 12;

type Generateur = (level: Level, trimester: Trimester, rng: Rng, count: number) => Question[];

export const GENERATEURS: Record<string, Generateur> = {
  conjugaison: conjugaison.generate,
  accords: accords.generate,
  orthographe: orthographe.generate,
};

/** Un résumé de 53 bits (cyrb53) qu'on peut nourrir morceau par morceau :
 *  le résultat est celui du texte tout entier, collé bout à bout. */
class Resume {
  private h1 = 0xdeadbeef;
  private h2 = 0x41c6ce57;

  ajouter(texte: string): void {
    for (let i = 0; i < texte.length; i++) {
      const code = texte.charCodeAt(i);
      this.h1 = Math.imul(this.h1 ^ code, 2654435761);
      this.h2 = Math.imul(this.h2 ^ code, 1597334677);
    }
  }

  fin(): string {
    let h1 = this.h1;
    let h2 = this.h2;
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
  }
}

/** Le résumé de 53 bits d'un texte, écrit en hexadécimal. */
export function empreinte(texte: string): string {
  const resume = new Resume();
  resume.ajouter(texte);
  return resume.fin();
}

/** L'empreinte de chacune des questions, dans l'ordre, puis celle du tout. */
function empreintesDe(questions: Question[]): string[] {
  return [...questions.map((question) => empreinte(JSON.stringify(question))), empreinte(JSON.stringify(questions))];
}

/**
 * Toutes les empreintes, sous un nom qui dit d'où elles viennent :
 *
 * - « notion niveau T graine » : les douze premières questions d'une séance
 *   de la notion, puis l'empreinte des deux cents que le constructeur de
 *   séances tire en réserve ;
 * - « séance » : la séance complète de français, avec ses trois notions ;
 * - « tirages » : l'empreinte des 800 tirages de 12 questions de la mesure de
 *   couverture, c'est-à-dire de tout ce que la notion sait poser ;
 * - « temps » : les temps enseignés à cette étape.
 */
export function empreintesFrancaisCM(): Record<string, string[]> {
  const empreintes: Record<string, string[]> = {};

  for (const [notion, generer] of Object.entries(GENERATEURS)) {
    for (const level of NIVEAUX_CM) {
      for (const trimester of TRIMESTRES) {
        for (const graine of GRAINES) {
          const douze = generer(level, trimester, createRng(graine), QUESTIONS_PAR_TIRAGE);
          const reserve = generer(level, trimester, createRng(graine), RESERVE);
          empreintes[`${notion} ${level} T${trimester} graine ${graine}`] = [
            ...douze.map((question) => empreinte(JSON.stringify(question))),
            empreinte(JSON.stringify(reserve)),
          ];
        }

        const tirages = new Resume();
        for (let graine = 1; graine <= TIRAGES; graine++) {
          const questions = generer(level, trimester, createRng(graine * 7919 + 3), QUESTIONS_PAR_TIRAGE);
          tirages.ajouter(JSON.stringify(questions));
        }
        empreintes[`tirages ${notion} ${level} T${trimester}`] = [tirages.fin()];
      }
    }
  }

  for (const level of NIVEAUX_CM) {
    for (const trimester of TRIMESTRES) {
      for (const graine of GRAINES) {
        const seance = buildSession({ domains: [...SUBJECT_DOMAINS.francais], level, trimester, seed: graine, classProblems: [] });
        empreintes[`séance ${level} T${trimester} graine ${graine}`] = empreintesDe(seance.questions);
      }
      empreintes[`temps ${level} T${trimester}`] = [empreinte(JSON.stringify(conjugaison.eligibleTenses(level, trimester)))];
    }
  }

  return empreintes;
}
