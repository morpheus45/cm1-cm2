import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { eligibleTenses, generate } from './conjugaison';
import { tempsDuVerbe, verbesDeLEtape, verbesEnseignes } from './conjugaisonNiveaux';
import {
  AUTRES_INFINITIFS_3E_GROUPE,
  ERREURS_DU_PRESENT,
  ETRE_ET_AVOIR,
  groupeDe,
  imperatifDe,
  IRREGULIERS_CE2_D_ABORD,
  IRREGULIERS_CE2_ENSUITE,
  VERBES_1ER_GROUPE_6E,
  VERBES_2E_GROUPE_6E,
  VERBES_3E_GROUPE_6E,
  VERBES_6E,
  VERBES_REGULIERS_CYCLE_2,
} from './conjugaisonVerbesNiveaux';
import { ALL_VERBS, PERSONS, type Person, type Tense, type Verb } from './conjugaisonVerbes';

/**
 * La conjugaison du CE1, du CE2 et de la 6e : ce que chaque niveau apprend à
 * chaque trimestre, ce qu'il ne doit pas voir, et, pour chaque famille de
 * questions, qu'une seule réponse est juste. Les tables sont comparées à celles
 * du programme (docs de référence « Banque de formes »), écrites ici en toutes
 * lettres et non recalculées.
 */

const NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const GRAINES = Array.from({ length: 60 }, (_, i) => i * 733 + 5);

function questionsDe(level: Level, trimester: Trimester, count = 24): Question[] {
  return GRAINES.flatMap((graine) => generate(level, trimester, createRng(graine), count));
}

const famille = (q: Question) => q.id.split('-')[1];
const verbeDe = (q: Question) => q.id.split('-')[3];

function verbesParInfinitif(level: Level): Map<string, Verb> {
  return new Map(verbesEnseignes(level).map((verbe) => [verbe.infinitive, verbe]));
}

/** Le temps d'une question, lu dans ce que l'élève voit ou dans l'identifiant. */
function tempsDe(q: Question): Tense | null {
  switch (famille(q)) {
    case 'forme':
      return /^Complète (?:au |à l')(.+?) — verbe/.exec(q.instruction ?? '')![1] as Tense;
    case 'temps':
      return q.choices[q.correctIndex] as Tense;
    case 'infinitif':
    case 'radical':
    case 'terminaison':
      return q.id.split('-').slice(4).join('-') as Tense;
    default:
      return null;
  }
}

/** La personne d'un sujet, lue sur le premier mot de l'énoncé. */
function personneDuSujet(prompt: string): Person {
  if (/^(Je|J')/.test(prompt)) return 'je';
  if (prompt.startsWith('Tu ')) return 'tu';
  if (prompt.startsWith('Nous ')) return 'nous';
  if (prompt.startsWith('Vous ')) return 'vous';
  if (/^(Ils|Elles|Les|Mes) /.test(prompt)) return 'ils';
  return 'il';
}

const formeSouligne = (prompt: string) => /\*\*(.+?)\*\*/.exec(prompt)![1];

// --- Les tables --------------------------------------------------------------

describe('les verbes irréguliers du CE2, comme dans le programme', () => {
  // « Banque de formes (verbes irréguliers du CE2) » : présent aux six
  // personnes, futur et imparfait à « je », participe passé.
  const BANQUE: [string, string[], string, string, string][] = [
    ['faire', ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], 'ferai', 'faisais', 'fait'],
    ['aller', ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], 'irai', 'allais', 'allé'],
    ['dire', ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], 'dirai', 'disais', 'dit'],
    ['venir', ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], 'viendrai', 'venais', 'venu'],
    ['pouvoir', ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], 'pourrai', 'pouvais', 'pu'],
    ['voir', ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], 'verrai', 'voyais', 'vu'],
    ['vouloir', ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], 'voudrai', 'voulais', 'voulu'],
    ['prendre', ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], 'prendrai', 'prenais', 'pris'],
  ];
  const verbes = new Map([...IRREGULIERS_CE2_D_ABORD, ...IRREGULIERS_CE2_ENSUITE].map((verbe) => [verbe.infinitive, verbe]));

  it.each(BANQUE)('%s', (infinitif, present, futur, imparfait, participe) => {
    const verbe = verbes.get(infinitif)!;
    expect(PERSONS.map((personne) => verbe.forms['présent'][personne])).toEqual(present);
    expect(verbe.forms['futur'].je).toBe(futur);
    expect(verbe.forms['imparfait'].je).toBe(imparfait);
    expect(verbe.forms['passé composé'].tu.split(' ')[1]).toBe(participe);
  });

  it('range les huit verbes dans l\'ordre du programme : quatre au premier trimestre, quatre au deuxième', () => {
    expect(IRREGULIERS_CE2_D_ABORD.map((verbe) => verbe.infinitive)).toEqual(['faire', 'aller', 'dire', 'venir']);
    expect(IRREGULIERS_CE2_ENSUITE.map((verbe) => verbe.infinitive)).toEqual(['pouvoir', 'voir', 'vouloir', 'prendre']);
  });

  it('ne conjugue aller et venir avec « être » qu\'au passé composé : « il est allé », « il est venu »', () => {
    expect(verbes.get('aller')!.forms['passé composé'].il).toBe('est allé');
    expect(verbes.get('venir')!.forms['passé composé'].il).toBe('est venu');
    expect(verbes.get('faire')!.forms['passé composé'].il).toBe('a fait');
  });
});

describe('être, avoir et « parler », comme dans la banque de formes du CE1', () => {
  const parler = VERBES_REGULIERS_CYCLE_2.find((verbe) => verbe.infinitive === 'parler')!;
  const [etre, avoir] = ETRE_ET_AVOIR;

  it('conjugue être au présent, à l\'imparfait et au futur', () => {
    expect(PERSONS.map((p) => etre.forms['présent'][p])).toEqual(['suis', 'es', 'est', 'sommes', 'êtes', 'sont']);
    expect(PERSONS.map((p) => etre.forms['futur'][p])).toEqual(['serai', 'seras', 'sera', 'serons', 'serez', 'seront']);
    expect(PERSONS.map((p) => etre.forms['imparfait'][p])).toEqual(['étais', 'étais', 'était', 'étions', 'étiez', 'étaient']);
    expect(etre.forms['passé composé'].je).toBe('ai été');
  });

  it('conjugue avoir au présent, à l\'imparfait et au futur', () => {
    expect(PERSONS.map((p) => avoir.forms['présent'][p])).toEqual(['ai', 'as', 'a', 'avons', 'avez', 'ont']);
    expect(PERSONS.map((p) => avoir.forms['futur'][p])).toEqual(['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront']);
    expect(PERSONS.map((p) => avoir.forms['imparfait'][p])).toEqual(['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient']);
    expect(avoir.forms['passé composé'].je).toBe('ai eu');
  });

  it('conjugue parler, le modèle du 1er groupe', () => {
    expect(PERSONS.map((p) => parler.forms['présent'][p])).toEqual(['parle', 'parles', 'parle', 'parlons', 'parlez', 'parlent']);
    expect(PERSONS.map((p) => parler.forms['futur'][p])).toEqual(['parlerai', 'parleras', 'parlera', 'parlerons', 'parlerez', 'parleront']);
    expect(PERSONS.map((p) => parler.forms['imparfait'][p])).toEqual(['parlais', 'parlais', 'parlait', 'parlions', 'parliez', 'parlaient']);
    expect(parler.forms['passé composé'].je).toBe('ai parlé');
  });
});

