import { describe, expect, it } from 'vitest';
import { TROUBLES } from './adaptations';
import { QUESTIONNAIRE, suggestion } from './questionnaire';

describe('le questionnaire de repérage', () => {
  it('pose six affirmations pour chaque trouble', () => {
    TROUBLES.forEach((trouble) => expect(QUESTIONNAIRE[trouble].affirmations, trouble).toHaveLength(6));
  });

  it('ne propose rien sans signe, un peu à partir de 4, beaucoup à partir de 8', () => {
    expect(suggestion({})).toEqual({});
    expect(suggestion({ dyslexie: [1, 1, 1, 0, 0, 0] })).toEqual({});
    expect(suggestion({ dyslexie: [1, 1, 1, 1, 0, 0] })).toEqual({ dyslexie: 1 });
    expect(suggestion({ dyslexie: [2, 2, 2, 2, 0, 0], tdah: [2, 1, 1, 0, 0, 0] })).toEqual({ dyslexie: 2, tdah: 1 });
  });
});
