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
  { level: 'CM1', trimester: 1, year: 476, label: 'le début du Moyen Âge' },
  { level: 'CM1', trimester: 1, year: 1163, label: 'le début du chantier de Notre-Dame de Paris' },
  { level: 'CM1', trimester: 2, year: 1515, label: 'le début du règne de François Ier' },
  { level: 'CM1', trimester: 2, year: 1598, label: 'l\'édit de Nantes' },
  { level: 'CM1', trimester: 2, year: 1610, label: 'l\'assassinat d\'Henri IV' },
  { level: 'CM1', trimester: 2, year: 1643, label: 'le début du règne de Louis XIV' },
  { level: 'CM1', trimester: 2, year: 1682, label: 'l\'arrivée de la cour à Versailles' },
  { level: 'CM1', trimester: 2, year: 1715, label: 'la mort de Louis XIV' },
  { level: 'CM1', trimester: 3, year: 1492, label: 'l\'arrivée de Christophe Colomb en Amérique' },
  { level: 'CM1', trimester: 3, year: 1498, label: 'le voyage de Vasco de Gama jusqu\'en Inde' },
  { level: 'CM1', trimester: 3, year: 1522, label: 'le retour du premier tour du monde en bateau' },
  { level: 'CM1', trimester: 3, year: 1534, label: 'le premier voyage de Jacques Cartier au Canada' },
  { level: 'CM1', trimester: 3, year: 1685, label: 'le Code noir' },
  { level: 'CM1', trimester: 3, year: 1789, label: 'la prise de la Bastille' },
  { level: 'CM2', trimester: 1, year: 1792, label: 'la naissance de la Ire République' },
  { level: 'CM2', trimester: 1, year: 1848, label: 'le vote de tous les hommes et la fin de l\'esclavage' },
  { level: 'CM2', trimester: 1, year: 1870, label: 'la naissance de la IIIe République' },
  { level: 'CM2', trimester: 1, year: 1882, label: 'les lois de Jules Ferry sur l\'école' },
  { level: 'CM2', trimester: 1, year: 1905, label: 'la loi qui sépare les Églises et l\'État' },
  { level: 'CM2', trimester: 1, year: 1944, label: 'le droit de vote des femmes' },
  { level: 'CM2', trimester: 2, year: 1837, label: 'le premier train au départ de Paris' },
  { level: 'CM2', trimester: 2, year: 1841, label: 'la première loi qui limite le travail des enfants' },
  { level: 'CM2', trimester: 2, year: 1884, label: 'le droit de créer des syndicats' },
  { level: 'CM2', trimester: 2, year: 1889, label: 'l\'ouverture de la tour Eiffel' },
  { level: 'CM2', trimester: 3, year: 1914, label: 'le début de la Première Guerre mondiale' },
  { level: 'CM2', trimester: 3, year: 1916, label: 'la bataille de Verdun' },
  { level: 'CM2', trimester: 3, year: 1918, label: 'l\'armistice du 11 novembre' },
  { level: 'CM2', trimester: 3, year: 1939, label: 'le début de la Seconde Guerre mondiale' },
  { level: 'CM2', trimester: 3, year: 1940, label: 'l\'appel du 18 juin du général de Gaulle' },
  { level: 'CM2', trimester: 3, year: 1945, label: 'la fin de la Seconde Guerre mondiale en Europe' },
  { level: 'CM2', trimester: 3, year: 1957, label: 'le traité de Rome, qui unit six pays d\'Europe' },
  { level: 'CM2', trimester: 3, year: 2002, label: 'l\'arrivée des pièces et des billets en euros' },
];

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

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
    item('CM1', 1, 'L\'an 1000 appartient au :', 'Xe siècle', ['XIe siècle', 'Ier siècle', 'XXe siècle'], 'Le Xe siècle va de 901 à 1000. L\'an 1000 est sa dernière année.'),
    item('CM1', 1, 'Quel style d\'église apparaît en premier ?', 'l\'art roman', ['l\'art gothique', 'l\'art de la Renaissance', 'l\'art moderne'], 'L\'art roman vient d\'abord, vers l\'an 1000. L\'art gothique arrive ensuite, au XIIe siècle.'),
    // CM1 — la monarchie.
    item('CM1', 2, 'Dans quel ordre ces rois ont-ils régné ?', 'François Ier, Henri IV, Louis XIV', ['Henri IV, François Ier, Louis XIV', 'Louis XIV, Henri IV, François Ier', 'François Ier, Louis XIV, Henri IV'], 'François Ier en 1515, puis Henri IV en 1589, puis Louis XIV en 1643.'),
    item('CM1', 2, 'Louis XIV règne de 1643 à 1715. Pendant combien de temps environ ?', '72 ans', ['17 ans', '43 ans', '115 ans'], '1715 − 1643 = 72. C\'est le plus long règne de l\'histoire de France.'),
    item('CM1', 2, 'Les guerres de religion ont lieu :', 'au XVIe siècle', ['au XIIe siècle', 'au XVIIIe siècle', 'au XXe siècle'], 'Elles opposent catholiques et protestants de 1562 à 1598.'),
    item('CM1', 2, 'François Ier, Henri IV et Louis XIV ont régné :', 'aux XVIe et XVIIe siècles', ['au Moyen Âge', 'au XIXe siècle', 'pendant l\'Antiquité'], 'Leurs règnes vont de 1515 à 1715.'),
    // CM1 — explorations et 1789.
    item('CM1', 3, 'Quelles années forment le XVe siècle ?', 'de 1401 à 1500', ['de 1501 à 1600', 'de 1500 à 1599', 'de 1301 à 1400'], 'Le XVe siècle va de 1401 à 1500. L\'année 1492 en fait partie.'),
    item('CM1', 3, 'Dans quel ordre ces événements de 1789 se sont-ils produits ?', 'États généraux, prise de la Bastille, Déclaration des droits de l\'homme', ['prise de la Bastille, États généraux, Déclaration des droits de l\'homme', 'Déclaration des droits de l\'homme, États généraux, prise de la Bastille', 'États généraux, Déclaration des droits de l\'homme, prise de la Bastille'], 'États généraux le 5 mai, prise de la Bastille le 14 juillet, Déclaration le 26 août 1789.'),
    item('CM1', 3, 'L\'année 1789 appartient au :', 'XVIIIe siècle', ['XVIIe siècle', 'XIXe siècle', 'XVIe siècle'], 'Le XVIIIe siècle va de 1701 à 1800.'),
    // CM2 — la République.
    item('CM2', 1, 'En 1892, la République fête ses cent ans. En quelle année est-elle née ?', '1792', ['1789', '1848', '1870'], 'La Ire République naît en septembre 1792.'),
    item('CM2', 1, 'Les femmes votent pour la première fois en France en 1945. Les hommes, eux, ont tous le droit de vote depuis :', '1848', ['1945', '1789', '1905'], 'Tous les hommes votent depuis 1848. Les femmes obtiennent le droit de vote en 1944.'),
    item('CM2', 1, 'Tous les hommes votent en 1848, les femmes en 1944. Combien d\'années entre les deux ?', '96 ans', ['50 ans', '100 ans', '12 ans'], '1944 − 1848 = 96 ans.'),
    // CM2 — l'âge industriel.
    item('CM2', 2, 'L\'âge industriel en France, c\'est surtout :', 'le XIXe siècle', ['le XVIe siècle', 'le XIIe siècle', 'le XXIe siècle'], 'Machines, usines et chemins de fer se développent au XIXe siècle.'),
    item('CM2', 2, 'La tour Eiffel est construite pour l\'Exposition universelle de :', '1889', ['1789', '1918', '1945'], 'Elle ouvre en 1889, cent ans après la Révolution.'),
    // CM2 — guerres mondiales et Europe.
    item('CM2', 3, 'Combien de temps dure la Première Guerre mondiale ?', '4 ans, de 1914 à 1918', ['1 an, en 1914', '10 ans, de 1908 à 1918', '6 ans, de 1939 à 1945'], 'Elle commence en 1914. Elle finit le 11 novembre 1918.'),
    item('CM2', 3, 'La Seconde Guerre mondiale se déroule :', 'de 1939 à 1945', ['de 1914 à 1918', 'de 1870 à 1871', 'de 1789 à 1799'], 'Elle commence en 1939 et se termine en 1945.'),
    item('CM2', 3, 'Combien d\'années séparent la fin des deux guerres mondiales ?', '27 ans', ['10 ans', '50 ans', '4 ans'], '1945 − 1918 = 27 ans.'),
  ],
  evenements: [
    // CM1 — le Moyen Âge.
    item('CM1', 1, 'Au Moyen Âge, qui vit dans le château fort ?', 'le seigneur et sa famille', ['les paysans du village', 'les moines', 'les marchands de la ville'], 'C\'est la maison du seigneur. Il y vit avec sa famille et ses chevaliers.'),
    item('CM1', 1, 'Que doivent les paysans à leur seigneur ?', 'des corvées et des taxes', ['rien du tout', 'un salaire', 'des leçons d\'écriture'], 'Ils travaillent gratuitement sur ses terres : c\'est la corvée. Ils lui paient aussi des taxes.'),
    item('CM1', 1, 'Que donnent les paysans à l\'Église ?', 'la dîme, une part de leurs récoltes', ['la corvée, leur travail gratuit', 'leur maison', 'un château'], 'La dîme, c\'est environ un dixième des récoltes.'),
    item('CM1', 1, 'Qui prie et travaille dans une abbaye ?', 'des moines', ['des chevaliers', 'des seigneurs', 'des marchands'], 'Les moines vivent dans l\'abbaye : ils prient, travaillent et recopient des livres.'),
    item('CM1', 1, 'À quoi sert le donjon d\'un château fort ?', 'à se défendre et à loger le seigneur', ['à moudre le grain', 'à vendre au marché', 'à rendre la justice du roi'], 'C\'est la plus grande tour. Le seigneur y vit, et on s\'y protège en cas d\'attaque.'),
    item('CM1', 1, 'Que trouve-t-on dans une ville du Moyen Âge ?', 'des marchés, des foires et des artisans', ['des usines et des gares', 'des supermarchés', 'des aéroports'], 'En ville, on achète et on vend : marchés, foires, ateliers d\'artisans.'),
    item('CM1', 1, 'Qui combat à cheval pour son seigneur ?', 'le chevalier', ['le moine', 'le paysan', 'le marchand'], 'Le chevalier est un guerrier qui combat à cheval.'),
    item('CM1', 1, 'À quelle saison les paysans font-ils les moissons ?', 'en été', ['en hiver', 'au printemps', 'à l\'automne'], 'On récolte les céréales en été. Les vendanges ont lieu à l\'automne.'),
    item('CM1', 1, 'Quelle cathédrale gothique commence-t-on à construire à Paris en 1163 ?', 'Notre-Dame de Paris', ['la tour Eiffel', 'le château de Versailles', 'le Mont-Saint-Michel'], 'La construction de Notre-Dame de Paris commence en 1163.'),
    item('CM1', 1, 'Qui dirige la paroisse et dit la messe au village ?', 'le curé', ['le seigneur', 'le chevalier', 'le marchand'], 'Le curé est le prêtre de la paroisse.'),
    item('CM1', 1, 'Au Moyen Âge, où se réfugient les paysans en cas d\'attaque ?', 'dans le château du seigneur', ['dans la forêt', 'dans une autre ville', 'au port'], 'Le seigneur doit protéger les habitants. Ils s\'abritent derrière les murailles du château.'),
    item('CM1', 1, 'Que fabriquent les moines copistes ?', 'des livres recopiés à la main', ['des épées', 'des vitraux', 'des pièces de monnaie'], 'Avant l\'imprimerie, les livres étaient recopiés à la main, souvent dans les abbayes.'),
    item('CM1', 1, 'Que se passe-t-il lors d\'une foire au Moyen Âge ?', 'des marchands venus de loin vendent et achètent', ['les chevaliers s\'entraînent', 'les moines prient', 'le roi est couronné'], 'Aux foires de Champagne, des marchands viennent de toute l\'Europe.'),
    item('CM1', 1, 'Qui construit les cathédrales ?', 'des artisans : tailleurs de pierre, charpentiers, verriers', ['les chevaliers', 'les moines copistes', 'les seigneurs eux-mêmes'], 'Des centaines d\'artisans travaillent pendant des dizaines d\'années.'),
    // CM1 — le château fort.
    item('CM1', 1, 'Comment appelle-t-on le fossé rempli d\'eau autour du château ?', 'les douves', ['le donjon', 'la courtine', 'la poterne'], 'Les douves entourent le château et gênent l\'attaque.'),
    item('CM1', 1, 'Comment appelle-t-on le pont qu\'on relève pour bloquer l\'entrée du château ?', 'le pont-levis', ['le chemin de ronde', 'la poterne', 'le donjon'], 'On le relève avec des chaînes pour fermer le château.'),
    item('CM1', 1, 'Comment appelle-t-on la grille de fer qui ferme l\'entrée du château ?', 'la herse', ['le pont-levis', 'la courtine', 'le créneau'], 'La herse descend devant la porte pour bloquer le passage.'),
    item('CM1', 1, 'À quoi servent les créneaux au sommet des murailles ?', 'à s\'abriter pour tirer sur l\'ennemi', ['à faire entrer la lumière', 'à stocker le grain', 'à loger les chevaux'], 'Les défenseurs se cachent entre les créneaux pour se protéger.'),
    item('CM1', 1, 'Comment appelle-t-on le chemin étroit en haut des murailles ?', 'le chemin de ronde', ['la basse-cour', 'la poterne', 'l\'oubliette'], 'Les gardes y circulent pour surveiller les alentours.'),
    item('CM1', 1, 'Comment appelle-t-on une petite porte secrète du château ?', 'la poterne', ['le donjon', 'le pont-levis', 'la herse'], 'Elle permet de sortir discrètement du château.'),
    item('CM1', 1, 'Où le seigneur enferme-t-il ses prisonniers, tout en bas du donjon ?', 'dans une oubliette', ['dans la basse-cour', 'dans la chapelle', 'dans l\'écurie'], 'L\'oubliette est une cellule sombre, souvent sans porte.'),
    item('CM1', 1, 'Comment appelle-t-on la cour extérieure où vivent les serviteurs et les animaux ?', 'la basse-cour', ['le donjon', 'les douves', 'le chemin de ronde'], 'On y trouve l\'étable, l\'écurie et les ateliers.'),
    item('CM1', 1, 'Lequel de ces mots n\'est pas lié à la défense du château ?', 'le potager', ['les douves', 'la herse', 'les créneaux'], 'Le potager nourrit le château, il ne le défend pas.'),
    item('CM1', 1, 'Comment appelle-t-on la plus haute tour du château ?', 'le donjon', ['la courtine', 'la poterne', 'la basse-cour'], 'Le donjon est la tour la plus haute et la plus sûre.'),
    // CM1 — la seigneurie et la vassalité.
    item('CM1', 1, 'Comment appelle-t-on la terre donnée par un seigneur à un vassal ?', 'un fief', ['une paroisse', 'une abbaye', 'une foire'], 'Le vassal reçoit ce fief en échange de son aide.'),
    item('CM1', 1, 'Que promet un vassal à son seigneur lors de l\'hommage ?', 'fidélité et aide militaire', ['de l\'or chaque année', 'de partir en pèlerinage', 'de devenir moine'], 'Le vassal s\'engage à combattre pour son seigneur.'),
    item('CM1', 1, 'Comment appelle-t-on l\'impôt que le paysan verse à son seigneur pour sa terre ?', 'le cens', ['la dîme', 'le sacre', 'le fief'], 'Le cens est une redevance payée pour l\'usage de la terre.'),
    item('CM1', 1, 'Qui rend la justice sur les terres de la seigneurie ?', 'le seigneur', ['le curé', 'le roi seul', 'le marchand'], 'Le seigneur juge les conflits qui opposent ses paysans.'),
    item('CM1', 1, 'Comment appelle-t-on le moulin que les paysans doivent utiliser et payer ?', 'le moulin banal', ['le moulin libre', 'le moulin du roi', 'le moulin de l\'abbaye'], 'Les paysans doivent y faire moudre leur grain contre paiement.'),
    item('CM1', 1, 'Un paysan peut-il choisir librement son seigneur ?', 'Non, il dépend de la terre où il vit.', ['Oui, tout à fait.', 'Cela dépend des saisons.', 'Seulement au printemps.'], 'Le paysan dépend de la terre où il est né.'),
    item('CM1', 1, 'Comment appelle-t-on le droit du seigneur de posséder un four commun ?', 'une banalité', ['une dîme', 'un hommage', 'un fief'], 'Les paysans paient pour utiliser le four, le moulin ou le pressoir du seigneur.'),
    item('CM1', 1, 'Qui doit obéissance et aide militaire à un seigneur plus puissant ?', 'le vassal', ['le curé', 'le marchand', 'le paysan libre'], 'En échange, le vassal reçoit un fief à administrer.'),
    item('CM1', 1, 'Combien de jours par semaine un paysan doit-il parfois faire la corvée ?', 'plusieurs jours', ['aucun jour', 'tous les jours', 'un jour par an'], 'La corvée peut prendre plusieurs jours chaque semaine.'),
    item('CM1', 1, 'Qui doit protéger les paysans de sa seigneurie en cas de guerre ?', 'le seigneur', ['le marchand', 'le pèlerin', 'l\'écuyer'], 'En échange de leur travail, le seigneur doit les protéger.'),
    // CM1 — l'agriculture et la vie paysanne.
    item('CM1', 1, 'Quel outil tiré par des bœufs permet de labourer profondément la terre ?', 'la charrue', ['la faux', 'la faucille', 'le rouet'], 'La charrue retourne la terre plus profondément que l\'araire.'),
    item('CM1', 1, 'À quelle saison les paysans font-ils les semailles d\'hiver ?', 'à l\'automne', ['en été', 'en hiver', 'au printemps'], 'Le blé semé à l\'automne pousse pendant l\'hiver et le printemps.'),
    item('CM1', 1, 'Comment appelle-t-on une terre qu\'on laisse reposer sans la cultiver ?', 'une jachère', ['une friche urbaine', 'une foire', 'une paroisse'], 'Se reposer une année rend la terre plus fertile ensuite.'),
    item('CM1', 1, 'Avec quoi les paysans coupent-ils les céréales pendant la moisson ?', 'la faucille', ['la charrue', 'le rouet', 'le marteau'], 'La faucille sert à couper le blé à la main.'),
    item('CM1', 1, 'De quoi est fait le toit des maisons paysannes au Moyen Âge ?', 'de paille, appelée chaume', ['de tuiles vernissées', 'de béton', 'de verre'], 'Le chaume est un toit de paille, courant chez les paysans.'),
    item('CM1', 1, 'Avec quel mélange sont souvent construits les murs des maisons paysannes ?', 'de la terre et de la paille, le torchis', ['du béton armé', 'du verre', 'de l\'acier'], 'Le torchis est fait de terre mêlée à de la paille.'),
    item('CM1', 1, 'Quelle force fait tourner les moulins à eau ?', 'le courant de la rivière', ['l\'électricité', 'le charbon', 'le pétrole'], 'Le courant fait tourner une grande roue qui actionne la meule.'),
    item('CM1', 1, 'Que fait tourner le vent dans un moulin à vent ?', 'les ailes qui font tourner la meule', ['une roue de charrette', 'un four à pain', 'un métier à tisser'], 'Le vent tourne les ailes, qui font tourner la meule à l\'intérieur.'),
    item('CM1', 1, 'Pourquoi les récoltes du Moyen Âge sont-elles parfois très mauvaises ?', 'à cause de la sécheresse ou des pluies trop fortes', ['à cause des voitures', 'à cause des usines', 'à cause d\'Internet'], 'Une mauvaise récolte peut provoquer une famine dans le village.'),
    item('CM1', 1, 'Comment appelle-t-on un grave manque de nourriture qui touche un village ?', 'une famine', ['une foire', 'une dîme', 'une corvée'], 'Après une mauvaise récolte, la famine peut toucher toute une région.'),
    item('CM1', 1, 'Que mangent le plus souvent les paysans au Moyen Âge ?', 'du pain, des légumes et de la bouillie', ['du chocolat et des bananes', 'des pâtes et des tomates', 'du riz et des sushis'], 'Le pain de céréales est la base de leur alimentation.'),
    item('CM1', 1, 'Quel animal tire le plus souvent la charrue dans les champs du Moyen Âge ?', 'le bœuf', ['le chameau', 'le mouton', 'la poule'], 'Le bœuf est robuste et bien adapté au travail des champs.'),
    // CM1 — l'Église et la vie religieuse.
    item('CM1', 1, 'Comment appelle-t-on le chef d\'une abbaye ?', 'l\'abbé ou l\'abbesse', ['le seigneur', 'le curé', 'l\'évêque'], 'L\'abbé dirige les moines, l\'abbesse dirige les moniales.'),
    item('CM1', 1, 'Qui dirige un diocèse et vit dans une grande ville ?', 'l\'évêque', ['le curé', 'l\'abbé', 'le seigneur'], 'L\'évêque a autorité sur tous les curés de son diocèse.'),
    item('CM1', 1, 'Comment appelle-t-on un voyage religieux vers un lieu saint ?', 'un pèlerinage', ['une foire', 'une corvée', 'un hommage'], 'Les pèlerins marchent parfois des mois pour atteindre un lieu saint.'),
    item('CM1', 1, 'Vers quel lieu saint marchent de nombreux pèlerins au Moyen Âge ?', 'Saint-Jacques-de-Compostelle', ['Notre-Dame de Paris', 'Versailles', 'Chambord'], 'Des pèlerins d\'Europe entière marchent vers cette ville d\'Espagne.'),
    item('CM1', 1, 'Quelle abbaye est construite sur un rocher entouré par la mer, en Normandie ?', 'le Mont-Saint-Michel', ['Notre-Dame de Paris', 'Chambord', 'Versailles'], 'Le Mont-Saint-Michel est une abbaye bâtie sur un rocher, en Normandie.'),
    item('CM1', 1, 'Que font les moines dans la bibliothèque de leur abbaye ?', 'ils recopient et conservent des livres', ['ils cultivent des légumes', 'ils forgent des épées', 'ils tissent des vêtements'], 'Avant l\'imprimerie, chaque livre est recopié à la main.'),
    item('CM1', 1, 'Combien de fois par jour les moines s\'arrêtent-ils pour prier ?', 'plusieurs fois', ['jamais', 'une seule fois', 'seulement le dimanche'], 'Les journées des moines sont rythmées par plusieurs prières.'),
    item('CM1', 1, 'Qui soigne souvent les malades au Moyen Âge, faute de médecins ?', 'les moines et les moniales', ['les chevaliers', 'les marchands', 'les seigneurs'], 'Certaines abbayes possèdent un hôpital pour soigner les pauvres et les malades.'),
    item('CM1', 1, 'La plupart des paysans savent-ils lire au Moyen Âge ?', 'Non, très peu savent lire.', ['Oui, presque tous.', 'Seulement les filles savent lire.', 'Seulement en été.'], 'Très peu de paysans savent lire et écrire à cette époque.'),
    item('CM1', 1, 'Qui tient parfois la seule école d\'un village au Moyen Âge ?', 'le curé ou les moines', ['le seigneur', 'le marchand', 'le chevalier'], 'L\'école n\'est pas obligatoire et très peu d\'enfants y vont.'),
    // CM1 — l'art roman, l'art gothique et les cathédrales.
    item('CM1', 1, 'Comment appelle-t-on l\'arc arrondi, en demi-cercle, de l\'art roman ?', 'l\'arc en plein cintre', ['l\'arc brisé', 'la croisée d\'ogives', 'l\'arc-boutant'], 'L\'arc en plein cintre est arrondi, typique de l\'art roman.'),
    item('CM1', 1, 'Comment appelle-t-on l\'arc pointu de l\'art gothique ?', 'l\'arc brisé', ['l\'arc en plein cintre', 'le chemin de ronde', 'le contrefort'], 'L\'arc brisé, plus pointu, permet de construire plus haut.'),
    item('CM1', 1, 'À quoi servent les arcs-boutants, à l\'extérieur des cathédrales gothiques ?', 'à soutenir les hauts murs', ['à décorer le toit', 'à stocker de l\'eau', 'à sonner les cloches'], 'Ils portent le poids des murs pour laisser plus de place aux fenêtres.'),
    item('CM1', 1, 'Comment appelle-t-on la grande fenêtre ronde d\'une cathédrale gothique ?', 'une rosace', ['une meurtrière', 'un créneau', 'une poterne'], 'La rosace laisse entrer une lumière colorée grâce à ses vitraux.'),
    item('CM1', 1, 'Pourquoi les églises gothiques ont-elles de si grands vitraux ?', 'les arcs-boutants soutiennent les murs, qui peuvent s\'ouvrir davantage', ['le verre était moins cher qu\'aujourd\'hui', 'il n\'existait pas de pierre', 'les fenêtres protégeaient du bruit'], 'Sans arcs-boutants, les murs pourraient s\'effondrer sous de si grandes fenêtres.'),
    item('CM1', 1, 'Environ combien de temps faut-il pour bâtir une grande cathédrale gothique ?', 'plusieurs dizaines d\'années', ['quelques jours', 'un seul été', 'une semaine'], 'Notre-Dame de Paris est construite sur près de deux siècles.'),
    item('CM1', 1, 'Qui aide à financer la construction d\'une cathédrale ?', 'les dons des habitants et de l\'évêque', ['seulement le roi d\'Angleterre', 'seulement des marchands étrangers', 'personne, elle se construit seule'], 'Toute la ville participe souvent au financement de sa cathédrale.'),
    item('CM1', 1, 'Quel matériau coloré compose les vitraux des cathédrales ?', 'du verre teinté', ['du plastique', 'du papier peint', 'de la pierre polie'], 'De petits morceaux de verre coloré sont assemblés avec du plomb.'),
    // CM1 — la chevalerie.
    item('CM1', 1, 'Comment appelle-t-on le jeune noble qui apprend le métier de chevalier ?', 'un écuyer', ['un moine', 'un vassal', 'un artisan'], 'L\'écuyer sert un chevalier avant de le devenir lui-même.'),
    item('CM1', 1, 'Comment appelle-t-on la cérémonie qui fait d\'un écuyer un chevalier ?', 'l\'adoubement', ['l\'hommage', 'le sacre', 'le pèlerinage'], 'Lors de l\'adoubement, on remet ses armes au nouveau chevalier.'),
    item('CM1', 1, 'Comment appelle-t-on un combat d\'entraînement entre chevaliers, lors d\'une fête ?', 'un tournoi', ['une foire', 'un hommage', 'un sacre'], 'Les chevaliers s\'affrontent à cheval, avec des lances, pendant un tournoi.'),
    item('CM1', 1, 'Qu\'est-ce qu\'un blason, porté par un chevalier ?', 'un dessin qui identifie une famille noble', ['une arme tranchante', 'un impôt payé au roi', 'un vêtement de moine'], 'Chaque famille noble a son propre blason, peint sur le bouclier.'),
    item('CM1', 1, 'Contre quoi une armure protège-t-elle le chevalier ?', 'les coups de son adversaire', ['le froid seulement', 'la pluie seulement', 'le soleil seulement'], 'L\'armure de métal protège le corps pendant le combat.'),
    item('CM1', 1, 'Sur quel animal combat le plus souvent un chevalier ?', 'un cheval', ['un bœuf', 'un âne', 'un chameau'], 'Le mot chevalier vient du mot cheval.'),
    item('CM1', 1, 'Avec quelle arme longue un chevalier combat-il à cheval ?', 'une lance', ['un arc', 'une pioche', 'une faucille'], 'La lance permet de frapper l\'adversaire de loin, à cheval.'),
    item('CM1', 1, 'Quelles valeurs un chevalier doit-il respecter, selon le code de chevalerie ?', 'le courage, la loyauté et la protection des faibles', ['la richesse avant tout', 'la fuite devant le danger', 'le mensonge'], 'Ce code guide la conduite d\'un bon chevalier.'),
    item('CM1', 1, 'Avant de devenir écuyer, comment appelle-t-on le jeune garçon noble au château ?', 'un page', ['un vassal', 'un abbé', 'un artisan'], 'Le page apprend d\'abord les bonnes manières, avant de devenir écuyer.'),
    item('CM1', 1, 'Un paysan peut-il devenir chevalier facilement ?', 'Non, cela demande de l\'argent pour l\'équipement.', ['Oui, très facilement.', 'Seulement les filles peuvent.', 'Seulement en été.'], 'Devenir chevalier demande de l\'argent pour l\'équipement et le cheval.'),
    // CM1 — la ville, les marchands et les artisans.
    item('CM1', 1, 'Comment appelle-t-on l\'association qui regroupe les artisans d\'un même métier ?', 'une corporation', ['une abbaye', 'une seigneurie', 'une paroisse'], 'Chaque métier a sa corporation, avec ses propres règles.'),
    item('CM1', 1, 'Comment appelle-t-on le jeune qui apprend un métier auprès d\'un artisan ?', 'un apprenti', ['un compagnon', 'un maître', 'un écuyer'], 'Après plusieurs années, l\'apprenti devient compagnon, puis peut-être maître.'),
    item('CM1', 1, 'Comment appelle-t-on l\'artisan le plus expérimenté, qui dirige un atelier ?', 'le maître', ['l\'apprenti', 'le compagnon', 'le seigneur'], 'Le maître a le droit d\'ouvrir son propre atelier.'),
    item('CM1', 1, 'Autour de quelles villes se tiennent les célèbres foires de Champagne ?', 'Troyes et Provins', ['Marseille', 'Bordeaux', 'Lille'], 'Des marchands de toute l\'Europe s\'y retrouvent pour commercer.'),
    item('CM1', 1, 'Que peut-on acheter sur le marché d\'une ville médiévale ?', 'de la nourriture, des tissus et des outils', ['des billets d\'avion', 'des téléphones', 'des voitures'], 'Le marché vend tout ce dont les habitants ont besoin chaque semaine.'),
    item('CM1', 1, 'Pourquoi les villes du Moyen Âge sont-elles souvent entourées de remparts ?', 'pour se protéger des attaques', ['pour empêcher les oiseaux d\'entrer', 'pour arrêter le vent', 'pour décorer la ville'], 'Les remparts protègent les habitants comme les murailles d\'un château.'),
    item('CM1', 1, 'Comment appelle-t-on le grand marché qui revient chaque année, pendant plusieurs jours ?', 'une foire', ['une dîme', 'une corvée', 'un hommage'], 'Une foire dure plusieurs jours et attire des marchands venus de loin.'),
    item('CM1', 1, 'Qui, dans une ville médiévale, fabrique et vend le pain ?', 'le boulanger', ['le forgeron', 'le tisserand', 'le tanneur'], 'Chaque métier a sa spécialité, comme le boulanger pour le pain.'),
    item('CM1', 1, 'Qui, dans une ville médiévale, travaille le fer pour fabriquer des outils ?', 'le forgeron', ['le boulanger', 'le tisserand', 'le tanneur'], 'Le forgeron chauffe le fer et le façonne au marteau.'),
    item('CM1', 1, 'Pourquoi les villes se développent-elles au Moyen Âge ?', 'le commerce et l\'artisanat s\'y développent', ['elles se dépeuplent totalement', 'personne n\'y travaille', 'il n\'y a plus de marchés'], 'Marchands et artisans attirent de nouveaux habitants vers les villes.'),
    // CM1 — la vie quotidienne.
    item('CM1', 1, 'Comment les paysans s\'éclairent-ils le soir, faute d\'électricité ?', 'avec des chandelles ou le feu', ['avec des lampes électriques', 'avec des lampadaires', 'avec des écrans'], 'Les chandelles de cire ou de suif éclairent faiblement les maisons.'),
    item('CM1', 1, 'Pourquoi l\'espérance de vie est-elle courte au Moyen Âge ?', 'les maladies et les famines sont fréquentes', ['les gens ont trop de loisirs', 'il n\'y a pas assez de travail', 'les médecins sont trop nombreux'], 'Sans médecine moderne, beaucoup de maladies restent incurables.'),
    item('CM1', 1, 'Comment s\'appelle la longue tunique portée par les paysans, hommes et femmes ?', 'la cotte', ['l\'armure', 'la toge', 'l\'uniforme'], 'La cotte est un vêtement simple, souvent en laine ou en lin.'),
    item('CM1', 1, 'Comment les paysans se déplacent-ils le plus souvent ?', 'à pied ou avec une charrette', ['en voiture', 'en train', 'en avion'], 'Peu de paysans possèdent un cheval, réservé souvent aux plus riches.'),
    item('CM1', 1, 'Que font les habitants d\'un village pendant les veillées d\'hiver ?', 'ils se réunissent pour parler, chanter et travailler', ['ils regardent la télévision', 'ils jouent à des jeux vidéo', 'ils prennent l\'avion'], 'Les veillées rassemblent les villageois autour du feu, le soir.'),
    item('CM1', 1, 'Où les villageois puisent-ils souvent l\'eau qu\'ils utilisent chaque jour ?', 'au puits ou à la rivière', ['au robinet de la cuisine', 'dans une bouteille en plastique', 'à la piscine'], 'L\'eau courante n\'existe pas encore dans les maisons.'),
    item('CM1', 1, 'Comment appelle-t-on l\'endroit où l\'on soigne les malades et les pauvres au Moyen Âge ?', 'l\'hôtel-Dieu', ['le donjon', 'la basse-cour', 'la halle'], 'Souvent tenu par des religieux, il accueille les malades sans argent.'),
    item('CM1', 1, 'La plupart des Français vivent-ils en ville au Moyen Âge ?', 'Non, la plupart vivent à la campagne.', ['Oui, presque tous.', 'Cela dépend de l\'année.', 'Seulement au printemps.'], 'La grande majorité de la population vit à la campagne.'),
    item('CM1', 1, 'Que redoutent le plus les villageois quand une épidémie arrive ?', 'de tomber malade et de mourir', ['de perdre une foire', 'de rater une moisson', 'de manquer un tournoi'], 'Sans remède efficace, les épidémies peuvent tuer beaucoup d\'habitants.'),
    item('CM1', 1, 'Pourquoi les enfants de paysans travaillent-ils déjà très jeunes ?', 'leur famille a besoin de leur aide aux champs', ['l\'école le leur demande', 'c\'est un jeu', 'le seigneur les paie très bien'], 'Dès leur plus jeune âge, ils aident aux tâches de la ferme.'),
    // CM1 — les transports et les échanges.
    item('CM1', 1, 'Comment les marchandises voyagent-elles le plus souvent sur de longues distances ?', 'par voie fluviale, sur des bateaux', ['par avion', 'par camion', 'en train'], 'Les rivières permettent de transporter de lourdes charges plus facilement.'),
    item('CM1', 1, 'Pourquoi les routes du Moyen Âge sont-elles souvent en mauvais état ?', 'elles ne sont pas pavées et s\'abîment vite', ['elles sont en béton moderne', 'elles sont trop larges', 'elles sont éclairées la nuit'], 'La plupart des chemins sont en terre, boueux par temps de pluie.'),
    item('CM1', 1, 'Comment appelle-t-on le péage payé pour traverser certains ponts au Moyen Âge ?', 'un droit de passage', ['une dîme', 'une corvée', 'un hommage'], 'Le seigneur qui possède le pont peut faire payer son passage.'),
    item('CM1', 1, 'Pourquoi construit-on de nombreux ponts en pierre au Moyen Âge ?', 'pour permettre de franchir les rivières', ['pour arrêter les bateaux', 'pour bloquer les routes', 'pour empêcher les foires'], 'Un pont solide facilite le commerce et les déplacements.'),
    item('CM1', 1, 'Est-il rapide de voyager loin au Moyen Âge ?', 'Non, un long voyage prend des jours ou des semaines.', ['Oui, très rapide.', 'Cela dépend du roi.', 'Seulement en été.'], 'Sans voiture ni train, un long voyage prend des jours, voire des semaines.'),
    item('CM1', 1, 'Sur quoi les paysans transportent-ils le grain jusqu\'au moulin ?', 'une charrette tirée par un animal', ['un avion', 'un camion', 'un train'], 'L\'âne, le bœuf ou le cheval tirent la charrette.'),
    item('CM1', 1, 'Pourquoi certains marchands voyagent-ils en groupe au Moyen Âge ?', 'pour se protéger des voleurs sur les routes', ['pour aller plus vite en avion', 'pour économiser de l\'essence', 'pour voir plus de foires'], 'Voyager seul sur les routes est risqué à cette époque.'),
    // CM1 — la monarchie.
    item('CM1', 2, 'Quel roi de France accueille Léonard de Vinci ?', 'François Ier', ['Henri IV', 'Louis XIV', 'Louis XVI'], 'François Ier invite Léonard de Vinci en France en 1516.'),
    item('CM1', 2, 'Quel roi signe l\'édit de Nantes en 1598 ?', 'Henri IV', ['François Ier', 'Louis XIV', 'Louis XVI'], 'Henri IV signe l\'édit de Nantes, qui met fin aux guerres de religion.'),
    item('CM1', 2, 'Que permet l\'édit de Nantes ?', 'aux protestants de pratiquer leur religion', ['aux paysans de ne plus payer d\'impôts', 'aux femmes de voter', 'au roi de conquérir l\'Amérique'], 'Les protestants peuvent prier à leur façon, dans certains lieux. Les guerres de religion s\'arrêtent.'),
    item('CM1', 2, 'Quel roi installe sa cour dans un immense château à Versailles ?', 'Louis XIV', ['François Ier', 'Henri IV', 'Charlemagne'], 'Louis XIV agrandit le château de Versailles et y installe la cour en 1682.'),
    item('CM1', 2, 'Quel surnom donne-t-on à Louis XIV ?', 'le Roi-Soleil', ['le Roi chevalier', 'le Bien-Aimé', 'Cœur de Lion'], 'Louis XIV a choisi le Soleil comme symbole.'),
    item('CM1', 2, 'Qui s\'opposent pendant les guerres de religion ?', 'les catholiques et les protestants', ['les Français et les Anglais', 'les paysans et les seigneurs', 'les Gaulois et les Romains'], 'Au XVIe siècle, catholiques et protestants s\'affrontent en France.'),
    item('CM1', 2, 'Quel roi est assassiné en 1610 ?', 'Henri IV', ['François Ier', 'Louis XIV', 'Louis XVI'], 'Henri IV est assassiné à Paris en 1610.'),
    item('CM1', 2, 'François Ier fait construire un célèbre château de la Loire. Lequel ?', 'Chambord', ['Versailles', 'le Louvre de Louis XIV', 'le donjon de Vincennes'], 'Le château de Chambord est commencé en 1519, sous François Ier.'),
    // CM1 — explorations et conquêtes.
    item('CM1', 3, 'Qui atteint l\'Amérique en 1492 ?', 'Christophe Colomb', ['Magellan', 'Jacques Cartier', 'Vasco de Gama'], 'Christophe Colomb part pour les rois d\'Espagne. Il atteint les îles des Antilles en 1492.'),
    item('CM1', 3, 'Quelle expédition réalise le premier tour du monde ?', 'celle de Magellan', ['celle de Christophe Colomb', 'celle de Jacques Cartier', 'celle de Marco Polo'], 'Elle part en 1519 et revient en 1522. Magellan meurt pendant le voyage.'),
    item('CM1', 3, 'Quel navigateur explore le Canada pour François Ier en 1534 ?', 'Jacques Cartier', ['Christophe Colomb', 'Magellan', 'Vasco de Gama'], 'En 1534, il explore l\'entrée du fleuve Saint-Laurent. L\'année suivante, il remonte le fleuve.'),
    item('CM1', 3, 'Sur quels bateaux naviguent les grands explorateurs du XVe siècle ?', 'des caravelles', ['des paquebots', 'des sous-marins', 'des péniches'], 'La caravelle est un bateau léger et rapide.'),
    item('CM1', 3, 'Quels peuples d\'Amérique sont conquis par les Espagnols au XVIe siècle ?', 'les Aztèques et les Incas', ['les Gaulois et les Francs', 'les Vikings', 'les Grecs et les Romains'], 'Cortès conquiert l\'Empire aztèque. Pizarro conquiert l\'Empire inca.'),
    item('CM1', 3, 'Qu\'est-ce que la traite atlantique ?', 'le commerce d\'Africains réduits en esclavage vers l\'Amérique', ['un voyage d\'exploration vers l\'Inde', 'le commerce des épices en Europe', 'une course de bateaux'], 'Des millions d\'Africains sont emmenés de force en Amérique pour y être esclaves.'),
    item('CM1', 3, 'Que fixe le Code noir de 1685 ?', 'les règles de l\'esclavage dans les colonies françaises', ['la liberté des protestants', 'les droits des citoyens', 'les règles des chevaliers'], 'Ce texte de Louis XIV traite les esclaves comme des objets.'),
    // CM1 — 1789.
    item('CM1', 3, 'Quel roi réunit les États généraux en 1789 ?', 'Louis XVI', ['Louis XIV', 'Henri IV', 'François Ier'], 'Louis XVI les réunit à Versailles, le 5 mai 1789.'),
    item('CM1', 3, 'Que se passe-t-il à Paris le 14 juillet 1789 ?', 'la prise de la Bastille', ['le sacre du roi', 'la fin d\'une guerre', 'la construction de Versailles'], 'Le peuple de Paris prend la Bastille, une prison du roi.'),
    item('CM1', 3, 'Que proclame la Déclaration des droits de l\'homme et du citoyen ?', 'Les hommes naissent et demeurent libres et égaux en droits.', ['Le roi a tous les pouvoirs.', 'Les nobles ne paient pas d\'impôts.', 'Seuls les riches ont des droits.'], 'C\'est le premier article de la Déclaration du 26 août 1789.'),
    item('CM1', 3, 'Qu\'est-il décidé dans la nuit du 4 août 1789 ?', 'l\'abolition des privilèges', ['la prise de la Bastille', 'le départ du roi pour Versailles', 'la découverte de l\'Amérique'], 'Les députés suppriment les avantages des nobles et du clergé.'),
    item('CM1', 3, 'En octobre 1789, qui marche de Paris jusqu\'à Versailles ?', 'des femmes de Paris', ['des soldats anglais', 'des moines', 'des explorateurs'], 'En octobre 1789, des Parisiennes vont à Versailles et ramènent le roi à Paris.'),
    item('CM1', 3, 'Que jurent les députés au Jeu de paume, en juin 1789 ?', 'de donner une Constitution à la France', ['d\'obéir au roi en tout', 'de partir explorer l\'Amérique', 'de rétablir les privilèges'], 'Le 20 juin 1789, ils promettent de rester ensemble jusqu\'à écrire une Constitution.'),
    // CM2 — la République.
    item('CM2', 1, 'Quel ministre rend l\'école gratuite, laïque et obligatoire ?', 'Jules Ferry', ['Victor Hugo', 'Napoléon Bonaparte', 'Louis XIV'], 'Les lois Jules Ferry de 1881 et 1882 organisent l\'école primaire.'),
    item('CM2', 1, 'Depuis les lois Ferry, l\'école primaire est :', 'gratuite, laïque et obligatoire', ['payante et réservée aux garçons', 'religieuse et facultative', 'réservée aux enfants des villes'], 'L\'instruction devient obligatoire de 6 à 13 ans. L\'école publique est gratuite.'),
    item('CM2', 1, 'En quelle année les femmes obtiennent-elles le droit de vote en France ?', '1944', ['1789', '1848', '1905'], 'Les femmes obtiennent le droit de vote en 1944. Elles votent pour la première fois en 1945.'),
    item('CM2', 1, 'En 1848, qui obtient le droit de vote ?', 'tous les hommes de plus de 21 ans', ['toutes les femmes', 'seulement les nobles', 'les enfants'], 'C\'est le suffrage universel masculin.'),
    item('CM2', 1, 'Qui fait abolir l\'esclavage dans les colonies françaises en 1848 ?', 'Victor Schœlcher', ['Jules Ferry', 'Louis XIV', 'Christophe Colomb'], 'L\'esclavage est aboli le 27 avril 1848.'),
    item('CM2', 1, 'Que décide la loi de 1905 ?', 'la séparation des Églises et de l\'État', ['l\'école obligatoire', 'le droit de vote des femmes', 'la fin de l\'esclavage'], 'L\'État ne paie aucune religion. Chacun est libre de croire ou de ne pas croire.'),
    item('CM2', 1, 'Quels sont des symboles de la République française ?', 'Marianne, le drapeau tricolore et La Marseillaise', ['la fleur de lys et la couronne', 'le Soleil et Versailles', 'l\'aigle et l\'épée'], 'Ce sont les symboles de la République.'),
    item('CM2', 1, 'Quelle est la devise de la République française ?', 'Liberté, Égalité, Fraternité', ['Unie dans la diversité', 'Paix et Prospérité', 'Un pour tous, tous pour un'], 'Elle est inscrite sur les mairies et les écoles.'),
    item('CM2', 1, 'Quelle scientifique reçoit deux prix Nobel, en 1903 et en 1911 ?', 'Marie Curie', ['Olympe de Gouges', 'Jeanne d\'Arc', 'George Sand'], 'Marie Curie est la première femme à recevoir un prix Nobel. Elle en reçoit même deux.'),
    item('CM2', 1, 'Que célèbre-t-on le 14 juillet, fête nationale depuis 1880 ?', 'la prise de la Bastille et la fête de la Fédération', ['la fin de la Première Guerre mondiale', 'la naissance de Louis XIV', 'le droit de vote des femmes'], 'Le 14 juillet rappelle 1789 et la fête de la Fédération de 1790.'),
    item('CM2', 1, 'Qui était Olympe de Gouges ?', 'une révolutionnaire qui a réclamé les mêmes droits pour les femmes', ['une reine de France', 'une scientifique du XXe siècle', 'une exploratrice'], 'En 1791, elle écrit la Déclaration des droits de la femme et de la citoyenne.'),
    item('CM2', 1, 'Avec les lois Ferry, jusqu\'à quel âge l\'instruction est-elle obligatoire ?', '13 ans', ['6 ans', '10 ans', '18 ans'], 'En 1882, l\'instruction devient obligatoire de 6 à 13 ans.'),
    // CM2 — la naissance et le retour de la République.
    item('CM2', 1, 'En quelle année la France devient-elle une République pour la première fois ?', '1792', ['1789', '1804', '1870'], 'La Ire République est proclamée en septembre 1792.'),
    item('CM2', 1, 'Qui devient empereur des Français en 1804 ?', 'Napoléon Bonaparte', ['Louis XVI', 'Jules Ferry', 'Léon Gambetta'], 'Il met fin à la Ire République en se faisant sacrer empereur.'),
    item('CM2', 1, 'Comment s\'appelle le régime dirigé par un empereur, après la Ire République ?', 'le Premier Empire', ['la IIe République', 'la Restauration', 'la IIIe République'], 'Napoléon Bonaparte dirige la France comme empereur, de 1804 à 1814.'),
    item('CM2', 1, 'En quelle année naît la IIe République ?', '1848', ['1792', '1870', '1905'], 'Elle naît après une révolution, en février 1848.'),
    item('CM2', 1, 'Qui devient empereur en 1852, mettant fin à la IIe République ?', 'Napoléon III', ['Napoléon Bonaparte', 'Jules Ferry', 'Léon Gambetta'], 'Il est le neveu de Napoléon Bonaparte.'),
    item('CM2', 1, 'En quelle année naît la IIIe République ?', '1870', ['1848', '1792', '1905'], 'Elle est proclamée après la défaite de la France contre la Prusse.'),
    item('CM2', 1, 'Qui proclame la IIIe République, le 4 septembre 1870 ?', 'Léon Gambetta', ['Jules Ferry', 'Napoléon III', 'Victor Schœlcher'], 'Il annonce la République depuis l\'Hôtel de Ville de Paris.'),
    item('CM2', 1, 'Combien de fois la France a-t-elle été une République avant 1900 ?', 'trois fois', ['une seule fois', 'cinq fois', 'jamais'], 'La Ire, la IIe puis la IIIe République se succèdent.'),
    item('CM2', 1, 'Entre 1792 et 1870, la France a-t-elle toujours été une République ?', 'Non, elle a aussi eu des empereurs et des rois.', ['Oui, sans interruption.', 'Non, elle n\'a jamais été une République.', 'Cela dépend des régions.'], 'Des empereurs et des rois ont aussi dirigé la France pendant cette période.'),
    item('CM2', 1, 'Pourquoi dit-on que 1892 est un anniversaire important pour la République ?', 'elle fête ses cent ans, née en 1792', ['elle vient juste de naître', 'c\'est la fin de la République', 'c\'est le début de l\'Empire'], '1892 marque le centenaire de la Ire République, née en 1792.'),
    item('CM2', 1, 'Contre quel pays la France est-elle vaincue en 1870, ce qui amène la IIIe République ?', 'la Prusse', ['l\'Angleterre', 'l\'Espagne', 'l\'Italie'], 'Cette défaite entraîne la chute de Napoléon III.'),
    item('CM2', 1, 'La IIIe République dure-t-elle longtemps ?', 'Oui, environ soixante-dix ans, jusqu\'en 1940.', ['Non, moins d\'un an.', 'Oui, mais moins de dix ans.', 'Non, elle dure un siècle.'], 'Elle prend fin en 1940, pendant la Seconde Guerre mondiale.'),
    item('CM2', 1, 'Combien de temps Napoléon Bonaparte reste-t-il empereur, de 1804 à 1814 ?', 'environ 10 ans', ['environ 70 ans', 'environ 1 an', 'environ 100 ans'], '1814 moins 1804 égale dix ans.'),
    item('CM2', 1, 'Quel événement met fin au Premier Empire de Napoléon, en 1815 ?', 'sa défaite à Waterloo', ['la loi de 1905', 'la naissance de la IIIe République', 'l\'abolition de l\'esclavage'], 'Napoléon est vaincu à Waterloo, en Belgique, en 1815.'),
    // CM2 — les symboles de la République.
    item('CM2', 1, 'De quelles couleurs est le drapeau français ?', 'bleu, blanc, rouge', ['bleu, blanc et vert', 'rouge et jaune', 'noir et blanc'], 'Le drapeau tricolore est adopté pendant la Révolution.'),
    item('CM2', 1, 'Qui compose La Marseillaise, en 1792 ?', 'Rouget de Lisle', ['Léon Gambetta', 'Jules Ferry', 'Napoléon Bonaparte'], 'Il l\'écrit pendant la guerre contre l\'Autriche, en 1792.'),
    item('CM2', 1, 'Depuis quand La Marseillaise est-elle l\'hymne officiel de la France ?', 'depuis la IIIe République, en 1879', ['depuis 1792', 'depuis 1944', 'depuis 2002'], 'Elle est choisie comme hymne national sous la IIIe République.'),
    item('CM2', 1, 'Qui est Marianne, un symbole de la République ?', 'une figure féminine qui représente la République', ['une reine de France', 'une chanteuse célèbre', 'une scientifique du XXe siècle'], 'Son buste orne les mairies de France.'),
    item('CM2', 1, 'Quel bonnet porte souvent Marianne, symbole de la liberté ?', 'le bonnet phrygien', ['le chapeau de paille', 'la couronne royale', 'le casque de chevalier'], 'Ce bonnet rouge est un symbole ancien de liberté.'),
    item('CM2', 1, 'Quel animal est souvent utilisé comme symbole de la France ?', 'le coq', ['le lion', 'l\'aigle', 'l\'ours'], 'Le coq gaulois symbolise la France depuis longtemps.'),
    item('CM2', 1, 'Où se trouve le buste de Marianne, dans chaque commune de France ?', 'à la mairie', ['à l\'école seulement', 'à l\'église', 'au marché'], 'Chaque mairie de France possède un buste de Marianne.'),
    item('CM2', 1, 'Quel monument parisien accueille les tombeaux de grandes figures françaises ?', 'le Panthéon', ['la tour Eiffel', 'l\'Arc de triomphe', 'Notre-Dame'], 'Victor Hugo et Marie Curie y sont enterrés, parmi d\'autres.'),
    item('CM2', 1, 'Depuis quelle année le 14 juillet est-il fête nationale ?', 'depuis 1880', ['depuis 1789', 'depuis 1905', 'depuis 1944'], 'La IIIe République choisit cette date en 1880.'),
    item('CM2', 1, 'Que représente le sigle « RF », que l\'on voit parfois sur des bâtiments publics ?', 'République française', ['Royaume de France', 'Régime français', 'Région française'], 'Ce sigle rappelle que la France est une République.'),
    // CM2 — les grandes lois républicaines.
    item('CM2', 1, 'En quelle année les lois Jules Ferry rendent-elles l\'école gratuite ?', 'en 1881', ['en 1882', 'en 1848', 'en 1905'], 'La loi de 1881 rend l\'école primaire publique gratuite.'),
    item('CM2', 1, 'En quelle année l\'école devient-elle obligatoire et laïque ?', 'en 1882', ['en 1881', 'en 1848', 'en 1905'], 'La loi de 1882 rend l\'instruction obligatoire et laïque.'),
    item('CM2', 1, 'Qui fait voter les lois qui rendent l\'école gratuite et obligatoire ?', 'Jules Ferry', ['Léon Gambetta', 'Victor Schœlcher', 'Napoléon Bonaparte'], 'Ministre de l\'Instruction publique, il porte ces lois en 1881 et 1882.'),
    item('CM2', 1, 'En quelle année la loi sépare-t-elle les Églises et l\'État ?', 'en 1905', ['en 1882', 'en 1848', 'en 1944'], 'Cette loi fait de la France un État laïque.'),
    item('CM2', 1, 'En quelle année les Françaises votent-elles pour la première fois ?', 'en 1945', ['en 1944', 'en 1848', 'en 1905'], 'Le droit de vote est accordé en 1944. Le premier vote a lieu en 1945.'),
    item('CM2', 1, 'En quelle année tous les hommes obtiennent-ils le droit de vote ?', 'en 1848', ['en 1789', 'en 1905', 'en 1944'], 'C\'est le suffrage universel masculin.'),
    item('CM2', 1, 'Que devient un ancien esclave après l\'abolition de 1848 ?', 'un homme libre et citoyen', ['il reste esclave à vie', 'il doit payer pour sa liberté', 'il devient noble'], 'L\'abolition de 1848 rend libres tous les esclaves des colonies françaises.'),
    item('CM2', 1, 'Combien d\'années séparent le droit de vote des hommes et celui des femmes ?', '96 ans', ['50 ans', '12 ans', '150 ans'], '1944 moins 1848 égale 96 ans.'),
    item('CM2', 1, 'En quelle année la liberté de la presse est-elle garantie par une loi ?', 'en 1881', ['en 1789', 'en 1905', 'en 1944'], 'Depuis cette loi, les journaux peuvent s\'exprimer plus librement.'),
    item('CM2', 1, 'En quelle année le droit de grève est-il reconnu en France ?', 'en 1864', ['en 1848', 'en 1905', 'en 1944'], 'Avant cette date, faire grève était interdit.'),
    item('CM2', 1, 'En quelle année la liberté de créer une association est-elle garantie par une loi ?', 'en 1901', ['en 1848', 'en 1789', 'en 1944'], 'Depuis cette loi, les Français peuvent créer librement des associations.'),
    item('CM2', 1, 'Qu\'écrit Olympe de Gouges, en 1791, pour réclamer les droits des femmes ?', 'la Déclaration des droits de la femme et de la citoyenne', ['la Déclaration des droits de l\'homme', 'le Code civil', 'la loi de 1905'], 'Elle réclame les mêmes droits pour les femmes que pour les hommes.'),
    item('CM2', 1, 'Que garantit la laïcité de l\'école publique ?', 'le respect de toutes les croyances, sans religion imposée', ['l\'obligation d\'une seule religion', 'l\'interdiction d\'apprendre l\'histoire', 'la présence d\'un curé dans chaque école'], 'L\'école publique n\'impose ni n\'interdit aucune religion.'),
    item('CM2', 1, 'Pourquoi le suffrage de 1848 n\'est-il pas encore universel ?', 'les femmes ne peuvent pas encore voter', ['les hommes ne peuvent pas encore voter', 'plus personne ne peut voter', 'seuls les enfants votent'], 'Il faudra attendre 1944 pour que les femmes votent aussi.'),
    // CM2 — des personnalités de la République.
    item('CM2', 1, 'Dans quels domaines Marie Curie reçoit-elle des prix Nobel ?', 'la physique et la chimie', ['la littérature et la paix', 'la médecine et la biologie', 'l\'histoire et la géographie'], 'Elle est la seule personne à avoir reçu deux prix Nobel dans deux sciences différentes.'),
    item('CM2', 1, 'Quel écrivain s\'oppose à Napoléon III et doit s\'exiler ?', 'Victor Hugo', ['Jules Ferry', 'Léon Gambetta', 'Rouget de Lisle'], 'Il critique Napoléon III et vit loin de France pendant près de vingt ans.'),
    item('CM2', 1, 'Quel écrivain repose au Panthéon, à Paris ?', 'Victor Hugo', ['Jules Ferry', 'Rouget de Lisle', 'Napoléon III'], 'Ses obsèques, en 1885, réunissent une foule immense à Paris.'),
    item('CM2', 1, 'Quel événement inspire Rouget de Lisle à écrire La Marseillaise ?', 'la guerre contre l\'Autriche, en 1792', ['la prise de la Bastille, en 1789', 'la naissance de la IIIe République', 'l\'abolition de l\'esclavage'], 'Il compose ce chant de guerre pour les soldats français.'),
    item('CM2', 1, 'Qui réclame l\'abolition de l\'esclavage avant qu\'elle ne soit votée en 1848 ?', 'Victor Schœlcher', ['Jules Ferry', 'Olympe de Gouges', 'Léon Gambetta'], 'Il milite de longues années avant d\'obtenir cette loi.'),
    item('CM2', 1, 'Marie Curie est-elle une femme politique du XIXe siècle ?', 'Non, elle est une scientifique.', ['Oui, tout à fait.', 'Cela dépend de l\'année.', 'Seulement en 1848.'], 'Marie Curie est une scientifique, pas une femme politique.'),
    item('CM2', 1, 'Jules Ferry est-il un roi de France ?', 'Non, il est un ministre de la République.', ['Oui, tout à fait.', 'Cela dépend de l\'année.', 'Seulement en 1848.'], 'Jules Ferry est un ministre de la IIIe République.'),
    item('CM2', 1, 'Lequel de ces noms n\'est pas celui d\'une figure de la République ?', 'Louis XIV', ['Jules Ferry', 'Victor Schœlcher', 'Léon Gambetta'], 'Louis XIV est un roi, bien avant la République.'),
    item('CM2', 1, 'Pourquoi Victor Hugo est-il une figure importante de la République ?', 'il défend la liberté par ses écrits', ['il vote les lois comme ministre', 'il dirige l\'armée française', 'il découvre la radioactivité'], 'Ses romans et ses discours défendent la liberté et la justice.'),
    item('CM2', 1, 'Quel métier exerce Marie Curie, récompensée par deux prix Nobel ?', 'scientifique, physicienne et chimiste', ['institutrice', 'avocate', 'écrivaine'], 'Elle étudie la radioactivité avec son mari Pierre Curie.'),
    item('CM2', 1, 'Marie Curie est-elle française d\'origine polonaise ?', 'Oui, elle est née en Pologne.', ['Non, elle est née en France.', 'Non, elle est née en Espagne.', 'Non, elle est née en Italie.'], 'Marie Curie naît en Pologne, puis vient étudier et travailler en France.'),
    // CM2 — la vie politique et l'école républicaine.
    item('CM2', 1, 'Qui est élu pour voter les lois à l\'Assemblée nationale ?', 'les députés', ['les rois', 'les seigneurs', 'les évêques'], 'Les citoyens élisent leurs députés pour les représenter.'),
    item('CM2', 1, 'Qui dirige la France, à la tête de la République ?', 'le président de la République', ['le roi', 'l\'empereur', 'le seigneur'], 'Depuis la République, la France n\'a plus de roi.'),
    item('CM2', 1, 'Comment un président de la République arrive-t-il au pouvoir ?', 'il est élu par les citoyens', ['il hérite du trône', 'il est choisi par les nobles', 'il est nommé par l\'Église'], 'Contrairement à un roi, le président est élu, pas héréditaire.'),
    item('CM2', 1, 'Qu\'est-ce que le Parlement, sous la République ?', 'l\'ensemble des députés et des sénateurs qui votent les lois', ['le palais du roi', 'une école pour les enfants', 'une armée de soldats'], 'Il comprend l\'Assemblée nationale et le Sénat.'),
    item('CM2', 1, 'Que fait un citoyen dans l\'isoloir, le jour d\'une élection ?', 'il vote en secret', ['il paie ses impôts', 'il prie', 'il travaille aux champs'], 'Le vote secret protège la liberté de chaque citoyen.'),
    item('CM2', 1, 'Pourquoi le vote est-il secret dans un isoloir ?', 'pour que chacun vote librement, sans pression', ['pour aller plus vite', 'pour économiser du papier', 'pour que tout le monde vote pareil'], 'Personne ne peut savoir pour qui un citoyen a voté.'),
    item('CM2', 1, 'Qu\'est-ce qu\'une élection présidentielle ?', 'le vote qui choisit le président de la République', ['le vote qui choisit le roi', 'une fête nationale', 'une loi sur l\'école'], 'Les citoyens élisent leur président lors de cette élection.'),
    item('CM2', 1, 'Sous la République, le pouvoir se transmet-il de père en fils ?', 'Non, les représentants sont élus.', ['Oui, toujours.', 'Cela dépend des années.', 'Seulement pour les présidents.'], 'C\'est le principe d\'une monarchie, pas d\'une République.'),
    item('CM2', 1, 'Grâce aux lois Jules Ferry, que doivent faire tous les enfants de 6 à 13 ans ?', 'aller à l\'école', ['travailler à la ferme', 'se marier', 'voter aux élections'], 'L\'instruction devient obligatoire pour tous les enfants.'),
    item('CM2', 1, 'Avant les lois Ferry, tous les enfants vont-ils à l\'école ?', 'Non, beaucoup n\'y vont pas.', ['Oui, absolument tous.', 'Seulement les filles y vont.', 'Seulement en été.'], 'Beaucoup de familles pauvres ou éloignées d\'une école n\'y envoient pas leurs enfants.'),
    item('CM2', 1, 'Que peut faire un instituteur de la IIIe République, grâce à l\'école laïque ?', 'enseigner sans imposer de religion', ['enseigner une seule religion', 'refuser les filles', 'faire payer chaque leçon'], 'L\'école laïque respecte les croyances de chaque élève.'),
    item('CM2', 1, 'Pourquoi l\'école devient-elle gratuite en 1881 ?', 'pour que tous les enfants, riches ou pauvres, puissent y aller', ['pour que seuls les riches y aillent', 'pour fermer les écoles', 'pour supprimer les enseignants'], 'La gratuité permet à chaque enfant d\'apprendre, sans payer.'),
    item('CM2', 1, 'Qu\'apprend-on d\'abord à l\'école primaire de la IIIe République ?', 'lire, écrire et compter', ['conduire une voiture', 'utiliser Internet', 'piloter un avion'], 'Ce sont les bases de l\'instruction, comme aujourd\'hui.'),
    // CM2 — récapitulation : dates et principes républicains.
    item('CM2', 1, 'En 1900, toutes les femmes françaises peuvent-elles déjà voter ?', 'Non, elles doivent attendre 1944.', ['Oui, toutes.', 'Seulement les femmes riches.', 'Seulement à Paris.'], 'Les femmes n\'obtiennent le droit de vote qu\'en 1944.'),
    item('CM2', 1, 'Sous la IIIe République, l\'école devient-elle gratuite ?', 'Oui, grâce à la loi de 1881.', ['Non, jamais.', 'Seulement pour les garçons.', 'Seulement en 1944.'], 'La loi de 1881 rend l\'école primaire gratuite.'),
    item('CM2', 1, 'Lequel de ces événements n\'appartient pas au XIXe siècle ?', 'la loi de 1905 sur la laïcité', ['la loi de 1848 sur l\'esclavage', 'la loi de 1882 sur l\'école', 'la naissance de la IIIe République'], 'La loi de 1905 a lieu au XXe siècle, les trois autres au XIXe.'),
    item('CM2', 1, 'Quel événement se produit en premier ?', 'l\'abolition de l\'esclavage, en 1848', ['les lois Jules Ferry, en 1881', 'la loi de 1905', 'le droit de vote des femmes, en 1944'], '1848 est la date la plus ancienne parmi ces événements.'),
    item('CM2', 1, 'Quel événement se produit en dernier ?', 'le droit de vote des femmes, en 1944', ['l\'abolition de l\'esclavage, en 1848', 'les lois Jules Ferry, en 1881', 'la loi de 1905'], '1944 est la date la plus récente parmi ces événements.'),
    item('CM2', 1, 'Combien d\'années séparent la naissance de la Ire et de la IIIe République ?', '78 ans', ['20 ans', '150 ans', '8 ans'], '1870 moins 1792 égale 78 ans.'),
    item('CM2', 1, 'La IIIe République est-elle la première République de France ?', 'Non, il y a eu la Ire et la IIe avant elle.', ['Oui, la première.', 'Cela dépend de l\'année.', 'Oui, la seule.'], 'La Ire République naît en 1792, la IIe en 1848.'),
    item('CM2', 1, 'Avant 1848, l\'esclavage est-il déjà interdit partout en France ?', 'Non, il n\'est aboli qu\'en 1848.', ['Oui, partout.', 'Cela dépend des régions.', 'Il n\'a jamais existé.'], 'L\'esclavage n\'est aboli dans les colonies françaises qu\'en 1848.'),
    item('CM2', 1, 'Sous la République, les citoyens élisent-ils leurs représentants ?', 'Oui, c\'est le principe même de la République.', ['Non, jamais.', 'Seulement les nobles votent.', 'Seulement le roi décide.'], 'C\'est le principe même de la République : le pouvoir vient du vote des citoyens.'),
    item('CM2', 1, 'Lequel de ces droits n\'existait pas encore en 1900 ?', 'le droit de vote des femmes', ['le droit de vote des hommes', 'l\'école gratuite', 'l\'abolition de l\'esclavage'], 'Les femmes n\'obtiennent ce droit qu\'en 1944.'),
    item('CM2', 1, 'Pourquoi dit-on que la loi de 1905 rend la France laïque ?', 'l\'État ne favorise ni ne finance aucune religion', ['l\'État interdit toutes les religions', 'l\'État impose une seule religion', 'l\'État finance toutes les écoles religieuses'], 'Chacun reste libre de croire ou de ne pas croire.'),
    item('CM2', 1, 'Que doit faire un citoyen pour élire ses représentants ?', 'voter lors d\'une élection', ['payer un impôt spécial', 'aller à l\'église', 'posséder une terre'], 'Le vote est le moyen pour les citoyens de choisir leurs représentants.'),
    item('CM2', 1, 'Qui est institutrice et figure de la Commune de Paris, en 1871 ?', 'Louise Michel', ['Marie Curie', 'Olympe de Gouges', 'Victor Hugo'], 'Elle défend les idées de la Commune, un soulèvement parisien.'),
    item('CM2', 1, 'Qu\'est-ce que la Commune de Paris, en 1871 ?', 'un soulèvement populaire à Paris', ['une loi sur l\'école', 'une guerre mondiale', 'un traité européen'], 'Les Parisiens se soulèvent après la défaite de 1870, mais sont réprimés.'),
    item('CM2', 1, 'Environ combien de temps dure la Commune de Paris, au printemps 1871 ?', 'environ deux mois', ['dix ans', 'un jour', 'un an'], 'Elle est écrasée en mai 1871, après environ deux mois.'),
    item('CM2', 1, 'Que veut dire voter « à bulletin secret » ?', 'personne ne connaît le choix de chacun', ['tout le monde vote à voix haute', 'seul le maire vote', 'le vote est payant'], 'Cela protège la liberté de chaque électeur.'),
    item('CM2', 1, 'Qui a le droit de voter en France, avant 1944 ?', 'seulement les hommes', ['seulement les femmes', 'tout le monde', 'seulement les nobles'], 'Les femmes ne votent qu\'à partir de 1944.'),
    item('CM2', 1, 'Pourquoi Jules Ferry choisit-il de rendre l\'école laïque ?', 'pour qu\'elle respecte toutes les croyances', ['pour interdire toutes les religions', 'pour imposer une religion', 'pour fermer les églises'], 'L\'école publique n\'enseigne aucune religion en particulier.'),
    item('CM2', 1, 'Comment appelle-t-on l\'ensemble des droits et des devoirs d\'un citoyen français ?', 'la citoyenneté', ['la royauté', 'la seigneurie', 'la colonie'], 'Elle comprend le droit de vote et le respect des lois.'),
    item('CM2', 1, 'Pourquoi la République choisit-elle un hymne et un drapeau ?', 'pour unir les Français autour de symboles communs', ['pour remplacer les impôts', 'pour interdire les fêtes', 'pour supprimer les écoles'], 'Ces symboles rappellent les valeurs de la République.'),
    item('CM2', 1, 'Quels penseurs du XVIIIe siècle inspirent les idées de liberté de la République ?', 'les philosophes des Lumières', ['les rois de France', 'les seigneurs féodaux', 'les papes'], 'Voltaire, Rousseau et d\'autres défendent la raison et la liberté.'),
    item('CM2', 1, 'Que voit-on souvent dans les villes de France le soir du 14 juillet ?', 'un défilé et un feu d\'artifice', ['une messe obligatoire', 'une élection', 'un jour de classe'], 'C\'est la fête nationale de la République française.'),
    item('CM2', 1, 'Combien de couleurs compte le drapeau français ?', 'trois', ['deux', 'quatre', 'cinq'], 'Bleu, blanc et rouge, à parts égales.'),
    item('CM2', 1, 'Que devient le suffrage quand les femmes obtiennent le droit de vote, en 1944 ?', 'universel : tous les adultes peuvent voter', ['réservé aux hommes seulement', 'réservé aux riches seulement', 'supprimé pour tous'], 'Le suffrage devient enfin universel, pour les hommes et les femmes.'),
    item('CM2', 1, 'Comment appelle-t-on le vote où chaque citoyen compte pour une voix égale ?', 'le suffrage universel', ['le suffrage censitaire', 'le vote du seigneur', 'le vote du roi'], 'Chaque citoyen compte pour une voix, quelle que soit sa richesse.'),
    item('CM2', 1, 'Avant le suffrage universel, qui pouvait voter en France ?', 'seulement les hommes assez riches', ['tous les hommes et toutes les femmes', 'seulement les enfants', 'personne'], 'Le suffrage censitaire réservait le vote aux plus riches.'),
    item('CM2', 1, 'Pourquoi la loi de 1881 protège-t-elle la liberté de la presse ?', 'pour que les journaux puissent informer librement', ['pour empêcher les journaux d\'écrire', 'pour que seul l\'État écrive les journaux', 'pour supprimer les journaux'], 'Elle protège la liberté d\'expression des journalistes.'),
    // CM2 — l'âge industriel.
    item('CM2', 2, 'Avec quelle énergie fonctionnent les machines à vapeur ?', 'le charbon', ['le soleil', 'le vent', 'l\'électricité des éoliennes'], 'On brûle du charbon pour chauffer l\'eau et produire la vapeur.'),
    item('CM2', 2, 'Où travaillent les mineurs ?', 'au fond des mines de charbon', ['dans les grands magasins', 'dans les champs', 'sur les bateaux'], 'Ils sortent le charbon de la terre. Leur travail est dur et dangereux.'),
    item('CM2', 2, 'Quel nouveau moyen de transport se développe au XIXe siècle ?', 'le chemin de fer', ['l\'avion à réaction', 'la fusée', 'le TGV'], 'Les premiers trains roulent en France vers 1830.'),
    item('CM2', 2, 'Qu\'est-ce qu\'un grand magasin, comme ceux qui ouvrent à Paris au XIXe siècle ?', 'un magasin où l\'on vend de tout, sur plusieurs étages', ['une usine de charbon', 'une ferme', 'une mine'], 'Les premiers ouvrent à Paris vers 1850.'),
    item('CM2', 2, 'Au XIXe siècle, des enfants :', 'travaillent dans les usines et les mines', ['ne travaillent jamais', 'vont tous au collège', 'votent aux élections'], 'Une première loi limite le travail des enfants en 1841.'),
    item('CM2', 2, 'Pourquoi de nombreux paysans partent-ils vivre en ville au XIXe siècle ?', 'pour trouver du travail dans les usines', ['pour partir en vacances', 'pour aller au collège', 'pour devenir seigneurs'], 'C\'est l\'exode rural.'),
    item('CM2', 2, 'Quel monument en fer est construit à Paris pour l\'Exposition universelle de 1889 ?', 'la tour Eiffel', ['Notre-Dame', 'l\'Arc de triomphe', 'le château de Versailles'], 'L\'entreprise de Gustave Eiffel la construit en fer. C\'est un symbole de l\'âge industriel.'),
    // CM2 — guerres mondiales et Europe.
    item('CM2', 3, 'Où vivent et combattent les soldats de 1914-1918 ?', 'dans des tranchées', ['dans des châteaux forts', 'sur des caravelles', 'dans des grands magasins'], 'Les tranchées sont des fossés creusés dans la terre, face à l\'ennemi.'),
    item('CM2', 3, 'Quelle bataille de 1916 reste un symbole de la Grande Guerre ?', 'Verdun', ['Marignan', 'Alésia', 'Waterloo'], 'La bataille de Verdun dure presque toute l\'année 1916.'),
    item('CM2', 3, 'Que rappelle le 11 novembre ?', 'l\'armistice de 1918, la fin de la Première Guerre mondiale', ['la prise de la Bastille', 'la fin de la Seconde Guerre mondiale', 'l\'arrivée de l\'euro'], 'Le 11 novembre 1918, les combats cessent.'),
    item('CM2', 3, 'Qui lance un appel à continuer le combat depuis Londres, le 18 juin 1940 ?', 'le général de Gaulle', ['Jules Ferry', 'Louis XIV', 'Victor Hugo'], 'Il demande aux Français de continuer à se battre.'),
    item('CM2', 3, 'Que se passe-t-il le 6 juin 1944 ?', 'le débarquement des Alliés en Normandie', ['l\'armistice de 1918', 'la prise de la Bastille', 'le traité de Rome'], 'Les Alliés arrivent sur les plages de Normandie. La libération de la France commence.'),
    item('CM2', 3, 'Que rappelle le 8 mai ?', 'la victoire de 1945 et la fin de la guerre en Europe', ['l\'armistice de 1918', 'la naissance de la République', 'la création de l\'euro'], 'Le 8 mai 1945, l\'Allemagne nazie s\'avoue vaincue.'),
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
    item('CM1', 1, 'Une paroisse, c\'est :', 'le village ou le quartier autour d\'une église', ['le domaine d\'un seigneur', 'une ville fortifiée', 'une abbaye de moines'], 'Au Moyen Âge, chaque village forme une paroisse autour de son église.'),
    item('CM1', 1, 'Le clergé, ce sont :', 'les hommes et les femmes d\'Église', ['les chevaliers', 'les paysans', 'les marchands'], 'Prêtres, moines, moniales, évêques forment le clergé.'),
    item('CM1', 1, 'Une abbaye est :', 'un monastère où vivent des moines ou des moniales', ['le château du seigneur', 'une place de marché', 'une ferme'], 'L\'abbaye est dirigée par un abbé ou une abbesse.'),
    item('CM1', 1, 'Une cathédrale est :', 'l\'église de l\'évêque, dans une ville', ['la chapelle d\'un château', 'la maison du curé', 'un moulin'], 'La cathédrale est la grande église où siège l\'évêque.'),
    item('CM1', 1, 'À quoi reconnaît-on l\'art gothique ?', 'des voûtes très hautes et de grands vitraux', ['des murs épais et de petites fenêtres', 'des toits plats en béton', 'des murs de verre et d\'acier'], 'Les églises gothiques sont très hautes et pleines de lumière.'),
    item('CM1', 1, 'À quoi reconnaît-on l\'art roman ?', 'des murs épais et de petites fenêtres', ['des voûtes très hautes et de grands vitraux', 'des murs de verre et d\'acier', 'des toits plats'], 'Les églises romanes sont massives et plutôt sombres.'),
    item('CM1', 1, 'Un seigneur est :', 'un noble qui domine une seigneurie', ['un paysan libre', 'un moine', 'un marchand ambulant'], 'Il protège les habitants, qui lui doivent des taxes et du travail.'),
    item('CM1', 1, 'Un château fort est :', 'une demeure fortifiée où vit le seigneur', ['une grande église', 'une ferme de paysans', 'un marché couvert'], 'Murailles, tours, fossés et donjon le protègent des attaques.'),
    item('CM1', 1, 'Un moine est :', 'un homme qui consacre sa vie à Dieu, dans un monastère', ['un guerrier à cheval', 'un paysan', 'un marchand'], 'Les moines prient, travaillent et étudient dans les abbayes.'),
    item('CM1', 1, 'Un artisan est :', 'une personne qui fabrique des objets de ses mains', ['un seigneur', 'un moine', 'un chevalier'], 'Forgerons, potiers, tisserands, cordonniers sont des artisans.'),
    item('CM1', 1, 'Un vitrail est :', 'une fenêtre faite de morceaux de verre colorés', ['une tour de château', 'un livre recopié', 'un outil de paysan'], 'Les cathédrales gothiques sont célèbres pour leurs grands vitraux.'),
    // CM1 — la seigneurie, le château et la chevalerie.
    item('CM1', 1, 'Un fief est :', 'une terre donnée par le seigneur à son vassal', ['une terre appartenant à l\'Église', 'un marché couvert', 'une prison royale'], 'Le vassal l\'administre en échange de fidélité.'),
    item('CM1', 1, 'Un vassal est :', 'un noble qui doit fidélité à un seigneur plus puissant', ['un paysan libre', 'un moine copiste', 'un marchand ambulant'], 'Il reçoit un fief en échange de son aide.'),
    item('CM1', 1, 'L\'hommage féodal est :', 'la cérémonie où le vassal promet fidélité à son seigneur', ['un impôt payé à l\'Église', 'une fête de village', 'un pèlerinage religieux'], 'Le vassal s\'engage à aider et à combattre pour son seigneur.'),
    item('CM1', 1, 'Le cens est :', 'une redevance payée par le paysan pour sa terre', ['la part des récoltes donnée à l\'Église', 'une fête au château', 'un voyage en bateau'], 'C\'est un impôt versé au seigneur propriétaire de la terre.'),
    item('CM1', 1, 'Une banalité est :', 'le droit du seigneur d\'imposer l\'usage payant de son four', ['le titre d\'un chevalier', 'un livre religieux', 'une carte de navigation'], 'Les paysans doivent utiliser et payer le four, le moulin ou le pressoir du seigneur.'),
    item('CM1', 1, 'Une jachère est :', 'une terre qu\'on laisse reposer une année sans la cultiver', ['un champ toujours cultivé', 'une terre inondée', 'un jardin de moine'], 'Se reposer rend la terre plus fertile l\'année suivante.'),
    item('CM1', 1, 'L\'assolement triennal, c\'est :', 'partager les champs en trois parties cultivées à tour de rôle', ['labourer chaque jour de la semaine', 'planter uniquement des fleurs', 'récolter trois fois par jour'], 'Cette méthode permet à la terre de mieux se reposer.'),
    item('CM1', 1, 'Le moulin banal est :', 'le moulin du seigneur, que les paysans doivent utiliser', ['un moulin appartenant à chaque paysan', 'un moulin construit par le roi', 'un moulin de l\'abbaye seulement'], 'Les paysans y font moudre leur grain contre paiement.'),
    item('CM1', 1, 'Une corporation est :', 'une association qui regroupe les artisans d\'un même métier', ['une armée de chevaliers', 'un groupe de moines', 'une famille noble'], 'Chaque métier a ses propres règles, fixées par sa corporation.'),
    item('CM1', 1, 'Un apprenti est :', 'un jeune qui apprend un métier auprès d\'un artisan', ['un artisan très expérimenté', 'un chevalier débutant', 'un moine copiste'], 'Après plusieurs années, il peut devenir compagnon, puis maître.'),
    item('CM1', 1, 'Un compagnon, chez les artisans, est :', 'un artisan formé, qui n\'est pas encore maître', ['le chef d\'une abbaye', 'un jeune noble au château', 'un marchand de passage'], 'Entre l\'apprenti et le maître, il perfectionne son métier.'),
    item('CM1', 1, 'Un maître artisan est :', 'l\'artisan le plus expérimenté, qui peut ouvrir son atelier', ['un jeune apprenti', 'un seigneur', 'un moine'], 'Il a le droit de former des apprentis dans son atelier.'),
    item('CM1', 1, 'Une foire est :', 'un grand marché qui revient chaque année, pendant plusieurs jours', ['un petit magasin de village', 'une fête religieuse seulement', 'une bataille de chevaliers'], 'Des marchands de toute l\'Europe s\'y retrouvent pour commercer.'),
    item('CM1', 1, 'Un marché est :', 'un lieu où l\'on achète et vend chaque semaine', ['une grande ferme', 'un monastère', 'un tribunal'], 'On y trouve nourriture, tissus et outils.'),
    item('CM1', 1, 'Un rempart est :', 'un mur épais qui protège une ville ou un château', ['une porte de ferme', 'un pont de bois', 'un jardin clos'], 'Les remparts empêchent les ennemis d\'entrer facilement.'),
    item('CM1', 1, 'Un donjon est :', 'la plus haute et la plus sûre tour d\'un château', ['la cour des animaux', 'le fossé d\'eau', 'la porte principale'], 'Le seigneur peut s\'y réfugier en cas d\'attaque.'),
    item('CM1', 1, 'Une courtine est :', 'le mur qui relie deux tours d\'un château', ['la plus haute tour', 'le fossé d\'eau', 'la petite porte secrète'], 'Elle forme, avec les tours, l\'enceinte du château.'),
    item('CM1', 1, 'Les douves sont :', 'le fossé rempli d\'eau qui entoure un château', ['les tours du château', 'les portes du château', 'les jardins du château'], 'Elles rendent l\'attaque du château plus difficile.'),
    item('CM1', 1, 'Une herse, à l\'entrée d\'un château, est :', 'une grille de fer qu\'on abaisse pour bloquer le passage', ['un pont de pierre', 'une tour ronde', 'un jardin potager'], 'Elle complète le pont-levis pour fermer l\'entrée.'),
    item('CM1', 1, 'Un pont-levis est :', 'un pont qu\'on relève pour empêcher d\'entrer', ['un pont qui ne bouge jamais', 'une tour d\'angle', 'un mur épais'], 'On le relève avec des chaînes, depuis l\'intérieur du château.'),
    item('CM1', 1, 'Un créneau, en haut d\'une muraille, sert :', 'à s\'abriter pour surveiller ou tirer sur l\'ennemi', ['à faire entrer la lumière du soleil', 'à ranger les récoltes', 'à loger les animaux'], 'Les défenseurs se cachent entre deux créneaux.'),
    item('CM1', 1, 'Une meurtrière est :', 'une fente étroite dans un mur, pour tirer sans être vu', ['une grande fenêtre décorée', 'une porte principale', 'une salle de banquet'], 'Les défenseurs y glissent leurs flèches sans être exposés.'),
    item('CM1', 1, 'Le chemin de ronde est :', 'le passage en haut des murailles, pour surveiller', ['le chemin qui mène au village', 'la salle du seigneur', 'le jardin du château'], 'Les gardes y font le tour du château.'),
    item('CM1', 1, 'La basse-cour d\'un château est :', 'la cour extérieure où vivent serviteurs et animaux', ['la plus haute tour', 'le fossé d\'eau', 'la salle du trône'], 'On y trouve l\'étable, l\'écurie et des ateliers.'),
    item('CM1', 1, 'Une oubliette est :', 'une cellule sombre, tout en bas du donjon', ['une salle de fête', 'une chapelle du château', 'une écurie'], 'On y enfermait des prisonniers, parfois pour longtemps.'),
    item('CM1', 1, 'Une poterne est :', 'une petite porte secrète d\'un château', ['la plus haute tour', 'le fossé d\'eau', 'le pont principal'], 'Elle permet de sortir discrètement, sans être vu.'),
    item('CM1', 1, 'Un blason est :', 'un dessin qui identifie une famille noble', ['un impôt payé au seigneur', 'un livre religieux', 'une arme de guerre'], 'Chaque famille noble a son propre blason.'),
    item('CM1', 1, 'Les armoiries d\'une famille noble sont :', 'l\'ensemble des dessins et des couleurs de son blason', ['ses terres agricoles', 'ses soldats', 'ses impôts'], 'Elles permettent de reconnaître une famille noble de loin.'),
    item('CM1', 1, 'Un écuyer est :', 'un jeune noble qui apprend le métier de chevalier', ['un artisan du fer', 'un moine copiste', 'un marchand de tissus'], 'Il sert un chevalier avant de le devenir à son tour.'),
    item('CM1', 1, 'Un page, au château, est :', 'un jeune garçon noble qui apprend les bonnes manières', ['un artisan expérimenté', 'un prisonnier du donjon', 'un moine de l\'abbaye'], 'Il devient ensuite écuyer, puis peut-être chevalier.'),
    item('CM1', 1, 'L\'adoubement est :', 'la cérémonie qui fait d\'un écuyer un chevalier', ['la construction d\'un château', 'la récolte du blé', 'la messe du dimanche'], 'On y remet ses armes au nouveau chevalier.'),
    item('CM1', 1, 'Un tournoi est :', 'un combat d\'entraînement entre chevaliers, lors d\'une fête', ['un marché de village', 'une prière collective', 'une récolte de blé'], 'Les chevaliers s\'y affrontent à cheval, avec des lances.'),
    item('CM1', 1, 'Une joute est :', 'un duel à cheval entre deux chevaliers armés d\'une lance', ['une danse de fête', 'une prière du soir', 'une récolte collective'], 'Chacun essaie de faire tomber son adversaire de son cheval.'),
    item('CM1', 1, 'Une quintaine est :', 'un jeu où l\'on vise une cible avec une lance, à cheval', ['une danse de fête', 'une prière du soir', 'une récolte de blé'], 'Elle aide les futurs chevaliers à s\'entraîner avant les tournois.'),
    item('CM1', 1, 'Un chevalier est :', 'un noble qui combat à cheval pour son seigneur', ['un paysan qui travaille la terre', 'un moine qui prie', 'un marchand qui voyage'], 'Il porte une armure et se bat avec une lance ou une épée.'),
    item('CM1', 1, 'Une lance, arme du chevalier, est :', 'une longue arme pointue utilisée à cheval', ['une armure de métal', 'un bouclier rond', 'une petite dague'], 'Elle permet de frapper l\'adversaire de loin, à cheval.'),
    item('CM1', 1, 'Une armure est :', 'un équipement de métal qui protège le corps au combat', ['un vêtement de moine', 'un habit de paysan', 'une tunique de fête'], 'Elle protège le chevalier des coups de son adversaire.'),
    item('CM1', 1, 'Le code de chevalerie demande :', 'le courage, la loyauté et la protection des faibles', ['la richesse avant tout', 'la fuite devant le danger', 'le mensonge envers son seigneur'], 'Ce code guide la conduite d\'un bon chevalier.'),
    item('CM1', 1, 'Un colombier est :', 'une tour où le seigneur élève des pigeons', ['une prison du château', 'une salle de classe', 'un magasin de tissus'], 'Seul le seigneur a souvent le droit d\'avoir un colombier.'),
    item('CM1', 1, 'Une garenne est :', 'un terrain réservé à la chasse du seigneur, souvent aux lapins', ['un jardin potager du paysan', 'une salle de l\'abbaye', 'un marché couvert'], 'Les paysans n\'ont pas le droit d\'y chasser.'),
    item('CM1', 1, 'Un bailli est :', 'un représentant du seigneur qui rend la justice en son nom', ['un artisan qui travaille le bois', 'un jeune chevalier', 'un moine copiste'], 'Il s\'occupe aussi de collecter certains impôts.'),
    // CM1 — l'Église, l'abbaye et l'art médiéval.
    item('CM1', 1, 'Un abbé ou une abbesse est :', 'la personne qui dirige une abbaye', ['le chef d\'une paroisse', 'le chef d\'une seigneurie', 'le chef d\'une ville'], 'L\'abbé dirige les moines, l\'abbesse dirige les moniales.'),
    item('CM1', 1, 'Un évêque est :', 'le chef religieux d\'un diocèse, souvent dans une grande ville', ['le chef d\'une abbaye seulement', 'le chef d\'un village', 'le chef d\'une armée'], 'Il a autorité sur tous les curés de son diocèse.'),
    item('CM1', 1, 'Un diocèse est :', 'le territoire dirigé par un évêque', ['le territoire d\'un seigneur', 'une grande ferme', 'un marché couvert'], 'Chaque diocèse regroupe plusieurs paroisses.'),
    item('CM1', 1, 'Un scriptorium est :', 'la salle d\'une abbaye où les moines recopient des livres', ['la salle où l\'on prie ensemble', 'la salle où l\'on mange', 'la salle où l\'on dort'], 'Sans imprimerie, chaque livre y est recopié à la main.'),
    item('CM1', 1, 'Un hôtel-Dieu est :', 'un lieu tenu par des religieux pour soigner les malades', ['la maison du seigneur', 'une école pour tous les enfants', 'un marché couvert'], 'Il accueille souvent les malades qui n\'ont pas d\'argent.'),
    item('CM1', 1, 'Un pèlerin est :', 'une personne qui voyage vers un lieu saint', ['un artisan du fer', 'un chevalier en tournoi', 'un marchand de foire'], 'Il marche parfois des mois pour atteindre ce lieu.'),
    item('CM1', 1, 'Des reliques sont :', 'des objets religieux que l\'on vénère, liés à un saint', ['des pièces de monnaie', 'des outils de ferme', 'des armes de chevalier'], 'Certaines abbayes attirent des pèlerins venus voir leurs reliques.'),
    item('CM1', 1, 'Un cloître, dans une abbaye, est :', 'une cour intérieure bordée de galeries', ['la plus haute tour d\'un château', 'le marché du village', 'le fossé d\'un château'], 'Les moines s\'y promènent et y méditent en silence.'),
    item('CM1', 1, 'Un réfectoire, dans une abbaye, est :', 'la salle où les moines prennent leurs repas', ['la salle où l\'on dort', 'la salle où l\'on recopie les livres', 'la salle où l\'on prie'], 'Les repas y sont souvent pris en silence.'),
    item('CM1', 1, 'Un dortoir, dans une abbaye, est :', 'la salle où dorment les moines', ['la salle des repas', 'la bibliothèque de l\'abbaye', 'la salle de prière'], 'Les moines y dorment tous ensemble.'),
    item('CM1', 1, 'Un verrier est :', 'un artisan qui fabrique les vitraux', ['un artisan qui travaille le fer', 'un artisan qui tisse la laine', 'un artisan qui cuit le pain'], 'Il assemble des morceaux de verre coloré avec du plomb.'),
    item('CM1', 1, 'Un tailleur de pierre est :', 'un artisan qui sculpte et façonne la pierre', ['un artisan qui fabrique le pain', 'un artisan qui tisse le tissu', 'un artisan qui soigne les malades'], 'Il façonne les pierres des cathédrales et des châteaux.'),
    item('CM1', 1, 'Un charpentier est :', 'un artisan qui construit des structures en bois', ['un artisan qui travaille le verre', 'un artisan qui travaille le fer', 'un artisan qui cultive la terre'], 'Il construit les toits et les charpentes des bâtiments.'),
    item('CM1', 1, 'Une rosace, dans une cathédrale, est :', 'une grande fenêtre ronde décorée de vitraux', ['une petite porte secrète', 'un fossé rempli d\'eau', 'une tour de guet'], 'Elle laisse entrer une lumière colorée dans l\'église.'),
    item('CM1', 1, 'Un arc-boutant est :', 'un support extérieur qui soutient les murs d\'une cathédrale', ['une fenêtre ronde décorée', 'une petite chapelle', 'un escalier en pierre'], 'Il permet de construire des murs plus hauts et plus légers.'),
    item('CM1', 1, 'Un arc brisé est :', 'un arc pointu, typique de l\'art gothique', ['un arc arrondi de l\'art roman', 'un mur épais sans fenêtre', 'une tour de guet'], 'Il remplace peu à peu l\'arc arrondi de l\'art roman.'),
    item('CM1', 1, 'Un arc en plein cintre est :', 'un arc arrondi, en demi-cercle, de l\'art roman', ['un arc pointu de l\'art gothique', 'une grande fenêtre ronde', 'un support extérieur'], 'Il est typique des églises romanes, plus anciennes.'),
    item('CM1', 1, 'Une voûte, au plafond d\'une église, est :', 'une construction courbe qui soutient le toit', ['un plancher de bois', 'une porte d\'entrée', 'un escalier extérieur'], 'Les voûtes gothiques sont souvent très hautes.'),
    item('CM1', 1, 'La nef d\'une église est :', 'la grande salle centrale où se rassemblent les fidèles', ['la tour la plus haute', 'le jardin du cloître', 'la salle des moines'], 'C\'est la partie principale, la plus longue, de l\'église.'),
    item('CM1', 1, 'Un clocher est :', 'la tour d\'une église qui abrite les cloches', ['la salle où l\'on mange', 'le jardin du cloître', 'la salle des livres'], 'Les cloches sonnent pour appeler les habitants à la messe.'),
    item('CM1', 1, 'Une gargouille, sur une cathédrale, sert :', 'à évacuer l\'eau de pluie loin des murs', ['à décorer l\'intérieur de l\'église', 'à soutenir le clocher', 'à fermer les portes'], 'Sculptée en forme d\'animal, elle rejette l\'eau au loin.'),
    item('CM1', 1, 'Un contrefort est :', 'un renfort de pierre qui soutient un mur', ['une grande fenêtre ronde', 'une petite porte secrète', 'un escalier intérieur'], 'Il empêche le mur de s\'écrouler sous son propre poids.'),
    item('CM1', 1, 'Un cimetière paroissial est :', 'le lieu où l\'on enterre les morts, près de l\'église du village', ['le jardin du château', 'le marché du village', 'la salle des moines'], 'Il se trouve souvent juste autour de l\'église de la paroisse.'),
    item('CM1', 1, 'Un sceau, au Moyen Âge, sert à :', 'authentifier un document officiel, avec de la cire', ['moudre le grain', 'construire une cathédrale', 'labourer un champ'], 'On presse un objet gravé dans la cire pour signer un document.'),
    item('CM1', 1, 'Une enluminure est :', 'une décoration peinte et dorée dans un livre religieux', ['une arme de chevalier', 'un impôt payé à l\'Église', 'un vêtement de fête'], 'Les moines copistes décorent ainsi certains livres.'),
    item('CM1', 1, 'Un parchemin est :', 'une peau d\'animal préparée pour écrire', ['un outil pour labourer', 'une monnaie du Moyen Âge', 'un vêtement de paysan'], 'Avant le papier, on écrivait souvent sur du parchemin.'),
    // CM1 — la vie paysanne, les outils et les échanges.
    item('CM1', 1, 'Le torchis est :', 'un mélange de terre et de paille pour bâtir des murs', ['un tissu précieux', 'un outil agricole', 'un vêtement de moine'], 'Beaucoup de maisons paysannes ont des murs en torchis.'),
    item('CM1', 1, 'Le chaume est :', 'de la paille qui recouvre le toit de nombreuses maisons', ['un impôt payé à l\'Église', 'un outil pour labourer', 'un vêtement d\'hiver'], 'Le toit de chaume est courant chez les paysans.'),
    item('CM1', 1, 'Une charrue est :', 'un outil tiré par des bœufs pour labourer profondément', ['un outil pour couper le blé', 'un outil pour filer la laine', 'un outil pour construire un mur'], 'Elle retourne la terre plus profondément que l\'araire.'),
    item('CM1', 1, 'Un araire est :', 'un ancien outil, plus simple que la charrue, pour labourer', ['un vêtement de paysan', 'un impôt seigneurial', 'un outil pour moissonner'], 'La charrue, plus efficace, le remplace peu à peu.'),
    item('CM1', 1, 'Une faucille est :', 'un outil recourbé pour couper les céréales à la main', ['un outil pour labourer la terre', 'un outil pour filer la laine', 'un outil pour construire'], 'Elle sert pendant la moisson, en été.'),
    item('CM1', 1, 'Une faux, outil de paysan, sert à :', 'couper l\'herbe ou les céréales, d\'un grand geste', ['labourer profondément la terre', 'transporter le grain', 'moudre le blé'], 'Sa lame est plus longue que celle de la faucille.'),
    item('CM1', 1, 'Un moulin à vent est :', 'un moulin dont les ailes sont actionnées par le vent', ['un moulin actionné par un cheval', 'un moulin actionné par le feu', 'un moulin actionné par la marée'], 'Contrairement au moulin à eau, il n\'a pas besoin de rivière.'),
    item('CM1', 1, 'Une famine est :', 'un grave manque de nourriture qui touche toute une région', ['une grande fête de village', 'un impôt payé au seigneur', 'un voyage religieux'], 'Une mauvaise récolte peut provoquer une famine.'),
    item('CM1', 1, 'Une disette est :', 'un manque de nourriture, moins grave qu\'une famine', ['une grande récolte', 'une fête religieuse', 'un marché réussi'], 'Elle rend la vie des paysans plus difficile, sans provoquer une famine.'),
    item('CM1', 1, 'Une veillée est :', 'un moment le soir où les villageois se réunissent', ['un repas de midi', 'un jour de marché', 'une cérémonie religieuse'], 'On s\'y retrouve pour parler, chanter ou travailler ensemble.'),
    item('CM1', 1, 'Une chandelle est :', 'une petite lumière de cire ou de suif', ['un outil pour labourer', 'un vêtement chaud', 'un impôt seigneurial'], 'Elle éclaire faiblement les maisons, faute d\'électricité.'),
    item('CM1', 1, 'Une cotte est :', 'une longue tunique portée par les paysans', ['une armure de chevalier', 'un chapeau de fête', 'un outil agricole'], 'Elle est souvent tissée en laine ou en lin.'),
    item('CM1', 1, 'Un droit de passage est :', 'un péage payé pour traverser un pont ou une route', ['un impôt religieux', 'une fête annuelle', 'un titre de noblesse'], 'Le seigneur qui possède le pont peut faire payer son passage.'),
    item('CM1', 1, 'Un gué est :', 'un endroit peu profond où l\'on peut traverser une rivière', ['un pont de pierre solide', 'un fossé rempli d\'eau', 'une porte de château'], 'On peut y passer à pied ou avec une charrette.'),
    item('CM1', 1, 'Un bac, sur une rivière, est :', 'une embarcation qui transporte des voyageurs d\'une rive à l\'autre', ['un pont fixe en pierre', 'un moulin à eau', 'un puits de village'], 'Il évite de construire un pont sur toute la rivière.'),
    item('CM1', 1, 'Une échoppe est :', 'la petite boutique d\'un artisan', ['la maison du seigneur', 'une grande abbaye', 'un champ de blé'], 'L\'artisan y fabrique et y vend ses objets.'),
    item('CM1', 1, 'Un étal, sur un marché, est :', 'une table où un marchand présente ses produits', ['une charrette de foin', 'un puits du village', 'un four à pain'], 'Les acheteurs passent devant les étals pour choisir.'),
    item('CM1', 1, 'Une halle est :', 'un grand bâtiment couvert où se tient le marché', ['une tour de château', 'une salle de prière', 'un fossé d\'eau'], 'Elle protège marchands et clients de la pluie.'),
    item('CM1', 1, 'Un colporteur est :', 'un marchand ambulant qui vend de village en village', ['un artisan installé dans un atelier', 'un chevalier en tournoi', 'un moine copiste'], 'Il transporte ses marchandises à pied ou à dos d\'âne.'),
    item('CM1', 1, 'Une guilde de marchands est :', 'une association de marchands qui s\'entraident', ['une association de moines', 'une famille noble', 'une armée de chevaliers'], 'Comme les corporations d\'artisans, elle défend les intérêts de ses membres.'),
    item('CM1', 1, 'Une aumône est :', 'un don fait aux pauvres, souvent par charité', ['un impôt payé au seigneur', 'une fête de village', 'un outil agricole'], 'L\'Église encourage les chrétiens à faire l\'aumône aux pauvres.'),
    // CM1 — la monarchie.
    item('CM1', 2, 'Une monarchie absolue, c\'est :', 'un régime où le roi détient tous les pouvoirs', ['un régime où le peuple vote les lois', 'un pays sans roi', 'une assemblée de seigneurs'], 'Louis XIV fait les lois, rend la justice, décide de la guerre et de la paix.'),
    item('CM1', 2, 'Un mécène est quelqu\'un qui :', 'protège et finance des artistes', ['construit des cathédrales de ses mains', 'dirige une armée', 'soigne les malades'], 'François Ier est un roi mécène.'),
    item('CM1', 2, 'Les protestants sont :', 'des chrétiens séparés de l\'Église catholique', ['des soldats du roi', 'des explorateurs', 'des paysans révoltés'], 'Au XVIe siècle, la Réforme divise les chrétiens d\'Europe.'),
    item('CM1', 2, 'La société d\'ordres est divisée en :', 'clergé, noblesse et tiers état', ['rois, reines et princes', 'paysans, ouvriers et patrons', 'citoyens, élus et ministres'], 'Chacun appartient à l\'un des trois ordres.'),
    item('CM1', 2, 'Qui appartient au tiers état ?', 'les paysans, les artisans et les bourgeois', ['les évêques et les moines', 'les nobles et les chevaliers', 'le roi et sa famille'], 'Le tiers état regroupe tous ceux qui ne sont ni nobles ni membres du clergé.'),
    item('CM1', 2, 'La Renaissance est :', 'un renouveau des arts et des sciences', ['une guerre contre l\'Angleterre', 'la construction des châteaux forts', 'la fin de l\'esclavage'], 'Née en Italie, elle gagne la France au XVIe siècle.'),
    item('CM1', 2, 'Un privilège, c\'est :', 'un avantage réservé à certains, comme les nobles', ['un impôt payé par tous', 'une loi votée par le peuple', 'une fête religieuse'], 'Les nobles et le clergé ne paient pas certains impôts : ce sont des privilèges.'),
    item('CM1', 2, 'La noblesse, ce sont :', 'les nobles, qui ont des privilèges', ['les paysans', 'les hommes d\'Église', 'les marchands'], 'La noblesse est le deuxième ordre de la société.'),
    // CM1 — explorations, 1789.
    item('CM1', 3, 'Une colonie est :', 'un territoire conquis et dominé par un pays lointain', ['une région de France', 'un bateau d\'exploration', 'un marché africain'], 'Espagne, Portugal, puis France et Angleterre fondent des colonies en Amérique.'),
    item('CM1', 3, 'Un esclave est :', 'une personne privée de liberté, qui appartient à un maître', ['un soldat du roi', 'un paysan libre', 'un marchand'], 'Les esclaves sont achetés, vendus et forcés de travailler.'),
    item('CM1', 3, 'Les cahiers de doléances sont :', 'des cahiers où les Français écrivent leurs plaintes et leurs souhaits', ['les livres de comptes du roi', 'des cahiers d\'écolier', 'des cartes de navigation'], 'Ils sont rédigés au printemps 1789, avant les États généraux.'),
    item('CM1', 3, 'Un citoyen est :', 'une personne qui a des droits dans son pays', ['un sujet qui obéit au roi sans avoir de droits', 'un habitant de la campagne', 'un soldat étranger'], 'Avec la Révolution, les sujets du roi deviennent des citoyens.'),
    item('CM1', 3, 'Une Constitution est :', 'le texte qui fixe les règles et les droits du pays', ['une prison royale', 'un impôt', 'un château'], 'Les députés veulent donner une Constitution à la France.'),
    item('CM1', 3, 'Les Lumières sont :', 'des penseurs du XVIIIe siècle qui défendent la raison et la liberté', ['les lampes du château de Versailles', 'des navigateurs', 'des moines du Moyen Âge'], 'Voltaire, Rousseau, Diderot, Montesquieu : leurs idées inspirent la Révolution.'),
    item('CM1', 3, 'L\'Ancien Régime désigne :', 'la France des rois, avant la Révolution', ['la France après 1789', 'l\'Empire romain', 'la préhistoire'], 'On l\'appelle ainsi à partir de 1789.'),
    item('CM1', 3, 'La Bastille était :', 'une prison royale à Paris', ['le château du roi à Versailles', 'une cathédrale', 'un port'], 'Le roi pouvait y enfermer des gens sans procès.'),
    // CM2 — la République.
    item('CM2', 1, 'Une république est :', 'un régime où les citoyens élisent leurs représentants', ['un régime où le roi a tous les pouvoirs', 'un empire dirigé par un empereur', 'une seigneurie'], 'En république, le pouvoir vient des citoyens, par le vote.'),
    item('CM2', 1, 'Le suffrage universel, c\'est :', 'le droit de vote pour tous les citoyens', ['le vote réservé aux riches', 'le choix du roi par les nobles', 'une fête républicaine'], 'D\'abord pour les hommes en 1848, pour tous depuis 1944.'),
    item('CM2', 1, 'Une école laïque est :', 'une école neutre, sans enseignement religieux, ouverte à tous', ['une école réservée aux garçons', 'une école payante', 'une école dans une abbaye'], 'L\'école publique respecte les croyances de chacun.'),
    item('CM2', 1, 'Qu\'est-ce que La Marseillaise ?', 'l\'hymne national de la France', ['la devise de la République', 'une bataille', 'un journal'], 'Elle est écrite en 1792, pendant la Révolution.'),
    item('CM2', 1, 'Une suffragette est :', 'une femme qui lutte pour le droit de vote des femmes', ['une chanteuse d\'opéra', 'une ouvrière de la mine', 'une reine'], 'Les suffragettes réclament le droit de vote pour les femmes.'),
    item('CM2', 1, 'Le suffrage universel masculin, c\'est :', 'le droit de vote pour tous les hommes', ['le droit de vote pour les riches seulement', 'le droit de vote pour les femmes seulement', 'le choix du roi'], 'Il est établi en 1848.'),
    item('CM2', 1, 'Voter, c\'est :', 'choisir ses représentants lors d\'une élection', ['payer un impôt', 'faire la guerre', 'aller à l\'école'], 'Chaque citoyen donne sa voix en secret, dans l\'isoloir.'),
    item('CM2', 1, 'Un député est :', 'un élu qui vote les lois à l\'Assemblée nationale', ['un soldat', 'un maire de village', 'un juge'], 'Les députés sont élus par les citoyens.'),
    item('CM2', 1, 'La laïcité, c\'est :', 'la liberté de croire ou non, dans un État neutre', ['l\'obligation d\'avoir une religion', 'une fête religieuse', 'l\'interdiction de toutes les religions'], 'La loi de 1905 sépare les Églises et l\'État. La France est une République laïque.'),
    item('CM2', 1, 'Marianne est :', 'un symbole de la République française', ['une reine de France', 'une scientifique', 'une résistante'], 'Son buste se trouve dans les mairies.'),
    item('CM2', 1, 'Abolir l\'esclavage, c\'est :', 'le supprimer : plus personne ne peut être esclave', ['le rendre obligatoire', 'le réserver aux colonies', 'le rendre payant'], 'En France, l\'esclavage est aboli définitivement en 1848.'),
    item('CM2', 1, 'Une élection est :', 'un vote pour choisir des représentants', ['une fête nationale', 'un défilé militaire', 'une loi'], 'On élit le maire, les députés, le président de la République.'),
    item('CM2', 1, 'Un hymne national est :', 'un chant qui représente un pays', ['un drapeau', 'une devise', 'une fête'], 'L\'hymne national de la France est La Marseillaise.'),
    item('CM2', 1, 'L\'Assemblée nationale est :', 'le lieu où les députés débattent et votent les lois', ['le palais du roi', 'une école', 'un tribunal'], 'Elle siège au palais Bourbon, à Paris.'),
    item('CM2', 1, 'Un citoyen est :', 'une personne qui a des droits et des devoirs dans son pays', ['un roi ou une reine', 'un sujet sans aucun droit', 'un étranger sans papiers'], 'Il peut voter et doit respecter les lois.'),
    item('CM2', 1, 'La citoyenneté, c\'est :', 'l\'ensemble des droits et des devoirs d\'un citoyen', ['un impôt payé au roi', 'une fête nationale', 'un uniforme militaire'], 'Elle comprend le droit de vote et le respect des lois.'),
    item('CM2', 1, 'Une démocratie est :', 'un régime où le pouvoir vient du peuple, par le vote', ['un régime dirigé par un seul roi', 'un régime sans aucune loi', 'une armée de soldats'], 'La République française est une démocratie.'),
    item('CM2', 1, 'Un régime politique est :', 'la façon dont un pays est gouverné', ['un plat traditionnel', 'un uniforme scolaire', 'un jeu de société'], 'La monarchie, l\'empire et la république sont des régimes politiques.'),
    item('CM2', 1, 'Une monarchie est :', 'un régime où un roi ou une reine dirige le pays', ['un régime où le peuple vote les lois', 'une association de marchands', 'une école publique'], 'La France a été une monarchie avant de devenir une République.'),
    item('CM2', 1, 'Un empire, comme celui de Napoléon, est :', 'un régime dirigé par un empereur', ['un régime où le peuple vote', 'une association de villages', 'un marché international'], 'Napoléon Bonaparte devient empereur des Français en 1804.'),
    item('CM2', 1, 'Un empereur est :', 'le chef d\'un empire, comme Napoléon', ['un député élu', 'un citoyen ordinaire', 'un instituteur'], 'Napoléon Bonaparte, puis Napoléon III, sont empereurs des Français.'),
    item('CM2', 1, 'Une constitution est :', 'le texte qui fixe les règles et les droits d\'un pays', ['un impôt royal', 'une prison d\'État', 'un hymne national'], 'Elle organise les pouvoirs et protège les droits des citoyens.'),
    item('CM2', 1, 'Le gouvernement est :', 'l\'ensemble des ministres qui dirigent le pays', ['l\'ensemble des députés qui votent les lois', 'une armée de soldats', 'une association de marchands'], 'Il applique les lois votées par le Parlement.'),
    item('CM2', 1, 'Un ministre est :', 'une personne qui dirige un domaine du gouvernement', ['un député élu par les citoyens', 'un juge d\'un tribunal', 'un maire de village'], 'Jules Ferry est ministre de l\'Instruction publique.'),
    item('CM2', 1, 'Le Sénat est :', 'une assemblée qui vote les lois, avec l\'Assemblée nationale', ['le palais du président', 'une école pour les députés', 'un tribunal'], 'Sénateurs et députés forment le Parlement.'),
    item('CM2', 1, 'Un sénateur est :', 'un élu qui siège au Sénat', ['un élu qui siège seulement à la mairie', 'un ministre du gouvernement', 'un juge'], 'Il vote les lois avec les députés.'),
    item('CM2', 1, 'Le Parlement est :', 'l\'Assemblée nationale et le Sénat réunis', ['le palais du président seulement', 'une école de la République', 'un tribunal'], 'C\'est là que les lois sont votées.'),
    item('CM2', 1, 'Une loi est :', 'une règle écrite, votée, que tous doivent respecter', ['une fête nationale', 'un impôt seulement', 'un hymne'], 'Les députés et les sénateurs votent les lois.'),
    item('CM2', 1, 'Un isoloir est :', 'le petit espace où l\'on vote seul, en secret', ['le bureau du maire', 'la salle de classe', 'le palais du président'], 'Personne ne voit pour qui l\'on vote dans l\'isoloir.'),
    item('CM2', 1, 'Un bulletin de vote est :', 'le papier sur lequel on choisit son candidat', ['une carte d\'identité', 'un billet de train', 'un livret scolaire'], 'On le glisse dans une enveloppe, puis dans l\'urne.'),
    item('CM2', 1, 'Une urne électorale est :', 'la boîte où l\'on dépose son bulletin de vote', ['une bibliothèque', 'une salle de classe', 'un coffre du seigneur'], 'Chaque électeur y glisse son enveloppe.'),
    item('CM2', 1, 'Un électeur est :', 'une personne qui a le droit de voter', ['un enfant de moins de dix ans', 'un étranger sans papiers', 'un objet du vote'], 'En France, il faut être majeur pour être électeur.'),
    item('CM2', 1, 'Le suffrage censitaire, avant 1848, réservait le vote :', 'aux hommes assez riches', ['à tous les hommes et toutes les femmes', 'aux enfants', 'à personne'], 'Le suffrage universel de 1848 change cette règle.'),
    item('CM2', 1, 'Un principe républicain est :', 'une valeur fondamentale de la République, comme la liberté', ['un impôt payé à l\'Église', 'un outil agricole', 'une arme de guerre'], 'Liberté, égalité, fraternité sont des principes républicains.'),
    item('CM2', 1, 'La liberté, valeur de la République, c\'est :', 'le droit de penser, de croire et de s\'exprimer', ['le droit de commander les autres', 'l\'obligation de suivre une seule religion', 'l\'interdiction de voter'], 'Elle figure dans la devise de la République.'),
    item('CM2', 1, 'L\'égalité, valeur de la République, c\'est :', 'les mêmes droits pour tous les citoyens', ['des droits différents selon la richesse', 'des droits réservés aux hommes', 'des droits réservés aux nobles'], 'Elle figure dans la devise de la République.'),
    item('CM2', 1, 'La fraternité, valeur de la République, c\'est :', 'l\'entraide entre tous les citoyens', ['la guerre entre les citoyens', 'la richesse de quelques-uns', 'le silence obligatoire'], 'Elle figure dans la devise de la République.'),
    item('CM2', 1, 'Une révolution est :', 'un changement brutal et rapide du pouvoir dans un pays', ['une élection ordinaire', 'une fête nationale', 'une loi votée sans débat'], 'La Révolution de 1789 renverse la monarchie en France.'),
    item('CM2', 1, 'Un coup d\'État est :', 'la prise du pouvoir par la force, hors des élections', ['une élection légale', 'un vote à bulletin secret', 'une loi votée au Parlement'], 'Napoléon Bonaparte prend le pouvoir par un coup d\'État en 1799.'),
    item('CM2', 1, 'La Commune de Paris, en 1871, est :', 'un soulèvement populaire, réprimé par le gouvernement', ['une loi sur l\'école', 'une fête nationale', 'un traité de paix'], 'Les Parisiens se révoltent après la défaite de 1870.'),
    item('CM2', 1, 'Un défilé, comme celui du 14 juillet, est :', 'un cortège organisé pour une fête ou une cérémonie', ['un vote secret', 'une loi votée', 'un impôt payé'], 'Le défilé du 14 juillet célèbre la fête nationale.'),
    item('CM2', 1, 'Une devise nationale est :', 'une phrase courte qui résume les valeurs d\'un pays', ['un impôt national', 'un hymne chanté', 'un drapeau national'], '« Liberté, Égalité, Fraternité » est la devise de la France.'),
    item('CM2', 1, 'Le drapeau tricolore français est :', 'bleu, blanc et rouge', ['bleu, blanc et vert', 'rouge et jaune', 'noir, blanc et rouge'], 'Il est adopté pendant la Révolution française.'),
    item('CM2', 1, 'Le bonnet phrygien, porté par Marianne, symbolise :', 'la liberté', ['la royauté', 'la richesse', 'la guerre'], 'C\'est un très ancien symbole de liberté.'),
    item('CM2', 1, 'Le buste de Marianne, dans les mairies, représente :', 'la République française', ['le maire du village', 'une reine de France', 'une sainte de l\'Église'], 'On le trouve dans toutes les mairies de France.'),
    item('CM2', 1, 'Le Panthéon, à Paris, est :', 'un monument qui honore de grandes figures françaises', ['le palais du président', 'une cathédrale gothique', 'un marché couvert'], 'Victor Hugo et Marie Curie y sont honorés, parmi d\'autres.'),
    item('CM2', 1, 'L\'Hôtel de Ville de Paris est :', 'le lieu où siège la mairie de Paris', ['le palais du président', 'une école laïque', 'un tribunal'], 'Léon Gambetta y proclame la République, en 1870.'),
    item('CM2', 1, 'Une association, depuis la loi de 1901, est :', 'un groupe de personnes réunies librement pour un projet', ['un impôt obligatoire', 'une loi votée au Parlement', 'un ministère'], 'Cette loi garantit la liberté de créer une association.'),
    item('CM2', 1, 'La liberté de la presse, c\'est :', 'le droit des journaux d\'informer librement', ['l\'obligation d\'écrire ce que veut l\'État', 'l\'interdiction de publier un journal', 'le droit de mentir sans limite'], 'La loi de 1881 protège cette liberté.'),
    item('CM2', 1, 'Un journal, au XIXe siècle, sert à :', 'informer les citoyens de l\'actualité', ['voter aux élections', 'enseigner à l\'école', 'fabriquer des lois'], 'La liberté de la presse permet aux journaux de s\'exprimer.'),
    item('CM2', 1, 'Le droit de grève, reconnu en 1864, permet :', 'd\'arrêter le travail pour réclamer quelque chose', ['de voter deux fois', 'de refuser de payer ses impôts', 'de changer de métier'], 'Avant 1864, faire grève était interdit en France.'),
    item('CM2', 1, 'L\'instruction obligatoire, depuis 1882, signifie :', 'tous les enfants doivent apprendre, à l\'école ou chez eux', ['seuls les garçons doivent apprendre', 'personne n\'est obligé d\'apprendre', 'seuls les riches doivent apprendre'], 'Chaque enfant de 6 à 13 ans doit recevoir une instruction.'),
    item('CM2', 1, 'La gratuité de l\'école, depuis 1881, signifie :', 'les familles ne paient plus pour l\'école primaire publique', ['l\'école coûte plus cher qu\'avant', 'seuls les pauvres paient', 'l\'école est payante pour les filles'], 'Cette loi permet à tous les enfants d\'aller à l\'école.'),
    item('CM2', 1, 'Un instituteur ou une institutrice est :', 'une personne qui enseigne à l\'école primaire', ['un député élu', 'un ministre du gouvernement', 'un maire de village'], 'Sous la IIIe République, l\'école forme de nombreux instituteurs.'),
    item('CM2', 1, 'L\'école publique est :', 'une école gérée et financée par l\'État', ['une école payante réservée aux riches', 'une école religieuse seulement', 'une école interdite aux filles'], 'Elle est gratuite, laïque et obligatoire depuis les lois Ferry.'),
    item('CM2', 1, 'La neutralité religieuse de l\'État signifie :', 'l\'État ne favorise ni ne finance aucune religion', ['l\'État impose une seule religion', 'l\'État interdit toutes les religions', 'l\'État finance toutes les écoles religieuses'], 'C\'est le principe de la loi de 1905.'),
    item('CM2', 1, 'Un décret est :', 'une décision officielle prise par le gouvernement', ['une loi votée par les députés seulement', 'un impôt payé à l\'Église', 'une fête nationale'], 'Le gouvernement peut agir rapidement grâce à un décret.'),
    item('CM2', 1, 'Un mandat électoral est :', 'la durée pendant laquelle un élu exerce sa fonction', ['un impôt payé au roi', 'un hymne national', 'une fête religieuse'], 'Un député est élu pour un mandat de plusieurs années.'),
    item('CM2', 1, 'Une campagne électorale est :', 'la période où les candidats présentent leurs idées avant un vote', ['une bataille militaire', 'une fête religieuse', 'un impôt annuel'], 'Les candidats cherchent à convaincre les électeurs.'),
    item('CM2', 1, 'Un candidat, lors d\'une élection, est :', 'une personne qui se présente pour être élue', ['une personne qui compte les votes seulement', 'un enfant qui vote', 'un juge du tribunal'], 'Les électeurs choisissent parmi plusieurs candidats.'),
    item('CM2', 1, 'Le président de la République est :', 'la personne élue à la tête de l\'État', ['un roi héréditaire', 'un député parmi d\'autres', 'un ministre parmi d\'autres'], 'Contrairement à un roi, il est élu pour une durée limitée.'),
    item('CM2', 1, 'La majorité, en France, permet de voter à partir de :', '18 ans', ['13 ans', '21 ans', '25 ans'], 'Avant 1974, il fallait attendre 21 ans pour voter.'),
    item('CM2', 1, 'Une pétition est :', 'un texte signé par plusieurs personnes pour réclamer quelque chose', ['un impôt obligatoire', 'une loi déjà votée', 'un hymne national'], 'Les citoyens peuvent s\'en servir pour se faire entendre.'),
    item('CM2', 1, 'Un référendum est :', 'un vote où les citoyens répondent directement par oui ou par non', ['un vote réservé aux députés', 'une fête nationale', 'un impôt spécial'], 'C\'est une autre façon pour les citoyens de décider ensemble.'),
    item('CM2', 1, 'Un service public, comme l\'école, est :', 'un service organisé par l\'État pour tous les citoyens', ['un magasin privé', 'une entreprise à but lucratif', 'un club réservé aux riches'], 'L\'école, la poste et les hôpitaux publics sont des services publics.'),
    item('CM2', 1, 'Un impôt, sous la République, sert à :', 'financer les écoles, les routes et les services publics', ['payer uniquement le roi', 'financer seulement l\'armée du seigneur', 'payer l\'Église uniquement'], 'Les citoyens paient des impôts pour financer l\'État.'),
    item('CM2', 1, 'Une manifestation est :', 'un rassemblement pour exprimer une opinion, dans le respect de la loi', ['une élection présidentielle', 'un impôt spécial', 'une fête religieuse'], 'Les citoyens peuvent manifester pour défendre leurs idées.'),
    item('CM2', 1, 'Un préfet est :', 'le représentant de l\'État dans un département', ['un député élu par les citoyens', 'un maire de village', 'un juge du tribunal'], 'Il est nommé par le gouvernement, pas élu.'),
    item('CM2', 1, 'Un département, en France, est :', 'une division administrative du territoire', ['une association de marchands', 'un régime politique', 'une monnaie nationale'], 'La France compte une centaine de départements.'),
    item('CM2', 1, 'Une commune, en France, est :', 'un village ou une ville, avec sa mairie et son maire', ['un impôt national', 'une association religieuse', 'un régime politique'], 'Chaque commune est dirigée par un maire élu.'),
    item('CM2', 1, 'Un maire est :', 'l\'élu qui dirige une commune', ['le chef de l\'État', 'un député national', 'un juge'], 'Il est élu par le conseil municipal, choisi par les habitants.'),
    item('CM2', 1, 'Un conseil municipal est :', 'l\'ensemble des élus qui dirigent une commune, avec le maire', ['l\'Assemblée nationale', 'le gouvernement national', 'le Sénat'], 'Il est élu par les habitants de la commune.'),
    item('CM2', 1, 'Un tribunal est :', 'le lieu où la justice juge les conflits, selon la loi', ['le lieu où l\'on vote', 'le lieu où l\'on enseigne', 'le lieu où siègent les députés'], 'Sous la République, la justice applique les mêmes lois à tous.'),
    item('CM2', 1, 'Un juge est :', 'une personne qui rend la justice selon la loi', ['une personne élue pour voter les lois', 'une personne qui dirige une commune', 'une personne qui enseigne'], 'Il doit appliquer la loi de façon égale pour tous.'),
    item('CM2', 1, 'Les droits de l\'homme sont :', 'les droits fondamentaux que chaque personne doit avoir', ['les droits réservés aux hommes seulement', 'les droits réservés aux riches', 'les droits réservés aux Français'], 'Ils sont proclamés en 1789 et toujours défendus aujourd\'hui.'),
    item('CM2', 1, 'L\'esclavage, aboli en 1848, est :', 'le fait de posséder une personne comme un objet', ['un impôt payé au roi', 'un régime politique', 'une fête nationale'], 'L\'esclave n\'a alors aucun droit et doit obéir à son maître.'),
    item('CM2', 1, 'Un affranchi, après 1848, est :', 'un ancien esclave devenu libre', ['un ministre du gouvernement', 'un député élu', 'un artisan du fer'], 'L\'abolition de l\'esclavage rend libres tous les esclaves des colonies.'),
    item('CM2', 1, 'Le civisme, pour un citoyen, c\'est :', 'respecter les lois et participer à la vie du pays', ['ignorer les lois', 'refuser de voter toujours', 'vivre seul, loin des autres'], 'Voter, respecter les lois : c\'est faire preuve de civisme.'),
    item('CM2', 1, 'Un vote blanc, dans une élection, c\'est :', 'un bulletin déposé sans choisir de candidat', ['un bulletin déposé deux fois', 'le fait de ne pas se déplacer pour voter', 'le fait de voter pour tous les candidats'], 'Il est compté à part, différemment de l\'abstention.'),
    item('CM2', 1, 'Une réforme est :', 'un changement apporté à une loi ou une organisation', ['un impôt payé une seule fois', 'une fête nationale', 'un hymne national'], 'Les lois Jules Ferry sont une grande réforme de l\'école.'),
    item('CM2', 1, 'La nationalité française donne le droit de :', 'voter et d\'être protégé par l\'État français', ['ne payer aucun impôt', 'échapper à toutes les lois', 'voter dans tous les pays'], 'Elle est liée à la citoyenneté française.'),
    item('CM2', 1, 'Une carte d\'identité sert à :', 'prouver qui l\'on est', ['voter à une élection', 'payer ses impôts', 'aller à l\'école'], 'Elle atteste du nom, de la date de naissance et de la nationalité.'),
    item('CM2', 1, 'Un hémicycle est :', 'la salle en demi-cercle où siègent les députés', ['la salle où l\'on vote dans son bureau de vote', 'la salle de classe d\'une école', 'la salle d\'un tribunal'], 'Les députés y débattent et votent les lois, à l\'Assemblée nationale.'),
    item('CM2', 1, 'Un discours politique sert à :', 'présenter des idées et convaincre le public', ['voter une loi directement', 'compter les bulletins de vote', 'payer un impôt'], 'Les candidats et les élus prononcent des discours pour expliquer leurs idées.'),
    item('CM2', 1, 'L\'abstention, lors d\'une élection, c\'est :', 'le fait de ne pas voter', ['le fait de voter deux fois', 'le fait de voter en secret', 'le fait de compter les votes'], 'Un citoyen a le droit de voter, mais aussi de s\'abstenir.'),
    item('CM2', 1, 'Le dépouillement, après une élection, consiste à :', 'compter les bulletins de vote', ['distribuer les bulletins avant le vote', 'fermer les bureaux de vote', 'imprimer les affiches électorales'], 'On compte les voix pour connaître le résultat de l\'élection.'),
    item('CM2', 1, 'Un bureau de vote est :', 'le lieu où les citoyens viennent voter', ['le bureau du président', 'une salle de classe', 'un tribunal'], 'Chaque commune organise un ou plusieurs bureaux de vote.'),
    item('CM2', 1, 'Une carte électorale est :', 'le document qui permet de voter dans son bureau de vote', ['un billet de train', 'un livret scolaire', 'une carte d\'identité'], 'Elle indique où et pour qui l\'électeur peut voter.'),
    item('CM2', 1, 'Un parti politique est :', 'un groupe de personnes qui partagent des idées politiques', ['une association de moines', 'une équipe sportive', 'une association de marchands'], 'Chaque parti présente des candidats aux élections.'),
    item('CM2', 1, 'Un scrutin est :', 'l\'opération de voter pour élire quelqu\'un', ['un impôt annuel', 'une fête nationale', 'un hymne officiel'], 'Un scrutin peut avoir lieu en un ou deux tours.'),
    item('CM2', 1, 'Un second tour d\'élection a lieu quand :', 'aucun candidat n\'a obtenu assez de voix au premier tour', ['il y a eu une erreur de comptage', 'le président le décide seul', 'personne n\'a voté'], 'Les deux candidats arrivés en tête s\'affrontent alors.'),
    item('CM2', 1, 'L\'égalité devant la loi signifie :', 'la loi est la même pour tous, riches ou pauvres', ['les riches ont plus de droits', 'les nobles échappent à la loi', 'seuls les hommes doivent obéir à la loi'], 'C\'est un principe fondamental de la République.'),
    item('CM2', 1, 'La justice, sous la République, doit être :', 'la même pour tous les citoyens', ['différente selon la richesse', 'réservée aux nobles', 'décidée par le seigneur'], 'Chacun est jugé selon les mêmes lois.'),
    item('CM2', 1, 'La presse désigne :', 'l\'ensemble des journaux qui informent le public', ['l\'ensemble des écoles publiques', 'l\'ensemble des tribunaux', 'l\'ensemble des mairies'], 'La liberté de la presse permet aux journaux de s\'exprimer.'),
    item('CM2', 1, 'Un journaliste est :', 'une personne qui écrit et informe dans un journal', ['une personne qui vote les lois', 'une personne qui juge un procès', 'une personne qui dirige une commune'], 'La liberté de la presse protège son travail.'),
    item('CM2', 1, 'Une affiche électorale sert à :', 'présenter un candidat avant une élection', ['décorer une école', 'annoncer une fête religieuse', 'payer un impôt'], 'Les candidats affichent leurs idées pour convaincre les électeurs.'),
    item('CM2', 1, 'L\'unité nationale, symbolisée par le drapeau, c\'est :', 'le fait de former un seul pays, malgré les différences', ['le fait d\'être tous identiques', 'le fait de vivre seul', 'le fait de parler la même langue seulement'], 'Les symboles de la République rassemblent tous les Français.'),
    item('CM2', 1, 'La solidarité, valeur proche de la fraternité, c\'est :', 's\'entraider entre citoyens', ['se battre entre citoyens', 'ignorer les autres', 'payer plus d\'impôts que les autres'], 'Elle rapproche la fraternité, valeur de la devise républicaine.'),
    item('CM2', 1, 'Une loi électorale organise :', 'les règles d\'une élection', ['les règles d\'une école', 'les règles d\'un tribunal', 'les règles d\'une fête'], 'Elle fixe qui peut voter et comment voter.'),
    item('CM2', 1, 'Un vote à main levée, c\'est :', 'voter en levant la main, sans bulletin secret', ['voter par courrier uniquement', 'voter deux fois', 'voter à l\'école seulement'], 'Il est parfois utilisé dans une petite assemblée, mais pas pour une élection nationale.'),
    item('CM2', 1, 'Le vote par correspondance permet de :', 'voter sans se déplacer le jour de l\'élection', ['voter deux fois le même jour', 'annuler une élection', 'compter les bulletins'], 'L\'électeur envoie son bulletin par la poste.'),
    item('CM2', 1, 'Un mandat présidentiel est :', 'la durée pendant laquelle un président exerce sa fonction', ['un impôt payé chaque année', 'une loi sur l\'école', 'une fête nationale'], 'En France, le mandat du président dure aujourd\'hui cinq ans.'),
    // CM2 — l'âge industriel.
    item('CM2', 2, 'Qu\'appelle-t-on la révolution industrielle ?', 'l\'essor des machines et des usines', ['la prise de la Bastille', 'la fin de la monarchie', 'la découverte de l\'Amérique'], 'Au XIXe siècle, les machines transforment le travail et la vie.'),
    item('CM2', 2, 'Un ouvrier est :', 'une personne qui travaille dans une usine ou un atelier', ['un propriétaire de mine', 'un paysan du Moyen Âge', 'un noble'], 'Les ouvriers sont payés à la journée ou à la tâche.'),
    item('CM2', 2, 'Un syndicat est :', 'une association qui défend les droits des travailleurs', ['une usine', 'une banque', 'un grand magasin'], 'Les syndicats sont autorisés en France en 1884.'),
    item('CM2', 2, 'L\'exode rural, c\'est :', 'le départ des habitants des campagnes vers les villes', ['le départ des citadins vers la campagne', 'un voyage en Amérique', 'une grève'], 'Au XIXe siècle, beaucoup de paysans quittent les campagnes pour les villes.'),
    item('CM2', 2, 'Une grève, c\'est :', 'l\'arrêt du travail pour réclamer quelque chose', ['une fête à l\'usine', 'une nouvelle machine', 'un impôt'], 'Le droit de grève est reconnu en France en 1864.'),
    // CM2 — guerres mondiales et Europe.
    item('CM2', 3, 'Un armistice est :', 'un accord pour arrêter les combats', ['une bataille', 'une arme', 'un défilé militaire'], 'L\'armistice du 11 novembre 1918 met fin aux combats de la Grande Guerre.'),
    item('CM2', 3, 'Un poilu est :', 'un soldat français de la Première Guerre mondiale', ['un paysan du Moyen Âge', 'un résistant de 1944', 'un chevalier'], 'On surnomme ainsi les soldats français de 1914-1918.'),
    item('CM2', 3, 'Une tranchée est :', 'un fossé creusé où s\'abritent les soldats', ['un bateau de guerre', 'un avion', 'une ville fortifiée'], 'Les tranchées de 1914-1918 s\'étendent sur des centaines de kilomètres.'),
    item('CM2', 3, 'La Résistance, ce sont :', 'les femmes et les hommes qui luttent contre l\'occupant allemand', ['les soldats de Louis XIV', 'les ouvriers en grève', 'les députés de 1789'], 'Jean Moulin, Lucie Aubrac, et bien d\'autres, risquent leur vie.'),
    item('CM2', 3, 'L\'Union européenne est :', 'une association de pays européens qui coopèrent', ['un seul pays avec un roi', 'une armée', 'une monnaie seulement'], 'Ses pays décident ensemble de règles communes.'),
    item('CM2', 3, 'Une guerre mondiale est :', 'une guerre qui touche de nombreux pays, sur plusieurs continents', ['une guerre entre deux villages', 'une guerre au Moyen Âge', 'une guerre sans soldats'], 'Au XXe siècle, deux guerres mondiales ravagent le monde.'),
    item('CM2', 3, 'Un génocide est :', 'le massacre organisé de tout un peuple', ['une bataille gagnée', 'un traité de paix', 'une migration'], 'La Shoah est le génocide des Juifs d\'Europe.'),
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
    prompt: `${repere.year} : ${repere.label}. En quel siècle ?`,
    ...choose(rng, centuryLabel(century), wrong),
    explanation: `${repere.year} est dans le ${centuryLabel(century)}, qui va de ${(century - 1) * 100 + 1} à ${century * 100}.`,
  };
}

function dateQuestion(rng: Rng, repere: Repere, pool: Repere[]): Draft {
  const others = pool.filter((entry) => entry.year !== repere.year).map((entry) => String(entry.year));
  return {
    key: `date-${repere.year}-${repere.label}`,
    prompt: `${capitalize(repere.label)} : en quelle année ?`,
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
    prompt: 'Lequel de ces événements s\'est passé en premier ?',
    ...choose(rng, first.label, picked.filter((entry) => entry !== first).map((entry) => entry.label)),
    explanation: picked
      .sort((a, b) => a.year - b.year)
      .map((entry) => `${entry.year} : ${entry.label}.`)
      .join(' '),
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
    prompt: `Quelle lettre montre ${asked.label}, en ${asked.year} ?`,
    figure: timelineFigure(picked, letters),
    choices: ['A', 'B', 'C', 'D'],
    correctIndex: ['A', 'B', 'C', 'D'].indexOf(answer),
    explanation: `${asked.year} est à la lettre ${answer}.`,
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
    explanation: `${year} est dans le ${centuryLabel(century)}, qui va de ${(century - 1) * 100 + 1} à ${century * 100}.`,
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
