import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';
import { isCodeExpired } from '@/lib/utils/userUtils';

/**
 * POST /api/friends/use-code
 * 
 * Route PROTÉGÉE
 * 
 * Utilise un code d'amitié pour créer un lien
 * - Vérifie validité (non expiré, non utilisé)
 * - Crée la friendship dans Firestore
 * - Marque le code comme utilisé
 * - Incrémente friendCount des deux users
 * 
 * Body:
 * {
 *   code: string (6 chiffres)
 * }
 */
export async function POST(request: Request) {
  try {
    // Authentification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token manquant' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Récupérer le code
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code requis' },
        { status: 400 }
      );
    }

    // Chercher le code
    const codeSnapshot = await db.collection('friendCodes')
      .where('code', '==', code)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (codeSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Code invalide ou déjà utilisé' },
        { status: 404 }
      );
    }

    const codeDoc = codeSnapshot.docs[0];
    const codeData = codeDoc.data();

    // Vérifier expiration
    if (isCodeExpired(codeData.expiresAt.toDate())) {
      await codeDoc.ref.update({ used: true });
      return NextResponse.json(
        { success: false, error: 'Code expiré' },
        { status: 410 }
      );
    }

    // Vérifier que ce n'est pas son propre code
    if (codeData.creatorId === userId) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas utiliser votre propre code' },
        { status: 400 }
      );
    }

    const friendId = codeData.creatorId;

    // Vérifier si l'amitié existe déjà
    const existingFriendship = await db.collection('friendships')
      .where('participants', 'array-contains', userId)
      .get();

    const alreadyFriends = existingFriendship.docs.some(doc => {
      const participants = doc.data().participants;
      return participants.includes(friendId);
    });

    if (alreadyFriends) {
      return NextResponse.json(
        { success: false, error: 'Vous êtes déjà amis' },
        { status: 409 }
      );
    }

    // Créer l'amitié
    const friendshipData = {
      participants: [userId, friendId],
      user1: userId,
      user2: friendId,
      createdAt: new Date(),
      createdVia: 'friend-code',
    };

    const friendshipRef = await db.collection('friendships').add(friendshipData);

    // Marquer le code comme utilisé
    await codeDoc.ref.update({ 
      used: true,
      usedBy: userId,
      usedAt: new Date(),
    });

    // Incrémenter friendCount des deux utilisateurs
    const batch = db.batch();
    const user1Ref = db.collection('users').doc(userId);
    const user2Ref = db.collection('users').doc(friendId);

    batch.update(user1Ref, { 
      friendCount: (await user1Ref.get()).data()?.friendCount || 0 + 1 
    });
    batch.update(user2Ref, { 
      friendCount: (await user2Ref.get()).data()?.friendCount || 0 + 1 
    });

    await batch.commit();

    // Récupérer les infos du nouvel ami
    const friendDoc = await db.collection('users').doc(friendId).get();
    const friendData = friendDoc.data()!;

    return NextResponse.json({
      success: true,
      data: {
        friendshipId: friendshipRef.id,
        friend: {
          id: friendId,
          idUnique: friendData.idUnique,
          displayName: friendData.displayName,
          nationality: friendData.nationality,
        },
      },
    });

  } catch (error: any) {
    console.error('Error using friend code:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'utilisation du code',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
