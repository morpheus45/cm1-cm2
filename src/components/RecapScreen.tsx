interface RecapScreenProps {
  score: number;
  total: number;
  totalStars: number;
  onRestart: () => void;
  onFinish: () => void;
}

export function RecapScreen({ score, total, totalStars, onRestart, onFinish }: RecapScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-sky-50 px-4 py-8">
      <h2 className="text-3xl font-bold text-slate-700">Session terminée !</h2>
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
