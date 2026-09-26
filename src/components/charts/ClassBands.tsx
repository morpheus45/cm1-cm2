import { DOMAIN_LABELS } from '../../types';
import type { Domain } from '../../types';
import { MASTERY_COLORS, MASTERY_SHORT, type Mastery } from '../../lib/results';

const LEVELS: Mastery[] = [1, 2, 3, 4];

export interface ClassBand {
  domain: Domain;
  /** Part de la classe à chaque niveau, de 1 à 4. Le total vaut 100. */
  distribution: Record<Mastery, number>;
  pupilMastery: Mastery | null;
  pupilName: string;
}

/**
 * La répartition de la classe, notion par notion, dans le style des
 * évaluations nationales : chaque bande montre où se situent les élèves, et un
 * repère indique celui qu'on regarde.
 *
 * Le repère est posé au milieu de la bande de son niveau — pas à sa position
 * exacte dans le groupe, qui n'aurait aucun sens : deux élèves du même niveau
 * ne sont pas classés entre eux.
 */
export function ClassBands({ bands, pupilCount }: { bands: ClassBand[]; pupilCount: number }) {
  if (bands.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-8 text-center">
        Cette vue compare l'élève au reste de la classe. Elle apparaîtra quand
        plusieurs élèves auront travaillé.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bands.map((band) => {
        const total = LEVELS.reduce((sum, level) => sum + band.distribution[level], 0) || 1;
        let offset = 0;
        const markerAt = LEVELS.reduce<number | null>((found, level) => {
          const width = (band.distribution[level] / total) * 100;
          const middle = offset + width / 2;
          offset += width;
          return band.pupilMastery === level ? middle : found;
        }, null);

        return (
          <div key={band.domain}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-sm font-semibold text-slate-700">
                {DOMAIN_LABELS[band.domain]}
              </span>
              <span className="text-xs text-slate-500">
                {band.pupilName} :{' '}
                {band.pupilMastery ? MASTERY_SHORT[band.pupilMastery] : 'pas encore évalué'}
              </span>
            </div>
            <div className="flex h-7 rounded-md overflow-hidden gap-[2px]">
              {LEVELS.map((level) => {
                const share = (band.distribution[level] / total) * 100;
                if (share === 0) return null;
                return (
                  <span
                    key={level}
                    className="flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ width: `${share}%`, background: MASTERY_COLORS[level] }}
                  >
                    {share >= 9 ? Math.round(share) : ''}
                  </span>
                );
              })}
            </div>
            <div className="relative h-4">
              {markerAt !== null && (
                <span
                  className="absolute -translate-x-1/2 top-px text-[11px] font-bold text-slate-800 whitespace-nowrap"
                  style={{ left: `${markerAt}%` }}
                >
                  <span className="absolute left-1/2 -translate-x-1/2 -top-[7px] w-0 h-0 border-x-[5px] border-x-transparent border-b-[6px] border-b-slate-800" />
                  {band.pupilName}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 border-t border-slate-200">
        {LEVELS.map((level) => (
          <span key={level} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm" style={{ background: MASTERY_COLORS[level] }} />
            {level} · {MASTERY_SHORT[level]}
          </span>
        ))}
        <span className="w-full text-xs text-slate-400">
          Chiffres en % des {pupilCount} élèves évalués. Sur un petit effectif, un
          pourcentage pèse lourd : à deux élèves, un seul fait 50 %.
        </span>
      </div>
    </div>
  );
}
