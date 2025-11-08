# Scripts de Test - Système d'Affinité

## Vue d'ensemble

Ces scripts permettent de tester le système d'affinité en créant des tests et en soumettant des réponses directement dans Firestore.

## Prérequis

- Firebase Admin SDK configuré
- `serviceAccountKey.json` dans le dossier racine
- Node.js installé

## Scripts disponibles

### 1. `create-affinity-test.js`

Crée un test d'affinité complet pour un utilisateur.

**Usage:**
```bash
node scripts/create-affinity-test.js <userId>
```

**Exemple:**
```bash
node scripts/create-affinity-test.js VZvI4CfkStRC77Yn9qTYj1mHnWU2
```

**Ce que fait le script:**
- Crée un test avec 6 questions (3 QCM, 2 Vrai/Faux, 1 ouverte)
- Score minimum: 70%
- Validation: Automatique + Manuelle (question ouverte)
- Met à jour le test s'il existe déjà

**Questions créées:**
1. QCM: Activité préférée le week-end
2. QCM: Type de musique
3. QCM: Description de personnalité
4. Vrai/Faux: Découvrir de nouveaux restaurants
5. Vrai/Faux: Préférence temps seul vs groupe
6. Ouverte: Ce qui est important dans une amitié

---

### 2. `submit-test-answers.js`

Soumet des réponses au test d'affinité d'un utilisateur.

**Usage:**
```bash
node scripts/submit-test-answers.js <fromUserId> <toUserId> [--pass|--fail]
```

**Exemples:**
```bash
# Soumettre avec réponses correctes (passera le test)
node scripts/submit-test-answers.js USER1_ID USER2_ID --pass

# Soumettre avec réponses incorrectes (échouera le test)
node scripts/submit-test-answers.js USER1_ID USER2_ID --fail
```

**Ce que fait le script:**
- Récupère le test actif de `toUserId`
- Génère des réponses (correctes ou incorrectes selon `--pass/--fail`)
- Calcule le score automatique
- Crée la demande d'ami dans `affinityFriendRequests`
- Met à jour les stats du test
- **Si auto-approved:** Crée l'amitié immédiatement
- **Si rejected-auto:** Crée un blocage de 2 semaines

**Scénarios testés:**
- ✅ **Auto-approved**: Score ≥ 70% + pas de questions ouvertes
- ⏳ **Manual-review**: Score ≥ 70% + questions ouvertes présentes
- ❌ **Rejected-auto**: Score < 70% + blocage de 2 semaines

---

## Scénarios de test complets

### Scénario 1: Test avec auto-approval

```bash
# 1. Créer le compte test1
node scripts/create-test-account.js test1 vendeur1

# 2. Créer un test SANS question ouverte pour test1
# (Modifier le script pour retirer la question ouverte)
node scripts/create-affinity-test.js <TEST1_UID>

# 3. Créer le compte test2
node scripts/create-test-account.js test2 vendeur2

# 4. test2 répond au test de test1 avec bonnes réponses
node scripts/submit-test-answers.js <TEST2_UID> <TEST1_UID> --pass

# 5. Vérifier que l'amitié a été créée automatiquement
# Résultat attendu: Amitié dans collection 'friendships', friendCount incrémenté
```

### Scénario 2: Test avec validation manuelle

```bash
# 1. Créer un test AVEC question ouverte (par défaut)
node scripts/create-affinity-test.js <USER1_UID>

# 2. USER2 répond avec bonnes réponses
node scripts/submit-test-answers.js <USER2_UID> <USER1_UID> --pass

# 3. Vérifier la demande en attente
# Résultat attendu: Status 'manual-review' dans affinityFriendRequests

# 4. USER1 valide manuellement via l'interface
# OU utiliser l'API: POST /api/affinity/validate
```

### Scénario 3: Test échoué avec blocage

```bash
# 1. Créer un test
node scripts/create-affinity-test.js <USER1_UID>

# 2. USER2 répond avec mauvaises réponses
node scripts/submit-test-answers.js <USER2_UID> <USER1_UID> --fail

# 3. Vérifier le blocage
# Résultat attendu: 
# - Status 'rejected-auto' dans affinityFriendRequests
# - Blocage de 2 semaines dans affinityRequestBlocks
# - stats.totalFailed incrémenté
```

---

## Vérification dans Firestore

Après avoir exécuté les scripts, vérifier dans Firebase Console:

### Collection `affinityTests`
```javascript
{
  userId: "...",
  title: "Mon test d'affinité",
  questions: [...],
  minimumScore: 70,
  hasOpenQuestions: true,
  isActive: true,
  stats: {
    totalAttempts: 0,
    totalSuccess: 0,
    totalFailed: 0,
    totalPending: 0
  }
}
```

### Collection `affinityFriendRequests`
```javascript
{
  from: "USER2_UID",
  to: "USER1_UID",
  testId: "...",
  answers: [...],
  status: "manual-review" | "auto-approved" | "rejected-auto",
  autoScore: 80,
  autoScorePassed: true,
  createdAt: Timestamp
}
```

### Collection `friendships` (si auto-approved)
```javascript
{
  userId: "USER1_UID",
  friendId: "USER2_UID",
  createdAt: Timestamp,
  affinityRequestId: "..."
}
```

### Collection `affinityRequestBlocks` (si rejected)
```javascript
{
  from: "USER2_UID",
  to: "USER1_UID",
  testId: "...",
  requestId: "...",
  blockedUntil: Timestamp (now + 14 days),
  reason: "auto-rejected-low-score",
  createdAt: Timestamp
}
```

---

## Dépannage

**Erreur: "serviceAccountKey.json not found"**
- Télécharger la clé depuis Firebase Console → Project Settings → Service Accounts
- Placer le fichier `serviceAccountKey.json` à la racine du projet

**Erreur: "Utilisateur introuvable"**
- Vérifier que l'UID est correct
- Créer l'utilisateur avec: `node scripts/create-test-account.js`

**Erreur: "Aucun test actif trouvé"**
- Créer un test avec: `node scripts/create-affinity-test.js <userId>`

**Les emojis console (✅, ❌, etc.) ne s'affichent pas**
- Normal sous Windows PowerShell
- Utiliser Windows Terminal ou ignorer les symboles

---

## Intégration avec l'API

Ces scripts reproduisent exactement le comportement des API routes:

- `create-affinity-test.js` → `POST /api/affinity/test`
- `submit-test-answers.js` → `POST /api/affinity/submit`

Les scripts peuvent être utilisés pour:
- ✅ Tests automatisés
- ✅ Populate la base avec des données réalistes
- ✅ Debugging du système d'affinité
- ✅ Validation des règles métier

---

## Prochaines étapes

Une fois les tests créés avec ces scripts:

1. **Tester l'interface**: Ouvrir l'app et cliquer sur un marker
2. **Vérifier les notifications**: Badge dans le Header
3. **Valider manuellement**: Panel de validation dans l'interface
4. **Tester les blocages**: Essayer de resoumettre après échec

Le système devrait fonctionner de bout en bout avec ces données réelles.
