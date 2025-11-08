/**
 * API Route : Créer des signalements de test
 * POST /api/reports/simulate
 * 
 * Permet de créer des signalements via API pour les tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { PRODUCTS, CITIES } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      count = 1, 
      city, 
      product,
      autoUser = true  // Créer un user_id automatiquement
    } = body;

    // Validation
    if (count > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 signalements par requête' },
        { status: 400 }
      );
    }

    const reports = [];
    const CITY_COORDS: Record<string, { lat: number; lon: number; radius: number }> = {
      'Abidjan': { lat: 5.3600, lon: -4.0083, radius: 0.05 },
      'Bouaké': { lat: 7.6900, lon: -5.0300, radius: 0.03 },
      'Daloa': { lat: 6.8800, lon: -6.4500, radius: 0.02 },
      'Yamoussoukro': { lat: 6.8276, lon: -5.2893, radius: 0.03 },
      'San-Pédro': { lat: 4.7500, lon: -6.6333, radius: 0.02 },
      'Korhogo': { lat: 9.4581, lon: -5.6296, radius: 0.02 },
      'Man': { lat: 7.4125, lon: -7.5544, radius: 0.02 },
      'Gagnoa': { lat: 6.1319, lon: -5.9506, radius: 0.02 },
      'Divo': { lat: 5.8372, lon: -5.3572, radius: 0.02 },
      'Abengourou': { lat: 6.7294, lon: -3.4961, radius: 0.02 },
    };

    for (let i = 0; i < count; i++) {
      const selectedCity = city || CITIES[Math.floor(Math.random() * CITIES.length)];
      const selectedProduct = product || PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const cityCoords = CITY_COORDS[selectedCity];
      
      const randomOffset = () => (Math.random() - 0.5) * 2 * cityCoords.radius;
      
      const report = {
        lat: cityCoords.lat + randomOffset(),
        lon: cityCoords.lon + randomOffset(),
        product: selectedProduct,
        city: selectedCity,
        timestamp: Timestamp.now(),
        user_id: autoUser ? `test_user_${Date.now()}_${i}` : undefined,
        simulated: true,
        api_created: true,
      };

      const docRef = await addDoc(collection(db, 'reports'), report);
      reports.push({ id: docRef.id, ...report });
    }

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports: reports.map(r => ({ id: r.id, city: r.city, product: r.product })),
      message: `${reports.length} signalement(s) créé(s)`,
    });

  } catch (error: any) {
    console.error('Erreur API simulate:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des signalements', details: error.message },
      { status: 500 }
    );
  }
}
