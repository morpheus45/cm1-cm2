import { describe, expect, it } from 'vitest';
import { activitiesFor, notionsFor } from './contenu';
import { buildSession } from './sessionBuilder';
import { candidateQuestions } from './evaluation';
import { questionSignature } from './questionHistory';
import { ALL_TRIMESTERS, SUBJECT_ACTIVITIES, SUBJECT_DOMAINS } from '../types';
import type { Level, Question } from '../types';

/**
 * Le français du CE1, du CE2 et de la 6e est ouvert dans src/lib/contenu.ts.
 * Comme pour les maths (contenuMaths.test.ts), ce test s'assure que tout ce qui
 * consomme ces questions fonctionne, tel que l'élève et la maîtresse le
 * vivent : les séances, les évaluations de la maîtresse et la mémoire des
 * questions déjà vues.
 */
const NOUVEAUX_NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const FRANCAIS = SUBJECT_DOMAINS.francais;

/** Une question bien formée : une consigne, des choix distincts dont l'un est la
 *  bonne réponse. Le français n'écrit d'explication à aucun niveau, pas plus au
 *  CM1 et au CM2 qu'au CE1 : on n'en exige donc pas ici. */
function verifierLaQuestion(question: Question, contexte: string) {
  expect(question.prompt.trim().length, contexte).toBeGreaterThan(0);
  expect(question.construction, contexte).toBeUndefined();
  expect(question.choices.length, contexte).toBeGreaterThanOrEqual(3);
  expect(new Set(question.choices).size, `${contexte} : deux choix identiques`).toBe(question.choices.length);
  expect(question.choices[question.correctIndex], contexte).toBeDefined();
}

describe('le français du CE1, du CE2 et de la 6e', () => {
  it('propose les trois notions et les deux séances de la matière', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        expect(notionsFor('francais', level, trimester), `${level} T${trimester}`).toEqual(FRANCAIS);
        expect(activitiesFor('francais', level, trimester), `${level} T${trimester}`).toEqual(SUBJECT_ACTIVITIES.francais);
      })
    );
  });

  it('donne des séances complètes : douze questions, quatre par notion, dans l\'ordre de la matière', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        [1, 2, 3, 4, 5].forEach((seed) => {
          const contexte = `${level} T${trimester} graine ${seed}`;
          const session = buildSession({ domains: [...FRANCAIS], level, trimester, seed });
          expect(session.subject, contexte).toBe('francais');
          expect(session.domains, contexte).toEqual(FRANCAIS);
          expect(session.questions, contexte).toHaveLength(12);
          session.questions.forEach((question) => verifierLaQuestion(question, `${contexte} : ${question.id}`));
          const signatures = session.questions.map(questionSignature);
          expect(new Set(signatures).size, `${contexte} : une question revient dans la séance`).toBe(signatures.length);
        })
      )
    );
  });

  it('ne se répète pas, même quand la séance entière porte sur une seule notion, au début de chaque niveau', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      FRANCAIS.forEach((domain) => {
        const session = buildSession({ domains: [domain], level, trimester: 1, seed: 8 });
        expect(session.questions, `${domain} ${level}`).toHaveLength(12);
        session.questions.forEach((question) => {
          expect(question.domain).toBe(domain);
          verifierLaQuestion(question, `${domain} ${level} : ${question.id}`);
        });
        expect(new Set(session.questions.map(questionSignature)).size, `${domain} ${level} se répète`).toBe(12);
      })
    );
  });

  it('évite les questions déjà vues quand l\'historique de l\'élève les connaît', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      FRANCAIS.forEach((domain) => {
        const premiere = buildSession({ domains: [domain], level, trimester: 2, seed: 21 });
        const dejaVues = premiere.questions.map(questionSignature);
        const seconde = buildSession({ domains: [domain], level, trimester: 2, seed: 22, avoidSignatures: dejaVues });
        expect(seconde.questions, `${domain} ${level}`).toHaveLength(12);
        seconde.questions.forEach((question) => expect(dejaVues, `${domain} ${level} : ${question.prompt}`).not.toContain(questionSignature(question)));
      })
    );
  });

  it('se tire à l\'identique pour une même graine', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        const demande = { domains: [...FRANCAIS], level, trimester, seed: 99 };
        expect(buildSession(demande), `${level} T${trimester}`).toEqual(buildSession(demande));
      })
    );
  });

  it('s\'offre à la maîtresse pour ses évaluations : des questions de chaque notion', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      FRANCAIS.forEach((domain) => {
        const questions = candidateQuestions(domain, level, 2, 5, 4);
        expect(questions, `${domain} ${level}`).toHaveLength(4);
        questions.forEach((question) => {
          expect(question.domain).toBe(domain);
          verifierLaQuestion(question, `${domain} ${level} : ${question.id}`);
        });
      })
    );
  });
});
