# Progression par trimestre (design)

Date : 2026-09-25
Statut : validé par l'utilisateur, prêt pour planification d'implémentation

## Contexte

L'application distingue actuellement deux niveaux (CM1/CM2) mais génère des
questions sans tenir compte du moment de l'année scolaire : un enfant qui
commence son année en septembre peut recevoir des questions portant sur des
notions pas encore enseignées (ex. le futur en conjugaison CM1, ou une
division posée avant que la technique ait été vue en classe). Ce document
ajoute une troisième dimension — le **trimestre** (1, 2 ou 3) — qui filtre le
contenu généré selon une progression pédagogique standard du cycle 3.

## Principe de progression

Chaque trimestre est **cumulatif** : le trimestre 3 mélange les notions vues
depuis le trimestre 1, pas seulement les nouveautés du trimestre 3. Cela
reflète la réalité d'une évaluation de fin d'année et évite qu'une notion
apprise au premier trimestre ne soit plus jamais révisée.

## Table de progression (programme cycle 3)

| Domaine | CM1 — T1 | CM1 — T2 | CM1 — T3 | CM2 — T1 | CM2 — T2 | CM2 — T3 |
|---|---|---|---|---|---|---|
| Conjugaison | Présent | + Imparfait | + Futur, Passé composé | Révision des 4 temps CM1 | + Passé simple, Plus-que-parfait | + Conditionnel présent |
| Accords | Groupe nominal | Groupe nominal | Groupe nominal | Groupe nominal | + Participe passé avec être | + Participe passé avec être |
| Orthographe | a/à, et/est | + on/ont | + ce/se | Révision CM1 + son/sont | + ces/ses, ou/où | + c'est/s'est, synonymes |
| Numération | Jusqu'à 9 999 | Jusqu'à 99 999 | Jusqu'à 999 999 + fractions | Révision CM1 + jusqu'au million | Jusqu'au milliard + décimaux | + pourcentages |
| Calcul | Addition/soustraction posées, tables | + multiplication posée (1 chiffre) | + multiplication 2 chiffres, division | Révision 4 opérations + calcul mental | + décimaux (addition/soustraction) | + décimaux (multiplication/division) |
| Problèmes | 1 étape | + 2 étapes | 2 étapes (renforcement) | Révision 1-2 étapes | + plusieurs étapes | + proportionnalité |

## Mécanique technique

### Type

Ajout dans `src/types.ts` :
```ts
export type Trimester = 1 | 2 | 3;
```

### Signature des générateurs

Chaque générateur de domaine passe de `generate(level, rng, count)` à
`generate(level, trimester, rng, count)`. `buildSession` gagne un paramètre
`trimester` entre `level` et `seed` : `buildSession(subjects, level,
trimester, seed, count = 8)`.

### Matières à banque de contenu (conjugaison, accords, orthographe)

Chaque item de la banque de données gagne un champ `minTrimester: Trimester`
(le trimestre à partir duquel il devient éligible). Le générateur filtre le
pool disponible avec `item.minTrimester <= trimester` avant de piocher —
cumulatif par construction puisque le filtre est une inégalité large.

Pour la conjugaison, l'ensemble des temps proposés comme mauvaises réponses
(`tenseSet`) doit aussi être restreint aux temps déjà éligibles au trimestre
choisi, pour ne jamais proposer un temps non enseigné comme option de
réponse (cela ajouterait une confusion inutile, contraire à l'objectif
d'un enfant TDA qui a besoin de repères stables).

### Matières procédurales (numération, calcul, problèmes)

Le trimestre borne les plages de nombres et la complexité des opérations
générées, selon la table ci-dessus. Chaque domaine expose une fonction
interne qui traduit `(level, trimester)` en bornes concrètes (ex. plage de
nombres pour la numération, liste d'opérations autorisées pour le calcul,
liste de templates autorisés pour les problèmes).

### Écran d'accueil

`HomeScreen` gagne un sélecteur "Trimestre" (3 boutons : "1er trimestre",
"2e trimestre", "3e trimestre"), positionné après le sélecteur de niveau,
avec le même style de bouton toggle. Valeur par défaut : trimestre 1.
`onStart` devient `(name, subjects, level, trimester) => void`.

### App.tsx

`startSession` et `restart` propagent le trimestre choisi à `buildSession`
et le conservent dans `config` pour permettre à "Recommencer" de relancer
une session au même trimestre.

## Hors périmètre

- Détection automatique du trimestre selon la date du jour — l'utilisateur
  choisit manuellement, la maitresse/l'enfant sait dans quel trimestre il
  est.
- Persistance du trimestre choisi entre deux visites (Phase 1 reste sans
  backend ; ce sera naturel à ajouter en Phase 2 avec le profil élève).

## Test / validation

- Pour chaque domaine, chaque niveau et chaque trimestre (36 combinaisons),
  générer une session et vérifier qu'aucune question ne porte sur une notion
  qui n'est pas encore éligible à ce trimestre (ex. aucune question "futur"
  en CM1-T1).
- Vérifier que le trimestre 3 contient bien un mélange de notions de T1, T2
  et T3 (pas uniquement les nouveautés de T3).
- Vérifier la reproductibilité : `buildSession` avec les mêmes
  `(subjects, level, trimester, seed, count)` retourne toujours la même
  session.
