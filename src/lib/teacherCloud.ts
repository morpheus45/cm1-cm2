import { pupilLabel, type Level, type Trimester } from '../types';
import { cloudClient } from './cloud';
import { worksheetFromRow, type Corrections } from './correction';
import { parseClassProblems, proposalToRow, type ClassProblem, type ProblemProposal } from './classProblems';
import { parseResults, type SessionResult } from './results';
import type { Worksheet } from './worksheet';

/** Une classe telle que la base la rend à sa maîtresse. */
export interface CloudClass {
  id: string;
  name: string;
  level: Level;
  joinCode: string;
  /** Les séances de tous ses élèves, au format de l'application. */
  sessions: SessionResult[];
  /** Pour pouvoir effacer le dossier d'un élève dans la base. */
  pupilIds: Record<string, string>;
}

interface RawSession {
  id: string;
  at: string;
  level: string;
  trimester: number;
  subject: string;
  activity: string;
  results: unknown;
}

interface RawPupil {
  id: string;
  first_name: string;
  last_name: string;
  sessions: RawSession[];
}

interface RawClass {
  id: string;
  name: string;
  level: string;
  join_code: string;
  pupils: RawPupil[];
}

/**
 * Traduit ce que rend `lire_ma_classe` dans le modèle de l'application. Chaque
 * séance repasse par la même vérification que les séances de l'appareil : une
 * ligne mal formée — déposée par une version ancienne, ou abîmée — est écartée
 * plutôt que de casser les graphiques.
 */
export function mapClasses(raw: unknown): CloudClass[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawClass[]).flatMap((entry) => {
    if (!entry || typeof entry.id !== 'string' || !Array.isArray(entry.pupils)) return [];
    const pupils = entry.pupils.filter((pupil) => pupil && typeof pupil.id === 'string');
    const candidates = pupils.flatMap((pupil) =>
      (Array.isArray(pupil.sessions) ? pupil.sessions : []).map((session) => ({
        id: session.id,
        pupil: { firstName: pupil.first_name ?? '', lastName: pupil.last_name ?? '' },
        at: session.at,
        level: session.level,
        trimester: session.trimester,
        subject: session.subject,
        activity: session.activity,
        domains: session.results,
      }))
    );
    // Dans la base, un élève n'a qu'une façon d'écrire son nom : celle de sa
    // première séance. Le nom suffit donc à retrouver son identifiant — y
    // compris pour un élève inscrit qui n'a encore rien fait.
    const pupilIds = Object.fromEntries(
      pupils.map((pupil) => [nameKey(pupil.first_name ?? '', pupil.last_name ?? ''), pupil.id])
    );
    return [
      {
        id: entry.id,
        name: entry.name,
        level: entry.level === 'CM2' ? 'CM2' : 'CM1',
        joinCode: entry.join_code,
        sessions: parseResults(JSON.stringify(candidates)),
        pupilIds,
      },
    ];
  });
}

function nameKey(firstName: string, lastName: string): string {
  return `${firstName}\u0000${lastName}`;
}

export function pupilIdFor(cloudClass: CloudClass, firstName: string, lastName: string): string | null {
  return cloudClass.pupilIds[nameKey(firstName, lastName)] ?? null;
}

export interface TeacherAccount {
  id: string;
  email: string;
}

async function client() {
  const supabase = await cloudClient();
  if (!supabase) throw new Error('La mise en commun n’est pas configurée.');
  return supabase;
}

/** Les messages de Supabase sont en anglais : on traduit les plus courants,
 *  pour qu'une maîtresse sache quoi faire. */
export function frenchAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou mot de passe incorrect.';
  if (/email not confirmed/i.test(message))
    return 'Adresse pas encore confirmée : ouvrez le lien reçu par e-mail.';
  if (/already registered|already exists/i.test(message))
    return 'Un compte existe déjà avec cette adresse : connectez-vous.';
  if (/password.*(short|least|characters)/i.test(message))
    return 'Mot de passe trop court : au moins 8 caractères.';
  if (/fetch|network/i.test(message)) return 'Pas de réseau pour le moment.';
  if (/schema cache|does not exist|could not find the (table|function)/i.test(message)) {
    return "Cette partie n'est pas encore installée dans Supabase : le fichier SQL qui l'accompagne doit y être exécuté.";
  }
  return message;
}

