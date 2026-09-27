import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyRetention, fromSchoolYear, SCHOOL_YEAR_KEY } from './conservation';

/** Le stockage du navigateur, en mémoire : les tests tournent sous Node. */
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

const session = (id: string, at: string) => ({
  id,
  at,
  pupil: { firstName: 'Léa', lastName: 'M' },
  level: 'CM1',
  trimester: 1,
  subject: 'maths',
  activity: 'questions',
  domains: [{ domain: 'calcul', correct: 3, total: 4 }],
});

const correction = (sessionId: string, at: string) => ({
  sessionId,
  pupil: { firstName: 'Léa', lastName: 'M' },
  level: 'CM1',
  trimester: 3,
  at,
  correctedAt: at,
  row: { operations: [], answers: {}, corrections: null },
  seenCorrectedAt: null,
});

let storage: MemoryStorage;

/** Une tablette qui a servi en juin 2026 et en septembre 2026. */
function tabletteUtilisee(anneeEnregistree: string | null) {
  storage.setItem('exercices-cm1-cm2:resultats', JSON.stringify([
    session('juin', '2026-06-20T09:00:00.000Z'),
    session('septembre', '2026-09-08T09:00:00.000Z'),
  ]));
  storage.setItem('exercices-cm1-cm2:feuilles-corrigees', JSON.stringify([
    correction('juin', '2026-06-20T09:00:00.000Z'),
    correction('septembre', '2026-09-08T09:00:00.000Z'),
  ]));
  storage.setItem('exercices-cm1-cm2:envois-en-attente', JSON.stringify([{ p_session_id: 'juin', p_join_code: 'ABC123' }]));
  storage.setItem('exercices-cm1-cm2:preferences', JSON.stringify({ name: 'Léa', lastName: 'M', joinCode: 'ABC123' }));
  storage.setItem('exercices-cm1-cm2:problemes-de-la-classe', JSON.stringify({ joinCode: 'ABC123', problems: [] }));
  storage.setItem('exercices-cm1-cm2:stars', '42');
  storage.setItem('exercices-cm1-cm2:classe-choisie', JSON.stringify({ maitresse: 'classe' }));
  if (anneeEnregistree !== null) storage.setItem(SCHOOL_YEAR_KEY, anneeEnregistree);
}

const ids = (key: string) => (JSON.parse(storage.getItem(key) ?? '[]') as { id?: string; sessionId?: string }[]).map((entry) => entry.id ?? entry.sessionId);

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('la conservation sur la tablette : une année scolaire', () => {
  it('garde ce qui date de l\'année scolaire en cours', () => {
    const entries = [{ at: '2026-08-31T12:00:00.000Z' }, { at: '2026-09-02T12:00:00.000Z' }, { at: '2027-06-30T12:00:00.000Z' }];
    expect(fromSchoolYear(entries, 2026)).toEqual(entries.slice(1));
  });

  it('à la rentrée, efface l\'année passée et repart à zéro', () => {
    tabletteUtilisee('2025');
    expect(applyRetention(new Date('2026-09-27T10:00:00'))).toBe(true);
    expect(ids('exercices-cm1-cm2:resultats')).toEqual(['septembre']);
    expect(ids('exercices-cm1-cm2:feuilles-corrigees')).toEqual(['septembre']);
    ['envois-en-attente', 'preferences', 'problemes-de-la-classe', 'stars'].forEach((key) =>
      expect(storage.getItem(`exercices-cm1-cm2:${key}`), key).toBeNull()
    );
    // La maîtresse retrouve sa classe : ce n'est pas une donnée d'élève.
    expect(storage.getItem('exercices-cm1-cm2:classe-choisie')).not.toBeNull();
    expect(storage.getItem(SCHOOL_YEAR_KEY)).toBe('2026');
  });

  it('pendant l\'année, ne touche à rien d\'autre', () => {
    tabletteUtilisee('2026');
    expect(applyRetention(new Date('2026-10-15T10:00:00'))).toBe(false);
    expect(ids('exercices-cm1-cm2:resultats')).toEqual(['septembre']);
    expect(storage.getItem('exercices-cm1-cm2:preferences')).not.toBeNull();
    expect(storage.getItem('exercices-cm1-cm2:stars')).toBe('42');
  });

  it('au tout premier lancement, trie seulement ce qui est daté', () => {
    tabletteUtilisee(null);
    expect(applyRetention(new Date('2026-09-27T10:00:00'))).toBe(false);
    expect(ids('exercices-cm1-cm2:resultats')).toEqual(['septembre']);
    expect(storage.getItem('exercices-cm1-cm2:preferences')).not.toBeNull();
    expect(storage.getItem(SCHOOL_YEAR_KEY)).toBe('2026');
  });
});
