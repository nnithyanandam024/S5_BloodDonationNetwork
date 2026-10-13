import path from 'path';
import fs from 'fs';

/**
 * Firebase Admin Configuration & Initialization
 * Automatically loads service account from JSON or environment variables.
 * Uses lazy loading to ensure compatibility with Jest test suites.
 */

export interface FirebaseConfig {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
  databaseUrl?: string;
  isConfigured: boolean;
}

const findServiceAccountFile = (): string | null => {
  const explicitPaths = [
    path.resolve(__dirname, '../../credentials/firebase-service-account.json'),
    path.resolve(process.cwd(), 'credentials/firebase-service-account.json'),
    path.resolve(process.cwd(), 'firebase-service-account.json'),
  ];

  for (const explicitPath of explicitPaths) {
    if (fs.existsSync(explicitPath)) {
      return explicitPath;
    }
  }

  const searchDirs = [
    path.resolve(__dirname, '../../credentials'),
    path.resolve(process.cwd(), 'credentials'),
    path.resolve(__dirname, '../../'),
    path.resolve(__dirname, '../..'),
    process.cwd(),
  ];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (
          file.endsWith('.json') &&
          (file.includes('firebase-adminsdk') ||
            file.includes('serviceAccount') ||
            file === 'serviceAccountKey.json' ||
            file === 'firebase-service-account.json')
        ) {
          return path.join(dir, file);
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
};

const serviceAccountPath = findServiceAccountFile();

export const firebaseConfig: FirebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || (serviceAccountPath ? 's5-bloodlink' : 'bloodlink-afgc-default'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  databaseUrl: process.env.FIREBASE_DATABASE_URL,
  isConfigured: Boolean(serviceAccountPath || (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY)),
};

let cachedApp: any = null;

export const initializeFirebase = (): { initialized: boolean; message: string; app?: any } => {
  try {
    const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');

    if (getApps().length > 0) {
      cachedApp = getApp();
      return {
        initialized: true,
        message: `Firebase already initialized for project: ${cachedApp.options.projectId}`,
        app: cachedApp,
      };
    }

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      cachedApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      return {
        initialized: true,
        message: `Firebase Admin initialized from ${path.basename(serviceAccountPath)} (project: ${serviceAccount.project_id})`,
        app: cachedApp,
      };
    }

    if (firebaseConfig.isConfigured) {
      cachedApp = initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      });
      return {
        initialized: true,
        message: `Firebase Admin initialized from env vars (project: ${firebaseConfig.projectId})`,
        app: cachedApp,
      };
    }

    return {
      initialized: false,
      message: 'Firebase credentials not supplied; Firebase Admin features running in mock/offline mode.',
    };
  } catch (error: any) {
    console.error('[Firebase] Initialization error:', error.message);
    return {
      initialized: false,
      message: `Firebase initialization failed: ${error.message}`,
    };
  }
};

export const getFirebaseAuth = (): any => {
  try {
    const { getApps } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');

    if (!cachedApp && getApps().length === 0) {
      const res = initializeFirebase();
      if (!res.initialized) return null;
    }
    return getAuth();
  } catch (err: any) {
    console.error('[Firebase] Failed to load Firebase Auth module:', err.message);
    return null;
  }
};
