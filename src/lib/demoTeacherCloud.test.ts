import { beforeEach, describe, expect, it } from 'vitest';
import * as demoCloud from './demoTeacherCloud';
import { DEMO_PUPILS } from './demoTeacherData';
import { nameKey } from './teacherCloud';

describe('demoTeacherCloud', () => {
  beforeEach(() => {
    demoCloud.resetDemoStore();
  });

  it('rend la même classe de démonstration après une remise à zéro', async () => {
    const before = await demoCloud.readMyClasses();
    demoCloud.resetDemoStore();
    const after = await demoCloud.readMyClasses();
    expect(after).toEqual(before);
  });

  it('efface les corrections faites pendant une visite, à la remise à zéro', async () => {
    const [cloudClass] = await demoCloud.readMyClasses();
    const [sessionId] = Object.keys(await demoCloud.readWorksheetIndex());
    const session = cloudClass.sessions.find((entry) => entry.id === sessionId)!;
    await demoCloud.saveCorrection(sessionId, { version: 1, appreciation: 'Une appréciation de test', operations: {} });
    expect((await demoCloud.readWorksheet(session)).appreciation).toBe('Une appréciation de test');

    demoCloud.resetDemoStore();
    expect((await demoCloud.readWorksheet(session)).appreciation).not.toBe('Une appréciation de test');
  });

  it('corrige une feuille et le fait savoir dans son index', async () => {
    const index = await demoCloud.readWorksheetIndex();
    const pendingId = Object.entries(index).find(([, status]) => status.correctedAt === null)?.[0];
    expect(pendingId).toBeDefined();
    const [cloudClass] = await demoCloud.readMyClasses();
    const session = cloudClass.sessions.find((entry) => entry.id === pendingId);
    expect(session).toBeDefined();
    const worksheet = await demoCloud.readWorksheet(session!);
    expect(worksheet.operations.length).toBeGreaterThan(0);
    const correctedAt = await demoCloud.saveCorrection(pendingId!, {
      version: 1,
      appreciation: 'Bien joué',
      operations: {},
    });
    expect((await demoCloud.readWorksheetIndex())[pendingId!]).toEqual({ correctedAt });
  });

  it('refuse un problème de classe dont le calcul ne donne pas la réponse', async () => {
    await expect(
      demoCloud.addClassProblem('demo-classe', {
        enonce: 'Un énoncé bien assez long pour passer la validation.',
        calcul: '2 + 2',
        reponse: '5',
        unite: '',
        fausses_reponses: [],
        trimestre: 1,
      })
    ).rejects.toThrow();
  });

  it('ajoute un problème de classe valide', async () => {
    await demoCloud.addClassProblem('demo-classe', {
      enonce: 'Un énoncé bien assez long pour passer la validation.',
      calcul: '2 + 2',
      reponse: '4',
      unite: '',
      fausses_reponses: ['3', '5', '6'],
      trimestre: 1,
    });
    const problems = await demoCloud.readClassProblems('demo-classe');
    expect(problems.some((problem) => problem.reponse === '4')).toBe(true);
  });

  it('crée, ouvre puis termine une évaluation', async () => {
    const id = await demoCloud.createEvaluation('demo-classe', {
      title: 'Test',
      subject: 'maths',
      period: 1,
      trimester: 1,
      items: [],
    });
    let evaluations = await demoCloud.readEvaluations('demo-classe');
    expect(evaluations.find((e) => e.id === id)?.status).toBe('preparee');
    await demoCloud.setEvaluationStatus(id, 'ouverte');
    evaluations = await demoCloud.readEvaluations('demo-classe');
    expect(evaluations.find((e) => e.id === id)?.status).toBe('ouverte');
    await demoCloud.deleteEvaluation(id);
    evaluations = await demoCloud.readEvaluations('demo-classe');
    expect(evaluations.find((e) => e.id === id)).toBeUndefined();
  });

  it('efface un élève et ses séances', async () => {
    const [before] = await demoCloud.readMyClasses();
    const pupil = DEMO_PUPILS[0];
    const pupilId = before.pupilIds[nameKey(pupil.firstName, pupil.lastName)];
    await demoCloud.deletePupil(pupilId);
    const [after] = await demoCloud.readMyClasses();
    expect(after.pupils.some((p) => p.firstName === pupil.firstName)).toBe(false);
    expect(after.sessions.some((s) => s.pupil.firstName === pupil.firstName)).toBe(false);
  });

  it('refuse une question de classe mal formée', async () => {
    await expect(
      demoCloud.addClassQuestion('demo-classe', {
        domain: 'conjugaison',
        enonce: 'Un énoncé bien assez long pour passer la validation.',
        reponse: '',
        fausses_reponses: ['une réponse'],
        trimestre: 1,
      })
    ).rejects.toThrow();
  });

  it('ajoute, retire et supprime une question de classe, dans une matière autre que les maths', async () => {
    await demoCloud.addClassQuestion('demo-classe', {
      domain: 'orthographe',
      enonce: 'Un énoncé bien assez long pour passer la validation.',
      reponse: 'bonbon',
      fausses_reponses: ['bombon'],
      trimestre: 1,
    });
    let questions = await demoCloud.readClassQuestions('demo-classe');
    const added = questions.find((question) => question.reponse === 'bonbon');
    expect(added).toBeDefined();
    expect(added?.actif).toBe(true);

    await demoCloud.setClassQuestionActive(added!.id, false);
    questions = await demoCloud.readClassQuestions('demo-classe');
    expect(questions.find((question) => question.id === added!.id)?.actif).toBe(false);

    await demoCloud.deleteClassQuestion(added!.id);
    questions = await demoCloud.readClassQuestions('demo-classe');
    expect(questions.some((question) => question.id === added!.id)).toBe(false);
  });
});
