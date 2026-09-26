# Espace maîtresse (design)

Date : 2026-09-26
Statut : implémenté — en local comme en classe. La mise en commun fonctionne
dès que les deux valeurs de Supabase sont fournies au build ; sans elles,
l'application reste entièrement sur l'appareil.

## Contexte

Jusqu'ici l'application ne gardait qu'un compteur d'étoiles. Une maîtresse qui
voulait savoir où en est un élève n'avait rien à regarder.

## Les quatre vues

Elles ont été dessinées puis soumises à l'utilisateur avant d'être codées ;
toutes les quatre ont été retenues.

| Vue | Ce qu'elle répond |
|---|---|
| **Niveau de maîtrise** | « Que mettre sur le livret ? » — l'échelle à quatre niveaux du LSU, notion par notion |
| **Profil** (toile d'araignée) | « Où est le point faible ? » — les six notions d'un coup d'œil |
| **Progression** | « Est-ce que ça s'améliore ? » — la réussite dans le temps |
| **Dans la classe** | « Est-ce un problème de cet élève, ou de toute la classe ? » |

### Les couleurs, et ce qui les rend lisibles

Les quatre niveaux portent des couleurs, mais **jamais seules** : le niveau est
toujours écrit en toutes lettres à côté, et chaque case porte son numéro de 1 à
4. Un adulte daltonien — environ un homme sur douze — lit donc la même chose
que les autres. Chaque couleur dépasse par ailleurs le rapport de contraste de
3:1 sur fond blanc, ce qu'un test vérifie.

Les seuils (85 %, 65 %, 40 %) sont une **convention de l'application** : le
livret scolaire n'en fixe aucun. Ils sont rassemblés dans une seule constante
pour qu'une maîtresse qui les trouve trop sévères n'ait qu'un endroit à changer.

### Ce que l'application refuse d'affirmer

En dessous de huit exercices dans une notion, aucun niveau n'est annoncé. Deux
bonnes réponses sur deux ne font pas une « très bonne maîtrise », et afficher
un niveau sur si peu tromperait la maîtresse — c'est exactement le genre de
chiffre qui finirait recopié sur un bulletin.

De la même façon, la toile d'araignée distingue « 0 % » de « jamais
travaillé » : le second est un cercle creux et un tiret, pas un point au
centre.

### La courbe suit les dates, pas un numéro de séance

Les points sont placés à la date réelle de la séance. Numéroter les séances
mettait au même endroit de l'axe une séance de français du 2 et une séance de
maths du 5 : la courbe racontait alors une histoire qui n'avait pas eu lieu.

## La mise en commun (à brancher)

L'utilisateur a tranché : la maîtresse corrige **depuis son propre appareil**,
pour **toute une classe**, et les élèves sont identifiés par **prénom et nom**.
Cela impose un serveur — `supabase/001_classes_eleves_seances.sql` en pose la
base.

Deux principes y gouvernent l'accès :

1. **L'application de l'élève n'a pas de compte**, et ne touche donc jamais aux
   tables. Elle appelle une fonction (`depose_seance`) qui vérifie le code de
   la classe avant d'écrire. La clé publique embarquée dans la page ne permet
   rien d'autre : ni lire la liste des élèves, ni modifier quoi que ce soit.
2. **La maîtresse ne voit que ses classes**, et c'est la base de données qui
   l'impose, pas le code de la page. Une erreur dans l'interface ne peut pas
   exposer la classe d'à côté.

### Ce que cela engage

Héberger les prénoms et noms d'élèves d'une classe, avec leurs résultats, fait
de l'école la responsable de ces données. Ce n'est pas un détail technique :
c'est une décision, prise en connaissance de cause après qu'elle a été
signalée. L'alternative — prénom seul et code de classe — avait été
recommandée et n'a pas été retenue.

Le schéma limite au moins ce qui est stocké : aucune adresse, aucune date de
naissance, aucun identifiant qui suive l'enfant hors de la classe, et tout est
supprimé en cascade quand la classe l'est.

## Un dossier par élève

Plusieurs enfants peuvent travailler sur le même appareil. Chaque séance porte
le nom de celui qui l'a faite, et l'espace maîtresse ouvre sur la liste des
dossiers : nom, nombre de séances, date de la dernière, et six pastilles qui
résument les six notions.

L'identité est insensible aux accents, à la casse et aux espaces en trop :
« Léa  MARTIN » et « léa martin » sont le même enfant, pas deux dossiers. Le
nom de famille, lui, sépare bien deux Léa.

La répartition de la classe se calcule à partir des dossiers présents. Elle
affiche l'effectif à côté des pourcentages : sur deux élèves, un seul fait
50 %, et le graphique le dit plutôt que de laisser croire à une classe.

## Le bilan d'année

Une carte « Attendus de fin d'année » compte les notions tenues, liste ce
qu'il reste à reprendre en priorité, puis les acquis, puis ce sur quoi
l'application ne se prononce pas encore. Le seuil retenu pour « tenu » est le
niveau satisfaisant.

Les séances sont regroupées par année scolaire, qui commence en septembre :
une séance de juin 2027 appartient à l'année 2026-2027, pas à la suivante.
Quand un élève a des séances sur deux années, un sélecteur apparaît.

## La révision ciblée

Un troisième type de séance, à côté des questions et des opérations posées.
L'application choisit elle-même les deux notions les plus fragiles de l'élève
dans la matière demandée, et construit la séance dessus.

Une notion jamais travaillée passe devant une notion réussie : ne pas savoir
si un élève tient une notion est une lacune au même titre que de savoir qu'il
ne la tient pas. Un élève qui n'a encore rien fait travaille donc toute la
matière, sans traitement particulier.

La règle des matières tient ici comme ailleurs : la révision ciblée reste dans
une seule matière.

## Effacer les données

L'espace maîtresse efface le dossier d'un élève, ou toutes les séances de tous
les élèves. Un effacement ne se fait jamais d'un seul geste : le bouton demande
confirmation, et ce qui va disparaître est nommé et compté.

C'est aussi ce qui permet de se débarrasser des séances faites pour essayer
l'application.

## L'envoi des séances à la maîtresse

L'élève tape une fois le **code de la classe** que lui donne sa maîtresse. Le
champ n'apparaît que si la mise en commun est configurée : sans Supabase, il ne
promettrait qu'un envoi qui n'aurait jamais lieu.

Chaque séance terminée part alors vers la base par `depose_seance`. Trois
garanties, chacune vérifiée de bout en bout dans un navigateur, à travers la
bibliothèque de Supabase, jusqu'à la vraie fonction SQL sur PostgreSQL :

- **Rien ne se perd hors ligne.** Un envoi qui échoue faute de réseau attend
  dans une file sur la tablette, et repart au lancement suivant.
- **Rien n'est compté deux fois.** L'identifiant de la séance vient de
  l'appareil, et la base ignore un second envoi du même identifiant — ce qui
  arrive quand le réseau coupe après l'enregistrement mais avant la réponse.
- **Un refus ne bloque pas la file.** Un code de classe inconnu est signalé à
  l'enfant (« vérifie le code de la classe »), et la séance n'est pas renvoyée
  en boucle : la renvoyer n'y changerait rien.

Un test compare les paramètres envoyés par l'application à ceux déclarés dans
le fichier SQL : une faute de frappe d'un côté ne se verrait sinon qu'en ligne,
par des séances qui n'arrivent jamais.

La bibliothèque de Supabase double le poids de l'application : elle n'est
chargée qu'au premier envoi, et jamais sur un appareil où la mise en commun
n'est pas configurée.

## Le côté maîtresse, en classe

Avec Supabase configuré, l'accès maîtresse demande un compte (e-mail et mot de
passe). La maîtresse crée sa classe, l'application lui affiche le code à
donner aux élèves, et les dossiers se remplissent à mesure que les séances
arrivent — de n'importe quelle tablette.

