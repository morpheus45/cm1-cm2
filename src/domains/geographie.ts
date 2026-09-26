import type { Level, Question, Trimester } from '../types';
import type { Figure, Point, Shape } from '../lib/figures';
import { rngPick, type Rng } from '../lib/seededRandom';
import { assemble, choose, drawer, isEligible, type Draft, type WrittenItem } from './histoireGeographie';

/**
 * La géographie au CM1 et au CM2.
 *
 * CM1 — programme publié au BO n° 22 du 28 mai 2026, en vigueur au CM1 dès la
 * rentrée 2026 : la diversité des modes de vie dans le monde, le planisphère
 * comme repère tout au long de l'année.
 * - 1er trimestre : se repérer (continents, océans, la France) ; se nourrir ;
 * - 2e trimestre : les inégalités dans le monde ; se déplacer ;
 * - 3e trimestre : communiquer avec Internet.
 *
 * CM2 — programme de 2020, que le CM2 garde en 2026-2027 :
 * - 1er trimestre : se déplacer ;
 * - 2e trimestre : communiquer d'un bout à l'autre du monde grâce à Internet ;
 * - 3e trimestre : mieux habiter.
 */

type GeographyDomain = 'cartes' | 'habiter' | 'mots-geographie';

const item = (
  level: Level,
  trimester: Trimester,
  prompt: string,
  correct: string,
  wrong: string[],
  explanation?: string
): WrittenItem => ({ level, trimester, prompt, correct, wrong: wrong.filter((entry) => entry !== correct), explanation });

const CONTINENTS = ['l\'Afrique', 'l\'Amérique', 'l\'Antarctique', 'l\'Asie', 'l\'Europe', 'l\'Océanie'];
const OCEANS = ['l\'océan Atlantique', 'l\'océan Pacifique', 'l\'océan Indien', 'l\'océan Arctique', 'l\'océan Austral'];

/** « Sur quel continent se trouve… » : le pays, et son continent. */
const COUNTRIES: [Level, Trimester, string, string][] = [
  ['CM1', 1, 'la France', 'l\'Europe'],
  ['CM1', 1, 'la Chine', 'l\'Asie'],
  ['CM1', 1, 'l\'Inde', 'l\'Asie'],
  ['CM1', 1, 'le Brésil', 'l\'Amérique'],
  ['CM1', 1, 'le Canada', 'l\'Amérique'],
  ['CM1', 1, 'le Sénégal', 'l\'Afrique'],
  ['CM1', 1, 'l\'Égypte', 'l\'Afrique'],
  ['CM1', 1, 'l\'Australie', 'l\'Océanie'],
  ['CM2', 1, 'le Mexique', 'l\'Amérique'],
  ['CM2', 1, 'le Japon', 'l\'Asie'],
  ['CM2', 1, 'le Maroc', 'l\'Afrique'],
  ['CM2', 1, 'la Nouvelle-Zélande', 'l\'Océanie'],
];

