import type { Level } from '../types';
import { cloudClient } from './cloud';
import type { ProblemProposal } from './classProblems';

/**
 * Le chat de l'espace maîtresse, côté page. Tout passe par la fonction
 * Supabase « assistant-problemes », qui tient la clé de Claude : la page ne
 * parle jamais à Claude directement.
 */

/** Un tour de la conversation, tel que la fonction l'attend. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantReply {
  message: string;
  problemes: ProblemProposal[];
  /** La demande sortait du cadre : elle a été transmise à l'administrateur. */
  horsChamp: boolean;
  transmis: boolean;
  /** La réponse brute de Claude, à renvoyer telle quelle au tour suivant.
   *  `null` quand Claude a refusé : ce tour-là ne se garde pas. */
  assistant: string | null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function parseAssistantReply(raw: unknown): AssistantReply | null {
  const value = raw as Record<string, unknown> | null;
  if (!value || !isString(value.message) || !Array.isArray(value.problemes)) return null;
  const problemes = value.problemes.flatMap((entry): ProblemProposal[] => {
    const p = entry as Record<string, unknown> | null;
    if (
      !p ||
      !isString(p.enonce) ||
      !isString(p.calcul) ||
      !isString(p.reponse) ||
      !isString(p.unite) ||
      !Array.isArray(p.fausses_reponses) ||
      typeof p.trimestre !== 'number'
    ) {
      return [];
    }
    return [
      {
        enonce: p.enonce,
        calcul: p.calcul,
        reponse: p.reponse,
        unite: p.unite,
        fausses_reponses: p.fausses_reponses.filter(isString),
        trimestre: p.trimestre,
      },
    ];
  });
  return {
    message: value.message,
    problemes,
    horsChamp: value.horsChamp === true,
    transmis: value.transmis === true,
    assistant: isString(value.assistant) ? value.assistant : null,
  };
}

/** Ce que Supabase rend quand la fonction n'a pas répondu normalement, dit
 *  en français — et, quand c'est une erreur de la fonction elle-même, son
 *  message tel quel. */
export async function assistantErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    let payload: unknown = null;
    try {
      payload = await context.clone().json();
    } catch {
      // Corps vide ou illisible : on s'en tient au statut.
    }
    const { erreur, message } = (payload ?? {}) as { erreur?: unknown; message?: unknown };
    if (isString(erreur) && isString(message)) return message;
    if (context.status === 404) return "Le chat avec Claude n'est pas encore installé dans Supabase.";
    if (context.status === 401) {
      return 'Supabase a refusé la connexion au chat. Reconnectez-vous ; si cela continue, le réglage « Verify JWT » de la fonction doit être désactivé.';
    }
    return "Claude n'a pas pu répondre : réessayez dans un moment.";
  }
  return 'Pas de réseau pour le moment : le chat a besoin d’une connexion.';
}

export async function askAssistant(niveau: Level, turns: ChatTurn[]): Promise<AssistantReply> {
  const supabase = await cloudClient();
  if (!supabase) throw new Error('La mise en commun n’est pas configurée.');
  const { data, error } = await supabase.functions.invoke('assistant-problemes', {
    body: { niveau, messages: turns },
  });
  if (error) throw new Error(await assistantErrorMessage(error));
  const reply = parseAssistantReply(data);
  if (!reply) throw new Error("La réponse de Claude n'a pas pu être lue : réessayez.");
  return reply;
}

/**
 * La conversation après une réponse : la question et la réponse brute s'y
 * ajoutent. Une réponse sans contenu réutilisable (un refus) n'y entre pas,
 * la question non plus : la suite repart proprement, en alternance.
 */
export function withReply(turns: ChatTurn[], question: string, reply: AssistantReply): ChatTurn[] {
  if (reply.assistant === null) return turns;
  return [...turns, { role: 'user', content: question }, { role: 'assistant', content: reply.assistant }];
}

/** Le texte proposé dans la zone de saisie pour reprendre un problème. */
export function modificationRequest(problem: { enonce: string; reponse: string; unite: string }): string {
  const unit = problem.unite ? ` ${problem.unite}` : '';
  return `Modifie ce problème : « ${problem.enonce} » (réponse : ${problem.reponse}${unit}). `;
}
