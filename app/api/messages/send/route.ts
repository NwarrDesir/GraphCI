import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';

/**
 * POST /api/messages/send
 * 
 * Route PROTÉGÉE
 * 
 * Envoie un message à un autre utilisateur
 * - Crée ou récupère la conversation
 * - Marque la conversation comme active (isActive = true)
 * - Enregistre le message
 * 
 * Body:
 * {
 *   recipientId: string
 *   content: string
 * }
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
    const senderId = decodedToken.uid;

    // Récupérer le body
    const { recipientId, content } = await request.json();

    if (!recipientId || !content) {
      return NextResponse.json(
        { success: false, error: 'Destinataire et contenu requis' },
        { status: 400 }
      );
    }

    // Vérifier que le destinataire existe
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    if (!recipientDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Destinataire introuvable' },
        { status: 404 }
      );
    }

    // Chercher ou créer la conversation
    const participants = [senderId, recipientId].sort(); // Tri pour cohérence

    const existingConversation = await db.collection('conversations')
      .where('participants', '==', participants)
      .limit(1)
      .get();

    let conversationId: string;

    if (existingConversation.empty) {
      // Créer nouvelle conversation
      const conversationData = {
        participants,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        isActive: true,
        messageCount: 0,
      };
      const conversationRef = await db.collection('conversations').add(conversationData);
      conversationId = conversationRef.id;
    } else {
      // Utiliser conversation existante
      conversationId = existingConversation.docs[0].id;
      
      // Mettre à jour l'activité
      await db.collection('conversations').doc(conversationId).update({
        lastMessageAt: new Date(),
        isActive: true,
        messageCount: (existingConversation.docs[0].data().messageCount || 0) + 1,
      });
    }

    // Créer le message
    const messageData = {
      conversationId,
      senderId,
      recipientId,
      content,
      createdAt: new Date(),
      read: false,
    };

    const messageRef = await db.collection('messages').add(messageData);

    return NextResponse.json({
      success: true,
      data: {
        messageId: messageRef.id,
        conversationId,
        sentAt: messageData.createdAt.getTime(),
      },
    });

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'envoi du message',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
