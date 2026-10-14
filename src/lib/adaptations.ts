/**
 * Les aides pour les élèves DYS.
 *
 * On coche un ou plusieurs troubles, chacun léger ou marqué ; l'application
 * en déduit des aides précises. Plusieurs troubles s'additionnent : on garde
 * l'aide la plus forte de chacun. Certaines associations, fréquentes, en
 * appellent d'autres (la dyslexie avec la dyscalculie : l'énoncé est lu à voix
 * haute, pour que la lecture ne bloque pas le calcul). Chaque aide reste
 * modifiable à la main, et chacune dit pourquoi elle est là.
 *
 * Ce sont des informations de santé : elles restent sur l'appareil, rangées
 * par élève (une tablette de classe sert à plusieurs enfants), et ne sont
 * jamais envoyées à la maîtresse ni à la base.
 */

export type Trouble = 'dyslexie' | 'dysorthographie' | 'dyscalculie' | 'dysgraphie' | 'dyspraxie' | 'dysphasie' | 'tdah';

export const TROUBLES: Trouble[] = ['dyslexie', 'dysorthographie', 'dyscalculie', 'dysgraphie', 'dyspraxie', 'dysphasie', 'tdah'];

export const TROUBLE_LABELS: Record<Trouble, string> = {
  dyslexie: 'Dyslexie',
  dysorthographie: 'Dysorthographie',
  dyscalculie: 'Dyscalculie',
  dysgraphie: 'Dysgraphie',
  dyspraxie: 'Dyspraxie',
  dysphasie: 'Dysphasie',
  tdah: 'TDA/H',
};

export const TROUBLE_HINTS: Record<Trouble, string> = {
  dyslexie: 'Lire demande beaucoup d\'effort : les lettres se mélangent, on lit lentement.',
  dysorthographie: 'L\'orthographe des mots est difficile à retenir et à reconnaître.',
  dyscalculie: 'Les nombres et les calculs sont difficiles à se représenter.',
  dysgraphie: 'Écrire à la main est lent, fatigant ou peu lisible.',
  dyspraxie: 'Les gestes précis et le repérage dans l\'espace sont difficiles.',
  dysphasie: 'Comprendre ou formuler le langage oral demande un gros effort.',
  tdah: 'Rester attentif longtemps est difficile, on agit parfois trop vite.',
};

/** 1 : léger. 2 : marqué. */
export type Degre = 1 | 2;

export type Taille = 'normal' | 'grand' | 'tres-grand';
export type Espacement = 'normal' | 'aere' | 'tres-aere';
export type Lecture = 'non' | 'bouton' | 'auto';

export interface Aides {
  /** La taille du texte des questions et des réponses. */
  texte: Taille;
  /** L'espace entre les lettres, les mots et les lignes. */
  espacement: Espacement;
  /** Un papier uni, sans lignes ni grain : moins de bruit visuel. */
  fondUni: boolean;
  /** La lecture de l'énoncé à voix haute : un bouton, ou dès qu'il s'affiche. */
  lecture: Lecture;
  /** Un bouton pour écouter chaque réponse proposée. */
  lireReponses: boolean;
  /** Trois réponses au lieu de quatre. */
  moinsDeChoix: boolean;
  /** Choisir, puis valider : une erreur d'un doigt trop rapide se rattrape. */
  validerEnDeuxTemps: boolean;
  /** Des séances de six questions au lieu de douze. */
  seanceCourte: boolean;
  /** Les chiffres d'un nombre colorés selon leur rang : unités, dizaines, centaines. */
  chiffresColores: boolean;
  /** Le brouillon proposé dans toutes les questions de maths. */
  brouillonPartout: boolean;
  /** Pas d'écriture à la main : les opérations posées au doigt sont retirées. */
  sansEcritureMain: boolean;
  /** Pas de points à placer sur un quadrillage : des questions à choix à la place. */
  sansConstructions: boolean;
  /** Des boutons plus grands et plus espacés. */
  grandesCibles: boolean;
}

export const AIDES_DE_BASE: Aides = {
  texte: 'normal',
  espacement: 'normal',
  fondUni: false,
  lecture: 'non',
  lireReponses: false,
  moinsDeChoix: false,
  validerEnDeuxTemps: false,
  seanceCourte: false,
  chiffresColores: false,
  brouillonPartout: false,
  sansEcritureMain: false,
  sansConstructions: false,
  grandesCibles: false,
};

export type Aide = keyof Aides;

