/**
 * API Friendships - Opérations sur une amitié spécifique
 * GET /api/friendships/[id] - Récupérer une amitié
 * PUT /api/friendships/[id] - Modifier le statut d'une amitié
 * DELETE /api/friendships/[id] - Supprimer une amitié
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

/**
 * GET /api/friendships/[id] - Récupérer une amitié
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const doc = await db.collection('friendships').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({
        status: 'error',
        message: 'Amitié non trouvée'
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      data: {
        id: doc.id,
        ...doc.data()
      }
    });

  } catch (error: any) {
    console.error('Error fetching friendship:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la récupération de l\'amitié'
    }, { status: 500 });
  }
}

/**
 * PUT /api/friendships/[id] - Modifier le statut d'une amitié
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json({
        status: 'error',
        message: 'Statut invalide. Valeurs acceptées: pending, accepted, rejected'
      }, { status: 400 });
    }

    const doc = await db.collection('friendships').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({
        status: 'error',
        message: 'Amitié non trouvée'
      }, { status: 404 });
    }

    const oldStatus = doc.data()?.status;
    
    // Mettre à jour le statut
    await db.collection('friendships').doc(id).update({ status });

    // Mettre à jour les compteurs si nécessaire
    const { userId1, userId2 } = doc.data() as any;
    
    if (oldStatus !== 'accepted' && status === 'accepted') {
      // Acceptation : incrémenter les compteurs
      await db.collection('users').doc(userId1).update({
        friendCount: (await db.collection('users').doc(userId1).get()).data()?.friendCount || 0 + 1
      });
      await db.collection('users').doc(userId2).update({
        friendCount: (await db.collection('users').doc(userId2).get()).data()?.friendCount || 0 + 1
      });
    } else if (oldStatus === 'accepted' && status !== 'accepted') {
      // Rejet/Annulation : décrémenter les compteurs
      await db.collection('users').doc(userId1).update({
        friendCount: Math.max(0, (await db.collection('users').doc(userId1).get()).data()?.friendCount || 0 - 1)
      });
      await db.collection('users').doc(userId2).update({
        friendCount: Math.max(0, (await db.collection('users').doc(userId2).get()).data()?.friendCount || 0 - 1)
      });
    }

    const updatedDoc = await db.collection('friendships').doc(id).get();

    return NextResponse.json({
      status: 'success',
      message: 'Statut de l\'amitié modifié avec succès',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });

  } catch (error: any) {
    console.error('Error updating friendship:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la modification de l\'amitié'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/friendships/[id] - Supprimer une amitié
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const doc = await db.collection('friendships').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({
        status: 'error',
        message: 'Amitié non trouvée'
      }, { status: 404 });
    }

    const { userId1, userId2, status } = doc.data() as any;

    // Décrémenter les compteurs si l'amitié était acceptée
    if (status === 'accepted') {
      const user1Doc = await db.collection('users').doc(userId1).get();
      const user2Doc = await db.collection('users').doc(userId2).get();

      await db.collection('users').doc(userId1).update({
        friendCount: Math.max(0, (user1Doc.data()?.friendCount || 0) - 1)
      });
      await db.collection('users').doc(userId2).update({
        friendCount: Math.max(0, (user2Doc.data()?.friendCount || 0) - 1)
      });
    }

    // Supprimer l'amitié
    await db.collection('friendships').doc(id).delete();

    return NextResponse.json({
      status: 'success',
      message: 'Amitié supprimée avec succès',
      data: {
        deletedFriendshipId: id,
        userId1,
        userId2
      }
    });

  } catch (error: any) {
    console.error('Error deleting friendship:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la suppression de l\'amitié'
    }, { status: 500 });
  }
}
