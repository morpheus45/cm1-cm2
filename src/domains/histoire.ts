import type { Level, Question, Trimester } from '../types';
import type { Figure, Shape } from '../lib/figures';
import { rngInt, rngPick, rngShuffle, type Rng } from '../lib/seededRandom';
import { assemble, choose, drawer, isEligible, type Draft, type WrittenItem } from './histoireGeographie';

/**
 * L'histoire au CM1 et au CM2.
 *
 * CM1 — programme publié au BO n° 22 du 28 mai 2026, en vigueur au CM1 dès la
 * rentrée 2026 :
 * - 1er trimestre : la vie quotidienne au Moyen Âge (XIe-XIIIe siècles) ;
 * - 2e trimestre : la monarchie en France (XVIe-XVIIe siècles) : François Ier,
 *   Henri IV, Louis XIV, la société d'ordres ;
 * - 3e trimestre : explorations et conquêtes par les Européens (XVe-XVIIe
 *   siècles), puis 1789, une année révolutionnaire.
 *
 * CM2 — programme de 2020, que le CM2 garde en 2026-2027 (le nouveau
 * programme n'y entre qu'à la rentrée 2027) :
 * - 1er trimestre : le temps de la République ;
 * - 2e trimestre : l'âge industriel en France ;
 * - 3e trimestre : la France, des guerres mondiales à l'Union européenne.
 */

type HistoryDomain = 'chronologie' | 'evenements' | 'mots-histoire';

/** Un repère daté : de quoi fabriquer des questions de dates, de siècles et
 *  de frises. */
interface Repere {
  level: Level;
  trimester: Trimester;
  year: number;
  label: string;
}

export const REPERES: Repere[] = [
  { level: 'CM1', trimester: 1, year: 476, label: 'la fin de l\'Empire romain d\'Occident, début du Moyen Âge' },
  { level: 'CM1', trimester: 1, year: 1163, label: 'le début de la construction de Notre-Dame de Paris' },
  { level: 'CM1', trimester: 2, year: 1515, label: 'le début du règne de François Ier' },
  { level: 'CM1', trimester: 2, year: 1598, label: 'l\'édit de Nantes' },
  { level: 'CM1', trimester: 2, year: 1610, label: 'l\'assassinat d\'Henri IV' },
  { level: 'CM1', trimester: 2, year: 1643, label: 'le début du règne de Louis XIV' },
  { level: 'CM1', trimester: 2, year: 1682, label: 'l\'installation de la cour à Versailles' },
  { level: 'CM1', trimester: 2, year: 1715, label: 'la mort de Louis XIV' },
  { level: 'CM1', trimester: 3, year: 1492, label: 'l\'arrivée de Christophe Colomb en Amérique' },
  { level: 'CM1', trimester: 3, year: 1498, label: 'l\'arrivée de Vasco de Gama en Inde par la mer' },
  { level: 'CM1', trimester: 3, year: 1522, label: 'le retour du premier tour du monde, l\'expédition de Magellan' },
  { level: 'CM1', trimester: 3, year: 1534, label: 'le premier voyage de Jacques Cartier au Canada' },
  { level: 'CM1', trimester: 3, year: 1685, label: 'le Code noir' },
  { level: 'CM1', trimester: 3, year: 1789, label: 'la prise de la Bastille' },
  { level: 'CM2', trimester: 1, year: 1792, label: 'la proclamation de la Ire République' },
  { level: 'CM2', trimester: 1, year: 1848, label: 'le suffrage universel masculin et l\'abolition de l\'esclavage' },
  { level: 'CM2', trimester: 1, year: 1870, label: 'la proclamation de la IIIe République' },
  { level: 'CM2', trimester: 1, year: 1882, label: 'l\'école gratuite, laïque et obligatoire (lois Ferry)' },
  { level: 'CM2', trimester: 1, year: 1905, label: 'la loi de séparation des Églises et de l\'État' },
  { level: 'CM2', trimester: 1, year: 1944, label: 'le droit de vote accordé aux femmes' },
  { level: 'CM2', trimester: 2, year: 1837, label: 'la première ligne de chemin de fer au départ de Paris' },
  { level: 'CM2', trimester: 2, year: 1841, label: 'la première loi limitant le travail des enfants' },
  { level: 'CM2', trimester: 2, year: 1884, label: 'l\'autorisation des syndicats' },
  { level: 'CM2', trimester: 2, year: 1889, label: 'la construction de la tour Eiffel' },
  { level: 'CM2', trimester: 3, year: 1914, label: 'le début de la Première Guerre mondiale' },
  { level: 'CM2', trimester: 3, year: 1916, label: 'la bataille de Verdun' },
  { level: 'CM2', trimester: 3, year: 1918, label: 'l\'armistice du 11 novembre' },
  { level: 'CM2', trimester: 3, year: 1939, label: 'le début de la Seconde Guerre mondiale' },
  { level: 'CM2', trimester: 3, year: 1940, label: 'l\'appel du 18 juin du général de Gaulle' },
  { level: 'CM2', trimester: 3, year: 1945, label: 'la fin de la Seconde Guerre mondiale en Europe' },
  { level: 'CM2', trimester: 3, year: 1957, label: 'le traité de Rome, début de la construction européenne' },
  { level: 'CM2', trimester: 3, year: 2002, label: 'l\'arrivée des pièces et des billets en euros' },
];

const item = (
  level: Level,
  trimester: Trimester,
  prompt: string,
  correct: string,
  wrong: string[],
  explanation?: string
): WrittenItem => ({ level, trimester, prompt, correct, wrong: wrong.filter((entry) => entry !== correct), explanation });

