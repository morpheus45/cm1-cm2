/**
 * Écriture de fichiers PDF, sans dépendance.
 *
 * Le besoin est étroit — du texte, des traits, des rectangles — et le format
 * PDF y répond directement : une police standard n'a pas besoin d'être
 * embarquée, et un tracé s'écrit en quelques opérateurs. Ajouter une
 * bibliothèque de plusieurs centaines de kilo-octets à une application que des
 * enfants ouvrent sur la tablette de la classe coûterait plus cher que ces
 * deux cents lignes.
 *
 * Les coordonnées de ce module partent du coin **haut gauche** de la page et
 * descendent, comme un écran. La conversion vers le repère PDF, qui part du
 * bas, est faite ici une fois pour toutes.
 */

export const PAGE_WIDTH = 595.28; // A4 portrait, en points
export const PAGE_HEIGHT = 841.89;

export interface TextItem {
  kind: 'text';
  x: number;
  y: number;
  size: number;
  text: string;
  bold?: boolean;
  gray?: number;
  /** Une couleur, à la place du gris : la correction de la maîtresse. */
  rgb?: [number, number, number];
  /** 'left' par défaut. */
  align?: 'left' | 'center' | 'right';
}

export interface PolylineItem {
  kind: 'polyline';
  points: Array<[number, number]>;
  width?: number;
  gray?: number;
  rgb?: [number, number, number];
}

export interface RectItem {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeGray?: number;
  fillGray?: number;
  lineWidth?: number;
}

export type PdfItem = TextItem | PolylineItem | RectItem;

export interface PdfPage {
  items: PdfItem[];
}

export interface PdfMetadata {
  title?: string;
  author?: string;
}

/** Caractères utiles hors Latin-1, tels que WinAnsiEncoding les code. */
const WIN_ANSI_EXTRAS: Record<string, number> = {
  '€': 0x80, // €
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85, // …
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89, // ‰
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c, // Œ
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92, // ’
  '“': 0x93, // “
  '”': 0x94, // ”
  '•': 0x95, // •
  '–': 0x96, // –
  '—': 0x97, // —
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c, // œ
  'ž': 0x9e,
  'Ÿ': 0x9f,
};

/** Largeurs approchées d'Helvetica, pour centrer et aligner à droite. */
const AVERAGE_CHAR_WIDTH = 0.5;

function textWidth(text: string, size: number): number {
  return text.length * AVERAGE_CHAR_WIDTH * size;
}

/**
 * Convertit une chaîne en octets WinAnsi, avec l'échappement des caractères
 * réservés du format. Un caractère que la police ne sait pas rendre devient un
 * point d'interrogation : mieux vaut un énoncé imparfait qu'un fichier illisible.
 */
export function encodePdfText(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) ?? 63;
    let byte: number;
    if (code < 0x100) {
      byte = code;
    } else if (WIN_ANSI_EXTRAS[char] !== undefined) {
      byte = WIN_ANSI_EXTRAS[char];
    } else {
      byte = 0x3f; // ?
    }
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) {
      bytes.push(0x5c); // antislash devant ( ) et \
    }
    bytes.push(byte);
  }
  return bytes;
}

/**
 * Les chaînes du dictionnaire d'informations (titre, auteur) ne sont pas lues
 * avec l'encodage de la police : le lecteur y applique PDFDocEncoding, où les
 * codes 0x80 à 0x9F ne désignent pas les mêmes caractères qu'en WinAnsi — un
 * tiret cadratin s'y affichait « Š ». La forme UTF-16 avec marque d'ordre des
 * octets, elle, est comprise partout.
 */
export function encodePdfTextUtf16(text: string): number[] {
  const bytes: number[] = [0xfe, 0xff];
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    const high = (unit >> 8) & 0xff;
    const low = unit & 0xff;
    for (const byte of [high, low]) {
      if (byte === 0x28 || byte === 0x29 || byte === 0x5c) bytes.push(0x5c);
      bytes.push(byte);
    }
  }
  return bytes;
}

/** Sans cela, un très petit nombre partirait en notation scientifique. */
function num(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '');
}

function flipY(y: number): number {
  return PAGE_HEIGHT - y;
}

