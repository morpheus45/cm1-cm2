import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate, eligibleTenses } from './conjugaison';
import { ALL_VERBS, PERSONS, type Tense } from './conjugaisonVerbes';
import { verbesEnseignes } from './conjugaisonNiveaux';
import { estNiveauEcrit } from './francaisNiveaux';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';

/** Du CE1 à la 6e : les questions de ces cinq niveaux ont les mêmes garanties.
 *  Ce que le CE1, le CE2 et la 6e ont en propre est dans conjugaisonNiveaux.test.ts. */
const LEVELS: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e'];

/** Les verbes qu'un niveau conjugue : ceux du CM, ou ceux de sa propre liste. */
const verbsOf = (level: Level) => (estNiveauEcrit(level) ? verbesEnseignes(level) : ALL_VERBS);

function tenseOfFormQuestion(instruction: string): string {
  return instruction.replace(/^Complète (au |à l')/, '').replace(/ — verbe .*$/, '');
}

describe('conjugaison generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', 1, createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', 3, createRng(1), 8)).toHaveLength(8);
    LEVELS.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        [1, 4, 12, 40, 200].forEach((count) => expect(generate(level, trimester, createRng(count), count), `${level} T${trimester} × ${count}`).toHaveLength(count));
      })
    );
  });

  it('tags every question with domain "conjugaison"', () => {
    generate('CM1', 2, createRng(1), 5).forEach((q) => expect(q.domain).toBe('conjugaison'));
  });

  it('gives each question exactly 4 distinct choices with a valid correctIndex', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        generate(level, trimester, createRng(2), 12).forEach((q) => {
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices).size).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(4);
        });
      });
    });
  });

  it('is reproducible for the same seed, level and trimester', () => {
    expect(generate('CM1', 2, createRng(99), 6)).toEqual(generate('CM1', 2, createRng(99), 6));
  });

  it('follows the standard progression of tenses', () => {
    expect(eligibleTenses('CM1', 1)).toEqual(['présent']);
    expect(eligibleTenses('CM1', 2)).toEqual(['présent', 'imparfait']);
    expect(eligibleTenses('CM1', 3)).toEqual(['présent', 'imparfait', 'futur', 'passé composé']);
    expect(eligibleTenses('CM2', 1)).toEqual(['présent', 'imparfait', 'futur', 'passé composé']);
    expect(eligibleTenses('CM2', 2)).toContain('passé simple');
    expect(eligibleTenses('CM2', 2)).not.toContain('conditionnel présent');
    expect(eligibleTenses('CM2', 3)).toContain('conditionnel présent');
  });

  it('never asks about a tense that has not been taught yet', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        const allowed = eligibleTenses(level, trimester);
        generate(level, trimester, createRng(7), 40).forEach((q) => {
          if (q.id.startsWith('conjugaison-forme-')) {
            expect(allowed).toContain(tenseOfFormQuestion(q.instruction ?? ''));
          } else if (q.id.startsWith('conjugaison-temps-')) {
            q.choices.forEach((choice) => expect(allowed).toContain(choice));
          }
        });
      });
    });
  });

  it('never offers an untaught tense as a wrong answer either', () => {
    const questions = generate('CM1', 3, createRng(4), 30);
    const cm1Tenses = eligibleTenses('CM1', 3);
    questions
      .filter((q) => q.id.startsWith('conjugaison-temps-'))
      .forEach((q) => q.choices.forEach((choice) => expect(cm1Tenses).toContain(choice)));
  });

  it('asks to complete the sentence, not to name the tense, while only one tense is known', () => {
    const questions = generate('CM1', 1, createRng(5), 20);
    expect(questions.every((q) => q.id.startsWith('conjugaison-forme-'))).toBe(true);
  });

  it('starts naming tenses once four of them have been taught', () => {
    const questions = generate('CM1', 3, createRng(5), 20);
    expect(questions.some((q) => q.id.startsWith('conjugaison-temps-'))).toBe(true);
  });

  it('never asks the same sentence twice in one session', () => {
    const questions = generate('CM2', 3, createRng(3), 12);
    const keys = questions.map((q) => q.prompt.replace(/\*\*.+?\*\*/, '...'));
    expect(new Set(keys).size).toBe(keys.length);
    LEVELS.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        for (let seed = 1; seed <= 20; seed++) {
          const signatures = generate(level, trimester, createRng(seed), 12).map((q) => `${q.instruction}|${q.prompt}`);
          expect(new Set(signatures).size, `${level} T${trimester} graine ${seed}`).toBe(signatures.length);
        }
      })
    );
  });

  it('writes the instruction in correct French for every tense', () => {
    const instructions = new Set(
      generate('CM2', 3, createRng(77), 80)
        .filter((q) => q.id.startsWith('conjugaison-forme-'))
        .map((q) => (q.instruction ?? '').split(' — ')[0])
    );
    expect(instructions).toContain("Complète à l'imparfait");
    expect(instructions).toContain('Complète au présent');
    instructions.forEach((text) => expect(text).not.toContain('Complète au imparfait'));
  });

  it('ne fait conjuguer le passé simple qu\'aux troisièmes personnes, comme le programme', () => {
    for (let seed = 1; seed <= 60; seed++) {
      generate('CM2', 3, createRng(seed), 12)
        .filter((q) => (q.instruction ?? '').includes('passé simple') || q.choices[q.correctIndex] === 'passé simple')
        .forEach((q) => expect(q.prompt, q.prompt).not.toMatch(/^(Je|J'|Tu|Nous|Vous)\b/));
    }
  });

  it('ne mélange jamais un indicateur de temps avec un temps incompatible', () => {
    const PAST_TENSES = ['imparfait', 'passé composé', 'passé simple', 'plus-que-parfait'];
    const NON_PAST_TENSES = ['présent', 'futur', 'conditionnel présent'];
    const tenseOf = (q: { id: string; instruction?: string; choices: string[]; correctIndex: number }): string =>
      q.id.startsWith('conjugaison-forme-') ? tenseOfFormQuestion(q.instruction ?? '') : q.choices[q.correctIndex];

    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        for (let seed = 1; seed <= 40; seed++) {
          generate(level, trimester, createRng(seed * 7919 + 1), 12).forEach((q) => {
            if (!q.id.startsWith('conjugaison-forme-') && !q.id.startsWith('conjugaison-temps-')) return;
            const tense = tenseOf(q);
            if (/\bdemain\b/.test(q.prompt)) expect(PAST_TENSES, q.prompt).not.toContain(tense);
            if (/\bhier\b/.test(q.prompt)) expect(NON_PAST_TENSES, q.prompt).not.toContain(tense);
          });
        }
      });
    });
  });

  it('keeps revising earlier tenses at the end of the year', () => {
    const questions = generate('CM2', 3, createRng(11), 60);
    const tenses = new Set(
      questions
        .filter((q) => q.id.startsWith('conjugaison-forme-'))
        .map((q) => tenseOfFormQuestion(q.instruction ?? ''))
    );
    expect(tenses.has('présent')).toBe(true);
    expect(tenses.has('conditionnel présent')).toBe(true);
  });
});

