import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Configuration is supplied through VITE_FIREBASE_* environment variables.
// This keeps the build independent of the gitignored local Firebase JSON file.
const finalConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gaspoint-kenya',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:489292398924:web:244f89a3c5ca0f7dfc8fe9',
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyDvWy_MMiGZSGFcKkYJSb2dknKIVRJh6pM',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'gaspoint-kenya.firebaseapp.com',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'gaspoint-kenya.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '489292398924',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const app = getApps().length === 0 ? initializeApp(finalConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