export const AIDE_LABELS: Record<Aide, string> = {
  texte: 'Taille du texte',
  espacement: 'Espacement des lettres et des lignes',
  fondUni: 'Papier uni, sans lignes',
  lecture: 'Lecture de la question à voix haute',
  lireReponses: 'Écouter chaque réponse',
  moinsDeChoix: 'Trois réponses au lieu de quatre',
  validerEnDeuxTemps: 'Choisir, puis valider',
  seanceCourte: 'Séances courtes : six questions',
  chiffresColores: 'Chiffres colorés selon leur rang',
  brouillonPartout: 'Brouillon dans toutes les questions de maths',
  sansEcritureMain: 'Pas d\'écriture à la main',
  sansConstructions: 'Pas de points à placer sur un quadrillage',
  grandesCibles: 'Boutons plus grands',
};

export const TAILLE_LABELS: Record<Taille, string> = { normal: 'Normal', grand: 'Grand', 'tres-grand': 'Très grand' };
export const ESPACEMENT_LABELS: Record<Espacement, string> = { normal: 'Normal', aere: 'Aéré', 'tres-aere': 'Très aéré' };
export const LECTURE_LABELS: Record<Lecture, string> = { non: 'Non', bouton: 'Avec un bouton', auto: 'Automatique' };

const ORDRE_TAILLE: Taille[] = ['normal', 'grand', 'tres-grand'];
const ORDRE_ESPACEMENT: Espacement[] = ['normal', 'aere', 'tres-aere'];
const ORDRE_LECTURE: Lecture[] = ['non', 'bouton', 'auto'];

type Apport = Partial<Aides>;

/** Ce que chaque trouble demande, léger puis marqué (le marqué s'ajoute au léger). */
const APPORTS: Record<Trouble, Record<Degre, Apport>> = {
  dyslexie: {
    1: { texte: 'grand', espacement: 'aere', fondUni: true, lecture: 'bouton' },
    2: { texte: 'tres-grand', espacement: 'tres-aere', lecture: 'auto', lireReponses: true, moinsDeChoix: true },
  },
  dysorthographie: {
    1: { espacement: 'aere', lireReponses: true },
    2: { moinsDeChoix: true, lecture: 'bouton' },
  },
  dyscalculie: {
    1: { chiffresColores: true, brouillonPartout: true },
    2: { texte: 'grand', moinsDeChoix: true, lecture: 'bouton' },
  },
  dysgraphie: {
    1: { sansEcritureMain: true },
    2: { grandesCibles: true },
  },
  dyspraxie: {
    1: { grandesCibles: true, sansConstructions: true, sansEcritureMain: true, espacement: 'aere' },
    // Le repérage spatial des rangs (unités, dizaines, centaines) est souvent touché.
    2: { fondUni: true, texte: 'grand', chiffresColores: true },
  },
  dysphasie: {
    1: { lecture: 'bouton', lireReponses: true },
    // Une lecture automatique imposerait son débit : l'élève garde la main sur le bouton.
    2: { moinsDeChoix: true },
  },
  tdah: {
    1: { seanceCourte: true },
    2: { fondUni: true, moinsDeChoix: true, validerEnDeuxTemps: true },
  },
};

/** Les associations qui demandent plus que la somme de leurs troubles. */
interface Association {
  troubles: Trouble[];
  apport: Apport;
  pourquoi: string;
}

const ASSOCIATIONS: Association[] = [
  {
    troubles: ['dyslexie', 'dyscalculie'],
    apport: { lecture: 'auto' },
    pourquoi: 'Dyslexie et dyscalculie : l\'énoncé est lu, pour que la lecture ne bloque pas le calcul.',
  },
  {
    troubles: ['dyslexie', 'dysphasie'],
    apport: { lecture: 'auto', lireReponses: true },
    pourquoi: 'Dyslexie et dysphasie : tout est lu à voix haute, l\'écrit comme l\'oral sont coûteux.',
  },
  {
    troubles: ['tdah', 'dyslexie'],
    apport: { lecture: 'auto' },
    pourquoi: 'TDA/H et dyslexie : l\'attention n\'est pas épuisée à déchiffrer.',
  },
  {
    troubles: ['tdah', 'dyscalculie'],
    apport: { moinsDeChoix: true },
    pourquoi: 'TDA/H et dyscalculie : moins de nombres à comparer d\'un coup.',
  },
  {
    troubles: ['tdah', 'dyspraxie'],
    apport: { validerEnDeuxTemps: true },
    pourquoi: 'TDA/H et dyspraxie : un doigt rapide et peu précis touche parfois à côté, on valide avant de répondre.',
  },
  {
    troubles: ['dyspraxie', 'dyscalculie'],
    apport: { chiffresColores: true },
    pourquoi: 'Dyspraxie et dyscalculie : les couleurs aident à aligner les chiffres sans se perdre.',
  },
];

