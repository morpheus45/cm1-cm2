import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngShuffle } from '../lib/seededRandom';
import { isAvailableAt, stageOf, type Stage } from '../lib/progression';
import { ALL_TENSES, PERSONS, type Person, type Tense, type Verb } from './conjugaisonVerbes';
import {
  AUTRES_INFINITIFS_3E_GROUPE,
  ERREURS_DU_PRESENT,
  ETRE_ET_AVOIR,
  groupeDe,
  imperatifDe,
  IRREGULIERS_CE2_D_ABORD,
  IRREGULIERS_CE2_ENSUITE,
  seConjugueAvecEtre,
  VERBES_1ER_GROUPE_6E,
  VERBES_2E_GROUPE_6E,
  VERBES_3E_GROUPE_6E,
  VERBES_6E,
  VERBES_REGULIERS_CYCLE_2,
} from './conjugaisonVerbesNiveaux';
import {
  commenceParVoyelle,
  composer,
  echantillonParGroupes,
  fabriquerDistinctes,
  sansDoublon,
  type Famille,
} from './francaisNiveaux';

/**
 * La conjugaison du CE1, du CE2 et de la 6e, d'après le programme de chaque
 * niveau et de chaque trimestre. Rien n'est repris du CM1 ni du CM2 :
 * chaque niveau déclare ici ses temps, ses verbes, ses sujets et ses familles
 * de questions.
 *
 * CE1 (programme de cycle 2, 2025) : être, avoir et les verbes du 1er groupe.
 *   T1 le présent ; T2 l'imparfait et le futur ; T3 le passé composé.
 *   Radical, terminaison et infinitif. Pas d'accord du participe passé, donc
 *   aucun verbe qui se conjugue avec « être ».
 * CE2 : les quatre temps, et les huit verbes irréguliers du 3e groupe.
 *   T1 faire, aller, dire, venir au présent ; T2 pouvoir, voir, vouloir,
 *   prendre au présent et les huit à l'imparfait et au futur ; T3 le passé
 *   composé des huit, « il est allé » avec le seul sujet « il » (pas
 *   d'accord du participe passé au cycle 2).
 * 6e (programme de cycle 3, 2025) : les verbes des trois groupes.
 *   T1 présent, imparfait, futur, passé composé ; T2 le passé simple aux
 *   3es personnes et le plus-que-parfait ; T3 le conditionnel présent et
 *   l'impératif présent. Le subjonctif, que le programme ne place pas
 *   avec certitude au cycle 3, n'est pas posé.
 */

/*
 * Les identifiants des questions : `conjugaison-<famille>-<rang>-<verbe>-<détail>`,
 * le verbe toujours en quatrième position (il n'a jamais de trait d'union),
 * le détail étant la bonne réponse (forme, impératif), le temps (temps,
 * infinitif, radical, terminaison) ou le groupe.
 */

// --- Les temps de chaque niveau --------------------------------------------

/** CE1 : le présent d'abord, l'imparfait et le futur au 2e trimestre, le
 *  passé composé au 3e. Le CE2, du même cycle, reprend tout. */
const TEMPS_CYCLE_2: Partial<Record<Tense, Stage>> = {
  'présent': -5,
  'imparfait': -4,
  'futur': -4,
  'passé composé': -3,
};

/** 6e : les quatre temps de l'indicatif qu'il faut avoir en main, puis le
 *  passé simple et le plus-que-parfait, puis le conditionnel présent. */
const TEMPS_6E: Partial<Record<Tense, Stage>> = {
  'présent': 7,
  'imparfait': 7,
  'futur': 7,
  'passé composé': 7,
  'passé simple': 8,
  'plus-que-parfait': 8,
  'conditionnel présent': 9,
};

function tempsDuNiveau(level: Level): Partial<Record<Tense, Stage>> {
  return level === '6e' ? TEMPS_6E : TEMPS_CYCLE_2;
}

/** Les temps enseignés à cette étape, dans l'ordre du programme. */
export function tempsEnseignes(level: Level, trimester: Trimester): Tense[] {
  const stage = stageOf(level, trimester);
  const table = tempsDuNiveau(level);
  return ALL_TENSES.filter((tense) => {
    const depuis = table[tense];
    return depuis !== undefined && isAvailableAt(depuis, stage);
  });
}

// --- Les verbes de chaque niveau -------------------------------------------

/** Un verbe du programme : l'étape où chacun de ses temps est enseigné. */
interface VerbeDuProgramme {
  verbe: Verb;
  depuis: Partial<Record<Tense, Stage>>;
  /** Un verbe régulier du 1er groupe : radical + terminaison, sans variante. */
  regulier: boolean;
  /** Un verbe irrégulier : être, avoir et le 3e groupe. Il pèse plus lourd que
   *  sa place dans la liste (voir `PART_DES_IRREGULIERS`). */
  irregulier: boolean;
}

