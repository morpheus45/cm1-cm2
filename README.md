# 📚 Plateforme Pédagogique CE1-3e

Contenu éducatif complet et interface web interactive pour l'apprentissage des élèves de CE1 à 3e.

## 📦 Contenu

**7 matières × 8 niveaux × 3 trimestres**

### Matières incluses
- ✅ **Français** — Vocabulaire, grammaire, littérature
- ✅ **Mathématiques** — Nombres, opérations, géométrie, équations
- ✅ **Géographie** — Lieux, continents, mondialisation
- ✅ **Histoire** — Périodes historiques, événements majeurs
- ✅ **Sciences** — Corps, nature, physique, chimie
- ✅ **EMC** — Citoyenneté, droits, valeurs, éthique
- ✅ **Anglais** — A1 oral débutant → A2 avancé

### Niveaux couverts
- CE1 / CE2 (Cycle 2)
- CM1 / CM2 (Cycle 3)
- 6e / 5e / 4e / 3e (Cycle 4)

## 🎯 Structure

Chaque niveau contient **3 trimestres** avec :
- **20 vocabulaire/notions** par trimestre (60 par niveau)
- **14 questions** par trimestre (42 par niveau)
  - Choix multiples
  - Vrai/Faux
  - Remplissage
  - Avec explications pédagogiques

## 🌐 Utilisation

### ☁️ Accès en ligne (Recommandé)
Ouvrez simplement : **https://morpheus45.github.io/cm1-cm2/**

Aucune installation ! La plateforme est déployée automatiquement sur GitHub Pages.

### 🏠 Accès local (Développement)
```bash
# Cloner le dépôt
git clone https://github.com/morpheus45/cm1-cm2.git
cd cm1-cm2

# Installer et lancer
npm install
npm run dev

# Ouvre http://localhost:5173
```

### 📚 Utiliser la section pédagogie
1. Cliquez sur **« Apprendre (Vocabulaire & Notions) »**
2. Sélectionnez une **matière**
3. Choisissez un **niveau** (CE1 → 3e)
4. Sélectionnez un **trimestre**
5. **L'élève peut :**
   - 👀 Voir le vocabulaire thématisé
   - ❓ Répondre aux questions
   - ✅ Vérifier ses réponses
   - 📖 Lire les explications

### Structure des fichiers
```
contenus/
├── anglais/
│   ├── CE1.json
│   ├── CE2.json
│   └── ... (jusqu'à 3e)
├── francais/
├── mathematiques/
├── geographie/
├── histoire/
├── sciences/
└── emc/

web/
└── index.html (interface interactive)
```

### Format JSON
```json
{
  "niveau": "CE1",
  "trimestres": {
    "1": {
      "vocabulaire": [
        {"fr": "mot", "en": "définition", "theme": "catégorie"}
      ],
      "questions": [
        {
          "consigne": "Choix multiple",
          "enonce": "Question...",
          "bonne": "réponse correcte",
          "fausses": ["fausse1", "fausse2", "fausse3"],
          "explication": "Pourquoi cette réponse est correcte"
        }
      ]
    }
  }
}
```

## 🚀 Déploiement

Pour mettre en ligne :
1. Servez la racine du projet via HTTP (Apache, Nginx, etc.)
2. L'interface `web/index.html` charge les fichiers JSON depuis `contenus/`
3. Pas de base de données requise — contenus statiques

## 📊 Statistiques

- **56 fichiers JSON** (7 matières × 8 niveaux)
- **336 trimestres** de contenu
- **3,360 termes/notions** à apprendre
- **4,704 questions** pour s'exercer

## ✨ Caractéristiques

- ✅ Interface responsive (ordinateur, tablette, mobile)
- ✅ Questions interactives avec feedback immédiat
- ✅ Explications pour chaque réponse
- ✅ Navigation simple et intuitive
- ✅ Contenu pédagogiquement adapté à chaque niveau

## 📝 Notes

- Tous les contenus sont en français
- L'anglais suit les niveaux A1 → A2
- Les matières suivent le programme français officiel
- Chaque niveau est progressif et construit sur les acquis précédents

---

**Version :** 1.0  
**Date :** Octobre 2026  
**Licence :** Libre d'usage pédagogique
