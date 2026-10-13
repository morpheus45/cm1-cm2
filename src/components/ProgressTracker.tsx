import { useState, useEffect } from 'react';
import type { DysType } from '../types/accessibility';
import type { CertificateData, CompetencyScore } from '../types/competencies';
import { calculateMasteryLevel } from '../types/competencies';

interface ProgressRecord {
  date: string;
  subject: string;
  level: string;
  questionsAnswered: number;
  correct: number;
  timeSpent: number; // minutes
}

interface ChildProgress {
  name: string;
  dys: DysType[];
  records: ProgressRecord[];
  totalQuestionsAnswered: number;
  totalCorrect: number;
  averageScore: number;
}

interface ProgressTrackerProps {
  childName: string;
  selectedDys: DysType[];
  subject: string;
  level: string;
  questionsAnswered: number;
  correctAnswers: number;
  onCertificateGenerated?: (certificate: CertificateData) => void;
}

const ENCOURAGEMENTS: Record<DysType, string[]> = {
  dyslexie: [
    '🌟 Bravo ! Tu as lu toutes les questions !',
    '✨ Superbe ! Tu comprends de mieux en mieux !',
    '🎉 Excellent travail de lecture !',
    '💪 Tu progresses vraiment, c\'est impressionnant !',
  ],
  dysorthographie: [
    '📝 Bien joué sur l\'orthographe !',
    '✅ Tes réponses sont de plus en plus correctes !',
    '🌟 Continue comme ça, tu progresses !',
    '💯 Excellent effort d\'orthographe !',
  ],
  dysgraphie: [
    '🖊️ Bravo pour ta coordination !',
    '✋ Superbe travail manuel !',
    '💪 Tu maîtrises de mieux en mieux !',
    '🎯 Excellent progrès !',
  ],
  dyscalculie: [
    '🔢 Bravo sur ces calculs !',
    '➕ Tu comprends les nombres de mieux en mieux !',
    '📊 Superbe travail mathématique !',
    '⭐ Tu es en train de devenir un champion des maths !',
  ],
  tdah: [
    '🎯 Wow ! Tu t\'es concentré super longtemps !',
    '⚡ Énergie ! Tu as bien travaillé !',
    '✨ Excellent focus, bravo !',
    '🚀 Superbe séance, continue !',
  ],
  dyspraxie: [
    '✋ Superbe coordination !',
    '🎮 Excellent contrôle !',
    '💪 Tu maîtrises ça de mieux en mieux !',
    '🌟 Progrès impressionnant !',
  ],
  dysphasia: [
    '🗣️ Bravo pour ton expression !',
    '💬 Tes idées sont claires !',
    '📢 Excellent communication !',
    '🌟 Tu t\'exprimes de mieux en mieux !',
  ],
  'trouble-vision': [
    '👁️ Bravo de bien lire malgré tout !',
    '✨ Superbe concentration visuelle !',
    '🌟 Excellent travail !',
    '💪 Tu progresses vraiment !',
  ],
  'trouble-audition': [
    '👂 Excellent travail !',
    '✨ Tu as bien compris !',
    '🌟 Superbe concentration !',
    '💪 Continue comme ça !',
  ],
};

