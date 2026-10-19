import { describe, expect, it } from 'vitest';
import { enMotsDeParents } from './abonnements';

describe('enMotsDeParents', () => {
  it("parle d'enfants et d'Arc-en-Ciel", () => {
    expect(enMotsDeParents('École Arc-en-Ciel · Espace maîtresse')).toBe('Arc-en-Ciel · Espace parents');
    expect(enMotsDeParents('Mes élèves : 8 élèves. Élèves de la classe, chaque élève, Élève suivant')).toBe(
      'Mes enfants : 8 enfants. Enfants de la classe, chaque enfant, Enfant suivant'
    );
  });
});
