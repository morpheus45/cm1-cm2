/** Les étoiles gagnées sur la tablette, toutes séances confondues. */
const STARS_KEY = 'exercices-cm1-cm2:stars';

export function loadStars(): number {
  try {
    const raw = localStorage.getItem(STARS_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function saveStars(value: number) {
  try {
    localStorage.setItem(STARS_KEY, String(value));
  } catch {
    // Stockage refusé : l'élève garde ses étoiles le temps de la séance.
  }
}

/** À la rentrée, le compteur repart de zéro. */
export function forgetStars() {
  try {
    localStorage.removeItem(STARS_KEY);
  } catch {
    // Stockage refusé : il n'y avait rien à effacer.
  }
}