Deux actions passent par des fonctions SQL plutôt que par les tables :
`creer_classe`, qui tire un code sans caractères ambigus (ni 0 ni O, ni 1 ni I
ni L), et `lire_ma_classe`, qui rend classes, élèves et séances en un appel.
Les deux s'exécutent avec les droits de l'appelant : c'est la RLS qui décide
de ce qu'elles voient, elles ne peuvent rien montrer de plus que les tables.

Effacer ne veut plus dire la même chose qu'en local : en classe, le bouton
supprime l'élève de la base, pour tous les appareils. Les libellés et la
confirmation le disent (« Retirer Noé Petit de la classe… sur tous les
appareils »), pour qu'une maîtresse ne vide pas sa classe en croyant nettoyer
sa tablette.

Un compte peut être utilisé sans rien configurer d'autre : « Continuer sans
compte » ouvre les dossiers de l'appareil, comme avant.

### Vérifié de bout en bout

Supabase est injoignable depuis l'environnement où ce code a été écrit. Le
chemin complet a donc été reproduit : un relais joue le rôle de l'API et de la
connexion de Supabase, devant la vraie base PostgreSQL avec le vrai script, et
appelle les fonctions par le nom de leurs paramètres, comme Supabase. Trois
navigateurs séparés — trois stockages distincts, qui ne partagent rien sauf la
base :

