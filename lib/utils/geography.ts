/**
 * Utilitaires géographiques pour la Côte d'Ivoire
 * Validation stricte du territoire ivoirien
 */

/**
 * Limites géographiques officielles de la Côte d'Ivoire
 * Source : Données géographiques officielles
 */
export const COTE_IVOIRE_BOUNDS = {
  minLat: 4.35,     // Sud (littoral de Grand-Bassam)
  maxLat: 10.74,    // Nord (Tengrela, frontière Mali/Burkina)
  minLon: -8.60,    // Ouest (Tabou, frontière Liberia)
  maxLon: -2.49,    // Est (frontière Ghana)
} as const;

/**
 * Coordonnées précises des villes principales de Côte d'Ivoire
 * Source : OpenStreetMap / Google Maps (vérifiées)
 */
export const MAJOR_CITIES = {
  // SUD (Littoral)
  'Abidjan': { 
    lat: 5.3600, 
    lon: -4.0083, 
    region: 'Lagunes',
    population: 4_700_000,
    description: 'Capitale économique, au bord de la lagune Ébrié'
  },
  'Grand-Bassam': {
    lat: 5.2110,
    lon: -3.7380,
    region: 'Sud-Comoé',
    population: 80_000,
    description: 'Ville côtière historique, ancienne capitale'
  },
  'San-Pédro': { 
    lat: 4.7487, 
    lon: -6.6364, 
    region: 'Bas-Sassandra',
    population: 200_000,
    description: 'Port important à l\'ouest'
  },
  
  // CENTRE
  'Yamoussoukro': { 
    lat: 6.8184, 
    lon: -5.2755, 
    region: 'Lacs',
    population: 355_000,
    description: 'Capitale politique, basilique Notre-Dame-de-la-Paix'
  },
  'Bouaké': { 
    lat: 7.6900, 
    lon: -5.0300, 
    region: 'Vallée du Bandama',
    population: 536_000,
    description: '2ème ville, carrefour commercial central'
  },
  'Daloa': { 
    lat: 6.8772, 
    lon: -6.4503, 
    region: 'Haut-Sassandra',
    population: 266_000,
    description: 'Ville du centre-ouest'
  },
  
  // NORD
  'Korhogo': { 
    lat: 9.4581, 
    lon: -5.6296, 
    region: 'Poro',
    population: 243_000,
    description: 'Grande ville du nord'
  },
  
  // OUEST
  'Man': { 
    lat: 7.4125, 
    lon: -7.5544, 
    region: 'Tonkpi',
    population: 149_000,
    description: 'Ville de montagne à l\'ouest'
  },
  
  // CENTRE-EST
  'Gagnoa': {
    lat: 6.1319,
    lon: -5.9506,
    region: 'Gôh',
    population: 160_000,
    description: 'Ville du centre-ouest'
  },
  'Divo': {
    lat: 5.8372,
    lon: -5.3572,
    region: 'Lôh-Djiboua',
    population: 127_000,
    description: 'Ville sur la route d\'Abidjan à San-Pédro'
  },
  
  // EST
  'Abengourou': {
    lat: 6.7294,
    lon: -3.4961,
    region: 'Indénié-Djuablin',
    population: 135_000,
    description: 'Ville de l\'est, proche du Ghana'
  },
} as const;

/**
 * Vérifie si des coordonnées GPS sont valides pour la Côte d'Ivoire
 */
export function isWithinCoteIvoire(lat: number, lon: number): boolean {
  return (
    lat >= COTE_IVOIRE_BOUNDS.minLat &&
    lat <= COTE_IVOIRE_BOUNDS.maxLat &&
    lon >= COTE_IVOIRE_BOUNDS.minLon &&
    lon <= COTE_IVOIRE_BOUNDS.maxLon
  );
}

/**
 * Valide et corrige des coordonnées pour qu'elles soient dans les limites
 */
