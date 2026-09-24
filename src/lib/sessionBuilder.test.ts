import { describe, expect, it } from 'vitest';
import { buildSession } from './sessionBuilder';
import { ALL_DOMAINS } from '../types';

describe('buildSession', () => {
  it('returns exactly `count` questions', () => {
    const session = buildSession(['calcul', 'numeration'], 'CM1', 1, 8);
    expect(session).toHaveLength(8);
  });

  it('defaults to 8 questions when count is omitted', () => {
    const session = buildSession(['calcul'], 'CM1', 1);
    expect(session).toHaveLength(8);
  });

  it('only includes questions from the requested subjects', () => {
    const session = buildSession(['numeration', 'calcul'], 'CM2', 5, 8);
    session.forEach((q) => expect(['numeration', 'calcul']).toContain(q.domain));
  });

  it('is reproducible for the same seed, subjects and level', () => {
    const a = buildSession(ALL_DOMAINS, 'CM1', 2024, 12);
    const b = buildSession(ALL_DOMAINS, 'CM1', 2024, 12);
    expect(a).toEqual(b);
  });

  it('produces a different session for a different seed', () => {
    const a = buildSession(ALL_DOMAINS, 'CM1', 1, 12);
    const b = buildSession(ALL_DOMAINS, 'CM1', 2, 12);
    expect(a).not.toEqual(b);
  });

  it('throws when no subject is selected', () => {
    expect(() => buildSession([], 'CM1', 1, 8)).toThrow();
  });

  it('produces the same session regardless of subject array order', () => {
    const a = buildSession(['calcul', 'numeration', 'accords'], 'CM2', 42, 9);
    const b = buildSession(['accords', 'calcul', 'numeration'], 'CM2', 42, 9);
    const c = buildSession(['numeration', 'accords', 'calcul'], 'CM2', 42, 9);
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it('collapses duplicate subjects to behave identically to the deduplicated list', () => {
    const withDuplicates = buildSession(['calcul', 'calcul', 'numeration'], 'CM1', 5, 8);
    const deduplicated = buildSession(['calcul', 'numeration'], 'CM1', 5, 8);
    expect(withDuplicates).toEqual(deduplicated);
  });
});
