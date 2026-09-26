import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionResult } from './results';
import { roundStroke, type Worksheet } from './worksheet';
import { parseClassProblems, type ClassProblem } from './classProblems';
import { isSecretKey } from './publicKey';

/**
 * La mise en commun avec la maîtresse, par Supabase.
 *
 * Tout ici est facultatif : sans adresse ni clé, l'application fonctionne
 * exactement comme avant, tout sur l'appareil. Et quand elles sont là, un
 * envoi raté ne perd jamais une séance : elle attend dans une file et repart
 * au lancement suivant.
 */

export interface CloudConfig {
  url: string;
  publishableKey: string;
}

export function readCloudConfig(env: Record<string, string | undefined>): CloudConfig | null {
  const url = (env.VITE_SUPABASE_URL ?? '').trim();
  const publishableKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  if (!url || !publishableKey) return null;
  // Jamais une clé secrète dans une page web : quiconque ouvre le site la
  // lirait, et elle contourne toutes les règles d'accès de la base. Le build
  // refuse déjà de publier dans ce cas ; ceci ne sert que de second verrou.
  if (isSecretKey(publishableKey)) return null;
  return { url, publishableKey };
}

/** La mise en commun est-elle configurée ? Ne charge rien : sert à décider
 *  d'afficher, ou non, le champ du code de classe. */
export function isCloudConfigured(): boolean {
  return readCloudConfig(import.meta.env as Record<string, string | undefined>) !== null;
}

let client: Promise<SupabaseClient | null> | null = null;

/**
 * La bibliothèque de Supabase double le poids de l'application : elle n'est
 * chargée qu'au premier envoi, et jamais sur un appareil où la mise en commun
 * n'est pas configurée.
 */
export function cloudClient(): Promise<SupabaseClient | null> {
  if (client) return client;
  const config = readCloudConfig(import.meta.env as Record<string, string | undefined>);
  if (!config) return Promise.resolve(null);
  client = import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(config.url, config.publishableKey)
  );
  return client;
}

/** Un code de classe : six lettres ou chiffres, sans ambiguïté de casse. */
export function normaliseJoinCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function isValidJoinCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

export function worksheetPayload(worksheet: Worksheet) {
  return {
    operations: worksheet.operations,
    answers: Object.fromEntries(
      Object.entries(worksheet.answers).map(([id, answer]) => [
        id,
        {
          given: answer.given,
          strokes: answer.strokes.map(roundStroke),
        },
      ])
    ),
  };
}

/**
 * Les paramètres de `depose_seance`, dans le fichier SQL. Leurs noms doivent
 * correspondre exactement à ceux de la fonction : un test les compare au
 * fichier, parce qu'une faute de frappe ici ne se verrait qu'une fois
 * l'application en ligne, par des séances qui n'arrivent jamais.
 */
export function depositParams(session: SessionResult, joinCode: string, worksheet?: Worksheet) {
  return {
    p_session_id: session.id,
    p_join_code: normaliseJoinCode(joinCode),
    p_first_name: session.pupil.firstName,
    p_last_name: session.pupil.lastName,
    p_level: session.level,
    p_trimester: session.trimester,
    p_subject: session.subject,
    p_activity: session.activity,
    p_results: session.domains,
    p_worksheet: worksheet ? worksheetPayload(worksheet) : null,
  };
}

export type DepositParams = ReturnType<typeof depositParams>;

// --- La file d'envoi --------------------------------------------------------

const OUTBOX_KEY = 'exercices-cm1-cm2:envois-en-attente';

/** Au-delà, les plus anciens envois sont abandonnés : une tablette restée
 *  hors ligne tout un trimestre ne doit pas saturer son stockage. */
const MAX_PENDING = 200;

export function parseOutbox(raw: string | null): DepositParams[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DepositParams =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as DepositParams).p_session_id === 'string' &&
        typeof (item as DepositParams).p_join_code === 'string'
    );
  } catch {
    return [];
  }
}

function readOutbox(): DepositParams[] {
  try {
    return parseOutbox(localStorage.getItem(OUTBOX_KEY));
  } catch {
    return [];
  }
}

function writeOutbox(items: DepositParams[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-MAX_PENDING)));
  } catch {
    // Stockage refusé : l'envoi sera simplement tenté une seule fois.
  }
}

