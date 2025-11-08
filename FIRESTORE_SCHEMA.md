# 🗄️ Schéma Firestore - GraphCI

Documentation complète des collections Firestore utilisées par l'API.

---

## 📦 Collections

### 1. `users`

Stocke tous les utilisateurs de l'application.

**Document ID** : `{userId}` (Firebase Auth UID)

**Schéma :**
```typescript
{
  id: string;                    // Même que le document ID
  idUnique: string;              // Format "CI-XXXX-YYYY" (public, affiché sur carte)
  email: string;                 // Email Firebase Auth
  displayName?: string;          // Nom optionnel (jamais affiché par défaut)
  nationality: string;           // "Ivoirienne" | "Burkinabé" | "Malienne" | ...
  age?: number;                  // Âge optionnel
  bio?: string;                  // Bio optionnelle
  
  // Position GPS
  lat: number;                   // Latitude (ex: 5.3600 pour Abidjan)
  lon: number;                   // Longitude (ex: -4.0083)
  commune?: string;              // Ville détectée (ex: "Abidjan")
  departement?: string;          // Département
  region?: string;               // Région administrative
  
  // Métadonnées
  friendCount: number;           // Nombre d'amis (incrémenté/décrémenté)
  createdAt: Timestamp;          // Date de création du compte
  lastActive: Timestamp;         // Dernière activité (pour afficher "en ligne")
  
  // Préférences
  showRealName: boolean;         // Afficher displayName sur carte (défaut: false)
  showLocation: boolean;         // Afficher position exacte (défaut: true)
  
  // Flags système
  isSimulated?: boolean;         // true pour utilisateurs créés via /api/dev/simulate/users
}
```

**Indexes requis :**
```
- idUnique (ASC/DESC) - Pour vérifier unicité
- lastActive (DESC) - Pour lister users actifs
- nationality (ASC) - Pour filtrage par nationalité
```

**Exemple :**
```json
{
  "id": "abc123def456",
  "idUnique": "CI-A3F2-K8L4",
  "email": "user@example.com",
  "displayName": "Jean Kouassi",
  "nationality": "Ivoirienne",
  "age": 28,
  "lat": 5.3600,
  "lon": -4.0083,
  "commune": "Abidjan",
  "region": "Lagunes",
  "friendCount": 12,
  "createdAt": "2025-10-31T10:00:00Z",
  "lastActive": "2025-10-31T14:30:00Z",
  "showRealName": false,
  "showLocation": true
}
```

---

### 2. `friendships`

Stocke les liens d'amitié entre utilisateurs (arêtes du graphe).

**Document ID** : Auto-généré

**Schéma :**
```typescript
{
  participants: [string, string]; // [userId1, userId2] - Trié alphabétiquement
  user1: string;                  // Premier user (pour requêtes)
  user2: string;                  // Deuxième user
  createdAt: Timestamp;           // Date de création du lien
  createdVia: string;             // "friend-code" | "simulation" | "friend-request"
}
```

**Indexes requis :**
```
- participants (ARRAY) - Pour chercher amitiés d'un user
- user1 (ASC) - Pour requêtes spécifiques
- user2 (ASC) - Pour requêtes spécifiques
```

**Notes :**
- `participants` est toujours trié pour éviter doublons (userId1 < userId2)
- Quand créé, incrémente `friendCount` des deux users

**Exemple :**
```json
{
  "participants": ["abc123", "def456"],
  "user1": "abc123",
  "user2": "def456",
  "createdAt": "2025-10-31T12:00:00Z",
  "createdVia": "friend-code"
}
```

---

### 3. `friendCodes`

Stocke les codes d'amitié temporaires (6 chiffres, 2 minutes).

**Document ID** : Auto-généré

**Schéma :**
```typescript
{
  code: string;                  // 6 chiffres (ex: "847392")
  creatorId: string;             // userId du créateur
  createdAt: Timestamp;          // Date de génération
  expiresAt: Timestamp;          // createdAt + 120 secondes
  used: boolean;                 // false par défaut, true après utilisation
  usedBy?: string;               // userId de celui qui a utilisé le code
  usedAt?: Timestamp;            // Date d'utilisation
}
```

**Indexes requis :**
```
- code (ASC) + used (ASC) - Pour rechercher codes valides
- creatorId (ASC) - Pour invalider anciens codes
- expiresAt (ASC) - Pour nettoyer codes expirés
```

