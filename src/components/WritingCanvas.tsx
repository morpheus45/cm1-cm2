import { useCallback, useEffect, useRef, useState } from 'react';
import { WRITING_COLUMNS, type Stroke } from '../lib/worksheet';

interface WritingCanvasProps {
  strokes: Stroke[];
  onStrokesChange?: (strokes: Stroke[]) => void;
  /** Traits d'une autre main — la correction de la maîtresse — par-dessus. */
  overlayStrokes?: Stroke[];
  readOnly?: boolean;
  ink?: string;
}

const GRID_COLOR = '#d7e3ef';
const FRAME_COLOR = '#9fb6cc';
const DEFAULT_INK = '#1f2937';

/**
 * Le cahier de l'élève : un cadre à petits carreaux sur lequel on écrit au
 * doigt ou au stylet.
 *
 * Les traits sont retenus en fractions du cadre (0 à 1), jamais en pixels :
 * la même opération posée se redessine alors identiquement sur un téléphone,
 * sur la tablette de la maîtresse et sur le PDF imprimé.
 */
export function WritingCanvas({
  strokes,
  onStrokesChange,
  overlayStrokes,
  readOnly = false,
  ink = DEFAULT_INK,
}: WritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const drawing = useRef<Stroke | null>(null);

  // Le canevas a besoin d'une taille en pixels réels ; l'observateur la suit
  // quand l'écran tourne ou que le clavier s'ouvre.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size.width, size.height);

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);

    const step = size.width / WRITING_COLUMNS;
    context.strokeStyle = GRID_COLOR;
    context.lineWidth = 1;
    context.beginPath();
    for (let x = step; x < size.width; x += step) {
      context.moveTo(Math.round(x) + 0.5, 0);
      context.lineTo(Math.round(x) + 0.5, size.height);
    }
    for (let y = step; y < size.height; y += step) {
      context.moveTo(0, Math.round(y) + 0.5);
      context.lineTo(size.width, Math.round(y) + 0.5);
    }
    context.stroke();

    context.strokeStyle = FRAME_COLOR;
    context.lineWidth = 2;
    context.strokeRect(1, 1, size.width - 2, size.height - 2);

    const paint = (list: Stroke[], color: string, width: number) => {
      context.strokeStyle = color;
      context.lineWidth = width;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      list.forEach((stroke) => {
        if (stroke.points.length === 0) return;
        context.beginPath();
        stroke.points.forEach(([x, y], index) => {
          const px = x * size.width;
          const py = y * size.height;
          if (index === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        });
        if (stroke.points.length === 1) {
          const [x, y] = stroke.points[0];
          context.lineTo(x * size.width + 0.1, y * size.height);
        }
        context.stroke();
      });
    };

    paint(strokes, ink, 3);
    if (overlayStrokes) paint(overlayStrokes, '#dc2626', 3.5);
  }, [size, strokes, overlayStrokes, ink]);

  useEffect(redraw, [redraw]);

  const pointFrom = (event: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onStrokesChange) return;
    // Une paume posée sur l'écran ne doit pas écrire : dès qu'un stylet est
    // utilisé, on ignore les contacts du doigt.
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = { points: [pointFrom(event)] };
    onStrokesChange([...strokes, drawing.current]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onStrokesChange || !drawing.current) return;
    const next = pointFrom(event);
    const points = drawing.current.points;
    const last = points[points.length - 1];
    // Un point tous les demi-pour-cent suffit : inutile d'alourdir le PDF.
    if (Math.abs(next[0] - last[0]) < 0.004 && Math.abs(next[1] - last[1]) < 0.004) return;
    drawing.current = { points: [...points, next] };
    onStrokesChange([...strokes.slice(0, -1), drawing.current]);
  };

  const handlePointerUp = () => {
    drawing.current = null;
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: '4 / 3' }}>
      <canvas
        ref={canvasRef}
        aria-label="Zone pour poser l'opération"
        className="absolute inset-0 h-full w-full rounded-xl"
        style={{ touchAction: 'none', cursor: readOnly ? 'default' : 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
