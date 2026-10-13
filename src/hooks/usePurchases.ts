import { useState, useCallback, useEffect } from 'react';
import type { Level } from '../types';
import { BUNDLES } from '../lib/monetization';

/**
 * Hook pour gérer les achats et le panier
 * Sauvegarde dans localStorage
 */

interface Purchase {
  id: string;
  level: Level;
  purchasedAt: string; // ISO timestamp
  amount: number; // EUR
}

export function usePurchases(userId: string) {
  const storageKey = `purchases-${userId}`;
  const cartKey = `cart-${userId}`;

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState<Level[]>(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persister les achats
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(purchases));
  }, [purchases, storageKey]);

  // Persister le panier
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  // Ajouter au panier
  const addToCart = useCallback((level: Level) => {
    setCart((prev) => {
      if (prev.includes(level)) return prev;
      return [...prev, level];
    });
  }, []);

  // Retirer du panier
  const removeFromCart = useCallback((level: Level) => {
    setCart((prev) => prev.filter((l) => l !== level));
  }, []);

  // Vider le panier
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Enregistrer un achat (simulé, pas de vraie intégration paiement)
  const recordPurchase = useCallback(
    (levels: Level[], amount: number) => {
      const newPurchases = levels.map((level) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        level,
        purchasedAt: new Date().toISOString(),
        amount: amount / levels.length,
      }));

      setPurchases((prev) => [...prev, ...newPurchases]);
      clearCart();

      return {
        success: true,
        purchaseId: newPurchases[0]?.id,
        message: `${levels.length} niveau(x) acheté(s) avec succès!`,
      };
    },
    [clearCart]
  );

  // Appliquer un bundle
  const applyBundle = useCallback((bundleId: string) => {
    const bundle = BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) return;

    // Remplacer le panier par les niveaux du bundle
    setCart(bundle.levels);
  }, []);

  // Vérifier si un niveau est acheté
  const isPurchased = useCallback(
    (level: Level): boolean => {
      return purchases.some((p) => p.level === level);
    },
    [purchases]
  );

  // Récupérer les niveaux acheté
  const getPurchasedLevels = useCallback((): Level[] => {
    return purchases.map((p) => p.level);
  }, [purchases]);

  // Récupérer l'historique d'achat
  const getPurchaseHistory = useCallback((): Purchase[] => {
    return [...purchases].sort(
      (a, b) =>
        new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
  }, [purchases]);

  return {
    // Panier
    cart,
    addToCart,
    removeFromCart,
    clearCart,

    // Achats
    purchases: getPurchasedLevels(),
    isPurchased,
    recordPurchase,
    getPurchaseHistory,

    // Bundles
    applyBundle,
  };
}
