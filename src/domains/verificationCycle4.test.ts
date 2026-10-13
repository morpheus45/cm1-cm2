import { describe, expect, it } from 'vitest';
import { eqQ, evaluer, evaluerAvecLettres, lireEquation, lireNombre, lirePolynome, lireRationnel, memeExpression, polyDegre, polyEgaux, polyEvaluer, q, racineQ } from './verificationCycle4';

/**
 * Les tests de la 5e, de la 4e et de la 3e refont les calculs des questions
 * avec ce lecteur d'expressions : il doit lui-même être sûr. Ces cas sont ceux
 * où un lecteur se trompe — les priorités, le signe moins devant une puissance,
 * les fractions, l'écriture sans signe de multiplication.
 */
describe('le lecteur d\'expressions numériques', () => {
  const vaut = (texte: string, attendu: ReturnType<typeof q>) => expect(eqQ(evaluer(texte), attendu), texte).toBe(true);

  it('respecte les priorités et les parenthèses', () => {
    vaut('3 + 4 × 5', q(23));
    vaut('(3 + 4) × 5', q(35));
    vaut('18 − 4 × 3', q(6));
    vaut('24 ÷ 4 ÷ 3', q(2));
    vaut('2 × (7 − 3) + 10 ÷ 5', q(10));
  });

  it('lit le signe moins, avec ses parenthèses et sans', () => {
    vaut('(−5) + 8', q(3));
    vaut('(−4) × (−3)', q(12));
    vaut('3 − (−2)', q(5));
    vaut('−7 + 12 − 5', q(0));
    vaut('(−42) ÷ 7', q(-6));
    vaut('3 - 5', q(-2));
  });

  it('lit une puissance comme les mathématiques : −3² = −9, (−3)² = 9', () => {
    vaut('−3²', q(-9));
    vaut('(−3)²', q(9));
    vaut('(−2)³', q(-8));
    vaut('−2⁴', q(-16));
    vaut('2⁵', q(32));
    vaut('10⁻³', q(1, 1000));
    vaut('2⁻³ × 2⁵', q(4));
    vaut('(2³)²', q(64));
    vaut('3 + 2² × 5', q(23));
  });

  it('calcule exactement sur les fractions, sans arrondi', () => {
    vaut('3/4 + 1/6', q(11, 12));
    vaut('3/4 × 2/9', q(1, 6));
    vaut('3/5 ÷ 9/10', q(2, 3));
    vaut('1/3 + 1/3 + 1/3', q(1));
    vaut('−3/4 + 1', q(1, 4));
    vaut('(2/3)²', q(4, 9));
  });

  it('lit les décimaux à la virgule, avec leurs espaces', () => {
    vaut('0,1 + 0,2', q(3, 10));
    vaut('12 ÷ 0,25', q(48));
    vaut('1 250,5 × 2', q(2501));
    vaut('3,25 × 1,4', q(455, 100));
    expect(eqQ(lireNombre('−1\u00a0250,5') as ReturnType<typeof q>, q(-12505, 10))).toBe(true);
    expect(lireNombre('1/2')).toBeNull();
    expect(eqQ(lireRationnel('−3/4') as ReturnType<typeof q>, q(-3, 4))).toBe(true);
  });

  it('calcule les racines carrées exactes, et refuse les autres', () => {
    vaut('√81', q(9));
    vaut('√(13²)', q(13));
    vaut('√49 + √25', q(12));
    vaut('√(9 + 16)', q(5));
    expect(() => evaluer('√50')).toThrow();
    expect(racineQ(q(9, 4))).toEqual(q(3, 2));
    expect(racineQ(q(2))).toBeNull();
  });

  it('refuse ce qu\'il ne sait pas lire plutôt que de deviner', () => {
    expect(() => evaluer('3 + ')).toThrow();
    expect(() => evaluer('(3 + 4')).toThrow();
    expect(() => evaluer('3 x 4')).toThrow();
    expect(() => evaluer('3 ÷ 0')).toThrow();
  });
});