export const ITEMS: Record<GeographyDomain, WrittenItem[]> = {
  cartes: [
    ...COUNTRIES.map(([level, trimester, country, continent]) =>
      item(level, trimester, `Sur quel continent se trouve ${country} ?`, continent, CONTINENTS, `${country.charAt(0).toUpperCase() + country.slice(1)} se trouve en ${continent.replace(/^l\'/, '')}.`)
    ),
    // CM1 — se repérer dans le monde et en France.
    item('CM1', 1, 'Quel est le plus grand océan du monde ?', 'l\'océan Pacifique', OCEANS, 'L\'océan Pacifique couvre à lui seul près d\'un tiers de la Terre.'),
    item('CM1', 1, 'Quel océan borde la côte ouest de la France ?', 'l\'océan Atlantique', OCEANS, 'L\'océan Atlantique borde la France à l\'ouest.'),
    item('CM1', 1, 'Quelle mer borde le sud de la France ?', 'la mer Méditerranée', ['la mer du Nord', 'la Manche', 'la mer Baltique'], 'La Méditerranée baigne les côtes du sud, de Perpignan à Nice, et la Corse.'),
    item('CM1', 1, 'Quelle mer sépare la France de l\'Angleterre ?', 'la Manche', ['la mer Méditerranée', 'la mer Noire', 'la mer Rouge'], 'La Manche sépare la France du Royaume-Uni.'),
    item('CM1', 1, 'Quel continent, recouvert de glace, entoure le pôle Sud ?', 'l\'Antarctique', CONTINENTS, 'L\'Antarctique est presque entièrement recouvert de glace.'),
    item('CM1', 1, 'Quel est le continent le plus peuplé ?', 'l\'Asie', CONTINENTS, 'Environ six habitants de la Terre sur dix vivent en Asie.'),
    item('CM1', 1, 'Sur la plupart des cartes, où se trouve le nord ?', 'en haut', ['en bas', 'à gauche', 'à droite'], 'Par convention, le nord est en haut de la carte.'),
    item('CM1', 1, 'Quelle est la capitale de la France ?', 'Paris', ['Lyon', 'Marseille', 'Bordeaux'], 'Paris est la capitale et la plus grande ville de France.'),
    item('CM1', 2, 'Combien de régions compte la France métropolitaine ?', '13', ['5', '22', '101'], 'Depuis 2016, la France métropolitaine compte 13 régions (et 101 départements en tout, outre-mer compris).'),
    item('CM1', 2, 'Quel fleuve traverse Paris ?', 'la Seine', ['la Loire', 'le Rhône', 'la Garonne'], 'La Seine traverse Paris avant de se jeter dans la Manche.'),
    item('CM1', 2, 'Quel est le plus long fleuve de France ?', 'la Loire', ['la Seine', 'le Rhône', 'la Garonne'], 'La Loire mesure un peu plus de 1 000 km.'),
    item('CM1', 2, 'Quel fleuve se jette dans la mer Méditerranée ?', 'le Rhône', ['la Seine', 'la Loire', 'la Garonne'], 'Le Rhône se jette dans la Méditerranée ; la Seine dans la Manche, la Loire et la Garonne dans l\'Atlantique.'),
    item('CM1', 2, 'Quelles montagnes séparent la France de l\'Espagne ?', 'les Pyrénées', ['les Alpes', 'le Jura', 'les Vosges'], 'Les Pyrénées forment la frontière entre la France et l\'Espagne.'),
    item('CM1', 2, 'Dans quelles montagnes se trouve le mont Blanc ?', 'les Alpes', ['les Pyrénées', 'le Massif central', 'le Jura'], 'Le mont Blanc, dans les Alpes, est le plus haut sommet d\'Europe de l\'Ouest.'),
    item('CM1', 2, 'Quels territoires sont des départements et régions d\'outre-mer ?', 'la Guadeloupe, la Martinique, la Guyane, La Réunion et Mayotte', ['la Corse, la Bretagne et l\'Alsace', 'le Québec et la Louisiane', 'le Maroc et l\'Algérie'], 'Ces cinq territoires lointains font partie de la France.'),
    item('CM1', 2, 'Sur quel continent se trouve la Guyane française ?', 'l\'Amérique', CONTINENTS, 'La Guyane est en Amérique du Sud, à côté du Brésil.'),
    item('CM1', 2, 'Dans quel océan se trouve l\'île de La Réunion ?', 'l\'océan Indien', OCEANS, 'La Réunion est une île de l\'océan Indien, près de Madagascar.'),
    item('CM1', 2, 'Dans quelle mer se trouvent la Guadeloupe et la Martinique ?', 'la mer des Caraïbes', ['la mer Méditerranée', 'la mer du Nord', 'la Manche'], 'Ce sont des îles des Antilles, dans la mer des Caraïbes.'),
    item('CM1', 2, 'Quelle grande île française se trouve dans la mer Méditerranée ?', 'la Corse', ['La Réunion', 'la Martinique', 'la Guadeloupe'], 'La Corse est une île de la Méditerranée.'),
    item('CM1', 3, 'Pour relier l\'Europe et l\'Amérique, les câbles d\'Internet traversent :', 'l\'océan Atlantique', OCEANS, 'Des câbles posés au fond de l\'Atlantique relient les deux continents.'),
    item('CM1', 3, 'Quel continent a le moins accès à Internet ?', 'l\'Afrique', ['l\'Europe', 'l\'Amérique', 'l\'Asie'], 'En Afrique, une grande partie des habitants n\'a pas encore accès à Internet.'),
    item('CM1', 3, 'Quelle est la deuxième ville de France par le nombre d\'habitants ?', 'Marseille', ['Lyon', 'Toulouse', 'Lille'], 'Après Paris vient Marseille, puis Lyon.'),
    // CM2 — se déplacer en France, en Europe, dans le monde.
    item('CM2', 1, 'Quelle est la capitale de l\'Espagne ?', 'Madrid', ['Barcelone', 'Lisbonne', 'Rome'], 'Madrid est la capitale de l\'Espagne.'),
    item('CM2', 1, 'Quelle est la capitale de l\'Italie ?', 'Rome', ['Milan', 'Madrid', 'Venise'], 'Rome est la capitale de l\'Italie.'),
    item('CM2', 1, 'Quelle est la capitale de l\'Allemagne ?', 'Berlin', ['Munich', 'Vienne', 'Bruxelles'], 'Berlin est la capitale de l\'Allemagne.'),
    item('CM2', 1, 'Quelle est la capitale du Royaume-Uni ?', 'Londres', ['Dublin', 'Édimbourg', 'Paris'], 'Londres est la capitale du Royaume-Uni.'),
    item('CM2', 1, 'Quel pays n\'a pas de frontière avec la France métropolitaine ?', 'le Portugal', ['la Belgique', 'l\'Allemagne', 'l\'Espagne'], 'Le Portugal touche l\'Espagne, mais pas la France.'),
    item('CM2', 1, 'Quel tunnel relie la France et l\'Angleterre ?', 'le tunnel sous la Manche', ['le tunnel du Mont-Blanc', 'le tunnel du Fréjus', 'le métro de Londres'], 'Ouvert en 1994, il passe sous la Manche.'),
    item('CM2', 1, 'Quel est le plus grand aéroport de France ?', 'Paris-Charles-de-Gaulle', ['Lyon-Saint-Exupéry', 'Nice-Côte d\'Azur', 'Toulouse-Blagnac'], 'C\'est aussi l\'un des plus grands aéroports d\'Europe.'),
    item('CM2', 2, 'Quel continent compte le plus d\'internautes ?', 'l\'Asie', ['l\'Europe', 'l\'Océanie', 'l\'Afrique'], 'L\'Asie est le continent le plus peuplé : elle compte aussi le plus d\'internautes.'),
    item('CM2', 2, 'Quel continent est le moins connecté à Internet ?', 'l\'Afrique', ['l\'Europe', 'l\'Amérique', 'l\'Asie'], 'En Afrique, une grande partie des habitants n\'a pas encore accès à Internet.'),
    item('CM2', 2, 'Les câbles sous-marins d\'Internet relient surtout :', 'les continents entre eux', ['les villages d\'une même région', 'les maisons d\'une rue', 'les classes d\'une école'], 'Ils traversent les océans pour relier les continents.'),
    item('CM2', 3, 'Quelles sont les trois plus grandes villes de France ?', 'Paris, Marseille et Lyon', ['Lille, Nantes et Rennes', 'Nice, Brest et Dijon', 'Bordeaux, Metz et Tours'], 'Par le nombre d\'habitants : Paris, puis Marseille, puis Lyon.'),
    item('CM2', 3, 'Où vivent la plupart des Français ?', 'en ville et autour des villes', ['à la montagne', 'sur des îles', 'dans des fermes isolées'], 'Environ huit Français sur dix vivent en ville ou dans leur périphérie.'),
    item('CM2', 3, 'Sur un plan de ville, que représente souvent la couleur verte ?', 'les parcs, les jardins et les espaces verts', ['les routes', 'les voies ferrées', 'les usines'], 'La légende du plan le précise toujours.'),
    item('CM2', 3, 'Sur une carte, que représente la couleur bleue ?', 'l\'eau : mers, lacs, fleuves et rivières', ['les forêts', 'les villes', 'les montagnes'], 'Par convention, l\'eau est en bleu sur les cartes.'),
  ],
  habiter: [
    // CM1 — se nourrir.
    item('CM1', 1, 'D\'où vient la plus grande partie de notre nourriture ?', 'de l\'agriculture, de l\'élevage et de la pêche', ['des usines de voitures', 'des mines', 'des forêts seulement'], 'Les agriculteurs, les éleveurs et les pêcheurs produisent notre nourriture.'),
    item('CM1', 1, 'Quelle céréale est l\'aliment de base dans une grande partie de l\'Asie ?', 'le riz', ['le blé', 'le seigle', 'l\'avoine'], 'Le riz est la base de l\'alimentation de milliards d\'Asiatiques.'),
    item('CM1', 1, 'Pourquoi trouve-t-on des bananes en France toute l\'année ?', 'elles sont importées de pays chauds', ['elles poussent partout en France', 'elles sont fabriquées en usine', 'elles se conservent dix ans'], 'Les bananes poussent dans les régions tropicales, puis voyagent par bateau.'),
    item('CM1', 1, 'Que produit un éleveur ?', 'de la viande, du lait, des œufs', ['du blé et du maïs', 'des voitures', 'du bois'], 'L\'éleveur élève des animaux.'),
    item('CM1', 1, 'Dans le monde, tout le monde mange-t-il à sa faim ?', 'Non : des centaines de millions de personnes souffrent de la faim.', ['Oui, partout dans le monde.', 'Seulement en Europe.', 'Plus personne n\'a faim depuis longtemps.'], 'La faim touche encore des centaines de millions de personnes.'),
    item('CM1', 1, 'Pourquoi manger des produits de saison, cultivés près de chez soi, est-il bon pour la planète ?', 'ils voyagent moins, donc ils polluent moins', ['ils sont toujours plus sucrés', 'ils poussent sans soleil', 'ils ne pourrissent jamais'], 'Moins de transport, c\'est moins de pollution.'),
    item('CM1', 1, 'D\'où vient le cacao du chocolat ?', 'de pays chauds, comme la Côte d\'Ivoire', ['de France', 'de Norvège', 'du Canada'], 'Le cacaoyer pousse dans les régions chaudes et humides ; la Côte d\'Ivoire en est le premier producteur.'),
    item('CM1', 1, 'Quelle céréale est très cultivée dans les grandes plaines françaises ?', 'le blé', ['le riz', 'le cacao', 'la canne à sucre'], 'La France est l\'un des grands producteurs de blé du monde.'),
    item('CM1', 1, 'Pourquoi ne mange-t-on pas la même chose dans tous les pays ?', 'cela dépend du climat, des cultures et des traditions', ['c\'est interdit par la loi', 'tout le monde mange pareil', 'les aliments ne voyagent jamais'], 'Le riz, le blé, le maïs ou le manioc ne poussent pas partout.'),
    item('CM1', 1, 'Quel aliment de base est très consommé en Amérique latine ?', 'le maïs', ['le riz au lait', 'le chocolat blanc', 'le pain de seigle'], 'Galettes et bouillies de maïs sont à la base de nombreux repas.'),
    item('CM1', 1, 'D\'où viennent les poissons que l\'on mange ?', 'de la pêche et de l\'élevage de poissons', ['des usines de conserves seulement', 'des champs de blé', 'des supermarchés, où ils naissent'], 'L\'élevage de poissons s\'appelle l\'aquaculture.'),
    item('CM1', 1, 'Que fait un agriculteur qui cultive des céréales ?', 'il sème, soigne et récolte le blé, le maïs ou le riz', ['il élève des vaches', 'il pêche en mer', 'il fabrique du pain en usine'], 'Les céréales sont la base de l\'alimentation dans le monde.'),
    // CM1 — les inégalités ; se déplacer.
    item('CM1', 2, 'Dans le monde, l\'accès à l\'eau potable est :', 'inégal : des millions de personnes en manquent', ['le même pour tout le monde', 'réservé à l\'Europe', 'sans importance pour la santé'], 'Dans certaines régions, il faut marcher longtemps pour trouver de l\'eau, qui n\'est pas toujours potable.'),
    item('CM1', 2, 'Pourquoi, dans certains pays, des enfants ne vont-ils pas à l\'école ?', 'leur famille est pauvre ou l\'école est trop loin', ['ils n\'aiment pas apprendre', 'l\'école est interdite partout', 'ils ont déjà tout appris'], 'La pauvreté et l\'éloignement empêchent encore beaucoup d\'enfants d\'aller à l\'école.'),
    item('CM1', 2, 'Qu\'est-ce qui montre les inégalités dans le monde ?', 'certains habitants n\'ont accès ni aux soins, ni à l\'eau, ni à l\'école', ['tous les habitants vivent de la même façon', 'tous les pays ont la même richesse', 'personne ne manque de rien'], 'Selon le pays où l\'on vit, on n\'a pas les mêmes chances.'),
    item('CM1', 2, 'Quel moyen de transport pollue le moins ?', 'le vélo', ['la voiture', 'l\'avion', 'le camion'], 'Le vélo et la marche ne rejettent aucun gaz polluant.'),
    item('CM1', 2, 'Pour aller vite de Paris à Marseille en train, on prend :', 'le TGV', ['le métro', 'le tramway', 'le bus de ville'], 'Le TGV roule jusqu\'à 320 km/h.'),
    item('CM1', 2, 'Pourquoi les grandes villes ont-elles souvent des embouteillages ?', 'beaucoup d\'habitants s\'y déplacent en voiture aux mêmes heures', ['les routes y sont interdites', 'il n\'y a pas de voitures', 'les feux sont toujours verts'], 'Aux heures de pointe, tout le monde part ou rentre en même temps.'),
    item('CM1', 2, 'Pour traverser l\'océan Atlantique rapidement, on prend :', 'l\'avion', ['le vélo', 'le tramway', 'la voiture'], 'L\'avion traverse l\'Atlantique en quelques heures.'),
    // CM1 — communiquer avec Internet.
    item('CM1', 3, 'Internet est :', 'un réseau mondial qui relie des ordinateurs et des téléphones', ['un seul très gros ordinateur', 'une chaîne de télévision', 'un livre'], 'Des milliards d\'appareils sont reliés entre eux.'),
    item('CM1', 3, 'Par où passent la plupart des données d\'Internet entre les continents ?', 'par des câbles posés au fond des océans', ['par des pigeons voyageurs', 'par des lignes de train', 'par la poste'], 'Des câbles sous-marins transportent l\'essentiel des données entre les continents.'),
    item('CM1', 3, 'Où sont stockées les vidéos, les photos et les messages d\'Internet ?', 'dans des centres de données, remplis d\'ordinateurs', ['dans les nuages du ciel', 'dans les écrans des téléphones seulement', 'dans les bibliothèques'], 'Ces centres de données consomment beaucoup d\'électricité.'),
    item('CM1', 3, 'Avant de croire une information trouvée sur Internet, il faut :', 'vérifier d\'où elle vient', ['la partager tout de suite', 'la croire si elle est drôle', 'l\'apprendre par cœur'], 'Une information sérieuse a une source que l\'on peut vérifier.'),
    item('CM1', 3, 'Tes données personnelles (nom, adresse, photos) :', 'se protègent : on ne les partage pas avec n\'importe qui', ['doivent être publiées partout', 'n\'ont aucune importance', 'appartiennent à tout le monde'], 'La loi protège les données personnelles ; il faut aussi les protéger soi-même.'),
    item('CM1', 3, 'Tout le monde a-t-il accès à Internet sur la Terre ?', 'Non : environ un habitant sur trois n\'y a pas accès.', ['Oui, tout le monde.', 'Seulement les enfants.', 'Personne en dehors de l\'Europe.'], 'L\'accès à Internet reste très inégal selon les pays.'),
    // CM2 — se déplacer.
    item('CM2', 1, 'Quel moyen de transport les Français utilisent-ils le plus pour aller travailler ?', 'la voiture', ['le vélo', 'le train', 'la trottinette'], 'Environ sept actifs sur dix vont travailler en voiture.'),
    item('CM2', 1, 'Pourquoi les habitants des communes périurbaines prennent-ils souvent la voiture ?', 'les transports en commun y sont rares', ['le vélo y est interdit', 'ils habitent au centre-ville', 'il n\'y a pas de routes'], 'Loin du centre, les bus et les trains passent moins souvent.'),
    item('CM2', 1, 'À Venise, en Italie, comment se déplace-t-on surtout ?', 'à pied et en bateau', ['en métro', 'en voiture', 'en tramway'], 'Venise est construite sur l\'eau : les canaux remplacent les rues.'),
    item('CM2', 1, 'Aux Pays-Bas, beaucoup d\'habitants se déplacent :', 'à vélo', ['à cheval', 'en téléphérique', 'en bateau à voile'], 'Le pays est plat et possède de très nombreuses pistes cyclables.'),
    item('CM2', 1, 'Que permet le métro dans une très grande ville ?', 'de se déplacer vite, sans embouteillages', ['de traverser l\'océan', 'de transporter du charbon', 'de monter en montagne'], 'Le métro circule sous terre, à l\'écart de la circulation.'),
    item('CM2', 1, 'Comment réduire la pollution due aux déplacements ?', 'prendre les transports en commun, le vélo, ou marcher', ['prendre la voiture pour chaque trajet', 'prendre l\'avion plus souvent', 'rouler plus vite'], 'Moins de voitures, c\'est moins de pollution.'),
    item('CM2', 1, 'Le TGV relie :', 'les grandes villes, à très grande vitesse', ['seulement les villages', 'les îles entre elles', 'les quartiers d\'une même ville'], 'Il relie les grandes villes françaises et européennes.'),
    item('CM2', 1, 'Comment voyagent la plupart des marchandises entre les continents ?', 'par bateau, dans des porte-conteneurs', ['à vélo', 'en tramway', 'par la poste'], 'Les grands navires porte-conteneurs transportent l\'essentiel des marchandises du monde.'),
    item('CM2', 1, 'À quoi sert une piste cyclable ?', 'à circuler à vélo en sécurité', ['à garer les voitures', 'à faire atterrir les avions', 'à faire passer les trains'], 'Séparée des voitures, elle protège les cyclistes.'),
    item('CM2', 1, 'Pourquoi prend-on l\'avion pour aller de Paris à la Guadeloupe ?', 'l\'île est très loin, de l\'autre côté de l\'océan', ['il n\'y a pas de routes à Paris', 'le train est interdit', 'la Guadeloupe est en Europe'], 'Le vol dure environ huit heures au-dessus de l\'océan Atlantique.'),
    item('CM2', 1, 'Pourquoi beaucoup de Français habitent-ils loin de leur travail ?', 'les logements sont souvent plus chers près des grandes villes', ['il est interdit d\'habiter en ville', 'ils aiment les embouteillages', 'les villes n\'ont pas de maisons'], 'Beaucoup s\'installent plus loin, où les logements coûtent moins cher, et font la route chaque jour.'),
    item('CM2', 1, 'À Tokyo, au Japon, comment se déplacent surtout les habitants ?', 'en train et en métro', ['à cheval', 'en bateau à voile', 'en téléphérique'], 'Tokyo possède l\'un des réseaux de trains et de métros les plus utilisés au monde.'),
    item('CM2', 1, 'Sur un long trajet, quel moyen de transport pollue le plus par voyageur ?', 'l\'avion', ['le train', 'le car', 'le bateau de croisière fluvial'], 'Pour un même trajet, un voyageur en avion rejette beaucoup plus de gaz polluants qu\'en train.'),
    item('CM2', 1, 'Pourquoi construit-on des lignes de tramway dans les villes ?', 'pour transporter beaucoup de monde en polluant moins', ['pour remplacer les trottoirs', 'pour transporter du charbon', 'pour faire atterrir les avions'], 'Un tramway électrique remplace des dizaines de voitures.'),
    // CM2 — Internet.
    item('CM2', 2, 'Grâce à Internet, on peut :', 'communiquer instantanément avec l\'autre bout du monde', ['voyager sans se déplacer', 'arrêter la pluie', 'se passer d\'électricité'], 'Un message fait le tour du monde en une fraction de seconde.'),
    item('CM2', 2, 'Que permet la fibre optique ?', 'une connexion à Internet très rapide', ['de fabriquer des vêtements', 'de voir la nuit', 'de produire de l\'électricité'], 'La fibre transporte les données à la vitesse de la lumière.'),
    item('CM2', 2, 'Qui a souvent le moins accès à Internet ?', 'un habitant d\'une campagne isolée, dans un pays pauvre', ['un habitant d\'une grande ville européenne', 'un élève d\'une école connectée', 'un employé de bureau'], 'La fracture numérique sépare les villes et les campagnes, les pays riches et les pays pauvres.'),
    item('CM2', 2, 'Que faut-il pour se connecter à Internet ?', 'un appareil et un réseau (câble, fibre, antenne ou satellite)', ['seulement un stylo', 'un bateau', 'un billet de train'], 'Sans réseau, pas d\'Internet.'),
    // CM2 — mieux habiter.
    item('CM2', 3, 'Pourquoi aménager des parcs et des jardins en ville ?', 'pour la nature, la fraîcheur et le bien-être des habitants', ['pour construire plus de parkings', 'pour chauffer les rues', 'pour faire du bruit'], 'Les arbres rafraîchissent la ville et accueillent les oiseaux et les insectes.'),
    item('CM2', 3, 'Que devient un déchet recyclé ?', 'une matière pour fabriquer de nouveaux objets', ['un déchet brûlé sans rien produire', 'un déchet enterré pour toujours', 'un déchet jeté dans la mer'], 'Une bouteille en plastique recyclée peut devenir un pull ou une nouvelle bouteille.'),
    item('CM2', 3, 'Où jette-t-on les bouteilles et les pots en verre ?', 'dans le conteneur à verre', ['dans le compost', 'dans la nature', 'dans les toilettes'], 'Le verre se recycle à l\'infini.'),
    item('CM2', 3, 'Que produisent des panneaux solaires ?', 'de l\'électricité, grâce à la lumière du soleil', ['du charbon', 'de l\'eau potable', 'du pétrole'], 'Le soleil est une énergie renouvelable.'),
    item('CM2', 3, 'Pour économiser l\'énergie dans un logement, on peut :', 'bien l\'isoler et éteindre les lumières inutiles', ['laisser les fenêtres ouvertes en hiver', 'chauffer au maximum', 'allumer toutes les lampes'], 'Un logement bien isolé garde la chaleur en hiver et la fraîcheur en été.'),
    item('CM2', 3, 'Dans un écoquartier, on trouve souvent :', 'des espaces verts, des pistes cyclables et des bâtiments économes en énergie', ['des autoroutes au milieu des maisons', 'des usines polluantes', 'des décharges à ciel ouvert'], 'Un écoquartier est pensé pour respecter l\'environnement.'),
  ],
  'mots-geographie': [
    // CM1.
    item('CM1', 1, 'Un planisphère est :', 'une carte du monde entier, à plat', ['un globe terrestre', 'une carte d\'une ville', 'une boussole'], 'Le planisphère représente toute la Terre sur une surface plane.'),
    item('CM1', 1, 'À quoi sert la légende d\'une carte ?', 'à expliquer les couleurs et les symboles', ['à raconter une histoire', 'à donner la température', 'à indiquer l\'heure'], 'La légende permet de lire la carte.'),
    item('CM1', 1, 'À quoi sert l\'échelle d\'une carte ?', 'à calculer les distances réelles', ['à trouver le nord', 'à dessiner les montagnes', 'à nommer les pays'], 'Elle indique à quelle distance réelle correspond une longueur sur la carte.'),
    item('CM1', 1, 'Un continent est :', 'une très grande étendue de terre', ['une très grande étendue d\'eau', 'une ville', 'un fleuve'], 'La Terre compte six continents, si l\'on compte l\'Antarctique.'),
    item('CM1', 1, 'Un océan est :', 'une très grande étendue d\'eau salée', ['un grand lac d\'eau douce', 'une rivière', 'une montagne'], 'Les océans recouvrent plus des deux tiers de la Terre.'),
    item('CM1', 1, 'Importer un produit, c\'est :', 'le faire venir d\'un autre pays', ['le vendre à un autre pays', 'le fabriquer soi-même', 'le jeter'], 'Vendre à l\'étranger, c\'est exporter.'),
    item('CM1', 1, 'L\'agriculture biologique n\'utilise pas :', 'de pesticides ni d\'engrais chimiques de synthèse', ['de terre', 'd\'eau', 'de soleil'], 'Elle utilise des produits naturels pour cultiver et élever.'),
    item('CM1', 1, 'Un circuit court, c\'est :', 'acheter directement au producteur, ou avec un seul intermédiaire', ['acheter un produit venu de très loin', 'un petit parcours de course', 'une route très courte'], 'Au marché ou à la ferme, le produit passe directement du producteur au client.'),
    item('CM1', 1, 'Le gaspillage alimentaire, c\'est :', 'jeter de la nourriture qui aurait pu être mangée', ['cultiver trop de légumes', 'manger trop vite', 'partager son repas'], 'Chaque année, beaucoup de nourriture est jetée alors qu\'elle était bonne.'),
    item('CM1', 1, 'Exporter un produit, c\'est :', 'le vendre à un autre pays', ['le faire venir d\'un autre pays', 'le fabriquer soi-même', 'le jeter'], 'Faire venir un produit de l\'étranger, c\'est importer.'),
    item('CM1', 1, 'La malnutrition, c\'est :', 'une alimentation trop pauvre ou mal équilibrée', ['un plat très épicé', 'un repas de fête', 'un marché de fruits'], 'Elle touche la santé et la croissance des enfants.'),
    item('CM1', 1, 'Un élevage est :', 'un lieu où l\'on fait naître et grandir des animaux', ['un champ de blé', 'une usine de voitures', 'une forêt sauvage'], 'On élève des vaches, des porcs, des poules, des poissons.'),
    item('CM1', 1, 'Une boussole sert à :', 'trouver le nord', ['mesurer la température', 'calculer une distance', 'lire l\'heure'], 'Son aiguille aimantée indique le nord.'),
    item('CM1', 2, 'L\'eau potable est :', 'une eau que l\'on peut boire sans danger', ['une eau salée', 'une eau de pluie sale', 'une eau gelée'], 'Elle est propre à la consommation.'),
    item('CM1', 2, 'Un bidonville est :', 'un quartier d\'abris précaires, souvent sans eau ni électricité', ['un quartier de villas', 'un grand parc', 'un centre commercial'], 'Des millions de personnes vivent dans des bidonvilles, dans les grandes villes pauvres.'),
    item('CM1', 2, 'Les inégalités, ce sont :', 'de grandes différences, souvent injustes, dans les conditions de vie', ['des personnes de même taille', 'des pays de même richesse', 'des règles de calcul'], 'Tout le monde n\'a pas le même accès à l\'eau, à l\'école, aux soins.'),
    item('CM1', 2, 'La mobilité, c\'est :', 'la façon dont les gens se déplacent', ['l\'immobilité', 'un téléphone portable', 'un meuble'], 'On parle de mobilité quotidienne pour les trajets de tous les jours.'),
    item('CM1', 2, 'Le covoiturage, c\'est :', 'partager une voiture à plusieurs pour un même trajet', ['conduire sans permis', 'louer un vélo', 'prendre le train'], 'Moins de voitures sur la route, moins de pollution.'),
    item('CM1', 2, 'Les mobilités douces, ce sont :', 'la marche, le vélo, la trottinette', ['l\'avion et le camion', 'la moto et la voiture', 'le paquebot'], 'Elles ne polluent pas et sont bonnes pour la santé.'),
    item('CM1', 3, 'Un réseau est :', 'un ensemble de lignes qui relient des lieux ou des appareils', ['un seul fil', 'une ville', 'un continent'], 'Internet, les routes, les voies ferrées forment des réseaux.'),
    item('CM1', 3, 'La fracture numérique, c\'est :', 'l\'inégalité d\'accès à Internet et aux outils numériques', ['un écran cassé', 'une panne de courant', 'un virus informatique'], 'Certains n\'ont pas de connexion, d\'autres ne savent pas s\'en servir.'),
    item('CM1', 3, 'La source d\'une information, c\'est :', 'son origine : qui l\'a écrite, et où', ['sa couleur', 'sa longueur', 'son prix'], 'Connaître la source aide à savoir si l\'on peut s\'y fier.'),
    item('CM1', 3, 'Un centre de données (data center) est :', 'un bâtiment rempli d\'ordinateurs qui stockent les données d\'Internet', ['une bibliothèque de livres', 'une station de métro', 'une usine de téléphones'], 'Ils fonctionnent jour et nuit et consomment beaucoup d\'électricité.'),
    // CM2.
    item('CM2', 1, 'Une commune périurbaine est :', 'une commune proche d\'une grande ville, où vivent beaucoup de gens qui y travaillent', ['le centre historique d\'une ville', 'une île', 'une station de ski'], 'Ses habitants font souvent l\'aller-retour vers la ville chaque jour.'),
    item('CM2', 1, 'Une métropole est :', 'une très grande ville qui attire habitants et activités', ['un petit village', 'une ferme', 'un pays'], 'Paris, Lyon, Marseille sont des métropoles.'),
    item('CM2', 1, 'Un réseau de transport est :', 'l\'ensemble des routes, voies ferrées et lignes qui relient des lieux', ['un seul arrêt de bus', 'un billet de train', 'un embouteillage'], 'Les réseaux relient les villes entre elles.'),
    item('CM2', 1, 'Un trajet pendulaire, c\'est :', 'l\'aller-retour quotidien entre le domicile et le travail', ['un voyage en avion', 'une randonnée', 'un déménagement'], 'Comme un pendule, on va et on revient chaque jour.'),
    item('CM2', 1, 'Les transports en commun, ce sont :', 'le bus, le tramway, le métro, le train', ['la voiture et la moto', 'le vélo et la marche', 'le jet privé'], 'Ils transportent beaucoup de voyageurs à la fois.'),
    item('CM2', 1, 'Le covoiturage, c\'est :', 'partager une voiture à plusieurs pour un même trajet', ['conduire sans permis', 'louer un vélo', 'prendre le train'], 'Moins de voitures sur la route, moins de pollution.'),
    item('CM2', 1, 'Les mobilités douces, ce sont :', 'la marche, le vélo, la trottinette', ['l\'avion et le camion', 'la moto et la voiture', 'le paquebot'], 'Elles ne polluent pas et sont bonnes pour la santé.'),
    item('CM2', 1, 'Un pôle d\'échanges est :', 'un lieu où l\'on passe facilement d\'un transport à un autre', ['une salle de classe', 'un magasin de vélos', 'un parking pour avions'], 'Gare, bus, tramway et vélos s\'y retrouvent.'),
    item('CM2', 1, 'Un embouteillage, c\'est :', 'une longue file de véhicules bloqués sur la route', ['une usine de bouteilles', 'un parking vide', 'une piste cyclable'], 'Il se forme quand trop de véhicules circulent en même temps.'),
    item('CM2', 1, 'Une autoroute est :', 'une route rapide, sans croisements, pour aller loin', ['un chemin de randonnée', 'une rue piétonne', 'une voie ferrée'], 'Les autoroutes relient les grandes villes.'),
    item('CM2', 1, 'Un aéroport est :', 'un lieu où les avions décollent et atterrissent', ['un port pour les bateaux', 'une gare de trains', 'une station de métro'], 'Les grands aéroports relient la France au monde entier.'),
    item('CM2', 1, 'L\'heure de pointe, c\'est :', 'le moment où beaucoup de gens se déplacent en même temps', ['le moment le plus chaud de la journée', 'l\'heure du déjeuner à l\'école', 'la nuit'], 'Le matin et le soir, les routes et les transports sont chargés.'),
    item('CM2', 1, 'Une gare est :', 'un lieu où les trains s\'arrêtent pour prendre et déposer des voyageurs', ['un lieu où atterrissent les avions', 'un parking pour vélos', 'un port de pêche'], 'Les grandes gares sont aussi des pôles d\'échanges.'),
    item('CM2', 2, 'Un internaute est :', 'une personne qui utilise Internet', ['un astronaute', 'un marin', 'un facteur'], 'Plus de cinq milliards de personnes utilisent Internet.'),
    item('CM2', 2, 'Un câble sous-marin est :', 'un câble posé au fond de la mer, qui transporte les données d\'Internet', ['un bateau', 'un poisson électrique', 'un sous-marin'], 'Des centaines de câbles relient les continents.'),
    item('CM2', 2, 'Être connecté, c\'est :', 'avoir accès à Internet', ['habiter en ville', 'avoir un vélo', 'savoir nager'], 'On se connecte par un câble, la fibre, une antenne ou un satellite.'),
    item('CM2', 3, 'Le développement durable, c\'est :', 'répondre à nos besoins sans empêcher les générations futures de répondre aux leurs', ['construire le plus vite possible', 'consommer toujours plus', 'ne rien changer'], 'Il associe l\'environnement, l\'économie et la vie des habitants.'),
    item('CM2', 3, 'Une énergie renouvelable est :', 'une énergie qui ne s\'épuise pas, comme le soleil ou le vent', ['le charbon', 'le pétrole', 'le gaz'], 'Le charbon, le pétrole et le gaz, eux, finiront par s\'épuiser.'),
    item('CM2', 3, 'Le tri sélectif, c\'est :', 'séparer les déchets selon leur matière pour les recycler', ['jeter tous les déchets ensemble', 'brûler les déchets', 'enterrer les déchets'], 'Verre, papier, emballages : chaque matière a sa poubelle.'),
    item('CM2', 3, 'Le compost, c\'est :', 'des déchets de cuisine et de jardin transformés en engrais naturel', ['du plastique fondu', 'du papier recyclé', 'du verre broyé'], 'Épluchures et feuilles mortes deviennent un terreau pour les plantes.'),
    item('CM2', 3, 'Un écoquartier est :', 'un quartier conçu pour économiser l\'énergie et respecter l\'environnement', ['un quartier sans habitants', 'une zone industrielle', 'un parking géant'], 'Espaces verts, déplacements doux, bâtiments bien isolés.'),
    item('CM2', 3, 'Un espace vert est :', 'un lieu de nature en ville : parc, jardin, square', ['un bâtiment peint en vert', 'un terrain de parking', 'une autoroute'], 'Il apporte de la fraîcheur et de la biodiversité en ville.'),
  ],
};

