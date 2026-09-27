import { describe, expect, it } from 'vitest';
import { pupilIdFor } from './teacherCloud';
import { correctionQueue } from './teacherClasses';
import {
  buildDemoDataset,
  DEMO_JOIN_CODE,
  DEMO_LEVEL,
  DEMO_PUPILS,
} from './demoTeacherData';

describe('buildDemoDataset', () => {
  it('est déterministe : deux fabrications donnent exactement la même classe', () => {
    const first = buildDemoDataset();
    const second = buildDemoDataset();
    expect(second).toEqual(first);
  });

  it('a huit élèves fictifs, et un code de classe impossible à confondre avec un vrai', () => {
    const { cloudClass } = buildDemoDataset();
    expect(cloudClass.pupils).toHaveLength(8);
    expect(cloudClass.pupils.map((p) => p.firstName)).toEqual(DEMO_PUPILS.map((p) => p.firstName));
    expect(cloudClass.level).toBe(DEMO_LEVEL);
    expect(cloudClass.joinCode).toBe(DEMO_JOIN_CODE);
    // Un vrai code n'a jamais ces caractères, ambigus à l'écrit : celui-ci le
    // montre volontairement, pour ne jamais passer pour un vrai.
    expect(cloudClass.joinCode).toMatch(/[OIL01]/);
  });

  it('retrouve chaque élève par son nom, comme une vraie classe', () => {
    const { cloudClass } = buildDemoDataset();
    DEMO_PUPILS.forEach((pupil, index) => {
      expect(pupilIdFor(cloudClass, pupil.firstName, pupil.lastName)).toBe(`demo-eleve-${index}`);
    });
  });

  it('étale les séances sur plusieurs semaines', () => {
    const { cloudClass } = buildDemoDataset();
    const weeks = new Set(cloudClass.sessions.map((session) => session.at.slice(0, 10)));
    expect(weeks.size).toBeGreaterThanOrEqual(4);
    const dates = cloudClass.sessions.map((session) => new Date(session.at).getTime());
    expect(Math.max(...dates) - Math.min(...dates)).toBeGreaterThan(14 * 24 * 60 * 60 * 1000);
  });

  it('laisse des feuilles à corriger, et d\'autres déjà corrigées', () => {
    const { cloudClass, worksheets } = buildDemoDataset();
    const index = Object.fromEntries(Object.entries(worksheets).map(([id, entry]) => [id, entry.status]));
    const queue = correctionQueue(cloudClass, index);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.length).toBeLessThan(Object.keys(worksheets).length);
  });

  it('donne à chaque feuille des réponses d\'élève, jamais vierges', () => {
    const { worksheets } = buildDemoDataset();
    Object.values(worksheets).forEach((entry) => {
      expect(entry.worksheet.operations.length).toBeGreaterThan(0);
      entry.worksheet.operations.forEach((operation) => {
        expect(entry.worksheet.answers[operation.id]?.given).toBeTruthy();
      });
    });
  });

  it('propose quelques problèmes de classe, tous en service', () => {
    const { classProblems } = buildDemoDataset();
    expect(classProblems.length).toBeGreaterThan(0);
    expect(classProblems.every((problem) => problem.actif)).toBe(true);
  });

  it('a une évaluation terminée, avec ses copies, mais pas toutes rendues', () => {
    const { evaluationSummary, evaluationDetail } = buildDemoDataset();
    expect(evaluationSummary.status).toBe('terminee');
    expect(evaluationDetail.copies.length).toBeGreaterThan(0);
    expect(evaluationDetail.copies.length).toBeLessThan(DEMO_PUPILS.length);
    expect(evaluationDetail.items.length).toBe(evaluationSummary.questionCount);
    evaluationDetail.copies.forEach((copy) => {
      expect(copy.answers).toHaveLength(evaluationDetail.items.length);
      expect(copy.results.length).toBeGreaterThan(0);
    });
  });
});