describe('les verbes de 6e', () => {
  const verbes = new Map(VERBES_6E.map((verbe) => [verbe.infinitive, verbe]));
  const forme = (infinitif: string, temps: Tense, personne: Person) => verbes.get(infinitif)!.forms[temps][personne];

  it('donne le passé simple aux 3es personnes, comme la banque de formes', () => {
    // « Passé simple, 3es personnes » : -a, -èrent ; -it, -irent ; et le 3e groupe.
    const attendu: [string, string, string][] = [
      ['chanter', 'chanta', 'chantèrent'],
      ['aller', 'alla', 'allèrent'],
      ['finir', 'finit', 'finirent'],
      ['être', 'fut', 'furent'],
      ['avoir', 'eut', 'eurent'],
      ['faire', 'fit', 'firent'],
      ['dire', 'dit', 'dirent'],
      ['voir', 'vit', 'virent'],
      ['venir', 'vint', 'vinrent'],
      ['pouvoir', 'put', 'purent'],
      ['vouloir', 'voulut', 'voulurent'],
      ['prendre', 'prit', 'prirent'],
    ];
    attendu.forEach(([infinitif, il, ils]) => {
      expect(forme(infinitif, 'passé simple', 'il'), `${infinitif} il`).toBe(il);
      expect(forme(infinitif, 'passé simple', 'ils'), `${infinitif} ils`).toBe(ils);
    });
  });

  it('donne le plus-que-parfait avec l\'imparfait de l\'auxiliaire, et le conditionnel avec le radical du futur', () => {
    expect(forme('chanter', 'plus-que-parfait', 'je')).toBe('avais chanté');
    expect(forme('finir', 'plus-que-parfait', 'ils')).toBe('avaient fini');
    expect(forme('chanter', 'conditionnel présent', 'je')).toBe('chanterais');
    expect(forme('être', 'conditionnel présent', 'il')).toBe('serait');
    expect(forme('aller', 'conditionnel présent', 'nous')).toBe('irions');
    expect(forme('faire', 'conditionnel présent', 'ils')).toBe('feraient');
  });

  // Les dix verbes du 3e groupe écrits pour la 6e, vérifiés sur des formes de référence.
  const references: [string, Tense, Person, string][] = [
    ['partir', 'présent', 'je', 'pars'],
    ['partir', 'présent', 'ils', 'partent'],
    ['partir', 'imparfait', 'nous', 'partions'],
    ['partir', 'futur', 'il', 'partira'],
    ['partir', 'passé simple', 'il', 'partit'],
    ['partir', 'passé simple', 'ils', 'partirent'],
    ['partir', 'conditionnel présent', 'tu', 'partirais'],
    ['partir', 'passé composé', 'il', 'est parti'],
    ['sortir', 'présent', 'tu', 'sors'],
    ['sortir', 'passé simple', 'ils', 'sortirent'],
    ['mettre', 'présent', 'il', 'met'],
    ['mettre', 'présent', 'nous', 'mettons'],
    ['mettre', 'imparfait', 'je', 'mettais'],
    ['mettre', 'futur', 'ils', 'mettront'],
    ['mettre', 'passé simple', 'il', 'mit'],
    ['mettre', 'passé simple', 'ils', 'mirent'],
    ['mettre', 'passé composé', 'ils', 'ont mis'],
    ['lire', 'présent', 'il', 'lit'],
    ['lire', 'présent', 'vous', 'lisez'],
    ['lire', 'futur', 'je', 'lirai'],
    ['lire', 'passé simple', 'il', 'lut'],
    ['lire', 'passé simple', 'ils', 'lurent'],
    ['lire', 'plus-que-parfait', 'il', 'avait lu'],
    ['écrire', 'présent', 'je', 'écris'],
    ['écrire', 'présent', 'nous', 'écrivons'],
    ['écrire', 'imparfait', 'ils', 'écrivaient'],
    ['écrire', 'futur', 'tu', 'écriras'],
    ['écrire', 'passé simple', 'il', 'écrivit'],
    ['écrire', 'passé simple', 'ils', 'écrivirent'],
    ['écrire', 'passé composé', 'nous', 'avons écrit'],
    ['savoir', 'présent', 'il', 'sait'],
    ['savoir', 'présent', 'ils', 'savent'],
    ['savoir', 'futur', 'je', 'saurai'],
    ['savoir', 'conditionnel présent', 'il', 'saurait'],
    ['savoir', 'passé simple', 'il', 'sut'],
    ['savoir', 'passé simple', 'ils', 'surent'],
    ['dormir', 'présent', 'il', 'dort'],
    ['dormir', 'imparfait', 'nous', 'dormions'],
    ['dormir', 'passé simple', 'ils', 'dormirent'],
    ['attendre', 'présent', 'il', 'attend'],
    ['attendre', 'présent', 'tu', 'attends'],
    ['attendre', 'futur', 'il', 'attendra'],
    ['attendre', 'passé simple', 'il', 'attendit'],
    ['attendre', 'passé composé', 'il', 'a attendu'],
    ['répondre', 'présent', 'je', 'réponds'],
    ['répondre', 'présent', 'il', 'répond'],
    ['répondre', 'passé simple', 'ils', 'répondirent'],
    ['répondre', 'passé composé', 'elles' as Person, 'ont répondu'],
    ['ouvrir', 'présent', 'tu', 'ouvres'],
    ['ouvrir', 'présent', 'ils', 'ouvrent'],
    ['ouvrir', 'futur', 'il', 'ouvrira'],
    ['ouvrir', 'passé simple', 'il', 'ouvrit'],
    ['ouvrir', 'passé composé', 'il', 'a ouvert'],
    ['applaudir', 'présent', 'nous', 'applaudissons'],
    ['applaudir', 'passé simple', 'il', 'applaudit'],
    ['réfléchir', 'imparfait', 'il', 'réfléchissait'],
    ['bâtir', 'présent', 'ils', 'bâtissent'],
    ['bâtir', 'passé composé', 'il', 'a bâti'],
  ];

  it.each(references.filter(([, , personne]) => PERSONS.includes(personne)))('%s au %s, %s : %s', (infinitif, temps, personne, attendue) => {
    expect(forme(infinitif, temps, personne)).toBe(attendue);
  });

  it('ne laisse pas deux verbes avec la même liste de formes, ni un infinitif en double', () => {
    const infinitifs = VERBES_6E.map((verbe) => verbe.infinitive);
    expect(new Set(infinitifs).size).toBe(infinitifs.length);
  });

  it('range chaque verbe dans son groupe : -er sauf aller, puis -issons, puis tous les autres', () => {
    // La liste des verbes du 2e groupe est écrite ici, à part de groupeDe.
    const deuxieme = ['finir', 'choisir', 'grandir', 'réussir', 'remplir', 'punir', 'rougir', 'guérir', 'nourrir', 'obéir', 'applaudir', 'réfléchir', 'ralentir', 'bâtir'];
    expect(VERBES_2E_GROUPE_6E.map((verbe) => verbe.infinitive).sort()).toEqual([...deuxieme].sort());
    VERBES_1ER_GROUPE_6E.forEach((verbe) => {
      expect(verbe.infinitive.endsWith('er'), verbe.infinitive).toBe(true);
      expect(groupeDe(verbe), verbe.infinitive).toBe(1);
    });
    VERBES_2E_GROUPE_6E.forEach((verbe) => expect(groupeDe(verbe), verbe.infinitive).toBe(2));
    VERBES_3E_GROUPE_6E.forEach((verbe) => expect(groupeDe(verbe), verbe.infinitive).toBe(3));
    expect(groupeDe(verbes.get('aller')!)).toBe(3);
    expect(groupeDe(verbes.get('partir')!)).toBe(3);
    expect(groupeDe(verbes.get('ouvrir')!)).toBe(3);
  });

  it('n\'a aucun verbe du 2e groupe parmi les autres infinitifs du 3e groupe', () => {
    // courir, cueillir, offrir… sont en -ir sans être du 2e groupe : ils servent de piège.
    const deuxieme = new Set(VERBES_2E_GROUPE_6E.map((verbe) => verbe.infinitive));
    AUTRES_INFINITIFS_3E_GROUPE.forEach((infinitif) => {
      expect(deuxieme.has(infinitif), infinitif).toBe(false);
      expect(infinitif.endsWith('er') && infinitif !== 'aller', infinitif).toBe(false);
    });
    const tous = [...VERBES_6E.map((verbe) => verbe.infinitive), ...AUTRES_INFINITIFS_3E_GROUPE];
    expect(new Set(tous).size).toBe(tous.length);
  });
});

