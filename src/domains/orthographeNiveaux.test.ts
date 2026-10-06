import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { stageOf } from '../lib/progression';
import { generate } from './orthographe';
import { famillesDeLEtape } from './orthographeNiveaux';
import { GABARITS_6E, GABARITS_CYCLE_2, MOTS_6E_REVISION, MOTS_CYCLE_2, gabaritsDuNiveau, motsConnus, type Gabarit } from './orthographeHomophonesNiveaux';
import { MOTS_AVEC_TROU, MOTS_INVARIABLES } from './orthographeMotsNiveaux';
import {
  ABREVIATIONS_DU_DICTIONNAIRE,
  CATEGORIES,
  CHAMPS_LEXICAUX,
  COMPARAISONS,
  CONTRAIRES,
  CONTRAIRES_AVEC_PREFIXE,
  EMPRUNTS,
  EXPRESSIONS,
  FAMILIERS,
  FAMILLES,
  FAMILLES_ALPHABETIQUES_6E,
  METAPHORES,
  MOTS_A_RANGER,
  PERSONNIFICATIONS,
  PHRASES_SANS_FIGURE,
  POLYSEMIE,
  PREFIXES,
  RACINES,
  SOUTENUS,
  SUFFIXES,
  SYNONYMES,
  SYNONYMES_PLUS_FORTS,
  THEMES,
  type GroupeDeMots,
  type Relation,
} from './orthographeVocabulaireNiveaux';
import { VERBES_6E, VERBES_REGULIERS_CYCLE_2, groupeDe } from './conjugaisonVerbesNiveaux';

/**
 * L'orthographe et le vocabulaire du CE1, du CE2 et de la 6e. Chaque famille de questions est contrôlée à part :
 * ses données (aucune mauvaise réponse ne peut être juste), son programme (rien n'arrive avant son trimestre),
 * et ses questions, relues avec des règles écrites ici, indépendantes du générateur.
 */

const NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const GRAINES = Array.from({ length: 40 }, (_, i) => i * 211 + 5);

function toutes(level: Level, trimester: Trimester, nombre = 30, graines = GRAINES): Question[] {
  return graines.flatMap((graine) => generate(level, trimester, createRng(graine), nombre));
}

const famille = (q: Question) => q.id.split('-')[1];
const cellules = NIVEAUX.flatMap((level) => ALL_TRIMESTERS.map((trimester) => [level, trimester] as const));

/** Le mot sans accent ni majuscule, pour comparer comme le fait un dictionnaire. */
const sansAccent = (mot: string) => mot.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Le début d'une phrase à trou, la fin : « Léa ... faim. » → « Léa », « faim. ». */
function autourDuTrou(phrase: string): [string, string] {
  const [avant, apres] = phrase.split('...');
  return [avant.trim(), apres.trim()];
}

// --- Les homophones : les mots que l'élève connaît à chaque étape --------------------------------------------------

const CYCLE_2_T1 = ['a', 'à', 'et', 'est'];
const CYCLE_2_T2 = [...CYCLE_2_T1, 'on', 'ont', 'son', 'sont'];
const CYCLE_2_T4 = [...CYCLE_2_T2, 'ou', 'où', 'ce', 'se', 'ces', 'ses', 'la', 'là'];
const SIXIEME_T1 = ['a', 'à', 'et', 'est', 'on', 'ont', 'son', 'sont', 'ou', 'où', 'ce', 'se', 'ces', 'ses'];
// « leure », « leures », « mets », « met », « nid », « nie », « plustôt » et « plutot » ne sont proposés que comme mauvaises réponses.
const SIXIEME_T2 = [
  ...SIXIEME_T1,
  ...["c'est", "s'est", "c'était", "s'était", 'quel', 'quelle', 'quels', 'quelles', "qu'elle", "qu'elles", 'la', 'là', "l'a", "l'as"],
  ...['leur', 'leurs', 'leure', 'leures', 'mes', 'mais', 'mets', 'met'],
];
const SIXIEME_T3 = [...SIXIEME_T2, ...['quelque', 'quelques', 'quel que', 'quelle que', 'plutôt', 'plus tôt', 'plustôt', 'plutot', 'ni', "n'y", 'nid', 'nie']];

const MOTS_PERMIS: Record<string, string[]> = {
  'CE1-1': CYCLE_2_T1,
  'CE1-2': CYCLE_2_T2,
  'CE1-3': CYCLE_2_T2,
  'CE2-1': CYCLE_2_T2,
  'CE2-2': CYCLE_2_T4,
  'CE2-3': CYCLE_2_T4,
  '6e-1': SIXIEME_T1,
  '6e-2': SIXIEME_T2,
  '6e-3': SIXIEME_T3,
};