export async function currentTeacher(): Promise<TeacherAccount | null> {
  const supabase = await cloudClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return user ? { id: user.id, email: user.email ?? '' } : null;
}

export async function signIn(email: string, password: string): Promise<TeacherAccount> {
  const { data, error } = await (await client()).auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(frenchAuthError(error?.message ?? 'Connexion impossible.'));
  return { id: data.user.id, email: data.user.email ?? email };
}

/** Rend `null` quand Supabase demande de confirmer l'adresse avant tout. */
export async function signUp(email: string, password: string): Promise<TeacherAccount | null> {
  const { data, error } = await (await client()).auth.signUp({ email, password });
  if (error) throw new Error(frenchAuthError(error.message));
  if (!data.session || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? email };
}

export async function signOut(): Promise<void> {
  const supabase = await cloudClient();
  await supabase?.auth.signOut();
}

export async function readMyClasses(): Promise<CloudClass[]> {
  const { data, error } = await (await client()).rpc('lire_ma_classe');
  if (error) throw new Error(frenchAuthError(error.message));
  return mapClasses(data);
}

export async function createClass(name: string, level: Level): Promise<string> {
  const { data, error } = await (await client()).rpc('creer_classe', { p_name: name, p_level: level });
  if (error) throw new Error(frenchAuthError(error.message));
  const row = Array.isArray(data) ? data[0] : data;
  return (row as { join_code: string }).join_code;
}

/** Efface un élève et, en cascade, toutes ses séances. */
export async function deletePupil(pupilId: string): Promise<void> {
  const { error } = await (await client()).from('pupils').delete().eq('id', pupilId);
  if (error) throw new Error(frenchAuthError(error.message));
}

// --- Les feuilles d'opérations posées ---------------------------------------

/** Où en est une feuille : `correctedAt` reste `null` tant que la maîtresse
 *  ne l'a pas corrigée. */
export interface WorksheetStatus {
  correctedAt: string | null;
}

/** Séance par séance, l'état des feuilles. Les lignes illisibles sont
 *  ignorées. */
export function mapWorksheetIndex(rows: unknown): Record<string, WorksheetStatus> {
  if (!Array.isArray(rows)) return {};
  return Object.fromEntries(
    rows.flatMap((row) => {
      const entry = row as { session_id?: unknown; corrected_at?: unknown } | null;
      if (!entry || typeof entry.session_id !== 'string') return [];
      const correctedAt = typeof entry.corrected_at === 'string' ? entry.corrected_at : null;
      return [[entry.session_id, { correctedAt }]];
    })
  );
}

/**
 * Les colonnes de la table `worksheets` que l'accès maîtresse lit et écrit.
 * Un test les compare au fichier SQL : une faute de frappe ne se verrait
 * sinon qu'en ligne, par des feuilles introuvables.
 */
export const WORKSHEET_COLUMNS = {
  key: 'session_id',
  status: 'corrected_at',
  sheet: ['operations', 'answers', 'corrections'],
  correction: 'corrections',
} as const;

/** La base ne rend pas plus de mille lignes par demande : au-delà, on
 *  demande la suite. Une classe peut dépasser ce nombre en une année. */
const INDEX_PAGE = 1000;

/**
 * Les feuilles de la classe, sans leurs tracés — les seules colonnes utiles
 * pour savoir ce qui reste à corriger. Les tracés, bien plus lourds, ne sont
 * chargés qu'à l'ouverture d'une feuille. La RLS ne laisse voir que celles
 * des élèves de la maîtresse.
 */
export async function readWorksheetIndex(): Promise<Record<string, WorksheetStatus>> {
  const supabase = await client();
  const index: Record<string, WorksheetStatus> = {};
  for (let from = 0; ; from += INDEX_PAGE) {
    const { data, error } = await supabase
      .from('worksheets')
      .select(`${WORKSHEET_COLUMNS.key}, ${WORKSHEET_COLUMNS.status}`)
      .order(WORKSHEET_COLUMNS.key)
      .range(from, from + INDEX_PAGE - 1);
    if (error) throw new Error(frenchAuthError(error.message));
    Object.assign(index, mapWorksheetIndex(data));
    if (!Array.isArray(data) || data.length < INDEX_PAGE) return index;
  }
}

