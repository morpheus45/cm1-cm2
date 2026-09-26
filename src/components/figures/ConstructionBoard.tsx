import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Figure, Point } from '../../lib/figures';
import {
  cellCenter,
  isConstructionRight,
  isPlacedRight,
  lineAcrossGrid,
  nodePoint,
  sameNode,
  snap,
  type Construction,
  type Node,
} from '../../lib/construction';
import { NOTION_COLORS } from '../../theme';
import { renderShape } from './FigureView';

const JUSTE = NOTION_COLORS.numeration.deep;
const A_REVOIR = NOTION_COLORS.accords.deep;
const INK = '#1E2A4A';

interface ConstructionBoardProps {
  figure: Figure;
  construction: Construction;
  /** La couleur de la notion : les points que pose l'élève. */
  accent: string;
  /** Une fois validé, la grille montre la correction et ne bouge plus. */
  validated: boolean;
  onValidate: (right: boolean) => void;
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

function starPath([cx, cy]: Point, radius: number): string {
  return Array.from({ length: 10 }, (_, index) => {
    const r = index % 2 === 0 ? radius : radius * 0.45;
    const angle = ((90 + index * 36) * Math.PI) / 180;
    return `${index === 0 ? 'M' : 'L'} ${cx + r * Math.cos(angle)} ${cy - r * Math.sin(angle)}`;
  }).join(' ') + ' Z';
}

/**
 * La grille d'une construction : l'élève y pose ses points au doigt, au
 * stylet ou au clavier (flèches, puis Entrée), les enlève en les touchant de
 * nouveau, puis valide. La correction se trace alors en vert ; ses points
 * justes restent verts, les autres passent en orange.
 */
export function ConstructionBoard({ figure, construction, accent, validated, onValidate }: ConstructionBoardProps) {
  const { grid, target, count } = construction;
  const [placed, setPlaced] = useState<Node[]>([]);
  const [cursor, setCursor] = useState<Node | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const [notice, setNotice] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  // Où le doigt s'est posé : un point ne se pose qu'au lever d'un vrai
  // toucher, pas au bout d'un glissement pour faire défiler la page.
  const pressRef = useRef<{ x: number; y: number } | null>(null);
  const maxCol = target === 'case' ? grid.cols - 1 : grid.cols;
  const maxRow = target === 'case' ? grid.rows - 1 : grid.rows;
  const where = ([col, row]: Node) => `colonne ${col + 1}, ligne ${row + 1}`;
  const markAt = (node: Node) => (target === 'case' ? cellCenter(grid, node) : nodePoint(grid, node));

  const toggle = (node: Node) => {
    if (validated) return;
    if (construction.fixed?.some((other) => sameNode(other, node))) {
      setNotice('Ce point est déjà placé : choisis-en un autre.');
      return;
    }
    if (placed.some((other) => sameNode(other, node))) {
      setPlaced(placed.filter((other) => !sameNode(other, node)));
      setNotice(`Point enlevé : ${where(node)}.`);
    } else if (count === 1) {
      // Un seul point à poser : toucher ailleurs le déplace.
      setPlaced([node]);
      setNotice(`Point posé : ${where(node)}.`);
    } else if (placed.length >= count) {
      setNotice(`Tu as déjà posé ${plural(count, 'point')}. Touche un point pour l'enlever.`);
    } else {
      setPlaced([...placed, node]);
      setNotice(`Point posé : ${where(node)}.`);
    }
  };

  const handlePointer = (event: PointerEvent<SVGSVGElement>) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (validated || !press || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) return;
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const node = snap(grid, target, [point.x, point.y]);
    if (!node) return;
    setKeyboard(false);
    setCursor(node);
    toggle(node);
  };

