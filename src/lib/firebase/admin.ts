'server-only';

import { getApps, initializeApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

const serviceAccount = {
    projectId: process.env.GOOGLE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (!getApps().length) {
    try {
        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            // This is for local development without env vars
            app = initializeApp();
        }
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
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
