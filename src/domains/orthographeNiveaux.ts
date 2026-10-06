import type { Level, Question, Trimester } from '../types';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { stageOf, type Stage } from '../lib/progression';
import {
  composer,
  fabriquerDistinctes,
  fabriquerDistinctesParGroupes,
  fabriquerParEssais,
  majuscule,
  type Famille,
} from './francaisNiveaux';
import { VERBES_6E, VERBES_REGULIERS_CYCLE_2, groupeDe } from './conjugaisonVerbesNiveaux';
import type { Verb } from './conjugaisonVerbes';
import { gabaritsDuNiveau, motsConnus, type Gabarit } from './orthographeHomophonesNiveaux';
import { MOTS_AVEC_TROU, MOTS_INVARIABLES, type MotAvecTrou, type MotInvariable } from './orthographeMotsNiveaux';
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
  type Affixe,
  type ContraireAvecPrefixe,
  type Element,
  type Expression,
  type Famille as FamilleDeMots,
  type GroupeDeMots,
  type MotAPlusieursSens,
  type Racine,
  type Relation,
} from './orthographeVocabulaireNiveaux';

/**
 * L'orthographe et le vocabulaire du CE1, du CE2 et de la 6e.
 *
 * Chaque niveau et chaque trimestre ont leur programme, écrit dans `PROGRAMME` : les familles de questions qu'on
 * y pose et leur poids dans une séance. Une famille ne reçoit que ce que l'élève a déjà vu : ses éléments portent
 * l'étape où ils commencent (`depuis`), et ses mauvaises réponses ne sortent jamais d'une notion qu'il ne connaît
 * pas encore. Rien de ce qui est écrit pour le CM1 et le CM2 ne passe par ici.
 *
 * Les identifiants : `orthographe-<famille>-<rang>-<détail>`. Les homophones gardent le préfixe
 * `orthographe-homophone-` que reconnaissent les tests des autres niveaux.
 */

export type NomDeFamille =
  | 'homophone-nouveau'
  | 'homophone-revision'
  | 'mot'
  | 'lettres'
  | 'participe'
  | 'alphabet'
  | 'dictionnaire'
  | 'synonyme'
  | 'contraire'
  | 'nuance'
  | 'famille'
  | 'affixe'
  | 'polysemie'
  | 'categorie'
  | 'theme'
  | 'expression'
  | 'registre'
  | 'racine'
  | 'figure'
  | 'emprunt';

type Poids = Partial<Record<NomDeFamille, number>>;

/**
 * Le contenu de chaque trimestre. Les homophones « nouveaux » sont ceux que le trimestre introduit, les
 * « révisés » ceux des trimestres d'avant ; un trimestre qui n'introduit rien (CE2-T1, CE2-T3) ne fait que
 * réviser.
 *
 *  - CE1-T1 : a / à, et / est, mots invariables, ordre alphabétique (1re lettre), synonymes, familles de mots.
 *  - CE1-T2 : on / ont, son / sont ; ordre alphabétique (2e lettre) ; contraires ; sens d'un mot selon le
 *    contexte ; mots d'une même catégorie.
 *  - CE1-T3 : le participe en -é et l'infinitif en -er ; préfixes re- et dé-, suffixes -eur et -ette ; champs
 *    thématiques.
 *  - CE2-T1 : révision des homophones ; c / ç, g / ge / gu, s / ss, m devant m, b, p ; préfixes re-, dé-, in-,
 *    suffixes -eur, -ment, -ette ; familles de mots ; ordre alphabétique (3e lettre).
 *  - CE2-T2 : ou / où, ce / se, ces / ses, la / là ; antonymes ; sens propre et figuré (expressions) ;
 *    polysémie.
 *  - CE2-T3 : révision des homophones ; familles étendues ; regroupement par catégories et par thèmes.
 *  - 6e-T1 : les homophones du cycle 2 ; préfixes et suffixes (dé-, re-, in-, pré-, sur- ; -ment, -eur, -tion,
 *    -able) ; synonymes, antonymes ; familles ; ordre alphabétique et dictionnaire.
 *  - 6e-T2 : c'est / s'est, c'était / s'était, quel / qu'elle, la / là / l'a / l'as, leur / leurs, mes / mais ;
 *    polysémie, sens figuré, registres de langue, champ lexical, synonymes nuancés, étymologie.
 *  - 6e-T3 : quelque / quel que, plutôt / plus tôt, ni / n'y ; figures de style, emprunts ; familles
 *    étendues, champ lexical, étymologie.
 */
const PROGRAMME: Record<string, Poids> = {
  'CE1-1': { 'homophone-nouveau': 5, mot: 2, alphabet: 2, synonyme: 1, famille: 1 },
  'CE1-2': { 'homophone-nouveau': 3, 'homophone-revision': 2, mot: 1, alphabet: 1, contraire: 1, polysemie: 1, categorie: 1, famille: 1, synonyme: 1 },
  'CE1-3': { 'homophone-nouveau': 2, 'homophone-revision': 2, participe: 2, mot: 1, affixe: 2, theme: 1, contraire: 1, synonyme: 1 },
  'CE2-1': { 'homophone-revision': 4, mot: 1, lettres: 2, participe: 1, affixe: 2, famille: 1, synonyme: 1, alphabet: 1 },
  'CE2-2': { 'homophone-nouveau': 3, 'homophone-revision': 2, lettres: 1, participe: 1, contraire: 1, polysemie: 1, expression: 1, affixe: 1, synonyme: 1 },
  'CE2-3': { 'homophone-revision': 4, lettres: 1, participe: 1, famille: 1, categorie: 1, theme: 1, expression: 1, polysemie: 1, affixe: 1 },
  '6e-1': { 'homophone-nouveau': 5, affixe: 2, synonyme: 1, contraire: 1, famille: 1, alphabet: 1, dictionnaire: 1, participe: 1, mot: 1 },
  '6e-2': { 'homophone-nouveau': 3, 'homophone-revision': 2, polysemie: 1, expression: 1, registre: 1, theme: 1, nuance: 1, racine: 1, participe: 1 },
  '6e-3': { 'homophone-nouveau': 2, 'homophone-revision': 2, figure: 2, emprunt: 1, famille: 1, theme: 1, racine: 1, affixe: 1, mot: 1 },
};

