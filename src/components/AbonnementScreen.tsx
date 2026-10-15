import { useState } from 'react';
import type { Level } from '../types';
import { sAbonner } from '../lib/abonnements';

interface Props {
  niveau: Level;
  prix?: string;
  onAbonne: () => void;
  onRetour: () => void;
}

export function AbonnementScreen({ niveau, prix, onAbonne, onRetour }: Props) {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);

  const gererAbonnement = async () => {
    setErreur(false);
    setChargement(true);
    try {
      const succes = await sAbonner(niveau);
      if (succes) {
        onAbonne();
      } else {
        setErreur(true);
      }
    } catch {
      setErreur(true);
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div>
          <button type="button" onClick={onRetour} className="etiquette px-3 py-1.5 text-sm">
            Retour
          </button>
        </div>

        <div className="cahier flex flex-col gap-3 rounded-3xl py-5 pl-12 pr-5">
          <h1 className="text-2xl font-bold text-encre">Le niveau {niveau}</h1>
          <p className="text-encre">Toutes les matières du {niveau}, avec les aides DYS.</p>

          <div className="rounded-2xl border border-encre/10 bg-white/60 p-4 text-encre">
            <p className="font-medium">
              7 jours d'essai gratuit, puis {prix ?? '4,99\u00a0€'} par mois.
            </p>
            <p className="text-sm text-encre-douce">
              Abonnement mensuel renouvelé automatiquement. Sans engagement : résiliable à tout moment dans Google Play,
              y compris pendant l'essai, sans être débité.
            </p>
          </div>

          <ul className="flex flex-col gap-1.5 text-sm text-encre">
            <li>• 7 matières</li>
            <li>• 3 trimestres</li>
            <li>• Aides DYS</li>
            <li>• Suivi par l'espace parents</li>
          </ul>

          {erreur && (
            <p className="text-sm font-bold text-[#B84A06]">
              L'abonnement n'a pas abouti. Vous pouvez réessayer.
            </p>
          )}

          <button
            type="button"
            onClick={gererAbonnement}
            disabled={chargement}
            className="bouton-encre w-full py-4 text-xl disabled:opacity-50"
          >
            {chargement ? 'Ouverture de Google Play…' : "Commencer l'essai gratuit"}
          </button>

          <p className="text-center text-xs text-encre-douce">
            Le paiement, le renouvellement et la résiliation sont gérés par Google Play.
          </p>
        </div>
      </div>
    </main>
  );
}
