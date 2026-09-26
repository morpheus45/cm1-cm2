// Le chat de l'espace maîtresse : la maîtresse écrit, Claude l'aide à
// corriger ou adapter l'application pour sa classe — surtout ses problèmes de
// maths. Tout le reste est transmis à l'administrateur de l'application.
//
// Fonction Supabase (Edge Function, Deno), à déployer sous le nom
// « assistant-problemes ». Secret requis : ANTHROPIC_API_KEY (Edge Functions →
// Secrets). La clé ne quitte jamais le serveur : aucune tablette ne la voit.
//
// Ce que la fonction garantit, quoi que réponde Claude :
//  - seule une maîtresse connectée peut l'appeler (vérifiée ici même) ;
//  - un plafond de demandes par maîtresse et par jour borne la facture ;
//  - une demande hors du cadre n'est pas traitée : elle est rangée pour
//    l'administrateur, et la réponse le dit toujours à la maîtresse ;
//  - les problèmes proposés sont revérifiés ensuite par l'application, qui
//    refait chaque calcul avant de les laisser entrer dans la classe.

import Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const MODEL = 'claude-opus-5';
/** Demandes par maîtresse et par jour. Quelques centimes chacune. */
const DAILY_LIMIT = 40;
const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;
const MAX_PROBLEMS = 5;

const TRANSMIS =
  "Cette demande sort de ce que je peux faire ici : je l'ai transmise à l'administrateur de l'application, qui vous répondra.";
const NON_TRANSMIS =
  "Cette demande sort de ce que je peux faire ici, et elle n'a pas pu être transmise à l'administrateur : réessayez dans un moment.";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function erreur(status: number, code: string, message: string): Response {
  return json(status, { erreur: code, message });
}

type Niveau = 'CM1' | 'CM2';

function systemPrompt(niveau: Niveau): string {
  return `Tu es l'assistant de l'espace maîtresse de l'application « École Arc-en-Ciel », un cahier d'exercices de français et de maths pour des élèves de ${niveau}, conforme aux programmes de l'Éducation nationale (cycle 3). Tu parles à la maîtresse d'une classe de ${niveau}.

L'application propose aux élèves des séances d'une seule matière : questions de conjugaison, d'accords, d'orthographe, de numération, de calcul et de problèmes ; des opérations posées à la main, que la maîtresse corrige au stylet ; une révision ciblée sur les notions fragiles. La maîtresse y suit chaque élève (niveaux de maîtrise, graphiques, attendus de fin d'année) et y ajoute ses propres problèmes de maths pour la classe.

Ton rôle se limite à aider la maîtresse à corriger ou adapter l'utilisation de l'application pour sa classe : créer, corriger ou adapter des problèmes de maths pour ses élèves, et répondre à ses questions sur l'utilisation de l'application.

Toute autre demande sort de ton rôle, même si elle paraît simple : un autre sujet, une autre application, un changement du fonctionnement ou de l'apparence de l'application, des données sur les élèves, un conseil sans rapport avec l'application. Dans ce cas, ne la traite pas : mets "hors_champ" à true, résume la demande en une phrase dans "demande_administrateur", et laisse "problemes" vide. Dans "message", dis seulement, en une phrase, que tu ne peux pas t'en charger ici ; l'application ajoute elle-même que la demande est transmise à l'administrateur.

Les problèmes que tu proposes (${MAX_PROBLEMS} au plus par réponse) :
- "enonce" : clair, en français, adapté à des élèves de ${niveau}, tiré de la vie courante ; aucune marque, aucun nom de personne réelle ;
- "calcul" : une seule expression arithmétique qui donne la réponse : des nombres, + − × ÷ et des parenthèses, la virgule pour les décimaux, aucun espace dans les nombres ;
- "reponse" : le résultat exact, un nombre positif avec deux décimales au plus, écrit avec une virgule ; l'application refait le calcul et refuse toute différence ;
- "unite" : l'unité courte (« € », « cm », « billes ») ou une chaîne vide ;
- "fausses_reponses" : trois erreurs typiques d'élève (mauvaise opération, étape oubliée, erreur de retenue ou de rang), toutes différentes de la réponse ;
- "trimestre" : 1, 2 ou 3, le moment de l'année où la notion est travaillée en ${niveau}.
Pour corriger ou adapter un problème existant, renvoie sa nouvelle version complète dans "problemes".

Réponds en français. Dans "message", deux ou trois phrases au plus, sans mise en forme.`;
}

const SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    hors_champ: { type: 'boolean' },
    demande_administrateur: { type: 'string' },
    problemes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          enonce: { type: 'string' },
          calcul: { type: 'string' },
          reponse: { type: 'string' },
          unite: { type: 'string' },
          fausses_reponses: { type: 'array', items: { type: 'string' } },
          trimestre: { type: 'integer', enum: [1, 2, 3] },
        },
        required: ['enonce', 'calcul', 'reponse', 'unite', 'fausses_reponses', 'trimestre'],
        additionalProperties: false,
      },
    },
  },
  required: ['message', 'hors_champ', 'demande_administrateur', 'problemes'],
  additionalProperties: false,
};

interface Proposition {
  enonce: string;
  calcul: string;
  reponse: string;
  unite: string;
  fausses_reponses: string[];
  trimestre: number;
}

interface Reponse {
  message: string;
  hors_champ: boolean;
  demande_administrateur: string;
  problemes: Proposition[];
}

/** La conversation envoyée par la page : alternée, commençant et finissant
 *  par la maîtresse, bornée en longueur. */
function lireMessages(raw: unknown): Anthropic.Beta.Messages.BetaMessageParam[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [];
  for (const [index, entry] of raw.entries()) {
    const role = (entry as { role?: unknown })?.role;
    const content = (entry as { content?: unknown })?.content;
    const expected = index % 2 === 0 ? 'user' : 'assistant';
    if (role !== expected || typeof content !== 'string') return null;
    const text = content.trim();
    if (text === '' || text.length > MAX_CHARS) return null;
    messages.push({ role: expected, content: text });
  }
  return messages[messages.length - 1].role === 'user' ? messages : null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** La réponse de Claude, revérifiée champ par champ. */
function lireReponse(text: string): Reponse | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const value = parsed as Record<string, unknown> | null;
  if (
    !value ||
    !isString(value.message) ||
    typeof value.hors_champ !== 'boolean' ||
    !isString(value.demande_administrateur) ||
    !Array.isArray(value.problemes)
  ) {
    return null;
  }
  const problemes = value.problemes.flatMap((entry): Proposition[] => {
    const p = entry as Record<string, unknown> | null;
    if (
      !p ||
      !isString(p.enonce) ||
      !isString(p.calcul) ||
      !isString(p.reponse) ||
      !isString(p.unite) ||
      !Array.isArray(p.fausses_reponses) ||
      ![1, 2, 3].includes(p.trimestre as number)
    ) {
      return [];
    }
    return [
      {
        enonce: p.enonce,
        calcul: p.calcul,
        reponse: p.reponse,
        unite: p.unite,
        fausses_reponses: p.fausses_reponses.filter(isString).slice(0, 5),
        trimestre: p.trimestre as number,
      },
    ];
  });
  return {
    message: value.message,
    hors_champ: value.hors_champ,
    demande_administrateur: value.demande_administrateur,
    problemes: problemes.slice(0, MAX_PROBLEMS),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return erreur(405, 'methode', 'Seule une demande POST est acceptée.');

  // 1. Une maîtresse connectée, et personne d'autre.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const apikey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const url = Deno.env.get('SUPABASE_URL');
  if (!url || !token || !apikey) {
    return erreur(401, 'connexion', 'Connectez-vous pour discuter avec Claude.');
  }
  const supabase = createClient(url, apikey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return erreur(401, 'connexion', 'Votre connexion a expiré : reconnectez-vous.');
  }

  // 2. La conversation.
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return erreur(400, 'requete', "La demande n'a pas pu être lue.");
  }
  const niveau: Niveau | null = body?.niveau === 'CM1' || body?.niveau === 'CM2' ? body.niveau : null;
  const messages = lireMessages(body?.messages);
  if (!niveau || !messages) return erreur(400, 'requete', "La conversation n'a pas pu être lue.");

  // 3. Le plafond du jour, compté par la base.
  const { data: count, error: countError } = await supabase.rpc('compter_demande_assistant');
  if (countError) {
    console.error('compteur', countError.message);
    return erreur(500, 'base', "Le compteur du chat est introuvable : le fichier 002 a-t-il été exécuté dans Supabase ?");
  }
  if (typeof count === 'number' && count > DAILY_LIMIT) {
    return erreur(429, 'plafond', `Vous avez posé ${DAILY_LIMIT} questions à Claude aujourd'hui : c'est le plafond du jour. À demain !`);
  }

  // 4. Claude.
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return erreur(503, 'cle-manquante', "La clé de Claude n'est pas encore installée dans Supabase.");
  }
  const anthropic = new Anthropic({ apiKey });
  let response: Anthropic.Beta.Messages.BetaMessage;
  try {
    response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Si les filtres de sécurité de Claude refusent une demande par erreur,
      // Anthropic la reprend avec le modèle de repli qu'il recommande.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: systemPrompt(niveau),
      // Réflexion adaptative (par défaut) à effort moyen : des problèmes
      // justes sans faire attendre la maîtresse.
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      messages,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return erreur(503, 'cle-refusee', "La clé de Claude installée dans Supabase est refusée : elle doit être remplacée.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      return erreur(429, 'occupe', 'Claude est très demandé en ce moment : réessayez dans une minute.');
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return erreur(503, 'injoignable', "Claude est injoignable pour l'instant : réessayez dans un moment.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error('claude', error.status, error.message);
      return erreur(502, 'indisponible', "Claude n'a pas pu répondre : réessayez dans un moment.");
    }
    throw error;
  }

  if (response.stop_reason === 'refusal') {
    return json(200, {
      message: "Je ne peux pas répondre à cette demande. Reformulez-la en lien avec les exercices de la classe.",
      problemes: [],
      horsChamp: false,
      transmis: false,
      assistant: null,
    });
  }
  if (response.stop_reason === 'max_tokens') {
    return erreur(502, 'trop-long', 'La réponse de Claude était trop longue : demandez moins de problèmes à la fois.');
  }
  const text = [...response.content].reverse().find((block) => block.type === 'text');
  const reponse = text && text.type === 'text' ? lireReponse(text.text) : null;
  if (!reponse) return erreur(502, 'illisible', "La réponse de Claude n'a pas pu être lue : réessayez.");

  // 5. Hors du cadre : rangée pour l'administrateur, et la réponse le dit.
  if (reponse.hors_champ) {
    const derniere = messages[messages.length - 1].content as string;
    const { error: sendError } = await supabase.rpc('transmettre_a_l_administrateur', {
      p_demande: derniere,
      p_resume: reponse.demande_administrateur,
    });
    if (sendError) console.error('transmission', sendError.message);
    const intro = reponse.message.trim();
    return json(200, {
      message: `${intro ? `${intro}\n\n` : ''}${sendError ? NON_TRANSMIS : TRANSMIS}`,
      problemes: [],
      horsChamp: true,
      transmis: !sendError,
      assistant: text!.type === 'text' ? text!.text : null,
    });
  }

  return json(200, {
    message: reponse.message.trim(),
    problemes: reponse.problemes,
    horsChamp: false,
    transmis: false,
    assistant: text!.type === 'text' ? text!.text : null,
  });
});
