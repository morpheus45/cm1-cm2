import { describe, expect, it } from 'vitest';
import {
  checkClassQuestionDraft,
  classQuestionToQuestion,
  draftToRow,
  isCustomisableDomain,
  parseClassQuestions,
  pickClassQuestions,
  type ClassQuestion,
  type ClassQuestionDraft,
} from './classQuestions';
import { createRng } from './seededRandom';
import { buildSession } from './sessionBuilder';

const draft = (extra: Partial<ClassQuestionDraft> = {}): ClassQuestionDraft => ({
  domain: 'conjugaison',
  enonce: 'Conjugue « chanter » à la première personne du singulier, au présent.',
  reponse: 'je chante',
  fausses_reponses: ['je chantes', 'je chantais'],
  trimestre: 1,
  ...extra,
});

describe('isCustomisableDomain', () => {
  it('refuse les problèmes de maths, qui ont leur propre écran', () => {
    expect(isCustomisableDomain('problemes')).toBe(false);
    expect(isCustomisableDomain('conjugaison')).toBe(true);
    expect(isCustomisableDomain('geometrie')).toBe(true);
  });
});

describe('checkClassQuestionDraft', () => {
  it('accepte une question bien formée', () => {
    expect(checkClassQuestionDraft(draft())).toEqual({ ok: true, issues: [] });
  });

  it('refuse un énoncé trop court ou trop long', () => {
    expect(checkClassQuestionDraft(draft({ enonce: 'x'.repeat(9) })).ok).toBe(false);
    expect(checkClassQuestionDraft(draft({ enonce: 'x'.repeat(10) })).ok).toBe(true);
    expect(checkClassQuestionDraft(draft({ enonce: 'x'.repeat(601) })).ok).toBe(false);
  });

  it('refuse les problèmes de maths', () => {
    expect(checkClassQuestionDraft(draft({ domain: 'problemes' })).ok).toBe(false);
  });

  it('refuse une bonne réponse vide', () => {
    expect(checkClassQuestionDraft(draft({ reponse: '  ' })).ok).toBe(false);
  });

  it("refuse une question sans aucune mauvaise réponse utilisable", () => {
    expect(checkClassQuestionDraft(draft({ fausses_reponses: [] })).ok).toBe(false);
    expect(checkClassQuestionDraft(draft({ fausses_reponses: ['  ', ''] })).ok).toBe(false);
  });

  it('refuse des mauvaises réponses en double, ou identiques à la bonne', () => {
    expect(checkClassQuestionDraft(draft({ fausses_reponses: ['je chantes', 'je chantes'] })).ok).toBe(false);
    expect(checkClassQuestionDraft(draft({ fausses_reponses: ['je chante'] })).ok).toBe(false);
    expect(checkClassQuestionDraft(draft({ fausses_reponses: ['Je Chante'] })).ok).toBe(false);
  });

  it('refuse un trimestre inconnu', () => {
    expect(checkClassQuestionDraft(draft({ trimestre: 4 })).issues).toContain('Le trimestre doit être 1, 2 ou 3.');
  });
});

describe('draftToRow', () => {
  it('prépare la ligne à enregistrer, nettoyée', () => {
    expect(draftToRow(draft({ enonce: '  Un énoncé bien assez long.  ', fausses_reponses: ['a', ' ', 'b'] }), 'c1')).toEqual({
      class_id: 'c1',
      domain: 'conjugaison',
      enonce: 'Un énoncé bien assez long.',
      reponse: 'je chante',
      fausses_reponses: ['a', 'b'],
      trimestre: 1,
    });
  });

  it('refuse une question mal formée', () => {
    expect(() => draftToRow(draft({ reponse: '' }), 'c1')).toThrow();
  });
});

