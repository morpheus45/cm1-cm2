import type { Stage } from '../lib/progression';

/**
 * Le vocabulaire du CE1, du CE2 et de la 6e : les mots, leurs sens, leurs familles. Chaque liste est écrite à
 * la main, à la main aussi ses mauvaises réponses : un mot qui ne convient pas est un mot qu'aucun dictionnaire
 * ne range parmi les bonnes réponses (un synonyme n'est jamais proposé pour un contraire, un contraire jamais
 * pour un synonyme, un mot de la famille jamais parmi les intrus).
 *
 * Chaque élément dit à partir de quelle étape il est posé (`depuis`) et pour quel cycle (`pour`) : « cycle2 »
 * pour le CE1 et le CE2, qui se suivent, « 6e » pour la sixième. Aucun mot dont l'orthographe a deux graphies
 * depuis les rectifications de 1990 n'y figure (maître, île, coût, goût, brûler, connaître, plaît, dîner…).
 */

export type Pour = 'cycle2' | '6e';

export interface Element {
  depuis: Stage;
  pour: Pour;
}

// Les étapes : CE1 de -5 à -3, CE2 de -2 à 0, 6e de 7 à 9.
const CE1_T1: Stage = -5;
const CE1_T2: Stage = -4;
const CE1_T3: Stage = -3;
const CE2_T1: Stage = -2;
const CE2_T2: Stage = -1;
const CE2_T3: Stage = 0;
const SIXIEME_T1: Stage = 7;
const SIXIEME_T2: Stage = 8;
const SIXIEME_T3: Stage = 9;

// --- Synonymes et contraires ------------------------------------------------------------------------------------

export interface Relation extends Element {
  mot: string;
  bonne: string;
  fausses: [string, string, string];
}

function relation(depuis: Stage, pour: Pour, mot: string, bonne: string, fausses: [string, string, string]): Relation {
  return { depuis, pour, mot, bonne, fausses };
}

/** Pas de mauvaise réponse qui soit elle aussi un synonyme : on y met des contraires et des mots voisins. */
export const SYNONYMES: Relation[] = [
  // CE1 : des mots de tous les jours.
  relation(CE1_T1, 'cycle2', 'beau', 'joli', ['laid', 'petit', 'lourd']),
  relation(CE1_T1, 'cycle2', 'content', 'heureux', ['triste', 'fatigué', 'sage']),
  relation(CE1_T1, 'cycle2', 'gentil', 'aimable', ['méchant', 'timide', 'rapide']),
  relation(CE1_T1, 'cycle2', 'voiture', 'auto', ['vélo', 'avion', 'bateau']),
  relation(CE1_T1, 'cycle2', 'jeter', 'lancer', ['attraper', 'ramasser', 'garder']),
  relation(CE1_T1, 'cycle2', 'finir', 'terminer', ['commencer', 'continuer', 'attendre']),
  relation(CE1_T1, 'cycle2', 'copain', 'camarade', ['ennemi', 'voisin', 'frère']),
  relation(CE1_T1, 'cycle2', 'endroit', 'lieu', ['moment', 'objet', 'chose']),
  relation(CE1_T1, 'cycle2', 'docteur', 'médecin', ['infirmier', 'boulanger', 'facteur']),
  relation(CE1_T1, 'cycle2', 'bicyclette', 'vélo', ['moto', 'voiture', 'camion']),
  relation(CE1_T1, 'cycle2', 'monsieur', 'homme', ['garçon', 'femme', 'père']),
  relation(CE1_T1, 'cycle2', 'dame', 'femme', ['fille', 'homme', 'mère']),
  relation(CE1_T1, 'cycle2', 'vite', 'rapidement', ['lentement', 'doucement', 'tard']),
  // CE2.
  relation(CE2_T1, 'cycle2', 'peur', 'crainte', ['courage', 'joie', 'colère']),
  relation(CE2_T1, 'cycle2', 'cadeau', 'présent', ['paquet', 'bonbon', 'jouet']),
  relation(CE2_T1, 'cycle2', 'petit', 'minuscule', ['énorme', 'large', 'léger']),
  relation(CE2_T1, 'cycle2', 'grand', 'immense', ['petit', 'étroit', 'lourd']),
  relation(CE2_T1, 'cycle2', 'bateau', 'navire', ['avion', 'wagon', 'camion']),
  relation(CE2_T1, 'cycle2', 'sauter', 'bondir', ['tomber', 'courir', 'glisser']),
  relation(CE2_T1, 'cycle2', 'se dépêcher', 'se hâter', ['se reposer', 'se cacher', 'se laver']),
  relation(CE2_T1, 'cycle2', 'commencer', 'débuter', ['finir', 'arrêter', 'attendre']),
  relation(CE2_T1, 'cycle2', 'regarder', 'observer', ['écouter', 'toucher', 'sentir']),
  relation(CE2_T1, 'cycle2', 'chemin', 'sentier', ['mur', 'pont', 'champ']),
  relation(CE2_T1, 'cycle2', 'fatigué', 'épuisé', ['reposé', 'pressé', 'content']),
  relation(CE2_T1, 'cycle2', 'triste', 'malheureux', ['content', 'fâché', 'pressé']),
  relation(CE2_T1, 'cycle2', 'tout de suite', 'immédiatement', ['bientôt', 'jamais', 'souvent']),
  relation(CE2_T1, 'cycle2', 'drôle', 'amusant', ['ennuyeux', 'sérieux', 'triste']),
  relation(CE2_T1, 'cycle2', 'courageux', 'brave', ['peureux', 'timide', 'faible']),
  // 6e : des mots plus rares.
  relation(SIXIEME_T1, '6e', 'difficile', 'compliqué', ['facile', 'court', 'simple']),
  relation(SIXIEME_T1, '6e', 'rapide', 'véloce', ['lent', 'calme', 'lourd']),
  relation(SIXIEME_T1, '6e', 'courageux', 'intrépide', ['peureux', 'prudent', 'timide']),
  relation(SIXIEME_T1, '6e', 'cacher', 'dissimuler', ['montrer', 'trouver', 'perdre']),
  relation(SIXIEME_T1, '6e', 'choisir', 'sélectionner', ['refuser', 'oublier', 'jeter']),
  relation(SIXIEME_T1, '6e', 'entrer', 'pénétrer', ['sortir', 'partir', 'rester']),
  relation(SIXIEME_T1, '6e', 'répondre', 'répliquer', ['demander', 'écouter', 'oublier']),
  relation(SIXIEME_T1, '6e', 'avoir peur', 'craindre', ['aimer', 'oublier', 'chanter']),
  relation(SIXIEME_T1, '6e', 'briller', 'scintiller', ['noircir', 'tomber', 'geler']),
  relation(SIXIEME_T1, '6e', 'aider', 'secourir', ['gêner', 'punir', 'oublier']),
  relation(SIXIEME_T1, '6e', 'habiter', 'résider', ['quitter', 'partir', 'voyager']),
  relation(SIXIEME_T1, '6e', 'achever', 'terminer', ['commencer', 'retarder', 'poursuivre']),
  relation(SIXIEME_T1, '6e', 'calme', 'paisible', ['agité', 'bruyant', 'nerveux']),
  relation(SIXIEME_T1, '6e', 'étrange', 'bizarre', ['normal', 'banal', 'habituel']),
  relation(SIXIEME_T1, '6e', 'immense', 'gigantesque', ['minuscule', 'étroit', 'léger']),
  relation(SIXIEME_T1, '6e', "s'égarer", 'se perdre', ['se retrouver', 'rentrer', 'arriver']),
  relation(SIXIEME_T1, '6e', 'mince', 'fin', ['épais', 'gros', 'lourd']),
  relation(SIXIEME_T1, '6e', 'peureux', 'craintif', ['courageux', 'calme', 'sage']),
  relation(SIXIEME_T1, '6e', 'dispute', 'querelle', ['accord', 'amitié', 'jeu']),
];

