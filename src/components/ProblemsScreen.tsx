import { useEffect, useRef, useState } from 'react';
import type { Level } from '../types';
import { TRIMESTER_LABELS } from '../types';
import { NOTION_COLORS } from '../theme';
import { askAssistant, modificationRequest, withReply, type ChatTurn } from '../lib/assistant';
import { checkProposal, type ProblemProposal } from '../lib/classProblems';
import {
  addClassProblem,
  deleteClassProblem,
  readClassProblems,
  setClassProblemActive,
  type ClassProblemEntry,
} from '../lib/teacherCloud';
import { typographieFrancaise } from '../lib/typographie';
import { Gommette } from './ecole/Gommette';
import { RainbowArc } from './ecole/RainbowArc';

interface ProblemsScreenProps {
  classId: string;
  className: string;
  level: Level;
  onClose: () => void;
}

interface Bulle {
  id: number;
  de: 'maitresse' | 'claude';
  texte: string;
  propositions?: ProblemProposal[];
  horsChamp?: boolean;
  erreur?: boolean;
}

const SUGGESTIONS = [
  'Propose 3 problèmes de partage pour le 2e trimestre.',
  'Des problèmes de monnaie avec des nombres décimaux.',
  'Un problème en deux étapes sur une sortie scolaire.',
];

const VIOLET = NOTION_COLORS.problemes;
const JUSTE = NOTION_COLORS.numeration;
const A_REVOIR = NOTION_COLORS.accords;

const fiche =
  'flex flex-col gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10';

