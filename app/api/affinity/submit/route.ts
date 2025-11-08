import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import {
  AffinityTest,
  AffinityAnswer,
  AffinityFriendRequest,
  AffinityRequestBlock,
  Friendship,
} from '@/lib/types';
import admin from 'firebase-admin';

const Timestamp = admin.firestore.Timestamp;

/**
 * POST /api/affinity/submit
 * Soumettre les réponses au test d'affinité
 * 
 * Body:
 * {
 *   testId: string,
 *   fromUserId: string, // Celui qui répond
 *   toUserId: string, // Propriétaire du test
 *   answers: AffinityAnswer[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, fromUserId, toUserId, answers } = body;

    console.log('📥 Submit request:', { testId, fromUserId, toUserId, answersCount: answers?.length });

    // Validation
    if (!testId || !fromUserId || !toUserId || !answers) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur ne se demande pas en ami lui-même
    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous demander en ami vous-même' },
        { status: 400 }
      );
    }

    // Récupérer le test via le userId du propriétaire (toUserId)
    const testSnapshot = await adminDb
      .collection('affinityTests')
      .where('userId', '==', toUserId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (testSnapshot.empty) {
      return NextResponse.json(
        { error: 'Test non trouvé' },
        { status: 404 }
      );
    }

    const testDoc = testSnapshot.docs[0];
    const test = testDoc.data() as AffinityTest;
    const actualTestId = testDoc.id;
    
    console.log('✅ Test trouvé:', { actualTestId, userId: test.userId, questionsCount: test.questions.length });

    // Vérifier si déjà amis
    const friendshipQuery1 = adminDb
      .collection('friendships')
      .where('userId1', '==', fromUserId)
      .where('userId2', '==', toUserId)
      .where('status', '==', 'accepted');

    const friendshipQuery2 = adminDb
      .collection('friendships')
      .where('userId1', '==', toUserId)
      .where('userId2', '==', fromUserId)
      .where('status', '==', 'accepted');

    const [friendship1, friendship2] = await Promise.all([
      friendshipQuery1.get(),
      friendshipQuery2.get(),
    ]);

    if (!friendship1.empty || !friendship2.empty) {
      return NextResponse.json(
        { error: 'Vous êtes déjà amis', alreadyFriends: true },
        { status: 400 }
      );
    }

    // Vérifier si bloqué temporairement (utiliser actualTestId)
    const now = new Date();
    const blockSnapshot = await adminDb
      .collection('affinityRequestBlocks')
      .where('from', '==', fromUserId)
      .where('to', '==', toUserId)
      .where('testId', '==', actualTestId)
      .get();

    for (const blockDoc of blockSnapshot.docs) {
      const block = blockDoc.data() as AffinityRequestBlock;
      let blockedUntil: Date;
      
      if (block.blockedUntil instanceof admin.firestore.Timestamp) {
        blockedUntil = block.blockedUntil.toDate();
      } else if (block.blockedUntil instanceof Date) {
        blockedUntil = block.blockedUntil;
      } else {
        blockedUntil = new Date(block.blockedUntil as any);
      }

      if (blockedUntil > now) {
        const remainingDays = Math.ceil(
          (blockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return NextResponse.json(
          {
            error: `Vous devez attendre encore ${remainingDays} jour(s) avant de retenter`,
            blocked: true,
            blockedUntil: blockedUntil.toISOString(),
          },
          { status: 403 }
        );
      } else {
        // Bloc expiré, le supprimer
        await adminDb
          .collection('affinityRequestBlocks')
          .doc(blockDoc.id)
          .delete();
      }
    }

    // On a déjà récupéré le test plus haut, pas besoin de le refaire
    // Calculer le score automatique (QCM + Vrai/Faux)
    let autoQuestions = 0;
    let autoCorrect = 0;

    const evaluatedAnswers: AffinityAnswer[] = answers.map(
      (answer: AffinityAnswer) => {
        const question = test.questions.find((q) => q.id === answer.questionId);

        if (!question) {
          return { ...answer, isCorrect: undefined };
        }

        if (question.type === 'qcm') {
          autoQuestions++;
          const isCorrect =
            answer.answerIndex === question.correctAnswerIndex;
          if (isCorrect) autoCorrect++;
          return { ...answer, isCorrect };
        } else if (question.type === 'vrai-faux') {
          autoQuestions++;
          const isCorrect = answer.answerBoolean === question.correctAnswer;
          if (isCorrect) autoCorrect++;
          return { ...answer, isCorrect };
        } else {
          // Question ouverte - pas de correction auto
          return { ...answer, isCorrect: undefined };
        }
      }
    );

    const autoScore = autoQuestions > 0 ? (autoCorrect / autoQuestions) * 100 : 100;
    const autoScorePassed = autoScore >= test.minimumScore;

    console.log(`📊 Score auto: ${autoScore.toFixed(1)}% (${autoCorrect}/${autoQuestions})`);
    console.log(`✅ Seuil requis: ${test.minimumScore}%`);
    console.log(`🎯 Passé: ${autoScorePassed}`);

    // Déterminer le statut
    let status: AffinityFriendRequest['status'];
    let needsManualReview = test.hasOpenQuestions;
    let createFriendship = false;

    if (!test.hasOpenQuestions && autoScorePassed) {
      // Que des questions auto + score suffisant = approbation immédiate
      status = 'auto-approved';
      createFriendship = true;
    } else if (!autoScorePassed) {
      // Score insuffisant = rejet immédiat
      status = 'rejected';

      // Créer un bloc de 2 semaines
      const blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + 14);

      await adminDb.collection('affinityRequestBlocks').add({
        from: fromUserId,
        to: toUserId,
        testId: actualTestId,
        blockedUntil: Timestamp.fromDate(blockedUntil),
        createdAt: Timestamp.now(),
        reason: 'failed-auto',
      });

      console.log(`❌ Score insuffisant - bloqué jusqu'au ${blockedUntil.toISOString()}`);
    } else {
      // Score suffisant + questions ouvertes = en attente de validation manuelle
      status = 'manual-review';
      needsManualReview = true;
    }

    // Créer la demande d'amitié
    const requestData: any = {
      from: fromUserId,
      to: toUserId,
      testId: actualTestId,
      answers: evaluatedAnswers,
      autoScore,
      autoScorePassed,
      needsManualReview,
      manualReviewCompleted: false,
      status,
      createdAt: Timestamp.now(),
    };

    const requestRef = await adminDb
      .collection('affinityFriendRequests')
      .add(requestData);

    console.log(`✅ Demande créée: ${requestRef.id} - Status: ${status}`);

    // Créer l'amitié si approbation immédiate
    if (createFriendship) {
      await createFriendshipLink(fromUserId, toUserId);
    }

    // Mettre à jour les stats du test
    const updates: any = {
      totalAttempts: admin.firestore.FieldValue.increment(1),
    };

    if (status === 'auto-approved') {
      updates.totalSuccess = admin.firestore.FieldValue.increment(1);
    } else if (status === 'manual-review') {
      updates.totalPending = admin.firestore.FieldValue.increment(1);
    }

    await adminDb.collection('affinityTests').doc(testId).update(updates);

    return NextResponse.json({
      success: true,
      requestId: requestRef.id,
      status,
      autoScore: parseFloat(autoScore.toFixed(1)),
      autoScorePassed,
      needsManualReview,
      message:
        status === 'auto-approved'
          ? '🎉 Félicitations ! Vous êtes maintenant amis !'
          : status === 'manual-review'
          ? '⏳ Votre demande est en attente de validation'
          : `❌ Score insuffisant (${autoScore.toFixed(1)}%). Réessayez dans 2 semaines.`,
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/affinity/submit:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Créer un lien d'amitié entre deux utilisateurs
 */
async function createFriendshipLink(userId1: string, userId2: string) {
  try {
    // Ordre alphabétique pour la clé unique
    const [user1, user2] = [userId1, userId2].sort();

    const friendshipData: any = {
      userId1: user1,
      userId2: user2,
      status: 'accepted',
      createdAt: Timestamp.now(),
      acceptedAt: Timestamp.now(),
    };

    await adminDb.collection('friendships').add(friendshipData);

    // Incrémenter le compteur d'amis pour chaque utilisateur
    await Promise.all([
      adminDb
        .collection('users')
        .doc(userId1)
        .update({ friendCount: admin.firestore.FieldValue.increment(1) }),
      adminDb
        .collection('users')
        .doc(userId2)
        .update({ friendCount: admin.firestore.FieldValue.increment(1) }),
    ]);

    console.log(`🤝 Amitié créée: ${user1} <-> ${user2}`);
  } catch (error) {
    console.error('❌ Erreur création amitié:', error);
    throw error;
  }
}
