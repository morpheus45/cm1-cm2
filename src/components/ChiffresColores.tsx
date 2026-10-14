import type { ReactNode } from 'react';

/**
 * Les chiffres d'un nombre colorés selon leur rang, comme dans un tableau de
 * numération : unités en bleu, dizaines en rouge, centaines en vert, et la
 * même chose dans chaque classe (milliers, millions). Une aide pour les élèves
 * dyscalculiques : la couleur dit ce que vaut le chiffre avant même de le lire.
 *
 * Seule la partie entière des nombres d'au moins deux chiffres est colorée :
 * un chiffre seul n'a pas besoin d'aide, et les décimales gardent leur encre.
 */
export const COULEURS_DES_RANGS = ['#1A5DB8', '#B91C3B', '#1B7A43'];

// Un entier avec ses espaces de classes (« 25 000 »), ou un entier de deux chiffres et plus,
// jamais la partie décimale d'un nombre (« 3,25 »).
const NOMBRE = /(?<![\d,.])(?:\d{1,3}(?:[  ]\d{3})+|\d{2,})(?!\d)/g;

export function colorerChiffres(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(NOMBRE)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const chars = [...match[0]];
    const digitsAfter = chars.map((_, index) => chars.slice(index + 1).filter((c) => /\d/.test(c)).length);
    nodes.push(
      <span key={start} className="font-bold">
        {chars.map((char, index) =>
          /\d/.test(char) ? (
            <span key={index} style={{ color: COULEURS_DES_RANGS[digitsAfter[index] % 3] }}>
              {char}
            </span>
          ) : (
            char
          )
        )}
      </span>
    );
    last = start + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function aDesNombres(text: string): boolean {
  return new RegExp(NOMBRE.source).test(text);
}

/** La légende, discrète, sous l'énoncé. */
export function LegendeDesRangs() {
  const rangs = ['unités', 'dizaines', 'centaines'];
  return (
    <p className="text-sm font-bold" aria-hidden="true">
      {rangs.map((rang, index) => (
        <span key={rang} style={{ color: COULEURS_DES_RANGS[index] }}>
          {index > 0 && <span className="text-encre-douce"> · </span>}
          {rang}
        </span>
      ))}
    </p>
  );
}
