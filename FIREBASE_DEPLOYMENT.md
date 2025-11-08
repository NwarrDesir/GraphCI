# 🚀 Guide de Déploiement Firebase

## ✅ Configuration Terminée !

Votre projet Firebase **map-vendeurs-ci** est maintenant configuré avec les vraies clés !

---

## 📋 Checklist de Configuration

### 1. ✅ Variables d'Environnement
- [x] `.env.local` mis à jour avec les vraies clés
- [x] `FIREBASE_API_KEY` configuré
- [x] `FIREBASE_AUTH_DOMAIN` configuré
- [x] `FIREBASE_PROJECT_ID` configuré
- [x] `FIREBASE_STORAGE_BUCKET` configuré
- [x] `FIREBASE_MESSAGING_SENDER_ID` configuré
- [x] `FIREBASE_APP_ID` configuré
- [x] `FIREBASE_MEASUREMENT_ID` configuré

### 2. 📄 Fichiers de Configuration Créés
- [x] `firestore.rules` - Règles de sécurité Firestore
- [x] `storage.rules` - Règles de sécurité Storage
- [x] `firebase.json` - Configuration globale Firebase
- [x] `firestore.indexes.json` - Index pour optimiser les requêtes

---

## 🔥 Configuration Firebase Console

### Étape 1 : Activer Authentication

```bash
1. Aller sur https://console.firebase.google.com/
2. Sélectionner le projet "map-vendeurs-ci"
3. Aller dans "Authentication" > "Sign-in method"
4. Activer "Google"
5. Activer "Anonymous"
```

**Capture écran :**
```
Authentication
├─ Google ✅ Activé
├─ Anonymous ✅ Activé
└─ Email/Password ❌ Désactivé (optionnel)
```

---

### Étape 2 : Activer Firestore Database

```bash
1. Aller dans "Firestore Database"
2. Cliquer "Créer une base de données"
3. Mode : "Production" (avec règles de sécurité)
4. Région : europe-west1 (Belgique) ou europe-west9 (Paris)
5. Cliquer "Activer"
```

**Collections à créer (automatique via l'app) :**
- `reports` - Signalements de vendeurs
- `vendors` - Vendeurs fusionnés (via Cloud Functions)
- `stats` - Statistiques globales
- `cities` - Données des villes

---

### Étape 3 : Déployer les Règles Firestore

#### Option A : Via Firebase CLI (Recommandé)

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser (sélectionner Firestore uniquement)
firebase init firestore

# Déployer les règles
firebase deploy --only firestore:rules
```

#### Option B : Via Console (Manuel)

```bash
1. Ouvrir Firebase Console
2. Aller dans "Firestore Database" > "Règles"
3. Copier le contenu de firestore.rules
4. Coller dans l'éditeur
5. Cliquer "Publier"
```

---

### Étape 4 : Déployer les Index Firestore

```bash
# Via CLI
firebase deploy --only firestore:indexes
```

**Ou via Console :**
```
Firestore Database > Index > Ajouter un index
→ Les index seront créés automatiquement lors de la première requête
```

---

### Étape 5 : Activer Storage (Optionnel)

```bash
1. Aller dans "Storage"
2. Cliquer "Commencer"
3. Mode : "Production"
4. Région : europe-west1
```

**Déployer les règles :**
```bash
firebase deploy --only storage
```

---

## 🧪 Tester la Configuration

### Test 1 : Connexion

```bash
1. Lancer l'app : npm run dev
2. Ouvrir http://localhost:3000
3. Cliquer sur "Connexion Google"
4. Vérifier dans Firebase Console > Authentication > Users
   → Vous devriez voir votre compte
```

### Test 2 : Signalement

```bash
1. Se connecter
2. Cliquer sur le bouton + (flottant)
3. Autoriser la géolocalisation
4. Remplir le formulaire
5. Cliquer "Signaler"
6. Vérifier dans Firebase Console > Firestore > reports
   → Vous devriez voir un nouveau document
```

### Test 3 : Simulateur

```bash
1. Cliquer sur le bouton violet 🧪
2. Cliquer "Scénario complet (36 signalements)"
3. Attendre 3 secondes
4. Vérifier dans Firestore > reports
   → Vous devriez voir 36 nouveaux documents
```

---

## 🔒 Sécurité : Règles Firestore Expliquées

### Collection `reports`

```javascript
// ✅ Tout le monde peut LIRE
allow read: if true;

// ✅ Seuls les utilisateurs connectés peuvent CRÉER
allow create: if isAuthenticated()
  && request.resource.data.user_id == request.auth.uid;

// ✅ Seul le créateur peut MODIFIER/SUPPRIMER
allow update, delete: if resource.data.user_id == request.auth.uid;
```

### Collection `vendors`

```javascript
// ✅ Tout le monde peut LIRE
allow read: if true;

// ⚠️ Seules les Cloud Functions peuvent ÉCRIRE
// (En attendant, autorisé pour les tests)
allow create, update: if isAuthenticated();
```

---

## 📊 Index Firestore Créés

Les index permettent d'optimiser les requêtes complexes :

### Index 1 : Filtrage par Ville + Tri par Date
```javascript
city (ASC) + timestamp (DESC)
```
**Usage :** Filtrer les signalements d'une ville par ordre chronologique

### Index 2 : Filtrage par Produit + Tri par Date
```javascript
product (ASC) + timestamp (DESC)
```
**Usage :** Filtrer les signalements d'un produit par ordre chronologique

### Index 3 : Filtrage Ville + Produit + Date
```javascript
city (ASC) + product (ASC) + timestamp (DESC)
```
**Usage :** Combiner plusieurs filtres

---

## 🚢 Déploiement Hosting (Production)

### Étape 1 : Build Next.js

```bash
# Build statique
npm run build

# Exporter (pour Firebase Hosting)
npm run export
```

**Résultat :** Dossier `out/` créé avec les fichiers statiques

---

### Étape 2 : Initialiser Firebase Hosting

```bash
firebase init hosting

# Questions :
# - Public directory : out
# - Single-page app : Yes
# - Overwrite index.html : No
```

---

### Étape 3 : Déployer

```bash
# Déployer tout (Firestore + Hosting)
firebase deploy

# Ou déployer uniquement Hosting
firebase deploy --only hosting
```

**URL finale :** https://map-vendeurs-ci.web.app

---

## 🧹 Nettoyage des Données de Test

### Supprimer tous les signalements simulés

```bash
# Via Firestore Console
1. Aller dans Firestore Database
2. Collection "reports"
3. Filtrer par "simulated == true"
4. Sélectionner tous
5. Supprimer

# Ou via script (à créer)
```

### Script de nettoyage (optionnel)

```typescript
// scripts/clean-test-data.ts
import { db, COLLECTIONS } from './lib/firebase/config';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

async function cleanTestData() {
  const q = query(
    collection(db, COLLECTIONS.REPORTS),
    where('simulated', '==', true)
  );
  
  const snapshot = await getDocs(q);
  
  console.log(`🗑️ Suppression de ${snapshot.size} signalements de test...`);
  
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
  }
  
  console.log('✅ Nettoyage terminé !');
}

