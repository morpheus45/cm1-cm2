import { describe, expect, it } from 'vitest';
import { buildSession, subjectOfDomains, MIXED_SUBJECTS_ERROR } from './sessionBuilder';
import { ALL_DOMAINS, SUBJECT_DOMAINS, subjectOf } from '../types';
import type { Domain, Level, Trimester } from '../types';

const base = { level: 'CM1' as Level, trimester: 1 as Trimester, seed: 1 };

describe('subjectOfDomains', () => {
  it('reads the subject off the selected notions', () => {
    expect(subjectOfDomains(['conjugaison', 'orthographe'])).toBe('francais');
    expect(subjectOfDomains(['calcul', 'problemes'])).toBe('maths');
  });

  it('refuses a list that spans French and maths', () => {
    expect(() => subjectOfDomains(['conjugaison', 'calcul'])).toThrow(MIXED_SUBJECTS_ERROR);
  });

  it('refuses an empty list', () => {
    expect(() => subjectOfDomains([])).toThrow();
  });
});

describe('buildSession', () => {
  it('returns exactly `count` questions', () => {
    expect(buildSession({ ...base, domains: ['calcul', 'numeration'], count: 8 }).questions).toHaveLength(8);
  });

  it('defaults to 8 questions when count is omitted', () => {
    expect(buildSession({ ...base, domains: ['calcul'] }).questions).toHaveLength(8);
  });

  it('only includes questions from the requested notions', () => {
    const session = buildSession({ ...base, level: 'CM2', trimester: 3, domains: ['numeration', 'calcul'], count: 8 });
    session.questions.forEach((q) => expect(['numeration', 'calcul']).toContain(q.domain));
  });

  it('never mixes French and maths inside one session', () => {
    const subsets: Domain[][] = [
      ['conjugaison'],
      ['conjugaison', 'accords'],
      [...SUBJECT_DOMAINS.francais],
      ['numeration'],
      ['calcul', 'problemes'],
      [...SUBJECT_DOMAINS.maths],
    ];
    subsets.forEach((domains) => {
      const session = buildSession({ ...base, level: 'CM2', trimester: 3, domains, count: 12 });
      const subjects = new Set(session.questions.map((q) => subjectOf(q.domain)));
      expect(subjects.size).toBe(1);
      expect(subjects.has(session.subject)).toBe(true);
    });
  });

  it('refuses to build a session that spans both subjects', () => {
    expect(() => buildSession({ ...base, domains: ['conjugaison', 'calcul'], count: 8 })).toThrow(
      MIXED_SUBJECTS_ERROR
    );
    expect(() => buildSession({ ...base, domains: ALL_DOMAINS, count: 8 })).toThrow(MIXED_SUBJECTS_ERROR);
  });

  it('groups questions by notion instead of interleaving them', () => {
    const session = buildSession({
      ...base,
      level: 'CM2',
      trimester: 3,
      domains: [...SUBJECT_DOMAINS.francais],
      count: 9,
    });
    const runs: Domain[] = [];
    session.questions.forEach((q) => {
      if (runs[runs.length - 1] !== q.domain) runs.push(q.domain);
    });
    // Chaque notion forme un seul bloc continu, dans l'ordre de la matière.
    expect(runs).toEqual([...new Set(runs)]);
    expect(runs).toEqual(SUBJECT_DOMAINS.francais.filter((d) => runs.includes(d)));
  });

  it('reports the subject, the notions and the chosen moment of the year', () => {
    const session = buildSession({
      domains: ['calcul', 'numeration'],
      level: 'CM2',
      trimester: 2,
      seed: 7,
      count: 6,
    });
    expect(session.subject).toBe('maths');
    expect(session.domains).toEqual(['numeration', 'calcul']);
    expect(session.level).toBe('CM2');
    expect(session.trimester).toBe(2);
  });

  it('is reproducible for the same seed, notions, level and trimester', () => {
    const args = { domains: [...SUBJECT_DOMAINS.maths], level: 'CM1' as Level, trimester: 2 as Trimester, seed: 2024, count: 12 };
    expect(buildSession(args)).toEqual(buildSession(args));
  });

  it('produces a different session for a different seed', () => {
    const a = buildSession({ ...base, domains: [...SUBJECT_DOMAINS.maths], seed: 1, count: 12 });
    const b = buildSession({ ...base, domains: [...SUBJECT_DOMAINS.maths], seed: 2, count: 12 });
    expect(a).not.toEqual(b);
  });

  it('produces a different session for a different trimester', () => {
    const a = buildSession({ ...base, domains: ['conjugaison'], trimester: 1, seed: 99, count: 8 });
    const b = buildSession({ ...base, domains: ['conjugaison'], trimester: 3, seed: 99, count: 8 });
    expect(a.questions).not.toEqual(b.questions);
  });

  it('throws when no notion is selected', () => {
    expect(() => buildSession({ ...base, domains: [], count: 8 })).toThrow();
  });

  it('produces the same session regardless of the order of the notion list', () => {
    const make = (domains: Domain[]) =>
      buildSession({ domains, level: 'CM2', trimester: 3, seed: 42, count: 9 });
    const a = make(['calcul', 'numeration', 'problemes']);
    const b = make(['problemes', 'calcul', 'numeration']);
    const c = make(['numeration', 'problemes', 'calcul']);
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it('builds a sound session for each of the 36 combinations of level, trimester and notion', () => {
    const levels: Level[] = ['CM1', 'CM2'];
    const trimesters: Trimester[] = [1, 2, 3];
    levels.forEach((level) => {
      trimesters.forEach((trimester) => {
        ALL_DOMAINS.forEach((domain) => {
          const session = buildSession({ domains: [domain], level, trimester, seed: 1234, count: 8 });
          expect(session.questions).toHaveLength(8);
          expect(session.subject).toBe(subjectOf(domain));
          session.questions.forEach((q) => {
            expect(q.domain).toBe(domain);
            expect(q.prompt.trim().length).toBeGreaterThan(0);
            expect(q.choices.length).toBeGreaterThanOrEqual(4);
            expect(new Set(q.choices).size).toBe(q.choices.length);
            expect(q.choices[q.correctIndex]).toBeDefined();
          });
        });
      });
    });
  });

  it('collapses duplicate notions to behave identically to the deduplicated list', () => {
    const withDuplicates = buildSession({ ...base, domains: ['calcul', 'calcul', 'numeration'], seed: 5, count: 8 });
    const deduplicated = buildSession({ ...base, domains: ['calcul', 'numeration'], seed: 5, count: 8 });
    expect(withDuplicates).toEqual(deduplicated);
  });
});
