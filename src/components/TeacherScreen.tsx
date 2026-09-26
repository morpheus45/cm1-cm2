import { useMemo, useState } from 'react';
import { ALL_DOMAINS, pupilLabel, TRIMESTER_LABELS } from '../types';
import {
  progressByDomain,
  pupilFolders,
  schoolYearLabel,
  schoolYearOf,
  sessionsInSchoolYear,
  summariseByDomain,
  yearOutlook,
  type Mastery,
  type SessionResult,
} from '../lib/results';
import type { WorksheetStatus } from '../lib/teacherCloud';
import { formatFrenchDate } from '../lib/worksheetPdf';
import { MasteryScale } from './charts/MasteryScale';
import { RadarProfile } from './charts/RadarProfile';
import { ProgressLines } from './charts/ProgressLines';
import { ClassBands, type ClassBand } from './charts/ClassBands';
import { YearOutlookCard } from './charts/YearOutlookCard';
import { PupilList } from './PupilList';

interface TeacherScreenProps {
  sessions: SessionResult[];
  /** Affiché sous l'en-tête : la classe et son code, quand la maîtresse est
   *  connectée. */
  banner?: React.ReactNode;
  /**
   * D'où viennent les séances. Cela change tout pour un effacement : sur
   * l'appareil, il ne touche que la tablette ; dans la classe, il supprime
   * les élèves de la base, pour tout le monde. Les libellés le disent.
   */
  dataScope?: 'device' | 'class';
  onBack: () => void;
  onForgetPupil: (key: string) => void;
  onForgetAll: () => void;
  /** Les feuilles d'opérations posées reçues, séance par séance — dans la
   *  classe seulement : sur l'appareil, elles ne sont pas conservées. */
  worksheets?: Record<string, WorksheetStatus>;
  onCorrect?: (session: SessionResult) => void;
}

const NO_WORKSHEETS: Record<string, WorksheetStatus> = {};

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {hint && <p className="text-sm text-slate-500 mt-0.5">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Un effacement ne se fait jamais d'un seul geste : le bouton demande
 *  confirmation, et ce qui va disparaître est nommé. */
function DangerButton({ label, confirm, onConfirm }: { label: string; confirm: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="w-full rounded-xl border-2 border-red-200 bg-white py-3 text-sm font-semibold text-red-700"
      >
        {label}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-red-700">{confirm}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => {
            setArmed(false);
            onConfirm();
          }}
          className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white"
        >
          Effacer
        </button>
      </div>
    </div>
  );
}

