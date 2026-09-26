import { downloadBytes } from '../lib/download';
import type { ReceivedCorrection } from '../lib/pupilCorrections';
import { isAnswerCorrect, worksheetScore } from '../lib/worksheet';
import { formatFrenchDate, worksheetFileName, worksheetToPdf } from '../lib/worksheetPdf';
import { NOTION_COLORS, TEACHER_RED } from '../theme';
import { Gommette } from './ecole/Gommette';
import { NoteEntouree } from './ecole/NoteEntouree';
import { RainbowArc } from './ecole/RainbowArc';
import { WritingCanvas } from './WritingCanvas';

interface CorrectedSheetScreenProps {
  correction: ReceivedCorrection;
  onClose: () => void;
}

/**
 * La feuille d'opérations corrigée, sur la tablette de l'élève : son écriture,
 * l'encre rouge de la maîtresse par-dessus, et son mot. Rien ne s'y modifie :
 * c'est la copie rendue.
 */
export function CorrectedSheetScreen({ correction, onClose }: CorrectedSheetScreenProps) {
  const { worksheet } = correction;
  const { correct, total } = worksheetScore(worksheet);

  const savePdf = () =>
    downloadBytes(worksheetToPdf(worksheet), worksheetFileName(worksheet), 'application/pdf');

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-encre-douce">
            <RainbowArc className="w-8" /> Ma feuille corrigée
          </p>
          <h1 className="text-2xl font-bold text-encre">Opérations posées</h1>
          <p className="text-sm text-encre-douce">
            Séance du {formatFrenchDate(worksheet.createdAt)} · corrigée le {formatFrenchDate(correction.correctedAt)}
          </p>
        </div>
        <button type="button" onClick={onClose} className="etiquette shrink-0 px-4 py-2 text-sm">
          Fermer
        </button>
      </header>

      <section className="cahier flex flex-col items-center gap-3 rounded-3xl px-6 py-6 text-center shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
        <NoteEntouree score={correct} total={total} />
        {worksheet.appreciation ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-encre-douce">Le mot de ta maîtresse :</p>
            <p className="font-cursive text-2xl leading-[2]" style={{ color: TEACHER_RED }}>
              {worksheet.appreciation}
            </p>
          </div>
        ) : (
          <p className="text-base text-encre-douce">Regarde les traits rouges de ta maîtresse sur tes opérations.</p>
        )}
      </section>

      <ol className="flex flex-col gap-4">
        {worksheet.operations.map((operation, position) => {
          const answer = worksheet.answers[operation.id];
          const given = answer?.given ?? '';
          const ok = isAnswerCorrect(given, operation.expected);
          const colors = ok ? NOTION_COLORS.numeration : NOTION_COLORS.accords;
          const annotated = (answer?.teacherStrokes ?? []).length > 0;
          return (
            <li
              key={operation.id}
              className="flex flex-col gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-encre">
                  <span className="text-encre-pale">{position + 1}.</span> {operation.statement}
                </h2>
                <Gommette color={colors.deep} mark={ok ? 'coche' : null} size={28} label={ok ? 'juste' : 'à revoir'} />
              </div>
              <WritingCanvas
                strokes={answer?.strokes ?? []}
                overlayStrokes={answer?.teacherStrokes ?? []}
                readOnly
                label={`Ton opération ${operation.statement}${annotated ? ', avec la correction de ta maîtresse' : ''}`}
              />
              <p className="text-lg">
                <span className="text-encre-douce">Ta réponse : </span>
                <span className="font-bold" style={{ color: colors.deep }}>
                  {given || 'pas de réponse'}
                </span>
                {!ok && <span className="text-encre-douce"> — le bon résultat : {operation.expected}</span>}
              </p>
              {annotated && (
                <p className="text-sm font-bold" style={{ color: TEACHER_RED }}>
                  Ta maîtresse a écrit sur cette opération.
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3">
        <button type="button" onClick={savePdf} className="etiquette w-full py-3.5 text-lg">
          Enregistrer ma feuille corrigée (PDF)
        </button>
        <button type="button" onClick={onClose} className="bouton-encre w-full py-4 text-xl">
          J'ai compris
        </button>
      </div>
    </div>
  );
}
