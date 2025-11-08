# 📚 Documentation API - GraphCI

Ce document contient la documentation complète de l'API Firebase/Next.js de GraphCI, avec des exemples de scripts pour tester chaque fonctionnalité.

---

## 🌍 Routes Publiques (Sans authentification)

### GET `/api/graph/public`

Récupère l'état complet du graphe visible par tous les visiteurs.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "...",
        "idUnique": "CI-A3F2-K8L4",
        "lat": 5.3600,
        "lon": -4.0083,
        "nationality": "Ivoirienne",
        "age": 25,
        "commune": "Abidjan",
        "friendCount": 3,
        "isActive": true
      }
    ],
    "friendships": [
      {
        "id": "...",
        "user1": "userId1",
        "user2": "userId2",
        "createdAt": 1234567890
      }
    ],
    "activeConversations": [
      {
        "participants": ["userId1", "userId2"]
      }
    ],
    "stats": {
      "totalUsers": 150,
      "activeUsers": 45,
      "totalFriendships": 320,
      "activeConversations": 12
    }
  }
}
```

**Script test (fetch) :**
```javascript
fetch('http://localhost:3000/api/graph/public')
  .then(res => res.json())
  .then(data => console.log('Graphe public:', data))
  .catch(err => console.error('Erreur:', err));
```

**Script test (curl) :**
```bash
curl http://localhost:3000/api/graph/public
```

---

## 🔐 Routes Authentification

### POST `/api/auth/signup`

Crée un nouveau compte utilisateur avec génération automatique d'ID unique CI-XXXX-YYYY.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "nationality": "Ivoirienne",
  "lat": 5.3600,
  "lon": -4.0083,
  "age": 25,
  "commune": "Abidjan",
  "region": "Lagunes",
  "displayName": "Jean Dupont"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "customToken": "eyJhbGciOiJSUzI1Ni...",
    "user": {
      "uid": "abc123",
      "idUnique": "CI-B7K3-M9P2",
      "email": "user@example.com",
      "nationality": "Ivoirienne",
      "position": { "lat": 5.3600, "lon": -4.0083 }
    }
  }
}
```

**Script test :**
```javascript
async function signup() {
  const response = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      nationality: 'Ivoirienne',
      lat: 5.3600,
      lon: -4.0083,
      age: 28,
      commune: 'Abidjan'
    })
  });
  
  const data = await response.json();
  console.log('Inscription:', data);
  return data;
}

signup();
```

---

## 👤 Routes Utilisateur (Authentifiées)

### GET `/api/user/me`

Récupère le profil complet de l'utilisateur connecté (avec liste des amis).

**Headers requis :**
```
Authorization: Bearer <idToken>
```

**Script test :**
```javascript
async function getMyProfile(idToken) {
  const response = await fetch('http://localhost:3000/api/user/me', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const data = await response.json();
  console.log('Mon profil:', data);
  return data;
}
```

---

## 👥 Routes Amitié (Authentifiées)

### POST `/api/friends/generate-code`

Génère un code d'amitié temporaire (6 chiffres, valable 2 minutes).

**Headers requis :**
```
Authorization: Bearer <idToken>
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "codeId123",
    "code": "847392",
    "expiresAt": 1234567890,
    "validitySeconds": 120
  }
}
```

**Script test :**
```javascript
async function generateFriendCode(idToken) {
  const response = await fetch('http://localhost:3000/api/friends/generate-code', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const data = await response.json();
  console.log('Code généré:', data.data.code);
  console.log('Expire dans:', data.data.validitySeconds, 'secondes');
  return data;
}
```

### POST `/api/friends/use-code`

Utilise un code d'amitié pour créer un lien.

**Body :**
```json
{
  "code": "847392"
}
```

**Script test :**
```javascript
async function useFriendCode(idToken, code) {
  const response = await fetch('http://localhost:3000/api/friends/use-code', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code })
  });
  
  const data = await response.json();
  console.log('Amitié créée:', data);
  return data;
}
```

---

## 💬 Routes Messagerie (Authentifiées)

### POST `/api/messages/send`

Envoie un message à un utilisateur. Marque la conversation comme active pour l'animation du fil.

**Body :**
```json
{
  "recipientId": "userId123",
  "content": "Salut ! Comment ça va ?"
}
```

**Script test :**
```javascript
async function sendMessage(idToken, recipientId, content) {
  const response = await fetch('http://localhost:3000/api/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipientId, content })
  });
  
  const data = await response.json();
  console.log('Message envoyé:', data);
  return data;
}
```

