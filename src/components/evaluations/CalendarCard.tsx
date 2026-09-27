import {
  calendarFor,
  evaluationWeekLabel,
  PERIOD_HOLIDAYS,
  periodAt,
  periodSpanLabel,
  periodsOf,
  ZONE_ACADEMIES,
  ZONES,
  type Zone,
} from '../../lib/calendrier';
import { schoolYearLabel, schoolYearOf } from '../../lib/results';

const fiche =
  'flex flex-col gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10';

/**
 * Le calendrier de l'année, zone par zone : les cinq périodes, celle en
 * cours, et la semaine conseillée pour l'évaluation de fin de période — la
 * dernière avant les vacances.
 */
export function CalendarCard({
  zone,
  busy,
  onZone,
  today = new Date(),
}: {
  zone: Zone;
  busy: boolean;
  onZone: (zone: Zone) => void;
  today?: Date;
}) {
  const year = schoolYearOf(today.toISOString());
  const calendar = calendarFor(year);
  const current = periodAt(today, zone);
  const periods = calendar ? periodsOf(calendar, zone) : [];

  return (
    <section className={fiche} aria-labelledby="calendrier-titre">
      <h2 id="calendrier-titre" className="text-lg font-bold text-encre">
        Calendrier {schoolYearLabel(year)}
      </h2>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Zone de vacances de l'école">
          {ZONES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              disabled={busy}
              aria-pressed={candidate === zone}
              onClick={() => candidate !== zone && onZone(candidate)}
              className={`etiquette flex-1 px-3 py-2 text-sm ${candidate === zone ? '!bg-encre !text-white' : ''}`}
            >
              Zone {candidate}
            </button>
          ))}
        </div>
        <p className="text-xs text-encre-douce">Académies de la zone {zone} : {ZONE_ACADEMIES[zone]}.</p>
      </div>
      {calendar ? (
        <ol className="flex flex-col gap-2">
          {periods.map((period) => {
            const now = current?.number === period.number;
            return (
              <li
                key={period.number}
                className={`rounded-xl border-2 px-3 py-2 ${now ? 'border-encre bg-white' : 'border-encre/10'}`}
              >
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-encre">
                  <strong>Période {period.number}</strong>
                  <span className="text-encre-douce">{periodSpanLabel(period)}</span>
                  {now && (
                    <span className="rounded-full bg-encre px-2 py-0.5 text-xs font-bold text-white">en ce moment</span>
                  )}
                </p>
                <p className="text-xs text-encre-douce">
                  Évaluation conseillée {evaluationWeekLabel(period)}, avant {PERIOD_HOLIDAYS[period.number]}.
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-encre-douce">
          Les dates de l'année {schoolYearLabel(year)} ne sont pas encore dans l'application. Vous pouvez tout de même
          choisir la période de chaque évaluation.
        </p>
      )}
    </section>
  );
}
