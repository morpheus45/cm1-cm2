import { DOMAIN_LABELS } from '../../types';
import { MASTERY_COLORS, MASTERY_LABELS, MASTERY_SHORT, type DomainSummary, type Mastery } from '../../lib/results';

const LEVELS: Mastery[] = [1, 2, 3, 4];

/**
 * L'échelle à quatre niveaux du livret scolaire unique.
 *
 * Le niveau atteint est toujours écrit en toutes lettres à côté de la barre,
 * et chaque case porte son numéro : la couleur ne porte jamais le sens seule.
 */
export function MasteryScale({ summaries }: { summaries: DomainSummary[] }) {
  return (
    <div className="flex flex-col gap-3">
      {summaries.map((summary) => (
        <div key={summary.domain}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-sm font-semibold text-encre">
              {DOMAIN_LABELS[summary.domain]}
            </span>
            <span className="text-xs text-encre-douce text-right">
              {summary.mastery
                ? MASTERY_LABELS[summary.mastery]
                : summary.total === 0
                  ? 'jamais travaillé'
                  : `pas assez d'exercices (${summary.total})`}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-[3px]">
            {LEVELS.map((level) => {
              const reached = summary.mastery === level;
              return (
                <span
                  key={level}
                  title={MASTERY_LABELS[level]}
                  className="h-6 rounded flex items-center justify-center text-xs font-bold"
                  style={
                    reached
                      ? { background: MASTERY_COLORS[level], color: '#ffffff' }
                      : { background: '#eceef1', color: '#585d70' }
                  }
                >
                  {level}
                </span>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 mt-1 border-t border-encre/15">
        {LEVELS.map((level) => (
          <span key={level} className="flex items-center gap-1.5 text-xs text-encre-douce">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ background: MASTERY_COLORS[level] }}
            />
            {level} · {MASTERY_SHORT[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