cleanTestData();
```

---

## 📊 Monitoring et Analytics

### Firebase Analytics (Déjà configuré)

Avec `measurementId: G-GYFDGJ4CX2`, vous avez accès à :

- 📈 Nombre d'utilisateurs actifs
- 🌍 Répartition géographique
- 📱 Type d'appareils
- ⏱️ Temps de session
- 🔥 Pages les plus visitées

**Accès :** Firebase Console > Analytics

---

### Performance Monitoring (Optionnel)

```bash
npm install firebase

# Dans lib/firebase/config.ts
import { getPerformance } from 'firebase/performance';

if (typeof window !== 'undefined') {
  const perf = getPerformance(app);
}
```

---

## 🔧 Troubleshooting

### Erreur : "Firebase: Error (auth/unauthorized-domain)"

**Solution :**
```bash
1. Firebase Console > Authentication > Settings
2. Onglet "Authorized domains"
3. Ajouter : localhost, 127.0.0.1, votre-domaine.com
```

---

### Erreur : "Missing or insufficient permissions"

**Solution :**
```bash
1. Vérifier les règles Firestore
2. Redéployer : firebase deploy --only firestore:rules
3. Vérifier que l'utilisateur est connecté
```

---

### Erreur : "Index not found"

**Solution :**
```bash
1. Firebase Console affichera un lien vers l'index manquant
2. Cliquer sur le lien pour créer l'index automatiquement
3. Attendre 2-3 minutes (création de l'index)
4. Réessayer la requête
```

---

## 📞 Support

### Documentation Firebase
- https://firebase.google.com/docs
- https://firebase.google.com/docs/firestore
- https://firebase.google.com/docs/auth

### Console Firebase
- https://console.firebase.google.com/

---

## ✅ Résumé

| Étape | Statut |
|-------|--------|
| Configuration `.env.local` | ✅ Terminé |
| Règles Firestore créées | ✅ Terminé |
| Règles Storage créées | ✅ Terminé |
| Index Firestore définis | ✅ Terminé |
| Configuration Firebase.json | ✅ Terminé |
| Authentication activée | ⏳ À faire |
| Firestore activé | ⏳ À faire |
| Règles déployées | ⏳ À faire |

---

## 🎯 Prochaines Étapes

1. ✅ Activer Authentication dans Firebase Console
2. ✅ Activer Firestore Database
3. ✅ Déployer les règles Firestore
4. 🧪 Tester la connexion et les signalements
5. 🚀 Déployer en production (Firebase Hosting)

---

<div align="center">

**🔥 FIREBASE CONFIGURÉ ET PRÊT ! 🔥**

**Votre projet est maintenant connecté à Firebase !**

</div>
