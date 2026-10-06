import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { ALL_TRIMESTERS, type Level, type Question, type Trimester } from '../types';
import { generate } from './accords';
import {
  ADJECTIFS_CYCLE_2,
  COUPLES_MASCULIN_FEMININ,
  formeDeLAdjectif,
  NOMS_CYCLE_2,
  type AdjectifEcrit,
  type Genre,
  type NomEcrit,
  type Nombre,
} from './accordsLexiqueCycle2';
import {
  ADJECTIFS_6E,
  ANIMAUX_DOMESTIQUES,
  complementsPourPersonne,
  COMPLEMENTS_D_ANIMAUX,
  COMPLEMENTS_PAR_CATEGORIE,
  NOMS_6E,
  PARTICIPES_AVEC_AVOIR,
  PARTICIPES_AVEC_ETRE,
  SCENES,
} from './accordsLexiqueSixieme';
import { ADJECTIVES, NOUNS } from './accordsLexique';

/**
 * Les accords du CE1, du CE2 et de la 6e : ce que chaque niveau apprend à chaque
 * trimestre, ce qu'il ne doit pas voir, et, pour chacune des familles de
 * questions, qu'une seule réponse est juste.
 *
 * Les genres et les pluriels des noms sont comparés à une seconde liste, écrite
 * ici à part ; les formes des adjectifs à une règle et à ses exceptions. Une
 * faute de frappe dans un lexique ne peut ainsi pas se retrouver dans une
 * question sans que ces tests ne la voient.
 */

const NIVEAUX: Level[] = ['CE1', 'CE2', '6e'];
const GRAINES = Array.from({ length: 50 }, (_, i) => i * 733 + 9);

function questionsDe(level: Level, trimester: Trimester, count = 24): Question[] {
  return GRAINES.flatMap((graine) => generate(level, trimester, createRng(graine), count));
}

const famille = (q: Question) => q.id.split('-')[1];
const bonne = (q: Question) => q.choices[q.correctIndex];

// --- Les lexiques, contrôlés à part ----------------------------------------------------------------

/** Les noms du cycle 2 et de la 6e, genre par genre : une seconde saisie, indépendante des lexiques. */
const MASCULINS = new Set(
  (
    'garçon voisin ami copain cousin frère roi bébé papa clown pirate chat chien lapin coq cochon mouton âne canard poisson lion tigre singe loup renard ' +
    'éléphant escargot papillon serpent livre cahier stylo crayon cartable ballon jouet sac panier bol verre lit pantalon bonnet gant pull vélo camion avion ' +
    'train tracteur bonbon fromage biscuit pain chocolat arbre sapin jardin parc pont oiseau cheval animal rideau drapeau tableau couteau chapeau manteau ' +
    'bijou caillou journal jeu bateau gâteau chou château voyageur directeur champion oncle boulanger infirmier chanteur ordinateur instrument outil ' +
    'miroir musée village gymnase stade cinéma marché hôpital lac orage paysage champ nuage voyage exposé exercice spectacle concert film documentaire ' +
    'légume fruit dessert cygne'
  ).split(' ')
);
const FEMININS = new Set(
  (
    'fille voisine amie copine cousine sœur reine maman fée dame chatte chienne lapine poule vache lionne girafe tortue grenouille abeille fourmi mouche ' +
    'araignée chèvre trousse règle gomme poupée chaise table lampe tasse assiette bouteille fourchette porte armoire maison robe écharpe chaussure chaussette ' +
    'jupe veste voiture moto trottinette fusée pomme poire banane fraise cerise orange carotte tomate glace confiture soupe tarte crêpe salade pizza omelette ' +
    'fleur feuille branche tulipe école ville rue route classe gare forêt plage montagne voyageuse directrice championne tante boulangère infirmière chanteuse ' +
    'valise fenêtre horloge bibliothèque place cabane église rivière tempête colline vague aventure leçon sortie visite fête'
  ).split(' ')
);

describe('les noms du cycle 2 et de la 6e, vérifiés sur une seconde liste', () => {
  it.each([
    ['du cycle 2', NOMS_CYCLE_2],
    ['de la 6e', NOMS_6E],
  ] as [string, NomEcrit[]][])('donne à chaque nom %s le genre de la seconde liste', (_nom, noms) => {
    noms.forEach((nom) => {
      const attendu = MASCULINS.has(nom.singulier) ? 'm' : FEMININS.has(nom.singulier) ? 'f' : null;
      expect(attendu, `« ${nom.singulier} » est absent de la seconde liste`).not.toBeNull();
      expect(nom.genre, nom.singulier).toBe(attendu);
    });
    // Un mot n'est jamais dans les deux listes.
    expect([...MASCULINS].filter((mot) => FEMININS.has(mot))).toEqual([]);
  });

  /** Les noms au pluriel qui ne sont pas en -s : écrits en toutes lettres. */
  const PLURIELS_IRREGULIERS: Record<string, string> = {
    oiseau: 'oiseaux', cheval: 'chevaux', animal: 'animaux', rideau: 'rideaux', drapeau: 'drapeaux', tableau: 'tableaux', couteau: 'couteaux',
    chapeau: 'chapeaux', manteau: 'manteaux', bijou: 'bijoux', caillou: 'cailloux', journal: 'journaux', jeu: 'jeux', bateau: 'bateaux',
    gâteau: 'gâteaux', chou: 'choux', château: 'châteaux', hôpital: 'hôpitaux',
  };

  it.each([
    ['du cycle 2', NOMS_CYCLE_2],
    ['de la 6e', NOMS_6E],
  ] as [string, NomEcrit[]][])('écrit correctement le pluriel de chaque nom %s', (_nom, noms) => {
    noms.forEach((nom) => {
      const attendu = PLURIELS_IRREGULIERS[nom.singulier] ?? `${nom.singulier}s`;
      expect(nom.pluriel, nom.singulier).toBe(attendu);
      expect(nom.pluriel, `${nom.singulier} s'écrit pareil au pluriel`).not.toBe(nom.singulier);
    });
  });

  it('ne compte aucun nom en double, ni aucun mot que les rectifications de 1990 ont changé', () => {
    [NOMS_CYCLE_2, NOMS_6E].forEach((noms) => {
      const singuliers = noms.map((nom) => nom.singulier);
      expect(new Set(singuliers).size).toBe(singuliers.length);
    });
    // Un mot à deux graphies ne sert jamais de question : maître, boîte, île, flûte, coût, goût, connaître…
    const rectifies = ['maître', 'maîtresse', 'boîte', 'île', 'flûte', 'coût', 'goût', 'goûter', 'évènement', 'oignon', 'nénuphar', 'chariot', 'dîner', 'cuiller', 'match', 'matchs'];
    [...NOMS_CYCLE_2, ...NOMS_6E].forEach((nom) => expect(rectifies).not.toContain(nom.singulier));
    [...ADJECTIFS_CYCLE_2, ...ADJECTIFS_6E].forEach((adjectif) => expect(rectifies).not.toContain(adjectif.masculinSingulier));
  });

  it('ne contient aucun nom que le CM1 ou le CM2 seuls enseignent : les listes restent à part', () => {
    // Les listes du CM (accordsLexique.ts) ont leurs mots ; une liste du cycle 2 qui réutilise un mot
    // le réécrit. Elles ne partagent ni objet ni référence.
    const duCM = new Set<unknown>([...NOUNS, ...ADJECTIVES]);
    [...NOMS_CYCLE_2, ...NOMS_6E, ...ADJECTIFS_CYCLE_2, ...ADJECTIFS_6E].forEach((mot) => expect(duCM.has(mot)).toBe(false));
  });
});

