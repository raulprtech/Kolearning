'use only';

import { getApps, initializeApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

const serviceAccount: ServiceAccount | undefined = process.env.GOOGLE_PRIVATE_KEY ? {
    projectId: process.env.GOOGLE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
} : undefined;


if (!getApps().length) {
  if (serviceAccount) {
    app = initializeApp({
        credential: cert(serviceAccount)
    });
  } else {
    // This is the recommended way for environments like Cloud Run and other GCP services if GOOGLE_APPLICATION_CREDENTIALS is set
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
