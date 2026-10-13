import { useEffect, useState } from 'react';
import type { Level } from '../types';

type Subject = 'francais' | 'mathematiques' | 'geographie' | 'histoire' | 'sciences' | 'emc' | 'anglais';

interface Notion {
  fr: string;
  en: string;
  theme: string;
}

interface Question {
  consigne: string;
  enonce: string;
  bonne: string;
  fausses: string[];
  explication: string;
}

interface PedagogieContent {
  niveau: Level;
  trimestres: Record<string, { vocabulaire: Notion[]; questions: Question[] }>;
}

const SUBJECTS: { id: Subject; label: string }[] = [
  { id: 'francais', label: 'Français' },
  { id: 'mathematiques', label: 'Mathématiques' },
  { id: 'geographie', label: 'Géographie' },
  { id: 'histoire', label: 'Histoire' },
  { id: 'sciences', label: 'Sciences' },
  { id: 'emc', label: 'EMC' },
  { id: 'anglais', label: 'Anglais' },
];

const LEVELS: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'];

interface PedagogieScreenProps {
  initialLevel?: Level;
}

export function PedagogieScreen({ initialLevel }: PedagogieScreenProps) {
  const [subject, setSubject] = useState<Subject>('francais');
  const [level, setLevel] = useState<Level>(initialLevel ?? 'CE1');
  const [trimester, setTrimester] = useState('1');
  const [content, setContent] = useState<PedagogieContent | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/contenus/${subject}/${level}.json`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data);
        setAnswers({});
      })
      .catch((err) => {
        console.error('Erreur chargement contenu:', err);
        setContent(null);
      })
      .finally(() => setLoading(false));
  }, [subject, level]);

  const trimesterData = content?.trimestres[trimester];
  if (!trimesterData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Aucun contenu disponible</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = trimesterData.questions[Object.keys(answers).length];
  const allAnswered = Object.keys(answers).length === trimesterData.questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-purple-900 mb-6">📚 Pédagogie</h1>

          {/* Matières - Grille visible */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">📚 Matière</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubject(s.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    subject === s.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau et Trimestre - Sélecteurs */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🎓 Niveau</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Trimestre</label>
              <select
                value={trimester}
                onChange={(e) => setTrimester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="1">T1</option>
                <option value="2">T2</option>
                <option value="3">T3</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : allAnswered ? (
          /* Recap screen */
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-900 mb-2">✅ Bravo !</h2>
              <p className="text-green-700">Tu as répondu à toutes les questions de ce trimestre.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Récapitulatif</h3>
              <div className="space-y-4">
                {trimesterData.questions.map((q, i) => {
                  const answerIdx = answers[i];
                  const isCorrect = [q.bonne, ...q.fausses][answerIdx] === q.bonne;
                  const answerText = [q.bonne, ...q.fausses][answerIdx];
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'bg-green-50 border-green-300'
                          : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 mb-2">{q.enonce}</p>
                      <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {isCorrect ? '✅ Correct' : '❌ Incorrect'} : {answerText}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Explication :</strong> {q.explication}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setAnswers({});
                setTrimester('1');
              }}
              className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
            >
              Recommencer
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vocabulaire */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📖 Vocabulaire</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trimesterData.vocabulaire.map((notion, i) => (
                  <div
                    key={i}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-bold text-purple-900">{notion.fr}</p>
                    <p className="text-sm text-gray-600">{notion.en}</p>
                    <p className="text-xs text-gray-500 mt-2">📌 {notion.theme}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions */}
            {currentQuestion && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      Question {Object.keys(answers).length + 1}/{trimesterData.questions.length}
                    </h2>
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(Object.keys(answers).length / trimesterData.questions.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Consigne :</strong> {currentQuestion.consigne}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">{currentQuestion.enonce}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {[currentQuestion.bonne, ...currentQuestion.fausses]
                      .sort(() => Math.random() - 0.5)
                      .map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAnswers({ ...answers, [Object.keys(answers).length]: idx });
                          }}
                          className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition"
                        >
                          {option}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Aide :</strong> {currentQuestion.explication}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
