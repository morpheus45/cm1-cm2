// Le chat de l'espace maîtresse : la maîtresse écrit, l'assistant l'aide à
// corriger ou adapter l'application pour sa classe — surtout ses problèmes de
// maths. Tout le reste est transmis à l'administrateur de l'application.
//
// Fonction Supabase (Edge Function, Deno), à déployer sous le nom
// « assistant-problemes ». Le modèle tourne sur le PC de Cédric, derrière
// OmniRoute : la fonction dépose la question dans la table assistant_travaux
// (supabase/010_assistant_omniroute.sql), le relais du PC
// (tools/relais-assistant.py) y écrit la réponse. Aucune clé de modèle n'est
// installée dans Supabase, et le PC n'est pas joignable depuis internet.
//
// Ce que la fonction garantit, quoi que réponde le modèle :
//  - seule une maîtresse connectée peut l'appeler (vérifiée ici même) ;
//  - un plafond de demandes par maîtresse et par jour borne la facture ;
//  - une demande hors du cadre n'est pas traitée : elle est rangée pour
//    l'administrateur, et la réponse le dit toujours à la maîtresse ;
//  - les problèmes proposés sont revérifiés ensuite par l'application, qui
//    refait chaque calcul avant de les laisser entrer dans la classe.

import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

/** Le temps laissé au relais du PC pour répondre. */
const ATTENTE_MS = 110_000;
/** Demandes par maîtresse et par jour. Quelques centimes chacune. */
const DAILY_LIMIT = 40;
const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;
const MAX_PROBLEMS = 5;

const TRANSMIS =
  "Cette demande sort de ce que je peux faire ici : je l'ai transmise à Cédric, l'administrateur de l'application, qui vous répondra.";
const NON_TRANSMIS =
  "Cette demande sort de ce que je peux faire ici, et elle n'a pas pu être transmise à Cédric, l'administrateur de l'application : réessayez dans un moment.";

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

/** Les niveaux de l'application, du CE1 à la 3e. Cette fonction se colle telle
 *  quelle dans l'éditeur de Supabase : elle ne peut rien importer du site, et
 *  un test (tools/cloud-sql.test.ts) vérifie que sa liste est celle de
 *  src/types.ts. */
const NIVEAUX = ['CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'] as const;
type Niveau = (typeof NIVEAUX)[number];

/** Le cycle du programme de chaque niveau. */
const CYCLES: Record<Niveau, 2 | 3 | 4> = {
  CE1: 2,
  CE2: 2,
  CM1: 3,
  CM2: 3,
  '6e': 3,
  '5e': 4,
  '4e': 4,
  '3e': 4,
};

function lireNiveau(valeur: unknown): Niveau | null {
  return NIVEAUX.find((niveau) => niveau === valeur) ?? null;
}

/** Celui ou celle qui doit pouvoir lire l'énoncé seul. Le CM1 et le CM2 gardent
 *  la consigne d'origine ; les autres niveaux parlent d'un élève de leur classe. */
function lecteur(niveau: Niveau): string {
  return niveau === 'CM1' || niveau === 'CM2' ? 'un enfant de 8 ans' : `un élève de ${niveau}`;
}

