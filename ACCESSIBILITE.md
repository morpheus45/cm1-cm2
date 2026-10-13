# ♿ Guide Accessibilité - Troubles d'Apprentissage

Plateforme entièrement adaptée pour les élèves en situation de handicap ou avec troubles d'apprentissage (DYS).

## 🎯 Troubles Supportés

### 1. **Dyslexie**
Difficultés de lecture et reconnaissance des lettres.

**Adaptations automatiques :**
- Police OpenDyslexic/Dyslexie (distinction des lettres)
- Taille augmentée
- Espacement augmenté
- Thème sépia (fond beige)
- Contraste élevé

### 2. **Dysorthographie**
Difficultés en orthographe et écriture.

**Adaptations automatiques :**
- Taille augmentée
- Contraste élevé
- Espacement augmenté
- Questions avec explications détaillées

### 3. **Dysgraphie**
Difficultés de coordination motrice fine.

**Adaptations automatiques :**
- Interface simplifiée
- Zones de clic agrandies
- Moins de texte à écrire
- Boutons plus grands

### 4. **Dyscalculie**
Difficultés avec les nombres et calculs.

**Adaptations automatiques :**
- Police très grande
- Espacement très augmenté
- Thème bleu/jaune (meilleure lisibilité)
- Visualisations améliorées

### 5. **TDAH**
Trouble de l'attention avec ou sans hyperactivité.

**Adaptations automatiques :**
- Disposition simplifiée (moins de distractions)
- Animations réduites
- Contraste élevé
- Police augmentée

### 6. **Dyspraxie**
Difficultés de coordination motrice et spatiale.

**Adaptations automatiques :**
- Zones de clic agrandies (cibles plus faciles)
- Layout simplifié
- Moins d'éléments mobiles
- Interface tactile optimisée

### 7. **Dysphasia**
Difficultés de langage et expression.

**Adaptations automatiques :**
- Synthèse vocale (lire à haute voix)
- Interface simplifiée
- Langage simplifié
- Moins de texte

### 8. **Trouble Vision**
Basse vision, daltonisme, etc.

**Adaptations automatiques :**
- Police très grande
- Contraste maximum
- Espacement très augmenté
- Options de contraste personnalisées

### 9. **Trouble Audition**
Surdité, malentendance.

**Adaptations automatiques :**
- Pas de contenu audio obligatoire
- Sous-titres pour tout contenu vidéo (futur)

## ⚙️ Paramètres Personnalisables

### Taille Police
- **Normal** : 16px
- **Grand** : 18px
- **Très grand** : 20px

### Police
- **Arial** : Police standard
- **Dyslexie** : Police spécialisée pour dyslexie
- **OpenDyslexic** : Alternative open-source
- **Sans-serif** : Système

### Contraste
- **Normal** : Contraste standard
- **Élevé** : Augmente la différence de couleur
- **Maximum** : Noir sur blanc/blanc sur noir

### Espacement
- **Normal** : Espacement standard
- **Grand** : 1.8× interligne, 0.05em lettre
- **Très grand** : 2× interligne, 0.1em lettre

### Thème Couleur
- **Clair** : Blanc/noir standard
- **Sépia** : Fond beige, texte marron (repose les yeux)
- **Sombre** : Fond noir, texte blanc (réduit la fatigue)
- **Bleu/Jaune** : Bleu foncé + jaune (idéal dyscalculie)

### Options Avancées
- 🚫 **Réduire animations** : Désactive transitions (TDAH, épilepsie)
- 🔊 **Lire à haute voix** : Synthèse vocale (dysphasia, dyslexie)
- 📦 **Disposition simplifiée** : Interface minimale (TDAH)
- 🖱️ **Zones de clic agrandies** : Boutons plus grands (dyspraxie)

## 🚀 Utilisation

### Accès aux paramètres
1. Depuis l'accueil, cliquez sur **"♿ Accessibilité"** (ou appuyez sur la touche A)
2. Sélectionnez les troubles diagnostiqués
3. Personnalisez les paramètres visuels
4. Cliquez "Appliquer"

### Sélection des troubles
- Cochez les troubles diagnostiqués de l'élève
- L'interface s'adapte automatiquement
- Les paramètres sont mémorisés

### Personnalisation manuelle
- Modifiez les paramètres individuels
- Testez différentes combinaisons
- Chaque changement est appliqué en temps réel

### Réinitialisation
- Cliquez "Réinitialiser" pour revenir aux paramètres par défaut

## 💾 Persistance

Les paramètres d'accessibilité sont automatiquement sauvegardés dans le navigateur (`localStorage`).

- Chaque élève garde ses paramètres
- Les préférences persistent entre les sessions
- Aucun serveur requis

## 📱 Compatibilité

- ✅ Ordinateurs (Windows, Mac, Linux)
- ✅ Tablettes (iPad, Android)
- ✅ Smartphones
- ✅ Lecteurs d'écran (NVDA, JAWS)
- ✅ Claviers uniquement (navigation sans souris)

## 🎓 Recommandations Pédagogiques

### Par trouble

**Dyslexie**
- Utilisez la police Dyslexie
- Augmentez l'espacement
- Thème sépia ou contraste élevé
- Lire à haute voix

**Dyscalculie**
- Police très grande
- Thème bleu/jaune
- Espacement très augmenté
- Visualisations en couleur

**TDAH**
- Disposition simplifiée
- Réduire les animations
- Contenu par étape
- Pause après chaque question

**Dyspraxie**
- Zones de clic agrandies
- Pas d'éléments mobiles
- Interface tactile simple

**Dysphasia**
- Synthèse vocale activée
- Langage simple
- Moins de texte

## 🔧 Implémentation Technique

### Fichiers clés
- `src/types/accessibility.ts` - Types et configurations
- `src/hooks/useAccessibility.ts` - Gestion d'état
- `src/components/AccessibilitySettings.tsx` - UI paramètres
- `src/components/AccessibilityWrapper.tsx` - Application styles

### Intégration
```tsx
import { useAccessibility } from '../hooks/useAccessibility';
import { AccessibilityWrapper } from '../components/AccessibilityWrapper';

function MyComponent() {
  const { settings } = useAccessibility();
  
  return (
    <AccessibilityWrapper>
      {/* Contenu adapté */}
    </AccessibilityWrapper>
  );
}
```

## 📚 Ressources

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Standards accessibilité web
- [OpenDyslexic](https://opendyslexic.org/) - Police open-source dyslexie
- [Dyslexie Font](https://www.dyslexiefont.com/) - Police commerciale

## 🤝 Contribution

Pour améliorer l'accessibilité :
1. Testez avec des utilisateurs atteints de DYS
2. Proposez des adaptations supplémentaires
3. Signalez les problèmes d'accessibilité

---

**L'accessibilité n'est pas un luxe, c'est un droit.** ♿