describe('l\'impératif présent', () => {
  const verbes = new Map(VERBES_6E.map((verbe) => [verbe.infinitive, verbe]));

  it('suit la table de référence : -e sans s pour les verbes en -er, et ses cas particuliers', () => {
    const attendu: [string, string, string, string][] = [
      ['chanter', 'chante', 'chantons', 'chantez'],
      ['manger', 'mange', 'mangeons', 'mangez'],
      ['commencer', 'commence', 'commençons', 'commencez'],
      ['nettoyer', 'nettoie', 'nettoyons', 'nettoyez'],
      ['acheter', 'achète', 'achetons', 'achetez'],
      ['appeler', 'appelle', 'appelons', 'appelez'],
      ['finir', 'finis', 'finissons', 'finissez'],
      ['être', 'sois', 'soyons', 'soyez'],
      ['avoir', 'aie', 'ayons', 'ayez'],
      ['aller', 'va', 'allons', 'allez'],
      ['faire', 'fais', 'faisons', 'faites'],
      ['dire', 'dis', 'disons', 'dites'],
      ['venir', 'viens', 'venons', 'venez'],
      ['prendre', 'prends', 'prenons', 'prenez'],
      ['voir', 'vois', 'voyons', 'voyez'],
      ['mettre', 'mets', 'mettons', 'mettez'],
      ['ouvrir', 'ouvre', 'ouvrons', 'ouvrez'],
      ['partir', 'pars', 'partons', 'partez'],
    ];
    attendu.forEach(([infinitif, tu, nous, vous]) => {
      expect(imperatifDe(verbes.get(infinitif)!), infinitif).toEqual({ tu, nous, vous });
    });
  });

  it('n\'existe pas pour pouvoir, savoir et vouloir, ni pour les verbes qui ne s\'ordonnent pas', () => {
    ['pouvoir', 'savoir', 'vouloir', 'grandir', 'rougir', 'guérir'].forEach((infinitif) =>
      expect(imperatifDe(verbes.get(infinitif)!), infinitif).toBeNull()
    );
  });
});

// --- Le programme ------------------------------------------------------------

describe('les temps de chaque niveau et de chaque trimestre', () => {
  it('suit le CE1 : le présent, puis l\'imparfait et le futur, puis le passé composé', () => {
    expect(eligibleTenses('CE1', 1)).toEqual(['présent']);
    expect(eligibleTenses('CE1', 2)).toEqual(['présent', 'imparfait', 'futur']);
    expect(eligibleTenses('CE1', 3)).toEqual(['présent', 'imparfait', 'futur', 'passé composé']);
  });

  it('donne au CE2 les quatre temps du cycle 2 dès la rentrée, sans passé simple ni conditionnel', () => {
    ALL_TRIMESTERS.forEach((trimester) => {
      expect(eligibleTenses('CE2', trimester)).toEqual(['présent', 'imparfait', 'futur', 'passé composé']);
    });
  });

  it('suit la 6e : quatre temps, puis le passé simple et le plus-que-parfait, puis le conditionnel', () => {
    expect(eligibleTenses('6e', 1)).toEqual(['présent', 'imparfait', 'futur', 'passé composé']);
    expect(eligibleTenses('6e', 2)).toEqual(['présent', 'imparfait', 'futur', 'passé composé', 'passé simple', 'plus-que-parfait']);
    expect(eligibleTenses('6e', 3)).toEqual([
      'présent',
      'imparfait',
      'futur',
      'passé composé',
      'passé simple',
      'plus-que-parfait',
      'conditionnel présent',
    ]);
  });

  it('ne change rien aux autres niveaux : le CM et le cycle 4', () => {
    expect(eligibleTenses('CM1', 1)).toEqual(['présent']);
    expect(eligibleTenses('CM2', 3)).toHaveLength(7);
    expect(eligibleTenses('5e', 1)).toEqual([]);
    expect(eligibleTenses('3e', 3)).toEqual([]);
  });

  it('ne pose, à chaque trimestre, que des temps déjà enseignés', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        const enseignes = eligibleTenses(level, trimester);
        questionsDe(level, trimester).forEach((q) => {
          const temps = tempsDe(q);
          if (temps) expect(enseignes, `${level} T${trimester} : ${q.instruction} ${q.prompt}`).toContain(temps);
          if (famille(q) === 'forme' || famille(q) === 'temps') {
            // Ni la question ni une mauvaise réponse ne sortent du programme.
            q.choices.forEach((choice) => {
              if (famille(q) === 'temps') expect(enseignes, q.prompt).toContain(choice);
            });
          }
        });
      })
    );
  });
});

