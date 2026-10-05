import { describe, expect, it } from 'vitest';
import { isTableFact, needsBrouillon } from './brouillon';
import { generate } from '../domains/calcul';
import { createRng } from './seededRandom';

describe('brouillon', () => {
  it('reconnaît un calcul de table', () => {
    expect(isTableFact('7 × 8')).toBe(true);
    expect(isTableFact('10 × 9')).toBe(true);
    expect(isTableFact('12 × 7')).toBe(false);
    expect(isTableFact('45 + 38')).toBe(false);
  });

  it('propose un brouillon pour les calculs et les problèmes, pas pour les tables', () => {
    expect(needsBrouillon({ domain: 'calcul', prompt: '456 + 378' })).toBe(true);
    expect(needsBrouillon({ domain: 'calcul', prompt: '6 × 7' })).toBe(false);
    expect(needsBrouillon({ domain: 'problemes', prompt: 'Un bus…' })).toBe(true);
    expect(needsBrouillon({ domain: 'conjugaison', prompt: 'Il (manger)' })).toBe(false);
    expect(needsBrouillon({ domain: 'numeration', prompt: '3 456' })).toBe(false);
  });

  it('laisse les tables de la séance de calcul sans brouillon', () => {
    const questions = generate('CM2', 3, createRng(3), 60);
    const tables = questions.filter((q) => !needsBrouillon(q));
    const autres = questions.filter((q) => needsBrouillon(q));
    expect(autres.length).toBeGreaterThan(0);
    for (const q of tables) expect(isTableFact(q.prompt)).toBe(true);
  });
});
