# 🚀 Guide de Démarrage Rapide - MAP VENDEURS CI

## Prérequis

- Node.js 18+ installé
- npm ou yarn
- Compte Firebase (gratuit)
- Git
- VS Code (recommandé)

---

## 🔧 Étape 1 : Configuration Firebase

### 1.1 Créer le projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur "Ajouter un projet"
3. Nom du projet : **map-vendeurs-ci**
4. Activer Google Analytics (optionnel)

### 1.2 Activer les services

**Authentication :**
- Aller dans Authentication > Sign-in method
- Activer "Google"
- Activer "Anonyme"

**Firestore :**
- Aller dans Firestore Database
- Créer une base de données
- Mode : **Production**
- Région : **europe-west1** (ou la plus proche)

**Hosting :**
- Aller dans Hosting
- Cliquer sur "Commencer"

**Functions :**
- Aller dans Functions
- Cliquer sur "Commencer"
- Activer Blaze Plan (gratuit jusqu'à un certain seuil)

### 1.3 Récupérer les identifiants

1. Cliquer sur l'icône engrenage > Paramètres du projet
2. Descendre jusqu'à "Vos applications"
3. Cliquer sur l'icône web `</>`
4. Copier la configuration Firebase

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "map-vendeurs-ci.firebaseapp.com",
  projectId: "map-vendeurs-ci",
  storageBucket: "map-vendeurs-ci.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 📦 Étape 2 : Initialisation du Projet

### 2.1 Cloner ou créer le projet

```bash
# Se placer dans le dossier
cd c:\Users\ITmel\Desktop\vendeu

# Initialiser le projet Next.js
npx create-next-app@latest . --typescript --tailwind --app --no-src

# Répondre aux questions :
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use `src/` directory? Yes
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? No
```

### 2.2 Installer les dépendances

```bash
# Dépendances principales
npm install firebase
npm install sigma graphology graphology-layout-forceatlas2
npm install chart.js react-chartjs-2
npm install @headlessui/react @heroicons/react
npm install date-fns

# Dépendances de développement
npm install -D @types/node @types/react @types/react-dom
npm install -D prettier eslint-config-prettier
```

### 2.3 Initialiser Firebase CLI

```bash
# Installer Firebase CLI globalement (si pas déjà fait)
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser Firebase dans le projet
firebase init

# Sélectionner :
# ◉ Firestore
# ◉ Functions
# ◉ Hosting

# Répondre :
# ? What do you want to use as your public directory? out
# ? Configure as a single-page app? Yes
# ? Set up automatic builds with GitHub? No
# ? What language for Cloud Functions? TypeScript
# ? Use ESLint? Yes
# ? Install dependencies now? Yes
```

---

## 📝 Étape 3 : Configuration des Fichiers

### 3.1 Créer `.env.local`

```bash
# Créer le fichier à la racine
New-Item .env.local -ItemType File

# Ajouter (remplacer par vos vraies valeurs) :
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=map-vendeurs-ci.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=map-vendeurs-ci
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=map-vendeurs-ci.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3.2 Modifier `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
  swcMinify: true
}

