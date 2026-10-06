import type { Stage } from '../lib/progression';
import type { Pour } from './orthographeVocabulaireNiveaux';

/**
 * Les mots à écrire sans faute au CE1, au CE2 et en 6e : les mots invariables, puis les mots où une lettre
 * pose problème (c et ç, g, ge et gu, s et ss, m devant m, b et p). L'élève ne choisit jamais entre deux mots :
 * il choisit entre des écritures du même mot, dont une seule est bonne. La phrase dit de quel mot il s'agit.
 *
 * Aucun de ces mots n'a deux graphies depuis les rectifications de 1990 : pas de « boîte », de « maître », de
 * « goûter », de « île », de « connaître », ni de « quelquefois », qui s'écrit aussi en deux mots.
 */

// Les étapes : CE1 de -5 à -3, CE2 de -2 à 0, 6e de 7 à 9.
const CE1_T1: Stage = -5;
const CE2_T1: Stage = -2;
const SIXIEME_T1: Stage = 7;

export interface MotInvariable {
  mot: string;
  /** Trois écritures fausses : celles qu'on fait vraiment, ou un mot qui s'entend pareil (« sûr », « vert »). */
  fautes: [string, string, string];
  /** Des phrases à un seul trou : le mot y manque. */
  phrases: string[];
  depuis: Stage;
  pour: Pour;
}

function invariable(depuis: Stage, pour: Pour, mot: string, fautes: [string, string, string], phrases: string[]): MotInvariable {
  return { depuis, pour, mot, fautes, phrases };
}