export const ITEMS: Record<HistoryDomain, WrittenItem[]> = {
  chronologie: [
    // CM1 — le Moyen Âge.
    item('CM1', 1, 'Le Moyen Âge commence en 476. Quand se termine-t-il ?', 'en 1492', ['en 1789', 'en 1000', 'en 1515'], 'Le Moyen Âge va de 476 à 1492 : environ mille ans.'),
    item('CM1', 1, 'Combien de temps dure un siècle ?', '100 ans', ['10 ans', '1 000 ans', '50 ans'], 'Un siècle dure cent ans.'),
    item('CM1', 1, 'Le Moyen Âge dure environ :', 'mille ans', ['cent ans', 'dix ans', 'deux mille ans'], 'De 476 à 1492 : un peu plus de mille ans.'),
    item('CM1', 1, 'Quelles années forment le XIe siècle ?', 'de 1001 à 1100', ['de 1000 à 1099', 'de 1101 à 1200', 'de 1201 à 1300'], 'Le XIe siècle commence en 1001 et se termine en 1100.'),
    item('CM1', 1, 'Quelles années forment le XIIIe siècle ?', 'de 1201 à 1300', ['de 1300 à 1399', 'de 1101 à 1200', 'de 1301 à 1400'], 'Le XIIIe siècle commence en 1201 et se termine en 1300.'),
    item('CM1', 1, 'L\'an 1000 appartient au :', 'Xe siècle', ['XIe siècle', 'Ier siècle', 'XXe siècle'], 'Le Xe siècle va de 901 à 1000 : l\'an 1000 en est la dernière année.'),
    item('CM1', 1, 'Quel style d\'église apparaît en premier ?', 'l\'art roman', ['l\'art gothique', 'l\'art de la Renaissance', 'l\'art moderne'], 'L\'art roman (XIe-XIIe siècles) précède l\'art gothique, qui apparaît au XIIe siècle.'),
    // CM1 — la monarchie.
    item('CM1', 2, 'Dans quel ordre ces rois ont-ils régné ?', 'François Ier, Henri IV, Louis XIV', ['Henri IV, François Ier, Louis XIV', 'Louis XIV, Henri IV, François Ier', 'François Ier, Louis XIV, Henri IV'], 'François Ier (1515-1547), Henri IV (1589-1610), puis Louis XIV (1643-1715).'),
    item('CM1', 2, 'Louis XIV règne de 1643 à 1715. Pendant combien de temps environ ?', '72 ans', ['17 ans', '43 ans', '115 ans'], '1715 − 1643 = 72 : c\'est le plus long règne de l\'histoire de France.'),
    item('CM1', 2, 'Les guerres de religion ont lieu :', 'au XVIe siècle', ['au XIIe siècle', 'au XVIIIe siècle', 'au XXe siècle'], 'Elles opposent catholiques et protestants de 1562 à 1598.'),
    item('CM1', 2, 'François Ier, Henri IV et Louis XIV ont régné :', 'aux XVIe et XVIIe siècles', ['au Moyen Âge', 'au XIXe siècle', 'pendant l\'Antiquité'], 'Leurs règnes vont de 1515 à 1715.'),
    // CM1 — explorations et 1789.
    item('CM1', 3, 'Quelles années forment le XVe siècle ?', 'de 1401 à 1500', ['de 1501 à 1600', 'de 1500 à 1599', 'de 1301 à 1400'], 'Le XVe siècle commence en 1401 et se termine en 1500 : 1492 en fait partie.'),
    item('CM1', 3, 'Dans quel ordre ces événements de 1789 se sont-ils produits ?', 'États généraux, prise de la Bastille, Déclaration des droits de l\'homme', ['prise de la Bastille, États généraux, Déclaration des droits de l\'homme', 'Déclaration des droits de l\'homme, États généraux, prise de la Bastille', 'États généraux, Déclaration des droits de l\'homme, prise de la Bastille'], 'États généraux le 5 mai, prise de la Bastille le 14 juillet, Déclaration le 26 août 1789.'),
    item('CM1', 3, 'L\'année 1789 appartient au :', 'XVIIIe siècle', ['XVIIe siècle', 'XIXe siècle', 'XVIe siècle'], 'Le XVIIIe siècle va de 1701 à 1800.'),
    // CM2 — la République.
    item('CM2', 1, 'En 1892, la République fête ses cent ans. En quelle année a-t-elle été proclamée pour la première fois ?', '1792', ['1789', '1848', '1870'], 'La Ire République est proclamée en septembre 1792.'),
    item('CM2', 1, 'Les femmes votent pour la première fois en France en 1945. Les hommes, eux, ont tous le droit de vote depuis :', '1848', ['1945', '1789', '1905'], 'Le suffrage universel masculin date de 1848 ; les femmes obtiennent le droit de vote en 1944.'),
    item('CM2', 1, 'Combien d\'années séparent le droit de vote de tous les hommes (1848) et celui des femmes (1944) ?', '96 ans', ['50 ans', '100 ans', '12 ans'], '1944 − 1848 = 96 ans.'),
    // CM2 — l'âge industriel.
    item('CM2', 2, 'L\'âge industriel en France, c\'est surtout :', 'le XIXe siècle', ['le XVIe siècle', 'le XIIe siècle', 'le XXIe siècle'], 'Machines, usines et chemins de fer se développent au XIXe siècle.'),
    item('CM2', 2, 'La tour Eiffel est construite pour l\'Exposition universelle de :', '1889', ['1789', '1918', '1945'], 'Elle est inaugurée en 1889, cent ans après la Révolution.'),
    // CM2 — guerres mondiales et Europe.
    item('CM2', 3, 'Combien de temps dure la Première Guerre mondiale ?', '4 ans, de 1914 à 1918', ['1 an, en 1914', '10 ans, de 1908 à 1918', '6 ans, de 1939 à 1945'], 'Elle commence en 1914 et s\'achève avec l\'armistice du 11 novembre 1918.'),
    item('CM2', 3, 'La Seconde Guerre mondiale se déroule :', 'de 1939 à 1945', ['de 1914 à 1918', 'de 1870 à 1871', 'de 1789 à 1799'], 'Elle commence en 1939 et se termine en 1945.'),
    item('CM2', 3, 'Combien d\'années séparent la fin des deux guerres mondiales ?', '27 ans', ['10 ans', '50 ans', '4 ans'], '1945 − 1918 = 27 ans.'),
  ],
  evenements: [
    // CM1 — le Moyen Âge.
    item('CM1', 1, 'Au Moyen Âge, qui vit dans le château fort ?', 'le seigneur et sa famille', ['les paysans du village', 'les moines', 'les marchands de la ville'], 'Le château fort est la demeure du seigneur, qui y vit avec sa famille et ses chevaliers.'),
    item('CM1', 1, 'Que doivent les paysans à leur seigneur ?', 'des corvées et des taxes', ['rien du tout', 'un salaire', 'des leçons d\'écriture'], 'Ils travaillent gratuitement sur ses terres (la corvée) et lui paient des taxes.'),
    item('CM1', 1, 'Que donnent les paysans à l\'Église ?', 'la dîme, une part de leurs récoltes', ['la corvée, leur travail gratuit', 'leur maison', 'un château'], 'La dîme, environ un dixième des récoltes, est donnée à l\'Église.'),
    item('CM1', 1, 'Qui prie et travaille dans une abbaye ?', 'des moines', ['des chevaliers', 'des seigneurs', 'des marchands'], 'Les moines vivent dans l\'abbaye : ils prient, travaillent et recopient des livres.'),
    item('CM1', 1, 'À quoi sert le donjon d\'un château fort ?', 'à se défendre et à loger le seigneur', ['à moudre le grain', 'à vendre au marché', 'à rendre la justice du roi'], 'Le donjon est la tour principale : le logis du seigneur et le dernier refuge en cas d\'attaque.'),
    item('CM1', 1, 'Que trouve-t-on dans une ville du Moyen Âge ?', 'des marchés, des foires et des artisans', ['des usines et des gares', 'des supermarchés', 'des aéroports'], 'Les villes sont des lieux d\'échanges : marchés, foires, ateliers d\'artisans.'),
    item('CM1', 1, 'Qui combat à cheval pour son seigneur ?', 'le chevalier', ['le moine', 'le paysan', 'le marchand'], 'Le chevalier est un guerrier qui combat à cheval.'),
    item('CM1', 1, 'À quelle saison les paysans font-ils les moissons ?', 'en été', ['en hiver', 'au printemps', 'à l\'automne'], 'Les céréales sont récoltées en été ; les vendanges ont lieu à l\'automne.'),
    item('CM1', 1, 'Quelle cathédrale gothique commence-t-on à construire à Paris en 1163 ?', 'Notre-Dame de Paris', ['la tour Eiffel', 'le château de Versailles', 'le Mont-Saint-Michel'], 'La construction de Notre-Dame de Paris commence en 1163.'),
    item('CM1', 1, 'Qui dirige la paroisse et dit la messe au village ?', 'le curé', ['le seigneur', 'le chevalier', 'le marchand'], 'Le curé est le prêtre de la paroisse.'),
    item('CM1', 1, 'Au Moyen Âge, où se réfugient les paysans en cas d\'attaque ?', 'dans le château du seigneur', ['dans la forêt', 'dans une autre ville', 'au port'], 'Le seigneur doit protéger les habitants de sa seigneurie : ils se mettent à l\'abri derrière ses murailles.'),
    item('CM1', 1, 'Que fabriquent les moines copistes ?', 'des livres recopiés à la main', ['des épées', 'des vitraux', 'des pièces de monnaie'], 'Avant l\'imprimerie, les livres étaient recopiés à la main, souvent dans les abbayes.'),
    item('CM1', 1, 'Que se passe-t-il lors d\'une foire au Moyen Âge ?', 'des marchands venus de loin vendent et achètent', ['les chevaliers s\'entraînent', 'les moines prient', 'le roi est couronné'], 'Les foires, comme celles de Champagne, attirent des marchands de toute l\'Europe.'),
    item('CM1', 1, 'Qui construit les cathédrales ?', 'des artisans : tailleurs de pierre, charpentiers, verriers', ['les chevaliers', 'les moines copistes', 'les seigneurs eux-mêmes'], 'Des centaines d\'artisans travaillent pendant des dizaines d\'années.'),
    // CM1 — la monarchie.
    item('CM1', 2, 'Quel roi de France accueille Léonard de Vinci ?', 'François Ier', ['Henri IV', 'Louis XIV', 'Louis XVI'], 'François Ier invite Léonard de Vinci en France en 1516.'),
    item('CM1', 2, 'Quel roi signe l\'édit de Nantes en 1598 ?', 'Henri IV', ['François Ier', 'Louis XIV', 'Louis XVI'], 'Henri IV signe l\'édit de Nantes, qui met fin aux guerres de religion.'),
    item('CM1', 2, 'Que permet l\'édit de Nantes ?', 'aux protestants de pratiquer leur religion', ['aux paysans de ne plus payer d\'impôts', 'aux femmes de voter', 'au roi de conquérir l\'Amérique'], 'Il accorde aux protestants la liberté de culte dans certains lieux et met fin aux guerres de religion.'),
    item('CM1', 2, 'Quel roi installe sa cour dans un immense château à Versailles ?', 'Louis XIV', ['François Ier', 'Henri IV', 'Charlemagne'], 'Louis XIV agrandit le château de Versailles et y installe la cour en 1682.'),
    item('CM1', 2, 'Quel surnom donne-t-on à Louis XIV ?', 'le Roi-Soleil', ['le Roi chevalier', 'le Bien-Aimé', 'Cœur de Lion'], 'Louis XIV a choisi le Soleil comme emblème.'),
    item('CM1', 2, 'Qui s\'opposent pendant les guerres de religion ?', 'les catholiques et les protestants', ['les Français et les Anglais', 'les paysans et les seigneurs', 'les Gaulois et les Romains'], 'Au XVIe siècle, catholiques et protestants s\'affrontent en France.'),
    item('CM1', 2, 'Quel roi est assassiné en 1610 ?', 'Henri IV', ['François Ier', 'Louis XIV', 'Louis XVI'], 'Henri IV est assassiné à Paris en 1610.'),
    item('CM1', 2, 'François Ier fait construire un célèbre château de la Loire. Lequel ?', 'Chambord', ['Versailles', 'le Louvre de Louis XIV', 'le donjon de Vincennes'], 'Le château de Chambord est commencé en 1519, sous François Ier.'),
    // CM1 — explorations et conquêtes.
    item('CM1', 3, 'Qui atteint l\'Amérique en 1492 ?', 'Christophe Colomb', ['Magellan', 'Jacques Cartier', 'Vasco de Gama'], 'Christophe Colomb, au service des rois d\'Espagne, atteint les Antilles en 1492.'),
    item('CM1', 3, 'Quelle expédition réalise le premier tour du monde ?', 'celle de Magellan', ['celle de Christophe Colomb', 'celle de Jacques Cartier', 'celle de Marco Polo'], 'Partie en 1519, elle revient en 1522 ; Magellan meurt en route, aux Philippines.'),
    item('CM1', 3, 'Quel navigateur explore le Canada pour François Ier en 1534 ?', 'Jacques Cartier', ['Christophe Colomb', 'Magellan', 'Vasco de Gama'], 'Jacques Cartier remonte le fleuve Saint-Laurent.'),
    item('CM1', 3, 'Sur quels bateaux naviguent les grands explorateurs du XVe siècle ?', 'des caravelles', ['des paquebots', 'des sous-marins', 'des péniches'], 'La caravelle est un navire léger, rapide, capable de remonter le vent.'),
    item('CM1', 3, 'Quels peuples d\'Amérique sont conquis par les Espagnols au XVIe siècle ?', 'les Aztèques et les Incas', ['les Gaulois et les Francs', 'les Vikings', 'les Grecs et les Romains'], 'Cortès conquiert l\'Empire aztèque, Pizarro l\'Empire inca.'),
    item('CM1', 3, 'Qu\'est-ce que la traite atlantique ?', 'le commerce d\'Africains réduits en esclavage vers l\'Amérique', ['un voyage d\'exploration vers l\'Inde', 'le commerce des épices en Europe', 'une course de bateaux'], 'Des millions d\'Africains sont déportés et réduits en esclavage dans les colonies d\'Amérique.'),
    item('CM1', 3, 'Que fixe le Code noir de 1685 ?', 'les règles de l\'esclavage dans les colonies françaises', ['la liberté des protestants', 'les droits des citoyens', 'les règles des chevaliers'], 'Le Code noir, signé sous Louis XIV, traite les esclaves comme des biens.'),
    // CM1 — 1789.
    item('CM1', 3, 'Quel roi réunit les États généraux en 1789 ?', 'Louis XVI', ['Louis XIV', 'Henri IV', 'François Ier'], 'Louis XVI convoque les États généraux à Versailles, le 5 mai 1789.'),
    item('CM1', 3, 'Que se passe-t-il à Paris le 14 juillet 1789 ?', 'la prise de la Bastille', ['le sacre du roi', 'la fin d\'une guerre', 'la construction de Versailles'], 'Le peuple de Paris s\'empare de la Bastille, une prison royale.'),
    item('CM1', 3, 'Que proclame la Déclaration des droits de l\'homme et du citoyen ?', 'Les hommes naissent et demeurent libres et égaux en droits.', ['Le roi a tous les pouvoirs.', 'Les nobles ne paient pas d\'impôts.', 'Seuls les riches ont des droits.'], 'C\'est le premier article de la Déclaration du 26 août 1789.'),
    item('CM1', 3, 'Qu\'est-il décidé dans la nuit du 4 août 1789 ?', 'l\'abolition des privilèges', ['la prise de la Bastille', 'le départ du roi pour Versailles', 'la découverte de l\'Amérique'], 'Les députés abolissent les privilèges de la noblesse et du clergé.'),
    item('CM1', 3, 'En octobre 1789, qui marche de Paris jusqu\'à Versailles ?', 'des femmes de Paris', ['des soldats anglais', 'des moines', 'des explorateurs'], 'Les 5 et 6 octobre 1789, des Parisiennes marchent sur Versailles et ramènent le roi à Paris.'),
    item('CM1', 3, 'Que jurent les députés au Jeu de paume, en juin 1789 ?', 'de donner une Constitution à la France', ['d\'obéir au roi en tout', 'de partir explorer l\'Amérique', 'de rétablir les privilèges'], 'Le 20 juin 1789, ils jurent de ne pas se séparer avant d\'avoir écrit une Constitution.'),
    // CM2 — la République.
    item('CM2', 1, 'Quel ministre rend l\'école gratuite, laïque et obligatoire ?', 'Jules Ferry', ['Victor Hugo', 'Napoléon Bonaparte', 'Louis XIV'], 'Les lois Jules Ferry de 1881 et 1882 organisent l\'école primaire.'),
    item('CM2', 1, 'Depuis les lois Ferry, l\'école primaire est :', 'gratuite, laïque et obligatoire', ['payante et réservée aux garçons', 'religieuse et facultative', 'réservée aux enfants des villes'], 'Tous les enfants de 6 à 13 ans doivent aller à l\'école, gratuitement.'),
    item('CM2', 1, 'En quelle année les femmes obtiennent-elles le droit de vote en France ?', '1944', ['1789', '1848', '1905'], 'Le droit de vote est accordé aux femmes en 1944 ; elles votent pour la première fois en 1945.'),
    item('CM2', 1, 'En 1848, qui obtient le droit de vote ?', 'tous les hommes de plus de 21 ans', ['toutes les femmes', 'seulement les nobles', 'les enfants'], 'C\'est le suffrage universel masculin.'),
    item('CM2', 1, 'Qui fait abolir l\'esclavage dans les colonies françaises en 1848 ?', 'Victor Schœlcher', ['Jules Ferry', 'Louis XIV', 'Christophe Colomb'], 'Le décret d\'abolition est signé le 27 avril 1848.'),
    item('CM2', 1, 'Que décide la loi de 1905 ?', 'la séparation des Églises et de l\'État', ['l\'école obligatoire', 'le droit de vote des femmes', 'la fin de l\'esclavage'], 'L\'État ne reconnaît ni ne finance aucune religion, et garantit la liberté de croire ou de ne pas croire.'),
    item('CM2', 1, 'Quels sont des symboles de la République française ?', 'Marianne, le drapeau tricolore et La Marseillaise', ['la fleur de lys et la couronne', 'le Soleil et Versailles', 'l\'aigle et l\'épée'], 'Ce sont les symboles de la République.'),
    item('CM2', 1, 'Quelle est la devise de la République française ?', 'Liberté, Égalité, Fraternité', ['Unie dans la diversité', 'Paix et Prospérité', 'Un pour tous, tous pour un'], 'Elle est inscrite sur les mairies et les écoles.'),
    item('CM2', 1, 'Quelle scientifique reçoit deux prix Nobel, en 1903 et en 1911 ?', 'Marie Curie', ['Olympe de Gouges', 'Jeanne d\'Arc', 'George Sand'], 'Marie Curie est la première femme à recevoir un prix Nobel, puis la seule à en recevoir deux dans deux sciences différentes.'),
    item('CM2', 1, 'Que célèbre-t-on le 14 juillet, fête nationale depuis 1880 ?', 'la prise de la Bastille et la fête de la Fédération', ['la fin de la Première Guerre mondiale', 'la naissance de Louis XIV', 'le droit de vote des femmes'], 'Le 14 juillet rappelle 1789 et la fête de la Fédération de 1790.'),
    item('CM2', 1, 'Qui était Olympe de Gouges ?', 'une révolutionnaire qui a réclamé les mêmes droits pour les femmes', ['une reine de France', 'une scientifique du XXe siècle', 'une exploratrice'], 'En 1791, elle écrit la Déclaration des droits de la femme et de la citoyenne.'),
    item('CM2', 1, 'Avec les lois Ferry, jusqu\'à quel âge l\'instruction est-elle obligatoire ?', '13 ans', ['6 ans', '10 ans', '18 ans'], 'En 1882, l\'instruction devient obligatoire de 6 à 13 ans.'),
    // CM2 — l'âge industriel.
    item('CM2', 2, 'Avec quelle énergie fonctionnent les machines à vapeur ?', 'le charbon', ['le soleil', 'le vent', 'l\'électricité des éoliennes'], 'On brûle du charbon pour chauffer l\'eau et produire la vapeur.'),
    item('CM2', 2, 'Où travaillent les mineurs ?', 'au fond des mines de charbon', ['dans les grands magasins', 'dans les champs', 'sur les bateaux'], 'Ils extraient le charbon, dans des conditions très dures et dangereuses.'),
    item('CM2', 2, 'Quel nouveau moyen de transport se développe au XIXe siècle ?', 'le chemin de fer', ['l\'avion à réaction', 'la fusée', 'le TGV'], 'Les premières lignes de chemin de fer apparaissent en France dans les années 1830.'),
    item('CM2', 2, 'Qu\'est-ce qu\'un grand magasin, comme le Bon Marché à Paris ?', 'un magasin où l\'on vend de tout, sur plusieurs étages', ['une usine de charbon', 'une ferme', 'une mine'], 'Les grands magasins apparaissent au XIXe siècle, dans les villes.'),
    item('CM2', 2, 'Au XIXe siècle, des enfants :', 'travaillent dans les usines et les mines', ['ne travaillent jamais', 'vont tous au collège', 'votent aux élections'], 'Une première loi limite le travail des enfants en 1841.'),
    item('CM2', 2, 'Pourquoi de nombreux paysans partent-ils vivre en ville au XIXe siècle ?', 'pour trouver du travail dans les usines', ['pour partir en vacances', 'pour aller au collège', 'pour devenir seigneurs'], 'C\'est l\'exode rural.'),
    item('CM2', 2, 'Quel monument en fer est construit à Paris pour l\'Exposition universelle de 1889 ?', 'la tour Eiffel', ['Notre-Dame', 'l\'Arc de triomphe', 'le château de Versailles'], 'Gustave Eiffel la construit en fer puddlé, symbole de l\'âge industriel.'),
    // CM2 — guerres mondiales et Europe.
    item('CM2', 3, 'Où vivent et combattent les soldats de 1914-1918 ?', 'dans des tranchées', ['dans des châteaux forts', 'sur des caravelles', 'dans des grands magasins'], 'Les tranchées sont des fossés creusés dans la terre, face à l\'ennemi.'),
    item('CM2', 3, 'Quelle bataille de 1916 reste un symbole de la Grande Guerre ?', 'Verdun', ['Marignan', 'Alésia', 'Waterloo'], 'La bataille de Verdun dure presque toute l\'année 1916.'),
    item('CM2', 3, 'Que rappelle le 11 novembre ?', 'l\'armistice de 1918, la fin de la Première Guerre mondiale', ['la prise de la Bastille', 'la fin de la Seconde Guerre mondiale', 'l\'arrivée de l\'euro'], 'Le 11 novembre 1918, les combats cessent.'),
    item('CM2', 3, 'Qui lance un appel à continuer le combat depuis Londres, le 18 juin 1940 ?', 'le général de Gaulle', ['Jules Ferry', 'Louis XIV', 'Victor Hugo'], 'Le général de Gaulle appelle les Français à poursuivre la lutte.'),
    item('CM2', 3, 'Que se passe-t-il le 6 juin 1944 ?', 'le débarquement des Alliés en Normandie', ['l\'armistice de 1918', 'la prise de la Bastille', 'le traité de Rome'], 'Les Alliés débarquent sur les plages normandes : c\'est le début de la libération de la France.'),
    item('CM2', 3, 'Que rappelle le 8 mai ?', 'la victoire de 1945 et la fin de la guerre en Europe', ['l\'armistice de 1918', 'la naissance de la République', 'la création de l\'euro'], 'Le 8 mai 1945, l\'Allemagne nazie capitule.'),
    item('CM2', 3, 'Qu\'est-ce que la Shoah ?', 'le génocide des Juifs d\'Europe par les nazis', ['une bataille de 1916', 'un traité européen', 'une loi sur l\'école'], 'Pendant la Seconde Guerre mondiale, près de six millions de Juifs sont assassinés.'),
    item('CM2', 3, 'Combien de pays fondent la Communauté européenne en 1957, par le traité de Rome ?', '6', ['2', '12', '27'], 'La France, l\'Allemagne de l\'Ouest, l\'Italie, la Belgique, les Pays-Bas et le Luxembourg.'),
    item('CM2', 3, 'Quelle monnaie utilise-t-on en France depuis 2002 ?', 'l\'euro', ['le franc', 'le dollar', 'la livre'], 'Les pièces et les billets en euros arrivent le 1er janvier 2002.'),
    item('CM2', 3, 'Combien de pays compte l\'Union européenne aujourd\'hui ?', '27', ['6', '12', '50'], 'Depuis le départ du Royaume-Uni en 2020, l\'Union européenne compte 27 pays.'),
  ],
  'mots-histoire': [
    // CM1 — le Moyen Âge.
    item('CM1', 1, 'Comment appelle-t-on le territoire dominé par un seigneur ?', 'une seigneurie', ['une paroisse', 'une colonie', 'une république'], 'La seigneurie, ce sont les terres du seigneur et les hommes qui y vivent.'),
    item('CM1', 1, 'La corvée, c\'est :', 'le travail gratuit des paysans pour le seigneur', ['une part des récoltes donnée à l\'Église', 'une fête au château', 'un voyage en bateau'], 'Les paysans doivent travailler gratuitement sur les terres du seigneur.'),
    item('CM1', 1, 'La dîme, c\'est :', 'la part des récoltes donnée à l\'Église', ['le travail gratuit pour le seigneur', 'la plus haute tour du château', 'un marché'], 'Environ un dixième des récoltes.'),
    item('CM1', 1, 'Une paroisse, c\'est :', 'le territoire qui dépend d\'une église et de son curé', ['le domaine d\'un seigneur', 'une ville fortifiée', 'une abbaye de moines'], 'Au Moyen Âge, chaque village forme une paroisse autour de son église.'),
    item('CM1', 1, 'Le clergé, ce sont :', 'les hommes et les femmes d\'Église', ['les chevaliers', 'les paysans', 'les marchands'], 'Prêtres, moines, moniales, évêques forment le clergé.'),
    item('CM1', 1, 'Une abbaye est :', 'un monastère où vivent des moines ou des moniales', ['le château du seigneur', 'une place de marché', 'une ferme'], 'L\'abbaye est dirigée par un abbé ou une abbesse.'),
    item('CM1', 1, 'Une cathédrale est :', 'l\'église de l\'évêque, dans une ville', ['la chapelle d\'un château', 'la maison du curé', 'un moulin'], 'La cathédrale est la grande église où siège l\'évêque.'),
    item('CM1', 1, 'Qu\'est-ce qui caractérise l\'art gothique ?', 'des voûtes très hautes et de grands vitraux', ['des murs épais et de petites fenêtres', 'des toits plats en béton', 'des murs de verre et d\'acier'], 'Grâce aux arcs-boutants, les églises gothiques s\'élèvent et laissent entrer la lumière.'),
    item('CM1', 1, 'Qu\'est-ce qui caractérise l\'art roman ?', 'des murs épais et de petites fenêtres', ['des voûtes très hautes et de grands vitraux', 'des murs de verre et d\'acier', 'des toits plats'], 'Les églises romanes sont massives et plutôt sombres.'),
    item('CM1', 1, 'Un seigneur est :', 'un noble qui domine une seigneurie', ['un paysan libre', 'un moine', 'un marchand ambulant'], 'Il protège les habitants de sa seigneurie et exige d\'eux des redevances.'),
    item('CM1', 1, 'Un château fort est :', 'une demeure fortifiée où vit le seigneur', ['une grande église', 'une ferme de paysans', 'un marché couvert'], 'Murailles, tours, fossés et donjon le protègent des attaques.'),
    item('CM1', 1, 'Un moine est :', 'un homme qui consacre sa vie à Dieu, dans un monastère', ['un guerrier à cheval', 'un paysan', 'un marchand'], 'Les moines prient, travaillent et étudient dans les abbayes.'),
    item('CM1', 1, 'Un artisan est :', 'une personne qui fabrique des objets de ses mains', ['un seigneur', 'un moine', 'un chevalier'], 'Forgerons, potiers, tisserands, cordonniers sont des artisans.'),
    item('CM1', 1, 'Un vitrail est :', 'une fenêtre faite de morceaux de verre colorés', ['une tour de château', 'un livre recopié', 'un outil de paysan'], 'Les cathédrales gothiques sont célèbres pour leurs grands vitraux.'),
    // CM1 — la monarchie.
    item('CM1', 2, 'Une monarchie absolue, c\'est :', 'un régime où le roi détient tous les pouvoirs', ['un régime où le peuple vote les lois', 'un pays sans roi', 'une assemblée de seigneurs'], 'Louis XIV fait les lois, rend la justice, décide de la guerre et de la paix.'),
    item('CM1', 2, 'Un mécène est quelqu\'un qui :', 'protège et finance des artistes', ['construit des cathédrales de ses mains', 'dirige une armée', 'soigne les malades'], 'François Ier est un roi mécène.'),
    item('CM1', 2, 'Les protestants sont :', 'des chrétiens qui suivent la Réforme, séparés de l\'Église catholique', ['des soldats du roi', 'des explorateurs', 'des paysans révoltés'], 'Au XVIe siècle, la Réforme divise les chrétiens d\'Europe.'),
    item('CM1', 2, 'La société d\'ordres est divisée en :', 'clergé, noblesse et tiers état', ['rois, reines et princes', 'paysans, ouvriers et patrons', 'citoyens, élus et ministres'], 'Chacun appartient à l\'un des trois ordres.'),
    item('CM1', 2, 'Qui appartient au tiers état ?', 'les paysans, les artisans et les bourgeois', ['les évêques et les moines', 'les nobles et les chevaliers', 'le roi et sa famille'], 'Le tiers état regroupe tous ceux qui ne sont ni nobles ni membres du clergé.'),
    item('CM1', 2, 'La Renaissance est :', 'un renouveau des arts et des sciences', ['une guerre contre l\'Angleterre', 'la construction des châteaux forts', 'la fin de l\'esclavage'], 'Née en Italie, elle gagne la France au XVIe siècle.'),
    item('CM1', 2, 'Un privilège, c\'est :', 'un avantage réservé à certains, comme les nobles', ['un impôt payé par tous', 'une loi votée par le peuple', 'une fête religieuse'], 'Les nobles et le clergé ne paient pas certains impôts : ce sont des privilèges.'),
    item('CM1', 2, 'La noblesse, ce sont :', 'les nobles, qui ont des privilèges', ['les paysans', 'les hommes d\'Église', 'les marchands'], 'La noblesse est le deuxième ordre de la société.'),
    // CM1 — explorations, 1789.
    item('CM1', 3, 'Une colonie est :', 'un territoire conquis et dominé par un pays lointain', ['une région de France', 'un bateau d\'exploration', 'un marché africain'], 'Espagne, Portugal, puis France et Angleterre fondent des colonies en Amérique.'),
    item('CM1', 3, 'Un esclave est :', 'une personne privée de liberté, qui appartient à un maître', ['un soldat du roi', 'un paysan libre', 'un marchand'], 'Les esclaves sont achetés, vendus et forcés de travailler.'),
    item('CM1', 3, 'Les cahiers de doléances sont :', 'des cahiers où les Français écrivent leurs plaintes et leurs souhaits', ['les livres de comptes du roi', 'des cahiers d\'écolier', 'des cartes de navigation'], 'Ils sont rédigés au printemps 1789, avant les États généraux.'),
    item('CM1', 3, 'Un citoyen est :', 'une personne qui a des droits et participe à la vie du pays', ['un sujet qui obéit au roi sans avoir de droits', 'un habitant de la campagne', 'un soldat étranger'], 'Avec la Révolution, les sujets du roi deviennent des citoyens.'),
    item('CM1', 3, 'Une Constitution est :', 'le texte qui organise les pouvoirs et garantit les droits', ['une prison royale', 'un impôt', 'un château'], 'Les députés veulent donner une Constitution à la France.'),
    item('CM1', 3, 'Les Lumières sont :', 'des penseurs du XVIIIe siècle qui défendent la raison et la liberté', ['les lampes du château de Versailles', 'des navigateurs', 'des moines du Moyen Âge'], 'Voltaire, Rousseau, Diderot, Montesquieu : leurs idées inspirent la Révolution.'),
    item('CM1', 3, 'L\'Ancien Régime désigne :', 'la France des rois, avant la Révolution', ['la France après 1789', 'l\'Empire romain', 'la préhistoire'], 'Le mot est employé à partir de 1789 pour désigner l\'organisation d\'avant.'),
    item('CM1', 3, 'La Bastille était :', 'une prison royale à Paris', ['le château du roi à Versailles', 'une cathédrale', 'un port'], 'Elle symbolisait le pouvoir du roi d\'enfermer sans jugement.'),
    // CM2 — la République.
    item('CM2', 1, 'Une république est :', 'un régime où les citoyens élisent leurs représentants', ['un régime où le roi a tous les pouvoirs', 'un empire dirigé par un empereur', 'une seigneurie'], 'En république, le pouvoir vient des citoyens, par le vote.'),
    item('CM2', 1, 'Le suffrage universel, c\'est :', 'le droit de vote pour tous les citoyens', ['le vote réservé aux riches', 'le choix du roi par les nobles', 'une fête républicaine'], 'D\'abord pour les hommes en 1848, pour tous depuis 1944.'),
    item('CM2', 1, 'Une école laïque est :', 'une école neutre, sans enseignement religieux, ouverte à tous', ['une école réservée aux garçons', 'une école payante', 'une école dans une abbaye'], 'L\'école publique respecte les croyances de chacun.'),
    item('CM2', 1, 'Qu\'est-ce que La Marseillaise ?', 'l\'hymne national de la France', ['la devise de la République', 'une bataille', 'un journal'], 'Composée en 1792, elle devient l\'hymne national en 1879.'),
    item('CM2', 1, 'Une suffragette est :', 'une femme qui lutte pour le droit de vote des femmes', ['une chanteuse d\'opéra', 'une ouvrière de la mine', 'une reine'], 'Les suffragettes réclament le droit de vote pour les femmes.'),
    item('CM2', 1, 'Le suffrage universel masculin, c\'est :', 'le droit de vote pour tous les hommes', ['le droit de vote pour les riches seulement', 'le droit de vote pour les femmes seulement', 'le choix du roi'], 'Il est établi en 1848.'),
    item('CM2', 1, 'Voter, c\'est :', 'choisir ses représentants lors d\'une élection', ['payer un impôt', 'faire la guerre', 'aller à l\'école'], 'Chaque citoyen donne sa voix en secret, dans l\'isoloir.'),
    item('CM2', 1, 'Un député est :', 'un élu qui vote les lois à l\'Assemblée nationale', ['un soldat', 'un maire de village', 'un juge'], 'Les députés sont élus par les citoyens.'),
    item('CM2', 1, 'La laïcité, c\'est :', 'la séparation des religions et de l\'État, et la liberté de croire ou de ne pas croire', ['l\'obligation d\'avoir une religion', 'une fête religieuse', 'l\'interdiction de toutes les religions'], 'Elle est inscrite dans la loi de 1905.'),
    item('CM2', 1, 'Marianne est :', 'un symbole de la République française', ['une reine de France', 'une scientifique', 'une résistante'], 'Son buste se trouve dans les mairies.'),
    item('CM2', 1, 'Abolir l\'esclavage, c\'est :', 'le supprimer : plus personne ne peut être esclave', ['le rendre obligatoire', 'le réserver aux colonies', 'le rendre payant'], 'En France, l\'esclavage est aboli définitivement en 1848.'),
    item('CM2', 1, 'Une élection est :', 'un vote pour choisir des représentants', ['une fête nationale', 'un défilé militaire', 'une loi'], 'On élit le maire, les députés, le président de la République.'),
    item('CM2', 1, 'Un hymne national est :', 'un chant qui représente un pays', ['un drapeau', 'une devise', 'une fête'], 'L\'hymne national de la France est La Marseillaise.'),
    item('CM2', 1, 'L\'Assemblée nationale est :', 'le lieu où les députés débattent et votent les lois', ['le palais du roi', 'une école', 'un tribunal'], 'Elle siège au palais Bourbon, à Paris.'),
    // CM2 — l'âge industriel.
    item('CM2', 2, 'Qu\'appelle-t-on la révolution industrielle ?', 'l\'essor des machines et des usines', ['la prise de la Bastille', 'la fin de la monarchie', 'la découverte de l\'Amérique'], 'Au XIXe siècle, les machines transforment le travail et la vie.'),
    item('CM2', 2, 'Un ouvrier est :', 'une personne qui travaille dans une usine ou un atelier', ['un propriétaire de mine', 'un paysan du Moyen Âge', 'un noble'], 'Les ouvriers sont payés à la journée ou à la tâche.'),
    item('CM2', 2, 'Un syndicat est :', 'une association qui défend les droits des travailleurs', ['une usine', 'une banque', 'un grand magasin'], 'Les syndicats sont autorisés en France en 1884.'),
    item('CM2', 2, 'L\'exode rural, c\'est :', 'le départ des habitants des campagnes vers les villes', ['le départ des citadins vers la campagne', 'un voyage en Amérique', 'une grève'], 'Au XIXe siècle, beaucoup de paysans quittent les campagnes pour les villes.'),
    item('CM2', 2, 'Une grève, c\'est :', 'l\'arrêt du travail décidé par des travailleurs pour se faire entendre', ['une fête à l\'usine', 'une nouvelle machine', 'un impôt'], 'Le droit de grève est reconnu en France en 1864.'),
    // CM2 — guerres mondiales et Europe.
    item('CM2', 3, 'Un armistice est :', 'un accord pour arrêter les combats', ['une bataille', 'une arme', 'un défilé militaire'], 'L\'armistice du 11 novembre 1918 met fin aux combats de la Grande Guerre.'),
    item('CM2', 3, 'Un poilu est :', 'un soldat français de la Première Guerre mondiale', ['un paysan du Moyen Âge', 'un résistant de 1944', 'un chevalier'], 'On surnomme ainsi les soldats français de 1914-1918.'),
    item('CM2', 3, 'Une tranchée est :', 'un fossé creusé où s\'abritent les soldats', ['un bateau de guerre', 'un avion', 'une ville fortifiée'], 'Les tranchées de 1914-1918 s\'étendent sur des centaines de kilomètres.'),
    item('CM2', 3, 'La Résistance, ce sont :', 'les femmes et les hommes qui luttent contre l\'occupant allemand', ['les soldats de Louis XIV', 'les ouvriers en grève', 'les députés de 1789'], 'Jean Moulin, Lucie Aubrac, et bien d\'autres, risquent leur vie.'),
    item('CM2', 3, 'L\'Union européenne est :', 'une association de pays européens qui coopèrent', ['un seul pays avec un roi', 'une armée', 'une monnaie seulement'], 'Ses pays membres décident ensemble de nombreuses règles communes.'),
    item('CM2', 3, 'Une guerre mondiale est :', 'une guerre qui touche de nombreux pays, sur plusieurs continents', ['une guerre entre deux villages', 'une guerre au Moyen Âge', 'une guerre sans soldats'], 'Au XXe siècle, deux guerres mondiales ravagent le monde.'),
    item('CM2', 3, 'Un génocide est :', 'l\'extermination volontaire d\'un peuple', ['une bataille gagnée', 'un traité de paix', 'une migration'], 'La Shoah est le génocide des Juifs d\'Europe.'),
  ],
};

