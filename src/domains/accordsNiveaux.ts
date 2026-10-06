import type { Level, Question, Trimester } from '../types';
import type { Rng } from '../lib/seededRandom';
import { rngPick, rngShuffle } from '../lib/seededRandom';
import { isAvailableAt, stageOf, type Stage } from '../lib/progression';
import {
  ADJECTIFS_CYCLE_2,
  COUPLES_MASCULIN_FEMININ,
  formeDeLAdjectif,
  formeDuNom,
  NOMS_CYCLE_2,
  type AdjectifEcrit,
  type Categorie,
  type Genre,
  type NomEcrit,
  type Nombre,
} from './accordsLexiqueCycle2';
import {
  ACTIONS_DE_PERSONNES,
  ACTIONS_D_ANIMAUX,
  ADJECTIFS_6E,
  ANIMAUX_DOMESTIQUES,
  complementsPourPersonne,
  COMPLEMENTS_D_ANIMAUX,
  COMPLEMENTS_PAR_CATEGORIE,
  COUPLES_DE_SUJETS,
  COUPLES_D_ANIMAUX,
  NOMS_6E,
  PARTICIPES_AVEC_AVOIR,
  PARTICIPES_AVEC_ETRE,
  PRENOMS_6E,
  SCENES,
  SUJETS_AVEC_AVOIR,
  type ComplementDuNom,
  type Participe,
  type SujetAvecAvoir,
  type VerbeAvecAvoir,
} from './accordsLexiqueSixieme';
import { group1, paradigm, PERSONS, type Person, type Tense, type Verb } from './conjugaisonVerbes';
import { tempsDuVerbe, verbesDeLEtape } from './conjugaisonNiveaux';
import { VERBES_6E } from './conjugaisonVerbesNiveaux';
import { commenceParVoyelle, composer, fabriquerDistinctes, majuscule, sansDoublon, type Famille } from './francaisNiveaux';

/**
 * Les accords du CE1, du CE2 et de la 6e, d'après le programme de chaque niveau
 * et de chaque trimestre.
 *
 * CE1 : T1 le déterminant, le pluriel en -s et le féminin en -e des noms ; T2
 *   l'adjectif qui s'accorde avec son nom, le féminin avec doublement de la
 *   consonne, l'accord du verbe avec son sujet (« les enfants jouent ») ; T3
 *   ces accords réunis, le sujet pouvant porter un adjectif.
 * CE2 : le groupe nominal et le sujet-verbe (« les petits chats dorment ») dès
 *   le T1 ; au T2 le pluriel en -x et en -aux, le féminin des adjectifs,
 *   l'accord de l'attribut (« les fleurs sont jolies »). Le sujet éloigné ou
 *   inversé n'est pas attendu.
 * 6e : T1 le groupe nominal, le sujet-verbe y compris le sujet placé après le
 *   verbe, éloigné de lui ou double, le participe passé avec « être » ; T2 le
 *   participe passé avec « avoir » et un COD placé avant le verbe ; T3 les
 *   accords complexes (l'attribut d'un sujet éloigné ou double).
 *
 * Une question n'a qu'une bonne réponse : les mauvaises sont fausses par le
 * genre ou le nombre, jamais par autre chose que ce que la question mesure, et
 * jamais une forme qui conviendrait tout aussi bien.
 */

/*
 * Les identifiants : `accords-<famille>-<rang>-<détail>`. Les noms des familles
 * diffèrent de ceux du CM (nominal, adjectif, sujet, participe) : les contrôles
 * qui visent le CM ne les prennent pas pour les leurs.
 */

// --- Les déterminants ------------------------------------------------------------

interface Determinant {
  mot: string;
  /** Le genre qu'il impose, ou `null` : « des » et « les » vont aux deux. */
  genre: Genre | null;
  nombre: Nombre;
  defini: boolean;
}

const DETERMINANTS: Determinant[] = [
  { mot: 'un', genre: 'm', nombre: 'singulier', defini: false },
  { mot: 'une', genre: 'f', nombre: 'singulier', defini: false },
  { mot: 'des', genre: null, nombre: 'pluriel', defini: false },
  { mot: 'le', genre: 'm', nombre: 'singulier', defini: true },
  { mot: 'la', genre: 'f', nombre: 'singulier', defini: true },
  { mot: 'les', genre: null, nombre: 'pluriel', defini: true },
];

function convientAvec(determinant: Determinant, genre: Genre, nombre: Nombre): boolean {
  return determinant.nombre === nombre && (determinant.genre === null || determinant.genre === genre);
}

/** « le », « la », « l' » ou « les » devant ce mot. */
function articleDefini(genre: Genre, nombre: Nombre, motSuivant: string): string {
  if (nombre === 'pluriel') return 'les';
  if (commenceParVoyelle(motSuivant)) return "l'";
  return genre === 'm' ? 'le' : 'la';
}

function articleIndefini(genre: Genre, nombre: Nombre): string {
  return nombre === 'pluriel' ? 'des' : genre === 'm' ? 'un' : 'une';
}

/** Un déterminant devant un mot : « l'ami », « le chat ». */
function joindre(determinant: string, mot: string): string {
  return determinant.endsWith("'") ? `${determinant}${mot}` : `${determinant} ${mot}`;
}

const NOMBRES: Nombre[] = ['singulier', 'pluriel'];
const GENRES: Genre[] = ['m', 'f'];

// --- Le lexique d'une étape ----------------------------------------------------------

interface Lexique {
  noms: NomEcrit[];
  adjectifs: AdjectifEcrit[];
}

const memoLexique = new Map<Stage, Lexique>();

function lexiqueDe(level: Level, stage: Stage): Lexique {
  const deja = memoLexique.get(stage);
  if (deja) return deja;
  const disponible = <T extends { depuis: Stage }>(liste: T[]) => liste.filter((element) => isAvailableAt(element.depuis, stage));
  const lexique: Lexique =
    level === '6e'
      ? { noms: disponible(NOMS_6E), adjectifs: disponible(ADJECTIFS_6E) }
      : { noms: disponible(NOMS_CYCLE_2), adjectifs: disponible(ADJECTIFS_CYCLE_2) };
  memoLexique.set(stage, lexique);
  return lexique;
}

/** Un adjectif placé avant le nom ne se dit pas devant un nom masculin singulier qui
 *  commence par une voyelle : « un bel ami », pas « un beau ami ». Ces groupes ne sont pas posés. */
function groupeImpossible(adjectif: AdjectifEcrit, nom: NomEcrit, nombre: Nombre): boolean {
  if (adjectif.sauf?.includes(nom.singulier)) return true;
  return (
    adjectif.formeDevantVoyelle !== undefined &&
    adjectif.position === 'avant' &&
    nom.genre === 'm' &&
    nombre === 'singulier' &&
    commenceParVoyelle(nom.singulier)
  );
}

// --- Les phrases cadres du déterminant ----------------------------------------------------