describe('les adjectifs du cycle 2 et de la 6e, vérifiés sur une règle et ses exceptions', () => {
  /** Masculin singulier → féminin singulier, masculin pluriel, féminin pluriel, quand la règle ne suffit pas. */
  const EXCEPTIONS: Record<string, [string, string, string]> = {
    gentil: ['gentille', 'gentils', 'gentilles'],
    bon: ['bonne', 'bons', 'bonnes'],
    blanc: ['blanche', 'blancs', 'blanches'],
    gris: ['grise', 'gris', 'grises'],
    long: ['longue', 'longs', 'longues'],
    neuf: ['neuve', 'neufs', 'neuves'],
    heureux: ['heureuse', 'heureux', 'heureuses'],
    joyeux: ['joyeuse', 'joyeux', 'joyeuses'],
    délicieux: ['délicieuse', 'délicieux', 'délicieuses'],
    beau: ['belle', 'beaux', 'belles'],
    nouveau: ['nouvelle', 'nouveaux', 'nouvelles'],
    vieux: ['vieille', 'vieux', 'vieilles'],
    sec: ['sèche', 'secs', 'sèches'],
    premier: ['première', 'premiers', 'premières'],
    dernier: ['dernière', 'derniers', 'dernières'],
    mauvais: ['mauvaise', 'mauvais', 'mauvaises'],
    gros: ['grosse', 'gros', 'grosses'],
    courageux: ['courageuse', 'courageux', 'courageuses'],
    curieux: ['curieuse', 'curieux', 'curieuses'],
    sportif: ['sportive', 'sportifs', 'sportives'],
    actif: ['active', 'actifs', 'actives'],
    fier: ['fière', 'fiers', 'fières'],
    léger: ['légère', 'légers', 'légères'],
    doux: ['douce', 'doux', 'douces'],
    ponctuel: ['ponctuelle', 'ponctuels', 'ponctuelles'],
    musical: ['musicale', 'musicaux', 'musicales'],
  };

  /** La règle : féminin en -e, pluriel en -s (sauf si le mot finit déjà par -s ou -x). */
  function attendues(masculin: string): [string, string, string] {
    if (EXCEPTIONS[masculin]) return EXCEPTIONS[masculin];
    const feminin = masculin.endsWith('e') ? masculin : `${masculin}e`;
    return [feminin, `${masculin}s`, `${feminin}s`];
  }

  it.each([
    ['du cycle 2', ADJECTIFS_CYCLE_2],
    ['de la 6e', ADJECTIFS_6E],
  ] as [string, AdjectifEcrit[]][])('écrit correctement les quatre formes de chaque adjectif %s', (_nom, adjectifs) => {
    adjectifs.forEach((adjectif) => {
      const [fs, mp, fp] = attendues(adjectif.masculinSingulier);
      expect([adjectif.femininSingulier, adjectif.masculinPluriel, adjectif.femininPluriel], adjectif.masculinSingulier).toEqual([fs, mp, fp]);
    });
  });

  it('place chaque adjectif comme on le dit : les couleurs et les états après le nom, la taille et la qualité avant', () => {
    const AVANT = ['petit', 'grand', 'joli', 'gentil', 'bon', 'long', 'beau', 'nouveau', 'vieux', 'premier', 'dernier', 'mauvais', 'gros', 'jeune'];
    [...ADJECTIFS_CYCLE_2, ...ADJECTIFS_6E].forEach((adjectif) =>
      expect(adjectif.position, adjectif.masculinSingulier).toBe(AVANT.includes(adjectif.masculinSingulier) ? 'avant' : 'après')
    );
  });

  it('donne « bel », « nouvel », « vieil » aux trois adjectifs qui les prennent, et à eux seuls', () => {
    const avecForme = [...ADJECTIFS_CYCLE_2, ...ADJECTIFS_6E].filter((adjectif) => adjectif.formeDevantVoyelle);
    expect(new Set(avecForme.map((adjectif) => `${adjectif.masculinSingulier}>${adjectif.formeDevantVoyelle}`))).toEqual(
      new Set(['beau>bel', 'nouveau>nouvel', 'vieux>vieil'])
    );
  });

  it('ne qualifie jamais une personne par une couleur, ni un animal par une couleur qui ne se dit pas', () => {
    const couleurs = ['noir', 'vert', 'rouge', 'jaune', 'rose', 'bleu', 'blanc', 'gris'];
    ADJECTIFS_CYCLE_2.filter((adjectif) => couleurs.includes(adjectif.masculinSingulier)).forEach((adjectif) => {
      expect(adjectif.categories, adjectif.masculinSingulier).not.toContain('personne');
      if (!['noir', 'blanc', 'gris'].includes(adjectif.masculinSingulier)) expect(adjectif.categories, adjectif.masculinSingulier).not.toContain('animal');
    });
  });
});

describe('les paires d\'un adjectif et d\'un nom qui sonnent faux', () => {
  /** Chaque paire est un défaut trouvé à la relecture, ou un défaut du même genre : aucune ne doit pouvoir sortir. */
  const PAIRES_ABSURDES: [string, string][] = [
    ['gros', 'plage'], ['gros', 'rivière'], ['gros', 'forêt'], ['gros', 'montagne'], ['gros', 'paysage'],
    ['léger', 'horloge'], ['léger', 'fenêtre'],
    ['long', 'école'], ['long', 'ville'], ['long', 'classe'], ['long', 'montagne'], ['long', 'gare'],
    ['vieux', 'orage'], ['vieux', 'tempête'], ['vieux', 'vague'], ['vieux', 'nuage'],
    ['nouveau', 'château'], ['nouveau', 'village'],
    ['bon', 'église'], ['bon', 'gare'], ['bon', 'pont'], ['bon', 'château'], ['bon', 'ville'],
    ['doux', 'serpent'], ['doux', 'tigre'], ['doux', 'lion'], ['doux', 'loup'],
    ['bruyant', 'tortue'], ['bruyant', 'girafe'],
    ['sec', 'soupe'], ['sec', 'glace'], ['sec', 'confiture'], ['sec', 'pomme'],
    ['chaud', 'glace'], ['chaud', 'pomme'], ['froid', 'pomme'], ['froid', 'bonbon'],
    ['rouge', 'garçon'], ['vert', 'fille'], ['bleu', 'chat'], ['rose', 'chien'], ['jaune', 'lapin'],
    ['noir', 'voisin'], ['blanc', 'maman'], ['gris', 'ami'],
    ['sportif', 'orage'], ['musical', 'orage'], ['musical', 'cahier'], ['courageux', 'orage'],
    ['content', 'table'], ['heureux', 'pomme'], ['fort', 'jardin'], ['timide', 'maison'], ['fatigué', 'cahier'],
    ['rapide', 'pomme'], ['délicieux', 'cahier'], ['neuf', 'chat'], ['neuf', 'garçon'],
    // Les groupes qui ont un autre sens : « une petite amie », « un vieux garçon », « une bonne sœur », « un beau frère ».
    ['petit', 'ami'], ['petit', 'amie'], ['petit', 'copain'], ['petit', 'copine'], ['petit', 'oncle'], ['petit', 'tante'], ['grand', 'oncle'], ['grand', 'tante'],
    ['vieux', 'garçon'], ['vieux', 'fille'], ['bon', 'sœur'], ['beau', 'frère'], ['beau', 'sœur'], ['beau', 'maman'], ['beau', 'papa'],
  ];

  it.each([
    ['du cycle 2', ADJECTIFS_CYCLE_2, NOMS_CYCLE_2],
    ['de la 6e', ADJECTIFS_6E, NOMS_6E],
  ] as [string, AdjectifEcrit[], NomEcrit[]][])('ne peut croiser aucune de ces paires dans les listes %s', (_nom, adjectifs, noms) => {
    PAIRES_ABSURDES.forEach(([masculin, singulier]) => {
      const adjectif = adjectifs.find((candidat) => candidat.masculinSingulier === masculin);
      const nom = noms.find((candidat) => candidat.singulier === singulier);
      if (!adjectif || !nom) return;
      const permis = adjectif.categories.includes(nom.categorie) && !(adjectif.sauf ?? []).includes(nom.singulier);
      expect(permis, `« ${masculin} » ne se dit pas de « ${singulier} »`).toBe(false);
    });
  });

  it('ne pose, dans aucune question, un groupe qui change de sens : « une petite amie », « un vieux garçon », « une bonne sœur », « un beau frère »', () => {
    const autreSens = /(?<![\p{L}])(petit|petite|petits|petites)\s+(ami|amie|amis|amies|copain|copine|copains|copines|oncles?|tantes?)(?![\p{L}])|(?<![\p{L}])(grand|grande|grands|grandes)\s+(oncles?|tantes?)(?![\p{L}])|(?<![\p{L}])(vieux|vieille|vieilles)\s+(garçons?|filles?)(?![\p{L}])|(?<![\p{L}])(bon|bonne|bons|bonnes)\s+sœurs?(?![\p{L}])|(?<![\p{L}])(beau|bel|belle|beaux|belles)\s+(frères?|sœurs?|mamans?|papas?)(?![\p{L}])/iu;
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester, 40).forEach((q) =>
          expect(`${q.prompt} ${q.choices.join(' / ')}`, `${level} T${trimester}`).not.toMatch(autreSens)
        )
      )
    );
  });

  it('ne laisse, parmi les adjectifs de couleur, que des noms qu\'on peut colorier : objets, vêtements, véhicules, maisons', () => {
    const couleurs = ['vert', 'rouge', 'jaune', 'rose', 'bleu', 'neuf'];
    ADJECTIFS_CYCLE_2.filter((adjectif) => couleurs.includes(adjectif.masculinSingulier)).forEach((adjectif) => {
      expect(adjectif.categories.sort(), adjectif.masculinSingulier).toEqual(['colorable', 'vehicule']);
    });
  });
});

// --- Les index pour vérifier les questions ---------------------------------------------------------------

interface NomRepere {
  nom: NomEcrit;
  nombre: Nombre;
}

function indexDesNoms(noms: NomEcrit[]): Map<string, NomRepere[]> {
  const index = new Map<string, NomRepere[]>();
  noms.forEach((nom) =>
    (['singulier', 'pluriel'] as Nombre[]).forEach((nombre) => {
      const forme = nombre === 'singulier' ? nom.singulier : nom.pluriel;
      index.set(forme, [...(index.get(forme) ?? []), { nom, nombre }]);
    })
  );
  return index;
}

const GENRES: Genre[] = ['m', 'f'];
const NOMBRES: Nombre[] = ['singulier', 'pluriel'];

