interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <p className="text-center text-slate-500 mb-1">
        Question {current} sur {total}
      </p>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