// --- De quoi construire les questions ------------------------------------------------------------------------------------

const memoire = new Map<string, unknown>();

/** Les listes de candidats ne changent jamais : on les calcule une fois par niveau et par étape. */
function memoiser<T>(cle: string, calcul: () => T): T {
  if (!memoire.has(cle)) memoire.set(cle, calcul());
  return memoire.get(cle) as T;
}

function pourDe(level: Level): 'cycle2' | '6e' {
  return level === '6e' ? '6e' : 'cycle2';
}

/** Les éléments d'une liste déjà au programme de ce niveau à cette étape. */
function aLEtape<T extends Element>(liste: readonly T[], level: Level, stage: Stage): T[] {
  const pour = pourDe(level);
  return liste.filter((element) => element.pour === pour && element.depuis <= stage);
}

function identifiant(famille: string, rang: number, detail: string): string {
  return `orthographe-${famille}-${rang}-${detail.replace(/\s+/g, '_')}`;
}

/** Une question à quatre choix : la bonne réponse et trois mauvaises, mêlées. */
function question(rng: Rng, id: string, instruction: string, prompt: string, bonne: string, mauvaises: string[]): Question {
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  return { id, domain: 'orthographe', instruction, prompt, choices, correctIndex: choices.indexOf(bonne) };
}

/** Trois mots tirés d'une liste, sans doublon, sans `exclus`. */
function troisAutres(rng: Rng, liste: readonly string[], exclus: readonly string[]): string[] {
  const permis = [...new Set(liste)].filter((mot) => !exclus.includes(mot));
  return rngShuffle(rng, permis).slice(0, 3);
}

/** Un début de phrase prend une majuscule : toutes les propositions la prennent, sans quoi elle trahirait la réponse. */
function avecLaCasse(prompt: string, mots: string[]): string[] {
  return prompt.startsWith('...') ? mots.map(majuscule) : mots;
}

function sansLeDernierPoint(complement: string): string {
  return complement.replace(/\.$/, '');
}

// --- Les homophones ---------------------------------------------------------------------------------------------------------

interface CandidatHomophone {
  gabarit: Gabarit;
  phrase: string;
}

function questionHomophone(rng: Rng, rang: number, candidat: CandidatHomophone, connus: Set<string>): Question | null {
  const { gabarit, phrase } = candidat;
  const possibles = gabarit.parmi.filter((mot) => mot !== gabarit.bonne && !gabarit.valides.includes(mot) && (!gabarit.progressif || connus.has(mot)));
  if (possibles.length < 3) return null;
  const compagnon = gabarit.compagnon && possibles.includes(gabarit.compagnon) ? [gabarit.compagnon] : [];
  const autres = rngShuffle(rng, possibles.filter((mot) => !compagnon.includes(mot))).slice(0, 3 - compagnon.length);
  const [bonne, ...mauvaises] = avecLaCasse(phrase, [gabarit.bonne, ...compagnon, ...autres]);
  return question(rng, identifiant('homophone', rang, gabarit.bonne), 'Choisis le mot qui convient', phrase, bonne, mauvaises);
}

/** Les phrases d'une étape, par famille puis par mot juste : « a » et « à » pèsent autant, quel que soit leur nombre de phrases. */
function groupesDeHomophones(level: Level, stage: Stage, nouveaux: boolean): CandidatHomophone[][][] {
  return memoiser(`homophones|${level}|${stage}|${nouveaux}`, () => {
    const parFamille = new Map<string, Map<string, CandidatHomophone[]>>();
    const vues = new Set<string>();
    for (const gabarit of gabaritsDuNiveau(level)) {
      if (gabarit.depuis > stage || (gabarit.depuis === stage) !== nouveaux) continue;
      const famille = parFamille.get(gabarit.famille) ?? new Map<string, CandidatHomophone[]>();
      const liste = famille.get(gabarit.bonne) ?? [];
      for (const phrase of gabarit.phrases) {
        if (vues.has(`${gabarit.bonne}|${phrase}`)) continue;
        vues.add(`${gabarit.bonne}|${phrase}`);
        liste.push({ gabarit, phrase });
      }
      famille.set(gabarit.bonne, liste);
      parFamille.set(gabarit.famille, famille);
    }
    return [...parFamille.values()].map((parBonne) => [...parBonne.values()]);
  });
}

function familleDHomophones(level: Level, stage: Stage, nouveaux: boolean, poids: number): Famille {
  const groupes = groupesDeHomophones(level, stage, nouveaux);
  const connus = motsConnus(gabaritsDuNiveau(level), stage);
  return {
    nom: nouveaux ? 'homophone-nouveau' : 'homophone-revision',
    poids: groupes.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) => fabriquerDistinctesParGroupes(rng, groupes, n, vues, (r, candidat, rang) => questionHomophone(r, rang, candidat, connus)),
  };
}

// --- Les mots à écrire : invariables, lettres qui manquent ---------------------------------------------------------

interface CandidatMot {
  mot: MotInvariable;
  phrase: string;
}