export const MOTS_INVARIABLES: MotInvariable[] = [
  // --- CE1-T1 : dans, avec, pour, sur, sous, mais, très, alors, aussi, comme. ---
  invariable(CE1_T1, 'cycle2', 'dans', ['dan', 'dens', 'dant'], ['Le chat dort ... le panier.', 'Paul range ses crayons ... sa trousse.', 'Il y a un oiseau ... le jardin.', 'Nous jouons ... la cour.', 'Le poisson nage ... la rivière.', 'Lola cherche ... son sac.']),
  invariable(CE1_T1, 'cycle2', 'avec', ['avek', 'avèc', 'avecc'], ['Léa joue ... son frère.', 'Je mange ... une cuillère.', 'Paul dessine ... un crayon rouge.', 'Nous allons à la plage ... papa.', 'Tom coupe le pain ... un couteau.', 'Elle chante ... ses amis.']),
  invariable(CE1_T1, 'cycle2', 'pour', ['pur', 'pou', 'pours'], ['Ce gâteau est ... toi.', 'Papa prépare un cadeau ... maman.', 'Léa part ... la piscine.', 'Il achète du pain ... le repas.', 'Ce livre est ... les grands.', 'Nous chantons ... les parents.']),
  invariable(CE1_T1, 'cycle2', 'sur', ['sûr', 'sure', 'sûre'], ['Le livre est ... la table.', 'Le chat saute ... le mur.', 'Un oiseau est posé ... la branche.', 'Pose ton sac ... la chaise.', 'Il y a un tapis ... le sol.', 'Le bateau est ... la mer.']),
  invariable(CE1_T1, 'cycle2', 'sous', ['sou', 'sout', 'soux'], ['Le chat dort ... la table.', 'Le ballon roule ... le lit.', 'Il se cache ... la couverture.', "Les enfants jouent ... l'arbre.", 'Le chien est ... la chaise.', 'Mets ton cahier ... ton livre.']),
  invariable(CE1_T1, 'cycle2', 'mais', ['mes', 'mets', 'mai'], ['Je veux jouer, ... il pleut.', 'Léa est petite, ... elle est forte.', "J'aime le chocolat, ... pas la vanille.", "Il est tard, ... je n'ai pas sommeil.", 'Paul court vite, ... Tom court plus vite.', "Elle a faim, ... il n'y a plus de pain."]),
  invariable(CE1_T1, 'cycle2', 'très', ['tres', 'trés', 'trais'], ['Ce gâteau est ... bon.', "Il fait ... chaud aujourd'hui.", 'Le chien court ... vite.', 'Léa est ... gentille.', 'Cette maison est ... grande.', "J'ai ... faim."]),
  invariable(CE1_T1, 'cycle2', 'alors', ['alore', 'allors', 'alor'], ['Il pleut, ... nous restons à la maison.', "J'ai froid, ... je mets mon manteau.", 'Il est tard, ... on va se coucher.', 'Tu as faim, ... mange une pomme.', 'Le ciel est noir, ... il va pleuvoir.', "Paul a soif, ... il boit de l'eau."]),
  invariable(CE1_T1, 'cycle2', 'aussi', ['ausi', 'aussy', 'ossi'], ['Léa vient ... à la fête.', 'Paul est grand, et Tom ... est grand.', 'Moi ..., je veux jouer.', 'Il a un chat, et elle ... a un chat.', 'Nous irons ... à la plage.', 'Mon frère ... aime le chocolat.']),
  invariable(CE1_T1, 'cycle2', 'comme', ['come', 'comm', 'commes'], ['Il court ... le vent.', 'Léa chante ... un oiseau.', 'Ce gâteau est bon ... celui de papa.', 'Il est fort ... un lion.', 'Elle est douce ... un agneau.', 'Nous jouons ... les grands.']),

  // --- CE2-T1 : les mots fréquents du cycle 2. ---
  invariable(CE2_T1, 'cycle2', 'beaucoup', ['beaucou', 'baucoup', 'beaucoups'], ['Léa a ... de livres.', "J'aime ... ce gâteau.", 'Il y a ... de neige.']),
  invariable(CE2_T1, 'cycle2', 'toujours', ['toujour', 'toujous', 'toujoure'], ['Paul est ... en retard.', 'Il pleut ... en novembre.', 'Léa range ... ses jouets.']),
  invariable(CE2_T1, 'cycle2', 'souvent', ['souvant', 'souvend', 'souvents'], ['Nous allons ... à la piscine.', 'Il joue ... dans la cour.', 'Mamie téléphone ... le dimanche.']),
  invariable(CE2_T1, 'cycle2', 'jamais', ['jamai', 'jammais', 'jamés'], ['Il ne dort ... en classe.', 'Léa ne ment ... à sa maman.', 'Je ne mange ... de poisson.']),
  invariable(CE2_T1, 'cycle2', 'ensemble', ['ensenble', 'ansemble', 'ensamble'], ['Nous jouons ... dans le jardin.', 'Les enfants chantent ... une chanson.', 'Léa et Paul travaillent ... en classe.']),
  invariable(CE2_T1, 'cycle2', 'devant', ['devent', 'devan', 'dévant'], ['Le chat est assis ... la porte.', 'Paul court ... moi.', 'La voiture est garée ... la maison.']),
  invariable(CE2_T1, 'cycle2', 'derrière', ['derière', 'dérrière', 'derrièr'], ['Le chat se cache ... le canapé.', 'Léa marche ... son frère.', 'Il y a un jardin ... la maison.']),
  invariable(CE2_T1, 'cycle2', 'pendant', ['pendent', 'pandant', 'pendan'], ['Léa dort ... la nuit.', 'Nous jouons ... la récréation.', 'Il pleut ... toute la journée.']),
  invariable(CE2_T1, 'cycle2', 'après', ['apres', 'aprés', 'aprè'], ["Nous jouons ... l'école.", 'Léa se lave les mains ... le repas.', 'Tom range sa chambre ... le film.']),
  invariable(CE2_T1, 'cycle2', 'avant', ['avent', 'avan', 'avvant'], ['Nous lavons les mains ... le repas.', 'Léa arrive ... Paul.', 'Range tes affaires ... de partir.']),
  invariable(CE2_T1, 'cycle2', 'depuis', ['depuit', 'depui', 'dépuis'], ['Il pleut ... ce matin.', 'Léa habite ici ... trois ans.', 'Nous attendons ... une heure.']),
  invariable(CE2_T1, 'cycle2', 'chez', ['ché', 'chés', 'chaiz'], ['Léa va ... sa mamie.', 'Paul dort ... son cousin.', 'Nous allons ... le boulanger.']),
  invariable(CE2_T1, 'cycle2', 'vers', ['ver', 'vert', 'verre'], ['Le chat court ... la porte.', 'Léa marche ... la plage.', 'Un oiseau vole ... le nid.']),
  invariable(CE2_T1, 'cycle2', 'donc', ['donk', 'dont', 'don'], ['Il est tard, ... nous rentrons.', 'Tu es fatigué, ... va te coucher.', 'Paul a faim, ... il mange.']),
  invariable(CE2_T1, 'cycle2', 'puis', ['puit', 'pui', 'puits'], ['Léa se lave, ... elle se couche.', 'Nous mangeons, ... nous jouons.', 'Paul ouvre la porte, ... il entre.']),
  invariable(CE2_T1, 'cycle2', 'encore', ['ancore', 'encorre', 'enccore'], ['Léa veut ... du gâteau.', "Il pleut ... aujourd'hui.", 'Tom a ... faim.']),
  invariable(CE2_T1, 'cycle2', 'déjà', ['deja', 'déja', 'dejà'], ['Il est ... midi.', 'Léa a ... fini.', 'Paul est ... parti.']),
  invariable(CE2_T1, 'cycle2', 'bientôt', ['bientot', 'bientôs', 'biento'], ['Il va ... pleuvoir.', "C'est ... Noël.", 'Nous arrivons ... à la maison.']),
  invariable(CE2_T1, 'cycle2', 'enfin', ['anfin', 'enfain', 'enfint'], ['Après un long voyage, nous sommes ... arrivés.', 'Léa a ... fini son dessin.', 'Papa rentre ... !']),
  invariable(CE2_T1, 'cycle2', 'partout', ['partou', 'partoux', 'partous'], ['Il y a des fleurs ... dans le jardin.', 'Le chat cherche ... sa balle.', 'Léa a cherché ... ses clés.']),
  invariable(CE2_T1, 'cycle2', 'dehors', ['dehor', 'déhors', 'dehores'], ['Léa joue ... avec son chien.', 'Il fait froid ... , restons à la maison.', 'Va jouer ... !']),
  invariable(CE2_T1, 'cycle2', 'dedans', ['dedan', 'dedant', 'dedens'], ['Ouvre le sac : regarde ... !', 'Le chat est dans la maison : il est ... depuis ce matin.', 'Le tiroir est ouvert : regarde ... !']),

  // --- 6e-T1 : les mots invariables et fréquents du cycle 3. ---
  invariable(SIXIEME_T1, '6e', 'pourtant', ['pourtan', 'pourtent', 'pourttant'], ['Il a bien révisé, ... il a oublié la leçon.', 'Cet exercice semble facile, ... il est difficile.', 'Elle est timide, ... elle a levé la main.']),
  invariable(SIXIEME_T1, '6e', 'cependant', ['cependent', 'cépendant', 'cependan'], ['Le ciel est gris, ... il ne pleut pas.', 'Ce film est long, ... il est passionnant.', 'Il a peur, ... il avance.']),
  invariable(SIXIEME_T1, '6e', 'malgré', ['malgrès', 'malgret', 'malgrée'], ['Nous sommes sortis ... la pluie.', 'Il a réussi ... ses difficultés.', 'Elle a couru ... la fatigue.']),
  invariable(SIXIEME_T1, '6e', 'parmi', ['parmis', 'parmit', 'parmie'], ['Il y a un intrus ... ces mots.', 'Choisis une réponse ... celles-ci.', 'Léa est ... les meilleurs élèves.']),
  invariable(SIXIEME_T1, '6e', 'autour', ['autours', 'otour', 'autoure'], ['Les enfants dansent ... du feu.', 'Il y a un mur ... du jardin.', 'La Terre tourne ... du Soleil.']),
  invariable(SIXIEME_T1, '6e', 'désormais', ['désormai', 'dèsormais', 'désormès'], ['Léa est au collège : ... elle a un casier.', 'Il a déménagé : ... il habite en ville.', 'Tu es grand : ... tu rentres seul.']),
  invariable(SIXIEME_T1, '6e', 'autrefois', ['autrefoi', 'autrefoit', 'otrefois'], ['..., les enfants écrivaient à la plume.', 'Mon grand-père habitait ... à la campagne.', 'Les gens voyageaient ... à cheval.']),
  invariable(SIXIEME_T1, '6e', 'longtemps', ['longtant', 'longtemp', 'longtens'], ['Nous avons attendu ... le bus.', 'Il a plu ... hier soir.', "Cela fait ... que je ne t'ai pas vu."]),
  invariable(SIXIEME_T1, '6e', "aujourd'hui", ['aujourdhui', "aujourd'huit", 'aujourdui'], ['..., nous avons un contrôle de maths.', 'Il fait très chaud ... dans la classe.', 'Je reste à la maison ... car je suis malade.']),
  invariable(SIXIEME_T1, '6e', 'ailleurs', ['ailleur', 'ayleurs', 'ailleures'], ['Cherche tes clés ..., pas ici.', 'Je préfère aller ... pour les vacances.', "Ton cahier n'est pas ici : cherche ... dans la classe."]),
  invariable(SIXIEME_T1, '6e', 'auparavant', ['oparavant', 'auparavent', 'auparavan'], ['Il habite ici, mais ... il vivait à Lyon.', "Léa lit beaucoup : ... elle n'aimait pas lire."]),
  invariable(SIXIEME_T1, '6e', 'toutefois', ['toutefoi', 'toutefoit', 'toutfois'], ['Il est tard, ... je veux finir mon livre.', 'Tu peux venir, ... prends ton manteau.', 'Le test est facile, ... il faut le relire.']),
  invariable(SIXIEME_T1, '6e', 'néanmoins', ['néamoins', 'neanmoins', 'néanmoin'], ['Le trajet est long, ... nous irons à pied.', "Il est malade, ... il vient à l'école.", 'La route est dangereuse, ... il faut passer.']),
  invariable(SIXIEME_T1, '6e', 'plusieurs', ['plusieur', 'plusieures', 'plusiers'], ['Il y a ... élèves absents.', 'Léa a lu ... livres cette semaine.', '... amis sont venus.']),
  invariable(SIXIEME_T1, '6e', 'environ', ['anviron', 'environt', 'envirron'], ['Le collège est à ... deux kilomètres.', 'Il y a ... trente élèves.', 'Le film dure ... deux heures.']),
  invariable(SIXIEME_T1, '6e', 'volontiers', ['volontier', 'volontié', 'volentiers'], ['Veux-tu un gâteau ? Oui, ... !', 'Il vous aidera ... à porter les sacs.', 'Je viendrai ... à ta fête.']),
  invariable(SIXIEME_T1, '6e', 'vraiment', ['vraimant', 'vraiement', 'vraimen'], ['Ce livre est ... passionnant.', 'Tu es ... gentil.', 'Il est ... fatigué.']),
  invariable(SIXIEME_T1, '6e', 'seulement', ['seulemant', 'seulment', 'soulement'], ['Il reste ... deux minutes.', 'Léa a ... dix ans.', 'Il y a ... un seul gâteau.']),
  invariable(SIXIEME_T1, '6e', 'ensuite', ['ensuit', 'ansuite', 'ensuitte'], ['Lis la consigne, ... réponds.', "D'abord tu réfléchis, ... tu écris.", 'Nous mangeons, ... nous partons.']),
  invariable(SIXIEME_T1, '6e', 'surtout', ['surtou', 'surtoux', 'surttout'], ['Il aime les fruits, ... les pommes.', 'Sois prudent, ... sur la route.', 'Léa adore le sport, ... la natation.']),
  invariable(SIXIEME_T1, '6e', 'presque', ['prèsque', 'presqu', 'presqe'], ['Il est ... midi.', 'Léa a ... fini son exercice.', 'Nous sommes ... arrivés.']),
  invariable(SIXIEME_T1, '6e', 'maintenant', ['maintenent', 'maintenan', 'maintenans'], ['..., range tes affaires.', 'Tu es prêt ... ?', 'Il pleuvait, mais ... il fait beau.']),
];