function systemPrompt(niveau: Niveau): string {
  return `Tu es « Arcélie », l'assistante de l'espace maîtresse de l'application « École Arc-en-Ciel », un cahier d'exercices de toutes les matières (français, maths, histoire, géographie, anglais, sciences, EMC) pour des élèves de ${niveau}, conforme aux programmes de l'Éducation nationale (cycle ${CYCLES[niveau]}). Cédric est l'administrateur de l'application ; toi, tu es une intelligence artificielle : dis-le simplement si on te le demande, et ne te présente jamais comme Cédric ni comme une personne. Ne nomme ni le modèle d'intelligence artificielle ni l'entreprise qui le fournit ; si la maîtresse te le demande, réponds que tu es l'assistant de l'application, une intelligence artificielle mise à disposition par Cédric. Tu parles à la maîtresse d'une classe de ${niveau}.

L'application propose aux élèves des séances d'une seule matière : questions de français, de maths, d'histoire, de géographie, d'anglais (avec écoute et phrases à remettre dans l'ordre), de sciences et d'EMC ; des opérations posées à la main, que la maîtresse corrige au stylet ; une révision ciblée sur les notions fragiles. La maîtresse y suit chaque élève (niveaux de maîtrise, graphiques, attendus de fin d'année) et y ajoute ses propres problèmes de maths pour la classe.

Ton rôle se limite à aider la maîtresse à corriger ou adapter l'utilisation de l'application pour sa classe : créer, corriger ou adapter des problèmes de maths pour ses élèves, et répondre à ses questions sur l'utilisation de l'application.

Toute autre demande sort de ton rôle, même si elle paraît simple : un autre sujet, une autre application, un changement du fonctionnement ou de l'apparence de l'application, des données sur les élèves, un conseil sans rapport avec l'application. Dans ce cas, ne la traite pas : mets "hors_champ" à true, résume la demande en une phrase dans "demande_administrateur", et laisse "problemes" vide. Dans "message", dis seulement, en une phrase, que tu ne peux pas t'en charger ici ; l'application ajoute elle-même que la demande est transmise à l'administrateur.

Les problèmes que tu proposes (${MAX_PROBLEMS} au plus par réponse) :
- "enonce" : clair, en français, adapté à des élèves de ${niveau}, tiré de la vie courante ; des phrases courtes (vingt mots au plus) et des mots simples, qu'${lecteur(niveau)} lit seul ; aucune marque, aucun nom de personne réelle ;
- "calcul" : une seule expression arithmétique qui donne la réponse : des nombres, + − × ÷ et des parenthèses, la virgule pour les décimaux, aucun espace dans les nombres ;
- "reponse" : le résultat exact, un nombre positif avec deux décimales au plus, écrit avec une virgule ; l'application refait le calcul et refuse toute différence ;
- "unite" : l'unité courte (« € », « cm », « billes ») ou une chaîne vide ;
- "fausses_reponses" : trois erreurs typiques d'élève (mauvaise opération, étape oubliée, erreur de retenue ou de rang), toutes différentes de la réponse ;
- "trimestre" : 1, 2 ou 3, le moment de l'année où la notion est travaillée en ${niveau}.
Pour corriger ou adapter un problème existant, renvoie sa nouvelle version complète dans "problemes".

Réponds en français. Dans "message", deux ou trois phrases au plus, sans mise en forme.
Réponds UNIQUEMENT par un objet JSON, sans texte autour, de la forme :
{"message": "…", "hors_champ": false, "demande_administrateur": "", "problemes": [{"enonce": "…", "calcul": "…", "reponse": "…", "unite": "…", "fausses_reponses": ["…", "…", "…"], "trimestre": 1}]}`;
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
type Message = { role: 'user' | 'assistant'; content: string };

function lireMessages(raw: unknown): Message[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const messages: Message[] = [];
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

/** La réponse du modèle, revérifiée champ par champ. */
function lireReponse(text: string): Reponse | null {
  let parsed: unknown;
  try {
    // Le modèle entoure parfois l'objet de ``` : on ne garde que l'objet.
    parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
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
    return erreur(401, 'connexion', "Connectez-vous pour discuter avec l'assistant.");
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
  const niveau = lireNiveau(body?.niveau);
  const messages = lireMessages(body?.messages);
  if (!niveau || !messages) return erreur(400, 'requete', "La conversation n'a pas pu être lue.");

  // 3. Le plafond du jour, compté par la base.
  const { data: count, error: countError } = await supabase.rpc('compter_demande_assistant');
  if (countError) {
    console.error('compteur', countError.message);
    return erreur(500, 'base', "Le compteur du chat est introuvable : le fichier 002 a-t-il été exécuté dans Supabase ?");
  }
  if (typeof count === 'number' && count > DAILY_LIMIT) {
    return erreur(429, 'plafond', `Vous avez posé ${DAILY_LIMIT} questions à l'assistant aujourd'hui : c'est le plafond du jour. À demain !`);
  }

  // 4. Le modèle d'intelligence artificielle.
  // La file d'attente, en clé de service : ni la maîtresse ni les tablettes n'y ont accès.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) return erreur(503, 'cle-manquante', "L'assistant n'est pas encore installé dans Supabase.");
  const file = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: travail, error: depotError } = await file
    .from('assistant_travaux')
    .insert({ niveau, systeme: systemPrompt(niveau), messages })
    .select('id')
    .single();
  if (depotError || !travail) {
    console.error('depot', depotError?.message);
    return erreur(500, 'base', "La file de l'assistant est introuvable : le fichier 010 a-t-il été exécuté dans Supabase ?");
  }
  let texte: string | null = null;
  let echec = false;
  const limite = Date.now() + ATTENTE_MS;
  while (Date.now() < limite) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const { data: etat } = await file.from('assistant_travaux').select('statut, reponse').eq('id', travail.id).single();
    if (etat?.statut === 'pret') {
      texte = etat.reponse ?? '';
      break;
    }
    if (etat?.statut === 'erreur') {
      echec = true;
      break;
    }
  }
  await file.from('assistant_travaux').delete().eq('id', travail.id);
  if (texte === null) {
    return erreur(503, echec ? 'indisponible' : 'injoignable', "L'assistant n'a pas pu répondre pour l'instant : réessayez dans un moment.");
  }
  const reponse = lireReponse(texte);
  if (!reponse) return erreur(502, 'illisible', "La réponse de l'assistant n'a pas pu être lue : réessayez.");

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
      assistant: texte,
    });
  }

  return json(200, {
    message: reponse.message.trim(),
    problemes: reponse.problemes,
    horsChamp: false,
    transmis: false,
    assistant: texte,
  });
});
