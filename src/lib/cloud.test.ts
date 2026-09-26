import { beforeEach, describe, expect, it } from 'vitest';
import {
  cachedClassProblems,
  depositParams,
  enqueueDeposit,
  flushOutbox,
  isUnknownClassCode,
  isValidJoinCode,
  normaliseJoinCode,
  parseOutbox,
  pendingDepositCount,
  readCloudConfig,
  worksheetPayload,
  type DepositParams,
} from './cloud';
import type { SessionResult } from './results';
import type { Worksheet } from './worksheet';

// L'environnement de test n'a pas de navigateur : un stockage en mémoire
// suffit pour vérifier la file d'envoi.
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;

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

describe('les paramètres envoyés à la base', () => {
  it('reprennent la séance et l\'élève', () => {
    expect(depositParams(session, 'aa-aa aa')).toMatchObject({
      p_session_id: session.id,
      p_join_code: 'AAAAAA',
      p_first_name: 'Léa',
      p_last_name: 'Martin',
      p_level: 'CM1',
      p_trimester: 2,
      p_subject: 'maths',
      p_activity: 'questions',
      p_results: session.domains,
      p_worksheet: null,
    });
  });

  it('allègent les tracés sans les déformer', () => {
    const worksheet: Worksheet = {
      name: 'Léa',
      level: 'CM1',
      trimester: 2,
      createdAt: session.at,
      operations: [{ id: 'o1', statement: '244 + 282', expected: '526' }],
      answers: { o1: { given: '526', strokes: [{ points: [[0.123456789, 0.987654321]] }] } },
    };
    const payload = worksheetPayload(worksheet);
    expect(payload.answers.o1.strokes[0].points[0]).toEqual([0.1235, 0.9877]);
    expect(payload.answers.o1.given).toBe('526');
    expect(payload.operations).toEqual(worksheet.operations);
  });
});

describe('le code de classe', () => {
  it('se tape sans se soucier des majuscules ni des tirets', () => {
    expect(normaliseJoinCode('ab-12 cd')).toBe('AB12CD');
    expect(isValidJoinCode(normaliseJoinCode('ab-12 cd'))).toBe(true);
  });

  it('fait six caractères, ni plus ni moins', () => {
    expect(isValidJoinCode('ABC12')).toBe(false);
    expect(normaliseJoinCode('ABCDEFGH')).toBe('ABCDEF');
  });
});

describe('la configuration', () => {
  it('est absente tant que l\'adresse ou la clé manque', () => {
    expect(readCloudConfig({})).toBeNull();
    expect(readCloudConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull();
    expect(readCloudConfig({ VITE_SUPABASE_URL: ' ', VITE_SUPABASE_PUBLISHABLE_KEY: ' ' })).toBeNull();
  });

  it('accepte la clé publique', () => {
    expect(
      readCloudConfig({
        VITE_SUPABASE_URL: 'https://x.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
      })
    ).toEqual({ url: 'https://x.supabase.co', publishableKey: 'sb_publishable_abc' });
  });

  it('refuse la clé secrète, qui contournerait toutes les règles d\'accès', () => {
    expect(
      readCloudConfig({
        VITE_SUPABASE_URL: 'https://x.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abc',
      })
    ).toBeNull();
  });
});

describe('la file d\'envoi', () => {
  beforeEach(() => store.clear());

  const params = (id: string): DepositParams => depositParams({ ...session, id }, 'AAAAAA');

  it('garde une séance tant que le réseau manque, puis l\'envoie', async () => {
    enqueueDeposit(params('s1'));
    const offline = await flushOutbox(async () => ({ error: { message: 'Failed to fetch' } }));
    expect(offline.s1).toBe('queued');
    expect(pendingDepositCount()).toBe(1);

    const online = await flushOutbox(async () => ({ error: null }));
    expect(online.s1).toBe('sent');
    expect(pendingDepositCount()).toBe(0);
  });

  it('abandonne un envoi dont le code de classe est inconnu : le renvoyer n\'y changerait rien', async () => {
    enqueueDeposit(params('s1'));
    const outcome = await flushOutbox(async () => ({
      error: { message: 'code de classe inconnu', code: 'P0001' },
    }));
    expect(outcome.s1).toBe('rejected');
    expect(pendingDepositCount()).toBe(0);
  });

  it('garde un envoi que la base refuse pour une autre raison : il repartira une fois corrigé', async () => {
    // Ce qui est arrivé quand la base ne connaissait pas encore la révision
    // ciblée : jeter la séance l'aurait perdue pour de bon.
    enqueueDeposit(params('s1'));
    const outcome = await flushOutbox(async () => ({
      error: { message: 'new row violates check constraint "sessions_activity_check"', code: '23514' },
    }));
    expect(outcome.s1).toBe('queued');
    expect(pendingDepositCount()).toBe(1);
  });

  it('garde la séance si l\'envoi lève une exception', async () => {
    enqueueDeposit(params('s1'));
    await flushOutbox(async () => {
      throw new Error('plus de réseau');
    });
    expect(pendingDepositCount()).toBe(1);
  });

  it('ne met pas deux fois la même séance en file', () => {
    enqueueDeposit(params('s1'));
    enqueueDeposit(params('s1'));
    expect(pendingDepositCount()).toBe(1);
  });

  it('envoie une à une les séances en attente, et garde seulement celles qui échouent', async () => {
    enqueueDeposit(params('s1'));
    enqueueDeposit(params('s2'));
    enqueueDeposit(params('s3'));
    const outcomes = await flushOutbox(async (p) =>
      p.p_session_id === 's2' ? { error: { message: 'NetworkError' } } : { error: null }
    );
    expect(outcomes).toEqual({ s1: 'sent', s2: 'queued', s3: 'sent' });
    expect(pendingDepositCount()).toBe(1);
  });

  it('survit à un stockage abîmé', () => {
    expect(parseOutbox('pas du json')).toEqual([]);
    expect(parseOutbox('[{"x":1}, null]')).toEqual([]);
  });
});

describe('isUnknownClassCode', () => {
  it('ne reconnaît comme refus définitif que le code de classe inconnu', () => {
    expect(isUnknownClassCode({ message: 'code de classe inconnu', code: 'P0001' })).toBe(true);
    expect(isUnknownClassCode({ message: 'TypeError: Failed to fetch' })).toBe(false);
    expect(isUnknownClassCode({ message: 'violates check constraint', code: '23514' })).toBe(false);
  });
});

describe('les problèmes de la classe sur la tablette', () => {
  beforeEach(() => store.clear());

  it('ne servent que pour la classe dont le code est donné', () => {
    const problems = [{ id: 'p1', enonce: 'Un énoncé', reponse: '24', unite: '', fausses_reponses: [], trimestre: 1 }];
    store.set('exercices-cm1-cm2:problemes-de-la-classe', JSON.stringify({ joinCode: 'AB23CD', problems }));
    expect(cachedClassProblems('ab23cd')).toEqual(problems);
    expect(cachedClassProblems('ZZ99ZZ')).toEqual([]);
  });

  it('résistent à un stockage abîmé', () => {
    store.set('exercices-cm1-cm2:problemes-de-la-classe', '{abîmé');
    expect(cachedClassProblems('AB23CD')).toEqual([]);
  });
});
