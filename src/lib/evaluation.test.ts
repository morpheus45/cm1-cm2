import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, ALL_TRIMESTERS, SUBJECT_DOMAINS, type Level, type Question, type Subject } from '../types';
import {
  analyseEvaluation,
  candidateOperations,
  candidateQuestions,
  choiceAnswer,
  constructionAnswer,
  evaluationResults,
  evaluationTitle,
  expectedLabel,
  freezeItems,
  givenLabel,
  isRightAnswer,
  itemSignature,
  operationAnswer,
  parseItems,
  parseEvaluationSummaries,
  parseOpenEvaluations,
  withDetail,
  type EvaluationItem,
  type TeacherEvaluation,
} from './evaluation';
import type { Construction } from './construction';
import { revisionDomains, type SessionResult } from './results';

const question = (id: string, domain: Question['domain'], correctIndex = 1): EvaluationItem => ({
  kind: 'question',
  question: { id, domain, prompt: `Question ${id}`, choices: ['a', 'b', 'c'], correctIndex },
});

const construction: Construction = {
  grid: { origin: [10, 10], cols: 4, rows: 4, cell: 20 },
  target: 'noeud',
  count: 1,
  rule: { kind: 'points', expected: [[2, 3]] },
  solution: [],
};

const building: EvaluationItem = {
  kind: 'question',
  question: {
    id: 'g',
    domain: 'geometrie',
    prompt: 'Place le point',
    figure: { width: 100, height: 100, shapes: [], alt: 'Un quadrillage.' },
    choices: [],
    correctIndex: -1,
    construction,
  },
};

const operation: EvaluationItem = { kind: 'operation', operation: { id: 'op', statement: '12 + 30', expected: '42' } };

describe('la correction d\'une copie', () => {
  it('est celle de la base : le bon choix, le bon résultat, le verdict de la construction', () => {
    expect(isRightAnswer(question('q', 'calcul'), choiceAnswer(1))).toBe(true);
    expect(isRightAnswer(question('q', 'calcul'), choiceAnswer(0))).toBe(false);
    expect(isRightAnswer(question('q', 'calcul'), { given: '1' })).toBe(true);
    expect(isRightAnswer(question('q', 'calcul'), undefined)).toBe(false);
    expect(isRightAnswer(operation, operationAnswer('42,0', []))).toBe(true);
    expect(isRightAnswer(operation, operationAnswer('41', []))).toBe(false);
    expect(isRightAnswer(operation, operationAnswer('quarante-deux', []))).toBe(false);
    expect(isRightAnswer(building, constructionAnswer(construction, [[2, 3]]))).toBe(true);
    expect(isRightAnswer(building, constructionAnswer(construction, [[3, 2]]))).toBe(false);
  });

  it('se résume notion par notion, dans l\'ordre des questions', () => {
    const items = [question('1', 'numeration'), question('2', 'calcul'), building, operation];
    const answers = [choiceAnswer(1), choiceAnswer(2), constructionAnswer(construction, [[2, 3]]), operationAnswer('42', [])];
    expect(evaluationResults(items, answers)).toEqual([
      { domain: 'numeration', correct: 1, total: 1 },
      { domain: 'calcul', correct: 1, total: 2 },
      { domain: 'geometrie', correct: 1, total: 1 },
    ]);
  });
});

describe('les questions reçues', () => {
  it('se relisent quand elles sont bien formées', () => {
    const items = [question('1', 'calcul'), building, operation];
    expect(parseItems(JSON.parse(JSON.stringify(items)), 'maths')).toEqual(items);
  });

  it('sont refusées en bloc à la moindre question illisible', () => {
    expect(parseItems([question('1', 'conjugaison')], 'maths')).toBeNull();
    expect(parseItems([operation], 'francais')).toBeNull();
    expect(parseItems([question('1', 'calcul', 3)], 'maths')).toBeNull();
    expect(parseItems([{ ...building, question: { ...(building as { question: Question }).question, figure: undefined } }], 'maths')).toBeNull();
    expect(parseItems([question('1', 'calcul'), { kind: 'dessin' }], 'maths')).toBeNull();
    expect(parseItems(Array.from({ length: 41 }, (_, index) => question(String(index), 'calcul')), 'maths')).toBeNull();
    expect(parseItems([], 'maths')).toBeNull();
    expect(parseItems('[]', 'maths')).toBeNull();
  });

  it('comprennent toutes celles que l\'application sait poser, figures et constructions comprises', () => {
    const levels: Level[] = ['CM1', 'CM2'];
    Object.entries(SUBJECT_DOMAINS).forEach(([subject, domains]) =>
      domains.forEach((domain) =>
        levels.forEach((level) =>
          ALL_TRIMESTERS.forEach((trimester) => {
            const items = freezeItems(
              candidateQuestions(domain, level, trimester, 101 * trimester, 8).map((entry) => ({ kind: 'question' as const, question: entry }))
            );
            const received = parseItems(JSON.parse(JSON.stringify(items)), subject as Subject);
            expect(received, `${domain} ${level} T${trimester}`).toEqual(items);
          })
        )
      )
    );
    const operations = candidateOperations('CM2', 3, 7, 6).map((entry) => ({ kind: 'operation' as const, operation: entry }));
    expect(parseItems(JSON.parse(JSON.stringify(freezeItems(operations))), 'maths')).toHaveLength(6);
  });
});

