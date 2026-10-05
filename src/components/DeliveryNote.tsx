import type { DepositOutcome } from '../lib/cloud';
import { teacherWord, teacherWordCapitalised, type Level } from '../types';

/** Ce que devient la séance côté maîtresse. Rien n'est affiché quand elle ne
 *  quitte pas l'appareil : un enfant sans code de classe n'a rien à attendre.
 *  Le niveau de l'élève décide du mot : une maîtresse, ou un professeur. */
export function DeliveryNote({ delivery, level }: { delivery: DepositOutcome | 'pending' | null; level: Level }) {
  if (delivery === null || delivery === 'disabled') return null;

  const { text, tone } = {
    pending: { text: `Envoi à ${teacherWord(level)}…`, tone: 'text-encre-douce' },
    sent: { text: `✓ Séance envoyée à ${teacherWord(level)}`, tone: 'text-[#1B7A43]' },
    queued: {
      text: 'Pas de connexion : ta séance partira toute seule plus tard.',
      tone: 'text-encre-douce',
    },
    rejected: {
      text: `${teacherWordCapitalised(level)} n'a pas reçu la séance : vérifie le code de la classe.`,
      tone: 'text-[#B84A06]',
    },
  }[delivery];

  return (
    <p role="status" className={`text-center text-base font-bold ${tone}`}>
      {text}
    </p>
  );
}
