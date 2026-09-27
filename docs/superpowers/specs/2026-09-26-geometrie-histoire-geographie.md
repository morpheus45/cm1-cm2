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

### Géométrie, plus loin : construire, mesurer

Demande : « construire au doigt, mesurer, et plus de questions ». Tout reste
dans la notion Géométrie, trimestre par trimestre.

**Construire au doigt** (`src/lib/construction.ts`, écran
`ConstructionBoard`). L'élève ne choisit pas une réponse : il pose des points
sur un quadrillage, au doigt, au stylet, à la souris ou au clavier (flèches,
puis Entrée), les enlève en les touchant de nouveau, puis valide. Le point
touché va au croisement le plus proche : pas besoin d'être précis. La
vérification compare des croisements, pas des pixels ; une droite parallèle
ou perpendiculaire est juste quel que soit le second point choisi sur elle.
Les points déjà donnés (départ, sommets connus, point M) ne se touchent pas.
Après validation, la correction se trace en vert, les points justes restent
verts, les autres passent en orange.

| Construction | CM1 | CM2 |
|---|---|---|
| Poser l'étoile dans la case C4 | 1er trimestre | révision |
| Reproduire une figure (départ donné) | 1er trimestre | figures plus riches |
| Compléter un carré, un rectangle (placer D) | 2e trimestre | figures penchées |
| Tracer la parallèle, la perpendiculaire à (d) passant par M | 2e trimestre (droites horizontales, verticales, à 45°) | droites obliques |
| Compléter par symétrie | 3e trimestre (axe vertical ou horizontal) | 2e trimestre : axe penché |
| Agrandir une figure deux fois | — | 3e trimestre |

**Mesurer** (`geometrieMesures.ts`). Lire une règle graduée (le segment ne
part pas toujours de 0 ; centimètres au 1er trimestre du CM1, puis cm et mm,
puis nombres décimaux au CM2) ; le périmètre en ajoutant les côtés (CM1, 2e
trimestre), puis par la formule du carré et du rectangle (CM2) ; l'aire en
carreaux (CM1, 3e trimestre ; le périmètre est toujours proposé comme piège),
avec des demi-carreaux, puis l'aire du rectangle en cm² (CM2, 2e trimestre).

**Plus de questions** (`geometrieQuestions.ts`). Parmi trois droites
nommées, lesquelles sont parallèles, perpendiculaires (CM1) ; dans un cercle,
quel segment est un diamètre, un rayon (CM1, 3e trimestre) ; quel angle est
le plus grand, le plus petit — le plus grand a exprès les côtés les plus
courts (CM2) ; quelle phrase est vraie sur les figures (CM2).

**Ce que vérifient les tests.** Chaque construction accepte sa bonne réponse
et refuse une réponse décalée d'un carreau ; le symétrique est exact, la
figure complète ne se croise pas ; le rectangle complété a bien ses angles
droits ; la copie et l'agrandissement respectent le modèle ; la règle se lit
« fin moins début » ; les carreaux et demi-carreaux se comptent exactement ;
les droites désignées sont vraiment parallèles ou perpendiculaires, et leurs
noms ne prêtent pas à confusion ; le diamètre passe par le centre.

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
au CM1, 8 au CM2) est dessinée, ainsi que dix sortes de questions sur carte
(voir « Les cartes »).

## Les cartes

Deux fonds, dessinés comme les autres figures (des données, vérifiées par
les tests) :

- un **planisphère** (projection Natural Earth, centré sur l'Europe) : les
  six continents de l'école française (l'Amérique d'un seul tenant, l'Europe
  arrêtée à l'Oural, la Guyane en Amérique), les cinq océans, l'équateur ;
- une **carte de France** (projection conique conforme, comme les cartes
  officielles) : la France et la Corse, les pays voisins, onze grandes villes,
  la Seine, la Loire, la Garonne et le Rhône, les Alpes, les Pyrénées, le
  Massif central, le Jura et les Vosges, la Manche, la mer du Nord, l'océan
  Atlantique et la Méditerranée.

Ce que la question désigne est **en orange** (un continent, une ville) ou
marqué d'une **lettre** dans une pastille blanche (un océan, une mer, un
fleuve, un massif, un pays) ; jamais nommé. Le bleu reste celui de l'eau.

| Question | CM1 | CM2 |
|---|---|---|
| Quel continent est colorié ? Quel océan porte la lettre A ? | 1er trimestre | 1er trimestre |
| Quelle lettre marque la France ? (planisphère) | 1er trimestre | — |
| Quelle grande ville est marquée ? (8 villes au CM1, 11 au CM2) | 1er trimestre | 1er trimestre |
| Quelle mer, ou quel océan, porte la lettre A ? | 1er trimestre | 1er trimestre |
| Quel fleuve, quel massif, quel pays porte la lettre A ? | 2e trimestre | 1er trimestre |
| Laquelle de ces villes est la plus au nord (au sud, à l'est, à l'ouest) ? | 2e trimestre | 1er trimestre |
| Pour aller de Lyon à Marseille, dans quelle direction part-on ? | 2e trimestre (4 directions) | 1er trimestre (8 directions) |

Au-delà de leur trimestre, ces questions reviennent en révision. Dans une
séance, les cartes alternent avec les questions écrites et la rose des vents.

**D'où viennent les fonds.** `tools/generate-maps.mjs` (`npm run cartes`)
projette une fois pour toutes les contours de **Natural Earth** (domaine
public, paquet `world-atlas`) et écrit `src/domains/cartesFonds.ts` (34 Ko,
environ 16 Ko de plus à télécharger). Les villes, les massifs et les
étiquettes y sont placés en longitude et latitude ; les fleuves sont des
tracés simplifiés passant par les villes qu'ils traversent.

**Ce que le générateur refuse.** Une ville hors de France, une mer posée sur
la terre, une étiquette de pays hors de ce pays (vérifié sur les contours
d'origine), une lettre plus proche d'un autre fleuve ou d'un autre massif que
du sien, une pastille qui cache un fleuve, une montagne ou une ville, une
lettre qui sort du cadre.

**Ce que vérifient les tests.** Lille est au-dessus de Paris, Paris au-dessus
de Lyon ; la Seine passe par Paris, la Loire par Nantes, la Garonne par
Toulouse et Bordeaux, le Rhône par Lyon ; la lettre ou le point orange
désigne toujours la bonne réponse ; les noms de villes ne se chevauchent pas
et ne sortent pas du cadre. Une direction n'est demandée que si elle se lit
sans ambiguïté (à 12° près sur la carte, et le globe dit la même chose), et
« la plus au nord » que si la gagnante l'emporte nettement.

**Couleurs** (`MAP_COLORS`, dans `src/theme.ts`) : tout ce qui sert à
répondre atteint 3:1 sur son fond (orange sur la France 4,4, sur la mer 3,0 ;
fleuves 5,0 ; montagnes 5,6 ; frontières 3,5).

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
- Les cartes ne dessinent pas encore les régions, les départements ni
  l'outre-mer.
- L'assistant de Cédric reste limité aux problèmes de maths.
