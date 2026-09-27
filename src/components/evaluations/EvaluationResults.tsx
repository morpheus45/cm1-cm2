import { useMemo, useState } from 'react';
import { DOMAIN_LABELS, DOMAIN_SHORT_LABELS, pupilLabel, SUBJECT_LABELS, type Domain, type Pupil } from '../../types';
import {
  analyseEvaluation,
  expectedLabel,
  givenLabel,
  STATUS_LABELS,
  type EvaluationItem,
  type PupilOutcome,
  type TeacherEvaluation,
} from '../../lib/evaluation';
import type { Node } from '../../lib/construction';
import { MASTERY_COLORS, MASTERY_LABELS, MASTERY_SHORT, type Mastery } from '../../lib/results';
import { typographieFrancaise } from '../../lib/typographie';
import { formatFrenchDate } from '../../lib/worksheetPdf';
import { NOTION_COLORS } from '../../theme';
import { Intercalaire } from '../ecole/Intercalaire';
import { ItemPreview } from './ItemPreview';

interface EvaluationResultsProps {
  evaluation: TeacherEvaluation;
  /** Tous les élèves connus de la classe : ceux qui n'ont pas rendu de copie
   *  sont nommés. */
  classPupils: Pupil[];
  busy: boolean;
  /** Une autre évaluation est ouverte : celle-ci ne peut pas être rouverte. */
  anotherOpen: boolean;
  onBack: () => void;
  onStatus: (status: 'ouverte' | 'terminee') => void;
  onRedo: (copyId: string) => Promise<void>;
}

const fiche =
  'flex flex-col gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10';

const LEVELS: Mastery[] = [1, 2, 3, 4];

function MasteryChip({ mastery }: { mastery: Mastery }) {
  return (
    <span
      className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md px-1.5 text-xs font-bold text-white"
      style={{ background: MASTERY_COLORS[mastery] }}
      title={MASTERY_LABELS[mastery]}
    >
      {mastery}
      <span className="sr-only"> : {MASTERY_LABELS[mastery]}</span>
    </span>
  );
}

function Legend() {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-encre-douce">
      {LEVELS.map((level) => (
        <span key={level} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ background: MASTERY_COLORS[level] }} />
          {level} · {MASTERY_SHORT[level]}
        </span>
      ))}
    </p>
  );
}

const names = (pupils: Pupil[]) => pupils.map(pupilLabel).join(', ');

/** Les points qu'un élève a posés sur une construction, s'il y en a. */
function placedNodes(given: unknown): Node[] | undefined {
  return Array.isArray(given) &&
    given.every((node) => Array.isArray(node) && node.length === 2 && node.every((part) => Number.isInteger(part)))
    ? (given as Node[])
    : undefined;
}

/** La consigne et l'énoncé d'une question, sans leurs marques de mise en
 *  valeur. */
function itemTitle(item: EvaluationItem): { instruction: string; prompt: string } {
  if (item.kind === 'operation') return { instruction: 'Opération posée', prompt: item.operation.statement };
  return {
    instruction: typographieFrancaise(item.question.instruction ?? ''),
    prompt: typographieFrancaise(item.question.prompt.replace(/\*\*/g, '')),
  };
}

/**
 * Ce que l'évaluation dit de la classe : qui a rendu sa copie, les élèves à
 * reprendre notion par notion — les groupes de besoin —, le niveau de chacun,
 * et les questions les moins réussies.
 */
