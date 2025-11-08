import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { generateUniqueId } from '@/lib/utils/userUtils';

/**
 * POST /api/dev/simulate/cluster
 * 
 * Crée un CLUSTER d'utilisateurs très proches (même quartier)
 * pour garantir des liens d'amitié visibles
 */
export async function POST(request: Request) {
  try {
    const devKey = request.headers.get('x-api-key');
    const expectedKey = process.env.DEV_API_KEY;

    if (devKey !== expectedKey) {
      return NextResponse.json({ error: 'Clé API invalide' }, { status: 403 });
    }

    const { count = 20 } = await request.json();

    // Centre : Cocody, Abidjan (zone dense)
    const centerLat = 5.3500;
    const centerLon = -3.9800;
    const radius = 0.005; // ~500m de rayon max

    const nationalities = ['Ivoirienne', 'Burkinabé', 'Malienne', 'Sénégalaise'];
    const createdUsers = [];

    // CRÉER LES UTILISATEURS
    for (let i = 0; i < count; i++) {
      let idUnique = generateUniqueId();
      let idExists = true;
      
      while (idExists) {
        const existing = await db.collection('users').where('idUnique', '==', idUnique).limit(1).get();
        if (existing.empty) {
          idExists = false;
        } else {
          idUnique = generateUniqueId();
        }
      }

      // Position très proche du centre
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const lat = centerLat + distance * Math.cos(angle);
      const lon = centerLon + distance * Math.sin(angle);

      const userData = {
        idUnique,
        email: `cluster-${idUnique.toLowerCase()}@test.dev`,
        nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
        age: Math.floor(Math.random() * 40) + 18,
        lat,
        lon,
        commune: 'Cocody',
        departement: 'Abidjan',
        region: 'Abidjan',
        friendCount: 0,
        createdAt: new Date(),
        lastActive: new Date(),
        showRealName: false,
        showLocation: true,
        isSimulated: true,
      };

      const userRef = await db.collection('users').add(userData);
      createdUsers.push({ id: userRef.id, ...userData });
    }

    // CRÉER DES AMITIÉS (maillage dense)
    let friendshipsCreated = 0;
    
    for (let i = 0; i < createdUsers.length; i++) {
      // Chaque user se lie avec 3-5 voisins aléatoires
      const friendCount = 3 + Math.floor(Math.random() * 3);
      const possibleFriends = [...createdUsers];
      possibleFriends.splice(i, 1); // Retirer soi-même
      
      for (let f = 0; f < Math.min(friendCount, possibleFriends.length); f++) {
        const friendIndex = Math.floor(Math.random() * possibleFriends.length);
        const friend = possibleFriends.splice(friendIndex, 1)[0];
        
        // Éviter doublons
        const existingFriendship = await db.collection('friendships')
          .where('user1', 'in', [createdUsers[i].id, friend.id])
          .where('user2', 'in', [createdUsers[i].id, friend.id])
          .limit(1)
          .get();
        
        if (existingFriendship.empty) {
          await db.collection('friendships').add({
            user1: createdUsers[i].id,
            user2: friend.id,
            status: 'accepted',
            createdAt: new Date(),
            acceptedAt: new Date(),
          });
          
          // Incrémenter friendCount
          await db.collection('users').doc(createdUsers[i].id).update({
            friendCount: createdUsers[i].friendCount + 1
          });
          await db.collection('users').doc(friend.id).update({
            friendCount: friend.friendCount + 1
          });
          
          createdUsers[i].friendCount++;
          friend.friendCount++;
          friendshipsCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdUsers.length,
        friendshipsCreated,
        location: 'Cocody, Abidjan',
      },
    });

  } catch (error: any) {
    console.error('Error creating cluster:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du cluster', message: error.message },
      { status: 500 }
    );
  }
}
