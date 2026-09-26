import type { Level, Trimester } from '../types';
import { cloudClient } from './cloud';
import { parseResults, type SessionResult } from './results';

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

export type { Trimester };