### GET `/api/messages/[conversationId]`

Récupère l'historique des messages d'une conversation.

**Query params :**
- `limit` (optionnel) : Nombre de messages (défaut: 50)
- `before` (optionnel) : Timestamp pour pagination

**Script test :**
```javascript
async function getMessages(idToken, conversationId) {
  const response = await fetch(`http://localhost:3000/api/messages/${conversationId}?limit=50`, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const data = await response.json();
  console.log('Messages:', data);
  return data;
}
```

---

## 🧪 Routes Simulation DEV (Protégées par clé API)

⚠️ **Ces routes sont réservées au développement. Elles ne doivent PAS être exposées en production.**

**Header requis pour toutes les routes DEV :**
```
X-Dev-Key: dev-secret-key-change-me
```

**Configuration :**
Définir la variable d'environnement `DEV_API_KEY` dans `.env.local` :
```env
DEV_API_KEY=votre-cle-secrete-dev
```

---

### POST `/api/dev/simulate/users`

Génère plusieurs utilisateurs fictifs avec positions aléatoires en Côte d'Ivoire.

**Body :**
```json
{
  "count": 10,
  "nationality": "Ivoirienne"
}
```

**Script test :**
```javascript
async function simulateUsers(count = 10, nationality = null) {
  const response = await fetch('http://localhost:3000/api/dev/simulate/users', {
    method: 'POST',
    headers: {
      'X-Dev-Key': 'dev-secret-key-change-me',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ count, nationality })
  });
  
  const data = await response.json();
  console.log(`${data.data.created} utilisateurs créés:`, data.data.users);
  return data;
}

// Exemple : créer 20 utilisateurs
simulateUsers(20);
```

**Script curl :**
```bash
curl -X POST http://localhost:3000/api/dev/simulate/users \
  -H "X-Dev-Key: dev-secret-key-change-me" \
  -H "Content-Type: application/json" \
  -d '{"count":15,"nationality":"Ivoirienne"}'
```

---

### POST `/api/dev/simulate/friendships`

Crée des liens d'amitié aléatoires entre utilisateurs existants.

**Body :**
```json
{
  "count": 20,
  "userIds": ["userId1", "userId2", "userId3"]
}
```

**Script test :**
```javascript
async function simulateFriendships(count = 20) {
  const response = await fetch('http://localhost:3000/api/dev/simulate/friendships', {
    method: 'POST',
    headers: {
      'X-Dev-Key': 'dev-secret-key-change-me',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ count })
  });
  
  const data = await response.json();
  console.log(`${data.data.created} amitiés créées:`, data.data.friendships);
  return data;
}

// Exemple : créer 30 liens d'amitié
simulateFriendships(30);
```

**Script curl :**
```bash
curl -X POST http://localhost:3000/api/dev/simulate/friendships \
  -H "X-Dev-Key: dev-secret-key-change-me" \
  -H "Content-Type: application/json" \
  -d '{"count":25}'
```

---

### POST `/api/dev/simulate/messages`

Simule des échanges de messages entre deux utilisateurs. Marque la conversation comme active pour tester l'animation du fil sur la carte.

**Body :**
```json
{
  "user1Id": "userId1",
  "user2Id": "userId2",
  "count": 5
}
```

**Script test :**
```javascript
async function simulateMessages(user1Id, user2Id, count = 5) {
  const response = await fetch('http://localhost:3000/api/dev/simulate/messages', {
    method: 'POST',
    headers: {
      'X-Dev-Key': 'dev-secret-key-change-me',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user1Id, user2Id, count })
  });
  
  const data = await response.json();
  console.log('Messages simulés:', data);
  console.log('Note:', data.data.note);
  return data;
}