// --- Les questions fabriquées à partir des repères --------------------------------

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export function roman(value: number): string {
  let rest = value;
  let text = '';
  for (const [amount, letters] of ROMAN) {
    while (rest >= amount) {
      text += letters;
      rest -= amount;
    }
  }
  return text;
}

export const centuryOf = (year: number) => Math.floor((year - 1) / 100) + 1;
export const centuryLabel = (century: number) => `${roman(century)}e siècle`.replace(/^Ie siècle$/, 'Ier siècle');

function centuryQuestion(rng: Rng, repere: Repere): Draft {
  const century = centuryOf(repere.year);
  // L'erreur classique : lire le siècle dans les deux premiers chiffres.
  const firstDigits = Math.floor(repere.year / 100);
  const wrong = [century - 1, century + 1, firstDigits, century + 2].filter((value) => value > 0).map(centuryLabel);
  return {
    key: `siecle-${repere.year}`,
    instruction: 'Un siècle, c\'est cent ans : le XVIe siècle va de 1501 à 1600',
    prompt: `En quel siècle a eu lieu ${repere.label} (${repere.year}) ?`,
    ...choose(rng, centuryLabel(century), wrong),
    explanation: `${repere.year} appartient au ${centuryLabel(century)}, qui va de ${(century - 1) * 100 + 1} à ${century * 100}.`,
  };
}

