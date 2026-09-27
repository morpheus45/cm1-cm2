import { afterEach, describe, expect, it } from 'vitest';
import { DEMO_JOIN_CODE } from './demoTeacherData';
import { currentTeacher, enterDemo, exitDemo, isDemoActive, readMyClasses } from './teacherDataSource';

describe('teacherDataSource', () => {
  afterEach(() => {
    if (isDemoActive()) exitDemo();
  });

  it("n'est pas en démonstration par défaut, et parle alors à Supabase — indisponible ici", async () => {
    expect(isDemoActive()).toBe(false);
    await expect(currentTeacher()).resolves.toBeNull();
  });

  it('bascule vers la classe de démonstration une fois entrée', async () => {
    enterDemo();
    expect(isDemoActive()).toBe(true);
    const account = await currentTeacher();
    expect(account).not.toBeNull();
    const [cloudClass] = await readMyClasses();
    expect(cloudClass.joinCode).toBe(DEMO_JOIN_CODE);
  });

  it('revient à la source réelle en sortant de la démonstration', async () => {
    enterDemo();
    exitDemo();
    expect(isDemoActive()).toBe(false);
    await expect(currentTeacher()).resolves.toBeNull();
  });
});
