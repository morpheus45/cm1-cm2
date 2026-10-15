# Appli Android « Arc-en-Ciel » (TWA)

Projet Bubblewrap : seul `twa-manifest.json` est versionné, le reste se régénère.

```sh
bubblewrap update --skipVersionUpgrade   # après chaque modification du manifeste
bubblewrap build --skipPwaValidation     # → app-release-bundle.aab
```

- Clé d'importation : `~/.config/cm1-cm2/android/arc-en-ciel-upload.jks` (alias `upload`), mots de passe dans `mots-de-passe.env` à côté. À sauvegarder hors de ce PC : sans elle, plus de mise à jour possible.
- Avant chaque envoi sur Play : augmenter `appVersionCode` dans `twa-manifest.json`.
- Digital Asset Links : dépôt `morpheus45/morpheus45.github.io`, fichier `.well-known/assetlinks.json`. Y ajouter l'empreinte SHA-256 de la clé de signature Play (Play Console → Intégrité de l'appli).
- Abonnements Play : `niveau_ce1` … `niveau_3e` (voir `src/lib/abonnements.ts`).
