import { beforeEach, describe, expect, it } from 'vitest';
import type { OpenEvaluation } from './evaluation';
import {
  afterRefresh,
  askedCopyIds,
  copyParams,
  enqueueCopy,
  evaluationState,
  flushCopies,
  isFinalRefusal,
  parseCopyOutbox,
  parseProgress,
  pendingCopyIds,
  withOutcomes,
  withProgress,
  type EvaluationProgress,
} from './pupilEvaluations';

// L'environnement de test n'a pas de navigateur : un stockage en mémoire.
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;

const lea = { firstName: 'Léa', lastName: 'M' };

const evaluation = (returnedCopyIds: string[] = []): OpenEvaluation => ({
  id: 'e1',
  title: 'Maths — fin de la période 1',
  subject: 'maths',
  level: 'CM1',
  trimester: 1,
  questionCount: 2,
  version: 'v1',
  items: [
    { kind: 'question', question: { id: 'q1', domain: 'calcul', prompt: '2 + 2', choices: ['3', '4'], correctIndex: 1 } },
    { kind: 'question', question: { id: 'q2', domain: 'calcul', prompt: '3 + 3', choices: ['6', '7'], correctIndex: 0 } },
  ],
  openedAt: '2026-10-12T08:00:00Z',
  returnedCopyIds,
});

const entry = (change: Partial<EvaluationProgress> = {}): EvaluationProgress => ({
  evaluationId: 'e1',
  joinCode: 'AAAAAA',
  pupil: lea,
  answers: [],
  startedAt: '2026-10-12T08:05:00Z',
  ...change,
});

beforeEach(() => store.clear());

describe('où en est l\'élève', () => {
  it('commence, reprend, puis a rendu sa copie', () => {
    expect(evaluationState(evaluation(), lea, [], [], null)).toEqual({ kind: 'a-faire' });
    expect(evaluationState(evaluation(), lea, [entry({ answers: [{ given: 1 }] })], [], null)).toEqual({
      kind: 'en-cours',
      answered: 1,
    });
    const done = entry({ copyId: 'c1', delivery: 'en-attente' });
    expect(evaluationState(evaluation(), lea, [done], ['c1'], null)).toEqual({ kind: 'rendue' });
    expect(evaluationState(evaluation(['c1']), lea, [done], [], '2026-10-12T09:00:00Z')).toEqual({ kind: 'rendue' });
  });

  it('reconnaît le même élève quelle que soit l\'écriture de son nom', () => {
    const state = evaluationState(evaluation(), { firstName: ' lea ', lastName: 'm' }, [entry({ answers: [{ given: 1 }] })], [], null);
    expect(state.kind).toBe('en-cours');
  });

  it('refait l\'évaluation quand la maîtresse a effacé la copie reçue', () => {
    const delivered = entry({ copyId: 'c1', delivery: 'rendue', deliveredAt: '2026-10-12T09:00:00Z' });
    expect(evaluationState(evaluation(), lea, [delivered], [], '2026-10-12T09:30:00Z')).toEqual({
      kind: 'a-refaire',
      previousCopyId: 'c1',
    });
    // Une liste reçue avant l'envoi ne pouvait pas connaître la copie.
    expect(evaluationState(evaluation(), lea, [delivered], [], '2026-10-12T08:59:00Z')).toEqual({ kind: 'rendue' });
    // Une copie déjà rendue ailleurs, ou refusée, ne se refait pas.
    expect(evaluationState(evaluation(), lea, [entry({ copyId: 'c2', delivery: 'deja-faite' })], [], '2026-10-12T09:30:00Z')).toEqual({
      kind: 'rendue',
    });
  });

  it('oublie ce qui concerne une évaluation fermée, et note les copies reçues', () => {
    const list = [
      entry({ copyId: 'c1', delivery: 'en-attente' }),
      entry({ evaluationId: 'fermee' }),
      entry({ evaluationId: 'autre-classe', joinCode: 'BBBBBB' }),
    ];
    const next = afterRefresh(list, 'AAAAAA', [evaluation(['c1'])], '2026-10-12T10:00:00Z');
    expect(next.map((item) => item.evaluationId)).toEqual(['e1', 'autre-classe']);
    expect(next[0]).toMatchObject({ delivery: 'rendue', deliveredAt: '2026-10-12T10:00:00Z' });
    expect(askedCopyIds(next)).toEqual(['c1']);
  });

  it('remplace l\'avancement d\'un élève sans toucher aux autres', () => {
    const tom = entry({ pupil: { firstName: 'Tom', lastName: 'B' } });
    const list = withProgress([entry(), tom], entry({ answers: [{ given: 0 }] }));
    expect(list).toHaveLength(2);
    expect(list.find((item) => item.pupil.firstName === 'Léa')?.answers).toHaveLength(1);
  });

  it('écarte un avancement mal formé', () => {
    expect(parseProgress([entry(), { evaluationId: 'x' }, null, entry({ answers: [3] as never })])).toHaveLength(1);
    expect(parseProgress('nimporte')).toEqual([]);
  });
});