export const CONTRAIRES: Relation[] = [
  // CE1.
  relation(CE1_T2, 'cycle2', 'grand', 'petit', ['gros', 'beau', 'long']),
  relation(CE1_T2, 'cycle2', 'monter', 'descendre', ['grimper', 'sauter', 'courir']),
  relation(CE1_T2, 'cycle2', 'jour', 'nuit', ['matin', 'soir', 'lundi']),
  relation(CE1_T2, 'cycle2', 'chaud', 'froid', ['bouillant', 'tiède', 'sec']),
  relation(CE1_T2, 'cycle2', 'ouvrir', 'fermer', ['casser', 'pousser', 'porter']),
  relation(CE1_T2, 'cycle2', 'entrer', 'sortir', ['arriver', 'monter', 'passer']),
  relation(CE1_T2, 'cycle2', 'content', 'triste', ['heureux', 'sage', 'poli']),
  relation(CE1_T2, 'cycle2', 'plein', 'vide', ['lourd', 'gros', 'rond']),
  relation(CE1_T2, 'cycle2', 'propre', 'sale', ['neuf', 'joli', 'clair']),
  relation(CE1_T2, 'cycle2', 'lent', 'rapide', ['calme', 'lourd', 'doux']),
  relation(CE1_T2, 'cycle2', 'gentil', 'méchant', ['timide', 'calme', 'poli']),
  relation(CE1_T2, 'cycle2', 'fort', 'faible', ['gros', 'lourd', 'grand']),
  relation(CE1_T2, 'cycle2', 'haut', 'bas', ['grand', 'long', 'large']),
  relation(CE1_T2, 'cycle2', 'avant', 'après', ['pendant', 'hier', 'tôt']),
  relation(CE1_T2, 'cycle2', 'jeune', 'vieux', ['petit', 'neuf', 'joli']),
  relation(CE1_T2, 'cycle2', 'aimer', 'détester', ['adorer', 'aider', 'garder']),
  relation(CE1_T2, 'cycle2', 'début', 'fin', ['milieu', 'départ', 'suite']),
  relation(CE1_T2, 'cycle2', 'long', 'court', ['large', 'grand', 'haut']),
  relation(CE1_T2, 'cycle2', 'devant', 'derrière', ['dessus', 'près', 'loin']),
  relation(CE1_T2, 'cycle2', 'lourd', 'léger', ['gros', 'grand', 'fort']),
  relation(CE1_T2, 'cycle2', 'sec', 'mouillé', ['chaud', 'propre', 'froid']),
  relation(CE1_T2, 'cycle2', 'ami', 'ennemi', ['voisin', 'copain', 'frère']),
  relation(CE1_T2, 'cycle2', 'gagner', 'perdre', ['jouer', 'courir', 'tomber']),
  relation(CE1_T2, 'cycle2', 'rire', 'pleurer', ['sourire', 'chanter', 'crier']),
  // CE2.
  relation(CE2_T2, 'cycle2', 'facile', 'difficile', ['simple', 'court', 'clair']),
  relation(CE2_T2, 'cycle2', 'riche', 'pauvre', ['gros', 'grand', 'content']),
  relation(CE2_T2, 'cycle2', 'accepter', 'refuser', ['permettre', 'demander', 'donner']),
  relation(CE2_T2, 'cycle2', 'arriver', 'partir', ['entrer', 'venir', 'monter']),
  relation(CE2_T2, 'cycle2', 'cacher', 'montrer', ['trouver', 'perdre', 'garder']),
  relation(CE2_T2, 'cycle2', 'allumer', 'éteindre', ['chauffer', 'éclairer', 'casser']),
  relation(CE2_T2, 'cycle2', 'fermé', 'ouvert', ['caché', 'lourd', 'vide']),
  relation(CE2_T2, 'cycle2', 'toujours', 'jamais', ['souvent', 'encore', 'déjà']),
  relation(CE2_T2, 'cycle2', 'tôt', 'tard', ['vite', 'bientôt', 'déjà']),
  relation(CE2_T2, 'cycle2', 'avancer', 'reculer', ['marcher', 'courir', 'sauter']),
  relation(CE2_T2, 'cycle2', 'bruyant', 'silencieux', ['lent', 'rapide', 'lourd']),
  relation(CE2_T2, 'cycle2', 'sombre', 'clair', ['propre', 'blanc', 'léger']),
  relation(CE2_T2, 'cycle2', 'beaucoup', 'peu', ['trop', 'assez', 'très']),
  // 6e.
  relation(SIXIEME_T1, '6e', 'courageux', 'lâche', ['prudent', 'fort', 'poli']),
  relation(SIXIEME_T1, '6e', 'ancien', 'moderne', ['vieux', 'grand', 'lent']),
  relation(SIXIEME_T1, '6e', 'approuver', 'désapprouver', ['encourager', 'écouter', 'choisir']),
  relation(SIXIEME_T1, '6e', 'avantage', 'inconvénient', ['bénéfice', 'profit', 'gain']),
  relation(SIXIEME_T1, '6e', 'rare', 'fréquent', ['précieux', 'cher', 'petit']),
  relation(SIXIEME_T1, '6e', 'sincère', 'hypocrite', ['honnête', 'poli', 'timide']),
  relation(SIXIEME_T1, '6e', 'durable', 'éphémère', ['solide', 'rare', 'utile']),
  relation(SIXIEME_T1, '6e', 'accueillir', 'repousser', ['inviter', 'saluer', 'suivre']),
  relation(SIXIEME_T1, '6e', 'généreux', 'avare', ['riche', 'gentil', 'poli']),
  relation(SIXIEME_T1, '6e', 'victoire', 'défaite', ['combat', 'match', 'médaille']),
  relation(SIXIEME_T1, '6e', 'lentement', 'rapidement', ['doucement', 'tard', 'vraiment']),
  relation(SIXIEME_T1, '6e', 'ajouter', 'retrancher', ['compter', 'calculer', 'multiplier']),
];

/** Des synonymes plus forts : le 2e trimestre de la 6e, « synonymes nuancés ». Aucune mauvaise réponse n'est plus forte. */
export const SYNONYMES_PLUS_FORTS: Relation[] = [
  relation(SIXIEME_T2, '6e', 'chaud', 'bouillant', ['tiède', 'frais', 'doux']),
  relation(SIXIEME_T2, '6e', 'froid', 'glacial', ['frais', 'tiède', 'doux']),
  relation(SIXIEME_T2, '6e', 'grand', 'immense', ['moyen', 'petit', 'mince']),
  relation(SIXIEME_T2, '6e', 'fatigué', 'épuisé', ['reposé', 'content', 'pressé']),
  relation(SIXIEME_T2, '6e', 'content', 'ravi', ['triste', 'calme', 'pressé']),
  relation(SIXIEME_T2, '6e', 'peur', 'terreur', ['crainte', 'doute', 'gêne']),
  relation(SIXIEME_T2, '6e', 'joli', 'splendide', ['plaisant', 'mignon', 'simple']),
  relation(SIXIEME_T2, '6e', 'bruit', 'vacarme', ['son', 'murmure', 'souffle']),
  relation(SIXIEME_T2, '6e', 'pleurer', 'sangloter', ['sourire', 'chuchoter', 'soupirer']),
  relation(SIXIEME_T2, '6e', 'crier', 'hurler', ['parler', 'murmurer', 'chuchoter']),
  relation(SIXIEME_T2, '6e', 'fâché', 'furieux', ['agacé', 'ennuyé', 'calme']),
  relation(SIXIEME_T2, '6e', 'mouillé', 'trempé', ['humide', 'sec', 'frais']),
  relation(SIXIEME_T2, '6e', 'beau', 'magnifique', ['agréable', 'correct', 'simple']),
  relation(SIXIEME_T2, '6e', 'petit', 'minuscule', ['mince', 'court', 'moyen']),
];

// --- Les mots composés ------------------------------------------------------------------------------------------------

export interface MotCompose extends Element {
  mot: string;
  /** Les deux mots qui, mis bout à bout, donnent le mot composé : « porte » et « manteau ». */
  parties: [string, string];
}

function compose(depuis: Stage, pour: Pour, mot: string, parties: [string, string]): MotCompose {
  return { depuis, pour, mot, parties };
}

/**
 * Des mots composés qui s'écrivent d'un seul tenant, sans trait d'union : « porte-clés » et « tire-bouchon » ont une
 * graphie rectifiée en 1990 (« porteclés », « tirebouchon »), ceux-ci n'en ont qu'une.
 */
