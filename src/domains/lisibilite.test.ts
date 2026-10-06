import { describe, expect, it } from 'vitest';
import {
  ALL_LEVELS,
  AVAILABLE_LEVELS,
  CYCLE_OF_LEVEL,
  SUBJECT_DOMAINS,
  subjectOf,
  type Cycle,
  type Level,
  type Question,
  type Trimester,
} from '../types';
import * as conjugaison from './conjugaison';
import * as accords from './accords';
import * as orthographe from './orthographe';
import { buildSession } from '../lib/sessionBuilder';
import { createRng } from '../lib/seededRandom';
import * as numeration from './numeration';
import * as calcul from './calcul';
import * as problemes from './problemes';
import * as geometrie from './geometrie';

/**
 * Les questions sont lues par des enfants de 8 à 11 ans : des phrases
 * courtes, sans point-virgule, des réponses qu'on lit d'un coup d'œil. Ce test
 * passe en revue tout ce qu'un élève peut lire pendant une séance.
 *
 * Les seuils suivent l'âge du lecteur, donc le cycle du niveau pour lequel la
 * question est fabriquée (CYCLE_OF_LEVEL) :
 *  - cycle 2 (CE1, CE2), des enfants de 7 à 8 ans qui déchiffrent encore :
 *    plus strict, des phrases de douze mots au plus et des réponses de huit ;
 *  - cycle 3 (CM1, CM2, 6e) : les seuils d'origine, que rien ne change —
 *    vingt mots par phrase, dix-huit dans une explication, douze par réponse ;
 *  - cycle 4 (5e, 4e, 3e), des élèves de 12 à 15 ans : plus souple, des
 *    phrases plus longues sont permises.
 * Le point-virgule reste proscrit à tous les âges, et les parenthèses en
 * histoire et en géographie aussi.
 *
 * Les questions de chaque niveau ouvert (src/lib/contenu.ts) passent par les
 * séances, comme pour l'élève. Celles du CE1, du CE2 et de la 6e passent aussi
 * directement par leurs générateurs, avec bien plus de graines que les séances
 * n'en tirent : elles doivent être lisibles par des enfants de sept ans. Les
 * seuils du cycle 4 attendent leur contenu.
 */
interface Seuils {
  /** Mots d'une phrase de la consigne ou de l'énoncé. */
  phrase: number;
  /** Mots d'une phrase de l'explication. */
  explication: number;
  /** Mots d'une réponse proposée. */
  choix: number;
}

const SEUILS: Record<Cycle, Seuils> = {
  2: { phrase: 12, explication: 12, choix: 8 },
  3: { phrase: 20, explication: 18, choix: 12 },
  4: { phrase: 28, explication: 24, choix: 16 },
};

const seuilsOf = (level: Level) => SEUILS[CYCLE_OF_LEVEL[level]];

/** Une question, avec le niveau pour lequel elle a été fabriquée. */
interface QuestionDuNiveau {
  level: Level;
  question: Question;
}

const TRIMESTERS: Trimester[] = [1, 2, 3];

/** Les mots d'une phrase : les nombres comptent, les signes non. */
const wordsOf = (sentence: string) => sentence.split(/\s+/).filter((token) => /[\p{L}\d]/u.test(token));
/** Une phrase s'arrête au point, au point d'exclamation ou d'interrogation, et aux deux-points. */
const sentencesOf = (text: string) => text.split(/[.!?:…]+(?:\s|$)/).filter((part) => wordsOf(part).length > 0);

/** Les maths du CE1, du CE2 et de la 6e : les questions que leurs générateurs fabriquent, en nombre. */
const GENERATEURS_DES_NOUVEAUX_NIVEAUX = [numeration.generate, calcul.generate, problemes.generate, geometrie.generate];
const NOUVEAUX_NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];

function questionsDesNouveauxNiveaux(): QuestionDuNiveau[] {
  return NOUVEAUX_NIVEAUX.flatMap((level) =>
    TRIMESTERS.flatMap((trimester) =>
      GENERATEURS_DES_NOUVEAUX_NIVEAUX.flatMap((generer) =>
        Array.from({ length: 60 }, (_, seed) => generer(level, trimester, createRng((seed + 1) * 7919), 12))
          .flat()
          .map((question) => ({ level, question }))
      )
    )
  );
}

function everyQuestion(): QuestionDuNiveau[] {
  return [...questionsDeLaBase(), ...questionsDesNouveauxNiveaux()];
}