/** Des verbes qui vont avec n'importe quel nom : on regarde, on dessine, on cherche… */
const CADRES_DE_VERBE = ['regarde', 'dessine', 'cherche', 'montre', 'voit'];
const SUJETS_DE_CADRE = ['Léa', 'Paul', 'Nora', 'Tom', 'Lola', 'Hugo', 'Emma', 'Sami'];

function cadre(rng: Rng): string {
  return `${rngPick(rng, SUJETS_DE_CADRE)} ${rngPick(rng, CADRES_DE_VERBE)}`;
}

// --- 1. Le bon déterminant -----------------------------------------------------------------

interface CandidatNom {
  nom: NomEcrit;
  nombre: Nombre;
}

function determinantQuestion(rng: Rng, rang: number, { nom, nombre }: CandidatNom): Question | null {
  const forme = formeDuNom(nom, nombre);
  const voyelle = commenceParVoyelle(forme);
  // Devant une voyelle, « le » et « la » deviennent « l' » : ils ne sont ni la bonne
  // réponse, ni une mauvaise (« le ami » est faux, mais pas pour le genre ou le nombre).
  const bonnes = DETERMINANTS.filter((determinant) => convientAvec(determinant, nom.genre, nombre) && !(voyelle && determinant.defini && nombre === 'singulier'));
  const mauvaises = DETERMINANTS.filter((determinant) => !convientAvec(determinant, nom.genre, nombre));
  if (bonnes.length === 0 || mauvaises.length < 3) return null;
  const bonne = rngPick(rng, bonnes);
  const choices = rngShuffle(rng, [bonne.mot, ...rngShuffle(rng, mauvaises).slice(0, 3).map((determinant) => determinant.mot)]);
  return {
    id: `accords-determinant-${rang}-${forme}`,
    domain: 'accords',
    instruction: 'Quel mot complète correctement le groupe ?',
    prompt: `${cadre(rng)} ... ${forme}.`,
    choices,
    correctIndex: choices.indexOf(bonne.mot),
  };
}

// --- 2. Le nom qui va avec le déterminant ----------------------------------------------------

interface CandidatDeterminant {
  determinant: Determinant;
}

function nomQuestion(rng: Rng, rang: number, noms: NomEcrit[], { determinant }: CandidatDeterminant): Question | null {
  const formes = noms.flatMap((nom) => NOMBRES.map((nombre) => ({ nom, nombre, forme: formeDuNom(nom, nombre) })));
  // Après « le » ou « la », une voyelle s'élide : la bonne réponse commence par une consonne.
  const bonnes = formes.filter(
    ({ nom, nombre, forme }) =>
      convientAvec(determinant, nom.genre, nombre) && !(determinant.defini && nombre === 'singulier' && commenceParVoyelle(forme))
  );
  const mauvaises = formes.filter(({ nom, nombre }) => !convientAvec(determinant, nom.genre, nombre));
  if (bonnes.length === 0) return null;
  const bonne = rngPick(rng, bonnes);
  const autres = sansDoublon(rngShuffle(rng, mauvaises).map(({ forme }) => forme), [bonne.forme]).slice(0, 3);
  if (autres.length < 3) return null;
  const choices = rngShuffle(rng, [bonne.forme, ...autres]);
  return {
    id: `accords-nom-${rang}-${bonne.forme}`,
    domain: 'accords',
    instruction: 'Quel mot complète correctement le groupe ?',
    prompt: `${cadre(rng)} ${determinant.mot} ...`,
    choices,
    correctIndex: choices.indexOf(bonne.forme),
  };
}

// --- 3. Mettre au pluriel -----------------------------------------------------------------------

function estRegulier(nom: NomEcrit): boolean {
  return nom.pluriel === `${nom.singulier}s`;
}

interface CandidatPluriel {
  nom: NomEcrit;
  defini: boolean;
}

