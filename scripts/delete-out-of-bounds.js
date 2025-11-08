require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

// IDs des utilisateurs hors CI à supprimer
const USERS_TO_DELETE = [
  '1ObrCXzTkMQDEgtrEzng48DHt6I2', // CI-JB5K-6VYW
  'XexolVw15mTKmvDYWEzKTglfYlC2', // CI-Q38A-ZKKT
  'dAw1sxPvcCa9fXwfPlgkwd8yh7j1'  // CI-XD82-YMQ5
];

async function deleteOutOfBoundsUsers() {
  console.log('\n🗑️  Suppression des utilisateurs hors Côte d\'Ivoire...\n');
  
  try {
    for (const userId of USERS_TO_DELETE) {
      console.log(`🔍 Vérification: ${userId}`);
      
      // Récupérer les infos avant suppression
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log(`⚠️  Utilisateur ${userId} n'existe pas.\n`);
        continue;
      }
      
      const userData = userDoc.data();
      console.log(`   ID Unique: ${userData.idUnique}`);
      console.log(`   Position : ${userData.lat}, ${userData.lon}`);
      
      // Supprimer de Firestore
      await db.collection('users').doc(userId).delete();
      console.log(`✅ Supprimé de Firestore`);
      
      // Supprimer également de Firebase Auth si existe
      try {
        await admin.auth().deleteUser(userId);
        console.log(`✅ Supprimé de Firebase Auth`);
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          console.log(`ℹ️  Pas de compte Auth (normal)`);
        } else {
          console.log(`⚠️  Erreur Auth: ${authError.message}`);
        }
      }
      
      console.log('─────────────────────────────────────\n');
    }
    
    console.log('✅ Nettoyage terminé !\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
  
  process.exit(0);
}

deleteOutOfBoundsUsers();