export function ProgressTracker({
  childName,
  selectedDys,
  subject,
  level,
  questionsAnswered,
  correctAnswers,
  onCertificateGenerated,
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ChildProgress>(() => {
    try {
      const saved = localStorage.getItem(`progress-${childName}`);
      return saved ? JSON.parse(saved) : createNewProgress();
    } catch {
      return createNewProgress();
    }
  });

  function createNewProgress(): ChildProgress {
    return {
      name: childName,
      dys: selectedDys,
      records: [],
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      averageScore: 0,
    };
  }

  useEffect(() => {
    localStorage.setItem(`progress-${childName}`, JSON.stringify(progress));
  }, [progress, childName]);

  const recordSession = () => {
    if (questionsAnswered === 0) return;

    const newRecord: ProgressRecord = {
      date: new Date().toISOString(),
      subject,
      level,
      questionsAnswered,
      correct: correctAnswers,
      timeSpent: Math.round(questionsAnswered * 0.5), // estimation
    };

    setProgress((prev) => {
      const updated = { ...prev };
      updated.records.push(newRecord);
      updated.totalQuestionsAnswered += questionsAnswered;
      updated.totalCorrect += correctAnswers;
      updated.averageScore = (updated.totalCorrect / updated.totalQuestionsAnswered) * 100;
      return updated;
    });
  };

  const getEncouragement = (): string => {
    if (questionsAnswered === 0) return '';

    const allEncouragements = selectedDys.length > 0
      ? selectedDys.flatMap((dys) => ENCOURAGEMENTS[dys] || [])
      : Object.values(ENCOURAGEMENTS).flat();

    return allEncouragements[Math.floor(Math.random() * allEncouragements.length)] || '🌟 Bravo !';
  };

  const getMotivationalMessage = (): string => {
    const percentage = (correctAnswers / questionsAnswered) * 100 || 0;

    if (percentage === 100) {
      return '🏆 PARFAIT ! C\'est incroyable !';
    }
    if (percentage >= 80) {
      return '⭐ Excellent ! Continue comme ça !';
    }
    if (percentage >= 60) {
      return '💪 Très bien ! Tu progresses !';
    }
    if (percentage >= 40) {
      return '📈 Bonne tentative ! Essaie encore !';
    }
    return '🌱 C\'est un début ! Tu vas réussir !';
  };

  const progressPercentage = progress.totalQuestionsAnswered > 0
    ? (progress.totalCorrect / progress.totalQuestionsAnswered) * 100
    : 0;

  const improvementTrend = progress.records.length > 1
    ? progress.records[progress.records.length - 1].correct >
      progress.records[progress.records.length - 2].correct
      ? '📈 En progression !'
      : '➡️ Stable'
    : '🌟 Nouveau départ';

  const generateCertificate = (levelKey: string): CertificateData => {
    const subjects = ['Français', 'Mathématiques', 'Géographie', 'Histoire', 'Sciences', 'EMC', 'Anglais'];

    const competencies: CompetencyScore[] = subjects.map((subject) => {
      const subjectRecords = progress.records.filter((r) => r.subject === subject);
      const totalCorrect = subjectRecords.reduce((sum, r) => sum + r.correct, 0);
      const totalAnswered = subjectRecords.reduce((sum, r) => sum + r.questionsAnswered, 0);
      const percentage = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

      return {
        subject,
        level: levelKey,
        percentage: Math.round(percentage),
        masteryLevel: calculateMasteryLevel(percentage),
        questionsAnswered: totalAnswered,
        correctAnswers: totalCorrect,
      };
    });

    const overallPercentage = competencies.length > 0
      ? competencies.reduce((sum, c) => sum + c.percentage, 0) / competencies.length
      : 0;

    const strengths = competencies
      .filter((c) => c.percentage >= 85)
      .map((c) => `${c.subject}: ${c.percentage}%`);

    const areasToImprove = competencies
      .filter((c) => c.percentage < 80)
      .map((c) => `${c.subject}: ${c.percentage}%`);

    return {
      childName,
      level: levelKey,
      date: new Date().toISOString(),
      competencies,
      overallLevel: calculateMasteryLevel(overallPercentage),
      overallPercentage: Math.round(overallPercentage),
      canProgressToNextLevel: overallPercentage >= 80,
      strengths,
      areasToImprove,
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-purple-900 mb-4">📊 Suivi de Progression</h2>

      {/* Encouragement en direct */}
      {questionsAnswered > 0 && (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <p className="text-lg font-bold text-center text-gray-900">
            {getEncouragement()}
          </p>
          <p className="text-center text-xl font-bold mt-2">
            {getMotivationalMessage()}
          </p>
          <p className="text-center text-sm text-gray-700 mt-2">
            {correctAnswers}/{questionsAnswered} ✅ ({Math.round((correctAnswers / questionsAnswered) * 100)}%)
          </p>
        </div>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Questions</p>
          <p className="text-3xl font-bold text-purple-600">{progress.totalQuestionsAnswered}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Bonnes Réponses</p>
          <p className="text-3xl font-bold text-green-600">{progress.totalCorrect}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Pourcentage Moyen</p>
          <p className="text-3xl font-bold text-blue-600">{Math.round(progressPercentage)}%</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Tendance</p>
          <p className="text-xl font-bold text-indigo-600">{improvementTrend}</p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold text-gray-700">Progression</p>
          <p className="text-lg font-bold text-purple-600">{Math.round(progressPercentage)}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-4 rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Messages d'adaptation par dys */}
      {selectedDys.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <p className="font-semibold text-blue-900 mb-2">💡 Ton adaptation personnalisée :</p>
          <ul className="text-sm text-blue-800">
            {selectedDys.map((dys) => (
              <li key={dys} className="mb-1">
                ✅ Interface adaptée pour {dys}
              </li>
            ))}
          </ul>
          <p className="text-xs text-blue-700 mt-3 italic">
            Chaque enfant apprend à sa façon. Tu fais du très bon travail ! 🌟
          </p>
        </div>
      )}

      {/* Historique récent */}
      {progress.records.length > 0 && (
        <div>
          <p className="font-semibold text-gray-700 mb-3">📈 Historique Récent</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {progress.records.slice(-5).reverse().map((record, idx) => (
              <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">{record.subject} - {record.level}</span>
                  <span className="text-gray-600">
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-gray-700">
                  {record.correct}/{record.questionsAnswered} ✅ ({Math.round((record.correct / record.questionsAnswered) * 100)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton pour enregistrer */}
      {questionsAnswered > 0 && (
        <button
          onClick={recordSession}
          className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition"
        >
          ✅ Enregistrer cette séance
        </button>
      )}

      {/* Bouton pour afficher le certificat */}
      {progress.records.length > 0 && (
        <button
          onClick={() => onCertificateGenerated?.(generateCertificate(level))}
          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-700 transition"
        >
          🎓 Voir mon Certificat de Compétences
        </button>
      )}
    </div>
  );
}
