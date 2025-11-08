'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap, GeoJSON as LeafletGeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User, Friendship } from '@/lib/types';
import { haversine } from '@/lib/utils/haversine';
import { getCoteDIvoireGeometry, getCoteDIvoireBounds } from '@/lib/utils/geocoding';
import { getDisplayName, getDisplayLocation } from '@/lib/utils/userUtils';
import { buildGraph, Graph } from '@/lib/utils/graph';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FaSearchPlus, FaSearchMinus, FaSync, FaMapMarkedAlt, FaProjectDiagram, FaUsers, FaMapMarkerAlt, FaClock, FaBullseye, FaFire, FaGlobe, FaChartBar, FaUser, FaEnvelope, FaUserPlus } from 'react-icons/fa';
import UserProfilePopup from '@/components/User/UserProfilePopup';
import AffinityTestModal from '@/components/Affinity/AffinityTestModal';
import FloatingChatWindow from '@/components/Chat/FloatingChatWindow';

// Types de modes de graphe
type GraphMode = 
  | 'ALL' // Tous les utilisateurs
  | 'FRIENDS_ONLY' // Seulement les liens d'amitié
  | 'PROXIMITY' // Seulement les clusters géographiques
  | 'BY_NATIONALITY' // Grouper par nationalité
  | 'BY_AGE' // Grouper par tranches d'âge

interface GraphViewProps {
  users: User[];
  currentUserId?: string;
}

/**
 * Composant pour l'auto-zoom initial
 */
function MapInitializer() {
  const map = useMap();
  const [initialZoomDone, setInitialZoomDone] = useState(false);

  useEffect(() => {
    if (!initialZoomDone) {
      getCoteDIvoireBounds().then(bounds => {
        const leafletBounds = L.latLngBounds(
          L.latLng(bounds[0][0], bounds[0][1]),
          L.latLng(bounds[1][0], bounds[1][1])
        );
        map.fitBounds(leafletBounds, { padding: [50, 50] });
        setInitialZoomDone(true);
      });
    }
  }, [map, initialZoomDone]);

  return null;
}

/**
 * GraphView avec CARTE INVISIBLE
 * - Utilise Leaflet pour positionnement GPS EXACT
 * - Mais la carte est CACHÉE (fond noir, pas de tiles visibles)
 * - Seulement les points et arêtes visibles
 */
/**
 * Couleurs par COMMUNE (au lieu de nationalité)
 * Chaque commune a sa couleur distinctive
 */
const COMMUNE_COLORS: Record<string, string> = {
  // Abidjan et quartiers
  'cocody': '#FF6B35',        // Orange vif
  'plateau': '#004E89',       // Bleu foncé
  'yopougon': '#00A896',      // Turquoise
  'abobo': '#7209B7',         // Violet
  'adjamé': '#F72585',        // Rose vif
  'treichville': '#4CC9F0',   // Bleu clair
  'marcory': '#FFB703',       // Jaune or
  'koumassi': '#06FFA5',      // Vert menthe
  'port-bouët': '#FF006E',    // Rose fuchsia
  'abidjan': '#FF8500',       // Orange (fallback pour Abidjan)
  
  // Autres villes importantes
  'yamoussoukro': '#FFD60A',  // Jaune doré
  'bouaké': '#0A9396',        // Turquoise foncé
  'daloa': '#94D2BD',         // Vert menthe
  'san-pédro': '#E63946',     // Rouge
  'san-pedro': '#E63946',     // Rouge (variante)
  'korhogo': '#457B9D',       // Bleu gris
  'man': '#2A9D8F',           // Teal
  'abengourou': '#8338EC',    // Violet clair
  'facobly': '#3A86FF',       // Bleu électrique
  
  // Fallback
  'inconnue': '#CCCCCC',      // Gris
  'null': '#CCCCCC',          // Gris
  'undefined': '#CCCCCC',     // Gris
};

/**
 * Obtenir la couleur d'un utilisateur selon sa commune
 * Compte de test = Orange spécial
 */
