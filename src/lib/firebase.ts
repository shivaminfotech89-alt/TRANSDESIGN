/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * CLAUDE.md: tendermaster-ai hosts other apps' data in its default
 * Firestore database, this app's data lives entirely in a named one --
 * functions/src/admin.ts already gets this right on the server side
 * (getFirestore(app, DATABASE_ID)). This was the one place that didn't:
 * getFirestore(app) with no second argument targets (default), which does
 * not exist for this app, in every browser this client code ever runs in,
 * local or deployed, regardless of whether the VITE_FIREBASE_* env vars
 * are correct.
 */
const DATABASE_ID = "ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, DATABASE_ID);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Visible, not silent: which project and which database this build is
// actually talking to. undefined here means the VITE_FIREBASE_* variables
// are not reaching the bundle -- see BUILD-GUIDE.md's Vercel note.
// eslint-disable-next-line no-console
console.log('[firebase] projectId =', firebaseConfig.projectId, ' databaseId =', DATABASE_ID);