const VERBES_CYCLE_2: VerbeDuProgramme[] = [
  ...ETRE_ET_AVOIR.map((verbe) => ({ verbe, depuis: TEMPS_CYCLE_2, regulier: false, irregulier: true })),
  ...VERBES_REGULIERS_CYCLE_2.map((verbe) => ({ verbe, depuis: TEMPS_CYCLE_2, regulier: true, irregulier: false })),
  // CE2-T1 : faire, aller, dire, venir au présent ; leur imparfait et leur
  // futur au T2, leur passé composé au T3.
  ...IRREGULIERS_CE2_D_ABORD.map((verbe) => ({
    verbe,
    depuis: { 'présent': -2, 'imparfait': -1, 'futur': -1, 'passé composé': 0 } as Partial<Record<Tense, Stage>>,
    regulier: false,
    irregulier: true,
  })),
  // CE2-T2 : pouvoir, voir, vouloir, prendre arrivent avec leurs trois temps
  // simples ; leur passé composé au T3.
  ...IRREGULIERS_CE2_ENSUITE.map((verbe) => ({
    verbe,
    depuis: { 'présent': -1, 'imparfait': -1, 'futur': -1, 'passé composé': 0 } as Partial<Record<Tense, Stage>>,
    regulier: false,
    irregulier: true,
  })),
];

const VERBES_SIXIEME: VerbeDuProgramme[] = VERBES_6E.map((verbe) => ({
  verbe,
  depuis: TEMPS_6E,
  regulier: false,
  irregulier: groupeDe(verbe) === 3,
}));

/**
 * La part des questions qui portent sur un verbe irrégulier. Les listes
 * comptent beaucoup de verbes réguliers : sans ce poids, être et avoir au CE1
 * (deux verbes sur cinquante-deux), les huit irréguliers au CE2 — le cœur de
 * son programme — passeraient presque inaperçus.
 */
const PART_DES_IRREGULIERS: Partial<Record<Level, number>> = { CE1: 0.3, CE2: 0.5, '6e': 0.4 };

function verbesDuNiveau(level: Level): VerbeDuProgramme[] {
  return level === '6e' ? VERBES_SIXIEME : VERBES_CYCLE_2;
}

/** Les verbes que le niveau conjugue, tous trimestres confondus. */
export function verbesEnseignes(level: Level): Verb[] {
  return verbesDuNiveau(level).map((programme) => programme.verbe);
}

/** Les verbes que le niveau conjugue à cette étape : ceux dont au moins un
 *  temps est déjà enseigné. */
export function verbesDeLEtape(level: Level, trimester: Trimester): Verb[] {
  const stage = stageOf(level, trimester);
  return verbesDuNiveau(level)
    .filter((programme) => ALL_TENSES.some((temps) => programme.depuis[temps] !== undefined && isAvailableAt(programme.depuis[temps] as Stage, stage)))
    .map((programme) => programme.verbe);
}

/** Les temps déjà enseignés d'un verbe à cette étape. */
export function tempsDuVerbe(level: Level, trimester: Trimester, verbe: Verb): Tense[] {
  const stage = stageOf(level, trimester);
  const programme = verbesDuNiveau(level).find((candidate) => candidate.verbe.infinitive === verbe.infinitive);
  if (!programme) return [];
  return ALL_TENSES.filter((temps) => programme.depuis[temps] !== undefined && isAvailableAt(programme.depuis[temps] as Stage, stage));
}

// --- Les sujets ---------------------------------------------------------------

interface Sujet {
  person: Person;
  text: string;
  /** Le passé simple ne s'enseigne qu'aux 3es personnes. */
  troisieme: boolean;
  /** « il », « Paul » : le participe de « il est allé » ne prend aucune marque
   *  d'accord. Au cycle 2, « aller » et « venir » ne se conjuguent au passé
   *  composé qu'avec un tel sujet. */
  masculinSingulier: boolean;
  /** Un adulte de la famille : « Mon oncle grandit très vite » ne se dit pas. */
  adulte: boolean;
}

function sujet(person: Person, text: string, masculinSingulier = false, adulte = false): Sujet {
  return { person, text, troisieme: person === 'il' || person === 'ils', masculinSingulier, adulte };
}

const SUJETS_CYCLE_2: Sujet[] = [
  sujet('je', 'Je'),
  sujet('tu', 'Tu'),
  sujet('il', 'Il', true),
  sujet('il', 'Elle'),
  sujet('il', 'On'),
  sujet('il', 'Léa'),
  sujet('il', 'Paul', true),
  sujet('il', 'Nora'),
  sujet('il', 'Tom', true),
  sujet('il', 'Lola'),
  sujet('il', 'Hugo', true),
  sujet('il', 'Emma'),
  sujet('il', 'Sami', true),
  sujet('nous', 'Nous'),
  sujet('vous', 'Vous'),
  sujet('ils', 'Ils'),
  sujet('ils', 'Elles'),
  sujet('ils', 'Les enfants'),
  sujet('ils', 'Mes amis'),
  sujet('ils', 'Les filles'),
  sujet('ils', 'Les garçons'),
];

