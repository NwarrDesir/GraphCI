import { Timestamp } from 'firebase/firestore';

/**
 * Type représentant un utilisateur consolidé
 */
export interface Vendor {
  id: string;
  lat: number;
  lon: number;
  product: string;
  name?: string;
  signalements: number;
  first_seen: Timestamp | Date;
  last_seen: Timestamp | Date;
  city: string;
}

/**
 * Type représentant un signalement brut d'un utilisateur
 */
export interface Report {
  id: string;
  lat: number;
  lon: number;
  product: string;
  vendor_name?: string;
  city: string;
  timestamp: Timestamp | Date;
  user_id: string;
}

/**
 * Liste des produits disponibles
 */
export const PRODUCTS = [
  'garba',
  'pain',
  'fruits',
  'eau',
  'riz',
  'attiéké',
  'alloco',
  'poulet_braisé',
  'poisson_braisé',
  'arachides',
  'bananes_plantain',
  'légumes',
  'vêtements',
  'chaussures',
  'téléphones',
  'autre',
] as const;

export type Product = typeof PRODUCTS[number];

/**
 * Couleurs associées aux produits pour le graphe
 */
export const PRODUCT_COLORS: Record<Product, string> = {
  garba: '#FF6B6B',
  pain: '#FFD93D',
  fruits: '#6BCF7F',
  eau: '#4ECDC4',
  attiéké: '#95E1D3',
  alloco: '#F38181',
  poulet_braisé: '#AA96DA',
  poisson_braisé: '#FCBAD3',
  arachides: '#FFFFD2',
  bananes_plantain: '#A8D8EA',
  légumes: '#7FCD91',
  riz: '#F4A261',
  vêtements: '#A8E6CF',
  chaussures: '#DCEDC1',
  téléphones: '#FFD3B6',
  autre: '#B8B8B8',
};

/**
 * Villes principales de Côte d'Ivoire
 */
export const CITIES = [
  'Abidjan',
  'Bouaké',
  'Daloa',
  'Yamoussoukro',
  'Korhogo',
  'San-Pédro',
  'Man',
  'Gagnoa',
  'Divo',
  'Abengourou',
] as const;

export type CityName = typeof CITIES[number];

/**
 * Type pour les filtres de l'application
 */
export interface Filters {
  city?: string;
  product?: Product;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================
// NOUVEAUX TYPES POUR RÉSEAU SOCIAL CI
// ============================================

/**
 * Utilisateur du réseau social
 */
export interface User {
  id: string; // Firebase Auth UID
  idUnique: string; // Format: CI-XXXX-YYYY (ID public)
  displayName?: string; // Nom affiché (optionnel, peut être anonyme)
  email?: string;
  photoURL?: string;
  
  // Localisation
  lat: number;
  lon: number;
  commune?: string;
  departement?: string;
  region?: string;
  
  // Informations personnelles (optionnelles)
  age?: number;
  nationality: string; // Nationalité (ex: "Ivoirien", "Français", "Burkinabé")
  bio?: string;
  
  // Paramètres de confidentialité
  showRealName: boolean; // Afficher le vrai nom ou juste l'ID unique
  showLocation: boolean; // Afficher la localisation exacte ou juste la région
  
  // Tests d'amitié (optionnel)
  friendshipTestId?: string; // ID du test si l'utilisateur en a créé un
  
  // Métadonnées
  createdAt: Timestamp | Date;
  lastActive: Timestamp | Date;
  friendCount: number; // Nombre d'amis (dénormalisé pour perf)
}

/**
 * Lien d'amitié entre deux utilisateurs
 */
export interface Friendship {
  id: string;
  userId1: string; // Toujours le plus petit ID alphabétiquement
  userId2: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Timestamp | Date;
  acceptedAt?: Timestamp | Date;
}

/**
 * Code temporaire pour ajouter un ami
 */
export interface FriendCode {
  id: string;
  code: string; // 6 chiffres (ex: "483729")
  userId: string; // Propriétaire du code
  expiresAt: Timestamp | Date; // Expire après 120 secondes
  used: boolean; // Marqué true après utilisation
  usedBy?: string; // ID de l'utilisateur qui a scanné le code
  usedAt?: Timestamp | Date;
}

/**
 * Message entre deux amis
 */
export interface Message {
  id: string;
  from: string; // userId de l'expéditeur
  to: string; // userId du destinataire
  text: string;
  timestamp: Timestamp | Date;
  read: boolean;
}

/**
 * Conversation (pour optimiser les requêtes)
 */
export interface Conversation {
  id: string; // Format: "{userId1}_{userId2}" (toujours ordre alphabétique)
  participants: [string, string]; // [userId1, userId2]
  lastMessage?: string;
  lastMessageTime?: Timestamp | Date;
  lastMessageBy?: string; // userId du dernier émetteur
  unreadCount: { [userId: string]: number }; // Messages non lus par utilisateur
  isActive?: boolean; // Conversation active dans les 30 dernières secondes (pour animation graphe)
}

/**
 * Types de questions pour les tests d'affinité
 */
export type AffinityQuestionType = 'qcm' | 'vrai-faux' | 'ouverte';

/**
 * Question d'un test d'affinité
 */
export interface AffinityQuestion {
  id: string;
  type: AffinityQuestionType;
  question: string;
  order: number; // Ordre d'affichage
  