function familleDeMots(level: Level, stage: Stage, poids: number): Famille {
  const groupes = memoiser(`mots|${level}|${stage}`, () => aLEtape(MOTS_INVARIABLES, level, stage).map((mot) => [mot.phrases.map((phrase): CandidatMot => ({ mot, phrase }))]));
  return {
    nom: 'mot',
    poids: groupes.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) =>
      fabriquerDistinctesParGroupes(rng, groupes, n, vues, (r, { mot, phrase }, rang) => {
        const [bonne, ...mauvaises] = avecLaCasse(phrase, [mot.mot, ...mot.fautes]);
        return question(r, identifiant('mot', rang, mot.mot), 'Choisis le mot bien écrit', phrase, bonne, mauvaises);
      }),
  };
}

interface CandidatLettres {
  mot: MotAvecTrou;
  phrase: string;
}

function familleDeLettres(level: Level, stage: Stage, poids: number): Famille {
  const groupes = memoiser(`lettres|${level}|${stage}`, () => {
    if (level === '6e') return [] as CandidatLettres[][][];
    const parRegle = new Map<string, CandidatLettres[][]>();
    for (const mot of MOTS_AVEC_TROU.filter((candidat) => candidat.depuis <= stage)) {
      const liste = parRegle.get(mot.regle) ?? [];
      liste.push(mot.phrases.map((phrase): CandidatLettres => ({ mot, phrase })));
      parRegle.set(mot.regle, liste);
    }
    return [...parRegle.values()];
  });
  return {
    nom: 'lettres',
    poids: groupes.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) =>
      fabriquerDistinctesParGroupes(rng, groupes, n, vues, (r, { mot, phrase }, rang) =>
        question(r, identifiant('lettres', rang, mot.mot), 'Choisis les lettres qui manquent', phrase, mot.manque, mot.fautes)
      ),
  };
}

// --- Le participe en -é, l'infinitif en -er, la 2e personne du pluriel en -ez ---------------------------------

const AVEC_AVOIR_CYCLE_2 = ['Léa a', 'Paul a', 'Nora a', 'Tom a', 'Il a', 'Elle a', 'Mon frère a', 'Ma sœur a', "J'ai", 'Tu as', 'Nous avons', 'Vous avez', 'Ils ont', 'Elles ont', 'Les enfants ont', 'Mes amis ont'];
const AVEC_AVOIR_6E = ['Lucas a', 'Chloé a', 'Inès a', 'Karim a', 'Il a', 'Elle a', 'Mon cousin a', 'Ma voisine a', "J'ai", 'Tu as', 'Nous avons', 'Vous avez', 'Ils ont', 'Elles ont', 'Les élèves ont', 'Mes camarades ont'];
// Des verbes qui se suivent d'un infinitif quel que soit le verbe : « veut », « doit », « va », « peut ».
const AVEC_UN_INFINITIF_CYCLE_2 = [
  ...['Léa', 'Paul', 'Nora', 'Tom', 'Il', 'Elle', 'Mon frère', 'Ma sœur'].flatMap((sujet) => ['veut', 'doit', 'va', 'peut'].map((verbe) => `${sujet} ${verbe}`)),
  ...['Les enfants', 'Mes amis', 'Ils', 'Elles'].flatMap((sujet) => ['veulent', 'doivent', 'vont', 'peuvent'].map((verbe) => `${sujet} ${verbe}`)),
  'Je dois',
  'Je vais',
  'Je veux',
  'Tu veux',
  'Tu dois',
  'Tu vas',
  'Nous allons',
  'Nous devons',
  'Nous voulons',
  'Il faut',
];
const AVEC_UN_INFINITIF_6E = AVEC_UN_INFINITIF_CYCLE_2.map((debut) => debut.replace(/^Léa /, 'Lucas ').replace(/^Paul /, 'Chloé ').replace(/^Nora /, 'Inès ').replace(/^Tom /, 'Karim ').replace(/^Mon frère /, 'Mon cousin ').replace(/^Ma sœur /, 'Ma voisine '));

type SorteDeParticipe = 'participe' | 'infinitif' | 'vous';

interface CandidatParticipe {
  verbe: Verb;
  sorte: SorteDeParticipe;
  debut: string;
}

function groupesDeParticipes(level: Level): CandidatParticipe[][][] {
  return memoiser(`participes|${level}`, () => {
    const verbes = level === '6e' ? VERBES_6E.filter((verbe) => groupeDe(verbe) === 1) : VERBES_REGULIERS_CYCLE_2;
    const avoir = level === '6e' ? AVEC_AVOIR_6E : AVEC_AVOIR_CYCLE_2;
    const infinitif = level === '6e' ? AVEC_UN_INFINITIF_6E : AVEC_UN_INFINITIF_CYCLE_2;
    return [
      verbes.map((verbe) => avoir.map((debut): CandidatParticipe => ({ verbe, sorte: 'participe', debut }))),
      // « aimer » se dit après tous ces verbes, mais « Léa veut aimer les fraises » est une phrase qu'on ne dit pas.
      verbes.filter((verbe) => verbe.infinitive !== 'aimer').map((verbe) => infinitif.map((debut): CandidatParticipe => ({ verbe, sorte: 'infinitif', debut }))),
      verbes.map((verbe) => [{ verbe, sorte: 'vous' as const, debut: 'Vous' }]),
    ];
  });
}