describe('parseClassQuestions', () => {
  it('garde les lignes lisibles et écarte les autres', () => {
    const rows = [
      { id: 'a', domain: 'orthographe', enonce: 'Un énoncé', reponse: 'un mot', fausses_reponses: ['autre', 3], trimestre: 2 },
      { id: 'b', domain: 'problemes', enonce: 'Un énoncé', reponse: '4', fausses_reponses: ['5'], trimestre: 1 },
      { id: 'c', domain: 'inconnue', enonce: 'Un énoncé', reponse: '4', fausses_reponses: ['5'], trimestre: 1 },
      { id: 'd', domain: 'histoire', enonce: 'Un énoncé', reponse: '4', fausses_reponses: [], trimestre: 1 },
      null,
    ];
    expect(parseClassQuestions(rows)).toEqual([
      { id: 'a', domain: 'orthographe', enonce: 'Un énoncé', reponse: 'un mot', fausses_reponses: ['autre'], trimestre: 2 },
    ]);
    expect(parseClassQuestions('abîmé')).toEqual([]);
  });
});

describe('classQuestionToQuestion', () => {
  it('propose la bonne réponse et les mauvaises, mélangées', () => {
    const question: ClassQuestion = {
      id: 'q1',
      domain: 'orthographe',
      enonce: 'Choisis la bonne orthographe.',
      reponse: 'bonbon',
      fausses_reponses: ['bombon', 'banban'],
      trimestre: 1,
    };
    const built = classQuestionToQuestion(question, createRng(1));
    expect(built.domain).toBe('orthographe');
    expect(built.id).toBe('classe-q1');
    expect(built.choices).toHaveLength(3);
    expect(built.choices[built.correctIndex]).toBe('bonbon');
    expect([...built.choices].sort()).toEqual(['banban', 'bombon', 'bonbon']);
  });
});

describe('les questions de la maîtresse dans une séance', () => {
  const question = (id: string, domain: 'conjugaison' | 'chronologie', trimestre: 1 | 2 | 3): ClassQuestion => ({
    id,
    domain,
    enonce: `Question ${id} de la maîtresse, assez longue pour être un énoncé.`,
    reponse: 'bonne réponse',
    fausses_reponses: ['mauvaise 1', 'mauvaise 2'],
    trimestre,
  });
  const list = [
    question('t1', 'conjugaison', 1),
    question('t2', 'conjugaison', 1),
    question('t3', 'conjugaison', 2),
    question('t4', 'conjugaison', 3),
    question('t5', 'chronologie', 1),
  ];

  it('ne prennent que celles de la notion et du trimestre, ou d\'avant', () => {
    const picked = pickClassQuestions(list, 'conjugaison', 1, createRng(2), 10);
    expect(picked.map((entry) => entry.id)).not.toContain('t4');
    expect(picked.every((entry) => entry.domain === 'conjugaison')).toBe(true);
  });

  it('se mêlent aux questions générées d\'une séance de français', () => {
    const session = buildSession({ domains: ['conjugaison', 'accords'], level: 'CM1', trimester: 2, seed: 42, classQuestions: list });
    const own = session.questions.filter((q) => q.id.startsWith('classe-'));
    expect(own.length).toBeGreaterThan(0);
    expect(own.every((q) => q.domain === 'conjugaison')).toBe(true);
  });

  it('se mêlent aussi aux séances d\'histoire et de géographie', () => {
    const session = buildSession({
      domains: ['chronologie', 'evenements', 'mots-histoire'],
      level: 'CM1',
      trimester: 1,
      seed: 3,
      classQuestions: list,
    });
    expect(session.questions.some((q) => q.id === 'classe-t5')).toBe(true);
  });

  it('n\'entrent jamais dans le domaine des problèmes de maths', () => {
    const session = buildSession({
      domains: ['numeration', 'calcul', 'problemes'],
      level: 'CM1',
      trimester: 3,
      seed: 8,
      classQuestions: [...list, question('t6', 'conjugaison', 1)],
    });
    expect(session.questions.some((q) => q.id.startsWith('classe-'))).toBe(false);
  });

  it('ne changent rien quand la classe n\'en a pas', () => {
    const without = buildSession({ domains: ['conjugaison', 'accords'], level: 'CM1', trimester: 2, seed: 42 });
    const empty = buildSession({ domains: ['conjugaison', 'accords'], level: 'CM1', trimester: 2, seed: 42, classQuestions: [] });
    expect(empty).toEqual(without);
  });
});