describe('les gabarits d\'homophones : de quoi sont faites les phrases', () => {
  const tous: [string, Gabarit][] = [
    ...GABARITS_CYCLE_2.map((gabarit): [string, Gabarit] => ['cycle 2', gabarit]),
    ...GABARITS_6E.map((gabarit): [string, Gabarit] => ['6e', gabarit]),
  ];

  it('chaque phrase n\'a qu\'un trou, commence par une majuscule ou le trou, et finit par un signe', () => {
    tous.forEach(([, gabarit]) =>
      gabarit.phrases.forEach((phrase) => {
        expect(phrase.split('...').length - 1, phrase).toBe(1);
        expect(phrase, phrase).toMatch(/^(\.\.\.|[A-ZÀÉ])/);
        expect(phrase, phrase).toMatch(/[.?!]$/);
        expect(phrase, phrase).not.toMatch(/ {2}|\s,/);
      })
    );
  });

  it('le mot juste, son compagnon et les mots valides sont cohérents', () => {
    tous.forEach(([, gabarit]) => {
      expect(gabarit.parmi, gabarit.bonne).toContain(gabarit.bonne);
      gabarit.valides.forEach((mot) => expect(gabarit.parmi, `${gabarit.bonne} : ${mot}`).toContain(mot));
      expect(gabarit.valides, gabarit.bonne).not.toContain(gabarit.bonne);
      if (gabarit.compagnon) {
        expect(gabarit.parmi, gabarit.bonne).toContain(gabarit.compagnon);
        expect(gabarit.valides, `${gabarit.bonne} : le compagnon ${gabarit.compagnon}`).not.toContain(gabarit.compagnon);
      }
    });
  });

  it('chaque gabarit laisse au moins trois mauvaises réponses à son étape', () => {
    (['CE1', 'CE2', '6e'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        const stage = stageOf(level, trimester);
        const gabarits = gabaritsDuNiveau(level);
        const connus = motsConnus(gabarits, stage);
        gabarits
          .filter((gabarit) => gabarit.depuis <= stage)
          .forEach((gabarit) => {
            const possibles = gabarit.parmi.filter((mot) => mot !== gabarit.bonne && !gabarit.valides.includes(mot) && (!gabarit.progressif || connus.has(mot)));
            expect(possibles.length, `${level}-T${trimester} ${gabarit.famille} : ${gabarit.bonne}`).toBeGreaterThanOrEqual(3);
          });
      })
    );
  });

  it('« ces » ne va qu\'avec « -là » et « ses » qu\'avec « propres » : le seul indice est dans la phrase', () => {
    tous.forEach(([, gabarit]) => {
      if (gabarit.bonne === 'ces') gabarit.phrases.forEach((phrase) => expect(phrase, phrase).toContain('-là'));
      if (gabarit.bonne === 'ses') gabarit.phrases.forEach((phrase) => expect(phrase, phrase).toContain('propres'));
    });
  });

  it('« son » et « ce » : jamais « livre », qui est aussi un verbe (« regarde et livre ») et un nom féminin (« la livre »)', () => {
    tous
      .filter(([, gabarit]) => ['son', 'ce', 'la', 'se'].includes(gabarit.bonne))
      .forEach(([, gabarit]) => gabarit.phrases.forEach((phrase) => expect(phrase, phrase).not.toMatch(/\.\.\. livre\b|livre est sur/)));
  });

  it('« ce » n\'est suivi que d\'un nom masculin qui commence par une consonne : « cet exposé »', () => {
    tous
      .filter(([, gabarit]) => gabarit.bonne === 'ce')
      .forEach(([, gabarit]) =>
        gabarit.phrases.forEach((phrase) => {
          const nom = phrase.match(/\.\.\. ([^\s.]+)/)?.[1] ?? phrase.match(/^\.\.\. ([^\s.]+)/)?.[1];
          expect(nom, phrase).toBeDefined();
          expect(nom as string, phrase).toMatch(/^[bcdfghjklmnpqrstvwxz]/i);
        })
      );
  });

  it('« la » n\'est suivi que d\'un nom féminin qui commence par une consonne', () => {
    const feminins = ['télévision', 'voiture', 'maison', 'rue', 'lune', 'porte', 'fenêtre', 'valise', 'trousse', 'chaise', 'table', 'assiette', 'chambre', 'clé', 'poupée', 'poule', 'fleur', 'leçon', 'consigne', 'phrase', 'page', 'carte', 'salle', 'réponse', 'solution', 'radio', 'chanson'];
    tous
      .filter(([, gabarit]) => gabarit.bonne === 'la')
      .forEach(([, gabarit]) =>
        gabarit.phrases.forEach((phrase) => {
          const nom = autourDuTrou(phrase)[1].replace(/\.$/, '');
          expect(feminins, phrase).toContain(nom);
        })
      );
  });

  it('« leur » et « leurs » : jamais un nom qui ne change pas au pluriel (« leur compas », « leurs compas »)', () => {
    GABARITS_6E.filter((gabarit) => gabarit.famille === 'leur / leurs').forEach((gabarit) =>
      gabarit.phrases.forEach((phrase) => expect(phrase, phrase).not.toMatch(/compas|\bpois\b|\bbras\b|\bdos\b/))
    );
  });

  it('aucun mot ne figure à la fois parmi les mauvaises réponses et les mots valides, ni « plus tard » nulle part', () => {
    tous.forEach(([, gabarit]) => {
      expect(gabarit.parmi, gabarit.bonne).not.toContain('plus tard');
      gabarit.valides.forEach((mot) => expect(gabarit.compagnon, gabarit.bonne).not.toBe(mot));
    });
  });

  // Les phrases où un mot de plus irait : écrit à part du générateur, d'après les formes des phrases elles-mêmes.
  it('« est » et « sont » sont déclarés valides devant « un » et « une » : « Léa est un vélo rouge » est une phrase juste', () => {
    tous
      .filter(([, gabarit]) => ['a', 'ont'].includes(gabarit.bonne) && gabarit.phrases.every((phrase) => /^\S.*\.\.\. (un|une) /.test(phrase)))
      .forEach(([, gabarit]) => expect(gabarit.valides, `${gabarit.famille} : ${gabarit.phrases[0]}`).toContain(gabarit.bonne === 'a' ? 'est' : 'sont'));
  });

  it('« ou » est déclaré valide quand « et » ne l\'est pas, et « et » quand « ou » ne l\'est pas : les phrases à deux termes acceptent les deux', () => {
    tous
      .filter(([, gabarit]) => gabarit.bonne === 'et')
      .forEach(([, gabarit]) => expect(gabarit.valides, gabarit.phrases[0]).toContain('ou'));
    tous
      .filter(([, gabarit]) => gabarit.bonne === 'ou')
      .forEach(([, gabarit]) => expect(gabarit.valides, gabarit.phrases[0]).toContain('et'));
  });

  it('« se » n\'a jamais « la » parmi ses mauvaises réponses : « Léa la promène dans le parc » est une phrase juste', () => {
    GABARITS_CYCLE_2.filter((gabarit) => gabarit.bonne === 'se').forEach((gabarit) => expect(gabarit.valides, gabarit.phrases[0]).toContain('la'));
    // La 6e ne connaît « la » qu'au 2e trimestre, avec « l'a » et « l'as » : il n'est pas parmi les mots de ses gabarits « se ».
    GABARITS_6E.filter((gabarit) => gabarit.bonne === 'se').forEach((gabarit) => expect(gabarit.parmi).not.toContain('la'));
  });

  it('« où » en tête de phrase accepte « là » (« Là est mon cartable ») et « on » (« On est mon cartable ? ») : au cycle 2, qui les connaît', () => {
    GABARITS_CYCLE_2.filter((gabarit) => gabarit.bonne === 'où' && gabarit.phrases.every((phrase) => /^\.\.\. est /.test(phrase))).forEach((gabarit) => {
      expect(gabarit.valides).toContain('là');
      expect(gabarit.valides).toContain('on');
    });
  });

  it('les phrases à choix ne contiennent pas de proposition qui accepte « où » : « Tu viens où tu restes ? » se dit', () => {
    GABARITS_CYCLE_2.filter((gabarit) => gabarit.bonne === 'ou').forEach((gabarit) =>
      gabarit.phrases.forEach((phrase) => expect(phrase, phrase).not.toMatch(/^Tu (viens|lis|manges|pars|écris) \.\.\. tu/))
    );
  });

  it('« J\'aime le chat ... le chien » : « ou » et « à » conviennent aussi, et ces phrases ne viennent qu\'au 2e trimestre du CE1, avec « ou »', () => {
    tous
      .filter(([, gabarit]) => gabarit.bonne === 'et' && gabarit.phrases.some((phrase) => /^(J'aime|Il aime) /.test(phrase)))
      .forEach(([, gabarit]) => {
        expect(gabarit.phrases.every((phrase) => /^(J'aime|Il aime) /.test(phrase))).toBe(true);
        expect(gabarit.valides).toEqual(expect.arrayContaining(['ou', 'à']));
      });
    GABARITS_CYCLE_2.filter((gabarit) => gabarit.phrases.some((phrase) => phrase.startsWith("J'aime"))).forEach((gabarit) => expect(gabarit.depuis).toBeGreaterThanOrEqual(-4));
  });

  it('« joue à » : chaque jeu a son article, « Léa joue ce chat » ou « son cache-cache » se diraient aussi', () => {
    GABARITS_CYCLE_2.filter((gabarit) => gabarit.bonne === 'à').forEach((gabarit) =>
      gabarit.phrases.filter((phrase) => /joue \.\.\./.test(phrase)).forEach((phrase) => expect(phrase, phrase).toMatch(/\.\.\. la /))
    );
  });
});

describe('les homophones d\'une séance', () => {
  cellules.forEach(([level, trimester]) => {
    const questions = toutes(level, trimester).filter((q) => q.id.startsWith('orthographe-homophone-'));
    const permis = MOTS_PERMIS[`${level}-${trimester}`];

    it(`${level} T${trimester} : mots connus seulement, parmi les bonnes réponses comme parmi les mauvaises`, () => {
      expect(questions.length).toBeGreaterThan(100);
      questions.forEach((q) => q.choices.forEach((choix) => expect(permis, `${q.prompt} → ${choix}`).toContain(choix.toLowerCase())));
    });

    it(`${level} T${trimester} : quatre choix différents, une seule bonne réponse, une casse uniforme`, () => {
      questions.forEach((q) => {
        expect(q.choices, q.prompt).toHaveLength(4);
        expect(new Set(q.choices.map((choix) => choix.toLowerCase())).size, q.prompt).toBe(4);
        const majuscules = q.choices.filter((choix) => choix[0] === choix[0].toUpperCase());
        expect([0, 4], q.prompt).toContain(majuscules.length);
        // Un énoncé qui commence par le trou : toutes les propositions commencent par une majuscule.
        expect(majuscules.length === 4, q.prompt).toBe(q.prompt.startsWith('...'));
      });
    });
  });

  it('au CE1, le 1er trimestre ne pose que a / à et et / est, avec ces quatre mots à chaque question', () => {
    toutes('CE1', 1)
      .filter((q) => q.id.startsWith('orthographe-homophone-'))
      .forEach((q) => expect([...q.choices].map((c) => c.toLowerCase()).sort(), q.prompt).toEqual(['a', 'est', 'et', 'à']));
  });

  it('la bonne réponse est toujours le mot du gabarit, jamais un mot déclaré valide', () => {
    const gabarits = [...GABARITS_CYCLE_2, ...GABARITS_6E];
    cellules.forEach(([level, trimester]) =>
      toutes(level, trimester, 12, GRAINES.slice(0, 10))
        .filter((q) => q.id.startsWith('orthographe-homophone-'))
        .forEach((q) => {
          const bonne = q.choices[q.correctIndex].toLowerCase();
          const concernes = gabarits.filter((gabarit) => gabarit.bonne === bonne && gabarit.phrases.some((phrase) => phrase.toLowerCase() === q.prompt.toLowerCase()));
          expect(concernes.length, q.prompt).toBeGreaterThan(0);
          q.choices
            .filter((_, indice) => indice !== q.correctIndex)
            .forEach((mauvaise) => concernes.forEach((gabarit) => expect(gabarit.valides, `${q.prompt} → ${mauvaise}`).not.toContain(mauvaise.toLowerCase())));
        })
    );
  });

  it('chaque trimestre pose d\'abord ses homophones nouveaux : à l\'étape où la référence les place', () => {
    const premiers: [Level, Trimester, string[]][] = [
      ['CE1', 2, ['on', 'ont', 'son', 'sont']],
      ['CE2', 2, ['ou', 'où', 'ce', 'se', 'ces', 'ses', 'la', 'là']],
      ['6e', 2, ["c'est", "s'est", "c'était", "s'était", 'quel', "qu'elle", "l'a", "l'as", 'leur', 'mes']],
      ['6e', 3, ['quelque', 'quel que', 'plutôt', 'plus tôt', 'ni', "n'y"]],
    ];
    premiers.forEach(([level, trimester, mots]) => {
      const bonnes = new Set(
        toutes(level, trimester)
          .filter((q) => q.id.startsWith('orthographe-homophone-'))
          .map((q) => q.choices[q.correctIndex].toLowerCase())
      );
      mots.forEach((mot) => expect(bonnes.has(mot), `${level} T${trimester} : ${mot}`).toBe(true));
    });
  });

  it('révise au CE2-T3 et en 6e-T1 les mots du début', () => {
    const bonnes = (level: Level, trimester: Trimester) =>
      new Set(
        toutes(level, trimester)
          .filter((q) => q.id.startsWith('orthographe-homophone-'))
          .map((q) => q.choices[q.correctIndex].toLowerCase())
      );
    ['a', 'à', 'et', 'est', 'on', 'ont', 'son', 'sont'].forEach((mot) => {
      expect(bonnes('CE2', 3).has(mot), `CE2-T3 ${mot}`).toBe(true);
      expect(bonnes('6e', 1).has(mot), `6e-T1 ${mot}`).toBe(true);
    });
  });
});

// --- Les mots à écrire --------------------------------------------------------------------------------------------------------

describe('les mots invariables et les mots fréquents', () => {
  it('chaque mot a trois fautes différentes de lui et entre elles, et des phrases à un seul trou', () => {
    MOTS_INVARIABLES.forEach((mot) => {
      expect(new Set([mot.mot, ...mot.fautes]).size, mot.mot).toBe(4);
      expect(mot.phrases.length, mot.mot).toBeGreaterThanOrEqual(2);
      mot.phrases.forEach((phrase) => expect(phrase.split('...').length - 1, phrase).toBe(1));
    });
  });

  it('les dix mots du programme du CE1 sont tous là, au 1er trimestre', () => {
    const ce1 = MOTS_INVARIABLES.filter((mot) => mot.depuis === -5).map((mot) => mot.mot);
    expect(ce1.sort()).toEqual(['alors', 'aussi', 'avec', 'comme', 'dans', 'mais', 'pour', 'sous', 'sur', 'très']);
  });

  it('chaque mot est posé au CE1, au CE2 ou en 6e selon sa liste, jamais avant son étape', () => {
    const permis = (level: Level, trimester: Trimester) => new Set(MOTS_INVARIABLES.filter((mot) => (level === '6e' ? mot.pour === '6e' : mot.pour === 'cycle2') && mot.depuis <= stageOf(level, trimester)).map((mot) => mot.mot.toLowerCase()));
    cellules.forEach(([level, trimester]) =>
      toutes(level, trimester)
        .filter((q) => famille(q) === 'mot')
        .forEach((q) => expect(permis(level, trimester), q.prompt).toContain(q.choices[q.correctIndex].toLowerCase()))
    );
  });

  it('les quatre propositions sont des écritures du même mot, dont une seule est la bonne', () => {
    cellules.forEach(([level, trimester]) =>
      toutes(level, trimester)
        .filter((q) => famille(q) === 'mot')
        .forEach((q) => {
          const mot = MOTS_INVARIABLES.find((candidat) => candidat.mot.toLowerCase() === q.choices[q.correctIndex].toLowerCase());
          expect(mot, q.prompt).toBeDefined();
          const attendues = [mot!.mot, ...mot!.fautes].map((forme) => forme.toLowerCase()).sort();
          expect(q.choices.map((c) => c.toLowerCase()).sort(), q.prompt).toEqual(attendues);
        })
    );
  });
});

describe('les lettres qui manquent au CE2', () => {
  /** Le mot de la phrase où manquent des lettres, écrit avec les lettres proposées. */
  function motCompleté(phrase: string, lettres: string): string {
    const mot = phrase.split(/\s+/).find((morceau) => morceau.includes('...')) as string;
    return mot
      .replace('...', lettres)
      .replace(/[.,!?]+$/, '')
      .replace(/^(l|d)'/i, '')
      .toLowerCase();
  }

  it('avec les bonnes lettres, la phrase écrit le mot ; avec chacune des fautes, un autre mot que lui', () => {
    MOTS_AVEC_TROU.forEach((mot) => {
      expect(new Set([mot.manque, ...mot.fautes]).size, mot.mot).toBe(4);
      mot.phrases.forEach((phrase) => {
        expect(phrase.split('...').length - 1, phrase).toBe(1);
        const juste = motCompleté(phrase, mot.manque);
        expect([mot.mot, `${mot.mot}s`], phrase).toContain(juste);
        mot.fautes.forEach((faute) => expect([mot.mot, `${mot.mot}s`], `${phrase} → ${faute}`).not.toContain(motCompleté(phrase, faute)));
      });
    });
  });

  it('couvre c / ç, g / ge / gu, s / ss et m devant m, b, p, avec au moins huit mots chacun', () => {
    (['c-ç', 'g-ge-gu', 's-ss', 'm'] as const).forEach((regle) => expect(MOTS_AVEC_TROU.filter((mot) => mot.regle === regle).length, regle).toBeGreaterThanOrEqual(8));
  });

  it('ç, ge et gu s\'écrivent devant les voyelles qui le demandent : « garçon », « mangeons », « guitare »', () => {
    MOTS_AVEC_TROU.filter((mot) => mot.manque === 'ç').forEach((mot) => expect(mot.mot, mot.mot).toMatch(/ç[aouë]/));
    MOTS_AVEC_TROU.filter((mot) => mot.manque === 'ge').forEach((mot) => expect(mot.mot, mot.mot).toMatch(/ge[aoâ]/));
    MOTS_AVEC_TROU.filter((mot) => mot.manque === 'gu').forEach((mot) => expect(mot.mot, mot.mot).toMatch(/gu[eiy]/));
    MOTS_AVEC_TROU.filter((mot) => mot.manque === 'm').forEach((mot) => expect(mot.mot, mot.mot).toMatch(/m[bp]/));
  });

  it('n\'apparaît ni au CE1 ni en 6e : le programme le place au CE2-T1', () => {
    ['CE1', '6e'].forEach((level) => ALL_TRIMESTERS.forEach((trimester) => toutes(level as Level, trimester).forEach((q) => expect(famille(q), `${level} T${trimester}`).not.toBe('lettres'))));
    expect(toutes('CE2', 1).some((q) => famille(q) === 'lettres')).toBe(true);
  });
});

describe('le participe en -é, l\'infinitif en -er, la 2e personne du pluriel en -ez', () => {
  const AUXILIAIRES = /(\b(a|as|avons|avez|ont)|J'ai) \.\.\./;
  const MODAUX = /\b(veut|doit|va|peut|veulent|doivent|vont|peuvent|dois|vais|veux|vas|allons|devons|voulons|faut) \.\.\./;

  it('la bonne forme suit le mot qui précède : « a chanté », « veut chanter », « Vous chantez »', () => {
    cellules.forEach(([level, trimester]) =>
      toutes(level, trimester)
        .filter((q) => famille(q) === 'participe')
        .forEach((q) => {
          const bonne = q.choices[q.correctIndex];
          if (AUXILIAIRES.test(q.prompt)) expect(bonne, q.prompt).toMatch(/é$/);
          else if (MODAUX.test(q.prompt)) expect(bonne, q.prompt).toMatch(/er$/);
          else {
            expect(q.prompt, q.prompt).toMatch(/^Vous \.\.\./);
            expect(bonne, q.prompt).toMatch(/ez$/);
          }
          // Les quatre formes qu'on confond.
          expect(q.choices.filter((choix) => /é$/.test(choix)), q.prompt).toHaveLength(1);
          expect(q.choices.filter((choix) => /er$/.test(choix)), q.prompt).toHaveLength(1);
          expect(q.choices.filter((choix) => /ez$/.test(choix)), q.prompt).toHaveLength(1);
        })
    );
  });

  it('les verbes sont du 1er groupe, au passé composé déjà enseigné : à partir du CE1-T3', () => {
    [...VERBES_REGULIERS_CYCLE_2, ...VERBES_6E.filter((verbe) => groupeDe(verbe) === 1)].forEach((verbe) => expect(verbe.infinitive).toMatch(/er$/));
    [1, 2].forEach((trimester) => toutes('CE1', trimester as Trimester).forEach((q) => expect(famille(q), `CE1 T${trimester}`).not.toBe('participe')));
    expect(toutes('CE1', 3).some((q) => famille(q) === 'participe')).toBe(true);
  });

  it('la consigne ne nomme pas le verbe : « veut ... » avec « chanter » dans la consigne donnerait la réponse', () => {
    cellules.forEach(([level, trimester]) =>
      toutes(level, trimester, 12, GRAINES.slice(0, 10))
        .filter((q) => famille(q) === 'participe')
        .forEach((q) => {
          q.choices.forEach((choix) => expect(q.instruction ?? '', q.prompt).not.toContain(choix));
          expect(q.instruction).toBe('Choisis la bonne écriture du verbe');
        })
    );
  });

  it('« aimer » ne suit jamais « veut », « doit », « va » : « Léa veut aimer les fraises » ne se dit pas', () => {
    toutes('CE2', 1)
      .filter((q) => famille(q) === 'participe' && MODAUX.test(q.prompt))
      .forEach((q) => expect(q.id, q.prompt).not.toContain('aimer'));
  });
});

// --- Le vocabulaire : les données ------------------------------------------------------------------------------------------

describe('synonymes, contraires et mots plus forts : aucune mauvaise réponse ne convient', () => {
  const listes: [string, Relation[]][] = [
    ['synonymes', SYNONYMES],
    ['contraires', CONTRAIRES],
    ['mots plus forts', SYNONYMES_PLUS_FORTS],
  ];

  listes.forEach(([nom, liste]) =>
    it(`${nom} : quatre mots différents, la bonne réponse n'est pas le mot`, () => {
      liste.forEach((relation) => {
        expect(new Set([relation.bonne, ...relation.fausses]).size, `${relation.mot} → ${relation.bonne}`).toBe(4);
        expect(relation.fausses, relation.mot).not.toContain(relation.mot);
        expect(relation.bonne, relation.mot).not.toBe(relation.mot);
      });
    })
  );

  it('un contraire n\'est jamais proposé pour un autre contraire : si « a » est le contraire de « b », « a » n\'est pas une mauvaise réponse pour « b »', () => {
    const couples = new Set(CONTRAIRES.flatMap((relation) => [`${relation.mot}|${relation.bonne}`, `${relation.bonne}|${relation.mot}`]));
    CONTRAIRES.forEach((relation) => relation.fausses.forEach((fausse) => expect(couples.has(`${relation.mot}|${fausse}`), `${relation.mot} : ${fausse}`).toBe(false)));
  });

  it('un synonyme n\'est jamais proposé pour un autre synonyme du même mot, ni un mot plus fort', () => {
    const synonymesDe = (liste: Relation[], mot: string) => liste.filter((relation) => relation.mot === mot).map((relation) => relation.bonne);
    [SYNONYMES, SYNONYMES_PLUS_FORTS].forEach((liste) =>
      liste.forEach((relation) => relation.fausses.forEach((fausse) => expect(synonymesDe(liste, relation.mot), `${relation.mot} : ${fausse}`).not.toContain(fausse)))
    );
    // Les couples dits dans les deux sens : « a » synonyme de « b » et « b » proposé pour « a ».
    const couples = new Set(SYNONYMES.flatMap((relation) => [`${relation.mot}|${relation.bonne}`, `${relation.bonne}|${relation.mot}`]));
    SYNONYMES.forEach((relation) => relation.fausses.forEach((fausse) => expect(couples.has(`${relation.mot}|${fausse}`), `${relation.mot} : ${fausse}`).toBe(false)));
  });

  it('un synonyme n\'est jamais la mauvaise réponse d\'un contraire, ni l\'inverse : les deux relations sont tenues à part', () => {
    const synonymes = new Set(SYNONYMES.flatMap((relation) => [`${relation.mot}|${relation.bonne}`, `${relation.bonne}|${relation.mot}`]));
    const contraires = new Set(CONTRAIRES.flatMap((relation) => [`${relation.mot}|${relation.bonne}`, `${relation.bonne}|${relation.mot}`]));
    CONTRAIRES.forEach((relation) => expect(synonymes.has(`${relation.mot}|${relation.bonne}`), relation.mot).toBe(false));
    // Un synonyme proposé dans une question de contraire (« gros » pour « grand ») : cela existe, mais jamais le synonyme exact.
    CONTRAIRES.forEach((relation) => relation.fausses.forEach((fausse) => expect(contraires.has(`${relation.mot}|${fausse}`), `${relation.mot} : ${fausse}`).toBe(false)));
  });

  it('les mots plus forts n\'ont que des mauvaises réponses plus faibles ou voisines : aucune ne figure parmi les mots plus forts d\'un autre', () => {
    const plusFortsDe = new Map(SYNONYMES_PLUS_FORTS.map((relation) => [relation.mot, relation.bonne]));
    SYNONYMES_PLUS_FORTS.forEach((relation) => relation.fausses.forEach((fausse) => expect(plusFortsDe.get(relation.mot), `${relation.mot} : ${fausse}`).not.toBe(fausse)));
  });
});

describe('familles de mots', () => {
  it('au moins quatre mots dans la famille, au moins trois intrus, aucun mot en double ni dans les deux listes', () => {
    FAMILLES.forEach((famille) => {
      expect(famille.membres.length, famille.racine).toBeGreaterThanOrEqual(4);
      expect(famille.intrus.length, famille.racine).toBeGreaterThanOrEqual(3);
      expect(new Set([...famille.membres, ...famille.intrus]).size, famille.racine).toBe(famille.membres.length + famille.intrus.length);
      expect(famille.intrus, famille.racine).not.toContain(famille.racine);
      expect(famille.membres, famille.racine).not.toContain(famille.racine);
    });
  });

  it('un mot de la famille de « terre » n\'est jamais un intrus de « terre » : « terrible » ne vient pas de « terre »', () => {
    const terre = FAMILLES.find((famille) => famille.racine === 'terre');
    expect(terre?.intrus).toContain('terrible');
    expect(terre?.membres).toContain('terrain');
  });

  it('les familles du CE2 sont plus longues que celles du CE1 : cinq mots ou plus pour « terre », « porter » et « lire »', () => {
    ['terre', 'porter', 'lire'].forEach((racine) => expect(FAMILLES.find((famille) => famille.racine === racine)?.membres.length, racine).toBeGreaterThanOrEqual(5));
  });
});

describe('catégories, thèmes et champs lexicaux', () => {
  const groupes: [string, GroupeDeMots[]][] = [
    ['catégories', CATEGORIES],
    ['thèmes', THEMES],
    ['champs lexicaux', CHAMPS_LEXICAUX],
  ];

  groupes.forEach(([nom, liste]) =>
    it(`${nom} : au moins sept mots chacun, sans doublon, et aucun mot dans deux groupes`, () => {
      const vus = new Map<string, string>();
      liste.forEach((groupe) => {
        expect(groupe.mots.length, groupe.nom).toBeGreaterThanOrEqual(7);
        expect(new Set(groupe.mots).size, groupe.nom).toBe(groupe.mots.length);
        groupe.mots.forEach((mot) => {
          expect(vus.get(mot), `${mot} : ${groupe.nom} et ${vus.get(mot)}`).toBeUndefined();
          vus.set(mot, groupe.nom);
        });
      });
    })
  );

  it('les mots ambigus n\'y sont pas : « cheval » (animal et moyen de transport), « marron » (couleur et fruit), « basket » (sport et chaussure)', () => {
    const mots = CATEGORIES.flatMap((groupe) => groupe.mots);
    ['cheval', 'marron', 'basket', 'tomate', 'concombre', 'avocat'].forEach((mot) => expect(mots, mot).not.toContain(mot));
  });
});

describe('préfixes et suffixes', () => {
  it('chaque mot commence par son préfixe ou finit par son suffixe', () => {
    PREFIXES.forEach((affixe) => affixe.mots.forEach((mot) => expect(mot, `${affixe.affixe} ${mot}`).toMatch(new RegExp(`^${affixe.affixe.replace('-', '')}`))));
    SUFFIXES.forEach((affixe) => affixe.mots.forEach((mot) => expect(mot, `${affixe.affixe} ${mot}`).toMatch(new RegExp(`${affixe.affixe.replace('-', '')}$`))));
  });

  it('les préfixes et suffixes du programme sont tous là : re-, dé-, in-, -eur, -ment, -ette au CE ; dé-, re-, in-, pré-, sur-, -ment, -eur, -tion, -able en 6e', () => {
    const formes = (liste: { affixe: string; pour: string }[], pour: string) => liste.filter((affixe) => affixe.pour === pour).map((affixe) => affixe.affixe);
    ['re-', 'dé-', 'in-'].forEach((forme) => expect(formes(PREFIXES, 'cycle2')).toContain(forme));
    ['-eur', '-ment', '-ette'].forEach((forme) => expect(formes(SUFFIXES, 'cycle2')).toContain(forme));
    ['dé-', 're-', 'in-', 'pré-', 'sur-'].forEach((forme) => expect(formes(PREFIXES, '6e')).toContain(forme));
    ['-ment', '-eur', '-tion', '-able'].forEach((forme) => expect(formes(SUFFIXES, '6e')).toContain(forme));
  });

  it('un contraire fait avec un préfixe est le mot précédé de ce préfixe, et ses mots de famille n\'en sont pas le contraire', () => {
    CONTRAIRES_AVEC_PREFIXE.forEach((item) => {
      expect(item.contraire.endsWith(item.mot), item.mot).toBe(true);
      expect(new Set([item.contraire, ...item.famille]).size, item.mot).toBe(4);
      item.famille.forEach((parent) => expect(parent, `${item.mot} : ${parent}`).not.toMatch(/^(in|im|il|ir|dé|dés|mé|mal)/));
    });
  });

  it('un mot en « sur- » ne figure que sous un des deux sens, « au-dessus » ou « trop »', () => {
    const sens = PREFIXES.filter((affixe) => affixe.affixe === 'sur-');
    expect(sens.map((affixe) => affixe.sens).sort()).toEqual(['au-dessus', 'trop']);
    const mots = sens.flatMap((affixe) => affixe.mots);
    expect(new Set(mots).size).toBe(mots.length);
  });
});

describe('polysémie', () => {
  it('chaque mot a deux sens ou plus, trois phrases par sens, le mot souligné dans chacune, des définitions toutes différentes', () => {
    const definitions = new Set<string>();
    POLYSEMIE.forEach((mot) => {
      expect(mot.sens.length, mot.mot).toBeGreaterThanOrEqual(2);
      mot.sens.forEach((sens) => {
        expect(definitions.has(sens.definition), `${mot.mot} : ${sens.definition}`).toBe(false);
        definitions.add(sens.definition);
        expect(sens.phrases.length, `${mot.mot} : ${sens.definition}`).toBeGreaterThanOrEqual(3);
        sens.phrases.forEach((phrase) => {
          expect(phrase.match(/\*\*[^*]+\*\*/g), phrase).toHaveLength(1);
          expect(phrase.match(/\*\*([^*]+)\*\*/)?.[1].toLowerCase(), phrase).toMatch(new RegExp(`^${mot.mot}s?$`));
        });
      });
    });
  });

  it('une phrase n\'est qu\'à un seul sens : aucune ne se retrouve sous deux sens', () => {
    const phrases = POLYSEMIE.flatMap((mot) => mot.sens.flatMap((sens) => sens.phrases));
    expect(new Set(phrases).size).toBe(phrases.length);
  });

  it('« coûte » n\'y est pas : « coûter » s\'écrit aussi « couter »', () => {
    POLYSEMIE.forEach((mot) => mot.sens.forEach((sens) => sens.phrases.forEach((phrase) => expect(phrase).not.toMatch(/coût/i))));
  });
});

describe('expressions, registres, racines', () => {
  it('chaque expression a un sens à elle : deux expressions ne se disent jamais de la même façon', () => {
    [EXPRESSIONS.filter((e) => e.pour === 'cycle2'), EXPRESSIONS.filter((e) => e.pour === '6e')].forEach((liste) => {
      expect(new Set(liste.map((e) => e.sens)).size).toBe(liste.length);
      expect(new Set(liste.map((e) => e.expression)).size).toBe(liste.length);
    });
  });

  it('deux expressions de sens voisins ne vivent pas dans la même liste : on ne saurait pas laquelle est la bonne réponse', () => {
    const voisines = [
      ['tourner autour du pot', 'noyer le poisson'],
      ['avoir la tête dans les nuages', 'être dans la lune'],
      ['avoir le cœur sur la main', "avoir un cœur d'or"],
      ['être au septième ciel', 'être aux anges'],
    ];
    voisines.forEach(([a, b]) => {
      const expressions = EXPRESSIONS.map((e) => e.expression);
      expect(expressions.includes(a) && expressions.includes(b), `${a} et ${b}`).toBe(false);
    });
  });

  it('aucune expression ne dit « coûter » : « coûter les yeux de la tête » s\'écrit aussi « couter »', () => {
    EXPRESSIONS.forEach((e) => expect(`${e.expression} ${e.sens}`).not.toMatch(/coût|coûter/i));
  });

  it('les mots familiers ne figurent pas parmi les mots courants, et les soutenus non plus', () => {
    const courants = new Set([...FAMILIERS, ...SOUTENUS].map((paire) => paire.courant));
    [...FAMILIERS, ...SOUTENUS].forEach((paire) => expect(courants.has(paire.mot), paire.mot).toBe(false));
  });

  it('les racines ont chacune deux mots, et un sens écrit de la même façon que les autres', () => {
    RACINES.forEach((racine) => {
      expect(racine.mots.length, racine.racine).toBeGreaterThanOrEqual(2);
      expect(racine.sens, racine.racine).toMatch(/^[a-zéèêàçœ'\- ]+$/);
    });
    // « téléphone » a deux racines, « télé » et « phone » : aucun des deux sens n'est mauvaise réponse pour l'autre.
    const phone = RACINES.find((racine) => racine.racine === 'phone');
    const tele = RACINES.find((racine) => racine.racine === 'télé');
    expect(phone?.mots).toContain('téléphone');
    expect(tele?.mots).toContain('téléphone');
  });
});

describe('figures de style, emprunts, ordre alphabétique', () => {
  it('une comparaison contient « comme », une métaphore et une personnification non, une phrase sans figure non plus', () => {
    COMPARAISONS.forEach((phrase) => expect(phrase, phrase).toMatch(/\bcomme\b/));
    [...METAPHORES, ...PERSONNIFICATIONS, ...PHRASES_SANS_FIGURE].forEach((phrase) => expect(phrase, phrase).not.toMatch(/\b(comme|tel|telle|pareil|semble)\b/));
  });

  it('une métaphore dit « est un », « est une » ou « sont des » ; une personnification fait agir une chose comme une personne', () => {
    METAPHORES.forEach((phrase) => expect(phrase, phrase).toMatch(/\b(est|sont) (un|une|des|le|la)\b/));
    PERSONNIFICATIONS.forEach((phrase) => expect(phrase, phrase).not.toMatch(/\b(est|sont) (un|une|des)\b/));
  });

  it('chaque emprunt n\'est dans qu\'une seule langue', () => {
    const tous = Object.values(EMPRUNTS).flat();
    expect(new Set(tous).size).toBe(tous.length);
    expect(Object.keys(EMPRUNTS).sort()).toEqual(['anglais', 'arabe', 'italien']);
  });

  it('les mots à ranger sont tous différents, et aucun ne commence par une lettre accentuée', () => {
    expect(new Set(MOTS_A_RANGER).size).toBe(MOTS_A_RANGER.length);
    MOTS_A_RANGER.forEach((mot) => expect(mot.slice(0, 3), mot).toMatch(/^[a-z]{3}/));
  });

  it('chaque famille alphabétique de la 6e a quatre mots au moins, tous différents, tous rangés sans ambiguïté', () => {
    FAMILLES_ALPHABETIQUES_6E.forEach((mots) => {
      expect(mots.length).toBeGreaterThanOrEqual(4);
      expect(new Set(mots.map(sansAccent)).size).toBe(mots.length);
      // Le même début : « cartable », « carte », « carton » commencent par « cart ».
      expect(mots.every((mot) => mot.slice(0, 3) === mots[0].slice(0, 3)), mots.join(',')).toBe(true);
    });
  });

  it('les abréviations du dictionnaire sont toutes différentes, et leurs sens aussi', () => {
    expect(new Set(ABREVIATIONS_DU_DICTIONNAIRE.map(([abreviation]) => abreviation)).size).toBe(ABREVIATIONS_DU_DICTIONNAIRE.length);
    expect(new Set(ABREVIATIONS_DU_DICTIONNAIRE.map(([, sens]) => sens)).size).toBe(ABREVIATIONS_DU_DICTIONNAIRE.length);
  });
});

// --- Les orthographes rectifiées en 1990 : jamais une faute ---------------------------------------------------------

describe('les rectifications de 1990', () => {
  const INTERDITS = [
    'maître', 'maitre', 'maîtresse', 'maitresse', 'île', 'ile', 'boîte', 'boite', 'coût', 'cout', 'coûte', 'coute', 'coûter', 'couter', 'goût', 'gout', 'goûter', 'gouter',
    'flûte', 'flute', 'dîner', 'diner', 'dînette', 'dinette', 'nénuphar', 'nénufar', 'ognon', 'oignon', 'évènement', 'événement', 'chariot', 'charriot', 'week-end', 'weekend',
    'connaît', 'connait', 'plaît', 'plait', 'brûler', 'bruler', 'brûlant', 'brulant', 'paraît', 'paraitre', 'abîme', 'abime', 'aîné', 'chaîne', 'chaine', 'fraîche', 'fraiche',
    'quelquefois', 'cacahuète', 'cacahouète', 'bûche', 'dégoûtant', 'dégoutant',
  ];
  const motInterdit = new RegExp(`(?<![\\p{L}-])(${INTERDITS.join('|')})(?![\\p{L}-])`, 'iu');

  it('aucun mot touché par les rectifications ne figure dans les listes de mots, de phrases et de sens', () => {
    const textes: string[] = [
      ...GABARITS_CYCLE_2.flatMap((gabarit) => gabarit.phrases),
      ...GABARITS_6E.flatMap((gabarit) => gabarit.phrases),
      ...MOTS_INVARIABLES.flatMap((mot) => [mot.mot, ...mot.fautes, ...mot.phrases]),
      ...MOTS_AVEC_TROU.flatMap((mot) => [mot.mot, ...mot.phrases]),
      ...[...SYNONYMES, ...CONTRAIRES, ...SYNONYMES_PLUS_FORTS].flatMap((relation) => [relation.mot, relation.bonne, ...relation.fausses]),
      ...FAMILLES.flatMap((famille) => [famille.racine, ...famille.membres, ...famille.intrus]),
      ...[...CATEGORIES, ...THEMES, ...CHAMPS_LEXICAUX].flatMap((groupe) => [groupe.nom, ...groupe.mots]),
      ...POLYSEMIE.flatMap((mot) => [mot.mot, ...mot.sens.flatMap((sens) => [sens.definition, ...sens.phrases])]),
      ...EXPRESSIONS.flatMap((e) => [e.expression, e.sens]),
      ...[...FAMILIERS, ...SOUTENUS].flatMap((paire) => [paire.mot, paire.courant]),
      ...RACINES.flatMap((racine) => [racine.racine, racine.sens, ...racine.mots]),
      ...COMPARAISONS,
      ...METAPHORES,
      ...PERSONNIFICATIONS,
      ...PHRASES_SANS_FIGURE,
      ...Object.values(EMPRUNTS).flat(),
      ...MOTS_A_RANGER,
      ...FAMILLES_ALPHABETIQUES_6E.flat(),
    ];
    textes.forEach((texte) => expect(texte, texte).not.toMatch(motInterdit));
  });

  it('aucune question générée n\'en contient non plus', () => {
    cellules.forEach(([level, trimester]) =>
      toutes(level, trimester, 24, GRAINES.slice(0, 15)).forEach((q) => [q.instruction ?? '', q.prompt, ...q.choices].forEach((texte) => expect(texte, `${level} T${trimester} : ${texte}`).not.toMatch(motInterdit)))
    );
  });
});

// --- Le programme de chaque trimestre -----------------------------------------------------------------------------------

const FAMILLES_PAR_CELLULE: Record<string, string[]> = {
  'CE1-1': ['homophone', 'mot', 'alphabet', 'synonyme', 'famille'],
  'CE1-2': ['homophone', 'mot', 'alphabet', 'contraire', 'polysemie', 'categorie', 'famille', 'synonyme'],
  'CE1-3': ['homophone', 'participe', 'mot', 'prefixe', 'suffixe', 'theme', 'contraire', 'synonyme'],
  'CE2-1': ['homophone', 'mot', 'lettres', 'participe', 'prefixe', 'suffixe', 'famille', 'synonyme', 'alphabet'],
  'CE2-2': ['homophone', 'lettres', 'participe', 'contraire', 'polysemie', 'expression', 'prefixe', 'suffixe', 'synonyme'],
  'CE2-3': ['homophone', 'lettres', 'participe', 'famille', 'categorie', 'theme', 'expression', 'polysemie', 'prefixe', 'suffixe'],
  '6e-1': ['homophone', 'prefixe', 'suffixe', 'synonyme', 'contraire', 'famille', 'alphabet', 'dictionnaire', 'participe', 'mot'],
  '6e-2': ['homophone', 'polysemie', 'expression', 'registre', 'champ', 'nuance', 'racine', 'participe'],
  '6e-3': ['homophone', 'figure', 'emprunt', 'famille', 'champ', 'racine', 'prefixe', 'suffixe', 'mot'],
};

describe('le programme de chaque trimestre', () => {
  cellules.forEach(([level, trimester]) => {
    const permises = FAMILLES_PAR_CELLULE[`${level}-${trimester}`];
    const questions = toutes(level, trimester, 30);

    it(`${level} T${trimester} : seulement ses familles de questions, et toutes y paraissent`, () => {
      const vues = new Set(questions.map(famille));
      vues.forEach((nom) => expect(permises, `${level} T${trimester} : ${nom}`).toContain(nom));
      permises.forEach((nom) => expect(vues.has(nom), `${level} T${trimester} : ${nom}`).toBe(true));
    });

    it(`${level} T${trimester} : le tableau du générateur et celui du test disent la même chose`, () => {
      const dedans = famillesDeLEtape(level, trimester).map((nom) => (nom.startsWith('homophone') ? 'homophone' : nom === 'theme' && level === '6e' ? 'champ' : nom === 'affixe' ? 'prefixe' : nom));
      const sansSuffixe = permises.filter((nom) => nom !== 'suffixe');
      expect([...new Set(dedans)].sort()).toEqual([...new Set(sansSuffixe)].sort());
    });
  });

  it('chaque notion arrive à son trimestre : rien du CE2 au CE1, rien de la 6e au CE2, rien du CM aux trois niveaux', () => {
    const premiere = (level: Level, trimester: Trimester, nom: string) => toutes(level, trimester).some((q) => famille(q) === nom);
    expect(premiere('CE1', 1, 'polysemie')).toBe(false);
    expect(premiere('CE1', 2, 'polysemie')).toBe(true);
    expect(premiere('CE1', 2, 'participe')).toBe(false);
    expect(premiere('CE1', 3, 'participe')).toBe(true);
    expect(premiere('CE1', 3, 'lettres')).toBe(false);
    expect(premiere('CE2', 1, 'lettres')).toBe(true);
    expect(premiere('CE2', 1, 'expression')).toBe(false);
    expect(premiere('CE2', 2, 'expression')).toBe(true);
    ['CE1', 'CE2'].forEach((level) => ALL_TRIMESTERS.forEach((trimester) => ['registre', 'racine', 'figure', 'emprunt', 'dictionnaire', 'nuance', 'champ'].forEach((nom) => expect(premiere(level as Level, trimester, nom), `${level} T${trimester} ${nom}`).toBe(false))));
    expect(premiere('6e', 1, 'figure')).toBe(false);
    expect(premiere('6e', 2, 'figure')).toBe(false);
    expect(premiere('6e', 3, 'figure')).toBe(true);
    expect(premiere('6e', 2, 'registre')).toBe(true);
    expect(premiere('6e', 1, 'registre')).toBe(false);
  });

  it('chaque élément de vocabulaire vient de la liste de son niveau, à partir de son trimestre', () => {
    // On retrouve l'élément d'après sa question : mot d'un synonyme, racine d'une famille, mot d'une expression.
    const synonymes = (level: Level, trimester: Trimester) => new Set(SYNONYMES.filter((relation) => relation.pour === (level === '6e' ? '6e' : 'cycle2') && relation.depuis <= stageOf(level, trimester)).map((relation) => relation.mot));
    const familles = (level: Level, trimester: Trimester) => new Set(FAMILLES.filter((f) => f.pour === (level === '6e' ? '6e' : 'cycle2') && f.depuis <= stageOf(level, trimester)).map((f) => f.racine));
    const expressions = (level: Level, trimester: Trimester) => new Set(EXPRESSIONS.filter((e) => e.pour === (level === '6e' ? '6e' : 'cycle2') && e.depuis <= stageOf(level, trimester)).map((e) => `« ${e.expression} »`));
    cellules.forEach(([level, trimester]) =>
      toutes(level, trimester).forEach((q) => {
        if (famille(q) === 'synonyme') expect(synonymes(level, trimester), q.prompt).toContain(q.prompt.match(/« (.*) »/)?.[1]);
        if (famille(q) === 'famille') expect(familles(level, trimester), q.prompt).toContain(q.prompt.match(/« (.*) »/)?.[1]);
        if (famille(q) === 'expression') expect(expressions(level, trimester), q.prompt).toContain(q.prompt);
      })
    );
  });
});

// --- Une seule bonne réponse, vérifiée question par question ------------------------------------------------------------------

describe('une seule bonne réponse', () => {
  const toutesLesQuestions = cellules.flatMap(([level, trimester]) => toutes(level, trimester, 24, GRAINES.slice(0, 20)).map((q) => ({ level, trimester, q })));

  it('quatre choix différents à chaque question, dont la bonne', () => {
    toutesLesQuestions.forEach(({ level, trimester, q }) => {
      expect(q.domain).toBe('orthographe');
      expect(q.choices, `${level} T${trimester} ${q.prompt}`).toHaveLength(4);
      expect(new Set(q.choices).size, `${level} T${trimester} ${q.prompt}`).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
      expect(q.id).toMatch(/^orthographe-[a-z]+-\d+-/);
    });
  });

  it('l\'ordre alphabétique : le premier ou le dernier mot, comparé comme un dictionnaire', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'alphabet' && q.prompt.includes(','))
      .forEach(({ q }) => {
        const mots = q.prompt.split(', ');
        expect([...mots].sort(), q.prompt).toEqual([...q.choices].sort());
        const rangés = [...mots].sort((a, b) => sansAccent(a).localeCompare(sansAccent(b), 'fr'));
        const attendue = (q.instruction ?? '').includes('premier') ? rangés[0] : rangés[rangés.length - 1];
        expect(q.choices[q.correctIndex], q.prompt).toBe(attendue);
      });
  });

  it('l\'ordre alphabétique : au CE1-T1, les quatre mots commencent par des lettres différentes ; au CE1-T2, deux lettres suffisent', () => {
    const lettres = (q: Question, rang: number) => q.choices.map((mot) => sansAccent(mot).charAt(rang - 1));
    toutesLesQuestions
      .filter(({ level, trimester, q }) => level === 'CE1' && famille(q) === 'alphabet' && q.prompt.includes(','))
      .forEach(({ trimester, q }) => {
        if (trimester === 1) expect(new Set(lettres(q, 1)).size, q.prompt).toBe(4);
        else expect(new Set(lettres(q, 1)).size === 4 || (new Set(lettres(q, 1)).size === 1 && new Set(lettres(q, 2)).size === 4), q.prompt).toBe(true);
      });
  });

  it('l\'ordre alphabétique : « quelle lettre vient juste après », avec la lettre suivante de l\'alphabet', () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'alphabet' && !q.prompt.includes(','))
      .forEach(({ q }) => {
        const decalage = q.id.endsWith('apres') ? 1 : -1;
        expect(q.choices[q.correctIndex], q.prompt).toBe(alphabet.charAt(alphabet.indexOf(q.prompt) + decalage));
      });
  });

  it('synonymes, contraires, mots plus forts : la bonne réponse est celle de la liste', () => {
    const listes: [string, Relation[]][] = [
      ['synonyme', SYNONYMES],
      ['contraire', CONTRAIRES],
      ['nuance', SYNONYMES_PLUS_FORTS],
    ];
    toutesLesQuestions.forEach(({ level, q }) => {
      const liste = listes.find(([nom]) => nom === famille(q));
      if (!liste) return;
      const mot = q.prompt.match(/« (.*) »/)?.[1];
      const relation = liste[1].find((candidat) => candidat.mot === mot && candidat.bonne === q.choices[q.correctIndex] && candidat.pour === (level === '6e' ? '6e' : 'cycle2'));
      expect(relation, `${level} ${q.prompt}`).toBeDefined();
      expect([...q.choices].sort()).toEqual([relation!.bonne, ...relation!.fausses].sort());
    });
  });

  it('les familles : la bonne réponse est un mot de la famille (ou l\'intrus), les trois autres sont du côté opposé', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'famille')
      .forEach(({ level, q }) => {
        const racine = q.prompt.match(/« (.*) »/)?.[1];
        const f = FAMILLES.find((candidat) => candidat.racine === racine && candidat.pour === (level === '6e' ? '6e' : 'cycle2'));
        expect(f, q.prompt).toBeDefined();
        const bonne = q.choices[q.correctIndex];
        const autres = q.choices.filter((_, indice) => indice !== q.correctIndex);
        if (q.id.endsWith('-intrus')) {
          expect(f!.intrus, q.prompt).toContain(bonne);
          autres.forEach((mot) => expect(f!.membres, `${q.prompt} → ${mot}`).toContain(mot));
        } else {
          expect(f!.membres, q.prompt).toContain(bonne);
          autres.forEach((mot) => expect(f!.intrus, `${q.prompt} → ${mot}`).toContain(mot));
        }
      });
  });

  it('préfixes et suffixes : le sens, le préfixe, le suffixe, le contraire', () => {
    toutesLesQuestions
      .filter(({ q }) => ['prefixe', 'suffixe'].includes(famille(q)))
      .forEach(({ level, q }) => {
        const pour = level === '6e' ? '6e' : 'cycle2';
        const bonne = q.choices[q.correctIndex];
        if (q.id.endsWith('-contraire')) {
          const mot = q.prompt.match(/« (.*) »/)?.[1];
          const item = CONTRAIRES_AVEC_PREFIXE.find((candidat) => candidat.mot === mot && candidat.pour === pour);
          expect(item?.contraire, q.prompt).toBe(bonne);
        } else if (q.id.endsWith('-sens')) {
          const [, forme, mot] = q.prompt.match(/« (.*) » dans « (.*) »/) as string[];
          const affixes = [...PREFIXES, ...SUFFIXES].filter((a) => a.affixe === forme && a.pour === pour && a.mots.includes(mot));
          expect(affixes.map((a) => a.sens), q.prompt).toContain(bonne);
          if (forme === 'sur-') {
            // Les deux sens de « sur- » : jamais l'autre en mauvaise réponse.
            const autre = bonne === 'trop' ? 'au-dessus' : 'trop';
            expect(q.choices, q.prompt).not.toContain(autre);
          }
        } else {
          const mot = q.prompt.match(/« (.*) »/)?.[1] as string;
          expect(q.choices[q.correctIndex], q.prompt).toMatch(/^-?[a-zé]+-?$/);
          if (famille(q) === 'prefixe') {
            const lettres = bonne.replace('-', '');
            expect(mot.startsWith(lettres), q.prompt).toBe(true);
            q.choices.filter((choix) => choix !== bonne).forEach((choix) => {
              expect(mot.startsWith(choix.replace('-', '')), `${q.prompt} → ${choix}`).toBe(false);
              // « impossible » commence par « im- » : « in- » n'est pas une mauvaise réponse acceptable, c'est la même famille.
              if (bonne === 'im-') expect(choix).not.toBe('in-');
            });
          } else {
            const lettres = bonne.replace('-', '');
            expect(mot.endsWith(lettres), q.prompt).toBe(true);
            q.choices.filter((choix) => choix !== bonne).forEach((choix) => expect(mot.endsWith(choix.replace('-', '')), `${q.prompt} → ${choix}`).toBe(false));
          }
        }
      });
  });

  it('on ne demande jamais le suffixe de « -tion » : « décoration » s\'écrit avec « -ation », deux réponses seraient justes', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'suffixe' && !q.id.endsWith('-sens'))
      .forEach(({ q }) => expect(q.choices.map((choix) => choix.toLowerCase()), q.prompt).not.toContain('-tion'));
  });

  it('polysémie : la bonne définition est celle du sens qui contient la phrase', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'polysemie')
      .forEach(({ level, q }) => {
        const pour = level === '6e' ? '6e' : 'cycle2';
        const mot = POLYSEMIE.find((candidat) => candidat.pour === pour && candidat.sens.some((sens) => sens.phrases.includes(q.prompt)));
        expect(mot, q.prompt).toBeDefined();
        const sens = mot!.sens.find((candidat) => candidat.phrases.includes(q.prompt))!;
        expect(q.choices[q.correctIndex], q.prompt).toBe(sens.definition);
        // Les trois autres sont des définitions d'autres sens, jamais d'un sens qui irait aussi.
        const toutes = POLYSEMIE.flatMap((candidat) => candidat.sens.map((s) => s.definition));
        q.choices.forEach((choix) => expect(toutes, q.prompt).toContain(choix));
      });
  });

  it('catégories, thèmes et champs lexicaux : l\'intrus est le seul mot qui n\'est pas du groupe des trois autres', () => {
    toutesLesQuestions
      .filter(({ q }) => ['categorie', 'theme', 'champ'].includes(famille(q)))
      .forEach(({ level, q }) => {
        const groupes = level === '6e' ? CHAMPS_LEXICAUX : [...CATEGORIES, ...THEMES];
        const bonne = q.choices[q.correctIndex];
        if (q.id.includes('-groupe-')) {
          const groupe = CATEGORIES.find((candidat) => candidat.mots.includes(q.prompt));
          expect(groupe?.nom, q.prompt).toBe(bonne);
          q.choices.filter((choix) => choix !== bonne).forEach((choix) => expect(CATEGORIES.find((candidat) => candidat.nom === choix)?.mots, `${q.prompt} → ${choix}`).not.toContain(q.prompt));
          return;
        }
        const mots = q.id.includes('-intrus-') ? q.choices : q.prompt.split(', ');
        const trois = q.id.includes('-intrus-') ? q.choices.filter((choix) => choix !== bonne) : q.prompt.split(', ');
        const groupe = groupes.find((candidat) => trois.every((mot) => candidat.mots.includes(mot)));
        expect(groupe, `${q.prompt} : un groupe pour les trois mots`).toBeDefined();
        if (q.id.includes('-intrus-')) expect(groupe!.mots, q.prompt).not.toContain(bonne);
        else {
          expect(groupe!.mots, q.prompt).toContain(bonne);
          q.choices.filter((choix) => choix !== bonne).forEach((choix) => expect(groupe!.mots, `${q.prompt} → ${choix}`).not.toContain(choix));
        }
        expect(mots.length).toBeGreaterThan(0);
      });
  });

  it('expressions : le sens de l\'expression, et pas un autre', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'expression')
      .forEach(({ level, q }) => {
        const e = EXPRESSIONS.find((candidat) => `« ${candidat.expression} »` === q.prompt && candidat.pour === (level === '6e' ? '6e' : 'cycle2'));
        expect(e?.sens, q.prompt).toBe(q.choices[q.correctIndex]);
      });
  });

  it('registres : le mot familier, le mot soutenu, le mot courant de la même signification', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'registre')
      .forEach(({ q }) => {
        const bonne = q.choices[q.correctIndex];
        const autres = q.choices.filter((choix) => choix !== bonne);
        if (q.id.includes('-familier-')) {
          expect(FAMILIERS.map((p) => p.mot), q.prompt).toContain(bonne);
          autres.forEach((mot) => expect(FAMILIERS.map((p) => p.mot), `${q.prompt} → ${mot}`).not.toContain(mot));
        } else if (q.id.includes('-soutenu-')) {
          expect(SOUTENUS.map((p) => p.mot), q.prompt).toContain(bonne);
          autres.forEach((mot) => expect(SOUTENUS.map((p) => p.mot), `${q.prompt} → ${mot}`).not.toContain(mot));
        } else {
          const mot = q.prompt.match(/« (.*) »/)?.[1];
          expect(FAMILIERS.find((p) => p.mot === mot)?.courant, q.prompt).toBe(bonne);
          autres.forEach((choix) => expect([...FAMILIERS, ...SOUTENUS].map((p) => p.mot), `${q.prompt} → ${choix}`).not.toContain(choix));
        }
      });
  });

  it('racines : le sens de la racine, sans le sens de l\'autre racine du même mot', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'racine')
      .forEach(({ q }) => {
        const [, forme, mot] = q.prompt.match(/« (.*) » dans « (.*) »/) as string[];
        const racine = RACINES.find((candidat) => candidat.racine === forme && candidat.mots.includes(mot));
        expect(racine?.sens, q.prompt).toBe(q.choices[q.correctIndex]);
        const memeMot = RACINES.filter((candidat) => candidat !== racine && candidat.mots.includes(mot)).map((candidat) => candidat.sens);
        q.choices.forEach((choix) => expect(memeMot, `${q.prompt} → ${choix}`).not.toContain(choix));
      });
  });

  it('figures de style : la figure de la phrase, jamais deux réponses justes', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'figure')
      .forEach(({ q }) => {
        const bonne = q.choices[q.correctIndex];
        if ((q.instruction ?? '').startsWith('Trouve la phrase')) {
          // « Trouve la phrase qui contient une comparaison » : une phrase de chaque sorte, une seule de la figure demandée.
          const demandee = (q.instruction ?? '').match(/contient (une \S+)/)?.[1] as string;
          const listes: Record<string, string[]> = { 'une comparaison': COMPARAISONS, 'une métaphore': METAPHORES, 'une personnification': PERSONNIFICATIONS };
          expect(listes[demandee], q.prompt).toContain(bonne);
          q.choices.filter((choix) => choix !== bonne).forEach((choix) => expect(listes[demandee], `${q.prompt} → ${choix}`).not.toContain(choix));
          return;
        }
        const attendue = COMPARAISONS.includes(q.prompt) ? 'une comparaison' : METAPHORES.includes(q.prompt) ? 'une métaphore' : PERSONNIFICATIONS.includes(q.prompt) ? 'une personnification' : PHRASES_SANS_FIGURE.includes(q.prompt) ? 'aucune figure de style' : '?';
        expect(bonne, q.prompt).toBe(attendue);
      });
  });

  it('emprunts : le mot vient de la langue demandée, les trois autres d\'une autre langue', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'emprunt')
      .forEach(({ q }) => {
        const langue = (q.instruction ?? '').match(/(arabe|italien|anglais)/)?.[1] as 'arabe' | 'italien' | 'anglais';
        expect(EMPRUNTS[langue], q.instruction).toContain(q.choices[q.correctIndex]);
        q.choices.filter((_, indice) => indice !== q.correctIndex).forEach((mot) => expect(EMPRUNTS[langue], `${q.instruction} → ${mot}`).not.toContain(mot));
      });
  });

  it('dictionnaire : l\'abréviation et son sens, le mot qui est entre les deux mots repères et eux seuls', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'dictionnaire')
      .forEach(({ q }) => {
        const bonne = q.choices[q.correctIndex];
        if (q.prompt.startsWith('Mots repères')) {
          const [, debut, fin] = q.prompt.match(/« (.*) » et « (.*) »/) as string[];
          const entre = (mot: string) => sansAccent(mot) > sansAccent(debut) && sansAccent(mot) < sansAccent(fin);
          expect(entre(bonne), q.prompt).toBe(true);
          q.choices.filter((choix) => choix !== bonne).forEach((choix) => expect(entre(choix), `${q.prompt} → ${choix}`).toBe(false));
        } else {
          expect(ABREVIATIONS_DU_DICTIONNAIRE.find(([abreviation]) => abreviation === q.prompt)?.[1], q.prompt).toBe(bonne);
        }
      });
  });

  it('lettres qui manquent : les lettres de la liste, avec le mot de la phrase', () => {
    toutesLesQuestions
      .filter(({ q }) => famille(q) === 'lettres')
      .forEach(({ q }) => {
        const mot = MOTS_AVEC_TROU.find((candidat) => candidat.phrases.includes(q.prompt));
        expect(mot, q.prompt).toBeDefined();
        expect(q.choices[q.correctIndex], q.prompt).toBe(mot!.manque);
        expect([...q.choices].sort()).toEqual([mot!.manque, ...mot!.fautes].sort());
      });
  });

  it('chaque famille d\'une séance tire des questions différentes d\'un tirage à l\'autre', () => {
    cellules.forEach(([level, trimester]) => {
      const vus = new Set<string>();
      toutes(level, trimester, 12, GRAINES.slice(0, 20)).forEach((q) => vus.add(`${q.instruction}|${q.prompt}`));
      expect(vus.size, `${level} T${trimester}`).toBeGreaterThan(100);
    });
  });

  it('une séance de douze questions n\'a jamais deux fois le même énoncé', () => {
    cellules.forEach(([level, trimester]) =>
      GRAINES.slice(0, 20).forEach((graine) => {
        const questions = generate(level, trimester, createRng(graine), 12);
        expect(questions).toHaveLength(12);
        expect(new Set(questions.map((q) => `${q.instruction}|${q.prompt}`)).size, `${level} T${trimester} graine ${graine}`).toBe(12);
      })
    );
  });

  it('est reproductible : la même graine donne la même séance', () => {
    cellules.forEach(([level, trimester]) => expect(generate(level, trimester, createRng(77), 12)).toEqual(generate(level, trimester, createRng(77), 12)));
  });
});

// Les listes des deux cycles ne se mélangent pas.
describe('les mots de chaque cycle', () => {
  it('les mots des gabarits du cycle 2 sont ceux du cycle 2, ceux de la 6e ceux de la 6e', () => {
    GABARITS_CYCLE_2.filter((gabarit) => gabarit.progressif).forEach((gabarit) => expect(gabarit.parmi).toBe(MOTS_CYCLE_2));
    GABARITS_6E.filter((gabarit) => gabarit.progressif).forEach((gabarit) => expect(gabarit.parmi).toBe(MOTS_6E_REVISION));
  });

  it('« la / là » ne reviennent en 6e qu\'au 2e trimestre, avec « l\'a » et « l\'as »', () => {
    expect(MOTS_6E_REVISION).not.toContain('la');
    expect(MOTS_6E_REVISION).not.toContain('là');
    expect(GABARITS_6E.filter((gabarit) => gabarit.bonne === 'la').every((gabarit) => gabarit.depuis === 8)).toBe(true);
  });
});
