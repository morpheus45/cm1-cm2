import { useId } from 'react';
import { RAINBOW_DOMAINS, type Domain } from '../../types';
import { NOTION_COLORS } from '../../theme';

interface RainbowArcProps {
  /** Les bandes à tracer, de l'extérieur vers l'intérieur : par défaut,
   *  l'arc-en-ciel de l'École, du français aux maths. */
  domains?: Domain[];
  className?: string;
}

/**
 * L'arc-en-ciel de l'École, tracé comme aux craies grasses : chaque bande est
 * une notion. Le bord des traits est légèrement irrégulier, comme sur le
 * papier.
 */
export function RainbowArc({ domains = RAINBOW_DOMAINS, className }: RainbowArcProps) {
  const filterId = `craie-${useId().replace(/:/g, '')}`;
  const outer = 92;
  const band = Math.min(13, 60 / domains.length);
  return (
    <svg viewBox="0 0 200 104" className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.6" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} fill="none" strokeLinecap="round">
        {domains.map((domain, index) => {
          const radius = outer - index * band - band / 2;
          return (
            <path
              key={domain}
              d={`M ${100 - radius} 100 A ${radius} ${radius} 0 0 1 ${100 + radius} 100`}
              stroke={NOTION_COLORS[domain].band}
              strokeWidth={band - 1.5}
            />
          );
        })}
      </g>
    </svg>
  );
}
