import type { Level, Trimester } from '../types';
import { createRng, rngShuffle } from '../lib/seededRandom';
import { writtenGenerator, writtenItem as item, type WrittenItem } from './histoireGeographie';
import { supplement, uniques } from './banquesSupplementaires';

/**
 * L'anglais, du CE1 à la 3e : du niveau A1 découvert au cycle 2 jusqu'au
 * niveau A2 visé en fin de 3e (programmes de langues vivantes, cycles 2 à 4).
 *
 * Deux notions : les mots (un lexique par thème, interrogé dans les deux
 * sens) et les phrases (comprendre, dire, la grammaire de chaque année).
 *
 * Comme dans les applications de langue, on ne fait pas que lire : on écoute
 * le mot prononcé par la voix anglaise de l'appareil, et on remet les mots
 * d'une phrase dans l'ordre. Ces exercices sont fabriqués à partir des mots et
 * des phrases déjà écrits et relus : rien n'est inventé.
 */

type Pair = [fr: string, en: string];

const LEXIQUE: Partial<Record<Level, Record<Trimester, Pair[]>>> = {
  CE1: {
    1: [['rouge', 'red'], ['bleu', 'blue'], ['vert', 'green'], ['jaune', 'yellow'], ['noir', 'black'], ['blanc', 'white'], ['rose', 'pink']],
    2: [['un', 'one'], ['deux', 'two'], ['trois', 'three'], ['quatre', 'four'], ['cinq', 'five'], ['sept', 'seven'], ['huit', 'eight'], ['dix', 'ten']],
    3: [['chat', 'cat'], ['chien', 'dog'], ['oiseau', 'bird'], ['poisson', 'fish'], ['lapin', 'rabbit'], ['cheval', 'horse'], ['vache', 'cow'], ['souris', 'mouse']],
  },
  CE2: {
    1: [['mère', 'mother'], ['père', 'father'], ['sœur', 'sister'], ['frère', 'brother'], ['grand-mère', 'grandmother'], ['grand-père', 'grandfather'], ['bébé', 'baby']],
    2: [['tête', 'head'], ['main', 'hand'], ['pied', 'foot'], ['œil', 'eye'], ['bouche', 'mouth'], ['nez', 'nose'], ['oreille', 'ear'], ['bras', 'arm']],
    3: [['pomme', 'apple'], ['pain', 'bread'], ['lait', 'milk'], ['eau', 'water'], ['gâteau', 'cake'], ['fromage', 'cheese'], ['œuf', 'egg']],
  },
  CM1: {
    1: [['crayon', 'pencil'], ['stylo', 'pen'], ['livre', 'book'], ['règle', 'ruler'], ['cartable', 'schoolbag'], ['chaise', 'chair'], ['ciseaux', 'scissors'], ['trousse', 'pencil case']],
    2: [['lundi', 'Monday'], ['mardi', 'Tuesday'], ['mercredi', 'Wednesday'], ['jeudi', 'Thursday'], ['vendredi', 'Friday'], ['samedi', 'Saturday'], ['dimanche', 'Sunday']],
    3: [['ensoleillé', 'sunny'], ['pluvieux', 'rainy'], ['nuageux', 'cloudy'], ['venteux', 'windy'], ['chaud', 'hot'], ['froid', 'cold'], ['neige', 'snow'], ['pluie', 'rain']],
  },
  CM2: {
    1: [['janvier', 'January'], ['février', 'February'], ['mars', 'March'], ['avril', 'April'], ['juin', 'June'], ['juillet', 'July'], ['août', 'August'], ['décembre', 'December']],
    2: [['robe', 'dress'], ['chaussures', 'shoes'], ['chapeau', 'hat'], ['jupe', 'skirt'], ['pantalon', 'trousers'], ['chaussettes', 'socks'], ['manteau', 'coat']],
    3: [['cuisine', 'kitchen'], ['chambre', 'bedroom'], ['salle de bains', 'bathroom'], ['jardin', 'garden'], ['salon', 'living room'], ['porte', 'door'], ['fenêtre', 'window'], ['lit', 'bed']],
  },
  '6e': {
    1: [['nager', 'swim'], ['chanter', 'sing'], ['danser', 'dance'], ['lire', 'read'], ['courir', 'run'], ['dessiner', 'draw'], ['cuisiner', 'cook'], ['jouer', 'play']],
    2: [['boulangerie', 'bakery'], ['gare', 'station'], ['bibliothèque', 'library'], ['hôpital', 'hospital'], ['piscine', 'swimming pool'], ['rue', 'street'], ['pont', 'bridge'], ['musée', 'museum']],
    3: [['forêt', 'forest'], ['montagne', 'mountain'], ['mer', 'sea'], ['rivière', 'river'], ['plage', 'beach'], ['île', 'island'], ['ours', 'bear'], ['loup', 'wolf']],
  },
  '5e': {
    1: [['médecin', 'doctor'], ['boulanger', 'baker'], ['infirmier', 'nurse'], ['agriculteur', 'farmer'], ['pompier', 'firefighter'], ['avocat', 'lawyer'], ['ingénieur', 'engineer'], ['vétérinaire', 'vet']],
    2: [['heureux', 'happy'], ['triste', 'sad'], ['en colère', 'angry'], ['fatigué', 'tired'], ['effrayé', 'scared'], ['surpris', 'surprised'], ['fier', 'proud'], ['qui s\'ennuie', 'bored']],
    3: [['billet', 'ticket'], ['valise', 'suitcase'], ['aéroport', 'airport'], ['avion', 'plane'], ['voyage', 'trip'], ['carte', 'map'], ['bagages', 'luggage'], ['vol', 'flight']],
  },
  '4e': {
    1: [['mal de tête', 'headache'], ['rhume', 'cold'], ['blessure', 'injury'], ['médicament', 'medicine'], ['ordonnance', 'prescription'], ['toux', 'cough'], ['mal de gorge', 'sore throat']],
    2: [['déchets', 'waste'], ['recyclage', 'recycling'], ['réchauffement climatique', 'global warming'], ['énergie renouvelable', 'renewable energy'], ['espèce menacée', 'endangered species'], ['sécheresse', 'drought'], ['inondation', 'flood']],
    3: [['écran', 'screen'], ['mot de passe', 'password'], ['télécharger', 'download'], ['réseau social', 'social network'], ['fausse information', 'fake news'], ['abonné', 'follower'], ['journal', 'newspaper']],
  },
  '3e': {
    1: [['emploi du temps', 'timetable'], ['examen', 'exam'], ['stage', 'internship'], ['lycée', 'high school'], ['devoirs', 'homework'], ['emploi', 'job'], ['entretien d\'embauche', 'job interview'], ['salaire', 'salary']],
    2: [['égalité', 'equality'], ['droits', 'rights'], ['liberté', 'freedom'], ['loi', 'law'], ['citoyen', 'citizen'], ['gouvernement', 'government'], ['pauvreté', 'poverty']],
    3: [['découverte', 'discovery'], ['chercheur', 'researcher'], ['ampoule', 'light bulb'], ['roue', 'wheel'], ['vaccin', 'vaccine'], ['expérience', 'experiment'], ['progrès', 'progress']],
  },
};

