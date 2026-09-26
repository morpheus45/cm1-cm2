import { describe, expect, it } from 'vitest';
import { assistantErrorMessage, modificationRequest, parseAssistantReply, withReply } from './assistant';

const reply = {
  message: 'Voici un problème.',
  problemes: [
    { enonce: 'Lina partage 96 billes entre 4 amis.', calcul: '96 ÷ 4', reponse: '24', unite: 'billes', fausses_reponses: ['100', 7], trimestre: 2 },
    { enonce: 'Abîmé', calcul: 3 },
  ],
  horsChamp: false,
  transmis: false,
  assistant: '{"message":"Voici un problème."}',
};

describe('parseAssistantReply', () => {
  it('relit la réponse de la fonction, en écartant ce qui est abîmé', () => {
    const parsed = parseAssistantReply(reply);
    expect(parsed?.problemes).toEqual([
      { enonce: 'Lina partage 96 billes entre 4 amis.', calcul: '96 ÷ 4', reponse: '24', unite: 'billes', fausses_reponses: ['100'], trimestre: 2 },
    ]);
    expect(parsed?.assistant).toBe('{"message":"Voici un problème."}');
  });

  it('refuse ce qui ne ressemble pas à une réponse', () => {
    expect(parseAssistantReply(null)).toBeNull();
    expect(parseAssistantReply({ problemes: [] })).toBeNull();
    expect(parseAssistantReply({ message: 'x', problemes: 'non' })).toBeNull();
  });
});

describe('assistantErrorMessage', () => {
  const failure = (status: number, body: unknown) => ({
    context: new Response(body === null ? null : JSON.stringify(body), { status }),
  });

  it('rend tel quel le message en français de la fonction', async () => {
    expect(await assistantErrorMessage(failure(429, { erreur: 'plafond', message: 'Plafond du jour atteint.' }))).toBe(
      'Plafond du jour atteint.'
    );
  });

  it('explique une fonction absente, ou refusée par Supabase', async () => {
    expect(await assistantErrorMessage(failure(404, { code: 'NOT_FOUND', message: 'Requested function was not found' }))).toBe(
      "Le chat avec Claude n'est pas encore installé dans Supabase."
    );
    expect(await assistantErrorMessage(failure(401, { code: 401, message: 'Invalid JWT' }))).toMatch(/Verify JWT/);
    expect(await assistantErrorMessage(failure(500, null))).toBe("Claude n'a pas pu répondre : réessayez dans un moment.");
  });

  it('parle de réseau quand rien n\'a répondu', async () => {
    expect(await assistantErrorMessage(new Error('fetch failed'))).toMatch(/réseau/);
  });
});

describe('la conversation', () => {
  it('garde la question et la réponse brute, en alternance', () => {
    const parsed = parseAssistantReply(reply)!;
    expect(withReply([], 'Un problème ?', parsed)).toEqual([
      { role: 'user', content: 'Un problème ?' },
      { role: 'assistant', content: '{"message":"Voici un problème."}' },
    ]);
  });

  it('oublie un tour refusé, pour repartir proprement', () => {
    const refused = parseAssistantReply({ ...reply, problemes: [], assistant: null })!;
    const before = [{ role: 'user' as const, content: 'a' }, { role: 'assistant' as const, content: 'b' }];
    expect(withReply(before, 'Une question refusée', refused)).toEqual(before);
  });

  it('prépare la reprise d\'un problème', () => {
    expect(modificationRequest({ enonce: 'Lina partage 96 billes.', reponse: '24', unite: 'billes' })).toBe(
      'Modifie ce problème : « Lina partage 96 billes. » (réponse : 24 billes). '
    );
  });
});
