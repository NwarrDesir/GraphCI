'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { reverseGeocode, type LocationInfo } from '@/lib/utils/geocoding';
import { PRODUCTS } from '@/lib/types';
import { FaTimes, FaCheckCircle, FaMapMarkerAlt, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const { user } = useAuth();
  const { latitude, longitude, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();
  
  const [product, setProduct] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Géocodage inverse automatique quand les coordonnées changent
  useEffect(() => {
    if (latitude && longitude) {
      setLoadingLocation(true);
      reverseGeocode(latitude, longitude)
        .then(info => {
          setLocationInfo(info);
          if (!info.isInCoteDIvoire) {
            setError('Vous devez être en Côte d\'Ivoire pour signaler un vendeur');
          }
        })
        .catch(err => {
          console.error('Geocoding error:', err);
          setError('Erreur de localisation');
        })
        .finally(() => setLoadingLocation(false));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (isOpen && !latitude && !longitude) {
      getCurrentPosition();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!latitude || !longitude) {
      setError('Géolocalisation requise');
      return;
    }

    if (!locationInfo || !locationInfo.isInCoteDIvoire) {
      setError('Vous devez être en Côte d\'Ivoire');
      return;
    }

    if (!product) {
      setError('Veuillez sélectionner un produit');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await addDoc(collection(db, COLLECTIONS.REPORTS), {
        lat: latitude,
        lon: longitude,
        product,
        vendor_name: vendorName || undefined,
        city: locationInfo.commune || locationInfo.departement || locationInfo.region || 'Inconnu',
        region: locationInfo.region,
        departement: locationInfo.departement,
        commune: locationInfo.commune,
        timestamp: Timestamp.now(),
        user_id: user?.uid || 'anonymous',
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setProduct('');
        setVendorName('');
        setLocationInfo(null);
      }, 2000);
    } catch (err) {
      console.error('Error creating report:', err);
      setError('Erreur lors du signalement');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="glass rounded-2xl p-6 w-full max-w-md animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <FaMapMarkerAlt />
            <span>Signaler un vendeur</span>
          </h2>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition"
            aria-label="Fermer"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <FaCheckCircle className="text-6xl text-green-400 mx-auto mb-4" />
            <p className="text-lg font-medium">Signalement enregistré !</p>
            <p className="text-sm text-gray-400 mt-2">Merci pour votre contribution</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Geolocation status */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center space-x-2">
                  <FaMapMarkerAlt />
                  <span>Géolocalisation</span>
                </span>
                {geoLoading ? (
                  <span className="text-sm text-gray-400">Détection...</span>
                ) : latitude && longitude ? (
                  <span className="text-sm text-green-400 flex items-center space-x-1">
                    <FaCheckCircle />
                    <span>Activée</span>
                  </span>
                ) : (
                  <span className="text-sm text-red-400 flex items-center space-x-1">
                    <FaExclamationTriangle />
                    <span>Erreur</span>
                  </span>
                )}
              </div>
              {geoError && (
                <p className="text-xs text-red-400 mt-1">{geoError}</p>
              )}
              {!geoLoading && !latitude && (
                <button
                  type="button"
                  onClick={getCurrentPosition}
                  className="mt-2 text-xs text-blue-400 hover:underline"
                >
                  Réessayer
                </button>
              )}
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Produit vendu <span className="text-red-400">*</span>
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-white/40"
              >
                <option value="">-- Sélectionner --</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom du vendeur (optionnel)
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Ex: Tante Marie, Amadou..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Localisation automatique */}
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-blue-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Localisation automatique</p>
                  {loadingLocation ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <FaSpinner className="animate-spin" />
                      <span>Détection en cours...</span>
                    </div>
                  ) : locationInfo ? (
                    <div className="text-xs space-y-1">
                      {locationInfo.isInCoteDIvoire ? (
                        <>
                          <div className="text-green-400 font-medium">
                            <FaCheckCircle className="inline mr-1" />
                            Côte d'Ivoire
                          </div>
                          {locationInfo.commune && (
                            <div className="text-gray-300">Commune: {locationInfo.commune}</div>
                          )}
                          {locationInfo.departement && (
                            <div className="text-gray-300">Département: {locationInfo.departement}</div>
                          )}
                          {locationInfo.region && (
                            <div className="text-gray-300">Région: {locationInfo.region}</div>
                          )}
                        </>
                      ) : (
                        <div className="text-red-400 font-medium">
                          <FaExclamationTriangle className="inline mr-1" />
                          Hors de la Côte d'Ivoire
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">En attente de la géolocalisation...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !latitude || !longitude || !locationInfo?.isInCoteDIvoire || loadingLocation}
              className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enregistrement...' : loadingLocation ? 'Localisation...' : 'Signaler'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
