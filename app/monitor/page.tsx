'use client';

/**
 * Dashboard de Monitoring en Temps Réel
 * Page : /monitor
 * 
 * Permet de voir l'évolution de l'app en direct
 */

import { useEffect, useState } from 'react';
import { FaSync, FaTrash, FaRandom, FaLayerGroup, FaChartLine, FaMapMarkedAlt, FaCog, FaChartBar, FaCircle, FaExclamationTriangle } from 'react-icons/fa';

interface Stats {
  global: {
    total: number;
    simulated: number;
    real: number;
    users: number;
  };
  byCity: Record<string, number>;
  byProduct: Record<string, number>;
  recent: any[];
  timestamp: string;
}

export default function MonitorPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [message, setMessage] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      
      // Vérifier si les données sont valides
      if (data.global && data.byCity && data.byProduct) {
        setStats(data);
      } else {
        console.error('Format de données invalide:', data);
        setMessage('Erreur: ' + (data.error || 'Format invalide'));
      }
    } catch (error) {
      console.error('Erreur fetch stats:', error);
      setMessage('Erreur de connexion à l\'API');
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 3000); // Refresh toutes les 3s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleSimulate = async (count: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      setMessage(`${data.count} signalement(s) créé(s)`);
      await fetchStats();
    } catch (error) {
      setMessage('Erreur lors de la simulation');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCluster = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 }),
      });
      const data = await res.json();
      setMessage(`Cluster créé : ${data.count} utilisateurs`);
      await fetchStats();
    } catch (error) {
      setMessage('Erreur lors de la création du cluster');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleClean = async () => {
    if (!confirm('Supprimer tous les signalements simulés ?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/reports/clean', { method: 'POST' });
      const data = await res.json();
      setMessage(`${data.deleted} signalement(s) supprimé(s)`);
      await fetchStats();
    } catch (error) {
      setMessage('Erreur lors du nettoyage');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <FaChartLine />
              <span>Dashboard de Monitoring</span>
            </h1>
            <p className="text-gray-400 mt-2">Observez l'évolution de l'app en temps réel</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                autoRefresh ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              <FaCircle className={autoRefresh ? 'text-red-400' : 'text-gray-400'} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition flex items-center space-x-2"
            >
              <FaSync />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="glass p-4 rounded-lg text-center animate-fadeIn flex items-center justify-center gap-2">
            {message.startsWith('Erreur') && <FaExclamationTriangle className="text-red-500" />}
            {message}
          </div>
        )}

        {/* Loading ou Stats */}
        {!stats ? (
          <div className="glass p-12 rounded-xl text-center">
            <div className="animate-spin text-4xl mb-4">
              <FaSync />
            </div>
            <div className="text-xl">Chargement des statistiques...</div>
          </div>
        ) : (
          <>
            {/* Stats Globales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass p-6 rounded-xl">
                <div className="text-gray-400 text-sm mb-2">Total Signalements</div>
                <div className="text-4xl font-bold">{stats.global.total}</div>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <div className="text-gray-400 text-sm mb-2">Simulés</div>
                <div className="text-4xl font-bold text-purple-400">{stats.global.simulated}</div>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <div className="text-gray-400 text-sm mb-2">Réels</div>
                <div className="text-4xl font-bold text-green-400">{stats.global.real}</div>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <div className="text-gray-400 text-sm mb-2">Utilisateurs</div>
                <div className="text-4xl font-bold text-blue-400">{stats.global.users}</div>
              </div>
            </div>

        {/* Actions Rapides */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Actions Rapides</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={() => handleSimulate(1)}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex flex-col items-center space-y-2"
            >
              <FaRandom />
              <span className="text-sm">1 signalement</span>
            </button>
            
            <button
              onClick={() => handleSimulate(10)}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex flex-col items-center space-y-2"
            >
              <FaLayerGroup />
              <span className="text-sm">10 signalements</span>
            </button>
            
            <button
              onClick={() => handleSimulate(50)}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex flex-col items-center space-y-2"
            >
              <FaLayerGroup />
              <span className="text-sm">50 signalements</span>
            </button>
            
            <button
              onClick={handleCluster}
              disabled={loading}
              className="px-4 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex flex-col items-center space-y-2"
            >
              <FaMapMarkedAlt />
              <span className="text-sm">Cluster (5)</span>
            </button>
            
            <button
              onClick={handleClean}
              disabled={loading}
              className="px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex flex-col items-center space-y-2"
            >
              <FaTrash />
              <span className="text-sm">Nettoyer</span>
            </button>
          </div>
        </div>

        {/* Par Ville */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Signalements par Ville</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(stats.byCity)
              .sort(([, a], [, b]) => b - a)
              .map(([city, count]) => (
                <div key={city} className="bg-white/5 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">{city}</div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Par Produit */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Signalements par Produit</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.byProduct)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([product, count]) => (
                <div key={product} className="bg-white/5 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">{product.replace(/_/g, ' ')}</div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Derniers Signalements */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Derniers Signalements</h2>
          
          <div className="space-y-2">
            {stats.recent.map((report, i) => (
              <div key={report.id} className="bg-white/5 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-gray-400 w-6">{i + 1}</div>
                  <div>
                    <div className="font-medium">{report.product.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-400">{report.city}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {report.simulated && (
                    <span className="px-2 py-1 bg-purple-600/30 text-purple-400 text-xs rounded">
                      Simulé
                    </span>
                  )}
                  <div className="text-sm text-gray-400">
                    {new Date(report.timestamp?.seconds * 1000).toLocaleTimeString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Dernière mise à jour : {new Date(stats.timestamp).toLocaleTimeString('fr-FR')}</span>
            <a href="/" className="hover:text-white transition">← Retour à l'app</a>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
