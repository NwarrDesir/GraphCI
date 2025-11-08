import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';
import { generateFriendCode, getCodeExpirationDate } from '@/lib/utils/userUtils';

/**
 * POST /api/friends/generate-code
 * 
 * Route PROTÉGÉE
 * 
 * Génère un code d'amitié temporaire (6 chiffres)
 * - Valable 2 minutes
 * - Utilisable une seule fois
 * 
 * Header requis: Authorization: Bearer <idToken>
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

    // Invalider les anciens codes de cet utilisateur
    const oldCodesSnapshot = await db.collection('friendCodes')
      .where('creatorId', '==', userId)
      .where('used', '==', false)
      .get();

    const batch = db.batch();
    oldCodesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { used: true });
    });
    await batch.commit();

    // Générer nouveau code
    let code = generateFriendCode();
    let codeExists = true;

    // Vérifier unicité
    while (codeExists) {
      const existingCode = await db.collection('friendCodes')
        .where('code', '==', code)
        .where('used', '==', false)
        .limit(1)
        .get();

      if (existingCode.empty) {
        codeExists = false;
      } else {
        code = generateFriendCode();
      }
    }

    // Créer le code
    const expiresAt = getCodeExpirationDate();
    const codeData = {
      code,
      creatorId: userId,
      createdAt: new Date(),
      expiresAt,
      used: false,
    };

    const codeRef = await db.collection('friendCodes').add(codeData);

    return NextResponse.json({
      success: true,
      data: {
        id: codeRef.id,
        code,
        expiresAt: expiresAt.getTime(),
        validitySeconds: 120,
      },
    });

  } catch (error: any) {
    console.error('Error generating friend code:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération du code',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
