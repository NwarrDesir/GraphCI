# 🚀 GraphCI - Architecture API Complète

## Vue d'ensemble

L'API GraphCI est construite avec **Next.js 14 App Router** et **Firebase Admin SDK**. Elle suit une architecture en 3 niveaux :

1. **Routes Publiques** : Accès au graphe sans authentification
2. **Routes Authentifiées** : Gestion des utilisateurs, amis, messages
3. **Routes Développement** : Simulation et tests du graphe

---

## 📁 Structure des Routes API

```
app/api/
├── graph/
│   └── public/route.ts          → GET  État du graphe (PUBLIC)
├── auth/
│   └── signup/route.ts          → POST Inscription + ID unique
├── user/
│   └── me/route.ts              → GET  Profil utilisateur (AUTH)
├── friends/
│   ├── generate-code/route.ts   → POST Générer code 6 chiffres (AUTH)
│   └── use-code/route.ts        → POST Utiliser code d'amitié (AUTH)
├── messages/
│   ├── send/route.ts            → POST Envoyer message (AUTH)
│   └── [conversationId]/route.ts → GET  Historique messages (AUTH)
└── dev/
    └── simulate/
        ├── users/route.ts       → POST Créer N users (DEV)
        ├── friendships/route.ts → POST Créer N liens (DEV)
        └── messages/route.ts    → POST Simuler conversation (DEV)
```

---

## 🔑 Système d'Authentification

### Routes Publiques
Aucune authentification requise. Idéal pour :
- Afficher la carte aux visiteurs
- Consulter les statistiques du graphe

### Routes Authentifiées
Header requis : `Authorization: Bearer <idToken>`

Obtenir le token :
```javascript
import { getAuth } from 'firebase/auth';
const user = getAuth().currentUser;
const idToken = await user.getIdToken();
```

### Routes DEV
Header requis : `X-Dev-Key: <DEV_API_KEY>`

Configuration dans `.env.local` :
```env
DEV_API_KEY=your-secret-dev-key
```

---

## 💡 Concepts Clés

### 1. Identifiant Unique Public (CI-XXXX-YYYY)

Chaque utilisateur reçoit un ID public au format `CI-XXXX-YYYY` :
- Généré automatiquement à l'inscription
- Affiché sur la carte (pas le nom réel)
- Unique et permanent

```javascript
// Généré par lib/utils/userUtils.ts
generateUniqueId() // → "CI-A3F2-K8L4"
```

### 2. Codes d'Amitié Temporaires

Système de codes à 6 chiffres pour créer des liens :
- Valables **2 minutes** exactement
- **Usage unique** (marqués comme `used` après utilisation)
- Liés au créateur du code

Workflow :
1. User A génère un code → `847392`
2. User B entre ce code dans les 2 minutes
3. Lien d'amitié créé automatiquement
4. `friendCount` incrémenté pour les deux

### 3. Conversations Actives

Le champ `isActive` permet l'animation des fils sur la carte :

```typescript
// Quand un message est envoyé
conversation.isActive = true
conversation.lastMessageAt = new Date()

// Front-end écoute ce champ
onSnapshot(query(conversations, where('isActive', '==', true)), ...)
// → Applique animation glow sur le fil correspondant
```

**Désactivation automatique** : À implémenter côté front (après 30s sans message)

---

## 🧪 Utilisation des Routes de Simulation

### Scénario Complet : Créer un Graphe Vivant

```javascript
// 1. Créer 15 utilisateurs répartis en Côte d'Ivoire
const users = await fetch('http://localhost:3000/api/dev/simulate/users', {
  method: 'POST',
  headers: {
    'X-Dev-Key': 'dev-secret-key-change-me',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ count: 15 })
}).then(res => res.json());

// 2. Créer 25 liens d'amitié aléatoires
await fetch('http://localhost:3000/api/dev/simulate/friendships', {
  method: 'POST',
  headers: { 'X-Dev-Key': 'dev-secret-key-change-me', 'Content-Type': 'application/json' },
  body: JSON.stringify({ count: 25 })
});

// 3. Simuler 3 conversations actives (fils qui brillent)
const user1 = users.data.users[0].id;
const user2 = users.data.users[1].id;

await fetch('http://localhost:3000/api/dev/simulate/messages', {
  method: 'POST',
  headers: { 'X-Dev-Key': 'dev-secret-key-change-me', 'Content-Type': 'application/json' },
  body: JSON.stringify({ user1Id: user1, user2Id: user2, count: 6 })
});

// 4. Vérifier l'état du graphe
const graph = await fetch('http://localhost:3000/api/graph/public').then(res => res.json());
console.log(graph.data.stats);
```

### Ou utiliser le script automatisé

```bash
# Exécuter le script de test complet
node scripts/test-api.js

# Ou commandes spécifiques
node scripts/test-api.js createUsers 20
node scripts/test-api.js createFriendships 30
node scripts/test-api.js getGraphState
```

---

## 🎯 Flux d'Utilisation

### Pour un Visiteur (Non connecté)

