'server-only';

import { getApps, initializeApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || ''),
};

if (!getApps().length) {
    try {
        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            console.warn("Firebase Admin credentials not found, initializing with default for local dev.");
            app = initializeApp();
        }
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error);
        // Fallback for local development if env vars are partially set but invalid
        if (!getApps().length) {
          app = initializeApp();
        } else {
          app = getApps()[0];
        }
    }
} else {
    app = getApps()[0];
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
