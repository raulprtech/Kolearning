import { getApps, initializeApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // En un entorno de producción como Vercel, esto debe fallar si las variables no están.
    // Para desarrollo local sin variables, se puede usar el Application Default Credentials.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin credentials are not available. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
    } else {
      console.warn(
        'Firebase Admin credentials not found. Initializing with default for local development. This will not work in production.'
      );
      try {
        app = initializeApp();
      } catch(e) {
        console.error("Could not initialize Firebase Admin SDK. Please make sure you have set up Application Default Credentials. See https://firebase.google.com/docs/admin/setup#initialize-sdk for more details.");
        app = {} as App; // Prevent further errors
      }
    }
  }
} else {
  app = getApps()[0];
}

const adminAuth = app.name ? getAuth(app) : undefined;
const adminDb = app.name ? getFirestore(app) : undefined;

export { adminAuth, adminDb };
