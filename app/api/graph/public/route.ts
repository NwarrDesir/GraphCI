import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

/**
 * GET /api/graph/public
 * 
 * Route PUBLIQUE - Accessible sans authentification
 * 
 * Permet aux visiteurs de voir l'état du graphe en temps réel :
 * - Tous les utilisateurs avec leurs positions (lat, lon)
 * - Tous les liens d'amitié (arêtes du graphe)
 * - Statistiques globales
 * 
 * Les noms réels ne sont JAMAIS exposés, seulement les identifiants CI-XXXX
 */
export async function GET(request: Request) {
  try {
    // Récupérer tous les utilisateurs
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        idUnique: data.idUnique,
        lat: data.lat,
        lon: data.lon,
        nationality: data.nationality,
        age: data.age,
        commune: data.commune,
        region: data.region,
        friendCount: data.friendCount || 0,
        isActive: data.lastActive && (Date.now() - data.lastActive.toMillis() < 5 * 60 * 1000), // Actif si < 5min
        // NE PAS exposer: displayName, email, bio
      };
    });

    // Récupérer toutes les amitiés (arêtes du graphe)
    const friendshipsSnapshot = await db.collection('friendships').get();
    const friendships = friendshipsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        user1: data.user1,
        user2: data.user2,
        createdAt: data.createdAt?.toMillis(),
      };
    });

    // Récupérer les conversations actives (pour animation fils)
    const activeConversationsSnapshot = await db
      .collection('conversations')
      .where('isActive', '==', true)
      .get();
    
    const activeConversations = activeConversationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        participants: data.participants, // [userId1, userId2]
      };
    });

    // Statistiques globales
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalFriendships: friendships.length,
      activeConversations: activeConversations.length,
      nationalitiesCount: users.reduce((acc, u) => {
        acc[u.nationality] = (acc[u.nationality] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      success: true,
      data: {
        users,
        friendships,
        activeConversations,
        stats,
      },
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error('Error fetching public graph:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch graph data',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
