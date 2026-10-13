import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { stageOf } from '../lib/progression';
import { fabriquer, type Brique } from './mathsCommun';
import { BRIQUES_CINQUIEME } from './problemesCinquieme';
import { BRIQUES_QUATRIEME } from './problemesQuatrieme';
import { BRIQUES_TROISIEME } from './problemesTroisieme';

/**
 * Les problèmes du collège : la 5e (nouveau programme de cycle 4, BO n° 10 du
 * 5 mars 2026), la 4e et la 3e (ancien programme, BO n° 31 du 30 juillet 2020).
 * Les briques de chaque année sont dans problemesCinquieme.ts,
 * problemesQuatrieme.ts et problemesTroisieme.ts ; elles s'ajoutent : une
 * sorte de problème enseignée en 5e reste proposée en révision en 4e et en 3e.
 */
export const BRIQUES_PROBLEMES_CYCLE4: Brique[] = [...BRIQUES_CINQUIEME, ...BRIQUES_QUATRIEME, ...BRIQUES_TROISIEME];

/** Les problèmes de la 5e, de la 4e et de la 3e. */
export function genererCycle4(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return fabriquer('problemes', BRIQUES_PROBLEMES_CYCLE4, stageOf(level, trimester), rng, count);
}
