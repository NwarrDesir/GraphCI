import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

/**
 * POST /api/dev/simulate/friendships
 * 
 * Route de DÉVELOPPEMENT - Protégée par clé API
 * 
 * Crée des liens d'amitié aléatoires entre utilisateurs existants
 * 
 * Body:
 * {
 *   count?: number (défaut: 20)
 *   userIds?: string[] (optionnel - sinon prend utilisateurs aléatoires)
 * }
 * 
 * Header requis: X-Dev-Key: <DEV_API_KEY>
 */
export async function POST(request: Request) {
  try {
    // Vérification clé API dev
    const devKey = request.headers.get('X-Dev-Key');
    const expectedKey = process.env.DEV_API_KEY || 'dev-secret-key-change-me';

    if (devKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Clé API invalide' },
        { status: 403 }
      );
    }

    const { count = 20, userIds } = await request.json();

    // Récupérer les utilisateurs
    let usersSnapshot;
    if (userIds && userIds.length > 0) {
      // Utiliser les IDs fournis
      usersSnapshot = await db.collection('users')
        .where('__name__', 'in', userIds)
        .get();
    } else {
      // Récupérer tous les utilisateurs
      usersSnapshot = await db.collection('users').get();
    }

    if (usersSnapshot.empty || usersSnapshot.size < 2) {
      return NextResponse.json(
        { success: false, error: 'Pas assez d\'utilisateurs (minimum 2)' },
        { status: 400 }
      );
    }

    const users = usersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const createdFriendships = [];
    const existingPairs = new Set<string>();

    // Récupérer amitiés existantes
    const existingFriendships = await db.collection('friendships').get();
    existingFriendships.docs.forEach((doc: any) => {
      const data = doc.data();
      const pair = [data.user1, data.user2].sort().join('-');
      existingPairs.add(pair);
    });

    // Créer les amitiés
    let attempts = 0;
    const maxAttempts = count * 3; // Éviter boucle infinie

    while (createdFriendships.length < count && attempts < maxAttempts) {
      attempts++;

      // Sélectionner deux utilisateurs aléatoires
      const user1 = users[Math.floor(Math.random() * users.length)];
      const user2 = users[Math.floor(Math.random() * users.length)];

      // Vérifier qu'ils sont différents
      if (user1.id === user2.id) continue;

      // Vérifier que le lien n'existe pas déjà
      const pair = [user1.id, user2.id].sort().join('-');
      if (existingPairs.has(pair)) continue;

      // Créer l'amitié
      const friendshipData = {
        participants: [user1.id, user2.id].sort(),
        user1: user1.id,
        user2: user2.id,
        createdAt: new Date(),
        createdVia: 'simulation',
      };

      const friendshipRef = await db.collection('friendships').add(friendshipData);
      existingPairs.add(pair);

      // Incrémenter friendCount
      const batch = db.batch();
      const user1Ref = db.collection('users').doc(user1.id);
      const user2Ref = db.collection('users').doc(user2.id);

      batch.update(user1Ref, { friendCount: (user1.friendCount || 0) + 1 });
      batch.update(user2Ref, { friendCount: (user2.friendCount || 0) + 1 });
      await batch.commit();

      createdFriendships.push({
        id: friendshipRef.id,
        user1: { id: user1.id, idUnique: user1.idUnique },
        user2: { id: user2.id, idUnique: user2.idUnique },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdFriendships.length,
        friendships: createdFriendships,
      },
    });

  } catch (error: any) {
    console.error('Error simulating friendships:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la simulation',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