/** Des sujets plus variés : aucun ne reprend un mot des phrases de 6e (« le
 *  professeur », « la classe », « un voisin »), pour qu'une phrase ne se
 *  répète pas elle-même. */
const SUJETS_6E: Sujet[] = [
  sujet('je', 'Je'),
  sujet('tu', 'Tu'),
  sujet('il', 'Il', true),
  sujet('il', 'Elle'),
  sujet('il', 'On'),
  sujet('il', 'Léa'),
  sujet('il', 'Paul', true),
  sujet('il', 'Nora'),
  sujet('il', 'Camille'),
  sujet('il', 'Hugo', true),
  sujet('il', 'Inès'),
  sujet('il', 'Lucas', true),
  sujet('il', 'Manon'),
  sujet('il', 'Ma grand-mère', false, true),
  sujet('il', 'Mon oncle', true, true),
  sujet('nous', 'Nous'),
  sujet('vous', 'Vous'),
  sujet('ils', 'Ils'),
  sujet('ils', 'Elles'),
  sujet('ils', 'Mes cousins'),
  sujet('ils', 'Mes cousines'),
  sujet('ils', 'Les jumelles'),
  sujet('ils', 'Mes camarades'),
  sujet('ils', 'Mes parents', false, true),
  sujet('ils', 'Les deux frères'),
];

function sujetsDuNiveau(level: Level): Sujet[] {
  return level === '6e' ? SUJETS_6E : SUJETS_CYCLE_2;
}

/** « je » s'élide devant une voyelle ou un h muet, accentués compris
 *  (« j'écoute », « j'étais »). Le trou cache la forme, pas l'élision : elle
 *  se décide d'après la bonne réponse. */
function elide(sujetPhrase: Sujet, forme: string): boolean {
  return sujetPhrase.person === 'je' && commenceParVoyelle(forme);
}

function sujetAvecTrou(sujetPhrase: Sujet, forme: string): string {
  return elide(sujetPhrase, forme) ? "J'..." : `${sujetPhrase.text} ...`;
}

function sujetAvecForme(sujetPhrase: Sujet, forme: string): string {
  return elide(sujetPhrase, forme) ? `J'**${forme}**` : `${sujetPhrase.text} **${forme}**`;
}

/** « au présent », mais « à l'imparfait ». */
function atTense(tense: Tense): string {
  return /^[aeiouyéèêâîôû]/i.test(tense) ? `à l'${tense}` : `au ${tense}`;
}

function estCompose(tense: Tense): boolean {
  return tense === 'passé composé' || tense === 'plus-que-parfait';
}

// --- Ce qui est posé à chaque étape ----------------------------------------

interface Candidat {
  programme: VerbeDuProgramme;
  temps: Tense;
  sujet: Sujet;
}

/** Un verbe, à un temps, avec un sujet : la phrase est-elle dans le
 *  programme ? Le passé simple n'a que des 3es personnes. Un verbe qui se
 *  conjugue avec « être » a un participe accordé avec son sujet : l'accord ne
 *  s'enseigne qu'au CM1, donc la 6e (qui l'enseigne dans les accords) ne
 *  pose pas ces temps composés ici, et le cycle 2 ne les pose qu'avec un
 *  sujet « il » où le participe ne porte aucune marque. */
function convient(level: Level, verbe: Verb, temps: Tense, sujetPhrase: Sujet): boolean {
  if (temps === 'passé simple' && !sujetPhrase.troisieme) return false;
  // « grandir très vite » se dit d'un enfant, pas d'un oncle ni de parents.
  if (verbe.infinitive === 'grandir' && sujetPhrase.adulte) return false;
  if (estCompose(temps) && seConjugueAvecEtre(verbe)) {
    return level !== '6e' && sujetPhrase.masculinSingulier;
  }
  return true;
}

/** Les phrases possibles à une étape, rangées par verbe, puis par temps. */
interface Candidats {
  /** Les candidats d'un verbe irrégulier : un tableau par verbe, qui contient un tableau par temps. */
  irreguliers: Candidat[][][];
  /** Les candidats d'un verbe régulier, rangés de la même façon. */
  reguliers: Candidat[][][];
  /** Ceux d'entre eux dont on peut demander le radical et la terminaison. */
  radicaux: Candidat[];
}

const memoCandidats = new Map<Stage, Candidats>();

