/**
 * Firebase Admin SDK Configuration
 * Utilisé pour les API routes Next.js (côté serveur uniquement)
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Configuration Admin SDK avec Service Account
const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp(adminConfig);
} else {
  adminApp = getApps()[0];
}

export const adminDb: Firestore = getFirestore(adminApp);
export const adminAuth: Auth = getAuth(adminApp);

// Aliases pour faciliter les imports
export const db = adminDb;
export const auth = adminAuth;

export default adminApp;
