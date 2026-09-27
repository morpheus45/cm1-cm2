import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_SUBJECTS,
  DOMAIN_LABELS,
  SUBJECT_DOMAINS,
  SUBJECT_LABELS,
  TRIMESTER_LABELS,
  type Domain,
  type Level,
  type Subject,
} from '../../types';
import {
  calendarFor,
  lastClassDay,
  PERIOD_NUMBERS,
  periodAt,
  periodsOf,
  shortFrenchDay,
  trimesterOfPeriod,
  type PeriodNumber,
  type Zone,
} from '../../lib/calendrier';
import type { ClassProblem } from '../../lib/classProblems';
import {
  ADVISED_PER_DOMAIN,
  candidateOperations,
  candidateQuestions,
  evaluationTitle,
  freezeItems,
  itemSignature,
  MAX_ITEMS,
  type EvaluationItem,
} from '../../lib/evaluation';
import { schoolYearOf } from '../../lib/results';
import { createEvaluation, readClassProblems, setEvaluationStatus } from '../../lib/teacherCloud';
import { NOTION_COLORS } from '../../theme';
import { Gommette } from '../ecole/Gommette';
import { Intercalaire } from '../ecole/Intercalaire';
import { ItemPreview } from './ItemPreview';

interface EvaluationBuilderProps {
  classId: string;
  className: string;
  level: Level;
  zone: Zone;
  /** Une autre évaluation est ouverte : celle-ci ne peut pas l'être aussitôt. */
  anotherOpen: boolean;
  onCancel: () => void;
  onSaved: (id: string) => void;
}

const fiche =
  'flex flex-col gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10';
const input =
  'w-full rounded-xl border-2 border-encre/25 bg-white px-4 py-3 text-lg text-encre focus:border-encre focus:outline-none';

/** Les opérations posées ont leur propre liste, à côté des notions. */
type Pool = Domain | 'operations';

/** Au-delà, « Autres questions » n'insiste pas : la notion n'en a plus de
 *  nouvelles à ce trimestre. */
const ATTEMPTS = 4;

/**
 * Préparer une évaluation : une matière, une période du calendrier, puis
 * les questions, choisies une à une parmi celles de l'application. Toute la
 * classe recevra exactement celles-là.
 */
