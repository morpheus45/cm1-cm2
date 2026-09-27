import { useState } from 'react';
import type { Question, Subject } from '../types';
import { ofSubject, SUBJECT_LABELS } from '../types';
import { NOTION_COLORS } from '../theme';
import {
  choiceAnswer,
  constructionAnswer,
  itemDomain,
  operationAnswer,
  type EvaluationAnswer,
  type ReadyEvaluation,
} from '../lib/evaluation';
import type { CopyOutcome } from '../lib/pupilEvaluations';
import { typographieFrancaise } from '../lib/typographie';
import { ConstructionBoard } from './figures/ConstructionBoard';
import { FigureView } from './figures/FigureView';
import { Intercalaire } from './ecole/Intercalaire';
import { Tampon } from './ecole/Tampon';
import { ProgressBar } from './ProgressBar';
import { renderPrompt } from './QuestionScreen';
import { useScreenTitle } from './useScreenTitle';
import { WrittenOperationScreen } from './WrittenOperationScreen';

interface EvaluationScreenProps {
  evaluation: ReadyEvaluation;
  pupilName: string;
  /** Les réponses déjà données, quand l'élève reprend l'évaluation. */
  initialAnswers: EvaluationAnswer[];
  /** Après chaque réponse : l'avancement est gardé sur la tablette. */
  onProgress: (answers: EvaluationAnswer[]) => void;
  onFinish: (answers: EvaluationAnswer[]) => void;
  onQuit: () => void;
}

const carte =
  'cahier flex flex-col gap-4 rounded-3xl py-5 pl-12 pr-5 shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]';

/**
 * Une évaluation, comme un contrôle sur papier : l'élève répond à chaque
 * question et passe à la suivante, sans voir si c'est juste. Pas de
 * correction, pas d'étoiles, pas de note à la fin : c'est la maîtresse qui
 * regarde les copies. L'élève qui quitte reprend plus tard là où il en était.
 */
export function EvaluationScreen({
  evaluation,
  pupilName,
  initialAnswers,
  onProgress,
  onFinish,
  onQuit,
}: EvaluationScreenProps) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [started, setStarted] = useState(false);
  const total = evaluation.items.length;
  const index = Math.min(answers.length, total - 1);
  const stepColors = evaluation.items.map((item) => NOTION_COLORS[itemDomain(item)].band);

  const answer = (next: EvaluationAnswer) => {
    const list = [...answers, next];
    if (list.length >= total) {
      onFinish(list);
      return;
    }
    setAnswers(list);
    onProgress(list);
  };

  if (!started) {
    return (
      <Intro
        evaluation={evaluation}
        pupilName={pupilName}
        answered={answers.length}
        onStart={() => setStarted(true)}
        onQuit={onQuit}
      />
    );
  }

  const item = evaluation.items[index];
  if (item.kind === 'operation') {
    return (
      <WrittenOperationScreen
        key={item.operation.id}
        operation={item.operation}
        operationNumber={index + 1}
        totalOperations={total}
        evaluation={{ stepColors }}
        onValidate={(given, strokes) => answer(operationAnswer(given, strokes))}
        onQuit={onQuit}
      />
    );
  }
  return (
    <EvaluationQuestion
      key={item.question.id}
      question={item.question}
      subject={evaluation.subject}
      number={index + 1}
      total={total}
      stepColors={stepColors}
      onAnswer={answer}
      onQuit={onQuit}
    />
  );
}

function Intro({
  evaluation,
  pupilName,
  answered,
  onStart,
  onQuit,
}: {
  evaluation: ReadyEvaluation;
  pupilName: string;
  answered: number;
  onStart: () => void;
  onQuit: () => void;
}) {
  const titleRef = useScreenTitle();
  const total = evaluation.items.length;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-8">
      <section className={`${carte} items-start`}>
        <p className="-ml-9 text-sm font-bold uppercase tracking-[0.18em] text-encre-douce">
          Évaluation {ofSubject(evaluation.subject)}
        </p>
        <h1 ref={titleRef} tabIndex={-1} className="text-2xl font-bold text-encre focus:outline-none">
          {evaluation.title}
        </h1>
        {pupilName && <p className="font-cursive text-2xl leading-[2] text-encre">{pupilName}</p>}
        <ul className="flex flex-col gap-2 text-xl text-encre">
          <li>Il y a {total} questions.</li>
          <li>Lis bien chaque question.</li>
          <li>Tu ne verras pas si ta réponse est juste.</li>
          <li>Ta maîtresse corrigera ta copie.</li>
        </ul>
        {answered > 0 && (
          <p className="text-lg font-bold text-encre-douce">
            Tu as déjà répondu à {answered} question{answered > 1 ? 's' : ''}. Tu reprends à la question {answered + 1}.
          </p>
        )}
      </section>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onStart} className="bouton-encre w-full py-4 text-xl">
          {answered > 0 ? 'Je reprends' : 'Je commence'}
        </button>
        <button type="button" onClick={onQuit} className="etiquette w-full py-3 text-lg">
          Revenir à l'accueil
        </button>
      </div>
    </div>
  );
}

