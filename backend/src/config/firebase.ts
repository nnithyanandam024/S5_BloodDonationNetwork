/**
 * Firebase Admin & Cloud Firestore Configuration Stub
 * Provides structured configuration for production migration to Cloud Firestore and Firebase Cloud Messaging (FCM).
 */

export interface FirebaseConfig {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
  databaseUrl?: string;
  isConfigured: boolean;
}

export const firebaseConfig: FirebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'bloodlink-afgc-default',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  databaseUrl: process.env.FIREBASE_DATABASE_URL,
  isConfigured: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY),
};

export const initializeFirebase = (): { initialized: boolean; message: string } => {
  if (!firebaseConfig.isConfigured) {
    return {
      initialized: false,
      message: 'Firebase credentials not supplied; backend operating in-memory repository mode.',
    };
  }

  // When production credentials exist: admin.initializeApp(...)
  return {
    initialized: true,
    message: `Firebase initialized for project: ${firebaseConfig.projectId}`,
  };
};
