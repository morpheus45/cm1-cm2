import type { Family } from './geometrieCommun';
import { FAMILLES_CINQUIEME } from './geometrieCinquieme';
import { FAMILLES_QUATRIEME } from './geometrieQuatrieme';
import { FAMILLES_TROISIEME } from './geometrieTroisieme';

/**
 * Les questions de géométrie du collège : la 5e (nouveau programme de cycle 4,
 * BO n° 10 du 5 mars 2026), la 4e et la 3e (ancien programme, BO n° 31 du 30
 * juillet 2020). Les familles de chaque année sont dans geometrieCinquieme.ts,
 * geometrieQuatrieme.ts et geometrieTroisieme.ts ; elles s'ajoutent : une
 * sorte de question enseignée en 5e reste proposée en révision en 4e et en 3e.
 */
export const FAMILLES_CYCLE4: Family[] = [...FAMILLES_CINQUIEME, ...FAMILLES_QUATRIEME, ...FAMILLES_TROISIEME];
