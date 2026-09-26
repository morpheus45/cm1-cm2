# Design « École Arc-en-Ciel »

## Pourquoi

Le premier habillage était celui qu'on voit partout : police du système,
boutons aux couleurs par défaut de l'outil, émojis. Demande : le nom de l'école
en titre, et « quelque chose qu'on ne voit pas partout ».

## L'idée

**Le cahier d'une école française, et un arc-en-ciel qui a du sens.**

- **Le titre** « École Arc-en-Ciel » est écrit en cursive d'école (Playwrite
  France Moderne, conçue pour l'apprentissage de l'écriture en France), sous
  un arc-en-ciel tracé comme aux craies grasses (bord irrégulier : filtre SVG
  `feDisplacementMap`).
- **Les pages** sont des feuilles de cahier Seyès : lignes bleues fines tous
  les 2 mm, plus marquées tous les 8 mm, et la marge rouge.
- **L'arc-en-ciel des notions** : une couleur par notion, le français du côté
  chaud (conjugaison rouge, accords orange, orthographe jaune), les maths du
  côté froid (numération vert, calcul bleu, problèmes violet). Le choix de la
  matière montre la moitié de l'arc qui lui revient : la règle « une matière
  par séance » se voit.
- **Les objets de la classe** : étiquettes d'écolier pour les choix (bord
  d'encre, ombre qui s'enfonce sous le doigt), gommettes pour la progression
  (une par question, à la couleur de sa notion) et les étoiles, le tampon
  encreur de la maîtresse (« Bravo ! », légèrement de travers) et la note
  écrite en rouge, entourée, en fin de séance. Côté maîtresse, le code de la
  classe s'affiche à la craie sur un petit tableau noir.
- **L'encre** : le bouton principal est bleu nuit, comme l'encre du
  stylo-plume.

## Les jetons

`src/theme.ts` (couleurs des notions : `band` pour les dessins, `deep` pour les
textes et bordures, `tint` pour les fonds) et `tailwind.config.js` (`papier`,
`encre`, `encre-douce`, `encre-pale`, polices `sans` et `cursive`). Les classes
`.cahier`, `.etiquette`, `.bouton-encre` et `.tampon` sont dans
`src/index.css` ; les composants dans `src/components/ecole/`.

## Lisibilité

- Texte courant en **Andika**, dessinée pour les lecteurs débutants : chaque
  lettre s'y distingue (I, l, 1). La cursive ne sert qu'au titre, aux prénoms
  et à la note.
- Chaque couleur de texte atteint **4,5:1** au moins sur son fond — vérifié
  par le calcul, pour les encres sur le papier comme pour chaque notion
  (`deep` sur `tint` : de 4,5 à 5,9). La craie sur le tableau : 10,8:1.
- Jamais la couleur seule : une bonne réponse porte aussi une gommette cochée,
  chaque notion son nom.
- Le mouvement se coupe quand l'appareil le demande
  (`prefers-reduced-motion`) ; le focus clavier est bien visible.
- Les graphiques de l'espace maîtresse gardent leur palette, validée à part
  (daltonisme) ; seuls leurs petits textes gris ont été foncés (5,7:1).

## Hors connexion, sans tiers

Les polices (licence OFL) viennent de paquets npm (`@fontsource`) et sont
intégrées au build : le service worker les met en cache, et aucune requête ne
part vers un service de polices. Poids ajouté : 66 Ko (trois fichiers woff2).

## L'icône

Générée sans dépendance par `tools/generate-icons.mjs` : l'arc-en-ciel des six
notions sur une page de cahier, avec suréchantillonnage 4×4 pour des bords
lisses jusqu'en 32 pixels. Nom de l'application : « École Arc-en-Ciel »
(« Arc-en-Ciel » sous l'icône).
