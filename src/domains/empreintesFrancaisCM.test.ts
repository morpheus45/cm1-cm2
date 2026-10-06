import { describe, expect, it } from 'vitest';
import { empreinte, empreintesFrancaisCM, GENERATEURS, GRAINES, NIVEAUX_CM, TRIMESTRES } from './empreintesFrancaisCM';
import attendues from './empreintesFrancaisCM.json';

/**
 * Le français du CM1 et du CM2 ne bouge pas. Les questions de conjugaison,
 * d'accords et d'orthographe de ces deux niveaux — tirages d'une séance, de
 * la réserve du constructeur, séances complètes, tout ce que les notions
 * savent poser — doivent rester identiques au caractère près, quoi qu'on
 * écrive pour le CE1, le CE2 et la 6e.
 *
 * La liste des empreintes (empreintesFrancaisCM.json) a été relevée sur le
 * code d'avant ces trois niveaux. Si ce test échoue, c'est qu'un changement a
 * modifié ce que voient les élèves de CM1 ou de CM2 : il faut le corriger,
 * pas mettre la liste à jour.
 */
const ATTENDUES = attendues as Record<string, string[]>;

describe('l\'empreinte d\'un texte', () => {
  it('ne change pas pour un même texte, et change dès qu\'un caractère change', () => {
    expect(empreinte('Léa chante')).toBe(empreinte('Léa chante'));
    expect(empreinte('Léa chante')).not.toBe(empreinte('Léa chantes'));
    expect(empreinte('Léa chante')).not.toBe(empreinte('Léa chante '));
    expect(empreinte('')).toHaveLength(14);
  });
});

describe('le français du CM1 et du CM2', () => {
  const actuelles = empreintesFrancaisCM();
  const notions = Object.keys(GENERATEURS);

  it('couvre chaque notion, chaque niveau, chaque trimestre et chaque graine', () => {
    // Sans cela, une liste vidée par erreur passerait le test sans rien vérifier.
    const cases = NIVEAUX_CM.length * TRIMESTRES.length;
    const noms = Object.keys(ATTENDUES);
    notions.forEach((notion) => {
      expect(noms.filter((nom) => nom.startsWith(`${notion} `)), notion).toHaveLength(cases * GRAINES.length);
      expect(noms.filter((nom) => nom.startsWith(`tirages ${notion} `)), `tirages ${notion}`).toHaveLength(cases);
    });
    expect(noms.filter((nom) => nom.startsWith('séance '))).toHaveLength(cases * GRAINES.length);
    expect(noms.filter((nom) => nom.startsWith('temps '))).toHaveLength(cases);
  });

  it('a les mêmes empreintes que sur le code d\'avant les nouveaux niveaux', () => {
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
