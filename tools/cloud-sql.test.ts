import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { depositParams } from '../src/lib/cloud';
import { EVALUATION_COLUMNS, PROBLEM_COLUMNS, QUESTION_COLUMNS, WORKSHEET_COLUMNS } from '../src/lib/teacherCloud';
import { isCustomisableDomain } from '../src/lib/classQuestions';
import { copyParams } from '../src/lib/pupilEvaluations';
import { ALL_ACTIVITIES, ALL_DOMAINS, ALL_SUBJECTS } from '../src/types';
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
  // Les fichiers s'exécutent dans l'ordre : c'est la dernière contrainte
  // posée sur une colonne qui s'applique.
  const files = readdirSync(join(process.cwd(), 'supabase'))
    .filter((name) => /^0\d+_.*\.sql$/.test(name))
    .sort();
  const sql = files.map((name) => readFileSync(join(process.cwd(), 'supabase', name), 'utf8')).join('\n');
  const allowed = (column: string) => {
    const found = [...sql.matchAll(new RegExp(`check \\(${column} in \\(([^)]*)\\)\\)`, 'g'))].map((m) =>
      [...m[1].matchAll(/'([^']*)'/g)].map((v) => v[1]).sort()
    );
    expect(found.length, `aucune contrainte trouvée sur ${column}`).toBeGreaterThan(0);
    return found.slice(-1);
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

describe('les questions de la classe parlent la même langue que la base', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase', '007_questions_de_la_classe.sql'), 'utf8');

  it('pour les colonnes lues et écrites par la maîtresse', () => {
    const table = sql.match(/create table if not exists public\.questions_classe \(([\s\S]*?)\n\);/);
    expect(table, 'table questions_classe introuvable').not.toBeNull();
    const columns = [...table![1].matchAll(/^\s{2}(\w+)\s+\w/gm)].map((m) => m[1]);
    [...QUESTION_COLUMNS, 'class_id'].forEach((column) => expect(columns, `colonne ${column}`).toContain(column));
  });

  it('accepte exactement les notions ouvertes à la maîtresse, jamais les problèmes de maths', () => {
    const constraint = sql.match(/domain\s+text not null check \(domain in \(([\s\S]*?)\)\)/);
    expect(constraint, 'contrainte sur domain introuvable').not.toBeNull();
    const allowed = [...constraint![1].matchAll(/'([^']*)'/g)].map((m) => m[1]).sort();
    expect(allowed).toEqual([...ALL_DOMAINS].filter(isCustomisableDomain).sort());
  });

  it('pour le paramètre de la fonction qu\'appelle la tablette de l\'élève', () => {
    const signature = sql.match(/create or replace function public\.questions_de_la_classe\(([^)]*)\)/);
    expect(signature?.[1].trim()).toBe('p_join_code text');
    const source = readFileSync(join(process.cwd(), 'src', 'lib', 'cloud.ts'), 'utf8');
    expect(source).toContain("rpc('questions_de_la_classe', { p_join_code: code })");
  });
});

describe('les corrections rendues à l\'élève parlent la même langue que la base', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase', '003_corrections_pour_les_eleves.sql'), 'utf8');
  const source = readFileSync(join(process.cwd(), 'src', 'lib', 'pupilCorrections.ts'), 'utf8');

  it('pour le paramètre de la fonction qu\'appelle la tablette', () => {
    const signature = sql.match(/create or replace function public\.corrections_de_mes_feuilles\(([^)]*)\)/);
    expect(signature?.[1].trim()).toBe('p_session_ids uuid[]');
    expect(source).toContain("rpc('corrections_de_mes_feuilles', { p_session_ids: ids })");
  });

  it('pour les colonnes qu\'elle relit', () => {
    const returned = sql.match(/returns table \(([\s\S]*?)\n\)/);
    expect(returned, 'colonnes rendues introuvables').not.toBeNull();
    const columns = [...returned![1].matchAll(/^\s{2}(\w+)\s+\w/gm)].map((m) => m[1]);
    ['session_id', 'operations', 'answers', 'corrections', 'corrected_at'].forEach((column) => {
      expect(columns, `colonne ${column}`).toContain(column);
      expect(source, `lecture de ${column}`).toContain(`raw.${column}`);
    });
  });
});

