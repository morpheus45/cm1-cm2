import { useState } from 'react';
import type { Domain, Question, Subject } from '../types';
import { SUBJECT_LABELS } from '../types';
import { NOTION_COLORS } from '../theme';
import { ProgressBar } from './ProgressBar';
import { Gommette } from './ecole/Gommette';
import { Intercalaire } from './ecole/Intercalaire';
import { Tampon } from './ecole/Tampon';

interface QuestionScreenProps {
  question: Question;
  subject: Subject;
  questionNumber: number;
  totalQuestions: number;
  /** La notion de chaque question de la séance, pour colorer les gommettes. */
  stepDomains?: Domain[];
  onAnswer: (correct: boolean) => void;
  onQuit: () => void;
}

const ENCOURAGEMENTS = ['Bravo\u00a0!', 'Super\u00a0!', 'Bien joué\u00a0!', 'Génial\u00a0!', 'Continue comme ça\u00a0!'];

const JUSTE = NOTION_COLORS.numeration;
const A_REVOIR = NOTION_COLORS.accords;

function renderPrompt(prompt: string, highlight: string) {
  const parts = prompt.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong
        key={index}
        className="rounded-sm px-0.5"
        style={{ background: `linear-gradient(transparent 55%, ${highlight} 55%)` }}
      >
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export function QuestionScreen({
  question,
  subject,
  questionNumber,
  totalQuestions,
  stepDomains = [],
  onAnswer,
  onQuit,
}: QuestionScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);
  // Rotation fixe (aucun hasard hors de seededRandom.ts) : les mots changent
  // au fil de la séance sans avoir besoin d'une graine.
  const encouragement = ENCOURAGEMENTS[(questionNumber - 1) % ENCOURAGEMENTS.length];
  const colors = NOTION_COLORS[question.domain];

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
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-4 py-5">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onQuit} className="etiquette shrink-0 px-3 py-1.5 text-sm">
          Quitter
        </button>
        <div className="flex-1">
          <ProgressBar
            current={questionNumber}
            total={totalQuestions}
            colors={stepDomains.map((domain) => NOTION_COLORS[domain].band)}
          />
        </div>
      </div>

      <section className="cahier flex flex-col gap-4 rounded-3xl py-5 pl-12 pr-5 shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
        <div className="-ml-9 flex flex-wrap items-center gap-2">
          <Intercalaire domain={question.domain} prefix={SUBJECT_LABELS[subject]} />
        </div>
        {question.instruction && (
          <p className="text-lg font-bold text-encre-douce">{question.instruction}</p>
        )}
        <p className="text-[1.6rem] leading-relaxed text-encre">{renderPrompt(question.prompt, colors.tint)}</p>
      </section>

      <div className="flex flex-col gap-3" role="group" aria-label="Réponses">
        {question.choices.map((choice, index) => {
          const isSelected = selected === index;
          const showCorrect = answered && index === question.correctIndex;
          const showWrongSelected = answered && isSelected && !isCorrect;
          const state = showCorrect ? JUSTE : showWrongSelected ? A_REVOIR : null;
          return (
            <button
              key={choice + index}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(index)}
              className={`etiquette flex items-center justify-between gap-3 px-4 py-3.5 text-left text-xl ${
                answered && !state ? '!opacity-50' : '!opacity-100'
              }`}
              style={state ? { background: state.tint, borderColor: state.deep, color: state.deep, boxShadow: `0 3px 0 ${state.deep}` } : undefined}
            >
              <span>{choice}</span>
              {showCorrect && <Gommette color={JUSTE.deep} mark="coche" size={28} label="Bonne réponse" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="flex flex-col items-center gap-4">
          {isCorrect ? (
            <Tampon color={JUSTE.deep} tilt={-4} className="text-lg">
              {encouragement}
            </Tampon>
          ) : (
            <p className="text-center text-lg font-bold text-encre-douce">
              La bonne réponse est marquée d'une gommette verte.
            </p>
          )}
          <button type="button" onClick={handleContinue} className="bouton-encre w-full py-4 text-xl">
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
