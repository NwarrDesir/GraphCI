# 🎯 Système d'Affinité - Documentation Complète

## 📋 Vue d'ensemble

Le système d'affinité permet aux utilisateurs de créer des tests personnalisés pour filtrer leurs demandes d'amitié. Le principe : **"Qui se ressemble, s'assemble"**.

### Flux principal

```
1. Utilisateur A crée un test d'affinité (optionnel)
2. Utilisateur B clique sur le profil de A sur la carte
3. B répond au test d'affinité de A
4. Le système évalue automatiquement les QCM et Vrai/Faux
5. Si questions ouvertes → A doit valider manuellement
6. Si score suffisant (et validé) → Amitié automatiquement créée
7. Si échec → Blocage de 2 semaines avant nouvelle tentative
```

---

## 🗂️ Structure des données Firestore

### Collection `affinityTests`
Stocke les tests créés par les utilisateurs.

```typescript
{
  id: string,
  userId: string, // Créateur
  title: string,
  description?: string,
  questions: AffinityQuestion[], // Voir types ci-dessous
  minimumScore: number, // 0-100 (pourcentage requis)
  hasOpenQuestions: boolean,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  totalAttempts: number,
  totalSuccess: number,
  totalPending: number
}
```

### Collection `affinityFriendRequests`
Stocke les demandes d'amitié avec réponses.

```typescript
{
  id: string,
  from: string, // Demandeur
  to: string, // Destinataire
  testId: string,
  answers: AffinityAnswer[],
  
  // Évaluation automatique
  autoScore?: number, // 0-100
  autoScorePassed?: boolean,
  
  // Évaluation manuelle
  needsManualReview: boolean,
  manualReviewCompleted: boolean,
  manualReviewDecision?: 'approved' | 'rejected',
  manualReviewComment?: string,
  
  status: 'pending' | 'auto-approved' | 'manual-review' | 'approved' | 'rejected',
  
  createdAt: Timestamp,
  reviewedAt?: Timestamp,
  approvedAt?: Timestamp
}
```

### Collection `affinityRequestBlocks`
Gère les blocages temporaires (2 semaines).

```typescript
{
  id: string,
  from: string,
  to: string,
  testId: string,
  blockedUntil: Timestamp, // +14 jours
  createdAt: Timestamp,
  reason: 'failed-auto' | 'rejected-manual'
}
```

---

## 🛠️ API Routes

### 1. `/api/affinity/test`

#### GET - Récupérer un test
**Query params:** `?userId=xxx`

**Réponse:**
```json
{
  "id": "test-id",
  "userId": "user-id",
  "title": "On se ressemble ?",
  "description": "...",
  "questions": [
    {
      "id": "q1",
      "type": "qcm",
      "question": "Quelle est ta couleur préférée ?",
      "order": 0,
      "options": ["Rouge", "Bleu", "Vert", "Jaune"]
      // ⚠️ PAS de correctAnswerIndex pour sécurité
    }
  ],
  "minimumScore": 70,
  "hasOpenQuestions": false
}
```

#### POST - Créer/Modifier un test
**Body:**
```json
{
  "userId": "user-id",
  "title": "Mon test",
  "description": "...",
  "questions": [
    {
      "id": "q1",
      "type": "qcm",
      "question": "...",
      "order": 0,
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 2 // ✅ Stocké côté serveur
    },
    {
      "id": "q2",
      "type": "vrai-faux",
      "question": "...",
      "order": 1,
      "correctAnswer": true
    },
    {
      "id": "q3",
      "type": "ouverte",
      "question": "...",
      "order": 2
      // Pas de correctAnswer - validation manuelle
    }
  ],
  "minimumScore": 70
}
```

**Réponse:**
```json
{
  "success": true,
  "testId": "test-id",
  "message": "Test d'affinité enregistré avec succès"
}
```

#### DELETE - Désactiver un test
**Query params:** `?userId=xxx`

---

### 2. `/api/affinity/submit`

#### POST - Soumettre des réponses
**Body:**
```json
{
  "testId": "test-id",
  "fromUserId": "demandeur-id",
  "toUserId": "destinataire-id",
  "answers": [
    {
      "questionId": "q1",
      "questionType": "qcm",
      "answerIndex": 1
    },
    {
      "questionId": "q2",
      "questionType": "vrai-faux",
      "answerBoolean": false
    },
    {
      "questionId": "q3",
      "questionType": "ouverte",
      "answerText": "Je répondrais avec honnêteté..."
    }
  ]
}
```

