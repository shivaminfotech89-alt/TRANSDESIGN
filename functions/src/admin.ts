import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

/**
 * CLAUDE.md: tendermaster-ai hosts other apps' data in its default Firestore
 * database, this app's data lives entirely in a named one. Unlike client
 * Storage Security Rules (storage.rules -- firestore.get()/exists() there
 * can only ever see (default), a real, current Firebase platform limit, not
 * a bug in the rules syntax), the Admin SDK can target a named database
 * directly, so every server-side read/write in this functions package must
 * go through this `db`, never admin.firestore() bare.
 */
const DATABASE_ID = "ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846";

const app = getApps().length ? getApps()[0] : initializeApp();

export const db = getFirestore(app, DATABASE_ID);
export const auth = getAuth(app);
export const storage = getStorage(app);
