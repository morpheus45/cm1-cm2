import type { DepositOutcome } from '../lib/cloud';

/** Ce que devient la séance côté maîtresse. Rien n'est affiché quand elle ne
 *  quitte pas l'appareil : un enfant sans code de classe n'a rien à attendre. */
export function DeliveryNote({ delivery }: { delivery: DepositOutcome | 'pending' | null }) {
  if (delivery === null || delivery === 'disabled') return null;

  const { text, tone } = {
    pending: { text: 'Envoi à ta maîtresse…', tone: 'text-slate-500' },
    sent: { text: '✓ Séance envoyée à ta maîtresse', tone: 'text-emerald-700' },
    queued: {
      text: 'Pas de réseau : la séance partira toute seule à la prochaine connexion.',
      tone: 'text-slate-500',
    },
    rejected: {
      text: "Ta maîtresse n'a pas reçu la séance : vérifie le code de la classe.",
      tone: 'text-amber-700',
    },
  }[delivery];

  return (
    <p role="status" className={`text-sm text-center ${tone}`}>
      {text}
    </p>
  );
}
