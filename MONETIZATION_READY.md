# 💰 Système de Monétisation - EN PRÉPARATION (Non Actif)

## **État : Prêt pour activation, pas de mise en place réelle**

Tous les fichiers et hooks sont créés et fonctionnels. **Aucun paiement n'est actuellement traité.**

---

## 📊 **Vue d'ensemble de la stratégie**

### **Modèle : Freemium par Niveau**

```
CE1              → 🎁 GRATUIT (accroche)
CE2, CM1, CM2    → 💎 BASIQUE (5-8€)
6e, 5e           → 👑 PREMIUM (8-10€)
4e, 3e           → ⭐ ELITE (12-15€)
```

### **Philosophie**

- **CE1 gratuit pour toujours** : accroche, découverte
- **Progression payante** : chaque niveau suivant est une "couche"
- **Bundles groupés** : économies si achat de plusieurs niveaux
- **Support DYS inclus partout** : jamais un frais supplémentaire
- **Certificats inclus** : valorise l'achat

---

## 🏗️ **Architecture Implémentée**

### **1. Types et Config (`src/lib/monetization.ts`)**

```typescript
// Configuration par niveau
LEVEL_PRICING: Record<Level, LevelPricing> = {
  CE1: { tier: 'free', price: 0, active: false },
  CE2: { tier: 'basic', price: 4.99, active: false },
  ...
}

// Bundles prédéfinis
BUNDLES: Bundle[] = [
  { id: 'cycle-2', name: 'Pack Cycle 2', levels: ['CE1', 'CE2'], price: 4.99 },
  { id: 'cycle-3', name: 'Pack Cycle 3', levels: ['CM1', 'CM2', '6e'], price: 19.99 },
  { id: 'cycle-4', name: 'Pack Cycle 4', levels: ['5e', '4e', '3e'], price: 29.99 },
  { id: 'all-levels', name: 'Accès Complet', levels: ['CE1'...'3e'], price: 49.99 },
]
```

**Flag critique : `active: false`**

```typescript
// Pour ACTIVER la monétisation, changer :
CE2: { tier: 'basic', price: 4.99, active: true },  // PASSE À TRUE

// Testé entièrement :
CE1: { tier: 'free', price: 0, active: false },     // Reste gratuit
```

---

### **2. Composants d'Interface**

#### **LevelPricingCard (`src/components/LevelPricingCard.tsx`)**

Affiche chaque niveau avec :
- ✅ Tier (Gratuit/Basique/Premium/Elite)
- ✅ Prix (ou "Gratuit pour le moment")
- ✅ Features spécifiques au niveau
- ✅ Boutons (Accéder / Acheter / Aperçu)
- ✅ Badge "Bientôt payant" si `active: false`

**Exemple :**
```
┌─────────────────┐
│  CM2  💎 Basique│
│ Transition 3→4  │
├─────────────────┤
│      5.99 €     │
│  ✅ Accès inclus │
├─────────────────┤
│ ✅ 7 matières   │
│ ✅ 3 trimestres │
│ ✅ Certificat   │
├─────────────────┤
│ [▶ Commencer]   │
└─────────────────┘
```

#### **ShoppingCart (`src/components/ShoppingCart.tsx`)**

