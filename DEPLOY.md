# 🚀 Déploiement de la Plateforme

## Déployer sur GitHub Pages

### Option 1 : Déploiement automatique (Recommandé)

#### Étape 1 : Activer GitHub Pages dans les settings du repo

1. Allez sur **GitHub** → **Settings** → **Pages**
2. Sous "Build and deployment"
3. Sélectionnez **Branch: main** (ou votre branche de déploiement)
4. Sélectionnez le dossier **/root**
5. Cliquez **Save**

#### Étape 2 : Créer un GitHub Actions Workflow

Créez le fichier `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, contenus-pedagogiques-ce1-3e]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: 'dist'
      - uses: actions/deploy-pages@v4
```

### Option 2 : Déploiement manuel

```bash
# 1. Build la plateforme
npm run build

# 2. Déployer le dossier 'dist' sur GitHub Pages via:
# - GitHub Desktop
# - git push (après avoir configuré les Pages dans Settings)
# - Vercel/Netlify
```

### Option 3 : Déployer sur Vercel (Plus simple)

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer
vercel
```

## URL finale

Une fois déployé, la plateforme sera accessible à :

```
https://morpheus45.github.io/cm1-cm2/
```

## Vérifier le déploiement

Après le déploiement :
1. Allez sur https://morpheus45.github.io/cm1-cm2/
2. Vérifiez que l'interface se charge
3. Testez un matière/niveau/trimestre

## Dépannage

**La page ne se charge pas ?**
- Attendez 2-3 minutes après le push (GitHub Pages met à jour lentement)
- Vérifiez que `vite.config.ts` a `base: '/cm1-cm2/'`
- Vérifiez que GitHub Pages est activé dans Settings → Pages

**La PWA se charge mais pas les contenus JSON ?**
- Assurez-vous que le dossier `contenus/` est dans le build
- Vérifiez que le chemin relatif est correct dans `PedagogieScreen.tsx`

**Erreurs dans la console ?**
- Ouvrez **Inspecteur > Console** et regardez les erreurs
- Vérifiez que `/contenus/{matiere}/{niveau}.json` existe
