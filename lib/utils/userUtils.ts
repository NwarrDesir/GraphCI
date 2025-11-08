/**
 * Utilitaires pour la gestion des utilisateurs du réseau social CI
 */

/**
 * Génère un ID unique au format CI-XXXX-YYYY
 * Utilise des caractères alphanumériques (A-Z, 0-9) excluant les ambigus (0, O, I, 1)
 * 
 * @returns ID unique (ex: "CI-7K3M-9P2W")
 */
export function generateUniqueId(): string {
  // Caractères sans ambiguïté : 32 caractères (A-Z sauf I,O + 2-9)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  
  const part1 = Array.from({ length: 4 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  
  const part2 = Array.from({ length: 4 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  
  return `CI-${part1}-${part2}`;
}

/**
 * Génère un code ami temporaire à 6 chiffres
 * 
 * @returns Code à 6 chiffres (ex: "483729")
 */
export function generateFriendCode(): string {
  // Génère un nombre entre 100000 et 999999
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

/**
 * Vérifie si un code ami est expiré
 * 
 * @param expiresAt - Date d'expiration du code
 * @returns true si le code est expiré
 */
export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Calcule la date d'expiration (maintenant + 120 secondes)
 * 
 * @returns Date d'expiration
 */
export function getCodeExpirationDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 120 * 1000); // +120 secondes
}

/**
 * Génère l'ID de conversation entre deux utilisateurs
 * Format: "{userId1}_{userId2}" (ordre alphabétique)
 * 
 * @param userId1 - Premier utilisateur
 * @param userId2 - Second utilisateur
 * @returns ID de conversation
 */
export function getConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

/**
 * Génère l'ID de friendship entre deux utilisateurs
 * Format: "{userId1}_{userId2}" (ordre alphabétique)
 * 
 * @param userId1 - Premier utilisateur
 * @param userId2 - Second utilisateur
 * @returns ID de friendship
 */
export function getFriendshipId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

/**
 * Formatte l'affichage d'un utilisateur selon ses paramètres de confidentialité
 * 
 * @param user - Objet utilisateur
 * @returns Nom à afficher
 */
export function getDisplayName(user: { idUnique: string; displayName?: string; showRealName: boolean }): string {
  if (user.showRealName && user.displayName) {
    return user.displayName;
  }
  return user.idUnique;
}

/**
 * Formatte la localisation selon les paramètres de confidentialité
 * 
 * @param user - Objet utilisateur
 * @returns Localisation à afficher
 */
export function getDisplayLocation(user: {
  commune?: string;
  departement?: string;
  region?: string;
  showLocation: boolean;
}): string {
  if (!user.showLocation) {
    return user.region || 'Côte d\'Ivoire';
  }
  
  if (user.commune) {
    return `${user.commune}, ${user.departement}`;
  }
  
  if (user.departement) {
    return `${user.departement}, ${user.region}`;
  }
  
  return user.region || 'Côte d\'Ivoire';
}
