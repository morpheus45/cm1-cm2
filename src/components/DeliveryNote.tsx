import type { DepositOutcome } from '../lib/cloud';

/** Ce que devient la séance côté maîtresse. Rien n'est affiché quand elle ne
 *  quitte pas l'appareil : un enfant sans code de classe n'a rien à attendre. */
export function DeliveryNote({ delivery }: { delivery: DepositOutcome | 'pending' | null }) {
  if (delivery === null || delivery === 'disabled') return null;

  const { text, tone } = {
    pending: { text: 'Envoi à ta maîtresse…', tone: 'text-encre-douce' },
    sent: { text: '✓ Séance envoyée à ta maîtresse', tone: 'text-[#1B7A43]' },
    queued: {
      text: "La séance n'a pas pu partir pour l'instant : elle réessaiera toute seule à la prochaine connexion.",
      tone: 'text-encre-douce',
    },
    rejected: {
      text: "Ta maîtresse n'a pas reçu la séance : vérifie le code de la classe.",
      tone: 'text-[#B84A06]',
    },
  }[delivery];

  return (
    <p role="status" className={`text-center text-base font-bold ${tone}`}>
      {text}
    </p>
  );
}