export function TeacherScreen({
  sessions,
  banner,
  dataScope = 'device',
  onBack,
  onForgetPupil,
  onForgetAll,
  worksheets = NO_WORKSHEETS,
  onCorrect,
}: TeacherScreenProps) {
  const inClass = dataScope === 'class';
  const folders = useMemo(() => pupilFolders(sessions), [sessions]);
  const toCorrect = useMemo(
    () =>
      Object.fromEntries(
        folders.map((entry) => [
          entry.key,
          entry.sessions.filter((session) => worksheets[session.id] && !worksheets[session.id].correctedAt).length,
        ])
      ),
    [folders, worksheets]
  );
  const [openKey, setOpenKey] = useState<string | null>(
    folders.length === 1 ? folders[0].key : null
  );
  const folder = folders.find((entry) => entry.key === openKey) ?? null;

  const years = useMemo(
    () => [...new Set((folder?.sessions ?? []).map((s) => schoolYearOf(s.at)))].sort((a, b) => b - a),
    [folder]
  );
  const [year, setYear] = useState<number | null>(null);
  const shownYear = year !== null && years.includes(year) ? year : (years[0] ?? null);

  const yearSessions = useMemo(
    () => (folder && shownYear !== null ? sessionsInSchoolYear(folder.sessions, shownYear) : []),
    [folder, shownYear]
  );
  const summaries = useMemo(() => summariseByDomain(yearSessions), [yearSessions]);
  // Les feuilles de l'année affichée, la plus récente d'abord.
  const sheets = useMemo(
    () => yearSessions.filter((session) => worksheets[session.id]).sort((a, b) => b.at.localeCompare(a.at)),
    [yearSessions, worksheets]
  );
  const outlook = useMemo(() => yearOutlook(summaries), [summaries]);

  const series = useMemo(
    () =>
      [...summaries]
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
        .map((summary) => ({
          domain: summary.domain,
          points: progressByDomain(yearSessions, summary.domain),
        })),
    [summaries, yearSessions]
  );

  // La répartition de la classe se calcule à partir des autres dossiers
  // présents : tant qu'un seul élève travaille sur l'appareil, la vue reste
  // vide plutôt que d'inventer une classe.
  const bands: ClassBand[] = useMemo(() => {
    if (!folder || folders.length < 2) return [];
    const others = folders.map((entry) => summariseByDomain(entry.sessions));
    return ALL_DOMAINS.flatMap((domain) => {
      const levels = others
        .map((list) => list.find((summary) => summary.domain === domain)?.mastery)
        .filter((mastery): mastery is Mastery => mastery !== null && mastery !== undefined);
      if (levels.length === 0) return [];
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<Mastery, number>;
      levels.forEach((level) => {
        distribution[level] += 100 / levels.length;
      });
      return [
        {
          domain,
          distribution,
          pupilMastery: summaries.find((summary) => summary.domain === domain)?.mastery ?? null,
          pupilName: folder.pupil.firstName || 'Élève',
        },
      ];
    });
  }, [folder, folders, summaries]);

  const header = (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
          Accès maîtresse
        </p>
        <h1 className="text-2xl font-bold text-slate-800 truncate">
          {folder ? pupilLabel(folder.pupil) : 'Mes élèves'}
        </h1>
        <p className="text-sm text-slate-500">
          {folder
            ? `${yearSessions.length} séance${yearSessions.length > 1 ? 's' : ''}${
                shownYear !== null ? ` · année ${schoolYearLabel(shownYear)}` : ''
              }`
            : `${folders.length} élève${folders.length > 1 ? 's' : ''}`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (folder && folders.length > 1) setOpenKey(null);
          else onBack();
        }}
        className="shrink-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
      >
        {folder && folders.length > 1 ? 'Élèves' : 'Retour'}
      </button>
    </header>
  );

  if (folders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {header}
          {banner}
          <div className="bg-white rounded-2xl p-6 text-center text-slate-500 shadow-sm ring-1 ring-slate-900/5">
            Aucune séance enregistrée. Les dossiers apparaîtront dès la première
            séance terminée.
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {header}
          {banner}
          <PupilList folders={folders} onOpen={setOpenKey} toCorrect={toCorrect} />
          <Card
            title={inClass ? 'Données de la classe' : 'Données'}
            hint={
              inClass
                ? 'Enregistrées dans la base de la classe, et visibles depuis tous vos appareils.'
                : 'Ce qui est enregistré sur cet appareil.'
            }
          >
            <DangerButton
              label={inClass ? 'Supprimer tous les élèves de la classe' : 'Effacer les séances de tous les élèves'}
              confirm={
                inClass
                  ? `${folders.length} élève${folders.length > 1 ? 's' : ''} et leurs ${sessions.length} séance${sessions.length > 1 ? 's' : ''} seront supprimés de la classe, sur tous les appareils. C'est définitif. Le code de la classe, lui, reste valable.`
                  : `${sessions.length} séance${sessions.length > 1 ? 's' : ''} et ${folders.length} dossier${folders.length > 1 ? 's' : ''} seront supprimés de cet appareil. C'est définitif.`
              }
              onConfirm={onForgetAll}
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        {header}

        {years.length > 1 && (
          <div className="flex gap-2">
            {years.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setYear(candidate)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold border-2 ${
                  candidate === shownYear
                    ? 'bg-violet-500 text-white border-violet-500'
                    : 'bg-white border-violet-200 text-slate-600'
                }`}
              >
                {schoolYearLabel(candidate)}
              </button>
            ))}
          </div>
        )}

        {onCorrect && sheets.length > 0 && (
          <Card
            title="Opérations posées"
            hint="Les feuilles écrites à la main. Touchez-en une pour la corriger au stylet."
          >
            <ul className="flex flex-col gap-2">
              {sheets.map((session) => {
                const correctedAt = worksheets[session.id]?.correctedAt ?? null;
                const score = session.domains.find((entry) => entry.domain === 'calcul');
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => onCorrect(session)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-slate-100 px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block font-semibold text-slate-800">
                          {formatFrenchDate(session.at)}
                        </span>
                        {score && (
                          <span className="block text-xs text-slate-500">
                            {score.correct} / {score.total} juste{score.correct > 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          correctedAt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {correctedAt ? `Corrigée le ${formatFrenchDate(correctedAt)}` : 'À corriger'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <Card
          title="Attendus de fin d'année"
          hint="Ce qui est tenu, et ce qu'il reste à reprendre."
        >
          <YearOutlookCard outlook={outlook} total={ALL_DOMAINS.length} />
        </Card>

        <Card title="Niveau de maîtrise" hint="L'échelle du livret scolaire, notion par notion.">
          <MasteryScale summaries={summaries} />
        </Card>

        <Card
          title="Profil"
          hint="Les six notions d'un coup d'œil. Les anneaux sont posés sur les seuils des quatre niveaux."
        >
          <RadarProfile summaries={summaries} />
        </Card>

        <Card title="Progression" hint="Les trois notions les plus travaillées, dans le temps.">
          <ProgressLines series={series} />
        </Card>

        <Card
          title="Dans la classe"
          hint={`La répartition des élèves, notion par notion. ${folders.length} élève${
            folders.length > 1 ? 's' : ''
          } ${inClass ? 'dans la classe' : 'sur cet appareil'}.`}
        >
          <ClassBands bands={bands} pupilCount={folders.length} />
        </Card>

        <Card title="Données" hint={`Le dossier de ${pupilLabel(folder.pupil)}.`}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">
              {folder.sessions.length} séance{folder.sessions.length > 1 ? 's' : ''} enregistrée
              {folder.sessions.length > 1 ? 's' : ''} {inClass ? 'dans la base de la classe' : 'sur cet appareil'}.
            </p>
            <DangerButton
              label={
                inClass
                  ? `Retirer ${pupilLabel(folder.pupil)} de la classe`
                  : `Effacer le dossier de ${pupilLabel(folder.pupil)}`
              }
              confirm={
                inClass
                  ? `${pupilLabel(folder.pupil)} et toutes ses séances seront supprimés de la classe, sur tous les appareils. C'est définitif.`
                  : `Toutes les séances de ${pupilLabel(folder.pupil)} seront supprimées de cet appareil. C'est définitif.`
              }
              onConfirm={() => {
                onForgetPupil(folder.key);
                setOpenKey(null);
              }}
            />
          </div>
        </Card>

        <p className="text-xs text-slate-400 text-center pt-1">
          Un niveau n'est annoncé qu'à partir de huit exercices dans la notion.
        </p>
      </div>
    </div>
  );
}