export async function readWorksheet(session: SessionResult): Promise<Worksheet> {
  const { data, error } = await (await client())
    .from('worksheets')
    .select(WORKSHEET_COLUMNS.sheet.join(', '))
    .eq(WORKSHEET_COLUMNS.key, session.id)
    .maybeSingle();
  if (error) throw new Error(frenchAuthError(error.message));
  const worksheet =
    data &&
    worksheetFromRow(data, {
      name: pupilLabel(session.pupil),
      level: session.level,
      trimester: session.trimester,
      createdAt: session.at,
    });
  if (!worksheet) throw new Error('Cette feuille est introuvable, ou illisible.');
  return worksheet;
}

/**
 * Enregistre la correction et rend sa date. Une feuille relue sans rien à
 * annoter est tout de même « corrigée » : la maîtresse l'a vue.
 *
 * La base ne signale pas d'erreur quand la RLS écarte la ligne : elle n'en
 * modifie simplement aucune. On le vérifie, pour ne jamais annoncer
 * « enregistré » à tort.
 */
export async function saveCorrection(sessionId: string, corrections: Corrections): Promise<string> {
  const correctedAt = new Date().toISOString();
  const { data, error } = await (await client())
    .from('worksheets')
    .update({ [WORKSHEET_COLUMNS.correction]: corrections, [WORKSHEET_COLUMNS.status]: correctedAt })
    .eq(WORKSHEET_COLUMNS.key, sessionId)
    .select(WORKSHEET_COLUMNS.key);
  if (error) throw new Error(frenchAuthError(error.message));
  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error('La correction n’a pas été enregistrée : cette feuille n’est plus dans votre classe.');
  }
  return correctedAt;
}

// --- Les problèmes de la classe ---------------------------------------------

/** Un problème tel que la maîtresse le gère : en service ou retiré. */
export interface ClassProblemEntry extends ClassProblem {
  calcul: string;
  actif: boolean;
}

/** Les colonnes de la table `problemes` que lit et écrit l'accès maîtresse —
 *  comparées au fichier SQL par un test. */
export const PROBLEM_COLUMNS = ['id', 'enonce', 'reponse', 'unite', 'calcul', 'fausses_reponses', 'trimestre', 'actif'] as const;

export function mapProblemRows(rows: unknown): ClassProblemEntry[] {
  if (!Array.isArray(rows)) return [];
  const extras = new Map(
    rows.map((row) => {
      const entry = row as { id?: unknown; calcul?: unknown; actif?: unknown } | null;
      return [entry?.id, { calcul: typeof entry?.calcul === 'string' ? entry.calcul : '', actif: entry?.actif !== false }];
    })
  );
  return parseClassProblems(rows).map((problem) => ({
    ...problem,
    ...(extras.get(problem.id) ?? { calcul: '', actif: true }),
  }));
}

export async function readClassProblems(classId: string): Promise<ClassProblemEntry[]> {
  const { data, error } = await (await client())
    .from('problemes')
    .select(PROBLEM_COLUMNS.join(', '))
    .eq('class_id', classId)
    .order('created_at');
  if (error) throw new Error(frenchAuthError(error.message));
  return mapProblemRows(data);
}

/** Ajoute un problème vérifié : un problème dont le calcul ne donne pas la
 *  réponse n'arrive même pas jusqu'à la base. */
export async function addClassProblem(classId: string, proposal: ProblemProposal): Promise<void> {
  const row = proposalToRow(proposal, classId);
  const { data, error } = await (await client()).from('problemes').insert(row).select('id');
  if (error) throw new Error(frenchAuthError(error.message));
  if (!Array.isArray(data) || data.length !== 1) throw new Error("Le problème n'a pas été ajouté à la classe.");
}

export async function setClassProblemActive(id: string, actif: boolean): Promise<void> {
  const { data, error } = await (await client()).from('problemes').update({ actif }).eq('id', id).select('id');
  if (error) throw new Error(frenchAuthError(error.message));
  if (!Array.isArray(data) || data.length !== 1) throw new Error("Ce problème n'est plus dans votre classe.");
}

export async function deleteClassProblem(id: string): Promise<void> {
  const { error } = await (await client()).from('problemes').delete().eq('id', id);
  if (error) throw new Error(frenchAuthError(error.message));
}

export type { Trimester };
