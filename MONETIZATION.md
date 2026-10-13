# 💰 Guide Monétisation par Niveau

## Structure actuelle

La PWA inclut **toutes les matières pour tous les niveaux** :

```
7 matières × 8 niveaux × 3 trimestres = 336 trimestres complets

Matières : Français, Mathématiques, Géographie, Histoire, Sciences, EMC, Anglais
Niveaux : CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e
```

## Contenu par niveau

Chaque niveau contient **7 matières complètes** :

### CE1 (Cycle 2)
- ✅ Français (60 vocab, 42 questions)
- ✅ Mathématiques (60 vocab, 42 questions)
- ✅ Géographie (60 vocab, 42 questions)
- ✅ Histoire (60 vocab, 42 questions)
- ✅ Sciences (60 vocab, 42 questions)
- ✅ EMC (60 vocab, 42 questions)
- ✅ Anglais (60 vocab, 42 questions)

**Total CE1 : 420 vocabulaire + 294 questions = 714 items pédagogiques**

*(Identique pour CE2, CM1, CM2, 6e, 5e, 4e, 3e)*

## Extraction par niveau pour vente

### Option 1 : Vente complète par niveau

**Créer une PWA "CE1 Complète"** avec toutes les matières :

```bash
# Extraire contenus pour CE1
cp -r public/contenus ce1-complet/public/contenus/
# Garder uniquement les fichiers CE1.json
cd ce1-complet/public/contenus/
for dir in */; do
  find "$dir" -not -name "CE1.json" -delete
done

# Builder la PWA pour CE1
npm run build
# Publier sur : https://example.com/ce1/
```

### Option 2 : Vente par matière + niveau

**Créer des bundles matière spécifiques** :

```bash
# Exemple : "Français CE1 à 6e"
mkdir francais-ce1-6e
cp contenus/francais/{CE1,CE2,CM1,CM2,6e}.json francais-ce1-6e/

# Créer une PWA dédiée
# Publier sur : https://example.com/francais-ce1-6e/
```

### Option 3 : Vente par trimestre

**Granularité maximale** :

```bash
# Exemple : "CE1 Trimestre 1 (toutes matières)"
mkdir ce1-t1
# Extraire seulement les trimestres "1"
```

## Données incluses dans le build

### Structure finale `dist/`

```
dist/
├── index.html
├── public/
│   └── contenus/           ← TOUS les fichiers JSON
│       ├── anglais/
│       │   ├── CE1.json    (20 vocab, 14q × 3 trim = 102 items)
│       │   ├── CE2.json
│       │   └── ... (8 niveaux)
│       ├── francais/       (8 niveaux)
│       ├── mathematiques/  (8 niveaux)
│       ├── geographie/     (8 niveaux)
│       ├── histoire/       (8 niveaux)
│       ├── sciences/       (8 niveaux)
│       └── emc/            (8 niveaux)
└── ... (assets JS/CSS)
```

**Total size**: ~2-3 MB (tous les niveaux)

## Scripts d'extraction

### Script : Extract by Level

```bash
#!/bin/bash
# extract-level.sh [LEVEL]

LEVEL=$1
TARGET="build-$LEVEL"

mkdir -p "$TARGET/public/contenus"

for subject in anglais francais mathematiques geographie histoire sciences emc; do
  mkdir -p "$TARGET/public/contenus/$subject"
  cp "public/contenus/$subject/$LEVEL.json" "$TARGET/public/contenus/$subject/"
done

echo "✅ Extracted $LEVEL to $TARGET/"
```

**Usage:**
```bash
chmod +x extract-level.sh
./extract-level.sh CE1  # Crée build-CE1/ avec tous les fichiers CE1
```

### Script : Extract by Subject

```bash
#!/bin/bash
# extract-subject.sh [SUBJECT] [LEVELS...]

SUBJECT=$1
shift
LEVELS=$@

TARGET="build-$SUBJECT"
mkdir -p "$TARGET/public/contenus/$SUBJECT"

for level in $LEVELS; do
  cp "public/contenus/$SUBJECT/$level.json" "$TARGET/public/contenus/$SUBJECT/"
done

echo "✅ Extracted $SUBJECT ($LEVELS) to $TARGET/"
```

**Usage:**
```bash
./extract-subject.sh francais CE1 CE2 CM1 CM2 6e
```

## Stratégies de monétisation

### Stratégie 1 : Par niveau complet
- **CE1 Complète** (7 matières) → €X
- **CE2 Complète** (7 matières) → €X
- **Cycle 2 Bundle** (CE1 + CE2) → €XX
- **Cycle 3 Bundle** (CM1 + CM2 + 6e) → €XX
- **Cycle 4 Bundle** (5e + 4e + 3e) → €XX
- **Tout** (8 niveaux) → €XXX

### Stratégie 2 : Par matière + niveaux
- **Français CE1-CM2** → €X
- **Français Collège (6e-3e)** → €X
- **Français Complet (CE1-3e)** → €XX

### Stratégie 3 : Freemium
- **CE1 gratuit** (toutes matières)
- **CE2+ premium** par achat

### Stratégie 4 : Par trimestre
- **CE1 T1** (toutes matières) → €X
- **CE1 T2** → €X
- **CE1 T3** → €X
- **CE1 Complet (3T)** → €XX

## Prochaines étapes

1. **Décider la stratégie** (niveau / matière / trimestre / freemium)
2. **Créer les scripts d'extraction** (voir ci-dessus)
3. **Packager par PWA** (une par SKU)
4. **Mettre en place paiement** (Stripe, Gumroad, etc.)
5. **Déployer** (GitHub Pages, Vercel, ou serveur)

## Points techniques

- ✅ **Tous les fichiers sont statiques** (facile à extraire)
- ✅ **Pas de base de données** (aucune dépendance serveur)
- ✅ **PWA fonctionnelle offline** (données dans le navigateur)
- ✅ **Tailles petites** (~30KB par niveau complet)
- ✅ **Zero-copy possible** (lien direct fichiers JSON)

## Exemple : Vendre "CE1 Complet"

```bash
# 1. Extraire
./extract-level.sh CE1

# 2. Builder
cd build-CE1
npm install
npm run build

# 3. Renommer pour déploiement
mv dist ce1-complet

# 4. Publier
# Sur GitHub Pages, Vercel, ou serveur
# URL: https://example.com/ce1/

# 5. Lien produit
# "CE1 Complet - Français, Maths, Géo, Histoire, Sciences, EMC, Anglais"
# Accès : https://example.com/ce1/
# Stockage local, fonctionne offline
```

---

**Actuellement : Tous les contenus sont packagés et prêts pour la monétisation.** ✅
