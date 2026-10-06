import type { Stage } from '../lib/progression';
import { rngInt, rngPick, rngShuffle } from '../lib/seededRandom';
import { diagrammeEnBarres, pictogramme, tableauDeDonnees } from './figuresMaths';
import { fauxNombres, type Brique, type Enonce } from './mathsCommun';
import type { Rng } from '../lib/seededRandom';

/**
 * Ce que partagent les problèmes du CE1, du CE2 et de la 6e : les consignes,
 * la forme d'une brique, l'écriture des heures et les problèmes de lecture de
 * données (tableau, pictogramme, diagramme en barres).
 */

export const INSTRUCTION = 'Lis bien, puis choisis la bonne réponse';
export const INSTRUCTION_DONNEES = 'Regarde bien, puis choisis la bonne réponse';

export const forme = (name: string, minStage: Stage, make: (rng: Rng, stage: Stage) => Enonce): Brique => ({ name, minStage, make });

/** Le plus grand nombre que le niveau lit : une mauvaise réponse ne le dépasse pas. */
export const plafond = (stage: Stage) => (stage <= -3 ? 1000 : stage <= 6 ? 10000 : 1000000);

export const nombresEn = (valeurs: number[], unite = '') => valeurs.map((valeur) => (unite ? `${valeur} ${unite}` : String(valeur)));

/** « 3 h », « 3 h 30 », « 14 h 05 » : l'heure comme on l'écrit à l'école. */
export const heure = (h: number, minutes: number) => (minutes === 0 ? `${h} h` : `${h} h ${String(minutes).padStart(2, '0')}`);

// --- Les données : tableau, pictogramme, diagramme en barres -------------------------------------------------

interface Theme {
  entete: string;
  /** « d'élèves », « d'enfants » : ce qu'on compte, prêt pour « Combien … ont choisi ». */
  total: string;
  /** La question « le plus choisi », écrite pour ce thème. */
  leMieuxClasse: string;
  items: { nom: string; dit: string }[];
}

export const THEMES: Theme[] = [
  {
    entete: 'Sport',
    total: "d'élèves",
    leMieuxClasse: 'Quel sport est le plus choisi ?',
    items: [
      { nom: 'Foot', dit: 'le foot' },
      { nom: 'Judo', dit: 'le judo' },
      { nom: 'Danse', dit: 'la danse' },
      { nom: 'Vélo', dit: 'le vélo' },
      { nom: 'Tennis', dit: 'le tennis' },
      { nom: 'Cirque', dit: 'le cirque' },
    ],
  },
  {
    entete: 'Fruit',
    total: "d'élèves",
    leMieuxClasse: 'Quel fruit est le plus choisi ?',
    items: [
      { nom: 'Pomme', dit: 'la pomme' },
      { nom: 'Poire', dit: 'la poire' },
      { nom: 'Banane', dit: 'la banane' },
      { nom: 'Fraise', dit: 'la fraise' },
      { nom: 'Cerise', dit: 'la cerise' },
      { nom: 'Orange', dit: "l'orange" },
    ],
  },
  {
    entete: 'Animal',
    total: "d'élèves",
    leMieuxClasse: 'Quel animal est le plus choisi ?',
    items: [
      { nom: 'Chat', dit: 'le chat' },
      { nom: 'Chien', dit: 'le chien' },
      { nom: 'Lapin', dit: 'le lapin' },
      { nom: 'Cheval', dit: 'le cheval' },
      { nom: 'Poisson', dit: 'le poisson' },
      { nom: 'Oiseau', dit: "l'oiseau" },
    ],
  },
  {
    entete: 'Glace',
    total: "d'enfants",
    leMieuxClasse: 'Quelle glace est la plus choisie ?',
    items: [
      { nom: 'Vanille', dit: 'la vanille' },
      { nom: 'Fraise', dit: 'la fraise' },
      { nom: 'Chocolat', dit: 'le chocolat' },
      { nom: 'Citron', dit: 'le citron' },
      { nom: 'Café', dit: 'le café' },
      { nom: 'Menthe', dit: 'la menthe' },
    ],
  },
  {
    entete: 'Jeu',
    total: "d'enfants",
    leMieuxClasse: 'Quel jeu est le plus choisi ?',
    items: [
      { nom: 'Billes', dit: 'les billes' },
      { nom: 'Cartes', dit: 'les cartes' },
      { nom: 'Corde', dit: 'la corde' },
      { nom: 'Ballon', dit: 'le ballon' },
      { nom: 'Dames', dit: 'les dames' },
      { nom: 'Puzzle', dit: 'le puzzle' },
    ],
  },
];

type Presentation = 'tableau' | 'pictogramme' | 'barres';

