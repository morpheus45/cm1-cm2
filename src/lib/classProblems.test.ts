import { describe, expect, it } from 'vitest';
import {
  checkProposal,
  classProblemToQuestion,
  evaluateCalculation,
  formatFrenchNumber,
  parseClassProblems,
  parseFrenchNumber,
  pickClassProblems,
  proposalToRow,
  type ClassProblem,
  type ProblemProposal,
} from './classProblems';
import { createRng } from './seededRandom';
import { buildSession } from './sessionBuilder';

describe('les nombres à la française', () => {
  it('se lisent avec une virgule, un point ou des espaces', () => {
    expect(parseFrenchNumber('36')).toBe(36);
    expect(parseFrenchNumber('4,5')).toBe(4.5);
    expect(parseFrenchNumber('4.5')).toBe(4.5);
    expect(parseFrenchNumber('1 250')).toBe(1250);
    expect(parseFrenchNumber('1\u202f250,75')).toBe(1250.75);
  });

  it('refusent tout le reste', () => {
    ['', 'douze', '-3', '4,5,6', '12 €', '3/4'].forEach((text) => expect(parseFrenchNumber(text)).toBeNull());
  });

  it('s\'écrivent avec une virgule', () => {
    expect(formatFrenchNumber(1250.5)).toBe('1250,5');
    expect(formatFrenchNumber(57)).toBe('57');
    expect(formatFrenchNumber(0.1 + 0.2)).toBe('0,3');
  });
});

describe('evaluateCalculation', () => {
  it('fait les opérations de l\'école, dans le bon ordre', () => {
    expect(evaluateCalculation('(24 × 3) − 15')).toBe(57);
    expect(evaluateCalculation('2 + 3 × 4')).toBe(14);
    expect(evaluateCalculation('(2 + 3) x 4')).toBe(20);
    expect(evaluateCalculation('7,5 : 3')).toBe(2.5);
    expect(evaluateCalculation('100 ÷ 8')).toBe(12.5);
    expect(evaluateCalculation('12 * 3 - 4 / 2')).toBe(34);
    expect(evaluateCalculation('-3 + 5')).toBe(2);
    expect(evaluateCalculation('0,1 + 0,2')).toBe(0.3);
  });

  it('refuse ce qui n\'est pas un calcul', () => {
    [
      '10 ÷ 0',
      'douze fois trois',
      '(2 + 3',
      '2 + 3)',
      '2 +',
      '',
      '1 250 + 5',
      '2 ^ 3',
      'Math.max(1, 2)',
    ].forEach((expression) => expect(evaluateCalculation(expression), expression).toBeNull());
  });
});

const proposal: ProblemProposal = {
  enonce: 'Léo achète 24 cartes par semaine pendant 3 semaines, puis en donne 15. Combien lui en reste-t-il ?',
  calcul: '(24 × 3) − 15',
  reponse: '57',
  unite: 'cartes',
  fausses_reponses: ['87', '72', '42'],
  trimestre: 2,
};

describe('checkProposal', () => {
  it('accepte un problème dont le calcul donne la réponse', () => {
    const check = checkProposal(proposal);
    expect(check).toMatchObject({ ok: true, computed: 57, issues: [], notes: [] });
    expect(check.distractors).toEqual(['87', '72', '42']);
  });

  it('refuse une réponse que le calcul ne donne pas', () => {
    const check = checkProposal({ ...proposal, reponse: '60' });
    expect(check.ok).toBe(false);
    expect(check.issues).toEqual(['Le calcul donne 57, pas 60.']);
  });

  it('refuse un calcul illisible, une réponse qui n\'est pas un nombre, un trimestre inconnu', () => {
    expect(checkProposal({ ...proposal, calcul: '24 fois 3' }).issues).toContain('Le calcul « 24 fois 3 » ne se lit pas.');
    expect(checkProposal({ ...proposal, reponse: 'cinquante-sept' }).ok).toBe(false);
    expect(checkProposal({ ...proposal, trimestre: 4 }).issues).toContain('Le trimestre doit être 1, 2 ou 3.');
    expect(checkProposal({ ...proposal, reponse: '57,125', calcul: '57,125' }).issues).toContain(
      'La réponse a plus de deux chiffres après la virgule.'
    );
    // Dix caractères au moins, comme dans la base.
    expect(checkProposal({ ...proposal, enonce: 'x'.repeat(10) }).ok).toBe(true);
    expect(checkProposal({ ...proposal, enonce: 'x'.repeat(9) }).ok).toBe(false);
  });

  it('écarte les fausses réponses inutilisables, sans bloquer', () => {
    const check = checkProposal({ ...proposal, fausses_reponses: ['57', '87', '87,0', 'beaucoup'] });
    expect(check.ok).toBe(true);
    expect(check.distractors).toEqual(['87']);
    expect(check.notes).toHaveLength(1);
  });
});

