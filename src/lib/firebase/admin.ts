'server-only';

import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  // Initialize without credentials.
  // This is the recommended way for environments like Cloud Run and other GCP services.
  app = initializeApp();
} else {
  app = getApps()[0];
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