function candidatsDe(level: Level, trimester: Trimester): Candidats {
  const stage = stageOf(level, trimester);
  const deja = memoCandidats.get(stage);
  if (deja) return deja;
  const candidats: Candidats = { irreguliers: [], reguliers: [], radicaux: [] };
  for (const programme of verbesDuNiveau(level)) {
    const duVerbe: Candidat[][] = [];
    for (const temps of ALL_TENSES) {
      const depuis = programme.depuis[temps];
      if (depuis === undefined || !isAvailableAt(depuis, stage)) continue;
      const auTemps: Candidat[] = [];
      for (const sujetPhrase of sujetsDuNiveau(level)) {
        if (convient(level, programme.verbe, temps, sujetPhrase)) auTemps.push({ programme, temps, sujet: sujetPhrase });
      }
      if (auTemps.length > 0) duVerbe.push(auTemps);
    }
    if (duVerbe.length > 0) (programme.irregulier ? candidats.irreguliers : candidats.reguliers).push(duVerbe);
  }
  candidats.radicaux = candidats.reguliers.flat(2).filter(radicalOuTerminaisonPossible);
  memoCandidats.set(stage, candidats);
  return candidats;
}

/** Des candidats pour une famille : une part de verbes irréguliers, le reste
 *  de verbes réguliers, chaque verbe pesant autant que les autres de sa part. */
function tirerCandidats(rng: Rng, level: Level, candidats: Candidats, n: number): Candidat[] {
  const total = n * 4 + 8;
  const partIrreguliers = candidats.irreguliers.length === 0 ? 0 : candidats.reguliers.length === 0 ? 1 : (PART_DES_IRREGULIERS[level] ?? 0.3);
  const nIrreguliers = Math.round(total * partIrreguliers);
  return [
    ...echantillonParGroupes(rng, candidats.irreguliers, nIrreguliers),
    ...echantillonParGroupes(rng, candidats.reguliers, total - nIrreguliers),
  ];
}

// --- Compléter la forme du verbe ---------------------------------------------

/** Les mauvaises formes d'un temps simple ou composé : celles des autres
 *  personnes — l'erreur d'élève la plus fréquente est de bien choisir le temps
 *  mais de mal accorder la personne. */
function autresPersonnes(rng: Rng, verbe: Verb, temps: Tense, personne: Person): string[] {
  const autres = PERSONS.filter((candidate) => candidate !== personne);
  return rngShuffle(rng, autres).map((candidate) => verbe.forms[temps][candidate]);
}

/**
 * Au cycle 2, les mauvaises réponses d'une forme à compléter sont celles des
 * autres personnes du même temps. Au passé composé, l'erreur classique en
 * plus : le participe en -é remplacé par l'infinitif en -er (« a chanter »),
 * et, pour « aller » et « venir », l'auxiliaire « avoir » à la place d'« être ».
 */
function distracteursCycle2(rng: Rng, verbe: Verb, temps: Tense, personne: Person, correct: string): string[] {
  if (temps === 'passé composé' && seConjugueAvecEtre(verbe)) {
    const participe = correct.split(' ')[1];
    return [`a ${participe}`, `est ${verbe.infinitive}`, `es ${participe}`];
  }
  const memes = autresPersonnes(rng, verbe, temps, personne);
  const erreur = temps === 'présent' ? ERREURS_DU_PRESENT[verbe.infinitive]?.[personne] : undefined;
  if (erreur) return [erreur, ...memes];
  if (temps === 'passé composé' && verbe.infinitive.endsWith('er') && verbe.infinitive !== 'aller') {
    const auxiliaire = correct.split(' ')[0];
    return [`${auxiliaire} ${verbe.infinitive}`, ...memes];
  }
  return memes;
}

/**
 * En 6e, les confusions qu'on fait vraiment : une autre personne du même
 * temps, et la même personne à un autre temps (« il chanta / il chantait »,
 * « il avait chanté / il a chanté »). Seuls les temps déjà enseignés sont
 * proposés. Au passé simple, qui n'a que des 3es personnes, l'autre
 * personne est « il » ou « ils ». Les temps composés d'un verbe qui se
 * conjugue avec « être » ne servent jamais de mauvaise réponse : leur
 * participe s'accorde.
 */
function distracteurs6e(rng: Rng, verbe: Verb, temps: Tense, personne: Person, correct: string, enseignes: Tense[]): string[] {
  const personnes: Person[] =
    temps === 'passé simple'
      ? [personne === 'il' ? 'ils' : 'il']
      : PERSONS.filter((candidate) => candidate !== personne);
  const memeTemps = rngShuffle(rng, personnes).map((candidate) => verbe.forms[temps][candidate]);
  const erreur = temps === 'présent' ? ERREURS_DU_PRESENT[verbe.infinitive]?.[personne] : undefined;
  if (erreur) memeTemps.unshift(erreur);
  // Le passé simple n'est enseigné qu'aux 3es personnes : jamais « commençâtes ».
  const autresTemps = rngShuffle(
    rng,
    enseignes.filter(
      (candidate) =>
        candidate !== temps &&
        !(estCompose(candidate) && seConjugueAvecEtre(verbe)) &&
        !(candidate === 'passé simple' && personne !== 'il' && personne !== 'ils')
    )
  ).map((candidate) => verbe.forms[candidate][personne]);
  return [...memeTemps.slice(0, 1), ...autresTemps.slice(0, 2), ...memeTemps.slice(1), ...autresTemps.slice(2)];
}

