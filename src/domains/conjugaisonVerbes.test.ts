import { describe, expect, it } from 'vitest';
import { ALL_VERBS } from './conjugaisonVerbes';

function verb(infinitive: string) {
  const found = ALL_VERBS.find((v) => v.infinitive === infinitive);
  if (!found) throw new Error(`verbe manquant : ${infinitive}`);
  return found;
}

describe('les tables de conjugaison, vérifiées sur des formes de référence', () => {
  it('conjugue un verbe régulier du 1er groupe (aimer)', () => {
    const forms = verb('aimer').forms;
    expect(forms['présent']).toEqual({ je: 'aime', tu: 'aimes', il: 'aime', nous: 'aimons', vous: 'aimez', ils: 'aiment' });
    expect(forms['imparfait'].il).toBe('aimait');
    expect(forms['futur'].je).toBe('aimerai');
    expect(forms['passé simple'].il).toBe('aima');
    expect(forms['passé simple'].ils).toBe('aimèrent');
    expect(forms['conditionnel présent'].nous).toBe('aimerions');
    expect(forms['passé composé'].je).toBe('ai aimé');
    expect(forms['plus-que-parfait'].ils).toBe('avaient aimé');
  });

  it('adoucit le c devant a et o (commencer)', () => {
    const forms = verb('commencer').forms;
    expect(forms['présent'].nous).toBe('commençons');
    expect(forms['présent'].vous).toBe('commencez');
    expect(forms['imparfait'].je).toBe('commençais');
    expect(forms['imparfait'].nous).toBe('commencions');
    expect(forms['futur'].je).toBe('commencerai');
    expect(forms['passé simple'].il).toBe('commença');
    expect(forms['passé simple'].ils).toBe('commencèrent');
  });

  it('ajoute un e après le g devant a et o (manger)', () => {
    const forms = verb('manger').forms;
    expect(forms['présent'].nous).toBe('mangeons');
    expect(forms['imparfait'].je).toBe('mangeais');
    expect(forms['imparfait'].nous).toBe('mangions');
    expect(forms['passé simple'].il).toBe('mangea');
    expect(forms['passé simple'].ils).toBe('mangèrent');
  });

  it('change le y en i devant un e muet (nettoyer)', () => {
    const forms = verb('nettoyer').forms;
    expect(forms['présent']).toEqual({
      je: 'nettoie',
      tu: 'nettoies',
      il: 'nettoie',
      nous: 'nettoyons',
      vous: 'nettoyez',
      ils: 'nettoient',
    });
    expect(forms['imparfait'].je).toBe('nettoyais');
    expect(forms['imparfait'].nous).toBe('nettoyions');
    expect(forms['futur'].je).toBe('nettoierai');
    expect(forms['passé simple'].je).toBe('nettoyai');
  });

  it('met un accent grave devant un e muet (acheter)', () => {
    const forms = verb('acheter').forms;
    expect(forms['présent'].je).toBe('achète');
    expect(forms['présent'].nous).toBe('achetons');
    expect(forms['imparfait'].je).toBe('achetais');
    expect(forms['futur'].je).toBe('achèterai');
    expect(forms['passé simple'].je).toBe('achetai');
    expect(forms['passé simple'].ils).toBe('achetèrent');
  });

  it('double la consonne devant un e muet (appeler)', () => {
    const forms = verb('appeler').forms;
    expect(forms['présent'].je).toBe('appelle');
    expect(forms['présent'].nous).toBe('appelons');
    expect(forms['imparfait'].je).toBe('appelais');
    expect(forms['futur'].je).toBe('appellerai');
    expect(forms['passé simple'].je).toBe('appelai');
  });

  it('conjugue un verbe régulier du 2e groupe (finir)', () => {
    const forms = verb('finir').forms;
    expect(forms['présent']).toEqual({
      je: 'finis',
      tu: 'finis',
      il: 'finit',
      nous: 'finissons',
      vous: 'finissez',
      ils: 'finissent',
    });
    expect(forms['imparfait'].nous).toBe('finissions');
    expect(forms['futur'].je).toBe('finirai');
    expect(forms['passé simple']).toEqual({
      je: 'finis',
      tu: 'finis',
      il: 'finit',
      nous: 'finîmes',
      vous: 'finîtes',
      ils: 'finirent',
    });
    expect(forms['passé composé'].il).toBe('a fini');
  });

  const irregularReferences: [string, string, string][] = [
    ['être', 'présent', 'sommes'],
    ['être', 'passé simple', 'furent'],
    ['être', 'passé composé', 'ai été'],
    ['avoir', 'présent', 'ont'],
    ['avoir', 'passé simple', 'eurent'],
    ['aller', 'présent', 'vais'],
    ['aller', 'futur', 'irai'],
    ['aller', 'imparfait', 'allions'],
    ['faire', 'présent', 'faisons'],
    ['faire', 'passé simple', 'firent'],
    ['dire', 'présent', 'dites'],
    ['venir', 'présent', 'viennent'],
    ['venir', 'passé simple', 'vinrent'],
    ['prendre', 'présent', 'prennent'],
    ['pouvoir', 'présent', 'peux'],
    ['voir', 'futur', 'verrai'],
    ['vouloir', 'conditionnel présent', 'voudrais'],
  ];

  it.each(irregularReferences)('%s au %s : %s', (infinitive, tense, expected) => {
    const forms = verb(infinitive).forms;
    const paradigm = forms[tense as keyof typeof forms];
    expect(Object.values(paradigm)).toContain(expected);
  });

  it("ne propose pas les temps composés d'aller et venir dans ce domaine", () => {
    expect(verb('aller').canCompound).toBe(false);
    expect(verb('venir').canCompound).toBe(false);
  });

  it('donne six formes distinctes ou presque à chaque temps, pour fabriquer des mauvaises réponses', () => {
    ALL_VERBS.forEach((v) => {
      (Object.keys(v.forms) as (keyof typeof v.forms)[]).forEach((tense) => {
        const unique = new Set(Object.values(v.forms[tense]));
        expect(unique.size, `${v.infinitive} au ${tense}`).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
