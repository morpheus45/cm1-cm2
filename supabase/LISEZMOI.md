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
   corrigée sur sa tablette) et `004_histoire_geographie.sql` (la base
   accepte les séances d'histoire et de géographie ; à passer **avant** de
   publier la version qui les propose, sinon ces séances restent en attente
   sur les tablettes). Les fichiers sont rejouables : on les relance
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

Le résumé de chaque vérification, dans l'onglet *Actions* du dépôt, dit si la
clé est en place — sans l'afficher.

## Le chat avec Claude (espace maîtresse)

La maîtresse y prépare, avec Claude, les problèmes de sa classe. Claude ne
fait que proposer : l'application refait chaque calcul, et seule la maîtresse
ajoute un problème à la classe.

1. **Une clé API Anthropic.** Sur [console.anthropic.com](https://console.anthropic.com) :
   *API Keys → Create Key*. Le chat est payant à l'usage (quelques centimes par
   échange) : ajouter du crédit, et fixer une **limite de dépense mensuelle**
   (*Limits*). La fonction borne aussi chaque maîtresse à 40 demandes par jour.
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

Les règles d'accès se vérifient sur un PostgreSQL local jetable :
`bash supabase/tests/lancer.sh`. La fonction se vérifie avec Deno :
`deno check --node-modules-dir=none supabase/functions/assistant-problemes/index.ts`.