function plurielQuestion(rng: Rng, rang: number, { nom, defini }: CandidatPluriel): Question | null {
  const determinantSingulier = defini ? articleDefini(nom.genre, 'singulier', nom.singulier) : articleIndefini(nom.genre, 'singulier');
  const determinantPluriel = defini ? 'les' : 'des';
  const original = joindre(determinantSingulier, nom.singulier);
  const bonne = `${determinantPluriel} ${nom.pluriel}`;
  const choices = rngShuffle(rng, [
    bonne,
    `${determinantPluriel} ${nom.singulier}`,
    joindre(determinantSingulier, nom.pluriel),
    original,
  ]);
  return {
    id: `accords-pluriel-${rang}-${nom.singulier}`,
    domain: 'accords',
    instruction: 'Mets le groupe au pluriel',
    prompt: original,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- 4. Le pluriel en -x et en -aux (CE2) ------------------------------------------------------------

function plurielXQuestion(rng: Rng, rang: number, nom: NomEcrit): Question | null {
  const determinantSingulier = articleDefini(nom.genre, 'singulier', nom.singulier);
  const original = joindre(determinantSingulier, nom.singulier);
  const bonne = `les ${nom.pluriel}`;
  // L'erreur classique : ajouter un s (« des bateaus », « des chevals », « des bijous »).
  const choices = rngShuffle(rng, [bonne, `les ${nom.singulier}s`, `les ${nom.singulier}`, joindre(determinantSingulier, nom.pluriel)]);
  return {
    id: `accords-plurielx-${rang}-${nom.singulier}`,
    domain: 'accords',
    instruction: 'Mets le groupe au pluriel',
    prompt: original,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- 5. Le féminin et le masculin des noms ------------------------------------------------------------

interface CandidatFeminin {
  couple: (typeof COUPLES_MASCULIN_FEMININ)[number];
  versLeFeminin: boolean;
}

function femininQuestion(rng: Rng, rang: number, { couple, versLeFeminin }: CandidatFeminin): Question {
  const { masculin, feminin, erreur } = couple;
  if (versLeFeminin) {
    const bonne = `une ${feminin}`;
    // L'erreur propre au couple (« une chate »), sinon le groupe laissé tel quel.
    const choices = rngShuffle(rng, [bonne, `un ${feminin}`, `une ${masculin}`, erreur ? `une ${erreur}` : `un ${masculin}`]);
    return {
      id: `accords-feminin-${rang}-${masculin}`,
      domain: 'accords',
      instruction: 'Mets au féminin',
      prompt: `un ${masculin}`,
      choices,
      correctIndex: choices.indexOf(bonne),
    };
  }
  const bonne = `un ${masculin}`;
  const choices = rngShuffle(rng, [bonne, `une ${masculin}`, `un ${feminin}`, `une ${feminin}`]);
  return {
    id: `accords-feminin-${rang}-${feminin}`,
    domain: 'accords',
    instruction: 'Mets au masculin',
    prompt: `une ${feminin}`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- Les adjectifs : formes et mauvaises réponses ----------------------------------------------------------

/** Les cases (genre, nombre) qui produisent chaque forme distincte d'un adjectif :
 *  « mauvais » est à la fois masculin singulier et masculin pluriel, « rouge » masculin et féminin.
 *  Exclure seulement la case visée laisserait passer la même chaîne par une autre case. */
function formesAvecCases(adjectif: AdjectifEcrit): { mot: string; cases: { genre: Genre; nombre: Nombre }[] }[] {
  const parMot = new Map<string, { genre: Genre; nombre: Nombre }[]>();
  GENRES.forEach((genre) =>
    NOMBRES.forEach((nombre) => {
      const mot = formeDeLAdjectif(adjectif, genre, nombre);
      const cases = parMot.get(mot) ?? [];
      cases.push({ genre, nombre });
      parMot.set(mot, cases);
    })
  );
  return [...parMot].map(([mot, cases]) => ({ mot, cases }));
}

/** Les mauvaises formes d'adjectif pour un nom de ce genre et de ce nombre : celles d'un adjectif
 *  quelconque qui ne conviennent ni par le genre ni par le nombre — jamais une forme qui s'accorderait
 *  tout aussi bien (« un cahier léger / agréable »). */
function mauvaisesFormes(rng: Rng, adjectifs: AdjectifEcrit[], genre: Genre, nombre: Nombre, bonne: string): string[] {
  const candidates = adjectifs.flatMap((autre) =>
    formesAvecCases(autre)
      .filter(({ cases }) => !cases.some((c) => c.genre === genre && c.nombre === nombre))
      .map(({ mot }) => mot)
  );
  return sansDoublon(rngShuffle(rng, candidates), [bonne]).slice(0, 3);
}

// --- 6. L'adjectif qui manque -------------------------------------------------------------------------------

interface CandidatAdjectif {
  nom: NomEcrit;
  nombre: Nombre;
  adjectif: AdjectifEcrit;
}

/** Le déterminant du groupe : « un », « une », « des », et « les » devant un adjectif
 *  placé avant le nom (« de grandes filles » ou « des grandes filles » ? — on ne tranche pas). */
function determinantDuGroupe(nom: NomEcrit, nombre: Nombre, adjectif: AdjectifEcrit): string {
  if (nombre === 'pluriel') return adjectif.position === 'avant' ? 'les' : 'des';
  return articleIndefini(nom.genre, 'singulier');
}

function epitheteQuestion(rng: Rng, rang: number, adjectifs: AdjectifEcrit[], { nom, nombre, adjectif }: CandidatAdjectif): Question | null {
  const bonne = formeDeLAdjectif(adjectif, nom.genre, nombre);
  const mauvaises = mauvaisesFormes(rng, adjectifs, nom.genre, nombre, bonne);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  const determinant = determinantDuGroupe(nom, nombre, adjectif);
  const forme = formeDuNom(nom, nombre);
  return {
    id: `accords-epithete-${rang}-${bonne}`,
    domain: 'accords',
    instruction: 'Quel mot complète correctement le groupe ?',
    prompt: adjectif.position === 'avant' ? `${determinant} ... ${forme}` : `${determinant} ${forme} ...`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- 7. Le nom qui manque, l'adjectif est déjà là --------------------------------------------------------------

/**
 * Un autre nom ne fait une mauvaise réponse que s'il est faux par le genre ou le nombre : sinon il
 * compléterait tout aussi bien le groupe que la bonne réponse. Au pluriel, un adjectif qui ne marque pas
 * le genre (« rouges », « sages ») ne trahit pas celui du nom, ni « des » : tout nom au pluriel
 * conviendrait. Il faut alors écarter tous les noms au même nombre, pas seulement ceux du même genre.
 */
function mauvaisNoms(rng: Rng, noms: NomEcrit[], nom: NomEcrit, adjectif: AdjectifEcrit, nombre: Nombre, bonne: string): string[] {
  const genreMarque = nombre === 'singulier' || adjectif.masculinPluriel !== adjectif.femininPluriel;
  const candidates = noms.flatMap((autre) =>
    NOMBRES.filter((autreNombre) => autreNombre !== nombre || (genreMarque && autre.genre !== nom.genre)).map((autreNombre) =>
      formeDuNom(autre, autreNombre)
    )
  );
  return sansDoublon(rngShuffle(rng, candidates), [bonne]).slice(0, 3);
}

function nomEpitheteQuestion(rng: Rng, rang: number, noms: NomEcrit[], { nom, nombre, adjectif }: CandidatAdjectif): Question | null {
  const bonne = formeDuNom(nom, nombre);
  const mauvaises = mauvaisNoms(rng, noms, nom, adjectif, nombre, bonne);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  const determinant = determinantDuGroupe(nom, nombre, adjectif);
  const forme = formeDeLAdjectif(adjectif, nom.genre, nombre);
  return {
    id: `accords-nomepithete-${rang}-${bonne}`,
    domain: 'accords',
    instruction: 'Quel mot complète correctement le groupe ?',
    prompt: adjectif.position === 'avant' ? `${determinant} ${forme} ...` : `${determinant} ... ${forme}`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- 8. Mettre au pluriel un groupe avec adjectif ------------------------------------------------------------------

function groupePlurielQuestion(rng: Rng, rang: number, { nom, adjectif }: CandidatAdjectif): Question | null {
  const adjectifSingulier = formeDeLAdjectif(adjectif, nom.genre, 'singulier');
  const adjectifPluriel = formeDeLAdjectif(adjectif, nom.genre, 'pluriel');
  // « gris » reste « gris » : le pluriel ne s'y voit pas, la question n'aurait qu'une réponse devinée.
  if (adjectifSingulier === adjectifPluriel) return null;
  const avant = adjectif.position === 'avant';
  const determinantSingulier = articleDefini(nom.genre, 'singulier', avant ? adjectifSingulier : nom.singulier);
  const groupe = (determinant: string, mot: string, epithete: string) =>
    avant ? joindre(determinant, `${epithete} ${mot}`) : joindre(determinant, `${mot} ${epithete}`);
  const original = groupe(determinantSingulier, nom.singulier, adjectifSingulier);
  const bonne = groupe('les', nom.pluriel, adjectifPluriel);
  const choices = rngShuffle(rng, [
    bonne,
    groupe('les', nom.pluriel, adjectifSingulier),
    groupe('les', nom.singulier, adjectifPluriel),
    groupe(determinantSingulier, nom.pluriel, adjectifPluriel),
  ]);
  if (new Set(choices).size < 4) return null;
  return {
    id: `accords-groupepluriel-${rang}-${nom.singulier}`,
    domain: 'accords',
    instruction: 'Mets le groupe au pluriel',
    prompt: original,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- 9. Le féminin de l'adjectif ------------------------------------------------------------------------------------

function femininAdjectifQuestion(rng: Rng, rang: number, adjectif: AdjectifEcrit): Question | null {
  const formes = [adjectif.masculinSingulier, adjectif.femininSingulier, adjectif.masculinPluriel, adjectif.femininPluriel];
  // Quatre formes distinctes, sinon il manque une mauvaise réponse (« gris » est aussi son pluriel).
  if (new Set(formes).size < 4) return null;
  const choices = rngShuffle(rng, formes);
  return {
    id: `accords-femininadjectif-${rang}-${adjectif.masculinSingulier}`,
    domain: 'accords',
    instruction: 'Mets au féminin singulier',
    prompt: adjectif.masculinSingulier,
    choices,
    correctIndex: choices.indexOf(adjectif.femininSingulier),
  };
}

// --- Le sujet, le verbe et leur accord -------------------------------------------------------------------------------

const TEMPS_SIMPLES: Tense[] = ['présent', 'imparfait', 'futur'];

/**
 * Un adjectif peut-il être l'attribut de ce nom ? « Le cahier est premier » ne veut rien dire, « la
 * voisine est vieille » n'est pas un exemple à donner, « la soupe est mauvaise » est une phrase juste.
 */
function attributPossible(adjectif: AdjectifEcrit, categorie: Categorie): boolean {
  const mot = adjectif.masculinSingulier;
  if (mot === 'premier' || mot === 'dernier') return false;
  if (mot === 'mauvais') return categorie === 'nourriture' || categorie === 'plat';
  // « Le cahier est vieux », « la maison est vieille » : de l'âge d'une chose, pas d'une personne, d'une fête ou d'un orage.
  if (mot === 'vieux') return ['objet', 'colorable', 'vehicule', 'lieu', 'nourriture', 'plat', 'plante'].includes(categorie);
  return true;
}

interface CandidatSujet {
  verbe: Verb;
  temps: Tense;
}

/** Ce dont le groupe sujet se compose : des personnes, des adjectifs qui peuvent les qualifier. */
interface MatiereDuSujet {
  personnes: NomEcrit[];
  adjectifs: AdjectifEcrit[];
  /** Au CE1, l'adjectif du sujet n'arrive qu'au 3e trimestre : « un groupe nominal comportant au plus un adjectif ». */
  avecAdjectifs: boolean;
}

/** Le groupe sujet : « Les petits garçons », « Une fille sage », « L'ami ». */
function groupeSujet(nom: NomEcrit, nombre: Nombre, adjectif: AdjectifEcrit | null, defini: boolean): string {
  const forme = formeDuNom(nom, nombre);
  const epithete = adjectif ? formeDeLAdjectif(adjectif, nom.genre, nombre) : null;
  const premierMot = adjectif && adjectif.position === 'avant' ? (epithete as string) : forme;
  // « Des » devant un adjectif placé avant le nom : on écrit « les ».
  const determinant =
    defini || (adjectif?.position === 'avant' && nombre === 'pluriel')
      ? articleDefini(nom.genre, nombre, premierMot)
      : articleIndefini(nom.genre, nombre);
  if (!adjectif) return majuscule(joindre(determinant, forme));
  return majuscule(
    adjectif.position === 'avant' ? joindre(determinant, `${epithete} ${forme}`) : joindre(determinant, `${forme} ${epithete}`)
  );
}

function sujetVerbeQuestion(rng: Rng, rang: number, matiere: MatiereDuSujet, { verbe, temps }: CandidatSujet): Question | null {
  const nom = rngPick(rng, matiere.personnes);
  const nombre = rngPick(rng, NOMBRES);
  const compatibles = matiere.adjectifs.filter((adjectif) => adjectif.categories.includes(nom.categorie) && !groupeImpossible(adjectif, nom, nombre));
  const adjectif = matiere.avecAdjectifs && compatibles.length > 0 && rng() < 0.5 ? rngPick(rng, compatibles) : null;
  const personne: Person = nombre === 'singulier' ? 'il' : 'ils';
  const autrePersonne: Person = nombre === 'singulier' ? 'ils' : 'il';
  const bonne = verbe.forms[temps][personne];
  // L'erreur d'élève la plus fréquente : s'accorder avec le nombre voisin, ou l'oublier. Elle vient
  // en premier ; deux autres personnes complètent.
  const autres = rngShuffle(rng, PERSONS.filter((candidate) => candidate !== personne && candidate !== autrePersonne));
  const mauvaises = sansDoublon([autrePersonne, ...autres].map((candidate) => verbe.forms[temps][candidate]), [bonne]).slice(0, 3);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  return {
    id: `accords-sujetverbe-${rang}-${verbe.infinitive}-${bonne}`,
    domain: 'accords',
    instruction: 'Quel verbe complète correctement la phrase ?',
    prompt: `${groupeSujet(nom, nombre, adjectif, rng() < 0.5)} ... ${verbe.complement}`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- L'attribut --------------------------------------------------------------------------------------------------------------

interface CandidatAttribut {
  nom: NomEcrit;
  nombre: Nombre;
  adjectif: AdjectifEcrit;
  /** Un complément du nom entre le sujet et le verbe : « La porte du garage est… ». */
  complement: ComplementDuNom | null;
}

function attributQuestion(rng: Rng, rang: number, adjectifs: AdjectifEcrit[], { nom, nombre, adjectif, complement }: CandidatAttribut): Question | null {
  const bonne = formeDeLAdjectif(adjectif, nom.genre, nombre);
  const mauvaises = mauvaisesFormes(rng, adjectifs, nom.genre, nombre, bonne);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  const forme = formeDuNom(nom, nombre);
  const sujet = majuscule(joindre(articleDefini(nom.genre, nombre, forme), forme));
  return {
    id: `accords-attribut-${rang}-${bonne}`,
    domain: 'accords',
    instruction: 'Quel mot complète correctement la phrase ?',
    prompt: `${sujet}${complement ? ` ${complement.texte}` : ''} ${nombre === 'singulier' ? 'est' : 'sont'} ...`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- Le sujet placé après le verbe (6e) ----------------------------------------------------------------------------

/** Le présent d'un verbe de scène : ceux de la liste de 6e, ou un verbe régulier du 1er groupe. */
const PRESENTS_PARTICULIERS: Record<string, Record<Person, string>> = {
  courir: paradigm('cours', 'cours', 'court', 'courons', 'courez', 'courent'),
};

function presentDe(infinitif: string): Record<Person, string> {
  const connu = VERBES_6E.find((verbe) => verbe.infinitive === infinitif);
  if (connu) return connu.forms['présent'];
  return PRESENTS_PARTICULIERS[infinitif] ?? group1(infinitif, '').forms['présent'];
}

/** Les mauvaises réponses d'un accord au présent : le nombre voisin d'abord (le piège), puis d'autres personnes. */
function mauvaisesDuPresent(rng: Rng, present: Record<Person, string>, nombre: Nombre): string[] {
  const juste: Person = nombre === 'singulier' ? 'il' : 'ils';
  const piege: Person = nombre === 'singulier' ? 'ils' : 'il';
  const autres = rngShuffle(rng, PERSONS.filter((personne) => personne !== juste && personne !== piege));
  return sansDoublon([piege, ...autres].map((personne) => present[personne]), [present[juste]]).slice(0, 3);
}

interface CandidatScene {
  scene: (typeof SCENES)[number];
  lieuRang: number;
  sujetRang: number;
  nombre: Nombre;
}

function inverseQuestion(rng: Rng, rang: number, { scene, lieuRang, sujetRang, nombre }: CandidatScene): Question | null {
  const lieu = scene.lieux[lieuRang];
  const [singulier, pluriel, genre] = scene.sujets[sujetRang];
  const present = presentDe(scene.verbe);
  const bonne = present[nombre === 'singulier' ? 'il' : 'ils'];
  const mauvaises = mauvaisesDuPresent(rng, present, nombre);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  const sujet = nombre === 'singulier' ? joindre(articleIndefini(genre, 'singulier'), singulier) : `des ${pluriel}`;
  return {
    id: `accords-inverse-${rang}-${scene.verbe}-${bonne}`,
    domain: 'accords',
    instruction: 'Quel verbe complète correctement la phrase ?',
    prompt: `${lieu.texte} ... ${sujet}.`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- Le sujet éloigné de son verbe, plusieurs sujets (6e) ---------------------------------------------------------------

interface CandidatEloigne {
  tete: NomEcrit;
  nombre: Nombre;
  complement: ComplementDuNom;
  action: [string, string];
}

function eloigneQuestion(rng: Rng, rang: number, { tete, nombre, complement, action }: CandidatEloigne): Question | null {
  const [infinitif, queue] = action;
  const present = presentDe(infinitif);
  const bonne = present[nombre === 'singulier' ? 'il' : 'ils'];
  const mauvaises = mauvaisesDuPresent(rng, present, nombre);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  const forme = formeDuNom(tete, nombre);
  // Un complément du nom appelle l'article défini : « le frère de ma voisine », pas « un frère de ma voisine ».
  const determinant = articleDefini(tete.genre, nombre, forme);
  return {
    id: `accords-eloigne-${rang}-${infinitif}-${bonne}`,
    domain: 'accords',
    instruction: 'Quel verbe complète correctement la phrase ?',
    prompt: `${majuscule(joindre(determinant, forme))} ${complement.texte} ... ${queue}.`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

interface CandidatPlusieurs {
  sujets: string;
  action: [string, string];
}

function plusieursQuestion(rng: Rng, rang: number, { sujets, action }: CandidatPlusieurs): Question | null {
  const [infinitif, queue] = action;
  const present = presentDe(infinitif);
  const bonne = present.ils;
  const mauvaises = mauvaisesDuPresent(rng, present, 'pluriel');
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  return {
    id: `accords-plusieurs-${rang}-${infinitif}-${bonne}`,
    domain: 'accords',
    instruction: 'Quel verbe complète correctement la phrase ?',
    prompt: `${sujets} ... ${queue}.`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- Le participe passé avec « être » (6e) -------------------------------------------------------------------------------

interface SujetEtre {
  texte: string;
  genre: Genre;
  nombre: Nombre;
  /** Un sujet double dont le genre se décide par la règle « le masculin l'emporte ». */
  double: boolean;
}

function sujetEtre(texte: string, genre: Genre, nombre: Nombre, double = false): SujetEtre {
  return { texte, genre, nombre, double };
}

const PRENOMS_FEMININS = ['Léa', 'Marion', 'Camille', 'Nora', 'Inès', 'Manon', 'Emma', 'Lola'];
const PRENOMS_MASCULINS = ['Paul', 'Tom', 'Sami', 'Hugo', 'Lucas'];

const SUJETS_SIMPLES_ETRE: SujetEtre[] = [
  ...PRENOMS_FEMININS.map((prenom) => sujetEtre(prenom, 'f', 'singulier')),
  ...PRENOMS_MASCULINS.map((prenom) => sujetEtre(prenom, 'm', 'singulier')),
  sujetEtre('Elle', 'f', 'singulier'),
  sujetEtre('Il', 'm', 'singulier'),
  sujetEtre('Ma sœur', 'f', 'singulier'),
  sujetEtre('Mon frère', 'm', 'singulier'),
  sujetEtre('Ma tante', 'f', 'singulier'),
  sujetEtre('Mon oncle', 'm', 'singulier'),
  sujetEtre('La directrice', 'f', 'singulier'),
  sujetEtre('Le directeur', 'm', 'singulier'),
  sujetEtre('Elles', 'f', 'pluriel'),
  sujetEtre('Ils', 'm', 'pluriel'),
  sujetEtre('Les filles', 'f', 'pluriel'),
  sujetEtre('Les garçons', 'm', 'pluriel'),
  sujetEtre('Mes cousines', 'f', 'pluriel'),
  sujetEtre('Mes cousins', 'm', 'pluriel'),
  sujetEtre('Les voisines', 'f', 'pluriel'),
  sujetEtre('Les voisins', 'm', 'pluriel'),
];

/** Deux sujets : féminin pluriel s'ils sont tous deux féminins, masculin pluriel dès qu'il y a un masculin. */
const SUJETS_DOUBLES_ETRE: SujetEtre[] = [
  ...['Léa et Marion', 'Camille et Nora', 'Inès et Manon', 'Emma et Lola', 'Ma sœur et ma tante'].map((texte) => sujetEtre(texte, 'f', 'pluriel', true)),
  ...['Paul et Tom', 'Sami et Hugo', 'Lucas et Paul', 'Mon frère et mon oncle'].map((texte) => sujetEtre(texte, 'm', 'pluriel', true)),
  ...['Léa et Paul', 'Camille et Sami', 'Nora et Hugo', 'Manon et Lucas', 'Mon frère et ma sœur', 'Ma tante et mon oncle', 'Emma et Tom'].map((texte) =>
    sujetEtre(texte, 'm', 'pluriel', true)
  ),
];

function participeAvecEtre(participe: Participe, genre: Genre, nombre: Nombre): string {
  if (genre === 'm') return nombre === 'singulier' ? participe.masculinSingulier : participe.masculinPluriel;
  return nombre === 'singulier' ? participe.femininSingulier : participe.femininPluriel;
}

interface CandidatParticipeEtre {
  participe: Participe;
  sujet: SujetEtre;
  /** « est » (passé composé) ou « était » (plus-que-parfait). */
  temps: 'présent' | 'imparfait';
}

function participeEtreQuestion(rng: Rng, rang: number, { participe, sujet, temps }: CandidatParticipeEtre): Question | null {
  const bonne = participeAvecEtre(participe, sujet.genre, sujet.nombre);
  const formes = [participe.masculinSingulier, participe.femininSingulier, participe.masculinPluriel, participe.femininPluriel];
  const mauvaises = rngShuffle(rng, sansDoublon(formes, [bonne]));
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises.slice(0, 3)]);
  const auxiliaire = temps === 'présent' ? (sujet.nombre === 'singulier' ? 'est' : 'sont') : sujet.nombre === 'singulier' ? 'était' : 'étaient';
  return {
    id: `accords-participeetre-${rang}-${participe.infinitif}-${bonne}`,
    domain: 'accords',
    instruction: `Accorde le participe passé — verbe « ${participe.infinitif} »`,
    prompt: `${sujet.texte} ${auxiliaire} ...`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- Le participe passé avec « avoir » (6e) ----------------------------------------------------------------------------

type CadreAvoir = 'relative' | 'pronom' | 'invariable';

interface CandidatParticipeAvoir {
  verbe: VerbeAvecAvoir;
  objet: [string, string, Genre];
  nombre: Nombre;
  sujet: SujetAvecAvoir;
  cadre: CadreAvoir;
}

const PRENOMS_DES_SUJETS = new Set(PRENOMS_6E);

/** « Léa », mais « mon frère » : une majuscule seulement au début de la phrase. */
function ecritAuMilieu(texte: string): string {
  return PRENOMS_DES_SUJETS.has(texte) ? texte : texte.charAt(0).toLowerCase() + texte.slice(1);
}

/** Le sujet et son auxiliaire : « Léa a », « j'ai », « nous avons » ; avec un pronom COD placé avant,
 *  « Léa l'a », « je les ai ». */
function sujetEtAuxiliaire(sujet: SujetAvecAvoir, pronom: string | null, debutDePhrase: boolean): string {
  if (sujet.texte === 'Je') {
    const je = debutDePhrase ? 'Je' : 'je';
    if (!pronom) return debutDePhrase ? "J'ai" : "j'ai";
    return pronom.endsWith("'") ? `${je} ${pronom}ai` : `${je} ${pronom} ai`;
  }
  const texte = debutDePhrase ? sujet.texte : ecritAuMilieu(sujet.texte);
  if (!pronom) return `${texte} ${sujet.auxiliaire}`;
  return pronom.endsWith("'") ? `${texte} ${pronom}${sujet.auxiliaire}` : `${texte} ${pronom} ${sujet.auxiliaire}`;
}

function accordAvecObjet(verbe: VerbeAvecAvoir, genre: Genre, nombre: Nombre): string {
  if (genre === 'm') return nombre === 'singulier' ? verbe.masculinSingulier : verbe.masculinPluriel;
  return nombre === 'singulier' ? verbe.femininSingulier : verbe.femininPluriel;
}

/** « Ce », « cet », « cette », « ces ». */
function demonstratif(genre: Genre, nombre: Nombre, mot: string): string {
  if (nombre === 'pluriel') return 'ces';
  if (genre === 'f') return 'cette';
  return commenceParVoyelle(mot) ? 'cet' : 'ce';
}

function participeAvoirQuestion(rng: Rng, rang: number, { verbe, objet, nombre, sujet, cadre: forme }: CandidatParticipeAvoir): Question | null {
  const [singulier, pluriel, genre] = objet;
  const mot = nombre === 'singulier' ? singulier : pluriel;
  const bonne = forme === 'invariable' ? verbe.masculinSingulier : accordAvecObjet(verbe, genre, nombre);
  const formes = [verbe.masculinSingulier, verbe.femininSingulier, verbe.masculinPluriel, verbe.femininPluriel];
  // « pris », « mis », « compris » s'écrivent pareil au masculin singulier et pluriel : l'infinitif,
  // erreur d'élève fréquente, complète les propositions.
  const mauvaises = rngShuffle(rng, sansDoublon([...formes, verbe.infinitif], [bonne])).slice(0, 3);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);

  let prompt: string;
  if (forme === 'invariable') {
    prompt = `${sujetEtAuxiliaire(sujet, null, true)} ... ${articleIndefini(genre, nombre)} ${mot}.`;
  } else if (forme === 'relative') {
    const intro = nombre === 'singulier' ? rngPick(rng, ['Voici', 'Regarde', 'Où est']) : rngPick(rng, ['Voici', 'Regarde', 'Où sont']);
    const groupe = joindre(articleDefini(genre, nombre, mot), mot);
    // « Où est la tarte que Léa a ... ? » ; « Voici la tarte que Léa a ... »
    prompt = `${intro} ${groupe} que ${sujetEtAuxiliaire(sujet, null, false)} ...${intro.startsWith('Où') ? ' ?' : ''}`;
  } else {
    const pronom = nombre === 'pluriel' ? 'les' : "l'";
    prompt = `${majuscule(demonstratif(genre, nombre, mot))} ${mot}, ${sujetEtAuxiliaire(sujet, pronom, false)} ...`;
  }
  return {
    id: `accords-participeavoir-${rang}-${verbe.infinitif}-${bonne}`,
    domain: 'accords',
    instruction: `Accorde le participe passé — verbe « ${verbe.infinitif} »`,
    prompt,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- L'attribut d'un sujet double (6e) --------------------------------------------------------------------------------------

interface CandidatAttributDouble {
  sujet: SujetEtre;
  adjectif: AdjectifEcrit;
}

function attributDoubleQuestion(rng: Rng, rang: number, adjectifs: AdjectifEcrit[], { sujet, adjectif }: CandidatAttributDouble): Question | null {
  const bonne = formeDeLAdjectif(adjectif, sujet.genre, sujet.nombre);
  const mauvaises = mauvaisesFormes(rng, adjectifs, sujet.genre, sujet.nombre, bonne);
  if (mauvaises.length < 3) return null;
  const choices = rngShuffle(rng, [bonne, ...mauvaises]);
  return {
    id: `accords-attributdouble-${rang}-${bonne}`,
    domain: 'accords',
    instruction: 'Quel mot complète correctement la phrase ?',
    prompt: `${sujet.texte} sont ...`,
    choices,
    correctIndex: choices.indexOf(bonne),
  };
}

// --- La composition des séances --------------------------------------------------------------------------------------------------

type Poids = Record<
  | 'determinant'
  | 'nom'
  | 'pluriel'
  | 'plurielx'
  | 'feminin'
  | 'epithete'
  | 'nomepithete'
  | 'groupepluriel'
  | 'femininadjectif'
  | 'sujetverbe'
  | 'attribut'
  | 'inverse'
  | 'eloigne'
  | 'plusieurs'
  | 'participeetre'
  | 'participeavoir'
  | 'attributdouble',
  number
>;

const AUCUN: Poids = {
  determinant: 0,
  nom: 0,
  pluriel: 0,
  plurielx: 0,
  feminin: 0,
  epithete: 0,
  nomepithete: 0,
  groupepluriel: 0,
  femininadjectif: 0,
  sujetverbe: 0,
  attribut: 0,
  inverse: 0,
  eloigne: 0,
  plusieurs: 0,
  participeetre: 0,
  participeavoir: 0,
  attributdouble: 0,
};

/**
 * Ce que chaque étape fait travailler, en parts d'une séance de douze questions. Ce qui est nouveau au
 * trimestre pèse le plus ; ce qui a été vu reste présent, en révision.
 */
function poidsDeLEtape(level: Level, trimester: Trimester): Poids {
  if (level === 'CE1') {
    if (trimester === 1) return { ...AUCUN, determinant: 3, nom: 3, pluriel: 3, feminin: 3 };
    if (trimester === 2)
      return { ...AUCUN, determinant: 1, nom: 1, pluriel: 2, feminin: 2, epithete: 2, nomepithete: 1, femininadjectif: 1, sujetverbe: 2 };
    return {
      ...AUCUN,
      determinant: 1,
      nom: 1,
      pluriel: 1,
      feminin: 1,
      epithete: 2,
      nomepithete: 1,
      groupepluriel: 1,
      femininadjectif: 1,
      sujetverbe: 3,
    };
  }
  if (level === 'CE2') {
    if (trimester === 1)
      return { ...AUCUN, nom: 1, pluriel: 1, feminin: 1, epithete: 2, nomepithete: 1, groupepluriel: 1, femininadjectif: 1, sujetverbe: 4 };
    if (trimester === 2)
      return {
        ...AUCUN,
        pluriel: 1,
        feminin: 1,
        epithete: 1,
        nomepithete: 1,
        groupepluriel: 1,
        femininadjectif: 1,
        sujetverbe: 2,
        plurielx: 2,
        attribut: 2,
      };
    return {
      ...AUCUN,
      pluriel: 1,
      feminin: 1,
      epithete: 1,
      nomepithete: 1,
      groupepluriel: 1,
      femininadjectif: 1,
      sujetverbe: 3,
      plurielx: 1,
      attribut: 2,
    };
  }
  // 6e
  if (trimester === 1) return { ...AUCUN, epithete: 2, nomepithete: 2, sujetverbe: 2, inverse: 2, eloigne: 2, plusieurs: 1, participeetre: 1 };
  if (trimester === 2)
    return { ...AUCUN, epithete: 1, nomepithete: 1, sujetverbe: 1, inverse: 1, eloigne: 1, plusieurs: 1, participeetre: 1, participeavoir: 5 };
  return { ...AUCUN, epithete: 1, nomepithete: 1, inverse: 1, eloigne: 1, plusieurs: 1, participeetre: 1, participeavoir: 2, attribut: 2, attributdouble: 2 };
}

/** Les tirages de chaque étape, calculés une fois. */
interface Candidats {
  noms: CandidatNom[];
  determinants: CandidatDeterminant[];
  pluriels: CandidatPluriel[];
  plurielsX: NomEcrit[];
  feminins: CandidatFeminin[];
  adjectifs: CandidatAdjectif[];
  groupesPluriel: CandidatAdjectif[];
  femininsAdjectifs: AdjectifEcrit[];
  sujets: CandidatSujet[];
  attributs: CandidatAttribut[];
  scenes: CandidatScene[];
  eloignes: CandidatEloigne[];
  plusieurs: CandidatPlusieurs[];
  participesEtre: CandidatParticipeEtre[];
  participesAvoir: CandidatParticipeAvoir[];
  attributsDoubles: CandidatAttributDouble[];
}

const memoCandidats = new Map<Stage, Candidats>();

function candidatsDe(level: Level, trimester: Trimester): Candidats {
  const stage = stageOf(level, trimester);
  const deja = memoCandidats.get(stage);
  if (deja) return deja;
  const { noms, adjectifs } = lexiqueDe(level, stage);
  const poids = poidsDeLEtape(level, trimester);

  const noms2: CandidatNom[] = noms.flatMap((nom) => NOMBRES.map((nombre) => ({ nom, nombre })));
  const adjectifsEtNoms: CandidatAdjectif[] = noms.flatMap((nom) =>
    adjectifs
      .filter((adjectif) => adjectif.categories.includes(nom.categorie))
      .flatMap((adjectif) =>
        NOMBRES.filter((nombre) => !groupeImpossible(adjectif, nom, nombre)).map((nombre) => ({ nom, nombre, adjectif }))
      )
  );

  // Le sujet des phrases à compléter : une personne, avec les verbes de l'étape aux temps simples.
  // Au CE1-T2 le présent seul : l'imparfait et le futur arrivent à ce trimestre, leur accord au suivant.
  const verbes = level === '6e' ? VERBES_6E : verbesDeLEtape(level, trimester);
  const sujets: CandidatSujet[] = [];
  if (poids.sujetverbe > 0) {
    for (const verbe of verbes) {
      const temps = level === '6e' ? TEMPS_SIMPLES : tempsDuVerbe(level, trimester, verbe);
      for (const t of temps.filter((candidat) => TEMPS_SIMPLES.includes(candidat) && !(level === 'CE1' && trimester === 2 && candidat !== 'présent')))
        sujets.push({ verbe, temps: t });
    }
  }

  const attributs: CandidatAttribut[] = [];
  if (poids.attribut > 0) {
    for (const candidat of adjectifsEtNoms) {
      if (!attributPossible(candidat.adjectif, candidat.nom.categorie)) continue;
      if (level !== '6e') {
        attributs.push({ ...candidat, complement: null });
        continue;
      }
      // En 6e, le sujet est éloigné de son verbe : « La porte du garage est… ».
      const complements =
        candidat.nom.categorie === 'personne'
          ? complementsPourPersonne(candidat.nom.singulier)
          : candidat.nom.categorie === 'animal' && !ANIMAUX_DOMESTIQUES.includes(candidat.nom.singulier)
            ? []
            : COMPLEMENTS_PAR_CATEGORIE[candidat.nom.categorie] ?? [];
      // Une ville n'est pas « du quartier », un village n'est pas « de la ville ».
      if (['ville', 'village'].includes(candidat.nom.singulier)) continue;
      for (const complement of complements) {
        if (complement.mot === candidat.nom.singulier) continue;
        attributs.push({ ...candidat, complement });
      }
    }
  }

  const scenes: CandidatScene[] = [];
  for (const scene of SCENES) {
    scene.lieux.forEach((_, lieuRang) =>
      scene.sujets.forEach((__, sujetRang) => NOMBRES.forEach((nombre) => scenes.push({ scene, lieuRang, sujetRang, nombre })))
    );
  }

  const eloignes: CandidatEloigne[] = [];
  const plusieurs: CandidatPlusieurs[] = [];
  if (level === '6e') {
    const tetesPersonnes = noms.filter((nom) => nom.categorie === 'personne');
    const tetesAnimaux = noms.filter((nom) => nom.categorie === 'animal' && ['chien', 'chat'].includes(nom.singulier));
    const familles2: [NomEcrit[], (tete: NomEcrit) => ComplementDuNom[], [string, string][]][] = [
      [tetesPersonnes, (tete) => complementsPourPersonne(tete.singulier), ACTIONS_DE_PERSONNES],
      [tetesAnimaux, () => COMPLEMENTS_D_ANIMAUX, ACTIONS_D_ANIMAUX],
    ];
    for (const [tetes, complementsDe, actions] of familles2) {
      for (const tete of tetes) {
        for (const complement of complementsDe(tete)) {
          if (complement.mot === tete.singulier) continue;
          for (const action of actions) {
            for (const nombre of NOMBRES) eloignes.push({ tete, nombre, complement, action });
          }
        }
      }
    }
    const paires: string[] = [];
    for (const a of PRENOMS_6E) for (const b of PRENOMS_6E) if (a !== b) paires.push(`${a} et ${b}`);
    for (const action of ACTIONS_DE_PERSONNES) {
      for (const sujets2 of [...paires, ...COUPLES_DE_SUJETS]) plusieurs.push({ sujets: sujets2, action });
    }
    for (const action of ACTIONS_D_ANIMAUX) {
      for (const sujets2 of COUPLES_D_ANIMAUX) plusieurs.push({ sujets: sujets2, action });
    }
  }

  const participesEtre: CandidatParticipeEtre[] = [];
  if (level === '6e') {
    const temps: ('présent' | 'imparfait')[] = trimester === 1 ? ['présent'] : ['présent', 'imparfait'];
    const sujetsEtre = trimester === 3 ? [...SUJETS_SIMPLES_ETRE, ...SUJETS_DOUBLES_ETRE] : SUJETS_SIMPLES_ETRE;
    for (const participe of PARTICIPES_AVEC_ETRE)
      for (const sujet of sujetsEtre) for (const t of temps) participesEtre.push({ participe, sujet, temps: t });
  }

  const participesAvoir: CandidatParticipeAvoir[] = [];
  if (level === '6e' && poids.participeavoir > 0) {
    const cadres: CadreAvoir[] = trimester === 2 ? ['relative', 'invariable'] : ['relative', 'pronom', 'invariable'];
    for (const verbe of PARTICIPES_AVEC_AVOIR) {
      for (const objet of verbe.objets) {
        for (const nombre of NOMBRES) {
          for (const sujet of SUJETS_AVEC_AVOIR) for (const cadre2 of cadres) participesAvoir.push({ verbe, objet, nombre, sujet, cadre: cadre2 });
        }
      }
    }
  }

  const attributsDoubles: CandidatAttributDouble[] = [];
  if (level === '6e' && poids.attributdouble > 0) {
    const adjectifsDePersonnes = adjectifs.filter((adjectif) => adjectif.categories.includes('personne') && attributPossible(adjectif, 'personne'));
    for (const sujet of SUJETS_DOUBLES_ETRE) for (const adjectif of adjectifsDePersonnes) attributsDoubles.push({ sujet, adjectif });
  }

  const candidats: Candidats = {
    noms: noms2,
    determinants: DETERMINANTS.map((determinant) => ({ determinant })),
    pluriels: noms.filter(estRegulier).flatMap((nom) => [true, false].map((defini) => ({ nom, defini }))),
    plurielsX: noms.filter((nom) => !estRegulier(nom)),
    feminins: COUPLES_MASCULIN_FEMININ.filter((couple) => isAvailableAt(couple.depuis, stage)).flatMap((couple) =>
      [true, false].map((versLeFeminin) => ({ couple, versLeFeminin }))
    ),
    adjectifs: adjectifsEtNoms,
    groupesPluriel: adjectifsEtNoms.filter(({ nombre }) => nombre === 'singulier'),
    femininsAdjectifs: adjectifs,
    sujets,
    attributs,
    scenes,
    eloignes,
    plusieurs,
    participesEtre,
    participesAvoir,
    attributsDoubles,
  };
  memoCandidats.set(stage, candidats);
  return candidats;
}

export function generateNiveau(level: Level, trimester: Trimester, rng: Rng, count: number): Question[] {
  const stage = stageOf(level, trimester);
  const { noms, adjectifs } = lexiqueDe(level, stage);
  if (noms.length === 0) return [];
  const candidats = candidatsDe(level, trimester);
  const poids = poidsDeLEtape(level, trimester);

  const matiereDuSujet: MatiereDuSujet = {
    personnes: noms.filter((nom) => nom.categorie === 'personne'),
    adjectifs,
    avecAdjectifs: !(level === 'CE1' && trimester < 3),
  };

  const familles: Famille[] = [
    {
      nom: 'determinant',
      poids: poids.determinant,
      fabriquer: (g, n, vues) => fabriquerDistinctes(g, candidats.noms, n, vues, (r, candidat, rang) => determinantQuestion(r, rang, candidat)),
    },
    {
      nom: 'nom',
      poids: poids.nom,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.determinants, n, vues, (r, candidat, rang) => nomQuestion(r, rang, noms, candidat)),
    },
    {
      nom: 'pluriel',
      poids: poids.pluriel,
      fabriquer: (g, n, vues) => fabriquerDistinctes(g, candidats.pluriels, n, vues, (r, candidat, rang) => plurielQuestion(r, rang, candidat)),
    },
    {
      nom: 'plurielx',
      poids: poids.plurielx,
      fabriquer: (g, n, vues) => fabriquerDistinctes(g, candidats.plurielsX, n, vues, (r, candidat, rang) => plurielXQuestion(r, rang, candidat)),
    },
    {
      nom: 'feminin',
      poids: poids.feminin,
      fabriquer: (g, n, vues) => fabriquerDistinctes(g, candidats.feminins, n, vues, (r, candidat, rang) => femininQuestion(r, rang, candidat)),
    },
    {
      nom: 'epithete',
      poids: poids.epithete,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.adjectifs, n, vues, (r, candidat, rang) => epitheteQuestion(r, rang, adjectifs, candidat)),
    },
    {
      nom: 'nomepithete',
      poids: poids.nomepithete,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.adjectifs, n, vues, (r, candidat, rang) => nomEpitheteQuestion(r, rang, noms, candidat)),
    },
    {
      nom: 'groupepluriel',
      poids: poids.groupepluriel,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.groupesPluriel, n, vues, (r, candidat, rang) => groupePlurielQuestion(r, rang, candidat)),
    },
    {
      nom: 'femininadjectif',
      poids: poids.femininadjectif,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.femininsAdjectifs, n, vues, (r, candidat, rang) => femininAdjectifQuestion(r, rang, candidat)),
    },
    {
      nom: 'sujetverbe',
      poids: poids.sujetverbe,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.sujets, n, vues, (r, candidat, rang) => sujetVerbeQuestion(r, rang, matiereDuSujet, candidat)),
    },
    {
      nom: 'attribut',
      poids: poids.attribut,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.attributs, n, vues, (r, candidat, rang) => attributQuestion(r, rang, adjectifs, candidat)),
    },
    {
      nom: 'inverse',
      poids: poids.inverse,
      fabriquer: (g, n, vues) => fabriquerDistinctes(g, candidats.scenes, n, vues, (r, candidat, rang) => inverseQuestion(r, rang, candidat)),
    },
    {
      nom: 'eloigne',
      poids: poids.eloigne,
      fabriquer: (g, n, vues) => fabriquerDistinctes(g, candidats.eloignes, n, vues, (r, candidat, rang) => eloigneQuestion(r, rang, candidat)),
    },
    {
      nom: 'plusieurs',
      poids: poids.plusieurs,
      fabriquer: (g, n, vues) => fabriquerDistinctes(g, candidats.plusieurs, n, vues, (r, candidat, rang) => plusieursQuestion(r, rang, candidat)),
    },
    {
      nom: 'participeetre',
      poids: poids.participeetre,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.participesEtre, n, vues, (r, candidat, rang) => participeEtreQuestion(r, rang, candidat)),
    },
    {
      nom: 'participeavoir',
      poids: poids.participeavoir,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.participesAvoir, n, vues, (r, candidat, rang) => participeAvoirQuestion(r, rang, candidat)),
    },
    {
      nom: 'attributdouble',
      poids: poids.attributdouble,
      fabriquer: (g, n, vues) =>
        fabriquerDistinctes(g, candidats.attributsDoubles, n, vues, (r, candidat, rang) => attributDoubleQuestion(r, rang, adjectifs, candidat)),
    },
  ];
  return composer(rng, count, familles);
}
