import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';

/**
 * GET /api/messages/[conversationId]
 * 
 * Route PROTÉGÉE
 * 
 * Récupère tous les messages d'une conversation
 * 
 * Query params:
 * - limit?: number (défaut: 50)
 * - before?: timestamp (pour pagination)
 */
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
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

    const { conversationId } = params;

    // Vérifier que l'utilisateur est participant
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    
    if (!conversationDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Conversation introuvable' },
        { status: 404 }
      );
    }

    const conversationData = conversationDoc.data()!;
    if (!conversationData.participants.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer les messages
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    let messagesQuery = db.collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (before) {
      const beforeDate = new Date(parseInt(before));
      messagesQuery = messagesQuery.where('createdAt', '<', beforeDate) as any;
    }

    const messagesSnapshot = await messagesQuery.get();

    const messages = messagesSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        recipientId: data.recipientId,
        content: data.content,
        createdAt: data.createdAt?.toMillis(),
        read: data.read || false,
      };
    });

    // Marquer les messages comme lus
    const batch = db.batch();
    messagesSnapshot.docs.forEach((doc: any) => {
      if (!doc.data().read && doc.data().recipientId === userId) {
        batch.update(doc.ref, { read: true });
      }
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(), // Ordre chronologique
        conversationId,
        hasMore: messages.length === limit,
      },
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des messages',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