1. la maîtresse crée son compte et sa classe, et reçoit un code ;
2. deux élèves, chacun sur sa tablette, déposent une séance avec ce code tapé
   en minuscules ;
3. la maîtresse actualise et voit les deux dossiers ;
4. elle retire un élève : il disparaît de la base, séances comprises ;
5. une autre maîtresse ne voit rien de cette classe ;
6. un mauvais mot de passe donne un message en français.

## La correction à distance des opérations posées

La maîtresse corrige sur sa propre tablette, au stylet, les feuilles que ses
élèves ont écrites à la main.

- **Ce qui attend** : le bandeau de la classe compte les feuilles à corriger,
  et « Corriger » les enchaîne, la plus ancienne d'abord. Dans la liste, chaque
  élève porte sa pastille « N feuilles à corriger » ; dans son dossier, la carte
  « Opérations posées » liste ses feuilles, corrigées ou non.
- **L'écran** : une opération à la fois, pour écrire en grand. L'écriture de
  l'élève est dessous, intouchable ; l'encre rouge de la maîtresse par-dessus.
  Annuler le dernier trait, effacer ses traits, et une appréciation d'une ou
  deux lignes. Dès qu'un stylet a servi, les contacts du doigt sont ignorés :
  la paume posée sur l'écran n'écrit pas.
- **Enregistrer** : une feuille relue sans rien à annoter est tout de même
  « corrigée » — la maîtresse l'a vue. Quitter avec des annotations non
  enregistrées demande confirmation.
- **Le PDF corrigé** porte l'appréciation sous le nom de l'élève et les traits
  rouges sur chaque opération ; son nom de fichier finit par « -corrigee ».

Rien à changer dans Supabase : la table `worksheets`, sa RLS et les droits de
la maîtresse existaient déjà. La liste des feuilles ne charge pas les tracés,
bien plus lourds : ils ne viennent qu'à l'ouverture d'une feuille. La base ne
signalant rien quand la RLS écarte une ligne à modifier, l'application vérifie
qu'une ligne a bien été enregistrée avant d'annoncer « enregistré ».

Vérifié de bout en bout sur le banc d'essai (PostgreSQL et relais jouant
l'API de Supabase) : une élève dépose deux feuilles ; la maîtresse corrige la
première, l'enregistrement est lu dans la base, le PDF téléchargé porte
l'appréciation et l'encre rouge, la feuille rouverte a gardé ses traits ;
« Feuille suivante » ouvre la seconde ; fermer sans enregistrer est retenu
par une confirmation ; une autre maîtresse ne peut ni lire ni modifier la
feuille, un visiteur sans compte non plus.

L'accès maîtresse n'est chargé qu'à l'ouverture : les tablettes des élèves
ne le téléchargent pas, et le service worker le garde en cache pour le
hors-ligne.

## Hors périmètre de cette première partie

- Plusieurs classes pour une même maîtresse : la base les accepte, l'écran
  n'affiche que la première.
- L'élève ne voit pas encore la correction de sa maîtresse dans l'application :
  elle la lui transmet par le PDF corrigé.
- Sans compte, la vue « Dans la classe » ne connaît que les élèves de
  l'appareil ; avec un compte, elle montre toute la classe.

## Test / validation

- Les seuils de maîtrise ne descendent jamais quand la réussite monte.
- Aucun niveau n'est annoncé sous huit exercices.
- Les quatre couleurs dépassent 3:1 sur fond blanc, et chacune a un libellé.
- Une séance mal formée dans le stockage est écartée sans emporter les autres.
- Les quatre vues ont été rendues dans un vrai navigateur, à la taille d'un
  téléphone, avec six séances d'exemple.
