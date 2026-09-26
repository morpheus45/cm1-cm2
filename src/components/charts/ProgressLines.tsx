import { DOMAIN_LABELS } from '../../types';
import type { Domain } from '../../types';
import type { SessionPoint } from '../../lib/results';

const WIDTH = 340;
const HEIGHT = 210;
const LEFT = 44;
const RIGHT = 330;
const TOP = 20;
const BOTTOM = 172;

/** Les trois premières teintes de la palette : ce sont les seules qui se
 *  distinguent les unes des autres pour tous les types de daltonisme. */
const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a'];

export interface ProgressSeries {
  domain: Domain;
  points: SessionPoint[];
}

/** Abscisse d'une date dans l'intervalle couvert par les séances. */
function xOf(time: number, from: number, to: number): number {
  if (to <= from) return (LEFT + RIGHT) / 2;
  return LEFT + 12 + ((RIGHT - LEFT - 24) * (time - from)) / (to - from);
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

function yOf(ratio: number): number {
  return BOTTOM - (BOTTOM - TOP) * Math.min(1, Math.max(0, ratio));
}

/**
 * La progression séance après séance. Ce n'est pas un format officiel, mais
 * c'est le seul des quatre qui répond à « est-ce que ça s'améliore ? ».
 *
 * Trois notions au plus : au-delà, les courbes se croisent trop pour rester
 * lisibles sur un téléphone.
 */
export function ProgressLines({ series }: { series: ProgressSeries[] }) {
  const shown = series.filter((entry) => entry.points.length > 0).slice(0, 3);
  const times = shown.flatMap((entry) => entry.points.map((point) => new Date(point.at).getTime()));

  if (shown.length === 0 || times.length < 2) {
    return (
      <p className="text-sm text-slate-400 py-8 text-center">
        La courbe apparaîtra après deux séances.
      </p>
    );
  }

  // Les séances sont placées à leur vraie date, pas numérotées : deux notions
  // travaillées des jours différents ne doivent pas se retrouver au même
  // endroit de l'axe.
  const from = Math.min(...times);
  const to = Math.max(...times);
  const firstIso = shown.flatMap((e) => e.points).reduce((a, b) => (a.at <= b.at ? a : b)).at;
  const lastIso = shown.flatMap((e) => e.points).reduce((a, b) => (a.at >= b.at ? a : b)).at;

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Progression séance après séance"
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={LEFT}
            y1={yOf(ratio)}
            x2={RIGHT}
            y2={yOf(ratio)}
            stroke="#e1e0d9"
            strokeWidth="1"
          />
        ))}
        <line x1={LEFT} y1={BOTTOM} x2={RIGHT} y2={BOTTOM} stroke="#c3c2b7" strokeWidth="1" />

        <g fontSize="11" fill="#898781" textAnchor="end">
          {[
            [1, '100%'],
            [0.75, '75'],
            [0.5, '50'],
            [0.25, '25'],
            [0, '0'],
          ].map(([ratio, label]) => (
            <text key={String(label)} x={LEFT - 8} y={yOf(Number(ratio)) + 4}>
              {label}
            </text>
          ))}
        </g>

        <g fontSize="11" fill="#898781">
          <text x={LEFT + 12} y={BOTTOM + 20} textAnchor="middle">
            {shortDate(firstIso)}
          </text>
          <text x={RIGHT - 12} y={BOTTOM + 20} textAnchor="middle">
            {shortDate(lastIso)}
          </text>
        </g>

        {shown.map((entry, seriesIndex) => {
          const color = SERIES_COLORS[seriesIndex];
          const points = entry.points
            .map((point) => `${xOf(new Date(point.at).getTime(), from, to)},${yOf(point.ratio)}`)
            .join(' ');
          const first = entry.points[0];
          const last = entry.points[entry.points.length - 1];
          const lastX = xOf(new Date(last.at).getTime(), from, to);
          return (
            <g key={entry.domain}>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={xOf(new Date(first.at).getTime(), from, to)}
                cy={yOf(first.ratio)}
                r="4"
                fill={color}
              />
              <circle cx={lastX} cy={yOf(last.ratio)} r="4.5" fill={color} />
              <text
                x={Math.min(lastX, RIGHT - 4)}
                y={yOf(last.ratio) - 10}
                textAnchor="end"
                fontSize="11.5"
                fontWeight="700"
                fill={color}
                paintOrder="stroke"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                {DOMAIN_LABELS[entry.domain].split(' ')[0]} {Math.round(last.ratio * 100)}%
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 justify-center">
        {shown.map((entry, index) => (
          <span key={entry.domain} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: SERIES_COLORS[index] }} />
            {DOMAIN_LABELS[entry.domain]}
          </span>
        ))}
      </div>
    </div>
  );
}
