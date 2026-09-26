# Espace maîtresse (design)

Date : 2026-09-26
Statut : première partie implémentée — les quatre vues, alimentées par les
séances conservées sur l'appareil. La mise en commun par le réseau reste à
brancher.

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

## Hors périmètre de cette première partie

- Le client Supabase et l'envoi des séances.
- La correction à l'écran par la maîtresse (le modèle prévoit déjà les tracés
  de correction, mais l'écran reste à faire).
- La vue « Dans la classe » avec de vraies données : elle affiche pour l'instant
  son état vide, puisqu'un seul élève travaille sur l'appareil.

## Test / validation

- Les seuils de maîtrise ne descendent jamais quand la réussite monte.
- Aucun niveau n'est annoncé sous huit exercices.
- Les quatre couleurs dépassent 3:1 sur fond blanc, et chacune a un libellé.
- Une séance mal formée dans le stockage est écartée sans emporter les autres.
- Les quatre vues ont été rendues dans un vrai navigateur, à la taille d'un
  téléphone, avec six séances d'exemple.
