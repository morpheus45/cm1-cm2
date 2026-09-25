import type { Subject } from '../types';
import { SUBJECT_LABELS } from '../types';

interface RecapScreenProps {
  name?: string;
  subject: Subject;
  score: number;
  total: number;
  totalStars: number;
  onRestart: () => void;
  onFinish: () => void;
}

export function RecapScreen({
  name,
  subject,
  score,
  total,
  totalStars,
  onRestart,
  onFinish,
}: RecapScreenProps) {
  // Féliciter un enfant qui s'est trompé huit fois sur huit sonne faux : le
  // titre suit le score, sans jamais le lui reprocher.
  const ratio = total > 0 ? score / total : 0;
  const who = name ? ` ${name}` : '';
  const headline =
    ratio === 1 ? `Sans faute${who} !` : ratio >= 0.5 ? `Bravo${who} !` : `Bien essayé${who} !`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-sky-50 px-4 py-8">
      <h2 className="text-3xl font-bold text-slate-700 text-center">{headline}</h2>
      <p className="text-lg text-slate-500">
        Séance de {SUBJECT_LABELS[subject].toLowerCase()} terminée</p>
      <p className="text-2xl text-slate-600">
        Score : {score} / {total}
      </p>

      <div className="flex flex-col items-center gap-2">
        <p className="text-lg text-slate-500">Étoiles gagnées en tout : {totalStars}</p>
        <div className="flex flex-wrap justify-center gap-1 max-w-xs">
          {Array.from({ length: Math.min(totalStars, 20) }).map((_, index) => (
            <span key={index} className="text-2xl">
              ⭐
            </span>
          ))}
          {totalStars > 20 && (
            <span className="text-lg text-slate-500 self-center">+{totalStars - 20}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
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
