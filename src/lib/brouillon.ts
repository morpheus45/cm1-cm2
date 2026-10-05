import type { Question } from '../types';

/**
 * Un calcul de table (« 7 × 8 ») se récite : le poser n'aurait aucun sens.
 * On le reconnaît à son énoncé, pour que la règle vaille aussi pour les
 * questions écrites par la maîtresse.
 */
export function isTableFact(prompt: string): boolean {
  const match = /^\s*(\d+)\s*[×x*]\s*(\d+)\s*$/.exec(prompt);
  if (!match) return false;
  const a = Number(match[1]);
  const b = Number(match[2]);
  return a <= 10 && b <= 10;
}

/**
 * Les questions devant lesquelles l'élève a besoin d'un brouillon pour poser
 * son opération à la main avant de choisir sa réponse : les calculs et les
 * problèmes. Les tables de multiplication n'en ont pas besoin.
 */
export function needsBrouillon(question: Pick<Question, 'domain' | 'prompt' | 'construction'>): boolean {
  if (question.construction) return false;
  if (question.domain === 'problemes') return true;
  if (question.domain === 'calcul') return !isTableFact(question.prompt);
  return false;
}
