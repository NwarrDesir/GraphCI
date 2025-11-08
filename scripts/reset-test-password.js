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

const testEmail = 'test@graphci.dev';
const newPassword = 'GraphCI2025!';

async function resetTestPassword() {
  console.log('\n🔐 Réinitialisation du mot de passe du compte test...\n');
  
  try {
    // Récupérer l'utilisateur
    const user = await admin.auth().getUserByEmail(testEmail);
    console.log(`✅ Utilisateur trouvé: ${user.uid}`);
    console.log(`📧 Email: ${user.email}`);
    
    // Mettre à jour le mot de passe
    await admin.auth().updateUser(user.uid, {
      password: newPassword,
      emailVerified: true
    });
    
    console.log('\n✅ Mot de passe mis à jour avec succès !');
    console.log('─────────────────────────────────────');
    console.log(`📧 Email    : ${testEmail}`);
    console.log(`🔑 Password : ${newPassword}`);
    console.log('─────────────────────────────────────\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  
  process.exit(0);
}

resetTestPassword();
