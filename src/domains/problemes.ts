import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngShuffle } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';

interface ProblemResult {
  prompt: string;
  correct: number;
}

interface ProblemTemplate {
  /** Étape à partir de laquelle ce type de problème est abordable. */
  minStage: Stage;
  build: (rng: Rng) => ProblemResult;
}

// --- Problèmes à une étape (CM1, 1er trimestre) ---

function courRecreationTemplate(rng: Rng): ProblemResult {
  const filles = rngInt(rng, 40, 120);
  const garcons = rngInt(rng, 40, 120);
  return {
    prompt: `Dans la cour de récréation, il y a ${filles} filles et ${garcons} garçons. Combien y a-t-il d'élèves en tout ?`,
    correct: filles + garcons,
  };
}

function busTemplate(rng: Rng): ProblemResult {
  const depart = rngInt(rng, 40, 90);
  const descendus = rngInt(rng, 10, 35);
  return {
    prompt: `Le bus part avec ${depart} passagers. Au premier arrêt, ${descendus} personnes descendent. Combien reste-t-il de passagers ?`,
    correct: depart - descendus,
  };
}

function paquetsTemplate(rng: Rng): ProblemResult {
  const parPaquet = rngInt(rng, 4, 10);
  const paquets = rngInt(rng, 3, 9);
  return {
    prompt: `Un paquet contient ${parPaquet} gâteaux. Combien y a-t-il de gâteaux dans ${paquets} paquets ?`,
    correct: parPaquet * paquets,
  };
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

// --- Problèmes à deux étapes (CM1, 2e trimestre) ---

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
  // Une réduction reste une réduction : au plus un tiers du prix payé.
  const discount = rngInt(rng, 2, Math.max(2, Math.floor((price * quantity) / 3)));
  return {
    prompt: `Léa achète ${quantity} carnets à ${price} € chacun. Elle a une réduction de ${discount} €. Combien paie-t-elle en tout ?`,
    correct: price * quantity - discount,
  };
}

function stadeTemplate(rng: Rng): ProblemResult {
  const gradins = rngInt(rng, 4, 9);
  const places = rngInt(rng, 40, 90);
  const vides = rngInt(rng, 10, 60);
  return {
    prompt: `Un stade compte ${gradins} gradins de ${places} places. Le jour du match, ${vides} places restent vides. Combien y a-t-il de spectateurs ?`,
    correct: gradins * places - vides,
  };
}

// --- Problèmes à plusieurs étapes (CM2, 2e trimestre) ---

function courseTemplate(rng: Rng): ProblemResult {
  const bdCount = rngInt(rng, 2, 4);
  const bdPrice = rngInt(rng, 6, 12);
  const romanCount = rngInt(rng, 2, 4);
  const romanPrice = rngInt(rng, 4, 9);
  const total = bdCount * bdPrice + romanCount * romanPrice;
  const billet = Math.ceil((total + rngInt(rng, 5, 40)) / 10) * 10;
  return {
    prompt: `Paul achète ${bdCount} bandes dessinées à ${bdPrice} € l'une et ${romanCount} romans à ${romanPrice} € l'un. Il paie avec un billet de ${billet} €. Combien la vendeuse lui rend-elle ?`,
    correct: billet - total,
  };
}

function boulangerieTemplate(rng: Rng): ProblemResult {
  const plaques = rngInt(rng, 5, 12);
  const parPlaque = rngInt(rng, 12, 24);
  const fabriques = plaques * parPlaque;
  const vendus = rngInt(rng, 30, fabriques - 20);
  const offerts = rngInt(rng, 2, 10);
  return {
    prompt: `Une boulangère prépare ${plaques} plaques de ${parPlaque} croissants. Elle en vend ${vendus} et en offre ${offerts} aux enfants de l'école. Combien lui en reste-t-il ?`,
    correct: fabriques - vendus - offerts,
  };
}

// --- Proportionnalité (CM2, 3e trimestre) ---

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

function recetteTemplate(rng: Rng): ProblemResult {
  const personnes = rngInt(rng, 3, 5);
  const parPersonne = rngInt(rng, 40, 90);
  const facteur = rngInt(rng, 2, 4);
  return {
    prompt: `Pour ${personnes} personnes, une recette demande ${personnes * parPersonne} g de farine. Quelle quantité de farine faut-il pour ${personnes * facteur} personnes ?`,
    correct: personnes * parPersonne * facteur,
  };
}

const PROBLEM_TEMPLATES: ProblemTemplate[] = [
  { minStage: 1, build: courRecreationTemplate },
  { minStage: 1, build: busTemplate },
  { minStage: 1, build: paquetsTemplate },
  { minStage: 1, build: sumOfThreeTemplate },
  { minStage: 2, build: remainderTemplate },
  { minStage: 2, build: multiStepTemplate },
  { minStage: 2, build: stadeTemplate },
  { minStage: 5, build: courseTemplate },
  { minStage: 5, build: boulangerieTemplate },
  { minStage: 6, build: proportionnaliteTemplate },
  { minStage: 6, build: recetteTemplate },
];

export function eligibleTemplateCount(level: Level, trimester: Trimester): number {
  const stage = stageOf(level, trimester);
  return PROBLEM_TEMPLATES.filter((template) => template.minStage <= stage).length;
}

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

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const stage = stageOf(level, trimester);
  const templates = PROBLEM_TEMPLATES.filter((template) => template.minStage <= stage);
  const questions: Question[] = [];

  // On parcourt les types de problèmes dans un ordre tiré au sort plutôt que
  // d'en retirer un au hasard à chaque fois : une séance ne repose donc jamais
  // deux fois le même type tant que les autres n'ont pas été proposés.
  const order = rngShuffle(rng, templates);

  for (let i = 0; i < count; i++) {
    const template = order[i % order.length];
    const { prompt, correct } = template.build(rng);
    const spread = Math.max(10, Math.round(correct * 0.2));
    const distractors = distractorsAround(rng, correct, spread, 5);
    const choices = rngShuffle(rng, [correct, ...distractors]).map(String);
    questions.push({
      id: `problemes-${i}-${correct}`,
      domain: 'problemes',
      instruction: 'Lis bien, puis choisis la bonne réponse',
      prompt,
      choices,
      correctIndex: choices.indexOf(String(correct)),
    });
  }

  return questions;
}
