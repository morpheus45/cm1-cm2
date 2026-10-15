import type { Level } from '../types';
import { ALL_LEVELS } from '../types';

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

  const parametres = new URLSearchParams(window.location.search);
  if (parametres.get('appli') === 'android') {
    try {
      localStorage.setItem(STORAGE_KEY, 'android');
    } catch {
      // Ignorer l'indisponibilité du stockage local
    }
    return true;
  }

  try {
    if (localStorage.getItem(STORAGE_KEY) === 'android') {
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

export async function niveauxAbonnes(): Promise<Level[]> {
  const dgs = await service();
  if (!dgs) {
    return [];
  }
  try {
    const achats = await dgs.listPurchases();
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
    await reponse.complete('success');
    return true;
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
