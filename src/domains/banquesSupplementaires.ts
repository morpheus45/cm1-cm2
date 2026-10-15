import type { Level, Trimester } from '../types';
import { writtenItem as item, type WrittenItem } from './histoireGeographie';
import donnees from './banquesSupplementaires.json';

/**
 * Les questions ajoutées pour qu'une notion ne se répète pas d'une semaine à
 * l'autre : rédigées par un premier modèle, contrôlées par les règles de
 * lisibilité de l'application, puis relues par un second modèle, qui écarte
 * toute question douteuse. Une ligne : niveau, trimestre, énoncé, bonne
 * réponse, trois mauvaises, explication.
 */
type Ligne = [Level, Trimester, string, string, string, string, string, string];

export function supplement(notion: string): WrittenItem[] {
  return ((donnees as unknown as Record<string, Ligne[]>)[notion] ?? []).map(([level, trimester, prompt, correct, w1, w2, w3, explanation]) =>
    item(level, trimester, prompt, correct, [w1, w2, w3], explanation)
  );
}

/** Une même question ne revient pas deux fois à un même niveau : la première écrite est gardée. */
export function uniques(items: WrittenItem[]): WrittenItem[] {
  const vues = new Set<string>();
  return items.filter((entry) => {
    const cle = `${entry.level}§${entry.prompt.trim().toLowerCase()}`;
    if (vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });
}
