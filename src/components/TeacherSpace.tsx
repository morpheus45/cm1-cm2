import { useCallback, useEffect, useMemo, useState } from 'react';
import { pupilKey } from '../types';
import type { Level } from '../types';
import type { SessionResult } from '../lib/results';
import { isCloudConfigured } from '../lib/cloud';
import { correctionsOf } from '../lib/correction';
import type { Worksheet } from '../lib/worksheet';
import {
  createClass,
  currentTeacher,
  deletePupil,
  pupilIdFor,
  readMyClasses,
  readWorksheet,
  readWorksheetIndex,
  saveCorrection,
  signIn,
  signOut,
  signUp,
  type CloudClass,
  type TeacherAccount,
  type WorksheetStatus,
} from '../lib/teacherCloud';
import { CorrectionScreen } from './CorrectionScreen';
import { ProblemsScreen } from './ProblemsScreen';
import { NOTION_COLORS } from '../theme';
import { SchoolTitle } from './ecole/SchoolTitle';
import { Tableau } from './ecole/Tableau';
import { TeacherScreen } from './TeacherScreen';

interface TeacherSpaceProps {
  localSessions: SessionResult[];
  onBack: () => void;
  onForgetLocalPupil: (key: string) => void;
  onForgetAllLocal: () => void;
}

const input =
  'w-full rounded-xl border-2 border-encre/25 bg-white px-4 py-3 text-lg text-encre focus:border-encre focus:outline-none';
const primary = 'bouton-encre w-full py-3 text-lg';
const secondary = 'etiquette w-full py-3 text-lg';
const fiche =
  'flex flex-col gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10';

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-5">
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <SchoolTitle size="petit" subtitle="Espace maîtresse" />
        {children}
      </div>
    </div>
  );
}

/**
 * L'accès maîtresse, avec ou sans compte.
 *
 * Sans Supabase configuré, rien ne change : les dossiers sont ceux de
 * l'appareil. Avec, la maîtresse se connecte, crée sa classe, donne le code
 * à ses élèves, et voit leurs séances d'où qu'elles viennent.
 */
