import type { VoiceLang } from '../types';

/**
 * La lecture à voix haute, par la synthèse vocale de l'appareil : rien n'est
 * envoyé sur internet, et rien n'est à télécharger. Le français est lu par une
 * voix française, l'anglais par une voix anglaise, un peu plus lentement
 * qu'en conversation.
 */

export interface Morceau {
  text: string;
  lang: VoiceLang;
  /** Beaucoup plus lentement : pour bien entendre chaque son. */
  slow?: boolean;
}

export function voixDisponible(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Une voix de cette langue est-elle installée ? Sans elle, l'appareil lirait l'anglais avec l'accent français. */
export function voixPour(lang: VoiceLang): boolean {
  if (!voixDisponible()) return false;
  const voices = window.speechSynthesis.getVoices();
  // Certains navigateurs ne donnent la liste qu'après coup : on fait confiance à l'appareil.
  return voices.length === 0 || voices.some((voice) => voice.lang.replace('_', '-').startsWith(lang.slice(0, 2)));
}

/** Coupe un texte entre ce qui est entre guillemets et le reste, chacun dans sa langue. */
export function morceaux(text: string, quoteLang: VoiceLang = 'fr-FR'): Morceau[] {
  if (quoteLang === 'fr-FR') return [{ text, lang: 'fr-FR' }];
  return text
    .split(/(« .+? »)/)
    .filter((part) => part.trim().length > 0)
    .map((part) =>
      part.startsWith('«') ? { text: part.slice(1, -1).trim(), lang: quoteLang } : { text: part, lang: 'fr-FR' as const }
    );
}

export function dire(parts: Morceau[]): void {
  if (!voixDisponible()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = synth.getVoices();
  for (const part of parts) {
    const utterance = new SpeechSynthesisUtterance(part.text.replace(/\*\*/g, ''));
    utterance.lang = part.lang;
    const voice = voices.find((candidate) => candidate.lang.replace('_', '-') === part.lang) ??
      voices.find((candidate) => candidate.lang.startsWith(part.lang.slice(0, 2)));
    if (voice) utterance.voice = voice;
    utterance.rate = (part.lang === 'en-GB' ? 0.85 : 0.95) * (part.slow ? 0.6 : 1);
    synth.speak(utterance);
  }
}

export function taire(): void {
  if (voixDisponible()) window.speechSynthesis.cancel();
}
