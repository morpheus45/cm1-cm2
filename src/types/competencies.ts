export type MasteryLevel = 'basique' | 'intermediaire' | 'avance' | 'excellence';

export interface CompetencyScore {
  subject: string;
  level: string;
  percentage: number;
  masteryLevel: MasteryLevel;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface CertificateData {
  childName: string;
  level: string;
  date: string;
  competencies: CompetencyScore[];
  overallLevel: MasteryLevel;
  overallPercentage: number;
  canProgressToNextLevel: boolean;
  areasToImprove: string[];
  strengths: string[];
}

export const MASTERY_THRESHOLDS = {
  basique: { min: 0, max: 64 },
  intermediaire: { min: 65, max: 79 },
  avance: { min: 80, max: 94 },
  excellence: { min: 95, max: 100 },
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  basique: 'Basique',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé ✅',
  excellence: 'Excellence 🏆',
};

export const MASTERY_DESCRIPTIONS: Record<MasteryLevel, string> = {
  basique: 'Concepts fondamentaux en apprentissage',
  intermediaire: 'Maîtrise de la plupart des concepts',
  avance: 'Maîtrise complète du curriculum',
  excellence: 'Dépassement du curriculum standard',
};

export const MASTERY_STARS: Record<MasteryLevel, number> = {
  basique: 2,
  intermediaire: 3,
  avance: 4,
  excellence: 5,
};

export function calculateMasteryLevel(percentage: number): MasteryLevel {
  if (percentage >= 95) return 'excellence';
  if (percentage >= 80) return 'avance';
  if (percentage >= 65) return 'intermediaire';
  return 'basique';
}

export function getStar(level: MasteryLevel): string {
  const stars = MASTERY_STARS[level];
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export function getRecommendation(masteryLevel: MasteryLevel): string {
  switch (masteryLevel) {
    case 'excellence':
      return '🏆 Accès aux défis d\'excellence !';
    case 'avance':
      return '✅ Prêt pour le niveau suivant';
    case 'intermediaire':
      return '📈 Continuer les révisions';
    case 'basique':
      return '🌱 Renforcer les fondamentaux';
  }
}