export const MOTS_COMPOSES: MotCompose[] = [
  compose(CE2_T3, 'cycle2', 'parapluie', ['para', 'pluie']),
  compose(CE2_T3, 'cycle2', 'portefeuille', ['porte', 'feuille']),
  compose(CE2_T3, 'cycle2', 'tournevis', ['tourne', 'vis']),
  compose(CE2_T3, 'cycle2', 'passeport', ['passe', 'port']),
  compose(CE2_T3, 'cycle2', 'pourboire', ['pour', 'boire']),
  compose(CE2_T3, 'cycle2', 'bonjour', ['bon', 'jour']),
  compose(CE2_T3, 'cycle2', 'beaucoup', ['beau', 'coup']),
  compose(CE2_T3, 'cycle2', 'longtemps', ['long', 'temps']),
  compose(SIXIEME_T3, '6e', 'parapluie', ['para', 'pluie']),
  compose(SIXIEME_T3, '6e', 'parachute', ['para', 'chute']),
  compose(SIXIEME_T3, '6e', 'parasol', ['para', 'sol']),
  compose(SIXIEME_T3, '6e', 'portefeuille', ['porte', 'feuille']),
  compose(SIXIEME_T3, '6e', 'tournevis', ['tourne', 'vis']),
  compose(SIXIEME_T3, '6e', 'passeport', ['passe', 'port']),
  compose(SIXIEME_T3, '6e', 'pourboire', ['pour', 'boire']),
  compose(SIXIEME_T3, '6e', 'vinaigre', ['vin', 'aigre']),
  compose(SIXIEME_T3, '6e', 'bonhomme', ['bon', 'homme']),
  compose(SIXIEME_T3, '6e', 'longtemps', ['long', 'temps']),
  compose(SIXIEME_T3, '6e', 'beaucoup', ['beau', 'coup']),
];

// --- Les familles de mots ---------------------------------------------------------------------------------------------

export interface Famille extends Element {
  racine: string;
  /** Au moins quatre mots de la famille. */
  membres: string[];
  /** Des mots qui ressemblent à la racine sans être de sa famille : au moins trois. */
  intrus: string[];
}

function famille(depuis: Stage, pour: Pour, racine: string, membres: string[], intrus: string[]): Famille {
  return { depuis, pour, racine, membres, intrus };
}

export const FAMILLES: Famille[] = [
  // CE1 : des familles très courtes, des intrus qui commencent par les mêmes lettres.
  famille(CE1_T1, 'cycle2', 'jardin', ['jardinier', 'jardiner', 'jardinage', 'jardinet'], ['jaune', 'jambon', 'jouet', 'jument']),
  famille(CE1_T1, 'cycle2', 'dent', ['dentiste', 'dentifrice', 'dentier', 'denture'], ['dessin', 'danse', 'dindon', 'dorade']),
  famille(CE1_T1, 'cycle2', 'lait', ['laitier', 'laitage', 'laiterie', 'allaiter'], ['laid', 'laine', 'lapin', 'laisse']),
  famille(CE1_T1, 'cycle2', 'fleur', ['fleuriste', 'fleurir', 'fleuri', 'fleurette'], ['fleuve', 'flèche', 'flamme', 'flaque']),
  famille(CE1_T1, 'cycle2', 'neige', ['neiger', 'neigeux', 'enneigé', 'déneiger'], ['nez', 'nuit', 'nage', 'nord']),
  famille(CE1_T1, 'cycle2', 'chant', ['chanter', 'chanteur', 'chanson', 'chantonner'], ['champ', 'chat', 'chanvre', 'chaud']),
  famille(CE1_T2, 'cycle2', 'colle', ['coller', 'collage', 'décoller', 'collant'], ['collier', 'colline', 'col', 'colis']),
  famille(CE1_T2, 'cycle2', 'sable', ['sablier', 'sablonneux', 'ensabler', 'sablé'], ['table', 'câble', 'sabre', 'sabot']),
  famille(CE1_T2, 'cycle2', 'peinture', ['peindre', 'peintre', 'repeindre', 'peint'], ['peigne', 'pente', 'peine', 'pelle']),
  // CE2 : des familles plus longues, des intrus qui ressemblent aux mots de la famille.
  famille(CE2_T1, 'cycle2', 'terre', ['terrain', 'terrasse', 'atterrir', 'souterrain', 'enterrer'], ['terrible', 'tortue', 'tarte', 'tertio']),
  famille(CE2_T1, 'cycle2', 'mer', ['marin', 'marée', 'maritime', 'amerrir'], ['marche', 'marteau', 'maire', 'merle']),
  famille(CE2_T1, 'cycle2', 'porter', ['porteur', 'portable', 'apporter', 'emporter', 'transporter'], ['portail', 'porte', 'portrait', 'portion']),
  famille(CE2_T1, 'cycle2', 'lire', ['lecteur', 'lecture', 'relire', 'illisible', 'lisible'], ['lit', 'lisse', 'lien', 'lime']),
  famille(CE2_T2, 'cycle2', 'chaud', ['chaleur', 'chauffer', 'chauffage', 'réchauffer'], ['chauve', 'chaussure', 'chaton', 'chaux']),
  famille(CE2_T2, 'cycle2', 'rond', ['rondeur', 'arrondir', 'rondelle', 'rondement'], ['ronce', 'ronfler', 'rongeur', 'ronron']),
  famille(CE2_T2, 'cycle2', 'bois', ['boisé', 'boiserie', 'boiser', 'déboiser'], ['boire', 'boisson', 'boiteux', 'boiter']),
  famille(CE2_T3, 'cycle2', 'lent', ['lenteur', 'lentement', 'ralentir', 'ralenti'], ['lentille', 'lanterne', 'lance', 'lame']),
  famille(CE2_T3, 'cycle2', 'vent', ['venteux', 'éventail', 'éventer', 'ventilateur'], ['vente', 'ventre', 'venir', 'vendre']),
  // 6e : des familles étendues, des mots qui ont l'air d'en être.
  famille(SIXIEME_T1, '6e', 'tenir', ['tenue', 'soutenir', 'retenir', 'maintenir', 'contenir'], ['tendre', 'tente', 'tension', 'tennis']),
  famille(SIXIEME_T1, '6e', 'faire', ['défaire', 'refaire', 'faisable', 'malfaisant'], ['faim', 'fête', 'fée', 'faible']),
  famille(SIXIEME_T1, '6e', 'voir', ['voyant', 'revoir', 'prévoir', 'entrevoir'], ['voie', 'voile', 'voix', 'voisin']),
  famille(SIXIEME_T1, '6e', 'courir', ['coureur', 'course', 'parcours', 'accourir'], ['cour', 'courge', 'court', 'courrier']),
  famille(SIXIEME_T3, '6e', 'dire', ['redire', 'prédire', 'médire', 'contredire'], ['diriger', 'diable', 'dinde', 'dispute']),
  famille(SIXIEME_T3, '6e', 'chanter', ['chanteur', 'chanson', 'enchanter', 'déchanter', 'chantonner'], ['champ', 'changer', 'chapeau', 'chanvre']),
  famille(SIXIEME_T3, '6e', 'monter', ['montée', 'démonter', 'remonter', 'montage'], ['montrer', 'monnaie', 'monstre', 'monotone']),
  famille(SIXIEME_T3, '6e', 'grand', ['grandir', 'agrandir', 'grandeur', 'grandiose'], ['grain', 'grange', 'grappe', 'grave']),
  famille(SIXIEME_T3, '6e', 'jour', ['journal', 'journée', 'journalier', 'ajourner'], ['joue', 'jouet', 'joug', 'joyeux']),
];

// --- Préfixes et suffixes ------------------------------------------------------------------------------------------------

export interface Affixe extends Element {
  /** Le préfixe ou le suffixe, avec son trait d'union : « re- », « -eur ». */
  affixe: string;
  /** Ce qu'il veut dire. */
  sens: string;
  /** Des mots où on le trouve. */
  mots: string[];
  /** Faux quand deux écritures du même suffixe se disputent (« -tion » et « -ation ») : on n'en demande que le sens. */
  reconnaissable: boolean;
}

function affixe(depuis: Stage, pour: Pour, forme: string, sens: string, mots: string[], reconnaissable = true): Affixe {
  return { depuis, pour, affixe: forme, sens, mots, reconnaissable };
}

/** Les préfixes : ceux du programme, avec leur sens. « sur- » a deux sens, chacun a ses mots. */
export const PREFIXES: Affixe[] = [
  affixe(CE1_T3, 'cycle2', 're-', 'de nouveau', ['refaire', 'relire', 'replanter', 'recoller', 'redessiner', 'rejouer', 'recompter', 'recommencer']),
  affixe(CE1_T3, 'cycle2', 'dé-', 'le contraire', ['défaire', 'décoller', 'déplacer', 'découvrir', 'déboutonner', 'décrocher', 'démonter', 'déballer']),
  affixe(CE2_T1, 'cycle2', 'in-', 'le contraire', ['inutile', 'inconnu', 'invisible', 'injuste', 'incapable', 'incomplet', 'inexact', 'inattentif']),
  affixe(SIXIEME_T1, '6e', 're-', 'de nouveau', ['refaire', 'relire', 'replanter', 'redémarrer', 'recopier', 'reconstruire', 'recommencer', 'redescendre']),
  affixe(SIXIEME_T1, '6e', 'dé-', 'le contraire', ['défaire', 'décoller', 'déplacer', 'découvrir', 'déboutonner', 'démonter', 'décharger', 'dégonfler']),
  affixe(SIXIEME_T1, '6e', 'in-', 'le contraire', ['inutile', 'inconnu', 'invisible', 'injuste', 'incapable', 'incomplet', 'inexact', 'inattentif']),
  affixe(SIXIEME_T1, '6e', 'im-', 'le contraire', ['impossible', 'impoli', 'imparfait', 'immobile', 'imprudent', 'impatient']),
  affixe(SIXIEME_T1, '6e', 'pré-', 'avant', ['préhistoire', 'prénom', 'prévoir', 'prédire', 'préchauffer', 'préavis']),
  affixe(SIXIEME_T1, '6e', 'sur-', 'au-dessus', ['survoler', 'surélever', 'surmonter']),
  affixe(SIXIEME_T1, '6e', 'sur-', 'trop', ['surcharger', 'surchauffer', 'surpeupler']),
];

