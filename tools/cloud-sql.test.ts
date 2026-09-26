import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { depositParams } from '../src/lib/cloud';
import type { SessionResult } from '../src/lib/results';

const session: SessionResult = {
  id: '6d355502-2a81-4620-93e9-c3535afe160c',
  pupil: { firstName: 'Léa', lastName: 'Martin' },
  at: '2026-09-26T10:00:00.000Z',
  level: 'CM1',
  trimester: 2,
  subject: 'maths',
  activity: 'questions',
  domains: [{ domain: 'calcul', correct: 3, total: 4 }],
};

describe('l\'application et la base parlent la même langue', () => {
  it('envoie exactement les paramètres de depose_seance, dans le même ordre', () => {
    // Une faute de frappe ici ne se verrait qu'en ligne, par des séances qui
    // n'arrivent jamais : on compare donc au fichier SQL lui-même.
    const sql = readFileSync(join(process.cwd(), 'supabase', '001_classes_eleves_seances.sql'), 'utf8');
    const signature = sql.match(
      /create or replace function public\.depose_seance\(([\s\S]*?)\)\s*returns uuid/
    );
    expect(signature, 'signature de depose_seance introuvable').not.toBeNull();
    const sqlNames = [...signature![1].matchAll(/\b(p_\w+)\s/g)].map((m) => m[1]);
    expect(Object.keys(depositParams(session, 'AAAAAA'))).toEqual(sqlNames);
  });
});