**Réponse (validation auto immédiate):**
```json
{
  "success": true,
  "requestId": "request-id",
  "status": "auto-approved",
  "autoScore": 85.5,
  "autoScorePassed": true,
  "needsManualReview": false,
  "message": "🎉 Félicitations ! Vous êtes maintenant amis !"
}
```

**Réponse (validation manuelle requise):**
```json
{
  "success": true,
  "requestId": "request-id",
  "status": "manual-review",
  "autoScore": 80.0,
  "autoScorePassed": true,
  "needsManualReview": true,
  "message": "⏳ Votre demande est en attente de validation"
}
```

**Réponse (échec):**
```json
{
  "success": true,
  "requestId": "request-id",
  "status": "rejected",
  "autoScore": 45.0,
  "autoScorePassed": false,
  "message": "❌ Score insuffisant (45.0%). Réessayez dans 2 semaines."
}
```

**Erreur (bloqué):**
```json
{
  "error": "Vous devez attendre encore 12 jour(s) avant de retenter",
  "blocked": true,
  "blockedUntil": "2025-11-22T10:30:00.000Z"
}
```

---

### 3. `/api/affinity/validate`

#### POST - Valider/Refuser manuellement
**Body:**
```json
{
  "requestId": "request-id",
  "userId": "destinataire-id",
  "decision": "approved", // ou "rejected"
  "comment": "Ta réponse me plaît !" // optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "decision": "approved",
  "finalStatus": "approved",
  "message": "Demande acceptée - Amitié créée !"
}
```

⚠️ **Important:** Si refusé, un bloc de 2 semaines est créé automatiquement.

---

### 4. `/api/affinity/pending`

#### GET - Récupérer les demandes en attente
**Query params:** `?userId=xxx`

**Réponse:**
```json
{
  "requests": [
    {
      "id": "request-id",
      "from": "user-id",
      "fromUser": {
        "idUnique": "CI-ABCD-1234",
        "displayName": "Jean",
        "commune": "Cocody",
        "age": 25,
        "nationality": "Ivoirien"
      },
      "testId": "test-id",
      "autoScore": 75.0,
      "autoScorePassed": true,
      "openQuestions": [
        {
          "questionId": "q3",
          "questionType": "ouverte",
          "answerText": "Ma réponse complète..."
        }
      ],
      "createdAt": "2025-11-08T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## 🎨 Composants UI

### 1. `AffinityTestBuilder`
**Fichier:** `components/Affinity/AffinityTestBuilder.tsx`

**Props:**
```typescript
{
  userId: string,
  onSaved: () => void,
  onCancel: () => void
}
```

**Fonctionnalités:**
- ✅ Ajouter QCM (avec 4 options, sélection radio pour bonne réponse)
- ✅ Ajouter Vrai/Faux (sélection radio)
- ✅ Ajouter Question Ouverte
- ✅ Déplacer questions (haut/bas)
- ✅ Supprimer questions
- ✅ Définir score minimum (slider 0-100%)
- ✅ Validation complète avant sauvegarde
- ✅ Appel API POST /api/affinity/test

---

### 2. `AffinityTestModal`
**Fichier:** `components/Affinity/AffinityTestModal.tsx`

**Props:**
```typescript
{
  testId: string,
  testOwnerName: string,
  testTitle: string,
  testDescription?: string,
  currentUserId: string,
  onClose: () => void,
  onSubmitted: (result) => void
}
```

**Fonctionnalités:**
- ✅ Charge le test via GET /api/affinity/test
- ✅ Affiche QCM (radio buttons)
- ✅ Affiche Vrai/Faux (2 boutons)
- ✅ Affiche Questions Ouvertes (textarea)
- ✅ Validation que toutes les questions ont une réponse
- ✅ Soumission via POST /api/affinity/submit
- ✅ Affiche résultat (succès/attente/échec)

---

### 3. `AffinityPendingPanel`
**Fichier:** `components/Affinity/AffinityPendingPanel.tsx`

**Props:**
```typescript
{
  userId: string,
  onClose: () => void,
  onRequestProcessed: () => void
}
```

**Fonctionnalités:**
- ✅ Charge les demandes via GET /api/affinity/pending
- ✅ Affiche profil du demandeur
- ✅ Affiche score automatique
- ✅ Affiche réponses aux questions ouvertes (toggle)
- ✅ Boutons Accepter/Refuser
- ✅ Appel API POST /api/affinity/validate
- ✅ Mise à jour temps réel après traitement

---

### 4. `UserProfilePopup`
**Fichier:** `components/User/UserProfilePopup.tsx`

**Props:**
```typescript
{
  user: User,
  currentUserId: string | null,
  isAlreadyFriend: boolean,
  onClose: () => void,
  onStartAffinityTest: () => void
}
```

**Fonctionnalités:**
- ✅ Affiche avatar, nom, bio
- ✅ Affiche commune, âge, nationalité, nombre d'amis
- ✅ Bouton "🤝 On se ressemble ?" si pas encore ami
- ✅ Désactivé si propre profil ou déjà ami

---

## 🔄 Logique Métier

### Calcul du score automatique

```typescript
// Pseudo-code
let autoQuestions = 0;
let autoCorrect = 0;