function formeQuestion(rng: Rng, rang: number, level: Level, enseignes: Tense[], candidat: Candidat): Question | null {
  const { programme, temps, sujet: sujetPhrase } = candidat;
  const verbe = programme.verbe;
  const correct = verbe.forms[temps][sujetPhrase.person];
  const propositions =
    level === '6e'
      ? distracteurs6e(rng, verbe, temps, sujetPhrase.person, correct, enseignes)
      : distracteursCycle2(rng, verbe, temps, sujetPhrase.person, correct);
  // Avec « je », le trou est écrit « J'... » devant une réponse qui commence par
  // une voyelle : une mauvaise réponse qui commencerait par une consonne la
  // trahirait. Les mauvaises réponses commencent donc comme la bonne.
  const memeDebut = (forme: string) => sujetPhrase.person !== 'je' || commenceParVoyelle(forme) === commenceParVoyelle(correct);
  const mauvaises = sansDoublon(propositions.filter(memeDebut), [correct]).slice(0, 3);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [correct, ...mauvaises]);
  return {
    id: `conjugaison-forme-${rang}-${verbe.infinitive}-${correct}`,
    domain: 'conjugaison',
    instruction: `Complète ${atTense(temps)} — verbe « ${verbe.infinitive} »`,
    prompt: `${sujetAvecTrou(sujetPhrase, correct)} ${verbe.complement}`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// --- Reconnaître le temps ----------------------------------------------------

/** Au moins quatre temps pour en reconnaître un : avec moins, il n'y a pas de
 *  quoi faire quatre propositions. */
const MIN_TEMPS_POUR_RECONNAITRE = 4;

function tempsQuestion(rng: Rng, rang: number, enseignes: Tense[], candidat: Candidat): Question | null {
  const { programme, temps, sujet: sujetPhrase } = candidat;
  const verbe = programme.verbe;
  const correct = verbe.forms[temps][sujetPhrase.person];
  // « Il remplit », « il dit » : la même forme au présent et au passé simple.
  // Un temps qui donne la même forme serait aussi une bonne réponse : il ne
  // peut pas être proposé.
  const autres = rngShuffle(
    rng,
    enseignes.filter((candidate) => candidate !== temps && verbe.forms[candidate][sujetPhrase.person] !== correct)
  ).slice(0, 3);
  if (autres.length < 3) return null;
  const choices = rngShuffle(rng, [temps, ...autres]);
  return {
    id: `conjugaison-temps-${rang}-${verbe.infinitive}-${temps}`,
    domain: 'conjugaison',
    instruction: 'À quel temps est le verbe souligné ?',
    prompt: `${sujetAvecForme(sujetPhrase, correct)} ${verbe.complement}`,
    choices,
    correctIndex: choices.indexOf(temps),
  };
}

// --- Trouver l'infinitif ------------------------------------------------------

/** Les formes qui appartiennent à deux verbes d'un même niveau (« il vit »
 *  est voir au passé simple et vivre au présent) ne servent pas à demander
 *  l'infinitif : il n'y aurait pas une seule bonne réponse. */
function formesAmbigues(level: Level): Set<string> {
  const parForme = new Map<string, Set<string>>();
  for (const { verbe } of verbesDuNiveau(level)) {
    for (const temps of ALL_TENSES) {
      for (const personne of PERSONS) {
        const forme = verbe.forms[temps][personne];
        const verbes = parForme.get(forme) ?? new Set<string>();
        verbes.add(verbe.infinitive);
        parForme.set(forme, verbes);
      }
    }
  }
  return new Set([...parForme].filter(([, verbes]) => verbes.size > 1).map(([forme]) => forme));
}

const memoAmbigues = new Map<Level, Set<string>>();

function ambiguesDe(level: Level): Set<string> {
  const deja = memoAmbigues.get(level);
  if (deja) return deja;
  const formes = formesAmbigues(level);
  memoAmbigues.set(level, formes);
  return formes;
}

function participeDe(verbe: Verb): string {
  return verbe.forms['passé composé'].tu.split(' ')[1];
}

function infinitifQuestion(rng: Rng, rang: number, level: Level, trimester: Trimester, candidat: Candidat): Question | null {
  const { programme, temps, sujet: sujetPhrase } = candidat;
  const verbe = programme.verbe;
  const correct = verbe.forms[temps][sujetPhrase.person];
  if (ambiguesDe(level).has(correct)) return null;
  // Avec être ou avoir, « a été » et « a eu » mêlent l'auxiliaire et le verbe :
  // pas de question sur l'infinitif d'un temps composé de ces deux verbes.
  if (estCompose(temps) && ['être', 'avoir'].includes(verbe.infinitive)) return null;

  const stage = stageOf(level, trimester);
  const participeEnseigne = level === '6e' || isAvailableAt(TEMPS_CYCLE_2['passé composé'] as Stage, stage);
  const memeSorte = verbesDuNiveau(level)
    .map((candidate) => candidate.verbe)
    .filter((autre) => autre.infinitive !== verbe.infinitive && autre.infinitive.endsWith('er') === verbe.infinitive.endsWith('er'));
  // Les infinitifs qui commencent par la même lettre se confondent plus
  // volontiers : « vais », « vois », « viens » et « veux » commencent tous par v.
  const memeLettre = memeSorte.filter((autre) => autre.infinitive[0] === verbe.infinitive[0]);
  const autres = [...rngShuffle(rng, memeLettre), ...rngShuffle(rng, memeSorte)].map((autre) => autre.infinitive);
  const erreurs: string[] = [];
  if (programme.regulier && participeEnseigne) erreurs.push(participeDe(verbe));
  const mauvaises = sansDoublon([...erreurs, ...autres], [verbe.infinitive]).slice(0, 3);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [verbe.infinitive, ...mauvaises]);
  return {
    id: `conjugaison-infinitif-${rang}-${verbe.infinitive}-${temps}`,
    domain: 'conjugaison',
    instruction: "Quel est l'infinitif du verbe souligné ?",
    prompt: `${sujetAvecForme(sujetPhrase, correct)} ${verbe.complement}`,
    choices,
    correctIndex: choices.indexOf(verbe.infinitive),
  };
}

