# 📚 Index Contenu Pédagogique

Tous les contenus pédagogiques pour CE1 à 3e - 7 matières, 8 niveaux, 3 trimestres chacun.

## 📁 Structure des fichiers

```
contenus/
├── anglais/          (8 niveaux)
├── francais/         (8 niveaux)
├── mathematiques/    (8 niveaux)
├── geographie/       (8 niveaux)
├── histoire/         (8 niveaux)
├── sciences/         (8 niveaux)
└── emc/              (8 niveaux)
```

## 📚 Matières et fichiers

### 🌍 Anglais (16 fichiers)
- [CE1.json](anglais/CE1.json) - Couleurs, chiffres, animaux
- [CE2.json](anglais/CE2.json) - École, famille, corps
- [CM1.json](anglais/CM1.json) - Ville, nourriture, vêtements
- [CM2.json](anglais/CM2.json) - Sports, loisirs, nature
- [6e.json](anglais/6e.json) - Technologie, voyages, santé
- [5e.json](anglais/5e.json) - Environnement, culture, société
- [4e.json](anglais/4e.json) - Économie, science, technologie
- [3e.json](anglais/3e.json) - Globalisation, futur, responsabilité

### 📖 Français (16 fichiers)
- [CE1.json](francais/CE1.json) - Apprentissage lecture
- [CE2.json](francais/CE2.json) - Lecture et écriture
- [CM1.json](francais/CM1.json) - Grammaire, conjugaison
- [CM2.json](francais/CM2.json) - Pronoms, accords
- [6e.json](francais/6e.json) - Grammaire collège
- [5e.json](francais/5e.json) - Écriture, analyse texte
- [4e.json](francais/4e.json) - Littérature, rhétorique
- [3e.json](francais/3e.json) - Littérature ancienne, Molière

### 🔢 Mathématiques (16 fichiers)
- [CE1.json](mathematiques/CE1.json) - Nombres 1-10
- [CE2.json](mathematiques/CE2.json) - Nombres 0-200
- [CM1.json](mathematiques/CM1.json) - Calcul, géométrie
- [CM2.json](mathematiques/CM2.json) - Nombres premiers, multiples
- [6e.json](mathematiques/6e.json) - Fractions, décimaux
- [5e.json](mathematiques/5e.json) - Pourcentages, ratios
- [4e.json](mathematiques/4e.json) - Puissances, racines
- [3e.json](mathematiques/3e.json) - Équations 2° degré

### 🗺️ Géographie (16 fichiers)
- [CE1.json](geographie/CE1.json) - Mon environnement
- [CE2.json](geographie/CE2.json) - Lieux et directions
- [CM1.json](geographie/CM1.json) - Paysages français
- [CM2.json](geographie/CM2.json) - Monde et continents
- [6e.json](geographie/6e.json) - Océans, mers, côtes
- [5e.json](geographie/5e.json) - Climats, zones
- [4e.json](geographie/4e.json) - Développement, inégalités
- [3e.json](geographie/3e.json) - Mondialisation, géopolitique

### 📜 Histoire (16 fichiers)
- [CE1.json](histoire/CE1.json) - Temps et événements
- [CE2.json](histoire/CE2.json) - Histoire locale
- [CM1.json](histoire/CM1.json) - Antiquité, moyen-âge
- [CM2.json](histoire/CM2.json) - Renaissance, temps modernes
- [6e.json](histoire/6e.json) - Antiquité grecque, romaine
- [5e.json](histoire/5e.json) - Moyen-âge, Renaissance
- [4e.json](histoire/4e.json) - Temps modernes, révolution
- [3e.json](histoire/3e.json) - Monde XXe siècle

### 🔬 Sciences (16 fichiers)
- [CE1.json](sciences/CE1.json) - Monde vivant
- [CE2.json](sciences/CE2.json) - Corps et santé
- [CM1.json](sciences/CM1.json) - Physique, chimie
- [CM2.json](sciences/CM2.json) - Électricité, force
- [6e.json](sciences/6e.json) - Minéraux, roches, fossiles
- [5e.json](sciences/5e.json) - Électricité, lumière
- [4e.json](sciences/4e.json) - Atomes, molécules
- [3e.json](sciences/3e.json) - Énergie, réactions chimiques

### 🤝 EMC (16 fichiers)
- [CE1.json](emc/CE1.json) - Vivre ensemble
- [CE2.json](emc/CE2.json) - Droits et responsabilités
- [CM1.json](emc/CM1.json) - République française
- [CM2.json](emc/CM2.json) - Citoyenneté, démocratie
- [6e.json](emc/6e.json) - Habiter ensemble
- [5e.json](emc/5e.json) - Égalité, discrimination
- [4e.json](emc/4e.json) - Justice, loi, droits
- [3e.json](emc/3e.json) - Responsabilité, environnement

## 📊 Format des fichiers

Chaque fichier JSON contient :

```json
{
  "niveau": "CE1",
  "trimestres": {
    "1": {
      "vocabulaire": [
        {
          "fr": "mot français",
          "en": "définition ou traduction",
          "theme": "catégorie"
        }
        // ... 20 items par trimestre
      ],
      "questions": [
        {
          "consigne": "Type de question",
          "enonce": "Question à répondre",
          "bonne": "réponse correcte",
          "fausses": ["fausse1", "fausse2", "fausse3"],
          "explication": "Explication pédagogique"
        }
        // ... 14 questions par trimestre
      ]
    },
    "2": { /* même structure */ },
    "3": { /* même structure */ }
  }
}
```

## 📈 Statistiques

- **Fichiers** : 56 (7 matières × 8 niveaux)
- **Vocabulaire** : 3,360 items (60 par niveau/matière)
- **Questions** : 2,352 items (42 par niveau/matière)
- **Trimestres** : 336 (56 fichiers × 3 trimestres)
- **Total pédagogique** : 5,712 items

## 🚀 Utilisation

### Sur GitHub Pages
La PWA charge ces fichiers depuis `/public/contenus/` lors du déploiement.

### En développement local
```bash
npm install
npm run dev
# Ouvre http://localhost:5173
```

### Extraction par niveau
```bash
./tools/extract-level.sh CE1  # Crée build-CE1/ avec tous les contenus CE1
```

---

**Tous les fichiers sont dans ce dossier et accessibles via GitHub** ✅
