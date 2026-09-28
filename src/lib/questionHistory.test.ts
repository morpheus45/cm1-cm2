import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Question } from '../types';
import { forgetQuestionHistory, questionSignature, recentSignatures, recordShownQuestions } from './questionHistory';

class MemoryStorage {
  readonly items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

const pupil = { firstName: 'Léa', lastName: 'M' };

function question(prompt: string): Question {
  return { id: prompt, domain: 'conjugaison', instruction: 'Complète au présent', prompt, choices: ['a', 'b', 'c', 'd'], correctIndex: 0 };
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('la mémoire des questions déjà vues', () => {
  it('ne garde que des signatures : domaine, consigne et énoncé', () => {
    expect(questionSignature(question('Tu ... la mousse.'))).toBe('conjugaison§Complète au présent§Tu ... la mousse.');
  });

  it("n'a rien à éviter avant la première séance", () => {
    expect(recentSignatures(pupil, 'francais')).toEqual([]);
  });

  it('retient les questions montrées, dans leur ordre', () => {
    recordShownQuestions(pupil, 'francais', [question('Un'), question('Deux')]);
    recordShownQuestions(pupil, 'francais', [question('Trois')]);
    expect(recentSignatures(pupil, 'francais')).toEqual([
      questionSignature(question('Un')),
      questionSignature(question('Deux')),
      questionSignature(question('Trois')),
    ]);
  });

  it('ne mélange pas les matières, ni les élèves', () => {
    recordShownQuestions(pupil, 'francais', [question('Français')]);
    recordShownQuestions(pupil, 'maths', [question('Maths')]);
    recordShownQuestions({ firstName: 'Paul', lastName: 'D' }, 'francais', [question('Paul')]);
    expect(recentSignatures(pupil, 'francais')).toEqual([questionSignature(question('Français'))]);
    expect(recentSignatures(pupil, 'maths')).toEqual([questionSignature(question('Maths'))]);
  });

  it('ne garde que les dix dernières séances de la matière', () => {
    for (let session = 1; session <= 12; session++) {
      recordShownQuestions(pupil, 'francais', [question(`séance ${session}`)]);
    }
    const kept = recentSignatures(pupil, 'francais');
    expect(kept).toHaveLength(10);
    expect(kept[0]).toBe(questionSignature(question('séance 3')));
    expect(kept[9]).toBe(questionSignature(question('séance 12')));
  });

  it('efface tout à la rentrée', () => {
    recordShownQuestions(pupil, 'francais', [question('Une')]);
    forgetQuestionHistory();
    expect(recentSignatures(pupil, 'francais')).toEqual([]);
  });

  it('ignore un stockage corrompu plutôt que de planter la séance', () => {
    storage.setItem('exercices-cm1-cm2:historique-questions', '{ceci nest pas du json');
    expect(recentSignatures(pupil, 'francais')).toEqual([]);
    expect(() => recordShownQuestions(pupil, 'francais', [question('Une')])).not.toThrow();
  });
});
