# Phase 1 — Moteur d'exercices + écran élève (design)

Date : 2026-09-24
Statut : validé par l'utilisateur, prêt pour planification d'implémentation

## Contexte

Application (PWA) d'entraînement scolaire pour élèves de CM1/CM2, sous forme de QCM,
inspirée des cahiers d'évaluation "Repères" (conjugaison, accords, numération,
problèmes). Le projet complet vise un usage en classe : la maitresse crée des
classes, ajoute ses élèves, lance des sessions d'exercices, et suit la progression
de chaque élève dans un tableau de bord.

Le projet est découpé en 4 phases indépendantes (spec → plan → implémentation
chacune) :

1. **Phase 1 (ce document)** — Moteur d'exercices + écran élève, utilisable en
   mode "invité" (sans compte), déployable seul.
2. Phase 2 — Comptes enseignant, classes, élèves (Supabase : auth + base de
   données).
3. Phase 3 — Tableau de bord enseignant (suivi par élève, graphique radar par
   domaine, historique).
4. Phase 4 — Finitions PWA (installation, cache, difficulté adaptative).

Stack retenue pour l'ensemble du projet : React + TypeScript + Vite + Tailwind
CSS, Supabase (Phase 2+), GitHub Pages + GitHub Actions (hébergement/déploiement),
Recharts (Phase 3, graphique radar).

## Objectif de la Phase 1

Construire le cœur pédagogique : un moteur qui génère des questions QCM
conformes au programme officiel du cycle 3 (CM1-CM2), et un écran de pratique
adapté à un enfant avec un trouble de l'attention (TDA), utilisable dès
maintenant sans backend.

## Contenu pédagogique (programme cycle 3, BOEN)

| Domaine | CM1 | CM2 |
|---|---|---|
| Conjugaison | Identifier le temps d'un verbe conjugué (présent / imparfait / futur / passé composé) ; conjuguer être, avoir, verbes du 1er groupe, faire, aller, dire, venir, pouvoir, voir, vouloir, prendre | + passé simple (reconnaissance), plus-que-parfait, conditionnel présent |
| Grammaire (accords) | Accord sujet-verbe ; accord déterminant-nom-adjectif en genre et en nombre | + accord du participe passé avec être (cas simples) |
| Orthographe / vocabulaire | Homophones grammaticaux a/à, et/est, on/ont, ce/se | + son/sont, ces/ses/c'est/s'est, ou/où ; synonymes, sens propre/figuré |
| Numération | Nombres jusqu'à 999 999 ; dictée de nombres ; fractions simples | Nombres jusqu'au milliard ; nombres décimaux ; pourcentages simples |
| Calcul | Addition/soustraction posées ; tables de multiplication ; division simple | 4 opérations posées avec décimaux ; calcul mental |
| Problèmes | Problèmes à 1-2 étapes | Problèmes à plusieurs étapes ; proportionnalité simple |

Chaque question est un QCM à 4 propositions (parfois 6 pour les problèmes de
calcul, comme dans le cahier source), une seule bonne réponse.

## Mécanique de session

- Avant de lancer une session, l'utilisateur (la maitresse en Phase 1 simulé,
  ou l'élève en mode invité) **choisit la ou les matières** à inclure parmi les
  6 domaines ci-dessus (sélection multiple, au moins une obligatoire), et le
  niveau (CM1 ou CM2).
- Le moteur tire aléatoirement N questions (par défaut 8) réparties sur les
  matières choisies, à partir d'une **graine (seed)** générée une fois pour
  cette session.
- Toutes les personnes qui font "la session du jour" avec la même graine
  obtiennent exactement les mêmes questions, dans le même ordre — condition
  nécessaire pour que la Phase 2/3 permette à la maitresse de donner la même
  session à toute la classe et comparer les résultats.
- Une nouvelle session (nouvelle graine) régénère un tirage différent : les
  questions ne sont pas figées d'une session à l'autre, seulement identiques
  *au sein* d'une même session.

## Écran élève (adapté TDA)

- **Accueil** : champ prénom (mode invité, sera remplacé par la sélection de
  profil en Phase 2), puis sélection de la/les matière(s) et du niveau, bouton
  "Commencer".
- **Question** : une seule question affichée à la fois, plein écran, gros
  boutons tactiles (cible tablette), pas de défilement nécessaire.
- **Barre de progression** fixe en haut de l'écran ("Question 3 sur 8"),
  visible en permanence pour donner un repère stable.
- **Feedback immédiat après chaque réponse** :
  - Bonne réponse : couleur verte douce, courte animation discrète, phrase
    d'encouragement tirée d'une liste variée (pas de répétition du même mot).
  - Mauvaise réponse : pas de croix rouge ni de ton négatif ; on affiche
    calmement la bonne réponse (couleur neutre, ex. bleu/ambre doux), sans
    pénalité visible ni décompte de vies.
- **Pas de minuteur** par défaut (pas de pression temporelle).
- **Bouton pause/quitter** toujours visible et accessible sans confirmation
  anxiogène.
- **Récapitulatif de fin de session** : score (X/8), étoiles cumulées
  affichées de façon calme (ex. un "bocal" qui se remplit visuellement),
  bouton "Recommencer" (nouvelle session) ou "Terminer".

## Architecture du moteur d'exercices

Un module de génération par domaine, chacun exposant une fonction pure :

```
generate(level: 'CM1' | 'CM2', rng: SeededRandom): Question[]
```

où `Question = { id, domain, prompt, choices: string[4-6], correctIndex, explanation? }`.

Modules prévus : `conjugaison.ts`, `accords.ts`, `orthographe.ts`,
`numeration.ts`, `calcul.ts`, `problemes.ts`. Chacun s'appuie sur une petite
banque de données par niveau (verbes, phrases-gabarits, plages de nombres,
énoncés-types de problèmes) combinée à un générateur pseudo-aléatoire
*seedable* (pas `Math.random()` directement, pour garantir la reproductibilité
décrite dans "Mécanique de session").

La composition de session (`buildSession(subjects[], level, seed, count=8)`)
répartit les questions demandées entre les matières choisies (à peu près
équitablement) et mélange leur ordre selon la même graine.

## Persistance (Phase 1 uniquement)

Aucun backend. L'état de la session vit en mémoire (état React) le temps de la
session ; le score final peut être gardé en `localStorage` par confort mais
n'est pas synchronisé — ce sera le rôle de la Phase 2.

## Hors périmètre (Phase 1)

- Comptes, classes, élèves, codes de classe → Phase 2.
- Tableau de bord, historique, graphique radar → Phase 3.
- Installation PWA, cache offline, difficulté adaptative → Phase 4.

## Test / validation

- `npm run dev` en local, tester une session complète pour chacun des 6
  domaines et les 2 niveaux.
- Vérifier lisibilité et taille des zones tactiles en largeur tablette
  (~768-1024px) et mobile.
- Vérifier que relancer une session avec la même graine reproduit exactement
  les mêmes questions.
