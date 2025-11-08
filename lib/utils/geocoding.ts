/**
 * Utilitaire de géocodage inverse pour la Côte d'Ivoire
 * Utilise le fichier GADM41_CIV_3.json pour localiser automatiquement les signalements
 */

import * as turf from '@turf/turf';

// Le fichier sera chargé dynamiquement côté client
let gadmData: any = null;

/**
 * Interface pour les informations administratives
 */
export interface LocationInfo {
  isInCoteDIvoire: boolean;
  commune?: string;      // NAME_3 (ex: "Cocody", "Yopougon")
  departement?: string;  // NAME_2 (ex: "Abidjan")
  region?: string;       // NAME_1 (ex: "Abidjan")
  gid3?: string;         // Identifiant unique GADM niveau 3
  coordinates: {
    lat: number;
    lon: number;
  };
}

/**
 * Cache pour optimiser les performances
 */
let featureCache: any[] | null = null;

/**
 * Charge le fichier GeoJSON
 */
async function loadGeoJSON() {
  if (!gadmData) {
    const response = await fetch('/gadm41_CIV_3.json');
    gadmData = await response.json();
  }
  return gadmData;
}

/**
 * Initialise le cache des features GeoJSON
 */
async function initializeCache() {
  if (!featureCache) {
    const data = await loadGeoJSON();
    featureCache = data.features;
  }
  return featureCache;
}

/**
 * Localise un point GPS dans les limites administratives de la Côte d'Ivoire
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @returns Informations sur la localisation (région, département, commune)
 */
export async function reverseGeocode(lat: number, lon: number): Promise<LocationInfo> {
  const features = await initializeCache();
  const point = turf.point([lon, lat]); // Turf utilise [lon, lat]

  // Chercher dans quel polygone se trouve le point
  for (const feature of features || []) {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      const isInside = turf.booleanPointInPolygon(point, feature as any);
      
      if (isInside) {
        const props = feature.properties as any;
        return {
          isInCoteDIvoire: true,
          commune: props.NAME_3 || undefined,
          departement: props.NAME_2 || undefined,
          region: props.NAME_1 || undefined,
          gid3: props.GID_3 || undefined,
          coordinates: { lat, lon },
        };
      }
    }
  }

  // Point hors de la Côte d'Ivoire
  return {
    isInCoteDIvoire: false,
    coordinates: { lat, lon },
  };
}

/**
 * Obtient les frontières (bounding box) de la Côte d'Ivoire
 * Utile pour restreindre la carte à la zone exacte
 */
export async function getCoteDIvoireBounds(): Promise<[[number, number], [number, number]]> {
  const features = await initializeCache();
  
  // Calculer le bounding box de toutes les features
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  (features || []).forEach((feature: any) => {
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates[0].forEach((coord: number[]) => {
        const [lon, lat] = coord;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
      });
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon[0].forEach((coord: number[]) => {
          const [lon, lat] = coord;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
        });
      });
    }
  });

  return [
    [minLat, minLon], // Sud-Ouest
    [maxLat, maxLon], // Nord-Est
  ];
}

/**
 * Obtient la géométrie GeoJSON complète de la Côte d'Ivoire
 * Utile pour afficher les frontières sur la carte
 */
export async function getCoteDIvoireGeometry() {
  return await loadGeoJSON();
}

/**
 * Liste toutes les communes uniques
 */
export async function getAllCommunes(): Promise<string[]> {
  const features = await initializeCache();
  const communes = new Set<string>();
  
  (features || []).forEach((feature: any) => {
    const name = feature.properties?.NAME_3;
    if (name) communes.add(name);
  });
  
  return Array.from(communes).sort();
}

/**
 * Liste tous les départements uniques
 */
export async function getAllDepartements(): Promise<string[]> {
  const features = await initializeCache();
  const departements = new Set<string>();
  
  (features || []).forEach((feature: any) => {
    const name = feature.properties?.NAME_2;
    if (name) departements.add(name);
  });
  
  return Array.from(departements).sort();
}

/**
 * Liste toutes les régions uniques
 */
export async function getAllRegions(): Promise<string[]> {
  const features = await initializeCache();
  const regions = new Set<string>();
  
  (features || []).forEach((feature: any) => {
    const name = feature.properties?.NAME_1;
    if (name) regions.add(name);
  });
  
  return Array.from(regions).sort();
}
