import { describe, expect, it } from 'vitest';
import { empreinte, empreintesCM, GRAINES, NIVEAUX_CM, TRIMESTRES } from './empreintesCM';
import attendues from './empreintesCM.json';

/**
 * Le CM1 et le CM2 ne bougent pas. Les questions de maths de ces deux
 * niveaux — numération, calcul, problèmes, géométrie, séances complètes,
 * opérations posées, tables de multiplication, brouillon — doivent rester
 * identiques au caractère près, quoi qu'on écrive pour les autres niveaux.
 *
 * La liste des empreintes (empreintesCM.json) a été relevée sur le code
 * d'avant le CE1, le CE2 et la 6e. Si ce test échoue, c'est qu'un changement
 * a modifié ce que voient les élèves de CM1 ou de CM2 : il faut le corriger,
 * pas mettre la liste à jour.
 */
const ATTENDUES = attendues as Record<string, string[]>;

describe('l\'empreinte d\'un texte', () => {
  it('ne change pas pour un même texte, et change dès qu\'un caractère change', () => {
    expect(empreinte('7 × 8')).toBe(empreinte('7 × 8'));
    expect(empreinte('7 × 8')).not.toBe(empreinte('7 × 9'));
    expect(empreinte('7 × 8')).not.toBe(empreinte('7 × 8 '));
    expect(empreinte('')).toHaveLength(14);
  });
});

describe('les maths du CM1 et du CM2', () => {
  const actuelles = empreintesCM();

  it('couvrent chaque notion, chaque niveau, chaque trimestre et chaque graine', () => {
    // Sans cela, une liste vidée par erreur passerait le test sans rien vérifier.
    const notions = ['numeration', 'calcul', 'problemes', 'geometrie'];
    const attendue = notions.length * NIVEAUX_CM.length * TRIMESTRES.length * GRAINES.length;
    expect(Object.keys(ATTENDUES).filter((nom) => notions.some((notion) => nom.startsWith(`${notion} `)))).toHaveLength(attendue);
    expect(Object.keys(ATTENDUES).filter((nom) => nom.startsWith('séance '))).toHaveLength(
      NIVEAUX_CM.length * TRIMESTRES.length * GRAINES.length
    );
    expect(Object.keys(ATTENDUES).filter((nom) => nom.startsWith('tables '))).toHaveLength(GRAINES.length);
  });

  it('ont les mêmes empreintes que sur le code d\'avant les nouveaux niveaux', () => {
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