/** Les suffixes : ceux du programme. */
export const SUFFIXES: Affixe[] = [
  affixe(CE1_T3, 'cycle2', '-eur', 'celui qui fait', ['chanteur', 'danseur', 'nageur', 'coureur', 'vendeur', 'joueur', 'voleur', 'menteur']),
  affixe(CE1_T3, 'cycle2', '-ette', 'petit', ['fillette', 'maisonnette', 'clochette', 'fourchette', 'tablette', 'poulette', 'fleurette']),
  affixe(CE2_T1, 'cycle2', '-ment', "d'une manière", ['lentement', 'doucement', 'calmement', 'gentiment', 'poliment', 'tristement', 'vivement']),
  affixe(SIXIEME_T1, '6e', '-ment', "d'une manière", ['lentement', 'doucement', 'calmement', 'gentiment', 'poliment', 'tristement', 'vivement']),
  affixe(SIXIEME_T1, '6e', '-eur', 'celui qui fait', ['chanteur', 'danseur', 'nageur', 'coureur', 'vendeur', 'joueur', 'voleur', 'menteur']),
  affixe(SIXIEME_T1, '6e', '-tion', "l'action de", ['décoration', 'invitation', 'préparation', 'réparation', 'punition', 'création'], false),
  affixe(SIXIEME_T1, '6e', '-able', 'qui peut être', ['lavable', 'mangeable', 'jetable', 'portable', 'réparable', 'buvable']),
];

/** Des contraires faits avec un préfixe : le mot, son contraire, et trois mots de sa famille qui n'en sont pas. */
export interface ContraireAvecPrefixe extends Element {
  mot: string;
  contraire: string;
  famille: [string, string, string];
}

function contraire(depuis: Stage, pour: Pour, mot: string, opposé: string, parents: [string, string, string]): ContraireAvecPrefixe {
  return { depuis, pour, mot, contraire: opposé, famille: parents };
}

export const CONTRAIRES_AVEC_PREFIXE: ContraireAvecPrefixe[] = [
  contraire(CE1_T3, 'cycle2', 'coller', 'décoller', ['recoller', 'collage', 'collant']),
  contraire(CE1_T3, 'cycle2', 'faire', 'défaire', ['refaire', 'fait', 'faiseur']),
  contraire(CE1_T3, 'cycle2', 'monter', 'démonter', ['remonter', 'montée', 'montage']),
  contraire(CE1_T3, 'cycle2', 'plier', 'déplier', ['replier', 'pli', 'pliage']),
  contraire(CE1_T3, 'cycle2', 'boutonner', 'déboutonner', ['reboutonner', 'bouton', 'boutonnière']),
  contraire(CE1_T3, 'cycle2', 'charger', 'décharger', ['recharger', 'chargement', 'charge']),
  contraire(CE1_T3, 'cycle2', 'gonfler', 'dégonfler', ['regonfler', 'gonflable', 'gonflé']),
  contraire(CE1_T3, 'cycle2', 'couvrir', 'découvrir', ['recouvrir', 'couvert', 'couverture']),
  contraire(CE2_T1, 'cycle2', 'utile', 'inutile', ['utiliser', 'utilement', 'utilité']),
  contraire(CE2_T1, 'cycle2', 'connu', 'inconnu', ['connaissance', 'reconnu', 'connue']),
  contraire(CE2_T1, 'cycle2', 'visible', 'invisible', ['visiblement', 'visibilité', 'vision']),
  contraire(CE2_T1, 'cycle2', 'juste', 'injuste', ['justement', 'justice', 'justesse']),
  contraire(CE2_T1, 'cycle2', 'complet', 'incomplet', ['compléter', 'complètement', 'complété']),
  contraire(SIXIEME_T1, '6e', 'possible', 'impossible', ['possibilité', 'possiblement', 'possibles']),
  contraire(SIXIEME_T1, '6e', 'poli', 'impoli', ['poliment', 'politesse', 'polir']),
  contraire(SIXIEME_T1, '6e', 'prudent', 'imprudent', ['prudemment', 'prudence', 'prudents']),
  contraire(SIXIEME_T1, '6e', 'patient', 'impatient', ['patience', 'patiemment', 'patients']),
  contraire(SIXIEME_T1, '6e', 'mobile', 'immobile', ['mobilité', 'mobiliser', 'mobilier']),
  contraire(SIXIEME_T1, '6e', 'lisible', 'illisible', ['lisiblement', 'lecture', 'lisibilité']),
  contraire(SIXIEME_T1, '6e', 'réel', 'irréel', ['réellement', 'réalité', 'réaliser']),
  contraire(SIXIEME_T1, '6e', 'attentif', 'inattentif', ['attention', 'attentivement', 'attentifs']),
  contraire(SIXIEME_T1, '6e', 'habiller', 'déshabiller', ['rhabiller', 'habit', 'habillement']),
  contraire(SIXIEME_T1, '6e', 'obéir', 'désobéir', ['obéissant', 'obéissance', 'obéi']),
];

// --- Polysémie ---------------------------------------------------------------------------------------------------------------------

export interface Sens {
  /** Une définition courte. */
  definition: string;
  /** Des phrases où le mot a ce sens. Le mot y est écrit entre ** : « une **feuille** de papier ». */
  phrases: string[];
}

export interface MotAPlusieursSens extends Element {
  mot: string;
  sens: Sens[];
}

function polysemie(depuis: Stage, pour: Pour, mot: string, sens: Sens[]): MotAPlusieursSens {
  return { depuis, pour, mot, sens };
}

