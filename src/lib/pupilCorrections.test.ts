import { describe, expect, it } from 'vitest';
import type { SessionResult } from './results';
import {
  forgetCorrections,
  markSeen,
  mergeCorrections,
  parseStoredCorrections,
  receivedFor,
  sessionIdsToAsk,
  type StoredCorrection,
} from './pupilCorrections';

const lea = { firstName: 'Léa', lastName: 'Martin' };
const noe = { firstName: 'Noé', lastName: 'Petit' };

const session = (id: string, at: string, extra: Partial<SessionResult> = {}): SessionResult => ({
  id,
  pupil: lea,
  at,
  level: 'CM1',
  trimester: 2,
  subject: 'maths',
  activity: 'posees',
  domains: [{ domain: 'calcul', correct: 5, total: 6 }],
  ...extra,
});

const row = (sessionId: string, correctedAt: string, appreciation = 'Bien') => ({
  session_id: sessionId,
  operations: [{ id: 'a', statement: '244 + 282', expected: '526' }],
  answers: { a: { given: '526', strokes: [{ points: [[0.1, 0.2], [0.3, 0.4]] }] } },
  corrections: { version: 1, appreciation, operations: { a: { teacherStrokes: [{ points: [[0.5, 0.5]] }] } } },
  corrected_at: correctedAt,
});

const sessions = [
  session('s1', '2026-10-01T09:00:00.000Z'),
  session('s2', '2026-10-02T09:00:00.000Z'),
  session('q1', '2026-10-03T09:00:00.000Z', { activity: 'questions' }),
  session('n1', '2026-10-04T09:00:00.000Z', { pupil: noe }),
];

describe('sessionIdsToAsk', () => {
  it('ne demande que les opérations posées, les plus récentes d\'abord', () => {
    expect(sessionIdsToAsk(sessions)).toEqual(['n1', 's2', 's1']);
  });

  it('en demande cinquante au plus', () => {
    const many = Array.from({ length: 60 }, (_, index) =>
      session(`s${index}`, `2026-10-01T09:00:${String(index).padStart(2, '0')}.000Z`)
    );
    const asked = sessionIdsToAsk(many);
    expect(asked).toHaveLength(50);
    expect(asked[0]).toBe('s59');
  });
});

describe('mergeCorrections', () => {
  it('garde les feuilles de la tablette, la plus récemment corrigée d\'abord', () => {
    const merged = mergeCorrections(
      [],
      [row('s1', '2026-10-05T10:00:00.000Z'), row('s2', '2026-10-06T10:00:00.000Z'), row('inconnue', '2026-10-07T10:00:00.000Z'), null, { session_id: 's1' }],
      sessions
    );
    expect(merged.map((entry) => entry.sessionId)).toEqual(['s2', 's1']);
    expect(merged[0]).toMatchObject({ pupil: lea, level: 'CM1', trimester: 2, at: '2026-10-02T09:00:00.000Z', seenCorrectedAt: null });
  });

  it('ne perd rien quand la base ne répond pas', () => {
    const stored = mergeCorrections([], [row('s1', '2026-10-05T10:00:00.000Z')], sessions);
    expect(mergeCorrections(stored, null, sessions)).toBe(stored);
  });

  it('garde les douze plus récentes', () => {
    const many = Array.from({ length: 15 }, (_, index) => session(`p${index}`, '2026-10-01T09:00:00.000Z'));
    const rows = many.map((entry, index) => row(entry.id, `2026-10-${String(index + 10).padStart(2, '0')}T10:00:00.000Z`));
    const merged = mergeCorrections([], rows, many);
    expect(merged).toHaveLength(12);
    expect(merged[0].sessionId).toBe('p14');
  });
});

describe('ce que voit l\'élève', () => {
  const stored = mergeCorrections(
    [],
    [row('s1', '2026-10-05T10:00:00.000Z', 'Attention aux retenues.'), row('n1', '2026-10-06T10:00:00.000Z')],
    sessions
  );

  it('ses feuilles seulement, avec les traits rouges et l\'appréciation', () => {
    const received = receivedFor(stored, { firstName: ' lea ', lastName: 'MARTIN' });
    expect(received).toHaveLength(1);
    expect(received[0].isNew).toBe(true);
    expect(received[0].worksheet.appreciation).toBe('Attention aux retenues.');
    expect(received[0].worksheet.name).toBe('Léa Martin');
    expect(received[0].worksheet.answers.a.teacherStrokes).toEqual([{ points: [[0.5, 0.5]] }]);
    expect(received[0].worksheet.answers.a.strokes).toEqual([{ points: [[0.1, 0.2], [0.3, 0.4]] }]);
    expect(receivedFor(stored, { firstName: '', lastName: '' })).toEqual([]);
  });

  it('une feuille ouverte n\'est plus nouvelle, jusqu\'à une nouvelle correction', () => {
    const seen = markSeen(stored, 's1');
    expect(receivedFor(seen, lea)[0].isNew).toBe(false);
    const again = mergeCorrections(seen, [row('s1', '2026-10-08T10:00:00.000Z', 'Corrigée à nouveau.')], sessions);
    expect(receivedFor(again, lea)[0]).toMatchObject({ isNew: true, correctedAt: '2026-10-08T10:00:00.000Z' });
    const unchanged = mergeCorrections(seen, [row('s1', '2026-10-05T10:00:00.000Z', 'Attention aux retenues.')], sessions);
    expect(receivedFor(unchanged, lea)[0].isNew).toBe(false);
  });

  it('s\'efface avec les données de l\'élève', () => {
    expect(forgetCorrections(stored, 'lea martin').map((entry) => entry.sessionId)).toEqual(['n1']);
    expect(forgetCorrections(stored, null)).toEqual([]);
  });
});

describe('parseStoredCorrections', () => {
  it('relit ce qui a été gardé, et écarte le reste', () => {
    const stored: StoredCorrection[] = mergeCorrections([], [row('s1', '2026-10-05T10:00:00.000Z')], sessions);
    expect(parseStoredCorrections(JSON.stringify(stored))).toEqual(stored);
    expect(parseStoredCorrections(null)).toEqual([]);
    expect(parseStoredCorrections('abîmé')).toEqual([]);
    expect(parseStoredCorrections(JSON.stringify([{ ...stored[0], level: 'CE2' }, { sessionId: 3 }, null]))).toEqual([]);
  });
});
