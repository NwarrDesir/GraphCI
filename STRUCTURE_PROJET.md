# 📁 Structure du Projet MAP VENDEURS CI

## Architecture complète du projet

```
map-vendeurs-ci/
│
├── 📱 FRONTEND (Next.js PWA)
│   ├── src/
│   │   ├── app/                        # Next.js App Router
│   │   │   ├── layout.tsx              # Layout principal
│   │   │   ├── page.tsx                # Page d'accueil (graphe)
│   │   │   ├── stats/
│   │   │   │   └── page.tsx            # Page statistiques
│   │   │   └── api/
│   │   │       └── geolocation/
│   │   │           └── route.ts        # API route pour géoloc
│   │   │
│   │   ├── components/
│   │   │   ├── Graph/
│   │   │   │   ├── GraphView.tsx       # Composant graphe Sigma.js
│   │   │   │   ├── GraphControls.tsx   # Contrôles zoom/pan
│   │   │   │   └── GraphLegend.tsx     # Légende du graphe
│   │   │   │
│   │   │   ├── Report/
│   │   │   │   ├── ReportButton.tsx    # Bouton flottant "+ Ajouter"
│   │   │   │   ├── ReportModal.tsx     # Modal de signalement
│   │   │   │   └── ProductSelector.tsx # Sélecteur de produit
│   │   │   │
│   │   │   ├── Filters/
│   │   │   │   ├── CityFilter.tsx      # Filtre par ville
│   │   │   │   ├── ProductFilter.tsx   # Filtre par produit
│   │   │   │   └── DateFilter.tsx      # Filtre par période
│   │   │   │
│   │   │   ├── Stats/
│   │   │   │   ├── StatsOverview.tsx   # Vue d'ensemble
│   │   │   │   ├── CityStats.tsx       # Stats par ville
│   │   │   │   └── ProductChart.tsx    # Graphique produits
│   │   │   │
│   │   │   └── Auth/
│   │   │       ├── AuthButton.tsx      # Bouton connexion
│   │   │       └── UserProfile.tsx     # Profil utilisateur
│   │   │
│   │   ├── lib/
│   │   │   ├── firebase/
│   │   │   │   ├── config.ts           # Config Firebase
│   │   │   │   ├── auth.ts             # Fonctions auth
│   │   │   │   └── firestore.ts        # Fonctions Firestore
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── haversine.ts        # Calcul distance GPS
│   │   │   │   ├── graph.ts            # Logique du graphe
│   │   │   │   └── date.ts             # Utilitaires dates
│   │   │   │
│   │   │   └── hooks/
│   │   │       ├── useVendors.ts       # Hook récupération vendeurs
│   │   │       ├── useGeolocation.ts   # Hook géolocalisation
│   │   │       └── useAuth.ts          # Hook authentification
│   │   │
│   │   ├── types/
│   │   │   ├── vendor.ts               # Types Vendor
│   │   │   ├── report.ts               # Types Report
│   │   │   ├── stats.ts                # Types Stats
│   │   │   └── graph.ts                # Types Graph
│   │   │
│   │   └── styles/
│   │       └── globals.css             # Styles globaux (Tailwind)
│   │
│   ├── public/
│   │   ├── manifest.json               # Manifest PWA
│   │   ├── icons/                      # Icônes PWA
│   │   │   ├── icon-192x192.png
│   │   │   └── icon-512x512.png
│   │   └── sw.js                       # Service Worker
│   │
│   ├── .env.local                      # Variables d'environnement
│   ├── next.config.js                  # Config Next.js
│   ├── tailwind.config.js              # Config Tailwind
│   ├── tsconfig.json                   # Config TypeScript
│   ├── package.json                    # Dépendances
│   └── README.md                       # Documentation
│
├── 🔥 BACKEND (Firebase Functions)
│   ├── functions/
│   │   ├── src/
│   │   │   ├── index.ts                # Point d'entrée
│   │   │   │
│   │   │   ├── triggers/
│   │   │   │   ├── onReportCreated.ts  # Trigger nouveau signalement
│   │   │   │   └── updateStats.ts      # Fonction planifiée stats
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── haversine.ts        # Calcul distance (serveur)
│   │   │   │   ├── vendor.ts           # Logique vendeurs
│   │   │   │   └── stats.ts            # Calculs statistiques
│   │   │   │
│   │   │   └── types/
│   │   │       ├── vendor.ts           # Types partagés
│   │   │       ├── report.ts
│   │   │       └── stats.ts
│   │   │
│   │   ├── package.json                # Dépendances Functions
│   │   ├── tsconfig.json               # Config TypeScript
│   │   └── .eslintrc.js                # Config ESLint
│   │
│   ├── firestore.rules                 # Règles de sécurité Firestore
│   ├── firestore.indexes.json          # Index Firestore
│   ├── firebase.json                   # Config Firebase
│   └── .firebaserc                     # Projets Firebase
│
├── 📊 DATA (Scripts d'initialisation)
│   ├── seed/
│   │   ├── seedVendors.ts              # Script génération vendeurs test
│   │   ├── seedCities.ts               # Script ajout villes CI
│   │   └── data/
│   │       ├── cities.json             # Liste villes CI
│   │       └── products.json           # Liste produits
│   │
│   └── README.md                       # Guide utilisation scripts
│
├── 📝 DOCS
│   ├── SPECIFICATION.md                # Spécification fonctionnelle
│   ├── ARCHITECTURE.md                 # Documentation architecture
│   ├── API.md                          # Documentation API
│   ├── DEPLOYMENT.md                   # Guide déploiement
│   └── DEVELOPMENT.md                  # Guide développement
│
└── 🧪 TESTS
    ├── __tests__/
    │   ├── utils/
    │   │   └── haversine.test.ts       # Tests fonction distance
    │   ├── components/
    │   │   └── GraphView.test.tsx      # Tests composants
    │   └── functions/
    │       └── onReportCreated.test.ts # Tests Cloud Functions
    │
    └── jest.config.js                  # Config Jest
```