describe('la copie', () => {
  it('porte exactement ce qu\'attend la base, les traits arrondis', () => {
    const params = copyParams('c1', 'aaa-aaa', 'e1', lea, [
      { given: 1 },
      { given: '42', strokes: [{ points: [[0.123456, 0.9]] }] },
    ]);
    expect(params).toEqual({
      p_copy_id: 'c1',
      p_join_code: 'AAAAAA',
      p_evaluation_id: 'e1',
      p_first_name: 'Léa',
      p_last_name: 'M',
      p_answers: [{ given: 1 }, { given: '42', strokes: [{ points: [[0.1235, 0.9]] }] }],
    });
    expect(parseCopyOutbox([params, { p_copy_id: 3 }])).toEqual([params]);
  });

  it('attend le réseau, et ne sort de la file que reçue ou refusée pour de bon', async () => {
    enqueueCopy(copyParams('recue', 'AAAAAA', 'e1', lea, []));
    enqueueCopy(copyParams('deja', 'AAAAAA', 'e1', lea, []));
    enqueueCopy(copyParams('sans-reseau', 'AAAAAA', 'e1', lea, []));
    enqueueCopy(copyParams('fermee', 'AAAAAA', 'e1', lea, []));
    enqueueCopy(copyParams('base-pas-prete', 'AAAAAA', 'e1', lea, []));
    enqueueCopy(copyParams('recue', 'AAAAAA', 'e1', lea, []));
    const outcomes = await flushCopies(async (params) => {
      if (params.p_copy_id === 'sans-reseau') throw new Error('Failed to fetch');
      if (params.p_copy_id === 'fermee') return { data: null, error: { message: 'évaluation fermée' } };
      if (params.p_copy_id === 'base-pas-prete') {
        return { data: null, error: { message: 'Could not find the function public.rendre_evaluation' } };
      }
      return { data: params.p_copy_id === 'deja' ? 'deja_faite' : 'rendue', error: null };
    });
    expect(outcomes).toEqual({
      deja: 'already',
      'sans-reseau': 'queued',
      fermee: 'rejected',
      'base-pas-prete': 'queued',
      recue: 'sent',
    });
    expect(pendingCopyIds()).toEqual(['sans-reseau', 'base-pas-prete']);
  });

  it('reporte la réponse de la base dans l\'avancement', () => {
    const list = withOutcomes(
      [entry({ copyId: 'c1', delivery: 'en-attente' }), entry({ pupil: { firstName: 'Tom', lastName: '' }, copyId: 'c2' })],
      { c1: 'sent', c2: 'already' },
      '2026-10-12T09:00:00Z'
    );
    expect(list[0]).toMatchObject({ delivery: 'rendue', deliveredAt: '2026-10-12T09:00:00Z' });
    expect(list[1]).toMatchObject({ delivery: 'deja-faite' });
    expect(list[1].deliveredAt).toBeUndefined();
  });

  it('distingue les refus définitifs', () => {
    expect(isFinalRefusal({ message: 'code de classe inconnu' })).toBe(true);
    expect(isFinalRefusal({ message: 'réponses illisibles' })).toBe(true);
    expect(isFinalRefusal({ message: 'Failed to fetch' })).toBe(false);
  });
});
