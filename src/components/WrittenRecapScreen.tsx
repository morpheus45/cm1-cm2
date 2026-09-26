import { isAnswerCorrect, worksheetScore, type Worksheet } from '../lib/worksheet';
import { worksheetToPdf, worksheetFileName } from '../lib/worksheetPdf';
import { downloadBytes } from '../lib/download';

interface WrittenRecapScreenProps {
  worksheet: Worksheet;
  onRestart: () => void;
  onFinish: () => void;
}

export function WrittenRecapScreen({ worksheet, onRestart, onFinish }: WrittenRecapScreenProps) {
  const { correct, total } = worksheetScore(worksheet);
  const who = worksheet.name ? ` ${worksheet.name}` : '';
  const ratio = total > 0 ? correct / total : 0;
  const headline =
    ratio === 1 ? `Sans faute${who} !` : ratio >= 0.5 ? `Bravo${who} !` : `Bien essayé${who} !`;

  const savePdf = () => {
    downloadBytes(worksheetToPdf(worksheet), worksheetFileName(worksheet), 'application/pdf');
  };

  return (
    <div className="min-h-screen flex flex-col items-center gap-5 bg-sky-50 px-4 py-8 max-w-lg mx-auto">
      <h2 className="text-3xl font-bold text-slate-700 text-center">{headline}</h2>
      <p className="text-2xl text-slate-600">
        Score : {correct} / {total}
      </p>

      <ul className="w-full flex flex-col gap-2">
        {worksheet.operations.map((operation) => {
          const answer = worksheet.answers[operation.id];
          const ok = isAnswerCorrect(answer?.given ?? '', operation.expected);
          return (
            <li
              key={operation.id}
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-lg ${
                ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <span className="font-semibold text-slate-700">{operation.statement}</span>
              <span className={ok ? 'text-emerald-700' : 'text-amber-700'}>
                {answer?.given || '—'}
                {!ok && <span className="text-slate-400"> (⁠{operation.expected})</span>}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3 w-full">
        <button
          type="button"
          onClick={savePdf}
          className="w-full rounded-xl bg-violet-500 text-white text-xl font-bold py-4"
        >
          Enregistrer le PDF pour la maîtresse
        </button>
        <p className="text-sm text-slate-400 text-center -mt-1">
          Le PDF contient l'opération posée à la main, telle qu'elle a été écrite.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="w-full rounded-xl bg-emerald-400 text-white text-xl font-bold py-4"
        >
          Recommencer
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="w-full rounded-xl bg-white border-2 border-slate-200 text-slate-600 text-xl font-bold py-4"
        >
          Terminer
        </button>
      </div>
    </div>
  );
}
