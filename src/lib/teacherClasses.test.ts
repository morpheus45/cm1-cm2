import { describe, expect, it } from 'vitest';
import type { SessionResult } from './results';
import type { CloudClass } from './teacherCloud';
import { correctionQueue, parseChosenClasses, pickCurrentClass, withChosenClass } from './teacherClasses';

const session = (id: string, at: string): SessionResult => ({
  id,
  pupil: { firstName: 'Léa', lastName: 'Martin' },
  at,
  level: 'CM1',
  trimester: 1,
  subject: 'maths',
  activity: 'posees',
  domains: [],
});

const cloudClass = (id: string, sessions: SessionResult[] = []): CloudClass => ({
  id,
  name: `Classe ${id}`,
  level: 'CM1',
  joinCode: 'ABC123',
  sessions,
  pupilIds: {},
});

describe('pickCurrentClass', () => {
  const classes = [cloudClass('a'), cloudClass('b')];

  it('rouvre la classe choisie', () => {
    expect(pickCurrentClass(classes, 'b')?.id).toBe('b');
  });

  it('retombe sur la première quand le choix n\'existe plus, ou n\'existe pas', () => {
    expect(pickCurrentClass(classes, 'supprimee')?.id).toBe('a');
    expect(pickCurrentClass(classes, null)?.id).toBe('a');
    expect(pickCurrentClass([], 'a')).toBeNull();
  });
});

describe('correctionQueue', () => {
  it('garde les feuilles pas encore corrigées de la classe, la plus ancienne d\'abord', () => {
    const current = cloudClass('a', [
      session('s3', '2026-10-03T09:00:00.000Z'),
      session('s1', '2026-10-01T09:00:00.000Z'),
      session('s2', '2026-10-02T09:00:00.000Z'),
      session('sans-feuille', '2026-09-30T09:00:00.000Z'),
    ]);
    const worksheets = {
      s1: { correctedAt: null },
      s2: { correctedAt: '2026-10-04T09:00:00.000Z' },
      s3: { correctedAt: null },
      'autre-classe': { correctedAt: null },
    };
    expect(correctionQueue(current, worksheets).map((entry) => entry.id)).toEqual(['s1', 's3']);
    expect(correctionQueue(null, worksheets)).toEqual([]);
  });
});

describe('la classe dont la tablette se souvient', () => {
  it('se relit sans jamais planter', () => {
    expect(parseChosenClasses(null)).toEqual({});
    expect(parseChosenClasses('abîmé')).toEqual({});
    expect(parseChosenClasses('["a"]')).toEqual({});
    expect(parseChosenClasses('{"m1":"c1","m2":42}')).toEqual({ m1: 'c1' });
  });

  it('est propre à chaque maîtresse', () => {
    const chosen = withChosenClass(withChosenClass({}, 'm1', 'c1'), 'm2', 'c7');
    expect(withChosenClass(chosen, 'm1', 'c2')).toEqual({ m2: 'c7', m1: 'c2' });
  });

  it('oublie les maîtresses les plus anciennes au-delà de huit', () => {
    let chosen: Record<string, string> = {};
    for (let index = 1; index <= 10; index++) chosen = withChosenClass(chosen, `m${index}`, `c${index}`);
    expect(Object.keys(chosen)).toEqual(['m3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10']);
  });
});