export const TROIS_TROUBLES_OU_PLUS = 'Trois troubles ou plus : la fatigue s\'additionne, les séances sont plus courtes.';

/** Le profil enregistré d'un élève : ses troubles, et ce qu'il a réglé lui-même. */
export interface Profil {
  troubles: Partial<Record<Trouble, Degre>>;
  reglages: Partial<Aides>;
}

export const PROFIL_VIDE: Profil = { troubles: {}, reglages: {} };

function plusFort<T>(ordre: T[], a: T, b: T): T {
  return ordre.indexOf(a) >= ordre.indexOf(b) ? a : b;
}

function ajouter(aides: Aides, apport: Apport): Aides {
  const suite = { ...aides };
  for (const [cle, valeur] of Object.entries(apport) as [Aide, Aides[Aide]][]) {
    if (cle === 'texte') suite.texte = plusFort(ORDRE_TAILLE, suite.texte, valeur as Taille);
    else if (cle === 'espacement') suite.espacement = plusFort(ORDRE_ESPACEMENT, suite.espacement, valeur as Espacement);
    else if (cle === 'lecture') suite.lecture = plusFort(ORDRE_LECTURE, suite.lecture, valeur as Lecture);
    else (suite[cle] as boolean) = (suite[cle] as boolean) || (valeur as boolean);
  }
  return suite;
}

/** Les aides qu'appellent les troubles cochés, avant les réglages de l'élève. */
export function aidesDesTroubles(troubles: Profil['troubles']): Aides {
  let aides = { ...AIDES_DE_BASE };
  for (const trouble of TROUBLES) {
    const degre = troubles[trouble];
    if (!degre) continue;
    aides = ajouter(aides, APPORTS[trouble][1]);
    if (degre === 2) aides = ajouter(aides, APPORTS[trouble][2]);
  }
  const coches = TROUBLES.filter((trouble) => troubles[trouble]);
  for (const association of ASSOCIATIONS) {
    if (association.troubles.every((trouble) => coches.includes(trouble))) aides = ajouter(aides, association.apport);
  }
  if (coches.length >= 3) aides = ajouter(aides, { seanceCourte: true });
  // Sans écriture à la main, le brouillon dessiné au doigt n'est pas imposé en maths : il reste là où il est indispensable.
  if (aides.sansEcritureMain) aides = { ...aides, brouillonPartout: false };
  return aides;
}

/** Les aides en service : celles des troubles, puis les réglages de l'élève, qui ont le dernier mot. */
export function aidesDuProfil(profil: Profil): Aides {
  return { ...aidesDesTroubles(profil.troubles), ...profil.reglages };
}

/** Pourquoi une aide est en service : les troubles et les associations qui l'appellent. */
export function raisons(troubles: Profil['troubles'], aide: Aide): string[] {
  if (aide === 'brouillonPartout' && aidesDesTroubles(troubles).sansEcritureMain) {
    return [TROUBLES.some((t) => troubles[t] && t === 'dyscalculie') ? 'Retiré : pas d\'écriture à la main' : ''].filter(Boolean);
  }
  const coches = TROUBLES.filter((trouble) => troubles[trouble]);
  const base = AIDES_DE_BASE[aide];
  const change = (apport: Apport) => aide in apport && apport[aide] !== base;
  const parTrouble = coches
    .filter((trouble) => change(APPORTS[trouble][1]) || (troubles[trouble] === 2 && change(APPORTS[trouble][2])))
    .map((trouble) => TROUBLE_LABELS[trouble]);
  const parAssociation = ASSOCIATIONS.filter(
    (association) => association.troubles.every((trouble) => coches.includes(trouble)) && change(association.apport)
  ).map((association) => association.pourquoi);
  const parNombre = aide === 'seanceCourte' && coches.length >= 3 ? [TROIS_TROUBLES_OU_PLUS] : [];
  return [...parTrouble, ...parAssociation, ...parNombre];
}

// --- Enregistrement, sur l'appareil seulement --------------------------------------------------------------