export const POLYSEMIE: MotAPlusieursSens[] = [
  polysemie(CE1_T2, 'cycle2', 'feuille', [
    { definition: "ce qui pousse sur l'arbre", phrases: ["Une **feuille** tombe de l'arbre.", 'En automne, les **feuilles** deviennent jaunes.', 'Le vent emporte une **feuille** morte.'] },
    { definition: 'une page de papier', phrases: ['Léa écrit sur une **feuille** blanche.', "Je range ma **feuille** dans le classeur.", 'Paul déchire une **feuille** de son cahier.'] },
  ]),
  polysemie(CE1_T2, 'cycle2', 'souris', [
    { definition: 'un petit animal', phrases: ['La **souris** mange du fromage.', 'Le chat guette la **souris**.', 'Une **souris** se cache dans le trou.'] },
    { definition: "ce qu'on déplace pour l'ordinateur", phrases: ["Léa clique avec la **souris**.", "La **souris** de l'ordinateur est cassée.", "Paul branche la **souris** à l'ordinateur."] },
  ]),
  polysemie(CE1_T2, 'cycle2', 'glace', [
    { definition: "de l'eau gelée", phrases: ["Il y a de la **glace** sur le lac.", "Le bassin est couvert de **glace**.", "La **glace** de la mare est épaisse."] },
    { definition: 'un dessert froid', phrases: ["Léa mange une **glace** à la fraise.", 'Papa achète une **glace** au chocolat.', 'La **glace** coule sur ses doigts.'] },
    { definition: 'un grand miroir', phrases: ["Maman se regarde dans la **glace**.", 'La **glace** du salon est grande.', 'Paul se voit dans la **glace**.'] },
  ]),
  polysemie(CE1_T2, 'cycle2', 'pied', [
    { definition: 'le bout de la jambe', phrases: ["Léa a mal au **pied**.", 'Paul met sa chaussure au **pied**.', 'Le bébé tape du **pied**.'] },
    { definition: "ce qui tient un meuble", phrases: ["Le **pied** de la table est cassé.", "Un **pied** de la chaise est plus court.", "Papa répare le **pied** du lit."] },
    { definition: "le bas d'une montagne", phrases: ["Nous campons au **pied** de la montagne.", "Les skieurs attendent au **pied** de la montagne.", "Un chalet est au **pied** du mont Blanc."] },
  ]),
  polysemie(CE1_T2, 'cycle2', 'langue', [
    { definition: 'ce qui est dans la bouche', phrases: ["Le chat tire la **langue**.", 'Léa se mord la **langue**.', 'Paul montre sa **langue** au docteur.'] },
    { definition: 'ce que parlent les gens', phrases: ["Le français est une **langue**.", "Nora apprend une **langue** étrangère.", 'Dans ce pays, on parle une autre **langue**.'] },
  ]),
  polysemie(CE2_T2, 'cycle2', 'carte', [
    { definition: 'un jeu avec des dessins', phrases: ['Paul bat les **cartes** avant de jouer.', 'Il manque une **carte** dans le paquet.', 'Léa a le roi de cœur : c\'est sa meilleure **carte**.'] },
    { definition: 'un dessin qui montre un pays', phrases: ["Nous cherchons la ville sur la **carte**.", 'Le marin regarde la **carte** de la mer.', 'La **carte** de France est au mur.'] },
    { definition: "la liste des plats d'un restaurant", phrases: ['Papa lit la **carte** du restaurant.', 'Le serveur apporte la **carte**.', 'Il y a des glaces sur la **carte**.'] },
  ]),
  polysemie(CE2_T2, 'cycle2', 'vol', [
    { definition: 'le fait de voler dans le ciel', phrases: ["Le **vol** de l'oiseau est rapide.", "Nous regardons le **vol** des canards.", "Le **vol** de l'avion dure deux heures."] },
    { definition: 'ce que fait un voleur', phrases: ["La police enquête sur un **vol** de bijoux.", 'Le policier cherche le voleur après un **vol**.', 'Il a signalé un **vol** de vélo.'] },
  ]),
  polysemie(CE2_T2, 'cycle2', 'pièce', [
    { definition: "une salle d'une maison", phrases: ["Nous mangeons dans la **pièce** à côté de la cuisine.", 'La maison a cinq **pièces**.', "Papa peint la **pièce** en bleu."] },
    { definition: "de l'argent en métal", phrases: ["Paul met une **pièce** dans la tirelire.", 'Léa compte ses **pièces** de monnaie.', 'Il trouve une **pièce** de deux euros par terre.'] },
    { definition: 'un morceau de puzzle', phrases: ['Il manque une **pièce** au puzzle.', "Léa cherche la dernière **pièce**.", "Une **pièce** du puzzle est sous le lit."] },
  ]),
  polysemie(CE2_T2, 'cycle2', 'tour', [
    { definition: 'un bâtiment très haut', phrases: ["Nous montons dans la **tour**.", 'La **tour** du château est vieille.', "On voit la **tour** de loin."] },
    { definition: 'une petite promenade', phrases: ["Nous faisons un **tour** dans le parc.", "Papa fait un **tour** à vélo.", "Léa fait un **tour** dans le jardin."] },
    { definition: 'le moment de jouer', phrases: ["C'est ton **tour** de jouer.", "Chacun attend son **tour**.", "Paul passe son **tour**."] },
  ]),
  polysemie(CE2_T3, 'cycle2', 'classe', [
    { definition: "la salle où l'on apprend", phrases: ["Léa range ses affaires dans la **classe**.", 'La **classe** est au premier étage.', 'Tom entre dans la **classe**.'] },
    { definition: 'tous les élèves ensemble', phrases: ["Toute la **classe** chante.", "La **classe** part en voyage.", "La **classe** applaudit Nora."] },
  ]),
  polysemie(SIXIEME_T2, '6e', 'article', [
    { definition: 'un texte dans un journal', phrases: ["Léa lit un **article** sur les volcans.", "Le journaliste écrit un **article**.", "Cet **article** parle du climat."] },
    { definition: 'un objet à vendre', phrases: ["Ce magasin vend des **articles** de sport.", "Un **article** est en promotion.", "Cet **article** est très bon marché."] },
    { definition: 'un petit mot comme « le » ou « un »', phrases: ["« Le » est un **article** défini.", "Il faut mettre un **article** devant ce nom.", "« Un » est un **article** indéfini."] },
  ]),
  polysemie(SIXIEME_T2, '6e', 'bureau', [
    { definition: 'un meuble pour travailler', phrases: ["Lucas range ses cahiers sur son **bureau**.", "Le **bureau** de ma chambre est en bois.", 'Chloé pose sa lampe sur le **bureau**.'] },
    { definition: 'une pièce où on travaille', phrases: ["Le directeur est dans son **bureau**.", "Mon père travaille dans un **bureau**.", "Il faut aller au **bureau** du principal."] },
  ]),
  polysemie(SIXIEME_T2, '6e', 'note', [
    { definition: "un son d'une mélodie", phrases: ["Le pianiste joue une **note** très aiguë.", "Léa chante la bonne **note**.", "Il manque une **note** à cette mélodie."] },
    { definition: 'un résultat sur une copie', phrases: ["Lucas a une bonne **note** en maths.", "La **note** du contrôle est écrite en rouge.", "Chloé est contente de sa **note** de français."] },
    { definition: 'un court message écrit', phrases: ["Papa laisse une **note** sur la table.", "J'ai trouvé une **note** dans mon cartable.", "Karim écrit une **note** pour son voisin."] },
  ]),
  polysemie(SIXIEME_T2, '6e', 'mine', [
    { definition: "la partie noire d'un crayon", phrases: ["La **mine** de mon crayon est cassée.", "Il faut changer la **mine** du critérium.", "Léa casse la **mine** de son crayon."] },
    { definition: "un trou d'où l'on sort du charbon", phrases: ["Les ouvriers descendent dans la **mine**.", "Cette **mine** de charbon est très profonde.", "Mon arrière-grand-père travaillait à la **mine**."] },
    { definition: "l'air du visage", phrases: ["Tu as bonne **mine** aujourd'hui.", "Elle a une triste **mine**.", "Il a mauvaise **mine** ce matin."] },
  ]),
  polysemie(SIXIEME_T2, '6e', 'pile', [
    { definition: "ce qui fait marcher un appareil", phrases: ["Je change la **pile** de la lampe.", "La **pile** de la télécommande est vide.", "Il faut une **pile** neuve pour la montre."] },
    { definition: 'un tas de choses posées les unes sur les autres', phrases: ["Léa pose une **pile** de livres.", "Une **pile** d'assiettes est sur la table.", "Il y a une **pile** de cahiers sur le bureau."] },
  ]),
  polysemie(SIXIEME_T2, '6e', 'poste', [
    { definition: "l'endroit où l'on envoie les lettres", phrases: ["Papa va à la **poste** pour envoyer un colis.", "La **poste** ferme à cinq heures.", "Léa met un timbre à la **poste**."] },
    { definition: 'un emploi', phrases: ["Ma tante a un nouveau **poste** à la mairie.", "Le **poste** de gardien est libre.", "Il cherche un **poste** dans une banque."] },
    { definition: 'un appareil de radio ou de télévision', phrases: ["Grand-père écoute le **poste** de radio.", "Le **poste** de télévision est allumé.", "Un vieux **poste** trône dans le salon."] },
  ]),
  polysemie(SIXIEME_T2, '6e', 'plan', [
    { definition: "un dessin d'une ville ou d'une maison", phrases: ["Nous cherchons la rue sur le **plan**.", "L'architecte dessine le **plan** de la maison.", "Léa regarde le **plan** du métro."] },
    { definition: "une surface plate", phrases: ["La bille roule sur un **plan** horizontal.", "Un **plan** incliné aide à monter la charge.", "La règle repose sur le **plan** de travail."] },
  ]),
];

// --- Sens figuré et expressions ----------------------------------------------------------------------------------------

export interface Expression extends Element {
  expression: string;
  /** Ce qu'elle veut dire : les sens de toutes les expressions d'une liste sont différents. */
  sens: string;
}

function expression(depuis: Stage, pour: Pour, texte: string, sens: string): Expression {
  return { depuis, pour, expression: texte, sens };
}

