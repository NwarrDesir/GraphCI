/**
 * Panneau de simulation pour développeurs
 * Permet de créer des signalements de test sans être en Côte d'Ivoire
 */

'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { CITIES, PRODUCTS } from '@/lib/types';
import {
  generateRandomReport,
  generateMultipleReports,
  generateCluster,
  generateTestScenario,
} from '@/lib/utils/simulator';
import { FaFlask, FaTimes, FaRandom, FaLayerGroup, FaDatabase } from 'react-icons/fa';

export default function SimulatorPanel() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [count, setCount] = useState(10);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const addReportsToFirestore = async (reports: any[]) => {
    setLoading(true);
    try {
      const promises = reports.map((report) =>
        addDoc(collection(db, COLLECTIONS.REPORTS), {
          ...report,
          timestamp: Timestamp.now(),
          user_id: user?.uid || 'simulator',
          simulated: true, // Marqueur pour identifier les données de test
        })
      );

      await Promise.all(promises);
      showMessage(`✅ ${reports.length} signalement(s) créé(s)`);
    } catch (error) {
      console.error('Erreur simulation:', error);
      showMessage('Erreur lors de la simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomReport = async () => {
    const report = generateRandomReport(selectedCity || undefined);
    await addReportsToFirestore([report]);
  };

  const handleMultipleReports = async () => {
    const reports = generateMultipleReports(count, selectedCity || undefined);
    await addReportsToFirestore(reports);
  };

  const handleCluster = async () => {
    const city = selectedCity || 'Abidjan';
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const reports = generateCluster(city, product as any, 5);
    await addReportsToFirestore(reports);
  };

  const handleTestScenario = async () => {
    const reports = generateTestScenario();
    await addReportsToFirestore(reports);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 bg-purple-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition"
        aria-label="Ouvrir simulateur"
        title="Mode développeur - Simulateur"
      >
        <FaFlask className="text-xl" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 glass rounded-2xl p-6 w-96 animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center space-x-2">
          <FaFlask className="text-purple-400" />
          <span>Simulateur Dev</span>
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:opacity-70 transition"
        >
          <FaTimes />
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Créez des signalements de test avec des coordonnées GPS réelles de Côte d'Ivoire
      </p>

      {/* City selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Ville (optionnel)</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm"
        >
          <option value="">Toutes les villes (aléatoire)</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Single random */}
        <button
          onClick={handleRandomReport}
          disabled={loading}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
        >
          <span className="flex items-center space-x-2">
            <FaRandom />
            <span className="text-sm">1 signalement aléatoire</span>
          </span>
        </button>

        {/* Multiple random */}
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
            min="1"
            max="100"
            className="w-20 bg-white/10 border border-white/20 rounded px-2 py-2 text-sm"
          />
          <button
            onClick={handleMultipleReports}
            disabled={loading}
            className="flex-1 flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
          >
            <span className="flex items-center space-x-2">
              <FaLayerGroup />
              <span className="text-sm">signalements</span>
            </span>
          </button>
        </div>

        {/* Cluster */}
        <button
          onClick={handleCluster}
          disabled={loading}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition disabled:opacity-50"
        >
          <span className="flex items-center space-x-2">
            <FaLayerGroup />
            <span className="text-sm">Cluster de 5 vendeurs proches</span>
          </span>
          <span className="text-xs text-gray-400">&lt;30m</span>
        </button>

        {/* Test scenario */}
        <button
          onClick={handleTestScenario}
          disabled={loading}
          className="w-full flex items-center justify-between px-4 py-3 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition disabled:opacity-50"
        >
          <span className="flex items-center space-x-2">
            <FaDatabase />
            <span className="text-sm">Scénario complet (36 signalements)</span>
          </span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="mt-4 p-3 rounded-lg bg-white/10 border border-white/20 text-sm text-center">
          {message}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-xs text-yellow-400">
          ⚠️ Mode développement uniquement. Les données créées sont marquées comme simulées.
        </p>
      </div>
    </div>
  );
}