/** Les cases (genre, nombre) qu'occupe un mot comme forme d'un des adjectifs. */
function indexDesAdjectifs(adjectifs: AdjectifEcrit[]): Map<string, { genre: Genre; nombre: Nombre }[]> {
  const index = new Map<string, { genre: Genre; nombre: Nombre }[]>();
  adjectifs.forEach((adjectif) =>
    GENRES.forEach((genre) =>
      NOMBRES.forEach((nombre) => {
        const mot = formeDeLAdjectif(adjectif, genre, nombre);
        index.set(mot, [...(index.get(mot) ?? []), { genre, nombre }]);
      })
    )
  );
  return index;
}

const NOMS_DU: Record<Level, NomEcrit[]> = { CE1: NOMS_CYCLE_2, CE2: NOMS_CYCLE_2, '6e': NOMS_6E, CM1: [], CM2: [], '5e': [], '4e': [], '3e': [] };
const ADJECTIFS_DU: Record<Level, AdjectifEcrit[]> = {
  CE1: ADJECTIFS_CYCLE_2,
  CE2: ADJECTIFS_CYCLE_2,
  '6e': ADJECTIFS_6E,
  CM1: [],
  CM2: [],
  '5e': [],
  '4e': [],
  '3e': [],
};

/** Un déterminant impose-t-il ce genre et ce nombre ? */
function determinantConvient(determinant: string, genre: Genre, nombre: Nombre): boolean {
  switch (determinant) {
    case 'un':
    case 'le':
      return genre === 'm' && nombre === 'singulier';
    case 'une':
    case 'la':
      return genre === 'f' && nombre === 'singulier';
    case 'des':
    case 'les':
      return nombre === 'pluriel';
    default:
      return false;
  }
}

const COUPLES_DE_DETERMINANTS = [['un', 'le'], ['une', 'la'], ['des', 'les']];
const voyelle = (mot: string) => /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(mot);

// --- Une seule bonne réponse, famille par famille ---------------------------------------------------------------

describe('le bon déterminant : une seule bonne réponse', () => {
  it('a pour bonne réponse un déterminant qui convient au nom, et pour mauvaises des déterminants qui ne lui conviennent pas', () => {
    NIVEAUX.forEach((level) => {
      const index = indexDesNoms(NOMS_DU[level]);
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'determinant')
          .forEach((q) => {
            const forme = /\.\.\. (.+)\.$/.exec(q.prompt)![1];
            const reperes = index.get(forme)!;
            expect(reperes, q.prompt).toBeDefined();
            const { nom, nombre } = reperes[0];
            const convenables = q.choices.filter((choix) => determinantConvient(choix, nom.genre, nombre));
            expect(convenables, `${q.prompt} → ${q.choices.join(' / ')}`).toEqual([bonne(q)]);
            // Jamais « le » ni « la » devant une voyelle : on écrit « l' ».
            if (voyelle(forme)) expect(['le', 'la'], q.prompt).not.toContain(bonne(q));
            // Jamais le jumeau de la bonne réponse (« un » avec « le », « des » avec « les ») : il conviendrait aussi.
            const jumeau = COUPLES_DE_DETERMINANTS.flat().find((mot) => mot !== bonne(q) && COUPLES_DE_DETERMINANTS.some((couple) => couple.includes(mot) && couple.includes(bonne(q))))!;
            expect(q.choices, `${q.prompt} → ${q.choices.join(' / ')}`).not.toContain(jumeau);
          })
      );
    });
  });
});

describe('le nom qui va avec le déterminant : une seule bonne réponse', () => {
  it('ne propose qu\'un seul nom qui s\'accorde avec le déterminant', () => {
    NIVEAUX.forEach((level) => {
      const index = indexDesNoms(NOMS_DU[level]);
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'nom')
          .forEach((q) => {
            const determinant = /(\S+) \.\.\.$/.exec(q.prompt)![1];
            const convenables = q.choices.filter((choix) => (index.get(choix) ?? []).some(({ nom, nombre }) => determinantConvient(determinant, nom.genre, nombre)));
            expect(convenables, `${q.prompt} → ${q.choices.join(' / ')}`).toEqual([bonne(q)]);
            // « le » et « la » veulent une consonne : « le ... » ne peut pas se compléter par « ami ».
            if (['le', 'la'].includes(determinant)) expect(voyelle(bonne(q)), q.prompt).toBe(false);
          })
      );
    });
  });
});

describe('mettre au pluriel : une seule bonne réponse', () => {
  it('a pour bonne réponse le pluriel du nom, avec le déterminant au pluriel, et pour mauvaises des groupes faux', () => {
    NIVEAUX.forEach((level) => {
      const noms = new Map(NOMS_DU[level].map((nom) => [nom.singulier, nom]));
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => ['pluriel', 'plurielx'].includes(famille(q)))
          .forEach((q) => {
            const motDuNom = q.prompt.replace(/^(?:(?:un|une|le|la) |l')/, '');
            const nom = noms.get(motDuNom)!;
            expect(nom, q.prompt).toBeDefined();
            const definiAuPluriel = /^(le|la|l')/.test(q.prompt);
            const attendue = `${definiAuPluriel ? 'les' : 'des'} ${nom.pluriel}`;
            expect(bonne(q), q.prompt).toBe(attendue);
            expect(q.choices.filter((choix) => choix === attendue)).toHaveLength(1);
            // Aucune mauvaise réponse n'est elle-même un pluriel juste du nom.
            q.choices.filter((choix) => choix !== attendue).forEach((choix) => expect(choix, `${q.prompt} : ${choix}`).not.toMatch(new RegExp(`^(des|les) ${nom.pluriel}$`)));
            if (famille(q) === 'plurielx') expect(nom.pluriel, q.prompt).not.toBe(`${nom.singulier}s`);
            else expect(nom.pluriel, q.prompt).toBe(`${nom.singulier}s`);
          })
      );
    });
  });

  it('propose, pour le pluriel en -x et en -aux, l\'erreur classique : un s à la place du x (« des bateaus »)', () => {
    questionsDe('CE2', 2, 60)
      .filter((q) => famille(q) === 'plurielx')
      .forEach((q) => {
        const nom = q.prompt.replace(/^(le|la|l') ?/, '');
        expect(q.choices, q.prompt).toContain(`les ${nom}s`);
      });
  });
});

describe('le féminin et le masculin des noms : une seule bonne réponse', () => {
  it('ne propose qu\'un groupe juste, et l\'erreur propre au couple (« une chate »)', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'feminin')
          .forEach((q) => {
            const [, article, mot] = /^(un|une) (.+)$/.exec(q.prompt)!;
            const couple = COUPLES_MASCULIN_FEMININ.find((candidat) => (article === 'un' ? candidat.masculin === mot : candidat.feminin === mot))!;
            expect(couple, q.prompt).toBeDefined();
            const attendue = article === 'un' ? `une ${couple.feminin}` : `un ${couple.masculin}`;
            expect(bonne(q), q.prompt).toBe(attendue);
            expect(new Set(q.choices).size).toBe(4);
            // Une seule proposition est la bonne : les trois autres sont fausses par le déterminant, le nom ou l'erreur.
            expect(q.choices.filter((choix) => choix === attendue), `${q.prompt} → ${q.choices.join(' / ')}`).toHaveLength(1);
          })
      )
    );
  });

  it('range chaque couple à son étape : le -e d\'abord, le doublement et -euse au 2e trimestre du CE1', () => {
    const paires = (trimester: Trimester) => new Set(questionsDe('CE1', trimester, 60).filter((q) => famille(q) === 'feminin').map((q) => q.prompt));
    const sortes = (trimester: Trimester) =>
      new Set(
        [...paires(trimester)].map((groupe) => {
          const mot = groupe.replace(/^(un|une) /, '');
          return COUPLES_MASCULIN_FEMININ.find((couple) => couple.masculin === mot || couple.feminin === mot)!.sorte;
        })
      );
    expect([...sortes(1)]).toEqual(['e']);
    expect(sortes(2).has('doublement')).toBe(true);
    expect(sortes(2).has('eur-euse')).toBe(true);
  });

  it('écrit chaque féminin comme la règle le veut : -e, consonne doublée, -euse', () => {
    COUPLES_MASCULIN_FEMININ.forEach(({ masculin, feminin, sorte, erreur }) => {
      if (sorte === 'e') expect(feminin).toBe(`${masculin}e`);
      if (sorte === 'doublement') expect(feminin).toBe(`${masculin}${masculin.slice(-1)}e`);
      if (sorte === 'eur-euse') expect(feminin).toBe(`${masculin.slice(0, -3)}euse`);
      if (erreur) expect(erreur, masculin).not.toBe(feminin);
    });
  });
});

