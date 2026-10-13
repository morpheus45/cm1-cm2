import type { Level } from '../types';

/**
 * Stratégie de monétisation : par niveau complet (toutes matières)
 * Chaque niveau est un bundle indépendant
 */

export type PricingTier = 'free' | 'basic' | 'premium' | 'elite';

export interface LevelPricing {
  level: Level;
  tier: PricingTier;
  price: number; // en euros
  currency: 'EUR';
  description: string;
  features: string[];
  active: boolean; // Si false, niveau gratuit/accessible. Si true, payant
}

/**
 * Configuration de prix par niveau
 * IMPORTANT : active: false = gratuit en ce moment
 * Changer à true pour activer la monétisation
 */
export const LEVEL_PRICING: Record<Level, LevelPricing> = {
  CE1: {
    level: 'CE1',
    tier: 'free',
    price: 0,
    currency: 'EUR',
    description: 'Découvrir la plateforme',
    features: [
      '✅ Accès complet aux 7 matières',
      '✅ Système d\'accessibilité DYS',
      '✅ Suivi de progression',
      '✅ Certificat de compétences',
    ],
    active: false, // Gratuit pour toujours (accroche)
  },
  CE2: {
    level: 'CE2',
    tier: 'basic',
    price: 4.99,
    currency: 'EUR',
    description: 'Consolidation des fondamentaux',
    features: [
      '✅ 7 matières complètes',
      '✅ 3 trimestres + révisions',
      '✅ Certificat par trimestre',
      '✅ Support DYS complet',
      '✅ Historique de progression',
    ],
    active: false, // À activer après CE1 gratuit
  },
  CM1: {
    level: 'CM1',
    tier: 'basic',
    price: 5.99,
    currency: 'EUR',
    description: 'Élargissement et approfondissement',
    features: [
      '✅ Toutes matières (+ Histoire/Géo)',
      '✅ 3 trimestres complets',
      '✅ Évaluations formatives',
      '✅ Plan de révision personnalisé',
      '✅ Défis progressifs',
    ],
    active: false,
  },
  CM2: {
    level: 'CM2',
    tier: 'premium',
    price: 7.99,
    currency: 'EUR',
    description: 'Transition Cycle 3→4',
    features: [
      '✅ Toutes les matières du cycle 3',
      '✅ Préparation à la 6e',
      '✅ Évaluations complètes',
      '✅ Tests blancs',
      '✅ Conseils de réussite',
    ],
    active: false,
  },
  '6e': {
    level: '6e',
    tier: 'premium',
    price: 8.99,
    currency: 'EUR',
    description: 'Entrée au collège',
    features: [
      '✅ 7 matières adaptées collège',
      '✅ Méthodologie collège',
      '✅ Évaluations formatives',
      '✅ Défis d\'excellence',
      '✅ Préparation Cycle 4',
    ],
    active: false,
  },
  '5e': {
    level: '5e',
    tier: 'premium',
    price: 9.99,
    currency: 'EUR',
    description: 'Cycle 4 - Approfondissement',
    features: [
      '✅ Contenu Cycle 4 complet',
      '✅ Notions avancées',
      '✅ Évaluations formatives',
      '✅ Défis d\'excellence avancés',
      '✅ Préparation 4e',
    ],
    active: false,
  },
  '4e': {
    level: '4e',
    tier: 'elite',
    price: 11.99,
    currency: 'EUR',
    description: 'Vers le Brevet',
    features: [
      '✅ Contenu Brevet 4e',
      '✅ Notions fondamentales Brevet',
      '✅ Tests blancs Brevet',
      '✅ Analyses détaillées',
      '✅ Préparation intensive',
    ],
    active: false,
  },
  '3e': {
    level: '3e',
    tier: 'elite',
    price: 14.99,
    currency: 'EUR',
    description: 'Brevet des Collèges',
    features: [
      '✅ Programme Brevet complet',
      '✅ Sujets d\'examen',
      '✅ Tests blancs complets',
      '✅ Correction détaillée',
      '✅ Accès aux défis excellence',
      '✅ Certificat Brevet',
    ],
    active: false,
  },
};

/**
 * Bundles/Packs pour achat groupé
 */
export interface Bundle {
  id: string;
  name: string;
  description: string;
  levels: Level[];
  price: number;
  regularPrice: number;
  discount: number; // %
  active: boolean;
}

export const BUNDLES: Bundle[] = [
  {
    id: 'cycle-2',
    name: 'Pack Cycle 2',
    description: 'CE1 + CE2 complets',
    levels: ['CE1', 'CE2'],
    price: 4.99, // CE1 gratuit + CE2 réduit
    regularPrice: 4.99,
    discount: 0,
    active: false,
  },
  {
    id: 'cycle-3',
    name: 'Pack Cycle 3',
    description: 'CM1 + CM2 + 6e',
    levels: ['CM1', 'CM2', '6e'],
    price: 19.99,
    regularPrice: 22.97,
    discount: 13,
    active: false,
  },
  {
    id: 'cycle-4',
    name: 'Pack Cycle 4',
    description: '5e + 4e + 3e (Brevet)',
    levels: ['5e', '4e', '3e'],
    price: 29.99,
    regularPrice: 36.97,
    discount: 19,
    active: false,
  },
  {
    id: 'all-levels',
    name: 'Accès Complet',
    description: 'CE1 à 3e (Brevet)',
    levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'],
    price: 49.99,
    regularPrice: 63.93,
    discount: 22,
    active: false,
  },
];

/**
 * Groupes d'accès (après achat)
 */
export interface PurchasedLevels {
  userId: string;
  levels: Level[];
  purchasedAt: string; // ISO timestamp
  expiresAt?: string; // null = accès illimité
  bundleId?: string;
}

/**
 * Vérifier si un niveau est accessible (gratuit ou acheté)
 */
export function isLevelAccessible(
  level: Level,
  purchasedLevels: Level[] | null
): boolean {
  // CE1 est toujours gratuit
  if (level === 'CE1') return true;

  // Vérifier si le niveau est acheté
  if (purchasedLevels?.includes(level)) return true;

  // Sinon non accessible
  return false;
}

/**
 * Récupérer le prix à payer pour accéder à un niveau
 */
export function getLevelPrice(level: Level): number | null {
  const pricing = LEVEL_PRICING[level];
  return pricing.active ? pricing.price : 0; // 0 = gratuit
}

/**
 * Format prix EUR
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/**
 * Calculer économies sur bundle
 */
export function calculateSavings(bundle: Bundle): {
  saved: number;
  percentage: number;
} {
  const saved = bundle.regularPrice - bundle.price;
  const percentage = bundle.regularPrice > 0 ? Math.round((saved / bundle.regularPrice) * 100) : 0;
  return { saved, percentage };
}
