# Phase 1 — Moteur d'exercices + écran élève Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React PWA (no backend yet) where a child picks a name, a level (CM1/CM2) and one or more subjects, then practices an 8-question QCM session generated from a seeded random engine, with feedback designed for a child with attention difficulties (TDA).

**Architecture:** A pure-logic core (`src/lib`, `src/domains`) generates reproducible sessions of `Question` objects from a numeric seed, independent of the UI. A thin React layer (`src/components`, `src/App.tsx`) drives three screens (home → question → recap) through simple state, consuming only the core's public functions.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS for styling, Vitest for unit tests on the logic core. No backend, no routing library needed (three screens driven by local state).

## Global Constraints

- Every QCM question has exactly one correct answer among 4 choices (6 for `problemes`, matching the source workbook).
- Session generation must be reproducible: same `(subjects, level, seed)` → identical question array, in the same order, on every call (spec: "Mécanique de session").
- No red/cross/punitive UI on a wrong answer; no mandatory timer (spec: "Écran élève (adapté TDA)").
- Content must come from the domain data banks / procedural generators defined in this plan — never from `Math.random()` directly outside `src/lib/seededRandom.ts`.
- Automated tests (Vitest) cover the pure logic in `src/lib` and `src/domains`. React screens are verified manually via `npm run dev`, as specified in the design doc's Test section — no React Testing Library setup in this phase.
- No backend, no `localStorage` sync beyond a simple cumulative star count (spec: "Persistance (Phase 1 uniquement)").

---

### Task 1: Project scaffolding (Vite + React + TypeScript + Tailwind + Vitest)

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `src/App.tsx`
- Create: `.gitignore`

**Interfaces:**
- Produces: a working Vite dev server rendering an `App` placeholder component at `src/App.tsx`, and a `vitest run` command that succeeds with zero tests.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "exercices-cm1-cm2",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.1",
    "vitest": "^2.0.1"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 5: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create `index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mes exercices CM1-CM2</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create `src/App.tsx` (placeholder, replaced in Task 13)**

```tsx
export function App() {
  return <div className="p-8 text-2xl">Chargement...</div>;
}
```

- [ ] **Step 9: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 10: Create `.gitignore`**

```
node_modules
dist
```

- [ ] **Step 11: Install dependencies**

Run: `npm install`
Expected: exits 0, creates `node_modules` and `package-lock.json`.

- [ ] **Step 12: Verify the dev server starts**

Run: `npm run dev -- --port 5173` in the background, then check it serves HTML on `http://localhost:5173`. Stop the server after checking.
Expected: page loads showing "Chargement...".

- [ ] **Step 13: Verify Vitest runs with zero tests**

Run: `npm test`
Expected: "No test files found" or similar — exits without error (add `--passWithNoTests` to the `test` script in `package.json` if the installed Vitest version exits non-zero on zero tests).

- [ ] **Step 14: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tailwind.config.js postcss.config.js index.html src/main.tsx src/index.css src/App.tsx .gitignore package-lock.json
git commit -m "chore: scaffold Vite + React + TypeScript + Tailwind + Vitest project"
```

---

### Task 2: Shared types and seeded random utilities (TDD)

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/seededRandom.ts`
- Test: `src/lib/seededRandom.test.ts`

**Interfaces:**
- Produces: `Level`, `Domain`, `Question`, `ALL_DOMAINS`, `DOMAIN_LABELS` from `src/types.ts`; `Rng`, `createRng(seed: number): Rng`, `rngInt(rng, min, max): number`, `rngPick<T>(rng, arr: T[]): T`, `rngShuffle<T>(rng, arr: T[]): T[]`, `rngPickN<T>(rng, pool: T[], n: number): T[]` from `src/lib/seededRandom.ts`.

- [ ] **Step 1: Create `src/types.ts` (no test needed — pure type/constant declarations)**

```ts
export type Level = 'CM1' | 'CM2';

export type Domain =
  | 'conjugaison'
  | 'accords'
  | 'orthographe'
  | 'numeration'
  | 'calcul'
  | 'problemes';

export interface Question {
  id: string;
  domain: Domain;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export const ALL_DOMAINS: Domain[] = [
  'conjugaison',
  'accords',
  'orthographe',
  'numeration',
  'calcul',
  'problemes',
];

export const DOMAIN_LABELS: Record<Domain, string> = {
  conjugaison: 'Conjugaison',
  accords: 'Accords',
  orthographe: 'Orthographe et vocabulaire',
  numeration: 'Numération',
  calcul: 'Calcul',
  problemes: 'Problèmes',
};
```

- [ ] **Step 2: Write the failing test for `seededRandom`**

Create `src/lib/seededRandom.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRng, rngInt, rngPick, rngPickN, rngShuffle } from './seededRandom';

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produces a different sequence for a different seed', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('always returns numbers in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('rngInt', () => {
  it('stays within [min, max] inclusive', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const value = rngInt(rng, 5, 9);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(9);
    }
  });
});

describe('rngPick', () => {
  it('always returns an element from the array', () => {
    const rng = createRng(9);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(rngPick(rng, arr));
    }
  });
});

describe('rngShuffle', () => {
  it('returns an array with the same elements', () => {
    const rng = createRng(11);
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rngShuffle(rng, arr);
    expect(shuffled.slice().sort()).toEqual(arr.slice().sort());
  });

  it('does not mutate the input array', () => {
    const rng = createRng(11);
    const arr = [1, 2, 3];
    rngShuffle(rng, arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('is deterministic for a given seed', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffledA = rngShuffle(createRng(123), arr);
    const shuffledB = rngShuffle(createRng(123), arr);
    expect(shuffledA).toEqual(shuffledB);
  });
});

describe('rngPickN', () => {
  it('returns exactly n items when n <= pool length', () => {
    const rng = createRng(5);
    const result = rngPickN(rng, ['a', 'b', 'c', 'd'], 3);
    expect(result).toHaveLength(3);
    result.forEach((item) => expect(['a', 'b', 'c', 'd']).toContain(item));
  });

  it('cycles through the pool when n > pool length', () => {
    const rng = createRng(5);
    const result = rngPickN(rng, ['a', 'b'], 5);
    expect(result).toHaveLength(5);
    result.forEach((item) => expect(['a', 'b']).toContain(item));
  });

  it('returns an empty array for an empty pool', () => {
    const rng = createRng(5);
    expect(rngPickN(rng, [], 3)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- seededRandom`
Expected: FAIL — `src/lib/seededRandom.ts` does not exist yet.

- [ ] **Step 4: Implement `src/lib/seededRandom.ts`**

```ts
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngPick<T>(rng: Rng, arr: T[]): T {
  return arr[rngInt(rng, 0, arr.length - 1)];
}

export function rngShuffle<T>(rng: Rng, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rngInt(rng, 0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function rngPickN<T>(rng: Rng, pool: T[], n: number): T[] {
  if (pool.length === 0) return [];
  const result: T[] = [];
  while (result.length < n) {
    result.push(...rngShuffle(rng, pool));
  }
  return result.slice(0, n);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- seededRandom`
Expected: PASS, all cases green.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/seededRandom.ts src/lib/seededRandom.test.ts
git commit -m "feat: add shared types and seeded random utilities"
```

---

### Task 3: Conjugaison generator (TDD)

**Files:**
- Create: `src/domains/conjugaison.ts`
- Test: `src/domains/conjugaison.test.ts`

**Interfaces:**
- Consumes: `Level`, `Question` from `src/types.ts`; `Rng`, `rngPickN`, `rngShuffle` from `src/lib/seededRandom.ts`.
- Produces: `generate(level: Level, rng: Rng, count: number): Question[]` with `domain: 'conjugaison'`.

- [ ] **Step 1: Write the failing test**

Create `src/domains/conjugaison.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './conjugaison';

