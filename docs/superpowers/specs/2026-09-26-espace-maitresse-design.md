# Espace maîtresse (design)

Date : 2026-09-26
Statut : implémenté en local — un dossier par élève, les quatre vues, le bilan
d'année, la révision ciblée et l'effacement des données. La mise en commun par
le réseau reste à brancher.

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

## Hors périmètre de cette première partie

- La connexion de la maîtresse, la création de sa classe (et de son code), et
  la lecture des dossiers depuis la base : l'accès maîtresse ne lit encore que
  les séances de l'appareil.
- La correction à l'écran par la maîtresse (le modèle prévoit déjà les tracés
  de correction, mais l'écran reste à faire).
- Une vraie classe : la vue « Dans la classe » ne connaît que les élèves de
  l'appareil.

## Test / validation

- Les seuils de maîtrise ne descendent jamais quand la réussite monte.
- Aucun niveau n'est annoncé sous huit exercices.
- Les quatre couleurs dépassent 3:1 sur fond blanc, et chacune a un libellé.
- Une séance mal formée dans le stockage est écartée sans emporter les autres.
- Les quatre vues ont été rendues dans un vrai navigateur, à la taille d'un
  téléphone, avec six séances d'exemple.
