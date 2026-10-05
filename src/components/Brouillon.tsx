import { useState } from 'react';
import type { Stroke } from '../lib/worksheet';
import { WritingCanvas } from './WritingCanvas';

/**
 * Le brouillon de la question : l'élève y pose son opération au doigt ou au
 * stylet avant de choisir sa réponse, comme sur la feuille de brouillon à
 * côté du cahier. Rien n'est gardé ni envoyé : c'est une aide pour calculer,
 * pas une copie. Une nouvelle question (nouvelle `key`) repart d'une page
 * blanche.
 */
export function Brouillon({ locked = false }: { locked?: boolean }) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  return (
    <section className="flex flex-col gap-2" aria-label="Brouillon">
      <p className="text-base font-bold text-encre-douce">
        ✏️ Pose ton opération ici, puis choisis ta réponse
      </p>
      <WritingCanvas
        strokes={strokes}
        onStrokesChange={locked ? undefined : setStrokes}
        readOnly={locked}
        label="Brouillon pour poser l'opération"
      />
      {!locked && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={() => setStrokes(strokes.slice(0, -1))}
            className="etiquette flex-1 py-2 text-base"
          >
            ↶ Annuler le trait
          </button>
          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={() => setStrokes([])}
            className="etiquette flex-1 py-2 text-base"
          >
            Tout effacer
          </button>
        </div>
      )}
    </section>
  );
}
