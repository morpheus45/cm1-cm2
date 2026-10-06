import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './accords';
import { ADJECTIVES } from './accordsLexique';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';

/** Du CE1 à la 6e : les questions de ces cinq niveaux ont les mêmes garanties.
 *  Ce que le CE1, le CE2 et la 6e ont en propre est dans accordsNiveaux.test.ts. */
const LEVELS: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e'];
const IRREGULAR_PLURALS = ['tableaux', 'journaux', 'bateaux', 'chevaux'];
/** Les formes plurielles des adjectifs : un « des » suivi de l'une d'elles
 *  trahirait un adjectif déjà placé avant le nom, dans une question qui
 *  laisse ce nom à trouver. */
const PLURAL_ADJECTIVE_FORMS = new Set(ADJECTIVES.flatMap((a) => [a.masculinePlural, a.femininePlural]));

describe('accords generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', 1, createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', 3, createRng(1), 8)).toHaveLength(8);
    LEVELS.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        [1, 4, 12, 40, 200].forEach((count) =>
          expect(generate(level, trimester, createRng(count), count), `${level} T${trimester} × ${count}`).toHaveLength(count)
        );
      })
    );
  });

  it('never asks the same sentence twice in one session, at the levels written for the cycle 2 and the 6e', () => {
    // Le CM1 et le CM2, qui ne doivent pas changer, peuvent encore répéter un énoncé dans une séance de douze questions.
    (['CE1', 'CE2', '6e'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        for (let seed = 1; seed <= 20; seed++) {
          const signatures = generate(level, trimester, createRng(seed), 12).map((q) => `${q.instruction}|${q.prompt}`);
          expect(new Set(signatures).size, `${level} T${trimester} graine ${seed}`).toBe(signatures.length);
        }
      })
    );
  });

  it('tags every question with domain "accords" and 4 unique choices', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(3), 10).forEach((q) => {
          expect(q.domain).toBe('accords');
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices).size).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(4);
        });
      });
    });
  });

  it('is reproducible for the same seed, level and trimester', () => {
    expect(generate('CM2', 2, createRng(42), 8)).toEqual(generate('CM2', 2, createRng(42), 8));
  });

  it('introduces the participe passé with the passé composé, in the third trimester of CM1', () => {
    const hasParticipe = (level: Level, trimester: Trimester) =>
      generate(level, trimester, createRng(5), 20).some((q) => q.id.startsWith('accords-participe'));
    expect(hasParticipe('CM1', 1)).toBe(false);
    expect(hasParticipe('CM1', 2)).toBe(false);
    expect(hasParticipe('CM1', 3)).toBe(true);
    expect(hasParticipe('CM2', 1)).toBe(true);
    expect(hasParticipe('CM2', 2)).toBe(true);
    expect(hasParticipe('CM2', 3)).toBe(true);
  });

  it('keeps irregular plurals for the third trimester of CM1 onwards', () => {
    // Les noms irréguliers ne sont qu'une partie du lexique : un seul tirage
    // peut les manquer par hasard. Plusieurs graines évitent ce faux négatif
    // tout en gardant le test déterministe.
    const usesIrregular = (level: Level, trimester: Trimester) =>
      [1, 2, 3, 4, 5].some((seed) =>
        generate(level, trimester, createRng(seed), 40).some((q) =>
          IRREGULAR_PLURALS.some((noun) => q.id.endsWith(`-${noun}`))
        )
      );
    expect(usesIrregular('CM1', 1)).toBe(false);
    expect(usesIrregular('CM1', 2)).toBe(false);
    expect(usesIrregular('CM1', 3)).toBe(true);
    expect(usesIrregular('CM2', 1)).toBe(true);
  });

  it('still revises simple nominal groups at the end of CM2', () => {
    const questions = generate('CM2', 3, createRng(13), 40);
    expect(questions.some((q) => q.id.startsWith('accords-nominal'))).toBe(true);
  });

  it('écrit « de », jamais « des », devant un adjectif déjà placé avant le nom', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        for (let seed = 1; seed <= 40; seed++) {
          const questions = generate(level, trimester, createRng(seed * 7919 + 1), 12);
          // Groupe nominal, nom à trouver : l'adjectif, déjà visible, ne doit
          // jamais suivre un « des » quand il est placé avant le nom.
          questions
            .filter((q) => q.id.startsWith('accords-nominal'))
            .forEach((q) => {
              const firstWord = q.prompt.split(' ')[1];
              if (PLURAL_ADJECTIVE_FORMS.has(firstWord)) expect(q.prompt, q.prompt).not.toMatch(/^des /);
            });
          // Groupe nominal, adjectif à trouver et placé avant le nom : le
          // trou masque l'adjectif, mais l'article qui le précède doit déjà
          // être « de ».
          questions
            .filter((q) => q.id.startsWith('accords-adjectif'))
            .forEach((q) => expect(q.prompt, q.prompt).not.toMatch(/^des \.\.\. /));
        }
      });
    });
  });
});
