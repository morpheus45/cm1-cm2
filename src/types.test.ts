import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_HINTS,
  ALL_LEVELS,
  AVAILABLE_LEVELS,
  CYCLE_OF_LEVEL,
  isLevel,
  LEVEL_LABELS,
  teacherWord,
  teacherWordCapitalised,
  teacherWordDefinite,
} from './types';
import type { Activity, Level } from './types';

describe('les niveaux', () => {
  it('sont huit, dans l\'ordre de la scolarité', () => {
    expect(ALL_LEVELS).toEqual(['CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e']);
  });

  it('ont chacun leur libellé', () => {
    expect(Object.keys(LEVEL_LABELS).sort()).toEqual([...ALL_LEVELS].sort());
    expect(LEVEL_LABELS.CM1).toBe('CM1');
    expect(LEVEL_LABELS['6e']).toBe('6e');
  });

  it('se reconnaissent : rien d\'autre n\'est un niveau', () => {
    ALL_LEVELS.forEach((level) => expect(isLevel(level)).toBe(true));
    ['CP', 'cm1', 'CM1 ', '', null, undefined, 6, {}].forEach((value) => expect(isLevel(value)).toBe(false));
  });

  it('se rangent en trois cycles : CE1-CE2, CM1-CM2-6e, 5e-4e-3e', () => {
    const cycles = (cycle: number) => ALL_LEVELS.filter((level) => CYCLE_OF_LEVEL[level] === cycle);
    expect(cycles(2)).toEqual(['CE1', 'CE2']);
    expect(cycles(3)).toEqual(['CM1', 'CM2', '6e']);
    expect(cycles(4)).toEqual(['5e', '4e', '3e']);
  });
});

describe('les niveaux que l\'application propose', () => {
  it('sont le CE1, le CE2, le CM1, le CM2 et la 6e : la 5e, la 4e et la 3e attendent leurs questions', () => {
    expect(AVAILABLE_LEVELS).toEqual(['CE1', 'CE2', 'CM1', 'CM2', '6e']);
    (['5e', '4e', '3e'] as Level[]).forEach((level) => expect(AVAILABLE_LEVELS).not.toContain(level));
  });

  it('sont des niveaux connus, dans l\'ordre de la scolarité', () => {
    AVAILABLE_LEVELS.forEach((level) => expect(ALL_LEVELS).toContain(level));
    const ranks = AVAILABLE_LEVELS.map((level) => ALL_LEVELS.indexOf(level));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});

describe('le mot de l\'élève pour son enseignant', () => {
  const primary: Level[] = ['CE1', 'CE2', 'CM1', 'CM2'];
  const college: Level[] = ['6e', '5e', '4e', '3e'];

  it('est « ta maîtresse » du CE1 au CM2', () => {
    primary.forEach((level) => {
      expect(teacherWord(level)).toBe('ta maîtresse');
      expect(teacherWordCapitalised(level)).toBe('Ta maîtresse');
      expect(teacherWordDefinite(level)).toBe('la maîtresse');
    });
  });

  it('est « ton professeur » de la 6e à la 3e', () => {
    college.forEach((level) => {
      expect(teacherWord(level)).toBe('ton professeur');
      expect(teacherWordCapitalised(level)).toBe('Ton professeur');
      expect(teacherWordDefinite(level)).toBe('le professeur');
    });
  });

  it('est dit pour chacun des huit niveaux', () => {
    expect([...primary, ...college].sort()).toEqual([...ALL_LEVELS].sort());
  });

  it('suit le niveau dans ce qu\'on dit de chaque séance', () => {
    expect(ACTIVITY_HINTS.posees('CM1')).toBe("Tu poses l'opération avec ton doigt. Ta maîtresse pourra la corriger.");
    expect(ACTIVITY_HINTS.posees('4e')).toBe("Tu poses l'opération avec ton doigt. Ton professeur pourra la corriger.");
    expect(ACTIVITY_HINTS.evaluation('CM2')).toBe('Les questions choisies par ta maîtresse, pour toute la classe.');
    expect(ACTIVITY_HINTS.evaluation('3e')).toBe('Les questions choisies par ton professeur, pour toute la classe.');
  });

  it('ne dit « maîtresse » à aucun élève du collège', () => {
    const activities = Object.keys(ACTIVITY_HINTS) as Activity[];
    expect(activities).toHaveLength(5);
    college.forEach((level) =>
      activities.forEach((activity) => expect(ACTIVITY_HINTS[activity](level), activity).not.toMatch(/maîtresse/i))
    );
  });
});