function dateQuestion(rng: Rng, repere: Repere, pool: Repere[]): Draft {
  const others = pool.filter((entry) => entry.year !== repere.year).map((entry) => String(entry.year));
  return {
    key: `date-${repere.year}-${repere.label}`,
    prompt: `En quelle année a eu lieu ${repere.label} ?`,
    ...choose(rng, String(repere.year), others),
    explanation: `C\'était en ${repere.year}.`,
  };
}

/** Les repères deux à deux assez éloignés dans le temps pour qu'on ne puisse
 *  pas les confondre. */
function spreadOut(rng: Rng, pool: Repere[], howMany: number, minGap: number): Repere[] | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const picked = rngShuffle(rng, pool).slice(0, howMany);
    const years = picked.map((entry) => entry.year).sort((a, b) => a - b);
    if (picked.length === howMany && years.every((year, index) => index === 0 || year - years[index - 1] >= minGap)) return picked;
  }
  return null;
}

function orderQuestion(rng: Rng, pool: Repere[]): Draft | null {
  const picked = spreadOut(rng, pool, 4, 5);
  if (!picked) return null;
  const first = [...picked].sort((a, b) => a.year - b.year)[0];
  return {
    key: `ordre-${picked.map((entry) => entry.year).join('-')}`,
    prompt: 'Lequel de ces événements a eu lieu en premier ?',
    ...choose(rng, first.label, picked.filter((entry) => entry !== first).map((entry) => entry.label)),
    explanation: picked
      .sort((a, b) => a.year - b.year)
      .map((entry) => `${entry.year} : ${entry.label}`)
      .join(' ; ') + '.',
  };
}

