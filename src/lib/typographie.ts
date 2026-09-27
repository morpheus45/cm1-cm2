/**
 * La typographie française à l'écran : une espace insécable là où une ligne
 * ne doit jamais se couper — avant « ? ! ; : » et le guillemet fermant, après
 * le guillemet ouvrant, entre un nombre et ce qui le suit (« 24 billes »,
 * « 3,50 € »), entre les classes d'un grand nombre (« 25 000 »).
 * Les nombres de quatre chiffres restent collés : ce sont souvent des
 * années (« en 1789 »). Sans elle, un « ? » peut se retrouver seul au début d'une
 * ligne. De même, « reçoit-il », « a-t-il », « est-ce » ne se coupent pas au
 * trait d'union : le pronom reste accroché au verbe.
 *
 * Les énoncés viennent de l'application comme des maîtresses (et de
 * l'assistant) : on les corrige à l'affichage, en un seul endroit.
 */
const INSECABLE = '\u00a0';
/** Invisible, il interdit seulement de couper la ligne à cet endroit. */
const SANS_COUPURE = '\u2060';

export function typographieFrancaise(text: string): string {
  return text
    .replace(/(?<![\d,.])\d{5,}/g, (nombre) => nombre.replace(/\B(?=(\d{3})+(?!\d))/g, INSECABLE))
    .replace(/[ \t]+(?=[?!;:»])/g, INSECABLE)
    .replace(/«[ \t]+/g, `«${INSECABLE}`)
    .replace(/(\d)[ \t]+(?=[^\s\d])/g, `$1${INSECABLE}`)
    .replace(/-(?=(?:t-)?(?:il|ils|elle|elles|on|je|tu|nous|vous|ce|moi|toi)\b)/g, `-${SANS_COUPURE}`);
}
