// Génère les icônes de l'application dans public/.
//
// Tout est calculé ici, sans dépendance : le dépôt n'embarque pas d'outil de
// dessin, et les icônes se régénèrent à l'identique avec `npm run icons`.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// --- Encodage PNG ---------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 8 bits par canal
  header[9] = 6; // RGBA
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filtre « none »
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Dessin ---------------------------------------------------------------

const TOP = [139, 92, 246]; // violet-500, la couleur du sélecteur de matière
const BOTTOM = [91, 33, 182]; // violet-800
const WHITE = [255, 255, 255];

const GLYPHS = {
  C: [
    '.#####.',
    '##...##',
    '#.....#',
    '#......',
    '#......',
    '#......',
    '#.....#',
    '##...##',
    '.#####.',
  ],
  M: [
    '#.....#',
    '##...##',
    '#.#.#.#',
    '#..#..#',
    '#.....#',
    '#.....#',
    '#.....#',
    '#.....#',
    '#.....#',
  ],
};

const GLYPH_WIDTH = 7;
const GLYPH_HEIGHT = 9;
const GLYPH_GAP = 2;

function insideRoundedSquare(x, y, size, radius) {
  const min = radius;
  const max = size - radius;
  const cx = x < min ? min : x > max ? max : x;
  const cy = y < min ? min : y > max ? max : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * @param size        côté de l'image, en pixels
 * @param cornerRatio 0 pour un carré plein (icône « maskable », que le système
 *                    rognera lui-même), 0.22 pour un carré arrondi
 * @param textRatio   largeur du texte, en fraction du côté
 */
function drawIcon(size, cornerRatio, textRatio) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = Math.round(size * cornerRatio);

  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const r = Math.round(TOP[0] + (BOTTOM[0] - TOP[0]) * t);
    const g = Math.round(TOP[1] + (BOTTOM[1] - TOP[1]) * t);
    const b = Math.round(TOP[2] + (BOTTOM[2] - TOP[2]) * t);
    for (let x = 0; x < size; x++) {
      const opaque = radius === 0 || insideRoundedSquare(x + 0.5, y + 0.5, size, radius);
      const offset = (y * size + x) * 4;
      rgba[offset] = r;
      rgba[offset + 1] = g;
      rgba[offset + 2] = b;
      rgba[offset + 3] = opaque ? 255 : 0;
    }
  }

  const columns = GLYPH_WIDTH * 2 + GLYPH_GAP;
  const scale = Math.max(1, Math.floor((size * textRatio) / columns));
  const textWidth = columns * scale;
  const textHeight = GLYPH_HEIGHT * scale;
  const originX = Math.round((size - textWidth) / 2);
  const originY = Math.round((size - textHeight) / 2);

  const paint = (glyph, columnOffset) => {
    glyph.forEach((row, gy) => {
      [...row].forEach((cell, gx) => {
        if (cell !== '#') return;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const x = originX + (columnOffset + gx) * scale + dx;
            const y = originY + gy * scale + dy;
            if (x < 0 || y < 0 || x >= size || y >= size) continue;
            const offset = (y * size + x) * 4;
            rgba[offset] = WHITE[0];
            rgba[offset + 1] = WHITE[1];
            rgba[offset + 2] = WHITE[2];
            rgba[offset + 3] = 255;
          }
        }
      });
    });
  };

  paint(GLYPHS.C, 0);
  paint(GLYPHS.M, GLYPH_WIDTH + GLYPH_GAP);

  return encodePng(size, size, rgba);
}

const FILES = [
  // nom, taille, arrondi, largeur du texte
  ['favicon-32.png', 32, 0.22, 0.72],
  ['icon-192.png', 192, 0.22, 0.62],
  ['icon-512.png', 512, 0.22, 0.62],
  // L'icône « maskable » est rognée par le système : le dessin reste dans les
  // 80 % centraux, sinon Android en coupe les bords.
  ['icon-maskable-512.png', 512, 0, 0.46],
  // iOS applique lui-même le masque et n'aime pas la transparence.
  ['apple-touch-icon.png', 180, 0, 0.56],
];

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, size, corner, text] of FILES) {
  writeFileSync(join(OUT_DIR, name), drawIcon(size, corner, text));
  console.log(`${name} — ${size}×${size}`);
}
