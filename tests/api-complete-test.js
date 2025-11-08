/**
 * ========================================
 * 🧪 TESTS API COMPLETS - GraphCI
 * ========================================
 * Tests d'intégration pour toutes les routes API
 */

const BASE_URL = 'http://localhost:3003';
const DEV_API_KEY = 'graphci-dev-secret-2025-change-in-production';

// Codes couleur pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Variables pour stocker les IDs créés
let testUserId1 = null;
let testUserId2 = null;
let testFriendshipId = null;

/**
 * Test 1: Créer un utilisateur
 */
async function testCreateUser() {
  log('\n📝 Test 1: POST /api/users - Créer un utilisateur', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DEV_API_KEY,
      },
      body: JSON.stringify({
        email: `test1_${Date.now()}@example.com`,
        displayName: 'Test User 1',
        nationality: 'Ivoirien',
        age: 25,
        lat: 5.3600,
        lon: -4.0083,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      testUserId1 = data.data.id;
      logSuccess(`Utilisateur créé: ${data.data.ciId} (ID: ${testUserId1})`);
      logInfo(`Email: ${data.data.email}`);
      return true;
    } else {
      logError(`Échec: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Créer un second utilisateur
 */
async function testCreateUser2() {
  log('\n📝 Test 2: POST /api/users - Créer un second utilisateur', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DEV_API_KEY,
      },
      body: JSON.stringify({
        email: `test2_${Date.now()}@example.com`,
        displayName: 'Test User 2',
        nationality: 'Ivoirien',
        age: 28,
        lat: 5.3650,
        lon: -4.0100,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      testUserId2 = data.data.id;
      logSuccess(`Utilisateur créé: ${data.data.ciId} (ID: ${testUserId2})`);
      return true;
    } else {
      logError(`Échec: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Récupérer un utilisateur par ID
 */
async function testGetUser() {
  log('\n📝 Test 3: GET /api/users/[id] - Récupérer un utilisateur', 'blue');
  
  if (!testUserId1) {
    logWarning('Test ignoré: aucun utilisateur créé');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/users/${testUserId1}`, {
      headers: {
        'x-api-key': DEV_API_KEY,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      logSuccess(`Utilisateur récupéré: ${data.data.displayName}`);
      logInfo(`Nationalité: ${data.data.nationality}, Age: ${data.data.age}`);
      return true;
    } else {
      logError(`Échec: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Modifier un utilisateur
 */
async function testUpdateUser() {
  log('\n📝 Test 4: PUT /api/users/[id] - Modifier un utilisateur', 'blue');
  
  if (!testUserId1) {
    logWarning('Test ignoré: aucun utilisateur créé');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/users/${testUserId1}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DEV_API_KEY,
      },
      body: JSON.stringify({
        age: 26,
        displayName: 'Test User 1 (Modifié)',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      logSuccess(`Utilisateur modifié: ${data.data.displayName}`);
      logInfo(`Nouvel âge: ${data.data.age}`);
      return true;
    } else {
      logError(`Échec: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Lister tous les utilisateurs
 */
async function testListUsers() {
  log('\n📝 Test 5: GET /api/users - Lister tous les utilisateurs', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users?limit=10`, {
      headers: {
        'x-api-key': DEV_API_KEY,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      logSuccess(`${data.data.count} utilisateurs récupérés`);
      if (data.data.users.length > 0) {
        logInfo(`Premier utilisateur: ${data.data.users[0].displayName}`);
      }
      return true;
    } else {
      logError(`Échec: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Créer une amitié
 */
async function testCreateFriendship() {
  log('\n📝 Test 6: POST /api/friendships - Créer une amitié', 'blue');
  
  if (!testUserId1 || !testUserId2) {
    logWarning('Test ignoré: utilisateurs manquants');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/friendships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DEV_API_KEY,
      },
      body: JSON.stringify({
        userId1: testUserId1,
        userId2: testUserId2,
        status: 'accepted',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      testFriendshipId = data.data.id;
      logSuccess(`Amitié créée (ID: ${testFriendshipId})`);
      logInfo(`Entre: ${data.data.userId1} ↔ ${data.data.userId2}`);
      return true;
    } else {
      logError(`Échec: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Récupérer les amitiés d'un utilisateur
 */
async function testGetUserFriendships() {
  log('\n📝 Test 7: GET /api/friendships?userId=[id] - Récupérer les amitiés', 'blue');
  
  if (!testUserId1) {
    logWarning('Test ignoré: aucun utilisateur créé');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/friendships?userId=${testUserId1}`, {
      headers: {
        'x-api-key': DEV_API_KEY,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      logSuccess(`${data.data.count} amitié(s) trouvée(s) pour l'utilisateur`);
      return true;
    } else {
      logError(`Échec: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 8: Supprimer l'amitié
 */
async function testDeleteFriendship() {
  log('\n📝 Test 8: DELETE /api/friendships/[id] - Supprimer une amitié', 'blue');
  
  if (!testFriendshipId) {
    logWarning('Test ignoré: aucune amitié créée');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/friendships/${testFriendshipId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': DEV_API_KEY,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      logSuccess(`Amitié supprimée (ID: ${testFriendshipId})`);
      return true;
    } else {
      logError(`Échec: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 9: Supprimer les utilisateurs de test
 */
async function testDeleteUsers() {
  log('\n📝 Test 9: DELETE /api/users/[id] - Supprimer les utilisateurs de test', 'blue');
  
  let success = true;

  if (testUserId1) {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${testUserId1}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': DEV_API_KEY,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        logSuccess(`Utilisateur 1 supprimé (ID: ${testUserId1})`);
      } else {
        logError(`Échec suppression user 1: ${data.message}`);
        success = false;
      }
    } catch (error) {
      logError(`Erreur suppression user 1: ${error.message}`);
      success = false;
    }
  }

  if (testUserId2) {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${testUserId2}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': DEV_API_KEY,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        logSuccess(`Utilisateur 2 supprimé (ID: ${testUserId2})`);
      } else {
        logError(`Échec suppression user 2: ${data.message}`);
        success = false;
      }
    } catch (error) {
      logError(`Erreur suppression user 2: ${error.message}`);
      success = false;
    }
  }

  return success;
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
  log('========================================', 'cyan');
  log('🧪 TESTS API COMPLETS - GraphCI', 'cyan');
  log('========================================', 'cyan');
  log(`Base URL: ${BASE_URL}\n`, 'yellow');

  const results = [];

  // Tests utilisateurs
  results.push(await testCreateUser());
  results.push(await testCreateUser2());
  results.push(await testGetUser());
  results.push(await testUpdateUser());
  results.push(await testListUsers());

  // Tests amitiés
  results.push(await testCreateFriendship());
  results.push(await testGetUserFriendships());
  results.push(await testDeleteFriendship());

  // Nettoyage
  results.push(await testDeleteUsers());

  // Résumé
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log('\n========================================', 'cyan');
  log('📊 RÉSUMÉ DES TESTS', 'cyan');
  log('========================================', 'cyan');
  log(`Tests réussis: ${passed}/${total}`, passed === total ? 'green' : 'red');
  
  if (passed === total) {
    logSuccess('✅ TOUS LES TESTS SONT PASSÉS !');
  } else {
    logError(`❌ ${total - passed} test(s) ont échoué`);
  }
}

// Lancer les tests
runAllTests().catch(error => {
  logError(`Erreur critique: ${error.message}`);
  process.exit(1);
});
