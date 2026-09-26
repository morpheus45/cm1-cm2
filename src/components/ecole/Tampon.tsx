import { TEACHER_RED } from '../../theme';

interface TamponProps {
  children: React.ReactNode;
  color?: string;
  tilt?: number;
  className?: string;
}

/** Le tampon encreur de la maîtresse, posé un peu de travers. */
export function Tampon({ children, color = TEACHER_RED, tilt = -6, className = '' }: TamponProps) {
  return (
    <div
      className={`tampon inline-block whitespace-nowrap rounded-xl px-5 py-2 text-center font-bold uppercase tracking-[0.1em] ${className}`}
      style={{
        color,
        border: `4px double ${color}`,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {children}
    </div>
  );
}
