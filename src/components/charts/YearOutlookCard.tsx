import { DOMAIN_LABELS } from '../../types';
import { MASTERY_COLORS, MASTERY_SHORT, type DomainSummary, type YearOutlook } from '../../lib/results';

/** Le niveau à partir duquel une notion compte comme tenue en fin d'année. */
export const END_OF_YEAR_TARGET = 3;

function Line({ summary }: { summary: DomainSummary }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2 text-sm text-slate-700">
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ background: summary.mastery ? MASTERY_COLORS[summary.mastery] : '#cbd5e1' }}
        />
        {DOMAIN_LABELS[summary.domain]}
      </span>
      <span className="text-xs text-slate-500 shrink-0">
        {summary.mastery ? MASTERY_SHORT[summary.mastery] : 'pas assez travaillé'}
        {summary.ratio !== null && ` · ${Math.round(summary.ratio * 100)} %`}
      </span>
    </li>
  );
}

/**
 * Ce qui est tenu, ce qui reste à reprendre, mesuré aux attendus de fin
 * d'année. « Tenu » veut dire ici : niveau satisfaisant ou très bon.
 */
export function YearOutlookCard({
  outlook,
  total,
}: {
  outlook: YearOutlook;
  total: number;
}) {
  const reached = outlook.acquired.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        <span className="font-bold text-slate-800">
          {reached} notion{reached > 1 ? 's' : ''} sur {total}
        </span>{' '}
        {reached > 1 ? 'sont' : 'est'} au niveau attendu en fin d'année.
      </p>

      {outlook.toRevise.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">À reprendre en priorité</h3>
          <ul className="divide-y divide-slate-100">
            {outlook.toRevise.map((summary) => (
              <Line key={summary.domain} summary={summary} />
            ))}
          </ul>
          <p className="text-xs text-slate-400 mt-2">
            Une séance « Révision ciblée » travaille en priorité ces notions-là.
          </p>
        </div>
      )}

      {outlook.acquired.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Acquis</h3>
          <ul className="divide-y divide-slate-100">
            {outlook.acquired.map((summary) => (
              <Line key={summary.domain} summary={summary} />
            ))}
          </ul>
        </div>
      )}

      {outlook.untested.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Pas encore évalué</h3>
          <ul className="divide-y divide-slate-100">
            {outlook.untested.map((summary) => (
              <Line key={summary.domain} summary={summary} />
            ))}
          </ul>
          <p className="text-xs text-slate-400 mt-2">
            Un niveau n'est annoncé qu'à partir de huit exercices dans la notion.
          </p>
        </div>
      )}
    </div>
  );
}
