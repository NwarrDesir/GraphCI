import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';

// Force cette route à être dynamique (pas de pré-rendu statique)
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/me
 * 
 * Route PROTÉGÉE - Nécessite authentification
 * 
 * Retourne les informations complètes de l'utilisateur connecté
 * Permet d'identifier son propre point sur la carte
 * 
 * Header requis: Authorization: Bearer <idToken>
 */
export async function GET(request: Request) {
  try {
    // Extraire le token d'authentification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token d\'authentification manquant' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Vérifier le token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Récupérer le profil utilisateur
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;

    // Récupérer les amis
    const friendshipsSnapshot = await db.collection('friendships')
      .where('participants', 'array-contains', userId)
      .get();

    const friendIds = friendshipsSnapshot.docs.flatMap(doc => {
      const participants = doc.data().participants;
      return participants.filter((id: string) => id !== userId);
    });

    // Récupérer les détails des amis
    const friends = [];
    for (const friendId of friendIds) {
      const friendDoc = await db.collection('users').doc(friendId).get();
      if (friendDoc.exists) {
        const friendData = friendDoc.data()!;
        friends.push({
          id: friendId,
          idUnique: friendData.idUnique,
          displayName: friendData.displayName,
          nationality: friendData.nationality,
          lat: friendData.lat,
          lon: friendData.lon,
        });
      }
    }

    // Mettre à jour lastActive
    await db.collection('users').doc(userId).update({
      lastActive: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: userId,
        idUnique: userData.idUnique,
        email: userData.email,
        displayName: userData.displayName,
        nationality: userData.nationality,
        age: userData.age,
        bio: userData.bio,
        position: {
          lat: userData.lat,
          lon: userData.lon,
        },
        commune: userData.commune,
        region: userData.region,
        friendCount: userData.friendCount || 0,
        showRealName: userData.showRealName || false,
        showLocation: userData.showLocation !== false,
        createdAt: userData.createdAt?.toMillis(),
        lastActive: userData.lastActive?.toMillis(),
        friends,
      },
    });

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { success: false, error: 'Token expiré' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération du profil',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
