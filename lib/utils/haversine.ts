/**
 * Calcule la distance entre deux points GPS en utilisant la formule de Haversine
 * 
 * @param lat1 - Latitude du premier point (en degrés décimaux)
 * @param lon1 - Longitude du premier point (en degrés décimaux)
 * @param lat2 - Latitude du deuxième point (en degrés décimaux)
 * @param lon2 - Longitude du deuxième point (en degrés décimaux)
 * @returns Distance en mètres entre les deux points
 */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Rayon moyen de la Terre en mètres
  const R = 6371e3;

  // Conversion des degrés en radians
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Formule de Haversine
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance en mètres
  const distance = R * c;

  return distance;
}

/**
 * Vérifie si deux points GPS sont proches l'un de l'autre
 */
export function arePointsNear(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  threshold: number = 30
): boolean {
  const distance = haversine(lat1, lon1, lat2, lon2);
  return distance <= threshold;
}

/**
 * Calcule la distance moyenne entre plusieurs points d'un même produit
 */
export function calculateAverageDistance(
  vendors: Array<{ lat: number; lon: number; product: string }>,
  product?: string
): number {
  const filtered = product
    ? vendors.filter((v) => v.product === product)
    : vendors;

  if (filtered.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  let count = 0;

  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      totalDistance += haversine(
        filtered[i].lat,
        filtered[i].lon,
        filtered[j].lat,
        filtered[j].lon
      );
      count++;
    }
  }

  return count > 0 ? totalDistance / count : 0;
}
