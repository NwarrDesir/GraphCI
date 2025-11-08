import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { AffinityFriendRequest, AffinityRequestBlock } from '@/lib/types';
import admin from 'firebase-admin';

const Timestamp = admin.firestore.Timestamp;

/**
 * POST /api/affinity/validate
 * Valider ou refuser manuellement une demande d'amitié avec questions ouvertes
 * 
 * Body:
 * {
 *   requestId: string,
 *   userId: string, // Créateur du test (celui qui valide)
 *   decision: 'approved' | 'rejected',
 *   comment?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, userId, decision, comment } = body;

    // Validation
    if (!requestId || !userId || !decision) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json(
        { error: 'Décision invalide (doit être "approved" ou "rejected")' },
        { status: 400 }
      );
    }

    // Récupérer la demande
    const requestDoc = await adminDb
      .collection('affinityFriendRequests')
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data() as AffinityFriendRequest;

    // Vérifier que c'est bien le destinataire qui valide
    if (requestData.to !== userId) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à valider cette demande' },
        { status: 403 }
      );
    }

    // Vérifier que la demande est en attente de validation manuelle
    if (requestData.status !== 'manual-review') {
      return NextResponse.json(
        { error: 'Cette demande n\'est pas en attente de validation' },
        { status: 400 }
      );
    }

    // Mettre à jour la demande
    const updates: any = {
      manualReviewCompleted: true,
      manualReviewDecision: decision,
      reviewedAt: Timestamp.now(),
    };

    if (comment) {
      updates.manualReviewComment = comment;
    }

    let finalStatus: AffinityFriendRequest['status'];
    let message: string;

    if (decision === 'approved') {
      finalStatus = 'approved';
      updates.status = finalStatus;
      updates.approvedAt = Timestamp.now();
      message = 'Demande acceptée - Amitié créée !';

      // Créer l'amitié
      await createFriendshipLink(requestData.from, requestData.to);

      // Mettre à jour les stats du test
      await adminDb
        .collection('affinityTests')
        .doc(requestData.testId)
        .update({
          totalSuccess: admin.firestore.FieldValue.increment(1),
          totalPending: admin.firestore.FieldValue.increment(-1),
        });
    } else {
      finalStatus = 'rejected';
      updates.status = finalStatus;
      message = 'Demande refusée';

      // Créer un bloc de 2 semaines
      const blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + 14);

      await adminDb.collection('affinityRequestBlocks').add({
        from: requestData.from,
        to: requestData.to,
        testId: requestData.testId,
        blockedUntil: Timestamp.fromDate(blockedUntil),
        createdAt: Timestamp.now(),
        reason: 'rejected-manual',
      });

      // Mettre à jour les stats du test
      await adminDb
        .collection('affinityTests')
        .doc(requestData.testId)
        .update({
          totalPending: admin.firestore.FieldValue.increment(-1),
        });

      console.log(`❌ Demande refusée - bloqué jusqu'au ${blockedUntil.toISOString()}`);
    }

    await adminDb
      .collection('affinityFriendRequests')
      .doc(requestId)
      .update(updates);

    console.log(`✅ Validation: ${decision} pour demande ${requestId}`);

    return NextResponse.json({
      success: true,
      decision,
      finalStatus,
      message,
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/affinity/validate:', error);
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