function questionParticipe(rng: Rng, rang: number, { verbe, sorte, debut }: CandidatParticipe): Question {
  const infinitif = verbe.infinitive;
  const participe = `${infinitif.slice(0, -2)}é`;
  const present = verbe.forms['présent'];
  const bonne = sorte === 'participe' ? participe : sorte === 'infinitif' ? infinitif : present.vous;
  // Les quatre formes qu'on confond : « chanté », « chanter », « chantez », « chante ».
  const mauvaises = [participe, infinitif, present.vous, present.il].filter((forme) => forme !== bonne);
  return question(
    rng,
    identifiant('participe', rang, `${infinitif}-${sorte}`),
    // On ne nomme pas le verbe : « veut ... » avec « chanter » dans la consigne donnerait la réponse sans qu'on lise la phrase.
    'Choisis la bonne écriture du verbe',
    `${debut} ... ${sansLeDernierPoint(verbe.complement)}.`,
    bonne,
    mauvaises
  );
}

function familleDeParticipes(level: Level, poids: number): Famille {
  const groupes = groupesDeParticipes(level);
  return {
    nom: 'participe',
    poids,
    fabriquer: (rng, n, vues) => fabriquerDistinctesParGroupes(rng, groupes, n, vues, (r, candidat, rang) => questionParticipe(r, rang, candidat)),
  };
}

// --- L'ordre alphabétique et le dictionnaire --------------------------------------------------------------------------

/** Le mot sans accent ni majuscule : « école » se range avec les « e ». */
function cle(mot: string): string {
  return mot.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Les ensembles de mots qui se départagent à la lettre de rang `rang` : même début, lettres différentes à cet endroit. */
function ensemblesAlphabetiques(rang: number): Map<string, Map<string, string[]>> {
  return memoiser(`alphabet|${rang}`, () => {
    const parDebut = new Map<string, Map<string, string[]>>();
    for (const mot of MOTS_A_RANGER) {
      const sans = cle(mot);
      if (sans.length < rang) continue;
      const debut = sans.slice(0, rang - 1);
      const lettre = sans.charAt(rang - 1);
      const lettres = parDebut.get(debut) ?? new Map<string, string[]>();
      lettres.set(lettre, [...(lettres.get(lettre) ?? []), mot]);
      parDebut.set(debut, lettres);
    }
    for (const [debut, lettres] of [...parDebut]) if (lettres.size < 4) parDebut.delete(debut);
    return parDebut;
  });
}

function quatreMotsDeRang(rng: Rng, rang: number): string[] | null {
  const ensembles = [...ensemblesAlphabetiques(rang).values()];
  if (ensembles.length === 0) return null;
  const lettres = ensembles[rngInt(rng, 0, ensembles.length - 1)];
  return rngShuffle(rng, [...lettres.keys()])
    .slice(0, 4)
    .map((lettre) => rngPick(rng, lettres.get(lettre) as string[]));
}

/** Quatre mots d'une même famille de la 6e : l'ordre se joue à la quatrième lettre ou après. */
function quatreMotsDeLaSixieme(rng: Rng): string[] {
  const famille = FAMILLES_ALPHABETIQUES_6E[rngInt(rng, 0, FAMILLES_ALPHABETIQUES_6E.length - 1)];
  return rngShuffle(rng, famille).slice(0, 4);
}

function questionAlphabet(rng: Rng, rang: number, mots: string[]): Question {
  const premier = rng() < 0.5;
  const rangees = [...mots].sort((a, b) => (cle(a) < cle(b) ? -1 : 1));
  const bonne = premier ? rangees[0] : rangees[rangees.length - 1];
  return question(
    rng,
    identifiant('alphabet', rang, premier ? 'premier' : 'dernier'),
    premier ? "Quel mot vient en premier dans l'ordre alphabétique ?" : "Quel mot vient en dernier dans l'ordre alphabétique ?",
    rngShuffle(rng, mots).join(', '),
    bonne,
    mots.filter((mot) => mot !== bonne)
  );
}

/** « Quelle lettre vient juste après m ? » : le début de l'alphabet, au 1er trimestre du CE1. */
function questionDeLettre(rng: Rng, rang: number): Question {
  const apres = rng() < 0.5;
  const lettre = rngInt(rng, apres ? 0 : 1, apres ? ALPHABET.length - 2 : ALPHABET.length - 1);
  const bonne = ALPHABET.charAt(apres ? lettre + 1 : lettre - 1);
  const mauvaises = rngShuffle(
    rng,
    [...ALPHABET].filter((autre) => autre !== bonne && autre !== ALPHABET.charAt(lettre))
  ).slice(0, 3);
  return question(
    rng,
    identifiant('alphabet', rang, apres ? 'apres' : 'avant'),
    apres ? "Dans l'alphabet, quelle lettre vient juste après ?" : "Dans l'alphabet, quelle lettre vient juste avant ?",
    ALPHABET.charAt(lettre),
    bonne,
    mauvaises
  );
}

/** Le rang des lettres qu'on compare : la 1re au CE1-T1, jusqu'à la 2e au CE1-T2 et T3, jusqu'à la 3e au CE2. */
function rangsDeLettres(level: Level, stage: Stage): number[] {
  if (level === 'CE1') return stage === -5 ? [1] : [1, 2];
  return [2, 3];
}

function familleAlphabetique(level: Level, stage: Stage, poids: number): Famille {
  return {
    nom: 'alphabet',
    poids,
    fabriquer: (rng, n, vues) =>
      fabriquerParEssais(rng, n, vues, (r, rang) => {
        if (level === '6e') return questionAlphabet(r, rang, quatreMotsDeLaSixieme(r));
        if (stage === -5 && r() < 0.4) return questionDeLettre(r, rang);
        const rangs = rangsDeLettres(level, stage);
        const mots = quatreMotsDeRang(r, rangs[rngInt(r, 0, rangs.length - 1)]);
        return mots ? questionAlphabet(r, rang, mots) : null;
      }),
  };
}

function familleDuDictionnaire(poids: number): Famille {
  return {
    nom: 'dictionnaire',
    poids,
    fabriquer: (rng, n, vues) =>
      fabriquerParEssais(rng, n, vues, (r, rang) => {
        if (r() < 0.5) {
          const [abreviation, sens] = rngPick(r, ABREVIATIONS_DU_DICTIONNAIRE);
          const autres = troisAutres(
            r,
            ABREVIATIONS_DU_DICTIONNAIRE.map(([, autre]) => autre),
            [sens]
          );
          return question(r, identifiant('dictionnaire', rang, abreviation), 'Que veut dire cette abréviation du dictionnaire ?', abreviation, sens, autres);
        }
        // Les mots repères d'une page : le mot de la page est entre les deux, les autres en dehors.
        const famille = [...rngPick(r, FAMILLES_ALPHABETIQUES_6E)].sort((a, b) => (cle(a) < cle(b) ? -1 : 1));
        if (famille.length < 5) return null;
        const debut = rngInt(r, 0, 1);
        const fin = debut + 2 + rngInt(r, 0, Math.min(1, famille.length - 4 - debut));
        const dehors = [...famille.slice(0, debut), ...famille.slice(fin + 1)];
        const dedans = famille.slice(debut + 1, fin);
        if (dehors.length < 3 || dedans.length === 0) return null;
        const bonne = rngPick(r, dedans);
        return question(r, identifiant('dictionnaire', rang, 'reperes'), 'Quel mot est sur cette page du dictionnaire ?', `Mots repères : « ${famille[debut]} » et « ${famille[fin]} »`, bonne, rngShuffle(r, dehors).slice(0, 3));
      }),
  };
}

// --- Synonymes, contraires, mots plus forts ----------------------------------------------------------------------------

function familleDeRelations(
  nom: NomDeFamille,
  liste: readonly Relation[],
  consigne: string,
  enonce: (mot: string) => string,
  level: Level,
  stage: Stage,
  poids: number
): Famille {
  const candidats = memoiser(`${nom}|${level}|${stage}`, () => aLEtape(liste, level, stage));
  return {
    nom,
    poids: candidats.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) =>
      fabriquerDistinctes(rng, candidats, n, vues, (r, relation, rang) => question(r, identifiant(nom, rang, relation.bonne), consigne, enonce(relation.mot), relation.bonne, [...relation.fausses])),
  };
}