// --- Le radical et la terminaison (verbes réguliers du 1er groupe) -----------

/** Les terminaisons d'un verbe du 1er groupe, aux deux temps où le programme
 *  du cycle 2 les fait repérer. Au futur, la terminaison s'ajoute à
 *  l'infinitif : on n'y cherche pas de radical. */
const TERMINAISONS: Partial<Record<Tense, Record<Person, string>>> = {
  'présent': { je: 'e', tu: 'es', il: 'e', nous: 'ons', vous: 'ez', ils: 'ent' },
  'imparfait': { je: 'ais', tu: 'ais', il: 'ait', nous: 'ions', vous: 'iez', ils: 'aient' },
};

function radicalOuTerminaisonPossible(candidat: Candidat): boolean {
  return candidat.programme.regulier && TERMINAISONS[candidat.temps] !== undefined;
}

function radicalQuestion(rng: Rng, rang: number, candidat: Candidat): Question | null {
  const { programme, temps, sujet: sujetPhrase } = candidat;
  const verbe = programme.verbe;
  const terminaison = TERMINAISONS[temps]?.[sujetPhrase.person];
  if (!terminaison) return null;
  const forme = verbe.forms[temps][sujetPhrase.person];
  const radical = verbe.infinitive.slice(0, -2);
  if (forme !== `${radical}${terminaison}`) return null;
  // Les erreurs : couper une lettre trop tôt, une lettre trop tard (la forme
  // entière quand la terminaison est « e »), ou garder l'infinitif.
  const mauvaises = sansDoublon([radical.slice(0, -1), `${radical}${terminaison[0]}`, verbe.infinitive], [radical]);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [radical, ...mauvaises]);
  return {
    id: `conjugaison-radical-${rang}-${verbe.infinitive}-${temps}`,
    domain: 'conjugaison',
    instruction: 'Quel est le radical du verbe souligné ?',
    prompt: `${sujetAvecForme(sujetPhrase, forme)} ${verbe.complement}`,
    choices,
    correctIndex: choices.indexOf(radical),
  };
}

function terminaisonQuestion(rng: Rng, rang: number, candidat: Candidat): Question | null {
  const { programme, temps, sujet: sujetPhrase } = candidat;
  const verbe = programme.verbe;
  const table = TERMINAISONS[temps];
  if (!table) return null;
  const terminaison = table[sujetPhrase.person];
  const forme = verbe.forms[temps][sujetPhrase.person];
  if (forme !== `${verbe.infinitive.slice(0, -2)}${terminaison}`) return null;
  const mauvaises = rngShuffle(rng, sansDoublon(Object.values(table), [terminaison])).slice(0, 3);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [`-${terminaison}`, ...mauvaises.map((autre) => `-${autre}`)]);
  return {
    id: `conjugaison-terminaison-${rang}-${verbe.infinitive}-${temps}`,
    domain: 'conjugaison',
    instruction: 'Quelle est la terminaison du verbe souligné ?',
    prompt: `${sujetAvecForme(sujetPhrase, forme)} ${verbe.complement}`,
    choices,
    correctIndex: choices.indexOf(`-${terminaison}`),
  };
}

