/**
 * API Route : Créer un cluster de vendeurs proches
 * POST /api/reports/cluster
 * 
 * Crée plusieurs signalements très proches pour tester la fusion
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { PRODUCTS, CITIES } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      city = 'Abidjan',
      product = 'attiéké',
      count = 5,
      maxDistance = 0.0003  // ~30m
    } = body;

    if (!CITIES.includes(city)) {
      return NextResponse.json(
        { error: 'Ville invalide' },
        { status: 400 }
      );
    }

    const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
      'Abidjan': { lat: 5.3600, lon: -4.0083 },
      'Bouaké': { lat: 7.6900, lon: -5.0300 },
      'Daloa': { lat: 6.8800, lon: -6.4500 },
      'Yamoussoukro': { lat: 6.8276, lon: -5.2893 },
      'San-Pédro': { lat: 4.7500, lon: -6.6333 },
      'Korhogo': { lat: 9.4581, lon: -5.6296 },
      'Man': { lat: 7.4125, lon: -7.5544 },
      'Gagnoa': { lat: 6.1319, lon: -5.9506 },
      'Divo': { lat: 5.8372, lon: -5.3572 },
      'Abengourou': { lat: 6.7294, lon: -3.4961 },
    };

    const baseCoords = CITY_COORDS[city];
    const reports = [];

    for (let i = 0; i < count; i++) {
      const report = {
        lat: baseCoords.lat + (Math.random() - 0.5) * maxDistance,
        lon: baseCoords.lon + (Math.random() - 0.5) * maxDistance,
        product,
        city,
        timestamp: Timestamp.now(),
        user_id: `test_user_cluster_${Date.now()}_${i}`,
        simulated: true,
        cluster: true,
        api_created: true,
      };

      const docRef = await addDoc(collection(db, 'reports'), report);
      reports.push({ id: docRef.id, ...report });
    }

    return NextResponse.json({
      success: true,
      count: reports.length,
      cluster: {
        center: baseCoords,
        radius: maxDistance * 111000,  // Conversion en mètres (~111km par degré)
        city,
        product,
      },
      reports: reports.map(r => ({ 
        id: r.id, 
        lat: r.lat.toFixed(6), 
        lon: r.lon.toFixed(6) 
      })),
      message: `Cluster de ${reports.length} vendeurs créé à ${city}`,
    });

  } catch (error: any) {
    console.error('Erreur API cluster:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du cluster', details: error.message },
      { status: 500 }
    );
  }
}