export function TeacherSpace({ localSessions, onBack, onForgetLocalPupil, onForgetAllLocal }: TeacherSpaceProps) {
  const cloud = isCloudConfigured();
  const [account, setAccount] = useState<TeacherAccount | null | 'loading'>(cloud ? 'loading' : null);
  const [classes, setClasses] = useState<CloudClass[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [className, setClassName] = useState('');
  const [classLevel, setClassLevel] = useState<Level>('CM1');
  const [worksheets, setWorksheets] = useState<Record<string, WorksheetStatus>>({});
  const [worksheetsError, setWorksheetsError] = useState('');
  const [showProblems, setShowProblems] = useState(false);
  const [correcting, setCorrecting] = useState<{
    session: SessionResult;
    worksheet?: Worksheet;
    error?: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    setError('');
    try {
      // Sans la liste des feuilles, les dossiers restent utiles : son échec
      // est signalé à part, sans rien bloquer.
      const [found, index] = await Promise.all([
        readMyClasses(),
        readWorksheetIndex().then(
          (value) => ({ value, error: '' }),
          (e: Error) => ({ value: null, error: e.message })
        ),
      ]);
      setClasses(found);
      if (index.value) setWorksheets(index.value);
      setWorksheetsError(index.error && `Les feuilles d'opérations n'ont pas pu être chargées : ${index.error}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!cloud) return;
    void currentTeacher().then((found) => {
      setAccount(found);
      if (found) void refresh();
    });
  }, [cloud, refresh]);

  // Une seule classe affichée pour l'instant : la première créée.
  const current = classes?.[0] ?? null;

  // Les feuilles qui attendent la maîtresse, la plus ancienne d'abord : c'est
  // l'ordre dans lequel « Corriger » les enchaîne.
  const queue = useMemo(
    () =>
      (current?.sessions ?? [])
        .filter((session) => worksheets[session.id] && !worksheets[session.id].correctedAt)
        .sort((a, b) => a.at.localeCompare(b.at)),
    [current, worksheets]
  );

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const localScreen = (
    <TeacherScreen
      sessions={localSessions}
      onBack={onBack}
      onForgetPupil={onForgetLocalPupil}
      onForgetAll={onForgetAllLocal}
    />
  );

  if (!cloud || offline) return localScreen;

  if (account === 'loading') {
    return (
      <Panel>
        <p className="py-10 text-center text-encre-douce">Chargement…</p>
      </Panel>
    );
  }

  if (!account) {
    const canSubmit = email.includes('@') && password.length >= 8 && !busy;
    return (
      <Panel>
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-encre">Connexion</h2>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="etiquette shrink-0 px-4 py-2 text-sm"
          >
            Retour
          </button>
        </header>

        <section className={fiche}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-encre-douce">Adresse e-mail</span>
            <input
              className={input}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-encre-douce">Mot de passe (8 caractères au moins)</span>
            <input
              className={input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm font-bold text-[#B91C3B]">{error}</p>}
          {notice && <p className="text-sm font-bold text-[#1B7A43]">{notice}</p>}
          <button
            type="button"
            disabled={!canSubmit}
            className={primary}
            onClick={() =>
              run(async () => {
                const signed = await signIn(email, password);
                setAccount(signed);
                await refresh();
              })
            }
          >
            Se connecter
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            className={secondary}
            onClick={() =>
              run(async () => {
                const created = await signUp(email, password);
                if (created) {
                  setAccount(created);
                  await refresh();
                } else {
                  setNotice(
                    'Compte créé. Ouvrez le lien de confirmation reçu par e-mail, puis connectez-vous.'
                  );
                }
              })
            }
          >
            Créer mon compte
          </button>
        </section>

        <button
          type="button"
          onClick={() => setOffline(true)}
          className="text-sm font-bold text-encre-douce underline decoration-2 underline-offset-4"
        >
          Continuer sans compte, avec les séances de cet appareil
        </button>
      </Panel>
    );
  }

  const openCorrection = (session: SessionResult) => {
    setCorrecting({ session });
    // Une feuille arrivée après qu'on en a ouvert une autre ne doit pas la
    // remplacer.
    const settle = (next: { worksheet?: Worksheet; error?: string }) =>
      setCorrecting((shown) => (shown?.session.id === session.id ? { session, ...next } : shown));
    readWorksheet(session).then(
      (worksheet) => settle({ worksheet }),
      (e: Error) => settle({ error: e.message })
    );
  };

  if (classes !== null && current === null) {
    return (
      <Panel>
        <header>
          <h2 className="text-2xl font-bold text-encre">Créer ma classe</h2>
          <p className="text-sm text-encre-douce">{account.email}</p>
        </header>
        <section className={fiche}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-encre-douce">Nom de la classe</span>
            <input
              className={input}
              value={className}
              placeholder="CM1 de Mme Durand"
              onChange={(e) => setClassName(e.target.value)}
            />
          </label>
          <div className="flex gap-3">
            {(['CM1', 'CM2'] as Level[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setClassLevel(lvl)}
                aria-pressed={classLevel === lvl}
                className={`etiquette flex-1 py-3 text-lg ${classLevel === lvl ? '!bg-encre !text-white' : ''}`}
              >
                {lvl}
              </button>
            ))}
          </div>
          {error && <p className="text-sm font-bold text-[#B91C3B]">{error}</p>}
          <button
            type="button"
            disabled={className.trim().length === 0 || busy}
            className={primary}
            onClick={() =>
              run(async () => {
                await createClass(className.trim(), classLevel);
                await refresh();
              })
            }
          >
            Créer la classe
          </button>
        </section>
        <button
          type="button"
          onClick={() => run(async () => { await signOut(); setAccount(null); setClasses(null); })}
          className="text-sm font-bold text-encre-douce underline decoration-2 underline-offset-4"
        >
          Se déconnecter
        </button>
      </Panel>
    );
  }

  const banner = current && (
    <section className={fiche}>
      <p className="text-base font-bold text-encre">
        {current.name} <span className="font-normal text-encre-douce">· {current.level}</span>
      </p>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-bold text-encre-douce">Code à écrire au tableau pour les élèves :</p>
        <Tableau code={current.joinCode} />
      </div>
      {error && <p className="text-sm font-bold text-[#B91C3B]">{error}</p>}
      {worksheetsError && <p className="text-sm font-bold text-[#B91C3B]">{worksheetsError}</p>}
      {queue.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3" style={{ borderColor: NOTION_COLORS.accords.deep, background: NOTION_COLORS.accords.tint }}>
          <p className="text-sm font-bold" style={{ color: NOTION_COLORS.accords.deep }}>
            {queue.length} feuille{queue.length > 1 ? 's' : ''} d'opérations à corriger
          </p>
          <button type="button" onClick={() => openCorrection(queue[0])} className="bouton-encre shrink-0 px-4 py-2 text-sm">
            Corriger
          </button>
        </div>
      )}
      <button type="button" onClick={() => setShowProblems(true)} className={secondary}>
        Problèmes de la classe, avec Claude
      </button>
      <div className="flex gap-2 pt-1">
        <button type="button" disabled={busy} onClick={() => run(refresh)} className={secondary}>
          Actualiser
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(async () => { await signOut(); setAccount(null); setClasses(null); })}
          className={secondary}
        >
          Se déconnecter
        </button>
      </div>
    </section>
  );

  const idFor = (key: string): string | null => {
    const session = current?.sessions.find((entry) => pupilKey(entry.pupil) === key);
    return current && session ? pupilIdFor(current, session.pupil.firstName, session.pupil.lastName) : null;
  };

  const problemsScreen =
    showProblems && current ? (
      <ProblemsScreen
        classId={current.id}
        className={current.name}
        level={current.level}
        onClose={() => setShowProblems(false)}
      />
    ) : null;

  const correction = correcting && (
    correcting.worksheet ? (
      <CorrectionScreen
        key={correcting.session.id}
        worksheet={correcting.worksheet}
        correctedAt={worksheets[correcting.session.id]?.correctedAt ?? null}
        remaining={queue.filter((session) => session.id !== correcting.session.id).length}
        onSave={async (draft) => {
          const correctedAt = await saveCorrection(correcting.session.id, correctionsOf(draft));
          setWorksheets((index) => ({ ...index, [correcting.session.id]: { correctedAt } }));
        }}
        onNext={() => {
          const next = queue.find((session) => session.id !== correcting.session.id);
          if (next) openCorrection(next);
        }}
        onClose={() => setCorrecting(null)}
      />
    ) : (
      <Panel>
        <p className={`py-10 text-center ${correcting.error ? 'font-bold text-[#B91C3B]' : 'text-encre-douce'}`}>
          {correcting.error ?? 'Ouverture de la feuille…'}
        </p>
        <button type="button" onClick={() => setCorrecting(null)} className={secondary}>
          Retour
        </button>
      </Panel>
    )
  );

  return (
    <>
      {correction ?? problemsScreen}
      <div hidden={correction !== null || problemsScreen !== null}>
        <TeacherScreen
          sessions={current?.sessions ?? []}
          banner={banner}
          dataScope="class"
          worksheets={worksheets}
          onCorrect={openCorrection}
          onBack={onBack}
          onForgetPupil={(key) =>
            void run(async () => {
              const id = idFor(key);
              if (id) await deletePupil(id);
              await refresh();
            })
          }
          onForgetAll={() =>
            void run(async () => {
              const ids = new Set(
                (current?.sessions ?? []).map((entry) => idFor(pupilKey(entry.pupil))).filter(Boolean) as string[]
              );
              for (const id of ids) await deletePupil(id);
              await refresh();
            })
          }
        />
      </div>
    </>
  );
}