**Notes :**
- Codes générés entre 100000 et 999999
- Quand user génère nouveau code, anciens codes marqués `used: true`
- Expiration vérifiée dans route API avec `isCodeExpired()`

**Exemple :**
```json
{
  "code": "847392",
  "creatorId": "abc123",
  "createdAt": "2025-10-31T14:00:00Z",
  "expiresAt": "2025-10-31T14:02:00Z",
  "used": false
}
```

**Après utilisation :**
```json
{
  "code": "847392",
  "creatorId": "abc123",
  "createdAt": "2025-10-31T14:00:00Z",
  "expiresAt": "2025-10-31T14:02:00Z",
  "used": true,
  "usedBy": "def456",
  "usedAt": "2025-10-31T14:01:30Z"
}
```

---

### 4. `conversations`

Stocke les conversations entre deux utilisateurs.

**Document ID** : Auto-généré

**Schéma :**
```typescript
{
  participants: [string, string]; // [userId1, userId2] - Trié alphabétiquement
  createdAt: Timestamp;           // Date de la première conversation
  lastMessageAt: Timestamp;       // Date du dernier message
  isActive: boolean;              // true si messages récents (< 30s)
  messageCount: number;           // Nombre total de messages
}
```

**Indexes requis :**
```
- participants (ARRAY) - Pour chercher conversation entre 2 users
- isActive (ASC) - Pour lister conversations actives (animation fils)
- lastMessageAt (DESC) - Pour trier par récence
```

**Notes :**
- `isActive` mis à `true` quand message envoyé
- Front-end doit écouter ce champ avec listener Firestore
- Animations fils basées sur ce flag

**Exemple :**
```json
{
  "participants": ["abc123", "def456"],
  "createdAt": "2025-10-31T10:00:00Z",
  "lastMessageAt": "2025-10-31T14:30:45Z",
  "isActive": true,
  "messageCount": 28
}
```

---

### 5. `messages`

Stocke les messages individuels.

**Document ID** : Auto-généré

**Schéma :**
```typescript
{
  conversationId: string;        // Référence à la conversation
  senderId: string;              // userId de l'expéditeur
  recipientId: string;           // userId du destinataire
  content: string;               // Contenu du message
  createdAt: Timestamp;          // Date d'envoi
  read: boolean;                 // false par défaut, true après lecture
}
```

**Indexes requis :**
```
- conversationId (ASC) + createdAt (DESC) - Pour lister messages d'une conversation
- recipientId (ASC) + read (ASC) - Pour compter messages non lus
```

**Notes :**
- Route `GET /api/messages/[conversationId]` marque automatiquement `read: true`
- Pagination possible avec `createdAt`

**Exemple :**
```json
{
  "conversationId": "conv123",
  "senderId": "abc123",
  "recipientId": "def456",
  "content": "Salut ! Comment ça va ?",
  "createdAt": "2025-10-31T14:30:00Z",
  "read": false
}
```

---

### 6. `friendshipTests` (À implémenter)

Stocke les tests d'amitié créés par les utilisateurs.

**Document ID** : `{userId}` (un test par user)

**Schéma :**
```typescript
{
  creatorId: string;             // userId du créateur
  createdAt: Timestamp;
  updatedAt: Timestamp;
  questions: [
    {
      id: string;                // ID unique de la question
      type: "qcm" | "text" | "situation";
      question: string;          // Texte de la question
      options?: string[];        // Pour QCM uniquement
      correctAnswer: string | string[]; // Réponse(s) attendue(s)
      keywords?: string[];       // Pour type "text"
    }
  ];
  passingScore: number;          // Score minimum pour réussir (ex: 2/3)
  maxAttempts: number;           // Tentatives max par personne (défaut: 3)
}
```

---

### 7. `friendshipTestAttempts` (À implémenter)

Stocke les tentatives de tests.

**Document ID** : Auto-généré

**Schéma :**
```typescript
{
  testId: string;                // Référence au test
  attempterId: string;           // userId de celui qui tente
  createdAt: Timestamp;
  answers: [
    {
      questionId: string;
      answer: string;
      correct: boolean;
    }
  ];
  score: number;                 // Nombre de bonnes réponses
  passed: boolean;               // true si score >= passingScore
}
```

---

### 8. `friendRequests` (À implémenter)

Stocke les demandes d'amitié (après réussite test).

**Document ID** : Auto-généré