function getUserColor(user: User): string {
  // Compte de test = couleur spéciale
  if ((user as any).isTestAccount || user.idUnique === 'CI-TEST-0001') {
    return '#FF6B35'; // Orange vif pour le compte test (Cocody)
  }
  
  // Normaliser le nom de la commune (minuscules, sans espaces)
  const commune = (user.commune || 'inconnue').toLowerCase().trim();
  
  // Couleur selon la commune (avec fallback blanc si non trouvée)
  return COMMUNE_COLORS[commune] || '#FFFFFF';
}

export default function GraphView({ users, currentUserId }: GraphViewProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBorders, setShowBorders] = useState(true);
  const [graphMode, setGraphMode] = useState<GraphMode>('FRIENDS_ONLY');
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [showGraphOptions, setShowGraphOptions] = useState(false);
  const [showAffinityTest, setShowAffinityTest] = useState(false);
  const [testOwnerUserId, setTestOwnerUserId] = useState<string | null>(null);
  const [openChats, setOpenChats] = useState<Array<{ userId: string; userName: string; userIdUnique: string; position: { x: number; y: number } }>>([]);
  const mapRef = useRef<L.Map | null>(null);

  // Charger les frontières de la Côte d'Ivoire
  useEffect(() => {
    getCoteDIvoireGeometry().then(data => {
      setGeojsonData(data);
    });
  }, []);

  // Charger les AMITIÉS depuis Firestore
  useEffect(() => {
    const fetchFriendships = async () => {
      try {
        const friendshipsSnapshot = await getDocs(collection(db, 'friendships'));
        const friendshipsData = friendshipsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Friendship[];
        
        console.log('🔗 Friendships loaded:', friendshipsData.length);
        console.log('🔍 First 3 friendships:', friendshipsData.slice(0, 3));
        console.log('🔍 Friendship structure:', {
          keys: Object.keys(friendshipsData[0] || {}),
          sample: friendshipsData[0]
        });
        console.log('🔍 Accepted friendships:', friendshipsData.filter(f => f.status === 'accepted').length);
        
        setFriendships(friendshipsData);
      } catch (error) {
        console.error('Error loading friendships:', error);
      }
    };
    fetchFriendships();
  }, []);

  // Construire le GRAPHE mathématique
  useEffect(() => {
    if (users.length > 0 && friendships.length > 0) {
      console.log('🏗️ Building graph with:', { users: users.length, friendships: friendships.length });
      const acceptedFriendships = friendships.filter(f => f.status === 'accepted');
      console.log('✅ Accepted friendships for graph:', acceptedFriendships.length);
      
      const builtGraph = buildGraph(users, friendships);
      setGraph(builtGraph);
      
      console.log('📊 Graph construit:', {
        nodes: builtGraph.nodeCount,
        edges: builtGraph.edgeCount,
        density: builtGraph.getDensity().toFixed(4),
        components: builtGraph.getConnectedComponents().length
      });
      
      console.log('🔍 Graph edges sample:', builtGraph.getEdges().slice(0, 3));
    }
  }, [users, friendships]);

  // DEBUG: Afficher le nombre d'utilisateurs
  useEffect(() => {
    console.log('📊 Users count:', users.length);
    if (users.length > 0) {
      console.log('📍 First user:', users[0]);
    }
  }, [users]);

  // Centre de la Côte d'Ivoire
  const CI_CENTER: [number, number] = [7.5, -5.5];
  
  // Créer un Map pour lookup rapide des users par ID
  const userMap = new Map(users.map(u => [u.id, u]));
  
  // Fonction pour vérifier si deux utilisateurs sont déjà amis
  const areUsersFriends = (userId1: string, userId2: string): boolean => {
    return friendships.some(f => 
      f.status === 'accepted' && (
        (f.userId1 === userId1 && f.userId2 === userId2) ||
        (f.userId1 === userId2 && f.userId2 === userId1)
      )
    );
  };
  
  // Handler pour démarrer le test d'affinité
  const handleStartAffinityTest = () => {
    if (selectedUser) {
      setTestOwnerUserId(selectedUser.id);
      setShowAffinityTest(true);
    }
  };
  
  // Calculer les arêtes selon le MODE sélectionné
  const edges: Array<{ from: User; to: User; color?: string; weight?: number }> = [];
  
  if (graphMode === 'FRIENDS_ONLY' && graph) {
    // Mode FRIENDS_ONLY : utiliser le GRAPHE MATHÉMATIQUE
    const graphEdges = graph.getEdges();
    console.log('🔗 Mode FRIENDS_ONLY - Graph edges:', graphEdges.length);
    
    if (graphEdges.length > 0) {
      console.log('🔍 First graph edge:', graphEdges[0]);
      console.log('🔍 User map size:', userMap.size);
      console.log('🔍 Sample user IDs from map:', Array.from(userMap.keys()).slice(0, 3));
    }
    
    graphEdges.forEach(edge => {
      const user1 = userMap.get(edge.source);
      const user2 = userMap.get(edge.target);
      
      if (!user1) console.warn('⚠️ User1 not found:', edge.source);
      if (!user2) console.warn('⚠️ User2 not found:', edge.target);
      
      if (user1 && user2) {
        edges.push({
          from: user1,
          to: user2,
          color: '#FFFFFF', // Blanc pur pour les amitiés
          weight: 2,
        });
      }
    });
    console.log('✅ Edges à afficher (FRIENDS_ONLY):', edges.length);
  } else {
    // Autres modes : calculer par proximité/critères
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const distance = haversine(
          users[i].lat,
          users[i].lon,
          users[j].lat,
          users[j].lon
        );
        
        // Mode ALL : toutes connexions <200m
        if (graphMode === 'ALL' && distance <= 200) {
          edges.push({ from: users[i], to: users[j] });
        }
        
        // Mode BY_NATIONALITY : seulement même nationalité + <200m
        else if (graphMode === 'BY_NATIONALITY' && distance <= 200 && users[i].nationality === users[j].nationality) {
          const nationalityColor = getUserColor(users[i]);
          edges.push({ 
            from: users[i], 
            to: users[j],
            color: nationalityColor,
            weight: 2,
          });
        }
        
        // Mode BY_AGE : seulement si âges proches (±5 ans)
        else if (graphMode === 'BY_AGE' && distance <= 200) {
          const age1 = users[i].age;
          const age2 = users[j].age;
          if (age1 && age2) {
            const ageDiff = Math.abs(age1 - age2);
            if (ageDiff <= 5) {
              edges.push({ 
                from: users[i], 
                to: users[j],
                color: '#00FF00',
                weight: 2,
              });
            }
          }
        }
      }
    }
  }

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleReset = () => {
    if (mapRef.current && users.length > 0) {
      const lats = users.map(u => u.lat);
      const lons = users.map(u => u.lon);
      const bounds = L.latLngBounds(
        L.latLng(Math.min(...lats), Math.min(...lons)),
        L.latLng(Math.max(...lats), Math.max(...lons))
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl mb-2">Aucun utilisateur</p>
          <p className="text-sm text-gray-400">
            Soyez le premier à vous inscrire !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Contrôles de zoom */}
      <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="glass w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
          aria-label="Zoom in"
        >
          <FaSearchPlus />
        </button>
        <button
          onClick={handleZoomOut}
          className="glass w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
          aria-label="Zoom out"
        >
          <FaSearchMinus />
        </button>
        <button
          onClick={handleReset}
          className="glass w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
          aria-label="Reset view"
        >
          <FaSync />
        </button>
        
        {/* Toggle frontières CI */}
        <button
          onClick={() => setShowBorders(!showBorders)}
          className="glass w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
          title={showBorders ? "Cacher les frontières" : "Afficher les frontières"}
        >
          {showBorders ? <FaGlobe /> : <FaMapMarkerAlt />}
        </button>
      </div>

      {/* BOUTON POUR AFFICHER LES OPTIONS DE GRAPHE */}
      <button
        onClick={() => setShowGraphOptions(!showGraphOptions)}
        className="absolute top-20 left-4 z-[1000] w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-100 transition-all"
        title="Options de graphe"
      >
        <FaProjectDiagram className="text-xl text-gray-700" />
      </button>

      {/* SÉLECTEUR DE MODE DE GRAPHE (affiché seulement si showGraphOptions = true) */}
      {showGraphOptions && (
        <div className="absolute top-20 left-20 z-[1000] glass rounded-lg p-4 shadow-2xl">
          <h3 className="text-sm font-bold mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
            <FaProjectDiagram />
            Mode de Graphe
          </h3>
        <div className="space-y-2">
          <button
            onClick={() => setGraphMode('ALL')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-75 text-xs flex items-center gap-2 ${
              graphMode === 'ALL' ? 'bg-white text-black font-bold' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <FaMapMarkedAlt />
            <div>
              <div>Tous</div>
              <div className="text-[10px] opacity-70">Toutes connexions &lt;200m</div>
            </div>
          </button>

          <button
            onClick={() => setGraphMode('FRIENDS_ONLY')}
            className={`w-full text-left px-3 py-2 rounded-lg transition text-xs flex items-center gap-2 ${
              graphMode === 'FRIENDS_ONLY' ? 'bg-white text-black font-bold' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <FaUsers />
            <div>
              <div>Amis uniquement</div>
              <div className="text-[10px] opacity-70">Réseau d'amitié</div>
            </div>
          </button>

          <button
            onClick={() => setGraphMode('BY_NATIONALITY')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-75 text-xs flex items-center gap-2 ${
              graphMode === 'BY_NATIONALITY' ? 'bg-white text-black font-bold' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <FaBullseye />
            <div>
              <div>Par Nationalité</div>
              <div className="text-[10px] opacity-70">Groupes nationaux</div>
            </div>
          </button>

          <button
            onClick={() => setGraphMode('BY_AGE')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-75 text-xs flex items-center gap-2 ${
              graphMode === 'BY_AGE' ? 'bg-white text-black font-bold' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <FaClock />
            <div>
              <div>Par Âge</div>
              <div className="text-[10px] opacity-70">Groupes d'âge ±5 ans</div>
            </div>
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-gray-400">
          {graphMode === 'ALL' && (
            <div className="flex items-center gap-1">
              <FaMapMarkedAlt className="text-white" />
              <span>Affiche toutes les connexions</span>
            </div>
          )}
          {graphMode === 'FRIENDS_ONLY' && (
            <div className="flex items-center gap-1">
              <FaUsers className="text-white" />
              <span>Réseau d'amis validés</span>
            </div>
          )}
          {graphMode === 'BY_NATIONALITY' && (
            <div className="flex items-center gap-1">
              <FaBullseye className="text-white" />
              <span>Groupes par nationalité</span>
            </div>
          )}
          {graphMode === 'BY_AGE' && (
            <div className="flex items-center gap-1">
              <FaClock className="text-white" />
              <span>Groupes d'âge similaire</span>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Stats */}
      <div className="absolute top-20 right-20 z-[1000] glass rounded-lg p-3 text-xs">
        <div className="font-bold mb-2 text-center flex items-center justify-center gap-2">
          <FaChartBar />
          <span>Stats Graphe</span>
        </div>
        <div className="space-y-1 text-gray-400">
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-white" />
            <span>Utilisateurs: <span className="text-white font-bold">{users.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <FaProjectDiagram className="text-white" />
            <span>Connexions: <span className="text-white font-bold">{edges.length}</span></span>
          </div>
          <div className="pt-2 border-t border-white/10 mt-2">
            <div className="text-[10px]">Côte d'Ivoire</div>
            <div className="text-[10px]">NORD: Korhogo</div>
            <div className="text-[10px]">SUD: Abidjan</div>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="absolute bottom-4 left-4 z-[1000] glass rounded-lg p-4">
        <p className="text-xs font-medium mb-2">Mode: {graphMode}</p>
        <div className="space-y-1 text-xs">
          {graphMode === 'ALL' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>Utilisateur ({users.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-white/30"></div>
                <span>Proximité &lt;200m ({edges.length})</span>
              </div>
            </>
          )}
          {graphMode === 'FRIENDS_ONLY' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>Utilisateur ({users.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-white rounded-full"></div>
                <span className="font-medium text-white/80">Amitié ({edges.length})</span>
              </div>
            </>
          )}
          {graphMode === 'BY_NATIONALITY' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>Utilisateur ({users.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5" style={{ background: 'linear-gradient(to right, #FF8C00, #4169E1, #32CD32)' }}></div>
                <span>Même nationalité ({edges.length})</span>
              </div>
            </>
          )}
          {graphMode === 'BY_AGE' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>Utilisateur ({users.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-orange-600"></div>
                <span>Zone dense ({edges.length})</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CARTE LEAFLET (INVISIBLE par défaut) */}
      <style jsx global>{`
        .leaflet-container {
          background: #000000 !important;
        }
        .leaflet-tile-pane {
          opacity: 0 !important;
          display: none !important;
        }
        .leaflet-control-container {
          display: none !important;
        }
        .leaflet-marker-icon,
        .leaflet-marker-shadow {
          display: none !important;
        }
      `}</style>

      <MapContainer
        center={CI_CENTER}
        zoom={7}
        style={{ height: '100%', width: '100%', background: '#000000', cursor: 'pointer' }}
        zoomControl={false}
        ref={mapRef as any}
      >
        {/* Tiles (invisibles sauf si showMap=true) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* Frontières CI - RENDU EN PREMIER (arrière-plan) */}
        {showBorders && geojsonData && (
          <LeafletGeoJSON
            data={geojsonData}
            style={{
              fillColor: 'transparent',
              fillOpacity: 0,
              color: '#FFFFFF',
              weight: 2,
              opacity: 0.5,
            }}
            pane="overlayPane"
            interactive={false}
          />
        )}

        {/* Initialisation carte */}
        <MapInitializer />

        {/* ARÊTES DU GRAPHE - VISIBLES */}
        {edges.map((edge, idx) => (
          <Polyline
            key={`edge-${idx}`}
            positions={[
              [edge.from.lat, edge.from.lon],
              [edge.to.lat, edge.to.lon],
            ]}
            pathOptions={{
              color: edge.color || '#FFFFFF',
              weight: edge.weight || 2,
              opacity: 0.8,
              dashArray: undefined,
            }}
            interactive={false}
          />
        ))}

        {/* NŒUDS (utilisateurs) - EN DERNIER pour être cliquables */}
        {users.map((user) => {
          const radius = Math.max(5, Math.min(15, 5 + (user.friendCount || 0) * 0.5));
          const color = getUserColor(user);
          const isCurrentUser = user.id === currentUserId;

          // Marqueur spécial pour l'utilisateur connecté
          if (isCurrentUser) {
            return (
              <CircleMarker
                key={user.id}
                center={[user.lat, user.lon]}
                radius={radius * 2} // 2x plus grand
                pathOptions={{
                  fillColor: color,
                  color: '#FFD700', // Bordure dorée (or)
                  weight: 6, // Bordure très épaisse
                  opacity: 1,
                  fillOpacity: 1,
                }}
                pane="markerPane"
                bubblingMouseEvents={false}
                eventHandlers={{
                  click: (e) => {
                    console.log('🎯 User clicked!', user);
                    L.DomEvent.stopPropagation(e);
                    setSelectedUser(user);
                  },
                  mousedown: (e) => {
                    L.DomEvent.stopPropagation(e);
                  },
                }}
              />
            );
          }

          // Marqueur normal pour les autres utilisateurs
          return (
            <CircleMarker
              key={user.id}
              center={[user.lat, user.lon]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: '#FFFFFF',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
              }}
              pane="markerPane"
              bubblingMouseEvents={false}
              eventHandlers={{
                click: (e) => {
                  console.log('🎯 User clicked!', user);
                  L.DomEvent.stopPropagation(e);
                  setSelectedUser(user);
                },
                mousedown: (e) => {
                  L.DomEvent.stopPropagation(e);
                },
                mouseover: (e) => {
                  const target = e.target;
                  target.setStyle({
                    weight: 3,
                    fillOpacity: 1,
                  });
                },
                mouseout: (e) => {
                  const target = e.target;
                  target.setStyle({
                    weight: 2,
                    fillOpacity: 0.8,
                  });
                },
              }}
            />
          );
        })}
      </MapContainer>

      {/* Popup profil utilisateur avec système d'affinité */}
      {selectedUser && !showAffinityTest && (
        <UserProfilePopup
          user={selectedUser}
          currentUserId={currentUserId || null}
          isAlreadyFriend={currentUserId ? areUsersFriends(currentUserId, selectedUser.id) : false}
          onClose={() => setSelectedUser(null)}
          onStartAffinityTest={handleStartAffinityTest}
          onSendMessage={() => {
            // Ouvrir une fenêtre de chat
            const chatExists = openChats.some(chat => chat.userId === selectedUser.id);
            if (!chatExists && currentUserId) {
              setOpenChats([...openChats, {
                userId: selectedUser.id,
                userName: selectedUser.displayName || '',
                userIdUnique: selectedUser.idUnique,
                position: { 
                  x: 100 + (openChats.length * 50), // Décalage en cascade
                  y: 100 + (openChats.length * 30) 
                }
              }]);
            }
            setSelectedUser(null); // Fermer le popup
          }}
        />
      )}

      {/* Modal de test d'affinité */}
      {showAffinityTest && selectedUser && testOwnerUserId && currentUserId && (
        <AffinityTestModal
          testId={testOwnerUserId}
          testOwnerName={getDisplayName(selectedUser)}
          testTitle={selectedUser.displayName ? `Test de ${selectedUser.displayName}` : "Test d'affinité"}
          testDescription="Réponds à ces questions pour devenir ami"
          currentUserId={currentUserId}
          onClose={() => {
            setShowAffinityTest(false);
            setTestOwnerUserId(null);
          }}
          onSubmitted={(result) => {
            console.log('✅ Test soumis:', result);
            
            // Message personnalisé selon le statut
            let message = '';
            if (result.status === 'auto-approved') {
              message = `🎉 Vous avez des affinités avec ${selectedUser?.displayName || selectedUser?.idUnique}!\nVous êtes maintenant amis!`;
            } else if (result.status === 'manual-review') {
              message = `✅ Test soumis avec succès!\n${selectedUser?.displayName || selectedUser?.idUnique} doit maintenant valider vos réponses.`;
            } else if (result.status === 'rejected-auto') {
              message = `❌ Score insuffisant.\nVous devez attendre 2 semaines avant de retenter.`;
            }
            
            alert(message);
            
            setShowAffinityTest(false);
            setTestOwnerUserId(null);
            setSelectedUser(null);
            
            // Recharger les friendships si auto-approved
            if (result.status === 'auto-approved') {
              const fetchFriendships = async () => {
                try {
                  const friendshipsSnapshot = await getDocs(collection(db, 'friendships'));
                  const friendshipsData = friendshipsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  })) as Friendship[];
                  setFriendships(friendshipsData);
                } catch (error) {
                  console.error('Error reloading friendships:', error);
                }
              };
              fetchFriendships();
            }
          }}
        />
      )}

      {/* Fenêtres de chat flottantes */}
      {currentUserId && openChats.map((chat) => (
        <FloatingChatWindow
          key={chat.userId}
          currentUserId={currentUserId}
          targetUserId={chat.userId}
          targetUserName={chat.userName}
          targetUserIdUnique={chat.userIdUnique}
          initialPosition={chat.position}
          onClose={() => {
            setOpenChats(openChats.filter(c => c.userId !== chat.userId));
          }}
        />
      ))}
    </div>
  );
}
