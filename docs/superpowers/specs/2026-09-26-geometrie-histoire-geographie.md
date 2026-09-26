# Géométrie, histoire et géographie (design)

## Demande

« Le design est super, peut-on pousser avec les mêmes consignes à l'histoire,
la géographie, et aussi la géométrie ? » Choix retenu : l'histoire et la
géographie sont **deux matières** distinctes ; la géométrie devient une
**notion des maths**. Les consignes restent celles de l'application : le
programme, trimestre par trimestre ; une seule matière par séance ; le design
« École Arc-en-Ciel ».

## Ce qui change pour l'élève

- L'accueil propose quatre matières (grille de deux sur deux) : français,
  maths, histoire, géographie. La phrase sous le choix le rappelle : une
  séance ne mélange jamais deux matières.
- **Maths** gagne une quatrième notion, **Géométrie**, avec une figure à
  regarder pour chaque question.
- **Histoire** : Se repérer dans le temps, Personnages et événements, Les mots
  de l'histoire. **Géographie** : Se repérer dans l'espace, Habiter le monde,
  Les mots de la géographie. Activités : questions et révision (pas
  d'opération posée).
- Après chaque réponse, une courte **explication** (« 1789 est au XVIIIe
  siècle : les années 1701 à 1800 ») dans l'encadré de la notion.
- Le bilan dit « Séance d'histoire terminée », « Séance de géographie
  terminée » (élision gérée par `ofSubject`).

## Les figures

Une figure est une **donnée** (`src/lib/figures.ts` : segments, polygones,
cercles, arcs, codages, angles droits, quadrillage…), dessinée en SVG par
`FigureView`. Comme ce sont des données, les tests vérifient la figure elle-même,
pas une image : un carré a bien quatre côtés égaux et quatre angles droits, la
figure tient dans son cadre, le point demandé est bien sur la case annoncée.

- **Solides** en perspective cavalière ; les arêtes cachées, en pointillés,
  sont calculées à partir de l'orientation des faces, pas dessinées à la main.
- **Patrons du cube** : un patron est validé en faisant rouler un dé sur ses
  cases — c'en est un si les six faces du dé sont posées une fois chacune. Les
  onze patrons du cube et les faux patrons sont vérifiés au chargement.
- Chaque figure porte un texte de remplacement pour les lecteurs d'écran.

## Progression

### Géométrie (programme de mathématiques 2025, « Espace et géométrie »)

Cumulative, comme le reste des maths ; la moitié des questions porte sur les
nouveautés du trimestre.

| | 1er trimestre | 2e trimestre | 3e trimestre |
|---|---|---|---|
| **CM1** | polygones, droites parallèles et perpendiculaires, angles droits, repérage sur quadrillage | quadrilatères et triangles particuliers (avec leur codage), cercle, propriétés | solides (faces, arêtes, sommets), axes de symétrie, rayon et diamètre |
| **CM2** | angles aigus, droits, obtus ; parallélogramme | propriétés des figures, symétrie de figures plus riches | patrons du cube, le degré |

### Histoire et géographie

Chaque année a son programme : un élève de CM2 ne reçoit pas les questions du
CM1. À l'intérieur de l'année, la progression est cumulative, et la moitié des
questions au moins porte sur le trimestre en cours.

- **CM1** — programme publié au BO n° 22 du 28 mai 2026, en vigueur au CM1 dès
  la rentrée 2026. Histoire : la vie quotidienne au Moyen Âge (T1) ; la
  monarchie, de François Ier à Louis XIV (T2) ; explorations et conquêtes,
  puis 1789 (T3). Géographie : se repérer et se nourrir (T1) ; inégalités et
  déplacements (T2) ; communiquer avec Internet (T3).
- **CM2** — programme de 2020, que le CM2 garde en 2026-2027. Histoire : le
  temps de la République (T1) ; l'âge industriel (T2) ; des guerres mondiales à
  l'Union européenne (T3). Géographie : se déplacer (T1) ; communiquer grâce à
  Internet (T2) ; mieux habiter (T3).

Banque actuelle : 142 questions écrites en histoire, 142 en géographie, et
32 repères datés d'où l'application tire en plus des questions de dates, de
siècles, d'ordre chronologique et de frise. La rose des vents (4 directions
au CM1, 8 au CM2) est dessinée ; les autres questions de cartes sont écrites.

## Les couleurs

L'arc-en-ciel passe à sept couleurs : la géométrie prend le rose, le calcul et
les problèmes se décalent légèrement pour rester distincts. L'histoire et la
géographie ont chacune leur arc de trois couleurs (or, bordeaux, bleu roi ;
bleu de la mer, vert des plaines, terre cuite). Dans chaque matière, toutes
les paires de notions ont été vérifiées pour les daltoniens (écart ΔE ≥ 8,
et ≥ 15 en vision normale), et chaque texte coloré atteint 4,5:1 sur son fond.
Les icônes de l'application sont régénérées avec les sept bandes.

## Côté maîtresse

- Une rangée d'onglets **Matière affichée** (seulement les matières que les
  élèves ont travaillées, la plus pratiquée d'abord) : le profil, les
  courbes, les attendus de fin d'année et la répartition suivent la matière
  choisie.
- Les étiquettes des graphiques utilisent des noms courts (« Repères »,
  « Cartes », « Vocabulaire ») pour ne pas être coupées.
- Dans la liste des élèves, les pastilles de niveau sont groupées par matière
  travaillée.

## La base

`supabase/004_histoire_geographie.sql` élargit la liste des matières
acceptées (`sessions_subject_check`). À passer **avant** de publier : sans
elle, une séance d'histoire ou de géographie serait refusée par la base et
resterait en attente sur la tablette. Rejouable. Les tests de sécurité
vérifient que « histoire » et « géographie » passent et qu'une matière
inconnue est refusée.

## Limites connues

- Le texte officiel du programme CM1 2026 n'a pas pu être consulté depuis
  l'environnement de travail (sites du ministère inaccessibles) : les contenus
  CM1 s'appuient sur ses résumés publics et sont **à relire sur le BO**.
- Pas encore de vraie carte dessinée (continents, France) : les questions de
  cartes sont écrites, sauf la rose des vents.
- Le chat avec Claude reste limité aux problèmes de maths.
