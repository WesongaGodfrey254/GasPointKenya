import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Use environment variables or local configuration safely
const envConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
};

let localConfig: any = {};
try {
  // @ts-ignore
  const imported = await import('../../firebase-applet-config.json');
  localConfig = imported.default || imported;
} catch {
  // file is gitignored
}

const finalConfig = {
  projectId: envConfig.projectId || localConfig.projectId || 'gaspoint-kenya',
  appId: envConfig.appId || localConfig.appId || '1:489292398924:web:244f89a3c5ca0f7dfc8fe9',
  apiKey: envConfig.apiKey || localConfig.apiKey || 'AIzaSyDvWy_MMiGZSGFcKkYJSb2dknKIVRJh6pM',
  authDomain: envConfig.authDomain || localConfig.authDomain || 'gaspoint-kenya.firebaseapp.com',
  storageBucket: envConfig.storageBucket || localConfig.storageBucket || 'gaspoint-kenya.firebasestorage.app',
  messagingSenderId: envConfig.messagingSenderId || localConfig.messagingSenderId || '489292398924',
};

const app = getApps().length === 0 ? initializeApp(finalConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
