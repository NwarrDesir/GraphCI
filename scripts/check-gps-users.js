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

// Coordonnées limites de la Côte d'Ivoire
const CI_BOUNDS = {
  latMin: 4.0,
  latMax: 11.0,
  lonMin: -9.0,
  lonMax: -2.0
};

async function findOutOfBoundsUsers() {
  console.log('\n🔍 Recherche des utilisateurs hors de la Côte d\'Ivoire...\n');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    
    let foundIssues = false;
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const lat = data.lat;
      const lon = data.lon;
      
      // Vérifier si les coordonnées sont hors limites
      if (lat < CI_BOUNDS.latMin || lat > CI_BOUNDS.latMax || 
          lon < CI_BOUNDS.lonMin || lon > CI_BOUNDS.lonMax) {
        
        foundIssues = true;
        console.log('🚨 UTILISATEUR HORS CÔTE D\'IVOIRE DÉTECTÉ:');
        console.log('─────────────────────────────────────────');
        console.log(`📍 ID Firebase    : ${doc.id}`);
        console.log(`🆔 ID Unique      : ${data.idUnique || 'N/A'}`);
        console.log(`👤 Nom            : ${data.nom || data.name || 'N/A'}`);
        console.log(`🌍 Latitude       : ${lat}`);
        console.log(`🌍 Longitude      : ${lon}`);
        console.log(`🏘️  Commune        : ${data.commune || 'N/A'}`);
        console.log(`📧 Email          : ${data.email || 'N/A'}`);
        console.log(`🔢 Âge            : ${data.age || 'N/A'}`);
        console.log(`🚩 Nationalité    : ${data.nationality || 'N/A'}`);
        console.log(`✅ Test Account   : ${data.isTestAccount ? 'Oui' : 'Non'}`);
        console.log('─────────────────────────────────────────\n');
        
        // Calculer la distance approximative du centre de la CI
        const centerLat = 7.5;
        const centerLon = -5.5;
        const distance = Math.sqrt(
          Math.pow((lat - centerLat) * 111, 2) + 
          Math.pow((lon - centerLon) * 111 * Math.cos(centerLat * Math.PI / 180), 2)
        );
        console.log(`📏 Distance du centre CI : ~${Math.round(distance)} km\n`);
      }
    });
    
    if (!foundIssues) {
      console.log('✅ Aucun utilisateur hors de la Côte d\'Ivoire trouvé.\n');
    } else {
      console.log('\n💡 Pour supprimer un utilisateur, utilise:');
      console.log('   node scripts/delete-user.js <ID_FIREBASE>\n');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
  
  process.exit(0);
}

findOutOfBoundsUsers();