function Proposition({
  proposal,
  added,
  onAdd,
}: {
  proposal: ProblemProposal;
  added: boolean;
  onAdd: () => Promise<void>;
}) {
  const check = checkProposal(proposal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const colors = check.ok ? JUSTE : A_REVOIR;
  const unit = proposal.unite ? ` ${proposal.unite}` : '';
  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 bg-white p-3" style={{ borderColor: colors.deep }}>
      <p className="text-base text-encre">{typographieFrancaise(proposal.enonce)}</p>
      <p className="text-sm text-encre-douce">
        Calcul : <strong className="text-encre">{proposal.calcul}</strong> = <strong className="text-encre">{proposal.reponse}{unit}</strong>
        {' · '}
        {[1, 2, 3].includes(proposal.trimestre) ? TRIMESTER_LABELS[proposal.trimestre as 1 | 2 | 3] : 'trimestre ?'}
      </p>
      {check.distractors.length > 0 && (
        <p className="text-sm text-encre-douce">Fausses réponses : {check.distractors.join(' · ')}</p>
      )}
      <p className="flex items-center gap-2 text-sm font-bold" style={{ color: colors.deep }}>
        <Gommette color={colors.deep} mark={check.ok ? 'coche' : null} size={20} />
        {check.ok ? 'Calcul vérifié par l’application' : check.issues.join(' ')}
      </p>
      {check.notes.map((note) => (
        <p key={note} className="text-xs text-encre-douce">
          {note}
        </p>
      ))}
      {error && <p className="text-sm font-bold text-[#B91C3B]">{error}</p>}
      <button
        type="button"
        disabled={!check.ok || added || busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await onAdd();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
        className="etiquette self-start px-4 py-2 text-sm"
      >
        {added ? 'Ajouté à la classe ✓' : busy ? 'Ajout…' : check.ok ? 'Ajouter à la classe' : 'Impossible à ajouter'}
      </button>
    </div>
  );
}

/**
 * Les problèmes que la maîtresse prépare pour sa classe, avec Claude.
 *
 * Claude ne fait que proposer : l'application refait chaque calcul, et
 * seule la maîtresse ajoute un problème à la classe. Une demande hors du
 * cadre (autre chose que corriger ou adapter l'application) n'est pas traitée :
 * elle est transmise à l'administrateur, et la réponse le dit.
 */
export function ProblemsScreen({ classId, className, level, onClose }: ProblemsScreenProps) {
  const [bulles, setBulles] = useState<Bulle[]>([]);
  const turns = useRef<ChatTurn[]>([]);
  const nextId = useRef(1);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [problems, setProblems] = useState<ClassProblemEntry[] | null>(null);
  const [listError, setListError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement | null>(null);
  const logEnd = useRef<HTMLDivElement | null>(null);

  const reload = async () => {
    try {
      setProblems(await readClassProblems(classId));
      setListError('');
    } catch (e) {
      setListError((e as Error).message);
    }
  };

  useEffect(() => {
    void reload();
    // La classe ne change pas pendant que l'écran est ouvert.
  }, [classId]);

  useEffect(() => {
    logEnd.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [bulles, sending]);

  const push = (bulle: Omit<Bulle, 'id'>) => setBulles((current) => [...current, { ...bulle, id: nextId.current++ }]);

  const send = async (text: string) => {
    const asked = text.trim();
    if (!asked || sending) return;
    push({ de: 'maitresse', texte: asked });
    setQuestion('');
    setSending(true);
    try {
      const reply = await askAssistant(level, [...turns.current, { role: 'user', content: asked }]);
      turns.current = withReply(turns.current, asked, reply);
      push({ de: 'claude', texte: reply.message, propositions: reply.problemes, horsChamp: reply.horsChamp });
    } catch (e) {
      push({ de: 'claude', texte: (e as Error).message, erreur: true });
    } finally {
      setSending(false);
    }
  };

  const active = (problems ?? []).filter((problem) => problem.actif).length;

  return (
    <div className="min-h-screen px-4 py-5">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-encre-douce">
              <RainbowArc className="w-8" /> Problèmes de la classe
            </p>
            <h1 className="truncate text-2xl font-bold text-encre">{className}</h1>
            <p className="text-sm text-encre-douce">
              {active} problème{active > 1 ? 's' : ''} en service · mêlés aux problèmes de l'application
            </p>
          </div>
          <button type="button" onClick={onClose} className="etiquette shrink-0 px-4 py-2 text-sm">
            Fermer
          </button>
        </header>

        <section className={fiche} aria-labelledby="chat-titre">
          <h2 id="chat-titre" className="text-lg font-bold text-encre">
            Préparer avec Claude
          </h2>
          <p className="text-sm text-encre-douce">
            Claude vous aide à créer, corriger ou adapter les problèmes de votre classe. L'application refait chaque
            calcul, et rien n'arrive aux élèves sans votre accord. Toute autre demande est transmise à
            l'administrateur de l'application.
          </p>

          <div className="flex flex-col gap-3" aria-live="polite">
            {bulles.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="rounded-full border-2 px-3 py-1.5 text-left text-sm font-bold"
                    style={{ borderColor: VIOLET.deep, color: VIOLET.deep, background: VIOLET.tint }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {bulles.map((bulle) =>
              bulle.de === 'maitresse' ? (
                <p key={bulle.id} className="max-w-[85%] self-end whitespace-pre-line rounded-2xl rounded-br-md bg-encre px-4 py-2 text-base text-white">
                  {bulle.texte}
                </p>
              ) : (
                <div key={bulle.id} className="flex max-w-[95%] flex-col gap-2 self-start">
                  <p
                    className="whitespace-pre-line rounded-2xl rounded-bl-md border-2 px-4 py-2 text-base"
                    style={
                      bulle.erreur
                        ? { borderColor: '#B91C3B', color: '#B91C3B', background: '#FDE8EC' }
                        : bulle.horsChamp
                          ? { borderColor: A_REVOIR.deep, color: A_REVOIR.deep, background: A_REVOIR.tint }
                          : { borderColor: VIOLET.deep, color: '#1E2A4A', background: VIOLET.tint }
                    }
                  >
                    <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider" style={{ color: VIOLET.deep }}>
                      Claude
                    </span>
                    {bulle.texte}
                  </p>
                  {bulle.propositions?.map((proposal, index) => {
                    const key = `${bulle.id}-${index}`;
                    return (
                      <Proposition
                        key={key}
                        proposal={proposal}
                        added={added.has(key)}
                        onAdd={async () => {
                          await addClassProblem(classId, proposal);
                          setAdded((current) => new Set(current).add(key));
                          await reload();
                        }}
                      />
                    );
                  })}
                </div>
              )
            )}
            {sending && (
              <p className="self-start rounded-2xl border-2 border-dashed px-4 py-2 text-sm font-bold text-encre-douce" style={{ borderColor: VIOLET.deep }}>
                Claude réfléchit…
              </p>
            )}
            <div ref={logEnd} />
          </div>

          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(question);
            }}
          >
            <label htmlFor="question" className="text-sm font-bold text-encre-douce">
              Votre demande
            </label>
            <textarea
              id="question"
              ref={input}
              rows={3}
              maxLength={4000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Par exemple : trois problèmes de proportionnalité, avec des prix."
              className="rounded-xl border-2 border-encre/25 bg-white px-4 py-3 text-base text-encre focus:border-encre focus:outline-none"
            />
            <button type="submit" disabled={sending || question.trim() === ''} className="bouton-encre self-end px-6 py-3 text-base">
              {sending ? 'Envoi…' : 'Envoyer à Claude'}
            </button>
          </form>
        </section>

        <section className={fiche} aria-labelledby="liste-titre">
          <h2 id="liste-titre" className="text-lg font-bold text-encre">
            Les problèmes de la classe
          </h2>
          {listError && <p className="text-sm font-bold text-[#B91C3B]">{listError}</p>}
          {problems !== null && problems.length === 0 && (
            <p className="text-sm text-encre-douce">
              Aucun pour l'instant. Ceux que vous ajoutez depuis le chat apparaîtront ici, et arriveront sur les
              tablettes des élèves à leur prochaine connexion.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {(problems ?? []).map((problem) => (
              <li
                key={problem.id}
                className={`flex flex-col gap-2 rounded-xl border-2 border-encre/15 bg-white p-3 ${problem.actif ? '' : 'opacity-60'}`}
              >
                <p className="text-base text-encre">{typographieFrancaise(problem.enonce)}</p>
                <p className="text-sm text-encre-douce">
                  Réponse : <strong className="text-encre">{problem.reponse}{problem.unite ? ` ${problem.unite}` : ''}</strong> ·{' '}
                  {TRIMESTER_LABELS[problem.trimestre]} · {problem.actif ? 'en service' : 'retiré'}
                </p>
                {confirmDelete === problem.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#B91C3B]">Supprimer ce problème pour de bon ?</span>
                    <button type="button" onClick={() => setConfirmDelete(null)} className="etiquette px-3 py-1.5 text-sm">
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setConfirmDelete(null);
                        try {
                          await deleteClassProblem(problem.id);
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
                          await setClassProblemActive(problem.id, !problem.actif);
                        } catch (e) {
                          setListError((e as Error).message);
                        }
                        await reload();
                      }}
                      className="etiquette px-3 py-1.5 text-sm"
                    >
                      {problem.actif ? 'Retirer de la classe' : 'Remettre en service'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuestion(modificationRequest(problem));
                        input.current?.focus();
                        input.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
                      }}
                      className="etiquette px-3 py-1.5 text-sm"
                    >
                      Modifier avec Claude
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(problem.id)}
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