// Exemple : simuler une conversation
simulateMessages('abc123', 'def456', 8);
```

---

## 🎯 Scénario Complet de Test

Voici un script qui teste toutes les fonctionnalités de l'API :

```javascript
// SCÉNARIO COMPLET DE TEST
async function testCompleteFlow() {
  console.log('🚀 Début du test complet de l\'API GraphCI\n');
  
  // 1. Créer 10 utilisateurs simulés
  console.log('1️⃣ Création de 10 utilisateurs...');
  const usersResult = await fetch('http://localhost:3000/api/dev/simulate/users', {
    method: 'POST',
    headers: {
      'X-Dev-Key': 'dev-secret-key-change-me',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ count: 10 })
  }).then(res => res.json());
  console.log(`✅ ${usersResult.data.created} utilisateurs créés\n`);
  
  // 2. Créer 15 amitiés entre eux
  console.log('2️⃣ Création de 15 liens d\'amitié...');
  const friendshipsResult = await fetch('http://localhost:3000/api/dev/simulate/friendships', {
    method: 'POST',
    headers: {
      'X-Dev-Key': 'dev-secret-key-change-me',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ count: 15 })
  }).then(res => res.json());
  console.log(`✅ ${friendshipsResult.data.created} amitiés créées\n`);
  
  // 3. Simuler une conversation active
  if (usersResult.data.users.length >= 2) {
    console.log('3️⃣ Simulation d\'une conversation active...');
    const user1 = usersResult.data.users[0].id;
    const user2 = usersResult.data.users[1].id;
    
    const messagesResult = await fetch('http://localhost:3000/api/dev/simulate/messages', {
      method: 'POST',
      headers: {
        'X-Dev-Key': 'dev-secret-key-change-me',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user1Id: user1, user2Id: user2, count: 6 })
    }).then(res => res.json());
    console.log(`✅ ${messagesResult.data.created} messages échangés`);
    console.log(`💡 ${messagesResult.data.note}\n`);
  }
  
  // 4. Vérifier l'état du graphe public
  console.log('4️⃣ Récupération de l\'état du graphe...');
  const graphResult = await fetch('http://localhost:3000/api/graph/public')
    .then(res => res.json());
  console.log(`✅ Graphe récupéré:
    - ${graphResult.data.stats.totalUsers} utilisateurs
    - ${graphResult.data.stats.totalFriendships} amitiés
    - ${graphResult.data.stats.activeConversations} conversations actives
    - ${graphResult.data.stats.activeUsers} utilisateurs actifs\n`);
  
  console.log('🎉 Test complet terminé ! Vérifiez la carte pour voir les résultats.');
}

// Exécuter le test
testCompleteFlow();
```

---

## 📦 Script PowerShell pour tests rapides

Créer un fichier `test-api.ps1` :

```powershell
# Test API GraphCI

$devKey = "dev-secret-key-change-me"
$baseUrl = "http://localhost:3000"

# Créer 10 utilisateurs
Write-Host "Creation de 10 utilisateurs..." -ForegroundColor Cyan
$usersBody = @{ count = 10 } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/dev/simulate/users" `
  -Method POST `
  -Headers @{ "X-Dev-Key" = $devKey; "Content-Type" = "application/json" } `
  -Body $usersBody

# Créer 20 amitiés
Write-Host "Creation de 20 amities..." -ForegroundColor Cyan
$friendshipsBody = @{ count = 20 } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/dev/simulate/friendships" `
  -Method POST `
  -Headers @{ "X-Dev-Key" = $devKey; "Content-Type" = "application/json" } `
  -Body $friendshipsBody

# Afficher le graphe
Write-Host "État du graphe:" -ForegroundColor Green
Invoke-RestMethod -Uri "$baseUrl/api/graph/public"
```

**Exécution :**
```powershell
.\test-api.ps1
```

---

## 🔧 Configuration Variables d'Environnement

Créer un fichier `.env.local` :

```env
# Firebase Admin
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Clé API Dev (pour routes simulation)
DEV_API_KEY=your-secret-dev-key-change-in-production
```

---

## 📝 Notes Importantes

1. **Routes publiques** : Accessibles sans authentification, idéales pour afficher le graphe aux visiteurs
2. **Routes authentifiées** : Nécessitent un token Firebase Auth dans le header `Authorization: Bearer <idToken>`
3. **Routes DEV** : Protégées par clé API, JAMAIS exposées en production
4. **Conversations actives** : Le champ `isActive` permet d'animer les fils sur la carte en temps réel
5. **IDs uniques** : Tous les utilisateurs ont un identifiant public au format `CI-XXXX-YYYY`

---

## 🎨 Intégration Front-End

L'API est conçue pour fonctionner avec un système de listeners Firestore côté front-end. Exemple :

```typescript
// Écouter les conversations actives en temps réel
const unsubscribe = onSnapshot(
  query(collection(db, 'conversations'), where('isActive', '==', true)),
  (snapshot) => {
    const activeLinks = snapshot.docs.map(doc => ({
      participants: doc.data().participants
    }));
    // Appliquer animation sur les fils correspondants
    updateActiveLinks(activeLinks);
  }
);
```

---

**Documentation mise à jour le 31/10/2025**
