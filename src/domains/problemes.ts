import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngShuffle } from '../lib/seededRandom';

interface ProblemResult {
  prompt: string;
  correct: number;
}

function sumOfThreeTemplate(rng: Rng): ProblemResult {
  const morning = rngInt(rng, 150, 350);
  const noon = rngInt(rng, 150, 350);
  const evening = rngInt(rng, 150, 350);
  return {
    prompt: `Mon chien mange ${morning} g de croquettes le matin, ${noon} g le midi et ${evening} g le soir. Quelle quantité de croquettes mange-t-il par jour ?`,
    correct: morning + noon + evening,
  };
}

function remainderTemplate(rng: Rng): ProblemResult {
  const total = rngInt(rng, 70, 120);
  const categoryA = rngInt(rng, 20, Math.floor(total / 3));
  const categoryB = rngInt(rng, 20, Math.floor(total / 3));
  return {
    prompt: `À la bibliothèque, il y a ${total} livres. Il y a ${categoryA} documentaires et ${categoryB} bandes dessinées. Les autres livres sont des romans. Combien de romans y a-t-il ?`,
    correct: total - categoryA - categoryB,
  };
}

function multiStepTemplate(rng: Rng): ProblemResult {
  const price = rngInt(rng, 3, 15);
  const quantity = rngInt(rng, 2, 6);
  const discount = rngInt(rng, 2, Math.max(2, price * quantity - 1));
  return {
    prompt: `Léa achète ${quantity} carnets à ${price} € chacun. Elle a une réduction de ${discount} €. Combien paie-t-elle en tout ?`,
    correct: price * quantity - discount,
  };
}

function proportionnaliteTemplate(rng: Rng): ProblemResult {
  const unitPrice = rngInt(rng, 2, 6);
  const baseQuantity = rngInt(rng, 2, 5);
  const targetQuantity = baseQuantity * rngInt(rng, 2, 3);
  const basePrice = unitPrice * baseQuantity;
  return {
    prompt: `${baseQuantity} stylos coûtent ${basePrice} €. Combien coûtent ${targetQuantity} stylos, au même prix chacun ?`,
    correct: unitPrice * targetQuantity,
  };
}

const CM1_TEMPLATES = [sumOfThreeTemplate, remainderTemplate];
const CM2_TEMPLATES = [sumOfThreeTemplate, remainderTemplate, multiStepTemplate, proportionnaliteTemplate];

function distractorsAround(rng: Rng, correct: number, spread: number, howMany: number): number[] {
  const candidates = new Set<number>();
  let attempts = 0;
  while (candidates.size < howMany && attempts < 200) {
    attempts += 1;
    const offset = rngInt(rng, 1, spread) * (rngInt(rng, 0, 1) === 0 ? 1 : -1);
    const candidate = correct + offset;
    if (candidate > 0 && candidate !== correct) {
      candidates.add(candidate);
    }
  }
  let fallback = correct + 1;
  while (candidates.size < howMany) {
    if (fallback !== correct) candidates.add(fallback);
    fallback += 1;
  }
  return Array.from(candidates);
}

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const templates = level === 'CM1' ? CM1_TEMPLATES : CM2_TEMPLATES;
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const template = rngShuffle(rng, templates)[0];
    const { prompt, correct } = template(rng);
    const spread = Math.max(10, Math.round(correct * 0.2));
    const distractors = distractorsAround(rng, correct, spread, 5);
    const choices = rngShuffle(rng, [correct, ...distractors]).map(String);
    questions.push({
      id: `problemes-${i}-${correct}`,
      domain: 'problemes',
      prompt,
      choices,
      correctIndex: choices.indexOf(String(correct)),
    });
  }
  return questions;
}
