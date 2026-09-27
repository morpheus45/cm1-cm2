import { useCallback, useEffect, useState } from 'react';
import { SUBJECT_LABELS } from '../../types';
import { DEFAULT_ZONE, type Zone } from '../../lib/calendrier';
import { STATUS_LABELS, type EvaluationSummary, type TeacherEvaluation } from '../../lib/evaluation';
import {
  deleteEvaluation,
  readCopies,
  readEvaluation,
  readEvaluations,
  redoCopy,
  setClassZone,
  setEvaluationStatus,
  type CloudClass,
} from '../../lib/teacherDataSource';
import { formatFrenchDate } from '../../lib/worksheetPdf';
import { RainbowArc } from '../ecole/RainbowArc';
import { CalendarCard } from './CalendarCard';
import { EvaluationBuilder } from './EvaluationBuilder';
import { EvaluationResults } from './EvaluationResults';

interface EvaluationsScreenProps {
  cloudClass: CloudClass;
  /** La classe a changé (sa zone, les séances de ses élèves) : l'espace
   *  maîtresse la relit. */
  onClassChanged: () => Promise<void>;
  onClose: () => void;
}

const fiche =
  'flex flex-col gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10';

/** Pendant qu'une évaluation est ouverte, les copies arrivent : la liste, et
 *  les copies de l'évaluation affichée, se relisent à ce rythme. Ni les
 *  questions ni les autres évaluations ne se rechargent. */
const REFRESH_INTERVAL = 20_000;

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'results'; id: string };

/**
 * Les évaluations de la classe : le calendrier de l'année, celles qui sont
 * préparées, ouvertes ou terminées, et leurs résultats. Seule la maîtresse
 * les lance ; les élèves les reçoivent sur l'accueil de leur tablette.
 */