describe('les verbes de chaque niveau et de chaque trimestre', () => {
  // Les verbes et leurs temps, écrits d'après le programme et indépendamment du code.
  const TEMPS_CE: Tense[][] = [['présent'], ['présent', 'imparfait', 'futur'], ['présent', 'imparfait', 'futur', 'passé composé']];
  const SANS_PC: Tense[] = ['présent', 'imparfait', 'futur'];
  const QUATRE: Tense[] = ['présent', 'imparfait', 'futur', 'passé composé'];

  /** Pour chaque verbe du CE2, ses temps à chaque trimestre : faire, aller, dire et venir au présent
   *  d'abord ; pouvoir, voir, vouloir et prendre au deuxième trimestre ; le passé composé au troisième. */
  const CE2: Record<string, Tense[][]> = {
    faire: [['présent'], SANS_PC, QUATRE],
    aller: [['présent'], SANS_PC, QUATRE],
    dire: [['présent'], SANS_PC, QUATRE],
    venir: [['présent'], SANS_PC, QUATRE],
    pouvoir: [[], SANS_PC, QUATRE],
    voir: [[], SANS_PC, QUATRE],
    vouloir: [[], SANS_PC, QUATRE],
    prendre: [[], SANS_PC, QUATRE],
  };

  it('ne conjugue au CE1 qu\'être, avoir et des verbes du 1er groupe réguliers, avec leurs temps du trimestre', () => {
    ALL_TRIMESTERS.forEach((trimester) => {
      const attendus = TEMPS_CE[trimester - 1];
      const enseignes = new Set([...ETRE_ET_AVOIR, ...VERBES_REGULIERS_CYCLE_2].map((verbe) => verbe.infinitive));
      verbesDeLEtape('CE1', trimester).forEach((verbe) => expect(enseignes.has(verbe.infinitive), verbe.infinitive).toBe(true));
      verbesDeLEtape('CE1', trimester).forEach((verbe) => expect(tempsDuVerbe('CE1', trimester, verbe), verbe.infinitive).toEqual(attendus));
      questionsDe('CE1', trimester).forEach((q) => {
        if (famille(q) === 'groupe' || famille(q) === 'imperatif') throw new Error(`famille de 6e au CE1 : ${q.id}`);
        expect(enseignes.has(verbeDe(q)), `${verbeDe(q)} : ${q.prompt}`).toBe(true);
        const temps = tempsDe(q);
        if (temps) expect(attendus, `${q.instruction} ${q.prompt}`).toContain(temps);
      });
    });
  });

  it('ne laisse entrer au CE1 aucun verbe qui se conjugue avec « être », aucun verbe à radical particulier, aucun 2e groupe', () => {
    // Le programme ne cite que « parler » comme modèle ; l'accord du participe passé commence au CM1.
    const interdits = [
      'aller', 'venir', 'arriver', 'tomber', 'rester', 'partir', 'sortir', 'entrer', 'monter',
      'manger', 'nager', 'ranger', 'commencer', 'lancer', 'placer', 'nettoyer', 'employer', 'essuyer', 'acheter', 'lever', 'peser', 'appeler', 'jeter',
      'finir', 'choisir', 'grandir', 'réussir', 'remplir', 'punir', 'rougir',
      'faire', 'dire', 'pouvoir', 'voir', 'vouloir', 'prendre',
    ];
    const du = new Set(verbesEnseignes('CE1').map((verbe) => verbe.infinitive));
    interdits.filter((infinitif) => !['aller', 'venir', 'faire', 'dire', 'pouvoir', 'voir', 'vouloir', 'prendre'].includes(infinitif)).forEach((infinitif) => expect(du.has(infinitif), infinitif).toBe(false));
    VERBES_REGULIERS_CYCLE_2.forEach((verbe) => expect(verbe.canCompound, verbe.infinitive).toBe(true));
    VERBES_REGULIERS_CYCLE_2.forEach((verbe) => expect(verbe.forms['présent'].nous, verbe.infinitive).toBe(`${verbe.infinitive.slice(0, -2)}ons`));
    VERBES_REGULIERS_CYCLE_2.forEach((verbe) => expect(verbe.forms['imparfait'].je, verbe.infinitive).toBe(`${verbe.infinitive.slice(0, -2)}ais`));
  });

  it('ne conjugue au CE1 aucun des huit verbes irréguliers du CE2', () => {
    const huit = ['faire', 'aller', 'dire', 'venir', 'pouvoir', 'voir', 'vouloir', 'prendre'];
    ALL_TRIMESTERS.forEach((trimester) => {
      questionsDe('CE1', trimester).forEach((q) => expect(huit, `${q.id}`).not.toContain(verbeDe(q)));
    });
  });

  it('donne au CE2 ses huit verbes irréguliers dans l\'ordre du programme, trimestre par trimestre', () => {
    ALL_TRIMESTERS.forEach((trimester) => {
      Object.entries(CE2).forEach(([infinitif, temps]) => {
        const verbe = verbesEnseignes('CE2').find((candidate) => candidate.infinitive === infinitif)!;
        expect(tempsDuVerbe('CE2', trimester, verbe), `${infinitif} T${trimester}`).toEqual(temps[trimester - 1]);
      });
      questionsDe('CE2', trimester).forEach((q) => {
        const attendus = CE2[verbeDe(q)]?.[trimester - 1];
        const temps = tempsDe(q);
        if (attendus && temps) expect(attendus, `T${trimester} ${q.instruction} ${q.prompt}`).toContain(temps);
      });
    });
  });

  it('fait vraiment travailler les irréguliers au CE2 : au moins un tiers des formes à compléter', () => {
    ALL_TRIMESTERS.forEach((trimester) => {
      const irreguliers = new Set(['être', 'avoir', ...Object.keys(CE2)]);
      const formes = questionsDe('CE2', trimester).filter((q) => famille(q) === 'forme');
      const part = formes.filter((q) => irreguliers.has(verbeDe(q))).length / formes.length;
      expect(part, `CE2 T${trimester}`).toBeGreaterThan(0.33);
    });
  });

  it('fait travailler être et avoir au CE1 : au moins un cinquième des formes à compléter', () => {
    ALL_TRIMESTERS.forEach((trimester) => {
      const formes = questionsDe('CE1', trimester).filter((q) => famille(q) === 'forme');
      const part = formes.filter((q) => ['être', 'avoir'].includes(verbeDe(q))).length / formes.length;
      expect(part, `CE1 T${trimester}`).toBeGreaterThan(0.2);
    });
  });

  it('ne laisse aux deux niveaux du cycle 2 aucun verbe qui n\'est pas dans leurs listes', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) => {
      const connus = new Set(verbesEnseignes(level).map((verbe) => verbe.infinitive));
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester).forEach((q) => expect(connus.has(verbeDe(q)), `${level} : ${verbeDe(q)}`).toBe(true))
      );
    });
  });

  it('ne conjugue au CE2 aucun verbe du 2e groupe ni à radical particulier, et aucun autre verbe du 3e groupe', () => {
    const du = verbesEnseignes('CE2').map((verbe) => verbe.infinitive);
    ['finir', 'choisir', 'nager', 'manger', 'commencer', 'nettoyer', 'partir', 'mettre', 'lire', 'écrire', 'savoir', 'attendre'].forEach((infinitif) =>
      expect(du, infinitif).not.toContain(infinitif)
    );
  });

  it('pose en 6e des verbes des trois groupes', () => {
    const groupes = new Set<number>();
    ALL_TRIMESTERS.forEach((trimester) => {
      const verbes = verbesParInfinitif('6e');
      questionsDe('6e', trimester).forEach((q) => {
        if (['forme', 'temps', 'infinitif'].includes(famille(q))) groupes.add(groupeDe(verbes.get(verbeDe(q))!));
      });
    });
    expect([...groupes].sort()).toEqual([1, 2, 3]);
  });

  it('ne pose pas au CM les verbes ni les phrases de 6e : leurs listes restent à part', () => {
    const cm = new Set(ALL_VERBS.map((verbe) => verbe.infinitive));
    ['partir', 'sortir', 'mettre', 'lire', 'écrire', 'savoir', 'dormir', 'attendre', 'répondre', 'ouvrir', 'applaudir', 'réfléchir', 'ralentir', 'bâtir'].forEach((infinitif) =>
      expect(cm.has(infinitif), infinitif).toBe(false)
    );
  });
});