function questionsDeLaBase(): QuestionDuNiveau[] {
  return Object.values(SUBJECT_DOMAINS).flatMap((domains) =>
    domains.flatMap((domain) =>
      ALL_LEVELS.flatMap((level) =>
        TRIMESTERS.flatMap((trimester) =>
          Array.from({ length: 12 }, (_, seed) =>
            buildSession({ domains: [domain], level, trimester, seed: (seed + 1) * 7919, classProblems: [] }).questions
          )
            .flat()
            .map((question) => ({ level, question }))
        )
      )
    )
  );
}

describe('les seuils de lisibilité', () => {
  it('gardent pour le cycle 3 ceux de l\'application depuis le début', () => {
    expect(SEUILS[3]).toEqual({ phrase: 20, explication: 18, choix: 12 });
    (['CM1', 'CM2'] as Level[]).forEach((level) => expect(seuilsOf(level)).toBe(SEUILS[3]));
  });

  it('sont plus stricts au cycle 2 et plus souples au cycle 4 que ceux du cycle 3', () => {
    (['phrase', 'explication', 'choix'] as const).forEach((seuil) => {
      expect(SEUILS[2][seuil], seuil).toBeLessThan(SEUILS[3][seuil]);
      expect(SEUILS[3][seuil], seuil).toBeLessThan(SEUILS[4][seuil]);
    });
  });

  it('s\'appliquent à une question selon le niveau pour lequel elle est fabriquée', () => {
    expect(ALL_LEVELS.map((level) => seuilsOf(level).phrase)).toEqual([12, 12, 20, 20, 20, 28, 28, 28]);
  });
});

