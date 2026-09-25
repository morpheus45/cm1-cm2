import { useState } from 'react';
import type { Domain, Level, Subject, Trimester } from '../types';
import type { Preferences } from '../lib/preferences';
import {
  ALL_SUBJECTS,
  ALL_TRIMESTERS,
  DOMAIN_LABELS,
  SUBJECT_DOMAINS,
  SUBJECT_EMOJI,
  SUBJECT_LABELS,
  TRIMESTER_LABELS,
} from '../types';

export interface StartOptions {
  name: string;
  domains: Domain[];
  level: Level;
  trimester: Trimester;
  subject: Subject;
}

interface HomeScreenProps {
  initial: Preferences;
  onStart: (options: StartOptions) => void;
}

export function HomeScreen({ initial, onStart }: HomeScreenProps) {
  const [name, setName] = useState(initial.name);
  const [level, setLevel] = useState<Level>(initial.level);
  const [trimester, setTrimester] = useState<Trimester>(initial.trimester);
  const [subject, setSubject] = useState<Subject>(initial.subject);
  const [domains, setDomains] = useState<Domain[]>(initial.domains);

  // Changer de matière repart des notions de cette matière : il n'existe aucun
  // état d'où l'on pourrait lancer une séance mêlant le français et les maths.
  const selectSubject = (next: Subject) => {
    setSubject(next);
    setDomains([...SUBJECT_DOMAINS[next]]);
  };

  const toggleDomain = (domain: Domain) => {
    setDomains((prev) => (prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]));
  };

  const canStart = name.trim().length > 0 && domains.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 bg-sky-50 px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-700">Mes exercices</h1>

      <label className="w-full max-w-sm flex flex-col gap-2">
        <span className="text-lg text-slate-600">Ton prénom</span>
        <input
          className="rounded-xl border-2 border-sky-200 px-4 py-3 text-xl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Écris ton prénom"
        />
      </label>

      <div className="w-full max-w-sm flex flex-col gap-2">
        <span className="text-lg text-slate-600">Niveau</span>
        <div className="flex gap-3">
          {(['CM1', 'CM2'] as Level[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevel(lvl)}
              className={`flex-1 rounded-xl py-3 text-xl font-semibold border-2 ${
                level === lvl ? 'bg-sky-400 text-white border-sky-400' : 'bg-white border-sky-200 text-slate-600'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        <span className="text-lg text-slate-600">Trimestre</span>
        <div className="flex gap-3">
          {ALL_TRIMESTERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrimester(t)}
              className={`flex-1 rounded-xl py-3 text-base font-semibold border-2 ${
                trimester === t ? 'bg-sky-400 text-white border-sky-400' : 'bg-white border-sky-200 text-slate-600'
              }`}
            >
              {TRIMESTER_LABELS[t]}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          Seules les notions déjà vues en classe à ce moment de l'année sont proposées.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        <span className="text-lg text-slate-600">Matière</span>
        <div className="flex gap-3">
          {ALL_SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => selectSubject(s)}
              className={`flex-1 rounded-2xl py-5 text-xl font-bold border-2 ${
                subject === s
                  ? 'bg-violet-500 text-white border-violet-500'
                  : 'bg-white border-violet-200 text-slate-600'
              }`}
            >
              <span className="block text-3xl leading-none mb-1">{SUBJECT_EMOJI[s]}</span>
              {SUBJECT_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          Une séance ne mélange jamais le français et les maths.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        <span className="text-lg text-slate-600">
          Ce que tu travailles en {SUBJECT_LABELS[subject].toLowerCase()}
        </span>
        <div className="flex flex-col gap-3">
          {SUBJECT_DOMAINS[subject].map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => toggleDomain(domain)}
              className={`rounded-xl py-3 px-4 text-lg font-medium border-2 text-left ${
                domains.includes(domain)
                  ? 'bg-emerald-400 text-white border-emerald-400'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {DOMAIN_LABELS[domain]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!canStart}
        onClick={() => onStart({ name: name.trim(), domains, level, trimester, subject })}
        className="w-full max-w-sm rounded-xl bg-orange-400 disabled:bg-slate-300 text-white text-xl font-bold py-4"
      >
        Commencer
      </button>
    </div>
  );
}