function itemToOperators(item: PdfItem): string[] {
  if (item.kind === 'rect') {
    const ops: string[] = ['q'];
    const geometry = `${num(item.x)} ${num(flipY(item.y + item.height))} ${num(item.width)} ${num(item.height)} re`;
    if (item.fillGray !== undefined) {
      ops.push(`${num(item.fillGray)} g`, `${geometry} f`);
    }
    if (item.strokeGray !== undefined) {
      ops.push(`${num(item.strokeGray)} G`, `${num(item.lineWidth ?? 1)} w`, `${geometry} S`);
    }
    ops.push('Q');
    return ops;
  }

  if (item.kind === 'polyline') {
    if (item.points.length < 2) {
      // Un point isolé : un trait d'un dixième de point, pour qu'il se voie.
      if (item.points.length === 1) {
        const [x, y] = item.points[0];
        return itemToOperators({
          ...item,
          points: [
            [x, y],
            [x + 0.1, y],
          ],
        });
      }
      return [];
    }
    const ops: string[] = ['q'];
    if (item.rgb) {
      ops.push(`${num(item.rgb[0])} ${num(item.rgb[1])} ${num(item.rgb[2])} RG`);
    } else {
      ops.push(`${num(item.gray ?? 0)} G`);
    }
    ops.push(`${num(item.width ?? 1)} w`, '1 J', '1 j');
    item.points.forEach(([x, y], index) => {
      ops.push(`${num(x)} ${num(flipY(y))} ${index === 0 ? 'm' : 'l'}`);
    });
    ops.push('S', 'Q');
    return ops;
  }

  const font = item.bold ? '/F2' : '/F1';
  let x = item.x;
  if (item.align === 'center') x -= textWidth(item.text, item.size) / 2;
  if (item.align === 'right') x -= textWidth(item.text, item.size);
  const escaped = String.fromCharCode(...encodePdfText(item.text));
  return [
    'q',
    item.rgb ? `${item.rgb.map(num).join(' ')} rg` : `${num(item.gray ?? 0)} g`,
    'BT',
    `${font} ${num(item.size)} Tf`,
    `${num(x)} ${num(flipY(item.y))} Td`,
    `(${escaped}) Tj`,
    'ET',
    'Q',
  ];
}

function bytesOf(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i) & 0xff);
  }
  return bytes;
}

/** Assemble le fichier, en notant au passage où commence chaque objet : la
 *  table `xref` de la fin doit donner leur position exacte en octets. */
export function renderPdf(pages: PdfPage[], metadata: PdfMetadata = {}): Uint8Array {
  const safePages = pages.length > 0 ? pages : [{ items: [] }];
  const bytes: number[] = [];
  const offsets: number[] = [];

  const push = (text: string) => bytes.push(...bytesOf(text));

  const catalogId = 1;
  const pagesId = 2;
  const fontRegularId = 3;
  const fontBoldId = 4;
  const infoId = 5;
  const firstPageId = 6;

  const pageIds = safePages.map((_, index) => firstPageId + index * 2);
  const contentIds = safePages.map((_, index) => firstPageId + index * 2 + 1);
  const totalObjects = firstPageId + safePages.length * 2 - 1;

  const startObject = (id: number) => {
    offsets[id] = bytes.length;
    push(`${id} 0 obj\n`);
  };

  push('%PDF-1.4\n');
  // Marqueur conventionnel : signale aux outils que le fichier est binaire.
  bytes.push(0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a);

  startObject(catalogId);
  push(`<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`);

  startObject(pagesId);
  push(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${safePages.length} >>\nendobj\n`
  );

  startObject(fontRegularId);
  push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');

  startObject(fontBoldId);
  push(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n'
  );

  startObject(infoId);
  const infoString = (value: string) => String.fromCharCode(...encodePdfTextUtf16(value));
  const title = infoString(metadata.title ?? 'École Arc-en-Ciel');
  const author = infoString(metadata.author ?? 'École Arc-en-Ciel');
  push(`<< /Title (${title}) /Author (${author}) /Producer (${author}) >>\nendobj\n`);

  safePages.forEach((page, index) => {
    startObject(pageIds[index]);
    push(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${num(PAGE_WIDTH)} ${num(PAGE_HEIGHT)}] ` +
        `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> ` +
        `/Contents ${contentIds[index]} 0 R >>\nendobj\n`
    );

    const stream = page.items.flatMap(itemToOperators).join('\n');
    const streamBytes = bytesOf(stream);
    startObject(contentIds[index]);
    push(`<< /Length ${streamBytes.length} >>\nstream\n`);
    bytes.push(...streamBytes);
    push('\nendstream\nendobj\n');
  });

  const xrefOffset = bytes.length;
  push(`xref\n0 ${totalObjects + 1}\n`);
  push('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjects; id++) {
    push(`${String(offsets[id] ?? 0).padStart(10, '0')} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${totalObjects + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\n`);
  push(`startxref\n${xrefOffset}\n%%EOF\n`);

  return new Uint8Array(bytes);
}
