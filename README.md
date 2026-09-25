# Exercices CM1-CM2

Application d'entraînement pour élèves de CM1/CM2 : conjugaison, accords,
orthographe et vocabulaire d'un côté, numération, calcul et problèmes de
l'autre — alignée sur le programme du cycle 3.

Deux règles la gouvernent :

- **Une séance porte sur une seule matière.** Le français ou les maths, jamais
  les deux dans la même série de questions, et les questions se suivent par
  blocs de notion.
- **Les questions suivent le moment de l'année.** L'élève choisit son
  trimestre ; seules les notions déjà enseignées à cette date sont proposées,
  celles des trimestres précédents comprises.

C'est une PWA : elle s'ajoute à l'écran d'accueil d'un téléphone ou d'une
tablette, et fonctionne ensuite sans connexion.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre ensuite l'URL affichée dans le terminal (par défaut http://localhost:5173).

## Tests

```bash
npm test
```

Les tests couvrent le moteur de génération de questions (`src/lib`,
`src/domains`) et le manifeste de la PWA (`tools`). Ils vérifient notamment
qu'aucune question ne porte sur une notion non encore enseignée, pour chacune
des combinaisons niveau × trimestre × notion, et qu'une séance ne mélange
jamais le français et les maths.

Les écrans React se vérifient manuellement via `npm run dev` (voir
`docs/superpowers/specs/2026-09-24-phase1-moteur-exercices-design.md`,
section "Test / validation").

## Icônes

```bash
npm run icons
```

Régénère les icônes de `public/` (elles sont versionnées, le build ne les
recalcule pas). Le script les dessine lui-même, sans dépendance — voir
`docs/superpowers/specs/2026-09-25-pwa-installable-design.md`.

## Build de production

```bash
npm run build
```

## Statut

Pas de compte, pas de backend : tout se passe dans le navigateur, et seul le
nombre d'étoiles est conservé d'une fois sur l'autre. Les prochaines étapes
(comptes enseignant/classes, tableau de bord) sont décrites dans
`docs/superpowers/specs/`.
