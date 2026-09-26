# Opérations posées, écrites à la main (design)

Date : 2026-09-26
Statut : implémenté

## Contexte

Une question à choix multiples ne dit rien du raisonnement. Un élève qui coche
« 526 » a pu poser l'addition proprement, la faire de tête, ou tomber juste par
chance — et la maîtresse ne peut pas faire la différence. Or en calcul posé,
c'est précisément la technique qui s'apprend et qui se corrige : l'alignement
des chiffres, la retenue, la place de la virgule.

L'application doit donc garder la trace de ce que l'enfant écrit, et la rendre
lisible par l'adulte qui corrige.

## Décision

Une séance de maths peut prendre deux formes, choisies sur l'écran d'accueil :

- **Questions** — les choix multiples, tels qu'ils existaient ;
- **Opérations posées** — six opérations à écrire à la main, au doigt ou au
  stylet, sur un cadre à petits carreaux ; la séance produit un PDF.

Ce sont deux exercices distincts, et non un mélange : une opération posée
demande une ou deux minutes, une question à choix quelques secondes. Les
enchaîner dans la même séance rendrait sa durée imprévisible, et le PDF
inutilisable pour la maîtresse.

Poser une opération n'existe qu'en maths : le sélecteur ne s'affiche pas en
français, et une activité enregistrée pour les maths ne resurgit pas quand la
matière relue est le français.

## Mécanique technique

### Les traits

Un trait est une suite de points exprimés **en fractions du cadre** (0 à 1),
jamais en pixels. La même opération se redessine alors à l'identique sur un
téléphone, sur la tablette de la maîtresse et sur le PDF imprimé, quelle que
soit la taille de l'écran. Le cadre garde partout la même proportion — quatre
tiers — sans quoi l'écriture serait étirée d'un support à l'autre.

Le quadrillage compte dix-huit carreaux dans la largeur, à l'écran comme sur
le papier : c'est lui qui permet d'aligner les chiffres, il doit donc être le
même des deux côtés.

### Quelles opérations

`buildOperations(..., { posableOnly: true })` ne retient que les techniques qui
s'écrivent en colonnes — les tables de multiplication en sont exclues, elles se
récitent — et demande aux générateurs des nombres plus grands. Sans cela le
tirage sortait « 14 ÷ 7 » ou « 37 + 1,8 » : des opérations qu'on fait de tête,
et dont la mise en colonnes n'apprend rien. Un test garde cette règle pour
chaque niveau et chaque trimestre.

La progression par trimestre reste celle du programme : addition et
soustraction au CM1-T1, multiplication par un chiffre au T2, multiplication à
deux chiffres et division au T3, puis les décimaux au CM2.

### Le PDF

`src/lib/pdf.ts` écrit le fichier sans dépendance. Le besoin est étroit — du
texte, des traits, des rectangles — et le format PDF y répond directement :
une police standard n'a pas besoin d'être embarquée. Ajouter une bibliothèque
de plusieurs centaines de kilo-octets à une application que des enfants ouvrent
sur la tablette de la classe coûterait plus cher que ces deux cents lignes.

Deux pièges du format, tous deux vérifiés par des tests :

- la table `xref` de la fin doit donner la position **en octets** de chaque
  objet ; un décalage d'un seul octet et le lecteur refuse le fichier, sans
  rien expliquer ;
- les chaînes du dictionnaire d'informations (titre, auteur) ne sont pas lues
  avec l'encodage des pages. Le lecteur y applique PDFDocEncoding, où un tiret
  cadratin s'affiche « Š ». Elles sont donc écrites en UTF-16.

Une page porte six opérations, en deux colonnes : pour chacune l'énoncé,
l'écriture de l'élève sur son quadrillage, sa réponse, et une coche ou une
croix — dessinées au trait, la police standard d'un PDF n'ayant ni l'une ni
l'autre.

Le modèle prévoit déjà des traits de correction (`teacherStrokes`), rendus en
rouge par-dessus ceux de l'élève.

## Hors périmètre

- La page de la maîtresse : correction à l'écran et suivi de progression.
- La conservation des feuilles d'une séance à l'autre.

## Test / validation

- Chaque niveau et chaque trimestre ne proposent que des opérations déjà
  enseignées, et toutes valent la peine d'être posées.
- Le résultat attendu est exact pour chaque opération produite.
- La saisie est comparée au résultat sans pinailler sur l'écriture : la
  virgule vaut le point, et « 12,0 » vaut « 12 ».
- Le PDF est vérifié dans un vrai navigateur : écrit à la main dans
  l'application, téléchargé, puis rouvert — Chromium refuse d'afficher un PDF
  invalide, l'ouvrir est donc la preuve qu'il est correct.
