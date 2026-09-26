import { useMemo } from 'react';
import { ALL_DOMAINS, TRIMESTER_LABELS } from '../types';
import type { Level, Trimester } from '../types';
import { progressByDomain, summariseByDomain, type SessionResult } from '../lib/results';
import { MasteryScale } from './charts/MasteryScale';
import { RadarProfile } from './charts/RadarProfile';
import { ProgressLines } from './charts/ProgressLines';
import { ClassBands, type ClassBand } from './charts/ClassBands';

interface TeacherScreenProps {
  pupilName: string;
  level: Level;
  trimester: Trimester;
  sessions: SessionResult[];
  classBands?: ClassBand[];
  onBack: () => void;
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {hint && <p className="text-sm text-slate-500 mb-4 mt-0.5">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

export function TeacherScreen({
  pupilName,
  level,
  trimester,
  sessions,
  classBands = [],
  onBack,
}: TeacherScreenProps) {
  const summaries = useMemo(() => summariseByDomain(sessions), [sessions]);
  // Les trois notions les plus travaillées : au-delà, les courbes se croisent
  // trop pour rester lisibles.
  const series = useMemo(
    () =>
      [...summaries]
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
        .map((summary) => ({ domain: summary.domain, points: progressByDomain(sessions, summary.domain) })),
    [sessions, summaries]
  );

  const worked = summaries.filter((summary) => summary.total > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Espace maîtresse
            </p>
            <h1 className="text-2xl font-bold text-slate-800">{pupilName || 'Élève'}</h1>
            <p className="text-sm text-slate-500">
              {level} · {TRIMESTER_LABELS[trimester]} · {sessions.length}{' '}
              {sessions.length > 1 ? 'séances' : 'séance'}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
          >
            Retour
          </button>
        </header>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-slate-500 shadow-sm ring-1 ring-slate-900/5">
            Aucune séance enregistrée pour l'instant. Les graphiques apparaîtront
            dès la première séance terminée.
          </div>
        ) : (
          <>
            <Card
              title="Niveau de maîtrise"
              hint="L'échelle du livret scolaire, notion par notion."
            >
              <MasteryScale summaries={summaries} />
            </Card>

            <Card
              title="Profil"
              hint={`Les six notions d'un coup d'œil. Les anneaux sont posés sur les seuils des quatre niveaux.`}
            >
              <RadarProfile summaries={summaries} />
            </Card>

            <Card
              title="Progression"
              hint={
                worked > 3
                  ? 'Les trois notions les plus travaillées, séance après séance.'
                  : 'Séance après séance.'
              }
            >
              <ProgressLines series={series} />
            </Card>

            <Card title="Dans la classe" hint="La répartition des élèves, notion par notion.">
              <ClassBands bands={classBands} />
            </Card>
          </>
        )}

        <p className="text-xs text-slate-400 text-center pt-1">
          Un niveau n'est annoncé qu'à partir de huit exercices dans la notion.
          {ALL_DOMAINS.length > worked && sessions.length > 0
            ? ` ${ALL_DOMAINS.length - worked} notion(s) jamais travaillée(s).`
            : ''}
        </p>
      </div>
    </div>
  );
}
