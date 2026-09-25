import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PUBLIC_DIR = join(process.cwd(), 'public');
const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'manifest.webmanifest'), 'utf8'));

/** Les huit premiers octets d'un fichier PNG. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('manifeste de la PWA', () => {
  it('déclare ce qu\'il faut pour être installable', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('fr');
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('reste relatif au dossier de publication', () => {
    // L'application est servie depuis /cm1-cm2/ : un chemin absolu la
    // ferait démarrer à la racine du domaine.
    expect(manifest.start_url).toBe('.');
    expect(manifest.scope).toBe('.');
    manifest.icons.forEach((icon: { src: string }) => expect(icon.src.startsWith('/')).toBe(false));
  });

  it('fournit les deux tailles attendues et une icône masquable', () => {
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    const purposes = manifest.icons.map((icon: { purpose: string }) => icon.purpose);
    expect(purposes).toContain('maskable');
  });

  it('pointe vers des fichiers PNG qui existent vraiment', () => {
    const files = [
      ...manifest.icons.map((icon: { src: string }) => icon.src),
      'apple-touch-icon.png',
      'favicon-32.png',
    ];
    files.forEach((file) => {
      const path = join(PUBLIC_DIR, file);
      expect(existsSync(path), `${file} est absent de public/`).toBe(true);
      expect(readFileSync(path).subarray(0, 8)).toEqual(PNG_SIGNATURE);
    });
  });
});

describe('page d\'accueil', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

  it('référence le manifeste et les icônes', () => {
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('apple-touch-icon');
    expect(html).toContain('name="theme-color"');
  });

  it('permet l\'ajout à l\'écran d\'accueil sur iPhone', () => {
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('apple-mobile-web-app-title');
  });
});
