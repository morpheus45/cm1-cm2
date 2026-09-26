# Mise en service de Supabase

Projet Supabase : `uexxvndxlnwjvlgdkxwc`. Son adresse
(`https://uexxvndxlnwjvlgdkxwc.supabase.co`) n'a rien de secret et figure
dans `.github/workflows/deploy.yml`.

1. **La base.** Copier tout `001_classes_eleves_seances.sql` dans
   [l'éditeur SQL](https://supabase.com/dashboard/project/uexxvndxlnwjvlgdkxwc/sql/new),
   puis *Run*. Le fichier est rejouable : on le relance après chaque
   modification, sans rien perdre.
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

Les règles d'accès se vérifient sur un PostgreSQL local jetable :
`bash supabase/tests/lancer.sh`.