describe('l\'adjectif qui manque : une seule bonne réponse', () => {
  it('ne propose qu\'une forme d\'adjectif qui s\'accorde avec le nom, et jamais une forme qui conviendrait tout autant', () => {
    NIVEAUX.forEach((level) => {
      const noms = indexDesNoms(NOMS_DU[level]);
      const adjectifs = indexDesAdjectifs(ADJECTIFS_DU[level]);
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'epithete')
          .forEach((q) => {
            const motsDuGroupe = q.prompt.split(' ');
            const mot = motsDuGroupe.find((candidat) => noms.has(candidat))!;
            const { nom, nombre } = noms.get(mot)![0];
            const convenables = q.choices.filter((choix) => (adjectifs.get(choix) ?? []).some((c) => c.genre === nom.genre && c.nombre === nombre));
            expect(convenables, `${q.prompt} → ${q.choices.join(' / ')}`).toEqual([bonne(q)]);
            // Le déterminant impose déjà le nombre, et le genre au singulier.
            expect(determinantConvient(motsDuGroupe[0], nom.genre, nombre) || motsDuGroupe[0] === 'les', q.prompt).toBe(true);
          })
      );
    });
  });

  it('ne croise jamais un adjectif avec un nom qu\'il ne peut pas qualifier', () => {
    NIVEAUX.forEach((level) => {
      const noms = indexDesNoms(NOMS_DU[level]);
      const adjectifs = ADJECTIFS_DU[level];
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => ['epithete', 'nomepithete'].includes(famille(q)))
          .forEach((q) => {
            const mots = q.prompt.replace('...', bonne(q)).split(' ');
            const mot = mots.find((candidat) => noms.has(candidat))!;
            const { nom } = noms.get(mot)![0];
            const forme = mots.find((candidat) => candidat !== mot && ADJECTIFS_DU[level].some((adjectif) => GENRES.some((g) => NOMBRES.some((n) => formeDeLAdjectif(adjectif, g, n) === candidat))))!;
            const adjectif = adjectifs.find((candidat) => GENRES.some((g) => NOMBRES.some((n) => formeDeLAdjectif(candidat, g, n) === forme)))!;
            expect(adjectif.categories, q.prompt.replace('...', bonne(q))).toContain(nom.categorie);
            expect(adjectif.sauf ?? [], q.prompt.replace('...', bonne(q))).not.toContain(nom.singulier);
          })
      );
    });
  });

  it('n\'écrit jamais « un beau ami », « un nouveau ami », « un vieux ami » : « bel », « nouvel », « vieil » ne sont pas posés', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester, 60)
          .filter((q) => ['epithete', 'nomepithete', 'groupepluriel', 'sujetverbe', 'attribut'].includes(famille(q)))
          .forEach((q) => {
            const texte = `${q.prompt.replace('...', bonne(q))} ${q.choices.join(' ')}`;
            // Le groupe complet (le trou rempli) ne contient jamais « beau/nouveau/vieux » + nom commençant par une voyelle.
            expect(q.prompt.replace('...', bonne(q)), texte).not.toMatch(/\b(un|le) (beau|nouveau|vieux) [aeiouyàâéèêîôûœ]/i);
            expect(q.prompt.replace('...', bonne(q)), texte).not.toMatch(/\b(un|le) (beau|nouveau|vieux) h(?:ôpital|omme)/i);
          })
      )
    );
  });

  it('écrit « les » devant un adjectif placé avant le nom : jamais « de grandes filles » ni « des grandes filles »', () => {
    NIVEAUX.forEach((level) => {
      const adjectifs = ADJECTIFS_DU[level];
      const positionDe = (mot: string) =>
        adjectifs.find((adjectif) => GENRES.some((g) => NOMBRES.some((n) => formeDeLAdjectif(adjectif, g, n) === mot)))?.position;
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => ['epithete', 'nomepithete'].includes(famille(q)))
          .forEach((q) => {
            expect(q.prompt, q.prompt).not.toMatch(/^de /);
            const mots = q.prompt.split(' ');
            // « des ... chats » (le nom est à trouver, l'adjectif vient après) est juste ; « des petits ... » ne l'est pas.
            const adjectifAvant = mots.slice(1).some((mot) => mot !== '...' && positionDe(mot) === 'avant') || (famille(q) === 'epithete' && q.prompt.startsWith(`${mots[0]} ...`));
            if (adjectifAvant && mots[0] === 'des') throw new Error(`« des » devant un adjectif placé avant : ${q.prompt}`);
          })
      );
    });
  });
});

describe('le nom qui manque, avec son adjectif : une seule bonne réponse', () => {
  it('ne propose qu\'un seul nom dont le genre et le nombre vont avec le déterminant et l\'adjectif', () => {
    NIVEAUX.forEach((level) => {
      const noms = indexDesNoms(NOMS_DU[level]);
      const adjectifs = indexDesAdjectifs(ADJECTIFS_DU[level]);
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'nomepithete')
          .forEach((q) => {
            const mots = q.prompt.split(' ');
            const determinant = mots[0];
            const adjectif = mots.find((mot) => mot !== '...' && adjectifs.has(mot))!;
            const cases = adjectifs.get(adjectif)!;
            // Le nombre vient du déterminant ; le genre, du déterminant au singulier, de l'adjectif quand il le marque.
            const nombre: Nombre = ['un', 'une'].includes(determinant) ? 'singulier' : 'pluriel';
            const genresPermis = new Set<Genre>(
              nombre === 'singulier'
                ? [determinant === 'un' ? 'm' : 'f']
                : cases.filter((c) => c.nombre === 'pluriel').map((c) => c.genre)
            );
            const convenables = q.choices.filter((choix) =>
              (noms.get(choix) ?? []).some((repere) => repere.nombre === nombre && genresPermis.has(repere.nom.genre))
            );
            expect(convenables, `${q.prompt} → ${q.choices.join(' / ')}`).toEqual([bonne(q)]);
          })
      );
    });
  });
});

describe('mettre au pluriel un groupe avec adjectif : une seule bonne réponse', () => {
  it('a pour bonne réponse le groupe dont le déterminant, le nom et l\'adjectif sont au pluriel', () => {
    NIVEAUX.forEach((level) => {
      const noms = indexDesNoms(NOMS_DU[level]);
      const adjectifs = ADJECTIFS_DU[level];
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'groupepluriel')
          .forEach((q) => {
            const mots = q.prompt.replace(/^(le|la) /, '').replace(/^l'/, '').split(' ');
            const nomRepere = mots.map((mot) => noms.get(mot)?.[0]).find(Boolean)!;
            const nom = nomRepere.nom;
            const adjectifSingulier = mots.find((mot) => mot !== nom.singulier)!;
            const adjectif = adjectifs.find((candidat) => formeDeLAdjectif(candidat, nom.genre, 'singulier') === adjectifSingulier)!;
            const avant = mots[0] !== nom.singulier;
            const attendue = avant
              ? `les ${formeDeLAdjectif(adjectif, nom.genre, 'pluriel')} ${nom.pluriel}`
              : `les ${nom.pluriel} ${formeDeLAdjectif(adjectif, nom.genre, 'pluriel')}`;
            expect(bonne(q), q.prompt).toBe(attendue);
            expect(new Set(q.choices).size).toBe(4);
            // Le pluriel doit se voir : au singulier et au pluriel l'adjectif ne s'écrit pas pareil.
            expect(formeDeLAdjectif(adjectif, nom.genre, 'singulier')).not.toBe(formeDeLAdjectif(adjectif, nom.genre, 'pluriel'));
          })
      );
    });
  });
});

describe('le féminin d\'un adjectif : une seule bonne réponse', () => {
  it('ne propose que ses quatre formes, et pour bonne réponse le féminin singulier', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'femininadjectif')
          .forEach((q) => {
            const adjectif = ADJECTIFS_DU[level].find((candidat) => candidat.masculinSingulier === q.prompt)!;
            expect(adjectif, q.prompt).toBeDefined();
            expect(bonne(q)).toBe(adjectif.femininSingulier);
            expect([...q.choices].sort()).toEqual(
              [adjectif.masculinSingulier, adjectif.femininSingulier, adjectif.masculinPluriel, adjectif.femininPluriel].sort()
            );
            expect(adjectif.femininSingulier).not.toBe(adjectif.masculinSingulier);
          })
      )
    );
  });
});

// --- Le sujet et le verbe ----------------------------------------------------------------------------------------------------

const PERSONNES_CE = ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const;