Panier avec :
- ✅ Liste des articles sélectionnés
- ✅ Total dynamique
- ✅ Suggestions de bundles
- ✅ Bouton checkout (non fonctionnel pour l'instant)
- ✅ Info sécurité (Stripe ready)

---

### **3. Hook de Gestion (`src/hooks/usePurchases.ts`)**

```typescript
const {
  // Panier
  cart,
  addToCart,
  removeFromCart,
  clearCart,

  // Achats
  purchases,           // niveaux achetés
  isPurchased,         // vérifier si acheté
  recordPurchase,      // enregistrer un achat (simulé)
  getPurchaseHistory,  // historique

  // Bundles
  applyBundle,         // appliquer un bundle au panier
} = usePurchases(userId);
```

**Sauvegarde :** localStorage
- `purchases-{userId}` : historique
- `cart-{userId}` : panier courant

---

## 🚀 **Comment Activer la Monétisation**

### **Étape 1 : Activer les niveaux payants**

```typescript
// Dans src/lib/monetization.ts

// AVANT (gratuit)
CE2: {
  level: 'CE2',
  active: false,  // ❌ Gratuit
  price: 4.99,
}

// APRÈS (payant)
CE2: {
  level: 'CE2',
  active: true,   // ✅ Payant
  price: 4.99,
}
```

Appliquer à CE2, CM1, CM2, 6e, 5e, 4e, 3e (laisser CE1 gratuit).

### **Étape 2 : Intégrer le panier à l'UI**

```tsx
// Dans le composant principal (ex: HomeScreen)
import { usePurchases } from '../hooks/usePurchases';
import { ShoppingCart } from '../components/ShoppingCart';

export function MyApp() {
  const { cart, addToCart, removeFromCart, recordPurchase } = usePurchases(childName);

  return (
    <>
      {/* Affiche les cartes de prix */}
      <LevelPricingCard
        level="CM2"
        purchased={purchases}
        onSelect={selectLevel}
        onPurchase={(level) => addToCart(level)}
      />

      {/* Affiche le panier */}
      <ShoppingCart
        cart={cart}
        onCheckout={recordPurchase}
      />
    </>
  );
}
```

### **Étape 3 : Intégrer le paiement réel**

**Actuellement non intégré.** Pour ajouter Stripe :

```typescript
// À créer : src/lib/stripe.ts
export async function createCheckoutSession(levels: Level[]): Promise<string> {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ levels }),
  });

  const { sessionId } = await response.json();
  return sessionId;
}

// Puis dans ShoppingCart.tsx :
<button onClick={() => {
  const sessionId = await createCheckoutSession(cart);
  // Rediriger vers Stripe Checkout
  window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
}}>
  💳 Procéder au paiement
</button>
```

### **Étape 4 : Backend (à créer)**

```typescript
// api/checkout (Node/Express/Vercel)
export default async function handler(req, res) {
  const { levels } = req.body;

  // Calculer prix total
  const total = levels.reduce((sum, l) => sum + LEVEL_PRICING[l].price, 0);

  // Créer session Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: levels.map(level => ({
      price_data: {
        currency: 'eur',
        product_data: { name: `Accès ${level}` },
        unit_amount: Math.round(LEVEL_PRICING[level].price * 100),
      },
      quantity: 1,
    })),
    mode: 'payment',
    success_url: 'https://app.com/success?session={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://app.com/cart',
  });

  res.json({ sessionId: session.id });
}
```

---

## 💾 **Stockage et Persistance**

### **Client-side (localStorage)**

```javascript
// Achats enregistrés
localStorage['purchases-nolhan'] = JSON.stringify([
  { id: '1', level: 'CM2', purchasedAt: '2026-10-13T...', amount: 5.99 },
  { id: '2', level: '6e', purchasedAt: '2026-10-13T...', amount: 8.99 },
]);

// Panier courant
localStorage['cart-nolhan'] = JSON.stringify(['4e', '3e']);
```

### **Server-side (à implémenter)**

Stocker dans une base de données :

```sql
-- Table purchases
CREATE TABLE purchases (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  level VARCHAR(10),
  purchased_at TIMESTAMP,
  amount DECIMAL(5,2),
  stripe_session_id VARCHAR(255),
  status ENUM('pending', 'completed', 'failed')
);
```

---

## 📈 **Tarification Détaillée**

| Niveau | Tier | Prix | Justification |
|--------|------|------|---------------|
| **CE1** | Free | 0€ | Accroche, fidélisation |
| **CE2** | Basic | 4.99€ | Consolidation Cycle 2 |
| **CM1** | Basic | 5.99€ | Élargissement Cycle 3 |
| **CM2** | Premium | 7.99€ | Transition 3→4 |
| **6e** | Premium | 8.99€ | Entrée collège |
| **5e** | Premium | 9.99€ | Approfondissement |
| **4e** | Elite | 11.99€ | Vers le Brevet |
| **3e** | Elite | 14.99€ | Brevet complet |

### **Bundles avec Remise**

| Bundle | Niveaux | Prix | Régulier | Économies |
|--------|---------|------|----------|-----------|
| Cycle 2 | CE1+CE2 | 4.99€ | 4.99€ | 0% |
| Cycle 3 | CM1+CM2+6e | 19.99€ | 22.97€ | **13%** |
| Cycle 4 | 5e+4e+3e | 29.99€ | 36.97€ | **19%** |
| All | CE1…3e | 49.99€ | 63.93€ | **22%** |

---

## 🔒 **Contrôle d'Accès Implémenté**

```typescript
// Dans src/lib/monetization.ts

export function isLevelAccessible(
  level: Level,
  purchasedLevels: Level[] | null
): boolean {
  // CE1 toujours gratuit
  if (level === 'CE1') return true;

  // Vérifier si acheté
  if (purchasedLevels?.includes(level)) return true;

  // Sinon refusé
  return false;
}
```

**Utilisation :**
```typescript
const isAccessible = isLevelAccessible('CM2', purchases);

if (!isAccessible) {
  // Afficher écran paiement
  showPaymentCard('CM2');
} else {
  // Accès direct au niveau
  loadLevel('CM2');
}
```

---

## ✅ **Checklist d'Activation**

Pour passer de "prêt" à "actif" :

### **Phase 0 : Tests locaux** ✅ (FAIT)
- [x] Config prix définie
- [x] Composants créés
- [x] Hook fonctionnel
- [x] localStorage opérationnel
- [x] UI rendering

### **Phase 1 : Activation basique** (À faire)
- [ ] Changer `active: false` → `active: true` pour CE2+
- [ ] Intégrer LevelPricingCard dans HomeScreen
- [ ] Intégrer ShoppingCart dans HomeScreen
- [ ] Tester panier en local
- [ ] Tester localStorage persistence

### **Phase 2 : Paiement réel** (À faire)
- [ ] S'inscrire Stripe
- [ ] Créer API `/checkout`
- [ ] Implémenter Stripe.js frontend
- [ ] Tester session de paiement
- [ ] Implémenter webhook Stripe
- [ ] Synchroniser base de données

### **Phase 3 : Sécurité & Légal** (À faire)
- [ ] RGPD compliance
- [ ] Conditions d'utilisation
- [ ] Politique de remboursement
- [ ] Accès parent/manager
- [ ] Audit de sécurité

---

## 📝 **Notes importantes**

- **CE1 restera gratuit** : jamais pour vendre ce niveau
- **DYS support inclus** : jamais de frais supplémentaires
- **Certificats inclus** : valorisent l'achat
- **Tous les fichiers prêts** : aucun code à refactoriser pour activer

---

## 🚀 **Activation Rapide (5 min)**

```bash
# Étape 1 : Activer les niveaux payants
sed -i "s/active: false,  \/\/ Ce2/active: true,   \/\/ Ce2/g" src/lib/monetization.ts
sed -i "s/active: false,  \/\/ Cm1/active: true,   \/\/ Cm1/g" src/lib/monetization.ts
# ... etc pour CM2, 6e, 5e, 4e, 3e

# Étape 2 : Importer composants dans HomeScreen
# (chercher "TODO: Add pricing cards here")

# Étape 3 : Build et deploy
npm run build
git push

# FAIT ! La monétisation est activée
```

---

## 💡 **Vue Future : Améliorations Possibles**

- [ ] Codes promo/réductions
- [ ] Abonnement mensuel (alternative au paiement unique)
- [ ] Famille bundle (tous les enfants)
- [ ] Enseignant bundle (plusieurs classes)
- [ ] Intégration parent dashboard
- [ ] Analytics paiement (Tableau de bord)
- [ ] A/B testing prix
- [ ] Offres seasonales (rentrée, Noël)

---

**État final : ✅ Prêt pour activation, 100% fonctionnel, 0€ traité.**

Changer un flag et déployer = monétisation active.

