import { pupilLabel } from '../types';
import { summariseByDomain, MASTERY_COLORS, type PupilFolder } from '../lib/results';

function frenchDate(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Un dossier par élève. La pastille de droite résume les six notions : une
 *  case par notion, à la couleur de son niveau, grise si rien n'est encore
 *  établi. */
export function PupilList({
  folders,
  onOpen,
  toCorrect = {},
}: {
  folders: PupilFolder[];
  onOpen: (key: string) => void;
  /** Par dossier, le nombre de feuilles d'opérations qui attendent une
   *  correction. */
  toCorrect?: Record<string, number>;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {folders.map((folder) => {
        const summaries = summariseByDomain(folder.sessions);
        return (
          <li key={folder.key}>
            <button
              type="button"
              onClick={() => onOpen(folder.key)}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-900/5 flex items-center justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="block font-bold text-slate-800 truncate">
                  {pupilLabel(folder.pupil)}
                </span>
                <span className="block text-xs text-slate-500">
                  {folder.sessions.length} séance{folder.sessions.length > 1 ? 's' : ''} · dernière
                  le {frenchDate(folder.lastAt)}
                </span>
                {(toCorrect[folder.key] ?? 0) > 0 && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {toCorrect[folder.key]} feuille{toCorrect[folder.key] > 1 ? 's' : ''} à corriger
                  </span>
                )}
              </span>
              <span className="flex gap-[3px] shrink-0" aria-hidden="true">
                {summaries.map((summary) => (
                  <span
                    key={summary.domain}
                    className="w-2.5 h-6 rounded-sm"
                    style={{
                      background: summary.mastery ? MASTERY_COLORS[summary.mastery] : '#e2e8f0',
                    }}
                  />
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
