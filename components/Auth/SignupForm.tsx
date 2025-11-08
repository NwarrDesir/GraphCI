'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { reverseGeocode } from '@/lib/utils/geocoding';
import { generateUniqueId } from '@/lib/utils/userUtils';
import { FaSpinner } from 'react-icons/fa';

interface SignupFormProps {
  userId: string;
  userEmail?: string | null;
  onComplete: () => void;
}

export default function SignupForm({ userId, userEmail, onComplete }: SignupFormProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    nationality: '',
  });
  
  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
    commune?: string;
    departement?: string;
    region?: string;
  } | null>(null);
  
  const [locationLoading, setLocationLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Géolocalisation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          try {
            const locationInfo = await reverseGeocode(lat, lon);
            setLocation({
              lat,
              lon,
              commune: locationInfo.commune || 'Inconnue',
              departement: locationInfo.departement,
              region: locationInfo.region || 'Détectée',
            });
          } catch (err) {
            setLocation({ lat, lon, region: 'Position GPS' });
          }
          setLocationLoading(false);
        },
        () => {
          setError('Veuillez autoriser la géolocalisation');
          setLocationLoading(false);
        }
      );
    } else {
      setError('Géolocalisation non supportée');
      setLocationLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      setError('Position GPS requise');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Générer ID unique
      let idUnique = generateUniqueId();
      const idQuery = query(collection(db, 'users'), where('idUnique', '==', idUnique));
      const idSnapshot = await getDocs(idQuery);
      
      while (!idSnapshot.empty) {
        idUnique = generateUniqueId();
        const retryQuery = query(collection(db, 'users'), where('idUnique', '==', idUnique));
        const retrySnapshot = await getDocs(retryQuery);
        if (retrySnapshot.empty) break;
      }
      
      // Créer profil sans undefined
      const newUser: any = {
        id: userId,
        idUnique,
        lat: location.lat,
        lon: location.lon,
        nationality: formData.nationality,
        showRealName: false,
        showLocation: true,
        createdAt: new Date(),
        lastActive: new Date(),
        friendCount: 0,
      };
      
      if (formData.displayName) newUser.displayName = formData.displayName;
      if (userEmail) newUser.email = userEmail;
      if (location.commune) newUser.commune = location.commune;
      if (location.departement) newUser.departement = location.departement;
      if (location.region) newUser.region = location.region;
      if (formData.age) newUser.age = parseInt(formData.age);
      
      await setDoc(doc(db, 'users', userId), newUser);
      
      onComplete();
    } catch (err: any) {
      console.error('Erreur création profil:', err);
      setError(err.message || 'Erreur lors de la création');
      setSubmitting(false);
    }
  };

  if (locationLoading) {
    return (
      <div className="text-center py-8">
        <FaSpinner className="animate-spin text-white text-3xl mb-3 mx-auto" />
        <p className="text-gray-400">Détection de votre position...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {location && (
        <div className="text-center text-xs text-gray-500 mb-4">
          GPS: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
        </div>
      )}

      {/* Nom */}
      <div>
        <label className="block text-white mb-2 text-sm font-medium">
          Nom <span className="text-gray-500 font-normal">(optionnel)</span>
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="Votre nom"
          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white/40"
        />
      </div>

      {/* Âge */}
      <div>
        <label className="block text-white mb-2 text-sm font-medium">
          Âge <span className="text-gray-500 font-normal">(optionnel)</span>
        </label>
        <input
          type="number"
          min="13"
          max="120"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          placeholder="25"
          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white/40"
        />
      </div>

      {/* Nationalité */}
      <div>
        <label className="block text-white mb-2 text-sm font-medium">
          Nationalité <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
          required
          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 cursor-pointer"
          style={{ backgroundColor: '#000', color: '#fff' }}
        >
          <option value="" style={{ backgroundColor: '#000', color: '#999' }}>
            Sélectionnez
          </option>
          <option value="Ivoirienne" style={{ backgroundColor: '#000', color: '#fff' }}>
            🇨🇮 Ivoirienne
          </option>
          <option value="Burkinabé" style={{ backgroundColor: '#000', color: '#fff' }}>
            🇧🇫 Burkinabé
          </option>
          <option value="Malienne" style={{ backgroundColor: '#000', color: '#fff' }}>
            🇲🇱 Malienne
          </option>
          <option value="Sénégalaise" style={{ backgroundColor: '#000', color: '#fff' }}>
            🇸🇳 Sénégalaise
          </option>
          <option value="Française" style={{ backgroundColor: '#000', color: '#fff' }}>
            🇫🇷 Française
          </option>
          <option value="Autre" style={{ backgroundColor: '#000', color: '#fff' }}>
            🌍 Autre
          </option>
        </select>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !formData.nationality}
        className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <FaSpinner className="animate-spin" />
            <span>Création...</span>
          </>
        ) : (
          <span>Accéder à la carte</span>
        )}
      </button>
    </form>
  );
}
