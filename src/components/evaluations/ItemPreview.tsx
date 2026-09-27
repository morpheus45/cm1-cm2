import { cellCenter, isPlacedRight, nodePoint, type Node } from '../../lib/construction';
import type { EvaluationItem } from '../../lib/evaluation';
import type { Shape } from '../../lib/figures';
import { typographieFrancaise } from '../../lib/typographie';
import { NOTION_COLORS } from '../../theme';
import { FigureView, renderShape } from '../figures/FigureView';
import { renderPrompt } from '../QuestionScreen';

const JUSTE = NOTION_COLORS.numeration.deep;
const A_REVOIR = NOTION_COLORS.accords.deep;

/**
 * Une question de l'évaluation, telle que la maîtresse la relit : l'énoncé,
 * le dessin, les réponses proposées et la bonne, marquée. Une construction
 * montre la figure attendue, tracée en couleur ; dans la copie d'un élève,
 * les points qu'il a posés s'y ajoutent, verts s'ils sont justes, orange
 * sinon.
 */
export function ItemPreview({ item, placed }: { item: EvaluationItem; placed?: Node[] }) {
  if (item.kind === 'operation') {
    return (
      <p className="text-base text-encre">
        Opération posée : <strong>{item.operation.statement}</strong>
        <span className="text-encre-douce"> = {item.operation.expected}</span>
      </p>
    );
  }
  const { question } = item;
  const colors = NOTION_COLORS[question.domain];
  const construction = question.construction;
  const figure =
    question.figure && construction
      ? { ...question.figure, shapes: [...question.figure.shapes, ...construction.solution] }
      : question.figure;
  const marks =
    construction && placed
      ? placed.map((node) => ({
          at: construction.target === 'case' ? cellCenter(construction.grid, node) : nodePoint(construction.grid, node),
          right: isPlacedRight(construction, node),
        }))
      : [];
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {question.instruction && (
        <p className="text-sm font-bold text-encre-douce">{typographieFrancaise(question.instruction)}</p>
      )}
      <p className="break-words text-base text-encre">{renderPrompt(typographieFrancaise(question.prompt), colors.tint)}</p>
      {figure && marks.length === 0 && (
        <FigureView
          figure={figure}
          accent={colors.band}
          className="w-full max-w-[18rem] rounded-xl bg-white p-1 ring-1 ring-encre/10"
        />
      )}
      {figure && marks.length > 0 && (
        <svg
          viewBox={`0 0 ${figure.width} ${figure.height}`}
          className="w-full max-w-[18rem] rounded-xl bg-white p-1 ring-1 ring-encre/10"
          role="img"
          aria-label={`${figure.alt} La figure attendue est en couleur. Points posés par l'élève : ${marks.filter((mark) => mark.right).length} juste${marks.filter((mark) => mark.right).length > 1 ? 's' : ''} sur ${marks.length}.`}
        >
          <FigureShapes shapes={figure.shapes} accent={colors.band} />
          {marks.map((mark, index) => (
            <circle
              key={index}
              cx={mark.at[0]}
              cy={mark.at[1]}
              r={6.5}
              fill={mark.right ? JUSTE : A_REVOIR}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          ))}
        </svg>
      )}
      {question.choices.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Réponses proposées">
          {question.choices.map((choice, index) => {
            const right = index === question.correctIndex;
            return (
              <li
                key={choice + index}
                className={`rounded-lg border px-2 py-1 text-sm ${right ? 'border-[#1B7A43] bg-[#E2F4E8] font-bold text-[#1B7A43]' : 'border-encre/15 bg-white text-encre'}`}
              >
                {right && <span aria-hidden="true">✓ </span>}
                {typographieFrancaise(choice)}
                {right && <span className="sr-only"> (bonne réponse)</span>}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-encre-douce">
          Construction au doigt : {question.construction?.count ?? 1} point
          {(question.construction?.count ?? 1) > 1 ? 's' : ''} à poser. La figure attendue est en couleur.
        </p>
      )}
    </div>
  );
}

function FigureShapes({ shapes, accent }: { shapes: Shape[]; accent: string }) {
  return <>{shapes.map((shape, key) => renderShape(shape, key, accent))}</>;
}
