import type { Figure, Ink, Point, Shape } from '../../lib/figures';

const INK = '#1E2A4A';
const PALE = '#8C96A8';
/** Le papier d'une figure : celui de la fiche, un peu plus clair que la page. */
const FILL = '#FFFFFF';

interface FigureViewProps {
  figure: Figure;
  /** La couleur de la notion : ce que la question désigne. */
  accent: string;
  className?: string;
}

const path = (points: Point[], closed: boolean) =>
  points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + (closed ? ' Z' : '');

/** Le point d'angle `degrees` (sens direct, 0 à droite) sur le cercle, à
 *  l'écran (y vers le bas). */
const onCircle = ([cx, cy]: Point, r: number, degrees: number): Point => [
  cx + r * Math.cos((degrees * Math.PI) / 180),
  cy - r * Math.sin((degrees * Math.PI) / 180),
];

function unit([ax, ay]: Point, [bx, by]: Point): Point {
  const length = Math.hypot(bx - ax, by - ay) || 1;
  return [(bx - ax) / length, (by - ay) / length];
}

/**
 * Trace une figure d'exercice : l'encre du cahier, la couleur de la notion
 * pour ce que la question désigne, le gris pour les arêtes cachées.
 */
export function FigureView({ figure, accent, className }: FigureViewProps) {
  const color = (ink: Ink | undefined) => (ink === 'couleur' ? accent : ink === 'pale' ? PALE : INK);

  const draw = (shape: Shape, key: number) => {
    const stroke = color(shape.ink);
    const common = { stroke, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (shape.kind) {
      case 'segment':
        return (
          <line
            key={key}
            x1={shape.from[0]}
            y1={shape.from[1]}
            x2={shape.to[0]}
            y2={shape.to[1]}
            {...common}
            strokeWidth={shape.width ?? 2.5}
            strokeDasharray={shape.dashed ? '7 6' : undefined}
          />
        );
      case 'polygon':
      case 'polyline':
        return (
          <path
            key={key}
            d={path(shape.points, shape.kind === 'polygon')}
            {...common}
            fill={shape.kind === 'polygon' && shape.fill ? FILL : 'none'}
            strokeWidth={shape.kind === 'polyline' ? (shape.width ?? 2.5) : 2.5}
            strokeDasharray={shape.dashed ? '7 6' : undefined}
          />
        );
      case 'circle':
        return (
          <circle
            key={key}
            cx={shape.center[0]}
            cy={shape.center[1]}
            r={shape.radius}
            {...common}
            fill={shape.fill ? stroke : 'none'}
            strokeWidth={2.5}
          />
        );
      case 'ellipse': {
        const [cx, cy] = shape.center;
        const { rx, ry } = shape;
        if (!shape.half) {
          return <ellipse key={key} cx={cx} cy={cy} rx={rx} ry={ry} {...common} strokeWidth={2.5} strokeDasharray={shape.dashed ? '7 6' : undefined} />;
        }
        // La moitié basse est celle qu'on voit ; la moitié haute, derrière.
        const sweep = shape.half === 'bas' ? 0 : 1;
        return (
          <path
            key={key}
            d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 ${sweep} ${cx + rx} ${cy}`}
            {...common}
            strokeWidth={2.5}
            strokeDasharray={shape.dashed ? '7 6' : undefined}
          />
        );
      }
      case 'arc': {
        const [sx, sy] = onCircle(shape.center, shape.radius, shape.from);
        const [ex, ey] = onCircle(shape.center, shape.radius, shape.to);
        const large = Math.abs(shape.to - shape.from) > 180 ? 1 : 0;
        const sweep = shape.to > shape.from ? 0 : 1;
        return (
          <path
            key={key}
            d={`M ${sx} ${sy} A ${shape.radius} ${shape.radius} 0 ${large} ${sweep} ${ex} ${ey}`}
            {...common}
            strokeWidth={2.5}
          />
        );
      }
      case 'point':
        return <circle key={key} cx={shape.at[0]} cy={shape.at[1]} r={3.5} fill={stroke} />;
      case 'text':
        return (
          <text
            key={key}
            x={shape.at[0]}
            y={shape.at[1]}
            fill={stroke}
            fontSize={shape.size ?? 15}
            fontWeight={shape.bold ? 700 : 400}
            textAnchor={shape.anchor ?? 'start'}
            fontFamily="inherit"
          >
            {shape.text}
          </text>
        );
      case 'angleDroit': {
        const size = shape.size ?? 11;
        const u = unit(shape.corner, shape.towards[0]);
        const v = unit(shape.corner, shape.towards[1]);
        const [cx, cy] = shape.corner;
        const points: Point[] = [
          [cx + u[0] * size, cy + u[1] * size],
          [cx + (u[0] + v[0]) * size, cy + (u[1] + v[1]) * size],
          [cx + v[0] * size, cy + v[1] * size],
        ];
        return <path key={key} d={path(points, false)} {...common} strokeWidth={2} />;
      }
      case 'codage': {
        const [ax, ay] = shape.from;
        const [bx, by] = shape.to;
        const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
        const [dx, dy] = unit(shape.from, shape.to);
        const [nx, ny] = [-dy, dx];
        return (
          <g key={key}>
            {Array.from({ length: shape.count }, (_, index) => {
              const offset = (index - (shape.count - 1) / 2) * 5;
              const [px, py] = [mx + dx * offset, my + dy * offset];
              return (
                <line key={index} x1={px - nx * 7} y1={py - ny * 7} x2={px + nx * 7} y2={py + ny * 7} {...common} strokeWidth={2.2} />
              );
            })}
          </g>
        );
      }
      case 'etoile': {
        const [cx, cy] = shape.at;
        const points = Array.from({ length: 10 }, (_, index) =>
          onCircle([cx, cy], index % 2 === 0 ? shape.radius : shape.radius * 0.45, 90 + index * 36)
        );
        return <path key={key} d={path(points, true)} fill={stroke} stroke={stroke} strokeWidth={1} strokeLinejoin="round" />;
      }
      case 'quadrillage': {
        const [ox, oy] = shape.origin;
        const lines = [];
        for (let col = 0; col <= shape.cols; col++) {
          lines.push(<line key={`c${col}`} x1={ox + col * shape.cell} y1={oy} x2={ox + col * shape.cell} y2={oy + shape.rows * shape.cell} stroke={PALE} strokeWidth={1.5} />);
        }
        for (let row = 0; row <= shape.rows; row++) {
          lines.push(<line key={`r${row}`} x1={ox} y1={oy + row * shape.cell} x2={ox + shape.cols * shape.cell} y2={oy + row * shape.cell} stroke={PALE} strokeWidth={1.5} />);
        }
        return <g key={key}>{lines}</g>;
      }
    }
  };

  return (
    <svg
      viewBox={`0 0 ${figure.width} ${figure.height}`}
      className={className}
      role="img"
      aria-label={figure.alt}
    >
      {figure.shapes.map(draw)}
    </svg>
  );
}