export function EvaluationResults({
  evaluation,
  classPupils,
  busy,
  anotherOpen,
  onBack,
  onStatus,
  onRedo,
}: EvaluationResultsProps) {
  const analysis = useMemo(() => analyseEvaluation(evaluation, classPupils), [evaluation, classPupils]);
  const [openedCopy, setOpenedCopy] = useState<string | null>(null);
  const opened = analysis.pupils.find((outcome) => outcome.copyId === openedCopy) ?? null;
  const domains = analysis.groups.map((group) => group.domain);
  const copies = evaluation.copies.length;

  if (opened) {
    return (
      <PupilCopy
        evaluation={evaluation}
        outcome={opened}
        busy={busy}
        onBack={() => setOpenedCopy(null)}
        onRedo={async () => {
          await onRedo(opened.copyId);
          setOpenedCopy(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-5">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-encre-douce">
              Évaluation · {SUBJECT_LABELS[evaluation.subject]}
            </p>
            <h1 className="text-2xl font-bold text-encre">{evaluation.title}</h1>
            <p className="text-sm text-encre-douce">
              {evaluation.items.length} questions · {STATUS_LABELS[evaluation.status]}
              {evaluation.openedAt ? ` · ouverte le ${formatFrenchDate(evaluation.openedAt)}` : ''}
              {evaluation.status === 'terminee' && evaluation.closedAt ? ` · terminée le ${formatFrenchDate(evaluation.closedAt)}` : ''}
            </p>
          </div>
          <button type="button" onClick={onBack} className="etiquette shrink-0 px-4 py-2 text-sm">
            Évaluations
          </button>
        </header>

        <section className={fiche} aria-labelledby="copies-titre">
          <h2 id="copies-titre" className="text-lg font-bold text-encre">
            {copies} copie{copies > 1 ? 's' : ''} reçue{copies > 1 ? 's' : ''}
            {analysis.missing.length > 0 ? ` sur ${copies + analysis.missing.length} élèves` : ''}
          </h2>
          {evaluation.status === 'ouverte' && (
            <p className="text-sm text-encre-douce">
              Les élèves la voient sur l'accueil de leur tablette. Cette page se met à jour toute seule.
            </p>
          )}
          {analysis.missing.length > 0 && (
            <p className="text-sm text-encre">
              <strong>Pas encore rendue :</strong> {names(analysis.missing)}.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {evaluation.status === 'ouverte' ? (
              <button type="button" disabled={busy} onClick={() => onStatus('terminee')} className="bouton-encre px-4 py-2 text-sm">
                Terminer l'évaluation
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || anotherOpen}
                onClick={() => onStatus('ouverte')}
                className="etiquette px-4 py-2 text-sm"
              >
                {evaluation.status === 'preparee' ? 'Ouvrir aux élèves' : 'Rouvrir aux élèves'}
              </button>
            )}
          </div>
          {anotherOpen && evaluation.status !== 'ouverte' && (
            <p className="text-xs text-encre-douce">Une autre évaluation est ouverte : terminez-la d'abord.</p>
          )}
        </section>

        {copies > 0 && (
          <>
            <section className={fiche} aria-labelledby="besoins-titre">
              <h2 id="besoins-titre" className="text-lg font-bold text-encre">
                À reprendre, notion par notion
              </h2>
              <p className="text-sm text-encre-douce">
                Les groupes de besoin : les élèves en maîtrise insuffisante, puis fragile. Sur la tablette où il a fait
                l'évaluation, la révision ciblée de chaque élève reprend d'abord ces notions.
              </p>
              <ul className="flex flex-col gap-3">
                {analysis.groups.map((group) => (
                  <li key={group.domain} className="flex flex-col gap-1.5 rounded-xl border-2 border-encre/10 bg-white p-3">
                    <Intercalaire domain={group.domain} />
                    {group.lacunes.length === 0 && group.fragilites.length === 0 ? (
                      <p className="text-sm text-encre-douce">Tous les élèves ont au moins une maîtrise satisfaisante.</p>
                    ) : (
                      <>
                        {group.lacunes.length > 0 && (
                          <p className="flex items-start gap-2 text-sm text-encre">
                            <MasteryChip mastery={1} />
                            <span>
                              <strong>{MASTERY_LABELS[1]} :</strong> {names(group.lacunes)}
                            </span>
                          </p>
                        )}
                        {group.fragilites.length > 0 && (
                          <p className="flex items-start gap-2 text-sm text-encre">
                            <MasteryChip mastery={2} />
                            <span>
                              <strong>{MASTERY_LABELS[2]} :</strong> {names(group.fragilites)}
                            </span>
                          </p>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className={fiche} aria-labelledby="eleves-titre">
              <h2 id="eleves-titre" className="text-lg font-bold text-encre">
                Par élève
              </h2>
              <p className="text-sm text-encre-douce">
                Le niveau du livret scolaire, calculé sur les questions de cette évaluation. Touchez un élève pour voir sa
                copie.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">Niveau de maîtrise de chaque élève, notion par notion</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="py-2 pr-2 text-left font-bold text-encre-douce">
                        Élève
                      </th>
                      {domains.map((domain) => (
                        <th key={domain} scope="col" className="px-1 py-2 text-center font-bold text-encre-douce">
                          {DOMAIN_SHORT_LABELS[domain]}
                        </th>
                      ))}
                      <th scope="col" className="px-1 py-2 text-right font-bold text-encre-douce">
                        Réussi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.pupils.map((outcome) => (
                      <tr key={outcome.copyId} className="border-t border-encre/10">
                        <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                          <button
                            type="button"
                            onClick={() => setOpenedCopy(outcome.copyId)}
                            className="text-left font-bold text-encre underline decoration-2 underline-offset-4"
                          >
                            {pupilLabel(outcome.pupil)}
                          </button>
                        </th>
                        {domains.map((domain) => {
                          const entry = outcome.domains.find((candidate) => candidate.domain === domain);
                          return (
                            <td key={domain} className="px-1 py-1.5 text-center">
                              {entry ? <MasteryChip mastery={entry.mastery} /> : <span className="text-encre-pale">–</span>}
                            </td>
                          );
                        })}
                        <td className="px-1 py-1.5 text-right tabular-nums text-encre">
                          {outcome.correct} / {outcome.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Legend />
            </section>

            <section className={fiche} aria-labelledby="questions-titre">
              <h2 id="questions-titre" className="text-lg font-bold text-encre">
                Question par question
              </h2>
              <ol className="flex flex-col gap-2">
                {analysis.questions.map((entry) => {
                  const ratio = entry.copies > 0 ? entry.success / entry.copies : 0;
                  const colors = NOTION_COLORS[entry.domain];
                  const { instruction, prompt } = itemTitle(entry.item);
                  return (
                    <li key={entry.index} className="flex flex-col gap-1 rounded-xl border-2 border-encre/10 bg-white p-3">
                      <p className="text-sm text-encre">
                        <strong>{entry.index + 1}.</strong>{' '}
                        {instruction && <span className="block text-xs font-bold text-encre-douce">{instruction}</span>}
                        {prompt}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-2.5 flex-1 overflow-hidden rounded-full"
                          style={{ background: colors.tint }}
                        >
                          <span className="block h-full rounded-full" style={{ width: `${Math.round(ratio * 100)}%`, background: colors.band }} />
                        </span>
                        <span className="shrink-0 text-xs font-bold text-encre-douce">
                          {entry.success} / {entry.copies} réussie{entry.success > 1 ? 's' : ''}
                          {ratio < 0.5 ? ' · à reprendre en classe' : ''}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {evaluation.items.some((item) => item.kind === 'operation') && (
                <p className="text-sm text-encre-douce">
                  Les opérations posées sont corrigées d'après le résultat écrit. Vous pouvez aussi les annoter au stylet :
                  elles attendent avec les autres feuilles à corriger.
                </p>
              )}
            </section>
          </>
        )}

        <details className={fiche}>
          <summary className="cursor-pointer text-lg font-bold text-encre">Les {evaluation.items.length} questions</summary>
          <ol className="flex flex-col gap-3">
            {evaluation.items.map((item, index) => (
              <li key={index} className="flex gap-2 border-t border-encre/10 pt-3">
                <strong className="text-encre">{index + 1}.</strong>
                <ItemPreview item={item} />
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}

/** La copie d'un élève : chaque réponse, juste ou non, et la bonne. */
function PupilCopy({
  evaluation,
  outcome,
  busy,
  onBack,
  onRedo,
}: {
  evaluation: TeacherEvaluation;
  outcome: PupilOutcome;
  busy: boolean;
  onBack: () => void;
  onRedo: () => Promise<void>;
}) {
  const copy = evaluation.copies.find((entry) => entry.id === outcome.copyId);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState('');
  const label = pupilLabel(outcome.pupil);
  const toRevise: Array<[Domain, Mastery]> = [
    ...outcome.lacunes.map((domain): [Domain, Mastery] => [domain, 1]),
    ...outcome.fragilites.map((domain): [Domain, Mastery] => [domain, 2]),
  ];

  return (
    <div className="min-h-screen px-4 py-5">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-encre-douce">{evaluation.title}</p>
            <h1 className="text-2xl font-bold text-encre">{label}</h1>
            <p className="text-sm text-encre-douce">
              Copie rendue le {formatFrenchDate(outcome.at)} · {outcome.correct} / {outcome.total} réussies
            </p>
          </div>
          <button type="button" onClick={onBack} className="etiquette shrink-0 px-4 py-2 text-sm">
            Résultats
          </button>
        </header>

        <section className={fiche} aria-labelledby="a-revoir-titre">
          <h2 id="a-revoir-titre" className="text-lg font-bold text-encre">
            À revoir
          </h2>
          {toRevise.length === 0 ? (
            <p className="text-sm text-encre-douce">Aucune notion en dessous d'une maîtrise satisfaisante.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {toRevise.map(([domain, mastery]) => (
                <li key={domain} className="flex items-center gap-2 text-sm text-encre">
                  <MasteryChip mastery={mastery} />
                  {DOMAIN_LABELS[domain]}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={fiche} aria-labelledby="reponses-titre">
          <h2 id="reponses-titre" className="text-lg font-bold text-encre">
            Ses réponses
          </h2>
          <ol className="flex flex-col gap-3">
            {evaluation.items.map((item, index) => {
              const answer = copy?.answers[index];
              const right = answer?.correct === true;
              return (
                <li key={index} className="flex flex-col gap-2 border-t border-encre/10 pt-3">
                  <p className="text-sm font-bold text-encre">
                    Question {index + 1}
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs"
                      style={
                        right
                          ? { background: NOTION_COLORS.numeration.tint, color: NOTION_COLORS.numeration.deep }
                          : { background: NOTION_COLORS.accords.tint, color: NOTION_COLORS.accords.deep }
                      }
                    >
                      {right ? '✓ Juste' : '✗ À revoir'}
                    </span>
                  </p>
                  <ItemPreview item={item} placed={placedNodes(answer?.given)} />
                  <p className="text-sm text-encre">
                    Sa réponse : <strong>{typographieFrancaise(givenLabel(item, answer?.given))}</strong>
                    {item.kind === 'question' && item.question.construction ? (
                      <span className="text-encre-douce"> · en vert s'ils sont justes, en orange sinon</span>
                    ) : (
                      !right && (
                        <span className="text-encre-douce"> · attendu : {typographieFrancaise(expectedLabel(item))}</span>
                      )
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={fiche} aria-labelledby="refaire-titre">
          <h2 id="refaire-titre" className="text-lg font-bold text-encre">
            Faire refaire l'évaluation
          </h2>
          <p className="text-sm text-encre-douce">
            Pour un élève dérangé ou absent en cours de route. Sa copie est effacée ; tant que l'évaluation est ouverte,
            il la retrouve sur l'accueil de sa tablette.
          </p>
          {error && <p className="text-sm font-bold text-[#B91C3B]">{error}</p>}
          {armed ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-[#B91C3B]">La copie de {label} sera effacée. C'est définitif.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setArmed(false)} className="etiquette flex-1 py-3 text-sm">
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setArmed(false);
                    onRedo().catch((e: Error) => setError(e.message));
                  }}
                  className="flex-1 rounded-xl bg-[#B91C3B] py-3 text-sm font-bold text-white"
                >
                  Effacer la copie
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setArmed(true)}
              className="w-full rounded-xl border-2 border-[#B91C3B]/40 bg-white py-3 text-sm font-bold text-[#B91C3B]"
            >
              Faire refaire l'évaluation à {label}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
