import { useEffect, useRef } from 'react';

/**
 * Le titre d'un écran qui s'ouvre : la page remonte en haut, et le focus se
 * pose sur le titre. Un lecteur d'écran l'annonce, et la touche Tab repart de
 * là plutôt que du haut de la page. À chaque changement de `key` — la
 * question suivante — tout recommence.
 */
export function useScreenTitle(key?: unknown) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    ref.current?.focus({ preventScroll: true });
  }, [key]);
  return ref;
}
