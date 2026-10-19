import type { Level } from '../types';
import { ALL_LEVELS } from '../types';
import { cloudClient } from './cloud';

interface ItemDetails {
  itemId: string;
  title: string;
  price: {
    currency: string;
    value: string;
  };
}

interface PurchaseDetails {
  itemId: string;
  purchaseToken: string;
}

interface DigitalGoodsService {
  getDetails(itemIds: string[]): Promise<ItemDetails[]>;
  listPurchases(): Promise<PurchaseDetails[]>;
}

declare global {
  interface Window {
    getDigitalGoodsService?: (paymentMethod: string) => Promise<DigitalGoodsService>;
  }
}

const PAYMENT_METHOD = 'https://play.google.com/billing';
const STORAGE_KEY = 'exercices-cm1-cm2:appli';
const TWA_REFERRER_PREFIX = 'android-app://fr.ecolearcenciel.app';

export const SKU: Record<Level, string> = {
  CE1: 'niveau_ce1',
  CE2: 'niveau_ce2',
  CM1: 'niveau_cm1',
  CM2: 'niveau_cm2',
  '6e': 'niveau_6e',
  '5e': 'niveau_5e',
  '4e': 'niveau_4e',
  '3e': 'niveau_3e',
};

const SKU_VERS_NIVEAU: Record<string, Level> = Object.entries(SKU).reduce<Record<string, Level>>(
  (acc, [niveau, sku]) => {
    acc[sku] = niveau as Level;
    return acc;
  },
  {}
);

export function estAppliAndroid(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // sessionStorage, pas localStorage : l'appli partage le stockage de Chrome,
  // et le site ouvert dans Chrome doit rester gratuit.
  const parametres = new URLSearchParams(window.location.search);
  if (parametres.get('appli') === 'android') {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'android');
    } catch {
      // Ignorer l'indisponibilité du stockage local
    }
    return true;
  }

  try {
    if (sessionStorage.getItem(STORAGE_KEY) === 'android') {
      return true;
    }
  } catch {
    // Ignorer l'indisponibilité du stockage local
  }

  return document.referrer.startsWith(TWA_REFERRER_PREFIX);
}

async function service(): Promise<DigitalGoodsService | null> {
  if (typeof window === 'undefined' || typeof window.getDigitalGoodsService !== 'function') {
    return null;
  }
  try {
    return await window.getDigitalGoodsService(PAYMENT_METHOD);
  } catch {
    return null;
  }
}

/**
 * Un compte parent à qui l'accès est offert (relecteurs de Google Play,
 * familles invitées) : la liste est gardée côté serveur, migration 012.
 */
async function accesOffert(): Promise<boolean> {
  try {
    const supabase = await cloudClient();
    if (!supabase) return false;
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return false;
    const { data, error } = await supabase.rpc('acces_offert');
    return !error && data === true;
  } catch {
    return false;
  }
}

export async function niveauxAbonnes(): Promise<Level[]> {
  if (await accesOffert()) return [...ALL_LEVELS];
  const dgs = await service();
  if (!dgs) {
    return [];
  }
  try {
    const achats = await dgs.listPurchases();
    // Un achat pas encore confirmé (réseau coupé juste après le paiement) l'est
    // à l'ouverture suivante, bien avant les trois jours laissés par Google.
    for (const achat of achats) void confirmerAchat(achat.itemId, achat.purchaseToken);
    const skusAchetes = new Set(achats.map((achat) => achat.itemId));
    return ALL_LEVELS.filter((niveau) => skusAchetes.has(SKU[niveau]));
  } catch {
    return [];
  }
}

export async function detailsDesOffres(): Promise<Partial<Record<Level, { prix: string; titre: string }>>> {
  const dgs = await service();
  if (!dgs) {
    return {};
  }
  try {
    const identifiants = ALL_LEVELS.map((niveau) => SKU[niveau]);
    const elements = await dgs.getDetails(identifiants);
    const resultat: Partial<Record<Level, { prix: string; titre: string }>> = {};

    for (const element of elements) {
      const niveau = SKU_VERS_NIVEAU[element.itemId];
      if (!niveau) {
        continue;
      }

      const valeur = Number.parseFloat(element.price.value);
      const prixFormate = Number.isNaN(valeur)
        ? element.price.value
        : new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: element.price.currency,
          }).format(valeur);

      resultat[niveau] = {
        prix: prixFormate,
        titre: element.title,
      };
    }

    return resultat;
  } catch {
    return {};
  }
}

