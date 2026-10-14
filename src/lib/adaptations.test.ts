import { describe, expect, it } from 'vitest';
import { AIDES_DE_BASE, aidesDesTroubles, aidesDuProfil, parseProfil, raisons, TROUBLES } from './adaptations';

describe('les aides des élèves DYS', () => {
  it('ne changent rien sans trouble coché', () => {
    expect(aidesDesTroubles({})).toEqual(AIDES_DE_BASE);
  });

  it('font quelque chose pour chaque trouble, et davantage quand il est marqué', () => {
    TROUBLES.forEach((trouble) => {
      const leger = aidesDesTroubles({ [trouble]: 1 });
      const marque = aidesDesTroubles({ [trouble]: 2 });
      expect(leger, trouble).not.toEqual(AIDES_DE_BASE);
      expect(marque, trouble).not.toEqual(leger);
    });
  });

  it('gardent l\'aide la plus forte quand plusieurs troubles s\'additionnent', () => {
    const aides = aidesDesTroubles({ dyslexie: 2, dyspraxie: 1 });
    expect(aides.texte).toBe('tres-grand');
    expect(aides.espacement).toBe('tres-aere');
    expect(aides.grandesCibles).toBe(true);
    expect(aides.sansConstructions).toBe(true);
  });

  it('ajoutent ce qu\'appelle une association : dyslexie et dyscalculie lisent l\'énoncé à voix haute', () => {
    expect(aidesDesTroubles({ dyslexie: 1 }).lecture).toBe('bouton');
    expect(aidesDesTroubles({ dyscalculie: 1 }).lecture).toBe('non');
    expect(aidesDesTroubles({ dyslexie: 1, dyscalculie: 1 }).lecture).toBe('auto');
    expect(raisons({ dyslexie: 1, dyscalculie: 1 }, 'lecture').some((r) => r.startsWith('Dyslexie et dyscalculie'))).toBe(true);
  });

  it('raccourcissent les séances à partir de trois troubles, et le disent', () => {
    expect(aidesDesTroubles({ dyslexie: 1, dysorthographie: 1 }).seanceCourte).toBe(false);
    const trois = { dyslexie: 1, dysorthographie: 1, dyscalculie: 1 } as const;
    expect(aidesDesTroubles(trois).seanceCourte).toBe(true);
    expect(raisons(trois, 'seanceCourte')).toHaveLength(1);
  });

  it('n\'imposent pas le brouillon dessiné à un élève qui ne doit pas écrire à la main', () => {
    expect(aidesDesTroubles({ dyscalculie: 1 }).brouillonPartout).toBe(true);
    expect(aidesDesTroubles({ dyscalculie: 1, dysgraphie: 1 }).brouillonPartout).toBe(false);
    expect(aidesDesTroubles({ dyscalculie: 1, dyspraxie: 1 }).brouillonPartout).toBe(false);
  });

  it('font valider en deux temps un TDA/H marqué, ou associé à une dyspraxie', () => {
    expect(aidesDesTroubles({ tdah: 1 }).validerEnDeuxTemps).toBe(false);
    expect(aidesDesTroubles({ tdah: 2 }).validerEnDeuxTemps).toBe(true);
    expect(aidesDesTroubles({ tdah: 1, dyspraxie: 1 }).validerEnDeuxTemps).toBe(true);
  });

  it('laissent le dernier mot à l\'élève', () => {
    const aides = aidesDuProfil({ troubles: { tdah: 2 }, reglages: { seanceCourte: false, texte: 'grand' } });
    expect(aides.seanceCourte).toBe(false);
    expect(aides.validerEnDeuxTemps).toBe(true);
    expect(aides.texte).toBe('grand');
  });

  it('ne reprennent du navigateur que ce qu\'elles connaissent', () => {
    expect(parseProfil({ troubles: { dyslexie: 2, inconnu: 1, tdah: 5 }, reglages: { texte: 'geant', fondUni: true, x: 1 } })).toEqual({
      troubles: { dyslexie: 2 },
      reglages: { fondUni: true },
    });
    expect(parseProfil('nimporte quoi')).toEqual({ troubles: {}, reglages: {} });
  });
});
