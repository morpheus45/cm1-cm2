import { describe, expect, it } from 'vitest';
import { frenchAuthError, mapClasses, mapWorksheetIndex, pupilIdFor } from './teacherCloud';

// Ce que rend `lire_ma_classe`, tel que la base l'écrit.
const raw = [
  {
    id: 'c1',
    name: 'CM1 A',
    level: 'CM1',
    join_code: 'AB23CD',
    pupils: [
      {
        id: 'p1',
        first_name: 'Léa',
        last_name: 'Martin',
        sessions: [
          {
            id: 's1',
            at: '2026-09-20T10:00:00+00:00',
            level: 'CM1',
            trimester: 2,
            subject: 'maths',
            activity: 'questions',
            results: [{ domain: 'calcul', correct: 3, total: 4 }],
          },
          {
            id: 's-abimee',
            at: 'pas une date',
            level: 'CM1',
            trimester: 2,
            subject: 'maths',
            activity: 'questions',
            results: [{ domain: 'calcul', correct: 9, total: 4 }],
          },
        ],
      },
      { id: 'p2', first_name: 'Noé', last_name: 'Petit', sessions: [] },
    ],
  },
];

describe('mapClasses', () => {
  it('traduit une classe de la base dans le modèle de l\'application', () => {
    const [classe] = mapClasses(raw);
    expect(classe).toMatchObject({ id: 'c1', name: 'CM1 A', level: 'CM1', joinCode: 'AB23CD' });
    expect(classe.sessions).toHaveLength(1);
    expect(classe.sessions[0]).toMatchObject({
      id: 's1',
      pupil: { firstName: 'Léa', lastName: 'Martin' },
      subject: 'maths',
      domains: [{ domain: 'calcul', correct: 3, total: 4 }],
    });
  });

  it('écarte une séance abîmée plutôt que de casser les graphiques', () => {
    const [classe] = mapClasses(raw);
    expect(classe.sessions.map((s) => s.id)).not.toContain('s-abimee');
  });

  it('retrouve l\'identifiant d\'un élève, même sans séance', () => {
    const [classe] = mapClasses(raw);
    expect(pupilIdFor(classe, 'Léa', 'Martin')).toBe('p1');
    expect(pupilIdFor(classe, 'Noé', 'Petit')).toBe('p2');
    expect(pupilIdFor(classe, 'Inconnu', '')).toBeNull();
  });

  it('rend une liste vide sur une réponse inattendue', () => {
    expect(mapClasses(null)).toEqual([]);
    expect(mapClasses({})).toEqual([]);
    expect(mapClasses([{ id: 3 }])).toEqual([]);
  });
});

describe('frenchAuthError', () => {
  it('traduit les messages de Supabase les plus courants', () => {
    expect(frenchAuthError('Invalid login credentials')).toBe('E-mail ou mot de passe incorrect.');
    expect(frenchAuthError('Email not confirmed')).toContain('confirmée');
    expect(frenchAuthError('User already registered')).toContain('existe déjà');
    expect(frenchAuthError('Password should be at least 8 characters')).toContain('8 caractères');
  });

  it('laisse passer un message qu\'il ne connaît pas', () => {
    expect(frenchAuthError('Something odd')).toBe('Something odd');
  });
});

describe('mapWorksheetIndex', () => {
  it('dit, séance par séance, si la feuille est corrigée', () => {
    expect(
      mapWorksheetIndex([
        { session_id: 's1', corrected_at: null },
        { session_id: 's2', corrected_at: '2026-10-05T18:00:00+00:00' },
        { session_id: 42, corrected_at: null },
        null,
      ])
    ).toEqual({
      s1: { correctedAt: null },
      s2: { correctedAt: '2026-10-05T18:00:00+00:00' },
    });
    expect(mapWorksheetIndex('rien')).toEqual({});
  });
});
