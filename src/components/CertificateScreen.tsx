import type { CertificateData } from '../types/competencies';
import { MASTERY_LABELS, getStar, getRecommendation } from '../types/competencies';

interface CertificateScreenProps {
  certificate: CertificateData;
  onContinue: () => void;
}

export function CertificateScreen({ certificate, onContinue }: CertificateScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Certificat */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6 border-4 border-gold">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-4xl font-bold text-purple-900">CERTIFICAT DE COMPÉTENCES</h1>
            <p className="text-xl text-gray-600 mt-4">Niveau {certificate.level}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 mb-6">
            <p className="text-center text-2xl font-bold text-gray-900 mb-2">
              {certificate.childName}
            </p>
            <p className="text-center text-sm text-gray-600">
              {new Date(certificate.date).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Compétences par matière */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-purple-900 mb-4">Compétences Acquises</h2>
            <div className="space-y-3">
              {certificate.competencies.map((comp) => (
                <div key={comp.subject} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">{comp.subject}</span>
                    <span className="text-yellow-500 text-lg">{getStar(comp.masteryLevel)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {comp.correctAnswers}/{comp.questionsAnswered} ✅
                    </span>
                    <span className="font-bold text-purple-600">
                      {comp.percentage.toFixed(0)}% - {MASTERY_LABELS[comp.masteryLevel]}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${comp.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé Global */}
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">Niveau Global</p>
              <p className="text-5xl font-bold text-purple-900 mb-2">
                {MASTERY_LABELS[certificate.overallLevel]}
              </p>
              <p className="text-3xl text-yellow-500 mb-4">{getStar(certificate.overallLevel)}</p>
              <p className="text-2xl font-bold text-gray-800">
                {certificate.overallPercentage.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Recommandation */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-center text-lg font-bold text-blue-900">
              {getRecommendation(certificate.overallLevel)}
            </p>
            {certificate.canProgressToNextLevel && (
              <p className="text-center text-green-700 font-semibold mt-2">
                ✅ Prêt pour le niveau suivant !
              </p>
            )}
          </div>

          {/* Points Forts */}
          {certificate.strengths.length > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-green-900 mb-3">💪 Points Forts</h3>
              <ul className="space-y-2">
                {certificate.strengths.map((strength) => (
                  <li key={strength} className="text-green-800 flex items-center">
                    <span className="mr-2">✅</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Domaines à Travailler */}
          {certificate.areasToImprove.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-orange-900 mb-3">📚 Domaines à Renforcer</h3>
              <ul className="space-y-2">
                {certificate.areasToImprove.map((area) => (
                  <li key={area} className="text-orange-800 flex items-center">
                    <span className="mr-2">📖</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-600 italic mb-2">
              Ce certificat reconnaît les compétences acquises dans le cadre du curriculum français.
            </p>
            <p className="text-xs text-gray-500">
              Délivré par la Plateforme d'Apprentissage Inclusive - {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Bouton Continuer */}
        <button
          onClick={onContinue}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition text-lg"
        >
          🚀 Continuer vers le Prochain Objectif
        </button>

        {/* Message d'encouragement */}
        <div className="bg-white rounded-lg shadow p-6 mt-6 text-center">
          <p className="text-lg text-gray-800">
            <span className="font-bold">Bravo ! 🎉</span>
          </p>
          <p className="text-gray-700 mt-2">
            Tu as montré une belle progression. Continue comme ça et tu atteindras l'excellence !
          </p>
          <p className="text-sm text-gray-600 mt-4 italic">
            Souviens-toi : chaque enfant apprend à son rythme. Tes efforts sont précieux, peu importe le résultat. 💫
          </p>
        </div>
      </div>
    </div>
  );
}