describe('ce que lit l\'élève', () => {
  const questions = everyQuestion();

  it('passe en revue chaque niveau que l\'application propose', () => {
    // Sans cela, un niveau qui n'aurait plus aucune question passerait tous
    // les contrôles ci-dessous sans rien avoir été lu.
    const levels = new Set(questions.map((entry) => entry.level));
    AVAILABLE_LEVELS.forEach((level) => expect(levels.has(level), level).toBe(true));
  });

  it('n\'a jamais de point-virgule', () => {
    questions.forEach(({ question: q }) =>
      [q.instruction ?? '', q.prompt, ...q.choices, q.explanation ?? ''].forEach((text) => expect(text, text).not.toContain(';'))
    );
  });

  it('fait des phrases courtes', () => {
    questions.forEach(({ level, question: q }) => {
      const seuils = seuilsOf(level);
      [q.instruction ?? '', q.prompt].flatMap(sentencesOf).forEach((sentence) =>
        expect(wordsOf(sentence).length, `${level} : ${sentence}`).toBeLessThanOrEqual(seuils.phrase)
      );
      sentencesOf(q.explanation ?? '').forEach((sentence) =>
        expect(wordsOf(sentence).length, `${level} : ${sentence}`).toBeLessThanOrEqual(seuils.explication)
      );
    });
  });

  it('propose des réponses qu\'on lit d\'un coup d\'œil', () => {
    questions.forEach(({ level, question: q }) =>
      q.choices.forEach((choice) => expect(wordsOf(choice).length, `${level} : ${choice}`).toBeLessThanOrEqual(seuilsOf(level).choix))
    );
  });

  it('élide devant une voyelle dans les maths du CE1, du CE2 et de la 6e : « d\'enfants », jamais « de enfants »', () => {
    // Les énoncés se composent à partir de listes de mots : un mot qui commence par une voyelle
    // (enfants, étuis, œufs) ne doit pas rester seul derrière « de », « que » ou « ne ».
    // « onze » n'élide pas : « de onze » est juste. (\b ne voit pas les lettres accentuées : « achète un » n'est pas « te un » ; et le nom d'un point, « de A », n'est pas un mot.)
    questions
      .filter(({ level }) => NOUVEAUX_NIVEAUX.includes(level))
      .forEach(({ level, question: q }) =>
        [q.instruction ?? '', q.prompt, ...q.choices, q.explanation ?? ''].forEach((text) =>
          expect(text, `${level} : ${text}`).not.toMatch(/(?<![\p{L}'’])(?:de|ne|se|que|me|te|je) (?!onz)[aeiouéèêâîôûœ]\p{L}/iu)
        )
      );
  });

  it('n\'a pas de parenthèses en histoire et en géographie', () => {
    questions
      .filter(({ question: q }) => ['histoire', 'geographie'].includes(subjectOf(q.domain)))
      .forEach(({ question: q }) =>
        [q.instruction ?? '', q.prompt, ...q.choices, q.explanation ?? ''].forEach((text) => expect(text, text).not.toMatch(/[()]/))
      );
  });
});

/**
 * Le français du CE1, du CE2 et de la 6e, tiré directement des trois
 * générateurs de français, avec bien plus de graines que les séances n'en
 * tirent. Ces questions doivent être lisibles par un enfant de sept ans, avec
 * les seuils de son cycle.
 */
const NIVEAUX_FRANCAIS_ECRITS: Level[] = ['CE1', 'CE2', '6e'];

function questionsFrancaisDesNouveauxNiveaux(): QuestionDuNiveau[] {
  return NIVEAUX_FRANCAIS_ECRITS.flatMap((level) =>
    TRIMESTERS.flatMap((trimester) =>
      [conjugaison.generate, accords.generate, orthographe.generate].flatMap((generer) =>
        Array.from({ length: 60 }, (_, seed) => generer(level, trimester, createRng((seed + 1) * 7919), 12))
          .flat()
          .map((question) => ({ level, question }))
      )
    )
  );
}

describe('ce que lit l\'élève en français, au CE1, au CE2 et en 6e', () => {
  const questions = questionsFrancaisDesNouveauxNiveaux();

  it('passe en revue chaque notion écrite, pour chacun des trois niveaux', () => {
    // Sans cela, un niveau ou une notion sans question passerait tous les contrôles ci-dessous sans
    // rien avoir été lu. La liste s'allonge à mesure que les notions sont écrites.
    const notionsEcrites = ['conjugaison', 'accords', 'orthographe'];
    NIVEAUX_FRANCAIS_ECRITS.forEach((level) =>
      notionsEcrites.forEach((domaine) =>
        expect(
          questions.some(({ level: niveau, question }) => niveau === level && question.domain === domaine),
          `${level} ${domaine}`
        ).toBe(true)
      )
    );
  });

  it('n\'a jamais de point-virgule', () => {
    questions.forEach(({ question: q }) =>
      [q.instruction ?? '', q.prompt, ...q.choices, q.explanation ?? ''].forEach((text) => expect(text, text).not.toContain(';'))
    );
  });

  it('fait des phrases courtes, avec les seuils du cycle : douze mots au CE1 et au CE2, vingt en 6e', () => {
    questions.forEach(({ level, question: q }) => {
      const seuils = seuilsOf(level);
      [q.instruction ?? '', q.prompt].flatMap(sentencesOf).forEach((sentence) =>
        expect(wordsOf(sentence).length, `${level} : ${sentence}`).toBeLessThanOrEqual(seuils.phrase)
      );
      sentencesOf(q.explanation ?? '').forEach((sentence) =>
        expect(wordsOf(sentence).length, `${level} : ${sentence}`).toBeLessThanOrEqual(seuils.explication)
      );
    });
  });

  it('propose des réponses qu\'on lit d\'un coup d\'œil : huit mots au plus au cycle 2', () => {
    questions.forEach(({ level, question: q }) =>
      q.choices.forEach((choice) => expect(wordsOf(choice).length, `${level} : ${choice}`).toBeLessThanOrEqual(seuilsOf(level).choix))
    );
  });

  it('n\'a pas de parenthèses : les enfants de sept ans n\'en lisent pas', () => {
    questions.forEach(({ level, question: q }) => {
      if (level === '6e') return;
      [q.instruction ?? '', q.prompt, ...q.choices].forEach((text) => expect(text, text).not.toMatch(/[()]/));
    });
  });

  it('élide devant une voyelle : « d\'enfants », « j\'écoute », jamais « de enfants » ni « je écoute »', () => {
    // Les phrases se composent à partir de listes de mots : un mot qui commence par une voyelle ou un
    // h muet ne doit pas rester seul derrière « de », « que », « ne », « se », « je », « me », « te »,
    // « le » ou « la ». « onze » n'élide pas (« de onze »), « honte » et « haie » ont un h aspiré
    // (« de honte ») : seuls les h muets de nos listes sont cherchés.
    const voyelle = "(?:[aeiouàâéèêîôûœ]|h(?:abit|omm|ôpit|iver|eure|istoire))";
    const elision = new RegExp(`(?<![\\p{L}'’])(?:de|ne|se|que|me|te|je|le|la) (?!onz)${voyelle}\\p{L}*`, 'iu');
    questions.forEach(({ level, question: q }) =>
      [q.instruction ?? '', q.prompt, ...q.choices].forEach((text) => expect(text, `${level} : ${text}`).not.toMatch(elision))
    );
  });
});
