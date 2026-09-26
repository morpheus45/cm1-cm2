import { useEffect, useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { WritingCanvas } from './WritingCanvas';
import { NumberPad } from './NumberPad';
import { isAnswerCorrect, type Stroke, type WorksheetOperation } from '../lib/worksheet';

interface WrittenOperationScreenProps {
  operation: WorksheetOperation;
  operationNumber: number;
  totalOperations: number;
  onValidate: (given: string, strokes: Stroke[]) => void;
  onQuit: () => void;
}

export function WrittenOperationScreen({
  operation,
  operationNumber,
  totalOperations,
  onValidate,
  onQuit,
}: WrittenOperationScreenProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [given, setGiven] = useState('');
  const [checked, setChecked] = useState(false);

  // Nouvelle opération : cahier blanc.
  useEffect(() => {
    setStrokes([]);
    setGiven('');
    setChecked(false);
  }, [operation.id]);

  const correct = isAnswerCorrect(given, operation.expected);

  return (
    <div className="min-h-screen flex flex-col gap-4 bg-sky-50 px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onQuit}
          className="shrink-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-500"
        >
          Quitter
        </button>
        <div className="flex-1">
          <ProgressBar current={operationNumber} total={totalOperations} label="Opération" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-base font-semibold text-violet-500">🔢 Maths · Opération posée</p>
        <p className="text-lg text-slate-500">Pose l'opération, puis écris le résultat</p>
        <p className="text-3xl font-bold text-slate-700">{operation.statement}</p>
      </div>

      <WritingCanvas strokes={strokes} onStrokesChange={checked ? undefined : setStrokes} readOnly={checked} />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={checked || strokes.length === 0}
          onClick={() => setStrokes(strokes.slice(0, -1))}
          className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-2 text-base font-medium text-slate-600 disabled:opacity-40"
        >
          Annuler le trait
        </button>
        <button
          type="button"
          disabled={checked || strokes.length === 0}
          onClick={() => setStrokes([])}
          className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-2 text-base font-medium text-slate-600 disabled:opacity-40"
        >
          Tout effacer
        </button>
      </div>

      <NumberPad value={given} onChange={setGiven} disabled={checked} />

      {!checked ? (
        <button
          type="button"
          disabled={given === ''}
          onClick={() => setChecked(true)}
          className="rounded-xl bg-orange-400 disabled:bg-slate-300 text-white text-xl font-bold py-4"
        >
          Valider
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p
            className={`text-center text-xl font-semibold ${
              correct ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {correct ? 'Bravo, c’est juste !' : `La bonne réponse est ${operation.expected}.`}
          </p>
          <button
            type="button"
            onClick={() => onValidate(given, strokes)}
            className="rounded-xl bg-orange-400 text-white text-xl font-bold py-4"
          >
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