describe('l\'accord du sujet et du verbe : une seule bonne réponse', () => {
  it('a pour bonne réponse la forme de « il » ou de « ils » selon le nombre du nom sujet', () => {
    (['CE1', 'CE2', '6e'] as Level[]).forEach((level) => {
      const noms = indexDesNoms(NOMS_DU[level]);
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'sujetverbe')
          .forEach((q) => {
            // Le sujet : « Les petits garçons », « Une fille sage », « L'ami ».
            const avantLeTrou = q.prompt.split(' ... ')[0];
            const motsDuSujet = avantLeTrou.replace(/^(L')/i, '').split(' ');
            const repere = motsDuSujet.map((mot) => noms.get(mot.toLowerCase())?.[0]).find(Boolean);
            expect(repere, `sujet inconnu dans « ${q.prompt} »`).toBeDefined();
            expect(repere!.nom.categorie, q.prompt).toBe('personne');
            // Les mauvaises réponses viennent du même verbe, au même temps : quatre formes différentes.
            expect(new Set(q.choices).size).toBe(4);
          })
      );
    });
  });

  it('ne donne au CE1, au 1er trimestre, aucune question sur l\'accord du verbe', () => {
    expect(questionsDe('CE1', 1).some((q) => famille(q) === 'sujetverbe')).toBe(false);
    expect(questionsDe('CE1', 2).some((q) => famille(q) === 'sujetverbe')).toBe(true);
  });

  it('ne met aucun adjectif au sujet au 2e trimestre du CE1, et en met dès le 3e', () => {
    const avecAdjectif = (level: Level, trimester: Trimester) =>
      questionsDe(level, trimester, 40)
        .filter((q) => famille(q) === 'sujetverbe')
        .some((q) => q.prompt.split(' ... ')[0].split(' ').length > (/^L'/.test(q.prompt) ? 1 : 2));
    expect(avecAdjectif('CE1', 2)).toBe(false);
    expect(avecAdjectif('CE1', 3)).toBe(true);
    expect(avecAdjectif('CE2', 1)).toBe(true);
  });

  it('ne pose que l\'imparfait et le futur dont le trimestre est enseigné : au CE1-T2 le présent seul', () => {
    // Au CE1-T2 toutes les mauvaises réponses d'un même verbe sont au présent : « -e », « -es », « -ons », « -ez », « -ent ».
    questionsDe('CE1', 2, 40)
      .filter((q) => famille(q) === 'sujetverbe')
      .forEach((q) => q.choices.forEach((choix) => expect(choix, q.prompt).not.toMatch(/(ais|ait|aient|ions|iez|erai|eras|era|erons|erez|eront)$/)));
  });

  it('ne laisse aucun sujet absurde : le sujet est toujours une personne', () => {
    ['CE1', 'CE2', '6e'].forEach((niveau) => {
      const level = niveau as Level;
      const personnes = new Set(NOMS_DU[level].filter((nom) => nom.categorie === 'personne').flatMap((nom) => [nom.singulier, nom.pluriel]));
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'sujetverbe')
          .forEach((q) => {
            const mots = q.prompt.split(' ... ')[0].replace(/^L'/i, '').split(' ').map((mot) => mot.toLowerCase());
            expect(mots.some((mot) => personnes.has(mot)), q.prompt).toBe(true);
          })
      );
    });
  });
});

describe('les phrases à compléter ont un sens : qui fait quoi', () => {
  // Une seconde saisie, écrite ici à part, des personnes et de ce qu'elles font.
  const mot = (liste: string) => new RegExp(`(?<![\\p{L}])(${liste})(?![\\p{L}])`, 'iu');
  const ECOLE = /(?<![\p{L}])(classe|devoirs?)(?![\p{L}])|à l'école/iu;
  const ELEVE = mot('garçons?|filles?|voisins?|voisines?|amis?|amies?|copains?|copines?|cousins?|cousines?|frères?|sœurs?');
  const ENFANT = mot('garçons?|filles?|cousins?|cousines?|frères?|sœurs?|amis?|amies?|copains?|copines?');
  const SANS_ECOLE = mot('rois?|reines?|dames?|mamans?|papas?|clowns?|pirates?|fées?|bébés?|oncles?|tantes?|directeurs?|directrices?|boulangers?|boulangères?|infirmiers?|infirmières?|chanteurs?|chanteuses?|voyageurs?|voyageuses?|champions?|championnes?');
  const sujetEtSuite = (q: Question) => {
    const [sujet, ...suite] = q.prompt.split(' ... ');
    return { sujet, suite: suite.join(' ... ') };
  };

  it('ne parle d\'école, de classe ou de devoirs que d\'un élève : « Le roi bavarde en classe », « La dame va à l\'école » sonnent faux', () => {
    let vues = 0;
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester, 40)
          .filter((q) => famille(q) === 'sujetverbe')
          .forEach((q) => {
            const { sujet, suite } = sujetEtSuite(q);
            if (!ECOLE.test(suite)) return;
            vues++;
            expect(sujet, q.prompt).toMatch(ELEVE);
            expect(sujet, q.prompt).not.toMatch(SANS_ECOLE);
          })
      )
    );
    // Le test voit bien des phrases d'école : « bavarder en classe », « décorer la classe », « faire les devoirs ».
    expect(vues).toBeGreaterThan(20);
  });

  it('ne fait grandir « très vite » qu\'un enfant : « Un boulanger grandit très vite » sonne faux', () => {
    let vues = 0;
    ALL_TRIMESTERS.forEach((trimester) =>
      questionsDe('6e', trimester, 40)
        .filter((q) => famille(q) === 'sujetverbe' && q.id.split('-')[3] === 'grandir')
        .forEach((q) => {
          vues++;
          const { sujet } = sujetEtSuite(q);
          expect(sujet, q.prompt).toMatch(ENFANT);
          expect(sujet, q.prompt).not.toMatch(mot('voisins?|voisines?'));
          expect(sujet, q.prompt).not.toMatch(SANS_ECOLE);
        })
    );
    expect(vues).toBeGreaterThan(5);
  });

  it('ne met jamais un bébé en sujet d\'un verbe d\'action : « Le bébé répare le vélo »', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester, 40)
          .filter((q) => famille(q) === 'sujetverbe')
          .forEach((q) => expect(sujetEtSuite(q).sujet, q.prompt).not.toMatch(mot('bébés?')))
      )
    );
  });

  it('ne répète jamais le nom du sujet dans la suite de la phrase : « Les voisins jouent aux échecs avec un voisin »', () => {
    NIVEAUX.forEach((level) => {
      const personnes = NOMS_DU[level].filter((nom) => nom.categorie === 'personne');
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester, 40)
          .filter((q) => famille(q) === 'sujetverbe')
          .forEach((q) => {
            const { sujet, suite } = sujetEtSuite(q);
            personnes
              .filter((nom) => mot(`${nom.singulier}|${nom.pluriel}`).test(sujet))
              .forEach((nom) => expect(suite, q.prompt).not.toMatch(mot(`${nom.singulier}|${nom.pluriel}`)));
          })
      );
    });
  });
});

