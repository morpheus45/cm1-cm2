import type { Question, Trimester } from '../types';
import { rngInt, rngPickN, rngShuffle, type Rng } from './seededRandom';

/**
 * Les problèmes que la maîtresse prépare pour sa classe, avec Claude.
 *
 * Claude propose ; l'application refait chaque calcul ; la maîtresse valide.
 * Un problème dont le calcul ne donne pas la réponse annoncée ne peut pas
 * être ajouté : un élève ne doit jamais être compté faux sur une bonne
 * réponse.
 */

/** Un problème en service dans la classe, tel que le reçoit l'élève. */
export interface ClassProblem {
  id: string;
  enonce: string;
  /** Un nombre écrit à la française : « 36 », « 4,5 ». */
  reponse: string;
  unite: string;
  fausses_reponses: string[];
  trimestre: Trimester;
}

/** Ce que Claude propose, avant la vérification et la validation. */
export interface ProblemProposal {
  enonce: string;
  calcul: string;
  reponse: string;
  unite: string;
  fausses_reponses: string[];
  trimestre: number;
}

/** « 1 250,5 », « 1250.5 » → 1250,5. Rien d'autre qu'un nombre positif. */
export function parseFrenchNumber(text: string): number | null {
  const cleaned = text.replace(/[\s  ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** 1250.5 → « 1250,5 » : la forme enregistrée, et affichée aux élèves. */
export function formatFrenchNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded).replace('.', ',');
}

const SAME = 1e-9;

/**
 * Calcule une expression comme « (24 × 3) − 15 » ou « 7,5 : 3 ». Les
 * opérations de l'école seulement : + − × ÷ (et leurs variantes * / : x),
 * des parenthèses, des nombres à virgule. Rend `null` pour tout le reste —
 * une lettre, une division par zéro, une parenthèse orpheline.
 */
export function evaluateCalculation(expression: string): number | null {
  const tokens: string[] = [];
  const source = expression.replace(/[  ]/g, ' ').trim();
  let position = 0;
  while (position < source.length) {
    const char = source[position];
    if (char === ' ') {
      position += 1;
      continue;
    }
    const number = /^\d+(?:[.,]\d+)?/.exec(source.slice(position));
    if (number) {
      tokens.push(number[0].replace(',', '.'));
      position += number[0].length;
      continue;
    }
    const operator = { '+': '+', '-': '-', '−': '-', '–': '-', '×': '*', x: '*', X: '*', '*': '*', '·': '*', '÷': '/', '/': '/', ':': '/', '(': '(', ')': ')' }[char];
    if (!operator) return null;
    tokens.push(operator);
    position += 1;
  }

  let index = 0;
  const peek = () => tokens[index];
  const next = () => tokens[index++];

  const factor = (): number | null => {
    const token = next();
    if (token === undefined) return null;
    if (token === '(') {
      const inner = sum();
      if (inner === null || next() !== ')') return null;
      return inner;
    }
    if (token === '-') {
      const value = factor();
      return value === null ? null : -value;
    }
    const value = Number(token);
    return Number.isFinite(value) && /^\d/.test(token) ? value : null;
  };

  const product = (): number | null => {
    let value = factor();
    while (value !== null && (peek() === '*' || peek() === '/')) {
      const operator = next();
      const right = factor();
      if (right === null) return null;
      if (operator === '/' && Math.abs(right) < SAME) return null;
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };

  const sum = (): number | null => {
    let value = product();
    while (value !== null && (peek() === '+' || peek() === '-')) {
      const operator = next();
      const right = product();
      if (right === null) return null;
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };

  const result = sum();
  if (result === null || index !== tokens.length || !Number.isFinite(result)) return null;
  return Math.round(result * 1e9) / 1e9;
}

export interface ProposalCheck {
  /** Le problème peut être ajouté à la classe. */
  ok: boolean;
  /** Ce que donne le calcul, s'il se lit. */
  computed: number | null;
  /** Ce qui empêche l'ajout. */
  issues: string[];
  /** Ce qui n'empêche pas l'ajout, mais mérite d'être su. */
  notes: string[];
  /** Les fausses réponses retenues : des nombres, distincts, différents de
   *  la bonne réponse. */
  distractors: string[];
}

export function checkProposal(proposal: ProblemProposal): ProposalCheck {
  const issues: string[] = [];
  const notes: string[] = [];
  const statement = proposal.enonce.trim();
  if (statement.length < 10 || statement.length > 600) {
    issues.push("L'énoncé doit faire entre 10 et 600 caractères.");
  }
  const answer = parseFrenchNumber(proposal.reponse);
  if (answer === null) issues.push(`La réponse « ${proposal.reponse} » n'est pas un nombre.`);
  else if (Math.abs(answer * 100 - Math.round(answer * 100)) > SAME) {
    issues.push('La réponse a plus de deux chiffres après la virgule.');
  }
  const computed = evaluateCalculation(proposal.calcul);
  if (computed === null) {
    issues.push(`Le calcul « ${proposal.calcul} » ne se lit pas.`);
  } else if (answer !== null && Math.abs(computed - answer) > SAME) {
    issues.push(`Le calcul donne ${formatFrenchNumber(computed)}, pas ${formatFrenchNumber(answer)}.`);
  }
  if (![1, 2, 3].includes(proposal.trimestre)) issues.push('Le trimestre doit être 1, 2 ou 3.');

  const distractors: string[] = [];
  proposal.fausses_reponses.forEach((raw) => {
    const value = parseFrenchNumber(raw);
    if (value === null || answer === null || Math.abs(value - answer) < SAME) return;
    const formatted = formatFrenchNumber(value);
    if (!distractors.includes(formatted) && distractors.length < 5) distractors.push(formatted);
  });
  if (distractors.length < 3) {
    notes.push("Moins de trois fausses réponses utilisables : l'application complétera.");
  }
  return { ok: issues.length === 0, computed, issues, notes, distractors };
}

/** Ce qui est enregistré dans la base, une fois le problème vérifié. */
export function proposalToRow(proposal: ProblemProposal, classId: string) {
  const check = checkProposal(proposal);
  if (!check.ok) throw new Error(check.issues.join(' '));
  return {
    class_id: classId,
    enonce: proposal.enonce.trim(),
    reponse: formatFrenchNumber(parseFrenchNumber(proposal.reponse) as number),
    unite: proposal.unite.trim().slice(0, 20),
    calcul: proposal.calcul.trim().slice(0, 120),
    fausses_reponses: check.distractors,
    trimestre: proposal.trimestre as Trimester,
  };
}

function isTrimester(value: unknown): value is Trimester {
  return value === 1 || value === 2 || value === 3;
}

/** Relit ce que rend la base — ou le cache de la tablette. Une ligne
 *  illisible est écartée, les autres restent. */
export function parseClassProblems(raw: unknown): ClassProblem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    const row = entry as Record<string, unknown> | null;
    if (
      !row ||
      typeof row.id !== 'string' ||
      typeof row.enonce !== 'string' ||
      typeof row.reponse !== 'string' ||
      parseFrenchNumber(row.reponse) === null ||
      !isTrimester(row.trimestre)
    ) {
      return [];
    }
    const distractors = Array.isArray(row.fausses_reponses)
      ? row.fausses_reponses.filter((value): value is string => typeof value === 'string')
      : [];
    return [
      {
        id: row.id,
        enonce: row.enonce,
        reponse: row.reponse,
        unite: typeof row.unite === 'string' ? row.unite : '',
        fausses_reponses: distractors,
        trimestre: row.trimestre,
      },
    ];
  });
}

