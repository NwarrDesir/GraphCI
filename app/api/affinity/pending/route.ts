import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { AffinityFriendRequest, User } from '@/lib/types';

/**
 * GET /api/affinity/pending?userId=xxx
 * Récupérer toutes les demandes en attente de validation manuelle pour un utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      );
    }

    // Récupérer toutes les demandes en attente pour cet utilisateur
    const requestsSnapshot = await adminDb
      .collection('affinityFriendRequests')
      .where('to', '==', userId)
      .where('status', '==', 'manual-review')
      .orderBy('createdAt', 'desc')
      .get();

    if (requestsSnapshot.empty) {
      return NextResponse.json({
        requests: [],
        count: 0,
      });
    }

    // Enrichir avec les infos des utilisateurs
    const requests = await Promise.all(
      requestsSnapshot.docs.map(async (doc) => {
        const request = doc.data() as AffinityFriendRequest;
        
        // Récupérer les infos de l'utilisateur qui a fait la demande
        const fromUserDoc = await adminDb
          .collection('users')
          .doc(request.from)
          .get();

        let fromUser: Partial<User> | null = null;
        if (fromUserDoc.exists) {
          const userData = fromUserDoc.data() as User;
          fromUser = {
            id: userData.id,
            idUnique: userData.idUnique,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            commune: userData.commune,
            age: userData.age,
            nationality: userData.nationality,
          };
        }

        // Filtrer seulement les questions ouvertes avec leurs réponses
        const openQuestions = request.answers.filter(
          (answer) => answer.questionType === 'ouverte'
        );

        return {
          id: doc.id,
          from: request.from,
          fromUser,
          testId: request.testId,
          autoScore: request.autoScore,
          autoScorePassed: request.autoScorePassed,
          openQuestions,
          createdAt: request.createdAt,
        };
      })
    );

    console.log(`✅ ${requests.length} demande(s) en attente pour userId ${userId}`);

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/affinity/pending:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
