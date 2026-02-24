import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase - Usar Variables de Entorno en producción
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "fallback-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fallback-domain",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fallback-id",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fallback-bucket",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "fallback-sender",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "fallback-app"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
