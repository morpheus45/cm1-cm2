import { Gommette } from './ecole/Gommette';

interface ProgressBarProps {
  current: number;
  total: number;
  /** « Question » par défaut ; « Opération » pour une séance d'opérations posées. */
  label?: string;
  /** La couleur de chaque étape — celle de sa notion. */
  colors?: string[];
}

/**
 * L'avancée de la séance, en gommettes : une par question, collée une fois
 * la question faite, de la couleur de sa notion.
 */
export function ProgressBar({ current, total, label = 'Question', colors = [] }: ProgressBarProps) {
  const fallback = '#1E2A4A';
  return (
    <div className="w-full">
      <p className="mb-1 text-center text-sm font-bold text-encre-douce">
        {label} {current} sur {total}
      </p>
      <div
        className="flex flex-wrap items-center justify-center gap-[3px]"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`${label} ${current} sur ${total}`}
      >
        {Array.from({ length: total }, (_, index) => (
          <Gommette
            key={index}
            color={colors[index] ?? fallback}
            empty={index >= current}
            size={index === current - 1 ? 24 : 18}
            tilt={((index * 37) % 17) - 8}
          />
        ))}
      </div>
    </div>
  );
}