export function EvaluationsScreen({ cloudClass, onClassChanged, onClose }: EvaluationsScreenProps) {
  const [evaluations, setEvaluations] = useState<EvaluationSummary[] | null>(null);
  const [detail, setDetail] = useState<TeacherEvaluation | null>(null);
  const [view, setView] = useState<View>({ kind: 'list' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const zone: Zone = cloudClass.zone ?? DEFAULT_ZONE;
  const openedId = view.kind === 'results' ? view.id : null;

  const reload = useCallback(async () => {
    try {
      setEvaluations(await readEvaluations(cloudClass.id));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [cloudClass.id]);

  const refreshCopies = useCallback(async (id: string) => {
    const copies = await readCopies(id);
    setDetail((shown) => (shown?.id === id ? { ...shown, copies, copyCount: copies.length } : shown));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Les questions et les copies d'une évaluation ne se chargent qu'à son
  // ouverture.
  const openedSummary = (evaluations ?? []).find((evaluation) => evaluation.id === openedId) ?? null;
  useEffect(() => {
    if (!openedSummary) return;
    if (detail?.id === openedSummary.id) return;
    let cancelled = false;
    readEvaluation(openedSummary).then(
      (loaded) => {
        if (!cancelled) setDetail(loaded);
      },
      (e: Error) => {
        if (!cancelled) setError(e.message);
      }
    );
    return () => {
      cancelled = true;
    };
    // `detail` n'est lu que pour ne pas recharger ce qui l'est déjà.
  }, [openedSummary]);

  const open = (evaluations ?? []).filter((evaluation) => evaluation.status === 'ouverte');
  useEffect(() => {
    if (open.length === 0 || view.kind === 'new') return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void reload();
      if (openedId && open.some((evaluation) => evaluation.id === openedId)) void refreshCopies(openedId).catch(() => undefined);
    }, REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [open.length, view.kind, openedId, reload, refreshCopies]);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    // Des copies ont pu arriver, ou être effacées : les dossiers des élèves
    // sont relus au retour.
    void onClassChanged();
    onClose();
  };

  if (view.kind === 'new') {
    return (
      <EvaluationBuilder
        classId={cloudClass.id}
        className={cloudClass.name}
        level={cloudClass.level}
        zone={zone}
        anotherOpen={open.length > 0}
        onCancel={() => setView({ kind: 'list' })}
        onSaved={(id) => {
          void reload();
          setView({ kind: 'results', id });
        }}
      />
    );
  }

  if (view.kind === 'results') {
    // L'état de la liste (ouverte, terminée) l'emporte : c'est le plus récent.
    const shown =
      detail && openedSummary && detail.id === openedSummary.id
        ? { ...detail, ...openedSummary, copyCount: detail.copies.length }
        : null;
    if (!shown) {
      return (
        <div className="min-h-screen px-4 py-5">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <p className={`py-10 text-center ${error ? 'font-bold text-[#B91C3B]' : 'text-encre-douce'}`}>
              {error || "Ouverture de l'évaluation…"}
            </p>
            <button type="button" onClick={() => setView({ kind: 'list' })} className="etiquette w-full px-3 py-3 text-lg">
              Retour
            </button>
          </div>
        </div>
      );
    }
    return (
      <EvaluationResults
        evaluation={shown}
        classPupils={cloudClass.pupils}
        busy={busy}
        anotherOpen={open.some((evaluation) => evaluation.id !== shown.id)}
        onBack={() => {
          setDetail(null);
          setView({ kind: 'list' });
        }}
        onStatus={(status) =>
          void run(async () => {
            await setEvaluationStatus(shown.id, status);
            await reload();
          })
        }
        onRedo={async (copyId) => {
          await redoCopy(copyId);
          await Promise.all([refreshCopies(shown.id), reload()]);
        }}
      />
    );
  }

  const list = evaluations ?? [];

  return (
    <div className="min-h-screen px-4 py-5">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-encre-douce">
              <RainbowArc className="w-8" /> Évaluations de la classe
            </p>
            <h1 className="truncate text-2xl font-bold text-encre">{cloudClass.name}</h1>
            <p className="text-sm text-encre-douce">Les mêmes questions pour tous les élèves. C'est vous qui les lancez.</p>
          </div>
          <button type="button" onClick={close} className="etiquette shrink-0 px-4 py-2 text-sm">
            Fermer
          </button>
        </header>

        {error && <p className="text-sm font-bold text-[#B91C3B]">{error}</p>}

        <CalendarCard
          zone={zone}
          busy={busy}
          onZone={(next) =>
            void run(async () => {
              await setClassZone(cloudClass.id, next);
              await onClassChanged();
            })
          }
        />

        <button type="button" onClick={() => setView({ kind: 'new' })} className="bouton-encre w-full py-3 text-lg">
          Préparer une évaluation
        </button>

        <section className={fiche} aria-labelledby="liste-evaluations">
          <h2 id="liste-evaluations" className="text-lg font-bold text-encre">
            Les évaluations
          </h2>
          {evaluations === null && !error && <p className="text-sm text-encre-douce">Chargement…</p>}
          {evaluations !== null && list.length === 0 && (
            <p className="text-sm text-encre-douce">
              Aucune pour l'instant. Préparez-en une : elle n'arrivera sur les tablettes que lorsque vous l'ouvrirez.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {list.map((evaluation) => {
              const copies = evaluation.copyCount;
              const blocked = open.some((other) => other.id !== evaluation.id);
              return (
                <li
                  key={evaluation.id}
                  className={`flex flex-col gap-2 rounded-xl border-2 bg-white p-3 ${evaluation.status === 'ouverte' ? 'border-encre' : 'border-encre/15'}`}
                >
                  <div>
                    <p className="text-base font-bold text-encre">{evaluation.title}</p>
                    <p className="text-sm text-encre-douce">
                      {SUBJECT_LABELS[evaluation.subject]} · {evaluation.questionCount} questions ·{' '}
                      <strong className="text-encre">{STATUS_LABELS[evaluation.status]}</strong>
                      {evaluation.status === 'preparee' ? ` · préparée le ${formatFrenchDate(evaluation.createdAt)}` : ''}
                      {evaluation.status !== 'preparee' ? ` · ${copies} copie${copies > 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  {confirmDelete === evaluation.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#B91C3B]">
                        Supprimer cette évaluation{copies > 0 ? ` et les ${copies} copies reçues` : ''} ? C'est définitif.
                      </span>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="etiquette px-3 py-1.5 text-sm">
                        Annuler
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            setConfirmDelete(null);
                            await deleteEvaluation(evaluation.id);
                            await reload();
                          })
                        }
                        className="rounded-xl bg-[#B91C3B] px-3 py-1.5 text-sm font-bold text-white"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {evaluation.status === 'ouverte' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await setEvaluationStatus(evaluation.id, 'terminee');
                              await reload();
                            })
                          }
                          className="bouton-encre px-3 py-1.5 text-sm"
                        >
                          Terminer
                        </button>
                      )}
                      {evaluation.status === 'preparee' && (
                        <button
                          type="button"
                          disabled={busy || blocked}
                          onClick={() =>
                            void run(async () => {
                              await setEvaluationStatus(evaluation.id, 'ouverte');
                              await reload();
                            })
                          }
                          className="bouton-encre px-3 py-1.5 text-sm"
                        >
                          Ouvrir aux élèves
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setView({ kind: 'results', id: evaluation.id })}
                        className="etiquette px-3 py-1.5 text-sm"
                      >
                        {evaluation.status === 'preparee' ? 'Voir les questions' : 'Voir les résultats'}
                      </button>
                      {evaluation.status !== 'ouverte' && (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(evaluation.id)}
                          className="rounded-xl border-2 border-[#B91C3B]/40 bg-white px-3 py-1.5 text-sm font-bold text-[#B91C3B]"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  )}
                  {evaluation.status === 'preparee' && blocked && (
                    <p className="text-xs text-encre-douce">Une autre évaluation est ouverte : terminez-la avant d'ouvrir celle-ci.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
