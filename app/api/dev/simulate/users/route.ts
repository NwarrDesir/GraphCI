import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { generateUniqueId } from '@/lib/utils/userUtils';
import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/dev/simulate/users
 * 
 * Route de DÉVELOPPEMENT - Protégée par clé API
 * 
 * Génère plusieurs utilisateurs fictifs avec positions VALIDES en Côte d'Ivoire
 * 
 * Body:
 * {
 *   count: number (défaut: 10)
 *   nationality?: string (défaut: mix)
 *   createFriendships?: boolean (défaut: true)
 * }
 * 
 * Header requis: x-api-key: <DEV_API_KEY>
 */
export async function POST(request: Request) {
  try {
    // Vérification clé API dev
    const devKey = request.headers.get('x-api-key');
    const expectedKey = process.env.DEV_API_KEY || 'dev-secret-key-change-me';

    if (devKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Clé API invalide' },
        { status: 403 }
      );
    }

    const { count = 10, nationality, createFriendships = true } = await request.json();

    // Limiter pour éviter abus
    if (count > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 utilisateurs par appel' },
        { status: 400 }
      );
    }

    // Charger le GeoJSON de la Côte d'Ivoire
    const geoJsonPath = path.join(process.cwd(), 'public', 'gadm41_CIV_3.json');
    const geoJsonData = JSON.parse(fs.readFileSync(geoJsonPath, 'utf-8'));
    const features = geoJsonData.features;

    // Nationalités possibles
    const nationalities = ['Ivoirienne', 'Burkinabé', 'Malienne', 'Sénégalaise', 'Française', 'Autre'];
    
    // Zones principales de Côte d'Ivoire (centres RÉELS vérifiés)
    const ciZones = [
      { name: 'Abidjan', lat: 5.3600, lon: -4.0083, radius: 0.15 },
      { name: 'Yamoussoukro', lat: 6.8276, lon: -5.2893, radius: 0.10 },
      { name: 'Bouaké', lat: 7.6900, lon: -5.0300, radius: 0.12 },
      { name: 'San-Pédro', lat: 4.7467, lon: -6.6378, radius: 0.08 },
      { name: 'Korhogo', lat: 9.4580, lon: -5.6296, radius: 0.10 },
      { name: 'Daloa', lat: 6.8770, lon: -6.4503, radius: 0.08 },
      { name: 'Man', lat: 7.4125, lon: -7.5544, radius: 0.08 },
      { name: 'Abengourou', lat: 6.7295, lon: -3.4968, radius: 0.08 },
    ];

    const createdUsers = [];

    // Fonction pour vérifier si un point est en Côte d'Ivoire
    const isInCoteDIvoire = (lat: number, lon: number): any => {
      const point = turf.point([lon, lat]);
      for (const feature of features) {
        if (turf.booleanPointInPolygon(point, feature)) {
          return feature.properties;
        }
      }
      return null;
    };

    for (let i = 0; i < count; i++) {
      // Position aléatoire autour d'une ville
      const zone = ciZones[Math.floor(Math.random() * ciZones.length)];
      
      let lat: number, lon: number, locationProps: any;
      let attempts = 0;
      
      // Essayer jusqu'à 20 fois de trouver un point VALIDE
      do {
        lat = zone.lat + (Math.random() - 0.5) * zone.radius * 2;
        lon = zone.lon + (Math.random() - 0.5) * zone.radius * 2;
        locationProps = isInCoteDIvoire(lat, lon);
        attempts++;
      } while (!locationProps && attempts < 20);
      
      // Si après 20 essais on n'a pas trouvé, utiliser le centre exact
      if (!locationProps) {
        lat = zone.lat;
        lon = zone.lon;
        locationProps = isInCoteDIvoire(lat, lon) || { NAME_3: zone.name, NAME_2: zone.name, NAME_1: zone.name };
      }

      // Générer ID unique
      let idUnique = generateUniqueId();
      let idExists = true;
      
      while (idExists) {
        const existingUser = await db.collection('users')
          .where('idUnique', '==', idUnique)
          .limit(1)
          .get();
        
        if (existingUser.empty) {
          idExists = false;
        } else {
          idUnique = generateUniqueId();
        }
      }

      // Données utilisateur
      const userData = {
        idUnique,
        email: `sim-${idUnique.toLowerCase()}@test.dev`,
        nationality: nationality || nationalities[Math.floor(Math.random() * nationalities.length)],
        age: Math.floor(Math.random() * 40) + 18, // 18-58 ans
        lat,
        lon,
        commune: locationProps.NAME_3 || zone.name,
        departement: locationProps.NAME_2 || zone.name,
        region: locationProps.NAME_1 || zone.name,
        friendCount: 0,
        createdAt: new Date(),
        lastActive: new Date(),
        showRealName: false,
        showLocation: true,
        isSimulated: true,
      };

      // Créer l'utilisateur
      const userRef = await db.collection('users').add(userData);
      
      createdUsers.push({
        id: userRef.id,
        idUnique: userData.idUnique,
        nationality: userData.nationality,
        position: { lat, lon },
        commune: userData.commune,
      });
    }

    // CRÉER DES AMITIÉS - ALGORITHME RÉALISTE
    // Combine : proximité géographique + affinités (nationalité, âge)
    let friendshipsCreated = 0;
    if (createFriendships && createdUsers.length > 1) {
      for (let i = 0; i < createdUsers.length; i++) {
        const user1 = createdUsers[i];
        
        // Chaque utilisateur peut avoir entre 0 et 8 amis
        const maxFriends = Math.floor(Math.random() * 9);
        let currentFriends = 0;
        
        // Mélanger les utilisateurs potentiels
        const potentialFriends = [...createdUsers];
        potentialFriends.splice(i, 1); // Retirer soi-même
        
        // Trier par score d'affinité
        potentialFriends.sort((a, b) => {
          // Score basé sur: même nationalité (+3), âge proche (+2), distance (-1 par 1km)
          const scoreA = calculateAffinityScore(user1, a);
          const scoreB = calculateAffinityScore(user1, b);
          return scoreB - scoreA;
        });
        
        // Créer des amitiés avec les meilleurs scores
        for (const user2 of potentialFriends) {
          if (currentFriends >= maxFriends) break;
          
          const affinityScore = calculateAffinityScore(user1, user2);
          
          // Probabilité basée sur le score d'affinité (plus c'est haut, plus c'est probable)
          const probability = Math.min(0.8, affinityScore / 10);
          
          if (Math.random() < probability) {
            // Vérifier si l'amitié n'existe pas déjà
            const exists = await db.collection('friendships')
              .where('user1', 'in', [user1.id, user2.id])
              .where('user2', 'in', [user1.id, user2.id])
              .limit(1)
              .get();
            
            if (exists.empty) {
              const friendship = {
                user1: user1.id,
                user2: user2.id,
                status: 'accepted',
                createdAt: new Date(),
                acceptedAt: new Date(),
              };
              
              await db.collection('friendships').add(friendship);
              
              // Incrémenter friendCount (batch update)
              const user1Doc = await db.collection('users').doc(user1.id).get();
              const user2Doc = await db.collection('users').doc(user2.id).get();
              
              await db.collection('users').doc(user1.id).update({
                friendCount: (user1Doc.data()?.friendCount || 0) + 1
              });
              await db.collection('users').doc(user2.id).update({
                friendCount: (user2Doc.data()?.friendCount || 0) + 1
              });
              
              friendshipsCreated++;
              currentFriends++;
            }
          }
        }
      }
    }

    // Fonction de calcul d'affinité
    function calculateAffinityScore(u1: any, u2: any): number {
      let score = 0;
      
      // Même nationalité : +5 points
      if (u1.nationality === u2.nationality) score += 5;
      
      // Âge proche (±10 ans) : +3 points
      if (u1.age && u2.age) {
        const ageDiff = Math.abs(u1.age - u2.age);
        if (ageDiff <= 10) score += 3;
        if (ageDiff <= 5) score += 2; // Bonus si très proche
      }
      
      // Distance géographique
      const R = 6371;
      const dLat = (u2.position.lat - u1.position.lat) * Math.PI / 180;
      const dLon = (u2.position.lon - u1.position.lon) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(u1.position.lat * Math.PI / 180) * 
                Math.cos(u2.position.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;
      
      // Proximité : +10 points si <1km, +5 si <5km, +2 si <20km
      if (distanceKm < 1) score += 10;
      else if (distanceKm < 5) score += 5;
      else if (distanceKm < 20) score += 2;
      
      return score;
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdUsers.length,
        friendshipsCreated,
        users: createdUsers,
      },
    });

  } catch (error: any) {
    console.error('Error simulating users:', error);
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
