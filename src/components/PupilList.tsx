import { ALL_SUBJECTS, pupilLabel } from '../types';
import { summariseByDomain, MASTERY_COLORS, type PupilFolder } from '../lib/results';
import { NOTION_COLORS } from '../theme';

function frenchDate(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Un dossier par élève. La pastille de droite résume les matières
 *  travaillées dans la liste : une case par notion, à la couleur de son
 *  niveau, grise si rien n'est encore établi, les matières séparées d'un
 *  espace. Les mêmes matières pour tous, dans le même ordre : d'une ligne à
 *  l'autre, les colonnes se comparent. */
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
  const summariesByFolder = folders.map((folder) => summariseByDomain(folder.sessions));
  const practiced = ALL_SUBJECTS.filter((subject) =>
    summariesByFolder.some((summaries) =>
      summaries.some((summary) => summary.subject === subject && summary.total > 0)
    )
  );
  return (
    <ul className="flex flex-col gap-2">
      {folders.map((folder, index) => {
        const summaries = summariesByFolder[index];
        return (
          <li key={folder.key}>
            <button
              type="button"
              onClick={() => onOpen(folder.key)}
              className="etiquette flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold text-encre">
                  {pupilLabel(folder.pupil)}
                </span>
                <span className="block text-xs font-normal text-encre-douce">
                  {folder.sessions.length} séance{folder.sessions.length > 1 ? 's' : ''} ·{' '}
                  <span className="whitespace-nowrap">dernière le {frenchDate(folder.lastAt)}</span>
                </span>
                {(toCorrect[folder.key] ?? 0) > 0 && (
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{ background: NOTION_COLORS.accords.tint, color: NOTION_COLORS.accords.deep }}
                  >
                    {toCorrect[folder.key]} feuille{toCorrect[folder.key] > 1 ? 's' : ''} à corriger
                  </span>
                )}
              </span>
              <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                {practiced.map((subject) => (
                  <span key={subject} className="flex gap-[2px]">
                    {summaries
                      .filter((summary) => summary.subject === subject)
                      .map((summary) => (
                        <span
                          key={summary.domain}
                          className="h-6 w-2 rounded-sm"
                          style={{
                            background: summary.mastery ? MASTERY_COLORS[summary.mastery] : '#e2e8f0',
                          }}
                        />
                      ))}
                  </span>
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
