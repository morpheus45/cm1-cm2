/**
 * La politique de sécurité du contenu de la page publiée.
 *
 * Le navigateur n'exécute que les scripts du site, et ne se connecte qu'au
 * site lui-même et à la base de la classe (Supabase) : ni publicité, ni
 * mesure d'audience, ni script venu d'ailleurs, même injecté. GitHub Pages ne
 * permet pas d'envoyer l'en-tête correspondant : une balise <meta> fait le
 * même travail, à ceci près qu'elle ne peut pas interdire l'affichage du site
 * dans un cadre (frame-ancestors).
 */
export function contentSecurityPolicy(supabaseUrl: string | undefined): string {
  let supabase = '';
  try {
    supabase = supabaseUrl?.trim() ? new URL(supabaseUrl.trim()).origin : '';
  } catch {
    // Une adresse illisible : l'application fonctionnera sans la base.
  }
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    // Les textures du papier sont des images SVG écrites dans la feuille de
    // style.
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${supabase ? ` ${supabase}` : ''}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