export function clampToCoteIvoire(lat: number, lon: number): { lat: number; lon: number } {
  return {
    lat: Math.max(COTE_IVOIRE_BOUNDS.minLat, Math.min(COTE_IVOIRE_BOUNDS.maxLat, lat)),
    lon: Math.max(COTE_IVOIRE_BOUNDS.minLon, Math.min(COTE_IVOIRE_BOUNDS.maxLon, lon)),
  };
}

/**
 * Projection géographique : Lat/Lon → Coordonnées écran
 * Utilisée pour afficher le graphe géographiquement fidèle
 */
export function projectGeoToScreen(
  lat: number,
  lon: number,
  screenWidth: number,
  screenHeight: number,
  margin: number = 50
): { x: number; y: number } {
  const usableWidth = screenWidth - (2 * margin);
  const usableHeight = screenHeight - (2 * margin);

  // Normaliser entre 0 et 1
  const normalizedX = (lon - COTE_IVOIRE_BOUNDS.minLon) / 
                      (COTE_IVOIRE_BOUNDS.maxLon - COTE_IVOIRE_BOUNDS.minLon);
  const normalizedY = (lat - COTE_IVOIRE_BOUNDS.minLat) / 
                      (COTE_IVOIRE_BOUNDS.maxLat - COTE_IVOIRE_BOUNDS.minLat);

  // Inverser Y (écran va de haut en bas, latitude de bas en haut)
  const screenX = margin + (normalizedX * usableWidth);
  const screenY = margin + ((1 - normalizedY) * usableHeight);

  return { x: screenX, y: screenY };
}

/**
 * Projection inverse : Coordonnées écran → Lat/Lon
 */
export function projectScreenToGeo(
  x: number,
  y: number,
  screenWidth: number,
  screenHeight: number,
  margin: number = 50
): { lat: number; lon: number } {
  const usableWidth = screenWidth - (2 * margin);
  const usableHeight = screenHeight - (2 * margin);

  const normalizedX = (x - margin) / usableWidth;
  const normalizedY = (y - margin) / usableHeight;

  const lon = COTE_IVOIRE_BOUNDS.minLon + 
              (normalizedX * (COTE_IVOIRE_BOUNDS.maxLon - COTE_IVOIRE_BOUNDS.minLon));
  const lat = COTE_IVOIRE_BOUNDS.minLat + 
              ((1 - normalizedY) * (COTE_IVOIRE_BOUNDS.maxLat - COTE_IVOIRE_BOUNDS.minLat));

  return { lat, lon };
}

/**
 * Trouve la ville la plus proche de coordonnées données
 */
export function findNearestCity(lat: number, lon: number): {
  city: string;
  distance: number;
} {
  let nearestCity = 'Abidjan';
  let minDistance = Infinity;

  Object.entries(MAJOR_CITIES).forEach(([cityName, coords]) => {
    // Distance euclidienne simple (suffisant pour proximité)
    const distance = Math.sqrt(
      Math.pow(coords.lat - lat, 2) + 
      Math.pow(coords.lon - lon, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = cityName;
    }
  });

  return { city: nearestCity, distance: minDistance };
}

/**
 * Génère une position aléatoire autour d'une ville
 * avec un rayon donné (en degrés décimaux)
 */
export function generateRandomPositionNearCity(
  cityName: keyof typeof MAJOR_CITIES,
  radiusKm: number = 5
): { lat: number; lon: number } {
  const city = MAJOR_CITIES[cityName];
  if (!city) {
    throw new Error(`Ville inconnue: ${cityName}`);
  }

  // 1 degré ≈ 111 km à l'équateur
  // Pour la Côte d'Ivoire (5-10° lat), c'est suffisamment précis
  const radiusDeg = radiusKm / 111;

  // Position aléatoire dans un cercle
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDeg;

  const lat = city.lat + (distance * Math.cos(angle));
  const lon = city.lon + (distance * Math.sin(angle));

  // Vérifier que c'est toujours en Côte d'Ivoire
  return clampToCoteIvoire(lat, lon);
}

/**
 * Distance en kilomètres entre deux points (formule simplifiée)
 */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}