// --- Les personnes -----------------------------------------------------------

describe('les personnes', () => {
  it('conjugue les six personnes au CE1 : je, tu, il, nous, vous, ils', () => {
    const personnes = new Set<Person>();
    questionsDe('CE1', 1).forEach((q) => personnes.add(personneDuSujet(q.prompt)));
    expect([...personnes].sort()).toEqual([...PERSONS].sort());
  });

  it('ne conjugue le passé simple de 6e qu\'aux 3es personnes, en mauvaise réponse comme en bonne', () => {
    const verbes = verbesParInfinitif('6e');
    // Les formes du passé simple de « je », « tu », « nous » et « vous », sauf celles qui sont aussi
    // une forme enseignée d'un autre temps ou d'une autre personne (« je finis » est aussi un présent).
    const interdites = new Set<string>();
    verbes.forEach((verbe) => {
      const permises = new Set<string>([verbe.forms['passé composé'].tu.split(' ')[1]]);
      ALL_TENSES_6E.forEach((temps) => {
        if (temps !== 'passé simple') PERSONS.forEach((personne) => permises.add(verbe.forms[temps][personne]));
      });
      (['il', 'ils'] as Person[]).forEach((personne) => permises.add(verbe.forms['passé simple'][personne]));
      (['je', 'tu', 'nous', 'vous'] as Person[]).forEach((personne) => {
        const forme = verbe.forms['passé simple'][personne];
        if (!permises.has(forme)) interdites.add(forme);
      });
    });
    expect(interdites.size).toBeGreaterThan(30);
    [2, 3].forEach((trimester) =>
      questionsDe('6e', trimester as Trimester).forEach((q) => {
        q.choices.forEach((choix) => expect(interdites.has(choix), `${q.instruction} ${q.prompt} : ${choix}`).toBe(false));
        if (tempsDe(q) === 'passé simple') expect(personneDuSujet(q.prompt), q.prompt).toMatch(/^(il|ils)$/);
      })
    );
  });

  it('ne pose pas le passé simple ni le plus-que-parfait avant le deuxième trimestre de 6e, ni le conditionnel avant le troisième', () => {
    questionsDe('6e', 1).forEach((q) => {
      expect(['passé simple', 'plus-que-parfait', 'conditionnel présent'], q.prompt).not.toContain(tempsDe(q));
    });
    questionsDe('6e', 2).forEach((q) => {
      expect(['conditionnel présent'], q.prompt).not.toContain(tempsDe(q));
      expect(famille(q)).not.toBe('imperatif');
    });
  });

  it('ne propose jamais, même en mauvaise réponse, une forme d\'un temps qui n\'est pas encore enseigné', () => {
    // Chaque proposition d'une forme à compléter est une forme d'un temps déjà enseigné, ou l'une des
    // erreurs d'élève prévues (« faisez », « a chanter », « est aller », « a allé »).
    NIVEAUX.forEach((level) => {
      const verbes = verbesParInfinitif(level);
      ALL_TRIMESTERS.forEach((trimester) => {
        const enseignes = eligibleTenses(level, trimester);
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'forme')
          .forEach((q) => {
            const verbe = verbes.get(verbeDe(q))!;
            const permises = new Set<string>();
            enseignes.forEach((temps) => PERSONS.forEach((personne) => permises.add(verbe.forms[temps][personne])));
            Object.values(ERREURS_DU_PRESENT[verbe.infinitive] ?? {}).forEach((erreur) => permises.add(erreur as string));
            const participe = verbe.forms['passé composé'].tu.split(' ')[1];
            ['a', 'as', 'ai', 'avons', 'avez', 'ont', 'est', 'es'].forEach((auxiliaire) => {
              permises.add(`${auxiliaire} ${verbe.infinitive}`);
              permises.add(`${auxiliaire} ${participe}`);
            });
            q.choices.forEach((choix) => expect(permises.has(choix), `${level} T${trimester} : ${q.instruction} ${q.prompt} → ${choix}`).toBe(true));
          });
      });
    });
  });

  it('ne pose « aller » et « venir » au passé composé qu\'avec un sujet « il », sans accord à écrire', () => {
    questionsDe('CE2', 3).forEach((q) => {
      if (!['forme', 'temps', 'infinitif'].includes(famille(q)) || !['aller', 'venir'].includes(verbeDe(q))) return;
      if (tempsDe(q) !== 'passé composé') return;
      expect(q.prompt, q.prompt).toMatch(/^(Il|Paul|Tom|Hugo|Sami) /);
    });
    const vus = questionsDe('CE2', 3).filter((q) => famille(q) === 'forme' && tempsDe(q) === 'passé composé' && ['aller', 'venir'].includes(verbeDe(q)));
    expect(vus.length).toBeGreaterThan(5);
  });

  it('propose au passé composé d\'aller et venir l\'erreur classique d\'auxiliaire et celle de l\'infinitif', () => {
    const vus = questionsDe('CE2', 3).filter((q) => famille(q) === 'forme' && tempsDe(q) === 'passé composé' && verbeDe(q) === 'aller');
    expect(vus.length).toBeGreaterThan(0);
    vus.forEach((q) => {
      expect(q.choices[q.correctIndex]).toBe('est allé');
      expect(q.choices).toContain('a allé');
      expect(q.choices).toContain('est aller');
    });
  });

  it('ne laisse aucune forme du cycle 2 ou de la 6e porter un participe accordé qu\'on n\'enseigne pas', () => {
    // Pas d'accord du participe passé au cycle 2 : aucune forme en -ée, -és ou -ées dans ses choix.
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester).forEach((q) =>
          q.choices.forEach((choix) => expect(choix, `${level} : ${q.prompt}`).not.toMatch(/\s\p{L}+(ée|ées|és)$/u))
        )
      )
    );
  });
});

