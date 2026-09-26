import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { depositParams } from '../src/lib/cloud';
import { PROBLEM_COLUMNS, WORKSHEET_COLUMNS } from '../src/lib/teacherCloud';
import { ALL_ACTIVITIES, ALL_SUBJECTS } from '../src/types';
import type { SessionResult } from '../src/lib/results';

const session: SessionResult = {
  id: '6d355502-2a81-4620-93e9-c3535afe160c',
  pupil: { firstName: 'Léa', lastName: 'Martin' },
  at: '2026-09-26T10:00:00.000Z',
  level: 'CM1',
  trimester: 2,
  subject: 'maths',
  activity: 'questions',
  domains: [{ domain: 'calcul', correct: 3, total: 4 }],
};

describe('l\'application et la base parlent la même langue', () => {
  it('envoie exactement les paramètres de depose_seance, dans le même ordre', () => {
    // Une faute de frappe ici ne se verrait qu'en ligne, par des séances qui
    // n'arrivent jamais : on compare donc au fichier SQL lui-même.
    const sql = readFileSync(join(process.cwd(), 'supabase', '001_classes_eleves_seances.sql'), 'utf8');
    const signature = sql.match(
      /create or replace function public\.depose_seance\(([\s\S]*?)\)\s*returns uuid/
    );
    expect(signature, 'signature de depose_seance introuvable').not.toBeNull();
    const sqlNames = [...signature![1].matchAll(/\b(p_\w+)\s/g)].map((m) => m[1]);
    expect(Object.keys(depositParams(session, 'AAAAAA'))).toEqual(sqlNames);
  });
});

describe('la base accepte toutes les valeurs de l\'application', () => {
  // Le bug que ce test aurait attrapé : la révision ciblée a été ajoutée à
  // l'application, pas à la liste des types de séance acceptés par la base.
  // Chaque séance de révision envoyée à la maîtresse aurait été refusée.
  const sql = readFileSync(join(process.cwd(), 'supabase', '001_classes_eleves_seances.sql'), 'utf8');
  const allowed = (column: string) => {
    const found = [...sql.matchAll(new RegExp(`check \\(${column} in \\(([^)]*)\\)\\)`, 'g'))].map((m) =>
      [...m[1].matchAll(/'([^']*)'/g)].map((v) => v[1]).sort()
    );
    expect(found.length, `aucune contrainte trouvée sur ${column}`).toBeGreaterThan(0);
    return found;
  };

  it('pour les types de séance', () => {
    allowed('activity').forEach((values) => expect(values).toEqual([...ALL_ACTIVITIES].sort()));
  });

  it('pour les matières', () => {
    allowed('subject').forEach((values) => expect(values).toEqual([...ALL_SUBJECTS].sort()));
  });

  it('pour les niveaux', () => {
    allowed('level').forEach((values) => expect(values).toEqual(['CM1', 'CM2']));
  });
});

describe('l\'accès maîtresse lit et écrit des colonnes qui existent', () => {
  it('dans la table des feuilles d\'opérations', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase', '001_classes_eleves_seances.sql'), 'utf8');
    const table = sql.match(/create table if not exists public\.worksheets \(([\s\S]*?)\n\);/);
    expect(table, 'table worksheets introuvable').not.toBeNull();
    const columns = [...table![1].matchAll(/^\s{2}(\w+)\s+\w/gm)].map((m) => m[1]);
    const used = [
      WORKSHEET_COLUMNS.key,
      WORKSHEET_COLUMNS.status,
      WORKSHEET_COLUMNS.correction,
      ...WORKSHEET_COLUMNS.sheet,
    ];
    used.forEach((column) => expect(columns, `colonne ${column}`).toContain(column));
  });
});

describe('les problèmes de la classe parlent la même langue que la base', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase', '002_problemes_de_la_classe.sql'), 'utf8');

  it('pour les colonnes lues et écrites par la maîtresse', () => {
    const table = sql.match(/create table if not exists public\.problemes \(([\s\S]*?)\n\);/);
    expect(table, 'table problemes introuvable').not.toBeNull();
    const columns = [...table![1].matchAll(/^\s{2}(\w+)\s+\w/gm)].map((m) => m[1]);
    [...PROBLEM_COLUMNS, 'class_id'].forEach((column) => expect(columns, `colonne ${column}`).toContain(column));
  });

  it('pour le paramètre de la fonction qu\'appelle la tablette de l\'élève', () => {
    const signature = sql.match(/create or replace function public\.problemes_de_la_classe\(([^)]*)\)/);
    expect(signature?.[1].trim()).toBe('p_join_code text');
    const source = readFileSync(join(process.cwd(), 'src', 'lib', 'cloud.ts'), 'utf8');
    expect(source).toContain("rpc('problemes_de_la_classe', { p_join_code: code })");
  });
});