/** Chaque mot du lexique, dans les deux sens. Les mauvaises réponses sont les
 *  autres mots du même thème : on choisit entre « cat » et « dog », pas
 *  entre « cat » et « Monday ». */
export function itemsDuLexique(): WrittenItem[] {
  return Object.entries(LEXIQUE).flatMap(([level, parTrimestre]) =>
    (Object.entries(parTrimestre) as [string, Pair[]][]).flatMap(([trimestre, paires]) =>
      paires.flatMap(([fr, en]) => {
        const lvl = level as Level;
        const t = Number(trimestre) as Trimester;
        const autresEn = paires.map((paire) => paire[1]).filter((mot) => mot !== en);
        const autresFr = paires.map((paire) => paire[0]).filter((mot) => mot !== fr);
        const audio = { text: en, lang: 'en-GB' as const };
        return [
          { ...item(lvl, t, `Comment dit-on « ${fr} » en anglais ?`, en, autresEn, `« ${fr} » se dit « ${en} » en anglais.`), voice: { choices: 'en-GB' as const } },
          { ...item(lvl, t, `Que veut dire le mot anglais « ${en} » ?`, fr, autresFr, `« ${en} » veut dire « ${fr} ».`), voice: { quote: 'en-GB' as const } },
          // L'écoute : le mot n'est pas écrit, on l'entend.
          {
            ...item(lvl, t, 'Écoute bien. Quel mot entends-tu ?', en, autresEn, `On a entendu « ${en} », qui veut dire « ${fr} ».`),
            audio,
            voice: { choices: 'en-GB' as const },
            practiceOnly: true,
          },
          {
            ...item(lvl, t, 'Écoute bien. Que veut dire ce mot ?', fr, autresFr, `On a entendu « ${en} », qui veut dire « ${fr} ».`),
            audio,
            practiceOnly: true,
          },
        ];
      })
    )
  );
}

