import { describe, expect, it } from 'vitest';
import { buildWorksheet, isAnswerCorrect, worksheetScore, OPERATIONS_PER_WORKSHEET } from './worksheet';
import { ALL_TRIMESTERS } from '../types';
import type { Level, Trimester } from '../types';

const LEVELS: Level[] = ['CM1', 'CM2'];
const base = { name: 'Nolhan', level: 'CM1' as Level, trimester: 1 as Trimester, seed: 4 };

describe('buildWorksheet', () => {
  it('produit le nombre d\'opérations attendu', () => {
    expect(buildWorksheet(base).operations).toHaveLength(OPERATIONS_PER_WORKSHEET);
  });

  it('est reproductible à graine égale', () => {
    const createdAt = '2026-09-25T10:00:00.000Z';
    expect(buildWorksheet({ ...base, createdAt })).toEqual(buildWorksheet({ ...base, createdAt }));
  });

  it('ne propose que des opérations qui valent la peine d\'être posées', () => {
    // Une opération posée fait travailler une technique. « 7 × 8 » se récite,
    // « 14 ÷ 7 » se fait de tête : ni l'une ni l'autre n'a sa place ici.
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        buildWorksheet({ ...base, level, trimester, count: 40 }).operations.forEach((operation) => {
          const [a, op, b] = operation.statement.split(' ');
          expect(
            a.replace(',', '').length,
            `« ${operation.statement} » se fait de tête, la poser n'apprend rien`
          ).toBeGreaterThanOrEqual(3);
          expect(['+', '-', '×', '÷']).toContain(op);
          // Une opération décimale doit l'être des deux côtés pour l'addition
          // et la soustraction : c'est l'alignement des virgules qu'on travaille.
          if (['+', '-'].includes(op) && (a.includes(',') || b.includes(','))) {
            expect(a).toContain(',');
            expect(b).toContain(',');
          }
        });
      });
    });
  });

  it('ne propose aucune technique non enseignée au premier trimestre du CM1', () => {
    const operations = buildWorksheet({ ...base, count: 40 }).operations;
    operations.forEach((operation) => {
      const op = operation.statement.split(' ')[1];
      expect(['+', '-']).toContain(op);
      expect(operation.statement).not.toContain(',');
    });
  });

  it('propose la division et la multiplication posée au troisième trimestre du CM1', () => {
    const statements = buildWorksheet({ ...base, trimester: 3, count: 40 }).operations.map(
      (o) => o.statement
    );
    expect(statements.some((s) => s.includes('÷'))).toBe(true);
    expect(statements.some((s) => s.includes('×'))).toBe(true);
  });

  it('donne un résultat exact pour chaque opération', () => {
    LEVELS.forEach((level) => {
      ALL_TRIMESTERS.forEach((trimester) => {
        buildWorksheet({ ...base, level, trimester, count: 20 }).operations.forEach((operation) => {
          const [a, op, b] = operation.statement.split(' ');
          const toNumber = (value: string) => Number(value.replace(',', '.'));
          const computed =
            op === '+'
              ? toNumber(a) + toNumber(b)
              : op === '-'
                ? toNumber(a) - toNumber(b)
                : op === '×'
                  ? toNumber(a) * toNumber(b)
                  : toNumber(a) / toNumber(b);
          expect(isAnswerCorrect(String(Math.round(computed * 1000) / 1000), operation.expected)).toBe(
            true
          );
        });
      });
    });
  });
});

describe('isAnswerCorrect', () => {
  it('accepte la virgule comme le point', () => {
    expect(isAnswerCorrect('12,5', '12,5')).toBe(true);
    expect(isAnswerCorrect('12.5', '12,5')).toBe(true);
  });

  it('ne reproche pas un zéro inutile à la fin', () => {
    expect(isAnswerCorrect('12,0', '12')).toBe(true);
    expect(isAnswerCorrect('12', '12,0')).toBe(true);
  });

  it('ignore les espaces', () => {
    expect(isAnswerCorrect(' 560 ', '560')).toBe(true);
  });

  it('refuse une réponse fausse, vide ou qui n\'est pas un nombre', () => {
    expect(isAnswerCorrect('561', '560')).toBe(false);
    expect(isAnswerCorrect('', '560')).toBe(false);
    expect(isAnswerCorrect('beaucoup', '560')).toBe(false);
  });
});

describe('worksheetScore', () => {
  it('compte les opérations réussies', () => {
    const worksheet = buildWorksheet(base);
    worksheet.answers[worksheet.operations[0].id] = {
      given: worksheet.operations[0].expected,
      strokes: [],
    };
    worksheet.answers[worksheet.operations[1].id] = { given: '0', strokes: [] };
    expect(worksheetScore(worksheet)).toEqual({ correct: 1, total: OPERATIONS_PER_WORKSHEET });
  });
});
