import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { AffinityTest, AffinityQuestion } from '@/lib/types';
import admin from 'firebase-admin';

const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

/**
 * GET /api/affinity/test?userId=xxx
 * Récupérer le test d'affinité d'un utilisateur
 * Retourne le test SANS les réponses correctes (pour affichage public)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const full = searchParams.get('full') === 'true'; // Pour récupérer le test complet avec réponses

    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      );
    }

    // Récupérer le test actif de l'utilisateur
    const testSnapshot = await adminDb
      .collection('affinityTests')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (testSnapshot.empty) {
      return NextResponse.json(
        { error: 'Aucun test actif trouvé', hasTest: false },
        { status: 404 }
      );
    }

    const testDoc = testSnapshot.docs[0];
    const test = testDoc.data() as AffinityTest;

    // Si full=true, retourner le test complet (pour édition par le propriétaire)
    if (full) {
      return NextResponse.json({
        id: testDoc.id,
        userId: test.userId,
        title: test.title,
        description: test.description,
        questions: test.questions, // Avec les réponses correctes
        minimumScore: test.minimumScore,
        hasOpenQuestions: test.hasOpenQuestions,
      });
    }

    // Sinon, supprimer les réponses correctes pour la sécurité (affichage public)
    const publicQuestions = test.questions.map((q) => {
      const publicQuestion: any = {
        id: q.id,
        type: q.type,
        question: q.question,
        order: q.order,
      };

      // Inclure les options pour QCM mais pas la réponse correcte
      if (q.type === 'qcm' && q.options) {
        publicQuestion.options = q.options;
      }

      // Ne pas inclure correctAnswer ou correctAnswerIndex
      return publicQuestion;
    });

    return NextResponse.json({
      id: testDoc.id,
      userId: test.userId,
      title: test.title,
      description: test.description,
      questions: publicQuestions,
      minimumScore: test.minimumScore,
      hasOpenQuestions: test.hasOpenQuestions,
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/affinity/test:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affinity/test
 * Créer ou mettre à jour le test d'affinité de l'utilisateur connecté
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, questions, minimumScore } = body;

    // Validation
    if (!userId || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Le test doit contenir au moins une question' },
        { status: 400 }
      );
    }

    if (minimumScore < 0 || minimumScore > 100) {
      return NextResponse.json(
        { error: 'Le score minimum doit être entre 0 et 100' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà un test
    const existingTestSnapshot = await adminDb
      .collection('affinityTests')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    // Détecter s'il y a des questions ouvertes
    const hasOpenQuestions = questions.some(
      (q: AffinityQuestion) => q.type === 'ouverte'
    );

    const testData: any = {
      userId,
      title,
      description: description || '',
      questions,
      minimumScore,
      hasOpenQuestions,
      isActive: true,
      updatedAt: Timestamp.now(),
    };

    let testId: string;

    if (existingTestSnapshot.empty) {
      // Créer un nouveau test
      testData.createdAt = Timestamp.now();
      testData.totalAttempts = 0;
      testData.totalSuccess = 0;
      testData.totalPending = 0;

      const docRef = await adminDb.collection('affinityTests').add(testData);
      testId = docRef.id;

      console.log(`✅ Test créé pour userId ${userId}: ${testId}`);
    } else {
      // Mettre à jour le test existant
      const existingTestDoc = existingTestSnapshot.docs[0];
      testId = existingTestDoc.id;

      await adminDb
        .collection('affinityTests')
        .doc(testId)
        .update(testData);

      console.log(`✅ Test mis à jour pour userId ${userId}: ${testId}`);
    }

    return NextResponse.json({
      success: true,
      testId,
      message: 'Test d\'affinité enregistré avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/affinity/test:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/affinity/test?userId=xxx
 * Désactiver le test d'affinité de l'utilisateur
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      );
    }

    // Trouver le test actif
    const testSnapshot = await adminDb
      .collection('affinityTests')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (testSnapshot.empty) {
      return NextResponse.json(
        { error: 'Aucun test actif à supprimer' },
        { status: 404 }
      );
    }

    const testDoc = testSnapshot.docs[0];
    await adminDb
      .collection('affinityTests')
      .doc(testDoc.id)
      .update({ isActive: false, updatedAt: Timestamp.now() });

    console.log(`✅ Test désactivé pour userId ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Test désactivé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur DELETE /api/affinity/test:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