export const PHRASES: WrittenItem[] = [
  // CE1 — se saluer, se présenter, compter, dire ce qu'on aime.
  item('CE1', 1, 'Pour dire bonjour en anglais, on dit :', 'Hello!', ['Goodbye!', 'Thank you!', 'Please!'], 'Hello veut dire bonjour.'),
  item('CE1', 1, 'Pour dire au revoir en anglais, on dit :', 'Goodbye!', ['Hello!', 'Yes!', 'Sorry!'], 'Goodbye veut dire au revoir.'),
  item('CE1', 1, 'Que veut dire « Thank you » ?', 'merci', ['bonjour', 'pardon', 's\'il te plaît'], 'Thank you veut dire merci.'),
  item('CE1', 1, 'Comment dit-on « Je m\'appelle Léo » ?', 'My name is Léo.', ['I am six.', 'How are you?', 'I like Léo.'], 'My name is veut dire je m\'appelle.'),
  item('CE1', 1, 'Que répond-on à « How are you? » ?', 'I\'m fine, thank you.', ['My name is Tom.', 'Goodbye!', 'I\'m seven.'], 'How are you veut dire comment vas-tu.'),
  item('CE1', 1, 'Que veut dire « Good night » ?', 'bonne nuit', ['bonjour', 'bon appétit', 'au revoir'], 'Good night se dit le soir, avant de dormir.'),
  item('CE1', 1, 'Que veut dire « Good morning » ?', 'bonjour, le matin', ['bonne nuit', 'merci', 'pardon'], 'Morning veut dire matin.'),
  item('CE1', 1, 'Que veut dire « Yes » ?', 'oui', ['non', 'peut-être', 'merci'], 'Yes veut dire oui. No veut dire non.'),
  item('CE1', 1, 'Que veut dire « Sorry » ?', 'pardon', ['merci', 'bonjour', 'au revoir'], 'On dit sorry quand on s\'excuse.'),
  item('CE1', 1, 'Comment demande-t-on son nom à quelqu\'un ?', 'What\'s your name?', ['How are you?', 'How old are you?', 'Where are you?'], 'Name veut dire nom.'),
  item('CE1', 1, 'Que veut dire « What colour is the sky? » ?', 'De quelle couleur est le ciel ?', ['Où est le ciel ?', 'Le ciel est-il grand ?', 'Aimes-tu le ciel ?'], 'Sky veut dire ciel.'),
  item('CE1', 1, 'Le ciel est bleu. En anglais, on dit :', 'The sky is blue.', ['The sky is red.', 'The sky is green.', 'Blue is sky the.'], 'Blue veut dire bleu.'),
  item('CE1', 2, 'Que veut dire « How old are you? » ?', 'Quel âge as-tu ?', ['Comment vas-tu ?', 'Comment t\'appelles-tu ?', 'Où habites-tu ?'], 'Old veut dire âgé. On demande l\'âge.'),
  item('CE1', 2, 'Léo a sept ans. Il dit :', 'I\'m seven.', ['I\'m six.', 'I\'m eight.', 'I\'m ten.'], 'Seven veut dire sept.'),
  item('CE1', 2, 'Combien font one et two ?', 'three', ['two', 'four', 'five'], 'Un et deux font trois : three.'),
  item('CE1', 2, 'Quel nombre vient après « four » ?', 'five', ['three', 'six', 'nine'], 'Après quatre vient cinq : five.'),
  item('CE1', 2, 'Que veut dire « Stand up » ?', 'Lève-toi.', ['Assieds-toi.', 'Écoute.', 'Regarde.'], 'Stand up veut dire lève-toi.'),
  item('CE1', 2, 'Que veut dire « Sit down » ?', 'Assieds-toi.', ['Lève-toi.', 'Chante.', 'Écris.'], 'Sit down veut dire assieds-toi.'),
  item('CE1', 3, 'Que veut dire « I like cats » ?', 'J\'aime les chats.', ['Je n\'aime pas les chats.', 'J\'ai un chat.', 'Je suis un chat.'], 'I like veut dire j\'aime.'),
  item('CE1', 3, 'Comment dit-on « Je n\'aime pas les chiens » ?', 'I don\'t like dogs.', ['I like dogs.', 'I have a dog.', 'I am a dog.'], 'I don\'t like veut dire je n\'aime pas.'),
  item('CE1', 3, 'Que veut dire « It\'s a big cat » ?', 'C\'est un gros chat.', ['C\'est un petit chat.', 'C\'est un chien.', 'C\'est mon chat.'], 'Big veut dire gros ou grand.'),
  item('CE1', 3, 'Le contraire de « big » est :', 'small', ['red', 'happy', 'fast'], 'Small veut dire petit.'),
  item('CE1', 3, 'Que veut dire « What colour is it? » ?', 'De quelle couleur est-ce ?', ['Qu\'est-ce que c\'est ?', 'Combien y en a-t-il ?', 'Où est-il ?'], 'Colour veut dire couleur.'),

  // CE2 — la famille, le corps, la nourriture, « have got », « a » et « an ».
  item('CE2', 1, 'Que veut dire « This is my mother » ?', 'Voici ma mère.', ['Voici mon père.', 'C\'est ma sœur.', 'J\'aime ma mère.'], 'This is veut dire voici.'),
  item('CE2', 1, 'Comment dit-on « J\'ai un frère » ?', 'I have got a brother.', ['I am a brother.', 'I like my brother.', 'I have got a sister.'], 'I have got veut dire j\'ai.'),
  item('CE2', 1, 'Que veut dire « Have you got a sister? » ?', 'As-tu une sœur ?', ['Es-tu une sœur ?', 'Où est ta sœur ?', 'Aimes-tu ta sœur ?'], 'Have you got veut dire as-tu.'),
  item('CE2', 1, 'On te demande « Have you got a pet? ». Tu as un chat. Tu réponds :', 'Yes, I have.', ['Yes, I am.', 'No, I haven\'t.', 'Yes, it is.'], 'On répond avec le même verbe : have.'),
  item('CE2', 1, '« His name is Tom. » Tom est :', 'un garçon', ['une fille', 'une maman', 'une maîtresse'], 'His sert pour un garçon. Her sert pour une fille.'),
  item('CE2', 2, 'Que veut dire « Touch your nose » ?', 'Touche ton nez.', ['Montre ta bouche.', 'Lève la main.', 'Ferme les yeux.'], 'Touch veut dire touche. Nose veut dire nez.'),
  item('CE2', 2, 'Un « foot », deux :', 'feet', ['foots', 'foot', 'feets'], 'Foot devient feet au pluriel.'),
  item('CE2', 2, 'Que veut dire « I\'ve got long hair » ?', 'J\'ai les cheveux longs.', ['J\'ai les cheveux courts.', 'Je suis grand.', 'J\'ai les yeux bleus.'], 'Long veut dire long. Hair veut dire cheveux.'),
  item('CE2', 2, 'Que veut dire « Clap your hands » ?', 'Tape dans tes mains.', ['Lave tes mains.', 'Lève les bras.', 'Tape du pied.'], 'Clap veut dire taper. Hands veut dire mains.'),
  item('CE2', 2, 'Comment dit-on « J\'ai les yeux bleus » ?', 'I\'ve got blue eyes.', ['I\'ve got eyes blue.', 'I am blue eyes.', 'I\'ve got green eyes.'], 'En anglais, la couleur se place avant le nom.'),
  item('CE2', 3, 'Que veut dire « I\'m hungry » ?', 'J\'ai faim.', ['J\'ai soif.', 'Je suis fatigué.', 'J\'ai froid.'], 'Hungry veut dire affamé.'),
  item('CE2', 3, 'Que veut dire « I\'m thirsty » ?', 'J\'ai soif.', ['J\'ai faim.', 'J\'ai chaud.', 'Je suis content.'], 'Thirsty veut dire assoiffé.'),
  item('CE2', 3, 'Comment demande-t-on poliment une pomme ?', 'Can I have an apple, please?', ['Give me apple!', 'I am an apple.', 'Apple, goodbye.'], 'Please veut dire s\'il te plaît.'),
  item('CE2', 3, 'On dit « an apple ». Pour une banane, on dit :', 'a banana', ['an banana', 'the bananas', 'banana an'], 'An se met devant une voyelle. Banana commence par b.'),
  item('CE2', 3, 'Que veut dire « I don\'t like milk » ?', 'Je n\'aime pas le lait.', ['J\'aime le lait.', 'Je bois du lait.', 'Je veux du lait.'], 'Don\'t like veut dire ne pas aimer.'),

  // CM1 — la classe, l'heure, les jours, la météo, « can ».
  item('CM1', 1, 'Que veut dire « Open your book » ?', 'Ouvre ton livre.', ['Ferme ton livre.', 'Lis ton livre.', 'Range ton livre.'], 'Open veut dire ouvrir. Close veut dire fermer.'),
  item('CM1', 1, '« There is a pen on the table. » Où est le stylo ?', 'sur la table', ['sous la table', 'dans le cartable', 'à côté de la table'], 'On veut dire sur.'),
  item('CM1', 1, 'Quel mot anglais veut dire « dans » ?', 'in', ['on', 'under', 'next to'], 'In veut dire dans, on veut dire sur, under veut dire sous.'),
  item('CM1', 1, 'Que veut dire « under » ?', 'sous', ['sur', 'dans', 'devant'], 'Under the table veut dire sous la table.'),
  item('CM1', 1, 'Comment dit-on « Je ne comprends pas » ?', 'I don\'t understand.', ['I don\'t know.', 'I am understand.', 'I understand.'], 'Understand veut dire comprendre. I don\'t know veut dire je ne sais pas.'),
  item('CM1', 1, 'Comment demande-t-on de répéter ?', 'Can you repeat, please?', ['Can you sing, please?', 'Can you go, please?', 'Repeat you, please?'], 'Repeat veut dire répéter.'),
  item('CM1', 2, 'Quel jour vient après Monday ?', 'Tuesday', ['Wednesday', 'Sunday', 'Thursday'], 'Après lundi vient mardi : Tuesday.'),
  item('CM1', 2, 'Que veut dire « What day is it today? » ?', 'Quel jour sommes-nous ?', ['Quelle heure est-il ?', 'Quel temps fait-il ?', 'Quel âge as-tu ?'], 'Day veut dire jour. Today veut dire aujourd\'hui.'),
  item('CM1', 2, 'En anglais, les jours de la semaine s\'écrivent :', 'avec une majuscule', ['sans majuscule', 'tout en majuscules', 'avec un tiret'], 'On écrit Monday, Tuesday, toujours avec une majuscule.'),
  item('CM1', 2, 'Que veut dire « I play football on Saturday » ?', 'Je joue au football le samedi.', ['Je joue au football le dimanche.', 'Je regarde le football le samedi.', 'Je joue au tennis le samedi.'], 'Saturday veut dire samedi.'),
  item('CM1', 2, 'Que veut dire « It\'s three o\'clock » ?', 'Il est trois heures.', ['Il est treize heures.', 'Il est trois heures et demie.', 'J\'ai trois ans.'], 'O\'clock donne une heure pile.'),
  item('CM1', 2, 'Que veut dire « half past two » ?', 'deux heures et demie', ['deux heures moins le quart', 'une heure et demie', 'deux heures pile'], 'Half veut dire demi. Past veut dire après.'),
  item('CM1', 3, 'Que veut dire « What\'s the weather like? » ?', 'Quel temps fait-il ?', ['Quelle heure est-il ?', 'Quel jour sommes-nous ?', 'Où vas-tu ?'], 'Weather veut dire le temps qu\'il fait.'),
  item('CM1', 3, 'Il pleut. On dit :', 'It\'s raining.', ['It\'s snowing.', 'It\'s sunny.', 'It\'s windy.'], 'Rain veut dire pluie. It\'s raining veut dire il pleut.'),
  item('CM1', 3, '« It\'s cold. » Que mets-tu ?', 'un manteau', ['un maillot de bain', 'des lunettes de soleil', 'un short'], 'Cold veut dire froid.'),
  item('CM1', 3, 'Que veut dire « I can swim » ?', 'Je sais nager.', ['Je ne sais pas nager.', 'J\'aime nager.', 'Je nage souvent.'], 'Can veut dire savoir ou pouvoir.'),
  item('CM1', 3, 'Comment dit-on « Je ne sais pas danser » ?', 'I can\'t dance.', ['I can dance.', 'I don\'t dance.', 'I am not dance.'], 'Can\'t veut dire ne pas savoir, ne pas pouvoir.'),

  // CM2 — les mois, les vêtements, la maison, « there is / there are », le présent en -ing.
  item('CM2', 1, 'Quel mois vient après March ?', 'April', ['May', 'February', 'June'], 'Après mars vient avril : April.'),
  item('CM2', 1, 'Que veut dire « My birthday is in May » ?', 'Mon anniversaire est en mai.', ['Mon anniversaire est en mars.', 'Ma fête est en mai.', 'Mon anniversaire est demain.'], 'Birthday veut dire anniversaire.'),
  item('CM2', 1, '« the third of July » veut dire :', 'le 3 juillet', ['le 13 juillet', 'le 3 juin', 'le 30 juillet'], 'Third veut dire troisième. July veut dire juillet.'),
  item('CM2', 1, 'Que veut dire « When is your birthday? » ?', 'Quand est ton anniversaire ?', ['Où est ta fête ?', 'Quel âge as-tu ?', 'Quel cadeau veux-tu ?'], 'When veut dire quand.'),
  item('CM2', 1, 'Christmas, Noël, a lieu en :', 'December', ['November', 'January', 'October'], 'Noël est le 25 décembre : December.'),
  item('CM2', 2, 'Que veut dire « She is wearing a red dress » ?', 'Elle porte une robe rouge.', ['Elle achète une robe rouge.', 'Elle porte une jupe rouge.', 'Il porte une robe rouge.'], 'Wear veut dire porter. She veut dire elle.'),
  item('CM2', 2, 'Comment dit-on « Je porte un manteau », en ce moment ?', 'I am wearing a coat.', ['I wearing a coat.', 'I am wear a coat.', 'I wears a coat.'], 'Pour ce qu\'on fait maintenant : am, is ou are, puis le verbe en -ing.'),
  item('CM2', 2, 'Que veut dire « How much is it? » ?', 'Combien ça coûte ?', ['Combien y en a-t-il ?', 'Quelle heure est-il ?', 'Comment ça va ?'], 'How much sert à demander un prix.'),
  item('CM2', 2, '« These shoes are too big. » Les chaussures sont :', 'trop grandes', ['trop petites', 'très belles', 'neuves'], 'Too big veut dire trop grand.'),
  item('CM2', 2, 'Comment dit-on « mes chaussures » ?', 'my shoes', ['me shoes', 'mine shoes', 'my shoe'], 'My veut dire mon, ma ou mes.'),
  item('CM2', 3, '« There are three bedrooms in my house. » Il y a :', 'trois chambres', ['trois salles de bains', 'trois maisons', 'deux chambres'], 'Bedroom veut dire chambre.'),
  item('CM2', 3, 'Que veut dire « There is a garden » ?', 'Il y a un jardin.', ['C\'est mon jardin.', 'Il n\'y a pas de jardin.', 'Le jardin est grand.'], 'There is veut dire il y a.'),
  item('CM2', 3, 'Pour dire « il y a » avec plusieurs choses, on dit :', 'There are', ['There is', 'It is', 'This is'], 'There is pour une chose, there are pour plusieurs.'),
  item('CM2', 3, 'Le chat est sous le lit. On dit :', 'The cat is under the bed.', ['The cat is on the bed.', 'The cat is in the bed.', 'The cat is next to the bed.'], 'Under veut dire sous.'),
  item('CM2', 3, 'Que veut dire « I live in a flat » ?', 'J\'habite dans un appartement.', ['J\'habite dans une maison.', 'J\'aime mon appartement.', 'Je vis à la ferme.'], 'Live veut dire habiter. Flat veut dire appartement.'),

  // 6e — le présent simple et le présent en -ing, les directions, les pluriels irréguliers, le génitif.
  item('6e', 1, 'Que veut dire « I like swimming » ?', 'J\'aime nager.', ['Je sais nager.', 'Je nage maintenant.', 'Je n\'aime pas nager.'], 'Après like, le verbe prend souvent -ing.'),
  item('6e', 1, 'Au présent simple, avec he, she ou it, le verbe prend :', 'un -s', ['un -ing', 'un -ed', 'rien du tout'], 'On dit he plays, she likes, it runs.'),
  item('6e', 1, 'Choisis la bonne phrase :', 'She plays tennis every Sunday.', ['She play tennis every Sunday.', 'She playing tennis every Sunday.', 'She plaies tennis every Sunday.'], 'Avec she, le verbe prend un -s. Every Sunday indique une habitude.'),
  item('6e', 1, 'La forme négative de « He likes music » est :', 'He doesn\'t like music.', ['He don\'t like music.', 'He doesn\'t likes music.', 'He not like music.'], 'Avec he, on utilise doesn\'t, puis le verbe sans -s.'),
  item('6e', 1, 'Que veut dire « What\'s your favourite hobby? » ?', 'Quel est ton loisir préféré ?', ['Quel est ton plat préféré ?', 'Quelle est ta couleur préférée ?', 'Où est ton club ?'], 'Hobby veut dire loisir. Favourite veut dire préféré.'),
  item('6e', 1, '« I am reading a book. » L\'action se passe :', 'en ce moment', ['tous les jours', 'hier', 'demain'], 'Be suivi du verbe en -ing : l\'action se passe maintenant.'),
  item('6e', 2, 'Que veut dire « Go straight on » ?', 'Va tout droit.', ['Tourne à gauche.', 'Tourne à droite.', 'Arrête-toi.'], 'Straight veut dire droit.'),
  item('6e', 2, 'Que veut dire « Turn left » ?', 'Tourne à gauche.', ['Tourne à droite.', 'Va tout droit.', 'Fais demi-tour.'], 'Left veut dire gauche. Right veut dire droite.'),
  item('6e', 2, '« The bank is opposite the museum. » La banque est :', 'en face du musée', ['à côté du musée', 'derrière le musée', 'dans le musée'], 'Opposite veut dire en face de.'),
  item('6e', 2, 'Comment demande-t-on son chemin poliment ?', 'Excuse me, where is the station, please?', ['Where station?', 'Go to the station!', 'The station is where you?'], 'Excuse me et please rendent la question polie.'),
  item('6e', 2, 'Le pluriel de « child » est :', 'children', ['childs', 'childes', 'childen'], 'Child a un pluriel irrégulier : children.'),
  item('6e', 2, 'Le pluriel de « man » est :', 'men', ['mans', 'mens', 'manes'], 'Man a un pluriel irrégulier : men.'),
  item('6e', 3, '« Tom\'s dog » veut dire :', 'le chien de Tom', ['Tom est un chien', 'les chiens de Tom', 'Tom et son chien'], 'Le \'s indique à qui appartient la chose.'),
  item('6e', 3, 'C\'est le sac de Lucy. On dit : This is … bag.', 'her', ['his', 'its', 'she'], 'Her sert pour une fille ou une femme.'),
  item('6e', 3, 'Que veut dire « Can you see the sea? » ?', 'Vois-tu la mer ?', ['Sais-tu nager dans la mer ?', 'Aimes-tu la mer ?', 'Vas-tu à la mer ?'], 'See veut dire voir. Sea veut dire mer. Ils se prononcent pareil.'),
  item('6e', 3, 'Que veut dire « There are no bears in this forest » ?', 'Il n\'y a pas d\'ours dans cette forêt.', ['Il y a des ours dans cette forêt.', 'Les ours aiment cette forêt.', 'Il y a un ours dans cette forêt.'], 'No veut dire aucun ici.'),
  item('6e', 3, 'Choisis la bonne question :', 'Does she live near the beach?', ['Do she live near the beach?', 'Does she lives near the beach?', 'She does live near the beach?'], 'Avec she, la question commence par does, puis le verbe sans -s.'),

  // 5e — le prétérit, les comparatifs et superlatifs, le futur proche.
  item('5e', 1, 'Au prétérit, le verbe « play » devient :', 'played', ['plaied', 'plays', 'playing'], 'Les verbes réguliers prennent -ed au prétérit.'),
  item('5e', 1, 'Le prétérit de « go » est :', 'went', ['goed', 'gone', 'going'], 'Go est irrégulier : go, went, gone.'),
  item('5e', 1, 'Que veut dire « Yesterday I visited my grandmother » ?', 'Hier, j\'ai rendu visite à ma grand-mère.', ['Demain, je rendrai visite à ma grand-mère.', 'Aujourd\'hui, je rends visite à ma grand-mère.', 'Hier, ma grand-mère m\'a rendu visite.'], 'Yesterday veut dire hier. Visited est au prétérit.'),
  item('5e', 1, 'La forme négative de « She went to school » est :', 'She didn\'t go to school.', ['She didn\'t went to school.', 'She don\'t go to school.', 'She not went to school.'], 'Après didn\'t, le verbe reprend sa forme de base.'),
  item('5e', 1, 'Quelle expression indique le passé ?', 'last week', ['next week', 'tomorrow', 'now'], 'Last week veut dire la semaine dernière.'),
  item('5e', 1, 'Le prétérit de « have » est :', 'had', ['haved', 'has', 'having'], 'Have est irrégulier : have, had, had.'),
  item('5e', 2, '« Tom is taller than Sam. » Qui est le plus grand ?', 'Tom', ['Sam', 'Ils ont la même taille.', 'On ne peut pas savoir.'], 'Taller than veut dire plus grand que.'),
  item('5e', 2, 'Le comparatif de « good » est :', 'better', ['gooder', 'more good', 'best'], 'Good est irrégulier : good, better, the best.'),
  item('5e', 2, 'Le superlatif de « big » est :', 'the biggest', ['the bigest', 'the most big', 'the bigger'], 'Big double son g : the biggest.'),
  item('5e', 2, 'Choisis la bonne phrase :', 'This film is more interesting than the book.', ['This film is interestinger than the book.', 'This film is more interesting that the book.', 'This film is most interesting than the book.'], 'Pour un adjectif long, on dit more… than.'),
  item('5e', 2, 'Que veut dire « Why are you so sad? » ?', 'Pourquoi es-tu si triste ?', ['Quand es-tu triste ?', 'Es-tu triste aujourd\'hui ?', 'Qui est triste ?'], 'Why veut dire pourquoi.'),
  item('5e', 3, 'Que veut dire « I\'m going to visit London » ?', 'Je vais visiter Londres.', ['J\'ai visité Londres.', 'Je visite Londres chaque année.', 'Je voudrais visiter Londres.'], 'Be going to annonce un projet proche.'),
  item('5e', 3, 'Que veut dire « The plane takes off at nine » ?', 'L\'avion décolle à neuf heures.', ['L\'avion atterrit à neuf heures.', 'L\'avion part dans neuf minutes.', 'L\'avion a neuf heures de retard.'], 'Take off veut dire décoller. Land veut dire atterrir.'),
  item('5e', 3, 'Pour demander une durée, on commence par :', 'How long', ['How old', 'How much', 'What time'], 'How long veut dire combien de temps.'),
  item('5e', 3, 'Que veut dire « We missed the train » ?', 'Nous avons raté le train.', ['Nous avons pris le train.', 'Le train nous a manqué.', 'Nous attendons le train.'], 'Miss veut dire rater, ici.'),
  item('5e', 3, 'Choisis la bonne phrase :', 'We didn\'t have enough time.', ['We didn\'t had enough time.', 'We hadn\'t enough time yesterday did.', 'We don\'t had enough time.'], 'Après didn\'t, on garde la forme de base : have.'),

  // 4e — les modaux, le present perfect, le futur et la condition.
  item('4e', 1, 'Que veut dire « You should see a doctor » ?', 'Tu devrais voir un médecin.', ['Tu dois absolument voir un médecin.', 'Tu as vu un médecin.', 'Tu peux voir un médecin.'], 'Should exprime un conseil.'),
  item('4e', 1, '« You mustn\'t smoke here. » Cela veut dire :', 'Il est interdit de fumer ici.', ['Tu n\'es pas obligé de fumer ici.', 'Tu devrais fumer ici.', 'Tu peux fumer ici.'], 'Mustn\'t exprime une interdiction.'),
  item('4e', 1, '« You don\'t have to come. » Cela veut dire :', 'Tu n\'es pas obligé de venir.', ['Tu ne dois surtout pas venir.', 'Tu dois venir.', 'Tu es venu.'], 'Don\'t have to exprime une absence d\'obligation.'),
  item('4e', 1, 'Que veut dire « What\'s the matter? » ?', 'Qu\'est-ce qui ne va pas ?', ['Quelle est ta matière préférée ?', 'Quelle heure est-il ?', 'Qu\'est-ce que tu fais ?'], 'What\'s the matter demande quel est le problème.'),
  item('4e', 1, 'Choisis la bonne phrase :', 'You must wear a helmet.', ['You must to wear a helmet.', 'You musts wear a helmet.', 'You must wearing a helmet.'], 'Après must, le verbe n\'a ni to ni -s.'),
  item('4e', 2, 'Choisis la bonne phrase :', 'I have never been to Canada.', ['I have never went to Canada.', 'I am never been to Canada.', 'I has never been to Canada.'], 'Present perfect : have suivi du participe passé.'),
  item('4e', 2, 'Le participe passé de « see » est :', 'seen', ['saw', 'seed', 'seeing'], 'See est irrégulier : see, saw, seen.'),
  item('4e', 2, 'Complète : I have lived here … ten years.', 'for', ['since', 'during', 'ago'], 'For avec une durée, since avec un point de départ.'),
  item('4e', 2, 'Complète : We have recycled our bottles … 2020.', 'since', ['for', 'during', 'ago'], 'Since indique le point de départ : depuis 2020.'),
  item('4e', 2, 'Que veut dire « The planet is getting warmer » ?', 'La planète se réchauffe.', ['La planète est froide.', 'La planète était plus chaude.', 'La planète va geler.'], 'Get warmer veut dire devenir plus chaud.'),
  item('4e', 3, 'Que veut dire « I will call you tomorrow » ?', 'Je t\'appellerai demain.', ['Je t\'ai appelé hier.', 'Je t\'appelle maintenant.', 'Je voudrais t\'appeler.'], 'Will exprime le futur.'),
  item('4e', 3, 'Que veut dire « Don\'t share your password » ?', 'Ne partage pas ton mot de passe.', ['Change ton mot de passe.', 'Écris ton mot de passe.', 'Oublie ton mot de passe.'], 'Share veut dire partager.'),
  item('4e', 3, 'Choisis la bonne phrase :', 'If it rains, we will stay at home.', ['If it will rain, we will stay at home.', 'If it rain, we will stay at home.', 'If it rains, we would stay at home.'], 'Après if, on met le présent. Le futur va dans l\'autre partie.'),
  item('4e', 3, 'Le contraire de « download » est :', 'upload', ['offload', 'unload', 'reload'], 'Upload veut dire mettre en ligne.'),
  item('4e', 3, 'Que veut dire « Check the source before you share » ?', 'Vérifie la source avant de partager.', ['Partage sans vérifier.', 'Supprime la source.', 'Cherche une autre source plus tard.'], 'Check veut dire vérifier.'),

  // 3e — le conditionnel, le passif, les relatifs, le discours rapporté, la civilisation.
  item('3e', 1, '« I would like to be a vet. » Cela exprime :', 'un souhait', ['une obligation', 'un fait passé', 'une interdiction'], 'Would like exprime un souhait poli.'),
  item('3e', 1, 'Que veut dire « I\'m looking for a job » ?', 'Je cherche un emploi.', ['J\'ai trouvé un emploi.', 'Je regarde un emploi.', 'Je quitte mon emploi.'], 'Look for veut dire chercher.'),
  item('3e', 1, 'Choisis la bonne phrase :', 'If I were rich, I would travel.', ['If I am rich, I would travel.', 'If I were rich, I will travel.', 'If I would be rich, I travel.'], 'Pour une hypothèse : if et le prétérit, puis would.'),
  item('3e', 1, 'Que veut dire « I\'ve been learning English for four years » ?', 'J\'apprends l\'anglais depuis quatre ans.', ['J\'ai appris l\'anglais il y a quatre ans.', 'J\'apprendrai l\'anglais pendant quatre ans.', 'J\'ai quatre ans d\'anglais à apprendre.'], 'Have been suivi de -ing avec for : depuis, et ça continue.'),
  item('3e', 1, 'Que veut dire « two years ago » ?', 'il y a deux ans', ['depuis deux ans', 'dans deux ans', 'pendant deux ans'], 'Ago veut dire il y a, dans le passé.'),
  item('3e', 2, '« The law was voted in 1905. » Cette phrase est :', 'à la voix passive', ['au présent simple', 'au futur', 'à l\'impératif'], 'Be suivi du participe passé forme le passif.'),
  item('3e', 2, 'Complète : The woman … won the election is my aunt.', 'who', ['which', 'whose', 'where'], 'Who reprend une personne.'),
  item('3e', 2, 'Complète : The book … I read was great.', 'which', ['who', 'whose', 'when'], 'Which reprend une chose.'),
  item('3e', 2, 'Que veut dire « Everyone has the right to vote » ?', 'Tout le monde a le droit de voter.', ['Tout le monde doit voter.', 'Personne ne peut voter.', 'Chacun a voté.'], 'Right veut dire droit, ici.'),
  item('3e', 2, 'Qui a dit « I have a dream » en 1963 ?', 'Martin Luther King', ['Barack Obama', 'Winston Churchill', 'Nelson Mandela'], 'Il défendait les droits civiques des Afro-Américains.'),
  item('3e', 3, '« The telephone was invented by Bell. » En français :', 'Le téléphone a été inventé par Bell.', ['Bell utilise le téléphone.', 'Le téléphone inventera Bell.', 'Bell a été appelé au téléphone.'], 'Was invented est au passif : a été inventé.'),
  item('3e', 3, 'La capitale du Royaume-Uni est :', 'London', ['Edinburgh', 'Dublin', 'Washington'], 'Londres est la capitale du Royaume-Uni. Dublin est celle de l\'Irlande.'),
  item('3e', 3, 'Combien d\'États forment les États-Unis ?', '50', ['13', '52', '48'], 'Les États-Unis comptent 50 États.'),
  item('3e', 3, 'Choisis la bonne phrase :', 'She said that she was tired.', ['She said me that she was tired.', 'She told that she was tired.', 'She say that she was tired.'], 'Said that, sans complément. Told demande un complément : told me.'),
  item('3e', 3, 'Que veut dire « Scientists have discovered a new vaccine » ?', 'Des scientifiques ont découvert un nouveau vaccin.', ['Des scientifiques cherchent un vaccin.', 'Un vaccin a découvert des scientifiques.', 'Des scientifiques refusent un vaccin.'], 'Have discovered est au present perfect.'),
];

