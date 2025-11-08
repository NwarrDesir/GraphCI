/**
 * Script pour créer un compte de test Firebase
 * Usage: node scripts/create-test-account.js
 */

const admin = require('firebase-admin');

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

// Initialiser Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createTestAccount(username, role) {
  console.log('🔧 Création du compte de test...\n');

  // Générer des données uniques basées sur le username
  const testEmail = `${username}@graphci.dev`;
  const testPassword = 'GraphCI2025!';
  const testIdUnique = `CI-${role.toUpperCase()}-${username.toUpperCase()}`;
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  try {
    // 1. Créer l'utilisateur Firebase Auth
    console.log('📧 Création de l\'authentification Firebase...');
    let userRecord;
    
    try {
      userRecord = await auth.getUserByEmail(testEmail);
      console.log('✅ Compte Firebase Auth existe déjà');
    } catch (error) {
      userRecord = await auth.createUser({
        email: testEmail,
        password: testPassword,
        displayName: displayName,
        emailVerified: true, // Pré-vérifié
      });
      console.log('✅ Compte Firebase Auth créé:', userRecord.uid);
    }

    // 2. Créer le profil Firestore
    console.log('\n📄 Création du profil Firestore...');
    const userDoc = db.collection('users').doc(userRecord.uid);
    const userSnapshot = await userDoc.get();

    if (userSnapshot.exists) {
      console.log('✅ Profil Firestore existe déjà');
    } else {
      // Générer une position aléatoire autour d'Abidjan
      const baseCommunes = [
        { name: 'Cocody', lat: 5.3600, lon: -4.0083 },
        { name: 'Plateau', lat: 5.3264, lon: -4.0267 },
        { name: 'Yopougon', lat: 5.3364, lon: -4.0889 },
        { name: 'Adjamé', lat: 5.3536, lon: -4.0208 },
        { name: 'Marcory', lat: 5.2856, lon: -3.9833 }
      ];
      const randomCommune = baseCommunes[Math.floor(Math.random() * baseCommunes.length)];
      
      await userDoc.set({
        idUnique: testIdUnique,
        email: testEmail,
        displayName: displayName,
        nationality: 'Ivoirienne',
        age: 20 + Math.floor(Math.random() * 30),
        lat: randomCommune.lat + (Math.random() - 0.5) * 0.02,
        lon: randomCommune.lon + (Math.random() - 0.5) * 0.02,
        commune: randomCommune.name,
        departement: 'Abidjan',
        region: 'Abidjan',
        friendCount: 0,
        showRealName: false,
        showLocation: true,
        createdAt: admin.firestore.Timestamp.now(),
        lastActive: admin.firestore.Timestamp.now(),
        isTestAccount: true, // Marqueur spécial
      });
      console.log('✅ Profil Firestore créé');
    }

    console.log('\n🎉 COMPTE DE TEST PRÊT !\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email    : ${testEmail}`);
    console.log(`🔑 Password : ${testPassword}`);
    console.log(`🆔 UID      : ${userRecord.uid}`);
    console.log(`🆔 ID Unique: ${testIdUnique}`);
    console.log(`� Nom      : ${displayName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Récupérer les arguments
const username = process.argv[2];
const role = process.argv[3] || 'vendeur';

if (!username) {
  console.error('\n❌ Usage: node scripts/create-test-account.js <username> [role]\n');
  console.log('Exemples:');
  console.log('  node scripts/create-test-account.js alice vendeur');
  console.log('  node scripts/create-test-account.js bob client\n');
  process.exit(1);
}

createTestAccount(username, role);