// --- Reconnaître le groupe d'un verbe (6e) ----------------------------------

interface VerbeDeGroupe {
  infinitif: string;
  groupe: 1 | 2 | 3;
}

/** Les verbes dont on demande le groupe, et ceux qui servent de mauvaises
 *  réponses : être et avoir sont absents, et les verbes en -ir qui ne sont pas
 *  du 2e groupe (partir, courir, ouvrir) y sont, pour le piège. */
const VERBES_DE_GROUPE: VerbeDeGroupe[] = [
  ...VERBES_1ER_GROUPE_6E.map((verbe) => ({ infinitif: verbe.infinitive, groupe: 1 as const })),
  ...VERBES_2E_GROUPE_6E.map((verbe) => ({ infinitif: verbe.infinitive, groupe: 2 as const })),
  ...VERBES_3E_GROUPE_6E.filter((verbe) => !ETRE_ET_AVOIR.some((auxiliaire) => auxiliaire.infinitive === verbe.infinitive)).map(
    (verbe) => ({ infinitif: verbe.infinitive, groupe: groupeDe(verbe) })
  ),
  ...AUTRES_INFINITIFS_3E_GROUPE.map((infinitif) => ({ infinitif, groupe: 3 as const })),
];

const NOM_DU_GROUPE: Record<1 | 2 | 3, string> = { 1: '1er groupe', 2: '2e groupe', 3: '3e groupe' };

interface CandidatGroupe {
  groupe: 1 | 2 | 3;
  bonne: VerbeDeGroupe;
}

const CANDIDATS_GROUPE: CandidatGroupe[] = VERBES_DE_GROUPE.map((bonne) => ({ groupe: bonne.groupe, bonne }));

function groupeQuestion(rng: Rng, rang: number, candidat: CandidatGroupe): Question | null {
  const { groupe, bonne } = candidat;
  // Les trois autres sont d'un autre groupe que le bon : une seule bonne
  // réponse. Quand on cherche un verbe du 2e groupe, le 3e groupe lui oppose
  // ses verbes en -ir (partir, courir, ouvrir), qui lui ressemblent.
  const autres = rngShuffle(rng, VERBES_DE_GROUPE.filter((verbe) => verbe.groupe !== groupe));
  const mauvaises: VerbeDeGroupe[] = [];
  for (const verbe of autres) {
    if (mauvaises.length >= 3) break;
    if (!mauvaises.some((deja) => deja.infinitif === verbe.infinitif)) mauvaises.push(verbe);
  }
  if (mauvaises.length < 3) return null;
  const choix = rngShuffle(rng, [bonne, ...mauvaises]);
  return {
    id: `conjugaison-groupe-${rang}-${bonne.infinitif}-${groupe}`,
    domain: 'conjugaison',
    instruction: `Quel verbe est du ${NOM_DU_GROUPE[groupe]} ?`,
    prompt: choix.map((verbe) => verbe.infinitif).join(' – '),
    choices: choix.map((verbe) => verbe.infinitif),
    correctIndex: choix.indexOf(bonne),
  };
}

// --- L'impératif présent (6e, 3e trimestre) -----------------------------------

/** À qui l'ordre s'adresse : une seule personne (« tu »), ou plusieurs
 *  (« vous »). Jamais « nous » : « Léa, chantons ! » et « Les enfants,
 *  chantons ! » sont des phrases justes, qui feraient deux bonnes réponses. */
const DESTINATAIRES: Record<'tu' | 'vous', string[]> = {
  tu: ['Léa', 'Paul', 'Nora', 'Camille', 'Hugo', 'Inès', 'Lucas', 'Manon', 'Tom', 'Emma', 'Sami', 'Lola'],
  vous: ['Les enfants', 'Mes amis', 'Les élèves', 'Mes cousins', 'Les filles', 'Les garçons', 'Mes camarades', 'Les jumelles'],
};

/** Les erreurs d'élève qu'aucune règle de dérivation ne prévoit. */
const ERREURS_VOUS: Record<string, string> = { faire: 'faisez', dire: 'disez' };

interface CandidatImperatif {
  verbe: Verb;
  personne: 'tu' | 'vous';
  destinataire: string;
}

const CANDIDATS_IMPERATIF: CandidatImperatif[] = VERBES_6E.filter((verbe) => imperatifDe(verbe) !== null).flatMap((verbe) =>
  (['tu', 'vous'] as const).flatMap((personne) => DESTINATAIRES[personne].map((destinataire) => ({ verbe, personne, destinataire })))
);

