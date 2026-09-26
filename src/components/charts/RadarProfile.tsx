import { DOMAIN_LABELS } from '../../types';
import { MASTERY_THRESHOLDS, type DomainSummary } from '../../lib/results';

// La toile est plus large que haute : les étiquettes des axes de gauche et de
// droite partent vers l'extérieur et ont besoin de place, sans quoi
// « Orthographe » et « Problèmes » se retrouvent rognés.
const WIDTH = 400;
const HEIGHT = 330;
const CX = WIDTH / 2;
const CY = 152;
const RADIUS = 92;
const LABEL_RADIUS = 1.3;
const PUPIL = '#2a78d6';
const CLASS = '#898781';

function pointAt(index: number, count: number, ratio: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return [CX + Math.cos(angle) * RADIUS * ratio, CY + Math.sin(angle) * RADIUS * ratio];
}

function polygon(values: number[]): string {
  return values.map((value, index) => pointAt(index, values.length, value).join(',')).join(' ');
}

/**
 * Le profil en toile d'araignée : les six notions d'un coup d'œil.
 *
 * Les anneaux ne sont pas décoratifs — ils sont posés sur les seuils des
 * quatre niveaux de maîtrise. Une pointe qui dépasse le troisième anneau est
 * donc une notion « satisfaisante », ce qui rattache la toile à l'échelle du
 * livret plutôt que d'inventer une lecture de plus.
 */
export function RadarProfile({
  summaries,
  classAverages,
}: {
  summaries: DomainSummary[];
  classAverages?: Array<number | null>;
}) {
  const values = summaries.map((summary) => summary.ratio ?? 0);
  const missing = summaries.filter((summary) => summary.ratio === null);
  const rings = MASTERY_THRESHOLDS.filter((step) => step.min > 0).map((step) => step.min);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Profil par notion"
      >
        {/* anneaux posés sur les seuils des niveaux, plus le tour complet */}
        {[...rings, 1].map((ring) => (
          <polygon
            key={ring}
            points={polygon(summaries.map(() => ring))}
            fill="none"
            stroke={ring === 1 ? '#c3c2b7' : '#e1e0d9'}
            strokeWidth="1"
          />
        ))}
        {summaries.map((summary, index) => {
          const [x, y] = pointAt(index, summaries.length, 1);
          return (
            <line
              key={summary.domain}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="#e1e0d9"
              strokeWidth="1"
            />
          );
        })}

        {classAverages && (
          <polygon
            points={polygon(classAverages.map((value) => value ?? 0))}
            fill="none"
            stroke={CLASS}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        )}

        <polygon
          points={polygon(values)}
          fill={PUPIL}
          fillOpacity="0.16"
          stroke={PUPIL}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {summaries.map((summary, index) => {
          const [x, y] = pointAt(index, summaries.length, summary.ratio ?? 0);
          const known = summary.ratio !== null;
          return (
            <circle
              key={summary.domain}
              cx={x}
              cy={y}
              r="4"
              fill={known ? PUPIL : '#ffffff'}
              stroke={known ? PUPIL : '#898781'}
              strokeWidth="1.5"
            />
          );
        })}

        {summaries.map((summary, index) => {
          const [x, y] = pointAt(index, summaries.length, LABEL_RADIUS);
          const anchor = x < CX - 6 ? 'end' : x > CX + 6 ? 'start' : 'middle';
          return (
            <text key={summary.domain} x={x} y={y} textAnchor={anchor} fontSize="11">
              <tspan fill="#52514e" fontWeight="600">
                {DOMAIN_LABELS[summary.domain].split(' ')[0]}
              </tspan>
              <tspan x={x} dy="13" fill="#898781">
                {summary.ratio === null ? '—' : `${Math.round(summary.ratio * 100)} %`}
              </tspan>
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: PUPIL }} />
          L'élève
        </span>
        {classAverages && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 border-t-2 border-dashed" style={{ borderColor: CLASS }} />
            Moyenne de la classe
          </span>
        )}
        {missing.length > 0 && (
          <span className="w-full text-center text-slate-400">
            {missing.length === 1
              ? `${DOMAIN_LABELS[missing[0].domain]} n'a jamais été travaillé.`
              : `${missing.length} notions n'ont jamais été travaillées.`}
          </span>
        )}
      </div>
    </div>
  );
}
