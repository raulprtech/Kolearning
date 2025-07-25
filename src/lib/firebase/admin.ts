import { getApps, initializeApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

// Helper function to decode base64
const decodeBase64 = (base64: string): string => Buffer.from(base64, 'base64').toString('utf-8');

try {
  if (!getApps().length) {
    let serviceAccount: ServiceAccount | undefined;

    if (process.env.FIREBASE_ADMIN_CONFIG) {
      // Production: Use base64 encoded service account from a single env var
      const decodedConfig = decodeBase64(process.env.FIREBASE_ADMIN_CONFIG);
      serviceAccount = JSON.parse(decodedConfig);
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
      // Staging/Dev: Use individual env vars
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

    if (serviceAccount && serviceAccount.projectId) {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      console.warn(
        'Firebase Admin credentials not found. Initializing with default for local development. This will not work in production without credentials.'
      );
      // This will only work if Application Default Credentials are set up, e.g. locally.
      app = initializeApp();
    }
  } else {
    app = getApps()[0];
  }
} catch (e: any) {
  console.error("Critical: Could not initialize Firebase Admin SDK. Error: " + e.message);
  // Assign a dummy app to prevent the app from crashing on subsequent calls
  // This ensures that `adminAuth` and `adminDb` are just undefined.
  app = {} as App;
}


const adminAuth = app.name ? getAuth(app) : undefined;
const adminDb = app.name ? getFirestore(app) : undefined;

export { adminAuth, adminDb };
