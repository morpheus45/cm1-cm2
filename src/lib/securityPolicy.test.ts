import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy } from './securityPolicy';

const directives = (policy: string) =>
  Object.fromEntries(policy.split('; ').map((entry) => [entry.split(' ')[0], entry.split(' ').slice(1)]));

describe('la politique de sécurité du contenu', () => {
  it('ne laisse parler la page qu\'au site et à la base de la classe', () => {
    const policy = directives(contentSecurityPolicy('https://exemple.supabase.co/'));
    expect(policy['connect-src']).toEqual(["'self'", 'https://exemple.supabase.co']);
    expect(policy['script-src']).toEqual(["'self'"]);
    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
  });

  it('n\'autorise ni script en ligne, ni eval, ni source étrangère', () => {
    const policy = contentSecurityPolicy('https://exemple.supabase.co');
    expect(policy).not.toContain('unsafe-inline');
    expect(policy).not.toContain('unsafe-eval');
    expect(policy).not.toContain('*');
    expect(policy).not.toContain('http:');
  });

  it('se passe de la base quand elle n\'est pas configurée', () => {
    expect(directives(contentSecurityPolicy(undefined))['connect-src']).toEqual(["'self'"]);
    expect(directives(contentSecurityPolicy('pas une adresse'))['connect-src']).toEqual(["'self'"]);
  });
});
