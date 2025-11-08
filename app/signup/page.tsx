'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { reverseGeocode } from '@/lib/utils/geocoding';
import { generateUniqueId } from '@/lib/utils/userUtils';
import { FaMapMarkerAlt, FaUser, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import type { User } from '@/lib/types';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    nationality: '',
    bio: '',
    showRealName: false,
    showLocation: true,
  });
  
  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
    commune?: string;
    departement?: string;
    region?: string;
  } | null>(null);
  
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Vérifier si l'utilisateur a déjà un profil
  useEffect(() => {
    if (!authLoading && user) {
      // Vérifier si le profil existe déjà
      const checkProfile = async () => {
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (profileDoc.exists()) {
            // Profil existe déjà, rediriger vers la carte
            console.log('✅ Profil existe, redirection vers /map');
            router.push('/map');
          } else {
            // Pas de profil, rester sur signup
            console.log('⚠️ Pas de profil, affichage du formulaire');
            setCheckingProfile(false);
          }
        } catch (err) {
          console.error('Erreur vérification profil:', err);
          setCheckingProfile(false);
        }
      };
      
      checkProfile();
    } else if (!authLoading) {
      setCheckingProfile(false);
    }
  }, [user, authLoading, router]);

  // Obtenir la géolocalisation automatiquement
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          try {
            const locationInfo = await reverseGeocode(lat, lon);
            
            // MODE DEV: Accepter toutes les localisations (pas seulement CI)
            // TODO: Activer cette validation en production
            // if (!locationInfo.isInCoteDIvoire) {
            //   setLocationError('Vous devez être en Côte d\'Ivoire pour vous inscrire');
            //   setLocationLoading(false);
            //   return;
            // }
            
            // Si pas en CI, utiliser des valeurs par défaut pour le dev
            setLocation({
              lat,
              lon,
              commune: locationInfo.commune || 'Inconnue',
              departement: locationInfo.departement || 'Hors CI',
              region: locationInfo.region || locationInfo.isInCoteDIvoire ? locationInfo.region : 'Développement',
            });
            setLocationLoading(false);
          } catch (err) {
            console.error('Erreur géolocalisation:', err);
            // En cas d'erreur, permettre quand même l'inscription avec coordonnées seulement
            setLocation({
              lat,
              lon,
              region: 'Position détectée',
            });
            setLocationLoading(false);
          }
        },
        (err) => {
          setLocationError('Veuillez autoriser l\'accès à votre position');
          setLocationLoading(false);
        }
      );
    } else {
      setLocationError('Géolocalisation non supportée par votre navigateur');
      setLocationLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !location) {
      setError('Connectez-vous d\'abord et autorisez la géolocalisation');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Générer un ID unique
      let idUnique = generateUniqueId();
      
      // Vérifier l'unicité (très peu probable de collision avec 32^8 combinaisons)
      const idQuery = query(collection(db, 'users'), where('idUnique', '==', idUnique));
      const idSnapshot = await getDocs(idQuery);
      
      // Si collision (ultra rare), régénérer
      while (!idSnapshot.empty) {
        idUnique = generateUniqueId();
        const retryQuery = query(collection(db, 'users'), where('idUnique', '==', idUnique));
        const retrySnapshot = await getDocs(retryQuery);
        if (retrySnapshot.empty) break;
      }
      
      // Créer le profil utilisateur (supprimer les undefined pour Firestore)
      const newUser: any = {
        id: user.uid,
        idUnique,
        lat: location.lat,
        lon: location.lon,
        nationality: formData.nationality,
        showRealName: formData.showRealName,
        showLocation: formData.showLocation,
        createdAt: new Date(),
        lastActive: new Date(),
        friendCount: 0,
      };
      
      // Ajouter les champs optionnels seulement s'ils existent
      if (formData.displayName) newUser.displayName = formData.displayName;
      if (user.email) newUser.email = user.email;
      if (user.photoURL) newUser.photoURL = user.photoURL;
      if (location.commune) newUser.commune = location.commune;
      if (location.departement) newUser.departement = location.departement;
      if (location.region) newUser.region = location.region;
      if (formData.age) newUser.age = parseInt(formData.age);
      if (formData.bio) newUser.bio = formData.bio;
      
      // Sauvegarder dans Firestore
      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // Rediriger vers la carte
      console.log('✅ Profil créé, redirection vers /map');
      router.push('/map');
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
      setSubmitting(false);
    }
  };

  if (authLoading || checkingProfile || locationLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-white text-4xl mb-4 mx-auto" />
          <p className="text-white">
            {authLoading ? 'Chargement...' : checkingProfile ? 'Vérification du profil...' : 'Détection de votre position...'}
          </p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 max-w-md w-full text-center">
          <FaMapMarkerAlt className="text-red-500 text-5xl mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-white mb-4">
            Erreur de localisation
          </h1>
          <p className="text-gray-300 mb-6">{locationError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3">
            Créer votre profil
          </h1>
          <p className="text-gray-500">
            Position GPS: {location?.lat.toFixed(4)}, {location?.lon.toFixed(4)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom d'affichage */}
          <div>
            <label className="block text-white mb-2 font-medium">
              Nom <span className="text-gray-500 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Votre nom"
              className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Âge */}
          <div>
            <label className="block text-white mb-2 font-medium">
              Âge <span className="text-gray-500 font-normal">(optionnel)</span>
            </label>
            <input
              type="number"
              min="13"
              max="120"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="25"
              className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Nationalité */}
          <div>
            <label className="block text-white mb-2 font-medium">
              Nationalité <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              required
              className="w-full px-4 py-3.5 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 cursor-pointer font-medium"
              style={{ 
                backgroundColor: '#000',
                color: '#fff'
              }}
            >
              <option value="" style={{ backgroundColor: '#000', color: '#999' }}>
                Sélectionnez votre nationalité
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
              <option value="Ghanéenne" style={{ backgroundColor: '#000', color: '#fff' }}>
                🇬🇭 Ghanéenne
              </option>
              <option value="Nigériane" style={{ backgroundColor: '#000', color: '#fff' }}>
                🇳🇬 Nigériane
              </option>
              <option value="Béninoise" style={{ backgroundColor: '#000', color: '#fff' }}>
                🇧🇯 Béninoise
              </option>
              <option value="Togolaise" style={{ backgroundColor: '#000', color: '#fff' }}>
                🇹🇬 Togolaise
              </option>
              <option value="Guinéenne" style={{ backgroundColor: '#000', color: '#fff' }}>
                🇬🇳 Guinéenne
              </option>
              <option value="Française" style={{ backgroundColor: '#000', color: '#fff' }}>
                🇫🇷 Française
              </option>
              <option value="Libanaise" style={{ backgroundColor: '#000', color: '#fff' }}>
                🇱🇧 Libanaise
              </option>
              <option value="Chinoise" style={{ backgroundColor: '#000', color: '#fff' }}>
                🇨🇳 Chinoise
              </option>
              <option value="Autre" style={{ backgroundColor: '#000', color: '#fff' }}>
                🌍 Autre
              </option>
            </select>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !formData.nationality}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-green-500 text-white rounded-lg hover:scale-[1.02] transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Connexion...</span>
              </>
            ) : (
              <span>Accéder à GraphCI</span>
            )}
          </button>
          
          <p className="text-center text-gray-600 text-sm">
            Vos données sont sécurisées et chiffrées
          </p>
        </form>
      </div>
    </div>
  );
}
