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

// Le papier du cahier, ses lignes Seyès et sa marge, et l'arc-en-ciel de
// l'École : les sept notions du français et des maths (mêmes couleurs que
// src/theme.ts). L'icône est l'École elle-même.
const PAPER = [251, 247, 238];
const LINE = [201, 221, 242];
const MARGIN = [233, 150, 138];
const BANDS = [
  [229, 72, 77], // conjugaison — rouge
  [242, 132, 47], // accords — orange
  [247, 197, 72], // orthographe — jaune
  [61, 174, 107], // numération — vert
  [46, 155, 224], // calcul — bleu
  [122, 79, 224], // problèmes — violet
  [208, 71, 155], // géométrie — rose
];

function insideRoundedSquare(x, y, size, radius) {
  const min = radius;
  const max = size - radius;
  const cx = x < min ? min : x > max ? max : x;
  const cy = y < min ? min : y > max ? max : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/** La couleur du dessin en un point (hors transparence des coins). */
function colorAt(x, y, size, arcRatio) {
  const cx = size / 2;
  const cy = size * 0.66;
  const outer = size * arcRatio;
  const band = outer / 10;
  if (y <= cy) {
    const distance = Math.hypot(x - cx, y - cy);
    const index = Math.floor((outer - distance) / band);
    if (distance <= outer && index >= 0 && index < BANDS.length) return BANDS[index];
  }
  const step = size / 9;
  const lineWidth = Math.max(1, size / 180);
  if (Math.abs(x - size * 0.15) < lineWidth) return MARGIN;
  if (((y + step / 2) % step) < lineWidth) return LINE;
  return PAPER;
}

/**
 * @param size        côté de l'image, en pixels
 * @param cornerRatio 0 pour un carré plein (icône « maskable », que le système
 *                    rognera lui-même), 0.22 pour un carré arrondi
 * @param arcRatio    rayon de l'arc-en-ciel, en fraction du côté
 */
function drawIcon(size, cornerRatio, arcRatio) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = Math.round(size * cornerRatio);
  // Quatre fois quatre échantillons par pixel : des bords lisses, même en
  // 32 pixels.
  const samples = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let alpha = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          if (radius > 0 && !insideRoundedSquare(px, py, size, radius)) continue;
          const [cr, cg, cb] = colorAt(px, py, size, arcRatio);
          r += cr;
          g += cg;
          b += cb;
          alpha += 1;
        }
      }
      const offset = (y * size + x) * 4;
      if (alpha > 0) {
        rgba[offset] = Math.round(r / alpha);
        rgba[offset + 1] = Math.round(g / alpha);
        rgba[offset + 2] = Math.round(b / alpha);
      }
      rgba[offset + 3] = Math.round((alpha / (samples * samples)) * 255);
    }
  }
  return encodePng(size, size, rgba);
}

const FILES = [
  // nom, taille, arrondi, rayon de l'arc-en-ciel
  ['favicon-32.png', 32, 0.22, 0.44],
  ['icon-192.png', 192, 0.22, 0.4],
  ['icon-512.png', 512, 0.22, 0.4],
  // L'icône « maskable » est rognée par le système : le dessin reste dans les
  // 80 % centraux, sinon Android en coupe les bords.
  ['icon-maskable-512.png', 512, 0, 0.32],
  // iOS applique lui-même le masque et n'aime pas la transparence.
  ['apple-touch-icon.png', 180, 0, 0.38],
];

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, size, corner, arc] of FILES) {
  writeFileSync(join(OUT_DIR, name), drawIcon(size, corner, arc));
  console.log(`${name} — ${size}×${size}`);
}