describe('trouver le temps : une seule bonne réponse', () => {
  it("ne propose jamais un autre temps qui donne la même forme (il remplit, il dit…)", () => {
    for (const level of LEVELS) {
      for (const trimester of ALL_TRIMESTERS) {
        for (let seed = 0; seed < 150; seed++) {
          for (const q of generate(level, trimester as Trimester, createRng(seed), 12)) {
            if (q.instruction !== 'À quel temps est le verbe souligné ?') continue;
            const form = /\*\*(.+?)\*\*/.exec(q.prompt)?.[1];
            expect(form).toBeTruthy();
            const correct = q.choices[q.correctIndex] as Tense;
            for (const verb of verbsOf(level)) {
              for (const person of PERSONS) {
                if (verb.forms[correct]?.[person] !== form) continue;
                for (const other of q.choices) {
                  if (other === correct) continue;
                  expect(verb.forms[other as Tense]?.[person], `${q.prompt} : ${correct} / ${other}`).not.toBe(form);
                }
              }
            }
          }
        }
      }
    }
  });
});

describe('élision de « je »', () => {
  it("écrit « J'écoute » et « J'étais », jamais « Je écoute » : les voyelles accentuées comptent", () => {
    for (const level of ['CM1', 'CM2'] as const) {
      for (const trimester of ALL_TRIMESTERS) {
        for (let seed = 0; seed < 200; seed++) {
          for (const q of generate(level, trimester, createRng(seed), 12)) {
            expect(q.prompt.replace(/\*\*/g, ''), q.prompt).not.toMatch(/\bje [aeiouyàâäéèêëîïôöùûü]/i);
          }
        }
      }
    }
  });
});
