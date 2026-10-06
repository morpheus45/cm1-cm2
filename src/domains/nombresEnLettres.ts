/**
 * Les nombres en lettres et en chiffres : « quatre-vingt-treize » ↔ 93,
 * « 3 095 204 238 ». Partagés par la numération du CM, du CE1, du CE2 et de la
 * 6e (voir numeration.ts) : l'orthographe des nombres est celle que l'école
 * enseigne, avec ses traits d'union et ses « et ».
 */

const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const TEENS = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function twoDigits(n: number): string {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const tenIndex = Math.floor(n / 10);
  const unit = n % 10;
  if (tenIndex === 7 || tenIndex === 9) {
    if (tenIndex === 7 && unit === 1) {
      return `${TENS[tenIndex]} et ${TEENS[unit]}`;
    }
    return `${TENS[tenIndex]}-${TEENS[unit]}`;
  }
  if (unit === 0) {
    return tenIndex === 8 ? 'quatre-vingts' : TENS[tenIndex];
  }
  if (unit === 1 && tenIndex !== 8) {
    // « vingt et un », « trente et un »… sans traits d'union, comme
    // « soixante et onze » : c'est l'orthographe enseignée à l'école.
    return `${TENS[tenIndex]} et un`;
  }
  return `${TENS[tenIndex]}-${UNITS[unit]}`;
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let result = '';
  if (hundreds > 0) {
    result += hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent`;
    if (rest === 0 && hundreds > 1) result += 's';
    if (rest > 0) result += ' ';
  }
  if (rest > 0) {
    result += twoDigits(rest);
  }
  return result || 'zéro';
}

function dropPluralBeforeMille(words: string): string {
  if (words.endsWith('vingts')) return words.slice(0, -1);
  if (words.endsWith('cents')) return words.slice(0, -1);
  return words;
}

export function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;

  const parts: string[] = [];
  if (billions > 0) {
    parts.push(`${threeDigits(billions)} milliard${billions > 1 ? 's' : ''}`);
  }
  if (millions > 0) {
    parts.push(`${threeDigits(millions)} million${millions > 1 ? 's' : ''}`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : `${dropPluralBeforeMille(threeDigits(thousands))} mille`);
  }
  if (rest > 0 || parts.length === 0) {
    parts.push(threeDigits(rest));
  }
  return parts.join(' ').trim();
}

/**
 * Un nombre écrit en chiffres comme à l'école : les classes séparées par une
 * espace, qui ne coupe jamais la ligne (« 3 095 204 238 »). Sans elle, un
 * élève de CM2 devait déchiffrer « 3095204238 ».
 */
export function ecritureChiffree(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}
