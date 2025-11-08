import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';
import { generateUniqueId } from '@/lib/utils/userUtils';

/**
 * POST /api/auth/signup
 * 
 * Route d'inscription
 * 
 * Body requis:
 * {
 *   email: string
 *   password: string
 *   age?: number
 *   nationality: string (requis)
 *   lat: number (requis)
 *   lon: number (requis)
 *   commune?: string
 *   region?: string
 *   displayName?: string
 * }
 * 
 * Retourne:
 * - customToken pour authentification Firebase
 * - Informations utilisateur avec ID unique CI-XXXX
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, age, nationality, lat, lon, commune, region, displayName } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (!nationality || !lat || !lon) {
      return NextResponse.json(
        { success: false, error: 'Nationalité et position GPS requises' },
        { status: 400 }
      );
    }

    // Créer utilisateur Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    // Générer ID unique CI-XXXX-YYYY
    let idUnique = generateUniqueId();
    let idExists = true;
    
    // Vérifier unicité
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

    // Créer document utilisateur dans Firestore
    const userData: any = {
      id: userRecord.uid,
      idUnique,
      email,
      nationality,
      lat,
      lon,
      friendCount: 0,
      createdAt: new Date(),
      lastActive: new Date(),
      showRealName: false,
      showLocation: true,
    };

    // Ajouter champs optionnels
    if (age) userData.age = age;
    if (commune) userData.commune = commune;
    if (region) userData.region = region;
    if (displayName) userData.displayName = displayName;

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Générer custom token pour connexion
    const customToken = await auth.createCustomToken(userRecord.uid);

    return NextResponse.json({
      success: true,
      data: {
        customToken,
        user: {
          uid: userRecord.uid,
          idUnique,
          email,
          nationality,
          position: { lat, lon },
          commune,
          region,
        },
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error during signup:', error);
    
    // Gérer les erreurs spécifiques Firebase
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { success: false, error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'inscription',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