export const EXPRESSIONS: Expression[] = [
  // CE2.
  expression(CE2_T2, 'cycle2', 'avoir le cœur sur la main', 'être généreux'),
  expression(CE2_T2, 'cycle2', 'avoir un cœur de pierre', "ne pas avoir de pitié"),
  expression(CE2_T2, 'cycle2', 'avoir la tête dans les nuages', 'rêver sans écouter'),
  expression(CE2_T2, 'cycle2', "avoir un appétit d'oiseau", 'manger très peu'),
  expression(CE2_T2, 'cycle2', 'avoir les yeux plus gros que le ventre', "prendre plus qu'on ne peut manger"),
  expression(CE2_T2, 'cycle2', 'donner sa langue au chat', 'renoncer à deviner'),
  expression(CE2_T2, 'cycle2', 'il pleut des cordes', 'il pleut très fort'),
  expression(CE2_T2, 'cycle2', 'avoir la main verte', 'réussir très bien les plantes'),
  expression(CE2_T2, 'cycle2', 'tomber dans les pommes', "s'évanouir"),
  expression(CE2_T2, 'cycle2', 'poser un lapin', 'ne pas venir au rendez-vous'),
  expression(CE2_T2, 'cycle2', 'ne pas avoir froid aux yeux', 'être courageux'),
  expression(CE2_T2, 'cycle2', 'avoir du pain sur la planche', 'avoir beaucoup de travail'),
  expression(CE2_T2, 'cycle2', 'être au septième ciel', 'être très heureux'),
  expression(CE2_T2, 'cycle2', 'avoir le cafard', 'être triste'),
  expression(CE2_T2, 'cycle2', 'avoir une faim de loup', 'avoir très faim'),
  expression(CE2_T2, 'cycle2', 'rire aux éclats', 'rire très fort'),
  expression(CE2_T2, 'cycle2', 'dormir comme un loir', 'dormir très bien'),
  // 6e.
  expression(SIXIEME_T2, '6e', 'avoir un fil à la patte', 'être retenu par une obligation'),
  expression(SIXIEME_T2, '6e', 'tourner autour du pot', 'ne pas oser dire les choses'),
  expression(SIXIEME_T2, '6e', "jeter de l'huile sur le feu", 'aggraver une dispute'),
  expression(SIXIEME_T2, '6e', 'revenir à ses moutons', 'revenir au sujet'),
  expression(SIXIEME_T2, '6e', 'mettre la charrue avant les bœufs', 'faire les choses dans le mauvais ordre'),
  expression(SIXIEME_T2, '6e', 'avoir le bras long', "avoir de l'influence"),
  expression(SIXIEME_T2, '6e', 'prendre le taureau par les cornes', 'affronter une difficulté'),
  expression(SIXIEME_T2, '6e', 'appeler un chat un chat', 'dire les choses franchement'),
  expression(SIXIEME_T2, '6e', "ne pas être dans son assiette", 'se sentir mal'),
  expression(SIXIEME_T2, '6e', 'faire coup double', 'obtenir deux résultats en une fois'),
  expression(SIXIEME_T2, '6e', 'mener quelqu\'un par le bout du nez', "faire faire à quelqu'un ce qu'on veut"),
  expression(SIXIEME_T2, '6e', 'se mettre en quatre', 'faire tout son possible'),
  expression(SIXIEME_T2, '6e', 'tomber des nues', 'être très surpris'),
  expression(SIXIEME_T2, '6e', "passer l'éponge", 'pardonner'),
];

/** Des phrases sans aucune figure de style : on y dit simplement ce qui est. */
export const PHRASES_SANS_FIGURE: string[] = [
  'Le chat dort sur le canapé.',
  'Léa pose sa main sur la table.',
  'Papa ouvre la porte du garage.',
  'La pluie tombe sur le toit.',
  'Le chien mange sa pâtée.',
  'Paul range son cartable.',
  'Nous lisons un livre dans la classe.',
  'La neige recouvre la montagne.',
  'Un oiseau chante sur la branche.',
  'Maman prépare le repas.',
  'Le bateau quitte le port.',
  'Léa met son manteau rouge.',
  'Le facteur apporte une lettre.',
  'Mon frère court dans le jardin.',
  'Un nuage cache le soleil.',
  'La voiture roule sur la route.',
];

// --- Catégories et champs de mots ---------------------------------------------------------------------------------------

export interface GroupeDeMots extends Element {
  /** Son nom, avec l'article : « les fruits ». */
  nom: string;
  mots: string[];
}

function groupe(depuis: Stage, pour: Pour, nom: string, mots: string[]): GroupeDeMots {
  return { depuis, pour, nom, mots };
}

/**
 * Des catégories : les mots d'une catégorie en sont tous, aucun n'entre dans une autre (pas de « cheval »,
 * qui est aussi un moyen de transport, ni de « marron », qui est aussi un fruit, ni de « tomate », ni d'« orange »,
 * qui est aussi une couleur, ni de « rose », qui est aussi une fleur, ni de « kiwi », qui est aussi un oiseau).
 */
export const CATEGORIES: GroupeDeMots[] = [
  groupe(CE1_T2, 'cycle2', 'les animaux', ['chat', 'chien', 'lapin', 'vache', 'mouton', 'poule', 'canard', 'souris', 'tigre', 'lion', 'ours', 'singe', 'renard', 'cochon']),
  groupe(CE1_T2, 'cycle2', 'les fruits', ['pomme', 'poire', 'cerise', 'fraise', 'banane', 'raisin', 'prune', 'citron', 'abricot']),
  groupe(CE1_T2, 'cycle2', 'les légumes', ['carotte', 'poireau', 'chou', 'haricot', 'navet', 'radis', 'salade', 'épinard', 'betterave', 'brocoli']),
  groupe(CE1_T2, 'cycle2', 'les vêtements', ['pantalon', 'robe', 'chemise', 'manteau', 'pull', 'jupe', 'bonnet', 'écharpe', 'gant', 'chaussette']),
  groupe(CE1_T2, 'cycle2', 'les meubles', ['table', 'chaise', 'lit', 'armoire', 'bureau', 'canapé', 'fauteuil', 'étagère', 'commode']),
  groupe(CE1_T2, 'cycle2', 'les fournitures scolaires', ['crayon', 'gomme', 'règle', 'stylo', 'cahier', 'trousse', 'cartable', 'ciseaux', 'colle', 'feutre']),
  groupe(CE1_T2, 'cycle2', 'les moyens de transport', ['vélo', 'voiture', 'train', 'bateau', 'avion', 'bus', 'camion', 'moto', 'tramway']),
  groupe(CE1_T2, 'cycle2', 'les parties du corps', ['bras', 'jambe', 'tête', 'main', 'pied', 'genou', 'dos', 'oreille', 'nez', 'bouche']),
  groupe(CE1_T2, 'cycle2', 'les métiers', ['boulanger', 'médecin', 'maçon', 'pompier', 'facteur', 'pêcheur', 'cuisinier', 'jardinier', 'boucher', 'coiffeur']),
  groupe(CE1_T2, 'cycle2', 'les couleurs', ['rouge', 'bleu', 'vert', 'jaune', 'noir', 'violet', 'gris', 'blanc']),
  groupe(CE1_T2, 'cycle2', 'les instruments de musique', ['piano', 'guitare', 'tambour', 'trompette', 'violon', 'harpe', 'harmonica', 'xylophone']),
  groupe(CE1_T2, 'cycle2', 'les sports', ['football', 'tennis', 'judo', 'natation', 'handball', 'rugby', 'golf', 'boxe', 'ski']),
  groupe(CE1_T2, 'cycle2', 'les fleurs', ['tulipe', 'marguerite', 'muguet', 'pâquerette', 'coquelicot', 'tournesol', 'jonquille']),
  groupe(CE1_T2, 'cycle2', 'les boissons', ['eau', 'lait', 'jus', 'thé', 'café', 'limonade', 'sirop', 'soda']),
];

/**
 * Des thèmes : les mots qu'on emploie quand on parle d'une même chose. Aucun mot n'est dans deux thèmes,
 * et aucun n'irait dans un autre (pas de « pelle » à la plage et au jardin, de « gâteau » à la fête et à la cuisine,
 * de « ski » ni de « randonnée » à la montagne, qui sont aussi des sports, de « ballon », qui est aussi à la fête,
 * de « spectacle », qui est aussi à la fête).
 */
