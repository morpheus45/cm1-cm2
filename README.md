# Exercices CM1-CM2

Application d'entraînement (PWA, Phase 1) pour élèves de CM1/CM2 : conjugaison,
accords, orthographe/vocabulaire, numération, calcul, problèmes — alignée sur
le programme du cycle 3.

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
`src/domains`). Les écrans React se vérifient manuellement via `npm run dev`
(voir `docs/superpowers/specs/2026-09-24-phase1-moteur-exercices-design.md`,
section "Test / validation").

## Build de production

```bash
npm run build
```

## Statut

Phase 1 uniquement : pas de compte, pas de backend. Les prochaines phases
(comptes enseignant/classes via Supabase, tableau de bord, finitions PWA) sont
décrites dans `docs/superpowers/specs/`.
