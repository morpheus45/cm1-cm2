import { ALL_DOMAINS, type Domain, type Question, type Trimester } from '../types';
import { rngPickN, rngShuffle, type Rng } from './seededRandom';

/**
 * Les questions que la maîtresse ajoute elle-même pour sa classe, dans
 * n'importe quelle matière — français, histoire, géographie, et les notions
 * de maths autres que les problèmes.
 *
 * Une question de la maîtresse est un choix multiple simple : un énoncé, la
 * bonne réponse, et une à cinq mauvaises réponses, qu'elle écrit elle-même.
 * Contrairement aux problèmes de maths (classProblems.ts), rien ici ne peut
 * être recalculé par l'application : elle ne vérifie que la forme (un
 * énoncé assez long, des réponses distinctes), jamais si la réponse est
 * juste — c'est à la maîtresse de s'en assurer, comme elle le ferait sur
 * une fiche papier.
 */

/** Les problèmes de maths restent sur leur propre écran, avec l'assistant
 *  de Cédric et une vérification du calcul : ils n'entrent pas ici. */
export const NON_CUSTOM_DOMAINS: readonly Domain[] = ['problemes'];

export function isCustomisableDomain(domain: Domain): boolean {
  return !NON_CUSTOM_DOMAINS.includes(domain);
}

/** Une question en service dans la classe, telle que la reçoit l'élève. */
export interface ClassQuestion {
  id: string;
  domain: Domain;
  enonce: string;
  reponse: string;
  fausses_reponses: string[];
  trimestre: Trimester;
}

/** Ce qu'écrit la maîtresse dans le formulaire, avant vérification. */
export interface ClassQuestionDraft {
  domain: Domain;
  enonce: string;
  reponse: string;
  fausses_reponses: string[];
  trimestre: number;
}

const MAX_ANSWER_LENGTH = 200;
const MAX_DISTRACTORS = 5;

export interface DraftCheck {
  /** La question peut être ajoutée à la classe. */
  ok: boolean;
  issues: string[];
}

/** Vérifie la forme d'une question : jamais son contenu, que l'application
 *  ne peut pas juger dans ces matières. */
export function checkClassQuestionDraft(draft: ClassQuestionDraft): DraftCheck {
  const issues: string[] = [];
  const enonce = draft.enonce.trim();
  if (enonce.length < 10 || enonce.length > 600) {
    issues.push("L'énoncé doit faire entre 10 et 600 caractères.");
  }
  if (!ALL_DOMAINS.includes(draft.domain) || !isCustomisableDomain(draft.domain)) {
    issues.push("Cette notion n'accepte pas de question ajoutée ici.");
  }
  const reponse = draft.reponse.trim();
  if (reponse.length === 0 || reponse.length > MAX_ANSWER_LENGTH) {
    issues.push(`La bonne réponse doit faire entre 1 et ${MAX_ANSWER_LENGTH} caractères.`);
  }
  const fausses = draft.fausses_reponses.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (fausses.length === 0) {
    issues.push('Ajoutez au moins une mauvaise réponse.');
  }
  if (fausses.length > MAX_DISTRACTORS) {
    issues.push(`${MAX_DISTRACTORS} mauvaises réponses au plus.`);
  }
  if (fausses.some((entry) => entry.length > MAX_ANSWER_LENGTH)) {
    issues.push(`Chaque mauvaise réponse doit faire ${MAX_ANSWER_LENGTH} caractères au plus.`);
  }
  const distinct = new Set(fausses.map((entry) => entry.toLowerCase()));
  if (distinct.size !== fausses.length) {
    issues.push('Les mauvaises réponses doivent être différentes les unes des autres.');
  }
  if (reponse && fausses.some((entry) => entry.toLowerCase() === reponse.toLowerCase())) {
    issues.push('Une mauvaise réponse ne peut pas être la même que la bonne.');
  }
  if (![1, 2, 3].includes(draft.trimestre)) {
    issues.push('Le trimestre doit être 1, 2 ou 3.');
  }
  return { ok: issues.length === 0, issues };
}

/** Ce qui est enregistré dans la base, une fois la question vérifiée. */
export function draftToRow(draft: ClassQuestionDraft, classId: string) {
  const check = checkClassQuestionDraft(draft);
  if (!check.ok) throw new Error(check.issues.join(' '));
  return {
    class_id: classId,
    domain: draft.domain,
    enonce: draft.enonce.trim(),
    reponse: draft.reponse.trim(),
    fausses_reponses: draft.fausses_reponses.map((entry) => entry.trim()).filter((entry) => entry.length > 0),
    trimestre: draft.trimestre as Trimester,
  };
}

function isTrimester(value: unknown): value is Trimester {
  return value === 1 || value === 2 || value === 3;
}

/** Relit ce que rend la base. Une ligne illisible est écartée, les autres
 *  restent. */
export function parseClassQuestions(raw: unknown): ClassQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    const row = entry as Record<string, unknown> | null;
    if (
      !row ||
      typeof row.id !== 'string' ||
      !ALL_DOMAINS.includes(row.domain as Domain) ||
      !isCustomisableDomain(row.domain as Domain) ||
      typeof row.enonce !== 'string' ||
      typeof row.reponse !== 'string' ||
      !isTrimester(row.trimestre)
    ) {
      return [];
    }
    const fausses_reponses = Array.isArray(row.fausses_reponses)
      ? row.fausses_reponses.filter((value): value is string => typeof value === 'string')
      : [];
    if (fausses_reponses.length === 0) return [];
    return [
      {
        id: row.id,
        domain: row.domain as Domain,
        enonce: row.enonce,
        reponse: row.reponse,
        fausses_reponses,
        trimestre: row.trimestre,
      },
    ];
  });
}

/** La question telle qu'un élève la voit : la bonne réponse et les
 *  mauvaises, mélangées. */
export function classQuestionToQuestion(question: ClassQuestion, rng: Rng): Question {
  const choices = rngShuffle(rng, [question.reponse, ...question.fausses_reponses]);
  return {
    id: `classe-${question.id}`,
    domain: question.domain,
    prompt: question.enonce,
    choices,
    correctIndex: choices.indexOf(question.reponse),
  };
}

/**
 * Les questions de la maîtresse qui entrent dans une séance, pour une
 * notion donnée : celles prévues pour ce trimestre ou un précédent, tirées
 * au sort, jamais deux fois.
 */
export function pickClassQuestions(
  questions: ClassQuestion[],
  domain: Domain,
  trimester: Trimester,
  rng: Rng,
  howMany: number
): ClassQuestion[] {
  const eligible = questions.filter((question) => question.domain === domain && question.trimestre <= trimester);
  return rngPickN(rng, eligible, Math.min(howMany, eligible.length));
}
