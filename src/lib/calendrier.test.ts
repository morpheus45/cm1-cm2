import { describe, expect, it } from 'vitest';
import {
  CALENDARS,
  calendarFor,
  evaluationWeekLabel,
  frenchDay,
  lastClassDay,
  periodAt,
  periodSpanLabel,
  shortFrenchDay,
  periodsOf,
  trimesterOfPeriod,
  ZONES,
} from './calendrier';

const at = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 10);
};

describe('le calendrier scolaire', () => {
  it('découpe l\'année 2026-2027 en cinq périodes, zone par zone', () => {
    const periods = periodsOf(calendarFor(2026)!, 'C');
    expect(periods.map((period) => [period.start, period.end])).toEqual([
      ['2026-09-01', '2026-10-17'],
      ['2026-11-02', '2026-12-19'],
      ['2027-01-04', '2027-02-06'],
      ['2027-02-22', '2027-04-03'],
      ['2027-04-19', '2027-07-03'],
    ]);
    expect(periodsOf(calendarFor(2026)!, 'A')[2].end).toBe('2027-02-13');
    expect(periodsOf(calendarFor(2026)!, 'B')[3].end).toBe('2027-04-17');
  });

  it('a des dates qui se suivent, sans chevauchement, dans chaque zone', () => {
    CALENDARS.forEach((calendar) =>
      ZONES.forEach((zone) => {
        const periods = periodsOf(calendar, zone);
        periods.forEach((period, index) => {
          expect(period.start < period.end, `${zone} P${period.number}`).toBe(true);
          if (index > 0) expect(periods[index - 1].end < period.start).toBe(true);
        });
      })
    );
  });

  it('trouve la période du jour, et celle qui vient pendant les vacances', () => {
    expect(periodAt(at('2026-09-27'), 'C')?.number).toBe(1);
    expect(periodAt(at('2026-10-20'), 'C')?.number).toBe(2);
    // Le 10 février 2027, la zone C est en vacances d'hiver, pas la zone A.
    expect(periodAt(at('2027-02-10'), 'C')?.number).toBe(4);
    expect(periodAt(at('2027-02-10'), 'A')?.number).toBe(3);
    expect(periodAt(at('2027-07-10'), 'C')).toBeNull();
  });

  it('associe chaque période au trimestre de l\'application', () => {
    expect([1, 2, 3, 4, 5].map((period) => trimesterOfPeriod(period as 1 | 2 | 3 | 4 | 5))).toEqual([1, 1, 2, 2, 3]);
  });

  it('conseille la dernière semaine avant les vacances', () => {
    const periods = periodsOf(calendarFor(2026)!, 'C');
    expect(evaluationWeekLabel(periods[0])).toBe('du lundi 12 octobre au vendredi 16 octobre');
    expect(evaluationWeekLabel(periods[3])).toBe('du lundi 29 mars au vendredi 2 avril');
    expect(frenchDay('2027-04-01')).toBe('jeudi 1er avril');
  });

  it('écrit chaque période, de la rentrée à la veille des vacances', () => {
    const periods = periodsOf(calendarFor(2026)!, 'C');
    expect(periodSpanLabel(periods[0])).toBe('du mardi 1er septembre au vendredi 16 octobre');
    expect(periodSpanLabel(periods[4])).toBe('du lundi 19 avril au vendredi 2 juillet');
    expect(shortFrenchDay(periods[0].start)).toBe('1er sept.');
    expect(shortFrenchDay(lastClassDay(periods[1]))).toBe('18 déc.');
  });
});