function imperatifQuestion(rng: Rng, rang: number, candidat: CandidatImperatif): Question | null {
  const { verbe, personne, destinataire } = candidat;
  const imperatif = imperatifDe(verbe);
  if (!imperatif) return null;
  const correct = imperatif[personne];
  const participe = participeDe(verbe);
  const présent = verbe.forms['présent'];
  const fautes =
    personne === 'tu'
      ? [présent.tu, présent.il, participe, `${participe}e`, 'soit', 'ait', `${participe}s`]
      : [ERREURS_VOUS[verbe.infinitive] ?? '', présent.ils, participe, présent.tu, `${participe}s`];
  // « soit » et « ait » (subjonctif) ne servent qu'à être et avoir.
  const utiles = fautes.filter((faute) => faute !== '' && !(['soit', 'ait'].includes(faute) && !['être', 'avoir'].includes(verbe.infinitive)));
  const mauvaises = sansDoublon(utiles, [correct, imperatif.nous]).slice(0, 3);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [correct, ...mauvaises]);
  return {
    id: `conjugaison-imperatif-${rang}-${verbe.infinitive}-${correct}`,
    domain: 'conjugaison',
    instruction: `Complète à l'impératif présent — verbe « ${verbe.infinitive} »`,
    prompt: `${destinataire}, ... ${verbe.complement.replace(/\.$/, ' !')}`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// --- Les familles de chaque étape ---------------------------------------------

type Poids = { forme: number; temps: number; infinitif: number; radical: number; terminaison: number; groupe: number; imperatif: number };

/** Le poids des familles dans une séance de douze questions. Conjuguer reste
 *  l'essentiel ; les autres familles sont celles que le programme de chaque
 *  niveau demande de savoir faire. */
function poidsDeLEtape(level: Level, trimester: Trimester, enseignes: Tense[]): Poids {
  const peutReconnaitre = enseignes.length >= MIN_TEMPS_POUR_RECONNAITRE;
  if (level === '6e') {
    return {
      forme: 6,
      temps: peutReconnaitre ? 3 : 0,
      infinitif: 1,
      radical: 0,
      terminaison: 0,
      groupe: trimester === 3 ? 1 : 2,
      imperatif: trimester === 3 ? 2 : 0,
    };
  }
  if (!peutReconnaitre) {
    // CE1-T1 et T2 : seulement le présent, puis l'imparfait et le futur.
    return { forme: 6, temps: 0, infinitif: 2, radical: 2, terminaison: 2, groupe: 0, imperatif: 0 };
  }
  return { forme: 5, temps: 3, infinitif: 2, radical: 1, terminaison: 1, groupe: 0, imperatif: 0 };
}

export function generateNiveau(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const enseignes = tempsEnseignes(level, trimester);
  if (enseignes.length === 0) return [];
  const candidats = candidatsDe(level, trimester);
  const poids = poidsDeLEtape(level, trimester, enseignes);
  const tirage = (generateur: Rng, n: number) => tirerCandidats(generateur, level, candidats, n);

  const familles: Famille[] = [
    {
      nom: 'forme',
      poids: poids.forme,
      fabriquer: (generateur, n, vues) =>
        fabriquerDistinctes(generateur, tirage(generateur, n), n, vues, (r, candidat, rang) =>
          formeQuestion(r, rang, level, enseignes, candidat)
        ),
    },
    {
      nom: 'temps',
      poids: poids.temps,
      fabriquer: (generateur, n, vues) =>
        fabriquerDistinctes(generateur, tirage(generateur, n), n, vues, (r, candidat, rang) =>
          tempsQuestion(r, rang, enseignes, candidat)
        ),
    },
    {
      nom: 'infinitif',
      poids: poids.infinitif,
      fabriquer: (generateur, n, vues) =>
        fabriquerDistinctes(generateur, tirage(generateur, n), n, vues, (r, candidat, rang) =>
          infinitifQuestion(r, rang, level, trimester, candidat)
        ),
    },
    {
      nom: 'radical',
      poids: poids.radical,
      fabriquer: (generateur, n, vues) =>
        fabriquerDistinctes(generateur, candidats.radicaux, n, vues, (r, candidat, rang) => radicalQuestion(r, rang, candidat)),
    },
    {
      nom: 'terminaison',
      poids: poids.terminaison,
      fabriquer: (generateur, n, vues) =>
        fabriquerDistinctes(generateur, candidats.radicaux, n, vues, (r, candidat, rang) => terminaisonQuestion(r, rang, candidat)),
    },
    {
      nom: 'groupe',
      poids: poids.groupe,
      fabriquer: (generateur, n, vues) =>
        fabriquerDistinctes(generateur, CANDIDATS_GROUPE, n, vues, (r, candidat, rang) => groupeQuestion(r, rang, candidat)),
    },
    {
      nom: 'impératif',
      poids: poids.imperatif,
      fabriquer: (generateur, n, vues) =>
        fabriquerDistinctes(generateur, CANDIDATS_IMPERATIF, n, vues, (r, candidat, rang) => imperatifQuestion(r, rang, candidat)),
    },
  ];
  return composer(rng, count, familles);
}
