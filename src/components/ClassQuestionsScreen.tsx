import { useEffect, useState } from 'react';
import {
  DOMAIN_LABELS,
  SUBJECT_DOMAINS,
  SUBJECT_LABELS,
  TRIMESTER_LABELS,
  subjectOf,
  type Domain,
  type Level,
  type Subject,
  type Trimester,
} from '../types';
import { hasContent, subjectsFor } from '../lib/contenu';
import { checkClassQuestionDraft, isCustomisableDomain, type ClassQuestionDraft } from '../lib/classQuestions';
import {
  addClassQuestion,
  deleteClassQuestion,
  readClassQuestions,
  setClassQuestionActive,
  type ClassQuestionEntry,
} from '../lib/teacherDataSource';
import { typographieFrancaise } from '../lib/typographie';
import { RainbowArc } from './ecole/RainbowArc';

interface ClassQuestionsScreenProps {
  classId: string;
  className: string;
  /** Le niveau de la classe : seules ses matières se proposent. */
  level: Level;
  onClose: () => void;
}

const fiche =
  'flex flex-col gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10';
const input =
  'w-full rounded-xl border-2 border-encre/25 bg-white px-4 py-3 text-lg text-encre focus:border-encre focus:outline-none';
const choice = (selected: boolean) =>
  `etiquette px-3 py-2 text-sm ${selected ? '!bg-encre !text-white' : ''}`;

const EMPTY_DISTRACTORS = ['', '', ''];

function firstCustomisableDomain(subject: Subject): Domain {
  return SUBJECT_DOMAINS[subject].find(isCustomisableDomain) ?? SUBJECT_DOMAINS[subject][0];
}

/**
 * Les questions que la maîtresse ajoute elle-même à sa classe, dans
 * n'importe quelle matière — sauf les problèmes de maths, qui ont leur
 * propre écran avec l'assistant de Cédric et une vérification du calcul.
 *
 * Ici, rien n'est recalculé : l'application vérifie la forme (un énoncé
 * assez long, des réponses distinctes), jamais si la réponse est juste.
 */