const ALL_TENSES_6E: Tense[] = ['présent', 'imparfait', 'futur', 'passé composé', 'passé simple', 'plus-que-parfait', 'conditionnel présent'];

// --- L'élision : « j'écoute », jamais « je écoute » ----------------------------

describe('l\'élision de « je »', () => {
  it('écrit « J\'... » devant une réponse qui commence par une voyelle ou un h muet, accentués compris', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'forme' && /^(Je|J')/.test(q.prompt))
          .forEach((q) => {
            const bonne = q.choices[q.correctIndex];
            const voyelle = /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(bonne);
            expect(q.prompt.startsWith("J'..."), `${level} : ${q.prompt} → ${bonne}`).toBe(voyelle);
            expect(q.prompt.startsWith('Je ...'), `${level} : ${q.prompt} → ${bonne}`).toBe(!voyelle);
          })
      )
    );
  });

  it('ne trahit pas la bonne réponse : avec « J\'... », toutes les propositions commencent par une voyelle', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'forme' && /^(Je|J')/.test(q.prompt))
          .forEach((q) => {
            const voyelle = (forme: string) => /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(forme);
            const premiere = voyelle(q.choices[q.correctIndex]);
            q.choices.forEach((choix) => expect(voyelle(choix), `${level} : ${q.prompt} → ${q.choices.join(' / ')}`).toBe(premiere));
          })
      )
    );
  });

  it('écrit « J\'écoute » et « J\'étais » : les voyelles accentuées s\'élident', () => {
    const phrases = new Set<string>();
    ALL_TRIMESTERS.forEach((trimester) =>
      questionsDe('CE2', trimester, 60).forEach((q) => {
        if (famille(q) === 'forme' && /^J'/.test(q.prompt) && /^[éè]/.test(q.choices[q.correctIndex])) phrases.add(q.prompt);
        if (famille(q) !== 'forme' && /\*\*/.test(q.prompt) && /^Je \*\*[éèêâîôûaeiouyh]/i.test(q.prompt)) throw new Error(`élision oubliée : ${q.prompt}`);
      })
    );
    expect(phrases.size).toBeGreaterThan(0);
  });

  it('élide aussi dans les phrases où le verbe est souligné', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => ['temps', 'infinitif', 'radical', 'terminaison'].includes(famille(q)))
          .forEach((q) => {
            expect(q.prompt, q.prompt).not.toMatch(/^Je \*\*[aeiouyàâäéèêëîïôöùûüœh]/i);
            expect(q.prompt, q.prompt).not.toMatch(/^J'\*\*[^aeiouyàâäéèêëîïôöùûüœh]/i);
          })
      )
    );
  });
});

// --- Une seule bonne réponse -------------------------------------------------

describe('forme à compléter : une seule bonne réponse', () => {
  it('a pour bonne réponse la forme du verbe, à ce temps et à cette personne, et pour mauvaises des formes différentes', () => {
    NIVEAUX.forEach((level) => {
      const verbes = verbesParInfinitif(level);
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'forme')
          .forEach((q) => {
            const verbe = verbes.get(verbeDe(q))!;
            const temps = tempsDe(q)!;
            const attendue = verbe.forms[temps][personneDuSujet(q.prompt)];
            expect(q.choices[q.correctIndex], `${level} : ${q.instruction} ${q.prompt}`).toBe(attendue);
            expect(q.choices.filter((choix) => choix === attendue), q.prompt).toHaveLength(1);
            // Le complément de l'énoncé est celui du verbe : la phrase se lit sans trou autre que le verbe.
            expect(q.prompt.endsWith(verbe.complement), q.prompt).toBe(true);
            expect(q.prompt.split('...').length - 1, q.prompt).toBe(1);
          })
      );
    });
  });

  it('ne propose jamais, en mauvaise réponse, une forme inventée qui pourrait être juste', () => {
    // « faisez », « allent »… n'existent pas : elles ne doivent être la forme d'aucun verbe.
    const toutes = new Set<string>();
    [...ALL_VERBS, ...VERBES_6E, ...VERBES_REGULIERS_CYCLE_2, ...ETRE_ET_AVOIR].forEach((verbe) =>
      Object.values(verbe.forms).forEach((table) => Object.values(table).forEach((forme) => toutes.add(forme)))
    );
    Object.entries(ERREURS_DU_PRESENT).forEach(([infinitif, erreurs]) =>
      Object.values(erreurs).forEach((erreur) => expect(toutes.has(erreur as string), `${infinitif} : ${erreur}`).toBe(false))
    );
  });

  it('met en garde contre « faisez » et « disez » au CE2, comme le programme', () => {
    const phrases = new Set<string>();
    ALL_TRIMESTERS.forEach((trimester) =>
      questionsDe('CE2', trimester, 60)
        .filter((q) => famille(q) === 'forme')
        .forEach((q) => q.choices.forEach((choix) => ['faisez', 'disez'].includes(choix) && phrases.add(choix)))
    );
    expect([...phrases].sort()).toEqual(['disez', 'faisez']);
  });
});

describe('reconnaître le temps : une seule bonne réponse', () => {
  it('ne propose jamais un autre temps qui donne la même forme (il remplit, il dit…)', () => {
    NIVEAUX.forEach((level) => {
      const verbes = [...verbesParInfinitif(level).values()];
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'temps')
          .forEach((q) => {
            const forme = formeSouligne(q.prompt);
            const bonne = q.choices[q.correctIndex] as Tense;
            const verbe = verbes.find((candidate) => candidate.infinitive === verbeDe(q))!;
            const personne = personneDuSujet(q.prompt);
            expect(verbe.forms[bonne][personne], q.prompt).toBe(forme);
            q.choices
              .filter((choix) => choix !== bonne)
              .forEach((autre) => expect(verbe.forms[autre as Tense][personne], `${q.prompt} : ${bonne} / ${autre}`).not.toBe(forme));
          })
      );
    });
  });

  it('ne pose cette question qu\'à partir de quatre temps enseignés', () => {
    expect(questionsDe('CE1', 1).some((q) => famille(q) === 'temps')).toBe(false);
    expect(questionsDe('CE1', 2).some((q) => famille(q) === 'temps')).toBe(false);
    expect(questionsDe('CE1', 3).some((q) => famille(q) === 'temps')).toBe(true);
    expect(questionsDe('CE2', 1).some((q) => famille(q) === 'temps')).toBe(true);
    expect(questionsDe('6e', 1).some((q) => famille(q) === 'temps')).toBe(true);
  });
});