/** Ce qu'on compte, sans l'article : « élèves », « enfants ». */
const gens = (theme: Theme) => theme.total.replace(/^d'|^de /, '');

/**
 * Des données à lire : un tableau, un pictogramme ou un diagramme en barres,
 * et une question dont le nom de la catégorie est dans l'énoncé. Les valeurs
 * d'une même figure sont toutes différentes, pour qu'« le plus choisi » n'ait
 * qu'une réponse, et chacune tombe sur une graduation ou un nombre entier de
 * ronds : on lit, on ne devine pas.
 */
export function donnees(name: string, minStage: Stage, presentation: Presentation): Brique {
  return forme(name, minStage, (rng, stage) => {
    const theme = rngPick(rng, THEMES);
    const grandes = stage >= -2;
    const items = rngShuffle(rng, theme.items).slice(0, rngInt(rng, 4, 5));
    // La valeur d'un rond, l'écart des graduations : 2 ou 5 au CE1 ; 5 ou 10 au CE2 ; 10, 20 ou 50 en 6e.
    // Un tableau se lit tel quel : ses valeurs sont des multiples du pas, sans plus.
    const pas =
      stage >= 7
        ? rngPick(rng, presentation === 'tableau' ? [10, 20, 25, 50] : [10, 20, 50])
        : presentation === 'tableau'
          ? grandes ? rngPick(rng, [1, 2, 3]) : 1
          : grandes ? rngPick(rng, [5, 10]) : presentation === 'barres' ? rngPick(rng, [1, 2]) : rngPick(rng, [2, 5]);
    const nombresDeCases = rngShuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, items.length);
    const lignes: [string, number][] = items.map((item, index) => [item.nom, nombresDeCases[index] * pas]);
    const maximum = (Math.max(...nombresDeCases) + 1) * pas;
    const figure =
      presentation === 'tableau'
        ? tableauDeDonnees([theme.entete, 'Nombre'], lignes)
        : presentation === 'pictogramme'
          ? pictogramme(lignes, pas, gens(theme))
          : diagrammeEnBarres(lignes, maximum, pas, 'Nombre');
    const valeur = (nom: string) => lignes.find(([libelle]) => libelle === nom)![1];
    const lecture = rngInt(rng, 0, 3);
    const [premier, second] = rngShuffle(rng, items).slice(0, 2);
    const detail = `${presentation}-${theme.entete}-${lignes.map(([nom, v]) => `${nom}${v}`).join('.')}-${lecture}-${premier.nom}-${second.nom}`;
    const toutes = lignes.map(([, v]) => v);
    const [a, b] = [valeur(premier.nom), valeur(second.nom)];
    if (lecture === 0) {
      return {
        detail,
        instruction: INSTRUCTION_DONNEES,
        prompt: `Combien ${theme.total} ont choisi ${premier.dit} ?`,
        figure,
        correct: String(a),
        // Une autre catégorie, une graduation ou une unité à côté.
        wrong: nombresEn(fauxNombres(a, [...toutes, a + pas, a - pas, a + 1, a - 1], { min: 1, max: plafond(stage) })),
        explanation: `On lit ${premier.dit} : ${a}.`,
      };
    }
    if (lecture === 1) {
      const [plusGrand] = lignes.reduce((meilleur, ligne) => (ligne[1] > meilleur[1] ? ligne : meilleur));
      return {
        detail,
        instruction: INSTRUCTION_DONNEES,
        prompt: theme.leMieuxClasse,
        figure,
        correct: plusGrand,
        wrong: lignes.filter(([nom]) => nom !== plusGrand).map(([nom]) => nom),
        explanation: `Le plus grand nombre est ${valeur(plusGrand)} : ${plusGrand}.`,
      };
    }
    if (lecture === 2) {
      return {
        detail,
        instruction: INSTRUCTION_DONNEES,
        prompt: `Combien ${theme.total} ont choisi ${premier.dit} ou ${second.dit} ?`,
        figure,
        correct: String(a + b),
        // Une seule des deux catégories, l'écart au lieu de la somme, le total de la figure.
        wrong: nombresEn(fauxNombres(a + b, [a, b, Math.abs(a - b), a + b + pas, a + b - pas, toutes.reduce((total, v) => total + v, 0)], { min: 1, max: plafond(stage) })),
        explanation: `${a} + ${b} = ${a + b}.`,
      };
    }
    const [grand, petit] = a > b ? [premier, second] : [second, premier];
    const difference = Math.abs(a - b);
    return {
      detail,
      instruction: INSTRUCTION_DONNEES,
      prompt: `Combien ${theme.total} de plus ont choisi ${grand.dit} que ${petit.dit} ?`,
      figure,
      correct: String(difference),
      wrong: nombresEn(fauxNombres(difference, [a + b, valeur(grand.nom), valeur(petit.nom), difference + pas, difference - pas, difference + 1], { min: 1, max: plafond(stage) })),
      explanation: `${valeur(grand.nom)} − ${valeur(petit.nom)} = ${difference}.`,
    };
  });
}

