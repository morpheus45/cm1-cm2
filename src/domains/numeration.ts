import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngPickN, rngShuffle } from '../lib/seededRandom';
import { availableAt, stageOf, type Stage, type Staged } from '../lib/progression';

const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const TEENS = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function twoDigits(n: number): string {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const tenIndex = Math.floor(n / 10);
  const unit = n % 10;
  if (tenIndex === 7 || tenIndex === 9) {
    if (tenIndex === 7 && unit === 1) {
      return `${TENS[tenIndex]} et ${TEENS[unit]}`;
    }
    return `${TENS[tenIndex]}-${TEENS[unit]}`;
  }
  if (unit === 0) {
    return tenIndex === 8 ? 'quatre-vingts' : TENS[tenIndex];
  }
  if (unit === 1 && tenIndex !== 8) {
    // « vingt et un », « trente et un »… sans traits d'union, comme
    // « soixante et onze » : c'est l'orthographe enseignée à l'école.
    return `${TENS[tenIndex]} et un`;
  }
  return `${TENS[tenIndex]}-${UNITS[unit]}`;
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let result = '';
  if (hundreds > 0) {
    result += hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent`;
    if (rest === 0 && hundreds > 1) result += 's';
    if (rest > 0) result += ' ';
  }
  if (rest > 0) {
    result += twoDigits(rest);
  }
  return result || 'zéro';
}

function dropPluralBeforeMille(words: string): string {
  if (words.endsWith('vingts')) return words.slice(0, -1);
  if (words.endsWith('cents')) return words.slice(0, -1);
  return words;
}

export function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;

  const parts: string[] = [];
  if (billions > 0) {
    parts.push(`${threeDigits(billions)} milliard${billions > 1 ? 's' : ''}`);
  }
  if (millions > 0) {
    parts.push(`${threeDigits(millions)} million${millions > 1 ? 's' : ''}`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : `${dropPluralBeforeMille(threeDigits(thousands))} mille`);
  }
  if (rest > 0 || parts.length === 0) {
    parts.push(threeDigits(rest));
  }
  return parts.join(' ').trim();
}

function distractorsForNumber(rng: Rng, correct: number): number[] {
  const digits = String(correct).length;
  const candidates = new Set<number>();
  let attempts = 0;
  while (candidates.size < 3 && attempts < 200) {
    attempts += 1;
    const strategy = rngInt(rng, 0, 2);
    let candidate = correct;
    if (strategy === 0) {
      const pos = rngInt(rng, 0, digits - 1);
      const digitArray = String(correct).split('');
      let newDigit = String(rngInt(rng, 0, 9));
      if (digitArray[pos] === newDigit) newDigit = String((Number(newDigit) + 1) % 10);
      digitArray[pos] = newDigit;
      candidate = Number(digitArray.join(''));
    } else if (strategy === 1) {
      const magnitude = Math.pow(10, rngInt(rng, 1, Math.max(1, digits - 1)));
      candidate = correct + (rngInt(rng, 0, 1) === 0 ? magnitude : -magnitude);
    } else if (digits >= 2) {
      const digitArray = String(correct).split('');
      const pos = rngInt(rng, 0, digitArray.length - 2);
      [digitArray[pos], digitArray[pos + 1]] = [digitArray[pos + 1], digitArray[pos]];
      candidate = Number(digitArray.join(''));
    }
    if (candidate > 0 && candidate !== correct) {
      candidates.add(candidate);
    }
  }
  // Fallback in the rare case the strategies above could not produce 3 distinct values.
  let fallback = correct + 1;
  while (candidates.size < 3) {
    if (fallback !== correct && fallback > 0) candidates.add(fallback);
    fallback += 1;
  }
  return Array.from(candidates);
}

/**
 * Taille des nombres dictés, étape par étape : 9 999 au CM1-T1, 99 999 au T2,
 * 999 999 au T3 ; le million au CM2-T1, le milliard à partir du CM2-T2.
 * Le nombre de chiffres est tiré dans un intervalle, donc une séance de fin
 * d'année revoit aussi les nombres du début d'année.
 */
const DIGIT_RANGE: Record<Stage, { min: number; max: number }> = {
  1: { min: 2, max: 4 },
  2: { min: 3, max: 5 },
  3: { min: 3, max: 6 },
  4: { min: 4, max: 7 },
  5: { min: 4, max: 10 },
  6: { min: 4, max: 10 },
};

/** Fractions (CM1-T3), écriture décimale (CM2-T2), pourcentages (CM2-T3). */
interface BankItem extends Staged {
  prompt: string;
  correct: string;
  distractors: [string, string, string];
}

const BANK_ITEMS: BankItem[] = [
  { minStage: 3, prompt: 'Quelle fraction correspond à « un demi » ?', correct: '1/2', distractors: ['2/1', '1/3', '1/4'] },
  { minStage: 3, prompt: 'Quelle fraction correspond à « un tiers » ?', correct: '1/3', distractors: ['3/1', '1/2', '1/4'] },
  { minStage: 3, prompt: 'Quelle fraction correspond à « un quart » ?', correct: '1/4', distractors: ['4/1', '1/2', '1/3'] },
  { minStage: 3, prompt: 'Quelle fraction correspond à « trois quarts » ?', correct: '3/4', distractors: ['4/3', '3/3', '1/4'] },
  { minStage: 3, prompt: 'Quelle fraction correspond à « deux tiers » ?', correct: '2/3', distractors: ['3/2', '1/3', '2/2'] },
  { minStage: 5, prompt: "Quelle est l'écriture chiffrée de « douze virgule cinq » ?", correct: '12,5', distractors: ['120,5', '1,25', '12,05'] },
  { minStage: 5, prompt: "Quelle est l'écriture chiffrée de « trois virgule sept » ?", correct: '3,7', distractors: ['37', '3,07', '30,7'] },
  { minStage: 5, prompt: "Quelle est l'écriture chiffrée de « sept virgule zéro cinq » ?", correct: '7,05', distractors: ['7,5', '70,5', '0,705'] },
  { minStage: 5, prompt: "Quelle est l'écriture décimale de la fraction 3/10 ?", correct: '0,3', distractors: ['3,0', '0,03', '30'] },
  { minStage: 6, prompt: 'Quel pourcentage correspond à la moitié ?', correct: '50 %', distractors: ['25 %', '75 %', '100 %'] },
  { minStage: 6, prompt: 'Quel pourcentage correspond au quart ?', correct: '25 %', distractors: ['50 %', '75 %', '10 %'] },
  { minStage: 6, prompt: 'Quel pourcentage correspond aux trois quarts ?', correct: '75 %', distractors: ['25 %', '50 %', '100 %'] },
  { minStage: 6, prompt: 'Quel pourcentage correspond au dixième ?', correct: '10 %', distractors: ['1 %', '20 %', '100 %'] },
];

function randomDicteeNumber(rng: Rng, stage: Stage): number {
  const { min: minDigits, max: maxDigits } = DIGIT_RANGE[stage];
  const digits = rngInt(rng, minDigits, maxDigits);
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return rngInt(rng, min, max);
}

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const stage = stageOf(level, trimester);
  const bankPool = availableAt(BANK_ITEMS, stage);
  const bankBudget = count >= 4 ? Math.min(2, count, bankPool.length) : 0;
  const dicteeCount = count - bankBudget;

  const dicteeQuestions: Question[] = [];
  const usedNumbers = new Set<number>();
  while (dicteeQuestions.length < dicteeCount) {
    const correct = randomDicteeNumber(rng, stage);
    if (usedNumbers.has(correct)) continue;
    usedNumbers.add(correct);
    const distractors = distractorsForNumber(rng, correct);
    const choices = rngShuffle(rng, [String(correct), ...distractors.map(String)]);
    dicteeQuestions.push({
      id: `numeration-dictee-${dicteeQuestions.length}-${correct}`,
      domain: 'numeration',
      instruction: 'Écris ce nombre en chiffres',
      prompt: `« ${numberToFrenchWords(correct)} »`,
      choices,
      correctIndex: choices.indexOf(String(correct)),
    });
  }

  if (bankBudget <= 0) {
    return dicteeQuestions;
  }

  const bankQuestions = rngPickN(rng, bankPool, bankBudget).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `numeration-bank-${index}-${item.correct}`,
      domain: 'numeration' as const,
      instruction: 'Choisis la bonne écriture',
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  return rngShuffle(rng, [...dicteeQuestions, ...bankQuestions]);
}