for (const answer of answers) {
  const question = getQuestion(answer.questionId);
  
  if (question.type === 'qcm') {
    autoQuestions++;
    if (answer.answerIndex === question.correctAnswerIndex) {
      autoCorrect++;
    }
  } else if (question.type === 'vrai-faux') {
    autoQuestions++;
    if (answer.answerBoolean === question.correctAnswer) {
      autoCorrect++;
    }
  }
  // Questions ouvertes ignorées pour le score auto
}

const autoScore = autoQuestions > 0 ? (autoCorrect / autoQuestions) * 100 : 100;
const passed = autoScore >= test.minimumScore;
```

### Détermination du statut

```typescript
if (!test.hasOpenQuestions && passed) {
  // Cas 1: Que des questions auto + score OK
  status = 'auto-approved';
  → Créer l'amitié immédiatement
  
} else if (!passed) {
  // Cas 2: Score insuffisant
  status = 'rejected';
  → Créer bloc de 2 semaines
  
} else {
  // Cas 3: Score OK mais questions ouvertes
  status = 'manual-review';
  → Attendre validation du créateur
}
```

### Création automatique d'amitié

```typescript
async function createFriendshipLink(userId1, userId2) {
  // 1. Créer le document friendship
  const [user1, user2] = [userId1, userId2].sort(); // Ordre alphabétique
  
  await db.collection('friendships').add({
    userId1: user1,
    userId2: user2,
    status: 'accepted',
    createdAt: now,
    acceptedAt: now
  });
  
  // 2. Incrémenter le compteur d'amis
  await Promise.all([
    db.collection('users').doc(userId1).update({
      friendCount: FieldValue.increment(1)
    }),
    db.collection('users').doc(userId2).update({
      friendCount: FieldValue.increment(1)
    })
  ]);
  
  // 3. Le graphe se met à jour automatiquement
}
```

---

## 🧪 Tests à effectuer

### Test 1: Validation automatique (QCM uniquement)
1. User A crée un test avec 3 QCM, score minimum 70%
2. User B répond correctement à 3/3 (100%)
3. ✅ Vérifier: status = 'auto-approved', amitié créée immédiatement
4. ✅ Vérifier: friendCount de A et B incrémenté
5. ✅ Vérifier: Lien apparaît dans le graphe

### Test 2: Validation automatique (échec)
1. User A crée un test avec 4 QCM, score minimum 75%
2. User B répond correctement à 2/4 (50%)
3. ✅ Vérifier: status = 'rejected'
4. ✅ Vérifier: Bloc créé dans affinityRequestBlocks
5. User B retente immédiatement
6. ✅ Vérifier: Erreur "Vous devez attendre 14 jours"

### Test 3: Validation manuelle (questions ouvertes)
1. User A crée un test: 2 QCM (70%) + 1 ouverte
2. User B répond: 2/2 QCM corrects + texte "Ma réponse..."
3. ✅ Vérifier: status = 'manual-review', autoScore = 100%
4. User A ouvre AffinityPendingPanel
5. ✅ Vérifier: Demande visible avec réponse ouverte
6. User A clique "Accepter"
7. ✅ Vérifier: Amitié créée

### Test 4: Validation manuelle (rejet)
1. Même scénario que Test 3
2. User A clique "Refuser"
3. ✅ Vérifier: status = 'rejected'
4. ✅ Vérifier: Bloc créé pour 2 semaines
5. User B retente
6. ✅ Vérifier: Erreur blocage

---

## 🚀 Intégration dans l'app

### Étape 1: Header - Notifications
Modifier `components/Layout/Header.tsx`:

```typescript
// Ajouter état
const [pendingCount, setPendingCount] = useState(0);