---

## 🎯 Dossiers Critiques

### `/src/app` - Application Next.js
- Point d'entrée de l'application
- Routing basé sur le système de fichiers
- Server Components par défaut

### `/src/components` - Composants React
- Composants réutilisables
- Organisation par fonctionnalité
- TypeScript strict

### `/src/lib` - Logique métier
- Configuration Firebase
- Fonctions utilitaires
- Hooks personnalisés

### `/functions/src` - Cloud Functions
- Triggers Firestore
- Fonctions planifiées
- Logique serveur

---

## 📦 Packages Principaux

### Frontend
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.0",
    "sigma": "^2.4.0",
    "graphology": "^0.25.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "tailwindcss": "^3.4.0",
    "@headlessui/react": "^1.7.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Backend (Functions)
```json
{
  "dependencies": {
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.5.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 🚀 Commandes de Développement

```bash
# Installation initiale
npm install

# Développement local (frontend)
npm run dev

# Build production
npm run build

# Déploiement Firebase Functions
cd functions
npm run deploy

# Déploiement complet (hosting + functions)
firebase deploy

# Tests
npm run test

# Linting
npm run lint
```

---

## 🔧 Fichiers de Configuration Essentiels

### `.env.local`
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### `firebase.json`
```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
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

### `next.config.js`
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

---

## 🎨 Structure des Composants

### Exemple : `GraphView.tsx`
```typescript
'use client';

import { useEffect, useRef } from 'react';
import Sigma from 'sigma';
import Graph from 'graphology';
import { Vendor } from '@/types/vendor';

interface GraphViewProps {
  vendors: Vendor[];
  selectedCity?: string;
  selectedProduct?: string;
}

export default function GraphView({ 
  vendors, 
  selectedCity, 
  selectedProduct 
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Logique du graphe Sigma.js
  }, [vendors, selectedCity, selectedProduct]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen bg-black"
    />
  );
}
```

---

## 🗄️ Structure Firestore

```
/reports/{reportId}
  ├── lat: number
  ├── lon: number
  ├── product: string
  ├── city: string
  ├── timestamp: Timestamp
  └── user_id: string

/vendors/{vendorId}
  ├── lat: number
  ├── lon: number
  ├── product: string
  ├── city: string
  ├── signalements: number
  ├── first_seen: Timestamp
  └── last_seen: Timestamp

/stats/{city}_{product}
  ├── city: string
  ├── product: string
  ├── avg_distance_m: number
  ├── active_vendors: number
  ├── total_reports: number
  └── updated_at: Timestamp

/cities/{cityId}
  ├── name: string
  ├── lat: number
  ├── lon: number
  └── population: number
```

---

## 📋 Checklist de Développement

### Phase 1 : Setup
- [ ] Créer projet Firebase
- [ ] Initialiser projet Next.js
- [ ] Configurer TypeScript
- [ ] Installer dépendances
- [ ] Configurer Tailwind CSS

### Phase 2 : Auth & Firestore
- [ ] Implémenter Firebase Auth
- [ ] Créer collections Firestore
- [ ] Configurer règles de sécurité
- [ ] Tester connexion Firebase

### Phase 3 : Signalement
- [ ] Composant géolocalisation
- [ ] Modal de signalement
- [ ] Envoi données Firestore
- [ ] Gestion erreurs

### Phase 4 : Graphe
- [ ] Intégration Sigma.js
- [ ] Génération graphe depuis données
- [ ] Interactions (zoom, pan)
- [ ] Styling (noir/blanc)

### Phase 5 : Cloud Functions
- [ ] Fonction `onReportCreated`
- [ ] Logique fusion vendeurs
- [ ] Fonction `updateStats`
- [ ] Tests unitaires

### Phase 6 : Statistiques
- [ ] Page stats
- [ ] Graphiques Chart.js
- [ ] Filtres interactifs
- [ ] Export données

### Phase 7 : PWA
- [ ] Créer manifest.json
- [ ] Implémenter service worker
- [ ] Tester installation mobile
- [ ] Optimiser performances

### Phase 8 : Déploiement
- [ ] Build production
- [ ] Déployer Functions
- [ ] Déployer Hosting
- [ ] Tests post-déploiement

---

**Date de création :** 25 octobre 2025  
**Version :** 1.0