  const handleKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (validated) return;
    const moves: Record<string, Node> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const current = cursor ?? [Math.floor(maxCol / 2), Math.floor(maxRow / 2)];
    if (event.key in moves) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      const next: Node = [Math.min(maxCol, Math.max(0, current[0] + dx)), Math.min(maxRow, Math.max(0, current[1] + dy))];
      setKeyboard(true);
      setCursor(next);
      setNotice(where(next));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setKeyboard(true);
      setCursor(current);
      toggle(current);
    }
  };

  const right = (node: Node) => isPlacedRight(construction, node);
  const pupilColor = (node: Node) => (validated ? (right(node) ? JUSTE : A_REVOIR) : accent);
  // La droite que l'élève trace (parallèle, perpendiculaire), d'un bord à l'autre.
  const through = construction.preview?.through;
  const pupilLine = through && placed[0] ? lineAcrossGrid(grid, through, placed[0]) : null;

  return (
    <div className="flex w-full max-w-md flex-col gap-3 self-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${figure.width} ${figure.height}`}
        className="w-full touch-manipulation select-none rounded-2xl bg-white p-2 shadow-[inset_0_0_0_1px_rgba(30,42,74,0.12)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-encre"
        role="application"
        aria-roledescription="grille de construction"
        aria-label={`${figure.alt} Touche la grille pour poser un point, ou utilise les flèches puis Entrée.`}
        tabIndex={validated ? -1 : 0}
        onPointerDown={(event) => {
          pressRef.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={handlePointer}
        onPointerCancel={() => {
          pressRef.current = null;
        }}
        onKeyDown={handleKey}
        onBlur={() => setKeyboard(false)}
      >
        {figure.shapes.map((shape, key) => renderShape(shape, `f${key}`, accent))}
        {validated && construction.solution.map((shape, key) => renderShape(shape, `s${key}`, JUSTE))}
        {pupilLine && (
          <line
            x1={pupilLine[0][0]}
            y1={pupilLine[0][1]}
            x2={pupilLine[1][0]}
            y2={pupilLine[1][1]}
            stroke={validated ? (right(placed[0]) ? JUSTE : A_REVOIR) : accent}
            strokeWidth={2.5}
            strokeDasharray={validated ? undefined : '7 5'}
            strokeLinecap="round"
          />
        )}
        {placed.map((node) => {
          const at = markAt(node);
          const color = pupilColor(node);
          return construction.mark === 'etoile' ? (
            <path key={`p${node.join('-')}`} d={starPath(at, grid.cell * 0.38)} fill={color} stroke="#FFFFFF" strokeWidth={1.2} strokeLinejoin="round" />
          ) : (
            <circle key={`p${node.join('-')}`} cx={at[0]} cy={at[1]} r={6.5} fill={color} stroke="#FFFFFF" strokeWidth={2} />
          );
        })}
        {keyboard && cursor && !validated && (
          target === 'case' ? (
            <rect
              x={grid.origin[0] + cursor[0] * grid.cell + 2}
              y={grid.origin[1] + cursor[1] * grid.cell + 2}
              width={grid.cell - 4}
              height={grid.cell - 4}
              fill="none"
              stroke={INK}
              strokeWidth={2.5}
              strokeDasharray="5 4"
              rx={4}
            />
          ) : (
            <circle cx={markAt(cursor)[0]} cy={markAt(cursor)[1]} r={11} fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="5 4" />
          )
        )}
      </svg>

      <p className="text-center text-base font-bold text-encre-douce">
        {validated
          ? null
          : count === 1
            ? placed.length === 0
              ? 'Touche la grille pour poser ton point.'
              : 'Touche ailleurs pour le déplacer, ou valide.'
            : `${plural(placed.length, 'point')} sur ${count}`}
      </p>
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
      {!validated && /déjà/.test(notice) && <p className="-mt-2 text-center text-sm text-encre-douce">{notice}</p>}

      {!validated && (
        <div className="flex gap-3">
          <button
            type="button"
            className="etiquette flex-1 py-3 text-lg"
            disabled={placed.length === 0}
            onClick={() => {
              setPlaced([]);
              setNotice('Tous les points sont enlevés.');
            }}
          >
            Effacer
          </button>
          <button
            type="button"
            className="bouton-encre flex-[2] py-3 text-lg disabled:opacity-50"
            disabled={placed.length !== count}
            onClick={() => onValidate(isConstructionRight(construction, placed))}
          >
            Valider
          </button>
        </div>
      )}
    </div>
  );
}