// --- Les familles de mots -------------------------------------------------------------------------------------------------------

function familleDeMotsDeLaMemeFamille(level: Level, stage: Stage, poids: number): Famille {
  const familles = memoiser(`familles|${level}|${stage}`, () => aLEtape(FAMILLES, level, stage));
  return {
    nom: 'famille',
    poids: familles.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) =>
      fabriquerDistinctes(rng, familles, n, vues, (r, famille: FamilleDeMots, rang) => {
        if (r() < 0.5) {
          // Un mot de la famille, parmi trois mots qui lui ressemblent sans en être.
          const membre = rngPick(r, famille.membres);
          return question(r, identifiant('famille', rang, `${famille.racine}-membre`), 'Trouve le mot de la même famille', `Un mot de la famille de « ${famille.racine} » est...`, membre, troisAutres(r, famille.intrus, []));
        }
        // L'intrus : trois mots de la famille et un mot qui lui ressemble.
        const intrus = rngPick(r, famille.intrus);
        return question(r, identifiant('famille', rang, `${famille.racine}-intrus`), "Trouve l'intrus", `Quel mot n'est pas de la famille de « ${famille.racine} » ?`, intrus, troisAutres(r, famille.membres, []));
      }),
  };
}

// --- Préfixes et suffixes ------------------------------------------------------------------------------------------------------

type CandidatAffixe =
  | { sorte: 'sens'; genre: 'préfixe' | 'suffixe'; affixe: Affixe; mot: string }
  | { sorte: 'reconnaitre'; genre: 'préfixe' | 'suffixe'; affixe: Affixe; mot: string }
  | { sorte: 'contraire'; item: ContraireAvecPrefixe };

/** Les sens qu'on propose parmi les mauvaises réponses, selon le niveau : rien que des sens simples au cycle 2. */
const SENS_DES_PREFIXES: Record<'cycle2' | '6e', string[]> = {
  cycle2: ['de nouveau', 'le contraire', 'avant', 'sous', 'trop'],
  '6e': ['de nouveau', 'le contraire', 'avant', 'au-dessus', 'trop', 'sous', 'entre', 'contre'],
};
const SENS_DES_SUFFIXES = ['celui qui fait', 'petit', "d'une manière", "l'action de", 'qui peut être'];
const PREFIXES_POSSIBLES = ['re-', 'dé-', 'in-', 'pré-', 'sur-', 'en-', 'mé-', 'con-'];
const SUFFIXES_POSSIBLES = ['-eur', '-ette', '-ment', '-able', '-ier', '-eux'];

function groupesDAffixes(level: Level, stage: Stage): CandidatAffixe[][][] {
  return memoiser(`affixes|${level}|${stage}`, () => {
    const prefixes = aLEtape(PREFIXES, level, stage);
    const suffixes = aLEtape(SUFFIXES, level, stage);
    const contraires = aLEtape(CONTRAIRES_AVEC_PREFIXE, level, stage);
    const deAffixes = (affixes: Affixe[], genre: 'préfixe' | 'suffixe') =>
      affixes.map((affixe) => [
        ...affixe.mots.map((mot): CandidatAffixe => ({ sorte: 'sens', genre, affixe, mot })),
        ...(affixe.reconnaissable ? affixe.mots.map((mot): CandidatAffixe => ({ sorte: 'reconnaitre', genre, affixe, mot })) : []),
      ]);
    return [deAffixes(prefixes, 'préfixe'), deAffixes(suffixes, 'suffixe'), [contraires.map((item): CandidatAffixe => ({ sorte: 'contraire', item }))]].filter((groupe) => groupe.some((liste) => liste.length > 0));
  });
}

