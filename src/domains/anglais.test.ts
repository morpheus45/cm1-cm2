import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, type Trimester } from '../types';
import { createRng } from '../lib/seededRandom';
import { candidateQuestions } from '../lib/evaluation';
import { reduireChoix } from '../lib/adaptations';
import { generateMots, generatePhrases, itemsAOrdonner, looksEnglish, PHRASES } from './anglais';

const TRIMESTRES: Trimester[] = [1, 2, 3];
const questions = ALL_LEVELS.flatMap((level) =>
  TRIMESTRES.flatMap((trimester) => [
    ...generateMots(level, trimester, createRng(3), 60),
    ...generatePhrases(level, trimester, createRng(5), 60),
  ])
);

describe('l\'anglais façon application de langue', () => {
  it('propose à chaque niveau des mots à écouter et des phrases à remettre dans l\'ordre', () => {
    ALL_LEVELS.forEach((level) => {
      const duNiveau = TRIMESTRES.flatMap((trimester) => [
        ...generateMots(level, trimester, createRng(1), 60),
        ...generatePhrases(level, trimester, createRng(1), 60),
      ]);
      expect(duNiveau.some((q) => q.audio), `${level} écoute`).toBe(true);
      expect(duNiveau.some((q) => q.wordOrder), `${level} ordre`).toBe(true);
    });
  });

  it('fait entendre l\'anglais avec une voix anglaise, et garde l\'écoute pour l\'entraînement', () => {
    questions.filter((q) => q.audio).forEach((q) => {
      expect(q.audio!.lang).toBe('en-GB');
      expect(q.practiceOnly).toBe(true);
      expect(q.choices).toContain(q.choices[q.correctIndex]);
    });
  });

  it('donne des phrases à ranger toujours faisables, sans étiquettes jumelles', () => {
    const items = itemsAOrdonner(PHRASES);
    expect(items.length).toBeGreaterThan(30);
    items.forEach(({ wordOrder, prompt }) => {
      const { words, bank } = wordOrder!;
      // Chaque mot de la bonne phrase est dans la banque, autant de fois qu'il faut.
      const reste = [...bank];
      words.forEach((mot) => {
        const index = reste.indexOf(mot);
        expect(index, `${prompt} : ${mot}`).toBeGreaterThanOrEqual(0);
        reste.splice(index, 1);
      });
      // Aucun intrus qui ne diffère d'un vrai mot que par une majuscule.
      reste.forEach((intrus) => expect(words.map((mot) => mot.toLowerCase()), prompt).not.toContain(intrus.toLowerCase()));
      // Vers le français, pas d'intrus : une autre traduction juste serait comptée fausse.
      if (prompt.startsWith('Traduis en français')) expect(reste, prompt).toEqual([]);
      // Les étiquettes ne portent pas de ponctuation.
      bank.forEach((mot) => expect(mot, prompt).not.toMatch(/[.,!?]$/));
    });
  });

  it('reconnaît une phrase anglaise, et pas une phrase française', () => {
    expect(looksEnglish('I don\'t like dogs.')).toBe(true);
    expect(looksEnglish('Je n\'aime pas les chiens.')).toBe(false);
    expect(looksEnglish('Où est le chat ?')).toBe(false);
  });

  it('ne met jamais l\'écoute ni les phrases à ranger dans une évaluation de la maîtresse', () => {
    ALL_LEVELS.forEach((level) =>
      (['anglais-mots', 'anglais-phrases'] as const).forEach((domain) => {
        const proposees = candidateQuestions(domain, level, 3, 7, 12);
        expect(proposees, `${domain} ${level}`).toHaveLength(12);
        proposees.forEach((q) => expect(q.practiceOnly, `${domain} ${level}`).toBeUndefined());
      })
    );
  });
});

describe('trois réponses au lieu de quatre', () => {
  it('gardent la bonne réponse, à sa place parmi les autres', () => {
    const q = { choices: ['a', 'b', 'c', 'd'], correctIndex: 3 };
    expect(reduireChoix(q)).toEqual({ choices: ['a', 'b', 'd'], correctIndex: 2 });
    expect(reduireChoix({ choices: ['x', 'y', 'z'], correctIndex: 1 })).toEqual({ choices: ['x', 'y', 'z'], correctIndex: 1 });
  });
});
