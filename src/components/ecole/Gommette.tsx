interface GommetteProps {
  color: string;
  /** Le symbole collé dessus : une coche, une étoile, ou rien. */
  mark?: 'coche' | 'etoile' | null;
  /** Une gommette « en attente » : seulement le contour. */
  empty?: boolean;
  size?: number;
  tilt?: number;
  className?: string;
  label?: string;
}

/** Une gommette ronde, comme celles qu'on colle sur les cahiers. */
export function Gommette({ color, mark = null, empty = false, size = 22, tilt = 0, className, label }: GommetteProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {empty ? (
        <circle cx="12" cy="12" r="9.5" fill="#fffdf8" stroke={color} strokeWidth="2" strokeDasharray="3 2.4" />
      ) : (
        <>
          <circle cx="12" cy="12.8" r="10" fill="rgba(30,42,74,0.18)" />
          <circle cx="12" cy="12" r="10" fill={color} />
          <path d="M7 7.5a7 7 0 0 1 6-2.4" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </>
      )}
      {!empty && mark === 'coche' && (
        <path d="M7.4 12.4l3 3 6.2-6.6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
      {!empty && mark === 'etoile' && (
        <path
          d="M12 5.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L12 15.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"
          fill="#fff"
        />
      )}
    </svg>
  );
}
