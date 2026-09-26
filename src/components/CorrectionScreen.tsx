import { useMemo, useState } from 'react';
import { APPRECIATION_MAX_LENGTH, correctionsOf } from '../lib/correction';
import { downloadBytes } from '../lib/download';
import { isAnswerCorrect, worksheetScore, type Stroke, type Worksheet } from '../lib/worksheet';
import { formatFrenchDate, worksheetFileName, worksheetToPdf } from '../lib/worksheetPdf';
import { WritingCanvas } from './WritingCanvas';

const TEACHER_INK = '#dc2626';

interface CorrectionScreenProps {
  worksheet: Worksheet;
  /** Date de la dernière correction enregistrée, `null` si jamais corrigée. */
  correctedAt: string | null;
  /** Combien d'autres feuilles attendent encore une correction. */
  remaining: number;
  onSave: (worksheet: Worksheet) => Promise<void>;
  onNext: () => void;
  onClose: () => void;
}

function frenchDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${formatFrenchDate(iso)} à ${date.getHours()} h ${pad(date.getMinutes())}`;
}

/**
 * La maîtresse corrige une feuille d'opérations posées, sur sa tablette : à
 * l'encre rouge, par-dessus l'écriture de l'élève, qui reste intouchable.
 * Une opération à la fois, pour écrire en grand.
 */
export function CorrectionScreen({
  worksheet,
  correctedAt,
  remaining,
  onSave,
  onNext,
  onClose,
}: CorrectionScreenProps) {
  const [draft, setDraft] = useState(worksheet);
  const [saved, setSaved] = useState(() => JSON.stringify(correctionsOf(worksheet)));
  const [savedAt, setSavedAt] = useState(correctedAt);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const dirty = useMemo(() => JSON.stringify(correctionsOf(draft)) !== saved, [draft, saved]);
  const { correct, total } = worksheetScore(draft);
  const operation = draft.operations[index];
  const answer = draft.answers[operation.id];
  const teacherStrokes = answer?.teacherStrokes ?? [];
  const given = answer?.given ?? '';
  const ok = isAnswerCorrect(given, operation.expected);

  const setTeacherStrokes = (strokes: Stroke[]) => {
    setJustSaved(false);
    setDraft((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [operation.id]: {
          given: current.answers[operation.id]?.given ?? '',
          strokes: current.answers[operation.id]?.strokes ?? [],
          teacherStrokes: strokes,
        },
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(draft);
      setSaved(JSON.stringify(correctionsOf(draft)));
      setSavedAt(new Date().toISOString());
      setJustSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const savePdf = () =>
    downloadBytes(worksheetToPdf(draft), worksheetFileName(draft), 'application/pdf');

  const tool =
    'flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Correction</p>
            <h1 className="text-2xl font-bold text-slate-800 truncate">{draft.name}</h1>
            <p className="text-sm text-slate-500">
              Opérations posées · {formatFrenchDate(draft.createdAt)} · {correct} / {total} juste
              {correct > 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (dirty ? setConfirmLeave(true) : onClose())}
            className="shrink-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
          >
            Fermer
          </button>
        </header>

        {confirmLeave && (
          <div role="alert" className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 flex flex-col gap-3">
            <p className="text-sm text-amber-900">
              Vos annotations ne sont pas enregistrées : elles seront perdues.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="flex-1 rounded-xl bg-violet-500 py-3 text-sm font-bold text-white"
              >
                Rester
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600"
              >
                Quitter sans enregistrer
              </button>
            </div>
          </div>
        )}

        <p className={`text-sm font-medium ${savedAt ? 'text-emerald-700' : 'text-amber-700'}`}>
          {savedAt ? `✓ Corrigée le ${frenchDateTime(savedAt)}` : 'À corriger'}
          {dirty && savedAt ? ' — modifications non enregistrées' : ''}
        </p>

        <nav aria-label="Opérations de la feuille" className="flex gap-2">
          {draft.operations.map((entry, position) => {
            const entryOk = isAnswerCorrect(draft.answers[entry.id]?.given ?? '', entry.expected);
            const annotated = (draft.answers[entry.id]?.teacherStrokes ?? []).length > 0;
            return (
              <button
                key={entry.id}
                type="button"
                aria-current={position === index ? 'step' : undefined}
                aria-label={`Opération ${position + 1} : ${entry.statement}, ${
                  entryOk ? 'juste' : 'à revoir'
                }${annotated ? ', annotée' : ''}`}
                onClick={() => setIndex(position)}
                className={`relative flex-1 rounded-xl py-2 text-base font-bold border-2 ${
                  position === index ? 'border-violet-500' : 'border-transparent'
                } ${entryOk ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}
              >
                {position + 1}
                <span aria-hidden="true" className="ml-1 text-xs">
                  {entryOk ? '✓' : '✗'}
                </span>
                {annotated && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full ring-2 ring-white"
                    style={{ background: TEACHER_INK }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5 flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-800">{operation.statement}</h2>
            <span className="text-sm text-slate-500">
              {index + 1} / {draft.operations.length}
            </span>
          </div>

          <WritingCanvas
            strokes={teacherStrokes}
            onStrokesChange={setTeacherStrokes}
            backgroundStrokes={answer?.strokes ?? []}
            ink={TEACHER_INK}
            inkWidth={3.5}
            label={`Correction de l'opération ${operation.statement}`}
          />

          <p className="text-lg">
            <span className="text-slate-500">Réponse de l'élève : </span>
            {given ? (
              <span className={`font-bold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
                {given} {ok ? '✓' : '✗'}
              </span>
            ) : (
              <span className="text-slate-400">pas de réponse</span>
            )}
            {!ok && <span className="text-slate-500"> — attendu : {operation.expected}</span>}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              className={tool}
              disabled={teacherStrokes.length === 0}
              onClick={() => setTeacherStrokes(teacherStrokes.slice(0, -1))}
            >
              ↶ Annuler mon dernier trait
            </button>
            <button
              type="button"
              className={tool}
              disabled={teacherStrokes.length === 0}
              onClick={() => setTeacherStrokes([])}
            >
              Effacer mes traits
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" className={tool} disabled={index === 0} onClick={() => setIndex(index - 1)}>
              ← Précédente
            </button>
            <button
              type="button"
              className={tool}
              disabled={index === draft.operations.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              Suivante →
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5 flex flex-col gap-2">
          <label htmlFor="appreciation" className="text-lg font-bold text-slate-800">
            Appréciation <span className="text-sm font-normal text-slate-500">(facultative)</span>
          </label>
          <textarea
            id="appreciation"
            rows={2}
            maxLength={APPRECIATION_MAX_LENGTH}
            value={draft.appreciation ?? ''}
            placeholder="Très bien ! Attention aux retenues."
            onChange={(e) => {
              setJustSaved(false);
              setDraft({ ...draft, appreciation: e.target.value });
            }}
            className="rounded-xl border-2 border-slate-200 px-4 py-3 text-lg"
            style={{ color: TEACHER_INK }}
          />
          <p className="text-xs text-slate-400 text-right">
            {(draft.appreciation ?? '').length} / {APPRECIATION_MAX_LENGTH}
          </p>
        </section>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {justSaved && !dirty && (
          <p role="status" className="text-sm font-medium text-emerald-700">
            ✓ Correction enregistrée.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={saving || (!dirty && savedAt !== null)}
            onClick={() => void save()}
            className="w-full rounded-xl bg-violet-500 text-white text-xl font-bold py-4 disabled:bg-slate-300"
          >
            {saving ? 'Enregistrement…' : savedAt && !dirty ? 'Correction enregistrée' : 'Enregistrer la correction'}
          </button>
          {remaining > 0 && !dirty && savedAt !== null && (
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-xl bg-emerald-500 text-white text-xl font-bold py-4"
            >
              Feuille suivante ({remaining} à corriger)
            </button>
          )}
          <button
            type="button"
            onClick={savePdf}
            className="w-full rounded-xl border-2 border-violet-200 bg-white text-violet-700 text-lg font-semibold py-3"
          >
            Télécharger le PDF {savedAt || dirty ? 'corrigé' : 'de la feuille'}
          </button>
        </div>
      </div>
    </div>
  );
}
