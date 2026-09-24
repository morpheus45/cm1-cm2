import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';

interface NominalGroupItem {
  determiner: string;
  adjective: string;
  correctNoun: string;
  distractorNouns: [string, string, string];
}

const NOMINAL_GROUP_ITEMS: NominalGroupItem[] = [
  { determiner: 'un', adjective: 'agréable', correctNoun: 'marchand', distractorNouns: ['vendeuses', 'boulangers', 'commerçante'] },
  { determiner: 'une', adjective: 'jolie', correctNoun: 'feuille', distractorNouns: ['cadeau', 'écharpes', 'cartables'] },
  { determiner: 'des', adjective: 'nouveaux', correctNoun: 'amis', distractorNouns: ['ami', 'amie', 'amies'] },
  { determiner: 'des', adjective: 'mauvaises', correctNoun: 'blagues', distractorNouns: ['goût', 'croissants', 'idée'] },
  { determiner: 'un', adjective: 'grand', correctNoun: 'jardin', distractorNouns: ['maisons', 'maison', 'jardins'] },
  { determiner: 'une', adjective: 'petite', correctNoun: 'fille', distractorNouns: ['garçon', 'garçons', 'filles'] },
  { determiner: 'des', adjective: 'beaux', correctNoun: 'tableaux', distractorNouns: ['tableau', 'peinture', 'peintures'] },
  { determiner: 'des', adjective: 'belles', correctNoun: 'fleurs', distractorNouns: ['fleur', 'bouquet', 'bouquets'] },
  { determiner: 'un', adjective: 'vieux', correctNoun: 'château', distractorNouns: ['tours', 'tour', 'châteaux'] },
  { determiner: 'une', adjective: 'longue', correctNoun: 'route', distractorNouns: ['chemin', 'chemins', 'routes'] },
  { determiner: 'des', adjective: 'gentils', correctNoun: 'voisins', distractorNouns: ['voisin', 'voisine', 'voisines'] },
  { determiner: 'des', adjective: 'heureuses', correctNoun: 'familles', distractorNouns: ['famille', 'cousin', 'cousins'] },
];

interface ParticipeItem {
  prompt: string;
  correct: string;
  distractors: [string, string, string];
}

const CM2_PARTICIPE_ITEMS: ParticipeItem[] = [
  { prompt: 'Elle est ...', correct: 'partie', distractors: ['parti', 'partis', 'parties'] },
  { prompt: 'Ils sont ...', correct: 'arrivés', distractors: ['arrivé', 'arrivée', 'arrivées'] },
  { prompt: 'Elles sont ...', correct: 'tombées', distractors: ['tombé', 'tombés', 'tombée'] },
  { prompt: 'Il est ...', correct: 'venu', distractors: ['venue', 'venus', 'venues'] },
];

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const nominalCount = level === 'CM1' ? count : Math.ceil(count / 2);
  const participeCount = count - nominalCount;

  const nominalPicked = rngPickN(rng, NOMINAL_GROUP_ITEMS, nominalCount).map((item, index) => {
    const choices = rngShuffle(rng, [item.correctNoun, ...item.distractorNouns]);
    return {
      id: `accords-nominal-${index}-${item.correctNoun}`,
      domain: 'accords' as const,
      prompt: `${item.determiner} ${item.adjective} ...`,
      choices,
      correctIndex: choices.indexOf(item.correctNoun),
    };
  });

  if (participeCount <= 0) {
    return nominalPicked;
  }

  const participePicked = rngPickN(rng, CM2_PARTICIPE_ITEMS, participeCount).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `accords-participe-${index}-${item.correct}`,
      domain: 'accords' as const,
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  return rngShuffle(rng, [...nominalPicked, ...participePicked]);
}