1. Accède à `/` → Voir la carte avec tous les points
2. API appelée : `GET /api/graph/public`
3. Reçoit :
   - Liste des utilisateurs avec positions
   - Liste des liens d'amitié
   - Conversations actives (fils brillants)
   - Statistiques globales

**Limitations** : Lecture seule, aucune interaction possible

---

### Pour un Nouvel Utilisateur

1. Clique sur "S'inscrire"
2. Frontend appelle : `POST /api/auth/signup`
3. Backend :
   - Crée compte Firebase Auth
   - Génère ID unique `CI-XXXX-YYYY`
   - Enregistre dans Firestore
   - Retourne `customToken`
4. Frontend se connecte avec le token
5. Utilisateur apparaît sur la carte

---

### Pour Ajouter un Ami (Code d'amitié)

**User A :**
```javascript
// 1. Générer un code
const { code } = await fetch('/api/friends/generate-code', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${idToken}` }
}).then(res => res.json());

// 2. Partager le code "847392" à User B (SMS, vocal, etc.)
```

**User B :**
```javascript
// 3. Entrer le code reçu
await fetch('/api/friends/use-code', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ code: '847392' })
});

// 4. Lien créé, fil apparaît sur la carte
```

---

### Pour Envoyer un Message

```javascript
// Messagerie universelle : pas besoin d'être ami
await fetch('/api/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipientId: 'userId123',
    content: 'Salut ! Comment ça va ?'
  })
});

// → Conversation marquée isActive=true
// → Fil brille sur la carte pendant la conversation
```

---

## 📊 Firestore Collections

```
users/
  {userId}
    - id: string
    - idUnique: "CI-XXXX-YYYY"
    - email: string
    - nationality: string
    - lat: number
    - lon: number
    - friendCount: number
    - lastActive: timestamp
    - isSimulated: boolean (pour users de test)

friendships/
  {friendshipId}
    - participants: [userId1, userId2]
    - user1: string
    - user2: string
    - createdAt: timestamp
    - createdVia: "friend-code" | "simulation"

friendCodes/
  {codeId}
    - code: "847392" (6 chiffres)
    - creatorId: string
    - createdAt: timestamp
    - expiresAt: timestamp (createdAt + 120s)
    - used: boolean
    - usedBy?: string
    - usedAt?: timestamp

conversations/
  {conversationId}
    - participants: [userId1, userId2] (sorted)
    - createdAt: timestamp
    - lastMessageAt: timestamp
    - isActive: boolean ← Pour animation fil
    - messageCount: number

messages/
  {messageId}
    - conversationId: string
    - senderId: string
    - recipientId: string
    - content: string
    - createdAt: timestamp
    - read: boolean
```

---

## 🔒 Sécurité

### Firestore Rules (à configurer)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users : lecture publique, écriture protégée
    match /users/{userId} {
      allow read: if true; // Carte publique
      allow write: if request.auth.uid == userId;
    }
    
    // Friendships : lecture publique, création protégée
    match /friendships/{friendshipId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
    
    // Messages : accès limité aux participants
    match /messages/{messageId} {
      allow read, write: if request.auth != null 
        && (request.auth.uid == resource.data.senderId 
         || request.auth.uid == resource.data.recipientId);
    }
    
    // Conversations : accès limité aux participants
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null 
        && request.auth.uid in resource.data.participants;
    }
  }
}
```

### Environment Variables

**JAMAIS commiter** :
- `FIREBASE_PRIVATE_KEY`
- `DEV_API_KEY`

Utiliser `.env.local` (gitignored) pour le développement.

---

## 🐛 Debug et Tests

### Vérifier que l'API fonctionne

```bash
# 1. Démarrer le serveur
npm run dev

# 2. Tester la route publique
curl http://localhost:3000/api/graph/public

# 3. Créer un graphe de test complet
node scripts/test-api.js
```

### Logs côté serveur

Les routes API loggent dans la console Next.js :
```
Error fetching public graph: ...
Error during signup: ...
Error generating friend code: ...
```

Surveiller la console pour débugger.

---

## 📈 Optimisations Futures

1. **Pagination** : Routes messages et friendships avec curseurs
2. **Cache** : Redis pour réduire charges Firestore
3. **Rate Limiting** : Limiter appels par IP/user
4. **WebSockets** : Remplacer polling par connexions temps réel
5. **Indexation** : Indexes Firestore pour queries complexes

---

## 🤝 Contribution

### Ajouter une nouvelle route API

1. Créer le fichier route : `app/api/votre-route/route.ts`
2. Implémenter handler : `export async function GET/POST(request) { ... }`
3. Documenter dans `API_DOCUMENTATION.md`
4. Ajouter test dans `scripts/test-api.js`
5. Mettre à jour ce README

---

## 📚 Ressources

- [Documentation API complète](./API_DOCUMENTATION.md)
- [Scripts de test](./scripts/test-api.js)
- [Configuration Firebase Admin](./lib/firebase/admin.ts)
- [Utils génération IDs/codes](./lib/utils/userUtils.ts)

---

**Architecture conçue pour supporter une croissance massive du graphe tout en restant simple à tester et à débugger.**

Dernière mise à jour : 31/10/2025