const STORAGE_KEY = 'exercices-cm1-cm2:aides';

const VALEURS: { [K in Aide]: readonly Aides[K][] } = {
  texte: ORDRE_TAILLE,
  espacement: ORDRE_ESPACEMENT,
  fondUni: [true, false],
  lecture: ORDRE_LECTURE,
  lireReponses: [true, false],
  moinsDeChoix: [true, false],
  validerEnDeuxTemps: [true, false],
  seanceCourte: [true, false],
  chiffresColores: [true, false],
  brouillonPartout: [true, false],
  sansEcritureMain: [true, false],
  sansConstructions: [true, false],
  grandesCibles: [true, false],
};

/** Un profil relu du navigateur : tout ce qui n'est pas reconnu est ignoré. */
export function parseProfil(value: unknown): Profil {
  if (typeof value !== 'object' || value === null) return { troubles: {}, reglages: {} };
  const raw = value as Record<string, unknown>;
  const troubles: Profil['troubles'] = {};
  const rawTroubles = (typeof raw.troubles === 'object' && raw.troubles !== null ? raw.troubles : {}) as Record<string, unknown>;
  for (const trouble of TROUBLES) {
    if (rawTroubles[trouble] === 1 || rawTroubles[trouble] === 2) troubles[trouble] = rawTroubles[trouble] as Degre;
  }
  const reglages: Partial<Aides> = {};
  const rawReglages = (typeof raw.reglages === 'object' && raw.reglages !== null ? raw.reglages : {}) as Record<string, unknown>;
  for (const aide of Object.keys(VALEURS) as Aide[]) {
    if ((VALEURS[aide] as readonly unknown[]).includes(rawReglages[aide])) (reglages as Record<Aide, unknown>)[aide] = rawReglages[aide];
  }
  return { troubles, reglages };
}

function lireTout(): Record<string, Profil> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return {};
    return Object.fromEntries(Object.entries(parsed).map(([eleve, profil]) => [eleve, parseProfil(profil)]));
  } catch {
    return {};
  }
}

/** Le profil d'un élève, rangé sous sa clé (pupilKey). */
export function loadProfil(eleve: string): Profil {
  return lireTout()[eleve] ?? { troubles: {}, reglages: {} };
}

export function saveProfil(eleve: string, profil: Profil): void {
  const tout = lireTout();
  if (Object.keys(profil.troubles).length === 0 && Object.keys(profil.reglages).length === 0) delete tout[eleve];
  else tout[eleve] = profil;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tout));
  } catch {
    // Stockage plein ou interdit : les aides restent en service pour cette visite.
  }
}

/** Retire les profils de tous les élèves de l'appareil (« Tout effacer » des familles). */
export function forgetAllProfils(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Rien à faire.
  }
}

export function forgetProfil(eleve: string): void {
  saveProfil(eleve, { troubles: {}, reglages: {} });
}

// --- Ce que les aides changent ------------------------------------------------------------------------------

/** Trois réponses au lieu de quatre : la bonne, et les deux premières mauvaises, dans leur ordre. */
export function reduireChoix<Q extends { choices: string[]; correctIndex: number }>(question: Q): Q {
  if (question.choices.length <= 3 || question.correctIndex < 0) return question;
  const wrong = question.choices.map((_, index) => index).filter((index) => index !== question.correctIndex).slice(0, 2);
  const kept = [question.correctIndex, ...wrong].sort((a, b) => a - b);
  return { ...question, choices: kept.map((index) => question.choices[index]), correctIndex: kept.indexOf(question.correctIndex) };
}

/** Le nombre de questions d'une séance. */
export const seanceDe = (aides: Aides, normal: number) => (aides.seanceCourte ? Math.min(6, normal) : normal);

/**
 * Les aides visuelles s'appliquent à toute la page, par des attributs sur
 * <html> que lit index.css : la taille du texte (tout est en rem, la mise en
 * page grandit avec), l'espacement, le papier uni, les grands boutons.
 */
export function appliquerAuDocument(aides: Aides): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  const poser = (nom: string, valeur: string | null) => (valeur === null ? html.removeAttribute(nom) : html.setAttribute(nom, valeur));
  poser('data-texte', aides.texte === 'normal' ? null : aides.texte);
  poser('data-espacement', aides.espacement === 'normal' ? null : aides.espacement);
  poser('data-fond-uni', aides.fondUni ? '' : null);
  poser('data-grandes-cibles', aides.grandesCibles ? '' : null);
}