describe('trouver l\'infinitif : une seule bonne réponse', () => {
  it('ne propose qu\'un seul verbe dont une forme est celle du verbe souligné', () => {
    NIVEAUX.forEach((level) => {
      const verbes = [...verbesParInfinitif(level).values()];
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'infinitif')
          .forEach((q) => {
            const forme = formeSouligne(q.prompt);
            const candidats = q.choices.filter((choix) =>
              verbes.some((verbe) => verbe.infinitive === choix && ALL_TENSES_6E.some((temps) => PERSONS.some((p) => verbe.forms[temps][p] === forme)))
            );
            expect(candidats, `${level} : ${q.prompt} → ${q.choices.join(' / ')}`).toEqual([verbeDe(q)]);
            expect(q.choices[q.correctIndex]).toBe(verbeDe(q));
          })
      );
    });
  });

  it('ne demande jamais l\'infinitif d\'un temps composé d\'être ou d\'avoir (« a été », « a eu »)', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'infinitif')
          .forEach((q) => expect(['être', 'avoir'].includes(verbeDe(q)) && /^(passé composé|plus-que-parfait)$/.test(tempsDe(q)!), q.prompt).toBe(false))
      )
    );
  });

  it('propose le participe en -é comme mauvaise réponse dès que le passé composé est enseigné', () => {
    const avecParticipe = (trimester: Trimester) =>
      questionsDe('CE1', trimester, 60).some((q) => famille(q) === 'infinitif' && q.choices.some((choix) => /é$/.test(choix)));
    expect(avecParticipe(1)).toBe(false);
    expect(avecParticipe(2)).toBe(false);
    expect(avecParticipe(3)).toBe(true);
  });
});

describe('le radical et la terminaison', () => {
  const TERMINAISONS: Record<string, Record<Person, string>> = {
    'présent': { je: 'e', tu: 'es', il: 'e', nous: 'ons', vous: 'ez', ils: 'ent' },
    'imparfait': { je: 'ais', tu: 'ais', il: 'ait', nous: 'ions', vous: 'iez', ils: 'aient' },
  };

  it('ne portent que sur des verbes réguliers du 1er groupe, au présent et à l\'imparfait', () => {
    const reguliers = new Set(VERBES_REGULIERS_CYCLE_2.map((verbe) => verbe.infinitive));
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => ['radical', 'terminaison'].includes(famille(q)))
          .forEach((q) => {
            expect(reguliers.has(verbeDe(q)), q.prompt).toBe(true);
            expect(Object.keys(TERMINAISONS), q.prompt).toContain(tempsDe(q));
          })
      )
    );
    NIVEAUX.filter((level) => level === '6e').forEach(() =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe('6e', trimester).forEach((q) => expect(['radical', 'terminaison'], q.id).not.toContain(famille(q)))
      )
    );
  });

  it('ont un seul radical juste : l\'infinitif privé de -er', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'radical')
          .forEach((q) => {
            const forme = formeSouligne(q.prompt);
            const infinitif = verbeDe(q);
            const radical = infinitif.slice(0, -2);
            const personne = personneDuSujet(q.prompt);
            expect(forme, q.prompt).toBe(`${radical}${TERMINAISONS[tempsDe(q)!][personne]}`);
            expect(q.choices[q.correctIndex], q.prompt).toBe(radical);
            expect(q.choices.filter((choix) => choix === radical)).toHaveLength(1);
            // Les mauvaises réponses coupent autrement : aucune n'est le radical.
            q.choices.filter((choix) => choix !== radical).forEach((choix) => expect(choix).not.toBe(radical));
          })
      )
    );
  });

  it('ont une seule terminaison juste : la fin du verbe, au temps et à la personne', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'terminaison')
          .forEach((q) => {
            const forme = formeSouligne(q.prompt);
            const attendue = TERMINAISONS[tempsDe(q)!][personneDuSujet(q.prompt)];
            expect(q.choices[q.correctIndex], q.prompt).toBe(`-${attendue}`);
            // Une seule proposition termine le verbe : « -e » ne termine pas « chantes ».
            const quiTerminent = q.choices.filter((choix) => forme.endsWith(choix.slice(1)));
            expect(quiTerminent, `${q.prompt} → ${q.choices.join(' / ')}`).toEqual([`-${attendue}`]);
          })
      )
    );
  });
});

describe('reconnaître le groupe d\'un verbe (6e)', () => {
  const DEUXIEME = ['finir', 'choisir', 'grandir', 'réussir', 'remplir', 'punir', 'rougir', 'guérir', 'nourrir', 'obéir', 'applaudir', 'réfléchir', 'ralentir', 'bâtir'];
  /** Le groupe d'un infinitif, écrit ici : -er sauf aller, la liste du 2e groupe, tous les autres. */
  const groupeAttendu = (infinitif: string) => (infinitif !== 'aller' && infinitif.endsWith('er') ? 1 : DEUXIEME.includes(infinitif) ? 2 : 3);

  it('ne propose qu\'un seul verbe du groupe demandé', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questionsDe('6e', trimester)
        .filter((q) => famille(q) === 'groupe')
        .forEach((q) => {
          const demande = Number(/du (\d)(?:er|e) groupe/.exec(q.instruction ?? '')![1]);
          expect(q.choices.filter((choix) => groupeAttendu(choix) === demande), `${q.instruction} ${q.prompt}`).toHaveLength(1);
          expect(groupeAttendu(q.choices[q.correctIndex])).toBe(demande);
          expect(q.prompt).toBe(q.choices.join(' – '));
        })
    );
  });

  it('ne propose ni être ni avoir, que les manuels rangent différemment', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questionsDe('6e', trimester)
        .filter((q) => famille(q) === 'groupe')
        .forEach((q) => expect(q.choices.some((choix) => ['être', 'avoir'].includes(choix)), q.prompt).toBe(false))
    );
  });

  it('piège avec les verbes en -ir du 3e groupe et avec « aller »', () => {
    const vus = new Set<string>();
    questionsDe('6e', 3, 60)
      .filter((q) => famille(q) === 'groupe')
      .forEach((q) => q.choices.forEach((choix) => vus.add(choix)));
    ['aller', 'partir', 'courir', 'ouvrir'].forEach((infinitif) => expect(vus.has(infinitif), infinitif).toBe(true));
  });

  it('n\'arrive pas au CE1 ni au CE2', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => expect(questionsDe(level, trimester).some((q) => famille(q) === 'groupe')).toBe(false))
    );
  });
});