describe('les évaluations parlent la même langue que la base', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase', '006_evaluations.sql'), 'utf8');
  const pupilSide = readFileSync(join(process.cwd(), 'src', 'lib', 'pupilEvaluations.ts'), 'utf8');
  const teacherSide = readFileSync(join(process.cwd(), 'src', 'lib', 'teacherCloud.ts'), 'utf8');
  const parser = readFileSync(join(process.cwd(), 'src', 'lib', 'evaluation.ts'), 'utf8');

  it('pour les paramètres de la copie, dans le même ordre', () => {
    const signature = sql.match(/create or replace function public\.rendre_evaluation\(([\s\S]*?)\)\s*returns text/);
    expect(signature, 'signature de rendre_evaluation introuvable').not.toBeNull();
    const sqlNames = [...signature![1].matchAll(/\b(p_\w+)\s/g)].map((m) => m[1]);
    expect(Object.keys(copyParams('c', 'AAAAAA', 'e', { firstName: 'Léa', lastName: '' }, []))).toEqual(sqlNames);
    expect(pupilSide).toContain("rpc('rendre_evaluation', params)");
  });

  it('pour les fonctions qu\'appellent la tablette et la maîtresse', () => {
    expect(sql).toMatch(/function public\.evaluations_ouvertes\(p_join_code text, p_copy_ids uuid\[\] default '\{\}'\)/);
    expect(pupilSide).toContain("rpc('evaluations_ouvertes', { p_join_code: code, p_copy_ids: askedCopyIds() })");
    expect(sql).toMatch(/function public\.questions_de_l_evaluation\(p_join_code text, p_evaluation_id uuid\)/);
    expect(pupilSide).toContain("rpc('questions_de_l_evaluation', { p_join_code: code, p_evaluation_id: evaluation.id })");
    expect(sql).toMatch(/function public\.lire_evaluations\(p_class_id uuid\)/);
    expect(teacherSide).toContain("rpc('lire_evaluations', { p_class_id: classId })");
    expect(sql).toMatch(/function public\.lire_copies\(p_evaluation_id uuid\)/);
    expect(teacherSide).toContain("rpc('lire_copies', { p_evaluation_id: evaluationId })");
    expect(teacherSide).toContain("rpc('lire_copies', { p_evaluation_id: summary.id })");
  });

  it('pour les colonnes écrites par la maîtresse', () => {
    const table = sql.match(/create table if not exists public\.evaluations \(([\s\S]*?)\n\);/);
    expect(table, 'table evaluations introuvable').not.toBeNull();
    const columns = [...table![1].matchAll(/^\s{2}(\w+)\s+\w/gm)].map((m) => m[1]);
    EVALUATION_COLUMNS.forEach((column) => expect(columns, `colonne ${column}`).toContain(column));
    expect(sql).toContain('alter table public.classes add column if not exists zone text');
  });

  it('pour ce que rendent les fonctions, et que relit l\'application', () => {
    const ouvertes = sql.match(/function public\.evaluations_ouvertes\([^)]*\)\s*returns table \(([\s\S]*?)\n\)/);
    expect(ouvertes, 'colonnes de evaluations_ouvertes introuvables').not.toBeNull();
    const columns = [...ouvertes![1].matchAll(/^\s{2}(\w+)\s+\w/gm)].map((m) => m[1]);
    expect(columns).toEqual(['id', 'title', 'subject', 'level', 'trimester', 'question_count', 'version', 'opened_at', 'rendues']);
    columns.forEach((key) => expect(parser, `lecture de ${key}`).toMatch(new RegExp(`row\\.${key}\\b`)));
    ['period', 'status', 'created_at', 'closed_at'].forEach((key) => {
      expect(sql, `clé ${key}`).toContain(`'${key}', e.${key}`);
      expect(parser, `lecture de ${key}`).toMatch(new RegExp(`row\\.${key}\\b`));
    });
    ['question_count', 'copy_count'].forEach((key) => {
      expect(sql, `clé ${key}`).toContain(`'${key}', `);
      expect(parser, `lecture de ${key}`).toMatch(new RegExp(`row\\.${key}\\b`));
    });
    ['first_name', 'last_name', 'answers', 'results', 'at'].forEach((key) => {
      expect(sql, `clé ${key}`).toContain(`'${key}', `);
      expect(parser, `lecture de ${key}`).toMatch(new RegExp(`raw\\.${key}\\b`));
    });
  });
});
