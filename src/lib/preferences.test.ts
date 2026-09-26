import { describe, expect, it } from 'vitest';
import { parsePreferences, DEFAULT_PREFERENCES } from './preferences';
import { SUBJECT_DOMAINS, subjectOf } from '../types';

describe('parsePreferences', () => {
  it('repart des valeurs par défaut quand rien n\'a été enregistré', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it('relit une sélection valide telle quelle', () => {
    const stored = JSON.stringify({
      name: 'Nolhan',
      lastName: 'Martin',
      level: 'CM2',
      trimester: 3,
      subject: 'maths',
      domains: ['calcul', 'problemes'],
    });
    expect(parsePreferences(stored)).toEqual({
      name: 'Nolhan',
      lastName: 'Martin',
      level: 'CM2',
      trimester: 3,
      subject: 'maths',
      domains: ['calcul', 'problemes'],
      activity: 'questions',
    });
  });

  it('remet les notions dans l\'ordre de la matière', () => {
    const stored = JSON.stringify({ subject: 'maths', domains: ['problemes', 'numeration'] });
    expect(parsePreferences(stored).domains).toEqual(['numeration', 'problemes']);
  });

  it('ne fait pas planter l\'accueil sur un contenu abîmé', () => {
    expect(parsePreferences('pas du json')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('null')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('[]')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('"texte"')).toEqual(DEFAULT_PREFERENCES);
  });

  it('ignore les valeurs qu\'elle ne reconnaît pas', () => {
    const stored = JSON.stringify({ name: 42, level: 'CE2', trimester: 7, subject: 'histoire' });
    expect(parsePreferences(stored)).toEqual(DEFAULT_PREFERENCES);
  });

  it('ne laisse jamais ressortir une sélection à cheval sur les deux matières', () => {
    // Ce que pouvait écrire une version antérieure de l'application.
    const stored = JSON.stringify({
      subject: 'francais',
      domains: ['conjugaison', 'calcul', 'problemes'],
    });
    const { subject, domains } = parsePreferences(stored);
    expect(domains).toEqual(['conjugaison']);
    domains.forEach((domain) => expect(subjectOf(domain)).toBe(subject));
  });

  it('retombe sur toute la matière si aucune notion n\'est exploitable', () => {
    const stored = JSON.stringify({ subject: 'maths', domains: ['conjugaison'] });
    expect(parsePreferences(stored).domains).toEqual(SUBJECT_DOMAINS.maths);
  });

  it('relit le type de séance', () => {
    const stored = JSON.stringify({ subject: 'maths', activity: 'posees' });
    expect(parsePreferences(stored).activity).toBe('posees');
  });

  it('ne fait pas poser des opérations en français', () => {
    // Ce que le stockage contient après une séance de maths posées, si
    // l'enfant revient ensuite au français.
    const stored = JSON.stringify({ subject: 'francais', activity: 'posees' });
    expect(parsePreferences(stored).activity).toBe('questions');
  });

  it('ignore un type de séance inconnu', () => {
    const stored = JSON.stringify({ subject: 'maths', activity: 'dictee' });
    expect(parsePreferences(stored).activity).toBe('questions');
  });

  it('borne la longueur du prénom et du nom', () => {
    const stored = JSON.stringify({ name: 'a'.repeat(200), lastName: 'b'.repeat(200) });
    expect(parsePreferences(stored).name).toHaveLength(40);
    expect(parsePreferences(stored).lastName).toHaveLength(40);
  });
});
