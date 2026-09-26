/** Propose un fichier au téléchargement. Sur tablette, le système ouvre son
 *  panneau de partage : la maîtresse peut envoyer le PDF ou l'imprimer. */
export function downloadBytes(bytes: Uint8Array, fileName: string, mimeType: string): void {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Laisser le temps au navigateur de lancer le téléchargement avant de
  // libérer l'URL, sinon le fichier arrive vide sur certains appareils.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
