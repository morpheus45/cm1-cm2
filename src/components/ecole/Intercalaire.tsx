import type { Domain } from '../../types';
import { DOMAIN_LABELS } from '../../types';
import { NOTION_COLORS } from '../../theme';

/** L'onglet de couleur d'une notion, comme l'intercalaire d'un classeur. */
export function Intercalaire({ domain, prefix }: { domain: Domain; prefix?: string }) {
  const colors = NOTION_COLORS[domain];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-r-full rounded-l-md py-1 pl-2 pr-4 text-sm font-bold"
      style={{ background: colors.tint, color: colors.deep, borderLeft: `6px solid ${colors.band}` }}
    >
      {prefix && <span className="font-normal">{prefix} ·</span>}
      {DOMAIN_LABELS[domain]}
    </span>
  );
}
