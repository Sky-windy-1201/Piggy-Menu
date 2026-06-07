import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const requiredFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

const firebaseConfig = {
  ...requiredFirebaseConfig,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
} satisfies FirebaseOptions;

export const missingFirebaseEnvKeys = Object.entries(requiredFirebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const hasFirebaseConfig = missingFirebaseEnvKeys.length === 0;
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth: Auth | null = hasFirebaseConfig ? getAuth(firebaseApp) : null;
export const storage: FirebaseStorage | null = hasFirebaseConfig ? getStorage(firebaseApp) : null;
