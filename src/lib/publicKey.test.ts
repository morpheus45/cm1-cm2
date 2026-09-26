import { describe, expect, it } from 'vitest';
import { isSecretKey } from './publicKey';

/** Un jeton comme ceux de Supabase, signature comprise (factice). */
function jwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('isSecretKey', () => {
  it('reconnaît la clé secrète', () => {
    expect(isSecretKey('sb_secret_abc123')).toBe(true);
    expect(isSecretKey('  sb_secret_abc123 ')).toBe(true);
  });

  it('reconnaît l\'ancienne clé service_role', () => {
    expect(isSecretKey(jwt({ iss: 'supabase', ref: 'abc', role: 'service_role' }))).toBe(true);
  });

  it('laisse passer les clés faites pour le navigateur', () => {
    expect(isSecretKey('sb_publishable_abc123')).toBe(false);
    expect(isSecretKey(jwt({ iss: 'supabase', ref: 'abc', role: 'anon' }))).toBe(false);
  });

  it('ne plante pas sur une valeur quelconque', () => {
    expect(isSecretKey('')).toBe(false);
    expect(isSecretKey('a.b.c')).toBe(false);
    expect(isSecretKey('https://abc.supabase.co')).toBe(false);
  });
});