// --- Les lettres qui manquent -----------------------------------------------------------------------------------------

export type RegleDesLettres = 'c-ç' | 'g-ge-gu' | 's-ss' | 'm';

export interface MotAvecTrou {
  mot: string;
  /** Les lettres qui manquent : « ç », « ge », « ss », « m ». */
  manque: string;
  /** Trois autres choix, dont aucun ne donne un mot de la phrase. */
  fautes: [string, string, string];
  /** Deux phrases : le mot y est écrit avec un trou à la place des lettres qui manquent (« gar...on »). */
  phrases: [string, string];
  regle: RegleDesLettres;
  depuis: Stage;
}

function lettres(regle: RegleDesLettres, mot: string, manque: string, fautes: [string, string, string], phrases: [string, string]): MotAvecTrou {
  return { regle, mot, manque, fautes, phrases, depuis: CE2_T1 };
}

/**
 * Les difficultés du CE2 : c et ç, g, ge et gu, s et ss, m devant m, b et p. Aucun des quatre choix ne donne un mot
 * qui irait dans la phrase : « poi...on » n'accepte pas « s » (« poison »), que la phrase (« pêche un poisson »)
 * écarte.
 */
export const MOTS_AVEC_TROU: MotAvecTrou[] = [
  // c et ç : devant a, o, u, on met une cédille pour garder le son « s ».
  lettres('c-ç', 'garçon', 'ç', ['c', 's', 'ss'], ['Paul est un gar...on gentil.', 'Un gar...on joue au ballon.']),
  lettres('c-ç', 'leçon', 'ç', ['c', 's', 'ss'], ['Nous apprenons la le...on.', 'La le...on est finie.']),
  lettres('c-ç', 'maçon', 'ç', ['c', 's', 'ss'], ['Le ma...on construit un mur.', 'Un ma...on travaille sur le toit.']),
  lettres('c-ç', 'glaçon', 'ç', ['c', 's', 'ss'], ['Il y a un gla...on dans mon verre.', "Le gla...on fond dans l'eau."]),
  lettres('c-ç', 'reçu', 'ç', ['c', 's', 'ss'], ["J'ai re...u un beau cadeau.", 'Léa a re...u une lettre.']),
  lettres('c-ç', 'français', 'ç', ['c', 's', 'ss'], ['Lola parle fran...ais.', 'Nous lisons un livre en fran...ais.']),
  lettres('c-ç', 'balançoire', 'ç', ['c', 's', 'ss'], ['Nora joue sur la balan...oire.', 'La balan...oire est dans le jardin.']),
  lettres('c-ç', 'commençons', 'ç', ['c', 's', 'ss'], ['Nous commen...ons la leçon.', 'Nous commen...ons à courir.']),
  lettres('c-ç', 'façon', 'ç', ['c', 's', 'ss'], ['Je le fais de cette fa...on.', 'Il y a plusieurs fa...ons de jouer.']),
  // g, ge et gu : devant a, o, u le g reste dur ; pour qu'il soit doux, on ajoute un e ; devant e, i, y il est déjà doux, et
  // pour qu'il reste dur on ajoute un u.
  lettres('g-ge-gu', 'mangeons', 'ge', ['g', 'gu', 'j'], ['Nous man...ons à la cantine.', 'Nous man...ons une pomme.']),
  lettres('g-ge-gu', 'nageons', 'ge', ['g', 'gu', 'j'], ['Nous na...ons dans la mer.', 'Nous na...ons à la piscine.']),
  lettres('g-ge-gu', 'rangeons', 'ge', ['g', 'gu', 'j'], ['Nous ran...ons nos cahiers.', 'Nous ran...ons la classe.']),
  lettres('g-ge-gu', 'mangeoire', 'ge', ['g', 'gu', 'j'], ['Les oiseaux mangent dans la man...oire.', 'La man...oire est pleine de graines.']),
  lettres('g-ge-gu', 'nageoire', 'ge', ['g', 'gu', 'j'], ['Le poisson bouge sa na...oire.', 'La na...oire du poisson est rouge.']),
  lettres('g-ge-gu', 'orange', 'g', ['ge', 'gu', 'j'], ['Léa mange une oran...e.', "Paul boit du jus d'oran...e."]),
  lettres('g-ge-gu', 'nuage', 'g', ['ge', 'gu', 'j'], ['Il y a un nua...e dans le ciel.', 'Le nua...e est tout gris.']),
  lettres('g-ge-gu', 'plage', 'g', ['ge', 'gu', 'j'], ['Nous jouons sur la pla...e.', 'La pla...e est pleine de sable.']),
  lettres('g-ge-gu', 'image', 'g', ['ge', 'gu', 'j'], ['Léa colorie une ima...e.', 'Il y a une jolie ima...e dans mon livre.']),
  lettres('g-ge-gu', 'fromage', 'g', ['ge', 'gu', 'j'], ['Paul mange du froma...e.', 'Le froma...e est sur la table.']),
  lettres('g-ge-gu', 'village', 'g', ['ge', 'gu', 'j'], ['Mamie habite dans un petit villa...e.', 'Le villa...e est au bord de la rivière.']),
  lettres('g-ge-gu', 'bougie', 'g', ['ge', 'gu', 'j'], ['Léa souffle la bou...ie.', 'La bou...ie est sur le gâteau.']),
  lettres('g-ge-gu', 'guitare', 'gu', ['g', 'ge', 'j'], ['Hugo joue de la ...itare.', 'La ...itare est dans sa chambre.']),
  lettres('g-ge-gu', 'bague', 'gu', ['g', 'ge', 'j'], ['Léa porte une ba...e.', 'La ba...e est en or.']),
  lettres('g-ge-gu', 'vague', 'gu', ['g', 'ge', 'j'], ['Une va...e arrive sur la plage.', 'La va...e est très haute.']),
  lettres('g-ge-gu', 'baguette', 'gu', ['g', 'ge', 'j'], ['Papa achète une ba...ette.', 'La ba...ette est encore chaude.']),
  lettres('g-ge-gu', 'guirlande', 'gu', ['g', 'ge', 'j'], ['Nous accrochons une ...irlande.', 'La ...irlande brille.']),
  lettres('g-ge-gu', 'fatigue', 'gu', ['g', 'ge', 'j'], ["J'ai de la fati...e.", 'La fati...e se voit sur son visage.']),
  // s et ss : entre deux voyelles, un seul s se prononce « z » ; pour le son « s », on double.
  lettres('s-ss', 'poisson', 'ss', ['s', 'c', 'z'], ['Papa pêche un poi...on dans la rivière.', "Un poi...on nage dans l'eau."]),
  lettres('s-ss', 'chaussure', 'ss', ['s', 'c', 'z'], ['Léa met ses chau...ures neuves.', 'Une chau...ure est sous le lit.']),
  lettres('s-ss', 'tasse', 'ss', ['s', 'c', 'z'], ['Il y a du lait dans la ta...e.', 'La ta...e est sur la table.']),
  lettres('s-ss', 'brosse', 'ss', ['s', 'c', 'z'], ['Léa passe la bro...e dans ses cheveux.', 'La bro...e est dans la salle de bains.']),
  lettres('s-ss', 'classe', 'ss', ['s', 'c', 'z'], ['Les élèves sont dans la cla...e.', 'Notre cla...e est grande.']),
  lettres('s-ss', 'assiette', 'ss', ['s', 'c', 'z'], ['Papa met une a...iette sur la table.', "L'a...iette est pleine de soupe."]),
  lettres('s-ss', 'saucisse', 'ss', ['s', 'c', 'z'], ['Paul mange une sauci...e.', 'La sauci...e est chaude.']),
  lettres('s-ss', 'pousser', 'ss', ['s', 'c', 'z'], ['Il faut pou...er la porte.', 'Léa va pou...er la chaise.']),
  lettres('s-ss', 'poussin', 'ss', ['s', 'c', 'z'], ["Le pou...in sort de l'œuf.", 'Un pou...in suit sa maman.']),
  lettres('s-ss', 'maison', 's', ['ss', 'z', 'c'], ['Nous rentrons à la mai...on.', 'La mai...on est au bout de la rue.']),
  lettres('s-ss', 'cerise', 's', ['ss', 'z', 'c'], ['Paul mange une ceri...e.', 'La ceri...e est rouge.']),
  lettres('s-ss', 'chaise', 's', ['ss', 'z', 'c'], ["Léa s'assoit sur la chai...e.", 'La chai...e est devant la table.']),
  lettres('s-ss', 'fraise', 's', ['ss', 'z', 'c'], ['Nora mange une frai...e.', 'La frai...e est sucrée.']),
  lettres('s-ss', 'oiseau', 's', ['ss', 'z', 'c'], ['Un oi...eau chante sur la branche.', "L'oi...eau a fait son nid."]),
  lettres('s-ss', 'valise', 's', ['ss', 'z', 'c'], ['Papa ferme la vali...e.', 'La vali...e est lourde.']),
  lettres('s-ss', 'cuisine', 's', ['ss', 'z', 'c'], ['Maman est dans la cui...ine.', 'La cui...ine sent bon.']),
  lettres('s-ss', 'chemise', 's', ['ss', 'z', 'c'], ['Paul met sa chemi...e blanche.', "La chemi...e est dans l'armoire."]),
  lettres('s-ss', 'musée', 's', ['ss', 'z', 'c'], ['Nous visitons le mu...ée.', 'Le mu...ée est grand.']),
  // m devant m, b et p : jamais « n ».
  lettres('m', 'jambe', 'm', ['n', 'mm', 'nn'], ["Paul s'est blessé à la ja...be.", 'Léa a mal à la ja...be.']),
  lettres('m', 'lampe', 'm', ['n', 'mm', 'nn'], ['La la...pe éclaire la chambre.', 'Nora allume la la...pe.']),
  lettres('m', 'chambre', 'm', ['n', 'mm', 'nn'], ['Léa range sa cha...bre.', 'Le lit est dans la cha...bre.']),
  lettres('m', 'timbre', 'm', ['n', 'mm', 'nn'], ['Paul colle un ti...bre sur la lettre.', "Le ti...bre est collé sur l'enveloppe."]),
  lettres('m', 'tambour', 'm', ['n', 'mm', 'nn'], ['Tom joue du ta...bour.', 'Le ta...bour fait beaucoup de bruit.']),
  lettres('m', 'trompette', 'm', ['n', 'mm', 'nn'], ['Hugo joue de la tro...pette.', 'La tro...pette est en cuivre.']),
  lettres('m', 'pompier', 'm', ['n', 'mm', 'nn'], ['Le po...pier éteint le feu.', "Un po...pier monte à l'échelle."]),
  lettres('m', 'champ', 'm', ['n', 'mm', 'nn'], ['Les vaches mangent dans le cha...p.', 'Le blé pousse dans le cha...p.']),
  lettres('m', 'ombre', 'm', ['n', 'mm', 'nn'], ["Le chat dort à l'o...bre.", "L'arbre fait de l'o...bre."]),
  lettres('m', 'nombre', 'm', ['n', 'mm', 'nn'], ['Cinq est un no...bre.', 'Léa écrit un no...bre sur son cahier.']),
  lettres('m', 'tomber', 'm', ['n', 'mm', 'nn'], ['Attention, tu vas to...ber !', 'La neige commence à to...ber.']),
  lettres('m', 'tempête', 'm', ['n', 'mm', 'nn'], ['Une te...pête arrive sur la mer.', 'La te...pête casse les arbres.']),
  lettres('m', 'ampoule', 'm', ['n', 'mm', 'nn'], ["L'a...poule est grillée.", 'Papa change une a...poule.']),
  lettres('m', 'compter', 'm', ['n', 'mm', 'nn'], ["Léa sait co...pter jusqu'à cent.", 'Nous allons co...pter les billes.']),
  lettres('m', 'campagne', 'm', ['n', 'mm', 'nn'], ['Mamie habite à la ca...pagne.', 'La ca...pagne est très verte.']),
  lettres('m', 'ambulance', 'm', ['n', 'mm', 'nn'], ["L'a...bulance arrive très vite.", 'Une a...bulance passe dans la rue.']),
  lettres('m', 'pomme', 'mm', ['m', 'n', 'nn'], ['Léa mange une po...e.', 'La po...e est rouge.']),
  lettres('m', 'gomme', 'mm', ['m', 'n', 'nn'], ['Paul efface avec la go...e.', 'La go...e est dans ma trousse.']),
  lettres('m', 'flamme', 'mm', ['m', 'n', 'nn'], ['La fla...e de la bougie bouge.', 'Une petite fla...e brille.']),
];
