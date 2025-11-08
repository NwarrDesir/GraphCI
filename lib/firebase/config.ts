import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Configuration Firebase
 * Les variables d'environnement doivent être définies dans .env.local
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialise l'application Firebase
 * Utilise le singleton pattern pour éviter les ré-initialisations
 */
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

/**
 * Instance de Firebase Auth
 */
export const auth: Auth = getAuth(app);

/**
 * Instance de Firestore
 */
export const db: Firestore = getFirestore(app);

/**
 * Noms des collections Firestore
 */
export const COLLECTIONS = {
  REPORTS: 'reports',
  VENDORS: 'vendors',
  STATS: 'stats',
  CITIES: 'cities',
  USERS: 'users',
} as const;

export default app;
