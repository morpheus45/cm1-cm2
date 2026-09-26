/**
 * Une clé qui ne doit jamais se retrouver dans le code du site : la clé
 * « secret » de Supabase (sb_secret_…), ou l'ancienne clé « service_role »,
 * un jeton dont le rôle se lit en clair. L'une comme l'autre contourne toutes
 * les règles d'accès de la base : quiconque ouvrirait le site pourrait lire
 * et effacer les noms et les résultats de toute la classe.
 *
 * Sert deux fois : au build, pour refuser de publier le site, et au
 * lancement, pour ne pas s'en servir.
 */
export function isSecretKey(key: string): boolean {
  const trimmed = key.trim();
  if (trimmed.startsWith('sb_secret_')) return true;
  const parts = trimmed.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload: unknown = JSON.parse(atob(padded));
    return (payload as { role?: unknown } | null)?.role === 'service_role';
  } catch {
    return false;
  }
}
