/**
 * API Friendships - Gestion des amitiés
 * POST /api/friendships - Créer une amitié
 * GET /api/friendships - Récupérer les amitiés (avec filtres)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { Friendship } from '@/lib/types';

/**
 * POST /api/friendships - Créer une amitié
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId1, userId2, status = 'accepted' } = body;

    // Validation
    if (!userId1 || !userId2) {
      return NextResponse.json({
        status: 'error',
        message: 'Champs requis: userId1, userId2'
      }, { status: 400 });
    }

    if (userId1 === userId2) {
      return NextResponse.json({
        status: 'error',
        message: 'Un utilisateur ne peut pas être ami avec lui-même'
      }, { status: 400 });
    }

    // Vérifier que les deux utilisateurs existent
    const user1 = await db.collection('users').doc(userId1).get();
    const user2 = await db.collection('users').doc(userId2).get();

    if (!user1.exists || !user2.exists) {
      return NextResponse.json({
        status: 'error',
        message: 'Un ou plusieurs utilisateurs n\'existent pas'
      }, { status: 404 });
    }

    // Vérifier si l'amitié existe déjà
    const existingFriendship1 = await db.collection('friendships')
      .where('userId1', '==', userId1)
      .where('userId2', '==', userId2)
      .get();

    const existingFriendship2 = await db.collection('friendships')
      .where('userId1', '==', userId2)
      .where('userId2', '==', userId1)
      .get();

    if (!existingFriendship1.empty || !existingFriendship2.empty) {
      return NextResponse.json({
        status: 'error',
        message: 'Cette amitié existe déjà'
      }, { status: 409 });
    }

    // Créer l'amitié
    const newFriendship: Partial<Friendship> = {
      userId1,
      userId2,
      status,
      createdAt: new Date(),
    };

    const docRef = await db.collection('friendships').add(newFriendship);

    // Mettre à jour les compteurs d'amis
    if (status === 'accepted') {
      await db.collection('users').doc(userId1).update({
        friendCount: (user1.data()?.friendCount || 0) + 1
      });
      await db.collection('users').doc(userId2).update({
        friendCount: (user2.data()?.friendCount || 0) + 1
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Amitié créée avec succès',
      data: {
        id: docRef.id,
        ...newFriendship
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating friendship:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la création de l\'amitié'
    }, { status: 500 });
  }
}

/**
 * GET /api/friendships - Récupérer les amitiés
 * Query params: userId, status, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query: any = db.collection('friendships');

    // Filtres
    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    let friendships = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrer par userId (userId1 OU userId2)
    if (userId) {
      friendships = friendships.filter((f: any) => 
        f.userId1 === userId || f.userId2 === userId
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        friendships,
        count: friendships.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching friendships:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la récupération des amitiés'
    }, { status: 500 });
  }
}