/** Le préfixe ou le suffixe de ce mot est-il aussi celui d'une autre proposition ? « impossible » commence par « im- », pas par « in- » : ils ne se disputent pas. */
function peutSePrendrePour(mot: string, autre: string, genre: 'préfixe' | 'suffixe', affixe: string): boolean {
  const lettres = autre.replace('-', '');
  if (genre === 'préfixe') return mot.startsWith(lettres) || (affixe === 'im-' && autre === 'in-') || (affixe === 'in-' && autre === 'im-');
  return mot.endsWith(lettres);
}

function questionAffixe(rng: Rng, rang: number, level: Level, candidat: CandidatAffixe): Question | null {
  if (candidat.sorte === 'contraire') {
    const { item } = candidat;
    return question(rng, identifiant('prefixe', rang, `${item.mot}-contraire`), 'Trouve le contraire', `Le contraire de « ${item.mot} » est...`, item.contraire, [...item.famille]);
  }
  const { genre, affixe, mot } = candidat;
  const nom = genre === 'préfixe' ? 'prefixe' : 'suffixe';
  if (candidat.sorte === 'sens') {
    const sensPossibles = genre === 'préfixe' ? SENS_DES_PREFIXES[pourDe(level)] : SENS_DES_SUFFIXES;
    // « sur- » veut dire « au-dessus » ou « trop » : aucun des deux n'est proposé comme mauvaise réponse pour l'autre.
    const exclus = affixe.affixe === 'sur-' ? [affixe.sens, 'au-dessus', 'trop'] : [affixe.sens];
    return question(rng, identifiant(nom, rang, `${affixe.affixe}-sens`), `Trouve le sens du ${genre}`, `« ${affixe.affixe} » dans « ${mot} »`, affixe.sens, troisAutres(rng, sensPossibles, exclus));
  }
  const possibles = (genre === 'préfixe' ? PREFIXES_POSSIBLES : SUFFIXES_POSSIBLES).filter((autre) => autre !== affixe.affixe && !peutSePrendrePour(mot, autre, genre, affixe.affixe));
  if (possibles.length < 3) return null;
  return question(rng, identifiant(nom, rang, `${affixe.affixe}-mot`), `Trouve le ${genre}`, `Le ${genre} du mot « ${mot} » est...`, affixe.affixe, rngShuffle(rng, possibles).slice(0, 3));
}

function familleDAffixes(level: Level, stage: Stage, poids: number): Famille {
  const groupes = groupesDAffixes(level, stage);
  return {
    nom: 'affixe',
    poids: groupes.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) => fabriquerDistinctesParGroupes(rng, groupes, n, vues, (r, candidat, rang) => questionAffixe(r, rang, level, candidat)),
  };
}

// --- Polysémie, expressions ------------------------------------------------------------------------------------------------

interface CandidatPolysemie {
  mot: MotAPlusieursSens;
  sens: number;
  phrase: string;
}

function famillePolysemique(level: Level, stage: Stage, poids: number): Famille {
  const { mots, groupes } = memoiser(`polysemie|${level}|${stage}`, () => {
    const mots = aLEtape(POLYSEMIE, level, stage);
    return { mots, groupes: mots.map((mot) => mot.sens.map((sens, indice) => sens.phrases.map((phrase): CandidatPolysemie => ({ mot, sens: indice, phrase })))) };
  });
  return {
    nom: 'polysemie',
    poids: groupes.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) =>
      fabriquerDistinctesParGroupes(rng, groupes, n, vues, (r, { mot, sens, phrase }, rang) => {
        const bonne = mot.sens[sens].definition;
        // Les autres sens du mot, puis ceux d'autres mots : aucun ne convient à la phrase.
        const memes = mot.sens.filter((_, indice) => indice !== sens).map((autre) => autre.definition);
        const ailleurs = mots.filter((autre) => autre !== mot).flatMap((autre) => autre.sens.map((s) => s.definition));
        const mauvaises = [...rngShuffle(r, memes).slice(0, 2), ...rngShuffle(r, ailleurs)].slice(0, 3);
        if (mauvaises.length < 3) return null;
        return question(r, identifiant('polysemie', rang, mot.mot), 'Que veut dire le mot souligné ?', phrase, bonne, mauvaises);
      }),
  };
}

function familleDExpressions(level: Level, stage: Stage, poids: number): Famille {
  const expressions = memoiser(`expressions|${level}|${stage}`, () => aLEtape(EXPRESSIONS, level, stage));
  return {
    nom: 'expression',
    poids: expressions.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) =>
      fabriquerDistinctes(rng, expressions, n, vues, (r, expression: Expression, rang) =>
        question(
          r,
          identifiant('expression', rang, expression.expression),
          'Que veut dire cette expression ?',
          `« ${expression.expression} »`,
          expression.sens,
          troisAutres(
            r,
            expressions.map((autre) => autre.sens),
            [expression.sens]
          )
        )
      ),
  };
}

// --- Catégories, thèmes, champs lexicaux ----------------------------------------------------------------------------------

/** Trois mots d'un groupe et un mot d'un autre : le mot d'un autre est l'intrus. */
function questionIntrus(rng: Rng, rang: number, groupes: GroupeDeMots[]): Question | null {
  const [groupe, autre] = rngShuffle(rng, groupes);
  if (!groupe || !autre) return null;
  const trois = rngShuffle(rng, groupe.mots).slice(0, 3);
  const intrus = rngPick(rng, autre.mots);
  if (groupe.mots.includes(intrus)) return null;
  return question(rng, identifiant('categorie', rang, `intrus-${groupe.nom}`), "Trouve l'intrus", rngShuffle(rng, [...trois, intrus]).join(', '), intrus, trois);
}

