import { useMemo, useState } from 'react';
import { NOTION_COLORS, SUBJECT_COLORS, TEACHER_RED } from '../theme';
import { Gommette } from './ecole/Gommette';
import { RainbowArc } from './ecole/RainbowArc';
import { SchoolTitle } from './ecole/SchoolTitle';
import type { Activity, Domain, Level, Subject, Trimester } from '../types';
import type { Preferences } from '../lib/preferences';
import { isCloudConfigured, isValidJoinCode, normaliseJoinCode } from '../lib/cloud';
import { receivedFor, type ReceivedCorrection, type StoredCorrection } from '../lib/pupilCorrections';
import { worksheetScore } from '../lib/worksheet';
import { formatFrenchDate } from '../lib/worksheetPdf';
import {
  ACTIVITY_HINTS,
  ACTIVITY_LABELS,
  ALL_SUBJECTS,
  ALL_TRIMESTERS,
  DOMAIN_LABELS,
  SUBJECT_ACTIVITIES,
  SUBJECT_DOMAINS,
  SUBJECT_LABELS,
  TRIMESTER_LABELS,
} from '../types';

export interface StartOptions {
  name: string;
  lastName: string;
  joinCode: string;
  domains: Domain[];
  level: Level;
  trimester: Trimester;
  subject: Subject;
  activity: Activity;
}

interface HomeScreenProps {
  initial: Preferences;
  onStart: (options: StartOptions) => void;
  /** Les feuilles corrigées reçues par la tablette, tous élèves confondus :
   *  l'écran ne montre que celles de l'élève dont le nom est écrit. */
  corrections?: StoredCorrection[];
  onOpenCorrection?: (correction: ReceivedCorrection) => void;
}

