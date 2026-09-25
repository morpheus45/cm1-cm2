import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';
import { availableAt, stageOf, type Staged } from '../lib/progression';

/**
 * Accord dans le groupe nominal, travaillé toute l'année. La difficulté monte
 * avec les trimestres : accord en nombre évident (T1), accord en genre (T2),
 * pluriels irréguliers en -eaux / -aux (T3).
 */
interface NominalGroupItem extends Staged {
  determiner: string;
  adjective: string;
  correctNoun: string;
  distractorNouns: [string, string, string];
}

const NOMINAL_GROUP_ITEMS: NominalGroupItem[] = [
  // Accord en nombre.
  { minStage: 1, determiner: 'un', adjective: 'grand', correctNoun: 'jardin', distractorNouns: ['maisons', 'maison', 'jardins'] },
  { minStage: 1, determiner: 'une', adjective: 'petite', correctNoun: 'fille', distractorNouns: ['garçon', 'garçons', 'filles'] },
  { minStage: 1, determiner: 'les', adjective: 'petits', correctNoun: 'chats', distractorNouns: ['chat', 'chatte', 'chattes'] },
  { minStage: 1, determiner: 'une', adjective: 'jolie', correctNoun: 'feuille', distractorNouns: ['cadeau', 'écharpes', 'cartables'] },
  { minStage: 1, determiner: 'les', adjective: 'grandes', correctNoun: 'tables', distractorNouns: ['table', 'bureau', 'bureaux'] },
  { minStage: 1, determiner: 'les', adjective: 'grands', correctNoun: 'arbres', distractorNouns: ['arbre', 'fleur', 'fleurs'] },
  { minStage: 1, determiner: 'un', adjective: 'joli', correctNoun: 'dessin', distractorNouns: ['dessins', 'image', 'images'] },
  { minStage: 1, determiner: 'une', adjective: 'grande', correctNoun: 'maison', distractorNouns: ['maisons', 'jardin', 'jardins'] },
  { minStage: 1, determiner: 'les', adjective: 'petites', correctNoun: 'cuillères', distractorNouns: ['cuillère', 'couteau', 'couteaux'] },
  { minStage: 1, determiner: 'un', adjective: 'petit', correctNoun: 'chien', distractorNouns: ['chiens', 'chatte', 'chattes'] },
  { minStage: 1, determiner: 'les', adjective: 'nouvelles', correctNoun: 'élèves', distractorNouns: ['élève', 'maître', 'maîtres'] },
  // Accord en genre.
  { minStage: 2, determiner: 'un', adjective: 'agréable', correctNoun: 'marchand', distractorNouns: ['vendeuses', 'boulangers', 'commerçante'] },
  { minStage: 2, determiner: 'mes', adjective: 'nouveaux', correctNoun: 'amis', distractorNouns: ['ami', 'amie', 'amies'] },
  { minStage: 2, determiner: 'les', adjective: 'gentils', correctNoun: 'voisins', distractorNouns: ['voisin', 'voisine', 'voisines'] },
  { minStage: 2, determiner: 'ces', adjective: 'heureuses', correctNoun: 'familles', distractorNouns: ['famille', 'cousin', 'cousins'] },
  { minStage: 2, determiner: 'une', adjective: 'longue', correctNoun: 'route', distractorNouns: ['chemin', 'chemins', 'routes'] },
  { minStage: 2, determiner: 'les', adjective: 'mauvaises', correctNoun: 'blagues', distractorNouns: ['goût', 'croissants', 'idée'] },
  // Pluriels irréguliers.
  { minStage: 3, determiner: 'les', adjective: 'beaux', correctNoun: 'tableaux', distractorNouns: ['tableau', 'peinture', 'peintures'] },
  { minStage: 3, determiner: 'un', adjective: 'vieux', correctNoun: 'château', distractorNouns: ['tours', 'tour', 'châteaux'] },
  { minStage: 3, determiner: 'ces', adjective: 'vieux', correctNoun: 'journaux', distractorNouns: ['journal', 'revue', 'revues'] },
  { minStage: 3, determiner: 'mes', adjective: 'nouveaux', correctNoun: 'bateaux', distractorNouns: ['bateau', 'barque', 'barques'] },
  { minStage: 3, determiner: 'les', adjective: 'belles', correctNoun: 'fleurs', distractorNouns: ['fleur', 'bouquet', 'bouquets'] },
  { minStage: 3, determiner: 'ces', adjective: 'beaux', correctNoun: 'chevaux', distractorNouns: ['cheval', 'jument', 'juments'] },
];

/** Participe passé employé avec « être » : programme du CM2, 2e trimestre. */
interface ParticipeItem extends Staged {
  subject: string;
  infinitive: string;
  correct: string;
  distractors: [string, string, string];
}

const PARTICIPE_ITEMS: ParticipeItem[] = [
  { minStage: 5, subject: 'Elle est', infinitive: 'partir', correct: 'partie', distractors: ['parti', 'partis', 'parties'] },
  { minStage: 5, subject: 'Ils sont', infinitive: 'arriver', correct: 'arrivés', distractors: ['arrivé', 'arrivée', 'arrivées'] },
  { minStage: 5, subject: 'Elles sont', infinitive: 'tomber', correct: 'tombées', distractors: ['tombé', 'tombés', 'tombée'] },
  { minStage: 5, subject: 'Il est', infinitive: 'venir', correct: 'venu', distractors: ['venue', 'venus', 'venues'] },
  { minStage: 5, subject: 'Les filles sont', infinitive: 'rentrer', correct: 'rentrées', distractors: ['rentré', 'rentrés', 'rentrée'] },
  { minStage: 5, subject: 'Mon frère est', infinitive: 'monter', correct: 'monté', distractors: ['montée', 'montés', 'montées'] },
];

export function generate(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const stage = stageOf(level, trimester);
  const nominalPool = availableAt(NOMINAL_GROUP_ITEMS, stage);
  const participePool = availableAt(PARTICIPE_ITEMS, stage);

  const participeCount = participePool.length === 0 ? 0 : Math.floor(count / 2);
  const nominalCount = count - participeCount;

  const nominalQuestions = rngPickN(rng, nominalPool, nominalCount).map((item, index) => {
    const choices = rngShuffle(rng, [item.correctNoun, ...item.distractorNouns]);
    return {
      id: `accords-nominal-${index}-${item.correctNoun}`,
      domain: 'accords' as const,
      instruction: 'Quel mot complète correctement le groupe ?',
      prompt: `${item.determiner} ${item.adjective} ...`,
      choices,
      correctIndex: choices.indexOf(item.correctNoun),
    };
  });

  if (participeCount <= 0) {
    return nominalQuestions;
  }

  const participeQuestions = rngPickN(rng, participePool, participeCount).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `accords-participe-${index}-${item.correct}`,
      domain: 'accords' as const,
      instruction: `Accorde le participe passé — verbe « ${item.infinitive} »`,
      prompt: `${item.subject} ...`,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  return rngShuffle(rng, [...nominalQuestions, ...participeQuestions]);
}
