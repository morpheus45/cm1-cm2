import { useEffect, useRef } from 'react';
import { WritingCanvas } from './WritingCanvas';
import type { Stroke } from '../lib/worksheet';

interface OperationDraftProps {
  /** L'énoncé déjà formaté, tel qu'affiché à la question (« 127 + 448 »). */
  statement: string;
  isDecimal: boolean;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  onClose: () => void;
}

/**
 * Le brouillon : l'élève y pose l'opération au doigt avant de choisir sa
 * réponse dans le QCM. Rien n'y est corrigé, ni envoyé, ni enregistré — le
 * dessin ne vit que dans l'état de l'écran, et disparaît à la question
 * suivante.
 */
export function OperationDraft({ statement, isDecimal, strokes, onStrokesChange, onClose }: OperationDraftProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // À l'ouverture, le focus se pose sur le titre du brouillon ; à la
  // fermeture, il revient au bouton qui l'a ouvert (géré par l'appelant).
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  // Le cahier ne défile pas pendant que l'enfant écrit : seul le brouillon
  // est visible, et son propre contenu tient dans l'écran.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Poser l'opération"
      className="fixed inset-0 z-50 flex h-dvh flex-col gap-3 overflow-hidden bg-papier px-4 py-4"
    >
      <h2 ref={titleRef} tabIndex={-1} className="text-center text-lg font-bold text-encre-douce">
        Poser l'opération
      </h2>

      <p className="shrink-0 text-center text-3xl font-bold text-encre">{statement}</p>

      <p className="shrink-0 text-center text-sm text-encre-douce">
        Écris les retenues et le résultat, en alignant les chiffres {isDecimal ? 'sur la virgule' : 'sur les unités'}.
      </p>

      <div className="min-h-0 flex-1">
        <WritingCanvas strokes={strokes} onStrokesChange={onStrokesChange} />
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled={strokes.length === 0}
          onClick={() => onStrokesChange([])}
          className="etiquette flex-1 py-3 text-base"
        >
          Effacer
        </button>
        <button type="button" onClick={onClose} className="bouton-encre flex-1 py-3 text-base">
          Revenir aux réponses
        </button>
      </div>
    </div>
  );
}
