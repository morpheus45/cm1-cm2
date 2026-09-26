import { ALL_SUBJECTS, ALL_TRIMESTERS, SUBJECT_ACTIVITIES, SUBJECT_DOMAINS, subjectOf } from '../types';
import type { Activity, Domain, Level, Subject, Trimester } from '../types';

export interface Preferences {
  name: string;
  lastName: string;
  level: Level;
  trimester: Trimester;
  subject: Subject;
  domains: Domain[];
  activity: Activity;
  /** Le code donné par la maîtresse. Vide : rien ne quitte l'appareil. */
  joinCode: string;
}

const STORAGE_KEY = 'exercices-cm1-cm2:preferences';

export const DEFAULT_PREFERENCES: Preferences = {
  name: '',
  lastName: '',
  level: 'CM1',
  trimester: 1,
  subject: 'francais',
  domains: [...SUBJECT_DOMAINS.francais],
  activity: 'questions',
  joinCode: '',
};

/**
 * Relit ce qui a été enregistré la fois précédente, en se méfiant de tout :
 * le contenu vient du navigateur de l'élève, il peut avoir été écrit par une
 * version plus ancienne de l'application, ou abîmé. Chaque champ non
 * reconnu retombe sur sa valeur par défaut plutôt que de faire planter
 * l'écran d'accueil.
 */
export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return { ...DEFAULT_PREFERENCES, domains: [...DEFAULT_PREFERENCES.domains] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_PREFERENCES, domains: [...DEFAULT_PREFERENCES.domains] };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ...DEFAULT_PREFERENCES, domains: [...DEFAULT_PREFERENCES.domains] };
  }
  const stored = parsed as Record<string, unknown>;

  const name = typeof stored.name === 'string' ? stored.name.slice(0, 40) : DEFAULT_PREFERENCES.name;
  const lastName =
    typeof stored.lastName === 'string' ? stored.lastName.slice(0, 40) : DEFAULT_PREFERENCES.lastName;
  const level: Level = stored.level === 'CM2' ? 'CM2' : 'CM1';
  const trimester = ALL_TRIMESTERS.includes(stored.trimester as Trimester)
    ? (stored.trimester as Trimester)
    : DEFAULT_PREFERENCES.trimester;
  const subject = ALL_SUBJECTS.includes(stored.subject as Subject)
    ? (stored.subject as Subject)
    : DEFAULT_PREFERENCES.subject;

  // Les notions doivent appartenir à la matière enregistrée : une sélection
  // écrite par une version antérieure, où les six notions cohabitaient,
  // rouvrirait sinon une séance à cheval sur le français et les maths.
  const candidates = Array.isArray(stored.domains) ? stored.domains : [];
  const domains = SUBJECT_DOMAINS[subject].filter(
    (domain) => candidates.includes(domain) && subjectOf(domain) === subject
  );

  // Poser une opération n'existe pas en français : une activité enregistrée
  // pour les maths ne doit pas resurgir quand la matière relue est le français.
  const allowed = SUBJECT_ACTIVITIES[subject];
  const activity = allowed.includes(stored.activity as Activity)
    ? (stored.activity as Activity)
    : allowed[0];

  return {
    name,
    lastName,
    level,
    trimester,
    subject,
    domains: domains.length > 0 ? domains : [...SUBJECT_DOMAINS[subject]],
    activity,
    joinCode:
      typeof stored.joinCode === 'string'
        ? stored.joinCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
        : '',
  };
}

export function loadPreferences(): Preferences {
  try {
    return parsePreferences(localStorage.getItem(STORAGE_KEY));
  } catch {
    // Navigation privée, stockage refusé : on repart des valeurs par défaut.
    return { ...DEFAULT_PREFERENCES, domains: [...DEFAULT_PREFERENCES.domains] };
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ne rien retenir vaut mieux qu'empêcher l'élève de commencer.
  }
}