export const THEMES: GroupeDeMots[] = [
  groupe(CE1_T3, 'cycle2', 'la mer', ['plage', 'vague', 'sable', 'bateau', 'coquillage', 'marin', 'phare', 'crabe']),
  groupe(CE1_T3, 'cycle2', "l'école", ['cahier', 'classe', 'cartable', 'crayon', 'élève', 'tableau', 'dictée', 'trousse', 'leçon', 'récréation']),
  groupe(CE1_T3, 'cycle2', 'la ferme', ['vache', 'tracteur', 'grange', 'poule', 'foin', 'cochon', 'fermier', 'étable']),
  groupe(CE1_T3, 'cycle2', 'le jardin', ['fleur', 'râteau', 'tondeuse', 'arrosoir', 'bêche', 'haie', 'pelouse', 'jardinier']),
  groupe(CE1_T3, 'cycle2', 'la cuisine', ['four', 'poêle', 'casserole', 'cuillère', 'assiette', 'évier', 'recette', 'tablier']),
  groupe(CE1_T3, 'cycle2', 'la montagne', ['neige', 'marmotte', 'sommet', 'vallée', 'glacier', 'torrent', 'chalet', 'alpiniste']),
  groupe(CE1_T3, 'cycle2', 'la ville', ['rue', 'magasin', 'trottoir', 'bus', 'immeuble', 'avenue', 'passant', 'mairie']),
  groupe(CE1_T3, 'cycle2', 'le cirque', ['clown', 'chapiteau', 'trapèze', 'jongleur', 'acrobate', 'funambule', 'dompteur', 'piste']),
  groupe(CE1_T3, 'cycle2', 'le sport', ['maillot', 'équipe', 'arbitre', 'stade', 'match', 'terrain', 'coureur', 'médaille']),
  groupe(CE1_T3, 'cycle2', 'la fête', ['bougie', 'cadeau', 'invité', 'musique', 'danse', 'guirlande', 'confettis', 'anniversaire']),
];

/**
 * Les champs lexicaux de la 6e : plus de mots, des mots plus rares. Aucun mot n'est d'un champ voisin non plus : pas
 * de « gare » ni de « hôtel » (la ville), de « billet » (le concert), de « escale » ni de « navire » (la mer), de
 * « note » ni de « chorale » (le collège), de « éclair » ni de « mousse » (la pâtisserie), de « bulletin » (la météo),
 * de « carnet » ni de « contrôle » (le voyage).
 */
export const CHAMPS_LEXICAUX: GroupeDeMots[] = [
  groupe(SIXIEME_T2, '6e', 'la mer', ['marée', 'phare', 'falaise', 'galet', 'baleine', 'océan', 'écume', 'récif', 'rivage', 'vague']),
  groupe(SIXIEME_T2, '6e', 'la forêt', ['arbre', 'feuillage', 'clairière', 'sentier', 'sapin', 'branche', 'écureuil', 'chêne', 'fougère']),
  groupe(SIXIEME_T2, '6e', 'la météo', ['pluie', 'orage', 'nuage', 'verglas', 'tonnerre', 'brouillard', 'averse', 'grêle', 'rafale']),
  groupe(SIXIEME_T2, '6e', 'le collège', ['professeur', 'classe', 'cartable', 'devoir', 'interrogation', 'récréation', 'surveillant', 'casier', 'cour']),
  groupe(SIXIEME_T2, '6e', 'la cuisine', ['four', 'casserole', 'recette', 'ingrédient', 'farine', 'cuisson', 'mijoter', 'éplucher', 'marmite']),
  groupe(SIXIEME_T2, '6e', 'le voyage', ['valise', 'passeport', 'visa', 'douane', 'touriste', 'séjour', 'bagage', 'itinéraire', 'destination', 'excursion']),
  groupe(SIXIEME_T2, '6e', 'la musique', ['instrument', 'mélodie', 'rythme', 'orchestre', 'concert', 'refrain', 'partition', 'chanteur']),
  groupe(SIXIEME_T2, '6e', 'le sport', ['équipe', 'arbitre', 'stade', 'match', 'compétition', 'championnat', 'victoire', 'médaille']),
  groupe(SIXIEME_T2, '6e', 'la peur', ['frayeur', 'trembler', 'cauchemar', 'angoisse', 'fuir', 'effroi', 'frisson', 'terreur']),
  groupe(SIXIEME_T2, '6e', 'la ville', ['circulation', 'trottoir', 'immeuble', 'avenue', 'passant', 'boulevard', 'quartier', 'carrefour']),
];

// --- Registres de langue -----------------------------------------------------------------------------------------------------

export interface PaireDeRegistres extends Element {
  /** Le mot du registre étudié : familier ou soutenu. */
  mot: string;
  /** Le mot du langage courant qui veut dire la même chose. */
  courant: string;
}

function registre(depuis: Stage, mot: string, courant: string): PaireDeRegistres {
  return { depuis, pour: '6e', mot, courant };
}

export const FAMILIERS: PaireDeRegistres[] = [
  registre(SIXIEME_T2, 'bagnole', 'voiture'),
  registre(SIXIEME_T2, 'bouquin', 'livre'),
  registre(SIXIEME_T2, 'gosse', 'enfant'),
  registre(SIXIEME_T2, 'boulot', 'travail'),
  registre(SIXIEME_T2, 'pote', 'ami'),
  registre(SIXIEME_T2, 'fric', 'argent'),
  registre(SIXIEME_T2, 'flic', 'policier'),
  registre(SIXIEME_T2, 'bouffer', 'manger'),
  registre(SIXIEME_T2, 'rigoler', 'rire'),
  registre(SIXIEME_T2, 'toubib', 'médecin'),
  registre(SIXIEME_T2, 'resto', 'restaurant'),
  registre(SIXIEME_T2, 'fringues', 'vêtements'),
  registre(SIXIEME_T2, 'bosser', 'travailler'),
  registre(SIXIEME_T2, 'piger', 'comprendre'),
  registre(SIXIEME_T2, 'baraque', 'maison'),
];

export const SOUTENUS: PaireDeRegistres[] = [
  registre(SIXIEME_T2, 'demeure', 'maison'),
  registre(SIXIEME_T2, 'labeur', 'travail'),
  registre(SIXIEME_T2, 'se hâter', 'se dépêcher'),
  registre(SIXIEME_T2, 'époux', 'mari'),
  registre(SIXIEME_T2, 'chevelure', 'cheveux'),
  registre(SIXIEME_T2, 'se vêtir', "s'habiller"),
  registre(SIXIEME_T2, 'aïeul', 'grand-père'),
  registre(SIXIEME_T2, 'courroux', 'colère'),
];

// --- Étymologie : les racines latines et grecques ----------------------------------------------------------------

export interface Racine extends Element {
  racine: string;
  /** Ce qu'elle veut dire, au même format pour toutes : « l'eau », « la vie », « petit ». */
  sens: string;
  /** Des mots où on la trouve. */
  mots: string[];
}

function racine(depuis: Stage, forme: string, sens: string, mots: string[]): Racine {
  return { depuis, pour: '6e', racine: forme, sens, mots };
}

export const RACINES: Racine[] = [
  racine(SIXIEME_T2, 'aqua', "l'eau", ['aquatique', 'aquarium']),
  racine(SIXIEME_T2, 'terra', 'la terre', ['terrestre', 'territoire']),
  racine(SIXIEME_T2, 'vita', 'la vie', ['vital', 'vitamine']),
  racine(SIXIEME_T2, 'manus', 'la main', ['manuel', 'manuscrit']),
  racine(SIXIEME_T2, 'pes', 'le pied', ['pédestre', 'pédale']),
  racine(SIXIEME_T2, 'dens', 'la dent', ['dentiste', 'dentaire']),
  racine(SIXIEME_T2, 'cor', 'le cœur', ['cordial', 'cordialement']),
  racine(SIXIEME_T2, 'aer', "l'air", ['aérien', 'aération']),
  racine(SIXIEME_T2, 'sol', 'le soleil', ['solaire', 'solarium']),
  racine(SIXIEME_T2, 'luna', 'la lune', ['lunaire', 'lunatique']),
  racine(SIXIEME_T2, 'bio', 'la vie', ['biologie', 'biographie']),
  racine(SIXIEME_T2, 'géo', 'la terre', ['géographie', 'géologie']),
  racine(SIXIEME_T2, 'logie', "l'étude", ['biologie', 'zoologie']),
  racine(SIXIEME_T2, 'graphe', 'écrire', ['photographe', 'autographe']),
  racine(SIXIEME_T2, 'phobie', 'la peur', ['arachnophobie', 'hydrophobie']),
  racine(SIXIEME_T2, 'scope', 'observer', ['microscope', 'télescope']),
  racine(SIXIEME_T2, 'phone', 'le son', ['téléphone', 'microphone']),
  racine(SIXIEME_T2, 'télé', 'loin', ['télévision', 'téléphone']),
  racine(SIXIEME_T2, 'micro', 'petit', ['microscope', 'microbe']),
  racine(SIXIEME_T2, 'hydro', "l'eau", ['hydravion', 'hydrater']),
  racine(SIXIEME_T2, 'aéro', "l'air", ['aéroport', 'aérodrome']),
  racine(SIXIEME_T2, 'chrono', 'le temps', ['chronomètre', 'chronologie']),
  racine(SIXIEME_T2, 'philo', 'aimer', ['philosophie', 'philanthrope']),
  racine(SIXIEME_T2, 'poly', 'nombreux', ['polygone', 'polyglotte']),
  racine(SIXIEME_T2, 'mono', 'seul', ['monocycle', 'monotone']),
  racine(SIXIEME_T2, 'pan', 'tout', ['panorama', 'panthéon']),
  racine(SIXIEME_T2, 'auto', 'soi-même', ['automobile', 'autographe']),
  racine(SIXIEME_T2, 'thermo', 'la chaleur', ['thermomètre', 'thermos']),
];