module.exports = nextConfig
```

### 3.3 Modifier `firebase.json`

```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### 3.4 Créer `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.resource.data.keys().hasAll(['lat', 'lon', 'product', 'city', 'timestamp']);
      allow update, delete: if false;
    }
    
    match /vendors/{vendorId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /stats/{statId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /cities/{cityId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🏗️ Étape 4 : Créer la Structure

### 4.1 Créer les dossiers

```bash
# PowerShell
New-Item -Path "src\lib\firebase" -ItemType Directory -Force
New-Item -Path "src\lib\utils" -ItemType Directory -Force
New-Item -Path "src\lib\hooks" -ItemType Directory -Force
New-Item -Path "src\components\Graph" -ItemType Directory -Force
New-Item -Path "src\components\Report" -ItemType Directory -Force
New-Item -Path "src\components\Filters" -ItemType Directory -Force
New-Item -Path "src\components\Stats" -ItemType Directory -Force
New-Item -Path "src\components\Auth" -ItemType Directory -Force
New-Item -Path "src\types" -ItemType Directory -Force
New-Item -Path "src\app\stats" -ItemType Directory -Force
New-Item -Path "public\icons" -ItemType Directory -Force
```

---

## 🧪 Étape 5 : Tester l'Installation

### 5.1 Démarrer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### 5.2 Tester Firebase

```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Tester les Functions localement
cd functions
npm run serve
```

---

## 📊 Étape 6 : Ajouter des Données de Test

### 6.1 Script de seed (à créer)

Créer `scripts/seed.ts` :

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = { /* votre config */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const cities = [
  { name: 'Cocody', lat: 5.3600, lon: -3.9867 },
  { name: 'Yopougon', lat: 5.3364, lon: -4.0890 },
  { name: 'Abobo', lat: 5.4237, lon: -4.0260 }
];

const products = ['garba', 'pain', 'fruits', 'eau', 'riz', 'attiéké'];

async function seed() {
  // Ajouter les villes
  for (const city of cities) {
    await addDoc(collection(db, 'cities'), city);
  }
  
  // Générer 50 vendeurs aléatoires
  for (let i = 0; i < 50; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    
    await addDoc(collection(db, 'vendors'), {
      lat: city.lat + (Math.random() - 0.5) * 0.05,
      lon: city.lon + (Math.random() - 0.5) * 0.05,
      product,
      city: city.name,
      signalements: Math.floor(Math.random() * 10) + 1,
      first_seen: new Date(),
      last_seen: new Date()
    });
  }
  
  console.log('✅ Données de test ajoutées !');
}

seed();
```

Exécuter :
```bash
npx ts-node scripts/seed.ts
```

---

## 🚀 Étape 7 : Déploiement

### 7.1 Build production

```bash
npm run build
```

### 7.2 Déployer sur Firebase

```bash
# Déployer tout (hosting + functions + rules)
firebase deploy

# Ou séparément :
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

### 7.3 Accéder à l'application

URL : `https://map-vendeurs-ci.web.app`

---

## 🔍 Vérification Post-Installation

### Checklist

- [ ] Le serveur de dev démarre sans erreur (`npm run dev`)
- [ ] Firebase est bien connecté (vérifier dans la console)
- [ ] Les règles Firestore sont déployées
- [ ] L'authentification fonctionne (test de connexion Google)
- [ ] Les collections Firestore existent (vérifier dans Firebase Console)
- [ ] Le PWA manifest est accessible (`/manifest.json`)
- [ ] Les icônes PWA sont présentes (`/icons/`)
- [ ] Le build de production fonctionne (`npm run build`)
- [ ] Le déploiement fonctionne (`firebase deploy`)

---

## 🐛 Résolution des Problèmes Courants

### Erreur : "Firebase config is not defined"
→ Vérifier que `.env.local` existe et contient les bonnes variables

### Erreur : "Module not found: Can't resolve 'sigma'"
→ Réinstaller : `npm install sigma graphology`

### Erreur : "Permission denied" sur Firestore
→ Vérifier que les règles sont déployées : `firebase deploy --only firestore:rules`

### Le graphe ne s'affiche pas
→ Vérifier que la collection `vendors` contient des données

### Erreur de build Next.js
→ Supprimer `.next` et `out` puis rebuild : `rm -r .next out; npm run build`

---

## 📚 Ressources Utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Sigma.js](https://www.sigmajs.org/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Formule de Haversine](https://en.wikipedia.org/wiki/Haversine_formula)

---

## 🎯 Prochaines Étapes

1. ✅ **Compléter l'authentification** (src/lib/firebase/auth.ts)
2. ✅ **Créer le composant de graphe** (src/components/Graph/GraphView.tsx)
3. ✅ **Implémenter la géolocalisation** (src/lib/hooks/useGeolocation.ts)
4. ✅ **Créer les Cloud Functions** (functions/src/triggers/onReportCreated.ts)
5. ✅ **Ajouter les statistiques** (src/app/stats/page.tsx)

---

**Bon développement ! 🚀**

*En cas de blocage, consulter la documentation complète dans `/docs` ou contacter le chef de projet.*
