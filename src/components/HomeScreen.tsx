import { useState } from 'react';
import type { Domain, Level } from '../types';
import { ALL_DOMAINS, DOMAIN_LABELS } from '../types';

interface HomeScreenProps {
  onStart: (name: string, subjects: Domain[], level: Level) => void;
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<Level>('CM1');
  const [subjects, setSubjects] = useState<Domain[]>([...ALL_DOMAINS]);

  const toggleSubject = (domain: Domain) => {
    setSubjects((prev) => (prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]));
  };

  const canStart = name.trim().length > 0 && subjects.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-sky-50 px-4 py-8">
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
        <span className="text-lg text-slate-600">Matières</span>
        <div className="grid grid-cols-2 gap-3">
          {ALL_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => toggleSubject(domain)}
              className={`rounded-xl py-3 px-2 text-base font-medium border-2 ${
                subjects.includes(domain)
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
        onClick={() => onStart(name.trim(), subjects, level)}
        className="w-full max-w-sm rounded-xl bg-orange-400 disabled:bg-slate-300 text-white text-xl font-bold py-4"
      >
        Commencer
      </button>
    </div>
  );
}
