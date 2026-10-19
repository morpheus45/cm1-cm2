// Les abonnements Google Play de l'appli Android : vérifier chaque achat
// auprès de Google, puis le confirmer (« acknowledge »). Sans confirmation
// dans les trois jours, Google rembourse l'abonné et lui retire l'accès.
//
// Fonction Supabase (Edge Function, Deno), à déployer sous le nom
// « abonnement-play », avec « Verify JWT » désactivé : l'appli l'appelle sans
// compte, les enfants n'en ont pas. Elle ne lit ni n'écrit aucune donnée :
// elle ne fait que relayer un jeton d'achat vers l'API Google Play.
//
// Secret à poser dans Supabase : GOOGLE_PLAY_SERVICE_ACCOUNT, le fichier JSON
// de la clé du compte de service invité dans la Play Console.

const PAQUET = 'fr.ecolearcenciel.app';
const ABONNEMENTS = new Set([
  'niveau_ce1', 'niveau_ce2', 'niveau_cm1', 'niveau_cm2',
  'niveau_6e', 'niveau_5e', 'niveau_4e', 'niveau_3e',
]);
const ACTIFS = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD']);
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAQUET}/purchases`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const repondre = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const base64url = (octets: Uint8Array | string) =>
  btoa(typeof octets === 'string' ? octets : String.fromCharCode(...octets))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Un jeton d'accès Google pour le compte de service (JWT signé RS256). */
async function jetonGoogle(): Promise<string> {
  const compte = JSON.parse(Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT') ?? '{}');
  if (!compte.client_email || !compte.private_key) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT absent');
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const charge = base64url(JSON.stringify({
    iss: compte.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: maintenant,
    exp: maintenant + 3600,
  }));
  const pem = compte.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const cle = await crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cle, new TextEncoder().encode(`${entete}.${charge}`)),
  );
  const reponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${entete}.${charge}.${base64url(signature)}`,
    }),
  });
  if (!reponse.ok) throw new Error(`jeton Google refusé : ${reponse.status}`);
  return (await reponse.json()).access_token;
}

Deno.serve(async (requete) => {
  if (requete.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (requete.method !== 'POST') return repondre({ erreur: 'méthode' }, 405);

  let sku: unknown, jeton: unknown;
  try {
    ({ sku, purchaseToken: jeton } = await requete.json());
  } catch {
    return repondre({ erreur: 'corps illisible' }, 400);
  }
  if (typeof sku !== 'string' || !ABONNEMENTS.has(sku)) return repondre({ erreur: 'abonnement inconnu' }, 400);
  if (typeof jeton !== 'string' || !/^[\w.\-]{10,1000}$/.test(jeton)) return repondre({ erreur: 'jeton invalide' }, 400);

  try {
    const acces = { Authorization: `Bearer ${await jetonGoogle()}` };
    const lecture = await fetch(`${API}/subscriptionsv2/tokens/${jeton}`, { headers: acces });
    if (!lecture.ok) return repondre({ actif: false, erreur: `Google : ${lecture.status}` }, 502);
    const achat = await lecture.json();

    const actif = ACTIFS.has(achat.subscriptionState) &&
      (achat.lineItems ?? []).some((ligne: { productId?: string }) => ligne.productId === sku);
    if (actif && achat.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
      const confirmation = await fetch(`${API}/subscriptions/${sku}/tokens/${jeton}:acknowledge`, {
        method: 'POST',
        headers: { ...acces, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!confirmation.ok) return repondre({ actif, erreur: `confirmation : ${confirmation.status}` }, 502);
    }
    return repondre({ actif });
  } catch (erreur) {
    console.error(erreur);
    return repondre({ erreur: 'Google injoignable' }, 502);
  }
});
