import type { Trimester } from '../types';

/**
 * Le calendrier scolaire officiel : la rentrée, les vacances, et les cinq
 * périodes de classe qu'elles délimitent. Les évaluations de la maîtresse s'y
 * accrochent : une évaluation de fin de période porte sur ce qui a été vu
 * jusque-là, et se fait la dernière semaine avant les vacances.
 *
 * Les dates sont celles de l'arrêté publié chaque année par le ministère
 * (education.gouv.fr, « Calendrier scolaire »). Une nouvelle année scolaire
 * s'ajoute à CALENDARS ; sans elle, l'application ne propose plus de dates,
 * mais la maîtresse peut toujours choisir la période elle-même.
 */

export type Zone = 'A' | 'B' | 'C';

export const ZONES: Zone[] = ['A', 'B', 'C'];

export const ZONE_ACADEMIES: Record<Zone, string> = {
  A: 'Besançon, Bordeaux, Clermont-Ferrand, Dijon, Grenoble, Limoges, Lyon, Poitiers',
  B: 'Aix-Marseille, Amiens, Lille, Nancy-Metz, Nantes, Nice, Normandie, Orléans-Tours, Reims, Rennes, Strasbourg',
  C: 'Créteil, Montpellier, Paris, Toulouse, Versailles',
};

/** La zone de l'école, tant que la maîtresse n'en a pas choisi une autre. */
export const DEFAULT_ZONE: Zone = 'C';

/** Des vacances : du premier jour (un samedi) au jour de la reprise. */
interface Holidays {
  from: string;
  to: string;
}

export interface SchoolCalendar {
  /** L'année de la rentrée : 2026 pour l'année 2026-2027. */
  year: number;
  /** Le premier jour de classe des élèves. */
  rentree: string;
  toussaint: Holidays;
  noel: Holidays;
  hiver: Record<Zone, Holidays>;
  printemps: Record<Zone, Holidays>;
  /** Le premier jour des grandes vacances. */
  ete: string;
}

export const CALENDARS: SchoolCalendar[] = [
  {
    year: 2026,
    rentree: '2026-09-01',
    toussaint: { from: '2026-10-17', to: '2026-11-02' },
    noel: { from: '2026-12-19', to: '2027-01-04' },
    hiver: {
      A: { from: '2027-02-13', to: '2027-03-01' },
      B: { from: '2027-02-20', to: '2027-03-08' },
      C: { from: '2027-02-06', to: '2027-02-22' },
    },
    printemps: {
      A: { from: '2027-04-10', to: '2027-04-26' },
      B: { from: '2027-04-17', to: '2027-05-03' },
      C: { from: '2027-04-03', to: '2027-04-19' },
    },
    ete: '2027-07-03',
  },
];

export type PeriodNumber = 1 | 2 | 3 | 4 | 5;

export const PERIOD_NUMBERS: PeriodNumber[] = [1, 2, 3, 4, 5];

export interface Period {
  number: PeriodNumber;
  /** Le premier jour de classe de la période. */
  start: string;
  /** Le premier jour des vacances qui la suivent. */
  end: string;
}

/** Les vacances qui ferment chaque période. */
export const PERIOD_HOLIDAYS: Record<PeriodNumber, string> = {
  1: 'la Toussaint',
  2: 'Noël',
  3: 'les vacances d\'hiver',
  4: 'les vacances de printemps',
  5: 'l\'été',
};

/** Le contenu de chaque période : l'application est découpée en trimestres. */
export function trimesterOfPeriod(period: PeriodNumber): Trimester {
  return period <= 2 ? 1 : period <= 4 ? 2 : 3;
}

/** Une date du calendrier, au format AAAA-MM-JJ, à l'heure de l'appareil. */
export function isoDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Ajoute des jours à une date AAAA-MM-JJ. */
function addDays(day: string, count: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return isoDay(new Date(year, month - 1, date + count));
}

export function calendarFor(schoolYear: number): SchoolCalendar | null {
  return CALENDARS.find((calendar) => calendar.year === schoolYear) ?? null;
}

export function periodsOf(calendar: SchoolCalendar, zone: Zone): Period[] {
  const bounds: [string, string][] = [
    [calendar.rentree, calendar.toussaint.from],
    [calendar.toussaint.to, calendar.noel.from],
    [calendar.noel.to, calendar.hiver[zone].from],
    [calendar.hiver[zone].to, calendar.printemps[zone].from],
    [calendar.printemps[zone].to, calendar.ete],
  ];
  return bounds.map(([start, end], index) => ({ number: (index + 1) as PeriodNumber, start, end }));
}

/**
 * La période d'un jour donné. Pendant les vacances, c'est celle qui vient :
 * une évaluation préparée à Noël est pour la fin de la période 3. Rien après
 * le début de l'été, ni pour une année dont le calendrier n'est pas connu.
 */
export function periodAt(date: Date, zone: Zone): Period | null {
  const day = isoDay(date);
  const schoolYear = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
  for (const year of [schoolYear, schoolYear + 1]) {
    const calendar = calendarFor(year);
    if (!calendar) continue;
    const next = periodsOf(calendar, zone).find((period) => day < period.end);
    if (next) return next;
  }
  return null;
}

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « vendredi 16 octobre » */
export function frenchDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  const value = new Date(year, month - 1, date);
  return `${DAYS[value.getDay()]} ${date === 1 ? '1er' : date} ${MONTHS[month - 1]}`;
}

const SHORT_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** « 16 oct. », « 1er sept. » : là où la place manque. */
export function shortFrenchDay(day: string): string {
  const [, month, date] = day.split('-').map(Number);
  return `${date === 1 ? '1er' : date} ${SHORT_MONTHS[month - 1]}`;
}

/** Le dernier jour de classe d'une période : la veille des vacances. */
export function lastClassDay(period: Period): string {
  return addDays(period.end, -1);
}

/** « du mardi 1er septembre au vendredi 16 octobre » */
export function periodSpanLabel(period: Period): string {
  return `du ${frenchDay(period.start)} au ${frenchDay(lastClassDay(period))}`;
}

/**
 * La semaine conseillée pour l'évaluation de fin de période : la dernière
 * avant les vacances, du lundi au vendredi.
 */
export function evaluationWeek(period: Period): { from: string; to: string } {
  // La période s'arrête un samedi : le vendredi est la veille, le lundi quatre
  // jours plus tôt.
  return { from: addDays(period.end, -5), to: addDays(period.end, -1) };
}

export function evaluationWeekLabel(period: Period): string {
  const { from, to } = evaluationWeek(period);
  return `du ${frenchDay(from)} au ${frenchDay(to)}`;
}
