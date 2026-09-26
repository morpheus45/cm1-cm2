import { useEffect, useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { WritingCanvas } from './WritingCanvas';
import { NumberPad } from './NumberPad';
import { isAnswerCorrect, type Stroke, type WorksheetOperation } from '../lib/worksheet';
import { NOTION_COLORS } from '../theme';
import { Intercalaire } from './ecole/Intercalaire';

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
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-4 py-5">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onQuit} className="etiquette shrink-0 px-3 py-1.5 text-sm">
          Quitter
        </button>
        <div className="flex-1">
          <ProgressBar
            current={operationNumber}
            total={totalOperations}
            label="Opération"
            colors={Array(totalOperations).fill(NOTION_COLORS.calcul.band)}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <Intercalaire domain="calcul" prefix="Maths" />
        <p className="text-lg font-bold text-encre-douce">Pose l'opération, puis écris le résultat</p>
        <p className="text-4xl font-bold text-encre">{operation.statement}</p>
      </div>

      <WritingCanvas strokes={strokes} onStrokesChange={checked ? undefined : setStrokes} readOnly={checked} />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={checked || strokes.length === 0}
          onClick={() => setStrokes(strokes.slice(0, -1))}
          className="etiquette flex-1 py-2 text-base"
        >
          ↶ Annuler le trait
        </button>
        <button
          type="button"
          disabled={checked || strokes.length === 0}
          onClick={() => setStrokes([])}
          className="etiquette flex-1 py-2 text-base"
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
          className="bouton-encre py-4 text-xl"
        >
          Valider
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p
            className="text-center text-xl font-bold"
            style={{ color: correct ? NOTION_COLORS.numeration.deep : NOTION_COLORS.accords.deep }}
          >
            {correct ? 'Bravo, c’est juste !' : `La bonne réponse est ${operation.expected}.`}
          </p>
          <button type="button" onClick={() => onValidate(given, strokes)} className="bouton-encre py-4 text-xl">
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