export function ClassQuestionsScreen({ classId, className, level, onClose }: ClassQuestionsScreenProps) {
  const [subject, setSubject] = useState<Subject>('francais');
  const [domain, setDomain] = useState<Domain>(firstCustomisableDomain('francais'));
  const [trimestre, setTrimestre] = useState<Trimester>(1);
  const [enonce, setEnonce] = useState('');
  const [reponse, setReponse] = useState('');
  const [fausses, setFausses] = useState<string[]>(EMPTY_DISTRACTORS);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [questions, setQuestions] = useState<ClassQuestionEntry[] | null>(null);
  const [listError, setListError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const reload = async () => {
    try {
      setQuestions(await readClassQuestions(classId));
      setListError('');
    } catch (e) {
      setListError((e as Error).message);
    }
  };

  useEffect(() => {
    void reload();
    // La classe ne change pas pendant que l'écran est ouvert.
  }, [classId]);

  // Une question ajoutée dans une matière que le niveau n'a pas encore ne
  // serait jamais posée à un élève (src/lib/contenu.ts) : au CE1, au CE2 et en
  // 6e, ni l'histoire ni la géographie. Le 3e trimestre compte tout ce qui est
  // ouvert dans l'année.
  const subjects = subjectsFor(level, 3);

  const chooseSubject = (next: Subject) => {
    setSubject(next);
    setDomain(firstCustomisableDomain(next));
  };

  const draft: ClassQuestionDraft = {
    domain,
    enonce,
    reponse,
    fausses_reponses: fausses,
    trimestre,
  };
  const check = checkClassQuestionDraft(draft);
  const active = (questions ?? []).filter((question) => question.actif).length;

  const submit = async () => {
    setBusy(true);
    setFormError('');
    try {
      await addClassQuestion(classId, draft);
      setEnonce('');
      setReponse('');
      setFausses(EMPTY_DISTRACTORS);
      await reload();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-5">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-encre-douce">
              <RainbowArc className="w-8" /> Questions de la classe
            </p>
            <h1 className="truncate text-2xl font-bold text-encre">{className}</h1>
            <p className="text-sm text-encre-douce">
              {active} question{active > 1 ? 's' : ''} en service · mêlées aux questions de l'application, dans
              toutes les matières
            </p>
          </div>
          <button type="button" onClick={onClose} className="etiquette shrink-0 px-4 py-2 text-sm">
            Fermer
          </button>
        </header>

        <section className={fiche} aria-labelledby="ajout-titre">
          <h2 id="ajout-titre" className="text-lg font-bold text-encre">
            Ajouter une question
          </h2>
          <p className="text-sm text-encre-douce">
            Écrivez vous-même l'énoncé, la bonne réponse et une à trois mauvaises réponses. Contrairement aux
            problèmes de maths, l'application ne peut pas vérifier si votre réponse est juste : assurez-vous-en
            avant d'ajouter la question.
          </p>

          <div className="flex flex-wrap gap-2">
            {subjects.map((entry) => (
              <button key={entry} type="button" onClick={() => chooseSubject(entry)} aria-pressed={subject === entry} className={choice(subject === entry)}>
                {SUBJECT_LABELS[entry]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_DOMAINS[subject]
              .filter((entry) => isCustomisableDomain(entry) && hasContent(entry, level, 3))
              .map((entry) => (
                <button key={entry} type="button" onClick={() => setDomain(entry)} aria-pressed={domain === entry} className={choice(domain === entry)}>
                  {DOMAIN_LABELS[entry]}
                </button>
              ))}
          </div>
          {!SUBJECT_DOMAINS[subject].some(isCustomisableDomain) && (
            <p className="text-sm font-bold text-encre-douce">
              Les problèmes de maths ont leur propre écran, avec l'assistant de Cédric.
            </p>
          )}

          <div className="flex gap-2">
            {([1, 2, 3] as Trimester[]).map((entry) => (
              <button key={entry} type="button" onClick={() => setTrimestre(entry)} aria-pressed={trimestre === entry} className={`${choice(trimestre === entry)} flex-1`}>
                {TRIMESTER_LABELS[entry]}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-encre-douce">Énoncé</span>
            <textarea
              rows={3}
              maxLength={600}
              value={enonce}
              onChange={(e) => setEnonce(e.target.value)}
              placeholder="Par exemple : Conjugue « chanter » à la première personne du singulier, au présent."
              className={input}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-encre-douce">Bonne réponse</span>
            <input value={reponse} onChange={(e) => setReponse(e.target.value)} className={input} />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-encre-douce">Mauvaises réponses (au moins une)</span>
            {fausses.map((value, index) => (
              <input
                key={index}
                value={value}
                onChange={(e) =>
                  setFausses((current) => current.map((entry, i) => (i === index ? e.target.value : entry)))
                }
                className={input}
                placeholder={`Mauvaise réponse ${index + 1}`}
              />
            ))}
          </div>

          {formError && <p className="text-sm font-bold text-[#B91C3B]">{formError}</p>}
          {!check.ok && (enonce || reponse || fausses.some(Boolean)) && (
            <ul className="text-sm text-encre-douce">
              {check.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
          <button type="button" disabled={!check.ok || busy} onClick={() => void submit()} className="bouton-encre self-end px-6 py-3 text-base">
            {busy ? 'Ajout…' : 'Ajouter à la classe'}
          </button>
        </section>

        <section className={fiche} aria-labelledby="liste-titre">
          <h2 id="liste-titre" className="text-lg font-bold text-encre">
            Les questions de la classe
          </h2>
          {listError && <p className="text-sm font-bold text-[#B91C3B]">{listError}</p>}
          {questions !== null && questions.length === 0 && (
            <p className="text-sm text-encre-douce">
              Aucune pour l'instant. Celles que vous ajoutez apparaîtront ici, et arriveront sur les tablettes des
              élèves à leur prochaine connexion.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {(questions ?? []).map((entry) => (
              <li
                key={entry.id}
                className={`flex flex-col gap-2 rounded-xl border-2 border-encre/15 bg-white p-3 ${entry.actif ? '' : 'opacity-60'}`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-encre-douce">
                  {SUBJECT_LABELS[subjectOf(entry.domain)]} · {DOMAIN_LABELS[entry.domain]}
                </p>
                <p className="text-base text-encre">{typographieFrancaise(entry.enonce)}</p>
                <p className="text-sm text-encre-douce">
                  Réponse : <strong className="text-encre">{entry.reponse}</strong> · {TRIMESTER_LABELS[entry.trimestre]} ·{' '}
                  {entry.actif ? 'en service' : 'retirée'}
                </p>
                {confirmDelete === entry.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#B91C3B]">Supprimer cette question pour de bon ?</span>
                    <button type="button" onClick={() => setConfirmDelete(null)} className="etiquette px-3 py-1.5 text-sm">
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setConfirmDelete(null);
                        try {
                          await deleteClassQuestion(entry.id);
                        } catch (e) {
                          setListError((e as Error).message);
                        }
                        await reload();
                      }}
                      className="rounded-xl bg-[#B91C3B] px-3 py-1.5 text-sm font-bold text-white"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await setClassQuestionActive(entry.id, !entry.actif);
                        } catch (e) {
                          setListError((e as Error).message);
                        }
                        await reload();
                      }}
                      className="etiquette px-3 py-1.5 text-sm"
                    >
                      {entry.actif ? 'Retirer de la classe' : 'Remettre en service'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(entry.id)}
                      className="rounded-xl border-2 border-[#B91C3B]/40 bg-white px-3 py-1.5 text-sm font-bold text-[#B91C3B]"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