export function EvaluationBuilder({
  classId,
  className,
  level,
  zone,
  anotherOpen,
  onCancel,
  onSaved,
}: EvaluationBuilderProps) {
  const today = new Date();
  const calendar = calendarFor(schoolYearOf(today.toISOString()));
  const periods = calendar ? periodsOf(calendar, zone) : [];
  const [subject, setSubject] = useState<Subject>('francais');
  const [period, setPeriod] = useState<PeriodNumber>(periodAt(today, zone)?.number ?? 1);
  const trimester = trimesterOfPeriod(period);
  const [title, setTitle] = useState(evaluationTitle('francais', periodAt(today, zone)?.number ?? 1));
  const [titleEdited, setTitleEdited] = useState(false);
  const [candidates, setCandidates] = useState<Partial<Record<Pool, EvaluationItem[]>>>({});
  const [exhausted, setExhausted] = useState<Partial<Record<Pool, boolean>>>({});
  const [chosen, setChosen] = useState<EvaluationItem[]>([]);
  const [classProblems, setClassProblems] = useState<ClassProblem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const seed = useRef(Date.now());

  // Les problèmes de la maîtresse se proposent avec ceux de l'application.
  useEffect(() => {
    readClassProblems(classId).then(
      (problems) => setClassProblems(problems.filter((problem) => problem.actif)),
      () => setClassProblems([])
    );
  }, [classId]);

  const pools: Pool[] = subject === 'maths' ? [...SUBJECT_DOMAINS.maths, 'operations'] : SUBJECT_DOMAINS[subject];

  const draw = (pool: Pool, count: number): EvaluationItem[] => {
    seed.current += 7919;
    return pool === 'operations'
      ? candidateOperations(level, trimester, seed.current, count).map((operation) => ({ kind: 'operation', operation }))
      : candidateQuestions(pool, level, trimester, seed.current, count, classProblems).map((question) => ({
          kind: 'question',
          question,
        }));
  };

  /** De nouvelles questions pour une notion, jamais deux fois la même. */
  const more = (pool: Pool) => {
    const shown = candidates[pool] ?? [];
    const seen = new Set(shown.map(itemSignature));
    const added: EvaluationItem[] = [];
    for (let attempt = 0; attempt < ATTEMPTS && added.length < ADVISED_PER_DOMAIN; attempt++) {
      draw(pool, ADVISED_PER_DOMAIN).forEach((item) => {
        const signature = itemSignature(item);
        if (!seen.has(signature) && added.length < ADVISED_PER_DOMAIN) {
          seen.add(signature);
          added.push(item);
        }
      });
    }
    setCandidates((current) => ({ ...current, [pool]: [...shown, ...added] }));
    if (added.length === 0) setExhausted((current) => ({ ...current, [pool]: true }));
  };

  // Une nouvelle matière, une nouvelle période : de nouvelles propositions,
  // et le choix repart de zéro.
  useEffect(() => {
    setCandidates({});
    setExhausted({});
    setChosen([]);
    if (!titleEdited) setTitle(evaluationTitle(subject, period));
    // `titleEdited` ne doit pas relancer la préparation.
  }, [subject, period, level]);

  useEffect(() => {
    pools.forEach((pool) => {
      if (!candidates[pool]) more(pool);
    });
    // Les propositions ne se tirent qu'une fois par notion.
  }, [candidates, classProblems]);

  const chosenSignatures = useMemo(() => new Set(chosen.map(itemSignature)), [chosen]);
  const full = chosen.length >= MAX_ITEMS;

  const toggle = (item: EvaluationItem) => {
    const signature = itemSignature(item);
    setChosen((current) =>
      chosenSignatures.has(signature)
        ? current.filter((other) => itemSignature(other) !== signature)
        : current.length >= MAX_ITEMS
          ? current
          : [...current, item]
    );
  };

  const save = async (open: boolean) => {
    setBusy(true);
    setError('');
    try {
      const id = await createEvaluation(classId, {
        title: title.trim() || evaluationTitle(subject, period),
        subject,
        period,
        trimester,
        items: freezeItems(chosen),
      });
      if (open) await setEvaluationStatus(id, 'ouverte');
      onSaved(id);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const countIn = (pool: Pool) =>
    chosen.filter((item) => (pool === 'operations' ? item.kind === 'operation' : item.kind === 'question' && item.question.domain === pool)).length;

  return (
    <div className="min-h-screen px-4 pb-32 pt-5">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-encre-douce">Nouvelle évaluation</p>
            <h1 className="truncate text-2xl font-bold text-encre">{className}</h1>
            <p className="text-sm text-encre-douce">Les mêmes questions pour toute la classe · niveau {level}</p>
          </div>
          <button type="button" onClick={onCancel} className="etiquette shrink-0 px-4 py-2 text-sm">
            Annuler
          </button>
        </header>

        <section className={fiche} aria-labelledby="etape-1">
          <h2 id="etape-1" className="text-lg font-bold text-encre">
            1. La matière et la période
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Matière">
            {ALL_SUBJECTS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={candidate === subject}
                onClick={() => setSubject(candidate)}
                className={`etiquette px-3 py-2 text-base ${candidate === subject ? '!bg-encre !text-white' : ''}`}
              >
                {SUBJECT_LABELS[candidate]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5" role="group" aria-label="Période">
            {PERIOD_NUMBERS.map((number) => {
              const dates = periods.find((entry) => entry.number === number);
              return (
                <button
                  key={number}
                  type="button"
                  aria-pressed={number === period}
                  onClick={() => setPeriod(number)}
                  className={`etiquette px-2 py-2 text-left text-sm sm:text-center ${number === period ? '!bg-encre !text-white' : ''}`}
                >
                  <span className="block font-bold">Période {number}</span>
                  {dates && (
                    <span className="block text-xs font-normal">
                      {shortFrenchDay(dates.start)} – {shortFrenchDay(lastClassDay(dates))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-encre-douce">
            Les questions viennent du programme du {TRIMESTER_LABELS[trimester]}, et de ce qui le précède. Changer de
            matière ou de période remet le choix à zéro.
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-encre-douce">Titre, que les élèves verront</span>
            <input
              className={input}
              value={title}
              maxLength={80}
              onChange={(event) => {
                setTitle(event.target.value);
                setTitleEdited(true);
              }}
            />
          </label>
        </section>

        <section className={fiche} aria-labelledby="etape-2">
          <h2 id="etape-2" className="text-lg font-bold text-encre">
            2. Les questions
          </h2>
          <p className="text-sm text-encre-douce">
            Choisissez chaque question. Conseil : trois à cinq questions par notion, quinze à vingt en tout, pour une
            séance de classe. L'élève les verra dans cet ordre de notions, sans correction.
          </p>
          {pools.map((pool) => {
            const list = candidates[pool] ?? [];
            const count = countIn(pool);
            const label = pool === 'operations' ? 'Opérations posées' : DOMAIN_LABELS[pool];
            return (
              <section key={pool} className="flex flex-col gap-2 border-t border-encre/10 pt-3" aria-label={label}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {pool === 'operations' ? (
                    <Intercalaire domain="calcul" prefix="Maths" />
                  ) : (
                    <Intercalaire domain={pool} />
                  )}
                  <span className="text-sm font-bold text-encre-douce">
                    {pool === 'operations' ? 'Opérations posées · ' : ''}
                    {count} choisie{count > 1 ? 's' : ''}
                  </span>
                </div>
                {pool === 'operations' && (
                  <p className="text-sm text-encre-douce">
                    L'élève pose l'opération au doigt. Vous la corrigerez ensuite au stylet, avec les autres feuilles.
                  </p>
                )}
                <ul className="flex flex-col gap-2">
                  {list.map((item) => {
                    const signature = itemSignature(item);
                    const selected = chosenSignatures.has(signature);
                    const colors = NOTION_COLORS[item.kind === 'operation' ? 'calcul' : item.question.domain];
                    return (
                      <li
                        key={signature}
                        className="flex flex-col gap-2 rounded-xl border-2 bg-white p-3 sm:flex-row sm:items-start sm:justify-between"
                        style={{ borderColor: selected ? colors.deep : 'rgba(30,42,74,0.12)' }}
                      >
                        <ItemPreview item={item} />
                        <button
                          type="button"
                          aria-pressed={selected}
                          disabled={!selected && full}
                          onClick={() => toggle(item)}
                          className="etiquette flex shrink-0 items-center justify-center gap-2 px-3 py-2 text-sm"
                          style={selected ? { background: colors.tint, borderColor: colors.deep, color: colors.deep } : undefined}
                        >
                          <Gommette color={colors.deep} mark={selected ? 'coche' : null} empty={!selected} size={20} />
                          {selected ? 'Choisie' : 'Choisir'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  disabled={exhausted[pool]}
                  onClick={() => more(pool)}
                  className="self-start rounded-full border-2 border-dashed border-encre/40 px-4 py-2 text-sm font-bold text-encre-douce"
                >
                  {exhausted[pool] ? 'Pas d\'autre question à ce trimestre' : pool === 'operations' ? 'Autres opérations' : 'Autres questions'}
                </button>
              </section>
            );
          })}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-encre/15 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {error && <p className="text-sm font-bold text-[#B91C3B]">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm font-bold text-encre" role="status">
              {chosen.length} question{chosen.length > 1 ? 's' : ''} choisie{chosen.length > 1 ? 's' : ''}
              {full ? ` · ${MAX_ITEMS} au plus` : ''}
            </p>
            <button
              type="button"
              disabled={busy || chosen.length === 0}
              onClick={() => void save(false)}
              className="etiquette px-4 py-2 text-sm"
            >
              Enregistrer
            </button>
            <button
              type="button"
              disabled={busy || chosen.length === 0 || anotherOpen}
              onClick={() => void save(true)}
              className="bouton-encre px-4 py-2 text-sm"
            >
              Enregistrer et ouvrir aux élèves
            </button>
          </div>
          {anotherOpen && (
            <p className="text-xs text-encre-douce">Une autre évaluation est ouverte : terminez-la avant d'ouvrir celle-ci.</p>
          )}
        </div>
      </div>
    </div>
  );
}