/** Une frise chronologique : quatre repères, marqués A, B, C, D sans suivre
 *  l'ordre du temps. */
export function timelineFigure(reperes: Repere[], letters: string[]): Figure {
  const years = reperes.map((entry) => entry.year);
  const start = Math.floor((Math.min(...years) - 20) / 50) * 50;
  const end = Math.ceil((Math.max(...years) + 20) / 50) * 50;
  const [left, right, y] = [20, 280, 78];
  const x = (year: number) => left + ((year - start) / (end - start)) * (right - left);
  const shapes: Shape[] = [
    { kind: 'segment', from: [left, y], to: [right, y], width: 4 },
    { kind: 'polyline', points: [[right - 10, y - 7], [right + 2, y], [right - 10, y + 7]], width: 4 },
  ];
  const step = end - start > 400 ? 200 : end - start > 150 ? 100 : 50;
  for (let year = Math.ceil(start / step) * step; year <= end; year += step) {
    shapes.push({ kind: 'segment', from: [x(year), y - 6], to: [x(year), y + 6], width: 2 });
    shapes.push({ kind: 'text', at: [x(year), y + 26], text: String(year), anchor: 'middle', size: 13, ink: 'pale' });
  }
  reperes.forEach((entry, index) => {
    shapes.push({ kind: 'circle', center: [x(entry.year), y], radius: 5, fill: true, ink: 'couleur' });
    shapes.push({ kind: 'text', at: [x(entry.year), y - 16], text: letters[index], anchor: 'middle', bold: true, size: 17 });
  });
  return { width: 300, height: 120, shapes, alt: 'Une frise chronologique graduée, avec quatre repères nommés A, B, C et D.' };
}

