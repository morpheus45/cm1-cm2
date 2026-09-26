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
import { TeacherScreen } from './TeacherScreen';

interface TeacherSpaceProps {
  localSessions: SessionResult[];
  onBack: () => void;
  onForgetLocalPupil: (key: string) => void;
  onForgetAllLocal: () => void;
}

const input = 'rounded-xl border-2 border-slate-200 px-4 py-3 text-lg w-full';
const primary = 'w-full rounded-xl bg-violet-500 text-white text-lg font-bold py-3 disabled:bg-slate-300';
const secondary =
  'w-full rounded-xl border-2 border-violet-200 bg-white text-violet-700 text-lg font-semibold py-3 disabled:opacity-50';

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-lg mx-auto flex flex-col gap-4">{children}</div>
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
        <p className="text-center text-slate-500 py-10">Chargement…</p>
      </Panel>
    );
  }

  if (!account) {
    const canSubmit = email.includes('@') && password.length >= 8 && !busy;
    return (
      <Panel>
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Accès maîtresse</p>
            <h1 className="text-2xl font-bold text-slate-800">Connexion</h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
          >
            Retour
          </button>
        </header>

        <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">Adresse e-mail</span>
            <input
              className={input}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">Mot de passe (8 caractères au moins)</span>
            <input
              className={input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
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
          className="text-sm text-slate-500 underline underline-offset-4"
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
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Accès maîtresse</p>
          <h1 className="text-2xl font-bold text-slate-800">Créer ma classe</h1>
          <p className="text-sm text-slate-500">{account.email}</p>
        </header>
        <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">Nom de la classe</span>
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
                className={`flex-1 rounded-xl py-3 text-lg font-semibold border-2 ${
                  classLevel === lvl ? 'bg-sky-400 text-white border-sky-400' : 'bg-white border-sky-200 text-slate-600'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
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
          className="text-sm text-slate-500 underline underline-offset-4"
        >
          Se déconnecter
        </button>
      </Panel>
    );
  }

  const banner = current && (
    <section className="bg-violet-50 rounded-2xl p-4 ring-1 ring-violet-200 flex flex-col gap-2">
      <p className="text-sm text-violet-700">
        {current.name} · {current.level}
      </p>
      <p className="text-sm text-slate-600">Code à donner aux élèves :</p>
      <p className="text-4xl font-bold tracking-[0.35em] text-violet-800" aria-label={`Code de classe ${current.joinCode.split('').join(' ')}`}>
        {current.joinCode}
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {worksheetsError && <p className="text-sm text-red-700">{worksheetsError}</p>}
      {queue.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-amber-200">
          <p className="text-sm font-medium text-amber-900">
            {queue.length} feuille{queue.length > 1 ? 's' : ''} d'opérations à corriger
          </p>
          <button
            type="button"
            onClick={() => openCorrection(queue[0])}
            className="shrink-0 rounded-xl bg-violet-500 px-4 py-2 text-sm font-bold text-white"
          >
            Corriger
          </button>
        </div>
      )}
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
        <p className={`text-center py-10 ${correcting.error ? 'text-red-700' : 'text-slate-500'}`}>
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
      {correction}
      <div hidden={correction !== null}>
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