describe('le lecteur de polynômes', () => {
  it('développe et réduit comme le fait un élève de troisième', () => {
    expect(polyEgaux(lirePolynome('3(x + 2)'), lirePolynome('3x + 6'))).toBe(true);
    expect(polyEgaux(lirePolynome('(x + 3)(x + 5)'), lirePolynome('x² + 8x + 15'))).toBe(true);
    expect(polyEgaux(lirePolynome('(x − 5)²'), lirePolynome('x² − 10x + 25'))).toBe(true);
    expect(polyEgaux(lirePolynome('(2x + 1)²'), lirePolynome('4x² + 4x + 1'))).toBe(true);
    expect(polyEgaux(lirePolynome('(x + 3)(x − 3)'), lirePolynome('x² − 9'))).toBe(true);
    expect(polyEgaux(lirePolynome('−2(x − 4)'), lirePolynome('−2x + 8'))).toBe(true);
    expect(polyEgaux(lirePolynome('x(x − 5)'), lirePolynome('x² − 5x'))).toBe(true);
    expect(polyEgaux(lirePolynome('4x(x + 2)'), lirePolynome('4x² + 8x'))).toBe(true);
    expect(polyEgaux(lirePolynome('3x + 5 − 8x + 2'), lirePolynome('−5x + 7'))).toBe(true);
  });

  it('distingue les erreurs classiques des bonnes réponses', () => {
    // (a + b)² n'est pas a² + b².
    expect(polyEgaux(lirePolynome('(x + 4)²'), lirePolynome('x² + 16'))).toBe(false);
    // −(x − 3) n'est pas −x − 3.
    expect(polyEgaux(lirePolynome('−(x − 3)'), lirePolynome('−x − 3'))).toBe(false);
    expect(polyEgaux(lirePolynome('2x + 3x'), lirePolynome('5x²'))).toBe(false);
  });

  it('lit une lettre autre que x, et une équation', () => {
    expect(polyEgaux(lirePolynome('3a + 2a', 'a'), lirePolynome('5a', 'a'))).toBe(true);
    const equation = lireEquation('3x + 5 = 20');
    expect(polyDegre(equation)).toBe(1);
    expect(polyEvaluer(equation, q(5)).n).toBe(0n);
    expect(polyEvaluer(equation, q(4)).n).not.toBe(0n);
    expect(polyEvaluer(lireEquation('5x + 3 = 2x + 12'), q(3)).n).toBe(0n);
    expect(polyEvaluer(lireEquation('(x − 3)(x + 5) = 0'), q(-5)).n).toBe(0n);
    expect(() => lireEquation('3x + 5')).toThrow();
  });
});

describe('le lecteur d\'expressions littérales', () => {
  it('calcule pour des valeurs des lettres, avec le produit sans signe', () => {
    expect(eqQ(evaluerAvecLettres('3x − 5', { x: q(4) }), q(7))).toBe(true);
    expect(eqQ(evaluerAvecLettres('2x²', { x: q(-3) }), q(18))).toBe(true);
    expect(eqQ(evaluerAvecLettres('(x + 3)(x − 5)', { x: q(2) }), q(-15))).toBe(true);
    expect(eqQ(evaluerAvecLettres('xy²', { x: q(2), y: q(3) }), q(18))).toBe(true);
    expect(eqQ(evaluerAvecLettres('x ÷ 3', { x: q(12) }), q(4))).toBe(true);
    expect(eqQ(evaluerAvecLettres('−x²', { x: q(5) }), q(-25))).toBe(true);
    expect(() => evaluerAvecLettres('3z', { x: q(1) })).toThrow();
  });

  it('reconnaît deux expressions égales, et deux expressions qui ne le sont pas', () => {
    expect(memeExpression('3(x + 2)', '3x + 6')).toBe(true);
    expect(memeExpression('(x + 3)²', 'x² + 6x + 9')).toBe(true);
    expect(memeExpression('(2x − 1)(x + 4)', '2x² + 7x − 4')).toBe(true);
    expect(memeExpression('(x + 3)²', 'x² + 9')).toBe(false);
    expect(memeExpression('3 × x × 4', '12x')).toBe(true);
    expect(memeExpression('x × x', '2x')).toBe(false);
    expect(memeExpression('3 × x × y', '3xy', ['x', 'y'])).toBe(true);
    expect(memeExpression('3 × x × y', '3 + x + y', ['x', 'y'])).toBe(false);
  });
});