// --- Figures de style ---------------------------------------------------------------------------------------------------------

export const COMPARAISONS = [
  "Il est rapide comme l'éclair.",
  'Elle est blanche comme la neige.',
  'Tu es têtu comme une mule.',
  'Ses joues sont rouges comme des pommes.',
  'Cette pierre est dure comme du fer.',
  'Le bébé est doux comme un agneau.',
  'Mon frère est fort comme un lion.',
  'Elle est légère comme une plume.',
  'Il est malin comme un singe.',
  'Elle est bavarde comme une pie.',
  'Le gâteau est léger comme un nuage.',
  'La nuit est noire comme du charbon.',
];

export const METAPHORES = [
  'Cet homme est un lion.',
  'La lune est une lanterne dans la nuit.',
  'Ses yeux sont des étoiles.',
  'Cette chambre est une porcherie.',
  'Ma tête est un tambour.',
  'La neige est un tapis blanc.',
  'La nuit est un manteau noir.',
  'Cette ville est une fourmilière.',
  'Léa est un rayon de soleil.',
  'Mon frère est une tortue.',
  'La mer est un miroir.',
  'La vie est un long fleuve.',
];

export const PERSONNIFICATIONS = [
  'La lune sourit aux enfants.',
  'Le vent chante une chanson.',
  'Les fleurs dorment sous la neige.',
  'La forêt retient son souffle.',
  'Le soleil bavarde avec les nuages.',
  'La mer se fâche contre les rochers.',
  'Les étoiles veillent sur le village.',
  'La pluie frappe à la fenêtre.',
  'La maison dort dans la nuit.',
  'Le vieux chêne nous regarde passer.',
  'Les nuages se promènent dans le ciel.',
  'La montagne veille sur la vallée.',
];

// --- Emprunts -------------------------------------------------------------------------------------------------------------------------

/** Des mots dont l'origine ne se discute pas : un mot dont l'histoire passe par deux langues n'y figure pas. */
export const EMPRUNTS: Record<'arabe' | 'italien' | 'anglais', string[]> = {
  arabe: ['algèbre', 'zéro', 'chiffre', 'gazelle', 'safran', 'alcool', 'sirop', 'hasard'],
  italien: ['piano', 'opéra', 'balcon', 'carnaval', 'spaghetti', 'pizza', 'violon', 'concert', 'banque', 'million'],
  anglais: ['football', 'sandwich', 'clown', 'tunnel', 'basket', 'pull', 'film', 'rugby', 'tram'],
};

// --- L'ordre alphabétique -----------------------------------------------------------------------------------------------------

/**
 * Des mots du CE1 et du CE2 pour ranger dans l'ordre alphabétique. Aucune lettre accentuée parmi les trois
 * premières : « école » et « éléphant » n'ont pas de place sûre dans l'ordre du dictionnaire d'un enfant.
 */
export const MOTS_A_RANGER = [
  'abeille', 'arbre', 'avion', 'assiette', 'ananas', 'ardoise', 'arrosoir', 'amande', 'argent', 'armoire',
  'ballon', 'bateau', 'bonbon', 'bougie', 'banane', 'barrière', 'bonnet', 'bouteille', 'brosse', 'bureau', 'bol', 'botte', 'bague', 'bras', 'bruit', 'bretelle',
  'chat', 'chien', 'cheval', 'cerise', 'cartable', 'cahier', 'canard', 'carotte', 'chaise', 'ciseaux', 'classe', 'cochon', 'crayon', 'cuillère', 'cabane', 'cadeau', 'cage', 'chou', 'coq', 'corde', 'coude', 'colle',
  'dent', 'dessin', 'doigt', 'dragon', 'drapeau', 'dauphin', 'domino', 'danse',
  'eau', 'enfant', 'encre', 'escargot', 'escalier',
  'fleur', 'fraise', 'fenêtre', 'fourmi', 'fromage', 'feuille', 'fusée', 'ferme', 'fille', 'famille', 'farine', 'fanfare', 'femme',
  'girafe', 'gomme', 'grenouille', 'guitare', 'gant', 'glace', 'grand', 'goutte', 'grotte',
  'hibou', 'hiver', 'herbe', 'histoire', 'harpe',
  'image', 'insecte', 'igloo',
  'jardin', 'jambon', 'jupe', 'jouet', 'jaune', 'jambe', 'journal',
  'kiwi', 'koala', 'kangourou',
  'lune', 'lapin', 'livre', 'lion', 'lampe', 'lait', 'lit', 'lunettes', 'langue', 'loup', 'lavabo', 'lilas',
  'maison', 'mouton', 'montagne', 'mer', 'marteau', 'miroir', 'moto', 'musique', 'mouche', 'melon', 'manteau', 'masque', 'main',
  'nuage', 'neige', 'nez', 'noix', 'nid', 'navire', 'nuit', 'nombre', 'nappe',
  'orange', 'oiseau', 'ours', 'oreille', 'ongle', 'ombre', 'olive', 'oie',
  'pomme', 'poire', 'poisson', 'porte', 'pantalon', 'papillon', 'plage', 'plume', 'pain', 'parc', 'puzzle', 'piano', 'pied', 'pirate', 'poule', 'poche', 'pont', 'panier', 'peigne', 'pelle', 'perle', 'peau', 'pente',
  'quille', 'quatre',
  'robe', 'rose', 'renard', 'rivière', 'roue', 'ruche', 'rue', 'raisin', 'roi',
  'soleil', 'sac', 'singe', 'salade', 'savon', 'sapin', 'serpent', 'souris', 'sable', 'stylo', 'sirop', 'sofa', 'sorcière',
  'table', 'tigre', 'tortue', 'train', 'tomate', 'tapis', 'toit', 'tulipe', 'tambour', 'trousse', 'tarte', 'taxi', 'tonneau', 'tour',
  'usine',
  'vache', 'voiture', 'valise', 'vent', 'violon', 'verre', 'village', 'vague', 'vase', 'visage', 'vigne',
  'wagon',
  'xylophone',
  'yaourt', 'yoyo',
  'zoo', 'zone',
];

/** Des mots de la 6e qui commencent par les mêmes lettres : l'ordre se joue au quatrième ou au cinquième. */
export const FAMILLES_ALPHABETIQUES_6E: string[][] = [
  ['cartable', 'carte', 'carton', 'cartouche', 'cartographe'],
  ['porte', 'portail', 'porter', 'portrait', 'portefeuille', 'portion'],
  ['montagne', 'montre', 'monter', 'montant', 'montage'],
  ['terre', 'terrain', 'terrasse', 'terrier', 'terrible', 'terrine'],
  ['jardin', 'jardinier', 'jardiner', 'jardinage'],
  ['plan', 'planche', 'plante', 'plancher', 'planter'],
  ['chanson', 'chanter', 'chanteur', 'chantier', 'chance', 'changer', 'chandail'],
  ['marche', 'marchand', 'marin', 'marque', 'marteau', 'marron'],
  ['cour', 'courage', 'courant', 'courir', 'course', 'court', 'couronne'],
  ['forme', 'fort', 'forge', 'formule', 'fortune', 'formation'],
  ['proche', 'prochain', 'produit', 'profond', 'projet', 'promenade'],
  ['lundi', 'lune', 'lunettes', 'lunaire'],
  ['ouvrir', 'ouvrier', 'ouvert', 'ouverture'],
  ['chat', 'chaud', 'chaise', 'chapeau', 'chaussure', 'chambre', 'champ'],
];

// --- Le dictionnaire -----------------------------------------------------------------------------------------------------------------

export const ABREVIATIONS_DU_DICTIONNAIRE: [string, string][] = [
  ['n. m.', 'nom masculin'],
  ['n. f.', 'nom féminin'],
  ['adj.', 'adjectif'],
  ['v.', 'verbe'],
  ['adv.', 'adverbe'],
  ['prép.', 'préposition'],
  ['pl.', 'pluriel'],
  ['fam.', 'familier'],
  ['conj.', 'conjonction'],
  ['pron.', 'pronom'],
];