  // Pour QCM
  options?: string[]; // Options de réponse (A, B, C, D...)
  correctAnswerIndex?: number; // Index de la bonne réponse (0-based)
  
  // Pour Vrai/Faux
  correctAnswer?: boolean; // true ou false
  
  // Pour question ouverte - pas de correctAnswer, validation manuelle
  // Le créateur verra la réponse et décidera
}

/**
 * Réponse à une question
 */
export interface AffinityAnswer {
  questionId: string;
  questionType: AffinityQuestionType;
  
  // Réponse de l'utilisateur
  answerIndex?: number; // Pour QCM
  answerBoolean?: boolean; // Pour Vrai/Faux
  answerText?: string; // Pour question ouverte
  
  // Évaluation
  isCorrect?: boolean; // null pour questions ouvertes (en attente validation)
}

/**
 * Test d'affinité créé par un utilisateur
 */
export interface AffinityTest {
  id: string;
  userId: string; // Créateur du test
  title: string; // Titre du test (ex: "On se ressemble ?")
  description?: string; // Instructions
  
  questions: AffinityQuestion[];
  
  // Critères de validation
  minimumScore: number; // Score minimum requis (0-100) pour les questions auto
  hasOpenQuestions: boolean; // true si contient au moins une question ouverte
  
  // Métadonnées
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  isActive: boolean; // Actif ou désactivé
  
  // Stats
  totalAttempts: number;
  totalSuccess: number;
  totalPending: number; // Questions ouvertes en attente
}

/**
 * Demande d'amitié basée sur le test d'affinité
 */
export interface AffinityFriendRequest {
  id: string;
  
  // Participants
  from: string; // Utilisateur qui demande en ami
  to: string; // Utilisateur qui reçoit la demande
  
  // Test
  testId: string; // ID du test d'affinité
  answers: AffinityAnswer[]; // Réponses données
  
  // Évaluation automatique
  autoScore?: number; // Score des questions auto (QCM + Vrai/Faux) 0-100
  autoScorePassed?: boolean; // true si score >= minimumScore
  
  // Évaluation manuelle (si questions ouvertes)
  needsManualReview: boolean; // true si contient questions ouvertes
  manualReviewCompleted: boolean; // true si le créateur a validé
  manualReviewDecision?: 'approved' | 'rejected'; // Décision du créateur
  manualReviewComment?: string; // Commentaire optionnel du créateur
  
  // Statut global
  status: 'pending' | 'auto-approved' | 'manual-review' | 'approved' | 'rejected';
  
  // Dates
  createdAt: Timestamp | Date;
  reviewedAt?: Timestamp | Date; // Date de validation manuelle
  approvedAt?: Timestamp | Date; // Date d'approbation finale
}

/**
 * Blocage temporaire après échec (2 semaines)
 */
export interface AffinityRequestBlock {
  id: string;
  from: string; // Utilisateur bloqué
  to: string; // Utilisateur ciblé
  testId: string; // Test échoué
  blockedUntil: Timestamp | Date; // Date de déblocage (createdAt + 14 jours)
  createdAt: Timestamp | Date;
  reason: 'failed-auto' | 'rejected-manual'; // Score insuffisant ou rejet manuel
}

/**
 * Notification d'affinité
 */
export interface AffinityNotification {
  id: string;
  userId: string; // Destinataire
  type: 'new-request' | 'manual-review-needed' | 'request-approved' | 'request-rejected' | 'friendship-created';
  
  // Données contextuelles
  requestId: string; // ID de la demande concernée
  fromUserId?: string; // Utilisateur source (pour new-request)
  
  // Contenu
  title: string;
  message: string;
  
  // État
  read: boolean;
  createdAt: Timestamp | Date;
}
