/**
 * API Users - Gestion des utilisateurs
 * POST /api/users - Créer un utilisateur
 * GET /api/users - Récupérer tous les utilisateurs (avec filtres optionnels)
 * GET /api/users/[id] - Récupérer un utilisateur spécifique
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { User } from '@/lib/types';
import * as turf from '@turf/turf';
import { getCoteDIvoireGeometry } from '@/lib/utils/geocoding';

/**
 * POST /api/users - Créer un utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    const { email, displayName, nationality, age, lat, lon } = body;
    
    if (!email || !displayName || !nationality) {
      return NextResponse.json({
        status: 'error',
        message: 'Champs requis: email, displayName, nationality'
      }, { status: 400 });
    }

    // VALIDATION GPS : Vérifier que les coordonnées sont en Côte d'Ivoire
    if (lat && lon) {
      const geojson = await getCoteDIvoireGeometry();
      const point = turf.point([lon, lat]);
      const isInCoteDIvoire = turf.booleanPointInPolygon(point, geojson as any);
      
      if (!isInCoteDIvoire) {
        return NextResponse.json({
          status: 'error',
          message: 'Les coordonnées GPS doivent être en Côte d\'Ivoire'
        }, { status: 400 });
      }
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!existingUser.empty) {
      return NextResponse.json({
        status: 'error',
        message: 'Email déjà utilisé'
      }, { status: 409 });
    }

    // Générer l'ID CI
    const usersCount = (await db.collection('users').count().get()).data().count;
    const idUnique = `CI-${String(usersCount + 1).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Créer l'utilisateur
    const newUser: any = {
      idUnique,
      email,
      displayName,
      nationality,
      age: age || 25,
      lat: lat || 5.3600,
      lon: lon || -4.0083,
      friendCount: 0,
      showRealName: false,
      createdAt: new Date(),
    };

    const docRef = await db.collection('users').add(newUser);
    const userId = docRef.id;

    return NextResponse.json({
      status: 'success',
      message: 'Utilisateur créé avec succès',
      data: {
        id: userId,
        ...newUser
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la création de l\'utilisateur'
    }, { status: 500 });
  }
}

/**
 * GET /api/users - Récupérer tous les utilisateurs
 * Query params: nationality, minAge, maxAge, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nationality = searchParams.get('nationality');
    const minAge = searchParams.get('minAge');
    const maxAge = searchParams.get('maxAge');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query: any = db.collection('users');

    // Filtres
    if (nationality) {
      query = query.where('nationality', '==', nationality);
    }
    if (minAge) {
      query = query.where('age', '>=', parseInt(minAge));
    }
    if (maxAge) {
      query = query.where('age', '<=', parseInt(maxAge));
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const users = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      status: 'success',
      data: {
        users,
        count: users.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Erreur lors de la récupération des utilisateurs'
    }, { status: 500 });
  }
}
