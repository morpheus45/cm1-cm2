import { useState } from 'react';
import type { Question } from '../types';
import { ProgressBar } from './ProgressBar';

interface QuestionScreenProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (correct: boolean) => void;
  onQuit: () => void;
}

const ENCOURAGEMENTS = ['Bravo !', 'Super !', 'Bien joué !', 'Génial !', 'Continue comme ça !'];

function renderPrompt(prompt: string) {
  const parts = prompt.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="underline decoration-emerald-400 decoration-4">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export function QuestionScreen({ question, questionNumber, totalQuestions, onAnswer, onQuit }: QuestionScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);
  // Deterministic rotation (no Math.random outside seededRandom.ts): varies
  // across the session without needing a seed for pure UI flavor text.
  const encouragement = ENCOURAGEMENTS[(questionNumber - 1) % ENCOURAGEMENTS.length];

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
  };

  const handleContinue = () => {
    if (selected === null) return;
    onAnswer(selected === question.correctIndex);
    setSelected(null);
  };

  const answered = selected !== null;
  const isCorrect = answered && selected === question.correctIndex;

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-sky-50 px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onQuit}
          className="shrink-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-500"
        >
          Quitter
        </button>
        <div className="flex-1">
          <ProgressBar current={questionNumber} total={totalQuestions} />
        </div>
      </div>

      <p className="text-2xl text-center text-slate-700 leading-relaxed">{renderPrompt(question.prompt)}</p>

      <div className="flex flex-col gap-3">
        {question.choices.map((choice, index) => {
          const isSelected = selected === index;
          const showCorrect = answered && index === question.correctIndex;
          const showWrongSelected = answered && isSelected && !isCorrect;
          return (
            <button
              key={choice + index}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(index)}
              className={`rounded-xl border-2 px-4 py-4 text-xl text-left transition-colors ${
                showCorrect
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                  : showWrongSelected
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : isSelected
                      ? 'bg-sky-100 border-sky-400'
                      : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xl font-semibold text-slate-600">
            {isCorrect ? encouragement : 'La bonne réponse est surlignée.'}
          </p>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl bg-orange-400 text-white text-xl font-bold py-4"
          >
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
