import { describe, expect, it } from 'vitest';
import { GRAINES, TRIMESTRES } from './empreintesCM';
import { empreintesNiveaux, NIVEAUX_ANCIENS } from './empreintesNiveaux';
import attendues from './empreintesNiveaux.json';

/**
 * Le CE1, le CE2 et la 6e ne bougent pas, et les séances offertes du CE1 au
 * CM2 non plus. Les questions de maths de ces niveaux — numération, calcul,
 * problèmes, géométrie, séances complètes, opérations posées, tables de
 * multiplication, brouillon — doivent rester identiques au caractère près,
 * quoi qu'on écrive pour la 5e, la 4e et la 3e.
 *
 * La liste des empreintes (empreintesNiveaux.json) a été relevée sur le code
 * d'avant le cycle 4. Si ce test échoue, c'est qu'un changement a modifié ce
 * que voient les élèves de ces niveaux : il faut le corriger, pas mettre la
 * liste à jour.
 */
const ATTENDUES = attendues as Record<string, string[]>;

describe('les maths du CE1, du CE2 et de la 6e', () => {
  const actuelles = empreintesNiveaux();

  it('couvrent chaque notion, chaque niveau, chaque trimestre et chaque graine', () => {
    // Sans cela, une liste vidée par erreur passerait le test sans rien vérifier.
    const notions = ['numeration', 'calcul', 'problemes', 'geometrie'];
    const attendue = notions.length * NIVEAUX_ANCIENS.length * TRIMESTRES.length * GRAINES.length;
    expect(Object.keys(ATTENDUES).filter((nom) => notions.some((notion) => nom.startsWith(`${notion} `)))).toHaveLength(attendue);
    ['séance ', 'brouillon ', 'opérations posées '].forEach((debut) =>
      expect(Object.keys(ATTENDUES).filter((nom) => nom.startsWith(debut)), debut).toHaveLength(
        NIVEAUX_ANCIENS.length * TRIMESTRES.length * GRAINES.length
      )
    );
    expect(Object.keys(ATTENDUES).filter((nom) => nom.startsWith('tables '))).toHaveLength(NIVEAUX_ANCIENS.length * TRIMESTRES.length);
    // Les cinq niveaux ouverts avant le cycle 4, trois trimestres chacun.
    expect(Object.keys(ATTENDUES).filter((nom) => nom.startsWith('offre '))).toHaveLength(5 * TRIMESTRES.length);
  });

  it('ont les mêmes empreintes que sur le code d\'avant le cycle 4', () => {
    expect(Object.keys(actuelles)).toEqual(Object.keys(ATTENDUES));
    const differences = Object.keys(ATTENDUES).flatMap((nom) => {
      const avant = ATTENDUES[nom];
      const apres = actuelles[nom];
      const rang = avant.findIndex((valeur, index) => valeur !== apres[index]);
      if (rang === -1 && avant.length === apres.length) return [];
      return [`${nom} : la question ${rang === -1 ? 'en trop ou en moins' : rang + 1} a changé`];
    });
    expect(differences).toEqual([]);
  });
});