describe('conjugaison generate', () => {
  it('returns the requested number of questions', () => {
    const questions = generate('CM1', createRng(1), 8);
    expect(questions).toHaveLength(8);
  });

  it('tags every question with domain "conjugaison"', () => {
    const questions = generate('CM1', createRng(1), 5);
    questions.forEach((q) => expect(q.domain).toBe('conjugaison'));
  });

  it('gives each question exactly 4 choices with a valid correctIndex', () => {
    const questions = generate('CM2', createRng(2), 10);
    questions.forEach((q) => {
      expect(q.choices).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
      expect(new Set(q.choices).size).toBe(4);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM1', createRng(99), 6);
    const b = generate('CM1', createRng(99), 6);
    expect(a).toEqual(b);
  });

  it('only uses CM1 tenses as answer options at CM1 level', () => {
    const cm1Tenses = ['présent', 'imparfait', 'futur', 'passé composé'];
    const questions = generate('CM1', createRng(4), 16);
    questions.forEach((q) => {
      q.choices.forEach((choice) => expect(cm1Tenses).toContain(choice));
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- conjugaison`
Expected: FAIL — `src/domains/conjugaison.ts` does not exist yet.

- [ ] **Step 3: Implement `src/domains/conjugaison.ts`**

```ts
import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';

type Tense =
  | 'présent'
  | 'imparfait'
  | 'futur'
  | 'passé composé'
  | 'passé simple'
  | 'plus-que-parfait'
  | 'conditionnel présent';

interface ConjugationSentence {
  prompt: string;
  tense: Tense;
}

const CM1_TENSES: Tense[] = ['présent', 'imparfait', 'futur', 'passé composé'];
const CM2_EXTRA_TENSES: Tense[] = ['passé simple', 'plus-que-parfait', 'conditionnel présent'];

const CM1_SENTENCES: ConjugationSentence[] = [
  { prompt: 'Tu **aimes** la mousse au chocolat.', tense: 'présent' },
  { prompt: 'Nous **avons** un chien noir.', tense: 'présent' },
  { prompt: 'Elle **fait** ses devoirs.', tense: 'présent' },
  { prompt: 'Vous **prenez** le bus le matin.', tense: 'présent' },
  { prompt: 'La bibliothécaire **racontait** des histoires aux enfants.', tense: 'imparfait' },
  { prompt: 'Il **faisait** beau ce jour-là.', tense: 'imparfait' },
  { prompt: 'Nous **allions** à la piscine le mercredi.', tense: 'imparfait' },
  { prompt: 'Tu **voulais** un vélo rouge.', tense: 'imparfait' },
  { prompt: "Ils **prendront** l'ascenseur.", tense: 'futur' },
  { prompt: 'Elle **viendra** demain matin.', tense: 'futur' },
  { prompt: 'Nous **verrons** le film ce soir.', tense: 'futur' },
  { prompt: 'Vous **direz** la vérité.', tense: 'futur' },
  { prompt: "J'**ai remplacé** ma vieille voiture.", tense: 'passé composé' },
  { prompt: 'Elle **a vu** un bel oiseau.', tense: 'passé composé' },
  { prompt: 'Nous **avons pris** le train.', tense: 'passé composé' },
  { prompt: 'Ils **ont dit** merci.', tense: 'passé composé' },
];

const CM2_EXTRA_SENTENCES: ConjugationSentence[] = [
  { prompt: 'Le chevalier **partit** au combat.', tense: 'passé simple' },
  { prompt: 'Elle **prit** son cahier et sortit.', tense: 'passé simple' },
  { prompt: 'Ils **virent** un renard dans la forêt.', tense: 'passé simple' },
  { prompt: 'Nous **eûmes** très peur.', tense: 'passé simple' },
  { prompt: 'Il **avait déjà mangé** quand nous sommes arrivés.', tense: 'plus-que-parfait' },
  { prompt: 'Elle **était partie** avant la pluie.', tense: 'plus-que-parfait' },
  { prompt: 'Nous **avions fini** nos devoirs.', tense: 'plus-que-parfait' },
  { prompt: 'Ils **avaient oublié** leurs affaires.', tense: 'plus-que-parfait' },
  { prompt: "J'**aimerais** visiter Paris un jour.", tense: 'conditionnel présent' },
  { prompt: "Tu **pourrais** m'aider, s'il te plaît.", tense: 'conditionnel présent' },
  { prompt: 'Nous **voudrions** partir en vacances.', tense: 'conditionnel présent' },
  { prompt: 'Elle **viendrait** si elle avait le temps.', tense: 'conditionnel présent' },
];

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const tenseSet = level === 'CM1' ? CM1_TENSES : [...CM1_TENSES, ...CM2_EXTRA_TENSES];
  const pool = level === 'CM1' ? CM1_SENTENCES : [...CM1_SENTENCES, ...CM2_EXTRA_SENTENCES];
  const picked = rngPickN(rng, pool, count);

  return picked.map((item, index) => {
    const distractorPool = tenseSet.filter((t) => t !== item.tense);
    const distractors = rngShuffle(rng, distractorPool).slice(0, 3);
    const choices = rngShuffle(rng, [item.tense, ...distractors]);
    return {
      id: `conjugaison-${index}-${item.tense}`,
      domain: 'conjugaison',
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.tense),
    };
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- conjugaison`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domains/conjugaison.ts src/domains/conjugaison.test.ts
git commit -m "feat: add conjugaison question generator"
```

---

### Task 4: Accords generator (TDD)

**Files:**
- Create: `src/domains/accords.ts`
- Test: `src/domains/accords.test.ts`

**Interfaces:**
- Consumes: same as Task 3.
- Produces: `generate(level: Level, rng: Rng, count: number): Question[]` with `domain: 'accords'`.

- [ ] **Step 1: Write the failing test**

Create `src/domains/accords.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './accords';

describe('accords generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "accords" and 4 unique choices', () => {
    const questions = generate('CM2', createRng(3), 10);
    questions.forEach((q) => {
      expect(q.domain).toBe('accords');
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM2', createRng(42), 8);
    const b = generate('CM2', createRng(42), 8);
    expect(a).toEqual(b);
  });

  it('includes participe-passé questions only at CM2 level', () => {
    const cm1Questions = generate('CM1', createRng(5), 12);
    const cm2Questions = generate('CM2', createRng(5), 12);
    const hasParticipe = (qs: ReturnType<typeof generate>) =>
      qs.some((q) => q.id.startsWith('accords-participe'));
    expect(hasParticipe(cm1Questions)).toBe(false);
    expect(hasParticipe(cm2Questions)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- accords`
Expected: FAIL — `src/domains/accords.ts` does not exist yet.

- [ ] **Step 3: Implement `src/domains/accords.ts`**

```ts
import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';

interface NominalGroupItem {
  determiner: string;
  adjective: string;
  correctNoun: string;
  distractorNouns: [string, string, string];
}

const NOMINAL_GROUP_ITEMS: NominalGroupItem[] = [
  { determiner: 'un', adjective: 'agréable', correctNoun: 'marchand', distractorNouns: ['vendeuses', 'boulangers', 'commerçante'] },
  { determiner: 'une', adjective: 'jolie', correctNoun: 'feuille', distractorNouns: ['cadeau', 'écharpes', 'cartables'] },
  { determiner: 'des', adjective: 'nouveaux', correctNoun: 'amis', distractorNouns: ['ami', 'amie', 'amies'] },
  { determiner: 'des', adjective: 'mauvaises', correctNoun: 'blagues', distractorNouns: ['goût', 'croissants', 'idée'] },
  { determiner: 'un', adjective: 'grand', correctNoun: 'jardin', distractorNouns: ['maisons', 'maison', 'jardins'] },
  { determiner: 'une', adjective: 'petite', correctNoun: 'fille', distractorNouns: ['garçon', 'garçons', 'filles'] },
  { determiner: 'des', adjective: 'beaux', correctNoun: 'tableaux', distractorNouns: ['tableau', 'peinture', 'peintures'] },
  { determiner: 'des', adjective: 'belles', correctNoun: 'fleurs', distractorNouns: ['fleur', 'bouquet', 'bouquets'] },
  { determiner: 'un', adjective: 'vieux', correctNoun: 'château', distractorNouns: ['tours', 'tour', 'châteaux'] },
  { determiner: 'une', adjective: 'longue', correctNoun: 'route', distractorNouns: ['chemin', 'chemins', 'routes'] },
  { determiner: 'des', adjective: 'gentils', correctNoun: 'voisins', distractorNouns: ['voisin', 'voisine', 'voisines'] },
  { determiner: 'des', adjective: 'heureuses', correctNoun: 'familles', distractorNouns: ['famille', 'cousin', 'cousins'] },
];

interface ParticipeItem {
  prompt: string;
  correct: string;
  distractors: [string, string, string];
}

const CM2_PARTICIPE_ITEMS: ParticipeItem[] = [
  { prompt: 'Elle est ...', correct: 'partie', distractors: ['parti', 'partis', 'parties'] },
  { prompt: 'Ils sont ...', correct: 'arrivés', distractors: ['arrivé', 'arrivée', 'arrivées'] },
  { prompt: 'Elles sont ...', correct: 'tombées', distractors: ['tombé', 'tombés', 'tombée'] },
  { prompt: 'Il est ...', correct: 'venu', distractors: ['venue', 'venus', 'venues'] },
];

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const nominalCount = level === 'CM1' ? count : Math.ceil(count / 2);
  const participeCount = count - nominalCount;

  const nominalPicked = rngPickN(rng, NOMINAL_GROUP_ITEMS, nominalCount).map((item, index) => {
    const choices = rngShuffle(rng, [item.correctNoun, ...item.distractorNouns]);
    return {
      id: `accords-nominal-${index}-${item.correctNoun}`,
      domain: 'accords' as const,
      prompt: `${item.determiner} ${item.adjective} ...`,
      choices,
      correctIndex: choices.indexOf(item.correctNoun),
    };
  });

  if (participeCount <= 0) {
    return nominalPicked;
  }

  const participePicked = rngPickN(rng, CM2_PARTICIPE_ITEMS, participeCount).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `accords-participe-${index}-${item.correct}`,
      domain: 'accords' as const,
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  return rngShuffle(rng, [...nominalPicked, ...participePicked]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- accords`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domains/accords.ts src/domains/accords.test.ts
git commit -m "feat: add accords question generator"
```

---

### Task 5: Orthographe generator (TDD)

**Files:**
- Create: `src/domains/orthographe.ts`
- Test: `src/domains/orthographe.test.ts`

**Interfaces:**
- Consumes: same as Task 3.
- Produces: `generate(level: Level, rng: Rng, count: number): Question[]` with `domain: 'orthographe'`.

- [ ] **Step 1: Write the failing test**

Create `src/domains/orthographe.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './orthographe';

describe('orthographe generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', createRng(1), 9)).toHaveLength(9);
  });

  it('tags every question with domain "orthographe" and 4 unique choices', () => {
    const questions = generate('CM2', createRng(3), 9);
    questions.forEach((q) => {
      expect(q.domain).toBe('orthographe');
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM2', createRng(7), 9);
    const b = generate('CM2', createRng(7), 9);
    expect(a).toEqual(b);
  });

  it('includes synonym questions only at CM2 level, when count allows it', () => {
    const cm1Questions = generate('CM1', createRng(2), 12);
    const cm2Questions = generate('CM2', createRng(2), 12);
    const hasSynonym = (qs: ReturnType<typeof generate>) =>
      qs.some((q) => q.id.startsWith('orthographe-synonyme'));
    expect(hasSynonym(cm1Questions)).toBe(false);
    expect(hasSynonym(cm2Questions)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- orthographe`
Expected: FAIL — `src/domains/orthographe.ts` does not exist yet.

- [ ] **Step 3: Implement `src/domains/orthographe.ts`**

```ts
import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPickN, rngShuffle } from '../lib/seededRandom';

interface HomophoneItem {
  prompt: string;
  correct: string;
  pairPartner: string;
}

const CM1_HOMOPHONE_ITEMS: HomophoneItem[] = [
  { prompt: 'Il joue ... la balle.', correct: 'à', pairPartner: 'a' },
  { prompt: 'Elle ... un beau chat.', correct: 'a', pairPartner: 'à' },
  { prompt: 'Nous allons ... la piscine.', correct: 'à', pairPartner: 'a' },
  { prompt: 'Le chat ... noir.', correct: 'est', pairPartner: 'et' },
  { prompt: 'Paul ... Marie jouent ensemble.', correct: 'et', pairPartner: 'est' },
  { prompt: 'Ce gâteau ... délicieux.', correct: 'est', pairPartner: 'et' },
  { prompt: '... va au parc ?', correct: 'On', pairPartner: 'Ont' },
  { prompt: 'Ils ... mangé une pomme.', correct: 'ont', pairPartner: 'on' },
  { prompt: '... chante une chanson.', correct: 'On', pairPartner: 'Ont' },
  { prompt: '... chien aboie fort.', correct: 'Ce', pairPartner: 'Se' },
  { prompt: 'Elle ... lave les mains.', correct: 'se', pairPartner: 'ce' },
  { prompt: '... livre est intéressant.', correct: 'Ce', pairPartner: 'Se' },
];

const CM2_HOMOPHONE_ITEMS: HomophoneItem[] = [
  { prompt: 'Il prend ... sac.', correct: 'son', pairPartner: 'sont' },
  { prompt: 'Elles ... parties tôt.', correct: 'sont', pairPartner: 'son' },
  { prompt: 'Range ... cahier.', correct: 'son', pairPartner: 'sont' },
  { prompt: '... enfants jouent dehors.', correct: 'Ces', pairPartner: 'Ses' },
  { prompt: 'Elle range ... affaires.', correct: 'ses', pairPartner: 'ces' },
  { prompt: '... fleurs sont belles.', correct: 'Ces', pairPartner: 'Ses' },
  { prompt: '... une belle journée.', correct: "C'est", pairPartner: "S'est" },
  { prompt: 'Il ... blessé au genou.', correct: "s'est", pairPartner: "c'est" },
  { prompt: '... mon anniversaire.', correct: "C'est", pairPartner: "S'est" },
  { prompt: 'Tu veux du thé ... du café ?', correct: 'ou', pairPartner: 'où' },
  { prompt: '... habites-tu ?', correct: 'Où', pairPartner: 'Ou' },
  { prompt: 'Je ne sais pas ... il est parti.', correct: 'où', pairPartner: 'ou' },
];

interface SynonymItem {
  word: string;
  correct: string;
  distractors: [string, string, string];
}

const CM2_SYNONYM_ITEMS: SynonymItem[] = [
  { word: 'content', correct: 'joyeux', distractors: ['triste', 'fatigué', 'énervé'] },
  { word: 'grand', correct: 'immense', distractors: ['petit', 'léger', 'court'] },
  { word: 'beau', correct: 'magnifique', distractors: ['laid', 'ordinaire', 'sombre'] },
  { word: 'avoir peur', correct: 'craindre', distractors: ['aimer', 'oublier', 'chanter'] },
  { word: 'regarder', correct: 'observer', distractors: ['écouter', 'toucher', 'sentir'] },
  { word: 'petit', correct: 'minuscule', distractors: ['énorme', 'moyen', 'large'] },
];

function pairDistractors(rng: Rng, item: HomophoneItem, otherItems: HomophoneItem[]): string[] {
  const extras = rngShuffle(
    rng,
    otherItems
      .filter((o) => o.correct !== item.correct && o.correct !== item.pairPartner)
      .map((o) => o.correct)
  ).slice(0, 2);
  return [item.pairPartner, ...extras];
}

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const homophonePool = level === 'CM1' ? CM1_HOMOPHONE_ITEMS : [...CM1_HOMOPHONE_ITEMS, ...CM2_HOMOPHONE_ITEMS];
  const synonymBudget = level === 'CM1' ? 0 : Math.min(Math.floor(count / 3), CM2_SYNONYM_ITEMS.length);
  const homophoneCount = count - synonymBudget;

  const homophoneQuestions = rngPickN(rng, homophonePool, homophoneCount).map((item, index) => {
    const distractors = pairDistractors(rng, item, homophonePool);
    const choices = rngShuffle(rng, [item.correct, ...distractors]);
    return {
      id: `orthographe-homophone-${index}-${item.correct}`,
      domain: 'orthographe' as const,
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  if (synonymBudget <= 0) {
    return homophoneQuestions;
  }

  const synonymQuestions = rngPickN(rng, CM2_SYNONYM_ITEMS, synonymBudget).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `orthographe-synonyme-${index}-${item.correct}`,
      domain: 'orthographe' as const,
      prompt: `Un synonyme de « ${item.word} » est...`,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });

  return rngShuffle(rng, [...homophoneQuestions, ...synonymQuestions]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- orthographe`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domains/orthographe.ts src/domains/orthographe.test.ts
git commit -m "feat: add orthographe question generator"
```

---

### Task 6: Numeration generator with number-to-words converter (TDD)

**Files:**
- Create: `src/domains/numeration.ts`
- Test: `src/domains/numeration.test.ts`

**Interfaces:**
- Consumes: same as Task 3, plus `rngInt` from `src/lib/seededRandom.ts`.
- Produces: `generate(level: Level, rng: Rng, count: number): Question[]` with `domain: 'numeration'`; also exports `numberToFrenchWords(n: number): string` for testing.

- [ ] **Step 1: Write the failing test**

Create `src/domains/numeration.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate, numberToFrenchWords } from './numeration';

describe('numberToFrenchWords', () => {
  it('converts known values correctly', () => {
    expect(numberToFrenchWords(34)).toBe('trente-quatre');
    expect(numberToFrenchWords(600)).toBe('six cents');
    expect(numberToFrenchWords(180)).toBe('cent quatre-vingts');
    expect(numberToFrenchWords(79)).toBe('soixante-dix-neuf');
    expect(numberToFrenchWords(93)).toBe('quatre-vingt-treize');
    expect(numberToFrenchWords(5000)).toBe('cinq mille');
    expect(numberToFrenchWords(5010)).toBe('cinq mille dix');
    expect(numberToFrenchWords(842)).toBe('huit cent quarante-deux');
    expect(numberToFrenchWords(1001)).toBe('mille un');
    expect(numberToFrenchWords(0)).toBe('zéro');
  });
});

describe('numeration generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "numeration" and unique choices', () => {
    const questions = generate('CM2', createRng(3), 8);
    questions.forEach((q) => {
      expect(q.domain).toBe('numeration');
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.choices.length);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM1', createRng(55), 8);
    const b = generate('CM1', createRng(55), 8);
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- numeration`
Expected: FAIL — `src/domains/numeration.ts` does not exist yet.

- [ ] **Step 3: Implement `src/domains/numeration.ts`**

```ts
import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngPickN, rngShuffle } from '../lib/seededRandom';

const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const TEENS = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function twoDigits(n: number): string {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const tenIndex = Math.floor(n / 10);
  const unit = n % 10;
  if (tenIndex === 7 || tenIndex === 9) {
    return `${TENS[tenIndex]}-${TEENS[unit]}`;
  }
  if (unit === 0) {
    return tenIndex === 8 ? 'quatre-vingts' : TENS[tenIndex];
  }
  if (unit === 1 && tenIndex !== 8) {
    return `${TENS[tenIndex]}-et-un`;
  }
  return `${TENS[tenIndex]}-${UNITS[unit]}`;
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let result = '';
  if (hundreds > 0) {
    result += hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent`;
    if (rest === 0 && hundreds > 1) result += 's';
    if (rest > 0) result += ' ';
  }
  if (rest > 0) {
    result += twoDigits(rest);
  }
  return result || 'zéro';
}

export function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;

  const parts: string[] = [];
  if (billions > 0) {
    parts.push(`${threeDigits(billions)} milliard${billions > 1 ? 's' : ''}`);
  }
  if (millions > 0) {
    parts.push(`${threeDigits(millions)} million${millions > 1 ? 's' : ''}`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : `${threeDigits(thousands)} mille`);
  }
  if (rest > 0 || parts.length === 0) {
    parts.push(threeDigits(rest));
  }
  return parts.join(' ').trim();
}

function distractorsForNumber(rng: Rng, correct: number): number[] {
  const digits = String(correct).length;
  const candidates = new Set<number>();
  let attempts = 0;
  while (candidates.size < 3 && attempts < 200) {
    attempts += 1;
    const strategy = rngInt(rng, 0, 2);
    let candidate = correct;
    if (strategy === 0) {
      const pos = rngInt(rng, 0, digits - 1);
      const digitArray = String(correct).split('');
      let newDigit = String(rngInt(rng, 0, 9));
      if (digitArray[pos] === newDigit) newDigit = String((Number(newDigit) + 1) % 10);
      digitArray[pos] = newDigit;
      candidate = Number(digitArray.join(''));
    } else if (strategy === 1) {
      const magnitude = Math.pow(10, rngInt(rng, 1, Math.max(1, digits - 1)));
      candidate = correct + (rngInt(rng, 0, 1) === 0 ? magnitude : -magnitude);
    } else if (digits >= 2) {
      const digitArray = String(correct).split('');
      const pos = rngInt(rng, 0, digitArray.length - 2);
      [digitArray[pos], digitArray[pos + 1]] = [digitArray[pos + 1], digitArray[pos]];
      candidate = Number(digitArray.join(''));
    }
    if (candidate > 0 && candidate !== correct) {
      candidates.add(candidate);
    }
  }
  // Fallback in the rare case the strategies above could not produce 3 distinct values.
  let fallback = correct + 1;
  while (candidates.size < 3) {
    if (fallback !== correct && fallback > 0) candidates.add(fallback);
    fallback += 1;
  }
  return Array.from(candidates);
}

interface FractionItem {
  words: string;
  correct: string;
  distractors: [string, string, string];
}

const CM1_FRACTION_ITEMS: FractionItem[] = [
  { words: 'un demi', correct: '1/2', distractors: ['2/1', '1/3', '1/4'] },
  { words: 'un tiers', correct: '1/3', distractors: ['3/1', '1/2', '1/4'] },
  { words: 'un quart', correct: '1/4', distractors: ['4/1', '1/2', '1/3'] },
  { words: 'trois quarts', correct: '3/4', distractors: ['4/3', '3/3', '1/4'] },
  { words: 'deux tiers', correct: '2/3', distractors: ['3/2', '1/3', '2/2'] },
];

interface DecimalItem {
  prompt: string;
  correct: string;
  distractors: [string, string, string];
}

const CM2_DECIMAL_ITEMS: DecimalItem[] = [
  { prompt: "Quelle est l'écriture chiffrée de « douze virgule cinq » ?", correct: '12,5', distractors: ['120,5', '1,25', '12,05'] },
  { prompt: "Quelle est l'écriture chiffrée de « trois virgule sept » ?", correct: '3,7', distractors: ['37', '3,07', '30,7'] },
  { prompt: 'Quel pourcentage correspond à la moitié ?', correct: '50 %', distractors: ['25 %', '75 %', '100 %'] },
  { prompt: 'Quel pourcentage correspond au quart ?', correct: '25 %', distractors: ['50 %', '75 %', '10 %'] },
];

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const bankBudget = count >= 4 ? Math.min(2, count) : 0;
  const dicteeCount = count - bankBudget;

  const dicteeQuestions: Question[] = [];
  const usedNumbers = new Set<number>();
  while (dicteeQuestions.length < dicteeCount) {
    const correct = level === 'CM1' ? rngInt(rng, 10, 999999) : rngInt(rng, 1000, 999999999);
    if (usedNumbers.has(correct)) continue;
    usedNumbers.add(correct);
    const distractors = distractorsForNumber(rng, correct);
    const choices = rngShuffle(rng, [String(correct), ...distractors.map(String)]);
    dicteeQuestions.push({
      id: `numeration-dictee-${dicteeQuestions.length}-${correct}`,
      domain: 'numeration',
      prompt: `Quel nombre correspond à « ${numberToFrenchWords(correct)} » ?`,
      choices,
      correctIndex: choices.indexOf(String(correct)),
    });
  }

  if (bankBudget <= 0) {
    return dicteeQuestions;
  }

  if (level === 'CM1') {
    const picked = rngPickN(rng, CM1_FRACTION_ITEMS, bankBudget).map((item, index) => {
      const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
      return {
        id: `numeration-bank-${index}-${item.correct}`,
        domain: 'numeration' as const,
        prompt: `Quelle fraction correspond à « ${item.words} » ?`,
        choices,
        correctIndex: choices.indexOf(item.correct),
      };
    });
    return rngShuffle(rng, [...dicteeQuestions, ...picked]);
  }

  const picked = rngPickN(rng, CM2_DECIMAL_ITEMS, bankBudget).map((item, index) => {
    const choices = rngShuffle(rng, [item.correct, ...item.distractors]);
    return {
      id: `numeration-bank-${index}-${item.correct}`,
      domain: 'numeration' as const,
      prompt: item.prompt,
      choices,
      correctIndex: choices.indexOf(item.correct),
    };
  });
  return rngShuffle(rng, [...dicteeQuestions, ...picked]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- numeration`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domains/numeration.ts src/domains/numeration.test.ts
git commit -m "feat: add numeration question generator with number-to-words converter"
```

---

### Task 7: Calcul generator (TDD)

**Files:**
- Create: `src/domains/calcul.ts`
- Test: `src/domains/calcul.test.ts`

**Interfaces:**
- Consumes: same as Task 3, plus `rngInt` from `src/lib/seededRandom.ts`.
- Produces: `generate(level: Level, rng: Rng, count: number): Question[]` with `domain: 'calcul'`.

- [ ] **Step 1: Write the failing test**

Create `src/domains/calcul.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './calcul';

describe('calcul generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 8)).toHaveLength(8);
    expect(generate('CM2', createRng(1), 8)).toHaveLength(8);
  });

  it('tags every question with domain "calcul" and 4 unique numeric-looking choices', () => {
    const questions = generate('CM1', createRng(3), 10);
    questions.forEach((q) => {
      expect(q.domain).toBe('calcul');
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM2', createRng(21), 8);
    const b = generate('CM2', createRng(21), 8);
    expect(a).toEqual(b);
  });

  it('prompts contain an operation sign and a question mark', () => {
    const questions = generate('CM1', createRng(8), 6);
    questions.forEach((q) => {
      expect(q.prompt).toMatch(/[+\-×÷]/);
      expect(q.prompt.endsWith('?')).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- calcul`
Expected: FAIL — `src/domains/calcul.ts` does not exist yet.

- [ ] **Step 3: Implement `src/domains/calcul.ts`**

```ts
import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngShuffle } from '../lib/seededRandom';

type Operation = '+' | '-' | '×' | '÷';

function randomDecimal(rng: Rng, max: number): number {
  return Math.round(rngInt(rng, 10, max * 10)) / 10;
}

function distractorsForResult(rng: Rng, correct: number, isDecimal: boolean): number[] {
  const candidates = new Set<number>();
  const step = isDecimal ? 0.1 : 1;
  let attempts = 0;
  while (candidates.size < 3 && attempts < 100) {
    attempts += 1;
    const offset = rngInt(rng, 1, 12) * step * (rngInt(rng, 0, 1) === 0 ? 1 : -1);
    const candidate = Math.round((correct + offset) * 10) / 10;
    if (candidate > 0 && candidate !== correct) {
      candidates.add(candidate);
    }
  }
  let fallback = correct + step;
  while (candidates.size < 3) {
    if (fallback !== correct && fallback > 0) candidates.add(Math.round(fallback * 10) / 10);
    fallback += step;
  }
  return Array.from(candidates);
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

interface BuiltOperation {
  a: number;
  b: number;
  op: Operation;
  result: number;
  isDecimal: boolean;
}

function buildCM1Operation(rng: Rng): BuiltOperation {
  const op = rngShuffle(rng, ['+', '-', '×', '÷'] as Operation[])[0];
  if (op === '+') {
    const a = rngInt(rng, 100, 500);
    const b = rngInt(rng, 100, 500);
    return { a, b, op, result: a + b, isDecimal: false };
  }
  if (op === '-') {
    const a = rngInt(rng, 200, 900);
    const b = rngInt(rng, 10, a - 1);
    return { a, b, op, result: a - b, isDecimal: false };
  }
  if (op === '×') {
    const a = rngInt(rng, 2, 9);
    const b = rngInt(rng, 2, 12);
    return { a, b, op, result: a * b, isDecimal: false };
  }
  const b = rngInt(rng, 2, 9);
  const result = rngInt(rng, 2, 12);
  return { a: b * result, b, op, result, isDecimal: false };
}

function buildCM2Operation(rng: Rng): BuiltOperation {
  const op = rngShuffle(rng, ['+', '-', '×', '÷'] as Operation[])[0];
  if (op === '+') {
    const a = randomDecimal(rng, 80);
    const b = randomDecimal(rng, 80);
    return { a, b, op, result: Math.round((a + b) * 10) / 10, isDecimal: true };
  }
  if (op === '-') {
    const a = randomDecimal(rng, 80) + 10;
    const b = randomDecimal(rng, Math.max(1, Math.floor(a) - 1));
    return { a, b, op, result: Math.round((a - b) * 10) / 10, isDecimal: true };
  }
  if (op === '×') {
    const a = rngInt(rng, 10, 99);
    const b = rngInt(rng, 2, 20);
    return { a, b, op, result: a * b, isDecimal: false };
  }
  const b = rngInt(rng, 2, 20);
  const result = rngInt(rng, 10, 50);
  return { a: b * result, b, op, result, isDecimal: false };
}

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const { a, b, op, result, isDecimal } = level === 'CM1' ? buildCM1Operation(rng) : buildCM2Operation(rng);
    const distractors = distractorsForResult(rng, result, isDecimal);
    const choices = rngShuffle(rng, [result, ...distractors].map(formatNumber));
    questions.push({
      id: `calcul-${i}-${op}-${a}-${b}`,
      domain: 'calcul',
      prompt: `Combien font ${formatNumber(a)} ${op} ${formatNumber(b)} ?`,
      choices,
      correctIndex: choices.indexOf(formatNumber(result)),
    });
  }
  return questions;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- calcul`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domains/calcul.ts src/domains/calcul.test.ts
git commit -m "feat: add calcul question generator"
```

---

### Task 8: Problemes generator (TDD)

**Files:**
- Create: `src/domains/problemes.ts`
- Test: `src/domains/problemes.test.ts`

**Interfaces:**
- Consumes: same as Task 3, plus `rngInt` from `src/lib/seededRandom.ts`.
- Produces: `generate(level: Level, rng: Rng, count: number): Question[]` with `domain: 'problemes'`, 6 choices per question.

- [ ] **Step 1: Write the failing test**

Create `src/domains/problemes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { generate } from './problemes';

describe('problemes generate', () => {
  it('returns the requested number of questions', () => {
    expect(generate('CM1', createRng(1), 6)).toHaveLength(6);
    expect(generate('CM2', createRng(1), 6)).toHaveLength(6);
  });

  it('tags every question with domain "problemes" and 6 unique choices', () => {
    const questions = generate('CM2', createRng(3), 5);
    questions.forEach((q) => {
      expect(q.domain).toBe('problemes');
      expect(q.choices).toHaveLength(6);
      expect(new Set(q.choices).size).toBe(6);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(6);
    });
  });

  it('is reproducible for the same seed', () => {
    const a = generate('CM2', createRng(17), 6);
    const b = generate('CM2', createRng(17), 6);
    expect(a).toEqual(b);
  });

  it('ends every prompt with a question mark', () => {
    const questions = generate('CM1', createRng(4), 6);
    questions.forEach((q) => expect(q.prompt.trim().endsWith('?')).toBe(true));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- problemes`
Expected: FAIL — `src/domains/problemes.ts` does not exist yet.

- [ ] **Step 3: Implement `src/domains/problemes.ts`**

```ts
import type { Level, Question } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngInt, rngShuffle } from '../lib/seededRandom';

interface ProblemResult {
  prompt: string;
  correct: number;
}

function sumOfThreeTemplate(rng: Rng): ProblemResult {
  const morning = rngInt(rng, 150, 350);
  const noon = rngInt(rng, 150, 350);
  const evening = rngInt(rng, 150, 350);
  return {
    prompt: `Mon chien mange ${morning} g de croquettes le matin, ${noon} g le midi et ${evening} g le soir. Quelle quantité de croquettes mange-t-il par jour ?`,
    correct: morning + noon + evening,
  };
}

function remainderTemplate(rng: Rng): ProblemResult {
  const total = rngInt(rng, 70, 120);
  const categoryA = rngInt(rng, 20, Math.floor(total / 3));
  const categoryB = rngInt(rng, 20, Math.floor(total / 3));
  return {
    prompt: `À la bibliothèque, il y a ${total} livres. Il y a ${categoryA} documentaires et ${categoryB} bandes dessinées. Les autres livres sont des romans. Combien de romans y a-t-il ?`,
    correct: total - categoryA - categoryB,
  };
}

function multiStepTemplate(rng: Rng): ProblemResult {
  const price = rngInt(rng, 3, 15);
  const quantity = rngInt(rng, 2, 6);
  const discount = rngInt(rng, 2, Math.max(2, price * quantity - 1));
  return {
    prompt: `Léa achète ${quantity} carnets à ${price} € chacun. Elle a une réduction de ${discount} €. Combien paie-t-elle en tout ?`,
    correct: price * quantity - discount,
  };
}

function proportionnaliteTemplate(rng: Rng): ProblemResult {
  const unitPrice = rngInt(rng, 2, 6);
  const baseQuantity = rngInt(rng, 2, 5);
  const targetQuantity = baseQuantity * rngInt(rng, 2, 3);
  const basePrice = unitPrice * baseQuantity;
  return {
    prompt: `${baseQuantity} stylos coûtent ${basePrice} €. Combien coûtent ${targetQuantity} stylos, au même prix chacun ?`,
    correct: unitPrice * targetQuantity,
  };
}

const CM1_TEMPLATES = [sumOfThreeTemplate, remainderTemplate];
const CM2_TEMPLATES = [sumOfThreeTemplate, remainderTemplate, multiStepTemplate, proportionnaliteTemplate];

function distractorsAround(rng: Rng, correct: number, spread: number, howMany: number): number[] {
  const candidates = new Set<number>();
  let attempts = 0;
  while (candidates.size < howMany && attempts < 200) {
    attempts += 1;
    const offset = rngInt(rng, 1, spread) * (rngInt(rng, 0, 1) === 0 ? 1 : -1);
    const candidate = correct + offset;
    if (candidate > 0 && candidate !== correct) {
      candidates.add(candidate);
    }
  }
  let fallback = correct + 1;
  while (candidates.size < howMany) {
    if (fallback !== correct) candidates.add(fallback);
    fallback += 1;
  }
  return Array.from(candidates);
}

export function generate(level: Level, rng: Rng, count: number): Question[] {
  const templates = level === 'CM1' ? CM1_TEMPLATES : CM2_TEMPLATES;
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const template = rngShuffle(rng, templates)[0];
    const { prompt, correct } = template(rng);
    const spread = Math.max(10, Math.round(correct * 0.2));
    const distractors = distractorsAround(rng, correct, spread, 5);
    const choices = rngShuffle(rng, [correct, ...distractors]).map(String);
    questions.push({
      id: `problemes-${i}-${correct}`,
      domain: 'problemes',
      prompt,
      choices,
      correctIndex: choices.indexOf(String(correct)),
    });
  }
  return questions;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- problemes`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domains/problemes.ts src/domains/problemes.test.ts
git commit -m "feat: add problemes question generator"
```

---

### Task 9: Session builder (TDD)

**Files:**
- Create: `src/lib/sessionBuilder.ts`
- Test: `src/lib/sessionBuilder.test.ts`

**Interfaces:**
- Consumes: `generate` from each of the 6 domain modules created in Tasks 3-8; `Domain`, `Level`, `Question` from `src/types.ts`; `createRng`, `Rng`, `rngShuffle` from `src/lib/seededRandom.ts`.
- Produces: `buildSession(subjects: Domain[], level: Level, seed: number, count?: number): Question[]` (default `count = 8`), used by `App.tsx` in Task 13.

- [ ] **Step 1: Write the failing test**

Create `src/lib/sessionBuilder.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSession } from './sessionBuilder';
import { ALL_DOMAINS } from '../types';

describe('buildSession', () => {
  it('returns exactly `count` questions', () => {
    const session = buildSession(['calcul', 'numeration'], 'CM1', 1, 8);
    expect(session).toHaveLength(8);
  });

  it('defaults to 8 questions when count is omitted', () => {
    const session = buildSession(['calcul'], 'CM1', 1);
    expect(session).toHaveLength(8);
  });

  it('only includes questions from the requested subjects', () => {
    const session = buildSession(['numeration', 'calcul'], 'CM2', 5, 8);
    session.forEach((q) => expect(['numeration', 'calcul']).toContain(q.domain));
  });

  it('is reproducible for the same seed, subjects and level', () => {
    const a = buildSession(ALL_DOMAINS, 'CM1', 2024, 12);
    const b = buildSession(ALL_DOMAINS, 'CM1', 2024, 12);
    expect(a).toEqual(b);
  });

  it('produces a different session for a different seed', () => {
    const a = buildSession(ALL_DOMAINS, 'CM1', 1, 12);
    const b = buildSession(ALL_DOMAINS, 'CM1', 2, 12);
    expect(a).not.toEqual(b);
  });

  it('throws when no subject is selected', () => {
    expect(() => buildSession([], 'CM1', 1, 8)).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- sessionBuilder`
Expected: FAIL — `src/lib/sessionBuilder.ts` does not exist yet.

- [ ] **Step 3: Implement `src/lib/sessionBuilder.ts`**

```ts
import type { Domain, Level, Question } from '../types';
import { createRng, rngShuffle, type Rng } from './seededRandom';
import * as conjugaison from '../domains/conjugaison';
import * as accords from '../domains/accords';
import * as orthographe from '../domains/orthographe';
import * as numeration from '../domains/numeration';
import * as calcul from '../domains/calcul';
import * as problemes from '../domains/problemes';

type Generator = (level: Level, rng: Rng, count: number) => Question[];

const GENERATORS: Record<Domain, Generator> = {
  conjugaison: conjugaison.generate,
  accords: accords.generate,
  orthographe: orthographe.generate,
  numeration: numeration.generate,
  calcul: calcul.generate,
  problemes: problemes.generate,
};

export function buildSession(subjects: Domain[], level: Level, seed: number, count = 8): Question[] {
  if (subjects.length === 0) {
    throw new Error('Au moins une matière doit être sélectionnée.');
  }
  const rng = createRng(seed);
  const perSubject = Math.floor(count / subjects.length);
  const remainder = count - perSubject * subjects.length;

  const all: Question[] = [];
  subjects.forEach((subject, index) => {
    const subjectCount = perSubject + (index < remainder ? 1 : 0);
    if (subjectCount > 0) {
      all.push(...GENERATORS[subject](level, rng, subjectCount));
    }
  });

  return rngShuffle(rng, all);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- sessionBuilder`
Expected: PASS.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS, all test files (Tasks 2-9) green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sessionBuilder.ts src/lib/sessionBuilder.test.ts
git commit -m "feat: add session builder combining all domain generators"
```

---

### Task 10: HomeScreen component

**Files:**
- Create: `src/components/HomeScreen.tsx`

**Interfaces:**
- Consumes: `Domain`, `Level`, `ALL_DOMAINS`, `DOMAIN_LABELS` from `src/types.ts`.
- Produces: `HomeScreen({ onStart }: { onStart: (name: string, subjects: Domain[], level: Level) => void })`, used by `App.tsx` in Task 13.

- [ ] **Step 1: Implement `src/components/HomeScreen.tsx`**

```tsx
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
```

- [ ] **Step 2: Manual verification**

Temporarily render `<HomeScreen onStart={(name, subjects, level) => console.log(name, subjects, level)} />` from `src/App.tsx`, run `npm run dev`, open the page, and check:
- Typing a name enables the "Commencer" button only once at least one subject stays checked (deselect all subjects and confirm the button disables).
- Clicking a subject or level button toggles its highlighted style.
- Clicking "Commencer" logs the expected name/subjects/level to the browser console.

This wiring is temporary — Task 13 replaces it with the real `App.tsx` flow.

- [ ] **Step 3: Commit**

```bash
git add src/components/HomeScreen.tsx
git commit -m "feat: add HomeScreen component (name, level, subject selection)"
```

---

### Task 11: ProgressBar and QuestionScreen components

**Files:**
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/QuestionScreen.tsx`

**Interfaces:**
- Consumes: `Question` from `src/types.ts`.
- Produces: `ProgressBar({ current, total }: { current: number; total: number })`; `QuestionScreen({ question, questionNumber, totalQuestions, onAnswer, onQuit }: { question: Question; questionNumber: number; totalQuestions: number; onAnswer: (correct: boolean) => void; onQuit: () => void })`, both used by `App.tsx` in Task 13.

- [ ] **Step 1: Implement `src/components/ProgressBar.tsx`**

```tsx
interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <p className="text-center text-slate-500 mb-1">
        Question {current} sur {total}
      </p>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/components/QuestionScreen.tsx`**

```tsx
import { useState } from 'react';
import type { Question } from '../types';
import { ProgressBar } from './ProgressBar';

interface QuestionScreenProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (correct: boolean) => void;
  onQuit: () => void;
}

const ENCOURAGEMENTS = ['Bravo !', 'Super !', 'Bien joué !', 'Génial !', 'Continue comme ça !'];

function renderPrompt(prompt: string) {
  const parts = prompt.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="underline decoration-emerald-400 decoration-4">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export function QuestionScreen({ question, questionNumber, totalQuestions, onAnswer, onQuit }: QuestionScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);
  // Deterministic rotation (no Math.random outside seededRandom.ts): varies
  // across the session without needing a seed for pure UI flavor text.
  const encouragement = ENCOURAGEMENTS[(questionNumber - 1) % ENCOURAGEMENTS.length];

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
  };

  const handleContinue = () => {
    if (selected === null) return;
    onAnswer(selected === question.correctIndex);
    setSelected(null);
  };

  const answered = selected !== null;
  const isCorrect = answered && selected === question.correctIndex;

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-sky-50 px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onQuit}
          className="shrink-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-500"
        >
          Quitter
        </button>
        <div className="flex-1">
          <ProgressBar current={questionNumber} total={totalQuestions} />
        </div>
      </div>

      <p className="text-2xl text-center text-slate-700 leading-relaxed">{renderPrompt(question.prompt)}</p>

      <div className="flex flex-col gap-3">
        {question.choices.map((choice, index) => {
          const isSelected = selected === index;
          const showCorrect = answered && index === question.correctIndex;
          const showWrongSelected = answered && isSelected && !isCorrect;
          return (
            <button
              key={choice + index}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(index)}
              className={`rounded-xl border-2 px-4 py-4 text-xl text-left transition-colors ${
                showCorrect
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                  : showWrongSelected
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : isSelected
                      ? 'bg-sky-100 border-sky-400'
                      : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xl font-semibold text-slate-600">
            {isCorrect ? encouragement : 'La bonne réponse est surlignée.'}
          </p>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl bg-orange-400 text-white text-xl font-bold py-4"
          >
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Temporarily render `<QuestionScreen question={sampleQuestion} questionNumber={1} totalQuestions={8} onAnswer={(c) => console.log('correct?', c)} onQuit={() => console.log('quit')} />` from `src/App.tsx` (build `sampleQuestion` from `buildSession(['calcul'], 'CM1', 1, 1)[0]`), run `npm run dev`, and check:
- The progress bar shows "Question 1 sur 8" and fills to 12%.
- Clicking a choice highlights it, then shows either the encouragement message (correct) or the correct choice highlighted in a calm color (incorrect) — never red or a cross icon.
- The "Continuer" button appears only after answering, and calls `onAnswer` with the right boolean (check the console log).
- The "Quitter" button is visible immediately (no need to answer first) and calls `onQuit` with no confirmation dialog.
- All 4 choice buttons remain clickable/tappable at a comfortable size when the browser is resized to ~768px width (tablet).

- [ ] **Step 4: Commit**

```bash
git add src/components/ProgressBar.tsx src/components/QuestionScreen.tsx
git commit -m "feat: add ProgressBar and QuestionScreen components"
```

---

### Task 12: RecapScreen component

**Files:**
- Create: `src/components/RecapScreen.tsx`

**Interfaces:**
- Consumes: nothing beyond primitive props.
- Produces: `RecapScreen({ score, total, totalStars, onRestart, onFinish }: { score: number; total: number; totalStars: number; onRestart: () => void; onFinish: () => void })`, used by `App.tsx` in Task 13.

- [ ] **Step 1: Implement `src/components/RecapScreen.tsx`**

```tsx
interface RecapScreenProps {
  score: number;
  total: number;
  totalStars: number;
  onRestart: () => void;
  onFinish: () => void;
}

export function RecapScreen({ score, total, totalStars, onRestart, onFinish }: RecapScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-sky-50 px-4 py-8">
      <h2 className="text-3xl font-bold text-slate-700">Session terminée !</h2>
      <p className="text-2xl text-slate-600">
        Score : {score} / {total}
      </p>

      <div className="flex flex-col items-center gap-2">
        <p className="text-lg text-slate-500">Étoiles gagnées en tout</p>
        <div className="flex flex-wrap justify-center gap-1 max-w-xs">
          {Array.from({ length: totalStars }).map((_, index) => (
            <span key={index} className="text-2xl">
              ⭐
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={onRestart}
          className="w-full rounded-xl bg-emerald-400 text-white text-xl font-bold py-4"
        >
          Recommencer
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="w-full rounded-xl bg-white border-2 border-slate-200 text-slate-600 text-xl font-bold py-4"
        >
          Terminer
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Temporarily render `<RecapScreen score={6} total={8} totalStars={14} onRestart={() => console.log('restart')} onFinish={() => console.log('finish')} />` from `src/App.tsx`, run `npm run dev`, and check the score, star count, and button clicks log as expected.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecapScreen.tsx
git commit -m "feat: add RecapScreen component"
```

---

### Task 13: Wire the full session flow in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `buildSession` from `src/lib/sessionBuilder.ts`; `HomeScreen` (Task 10), `QuestionScreen` (Task 11), `RecapScreen` (Task 12); `Domain`, `Level`, `Question` from `src/types.ts`.
- Produces: the final `App` component rendered by `src/main.tsx` (Task 1) — no further consumers in this phase.

- [ ] **Step 1: Replace `src/App.tsx` with the full flow**

```tsx
import { useState } from 'react';
import type { Domain, Level, Question } from './types';
import { buildSession } from './lib/sessionBuilder';
import { HomeScreen } from './components/HomeScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { RecapScreen } from './components/RecapScreen';

type Screen = 'home' | 'question' | 'recap';

const STARS_KEY = 'exercices-cm1-cm2:stars';

function loadStars(): number {
  const raw = localStorage.getItem(STARS_KEY);
  return raw ? Number(raw) : 0;
}

function saveStars(value: number) {
  localStorage.setItem(STARS_KEY, String(value));
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [config, setConfig] = useState<{ name: string; subjects: Domain[]; level: Level } | null>(null);
  const [totalStars, setTotalStars] = useState(loadStars);

  const startSession = (name: string, subjects: Domain[], level: Level) => {
    const seed = Date.now();
    const questions = buildSession(subjects, level, seed, 8);
    setConfig({ name, subjects, level });
    setSession(questions);
    setIndex(0);
    setScore(0);
    setScreen('question');
  };

  const handleAnswer = (correct: boolean) => {
    const nextScore = correct ? score + 1 : score;
    setScore(nextScore);
    if (correct) {
      const nextStars = totalStars + 1;
      setTotalStars(nextStars);
      saveStars(nextStars);
    }
    if (index + 1 < session.length) {
      setIndex(index + 1);
    } else {
      setScreen('recap');
    }
  };

  const restart = () => {
    if (!config) {
      setScreen('home');
      return;
    }
    startSession(config.name, config.subjects, config.level);
  };

  const finish = () => {
    setScreen('home');
  };

  const quit = () => {
    setScreen('home');
  };

  if (screen === 'home') {
    return <HomeScreen onStart={startSession} />;
  }

  if (screen === 'question') {
    const question = session[index];
    return (
      <QuestionScreen
        question={question}
        questionNumber={index + 1}
        totalQuestions={session.length}
        onAnswer={handleAnswer}
        onQuit={quit}
      />
    );
  }

  return (
    <RecapScreen score={score} total={session.length} totalStars={totalStars} onRestart={restart} onFinish={finish} />
  );
}
```

- [ ] **Step 2: Manual verification of the full flow**

Run `npm run dev`, open the app, and check:
- Home screen loads with all 6 subjects pre-selected and CM1 selected by default.
- Entering a name and clicking "Commencer" moves to the question screen with "Question 1 sur 8".
- Answering all 8 questions moves to the recap screen with the correct score out of 8.
- Clicking "Recommencer" starts a fresh 8-question session (different questions, since the seed is `Date.now()`).
- Clicking "Terminer" returns to the home screen.
- Mid-session, clicking "Quitter" immediately returns to the home screen without any confirmation prompt, and starting a new session afterwards works normally.
- Reloading the page after answering a few correct questions shows the star count persisted (check `localStorage.getItem('exercices-cm1-cm2:stars')` in the browser devtools console).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire home, question and recap screens into the full session flow"
```

---

### Task 14: Final QA pass and README

**Files:**
- Create: `README.md`

**Interfaces:**
- None — this task only verifies and documents the work of Tasks 1-13.

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: PASS — every test file from Tasks 2-9 green, no failures.

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: exits 0, produces a `dist/` folder with no TypeScript or bundling errors.

- [ ] **Step 3: Manual QA — one full session per domain, both levels**

With `npm run dev` running, for each of the 6 subjects individually (deselect the others on the home screen) and each level (CM1, then CM2), start a session and answer all 8 questions. Confirm for each:
- Every prompt is grammatically sound French and matches the subject (e.g. selecting only "Numération" never shows a conjugaison question).
- No layout overflow or unreadable text at a tablet width (~768-1024px) — resize the browser window or use the browser devtools' device toolbar to check.
- The feedback color scheme stays calm (green for correct, amber for incorrect) with no red/cross anywhere.

- [ ] **Step 4: Create `README.md`**

```markdown
# Exercices CM1-CM2

Application d'entraînement (PWA, Phase 1) pour élèves de CM1/CM2 : conjugaison,
accords, orthographe/vocabulaire, numération, calcul, problèmes — alignée sur
le programme du cycle 3.

## Démarrer en local

\`\`\`bash
npm install
npm run dev
\`\`\`

Ouvre ensuite l'URL affichée dans le terminal (par défaut http://localhost:5173).

## Tests

\`\`\`bash
npm test
\`\`\`

Les tests couvrent le moteur de génération de questions (`src/lib`,
`src/domains`). Les écrans React se vérifient manuellement via `npm run dev`
(voir `docs/superpowers/specs/2026-09-24-phase1-moteur-exercices-design.md`,
section "Test / validation").

## Build de production

\`\`\`bash
npm run build
\`\`\`

## Statut

Phase 1 uniquement : pas de compte, pas de backend. Les prochaines phases
(comptes enseignant/classes via Supabase, tableau de bord, finitions PWA) sont
décrites dans `docs/superpowers/specs/`.
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and test instructions"
```
