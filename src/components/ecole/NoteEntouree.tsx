import { useId } from 'react';
import { TEACHER_RED } from '../../theme';

/** La note écrite à la main par la maîtresse, en rouge, entourée d'un trait. */
export function NoteEntouree({ score, total }: { score: number; total: number }) {
  const filterId = `stylo-${useId().replace(/:/g, '')}`;
  return (
    <div className="relative inline-flex items-center justify-center px-8 py-4" aria-label={`${score} sur ${total}`} role="img">
      <svg viewBox="0 0 160 90" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" result="grain" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="2" />
          </filter>
        </defs>
        <path
          d="M 18 52 C 14 22, 70 8, 118 14 C 158 20, 156 66, 110 78 C 64 88, 20 80, 16 56 C 14 42, 40 26, 70 22"
          fill="none"
          stroke={TEACHER_RED}
          strokeWidth="3"
          strokeLinecap="round"
          filter={`url(#${filterId})`}
        />
      </svg>
      <span className="relative font-cursive text-4xl leading-[1.8]" style={{ color: TEACHER_RED }} aria-hidden="true">
        {score}/{total}
      </span>
    </div>
  );
}
