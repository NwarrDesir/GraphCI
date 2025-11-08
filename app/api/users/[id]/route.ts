/**
 * API Users - Opérations sur un utilisateur spécifique
 * GET /api/users/[id] - Récupérer un utilisateur
 * PUT /api/users/[id] - Modifier un utilisateur
 * DELETE /api/users/[id] - Supprimer un utilisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

/**
 * GET /api/users/[id] - Récupérer un utilisateur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const doc = await db.collection('users').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({
        status: 'error',
        message: 'Utilisateur non trouvé'
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
    console.error('Error fetching user:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la récupération de l\'utilisateur'
    }, { status: 500 });
  }
}

/**
 * PUT /api/users/[id] - Modifier un utilisateur
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Vérifier que l'utilisateur existe
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      }, { status: 404 });
    }

    // Champs modifiables
    const allowedFields = ['displayName', 'nationality', 'age', 'lat', 'lon'];
    const updates: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Aucun champ valide à modifier'
      }, { status: 400 });
    }

    // Mettre à jour
    await db.collection('users').doc(id).update(updates);

    const updatedDoc = await db.collection('users').doc(id).get();

    return NextResponse.json({
      status: 'success',
      message: 'Utilisateur modifié avec succès',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la modification de l\'utilisateur'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[id] - Supprimer un utilisateur
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Vérifier que l'utilisateur existe
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      }, { status: 404 });
    }

    // Supprimer toutes les amitiés liées
    const friendshipsSnapshot = await db.collection('friendships')
      .where('userId1', '==', id)
      .get();
    
    const friendshipsSnapshot2 = await db.collection('friendships')
      .where('userId2', '==', id)
      .get();

    const batch = db.batch();
    friendshipsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    friendshipsSnapshot2.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Supprimer l'utilisateur
    await db.collection('users').doc(id).delete();

    return NextResponse.json({
      status: 'success',
      message: 'Utilisateur supprimé avec succès',
      data: {
        deletedUserId: id,
        deletedFriendships: friendshipsSnapshot.size + friendshipsSnapshot2.size
      }
    });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la suppression de l\'utilisateur'
    }, { status: 500 });
  }
}
