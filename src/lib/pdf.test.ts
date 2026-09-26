import { describe, expect, it } from 'vitest';
import { encodePdfText, encodePdfTextUtf16, renderPdf, PAGE_HEIGHT, type PdfPage } from './pdf';

function asLatin1(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => String.fromCharCode(b)).join('');
}

const samplePages: PdfPage[] = [
  {
    items: [
      { kind: 'text', x: 40, y: 60, size: 18, text: 'Séance de maths — Nolhan', bold: true },
      { kind: 'rect', x: 40, y: 80, width: 200, height: 100, strokeGray: 0.8 },
      {
        kind: 'polyline',
        points: [
          [50, 90],
          [60, 100],
          [70, 95],
        ],
        width: 2,
      },
    ],
  },
  { items: [{ kind: 'text', x: 40, y: 60, size: 12, text: 'Page 2' }] },
];

describe('encodePdfText', () => {
  it('encode les accents français sur un seul octet', () => {
    expect(encodePdfText('é')).toEqual([0xe9]);
    expect(encodePdfText('à')).toEqual([0xe0]);
    expect(encodePdfText('ç')).toEqual([0xe7]);
    expect(encodePdfText('û')).toEqual([0xfb]);
    expect(encodePdfText('«»')).toEqual([0xab, 0xbb]);
  });

  it('place les caractères hors Latin-1 selon WinAnsiEncoding', () => {
    expect(encodePdfText('’')).toEqual([0x92]); // apostrophe typographique
    expect(encodePdfText('—')).toEqual([0x97]);
    expect(encodePdfText('…')).toEqual([0x85]);
    expect(encodePdfText('œ')).toEqual([0x9c]);
  });

  it('échappe les caractères réservés du format', () => {
    expect(encodePdfText('(')).toEqual([0x5c, 0x28]);
    expect(encodePdfText(')')).toEqual([0x5c, 0x29]);
    expect(encodePdfText('\\')).toEqual([0x5c, 0x5c]);
  });

  it('remplace par « ? » ce que la police ne sait pas écrire', () => {
    expect(encodePdfText('⭐')).toEqual([0x3f]);
  });
});

describe('encodePdfTextUtf16', () => {
  it('commence par la marque d\'ordre des octets', () => {
    expect(encodePdfTextUtf16('A').slice(0, 2)).toEqual([0xfe, 0xff]);
  });

  it('écrit chaque caractère sur deux octets', () => {
    expect(encodePdfTextUtf16('A')).toEqual([0xfe, 0xff, 0x00, 0x41]);
    expect(encodePdfTextUtf16('é')).toEqual([0xfe, 0xff, 0x00, 0xe9]);
    // Le tiret cadratin, que PDFDocEncoding affichait « Š ».
    expect(encodePdfTextUtf16('—')).toEqual([0xfe, 0xff, 0x20, 0x14]);
  });

  it('échappe les octets réservés, y compris quand ils viennent d\'un caractère ASCII', () => {
    expect(encodePdfTextUtf16('(')).toEqual([0xfe, 0xff, 0x00, 0x5c, 0x28]);
    expect(encodePdfTextUtf16('\\')).toEqual([0xfe, 0xff, 0x00, 0x5c, 0x5c]);
  });
});

describe('renderPdf', () => {
  const bytes = renderPdf(samplePages, { title: 'Séance' });
  const text = asLatin1(bytes);

  it('produit un fichier PDF reconnaissable', () => {
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('déclare autant de pages qu\'il en contient', () => {
    expect(text).toContain('/Count 2');
    expect(text.match(/\/Type \/Page[^s]/g)).toHaveLength(2);
  });

  it('donne à chaque flux la longueur réelle de son contenu', () => {
    const lengths = [...text.matchAll(/<< \/Length (\d+) >>\nstream\n/g)];
    expect(lengths.length).toBe(2);
    lengths.forEach((match) => {
      const start = (match.index ?? 0) + match[0].length;
      const declared = Number(match[1]);
      expect(text.slice(start + declared, start + declared + 10)).toBe('\nendstream');
    });
  });

  it('écrit une table xref dont chaque position tombe sur son objet', () => {
    // C'est l'erreur qui rend un PDF illisible sans rien signaler :
    // un décalage d'un octet et le lecteur refuse le fichier.
    const xrefStart = Number(text.match(/startxref\n(\d+)/)?.[1]);
    expect(text.slice(xrefStart, xrefStart + 4)).toBe('xref');

    const header = text.slice(xrefStart).match(/xref\n0 (\d+)\n/);
    const count = Number(header?.[1]);
    const entries = [...text.slice(xrefStart).matchAll(/^(\d{10}) 00000 n $/gm)];
    expect(entries).toHaveLength(count - 1);

    entries.forEach((entry, index) => {
      const offset = Number(entry[1]);
      expect(text.slice(offset, offset + 10), `objet ${index + 1}`).toMatch(
        new RegExp(`^${index + 1} 0 obj`)
      );
    });
  });

  it('retourne le repère : le haut de la page devient le haut du dessin', () => {
    // y = 60 depuis le haut doit s'écrire 841,89 - 60 dans le fichier.
    expect(text).toContain(`40 ${String(Math.round((PAGE_HEIGHT - 60) * 100) / 100)} Td`);
  });

  it('embarque le texte accentué tel qu\'il sera affiché', () => {
    expect(text).toContain('S\xe9ance de maths \x97 Nolhan');
  });

  it('écrit le titre du document en UTF-16, pas dans l\'encodage des pages', () => {
    const titled = asLatin1(renderPdf(samplePages, { title: 'Opérations — Nolhan' }));
    expect(titled).toContain('/Title (\xfe\xff\x00O\x00p\x00\xe9');
    expect(titled).toContain('\x20\x14'); // le tiret cadratin, en UTF-16
  });

  it('accepte une page sans rien dessus plutôt que de produire un fichier vide', () => {
    const empty = asLatin1(renderPdf([]));
    expect(empty.startsWith('%PDF')).toBe(true);
    expect(empty).toContain('/Count 1');
  });

  it('dessine quand même un point isolé, qu\'un trait de longueur nulle perdrait', () => {
    const dot = asLatin1(renderPdf([{ items: [{ kind: 'polyline', points: [[10, 10]] }] }]));
    expect(dot).toContain('10 831.89 m');
    expect(dot).toContain('S');
  });
});
