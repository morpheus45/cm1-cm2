import type { Subject } from '../types';
import { ofSubject } from '../types';

import { DeliveryNote } from './DeliveryNote';
import type { DepositOutcome } from '../lib/cloud';
import { Gommette } from './ecole/Gommette';
import { NoteEntouree } from './ecole/NoteEntouree';
import { Tampon } from './ecole/Tampon';

interface RecapScreenProps {
  delivery?: DepositOutcome | 'pending' | null;
  name?: string;
  subject: Subject;
  score: number;
  total: number;
  totalStars: number;
  onRestart: () => void;
  onFinish: () => void;
}

const STAR_GOLD = '#E0A100';

export function RecapScreen({
  name,
  subject,
  score,
  total,
  totalStars,
  delivery = null,
  onRestart,
  onFinish,
}: RecapScreenProps) {
  // Féliciter un enfant qui s'est trompé huit fois sur huit sonne faux : le
  // titre suit le score, sans jamais le lui reprocher.
  const ratio = total > 0 ? score / total : 0;
  const headline = ratio === 1 ? 'Sans faute\u00a0!' : ratio >= 0.5 ? 'Bravo\u00a0!' : 'Bien essayé\u00a0!';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-8">
      <section className="cahier flex flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
        <p className="text-base font-bold uppercase tracking-[0.18em] text-encre-douce">
          Séance {ofSubject(subject)} terminée
        </p>
        <Tampon tilt={-7} className="text-2xl sm:text-3xl">
          {headline}
        </Tampon>
        {name && <p className="font-cursive text-2xl leading-[2] text-encre">{name}</p>}
        <NoteEntouree score={score} total={total} />
        <DeliveryNote delivery={delivery} />
      </section>

      <div className="flex flex-col items-center gap-2">
        <p className="text-base font-bold text-encre-douce">
          {totalStars} étoile{totalStars > 1 ? 's' : ''} gagnée{totalStars > 1 ? 's' : ''} en tout
        </p>
        <div className="flex max-w-xs flex-wrap justify-center gap-1">
          {Array.from({ length: Math.min(totalStars, 20) }).map((_, index) => (
            <Gommette key={index} color={STAR_GOLD} mark="etoile" size={30} tilt={((index * 53) % 25) - 12} />
          ))}
          {totalStars > 20 && <span className="self-center text-lg font-bold text-encre-douce">+{totalStars - 20}</span>}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <button type="button" onClick={onRestart} className="bouton-encre w-full py-4 text-xl">
          Recommencer
        </button>
        <button type="button" onClick={onFinish} className="etiquette w-full py-3.5 text-xl">
          Terminer
        </button>
      </div>
    </div>
  );
}
