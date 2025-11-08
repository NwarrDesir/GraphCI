require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

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

async function checkCommunes() {
  console.log('\n📊 Répartition des utilisateurs par commune:\n');
  
  const snapshot = await db.collection('users').get();
  const communeCount = {};
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const commune = data.commune || 'null/undefined';
    communeCount[commune] = (communeCount[commune] || 0) + 1;
  });
  
  // Trier par nombre d'utilisateurs (décroissant)
  const sorted = Object.entries(communeCount).sort((a, b) => b[1] - a[1]);
  
  sorted.forEach(([commune, count]) => {
    const color = commune === 'null/undefined' ? '⚪' : 
                  commune === 'Cocody' ? '🟠' :
                  commune === 'Inconnue' ? '⚪' : '🟢';
    console.log(`${color} ${commune.padEnd(20)} : ${count} utilisateurs`);
  });
  
  console.log(`\n📈 Total: ${snapshot.size} utilisateurs`);
  
  const withCommune = snapshot.size - (communeCount['null/undefined'] || 0) - (communeCount['Inconnue'] || 0);
  const percentage = ((withCommune / snapshot.size) * 100).toFixed(1);
  console.log(`✅ Avec commune définie: ${withCommune} (${percentage}%)`);
  console.log(`❌ Sans commune: ${snapshot.size - withCommune} (${(100 - percentage).toFixed(1)}%)\n`);
  
  process.exit(0);
}

checkCommunes();
