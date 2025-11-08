'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase/config';
import { Vendor, Filters } from '@/lib/types';

export function useVendors(filters?: Filters) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoading(true);
        setError(null);

        // TEMPORAIRE : Lire directement les reports au lieu des vendors
        // TODO : Créer un système de fusion pour générer la collection vendors
        let q = query(collection(db, COLLECTIONS.REPORTS));

        // Appliquer les filtres
        if (filters?.city) {
          q = query(q, where('city', '==', filters.city));
        }

        if (filters?.product) {
          q = query(q, where('product', '==', filters.product));
        }

        // Trier par timestamp
        q = query(q, orderBy('timestamp', 'desc'));

        const snapshot = await getDocs(q);
        
        // Convertir les reports en format Vendor
        const vendorsData: Vendor[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            lat: data.lat,
            lon: data.lon,
            product: data.product,
            city: data.city,
            report_count: 1,
            last_seen: data.timestamp,
            first_seen: data.timestamp,
            user_ids: [data.user_id],
            signalements: 1, // Nombre de signalements (1 car c'est un report individuel)
          };
        });

        // Filtrer par date si nécessaire (côté client)
        let filteredVendors = vendorsData;
        if (filters?.dateRange) {
          filteredVendors = vendorsData.filter((vendor) => {
            const lastSeen = vendor.last_seen instanceof Timestamp 
              ? vendor.last_seen.toDate() 
              : vendor.last_seen;
            return (
              lastSeen >= filters.dateRange!.start &&
              lastSeen <= filters.dateRange!.end
            );
          });
        }

        setVendors(filteredVendors);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchVendors();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchVendors, 30000);

    return () => clearInterval(interval);
  }, [filters?.city, filters?.product, filters?.dateRange]);

  return { vendors, loading, error };
}