// --- La rose des vents ---------------------------------------------------------------

type Direction = 'nord' | 'nord-est' | 'est' | 'sud-est' | 'sud' | 'sud-ouest' | 'ouest' | 'nord-ouest';
/** L'angle de chaque direction, en degrés, 0 vers le nord, dans le sens des
 *  aiguilles d'une montre. */
const DIRECTIONS: Record<Direction, number> = {
  nord: 0,
  'nord-est': 45,
  est: 90,
  'sud-est': 135,
  sud: 180,
  'sud-ouest': 225,
  ouest: 270,
  'nord-ouest': 315,
};

const towards = (center: Point, length: number, degrees: number): Point => {
  const radians = (degrees * Math.PI) / 180;
  return [Math.round((center[0] + length * Math.sin(radians)) * 10) / 10, Math.round((center[1] - length * Math.cos(radians)) * 10) / 10];
};

/** Une rose des vents : le nord seul est nommé, une branche est en couleur. */
export function compassFigure(asked: Direction, withIntermediate: boolean): Figure {
  const center: Point = [150, 104];
  const shapes: Shape[] = [];
  (Object.keys(DIRECTIONS) as Direction[]).forEach((direction) => {
    const main = DIRECTIONS[direction] % 90 === 0;
    if (!main && !withIntermediate) return;
    const length = main ? 72 : 46;
    const tip = towards(center, length, DIRECTIONS[direction]);
    if (direction === asked) {
      const left = towards(tip, 14, DIRECTIONS[direction] + 150);
      const right = towards(tip, 14, DIRECTIONS[direction] - 150);
      shapes.push({ kind: 'segment', from: center, to: tip, ink: 'couleur', width: 6 });
      shapes.push({ kind: 'polyline', points: [left, tip, right], ink: 'couleur', width: 6 });
    } else {
      shapes.push({ kind: 'segment', from: center, to: tip, width: main ? 3 : 2 });
    }
  });
  shapes.push({ kind: 'circle', center, radius: 6, fill: true });
  shapes.push({ kind: 'text', at: [center[0], center[1] - 80], text: 'N', anchor: 'middle', bold: true, size: 18 });
  return { width: 300, height: 200, shapes, alt: 'Une rose des vents : le nord est marqué N, une des directions est en couleur.' };
}

