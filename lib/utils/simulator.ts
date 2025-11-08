/**
 * Simulateur de signalements de vendeurs
 * Utilise des coordonnées GPS RÉELLES et VALIDÉES de la Côte d'Ivoire
 */

import { PRODUCTS, CITIES, Product } from '@/lib/types';
import { 
  MAJOR_CITIES, 
  generateRandomPositionNearCity, 
  isWithinCoteIvoire,
  clampToCoteIvoire 
} from './geography';

// Coordonnées PRÉCISES des villes avec leurs régions
// Ces coordonnées sont RÉELLES et ont été vérifiées sur OpenStreetMap
const CITY_COORDINATES: Record<string, { lat: number; lon: number; radius: number }> = {
  'Abidjan': { lat: 5.3600, lon: -4.0083, radius: 0.05 },      // ~5km - Capitale économique (SUD)
  'Bouaké': { lat: 7.6900, lon: -5.0300, radius: 0.03 },       // ~3km - 2ème ville (CENTRE)
  'Daloa': { lat: 6.8772, lon: -6.4503, radius: 0.02 },        // ~2km - Centre-Ouest
  'Yamoussoukro': { lat: 6.8184, lon: -5.2755, radius: 0.03 }, // ~3km - Capitale politique (CENTRE)
  'San-Pédro': { lat: 4.7487, lon: -6.6364, radius: 0.02 },    // ~2km - Port ouest (SUD-OUEST)
  'Korhogo': { lat: 9.4581, lon: -5.6296, radius: 0.02 },      // ~2km - Grande ville (NORD)
  'Man': { lat: 7.4125, lon: -7.5544, radius: 0.02 },          // ~2km - Montagnes (OUEST)
  'Gagnoa': { lat: 6.1319, lon: -5.9506, radius: 0.02 },       // ~2km - Centre-Ouest
  'Divo': { lat: 5.8372, lon: -5.3572, radius: 0.02 },         // ~2km - Route Abidjan-San Pedro
  'Abengourou': { lat: 6.7294, lon: -3.4961, radius: 0.02 },   // ~2km - Est, près Ghana
};

// Noms de vendeurs typiques ivoiriens
const VENDOR_NAMES = [
  'Tante Marie',
  'Amadou',
  'Fatou',
  'Kouassi',
  'Adjoua',
  'Yao',
  'Akissi',
  'Kouamé',
  'Aya',
  'Bamba',
  'Affoué',
  'N\'Guessan',
  'Mariam',
  'Koffi',
  'Assita',
];

/**
 * Génère une coordonnée GPS aléatoire dans une ville donnée
 * GARANTIT que les coordonnées sont dans le territoire ivoirien
 */
export function generateRandomCoordinates(city: string): { lat: number; lon: number } {
  const cityData = CITY_COORDINATES[city];
  if (!cityData) {
    throw new Error(`Ville inconnue: ${city}`);
  }

  // Génère un point aléatoire dans le rayon de la ville
  const randomOffset = () => (Math.random() - 0.5) * 2 * cityData.radius;

  const lat = cityData.lat + randomOffset();
  const lon = cityData.lon + randomOffset();

  // Validation stricte : s'assurer que c'est bien en Côte d'Ivoire
  if (!isWithinCoteIvoire(lat, lon)) {
    // Si hors limites, corriger pour rester dans le territoire
    return clampToCoteIvoire(lat, lon);
  }

  return { lat, lon };
}

/**
 * Génère un nom de vendeur aléatoire (50% de chance d'avoir un nom)
 */
export function generateRandomVendorName(): string | undefined {
  if (Math.random() < 0.5) {
    return VENDOR_NAMES[Math.floor(Math.random() * VENDOR_NAMES.length)];
  }
  return undefined;
}

/**
 * Génère un produit aléatoire
 */
export function generateRandomProduct(): Product {
  return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)] as Product;
}

/**
 * Génère une ville aléatoire
 */
export function generateRandomCity(): string {
  return CITIES[Math.floor(Math.random() * CITIES.length)];
}

/**
 * Génère un signalement complet aléatoire
 */
export interface SimulatedReport {
  lat: number;
  lon: number;
  product: Product;
  vendor_name?: string;
  city: string;
}

export function generateRandomReport(city?: string): SimulatedReport {
  const selectedCity = city || generateRandomCity();
  const coords = generateRandomCoordinates(selectedCity);

  return {
    lat: coords.lat,
    lon: coords.lon,
    product: generateRandomProduct(),
    vendor_name: generateRandomVendorName(),
    city: selectedCity,
  };
}

/**
 * Génère plusieurs signalements aléatoires
 */
export function generateMultipleReports(count: number, city?: string): SimulatedReport[] {
  return Array.from({ length: count }, () => generateRandomReport(city));
}

/**
 * Génère un cluster de vendeurs (plusieurs signalements proches)
 * Utile pour tester la fusion automatique à <30m
 */
export function generateCluster(
  city: string,
  product: Product,
  count: number = 3,
  maxDistance: number = 0.0003 // ~30m
): SimulatedReport[] {
  const baseCoords = generateRandomCoordinates(city);
  
  return Array.from({ length: count }, () => ({
    lat: baseCoords.lat + (Math.random() - 0.5) * maxDistance,
    lon: baseCoords.lon + (Math.random() - 0.5) * maxDistance,
    product,
    vendor_name: generateRandomVendorName(),
    city,
  }));
}

/**
 * Données de test prédéfinies pour un scénario réaliste
 */
export function generateTestScenario(): SimulatedReport[] {
  return [
    // Marché d'Adjamé (Abidjan) - Cluster de vendeurs
    ...generateCluster('Abidjan', 'attiéké', 5),
    ...generateCluster('Abidjan', 'poisson_braisé', 3),
    
    // Bouaké - Vendeurs dispersés
    ...generateMultipleReports(8, 'Bouaké'),
    
    // Yamoussoukro - Quelques vendeurs
    ...generateMultipleReports(5, 'Yamoussoukro'),
    
    // Autres villes - Distribution réaliste
    ...generateMultipleReports(15),
  ];
}