/** Les mots anglais courants qui signalent une phrase anglaise. */
const MOTS_ANGLAIS = /\b(i|i'm|i've|you|your|my|his|her|the|a|an|is|are|am|was|were|it|it's|this|these|there|what|what's|how|when|why|where|who|do|does|don't|doesn't|didn't|can|can't|have|has|had|will|would|should|must|mustn't|yes|no|please|thank|hello|goodbye|of|to|in|on|at|and|we|she|he|they)\b/i;

/** Une phrase est anglaise si elle n'a aucun accent français et contient un mot anglais courant. */
export function looksEnglish(text: string): boolean {
  return !/[àâçéèêëîïôûùüœ]/i.test(text) && MOTS_ANGLAIS.test(text);
}

const citation = (prompt: string) => prompt.match(/« (.+?) »/)?.[1];

/** La langue des citations et des réponses, pour que la voix lise l'anglais avec l'accent anglais. */
function avecVoix(entry: WrittenItem): WrittenItem {
  const quote = citation(entry.prompt);
  const voice = {
    ...(quote && looksEnglish(quote) && { quote: 'en-GB' as const }),
    ...([entry.correct, ...entry.wrong].every(looksEnglish) && { choices: 'en-GB' as const }),
  };
  return Object.keys(voice).length > 0 ? { ...entry, voice } : entry;
}

/** Les mots d'une phrase, sans la ponctuation : les étiquettes ne portent que des mots. */
const motsDe = (phrase: string) =>
  phrase
    .trim()
    .split(/\s+/)
    .map((mot) => mot.replace(/[.,!?;:]+$/, ''))
    .filter((mot) => mot.length > 0);

/**
 * « Remets les mots dans l'ordre », dans les deux sens, à partir des
 * traductions déjà écrites : « Comment dit-on « Je n'aime pas les chiens » ? »
 * devient « Traduis en anglais » avec les étiquettes I, don't, like, dogs. Les
 * intrus viennent des mauvaises réponses de la même question : ce sont les
 * pièges que l'élève a déjà croisés. Vers le français, pas d'intrus : avec
 * « est-il » en plus, « Quel jour est-il » serait juste et compté faux. L'ordre
 * des étiquettes est tiré une fois pour toutes, à partir de la phrase.
 */
export function itemsAOrdonner(phrases: WrittenItem[]): WrittenItem[] {
  return phrases.flatMap((entry) => {
    const quote = citation(entry.prompt);
    if (!quote || !/^(Comment dit-on|Que veut dire) « /.test(entry.prompt)) return [];
    const versAnglais = entry.prompt.startsWith('Comment dit-on') && looksEnglish(entry.correct) && !looksEnglish(quote);
    const versFrancais = entry.prompt.startsWith('Que veut dire') && looksEnglish(quote) && !looksEnglish(entry.correct);
    if (!versAnglais && !versFrancais) return [];
    const words = motsDe(entry.correct);
    // Une phrase d'un mot ne se range pas, une trop longue décourage.
    if (words.length < 3 || words.length > 9) return [];
    const enMinuscules = words.map((mot) => mot.toLowerCase());
    const intrus = versAnglais
      ? [...new Set(entry.wrong.flatMap(motsDe))].filter((mot) => !enMinuscules.includes(mot.toLowerCase())).slice(0, 3)
      : [];
    let graine = 0;
    for (const lettre of entry.correct) graine = (graine * 31 + lettre.charCodeAt(0)) >>> 0;
    const bank = rngShuffle(createRng(graine + 1), [...words, ...intrus]);
    return [
      {
        level: entry.level,
        trimester: entry.trimester,
        instruction: 'Touche les mots dans le bon ordre',
        prompt: `${versAnglais ? 'Traduis en anglais' : 'Traduis en français'} : « ${quote} »`,
        correct: entry.correct,
        wrong: [],
        explanation: entry.explanation,
        wordOrder: { words, bank, sentence: entry.correct },
        voice: versFrancais ? { quote: 'en-GB' } : { choices: 'en-GB' },
        practiceOnly: true,
      },
    ];
  });
}

export const generateMots = writtenGenerator('anglais-mots', itemsDuLexique());
const TOUTES_LES_PHRASES = uniques([...PHRASES, ...supplement('anglais-phrases')]);
export const generatePhrases = writtenGenerator('anglais-phrases', [...TOUTES_LES_PHRASES.map(avecVoix), ...itemsAOrdonner(TOUTES_LES_PHRASES)]);
