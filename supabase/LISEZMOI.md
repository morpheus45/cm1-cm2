# Mise en service de Supabase

Projet Supabase : `uexxvndxlnwjvlgdkxwc`. Son adresse
(`https://uexxvndxlnwjvlgdkxwc.supabase.co`) n'a rien de secret et figure
dans `.github/workflows/deploy.yml`.

## La base, les comptes, la clé publique

1. **La base.** Copier tout `001_classes_eleves_seances.sql` dans
   [l'éditeur SQL](https://supabase.com/dashboard/project/uexxvndxlnwjvlgdkxwc/sql/new),
   puis *Run*. Même chose ensuite, dans l'ordre, pour
   `002_problemes_de_la_classe.sql` (les problèmes de la classe et le chat),
   `003_corrections_pour_les_eleves.sql` (l'élève retrouve sa feuille
   corrigée sur sa tablette), `004_histoire_geographie.sql` (la base
   accepte les séances d'histoire et de géographie ; à passer **avant** de
   publier la version qui les propose, sinon ces séances restent en attente
   sur les tablettes) et `005_conservation_une_annee.sql` (les résultats des
   élèves ne se gardent qu'une année scolaire : chaque 1er septembre, ce qui
   date de l'année précédente est effacé, par une tâche programmée chaque
   nuit avec l'extension pg_cron, que le fichier active ; **attention**, le
   lancer efface aussitôt ce qui date d'avant le 1er septembre de l'année en
   cours), `006_evaluations.sql` (les évaluations de la maîtresse ; à
   passer **avant** de publier la version qui les propose, sinon le bouton
   « Évaluations de la classe » annonce que cette partie n'est pas
   installée), puis `007_questions_de_la_classe.sql` (la maîtresse ajoute
   elle-même des questions dans toutes les matières, pas seulement les
   problèmes de maths ; à passer **avant** de publier la version qui le
   propose, sinon le bouton « Questions de la classe » annonce que cette
   partie n'est pas installée). Les fichiers sont rejouables : on les relance
   après chaque modification, sans rien perdre. Pour copier sans rien abîmer, le plus sûr est le bouton
   « Copy raw file » de GitHub, sur la page du fichier.
2. **Les comptes des maîtresses.** *Authentication → Sign In / Providers →
   Email* : désactiver **Confirm email**. Sans serveur d'e-mail à soi,
   Supabase n'écrit qu'aux membres de l'équipe du projet : la maîtresse ne
   recevrait jamais le lien de confirmation.
3. **La clé publique.** *Project Settings → API Keys* : copier la clé
   **Publishable** (`sb_publishable_…`) dans le secret
   [`VITE_SUPABASE_PUBLISHABLE_KEY`](https://github.com/morpheus45/cm1-cm2/settings/secrets/actions/new)
   du dépôt. Jamais la clé secrète : le build refuse alors de publier.
4. **Les mots de passe.** *Authentication → Sign In / Providers → Email* :
   **Minimum password length** à 12. L'application le demande déjà pour
   créer un compte ; la base le fera respecter aussi.
5. **Fermer les inscriptions**, une fois les comptes des maîtresses créés :
   *Authentication → Sign In / Providers* : désactiver **Allow new users to
   sign up**. Sans cela, n'importe qui peut se créer un compte (sans rien
   voir des classes des autres, mais le projet n'a pas à héberger d'inconnus).
   On le réactive le temps d'accueillir une nouvelle maîtresse.
6. **Le contrat de sous-traitance.** Supabase propose un contrat conforme au
   RGPD (DPA, [supabase.com/legal/dpa](https://supabase.com/legal/dpa)) : le
   signer engage Supabase à ne traiter les données des élèves que pour le
   compte de l'école. À conserver avec le registre des traitements de
   l'école.

Le résumé de chaque vérification, dans l'onglet *Actions* du dépôt, dit si la
clé est en place — sans l'afficher.

## L'assistant de Cédric (espace maîtresse)

La maîtresse y prépare, avec l'assistant, les problèmes de sa classe. L'assistant
ne fait que proposer : l'application refait chaque calcul, et seule la maîtresse
ajoute un problème à la classe.

1. **Une clé API Anthropic.** Sur [platform.claude.com](https://platform.claude.com)
   (l'ancienne adresse console.anthropic.com y mène) : *Settings → API keys →
   Create key*. La clé commence par `sk-ant-` et ne s'affiche qu'une fois. Le
   chat est payant à l'usage (de quelques centimes à une dizaine de centimes par
   échange), à part de tout abonnement Claude : dans *Settings → Billing*,
   ajouter du crédit et fixer une **limite de dépense mensuelle**. La fonction
   borne aussi chaque maîtresse à 40 demandes par jour.
2. **La ranger dans Supabase**, jamais ailleurs : *Edge Functions → Secrets →
   Add new secret*, nom `ANTHROPIC_API_KEY`, valeur : la clé. Elle ne quitte
   plus le serveur ; aucune tablette ne la voit.
3. **Installer la fonction** : *Edge Functions → Deploy a new function → Via
   Editor*, nom **`assistant-problemes`**, y coller tout
   `functions/assistant-problemes/index.ts`, puis *Deploy*. Dans les réglages
   de la fonction, désactiver **Verify JWT** : la fonction vérifie elle-même
   qu'une maîtresse connectée l'appelle.

### Le périmètre du chat

Le chat ne traite que les corrections et adaptations de l'application pour la
classe : créer, corriger ou adapter des problèmes, répondre sur l'utilisation.
**Toute autre demande n'est pas traitée** : elle est rangée dans la table
`demandes_administrateur`, et la réponse le dit à la maîtresse. L'administrateur
les lit dans *Table Editor → demandes_administrateur* (qui, quand, la demande,
son résumé) et coche `traitee` une fois traitée. Personne d'autre ne peut les
lire.

## Vérifier

Les règles d'accès, et l'effacement de chaque rentrée, se vérifient sur un
PostgreSQL local jetable : `bash supabase/tests/lancer.sh`. La fonction se vérifie avec Deno :
`deno check --node-modules-dir=none supabase/functions/assistant-problemes/index.ts`.
