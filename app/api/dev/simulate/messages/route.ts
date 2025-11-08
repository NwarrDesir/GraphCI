import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

/**
 * POST /api/dev/simulate/messages
 * 
 * Route de DÉVELOPPEMENT - Protégée par clé API
 * 
 * Simule des échanges de messages entre utilisateurs
 * Marque les conversations comme actives pour tester l'animation des fils
 * 
 * Body:
 * {
 *   user1Id: string
 *   user2Id: string
 *   count?: number (défaut: 5)
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

    const { user1Id, user2Id, count = 5 } = await request.json();

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { success: false, error: 'user1Id et user2Id requis' },
        { status: 400 }
      );
    }

    // Vérifier que les utilisateurs existent
    const user1Doc = await db.collection('users').doc(user1Id).get();
    const user2Doc = await db.collection('users').doc(user2Id).get();

    if (!user1Doc.exists || !user2Doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Un ou plusieurs utilisateurs introuvables' },
        { status: 404 }
      );
    }

    // Chercher ou créer la conversation
    const participants = [user1Id, user2Id].sort();

    let conversationId: string;
    const existingConversation = await db.collection('conversations')
      .where('participants', '==', participants)
      .limit(1)
      .get();

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
      conversationId = existingConversation.docs[0].id;
    }

    // Messages types pour simulation
    const messageTemplates = [
      "Salut ! Comment ça va ?",
      "Ça va bien merci, et toi ?",
      "Super ! Tu es dispo ce soir ?",
      "Oui, on se retrouve où ?",
      "Au lieu habituel ?",
      "Parfait, à ce soir !",
      "D'accord, à plus tard",
      "😊👍",
    ];

    const createdMessages = [];

    // Créer les messages en alternance
    for (let i = 0; i < count; i++) {
      const senderId = i % 2 === 0 ? user1Id : user2Id;
      const recipientId = i % 2 === 0 ? user2Id : user1Id;
      const content = messageTemplates[i % messageTemplates.length];

      const messageData = {
        conversationId,
        senderId,
        recipientId,
        content,
        createdAt: new Date(Date.now() - (count - i) * 10000), // Messages espacés de 10s
        read: false,
      };

      const messageRef = await db.collection('messages').add(messageData);

      createdMessages.push({
        id: messageRef.id,
        senderId,
        content,
      });
    }

    // Marquer la conversation comme active
    await db.collection('conversations').doc(conversationId).update({
      lastMessageAt: new Date(),
      isActive: true,
      messageCount: count,
    });

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        created: createdMessages.length,
        messages: createdMessages,
        note: 'Conversation marquée comme active - le fil devrait briller sur la carte',
      },
    });

  } catch (error: any) {
    console.error('Error simulating messages:', error);
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
