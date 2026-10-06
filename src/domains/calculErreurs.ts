import { chiffres, echanges } from './mathsCommun';

/**
 * Les erreurs d'élève qu'on connaît, opération par opération : ce sont elles
 * que le calcul propose comme mauvaises réponses, pas des nombres tirés au
 * hasard. Chaque fonction rend des candidats, du plus courant au moins
 * courant, que l'appelant filtre (rien d'égal au résultat, rien de négatif).
 */

/** Les chiffres d'un entier, des unités vers les centaines… */
const colonnes = (n: number): number[] => chiffres(n).reverse();

/** Les rangs (0 = les unités) où une addition posée produit une retenue. */
export function rangsDeRetenue(a: number, b: number): number[] {
  const [x, y] = [colonnes(a), colonnes(b)];
  const rangs: number[] = [];
  let retenue = 0;
  for (let rang = 0; rang < Math.max(x.length, y.length); rang++) {
    retenue = (x[rang] ?? 0) + (y[rang] ?? 0) + retenue >= 10 ? 1 : 0;
    if (retenue === 1) rangs.push(rang);
  }
  return rangs;
}

/** Les rangs où une soustraction posée demande d'emprunter une dizaine. */
export function rangsDEmprunt(a: number, b: number): number[] {
  const [x, y] = [colonnes(a), colonnes(b)];
  const rangs: number[] = [];
  let emprunt = 0;
  for (let rang = 0; rang < x.length; rang++) {
    const haut = x[rang] - emprunt;
    const bas = y[rang] ?? 0;
    emprunt = haut < bas ? 1 : 0;
    if (emprunt === 1) rangs.push(rang);
  }
  return rangs;
}

const dixPuissance = (rang: number) => Math.pow(10, rang);

/** a + b : une retenue oubliée, toutes les retenues oubliées, un chiffre
 *  échangé, une dizaine de trop ou de moins. */
export function erreursAddition(a: number, b: number): number[] {
  const somme = a + b;
  const rangs = rangsDeRetenue(a, b);
  const oubliees = rangs.map((rang) => somme - dixPuissance(rang + 1));
  const toutesOubliees = rangs.length > 1 ? [somme - rangs.reduce((total, rang) => total + dixPuissance(rang + 1), 0)] : [];
  return [...oubliees, ...toutesOubliees, somme + 10, somme - 10, ...echanges(somme), somme + 1, somme - 1, somme + 100, somme - 100];
}

/** a − b : le plus petit chiffre retranché du plus grand, quel que soit leur
 *  rang ; la retenue qu'on n'enlève pas au chiffre suivant ; une dizaine de
 *  trop ou de moins. */
export function erreursSoustraction(a: number, b: number): number[] {
  const reste = a - b;
  const [x, y] = [colonnes(a), colonnes(b)];
  const sansEmprunt = x.reduce((total, chiffre, rang) => total + Math.abs(chiffre - (y[rang] ?? 0)) * dixPuissance(rang), 0);
  const oublis = rangsDEmprunt(a, b).map((rang) => reste + dixPuissance(rang + 1));
  return [sansEmprunt, ...oublis, reste + 10, reste - 10, ...echanges(reste), reste + 1, reste - 1, reste + 100, reste - 100];
}

/** Un produit de la table : le voisin dans la table (un de plus, un de moins),
 *  la somme au lieu du produit, une dizaine d'écart. */
export function erreursTable(a: number, b: number): number[] {
  const produit = a * b;
  return [produit + a, produit - a, produit + b, produit - b, a + b, produit + 10, produit - 10, ...echanges(produit), produit + 2, produit - 2];
}

/** Un produit posé : une retenue oubliée, la seconde ligne qu'on ne décale pas
 *  (multiplicateur à deux chiffres), un chiffre échangé. */
export function erreursProduit(a: number, b: number): number[] {
  const produit = a * b;
  const candidats: number[] = [];
  if (b < 10) {
    let retenue = 0;
    colonnes(a).forEach((chiffre, rang) => {
      const total = chiffre * b + retenue;
      retenue = Math.floor(total / 10);
      if (retenue > 0) candidats.push(produit - retenue * dixPuissance(rang + 1));
    });
  } else {
    const [unites, dizaines] = [b % 10, Math.floor(b / 10)];
    candidats.push(a * unites + a * dizaines, a * unites + a * dizaines * 100, a * dizaines * 10);
  }
  return [...candidats, produit + 10, produit - 10, ...echanges(produit), produit + 100, produit - 100];
}

/** a ÷ b exact : le quotient voisin, la soustraction au lieu de la division,
 *  le diviseur lui-même. */
export function erreursQuotient(a: number, b: number): number[] {
  const quotient = a / b;
  return [quotient + 1, quotient - 1, a - b, b, quotient + 2, quotient - 2, quotient * 10, quotient + 10, quotient - 10, ...echanges(quotient)];
}
