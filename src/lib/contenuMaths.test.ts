import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { activitiesFor, CONTENT_FROM, notionsFor } from './contenu';
import { buildSession } from './sessionBuilder';
import { buildWorksheet, isAnswerCorrect, OPERATIONS_PER_WORKSHEET } from './worksheet';
import { candidateOperations, candidateQuestions } from './evaluation';
import { questionSignature } from './questionHistory';
import { ALL_DOMAINS, ALL_TRIMESTERS, SUBJECT_ACTIVITIES, SUBJECT_DOMAINS } from '../types';
import type { Level, Question } from '../types';

/**
 * Les maths du CE1, du CE2 et de la 6e sont écrites, mais leurs niveaux ne
 * sont pas ouverts dans src/lib/contenu.ts : l'ouvrir est une autre décision
 * (src/lib/contenu.test.ts vérifie qu'ils restent fermés). Ce test les ouvre
 * le temps de chaque essai, pour s'assurer que, le jour venu, tout ce qui
 * consomme ces questions fonctionne : les séances, la feuille d'opérations à
 * poser, les évaluations de la maîtresse et la mémoire des questions déjà vues.
 */
const NOUVEAUX_NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const MATHS = SUBJECT_DOMAINS.maths;

const original = structuredClone(CONTENT_FROM);

beforeEach(() => {
  MATHS.forEach((domain) => NOUVEAUX_NIVEAUX.forEach((level) => (CONTENT_FROM[domain][level] = 1)));
});
// La table est partagée : chaque essai la remet comme il l'a trouvée.
afterEach(() => {
  ALL_DOMAINS.forEach((domain) => (CONTENT_FROM[domain] = structuredClone(original[domain])));
});

/** Une question bien formée : des choix distincts dont un seul est la bonne
 *  réponse, ou une construction à faire au doigt, et toujours une explication. */
function verifierLaQuestion(question: Question, contexte: string) {
  expect(question.prompt.trim().length, contexte).toBeGreaterThan(0);
  expect((question.explanation ?? '').trim().length, `${contexte} : pas d'explication`).toBeGreaterThan(0);
  if (question.construction) {
    expect(question.choices, contexte).toEqual([]);
    expect(question.correctIndex, contexte).toBe(-1);
    return;
  }
  expect(question.choices.length, contexte).toBeGreaterThanOrEqual(3);
  expect(new Set(question.choices).size, `${contexte} : deux choix identiques`).toBe(question.choices.length);
  expect(question.choices[question.correctIndex], contexte).toBeDefined();
}

describe('les maths du CE1, du CE2 et de la 6e, une fois ouvertes', () => {
  it('proposent les quatre notions et toutes les séances de la matière', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        expect(notionsFor('maths', level, trimester), `${level} T${trimester}`).toEqual(MATHS);
        expect(activitiesFor('maths', level, trimester), `${level} T${trimester}`).toEqual(SUBJECT_ACTIVITIES.maths);
      })
    );
  });

  it('donnent des séances complètes : douze questions, trois par notion, dans l\'ordre de la matière', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        [1, 2, 3, 4, 5].forEach((seed) => {
          const contexte = `${level} T${trimester} graine ${seed}`;
          const session = buildSession({ domains: [...MATHS], level, trimester, seed });
          expect(session.domains, contexte).toEqual(MATHS);
          expect(session.questions.map((question) => question.domain), contexte).toEqual(MATHS.flatMap((domain) => [domain, domain, domain]));
          session.questions.forEach((question) => verifierLaQuestion(question, `${contexte} : ${question.id}`));
          const signatures = session.questions.map(questionSignature);
          expect(new Set(signatures).size, `${contexte} : une question revient dans la séance`).toBe(signatures.length);
        })
      )
    );
  });

  it('ne se répètent pas, même quand la séance entière porte sur une seule notion, au début de chaque niveau', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      MATHS.forEach((domain) => {
        const session = buildSession({ domains: [domain], level, trimester: 1, seed: 8 });
        expect(session.questions, `${domain} ${level}`).toHaveLength(12);
        session.questions.forEach((question) => verifierLaQuestion(question, `${domain} ${level} : ${question.id}`));
        expect(new Set(session.questions.map(questionSignature)).size, `${domain} ${level} se répète`).toBe(12);
      })
    );
  });

  it('évitent les questions déjà vues quand l\'historique de l\'élève les connaît', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      MATHS.forEach((domain) => {
        const premiere = buildSession({ domains: [domain], level, trimester: 2, seed: 21 });
        const dejaVues = premiere.questions.map(questionSignature);
        const seconde = buildSession({ domains: [domain], level, trimester: 2, seed: 22, avoidSignatures: dejaVues });
        expect(seconde.questions, `${domain} ${level}`).toHaveLength(12);
        seconde.questions.forEach((question) => expect(dejaVues, `${domain} ${level} : ${question.prompt}`).not.toContain(questionSignature(question)));
      })
    );
  });

  it('se tirent à l\'identique pour une même graine', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        const demande = { domains: [...MATHS], level, trimester, seed: 99 };
        expect(buildSession(demande), `${level} T${trimester}`).toEqual(buildSession(demande));
      })
    );
  });

  it('donnent une feuille d\'opérations à poser, aux résultats exacts', () => {
    NOUVEAUX_NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        const contexte = `${level} T${trimester}`;
        expect(buildWorksheet({ name: 'Léa', level, trimester, seed: 4 }).operations, contexte).toHaveLength(OPERATIONS_PER_WORKSHEET);
        const operations = buildWorksheet({ name: 'Léa', level, trimester, seed: 4, count: 30 }).operations;
        expect(operations, contexte).toHaveLength(30);
        expect(new Set(operations.map((operation) => operation.id)).size, `${contexte} : identifiants`).toBe(30);
        operations.forEach((operation) => {
          const [a, signe, b] = operation.statement.split(' ');
          const nombre = (texte: string) => Number(texte.replace(',', '.'));
          const attendu = { '+': nombre(a) + nombre(b), '-': nombre(a) - nombre(b), '×': nombre(a) * nombre(b), '÷': nombre(a) / nombre(b) }[signe as '+'];
          expect(attendu, `${contexte} : « ${operation.statement} »`).toBeDefined();
          expect(isAnswerCorrect(String(Math.round(attendu * 1000) / 1000), operation.expected), `${contexte} : « ${operation.statement} = ${operation.expected} »`).toBe(true);
        });
      })
    );
  });

  it('s\'offrent à la maîtresse pour ses évaluations : des questions de chaque notion et des opérations', () => {
    NOUVEAUX_NIVEAUX.forEach((level) => {
      MATHS.forEach((domain) => {
        const questions = candidateQuestions(domain, level, 2, 5, 4);
        expect(questions, `${domain} ${level}`).toHaveLength(4);
        questions.forEach((question) => {
          expect(question.domain).toBe(domain);
          verifierLaQuestion(question, `${domain} ${level} : ${question.id}`);
        });
      });
      expect(candidateOperations(level, 2, 5, 4), level).toHaveLength(4);
    });
  });
});
