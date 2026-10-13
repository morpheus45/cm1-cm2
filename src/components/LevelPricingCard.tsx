import type { Level } from '../types';
import { LEVEL_PRICING, formatPrice, isLevelAccessible } from '../lib/monetization';

interface LevelPricingCardProps {
  level: Level;
  purchased: Level[] | null;
  onSelect?: (level: Level) => void;
  onPurchase?: (level: Level) => void;
}

export function LevelPricingCard({
  level,
  purchased,
  onSelect,
  onPurchase,
}: LevelPricingCardProps) {
  const pricing = LEVEL_PRICING[level];
  const isAccessible = isLevelAccessible(level, purchased);

  const tierColors: Record<string, string> = {
    free: 'from-green-400 to-emerald-500',
    basic: 'from-blue-400 to-indigo-500',
    premium: 'from-purple-400 to-violet-500',
    elite: 'from-yellow-400 to-orange-500',
  };

  const tierLabels: Record<string, string> = {
    free: '🎁 Gratuit',
    basic: '💎 Basique',
    premium: '👑 Premium',
    elite: '⭐ Elite',
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
      {/* Header avec gradient et tier */}
      <div className={`bg-gradient-to-r ${tierColors[pricing.tier]} p-4 text-white`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold">{level}</h3>
          <span className="text-xs font-bold bg-white bg-opacity-30 px-3 py-1 rounded-full">
            {tierLabels[pricing.tier]}
          </span>
        </div>
        <p className="text-sm opacity-90">{pricing.description}</p>
      </div>

      {/* Prix */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 text-center border-b-2 border-gray-200">
        {pricing.active ? (
          <>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Prix</p>
            <p className="text-3xl font-bold text-gray-900">{formatPrice(pricing.price)}</p>
            {isAccessible && (
              <p className="text-xs text-green-600 font-semibold mt-2">✅ Accès inclus</p>
            )}
          </>
        ) : (
          <p className="text-lg font-bold text-green-600">🎁 Gratuit pour le moment</p>
        )}
      </div>

      {/* Features */}
      <div className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {pricing.features.map((feature, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start">
              <span className="mr-2 flex-shrink-0">{feature.split(' ')[0]}</span>
              <span>{feature.substring(feature.indexOf(' ') + 1)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t-2 border-gray-100 space-y-2">
        {isAccessible ? (
          <button
            onClick={() => onSelect?.(level)}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition"
          >
            ✅ Accéder au niveau
          </button>
        ) : pricing.active ? (
          <>
            <button
              onClick={() => onPurchase?.(level)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition"
            >
              🛒 Acheter maintenant
            </button>
            <button
              onClick={() => onSelect?.(level)}
              className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition"
            >
              👁️ Aperçu gratuit
            </button>
          </>
        ) : (
          <button
            onClick={() => onSelect?.(level)}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition"
          >
            ▶️ Commencer
          </button>
        )}
      </div>

      {/* Badge "Bientôt" si pas encore actif mais payant */}
      {!pricing.active && pricing.price > 0 && (
        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
          Bientôt payant
        </div>
      )}
    </div>
  );
}
