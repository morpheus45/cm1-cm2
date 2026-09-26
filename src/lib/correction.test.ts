import { describe, expect, it } from 'vitest';
import {
  APPRECIATION_MAX_LENGTH,
  correctionsOf,
  isCorrectionEmpty,
  parseCorrections,
  parseStrokes,
  withCorrections,
  worksheetFromRow,
  wrapAppreciation,
} from './correction';
import type { Worksheet } from './worksheet';
import { worksheetFileName, worksheetToPdfPages } from './worksheetPdf';
import type { PdfItem, TextItem } from './pdf';

const meta = { name: 'Léa Martin', level: 'CM1' as const, trimester: 2 as const, createdAt: '2026-10-05T09:00:00.000Z' };

const sheet: Worksheet = {
  ...meta,
  operations: [
    { id: 'a', statement: '244 + 282', expected: '526' },
    { id: 'b', statement: '903 − 457', expected: '446' },
  ],
  answers: {
    a: { given: '526', strokes: [{ points: [[0.1, 0.2], [0.3, 0.4]] }] },
    b: { given: '556', strokes: [{ points: [[0.5, 0.5]] }] },
  },
};

describe('correctionsOf', () => {
  it('ne garde que les opérations annotées, avec des points arrondis', () => {
    const corrected: Worksheet = {
      ...sheet,
      appreciation: '  Revois   les retenues. ',
      answers: {
        ...sheet.answers,
        b: { ...sheet.answers.b, teacherStrokes: [{ points: [[0.123456, 0.654321]] }, { points: [] }] },
      },
    };
    expect(correctionsOf(corrected)).toEqual({
      version: 1,
      appreciation: 'Revois les retenues.',
      operations: { b: { teacherStrokes: [{ points: [[0.1235, 0.6543]] }] } },
    });
  });

  it('dit quand il n\'y a rien à enregistrer', () => {
    expect(isCorrectionEmpty(correctionsOf(sheet))).toBe(true);
    expect(isCorrectionEmpty(correctionsOf({ ...sheet, appreciation: 'Bien' }))).toBe(false);
  });

  it('borne l\'appréciation', () => {
    const long = 'a'.repeat(APPRECIATION_MAX_LENGTH + 50);
    expect(correctionsOf({ ...sheet, appreciation: long }).appreciation).toHaveLength(APPRECIATION_MAX_LENGTH);
  });
});

describe('la lecture de ce qui vient de la base', () => {
  it('écarte les points hors du cadre ou mal formés, un par un', () => {
    expect(
      parseStrokes([
        { points: [[0.1, 0.1], [1.5, 0.2], ['x', 0.3], [0.4], [0.5, 0.5]] },
        { points: 'abîmé' },
        null,
        { points: [[-0.1, 0.2]] },
      ])
    ).toEqual([{ points: [[0.1, 0.1], [0.5, 0.5]] }]);
    expect(parseStrokes('rien')).toEqual([]);
  });

  it('tolère une correction absente ou abîmée', () => {
    const empty = { version: 1, appreciation: '', operations: {} };
    expect(parseCorrections(null)).toEqual(empty);
    expect(parseCorrections([1, 2])).toEqual(empty);
    expect(parseCorrections({ appreciation: 42, operations: { a: 'x' } })).toEqual(empty);
  });

  it('refait à l\'identique une correction enregistrée', () => {
    const corrected = withCorrections(sheet, {
      version: 1,
      appreciation: 'Attention aux retenues.',
      operations: { b: { teacherStrokes: [{ points: [[0.2, 0.3], [0.4, 0.5]] }] } },
    });
    const stored = JSON.parse(JSON.stringify(correctionsOf(corrected)));
    expect(withCorrections(sheet, parseCorrections(stored))).toEqual(corrected);
  });

  it('remplace la correction précédente au lieu de s\'y ajouter', () => {
    const first = withCorrections(sheet, {
      version: 1,
      appreciation: 'Premier jet',
      operations: { a: { teacherStrokes: [{ points: [[0.1, 0.1]] }] } },
    });
    const second = withCorrections(first, { version: 1, appreciation: '', operations: {} });
    expect(second.answers.a.teacherStrokes).toEqual([]);
    expect(second.appreciation).toBe('');
    // L'écriture de l'élève, elle, ne bouge pas.
    expect(second.answers.a.strokes).toEqual(sheet.answers.a.strokes);
  });

  it('reconstitue une feuille depuis sa ligne', () => {
    const row = {
      operations: [...sheet.operations, { id: 7, statement: null }],
      answers: { ...sheet.answers, inconnue: { given: '1', strokes: [] }, b: { given: 556, strokes: 'x' } },
      corrections: { version: 1, appreciation: 'Bien', operations: { a: { teacherStrokes: [{ points: [[0.5, 0.5]] }] } } },
    };
    const worksheet = worksheetFromRow(row, meta);
    expect(worksheet?.operations.map((operation) => operation.id)).toEqual(['a', 'b']);
    expect(Object.keys(worksheet?.answers ?? {})).toEqual(['a', 'b']);
    expect(worksheet?.answers.b).toEqual({ given: '', strokes: [], teacherStrokes: [] });
    expect(worksheet?.answers.a.teacherStrokes).toEqual([{ points: [[0.5, 0.5]] }]);
    expect(worksheet?.appreciation).toBe('Bien');
    expect(worksheet?.name).toBe('Léa Martin');
  });

  it('refuse une ligne sans opération lisible', () => {
    expect(worksheetFromRow(null, meta)).toBeNull();
    expect(worksheetFromRow({ operations: 'x' }, meta)).toBeNull();
    expect(worksheetFromRow({ operations: [{ id: 'a' }] }, meta)).toBeNull();
  });
});