describe('l\'attribut : une seule bonne réponse', () => {
  it('ne propose qu\'une forme qui s\'accorde avec le sujet, au singulier ou au pluriel', () => {
    NIVEAUX.forEach((level) => {
      const noms = indexDesNoms(NOMS_DU[level]);
      const adjectifs = indexDesAdjectifs(ADJECTIFS_DU[level]);
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester)
          .filter((q) => famille(q) === 'attribut')
          .forEach((q) => {
            const avantLeVerbe = q.prompt.split(/ (?:est|sont) \.\.\.$/)[0];
            const nombre: Nombre = /sont \.\.\.$/.test(q.prompt) ? 'pluriel' : 'singulier';
            const mots = avantLeVerbe.replace(/^(L'|Le |La |Les )/, '').split(' ');
            const nom = noms.get(mots[0].toLowerCase())!.find((repere) => repere.nombre === nombre)!;
            expect(nom, q.prompt).toBeDefined();
            const convenables = q.choices.filter((choix) => (adjectifs.get(choix) ?? []).some((c) => c.genre === nom.nom.genre && c.nombre === nombre));
            expect(convenables, `${q.prompt} → ${q.choices.join(' / ')}`).toEqual([bonne(q)]);
          })
      );
    });
  });

  it('n\'arrive qu\'au 2e trimestre du CE2 : « les fleurs sont jolies »', () => {
    expect(questionsDe('CE1', 3).some((q) => famille(q) === 'attribut')).toBe(false);
    expect(questionsDe('CE2', 1).some((q) => famille(q) === 'attribut')).toBe(false);
    expect(questionsDe('CE2', 2).some((q) => famille(q) === 'attribut')).toBe(true);
    expect(questionsDe('6e', 1).some((q) => famille(q) === 'attribut')).toBe(false);
    expect(questionsDe('6e', 3).some((q) => famille(q) === 'attribut')).toBe(true);
  });

  it('ne qualifie jamais une chose, un animal ou une personne par un adjectif qui n\'a pas de sens en attribut', () => {
    // « Le cahier est premier », « la voisine est vieille », « le cygne est mauvais », « la tante est bonne » : non.
    NIVEAUX.forEach((level) =>
      [2, 3].forEach((trimester) =>
        questionsDe(level, trimester as Trimester, 60)
          .filter((q) => famille(q) === 'attribut')
          .forEach((q) => {
            expect(['premier', 'première', 'premiers', 'premières', 'dernier', 'dernière', 'derniers', 'dernières'], q.prompt).not.toContain(bonne(q));
            if (/^(Le|La|Les|L')\s?(voisin|voisine|ami|amie|garçon|fille|cousin|cousine|oncle|tante|chat|chien|cheval|lapin|mouton|vache|poule|canard)/.test(q.prompt)) {
              expect(['vieux', 'vieille', 'vieilles', 'mauvais', 'mauvaise', 'mauvaises', 'bon', 'bons', 'bonne', 'bonnes'], q.prompt).not.toContain(bonne(q));
            }
          })
      )
    );
  });

  it('place le sujet éloigné de son verbe en 6e (« La porte de mon frère est ») avec un complément qui a du sens', () => {
    const complementsConnus = new Set(
      [
        ...Object.values(COMPLEMENTS_PAR_CATEGORIE).flat(),
        ...COMPLEMENTS_D_ANIMAUX,
        ...['frère', 'garçon', 'directeur', 'champion', 'boulanger', 'infirmier', 'voyageur'].flatMap((singulier) => complementsPourPersonne(singulier)),
      ].map((complement) => complement!.texte)
    );
    const vus = questionsDe('6e', 3, 60).filter((q) => famille(q) === 'attribut');
    expect(vus.length).toBeGreaterThan(20);
    vus.forEach((q) => {
      const complement = [...complementsConnus].find((texte) => q.prompt.includes(` ${texte} `));
      expect(complement, q.prompt).toBeDefined();
    });
  });

  it('ne dit jamais « la ville du quartier » ni « le village de la ville », ni « le lion de mes cousins »', () => {
    questionsDe('6e', 3, 80)
      .filter((q) => famille(q) === 'attribut' || famille(q) === 'eloigne')
      .forEach((q) => {
        expect(q.prompt, q.prompt).not.toMatch(/^(La ville|Le village|Les villes|Les villages) /);
        expect(q.prompt, q.prompt).not.toMatch(/^(Le|Les) (lion|lions|tigre|tigres|éléphant|éléphants|loup|loups|serpent|serpents|singe|singes|girafe|girafes|renard|renards|tortue|tortues) /);
        expect(q.prompt, q.prompt).not.toMatch(/(directeur|directrice|directeurs|directrices) (du quartier|du village|de la ville)/);
        expect(q.prompt, q.prompt).not.toMatch(/(champion|championne|champions|championnes) de la directrice/);
      });
  });
});

// --- Les cas complexes de la 6e ----------------------------------------------------------------------------------------------------

/** Le présent, à « il » et à « ils », des verbes des scènes et des actions : écrit à part. */
const PRESENTS: Record<string, [string, string]> = {
  voler: ['vole', 'volent'], chanter: ['chante', 'chantent'], nager: ['nage', 'nagent'], pousser: ['pousse', 'poussent'],
  briller: ['brille', 'brillent'], rouler: ['roule', 'roulent'], dormir: ['dort', 'dorment'], jouer: ['joue', 'jouent'],
  courir: ['court', 'courent'], tomber: ['tombe', 'tombent'], arriver: ['arrive', 'arrivent'], sauter: ['saute', 'sautent'],
  dessiner: ['dessine', 'dessinent'], préparer: ['prépare', 'préparent'], regarder: ['regarde', 'regardent'], écouter: ['écoute', 'écoutent'],
  laver: ['lave', 'lavent'], nettoyer: ['nettoie', 'nettoient'], attendre: ['attend', 'attendent'], répondre: ['répond', 'répondent'],
  lire: ['lit', 'lisent'], écrire: ['écrit', 'écrivent'], choisir: ['choisit', 'choisissent'], finir: ['finit', 'finissent'],
  danser: ['danse', 'dansent'], marcher: ['marche', 'marchent'], ranger: ['range', 'rangent'], manger: ['mange', 'mangent'],
};

describe('le sujet placé après le verbe (6e) : une seule bonne réponse', () => {
  it('s\'accorde avec le sujet, pas avec le lieu : « Sur les branches chante un oiseau »', () => {
    const vus = questionsDe('6e', 1, 60).filter((q) => famille(q) === 'inverse');
    expect(vus.length).toBeGreaterThan(40);
    vus.forEach((q) => {
      const verbe = q.id.split('-')[3];
      const [il, ils] = PRESENTS[verbe];
      const pluriel = /\.\.\. (des|deux) /.test(q.prompt);
      expect(bonne(q), q.prompt).toBe(pluriel ? ils : il);
      expect(q.choices.filter((choix) => choix === (pluriel ? ils : il))).toHaveLength(1);
      // Le piège est toujours proposé : le verbe de l'autre nombre.
      expect(q.choices, q.prompt).toContain(pluriel ? il : ils);
    });
  });

  it('pose le piège du lieu pluriel avec un sujet singulier, et inversement', () => {
    const vus = questionsDe('6e', 1, 80).filter((q) => famille(q) === 'inverse');
    const lieuPluriel = (q: Question) => /^(Dans les|Sur les|Sous les|Au-dessus des)/.test(q.prompt);
    const sujetPluriel = (q: Question) => /\.\.\. des /.test(q.prompt);
    expect(vus.some((q) => lieuPluriel(q) && !sujetPluriel(q))).toBe(true);
    expect(vus.some((q) => !lieuPluriel(q) && sujetPluriel(q))).toBe(true);
  });

  it('ne met dans une scène que des sujets qui peuvent faire l\'action', () => {
    // Les sujets de chaque scène sont écrits avec elle : un nageur est un poisson, un canard, un cygne, une grenouille.
    const nageurs = SCENES.filter((scene) => scene.verbe === 'nager').flatMap((scene) => scene.sujets.map(([singulier]) => singulier));
    expect(nageurs.sort()).toEqual(['canard', 'cygne', 'grenouille', 'poisson']);
    const voleurs = SCENES.filter((scene) => scene.verbe === 'voler').flatMap((scene) => scene.sujets.map(([singulier]) => singulier));
    expect(voleurs).not.toContain('chat');
    // Le mouton ne dort pas dans un panier, ni le chat dans une grange : deux scènes pour « dormir ».
    const dormeurs = SCENES.filter((scene) => scene.verbe === 'dormir');
    expect(dormeurs).toHaveLength(2);
    expect(dormeurs[0].lieux.map((lieu) => lieu.texte)).not.toContain('Dans la grange');
    expect(dormeurs[1].sujets.map(([singulier]) => singulier)).not.toContain('chat');
  });

  it('ne met dans une scène que des lieux où le sujet peut être : pas d\'insecte dans les nuages, de lampe dans le ciel, de pomme sur les vitres, de train à la porte', () => {
    // Chaque scène se croise lieu par lieu et sujet par sujet : « Dans les nuages volent des mouches » serait une phrase absurde.
    const dans = (verbe: string, lieu: string) => SCENES.filter((scene) => scene.verbe === verbe && scene.lieux.some((candidat) => candidat.texte === lieu));
    const sujetsDe = (scenes: typeof SCENES) => scenes.flatMap((scene) => scene.sujets.map(([singulier]) => singulier));
    ['papillon', 'abeille', 'mouche'].forEach((insecte) => expect(sujetsDe(dans('voler', 'Dans les nuages')), insecte).not.toContain(insecte));
    ['lampe', 'lumière', 'bougie'].forEach((objet) => expect(sujetsDe(dans('briller', 'Dans le ciel')), objet).not.toContain(objet));
    ['pomme', 'feuille', 'poire'].forEach((fruit) => expect(sujetsDe(dans('tomber', 'Sur les vitres')), fruit).not.toContain(fruit));
    expect(sujetsDe(dans('arriver', 'À la porte'))).not.toContain('train');
    expect(sujetsDe(SCENES.filter((scene) => scene.verbe === 'rouler'))).not.toContain('train');
    // Les vagues ne portent ni canards ni grenouilles.
    expect(SCENES.flatMap((scene) => scene.lieux.map((lieu) => lieu.texte))).not.toContain('Dans les vagues');
  });
});

describe('le sujet éloigné de son verbe, et plusieurs sujets (6e) : une seule bonne réponse', () => {
  it('s\'accorde avec le premier mot du groupe sujet, pas avec le complément qui le suit', () => {
    const vus = questionsDe('6e', 1, 60).filter((q) => famille(q) === 'eloigne');
    expect(vus.length).toBeGreaterThan(40);
    vus.forEach((q) => {
      const verbe = q.id.split('-')[3];
      const [il, ils] = PRESENTS[verbe];
      const pluriel = /^(Les|Des) /.test(q.prompt);
      expect(bonne(q), q.prompt).toBe(pluriel ? ils : il);
      expect(q.choices, q.prompt).toContain(pluriel ? il : ils);
      // Toujours un article défini : « le frère de ma voisine », pas « un frère de ma voisine ».
      expect(q.prompt, q.prompt).not.toMatch(/^(Un|Une|Des) /);
    });
  });

  it('ne répète jamais un mot du complément dans la suite de la phrase : « Le chat du jardin court dans le jardin »', () => {
    questionsDe('6e', 1, 80)
      .filter((q) => famille(q) === 'eloigne')
      .forEach((q) => {
        const [sujet, suite] = q.prompt.split(' ... ');
        const mot = sujet.split(' ').slice(-1)[0].replace(/s$/, '');
        expect(suite, q.prompt).not.toContain(mot);
      });
  });

  it('ne répète jamais le nom du sujet dans son complément : « les cousins de mes cousins »', () => {
    questionsDe('6e', 1, 80)
      .filter((q) => famille(q) === 'eloigne')
      .forEach((q) => {
        const [sujet, complement] = q.prompt.split(' ... ')[0].split(/ (?=(?:du|de la|de l'|de mon|de ma|de mes|des|d') )/);
        const mot = (texte: string) => texte.split(' ').slice(-1)[0].replace(/s$/, '');
        if (complement) expect(mot(sujet), q.prompt).not.toBe(mot(complement));
      });
  });

  it('met les deux sujets au pluriel : le verbe est à la 3e personne du pluriel', () => {
    const vus = questionsDe('6e', 1, 60).filter((q) => famille(q) === 'plusieurs');
    expect(vus.length).toBeGreaterThan(20);
    vus.forEach((q) => {
      const verbe = q.id.split('-')[3];
      expect(bonne(q), q.prompt).toBe(PRESENTS[verbe][1]);
      expect(q.prompt, q.prompt).toMatch(/^[\p{L}' ]+ et [\p{L}' ]+ \.\.\. .+\.$/u);
      // Le piège : le verbe au singulier, qu'on écrit en s'accordant avec le dernier sujet.
      expect(q.choices, q.prompt).toContain(PRESENTS[verbe][0]);
    });
  });

  it('n\'emploie jamais « ou » : « Léa ou Paul » s\'accorde au singulier comme au pluriel', () => {
    questionsDe('6e', 1, 60).forEach((q) => expect(q.prompt, q.prompt).not.toMatch(/\bou\b/));
  });
});

describe('le participe passé avec « être » (6e) : une seule bonne réponse', () => {
  const sujetsFeminins = /^(Léa|Marion|Camille|Nora|Inès|Manon|Emma|Lola|Elle|Ma sœur|Ma tante|La directrice)( |$)/i;

  it('s\'accorde avec le sujet : en genre et en nombre, et au masculin pluriel pour deux sujets de genres mêlés', () => {
    const vus = questionsDe('6e', 3, 80).filter((q) => famille(q) === 'participeetre');
    expect(vus.length).toBeGreaterThan(60);
    vus.forEach((q) => {
      const verbe = PARTICIPES_AVEC_ETRE.find((candidat) => candidat.infinitif === q.id.split('-')[3])!;
      const sujet = q.prompt.split(/ (?:est|sont|était|étaient) \.\.\.$/)[0];
      const pluriel = / (sont|étaient) \.\.\.$/.test(q.prompt);
      const double = / et /.test(sujet);
      const sujetsDuDouble = sujet.split(' et ');
      const toutesFeminines = double && sujetsDuDouble.every((partie) => sujetsFeminins.test(partie));
      const feminin = double ? toutesFeminines : sujetsFeminins.test(sujet) || /^(Elles|Les filles|Mes cousines|Les voisines)/.test(sujet);
      const attendue = feminin ? (pluriel ? verbe.femininPluriel : verbe.femininSingulier) : pluriel ? verbe.masculinPluriel : verbe.masculinSingulier;
      expect(bonne(q), q.prompt).toBe(attendue);
      expect(new Set(q.choices).size).toBe(4);
    });
  });

  it('ne pose deux sujets qu\'au 3e trimestre, le plus-que-parfait qu\'à partir du 2e', () => {
    const doubles = (trimester: Trimester) => questionsDe('6e', trimester, 60).filter((q) => famille(q) === 'participeetre').some((q) => / et /.test(q.prompt));
    const pqp = (trimester: Trimester) => questionsDe('6e', trimester, 60).filter((q) => famille(q) === 'participeetre').some((q) => /(était|étaient) \.\.\.$/.test(q.prompt));
    expect(doubles(1)).toBe(false);
    expect(doubles(2)).toBe(false);
    expect(doubles(3)).toBe(true);
    expect(pqp(1)).toBe(false);
    expect(pqp(2)).toBe(true);
  });

  it('écrit les quatre formes de chaque participe d\'après la règle : -é/-ée/-és/-ées, -i/-ie/-is/-ies, -u/-ue/-us/-ues', () => {
    PARTICIPES_AVEC_ETRE.forEach((participe) => {
      expect([participe.femininSingulier, participe.masculinPluriel, participe.femininPluriel], participe.infinitif).toEqual([
        `${participe.masculinSingulier}e`,
        `${participe.masculinSingulier}s`,
        `${participe.masculinSingulier}es`,
      ]);
    });
    // Seuls quatorze verbes se conjuguent ici avec « être ».
    expect(PARTICIPES_AVEC_ETRE.map((participe) => participe.infinitif).sort()).toEqual(
      ['aller', 'arriver', 'descendre', 'devenir', 'entrer', 'monter', 'partir', 'rentrer', 'rester', 'retourner', 'revenir', 'sortir', 'tomber', 'venir'].sort()
    );
  });
});

describe('le participe passé avec « avoir » (6e) : une seule bonne réponse', () => {
  it('ne s\'enseigne qu\'à partir du 2e trimestre', () => {
    expect(questionsDe('6e', 1).some((q) => famille(q) === 'participeavoir')).toBe(false);
    expect(questionsDe('6e', 2).some((q) => famille(q) === 'participeavoir')).toBe(true);
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => expect(questionsDe(level, trimester).some((q) => famille(q).startsWith('participe'))).toBe(false))
    );
  });

  it('s\'accorde avec le COD placé avant le verbe, et reste invariable quand le COD le suit', () => {
    [2, 3].forEach((trimester) => {
      const vus = questionsDe('6e', trimester as Trimester, 60).filter((q) => famille(q) === 'participeavoir');
      expect(vus.length).toBeGreaterThan(50);
      vus.forEach((q) => {
        const verbe = PARTICIPES_AVEC_AVOIR.find((candidat) => candidat.infinitif === q.id.split('-')[3])!;
        const objets = new Map(verbe.objets.flatMap(([singulier, pluriel, genre]) => [[singulier, { genre, nombre: 'singulier' as Nombre }], [pluriel, { genre, nombre: 'pluriel' as Nombre }]] as [string, { genre: Genre; nombre: Nombre }][]));
        const forme = (genre: Genre, nombre: Nombre) =>
          genre === 'm' ? (nombre === 'singulier' ? verbe.masculinSingulier : verbe.masculinPluriel) : nombre === 'singulier' ? verbe.femininSingulier : verbe.femininPluriel;
        let attendue: string;
        if (/\.\.\. (un|une|des) /.test(q.prompt)) {
          // Le COD suit le verbe : « Léa a cueilli des pommes ».
          expect(q.prompt, q.prompt).toMatch(/^(Je|J'|Tu|Nous|Vous|[A-ZÉ][\p{L}]+(?: [\p{L}]+)?) ?(a|ai|as|avons|avez|ont) \.\.\. (un|une|des) [\p{L}]+\.$/u);
          attendue = verbe.masculinSingulier;
        } else {
          // Le COD précède : « les pommes que Léa a », « ces pommes, Léa les a ».
          const mot = [...objets.keys()].find((candidat) => new RegExp(`(^|[ ']|, )${candidat}( |,)`).test(q.prompt));
          expect(mot, q.prompt).toBeDefined();
          const { genre, nombre } = objets.get(mot!)!;
          attendue = forme(genre, nombre);
          // Le groupe que le COD remplace dit bien son genre et son nombre.
          if (/^(Voici|Regarde|Où est|Où sont) /.test(q.prompt)) expect(q.prompt, q.prompt).toMatch(/ que /);
          else expect(q.prompt, q.prompt).toMatch(/^(Ce|Cet|Cette|Ces) .+, .+ (l'|les )/);
        }
        expect(bonne(q), q.prompt).toBe(attendue);
        expect(new Set(q.choices).size).toBe(4);
      });
    });
  });

  it('n\'écrit jamais « que Inès a », ni « je le ai » : les élisions sont faites', () => {
    questionsDe('6e', 3, 80)
      .filter((q) => famille(q) === 'participeavoir')
      .forEach((q) => {
        expect(q.prompt, q.prompt).not.toMatch(/\bque (il|elle|on|Inès|Emma|Océane)\b/);
        expect(q.prompt, q.prompt).not.toMatch(/\b(je|me|te|le|la) (ai|a|as)\b/i);
        expect(q.prompt, q.prompt).not.toMatch(/ ,/);
      });
  });

  it('propose l\'infinitif quand le participe s\'écrit pareil au masculin singulier et au pluriel (« pris », « mis », « compris »)', () => {
    const vus = questionsDe('6e', 3, 150).filter((q) => famille(q) === 'participeavoir' && ['prendre', 'mettre', 'comprendre'].includes(q.id.split('-')[3]));
    expect(vus.length).toBeGreaterThan(0);
    vus.forEach((q) => expect(q.choices, q.prompt).toContain(q.id.split('-')[3]));
  });

  it('ne donne ni devoir, ni leçon, ni exposé, ni exercice à « mon oncle », « ma tante » ou « mes parents » : « Voici les devoirs que ma tante a finis »', () => {
    let vues = 0;
    [2, 3].forEach((trimester) =>
      questionsDe('6e', trimester as Trimester, 150)
        .filter((q) => famille(q) === 'participeavoir')
        .forEach((q) => {
          if (!/\b(mon oncle|ma tante|mes parents)\b/i.test(q.prompt)) return;
          vues++;
          expect(q.prompt, q.prompt).not.toMatch(/\b(expos[ée]s?|devoirs?|le[çc]ons?|exercices?)\b/i);
        })
    );
    // Le test voit bien des adultes dans les phrases.
    expect(vues).toBeGreaterThan(20);
  });

  it('associe à chaque verbe des objets qu\'on peut vraiment cueillir, écrire, perdre…', () => {
    const attendus: Record<string, string[]> = {
      cueillir: ['fleur', 'pomme', 'cerise', 'fraise', 'poire', 'tulipe'],
      casser: ['vase', 'verre', 'assiette', 'jouet', 'lampe'],
      perdre: ['clé', 'gant', 'livre', 'cahier', 'écharpe'],
      lancer: ['ballon', 'balle', 'fusée', 'flèche'],
    };
    Object.entries(attendus).forEach(([infinitif, objets]) => {
      const verbe = PARTICIPES_AVEC_AVOIR.find((candidat) => candidat.infinitif === infinitif)!;
      expect(verbe.objets.map(([singulier]) => singulier)).toEqual(objets);
    });
    // Les quatre formes du participe sont écrites d'après la règle ou la table des irréguliers.
    const IRREGULIERS: Record<string, [string, string, string, string]> = {
      prendre: ['pris', 'prise', 'pris', 'prises'],
      mettre: ['mis', 'mise', 'mis', 'mises'],
      comprendre: ['compris', 'comprise', 'compris', 'comprises'],
      faire: ['fait', 'faite', 'faits', 'faites'],
      dire: ['dit', 'dite', 'dits', 'dites'],
      écrire: ['écrit', 'écrite', 'écrits', 'écrites'],
      ouvrir: ['ouvert', 'ouverte', 'ouverts', 'ouvertes'],
      découvrir: ['découvert', 'découverte', 'découverts', 'découvertes'],
      peindre: ['peint', 'peinte', 'peints', 'peintes'],
      construire: ['construit', 'construite', 'construits', 'construites'],
    };
    PARTICIPES_AVEC_AVOIR.forEach((verbe) => {
      const formes = [verbe.masculinSingulier, verbe.femininSingulier, verbe.masculinPluriel, verbe.femininPluriel];
      const attendues = IRREGULIERS[verbe.infinitif] ?? [verbe.masculinSingulier, `${verbe.masculinSingulier}e`, `${verbe.masculinSingulier}s`, `${verbe.masculinSingulier}es`];
      expect(formes, verbe.infinitif).toEqual(attendues);
    });
  });
});

describe('l\'attribut d\'un sujet double (6e) : une seule bonne réponse', () => {
  it('est au féminin pluriel si les deux sujets sont féminins, au masculin pluriel dès qu\'il y a un masculin', () => {
    const vus = questionsDe('6e', 3, 80).filter((q) => famille(q) === 'attributdouble');
    expect(vus.length).toBeGreaterThan(30);
    const feminins = /^(Léa|Marion|Camille|Nora|Inès|Manon|Emma|Lola|Ma sœur|Ma tante)/i;
    const adjectifs = indexDesAdjectifs(ADJECTIFS_6E);
    vus.forEach((q) => {
      const [premier, second] = q.prompt.replace(/ sont \.\.\.$/, '').split(' et ');
      const genre: Genre = feminins.test(premier) && feminins.test(second) ? 'f' : 'm';
      const convenables = q.choices.filter((choix) => (adjectifs.get(choix) ?? []).some((c) => c.genre === genre && c.nombre === 'pluriel'));
      expect(convenables, `${q.prompt} → ${q.choices.join(' / ')}`).toEqual([bonne(q)]);
    });
  });
});

// --- Ce que le programme met à chaque trimestre ---------------------------------------------------------------------------------

describe('ce que chaque trimestre fait travailler', () => {
  const famillesDe = (level: Level, trimester: Trimester) => new Set(questionsDe(level, trimester, 40).map(famille));

  it('CE1, 1er trimestre : le déterminant, le nom, le pluriel en -s, le féminin en -e — rien d\'autre', () => {
    expect([...famillesDe('CE1', 1)].sort()).toEqual(['determinant', 'feminin', 'nom', 'pluriel']);
  });

  it('CE1, 2e trimestre : arrivent l\'adjectif, son féminin, le doublement de la consonne et l\'accord du verbe', () => {
    const familles = famillesDe('CE1', 2);
    ['epithete', 'nomepithete', 'femininadjectif', 'sujetverbe'].forEach((nom) => expect(familles.has(nom), nom).toBe(true));
    ['plurielx', 'attribut', 'groupepluriel'].forEach((nom) => expect(familles.has(nom), nom).toBe(false));
  });

  it('CE1, 3e trimestre : ces accords réunis, et le groupe avec adjectif mis au pluriel', () => {
    const familles = famillesDe('CE1', 3);
    ['determinant', 'nom', 'pluriel', 'feminin', 'epithete', 'sujetverbe', 'groupepluriel'].forEach((nom) => expect(familles.has(nom), nom).toBe(true));
    expect(familles.has('plurielx')).toBe(false);
  });

  it('CE2 : le pluriel en -x et l\'attribut au 2e trimestre seulement', () => {
    expect(famillesDe('CE2', 1).has('plurielx')).toBe(false);
    expect(famillesDe('CE2', 2).has('plurielx')).toBe(true);
    expect(famillesDe('CE2', 3).has('plurielx')).toBe(true);
    expect(famillesDe('CE2', 1).has('attribut')).toBe(false);
  });

  it('CE1 et CE2 : aucun sujet éloigné, inversé, ni double, aucun participe passé accordé', () => {
    (['CE1', 'CE2'] as Level[]).forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) => {
        const familles = famillesDe(level, trimester);
        ['inverse', 'eloigne', 'plusieurs', 'participeetre', 'participeavoir', 'attributdouble'].forEach((nom) => expect(familles.has(nom), `${level} T${trimester} ${nom}`).toBe(false));
      })
    );
  });

  it('6e, 1er trimestre : le sujet inversé, éloigné et double, le participe passé avec « être »', () => {
    const familles = famillesDe('6e', 1);
    ['inverse', 'eloigne', 'plusieurs', 'participeetre', 'sujetverbe', 'epithete', 'nomepithete'].forEach((nom) => expect(familles.has(nom), nom).toBe(true));
    expect(familles.has('participeavoir')).toBe(false);
  });

  it('6e, 2e trimestre : arrive le participe passé avec « avoir »', () => {
    expect(famillesDe('6e', 2).has('participeavoir')).toBe(true);
  });

  it('6e, 3e trimestre : les accords complexes de l\'attribut', () => {
    const familles = famillesDe('6e', 3);
    expect(familles.has('attribut')).toBe(true);
    expect(familles.has('attributdouble')).toBe(true);
  });

  it('n\'a pas, avant le CE2-T2, de nom au pluriel en -x ni en -aux', () => {
    const irreguliers = new Set(NOMS_CYCLE_2.filter((nom) => nom.pluriel !== `${nom.singulier}s`).flatMap((nom) => [nom.singulier, nom.pluriel]));
    ([['CE1', 1], ['CE1', 2], ['CE1', 3], ['CE2', 1]] as [Level, Trimester][]).forEach(([level, trimester]) =>
      questionsDe(level, trimester, 40).forEach((q) => {
        const mots = `${q.prompt} ${q.choices.join(' ')}`.split(/[ ']/);
        mots.forEach((mot) => expect(irreguliers.has(mot), `${level} T${trimester} : ${q.prompt}`).toBe(false));
      })
    );
  });

  it('n\'a pas, avant le CE1-T2, d\'adjectif', () => {
    const tous = new Set(ADJECTIFS_CYCLE_2.flatMap((adjectif) => [adjectif.masculinSingulier, adjectif.femininSingulier, adjectif.masculinPluriel, adjectif.femininPluriel]));
    // Les adjectifs qui s'écrivent aussi comme un nom ou un verbe du lexique n'entrent pas dans ce contrôle.
    const ambigus = new Set(['rose', 'fort', 'sage', 'calme', 'content', 'jaune', 'rouge', 'rapide', 'timide', 'neuf', 'sec', 'vert', 'noir', 'bleu', 'bon', 'petit', 'grand', 'long']);
    questionsDe('CE1', 1, 40).forEach((q) =>
      `${q.prompt} ${q.choices.join(' ')}`.split(/[ ']/).forEach((mot) => expect(tous.has(mot) && !ambigus.has(mot) && !NOMS_CYCLE_2.some((nom) => nom.singulier === mot || nom.pluriel === mot), q.prompt).toBe(false))
    );
  });
});

describe('les phrases cadres', () => {
  it('ne contiennent aucun verbe qui ne va pas avec n\'importe quel nom : on regarde, on dessine, on cherche', () => {
    questionsDe('CE1', 1, 40)
      .filter((q) => ['determinant', 'nom'].includes(famille(q)))
      .forEach((q) => expect(q.prompt, q.prompt).toMatch(/^(Léa|Paul|Nora|Tom|Lola|Hugo|Emma|Sami) (regarde|dessine|cherche|montre|voit) /));
  });

  it('écrit les noms propres du cycle 2 avec une majuscule, les noms communs sans', () => {
    NIVEAUX.forEach((level) =>
      ALL_TRIMESTERS.forEach((trimester) =>
        questionsDe(level, trimester).forEach((q) => {
          // Une phrase commence par une majuscule ; un groupe (« un chat », « des ... noirs ») n'en a pas.
          if (['determinant', 'nom', 'sujetverbe', 'attribut', 'inverse', 'eloigne', 'plusieurs', 'participeetre'].includes(famille(q))) {
            expect(q.prompt.charAt(0), q.prompt).toBe(q.prompt.charAt(0).toUpperCase());
          }
          expect(q.prompt, q.prompt).not.toMatch(/\.\.\. \./);
        })
      )
    );
  });
});

describe('les domestiques de la 6e', () => {
  it('ne parle d\'un animal avec un complément du nom que pour un animal de compagnie ou de la ferme', () => {
    ANIMAUX_DOMESTIQUES.forEach((animal) => expect(NOMS_6E.some((nom) => nom.singulier === animal), animal).toBe(true));
    ['lion', 'tigre', 'éléphant', 'girafe', 'singe', 'loup', 'serpent', 'renard', 'tortue', 'cygne'].forEach((sauvage) => expect(ANIMAUX_DOMESTIQUES).not.toContain(sauvage));
  });
});
