/**
 * API Route : Statistiques réseau social
 * GET /api/stats
 * 
 * Retourne les statistiques du réseau social
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Récupérer tous les utilisateurs
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => doc.data());

    // Récupérer les amitiés
    const friendshipsSnapshot = await db.collection('friendships').get();
    const friendships = friendshipsSnapshot.docs.map(doc => doc.data());

    // Récupérer les messages
    const messagesSnapshot = await db.collection('messages').get();
    const messages = messagesSnapshot.docs.map(doc => doc.data());

    // Par région
    const byRegion = users.reduce((acc: any, user: any) => {
      const region = user.region || 'Non spécifié';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    // Par nationalité
    const byNationality = users.reduce((acc: any, user: any) => {
      const nat = user.nationality || 'Non spécifié';
      acc[nat] = (acc[nat] || 0) + 1;
      return acc;
    }, {});

    // Utilisateurs actifs (dernière activité < 5 minutes)
    const now = Date.now();
    const activeUsers = users.filter((u: any) => {
      const lastActive = u.lastActive?.toMillis?.() || 0;
      return (now - lastActive) < 5 * 60 * 1000;
    });

    return NextResponse.json({
      global: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalFriendships: friendships.length,
        totalMessages: messages.length,
      },
      byRegion,
      byNationality,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Erreur API stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des stats', details: error.message },
      { status: 500 }
    );
  }
}