// Charger le nombre de demandes en attente
useEffect(() => {
  if (authUser) {
    fetch(`/api/affinity/pending?userId=${authUser.uid}`)
      .then(res => res.json())
      .then(data => setPendingCount(data.count))
      .catch(console.error);
  }
}, [authUser]);

// Modifier le badge notifications
<span className="...">
  {pendingCount || 5} {/* Remplacer 5 par pendingCount */}
</span>

// Au clic sur notifications, ouvrir AffinityPendingPanel
```

### Étape 2: GraphView - Marker Click
Modifier `components/Graph/GraphView.tsx`:

```typescript
const [selectedUser, setSelectedUser] = useState<User | null>(null);
const [showAffinityTest, setShowAffinityTest] = useState(false);

// Au clic sur un CircleMarker
<CircleMarker
  eventHandlers={{
    click: () => setSelectedUser(user)
  }}
/>

// Afficher le popup
{selectedUser && (
  <UserProfilePopup
    user={selectedUser}
    currentUserId={currentUser?.id || null}
    isAlreadyFriend={checkIfFriend(selectedUser.id)}
    onClose={() => setSelectedUser(null)}
    onStartAffinityTest={() => {
      setShowAffinityTest(true);
    }}
  />
)}

// Afficher le test
{showAffinityTest && selectedUser && (
  <AffinityTestModal
    testId={selectedUser.id}
    testOwnerName={selectedUser.displayName || selectedUser.idUnique}
    testTitle="Test d'affinité"
    currentUserId={currentUser?.id || ''}
    onClose={() => setShowAffinityTest(false)}
    onSubmitted={(result) => {
      alert(result.message);
      setShowAffinityTest(false);
      setSelectedUser(null);
    }}
  />
)}
```

### Étape 3: Profil - Créer son test
Créer une page `/profile` ou ajouter dans le menu:

```typescript
const [showTestBuilder, setShowTestBuilder] = useState(false);

<button onClick={() => setShowTestBuilder(true)}>
  Créer mon test d'affinité
</button>

{showTestBuilder && (
  <AffinityTestBuilder
    userId={currentUser.id}
    onSaved={() => {
      alert('Test créé !');
      setShowTestBuilder(false);
    }}
    onCancel={() => setShowTestBuilder(false)}
  />
)}
```

---

## 📊 Statistiques possibles (futures)

- Taux de réussite global d'un test
- Questions les plus difficiles
- Temps moyen de réponse
- Compatibilité moyenne entre utilisateurs
- Suggestions "Vous pourriez aussi vous entendre avec..."

---

## ✅ Checklist finale

- [x] Types TypeScript complets
- [x] 4 routes API backend fonctionnelles
- [x] Composant création de test (AffinityTestBuilder)
- [x] Composant passage de test (AffinityTestModal)
- [x] Composant validation manuelle (AffinityPendingPanel)
- [x] Composant popup profil (UserProfilePopup)
- [ ] Intégration dans Header (notifications)
- [ ] Intégration dans GraphView (marker click)
- [ ] Tests end-to-end complets

---

## 🎓 Concepts clés à retenir

1. **Sécurité**: Les réponses correctes ne sont JAMAIS envoyées au client
2. **Performance**: Score calculé côté serveur, pas de manipulation client
3. **UX**: Feedback immédiat (auto-approved) ou attente claire (manual-review)
4. **Blocage intelligent**: 2 semaines pour éviter le spam, mais permet l'évolution
5. **Flexibilité**: Mix QCM/VraiFaux/Ouvertes selon besoin
6. **Scalabilité**: Collections séparées, indexes optimisés

**Le système est prêt à être utilisé ! 🚀**