/** Des fausses réponses proches de la bonne, quand la maîtresse n'en a pas
 *  donné assez. */
function nearbyDistractors(rng: Rng, answer: number, taken: number[], howMany: number): number[] {
  const decimal = !Number.isInteger(answer);
  const step = decimal ? 0.5 : Math.max(1, Math.round(answer * 0.1));
  const found: number[] = [];
  for (let attempt = 0; found.length < howMany && attempt < 100; attempt++) {
    const offset = rngInt(rng, 1, 4) * step * (rngInt(rng, 0, 1) === 0 ? 1 : -1);
    const candidate = Math.round((answer + offset) * 100) / 100;
    if (candidate > 0 && ![answer, ...taken, ...found].some((value) => Math.abs(value - candidate) < SAME)) {
      found.push(candidate);
    }
  }
  for (let fallback = answer + step; found.length < howMany; fallback += step) {
    if (![...taken, ...found].includes(fallback)) found.push(fallback);
  }
  return found;
}

/** Quatre réponses au choix : la bonne, et trois fausses — celles de la
 *  maîtresse d'abord. */
export function classProblemToQuestion(problem: ClassProblem, rng: Rng): Question {
  const answer = parseFrenchNumber(problem.reponse) as number;
  const teacher = problem.fausses_reponses
    .map(parseFrenchNumber)
    .filter((value): value is number => value !== null && Math.abs(value - answer) >= SAME)
    .filter((value, index, all) => all.findIndex((other) => Math.abs(other - value) < SAME) === index)
    .slice(0, 3);
  const distractors = [...teacher, ...nearbyDistractors(rng, answer, teacher, 3 - teacher.length)];
  const unit = problem.unite.trim();
  const label = (value: number) => `${formatFrenchNumber(value)}${unit ? ` ${unit}` : ''}`;
  const correct = label(answer);
  const choices = rngShuffle(rng, [correct, ...distractors.map(label)]);
  return {
    id: `classe-${problem.id}`,
    domain: 'problemes',
    instruction: 'Lis bien, puis choisis la bonne réponse',
    prompt: problem.enonce,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

/**
 * Les problèmes de la maîtresse qui entrent dans une séance : ceux prévus
 * pour ce trimestre ou un précédent, tirés au sort, jamais deux fois.
 */
export function pickClassProblems(
  problems: ClassProblem[],
  trimester: Trimester,
  rng: Rng,
  howMany: number
): ClassProblem[] {
  const eligible = problems.filter((problem) => problem.trimestre <= trimester);
  return rngPickN(rng, eligible, Math.min(howMany, eligible.length));
}
