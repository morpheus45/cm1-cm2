# Chat avec Claude : les problèmes de la classe (design)

## Demande

« Dans l'interface maîtresse, lui permettre d'envoyer un chat en live avec toi
qui te permet de modifier des problèmes en live avec elle. » Puis, de
l'administrateur de l'application : le chat se limite aux demandes de la
maîtresse sur cette application — corrections ou adaptations d'utilisation ;
le reste doit lui être soumis, et la réponse doit le dire.

## Ce que fait le chat

- La maîtresse ouvre **Problèmes de la classe, avec Claude** depuis son
  bandeau. Elle écrit (ou choisit une suggestion) ; Claude répond en deux ou
  trois phrases et propose au plus cinq problèmes.
- Chaque proposition arrive avec son **calcul** (« 96 ÷ 4 »), sa réponse, trois
  fausses réponses (erreurs typiques d'élève) et un trimestre.
  **L'application refait le calcul** : « Calcul vérifié » ou « Le calcul donne
  21, pas 22 ». Un problème faux ne peut pas être ajouté.
- **Seule la maîtresse ajoute** un problème à la classe. Elle peut le retirer,
  le remettre, le supprimer, ou le reprendre avec Claude (« Modifier avec
  Claude » prépare la demande).
- **Les élèves** reçoivent les problèmes en service de leur classe au
  lancement de l'application (code de classe), gardés sur la tablette pour le
  hors-ligne. Dans une séance de maths, ils prennent au plus la moitié du bloc
  « problèmes », mêlés à ceux de l'application, trimestre atteint ; jamais dans
  une séance de français.

## Le périmètre, garanti par la fonction

Hors des corrections et adaptations de l'application, la demande n'est pas
traitée : Claude signale `hors_champ`, la fonction range la demande dans
`demandes_administrateur` (avec l'adresse de la maîtresse) et **ajoute
elle-même** à la réponse : « Cette demande sort de ce que je peux faire ici :
je l'ai transmise à l'administrateur de l'application, qui vous répondra. »
La phrase ne dépend pas de Claude.

## Architecture

- `supabase/functions/assistant-problemes/index.ts` — Edge Function (Deno),
  SDK officiel `@anthropic-ai/sdk`. La clé Anthropic est un secret Supabase :
  aucune tablette ne la voit.
  - vérifie la maîtresse (`auth.getUser` sur son jeton) ;
  - compte la demande (`compter_demande_assistant`, 40 par jour) ;
  - appelle `claude-opus-5`, réflexion adaptative à effort moyen, **sortie
    structurée** (schéma JSON), et `fallbacks: "default"` (bêta
    `server-side-fallback-2026-07-01`) : un refus par erreur d'un filtre de
    sécurité est repris par le modèle de repli recommandé ;
  - relit la réponse champ par champ ; refus, réponse trop longue ou illisible,
    clé absente ou refusée, plafond : chaque cas a son message en français.
- `supabase/002_problemes_de_la_classe.sql` — tables `problemes` (RLS
  maîtresse), `assistant_usage` (compteur), `demandes_administrateur` (lue
  seulement depuis le tableau de bord) ; fonctions `problemes_de_la_classe`
  (élèves, par code), `compter_demande_assistant`,
  `transmettre_a_l_administrateur`. Aucun droit pour la clé publique sur les
  tables.
- `src/lib/classProblems.ts` — évaluateur d'expressions (+ − × ÷, parenthèses,
  virgule ; rien d'autre), vérification d'une proposition, conversion en
  question à quatre réponses.
- `src/lib/assistant.ts`, `src/components/ProblemsScreen.tsx` — la page.

## Vérifié

- Base : banc d'essai PostgreSQL étendu (anonyme, maîtresses A/B, problèmes
  retirés, compteur, demandes pour l'administrateur) ; il échoue si la RLS des
  problèmes est retirée.
- Fonction : 22 contrôles contre un faux serveur Claude et la base d'essai
  (accès, requête envoyée, clé jamais renvoyée, conversation, hors cadre,
  refus, réponse illisible, entrées mal formées, plafond, clé absente). La CI
  vérifie qu'elle se compile avec les bibliothèques aux versions déclarées.
- De bout en bout, dans des navigateurs séparés : la maîtresse obtient deux
  propositions (une vérifiée, une refusée), ajoute la bonne, voit sa demande
  hors cadre transmise ; un élève de sa classe reçoit le problème dans sa
  séance de maths, avec ses quatre réponses.
- Pas encore vérifié : un échange avec le vrai Claude — il faut la clé API de
  l'administrateur, qui ne doit jamais transiter par ici.
