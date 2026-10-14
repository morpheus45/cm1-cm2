import { dire, voixDisponible, type Morceau } from '../lib/voix';

/** Un haut-parleur dessiné : le même trait que les autres icônes de l'école. */
export function HautParleur({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  );
}

interface EcouterProps {
  parts: Morceau[];
  /** Ce que lit un lecteur d'écran : « Écouter la question », « Écouter la réponse cat ». */
  label: string;
  className?: string;
}

/** Le bouton qui lit à voix haute. Absent si l'appareil ne sait pas parler. */
export function Ecouter({ parts, label, className = '' }: EcouterProps) {
  if (!voixDisponible()) return null;
  return (
    <button
      type="button"
      onClick={() => dire(parts)}
      aria-label={label}
      title={label}
      className={`etiquette inline-flex shrink-0 items-center justify-center p-2.5 ${className}`}
    >
      <HautParleur />
    </button>
  );
}