describe('préparer une évaluation', () => {
  it('propose un titre accroché au calendrier', () => {
    expect(evaluationTitle('maths', 1)).toBe('Maths — fin de la période 1');
    expect(evaluationTitle('histoire', null)).toBe('Évaluation d\'histoire');
  });

  it('range les questions dans l\'ordre de la matière, les opérations posées à la fin', () => {
    const frozen = freezeItems([operation, question('x', 'geometrie'), question('y', 'numeration'), question('z', 'calcul')]);
    expect(frozen.map((item) => (item.kind === 'operation' ? `op:${item.operation.id}` : `${item.question.domain}:${item.question.id}`))).toEqual([
      'numeration:q1',
      'calcul:q2',
      'geometrie:q3',
      'op:op1',
    ]);
  });

  it('reconnaît une même question tirée deux fois, même avec les choix mélangés', () => {
    const a = question('1', 'calcul');
    const b: EvaluationItem = {
      kind: 'question',
      question: { id: '2', domain: 'calcul', prompt: 'Question 1', choices: ['c', 'b', 'a'], correctIndex: 1 },
    };
    expect(itemSignature(a)).toBe(itemSignature(b));
    expect(itemSignature(a)).not.toBe(itemSignature(question('3', 'calcul', 2)));
  });
});

describe('ce que reçoit la tablette', () => {
  const row = {
    id: 'e1',
    title: 'Maths — fin de la période 1',
    subject: 'maths',
    level: 'CM1',
    trimester: 1,
    question_count: 1,
    version: 'v1',
    opened_at: '2026-10-12T08:00:00Z',
    rendues: ['c1', 3],
  };

  it('écarte une évaluation illisible, et garde les copies que la base connaît', () => {
    const parsed = parseOpenEvaluations([row, { ...row, id: 'e2', question_count: 0 }, { ...row, level: 'CP' }, null]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ questionCount: 1, version: 'v1', items: null, returnedCopyIds: ['c1'] });
    expect(parseOpenEvaluations('rien')).toEqual([]);
  });

  it('accepte une évaluation de chacun des huit niveaux', () => {
    const parsed = parseOpenEvaluations(ALL_LEVELS.map((level) => ({ ...row, id: `e-${level}`, level })));
    expect(parsed.map((entry) => entry.level)).toEqual(ALL_LEVELS);
  });

  it('associe les questions reçues, si elles sont de la même version et lisibles', () => {
    const items = [question('1', 'calcul')];
    expect(parseOpenEvaluations([row], { e1: { version: 'v1', items } })[0].items).toEqual(items);
    expect(parseOpenEvaluations([row], { e1: { version: 'v0', items } })[0].items).toBeNull();
    expect(parseOpenEvaluations([row], { e1: { version: 'v1', items: [question('1', 'accords')] } })[0].items).toBeNull();
    expect(parseOpenEvaluations([row], { e1: { version: 'v1', items: [...items, ...items] } })[0].items).toBeNull();
  });
});