export async function sAbonner(niveau: Level): Promise<boolean> {
  if (typeof window === 'undefined' || typeof window.PaymentRequest !== 'function') {
    return false;
  }

  try {
    const requetePaiement = new PaymentRequest(
      [
        {
          supportedMethods: PAYMENT_METHOD,
          data: { sku: SKU[niveau] },
        },
      ],
      {
        total: {
          label: 'Total',
          amount: { currency: 'EUR', value: '0' },
        },
      }
    );

    const reponse = await requetePaiement.show();
    const { purchaseToken } = reponse.details as { purchaseToken?: string };
    if (purchaseToken) await confirmerAchat(SKU[niveau], purchaseToken);
    await reponse.complete('success');
    return true;
  } catch {
    // Déjà abonné (Google refuse un second achat), ou paiement annulé.
    return (await niveauxAbonnes()).includes(niveau);
  }
}

/**
 * Fait vérifier et confirmer l'achat par le serveur (fonction Supabase
 * « abonnement-play ») : sans confirmation sous trois jours, Google rembourse
 * et retire l'abonnement. Un échec n'est pas grave : on réessaie à chaque
 * ouverture de l'appli.
 */
export async function confirmerAchat(sku: string, purchaseToken: string): Promise<boolean> {
  try {
    const supabase = await cloudClient();
    if (!supabase) return false;
    const { data, error } = await supabase.functions.invoke('abonnement-play', { body: { sku, purchaseToken } });
    return !error && data?.actif === true;
  } catch {
    return false;
  }
}

export function niveauOuvert(niveau: Level, abonnes: Level[]): boolean {
  if (!estAppliAndroid()) {
    return true;
  }
  return abonnes.includes(niveau);
}

const VOCABULAIRE_PARENTS: [RegExp, string][] = [
  [/École Arc-en-Ciel/g, 'Arc-en-Ciel'],
  [/Espace maîtresse/g, 'Espace parents'],
  [/Élèves/g, 'Enfants'],
  [/élèves/g, 'enfants'],
  [/Élève/g, 'Enfant'],
  [/élève/g, 'enfant'],
];

/** Le vocabulaire de l'appli, faite pour les familles : « enfant » plutôt qu'« élève ». */
export function enMotsDeParents(texte: string): string {
  return VOCABULAIRE_PARENTS.reduce((t, [motif, mot]) => t.replace(motif, mot), texte);
}

/**
 * Dans l'appli Android, réécrit tout le texte affiché avec le vocabulaire des
 * parents. Le site, lui, garde celui de l'école.
 * ponytail: réécriture du DOM après React, à remplacer par des libellés dédiés si l'appli diverge davantage du site.
 */
export function parlerAuxParents(racine: Node = document.body): void {
  if (!estAppliAndroid()) return;
  const reecrire = (noeud: Node) => {
    const marche = document.createTreeWalker(noeud, NodeFilter.SHOW_TEXT);
    for (let t = marche.currentNode as Node | null; t; t = marche.nextNode()) {
      if (t.nodeType === Node.TEXT_NODE && t.nodeValue && /[ÉéE]l[èe]ve|École Arc|Espace maîtresse/.test(t.nodeValue)) {
        const nouveau = enMotsDeParents(t.nodeValue);
        if (nouveau !== t.nodeValue) t.nodeValue = nouveau;
      }
    }
  };
  document.title = enMotsDeParents(document.title);
  reecrire(racine);
  new MutationObserver((changements) => {
    for (const c of changements) {
      if (c.type === 'characterData') reecrire(c.target);
      c.addedNodes.forEach(reecrire);
    }
  }).observe(racine, { childList: true, subtree: true, characterData: true });
}
