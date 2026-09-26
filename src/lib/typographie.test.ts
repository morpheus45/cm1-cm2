import { describe, expect, it } from 'vitest';
import { typographieFrancaise } from './typographie';

const nbsp = '\u00a0';
const wj = '\u2060';

describe('typographieFrancaise', () => {
  it('ne laisse jamais un « ? » seul en début de ligne', () => {
    expect(typographieFrancaise('Combien de billes a-t-elle ?')).toBe(`Combien de billes a-${wj}t-${wj}elle${nbsp}?`);
    expect(typographieFrancaise('Bravo ! Attention ; voici : la suite')).toBe(
      `Bravo${nbsp}! Attention${nbsp}; voici${nbsp}: la suite`
    );
  });

  it('ne coupe pas le pronom de son verbe', () => {
    expect(typographieFrancaise('chacun reçoit-il ?')).toBe(`chacun reçoit-${wj}il${nbsp}?`);
    expect(typographieFrancaise('Qu\'est-ce que tu dis-moi ? Veux-tu ? Pouvez-vous ?')).toBe(
      `Qu'est-${wj}ce que tu dis-${wj}moi${nbsp}? Veux-${wj}tu${nbsp}? Pouvez-${wj}vous${nbsp}?`
    );
    // Les mots composés, eux, se coupent comme d'habitude.
    ['grand-mère', 'peut-être', 'vingt-et-un', 'Jean-Louis', 'celles-ci'].forEach((text) =>
      expect(typographieFrancaise(text)).toBe(text)
    );
  });

  it('garde les guillemets collés à leur texte', () => {
    expect(typographieFrancaise('Il dit « bonjour » à tous.')).toBe(`Il dit «${nbsp}bonjour${nbsp}» à tous.`);
  });

  it('garde un nombre avec ce qui le suit', () => {
    expect(typographieFrancaise('Lina partage 96 billes entre 4 amis.')).toBe(
      `Lina partage 96${nbsp}billes entre 4${nbsp}amis.`
    );
    expect(typographieFrancaise('Un cahier coûte 3,50 €.')).toBe(`Un cahier coûte 3,50${nbsp}€.`);
    expect(typographieFrancaise('24 × 3')).toBe(`24${nbsp}× 3`);
  });

  it('ne touche pas au reste, et se rejoue sans rien changer', () => {
    ['mille deux cent', '1250', 'Tu veux du thé ... du café', 'Sans faute'].forEach((text) =>
      expect(typographieFrancaise(text)).toBe(text)
    );
    const once = typographieFrancaise('« Combien a-t-il ? » demande Léo, 12 ans !');
    expect(typographieFrancaise(once)).toBe(once);
    expect(typographieFrancaise(`Bravo${nbsp}!`)).toBe(`Bravo${nbsp}!`);
  });

  it('respecte les mots mis en valeur', () => {
    expect(typographieFrancaise('Les enfants **mangent** ?')).toBe(`Les enfants **mangent**${nbsp}?`);
  });
});