**Schéma :**
```typescript
{
  fromId: string;                // userId demandeur
  toId: string;                  // userId destinataire
  createdAt: Timestamp;
  status: "pending" | "accepted" | "rejected";
  testPassed: boolean;           // true si test réussi
  message?: string;              // Message optionnel
}
```

---

## 🔍 Requêtes Courantes

### Récupérer tous les amis d'un user
```typescript
const friendshipsSnapshot = await db.collection('friendships')
  .where('participants', 'array-contains', userId)
  .get();

const friendIds = friendshipsSnapshot.docs.flatMap(doc => {
  const participants = doc.data().participants;
  return participants.filter(id => id !== userId);
});
```

### Vérifier si deux users sont amis
```typescript
const participants = [userId1, userId2].sort();

const friendship = await db.collection('friendships')
  .where('participants', '==', participants)
  .limit(1)
  .get();

const areFriends = !friendship.empty;
```

### Récupérer conversations actives
```typescript
const activeConversations = await db.collection('conversations')
  .where('isActive', '==', true)
  .get();

// Pour animation fils sur carte
activeConversations.docs.forEach(doc => {
  const { participants } = doc.data();
  // Appliquer glow sur le fil entre participants[0] et participants[1]
});
```

### Compter messages non lus
```typescript
const unreadMessages = await db.collection('messages')
  .where('recipientId', '==', userId)
  .where('read', '==', false)
  .get();

const unreadCount = unreadMessages.size;
```

### Chercher user par ID unique
```typescript
const userSnapshot = await db.collection('users')
  .where('idUnique', '==', 'CI-A3F2-K8L4')
  .limit(1)
  .get();

if (!userSnapshot.empty) {
  const user = userSnapshot.docs[0].data();
}
```

---

## 🔒 Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // USERS - Lecture publique, écriture protégée
    match /users/{userId} {
      allow read: if true; // Carte publique
      allow create: if isAuthenticated();
      allow update: if isOwner(userId);
      allow delete: if false; // Jamais supprimer
    }
    
    // FRIENDSHIPS - Lecture publique, création protégée
    match /friendships/{friendshipId} {
      allow read: if true; // Liens visibles sur carte
      allow create: if isAuthenticated();
      allow delete: if false;
    }
    
    // FRIEND CODES - Lecture limitée, création protégée
    match /friendCodes/{codeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated(); // Pour marquer 'used'
    }
    
    // CONVERSATIONS - Accès limité aux participants
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() 
        && request.auth.uid in resource.data.participants;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() 
        && request.auth.uid in resource.data.participants;
    }
    
    // MESSAGES - Accès limité aux participants
    match /messages/{messageId} {
      allow read: if isAuthenticated() 
        && (request.auth.uid == resource.data.senderId 
         || request.auth.uid == resource.data.recipientId);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() 
        && request.auth.uid == resource.data.recipientId; // Pour marquer 'read'
    }
  }
}
```

---

## 📊 Taille Estimée

Pour **10,000 utilisateurs actifs** :

| Collection | Documents | Taille approx. |
|-----------|-----------|----------------|
| users | 10,000 | ~5 MB |
| friendships | ~50,000 | ~3 MB |
| friendCodes | ~500 | ~50 KB |
| conversations | ~25,000 | ~2 MB |
| messages | ~500,000 | ~50 MB |
| **TOTAL** | **~585,000** | **~60 MB** |

**Firestore Spark (gratuit)** : 1 GB storage, 50k reads/day → Largement suffisant pour MVP

---

## 🧹 Maintenance

### Nettoyer les codes expirés (Cloud Function recommandée)

```typescript
export const cleanExpiredCodes = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = new Date();
    const expiredCodes = await db.collection('friendCodes')
      .where('expiresAt', '<', now)
      .where('used', '==', false)
      .get();
    
    const batch = db.batch();
    expiredCodes.docs.forEach(doc => {
      batch.update(doc.ref, { used: true });
    });
    
    await batch.commit();
    console.log(`Cleaned ${expiredCodes.size} expired codes`);
  });
```

### Désactiver conversations inactives (Cloud Function)

```typescript
export const deactivateOldConversations = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    
    const oldConversations = await db.collection('conversations')
      .where('isActive', '==', true)
      .where('lastMessageAt', '<', thirtySecondsAgo)
      .get();
    
    const batch = db.batch();
    oldConversations.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    
    await batch.commit();
    console.log(`Deactivated ${oldConversations.size} conversations`);
  });
```

---

**Documentation Firestore complète pour GraphCI**  
Dernière mise à jour : 31/10/2025