describe('les résultats, pour la maîtresse', () => {
  const items = [question('1', 'numeration'), question('2', 'numeration'), question('3', 'calcul'), question('4', 'calcul'), operation];
  const copy = (id: string, firstName: string, correct: boolean[]) => ({
    id,
    first_name: firstName,
    last_name: 'M',
    at: '2026-10-15T09:00:00Z',
    answers: correct.map((ok) => ({ given: ok ? 1 : 0, correct: ok })),
    results: [
      { domain: 'numeration', correct: correct.slice(0, 2).filter(Boolean).length, total: 2 },
      { domain: 'calcul', correct: correct.slice(2).filter(Boolean).length, total: 3 },
    ],
  });
  const row = {
    id: 'e1',
    title: 'Maths — fin de la période 1',
    subject: 'maths',
    period: 1,
    trimester: 1,
    status: 'terminee',
    created_at: '2026-10-10T08:00:00Z',
    opened_at: '2026-10-15T08:00:00Z',
    closed_at: '2026-10-15T10:00:00Z',
    question_count: 5,
    copy_count: 4,
  };
  const [summary] = parseEvaluationSummaries([
    row,
    { id: 'e2', title: 'Sans matière', status: 'terminee', created_at: '2026-10-10T08:00:00Z', question_count: 5 },
  ]);
  const evaluation = withDetail(summary, items, [
    copy('c1', 'Léa', [true, true, true, true, true]),
    copy('c2', 'Tom', [false, false, true, false, true]),
    copy('c3', 'Zoé', [true, false, true, true, false]),
    { id: 'illisible' },
  ]) as TeacherEvaluation;

  it('relit la liste, puis les copies, en écartant ce qui est mal formé', () => {
    expect(parseEvaluationSummaries([row, { ...row, status: 'perdue' }, { id: 'x' }, null])).toHaveLength(1);
    expect(summary).toMatchObject({ period: 1, questionCount: 5, copyCount: 4, status: 'terminee' });
    expect(evaluation.copies.map((entry) => entry.pupil.firstName)).toEqual(['Léa', 'Tom', 'Zoé']);
    expect(evaluation.copyCount).toBe(3);
    expect(withDetail(summary, [question('1', 'accords')], [])).toBeNull();
  });

  it('donne le niveau de chaque élève, notion par notion, et ses lacunes', () => {
    const analysis = analyseEvaluation(evaluation, [
      { firstName: 'Léa', lastName: 'M' },
      { firstName: 'Tom', lastName: 'M' },
      { firstName: 'Zoé', lastName: 'M' },
      { firstName: 'Noé', lastName: 'P' },
    ]);
    const tom = analysis.pupils.find((entry) => entry.pupil.firstName === 'Tom')!;
    expect(tom.domains.map((entry) => [entry.domain, entry.mastery])).toEqual([
      ['numeration', 1],
      ['calcul', 3],
    ]);
    expect(tom.lacunes).toEqual(['numeration']);
    const zoe = analysis.pupils.find((entry) => entry.pupil.firstName === 'Zoé')!;
    expect(zoe.fragilites).toEqual(['numeration']);
    expect(analysis.groups).toEqual([
      { domain: 'numeration', lacunes: [tom.pupil], fragilites: [zoe.pupil] },
      { domain: 'calcul', lacunes: [], fragilites: [] },
    ]);
    expect(analysis.missing).toEqual([{ firstName: 'Noé', lastName: 'P' }]);
    expect(analysis.questions.map((entry) => entry.success)).toEqual([2, 1, 3, 2, 2]);
  });

  it('écrit les réponses de l\'élève et les bonnes réponses', () => {
    expect(givenLabel(items[0], 2)).toBe('c');
    expect(givenLabel(items[0], null)).toBe('pas de réponse');
    expect(givenLabel(operation, '41')).toBe('41');
    expect(givenLabel(building, [[1, 1]])).toBe('1 point posé');
    expect(expectedLabel(items[0])).toBe('b');
    expect(expectedLabel(operation)).toBe('42');
  });
});

describe('la révision ciblée, après une évaluation', () => {
  const pupil = { firstName: 'Léa', lastName: 'M' };
  const session = (at: string, activity: SessionResult['activity'], domains: SessionResult['domains']): SessionResult => ({
    id: at,
    pupil,
    at,
    level: 'CM1',
    trimester: 1,
    subject: 'maths',
    activity,
    domains,
  });

  it('fait toute la matière à un élève qui n\'a encore rien fait', () => {
    expect(revisionDomains([], 'maths', 2)).toEqual(SUBJECT_DOMAINS.maths);
  });

  it('reprend d\'abord les lacunes, puis les fragilités de l\'évaluation', () => {
    const own = [
      session('2026-10-01T09:00:00Z', 'questions', [{ domain: 'problemes', correct: 0, total: 10 }]),
      session('2026-10-15T09:00:00Z', 'evaluation', [
        { domain: 'numeration', correct: 4, total: 4 },
        { domain: 'calcul', correct: 2, total: 4 },
        { domain: 'geometrie', correct: 0, total: 4 },
      ]),
    ];
    expect(revisionDomains(own, 'maths', 2)).toEqual(['geometrie', 'calcul']);
    expect(revisionDomains(own, 'maths', 3)).toEqual(['geometrie', 'calcul', 'problemes']);
  });

  it('laisse une notion retravaillée et réussie depuis', () => {
    const own = [
      session('2026-10-15T09:00:00Z', 'evaluation', [
        { domain: 'calcul', correct: 1, total: 4 },
        { domain: 'geometrie', correct: 2, total: 4 },
      ]),
      session('2026-10-20T09:00:00Z', 'revision', [{ domain: 'calcul', correct: 9, total: 10 }]),
    ];
    expect(revisionDomains(own, 'maths', 1)).toEqual(['geometrie']);
  });

  it('sans évaluation dans la matière, reprend les notions les plus fragiles', () => {
    const own = [
      session('2026-10-15T09:00:00Z', 'questions', [
        { domain: 'calcul', correct: 9, total: 10 },
        { domain: 'numeration', correct: 2, total: 10 },
      ]),
    ];
    expect(revisionDomains(own, 'maths', 1)).toEqual(['numeration']);
  });
});
