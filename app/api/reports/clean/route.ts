/**
 * API Route : Supprimer les données de test
 * DELETE /api/reports/clean
 * 
 * Supprime les anciennes données de vendeurs (legacy)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function DELETE(request: NextRequest) {
  try {
    // Supprimer l'ancienne collection 'reports'
    const reportsSnapshot = await db.collection('reports').get();
    
    if (reportsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'Aucune donnée legacy à supprimer',
      });
    }

    const batch = db.batch();
    let count = 0;

    reportsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      deleted: count,
      message: `${count} ancien(s) signalement(s) supprimé(s)`,
    });

  } catch (error: any) {
    console.error('Erreur API clean:', error);
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage', details: error.message },
      { status: 500 }
    );
  }
}