function compassQuestion(rng: Rng, withIntermediate: boolean): Draft {
  const choices: Direction[] = withIntermediate
    ? ['nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest']
    : ['est', 'sud', 'ouest'];
  const asked = rngPick(rng, choices);
  const all: Direction[] = withIntermediate ? (Object.keys(DIRECTIONS) as Direction[]) : ['nord', 'est', 'sud', 'ouest'];
  // « l'est », « l'ouest », mais « le nord », « le sud-ouest ».
  const label = (direction: Direction) => (/^[eo]/.test(direction) ? `l'${direction}` : `le ${direction}`);
  return {
    key: `rose-${asked}-${withIntermediate}`,
    instruction: 'Le nord est marqué N',
    prompt: 'Quelle direction montre la flèche en couleur ?',
    figure: compassFigure(asked, withIntermediate),
    ...choose(rng, label(asked), all.map(label)),
    explanation: `C\'est ${label(asked)}.${withIntermediate ? '' : ' Face au nord, l\'est est à droite et l\'ouest à gauche.'}`,
  };
}

function generateFor(domain: GeographyDomain) {
  return (level: Level, trimester: Trimester, rng: Rng, count: number): Question[] => {
    const items = ITEMS[domain].filter((entry) => isEligible(entry, level, trimester));
    const current = items.filter((entry) => entry.trimester === trimester);
    const review = items.filter((entry) => entry.trimester < trimester);
    const currentMakers = current.length > 0 ? [drawer(rng, current)] : [];
    const reviewMakers = review.length > 0 ? [drawer(rng, review)] : [];
    // La rose des vents : les quatre points cardinaux au 1er trimestre du CM1,
    // les directions intermédiaires au CM2.
    if (domain === 'cartes') {
      const withIntermediate = level === 'CM2';
      (trimester === 1 ? currentMakers : reviewMakers).push(() => compassQuestion(rng, withIntermediate));
    }
    return assemble(domain, rng, count, trimester, currentMakers, reviewMakers);
  };
}

export const generateCartes = generateFor('cartes');
export const generateHabiter = generateFor('habiter');
export const generateMotsGeographie = generateFor('mots-geographie');