function timelineQuestion(rng: Rng, pool: Repere[]): Draft | null {
  // Au moins 8 % de la frise entre deux repères : les lettres ne se touchent
  // pas.
  const years = pool.map((entry) => entry.year);
  const span = Math.max(...years) - Math.min(...years);
  const picked = spreadOut(rng, pool, 4, Math.max(5, Math.round(span * 0.08)));
  if (!picked) return null;
  const letters = rngShuffle(rng, ['A', 'B', 'C', 'D']);
  const asked = rngPick(rng, picked);
  const answer = letters[picked.indexOf(asked)];
  return {
    key: `frise-${picked.map((entry) => entry.year).join('-')}-${asked.year}`,
    instruction: 'Lis les graduations de la frise',
    prompt: `Quelle lettre marque ${asked.label} (${asked.year}) ?`,
    figure: timelineFigure(picked, letters),
    choices: ['A', 'B', 'C', 'D'],
    correctIndex: ['A', 'B', 'C', 'D'].indexOf(answer),
    explanation: `${asked.year} se place à la lettre ${answer}.`,
  };
}

/** Les années travaillées à chaque trimestre : celles des thèmes étudiés. */
const CENTURY_RANGES: Record<Level, Record<Trimester, [number, number]>> = {
  CM1: { 1: [1001, 1300], 2: [1501, 1700], 3: [1401, 1800] },
  CM2: { 1: [1789, 1950], 2: [1801, 1900], 3: [1901, 2020] },
};