/** Une question de l'évaluation : on choisit, on peut changer d'avis, puis on
 *  valide. Rien n'indique si c'est juste. */
function EvaluationQuestion({
  question,
  subject,
  number,
  total,
  stepColors,
  onAnswer,
  onQuit,
}: {
  question: Question;
  subject: Subject;
  number: number;
  total: number;
  stepColors: string[];
  onAnswer: (answer: EvaluationAnswer) => void;
  onQuit: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const titleRef = useScreenTitle(question.id);
  const colors = NOTION_COLORS[question.domain];
  const construction = question.construction;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-4 py-5">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onQuit} className="etiquette shrink-0 px-3 py-1.5 text-sm">
          Quitter
        </button>
        <div className="flex-1">
          <ProgressBar current={number} total={total} colors={stepColors} />
        </div>
      </div>

      <h1 ref={titleRef} tabIndex={-1} className="sr-only">
        Évaluation {ofSubject(subject)}, question {number} sur {total}
      </h1>

      <section className={carte}>
        <div className="-ml-9 flex flex-wrap items-center gap-2">
          <Intercalaire domain={question.domain} prefix={SUBJECT_LABELS[subject]} />
        </div>
        {question.instruction && (
          <p className="text-lg font-bold text-encre-douce">{typographieFrancaise(question.instruction)}</p>
        )}
        <p className="break-words text-[1.6rem] leading-relaxed text-encre">
          {renderPrompt(typographieFrancaise(question.prompt), colors.tint)}
        </p>
        {question.figure && construction && (
          <ConstructionBoard
            figure={question.figure}
            construction={construction}
            accent={colors.band}
            validated={false}
            validateLabel="Valider ma réponse"
            onValidate={(_, placed) => onAnswer(constructionAnswer(construction, placed))}
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
        <>
          <div className="flex flex-col gap-3" role="group" aria-label="Réponses">
            {question.choices.map((choice, index) => (
              <button
                key={choice + index}
                type="button"
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
                className={`etiquette px-4 py-3.5 text-left text-xl ${selected === index ? '!bg-encre !text-white' : ''}`}
              >
                <span className="min-w-0 break-words">{typographieFrancaise(choice)}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={selected === null}
            onClick={() => selected !== null && onAnswer(choiceAnswer(selected))}
            className="bouton-encre w-full py-4 text-xl"
          >
            Valider ma réponse
          </button>
        </>
      )}
    </div>
  );
}

const COPY_NOTES: Record<CopyOutcome | 'pending', { text: string; tone: string }> = {
  pending: { text: 'Envoi de ta copie…', tone: 'text-encre-douce' },
  sent: { text: '✓ Copie rendue à ta maîtresse', tone: 'text-[#1B7A43]' },
  queued: { text: 'Pas de connexion : ta copie partira toute seule plus tard.', tone: 'text-encre-douce' },
  already: {
    text: 'Tu avais déjà rendu cette évaluation. Ta maîtresse garde ta première copie.',
    tone: 'text-encre-douce',
  },
  rejected: { text: "Ta copie n'est pas arrivée. Préviens ta maîtresse.", tone: 'text-[#B84A06]' },
};

/** La fin de l'évaluation : ni note ni correction, la copie part à la
 *  maîtresse. */
export function EvaluationDoneScreen({
  title,
  pupilName,
  outcome,
  onFinish,
}: {
  title: string;
  pupilName: string;
  outcome: CopyOutcome | 'pending';
  onFinish: () => void;
}) {
  const titleRef = useScreenTitle();
  const note = COPY_NOTES[outcome];
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-8">
      <section className="cahier flex flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
        <h1 ref={titleRef} tabIndex={-1} className="text-base font-bold uppercase tracking-[0.18em] text-encre-douce focus:outline-none">
          {title}
        </h1>
        <Tampon tilt={-7} className="text-2xl sm:text-3xl">
          C'est fini{'\u00a0'}!
        </Tampon>
        {pupilName && <p className="font-cursive text-2xl leading-[2] text-encre">{pupilName}</p>}
        <p className="text-xl text-encre">Ta maîtresse va regarder tes réponses.</p>
        <p role="status" className={`text-base font-bold ${note.tone}`}>
          {note.text}
        </p>
      </section>
      <button type="button" onClick={onFinish} className="bouton-encre w-full py-4 text-xl">
        Revenir à l'accueil
      </button>
    </div>
  );
}