export function enqueueDeposit(params: DepositParams): void {
  const pending = readOutbox().filter((item) => item.p_session_id !== params.p_session_id);
  writeOutbox([...pending, params]);
}

export function pendingDepositCount(): number {
  return readOutbox().length;
}

export type DepositOutcome = 'sent' | 'queued' | 'rejected' | 'disabled';

/**
 * Tente d'envoyer tout ce qui attend.
 *
 * Seul un code de classe inconnu fait sortir un envoi de la file : le renvoyer
 * n'y changerait rien, c'est à l'enfant de corriger son code. Tout autre échec
 * — réseau absent, mais aussi erreur de la base — laisse la séance en attente.
 * Une première version jetait aussi les erreurs de la base : quand la base a
 * refusé la révision ciblée, que son schéma ne connaissait pas encore, les
 * séances auraient été perdues au lieu de partir une fois le schéma corrigé.
 * Renvoyer est sans danger : la base ignore une séance déjà reçue.
 */
export async function flushOutbox(
  send: (params: DepositParams) => Promise<{ error: { message: string; code?: string } | null }>
): Promise<Record<string, DepositOutcome>> {
  const outcomes: Record<string, DepositOutcome> = {};
  const remaining: DepositParams[] = [];
  for (const params of readOutbox()) {
    try {
      const { error } = await send(params);
      if (!error) {
        outcomes[params.p_session_id] = 'sent';
      } else if (isUnknownClassCode(error)) {
        outcomes[params.p_session_id] = 'rejected';
      } else {
        outcomes[params.p_session_id] = 'queued';
        remaining.push(params);
      }
    } catch {
      outcomes[params.p_session_id] = 'queued';
      remaining.push(params);
    }
  }
  writeOutbox(remaining);
  return outcomes;
}

/** Le seul refus définitif : la classe n'existe pas. Le message vient de la
 *  fonction `depose_seance`. */
export function isUnknownClassCode(error: { message: string; code?: string }): boolean {
  return /code de classe inconnu/i.test(error.message);
}

export async function sendDeposit(params: DepositParams) {
  const supabase = await cloudClient();
  if (!supabase) return { error: { message: 'non configuré', code: 'disabled' } };
  const { error } = await supabase.rpc('depose_seance', params);
  return { error: error ? { message: error.message, code: error.code } : null };
}

/** Enregistre la séance pour la maîtresse : file d'attente, puis envoi de tout
 *  ce qui attendait, y compris celle-ci. */
export async function depositSession(
  session: SessionResult,
  joinCode: string,
  worksheet?: Worksheet
): Promise<DepositOutcome> {
  if (!isCloudConfigured() || !isValidJoinCode(normaliseJoinCode(joinCode))) return 'disabled';
  enqueueDeposit(depositParams(session, joinCode, worksheet));
  const outcomes = await flushOutbox(sendDeposit);
  return outcomes[session.id] ?? 'queued';
}

// --- Les problèmes de la classe, sur la tablette de l'élève ------------------

const CLASS_PROBLEMS_KEY = 'exercices-cm1-cm2:problemes-de-la-classe';

/** Les problèmes de la maîtresse gardés sur la tablette : ceux de la classe
 *  dont le code est donné, et d'aucune autre. Hors connexion, ce sont eux
 *  qui servent. */
export function cachedClassProblems(joinCode: string): ClassProblem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(CLASS_PROBLEMS_KEY) ?? 'null') as {
      joinCode?: unknown;
      problems?: unknown;
    } | null;
    if (!stored || stored.joinCode !== normaliseJoinCode(joinCode)) return [];
    return parseClassProblems(stored.problems);
  } catch {
    return [];
  }
}

/** Va chercher les problèmes en service de la classe et les garde sur la
 *  tablette. Sans réseau, ou sans code, rien ne change. */
export async function refreshClassProblems(joinCode: string): Promise<ClassProblem[] | null> {
  const code = normaliseJoinCode(joinCode);
  if (!isValidJoinCode(code)) return null;
  const supabase = await cloudClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('problemes_de_la_classe', { p_join_code: code });
  if (error) return null;
  const problems = parseClassProblems(data);
  try {
    localStorage.setItem(CLASS_PROBLEMS_KEY, JSON.stringify({ joinCode: code, problems }));
  } catch {
    // Stockage refusé : les problèmes serviront pour cette fois seulement.
  }
  return problems;
}