/** « En quel siècle se trouve l'année 1150 ? » : une année prise au hasard
 *  dans la période étudiée. */
function centuryDrill(rng: Rng, [from, to]: [number, number]): Draft {
  const year = rngInt(rng, from, to);
  const century = centuryOf(year);
  const firstDigits = Math.floor(year / 100);
  const wrong = [century - 1, century + 1, firstDigits, century + 2].filter((value) => value > 0).map(centuryLabel);
  return {
    key: `annee-${year}`,
    instruction: 'Un siècle, c\'est cent ans : le XIIe siècle va de 1101 à 1200',
    prompt: `En quel siècle se trouve l'année ${year} ?`,
    ...choose(rng, centuryLabel(century), wrong),
    explanation: `${year} appartient au ${centuryLabel(century)}, qui va de ${(century - 1) * 100 + 1} à ${century * 100}.`,
  };
}

/** Des questions fabriquées à partir des repères d'une liste. */
function repereMakers(rng: Rng, pool: Repere[], everything: Repere[]): (() => Draft)[] {
  if (pool.length === 0) return [];
  const makers: (() => Draft)[] = [
    () => centuryQuestion(rng, rngPick(rng, pool)),
  ];
  if (everything.length >= 4) makers.push(() => dateQuestion(rng, rngPick(rng, pool), everything));
  if (everything.length >= 4) {
    makers.push(() => orderQuestion(rng, everything) ?? centuryQuestion(rng, rngPick(rng, pool)));
    makers.push(() => timelineQuestion(rng, everything) ?? centuryQuestion(rng, rngPick(rng, pool)));
  }
  return makers;
}

function generateFor(domain: HistoryDomain) {
  return (level: Level, trimester: Trimester, rng: Rng, count: number): Question[] => {
    const items = ITEMS[domain].filter((entry) => isEligible(entry, level, trimester));
    const current = items.filter((entry) => entry.trimester === trimester);
    const review = items.filter((entry) => entry.trimester < trimester);
    const currentMakers = current.length > 0 ? [drawer(rng, current)] : [];
    const reviewMakers = review.length > 0 ? [drawer(rng, review)] : [];
    if (domain === 'chronologie') {
      const reperes = REPERES.filter((entry) => isEligible(entry, level, trimester));
      const recent = reperes.filter((entry) => entry.trimester === trimester);
      currentMakers.push(...repereMakers(rng, recent, reperes), () => centuryDrill(rng, CENTURY_RANGES[level][trimester]));
      reviewMakers.push(...repereMakers(rng, reperes.filter((entry) => entry.trimester < trimester), reperes));
    }
    return assemble(domain, rng, count, trimester, currentMakers, reviewMakers);
  };
}

export const generateChronologie = generateFor('chronologie');
export const generateEvenements = generateFor('evenements');
export const generateMotsHistoire = generateFor('mots-histoire');
