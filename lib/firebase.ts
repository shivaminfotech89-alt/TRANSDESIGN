/// <reference types="vite/client" />
/**
 * Firebase client. The config values below are public by design — they identify
 * the project, they do not authorise anything. All access control lives in
 * firestore.rules. Never put a service-account key in this file.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// tendermaster-ai hosts other AI-Studio apps in the same project, each in its
// own named Firestore database -- this one is not the project's default. See
// firebase.json (firestore.database) and CLAUDE.md. Every Firestore access
// in this app must go through this `db`, never a bare getFirestore(app).
const DATABASE_ID = "ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846";

export const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(config);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app, DATABASE_ID);
export const storage: FirebaseStorage = getStorage(app);
