import { isAnswerCorrect, worksheetScore, type Worksheet } from '../lib/worksheet';
import { worksheetToPdf, worksheetFileName } from '../lib/worksheetPdf';
import { downloadBytes } from '../lib/download';

import { DeliveryNote } from './DeliveryNote';
import { NOTION_COLORS } from '../theme';
import { Gommette } from './ecole/Gommette';
import { NoteEntouree } from './ecole/NoteEntouree';
import { Tampon } from './ecole/Tampon';
import type { DepositOutcome } from '../lib/cloud';

interface WrittenRecapScreenProps {
  delivery?: DepositOutcome | 'pending' | null;
  worksheet: Worksheet;
  onRestart: () => void;
  onFinish: () => void;
}

export function WrittenRecapScreen({
  worksheet,
  delivery = null,
  onRestart,
  onFinish,
}: WrittenRecapScreenProps) {
  const { correct, total } = worksheetScore(worksheet);
  const ratio = total > 0 ? correct / total : 0;
  const headline = ratio === 1 ? 'Sans faute\u00a0!' : ratio >= 0.5 ? 'Bravo\u00a0!' : 'Bien essayé\u00a0!';

  const savePdf = () => {
    downloadBytes(worksheetToPdf(worksheet), worksheetFileName(worksheet), 'application/pdf');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 py-8">
      <section className="cahier flex flex-col items-center gap-4 rounded-3xl px-6 py-7 text-center shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
        <p className="text-base font-bold uppercase tracking-[0.18em] text-encre-douce">Opérations posées</p>
        <Tampon tilt={-7} className="text-2xl sm:text-3xl">
          {headline}
        </Tampon>
        {worksheet.name && <p className="font-cursive text-2xl leading-[2] text-encre">{worksheet.name}</p>}
        <NoteEntouree score={correct} total={total} />
        <DeliveryNote delivery={delivery} />
      </section>

      <ul className="flex w-full flex-col gap-2">
        {worksheet.operations.map((operation) => {
          const answer = worksheet.answers[operation.id];
          const ok = isAnswerCorrect(answer?.given ?? '', operation.expected);
          const colors = ok ? NOTION_COLORS.numeration : NOTION_COLORS.accords;
          return (
            <li
              key={operation.id}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-lg"
              style={{ background: colors.tint, borderColor: colors.deep }}
            >
              <span className="font-bold text-encre">{operation.statement}</span>
              <span className="flex items-center gap-2 font-bold" style={{ color: colors.deep }}>
                {answer?.given || '—'}
                {!ok && <span className="font-normal text-encre-douce">({operation.expected})</span>}
                <Gommette color={colors.deep} mark={ok ? 'coche' : null} size={22} label={ok ? 'juste' : 'à revoir'} />
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex w-full flex-col gap-3">
        <button type="button" onClick={savePdf} className="etiquette w-full py-3.5 text-lg">
          Enregistrer le PDF pour la maîtresse
        </button>
        <p className="-mt-1 text-center text-sm text-encre-pale">
          Le PDF contient l'opération posée à la main, telle qu'elle a été écrite.
        </p>
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
