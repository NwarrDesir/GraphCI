# 🗺️ GraphCI - Réseau Social Géolocalisé

**GraphCI** est une application web de réseau social basée sur la géolocalisation, permettant aux utilisateurs de se connecter avec des personnes autour d'eux en Côte d'Ivoire.

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)
![License](https://img.shields.io/badge/license-Private-red)

## 🌟 Fonctionnalités

### 📍 Carte Interactive
- Visualisation en temps réel des utilisateurs sur une carte de Côte d'Ivoire
- Détection automatique de votre position GPS
- Markers personnalisés par utilisateur
- Clustering intelligent pour les zones denses

### 🤝 Système d'Affinité
- **Tests d'affinité personnalisés** : Créez vos propres questions (QCM, Vrai/Faux, Questions ouvertes)
- **Validation automatique** : Score de compatibilité calculé automatiquement
- **Validation manuelle** : Option de valider manuellement les questions ouvertes
- **Protection anti-spam** : Blocage de 2 semaines après échec d'un test

### 💬 Messagerie en Temps Réel
- **Chat flottant** : Fenêtres de discussion déplaçables
- **Multi-conversations** : Discutez avec plusieurs personnes simultanément
- **Indicateurs de lecture** : ✓ envoyé, ✓✓ lu
- **Design transparent** : Ne cache pas la carte

### 🔔 Notifications
- Badges en temps réel pour les nouveaux messages
- Notifications de demandes d'affinité en attente
- Système de compteur dynamique

### 🔐 Authentification Sécurisée
- Connexion via Google OAuth
- Profils utilisateurs avec géolocalisation
- Système de friendCodes unique (format : CI-XXXX-YYYY)

## 🛠️ Stack Technique

### Frontend
- **Next.js 14.2.0** - Framework React avec Server-Side Rendering
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utility-first
- **React Icons** - Bibliothèque d'icônes

### Backend
- **Firebase Firestore** - Base de données NoSQL temps réel
- **Firebase Authentication** - Gestion des utilisateurs
- **Firebase Admin SDK** - API serveur
- **Next.js API Routes** - Routes API serverless

### Cartographie
- **Leaflet** - Bibliothèque de cartographie
- **React Leaflet** - Intégration React
- **OpenStreetMap** - Fonds de carte gratuits

### Hébergement
- **Vercel** - Hébergement et déploiement continu
- **Firebase Hosting** - Alternative disponible

## 📦 Installation

### Prérequis
- Node.js 18.x ou supérieur
- npm ou yarn
- Compte Firebase
- Compte Vercel (optionnel)

### Configuration

1. **Cloner le projet**
```bash
git clone https://github.com/NwarrDesir/GraphCI.git
cd GraphCI
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Firebase**

Créez un fichier `.env.local` à la racine :

```env
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (Private - Serveur uniquement)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

4. **Lancer en développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3001`

## 🚀 Déploiement

### Déploiement sur Vercel

1. **Installer Vercel CLI**
```bash
npm install -g vercel
```

2. **Déployer**
```bash
vercel
```

3. **Configurer les variables d'environnement**

Allez sur le dashboard Vercel → Settings → Environment Variables

Ajoutez toutes les variables du fichier `.env.local`

4. **Redéployer en production**
```bash
vercel --prod
```

### Déploiement Firebase Rules

```bash
firebase use --add  # Sélectionner votre projet
firebase deploy --only firestore:rules,firestore:indexes
```

## 📁 Structure du Projet

```
graphci/
├── app/                      # Application Next.js
│   ├── api/                  # Routes API
│   │   ├── affinity/         # Tests d'affinité
│   │   ├── stats/            # Statistiques
│   │   └── user/             # Gestion utilisateurs
│   ├── monitor/              # Page de monitoring
│   ├── stats/                # Page de statistiques
│   ├── globals.css           # Styles globaux
│   ├── layout.tsx            # Layout principal
│   └── page.tsx              # Page d'accueil (carte)
│
├── components/               # Composants React
│   ├── Affinity/             # Système d'affinité
│   │   ├── AffinityTestBuilder.tsx
│   │   ├── AffinityTestModal.tsx
│   │   └── AffinityPendingPanel.tsx
│   ├── Chat/                 # Messagerie
│   │   └── FloatingChatWindow.tsx
│   ├── Filters/              # Filtres de carte
│   ├── Graph/                # Carte interactive
│   │   └── GraphView.tsx
│   ├── Layout/               # Layout components
│   │   └── Header.tsx
│   ├── Report/               # Signalements (legacy)
│   ├── UI/                   # Composants UI
│   └── User/                 # Profils utilisateurs
│       └── UserProfilePopup.tsx
│
├── lib/                      # Bibliothèques et utilitaires
│   ├── contexts/             # Contextes React
│   │   └── AuthContext.tsx
│   ├── firebase/             # Configuration Firebase
│   │   ├── admin.ts          # Firebase Admin SDK
│   │   └── config.ts         # Firebase Client
│   ├── hooks/                # Hooks personnalisés
│   │   ├── useAuth.ts
│   │   ├── useGeolocation.ts
│   │   └── useVendors.ts
│   ├── types/                # Définitions TypeScript
│   │   └── index.ts
│   └── utils/                # Utilitaires
│       └── haversine.ts      # Calculs géographiques
│
├── public/                   # Fichiers statiques
│   └── manifest.json
│
├── scripts/                  # Scripts utilitaires
│
├── .env.local                # Variables d'environnement (non versionné)
├── .gitignore
├── firebase.json             # Configuration Firebase
├── firestore.rules           # Règles de sécurité Firestore
├── firestore.indexes.json    # Index Firestore
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🔒 Sécurité

### Firestore Rules

Les règles de sécurité Firestore garantissent :
- Seuls les utilisateurs authentifiés peuvent lire/écrire
- Chaque utilisateur ne peut modifier que ses propres données
- Les tests d'affinité sont protégés
- Les messages sont privés (uniquement expéditeur/destinataire)

### Variables d'Environnement

- **Variables publiques** (`NEXT_PUBLIC_*`) : Visibles côté client, protégées par Firestore Rules
- **Variables privées** : Restent sur le serveur uniquement (Vercel/Firebase Functions)

### Best Practices Appliquées

✅ Pas de secrets dans le code source  
✅ `.env.local` dans `.gitignore`  
✅ Repository GitHub en privé  
✅ Authentification obligatoire  
✅ Validation côté serveur  
✅ Rate limiting sur les API  

## 📊 Collections Firestore

### `users`
Profils utilisateurs avec géolocalisation

```typescript
{
  userId: string;           // UID Firebase Auth
  idUnique: string;         // Format: CI-XXXX-YYYY
  email: string;
  displayName: string;
  latitude: number;
  longitude: number;
  commune: string;          // Détection automatique
  friendCount: number;
  createdAt: Timestamp;
}
```

### `friendships`
Relations d'amitié entre utilisateurs

```typescript
{
  user1: string;            // userId
  user2: string;            // userId
  createdAt: Timestamp;
  source: 'affinity' | 'manual';
}
```

### `affinityTests`
Tests d'affinité créés par les utilisateurs

```typescript
{
  userId: string;
  title: string;
  description: string;
  questions: AffinityQuestion[];
  minimumScore: number;     // 0-100%
  isActive: boolean;
  createdAt: Timestamp;
}
```

### `messages`
Messages entre utilisateurs

```typescript
{
  from: string;             // userId expéditeur
  to: string;               // userId destinataire
  text: string;
  timestamp: Timestamp;
  read: boolean;
  participants: string[];   // [from, to] pour requêtes
}
```

## 🎯 Roadmap

### Version 1.3 (En cours)
- [ ] Notifications push
- [ ] Mode hors ligne
- [ ] Recherche d'utilisateurs
- [ ] Groupes d'utilisateurs

### Version 2.0 (Futur)
- [ ] Application mobile (React Native)
- [ ] Appels vidéo
- [ ] Événements géolocalisés
- [ ] Marketplace intégré

## 👥 Contributeurs

- **Melvine Kouame** - Développeur principal

## 📄 License

Ce projet est privé et propriétaire. Tous droits réservés.

## 🆘 Support

Pour toute question ou problème :
- 📧 Email : support@graphci.com
- 🐛 Issues : [GitHub Issues](https://github.com/NwarrDesir/GraphCI/issues)

---

**Développé avec ❤️ en Côte d'Ivoire 🇨🇮**

*Dernière mise à jour : Novembre 2025*
