/**
 * Script pour soumettre des réponses à un test d'affinité
 * Usage: node scripts/submit-test-answers.js <fromUserId> <toUserId> [--pass|--fail]
 * 
 * Ce script simule un utilisateur qui répond au test d'affinité d'un autre utilisateur
 * --pass : Réponses correctes pour passer le test
 * --fail : Réponses incorrectes pour échouer le test
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

// Fonction pour soumettre des réponses
async function submitTestAnswers(fromUserId, toUserId, shouldPass = true) {
  try {
    console.log(`\n📝 Soumission de réponses au test de: ${toUserId}`);
    console.log(`   Utilisateur répondant: ${fromUserId}`);
    console.log(`   Mode: ${shouldPass ? 'PASS (réponses correctes)' : 'FAIL (réponses incorrectes)'}\n`);
    
    // Vérifier que les utilisateurs existent
    const [fromUserDoc, toUserDoc] = await Promise.all([
      db.collection('users').doc(fromUserId).get(),
      db.collection('users').doc(toUserId).get()
    ]);
    
    if (!fromUserDoc.exists) throw new Error(`Utilisateur ${fromUserId} introuvable`);
    if (!toUserDoc.exists) throw new Error(`Utilisateur ${toUserId} introuvable`);
    
    const fromUserData = fromUserDoc.data();
    const toUserData = toUserDoc.data();
    
    console.log(`✓ De: ${fromUserData.displayName || fromUserData.idUnique}`);
    console.log(`✓ Pour: ${toUserData.displayName || toUserData.idUnique}`);
    
    // Récupérer le test actif
    const testsSnapshot = await db.collection('affinityTests')
      .where('userId', '==', toUserId)
      .where('isActive', '==', true)
      .get();
    
    if (testsSnapshot.empty) {
      throw new Error(`Aucun test actif trouvé pour l'utilisateur ${toUserId}`);
    }
    
    const testDoc = testsSnapshot.docs[0];
    const test = testDoc.data();
    
    console.log(`✓ Test trouvé: "${test.title}"`);
    console.log(`   Questions: ${test.questions.length}`);
    console.log(`   Score minimum: ${test.minimumScore}%\n`);
    
    // Générer les réponses
    const answers = test.questions.map(q => {
      if (q.type === 'qcm') {
        // Si shouldPass, donner la bonne réponse, sinon une mauvaise
        const answerIndex = shouldPass 
          ? q.correctAnswerIndex 
          : (q.correctAnswerIndex + 1) % q.options.length;
        
        return {
          questionId: q.id,
          type: 'qcm',
          answer: answerIndex,
          correct: shouldPass
        };
      } else if (q.type === 'vrai-faux') {
        // Si shouldPass, donner la bonne réponse, sinon l'inverse
        const answer = shouldPass ? q.correctAnswer : !q.correctAnswer;
        
        return {
          questionId: q.id,
          type: 'vrai-faux',
          answer: answer,
          correct: shouldPass
        };
      } else if (q.type === 'ouverte') {
        // Question ouverte - réponse textuelle
        const responses = shouldPass ? [
          "L'honnêteté et la confiance mutuelle sont essentielles pour moi. J'apprécie les amis sur qui je peux compter.",
          "Pour moi, une bonne amitié repose sur le respect, l'écoute et la bienveillance.",
          "J'aime les relations authentiques où on peut être soi-même sans jugement."
        ] : [
          "Je ne sais pas trop.",
          "Bof, rien de spécial.",
          "Pas grand chose."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return {
          questionId: q.id,
          type: 'ouverte',
          answer: randomResponse,
          needsManualReview: true
        };
      }
    });
    
    // Appeler l'API pour soumettre les réponses
    const requestData = {
      from: fromUserId,
      to: toUserId,
      testId: testDoc.id,
      answers: answers
    };
    
    console.log(`📤 Envoi des réponses à l'API...`);
    
    // Simuler l'appel API en créant directement la demande
    // (Dans un environnement réel, on ferait un fetch vers /api/affinity/submit)
    
    const autoQuestions = answers.filter(a => a.type !== 'ouverte');
    const autoCorrect = autoQuestions.filter(a => a.correct).length;
    const autoScore = autoQuestions.length > 0 ? (autoCorrect / autoQuestions.length) * 100 : 100;
    const autoScorePassed = autoScore >= test.minimumScore;
    
    console.log(`\n📊 Résultats:`);
    console.log(`   Questions auto: ${autoQuestions.length}`);
    console.log(`   Réponses correctes: ${autoCorrect}`);
    console.log(`   Score: ${autoScore.toFixed(0)}%`);
    console.log(`   Seuil minimum: ${test.minimumScore}%`);
    console.log(`   Status: ${autoScorePassed ? '✓ PASSÉ' : '✗ ÉCHOUÉ'}`);
    
    // Déterminer le statut
    let status;
    if (test.hasOpenQuestions) {
      status = autoScorePassed ? 'manual-review' : 'rejected-auto';
    } else {
      status = autoScorePassed ? 'auto-approved' : 'rejected-auto';
    }
    
    console.log(`   Type de validation: ${status}\n`);
    
    // Créer la demande dans Firestore
    const requestRef = await db.collection('affinityFriendRequests').add({
      from: fromUserId,
      to: toUserId,
      testId: testDoc.id,
      answers: answers,
      status: status,
      autoScore: autoScore,
      autoScorePassed: autoScorePassed,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    console.log(`✅ Demande créée (ID: ${requestRef.id})`);
    
    // Mettre à jour les stats du test
    await db.collection('affinityTests').doc(testDoc.id).update({
      'stats.totalAttempts': admin.firestore.FieldValue.increment(1),
      'stats.totalPending': status === 'manual-review' ? admin.firestore.FieldValue.increment(1) : test.stats.totalPending,
      'stats.totalFailed': status === 'rejected-auto' ? admin.firestore.FieldValue.increment(1) : test.stats.totalFailed,
      'stats.totalSuccess': status === 'auto-approved' ? admin.firestore.FieldValue.increment(1) : test.stats.totalSuccess
    });
    
    // Si auto-approved, créer l'amitié
    if (status === 'auto-approved') {
      console.log(`\n🤝 Création de l'amitié...`);
      
      const batch = db.batch();
      
      // Créer la relation d'amitié bidirectionnelle
      const friendship1Ref = db.collection('friendships').doc();
      batch.set(friendship1Ref, {
        userId: fromUserId,
        friendId: toUserId,
        createdAt: admin.firestore.Timestamp.now(),
        affinityRequestId: requestRef.id
      });
      
      const friendship2Ref = db.collection('friendships').doc();
      batch.set(friendship2Ref, {
        userId: toUserId,
        friendId: fromUserId,
        createdAt: admin.firestore.Timestamp.now(),
        affinityRequestId: requestRef.id
      });
      
      // Incrémenter friendCount
      batch.update(db.collection('users').doc(fromUserId), {
        friendCount: admin.firestore.FieldValue.increment(1)
      });
      batch.update(db.collection('users').doc(toUserId), {
        friendCount: admin.firestore.FieldValue.increment(1)
      });
      
      await batch.commit();
      console.log(`✅ Amitié créée automatiquement`);
    }
    
    // Si rejected-auto, créer le blocage de 2 semaines
    if (status === 'rejected-auto') {
      console.log(`\n🚫 Création du blocage de 2 semaines...`);
      
      const blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + 14);
      
      await db.collection('affinityRequestBlocks').add({
        from: fromUserId,
        to: toUserId,
        testId: testDoc.id,
        requestId: requestRef.id,
        blockedUntil: admin.firestore.Timestamp.fromDate(blockedUntil),
        reason: 'auto-rejected-low-score',
        createdAt: admin.firestore.Timestamp.now()
      });
      
      console.log(`✅ Blocage créé jusqu'au ${blockedUntil.toLocaleDateString()}`);
    }
    
    console.log(`\n✅ Soumission terminée avec succès\n`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la soumission:', error.message);
    throw error;
  }
}

// Script principal
async function main() {
  const fromUserId = process.argv[2];
  const toUserId = process.argv[3];
  const mode = process.argv[4];
  
  if (!fromUserId || !toUserId) {
    console.error('\n❌ Usage: node scripts/submit-test-answers.js <fromUserId> <toUserId> [--pass|--fail]\n');
    console.log('Exemple:');
    console.log('  node scripts/submit-test-answers.js USER1 USER2 --pass');
    console.log('  node scripts/submit-test-answers.js USER1 USER2 --fail\n');
    process.exit(1);
  }
  
  const shouldPass = mode !== '--fail';
  
  try {
    await submitTestAnswers(fromUserId, toUserId, shouldPass);
    console.log('✅ Script terminé avec succès\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Le script a échoué\n');
    process.exit(1);
  }
}

main();
