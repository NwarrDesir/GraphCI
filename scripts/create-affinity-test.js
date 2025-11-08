/**
 * Script pour créer un test d'affinité pour un utilisateur
 * Usage: node scripts/create-affinity-test.js <userId>
 * 
 * Ce script crée un test d'affinité professionnel avec:
 * - 3 questions QCM
 * - 2 questions Vrai/Faux
 * - 1 question ouverte
 * - Score minimum: 70%
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialiser Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Fonction pour créer un test d'affinité
async function createAffinityTest(userId) {
  try {
    console.log(`\n📝 Création d'un test d'affinité pour l'utilisateur: ${userId}`);
    
    // Vérifier si l'utilisateur existe
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`Utilisateur ${userId} introuvable`);
    }
    
    const userData = userDoc.data();
    console.log(`✓ Utilisateur trouvé: ${userData.displayName || userData.idUnique}`);
    
    // Questions du test
    const questions = [
      // QCM 1
      {
        id: 'q1',
        type: 'qcm',
        question: 'Quelle est votre activité préférée le week-end ?',
        options: [
          'Sport et activités en plein air',
          'Sorties culturelles (musées, cinéma)',
          'Moments en famille ou entre amis',
          'Repos et détente à la maison'
        ],
        correctAnswerIndex: 2 // "Moments en famille ou entre amis"
      },
      // QCM 2
      {
        id: 'q2',
        type: 'qcm',
        question: 'Quel type de musique écoutez-vous le plus souvent ?',
        options: [
          'Pop/Rock international',
          'Hip-hop/Rap',
          'Musique traditionnelle ou locale',
          'Jazz/Classique'
        ],
        correctAnswerIndex: 1 // "Hip-hop/Rap"
      },
      // QCM 3
      {
        id: 'q3',
        type: 'qcm',
        question: 'Comment décririez-vous votre personnalité ?',
        options: [
          'Extraverti et sociable',
          'Réfléchi et calme',
          'Aventurier et spontané',
          'Organisé et méthodique'
        ],
        correctAnswerIndex: 0 // "Extraverti et sociable"
      },
      // Vrai/Faux 1
      {
        id: 'q4',
        type: 'vrai-faux',
        question: 'J\'aime découvrir de nouveaux restaurants et cuisines',
        correctAnswer: true
      },
      // Vrai/Faux 2
      {
        id: 'q5',
        type: 'vrai-faux',
        question: 'Je préfère passer du temps seul(e) plutôt qu\'en groupe',
        correctAnswer: false
      },
      // Question ouverte
      {
        id: 'q6',
        type: 'ouverte',
        question: 'Décrivez en quelques mots ce qui est le plus important pour vous dans une amitié.'
      }
    ];
    
    // Créer le test
    const testData = {
      userId: userId,
      title: 'Mon test d\'affinité',
      description: 'Réponds à ces questions pour voir si on est compatibles !',
      questions: questions,
      minimumScore: 70,
      hasOpenQuestions: true,
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      stats: {
        totalAttempts: 0,
        totalSuccess: 0,
        totalFailed: 0,
        totalPending: 0
      }
    };
    
    // Vérifier s'il existe déjà un test actif
    const existingTests = await db.collection('affinityTests')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();
    
    if (!existingTests.empty) {
      console.log('⚠️  Un test actif existe déjà. Mise à jour...');
      const testId = existingTests.docs[0].id;
      await db.collection('affinityTests').doc(testId).update({
        ...testData,
        updatedAt: admin.firestore.Timestamp.now()
      });
      console.log(`✅ Test mis à jour avec succès (ID: ${testId})`);
    } else {
      const docRef = await db.collection('affinityTests').add(testData);
      console.log(`✅ Test créé avec succès (ID: ${docRef.id})`);
    }
    
    console.log(`\n📊 Détails du test:`);
    console.log(`   - Questions QCM: 3`);
    console.log(`   - Questions Vrai/Faux: 2`);
    console.log(`   - Questions ouvertes: 1`);
    console.log(`   - Score minimum: ${testData.minimumScore}%`);
    console.log(`   - Validation: Automatique + Manuelle (questions ouvertes)\n`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du test:', error.message);
    throw error;
  }
}

// Script principal
async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('\n❌ Usage: node scripts/create-affinity-test.js <userId>\n');
    console.log('Exemple: node scripts/create-affinity-test.js VZvI4CfkStRC77Yn9qTYj1mHnWU2\n');
    process.exit(1);
  }
  
  try {
    await createAffinityTest(userId);
    console.log('✅ Script terminé avec succès\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Le script a échoué\n');
    process.exit(1);
  }
}

main();
