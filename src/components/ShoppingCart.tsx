import { useState } from 'react';
import type { Level } from '../types';
import { LEVEL_PRICING, BUNDLES, formatPrice, calculateSavings } from '../lib/monetization';
import { LEVEL_LABELS } from '../types';

interface ShoppingCartProps {
  cart: Level[];
  onAddToCart?: (level: Level) => void;
  onRemoveFromCart?: (level: Level) => void;
  onCheckout?: (cart: Level[]) => void;
  onApplyBundle?: (bundleId: string) => void;
}

export function ShoppingCart({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  onApplyBundle,
}: ShoppingCartProps) {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);

  const totalPrice = cart.reduce((sum, level) => {
    const pricing = LEVEL_PRICING[level];
    return sum + (pricing.active ? pricing.price : 0);
  }, 0);

  const isEmpty = cart.length === 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white">
          <h2 className="text-2xl font-bold">🛒 Mon Panier</h2>
          <p className="text-purple-100">{cart.length} niveau(x) sélectionné(s)</p>
        </div>

        {/* Contenu du panier */}
        <div className="p-6">
          {isEmpty ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">📦</p>
              <p className="text-gray-600 text-lg">Votre panier est vide</p>
              <p className="text-gray-500 text-sm mt-2">CE1 est gratuit. Ajoutez d'autres niveaux.</p>
            </div>
          ) : (
            <>
              {/* Liste des articles */}
              <div className="space-y-3 mb-6">
                {cart.map((level) => {
                  const pricing = LEVEL_PRICING[level];
                  return (
                    <div
                      key={level}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border-l-4 border-purple-500"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{LEVEL_LABELS[level]}</p>
                        <p className="text-sm text-gray-600">{pricing.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {pricing.active ? formatPrice(pricing.price) : '🎁 Gratuit'}
                        </p>
                        <button
                          onClick={() => onRemoveFromCart?.(level)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold mt-1"
                        >
                          ✕ Retirer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Packs/Bundles */}
              {cart.length > 1 && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-3">💡 Packs recommandés :</p>
                  <div className="space-y-2">
                    {BUNDLES.filter((b) =>
                      b.levels.some((l) => cart.includes(l))
                    ).map((bundle) => {
                      const { saved, percentage } = calculateSavings(bundle);
                      return (
                        <button
                          key={bundle.id}
                          onClick={() => {
                            setSelectedBundle(bundle.id);
                            onApplyBundle?.(bundle.id);
                          }}
                          className={`w-full p-3 rounded-lg border-2 text-left transition ${
                            selectedBundle === bundle.id
                              ? 'bg-blue-500 border-blue-600 text-white'
                              : 'bg-white border-blue-300 text-gray-900 hover:border-blue-500'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{bundle.name}</span>
                            <span className="text-sm">
                              Économisez {percentage}% ({formatPrice(saved)})
                            </span>
                          </div>
                          <p className="text-xs opacity-70 mt-1">{bundle.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Totaux */}
              <div className="border-t-2 border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Sous-total :</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Frais :</span>
                  <span>Gratuit</span>
                </div>
                <div className="flex justify-between text-xl font-bold bg-gray-100 p-3 rounded-lg">
                  <span>Total :</span>
                  <span className="text-purple-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Checkout */}
              <button
                onClick={() => onCheckout?.(cart)}
                disabled={isEmpty || totalPrice === 0}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {totalPrice === 0 ? '✅ Accès gratuit' : '💳 Procéder au paiement'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                🔒 Paiement sécurisé via Stripe | Aucune engagement
              </p>
            </>
          )}
        </div>

        {/* Footer info */}
        {!isEmpty && (
          <div className="bg-gray-50 px-6 py-3 border-t-2 border-gray-200 text-xs text-gray-600">
            ℹ️ Tous les niveaux incluent accès illimité + 7 matières + DYS + certificats
          </div>
        )}
      </div>
    </div>
  );
}