describe('proposalToRow', () => {
  it('prépare la ligne à enregistrer', () => {
    expect(proposalToRow({ ...proposal, reponse: '57.0', unite: '  cartes ' }, 'c1')).toEqual({
      class_id: 'c1',
      enonce: proposal.enonce,
      reponse: '57',
      unite: 'cartes',
      calcul: '(24 × 3) − 15',
      fausses_reponses: ['87', '72', '42'],
      trimestre: 2,
    });
  });

  it('refuse un problème faux', () => {
    expect(() => proposalToRow({ ...proposal, reponse: '60' }, 'c1')).toThrow('Le calcul donne 57, pas 60.');
  });
});

const problem = (id: string, trimestre: 1 | 2 | 3, extra: Partial<ClassProblem> = {}): ClassProblem => ({
  id,
  enonce: `Problème ${id} de la maîtresse, assez long pour être un énoncé.`,
  reponse: '57',
  unite: 'cartes',
  fausses_reponses: ['87', '72', '42'],
  trimestre,
  ...extra,
});

describe('parseClassProblems', () => {
  it('garde les lignes lisibles et écarte les autres', () => {
    const rows = [
      { id: 'a', enonce: 'Un énoncé', reponse: '4,5', unite: 'kg', fausses_reponses: ['5', 3], trimestre: 1 },
      { id: 'b', enonce: 'Un énoncé', reponse: 'x', unite: '', fausses_reponses: [], trimestre: 1 },
      { id: 'c', enonce: 'Un énoncé', reponse: '1', trimestre: 4 },
      null,
    ];
    expect(parseClassProblems(rows)).toEqual([
      { id: 'a', enonce: 'Un énoncé', reponse: '4,5', unite: 'kg', fausses_reponses: ['5'], trimestre: 1 },
    ]);
    expect(parseClassProblems('abîmé')).toEqual([]);
  });
});

describe('classProblemToQuestion', () => {
  it('propose la bonne réponse et les fausses réponses de la maîtresse', () => {
    const question = classProblemToQuestion(problem('p1', 1), createRng(1));
    expect(question.domain).toBe('problemes');
    expect(question.id).toBe('classe-p1');
    expect(question.choices).toHaveLength(4);
    expect(question.choices[question.correctIndex]).toBe('57 cartes');
    expect([...question.choices].sort()).toEqual(['42 cartes', '57 cartes', '72 cartes', '87 cartes']);
  });

  it('complète les fausses réponses qui manquent, sans doublon', () => {
    const question = classProblemToQuestion(problem('p2', 1, { fausses_reponses: ['57', '60'], unite: '' }), createRng(7));
    expect(question.choices).toHaveLength(4);
    expect(new Set(question.choices).size).toBe(4);
    expect(question.choices).toContain('60');
    expect(question.choices[question.correctIndex]).toBe('57');
  });

  it('sait faire avec une réponse à virgule', () => {
    const question = classProblemToQuestion(problem('p3', 1, { reponse: '4,5', unite: 'kg', fausses_reponses: [] }), createRng(3));
    expect(question.choices[question.correctIndex]).toBe('4,5 kg');
    expect(new Set(question.choices).size).toBe(4);
  });
});

describe('les problèmes de la maîtresse dans une séance', () => {
  const list = [problem('t1', 1), problem('t2', 1), problem('t3', 2), problem('t4', 3), problem('t5', 1), problem('t6', 2), problem('t7', 1)];

  it('ne prennent que ceux du trimestre, ou d\'avant', () => {
    const picked = pickClassProblems(list, 1, createRng(2), 10);
    expect(picked.map((entry) => entry.trimestre).every((trimestre) => trimestre === 1)).toBe(true);
    expect(new Set(picked.map((entry) => entry.id)).size).toBe(picked.length);
  });

  it('prennent au plus la moitié du bloc « problèmes », mêlés aux autres', () => {
    const session = buildSession({ domains: ['problemes'], level: 'CM1', trimester: 2, seed: 42, classProblems: list });
    const own = session.questions.filter((question) => question.id.startsWith('classe-'));
    expect(session.questions).toHaveLength(12);
    expect(own).toHaveLength(6);
    expect(own.every((question) => question.domain === 'problemes')).toBe(true);
    expect(own.some((question) => question.id === 'classe-t4')).toBe(false);
  });

  it('ne changent rien quand la classe n\'en a pas', () => {
    const without = buildSession({ domains: ['calcul', 'problemes'], level: 'CM2', trimester: 3, seed: 5 });
    const empty = buildSession({ domains: ['calcul', 'problemes'], level: 'CM2', trimester: 3, seed: 5, classProblems: [] });
    expect(empty).toEqual(without);
  });

  it('n\'entrent jamais dans une séance de français', () => {
    const session = buildSession({ domains: ['conjugaison', 'accords'], level: 'CM1', trimester: 2, seed: 9, classProblems: list });
    expect(session.subject).toBe('francais');
    expect(session.questions.some((question) => question.id.startsWith('classe-'))).toBe(false);
  });
});
