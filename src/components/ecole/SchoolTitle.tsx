import { RainbowArc } from './RainbowArc';

interface SchoolTitleProps {
  /** Sous le nom de l'école : « Mon cahier d'exercices », « Espace maîtresse »… */
  subtitle?: string;
  size?: 'grand' | 'petit';
}

/** Le nom de l'école, écrit à la main sous son arc-en-ciel. */
export function SchoolTitle({ subtitle, size = 'grand' }: SchoolTitleProps) {
  const big = size === 'grand';
  return (
    <header className={`flex flex-col items-center ${big ? 'gap-1 pt-2' : 'gap-0'}`}>
      <RainbowArc className={big ? 'w-44 -mb-7' : 'w-20 -mb-3'} />
      <h1
        className={`font-cursive text-encre ${big ? 'text-[2.1rem] leading-[1.9]' : 'text-xl leading-[2]'}`}
      >
        École Arc-en-Ciel
      </h1>
      {subtitle && (
        <p className={`${big ? 'text-base' : 'text-xs'} font-bold uppercase tracking-[0.18em] text-encre-douce`}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