export function HomeScreen({ initial, onStart, corrections = [], onOpenCorrection }: HomeScreenProps) {
  const [name, setName] = useState(initial.name);
  const [lastName, setLastName] = useState(initial.lastName);
  const received = useMemo(
    () => receivedFor(corrections, { firstName: name, lastName }),
    [corrections, name, lastName]
  );
  const [joinCode, setJoinCode] = useState(initial.joinCode);
  // Sans Supabase configuré, un code de classe ne servirait à rien : le champ
  // n'apparaît pas, plutôt que de promettre un envoi qui n'aura pas lieu.
  const cloudAvailable = isCloudConfigured();
  const [level, setLevel] = useState<Level>(initial.level);
  const [trimester, setTrimester] = useState<Trimester>(initial.trimester);
  const [subject, setSubject] = useState<Subject>(initial.subject);
  const [domains, setDomains] = useState<Domain[]>(initial.domains);
  const [activity, setActivity] = useState<Activity>(initial.activity);

  // Changer de matière repart des notions de cette matière : il n'existe aucun
  // état d'où l'on pourrait lancer une séance mêlant le français et les maths.
  const selectSubject = (next: Subject) => {
    setSubject(next);
    setDomains([...SUBJECT_DOMAINS[next]]);
    if (!SUBJECT_ACTIVITIES[next].includes(activity)) {
      setActivity(SUBJECT_ACTIVITIES[next][0]);
    }
  };

  const activities = SUBJECT_ACTIVITIES[subject];
  const posingOperations = activity === 'posees';

  const toggleDomain = (domain: Domain) => {
    setDomains((prev) => (prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]));
  };

  // Poser des opérations ne demande aucune notion, et la révision ciblée
  // choisit les siennes toute seule.
  const canStart =
    name.trim().length > 0 && (posingOperations || activity === 'revision' || domains.length > 0);

  return (
    <div className="min-h-screen px-4 pb-12 pt-3">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <SchoolTitle subtitle="Mon cahier d'exercices" />

        {received.length > 0 && onOpenCorrection && (
          <FeuillesCorrigees items={received} onOpen={onOpenCorrection} />
        )}

        <Etape numero={1} titre="Qui es-tu ?">
          <Ligne label="Ton prénom">
            <input
              className={champ}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Écris ton prénom"
              autoComplete="given-name"
            />
          </Ligne>
          <Ligne label="Ton nom" aide="si tu en as besoin">
            <input
              className={champ}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom de famille"
              autoComplete="family-name"
            />
          </Ligne>
          {cloudAvailable && (
            <Ligne label="Code de la classe" aide="donné par ta maîtresse">
              <input
                className={`${champ} uppercase tracking-[0.35em]`}
                value={joinCode}
                onChange={(e) => setJoinCode(normaliseJoinCode(e.target.value))}
                placeholder="ABC123"
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
              />
              {joinCode !== '' && !isValidJoinCode(joinCode) && (
                <span className="text-sm font-bold text-[#B84A06]">Le code fait six lettres ou chiffres.</span>
              )}
            </Ligne>
          )}
        </Etape>

        <Etape numero={2} titre="Ta classe">
          <div className="flex gap-3">
            {(['CM1', 'CM2'] as Level[]).map((lvl) => (
              <Choix key={lvl} actif={level === lvl} onClick={() => setLevel(lvl)} className="flex-1 py-3 text-xl">
                {lvl}
              </Choix>
            ))}
          </div>
          <div className="flex gap-2">
            {ALL_TRIMESTERS.map((t) => (
              <Choix key={t} actif={trimester === t} onClick={() => setTrimester(t)} className="flex-1 px-1 py-2 text-sm leading-tight">
                {TRIMESTER_LABELS[t]}
              </Choix>
            ))}
          </div>
          <p className="text-sm text-encre-pale">
            Seules les notions déjà vues en classe à ce moment de l'année sont proposées.
          </p>
        </Etape>

        <Etape numero={3} titre="Ta matière">
          <div className="flex gap-3">
            {ALL_SUBJECTS.map((s) => {
              const actif = subject === s;
              const colors = SUBJECT_COLORS[s];
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => selectSubject(s)}
                  className="etiquette relative flex flex-1 flex-col items-center gap-1 px-2 pb-3 pt-2 text-xl"
                  style={actif ? { background: colors.tint, borderColor: colors.deep, boxShadow: `0 3px 0 ${colors.deep}` } : undefined}
                >
                  <RainbowArc domains={SUBJECT_DOMAINS[s]} className="w-24" />
                  <span style={actif ? { color: colors.deep } : undefined}>{SUBJECT_LABELS[s]}</span>
                  {actif && (
                    <Gommette color={colors.deep} mark="coche" size={26} tilt={-8} className="absolute -right-2 -top-2" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-encre-pale">
            Une séance ne mélange jamais le français et les maths : on reste d'un seul côté de l'arc-en-ciel.
          </p>
        </Etape>

        <Etape numero={4} titre="Ta séance">
          {activities.length > 1 && (
            <>
              <div className="flex gap-2">
                {activities.map((option) => (
                  <Choix
                    key={option}
                    actif={activity === option}
                    onClick={() => setActivity(option)}
                    className="flex-1 px-1 py-2 text-sm leading-tight"
                  >
                    {ACTIVITY_LABELS[option]}
                  </Choix>
                ))}
              </div>
              <p className="text-sm text-encre-pale">{ACTIVITY_HINTS[activity]}</p>
            </>
          )}
          <div className={`flex-col gap-2 ${posingOperations || activity === 'revision' ? 'hidden' : 'flex'}`}>
            <span className="text-base font-bold text-encre-douce">
              Ce que tu travailles en {SUBJECT_LABELS[subject].toLowerCase()}
            </span>
            {SUBJECT_DOMAINS[subject].map((domain) => {
              const actif = domains.includes(domain);
              const colors = NOTION_COLORS[domain];
              return (
                <button
                  key={domain}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => toggleDomain(domain)}
                  className="flex items-center justify-between gap-3 rounded-r-2xl rounded-l-md border-2 py-3 pl-4 pr-3 text-left text-lg font-bold"
                  style={{
                    borderLeftWidth: 10,
                    borderColor: actif ? colors.deep : '#d9d4c8',
                    borderLeftColor: colors.band,
                    background: actif ? colors.tint : '#fffdf8',
                    color: actif ? colors.deep : '#475272',
                  }}
                >
                  {DOMAIN_LABELS[domain]}
                  <Gommette color={colors.deep} mark={actif ? 'coche' : null} empty={!actif} size={26} />
                </button>
              );
            })}
          </div>
        </Etape>

        <button
          type="button"
          disabled={!canStart}
          onClick={() =>
            onStart({
              name: name.trim(),
              lastName: lastName.trim(),
              joinCode: isValidJoinCode(joinCode) ? joinCode : '',
              domains,
              level,
              trimester,
              subject,
              activity,
            })
          }
          className="bouton-encre w-full py-4 text-xl"
        >
          Commencer ma séance
        </button>

        <a
          href="#maitresse"
          className="self-center rounded-full px-4 py-2 text-base font-bold text-encre-douce underline decoration-2 underline-offset-4"
        >
          Espace maîtresse
        </a>
      </div>
    </div>
  );
}

/**
 * Le courrier de la maîtresse : les feuilles d'opérations qu'elle a corrigées,
 * les nouvelles marquées d'une pastille rouge.
 */
function FeuillesCorrigees({ items, onOpen }: { items: ReceivedCorrection[]; onOpen: (item: ReceivedCorrection) => void }) {
  const fresh = items.filter((item) => item.isNew).length;
  const title =
    fresh === 0
      ? 'Mes feuilles corrigées'
      : fresh === 1
        ? 'Ta maîtresse a corrigé ta feuille\u00a0!'
        : `Ta maîtresse a corrigé ${fresh} feuilles\u00a0!`;
  return (
    <section
      className="flex flex-col gap-3 rounded-3xl border-2 bg-[#fffdf8] p-4 shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]"
      style={{ borderColor: fresh > 0 ? TEACHER_RED : 'transparent' }}
    >
      <h2 className="text-xl font-bold" style={{ color: fresh > 0 ? TEACHER_RED : undefined }}>
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.slice(0, 3).map((item) => {
          const { correct, total } = worksheetScore(item.worksheet);
          return (
            <li key={item.sessionId}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="etiquette flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-base font-bold">
                    Opérations posées du {formatFrenchDate(item.worksheet.createdAt)}
                  </span>
                  <span className="block text-sm font-normal text-encre-douce">
                    {correct} / {total} juste{correct > 1 ? 's' : ''}
                    {item.worksheet.appreciation ? ' · un mot de ta maîtresse' : ''}
                  </span>
                </span>
                {item.isNew ? (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ background: TEACHER_RED }}
                  >
                    Nouveau
                  </span>
                ) : (
                  <span aria-hidden="true" className="shrink-0 text-xl text-encre-douce">
                    ›
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Écrire son nom sur la ligne du cahier. */
const champ =
  'w-full border-0 border-b-2 border-dashed border-encre/40 bg-transparent px-1 pb-1 pt-0 text-2xl text-encre placeholder:text-encre-pale/60 focus:border-solid focus:border-encre focus:outline-none';

/** Une consigne de la fiche : son numéro, son titre, puis ce qu'on remplit. */
function Etape({ numero, titre, children }: { numero: number; titre: string; children: React.ReactNode }) {
  return (
    <section className="cahier flex flex-col gap-3 rounded-3xl py-5 pl-12 pr-5 shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
      <h2 className="-ml-9 flex items-center gap-3 text-xl font-bold text-encre">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-encre text-base text-white">
          {numero}
        </span>
        {titre}
      </h2>
      {children}
    </section>
  );
}

function Ligne({ label, aide, children }: { label: string; aide?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-base font-bold text-encre-douce">
        {label} {aide && <span className="font-normal text-encre-pale">({aide})</span>}
      </span>
      {children}
    </label>
  );
}

/** Une étiquette à choisir : pleine d'encre quand elle est choisie. */
function Choix({
  actif,
  onClick,
  className = '',
  children,
}: {
  actif: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={`etiquette ${actif ? '!bg-encre !text-white' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