function questionDeRangement(rng: Rng, rang: number, groupes: GroupeDeMots[]): Question | null {
  const groupe = rngPick(rng, groupes);
  const mot = rngPick(rng, groupe.mots);
  // Le mot n'est dans aucun autre groupe de la liste : les autres noms sont toujours de mauvaises réponses.
  const autres = groupes.filter((candidat) => candidat !== groupe && !candidat.mots.includes(mot));
  if (autres.length < 3) return null;
  return question(
    rng,
    identifiant('categorie', rang, `groupe-${mot}`),
    'Dans quel groupe range-t-on ce mot ?',
    mot,
    groupe.nom,
    rngShuffle(rng, autres)
      .slice(0, 3)
      .map((candidat) => candidat.nom)
  );
}

function familleDeCategories(level: Level, stage: Stage, poids: number): Famille {
  const groupes = memoiser(`categories|${level}|${stage}`, () => aLEtape(CATEGORIES, level, stage));
  return {
    nom: 'categorie',
    poids: groupes.length >= 4 ? poids : 0,
    fabriquer: (rng, n, vues) => fabriquerParEssais(rng, n, vues, (r, rang) => (r() < 0.6 ? questionIntrus(r, rang, groupes) : questionDeRangement(r, rang, groupes))),
  };
}

/** Trois mots d'un thème, et un quatrième du même thème parmi trois mots d'autres thèmes. */
function questionDeTheme(rng: Rng, rang: number, themes: GroupeDeMots[], champ: boolean): Question | null {
  const [theme, ...autres] = rngShuffle(rng, themes);
  if (!theme || autres.length < 3) return null;
  const mots = rngShuffle(rng, theme.mots);
  const trois = mots.slice(0, 3);
  const bonne = mots[3];
  if (!bonne) return null;
  const ailleurs = autres.map((autre) => rngPick(rng, autre.mots)).filter((mot) => !theme.mots.includes(mot));
  if (ailleurs.length < 3) return null;
  return question(
    rng,
    identifiant(champ ? 'champ' : 'theme', rang, theme.nom),
    champ ? 'Trouve le mot du même champ lexical' : 'Quel mot va avec les autres ?',
    trois.join(', '),
    bonne,
    ailleurs.slice(0, 3)
  );
}

function familleDeThemes(level: Level, stage: Stage, poids: number): Famille {
  const themes = memoiser(`themes|${level}|${stage}`, () => aLEtape(level === '6e' ? CHAMPS_LEXICAUX : THEMES, level, stage));
  return {
    nom: 'theme',
    poids: themes.length >= 4 ? poids : 0,
    fabriquer: (rng, n, vues) => fabriquerParEssais(rng, n, vues, (r, rang) => questionDeTheme(r, rang, themes, level === '6e')),
  };
}

// --- Registres de langue, racines, figures de style, emprunts ----------------------------------------------------------

function familleDeRegistres(poids: number): Famille {
  const courants = [...new Set([...FAMILIERS, ...SOUTENUS].map((paire) => paire.courant))];
  const trouver = (rng: Rng, rang: number): Question => {
    const choix = rng();
    if (choix < 0.4) {
      const paire = rngPick(rng, FAMILIERS);
      const autres = troisAutres(rng, courants, [paire.courant, paire.mot]);
      return question(rng, identifiant('registre', rang, `familier-${paire.mot}`), 'Quel mot est du langage familier ?', rngShuffle(rng, [paire.mot, ...autres]).join(', '), paire.mot, autres);
    }
    if (choix < 0.7) {
      const paire = rngPick(rng, SOUTENUS);
      const autres = troisAutres(rng, courants, [paire.courant, paire.mot]);
      return question(rng, identifiant('registre', rang, `soutenu-${paire.mot}`), 'Quel mot est du langage soutenu ?', rngShuffle(rng, [paire.mot, ...autres]).join(', '), paire.mot, autres);
    }
    const paire = rngPick(rng, FAMILIERS);
    return question(rng, identifiant('registre', rang, `courant-${paire.mot}`), 'Trouve le mot du langage courant', `Un mot courant pour « ${paire.mot} » est...`, paire.courant, troisAutres(rng, courants, [paire.courant]));
  };
  return { nom: 'registre', poids, fabriquer: (rng, n, vues) => fabriquerParEssais(rng, n, vues, (r, rang) => trouver(r, rang)) };
}

interface CandidatRacine {
  racine: Racine;
  mot: string;
}

function familleDeRacines(level: Level, stage: Stage, poids: number): Famille {
  const racines = memoiser(`racines|${level}|${stage}`, () => aLEtape(RACINES, level, stage));
  const candidats = racines.flatMap((racine) => racine.mots.map((mot): CandidatRacine => ({ racine, mot })));
  return {
    nom: 'racine',
    poids: candidats.length > 0 ? poids : 0,
    fabriquer: (rng, n, vues) =>
      fabriquerDistinctes(rng, candidats, n, vues, (r, { racine, mot }, rang) => {
        // Les autres racines du même mot ne sont pas proposées : « téléphone » contient « télé » (loin) et « phone » (le son).
        const dansLeMot = racines.filter((autre) => autre !== racine && autre.mots.includes(mot)).map((autre) => autre.sens);
        return question(
          r,
          identifiant('racine', rang, `${racine.racine}-${mot}`),
          'Que veut dire cette racine ?',
          `« ${racine.racine} » dans « ${mot} »`,
          racine.sens,
          troisAutres(
            r,
            racines.map((autre) => autre.sens),
            [racine.sens, ...dansLeMot]
          )
        );
      }),
  };
}

