import { useEffect, useRef, useState } from 'react';
import type { Domain, Question, Subject } from '../types';
import { ofSubject, SUBJECT_LABELS } from '../types';
import { NOTION_COLORS } from '../theme';
import { ProgressBar } from './ProgressBar';
import { Gommette } from './ecole/Gommette';
import { Intercalaire } from './ecole/Intercalaire';
import { Tampon } from './ecole/Tampon';
import { typographieFrancaise } from '../lib/typographie';
import { FigureView } from './figures/FigureView';
import { ConstructionBoard } from './figures/ConstructionBoard';
import { useScreenTitle } from './useScreenTitle';

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
  // Une construction : juste ou non, une fois que l'élève a validé.
  const [built, setBuilt] = useState<boolean | null>(null);
  const construction = question.construction;
  // Rotation fixe (aucun hasard hors de seededRandom.ts) : les mots changent
  // au fil de la séance sans avoir besoin d'une graine.
  const encouragement = ENCOURAGEMENTS[(questionNumber - 1) % ENCOURAGEMENTS.length];
  const colors = NOTION_COLORS[question.domain];

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
  };

  const answered = construction ? built !== null : selected !== null;
  const isCorrect = construction ? built === true : answered && selected === question.correctIndex;

  // Chaque question repart du haut de la page, annoncée par son titre :
  // « Séance de français, question 3 sur 12 ».
  const titleRef = useScreenTitle(questionNumber);
  const continueRef = useRef<HTMLButtonElement>(null);
  // Le dernier geste de l'élève : une touche du clavier, ou le doigt.
  const byKeyboard = useRef(false);

  // La réponse donnée, les boutons se désactivent et le focus se perdrait en
  // haut de la page : il passe sur « Continuer ». Au doigt, la page ne bouge
  // pas ; au clavier, elle descend jusqu'au bouton.
  useEffect(() => {
    if (answered) continueRef.current?.focus({ preventScroll: !byKeyboard.current });
  }, [answered]);

  // Ce qu'entend un élève qui suit la séance avec un lecteur d'écran.
  const verdict = !answered
    ? ''
    : isCorrect
      ? `${encouragement} C'est la bonne réponse.`
      : construction
        ? "Ce n'est pas encore ça : la correction est tracée en vert."
        : `Ce n'est pas encore ça. La bonne réponse est : ${typographieFrancaise(question.choices[question.correctIndex])}.`;

  const handleContinue = () => {
    if (!answered) return;
    onAnswer(isCorrect);
    setSelected(null);
    setBuilt(null);
  };

  return (
    <div
      className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-4 py-5"
      onKeyDown={() => (byKeyboard.current = true)}
      onPointerDown={() => (byKeyboard.current = false)}
    >
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

      <h1 ref={titleRef} tabIndex={-1} className="sr-only">
        Séance {ofSubject(subject)}, question {questionNumber} sur {totalQuestions}
      </h1>

      <section className="cahier flex flex-col gap-4 rounded-3xl py-5 pl-12 pr-5 shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
        <div className="-ml-9 flex flex-wrap items-center gap-2">
          <Intercalaire domain={question.domain} prefix={SUBJECT_LABELS[subject]} />
        </div>
        {question.instruction && (
          <p className="text-lg font-bold text-encre-douce">{typographieFrancaise(question.instruction)}</p>
        )}
        <p className="break-words text-[1.6rem] leading-relaxed text-encre">{renderPrompt(typographieFrancaise(question.prompt), colors.tint)}</p>
        {question.figure && construction && (
          <ConstructionBoard
            key={question.id}
            figure={question.figure}
            construction={construction}
            accent={colors.band}
            validated={built !== null}
            onValidate={setBuilt}
          />
        )}
        {question.figure && !construction && (
          <FigureView
            figure={question.figure}
            accent={colors.band}
            className="w-full max-w-md self-center rounded-2xl bg-white p-2 shadow-[inset_0_0_0_1px_rgba(30,42,74,0.12)]"
          />
        )}
      </section>

      {!construction && (
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
                <span className="min-w-0 break-words">{typographieFrancaise(choice)}</span>
                {showCorrect && <Gommette color={JUSTE.deep} mark="coche" size={28} label="Bonne réponse" />}
              </button>
            );
          })}
        </div>
      )}

      <p className="sr-only" role="status">
        {verdict}
      </p>

      {answered && (
        <div className="flex flex-col items-center gap-4">
          {isCorrect ? (
            <Tampon color={JUSTE.deep} tilt={-4} className="text-lg">
              {encouragement}
            </Tampon>
          ) : (
            <p className="text-center text-lg font-bold text-encre-douce">
              {construction ? 'La correction est tracée en vert.' : 'La bonne réponse est marquée d\'une gommette verte.'}
            </p>
          )}
          {question.explanation && (
            <p
              className="w-full rounded-2xl border-l-4 px-4 py-3 text-base text-encre"
              style={{ background: colors.tint, borderColor: colors.band }}
            >
              {typographieFrancaise(question.explanation)}
            </p>
          )}
          <button ref={continueRef} type="button" onClick={handleContinue} className="bouton-encre w-full py-4 text-xl">
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
