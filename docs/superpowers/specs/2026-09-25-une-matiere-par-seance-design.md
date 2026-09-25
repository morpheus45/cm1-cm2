# Une matière par séance (design)

Date : 2026-09-25
Statut : implémenté

## Contexte

Une séance tirait ses huit questions dans les six notions sélectionnées, puis
les battait comme un jeu de cartes. Un enfant pouvait donc enchaîner une
conjugaison, une division posée, une dictée de nombres, un accord dans le
groupe nominal. Chaque question demandait de changer complètement de posture
mentale, et la séance ne ressemblait à aucun moment de classe : à l'école, on
fait du français, puis on fait des maths.

Pour un enfant qui a du mal à tenir son attention, ce changement permanent est
le principal coût de la séance — avant même la difficulté des questions.

## Décision

**Une séance porte sur une seule matière.** Le français d'un côté
(conjugaison, accords, orthographe et vocabulaire), les maths de l'autre
(numération, calcul, problèmes). Il n'existe aucun chemin, ni dans l'interface
ni dans le moteur, qui produise une séance mêlant les deux.

**Les questions se suivent par blocs de notion.** Dans une séance de français
portant sur la conjugaison et l'orthographe, l'élève fait d'abord toute la
conjugaison, puis toute l'orthographe. L'ordre des blocs est fixe (celui de
`SUBJECT_DOMAINS`), pour que deux séances se ressemblent.

## Mécanique technique

### Types

`src/types.ts` distingue désormais deux niveaux :

- `Subject` — `'francais' | 'maths'`, ce que l'école appelle une matière ;
- `Domain` — les six notions, inchangées.

`SUBJECT_DOMAINS` donne les notions de chaque matière, dans l'ordre où leurs
blocs se suivront. `subjectOf(domain)` fait le chemin inverse.

### Garde-fou dans le moteur

`buildSession` appelle `subjectOfDomains`, qui lève une erreur si la liste
enjambe les deux matières. Ce n'est pas une garantie décorative : c'est le
seul endroit du code capable de mélanger les questions, donc le seul endroit
où la règle peut être tenue. L'interface la rend inatteignable, le moteur la
rend impossible.

La séance retournée n'est plus un simple tableau de questions mais un objet
`Session` : `{ subject, domains, level, trimester, questions }`. L'écran de
question peut ainsi afficher « 📖 Français · Conjugaison » au-dessus de chaque
énoncé, et l'écran de bilan « Séance de français terminée ».

### Écran d'accueil

Le sélecteur « Matières » à six cases devient deux étapes : un choix de
matière (deux grands boutons), puis les notions de cette matière. Changer de
matière réinitialise la sélection aux notions de la nouvelle : il n'existe
donc aucun état de l'interface d'où l'on pourrait lancer une séance mixte.

## Hors périmètre

- Choisir l'ordre des blocs, ou en varier l'ordre d'une séance à l'autre.
- Une séance « mixte » assumée pour les révisions de fin d'année : ce serait
  exactement ce que cette décision écarte, il faudra une bonne raison pour y
  revenir.

## Test / validation

- `buildSession` refuse toute liste de notions qui enjambe les deux matières.
- Pour chaque sous-ensemble de notions d'une matière, toutes les questions
  produites appartiennent à cette matière.
- La suite des notions dans une séance forme un bloc continu par notion, dans
  l'ordre de la matière — vérifié en comptant les changements de notion.