const FIGURES = ['une comparaison', 'une métaphore', 'une personnification', 'aucune figure de style'];

function familleDeFigures(poids: number): Famille {
  const phrases: [string, string][] = [
    ...COMPARAISONS.map((phrase): [string, string] => [phrase, FIGURES[0]]),
    ...METAPHORES.map((phrase): [string, string] => [phrase, FIGURES[1]]),
    ...PERSONNIFICATIONS.map((phrase): [string, string] => [phrase, FIGURES[2]]),
    ...PHRASES_SANS_FIGURE.map((phrase): [string, string] => [phrase, FIGURES[3]]),
  ];
  const definitions: [string, string, string[]][] = [
    ['une comparaison', 'Elle rapproche deux choses avec « comme ».', COMPARAISONS],
    ['une métaphore', 'Elle rapproche deux choses sans « comme ».', METAPHORES],
    ['une personnification', 'Elle donne des gestes humains à une chose.', PERSONNIFICATIONS],
  ];
  return {
    nom: 'figure',
    poids,
    fabriquer: (rng, n, vues) => [
      ...fabriquerDistinctes(rng, phrases, Math.max(0, n - 1), vues, (r, [phrase, figure], rang) =>
        question(r, identifiant('figure', rang, figure.replace(/^(une|aucune) /, '')), 'Quelle figure de style trouve-t-on ?', phrase, figure, FIGURES.filter((autre) => autre !== figure))
      ),
      ...fabriquerParEssais(rng, Math.min(1, n), vues, (r, rang) => {
        const [figure, definition, bonnes] = rngPick(r, definitions);
        // Une phrase avec la figure, une avec chacune des deux autres, une sans figure.
        const autres = definitions.filter(([autre]) => autre !== figure).map(([, , liste]) => rngPick(r, liste));
        return question(
          r,
          identifiant('figure', rang, `contient-${figure.replace(/^une /, '')}`),
          `Trouve la phrase qui contient ${figure}`,
          definition,
          rngPick(r, bonnes),
          [...autres, rngPick(r, PHRASES_SANS_FIGURE)]
        );
      }),
    ],
  };
}

const ORIGINES: ['arabe' | 'italien' | 'anglais', string][] = [
  ['arabe', "l'arabe"],
  ['italien', "l'italien"],
  ['anglais', "l'anglais"],
];

function familleDEmprunts(poids: number): Famille {
  return {
    nom: 'emprunt',
    poids,
    fabriquer: (rng, n, vues) =>
      fabriquerParEssais(
        rng,
        n,
        vues,
        (r, rang) => {
          const [langue, nom] = rngPick(r, ORIGINES);
          const autres = ORIGINES.filter(([autre]) => autre !== langue).flatMap(([autre]) => EMPRUNTS[autre]);
          return question(r, identifiant('emprunt', rang, langue), `Trouve le mot venu de ${nom}`, "Un emprunt est un mot venu d'une autre langue.", rngPick(r, EMPRUNTS[langue]), troisAutres(r, autres, []));
        },
        12
      ),
  };
}

// --- La séance --------------------------------------------------------------------------------------------------------------------------

function familles(level: Level, trimester: Trimester): Famille[] {
  const stage = stageOf(level, trimester);
  const poids = PROGRAMME[`${level}-${trimester}`] ?? {};
  const p = (nom: NomDeFamille) => poids[nom] ?? 0;
  return [
    familleDHomophones(level, stage, true, p('homophone-nouveau')),
    familleDHomophones(level, stage, false, p('homophone-revision')),
    familleDeMots(level, stage, p('mot')),
    familleDeLettres(level, stage, p('lettres')),
    familleDeParticipes(level, p('participe')),
    familleAlphabetique(level, stage, p('alphabet')),
    familleDuDictionnaire(p('dictionnaire')),
    familleDeRelations('synonyme', SYNONYMES, 'Trouve le synonyme', (mot) => `Un synonyme de « ${mot} » est...`, level, stage, p('synonyme')),
    familleDeRelations('contraire', CONTRAIRES, 'Trouve le contraire', (mot) => `Le contraire de « ${mot} » est...`, level, stage, p('contraire')),
    familleDeRelations('nuance', SYNONYMES_PLUS_FORTS, 'Trouve le mot plus fort', (mot) => `Un mot plus fort que « ${mot} » est...`, level, stage, p('nuance')),
    familleDeMotsDeLaMemeFamille(level, stage, p('famille')),
    familleDAffixes(level, stage, p('affixe')),
    famillePolysemique(level, stage, p('polysemie')),
    familleDeCategories(level, stage, p('categorie')),
    familleDeThemes(level, stage, p('theme')),
    familleDExpressions(level, stage, p('expression')),
    familleDeRegistres(p('registre')),
    familleDeRacines(level, stage, p('racine')),
    familleDeFigures(p('figure')),
    familleDEmprunts(p('emprunt')),
  ];
}

/** Les questions d'orthographe et de vocabulaire du CE1, du CE2 et de la 6e. */
export function generateNiveau(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  return composer(rng, count, familles(level, trimester));
}

/** Les familles qui entrent dans une séance de ce niveau et de ce trimestre : pour les tests. */
export function famillesDeLEtape(level: Level, trimester: Trimester): NomDeFamille[] {
  return Object.entries(PROGRAMME[`${level}-${trimester}`] ?? {})
    .filter(([, poids]) => (poids ?? 0) > 0)
    .map(([nom]) => nom as NomDeFamille);
}