describe('l\'impératif présent (6e, 3e trimestre)', () => {
  it('n\'est posé qu\'au 3e trimestre de la 6e', () => {
    expect(questionsDe('6e', 1).some((q) => famille(q) === 'imperatif')).toBe(false);
    expect(questionsDe('6e', 2).some((q) => famille(q) === 'imperatif')).toBe(false);
    expect(questionsDe('6e', 3).some((q) => famille(q) === 'imperatif')).toBe(true);
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => expect(questionsDe(level, trimester).some((q) => famille(q) === 'imperatif')).toBe(false))
    );
  });

  it('ne propose qu\'une forme juste, jamais la forme de « nous » ni celle d\'un autre destinataire', () => {
    const verbes = verbesParInfinitif('6e');
    questionsDe('6e', 3)
      .filter((q) => famille(q) === 'imperatif')
      .forEach((q) => {
        const imperatif = imperatifDe(verbes.get(verbeDe(q))!)!;
        const pluriel = /^(Les|Mes) /.test(q.prompt);
        const juste = pluriel ? imperatif.vous : imperatif.tu;
        expect(q.choices[q.correctIndex], q.prompt).toBe(juste);
        expect(q.choices.filter((choix) => choix === juste)).toHaveLength(1);
        // Ni « nous » (« Léa, chantons ! » est une phrase juste), ni « vous » pour une seule
        // personne (« Léa, chantez ! » se dit, par politesse).
        expect(q.choices, q.prompt).not.toContain(imperatif.nous);
        if (!pluriel && imperatif.vous !== juste) expect(q.choices, `${q.prompt} : ${imperatif.vous}`).not.toContain(imperatif.vous);
        expect(q.prompt, q.prompt).toMatch(/^[\p{L}' ]+, \.\.\. .+ !$/u);
      });
  });

  it('met en garde contre le « s » de « tu chantes » et contre « faisez »', () => {
    const vues = questionsDe('6e', 3, 60).filter((q) => famille(q) === 'imperatif');
    expect(vues.some((q) => q.choices.includes('chantes') && q.choices[q.correctIndex] === 'chante')).toBe(true);
    expect(vues.some((q) => q.choices.includes('faisez') && q.choices[q.correctIndex] === 'faites')).toBe(true);
  });
});

// --- Les phrases -------------------------------------------------------------

describe('les phrases des verbes', () => {
  // Des limites de mots qui connaissent les lettres accentuées (« piéton » ne contient pas « ton »).
  const POSSESSIFS = /(?<!\p{L})(son|sa|ses|ton|ta|tes|leur|leurs|notre|nos|votre|vos|mon|ma|mes)(?!\p{L})/iu;
  const TEMPS_DE_LA_PHRASE =
    /(?<!\p{L})(hier|demain|aujourd'hui|maintenant|bientôt|autrefois|jadis|déjà|toujours|souvent|parfois|jamais|ce matin|ce soir|cet après-midi|tout à l'heure|la semaine|l'année|ensuite|puis|enfin|d'abord|longtemps)(?!\p{L})/iu;
  const listes: [string, Verb[]][] = [
    ['du CE1 et du CE2', [...ETRE_ET_AVOIR, ...VERBES_REGULIERS_CYCLE_2, ...IRREGULIERS_CE2_D_ABORD, ...IRREGULIERS_CE2_ENSUITE]],
    ['de la 6e', VERBES_6E],
  ];

  it.each(listes)('aucune phrase %s ne porte un possessif : elle sert à tous les sujets', (_nom, verbes) => {
    verbes.forEach((verbe) => expect(verbe.complement, verbe.infinitive).not.toMatch(POSSESSIFS));
  });

  it.each(listes)('aucune phrase %s ne porte d\'indicateur de temps : elle sert à tous les temps', (_nom, verbes) => {
    verbes.forEach((verbe) => expect(verbe.complement, verbe.infinitive).not.toMatch(TEMPS_DE_LA_PHRASE));
  });

  it.each(listes)('aucune phrase %s n\'est pronominale, et chacune se termine par un point', (_nom, verbes) => {
    verbes.forEach((verbe) => {
      // « en classe », « en ville » sont des prépositions : seuls les pronoms réfléchis sont exclus.
      expect(verbe.complement, verbe.infinitive).not.toMatch(/^(se |s'|me |m'|te |t'|nous |vous )/i);
      expect(verbe.complement.endsWith('.'), verbe.infinitive).toBe(true);
    });
  });

  it('écrit pour le CE1 des phrases très courtes : cinq mots au plus pour un énoncé, quatre pour une proposition', () => {
    const mots = (texte: string) => texte.split(/\s+/).filter((mot) => /[\p{L}\d]/u.test(mot));
    ALL_TRIMESTERS.forEach((trimester) =>
      questionsDe('CE1', trimester).forEach((q) => {
        expect(mots(q.prompt).length, q.prompt).toBeLessThanOrEqual(7);
        q.choices.forEach((choix) => expect(mots(choix).length, choix).toBeLessThanOrEqual(3));
      })
    );
    VERBES_REGULIERS_CYCLE_2.forEach((verbe) => expect(mots(verbe.complement).length, verbe.infinitive).toBeLessThanOrEqual(4));
  });

  it('n\'a pour la 6e aucun sujet qui se retrouve dans la phrase du verbe : « le professeur obéit aux consignes du professeur »', () => {
    // Les sujets de 6e : jamais un mot que les compléments de 6e emploient.
    const sujets = new Set<string>();
    questionsDe('6e', 1, 60)
      .filter((q) => ['forme', 'temps', 'infinitif'].includes(famille(q)))
      .forEach((q) => sujets.add(q.prompt.split(/ \*\*|\.\.\./)[0].trim()));
    const complements = VERBES_6E.map((verbe) => verbe.complement).join(' ');
    [...sujets]
      .filter((sujet) => !/^(Je|J'|Tu|Il|Elle|On|Nous|Vous|Ils|Elles)$/.test(sujet))
      .forEach((sujet) => {
        const nom = sujet.replace(/^(Les|Mes|Ma|Mon|La|Le|L') ?/, '').split(' ')[0];
        if (nom.length > 3) expect(complements.includes(nom), sujet).toBe(false);
      });
  });
});

describe('le niveau d\'un enfant de sept ans', () => {
  it('n\'emploie, au CE1, aucun mot plus long que douze lettres', () => {
    ALL_TRIMESTERS.forEach((trimester) =>
      questionsDe('CE1', trimester).forEach((q) =>
        [q.instruction ?? '', q.prompt, ...q.choices].join(' ').split(/[\s'’-]+/).forEach((mot) =>
          expect(mot.replace(/[^\p{L}]/gu, '').length, `${mot} dans ${q.prompt}`).toBeLessThanOrEqual(12)
        )
      )
    );
  });
});
