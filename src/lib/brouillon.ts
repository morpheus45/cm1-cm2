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
 * Un calcul de tête n'a pas plus besoin de brouillon qu'une table : « 8 + 7 »,
 * « 7 + … = 10 », « Le double de 14 », « 10 de plus que 47 », « 25 % de 80 »,
 * « 3,7 × 100 ». Comme pour les tables, on le reconnaît à son énoncé, et la
 * liste est celle des calculs de tête du CE1, du CE2 et de la 6e : aucun calcul
 * du CM1 ni du CM2 n'y entre (empreintesCM.test.ts le vérifie), et une
 * opération qui se pose (« 456 + 378 », « 14 ÷ 7 », « 12 + 3 × 5 ») garde son
 * brouillon.
 */
export function isCalculDeTete(prompt: string): boolean {
  // Un nombre à trouver : « 7 + … = 10 », « 3 m = … cm ».
  if (/…|\.\.\./.test(prompt)) return true;
  // Les tables d'addition et de soustraction : les deux nombres tiennent en
  // deux chiffres au plus, de 20 au plus.
  const petitesSommes = /^\s*(\d{1,2})\s*[+-]\s*(\d{1,2})\s*$/.exec(prompt);
  if (petitesSommes && Number(petitesSommes[1]) <= 20 && Number(petitesSommes[2]) <= 20) return true;
  // Un décalage de virgule, un ×10 : « 3,7 × 100 », « 35 × 10 », « 47 ÷ 10 »
  // (un entier qui n'est pas un multiple de 10 : le CM n'en pose jamais).
  if (/^\s*\d+(?:,\d+)?\s*×\s*(?:10|100|1000)\s*$/.test(prompt)) return true;
  if (/^\s*\d+,\d+\s*÷\s*(?:10|100|1000)\s*$/.test(prompt)) return true;
  const division = /^\s*(\d+)\s*÷\s*(10|100|1000)\s*$/.exec(prompt);
  if (division && Number(division[1]) % Number(division[2]) !== 0) return true;
  return [
    // « Le double de 14 », « La moitié de 30 », « Les trois quarts de 36 ».
    /^\s*(?:le|la|les)\s+(?:\S+\s+){1,2}de\s+\d+\s*$/i,
    // « 10 de plus que 47 », « 100 de moins que 450 ».
    /^\s*\d+\s+de\s+(?:plus|moins)\s+que\s+\d+\s*$/i,
    // « 25 % de 80 ».
    /^\s*\d+\s*%\s*de\s+\d+\s*$/,
    // « Quelle multiplication est égale à 4 + 4 + 4 ? ».
    /^\s*quelle\s+multiplication\b/i,
  ].some((forme) => forme.test(prompt));
}

/**
 * Les questions devant lesquelles l'élève a besoin d'un brouillon pour poser
 * son opération à la main avant de choisir sa réponse : les calculs et les
 * problèmes. Les tables de multiplication et les calculs de tête n'en ont pas
 * besoin.
 */
export function needsBrouillon(question: Pick<Question, 'domain' | 'prompt' | 'construction'>): boolean {
  if (question.construction) return false;
  if (question.domain === 'problemes') return true;
  if (question.domain === 'calcul') return !isTableFact(question.prompt) && !isCalculDeTete(question.prompt);
  return false;
}