describe('wrapAppreciation', () => {
  it('coupe entre deux mots, et signale ce qui ne tient pas', () => {
    expect(wrapAppreciation('Très bon travail, attention aux retenues', 20)).toEqual([
      'Très bon travail,',
      'attention aux…',
    ]);
  });

  it('garde tout quand ça tient', () => {
    expect(wrapAppreciation('Très bien !')).toEqual(['Très bien !']);
    expect(wrapAppreciation('   ')).toEqual([]);
  });

  it('coupe net un mot plus long qu\'une ligne', () => {
    expect(wrapAppreciation('abcdefghij klm', 4, 5)).toEqual(['abcd', 'efgh', 'ij', 'klm']);
  });
});

describe('le PDF corrigé', () => {
  const corrected = withCorrections(sheet, {
    version: 1,
    appreciation: 'Revois la soustraction avec retenue.',
    operations: { b: { teacherStrokes: [{ points: [[0.2, 0.3], [0.4, 0.5]] }] } },
  });

  it('écrit l\'appréciation en rouge et descend les opérations', () => {
    const [plain] = worksheetToPdfPages(sheet);
    const [page] = worksheetToPdfPages(corrected);
    const red = page.items.filter((item) => item.kind === 'text' && item.rgb);
    expect(red.map((item) => (item.kind === 'text' ? item.text : ''))).toEqual([
      'Appréciation :',
      'Revois la soustraction avec retenue.',
    ]);
    const statementY = (items: PdfItem[]) =>
      items.find((item): item is TextItem => item.kind === 'text' && item.text === '244 + 282')?.y ?? 0;
    expect(statementY(page.items)).toBeGreaterThan(statementY(plain.items));
  });

  it('trace les annotations de la maîtresse en rouge', () => {
    const redLines = (worksheet: Worksheet) =>
      worksheetToPdfPages(worksheet)[0].items.filter(
        (item) => item.kind === 'polyline' && item.rgb?.[0] === 0.85
      ).length;
    // La croix d'une réponse fausse est déjà rouge : le trait de la maîtresse
    // s'y ajoute.
    expect(redLines(corrected)).toBe(redLines(sheet) + 1);
  });

  it('nomme le fichier corrigé autrement que la copie', () => {
    expect(worksheetFileName(sheet)).toBe('operations-posees-lea-martin-2026-10-05.pdf');
    expect(worksheetFileName(corrected)).toBe('operations-posees-lea-martin-2026-10-05-corrigee.pdf');
  });

  it('tient dans la page, même avec deux lignes d\'appréciation', () => {
    const six: Worksheet = {
      ...meta,
      appreciation: 'Un très bon travail dans l\'ensemble, mais attention aux retenues et à bien aligner les chiffres.',
      operations: Array.from({ length: 6 }, (_, index) => ({ id: `o${index}`, statement: '1 + 1', expected: '2' })),
      answers: {},
    };
    const [page] = worksheetToPdfPages(six);
    const bottoms = page.items.map((item) =>
      item.kind === 'polyline'
        ? Math.max(...item.points.map(([, y]) => y))
        : item.kind === 'rect'
          ? item.y + item.height
          : item.y
    );
    expect(Math.max(...bottoms)).toBeLessThan(841.89 - 10);
  });
});
